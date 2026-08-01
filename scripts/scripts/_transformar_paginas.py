import re

SRC_DIR = '/mnt/user-data/uploads'
OUT_DIR = '/home/claude/build/patasycaos/paginas'
COMPONENTS_DIR = '/home/claude/build/patasycaos/components'


def leer(nombre):
    with open(f'{COMPONENTS_DIR}/{nombre}', encoding='utf-8') as f:
        return f.read().strip()


HEADER_TAG_CANON = leer('header-tag.html')
MOBILE_MENU_CANON = leer('mobile-menu.html')
CART_OVERLAY_CANON = leer('cart-overlay.html')
CART_SIDEBAR_CANON = leer('cart-sidebar.html')
FOOTER_ONLY_CANON = leer('footer-only.html')
AUTH_MODAL_CANON = leer('auth-modal.html')

ACTIVE_MAP = {
    'index.html': '/',
    'tienda.html': '/tienda',
    'blog.html': '/blog',
    'blog-alimentacion.html': '/blog',
    'blog-flores-de-bach.html': '/blog',
    'blog-juguetes.html': '/blog',
    'suscripciones.html': '/suscripciones',
    'nosotros.html': None,
    'contacto.html': None,
    'faq.html': None,
    'envios.html': None,
    'devoluciones.html': None,
    'cuenta.html': None,
    'pedido-ok.html': None,
}


HEADER_TAG_NEUTRO = HEADER_TAG_CANON.replace(
    '<li><a href="/tienda" class="activo">Tienda</a></li>',
    '<li><a href="/tienda">Tienda</a></li>'
)
assert 'class="activo"' not in HEADER_TAG_NEUTRO, 'Quedo un activo sin limpiar en header-tag.html'

MOBILE_MENU_NEUTRO = MOBILE_MENU_CANON.replace(
    '<a href="/tienda" class="activo" onclick="toggleMenu()">Tienda</a>',
    '<a href="/tienda" onclick="toggleMenu()">Tienda</a>'
)
assert 'class="activo"' not in MOBILE_MENU_NEUTRO, 'Quedo un activo sin limpiar en mobile-menu.html'


def construir_header_tag(pagina):
    href = ACTIVE_MAP[pagina]
    if href is None:
        return HEADER_TAG_NEUTRO
    return HEADER_TAG_NEUTRO.replace(f'<a href="{href}">', f'<a href="{href}" class="activo">', 1)


def construir_mobile_menu(pagina):
    href = ACTIVE_MAP[pagina]
    if href is None:
        return MOBILE_MENU_NEUTRO
    return MOBILE_MENU_NEUTRO.replace(
        f'<a href="{href}" onclick="toggleMenu()">',
        f'<a href="{href}" class="activo" onclick="toggleMenu()">',
        1,
    )


def quitar_por_llaves(texto, patron_inicio):
    """Elimina TODAS las apariciones de la funcion (algunas paginas la tenian duplicada)."""
    veces = 0
    while True:
        m = re.search(patron_inicio, texto)
        if not m:
            break
        inicio = m.start()
        idx_llave = texto.index('{', m.end() - 1)
        profundidad = 0
        i = idx_llave
        fin = None
        while i < len(texto):
            if texto[i] == '{':
                profundidad += 1
            elif texto[i] == '}':
                profundidad -= 1
                if profundidad == 0:
                    fin = i + 1
                    break
            i += 1
        if fin is None:
            break
        if fin < len(texto) and texto[fin] == '\n':
            fin += 1
        texto = texto[:inicio] + texto[fin:]
        veces += 1
    return texto, veces > 0


def reemplazar_colapsando_duplicados(contenido, patron, nuevo_valor, reporte, clave):
    """Reemplaza la 1ra aparicion por el valor canonico y elimina cualquier duplicado
    exacto adicional (algunas paginas tenian el cart-overlay/cart-sidebar repetido dos veces)."""
    matches = list(patron.finditer(contenido))
    reporte[clave] = len(matches)
    if not matches:
        return contenido
    resultado = contenido[:matches[0].start()] + nuevo_valor
    cursor = matches[0].end()
    for m in matches[1:]:
        resultado += contenido[cursor:m.start()]
        cursor = m.end()
    resultado += contenido[cursor:]
    return resultado


