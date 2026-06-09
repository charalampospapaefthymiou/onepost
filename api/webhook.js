export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const parts = sig.split(',').reduce((acc, p) => { const [k, v] = p.split('='); acc[k] = v; return acc; }, {});
    const timestamp = parts.t;
    const sigHash = parts.v1;
    const payload = timestamp + '.' + body;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expected = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))).map(b => b.toString(16).padStart(2, '0')).join('');
    if (expected !== sigHash) return new Response('Invalid signature', { status: 400 });
    event = JSON.parse(body);
  } catch (err) {
    return new Response('Webhook error: ' + err.message, { status: 400 });
  }

  const PRICE_TO_PLAN = {
    [process.env.STRIPE_PRICE_STARTER]: 'starter',
    [process.env.STRIPE_PRICE_PRO]: 'pro',
    [process.env.STRIPE_PRICE_TEAM]: 'team'
  };

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const headers = { Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey, 'Content-Type': 'application/json' };

  async function getUserIdByEmail(email) {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, { headers });
    const data = await res.json();
    return data.users?.[0]?.id;
  }

  async function updatePlan(userId, plan) {
    await fetch(`${supabaseUrl}/rest/v1/usage?user_id=eq.${userId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ plan, count: 0 })
    });
  }

  async function getCustomerEmail(customerId) {
    const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    const cust = await res.json();
    return cust.email;
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const priceId = sub.items?.data?.[0]?.price?.id;
    const plan = PRICE_TO_PLAN[priceId] || 'starter';
    const email = await getCustomerEmail(sub.customer);
    const userId = await getUserIdByEmail(email);
    if (userId) await updatePlan(userId, plan);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const email = await getCustomerEmail(sub.customer);
    const userId = await getUserIdByEmail(email);
    if (userId) await updatePlan(userId, 'trial');
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
}
