const CACHE_VERSION = 'escala-9132-v2.4.1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './config.js',
  './dados.js',
  './script.js',
  './manifest.json',
  './icon-96.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const chaves = await caches.keys();
    await Promise.all(chaves.filter((chave) => chave !== CACHE_VERSION).map((chave) => caches.delete(chave)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.tipo === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const atualizacao = fetch(request, { cache: 'no-store' })
      .then(async (resposta) => {
        if (resposta.ok) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put('./index.html', resposta.clone());
        }
        return resposta;
      });

    // Depois da primeira visita, abre a página salva imediatamente e atualiza em segundo plano.
    event.respondWith((async () => {
      const armazenado = (await caches.match(request)) || (await caches.match('./index.html'));
      if (armazenado) return armazenado;
      try { return await atualizacao; }
      catch { return Response.error(); }
    })());
    event.waitUntil(atualizacao.catch(() => null));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const armazenado = await cache.match(request);
    const atualizacao = fetch(request, { cache: 'no-store' })
      .then((resposta) => {
        if (resposta.ok) cache.put(request, resposta.clone());
        return resposta;
      })
      .catch(() => null);
    return armazenado || (await atualizacao) || Response.error();
  })());
});
