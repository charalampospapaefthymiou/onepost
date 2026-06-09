export const config = { runtime: 'edge' };

const PLAN_LIMITS = { trial: 10, starter: 50, pro: Infinity, team: Infinity };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors() });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Auth
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: cors() });

  const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_SERVICE_KEY }
  });
  if (!userRes.ok) return new Response('Unauthorized', { status: 401, headers: cors() });
  const user = await userRes.json();

  // Usage check
  const usageRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${user.id}&select=count,plan`, {
    headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, apikey: process.env.SUPABASE_SERVICE_KEY }
  });
  const usageData = await usageRes.json();
  const usage = usageData[0] || { count: 0, plan: 'trial' };
  const limit = PLAN_LIMITS[usage.plan] ?? 10;

  if (usage.count >= limit) {
    return new Response(JSON.stringify({ error: 'limit_reached', plan: usage.plan, count: usage.count, limit }), {
      status: 429, headers: { ...cors(), 'Content-Type': 'application/json' }
    });
  }

  // Get content
  const { content: inputContent, url } = await req.json();
  if (!inputContent && !url) return new Response('Missing content', { status: 400, headers: cors() });

  const text = inputContent || `Content from URL: ${url}`;

  const platforms = ['twitter', 'linkedin', 'instagram', 'tiktok', 'newsletter'];
  const prompts = {
    twitter: `Turn this into a punchy Twitter/X thread (3-5 tweets). Use line breaks between tweets. Be engaging and conversational. Max 280 chars per tweet.`,
    linkedin: `Rewrite this as a compelling LinkedIn post. Professional but personal. Start with a hook. Include insights. 150-300 words.`,
    instagram: `Create an Instagram caption. Start with a strong hook. Be authentic and engaging. Include 10-15 relevant hashtags at the end.`,
    tiktok: `Write a TikTok video script. Start with a hook in the first 3 seconds. Keep it punchy, trendy, and conversational. 60-90 seconds when read aloud.`,
    newsletter: `Expand this into a newsletter section. Professional, valuable, with clear takeaways. Include a subject line at the top. 200-400 words.`
  };

  const results = await Promise.all(platforms.map(async (platform) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: `${prompts[platform]}\n\nContent:\n${text}` }]
      })
    });
    const data = await res.json();
    return [platform, data.content?.[0]?.text || ''];
  }));

  const output = Object.fromEntries(results);

  // Increment usage
  await fetch(`${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ count: usage.count + 1 })
  });

  return new Response(JSON.stringify({ ...output, usage: { count: usage.count + 1, limit, plan: usage.plan } }), {
    headers: { ...cors(), 'Content-Type': 'application/json' }
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
