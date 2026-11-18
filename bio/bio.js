/* Link na bio Edson Mota: monta a página a partir do conteúdo salvo no painel (/bio/admin). */
(function(){
  'use strict';
  var CFG=window.BIO_CONFIG||{}, DEF=window.BIO_DEFAULT;
  var CACHE='em-bio-cache-v1';
  var params=new URLSearchParams(location.search);
  var isPreview=params.get('preview')==='1';
  var isAdmin=false; try{isAdmin=localStorage.getItem('em-bio-admin')==='1'}catch(e){}
  var isBot=false; try{isBot=!!navigator.webdriver||/bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent|headless|lighthouse|preview/i.test(navigator.userAgent)}catch(e){}
  var noTrack=isPreview||isAdmin||isBot||params.get('notrack')==='1';
  var app=document.getElementById('app'), root=document.documentElement;
  var inquieto=false, lastJson='', first=true, dotsOn=true;

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function hl(s){return esc(s).replace(/\*([^*]+)\*/g,'<i>$1</i>')}
  function plain(s){return String(s||'').replace(/\*/g,'')}
  function nb(s){return hl(s).replace(/ (\S+)$/,'&nbsp;$1')}
  function merge(base,over){
    if(Array.isArray(base))return Array.isArray(over)?over:base;
    if(base&&typeof base==='object'){var o={};Object.keys(base).forEach(function(k){o[k]=merge(base[k],over?over[k]:undefined)});
      if(over&&typeof over==='object')Object.keys(over).forEach(function(k){if(!(k in o))o[k]=over[k]});return o}
    return over===undefined||over===null?base:over;
  }
  function brt(s){if(!s)return null;if(/[zZ]|[+-]\d\d:?\d\d$/.test(s))return new Date(s);if(s.length===16)s+=':00';if(s.length===10)s+='T00:00:00';return new Date(s+'-03:00')}
  function live(x){ /* ligado e dentro do período agendado */
    if(!x||x.active===false)return false;
    var now=new Date(),a=brt(x.start),b=brt(x.end);
    if(a&&now<a)return false; if(b&&now>=b)return false; return true;
  }
  var ARR='<svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';
  function attrs(href){return ' href="'+esc(href)+'"'+(/^https?:/i.test(href)?' target="_blank" rel="noopener"':'')}

  /* ---------- registro de visitas e cliques ---------- */
  var DEVICE=Math.min(innerWidth,screen.width||innerWidth)<700?'mobile':'desktop';
  var GEO=null; try{GEO=JSON.parse(sessionStorage.getItem('em-bio-geo')||'null')}catch(e){}
  /* região aproximada (estado e cidade) a partir da conexão; o IP não é guardado */
  var geoReady=GEO?Promise.resolve(GEO):(noTrack?Promise.resolve(null):new Promise(function(res){
    var done=false; setTimeout(function(){if(!done){done=true;res(null)}},2500);
    fetch('https://get.geojs.io/v1/ip/geo.json').then(function(r){return r.json()}).then(function(g){
      GEO={country:(g.country||'').slice(0,60)||null,region:(g.region||'').slice(0,80)||null,city:(g.city||'').slice(0,80)||null};
      try{sessionStorage.setItem('em-bio-geo',JSON.stringify(GEO))}catch(e){}
      if(!done){done=true;res(GEO)}
    }).catch(function(){if(!done){done=true;res(null)}});
  }));
  function geoFields(o){o.device=DEVICE;if(GEO){o.country=GEO.country;o.region=GEO.region;o.city=GEO.city}return o}
  function track(type,id,label){
    if(noTrack||!CFG.supabaseUrl)return;
    var ref=refOf();
    try{
      fetch(CFG.supabaseUrl+'/rest/v1/bio_events',{method:'POST',keepalive:true,
        headers:hdr(),
        body:JSON.stringify(geoFields({site_id:CFG.siteId,type:type,link_id:id||null,label:label?String(label).slice(0,120):null,ref:ref||null}))}).catch(function(){});
    }catch(e){}
  }
  function hdr(){return{apikey:CFG.supabaseKey,Authorization:'Bearer '+CFG.supabaseKey,'Content-Type':'application/json',Prefer:'return=minimal'}}
  function refOf(){
    var ref=params.get('utm_source')||params.get('ref')||'';
    if(!ref&&document.referrer){try{var h=new URL(document.referrer).hostname.replace(/^www\.|^l\.|^m\./,'');if(h&&h!==location.hostname)ref=h}catch(e){}}
    return ref.slice(0,200);
  }
  app.addEventListener('click',function(e){
    var a=e.target.closest('a[data-lid]'); if(a) track('click',a.getAttribute('data-lid'),a.getAttribute('data-label'));
  });

  /* ---------- montagem ---------- */
  function render(d){
    var j=JSON.stringify(d); if(j===lastJson)return; lastJson=j;
    var h='';
    var t=d.top||{};
    if(t.logo||t.showSwitch){
      h+='<div class="top" data-hm="topo">'+(t.logo?'<span class="logo">'+hl(t.logo)+'</span>':'<span></span>');
      if(t.showSwitch)h+='<button class="switch" id="sw" role="switch" aria-checked="false" aria-label="Alternar entre modo claro e escuro"><span class="q">'+hl(t.labelQuiet||'Quieto')+'</span><span class="iq">'+hl(t.labelLoud||'Inquieto')+'</span></button>';
      h+='</div>';
    }
    var p=d.profile||{};
    h+='<header class="id" data-hm="perfil">'+(p.showPhoto&&p.photo?'<img class="photo" src="'+esc(p.photo)+'" alt="'+esc(plain(p.name))+'">':'')+
       '<h1 class="name">'+hl(p.name)+'<span>.</span></h1>'+
       (p.role?'<p class="role">'+esc(p.role).replace(/\n/g,'<br>')+'</p>':'')+'</header>';

    var f=(d.features||[]).filter(live)[0];
    if(f){
      var lab=plain((f.small?f.small+' ':'')+f.title);
      h+='<a class="guide"'+attrs(f.href)+' data-hm="destaque:'+esc(f.id)+'" data-lid="destaque:'+esc(f.id)+'" data-label="'+esc(lab)+'">'+
        (f.image?'<img class="gimg" src="'+esc(f.image)+'" alt="">':'')+
        (f.tag?'<span class="tag">'+hl(f.tag)+'</span>':'')+
        '<h2 class="gtitle">'+(f.small?'<small>'+hl(f.small)+'</small>':'')+'<b>'+hl(f.title)+'</b></h2>'+
        (f.text?'<p class="gdesc">'+hl(f.text)+'</p>':'')+
        (f.button?'<span class="gbtn">'+hl(f.button)+ARR+'</span>':'')+'</a>';
    }

    var L=(d.links||[]).filter(live);
    if(L.length){
      h+='<nav class="list" aria-label="Links">';
      L.forEach(function(l){
        var inner='<span class="t"><strong>'+nb(l.title)+'</strong>'+(l.sub?'<em>'+nb(l.sub)+'</em>':'')+'</span>'+(l.badge?'<span class="pill">'+esc(l.badge)+'</span>':ARR);
        if(l.href) h+='<a class="row'+(l.accent?' accent':'')+'"'+attrs(l.href)+' data-hm="link:'+esc(l.id)+'" data-lid="'+esc(l.id)+'" data-label="'+esc(plain(l.title))+'">'+inner+'</a>';
        else h+='<div class="row off" data-hm="link:'+esc(l.id)+'"><span class="t"><strong>'+nb(l.title)+'</strong>'+(l.sub?'<em>'+nb(l.sub)+'</em>':'')+'</span><span class="pill">'+esc(l.badge||'Em breve')+'</span></div>';
      });
      h+='</nav>';
    }
    if(d.footer)h+='<div class="foot" data-hm="rodape">'+hl(d.footer)+'</div>';

    app.classList.toggle('noanim',!first||params.get('hm')==='1'); first=false;
    app.innerHTML=h;
    var s=d.seo||{};
    if(s.title)document.title=plain(s.title);
    var md=document.querySelector('meta[name=description]'); if(md&&s.description)md.setAttribute('content',s.description);
    dotsOn=!d.background||d.background.dots!==false;
    var sw=document.getElementById('sw');
    if(sw){sw.addEventListener('click',function(){setTheme(!inquieto);try{localStorage.setItem('modo',inquieto?'inquieto':'quieto')}catch(e){}});}
    var start=false;
    if(t.defaultMode==='inquieto')start=true;
    else if(t.defaultMode!=='quieto'){try{start=matchMedia('(prefers-color-scheme: dark)').matches}catch(e){}}
    if(t.showSwitch){try{var m=localStorage.getItem('modo');if(m)start=m==='inquieto'}catch(e){}}
    setTheme(start);
    if(isPreview){try{parent.postMessage({type:'bio-rendered'},location.origin)}catch(e){}}
  }
  function setTheme(inq){
    inquieto=inq; root.setAttribute('data-theme',inq?'dark':'light');
    var sw=document.getElementById('sw'); if(sw)sw.setAttribute('aria-checked',inq?'true':'false');
  }

  /* ---------- conteúdo ---------- */
  function readCache(){try{var c=localStorage.getItem(CACHE);return c?JSON.parse(c):null}catch(e){return null}}
  function fetchContent(){
    if(!CFG.supabaseUrl)return Promise.resolve(null);
    var ctl=window.AbortController?new AbortController():null; if(ctl)setTimeout(function(){ctl.abort()},6000);
    return fetch(CFG.supabaseUrl+'/rest/v1/bio_site?id=eq.'+encodeURIComponent(CFG.siteId)+'&select=data',{
      headers:{apikey:CFG.supabaseKey,Authorization:'Bearer '+CFG.supabaseKey},cache:'no-store',signal:ctl?ctl.signal:undefined
    }).then(function(r){return r.ok?r.json():null}).then(function(a){return a&&a[0]?a[0].data:null}).catch(function(){return null});
  }

  if(isPreview){
    window.addEventListener('message',function(e){ if(e.origin===location.origin&&e.data&&e.data.type==='bio-preview'){lastJson='';render(merge(DEF,e.data.data))} });
    try{parent.postMessage({type:'bio-preview-ready'},location.origin)}catch(e){}
  }
  var cached=readCache();
  if(cached&&!isPreview)render(merge(DEF,cached));
  fetchContent().then(function(data){
    if(data){try{localStorage.setItem(CACHE,JSON.stringify(data))}catch(e){}}
    if(!isPreview||!lastJson)render(merge(DEF,data||cached||{}));
  });
  if(!noTrack){try{if(!sessionStorage.getItem('em-bio-v')){sessionStorage.setItem('em-bio-v','1');geoReady.then(function(){track('view')})}}catch(e){track('view')}}

  /* ---------- comportamento: cliques com posição, tempo por bloco e rolagem (anônimo) ---------- */
  if(!noTrack&&CFG.supabaseUrl&&window.fetch){
    var vid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g,function(){return(Math.random()*16|0).toString(16)});
    var part=0, B=newBucket(), lastTick=Date.now(), recent=[];
    var device=DEVICE;
    function newBucket(){return{t0:Date.now(),ms:0,max:0,seen:{},dwell:{},clicks:[]}}
    function r3(n){return Math.round(n*1000)/1000}
    function tick(){
      var now=Date.now(),dt=Math.min(now-lastTick,2000);lastTick=now;
      if(document.visibilityState!=='visible')return;
      B.ms+=dt;
      var docH=Math.max(document.documentElement.scrollHeight,1),vh=innerHeight;
      var hasBlocks=app.querySelector('[data-hm]'); if(hasBlocks&&docH>vh*1.1){var pct=Math.min(100,Math.round((scrollY+vh)/docH*100)); if(pct>B.max)B.max=pct}else if(hasBlocks&&B.max<100){B.max=100}
      var els=app.querySelectorAll('[data-hm]');
      for(var i=0;i<els.length;i++){var r=els[i].getBoundingClientRect(),vis=Math.min(r.bottom,vh)-Math.max(r.top,0);
        if(vis<=0)continue; var need=Math.min(r.height,vh)*0.5;
        if(vis>=need){var k=els[i].getAttribute('data-hm');B.seen[k]=1;B.dwell[k]=(B.dwell[k]||0)+dt}}
    }
    setInterval(tick,500);
    document.addEventListener('click',function(e){
      if(B.clicks.length>=150)return;
      var t=e.target.closest?e.target.closest('[data-hm]'):null, k='pagina', rx, ry, box;
      if(t&&app.contains(t)){k=t.getAttribute('data-hm');box=t.getBoundingClientRect()}else{box=app.getBoundingClientRect()}
      rx=(e.clientX-box.left)/(box.width||1); ry=(e.clientY-box.top)/(box.height||1);
      var c={k:k,x:r3(rx),y:r3(ry)};
      if(!(e.target.closest&&e.target.closest('a,button')))c.d=1;
      var now=Date.now(); recent=recent.filter(function(p){return now-p.t<900&&Math.abs(p.cx-e.clientX)<32&&Math.abs(p.cy-e.clientY)<32});
      recent.push({t:now,cx:e.clientX,cy:e.clientY}); if(recent.length>=3)c.r=1;
      B.clicks.push(c);
    },true);
    function flush(){
      tick();
      if(B.ms<400&&!B.clicks.length)return;
      var dw={};Object.keys(B.dwell).forEach(function(k){dw[k]=B.dwell[k]});
      var body=JSON.stringify({id:vid,part:part,site_id:CFG.siteId,device:device,vw:innerWidth,dur_ms:Math.min(B.ms,3600000),max_pct:B.max,
        seen:Object.keys(B.seen).slice(0,60),dwell:dw,clicks:B.clicks,ref:refOf()||null,country:GEO?GEO.country:null,region:GEO?GEO.region:null,city:GEO?GEO.city:null});
      part++; B=newBucket();
      if(part>50)return;
      try{fetch(CFG.supabaseUrl+'/rest/v1/bio_visits',{method:'POST',keepalive:true,headers:hdr(),body:body}).catch(function(){})}catch(e){}
    }
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flush();else lastTick=Date.now()});
    addEventListener('pagehide',flush);
  }

  /* ---------- fundo: grade de pontos que foge do dedo/cursor ---------- */
  var c=document.getElementById('bg'),ctx=c.getContext('2d');
  var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  var dots=[],W=0,H=0,dpr=1,GAP=26,R=110,px=-9999,py=-9999,tt=0;
  function build(){dpr=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);dots=[];
    for(var y=GAP/2;y<H+GAP;y+=GAP)for(var x=GAP/2;x<W+GAP;x+=GAP)dots.push({ox:x,oy:y,x:x,y:y,ph:Math.random()*6.28})}
  function move(e){var q=e.touches?e.touches[0]:e;px=q.clientX;py=q.clientY}
  function leave(){px=-9999;py=-9999}
  addEventListener('pointermove',move,{passive:true});addEventListener('touchmove',move,{passive:true});addEventListener('pointerdown',move,{passive:true});
  addEventListener('pointerleave',leave);addEventListener('touchend',function(){setTimeout(leave,600)});addEventListener('resize',build);
  function frame(){
    tt+=0.016;ctx.clearRect(0,0,W,H);
    if(dotsOn){
      var base=inquieto?'rgba(254,247,234,':'rgba(10,10,10,';
      for(var i=0;i<dots.length;i++){var d=dots[i],tx=d.ox,ty=d.oy;
        if(inquieto&&!reduce){tx+=Math.sin(tt*1.7+d.ph)*2.2;ty+=Math.cos(tt*1.3+d.ph*1.4)*2.2}
        var dx=d.ox-px,dy=d.oy-py,dist=Math.sqrt(dx*dx+dy*dy),near=0;
        if(dist<R){near=1-dist/R;var push=near*near*34;tx+=dx/(dist||1)*push;ty+=dy/(dist||1)*push}
        d.x+=(tx-d.x)*(reduce?1:0.12);d.y+=(ty-d.y)*(reduce?1:0.12);
        if(near>0.05){ctx.fillStyle='rgba(244,50,23,'+(0.25+near*0.6)+')';ctx.beginPath();ctx.arc(d.x,d.y,1.2+near*1.6,0,6.283);ctx.fill()}
        else{ctx.fillStyle=base+(inquieto?0.16:0.13)+')';ctx.fillRect(d.x-0.9,d.y-0.9,1.8,1.8)}}
    }
    requestAnimationFrame(frame);
  }
  build();frame();
})();
