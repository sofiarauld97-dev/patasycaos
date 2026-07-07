// cart.js — Patas & Caos shared cart, checkout & auth
// Este archivo es cargado por todas las páginas

// Stock — se obtiene siempre de /api/stock-get (fuente real: Redis).
// getStock() devuelve el último stock conocido en caché, o {} si aún no hay datos.
// Un objeto vacío se trata como "todavía no sabemos" (ver checkStockCard en
// tienda.html/index.html), NO como "todo agotado" — así los productos nuevos
// nunca quedan escondidos mientras llega la primera respuesta del servidor.
function getStock() {
  try {
    const s = localStorage.getItem('pac_stock');
    if (s) {
      const p = JSON.parse(s);
      if (p && typeof p === 'object' && !Array.isArray(p) && Object.keys(p).length > 0) return p;
    }
  } catch(e) {}
  return {};
}

let cart = [];

// Cargar carrito desde localStorage al iniciar
(function() {
  try {
    const saved = localStorage.getItem('pac_cart');
    if (saved) cart = JSON.parse(saved);
  } catch(e) {}
})();

function guardarCarritoLocal() {
  try { localStorage.setItem('pac_cart', JSON.stringify(cart)); } catch(e) {}
}

function toggleCart() { document.getElementById('cart-overlay').classList.toggle('open'); document.getElementById('cart-sidebar').classList.toggle('open'); document.body.style.overflow = document.getElementById('cart-sidebar').classList.contains('open') ? 'hidden' : ''; }
function addToCart(product) {
  const stock = getStock();
  const maxQty = stock[product.id] ?? 1;
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    if (existing.qty >= existing.maxQty) { mostrarToastCarrito(`Solo quedan ${existing.maxQty} unidades disponibles 🐾`); if (!document.getElementById('cart-sidebar').classList.contains('open')) toggleCart(); return; }
    existing.qty++;
    renderCart();
    return;
  }
  cart.push({...product, qty: 1, maxQty});
  renderCart();
  if (!document.getElementById('cart-sidebar').classList.contains('open')) toggleCart();
}
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const nuevaQty = item.qty + delta;
  if (nuevaQty > item.maxQty) { mostrarToastCarrito(`Solo quedan ${item.maxQty} unidades disponibles 🐾`); return; }
  item.qty = nuevaQty;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  renderCart();
}
let toastTimer;
function mostrarToastCarrito(msg) {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--negro);color:#fff;border-radius:50px;padding:12px 24px;font-size:.85rem;font-weight:600;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;font-family:Poppins,sans-serif;white-space:nowrap;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.style.opacity = '0', 2500);
}
function removeItem(id) { cart = cart.filter(i => i.id !== id); renderCart(); guardarCarritoLocal(); }
function renderCart() {
  guardarCarritoLocal();
  const container = document.getElementById('cart-items'), footer = document.getElementById('cart-footer'), badge = document.getElementById('cart-badge');
  const totalItems = cart.reduce((s,i) => s+i.qty, 0), totalPrice = cart.reduce((s,i) => s+i.price*i.qty, 0);
  badge.textContent = totalItems; badge.style.display = totalItems > 0 ? 'flex' : 'none';
  if (cart.length === 0) { container.innerHTML = '<div class="cart-empty"><span>🐾</span>Tu carrito está vacío.<br>¡Agrega algo de caos!</div>'; footer.style.display = 'none'; return; }
  footer.style.display = 'block';
  document.getElementById('cart-total').textContent = '$' + totalPrice.toLocaleString('es-CL');
  container.innerHTML = cart.map(item => `<div class="cart-item"><img class="cart-item-img" src="${item.img}" alt="${item.name}" onerror="this.style.background='#f0dfc0'"><div class="cart-item-info"><h4>${item.name}</h4><div class="price">$${(item.price*item.qty).toLocaleString('es-CL')}</div><div class="cart-item-qty"><button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button><span class="qty-num">${item.qty}</span><button class="qty-btn" onclick="changeQty('${item.id}',1)" ${item.qty >= item.maxQty ? 'disabled style="opacity:.35;cursor:not-allowed"' : ''}>+</button></div></div><button class="cart-item-remove" onclick="removeItem('${item.id}')">✕</button></div>`).join('');
}

