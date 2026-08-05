export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(500).json({ error: 'Faltan variables de entorno de Upstash.' });
  }

  const headers = {
    Authorization: `Bearer ${UPSTASH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  function normalizarObjeto(valor) {
    let actual = valor;
    let intentos = 0;

    while (typeof actual === 'string' && intentos < 5) {
      try {
        actual = JSON.parse(actual);
      } catch {
        break;
      }
      intentos++;
    }

    return actual && typeof actual === 'object' && !Array.isArray(actual)
      ? actual
      : {};
  }

  function limpiarCantidades(objeto) {
    const limpio = {};

    for (const [sku, cantidad] of Object.entries(objeto || {})) {
      const id = String(sku).trim();
      const numero = Math.max(0, Math.floor(Number(cantidad)));

      if (!id || !Number.isFinite(numero)) continue;
      limpio[id] = numero;
    }

    return limpio;
  }

  try {
    let { stock, patch } = req.body || {};

    if (typeof stock === 'string') {
      try { stock = JSON.parse(stock); } catch {}
    }
    if (typeof patch === 'string') {
      try { patch = JSON.parse(patch); } catch {}
    }

    let stockFinal;

    if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
      const lectura = await fetch(`${UPSTASH_URL}/get/pac_stock`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });

      const dataActual = await lectura.json();
      const actual = normalizarObjeto(dataActual.result);
      stockFinal = {
        ...limpiarCantidades(actual),
        ...limpiarCantidades(patch)
      };
    } else if (stock && typeof stock === 'object' && !Array.isArray(stock)) {
      stockFinal = limpiarCantidades(stock);
    } else {
      return res.status(400).json({ error: 'Debes enviar stock o patch.' });
    }

    const stockStr = JSON.stringify(stockFinal);
    const escritura = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers,
      body: JSON.stringify([['SET', 'pac_stock', stockStr]])
    });

    const resultado = await escritura.json();

    if (!escritura.ok) {
      return res.status(escritura.status).json({
        error: 'Upstash rechazó la actualización.',
        detail: resultado
      });
    }

    return res.status(200).json({
      ok: true,
      mode: patch ? 'patch' : 'replace',
      stock: stockFinal,
      result: resultado
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
