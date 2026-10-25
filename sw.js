/* Harcama Defteri — service worker.
   Uygulama dosyaları: önce ağ, olmazsa önbellek (güncellemeler anında gelsin).
   İnternet yoksa her şey önbellekten çalışır. */
var SURUM = "defter-v5";
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
    caches.open(SURUM)
      .then(function(c){ return c.addAll(DOSYALAR); })
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
  var istek = e.request;
  if(istek.method !== "GET") return;

  var url;
  try { url = new URL(istek.url); } catch(hata){ return; }
  if(url.origin !== self.location.origin) return;

  // Uygulamanın kendi dosyaları: önce ağdan dene, başarısız olursa önbellekten ver.
  e.respondWith(
    fetch(istek).then(function(yanit){
      if(yanit && yanit.status === 200){
        var kopya = yanit.clone();
        caches.open(SURUM).then(function(c){ c.put(istek, kopya); });
      }
      return yanit;
    }).catch(function(){
      return caches.match(istek).then(function(bulunan){
        return bulunan || caches.match("./index.html");
      });
    })
  );
});
