const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_KEY = process.env.ADMIN_PANEL_KEY;

function responder(res, status, body) {
  return res.status(status).json(body);
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.hint ||
      `Supabase respondió ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return responder(res, 405, { error: 'Método no permitido.' });
  }

  if (!SUPABASE_URL || !SERVICE_KEY || !ADMIN_KEY) {
    return responder(res, 500, {
      error: 'Faltan variables SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o ADMIN_PANEL_KEY en Vercel.'
    });
  }

  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return responder(res, 401, { error: 'Clave de administrador incorrecta.' });
  }

  const { tipo, id } = req.body || {};
  const numericId = Number(id);

  if (!['pedido', 'suscripcion'].includes(tipo) || !Number.isInteger(numericId) || numericId <= 0) {
    return responder(res, 400, { error: 'Tipo o ID inválido.' });
  }

  const tabla = tipo === 'pedido' ? 'Pedidos' : 'Suscripciones';

  try {
    // For subscriptions, verify that an automatic MP subscription is cancelled first.
    if (tipo === 'suscripcion') {
      const rows = await supabaseRequest(
        `${tabla}?id=eq.${numericId}&select=id,estado,mp_preapproval_id`
      );
      const sus = Array.isArray(rows) ? rows[0] : null;

      if (!sus) {
        return responder(res, 404, { error: 'La suscripción ya no existe.' });
      }

      if (
        sus.mp_preapproval_id &&
        String(sus.estado || '').toLowerCase() !== 'cancelada'
      ) {
        return responder(res, 409, {
          error: 'Primero debes cancelar la suscripción para detener el cobro automático de Mercado Pago.'
        });
      }
    }

    // Prefer return=representation to prove the row was really deleted.
    const deletedRows = await supabaseRequest(
      `${tabla}?id=eq.${numericId}&select=id`,
      {
        method: 'DELETE',
        headers: { Prefer: 'return=representation' }
      }
    );

    const deleted =
      Array.isArray(deletedRows) &&
      deletedRows.some(row => Number(row.id) === numericId);

    if (!deleted) {
      return responder(res, 409, {
        error: `Supabase no confirmó la eliminación en la tabla ${tabla}.`
      });
    }

    return responder(res, 200, {
      ok: true,
      deleted: true,
      tipo,
      id: numericId
    });
  } catch (error) {
    console.error('[admin-eliminar-registro]', error);
    return responder(res, 500, {
      error: error.message || 'Error interno eliminando el registro.'
    });
  }
}
