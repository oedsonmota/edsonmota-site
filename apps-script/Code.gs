/**
 * Formulários do edsonmota.com.
 * Planilha (uma aba por formulário) + e-mail.
 * A aplicação também cria um card no Notion. A lista INQUIETOS não.
 * Segredos só em Propriedades do script: NOTION_TOKEN, NOTION_DATA_SOURCE_ID.
 * SHEET_ID é opcional quando o script está ligado à planilha.
 */
var ABAS = { aplicacao: 'Aplicação', inquietos: 'INQUIETOS' };
var COLUNAS = {
  aplicacao: ['timestamp_sp', 'response_id', 'nome', 'email', 'whatsapp', 'empresa', 'site', 'papel', 'quem_decide', 'porte', 'problema', 'quando', 'investimento', 'como_chegou', 'como_chegou_outro', 'lgpd', 'botao', 'pagina', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'timestamp'],
  inquietos: ['timestamp_sp', 'response_id', 'nome', 'email', 'whatsapp', 'instagram', 'ocupacao', 'ocupacao_outro', 'experiencia', 'incomodo', 'lgpd', 'botao', 'pagina', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'timestamp']
};
var EMAIL_AVISO = 'contato.edsonmota@gmail.com';

function doGet() {
  return json({ ok: true, servico: 'edsonmota-formularios' });
}

function doPost(e) {
  try {
    var data = lerCorpo(e);
    if (!data || (data.form !== 'aplicacao' && data.form !== 'inquietos')) {
      return json({ ok: false, error: 'formulario' });
    }
    if (preenchido(data.fax) || preenchido(data.honeypot)) {
      return json({ ok: false, error: 'spam' });
    }
    var sheetOk = false;
    var emailOk = false;
    var notionOk = false;
    var sheetErro = '';
    var emailErro = '';
    var notionErro = '';
    try {
      gravarPlanilha(data);
      sheetOk = true;
    } catch (err) {
      sheetErro = String(err).slice(0, 300);
    }
    try {
      enviarEmail(data);
      emailOk = true;
    } catch (err2) {
      emailErro = String(err2).slice(0, 300);
    }
    if (data.form === 'aplicacao') {
      try {
        criarNotion(data);
        notionOk = true;
      } catch (err3) {
        notionErro = String(err3).slice(0, 300);
      }
    }
    return json({
      ok: sheetOk,
      sheet: sheetOk,
      email: emailOk,
      notion: data.form === 'aplicacao' ? notionOk : null,
      sheetErro: sheetErro,
      emailErro: emailErro,
      notionErro: notionErro
    });
  } catch (err4) {
    return json({ ok: false, error: String(err4).slice(0, 300) });
  }
}

function lerCorpo(e) {
  if (!e) return {};
  try {
    if (e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  } catch (ignora) {}
  var raw = (e.postData && e.postData.contents) ? String(e.postData.contents).trim() : '';
  if (!raw) return {};
  if (raw.charAt(0) === '{') {
    try { return JSON.parse(raw); } catch (ignora2) { return {}; }
  }
  var partes = raw.split('&');
  for (var i = 0; i < partes.length; i++) {
    var par = partes[i].split('=');
    if (decodeURIComponent(par[0] || '') === 'payload') {
      try { return JSON.parse(decodeURIComponent((par.slice(1).join('=') || '').replace(/\+/g, ' '))); } catch (ignora3) { return {}; }
    }
  }
  return {};
}

function gravarPlanilha(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = abrirPlanilha();
    try { ss.setSpreadsheetTimeZone('America/Sao_Paulo'); } catch (ignora) {}
    var nomeAba = ABAS[data.form];
    var sheet = ss.getSheetByName(nomeAba) || ss.insertSheet(nomeAba);
    var desejadas = COLUNAS[data.form];
    var headers = cabecalhos(sheet);
    if (!headers.length) {
      sheet.getRange(1, 1, 1, desejadas.length).setValues([desejadas]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, desejadas.length).setFontWeight('bold');
      headers = desejadas.slice();
    } else {
      headers = garantirColunas(sheet, headers, desejadas);
    }
    var linha = {};
    for (var chave in data) {
      if (Object.prototype.hasOwnProperty.call(data, chave)) linha[chave] = data[chave];
    }
    linha.timestamp_sp = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd HH:mm:ss');
    var valores = headers.map(function (h) { return celula(linha[h]); });
    sheet.appendRow(valores);
  } finally {
    lock.releaseLock();
  }
}

function abrirPlanilha() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(String(id).trim());
  var ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (ativa) return ativa;
  throw new Error('Nenhuma planilha. Abra o script pela planilha ou defina SHEET_ID.');
}

function cabecalhos(sheet) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) return [];
  var vals = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var ultimo = -1;
  for (var i = 0; i < vals.length; i++) if (String(vals[i] || '').trim()) ultimo = i;
  if (ultimo < 0) return [];
  var out = [];
  for (var j = 0; j <= ultimo; j++) out.push(String(vals[j] || '').trim());
  return out;
}

function garantirColunas(sheet, atuais, desejadas) {
  var headers = atuais.slice();
  desejadas.forEach(function (nome) {
    if (headers.indexOf(nome) === -1) {
      headers.push(nome);
      sheet.getRange(1, headers.length).setValue(nome).setFontWeight('bold');
    }
  });
  return headers;
}

