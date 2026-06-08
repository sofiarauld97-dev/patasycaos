import { emailTransferencia } from '../email_templates.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, cliente } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'No items in cart' });

  try {
    const subtotal   = items.reduce((s, i) => s + i.price * i.qty, 0);
    const costoEnvio = cliente.costoEnvio || 0;
    const total      = subtotal + costoEnvio;
    const productosTexto = items.map(i => `${i.name} x${i.qty}`).join(', ');
    const esRetiro   = cliente.metodoEntrega === 'retiro';

    // 1. Guardar pedido en Supabase y obtener el ID generado
    const supaRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/Pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=representation', // para obtener el ID
      },
      body: JSON.stringify({
        nombre:      cliente.nombre,
        email:       cliente.email,
        telefono:    cliente.telefono,
        direccion:   cliente.direccion || '',
        comuna:      cliente.comuna || '',
        ciudad:      cliente.ciudad || '',
        notas:       cliente.notas || '',
        productos:   productosTexto,
        subtotal,
        costo_envio: costoEnvio,
        total,
        documento:   cliente.documento || 'Boleta',
        estado:      'pendiente_transferencia',
      }),
    });

    const pedidoData = await supaRes.json();
    const numeroPedido = pedidoData?.[0]?.id || Date.now();
    console.log('[checkout-transferencia] Pedido creado ID:', numeroPedido);

    // 2. Descontar stock en Upstash
    try {
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
      for (const item of items) {
        const cur = typeof stock[item.id] === 'number' ? stock[item.id] : 0;
        stock[item.id] = Math.max(0, cur - item.qty);
      }
      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([['SET', 'pac_stock', JSON.stringify(stock)]]),
      });
      console.log('[checkout-transferencia] Stock descontado en Upstash');
    } catch (e) {
      console.error('[checkout-transferencia] Error descontando stock:', e);
    }

    // 3. Notificar a Sofía
    const productosEmail = items
      .map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString('es-CL')}`)
      .join('\n');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>',
        to: [process.env.NOTIFY_EMAIL],
        subject: `🏦 Pedido PAC-${String(numeroPedido).padStart(5,'0')} por transferencia — ${cliente.nombre}`,
        text: `PEDIDO POR TRANSFERENCIA — PAC-${String(numeroPedido).padStart(5,'0')}\n\n⚠️ Pendiente de confirmación de pago (48h)\n\nCliente: ${cliente.nombre}\nEmail: ${cliente.email}\nTeléfono: ${cliente.telefono}\nDirección: ${cliente.direccion || 'Retiro en tienda'}\nComuna: ${cliente.comuna || '-'}\nCiudad: ${cliente.ciudad || '-'}\nNotas: ${cliente.notas || 'Sin notas'}\n\nProductos:\n${productosEmail}\n\nSubtotal: $${subtotal.toLocaleString('es-CL')}\nEnvío: $${costoEnvio > 0 ? costoEnvio.toLocaleString('es-CL') : 'Gratis'}\nTotal: $${total.toLocaleString('es-CL')}\n\nDocumento: ${cliente.documento || 'Boleta'}`,
      }),
    });

    // 4. Email al cliente con datos bancarios y número de pedido
    if (cliente.email) {
      const { subject, html } = emailTransferencia({
        nombre: cliente.nombre,
        items,
        subtotal,
        costoEnvio,
        total,
        direccion: cliente.direccion || '',
        comuna: cliente.comuna || '',
        ciudad: cliente.ciudad || '',
        esRetiro,
        numeroPedido,
      });

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Patas & Caos <contacto@patasycaos.cl>',
          to: [cliente.email],
          subject,
          html,
        }),
      });
      console.log('[checkout-transferencia] Email cliente enviado');
    }

    return res.status(200).json({ ok: true, numeroPedido });
  } catch (e) {
    console.error('[checkout-transferencia] ERROR:', e);
    return res.status(500).json({ error: e.message });
  }
}
