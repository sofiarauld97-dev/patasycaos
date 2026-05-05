export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const URL   = process.env.KV_REST_API_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN;
  try {
    await fetch(`${URL}/del/pac_stock`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    res.status(200).json({ ok: true, msg: 'Stock limpiado. Vuelve al inventario y guarda de nuevo.' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
