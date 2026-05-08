export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Patas & Caos <contacto@patasycaos.cl>',
        to: ['contacto@patasycaos.cl'],
        subject: '🐾 Nueva suscripción al newsletter',
        text: `Nueva persona suscrita al newsletter de Patas & Caos:\n\nEmail: ${email}\n`,
      }),
    });

    if (!response.ok) return res.status(500).json({ error: 'Error al enviar email' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Error interno' });
  }
}
