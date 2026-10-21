import { emailConfirmacion, emailDespacho, emailEntregado, emailCancelado } from '../email_templates.js';

// Catálogo de precios para reconstruir items desde texto de Supabase
const PRECIOS = {
  "Arena Sanitaria Ciudad Animal 8kg": 8990,
  "Arena Sanitaria Michi 4kg": 4990,
  "Arena Sanitaria Turbo Clean 4kg": 4990,
  "Bocados de Cerdo - Catgo": 3990,
  "Bocados de Choritos - Catgo": 3990,
  "Bocados de Pollo 65g - Pets Friends": 4990,
  "Bocados de Salmón - Catgo": 3990,
  "Bolsas Sanitarias 4 Rollos - Hey!": 2190,
  "Bolsas Sanitarias 4 Rollos Emoji - Marben Pets": 2490,
  "Bolsas Sanitarias 4 Rollos Huesitos - Marben Pets": 2490,
  "Botella Portátil para Perros — Calipso": 13990,
  "Botella Portátil para Perros — Rosada": 13990,
  "Brit Care Sterilized Weigh Control 2kg - Duck & Turkey": 24990,
  "Caldo de Huesos 250g - Pura Natura": 4990,
  "Calming Collar - Perros": 7990,
  "Cama Redonda Confort Verde - Hey!": 13990,
  "Cats Snack - Rellena Pollo + Camarón": 2990,
  "Cats Snack — Atún + Catnip": 2990,
  "Cats Snack — Atún + Matatabi": 2990,
  "Cats Snack — Rellena Atún + Ostiones": 2990,
  "Cats Snack — Rellena Atún + Pollo": 2990,
  "Cats Snack — Rellena Atún + Queso": 2990,
  "Cats Snack — Rellena Camarón": 2990,
  "Churu Dog Meal Topper Chicken & Pumpkin 4uds": 3290,
  "Collar Find My — Amarillo": 12990,
  "Collar Find My — Azul": 12990,
  "Collar Find My — Negro": 12990,
  "Collar Find My — Rojo": 12990,
  "Collar Find My — Turquesa": 12990,
  "Collar Isabelino Donut Rosada - Talla S": 6990,
  "Collar Nox Zee.Dog": 13900,
  "Collar Perro Acolchado — Café Talla M": 6990,
  "Collar Perro Acolchado — Café Talla S": 6990,
  "Collar Perro Acolchado — Rojo Talla S": 6990,
  "Collar Suede Zee.Dog": 13900,
  "Collar Zee.Cat Error 404": 7990,
  "Collar Zee.Cat Error 410": 7990,
  "Collar Zee.Cat Error 500": 7990,
  "Comedero Lento Desmontable — Azul": 7990,
  "Comedero Lento Desmontable — Rojo": 7990,
  "Comedero Lento Slow Feeder - Rosado": 6990,
  "Costillitas de Cordero 100g - Fit Fórmula": 3990,
  "Crackers Brisket Beef 100g - Naturalistic": 3990,
  "Cubitos de Salmón 65g - Pets Friends": 4990,
  "Cuerno Masticable Cuidado Inmunológico L - Tasty Farm": 4990,
  "Cóndilo de Vacuno 300g - Rahue": 4990,
  "Dashi Delights Pollo - Inaba": 3290,
  "Dashi Delights Pollo con Atún - Inaba": 3290,
  "Dashi Delights Pollo con Atún y Ostiones - Inaba": 3290,
  "Dashi Delights Pollo con Salmón - Inaba": 3290,
  "Dispensador de Bolsas - Diseño Café": 5990,
  "Donut Colagepet XL - Carne": 2990,
  "Donut Colagepet XL - Pato": 2990,
  "Donut Colagepet XL - Pollo": 2990,
  "Donut con Sonido - Hey!": 2990,
  "Fit Formula Gato Adulto 2kg": 11990,
  "Flores de Bach - Ansiedad y Calma": 12990,
  "Flores de Bach - Energía y Ánimo": 12990,
  "Flores de Bach - Equilibrio": 12990,
  "Flores de Bach - Rescue y Alivio": 12990,
  "Fuente de Agua Flor USB": 21990,
  "Fémur de Cerdo - Gran Cani": 4990,
  "Fémur de Cerdo - Rahue": 4990,
  "Fémur de Cerdo - Tasty Farm": 4990,
  "Garra de Pollo 65g - Rahue": 3490,
  "Huesitos de Calcio con Pollo 55g - Dog Fest": 4990,
  "Kit Huellita de Recuerdo - Perros y Gatos": 5990,
  "Lamb Strips 100g - Naturalistic": 3990,
  "Lata Leonardo Adulto — Ave": 3790,
  "Lata Leonardo Adulto — Conejo": 3790,
  "Lata Leonardo Adulto — Pato": 3790,
  "Lata Leonardo Adulto — Pescado": 3790,
  "Lata Leonardo Adulto — Ternera": 3790,
  "Lata Leonardo Kitten 200g": 3790,
  "Leonardo Adult 1,8kg - Duck": 25990,
  "Leonardo Adult GF 1,8kg - Poultry": 26990,
  "Leonardo Adult Light & Sterilised 1,8kg": 25990,
  "Lolli Pop Arándano - Fellini": 2990,
  "Lolli Pop Calabaza - Fellini": 2990,
  "Lolli Pop Leche de Cabra - Fellini": 2990,
  "Mantequilla de Maní Banana Bliss 260g - Smuttdog": 4990,
  "Meat Duck Drum Stick 90g - Naturalistic": 4290,
  "Medallones de Avestruz 90g - Dog Fest": 4990,
  "Medallones de Cordero 55g - Dog Fest": 4990,
  "Mix Deshidratados 100g - Doggo": 4290,
  "Mousse de Salmón Piel & Pelaje 150g - Ikai": 4190,
  "Mousse Salmón & Camarón 60g - Ikai": 2990,
  "Mousse Salmón & Cangrejo 60g - Ikai": 2990,
  "Old Prince Gato Adulto Cordero & Arroz 3kg": 22990,
  "Oreja de Cerdo - Gran Cani": 2490,
  "Orejas de Conejo con Cordero 55g - Dog Fest": 4990,
  "Pack 3 Arenas Sanitarias - Turbo Clean": 11990,
  "Pala Arenero — Marrón": 1990,
  "Pala Arenero — Verde": 1990,
  "Paw Balm": 5990,
  "Pelota Snack Interactiva — Azul": 6990,
  "Pelota Snack Interactiva — Roja": 6990,
  "Pelota Snack Interactiva — Verde": 6990,
  "Pulmón de Cordero 50g - Rahue": 3990,
  "Pájaro Interactivo": 13990,
  "Rascador Maxi Caja de Leche - Brnx": 13990,
  "Rastreador Apple Find My + Funda de Silicona": 11990,
  "Rebanadas de Conejo 100g - Tasty Farm": 3990,
  "Rebanadas de Vacuno 100g - Tasty Farm": 3990,
  "Recorte Oreja de Cerdo 100g - Rahue": 4290,
  "Sachet de Pato, Arroz & Arándano 125g - Belcando": 3490,
  "Sachet de Venado, Mijo & Arándano 125g - Belcando": 3490,
  "Sachet Menú de Carnes Senior 125g - Belcando": 3490,
  "Salchichas de Cordero 100g - Tasty Farm": 3990,
  "Salmon Nuggets 100g - Naturalistic": 3990,
  "Shampoo Aloe Vera 250ml - Bioline": 3990,
  "Snack Calming Cat Treats - Beaphar": 5990,
  "Snack Dental Fitness Crocante 60g - QChefs": 9990,
  "Snack Dental Power 75g - QChefs": 9990,
  "Sopa de Salmón 150g - Ikai": 3990,
  "Sticks Colagepet Carne 6uds - Marben Pets": 4990,
  "Stripes Duck 70g - Belcando": 5490,
  "Suero Fisiológico — Cloruro de Sodio 0.9%": 2590,
  "Tiritas de Pato 100g - Tasty Farm": 3990,
  "Tiritas de Pollo Deshidratadas 100g - Fit Formula": 3990,
  "Toallitas Húmedas de Bamboo 100 Unidades - Eco Traper": 5990,
  "Topping de Pavo 100g - Belcando": 3490,
  "Topping de Ternera 100g - Belcando": 3490,
  "Treats de Conejo 100g - Fit Formula": 3990,
  "Trutros de Pollo Deshidratados 100g - Fit Formula": 3990,
  "Tráquea de Vacuno - Rahue": 3990,
  "Tráquea de Vacuno en Crispy de Ciervo - Doggo": 4290,
  "Tubito Cremoso Atún con Catnip": 2990,
  "Tubito Cremoso Camarón con Catnip": 2990,
  "Tubito Cremoso Cangrejo con Catnip": 2990,
  "Tubito Cremoso Conejo con Catnip": 2989,
  "Tubito Cremoso Salmón con Matatabi": 2990,
  "Woofer's 80g - Pura Natura": 3990,
  "Yogurt Natural en Cubos 20 Unidades - Goofy": 4990,
  // Nombres históricos para pedidos antiguos (valores heredados, no verificados contra el catálogo actual).
  "Afeitadora LED": 9990,
  "Calming Collar - Gatos": 7990,
  "Cat Fest Meat Sticks — Cordero": 3490,
  "Cat Fest Meat Sticks — Pato": 3490,
  "Cat Fest Pillows Chicken Creme": 1990,
  "Cat Fest Pillows Salmon Creme": 1990,
  "Cats Snack Galleta Rellena Pollo+Camaron": 2990,
  "ColágePet Donut — Sabor Carne": 2990,
  "ColágePet Donut — Sabor Pato": 2990,
  "ColágePet Donut — Sabor Pollo": 2990,
  "Comedero Lento Flores - Lila": 9990,
  "Comedero Lento Slow Feeder - Catstages": 7990,
  "Condilo de Vacuno Rahue 300g": 4990,
  "Dog Fest Calcium Bones with Chicken": 4990,
  "Dog Fest Lamb Medallions": 4990,
  "Dog Fest Rabbit Ears with Lamb": 4990,
  "Doggo Mix en Crispy de Ciervo 100gr": 4290,
  "Doggo Traquea de Vacuno en Crispy de Ciervo 1UNI": 4290,
  "Masajeador Pulpo": 6990,
  "Pack Bienvenido a Casa": 21990,
  "Pack Calma Total": 15990,
  "Pack Consulta + Flor de Bach": 29990,
  "Pack Cuidado Total": 12990,
  "Pack Juega y Relaja": 28990,
  "Pack Rutina Sana": 33990,
  "Pack SOS Mascota": 18990,
  "Pelota Interactiva LED": 8990,
  "Snack Fellini Lollipop Calabaza - 3 Uni": 2990,
  "Snack Fellini Lollipop Leche de Cabra - 3 Uni": 2990,
  "Snack Pets Friends Gato Bocados de Pollo 65gr": 4990,
  "Snack Pets Friends Gato Cubos de Salmon 65gr": 4990,
};

