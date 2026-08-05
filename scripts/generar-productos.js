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
  'categoria', 'sku', 'imagenes', 'caracteristicas'
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

  const precio = Number(p.precio);
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error(`Producto "${p.slug}" tiene un precio inválido.`);
  }

  if (!Array.isArray(p.imagenes) || !p.imagenes.every(img => typeof img === 'string' && img.trim())) {
    throw new Error(`Producto "${p.slug}" tiene imágenes inválidas.`);
  }

  if (!Array.isArray(p.caracteristicas) || !p.caracteristicas.every(item => typeof item === 'string' && item.trim())) {
    throw new Error(`Producto "${p.slug}" tiene características inválidas.`);
  }
}

function construirThumbs(p) {
  // La ficha original (caldo-de-huesos) siempre renderiza la tira de
  // miniaturas, incluso con una sola imagen — se replica igual aquí.
  if (!p.imagenes || p.imagenes.length === 0) return '';
  return `<div class="product-thumbs">` +
    p.imagenes.map(img =>
      `<img alt="${escapeHtml(p.nombre)}" loading="lazy" onclick="changeProductImage(this)" src="${normalizarImagen(img)}">`
    ).join('') +
    `</div>`;
}

function construirTabs(p) {
  const caracteristicasHtml = `<ul>${p.caracteristicas.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`;
  const tituloTab0 = escapeHtml(p.caracTitulo || 'Características');

  const tieneIngredientes = !!(p.ingredientes && p.ingredientes.trim());

  let nav = `<button aria-controls="product-panel-0" aria-selected="true" class="product-tab-btn activo" id="product-tab-0" onclick="switchProductTab(this)" role="tab" type="button">${tituloTab0}</button>`;
  let panels = `<div aria-labelledby="product-tab-0" class="product-tab-panel activo" id="product-panel-0" role="tabpanel">${caracteristicasHtml}</div>`;

  if (tieneIngredientes) {
    nav += `<button aria-controls="product-panel-1" aria-selected="false" class="product-tab-btn" id="product-tab-1" onclick="switchProductTab(this)" role="tab" type="button">Ingredientes</button>`;
    panels += `<div aria-labelledby="product-tab-1" class="product-tab-panel" id="product-panel-1" role="tabpanel"><p>${escapeHtml(p.ingredientes)}</p></div>`;
  }
  // Si no hay ingredientes, la pestaña simplemente no se genera (oculta), tal como se pidió.

  return { nav, panels };
}

function construirJsonLd(p) {
  const imagenNormalizada = normalizarImagen(p.imagenes[0]);
  const imagenAbsoluta = imagenNormalizada.startsWith('http')
    ? imagenNormalizada
    : `${SITE_URL}${imagenNormalizada}`;

  const skuValido = String(p.sku || p.slug)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',

    name: p.nombre,
    description: p.seoDescription,
    image: [imagenAbsoluta],

    sku: skuValido,
    category: p.categoria,

    brand: p.marca
      ? {
          '@type': 'Brand',
          name: p.marca
        }
      : undefined,

    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/productos/${p.slug}`,
      priceCurrency: 'CLP',
      price: String(p.precio),

      itemCondition: 'https://schema.org/NewCondition',
      availability:
        p.disponible === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock'
    }
  };

  return JSON.stringify(data);
}

function generarHtml(p, plantilla, headerHtml, footerHtml) {
  const canonical = `${SITE_URL}/productos/${p.slug}`;
  const imagenPrincipal = normalizarImagen(p.imagenes[0]);
  const imagenAbsoluta = imagenPrincipal.startsWith('http') ? imagenPrincipal : `${SITE_URL}${imagenPrincipal}`;
  const { nav, panels } = construirTabs(p);

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
    '__PRODUCT_TAG__': escapeHtml(p.etiquetaProducto || ''),
    '__PRODUCT_NAME__': escapeHtml(p.nombre),
    '__PRODUCT_PRICE_DISPLAY__': escapeHtml(p.precioDisplay),
    '__PRODUCT_DESCRIPTION__': escapeHtml(p.seoDescription),
    '__TABS_NAV_HTML__': nav,
    '__TABS_PANELS_HTML__': panels,
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


function normalizarImagen(img) {
  if (!img) return '';
  return String(img).startsWith('/') || String(img).startsWith('http')
    ? String(img)
    : '/' + String(img);
}

function construirCatalogoFrontend(productos) {
  const catalogo = {};
  for (const p of productos) {
    catalogo[p.sku] = {
      nombre: p.nombre,
      precio: p.precioDisplay || p.precioTexto || `$${Number(p.precio).toLocaleString('es-CL')}`,
      precioNum: Number(p.precio),
      audience: p.audience || '',
      categoria: p.categoria || '',
      marca: p.marca || '',
      tagline: p.tagline || '',
      descripcion: p.descripcion || p.seoDescription || '',
      caracTitulo: p.caracTitulo || 'Características',
      caracteristicas: Array.isArray(p.caracteristicas) ? p.caracteristicas : [],
      ingredientes: p.ingredientes || '',
      imagenes: (p.imagenes || []).map(normalizarImagen),
      placeholders: Array.isArray(p.placeholders) && p.placeholders.length
        ? p.placeholders
        : (p.imagenes || []).map(() => p.emoji || '🐾'),
      ahorro: p.ahorro || undefined,
      cyber: p.cyber || undefined
    };
  }
  return catalogo;
}

function construirMapaSlugs(productos) {
  return Object.fromEntries(productos.map(p => [p.sku, p.slug]));
}

function escribirJsGlobal(ruta, nombreGlobal, valor) {
  const contenido =
    `// Generado automáticamente desde data/productos.json. No editar a mano.\n` +
    `const ${nombreGlobal} = ${JSON.stringify(valor, null, 2)};\n` +
    `if (typeof window !== 'undefined') window.${nombreGlobal} = ${nombreGlobal};\n`;
  fs.writeFileSync(ruta, contenido, 'utf-8');
}

