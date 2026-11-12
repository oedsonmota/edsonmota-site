/* formulario.js · edsonmota.com
   Formulários nativos de /aplicar/ e /inquietos/. */
(function () {
  function todos(sel, raiz) { return [].slice.call((raiz || document).querySelectorAll(sel)); }
  function visivel(el, form) {
    var n = el;
    while (n && n !== form) {
      if (n.hidden) return false;
      n = n.parentElement;
    }
    return true;
  }
  function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function telefoneValido(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.indexOf('55') === 0 && (d.length === 12 || d.length === 13)) d = d.slice(2);
    if (d.length !== 10 && d.length !== 11) return false;
    var ddd = parseInt(d.slice(0, 2), 10);
    return ddd >= 11 && ddd <= 99;
  }
  function novoId() {
    if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return 'semid-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
  function endpointOk() {
    return /^https?:\/\/\S+$/.test(String(window.FORM_ENDPOINT || ''));
  }
  function limpar(box) {
    todos('input, textarea', box).forEach(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else el.value = '';
    });
  }

  function iniciar(form) {
    var nomeForm = form.getAttribute('data-em-form');
    var redirect = form.getAttribute('data-em-redirect') || '';
    var passos = todos('[data-step]', form);
    var i = 0;
    var enviando = false;
    var responseId = '';
    var h1 = form.querySelector('[data-pergunta]');
    var dica = form.querySelector('[data-dica]');
    var contador = form.querySelector('[data-contador]');
    var erroEl = form.querySelector('[data-erro]');
    var seguir = form.querySelector('[data-seguir]');
    var voltar = form.querySelector('[data-voltar]');

    function mensagem(texto) {
      if (!texto) { erroEl.hidden = true; erroEl.textContent = ''; return; }
      erroEl.hidden = false;
      erroEl.textContent = texto;
    }
    function primeiroNome() {
      var el = form.querySelector('[name="nome"]');
      var nome = el ? el.value.trim() : '';
      return nome ? nome.split(/\s+/)[0] : '';
    }
    function pintar() {
      todos('.form-opcao', form).forEach(function (label) {
        var input = label.querySelector('input');
        label.classList.toggle('escolhida', !!(input && input.checked));
      });
    }
    function condicionais() {
      todos('[data-condicional]', form).forEach(function (box) {
        var marcado = form.querySelector('input[name="' + box.getAttribute('data-condicional') + '"]:checked');
        var mostra = !!(marcado && marcado.value === box.getAttribute('data-valor'));
        var estava = !box.hidden;
        box.hidden = !mostra;
        if (estava && !mostra) limpar(box);
      });
      todos('[data-outro-de]', form).forEach(function (box) {
        var chk = document.getElementById(box.getAttribute('data-outro-de'));
        var mostra = !!(chk && chk.checked);
        var estava = !box.hidden;
        box.hidden = !mostra;
        if (estava && !mostra) limpar(box);
      });
      pintar();
    }
    function mostrar(n, focar) {
      i = n;
      passos.forEach(function (p, idx) { p.hidden = idx !== i; });
      var atual = passos[i];
      var titulo = atual.getAttribute('data-titulo') || '';
      if (atual.hasAttribute('data-titulo-nome')) {
        var pn = primeiroNome();
        if (pn) titulo = 'Qual seu melhor e-mail, ' + pn + '?';
      }
      h1.textContent = titulo;
      var texto = atual.getAttribute('data-dica') || '';
      dica.hidden = !texto;
      dica.textContent = texto;
      var ultimo = i === passos.length - 1;
      var inicio = i === 0;
      voltar.hidden = inicio;
      seguir.textContent = ultimo ? (form.getAttribute('data-fim') || 'Enviar') : (inicio ? (form.getAttribute('data-inicio') || 'Começar') : 'Continuar');
      seguir.classList.toggle('btn-laranja', ultimo);
      seguir.classList.toggle('btn-preto', !ultimo);
      if (inicio) { contador.hidden = true; }
      else { contador.hidden = false; contador.textContent = i + ' / ' + (passos.length - 1); }
      mensagem('');
      condicionais();
      todos('input, textarea', atual).forEach(function (el) {
        if (el.type === 'hidden' || el.closest('label')) return;
        if (el.id && form.querySelector('label[for="' + el.id + '"]')) return;
        el.setAttribute('aria-labelledby', 'pergunta');
      });
      if (focar) {
        var foco = atual.querySelector('input, textarea');
        if (foco && visivel(foco, form)) foco.focus();
        else h1.focus();
      }
    }
    function validar() {
      var passo = passos[i];
      if (passo.hasAttribute('data-boas-vindas')) return true;
      var grupo = passo.getAttribute('data-grupo');
      if (grupo) {
        var marcados = todos('input[name="' + grupo + '"]:checked', passo).filter(function (el) { return visivel(el, form); });
        if (!marcados.length) {
          mensagem(passo.getAttribute('data-grupo-erro') || 'Escolha pelo menos uma opção.');
          return false;
        }
      }
      var radios = {};
      todos('input[type="radio"]', passo).forEach(function (el) {
        if (visivel(el, form)) radios[el.name] = true;
      });
      for (var nome in radios) {
        if (!form.querySelector('input[name="' + nome + '"]:checked')) {
          mensagem('Escolha uma opção.');
          return false;
        }
      }
      var campos = todos('input, textarea', passo);
      for (var k = 0; k < campos.length; k++) {
        var el = campos[k];
        if (!visivel(el, form)) continue;
        if (el.type === 'radio' || el.type === 'hidden' || el.name === 'fax') continue;
        if (el.type === 'checkbox') {
          if (el.required && !el.checked) {
            mensagem(el.getAttribute('data-erro-vazio') || 'Marque esta opção para continuar.');
            el.focus();
            return false;
          }
          continue;
        }
        var v = (el.value || '').trim();
        if (el.required && !v) {
          mensagem(el.getAttribute('data-erro-vazio') || 'Preencha este campo.');
          el.focus();
          return false;
        }
        if (v && el.getAttribute('data-tipo') === 'email' && !emailValido(v)) {
          mensagem('Esse e-mail não parece válido.');
          el.focus();
          return false;
        }
        if (v && el.getAttribute('data-tipo') === 'telefone' && !telefoneValido(v)) {
          mensagem(el.getAttribute('data-erro-telefone') || 'Informe um WhatsApp com DDD. Ex.: (11) 99999-9999.');
          el.focus();
          return false;
        }
      }
      mensagem('');
      return true;
    }
    function ocultos(id) {
      var o = window.emOrigem ? window.emOrigem() : {};
      var botao = 'entrada-direta';
      try { botao = sessionStorage.getItem('em_botao') || botao; } catch (e) {}
      return {
        form: nomeForm,
        response_id: id,
        pagina: location.pathname,
        timestamp: new Date().toISOString(),
        botao: botao,
        utm_source: o.utm_source || '',
        utm_medium: o.utm_medium || '',
        utm_campaign: o.utm_campaign || '',
        utm_content: o.utm_content || '',
        utm_term: o.utm_term || '',
        fbclid: o.fbclid || '',
        gclid: o.gclid || ''
      };
    }
    function aplicarOcultos(mapa) {
      Object.keys(mapa).forEach(function (k) {
        var input = form.querySelector('input[type="hidden"][name="' + k + '"]');
        if (input) input.value = mapa[k] == null ? '' : String(mapa[k]);
      });
    }
    function coletar(id) {
      var data = ocultos(id);
      todos('input, textarea', form).forEach(function (el) {
        if (!el.name || el.name === 'fax' || el.type === 'hidden') return;
        if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; return; }
        if (el.type === 'checkbox') {
          if (el.name === 'lgpd') { data.lgpd = el.checked ? 'sim' : ''; return; }
          if (!data[el.name]) data[el.name] = [];
          if (el.checked) data[el.name].push(el.value);
          return;
        }
        data[el.name] = (el.value || '').trim();
      });
      if (Array.isArray(data.ocupacao)) data.ocupacao = data.ocupacao.join(', ');
      var hp = form.querySelector('[name="fax"]');
      data.fax = hp ? hp.value.trim() : '';
      aplicarOcultos(data);
      return data;
    }
    function concluir(data) {
      var titulo = form.getAttribute('data-sucesso-titulo') || 'Pronto.';
      var texto = form.getAttribute('data-sucesso-texto') || '';
      if (nomeForm === 'inquietos') {
        var pn = primeiroNome();
        titulo = pn ? ('Pronto, ' + pn + '. Você está na lista.') : 'Pronto. Você está na lista.';
      }
      h1.textContent = titulo;
      dica.hidden = !texto;
      dica.textContent = texto;
      form.querySelector('.passos').hidden = true;
      form.querySelector('.form-acoes').hidden = true;
      if (contador) contador.hidden = true;
      mensagem('');
      h1.focus();
      if (redirect) window.setTimeout(function () { window.location.href = redirect; }, 900);
    }
    function enviar() {
      if (enviando) return;
      if (!validar()) return;
      if (!responseId) responseId = novoId();
      var data = coletar(responseId);
      if (data.fax) { concluir(data); return; }
      if (!endpointOk()) {
        mensagem('O envio ainda não está ligado. Falta colar o endereço do formulário no site.');
        return;
      }
      enviando = true;
      var rotulo = seguir.textContent;
      seguir.disabled = true;
      seguir.textContent = 'Enviando…';
      var corpo = new URLSearchParams();
      corpo.set('payload', JSON.stringify(data));
      fetch(window.FORM_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: corpo.toString()
      }).then(function () {
        if (nomeForm === 'aplicacao' && window.emEnviouAplicacao) window.emEnviouAplicacao({ responseId: data.response_id });
        if (nomeForm === 'inquietos' && window.emEnviouInquietos) window.emEnviouInquietos({ responseId: data.response_id });
        concluir(data);
      }).catch(function () {
        enviando = false;
        seguir.disabled = false;
        seguir.textContent = rotulo;
        mensagem('Não consegui enviar agora. Tente de novo em instantes.');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (i === passos.length - 1) enviar();
      else if (validar()) mostrar(i + 1, true);
    });
    voltar.addEventListener('click', function () {
      if (i > 0) mostrar(i - 1, true);
    });
    form.addEventListener('change', function (e) {
      if (!e.target) return;
      if (e.target.type === 'radio' || e.target.type === 'checkbox') condicionais();
    });
    form.addEventListener('focusin', function (e) {
      var t = e.target;
      if (!t || !t.matches || !t.matches('input, textarea, select')) return;
      if (t.name === 'fax') return;
      if (nomeForm === 'aplicacao' && window.emIniciouAplicacao) window.emIniciouAplicacao();
      if (nomeForm === 'inquietos' && window.emIniciouInquietos) window.emIniciouInquietos();
    });
    mostrar(0, false);
  }

  document.querySelectorAll('form[data-em-form]').forEach(iniciar);
})();
