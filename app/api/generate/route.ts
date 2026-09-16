import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';
import { AIProvider, decryptApiKey } from '../../lib/aiCredentials';
import { baseSystemPrompt } from './prompt';

const MAX_FREE_DAILY_AI = 5;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface GenerateRequest {
    prompt: string;
    projectId?: string;
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
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const getAccountCredential = async (userId: string) => {
    const { data: credentials } = await supabaseServer
        .from('account_ai_credentials')
        .select('provider, encrypted_api_key')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    const credential = credentials?.[0];
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

    const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }], generationConfig: { temperature: 0.2, top_p: 0.95, max_output_tokens: 8192 } }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Gemini generation failed');
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
        const { prompt, imageData, imageMimeType } = body;

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

        if (role === 'free' && currentCount >= MAX_FREE_DAILY_AI) {
            return NextResponse.json(
                { html: '', success: false, error: `Free users are limited to ${MAX_FREE_DAILY_AI} AI-generated elements per day.` },
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

        const accountCredential = await getAccountCredential(session.user.id || '');
        const provider = accountCredential?.provider || 'gemini';
        const providerKey = accountCredential?.apiKey || GEMINI_API_KEY;
        if (!providerKey) {
            return NextResponse.json(
                { html: '', success: false, error: 'Add an AI provider API key in Project Settings or configure GEMINI_API_KEY.' },
                { status: 500 }
            );
        }

        let response: any;

        if (hasImage && imageData && provider === 'gemini') {
            // Use vision API with image
            const imageBase64 = imageData;
            response = await fetch(GEMINI_API_URL, {
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
            const generatedText = await getTextFromProvider(provider, providerKey, systemPrompt);
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

        if (role === 'free' && !accountCredential) {
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
