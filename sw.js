/* KASA — service worker.
   Açılış kuralı: önce önbellek, arkadan sessizce güncelle.
   Böylece uygulama şebeke zayıfken ya da internet yokken anında açılır;
   yeni sürüm arka planda indirilip bir sonraki açılışta devreye girer.
   Sürüm denetimi surum.txt üzerinden yapılır, o dosya hep ağdan okunur. */
var SURUM = "kasa-v33";
var DOSYALAR = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./excel.js",
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

function agIstegiYap(istek){
  // tarayıcının kendi HTTP önbelleğini atla; eski dosya takılı kalmasın
  try { return new Request(istek, {cache:"reload"}); }
  catch(hata){ return istek; }
}

self.addEventListener("fetch", function(e){
  var istek = e.request;
  if(istek.method !== "GET") return;

  var url;
  try { url = new URL(istek.url); } catch(hata){ return; }
  if(url.origin !== self.location.origin) return;

  // sürüm dosyası: her zaman ağdan, önbelleğe alınmaz
  if(/surum\.txt$/.test(url.pathname)){
    e.respondWith(
      fetch(agIstegiYap(istek)).catch(function(){
        return new Response("", {status:504});
      })
    );
    return;
  }

  e.respondWith(
    caches.match(istek).then(function(bellekten){
      var ag = fetch(agIstegiYap(istek)).then(function(yanit){
        if(yanit && yanit.status === 200){
          var kopya = yanit.clone();
          caches.open(SURUM).then(function(c){ c.put(istek, kopya); });
        }
        return yanit;
      }).catch(function(){ return null; });

      // Önbellekte varsa anında ver, güncellemeyi arkadan sürdür.
      if(bellekten){ e.waitUntil(ag); return bellekten; }

      // İlk kez isteniyorsa ağdan bekle; o da olmazsa uygulama kabuğunu ver.
      return ag.then(function(yanit){
        return yanit || caches.match("./index.html");
      });
    })
  );
});
