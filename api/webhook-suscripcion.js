export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body || {};

  // Manejar tanto eventos de suscripción como de pagos de suscripción
  if (!data?.id) return res.status(200).end();
  if (type !== 'subscription_preapproval' && type !== 'subscription_authorized_payment') return res.status(200).end();

  try {
    // ── PAGO AUTOMÁTICO MENSUAL ──
    if (type === 'subscription_authorized_payment') {
      const pagoRes = await fetch(`https://api.mercadopago.com/authorized_payments/${data.id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });
      const pago = await pagoRes.json();

      if (pago.status === 'processed') {
        // Pago exitoso — notificar para preparar despacho
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Patas & Caos <contacto@patasycaos.cl>',
            to: [process.env.NOTIFY_EMAIL],
            subject: `💳 Pago recibido — preparar despacho`,
            text: `PAGO MENSUAL RECIBIDO — PATAS & CAOS

Preapproval ID: ${pago.preapproval_id}
Monto: $${pago.transaction_amount?.toLocaleString('es-CL')}
Estado: Procesado ✅

¡Preparar y despachar la caja! 🐾`,
          }),
        });
      } else if (pago.status === 'cancelled' || pago.status === 'refunded') {
        // Pago fallido o rechazado — notificar urgente
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Patas & Caos <contacto@patasycaos.cl>',
            to: [process.env.NOTIFY_EMAIL],
            subject: `⚠️ Pago fallido — suscripción sin cobrar`,
            text: `PAGO MENSUAL FALLIDO — PATAS & CAOS

Preapproval ID: ${pago.preapproval_id}
Monto: $${pago.transaction_amount?.toLocaleString('es-CL')}
Estado: ${pago.status}

⚠️ El cliente no fue cobrado este mes. Contáctalo antes de despachar.`,
          }),
        });

        // Marcar en Supabase como pago_fallido
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/Suscripciones?mp_preapproval_id=eq.${pago.preapproval_id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ estado: 'pago_fallido' }),
        });
      }

      return res.status(200).end();
    }

    // ── CAMBIO DE ESTADO DE SUSCRIPCIÓN ──
    if (type === 'subscription_preapproval') {
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

      // Notificar según estado
      if (suscripcion.status === 'authorized') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
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
      } else if (suscripcion.status === 'paused') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Patas & Caos <contacto@patasycaos.cl>',
            to: [process.env.NOTIFY_EMAIL],
            subject: `⏸️ Suscripción pausada — ${suscripcion.payer_email}`,
            text: `SUSCRIPCIÓN PAUSADA — PATAS & CAOS

Email: ${suscripcion.payer_email}
MP Preapproval ID: ${data.id}

MP pausó esta suscripción, probablemente por un pago fallido. Contacta al cliente. 🐾`,
          }),
        });
      }
    }

    return res.status(200).end();
  } catch (e) {
    console.error('Webhook suscripción error:', e);
    return res.status(500).end();
  }
}
