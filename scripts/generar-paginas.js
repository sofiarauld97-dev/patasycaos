#!/usr/bin/env node
/**
 * generar-paginas.js
 *
 * Reconstruye el header y footer de las paginas generales del sitio a partir de:
 *   - components/header.html
 *   - components/footer.html
 *
 * A diferencia de generar-productos.js (que arma cada ficha desde cero con una
 * plantilla + datos), este script NO tiene una plantilla separada por pagina:
 * el contenido central (SEO, body, scripts y estilos propios) de cada pagina ES
 * la fuente de verdad. Lo que hace el script es ubicar, dentro del HTML actual
 * de cada pagina, los 6 bloques que vienen del header/footer compartido, y
 * reemplazarlos por la version mas reciente de components/header.html y
 * components/footer.html. Todo lo demas se conserva intacto.
 *
 * Los 6 bloques que reconoce y reemplaza:
 *   1. <header class="site-header">...</header>
 *   2. <div class="mobile-menu" id="mobile-menu">...</div>
 *   3. <div class="cart-overlay" id="cart-overlay" onclick="toggleCart()"></div>
 *   4. <aside class="cart-sidebar" id="cart-sidebar">...</aside>
 *   5. <footer ...>...</footer>
 *   6. <div class="auth-overlay" id="auth-overlay">...</div> (modal de login)
 *
 * Si alguno de estos bloques aparece MAS de una vez en una pagina (ya paso:
 * suscripciones.html y cuenta.html tenian el carrito duplicado), el script
 * colapsa todas las apariciones a una sola, con el contenido canonico.
 *
 * No usa fetch() en el navegador: todo el reemplazo pasa en build time, y el
 * HTML final contiene el header/footer fisicamente.
 *
 * Uso:
 *   node scripts/generar-paginas.js                → procesa todas las paginas de la lista
 *   node scripts/generar-paginas.js --pagina=index.html → procesa solo una (pruebas)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(ROOT, 'components');

// Paginas generales a procesar y, para cada una, el href que debe llevar
// class="activo" en el menu (null = ninguna, la pagina no esta en el nav principal).
const PAGINAS = {
  'index.html': '/',
  'tienda.html': '/tienda',
  'categorias.html': null,
  'suscripciones.html': '/suscripciones',
  'blog.html': '/blog',
  'blog-alimentacion.html': '/blog',
  'blog-flores-de-bach.html': '/blog',
  'blog-juguetes.html': '/blog',
  'nosotros.html': null,
  'contacto.html': null,
  'envios.html': null,
  'devoluciones.html': null,
  'faq.html': null,
  'cuenta.html': null,
  'favoritos.html': null,
  'pedido-ok.html': null,
};

// -----------------------------------------------------------------------
// Utilidades
// -----------------------------------------------------------------------

function leer(rutaAbs) {
  if (!fs.existsSync(rutaAbs)) return null;
  return fs.readFileSync(rutaAbs, 'utf-8');
}

function extraerPrimero(texto, regex, nombre) {
  const m = texto.match(regex);
  if (!m) throw new Error(`No se pudo extraer "${nombre}" desde components/header.html o footer.html. Revisa que la estructura no haya cambiado.`);
  return m[0];
}

/**
 * Reemplaza TODAS las apariciones de `regex` en `contenido` por `valorCanonico`.
 * Si hay mas de una aparicion, las colapsa a una sola (deja solo la primera,
 * con el contenido canonico, y elimina las demas por completo).
 * Devuelve { contenido, apariciones }.
 */
function reemplazarColapsando(contenido, regex, valorCanonico) {
  const globalRe = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  const matches = [...contenido.matchAll(globalRe)];
  if (matches.length === 0) return { contenido, apariciones: 0 };

  let resultado = contenido.slice(0, matches[0].index) + valorCanonico;
  let cursor = matches[0].index + matches[0][0].length;
  for (let i = 1; i < matches.length; i++) {
    const m = matches[i];
    resultado += contenido.slice(cursor, m.index); // conserva lo que hay ENTRE bloques
    cursor = m.index + m[0].length;
  }
  resultado += contenido.slice(cursor);
  return { contenido: resultado, apariciones: matches.length };
}

