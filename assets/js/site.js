/* PATAS & CAOS — navegación móvil */
(function () {
  'use strict';

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

    const backdrop = obtenerBackdrop();
    backdrop.hidden = false;
    backdrop.style.display = 'block';

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
