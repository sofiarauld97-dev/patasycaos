
(function () {
  'use strict';

  let productQty = 1;
  let productStock = null;

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getCatalogEntries() {
    try {
      if (typeof productos !== 'undefined' && productos && typeof productos === 'object') {
        return Object.entries(productos);
      }
      if (window.productos && typeof window.productos === 'object') {
        return Object.entries(window.productos);
      }
    } catch (error) {}
    return [];
  }

  function getProductSlug(id) {
    try {
      if (typeof PRODUCT_SLUGS !== 'undefined' && PRODUCT_SLUGS?.[id]) return PRODUCT_SLUGS[id];
      if (window.PRODUCT_SLUGS?.[id]) return window.PRODUCT_SLUGS[id];
    } catch (error) {}
    return id;
  }


  function resolveSearchImagePath(image) {
    const value = String(image || '').trim();
    if (!value) return '';

    if (
      value.startsWith('/') ||
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('//') ||
      value.startsWith('data:') ||
      value.startsWith('blob:')
    ) {
      return value;
    }

    return '/' + value.replace(/^(\.\/)+/, '').replace(/^(\.\.\/)+/, '');
  }

  window.runSearch = function runSearch(query) {
    const drop = document.getElementById('nav-drop');
    if (!drop) return;

    const normalizedQuery = normalizeSearchText(query);

    if (normalizedQuery.length < 2) {
      drop.innerHTML = '';
      drop.style.display = 'none';
      return;
    }

    const matches = getCatalogEntries()
      .filter(([id, product]) => {
        if (String(id).startsWith('pack-') || /^Pack\b/i.test(String(product?.nombre || ''))) {
          return false;
        }

        const searchable = normalizeSearchText([
          product?.nombre,
          product?.marca,
          product?.categoria,
          product?.audience,
          product?.descripcion,
          product?.ingredientes,
          id
        ].filter(Boolean).join(' '));

        return searchable.includes(normalizedQuery);
      })
      .slice(0, 7);

    if (!matches.length) {
      drop.innerHTML = '<p class="s-empty">No encontramos productos con esa búsqueda.</p>';
      drop.style.display = 'block';
      return;
    }

    drop.innerHTML = matches.map(([id, product]) => {
      const rawImage = Array.isArray(product?.variantes) && product.variantes.length
        ? product.variantes[0]?.imagenes?.[0] || ''
        : Array.isArray(product?.imagenes) ? product.imagenes[0] || '' : '';
      const image = resolveSearchImagePath(rawImage);
      const slug = getProductSlug(id);
      const price = product?.precio || product?.precioTexto || product?.precioDisplay || '';
      const name = product?.nombre || id;

      return `
        <a class="s-item" href="/productos/${encodeURIComponent(slug)}">
          <div class="s-img">
            ${image ? `<img src="${image}" alt="${name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;display:block">` : ''}
          </div>
          <div>
            <div class="s-nombre">${name}</div>
            ${price ? `<div class="s-precio">${price}</div>` : ''}
          </div>
        </a>`;
    }).join('');

    drop.style.display = 'block';
  };


  const PAC_PRODUCT_OFFERS = {
    "dispensador-de-bolsas---diseno-cafe": { original: 5990, price: 4990 },
    "fuente-agua": { original: 21990, price: 17990 },
    "lata-leonardo_Ternera": { original: 3790, price: 3290 },
    "lata-leonardo-kitten": { original: 3790, price: 3290 },
    "paw-balm": { original: 5990, price: 3990 },
    "rascador-maxi-caja-de-leche---brnx": { original: 13990, price: 11990 },
    "zupet-dental-fitness-crocante": { original: 9990, price: 7990 },
    "zupet-dental-power-suave": { original: 9990, price: 7990 }
  };

  const PAC_PRODUCT_OFFER_NAMES = {
    "dispensador de bolsas - diseno cafe": "dispensador-de-bolsas---diseno-cafe",
    "fuente de agua flor usb": "fuente-agua",
    "lata leonardo adulto - ternera": "lata-leonardo_Ternera",
    "lata leonardo kitten 200g": "lata-leonardo-kitten",
    "paw balm": "paw-balm",
    "rascador maxi caja de leche - brnx": "rascador-maxi-caja-de-leche---brnx",
    "snack dental fitness crocante 60g - qchefs": "zupet-dental-fitness-crocante",
    "snack dental power 75g - qchefs": "zupet-dental-power-suave"
  };

  function pacNormOffer(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ').trim();
  }

  function pacGetOffer() {
    if (typeof CURRENT_PRODUCT === 'undefined' || !CURRENT_PRODUCT) return null;

    const id = String(CURRENT_PRODUCT.id || '');
    if (PAC_PRODUCT_OFFERS[id]) return { id, ...PAC_PRODUCT_OFFERS[id] };

    const name = pacNormOffer(CURRENT_PRODUCT.name || CURRENT_PRODUCT.nombre);
    const mapped = PAC_PRODUCT_OFFER_NAMES[name];
    if (mapped && PAC_PRODUCT_OFFERS[mapped]) return { id: mapped, ...PAC_PRODUCT_OFFERS[mapped] };

    return null;
  }

  function pacInjectOfferStyles() {
    if (document.getElementById('pac-live-offer-styles')) return;
    const style = document.createElement('style');
    style.id = 'pac-live-offer-styles';
    style.textContent = `
      .product-tag-row-live{
        display:flex!important;
        align-items:center!important;
        gap:8px!important;
        flex-wrap:wrap!important;
        margin-bottom:0!important;
      }
      .product-offer-badge-live{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        background:#4A7C59!important;
        color:#fff!important;
        border-radius:999px!important;
        padding:5px 10px!important;
        font-family:'Poppins',sans-serif!important;
        font-size:.68rem!important;
        font-weight:800!important;
        letter-spacing:.05em!important;
        line-height:1!important;
        text-transform:uppercase!important;
      }
      .product-price.product-price-live-offer{
        display:block!important;
        margin-top:14px!important;
        color:inherit!important;
        font-size:initial!important;
        line-height:normal!important;
      }
      .product-price-offer-line-live{
        display:flex!important;
        align-items:baseline!important;
        gap:10px!important;
        flex-wrap:wrap!important;
      }
      .product-price-original-live{
        display:inline-block!important;
        color:#8B8179!important;
        font-family:'Poppins',sans-serif!important;
        font-size:.95rem!important;
        font-weight:600!important;
        line-height:1.2!important;
        text-decoration:line-through!important;
        text-decoration-thickness:1.5px!important;
      }
      .product-price-current-live{
        display:inline-block!important;
        color:#C4622D!important;
        font-family:'Poppins',sans-serif!important;
        font-size:1.55rem!important;
        font-weight:900!important;
        line-height:1.1!important;
      }
      .product-saving-live{
        display:inline-flex!important;
        align-items:center!important;
        margin-top:8px!important;
        padding:5px 10px!important;
        border-radius:999px!important;
        background:rgba(74,124,89,.10)!important;
        color:#4A7C59!important;
        font-family:'Poppins',sans-serif!important;
        font-size:.76rem!important;
        font-weight:700!important;
        line-height:1!important;
      }
    `;
    document.head.appendChild(style);
  }

  function pacApplyOfferToCurrentProduct() {
    const offer = pacGetOffer();
    if (!offer) return null;

    CURRENT_PRODUCT.price = offer.price;
    CURRENT_PRODUCT.precioNum = offer.price;
    CURRENT_PRODUCT.precio = '$' + offer.price.toLocaleString('es-CL');
    CURRENT_PRODUCT.precioOriginalNum = offer.original;
    CURRENT_PRODUCT.ahorro = offer.original - offer.price;
    CURRENT_PRODUCT.oferta = true;

    try {
      if (typeof productos !== 'undefined' && productos?.[offer.id]) {
        productos[offer.id].precioNum = offer.price;
        productos[offer.id].precio = '$' + offer.price.toLocaleString('es-CL');
        productos[offer.id].precioOriginalNum = offer.original;
        productos[offer.id].ahorro = offer.original - offer.price;
        productos[offer.id].oferta = true;
      }
    } catch (e) {}

    return offer;
  }

  function pacRenderProductOffer() {
    const offer = pacApplyOfferToCurrentProduct();
    if (!offer) return;

    pacInjectOfferStyles();

    const tag = document.querySelector('.product-info .product-tag');
    if (tag && !document.querySelector('.product-offer-badge-live')) {
      const row = document.createElement('div');
      row.className = 'product-tag-row-live';
      tag.parentNode.insertBefore(row, tag);
      row.appendChild(tag);

      const badge = document.createElement('span');
      badge.className = 'product-offer-badge-live';
      badge.textContent = 'OFERTA';
      row.appendChild(badge);
    }

    const priceBox = document.querySelector('.product-info .product-price');
    if (priceBox) {
      priceBox.classList.add('product-price-live-offer');
      priceBox.innerHTML =
        '<div class="product-price-offer-line-live">' +
          '<span class="product-price-original-live">$' + offer.original.toLocaleString('es-CL') + '</span>' +
          '<span class="product-price-current-live">$' + offer.price.toLocaleString('es-CL') + '</span>' +
        '</div>' +
        '<span class="product-saving-live">Ahorras $' +
          (offer.original - offer.price).toLocaleString('es-CL') +
        '</span>';
    }
  }

  function currentCartQty() {
    try {
      if (typeof cart === 'undefined' || !Array.isArray(cart)) return 0;
      return Number(cart.find(item => item.id === CURRENT_PRODUCT.id)?.qty || 0);
    } catch (error) {
      return 0;
    }
  }

  // Preventa desactivada: ningún producto se trata como preventa.
  function pacIsCurrentPreorder() { return false; }
  function pacRenderCurrentPreorder() {}

  function updateQtyUI() {
    const value = document.getElementById('product-qty-value');
    const minus = document.getElementById('product-qty-minus');
    const plus = document.getElementById('product-qty-plus');
    const add = document.getElementById('add-btn');
    const note = document.getElementById('product-stock-note');

    if (!value || !minus || !plus || !add) return;

    value.textContent = productQty;
    minus.disabled = productQty <= 1;

    if (productStock === 0) {
      plus.disabled = true;
      minus.disabled = true;
      add.disabled = true;
      add.textContent = 'Agotado';
      if (note) {
        note.textContent = 'Producto agotado';
        note.className = 'product-stock-note out';
      }
      return;
    }

    add.disabled = false;
    add.textContent = 'Añadir al carrito';

    const alreadyInCart = currentCartQty();
    const remaining = productStock === null ? null : Math.max(0, productStock - alreadyInCart);
    plus.disabled = remaining !== null && productQty >= remaining;

    if (note) {
      if (remaining === null) {
        note.textContent = '';
        note.className = 'product-stock-note';
      } else if (remaining <= 0) {
        note.textContent = 'Ya tienes todas las unidades disponibles en el carrito';
        note.className = 'product-stock-note out';
        add.disabled = true;
      } else if (remaining <= 4) {
        note.textContent = `Quedan ${remaining} unidad${remaining === 1 ? '' : 'es'} disponible${remaining === 1 ? '' : 's'}`;
        note.className = 'product-stock-note low';
      } else {
        note.textContent = `${remaining} unidades disponibles`;
        note.className = 'product-stock-note';
      }
    }
  }

  window.changeProductPageQty = function changeProductPageQty(delta) {
    const alreadyInCart = currentCartQty();
    const maxSelectable = productStock === null
      ? 99
      : Math.max(1, productStock - alreadyInCart);

    productQty = Math.min(maxSelectable, Math.max(1, productQty + delta));
    updateQtyUI();
  };

  async function loadCurrentProductStock() {
    try {
      const response = await fetch('/api/stock-get?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo consultar el stock');

      const data = await response.json();
      const stock = data?.stock || data || {};

      if (stock && Object.prototype.hasOwnProperty.call(stock, CURRENT_PRODUCT.id)) {
        productStock = Math.max(0, Number(stock[CURRENT_PRODUCT.id]) || 0);
        localStorage.setItem('pac_stock', JSON.stringify(stock));
      }
    } catch (error) {
      try {
        const cached = JSON.parse(localStorage.getItem('pac_stock') || '{}');
        if (Object.prototype.hasOwnProperty.call(cached, CURRENT_PRODUCT.id)) {
          productStock = Math.max(0, Number(cached[CURRENT_PRODUCT.id]) || 0);
        }
      } catch (cacheError) {}
    }

    updateQtyUI();
  }

  window.addCurrentProduct = async function addCurrentProduct() {
    pacApplyOfferToCurrentProduct();
    await loadCurrentProductStock();

    const alreadyInCart = currentCartQty();
    const available = productStock === null ? 99 : Math.max(0, productStock - alreadyInCart);

    if (available <= 0) {
      updateQtyUI();
      return;
    }

    const quantityToAdd = Math.min(productQty, available);

    try {
      if (typeof cart === 'undefined' || !Array.isArray(cart)) {
        throw new Error('El carrito no está disponible');
      }

      const existing = cart.find(item => item.id === CURRENT_PRODUCT.id);

      if (existing) {
        existing.price = CURRENT_PRODUCT.price;
        if ('precioNum' in existing) existing.precioNum = CURRENT_PRODUCT.price;
        existing.maxQty = productStock === null ? Math.max(existing.maxQty || 1, existing.qty + quantityToAdd) : productStock;
        existing.qty = Math.min(existing.maxQty, existing.qty + quantityToAdd);
      } else {
        cart.push({
          ...CURRENT_PRODUCT,
          qty: quantityToAdd,
          maxQty: productStock === null ? quantityToAdd : productStock,
          stockId: CURRENT_PRODUCT.id
        });
      }

      if (typeof renderCart === 'function') renderCart();

      const message = document.getElementById('product-msg');
      if (message) {
        message.textContent = quantityToAdd === 1
          ? 'Producto añadido al carrito'
          : `${quantityToAdd} productos añadidos al carrito`;
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'add_to_cart',
        ecommerce: {
          currency: 'CLP',
          value: CURRENT_PRODUCT.price * quantityToAdd,
          items: [{
            item_id: CURRENT_PRODUCT.id,
            item_name: CURRENT_PRODUCT.name,
            price: CURRENT_PRODUCT.price,
            quantity: quantityToAdd
          }]
        }
      });

      productQty = 1;
      updateQtyUI();

      // Abrir automáticamente el carrito después de agregar el producto.
      if (typeof toggleCart === 'function') {
        setTimeout(() => {
          const sidebar = document.getElementById('cart-sidebar');
          if (!sidebar || !sidebar.classList.contains('open')) toggleCart();
        }, 120);
      }
    } catch (error) {
      console.error('[producto] Error al añadir al carrito:', error);
      const message = document.getElementById('product-msg');
      if (message) message.textContent = 'No fue posible añadir el producto.';
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    pacRenderProductOffer();
    pacRenderCurrentPreorder();
    updateQtyUI();
    loadCurrentProductStock();

    const input = document.querySelector('.nav-search-wrap input');
    if (input) {
      input.removeAttribute('oninput');
      input.addEventListener('input', event => window.runSearch(event.target.value));
    }
  });
})();
