export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nombre, email, telefono, direccion, comuna, ciudad, notas, tipo, plan, sabor } = req.body;
  if (!nombre || !email || !telefono || !direccion || !comuna || !tipo || !plan) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  const PRECIOS = {
    'felina-basico':  29990, 'felina-premium': 39990, 'felina-vip':    54990,
    'indoor-basico':  34990, 'indoor-premium': 44990, 'indoor-vip':    59990,
  };
  const NOMBRES = {
    'felina-basico':  'Caja Caótica Felina Outdoor — Básico',
    'felina-premium': 'Caja Caótica Felina Outdoor — Premium',
    'felina-vip':     'Caja Caótica Felina Outdoor — VIP',
    'indoor-basico':  'Caja Caótica Felina Indoor — Básico',
    'indoor-premium': 'Caja Caótica Felina Indoor — Premium',
    'indoor-vip':     'Caja Caótica Felina Indoor — VIP',
  };

  const planKey    = `${tipo}-${plan}`;
  const precio     = PRECIOS[planKey];
  const nombrePlan = NOMBRES[planKey];
  if (!precio) return res.status(400).json({ error: 'Plan inválido' });

  try {
    // 1. Guardar en Supabase con estado pendiente_transferencia
    const supaRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/Suscripciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        nombre, email, telefono, direccion, comuna,
        ciudad: ciudad || 'Santiago',
        notas: notas || '',
        tipo, plan, sabor: sabor || '',
        precio,
        estado: 'pendiente_transferencia',
        mp_preapproval_id: null,
      }),
    });
    const suscripcionData = await supaRes.json();
    const numeroSuscripcion = suscripcionData?.[0]?.id || Date.now();

    // 2. Notificar a Sofía
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>',
        to: [process.env.NOTIFY_EMAIL],
        subject: `🏦 Nueva suscripción por transferencia — ${nombre}`,
        text: `NUEVA SUSCRIPCIÓN POR TRANSFERENCIA — PATAS & CAOS

⚠️ Pendiente de confirmación de pago.

Cliente: ${nombre}
Email: ${email}
Teléfono: ${telefono}

Plan: ${nombrePlan}
Sabor/variante: ${sabor || 'No especificado'}
Precio mensual: $${precio.toLocaleString('es-CL')}

Dirección: ${direccion}
Comuna: ${comuna}
Ciudad: ${ciudad || 'Santiago'}
Notas: ${notas || 'Sin notas'}

🐾 Confirma la transferencia antes de activar la suscripción.`,
      }),
    });

    return res.status(200).json({ ok: true, numeroSuscripcion });
  } catch (e) {
    console.error('suscripcion-transferencia error:', e);
    return res.status(500).json({ error: e.message });
  }
}
