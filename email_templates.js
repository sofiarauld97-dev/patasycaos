// ============================================================
// PLANTILLAS DE EMAIL — PATAS & CAOS
// ============================================================

function emailBase(contenido) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #F5EFE6; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #F5EFE6; padding: 32px 16px; }
    .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
    .header { background: #1C1007; padding: 28px 32px; text-align: center; }
    .header img { height: 48px; }
    .header-text { color: #F5EFE6; font-size: 13px; margin-top: 8px; letter-spacing: .04em; }
    .body { padding: 32px; }
    .titulo { font-size: 22px; font-weight: 800; color: #1C1007; margin: 0 0 8px; }
    .subtitulo { font-size: 15px; color: #666; margin: 0 0 24px; }
    .productos-tabla { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .productos-tabla th { background: #F5EFE6; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #888; border-bottom: 1.5px solid #e8ddd0; }
    .productos-tabla td { padding: 12px; border-bottom: 1px solid #f0e8df; font-size: 14px; color: #1C1007; vertical-align: middle; }
    .productos-tabla tr:last-child td { border-bottom: none; }
    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 2px solid #C4622D; margin-top: 8px; }
    .total-label { font-size: 15px; font-weight: 700; color: #1C1007; }
    .total-valor { font-size: 20px; font-weight: 900; color: #C4622D; }
    .info-box { background: #F5EFE6; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-box h3 { margin: 0 0 12px; font-size: 14px; color: #1C1007; font-weight: 700; }
    .info-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 14px; color: #444; }
    .info-row span:first-child { color: #888; min-width: 90px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 50px; font-size: 13px; font-weight: 700; }
    .badge-naranja { background: #C4622D; color: #fff; }
    .badge-verde { background: #4A7C59; color: #fff; }
    .badge-azul { background: #2980b9; color: #fff; }
    .cta-btn { display: block; text-align: center; background: #C4622D; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 700; margin: 24px 0; }
    .divider { border: none; border-top: 1px solid #f0e8df; margin: 24px 0; }
    .footer { text-align: center; padding: 24px 16px; font-size: 12px; color: #999; }
    .footer a { color: #C4622D; text-decoration: none; }
    .pata { font-size: 24px; display: block; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="https://www.patasycaos.cl/logo.png" alt="Patas & Caos">
        <div class="header-text">patasycaos.cl</div>
      </div>
      <div class="body">
        ${contenido}
      </div>
    </div>
    <div class="footer">
      © 2026 Patas & Caos · <a href="https://www.patasycaos.cl">patasycaos.cl</a> · <a href="https://instagram.com/patasycaoscl">@patasycaoscl</a><br>
      ¿Dudas? Escríbenos a <a href="mailto:contacto@patasycaos.cl">contacto@patasycaos.cl</a> o al <a href="https://wa.me/56923997854">+56 9 2399 7854</a>
    </div>
  </div>
</body>
</html>`;
}

function tablaProductos(items) {
  const filas = items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:right;font-weight:700">$${(i.price * i.qty).toLocaleString('es-CL')}</td>
    </tr>
  `).join('');
  return `
    <table class="productos-tabla">
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align:center">Cant.</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

// Fila de Subtotal + Envío que se muestra justo antes del Total, para que
// el cliente entienda la diferencia entre el valor de los productos y el total final.
function filasTotales(subtotal, costoEnvio) {
  if (subtotal === undefined || subtotal === null) return '';
  const envioTexto = costoEnvio > 0 ? `$${costoEnvio.toLocaleString('es-CL')}` : 'Gratis 🎉';
  return `
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#666">
      <span>Subtotal</span><span>$${subtotal.toLocaleString('es-CL')}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:4px 0 12px;font-size:14px;color:#666">
      <span>Envío</span><span>${envioTexto}</span>
    </div>
  `;
}

// ============================================================
// EMAIL 1: CONFIRMACIÓN DE PEDIDO
// ============================================================
export function emailConfirmacion({ nombre, items, subtotal, costoEnvio, total, direccion, comuna, ciudad, documento, esRetiro, numeroPedido }) {
  const envioTexto = esRetiro
    ? '🏠 Retiro en tienda — Providencia (coordinamos por WhatsApp)'
    : `🚚 Despacho a domicilio — ${direccion}, ${comuna}, ${ciudad}`;

  const infoEnvio = esRetiro ? `
    <p>📲 Te contactaremos por WhatsApp para coordinar el horario y la dirección exacta de retiro.</p>
  ` : `
    <p>🚀 <strong>Santiago:</strong> Entrega el mismo día para pedidos realizados antes de las 10:00 AM en días hábiles. Pedidos posteriores se despachan al día hábil siguiente.</p>
    <p>🗺️ <strong>Regiones:</strong> Entre 3 y 7 días hábiles según la región. Te coordinaremos por WhatsApp antes de confirmar el despacho.</p>
    <p>💬 Recibirás una notificación por WhatsApp con la hora estimada de llegada.</p>
  `;

  const contenido = `
    <span class="pata">🐾</span>
    ${numeroPedido ? `<div style="text-align:center;margin-bottom:16px"><span style="background:#F5EFE6;border:1.5px solid #C4622D;border-radius:50px;padding:6px 18px;font-size:.85rem;font-weight:700;color:#C4622D">PAC-${String(numeroPedido).padStart(5,'0')}</span></div>` : ''}
    <p class="titulo">¡Recibimos tu pedido, ${nombre.split(' ')[0]}!</p>
    <p class="subtitulo">Tu pago fue aprobado. Aquí está el resumen de tu compra:</p>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio)}
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #C4622D">
        <span class="total-label">Total pagado</span>
        <span class="total-valor">$${total.toLocaleString('es-CL')}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="info-box">
      <h3>📦 Información de entrega</h3>
      <p style="font-size:14px;color:#444;margin:0 0 12px">${envioTexto}</p>
      ${infoEnvio}
    </div>

    <div class="info-box">
      <h3>🔄 Cambios y devoluciones</h3>
      <p style="font-size:14px;color:#444;margin:0">Tienes <strong>10 días hábiles</strong> desde que recibes el producto para solicitar un cambio o devolución. El producto debe estar sin uso, en su embalaje original y con la boleta. Escríbenos por WhatsApp al <a href="https://wa.me/56923997854" style="color:#C4622D">+56 9 2399 7854</a> o a <a href="mailto:contacto@patasycaos.cl" style="color:#C4622D">contacto@patasycaos.cl</a>.</p>
    </div>

    <a href="https://wa.me/56923997854" class="cta-btn">💬 Consultar por mi pedido</a>
    <p style="text-align:center;font-size:13px;color:#999">También puedes escribirnos a contacto@patasycaos.cl</p>
  `;

  return {
    subject: `🐾 ¡Pedido recibido! — Patas & Caos`,
    html: emailBase(contenido)
  };
}

// ============================================================
// EMAIL 2: EN DESPACHO
// ============================================================
export function emailDespacho({ nombre, items, subtotal, costoEnvio, total, direccion, comuna, ciudad, esRetiro }) {
  const mensaje = esRetiro
    ? '¡Tu pedido está listo para retiro! 📲 Te contactaremos por WhatsApp para coordinar el horario y la dirección exacta.'
    : '¡Tu pedido ya está en camino! 🚚 Recibirás un mensaje de WhatsApp con la hora estimada de llegada.';

  const contenido = `
    <span class="pata">🚚</span>
    <p class="titulo">${esRetiro ? '¡Tu pedido está listo!' : '¡Tu pedido va en camino!'}</p>
    <p class="subtitulo">${mensaje}</p>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio)}
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #C4622D">
        <span class="total-label">Total</span>
        <span class="total-valor">$${total.toLocaleString('es-CL')}</span>
      </div>
    </div>

    <hr class="divider">

    ${!esRetiro ? `
    <div class="info-box">
      <h3>📍 Dirección de entrega</h3>
      <p style="font-size:14px;color:#444;margin:0">${direccion}, ${comuna}, ${ciudad}</p>
    </div>
    ` : ''}

    <div class="info-box">
      <h3>💬 Seguimiento de tu pedido</h3>
      <p style="font-size:14px;color:#444;margin:0">Ante cualquier consulta sobre tu despacho escríbenos directamente por WhatsApp.</p>
    </div>

    <a href="https://wa.me/56923997854" class="cta-btn">💬 Consultar mi despacho</a>
  `;

  return {
    subject: esRetiro ? '📦 ¡Tu pedido está listo para retiro! — Patas & Caos' : '🚚 ¡Tu pedido va en camino! — Patas & Caos',
    html: emailBase(contenido)
  };
}

// ============================================================
// EMAIL 3: ENTREGADO
// ============================================================
export function emailEntregado({ nombre, items, subtotal, costoEnvio, total }) {
  const contenido = `
    <span class="pata">🎉</span>
    <p class="titulo">¡Llegó tu pedido, ${nombre.split(' ')[0]}!</p>
    <p class="subtitulo">Esperamos que tus mascotas estén felices con lo que eligiste. 🐾</p>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio)}
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #C4622D">
        <span class="total-label">Total</span>
        <span class="total-valor">$${total.toLocaleString('es-CL')}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="info-box">
      <h3>🔄 ¿Algo no quedó bien?</h3>
      <p style="font-size:14px;color:#444;margin:0">Tienes <strong>10 días hábiles</strong> para solicitar un cambio o devolución. Escríbenos por WhatsApp al <a href="https://wa.me/56923997854" style="color:#C4622D">+56 9 2399 7854</a> con tu boleta y te ayudamos de inmediato.</p>
    </div>

    <a href="https://instagram.com/patasycaoscl" class="cta-btn">📸 Síguenos en Instagram @patasycaoscl</a>

    <p style="text-align:center;font-size:14px;color:#666">¿Te gustó tu experiencia? Cuéntanos — cada mensaje importa. 🐾</p>
  `;

  return {
    subject: `🎉 ¡Tu pedido llegó! — Patas & Caos`,
    html: emailBase(contenido)
  };
}

// ============================================================
// EMAIL 4: CONFIRMACIÓN POR TRANSFERENCIA
// ============================================================
export function emailTransferencia({ nombre, items, subtotal, costoEnvio, total, direccion, comuna, ciudad, esRetiro, numeroPedido }) {
  const envioTexto = esRetiro
    ? '🏠 Retiro en tienda — Providencia (coordinamos por WhatsApp)'
    : `🚚 Despacho a domicilio — ${direccion}, ${comuna}, ${ciudad}`;

  const contenido = `
    <div style="font-size:32px;text-align:center;margin-bottom:12px">🏦</div>
    <p class="titulo">¡Recibimos tu pedido, ${nombre.split(' ')[0]}!</p>
    <p class="subtitulo">Para confirmar tu pedido, realiza la transferencia en las próximas <strong>48 horas</strong>. Una vez confirmado el pago, prepararemos tu pedido.</p>

    <div style="background:#fff8f0;border:2px solid #C4622D;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
      <p style="font-size:13px;font-weight:700;color:#C4622D;margin:0 0 16px;text-transform:uppercase;letter-spacing:.05em">Número de pedido</p>
      <p style="font-size:28px;font-weight:900;color:#1C1007;margin:0;letter-spacing:.05em">PAC-${String(numeroPedido).padStart(5,'0')}</p>
      <p style="font-size:12px;color:#888;margin:8px 0 0">Inclúyelo en el comentario de la transferencia</p>
    </div>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio)}
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #C4622D">
        <span style="font-size:15px;font-weight:700;color:#1C1007">Total a transferir</span>
        <span style="font-size:20px;font-weight:900;color:#C4622D">$${total.toLocaleString('es-CL')}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="info-box">
      <h3>🏦 Datos bancarios</h3>
      <table style="width:100%;font-size:14px;color:#444;border-collapse:collapse">
        <tr><td style="padding:5px 0;color:#888;width:130px">Banco</td><td style="font-weight:700;color:#1C1007">Mercado Pago</td></tr>
        <tr><td style="padding:5px 0;color:#888">Tipo de cuenta</td><td style="font-weight:700;color:#1C1007">Cuenta Vista</td></tr>
        <tr><td style="padding:5px 0;color:#888">Número</td><td style="font-weight:700;color:#1C1007">1000264809</td></tr>
        <tr><td style="padding:5px 0;color:#888">RUT</td><td style="font-weight:700;color:#1C1007">78.413.784-8</td></tr>
        <tr><td style="padding:5px 0;color:#888">Titular</td><td style="font-weight:700;color:#1C1007">Comercializadora Rauld SpA</td></tr>
        <tr><td style="padding:5px 0;color:#888">Email</td><td style="font-weight:700;color:#1C1007">contacto@patasycaos.cl</td></tr>
      </table>
    </div>

    <div style="background:#fff3cd;border:1.5px solid #ffc107;border-radius:12px;padding:16px;margin:16px 0">
      <p style="font-size:14px;font-weight:700;color:#856404;margin:0 0 6px">⚠️ Importante</p>
      <p style="font-size:13px;color:#856404;margin:0">Tu pedido será <strong>cancelado automáticamente</strong> si no recibimos el comprobante dentro de las próximas <strong>48 horas</strong>. Una vez transferido, envíanos el comprobante por WhatsApp o email.</p>
    </div>

    <div class="info-box">
      <h3>📦 Información de entrega</h3>
      <p style="font-size:14px;color:#444;margin:0">${envioTexto}</p>
    </div>

    <a href="https://wa.me/56923997854?text=Hola%2C%20acabo%20de%20transferir%20por%20el%20pedido%20PAC-${String(numeroPedido).padStart(5,'0')}" class="cta-btn">📲 Enviar comprobante por WhatsApp</a>
    <p style="text-align:center;font-size:13px;color:#999">O envíalo a <a href="mailto:contacto@patasycaos.cl" style="color:#C4622D">contacto@patasycaos.cl</a></p>
  `;

  return {
    subject: `🏦 Pedido PAC-${String(numeroPedido).padStart(5,'0')} — Completa tu transferencia`,
    html: emailBase(contenido)
  };
}

// ============================================================
// EMAIL 5: PEDIDO CANCELADO
// ============================================================
export function emailCancelado({ nombre, items, subtotal, costoEnvio, total, numeroPedido }) {
  const numStr = numeroPedido ? 'PAC-' + String(numeroPedido).padStart(5, '0') : '';
  const contenido = `
    <div style="font-size:32px;text-align:center;margin-bottom:12px">❌</div>
    <p class="titulo">Tu pedido fue cancelado</p>
    <p class="subtitulo">Hola ${nombre.split(' ')[0]}, lamentamos informarte que tu pedido ${numStr ? '<strong>' + numStr + '</strong>' : ''} fue cancelado.</p>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio)}
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #C4622D">
        <span style="font-size:15px;font-weight:700;color:#1C1007">Total</span>
        <span style="font-size:20px;font-weight:900;color:#C4622D">$${total.toLocaleString('es-CL')}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="info-box">
      <h3>💬 ¿Tienes dudas?</h3>
      <p style="font-size:14px;color:#444;margin:0">Si crees que esto es un error o quieres saber más, escríbenos por WhatsApp al <a href="https://wa.me/56923997854" style="color:#C4622D">+56 9 2399 7854</a> o a <a href="mailto:contacto@patasycaos.cl" style="color:#C4622D">contacto@patasycaos.cl</a>.</p>
    </div>

    <a href="https://www.patasycaos.cl/tienda" class="cta-btn">🛍️ Volver a la tienda</a>
  `;

  return {
    subject: `❌ Tu pedido${numStr ? ' ' + numStr : ''} fue cancelado — Patas & Caos`,
    html: emailBase(contenido)
  };
}