/**
 * Elimina TODAS las definiciones inline de una funcion tipo `function nombre() { ... }`,
 * contando llaves para encontrar el cierre correcto (soporta llaves anidadas).
 * Devuelve { contenido, vecesEliminada }.
 */
function quitarFuncionPorLlaves(contenido, patronInicio) {
  let veces = 0;
  while (true) {
    const m = contenido.match(patronInicio);
    if (!m) break;
    const inicio = m.index;
    let i = contenido.indexOf('{', m.index + m[0].length - 1);
    if (i === -1) break;
    let profundidad = 0;
    let fin = -1;
    for (; i < contenido.length; i++) {
      if (contenido[i] === '{') profundidad++;
      else if (contenido[i] === '}') {
        profundidad--;
        if (profundidad === 0) { fin = i + 1; break; }
      }
    }
    if (fin === -1) break;
    if (contenido[fin] === '\n') fin++;
    contenido = contenido.slice(0, inicio) + contenido.slice(fin);
    veces++;
  }
  return { contenido, vecesEliminada: veces > 0 };
}

// -----------------------------------------------------------------------
// Cargar componentes canonicos (siempre frescos, en cada corrida)
// -----------------------------------------------------------------------

function cargarComponentes() {
  const headerFull = leer(path.join(COMPONENTS_DIR, 'header.html'));
  const footerFull = leer(path.join(COMPONENTS_DIR, 'footer.html'));
  if (!headerFull) throw new Error('No se encontro components/header.html');
  if (!footerFull) throw new Error('No se encontro components/footer.html');

  const headerTag = extraerPrimero(headerFull, /<header class="site-header">[\s\S]*?<\/header>/, 'header-tag');
  const mobileMenu = extraerPrimero(headerFull, /<div class="mobile-menu" id="mobile-menu">[\s\S]*?<a href="\/blog"[^>]*>Blog<\/a>\s*<\/div>/, 'mobile-menu');
  const cartOverlay = extraerPrimero(headerFull, /<div class="cart-overlay" id="cart-overlay" onclick="toggleCart\(\)"><\/div>/, 'cart-overlay');
  const cartSidebar = extraerPrimero(headerFull, /<aside class="cart-sidebar" id="cart-sidebar">[\s\S]*?<\/aside>/, 'cart-sidebar');
  const footerOnly = extraerPrimero(footerFull, /<footer[\s\S]*?<\/footer>/, 'footer-only');
  const authModal = extraerPrimero(footerFull, /<div class="auth-overlay" id="auth-overlay"[\s\S]*?<p class="auth-msg" id="auth-msg"><\/p>\s*<\/div>\s*<\/div>/, 'auth-modal');

  // version "neutra" sin ningun activo baked-in (header.html trae "Tienda" activo
  // heredado de tienda.html; lo despojamos aca y lo reaplicamos por pagina)
  const headerTagNeutro = headerTag.replace(
    '<li><a href="/tienda" class="activo">Tienda</a></li>',
    '<li><a href="/tienda">Tienda</a></li>'
  );
  const mobileMenuNeutro = mobileMenu.replace(
    '<a href="/tienda" class="activo" onclick="toggleMenu()">Tienda</a>',
    '<a href="/tienda" onclick="toggleMenu()">Tienda</a>'
  );
  if (headerTagNeutro.includes('class="activo"')) {
    throw new Error('Quedo un activo sin limpiar en header-tag (revisar components/header.html)');
  }
  if (mobileMenuNeutro.includes('class="activo"')) {
    throw new Error('Quedo un activo sin limpiar en mobile-menu (revisar components/header.html)');
  }

  return { headerTagNeutro, mobileMenuNeutro, cartOverlay, cartSidebar, footerOnly, authModal };
}

