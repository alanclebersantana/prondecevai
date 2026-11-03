// Ponte entre a extensão e o painel: só age na página que tem <meta name="dcnp-painel">.
(() => {
  if (!document.querySelector('meta[name="dcnp-painel"]')) return;
  let pendentes = [];
  const enviar = () => pendentes.forEach((c) => window.postMessage({ tipo: 'dcnp-captura', captura: c }, '*'));
  chrome.storage.local.get({ capturas: [] }).then(({ capturas }) => { pendentes = capturas; enviar(); });
  chrome.storage.onChanged.addListener((mud, area) => {
    if (area === 'local' && mud.capturas) { pendentes = mud.capturas.newValue || []; enviar(); }
  });
  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data) return;
    if (e.data.tipo === 'dcnp-captura-ok') {
      pendentes = pendentes.filter((c) => c.id !== e.data.id);
      chrome.runtime.sendMessage({ tipo: 'confirmar', id: e.data.id });
    }
    if (e.data.tipo === 'dcnp-painel-pronto') { enviar(); window.postMessage({ tipo: 'dcnp-extensao-ativa' }, '*'); }
    if (e.data.tipo === 'dcnp-abrir-abas' && Array.isArray(e.data.urls)) {
      const urls = e.data.urls.filter((u) => /^https:\/\//.test(u)).slice(0, 5);
      chrome.runtime.sendMessage({ tipo: 'abrirAbas', urls }, (r) => window.postMessage({ tipo: 'dcnp-abas-abertas', ok: !!(r && r.ok) }, '*'));
    }
  });
  setInterval(() => { if (pendentes.length && document.visibilityState === 'visible') enviar(); }, 3000);
  document.documentElement.dataset.dcnpExtensao = '1';
  window.postMessage({ tipo: 'dcnp-extensao-ativa' }, '*');
})();
