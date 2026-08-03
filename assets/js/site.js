/* =========================================================
   PATAS & CAOS — site.js
   JS compartido de UI: menú móvil, acordeón de categorías del
   menú móvil, y el toggle del header al hacer scroll.

   IMPORTANTE — esto NO incluye:
   - toggleCart() / abrirAuth() / cerrarAuth() / cerrarAuthSiFondo()
     / loginConGoogle() / enviarMagicLink(): no se encontraron
     definidas ni en tienda.html ni en la ficha de producto, así que
     ya viven en un archivo externo (muy probablemente cart.js).
     No se tocan.
   - runSearch(): tienda.html y la ficha de producto tienen DOS
     implementaciones distintas (la de tienda usa productoUrl() y
     un formato de resultado más completo; la de la ficha usa
     window.PRODUCT_SLUGS directamente). Unificarlas es un cambio de
     comportamiento real en la página de categoría, así que se deja
     fuera de esta fase — sigue definida en cada página como hasta
     ahora.
   - Toda la lógica de checkout, Supabase, stock y favoritos.
   ========================================================= */

function toggleMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  const isOpen = menu.classList.toggle('open');
  if (!isOpen) {
    document.querySelectorAll('.mobile-accordion-body.open').forEach(b => {
      b.classList.remove('open');
      b.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
  }
  hamburger.classList.toggle('open');
  let bd = document.getElementById('menu-backdrop');
  if (!bd) {
    bd = document.createElement('div');
    bd.id = 'menu-backdrop';
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:98;display:none;';
    bd.onclick = toggleMenu;
    document.body.appendChild(bd);
  }
  bd.style.display = isOpen ? 'block' : 'none';
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function toggleAccordion(btn) {
  const body = btn.nextElementSibling;
  const isOpen = body.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
  document.querySelectorAll('.mobile-accordion-body.open').forEach(b => {
    if (b !== body) {
      b.classList.remove('open');
      b.previousElementSibling.setAttribute('aria-expanded', 'false');
    }
  });
}

function updateHeaderOnScroll() {
  const header = document.querySelector('.site-header');
  if (header) header.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });
window.addEventListener('DOMContentLoaded', updateHeaderOnScroll);

/* =========================================================
   BUSCADOR GLOBAL — páginas de producto
   Define runSearch() para los inputs que lo llaman inline.
   ========================================================= */

function normalizarBusqueda(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function obtenerCatalogoBusqueda() {
  try {
    if (typeof productos === 'object' && productos) return productos;
  } catch (_) {}

  return window.productos || {};
}

function obtenerSlugBusqueda(id, producto) {
  return producto?.slug || window.PRODUCT_SLUGS?.[id] || id;
}

function obtenerImagenBusqueda(producto) {
  if (Array.isArray(producto?.variantes) && producto.variantes.length) {
    return producto.variantes[0]?.imagenes?.[0] || '';
  }

  return producto?.imagenes?.[0] || '';
}

function obtenerPrecioBusqueda(producto) {
  if (producto?.precioDisplay) return producto.precioDisplay;
  if (producto?.precioTexto) return producto.precioTexto;

  if (typeof producto?.precio === 'string') return producto.precio;

  const numero =
    Number(producto?.precioNum) ||
    Number(producto?.precio) ||
    Number(producto?.precioOferta);

  return Number.isFinite(numero) && numero > 0
    ? '$' + numero.toLocaleString('es-CL')
    : '';
}

function puntajeBusqueda(id, producto, consulta) {
  const nombre = normalizarBusqueda(producto?.nombre);
  const marca = normalizarBusqueda(producto?.marca);
  const categoria = normalizarBusqueda(producto?.categoria);
  const publico = normalizarBusqueda(producto?.audience);
  const descripcion = normalizarBusqueda(producto?.descripcion);
  const ingredientes = normalizarBusqueda(producto?.ingredientes);
  const identificador = normalizarBusqueda(id);

  let puntaje = 0;

  if (nombre === consulta) puntaje += 100;
  else if (nombre.startsWith(consulta)) puntaje += 70;
  else if (nombre.includes(consulta)) puntaje += 50;

  if (marca.includes(consulta)) puntaje += 25;
  if (categoria.includes(consulta)) puntaje += 15;
  if (publico.includes(consulta)) puntaje += 10;
  if (identificador.includes(consulta)) puntaje += 8;
  if (descripcion.includes(consulta)) puntaje += 6;
  if (ingredientes.includes(consulta)) puntaje += 4;

  return puntaje;
}

function escaparHtmlBusqueda(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cerrarBusquedaGlobal() {
  const drop = document.getElementById('nav-drop');
  if (!drop) return;

  drop.innerHTML = '';
  drop.style.display = 'none';
}

window.runSearch = function runSearch(valor) {
  const drop = document.getElementById('nav-drop');
  if (!drop) return;

  const consulta = normalizarBusqueda(valor);

  if (consulta.length < 2) {
    cerrarBusquedaGlobal();
    return;
  }

  const resultados = Object.entries(obtenerCatalogoBusqueda())
    .map(([id, producto]) => ({
      id,
      producto,
      score: puntajeBusqueda(id, producto, consulta)
    }))
    .filter(resultado => resultado.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  if (!resultados.length) {
    drop.innerHTML =
      '<p class="s-empty">No encontramos productos con esa búsqueda.</p>';
    drop.style.display = 'block';
    return;
  }

  drop.innerHTML = resultados.map(({ id, producto }) => {
    const slug = obtenerSlugBusqueda(id, producto);
    const imagen = obtenerImagenBusqueda(producto);
    const precio = obtenerPrecioBusqueda(producto);
    const nombre = producto?.nombre || id;

    return `
      <a class="s-item" href="/productos/${encodeURIComponent(slug)}">
        <div class="s-img">
          ${imagen
            ? `<img src="${escaparHtmlBusqueda(imagen)}" alt="${escaparHtmlBusqueda(nombre)}" loading="lazy" style="width:100%;height:100%;object-fit:contain;display:block">`
            : ''}
        </div>
        <div>
          <div class="s-nombre">${escaparHtmlBusqueda(nombre)}</div>
          ${precio
            ? `<div class="s-precio">${escaparHtmlBusqueda(precio)}</div>`
            : ''}
        </div>
      </a>
    `;
  }).join('');

  drop.style.display = 'block';
};

document.addEventListener('click', event => {
  if (!event.target.closest('.nav-search-wrap')) {
    cerrarBusquedaGlobal();
  }
});

