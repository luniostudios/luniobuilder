import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

const getProduct = async (projectId: string, recordId: string) => {
  const { data: record } = await supabaseServer.from('cms_records').select('id, data, cms_collections!inner(project_id, slug)').eq('id', recordId).eq('cms_collections.project_id', projectId).eq('cms_collections.slug', 'products').maybeSingle();
  return record;
};

const getOrigin = (request: Request) => new URL(request.url).origin;

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await request.json();
  const recordId = String(body.recordId || '');
  const quantity = Math.max(1, Math.min(99, Number(body.quantity) || 1));
  const [{ data: project }, { data: settings }, product] = await Promise.all([
    supabaseServer.from('projects').select('status').eq('id', projectId).maybeSingle(),
    supabaseServer.from('shop_settings').select('*').eq('project_id', projectId).maybeSingle(),
    getProduct(projectId, recordId),
  ]);
  if (!project || project.status !== 'published') return NextResponse.json({ error: 'This shop is not published.' }, { status: 403 });
  if (!settings?.enabled) return NextResponse.json({ error: 'Shop payments are not enabled.' }, { status: 400 });
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  const data = product.data as Record<string, unknown>;
  const name = String(data.name || data.title || 'Product').trim();
  const amount = Math.round(Number(data.price) * 100);
  if (!Number.isFinite(amount) || amount < 1) return NextResponse.json({ error: 'Product price is invalid.' }, { status: 400 });
  const currency = String(settings.currency || 'usd').toLowerCase();
  const successUrl = String(body.successUrl || `${getOrigin(request)}/?shop_success=true`);
  const cancelUrl = String(body.cancelUrl || `${getOrigin(request)}/?shop_canceled=true`);

  if (settings.provider === 'external') {
    const checkoutUrl = String(data.checkout_url || data.checkoutUrl || '').trim();
    if (!checkoutUrl || !/^https?:\/\//i.test(checkoutUrl)) return NextResponse.json({ error: 'Add a valid checkout_url to this product.' }, { status: 400 });
    return NextResponse.json({ url: checkoutUrl });
  }

  if (settings.provider === 'stripe') {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency, product_data: { name, ...(data.image ? { images: [String(data.image)] } : {}) }, unit_amount: amount }, quantity }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { projectId, recordId },
    });
    return NextResponse.json({ url: session.url });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.json({ error: 'PayPal is not configured.' }, { status: 503 });
  const paypalBaseUrl = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) return NextResponse.json({ error: 'Unable to authenticate with PayPal.' }, { status: 502 });
  const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ reference_id: recordId, description: name, amount: { currency_code: currency.toUpperCase(), value: (amount / 100).toFixed(2) }, quantity: String(quantity) }],
      application_context: { return_url: successUrl, cancel_url: cancelUrl, user_action: 'PAY_NOW' },
    }),
  });
  const order = await orderResponse.json();
  const approvalUrl = Array.isArray(order.links) ? order.links.find((link: { rel?: string; href?: string }) => link.rel === 'approve')?.href : null;
  if (!orderResponse.ok || !approvalUrl) return NextResponse.json({ error: 'Unable to create PayPal checkout.' }, { status: 502 });
  return NextResponse.json({ url: approvalUrl });
}