const COMUNAS_CHILE = [
  // RM - Santiago
  {c:'Cerrillos',city:'Santiago'},{c:'Cerro Navia',city:'Santiago'},{c:'Conchalí',city:'Santiago'},
  {c:'El Bosque',city:'Santiago'},{c:'Estación Central',city:'Santiago'},{c:'Huechuraba',city:'Santiago'},
  {c:'Independencia',city:'Santiago'},{c:'La Cisterna',city:'Santiago'},{c:'La Florida',city:'Santiago'},
  {c:'La Granja',city:'Santiago'},{c:'La Pintana',city:'Santiago'},{c:'La Reina',city:'Santiago'},
  {c:'Las Condes',city:'Santiago'},{c:'Lo Barnechea',city:'Santiago'},{c:'Lo Espejo',city:'Santiago'},
  {c:'Lo Prado',city:'Santiago'},{c:'Macul',city:'Santiago'},{c:'Maipú',city:'Santiago'},
  {c:'Ñuñoa',city:'Santiago'},{c:'Pedro Aguirre Cerda',city:'Santiago'},{c:'Peñalolén',city:'Santiago'},
  {c:'Providencia',city:'Santiago'},{c:'Pudahuel',city:'Santiago'},{c:'Puente Alto',city:'Santiago'},
  {c:'Quilicura',city:'Santiago'},{c:'Quinta Normal',city:'Santiago'},{c:'Recoleta',city:'Santiago'},
  {c:'Renca',city:'Santiago'},{c:'San Bernardo',city:'Santiago'},{c:'San Joaquín',city:'Santiago'},
  {c:'San Miguel',city:'Santiago'},{c:'San Ramón',city:'Santiago'},{c:'Santiago',city:'Santiago'},
  {c:'Vitacura',city:'Santiago'},{c:'Colina',city:'Santiago'},{c:'Chicureo',city:'Santiago'},
  {c:'Lampa',city:'Santiago'},{c:'Til Til',city:'Santiago'},{c:'Buin',city:'Santiago'},
  {c:'Calera de Tango',city:'Santiago'},{c:'Paine',city:'Santiago'},{c:'San José de Maipo',city:'Santiago'},
  {c:'Alhué',city:'Santiago'},{c:'Curacaví',city:'Santiago'},{c:'El Monte',city:'Santiago'},
  {c:'Isla de Maipo',city:'Santiago'},{c:'Melipilla',city:'Santiago'},{c:'Padre Hurtado',city:'Santiago'},
  {c:'Peñaflor',city:'Santiago'},{c:'San Pedro',city:'Santiago'},{c:'Talagante',city:'Santiago'},
  {c:'Pirque',city:'Santiago'},
  // Valparaíso
  {c:'Valparaíso',city:'Valparaíso'},{c:'Viña del Mar',city:'Valparaíso'},{c:'Quilpué',city:'Valparaíso'},
  {c:'Villa Alemana',city:'Valparaíso'},{c:'Concón',city:'Valparaíso'},{c:'Casablanca',city:'Valparaíso'},
  {c:'Algarrobo',city:'Valparaíso'},{c:'Cartagena',city:'Valparaíso'},{c:'El Quisco',city:'Valparaíso'},
  {c:'El Tabo',city:'Valparaíso'},{c:'San Antonio',city:'Valparaíso'},{c:'Santo Domingo',city:'Valparaíso'},
  {c:'San Felipe',city:'San Felipe'},{c:'Los Andes',city:'Los Andes'},{c:'Calle Larga',city:'Los Andes'},
  {c:'Rinconada',city:'Los Andes'},{c:'San Esteban',city:'Los Andes'},{c:'La Calera',city:'Valparaíso'},
  {c:'Hijuelas',city:'Valparaíso'},{c:'La Cruz',city:'Valparaíso'},{c:'Nogales',city:'Valparaíso'},
  {c:'Quillota',city:'Valparaíso'},{c:'La Ligua',city:'Valparaíso'},{c:'Papudo',city:'Valparaíso'},
  {c:'Petorca',city:'Valparaíso'},{c:'Zapallar',city:'Valparaíso'},{c:'Limache',city:'Valparaíso'},
  {c:'Olmué',city:'Valparaíso'},{c:'Cabildo',city:'Valparaíso'},{c:'Puchuncaví',city:'Valparaíso'},
  {c:'Quintero',city:'Valparaíso'},{c:'Isla de Pascua',city:'Isla de Pascua'},
  // Biobío
  {c:'Concepción',city:'Concepción'},{c:'Chiguayante',city:'Concepción'},{c:'Coronel',city:'Concepción'},
  {c:'Hualpén',city:'Concepción'},{c:'Hualqui',city:'Concepción'},{c:'Lota',city:'Concepción'},
  {c:'Penco',city:'Concepción'},{c:'San Pedro de la Paz',city:'Concepción'},{c:'Santa Juana',city:'Concepción'},
  {c:'Talcahuano',city:'Concepción'},{c:'Tomé',city:'Concepción'},{c:'Los Ángeles',city:'Los Ángeles'},
  {c:'Antuco',city:'Los Ángeles'},{c:'Cabrero',city:'Los Ángeles'},{c:'Laja',city:'Los Ángeles'},
  {c:'Mulchén',city:'Los Ángeles'},{c:'Nacimiento',city:'Los Ángeles'},{c:'Negrete',city:'Los Ángeles'},
  {c:'Quilaco',city:'Los Ángeles'},{c:'Quilleco',city:'Los Ángeles'},{c:'San Rosendo',city:'Los Ángeles'},
  {c:'Santa Bárbara',city:'Los Ángeles'},{c:'Tucapel',city:'Los Ángeles'},{c:'Yumbel',city:'Los Ángeles'},
  {c:'Arauco',city:'Concepción'},{c:'Cañete',city:'Concepción'},{c:'Contulmo',city:'Concepción'},
  {c:'Curanilahue',city:'Concepción'},{c:'Lebu',city:'Concepción'},{c:'Los Álamos',city:'Concepción'},
  {c:'Tirúa',city:'Concepción'},{c:'Chillán',city:'Chillán'},{c:'Bulnes',city:'Chillán'},
  {c:'Chillán Viejo',city:'Chillán'},{c:'Cobquecura',city:'Chillán'},{c:'Coelemu',city:'Chillán'},
  {c:'Coihueco',city:'Chillán'},{c:'El Carmen',city:'Chillán'},{c:'Ninhue',city:'Chillán'},
  {c:'Pemuco',city:'Chillán'},{c:'Pinto',city:'Chillán'},{c:'Portezuelo',city:'Chillán'},
  {c:'Quillón',city:'Chillán'},{c:'Quirihue',city:'Chillán'},{c:'Ránquil',city:'Chillán'},
  {c:'San Carlos',city:'Chillán'},{c:'San Fabián',city:'Chillán'},{c:'San Ignacio',city:'Chillán'},
  {c:'San Nicolás',city:'Chillán'},{c:'Treguaco',city:'Chillán'},{c:'Yungay',city:'Chillán'},
  // Araucanía
  {c:'Temuco',city:'Temuco'},{c:'Padre Las Casas',city:'Temuco'},{c:'Carahue',city:'Temuco'},
  {c:'Cholchol',city:'Temuco'},{c:'Cunco',city:'Temuco'},{c:'Curarrehue',city:'Temuco'},
  {c:'Freire',city:'Temuco'},{c:'Galvarino',city:'Temuco'},{c:'Gorbea',city:'Temuco'},
  {c:'Lautaro',city:'Temuco'},{c:'Loncoche',city:'Temuco'},{c:'Melipeuco',city:'Temuco'},
  {c:'Nueva Imperial',city:'Temuco'},{c:'Perquenco',city:'Temuco'},{c:'Pitrufquén',city:'Temuco'},
  {c:'Pucón',city:'Temuco'},{c:'Saavedra',city:'Temuco'},{c:'Teodoro Schmidt',city:'Temuco'},
  {c:'Toltén',city:'Temuco'},{c:'Vilcún',city:'Temuco'},{c:'Villarrica',city:'Temuco'},
  {c:'Angol',city:'Angol'},{c:'Collipulli',city:'Angol'},{c:'Curacautín',city:'Angol'},
  {c:'Ercilla',city:'Angol'},{c:'Lonquimay',city:'Angol'},{c:'Los Sauces',city:'Angol'},
  {c:'Lumaco',city:'Angol'},{c:'Purén',city:'Angol'},{c:'Renaico',city:'Angol'},{c:'Traiguén',city:'Angol'},
  {c:'Victoria',city:'Angol'},
  // Los Lagos
  {c:'Puerto Montt',city:'Puerto Montt'},{c:'Calbuco',city:'Puerto Montt'},{c:'Cochamó',city:'Puerto Montt'},
  {c:'Fresia',city:'Puerto Montt'},{c:'Frutillar',city:'Puerto Montt'},{c:'Los Muermos',city:'Puerto Montt'},
  {c:'Llanquihue',city:'Puerto Montt'},{c:'Maullín',city:'Puerto Montt'},{c:'Puerto Varas',city:'Puerto Montt'},
  {c:'Osorno',city:'Osorno'},{c:'Puerto Octay',city:'Osorno'},{c:'Purranque',city:'Osorno'},
  {c:'Puyehue',city:'Osorno'},{c:'Río Negro',city:'Osorno'},{c:'San Juan de la Costa',city:'Osorno'},
  {c:'San Pablo',city:'Osorno'},{c:'Castro',city:'Castro'},{c:'Ancud',city:'Ancud'},
  {c:'Chonchi',city:'Castro'},{c:'Curaco de Vélez',city:'Castro'},{c:'Dalcahue',city:'Castro'},
  {c:'Puqueldón',city:'Castro'},{c:'Queilén',city:'Castro'},{c:'Quellón',city:'Castro'},
  {c:'Quemchi',city:'Castro'},{c:'Quinchao',city:'Castro'},{c:'Chaitén',city:'Chaitén'},
  {c:'Futaleufú',city:'Chaitén'},{c:'Hualaihué',city:'Chaitén'},{c:'Palena',city:'Chaitén'},
  // Los Ríos
  {c:'Valdivia',city:'Valdivia'},{c:'Corral',city:'Valdivia'},{c:'Futrono',city:'Valdivia'},
  {c:'La Unión',city:'Valdivia'},{c:'Lago Ranco',city:'Valdivia'},{c:'Lanco',city:'Valdivia'},
  {c:'Los Lagos',city:'Valdivia'},{c:'Máfil',city:'Valdivia'},{c:'Mariquina',city:'Valdivia'},
  {c:'Paillaco',city:'Valdivia'},{c:'Panguipulli',city:'Valdivia'},{c:'Río Bueno',city:'Valdivia'},
  // O'Higgins
  {c:'Rancagua',city:'Rancagua'},{c:'Codegua',city:'Rancagua'},{c:'Coínco',city:'Rancagua'},
  {c:'Coltauco',city:'Rancagua'},{c:'Doñihue',city:'Rancagua'},{c:'Graneros',city:'Rancagua'},
  {c:'Las Cabras',city:'Rancagua'},{c:'Machalí',city:'Rancagua'},{c:'Malloa',city:'Rancagua'},
  {c:'Mostazal',city:'Rancagua'},{c:'Olivar',city:'Rancagua'},{c:'Peumo',city:'Rancagua'},
  {c:'Pichidegua',city:'Rancagua'},{c:'Quinta de Tilcoco',city:'Rancagua'},{c:'Rengo',city:'Rancagua'},
  {c:'Requínoa',city:'Rancagua'},{c:'San Vicente',city:'Rancagua'},{c:'Pichilemu',city:'Pichilemu'},
  {c:'La Estrella',city:'Pichilemu'},{c:'Litueche',city:'Pichilemu'},{c:'Marchihue',city:'Pichilemu'},
  {c:'Navidad',city:'Pichilemu'},{c:'Paredones',city:'Pichilemu'},{c:'San Fernando',city:'San Fernando'},
  {c:'Chépica',city:'San Fernando'},{c:'Chimbarongo',city:'San Fernando'},{c:'Lolol',city:'San Fernando'},
  {c:'Nancagua',city:'San Fernando'},{c:'Palmilla',city:'San Fernando'},{c:'Peralillo',city:'San Fernando'},
  {c:'Placilla',city:'San Fernando'},{c:'Pumanque',city:'San Fernando'},{c:'Santa Cruz',city:'San Fernando'},
  // Maule
  {c:'Talca',city:'Talca'},{c:'Constitución',city:'Talca'},{c:'Curepto',city:'Talca'},
  {c:'Empedrado',city:'Talca'},{c:'Maule',city:'Talca'},{c:'Pelarco',city:'Talca'},
  {c:'Pencahue',city:'Talca'},{c:'Río Claro',city:'Talca'},{c:'San Clemente',city:'Talca'},
  {c:'San Rafael',city:'Talca'},{c:'Cauquenes',city:'Cauquenes'},{c:'Chanco',city:'Cauquenes'},
  {c:'Pelluhue',city:'Cauquenes'},{c:'Curicó',city:'Curicó'},{c:'Hualañé',city:'Curicó'},
  {c:'Licantén',city:'Curicó'},{c:'Molina',city:'Curicó'},{c:'Rauco',city:'Curicó'},
  {c:'Romeral',city:'Curicó'},{c:'Sagrada Familia',city:'Curicó'},{c:'Teno',city:'Curicó'},
  {c:'Vichuquén',city:'Curicó'},{c:'Linares',city:'Linares'},{c:'Colbún',city:'Linares'},
  {c:'Longaví',city:'Linares'},{c:'Parral',city:'Linares'},{c:'Retiro',city:'Linares'},
  {c:'San Javier',city:'Linares'},{c:'Villa Alegre',city:'Linares'},{c:'Yerbas Buenas',city:'Linares'},
  // Coquimbo
  {c:'La Serena',city:'La Serena'},{c:'Coquimbo',city:'La Serena'},{c:'Andacollo',city:'La Serena'},
  {c:'La Higuera',city:'La Serena'},{c:'Paihuano',city:'La Serena'},{c:'Vicuña',city:'La Serena'},
  {c:'Ovalle',city:'Ovalle'},{c:'Combarbalá',city:'Ovalle'},{c:'Monte Patria',city:'Ovalle'},
  {c:'Punitaqui',city:'Ovalle'},{c:'Río Hurtado',city:'Ovalle'},{c:'Illapel',city:'Illapel'},
  {c:'Canela',city:'Illapel'},{c:'Los Vilos',city:'Illapel'},{c:'Salamanca',city:'Illapel'},
  // Atacama
  {c:'Copiapó',city:'Copiapó'},{c:'Caldera',city:'Copiapó'},{c:'Tierra Amarilla',city:'Copiapó'},
  {c:'Chañaral',city:'Chañaral'},{c:'Diego de Almagro',city:'Chañaral'},{c:'Vallenar',city:'Vallenar'},
  {c:'Alto del Carmen',city:'Vallenar'},{c:'Freirina',city:'Vallenar'},{c:'Huasco',city:'Vallenar'},
  // Antofagasta
  {c:'Antofagasta',city:'Antofagasta'},{c:'Mejillones',city:'Antofagasta'},{c:'Sierra Gorda',city:'Antofagasta'},
  {c:'Taltal',city:'Antofagasta'},{c:'Calama',city:'Calama'},{c:'Ollagüe',city:'Calama'},
  {c:'San Pedro de Atacama',city:'Calama'},{c:'Tocopilla',city:'Tocopilla'},{c:'María Elena',city:'Tocopilla'},
  // Tarapacá
  {c:'Iquique',city:'Iquique'},{c:'Alto Hospicio',city:'Iquique'},{c:'Pozo Almonte',city:'Iquique'},
  {c:'Camiña',city:'Iquique'},{c:'Colchane',city:'Iquique'},{c:'Huara',city:'Iquique'},{c:'Pica',city:'Iquique'},
  // Arica y Parinacota
  {c:'Arica',city:'Arica'},{c:'Camarones',city:'Arica'},{c:'Putre',city:'Arica'},{c:'General Lagos',city:'Arica'},
  // Aysén
  {c:'Coyhaique',city:'Coyhaique'},{c:'Lago Verde',city:'Coyhaique'},{c:'Aysén',city:'Aysén'},
  {c:'Cisnes',city:'Aysén'},{c:'Guaitecas',city:'Aysén'},{c:'Cochrane',city:'Cochrane'},
  {c:'O\u2019Higgins',city:'Cochrane'},{c:'Tortel',city:'Cochrane'},{c:'Chile Chico',city:'Chile Chico'},
  {c:'Río Ibáñez',city:'Chile Chico'},
  // Magallanes
  {c:'Punta Arenas',city:'Punta Arenas'},{c:'Laguna Blanca',city:'Punta Arenas'},
  {c:'Río Verde',city:'Punta Arenas'},{c:'San Gregorio',city:'Punta Arenas'},
  {c:'Cabo de Hornos',city:'Puerto Williams'},{c:'Antártica',city:'Puerto Williams'},
  {c:'Porvenir',city:'Porvenir'},{c:'Primavera',city:'Porvenir'},{c:'Timaukel',city:'Porvenir'},
  {c:'Natales',city:'Puerto Natales'},{c:'Torres del Paine',city:'Puerto Natales'},
];

