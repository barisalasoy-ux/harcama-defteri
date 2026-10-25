/* KASA — offline gelir/gider defteri. design by alasoy
   Veriler telefonun kendi hafızasında (localStorage) tutulur, hiçbir yere gönderilmez. */
(function(){
"use strict";

// ---------------------------------------------------------------- sabitler
var KAT = {
  gider:["Market","Bebek & Çocuk","Yemek & Kafe","Fatura","Kira","Aidat","Ulaşım","Akaryakıt","Araç",
         "Sağlık","İlaç","Giyim","Kozmetik & Bakım","Temizlik","Ev & Yapı market","Teknoloji","Mobilya",
         "Eğitim","Eğlence","Tatil","Abonelik","Sigorta","Kredi & Taksit","Vergi & Harç","Hediye",
         "Evcil hayvan","Bağış","Alkol & Tütün","Diğer"],
  gelir:["Maaş","Nakit mevcut","Ek gelir","Prim","Kira geliri","Faiz & Yatırım","Satış","İade",
         "Hediye & Destek","Diğer"]
};
var AYLAR=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var GUNLER=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var TAKSITLER=[1,2,3,4,5,6,8,9,10,12,18,24];
var ANAHTAR="harcama-defteri-v1";
var SURUM_ADI="4.0";

// kategori anahtar kelimeleri (yerel çözümleyici için)
var IPUCU_GIDER=[
  ["Market",["market","markete","bakkal","manav","kasap","migros","a101","bim","şok","carrefour","alışveriş",
             "ekmek","fırın","simit","poğaça","su","sebze","meyve","et","tavuk","balık","peynir","süt",
             "yumurta","çay","şeker","un","yoğurt","zeytin","makarna","pirinç","yağ","kahvaltılık"]],
  ["Bebek & Çocuk",["bebek","bez","biberon","ıslak mendil","çocuk","oyuncak","mama"]],
  ["Yemek & Kafe",["yemek","restoran","lokanta","kafe","kahve","döner","pizza","hamburger","çay","yemeğe"]],
  ["Fatura",["fatura","elektrik","doğalgaz","su fatura","internet","telefon fatura","suya","su parası"]],
  ["Kira",["kira"]],
  ["Aidat",["aidat"]],
  ["Ulaşım",["otobüs","metro","metrobüs","taksi","dolmuş","ulaşım","istanbulkart","bilet"]],
  ["Akaryakıt",["benzin","mazot","motorin","akaryakıt","yakıt","lpg","depo"]],
  ["Araç",["lastik","oto servis","araç bakım","muayene ücreti","yağ değişimi","otopark","köprü","hgs","ogs"]],
  ["Sağlık",["doktor","hastane","muayene","diş","tahlil","sağlık"]],
  ["İlaç",["ilaç","eczane","vitamin","aşı"]],
  ["Giyim",["giyim","kıyafet","ayakkabı","pantolon","gömlek","mont","elbise","çorap"]],
  ["Kozmetik & Bakım",["şampuan","kuaför","berber","kozmetik","parfüm","krem","tıraş"]],
  ["Temizlik",["deterjan","temizlik","çamaşır suyu","bulaşık","peçete","poşet"]],
  ["Ev & Yapı market",["yapı market","boya","vida","hırdavat","koçtaş","bauhaus","ampul","musluk",
                       "çamaşır makinesi","bulaşık makinesi","buzdolabı","derin dondurucu","klima",
                       "kombi","ocak","davlumbaz","beyaz eşya","elektrikli süpürge","ütü","su ısıtıcı"]],
  ["Teknoloji",["bilgisayar","kulaklık","şarj","kablo","telefon aldım","tablet","yazıcı","elektronik",
                "televizyon","monitör","konsol","akıllı saat","hoparlör"]],
  ["Mobilya",["mobilya","koltuk","masa","dolap","yatak","sandalye","halı"]],
  ["Eğitim",["okul","kurs","kitap","eğitim","kırtasiye","ders","üniversite"]],
  ["Eğlence",["sinema","eğlence","oyun","konser","maç","tiyatro","lunapark"]],
  ["Tatil",["tatil","otel","uçak","tur","konaklama"]],
  ["Abonelik",["abonelik","netflix","spotify","youtube premium","üyelik","exxen","bein"]],
  ["Sigorta",["sigorta","kasko","dask","bes","poliçe"]],
  ["Kredi & Taksit",["kredi","taksit ödeme","kredi kartı borcu","banka borcu","bankaya","banka",
                     "kart borcu","kredi kartı","ekstre","konut kredisi","taşıt kredisi"]],
  ["Vergi & Harç",["vergi","harç","ceza","mtv","trafik cezası","noter"]],
  ["Hediye",["hediye","çiçek","doğum günü","düğün takı","nişan"]],
  ["Evcil hayvan",["kedi","köpek","veteriner","kedi maması","köpek maması","kuş"]],
  ["Bağış",["bağış","zekat","sadaka","yardım","fitre"]],
  ["Alkol & Tütün",["alkol","bira","şarap","rakı","viski","sigara","tütün"]]
];
var IPUCU_GELIR=[
  ["Maaş",["maaş","maas"]],
  ["Nakit mevcut",["cebimde","elimde","kasada","nakit var","param var","birikim","mevcut","kalan param",
                   "açılış","bakiye","hesabımda"]],
  ["Prim",["prim","ikramiye","bonus"]],
  ["Kira geliri",["kira geliri","kiracı","kiradan"]],
  ["Faiz & Yatırım",["faiz","temettü","borsa","altın sattım","kâr payı"]],
  ["Satış",["sattım","satış","sattik"]],
  ["İade",["iade"]],
  ["Hediye & Destek",["hediye geldi","harçlık","destek"]],
  ["Ek gelir",["ek iş","freelance","ek gelir","fatura kestim"]]
];

// ---------------------------------------------------------------- durum
var veri={kayitlar:[],borclar:[]};
var bugun=new Date(), yil=bugun.getFullYear(), ay=bugun.getMonth();
var aktif=null, silAdayi=null, kapatAdayi=null, bSilAdayi=null;
var formTur="gider", formYon="alacak";
var taniyici=null, dinliyor=false, kurulumOlayi=null;

function $(id){ return document.getElementById(id); }
function el(tag,sinif,metin){
  var e=document.createElement(tag);
  if(sinif) e.className=sinif;
  if(metin!==undefined&&metin!==null) e.textContent=metin;
  return e;
}
function yeniId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }

// ---------------------------------------------------------------- depolama
function yukle(){
  try{
    var ham=localStorage.getItem(ANAHTAR);
    if(!ham) return;
    var o=JSON.parse(ham);
    if(o&&Array.isArray(o.kayitlar)) veri.kayitlar=o.kayitlar;
    if(o&&Array.isArray(o.borclar)) veri.borclar=o.borclar;
  }catch(e){}
}
function kaydet(){
  try{ localStorage.setItem(ANAHTAR,JSON.stringify(veri)); }
  catch(e){ durum("Kayıt saklanamadı; telefonun deposu dolu olabilir.",true); }
}
function kayitEkle(k){ k.id=yeniId(); veri.kayitlar.push(k); kaydet(); }
function borcEkle(b){ b.id=yeniId(); veri.borclar.push(b); kaydet(); }

// ---------------------------------------------------------------- yardımcılar
function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function ayKey(y,a){ return y+"-"+String(a+1).padStart(2,"0"); }
function artiGun(n){ var d=new Date(); d.setDate(d.getDate()+n); return iso(d); }
function gecerliTarih(t){ return /^\d{4}-\d{2}-\d{2}$/.test(String(t||"")); }

var nf=new Intl.NumberFormat("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
var nf0=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0});
function para(n){ return nf.format(n)+" ₺"; }
// tablolarda yer kazanmak icin: 1000 ustu kurussuz
function paraK(n){ return (Math.abs(n)>=1000?nf0.format(Math.round(n)):nf.format(n))+" ₺"; }
function kisaPara(n){
  var m=Math.abs(n);
  if(m>=1000000) return (n<0?"−":"")+nf0.format(m/1000000)+"M";
  if(m>=10000) return (n<0?"−":"")+nf0.format(m/1000)+"B";
  return (n<0?"−":"")+nf0.format(m);
}
function parseTutar(s){
  if(s===null||s===undefined) return NaN;
  s=String(s).replace(/\s/g,"").replace(/₺/g,"");
  var n1=s.lastIndexOf("."), v1=s.lastIndexOf(",");
  if(n1>-1&&v1>-1){
    // ikisi birden: sonda gelen ondalık ayırıcıdır
    if(v1>n1) s=s.replace(/\./g,"").replace(",",".");
    else s=s.replace(/,/g,"");
  } else if(v1>-1){
    // sadece virgül: Türkçe ondalık (1.250,50 üstte ele alındı)
    s=(s.split(",").length>2)?s.replace(/,/g,""):s.replace(",",".");
  } else if(n1>-1){
    // sadece nokta: son grup 3 haneyse binlik ayırıcıdır (15.000 = 15000)
    var parcalar=s.split(".");
    var sonParca=parcalar[parcalar.length-1];
    if(parcalar.length>2||(sonParca.length===3&&parcalar[0].length>0)) s=parcalar.join("");
  }
  var n=parseFloat(s);
  return (isFinite(n)&&n>0)?Math.round(n*100)/100:NaN;
}

// "15 bin", "2 milyon" gibi yazımları sayıya çevir
function sayiSozcukleri(metin){
  return String(metin).replace(/(\d[\d.,]*)\s*(bin|milyon|milyar)\b/gi,function(tam,sayi,sozcuk){
    var t=parseTutar(sayi);
    if(isNaN(t)) return tam;
    var k=sozcuk.toLocaleLowerCase("tr");
    var carpan=k==="bin"?1000:(k==="milyon"?1000000:1000000000);
    return String(Math.round(t*carpan));
  });
}
function gunBasligi(t){
  var p=String(t).split("-");
  var d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));
  if(isNaN(d.getTime())) return t;
  return Number(p[2])+" "+AYLAR[d.getMonth()]+" · "+GUNLER[d.getDay()];
}
function kisaTarih(t){
  var p=String(t).split("-");
  if(p.length!==3) return t;
  return Number(p[2])+" "+(AYLAR[Number(p[1])-1]||"").slice(0,3);
}
function sadelestir(s){
  return String(s||"").toLocaleLowerCase("tr")
    .replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g")
    .replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c");
}
function durum(metin,hata){
  var e=$("durum");
  if(!metin){ e.hidden=true; return; }
  e.textContent=metin; e.className="durum"+(hata?" hata":""); e.hidden=false;
}

// ---------------------------------------------------------------- taksit
function taksitSayisi(r){ return (typeof r.taksit==="number"&&r.taksit>1)?Math.min(60,Math.round(r.taksit)):1; }
// Bir kaydın aylara dağılımı. Taksitliyse ilk taksit, alışverişten
// BİR AY SONRAKİ aya düşer (kredi kartı mantığı). Peşinse kendi ayına.
function taksitYayilimi(r){
  if(!gecerliTarih(r.tarih)) return [];
  var n=taksitSayisi(r), p=r.tarih.split("-");
  var by=Number(p[0]), ba=Number(p[1])-1, gun=Number(p[2])||1;
  var kaydir=(n>1)?1:0;
  var pay=Math.round(r.tutar/n*100)/100, out=[];
  for(var i=0;i<n;i++){
    var toplamAy=ba+i+kaydir;
    var yy=by+Math.floor(toplamAy/12), aa=((toplamAy%12)+12)%12;
    var g=Math.min(gun,new Date(yy,aa+1,0).getDate());
    out.push({ r:r, pay:pay, sira:i+1, adet:n, y:yy, a:aa,
      anahtar:ayKey(yy,aa), tarih:ayKey(yy,aa)+"-"+String(g).padStart(2,"0") });
  }
  return out;
}

function aySatirlari(y,a){
  var hedef=ayKey(y,a), out=[];
  veri.kayitlar.forEach(function(r){
    var yayilim=taksitYayilimi(r);
    for(var i=0;i<yayilim.length;i++){
      if(yayilim[i].anahtar===hedef){ out.push(yayilim[i]); break; }
    }
  });
  return out;
}

function gelecekTaksitYuku(){
  var simdi=ayKey(yil,ay), toplam=0;
  veri.kayitlar.forEach(function(r){
    if(r.tur==="gelir") return;
    if(taksitSayisi(r)<2) return;
    taksitYayilimi(r).forEach(function(x){ if(x.anahtar>simdi) toplam+=x.pay; });
  });
  return Math.round(toplam*100)/100;
}
function vadeDurum(r){
  if(r.durum==="kapandi") return "kapandi";
  if(!gecerliTarih(r.vade)) return "acik";
  var b=iso(new Date());
  if(r.vade<b) return "gecikti";
  if(r.vade<=artiGun(7)) return "yaklasan";
  return "acik";
}
function acikBorclar(){ return veri.borclar.filter(function(r){ return r.durum!=="kapandi"; }); }