function construirHeaderPara(headerTagNeutro, href) {
  if (href === null) return headerTagNeutro;
  return headerTagNeutro.replace(`<a href="${href}">`, `<a href="${href}" class="activo">`);
}

function construirMobileMenuPara(mobileMenuNeutro, href) {
  if (href === null) return mobileMenuNeutro;
  return mobileMenuNeutro.replace(
    `<a href="${href}" onclick="toggleMenu()">`,
    `<a href="${href}" class="activo" onclick="toggleMenu()">`
  );
}

// -----------------------------------------------------------------------
// Regex de deteccion (sobre el HTML de cada pagina)
// -----------------------------------------------------------------------

const RE_HEADER_TAG = /<header class="site-header">[\s\S]*?<\/header>/;
const RE_MOBILE_MENU = /<div class="mobile-menu" id="mobile-menu">[\s\S]*?<a href="\/blog"[^>]*>Blog<\/a>\s*<\/div>/;
const RE_MOBILE_MENU_FALLBACK = /<div class="mobile-menu" id="mobile-menu">[\s\S]*?(?=<main)/;
const RE_CART_OVERLAY = /<div class="cart-overlay" id="cart-overlay" onclick="toggleCart\(\)"><\/div>/;
const RE_CART_SIDEBAR = /<aside class="cart-sidebar" id="cart-sidebar">[\s\S]*?<\/aside>/;
const RE_FOOTER_ONLY = /<footer[\s\S]*?<\/footer>/;
const RE_AUTH_MODAL = /<div class="auth-overlay" id="auth-overlay"[\s\S]*?<p class="auth-msg" id="auth-msg"><\/p>\s*<\/div>\s*<\/div>/;

