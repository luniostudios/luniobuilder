import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';
import { decryptApiKey } from '../../lib/aiCredentials';
import { getAIDailyLimitForRole, getProjectLimitForRole } from '../../lib/projectLimits';
import type { AIProvider } from '../../types/ai';
import { baseSystemPrompt } from './prompt';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface GenerateRequest {
    prompt: string;
    provider?: AIProvider;
    context?: string;
    imageData?: string; // Base64 encoded image
    imageMimeType?: string; // e.g., "image/png", "image/jpeg"
    imageReferences?: Array<{ data: string; mimeType: string }>;
}

interface GenerateResponse {
    html: string;
    css?: string;
    success: boolean;
    error?: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const getGeminiApiUrl = (model: 'gemini-3.6-flash' | 'gemini-pro') =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const VERCEL_AI_API_KEY = process.env.VERCEL_AI_API_KEY;

type ProviderCredential = { provider: AIProvider; apiKey: string; isPlatform: boolean };

const getAccountCredentials = async (userId: string) => {
    const { data: credentials } = await supabaseServer
        .from('account_ai_credentials')
        .select('provider, encrypted_api_key')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    return (credentials || []).map(credential => ({
        provider: credential.provider as AIProvider,
        apiKey: decryptApiKey(credential.encrypted_api_key),
        isPlatform: false,
    })).filter(credential => Boolean(credential.apiKey));
};

const getTextFromProvider = async (provider: AIProvider, apiKey: string, systemPrompt: string) => {
    if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: systemPrompt }], temperature: 0.2 }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || 'OpenAI generation failed');
        return data?.choices?.[0]?.message?.content || '';
    }

    if (provider === 'claude') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-3-5-sonnet-latest', max_tokens: 8192, system: 'Return only the requested HTML.', messages: [{ role: 'user', content: systemPrompt }] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || 'Claude generation failed');
        return data?.content?.[0]?.text || '';
    }

    if (provider === 'groq') {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'user', content: systemPrompt }] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || 'Groq generation failed');
        return data?.choices?.[0]?.message?.content || '';
    }

    if (provider === 'vercel') {
        const response = await fetch('https://api.vercel.com/v2/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${VERCEL_AI_API_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', input: systemPrompt, temperature: 0.2 }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || 'Vercel AI generation failed');
        return data?.output?.[0]?.content || '';
    }

    if (provider === 'gemini-3.6-flash' || provider === 'gemini-pro') {
        const geminiProvider = provider === 'gemini-3.6-flash' ? 'gemini-3.6-flash' : 'gemini-pro';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiProvider}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: systemPrompt }] }], generationConfig: { temperature: 0.2, top_p: 0.95, max_output_tokens: 8192 } }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || 'Gemini generation failed');
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

};