// ---------------------------------------------------------------- ana ekran
function cizEv(){
  var b=new Date();
  var kutu=$("ayad");
  var adEl=kutu.querySelector(".ayAdi"), altYazi=kutu.querySelector(".ayAlt");
  if(!adEl||!altYazi){            // eski HTML: parçaları burada kur
    kutu.textContent="";
    kutu.classList.add("ad");
    adEl=el("span","ayAdi"); altYazi=el("span","ayAlt");
    kutu.appendChild(adEl); kutu.appendChild(altYazi);
  }
  adEl.textContent=AYLAR[ay]+" "+yil;
  if(yil===b.getFullYear()&&ay===b.getMonth()){
    altYazi.className="ayAlt";
    altYazi.textContent="bugün "+b.getDate()+" "+AYLAR[b.getMonth()]+" "+GUNLER[b.getDay()];
  } else {
    altYazi.className="ayAlt donus";
    altYazi.textContent="↩ bugüne dön";
  }
  var satirlar=aySatirlari(yil,ay), gelir=0, gider=0;
  satirlar.forEach(function(s){ if(s.r.tur==="gelir") gelir+=s.pay; else gider+=s.pay; });
  var kalan=gelir-gider, k=$("v-kalan");
  k.textContent=(kalan<0?"−":"")+para(Math.abs(kalan));
  k.className="v "+(kalan>=0?"pos":"neg");
  $("v-gelir").textContent=kisaPara(gelir)+" ₺";
  $("v-gider").textContent=kisaPara(gider)+" ₺";

  var ta=0, tb=0;
  acikBorclar().forEach(function(r){ if(r.yon==="alacak") ta+=r.tutar; else tb+=r.tutar; });
  var yuk=gelecekTaksitYuku(), net=kalan+ta-tb-yuk, n=$("v-net");
  n.textContent=kisaPara(net)+" ₺";
  n.className="v "+(net>=0?"pos":"neg");

  var parcalar=[];
  if(ta) parcalar.push("alacak +"+kisaPara(ta));
  if(tb) parcalar.push("borç −"+kisaPara(tb));
  if(yuk) parcalar.push("gelecek taksit −"+kisaPara(yuk));
  $("v-alt").textContent=parcalar.length?parcalar.join(" · "):"açık alacak, borç veya taksit yok";

  var gec=0;
  acikBorclar().forEach(function(r){ var d=vadeDurum(r); if(d==="gecikti"||d==="yaklasan") gec++; });
  var ok=$("borcOk");
  if(gec){ ok.className="rozet"; ok.textContent=String(gec); }
  else { ok.className="ok"; ok.textContent="›"; }

  cizSonlar();
}

function cizSonlar(){
  var kutu=$("sonListe");
  kutu.innerHTML="";
  if(!veri.kayitlar.length){
    kutu.appendChild(el("div","sonBos","Henüz kayıt yok. Yukarıya yaz, konuş ya da ✎ ile gir."));
    return;
  }
  var son=veri.kayitlar.slice().sort(function(a,b){
    if(a.tarih===b.tarih) return (b.olusturma||"")<(a.olusturma||"")?-1:1;
    return a.tarih<b.tarih?1:-1;
  }).slice(0,25);
  son.forEach(function(r){
    var b=el("button","sonSatir"); b.type="button";
    b.appendChild(el("div","mark"+(r.tur==="gelir"?" g":"")));
    var t=el("div","txt");
    t.appendChild(el("div","ad",r.aciklama||r.kategori||"Kayıt"));
    var alt=[kisaTarih(r.tarih),r.kategori||"Diğer"];
    if(r.isyeri) alt.push(r.isyeri);
    if(taksitSayisi(r)>1) alt.push(taksitSayisi(r)+" taksit");
    t.appendChild(el("div","alt",alt.join(" · ")));
    b.appendChild(t);
    b.appendChild(el("div","tut "+(r.tur==="gelir"?"pos":"neg"),(r.tur==="gelir"?"+":"−")+para(r.tutar)));
    b.addEventListener("click",function(){
      var p=r.tarih.split("-"); yil=Number(p[0]); ay=Number(p[1])-1;
      katmanAc("Hareketler",cizHareketler);
    });
    kutu.appendChild(b);
  });
}

function ciz(){
  cizEv();
  if(aktif&&aktif.ciz) aktif.ciz();
}

// ---------------------------------------------------------------- katmanlar
function katmanAc(baslik,cizFn){
  aktif={ baslik:baslik, ciz:function(){ cizFn($("katGovde")); } };
  $("katBaslik").textContent=baslik;
  $("katman").hidden=false;
  silAdayi=null; kapatAdayi=null; bSilAdayi=null;
  aktif.ciz();
  $("katGovde").scrollTop=0;
}
function katmanKapat(){ aktif=null; $("katman").hidden=true; $("katGovde").innerHTML=""; }

function onaySatiri(soru,eylemler){
  var e=el("div","hr"), o=el("div","onay");
  o.appendChild(el("span",null,soru));
  var g=el("span"); g.style.display="flex"; g.style.gap="7px"; g.style.flexWrap="wrap";
  eylemler.forEach(function(x){
    var b=el("button",x.sinif||null,x.ad); b.type="button";
    b.addEventListener("click",x.fn); g.appendChild(b);
  });
  o.appendChild(g); e.appendChild(o); return e;
}
function alan(parent,etiket,tip,placeholder){
  var f=el("div","field"), id="f-"+Math.random().toString(36).slice(2,8);
  var l=el("label",null,etiket); l.setAttribute("for",id);
  var i=document.createElement(tip==="select"?"select":"input");
  i.id=id;
  if(tip!=="select"){ i.type=tip; if(placeholder) i.placeholder=placeholder; i.autocomplete="off"; }
  f.appendChild(l); f.appendChild(i); parent.appendChild(f);
  return i;
}

// ---------------------------------------------------------------- hareketler
function cizHareketler(govde){
  govde.innerHTML="";
  var satirlar=aySatirlari(yil,ay);
  var bolum=el("section");
  bolum.appendChild(el("h3",null,AYLAR[ay]+" "+yil+" · "+satirlar.length+" hareket"));
  var kutu=el("div");
  if(!satirlar.length){
    var bos=el("div","bos");
    bos.appendChild(el("strong",null,"Bu ayda kayıt yok"));
    bos.appendChild(el("p",null,"Ana ekrandan yazarak, konuşarak ya da ✎ ile ekleyebilirsin."));
    kutu.appendChild(bos);
  } else {
    satirlar.sort(function(x,z){
      if(x.tarih===z.tarih) return (z.r.olusturma||"")<(x.r.olusturma||"")?-1:1;
      return x.tarih<z.tarih?1:-1;
    });
    var sonGun=null;
    satirlar.forEach(function(s){
      if(s.tarih!==sonGun){ sonGun=s.tarih; kutu.appendChild(el("div","gun",gunBasligi(s.tarih))); }
      kutu.appendChild(hareketSatiri(s));
    });
  }
  bolum.appendChild(kutu);
  govde.appendChild(bolum);
  if(satirlar.length){
    var d=el("button","ana genis","Bu ayı CSV olarak indir"); d.type="button";
    d.addEventListener("click",csvIndir);
    govde.appendChild(d);
  }
}
function hareketSatiri(s){
  var r=s.r;
  if(silAdayi===r.id){
    return onaySatiri(s.adet>1?"Taksitli kaydın tamamı silinsin mi?":"Bu kayıt silinsin mi?",[
      {ad:"Vazgeç",fn:function(){ silAdayi=null; ciz(); }},
      {ad:"Sil",sinif:"evet",fn:function(){ sil(r.id); }}
    ]);
  }
  var e=el("div","hr");
  e.appendChild(el("div","mark"+(r.tur==="gelir"?" g":"")));
  var t=el("div","txt");
  t.appendChild(el("div","ad",r.aciklama||r.kategori||"Diğer"));
  var alt=[r.kategori||"Diğer"];
  if(r.isyeri) alt.push(r.isyeri);
  if(s.adet>1) alt.push(s.sira+"/"+s.adet+" taksit · toplam "+para(r.tutar));
  t.appendChild(el("div","alt",alt.join(" · ")));
  e.appendChild(t);
  e.appendChild(el("div","tut "+(r.tur==="gelir"?"pos":"neg"),(r.tur==="gelir"?"+":"−")+para(s.pay)));
  var sb=el("button","sil","×"); sb.type="button"; sb.setAttribute("aria-label","Kaydı sil");
  sb.addEventListener("click",function(){ silAdayi=r.id; ciz(); });
  e.appendChild(sb);
  return e;
}
function sil(id){
  silAdayi=null;
  veri.kayitlar=veri.kayitlar.filter(function(r){ return r.id!==id; });
  kaydet(); ciz();
}

// ---------------------------------------------------------------- alacak & borç
function cizBorc(govde){
  govde.innerHTML="";
  var acik=acikBorclar(), kapali=veri.borclar.filter(function(r){ return r.durum==="kapandi"; });
  var ta=0, tb=0;
  acik.forEach(function(r){ if(r.yon==="alacak") ta+=r.tutar; else tb+=r.tutar; });

  var ozet=el("div","card");
  [["Alacağım",ta,"pos"],["Borcum",tb,"neg"],["Fark",ta-tb,(ta-tb)>=0?"pos":"neg"]].forEach(function(p){
    var s=el("div","ozetSatir");
    s.appendChild(el("span",null,p[0]));
    s.appendChild(el("b",p[2],(p[1]<0?"−":"")+para(Math.abs(p[1]))));
    ozet.appendChild(s);
  });
  govde.appendChild(ozet);

  var b1=el("section");
  b1.appendChild(el("h3",null,"Açık kayıtlar"));
  var kutu=el("div");
  if(!acik.length){
    var bos=el("div","bos");
    bos.appendChild(el("strong",null,"Açık alacak ya da borç yok"));
    bos.appendChild(el("p",null,"Aşağıdan ekle; vadesi yaklaşınca ana ekranda uyarı çıkar."));
    kutu.appendChild(bos);
  } else {
    var sira={gecikti:0,yaklasan:1,acik:2};
    acik.sort(function(a,b){
      var fa=sira[vadeDurum(a)], fb=sira[vadeDurum(b)];
      if(fa!==fb) return fa-fb;
      var va=gecerliTarih(a.vade)?a.vade:"9999-12-31", vb=gecerliTarih(b.vade)?b.vade:"9999-12-31";
      return va<vb?-1:1;
    });
    acik.forEach(function(r){ kutu.appendChild(borcSatiri(r)); });
  }
  b1.appendChild(kutu);
  govde.appendChild(b1);

  var ekleBtn=el("button","ana genis","Yeni alacak / borç ekle"); ekleBtn.type="button";
  ekleBtn.addEventListener("click",function(){ katmanAc("Yeni alacak / borç",cizBorcForm); });
  govde.appendChild(ekleBtn);

  if(kapali.length){
    var b2=el("section");
    b2.appendChild(el("h3",null,"Kapanmış"));
    var k2=el("div");
    kapali.sort(function(a,b){ return (b.kapanis||"")<(a.kapanis||"")?-1:1; });
    kapali.slice(0,10).forEach(function(r){ k2.appendChild(borcSatiri(r)); });
    b2.appendChild(k2); govde.appendChild(b2);
  }
}
function borcSatiri(r){
  if(bSilAdayi===r.id){
    return onaySatiri("Bu kayıt silinsin mi?",[
      {ad:"Vazgeç",fn:function(){ bSilAdayi=null; ciz(); }},
      {ad:"Sil",sinif:"evet",fn:function(){ bSil(r.id); }}
    ]);
  }
  if(kapatAdayi===r.id){
    return onaySatiri(r.yon==="alacak"?"Tahsil edildi:":"Ödendi:",[
      {ad:"Vazgeç",fn:function(){ kapatAdayi=null; ciz(); }},
      {ad:"Sadece kapat",fn:function(){ bKapat(r,false); }},
      {ad:"Kapat + deftere işle",sinif:"iyi",fn:function(){ bKapat(r,true); }}
    ]);
  }
  var e=el("div","hr"+(r.durum==="kapandi"?" bitti":""));
  e.appendChild(el("div","mark"+(r.yon==="alacak"?" g":"")));
  var t=el("div","txt");
  t.appendChild(el("div","ad",r.kisi||(r.yon==="alacak"?"Alacak":"Borç")));
  var alt=[];
  if(r.aciklama) alt.push(r.aciklama);
  if(r.durum==="kapandi") alt.push("kapandı"+(gecerliTarih(r.kapanis)?" · "+kisaTarih(r.kapanis):""));
  if(alt.length) t.appendChild(el("div","alt",alt.join(" · ")));
  e.appendChild(t);
  var sag=el("div");
  sag.style.display="flex"; sag.style.flexDirection="column";
  sag.style.alignItems="flex-end"; sag.style.gap="4px"; sag.style.flex="none";
  sag.appendChild(el("div","tut "+(r.yon==="alacak"?"pos":"neg"),(r.yon==="alacak"?"+":"−")+para(r.tutar)));
  var d=vadeDurum(r);
  if(r.durum!=="kapandi"&&gecerliTarih(r.vade)){
    sag.appendChild(el("span","vade"+(d==="gecikti"?" gec":(d==="yaklasan"?" yak":"")),
      (d==="gecikti"?"geçti · ":"")+kisaTarih(r.vade)));
  }
  e.appendChild(sag);
  if(r.durum!=="kapandi"){
    var kb=el("button","kapatBtn",r.yon==="alacak"?"Tahsil":"Ödendi"); kb.type="button";
    kb.addEventListener("click",function(){ kapatAdayi=r.id; bSilAdayi=null; ciz(); });
    e.appendChild(kb);
  }
  var sb=el("button","sil","×"); sb.type="button"; sb.setAttribute("aria-label","Kaydı sil");
  sb.addEventListener("click",function(){ bSilAdayi=r.id; kapatAdayi=null; ciz(); });
  e.appendChild(sb);
  return e;
}
function bKapat(r,isle){
  kapatAdayi=null;
  var t=iso(new Date());
  r.durum="kapandi"; r.kapanis=t;
  if(isle){
    kayitEkle({
      tur:r.yon==="alacak"?"gelir":"gider", tutar:r.tutar, taksit:1,
      kategori:r.yon==="alacak"?"Ek gelir":"Diğer", tarih:t,
      aciklama:(r.kisi||"")+(r.aciklama?" · "+r.aciklama:""), isyeri:"",
      olusturma:new Date().toISOString()
    });
  }
  kaydet(); ciz();
}
function bSil(id){
  bSilAdayi=null;
  veri.borclar=veri.borclar.filter(function(r){ return r.id!==id; });
  kaydet(); ciz();
}
function cizBorcForm(govde){
  govde.innerHTML="";
  var card=el("div","card");
  var seg=el("div","seg");
  var ba=el("button",null,"Alacağım"), bb=el("button",null,"Borcum");
  ba.type="button"; bb.type="button";
  function yonCiz(){
    ba.setAttribute("aria-pressed",formYon==="alacak"?"true":"false");
    bb.setAttribute("aria-pressed",formYon==="borc"?"true":"false");
  }
  ba.addEventListener("click",function(){ formYon="alacak"; yonCiz(); });
  bb.addEventListener("click",function(){ formYon="borc"; yonCiz(); });
  yonCiz(); seg.appendChild(ba); seg.appendChild(bb); card.appendChild(seg);

  var kisi=alan(card,"Kişi / kurum","text","Örn. Ali");
  var tutar=alan(card,"Tutar (₺)","text","0,00"); tutar.inputMode="decimal";
  var vade=alan(card,"Vade tarihi","date","");
  var not=alan(card,"Not (isteğe bağlı)","text","Örn. kombi tamiri");
  var kaydetBtn=el("button","ana genis","Kaydet"); kaydetBtn.type="button"; card.appendChild(kaydetBtn);
  var msg=el("p","durum"); msg.hidden=true; card.appendChild(msg);
  govde.appendChild(card);

  kaydetBtn.addEventListener("click",function(){
    var t=parseTutar(tutar.value);
    if(isNaN(t)){ msg.textContent="Geçerli bir tutar yaz."; msg.className="durum hata"; msg.hidden=false; return; }
    borcEkle({ yon:formYon, kisi:kisi.value.trim(), tutar:t, vade:vade.value||"",
      aciklama:not.value.trim(), durum:"acik", kapanis:"", olusturma:new Date().toISOString() });
    katmanAc("Alacak & Borç",cizBorc);
    cizEv();
  });
}