const TARIFAS_COMUNA = {
  // Tramo 1 — Sector Oriente y Central — $3.990
  'providencia': 3990, 'las condes': 3990, 'vitacura': 3990, 'nunoa': 3990,
  'la reina': 3990, 'santiago': 3990, 'macul': 3990,
  // Tramo 2 — Sector Intermedio — $4.990
  'san miguel': 4990, 'san joaquin': 4990, 'pedro aguirre cerda': 4990,
  'penalolen': 4990, 'la florida': 4990, 'lo barnechea': 4990,
  'independencia': 4990, 'recoleta': 4990, 'quinta normal': 4990,
  'estacion central': 4990, 'cerrillos': 4990, 'la cisterna': 4990,
  // Tramo 3 — Sector Periférico / Extremo — $5.990
  'maipu': 5990, 'puente alto': 5990, 'san bernardo': 5990, 'quilicura': 5990,
  'pudahuel': 5990, 'renca': 5990, 'cerro navia': 5990, 'lo prado': 5990,
  'el bosque': 5990, 'la pintana': 5990, 'lo espejo': 5990, 'conchali': 5990,
  'huechuraba': 5990, 'san ramon': 5990, 'la granja': 5990,
};

const COMUNAS_EXCLUIDAS_RADIO = [
  'colina', 'chicureo', 'lampa', 'til til',
  'padre hurtado', 'penaflor', 'talagante', 'el monte', 'melipilla',
  'buin', 'paine', 'calera de tango',
  'pirque', 'san jose de maipo',
];

