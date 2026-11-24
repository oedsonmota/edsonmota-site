/* Rastreamento da Meta: Pixel no navegador + API de Conversões pelo servidor.
   - O Pixel carrega assim que a página abre.
   - Quem recusou cookies no aviso antigo, ou desligou a medição na página de privacidade,
     continua sem rastreamento: essa escolha é respeitada.
   - PageView, ViewContent, AbriuAplicacao e Lead vão também pelo servidor, com o mesmo
     event_id do Pixel para a Meta descartar a duplicata. */
(function(){
  var PIXEL = '2402324527192610';
  var CAPI = 'https://SEU-PROJETO.supabase.co/functions/v1/meta-capi'; /* definido na publicação */
  var PELO_SERVIDOR = { PageView: 1, ViewContent: 1, AbriuAplicacao: 1, Lead: 1 };

  function guardado(chave){ try { return localStorage.getItem(chave); } catch (e) { return null; } }
  var desligado = guardado('em_cookies') === 'nao' || guardado('em_rastreio') === 'nao';

  /* Código de teste do "Testar eventos": abrir o site com ?meta_test=TEST1234 */
  var teste = null;
  try {
    var q = new URLSearchParams(location.search).get('meta_test');
    if (q) sessionStorage.setItem('em_meta_test', q);
    teste = sessionStorage.getItem('em_meta_test');
  } catch (e) {}

  function novoId(){ return 'em.' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2, 10); }
  function cookie(nome){ var m = document.cookie.match('(?:^|; )' + nome + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : undefined; }

  /* _fbp e _fbc já na primeira visita, para o servidor receber os mesmos identificadores do Pixel */
  (function(){
    try {
      if (!cookie('_fbp')) {
        var fbp = 'fb.1.' + Date.now() + '.' + Math.floor(1e9 + Math.random() * 9e9);
        document.cookie = '_fbp=' + fbp + '; path=/; max-age=7776000; SameSite=Lax; Secure';
      }
      var id = new URLSearchParams(location.search).get('fbclid');
      if (id && !cookie('_fbc')) {
        var v = 'fb.1.' + Date.now() + '.' + id;
        document.cookie = '_fbc=' + v + '; path=/; max-age=7776000; SameSite=Lax; Secure';
      }
    } catch (e) {}
  })();

  /* Dados do formulário para a correspondência avançada (o Pixel faz o hash; o servidor recebe já em hash) */
  var pessoa = null;

  async function sha256(txt){
    if (!txt || !window.crypto || !crypto.subtle) return undefined;
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function normaliza(p){
    var nome = (p.nome || '').trim().toLowerCase().split(/\s+/);
    var tel = (p.whatsapp || '').replace(/\D/g, '');
    if (tel && (tel.length === 10 || tel.length === 11)) tel = '55' + tel;
    return { em: (p.email || '').trim().toLowerCase(), ph: tel, fn: nome[0] || '', ln: nome.length > 1 ? nome[nome.length - 1] : '' };
  }

  async function servidor(nome, id, dados){
    if (CAPI.indexOf('SEU-PROJETO') > -1) return;
    var ud = {};
    if (pessoa) {
      var n = normaliza(pessoa);
      ud = { em: await sha256(n.em), ph: await sha256(n.ph), fn: await sha256(n.fn), ln: await sha256(n.ln) };
    }
    var corpo = JSON.stringify({
      event_name: nome, event_id: id, event_source_url: location.href,
      custom_data: dados || {}, user_data: ud, fbp: cookie('_fbp'), fbc: cookie('_fbc'), test_event_code: teste || undefined
    });
    try { fetch(CAPI, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true, mode: 'cors' }).catch(function(){}); } catch (e) {}
  }

  /* Uma porta só para todos os eventos do site */
  window.emEvento = function(nome, dados, personalizado){
    if (desligado) return;
    var id = novoId();
    if (window.fbq) window.fbq(personalizado ? 'trackCustom' : 'track', nome, dados || {}, { eventID: id });
    if (PELO_SERVIDOR[nome]) servidor(nome, id, dados);
  };
  /* Chamado pelo formulário antes do Lead: liga a correspondência avançada com e-mail e telefone */
  window.emPessoa = function(p){
    if (desligado) return;
    pessoa = p;
    var n = normaliza(p);
    if (window.fbq) window.fbq('init', PIXEL, { em: n.em, ph: n.ph, fn: n.fn, ln: n.ln });
  };

  if (desligado) { window.__emq = []; return; }

  /* Pixel */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', PIXEL);
  window.emEvento('PageView');
  /* Eventos chamados antes deste arquivo carregar (ex.: case aberto direto pelo link) */
  (window.__emq || []).forEach(function(a){ window.emEvento.apply(null, a); });
  window.__emq = [];

  /* Tempo no site: conta só com a aba visível */
  var ativo = 0, marcos = [15, 30, 60], ultimo = Date.now();
  setInterval(function(){
    var agora = Date.now();
    if (!document.hidden) ativo += (agora - ultimo) / 1000;
    ultimo = agora;
    while (marcos.length && ativo >= marcos[0]) window.emEvento('TempoNoSite', { segundos: marcos.shift(), pagina: location.pathname }, true);
  }, 1000);

  /* Rolagem */
  var faixas = [25, 50, 75, 100];
  function rolou(){
    var d = document.documentElement, total = d.scrollHeight - innerHeight;
    var pct = total <= 0 ? 100 : (scrollY / total) * 100;
    while (faixas.length && pct >= faixas[0] - 0.5) window.emEvento('Rolagem', { percentual: faixas.shift(), pagina: location.pathname }, true);
    if (!faixas.length) removeEventListener('scroll', rolou);
  }
  addEventListener('scroll', rolou, { passive: true });

  function iniciarDom(){
    /* Seção vista: uma vez por seção */
    var secoes = document.querySelectorAll('[data-secao]');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (e.isIntersecting) { window.emEvento('SecaoVista', { secao: e.target.getAttribute('data-secao'), pagina: location.pathname }, true); io.unobserve(e.target); }
        });
      }, { threshold: 0.35 });
      secoes.forEach(function(s){ io.observe(s); });
    }
    /* Cliques em botões e links */
    document.addEventListener('click', function(e){
      var el = e.target.closest('a, button, summary');
      if (!el) return;
      var texto = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      var lugar = el.closest('.nav') ? 'Menu' : el.closest('.apl') ? 'Formulário' : el.closest('.rodape') ? 'Rodapé' :
        (el.closest('[data-secao]') ? el.closest('[data-secao]').getAttribute('data-secao') : 'Página');
      window.emEvento('CliqueBotao', { texto: texto || el.tagName.toLowerCase(), posicao: lugar, destino: el.getAttribute('href') || '', pagina: location.pathname }, true);
    }, true);
    rolou();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarDom); else iniciarDom();
})();
