/* =========================================================
   PATAS & CAOS — Buscador global
   - Ignora tildes y mayúsculas.
   - Busca por nombre, descripción, marca, categoría, público e ID.
   - Ordena por relevancia.
   - Usa URLs limpias de producto.
   ========================================================= */
(function () {
  'use strict';

  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function obtenerCatalogo() {
    if (typeof window.productos === 'object' && window.productos) {
      return window.productos;
    }

    try {
      if (typeof productos === 'object' && productos) return productos;
    } catch (_) {}

    return {};
  }

  function obtenerSlug(id) {
    if (window.PRODUCT_SLUGS && window.PRODUCT_SLUGS[id]) {
      return window.PRODUCT_SLUGS[id];
    }

    try {
      if (typeof PRODUCT_SLUGS === 'object' && PRODUCT_SLUGS?.[id]) {
        return PRODUCT_SLUGS[id];
      }
    } catch (_) {}

    return id;
  }

  function obtenerImagen(producto) {
    if (Array.isArray(producto?.variantes) && producto.variantes.length) {
      return producto.variantes[0]?.imagenes?.[0] || '';
    }
    return Array.isArray(producto?.imagenes) ? producto.imagenes[0] || '' : '';
  }

  function obtenerPlaceholder(producto) {
    if (Array.isArray(producto?.variantes) && producto.variantes.length) {
      return producto.variantes[0]?.placeholders?.[0] || '🐾';
    }
    return Array.isArray(producto?.placeholders)
      ? producto.placeholders[0] || '🐾'
      : '🐾';
  }

  function obtenerPrecio(producto) {
    return producto?.precio ||
      producto?.precioTexto ||
      producto?.precioDisplay ||
      (Number.isFinite(Number(producto?.precioNum))
        ? '$' + Number(producto.precioNum).toLocaleString('es-CL')
        : '');
  }

  function puntajeCoincidencia(id, producto, consulta) {
    const nombre = normalizarTexto(producto?.nombre);
    const marca = normalizarTexto(producto?.marca);
    const categoria = normalizarTexto(producto?.categoria);
    const audience = normalizarTexto(producto?.audience);
    const descripcion = normalizarTexto(producto?.descripcion);
    const ingredientes = normalizarTexto(producto?.ingredientes);
    const sku = normalizarTexto(id);

    let puntaje = 0;

    if (nombre === consulta) puntaje += 100;
    else if (nombre.startsWith(consulta)) puntaje += 70;
    else if (nombre.includes(consulta)) puntaje += 50;

    if (marca.startsWith(consulta)) puntaje += 30;
    else if (marca.includes(consulta)) puntaje += 20;

    if (categoria.includes(consulta)) puntaje += 14;
    if (audience.includes(consulta)) puntaje += 10;
    if (sku.includes(consulta)) puntaje += 8;
    if (descripcion.includes(consulta)) puntaje += 6;
    if (ingredientes.includes(consulta)) puntaje += 4;

    return puntaje;
  }

  function cerrarBuscador() {
    const drop = document.getElementById('nav-drop');
    if (!drop) return;
    drop.innerHTML = '';
    drop.style.display = 'none';
  }

  window.runSearch = function runSearch(valor) {
    const drop = document.getElementById('nav-drop');
    if (!drop) return;

    const consulta = normalizarTexto(valor);

    if (consulta.length < 2) {
      cerrarBuscador();
      return;
    }

    const catalogo = obtenerCatalogo();

    const resultados = Object.entries(catalogo)
      .map(([id, producto]) => ({
        id,
        producto,
        puntaje: puntajeCoincidencia(id, producto, consulta)
      }))
      .filter(resultado => resultado.puntaje > 0)
      .sort((a, b) =>
        b.puntaje - a.puntaje ||
        String(a.producto?.nombre || '').localeCompare(
          String(b.producto?.nombre || ''),
          'es'
        )
      )
      .slice(0, 7);

    if (!resultados.length) {
      drop.innerHTML =
        '<p class="s-empty search-no-results">No encontramos productos con esa búsqueda.</p>';
      drop.style.display = 'block';
      return;
    }

    drop.innerHTML = resultados.map(({ id, producto }) => {
      const imagen = obtenerImagen(producto);
      const placeholder = obtenerPlaceholder(producto);
      const precio = obtenerPrecio(producto);
      const slug = obtenerSlug(id);

      return `
        <a class="s-item nav-search-result" href="/productos/${encodeURIComponent(slug)}">
          <div class="s-img">
            ${imagen
              ? `<img src="${imagen}" alt="" loading="lazy">`
              : `<span>${placeholder}</span>`}
          </div>
          <div class="s-copy">
            <div class="s-nombre">${producto?.nombre || id}</div>
            ${precio ? `<div class="s-precio">${precio}</div>` : ''}
          </div>
        </a>`;
    }).join('');

    drop.style.display = 'block';
  };

  function inicializarBuscador() {
    const input = document.querySelector('.nav-search-wrap input');
    const drop = document.getElementById('nav-drop');

    if (!input || !drop) return;

    input.removeAttribute('oninput');
    input.removeAttribute('onfocus');
    input.removeAttribute('onblur');

    input.addEventListener('input', event => {
      window.runSearch(event.target.value);
    });

    input.addEventListener('focus', () => {
      if (normalizarTexto(input.value).length >= 2) {
        window.runSearch(input.value);
      }
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        cerrarBuscador();
        input.blur();
      }
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.nav-search-wrap')) cerrarBuscador();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarBuscador);
  } else {
    inicializarBuscador();
  }
})();