function normalizarComuna(str) {
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function calcularEnvio(comuna) {
  if (!comuna) return null;
  const c = normalizarComuna(comuna);
  const horaActual = new Date().getHours();
  const entregaHoy = horaActual < 10 ? ' \u2022 Entrega hoy si compras antes de las 10:00 AM \ud83d\ude80' : '';

  if (Object.prototype.hasOwnProperty.call(TARIFAS_COMUNA, c)) {
    const precio = TARIFAS_COMUNA[c];
    return { precio, texto: '$' + precio.toLocaleString('es-CL'), aviso: 'Despacho a domicilio' + entregaHoy };
  }
  if (COMUNAS_EXCLUIDAS_RADIO.includes(c)) {
    return { precio: 0, texto: 'A coordinar', aviso: 'Fuera de nuestro radio de despacho interno \u2014 se coordina por courier externo (Starken, Blue Express o Correos Chile)' };
  }
  return { precio: 0, texto: 'A coordinar', aviso: 'Para regiones el env\u00edo se coordina por WhatsApp' };
}


function initComunaAutocomplete() {
  const input = document.getElementById('co-comuna');
  const ciudadInput = document.getElementById('co-ciudad');
  if (!input || input.dataset.autocomplete) return;
  input.dataset.autocomplete = '1';
  input.setAttribute('autocomplete', 'off');
  input.placeholder = 'Escribe tu comuna...';

  // Crear dropdown
  const dd = document.createElement('div');
  dd.id = 'comuna-dropdown';
  dd.style.cssText = 'position:absolute;z-index:10000;background:#fff;border:1.5px solid rgba(28,16,7,.15);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:200px;overflow-y:auto;width:100%;display:none;';
  input.parentElement.style.position = 'relative';
  input.parentElement.appendChild(dd);

  function normalizar(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }

  function mostrar(query) {
    const q = normalizar(query);
    if (!q) { dd.style.display = 'none'; return; }
    const matches = COMUNAS_CHILE.filter(x => normalizar(x.c).startsWith(q))
      .concat(COMUNAS_CHILE.filter(x => !normalizar(x.c).startsWith(q) && normalizar(x.c).includes(q)))
      .slice(0, 12);
    if (!matches.length) { dd.style.display = 'none'; return; }
    dd.innerHTML = matches.map(x =>
      `<div class="comuna-opt" data-c="${x.c}" data-city="${x.city}" style="padding:9px 14px;cursor:pointer;font-size:.85rem;color:#1C1007;border-bottom:1px solid rgba(28,16,7,.06)">${x.c} <span style="font-size:.75rem;color:#8a7a6e">— ${x.city}</span></div>`
    ).join('');
    dd.style.display = 'block';
    dd.querySelectorAll('.comuna-opt').forEach(opt => {
      opt.addEventListener('mousedown', e => {
        e.preventDefault();
        input.value = opt.dataset.c;
        if (ciudadInput) ciudadInput.value = opt.dataset.city;
        dd.style.display = 'none';
        actualizarEnvio();
      });
      opt.addEventListener('mouseover', () => opt.style.background = 'var(--cream,#F5ECD7)');
      opt.addEventListener('mouseout', () => opt.style.background = '');
    });
  }

  input.addEventListener('input', () => mostrar(input.value));
  input.addEventListener('focus', () => { if (input.value) mostrar(input.value); });
  document.addEventListener('click', e => { if (!input.parentElement.contains(e.target)) dd.style.display = 'none'; });
}

function actualizarEnvio() {
  const metodoEl = document.querySelector('input[name="metodo-envio"]:checked');
  const metodo = metodoEl ? metodoEl.value : 'despacho';
  const camposEnvio = document.getElementById('campos-envio');
  const retiroInfo = document.getElementById('retiro-info');
  const infoEl = document.getElementById('envio-info');
  const precioEl = document.getElementById('envio-precio');
  const avisoEl = document.getElementById('envio-aviso');
  document.querySelectorAll('.metodo-btn').forEach(l => l.classList.remove('activo'));
  const lblActivo = document.getElementById(metodo === 'retiro' ? 'lbl-retiro' : 'lbl-despacho');
  if (lblActivo) lblActivo.classList.add('activo');
  if (metodo === 'retiro') {
    if (camposEnvio) camposEnvio.style.display = 'none';
    if (retiroInfo) retiroInfo.style.display = 'block';
    if (infoEl) infoEl.style.display = 'none';
    if (avisoEl) avisoEl.textContent = '';
    return;
  }
  if (camposEnvio) camposEnvio.style.display = 'block';
  if (retiroInfo) retiroInfo.style.display = 'none';
  const comuna = document.getElementById('co-comuna').value;
  const subtotalActual = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const esGratis = subtotalActual >= 39990;
  const resultado = calcularEnvio(comuna);
  if (!resultado || !comuna) { if(infoEl) infoEl.style.display = 'none'; if(avisoEl) avisoEl.textContent = ''; return; }
  infoEl.style.display = 'flex';
  precioEl.textContent = esGratis ? '¡Gratis!' : resultado.texto;
  precioEl.style.color = esGratis ? '#3B6D11' : '';
  avisoEl.textContent = esGratis ? '🎉 Tu pedido tiene envío gratis' : resultado.aviso;
}


async function checkout() {
  if (cart.length === 0) return;
  // Mostrar resumen en el modal
  const resumen = document.getElementById('checkoutResumen');
  resumen.innerHTML = cart.map(i => `<div class="checkout-resumen-item"><span>${i.name} x${i.qty}</span><span>$${(i.price*i.qty).toLocaleString('es-CL')}</span></div>`).join('') +
    `<div class="checkout-resumen-total"><span>Total</span><span>$${cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString('es-CL')}</span></div>`;

  // Inyectar selector de método de pago si no existe
  if (!document.getElementById('pago-metodo-wrap')) {
    const btns = document.querySelector('.checkout-btns');
    if (btns) {
      const wrap = document.createElement('div');
      wrap.id = 'pago-metodo-wrap';
      wrap.style.marginTop = '1rem';
      wrap.innerHTML = `
        <p class="checkout-section-label">Método de pago</p>
        <div class="checkout-metodo-toggle">
          <label class="metodo-btn activo" id="lbl-mp">
            <input type="radio" name="metodo-pago" value="mercadopago" checked onchange="togglePagoUI()">
            💳 Mercado Pago
          </label>
          <label class="metodo-btn" id="lbl-transfer">
            <input type="radio" name="metodo-pago" value="transferencia" onchange="togglePagoUI()">
            🏦 Transferencia bancaria
          </label>
        </div>
        <div id="transfer-info" style="display:none;background:#f5ecd7;border-radius:12px;padding:1rem 1.2rem;margin-top:.75rem;font-size:.85rem;line-height:1.9;color:#4a3a2e">
          <div style="font-weight:700;margin-bottom:.3rem;color:#C4622D">🏦 Datos para transferir</div>
          <div><strong>Banco:</strong> Santander</div>
          <div><strong>Tipo de cuenta:</strong> Corriente</div>
          <div><strong>N° de cuenta:</strong> 75925395</div>
          <div><strong>RUT:</strong> 19.636.805-1</div>
          <div><strong>Nombre:</strong> Sofía Rauld Lagos</div>
          <div><strong>Email:</strong> contacto@patasycaos.cl</div>
          <div style="margin-top:.5rem;padding-top:.5rem;border-top:1px solid rgba(28,16,7,.1);font-size:.8rem">
            📸 Envía el comprobante al email o por WhatsApp. Tu pedido se prepara una vez confirmado el pago.
          </div>
        </div>`;
      btns.parentNode.insertBefore(wrap, btns);
    }
  }

  document.getElementById('checkoutOverlay').classList.add('activo');
  document.body.style.overflow = 'hidden';
  setTimeout(initComunaAutocomplete, 50);
}

function togglePagoUI() {
  const metodo = document.querySelector('input[name="metodo-pago"]:checked')?.value;
  const transferInfo = document.getElementById('transfer-info');
  const btnConfirm = document.querySelector('.btn-checkout-confirm');
  document.getElementById('lbl-mp')?.classList.toggle('activo', metodo === 'mercadopago');
  document.getElementById('lbl-transfer')?.classList.toggle('activo', metodo === 'transferencia');
  if (transferInfo) transferInfo.style.display = metodo === 'transferencia' ? 'block' : 'none';
  if (btnConfirm) btnConfirm.innerHTML = metodo === 'transferencia'
    ? '🏦 Confirmar pedido'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Confirmar y pagar';
}

function cerrarCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('activo');
  document.body.style.overflow = '';
}
function seleccionarDoc(tipo) {
  document.getElementById('btn-boleta').classList.toggle('activo', tipo === 'boleta');
  document.getElementById('btn-factura').classList.toggle('activo', tipo === 'factura');
  document.getElementById('factura-fields').style.display = tipo === 'factura' ? 'block' : 'none';
}


