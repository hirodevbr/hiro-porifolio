// Service Worker para cache de recursos estáticos
const CACHE_NAME = 'portfolio-cache-v3';
const RUNTIME_CACHE = 'portfolio-runtime-v3';
const OFFLINE_PAGE = '/offline.html';

// Recursos para cachear imediatamente
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/site.webmanifest',
  '/sw.js',
  '/offline.html',
];

// Estratégia de cache: Cache First para recursos estáticos
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Erro ao buscar recurso:', error);
    // Retornar página offline para navegação
    if (request.destination === 'document') {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      if (offlinePage) {
        return offlinePage;
      }
    }
    return new Response('Recurso não disponível offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// Estratégia de cache: Network First para APIs e páginas
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Rede indisponível, tentando cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Para páginas HTML, retornar página offline
    if (request.destination === 'document') {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      if (offlinePage) {
        return offlinePage;
      }
    }
    return new Response('Recurso não disponível offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cacheando recursos estáticos');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error('Erro ao cachear recursos:', error);
      });
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('Service Worker: Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
  console.log('Service Worker: Ativado e pronto');
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de extensões do navegador e outros protocolos
  if (
    url.protocol === 'chrome-extension:' ||
    url.protocol === 'chrome:' ||
    url.protocol === 'moz-extension:'
  ) {
    return;
  }

  // Ignorar requisições para analytics e outras APIs externas que não precisam de cache
  if (
    url.hostname.includes('vercel-analytics') ||
    url.hostname.includes('vercel-insights') ||
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('googletagmanager')
  ) {
    return;
  }

  // Não cachear endpoints sensíveis a tempo/sync (evita divergência entre navegadores/dispositivos)
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/lyrics') || url.pathname.startsWith('/api/time')) {
      event.respondWith(fetch(request));
      return;
    }
  }

  // Cache First para imagens
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network First para APIs
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache First para outros recursos estáticos (CSS, JS, Fonts)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network First para páginas HTML e outros recursos
  event.respondWith(networkFirst(request));
});

// Mensagem para atualizar o cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

