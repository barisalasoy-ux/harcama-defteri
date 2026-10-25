# KASA — offline harcama takip uygulaması

Tamamen çevrimdışı çalışan gelir-gider defteri. Veriler **sadece telefonun kendi hafızasında**
durur, hiçbir sunucuya gönderilmez. Telefona kurulabilir (PWA), uygulamadan farkı yoktur.

**Uygulama:** https://barisalasoy-ux.github.io/harcama-defteri/

design by alasoy

> **Kullanım koşulları.** Bu depo incelenebilir olsun diye açık: uygulamanın hiçbir veriyi
> dışarı göndermediğini kendiniz doğrulayabilirsiniz. Kod kamuya açık olmakla birlikte kamu
> malı değildir — tüm hakları saklıdır (bkz. [LICENSE](LICENSE)). Ticari kullanım, yeniden
> yayınlama ve türev ürün çıkarma izne tabidir. Kişisel kullanım, inceleme ve öğrenme amaçlı
> çalıştırma serbesttir.

---

## 1. Bilgisayarda denemek

Bu klasörde bir terminal aç ve:

```bash
python -m http.server 8080
```

Sonra tarayıcıda `http://localhost:8080` adresini aç.

> Dosyaya çift tıklayıp `file://` ile açma — service worker ve mikrofon çalışmaz.

---

## 2. Yayına alma (ücretsiz)

Telefonda çalışması için **https** gerekir. En kolayı GitHub Pages:

1. GitHub'da yeni bir repo aç (örn. `harcama-defteri`), **Public** olsun.
2. Bu klasördeki **bütün dosyaları** reponun köküne yükle
   (`index.html`, `app.css`, `app.js`, `manifest.webmanifest`, `sw.js`, 3 adet `icon-*.png`).
3. Repo → **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save.
4. 1-2 dakika sonra adresin hazır: `https://<kullanıcı-adın>.github.io/harcama-defteri/`

Alternatifler: Netlify Drop (klasörü sürükle-bırak), Cloudflare Pages, kendi sunucun.

---

## 3. Telefona kurma

**Android (Chrome):** Adresi aç → uygulama içindeki **"Telefona kur"** butonuna dokun.
Buton çıkmazsa: sağ üst ⋮ → *Uygulamayı yükle / Ana ekrana ekle*.

**iPhone (Safari):** Adresi aç → Paylaş → **Ana Ekrana Ekle**.
(iOS'ta "Telefona kur" butonu çıkmaz, Safari'nin kendi menüsü kullanılır.)

Kurduktan sonra ikona dokununca tam ekran, uygulama gibi açılır ve **internetsiz çalışır.**

---

## 4. Kullanım

- **Yaz / 🎙 Konuş** → "markete 420 lira verdim, Ali'den 1500 alacağım var ayın 30'una"
  → "Kayda çevir" → çıkan kayıtları kontrol edip ekle.
  Mikrofon Android Chrome'da çalışır; iOS Safari'de klavyedeki mikrofonu kullan.
- **📷** → üç seçenek çıkar:
  - *Fotoğraf çek* — kasada hemen çek, sonra uğraşma.
  - *Galeriden seç* — biriken fişleri **birden fazla** seçebilirsin, sırayla okunup tek listede toplanır.
  - *Dosyadan aktar* — Excel (.xlsx), CSV, Word (.docx), düz metin ya da KASA yedeği (.json).
    Bu tamamen cihazda çalışır: internet de API anahtarı da gerekmez.
- **✎** → elle giriş (tutar, kategori, tarih, taksit, nereden).
- **Hareketler / Alacak & Borç / Aylık rapor / Toplam rapor** → alt menü butonları.
- **Taksit:** 12 taksit 24.000 ₺ girersen her aya 2.000 ₺ düşer, raporda kalan borç görünür.
- **Her şey dahil:** bu ayın kalanı + açık alacak − açık borç − gelecek taksit yükü.
- **Ayarlar & yedek:** JSON yedek al / geri yükle, CSV indir, tema değiştir, hepsini sil.

