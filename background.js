// Pronde cê vai? — extensão de captura
// Clique no ícone (ou Alt+Shift+C) numa página de resultados para escolher o voo.

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['captura.js'] });
  } catch (e) {
    console.warn('Não foi possível abrir a captura nesta página:', e);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, responder) => {
  if (msg.tipo === 'abrirAbas') {
    // abre cada site numa aba nova, logo depois da aba do painel
    const base = sender.tab ? sender.tab.index + 1 : undefined;
    Promise.all(msg.urls.map((url, i) => chrome.tabs.create({ url, active: i === 0, index: base !== undefined ? base + i : undefined })))
      .then(() => responder({ ok: true }))
      .catch((e) => responder({ ok: false, erro: String(e) }));
    return true;
  }
  if (msg.tipo === 'capturar') {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' })
      .then((d) => responder({ ok: true, imagem: d }))
      .catch((e) => responder({ ok: false, erro: String(e) }));
    return true;
  }
  if (msg.tipo === 'salvar') {
    chrome.storage.local.get({ capturas: [] })
      .then(({ capturas }) => { capturas.push(msg.captura); return chrome.storage.local.set({ capturas }); })
      .then(() => responder({ ok: true }))
      .catch((e) => responder({ ok: false, erro: String(e) }));
    return true;
  }
  if (msg.tipo === 'confirmar') {
    chrome.storage.local.get({ capturas: [] })
      .then(({ capturas }) => chrome.storage.local.set({ capturas: capturas.filter((c) => c.id !== msg.id) }))
      .then(() => responder({ ok: true }));
    return true;
  }
});
