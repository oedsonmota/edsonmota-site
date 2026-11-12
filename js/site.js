(function(){
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toque = window.matchMedia('(hover: none)').matches;

  /* Menu no celular */
  var nav = document.querySelector('.nav');
  var menu = document.querySelector('.nav .menu');
  if (menu) menu.addEventListener('click', function(){
    var aberto = nav.classList.toggle('aberto');
    menu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  });
  document.querySelectorAll('.nav ul a').forEach(function(a){
    a.addEventListener('click', function(){ nav.classList.remove('aberto'); });
  });

  /* Revelar ao rolar: anima sempre que a seção entra na tela, inclusive ao voltar */
  if (!reduz && 'IntersectionObserver' in window) {
    var alvos = [].slice.call(document.querySelectorAll('[data-rev]'));
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var el = e.target;
        if (e.isIntersecting) el.classList.remove('pre');
        else if (e.boundingClientRect.top > 0 || e.boundingClientRect.bottom < 0) el.classList.add('pre');
      });
    }, {rootMargin:'0px 0px -6% 0px', threshold:0});
    alvos.forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.92) el.classList.add('pre');
      requestAnimationFrame(function(){ el.classList.add('rev'); });
      io.observe(el);
    });
  }

  /* Trilha de imagens no cursor (cada imagem nova por cima, as anteriores encolhem e somem) */
  document.querySelectorAll('[data-trilha]').forEach(function(area){
    var fotos = area.getAttribute('data-trilha').split(',');
    var i = 0, ux = null, uy = null, z = 10, ativos = 0;
    fotos.forEach(function(src){ var im = new Image(); im.src = src; });
    function soltar(x, y){
      if (ativos > 14) return;
      var img = document.createElement('img');
      img.src = fotos[i++ % fotos.length];
      img.alt = '';
      img.className = 'trilha-img';
      var rot = (Math.random() * 4 - 2).toFixed(2);
      img.style.left = x + 'px';
      img.style.top = y + 'px';
      img.style.zIndex = String(++z);
      area.appendChild(img);
      ativos++;
      var base = 'translate(-50%,-50%) rotate(' + rot + 'deg) ';
      var a = img.animate([
        {opacity:0, transform:base + 'scale(.72)'},
        {opacity:1, transform:base + 'scale(1)', offset:.1},
        {opacity:1, transform:base + 'scale(.97)', offset:.32},
        {opacity:0, transform:base + 'scale(.8)'}
      ], {duration:1250, easing:'cubic-bezier(.25,.8,.25,1)', fill:'forwards'});
      a.onfinish = function(){ img.remove(); ativos--; };
    }
    if (reduz || toque) return;
    area.addEventListener('pointermove', function(ev){
      var r = area.getBoundingClientRect();
      var x = ev.clientX - r.left, y = ev.clientY - r.top;
      if (ux === null) { ux = x; uy = y; }
      if (Math.hypot(x - ux, y - uy) > 70) { soltar(x, y); ux = x; uy = y; }
    });
    area.addEventListener('pointerleave', function(){ ux = null; });
  });


  /* Faixa de projetos: corre sozinha, para no hover e pode ser arrastada */
  document.querySelectorAll('.marquee').forEach(function(box){
    var trilho = box.querySelector('.marquee-trilho');
    var x = 0, vel = reduz ? 0 : 0.45, sobre = false, arrastando = false, sx = 0, sxx = 0, moveu = false, ultimo = null, inercia = 0, lastX = 0, lastT = 0;
    function metade(){ return trilho.scrollWidth / 2; }
    function ajustar(){ var m = metade(); if (m <= 0) return; while (x <= -m) x += m; while (x > 0) x -= m; }
    function quadro(t){
      var dt = ultimo ? Math.min(48, t - ultimo) : 16; ultimo = t;
      if (!arrastando) {
        if (Math.abs(inercia) > 0.05) { x += inercia; inercia *= 0.94; }
        else if (!sobre) x -= vel * dt / 16;
      }
      ajustar();
      trilho.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
    box.addEventListener('mouseenter', function(){ sobre = true; });
    box.addEventListener('mouseleave', function(){ sobre = false; });
    box.addEventListener('pointerdown', function(e){
      arrastando = true; moveu = false; sx = e.clientX; sxx = x; inercia = 0; lastX = e.clientX; lastT = performance.now();
      box.classList.add('arrastando');
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
    });
    box.addEventListener('pointermove', function(e){
      if (!arrastando) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) moveu = true;
      x = sxx + dx;
      var agora = performance.now();
      inercia = (e.clientX - lastX) / Math.max(1, agora - lastT) * 16;
      lastX = e.clientX; lastT = agora;
    });
    function soltar(e){
      if (!arrastando) return;
      arrastando = false; box.classList.remove('arrastando');
      if (!moveu) {
        inercia = 0;
        var alvo = document.elementFromPoint(e.clientX, e.clientY);
        var link = alvo && alvo.closest ? alvo.closest('a') : null;
        if (link && box.contains(link)) window.location.href = link.href;
      }
    }
    box.addEventListener('pointerup', soltar);
    box.addEventListener('pointercancel', function(){ arrastando = false; box.classList.remove('arrastando'); });
    box.addEventListener('click', function(e){ if (e.detail > 0) e.preventDefault(); }, true);
    box.addEventListener('dragstart', function(e){ e.preventDefault(); });
  });


  /* Títulos: a parte cinza acende palavra por palavra perto do cursor */
  (function(){
    if (reduz || toque) return;
    function rgb(h){ h = h.replace('#',''); return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)]; }
    var TEMAS = { escuro: [rgb('6F6F6F'), rgb('FFFFFF')], claro: [rgb('8A8A8A'), rgb('0A0A0A')] };
    document.querySelectorAll('h1, h2').forEach(function(h){
      var dims = h.querySelectorAll('.dim'); if (!dims.length) return;
      var tema = h.closest('.escuro') ? TEMAS.escuro : TEMAS.claro;
      var palavras = [];
      dims.forEach(function(d){
        [].slice.call(d.childNodes).forEach(function(n){
          if (n.nodeType !== 3 || !n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(parte){
            if (!parte) return;
            if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); return; }
            var sp = document.createElement('span'); sp.className = 'luz'; sp.textContent = parte;
            frag.appendChild(sp); palavras.push(sp);
          });
          d.replaceChild(frag, n);
        });
      });
      var raio = Math.max(140, parseFloat(getComputedStyle(h).fontSize) * 2.2);
      var pedido = null, mx = 0, my = 0;
      function pintar(){
        pedido = null;
        palavras.forEach(function(w){
          var r = w.getBoundingClientRect();
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          var d = Math.hypot(mx - cx, (my - cy) * 1.4);
          var t = Math.max(0, 1 - d / raio); t = t * t * (3 - 2 * t) * 0.85;
          var a = tema[0], b = tema[1];
          w.style.color = t > 0.01 ? 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')' : '';
        });
      }
      h.addEventListener('pointermove', function(e){ mx = e.clientX; my = e.clientY; if (!pedido) pedido = requestAnimationFrame(pintar); });
      h.addEventListener('pointerleave', function(){ palavras.forEach(function(w){ w.style.color = ''; }); });
    });
  })();

  /* Nome grande do rodapé sempre cabendo inteiro na largura */
  var grande = document.querySelector('.rodape .grande');
  if (grande) {
    var ajusta = function(){
      var pai = grande.parentNode, cs = getComputedStyle(pai);
      var largura = pai.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      grande.style.fontSize = '100px'; grande.style.display = 'inline-block';
      var texto = grande.getBoundingClientRect().width;
      grande.style.display = '';
      if (texto > 0) grande.style.fontSize = Math.floor(100 * largura / texto * 0.99) + 'px';
    };
    ajusta(); window.addEventListener('resize', ajusta);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusta);
  }

  /* Contadores: contam de novo sempre que aparecem */
  var nums = document.querySelectorAll('[data-conta]');
  if (nums.length && 'IntersectionObserver' in window && !reduz) {
    var ioN = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target, fim = parseInt(el.getAttribute('data-conta'), 10), t0 = null;
        function passo(t){
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 1400);
          el.textContent = Math.round(fim * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(passo);
        }
        el.textContent = '0';
        requestAnimationFrame(passo);
      });
    }, {threshold:.6});
    nums.forEach(function(n){ ioN.observe(n); });
  }

  /* Carrossel com setas */
  document.querySelectorAll('[data-carrossel]').forEach(function(box){
    var trilho = box.querySelector('.trilho');
    var ant = box.querySelector('[data-ant]'), prox = box.querySelector('[data-prox]');
    function passo(){ var c = trilho.querySelector(':scope > *'); return c ? c.getBoundingClientRect().width + 20 : 400; }
    function estado(){
      if (ant) ant.disabled = trilho.scrollLeft < 8;
      if (prox) prox.disabled = trilho.scrollLeft + trilho.clientWidth > trilho.scrollWidth - 8;
    }
    if (ant) ant.addEventListener('click', function(){ trilho.scrollBy({left:-passo(), behavior:'smooth'}); });
    if (prox) prox.addEventListener('click', function(){ trilho.scrollBy({left:passo(), behavior:'smooth'}); });
    trilho.addEventListener('scroll', estado, {passive:true});
    estado();
    /* arrastar com o mouse */
    var baixo = false, sx = 0, sl = 0, moveu = false;
    trilho.addEventListener('pointerdown', function(e){ if (e.pointerType !== 'mouse') return; baixo = true; moveu = false; sx = e.clientX; sl = trilho.scrollLeft; trilho.classList.add('arrastando'); });
    window.addEventListener('pointermove', function(e){ if (!baixo) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moveu = true; trilho.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function(){ baixo = false; trilho.classList.remove('arrastando'); });
    trilho.addEventListener('click', function(e){ if (moveu) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* Cronograma do método: percorre as etapas sempre que a seção aparece */
  var crono = document.querySelector('[data-crono]');
  if (crono) {
    var blocos = [].slice.call(crono.querySelectorAll('.etapa'));
    var painel = document.querySelector('[data-painel]');
    var parado = false, timer = null;
    function mostrar(b){
      blocos.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      painel.querySelector('[data-p-num]').textContent = b.getAttribute('data-num');
      painel.querySelector('[data-p-nome]').textContent = b.getAttribute('data-nome');
      painel.querySelector('[data-p-fase]').textContent = b.getAttribute('data-fase');
      painel.querySelector('[data-p-entrega]').textContent = b.getAttribute('data-entrega');
      painel.querySelector('[data-p-desc]').textContent = b.getAttribute('data-desc');
      painel.querySelector('[data-p-dias]').textContent = b.getAttribute('data-semana');
      painel.classList.remove('troca'); void painel.offsetWidth; painel.classList.add('troca');
    }
    blocos.forEach(function(b){
      b.addEventListener('click', function(){ parado = true; clearTimeout(timer); mostrar(b); });
      b.addEventListener('mouseenter', function(){ if (!toque) { parado = true; clearTimeout(timer); mostrar(b); } });
    });
    mostrar(blocos[0]);
    if (!reduz && 'IntersectionObserver' in window) {
      var ioC = new IntersectionObserver(function(es){
        if (es[0].isIntersecting) {
          parado = false; clearTimeout(timer);
          var k = 0;
          (function prox(){
            if (parado || k >= blocos.length) return;
            mostrar(blocos[k++]);
            timer = setTimeout(prox, 1700);
          })();
        } else { clearTimeout(timer); }
      }, {threshold:.45});
      ioC.observe(crono);
    }
  }
  /* Brilho laranja que segue o cursor sobre o nome do rodapé */
  var gr = document.querySelector('.rodape .grande');
  if (gr && !reduz && window.matchMedia('(hover:hover)').matches) {
    gr.addEventListener('pointermove', function(e){
      var r = gr.getBoundingClientRect();
      gr.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      gr.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      gr.style.setProperty('--raio', Math.round(r.height * 1.1) + 'px');
    });
    gr.addEventListener('pointerleave', function(){ gr.style.setProperty('--raio', '0px'); });
  }
})();