function celula(v) {
  if (v == null) return '';
  if (Array.isArray(v)) v = v.join(', ');
  v = String(v);
  return v.length > 49000 ? v.slice(0, 49000) : v;
}

function enviarEmail(data) {
  var assunto = data.form === 'aplicacao'
    ? 'Nova aplicação: ' + (data.nome || 'sem nome')
    : 'Nova lista INQUIETOS: ' + (data.nome || 'sem nome');
  var quando = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd HH:mm:ss');
  var chaves = COLUNAS[data.form] || [];
  var linhas = chaves.map(function (k) {
    return k + ': ' + celula(k === 'timestamp_sp' ? quando : data[k]);
  });
  MailApp.sendEmail({
    to: EMAIL_AVISO,
    subject: assunto,
    body: linhas.join('\n')
  });
}

function criarNotion(data) {
  var props = PropertiesService.getScriptProperties();
  var token = String(props.getProperty('NOTION_TOKEN') || '').trim();
  var banco = String(props.getProperty('NOTION_DATA_SOURCE_ID') || '').trim();
  if (!token || !banco) throw new Error('Defina NOTION_TOKEN e NOTION_DATA_SOURCE_ID nas propriedades do script.');
  var papel = String(data.papel || '');
  if (preenchido(data.quem_decide)) papel = (papel ? papel + ' — ' : '') + 'Quem decide: ' + data.quem_decide;
  var notas = [
    'Problema: ' + (data.problema || ''),
    'Quando: ' + (data.quando || ''),
    'Porte: ' + (data.porte || ''),
    'Site: ' + (data.site || '')
  ].join('\n');
  var hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  var properties = {
    'Nome': { title: [textoNotion(data.nome || 'Sem nome')] },
    'Etapa': { select: { name: 'Novo' } },
    'Origem': { select: { name: mapearOrigem(data) } },
    'Data de entrada': { date: { start: hoje } },
    'Porta de entrada': { select: { name: 'Aplicação' } }
  };
  juntar(properties, 'Empresa', rich(data.empresa));
  juntar(properties, 'Segmento', rich(data.empresa));
  juntar(properties, 'E-mail', emailNotion(data.email));
  juntar(properties, 'WhatsApp', foneNotion(data.whatsapp));
  juntar(properties, 'utm_source', rich(data.utm_source));
  juntar(properties, 'utm_medium', rich(data.utm_medium));
  juntar(properties, 'utm_campaign', rich(data.utm_campaign));
  juntar(properties, 'Faixa de investimento', rich(data.investimento));
  juntar(properties, 'Cargo/papel na decisão', rich(papel));
  juntar(properties, 'Notas', rich(notas));
  juntar(properties, 'Typeform response ID', rich(data.response_id));
  var body = { parent: { database_id: banco }, properties: properties };
  var codigo = postarNotion(token, body);
  if (codigo >= 200 && codigo < 300) return;
  delete properties['E-mail'];
  delete properties['WhatsApp'];
  body.properties = properties;
  var deNovo = postarNotion(token, body);
  if (deNovo < 200 || deNovo >= 300) throw new Error('Notion ' + deNovo);
}

function postarNotion(token, body) {
  var res = UrlFetchApp.fetch('https://api.notion.com/v1/pages', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + token, 'Notion-Version': '2022-06-28' },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  return res.getResponseCode();
}

function juntar(obj, chave, valor) {
  if (valor) obj[chave] = valor;
}

function textoNotion(s) {
  s = String(s || '').trim();
  if (s.length > 1900) s = s.slice(0, 1900);
  return { type: 'text', text: { content: s || 'Sem nome' } };
}

function rich(s) {
  s = String(s || '').trim();
  if (!s) return null;
  if (s.length > 1900) s = s.slice(0, 1900);
  return { rich_text: [{ type: 'text', text: { content: s } }] };
}

function emailNotion(s) {
  s = String(s || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return { email: s };
}

function foneNotion(s) {
  var d = String(s || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.indexOf('55') !== 0) d = '55' + d;
  return { phone_number: '+' + d };
}

function mapearOrigem(data) {
  var como = normalizar(data.como_chegou);
  var mapa = {
    instagram: 'Instagram',
    indicacao: 'Indicação',
    google: 'Site/Typeform',
    site: 'Site/Typeform',
    anuncio: 'Anúncio',
    linkedin: 'LinkedIn',
    outro: 'Outro'
  };
  if (mapa[como]) return mapa[como];
  var src = normalizar(data.utm_source);
  var med = normalizar(data.utm_medium);
  var pago = med === 'cpc' || med === 'ppc' || med === 'paid' || med === 'ads' || med === 'paidsocial' || med === 'anuncio';
  if (pago) return 'Anúncio';
  if (src === 'instagram' || src === 'ig') return 'Instagram';
  if (src === 'linkedin') return 'LinkedIn';
  if (src === 'indicacao') return 'Indicação';
  if (src === 'google' || src === 'bing' || src === 'site' || src === 'direto' || !src) return 'Site/Typeform';
  return 'Outro';
}

function normalizar(v) {
  return String(v || '').trim().toLowerCase()
    .replace(/[áàâã]/g, 'a').replace(/[éê]/g, 'e').replace(/í/g, 'i')
    .replace(/[óôõ]/g, 'o').replace(/ú/g, 'u').replace(/ç/g, 'c');
}

function preenchido(v) { return String(v || '').trim() !== ''; }

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
