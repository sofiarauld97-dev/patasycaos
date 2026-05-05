// cart.js — Patas & Caos shared cart, checkout & auth
// Este archivo es cargado por todas las páginas

// Stock — debe estar primero porque addToCart lo usa
const stockInicial = {'tubito-atun':3,'tubito-conejo':3,'tubito-cangrejo':3,'lata-leonardo-kitten':1,'lata-leonardo_Ave':1,'lata-leonardo_Pato':1,'lata-leonardo_Conejo':1,'lata-leonardo_Pescado':1,'lata-leonardo_Ternera':1,'collar-findmy':1,'fuente-agua':1,'pajaro':1,'pelota-led':2,'pulpo':1,'paw-balm':2,'afeitadora':1,'cat-fest_Pato':1,'cat-fest_Cordero':1,'cats-snack_Catnip':1,'cats-snack_Matatabi':1,'cats-snack_Rellena Atún + Queso':1,'cats-snack_Rellena Atún + Ostiones':1,'cats-snack_Rellena Atún + Pollo':1};
function getStock() { try { const s = localStorage.getItem('pac_stock'); if (!s) return {...stockInicial}; const p = JSON.parse(s); const m = {...stockInicial}; Object.keys(p).forEach(k => { m[k] = p[k]===false||p[k]===0?0:1; }); return m; } catch(e) { return {...stockInicial}; } }

let cart = [];
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
  if (nuevaQty > item.maxQty) { mostrarToastCarrito('Solo queda 1 unidad disponible 🐾'); return; }
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
function removeItem(id) { cart = cart.filter(i => i.id !== id); renderCart(); }
function renderCart() {
  const container = document.getElementById('cart-items'), footer = document.getElementById('cart-footer'), badge = document.getElementById('cart-badge');
  const totalItems = cart.reduce((s,i) => s+i.qty, 0), totalPrice = cart.reduce((s,i) => s+i.price*i.qty, 0);
  badge.textContent = totalItems; badge.style.display = totalItems > 0 ? 'flex' : 'none';
  if (cart.length === 0) { container.innerHTML = '<div class="cart-empty"><span>🐾</span>Tu carrito está vacío.<br>¡Agrega algo de caos!</div>'; footer.style.display = 'none'; return; }
  footer.style.display = 'block';
  document.getElementById('cart-total').textContent = '$' + totalPrice.toLocaleString('es-CL');
  container.innerHTML = cart.map(item => `<div class="cart-item"><img class="cart-item-img" src="${item.img}" alt="${item.name}" onerror="this.style.background='#f0dfc0'"><div class="cart-item-info"><h4>${item.name}</h4><div class="price">$${(item.price*item.qty).toLocaleString('es-CL')}</div><div class="cart-item-qty"><button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button><span class="qty-num">${item.qty}</span><button class="qty-btn" onclick="changeQty('${item.id}',1)" ${item.qty >= item.maxQty ? 'disabled style="opacity:.35;cursor:not-allowed"' : ''}>+</button></div></div><button class="cart-item-remove" onclick="removeItem('${item.id}')">✕</button></div>`).join('');
}
const COMUNAS_RM = ['santiago','providencia','las condes','vitacura','lo barnechea','la reina','ñuñoa','macul','san joaquín','san joaquin','la granja','la pintana','el bosque','san ramón','san ramon','la cisterna','san miguel','pedro aguirre cerda','lo espejo','estación central','estacion central','cerrillos','maipú','maipu','pudahuel','quilicura','huechuraba','conchalí','conchali','independencia','recoleta','renca','quinta normal','cerro navia','lo prado','lampa','colina','tiltil','buin','paine','san bernardo','calera de tango','talagante','peñaflor','penaflor','el monte','isla de maipo','melipilla','alhué','alhue','curacaví','curacavi','maría pinto','maria pinto','padre hurtado','pirque','puente alto','san josé de maipo','san jose de maipo','peñalolén','penalolen','florida','la florida'];

