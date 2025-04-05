const CACHE_NAME = 'varcraft-cache-v35'
const urlsToCache = [
  '/',
  'frontend.js',
  'manifest.json',
  'assets/code-256.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
    .then(() => self.skipWaiting())
  )
  console.log('sw installed')
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response

        return fetch(event.request).then(
          (netResponse) => {
            if (!netResponse) return netResponse

            console.log('cache request', event.request.url)
            const responseToCache = netResponse.clone()
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache)
            })
            return netResponse
          }
        )
      })
      .catch(() => {
        console.log('catch')
        return caches.match('/offline.html')
      })
  )
})

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                      if (!cacheWhitelist.includes(cacheName)) {
                          return caches.delete(cacheName)
                      }
                    })
                )
            })
        ])
    );
    console.log('sw activated')
})