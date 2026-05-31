/**
 * Vercel Serverless Function — /api/chat
 *
 * Acts as a secure proxy between the browser and the DeepSeek API.
 * The DEEPSEEK_API_KEY environment variable lives only on the server —
 * it is never bundled into the client JavaScript.
 *
 * Set this in: Vercel Dashboard → Project → Settings → Environment Variables
 *   Name:  DEEPSEEK_API_KEY
 *   Value: sk-your-key-here
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'DEEPSEEK_API_KEY is not configured in Vercel Environment Variables.',
    });
  }

  try {
    const { messages, model = 'deepseek-chat', max_tokens = 800, temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message ?? `DeepSeek error ${upstream.status}`,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('[api/chat] error:', err.message);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
