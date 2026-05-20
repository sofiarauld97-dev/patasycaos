export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const UPSTASH_URL   = process.env.KV_REST_API_URL;
  const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN;

  try {
    const r = await fetch(`${UPSTASH_URL}/get/pac_stock`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });

    const data = await r.json();

    // data.result puede ser string, objeto, o null
    if (data.result === null || data.result === undefined) {
      return res.status(200).json({ stock: {} });
    }

    let val = data.result;

    // Desanidar si viene serializado como string (doble JSON)
    let intentos = 0;
    while (typeof val === 'string' && intentos < 5) {
      try { val = JSON.parse(val); } catch(e) { break; }
      intentos++;
    }

    const stock = (typeof val === 'object' && val !== null && !Array.isArray(val))
      ? val
      : {};

    return res.status(200).json({ stock });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
