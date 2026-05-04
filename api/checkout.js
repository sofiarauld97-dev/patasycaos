export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in cart' });
  }

  const mpItems = items.map(item => ({
    title: item.name,
    quantity: item.qty,
    unit_price: item.price,
    currency_id: 'CLP',
  }));

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: mpItems,
        back_urls: {
          success: 'https://patasycaos.cl/?pago=ok',
          failure: 'https://patasycaos.cl/?pago=error',
          pending: 'https://patasycaos.cl/?pago=pendiente',
        },
        auto_return: 'approved',
        statement_descriptor: 'PATAS & CAOS',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Error al crear preferencia de pago' });
    }

    return res.status(200).json({ init_point: data.init_point });

  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
