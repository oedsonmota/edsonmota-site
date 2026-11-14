/* Formulário de aplicação em pop-up, em 3 etapas.
   As respostas vão para a planilha do Google (Apps Script), que avisa o Edson por e-mail. */
(function(){
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxFaDvb_uSU7U50gtYZiBI9oktDc3abP5r8z6Ag4dJuvlIrZEGHet_M-Tx8_7H_5-TW/exec';
  var SETA = '<span class="seta" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8h10.5M8.5 3.5L13 8l-4.5 4.5"/></svg></span>';

  function opcoes(nome, itens){
    return '<div class="apl-opcoes" role="radiogroup">' + itens.map(function(t){
      return '<label><input type="radio" name="'+nome+'" value="'+t+'"><span>'+t+'</span></label>';
    }).join('') + '</div>';
  }

  var html =
  '<div class="apl" id="aplicar" role="dialog" aria-modal="true" aria-labelledby="apl-titulo" hidden>'+
   '<div class="apl-fundo" data-fechar></div>'+
   '<div class="apl-caixa">'+
    '<button class="apl-fechar" type="button" aria-label="Fechar" data-fechar>×</button>'+
    '<div class="apl-topo"><span class="apl-passo">Etapa <b>1</b> de 3</span><div class="apl-barra"><i></i></div></div>'+
    '<form novalidate>'+
     '<div class="apl-hp" aria-hidden="true"><label>Não preencha<input type="text" name="site_hp" tabindex="-1" autocomplete="off"></label></div>'+

     '<section class="apl-etapa ativa" data-etapa="1">'+
      '<h3 id="apl-titulo">Vamos começar <span class="dim">por você.</span></h3>'+
      '<p class="apl-sub">Leva uns dois minutos. Eu leio cada aplicação pessoalmente.</p>'+
      '<div class="apl-campo"><label for="apl-nome">Seu nome</label><input id="apl-nome" name="nome" autocomplete="name" required><span class="apl-msg">Me diz seu nome.</span></div>'+
      '<div class="apl-campo"><label for="apl-email">E-mail</label><input id="apl-email" name="email" type="email" autocomplete="email" required><span class="apl-msg">Confere o e-mail.</span></div>'+
      '<div class="apl-campo"><label for="apl-whats">WhatsApp</label><input id="apl-whats" name="whatsapp" type="tel" autocomplete="tel" placeholder="(00) 00000-0000" required><span class="apl-msg">Deixa um número para eu te chamar.</span></div>'+
     '</section>'+

     '<section class="apl-etapa" data-etapa="2">'+
      '<h3>Agora, <span class="dim">o seu negócio.</span></h3>'+
      '<p class="apl-sub">Assim eu chego na conversa já sabendo onde você está.</p>'+
      '<div class="apl-campo"><label for="apl-empresa">Nome do negócio</label><input id="apl-empresa" name="empresa" required><span class="apl-msg">Qual é o nome do negócio?</span></div>'+
      '<div class="apl-campo"><label for="apl-link">Instagram ou site</label><input id="apl-link" name="link" placeholder="@seunegocio"></div>'+
      '<div class="apl-campo"><label for="apl-segmento">O que o negócio faz?</label><input id="apl-segmento" name="segmento" placeholder="Ex.: escritório de arquitetura, clínica, consultoria" required><span class="apl-msg">Me conta em poucas palavras.</span></div>'+
      '<div class="apl-campo" data-radio="equipe"><span class="apl-perg">Quantas pessoas trabalham com você?</span>'+opcoes('equipe',['Só eu','2 a 5','6 a 15','Mais de 15'])+'<span class="apl-msg">Escolhe uma opção.</span></div>'+
      '<div class="apl-campo" data-radio="faturamento"><span class="apl-perg">Faturamento anual aproximado</span>'+opcoes('faturamento',['Até R$ 360 mil','R$ 360 mil a R$ 1 mi','Acima de R$ 1 mi','Prefiro não dizer'])+'<span class="apl-msg">Escolhe uma opção.</span></div>'+
     '</section>'+

     '<section class="apl-etapa" data-etapa="3">'+
      '<h3>E o momento <span class="dim">de agora.</span></h3>'+
      '<p class="apl-sub">É aqui que eu entendo qual problema a marca precisa resolver.</p>'+
      '<div class="apl-campo"><label for="apl-trava">O que mais está travando o negócio hoje?</label><textarea id="apl-trava" name="desafio" required></textarea><span class="apl-msg">Escreve com as suas palavras, do jeito que vier.</span></div>'+
      '<div class="apl-campo" data-radio="quando"><span class="apl-perg">Quando você quer começar?</span>'+opcoes('quando',['Agora','Nos próximos 3 meses','Ainda estou pesquisando'])+'<span class="apl-msg">Escolhe uma opção.</span></div>'+
     '</section>'+

     '<section class="apl-etapa apl-fim" data-etapa="4">'+
      '<div class="apl-ok"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg></div>'+
      '<h3>Recebi. <span class="dim">Obrigado.</span></h3>'+
      '<p class="apl-sub">Eu leio a sua aplicação e te chamo no WhatsApp em até dois dias úteis.</p>'+
      '<button class="btn btn-preto" type="button" data-fechar>Voltar ao site</button>'+
     '</section>'+

     '<div class="apl-acoes"><button class="apl-voltar" type="button" hidden>← Voltar</button><button class="btn btn-laranja apl-seguir" type="submit">Continuar '+SETA+'</button></div>'+
    '</form>'+
   '</div>'+
  '</div>';

  document.body.insertAdjacentHTML('beforeend', html);
  var box = document.getElementById('aplicar');
  var form = box.querySelector('form');
  var etapas = box.querySelectorAll('.apl-etapa');
  var voltar = box.querySelector('.apl-voltar');
  var seguir = box.querySelector('.apl-seguir');
  var acoes = box.querySelector('.apl-acoes');
  var topo = box.querySelector('.apl-topo');
  var atual = 1, ultimoFoco = null;

  function mostra(n){
    atual = n;
    etapas.forEach(function(e){ e.classList.toggle('ativa', +e.dataset.etapa === n); });
    box.querySelector('.apl-passo b').textContent = Math.min(n,3);
    box.querySelector('.apl-barra i').style.width = (Math.min(n,3)/3*100)+'%';
    voltar.hidden = n === 1;
    seguir.innerHTML = (n === 3 ? 'Enviar aplicação ' : 'Continuar ') + SETA;
    var fim = n === 4; acoes.hidden = fim; topo.hidden = fim;
    var alvo = box.querySelector('.apl-etapa.ativa input:not([type=radio]), .apl-etapa.ativa textarea, .apl-etapa.ativa button');
    if (alvo) setTimeout(function(){ alvo.focus(); }, 60);
    box.querySelector('.apl-caixa').scrollTop = 0;
  }

  function valida(n){
    var ok = true, sec = box.querySelector('[data-etapa="'+n+'"]');
    sec.querySelectorAll('.apl-campo').forEach(function(c){
      var bom = true, inp = c.querySelector('input:not([type=radio]), textarea');
      if (c.dataset.radio) bom = !!sec.querySelector('input[name="'+c.dataset.radio+'"]:checked');
      else if (inp && inp.required) {
        var v = inp.value.trim();
        bom = v.length > 1 && (inp.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) && (inp.type !== 'tel' || v.replace(/\D/g,'').length >= 10);
      }
      c.classList.toggle('erro', !bom); if (!bom) ok = false;
    });
    return ok;
  }

  function abre(e){
    if (e) e.preventDefault();
    ultimoFoco = document.activeElement;
    box.hidden = false; box.classList.add('aberto'); document.body.classList.add('apl-trava');
    if (atual === 4) { form.reset(); mostra(1); } else mostra(atual);
  }
  function fecha(){
    box.classList.remove('aberto'); box.hidden = true; document.body.classList.remove('apl-trava');
    if (ultimoFoco) ultimoFoco.focus();
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest('[data-aplicar], a[href="#aplicar"]');
    if (a) return abre(e);
    if (e.target.closest('[data-fechar]') && box.contains(e.target)) fecha();
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && box.classList.contains('aberto')) fecha(); });
  if (location.hash === '#aplicar') abre();

  voltar.addEventListener('click', function(){ mostra(atual - 1); });
  box.addEventListener('change', function(e){ var c = e.target.closest('.apl-campo'); if (c) c.classList.remove('erro'); });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!valida(atual)) return;
    if (atual < 3) return mostra(atual + 1);
    if (form.site_hp.value) return mostra(4);
    var dados = new FormData(form); dados.delete('site_hp');
    dados.append('origem', location.pathname.indexOf('projetos') > -1 ? 'Página de projetos' : 'Home');
    seguir.disabled = true; seguir.innerHTML = 'Enviando…';
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(dados) })
      .then(function(){ seguir.disabled = false; mostra(4); })
      .catch(function(){ seguir.disabled = false; seguir.innerHTML = 'Tentar de novo ' + SETA; });
  });
})();