function normalizarComuna(str) {
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function calcularEnvio(comuna) {
  const c = normalizarComuna(comuna);
  const esRM = COMUNAS_RM.some(rm => normalizarComuna(rm) === c || c.includes(normalizarComuna(rm)));
  if (!comuna) return null;
  if (esRM) return { precio: 4990, texto: '$4.990', aviso: 'Envío a Región Metropolitana' };
  return { precio: 0, texto: 'A coordinar', aviso: 'Para regiones el envío se coordina por WhatsApp' };
}

function actualizarEnvio() {
  const comuna = document.getElementById('co-comuna').value;
  const resultado = calcularEnvio(comuna);
  const infoEl = document.getElementById('envio-info');
  const precioEl = document.getElementById('envio-precio');
  const avisoEl = document.getElementById('envio-aviso');
  if (!resultado || !comuna) { infoEl.style.display = 'none'; avisoEl.textContent = ''; return; }
  infoEl.style.display = 'flex';
  precioEl.textContent = resultado.texto;
  avisoEl.textContent = resultado.aviso;
}


async function checkout() {
  if (cart.length === 0) return;
  // Mostrar resumen en el modal
  const resumen = document.getElementById('checkoutResumen');
  resumen.innerHTML = cart.map(i => `<div class="checkout-resumen-item"><span>${i.name} x${i.qty}</span><span>$${(i.price*i.qty).toLocaleString('es-CL')}</span></div>`).join('') +
    `<div class="checkout-resumen-total"><span>Total</span><span>$${cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString('es-CL')}</span></div>`;
  document.getElementById('checkoutOverlay').classList.add('activo');
  document.body.style.overflow = 'hidden';
}

function cerrarCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('activo');
  document.body.style.overflow = '';
}

async function confirmarCheckout() {
  const nombre   = document.getElementById('co-nombre').value.trim();
  const telefono = document.getElementById('co-telefono').value.trim();
  const email    = document.getElementById('co-email').value.trim();
  const direccion= document.getElementById('co-direccion').value.trim();
  const comuna   = document.getElementById('co-comuna').value.trim();
  const ciudad   = document.getElementById('co-ciudad').value.trim();
  const notas    = document.getElementById('co-notas').value.trim();

  // Validar campos obligatorios
  const campos = ['co-nombre','co-telefono','co-email','co-direccion','co-comuna','co-ciudad'];
  let valido = true;
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('error'); valido = false; }
    else el.classList.remove('error');
  });
  if (!valido) { mostrarToastCarrito('Por favor completa todos los campos obligatorios'); return; }

  // Calcular envío
  const envio = calcularEnvio(comuna);
  const costoEnvio = envio?.precio || 0;
  const textoEnvio = envio?.texto || 'A coordinar';

  // Armar mensaje WhatsApp
  const items = cart.map(i => `• ${i.name} x${i.qty} — $${(i.price*i.qty).toLocaleString('es-CL')}`).join('\n');
  const subtotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const total = subtotal + costoEnvio;
  const msg = `🐾 *Nuevo pedido - Patas & Caos*\n\n*Cliente:* ${nombre}\n*Teléfono:* ${telefono}\n*Email:* ${email}\n\n*Dirección:* ${direccion}\n*Comuna:* ${comuna}\n*Ciudad:* ${ciudad}${notas ? '\n*Notas:* '+notas : ''}\n\n*Productos:*\n${items}\n\n*Subtotal: $${subtotal.toLocaleString('es-CL')}*\n*Envío: ${textoEnvio}*\n*Total: $${costoEnvio > 0 ? total.toLocaleString('es-CL') : subtotal.toLocaleString('es-CL')} ${costoEnvio === 0 ? '+ envío a coordinar' : ''}*`;

  // Abrir WhatsApp
  window.open('https://wa.me/56923997854?text=' + encodeURIComponent(msg), '_blank');

  // Procesar pago con Mercado Pago
  const btn = document.querySelector('.btn-checkout-confirm');
  btn.textContent = 'Procesando...'; btn.disabled = true;
  try {
    const res = await fetch('/api/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: cart }) });
    const data = await res.json();
    if (data.init_point) { cerrarCheckout(); window.location.href = data.init_point; }
    else { mostrarToastCarrito('Error al crear el pago. Intenta nuevamente.'); }
  } catch(e) {
    mostrarToastCarrito('Error de conexión. Intenta nuevamente.');
  } finally {
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"><\/path><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.989.518 3.86 1.427 5.484L2.05 21.95l4.59-1.371A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 11.999 2zm0 18a7.95 7.95 0 01-4.058-1.107l-.29-.173-3.004.896.898-2.927-.19-.302A7.926 7.926 0 014 12c0-4.418 3.581-8 7.999-8C16.419 4 20 7.582 20 12s-3.581 8-8.001 8z"><\/path><\/svg> Confirmar y pagar';
    btn.disabled = false;
  }
}

