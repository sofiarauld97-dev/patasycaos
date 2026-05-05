import { createClerkClient } from '@clerk/backend';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const token = authHeader.slice(7);

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const payload = await clerk.verifyToken(token);
    const userId = payload.sub;

    const URL   = process.env.KV_REST_API_URL;
    const TOKEN = process.env.KV_REST_API_TOKEN;

    const [cartRes, wishlistRes] = await Promise.all([
      fetch(`${URL}/get/cart:${userId}`, { headers: { Authorization: `Bearer ${TOKEN}` } }),
      fetch(`${URL}/get/wishlist:${userId}`, { headers: { Authorization: `Bearer ${TOKEN}` } })
    ]);

    const cartData     = await cartRes.json();
    const wishlistData = await wishlistRes.json();

    let cart = null, wishlist = [];
    if (cartData.result)     { try { cart     = JSON.parse(cartData.result);     } catch(e) {} }
    if (wishlistData.result) { try { wishlist = JSON.parse(wishlistData.result); } catch(e) {} }

    res.status(200).json({ cart, wishlist, userId });
  } catch(e) {
    res.status(401).json({ error: 'Token inválido' });
  }
}
