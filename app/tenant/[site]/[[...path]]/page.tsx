import { notFound } from 'next/navigation';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { generateCssForPage, renderElementToHtml } from '@/app/utils/builderUtils';
import { Page } from '@/app/types/builder';

export const dynamic = 'force-dynamic';

interface TenantPageProps {
  params: Promise<{ site: string; path?: string[] }>;
}

const getPublishedProject = async (site: string) => {
  const { data, error } = await supabaseServer
    .from('projects')
    .select('title, content, status, site_slug, user_id')
    .eq('site_slug', site)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;

  const { data: user } = await supabaseServer
    .schema('next_auth')
    .from('users')
    .select('role')
    .eq('id', data.user_id)
    .single();

  const role = String(user?.role || 'free').toLowerCase();
  const proRoles = new Set(['pro', 'premium', 'team', 'business', 'admin', 'owner']);

  return {
    ...data,
    showWatermark: !proRoles.has(role),
  } as { title: string; content: { pages?: Page[] }; status: string; site_slug: string; showWatermark: boolean };
};

export async function generateMetadata({ params }: TenantPageProps) {
  const { site, path } = await params;
  const project = await getPublishedProject(site);
  const pages = project?.content?.pages || [];
  const page = pages.find(item => item.slug.replace(/^\//, '') === (path || []).join('/')) || pages[0];

  return {
    title: page?.seo?.title || project?.title || 'Published website',
    description: page?.seo?.description || project?.title || 'Published with LUNIO Builder',
  };
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { site, path } = await params;
  const project = await getPublishedProject(site);
  if (!project) notFound();

  const pages = project.content?.pages || [];
  const requestedPath = (path || []).join('/');
  const page = requestedPath
    ? pages.find(item => item.slug.replace(/^\//, '') === requestedPath)
    : pages[0];

  if (!page) notFound();

  const markup = page.elements.map(element => renderElementToHtml(element)).join('');
  const css = generateCssForPage(page);
  const watermark = project.showWatermark
    ? '<a class="lunio-watermark" href="https://www.luniobuilder.com" target="_blank" rel="noopener noreferrer">Build with LUNIO Builder</a>'
    : '';
  const navigationScript = `(function(){document.addEventListener('click',function(event){var toggle=event.target.closest('[data-lunio-nav-toggle]');if(!toggle)return;var nav=toggle.closest('nav');var menu=nav&&nav.querySelector('[data-lunio-nav-menu]');if(!menu)return;var open=menu.classList.toggle('lunio-nav-open');toggle.setAttribute('aria-expanded',String(open));if(open){menu.style.display='flex';menu.style.position='absolute';menu.style.top='100%';menu.style.left='0';menu.style.right='0';menu.style.flexDirection='column';menu.style.alignItems='stretch';menu.style.gap='12px';menu.style.padding='16px';menu.style.backgroundColor='#fff';menu.style.zIndex='101';}else{menu.style.display='';}});})();`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:system-ui,sans-serif}img{max-width:100%;display:block}.lunio-watermark{position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:8px 12px;border:1px solid rgba(148,163,184,.35);border-radius:6px;background:rgba(15,23,42,.92);color:#f8fafc;font:600 12px/1.2 system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(15,23,42,.2)}.lunio-watermark:hover{background:#2563eb}${css}` }} />
      <main dangerouslySetInnerHTML={{ __html: markup }} />
      <div dangerouslySetInnerHTML={{ __html: watermark }} />
      <script dangerouslySetInnerHTML={{ __html: navigationScript }} />
    </>
  );
}
