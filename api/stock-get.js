export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    const r = await fetch(`${UPSTASH_URL}/get/pac_stock`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });

    const raw = await r.text();
    let data;
    try { data = JSON.parse(raw); } catch(e) { data = null; }

    // DEBUG TEMPORAL
    return res.status(200).json({
      _debug: {
        url_definida: !!UPSTASH_URL,
        token_definido: !!UPSTASH_TOKEN,
        upstash_status: r.status,
        raw_recibido: raw.slice(0, 500),
        result_type: data ? typeof data.result : 'data_nula',
      }
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