async function confirmarCheckout() {
  const nombre   = document.getElementById('co-nombre').value.trim();
  const telefono = document.getElementById('co-telefono').value.trim();
  const email    = document.getElementById('co-email').value.trim();
  const direccion= document.getElementById('co-direccion').value.trim();
  const comuna   = document.getElementById('co-comuna').value.trim();
  const ciudad   = document.getElementById('co-ciudad').value.trim();
  const notas    = document.getElementById('co-notas').value.trim();
  const esFactura = document.getElementById('btn-factura') && document.getElementById('btn-factura').classList.contains('activo');
  let docInfo = {};
  if (esFactura) {
    const rut     = document.getElementById('co-rut').value.trim();
    const razon   = document.getElementById('co-razon').value.trim();
    const giro    = document.getElementById('co-giro').value.trim();
    const dirFact = document.getElementById('co-dir-factura').value.trim();
    if (!rut || !razon || !giro || !dirFact) { mostrarToastCarrito('Completa todos los datos de factura'); return; }
    docInfo = { rut, razon, giro, dirFact };
  }

  // Validar campos obligatorios
  const metodoEnvio = document.querySelector('input[name="metodo-envio"]:checked')?.value || 'despacho';
  const esRetiro = metodoEnvio === 'retiro';
  const campos = esRetiro
    ? ['co-nombre','co-telefono','co-email']
    : ['co-nombre','co-telefono','co-email','co-direccion','co-comuna','co-ciudad'];
  let valido = true;
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('error'); valido = false; }
    else el.classList.remove('error');
  });
  if (!valido) { mostrarToastCarrito('Por favor completa todos los campos obligatorios'); return; }

  // Calcular envío
  const subtotalActual = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const envio = esRetiro ? null : calcularEnvio(comuna);
  const costoEnvio = esRetiro ? 0 : (subtotalActual >= 39990 ? 0 : (envio?.precio || 0));

  const btn = document.querySelector('.btn-checkout-confirm');
  btn.textContent = 'Procesando...'; btn.disabled = true;

  const cliente = { nombre, telefono, email, direccion: esRetiro ? 'Retiro en tienda' : direccion, comuna: esRetiro ? 'Providencia' : comuna, ciudad: esRetiro ? 'Santiago' : ciudad, notas, costoEnvio, metodoEntrega: esRetiro ? 'Retiro en tienda — Providencia (dirección exacta se coordina por WhatsApp)' : 'Despacho a domicilio', documento: esFactura ? 'Factura' : 'Boleta', ...docInfo };

  const metodoPago = document.querySelector('input[name="metodo-pago"]:checked')?.value || 'mercadopago';

  if (metodoPago === 'transferencia') {
    await confirmarTransferencia(cliente);
    btn.innerHTML = '🏦 Confirmar pedido';
    btn.disabled = false;
    return;
  }

  // Mercado Pago
  try {
    const res = await fetch('/api/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, cliente }) });
    const data = await res.json();
    if (data.init_point) { cerrarCheckout(); window.location.href = data.init_point; }
    else { mostrarToastCarrito('Error al crear el pago. Intenta nuevamente.'); }
  } catch(e) {
    mostrarToastCarrito('Error de conexión. Intenta nuevamente.');
  } finally {
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><\/svg> Confirmar y pagar';
    btn.disabled = false;
  }
}

