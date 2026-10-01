import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = String(body.projectId || '').trim();
    const pageId = String(body.pageId || '').trim();
    const formId = String(body.formId || '').trim();
    const fields = body.fields && typeof body.fields === 'object' ? body.fields : {};

    if (!projectId || !formId) {
      return NextResponse.json({ error: 'Missing projectId or formId.' }, { status: 400 });
    }

    const normalizedFields = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [String(key), typeof value === 'string' ? value : String(value ?? '')])
    );

    const { error } = await supabaseServer.from('form_submissions').insert({
      project_id: projectId,
      page_id: pageId || 'unknown',
      form_id: formId,
      fields: normalizedFields,
    });

    if (error) {
      console.error('Unable to store form submission:', error);
      return NextResponse.json({ error: 'Unable to submit form.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Thanks! Your form was submitted successfully.',
    });
  } catch (error) {
    console.error('Form route error:', error);
    return NextResponse.json({ error: 'Unable to submit form.' }, { status: 500 });
  }
}
