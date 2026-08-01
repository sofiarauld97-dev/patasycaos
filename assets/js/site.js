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
