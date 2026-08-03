
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
        const searchable = normalizeSearchText([
          product?.nombre,
          product?.marca,
          product?.categoria,
          product?.audience,
          id
        ].filter(Boolean).join(' '));

        return searchable.includes(normalizedQuery);
      })
      .slice(0, 7);

    if (!matches.length) {
      drop.innerHTML = '<div class="search-no-results">No encontramos productos con esa búsqueda.</div>';
      drop.style.display = 'block';
      return;
    }

    drop.innerHTML = matches.map(([id, product]) => {
      const image = Array.isArray(product.imagenes) ? product.imagenes[0] : '';
      const slug = getProductSlug(id);
      const price = product.precio || product.precioTexto || '';

      return `
        <a class="nav-search-result" href="/productos/${slug}">
          ${image ? `<img src="${image}" alt="">` : ''}
          <span>
            <strong>${product.nombre || id}</strong>
            ${price ? `<small>${price}</small>` : ''}
          </span>
        </a>`;
    }).join('');

    drop.style.display = 'block';
  };

  function currentCartQty() {
    try {
      if (typeof cart === 'undefined' || !Array.isArray(cart)) return 0;
      return Number(cart.find(item => item.id === CURRENT_PRODUCT.id)?.qty || 0);
    } catch (error) {
      return 0;
    }
  }

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
        existing.maxQty = productStock === null ? Math.max(existing.maxQty || 1, existing.qty + quantityToAdd) : productStock;
        existing.qty = Math.min(existing.maxQty, existing.qty + quantityToAdd);
      } else {
        cart.push({
          ...CURRENT_PRODUCT,
          qty: quantityToAdd,
          maxQty: productStock === null ? quantityToAdd : productStock
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
    updateQtyUI();
    loadCurrentProductStock();

    const input = document.querySelector('.nav-search-wrap input');
    if (input) {
      input.removeAttribute('oninput');
      input.addEventListener('input', event => window.runSearch(event.target.value));
    }
  });
})();