const TAGLINES = {'tubito-atun':'"Cremoso, irresistible y con catnip. Fin."','tubito-conejo':'"El tubo que tu gato va a pedir con los ojos."','tubito-cangrejo':'"Cangrejo + catnip = caos garantizado."','lata-leonardo-kitten':'"Porque los gatitos también tienen exigencias."','lata-leonardo':'"Porque tu gato se merece un menú de verdad."','collar-findmy':'"Nunca más lo pierdes."','fuente-agua':'"Hidratación con glamour."','pajaro':'"Enemigo número uno."','pelota-led':'"Brilla. Rueda. Enloquece."','pulpo':'"Masaje y caos en uno."','paw-balm':'"SPA para patitas exigentes."','afeitadora':'"Menos pelo, más sofá."','cat-fest':'"Pato o cordero. Siempre piden más."','cats-snack':'"5 sabores, 0 culpa."'};
const ORDEN = ['lata-leonardo','tubito-atun','afeitadora','paw-balm','fuente-agua'];
const productos = {
  'tubito-atun':{nombre:'Tubito Cremoso Atún con Catnip',precio:'$2.990',precioNum:2990,audience:'Para Gatos',categoria:'Snacks y Golosinas',descripcion:'El combo más letal del universo felino: atún cremoso con catnip. Estos tubitos son el snack perfecto para premiar, mimar o simplemente sobornar a tu gato. Se lamen solos, literalmente.',caracTitulo:'Características',caracteristicas:['Textura cremosa irresistible','Sabor atún con catnip','Pack de 4 unidades','Sin colorantes artificiales','Ideal como premio o snack diario'],imagenes:['Tubito_Cremoso_Cats_Snack2.png'],placeholders:['🐟']},
  'tubito-conejo':{nombre:'Tubito Cremoso Conejo con Catnip',precio:'$2.990',precioNum:2990,audience:'Para Gatos',categoria:'Snacks y Golosinas',descripcion:'Conejo cremoso con catnip — una combinación que tu gato no va a poder ignorar. Cuatro tubitos de puro premio que se convierten en el momento favorito del día (tuyo y de él).',caracTitulo:'Características',caracteristicas:['Textura cremosa irresistible','Sabor conejo con catnip','Pack de 4 unidades','Sin colorantes artificiales','Ideal como premio o snack diario'],imagenes:['Tubito_Cremoso_Cats_Snack1.png'],placeholders:['🐰']},
  'tubito-cangrejo':{nombre:'Tubito Cremoso Cangrejo con Catnip',precio:'$2.990',precioNum:2990,audience:'Para Gatos',categoria:'Snacks y Golosinas',descripcion:'Cangrejo cremoso con catnip — el sabor marino que hace perder la cabeza a cualquier gato. Cuatro tubitos de snack premium para los momentos en que quieres que tu gato te quiera un poco más.',caracTitulo:'Características',caracteristicas:['Textura cremosa irresistible','Sabor cangrejo con catnip','Pack de 4 unidades','Sin colorantes artificiales','Ideal como premio o snack diario'],imagenes:['Tubito_Cremoso_Cats_Snack3.png'],placeholders:['🦀']},
  'lata-leonardo-kitten':{nombre:'Lata Leonardo Kitten 200g',precio:'$3.790',precioNum:3790,audience:'Para Gatos',categoria:'Alimentos',descripcion:'Nutrición especial para gatitos en crecimiento. Leonardo Kitten fue formulada para cubrir todas las necesidades de los más pequeños de la casa — con proteína de alta calidad, sin cereales y con el estándar alemán que los hace tan especiales. Empieza bien desde el principio.',caracTitulo:'Características',caracteristicas:['Formulada especialmente para gatitos','Alto contenido de proteína para el desarrollo','Sin cereales añadidos','Formato 200g','🇩🇪 Fabricado en Alemania'],imagenes:['Lata_Leonardo_Kitten.png','Lata_Leonardo_Kitten_1.png'],placeholders:['🐱','🐱']},
  'lata-leonardo':{nombre:'Lata Leonardo Adulto 200g',precio:'$3.790',precioNum:3790,audience:'Para Gatos',categoria:'Alimentos',descripcion:'Comida húmeda premium alemana para gatos adultos. Leonardo usa ingredientes de alta calidad, sin cereales añadidos y con alto contenido de proteína animal. Tu gato lo va a pedir a gritos — y esta vez, con razón.',caracTitulo:'Características',caracteristicas:['Comida húmeda premium para gatos adultos','Alto contenido de proteína animal','Sin cereales añadidos','Formato 200g — ideal para una porción','5 sabores disponibles','🇩🇪 Fabricado en Alemania bajo estándares europeos de calidad'],variantes:[{label:'Ave',imagenes:['Latas_Leonardo_Adulto.png','Latas_Leonardo_Adulto_2.png'],placeholders:['🐔','🐱']},{label:'Pato',imagenes:['Latas_Leonardo_Adulto.png','Latas_Leonardo_Adulto_2.png'],placeholders:['🦆','🐱']},{label:'Conejo',imagenes:['Latas_Leonardo_Adulto.png','Latas_Leonardo_Adulto_2.png'],placeholders:['🐰','🐱']},{label:'Pescado',imagenes:['Latas_Leonardo_Adulto.png','Latas_Leonardo_Adulto_2.png'],placeholders:['🐟','🐱']},{label:'Ternera',imagenes:['Latas_Leonardo_Adulto.png','Latas_Leonardo_Adulto_2.png'],placeholders:['🐄','🐱']}]},
  'collar-findmy':{nombre:'Collar con Rastreador Apple Find My',precio:'$12.990',precioNum:12990,audience:'Perros & Gatos',categoria:'Accesorio',descripcion:'Porque tu gato sale "solo un momento" y desaparece tres horas. Compatible con la red Find My de Apple.',caracTitulo:'Características',caracteristicas:['Compatible con rastreador Apple Find My','Cinta nylon reflectante','Funda de silicona con diseño de huella','Cierre de seguridad ajustable','Campanilla metálica incluida','Ajustable: 20 a 32 cm'],imagenes:['Collar_GPS.png','Gato_con_Collar_GPS.png'],placeholders:['📍','🐱']},
  'fuente-agua':{nombre:'Fuente de Agua Flor USB',precio:'$21.990',precioNum:21990,audience:'Para Gatos',categoria:'Accesorio',descripcion:'Tu gato se niega a tomar agua del tazón porque "el agua quieta no es digna de él". Circulación continua, filtro incluido.',caracTitulo:'Características',caracteristicas:['Bomba silenciosa USB','Surtidor en forma de flor','Filtro incluido','Fácil de limpiar','Apto para gatos y perros pequeños'],imagenes:['Bebedero_Gatos_2.png','Bebedero_Gatos_1.png'],placeholders:['💧','🐱']},
  'pajaro':{nombre:'Pájaro Interactivo',precio:'$13.990',precioNum:13990,audience:'Para Gatos',categoria:'Juguete',descripcion:'Un pájaro que se mueve solo. Tu gato va a actuar como si nunca en su vida hubiera cazado nada.',caracTitulo:'Características',caracteristicas:['Movimiento autónomo','Material peluche suave y resistente','Estimula el instinto cazador','Promueve el ejercicio físico y mental'],imagenes:['Pajaro_Gatos.png','Milo_Pajaro_Gatos.png'],placeholders:['🐦','🐱']},
  'pelota-led':{nombre:'Pelota Interactiva LED',precio:'$8.990',precioNum:8990,audience:'Para Gatos',categoria:'Juguete',descripcion:'Brilla, rebota y arrastra cintas holográficas. Carga USB tipo C incluida.',caracTitulo:'Características',caracteristicas:['Luz LED integrada','Cuerda con cuentas y cintas holográficas','Estimula salto y persecución','Carga USB tipo C'],imagenes:['Pelota_Interactiva_Gato.png','Milo_Jugando_Pelota_Interactiva.png'],placeholders:['⚡','🐱']},
  'pulpo':{nombre:'Masajeador Pulpo',precio:'$6.990',precioNum:6990,audience:'Para Gatos',categoria:'Juguete',descripcion:'Sus tentáculos de silicona están diseñados para masajear, atrapar y hacer perder la cordura a tu gato.',caracTitulo:'Características',caracteristicas:['Silicona suave y segura','Tentáculos flexibles','Fácil de limpiar','Colores vibrantes'],imagenes:['Pulpo_Gatos_1.png','Pulpo_Gatos_2.png'],placeholders:['🐙','🐙']},
  'paw-balm':{nombre:'Paw Balm',precio:'$5.990',precioNum:5990,audience:'Perros & Gatos',categoria:'Aseo e Higiene',descripcion:'Fórmula suave con ingredientes naturales que repara, protege e hidrata las almohadillas resecas. 40g.',caracTitulo:'Ingredientes',caracteristicas:['Cera de abeja','Aceite de coco','Agua','Manteca de karité','Vitamina E','Cera de carnauba'],imagenes:['Patas_y_Paw_Balm.png','Paw_Balm.png','Ingredientes.png'],placeholders:['🐾','🐾','🌿']},
  'afeitadora':{nombre:'Afeitadora LED para Mascotas',precio:'$9.990',precioNum:9990,audience:'Perros & Gatos',categoria:'Aseo e Higiene',descripcion:'Con luz LED para ver exactamente dónde estás cortando. Silenciosa y recargable vía USB.',caracTitulo:'Características',caracteristicas:['Luz LED integrada','Motor silencioso','Cuchilla de acero inoxidable','Diseño ergonómico','Recargable vía USB'],imagenes:['Afeitadora_Gatos_1.png','Afeitadora_Gatos_2.png','Afeitadora_Gatos_3.png'],placeholders:['✂️','✂️','✂️']},
  'cat-fest':{nombre:'Cat Fest Meat Sticks',precio:'$3.490',precioNum:3490,audience:'Para Gatos',categoria:'Snacks y Golosinas',descripcion:'Palitos de carne 100% natural. Sin azúcar ni cereales, con cierre zip lock. 45g.',caracTitulo:'Características',caracteristicas:['100% carne natural','Sin azúcar agregada','Sin cereales (grain-free)','Human Grade','Cierre zip lock','45g'],variantes:[{label:'Pato',imagenes:['Lamb_Meat_Sticks.png'],placeholders:['🦆']},{label:'Cordero',imagenes:['Lamb_Meat_Sticks.png'],placeholders:['🐑']}]},
  'cats-snack':{nombre:'Cats Snack',precio:'$2.990',precioNum:2990,audience:'Para Gatos',categoria:'Snacks y Golosinas',descripcion:'Galletas crujientes por fuera, cremosas por dentro en las versiones rellenas. 80g.',caracTitulo:'Características',caracteristicas:['Galletas MarbenPets','Sin colorantes artificiales','Ideal como premio diario','80g'],variantes:[{label:'Catnip',imagenes:['Cats_Snacks_Gato.png','Comiendo_Cats_Snacks_Gato.png'],placeholders:['🌿','🐱']},{label:'Matatabi',imagenes:['Cats_Snacks_Gato.png','Comiendo_Cats_Snacks_Gato.png'],placeholders:['🌱','🐱']},{label:'Rellena Atún + Queso',imagenes:['Cats_Snacks_Gato.png','Comiendo_Cats_Snacks_Gato.png'],placeholders:['🧀','🐱']},{label:'Rellena Atún + Ostiones',imagenes:['Cats_Snacks_Gato.png','Comiendo_Cats_Snacks_Gato.png'],placeholders:['🦪','🐱']},{label:'Rellena Atún + Pollo',imagenes:['Cats_Snacks_Gato.png','Comiendo_Cats_Snacks_Gato.png'],placeholders:['🍗','🐱']}]}
};

