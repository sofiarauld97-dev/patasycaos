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
    let { stock, patch, decrementos } = req.body || {};

    if (typeof stock === 'string') {
      try { stock = JSON.parse(stock); } catch {}
    }
    if (typeof patch === 'string') {
      try { patch = JSON.parse(patch); } catch {}
    }
    if (typeof decrementos === 'string') {
      try { decrementos = JSON.parse(decrementos); } catch {}
    }

    let stockFinal;

    if (decrementos && typeof decrementos === 'object' && !Array.isArray(decrementos)) {
      const decLimpios = limpiarCantidades(decrementos);
      if (!Object.keys(decLimpios).length) {
        return res.status(400).json({ error: 'No hay cantidades válidas para descontar.' });
      }

      // Operación atómica: Redis lee, descuenta y guarda pac_stock dentro de un único EVAL.
      const lua = `
        local raw = redis.call('GET', KEYS[1])
        if not raw or raw == '' then return redis.error_reply('Inventario inexistente') end
        local ok, stockActual = pcall(cjson.decode, raw)
        if not ok or type(stockActual) ~= 'table' then return redis.error_reply('Inventario inválido') end
        local dec = cjson.decode(ARGV[1])
        local cambios = {}
        for clave, cantidad in pairs(dec) do
          if stockActual[clave] == nil then return redis.error_reply('SKU inexistente: ' .. clave) end
          local antes = tonumber(stockActual[clave])
          local qty = tonumber(cantidad)
          if antes == nil or qty == nil then return redis.error_reply('Cantidad inválida: ' .. clave) end
          local despues = antes - qty
          if despues < 0 then despues = 0 end
          stockActual[clave] = despues
          table.insert(cambios, { clave = clave, antes = antes, cantidad = qty, despues = despues })
        end
        redis.call('SET', KEYS[1], cjson.encode(stockActual))
        return cjson.encode({ stock = stockActual, cambios = cambios })
      `;

      const escritura = await fetch(`${UPSTASH_URL}/pipeline`, {
        method: 'POST',
        headers,
        body: JSON.stringify([['EVAL', lua, '1', 'pac_stock', JSON.stringify(decLimpios)]])
      });
      const resultado = await escritura.json();
      const evalResult = resultado?.[0];
      if (!escritura.ok || evalResult?.error) {
        return res.status(escritura.ok ? 409 : escritura.status).json({
          error: evalResult?.error || 'Upstash rechazó el descuento de inventario.',
          detail: resultado
        });
      }
      const payload = normalizarObjeto(evalResult?.result);
      return res.status(200).json({
        ok: true,
        mode: 'decrement-atomic',
        stock: payload.stock || {},
        cambios: payload.cambios || [],
        result: resultado
      });
    }

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
      return res.status(400).json({ error: 'Debes enviar stock, patch o decrementos.' });
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
