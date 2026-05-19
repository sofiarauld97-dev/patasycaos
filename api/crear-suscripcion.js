export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nombre, email, telefono, comuna, tipo, plan, sabor } = req.body;
  if (!nombre || !email || !telefono || !comuna || !tipo || !plan || !sabor) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  // Precios según plan
  const PRECIOS = {
    'felina-basico':   29990,
    'felina-premium':  39990,
    'felina-vip':      54990,
    'indoor-basico':   34990,
    'indoor-premium':  44990,
    'indoor-vip':      59990,
  };

  const NOMBRES = {
    'felina-basico':   'Caja Caótica Felina — Básico',
    'felina-premium':  'Caja Caótica Felina — Premium',
    'felina-vip':      'Caja Caótica Felina — VIP',
    'indoor-basico':   'Caja Caótica Indoor — Básico',
    'indoor-premium':  'Caja Caótica Indoor — Premium',
    'indoor-vip':      'Caja Caótica Indoor — VIP',
  };

  const planKey = `${tipo}-${plan}`;
  const precio = PRECIOS[planKey];
  const nombrePlan = NOMBRES[planKey];

  if (!precio) return res.status(400).json({ error: 'Plan inválido' });

  try {
    // Crear suscripción en MP (Preapproval)
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        preapproval_plan_id: null,
        reason: `${nombrePlan} — Sabor: ${sabor}`,
        external_reference: `${email}-${planKey}-${Date.now()}`,
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: precio,
          currency_id: 'CLP',
        },
        back_url: 'https://patasycaos.cl/suscripciones?estado=ok',
        status: 'pending',
        notification_url: 'https://patasycaos.cl/api/webhook-suscripcion',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('MP error:', data);
      return res.status(500).json({ error: 'Error al crear suscripción en MP' });
    }

    // Guardar datos del suscriptor en Supabase
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/Suscripciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        nombre,
        email,
        telefono,
        comuna,
        tipo,
        plan,
        sabor,
        precio,
        mp_preapproval_id: data.id,
        estado: 'pendiente',
      }),
    });

    // Notificar por email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>',
        to: [process.env.NOTIFY_EMAIL],
        subject: `🐾 Nueva suscripción — ${nombre}`,
        text: `NUEVA SUSCRIPCIÓN — PATAS & CAOS

Cliente: ${nombre}
Email: ${email}
Teléfono: ${telefono}
Comuna: ${comuna}

Plan: ${nombrePlan}
Sabor: ${sabor}
Precio mensual: $${precio.toLocaleString('es-CL')}

Estado: Pendiente de pago
MP Preapproval ID: ${data.id}`,
      }),
    });

    return res.status(200).json({ init_point: data.init_point });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
