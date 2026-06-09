import { emailConfirmacion, emailDespacho, emailEntregado, emailCancelado } from '../email_templates.js';

// Catálogo de precios para reconstruir items desde texto de Supabase
const PRECIOS = {
  "Collar de Perro Talla S - Brown": 6990,

  "Comedero Lento Flores - Lila": 9990,

  "Collar Find My — Amarillo": 12990,

  "Pelota Snack Interactiva — Verde": 6990,

  "Afeitadora LED": 9990,
  "Arena Sanitaria Ciudad Animal 8kg": 8990,
  "Botella Portátil para Perros — Calipso": 14990,
  "Botella Portátil para Perros — Rosada": 14990,
  "Brit Care Sterilized Weigh Control 2kg - Duck & Turkey": 24990,
  "Calming Collar - Gatos": 7990,
  "Calming Collar - Perros": 7990,
  "Cat Fest Meat Sticks — Cordero": 3490,
  "Cat Fest Meat Sticks — Pato": 3490,
  "Cat Fest Pillows Chicken Creme": 1990,
  "Cat Fest Pillows Salmon Creme": 1990,
  "Cats Snack — Catnip": 2990,
  "Cats Snack — Matatabi": 2990,
  "Cats Snack — Rellena Atún + Ostiones": 2990,
  "Cats Snack — Rellena Atún + Queso": 2990,
  "Cats Snack — Rellena Camarón": 2990,
  "ColágePet Donut — Sabor Carne": 2990,
  "ColágePet Donut — Sabor Pato": 2990,
  "ColágePet Donut — Sabor Pollo": 2990,
  "Collar Find My — Azul": 12990,
  "Collar Find My — Negro": 12990,
  "Collar Find My — Turquesa": 12990,
  "Collar Isabelino Donut Rosada - Talla S": 6990,
  "Comedero Lento Slow Feeder - Catstages": 7990,
  "Comedero Lento Slow Feeder - Rosado": 6990,
  "Dispensador de Bolsas - Diseño Café": 5990,
  "Dog Fest Calcium Bones with Chicken": 4990,
  "Dog Fest Lamb Medallions": 4990,
  "Dog Fest Rabbit Ears with Lamb": 4990,
  "Flores de Bach - Ansiedad y Calma": 12990,
  "Flores de Bach - Energía y Ánimo": 12990,
  "Flores de Bach - Equilibrio": 12990,
  "Flores de Bach - Rescue y Alivio": 12990,
  "Fuente de Agua Flor USB": 21990,
  "Fémur de Cerdo - Tasty Farm": 4990,
  "Garra de Pollo 65g - Rahue": 3490,
  "Lata Leonardo Adulto — Ave": 3790,
  "Lata Leonardo Adulto — Conejo": 3790,
  "Lata Leonardo Adulto — Pato": 3790,
  "Lata Leonardo Adulto — Pescado": 3790,
  "Lata Leonardo Adulto — Ternera": 3790,
  "Lata Leonardo Kitten 200g": 3790,
  "Masajeador Pulpo": 6990,
  "Pack Bienvenido a Casa": 21990,
  "Pack Calma Total": 15990,
  "Pack Consulta + Flor de Bach": 29990,
  "Pack Cuidado Total": 12990,
  "Pack Juega y Relaja": 28990,
  "Pack Rutina Sana": 33990,
  "Pack SOS Mascota": 18990,
  "Paw Balm": 5990,
  "Pelota Interactiva LED": 8990,
  "Pelota Snack Interactiva — Azul": 6990,
  "Pelota Snack Interactiva — Roja": 6990,
  "Pulmón de Cordero 50g - Rahue": 3990,
  "Pájaro Interactivo": 13990,
  "Rascador Maxi Caja de Leche - Brnx": 13990,
  "Recorte Oreja de Cerdo 100g - Rahue": 4290,
  "Suero Fisiológico — Cloruro de Sodio 0.9%": 2590,
  "Tráquea de Vacuno - Rahue": 3990,
  "Tubito Cremoso Atún con Catnip": 2990,
  "Tubito Cremoso Camarón con Catnip": 2990,
  "Tubito Cremoso Salmón con Matatabi": 2990,
};

function getPrecio(nombre) {
  if (PRECIOS[nombre]) return PRECIOS[nombre];
  // Búsqueda parcial si el nombre no coincide exacto
  const key = Object.keys(PRECIOS).find(k =>
    k.toLowerCase().includes(nombre.toLowerCase()) ||
    nombre.toLowerCase().includes(k.toLowerCase())
  );
  return key ? PRECIOS[key] : 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // GET: consulta de pedido para la página pedido-ok
    if (req.method === 'GET') {
      const { preference_id } = req.query;
      if (!preference_id) return res.status(400).json({ error: 'Missing preference_id' });
      try {
        const redisRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/order:${preference_id}`, {
          headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        });
        const redisData = await redisRes.json();
        if (!redisData.result) return res.status(404).json({ error: 'Order not found' });
        const order = JSON.parse(redisData.result);
        const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
        const costoEnvio = order.costoEnvio || 0;
        return res.status(200).json({
          nombre: order.nombre,
          items: order.items,
          subtotal,
          costoEnvio,
          total: subtotal + costoEnvio,
          metodoEntrega: order.metodoEntrega || 'despacho',
          direccion: order.direccion || '',
          comuna: order.comuna || '',
          ciudad: order.ciudad || '',
        });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    return res.status(405).end();
  }

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

      // Reconstruir items con precios desde el catálogo
      const items = (pedido.productos || '').split(',').map(s => {
        const match = s.trim().match(/^(.+?)\s+x(\d+)(?:\s.*)?$/);
        if (!match) return null;
        const nombre = match[1].trim();
        return { name: nombre, qty: parseInt(match[2]), price: getPrecio(nombre) };
      }).filter(Boolean);

      const esRetiro = (pedido.direccion || '').toLowerCase().includes('retiro') || !(pedido.direccion || '').trim();

      let subject, html;
      if (estado === 'nuevo_pedido') {
        ({ subject, html } = emailConfirmacion({
          nombre: pedido.nombre,
          items,
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

      // Descontar stock si es nuevo_pedido
      if (estado === 'nuevo_pedido') {
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
          console.log('[webhook] Stock descontado para pedido manual:', pedidoId);
        } catch (e) {
          console.error('[webhook] Error descontando stock pedido manual:', e);
        }
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

    // Guardar pedido en Supabase
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
