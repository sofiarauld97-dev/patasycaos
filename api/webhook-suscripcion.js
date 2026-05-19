export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body || {};
  if (type !== 'subscription_preapproval' || !data?.id) return res.status(200).end();

  try {
    // Obtener detalles de la suscripción desde MP
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const suscripcion = await mpRes.json();

    const nuevoEstado = suscripcion.status === 'authorized' ? 'activa' : suscripcion.status;

    // Actualizar estado en Supabase
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/Suscripciones?mp_preapproval_id=eq.${data.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    // Notificar solo cuando se activa
    if (suscripcion.status === 'authorized') {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Patas & Caos <contacto@patasycaos.cl>',
          to: [process.env.NOTIFY_EMAIL],
          subject: `✅ Suscripción activada — ${suscripcion.payer_email}`,
          text: `SUSCRIPCIÓN ACTIVADA — PATAS & CAOS

Email: ${suscripcion.payer_email}
Plan: ${suscripcion.reason}
Monto mensual: $${suscripcion.auto_recurring?.transaction_amount?.toLocaleString('es-CL')}
MP Preapproval ID: ${data.id}

¡Preparar la primera caja! 🐾`,
        }),
      });
    }

    return res.status(200).end();
  } catch (e) {
    console.error('Webhook suscripción error:', e);
    return res.status(500).end();
  }
}