// ---------------------------------------------------------------- elle giriş
function cizElleForm(govde){
  govde.innerHTML="";
  var card=el("div","card");
  var seg=el("div","seg");
  var bg=el("button",null,"Gider"), bl=el("button",null,"Gelir");
  bg.type="button"; bl.type="button";
  var kat, taksitKutu;
  function turCiz(){
    bg.setAttribute("aria-pressed",formTur==="gider"?"true":"false");
    bl.setAttribute("aria-pressed",formTur==="gelir"?"true":"false");
    var onceki=kat.value;
    kat.innerHTML="";
    KAT[formTur].forEach(function(x){ var o=el("option",null,x); o.value=x; kat.appendChild(o); });
    if(KAT[formTur].indexOf(onceki)>-1) kat.value=onceki;
    taksitKutu.hidden=formTur!=="gider";
  }
  bg.addEventListener("click",function(){ formTur="gider"; turCiz(); });
  bl.addEventListener("click",function(){ formTur="gelir"; turCiz(); });
  seg.appendChild(bg); seg.appendChild(bl); card.appendChild(seg);

  var tutar=alan(card,"Tutar (₺)","text","0,00"); tutar.inputMode="decimal";
  var ikili=el("div","row2"); card.appendChild(ikili);
  kat=alan(ikili,"Kategori","select");
  var tarih=alan(ikili,"Tarih","date"); tarih.value=iso(new Date());
  taksitKutu=el("div","field");
  taksitKutu.appendChild(el("label",null,"Taksit"));
  var taksit=el("select");
  TAKSITLER.forEach(function(n){ var o=el("option",null,n===1?"Peşin":n+" taksit"); o.value=String(n); taksit.appendChild(o); });
  taksitKutu.appendChild(taksit); card.appendChild(taksitKutu);
  var acik=alan(card,"Açıklama (isteğe bağlı)","text","Örn. haftalık market");
  var isyeri=alan(card,"Nereden (isteğe bağlı)","text","Örn. A101");
  var kaydetBtn=el("button","ana genis","Kaydet"); kaydetBtn.type="button"; card.appendChild(kaydetBtn);
  var msg=el("p","durum"); msg.hidden=true; card.appendChild(msg);
  govde.appendChild(card);
  turCiz();

  kaydetBtn.addEventListener("click",function(){
    var t=parseTutar(tutar.value);
    if(isNaN(t)){ msg.textContent="Geçerli bir tutar yaz."; msg.className="durum hata"; msg.hidden=false; return; }
    var td=tarih.value||iso(new Date());
    kayitEkle({ tur:formTur, tutar:t, taksit:formTur==="gider"?Number(taksit.value):1,
      kategori:kat.value||"Diğer", tarih:td, aciklama:acik.value.trim(),
      isyeri:isyeri.value.trim(), olusturma:new Date().toISOString() });
    var p=td.split("-"); yil=Number(p[0]); ay=Number(p[1])-1;
    katmanKapat(); durum("Kayıt eklendi.",false); ciz();
  });
}

// ---------------------------------------------------------------- raporlar
function tablo(basliklar,satirlar,toplamSatiri){
  var sar=el("div"); sar.style.overflowX="auto";
  var t=el("table","tbl"), thead=el("thead"), tr=el("tr");
  basliklar.forEach(function(b,i){ tr.appendChild(el("th",i?"sag":null,b)); });
  thead.appendChild(tr); t.appendChild(thead);
  var tb=el("tbody");
  satirlar.forEach(function(s){
    var r=el("tr");
    s.forEach(function(h,i){ r.appendChild(el("td",i?"sag":"ad",h)); });
    tb.appendChild(r);
  });
  if(toplamSatiri){
    var r2=el("tr","toplam");
    toplamSatiri.forEach(function(h,i){ r2.appendChild(el("td",i?"sag":"ad",h)); });
    tb.appendChild(r2);
  }
  t.appendChild(tb); sar.appendChild(t); return sar;
}
function kategoriToplami(satirlar,tur){
  var kat={}, adet={}, genel=0;
  satirlar.forEach(function(s){
    if(s.r.tur!==tur) return;
    var k=s.r.kategori||"Diğer";
    kat[k]=(kat[k]||0)+s.pay; adet[k]=(adet[k]||0)+1; genel+=s.pay;
  });
  return { sirali:Object.keys(kat).sort(function(a,b){ return kat[b]-kat[a]; }), kat:kat, adet:adet, genel:genel };
}
// ---- rapor yardımcıları ----
function svgEl(ad,ozellikler){
  var e=document.createElementNS("http://www.w3.org/2000/svg",ad);
  for(var k in ozellikler) if(ozellikler.hasOwnProperty(k)) e.setAttribute(k,ozellikler[k]);
  return e;
}
// Aylık sütun grafiği: [{etiket, gelir, gider}]
function sutunGrafik(aylar){
  var sar=el("div","grafik");
  if(!aylar.length) return sar;
  var G=320, Y=118, altPay=18, solPay=2;
  var svg=svgEl("svg",{viewBox:"0 0 "+G+" "+Y,preserveAspectRatio:"none",role:"img"});
  svg.setAttribute("aria-label","Aylık gelir gider grafiği");
  var enB=0;
  aylar.forEach(function(a){ enB=Math.max(enB,a.gelir,a.gider); });
  if(!enB) enB=1;
  var alan=Y-altPay, n=aylar.length;
  var grupG=(G-solPay*2)/n, barG=Math.min(13,grupG/2.6), bosluk=2;
  // taban çizgisi
  svg.appendChild(svgEl("line",{x1:0,y1:alan,x2:G,y2:alan,class:"eksen"}));
  aylar.forEach(function(a,i){
    var merkez=solPay+grupG*i+grupG/2;
    [["gelir",a.gelir,-1],["gider",a.gider,1]].forEach(function(p){
      var h=Math.max(a[p[0]]>0?2:0,Math.round(p[1]/enB*(alan-6)));
      if(!h) return;
      var x=merkez+(p[2]<0?-(barG+bosluk/2):bosluk/2);
      svg.appendChild(svgEl("rect",{x:x,y:alan-h,width:barG,height:h,rx:2,
        class:p[0]==="gelir"?"barGelir":"barGider"}));
    });
    var t=svgEl("text",{x:merkez,y:Y-5,class:"gEtiket","text-anchor":"middle"});
    t.textContent=a.etiket;
    svg.appendChild(t);
  });
  sar.appendChild(svg);
  var lej=el("div","lejant");
  var l1=el("span",null,"gelir"); l1.insertBefore(el("i","kutuGelir"),l1.firstChild);
  var l2=el("span",null,"gider"); l2.insertBefore(el("i","kutuGider"),l2.firstChild);
  lej.appendChild(l1); lej.appendChild(l2);
  sar.appendChild(lej);
  return sar;
}
// Yatay bar listesi: [{ad, tutar, adet, degisim}]
function barListesi(satirlar,toplam,tiklaFn,renkSinif){
  var kutu=el("div","barlar");
  var enB=satirlar.length?satirlar[0].tutar:1;
  satirlar.forEach(function(s){
    var sat=el(tiklaFn?"button":"div","barSatir");
    if(tiklaFn){ sat.type="button"; sat.addEventListener("click",function(){ tiklaFn(s); }); }
    var ust=el("div","barUst");
    var ad=el("span","barAd",s.ad);
    var sag=el("span","barTut",para(s.tutar));
    ust.appendChild(ad); ust.appendChild(sag);
    sat.appendChild(ust);
    var track=el("div","track");
    var fill=el("div","fill"+(renkSinif?" "+renkSinif:""));
    fill.style.width=Math.max(2,Math.round(s.tutar/enB*100))+"%";
    track.appendChild(fill); sat.appendChild(track);
    var alt=el("div","barAlt");
    var sol=el("span",null,"%"+Math.round(s.tutar/(toplam||1)*100)+(s.adet?" · "+s.adet+" kayıt":""));
    alt.appendChild(sol);
    if(s.degisim!==undefined&&s.degisim!==null){
      var d=el("span","degisim "+(s.degisim>0?"artis":(s.degisim<0?"azalis":"")));
      d.textContent=(s.degisim>0?"▲ ":(s.degisim<0?"▼ ":"– "))+
        (isFinite(s.degisim)?Math.abs(Math.round(s.degisim))+"%":"yeni");
      alt.appendChild(d);
    }
    sat.appendChild(alt);
    kutu.appendChild(sat);
  });
  return kutu;
}
function kutuSatiri(parent,etiket,deger,sinif){
  var s=el("div","ozetSatir");
  s.appendChild(el("span",null,etiket));
  s.appendChild(el("b",sinif||null,deger));
  parent.appendChild(s);
}
function gecmisAylar(sayi,bitisYil,bitisAy){
  var out=[], y=bitisYil, a=bitisAy;
  for(var i=0;i<sayi;i++){
    var s=aySatirlari(y,a), gelir=0, gider=0;
    s.forEach(function(x){ if(x.r.tur==="gelir") gelir+=x.pay; else gider+=x.pay; });
    out.unshift({etiket:AYLAR[a].slice(0,3),y:y,a:a,gelir:gelir,gider:gider});
    a--; if(a<0){ a=11; y--; }
  }
  return out;
}
// Bir kategorinin o ayki kayıtları
function kategoriDetay(baslik,satirlar){
  katmanAc(baslik,function(govde){
    govde.innerHTML="";
    var toplam=satirlar.reduce(function(t,s){ return t+s.pay; },0);
    govde.appendChild(el("p","ozetUst",satirlar.length+" kayıt · "+para(toplam)));
    var kutu=el("div");
    satirlar.slice().sort(function(a,b){ return b.pay-a.pay; }).forEach(function(s){
      var e=el("div","hr");
      e.appendChild(el("div","mark"+(s.r.tur==="gelir"?" g":"")));
      var t=el("div","txt");
      t.appendChild(el("div","ad",s.r.aciklama||s.r.kategori));
      var alt=[kisaTarih(s.tarih)];
      if(s.r.isyeri) alt.push(s.r.isyeri);
      if(s.adet>1) alt.push(s.sira+"/"+s.adet+" taksit");
      t.appendChild(el("div","alt",alt.join(" · ")));
      e.appendChild(t);
      e.appendChild(el("div","tut "+(s.r.tur==="gelir"?"pos":"neg"),para(s.pay)));
      kutu.appendChild(e);
    });
    govde.appendChild(kutu);
  });
}

