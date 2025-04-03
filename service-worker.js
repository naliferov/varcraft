
const CACHE_NAME = 'varcraft-cache-v2'
const urlsToCache = [
  '/',
  //'frontend.js'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
    .then(() => self.skipWaiting())
  )
  console.log('sw installed')
})

//new waiting for cache
// const responseToCache = networkResponse.clone()
// caches.open(CACHE_NAME).then(cache => {
//     cache.put(event.request, responseToCache)
// })

self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'cache requests') return

  console.log('cache requests')
})

const opaqueResponses = new Map()

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response

        return fetch(event.request).then(
          networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse
            }
            console.log('cache fetch add', event.request.url)

            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache)
            })

            return networkResponse
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