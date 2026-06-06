import { emailConfirmacion } from '../email_templates.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body || {};
  if (type !== 'payment' || !data?.id) return res.status(200).end();

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();
    console.log('[webhook] status:', payment.status, '| pref:', payment.preference_id);
    if (payment.status !== 'approved') return res.status(200).end();

    const redisRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/order:${payment.preference_id}`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    });
    const redisData = await redisRes.json();
    if (!redisData.result) return res.status(200).end();

    const order = JSON.parse(redisData.result);
    const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    const costoEnvio = order.costoEnvio || 0;
    const total = subtotal + costoEnvio;
    const productosTexto = order.items.map(i => `${i.name} x${i.qty}`).join(', ');
    const esRetiro = order.metodoEntrega === 'retiro';

    // Descontar stock
    const stockRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/pac_stock`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    });
    const stockData = await stockRes.json();
    let stock = {};
    if (stockData.result) {
      let val = stockData.result;
      let i = 0;
      while (typeof val === 'string' && i++ < 5) { try { val = JSON.parse(val); } catch(e) { break; } }
      if (typeof val === 'object' && val !== null) stock = val;
    }
    for (const item of order.items) {
      if (item.id && typeof stock[item.id] === 'number')
        stock[item.id] = Math.max(0, stock[item.id] - item.qty);
    }
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['SET', 'pac_stock', JSON.stringify(stock)]]),
    });

    // Guardar pedido en Supabase
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/Pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        nombre: order.nombre, email: order.email, telefono: order.telefono,
        direccion: order.direccion || '', comuna: order.comuna || '', ciudad: order.ciudad || '',
        notas: order.notas || '', productos: productosTexto,
        subtotal, costo_envio: costoEnvio, total,
        documento: order.documento || 'Boleta', estado: 'pendiente',
        mp_preference_id: payment.preference_id,
      }),
    });

    // Email interno a Sofía
    const productosEmail = order.items.map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString('es-CL')}`).join('\n');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>',
        to: [process.env.NOTIFY_EMAIL],
        subject: `🐾 Nuevo pedido — ${order.nombre}`,
        text: `NUEVO PEDIDO\n\nCliente: ${order.nombre}\nEmail: ${order.email}\nTeléfono: ${order.telefono}\nDirección: ${order.direccion || 'Retiro en tienda'}\nComuna: ${order.comuna || '-'}\nCiudad: ${order.ciudad || '-'}\nNotas: ${order.notas || 'Sin notas'}\n\nProductos:\n${productosEmail}\n\nSubtotal: $${subtotal.toLocaleString('es-CL')}\nEnvío: $${costoEnvio > 0 ? costoEnvio.toLocaleString('es-CL') : 'A coordinar'}\nTotal: $${total.toLocaleString('es-CL')}\nDocumento: ${order.documento || 'Boleta'}`,
      }),
    });

    // Email confirmación al cliente
    if (order.email) {
      const { subject, html } = emailConfirmacion({
        nombre: order.nombre, items: order.items, subtotal, costoEnvio, total,
        direccion: order.direccion || '', comuna: order.comuna || '', ciudad: order.ciudad || '',
        documento: order.documento || 'Boleta', esRetiro,
      });
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'Patas & Caos <contacto@patasycaos.cl>', to: [order.email], subject, html }),
      });
      console.log('[webhook] Email cliente enviado');
    }

    return res.status(200).end();
  } catch (e) {
    console.error('[webhook] ERROR:', e);
    return res.status(500).end();
  }
}
