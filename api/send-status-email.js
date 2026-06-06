import { emailDespacho, emailEntregado } from '../email_templates.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pedidoId, estado } = req.body || {};
  if (!pedidoId || !['despachado', 'entregado'].includes(estado)) return res.status(400).end();

  try {
    // Obtener el pedido desde Supabase
    const supaRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/Pedidos?id=eq.${pedidoId}&select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      }
    );
    const pedidos = await supaRes.json();
    const pedido = pedidos?.[0];

    if (!pedido?.email) return res.status(200).json({ ok: true, msg: 'Sin email' });

    // Reconstruir items desde el campo productos (texto) para mostrar en el email
    // Formato: "Nombre x2, Otro x1"
    const items = (pedido.productos || '').split(',').map(s => {
      const match = s.trim().match(/^(.+?)\s+x(\d+)(?:\s.*)?$/);
      if (!match) return null;
      return { name: match[1].trim(), qty: parseInt(match[2]), price: 0 };
    }).filter(Boolean);

    const esRetiro = (pedido.direccion || '').trim() === '' || (pedido.direccion || '').toLowerCase().includes('retiro');

    let subject, html;
    if (estado === 'despachado') {
      ({ subject, html } = emailDespacho({
        nombre: pedido.nombre,
        items,
        total: pedido.total,
        direccion: pedido.direccion || '',
        comuna: pedido.comuna || '',
        ciudad: pedido.ciudad || '',
        esRetiro,
      }));
    } else {
      ({ subject, html } = emailEntregado({
        nombre: pedido.nombre,
        items,
        total: pedido.total,
      }));
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>',
        to: [pedido.email],
        subject,
        html,
      }),
    });

    console.log(`[send-status-email] Email ${estado} enviado a ${pedido.email}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[send-status-email] ERROR:', e);
    return res.status(500).json({ error: e.message });
  }
}
