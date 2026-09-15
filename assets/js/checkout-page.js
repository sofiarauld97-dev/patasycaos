
(function(){
  const $ = id => document.getElementById(id);
  let documento = 'boleta';

  function subtotal(){
    return cart.reduce((sum,item)=>sum + Number(item.price||0)*Number(item.qty||0),0);
  }

  function entrega(){
    return document.querySelector('input[name="metodo-envio"]:checked')?.value || 'despacho';
  }

  function costoEnvioActual(){
    if(entrega()==='retiro') return 0;
    const sub = subtotal();
    if(sub >= 39990) return 0;
    const comuna = $('co-comuna').value.trim();
    return calcularEnvio(comuna)?.precio || 0;
  }

  function esCalipsoPreventa(item){
    const nombre = String(item?.name || '').toLowerCase();
    const id = String(item?.id || '').toLowerCase();
    const stockId = String(item?.stockId || '').toLowerCase();

    return item?.preventa === true ||
      stockId === 'botella-portatil-para-perros_calipso' ||
      id === 'botella-portatil-para-perros_calipso' ||
      (nombre.includes('botella portátil para perros') && nombre.includes('calipso')) ||
      (nombre.includes('botella portatil para perros') && nombre.includes('calipso'));
  }

  function actualizarResumen(){
    if(!cart.length){
      $('checkoutResumenPagina').innerHTML = '<p style="font-size:.86rem;color:#6B625B">Tu carrito está vacío.</p>';
      $('confirmar-pago').disabled = true;
      $('checkout-subtotal').textContent = '$0';
      $('checkout-envio-resumen').textContent = '—';
      $('checkout-total').textContent = '$0';
      return;
    }

    $('checkoutResumenPagina').innerHTML = cart.map(item => {
      const preventa = esCalipsoPreventa(item);
      return `
        <div class="summary-item">
          <div class="summary-item-main">
            <span>${item.name} x${item.qty}</span>
            ${preventa ? `
              <div class="summary-preorder-line">
                <span class="summary-preorder-badge">PREVENTA</span>
                <span class="summary-preorder-text">Despacho a partir del 28 de septiembre</span>
              </div>
            ` : ''}
          </div>
          <strong>$${(item.price*item.qty).toLocaleString('es-CL')}</strong>
        </div>`;
    }).join('');

    const sub = subtotal();
    const cost = costoEnvioActual();
    $('checkout-subtotal').textContent = '$' + sub.toLocaleString('es-CL');
    $('checkout-envio-resumen').textContent =
      entrega()==='retiro' ? 'Gratis' :
      sub >= 39990 ? 'Gratis' :
      $('co-comuna').value.trim() ? (cost ? '$'+cost.toLocaleString('es-CL') : 'A coordinar') : 'Por calcular';
    $('checkout-total').textContent = '$' + (sub+cost).toLocaleString('es-CL');
  }

  function seleccionarEntrega(){
    const tipo = entrega();
    document.querySelectorAll('input[name="metodo-envio"]').forEach(input=>{
      input.closest('.choice').classList.toggle('selected', input.checked);
    });
    $('campos-envio').hidden = tipo==='retiro';
    $('retiro-info').hidden = tipo!=='retiro';
    actualizarResumen();
  }

  function seleccionarPago(){
    const metodo = document.querySelector('input[name="metodo-pago"]:checked')?.value;
    document.querySelectorAll('input[name="metodo-pago"]').forEach(input=>{
      input.closest('.choice').classList.toggle('selected', input.checked);
    });
    $('transfer-info').hidden = metodo!=='transferencia';
    $('confirmar-pago').textContent = metodo==='transferencia' ? 'Confirmar pedido' : 'Confirmar y pagar';
  }

  window.seleccionarDocumentoPagina = function(tipo){
    documento = tipo;
    $('btn-boleta').classList.toggle('selected',tipo==='boleta');
    $('btn-factura').classList.toggle('selected',tipo==='factura');
    $('factura-fields').hidden = tipo!=='factura';
  };

  function toast(msg){
    const el=$('cart-toast');
    el.textContent=msg; el.classList.add('show');
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2600);
  }

  function initAutocomplete(){
    const input=$('co-comuna'), list=$('comuna-sugerencias');
    input.addEventListener('input',()=>{
      const q=normalizarComuna(input.value);
      if(q.length<2){list.classList.remove('open');return;}
      const matches=COMUNAS_CHILE.filter(x=>normalizarComuna(x.c).includes(q)).slice(0,8);
      list.innerHTML=matches.map(x=>`<div class="autocomplete-option" data-comuna="${x.c}" data-ciudad="${x.city}">${x.c}</div>`).join('');
      list.classList.toggle('open',matches.length>0);
    });
    list.addEventListener('click',e=>{
      const opt=e.target.closest('.autocomplete-option'); if(!opt)return;
      input.value=opt.dataset.comuna; $('co-ciudad').value=opt.dataset.ciudad;
      list.classList.remove('open'); actualizarResumen();
    });
    input.addEventListener('change',actualizarResumen);
    document.addEventListener('click',e=>{if(!e.target.closest('.autocomplete-wrap'))list.classList.remove('open')});
  }

  window.confirmarCheckoutPagina = async function(){
    if(!cart.length){toast('Tu carrito está vacío');return;}

    const esRetiro=entrega()==='retiro';
    const ids=esRetiro
      ? ['co-nombre','co-telefono','co-email']
      : ['co-nombre','co-telefono','co-email','co-direccion','co-comuna','co-ciudad'];

    let valido=true;
    ids.forEach(id=>{
      const el=$(id); const ok=el.value.trim();
      el.classList.toggle('error',!ok); if(!ok)valido=false;
    });
    if(!valido){toast('Completa los campos obligatorios');return;}

    let docInfo={};
    if(documento==='factura'){
      const factIds=['co-rut','co-razon','co-giro','co-dir-factura'];
      let factOk=true;
      factIds.forEach(id=>{const el=$(id);const ok=el.value.trim();el.classList.toggle('error',!ok);if(!ok)factOk=false});
      if(!factOk){toast('Completa los datos de factura');return;}
      docInfo={rut:$('co-rut').value.trim(),razon:$('co-razon').value.trim(),giro:$('co-giro').value.trim(),dirFact:$('co-dir-factura').value.trim()};
    }

    const cliente={
      nombre:$('co-nombre').value.trim(),
      telefono:$('co-telefono').value.trim(),
      email:$('co-email').value.trim(),
      direccion:esRetiro?'Retiro en tienda':$('co-direccion').value.trim(),
      comuna:esRetiro?'Providencia':$('co-comuna').value.trim(),
      ciudad:esRetiro?'Santiago':$('co-ciudad').value.trim(),
      notas:esRetiro?$('co-notas-retiro').value.trim():$('co-notas').value.trim(),
      costoEnvio:costoEnvioActual(),
      metodoEntrega:esRetiro?'Retiro en tienda — Providencia (dirección exacta se coordina por WhatsApp)':'Despacho a domicilio',
      documento:documento==='factura'?'Factura':'Boleta',
      ...docInfo
    };

    cart = cart.map(item => esCalipsoPreventa(item) ? {
      ...item,
      preventa: true,
      preventaFecha: '28 de septiembre',
      preventaTexto: 'Despacho a partir del 28 de septiembre',
      stockId: item.stockId || 'botella-portatil-para-perros_Calipso'
    } : item);
    localStorage.setItem('pac_cart', JSON.stringify(cart));

    const metodo=document.querySelector('input[name="metodo-pago"]:checked')?.value || 'mercadopago';
    const btn=$('confirmar-pago'); btn.disabled=true; btn.textContent='Procesando...';

    try{
      if(metodo==='transferencia'){
        const res=await fetch('/api/checkout-transferencia',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart,cliente})});
        const data=await res.json();
        if(!res.ok)throw new Error(data.error||'No se pudo crear el pedido');
        localStorage.removeItem('pac_cart'); cart=[];
        window.location.href='/pedido-ok?metodo=transferencia&pedido='+encodeURIComponent(data.numeroPedido||'');
        return;
      }

      const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart,cliente})});
      const data=await res.json();
      if(!res.ok||!data.init_point)throw new Error(data.error||'No se pudo iniciar el pago');
      window.location.href=data.init_point;
    }catch(error){
      console.error(error); toast(error.message||'Error al procesar el pedido');
      btn.disabled=false; seleccionarPago();
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('input[name="metodo-envio"]').forEach(x=>x.addEventListener('change',seleccionarEntrega));
    document.querySelectorAll('input[name="metodo-pago"]').forEach(x=>x.addEventListener('change',seleccionarPago));
    initAutocomplete();
    seleccionarEntrega(); seleccionarPago(); actualizarResumen();
  });
})();
