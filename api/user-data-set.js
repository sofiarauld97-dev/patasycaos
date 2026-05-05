export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const token = authHeader.slice(7);

  try {
    // Verificar token con Supabase
    const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_ANON_KEY
      }
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Token inválido' });
    const userData = await userRes.json();
    const userId = userData.id;

    const URL   = process.env.KV_REST_API_URL;
    const TOKEN = process.env.KV_REST_API_TOKEN;
    const { cart, wishlist } = req.body;

    const cmds = [];
    if (cart      !== undefined) cmds.push(['SET', `cart:${userId}`,     JSON.stringify(cart)]);
    if (wishlist  !== undefined) cmds.push(['SET', `wishlist:${userId}`, JSON.stringify(wishlist)]);

    if (cmds.length > 0) {
      await fetch(`${URL}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cmds)
      });
    }

    res.status(200).json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
