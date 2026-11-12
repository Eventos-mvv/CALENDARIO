/* Botão flutuante "Fale com a coordenação" — Eventos MVV
   Uso: <script src="chat-widget.js" defer></script>
   Opcional: data-src="https://.../atendimento.html" para apontar para outra página do chat.
   O chat abre no idioma da página (<html lang>) e, se a página marcar
   <html data-mvv-evento="id">, já começa falando daquele evento. */
(function(){
  if(window.__chatMVV) return; window.__chatMVV = true;
  var me = document.currentScript;
  var src = (me && me.getAttribute('data-src')) || new URL('atendimento.html', me ? me.src : location.href).href;
  var ROTULO = {pt:'Fale com a coordenação',en:'Talk to the events team',es:'Habla con la coordinación',fr:'Contacter la coordination',de:'Kontakt zum Team',it:'Parla con il coordinamento',ja:'運営チームに問い合わせ'};
  var FECHAR = {pt:'Fechar',en:'Close',es:'Cerrar',fr:'Fermer',de:'Schließen',it:'Chiudi',ja:'閉じる'};
  function idioma(){ var l = (document.documentElement.lang || 'pt').slice(0,2).toLowerCase(); return ROTULO[l] ? l : 'pt'; }
  var css = document.createElement('style');
  css.textContent =
    '.mvv-chat-btn{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:10px;' +
    'background:#7a1c30;color:#fff;border:0;border-radius:999px;padding:14px 20px 14px 16px;font:600 15px/1 "Libre Franklin Variable","Libre Franklin",system-ui,sans-serif;' +
    'box-shadow:0 8px 24px rgba(90,18,32,.35);cursor:pointer;transition:transform .15s}' +
    '.mvv-chat-btn:hover{transform:translateY(-2px)}' +
    '.mvv-chat-btn:focus-visible{outline:2px solid #fff;outline-offset:2px;box-shadow:0 0 0 4px #7a1c30}' +
    '.mvv-chat-btn svg{width:22px;height:22px;flex:none}' +
    '.mvv-chat-pop{position:fixed;right:20px;bottom:88px;z-index:2147483001;width:390px;height:min(640px,calc(100vh - 110px));' +
    'border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(36,26,28,.28);background:#fff;opacity:0;transform:translateY(12px) scale(.98);' +
    'pointer-events:none;transition:opacity .2s,transform .2s}' +
    '.mvv-chat-pop.on{opacity:1;transform:none;pointer-events:auto}' +
    '.mvv-chat-pop iframe{width:100%;height:100%;border:0;display:block}' +
    '@media(max-width:520px){.mvv-chat-pop{right:0;bottom:0;width:100%;height:100%;border-radius:0}' +
    '.mvv-chat-btn{right:14px;bottom:14px}.mvv-chat-btn.aberto{display:none}}';
  document.head.appendChild(css);
  var btn = document.createElement('button');
  btn.className = 'mvv-chat-btn'; btn.type = 'button';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span></span>';
  var pop = document.createElement('div'); pop.className = 'mvv-chat-pop';
  var frame = null, frameLang = '';
  function rotular(){
    var l = idioma(), aberto = pop.classList.contains('on');
    btn.querySelector('span').textContent = aberto ? FECHAR[l] : ROTULO[l];
    btn.setAttribute('aria-label', aberto ? FECHAR[l] : ROTULO[l]);
  }
  function abrir(){
    var l = idioma();
    // idioma trocado desde a última vez: começa uma conversa nova no idioma certo
    if(frame && frameLang !== l){ frame.remove(); frame = null; }
    if(!frame){
      var ev = document.documentElement.getAttribute('data-mvv-evento') || '';
      frame = document.createElement('iframe');
      frame.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'embed=1&lang=' + l + (ev ? '&ev=' + encodeURIComponent(ev) : '');
      frame.title = ROTULO[l];
      frameLang = l;
      pop.appendChild(frame);
    }
    pop.classList.add('on'); btn.classList.add('aberto'); rotular();
  }
  function fechar(){ pop.classList.remove('on'); btn.classList.remove('aberto'); rotular(); }
  btn.onclick = function(){ pop.classList.contains('on') ? fechar() : abrir(); };
  window.addEventListener('message', function(e){ if(e.data === 'fechar-chat-mvv') fechar(); });
  // acompanha a troca de idioma pelas bandeiras
  new MutationObserver(rotular).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  rotular();
  document.body.appendChild(pop); document.body.appendChild(btn);
})();
