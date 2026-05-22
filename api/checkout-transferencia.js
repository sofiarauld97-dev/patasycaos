export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, cliente } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'No items in cart' });

  try {
    const subtotal   = items.reduce((s, i) => s + i.price * i.qty, 0);
    const costoEnvio = cliente.costoEnvio || 0;
    const total      = subtotal + costoEnvio;
    const productosTexto = items.map(i => `${i.name} x${i.qty}`).join(', ');

    // 1. Guardar pedido en Supabase con estado pendiente_transferencia
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/Pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        nombre:      cliente.nombre,
        email:       cliente.email,
        telefono:    cliente.telefono,
        direccion:   cliente.direccion,
        comuna:      cliente.comuna,
        ciudad:      cliente.ciudad,
        notas:       cliente.notas || '',
        productos:   productosTexto,
        subtotal,
        costo_envio: costoEnvio,
        total,
        documento:   cliente.documento || 'Boleta',
        estado:      'pendiente_transferencia',
      }),
    });

    // 2. Notificar a Sofía por email
    const productosEmail = items
      .map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString('es-CL')}`)
      .join('\n');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>',
        to: [process.env.NOTIFY_EMAIL],
        subject: `🏦 Pedido por transferencia — ${cliente.nombre}`,
        text: `PEDIDO POR TRANSFERENCIA — PATAS & CAOS

⚠️ Este pedido está pendiente de confirmación de pago.

Cliente: ${cliente.nombre}
Email: ${cliente.email}
Teléfono: ${cliente.telefono}

Dirección: ${cliente.direccion}
Comuna: ${cliente.comuna}
Ciudad: ${cliente.ciudad}
Entrega: ${cliente.metodoEntrega}
Notas: ${cliente.notas || 'Sin notas'}

Productos:
${productosEmail}

Subtotal: $${subtotal.toLocaleString('es-CL')}
Envío: $${costoEnvio > 0 ? costoEnvio.toLocaleString('es-CL') : 'Gratis'}
Total a transferir: $${total.toLocaleString('es-CL')}

Documento: ${cliente.documento || 'Boleta'}

🐾 Confirma el pago antes de preparar el pedido.`,
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('checkout-transferencia error:', e);
    return res.status(500).json({ error: e.message });
  }
}
