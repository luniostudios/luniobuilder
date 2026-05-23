import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
const MAX_FREE_DAILY_AI = 5;

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
        const baseSystemPrompt = `You are a professional web designer and developer. Generate clean, modern, responsive HTML for website components.

Your response MUST be valid HTML only, with inline styles directly on elements. Do not use CSS classes, external stylesheets, or markdown. Do not include code blocks or explanations.

Components that are allowed to be generated include: buttons, forms, cards, modals, navigation bars, footers, and any other common UI elements.

Guidelines:
- Generate semantic HTML
- Use inline styles only
- Make it responsive and mobile-friendly
- Use modern design practices
- Include accessibility attributes
- Keep it self-contained

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
                        temperature: 1,
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
