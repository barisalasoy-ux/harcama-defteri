/* Harcama Defteri — service worker: uygulamayı tamamen offline çalıştırır. */
var SURUM = "defter-v2";
var DOSYALAR = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(SURUM).then(function(c){ return c.addAll(DOSYALAR); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(adlar){
      return Promise.all(adlar.map(function(a){
        return a === SURUM ? null : caches.delete(a);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(bulunan){
      if(bulunan) return bulunan;
      return fetch(e.request).then(function(yanit){
        if(yanit && yanit.status === 200 && yanit.type === "basic"){
          var kopya = yanit.clone();
          caches.open(SURUM).then(function(c){ c.put(e.request, kopya); });
        }
        return yanit;
      }).catch(function(){
        return caches.match("./index.html");
      });
    })
  );
});