// "Her şey dahil" neyden oluşuyor
function cizNetDetay(govde){
  govde.innerHTML="";
  var satirlar=aySatirlari(yil,ay), gelir=0, gider=0;
  satirlar.forEach(function(x){ if(x.r.tur==="gelir") gelir+=x.pay; else gider+=x.pay; });
  var kalan=gelir-gider;
  var acik=acikBorclar(), ta=0, tb=0;
  acik.forEach(function(r){ if(r.yon==="alacak") ta+=r.tutar; else tb+=r.tutar; });
  var yuk=gelecekTaksitYuku();
  var net=kalan+ta-tb-yuk;

  govde.appendChild(el("p","ozetUst",
    AYLAR[ay]+" "+yil+" · bu ayın kalanı ile açık hesapların toplamı"));

  var hesap=el("div","card");
  function kalem(etiket,tutar,isaret,tiklaFn){
    var s=el(tiklaFn?"button":"div","hesapSatir");
    if(tiklaFn){ s.type="button"; s.addEventListener("click",tiklaFn); }
    var sol=el("div","hesapSol");
    sol.appendChild(el("span","hesapIsaret"+(isaret==="+"?" arti":(isaret==="−"?" eksi":"")),isaret||""));
    var m=el("div","hesapAd",etiket);
    sol.appendChild(m);
    s.appendChild(sol);
    var sag=el("span","hesapTut"+(tutar<0?" neg":(tutar>0&&isaret==="+"?" pos":"")),
      para(Math.abs(tutar)));
    s.appendChild(sag);
    if(tiklaFn) s.appendChild(el("span","okMini","›"));
    hesap.appendChild(s);
  }

  kalem("Bu ay kalan (gelir − gider)",kalan,kalan<0?"−":"+",function(){
    katmanAc("Hareketler",cizHareketler);
  });
  if(ta) kalem("Açık alacağın",ta,"+",function(){ katmanAc("Alacak & Borç",cizBorc); });
  if(tb) kalem("Açık borcun",tb,"−",function(){ katmanAc("Alacak & Borç",cizBorc); });
  if(yuk) kalem("Gelecek aylara kalan taksit",yuk,"−",function(){ katmanAc("Taksitler",cizTaksitler); });

  var son=el("div","hesapSatir hesapSon");
  son.appendChild(el("div","hesapAd","HER ŞEY DAHİL"));
  son.appendChild(el("span","hesapTut "+(net>=0?"pos":"neg"),(net<0?"−":"")+para(Math.abs(net))));
  hesap.appendChild(son);
  govde.appendChild(hesap);

  var not=el("p","bilgi");
  not.textContent=net>=0
    ? "Açık hesapların kapansa ve taksitlerin bitse elinde bu kadar kalır."
    : "Açık hesapların kapansa ve taksitlerin bitse bu kadar açığın olur.";
  govde.appendChild(not);

  if(!ta&&!tb&&!yuk){
    var y=el("p","bilgi");
    y.textContent="Şu an açık alacak, borç ya da taksit yok; bu yüzden bu ayın kalanıyla aynı.";
    govde.appendChild(y);
  }
}

// Gelecek aylara kalan taksitlerin dökümü
function cizTaksitler(govde){
  govde.innerHTML="";
  var simdi=ayKey(yil,ay), liste=[];
  veri.kayitlar.forEach(function(r){
    if(r.tur==="gelir") return;
    var n=taksitSayisi(r); if(n<2) return;
    var yayilim=taksitYayilimi(r), kalanAdet=0, oduk=0;
    yayilim.forEach(function(x){ if(x.anahtar>simdi) kalanAdet++; else oduk++; });
    if(kalanAdet) liste.push({r:r,pay:yayilim[0].pay,kalanAdet:kalanAdet,oduk:oduk,adet:n,
      ilk:yayilim[0].tarih,son:yayilim[n-1].tarih});
  });
  if(!liste.length){ govde.appendChild(el("p","durum","Gelecek aylara kalan taksit yok.")); return; }
  liste.sort(function(a,b){ return (b.kalanAdet*b.pay)-(a.kalanAdet*a.pay); });
  var toplam=liste.reduce(function(t,x){ return t+x.kalanAdet*x.pay; },0);
  govde.appendChild(el("p","ozetUst",liste.length+" taksitli harcama · toplam kalan "+para(toplam)));
  var c=el("div","card");
  c.appendChild(tablo(["Harcama","Durum","Aylık","Kalan"],
    liste.map(function(x){
      return [(x.r.aciklama||x.r.kategori)+" · son "+kisaTarih(x.son),
        x.oduk+"/"+x.adet+" ödendi", paraK(x.pay), paraK(x.kalanAdet*x.pay)];
    }),
    ["TOPLAM","","",paraK(toplam)]));
  govde.appendChild(c);
}

function cizAylikRapor(govde){
  govde.innerHTML="";
  var satirlar=aySatirlari(yil,ay);
  var gelir=0, gider=0;
  satirlar.forEach(function(s){ if(s.r.tur==="gelir") gelir+=s.pay; else gider+=s.pay; });

  govde.appendChild(el("p","ozetUst",AYLAR[ay]+" "+yil+" · "+satirlar.length+" hareket"));

  // özet kutuları
  var ozet=el("div","card");
  kutuSatiri(ozet,"Toplam gelir",para(gelir),"pos");
  kutuSatiri(ozet,"Toplam gider",para(gider),"neg");
  kutuSatiri(ozet,"Kalan",(gelir-gider<0?"−":"")+para(Math.abs(gelir-gider)),(gelir-gider)>=0?"pos":"neg");
  govde.appendChild(ozet);

  // bu ay devam ediyorsa: günlük ortalama ve ay sonu tahmini
  var simdi=new Date();
  if(yil===simdi.getFullYear()&&ay===simdi.getMonth()&&gider>0){
    var gecen=simdi.getDate(), toplamGun=new Date(yil,ay+1,0).getDate();
    var gunluk=gider/gecen, tahmin=gunluk*toplamGun;
    var tempo=el("div","card");
    kutuSatiri(tempo,"Günlük ortalama gider",para(gunluk));
    kutuSatiri(tempo,"Bu gidişle ay sonu",para(tahmin),"neg");
    if(gelir>0) kutuSatiri(tempo,"Ay sonu kalan tahmini",
      (gelir-tahmin<0?"−":"")+para(Math.abs(gelir-tahmin)),(gelir-tahmin)>=0?"pos":"neg");
    govde.appendChild(tempo);
  }

  // son 6 ay trendi
  var son6=gecmisAylar(6,yil,ay);
  if(son6.some(function(a){ return a.gelir||a.gider; })){
    var b=el("section");
    b.appendChild(el("h3",null,"Son 6 ay"));
    var c=el("div","card");
    c.appendChild(sutunGrafik(son6));
    var oncekiler=son6.slice(0,5).filter(function(a){ return a.gider>0; });
    if(oncekiler.length){
      var ort=oncekiler.reduce(function(t,a){ return t+a.gider; },0)/oncekiler.length;
      var fark=ort?Math.round((gider-ort)/ort*100):0;
      var n=el("p","bilgi");
      n.style.margin="10px 0 0";
      n.textContent="Önceki "+oncekiler.length+" ayın gider ortalaması "+para(ort)+". "+
        (fark>0?"Bu ay %"+fark+" üstündesin.":(fark<0?"Bu ay %"+Math.abs(fark)+" altındasın.":"Bu ay ortalamadasın."));
      c.appendChild(n);
    }
    b.appendChild(c); govde.appendChild(b);
  }

  // kategoriler (önceki aya göre değişimle)
  var oy=yil, oa=ay-1; if(oa<0){ oa=11; oy--; }
  var onceki=aySatirlari(oy,oa);
  function katTopla(liste,tur){
    var m={};
    liste.forEach(function(s){
      if(s.r.tur!==tur) return;
      var k=s.r.kategori||"Diğer";
      if(!m[k]) m[k]={tutar:0,adet:0,satirlar:[]};
      m[k].tutar+=s.pay; m[k].adet++; m[k].satirlar.push(s);
    });
    return m;
  }
  [["gider","Gider kategorileri",gider],["gelir","Gelir kategorileri",gelir]].forEach(function(p){
    var m=katTopla(satirlar,p[0]), oncekiM=katTopla(onceki,p[0]);
    var liste=Object.keys(m).map(function(k){
      var o=oncekiM[k]?oncekiM[k].tutar:0;
      return { ad:k, tutar:m[k].tutar, adet:m[k].adet, satirlar:m[k].satirlar,
               degisim:o>0?((m[k].tutar-o)/o*100):(m[k].tutar>0?Infinity:0) };
    }).sort(function(a,b){ return b.tutar-a.tutar; });
    if(!liste.length) return;
    var b=el("section");
    b.appendChild(el("h3",null,p[1]));
    var c=el("div","card");
    c.appendChild(barListesi(liste,p[2],function(s){
      kategoriDetay(s.ad+" · "+AYLAR[ay]+" "+yil,s.satirlar);
    },p[0]==="gelir"?"g":""));
    var tp=el("div","ozetSatir");
    tp.style.marginTop="6px";
    tp.appendChild(el("span",null,"TOPLAM"));
    tp.appendChild(el("b",p[0]==="gelir"?"pos":"neg",para(p[2])));
    c.appendChild(tp);
    b.appendChild(c); govde.appendChild(b);
  });

  // en büyük harcamalar
  var enler=satirlar.filter(function(s){ return s.r.tur!=="gelir"; })
    .sort(function(a,b){ return b.pay-a.pay; }).slice(0,5);
  if(enler.length>1){
    var b2=el("section");
    b2.appendChild(el("h3",null,"En büyük 5 harcama"));
    var c2=el("div","card");
    c2.appendChild(tablo(["Harcama","Kategori","Tutar"],
      enler.map(function(s){
        return [(s.r.aciklama||s.r.kategori),s.r.kategori,para(s.pay)];
      })));
    b2.appendChild(c2); govde.appendChild(b2);
  }

  // nereden (işyeri)
  var yer={};
  satirlar.forEach(function(s){
    if(s.r.tur==="gelir"||!s.r.isyeri) return;
    yer[s.r.isyeri]=(yer[s.r.isyeri]||0)+s.pay;
  });
  var yerListe=Object.keys(yer).map(function(k){ return {ad:k,tutar:yer[k]}; })
    .sort(function(a,b){ return b.tutar-a.tutar; }).slice(0,8);
  if(yerListe.length){
    var b3=el("section");
    b3.appendChild(el("h3",null,"Nereden harcadın"));
    var c3=el("div","card");
    c3.appendChild(barListesi(yerListe,gider,null,""));
    b3.appendChild(c3); govde.appendChild(b3);
  }

  // taksitler
  var taksitli=satirlar.filter(function(s){ return s.adet>1; });
  if(taksitli.length){
    var b4=el("section");
    b4.appendChild(el("h3",null,"Bu ayki taksitler"));
    var c4=el("div","card");
    c4.appendChild(tablo(["Harcama","Taksit","Bu ay","Kalan"],
      taksitli.map(function(s){
        return [(s.r.aciklama||s.r.kategori),s.sira+"/"+s.adet,paraK(s.pay),
          paraK(Math.round((s.adet-s.sira)*s.pay*100)/100)];
      }),
      ["TOPLAM","",paraK(taksitli.reduce(function(a,s){ return a+s.pay; },0)),
       paraK(taksitli.reduce(function(a,s){ return a+(s.adet-s.sira)*s.pay; },0))]));
    b4.appendChild(c4); govde.appendChild(b4);
  }

  var d=el("button","ana genis","Bu ayı CSV olarak indir"); d.type="button";
  d.addEventListener("click",csvIndir);
  govde.appendChild(d);
}

