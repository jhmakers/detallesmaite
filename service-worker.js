
const CACHE_NAME = "detallesmaite-shell-v2";

const APP_FILES = [
  "./",
  "inicio.html",
  "index.html",
  "estilos.css",
  "app.js",
  "firebase-cloud.js",
  "manifest.json",
  "icon-tienda.png"
];

// Guardar interfaz básica sin bloquear si un archivo falla
self.addEventListener("install", event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(APP_FILES.map(file=>cache.add(file).catch(()=>{})))
    )
  );
  self.skipWaiting();
});

// Activar nueva versión y eliminar cachés viejas
self.addEventListener("activate", event=>{
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
      )
    ).then(()=>self.clients.claim())
  );
});

// HTML primero actualizado, recursos rápidos desde caché
self.addEventListener("fetch", event=>{
  const request=event.request;

  if(request.method!=="GET") return;

  const url=new URL(request.url);

  // Firebase siempre debe ir a red para tener datos actuales
  if(url.hostname.includes("firebase") || url.pathname.includes("firestore")){
    return;
  }

  // HTML: red primero, si falla usa caché
  if(request.headers.get("accept")?.includes("text/html")){
    event.respondWith(
      fetch(request)
      .then(response=>{
        const clone=response.clone();
        caches.open(CACHE_NAME).then(c=>c.put(request,clone));
        return response;
      })
      .catch(()=>caches.match(request))
    );
    return;
  }

  // JS/CSS/iconos: caché primero y actualiza detrás
  event.respondWith(
    caches.match(request).then(cached=>{
      const network=fetch(request).then(response=>{
        if(response && response.status===200){
          caches.open(CACHE_NAME).then(c=>c.put(request,response.clone()));
        }
        return response;
      }).catch(()=>cached);

      return cached || network;
    })
  );
});
