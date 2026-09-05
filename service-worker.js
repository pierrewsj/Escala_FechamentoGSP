const CACHE_VERSION = 'escala-9132-v2.6.7';
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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
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

  // Rede primeiro: todos os aparelhos recebem a versão atual assim que estiverem online.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    try {
      const resposta = await fetch(request, { cache: 'no-store' });
      if (resposta && resposta.ok) {
        cache.put(request, resposta.clone());
        if (request.mode === 'navigate') cache.put('./index.html', resposta.clone());
      }
      return resposta;
    } catch (_) {
      return (await cache.match(request))
        || (request.mode === 'navigate' ? await cache.match('./index.html') : null)
        || Response.error();
    }
  })());
});