const RE_TOGGLE_MENU_FN = /function toggleMenu\s*\(\s*\)\s*\{/;
const RE_TOGGLE_ACCORDION_FN = /function toggleAccordion\s*\(\s*btn\s*\)\s*\{/;
const RE_SCROLL_LISTENER = /window\.addEventListener\('scroll',\s*\(\)\s*=>\s*\{[^}]*classList\.toggle\('scrolled'[^}]*\}\s*\)\s*;\s*\n?/g;
const RE_CART_JS_TAG = /<script src="\/?cart\.js"><\/script>/;

// -----------------------------------------------------------------------
// Procesamiento de una pagina
// -----------------------------------------------------------------------

function procesarPagina(nombreArchivo, href, componentes) {
  const rutaAbs = path.join(ROOT, nombreArchivo);
  const original = leer(rutaAbs);
  const reporte = { pagina: nombreArchivo, encontrada: original !== null };
  if (original === null) return { reporte, contenido: null };

  let contenido = original;

  // 1) header
  let r = reemplazarColapsando(contenido, RE_HEADER_TAG, construirHeaderPara(componentes.headerTagNeutro, href));
  contenido = r.contenido;
  reporte.header = r.apariciones;

  // 2) mobile-menu (con fallback si el original esta roto / incompleto)
  const mobileMenuCanon = construirMobileMenuPara(componentes.mobileMenuNeutro, href);
  r = reemplazarColapsando(contenido, RE_MOBILE_MENU, mobileMenuCanon);
  if (r.apariciones === 0) {
    r = reemplazarColapsando(contenido, RE_MOBILE_MENU_FALLBACK, mobileMenuCanon);
    reporte.mobile_menu = r.apariciones > 0 ? 'fallback' : 0;
  } else {
    reporte.mobile_menu = r.apariciones;
  }
  contenido = r.contenido;

  // 3) cart-overlay
  r = reemplazarColapsando(contenido, RE_CART_OVERLAY, componentes.cartOverlay);
  contenido = r.contenido;
  reporte.cart_overlay = r.apariciones;

  // 4) cart-sidebar
  r = reemplazarColapsando(contenido, RE_CART_SIDEBAR, componentes.cartSidebar);
  contenido = r.contenido;
  reporte.cart_sidebar = r.apariciones;

  // 5) footer
  r = reemplazarColapsando(contenido, RE_FOOTER_ONLY, componentes.footerOnly);
  contenido = r.contenido;
  reporte.footer = r.apariciones;

  // 6) auth-modal
  r = reemplazarColapsando(contenido, RE_AUTH_MODAL, componentes.authModal);
  contenido = r.contenido;
  reporte.auth_modal = r.apariciones;

  // site.css: debe cargar ANTES del <style> propio de la pagina (si no, gana la
  // cascada y pisa colores/fondos especificos de cada pagina — bug real que ya
  // paso una vez).
  if (!contenido.includes('/assets/css/site.css')) {
    contenido = contenido.replace('<head>', '<head>\n<link rel="stylesheet" href="/assets/css/site.css">');
    reporte.site_css_agregado = true;
  } else {
    reporte.site_css_agregado = false;
  }

  // eliminar duplicados/definiciones inline ya centralizadas en site.js
  let res = quitarFuncionPorLlaves(contenido, RE_TOGGLE_MENU_FN);
  contenido = res.contenido;
  reporte.quito_toggleMenu = res.vecesEliminada;

  res = quitarFuncionPorLlaves(contenido, RE_TOGGLE_ACCORDION_FN);
  contenido = res.contenido;
  reporte.quito_toggleAccordion = res.vecesEliminada;

  const antesScroll = contenido;
  contenido = contenido.replace(RE_SCROLL_LISTENER, '');
  reporte.quito_scrollListener = contenido !== antesScroll;

  // site.js: agregar una sola vez
  if (!contenido.includes('/assets/js/site.js')) {
    if (RE_CART_JS_TAG.test(contenido)) {
      contenido = contenido.replace(RE_CART_JS_TAG, (m) => `${m}\n<script src="/assets/js/site.js"></script>`);
      reporte.site_js_agregado = true;
    } else {
      reporte.site_js_agregado = false;
    }
  } else {
    reporte.site_js_agregado = false;
  }

  // Rutas absolutas (condicion 8)
  const antesRutas = contenido;
  contenido = contenido
    .replace(/src="logo\.png"/g, 'src="/logo.png"')
    .replace(/src="cart\.js"/g, 'src="/cart.js"')
    .replace(/src="products-data\.js"/g, 'src="/products-data.js"');
  reporte.rutas_absolutizadas = contenido !== antesRutas;

  // chequeo defensivo de tokens sin reemplazar (este script no usa tokens tipo
  // __ASI__, pero se deja el chequeo por si algun HTML ya traia alguno suelto)
  const tokensSueltos = contenido.match(/__[A-Z_]+__/g);
  reporte.tokens_sin_reemplazar = tokensSueltos || [];

  return { reporte, contenido };
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const soloPagina = args.find(a => a.startsWith('--pagina='))?.split('=')[1];

  const componentes = cargarComponentes();

  const lista = soloPagina ? [soloPagina] : Object.keys(PAGINAS);
  const reportes = [];
  let generadas = 0;
  const noEncontradas = [];

  for (const nombre of lista) {
    const href = PAGINAS[nombre];
    const { reporte, contenido } = procesarPagina(nombre, href, componentes);
    reportes.push(reporte);
    if (!reporte.encontrada) {
      noEncontradas.push(nombre);
      continue;
    }
    fs.writeFileSync(path.join(ROOT, nombre), contenido, 'utf-8');
    generadas++;
  }

  console.log(JSON.stringify(reportes, null, 2));
  console.log(`\nTotal generadas: ${generadas} de ${lista.length} paginas listadas.`);
  if (noEncontradas.length) {
    console.log(`No encontradas (no existen en el proyecto): ${noEncontradas.join(', ')}`);
  }
}

main();
