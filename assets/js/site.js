/* PATAS & CAOS — navegación móvil */
(function () {
  'use strict';

  function cargarBuscadorGlobal() {
    if (document.querySelector('script[data-pac-search]')) return;

    const script = document.createElement('script');
    script.src = '/assets/js/buscador-global.js?v=7';
    script.defer = true;
    script.dataset.pacSearch = 'true';
    document.head.appendChild(script);
  }

  cargarBuscadorGlobal();

  function elementosMenu() {
    return {
      hamburger: document.getElementById('hamburger'),
      menu: document.getElementById('mobile-menu')
    };
  }

  function calcularPosicionMenu() {
    const { menu } = elementosMenu();
    const header = document.querySelector('.site-header');
    if (!menu || !header) return;

    const bottom = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
    menu.style.setProperty('--mobile-menu-top', bottom + 'px');
  }

  function obtenerBackdrop() {
    let backdrop = document.getElementById('menu-backdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'menu-backdrop';
      backdrop.hidden = true;
      backdrop.addEventListener('click', cerrarMenu);
      document.body.appendChild(backdrop);
    }

    return backdrop;
  }

  function cerrarAcordeones() {
    document.querySelectorAll('.mobile-accordion-body.open').forEach(body => {
      body.classList.remove('open');
      const button = body.previousElementSibling;
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  }

  function abrirMenu() {
    const { hamburger, menu } = elementosMenu();
    if (!hamburger || !menu) return;

    calcularPosicionMenu();

    menu.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Cerrar menú');

    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
  }

  function cerrarMenu() {
    const { hamburger, menu } = elementosMenu();
    if (!hamburger || !menu) return;

    menu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Abrir menú');

    cerrarAcordeones();

    const backdrop = document.getElementById('menu-backdrop');
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.style.display = 'none';
    }

    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  window.toggleMenu = function toggleMenu() {
    const { menu } = elementosMenu();
    if (!menu) return;

    if (menu.classList.contains('open')) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  };

  window.toggleAccordion = function toggleAccordion(button) {
    const body = button?.nextElementSibling;
    if (!body) return;

    const abrir = !body.classList.contains('open');

    document.querySelectorAll('.mobile-accordion-body.open').forEach(otherBody => {
      if (otherBody !== body) {
        otherBody.classList.remove('open');
        const otherButton = otherBody.previousElementSibling;
        if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
      }
    });

    body.classList.toggle('open', abrir);
    button.setAttribute('aria-expanded', String(abrir));
  };


  function asegurarNavOfertas() {
    // Estilo único y compartido para TODAS las páginas.
    if (!document.getElementById('pac-ofertas-nav-style')) {
      const style = document.createElement('style');
      style.id = 'pac-ofertas-nav-style';
      style.textContent = `
        .nav-bottom{
          display:flex!important;
          align-items:center!important;
        }
        .nav-links{
          display:flex!important;
          align-items:center!important;
        }
        .nav-links > li{
          display:flex!important;
          align-items:center!important;
        }
        .nav-links .nav-ofertas-link{
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          height:32px!important;
          min-height:32px!important;
          padding:0 16px!important;
          margin:0!important;
          border:0!important;
          border-radius:999px!important;
          background:#C4622D!important;
          color:#fff!important;
          box-shadow:none!important;
          font-family:'Poppins',sans-serif!important;
          font-size:13px!important;
          font-weight:700!important;
          letter-spacing:0!important;
          line-height:32px!important;
          text-transform:none!important;
          text-decoration:none!important;
          white-space:nowrap!important;
          position:static!important;
          transform:none!important;
          align-self:center!important;
        }
        .nav-links .nav-ofertas-link:hover,
        .nav-links .nav-ofertas-link.activo{
          background:#A94F26!important;
          color:#fff!important;
        }
        .nav-links .nav-ofertas-link::before,
        .nav-links .nav-ofertas-link::after{
          content:none!important;
          display:none!important;
        }

        .mobile-menu .nav-ofertas-link{
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          width:max-content!important;
          min-height:36px!important;
          padding:0 16px!important;
          margin:6px 0 10px!important;
          border-radius:999px!important;
          background:#C4622D!important;
          color:#fff!important;
          font-family:'Poppins',sans-serif!important;
          font-size:13px!important;
          font-weight:700!important;
          line-height:36px!important;
          text-decoration:none!important;
          text-transform:none!important;
        }
        .mobile-menu .nav-ofertas-link::before,
        .mobile-menu .nav-ofertas-link::after{
          content:none!important;
          display:none!important;
        }
      `;
      document.head.appendChild(style);
    }

    // Desktop: insertar después de Tienda si la página todavía no lo tiene.
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      let ofertaLi = navLinks.querySelector('a[href="/tienda?ofertas=1"]')?.closest('li');
      if (!ofertaLi) {
        const tiendaLink = [...navLinks.querySelectorAll('a')].find(a => {
          const href = a.getAttribute('href');
          return href === '/tienda' || href === '/tienda.html';
        });
        if (tiendaLink) {
          ofertaLi = document.createElement('li');
          const oferta = document.createElement('a');
          oferta.href = '/tienda?ofertas=1';
          oferta.className = 'nav-ofertas-link';
          oferta.textContent = 'Ofertas';
          ofertaLi.appendChild(oferta);
          tiendaLink.closest('li')?.insertAdjacentElement('afterend', ofertaLi);
        }
      } else {
        const oferta = ofertaLi.querySelector('a');
        oferta.classList.add('nav-ofertas-link');
        oferta.textContent = 'Ofertas';
      }
    }

    // Móvil: insertar después de Tienda si falta.
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      let ofertaMobile = mobileMenu.querySelector('a[href="/tienda?ofertas=1"]');
      if (!ofertaMobile) {
        const tiendaMobile = [...mobileMenu.querySelectorAll(':scope > a')].find(a => {
          const href = a.getAttribute('href');
          return href === '/tienda' || href === '/tienda.html';
        });
        if (tiendaMobile) {
          ofertaMobile = document.createElement('a');
          ofertaMobile.href = '/tienda?ofertas=1';
          ofertaMobile.className = 'nav-ofertas-link';
          ofertaMobile.textContent = 'Ofertas';
          ofertaMobile.addEventListener('click', cerrarMenu);
          tiendaMobile.insertAdjacentElement('afterend', ofertaMobile);
        }
      } else {
        ofertaMobile.classList.add('nav-ofertas-link');
        ofertaMobile.textContent = 'Ofertas';
      }
    }
  }

  function updateHeaderOnScroll() {
    const header = document.querySelector('.site-header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);

    const { menu } = elementosMenu();
    if (menu?.classList.contains('open')) calcularPosicionMenu();
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') cerrarMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) cerrarMenu();
    else calcularPosicionMenu();
  });

  window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });

  document.addEventListener('DOMContentLoaded', () => {
    asegurarNavOfertas();

    const { hamburger, menu } = elementosMenu();

    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-controls', 'mobile-menu');
      hamburger.setAttribute('aria-label', 'Abrir menú');
    }

    if (menu) menu.setAttribute('aria-hidden', 'false');

    calcularPosicionMenu();
    updateHeaderOnScroll();
  });
})();
