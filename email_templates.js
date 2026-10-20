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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { margin:0; padding:0; background:#F5ECD7; font-family:'Poppins',Arial,sans-serif; color:#1A1A1A; }
    .wrapper { font-family:'Poppins',Arial,sans-serif; max-width:600px; margin:0 auto; padding:28px 14px; }
    .card { background:#FFFFFF; border-radius:18px; overflow:hidden; border:1px solid #E9D9C6; }
    .header { background:#F5ECD7; padding:28px 20px 23px; text-align:center; border-top:5px solid #C4622D; border-bottom:1px solid #E7D8C5; }
    .header img { display:block; height:70px; width:auto; max-width:210px; margin:0 auto; object-fit:contain; }
    .header-text { color:#725B48; font-size:12px; margin-top:12px; letter-spacing:.08em; font-weight:700; }
    .body { padding:32px; }
    .titulo { font-size:23px; line-height:1.3; font-weight:800; color:#1C1007; margin:0 0 10px; }
    .subtitulo { font-size:14px; color:#6B5A4E; line-height:1.65; margin:0 0 24px; }
    .productos-tabla { font-family:'Poppins',Arial,sans-serif; width:100%; border-collapse:collapse; margin:20px 0; }
    .productos-tabla th { background:#F8F2E7; text-align:left; padding:12px; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:#715F50; border-bottom:1px solid #E7D8C5; }
    .productos-tabla td { padding:14px 12px; border-bottom:1px solid #F0E8DF; font-size:13px; color:#1C1007; vertical-align:middle; }
    .total-row { display:block; padding:16px 0; margin-top:8px; }
    .total-label { font-size:15px; font-weight:700; color:#1C1007; }
    .total-valor { font-size:21px; font-weight:800; color:#C4622D; }
    .info-box { background:#F8F2E7; border:1px solid #EDE0CF; border-radius:12px; padding:20px; margin:20px 0; }
    .info-box h3 { margin:0 0 12px; font-size:14px; color:#1C1007; font-weight:700; }
    .info-box p { font-size:13px; line-height:1.7; color:#524437; }
    .info-row { margin-bottom:6px; font-size:14px; color:#444; }
    .badge { display:inline-block; padding:6px 14px; border-radius:50px; font-size:13px; font-weight:700; }
    .badge-naranja { background:#C4622D; color:#fff; }
    .badge-verde { background:#4A7C59; color:#fff; }
    .badge-azul { background:#2980b9; color:#fff; }
    .cta-btn { display:block; text-align:center; background:#C4622D; color:#fff !important; text-decoration:none; padding:15px 20px; border-radius:50px; font-size:14px; font-weight:700; margin:26px 0 12px; }
    .divider { border:0; border-top:1px solid #EFE4D6; margin:25px 0; }
    .footer { text-align:center; padding:24px 16px; font-size:11px; color:#746456; line-height:1.9; }
    .footer a { color:#A8501F; text-decoration:none; }
    .pata { font-size:25px; display:block; margin-bottom:12px; }
    @media only screen and (max-width:480px) { .wrapper{padding:12px 8px;} .body{padding:24px 18px;} .header{padding:24px 12px 20px;} .titulo{font-size:21px;} .productos-tabla td{padding:11px 7px;} }
  </style>
</head>
<body style="font-family:'Poppins',Arial,sans-serif">
  <div class="wrapper" style="font-family:'Poppins',Arial,sans-serif">
    <div class="card">
      <div class="header" style="background:#F5ECD7;border-top:5px solid #C4622D;border-bottom:1px solid #E7D8C5;text-align:center;padding:28px 20px 23px">
        <img src="https://www.patasycaos.cl/logo.png" alt="Patas & Caos" width="140" style="display:block;height:70px;width:auto;max-width:210px;margin:0 auto;object-fit:contain">
        <div class="header-text" style="color:#725B48;font-size:12px;margin-top:12px;letter-spacing:.08em;font-weight:700">PATAS & CAOS · PATASYCAOS.CL</div>
      </div>
      <div class="body">${contenido}</div>
    </div>
    <div class="footer">
      © 2026 Patas & Caos · <a href="https://www.patasycaos.cl">patasycaos.cl</a> · <a href="https://instagram.com/patasycaoscl">@patasycaoscl</a><br>
      ¿Dudas? <a href="mailto:contacto@patasycaos.cl">contacto@patasycaos.cl</a> · <a href="https://wa.me/56923997854">WhatsApp</a>
    </div>
  </div>
</body>
</html>`;
}

function escaparHtml(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function imagenProducto(item) {
  const url = item?.image || item?.imagen || '';
  if (typeof url !== 'string' || !/^https:\/\/www\.patasycaos\.cl\//i.test(url)) return '';
  return `<img src="${escaparHtml(url)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:9px;border:1px solid #E9E1D5;" />`;
}

function tablaProductos(items) {
  const filas = (Array.isArray(items) ? items : []).map(i => {
    const foto = imagenProducto(i);
    const precio = (Number(i.price) || 0) * (Number(i.qty) || 0);
    return `<tr>
      ${foto ? `<td width="68" style="width:68px;padding:12px 12px 12px 0;vertical-align:middle;">${foto}</td>` : ''}
      <td style="padding:12px 6px 12px 0;vertical-align:middle;overflow-wrap:anywhere;">
        <div style="font-size:13px;font-weight:600;line-height:1.5;color:#1C1007;">${escaparHtml(i.name)}</div>
        <div style="font-size:11px;line-height:1.5;color:#7B7169;margin-top:3px;">Cantidad: ${Number(i.qty) || 0}</div>
      </td>
      <td style="text-align:right;padding:12px 0 12px 6px;white-space:nowrap;vertical-align:middle;font-size:13px;font-weight:700;color:#1C1007;">$${precio.toLocaleString('es-CL')}</td>
    </tr>`;
  }).join('');
  return `<table class="productos-tabla" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:20px 0;table-layout:auto;">${filas}</table>`;
}

// Fila de Subtotal + Envío que se muestra justo antes del Total, para que
// el cliente entienda la diferencia entre el valor de los productos y el total final.
// Se usa una tabla (no flex/grid) porque muchos clientes de correo (Gmail, Outlook, etc.)
// ignoran display:flex y las columnas quedan pegadas sin separación.
function filasTotales(subtotal, costoEnvio, esRetiro = false) {
  if (subtotal === undefined || subtotal === null) return '';
  const envioTexto = esRetiro ? 'Retiro gratuito' : costoEnvio > 0 ? `$${costoEnvio.toLocaleString('es-CL')}` : 'Envío gratis';
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#666">
      <tr>
        <td style="padding:4px 0;text-align:left">Subtotal</td>
        <td style="padding:4px 0;text-align:right">$${subtotal.toLocaleString('es-CL')}</td>
      </tr>
      <tr>
        <td style="padding:4px 0 12px;text-align:left">${esRetiro ? 'Entrega' : 'Despacho'}</td>
        <td style="padding:4px 0 12px;text-align:right">${envioTexto}</td>
      </tr>
    </table>
  `;
}


function numeroPedidoFormateado(numeroPedido) {
  if (numeroPedido === undefined || numeroPedido === null || numeroPedido === '') return '';
  return 'PAC-' + String(numeroPedido).padStart(5, '0');
}
function etiquetaNumeroPedido(numeroPedido) {
  const num = numeroPedidoFormateado(numeroPedido);
  return num ? `<div style="text-align:center;margin:0 0 18px"><span style="display:inline-block;background:#F8F2E7;border:1px solid #E8C7B0;border-radius:50px;padding:8px 18px;font-size:13px;font-weight:700;color:#C4622D">Pedido ${num}</span></div>` : '';
}

// ============================================================
// EMAIL 1: CONFIRMACIÓN DE PEDIDO
// ============================================================
export function emailConfirmacion({ nombre, items, subtotal, costoEnvio, total, direccion, comuna, ciudad, documento, esRetiro, numeroPedido, esPedidoManual = false }) {
  const envioTexto = esRetiro
    ? 'Retiro en tienda — Providencia (coordinamos por WhatsApp)'
    : `Despacho a domicilio — ${direccion}, ${comuna}, ${ciudad}`;

  const infoEnvio = esRetiro ? `
    <p>Te contactaremos por WhatsApp para coordinar el horario y la dirección exacta de retiro.</p>
  ` : `
    <p> <strong>Santiago:</strong> Entrega el mismo día para pedidos realizados antes de las 10:00 AM en días hábiles. Pedidos posteriores se despachan al día hábil siguiente.</p>
    <p> <strong>Regiones:</strong> Entre 3 y 7 días hábiles según la región. Te coordinaremos por WhatsApp antes de confirmar el despacho.</p>
    <p>Recibirás una notificación por WhatsApp con la hora estimada de llegada.</p>
  `;

  const contenido = `
    <div style="color:#4A7C59;font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;margin:0 0 12px">Confirmación de compra</div>
    ${etiquetaNumeroPedido(numeroPedido)}
    <p class="titulo">¡Recibimos tu pedido, ${nombre.split(' ')[0]}!</p>
    <p class="subtitulo">Gracias por elegirnos. Aquí encontrarás el detalle de tu pedido y la información de entrega.</p>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio, esRetiro)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C4622D">
        <tr>
          <td class="total-label" style="padding-top:12px;text-align:left">${esPedidoManual ? 'Total del pedido' : 'Total pagado'}</td>
          <td class="total-valor" style="padding-top:12px;text-align:right">$${total.toLocaleString('es-CL')}</td>
        </tr>
      </table>
    </div>

    <hr class="divider">

    <div class="info-box">
      <h3>Información de entrega</h3>
      <p style="font-size:14px;color:#444;margin:0 0 12px">${envioTexto}</p>
      ${infoEnvio}
    </div>

    <div class="info-box">
      <h3>Cambios y devoluciones</h3>
      <p style="font-size:14px;color:#444;margin:0">Tienes <strong>10 días hábiles</strong> desde que recibes el producto para solicitar un cambio o devolución. El producto debe estar sin uso, en su embalaje original y con la boleta. Escríbenos por WhatsApp al <a href="https://wa.me/56923997854" style="color:#C4622D">+56 9 2399 7854</a> o a <a href="mailto:contacto@patasycaos.cl" style="color:#C4622D">contacto@patasycaos.cl</a>.</p>
    </div>

    <a href="https://wa.me/56923997854" class="cta-btn">Consultar por mi pedido</a>
    <p style="text-align:center;font-size:13px;color:#999">También puedes escribirnos a contacto@patasycaos.cl</p>
  `;

  return {
    subject: `Pedido recibido${numeroPedidoFormateado(numeroPedido) ? " " + numeroPedidoFormateado(numeroPedido) : ""} — Patas & Caos`,
    html: emailBase(contenido)
  };
}

// ============================================================
// EMAIL 2: EN DESPACHO
// ============================================================
export function emailDespacho({ nombre, items, subtotal, costoEnvio, total, direccion, comuna, ciudad, esRetiro, numeroPedido }) {
  const mensaje = esRetiro
    ? '¡Tu pedido está listo para retiro! Te contactaremos por WhatsApp para coordinar el horario y la dirección exacta.'
    : '¡Tu pedido ya está en camino! Recibirás un mensaje de WhatsApp con la hora estimada de llegada.';

  const contenido = `
    ${etiquetaNumeroPedido(numeroPedido)}
    <p class="titulo">${esRetiro ? '¡Tu pedido está listo!' : '¡Tu pedido va en camino!'}</p>
    <p class="subtitulo">${mensaje}</p>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio, esRetiro)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C4622D">
        <tr>
          <td class="total-label" style="padding-top:12px;text-align:left">Total</td>
          <td class="total-valor" style="padding-top:12px;text-align:right">$${total.toLocaleString('es-CL')}</td>
        </tr>
      </table>
    </div>

    <hr class="divider">

    ${!esRetiro ? `
    <div class="info-box">
      <h3>Dirección de entrega</h3>
      <p style="font-size:14px;color:#444;margin:0">${direccion}, ${comuna}, ${ciudad}</p>
    </div>
    ` : ''}

    <div class="info-box">
      <h3>Seguimiento de tu pedido</h3>
      <p style="font-size:14px;color:#444;margin:0">Ante cualquier consulta sobre tu despacho escríbenos directamente por WhatsApp.</p>
    </div>

    <a href="https://wa.me/56923997854" class="cta-btn">Consultar mi despacho</a>
  `;

  return {
    subject: esRetiro ? `Pedido ${numeroPedidoFormateado(numeroPedido)} listo para retiro — Patas & Caos` : `Pedido ${numeroPedidoFormateado(numeroPedido)} en camino — Patas & Caos`,
    html: emailBase(contenido)
  };
}

// ============================================================
// EMAIL 3: ENTREGADO
// ============================================================
export function emailEntregado({ nombre, items, subtotal, costoEnvio, total, esRetiro = false, numeroPedido }) {
  const contenido = `
    ${etiquetaNumeroPedido(numeroPedido)}
    <p class="titulo">¡Llegó tu pedido, ${nombre.split(' ')[0]}!</p>
    <p class="subtitulo">Esperamos que tus mascotas estén felices con lo que eligiste.</p>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio, esRetiro)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C4622D">
        <tr>
          <td class="total-label" style="padding-top:12px;text-align:left">Total</td>
          <td class="total-valor" style="padding-top:12px;text-align:right">$${total.toLocaleString('es-CL')}</td>
        </tr>
      </table>
    </div>

    <hr class="divider">

    <div class="info-box">
      <h3>¿Algo no quedó bien?</h3>
      <p style="font-size:14px;color:#444;margin:0">Tienes <strong>10 días hábiles</strong> para solicitar un cambio o devolución. Escríbenos por WhatsApp al <a href="https://wa.me/56923997854" style="color:#C4622D">+56 9 2399 7854</a> con tu boleta y te ayudamos de inmediato.</p>
    </div>

    <a href="https://instagram.com/patasycaoscl" class="cta-btn">Síguenos en Instagram @patasycaoscl</a>

    <p style="text-align:center;font-size:14px;color:#666">¿Te gustó tu experiencia? Cuéntanos — cada mensaje importa.</p>
  `;

  return {
    subject: `Pedido ${numeroPedidoFormateado(numeroPedido)} entregado — Patas & Caos`,
    html: emailBase(contenido)
  };
}

// ============================================================
// EMAIL 4: CONFIRMACIÓN POR TRANSFERENCIA
// ============================================================
export function emailTransferencia({ nombre, items, subtotal, costoEnvio, total, direccion, comuna, ciudad, esRetiro, numeroPedido }) {
  const envioTexto = esRetiro
    ? 'Retiro en tienda — Providencia (coordinamos por WhatsApp)'
    : `Despacho a domicilio — ${direccion}, ${comuna}, ${ciudad}`;

  const contenido = `
    ${etiquetaNumeroPedido(numeroPedido)}
    <p class="titulo">¡Recibimos tu pedido, ${nombre.split(' ')[0]}!</p>
    <p class="subtitulo">Para confirmar tu pedido, realiza la transferencia en las próximas <strong>48 horas</strong>. Una vez confirmado el pago, prepararemos tu pedido.</p>

    <div style="background:#fff8f0;border:2px solid #C4622D;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
      <p style="font-size:13px;font-weight:700;color:#C4622D;margin:0 0 16px;text-transform:uppercase;letter-spacing:.05em">Número de pedido</p>
      <p style="font-size:28px;font-weight:900;color:#1C1007;margin:0;letter-spacing:.05em">PAC-${String(numeroPedido).padStart(5,'0')}</p>
      <p style="font-size:12px;color:#888;margin:8px 0 0">Inclúyelo en el comentario de la transferencia</p>
    </div>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio, esRetiro)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C4622D">
        <tr>
          <td style="padding-top:12px;text-align:left;font-size:15px;font-weight:700;color:#1C1007">Total a transferir</td>
          <td style="padding-top:12px;text-align:right;font-size:20px;font-weight:900;color:#C4622D">$${total.toLocaleString('es-CL')}</td>
        </tr>
      </table>
    </div>

    <hr class="divider">

    <div class="info-box">
      <h3>Datos bancarios</h3>
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
      <p style="font-size:14px;font-weight:700;color:#856404;margin:0 0 6px">Importante</p>
      <p style="font-size:13px;color:#856404;margin:0">Tu pedido será <strong>cancelado automáticamente</strong> si no recibimos el comprobante dentro de las próximas <strong>48 horas</strong>. Una vez transferido, envíanos el comprobante por WhatsApp o email.</p>
    </div>

    <div class="info-box">
      <h3>Información de entrega</h3>
      <p style="font-size:14px;color:#444;margin:0">${envioTexto}</p>
    </div>

    <a href="https://wa.me/56923997854?text=Hola%2C%20acabo%20de%20transferir%20por%20el%20pedido%20PAC-${String(numeroPedido).padStart(5,'0')}" class="cta-btn">Enviar comprobante por WhatsApp</a>
    <p style="text-align:center;font-size:13px;color:#999">O envíalo a <a href="mailto:contacto@patasycaos.cl" style="color:#C4622D">contacto@patasycaos.cl</a></p>
  `;

  return {
    subject: `Pedido ${numeroPedidoFormateado(numeroPedido)} — Completa tu transferencia`,
    html: emailBase(contenido)
  };
}

// ============================================================
// EMAIL 5: PEDIDO CANCELADO
// ============================================================
export function emailCancelado({ nombre, items, subtotal, costoEnvio, total, numeroPedido, esRetiro = false }) {
  const numStr = numeroPedido ? 'PAC-' + String(numeroPedido).padStart(5, '0') : '';
  const contenido = `
    ${etiquetaNumeroPedido(numeroPedido)}
    <p class="titulo">Tu pedido fue cancelado</p>
    <p class="subtitulo">Hola ${nombre.split(' ')[0]}, lamentamos informarte que tu pedido ${numStr ? '<strong>' + numStr + '</strong>' : ''} fue cancelado.</p>

    ${tablaProductos(items)}

    <div class="total-row" style="display:block;padding-top:0">
      ${filasTotales(subtotal, costoEnvio, esRetiro)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C4622D">
        <tr>
          <td style="padding-top:12px;text-align:left;font-size:15px;font-weight:700;color:#1C1007">Total</td>
          <td style="padding-top:12px;text-align:right;font-size:20px;font-weight:900;color:#C4622D">$${total.toLocaleString('es-CL')}</td>
        </tr>
      </table>
    </div>

    <hr class="divider">

    <div class="info-box">
      <h3>¿Tienes dudas?</h3>
      <p style="font-size:14px;color:#444;margin:0">Si crees que esto es un error o quieres saber más, escríbenos por WhatsApp al <a href="https://wa.me/56923997854" style="color:#C4622D">+56 9 2399 7854</a> o a <a href="mailto:contacto@patasycaos.cl" style="color:#C4622D">contacto@patasycaos.cl</a>.</p>
    </div>

    <a href="https://www.patasycaos.cl/tienda" class="cta-btn">Volver a la tienda</a>
  `;

  return {
    subject: `Pedido${numStr ? ' ' + numStr : ''} cancelado — Patas & Caos`,
    html: emailBase(contenido)
  };
}