function checkStockCard(id, stock) { const p = productos[id]; if (!p) return true; if (p.variantes) return p.variantes.some(v => stock[id+'_'+v.label]!==0); return stock[id]!==0; }

function crearCarrusel(imagenes, placeholders) {
  const wrap = document.createElement('div'); wrap.className = 'prod-img';
  const img = document.createElement('img'); img.src = imagenes[0]; img.alt = ''; img.draggable = false;
  img.onerror = () => { img.style.display='none'; wrap.style.cssText+='font-size:3rem;display:flex;align-items:center;justify-content:center;'; wrap.textContent=placeholders?.[0]||'📷'; };
  wrap.appendChild(img);
  if (imagenes.length > 1) {
    let idx = 0;
    const actualizarImg = (n) => { idx=(n+imagenes.length)%imagenes.length; img.style.opacity='0'; setTimeout(()=>{ img.src=imagenes[idx]; img.style.opacity='1'; },120); dots.forEach((d,i)=>d.classList.toggle('activo',i===idx)); };
    const prev = document.createElement('button'); prev.className='carr-btn carr-prev'; prev.innerHTML='‹'; prev.addEventListener('click',(e)=>{ e.stopPropagation(); actualizarImg(idx-1); });
    const next = document.createElement('button'); next.className='carr-btn carr-next'; next.innerHTML='›'; next.addEventListener('click',(e)=>{ e.stopPropagation(); actualizarImg(idx+1); });
    const dotsWrap = document.createElement('div'); dotsWrap.className='carr-dots';
    const dots = imagenes.map((_,i)=>{ const d=document.createElement('span'); d.className='carr-dot'+(i===0?' activo':''); d.addEventListener('click',(e)=>{ e.stopPropagation(); actualizarImg(i); }); dotsWrap.appendChild(d); return d; });
    wrap.appendChild(prev); wrap.appendChild(next); wrap.appendChild(dotsWrap);
    let sx=0, drag=false, moved=false;
    wrap.addEventListener('mousedown',(e)=>{ sx=e.clientX; drag=true; moved=false; });
    wrap.addEventListener('mousemove',(e)=>{ if(drag&&Math.abs(e.clientX-sx)>8) moved=true; });
    wrap.addEventListener('mouseup',(e)=>{ if(!drag)return; drag=false; const d=e.clientX-sx; if(Math.abs(d)>40) actualizarImg(d<0?idx+1:idx-1); });
    wrap.addEventListener('mouseleave',()=>{ drag=false; });
    wrap.addEventListener('click',(e)=>{ if(moved) e.stopPropagation(); moved=false; });
    wrap.addEventListener('touchstart',(e)=>{ sx=e.touches[0].clientX; },{passive:true});
    wrap.addEventListener('touchend',(e)=>{ const d=e.changedTouches[0].clientX-sx; if(Math.abs(d)>40) actualizarImg(d<0?idx+1:idx-1); },{passive:true});
    img.style.transition='opacity .15s';
  }
  return wrap;
}

