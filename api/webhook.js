import { emailConfirmacion, emailDespacho, emailEntregado, emailCancelado } from '../email_templates.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // === CAMBIO DE ESTADO / NUEVO PEDIDO MANUAL ===
  const { pedidoId, estado } = req.body || {};
  if (pedidoId && ['despachado', 'entregado', 'nuevo_pedido', 'cancelado'].includes(estado)) {
    try {
      const supaRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/Pedidos?id=eq.${pedidoId}&select=*`,
        { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` } }
      );
      const pedidos = await supaRes.json();
      const pedido = pedidos?.[0];
      if (!pedido?.email) return res.status(200).json({ ok: true, msg: 'Sin email' });

      // Reconstruir items desde el campo productos
      const items = (pedido.productos || '').split(',').map(s => {
        const match = s.trim().match(/^(.+?)\s+x(\d+)(?:\s.*)?$/);
        if (!match) return null;
        return { name: match[1].trim(), qty: parseInt(match[2]), price: 0 };
      }).filter(Boolean);

      const esRetiro = (pedido.direccion || '').toLowerCase().includes('retiro') || !(pedido.direccion || '').trim();

      let subject, html;
      if (estado === 'nuevo_pedido') {
        // Email de confirmación para pedido manual
        const itemsConPrecio = items.map(i => ({ ...i, price: Math.round(pedido.total / items.reduce((s, x) => s + x.qty, 0)) }));
        ({ subject, html } = emailConfirmacion({
          nombre: pedido.nombre,
          items: itemsConPrecio,
          subtotal: pedido.subtotal || pedido.total,
          costoEnvio: pedido.costo_envio || 0,
          total: pedido.total,
          direccion: pedido.direccion || '',
          comuna: pedido.comuna || '',
          ciudad: pedido.ciudad || '',
          documento: pedido.documento || 'Boleta',
          esRetiro,
          numeroPedido: pedido.id,
        }));
      } else if (estado === 'despachado') {
        ({ subject, html } = emailDespacho({
          nombre: pedido.nombre, items, total: pedido.total,
          direccion: pedido.direccion || '', comuna: pedido.comuna || '', ciudad: pedido.ciudad || '', esRetiro,
        }));
      } else if (estado === 'entregado') {
        ({ subject, html } = emailEntregado({ nombre: pedido.nombre, items, total: pedido.total }));
      } else {
        ({ subject, html } = emailCancelado({ nombre: pedido.nombre, items, total: pedido.total, numeroPedido: pedido.id }));
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'Patas & Caos <contacto@patasycaos.cl>', to: [pedido.email], subject, html }),
      });
      console.log(`[webhook] Email '${estado}' enviado a ${pedido.email}`);

      // Notificar a Sofía si es pedido nuevo manual
      if (estado === 'nuevo_pedido') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Patas & Caos <contacto@patasycaos.cl>',
            to: [process.env.NOTIFY_EMAIL],
            subject: `🐾 Nuevo pedido manual — ${pedido.nombre}`,
            text: `NUEVO PEDIDO MANUAL\n\nCliente: ${pedido.nombre}\nEmail: ${pedido.email}\nTeléfono: ${pedido.telefono || '-'}\nDirección: ${pedido.direccion || 'Retiro'}\nComuna: ${pedido.comuna || '-'}\nCiudad: ${pedido.ciudad || '-'}\nNotas: ${pedido.notas || 'Sin notas'}\n\nProductos: ${pedido.productos}\nTotal: $${pedido.total?.toLocaleString('es-CL')}`,
          }),
        });
      }

      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('[webhook] Error email estado:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // === NOTIFICACIÓN MERCADO PAGO ===
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
      const cur = typeof stock[item.id] === 'number' ? stock[item.id] : 0;
      stock[item.id] = Math.max(0, cur - item.qty);
    }
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['SET', 'pac_stock', JSON.stringify(stock)]]),
    });

    // Guardar pedido en Supabase y obtener el ID
    const supaInsertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/Pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`, Prefer: 'return=representation' },
      body: JSON.stringify({
        nombre: order.nombre, email: order.email, telefono: order.telefono,
        direccion: order.direccion || '', comuna: order.comuna || '', ciudad: order.ciudad || '',
        notas: order.notas || '', productos: productosTexto,
        subtotal, costo_envio: costoEnvio, total,
        documento: order.documento || 'Boleta', estado: 'pendiente',
        mp_preference_id: payment.preference_id,
      }),
    });
    const supaInsertData = await supaInsertRes.json();
    const numeroPedido = supaInsertData?.[0]?.id;

    // Email interno a Sofía
    const productosEmail = order.items.map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString('es-CL')}`).join('\n');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>', to: [process.env.NOTIFY_EMAIL],
        subject: `🐾 Nuevo pedido — ${order.nombre}`,
        text: `NUEVO PEDIDO\n\nCliente: ${order.nombre}\nEmail: ${order.email}\nTeléfono: ${order.telefono}\nDirección: ${order.direccion || 'Retiro'}\nComuna: ${order.comuna || '-'}\nCiudad: ${order.ciudad || '-'}\nNotas: ${order.notas || 'Sin notas'}\n\nProductos:\n${productosEmail}\n\nTotal: $${total.toLocaleString('es-CL')}`,
      }),
    });

    // Email confirmación al cliente
    if (order.email) {
      const { subject, html } = emailConfirmacion({
        nombre: order.nombre, items: order.items, subtotal, costoEnvio, total,
        direccion: order.direccion || '', comuna: order.comuna || '', ciudad: order.ciudad || '',
        documento: order.documento || 'Boleta', esRetiro,
        numeroPedido,
      });
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'Patas & Caos <contacto@patasycaos.cl>', to: [order.email], subject, html }),
      });
    }

    return res.status(200).end();
  } catch (e) {
    console.error('[webhook] ERROR:', e);
    return res.status(500).end();
  }
}
