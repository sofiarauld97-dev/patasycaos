/* PATAS & CAOS — Buscador global v2 */
(function () {
  'use strict';

  function normalizar(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function catalogo() {
    try {
      if (typeof productos === 'object' && productos) return productos;
    } catch (_) {}
    return window.productos || {};
  }

  function slugProducto(id, producto) {
    return producto?.slug || window.PRODUCT_SLUGS?.[id] || id;
  }

  function imagenProducto(producto) {
    if (Array.isArray(producto?.variantes) && producto.variantes.length) {
      return producto.variantes[0]?.imagenes?.[0] || '';
    }
    return producto?.imagenes?.[0] || '';
  }

  function precioProducto(producto) {
    return producto?.precioDisplay ||
      producto?.precio ||
      producto?.precioTexto ||
      (Number.isFinite(Number(producto?.precioNum))
        ? '$' + Number(producto.precioNum).toLocaleString('es-CL')
        : '');
  }

  function puntaje(id, producto, consulta) {
    const campos = {
      nombre: normalizar(producto?.nombre),
      marca: normalizar(producto?.marca),
      categoria: normalizar(producto?.categoria),
      audience: normalizar(producto?.audience),
      descripcion: normalizar(producto?.descripcion),
      ingredientes: normalizar(producto?.ingredientes),
      id: normalizar(id)
    };

    let total = 0;
    if (campos.nombre === consulta) total += 100;
    else if (campos.nombre.startsWith(consulta)) total += 70;
    else if (campos.nombre.includes(consulta)) total += 50;
    if (campos.marca.includes(consulta)) total += 25;
    if (campos.categoria.includes(consulta)) total += 15;
    if (campos.audience.includes(consulta)) total += 10;
    if (campos.id.includes(consulta)) total += 8;
    if (campos.descripcion.includes(consulta)) total += 6;
    if (campos.ingredientes.includes(consulta)) total += 4;
    return total;
  }

  function cerrar() {
    const drop = document.getElementById('nav-drop');
    if (!drop) return;
    drop.innerHTML = '';
    drop.style.display = 'none';
  }

  window.runSearch = function runSearch(valor) {
    const drop = document.getElementById('nav-drop');
    if (!drop) return;

    const consulta = normalizar(valor);
    if (consulta.length < 2) {
      cerrar();
      return;
    }

    const resultados = Object.entries(catalogo())
      .map(([id, producto]) => ({ id, producto, score: puntaje(id, producto, consulta) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);

    if (!resultados.length) {
      drop.innerHTML = '<p class="s-empty search-no-results">No encontramos productos con esa búsqueda.</p>';
      drop.style.display = 'block';
      return;
    }

    drop.innerHTML = resultados.map(({ id, producto }) => {
      const slug = slugProducto(id, producto);
      const img = imagenProducto(producto);
      const precio = precioProducto(producto);
      return `
        <a class="s-item nav-search-result" href="/productos/${encodeURIComponent(slug)}">
          <div class="s-img">
            ${img ? `<img src="${img}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain">` : ''}
          </div>
          <div>
            <div class="s-nombre">${producto?.nombre || id}</div>
            ${precio ? `<div class="s-precio">${precio}</div>` : ''}
          </div>
        </a>`;
    }).join('');

    drop.style.display = 'block';
  };

  function iniciar() {
    const input = document.querySelector('.nav-search-wrap input');
    if (!input) return;

    input.removeAttribute('oninput');
    input.removeAttribute('onfocus');
    input.removeAttribute('onblur');

    input.addEventListener('input', e => window.runSearch(e.target.value));
    input.addEventListener('focus', () => {
      if (normalizar(input.value).length >= 2) window.runSearch(input.value);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        cerrar();
        input.blur();
      }
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-search-wrap')) cerrar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();