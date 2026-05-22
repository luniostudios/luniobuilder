import { NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';
import { generateNextProjectFiles } from '@/app/utils/builderUtils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id || session.user.email;

  const body = await request.json();
  const providedToken = body?.token;
  const projectId = body?.projectId;
  const projectName = body?.projectName || 'LUNIO Project';
  const pages = body?.pages;
  const teamId = body?.teamId;

  let token = providedToken;
  if (projectId) {
    const userId = session.user.id || session.user.email;
    if (userId) {
      const { data: project, error: projectError } = await supabaseServer
        .from('projects')
        .select('vercel_token')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (projectError && projectError.code !== 'PGRST116') {
        return NextResponse.json({ error: projectError.message }, { status: 500 });
      }

      if (project?.vercel_token) {
        token = project.vercel_token as string;
      }
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Vercel token is required' }, { status: 400 });
  }

  if (!Array.isArray(pages) || pages.length === 0) {
    return NextResponse.json({ error: 'Pages are required for deployment' }, { status: 400 });
  }

  const files = generateNextProjectFiles(pages, projectName);
  // Sanitize incoming extraCss to remove bundled font URLs that won't work during export
  const extraCss = body?.extraCss;
  const sanitize = (css: any) => {
    if (!css || typeof css !== 'string') return '';
    // remove any @font-face blocks entirely
    css = css.replace(/@font-face\s*[\s\S]*?}/gi, '');
    // remove url(...) references to font files that would be resolved by webpack (woff/woff2/ttf/otf)
    css = css.replace(/url\((['"]?)([^)'"]+\.(?:woff2?|ttf|otf))(?:#[^'"\)]*)?\1\)/gi, '');
    return css;
  };
  const extraCssSanitized = sanitize(extraCss);
  if (extraCssSanitized) {
    let appended = false;
    const preferredPaths = ['app/globals.css', 'styles/globals.css', 'src/builder.css', 'src/index.css'];
    for (const path of preferredPaths) {
      const target = files.find(f => f.path === path);
      if (target) {
        target.content = `${extraCssSanitized}\n\n${target.content}`;
        appended = true;
        break;
      }
    }
    if (!appended) {
      files.push({ path: 'app/globals.css', content: extraCssSanitized });
    }
  }
  const deploymentName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `luniobuilder-${Date.now()}`;

  const deploymentBody: Record<string, unknown> = {
    name: deploymentName,
    target: 'production',
    projectSettings: {
      framework: 'nextjs',
      buildCommand: 'npm run build',
      installCommand: 'npm install',
      outputDirectory: '.next',
    },
    files: files.map(file => ({
      file: file.path,
      data: file.content,
    })),
  };

  if (teamId) {
    deploymentBody.teamId = teamId;
  }

  try {
    const vercelResponse = await fetch('https://api.vercel.com/v13/deployments?skipAutoDetectionConfirmation=1', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentBody),
    });

    let data;
    try {
      data = await vercelResponse.json();
    } catch (parseError) {
      data = { message: await vercelResponse.text() };
    }

    if (!vercelResponse.ok) {
      const errorContent = data?.error ?? data?.message ?? 'Vercel deployment failed';
      const errorMessage = typeof errorContent === 'string'
        ? errorContent
        : JSON.stringify(errorContent);

      return NextResponse.json(
        {
          error: errorMessage,
          details: data,
        },
        { status: vercelResponse.status }
      );
    }

    // Determine the deployed domain (prefer aliases, then alias, then url)
    const domain = (Array.isArray(data?.aliases) && data.aliases.length && data.aliases[0])
      || data?.alias
      || data?.url;
    const fullDomain = domain ? (String(domain).startsWith('http') ? String(domain) : `https://${String(domain)}`) : undefined;

    // Persist the domain in the projects table when projectId is provided
    if (projectId && fullDomain && userId) {
      try {
        const { error: updateError } = await supabaseServer
          .from('projects')
          .update({ vercelUrl: fullDomain })
          .eq('id', projectId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Failed to update project vercelUrl:', updateError.message || updateError);
        }
      } catch (e) {
        console.error('Error updating project vercelUrl:', e);
      }
    }

    return NextResponse.json({ ...data, url: fullDomain });
  } catch (error) {
    console.error('Vercel deployment error:', error);
    return NextResponse.json({ error: 'Unable to deploy to Vercel' }, { status: 500 });
  }
}
