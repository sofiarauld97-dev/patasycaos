/* PATAS & CAOS — Buscador global v9 */
(function () {
  'use strict';


  function inyectarEstilos() {
    if (document.getElementById('buscador-global-v3-estilos')) return;

    const style = document.createElement('style');
    style.id = 'buscador-global-v3-estilos';
    style.textContent = `
      .nav-search-wrap {
        position: relative !important;
        z-index: 500 !important;
      }

      #nav-drop {
        display: none;
        position: absolute !important;
        top: calc(100% + 6px) !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        max-height: 320px !important;
        overflow-y: auto !important;
        background: #fff !important;
        border: 1px solid rgba(28,16,7,.08) !important;
        border-radius: 14px !important;
        box-shadow: 0 12px 34px rgba(28,16,7,.14) !important;
        padding: 0 !important;
        margin: 0 !important;
        z-index: 9999 !important;
        box-sizing: border-box !important;
      }

      #nav-drop .nav-search-result {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        width: 100% !important;
        padding: 10px 14px !important;
        margin: 0 !important;
        border: 0 !important;
        border-bottom: 1px solid rgba(28,16,7,.08) !important;
        background: #fff !important;
        color: #1A1A1A !important;
        text-decoration: none !important;
        font-family: 'Poppins', sans-serif !important;
        line-height: 1.25 !important;
        box-sizing: border-box !important;
      }

      #nav-drop .nav-search-result:last-child {
        border-bottom: 0 !important;
      }

      #nav-drop .nav-search-result:hover {
        background: #F8F3E8 !important;
      }

      #nav-drop .s-img {
        width: 38px !important;
        height: 38px !important;
        min-width: 38px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        overflow: hidden !important;
        border-radius: 8px !important;
        background: #fff !important;
      }

      #nav-drop .s-img img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        display: block !important;
      }

      #nav-drop .s-info {
        min-width: 0 !important;
        flex: 1 !important;
      }

      #nav-drop .s-nombre {
        display: block !important;
        margin: 0 0 3px !important;
        color: #1A1A1A !important;
        font-size: .82rem !important;
        font-weight: 700 !important;
        line-height: 1.3 !important;
        white-space: normal !important;
        text-decoration: none !important;
      }

      #nav-drop .s-precio {
        display: block !important;
        margin: 0 !important;
        color: #C4622D !important;
        font-size: .75rem !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
        text-decoration: none !important;
      }

      #nav-drop .s-empty {
        margin: 0 !important;
        padding: 14px !important;
        color: #6b5a4e !important;
        font-size: .82rem !important;
        background: #fff !important;
      }

      @media (max-width: 768px) {
        #nav-drop {
          position: absolute !important;
          top: calc(100% + 6px) !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-height: 300px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function normalizar(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  let catalogoRemoto = null;

  function catalogo() {
    if (catalogoRemoto && Object.keys(catalogoRemoto).length) return catalogoRemoto;
    try {
      if (typeof productos === 'object' && productos) return productos;
    } catch (_) {}
    return window.productos || {};
  }

  async function cargarCatalogoRemoto() {
    try {
      const response = await fetch('/data/productos.json?t=' + Date.now(), {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('No se pudo cargar /data/productos.json');

      const data = await response.json();
      const lista = Array.isArray(data)
        ? data
        : (Array.isArray(data?.productos) ? data.productos : Object.values(data || {}));

      const remoto = {};

      lista.forEach(producto => {
        if (!producto) return;

        const id = String(
          producto.sku ||
          producto.stockId ||
          producto.id ||
          producto.slug ||
          ''
        ).trim();

        if (!id) return;

        remoto[id] = producto;

        // No modificamos window.PRODUCT_SLUGS: en producción puede estar
        // congelado o definido como solo lectura. slugProducto() ya prioriza
        // producto.slug, por lo que no es necesario escribir en ese objeto.
      });

      if (Object.keys(remoto).length) catalogoRemoto = remoto;
    } catch (error) {
      console.error('Buscador global: no se pudo cargar el catálogo actualizado.', error);
    }
  }

  function slugProducto(id, producto) {
    return producto?.slug || window.PRODUCT_SLUGS?.[id] || id;
  }

  function imagenProducto(producto) {
    let imagen = '';

    if (Array.isArray(producto?.variantes) && producto.variantes.length) {
      imagen = producto.variantes[0]?.imagenes?.[0] || '';
    } else {
      imagen = producto?.imagenes?.[0] || '';
    }

    imagen = String(imagen || '').trim();

    if (!imagen) return '';
    if (/^(https?:)?\/\//i.test(imagen) || imagen.startsWith('/')) return imagen;

    // Evita que una imagen como "producto.jpg" se resuelva de forma relativa
    // como /productos/producto.jpg dentro de las fichas.
    return '/' + imagen.replace(/^\.\//, '');
  }

  function precioProducto(producto) {
    const display = String(
      producto?.precioDisplay ||
      producto?.precioTexto ||
      ''
    ).trim();

    if (display) {
      if (display.startsWith('$')) return display;

      const numeroDisplay = Number(
        display.replace(/[^0-9,-]/g, '').replace(',', '.')
      );

      if (Number.isFinite(numeroDisplay)) {
        return '$' + Math.round(numeroDisplay).toLocaleString('es-CL');
      }
    }

    const numero = Number(producto?.precioNum ?? producto?.precio);

    return Number.isFinite(numero)
      ? '$' + Math.round(numero).toLocaleString('es-CL')
      : '';
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
        <a class="nav-search-result" href="/productos/${encodeURIComponent(slug)}">
          <div class="s-img">
            ${img ? `<img src="${img}" alt="${producto?.nombre || id}" loading="lazy">` : ''}
          </div>
          <div class="s-info">
            <div class="s-nombre">${producto?.nombre || id}</div>
            ${precio ? `<div class="s-precio">${precio}</div>` : ''}
          </div>
        </a>`;
    }).join('');

    drop.style.display = 'block';
  };

  async function iniciar() {
    inyectarEstilos();
    await cargarCatalogoRemoto();

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