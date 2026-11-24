/* Aviso de cookies + Pixel da Meta.
   Nada de rastreamento carrega antes do aceite. A escolha fica salva neste navegador
   e pode ser trocada a qualquer momento pelo link "Privacidade e cookies" do rodapé. */
(function(){
  var PIXEL = '2402324527192610';
  var CHAVE = 'em_cookies';
  var carregado = false;

  function ler(){ try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function salvar(v){ try { localStorage.setItem(CHAVE, v); } catch (e) {} }

  function ligarPixel(){
    if (carregado) return; carregado = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL);
    window.fbq('track', 'PageView');
  }

  /* Eventos do site: só chegam à Meta se a pessoa aceitou */
  window.emEvento = function(nome, dados, personalizado){
    if (!carregado || !window.fbq) return;
    window.fbq(personalizado ? 'trackCustom' : 'track', nome, dados || {});
  };

  var css =
  '.ck{position:fixed;left:16px;bottom:16px;z-index:150;width:min(420px,calc(100vw - 32px));background:rgba(246,246,246,.9);backdrop-filter:blur(28px) saturate(190%);-webkit-backdrop-filter:blur(28px) saturate(190%);border:1px solid rgba(255,255,255,.8);box-shadow:0 20px 50px rgba(10,10,10,.16);border-radius:22px;padding:22px;color:#0A0A0A;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;opacity:0;transform:translateY(16px);transition:opacity .5s cubic-bezier(.2,.8,.2,1),transform .5s cubic-bezier(.2,.8,.2,1)}'+
  '.ck.on{opacity:1;transform:none}'+
  '.ck b{display:block;font-size:16px;letter-spacing:-0.02em;margin-bottom:6px}'+
  '.ck p{margin:0;font-size:14px;line-height:1.45;color:#555}'+
  '.ck p a{color:#0A0A0A}'+
  '.ck-acoes{display:flex;gap:8px;margin-top:16px}'+
  '.ck-acoes button{flex:1;min-height:44px;border-radius:999px;font:700 14px "Helvetica Neue",Helvetica,Arial,sans-serif;cursor:pointer;border:1.5px solid #0A0A0A;transition:background .2s,color .2s,border-color .2s}'+
  '.ck-sim{background:#F43217;border-color:#F43217!important;color:#0A0A0A}'+
  '.ck-sim:hover{background:#0A0A0A;border-color:#0A0A0A!important;color:#fff}'+
  '.ck-nao{background:transparent;color:#0A0A0A}'+
  '.ck-nao:hover{background:#0A0A0A;color:#fff}'+
  '@media (max-width:520px){.ck{left:10px;right:10px;bottom:10px;width:auto}}'+
  '@media (prefers-reduced-motion:reduce){.ck{transition:none}}';

  function aviso(){
    if (document.querySelector('.ck')) return;
    if (!document.getElementById('ck-estilo')) {
      var st = document.createElement('style'); st.id = 'ck-estilo'; st.textContent = css; document.head.appendChild(st);
    }
    var box = document.createElement('div');
    box.className = 'ck'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-live', 'polite'); box.setAttribute('aria-label', 'Aviso de cookies');
    box.innerHTML = '<b>Cookies, só com o seu ok.</b><p>Uso cookies para entender as visitas e mostrar anúncios para quem já conhece o meu trabalho. Nada é coletado se você recusar. <a href="privacidade.html">Saiba mais</a></p>'+
      '<div class="ck-acoes"><button type="button" class="ck-nao">Recusar</button><button type="button" class="ck-sim">Aceitar</button></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ box.classList.add('on'); }); });
    function fecha(){ box.classList.remove('on'); setTimeout(function(){ box.remove(); }, 450); }
    box.querySelector('.ck-sim').addEventListener('click', function(){ salvar('sim'); ligarPixel(); fecha(); });
    box.querySelector('.ck-nao').addEventListener('click', function(){ salvar('nao'); if (window.fbq) window.fbq('consent', 'revoke'); fecha(); });
  }

  /* Link do rodapé para rever a escolha */
  document.addEventListener('click', function(e){
    var l = e.target.closest('[data-cookies]'); if (!l) return;
    e.preventDefault(); aviso();
  });

  function iniciar(){
    var v = ler();
    if (v === 'sim') ligarPixel();
    else if (v !== 'nao') setTimeout(aviso, 1200);
  }
  if (document.readyState === 'complete') iniciar(); else window.addEventListener('load', iniciar);
})();
