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

const getAccountCredential = async (userId: string, provider?: AIProvider) => {
    const { data: credentials } = await supabaseServer
        .from('account_ai_credentials')
        .select('provider, encrypted_api_key')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    const credential = provider ? credentials?.find(item => item.provider === provider) : credentials?.[0];
    if (!credential) return null;
    return { provider: credential.provider as AIProvider, apiKey: decryptApiKey(credential.encrypted_api_key) };
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
        const { prompt, imageData, imageMimeType, provider, context } = body;

        if (!prompt && !imageData) {
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

        const accountCredential = await getAccountCredential(session.user.id || '', provider);
        const usesPlatformCredential = !accountCredential;

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

        const aiDailyLimit = usesPlatformCredential ? getAIDailyLimitForRole(role) : null;
        if (aiDailyLimit !== null && aiDailyLimit !== undefined && currentCount >= aiDailyLimit) {
            return NextResponse.json(
                { html: '', success: false, error: `Your ${role} plan is limited to ${aiDailyLimit} AI-generated websites per day when using LUNIO's AI key.` },
                { status: 403 }
            );
        }

        // Build the system prompt for Gemini


        let systemPrompt = baseSystemPrompt;
        let hasImage = false;

        if (imageData && imageMimeType) {
            hasImage = true;
            systemPrompt += `

IMAGE REFERENCE:
Analyze the provided image and generate HTML that matches its design, layout, colors, and style.`;
            if (prompt) {
                systemPrompt += `\n\nAlso incorporate this additional requirement: ${prompt}`;
            }
        } else if (prompt) {
            systemPrompt += `\n\nGenerate HTML for: ${prompt}`;
        }
        if (context) {
            systemPrompt += `\n\nSELECTED ELEMENT TO EDIT:\n${context}\n\nReturn the edited replacement fragment only. Preserve the selected element's purpose and improve it according to the user's request.`;
        }

        const selectedProvider = accountCredential?.provider || 'gemini-3.6-flash';
        const providerKey = accountCredential?.apiKey || GEMINI_API_KEY;
        if (hasImage && selectedProvider !== 'gemini-3.6-flash') {
            return NextResponse.json(
                { html: '', success: false, error: 'Reference images are currently supported with Gemini only.' },
                { status: 400 }
            );
        }
        if (!providerKey) {
            return NextResponse.json(
                { html: '', success: false, error: 'Add an AI provider API key in Profile Settings or configure GEMINI_API_KEY.' },
                { status: 500 }
            );
        }

        let response: any;

        if (hasImage && imageData && selectedProvider === 'gemini-3.6-flash') {
            // Use vision API with image
            const imageBase64 = imageData;
            response = await fetch(getGeminiApiUrl(selectedProvider), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': providerKey,
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: systemPrompt,
                                },
                                {
                                    inline_data: {
                                        mime_type: imageMimeType,
                                        data: imageBase64,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0,
                        top_p: 0.95,
                        max_output_tokens: 8192,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Gemini API error:', errorData);
                return NextResponse.json(
                    { html: '', success: false, error: 'Failed to generate content from image' },
                    { status: 500 }
                );
            }

            const jsonResponse = await response.json();
            response = jsonResponse;
        } else {
            const generatedText = await getTextFromProvider(selectedProvider, providerKey, systemPrompt);
            response = { candidates: [{ content: { parts: [{ text: generatedText }] } }] };
        }

        const data = response as any;

        // Extract content from Gemini response
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            return NextResponse.json(
                { html: '', success: false, error: 'Invalid response from Gemini' },
                { status: 500 }
            );
        }

        const generatedContent = data.candidates[0].content.parts[0].text;

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
        } catch (err) {
            console.warn('Unsplash replacement failed:', err);
        }

        if (usesPlatformCredential && aiDailyLimit !== null) {
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