HEADER_TAG_RE = re.compile(r'<header class="site-header">.*?</header>', re.S)
MOBILE_MENU_RE = re.compile(r'<div class="mobile-menu" id="mobile-menu">.*?<a href="/blog"[^>]*>Blog</a>\s*</div>', re.S)
MOBILE_MENU_FALLBACK_RE = re.compile(r'<div class="mobile-menu" id="mobile-menu">.*?(?=<main)', re.S)
CART_OVERLAY_RE = re.compile(r'<div class="cart-overlay" id="cart-overlay" onclick="toggleCart\(\)"></div>')
CART_SIDEBAR_RE = re.compile(r'<aside class="cart-sidebar" id="cart-sidebar">.*?</aside>', re.S)
FOOTER_ONLY_RE = re.compile(r'<footer.*?</footer>', re.S)
AUTH_MODAL_RE = re.compile(r'<div class="auth-overlay" id="auth-overlay".*?<p class="auth-msg" id="auth-msg"></p>\s*</div>\s*</div>', re.S)

TOGGLE_MENU_RE = r'function toggleMenu\s*\(\s*\)\s*\{'
TOGGLE_ACCORDION_RE = r'function toggleAccordion\s*\(\s*btn\s*\)\s*\{'
SCROLL_RE = re.compile(r"window\.addEventListener\('scroll',\s*\(\)\s*=>\s*\{[^}]*classList\.toggle\('scrolled'[^}]*\}\s*\)\s*;\s*\n?")
CART_JS_RE = re.compile(r'(<script src="/?cart\.js"></script>)')


def reemplazar(contenido, patron, nuevo_valor, reporte, clave, usar_fallback=None):
    m = patron.search(contenido)
    if not m and usar_fallback is not None:
        m = usar_fallback.search(contenido)
        if m:
            reporte[clave] = 'fallback'
            return contenido[:m.start()] + nuevo_valor + contenido[m.end():]
    reporte[clave] = bool(m)
    if not m:
        return contenido
    return contenido[:m.start()] + nuevo_valor + contenido[m.end():]


def procesar(pagina):
    with open(f'{SRC_DIR}/{pagina}', encoding='utf-8') as f:
        contenido = f.read().replace('\r\n', '\n')

    reporte = {'pagina': pagina}

    contenido = reemplazar(contenido, HEADER_TAG_RE, construir_header_tag(pagina), reporte, 'header')
    contenido = reemplazar(contenido, MOBILE_MENU_RE, construir_mobile_menu(pagina), reporte, 'mobile_menu', usar_fallback=MOBILE_MENU_FALLBACK_RE)
    contenido = reemplazar_colapsando_duplicados(contenido, CART_OVERLAY_RE, CART_OVERLAY_CANON, reporte, 'cart_overlay_matches')
    contenido = reemplazar_colapsando_duplicados(contenido, CART_SIDEBAR_RE, CART_SIDEBAR_CANON, reporte, 'cart_sidebar_matches')
    contenido = reemplazar(contenido, FOOTER_ONLY_RE, FOOTER_ONLY_CANON, reporte, 'footer')
    contenido = reemplazar(contenido, AUTH_MODAL_RE, AUTH_MODAL_CANON, reporte, 'auth_modal')

    if '/assets/css/site.css' not in contenido:
        contenido = contenido.replace('<head>', '<head>\n<link rel="stylesheet" href="/assets/css/site.css">', 1)
        reporte['site_css_agregado'] = True
    else:
        reporte['site_css_agregado'] = False

    contenido, quito_menu = quitar_por_llaves(contenido, TOGGLE_MENU_RE)
    contenido, quito_accordion = quitar_por_llaves(contenido, TOGGLE_ACCORDION_RE)
    contenido, n_scroll = SCROLL_RE.subn('', contenido)
    reporte['quito_toggleMenu'] = quito_menu
    reporte['quito_toggleAccordion'] = quito_accordion
    reporte['quito_scrollListener'] = n_scroll > 0

    if '/assets/js/site.js' not in contenido:
        if CART_JS_RE.search(contenido):
            contenido = CART_JS_RE.sub(r'\1\n<script src="/assets/js/site.js"></script>', contenido, count=1)
            reporte['site_js_agregado'] = True
        else:
            reporte['site_js_agregado'] = False
    else:
        reporte['site_js_agregado'] = False

    with open(f'{OUT_DIR}/{pagina}', 'w', encoding='utf-8') as f:
        f.write(contenido)

    return reporte


if __name__ == '__main__':
    reportes = [procesar(p) for p in ACTIVE_MAP.keys()]
    for r in reportes:
        print(r)
