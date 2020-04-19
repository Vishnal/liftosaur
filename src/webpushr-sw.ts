// eslint-disable-next-line no-var
declare var __COMMIT_HASH__: string;
const cacheName = `liftosaur-sw-${__COMMIT_HASH__}`;

function initialize(service: ServiceWorkerGlobalScope): void {
  service.addEventListener("install", event => {
    event.waitUntil(
      caches.open(cacheName).then(cache => {
        return cache.addAll([
          `/main.css?version=${__COMMIT_HASH__}`,
          `/main.js?version=${__COMMIT_HASH__}`,
          "/",
          "/index.html",
          "/icons/icon192.png",
          "/icons/icon512.png"
        ]);
      })
    );
  });

  service.addEventListener("fetch", e => {
    console.log("[Service Worker] Fetched resource " + e.request.url);

    e.respondWith(
      caches.match(e.request).then(r => {
        console.log("[Service Worker] Fetching resource: " + e.request.url);
        return (
          r ||
          fetch(e.request).then(response => {
            if (e.request.method === "GET") {
              return caches.open(cacheName).then(cache => {
                console.log("[Service Worker] Caching new resource: " + e.request.url);
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                cache.put(e.request, response.clone());
                return response;
              });
            } else {
              return response;
            }
          })
        );
      })
    );
  });

  self.addEventListener("activate", async (event: object) => {
    console.log("Activate Service Worker", event);
    const keys = (await caches.keys()).filter(k => k !== cacheName);
    console.log(keys);
    for (const key of keys) {
      await caches.delete(key);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
initialize(self as any);

if (self.importScripts != null) {
  self.importScripts("https://cdn.webpushr.com/sw-server.min.js");
}