async function confirmarTransferencia(cliente) {
  try {
    const res = await fetch('/api/checkout-transferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, cliente })
    });
    const data = await res.json();
    if (data.ok) {
      const total = cart.reduce((s,i) => s+i.price*i.qty, 0) + (cliente.costoEnvio || 0);
      const box = document.querySelector('.checkout-box');
      box.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem">
          <div style="font-size:3rem;margin-bottom:1rem">🐾</div>
          <h3 style="color:#C4622D;margin-bottom:.5rem">¡Pedido recibido!</h3>
          <p style="font-size:.9rem;color:#4a3a2e;line-height:1.7;margin-bottom:1.5rem">
            Transfiere <strong>$${total.toLocaleString('es-CL')}</strong> a esta cuenta y envía el comprobante a <strong>contacto@patasycaos.cl</strong>
          </p>
          <div style="background:#f5ecd7;border-radius:12px;padding:1.2rem;text-align:left;font-size:.88rem;line-height:2;color:#4a3a2e;margin-bottom:1.5rem">
            <div><strong>Banco:</strong> Santander</div>
            <div><strong>Tipo de cuenta:</strong> Corriente</div>
            <div><strong>N° de cuenta:</strong> 75925395</div>
            <div><strong>RUT:</strong> 19.636.805-1</div>
            <div><strong>Nombre:</strong> Sofía Rauld Lagos</div>
            <div><strong>Email:</strong> contacto@patasycaos.cl</div>
          </div>
          <p style="font-size:.8rem;color:#888;line-height:1.5">Tu pedido se prepara una vez que confirmemos la transferencia.<br>¡Gracias por tu confianza, Caótico! 🐾</p>
          <button onclick="cerrarCheckout()" style="margin-top:1.5rem;background:#C4622D;color:#fff;border:none;border-radius:50px;padding:12px 32px;font-family:Poppins,sans-serif;font-weight:700;font-size:.9rem;cursor:pointer">Cerrar</button>
        </div>`;
      cart = [];
      guardarCarritoLocal();
      renderCart();
    } else {
      mostrarToastCarrito('Error al procesar el pedido. Intenta nuevamente.');
    }
  } catch(e) {
    mostrarToastCarrito('Error de conexión. Intenta nuevamente.');
  }
}

/* ══════════════════════════════════════════════════
   SUPABASE — AUTH + CARRITO PERSISTENTE + WISHLIST
══════════════════════════════════════════════════ */
const SUPA_URL = 'https://xintmnshndhtqqbouxbo.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbnRtbnNobmRodHFxYm91eGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDc2MTAsImV4cCI6MjA5MzU4MzYxMH0.Xl5eHoNoxLrb_8jK40zPL52Qa3t696QHkaAmyJEqJac';
const _sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

let sbToken  = null;
let sbUser   = null;
let wishlist = [];

/* AUTH MODAL */
function abrirAuth() { document.getElementById('auth-overlay').classList.add('activo'); document.body.style.overflow='hidden'; }
function cerrarAuth() { document.getElementById('auth-overlay').classList.remove('activo'); document.body.style.overflow=''; document.getElementById('auth-msg').textContent=''; }
function cerrarAuthSiFondo(e) { if(e.target.id==='auth-overlay') cerrarAuth(); }

async function loginConGoogle() {
  await _sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin } });
}

async function enviarMagicLink() {
  const email = document.getElementById('auth-email').value.trim();
  const msg   = document.getElementById('auth-msg');
  if (!email) { msg.textContent='Ingresa tu email'; msg.className='auth-msg err'; return; }
  const { error } = await _sb.auth.signInWithOtp({ email, options:{ emailRedirectTo: window.location.origin } });
  if (error) { msg.textContent='Error: '+error.message; msg.className='auth-msg err'; }
  else { msg.textContent='✅ Revisa tu email — te enviamos un enlace de acceso'; msg.className='auth-msg ok'; }
}

/* USER DATA */
async function cargarDatosUsuario() {
  if (!sbToken) return;
  try {
    const r = await fetch('/api/user-data-get', { headers:{ Authorization:`Bearer ${sbToken}` } });
    const data = await r.json();
    if (data.cart && Array.isArray(data.cart) && data.cart.length > 0) {
      const local = [...cart];
      cart = data.cart;
      local.forEach(item => { if (!cart.find(i=>i.id===item.id)) cart.push(item); });
      guardarCarritoLocal();
      renderCart();
    }
    if (Array.isArray(data.wishlist)) { wishlist = data.wishlist; actualizarWishlistUI(); if (typeof renderFavoritos === 'function') renderFavoritos(); }
  } catch(e) {}
}

async function guardarDatosUsuario({ saveCart=true, saveWishlist=true }={}) {
  if (!sbToken) return;
  const body = {};
  if (saveCart)     body.cart     = cart;
  if (saveWishlist) body.wishlist = wishlist;
  try {
    await fetch('/api/user-data-set', {
      method:'POST',
      headers:{ Authorization:`Bearer ${sbToken}`, 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    });
  } catch(e) {}
}

/* AUTH UI */
function updateAuthUI() {
  const el = document.getElementById('nav-auth');
  if (!el) return;
  if (sbUser) {
    const nombre = sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Mi cuenta';
    const avatar = sbUser.user_metadata?.avatar_url;
    const avatarHTML = avatar
      ? `<img src="${avatar}" class="user-avatar" style="width:38px;height:38px;border-radius:50%;object-fit:cover;cursor:pointer;border:2px solid transparent" onclick="toggleUserDropdown()" alt="${nombre}">`
      : `<div class="user-avatar" style="width:38px;height:38px;border-radius:50%;background:var(--terracota);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;cursor:pointer" onclick="toggleUserDropdown()">${nombre[0].toUpperCase()}</div>`;
    el.innerHTML = `<div class="user-wrap">${avatarHTML}<div class="user-dropdown" id="user-dropdown"><span class="user-name-dd">👋 ${nombre}</span><a href="/favoritos" style="display:block;padding:.5rem .6rem;font-size:.82rem;font-weight:500;color:var(--terracota);text-decoration:none;border-radius:8px;transition:background .15s" onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background='none'">❤️ Mis favoritos</a><a href="/cuenta" style="display:block;padding:.5rem .6rem;font-size:.82rem;font-weight:500;color:#4a3a2e;text-decoration:none;border-radius:8px;transition:background .15s" onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background='none'">📦 Mis pedidos</a><a href="/cuenta#suscripcion" style="display:block;padding:.5rem .6rem;font-size:.82rem;font-weight:500;color:#4a3a2e;text-decoration:none;border-radius:8px;transition:background .15s" onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background='none'">🔄 Mi suscripción</a><button class="btn-signout" onclick="cerrarSesion()">Cerrar sesión</button></div></div>`;
  } else {
    el.innerHTML = `<button class="btn-signin" onclick="abrirAuth()" aria-label="Iniciar sesión"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></button>`;
  }
}

