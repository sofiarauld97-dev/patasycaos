export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const URL   = process.env.UPSTASH_REDIS_REST_URL;
  const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    const r = await fetch(`${URL}/get/pac_stock`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await r.json();
    const stock = data.result ? JSON.parse(data.result) : null;
    res.status(200).json({ stock });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
