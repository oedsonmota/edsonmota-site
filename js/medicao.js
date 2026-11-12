/* medicao.js · edsonmota.com · v1 */
(function () {
  var CHAVE = 'em_origem';
  var DIAS = 90;
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  function lerURL() {
    var q = new URLSearchParams(window.location.search), o = {}, tem = false;
    PARAMS.forEach(function (p) { var v = q.get(p); if (v) { o[p] = v; tem = true; } });
    return tem ? o : null;
  }
  function pelaReferencia() {
    var r = document.referrer, h;
    if (!r) return { utm_source: 'direto', utm_medium: 'nenhum' };
    try { h = new URL(r).hostname.replace(/^www\./, ''); } catch (e) { return { utm_source: 'direto', utm_medium: 'nenhum' }; }
    if (h === window.location.hostname.replace(/^www\./, '')) return null;
    if (/(^|\.)google\./.test(h)) return { utm_source: 'google', utm_medium: 'organic' };
    if (/(^|\.)(bing|duckduckgo|yahoo)\./.test(h)) return { utm_source: h.split('.')[0], utm_medium: 'organic' };
    if (/instagram\.com$/.test(h)) return { utm_source: 'instagram', utm_medium: 'social' };
    if (/facebook\.com$/.test(h)) return { utm_source: 'facebook', utm_medium: 'social' };
    if (/linkedin\.com$|lnkd\.in$/.test(h)) return { utm_source: 'linkedin', utm_medium: 'social' };
    return { utm_source: h, utm_medium: 'referral' };
  }
  function salvar(o) { o._t = Date.now(); try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) {} }
  function ler() {
    try {
      var o = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (o && Date.now() - o._t < DIAS * 864e5) return o;
    } catch (e) {}
    return null;
  }
  var daURL = lerURL();
  if (daURL) salvar(daURL);
  else if (!ler()) { var ref = pelaReferencia(); if (ref) salvar(ref); }
  window.emOrigem = function () {
    var o = ler() || pelaReferencia() || { utm_source: 'direto', utm_medium: 'nenhum' }, c = {};
    PARAMS.forEach(function (p) { if (o[p]) c[p] = o[p]; });
    return c;
  };
  function ga(nome, params) { if (window.gtag) window.gtag('event', nome, params || {}); }
  function metaCustom(nome, params) { if (window.fbq) window.fbq('trackCustom', nome, params || {}); }
  function guardarBotao(local) { try { sessionStorage.setItem('em_botao', local); } catch (e) {} }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var sec = a.closest('section[id], header, footer');
    var local = a.getAttribute('data-local') || (sec && (sec.id || sec.tagName.toLowerCase())) || 'sem-local';
    var params = { local: local, pagina: window.location.pathname };
    if (/guiainquietos\.edsonmota\.com/.test(href)) {
      ga('click_guia_inquietos', params);
    } else if (/(^|\/)aplicar\/?($|[?#])|UylmUkGl/.test(href)) {
      guardarBotao(local); ga('click_aplicar', params); metaCustom('CliqueAplicar', params);
    } else if (/(^|\/)inquietos\/?($|[?#])|zVsElhqk/.test(href)) {
      guardarBotao(local); ga('click_inquietos', params); metaCustom('CliqueInquietos', params);
    }
  }, true);
  window.emPrepararTypeform = function (idDiv) {
    var el = document.getElementById(idDiv); if (!el) return;
    var o = window.emOrigem();
    try { o.botao = sessionStorage.getItem('em_botao') || 'entrada-direta'; } catch (e) { o.botao = 'entrada-direta'; }
    var pares = Object.keys(o).map(function (k) {
      return k + '=' + String(o[k]).replace(/[,=]/g, ' ').slice(0, 200);
    });
    el.setAttribute('data-tf-hidden', pares.join(','));
  };
  function primeiraVez(chave) {
    try { if (localStorage.getItem(chave)) return false; localStorage.setItem(chave, '1'); } catch (e) {}
    return true;
  }
  window.emIniciouAplicacao = function () {
    ga('inicio_aplicacao', { form_id: 'UylmUkGl' }); metaCustom('InicioAplicacao', { form_id: 'UylmUkGl' });
  };
  window.emEnviouAplicacao = function (p) {
    var id = (p && p.responseId) || ('semid-' + Date.now());
    if (!primeiraVez('em_env_' + id)) return;
    if (window.fbq) window.fbq('track', 'Lead', { content_name: 'aplicacao', form_id: 'UylmUkGl' }, { eventID: 'aplicacao_' + id });
    ga('generate_lead', { form_id: 'UylmUkGl', form_name: 'aplicacao', response_id: id });
  };
  window.emIniciouInquietos = function () { ga('inicio_inquietos', { form_id: 'zVsElhqk' }); };
  window.emEnviouInquietos = function (p) {
    var id = (p && p.responseId) || ('semid-' + Date.now());
    if (!primeiraVez('em_env_' + id)) return;
    if (window.fbq) window.fbq('track', 'CompleteRegistration', { content_name: 'inquietos_lista', form_id: 'zVsElhqk' }, { eventID: 'inquietos_' + id });
    ga('sign_up', { method: 'inquietos_lista', form_id: 'zVsElhqk', response_id: id });
  };
})();