async function cerrarSesion() {
  await _sb.auth.signOut();
  sbUser=null; sbToken=null; cart=[]; wishlist=[];
  guardarCarritoLocal();
  renderCart(); actualizarWishlistUI(); updateAuthUI();
}

function toggleUserDropdown() { document.getElementById('user-dropdown')?.classList.toggle('open'); }
document.addEventListener('click', e => { if(!e.target.closest('.user-wrap')) document.getElementById('user-dropdown')?.classList.remove('open'); });

/* WISHLIST */
function actualizarWishlistUI() {
  document.querySelectorAll('.prod-heart').forEach(btn => {
    const id = btn.dataset.id; if(!id) return;
    const saved = wishlist.includes(id);
    btn.classList.toggle('saved', saved);
    btn.textContent = saved ? '❤️' : '♡';
  });
}

function toggleWishlist(e, id) {
  e.stopPropagation();
  if (!sbUser) { abrirAuth(); return; }
  const idx = wishlist.indexOf(id);
  if (idx >= 0) wishlist.splice(idx,1); else wishlist.push(id);
  actualizarWishlistUI();
  guardarDatosUsuario({ saveCart:false, saveWishlist:true });
}

/* AUTO-GUARDAR CARRITO */
const _origRenderCart = renderCart;
renderCart = function() {
  _origRenderCart();
  if (sbUser && sbToken) {
    clearTimeout(renderCart._t);
    renderCart._t = setTimeout(()=>guardarDatosUsuario({ saveCart:true, saveWishlist:false }), 800);
  }
};

/* INICIALIZAR SUPABASE AUTH */
_sb.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    sbUser  = session.user;
    sbToken = session.access_token;
    updateAuthUI();
    if (event === 'SIGNED_IN') { cerrarAuth(); await cargarDatosUsuario(); }
  } else {
    sbUser=null; sbToken=null; wishlist=[];
    updateAuthUI();
    if (typeof renderFavoritos === 'function') renderFavoritos();
  }
});

// Cargar sesión existente al inicio
_sb.auth.getSession().then(({ data:{ session } }) => {
  if (session) {
    sbUser  = session.user;
    sbToken = session.access_token;
    updateAuthUI();
    cargarDatosUsuario();
  } else {
    updateAuthUI();
  }
});
// Restaurar carrito al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  if (cart.length > 0) renderCart();
});