function getPrecio(nombre) {
  if (PRECIOS[nombre]) return PRECIOS[nombre];
  // Búsqueda parcial si el nombre no coincide exacto
  const key = Object.keys(PRECIOS).find(k =>
    k.toLowerCase().includes(nombre.toLowerCase()) ||
    nombre.toLowerCase().includes(k.toLowerCase())
  );
  return key ? PRECIOS[key] : 0;
}

// Mapa nombre de producto -> id de stock (usado para poder REINGRESAR el stock
// cuando un pedido se cancela; los ids son los mismos que usa el inventario/Redis).
const ID_POR_NOMBRE = {
  "Comedero Lento Flores - Lila": "comedero-lento-flores-lila",
  "Snack Calming Cat Treats - Beaphar": "snack-calming-gato",
  "Collar Zee.Cat Error 500": "collar-zeecat-error-500",
  "Collar Zee.Cat Error 404": "collar-zeecat-error-404",
  "Collar Zee.Cat Error 410": "collar-zeecat-error-410",
  "Collar Suede Zee.Dog": "collar-suede-para-perro-zeedog",
  "Collar Nox Zee.Dog": "collar-nox-para-perro-zeedog",
  "Pala Arenero — Marrón": "pala-arenero-marron",
  "Pala Arenero — Verde": "pala-arenero-verde",
  "Collar Find My — Amarillo": "collar-findmy_Amarillo",
  "Pelota Snack Interactiva — Verde": "pelota-snack-interactiva_Verde",
  "Collar Perro Acolchado — Café Talla S": "collar-perro-acolchado_Café-S",
  "Collar Perro Acolchado — Café Talla M": "collar-perro-acolchado_Café-M",
  "Collar Perro Acolchado — Rojo Talla S": "collar-perro-acolchado_Rojo-S",
  "Afeitadora LED": "afeitadora",
  "Arena Sanitaria Ciudad Animal 8kg": "arena-sanitaria-ciudad-animal-8kg",
  "Botella Portátil para Perros — Calipso": "botella-portatil-para-perros_Calipso",
  "Botella Portátil para Perros — Rosada": "botella-portatil-para-perros_Rosada",
  "Brit Care Sterilized Weigh Control 2kg - Duck & Turkey": "brit-care-sterilized-weigh-control-2kg---duck-turkey",
  "Calming Collar - Gatos": "calming-collar---gatos",
  "Calming Collar - Perros": "calming-collar---perros",
  "Cat Fest Meat Sticks — Cordero": "cat-fest_Cordero",
  "Cat Fest Meat Sticks — Pato": "cat-fest_Pato",
  "Cat Fest Pillows Chicken Creme": "cat-fest-pillows",
  "Cat Fest Pillows Salmon Creme": "cat-fest-pillows-schrimp-creme",
  "Cats Snack — Atún + Catnip": "cats-snack_Catnip",
  "Cats Snack — Atún + Matatabi": "cats-snack_Matatabi",
  "Cats Snack — Rellena Atún + Ostiones": "cats-snack_Rellena Atún + Ostiones",
  "Cats Snack — Rellena Atún + Queso": "cats-snack_Rellena Atún + Queso",
  "Cats Snack — Rellena Camarón": "cats-snack_Rellena Camarón",
  "Cats Snack — Rellena Atún + Pollo": "cats-snack_Rellena Atún + Pollo",
  "Costillitas de Cordero 100g - Fit Fórmula": "fit-formula-costillas-cordero-100g",
  "ColágePet Donut — Sabor Carne": "colagepet-donut-carne",
  "ColágePet Donut — Sabor Pato": "colagepet-donut-pato",
  "ColágePet Donut — Sabor Pollo": "colagepet-donut-pollo",
  "Collar Find My — Azul": "collar-findmy_Azul",
  "Collar Find My — Negro": "collar-findmy_Negro",
  "Collar Find My — Turquesa": "collar-findmy_Turquesa",
  "Collar Isabelino Donut Rosada - Talla S": "collar-isabelino-donut-rosada---talla-s",
  "Comedero Lento Slow Feeder - Catstages": "comedero-lento-slow-feeder---catstages",
  "Comedero Lento Slow Feeder - Rosado": "comedero-lento-slow-feeder-rosado",
  "Dispensador de Bolsas - Diseño Café": "dispensador-de-bolsas---diseno-cafe",
  "Dog Fest Calcium Bones with Chicken": "dog-fest-calcium-bones-chicken",
  "Dog Fest Lamb Medallions": "dog-fest-lamb-medallions",
  "Dog Fest Rabbit Ears with Lamb": "dog-fest-rabbit-ears-lamb",
  "Flores de Bach - Ansiedad y Calma": "flores-de-bach---ansiedad-y-calma",
  "Flores de Bach - Energía y Ánimo": "flores-de-bach---energia-y-animo",
  "Flores de Bach - Equilibrio": "flores-de-bach---equilibrio",
  "Flores de Bach - Rescue y Alivio": "flores-de-bach---rescue-y-alivio",
  "Fuente de Agua Flor USB": "fuente-agua",
  "Fémur de Cerdo - Tasty Farm": "femur-cerdo-tasty",
  "Garra de Pollo 65g - Rahue": "garra-pollo-rahue",
  "Lata Leonardo Adulto — Ave": "lata-leonardo_Ave",
  "Lata Leonardo Adulto — Conejo": "lata-leonardo_Conejo",
  "Lata Leonardo Adulto — Pato": "lata-leonardo_Pato",
  "Lata Leonardo Adulto — Pescado": "lata-leonardo_Pescado",
  "Lata Leonardo Adulto — Ternera": "lata-leonardo_Ternera",
  "Lata Leonardo Kitten 200g": "lata-leonardo-kitten",
  "Leonardo Adult GF 1,8kg - Poultry": "leonardo-adult-gf-poultry-1-8kg",
  "Leonardo Adult Light & Sterilised 1,8kg": "leonardo-adult-light-sterilised-1-8kg",
  "Leonardo Adult 1,8kg - Duck": "leonardo-adult-duck-1-8kg",
  "Bolsas Sanitarias 4 Rollos - Hey!": "hey-bolsas-sanitarias-4-rollos",
  "Cama Redonda Confort Verde - Hey!": "hey-cama-redonda-confort-verde",
  "Donut con Sonido - Hey!": "hey-donut-sonido-perros",
  "Caldo de Huesos 250g - Pura Natura": "pura-natura-caldo-de-huesos-250g",
  "Woofer's 80g - Pura Natura": "pura-natura-woofers-80g",
  "Fit Formula Gato Adulto 2kg": "fit-formula-gato-adulto-2kg",
  "Masajeador Pulpo": "pulpo",
  "Pack Bienvenido a Casa": "pack-bienvenido-a-casa",
  "Pack Calma Total": "pack-calma-total",
  "Pack Consulta + Flor de Bach": "pack-consulta-flor-de-bach",
  "Pack Cuidado Total": "pack-cuidado-total",
  "Pack Juega y Relaja": "pack-juega-y-relaja",
  "Pack Rutina Sana": "pack-rutina-sana",
  "Pack SOS Mascota": "pack-sos-mascota",
  "Paw Balm": "paw-balm",
  "Pelota Interactiva LED": "pelota-led",
  "Pelota Snack Interactiva — Azul": "pelota-snack-interactiva_Azul",
  "Pelota Snack Interactiva — Roja": "pelota-snack-interactiva_Roja",
  "Pulmón de Cordero 50g - Rahue": "pulmon-cordero-rahue",
  "Pájaro Interactivo": "pajaro",
  "Rascador Maxi Caja de Leche - Brnx": "rascador-maxi-caja-de-leche---brnx",
  "Recorte Oreja de Cerdo 100g - Rahue": "oreja-cerdo-rahue",
  "Suero Fisiológico — Cloruro de Sodio 0.9%": "suero-fisiologico",
  "Tráquea de Vacuno - Rahue": "traquea-vacuno-rahue",
  "Tubito Cremoso Atún con Catnip": "tubito-atun",
  "Tubito Cremoso Camarón con Catnip": "tubito-camaron",
  "Tubito Cremoso Salmón con Matatabi": "tubito-salmon-matatabi",
  "Snack Dental Power 75g - QChefs": "zupet-dental-power-suave",
  "Snack Dental Fitness Crocante 60g - QChefs": "zupet-dental-fitness-crocante",
  "Rastreador Apple Find My + Funda de Silicona": "rastreador-find-my",
  "Comedero Lento Desmontable — Azul": "comedero-lento-desmontable-azul",
  "Comedero Lento Desmontable — Rojo": "comedero-lento-desmontable-rojo",
  "Collar Find My — Rojo": "collar-findmy-rojo",
  "Snack Fellini Lollipop Calabaza - 3 Uni": "fellini-lollipop-calabaza",
  "Snack Fellini Lollipop Leche de Cabra - 3 Uni": "fellini-lollipop-leche-cabra",
  "Snack Pets Friends Gato Bocados de Pollo 65gr": "bocados-pollo-pets-friends",
  "Snack Pets Friends Gato Cubos de Salmon 65gr": "cubitos-salmon-pets-friends",
  "Doggo Traquea de Vacuno en Crispy de Ciervo 1UNI": "doggo-traquea-vacuno-ciervo",
  "Doggo Mix en Crispy de Ciervo 100gr": "doggo-mix-deshidratados",
  "Condilo de Vacuno Rahue 300g": "condilo-vacuno-rahue",
  "Cats Snack Galleta Rellena Pollo+Camaron": "cats-snack-pollo-camaron",
  "Cats Snack - Rellena Pollo + Camarón": "cats-snack-pollo-camaron",
};

