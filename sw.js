// Service worker do painel Vai pra onde?
// Páginas e configuração: busca na internet primeiro (sempre a versão mais nova) e usa a cópia guardada se estiver sem internet.
// Imagens, fontes e o SDK do Firebase: usa a cópia guardada e atualiza por trás.
// O Firestore cuida dos próprios dados offline; este arquivo não mexe nas chamadas dele.
const VERSAO = 'vaipraonde-v4';
const ESSENCIAIS = [
  './painel.html', './painel.webmanifest', './firebase-config.js',
  './logo-192.png', './logo-512.png', './logo-maskable-512.png', './favicon.png', './ceu-asa.jpg', './ceu-asa-celular.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => Promise.all(ESSENCIAIS.map((u) => c.add(u).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const deRede = async (req) => {
  try {
    const r = await fetch(req);
    if (r && r.ok) (await caches.open(VERSAO)).put(req, r.clone());
    return r;
  } catch (e) {
    const c = await caches.match(req, { ignoreSearch: true });
    if (c) return c;
    if (req.mode === 'navigate') return caches.match('./painel.html');
    throw e;
  }
};
const doCache = async (req) => {
  const c = await caches.match(req);
  const rede = fetch(req).then(async (r) => { if (r && (r.ok || r.type === 'opaque')) (await caches.open(VERSAO)).put(req, r.clone()); return r; }).catch(() => null);
  return c || (await rede) || Response.error();
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mesmo = url.origin === self.location.origin;
  if (mesmo && (req.mode === 'navigate' || /\.(html|js|webmanifest|json)$/.test(url.pathname))) { e.respondWith(deRede(req)); return; }
  if (mesmo && /\.(png|jpe?g|webp|svg|ico)$/.test(url.pathname)) { e.respondWith(doCache(req)); return; }
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) { e.respondWith(doCache(req)); return; }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') { e.respondWith(doCache(req)); return; }
});

// tocar na notificação de pedido novo abre o painel
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const aberto = cs.find((c) => c.url.includes('painel.html'));
    return aberto ? aberto.focus() : self.clients.openWindow('./painel.html');
  }));
});
