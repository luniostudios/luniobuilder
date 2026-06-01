import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
const MAX_FREE_DAILY_AI = 5;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface GenerateRequest {
    prompt: string;
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

        // Validate API key
        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { html: '', success: false, error: 'Gemini API key not configured' },
                { status: 500 }
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
        const baseSystemPrompt = `You are an elite senior web designer, frontend engineer, and UI/UX expert specializing in high-converting, production-ready interfaces. Your task is to generate visually stunning, modern, responsive, and fully self-contained HTML components with exceptional design quality and clean structure.

OUTPUT REQUIREMENTS:

Return ONLY valid HTML.
Do NOT include markdown, code fences, explanations, comments, or additional text.
Do NOT use CSS classes, tags, external stylesheets, frameworks, or JavaScript unless explicitly requested.
ALL styling MUST be written using inline styles directly on each element.
The output MUST be copy-paste ready and fully self-contained.

DESIGN REQUIREMENTS:

Use modern UI/UX best practices inspired by premium SaaS, Apple-level minimalism, Stripe, Linear, Framer, and Webflow-quality design systems.
Create elegant layouts with proper spacing, alignment, visual hierarchy, and balanced typography.
Use modern color palettes, subtle shadows, smooth border radii, and clean composition.
Ensure the design feels premium, polished, and production-ready.
Prioritize readability, accessibility, and responsive behavior across desktop, tablet, and mobile devices.
Use fluid widths, flexible layouts, and mobile-friendly stacking when appropriate.
Use semantic HTML5 elements whenever possible.

ACCESSIBILITY:

Include proper accessibility attributes such as:
aria-label
role
alt
semantic structure
Ensure sufficient color contrast and readable typography.
Buttons, forms, and interactive elements should be accessible and user-friendly.

CODE QUALITY:

Keep the HTML clean, organized, and efficient.
Avoid unnecessary wrapper elements.
Use reusable inline styling patterns consistently.
Maintain professional indentation and formatting.
Ensure compatibility across modern browsers.

VISUAL ENHANCEMENTS:

Add tasteful hover-ready styling where possible using inline techniques.
Use subtle gradients, modern card designs, soft shadows, and clean section separation.
Make components visually engaging without being cluttered.
Create layouts that look realistic and launch-ready.

CONTENT GENERATION:

Generate realistic placeholder content when needed.
Use compelling headings, professional copywriting, and conversion-focused structure.
Include strong CTA sections where appropriate.

FINAL RULE:
Your entire response MUST contain ONLY raw HTML with inline styles and nothing else.

`;

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

        let response: any;

        if (hasImage && imageData) {
            // Use vision API with image
            const imageBase64 = imageData;
            response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_API_KEY || '',
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
            // Use regular text-only generation
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: systemPrompt,
            });
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

        if (role === 'free') {
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