function getStockId(nombre) {
  if (ID_POR_NOMBRE[nombre]) return ID_POR_NOMBRE[nombre];
  const key = Object.keys(ID_POR_NOMBRE).find(k =>
    k.toLowerCase().includes(nombre.toLowerCase()) ||
    nombre.toLowerCase().includes(k.toLowerCase())
  );
  return key ? ID_POR_NOMBRE[key] : null;
}

// Adjunta la imagen principal del catálogo vigente, sin modificar productos ni stock.
// Si el catálogo no responde o no hay coincidencia, el email sigue sin imagen.
async function agregarFotosEmail(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  try {
    const respuesta = await fetch('https://www.patasycaos.cl/data/productos.json', {
      signal: AbortSignal.timeout(4500), headers: { Accept: 'application/json' }
    });
    if (!respuesta.ok) return items;
    const datos = await respuesta.json();
    const productos = Array.isArray(datos) ? datos : (Array.isArray(datos.productos) ? datos.productos : []);
    const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const porId = new Map();
    const porNombre = new Map();
    for (const producto of productos) {
      if (producto.sku) porId.set(normalizar(producto.sku), producto);
      if (producto.nombre) porNombre.set(normalizar(producto.nombre), producto);
    }
    return items.map(item => {
      const producto = porId.get(normalizar(item.id || item.stockId)) || porNombre.get(normalizar(item.name));
      const ruta = producto?.imagenes?.[0];
      const precioCatalogo = Number(producto?.precio);
      const resultado = { ...item };
      // Solo recurrir al precio actual si no se recuperó uno válido del pedido.
      if (!item.precioGuardado && !(Number(item.price) > 0) && Number.isFinite(precioCatalogo) && precioCatalogo > 0) {
        resultado.price = precioCatalogo;
      }
      if (typeof ruta !== 'string' || !ruta.trim()) return resultado;
      const image = ruta.startsWith('/') ? 'https://www.patasycaos.cl' + ruta : ruta;
      if (!/^https:\/\/www\.patasycaos\.cl\//i.test(image)) return resultado;
      return { ...resultado, image };
    });
  } catch (e) {
    console.warn('[webhook] No se pudieron cargar miniaturas para emails:', e.message);
    return items;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // GET: consulta de pedido para la página pedido-ok
    if (req.method === 'GET') {
      const { preference_id } = req.query;
      if (!preference_id) return res.status(400).json({ error: 'Missing preference_id' });
      try {
        const redisRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/order:${preference_id}`, {
          headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        });
        const redisData = await redisRes.json();
        if (!redisData.result) return res.status(404).json({ error: 'Order not found' });
        const order = JSON.parse(redisData.result);
        // El respaldo temporal por sí solo NO significa que el pago se haya registrado.
        let registrado = false;
        try {
          const rEstado = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/processed_pref:${encodeURIComponent(preference_id)}`, {
            headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
          });
          if (rEstado.ok) registrado = Boolean((await rEstado.json()).result);
        } catch (e) { console.warn('[webhook] No se pudo consultar estado:', e.message); }
        const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
        const costoEnvio = order.costoEnvio || 0;
        return res.status(200).json({
          nombre: order.nombre,
          email: order.email || '',
          registrado,
          items: order.items,
          subtotal,
          costoEnvio,
          total: subtotal + costoEnvio,
          metodoEntrega: order.metodoEntrega || 'despacho',
          direccion: order.direccion || '',
          comuna: order.comuna || '',
          ciudad: order.ciudad || '',
        });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    return res.status(405).end();
  }


  // === ELIMINACIÓN ADMINISTRATIVA DE PEDIDOS / SUSCRIPCIONES ===
  if (req.body?.accion === 'eliminar_registro_admin') {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_PANEL_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { tipo, id } = req.body || {};
    const numericId = Number(id);

    if (!expectedKey || adminKey !== expectedKey) {
      return res.status(401).json({ error: 'Clave de administrador incorrecta.' });
    }

    if (!process.env.SUPABASE_URL || !serviceKey) {
      return res.status(500).json({
        error: 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel.'
      });
    }

    if (!['pedido', 'suscripcion'].includes(tipo) || !Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({ error: 'Tipo o ID inválido.' });
    }

    const tabla = tipo === 'pedido' ? 'Pedidos' : 'Suscripciones';

    try {
      // Antes de borrar una suscripción, verifica que Mercado Pago esté detenido.
      if (tipo === 'suscripcion') {
        const checkRes = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/${tabla}?id=eq.${numericId}&select=id,estado,mp_preapproval_id`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`
            }
          }
        );

        const checkText = await checkRes.text();
        let checkData = [];
        try { checkData = checkText ? JSON.parse(checkText) : []; } catch {}

        if (!checkRes.ok) {
          return res.status(checkRes.status).json({
            error: checkData?.message || checkData?.error || 'No fue posible revisar la suscripción.'
          });
        }

        const sus = Array.isArray(checkData) ? checkData[0] : null;

        if (!sus) {
          return res.status(404).json({ error: 'La suscripción ya no existe.' });
        }

        if (
          sus.mp_preapproval_id &&
          String(sus.estado || '').toLowerCase() !== 'cancelada'
        ) {
          return res.status(409).json({
            error: 'Primero debes cancelar la suscripción para detener el cobro automático de Mercado Pago.'
          });
        }
      }

      const deleteRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/${tabla}?id=eq.${numericId}&select=id`,
        {
          method: 'DELETE',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'return=representation'
          }
        }
      );

      const deleteText = await deleteRes.text();
      let deletedRows = [];
      try { deletedRows = deleteText ? JSON.parse(deleteText) : []; } catch {}

      if (!deleteRes.ok) {
        return res.status(deleteRes.status).json({
          error: deletedRows?.message || deletedRows?.error || `Supabase respondió ${deleteRes.status}.`
        });
      }

      const deleted =
        Array.isArray(deletedRows) &&
        deletedRows.some(row => Number(row.id) === numericId);

      if (!deleted) {
        return res.status(409).json({
          error: `Supabase no confirmó la eliminación en ${tabla}.`
        });
      }

      return res.status(200).json({
        ok: true,
        deleted: true,
        tipo,
        id: numericId
      });
    } catch (error) {
      console.error('[webhook] Error eliminando registro administrativo:', error);
      return res.status(500).json({
        error: error.message || 'Error interno eliminando el registro.'
      });
    }
  }

  // === CAMBIO DE ESTADO / NUEVO PEDIDO MANUAL ===
  const { pedidoId, estado } = req.body || {};
  if (pedidoId && ['despachado', 'entregado', 'nuevo_pedido', 'cancelado'].includes(estado)) {
    try {
      const supaRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/Pedidos?id=eq.${pedidoId}&select=*`,
        { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` } }
      );
      const pedidos = await supaRes.json();
      const pedido = pedidos?.[0];
      if (!pedido?.email) return res.status(200).json({ ok: true, msg: 'Sin email' });

      // Reconstruir items con precios desde el catálogo
      // (usamos un separador inteligente que no se rompe con comas dentro
      //  del propio nombre del producto, ej: "Leonardo Adult GF 1,8kg")
      const segmentosProductos = [...(pedido.productos || '').matchAll(/(?:,\s*)?(.+?\s+x\d+(?:\s*\(-?\d+(?:\.\d+)?%\))?(?:\s*\[precio:\d+\])?)(?=,\s*|$)/g)].map(m => m[1].trim());
      const items = segmentosProductos.map(s => {
        const match = s.match(/^(.+?)\s+x(\d+)(?:\s.*)?$/);
        if (!match) return null;
        const nombre = match[1].trim();
        const precioGuardado = s.match(/\[precio:(\d+)\]$/);
        return { name: nombre, qty: parseInt(match[2]), price: precioGuardado ? Number(precioGuardado[1]) : getPrecio(nombre), stockId: getStockId(nombre), precioGuardado: !!precioGuardado };
      }).filter(Boolean);

      // En pedidos manuales, ausencia de costo de despacho significa retiro en tienda.
      const itemsConFoto = await agregarFotosEmail(items);
      // El subtotal histórico en Supabase es la fuente de verdad del cobro.
      // En pedidos con un solo producto, recuperamos su precio real, incluso si
      // hubo oferta o descuento y el precio actual del catálogo es diferente.
      const subtotalPedido = Number(pedido.subtotal ?? (Number(pedido.total || 0) - Number(pedido.costo_envio || 0)));
      const preciosGuardadosCompletos = itemsConFoto.length > 0 && itemsConFoto.every(item => item.precioGuardado);
      if (preciosGuardadosCompletos) {
        // El precio unitario registrado al vender tiene prioridad sobre cualquier catálogo posterior.
        const totalLineas = itemsConFoto.reduce((s, item) => s + item.price * item.qty, 0);
        if (Math.abs(totalLineas - subtotalPedido) >= 1) console.warn('[webhook] Subtotal distinto al desglose del pedido:', pedidoId);
      } else if (itemsConFoto.length === 1 && Number.isFinite(subtotalPedido) && subtotalPedido >= 0) {
        const cantidad = Number(itemsConFoto[0].qty) || 1;
        itemsConFoto[0].price = subtotalPedido / cantidad;
      } else if (itemsConFoto.length > 1 && Number.isFinite(subtotalPedido)) {
        const suma = itemsConFoto.reduce((total, item) => total + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
        // Para pedidos con varios productos, no inventamos precios unitarios
        // cuando los valores reconstruidos no cuadran con el pedido guardado.
        if (Math.abs(suma - subtotalPedido) >= 1) {
          itemsConFoto.forEach(item => { if (!item.precioGuardado) item.price = null; });
        }
      }
      const esRetiro = Number(pedido.costo_envio || 0) === 0;

      let subject, html;
      if (estado === 'nuevo_pedido') {
        ({ subject, html } = emailConfirmacion({
          nombre: pedido.nombre,
          items: itemsConFoto,
          subtotal: pedido.subtotal || pedido.total,
          costoEnvio: pedido.costo_envio || 0,
          total: pedido.total,
          direccion: pedido.direccion || '',
          comuna: pedido.comuna || '',
          ciudad: pedido.ciudad || '',
          documento: pedido.documento || 'Boleta',
          esRetiro,
          esPedidoManual: true,
          numeroPedido: pedido.id,
        }));
      } else if (estado === 'despachado') {
        ({ subject, html } = emailDespacho({
          nombre: pedido.nombre, items: itemsConFoto,
          subtotal: pedido.subtotal || pedido.total,
          costoEnvio: pedido.costo_envio || 0,
          total: pedido.total,
          direccion: pedido.direccion || '', comuna: pedido.comuna || '', ciudad: pedido.ciudad || '', esRetiro,
          numeroPedido: pedido.id,
        }));
      } else if (estado === 'entregado') {
        ({ subject, html } = emailEntregado({
          nombre: pedido.nombre, items: itemsConFoto,
          subtotal: pedido.subtotal || pedido.total,
          costoEnvio: pedido.costo_envio || 0,
          total: pedido.total,
          numeroPedido: pedido.id,
          esRetiro,
        }));
      } else {
        ({ subject, html } = emailCancelado({
          nombre: pedido.nombre, items: itemsConFoto,
          subtotal: pedido.subtotal || pedido.total,
          costoEnvio: pedido.costo_envio || 0,
          total: pedido.total,
          numeroPedido: pedido.id,
          esRetiro,
        }));
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'Patas & Caos <contacto@patasycaos.cl>', to: [pedido.email], subject, html }),
      });
      console.log(`[webhook] Email '${estado}' enviado a ${pedido.email}`);

      if (estado === 'nuevo_pedido') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Patas & Caos <contacto@patasycaos.cl>',
            to: [process.env.NOTIFY_EMAIL],
            subject: `Nuevo pedido manual — ${pedido.nombre}`,
            text: `NUEVO PEDIDO MANUAL\n\nCliente: ${pedido.nombre}\nEmail: ${pedido.email}\nTeléfono: ${pedido.telefono || '-'}\nDirección: ${pedido.direccion || 'Retiro'}\nComuna: ${pedido.comuna || '-'}\nCiudad: ${pedido.ciudad || '-'}\nNotas: ${pedido.notas || 'Sin notas'}\n\nProductos: ${pedido.productos}\nTotal: $${pedido.total?.toLocaleString('es-CL')}`,
          }),
        });
      }

      // Descontar stock si es nuevo_pedido
      if (estado === 'nuevo_pedido') {
        try {
          const stockRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/pac_stock`, {
            headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
          });
          const stockData = await stockRes.json();
          let stock = {};
          if (stockData.result) {
            let val = stockData.result;
            let i = 0;
            while (typeof val === 'string' && i++ < 5) { try { val = JSON.parse(val); } catch(e) { break; } }
            if (typeof val === 'object' && val !== null) stock = val;
          }
          for (const item of items) {
            if (!item.stockId) { console.warn('[webhook] Sin stockId para descontar:', item.name); continue; }
            const cur = typeof stock[item.stockId] === 'number' ? stock[item.stockId] : 0;
            stock[item.stockId] = Math.max(0, cur - item.qty);
          }
          await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([['SET', 'pac_stock', JSON.stringify(stock)]]),
          });
          console.log('[webhook] Stock descontado para pedido manual:', pedidoId);
        } catch (e) {
          console.error('[webhook] Error descontando stock pedido manual:', e);
        }
      }

      // Reingresar stock si el pedido se cancela
      // (el stock ya se había descontado al crearse el pedido, así que hay que devolverlo)
      if (estado === 'cancelado') {
        try {
          const stockRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/pac_stock`, {
            headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
          });
          const stockData = await stockRes.json();
          let stock = {};
          if (stockData.result) {
            let val = stockData.result;
            let i = 0;
            while (typeof val === 'string' && i++ < 5) { try { val = JSON.parse(val); } catch(e) { break; } }
            if (typeof val === 'object' && val !== null) stock = val;
          }
          for (const item of items) {
            if (!item.stockId) { console.warn('[webhook] Sin stockId para reingresar:', item.name); continue; }
            const cur = typeof stock[item.stockId] === 'number' ? stock[item.stockId] : 0;
            stock[item.stockId] = cur + item.qty;
          }
          await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([['SET', 'pac_stock', JSON.stringify(stock)]]),
          });
          console.log('[webhook] Stock reingresado por cancelación:', pedidoId);
        } catch (e) {
          console.error('[webhook] Error reingresando stock por cancelación:', e);
        }
      }

      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('[webhook] Error email estado:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // === NOTIFICACIÓN MERCADO PAGO — RESISTENTE A REINTENTOS ===
  const { type, data } = req.body || {};
  const topic = type || req.query?.type || req.query?.topic;
  const paymentId = data?.id || req.query?.['data.id'] || req.query?.id;
  if (topic !== 'payment' || !paymentId) return res.status(200).end();

  // Esta venta fue ingresada manualmente y descontó stock el 21-10-2026.
  // No debe reprocesarse aunque Mercado Pago reenvíe una notificación antigua.
  if (String(paymentId) === '184256106031') {
    console.log('[webhook] Pago 184256106031 conciliado manualmente; no reprocesar.');
    return res.status(200).end();
  }

  const redisURL = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` };
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const supaHeaders = { apikey: supaKey, Authorization: `Bearer ${supaKey}` };
  let locked = false;
  let lockKey = '';
  const lockToken = `${Date.now()}-${Math.random()}`;

  async function redisGet(key) {
    const r = await fetch(`${redisURL}/get/${encodeURIComponent(key)}`, { headers: redisAuth });
    const result = await r.json();
    if (!r.ok || result.error) throw new Error(`Upstash GET ${key}: ${r.status} ${result.error || ''}`);
    return result.result;
  }
  async function redisCommands(commands) {
    const r = await fetch(`${redisURL}/pipeline`, {
      method: 'POST',
      headers: { ...redisAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    });
    const result = await r.json();
    if (!r.ok || !Array.isArray(result) || result.some(x => x?.error)) {
      throw new Error(`Upstash pipeline: ${r.status} ${JSON.stringify(result).slice(0, 600)}`);
    }
    return result;
  }
  async function sendEmailOnce(prefId, kind, payload) {
    const marker = `email_done:${kind}:${prefId}`;
    if (await redisGet(marker)) return true;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      console.error(`[webhook] EMAIL ${kind.toUpperCase()} FALLÓ`, r.status, await r.text());
      return false;
    }
    await redisCommands([['SET', marker, '1']]);
    return true;
  }

  try {
    if (!process.env.MP_ACCESS_TOKEN || !redisURL || !process.env.UPSTASH_REDIS_REST_TOKEN || !process.env.SUPABASE_URL || !supaKey) {
      throw new Error('Faltan variables de entorno para procesar pedidos.');
    }
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(paymentId))}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();
    if (!mpRes.ok) throw new Error(`MP no pudo verificar el pago ${paymentId}: HTTP ${mpRes.status}`);
    if (payment.status !== 'approved') return res.status(200).end();

    // Doble vínculo: preference_id original + external_reference desde checkout.js.
    let preferenceId = String(payment.preference_id || '').trim();
    if (!preferenceId && payment.external_reference) {
      const recovered = await redisGet(`order_ref:${payment.external_reference}`);
      preferenceId = String(recovered || '').trim();
    }
    if (!preferenceId) throw new Error(`Pago aprobado ${payment.id} sin preferencia recuperable.`);

    lockKey = `processing_pref:${preferenceId}`;
    const lock = await redisCommands([['SET', lockKey, lockToken, 'EX', 120, 'NX']]);
    if (lock[0]?.result !== 'OK') {
      // Otra notificación del mismo pago está siendo procesada en este momento.
      return res.status(503).json({ error: 'Pago en procesamiento. Reintentar notificación.' });
    }
    locked = true;

    let orderRaw = await redisGet(`order:${preferenceId}`);
    if (!orderRaw) {
      const backupRaw = await redisGet(`paid_order:${payment.id}`);
      if (backupRaw) {
        const backup = typeof backupRaw === 'string' ? JSON.parse(backupRaw) : backupRaw;
        orderRaw = backup.order ? JSON.stringify(backup.order) : null;
      }
    }
    if (!orderRaw) throw new Error(`PEDIDO TEMPORAL NO ENCONTRADO payment=${payment.id}, preference=${preferenceId}`);
    const order = typeof orderRaw === 'string' ? JSON.parse(orderRaw) : orderRaw;
    if (!Array.isArray(order.items) || !order.items.length) throw new Error('Pedido sin productos válidos.');

    // Respaldo antes de crear el pedido; sirve para diagnóstico y recuperación manual.
    if (!await redisGet(`paid_order:${payment.id}`)) {
      await redisCommands([['SET', `paid_order:${payment.id}`, JSON.stringify({
        payment_id: payment.id, preference_id: preferenceId, status: payment.status,
        processed_at: new Date().toISOString(), order,
      })]]);
    }

    const subtotal = order.items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
    const costoEnvio = Number(order.costoEnvio || 0);
    const total = subtotal + costoEnvio;
    if (!Number.isFinite(total) || total <= 0) throw new Error('Total de pedido inválido.');
    if (Math.abs(Number(payment.transaction_amount) - total) >= 1) {
      throw new Error(`Pago y pedido con totales diferentes: MP=${payment.transaction_amount}, pedido=${total}`);
    }
    const productosTexto = order.items.map(i => `${i.name} x${i.qty}`).join(', ');
    const esRetiro = order.metodoEntrega === 'retiro';

    // Evitar duplicados tanto en Redis como en Supabase.
    let numeroPedido = Number(await redisGet(`processed_pref:${preferenceId}`)) || null;
    let columnaPreferenceExiste = true;
    if (!numeroPedido) {
      const existingRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/Pedidos?mp_preference_id=eq.${encodeURIComponent(preferenceId)}&select=id&limit=1`,
        { headers: supaHeaders }
      );
      if (existingRes.ok) {
        const existing = await existingRes.json();
        numeroPedido = existing?.[0]?.id || null;
      } else {
        const message = await existingRes.text();
        if (/42703|PGRST204|does not exist|column.*mp_preference_id/i.test(message)) {
          columnaPreferenceExiste = false;
          console.warn('[webhook] La columna mp_preference_id no existe en Supabase. Usando idempotencia de Upstash.');
        } else {
          throw new Error(`SUPABASE CONSULTA FALLÓ: ${existingRes.status} ${message.slice(0, 400)}`);
        }
      }
    }

    if (!numeroPedido) {
      const values = {
        nombre: order.nombre, email: order.email, telefono: order.telefono,
        direccion: order.direccion || '', comuna: order.comuna || '', ciudad: order.ciudad || '',
        notas: order.notas || '', productos: productosTexto,
        subtotal, costo_envio: costoEnvio, total,
        documento: order.documento || 'Boleta', estado: 'pendiente',
      };
      if (columnaPreferenceExiste) values.mp_preference_id = preferenceId;
      const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/Pedidos`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(values),
      });
      const insertText = await insertRes.text();
      if (!insertRes.ok) {
        console.error('[webhook] SUPABASE INSERT FALLÓ', insertRes.status, insertText);
        throw new Error(`Supabase rechazó el pedido (${insertRes.status}): ${insertText.slice(0, 500)}`);
      }
      let inserted;
      try { inserted = JSON.parse(insertText); } catch { inserted = []; }
      numeroPedido = inserted?.[0]?.id;
      if (!numeroPedido) throw new Error('Supabase insertó, pero no devolvió ID; verificar antes de reintentar.');
      console.log('[webhook] PEDIDO CREADO', { numeroPedido, preferenceId, paymentId: payment.id });
    }

    // El pedido queda marcado en cuanto Supabase confirma su creación.
    await redisCommands([['SET', `processed_pref:${preferenceId}`, String(numeroPedido)]]);

    // Descuento ATÓMICO e IDEMPOTENTE después de insertar el pedido.
    // El propio script registra stock_done en la misma transacción Redis.
    const decrements = {};
    for (const item of order.items) {
      const id = String(item.id || item.stockId || '').trim();
      const qty = Number(item.qty);
      if (!id || !Number.isInteger(qty) || qty <= 0) throw new Error(`SKU/cantidad inválidos: ${item.name}`);
      decrements[id] = (decrements[id] || 0) + qty;
    }
    const lua = `
      if redis.call('EXISTS', KEYS[2]) == 1 then return 'already' end
      local raw = redis.call('GET', KEYS[1])
      if not raw then return redis.error_reply('Inventario no encontrado') end
      local ok, stock = pcall(cjson.decode, raw)
      if not ok or type(stock) ~= 'table' then return redis.error_reply('Inventario inválido') end
      local dec = cjson.decode(ARGV[1])
      for sku, qty in pairs(dec) do
        if stock[sku] == nil then return redis.error_reply('SKU no encontrado: ' .. sku) end
        local current = tonumber(stock[sku])
        if not current then return redis.error_reply('Stock inválido: ' .. sku) end
        stock[sku] = math.max(0, current - tonumber(qty))
      end
      redis.call('SET', KEYS[1], cjson.encode(stock))
      redis.call('SET', KEYS[2], '1')
      return 'applied'
    `;
    await redisCommands([['EVAL', lua, '2', 'pac_stock', `stock_done:${preferenceId}`, JSON.stringify(decrements)]]);

    const productosEmail = order.items.map(i => `${i.name} x${i.qty} — $${(Number(i.price) * Number(i.qty)).toLocaleString('es-CL')}`).join('\n');
    let emailsOk = true;
    if (!process.env.NOTIFY_EMAIL || !process.env.RESEND_API_KEY) {
      console.error('[webhook] Faltan NOTIFY_EMAIL o RESEND_API_KEY; pedido registrado, email pendiente.');
      emailsOk = false;
    } else {
      emailsOk = await sendEmailOnce(preferenceId, 'interno', {
        from: 'Patas & Caos <contacto@patasycaos.cl>', to: [process.env.NOTIFY_EMAIL],
        subject: `Nuevo pedido — ${order.nombre}`,
        text: `NUEVO PEDIDO\n\nCliente: ${order.nombre}\nEmail: ${order.email}\nTeléfono: ${order.telefono}\nDirección: ${order.direccion || 'Retiro'}\nComuna: ${order.comuna || '-'}\nCiudad: ${order.ciudad || '-'}\nNotas: ${order.notas || 'Sin notas'}\n\nProductos:\n${productosEmail}\n\nTotal: $${total.toLocaleString('es-CL')}`,
      });
    }
    if (order.email) {
      if (!process.env.RESEND_API_KEY) {
        emailsOk = false;
      } else {
        const itemsConFoto = await agregarFotosEmail(order.items);
        const { subject, html } = emailConfirmacion({
          nombre: order.nombre, items: itemsConFoto, subtotal, costoEnvio, total,
          direccion: order.direccion || '', comuna: order.comuna || '', ciudad: order.ciudad || '',
          documento: order.documento || 'Boleta', esRetiro, numeroPedido,
        });
        const sent = await sendEmailOnce(preferenceId, 'cliente', {
          from: 'Patas & Caos <contacto@patasycaos.cl>', to: [order.email], subject, html,
        });
        if (!sent) emailsOk = false;
      }
    }
    if (!emailsOk) return res.status(500).json({ error: 'Pedido registrado. Emails pendientes; Mercado Pago reintentará.' });
    return res.status(200).end();
  } catch (e) {
    console.error('[webhook] ERROR PAGO:', e);
    return res.status(500).json({ error: 'No se pudo completar el procesamiento del pago' });
  } finally {
    if (locked && lockKey) {
      try {
        // Borrar el lock sólo si todavía nos pertenece (no el de otro reintento).
        const releaseLua = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`;
        await redisCommands([['EVAL', releaseLua, '1', lockKey, lockToken]]);
      } catch (e) { console.error('[webhook] No se pudo liberar lock:', e.message); }
    }
  }
}