function cizToplamRapor(govde){
  govde.innerHTML="";
  if(!veri.kayitlar.length){ govde.appendChild(el("p","durum","Henüz kayıt yok.")); return; }

  var aylar={}, yillar={};
  veri.kayitlar.forEach(function(r){
    taksitYayilimi(r).forEach(function(x){
      if(!aylar[x.anahtar]) aylar[x.anahtar]={gelir:0,gider:0,y:x.y,a:x.a};
      if(!yillar[x.y]) yillar[x.y]={gelir:0,gider:0};
      if(r.tur==="gelir"){ aylar[x.anahtar].gelir+=x.pay; yillar[x.y].gelir+=x.pay; }
      else { aylar[x.anahtar].gider+=x.pay; yillar[x.y].gider+=x.pay; }
    });
  });
  var anahtar=Object.keys(aylar).sort(), tg=0, td=0;
  anahtar.forEach(function(k){ tg+=aylar[k].gelir; td+=aylar[k].gider; });

  govde.appendChild(el("p","ozetUst",
    veri.kayitlar.length+" kayıt · "+anahtar.length+" ay · "+
    AYLAR[aylar[anahtar[0]].a]+" "+aylar[anahtar[0]].y+" – "+
    AYLAR[aylar[anahtar[anahtar.length-1]].a]+" "+aylar[anahtar[anahtar.length-1]].y));

  var ozet=el("div","card");
  kutuSatiri(ozet,"Toplam gelir",para(tg),"pos");
  kutuSatiri(ozet,"Toplam gider",para(td),"neg");
  kutuSatiri(ozet,"Fark",(tg-td<0?"−":"")+para(Math.abs(tg-td)),(tg-td)>=0?"pos":"neg");
  kutuSatiri(ozet,"Aylık ortalama gider",para(td/(anahtar.length||1)));
  govde.appendChild(ozet);

  // son 12 ay grafiği
  var sonAy=aylar[anahtar[anahtar.length-1]];
  var son12=gecmisAylar(Math.min(12,anahtar.length+1),sonAy.y,sonAy.a);
  var bg=el("section");
  bg.appendChild(el("h3",null,"Ay ay seyir"));
  var cg=el("div","card");
  cg.appendChild(sutunGrafik(son12));
  bg.appendChild(cg); govde.appendChild(bg);

  // yıl özeti
  var yilAnahtar=Object.keys(yillar).sort().reverse();
  if(yilAnahtar.length>1){
    var by=el("section");
    by.appendChild(el("h3",null,"Yıl özeti"));
    var cy=el("div","card");
    cy.appendChild(tablo(["Yıl","Gelir","Gider","Kalan"],
      yilAnahtar.map(function(y){
        return [y,paraK(yillar[y].gelir),paraK(yillar[y].gider),paraK(yillar[y].gelir-yillar[y].gider)];
      }),
      ["TOPLAM",paraK(tg),paraK(td),paraK(tg-td)]));
    by.appendChild(cy); govde.appendChild(by);
  }

  // ay ay tablo
  var b1=el("section");
  b1.appendChild(el("h3",null,"Ay ay"));
  var c1=el("div","card");
  c1.appendChild(tablo(["Ay","Gelir","Gider","Kalan"],
    anahtar.slice().reverse().map(function(k){
      var m=aylar[k];
      return [AYLAR[m.a]+" "+m.y,paraK(m.gelir),paraK(m.gider),paraK(m.gelir-m.gider)];
    }),
    ["GENEL TOPLAM",paraK(tg),paraK(td),paraK(tg-td)]));
  b1.appendChild(c1); govde.appendChild(b1);

  // tüm zamanlar kategorileri
  var hepsi=veri.kayitlar.map(function(r){ return { r:r, pay:r.tutar, sira:1, adet:1, tarih:r.tarih }; });
  [["gider","Tüm zamanlar · gider",td,""],["gelir","Tüm zamanlar · gelir",tg,"g"]].forEach(function(p){
    var m={};
    hepsi.forEach(function(s){
      if(s.r.tur!==p[0]) return;
      var k=s.r.kategori||"Diğer";
      if(!m[k]) m[k]={tutar:0,adet:0,satirlar:[]};
      m[k].tutar+=s.pay; m[k].adet++; m[k].satirlar.push(s);
    });
    var liste=Object.keys(m).map(function(k){
      return {ad:k,tutar:m[k].tutar,adet:m[k].adet,satirlar:m[k].satirlar};
    }).sort(function(a,b){ return b.tutar-a.tutar; });
    if(!liste.length) return;
    var b=el("section");
    b.appendChild(el("h3",null,p[1]));
    var c=el("div","card");
    c.appendChild(barListesi(liste,p[2],function(s){
      kategoriDetay(s.ad+" · tüm zamanlar",s.satirlar);
    },p[3]));
    b.appendChild(c); govde.appendChild(b);
  });

  // mağazalar
  var yer={};
  veri.kayitlar.forEach(function(r){
    if(r.tur==="gelir"||!r.isyeri) return;
    yer[r.isyeri]=(yer[r.isyeri]||0)+r.tutar;
  });
  var yerListe=Object.keys(yer).map(function(k){ return {ad:k,tutar:yer[k]}; })
    .sort(function(a,b){ return b.tutar-a.tutar; }).slice(0,10);
  if(yerListe.length){
    var b3=el("section");
    b3.appendChild(el("h3",null,"En çok harcadığın yerler"));
    var c3=el("div","card");
    c3.appendChild(barListesi(yerListe,td,null,""));
    b3.appendChild(c3); govde.appendChild(b3);
  }

  // en pahalı kalemler
  var pahali=veri.kayitlar.filter(function(r){ return r.tur!=="gelir"; })
    .sort(function(a,b){ return b.tutar-a.tutar; }).slice(0,10);
  if(pahali.length>1){
    var b4=el("section");
    b4.appendChild(el("h3",null,"En pahalı 10 harcama"));
    var c4=el("div","card");
    c4.appendChild(tablo(["Harcama","Tarih","Tutar"],
      pahali.map(function(r){
        return [(r.aciklama||r.kategori),kisaTarih(r.tarih),
          para(r.tutar)+(taksitSayisi(r)>1?" ("+taksitSayisi(r)+" tks)":"")];
      })));
    b4.appendChild(c4); govde.appendChild(b4);
  }

  // alacak & borç
  var ta=0, tb2=0, ka=0, kb=0;
  veri.borclar.forEach(function(r){
    if(r.durum==="kapandi"){ if(r.yon==="alacak") ka+=r.tutar; else kb+=r.tutar; }
    else { if(r.yon==="alacak") ta+=r.tutar; else tb2+=r.tutar; }
  });
  if(ta||tb2||ka||kb){
    var bb=el("section");
    bb.appendChild(el("h3",null,"Alacak & borç"));
    var cb=el("div","card");
    kutuSatiri(cb,"Açık alacak",para(ta),"pos");
    kutuSatiri(cb,"Açık borç",para(tb2),"neg");
    kutuSatiri(cb,"Tahsil edilen",para(ka));
    kutuSatiri(cb,"Ödenen",para(kb));
    bb.appendChild(cb); govde.appendChild(bb);
  }
}