export async function POST(req: NextRequest): Promise<NextResponse<GenerateResponse>> {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { html: '', success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: GenerateRequest = await req.json();
        const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
        const { imageData, imageMimeType, imageReferences: requestedImageReferences, provider, context } = body;
        const imageReferences = requestedImageReferences?.length
            ? requestedImageReferences
            : imageData && imageMimeType
                ? [{ data: imageData, mimeType: imageMimeType }]
                : [];

        if (!prompt && imageReferences.length === 0) {
            return NextResponse.json(
                { html: '', success: false, error: 'Either prompt or image is required' },
                { status: 400 }
            );
        }

        const today = new Date().toISOString().slice(0, 10);
        const { data: user, error: userError } = await supabaseServer
            .schema('next_auth')
            .from('users')
            .select('role, raw_user_meta_data')
            .eq('id', session.user.id || session.user.email)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            return NextResponse.json(
                { html: '', success: false, error: 'Unable to fetch user data' },
                { status: 500 }
            );
        }

        const role = typeof user?.role === 'string' ? user.role.toLowerCase() : 'free';
        const meta = typeof user?.raw_user_meta_data === 'object' && user.raw_user_meta_data !== null ? user.raw_user_meta_data : {};
        const existingUsage = typeof meta.ai_usage === 'object' && meta.ai_usage !== null ? meta.ai_usage : { date: today, count: 0 };
        const currentCount = existingUsage.date === today ? Number(existingUsage.count || 0) : 0;

        const accountCredentials = await getAccountCredentials(session.user.id || '');

        const projectLimit = getProjectLimitForRole(role);
        if (projectLimit !== null) {
            const { count, error: projectCountError } = await supabaseServer
                .from('projects')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', session.user.id || session.user.email);

            if (projectCountError) {
                console.error('Error fetching project count:', projectCountError);
                return NextResponse.json(
                    { html: '', success: false, error: 'Unable to verify project limit' },
                    { status: 500 }
                );
            }

            if (typeof count === 'number' && count >= projectLimit) {
                return NextResponse.json(
                    { html: '', success: false, error: `You have reached the maximum number of projects (${projectLimit}) for your plan.` },
                    { status: 403 }
                );
            }
        }

        const aiDailyLimit = getAIDailyLimitForRole(role);
        if (accountCredentials.length === 0 && aiDailyLimit !== null && aiDailyLimit !== undefined && currentCount >= aiDailyLimit) {
            return NextResponse.json(
                { html: '', success: false, error: `Your ${role} plan is limited to ${aiDailyLimit} AI-generated websites per day when using LUNIO's AI key.` },
                { status: 403 }
            );
        }

        // Build the system prompt for Gemini


        let systemPrompt = baseSystemPrompt;
        const hasImage = imageReferences.length > 0;

        if (hasImage) {
            systemPrompt += `

    IMAGE REFERENCES:
    Analyze all provided images together and generate HTML that matches their shared design language, layout patterns, colors, typography, and visual style. Use each image as a reference and do not ignore any of them.`;
            if (prompt) {
                systemPrompt += `\n\nUSER REQUIREMENTS (implement every item):\n---\n${prompt}\n---`;
            }
        } else if (prompt) {
            systemPrompt += `\n\nUSER REQUIREMENTS (implement every item):\n---\n${prompt}\n---`;
        }
        if (context) {
            systemPrompt += `\n\nSELECTED ELEMENT TO EDIT (preserve its role and improve it):\n---\n${context}\n---\nReturn only the replacement fragment. Keep the same semantic category whenever practical and implement every applicable user requirement in that fragment.`;
        }

        systemPrompt += `\n\nFINAL GENERATION RULE: Complete the implementation before optimizing decoration. Do not return a plan, explanation, TODO, placeholder, or feature description. Return the finished builder-compatible HTML only.`;

        const platformCredential: ProviderCredential | null = GEMINI_API_KEY
            ? { provider: 'gemini-3.6-flash', apiKey: GEMINI_API_KEY, isPlatform: true }
            : null;
        const credentialsByPreference = provider
            ? [...accountCredentials.filter(credential => credential.provider === provider), ...accountCredentials.filter(credential => credential.provider !== provider)]
            : accountCredentials;
        const candidates = [...credentialsByPreference, ...(platformCredential ? [platformCredential] : [])]
            .filter(candidate => !hasImage || candidate.provider === 'gemini-3.6-flash' || candidate.provider === 'gemini-pro')
            .filter(candidate => !candidate.isPlatform || aiDailyLimit === null || currentCount < aiDailyLimit)
            .filter((candidate, index, all) => all.findIndex(item => item.provider === candidate.provider) === index);

        if (candidates.length === 0) {
            return NextResponse.json(
                { html: '', success: false, error: 'Add an AI provider API key in Profile Settings or configure GEMINI_API_KEY.' },
                { status: 500 }
            );
        }

        let generatedContent = '';
        let usedPlatformCredential = false;
        const providerErrors: string[] = [];
        for (const candidate of candidates) {
            try {
                if (hasImage) {
                    const response = await fetch(getGeminiApiUrl(candidate.provider as 'gemini-3.6-flash' | 'gemini-pro'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': candidate.apiKey },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: systemPrompt },
                                    ...imageReferences.map(reference => ({ inline_data: { mime_type: reference.mimeType, data: reference.data } })),
                                ]
                            }],
                            generationConfig: { temperature: 0, top_p: 0.95, max_output_tokens: 8192 },
                        }),
                    });
                    if (!response.ok) throw new Error(`Gemini image request failed (${response.status})`);
                    const data = await response.json();
                    generatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                    generatedContent = await getTextFromProvider(candidate.provider, candidate.apiKey, systemPrompt);
                }
                if (generatedContent.trim()) {
                    usedPlatformCredential = candidate.isPlatform;
                    break;
                }
                throw new Error('The provider returned an empty response');
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown provider error';
                providerErrors.push(`${candidate.provider}: ${message}`);
                console.warn(`AI provider ${candidate.provider} failed; trying the next available provider.`);
            }
        }

        if (!generatedContent.trim()) {
            return NextResponse.json(
                { html: '', success: false, error: `All available AI providers failed. ${providerErrors.join(' | ')}` },
                { status: 502 }
            );
        }

        // Clean up the response (remove markdown code blocks if present)
        let cleanedContent = generatedContent
            .replace(/```html\n?/g, '')
            .replace(/```css\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Helper: fetch a usable Unsplash image URL for the given query.
        async function fetchUnsplashImage(query: string) {
            try {
                if (UNSPLASH_ACCESS_KEY) {
                    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
                    const res = await fetch(url, {
                        headers: {
                            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                        },
                    });
                    if (res.ok) {
                        const j = await res.json();
                        const result = j?.results?.[0];
                        if (result && result.urls) return result.urls.regular || result.urls.full || result.urls.raw;
                    }
                }

                // Fallback to source.unsplash.com (no key required)
                return `https://source.unsplash.com/1600x900/?${encodeURIComponent(query || 'abstract')}`;
            } catch (err) {
                return `https://source.unsplash.com/1600x900/?${encodeURIComponent(query || 'abstract')}`;
            }
        }

        const replaceCmsImagePlaceholders = async (html: string, fallbackQuery: string) => {
            const imageTags = Array.from(html.matchAll(/<img\b[^>]*data-cms-field\s*=\s*["']([^"']+)["'][^>]*>/gi));
            let result = html;
            for (const match of imageTags) {
                const tag = match[0];
                const field = match[1].toLowerCase();
                if (!/(image|photo|thumbnail|avatar|cover|logo)/i.test(field)) continue;
                const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i);
                const currentSrc = srcMatch?.[1]?.trim() || '';
                const isPlaceholder = !currentSrc || /^(#|null|undefined|IMAGE_URL|__IMAGE_URL__)$/i.test(currentSrc) || /example\.com|placeholder\./i.test(currentSrc);
                if (!isPlaceholder) continue;
                const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
                const imageUrl = await fetchUnsplashImage(`${altMatch?.[1] || field} ${fallbackQuery}`);
                result = result.replace(tag, tag.replace(srcMatch?.[0] || '', `src="${imageUrl}"`));
            }
            return result;
        };

        // If the generated HTML likely needs a working image, replace common placeholders with an Unsplash URL.
        try {
            // Determine a query for Unsplash: prefer the user's prompt, else a generic term
            const imageQuery = prompt || 'hero background';
            const unsplashUrl = await fetchUnsplashImage(imageQuery);

            // Replace common placeholder tokens the model might emit
            cleanedContent = cleanedContent
                .replace(/\{\{\s*IMAGE_URL\s*\}\}/gi, unsplashUrl)
                .replace(/__IMAGE_URL__/gi, unsplashUrl)
                .replace(/IMAGE_URL/gi, unsplashUrl);

            // Replace empty or hash image src attributes: src="" or src='#' or src="null"
            cleanedContent = cleanedContent.replace(/(<img[^>]*src=\s*["'])(?:#|''|""|\s*)(["'][^>]*>)/gi, `$1${unsplashUrl}$2`);

            // Replace background-image placeholders like url('') or url("") or url(#)
            cleanedContent = cleanedContent.replace(/background-image\s*:\s*url\((['"]?)(?:#|''|""|\s*)(['"]?)\)/gi, `background-image: url('${unsplashUrl}')`);
            cleanedContent = await replaceCmsImagePlaceholders(cleanedContent, imageQuery);
        } catch (err) {
            console.warn('Unsplash replacement failed:', err);
        }

        if (usedPlatformCredential && aiDailyLimit !== null) {
            const updatedUsage = {
                ...meta,
                ai_usage: {
                    date: existingUsage.date === today ? today : today,
                    count: currentCount + 1,
                },
            };

            const { error: updateError } = await supabaseServer
                .schema('next_auth')
                .from('users')
                .update({ raw_user_meta_data: updatedUsage })
                .eq('id', session.user.id || session.user.email);

            if (updateError) {
                console.error('Error updating AI usage count:', updateError);
                return NextResponse.json(
                    { html: '', success: false, error: 'Unable to update usage count' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            html: cleanedContent,
            success: true,
        });
    } catch (error) {
        console.error('Generation error:', error);
        return NextResponse.json(
            {
                html: '',
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate content',
            },
            { status: 500 }
        );
    }
}
