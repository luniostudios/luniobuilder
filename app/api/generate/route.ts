import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});


interface GenerateRequest {
    prompt: string;
    context?: string;
    elementType?: string;
}

interface GenerateResponse {
    html: string;
    css?: string;
    success: boolean;
    error?: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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
        const { prompt, context = '', elementType = 'section' } = body;

        if (!prompt) {
            return NextResponse.json(
                { html: '', success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Build the system prompt for Gemini
        const systemPrompt = `You are a professional web designer and developer. Generate clean, modern, responsive HTML for website components.

Your response MUST be valid HTML only, with inline styles directly on elements. Do not use CSS classes, external stylesheets, or markdown. Do not include code blocks or explanations.

Guidelines:
- Generate semantic HTML
- Use inline styles only
- Make it responsive and mobile-friendly
- Use modern design practices
- Include accessibility attributes
- Keep it self-contained
- For "${elementType}" element type, design accordingly

Context: ${context}

Generate HTML for: ${prompt}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: systemPrompt,
        });

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