// ---------------------------------------------------------------- yerel çözümleyici
function tarihBul(d){
  var bugunD=new Date();
  if(/\bbugun\b/.test(d)) return iso(bugunD);
  if(/\bdun\b/.test(d)){ var y=new Date(); y.setDate(y.getDate()-1); return iso(y); }
  if(/evvelsi gun|onceki gun/.test(d)){ var e=new Date(); e.setDate(e.getDate()-2); return iso(e); }
  if(/\bgecen hafta\b/.test(d)){ var h=new Date(); h.setDate(h.getDate()-7); return iso(h); }
  var ayin=d.match(/ayin\s+(\d{1,2})/);
  if(ayin){
    var istenen=Number(ayin[1]);
    var y=bugunD.getFullYear(), m=bugunD.getMonth();
    var t=new Date(y,m,Math.min(istenen,new Date(y,m+1,0).getDate()));
    if(iso(t)<iso(bugunD)){
      m++; if(m>11){ m=0; y++; }
      t=new Date(y,m,Math.min(istenen,new Date(y,m+1,0).getDate()));
    }
    return iso(t);
  }
  var nokta=d.match(/(^|[^\d])(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?([^\d]|$)/);
  if(nokta){
    var gun=Number(nokta[2]), ayNo=Number(nokta[3]);
    if(gun>=1&&gun<=31&&ayNo>=1&&ayNo<=12){
      var yy=nokta[4]?Number(nokta[4]):bugunD.getFullYear();
      if(yy<100) yy+=2000;
      return iso(new Date(yy,ayNo-1,gun));
    }
  }
  return iso(bugunD);
}
// Kelime sonunda kalabilecek geçerli Türkçe ekler (gevşek eşleşme için)
var EKLER_SON=/^(|[aeıioöuü]|de|da|te|ta|den|dan|ten|tan|ye|ya|yi|yı|yu|yü|ler|lar|in|ın|un|ün|nin|nın|nun|nün|le|la|yle|yla|si|sı|su|sü|im|ım|um|üm|miz|mız|muz|müz|niz|nız|nuz|nüz|ndan|nden|na|ne|ni|nı|nu|nü)$/;

function kelimeVar(metin,kelime){
  // tam kelime eşleşmesi: "taksit" içindeki "taksi" eşleşmesin
  var k=sadelestir(kelime).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return new RegExp("(^|[^a-z0-9])"+k+"([^a-z0-9]|$)").test(metin);
}
function kategoriBul(d,tur){
  var liste=tur==="gelir"?IPUCU_GELIR:IPUCU_GIDER;
  // Önce çok kelimeli ifadeler: "bulaşık makinesi" tek başına "bulaşık"ı yensin
  var cokluEslesme=null, enUzun=0;
  for(var c=0;c<liste.length;c++){
    for(var e=0;e<liste[c][1].length;e++){
      var ifade=liste[c][1][e];
      if(ifade.indexOf(" ")<0) continue;
      if(d.indexOf(sadelestir(ifade))>-1&&ifade.length>enUzun){
        enUzun=ifade.length; cokluEslesme=liste[c][0];
      }
    }
  }
  if(cokluEslesme) return cokluEslesme;
  for(var i=0;i<liste.length;i++){
    var kelimeler=liste[i][1];
    for(var j=0;j<kelimeler.length;j++){
      if(kelimeVar(d,kelimeler[j])) return liste[i][0];
    }
  }
  // tam eşleşme yoksa çekim ekli hâlleri dene: "markete", "eczaneden".
  // Kelimenin sonunda kalan parça gerçek bir Türkçe ek olmalı; böylece
  // "taksitle" içindeki "taksi" gibi yanlış eşleşmeler elenir.
  for(var a=0;a<liste.length;a++){
    for(var b=0;b<liste[a][1].length;b++){
      var kk=sadelestir(liste[a][1][b]);
      if(kk.length<4) continue;
      var re=new RegExp("(^|[^a-z0-9])"+kk.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"([a-z]*)","g");
      var m;
      while((m=re.exec(d))!==null){
        if(EKLER_SON.test(m[2])) return liste[a][0];
        re.lastIndex=m.index+m[0].length;
      }
    }
  }
  return "Diğer";
}
function kisiBul(cumle){
  // Büyük harfle başlayan kelimeyi bul, Türkçe çekim ekini kırp (uzun ekten kısaya)
  var EKLER=["nden","ndan","nin","nın","nun","nün","den","dan","ten","tan",
             "ler","lar","ye","ya","in","ın","un","ün","e","a","i","ı"];
  var kelimeler=String(cumle).match(/[A-ZÇĞİÖŞÜ][a-zçğıöşüA-ZÇĞİÖŞÜ'’]{1,18}/g);
  if(!kelimeler) return "";
  for(var i=0;i<kelimeler.length;i++){
    var k=kelimeler[i].replace(/['’]/g," ").split(" ")[0]; // Ahmet'in -> Ahmet
    if(kelimeler[i].indexOf("'")>-1||kelimeler[i].indexOf("’")>-1) return k;
    for(var j=0;j<EKLER.length;j++){
      var e=EKLER[j];
      if(k.length>e.length+2&&k.slice(-e.length).toLocaleLowerCase("tr")===e) return k.slice(0,-e.length);
    }
    if(k.length>2) return k;
  }
  return "";
}
// Bir cümlede birden fazla "para tutarı" varsa cümleyi o tutarlara göre böler.
// "Markete 400 TL verdim Ahmet'in de borcu var bana 1000 TL" -> iki parça.
var FIIL=/^(verdim|verdik|odedim|odedik|aldim|aldik|harcadim|yatirdim|cektim|gitti|yatti|geldi|kaldi|var|oldu)$/;
function tutarYerleri(cumle){
  var d=sadelestir(cumle), yerler=[], re=/(^|[^a-z0-9])(\d[\d.,]*)(?=[^a-z0-9]|$)/g, m;
  while((m=re.exec(d))!==null){
    var bas=m.index+m[1].length, son=bas+m[2].length;
    var oncesi=d.slice(Math.max(0,bas-12),bas);
    var sonrasi=d.slice(son,son+14);
    var tarihMi=/ayin\s*$/.test(oncesi)||/^\s*[./]\d/.test(sonrasi)||/[./]$/.test(oncesi)
      ||/^\d{1,2}[./]\d{1,2}([./]\d{2,4})?$/.test(m[2]);   // 15.11 ya da 15.11.2026
    var taksitMi=/^\s*(taksit|tane|adet|numara|no\b|kisi)/.test(sonrasi);
    if(!tarihMi&&!taksitMi&&!isNaN(parseTutar(m[2]))) yerler.push({bas:bas,son:son});
    re.lastIndex=son;
  }
  return yerler;
}
function cumleBol(cumle){
  var yerler=tutarYerleri(cumle);
  if(yerler.length<2) return [cumle];
  var d=sadelestir(cumle), parcalar=[], basla=0;
  for(var i=0;i<yerler.length-1;i++){
    // Tutardan sonraki birim ve fiili bu parçada bırak, kalanı sonraki parçaya ver
    var p=yerler[i].son;
    var kuyruk=d.slice(p,yerler[i+1].bas);
    var kelimeler=kuyruk.split(/\s+/).filter(function(x){ return x; });
    var kaydir=0, alinan=0;
    for(var j=0;j<kelimeler.length&&alinan<2;j++){
      var k=kelimeler[j].replace(/[^a-z]/g,"");
      if(!k) continue;
      if(k==="tl"||k==="lira"||FIIL.test(k)){
        kaydir=kuyruk.indexOf(kelimeler[j])+kelimeler[j].length;
        alinan++;
      } else break;
    }
    var kes=p+(kaydir||0);
    parcalar.push(cumle.slice(basla,kes));
    basla=kes;
  }
  parcalar.push(cumle.slice(basla));
  return parcalar.filter(function(x){ return x.trim(); });
}

function cozumle(metin){
  // rakam arasındaki virgülü (1.250,50) bölme
  var kaba=sayiSozcukleri(metin).split(/\n|;|,(?!\s*\d)| ve | ayrıca | bir de /i);
  var parcalar=[];
  kaba.forEach(function(c){ cumleBol(c).forEach(function(x){ parcalar.push(x); }); });
  var sonuc=[];
  parcalar.forEach(function(cumle){
    cumle=cumle.trim();
    if(!cumle) return;
    var d=sadelestir(cumle);
    // harfe yapışık sayıları (a101, 5 numara gibi) atla
    // tarih ve taksit sayılarını eleyip gerçek tutarları al
    var yerler=tutarYerleri(cumle);
    var sayilar=yerler.map(function(y){ return d.slice(y.bas,y.son); });
    var taksitM=d.match(/(\d{1,2})\s*taksit/);
    var taksit=taksitM?Math.min(60,Number(taksitM[1])):1;
    if(!sayilar.length) return;
    var tutar=NaN;
    for(var i=0;i<sayilar.length;i++){
      if(taksitM&&sayilar[i]===taksitM[1]) continue;
      var k=parseTutar(sayilar[i]);
      if(!isNaN(k)&&(isNaN(tutar)||k>tutar)) tutar=k;
    }
    if(isNaN(tutar)) return;
    var tip="gider";
    // tür tespitini rakamsız metin üzerinde yap: "bana 1000 borçlu" da yakalansın
    var dt=d.replace(/\d[\d.,]*/g," ").replace(/\s{2,}/g," ");
    var odendi=/odedim|odedik|odendi|kapattim|yatirdim/.test(dt);
    if(odendi&&!/borc verdim/.test(dt)){
      tip="gider";                       // "kredi kartı borcunu ödedim" -> gider
    }
    // bana borcu var / borç verdim / alacağım -> ALACAK
    else if(/alacag|borc verdim|borc verecek|bana borclu|bana borcu|bana verecek|borcu var|borclu bana/.test(dt))
      tip="alacak";
    // borcum var / borçluyum / ödeyeceğim -> BORC
    else if(/borcum|borcluyum|borc aldim|borc cektim|odeyecegim|odemem gerek|vermem gerek/.test(dt))
      tip="borc";
    else if(/cebimde|elimde|kasada|nakit var|param var|birikim|hesabimda|bakiye|acilis/.test(dt))
      tip="gelir";
    else if(/maas|yatti|kazandim|sattim|iade|prim aldim|ikramiye|kira geldi|para geldi|gelir/.test(dt))
      tip="gelir";
    // taksit ifadesi kategori tahminini bozmasın
    var dKat=d.replace(/\d*\s*taksit\w*/g," ").replace(/\s{2,}/g," ");
    var kat=tip==="gelir"||tip==="gider"?kategoriBul(dKat,tip==="gelir"?"gelir":"gider"):"";
    var temiz=cumle
      .replace(/ay[ıi]n\s+\d{1,2}\s*['’]?\s*[a-zçğıöşü]*/gi,"")
      .replace(/\d{1,2}\s*taksit/gi,"")
      // tutar + birim + ona yapışan ek: "40 tl'ye", "500 liralık", "1.200₺den"
      .replace(/(^|[^0-9A-Za-zÇĞİÖŞÜçğıöşü])\d[\d.,]*\s*(tl|lira|₺)?\s*['’]?\s*(ye|ya|yi|yı|lik|lık|luk|lük|den|dan|ten|tan|e|a)?\b/gi,"$1")
      // başta kalan tek başına ek parçaları at
      .replace(/^\s*['’]?\s*(ye|ya|yi|yı|lik|lık|luk|lük|den|dan|ten|tan|lira|tl)\b/i,"")
      .replace(/\s{2,}/g," ").replace(/^[\s,.;:'’-]+|[\s,.;:'’-]+$/g,"").trim();
    sonuc.push({
      tip:tip, tutar:tutar, taksit:tip==="gider"?taksit:1, kategori:kat,
      kisi:(tip==="alacak"||tip==="borc")?kisiBul(cumle):"",
      tarih:tarihBul(d), isyeri:"",
      aciklama:(temiz||kat||"Kayıt").slice(0,70)
    });
  });
  return sonuc;
}

$("cevir").addEventListener("click",function(){
  var metin=$("girdi").value.trim();
  if(!metin){ durum("Önce bir şeyler yaz ya da 🎙 ile söyle.",false); return; }
  var girdiler=cozumle(metin);
  if(!girdiler.length){
    durum("Buradan kayıt çıkaramadım. Tutarı rakamla yaz: “markete 420 lira”.",true);
    return;
  }
  durum("",false);
  katmanAc("Kayıtları onayla",function(govde){
    govde.innerHTML="";
    var card=el("div","card");
    card.appendChild(el("p","ozetUst",girdiler.length+" kayıt çıkardım, kontrol et:"));
    incelemeCiz(card,girdiler,function(sonuc){
      katmanKapat(); durum(sonuc,false); $("girdi").value=""; ciz();
    });
    govde.appendChild(card);
  });
});

// ---------------------------------------------------------------- fiş okuma (Gemini)
var GEMINI_ANAHTAR="kasa-gemini-key", GEMINI_MODEL="kasa-gemini-model";
var API="https://generativelanguage.googleapis.com/v1beta/";

// Ana ekrana eklenmiş uygulama mı, yoksa tarayıcı sekmesi mi?
function arayuzUygulama(){
  try{
    return window.navigator.standalone===true ||
      (window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches);
  }catch(e){ return false; }
}

function anahtarAl(){ try{ return localStorage.getItem(GEMINI_ANAHTAR)||""; }catch(e){ return ""; } }
function anahtarYaz(v){ try{ localStorage.setItem(GEMINI_ANAHTAR,v); }catch(e){} }
function modelAl(){ try{ return localStorage.getItem(GEMINI_MODEL)||""; }catch(e){ return ""; } }
function modelYaz(v){ try{ localStorage.setItem(GEMINI_MODEL,v); }catch(e){} }

// Hesapta hangi görsel okuyabilen model varsa onu bul (model adları zamanla değişiyor)
function modelBul(anahtar){
  return fetch(API+"models?key="+encodeURIComponent(anahtar))
    .then(function(y){
      if(!y.ok) return y.json().then(function(h){ throw h; },function(){ throw {status:y.status}; });
      return y.json();
    })
    .then(function(o){
      var liste=(o.models||[]).filter(function(m){
        return (m.supportedGenerationMethods||[]).indexOf("generateContent")>-1
          && /flash/i.test(m.name) && !/thinking|audio|image-generation|tts|embedding|live/i.test(m.name);
      }).map(function(m){ return m.name.replace(/^models\//,""); });
      if(!liste.length) throw {hata:"model-yok"};
      // önce lite olmayan, sonra en yüksek sürüm
      function puan(ad){
        var s=0;
        if(!/lite/i.test(ad)) s+=100;
        if(!/preview|exp/i.test(ad)) s+=20;
        var v=ad.match(/(\d+(?:\.\d+)?)/);
        if(v) s+=parseFloat(v[1]);
        return s;
      }
      liste.sort(function(a,b){ return puan(b)-puan(a); });
      return liste[0];
    });
}

// Fotoğrafı küçült: hem hızlı gitsin hem kota yemesin
function kucult(dosya){
  return new Promise(function(coz,red){
    var fr=new FileReader();
    fr.onerror=function(){ red({hata:"okunamadi"}); };
    fr.onload=function(){
      var img=new Image();
      img.onerror=function(){ red({hata:"okunamadi"}); };
      img.onload=function(){
        var enBuyuk=1600, o=Math.min(1,enBuyuk/Math.max(img.width,img.height));
        var w=Math.round(img.width*o), h=Math.round(img.height*o);
        var c=document.createElement("canvas"); c.width=w; c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        var veri=c.toDataURL("image/jpeg",0.82);
        coz(veri.slice(veri.indexOf(",")+1));
      };
      img.src=fr.result;
    };
    fr.readAsDataURL(dosya);
  });
}

function fisIstegi(){
  return "Bu fotoğraf bir Türkçe market fişi veya faturası. HER ürün satırını tek tek oku, "+
    "hiçbirini atlama ve birleştirme.\n"+
    "Yalnızca şu şemada JSON döndür:\n"+
    '{"isyeri":string,"tarih":"YYYY-AA-GG","kalemler":[{"ad":string,"adet":number,"tutar":number,"kategori":string}]}\n'+
    "ad: ürünün fişteki adı, marka ve gramaj dahil, okunaklı Türkçeyle (örn. \"Prima Bebek Bezi 5 No 68'li\"). "+
    "Kısaltmaları makul şekilde aç, uydurma ekleme yapma.\n"+
    "adet: o satırdaki miktar, yoksa 1. tutar: o satırın toplam tutarı, ondalık ayırıcı nokta (149.90).\n"+
    "isyeri: mağaza adının kısa hali (A101, Migros, BİM), ünvan ekleri olmadan. tarih: fişteki tarih.\n"+
    "KDV, ara toplam, toplam, nakit, kredi kartı, para üstü, puan satırlarını kalem sayma; "+
    "bir kalemin kendi indirimi varsa tutarı indirimli yaz.\n"+
    "kategori şu listeden biri: "+KAT.gider.join(", ")+". "+
    "Örnek eşleştirme: bebek bezi/mama/ıslak mendil → Bebek & Çocuk; deterjan/çamaşır suyu → Temizlik; "+
    "şampuan/diş macunu → Kozmetik & Bakım; bira/şarap/sigara → Alkol & Tütün; gıda → Market.\n"+
    "Emin olmadığın kalemi atla. Hiç kalem okuyamazsan kalemler boş dizi olsun.";
}

function geminiSor(anahtar,model,b64){
  var govde={
    contents:[{parts:[{text:fisIstegi()},{inline_data:{mime_type:"image/jpeg",data:b64}}]}],
    generationConfig:{temperature:0.1,responseMimeType:"application/json"}
  };
  return fetch(API+"models/"+model+":generateContent?key="+encodeURIComponent(anahtar),{
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(govde)
  }).then(function(y){
    return y.json().then(function(o){
      if(!y.ok) throw (o&&o.error)?o.error:{status:y.status};
      return o;
    },function(){ throw {status:y.status}; });
  }).then(function(o){
    var c=o.candidates&&o.candidates[0];
    var metin=c&&c.content&&c.content.parts&&c.content.parts.map(function(p){ return p.text||""; }).join("");
    if(!metin) throw {hata:"bos"};
    var bas=metin.indexOf("{"), son=metin.lastIndexOf("}");
    if(bas<0||son<bas) throw {hata:"json"};
    return JSON.parse(metin.slice(bas,son+1));
  });
}

function fisHata(e){
  if(!e) return "Bir şeyler ters gitti.";
  if(e.hata==="okunamadi") return "Fotoğraf okunamadı, tekrar çek.";
  if(e.hata==="json"||e.hata==="bos") return "Fişi çözemedim. Düz ve net bir kare dene.";
  if(e.hata==="model-yok") return "Hesabında fiş okuyabilen model yok. Ayarlar'dan anahtarı kontrol et.";
  var kod=e.code||e.status;
  if(kod===400) return "API anahtarı geçersiz görünüyor. Ayarlar'dan kontrol et.";
  if(kod===403) return "Anahtar reddedildi. Google AI Studio'da anahtarın aktif mi bak.";
  if(kod===429) return "Günlük ücretsiz hakkın dolmuş. Yarın tekrar dene ya da elle gir.";
  if(kod===404) return "Model bulunamadı. Ayarlar'dan \"Modeli yenile\"ye dokun.";
  if(kod>=500) return "Google tarafında geçici sorun. Birazdan tekrar dene.";
  return "Bağlanamadım. İnternetini kontrol et.";
}

function fisOku(dosya){
  var anahtar=anahtarAl();
  if(!anahtar){ katmanAc("Fiş okuma kurulumu",cizGeminiKurulum); return; }
  $("foto").disabled=true;
  durum("Fişi okuyorum, 10-30 saniye sürebilir…",false);
  kucult(dosya).then(function(b64){
    var model=modelAl();
    var p=model?Promise.resolve(model):modelBul(anahtar).then(function(m){ modelYaz(m); return m; });
    return p.then(function(m){
      return geminiSor(anahtar,m,b64).catch(function(e){
        // model eskimişse bir kez yenile ve tekrar dene
        if((e.code||e.status)!==404) throw e;
        return modelBul(anahtar).then(function(m2){
          modelYaz(m2);
          return geminiSor(anahtar,m2,b64);
        });
      });
    });
  }).then(function(v){
    $("foto").disabled=false;
    fisGoster(v||{});
  }).catch(function(e){
    $("foto").disabled=false;
    durum(fisHata(e),true);
  });
}

function fisGoster(v){
  var tarih=gecerliTarih(v.tarih)?v.tarih:iso(new Date());
  var isyeri=String(v.isyeri==null?"":v.isyeri).trim().slice(0,40);
  var ham=Array.isArray(v.kalemler)?v.kalemler:[];
  var girdiler=ham.map(function(k){
    k=k||{};
    var t=typeof k.tutar==="number"?k.tutar:parseTutar(k.tutar);
    var adet=Number(k.adet);
    var ad=String(k.ad==null?"":k.ad).trim().slice(0,70);
    if(isFinite(adet)&&adet>1) ad=ad+" ×"+Math.round(adet);
    return {
      tip:"gider", tutar:isNaN(t)?0:Math.round(t*100)/100, taksit:1,
      kategori:KAT.gider.indexOf(k.kategori)>-1?k.kategori:"Diğer", kisi:"",
      tarih:tarih, isyeri:isyeri, aciklama:ad
    };
  }).filter(function(k){ return k.tutar>0&&k.aciklama; });

  if(!girdiler.length){ durum("Fişten ürün okuyamadım. ✎ ile elle girebilirsin.",true); return; }
  durum("",false);
  var toplam=girdiler.reduce(function(a,k){ return a+k.tutar; },0);
  katmanAc("Fiş kalemleri",function(govde){
    govde.innerHTML="";
    var card=el("div","card");
    card.appendChild(el("p","ozetUst",
      (isyeri?isyeri+" · ":"")+gunBasligi(tarih)+" · "+girdiler.length+" kalem · "+para(toplam)));
    incelemeCiz(card,girdiler,function(sonuc){ katmanKapat(); durum(sonuc,false); ciz(); },true);
    govde.appendChild(card);
  });
}

// Cihaz türü: kurulum adımları buna göre
function cihaz(){
  var u=navigator.userAgent||"";
  if(/iPad|iPhone|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)) return "ios";
  if(/Android/.test(u)) return "android";
  return "masaustu";
}

// Panodan tek dokunuşla anahtar alma — olmazsa elle yapıştırma
function panodanAl(){
  try{
    if(navigator.clipboard&&navigator.clipboard.readText) return navigator.clipboard.readText();
  }catch(e){}
  return Promise.reject({hata:"pano"});
}

function cizGeminiKurulum(govde){
  govde.innerHTML="";
  var varOlan=anahtarAl();

  var c=el("div","card");
  c.appendChild(el("p","bilgi",
    "Fiş fotoğrafını okutmak için Google'ın ücretsiz Gemini anahtarı gerekiyor. "+
    "Anahtar yalnızca bu telefonda saklanır; kullanımı kendi Google hesabından düşer, "+
    "kimseyle paylaşılmaz."));

  // 1. adım
  var a1=el("div","adim");
  var b1=el("span","adimNo","1");
  var m1=el("div","adimIc");
  m1.appendChild(el("div","adimBas","Google'dan anahtarı al"));
  m1.appendChild(el("div","adimAlt","Açılan sayfada \"Create API key\"e dokun, çıkan yazıyı kopyala."));
  var ac=el("a","ana genis","Anahtar sayfasını aç");
  ac.href="https://aistudio.google.com/apikey";
  ac.target="_blank"; ac.rel="noopener";
  ac.style.display="block"; ac.style.textAlign="center";
  ac.style.textDecoration="none"; ac.style.marginTop="8px";
  m1.appendChild(ac);
  a1.appendChild(b1); a1.appendChild(m1);
  c.appendChild(a1);

  // 2. adım
  var a2=el("div","adim");
  var b2=el("span","adimNo","2");
  var m2=el("div","adimIc");
  m2.appendChild(el("div","adimBas","Buraya yapıştır"));
  m2.appendChild(el("div","adimAlt","Kopyaladıktan sonra aşağıdaki düğmeye dokun; telefon \"Yapıştır\" diye soracak."));
  var yap=el("button","ana genis","Panodakini yapıştır ve bağla"); yap.type="button";
  yap.style.marginTop="8px";
  m2.appendChild(yap);
  var elleAc=el("button","kapatBtn genis","Elle yazmak istiyorum"); elleAc.type="button";
  elleAc.style.marginTop="7px";
  m2.appendChild(elleAc);
  var elleKutu=el("div"); elleKutu.hidden=true;
  var giris=alan(elleKutu,"Gemini API anahtarı","text","AIza… ya da AQ…");
  giris.value=varOlan;
  var elleBtn=el("button","ana genis","Kaydet ve bağlan"); elleBtn.type="button";
  elleKutu.appendChild(elleBtn);
  m2.appendChild(elleKutu);
  elleAc.addEventListener("click",function(){
    elleKutu.hidden=false; elleAc.hidden=true; giris.focus();
  });
  a2.appendChild(b2); a2.appendChild(m2);
  c.appendChild(a2);

  var msg=el("p","durum"); msg.hidden=true; c.appendChild(msg);
  govde.appendChild(c);

  function bildir(metin,hataMi){
    msg.textContent=metin;
    msg.className="durum"+(hataMi?" hata":"");
    msg.hidden=false;
  }

  function bagla(deger,dugme,eskiYazi){
    var v=String(deger||"").trim().replace(/\s+/g,"");
    if(!v){ bildir("Panoda anahtar bulamadım. Önce Google sayfasından kopyala.",true); return; }
    if(v.length<20){ bildir("Bu bir anahtara benzemiyor. Tamamını kopyaladığından emin ol.",true); return; }
    dugme.disabled=true; dugme.textContent="Bağlanıyor…";
    bildir("Anahtar deneniyor…",false);
    modelBul(v).then(function(m){
      anahtarYaz(v); modelYaz(m);
      bildir("Bağlandı. Artık ana ekrandaki 📷 ile fiş çekebilirsin.",false);
      dugme.textContent="Bağlandı ✓";
      var bitti=el("button","ana genis","Tamam"); bitti.type="button";
      bitti.style.marginTop="10px";
      bitti.addEventListener("click",function(){ katmanKapat(); ciz(); });
      govde.appendChild(bitti);
    }).catch(function(e){
      bildir(fisHata(e&&e.error?e.error:e),true);
      dugme.disabled=false; dugme.textContent=eskiYazi;
    });
  }

  yap.addEventListener("click",function(){
    panodanAl().then(function(v){ bagla(v,yap,"Panodakini yapıştır ve bağla"); })
      .catch(function(){
        elleKutu.hidden=false; elleAc.hidden=true; giris.focus();
        bildir("Telefonun panoya izin vermedi. Anahtarı aşağıdaki kutuya yapıştır.",true);
      });
  });
  elleBtn.addEventListener("click",function(){ bagla(giris.value,elleBtn,"Kaydet ve bağlan"); });

  if(varOlan){
    var durumK=el("div","card");
    durumK.style.marginTop="4px";
    kutuSatiri(durumK,"Durum","Bağlı","pos");
    if(modelAl()) kutuSatiri(durumK,"Model",modelAl());
    govde.appendChild(durumK);

    var yenile=el("button","kapatBtn genis","Modeli yenile"); yenile.type="button";
    yenile.addEventListener("click",function(){
      yenile.disabled=true; yenile.textContent="Aranıyor…";
      modelBul(anahtarAl()).then(function(m){
        modelYaz(m); yenile.textContent="Model: "+m; yenile.disabled=false;
      }).catch(function(e){
        yenile.textContent="Modeli yenile"; yenile.disabled=false;
        bildir(fisHata(e),true);
      });
    });
    govde.appendChild(yenile);

    var sil=el("button","kapatBtn genis","Anahtarı sil"); sil.type="button";
    var eminMi=false;
    sil.addEventListener("click",function(){
      if(!eminMi){ eminMi=true; sil.textContent="Emin misin? Dokun ve silinsin"; return; }
      anahtarYaz(""); modelYaz("");
      katmanAc("Fiş okuma kurulumu",cizGeminiKurulum);
    });
    govde.appendChild(sil);
  }
}

// ---- karşılama / kurulum rehberi ----
function kurulumAdimlari(){
  var t=cihaz();
  if(t==="ios") return {
    baslik:"iPhone'a ekle",
    adimlar:["Safari'de bu sayfadayken alttaki paylaş simgesine dokun (içinden ok çıkan kutu).",
             "Listeyi yukarı kaydır, \"Ana Ekrana Ekle\"ye dokun.",
             "Sağ üstte \"Ekle\"ye dokun. KASA ana ekranında belirecek.",
             "Bundan sonra hep o ikondan aç; Safari'deki kayıtlar ayrı tutulur."]
  };
  if(t==="android") return {
    baslik:"Android'e ekle",
    adimlar:["Aşağıdaki \"Telefona kur\" düğmesine dokun.",
             "Düğme çıkmadıysa Chrome'da sağ üstteki ⋮ menüsünden \"Uygulamayı yükle\"yi seç.",
             "KASA ana ekranına eklenecek, uygulama gibi açılacak."]
  };
  return {
    baslik:"Bilgisayara ekle",
    adimlar:["Chrome ya da Edge'de adres çubuğunun sağındaki yükleme simgesine tıkla.",
             "Ya da menüden \"Uygulamayı yükle\" / \"Install\" seçeneğini kullan."]
  };
}

function cizKarsilama(govde){
  govde.innerHTML="";

  var tanit=el("div","card");
  tanit.appendChild(el("p","bilgi",
    "KASA gelir, gider, taksit ve alacak-borç takibi yapar. Bütün kayıtlar yalnızca senin "+
    "telefonunda durur; internet olmadan da çalışır."));
  var liste=el("div","ozellikler");
  [["✍️","Yaz ya da konuş","\"markete 420 lira verdim\" de, kaydı kendi çıkarsın"],
   ["📷","Fiş çek","Fişteki ürünleri tek tek okuyup kategorilere ayırır"],
   ["📊","Rapor","Kategori dağılımı, aylık seyir, taksit yükü"],
   ["🤝","Alacak & borç","Vadesi yaklaşanı ana ekranda hatırlatır"]].forEach(function(o){
    var s=el("div","ozellik");
    s.appendChild(el("span","ozIkon",o[0]));
    var m=el("div");
    m.appendChild(el("div","ozBas",o[1]));
    m.appendChild(el("div","ozAlt",o[2]));
    s.appendChild(m);
    liste.appendChild(s);
  });
  tanit.appendChild(liste);
  govde.appendChild(tanit);

  if(!arayuzUygulama()){
    var k=kurulumAdimlari();
    var b=el("section");
    b.appendChild(el("h3",null,k.baslik));
    var c=el("div","card");
    k.adimlar.forEach(function(metin,i){
      var a=el("div","adim");
      a.appendChild(el("span","adimNo",String(i+1)));
      var ic=el("div","adimIc");
      ic.appendChild(el("div","adimAlt",metin));
      a.appendChild(ic);
      c.appendChild(a);
    });
    if(cihaz()==="android"||cihaz()==="masaustu"){
      var kurB=el("button","ana genis","Telefona kur"); kurB.type="button";
      kurB.style.marginTop="6px";
      kurB.addEventListener("click",function(){
        if(kurulumOlayi){
          kurulumOlayi.prompt();
          kurulumOlayi.userChoice.then(function(){ kurulumOlayi=null; });
        } else {
          kurB.textContent="Menüden \"Uygulamayı yükle\"yi seç";
        }
      });
      c.appendChild(kurB);
    }
    b.appendChild(c); govde.appendChild(b);
  }

  var b2=el("section");
  b2.appendChild(el("h3",null,"Fiş okuma (isteğe bağlı)"));
  var c2=el("div","card");
  c2.appendChild(el("p","bilgi",
    anahtarAl()
      ? "Fiş okuma açık. 📷 ile fiş çekebilirsin."
      : "Fişten otomatik kalem çıkarmak istersen Google'ın ücretsiz anahtarını bağlaman gerekiyor — "+
        "iki dokunuş. Bağlamadan da uygulamanın tamamı çalışır."));
  var git=el("button",anahtarAl()?"kapatBtn genis":"ana genis",
    anahtarAl()?"Fiş okuma ayarları":"Fiş okumayı aç"); git.type="button";
  git.addEventListener("click",function(){ katmanAc("Fiş okuma kurulumu",cizGeminiKurulum); });
  c2.appendChild(git);
  b2.appendChild(c2); govde.appendChild(b2);

  var bitir=el("button","ana genis","Başla"); bitir.type="button";
  bitir.addEventListener("click",function(){
    try{ localStorage.setItem("kasa-karsilama","1"); }catch(e){}
    katmanKapat();
  });
  govde.appendChild(bitir);
}

$("foto").addEventListener("click",function(){
  if(!anahtarAl()){ katmanAc("Fiş okuma kurulumu",cizGeminiKurulum); return; }
  $("fis-input").click();
});
["fis-input","fis-galeri"].forEach(function(id){
  $(id).addEventListener("change",function(){
    var f=this.files&&this.files[0];
    this.value="";
    if(f) fisOku(f);
  });
});

// ---------------------------------------------------------------- mikrofon
function mikrofonKur(){
  var ST=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!ST){ $("mikrofon").hidden=true; return; }
  taniyici=new ST();
  taniyici.lang="tr-TR";
  taniyici.continuous=false;
  taniyici.interimResults=true;
  var baslangic="";
  taniyici.onstart=function(){
    dinliyor=true;
    baslangic=$("girdi").value?$("girdi").value.trim()+" ":"";
    $("mikrofon").className="ikon dinliyor";
    durum("Dinliyorum… bitince tekrar dokun.",false);
  };
  taniyici.onresult=function(e){
    var metin="";
    for(var i=0;i<e.results.length;i++) metin+=e.results[i][0].transcript;
    $("girdi").value=baslangic+metin;
  };
  taniyici.onerror=function(e){
    dinliyor=false;
    $("mikrofon").className="ikon";
    var k=e&&e.error;
    durum(k==="not-allowed"?"Mikrofon izni verilmedi. Tarayıcı ayarlarından izin ver."
      :(k==="no-speech"?"Ses duymadım, tekrar dene.":"Mikrofon çalışmadı ("+k+")."),true);
  };
  taniyici.onend=function(){
    dinliyor=false;
    $("mikrofon").className="ikon";
    if($("girdi").value.trim()) durum("Yazdım. “Kayda çevir”e dokun.",false);
  };
  $("mikrofon").addEventListener("click",function(){
    if(dinliyor){ try{ taniyici.stop(); }catch(e){} return; }
    try{ taniyici.start(); }
    catch(e){ durum("Mikrofon başlatılamadı, sayfayı yenile.",true); }
  });
}

// ---------------------------------------------------------------- inceleme listesi
function incelemeCiz(card,girdiler,bitti,tekSecenek){
  var satirlar=[];
  girdiler.forEach(function(g){
    var satir=el("div","kalem");
    var cb=document.createElement("input");
    cb.type="checkbox"; cb.checked=true; cb.setAttribute("aria-label","Bu kaydı ekle");
    var ad=el("input","ad-in"); ad.value=g.aciklama||g.kisi||g.kategori; ad.setAttribute("aria-label","Açıklama");
    var tut=el("input","tut-in"); tut.value=nf.format(g.tutar);
    tut.inputMode="decimal"; tut.setAttribute("aria-label","Tutar");
    var alt=el("div","alt-grid");
    var tip=el("select"); tip.setAttribute("aria-label","Tür");
    [["gider","Gider"],["gelir","Gelir"],["alacak","Alacağım"],["borc","Borcum"]].forEach(function(p){
      var o=el("option",null,p[1]); o.value=p[0]; tip.appendChild(o);
    });
    tip.value=g.tip;
    var kat=el("select"); kat.setAttribute("aria-label","Kategori");
    var kisi=el("input"); kisi.placeholder="Kişi"; kisi.value=g.kisi; kisi.setAttribute("aria-label","Kişi");
    var taksit=el("select"); taksit.setAttribute("aria-label","Taksit");
    TAKSITLER.forEach(function(n){ var o=el("option",null,n===1?"Peşin":n+" taksit"); o.value=String(n); taksit.appendChild(o); });
    taksit.value=String(g.taksit||1);
    var tarih=el("input"); tarih.type="date"; tarih.value=g.tarih; tarih.setAttribute("aria-label","Tarih");
    tarih.style.gridColumn="1 / -1";
    function tazele(){
      var defter=tip.value==="gider"||tip.value==="gelir";
      kat.hidden=!defter; kisi.hidden=defter; taksit.hidden=tip.value!=="gider";
      if(!defter) return;
      var liste=KAT[tip.value], onceki=kat.value;
      kat.innerHTML="";
      liste.forEach(function(x){ var o=el("option",null,x); o.value=x; kat.appendChild(o); });
      kat.value=liste.indexOf(onceki)>-1?onceki:(liste.indexOf(g.kategori)>-1?g.kategori:liste[liste.length-1]);
    }
    tip.addEventListener("change",tazele); tazele();
    alt.appendChild(tip); alt.appendChild(kat); alt.appendChild(kisi);
    alt.appendChild(taksit); alt.appendChild(tarih);
    satir.appendChild(cb); satir.appendChild(ad); satir.appendChild(tut); satir.appendChild(alt);
    card.appendChild(satir);
    satirlar.push({cb:cb,ad:ad,tut:tut,tip:tip,kat:kat,kisi:kisi,taksit:taksit,tarih:tarih,isyeri:g.isyeri||""});
  });

  var islem=el("div","islem");
  var ekle=el("button","ana","Seçilenleri ekle"); ekle.type="button";
  var vaz=el("button","kapatBtn","Vazgeç"); vaz.type="button";
  vaz.addEventListener("click",function(){ katmanKapat(); durum("",false); });
  islem.appendChild(ekle);
  var tek=null;
  if(tekSecenek){
    tek=el("button","kapatBtn","Toplamı tek kayıt yap"); tek.type="button";
    islem.appendChild(tek);
  }
  islem.appendChild(vaz);
  card.appendChild(islem);
  var msg=el("p","durum"); msg.hidden=true; card.appendChild(msg);

  if(tek) tek.addEventListener("click",function(){
    var toplam=0, katT={}, tarih=null, isyeri="", simdi=new Date().toISOString();
    satirlar.forEach(function(s){
      if(!s.cb.checked) return;
      if(s.tip.value!=="gider") return;
      var t=parseTutar(s.tut.value);
      if(isNaN(t)) return;
      toplam+=t;
      katT[s.kat.value]=(katT[s.kat.value]||0)+t;
      if(!tarih) tarih=s.tarih.value||iso(new Date());
      if(!isyeri) isyeri=s.isyeri||"";
    });
    if(!toplam){ msg.textContent="Hiç kalem seçilmedi."; msg.hidden=false; return; }
    var enCok=Object.keys(katT).sort(function(a,b){ return katT[b]-katT[a]; })[0];
    kayitEkle({ tur:"gider", tutar:Math.round(toplam*100)/100, taksit:1,
      kategori:enCok||"Diğer", tarih:tarih, aciklama:(isyeri||"Fiş")+" alışverişi",
      isyeri:isyeri, olusturma:simdi });
    var p=tarih.split("-"); yil=Number(p[0]); ay=Number(p[1])-1;
    bitti("Fiş toplamı tek kayıt olarak eklendi.");
  });

  ekle.addEventListener("click",function(){
    var sayac=0, ilk=null, simdi=new Date().toISOString();
    satirlar.forEach(function(s){
      if(!s.cb.checked) return;
      var t=parseTutar(s.tut.value);
      if(isNaN(t)) return;
      if(s.tip.value==="alacak"||s.tip.value==="borc"){
        borcEkle({ yon:s.tip.value, kisi:s.kisi.value.trim()||s.ad.value.trim(), tutar:t,
          vade:s.tarih.value||"", aciklama:s.ad.value.trim(), durum:"acik", kapanis:"", olusturma:simdi });
      } else {
        var td=s.tarih.value||iso(new Date());
        if(!ilk) ilk=td;
        kayitEkle({ tur:s.tip.value, tutar:t,
          taksit:s.tip.value==="gider"?Number(s.taksit.value||1):1,
          kategori:s.kat.value||"Diğer", tarih:td, aciklama:s.ad.value.trim(),
          isyeri:s.isyeri||"", olusturma:simdi });
      }
      sayac++;
    });
    if(!sayac){ msg.textContent="Hiç kayıt seçilmedi."; msg.hidden=false; return; }
    if(ilk){ var p=ilk.split("-"); yil=Number(p[0]); ay=Number(p[1])-1; }
    bitti(sayac+" kayıt eklendi.");
  });
}

// ---------------------------------------------------------------- yedek / ayarlar
function csvIndir(){
  var satirlar=aySatirlari(yil,ay).slice().sort(function(a,b){ return a.tarih<b.tarih?-1:1; });
  var out=["Tarih;Tür;Kategori;Açıklama;Nereden;Taksit;Bu ay;Toplam"];
  satirlar.forEach(function(s){
    out.push([s.tarih,s.r.tur==="gelir"?"Gelir":"Gider",
      (s.r.kategori||"").replace(/;/g,","),(s.r.aciklama||"").replace(/;/g,","),
      (s.r.isyeri||"").replace(/;/g,","),
      s.adet>1?(s.sira+"/"+s.adet):"peşin",nf.format(s.pay),nf.format(s.r.tutar)].join(";"));
  });
  dosyaIndir("kasa-"+ayKey(yil,ay)+".csv","text/csv;charset=utf-8","﻿"+out.join("\r\n"));
}
function dosyaIndir(adi,tip,icerik){
  try{
    var blob=new Blob([icerik],{type:tip});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download=adi;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },1000);
  }catch(e){ durum("Dosya indirilemedi.",true); }
}
function cizAyarlar(govde){
  govde.innerHTML="";
  var c1=el("div","card");
  c1.appendChild(el("p","bilgi",
    "Bütün kayıtlar sadece bu telefonda duruyor; internete hiçbir şey gönderilmiyor. "+
    "Telefonu değiştirirken ya da tarayıcı verilerini temizlemeden önce yedek al."));
  if(!arayuzUygulama()){
    var u=el("p","bilgi");
    u.style.color="var(--neg)";
    u.textContent="Şu an tarayıcıda açıksın. Ana ekrana eklediğin KASA ayrı bir hafıza kullanır "+
      "(iOS böyle çalışır): oradaki kayıtlar burada görünmez. Buradaki kayıtları taşımak için "+
      "\"Yedek al\" de, sonra uygulamayı açıp \"Yedekten geri yükle\" yap. Sonrasında sadece "+
      "ana ekrandaki uygulamayı kullan.";
    c1.appendChild(u);
  }
  var say=el("div","ozetSatir");
  say.appendChild(el("span",null,"Kayıt sayısı"));
  say.appendChild(el("b",null,veri.kayitlar.length+" hareket · "+veri.borclar.length+" alacak/borç"));
  c1.appendChild(say);
  govde.appendChild(c1);

  var rehber=el("button","kapatBtn genis","Kurulum rehberi ve tanıtım"); rehber.type="button";
  rehber.addEventListener("click",function(){ katmanAc("KASA'ya hoş geldin",cizKarsilama); });
  govde.appendChild(rehber);

  var fisBtn=el("button","ana genis",anahtarAl()?"Fiş okuma ayarları":"Fiş okumayı aç (Gemini)");
  fisBtn.type="button";
  fisBtn.addEventListener("click",function(){ katmanAc("Fiş okuma kurulumu",cizGeminiKurulum); });
  govde.appendChild(fisBtn);
  if(anahtarAl()){
    var gal=el("button","kapatBtn genis","Galeriden fiş seç"); gal.type="button";
    gal.addEventListener("click",function(){ katmanKapat(); $("fis-galeri").click(); });
    govde.appendChild(gal);
  }

  var b1=el("button","ana genis","Yedek al (JSON)"); b1.type="button";
  b1.addEventListener("click",function(){
    dosyaIndir("kasa-yedek-"+iso(new Date())+".json","application/json",
      JSON.stringify({surum:1,tarih:new Date().toISOString(),veri:veri},null,1));
  });
  govde.appendChild(b1);

  var b2=el("button","kapatBtn genis","Yedekten geri yükle"); b2.type="button";
  var gizli=document.createElement("input");
  gizli.type="file"; gizli.accept="application/json,.json"; gizli.hidden=true;
  b2.addEventListener("click",function(){ gizli.click(); });
  gizli.addEventListener("change",function(){
    var f=this.files&&this.files[0];
    this.value="";
    if(!f) return;
    var fr=new FileReader();
    fr.onload=function(){
      try{
        var o=JSON.parse(String(fr.result));
        var v=o&&o.veri?o.veri:o;
        if(!v||!Array.isArray(v.kayitlar)) throw 0;
        veri.kayitlar=v.kayitlar;
        veri.borclar=Array.isArray(v.borclar)?v.borclar:[];
        kaydet(); katmanKapat(); durum("Yedek geri yüklendi.",false); ciz();
      }catch(e){ durum("Dosya okunamadı, geçerli bir yedek seç.",true); }
    };
    fr.readAsText(f);
  });
  govde.appendChild(b2); govde.appendChild(gizli);

  var tema=el("button","kapatBtn genis","Temayı değiştir (açık / koyu)"); tema.type="button";
  tema.addEventListener("click",function(){
    var su=document.documentElement.getAttribute("data-theme");
    var yeni=su==="dark"?"light":"dark";
    document.documentElement.setAttribute("data-theme",yeni);
    try{ localStorage.setItem("defter-tema",yeni); }catch(e){}
  });
  govde.appendChild(tema);

  var temizle=el("button","kapatBtn genis","Tüm kayıtları sil"); temizle.type="button";
  var onayAcik=false;
  temizle.addEventListener("click",function(){
    if(!onayAcik){ onayAcik=true; temizle.textContent="Emin misin? Dokun ve hepsi silinsin"; return; }
    veri.kayitlar=[]; veri.borclar=[]; kaydet();
    katmanKapat(); durum("Bütün kayıtlar silindi.",false); ciz();
  });
  govde.appendChild(temizle);

  var yenile=el("button","kapatBtn genis","Güncellemeleri denetle"); yenile.type="button";
  yenile.addEventListener("click",function(){
    yenile.textContent="Denetleniyor…";
    var isler=[];
    if("serviceWorker" in navigator&&navigator.serviceWorker.getRegistrations){
      isler.push(navigator.serviceWorker.getRegistrations().then(function(rs){
        return Promise.all(rs.map(function(r){ return r.update().catch(function(){}); }));
      }).catch(function(){}));
    }
    if(window.caches&&caches.keys){
      isler.push(caches.keys().then(function(ks){
        return Promise.all(ks.map(function(k){ return caches.delete(k); }));
      }).catch(function(){}));
    }
    Promise.all(isler).then(function(){ location.reload(true); });
  });
  govde.appendChild(yenile);

  govde.appendChild(el("p","bilgi","KASA · sürüm "+SURUM_ADI+" · tamamen cihazda · design by alasoy"));
}

// ---------------------------------------------------------------- menü
$("geri").addEventListener("click",function(){ ay--; if(ay<0){ ay=11; yil--; } ciz(); });
$("ileri").addEventListener("click",function(){ ay++; if(ay>11){ ay=0; yil++; } ciz(); });
(function(){
  var hedef=$("netKutu");
  if(!hedef&&$("v-net")) hedef=$("v-net").parentNode;   // eski HTML
  if(!hedef) return;
  hedef.classList.add("vurgu");
  hedef.style.cursor="pointer";
  if(!hedef.querySelector(".okMini")){
    var k=hedef.querySelector(".k");
    if(k) k.appendChild(el("span","okMini"," ›"));
  }
  hedef.addEventListener("click",function(){ katmanAc("Her şey dahil",cizNetDetay); });
})();
$("ayad").addEventListener("click",function(){
  var b=new Date();
  yil=b.getFullYear(); ay=b.getMonth();
  silAdayi=null; ciz();
});
$("m-hareket").addEventListener("click",function(){ katmanAc("Hareketler",cizHareketler); });
$("m-borc").addEventListener("click",function(){ katmanAc("Alacak & Borç",cizBorc); });
$("m-aylik").addEventListener("click",function(){ katmanAc("Aylık rapor",cizAylikRapor); });
$("m-toplam").addEventListener("click",function(){ katmanAc("Toplam rapor",cizToplamRapor); });
$("elle").addEventListener("click",function(){ katmanAc("Elle gir",cizElleForm); });
$("tumu").addEventListener("click",function(){ katmanAc("Hareketler",cizHareketler); });
$("ayarlar").addEventListener("click",function(){ katmanAc("Ayarlar & yedek",cizAyarlar); });
$("katGeri").addEventListener("click",katmanKapat);
$("katKapat").addEventListener("click",katmanKapat);

// ---------------------------------------------------------------- kurulum (PWA)
window.addEventListener("beforeinstallprompt",function(e){
  e.preventDefault();
  kurulumOlayi=e;
  $("kur").hidden=false;
});
$("kur").addEventListener("click",function(){
  if(!kurulumOlayi) return;
  kurulumOlayi.prompt();
  kurulumOlayi.userChoice.then(function(){ kurulumOlayi=null; $("kur").hidden=true; });
});
// Otomatik güncelleme: yeni sürüm yayınlandığında kullanıcı bir şey yapmasın
if("serviceWorker" in navigator){
  var kayitSW=null, yenilendi=false;
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("sw.js").then(function(r){ kayitSW=r; }).catch(function(){});
  });
  // yeni service worker devralınca sayfayı bir kez tazele
  navigator.serviceWorker.addEventListener("controllerchange",function(){
    if(yenilendi) return;
    yenilendi=true;
    // form doldururken sayfayı patlatma: katman açıksa bir sonraki açılışa bırak
    if($("katman")&&!$("katman").hidden) return;
    location.reload();
  });
  // uygulamaya her dönüşte yeni sürüm var mı diye bak
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible"&&kayitSW&&kayitSW.update) kayitSW.update().catch(function(){});
  });
}

// ---------------------------------------------------------------- başlangıç
try{
  var t=localStorage.getItem("defter-tema");
  if(t) document.documentElement.setAttribute("data-theme",t);
}catch(e){}
yukle();
mikrofonKur();
ciz();

// İlk açılışta tanıtım + kurulum rehberi
try{
  if(!localStorage.getItem("kasa-karsilama")&&!veri.kayitlar.length&&!veri.borclar.length){
    katmanAc("KASA'ya hoş geldin",cizKarsilama);
  }
}catch(e){}

})();

/* Yerel denemek için bu klasörde:  python -m http.server 8080  →  http://localhost:8080 */
