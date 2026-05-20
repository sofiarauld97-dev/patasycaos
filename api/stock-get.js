import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // Headers ANTES de cualquier await, por si Vercel cachea en edge
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Surrogate-Control', 'no-store');

  try {
    let stock = await redis.get('pac_stock');

    // El SDK parsea automáticamente, pero si fue guardado como string doble, llega como string
    if (typeof stock === 'string') {
      try { stock = JSON.parse(stock); } catch(e) { stock = {}; }
    }

    // Verificación mínima
    if (!stock || typeof stock !== 'object' || Array.isArray(stock)) {
      stock = {};
    }

    res.status(200).json({ stock });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}