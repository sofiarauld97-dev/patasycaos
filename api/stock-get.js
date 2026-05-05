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
    if (data.result !== null && data.result !== undefined) {
      let val = data.result;
      // Deshacer todas las capas de serialización
      let intentos = 0;
      while (typeof val === 'string' && intentos < 10) {
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            // Verificar que tiene claves que parecen stock (true/false)
            const keys = Object.keys(parsed);
            if (keys.length > 0 && (parsed[keys[0]] === true || parsed[keys[0]] === false)) {
              stock = parsed;
              break;
            }
          }
          val = parsed;
        } catch(e) { break; }
        intentos++;
      }
      if (!stock && typeof val === 'object' && val !== null) stock = val;
    }

    res.status(200).json({ stock });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
