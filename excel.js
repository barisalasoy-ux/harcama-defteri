/* KASA — Excel (.xlsx) üretici.
   Dışarıdan kütüphane yüklemez; zip'i (sıkıştırmasız) ve sayfa XML'lerini kendi kurar,
   böylece internet olmadan da çalışır. design by alasoy */
(function(global){
"use strict";

// ---------------------------------------------------------------- zip
var CRC_TABLO=(function(){
  var t=new Uint32Array(256);
  for(var n=0;n<256;n++){
    var c=n;
    for(var k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);
    t[n]=c>>>0;
  }
  return t;
})();
function crc32(bayt){
  var c=0xFFFFFFFF;
  for(var i=0;i<bayt.length;i++) c=CRC_TABLO[(c^bayt[i])&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}
function utf8(metin){
  if(global.TextEncoder) return new TextEncoder().encode(metin);
  var s=unescape(encodeURIComponent(metin)), b=new Uint8Array(s.length);
  for(var i=0;i<s.length;i++) b[i]=s.charCodeAt(i);
  return b;
}
function yaz16(dizi,yer,deger){ dizi[yer]=deger&0xFF; dizi[yer+1]=(deger>>>8)&0xFF; }
function yaz32(dizi,yer,deger){
  dizi[yer]=deger&0xFF; dizi[yer+1]=(deger>>>8)&0xFF;
  dizi[yer+2]=(deger>>>16)&0xFF; dizi[yer+3]=(deger>>>24)&0xFF;
}
// dosyalar: [{ad, metin}]  -> Uint8Array (zip, store)
function zipKur(dosyalar){
  var kayitlar=dosyalar.map(function(d){
    var veri=utf8(d.metin), ad=utf8(d.ad);
    return { ad:ad, veri:veri, crc:crc32(veri) };
  });
  var yerelBoy=0, merkezBoy=0;
  kayitlar.forEach(function(k){
    yerelBoy+=30+k.ad.length+k.veri.length;
    merkezBoy+=46+k.ad.length;
  });
  var cikti=new Uint8Array(yerelBoy+merkezBoy+22), p=0, baslangiclar=[];
  kayitlar.forEach(function(k){
    baslangiclar.push(p);
    yaz32(cikti,p,0x04034b50); yaz16(cikti,p+4,20); yaz16(cikti,p+6,0);
    yaz16(cikti,p+8,0);            // sıkıştırma yok
    yaz16(cikti,p+10,0); yaz16(cikti,p+12,0);
    yaz32(cikti,p+14,k.crc);
    yaz32(cikti,p+18,k.veri.length); yaz32(cikti,p+22,k.veri.length);
    yaz16(cikti,p+26,k.ad.length); yaz16(cikti,p+28,0);
    p+=30;
    cikti.set(k.ad,p); p+=k.ad.length;
    cikti.set(k.veri,p); p+=k.veri.length;
  });
  var merkezBas=p;
  kayitlar.forEach(function(k,i){
    yaz32(cikti,p,0x02014b50); yaz16(cikti,p+4,20); yaz16(cikti,p+6,20);
    yaz16(cikti,p+8,0); yaz16(cikti,p+10,0);
    yaz16(cikti,p+12,0); yaz16(cikti,p+14,0);
    yaz32(cikti,p+16,k.crc);
    yaz32(cikti,p+20,k.veri.length); yaz32(cikti,p+24,k.veri.length);
    yaz16(cikti,p+28,k.ad.length);
    yaz16(cikti,p+30,0); yaz16(cikti,p+32,0); yaz16(cikti,p+34,0);
    yaz16(cikti,p+36,0); yaz32(cikti,p+38,0);
    yaz32(cikti,p+42,baslangiclar[i]);
    p+=46;
    cikti.set(k.ad,p); p+=k.ad.length;
  });
  yaz32(cikti,p,0x06054b50);
  yaz16(cikti,p+4,0); yaz16(cikti,p+6,0);
  yaz16(cikti,p+8,kayitlar.length); yaz16(cikti,p+10,kayitlar.length);
  yaz32(cikti,p+12,p-merkezBas); yaz32(cikti,p+16,merkezBas);
  yaz16(cikti,p+20,0);
  return cikti;
}

// ---------------------------------------------------------------- hücreler
function kacis(s){
  return String(s==null?"":s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"");
}
function sutunAdi(n){
  var s="";
  n++;
  while(n>0){ var k=(n-1)%26; s=String.fromCharCode(65+k)+s; n=(n-k-1)/26; }
  return s;
}
// Excel tarih serisi (1899-12-30 başlangıç)
function tarihSerisi(isoTarih){
  var p=String(isoTarih).split("-");
  if(p.length!==3) return null;
  var d=Date.UTC(Number(p[0]),Number(p[1])-1,Number(p[2]));
  if(isNaN(d)) return null;
  return Math.round(d/86400000)+25569;
}

// Stil numaraları (styles.xml ile aynı sırada)
var S={ normal:0, baslik:1, para:2, tarih:3, paraKalin:4, kalin:5, yuzde:6,
        buyukBaslik:7, altBilgi:8, paraPozitif:9, paraNegatif:10 };

/* satirlar: [[hucre,...],...]
   hücre = {d:değer, t:"s"|"n"|"d", s:stil} ya da düz metin/sayı */
function sayfaXml(satirlar,genislikler,dondur,filtre){
  var x=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'];
  x.push('<sheetViews><sheetView workbookViewId="0" showGridLines="0">');
  if(dondur) x.push('<pane ySplit="'+dondur+'" topLeftCell="A'+(dondur+1)+'" activePane="bottomLeft" state="frozen"/>');
  x.push('</sheetView></sheetViews>');
  x.push('<sheetFormatPr defaultRowHeight="15"/>');
  if(genislikler&&genislikler.length){
    x.push("<cols>");
    genislikler.forEach(function(g,i){
      x.push('<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+g+'" customWidth="1"/>');
    });
    x.push("</cols>");
  }
  x.push("<sheetData>");
  satirlar.forEach(function(satir,ri){
    x.push('<row r="'+(ri+1)+'">');
    satir.forEach(function(h,ci){
      if(h===null||h===undefined||h==="") return;
      var deger=h, tip="s", stil=S.normal;
      if(typeof h==="object"){ deger=h.d; tip=h.t||"s"; stil=(h.s===undefined?S.normal:h.s); }
      else if(typeof h==="number") tip="n";
      if(deger===null||deger===undefined||deger==="") return;
      var ref=sutunAdi(ci)+(ri+1);
      if(tip==="n"||tip==="d"){
        var sayi=(tip==="d")?tarihSerisi(deger):Number(deger);
        if(sayi===null||isNaN(sayi)) return;
        x.push('<c r="'+ref+'" s="'+stil+'"><v>'+sayi+'</v></c>');
      } else {
        x.push('<c r="'+ref+'" s="'+stil+'" t="inlineStr"><is><t xml:space="preserve">'+
          kacis(deger)+'</t></is></c>');
      }
    });
    x.push("</row>");
  });
  x.push("</sheetData>");
  if(filtre) x.push('<autoFilter ref="'+filtre+'"/>');
  x.push('<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>');
  x.push("</worksheet>");
  return x.join("");
}

function stillerXml(){
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
  '<numFmts count="3">'+
    '<numFmt numFmtId="164" formatCode="#,##0.00\\ &quot;₺&quot;"/>'+
    '<numFmt numFmtId="165" formatCode="dd\\.mm\\.yyyy"/>'+
    '<numFmt numFmtId="166" formatCode="0%"/>'+
  '</numFmts>'+
  '<fonts count="5">'+
    '<font><sz val="11"/><name val="Calibri"/></font>'+
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'+
    '<font><b/><sz val="11"/><name val="Calibri"/></font>'+
    '<font><b/><sz val="14"/><color rgb="FF1D4E79"/><name val="Calibri"/></font>'+
    '<font><sz val="9"/><color rgb="FF808080"/><name val="Calibri"/></font>'+
  '</fonts>'+
  '<fills count="4">'+
    '<fill><patternFill patternType="none"/></fill>'+
    '<fill><patternFill patternType="gray125"/></fill>'+
    '<fill><patternFill patternType="solid"><fgColor rgb="FF1D4E79"/><bgColor indexed="64"/></patternFill></fill>'+
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF0F6"/><bgColor indexed="64"/></patternFill></fill>'+
  '</fills>'+
  '<borders count="3">'+
    '<border><left/><right/><top/><bottom/><diagonal/></border>'+
    '<border><left/><right/><top/><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border>'+
    '<border><left/><right/><top style="thin"><color rgb="FF1D4E79"/></top><bottom style="double"><color rgb="FF1D4E79"/></bottom><diagonal/></border>'+
  '</borders>'+
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
  '<cellXfs count="11">'+
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+                                   // 0 normal
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1">'+
      '<alignment vertical="center"/></xf>'+                                                            // 1 başlık
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/>'+           // 2 para
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/>'+           // 3 tarih
    '<xf numFmtId="164" fontId="2" fillId="3" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>'+ // 4 para kalın
    '<xf numFmtId="0" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1"/>'+       // 5 kalın
    '<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/>'+           // 6 yüzde
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+                     // 7 büyük başlık
    '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+                     // 8 alt bilgi
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/>'+           // 9
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/>'+           // 10
  '</cellXfs>'+
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'+
  '</styleSheet>';
}

/* sayfalar: [{ad, satirlar, genislikler, dondur, filtre}] */
function kitapYap(sayfalar){
  var dosyalar=[];
  var tipler=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'];
  var kitap=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
    ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'];
  var baglar=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'];

  sayfalar.forEach(function(s,i){
    var no=i+1;
    dosyalar.push({ad:"xl/worksheets/sheet"+no+".xml",
      metin:sayfaXml(s.satirlar,s.genislikler,s.dondur,s.filtre)});
    tipler.push('<Override PartName="/xl/worksheets/sheet'+no+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
    kitap.push('<sheet name="'+kacis(s.ad.slice(0,31))+'" sheetId="'+no+'" r:id="rId'+no+'"/>');
    baglar.push('<Relationship Id="rId'+no+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+no+'.xml"/>');
  });
  kitap.push("</sheets></workbook>");
  baglar.push('<Relationship Id="rId'+(sayfalar.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>');
  baglar.push("</Relationships>");
  tipler.push("</Types>");

  dosyalar.unshift({ad:"[Content_Types].xml",metin:tipler.join("")});
  dosyalar.push({ad:"_rels/.rels",metin:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'+
    '</Relationships>'});
  dosyalar.push({ad:"xl/workbook.xml",metin:kitap.join("")});
  dosyalar.push({ad:"xl/_rels/workbook.xml.rels",metin:baglar.join("")});
  dosyalar.push({ad:"xl/styles.xml",metin:stillerXml()});

  return new Blob([zipKur(dosyalar)],
    {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}

global.KasaExcel={ kitapYap:kitapYap, S:S, sutunAdi:sutunAdi };

})(window);