### Metin çözümleyici neyi anlar
- Tutar: `420`, `1.250,50`, `2500 tl`
- Taksit: `12 taksit`
- Tarih: `dün`, `evvelsi gün`, `geçen hafta`, `ayın 30'u`, `15.11`
- Tür: `verdim/ödedim` → gider · `maaş yattı/sattım` → gelir ·
  `Ali'den alacağım` → alacak · `Mehmet'e borcum var` → borç
- Kategori: 29 kategori, anahtar kelimeyle (market, bebek bezi, benzin, eczane, kira, aidat…)

Yanlış anlarsa onay ekranından düzeltirsin; hiçbir şey sormadan kaydetmez.

---

### Aynı şeyi iki kere eklemeye karşı

İki ayrı kontrol var:

1. **Aynı fotoğraf.** Okunan her karenin parmak izi saklanır. Aynı fişi unutup ikinci kez
   okutursan, Gemini'ye göndermeden önce "bunu daha önce okuttun" diye sorar — hem yanlış
   kayıttan hem boşa API hakkından korur.
2. **Aynı kayıt.** Tür + tutar + tarih + açıklama birebir aynıysa o satır "bu kayıt zaten var"
   diye işaretlenir ve kutucuğu kendiliğinden boş gelir. Gerçekten aynı şeyi tekrar aldıysan
   işaretleyip eklersin. Dosyadan aktarmada da çalışır: aynı Excel'i ikinci kez verirsen
   "daha önce eklenenleri atla" seçili gelir.

Bu kontrol yazarak/konuşarak girişte de geçerli.

### Dosyadan aktarma nasıl çalışır

Banka ekstresi ya da kendi tuttuğun liste binlerce satır olabilir; onu fotoğraflamak anlamsız.
`📷 → Dosyadan aktar` ile dosyayı seç, uygulama satırları okuyup kayda çevirir.

- **Başlık satırı varsa** sütunlar isimlerinden eşleşir: `Tarih`, `Açıklama`, `Tutar`, `Tür`,
  `Kategori`, `Kişi`, `Taksit`. Sıraları önemli değil, hepsi olmak zorunda değil — tek şart `Tutar`.
- **Başlık yoksa** sütunlar içerikten tahmin edilir (tarihe benzeyen sütun tarih, sayı sütunu tutar,
  en uzun metin sütunu açıklama).
- **Tür sütunu yoksa** açıklamadan anlaşılır: "Ayşe'ye borç verdim" → alacak, "Güney'den borç aldım"
  → borç, "Maaş" → gelir, gerisi gider.
- **Word'de** hem tablolar hem düz paragraflar okunur; paragraflar cümle olarak çözümlenir
  ("Ahmet'ten 1500 alacağım var").
- Eklemeden önce özet ekranı çıkar: kaç satır, hangi türden kaç kayıt, tarih aralığı, ilk satırlar.
  40 satıra kadar "Tek tek incele" ile hepsini düzeltebilirsin.

Excel'e aktar → düzelt → geri aktar şeklinde de kullanılabilir.

---

## 5. Yedek uyarısı

Veriler tarayıcının deposunda. **Tarayıcı verilerini temizlersen kayıtlar gider.**
Ayda bir "Yedek al (JSON)" yap, dosyayı buluta/maile at. Telefon değişince
"Yedekten geri yükle" ile aynen döner.

---

## 6. Sonraki adım: fiş okuma (AI)

Şu an AI yok, her şey cihazda. Fiş fotoğrafından otomatik kalem çıkarma eklenecekse:
kullanıcı kendi **Gemini API anahtarını** Ayarlar'a girer, anahtar yine telefonda saklanır.
Anahtarı olmayan için uygulama aynen bugünkü gibi çalışmaya devam eder.

---

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Ekran iskeleti |
| `app.css` | Tasarım, açık/koyu tema |
| `app.js` | Bütün mantık: kayıtlar, taksit, raporlar, mikrofon, çözümleyici |
| `sw.js` | Offline çalışmayı sağlayan service worker |
| `manifest.webmanifest` | Uygulama adı, ikon, tam ekran ayarı |
| `icon-*.png` | Ana ekran ikonları |

Kodda bir şey değiştirirsen `sw.js` içindeki `SURUM` değerini artır (`defter-v1` → `defter-v2`),
yoksa telefon eski sürümü önbellekten açmaya devam eder.
