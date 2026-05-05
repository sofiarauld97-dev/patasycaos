export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const URL   = process.env.KV_REST_API_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN;

  try {
    const r = await fetch(`${URL}/get/pac_stock`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await r.json();
    let stock = null;
    if (data.result) {
      // Parsear hasta obtener el objeto real (puede estar multi-serializado)
      let val = data.result;
      let intentos = 0;
      while (typeof val === 'string' && intentos < 5) {
        try { val = JSON.parse(val); } catch(e) { break; }
        intentos++;
      }
      stock = (typeof val === 'object' && val !== null) ? val : null;
    }
    res.status(200).json({ stock });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
