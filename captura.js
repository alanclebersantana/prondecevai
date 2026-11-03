// Pronde cê vai? — seleção e captura do voo na página do programa
(() => {
  if (window.__dcnpCaptura) { window.__dcnpCaptura.iniciar(); return; }

  const PROGS = { smiles: 'Smiles', latam: 'LATAM Pass', azul: 'Azul Fidelidade' };
  const CORES = { smiles: '#F26B1D', latam: '#C8104E', azul: '#1B4AA0' };
  const detectar = () => {
    const h = location.hostname;
    if (h.includes('smiles')) return 'smiles';
    if (h.includes('latam')) return 'latam';
    if (h.includes('azul')) return 'azul';
    return '';
  };
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const quadro = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  /* ---------- interface (shadow DOM, não mexe no site) ---------- */
  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
  <style>
    *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
    [hidden]{display:none!important}
    .caixa{position:fixed;border:3px solid #FF7A2E;background:rgba(255,122,46,.12);border-radius:8px;pointer-events:none;transition:all .06s}
    .barra{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#0E3B7A;color:#fff;padding:10px 14px;border-radius:12px;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.35);pointer-events:auto;display:flex;gap:12px;align-items:center;max-width:94vw}
    .barra b{font-weight:700}
    .barra kbd{background:rgba(255,255,255,.18);border-radius:5px;padding:1px 6px;font-size:12px}
    .barra button{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:13px}
    .painel{position:fixed;right:16px;top:16px;width:380px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#13233F;border-radius:16px;box-shadow:0 24px 60px rgba(9,32,70,.45);pointer-events:auto;font-size:14px}
    .cab{padding:12px 16px;color:#fff;font-weight:800;display:flex;justify-content:space-between;align-items:center;border-radius:16px 16px 0 0}
    .cab button{background:none;border:0;color:#fff;font-size:18px;cursor:pointer}
    .corpo{padding:14px 16px 16px;display:grid;gap:10px}
    .corpo img{width:100%;border-radius:8px;border:1px solid #DCE4EE;max-height:220px;object-fit:contain;background:#F4F7FB}
    label{font-size:12px;font-weight:600;color:#55657F;display:grid;gap:4px}
    input,select{height:36px;border:1.5px solid #DCE4EE;border-radius:8px;padding:0 10px;font-size:14px;color:#13233F;width:100%;background:#fff}
    input:focus,select:focus{outline:none;border-color:#2F78C4}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .seg{display:flex;gap:6px}
    .seg button{flex:1;height:38px;border-radius:9px;border:1.5px solid #DCE4EE;background:#fff;font-weight:700;color:#0E3B7A;cursor:pointer}
    .seg button.on{background:#0E3B7A;border-color:#0E3B7A;color:#fff}
    .acoes{display:flex;gap:8px;margin-top:4px}
    .acoes button{flex:1;height:42px;border-radius:10px;border:1.5px solid #DCE4EE;background:#fff;font-weight:700;color:#0E3B7A;cursor:pointer}
    .acoes .pri{background:#FF7A2E;border-color:#FF7A2E;color:#fff}
    .nota{font-size:12px;color:#55657F;margin:0}
    .ok{text-align:center;padding:26px 16px;font-weight:700;color:#1E8E5A;font-size:16px}
  </style>
  <div class="caixa" hidden></div>
  <div class="barra" hidden><span>Clique no <b>voo escolhido</b>. <kbd>↑</kbd> pega a caixa maior, <kbd>↓</kbd> a menor, <kbd>Esc</kbd> cancela.</span><button type="button" data-x="cancelar">Cancelar</button></div>
  <div class="painel" hidden></div>`;
  document.documentElement.appendChild(host);
  const caixa = root.querySelector('.caixa'), barra = root.querySelector('.barra'), painel = root.querySelector('.painel');
  barra.querySelector('[data-x="cancelar"]').addEventListener('click', () => sairModo());

  let alvo = null, pilha = [], modo = false, ultimaCaptura = null;

  function marcar(el) {
    alvo = el;
    if (!el) { caixa.hidden = true; return; }
    const r = el.getBoundingClientRect();
    Object.assign(caixa.style, { left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' });
    caixa.hidden = false;
  }
  function aoMover(e) {
    if (!modo) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === host || el === document.documentElement || el === document.body) return;
    if (alvo && alvo.contains(el)) return;          // ainda dentro da caixa escolhida (↑ não se perde)
    if (pilha[0] !== el) { pilha = [el]; marcar(el); }
  }
  function aoTecla(e) {
    if (!modo) return;
    if (e.key === 'Escape') { e.preventDefault(); sairModo(); }
    if (e.key === 'ArrowUp' && alvo && alvo.parentElement && alvo.parentElement !== document.body) {
      e.preventDefault(); pilha.unshift(alvo.parentElement); marcar(alvo.parentElement);
    }
    if (e.key === 'ArrowDown' && pilha.length > 1) { e.preventDefault(); pilha.shift(); marcar(pilha[0]); }
  }
  function aoClicar(e) {
    if (!modo) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (alvo) capturar(alvo);
  }
  const bloquear = (e) => { if (modo) { e.preventDefault(); e.stopPropagation(); } };

  function entrarModo() {
    painel.hidden = true; modo = true; barra.hidden = false;
    window.addEventListener('mousemove', aoMover, true);
    window.addEventListener('keydown', aoTecla, true);
    window.addEventListener('click', aoClicar, true);
    window.addEventListener('mousedown', bloquear, true);
    window.addEventListener('mouseup', bloquear, true);
  }
  function sairModo() {
    modo = false; barra.hidden = true; caixa.hidden = true; alvo = null; pilha = [];
    window.removeEventListener('mousemove', aoMover, true);
    window.removeEventListener('keydown', aoTecla, true);
    window.removeEventListener('click', aoClicar, true);
    window.removeEventListener('mousedown', bloquear, true);
    window.removeEventListener('mouseup', bloquear, true);
  }

  /* ---------- captura ---------- */
  async function capturar(el) {
    sairModo();
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    await dormir(400);
    host.style.display = 'none';
    await quadro();
    const r = el.getBoundingClientRect();
    const resp = await chrome.runtime.sendMessage({ tipo: 'capturar' });
    host.style.display = '';
    if (!resp || !resp.ok) { mostrarErro('Não consegui tirar o print desta página. Recarregue a página e tente de novo.'); return; }
    const img = await carregar(resp.imagem);
    const esc = img.width / window.innerWidth, m = 8;
    const x = Math.max(0, r.left - m), y = Math.max(0, r.top - m);
    const w = Math.min(window.innerWidth, r.right + m) - x, h = Math.min(window.innerHeight, r.bottom + m) - y;
    const sw = Math.round(w * esc), sh = Math.round(h * esc);
    const red = Math.min(1, 1200 / sw);
    const c = document.createElement('canvas'); c.width = Math.round(sw * red); c.height = Math.round(sh * red);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, Math.round(x * esc), Math.round(y * esc), sw, sh, 0, 0, c.width, c.height);
    const print = c.toDataURL('image/jpeg', 0.85);
    mostrarFormulario(print, ler(el.innerText || ''));
  }
  const carregar = (src) => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });

  /* ---------- leitura dos dados no texto do voo ---------- */
  function ler(txt) {
    const t = txt.replace(/ /g, ' ');
    const horas = [...t.matchAll(/\b([01]?\d|2[0-3])\s?[:h]\s?([0-5]\d)\b/g)].map((m) => m[1].padStart(2, '0') + ':' + m[2]);
    const voo = (t.match(/\b(G3|LA|JJ|AD|AA|CM|AR|TP|UX|AF|KL|DL|UA|AV|IB|EK|QR|TK|LH|AM|H2|2Z|O6)\s?-?\s?(\d{2,4})\b/i) || []);
    // milhas: número seguido de milhas/pontos/pts; se não houver, o maior número ≥ 1.000
    let milhas = '';
    const comRotulo = [...t.matchAll(/(\d{1,3}(?:[.\s]\d{3})+|\d{4,})\s*(?:milhas|pontos|pts|mil(?:has)?\b)/gi)].map((m) => +m[1].replace(/[.\s]/g, ''));
    if (comRotulo.length) milhas = Math.max(...comRotulo);
    else {
      const nums = [...t.matchAll(/\b(\d{1,3}(?:\.\d{3})+)\b/g)].map((m) => +m[1].replace(/\./g, '')).filter((v) => v >= 1000);
      if (nums.length) milhas = Math.max(...nums);
    }
    const taxa = t.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/);
    return {
      voo: voo[0] ? (voo[1].toUpperCase() + ' ' + voo[2]) : '',
      saida: horas[0] || '', chegada: horas[1] || '',
      milhas: milhas ? String(milhas) : '',
      taxas: taxa ? taxa[1].replace(/\./g, '').replace(',', '.') : ''
    };
  }

  /* ---------- confirmação ---------- */
  let trecho = 'ida';
  function mostrarFormulario(print, d) {
    ultimaCaptura = print;
    const prog = detectar();
    painel.innerHTML = `
      <div class="cab" style="background:${CORES[prog] || '#0E3B7A'}"><span>Captura do voo</span><button type="button" data-x="fechar" aria-label="Fechar">✕</button></div>
      <div class="corpo">
        <img alt="Print do voo" src="${print}">
        <label>Programa
          <select data-c="programa">${Object.entries(PROGS).map(([k, v]) => `<option value="${k}" ${k === prog ? 'selected' : ''}>${v}</option>`).join('')}</select>
        </label>
        <div class="seg"><button type="button" data-t="ida" class="${trecho === 'ida' ? 'on' : ''}">Ida</button><button type="button" data-t="volta" class="${trecho === 'volta' ? 'on' : ''}">Volta</button></div>
        <label>Voo<input data-c="voo" value="${d.voo}" placeholder="G3 1234"></label>
        <div class="g2"><label>Sai<input data-c="saida" type="time" value="${d.saida}"></label><label>Chega<input data-c="chegada" type="time" value="${d.chegada}"></label></div>
        <div class="g2"><label>Milhas (total do trecho)<input data-c="milhas" type="number" min="0" step="100" value="${d.milhas}"></label><label>Taxas do trecho (R$)<input data-c="taxas" type="number" min="0" step="0.01" value="${d.taxas}"></label></div>
        <p class="nota">Confira os números: a leitura é automática e pode errar. O print e os dados vão para o pedido aberto no painel.</p>
        <div class="acoes"><button type="button" data-x="denovo">Tirar de novo</button><button type="button" class="pri" data-x="enviar">Enviar ao painel</button></div>
      </div>`;
    painel.hidden = false;
    painel.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
      trecho = b.dataset.t; painel.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b));
    }));
    painel.querySelector('[data-x="fechar"]').addEventListener('click', fechar);
    painel.querySelector('[data-x="denovo"]').addEventListener('click', () => { painel.hidden = true; entrarModo(); });
    painel.querySelector('[data-x="enviar"]').addEventListener('click', enviar);
  }
  async function enviar() {
    const v = (k) => painel.querySelector(`[data-c="${k}"]`).value.trim();
    const captura = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      programa: v('programa'), trecho, print: ultimaCaptura,
      voo: v('voo'), saida: v('saida'), chegada: v('chegada'), milhas: v('milhas'), taxas: v('taxas'),
      site: location.hostname, em: new Date().toISOString()
    };
    const r = await chrome.runtime.sendMessage({ tipo: 'salvar', captura });
    if (!r || !r.ok) { mostrarErro('Não consegui guardar a captura. Tente de novo.'); return; }
    painel.innerHTML = `<div class="ok">Enviado ao painel ✓<br><span style="font-weight:500;color:#55657F;font-size:13px">${PROGS[captura.programa]} · ${trecho === 'ida' ? 'Ida' : 'Volta'}</span></div>`;
    trecho = trecho === 'ida' ? 'volta' : 'ida';
    setTimeout(fechar, 1600);
  }
  function mostrarErro(msg) {
    painel.innerHTML = `<div class="cab" style="background:#C2261E"><span>Captura</span><button type="button" data-x="fechar">✕</button></div><div class="corpo"><p>${msg}</p></div>`;
    painel.hidden = false; painel.querySelector('[data-x="fechar"]').addEventListener('click', fechar);
  }
  function fechar() { painel.hidden = true; sairModo(); }

  window.__dcnpCaptura = { iniciar: entrarModo };
  entrarModo();
})();
