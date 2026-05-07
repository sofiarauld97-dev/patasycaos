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

    if (payment.status !== 'approved') return res.status(200).end();

    // 2. Obtener datos del cliente desde Redis
    const redisRes = await fetch(`${process.env.KV_REST_API_URL}/get/order:${payment.preference_id}`, {
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    });
    const redisData = await redisRes.json();
    if (!redisData.result) return res.status(200).end();

    const order = JSON.parse(redisData.result);

    // 3. Calcular totales
    const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    const costoEnvio = order.costoEnvio || 0;
    const total = subtotal + costoEnvio;
    const productosTexto = order.items.map(i => `${i.name} x${i.qty}`).join(', ');

    // 4. Guardar pedido en Supabase
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/Pedidos`, {
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

    // 5. Enviar email de notificación via Resend
    const productosEmail = order.items
      .map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString('es-CL')}`)
      .join('\n');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Patas & Caos <onboarding@resend.dev>',
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

    return res.status(200).end();
  } catch (e) {
    console.error('Webhook error:', e);
    return res.status(500).end();
  }
}
