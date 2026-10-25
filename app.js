/* Harcama Defteri — offline gelir/gider defteri. design by alasoy
   Veriler telefonun kendi hafızasında (localStorage) tutulur, hiçbir yere gönderilmez. */
(function(){
"use strict";

// ---------------------------------------------------------------- sabitler
var KAT = {
  gider:["Market","Bebek & Çocuk","Yemek & Kafe","Fatura","Kira","Aidat","Ulaşım","Akaryakıt","Araç",
         "Sağlık","İlaç","Giyim","Kozmetik & Bakım","Temizlik","Ev & Yapı market","Teknoloji","Mobilya",
         "Eğitim","Eğlence","Tatil","Abonelik","Sigorta","Kredi & Taksit","Vergi & Harç","Hediye",
         "Evcil hayvan","Bağış","Alkol & Tütün","Diğer"],
  gelir:["Maaş","Ek gelir","Prim","Kira geliri","Faiz & Yatırım","Satış","İade","Hediye & Destek","Diğer"]
};
var AYLAR=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var GUNLER=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var TAKSITLER=[1,2,3,4,5,6,8,9,10,12,18,24];
var ANAHTAR="harcama-defteri-v1";
var SURUM_ADI="1.3";

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
  ["Ev & Yapı market",["yapı market","boya","vida","hırdavat","koçtaş","bauhaus","ampul","musluk"]],
  ["Teknoloji",["bilgisayar","kulaklık","şarj","kablo","telefon aldım","tablet","yazıcı","elektronik"]],
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
  if(n1>-1&&v1>-1){ if(v1>n1) s=s.replace(/\./g,"").replace(",","."); else s=s.replace(/,/g,""); }
  else if(v1>-1){ s=(s.split(",").length>2)?s.replace(/,/g,""):s.replace(",","."); }
  else if(n1>-1&&s.split(".").length>2){ s=s.replace(/\./g,""); }
  var n=parseFloat(s);
  return (isFinite(n)&&n>0)?Math.round(n*100)/100:NaN;
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
function aySatirlari(y,a){
  var hedef=ayKey(y,a), out=[];
  veri.kayitlar.forEach(function(r){
    if(!gecerliTarih(r.tarih)) return;
    var n=taksitSayisi(r), p=r.tarih.split("-");
    var by=Number(p[0]), ba=Number(p[1])-1, gun=Number(p[2])||1;
    for(var i=0;i<n;i++){
      var yy=by+Math.floor((ba+i)/12), aa=(ba+i)%12;
      if(ayKey(yy,aa)===hedef){
        var g=Math.min(gun,new Date(yy,aa+1,0).getDate());
        out.push({ r:r, pay:Math.round(r.tutar/n*100)/100, sira:i+1, adet:n,
          tarih: i===0?r.tarih:(ayKey(yy,aa)+"-"+String(g).padStart(2,"0")) });
        break;
      }
    }
  });
  return out;
}
function gelecekTaksitYuku(){
  var simdi=ayKey(yil,ay), toplam=0;
  veri.kayitlar.forEach(function(r){
    if(r.tur==="gelir"||!gecerliTarih(r.tarih)) return;
    var n=taksitSayisi(r); if(n<2) return;
    var p=r.tarih.split("-"), by=Number(p[0]), ba=Number(p[1])-1;
    for(var i=0;i<n;i++){
      var yy=by+Math.floor((ba+i)/12), aa=(ba+i)%12;
      if(ayKey(yy,aa)>simdi) toplam+=r.tutar/n;
    }
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
  $("ayad").textContent=AYLAR[ay]+" "+yil;
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
function cizAylikRapor(govde){
  govde.innerHTML="";
  var satirlar=aySatirlari(yil,ay);
  govde.appendChild(el("p","ozetUst",AYLAR[ay]+" "+yil+" · "+satirlar.length+" hareket"));
  ["gider","gelir"].forEach(function(tur){
    var o=kategoriToplami(satirlar,tur);
    var b=el("section");
    b.appendChild(el("h3",null,tur==="gider"?"Gider kategorileri":"Gelir kategorileri"));
    var card=el("div","card");
    if(!o.sirali.length){
      card.appendChild(el("p","durum","Bu ay "+(tur==="gider"?"gider":"gelir")+" kaydı yok."));
    } else {
      card.appendChild(tablo(["Kategori","Adet","Tutar","%"],
        o.sirali.map(function(k){
          return [k,String(o.adet[k]),para(o.kat[k]),"%"+Math.round(o.kat[k]/o.genel*100)];
        }),
        ["TOPLAM",String(satirlar.filter(function(s){ return s.r.tur===tur; }).length),para(o.genel),"%100"]));
    }
    b.appendChild(card); govde.appendChild(b);
  });
  var g=kategoriToplami(satirlar,"gelir").genel, d=kategoriToplami(satirlar,"gider").genel;
  var sonuc=el("div","card");
  [["Toplam gelir",g,"pos"],["Toplam gider",-d,"neg"],["Kalan",g-d,(g-d)>=0?"pos":"neg"]].forEach(function(p){
    var s=el("div","ozetSatir");
    s.appendChild(el("span",null,p[0]));
    s.appendChild(el("b",p[2],(p[1]<0?"−":"")+para(Math.abs(p[1]))));
    sonuc.appendChild(s);
  });
  govde.appendChild(sonuc);

  var taksitli=satirlar.filter(function(s){ return s.adet>1; });
  if(taksitli.length){
    var tb=el("section");
    tb.appendChild(el("h3",null,"Bu ayki taksitler"));
    var tc=el("div","card");
    tc.appendChild(tablo(["Harcama","Taksit","Bu ay","Kalan"],
      taksitli.map(function(s){
        return [(s.r.aciklama||s.r.kategori),s.sira+"/"+s.adet,para(s.pay),
          para(Math.round((s.adet-s.sira)*s.pay*100)/100)];
      }),
      ["TOPLAM","",para(taksitli.reduce(function(a,s){ return a+s.pay; },0)),
       para(taksitli.reduce(function(a,s){ return a+(s.adet-s.sira)*s.pay; },0))]));
    tb.appendChild(tc); govde.appendChild(tb);
  }
}
function cizToplamRapor(govde){
  govde.innerHTML="";
  if(!veri.kayitlar.length){ govde.appendChild(el("p","durum","Henüz kayıt yok.")); return; }
  var aylar={};
  veri.kayitlar.forEach(function(r){
    if(!gecerliTarih(r.tarih)) return;
    var n=taksitSayisi(r), p=r.tarih.split("-"), by=Number(p[0]), ba=Number(p[1])-1;
    for(var i=0;i<n;i++){
      var yy=by+Math.floor((ba+i)/12), aa=(ba+i)%12, k=ayKey(yy,aa);
      if(!aylar[k]) aylar[k]={gelir:0,gider:0,y:yy,a:aa};
      if(r.tur==="gelir") aylar[k].gelir+=r.tutar/n; else aylar[k].gider+=r.tutar/n;
    }
  });
  var anahtar=Object.keys(aylar).sort().reverse(), tg=0, td=0;
  anahtar.forEach(function(k){ tg+=aylar[k].gelir; td+=aylar[k].gider; });
  govde.appendChild(el("p","ozetUst",veri.kayitlar.length+" kayıt · "+anahtar.length+" ay"));

  var b1=el("section");
  b1.appendChild(el("h3",null,"Ay ay"));
  var c1=el("div","card");
  c1.appendChild(tablo(["Ay","Gelir","Gider","Kalan"],
    anahtar.map(function(k){
      var m=aylar[k];
      return [AYLAR[m.a]+" "+m.y,para(m.gelir),para(m.gider),para(m.gelir-m.gider)];
    }),
    ["GENEL TOPLAM",para(tg),para(td),para(tg-td)]));
  b1.appendChild(c1); govde.appendChild(b1);

  var hepsi=veri.kayitlar.map(function(r){ return { r:r, pay:r.tutar, sira:1, adet:1 }; });
  ["gider","gelir"].forEach(function(tur){
    var o=kategoriToplami(hepsi,tur);
    if(!o.sirali.length) return;
    var b=el("section");
    b.appendChild(el("h3",null,tur==="gider"?"Tüm zamanlar · gider kategorileri":"Tüm zamanlar · gelir kategorileri"));
    var c=el("div","card");
    c.appendChild(tablo(["Kategori","Adet","Tutar","%"],
      o.sirali.map(function(k){
        return [k,String(o.adet[k]),para(o.kat[k]),"%"+Math.round(o.kat[k]/o.genel*100)];
      }),
      ["TOPLAM","",para(o.genel),"%100"]));
    b.appendChild(c); govde.appendChild(b);
  });

  var ta=0, tb2=0, ka=0, kb=0;
  veri.borclar.forEach(function(r){
    if(r.durum==="kapandi"){ if(r.yon==="alacak") ka+=r.tutar; else kb+=r.tutar; }
    else { if(r.yon==="alacak") ta+=r.tutar; else tb2+=r.tutar; }
  });
  if(ta||tb2||ka||kb){
    var bb=el("section");
    bb.appendChild(el("h3",null,"Alacak & borç"));
    var cb=el("div","card");
    [["Açık alacak",ta],["Açık borç",tb2],["Tahsil edilen",ka],["Ödenen",kb]].forEach(function(p){
      var s=el("div","ozetSatir");
      s.appendChild(el("span",null,p[0]));
      s.appendChild(el("b",null,para(p[1])));
      cb.appendChild(s);
    });
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
function kelimeVar(metin,kelime){
  // tam kelime eşleşmesi: "taksit" içindeki "taksi" eşleşmesin
  var k=sadelestir(kelime).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return new RegExp("(^|[^a-z0-9])"+k+"([^a-z0-9]|$)").test(metin);
}
function kategoriBul(d,tur){
  var liste=tur==="gelir"?IPUCU_GELIR:IPUCU_GIDER;
  for(var i=0;i<liste.length;i++){
    var kelimeler=liste[i][1];
    for(var j=0;j<kelimeler.length;j++){
      if(kelimeVar(d,kelimeler[j])) return liste[i][0];
    }
  }
  // tam eşleşme yoksa gevşek ara (çekim ekli haller: "markete", "eczaneden")
  for(var a=0;a<liste.length;a++){
    for(var b=0;b<liste[a][1].length;b++){
      var kk=sadelestir(liste[a][1][b]);
      if(kk.length>3&&d.indexOf(kk)>-1) return liste[a][0];
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
  var kaba=String(metin).split(/\n|;|,(?!\s*\d)| ve | ayrıca | bir de /i);
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
    var odendi=/odedim|odedik|odendi|kapattim|yatirdim/.test(d);
    if(odendi&&!/borc verdim/.test(d)){
      tip="gider";                       // "kredi kartı borcunu ödedim" -> gider
    }
    // bana borcu var / borç verdim / alacağım -> ALACAK
    else if(/alacag|borc verdim|borc verecek|bana borclu|bana borcu|bana verecek|borcu var|borclu bana/.test(d))
      tip="alacak";
    // borcum var / borçluyum / ödeyeceğim -> BORC
    else if(/borcum|borcluyum|borc aldim|borc cektim|odeyecegim|odemem gerek|vermem gerek/.test(d))
      tip="borc";
    else if(/maas|yatti|kazandim|sattim|iade|prim aldim|ikramiye|kira geldi|para geldi|gelir/.test(d))
      tip="gelir";
    var kat=tip==="gelir"||tip==="gider"?kategoriBul(d,tip==="gelir"?"gelir":"gider"):"";
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
function incelemeCiz(card,girdiler,bitti){
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
  islem.appendChild(ekle); islem.appendChild(vaz);
  card.appendChild(islem);
  var msg=el("p","durum"); msg.hidden=true; card.appendChild(msg);

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
  dosyaIndir("harcama-"+ayKey(yil,ay)+".csv","text/csv;charset=utf-8","﻿"+out.join("\r\n"));
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
  var say=el("div","ozetSatir");
  say.appendChild(el("span",null,"Kayıt sayısı"));
  say.appendChild(el("b",null,veri.kayitlar.length+" hareket · "+veri.borclar.length+" alacak/borç"));
  c1.appendChild(say);
  govde.appendChild(c1);

  var b1=el("button","ana genis","Yedek al (JSON)"); b1.type="button";
  b1.addEventListener("click",function(){
    dosyaIndir("harcama-defteri-yedek-"+iso(new Date())+".json","application/json",
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

  govde.appendChild(el("p","bilgi","Harcama Defteri · sürüm "+SURUM_ADI+" · offline · design by alasoy"));
}

// ---------------------------------------------------------------- menü
$("geri").addEventListener("click",function(){ ay--; if(ay<0){ ay=11; yil--; } ciz(); });
$("ileri").addEventListener("click",function(){ ay++; if(ay>11){ ay=0; yil++; } ciz(); });
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
if("serviceWorker" in navigator){
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("sw.js").catch(function(){});
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

})();

/* Yerel denemek için bu klasörde:  python -m http.server 8080  →  http://localhost:8080 */