function parchearPaginaCatalogo(ruta, productos) {
  if (!fs.existsSync(ruta)) {
    console.warn(`⚠ No existe ${path.relative(ROOT, ruta)}; se omite.`);
    return;
  }

  let html = leer(ruta);
  const catalogo = construirCatalogoFrontend(productos);
  const slugs = construirMapaSlugs(productos);

  const patronCatalogo = /const productos = \{[\s\S]*?\n\};(?=\s*const ORDEN = \[)/;
  if (!patronCatalogo.test(html)) {
    throw new Error(`No se encontró el bloque "const productos" en ${path.basename(ruta)}.`);
  }
  html = html.replace(
    patronCatalogo,
    `const productos = ${JSON.stringify(catalogo, null, 2)};`
  );

  const patronSlugs = /const PRODUCT_SLUGS = \{[\s\S]*?\};/;
  if (patronSlugs.test(html)) {
    html = html.replace(
      patronSlugs,
      `const PRODUCT_SLUGS = ${JSON.stringify(slugs, null, 2)};`
    );
  }

  // Elimina una versión anterior del bloque automático, si existe.
  html = html.replace(
    /\n\/\* AUTO-CATALOGO-INICIO \*\/[\s\S]*?\/\* AUTO-CATALOGO-FIN \*\/\n?/g,
    '\n'
  );

  // Mantiene el orden editorial existente y agrega al inicio los productos nuevos.
  const patronOrden = /(const ORDEN = \[[\s\S]*?\n\];)/;
  if (!patronOrden.test(html)) {
    throw new Error(`No se encontró el bloque "const ORDEN" en ${path.basename(ruta)}.`);
  }
  html = html.replace(
    patronOrden,
    `$1\n/* AUTO-CATALOGO-INICIO */\n` +
    `Object.keys(productos).reverse().forEach(id => {\n` +
    `  if (!ORDEN.includes(id)) ORDEN.unshift(id);\n` +
    `});\n` +
    `/* AUTO-CATALOGO-FIN */`
  );

  // Enlaces de búsqueda hacia la ficha pública limpia.
  html = html.replace(
    /href="\/tienda\?producto=\$\{id\}"/g,
    'href="/productos/${PRODUCT_SLUGS[id] || id}"'
  );

  fs.writeFileSync(ruta, html, 'utf-8');
  console.log(`✓ Sincronizado: ${path.relative(ROOT, ruta)}`);
}

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function actualizarSitemap(productos) {
  const hoy = new Date().toISOString().slice(0, 10);
  const rutasEstaticas = [
    ['/', 'weekly', '1.0'],
    ['/tienda', 'weekly', '0.9'],
    ['/suscripciones', 'monthly', '0.8'],
    ['/blog', 'weekly', '0.7'],
    ['/blog-alimentacion', 'monthly', '0.7'],
    ['/blog-flores-de-bach', 'monthly', '0.7'],
    ['/blog-juguetes', 'monthly', '0.7'],
    ['/nosotros', 'monthly', '0.6'],
    ['/contacto', 'monthly', '0.6'],
    ['/envios', 'monthly', '0.5'],
    ['/devoluciones', 'monthly', '0.5'],
    ['/faq', 'monthly', '0.5'],
    ['/cuenta', 'monthly', '0.4'],
    ['/favoritos', 'monthly', '0.4']
  ];

  const urls = rutasEstaticas.map(([ruta, frecuencia, prioridad]) => `
  <url>
    <loc>${SITE_URL}${ruta}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${frecuencia}</changefreq>
    <priority>${prioridad}</priority>
  </url>`);

  for (const p of productos) {
    urls.push(`
  <url>
    <loc>${xmlEscape(`${SITE_URL}/productos/${p.slug}`)}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf-8');
  console.log(`✓ Actualizado: sitemap.xml (${productos.length} productos)`);
}

function sincronizarCatalogo(productos) {
  const catalogo = construirCatalogoFrontend(productos);
  const slugs = construirMapaSlugs(productos);

  escribirJsGlobal(PRODUCTS_DATA_PATH, 'productos', catalogo);
  escribirJsGlobal(PRODUCT_SLUGS_PATH, 'PRODUCT_SLUGS', slugs);
  console.log('✓ Generado: products-data.js');
  console.log('✓ Generado: product-slugs.js');

  parchearPaginaCatalogo(INDEX_PATH, productos);
  parchearPaginaCatalogo(TIENDA_PATH, productos);
  actualizarSitemap(productos);
}

function main() {
  const args = process.argv.slice(2);
  const soloSlug = args.find(a => a.startsWith('--slug='))?.split('=')[1];
  const soloTest = args.includes('--test');

  const plantilla = leer(TEMPLATE_PATH);
  const headerHtml = leer(HEADER_PATH).trim();
  const footerHtml = leer(FOOTER_PATH).trim();
  const productosTodos = JSON.parse(leer(DATA_PATH));
  let productos = [...productosTodos];

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
