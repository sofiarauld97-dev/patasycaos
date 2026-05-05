// cart.js — Patas & Caos shared cart, checkout & auth
// Este archivo es cargado por todas las páginas

// Stock — debe estar primero porque addToCart lo usa
const stockInicial = {'tubito-atun':3,'tubito-conejo':3,'tubito-cangrejo':3,'lata-leonardo-kitten':1,'lata-leonardo_Ave':1,'lata-leonardo_Pato':1,'lata-leonardo_Conejo':1,'lata-leonardo_Pescado':1,'lata-leonardo_Ternera':1,'collar-findmy':1,'fuente-agua':1,'pajaro':1,'pelota-led':2,'pulpo':1,'paw-balm':2,'afeitadora':1,'cat-fest_Pato':1,'cat-fest_Cordero':1,'cats-snack_Catnip':1,'cats-snack_Matatabi':1,'cats-snack_Rellena Atún + Queso':1,'cats-snack_Rellena Atún + Ostiones':1,'cats-snack_Rellena Atún + Pollo':1};
function getStock() { try { const s = localStorage.getItem('pac_stock'); if (!s) return {...stockInicial}; const p = JSON.parse(s); const m = {...stockInicial}; Object.keys(p).forEach(k => { m[k] = p[k]===false||p[k]===0?0:1; }); return m; } catch(e) { return {...stockInicial}; } }

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