function generarTarjetas() {
  const grid = document.getElementById('prod-grid'); if(!grid) return;
  grid.innerHTML = ''; const stock = getStock();
  ORDEN.forEach(id => {
    const p = productos[id]; if(!p) return;
    const imgs = p.variantes?p.variantes[0].imagenes:p.imagenes;
    const phs = p.variantes?p.variantes[0].placeholders:p.placeholders;
    const enStock = checkStockCard(id, stock);
    const card = document.createElement('div'); card.className='prod-card'+(enStock?'':' agotado');
    card.addEventListener('click',()=>abrirModal(id));
    const carr = crearCarrusel(imgs, phs);
    const badge = document.createElement('span'); badge.className='prod-badge'; badge.textContent=p.categoria; carr.appendChild(badge);
    const heart = document.createElement('button'); heart.className='prod-heart'; heart.innerHTML='♡'; heart.dataset.id=id; heart.addEventListener('click',(e)=>toggleWishlist(e,id)); carr.appendChild(heart);
    const btnId = 'btn-'+id;
    const info = document.createElement('div'); info.className='prod-info';
    info.innerHTML = `<h4>${p.nombre}</h4><p class="tagline">${TAGLINES[id]||''}</p><div class="prod-footer"><span class="prod-price">${p.precio}</span><button class="btn-add" id="${btnId}">${p.variantes?'Elegir sabor':'Añadir'}</button></div>`;
    card.appendChild(carr); card.appendChild(info); grid.appendChild(card);
    const btn = document.getElementById(btnId);
    if(btn){ if(!enStock){btn.textContent='Agotado';btn.disabled=true;} else if(p.variantes) btn.addEventListener('click',(e)=>{e.stopPropagation();abrirModal(id);}); else btn.addEventListener('click',(e)=>{e.stopPropagation();addToCart({id,name:p.nombre,price:p.precioNum,img:imgs[0]});}); }
  });
}

