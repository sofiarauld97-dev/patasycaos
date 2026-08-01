#!/usr/bin/env node
/**
 * generar-productos.js
 *
 * Genera los HTML estáticos de /productos a partir de:
 *   - templates/producto.html   (plantilla con tokens __ASI__)
 *   - components/header.html    (se inserta físicamente, no por fetch)
 *   - components/footer.html    (idem)
 *   - data/productos.json       (datos reales de cada producto)
 *
 * Uso:
 *   node scripts/generar-productos.js                → genera TODOS los productos de data/productos.json
 *   node scripts/generar-productos.js --slug=caldo... → genera solo un producto (para pruebas)
 *   node scripts/generar-productos.js --test          → genera solo los productos marcados "test": true
 *
 * No inventa datos: si a un producto le falta un campo obligatorio,
 * el script se detiene y avisa cuál falta y en qué producto, en vez
 * de rellenarlo con un valor por defecto.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'producto.html');
const HEADER_PATH = path.join(ROOT, 'components', 'header.html');
const FOOTER_PATH = path.join(ROOT, 'components', 'footer.html');
const DATA_PATH = path.join(ROOT, 'data', 'productos.json');
const OUTPUT_DIR = path.join(ROOT, 'productos');

const SITE_URL = 'https://www.patasycaos.cl';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function leer(rutaAbs) {
  if (!fs.existsSync(rutaAbs)) {
    throw new Error(`Falta el archivo requerido: ${rutaAbs}`);
  }
  return fs.readFileSync(rutaAbs, 'utf-8');
}

const CAMPOS_OBLIGATORIOS = [
  'slug', 'nombre', 'seoTitle', 'seoDescription', 'precio', 'precioDisplay',
  'categoria', 'etiquetaProducto', 'sku', 'imagenes', 'caracteristicas'
];

function validarProducto(p) {
  const faltantes = CAMPOS_OBLIGATORIOS.filter(campo => {
    const v = p[campo];
    if (Array.isArray(v)) return v.length === 0;
    return v === undefined || v === null || v === '';
  });
  if (faltantes.length) {
    throw new Error(
      `Producto "${p.slug || '(sin slug)'}" no tiene los campos: ${faltantes.join(', ')}. ` +
      `No se genera nada inventado — corrige data/productos.json.`
    );
  }
}

function construirThumbs(p) {
  // La ficha original (caldo-de-huesos) siempre renderiza la tira de
  // miniaturas, incluso con una sola imagen — se replica igual aquí.
  if (!p.imagenes || p.imagenes.length === 0) return '';
  return `<div class="product-thumbs">` +
    p.imagenes.map(img =>
      `<img alt="${escapeHtml(p.nombre)}" loading="lazy" onclick="changeProductImage(this)" src="${img}">`
    ).join('') +
    `</div>`;
}

function construirDetalles(p) {
  const tituloCaracteristicas = escapeHtml(p.caracTitulo || 'Características');

  const caracteristicasHtml =
    `<section class="product-detail-block product-detail-features">` +
      `<h2>${tituloCaracteristicas}</h2>` +
      `<ul class="product-feature-list">` +
        p.caracteristicas.map(c => `<li>${escapeHtml(c)}</li>`).join('') +
      `</ul>` +
    `</section>`;

  const tieneIngredientes = !!(p.ingredientes && p.ingredientes.trim());

  const ingredientesHtml = tieneIngredientes
    ? `<section class="product-detail-block product-detail-ingredients">` +
        `<h2>Ingredientes</h2>` +
        `<p>${escapeHtml(p.ingredientes)}</p>` +
      `</section>`
    : '';

  return `<section class="product-details-v2" aria-label="Información del producto">` +
    caracteristicasHtml +
    ingredientesHtml +
  `</section>`;
}

function construirJsonLd(p) {
  const imagenAbsoluta = p.imagenes[0].startsWith('http') ? p.imagenes[0] : `${SITE_URL}${p.imagenes[0]}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nombre,
    description: p.seoDescription,
    image: [imagenAbsoluta],
    sku: p.sku,
    category: p.categoria,
    brand: p.marca ? { '@type': 'Brand', name: p.marca } : undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/productos/${p.slug}`,
      priceCurrency: 'CLP',
      price: String(p.precio),
      itemCondition: 'https://schema.org/NewCondition'
    }
  };
  return JSON.stringify(data);
}

function generarHtml(p, plantilla, headerHtml, footerHtml) {
  const canonical = `${SITE_URL}/productos/${p.slug}`;
  const imagenPrincipal = p.imagenes[0];
  const imagenAbsoluta = imagenPrincipal.startsWith('http') ? imagenPrincipal : `${SITE_URL}${imagenPrincipal}`;
  const detallesHtml = construirDetalles(p);

  const currentProductJs = `const CURRENT_PRODUCT={id:"${p.sku}",name:${JSON.stringify(p.nombre)},price:${p.precio},img:${JSON.stringify(imagenPrincipal)}};`;

  const reemplazos = {
    '__SEO_TITLE__': escapeHtml(p.seoTitle),
    '__SEO_DESCRIPTION__': escapeHtml(p.seoDescription),
    '__CANONICAL_URL__': canonical,
    '__OG_TITLE__': escapeHtml(p.nombre),
    '__OG_IMAGE__': imagenAbsoluta,
    '__JSONLD__': construirJsonLd(p),
    '__HEADER__': headerHtml,
    '__FOOTER__': footerHtml,
    '__BREADCRUMB_NOMBRE__': escapeHtml(p.nombre),
    '__GALLERY_ALT__': escapeHtml(p.nombre),
    '__GALLERY_MAIN_IMG__': imagenPrincipal,
    '__THUMBS_HTML__': construirThumbs(p),
    '__PRODUCT_TAG__': escapeHtml(p.etiquetaProducto),
    '__PRODUCT_NAME__': escapeHtml(p.nombre),
    '__PRODUCT_PRICE_DISPLAY__': escapeHtml(p.precioDisplay),
    '__PRODUCT_DESCRIPTION__': escapeHtml(p.seoDescription),
    '__PRODUCT_DETAILS_HTML__': detallesHtml,
    '__CURRENT_PRODUCT_JS__': currentProductJs,
    '__VIEW_ITEM_CATEGORY__': p.categoria
  };

  let html = plantilla;
  for (const [token, valor] of Object.entries(reemplazos)) {
    html = html.split(token).join(valor);
  }

  const tokensRestantes = html.match(/__[A-Z_]+__/g);
  if (tokensRestantes) {
    throw new Error(`Quedaron tokens sin reemplazar en "${p.slug}": ${tokensRestantes.join(', ')}`);
  }

  return html;
}

function main() {
  const args = process.argv.slice(2);
  const soloSlug = args.find(a => a.startsWith('--slug='))?.split('=')[1];
  const soloTest = args.includes('--test');

  const plantilla = leer(TEMPLATE_PATH);
  const headerHtml = leer(HEADER_PATH).trim();
  const footerHtml = leer(FOOTER_PATH).trim();
  let productos = JSON.parse(leer(DATA_PATH));

  if (soloSlug) productos = productos.filter(p => p.slug === soloSlug);
  if (soloTest) productos = productos.filter(p => p.test === true);

  if (!productos.length) {
    console.error('No hay productos que coincidan con el filtro. Nada generado.');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let generados = 0;
  for (const p of productos) {
    validarProducto(p);
    const html = generarHtml(p, plantilla, headerHtml, footerHtml);
    const destino = path.join(OUTPUT_DIR, `${p.slug}.html`);
    fs.writeFileSync(destino, html, 'utf-8');
    console.log(`✓ Generado: productos/${p.slug}.html`);
    generados++;
  }

  console.log(`\nTotal generado: ${generados} de ${JSON.parse(leer(DATA_PATH)).length} producto(s) en data/productos.json`);
}

main();
