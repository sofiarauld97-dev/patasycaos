export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body || {};
  if (type !== 'payment' || !data?.id) return res.status(200).end();

  try {
    // 1. Obtener detalles del pago desde Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();
    console.log('[webhook] payment.status:', payment.status, '| preference_id:', payment.preference_id);

    if (payment.status !== 'approved') return res.status(200).end();

    // 2. Obtener datos del cliente desde Redis
    const redisRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/order:${payment.preference_id}`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    });
    const redisData = await redisRes.json();
    console.log('[webhook] redisData.result:', redisData.result ? 'OK' : 'VACÍO');
    if (!redisData.result) return res.status(200).end();

    const order = JSON.parse(redisData.result);

    // 3. Calcular totales
    const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    const costoEnvio = order.costoEnvio || 0;
    const total = subtotal + costoEnvio;
    const productosTexto = order.items.map(i => `${i.name} x${i.qty}`).join(', ');

    // 4. Descontar stock en Redis
    const stockRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/pac_stock`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    });
    const stockData = await stockRes.json();
    let stock = {};
    if (stockData.result) {
      let val = stockData.result;
      let intentos = 0;
      while (typeof val === 'string' && intentos < 5) {
        try { val = JSON.parse(val); } catch(e) { break; }
        intentos++;
      }
      if (typeof val === 'object' && val !== null) stock = val;
    }

    for (const item of order.items) {
      if (item.id && typeof stock[item.id] === 'number') {
        stock[item.id] = Math.max(0, stock[item.id] - item.qty);
        console.log(`[webhook] stock ${item.id}: -${item.qty} → ${stock[item.id]}`);
      }
    }

    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([['SET', 'pac_stock', JSON.stringify(stock)]]),
    });
    console.log('[webhook] stock actualizado');

    // 5. Guardar pedido en Supabase
    const supaRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/Pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        nombre: order.nombre,
        email: order.email,
        telefono: order.telefono,
        direccion: order.direccion,
        comuna: order.comuna,
        ciudad: order.ciudad,
        notas: order.notas || '',
        productos: productosTexto,
        subtotal,
        costo_envio: costoEnvio,
        total,
        documento: order.documento || 'Boleta',
        estado: 'pendiente',
        mp_preference_id: payment.preference_id,
      }),
    });
    console.log('[webhook] Supabase status:', supaRes.status);

    // 6. Enviar email de notificación via Resend
    const productosEmail = order.items
      .map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString('es-CL')}`)
      .join('\n');

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>',
        to: [process.env.NOTIFY_EMAIL],
        subject: `🐾 Nuevo pedido — ${order.nombre}`,
        text: `NUEVO PEDIDO — PATAS & CAOS

Cliente: ${order.nombre}
Email: ${order.email}
Teléfono: ${order.telefono}

Dirección: ${order.direccion}
Comuna: ${order.comuna}
Ciudad: ${order.ciudad}
Notas: ${order.notas || 'Sin notas'}

Productos:
${productosEmail}

Subtotal: $${subtotal.toLocaleString('es-CL')}
Envío: $${costoEnvio > 0 ? costoEnvio.toLocaleString('es-CL') : 'A coordinar'}
Total: $${costoEnvio > 0 ? total.toLocaleString('es-CL') : subtotal.toLocaleString('es-CL')}

Documento: ${order.documento || 'Boleta'}
Estado: Pendiente`,
      }),
    });
    console.log('[webhook] Resend status:', emailRes.status);

    return res.status(200).end();
  } catch (e) {
    console.error('[webhook] ERROR:', e);
    return res.status(500).end();
  }
}
