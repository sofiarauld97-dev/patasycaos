export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, mp_preapproval_id } = req.body;
  if (!id || !mp_preapproval_id) return res.status(400).json({ error: 'Faltan datos' });

  try {
    // 1. Cancelar en Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${mp_preapproval_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error('MP cancelación error:', mpData);
      return res.status(500).json({ error: 'Error al cancelar en Mercado Pago', detail: mpData });
    }

    // 2. Actualizar estado en Supabase
    const sbRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/Suscripciones?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ estado: 'cancelada' }),
    });

    if (!sbRes.ok) {
      return res.status(500).json({ error: 'Cancelado en MP pero error al actualizar Supabase' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error:', e);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
