export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const URL   = process.env.UPSTASH_REDIS_REST_URL;
  const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    const { stock } = req.body;
    if (!stock) return res.status(400).json({ error: 'stock requerido' });

    const r = await fetch(`${URL}/set/pac_stock`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify(stock) })
    });
    const data = await r.json();
    res.status(200).json({ ok: true, result: data.result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
