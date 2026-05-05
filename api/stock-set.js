export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const URL   = process.env.KV_REST_API_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN;

  try {
    let { stock } = req.body;
    if (!stock) return res.status(400).json({ error: 'stock requerido' });

    // Asegurarse de que es objeto
    if (typeof stock === 'string') {
      try { stock = JSON.parse(stock); } catch(e) {}
    }

    // Usar pipeline para SET con valor raw (evita el wrapping de Upstash)
    const stockStr = JSON.stringify(stock);
    const r = await fetch(`${URL}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['SET', 'pac_stock', stockStr]])
    });
    const data = await r.json();
    res.status(200).json({ ok: true, result: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