let productoActual=null, varianteActualIdx=0, imagenActualIdx=0;
function abrirModal(productoId) {
  const p=productos[productoId]; if(!p) return;
  productoActual={...p,id:productoId}; varianteActualIdx=0; imagenActualIdx=0;
  document.getElementById('modalNombre').textContent=p.nombre;
  document.getElementById('modalPrecio').textContent=p.precio;
  document.getElementById('modalAudience').textContent=p.audience;
  document.getElementById('modalCategoria').textContent=p.categoria;
  document.getElementById('modalDescripcion').textContent=p.descripcion;
  document.getElementById('modalCaracTitulo').textContent=p.caracTitulo;
  const lista=document.getElementById('modalCaracLista'); lista.innerHTML='';
  p.caracteristicas.forEach(item=>{ const li=document.createElement('li'); li.textContent=item; lista.appendChild(li); });
  const variantesEl=document.getElementById('modalVariantes'), opcionesEl=document.getElementById('modalVariantesOpciones'); opcionesEl.innerHTML='';
  if(p.variantes&&p.variantes.length>0){
    variantesEl.classList.add('visible'); const stock=getStock();
    p.variantes.forEach((v,idx)=>{ const btn=document.createElement('button'); const sk=productoId+'_'+v.label; const en=stock[sk]!==0; btn.className='modal-variante-btn'+(idx===0?' activo':''); btn.textContent=en?v.label:v.label+' — Agotado'; btn.disabled=!en; btn.onclick=()=>{ if(en) seleccionarVariante(idx); }; opcionesEl.appendChild(btn); });
    const pd=p.variantes.findIndex(v=>getStock()[productoId+'_'+v.label]!==0); construirGaleria(p.variantes[Math.max(0,pd)]);
  } else { variantesEl.classList.remove('visible'); construirGaleria(p); }
  document.getElementById('modalProducto').classList.add('activo'); document.body.style.overflow='hidden';
}
function seleccionarVariante(idx){ varianteActualIdx=idx; imagenActualIdx=0; document.querySelectorAll('.modal-variante-btn').forEach((b,i)=>b.classList.toggle('activo',i===idx)); construirGaleria(productoActual.variantes[idx]); }
function construirGaleria(fuente){
  const thumbsEl=document.getElementById('modalThumbnails'); thumbsEl.innerHTML=''; actualizarImagenPrincipal(fuente,0);
  if(fuente.imagenes.length>1){ fuente.imagenes.forEach((src,idx)=>{ const t=document.createElement('div'); t.className='modal-thumb'+(idx===0?' activo':''); t.onclick=()=>cambiarImagen(idx,fuente); const ie=document.createElement('img'); ie.src=src; ie.alt=''; ie.onerror=()=>{ t.innerHTML=''; t.textContent=fuente.placeholders?.[idx]||'📷'; t.style.fontSize='1.4rem'; }; t.appendChild(ie); thumbsEl.appendChild(t); }); }
}
function actualizarImagenPrincipal(fuente,idx){ const p=document.getElementById('modalImagenPrincipal'),img=document.getElementById('modalImgTag'); img.style.opacity='0'; setTimeout(()=>{ img.src=fuente.imagenes[idx]; img.onerror=()=>{ img.style.display='none'; p.textContent=fuente.placeholders?.[idx]||'📷'; p.style.fontSize='5rem'; }; img.onload=()=>{ p.textContent=''; if(!p.contains(img)) p.appendChild(img); img.style.display='block'; img.style.opacity='1'; }; },130); }
function cambiarImagen(idx,fuente){ imagenActualIdx=idx; actualizarImagenPrincipal(fuente,idx); document.querySelectorAll('.modal-thumb').forEach((el,i)=>el.classList.toggle('activo',i===idx)); }
function cerrarModal(){ document.getElementById('modalProducto').classList.remove('activo'); document.body.style.overflow=''; }
function cerrarModalSiFondo(e){ if(e.target.id==='modalProducto') cerrarModal(); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') cerrarModal(); });
function agregarAlCarritoDesdeModal(){
  if(!productoActual) return;
  let nombre=productoActual.nombre, fuente=productoActual, sku=productoActual.id;
  if(productoActual.variantes){ const v=productoActual.variantes[varianteActualIdx]; nombre+=' — '+v.label; fuente=v; sku=productoActual.id+'_'+v.label; }
  const stock=getStock();
  if(stock[sku]===0){ const btn=document.getElementById('modalBtnCarrito'); btn.textContent='Agotado 😢'; btn.style.background='#c0392b'; setTimeout(()=>{ btn.textContent='Añadir al carrito'; btn.style.background=''; },2000); return; }
  addToCart({id:productoActual.id+(productoActual.variantes?'-'+varianteActualIdx:''),name:nombre,price:productoActual.precioNum,img:fuente.imagenes?.[0]||''});
  const btn=document.getElementById('modalBtnCarrito'); btn.textContent='✓ ¡Añadido!'; btn.style.background='#2d7a3a';
  setTimeout(()=>{ btn.textContent='Añadir al carrito'; btn.style.background=''; cerrarModal(); },1200);
}

try { generarTarjetas(); } catch(e) { console.error('Error generarTarjetas:', e); }

// Sincronizar stock desde Upstash en segundo plano
(async () => {
  try {
    const r = await fetch('/api/stock-get');
    const data = await r.json();
    if (data.stock) {
      localStorage.setItem('pac_stock', JSON.stringify(data.stock));
      generarTarjetas(); // re-renderizar con stock real
    }
  } catch(e) {}
})();

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
      renderCart();
    }
    if (Array.isArray(data.wishlist)) { wishlist = data.wishlist; actualizarWishlistUI(); }
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
    el.innerHTML = `<div class="user-wrap">${avatarHTML}<div class="user-dropdown" id="user-dropdown"><span class="user-name-dd">👋 ${nombre}</span><a href="/favoritos" style="display:block;padding:.5rem .6rem;font-size:.82rem;font-weight:500;color:var(--terracota);text-decoration:none;border-radius:8px;transition:background .15s" onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background='none'">❤️ Mis favoritos</a><button class="btn-signout" onclick="cerrarSesion()">Cerrar sesión</button></div></div>`;
  } else {
    el.innerHTML = `<button class="btn-signin" onclick="abrirAuth()">Iniciar sesión</button>`;
  }
}

async function cerrarSesion() {
  await _sb.auth.signOut();
  sbUser=null; sbToken=null; cart=[]; wishlist=[];
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
    sbUser=null; sbToken=null;
    updateAuthUI();
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