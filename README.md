# LMGame

Pixel art tabanlı, tarayıcıda çalışan kasaba yönetimi / hayat simülasyonu / karakter yönetimi oyunu.
Saf HTML + JavaScript (ES modülleri), harici kütüphane veya derleme adımı yok.

## Çalıştırma

ES modülleri `file://` üzerinden açılamaz, yerel bir sunucu gerekir. Proje kökünden:

```bash
python3 tools/serve.py
```

Bu küçük sunucu dosyaları önbelleğe aldırmaz; böylece kod değişince sayfayı yenilemek
yeterlidir. (`python3 -m http.server 8080` de çalışır ama tarayıcı eski modülleri
önbellekte tutabilir; o durumda Cmd/Ctrl+Shift+R ile tam yenileme gerekir.)

Ardından tarayıcıda `http://localhost:8080` adresini aç.

İlk açılışta (ya da oturum kaydı yoksa) **başlangıç ekranı** gelir: arkada kasaba sessizce yaşar,
ortada "Kaldığın Yerden Devam Et" (son elle / otomatik kayıt) ve "Yeni Kasaba Kur" (kasaba adı ve
isteğe bağlı tohum) düğmeleri vardır. Oyun sırasında sayfayı yenilediğinde (F5) ya da sekmeyi kapatıp
açtığında kasaba tam olduğu gibi geri gelir (bkz. *Kayıt ve yükleme*). Aynı haritayı baştan görmek için
tohum verilebilir: `http://localhost:8080/?seed=42` (mevcut tohum dock'taki **Ayarlar** penceresinde yazar);
tohumlu adres her zaman yeni oyun başlatır ve tohumu adres çubuğundan siler, böylece F5 o oyunu sürdürür.

**Kontroller**

| Girdi | Eylem |
|---|---|
| Sol tık (karakterin / yapının üstüne) | Sakini ya da yapıyı (harabe dahil) seç, bilgi panelini aç |
| Yapı panelinde bir isme tık | O sakini seç ve kamerayı ona kaydır |
| İnşa Et → **Yol & Zemin** fırçasıyla sürükle | Patika / parke / taş plaka kesintisiz çizilir; virajlar ve kavşaklar kendiliğinden köşelenir |
| İnşa Et → çit, saksı ya da fidanla sürükle | Art arda dikilir |
| Yık (X) ile sürükle | Yolları, çitleri ve küçük süsleri geri dönüştürür (%50 iade); tıklanan yapı yıkılır |
| Mahalle tabelasına tıkla → paneldeki kutu | Sokağa / semte ad ver (Enter) |
| Yapı panelinde **Yükselt** / **Onarımı Başlat** | Yapıyı Seviye 2'ye yükselt ya da harabeyi onar (maliyet peşin) |
| Yapı panelinde **İşten Çıkar** / **Geri Al** | Çalışanı o iş yerinden çıkar (başka iş arar) / yeniden çalışabilsin |
| Zanaat Atölyesi panelinde **Otomatik / Alet / Palto / Çanta** | Atölyenin ne üreteceğini seç |
| Ticaret İskelesi panelinde **Sözleşmeyi Tamamla** / **Odun · Taş · Demir Paketi** | (24.3) Gemi / kervan buradayken ihracat talebini tek tıkla tamamla (mallar depodan düşer, hazineye altın girer) ya da altınla hammadde paketi ithal et (anında ambara iner) |
| Dokuma Tezgâhı / Şerbethane paneli | (24.2) Saatlik oran (2 keten → 1 kumaş, 2 şerbetçiotu → 1 fıçı), dokunan kumaş ve refah katkısı, hanlardaki fıçılar; **İşçi Ata** ile dokumacı / mahzen ustası sabitlenebilir |
| Sebze Bahçesi panelinde **Ekim Tercihi: Buğday / Keten / Şerbetçiotu** | (24. aşama) Bahçeye ne ekileceğini seç: Buğday / Sebze yiyecek, Keten ve Meyve / Şerbetçiotu yeni hammadde üretir |
| Üst çubukta **Mallar ▾** | İşlenmiş malların (Yün, Demir, Ekmek) açılır listesi: miktar, depo sınırı, üreticiler (seçim hatırlanır) |
| Üst çubukta kasaba adının yanındaki dört pip | Kasaba seviyesi; üzerine gelince sonraki seviyenin koşulları ve ödülleri |
| Karar penceresindeki seçenekler | Sürpriz olayda kararını ver (oyun durur; 30 sn içinde seçmezsen varsayılan güvenli seçenek) |
| Belediye Konağı panelinde **Fermanı İlan Et** | Büyük Ziyafet, Depo Genişletmesi ya da Zanaat Loncası fermanını ilan et |
| Hasarlı yapının panelinde **Onarımı Başlat** | Fırtınada / kurt saldırısında hasar gören yapıyı onar |
| Hasarlı yapının panelinde **Tamir Et** | (23. aşama) İnşa maliyetinin %25'iyle (odun + taş) yapıyı anında onar; yoksa boştaki ustalar yangın / baskın hasarını 2 saat sonra kaynak yetiyorsa kendiliğinden onarır |
| Yanan yapının panelinde **Acil Söndür (Kova Zinciri)** | (23. aşama) Yangını anında, hasarsız söndür (Güven +2); sakinler zaten kovalarla koşar |
| Üst çubuğun altındaki **Haydut izleri · N sa** çipi (ya da Gözcü Kulesi / Belediye / meydan paneli) | (23. aşama) Haydut Baskını penceresi: A bekçilerle püskürt, B haraç öde, C hazırlıksız yakalan |
| Üst çubuğun altındaki **… yanıyor · %N** çipi | (23. aşama) Yanan yapıyı seç, panelinden söndür |
| Ayarlar > **Tehlike Sıklığı** (Huzurlu / Dengeli / Çetin) | (23. aşama) Doğal yangın ve haydut baskını sıklığı (kayda girer) |
| Bilgelik Evi panelinde **Araştır** | Kasaba araştırmasını başlat (maliyet peşin; Bilge çalıştıkça ilerler) |
| Liman panelinde **Kapalı / 250+ / 400+ / 550+** ve **İhracat Sandığı Hazırla** | Otomatik fazlalık ihracatının stok sınırını seç; rıhtıma bir ihracat sandığı koy |
| Harikanın panelinde **Aşamayı Başlat** | Büyük Vadi Saat Kulesi'nin sıradaki aşamasını (Gövde, Görkemli Kule) başlat |
| Takas penceresinin **Lüks Mallar (Altın)** sekmesi / limanın paneli | Altınla baharat sandığı, ipek ve mermer ya da kasaba yadigârı satın al |
| Belediye Konağı panelinde **Altın Fermanları** | Ustalara Altın İkramiye ya da Kraliyet Mimarları fermanını ilan et |
| Karakter panelinde sakinin **adına** tık | Sakinin adını değiştir (Enter kaydeder, Esc vazgeçer) |
| Yapı panelinde **İşçi Ata** / **Sabitle** / **Sabitlemeyi Kaldır** | Bir sakini o iş yerine sabit çalışan yap (yalnızca orada çalışır) ya da serbest bırak |
| `I` / dock'ta **Arşiv** | Kasaba Arşivi'ni aç / kapat: son 32 günün grafikleri ve kasabanın tarihi |
| Liman / Belediye Konağı panelinde **Sefere Çıkar** | 3 kişilik keşif kafilesini bir günlük sefere gönder (yolda iki kez kararını isterler) |
| Bilgelik Evi panelinde **Çöz** | Harabeden ya da seferden gelen kadim yazıtı Bilge'ye çözdür (kalıcı imar şeması) |
| Arşivde **Usta İşi Eserler** · **Sergile** / **Sat** | Ustaların eserini vitrinde sergile (kalıcı +1 refah) ya da limandan / tüccara sat (200-400 altın) |
| Bir kediye ya da köpeğe sol tık | Hayvanı sev: sevinçle zıplar, kalpler uçuşur, miyavlar / havlar |
| Seç aracıyla bir ağaca ya da kayaya sol tık | Öncelikli kesme / kırma emri: boştaki işçiler ilk iş olarak oraya koşar (kırmızı ünlem) |
| Meydan havuzunun ya da Belediye Konağı'nın panelinde **Zili Çal** | Toplanma Zili: uyanık bütün sakinler bir saatliğine meydanda toplanır |
| Liman panelinde **Büyük İhracat Seferi** | Altınla kervan teknesi çağır: 2,5 kat yük, 350'yi aşan mallar gider |
| `F` / dock'ta **Fotoğraf** | Fotoğraf modu: bütün arayüz gizlenir; kamerayı gezdirip kasabayı seyret (`F`, `Esc` ya da sağ alttaki ipucu geri getirir) |
| Karakter panelinde eşin, çocuğun, ebeveynin ya da bir ilişkinin adı | O sakini seç |
| Karakter kartında **Sosyal Hayat** bölümü | Sakinin huyu, eşi ve paylaştıkları ev, son duyduğu dedikodu (eşin adına tıklayınca o seçilir) |
| Karakter kartında **Kişisel Kese & Çanta** | Sakinin kesesindeki altın ve çantasındaki eşyalar (üzerine gelince ne işe yaradığı) |
| Karakter kartındaki parşömen kutusu: **Kabul Et** / **Fidanı Dik · Bank Koy · Aleti Ver · Zili Çal** / **Reddet** | Sakinin dilekçesini kabul et (yarım gün ek süre), bedelini ödeyip hemen karşıla ya da reddet |
| Üst çubuğun altındaki **Dilekçe · Ad** çipi / kırmızı **İsyan!** çipi | Dilekçe sahibini seç / meydan havuzunun (ya da Belediye Konağı'nın) panelini aç |
| Meydan havuzunun ya da Belediye Konağı'nın panelinde **Erzak Dağıt** / **Altın Dağıt** | Halka acil erzak ya da altın dağıt: Yönetim Güveni artar, isyan yatışır (12 saatte bir) |
| Belediye Konağı'nın (ya da meydan havuzunun) panelinde **Muaf / Düşük / Standart / Ağır** | İç vergi kademesini seç (her 3 günde bir öğlen tahsil edilir) |
| Belediye panelindeki ferman kartında **Teslim Et** / **Reddet** | Kraliyet Fermanı'nı teslim edip ödülü al ya da reddet (ceza kesilir) |
| Üst çubuğun altındaki **Tahsildar yolda** / **Ferman** / **Terk ediş!** çipleri | Belediye Konağı'nın panelini aç |
| `B` / dock'ta **İnşa Et** | İnşa et aracı (dock'un üstünde açılan listeden yapı seç, haritada tıkla; yolu sürükleyerek döşe; düğmeye yeniden basmak aracı bırakır) |
| `H` / dock'ta **Topla** | Kaynak topla aracı (ağaç, kaya, çalı üzerinde sürükle; emirliden başlarsan kaldırır) |
| `X` / dock'ta **Yık** | Yık / iptal aracı (yapı, şantiye, yol, toplama emri) |
| Sağ üstteki **Kasaba Sakinleri** çekmecesinde bir isim | Sakini seç ve kamerayı ona kaydır; bilgi kartı sağ altta açılır |
| Çekmecenin başlığındaki ▸ / kapalıyken kenardaki sekme | Sakinler listesini sağa doğru kapat / sağdan kayarak aç (seçim hatırlanır) |
| `Esc` / pencerenin ya da kartın ✕ düğmesi | Önce açık pencereyi, sonra aracı, sonra seçimi bırak |
| Ortadaki pencerenin dışına tık | Pencereyi kapat (tıklama haritaya geçmez) |
| `J` / dock'ta **Günlük** | Kasaba Günlüğü'nü ekranın ortasında aç / kapat (okunmamış olay sayısı düğmede) |
| `O` (eski kısayol `G` de çalışır) / dock'ta **Hedefler** | Kasaba Hedefleri penceresini aç / kapat |
| Dock'ta **Ayarlar** | Kaydet / Yükle / Yeni Harita, ses, harita tohumu ve bütün kısayollar |
| Dock düğmesinin üzerine gel | Kısayolu ve ne işe yaradığını söyleyen küçük ipucu |
| Seç aracıyla haritada bir karonun üzerinde bekle | İmlecin yanında karo ipucu: "Toprak Yol · Yürünebilir", sakin, yapı ya da iş emri |
| Üst çubukta kasaba adına tık | Kasabanın adını değiştir (Enter kaydeder, Esc vazgeçer) |
| Gezgin tüccara ya da tüccar varken Pazar Yeri'ne tık | Takas penceresini aç |
| Üst çubukta hoparlör düğmesi (ya da Ayarlar > Ses) | Sesi kapat / aç (tercih hatırlanır; ses ilk tıklamayla başlar) |
| Üst çubukta **6/8** nüfus çipinin üzerine gel | Yarın sabahki göç koşulları (yatak, yiyecek, refah) |
| Üst çubukta mevsim çipi ("Sonbahar 2/4") | Hangi mevsimde ve kaçıncı gününde olduğun; üzerine gelince yıl |
| Ayarlar: **Kaydet** / **Yükle** / **Yeni Harita** | Oyunu kaydet, son kayda dön, rastgele yeni haritayla baştan başla (onay ister) |
| WASD / ok tuşları | Kamerayı kaydır (takibi bırakır) |
| Sağ (veya orta) tık + sürükle | Haritayı sürükle |
| Fare tekerleği, `+` / `-` | Yakınlaştır / uzaklaştır (2x – 6x) |
| Boşluk | Zamanı durdur / devam ettir |
| `1` `2` `3` veya üst çubuktaki 1x / 2x / 4x düğmeleri | Zaman hızı (❚❚ düğmesi duraklatır) |

## Klasör yapısı

```
LMGame/
├── index.html              Tek sayfa: canvas + HTML arayüz katmanı
├── tools/serve.py          Önbelleksiz geliştirme sunucusu
├── tools/art-preview.html  Yapı ve simgeleri büyütülmüş gösteren sanat önizleme sayfası (/tools/art-preview.html)
├── tools/sim/              Başsız simülasyon ve test araçları (Playwright): otopilot, hedefli testler, eski kayıt
│                           uyumluluğu, önizleme ve vitrin ekran görüntüleri; fixtures/ eski sürüm kayıtları
├── styles/
│   ├── main.css            Sayfa düzeni, pixel-perfect canvas ayarları
│   └── ui.css              Arayüz (HUD, paneller) stilleri
├── assets/                 Dışarıdan yüklenen dosyalar (PNG, ses, font, harita JSON)
│   ├── images/{characters,buildings,tiles,ui,effects}/
│   ├── audio/{music,sfx}/
│   ├── fonts/
│   └── maps/
└── src/
    ├── main.js             Giriş noktası; yalnızca kurulum yapar
    ├── config.js           Tüm sabit ayarlar (karo boyutu, ölçek, zaman hızı…)
    ├── core/               Motor: oyundan bağımsız, her projede kullanılabilir
    │   ├── Game.js         Alt sistemleri birleştiren merkez
    │   ├── GameLoop.js     Sabit adımlı güncelleme + çizim döngüsü
    │   ├── EventBus.js     Sistemler arası olay yayını
    │   ├── Input.js        Tuş → eylem eşlemesi, fare
    │   ├── SceneManager.js Sahne geçişleri
    │   ├── SoundEngine.js  Web Audio ile ses sentezi: nota, filtreli gürültü, sürekli ambiyans katmanları
    │   └── AssetLoader.js  assets/ klasöründen dosya yükleme
    ├── rendering/          Çizimle ilgili her şey
    │   ├── Renderer.js     Canvas soyutlaması, tam sayı zoom ile pixel-perfect çizim
    │   ├── Camera.js       Konum, imleç etrafında zoom, sınırlar, görünür alan
    │   ├── DayNightOverlay.js Saate göre atmosfer rengi + gece ışıkları; bulutlu / yağmurlu havada gri örtü
    │   ├── JobMarkers.js   İş emri verilmiş hedeflerin üstündeki balta / kazma / sepet ve ilerleme
    │   ├── WeatherEffects.js Yağmur damlaları, su / yer sıçrama halkaları, bulut gölgeleri
    │   ├── Fireflies.js    Açık gecelerde orman ve nehir kıyısında yanıp sönen ateşböcekleri
    │   ├── FestivalEffects.js Şenlikte renkli fener dizisi ve havada süzülen notalar
    │   ├── ChimeWaves.js   (20. aşama) Ulu Saat Kulesi çalınca çan odasından yayılan altın ses dalgaları ve notalar
    │   ├── WeddingConfetti.js (19. aşama) Meydandaki düğün kutlamasında konfeti demeti, süzülen kâğıtlar ve kalpler
    │   ├── SeasonalEffects.js Sonbaharda ağaçlardan süzülen yapraklar (kar yağışı WeatherEffects'te)
    │   ├── RenderQueue.js  Y-sıralı çizim kuyruğu (ağacın arkasındaki gerçekten arkada kalır)
    │   └── TileCursor.js   Karo / alan vurgusu (köşe parantezleri; seçili yapı, hayalet önizleme)
    ├── art/                Kodla çizilen pixel art
    │   ├── palette.js      Tek renk paleti (karakter → renk)
    │   ├── PixelSprite.js  Metin ızgarasını canvas'a çevirir, önbellekler; ızgara yardımcıları, CharGrid
    │   ├── seasons.js      Mevsim boyaları: çimen ve yaprak tonları, bahar çiçekleri, kar kapakları,
    │   │                   yapıları kışlık yapan winterize (çatılar karla örtülür)
    │   ├── tiles/          Zemin karoları, kenar geçişleri, ağaç ve kayalar
    │   ├── ui/             İmleç, HUD ve kaynak simgeleri, iş işaretleri, ifade balonları,
    │   │                   elde tutulan aletler, taşınan yükler, seçim halkası
    │   └── sprites/
    │       ├── characters.js Sakin şablonu: 5 saç stili × kişiye özel renkler, yürüme/nefes/oturma kareleri;
    │       │                 çocuk boyu (12x14), palto ve sırt çantası katmanları
    │       ├── structures.js Kulübe, havuz, bank, ateş, çalı, oduncu, bahçe, kiler, şantiye
    │       ├── structuresExtra.js Taş ocağı, balıkçı iskelesi (+ şantiyesi), çiçek tarhı, han (sallanan
    │       │                 tabela), pazar yeri (tüccar gelince flama), fener, anıt
    │       ├── structuresTier2.js Seviye 2 yapılar (Taş Ev, Kereste Atölyesi, Cam Sera, Derin Maden
    │       │                 Ocağı) ve kadim harabeler (yıkık / onarılmış kule, erzak kampı, çeşme)
    │       ├── structuresCraft.js Zanaat Atölyesi (tezgâh, alet askısı, mankende palto, kıvılcımlı örs)
    │       ├── structuresFarm.js Koyun Ağılı (iki katman: otlak + ahır / ön çit) ve koyunlar, kuzu
    │       ├── structuresIndustry.js Yel Değirmeni ve Fırın (dönen kanatlar, alevli fırın), Demir Madeni
    │       │                 (kayalık tepe, tünel, raylarda gidip gelen cevher vagonu)
    │       ├── structuresCivic.js Belediye Konağı (saat kulesi, dalgalanan bayrak, sütunlu revak)
    │       ├── structuresHealth.js Şifacı Kulübesi (saman çatıda kurutulan otlar, havan, kaynayan kazan)
    │       ├── structuresWisdom.js Bilgelik Evi (kitaplıklı pencereler, saat kadranı, dürbünlü gözlem kubbesi)
    │       ├── structuresHarbor.js Büyük Ticaret Limanı (rıhtım, ambar, yük vinci, fener; şantiye) ve ticaret teknesi
    │       ├── structuresWonder.js Büyük Vadi Saat Kulesi: üç aşama (Temel, Gövde, Görkemli Kule) ve iskele kademeleri
    │       ├── structuresGarden.js Kiraz Çiçeği Ağacı (dört mevsim), iki katmanlı Ahşap Çardak, Mermer Kemer, birleşen Çiçekli Çit
    │       ├── festival.js   Mevsim festivali süslemeleri (çiçek kemeri, ziyafet sofrası, hasat sepeti, kardan adam...), saç çiçeği
    │       ├── structuresExplore.js (16. aşama) Üzüm Asması (dört mevsim) ve mavi alevli Kadim Meşale
    │       ├── structuresSafety.js (23. aşama) Su Kuyusu (üç su parıltısı karesi) ve Gözcü Kulesi (gündüz / gece)
    │       ├── structuresLandscape.js (18. aşama) Ahşap çit ve kapısı (16 bağlantı), demir fener, mahalle tabelası,
    │       │                 park bankı, çiçek saksısı, huş / meşe / çam süs ağaçları (üç büyüme kademesi, dört mevsim)
    │       ├── outfits.js    (15. aşama) Meslek kıyafetleri: on kit, Kalfa aksesuarı ve Usta kostümü (başlık + gövde katmanı)
    │       └── animals.js    Tavşan, geyik, kedi ve köpek (otomatik konturlu, poz ve renk çeşitleri)
    ├── data/               Saf veri tanımları (oyun kuralları, denge değerleri)
    │   ├── tiles.js        Karo/nesne kuralları: yürünebilir, inşa edilebilir, yol bulma maliyeti;
    │   │                   mikro-biyom karoları ve yapı bonusları
    │   ├── buildings.js    Yapı kuralları: boyut, maliyet, inşaat süresi, üretim, kapasite; inşa menüsü;
    │   │                   Seviye 2 yükseltmeleri (upgrade) ve kadim harabeler (ruin)
    │   ├── resources.js    Odun / Taş / Yiyecek ve işlenmiş mallar Yün / Demir / Ekmek (ekmek 2,5 yiyecek
    │   │                   değerinde), Kasaba Hazinesi (Altın, depo sınırı yok), başlangıç stoğu, depo kapasitesi,
    │   │                   öğün maliyeti
    │   ├── festivals.js    Dört mevsim kapanış festivali: saatler, yerler, bonuslar, süslemeler, anı cümleleri
    │   ├── exploration.js  (16. aşama) Sefer kuralları, dört macera ve seçenekleri (risk, usta / alet kuralları, ganimet),
    │   │                   egzotik ganimetler, üç kadim yazıt ve imar şemaları, üzüm asması
    │   ├── citizens.js     (21. aşama) Kişisel kese (harçlık, yevmiye), çanta eşyaları ve yuvaları, iş yerinden pay,
    │   │                   alışveriş, dilekçe türleri ve etkileri, Yönetim Güveni, yatıştırma, isyan ve yağma sayıları
    │   ├── crisis.js       (23. aşama) Tehlike Sıklığı (Huzurlu / Dengeli / Çetin), yangın olasılıkları ve söndürme, Su Kuyusu,
    │   │                   Gözcü Kulesi ve bekçiler, haydut baskını (haraç, ganimet, savunma), hafif yaralanma, tamir sayıları
    │   ├── crown.js        (22. aşama) İç vergi kademeleri ve öşür, Krallık Vergisi ve itibar, beş Kraliyet Fermanı ve
    │   │                   ödülleri, Kraliyet Aslanlı Heykeli, terk ediş ve kötü şöhretin göçe etkisi
    │   ├── goldenAge.js    (20. aşama) Ulu Saat Kulesi'nin açılışı ve ustalık katkısı, Kadim Dişli, Çağ Kutlaması, Altın Çağ
    │   │                   çanı ve çarpanları, Tarihçe, tüccarın nadir malları
    │   ├── social.js       (19. aşama) Flört ve randevu, düğün kutlaması, evli çiftin akşam yemeği, dört karakter
    │   │                   huyu (Hayvansever, Kitap Kurdu, Müzisyen, Doğa Tutkunu) ve dedikodunun sayıları
    │   ├── landscape.js    (18. aşama) Çevre estetiği değerleri ve yarıçapı, refah çarpanı eşikleri, karanlık ve ışıklar,
    │   │                   çamur, süs ağaçlarının büyümesi, sokak adları, inşa menüsü sekmeleri
    │   ├── masterpieces.js (15. aşama) Usta işi eserler: altı eser, meslekleri, iş yerleri, fiyatları; şans ve sergi kuralları
    │   ├── luxury.js       Altın harcama kanalları: lüks mallar (baharat, ipek ve mermer), beş kasaba yadigârı ve artan
    │   │                   fiyatları, altın fermanları (ikramiye, kraliyet mimarları)
    │   ├── research.js     Bilgelik Evi araştırmaları (maliyet, iş, etki) ve okul kuralları (ders saati, Kalfa eşiği)
    │   ├── jobs.js         İş emri türleri (inşaat, kesim, kırma, toplama), öncelik, işçi sayısı
    │   ├── weather.js      Hava türleri ve geçiş olasılıkları, yağmurun etkileri, ateşböceği saatleri
    │   ├── relationships.js İlişki seviyeleri (Rakip … En İyi Arkadaş), puan hızları, aşk ve evlilik kuralları
    │   ├── family.js       Mutlu Yuva, çocuklar ve büyüme, çocuk adları; atışma ve barışma olasılıkları
    │   ├── health.js       Üşütme / halsizlik: maruziyet kaynakları, olasılık, etkiler; Dinçlik bonusu
    │   ├── animals.js      Yaban hayatı (tavşan, geyik) ve kasaba hayvanları (kedi, köpek): sayı, hız, ürkme, sevme
    │   ├── dilemmas.js     İkilem / karar olayları, seçenekleri, fırtına hasarı, keşif seferi ganimetleri
    │   ├── equipment.js    Ekipman yuvaları, Sağlam Alet / Kışlık Palto / Sırt Çantası, asıl (demir / yün) ve
    │   │                   eski usul tarifler, atölye üretim modları
    │   ├── town.js         Refah ağırlıkları, göç koşulları, şenlik kuralları, kasaba bonusları, sıcak yemek,
    │   │                   kasaba seviyeleri (Mezra -> Gelişmiş Şehir), belediyenin erzak dengesi ve fermanları
    │   ├── trade.js        Takas teklifleri (sonbahara ve kasaba seviyesine özel olanlar dahil), seviyeye göre
    │   │                   stok ve gezgin tüccarın ziyaret düzeni; nehir ihracatı (altın değerleri, sınırlar,
    │   │                   sandık, tekne aralığı ve kapasitesi)
    │   ├── seasons.js      4 mevsim: bahçe / çalı / büyüme çarpanları, kış, hava ağırlıkları, ışık tonu; ısınma
    │   ├── skills.js       Meslekler, etkinlik -> meslek eşlemesi, Çırak / Kalfa / Usta kademeleri
    │   ├── milestones.js   9 kasaba hedefi: ad, açıklama, simge, ölçüm türü ve hedef sayı
    │   ├── characters.js   İhtiyaçlar, kişilik özellikleri, mesai ve günlük düzen, sakin havuzu
    │   └── activities.js   Etkinlikler: süre, ihtiyaç kazanımı, poz, balonlar, durum metinleri
    ├── world/              Harita ve dünya sorguları
    │   ├── TileMap.js      Zemin + varyasyon + nesne + yapı doluluğu katmanları, culling'li çizim
    │   ├── WorldGenerator.js Nehir, mikro-biyomlar, yollar, köprü, orman, kayalık + havuz, bank, ateş,
    │   │                   kulübe, çalı, kadim harabeler ve onlara giden patikalar
    │   ├── TerrainSnapshot.js Kayıt için haritanın üretilmiş hâlinden farkları (yol, kütük, kesilen ağaç…)
    │   ├── footprint.js    Yapıya ulaşmak için gereken karolar (kapı önü, ön cephe, iskele iniş yeri)
    │   ├── World.js        Dünyaya tek kapı: yapı ekle/kaldır, sakinler, buluşma ve çalışma noktaları,
    │   │                   rezervasyon, yol bulma, konut kapasitesi, harita girişi
    │   └── residents.js    Başlangıç sakinlerini seçer, evlere yerleştirir
    ├── entities/           Dünyadaki nesneler (veri + çizim)
    │   ├── Entity.js       Temel sınıf
    │   ├── Character.js    Kasaba sakini: kimlik, ihtiyaçlar, konum, poz, balon, çizim
    │   ├── Building.js     Yapı: şantiye ilerlemesi, içindekiler, çalışanlar, üretim, ışıklar, çizim
    │   ├── Flock.js        Koyun ağılındaki sürü (yalnızca görsel): otlama, dolaşma, gece ahır önünde uyku
    │   ├── Boat.js         Nehirdeki ticaret teknesi (yalnızca çizim): yön, yük, köpük izi; yolculuğu HarborSystem yönetir
    │   └── Animal.js       Hayvan: tür, ad, renk, yuva, anlık poz ve sevilince çıkan kalp
    ├── ai/                 Karar verme
    │   ├── TraitProfile.js Kişilik özelliklerini tek profile birleştirir (iş hızı, mola, yorulma dahil)
    │   └── Brain.js        "Sırada ne yapayım?" — öncelikler, yemek, iş, taşıma, davet, boş zaman
    ├── systems/            Simülasyon mantığı (her biri tek bir konudan sorumlu)
    │   ├── TimeSystem.js   Saat/gün ilerlemesi, diğer sistemlere adım (tick) bilgisi
    │   ├── NeedsSystem.js  İhtiyaçların zamanla azalması
    │   ├── MovementSystem.js Yol noktaları boyunca yürüme
    │   ├── BehaviorSystem.js Karakter durum makinesi: yürü → yap → bitir; sohbet, çalışma, taşıma
    │   ├── StructureSystem.js Ateş / fener yanması, böğürtlen yenilenmesi, üretim verimi çarpanları
    │   │                   (mevsim, ağaç, yağmur, biyom, seviye)
    │   ├── EconomySystem.js Kaynak bankası: harca / ekle / iade, depo kapasitesi, uyarılar; yiyecek değeri
    │   │                   (öğünler önce ekmek yer), işlenmiş malların üretim sayacı
    │   ├── JobSystem.js    İş kuyruğu: toplama ve inşaat emirleri, kime hangi iş, tamamlanma
    │   ├── ConstructionSystem.js Yerleşim kontrolü, şantiye, yol/köprü döşeme, yıkım; yükseltme ve
    │   │                   harabe onarımı (proje başlat / iptal / tamamla, erzak hazinesi)
    │   ├── NatureSystem.js Kesilen ağaç: kütük → fidan → ağaç
    │   ├── PopulationSystem.js Göçmen üretir, boş eve yerleştirir ve harita kenarından yürütür
    │   ├── EventSystem.js  Dinamik olaylar: göç koşulları, gezgin tüccar ve takas, akşam şenliği
    │   ├── TownStatus.js   Saf hesaplar: refah (anıt ve gözetleme kulesi bonusu dahil), konut kapasitesi,
    │   │                   göç durumu, kasaba bonusları, toplam yiyecek değeri, kasaba seviyesi ölçütleri ve unvanı
    │   ├── AudioSystem.js  Olayları seslere bağlar; yağmur, su, kuş, cırcır, kış rüzgârı, şenlik ezgisi
    │   ├── HeatingSystem.js Kışın odun yakma, odun bitince soğuk evler, üşüme ve "İçi Isındı"
    │   ├── SkillSystem.js  Meslek deneyimi, kademe atlama, ustalık iş hızı bonusu
    │   ├── MilestoneSystem.js Kasaba hedefleri: ilerleme, tamamlanma, kış sınavı takibi, anıt kutlaması
    │   ├── TownLevelSystem.js Kasaba seviyesi: ortalama refah, seviye atlama ve kutlama, belediyenin erzak dengesi
    │   ├── HealthSystem.js Maruziyet, üşütme, kendiliğinden iyileşme, şifacıda tedavi ve Dinçlik
    │   ├── AnimalSystem.js Yaban hayatı (dolaşma, ürküp kaçma, gece yuva) ve kedi / köpek (gelme, dolaşma, uyku, sevilme)
    │   ├── DilemmaSystem.js Karar olayları: zamanlama, seçenek koşulları, zaman aşımı, fırtına, kurtlar, keşif seferi
    │   ├── CivicSystem.js  Belediye fermanları: Büyük Ziyafet, Depo Genişletmesi (+150 kapasite, taş yollar), Zanaat Loncası
    │   ├── ResearchSystem.js Bilgelik Evi: araştırma başlatma / ilerletme, etkilerin saf yardımcıları, okul ve Kalfa mezun
    │   ├── HarborSystem.js Liman: fazlalık ihracatı sınırı, ihracat sandığı, teknenin nehir yolu, yükleme ve Kasaba Hazinesi
    │   ├── Luxury.js       Altın ekonomisinin saf hesapları: satın alınabilirlik, yadigâr fiyatı, kalıcı ve geçici etkiler
    │   ├── LuxurySystem.js Lüks mal, yadigâr ve altın fermanı alımları (altını öder, etkiyi başlatır)
    │   ├── StatsSystem.js  Kasaba Arşivi: her sabah nüfus / refah / stok / altın özeti, düğün ve doğum sayaçları
    │   ├── SeasonFestivalSystem.js Mevsim festivalleri: duyuru, yer ve süsleme, katılım, Mevsim Coşkusu
    │   ├── MemorySystem.js Sakinlerin anıları (yaşam günlüğü) ve sakin anlarda güzel bir anıyı hatırlama
    │   ├── RallySystem.js  Toplanma Zili: sakinleri bir saatliğine meydanda toplar
    │   ├── ExpeditionSystem.js (16. aşama) Keşif seferleri: yola çıkış, maceralar, kaza, dönüş, ganimet, anılar, handa
    │   │                   hikâye anlatma; harabe yazıtları ve çözme
    │   ├── Exploration.js  (16. aşama) Keşfin saf hesapları: kafile seçimi, risk, sefer durumu, şema etkileri
    │   ├── PurseSystem.js  (21. aşama) Yevmiye, iş yerinden pay, çantadan yemek / şifalı ot / hatıra, pazar ve han alışverişi
    │   ├── PetitionSystem.js (21. aşama) Vatandaş dilekçeleri: oluşma, kabul, hemen karşılama, ret, süre dolması, ödül ve
    │   │                   cezalar; Petitions.js saf hesaplar (karşılandı mı, ilerleme, "Hemen Karşıla" durumu)
    │   ├── TrustSystem.js  (21. aşama) Yönetim Güveni, isyan, yağma baskınları (depodan çantaya birebir), acil erzak / altın
    │   │                   dağıtımı; Citizens.js saf yardımcılar (kese, çanta yuvaları, güven seviyesi, isyancı mı)
    │   ├── CrisisSystem.js (23. aşama) Yangın (çıkış, kova zinciri, söndürme, hasar), tamir, Gözcü Kulesi'nin güveni, haydut
    │   │                   baskınları (uyarı, A / B / C çözümü), hafif yaralanma ve iyileşme; kendi tohumlu üreteci (seed + 26);
    │   │                   Crisis.js saf hesaplar (yangın olasılığı ve kuyu etkisi, savunma, haraç, tamir maliyeti)
    │   ├── TaxSystem.js    (22. aşama) İç vergi kademesi ve 3 günlük tahsilat: keselerden hazineye, çantalardan kilere öşür
    │   ├── CrownSystem.js  (22. aşama) Krallık Vergisi ve Kraliyet Tahsildarı, Kraliyet Fermanları ve ödülleri, Aslanlı Heykel
    │   ├── DesertionSystem.js (22. aşama) Umutsuzluk, köyü terk eden sakin ve ailesi, çekirdek sakinler, referans temizliği;
    │   │                   Crown.js saf hesaplar (takvim, vergi tutarı, malla ödeme, ferman durumu, kötü şöhret)
    │   ├── GoldenAgeSystem.js (20. aşama) Çağ Kutlaması, 08:00 / 18:00 kule çanı, Tarihçe Kütüğü; GoldenAge.js saf yardımcılar
    │   │                   (Altın Çağ çarpanları, ustalık katkısı, dişli ihtiyacı, baş usta)
    │   ├── SocialSystem.js (19. aşama) Huyların dağıtımı ve etkileri, randevu bonusu, meydanda düğün kutlaması, boşalan
    │   │                   ev, evli çiftin akşam yemeği, müzisyenin dinleyicileri, kedi okşama, kasaba dedikodusu
    │   ├── LandscapeSystem.js (18. aşama) Çamur, süs fidanlarının büyümesi, çevre estetiği haritası ve kasaba puanı,
    │   │                   güzel sokak / bank / çiçek keyfi ve anıları, gece karanlığı
    │   ├── Landscape.js    (18. aşama) Peyzajın saf hesapları: estetik alanı, toplam puan, refah çarpanı, ışık altında mı
    │   ├── CraftsmanshipSystem.js (15. aşama) Meslek kıyafetlerini giydirir; ustaların eserlerini üretir, sergiler, satar
    │   ├── Masterworks.js  (15. aşama) Usta işi eserlerin saf hesapları: fiyat, satış / sergi durumu, refah katkısı
    │   ├── WeatherSystem.js Güneşli / bulutlu / yağmurlu arası yumuşak geçişler
    │   ├── RelationshipSystem.js Sohbet ve birlikte çalışmayla artan ilişki puanları, aşk ve düğün
    │   ├── ConflictSystem.js Zıt kişiliklilerin atışması, handa / şenlikte barışma
    │   ├── FamilySystem.js Evlilik sonrası aynı eve taşınma, Mutlu Yuva, çocukların doğması ve büyümesi
    │   ├── CraftingSystem.js Zanaat Atölyesi üretimi, ekipman deposu, kimin neyi kuşanacağı
    │   ├── Equipment.js    Ekipmanın etkileri için saf hesaplar (iş hızı, üşüme koruması, yol yorgunluğu)
    │   ├── JournalSystem.js Kasaba günlüğü: önemli olayları saatiyle kaydeder
    │   └── SaveSystem.js   Kaydet / yükle / yeni harita, sabah 06:00 otomatik kayıt, F5 ile devam
    ├── scenes/             Oyun ekranları
    │   ├── Scene.js        Temel sınıf
    │   ├── TownScene.js    Ana kasaba sahnesi (sistemleri kurar, seçim, kamera, çizim sırası)
    │   └── ToolController.js Seç / İnşa et / Topla / Yık araçları, hayalet önizleme, fırça
    ├── ui/                 HTML arayüz katmanı
    │   ├── UIManager.js    Yerleşim bölgeleri (üst çubuk, sağ sütun: çekmece + kart, dock, serbest katman)
    │   ├── ModalHost.js    (17. aşama) Ortalanmış pencereler: tek pencere, karartma, ✕ / Esc / dışına tıklama
    │   ├── dockButton.js   (17. aşama) Dock düğmesi (simge, etiket, kısayol) ve pencere başlığı (✕) yardımcıları
    │   ├── dom.js          Küçük DOM oluşturma yardımcısı
    │   └── components/     Hud (ince üst çubuk: kasaba, zaman ve hız, kaynaklar), ResidentList (açılıp kapanan
    │                       sakinler çekmecesi), SettingsPanel (Ayarlar: kayıt, ses, Tehlike Sıklığı, kontroller), CrisisModal ve
    │                       crisisCards (23. aşama: Haydut Baskını penceresi ve üç çözüm kartı), MapTooltip
    │                       (imleç altındaki karonun ipucu), CharacterPanel
    │                       (ihtiyaçlar, aile, ilişkiler, ekipman, meslekler), BuildingPanel (Yapı Bilgi
    │                       Paneli: evdeki aile, çalışanlar + İşten Çıkar, atölye üretimi, verim
    │                       çarpanları, yan ürün, değirmenin işleme satırları, Yükselt / Onar), BuildMenu (birleşik
    │                       alt dock: araçlar, pencere düğmeleri, ipuçları; seviye kilitli yapılar),
    │                       Toasts (bildirimler), TownJournal (Kasaba Günlüğü), TradePanel
    │                       (takas penceresi), MilestonePanel (hedefler + kasaba seviyesi kartı),
    │                       CelebrationModal (anıt, seviye ve altın çağ kutlaması), DilemmaModal (karar
    │                       penceresi; yalnızca GameState'teki aktif ikilemi okur), BuildingPanel'in araştırma,
    │                       ihracat ve harika bölümleri, (13. aşama) StatsPanel (Kasaba Arşivi grafikleri ve
    │                       Arşiv / Fotoğraf düğmeleri), luxuryCards (lüks mal, yadigâr ve altın fermanı kartları),
    │                       TitleMenu (başlangıç ekranı), ControlsHint
    ├── state/              Kaydedilebilir oyun durumu
    │   ├── GameState.js    Tek doğruluk kaynağı; toJSON / restore ile kayıt dönüşümü
    │   └── SaveManager.js  localStorage yuvaları ('main' ve 'session'), sürüm kontrolü
    └── utils/              math, random (tohumlu), noise (Perlin), pathfinding (A*), turkish (19. aşama: "Leyla'dan",
                            "Emre'nin" gibi ünlü uyumlu ad ekleri)
```

## Mimari kurallar

1. **Veri ≠ mantık ≠ görsel.** Bir binanın maliyeti `data/`, nasıl üretim yaptığı `systems/`, nasıl göründüğü `art/` içindedir. Birini değiştirmek diğerlerine dokunmayı gerektirmez.
2. **Sistemler birbirini çağırmaz, olay yayınlar.** `TimeSystem` → `time:newDay` yayınlar, `EconomySystem` dinler. Yeni sistem eklemek mevcutları değiştirmez.
3. **Durum tek yerde.** Kaydedilecek her şey `GameState` içindedir; UI ve çizim yalnızca okur.
4. **`core/` oyundan habersizdir.** Kasaba, karakter gibi kavramlar `core/` içine girmez.
5. **Sabitler `config.js`'te.** Kod içinde sihirli sayı yerine `CONFIG` kullanılır.

## Kasaba sakinleri nasıl yaşıyor?

Her karakterin dört ihtiyacı vardır (0–100): **Tokluk, Enerji, Sosyallik, Keyif**. Bunlar oyun
zamanıyla azalır; kişilik özellikleri azalma hızını, eşikleri, uyku saatlerini ve boş zaman
tercihlerini değiştirir (`data/characters.js`).

```
(görev yok) ──Brain.decide──▶ travel ──hedefe vardı──▶ perform ──bitti──▶ (görev yok)
                                 └──── acil ihtiyaç (boş zaman işiyse yarıda kesilir) ────┘
```

`Brain` öncelik sırası: çok açsa yemek → uyku saati/yorgunluk → acıkma → yalnızlık (toplanma
yerine gider, gerekirse birini davet eder) → kişiliğe göre ağırlıklı boş zaman (bank, nehir,
çiçekler, meydan, akşamları kamp ateşi, yürüyüş).

**Yol bulma:** `utils/pathfinding.js` 8 yönlü A* kullanır, köşe kesmez. Karo maliyetleri
`data/tiles.js`'teki `moveCost` alanından gelir (yol/köprü 0.4, çimen 1, kum 1.4); bu yüzden
sakinler doğal olarak patikaları ve köprüyü tercih eder.

**Rezervasyon:** Bir bank, ateş başı yeri ya da çalı önü bir karaktere ayrılır (`World.reserve`);
iki kişi aynı yere yönelmez.

## Ekonomi ve yönetim

**Kaynaklar:** Odun, Taş, Yiyecek. Başlangıçta 30 / 20 / 25; her biri için depo kapasitesi
100'dür, her Kiler +100 ekler. Değişiklikler HUD'da +5 / -10 olarak belirir. 10. aşamadan beri bunlara üretim
zincirlerinden gelen **işlenmiş mallar** eklenir: Yün, Demir Cevheri ve Ekmek (bkz. *Üretim zincirleri,
hayvancılık ve kasaba seviyesi*); onların da depo kapasitesi aynıdır.

**İş kuyruğu:** Oyuncu toplama emri verir ya da şantiye kurar; sakinler mesai saatinde
(08:00–17:00) acil ihtiyaçları yoksa kendileri iş seçer:

1. Şantiyeler (aynı anda en fazla 2 inşaatçı, ilerledikçe iskele yükselir)
2. Toplama emirleri (ağaç → odun + kütük, kaya → taş, böğürtlen → yiyecek)
3. Üretim binalarındaki boş yer (Oduncu Kulübesi, Sebze Bahçesi)

Yükseltme ve harabe onarımı da birer inşaat işidir (1. sırada): inşaatçılar yapının çevresinde çalışır.

Kiler varsa toplanan kaynak sırtta kilere taşınır; yoksa doğrudan stoğa girer. Çalışmak
enerji ve keyif tüketir. *Çalışkan* daha hızlı çalışır, daha az yorulur ve mola vermez;
*Uykucu* ve *Doğa Sever* ara sıra mola verir (durum metninde "Mola:" görünür).
17:00'den sonra herkes sosyal hayata döner.

**Yemek:** Handa pişmiş yemek varsa sakin oraya gider (bkz. *Kasaba Hanı*). Yoksa stokta yiyecek
olduğunda evinde ya da Kilerde hızlıca yer (öğün başı 3 yiyecek değeri; kilerde ekmek varsa önce ekmek yenir);
stok bitince böğürtlen çalılarına yönelir.

**Göç:** Her sabah 08:00'de şu üç koşul birlikte sağlanırsa haritanın kenarındaki yoldan yeni sakinler
gelir (sabah başına en fazla 2, kasabada en fazla 24 kişi; 8. aşamada 15'ten çıkarıldı; Kasaba seviyesinde sabah
başına 3, Gelişmiş Şehir'de en çok 30 kişi): **boş yatak**, **güvenli yiyecek stoğu**
(en az 15 ve sakin başı 3; ekmek 2,5 yiyecek sayılır) ve **refah en az %55**. Başlangıçta 3 kulübe ve 6 sakin vardır, her yatak
doludur. Boş yatak olduğu hâlde göçmen gelmezse nedeni bildirim ve günlükte yazar; HUD'daki
**6/8 Sakin** yazısının üzerine gelince koşulların durumu görünür.
9. aşamadan beri evli çiftlerin evlerindeki boş yataklar çocuklara ayrılır: göçmenler oraya yerleşmez
(bkz. *Aile, drama ve zanaat*).

**Doğa:** Kesilen ağacın yerinde kütük kalır; 24 saat sonra fidan, 36 saat sonra yeniden ağaç olur.

## Kayıt ve yükleme

Kayıt `localStorage`'a yazılır ve iki yuvası vardır:

| Yuva | Ne zaman yazılır? | Ne işe yarar? |
|---|---|---|
| `main` | **Kaydet** düğmesi ve her sabah **06:00** ("Otomatik kaydedildi" bildirimi) | **Yükle** düğmesi bunu açar; Ayarlar penceresinde kaydın tarihi görünür |
| `session` | Sayfa kapanırken / gizlenirken | **F5** ve sekmeyi yeniden açma oyunu tam kaldığı yerden sürdürür |

5. aşamadan itibaren kayda kasaba bonusları, şenlik, tüccarın durumu (haritadaki yeri, kalan stoğu,
bir sonraki ziyaret günü), handaki pişmiş yemek ve sakinlerin sıcak yemek bonusu da girer. 6. aşamada ısınma durumu (odun bitti mi, yakılmayı bekleyen odun), sakinlerin meslek
deneyimleri ve "İçi Isındı" bonusu eklendi; mevsim bilgi amaçlı yazılır, yüklenirken günden hesaplanır.
7. aşamada kasaba adı, tamamlanan hedefler (tarihleriyle) ve hedef sayaçları (tamamlanan yapı, pişen
yemek, takas, atlatılan kış, sürmekte olan kışın takibi) eklendi. 8. aşamada haritanın boyutu ve üretici
sürümü (`map: { width, height, generator }`), her yapının seviyesi (`level`), harabelerin durumu
(`condition`: yıkık / onarılmış) ve sürmekte olan yükseltme ya da onarım (`project`: tür, ilerleme, iş)
eklendi; yarım kalan bir yükseltme yüklenince inşaatçılar kaldığı yerden devam eder. 9. aşamada
sakinlerin sevgilisi / eşi ve evlilik tarihleri (`partnerId`, `married`, `partnerSince`, `marriedAt`), aile
bağları (`parentIds`), çocukların büyüme zamanı (`growsUpAt`), kuşanılan ekipman (`equipment`), eksiye inen
ilişki puanları, kasabanın ekipman deposu (`equipment`), atölyenin üretim seçimi ve yarım işi
(`craftMode`, `craft`) ve iş yerlerinden çıkarılan çalışanlar (`excludedWorkers`) eklendi. 10. aşamada
işlenmiş mallar (`resources.wool / iron / bread`), dilimlenmiş ekmekten artan yiyecek değeri (`pantry.credit`),
kasaba seviyesi (`town`: seviye, her seviyeye ulaşılan an, ortalama refah, belediyenin son erzak dengesi günü),
işlenmiş malların toplam üretimi (`stats.goods`), atölyedeki işin tarifi (`craft.recipe`: demir / yün ya da eski
usul) ve yeni yapılar (Koyun Ağılı, Yel Değirmeni ve Fırın, Demir Madeni, Belediye Konağı) eklendi. 11. aşamada
hayvanlar (`animals`: tür, ad, renk, yuva; `animalMeta`), sakinlerin hastalığı ve maruziyeti (`illness`, `exposure`),
Dinçlik bonusu (`buffs.vigor`), keşif seferindekiler (`away`), şifacı kulübesinin ot ve iksir stoğu (`herbs`,
`remedies`), yapıların fırtına hasarı (`damaged`), belediye fermanları (`civic`: depo kademesi, lonca, son ziyafet,
kadim tılsımlar) ve karar olayları (`dilemma`: açık pencere ve kalan süresi, yaklaşan fırtına, süren sefer, olay
geçmişi) eklendi. 12. aşamada araştırmalar (`research`: süren araştırma ve ilerlemesi, biten araştırmalar ve
tarihleri), çocukların okulu (`schooling`, `schoolDay`, `schoolToday`) ve okul mezunları (`educated`), Kasaba
Hazinesi (`resources.gold`), nehir ihracatı (`trade`: nehirdeki tekne ve yolculuğu, sıradaki teknenin zamanı,
toplam sefer, altın ve kaynak başına ihraç, son sefer), limanın fazlalık sınırı ve rıhtımdaki sandık
(`exportThreshold`, `crate`), harikanın tamamlanan aşaması (`wonderStage`) ve keşif seferlerinin Kadim Tılsım şans
sayacı (`civic.expeditionsSinceTalisman`) eklendi; aktif ikilemin seçenekleri (`dilemma.active.options`) de kayda
girer. 13. aşamada sergilenen yadigârlar, ipek ve mermer, altın fermanlarının son ilan günü ve harcanan altın
(`luxury`), Kasaba Arşivi'nin günlük özetleri (`history`, en çok 64 gün), düğün ve doğum sayaçları (`stats.weddings`,
`stats.births`), sakinin oyuncunun verdiği adı (`customName`) ve sabit iş yeri (`workplaceId`), handaki baharatlı
yemeğin kişisel bonusu (`buffs.spiced`) ve yeni süs yapıları (kiraz, çardak, kemer, çit) eklendi. 14. aşamada
sakinlerin anıları (`memories`), mevsim festivalinin durumu ve süslemeleri (`seasonFestival`; şenliğin teması
`events.festival.theme`), Toplanma Zili (`rally`), sisin yoğunluğu (`weather.mist`), öncelikli işler (`jobs[].urgent`),
Büyük İhracat Seferi (`trade.grandDay`, `grandPending`, `grandVoyages`, teknenin `grand`'ı) ve yeni sayaçlar
(`stats.seasonFestivals`, `recollections`, `rallies`) eklendi. 15. aşamada usta işi eserler (`masterworks`: eserler,
türleri, ustaları, durumları — depoda / sergide / satıldı — ve satış fiyatları, sayaçlar, ustanın son eser günü) ve atışma /
barışma sayaçları (`stats.quarrels`, `reconciliations`) eklendi; meslek kıyafetleri deneyimden türetildiği için kayda
girmez, yüklenince her sakin kademesine göre yeniden giyinir. 16. aşamada keşif durumu (`exploration`: egzotik ganimetler,
Kayıp Şehir Haritası, kadim yazıtlar ve çözülme durumları, çözülen yazıt, sefer sayısı, son seferlerin günlüğü, atölyenin demir
kırıntısı), süren seferin maceraları (`dilemma.expedition`: planlanan maceralar, sıradaki macera zamanı, macera günlüğü,
biriken ganimet, bulgular, yaralananlar, seferin adı), açık macera penceresi (`dilemma.active.kind = 'adventure'`, kafileyle
risk açıklamaları) ve maceracıların anlatacağı hikâye (`tale`) eklendi. 18. aşamada mahalle tabelasının adı (`label`), süs
fidanının dikiliş anı (`plantedAt`) ve peyzaj durumu (`landscape`: yıkım iadesinin küsuratı, estetik puanı ve refah yüzdesi,
sayaçlar) eklendi. 19. aşamada sakinlerin karakter huyu (`quirk`), son duyduğu haber (`lastNews`: metin, kimden, ne zaman),
eşiyle son akşam yemeği günü (`dinnerDay`) ve son randevusu (`lastDateAt`), sosyal durum (`social`: süren düğün kutlaması —
çift, davetliler, katılanlar, bitiş dakikası —, dolaşan haberler ve kimlerin duyduğu, günün barışma haberi) ve yeni sayaçlar
(`stats.dates`, `weddingParties`, `familyDinners`, `gossipHeard`, `serenades`, `petCuddles`, `booksRead`, `homesFreed`)
eklendi; evli çiftin ortak evi zaten `homeId` ile kayda girer. 20. aşamada kulenin aşama günleri, Altın Çağ (`goldenAge`: başladığı an, çan sayısı, süren Çağ Kutlaması, antik kitaplar),
Tarihçe Kütüğü (`chronicle`: kurucular, ilk evlenen çift, ilk usta eseri, kuleye verilen emek ve baş usta, kulenin aşamaları),
Kadim Dişli stoğu (`resources.gears`), Mermer Çeşme / Altın Çağ Feneri ve `stats.ageCelebrations` eklendi. 21. aşamada
sakinlerin kişisel kesesi ve çantası (`coins`, `inventory`: `[{ kind, qty, name? }]`), Yönetim Güveni ve isyan (`trust`: değer,
kritik eşiğin altında kalmaya başladığı an, süren isyan — isyancılar, yağma baskınları, yağmalananlar —, son dağıtımlar, en düşük
değer), vatandaş dilekçeleri (`petitions`: açık dilekçeler ve durumları, sıradaki dilekçenin zamanı, sonuçlananların günlüğü,
sayaçlar) ve yeni sayaçlar (`stats.wagesPaid`, `purchases`, `bagMeals`, `revolts`, `raids`, `lootedGoods`, `lootedGold`, `reliefs`)
eklendi. 22. aşamada iç vergi (`tax`: kademe, sıradaki tahsilat, toplamlar, son tahsilatlar), Krallık (`crown`: itibar, sıradaki
Krallık Vergisi ve yoldaki tahsildar, ödeme / ceza sayaçları, süren Kraliyet Fermanı ve ödülü, fermanların günlüğü, Kraliyet
Beratı), terk ediş (`exodus`: umutsuzluğun başladığı an, süren terk ediş, ayrılanlar ve götürdükleri), sakinin `emigrating`
alanı, Kraliyet Aslanlı Heykeli ve `stats.emigrants` eklendi. 23. aşamada krizler (`crisis`: tehlike sıklığı, sıradaki haydut
izi, bekleyen baskın, sayaçlar, son olaylar), binalara `isBurning` / `fireProgress` / `fireWater` / `isDamaged` (`damaged` ile aynı bayrak) /
`damageKind` / `damagedAt`, sakinlere `isInjured` / `injuryTimer` ve `stats.fires`, `firesPutOut`, `raidsRepelled`, `repairs` eklendi. 24. aşamada
(24.1) bahçelerin ekim tercihi (`crop`: `grain` / `flax` / `hops`), Keten ve Şerbetçiotu stokları (`resources.flax`, `resources.hops`; toplam hasat
`stats.goods.flax / hops`) ve silo durumu (`granary`: silosuz kasabada bozulan mahsul sayaçları, bozulma küsuratı, ekim değişikliği sayısı) eklendi;
Ürün Silosu'nun kapasitesi kayda girmez, yüklenince yapılardan yeniden hesaplanır. 24.2'de Kumaş ve Fıçı Şerbeti stokları
(`resources.cloth`, `resources.sherbet`; toplam üretim `stats.goods.cloth / sherbet`), Dokuma Tezgâhı ve Şerbethane, handaki fıçılar
(`buildings[].sherbet`), çantada Dayanıklı Giysi ve Şerbet Testisi (`inventory`: `garment`, `sherbetJug`), "Keyifli Damak" morali
(`buffs.merryPalate`) ve yeni sayaçlar (`stats.sherbetServed`, `sherbetJugs`, `jugsDrunk`, `garments`) eklendi. 24.3'te dış ticaret
(`tradePost`: demirli gemi / kervan — varış ve ayrılış anı, gemi mi kervan mı, üç ihracat sözleşmesi ve tamamlanma durumları, ödenen
fiyat, ithalat stoğu, bu ziyarette satılanlar —, sıradaki varış, ziyaret sayısı, pazar çarpanları, peş peşe satış serisi, sayaçlar,
son ziyaretlerin günlüğü) ve Ticaret İskelesi eklendi. Kayıt sürümü 23'tür; 24.2'nin (sürüm 22) kayıtları da açılır (dış ticaret boş;
iskele kurulunca takvim kurulur); 24.1'in (sürüm 21) kayıtları da açılır (Kumaş / Fıçı Şerbeti 0, hanlarda fıçı yok); 4.–23. aşamanın (sürüm 2–20) kayıtları da
açılır (bütün bahçeler Buğday / Sebze ekili başlar, Keten ve Şerbetçiotu 0, silo sayaçları boştur; geçersiz bir mahsul değeri de Buğday'a döner);
4.–22. aşamanın (sürüm 2–19) kayıtları da açılır (hiçbir yapı yanmaz / hasarlı değildir, kimse yaralı değildir, Dengeli,
ilk yükleme gününde kriz çıkmaz); 4.–21. aşamanın (sürüm 2–18) kayıtları da
açılır (Standart Vergi, Krallık İtibarı 50; vergi ve Krallık Vergisi takvimi yüklenince kurulur; ferman, berat ve terk ediş yoktur)
(her yetişkine 12, her çocuğa 3 altın başlangıç harçlığı verilir, çantalar boş, Yönetim Güveni %75 başlar, dilekçe ve isyan yoktur) (Tarihçe sakinlerden çıkarılır, tamamlanmış kulesi olan kasaba Altın
Çağ'a kutlamasız girer, dişli ve kitap 0 başlar) (huyu olmayan sakinlere ilk açılışta huy dağıtılır, dedikodu boş başlar, evli çiftler kendi evlerinde kalır) (peyzaj durumu boş başlar) (usta işi eser vitrini ve keşif ganimetleri boş başlar; eski biçimde yarım kalmış bir sefer maceralar
açmadan sürer ve döner) (anısı olmayan sakinin anı defteri ilk açılışta "Kasabada yaşamaya başladı" ile açılır): eksik alanlar varsayılanla dolar (herkes bekâr, yetişkin, sağlıklı
ve ekipmansız başlar; yün, demir, ekmek ve altın 0 olur; araştırma, ihracat ve yadigâr boş başlar; arşiv ilk açılışta
kurulur, düğün ve doğum sayaçları evli çiftlerden ve ebeveynli sakinlerden tahmin edilir; yaban hayatı ilk açılışta
yerleşir), adı olmayan kasabaya tohumdan bir ad önerilir. Açık bir karar penceresiyle kaydedilen oyun
yüklenince pencere yeniden açılır ve oyun durur; sefere yola çıkmışken kaydedilen sakin yüklenince seferde sayılır.
Seviyesi yazılmamış eski bir kasaba yüklenince seviyesi **sessizce** belirlenir: hak ettiği seviyeden başlar,
günlüğe "Kasaba seviyesi belirlendi" yazılır, art arda kutlama penceresi açılmaz. Harita boyutu yazılmamış eski kayıtlar **48x48, biyomsuz** haritalarıyla açılır
(`config.js` → `LEGACY_MAP_SIZE`); üretici o yolda rastgele sayı sırası değişmeden eski haritayı birebir
yeniden kurar, yapılar da eskisi gibi Seviye 1'dir ve yükseltilebilir.
Kaldırılan yapı türleri kayıt okunurken yenisine çevrilir (`data/buildings.js` → `LEGACY_BUILDING_TYPES`,
`state/SaveManager.js` → `migrate`). Önceki aşamaların **Sokak Lambası** artık inşa menüsünde yoktur; eski
kayıtlarda kurulmuş ya da yarım kalmış lambalar yüklenince Sokak Feneri olarak çalışır (19:00–06:00 yanar,
Işıltılı Sokaklar hedefine sayılır).
Başlangıç ekranının arkasındaki tanıtım kasabası hiçbir şey kaydetmez.

Kayda şunlar girer: harita tohumu, boyutu ve **haritadaki değişiklikler** (kesilen ağaçlar, kütükler, döşenen
yollar ve köprüler; harita her seferinde tohumdan üretilir, yalnızca farklı karolar saklanır),
yapılar ve şantiyeler (inşaat ilerlemesi, iskele yönü, çalıdaki meyveler), tüm sakinler (konum, ihtiyaçlar,
kişilik, ev, sırtındaki yük, evde uyuyor mu), kaynak stokları, iş emirleri, yeniden büyüyen ağaçlar, oyun
zamanı ve hızı, hava, arkadaşlık puanları ve günlük. Sakinlerin o anki görevi kaydedilmez; yüklenince
yapay zekâ ihtiyaçlarına bakıp yeniden karar verir (uyuyanlar uyumaya devam eder).

**Yeni Harita** düğmesi önce onay ister (6 saniye içinde onaylanmazsa vazgeçilir), rastgele bir tohumla
sıfırdan başlar ve `session` yuvasını temizler; `main` kaydın **Yükle** ile açılabilir kalır.
Bozuk ya da başka sürümden bir kayıt oyunu açmaz: atlanır ve yeni oyun başlar (`config.js` →
`SAVE_VERSION`).

## Hava durumu ve atmosfer

Hava günde bir iki kez (9–17 oyun saatinde bir) **Güneşli → Bulutlu → Yağmurlu** arasında değişir; geçişler
45 oyun dakikasında yumuşakça tamamlanır. Seçim tohuma ve değişim sayısına bağlıdır, yani kayıttan sonra
aynı hava dizisi sürer. Hava HUD'da saatin yanında küçük bir simgeyle görünür (üzerine gelince adı).

| Hava | Görünüm | Etki |
|---|---|---|
| Güneşli | Açık gökyüzü | — |
| Bulutlu | Gri örtü, yere düşen bulut gölgeleri | — |
| Yağmurlu | Çapraz piksel damlalar, suda ve zeminde sıçrama halkaları, kararan gökyüzü | Sebze Bahçesi **+%25** verim, kütük ve fidanlar **2 kat** hızlı büyür, dışarıdaki sakinlerin keyfi **1,7 kat** hızlı düşer (içeridekiler ıslanmaz; **Doğa Sever**'ler yağmuru sever ve keyif kazanır) |
| Açık gece (20:00–04:00) | HUD'da "Ateşböcekleri" simgesi; orman ve nehir kıyısında sarı-yeşil yanıp sönen sürüler | — |
| (14. aşama) Sabah Sisi — nadir | Bütün manzarayı yumuşatan hafif beyaz örtü, yavaşça süzülen sis şeritleri, nehrin üstünde dalgalanan pus | İlkbahar (%40) ve sonbahar (%18) sabahları 05:00'te, hava açık ya da bulutluysa çöker, 2,5–4,5 saat sürer. Dinlendirir: dışarıdakilerin keyfi %20 yavaş düşer |
| (14. aşama) Gök Gürültülü Fırtına — nadir | Bardaktan boşanırcasına (2,2 kat yoğun) yağmur, ekranda anlık çift şimşek parıltısı, ardından uzaktan gelen yumuşak gök gürültüsü | Yaz öğleden sonraları 14:00'te (%30) başlar, 1,5–2,5 saat sürer; yağmurun etkileri geçerlidir |

Nadir olayların zarı `data/weather.js` → `WEATHER_SPECIALS`'tadır.
Kulübelerin bacasından, içinde yaşayan olan her evde duman tüter (içeride biri varsa daha yoğun).
Etkilerin sayıları `data/weather.js` → `RAIN_EFFECTS`, bahçenin bonusu `data/buildings.js` →
`production.rainBonus`'tadır.

## Arkadaşlıklar ve Kasaba Günlüğü

Her sakin çiftinin −50 ile 100 arası bir **ilişki puanı** vardır. Aynı toplanma yerinde sohbet eden ya da
aynı şantiyede / üretim binasında birlikte çalışan çiftlerin puanı oyun dakikası başına artar
(`data/relationships.js`); aynı evde yaşayanlar *Tanıdık*, ebeveyn ile çocuk *Dost* başlar. Zıt kişilikli
sakinler atışınca puan düşer ve eksiye inebilir (bkz. *Aile, drama ve zanaat*).

| Puan | Seviye | Sohbetin etkisi |
|---|---|---|
| −50 … −26 | Rakip | sosyallik ×0,5, dakikada −0,15 keyif |
| −25 … −11 | Hoşlanmıyor | sosyallik ×0,8, dakikada −0,05 keyif |
| −10 … 9 | Yabancı | — |
| 10+ | Tanıdık | sosyallik ×1,1 |
| 40+ | Dost | sosyallik ×1,45, dakikada +0,12 keyif |
| 75+ | En İyi Arkadaş | sosyallik ×1,9, dakikada +0,25 keyif |

Sakin seçilince karakter panelinde **İlişkiler** bölümü en üstte eşi ya da sevgilisini (kalp / yüzük
simgesiyle, pembe çubukla), sonra en yakın en çok 3 kişiyi ve varsa anlaşamadığı birini (kırmızı çubuk:
puanın eksi tarafı) gösterir. Satıra tıklayınca o sakin seçilir. Sohbet ederken ve sohbete çağrılırken dost
olunan kişiler tercih edilir.

**Kasaba Günlüğü** (`J` ya da dock'taki **Günlük** düğmesi) olayları saatiyle listeler: "Gün 2, 08:00 – Leyla kasabaya
katıldı", yapı şantiyesi ve tamamlanması, yıkım, dost / en iyi arkadaş olmalar, hava değişimi, biten stok;
9. aşamadan beri aşk, düğün, taşınma, doğum, büyüme, atışma (çift başına günde bir kez), barışma, ekipman
kuşanma ve işten çıkarma. Kapalıyken yeni olay sayısı düğmede görünür.

## Üretim ve süs yapıları (4. aşama)

| Yapı | Boyut | Maliyet | Kural / etki |
|---|---|---|---|
| Taş Ocağı | 3x3 | Odun 35, Taş 15 | **Kayalık bir alanın yakınına** kurulur (7 karo içinde en az 2 kaya / çakıl). 2 çalışan, kişi başı saatte +3 Taş; açık kayalar bitse de taş akar. Çalışırken vinç sallanır, toz ve taş kıymıkları uçar. |
| Balıkçı İskelesi | 2x2 | Odun 30, Taş 5 | Yalnızca **nehir kıyısına**: bir sütun kum, yanındaki sütun su olmalı (su yönü iskelenin yönünü belirler). 1 çalışan, saatte +4 Yiyecek; çalışan iskelenin ucundan olta atar, ip ve şamandıra çizilir, ara sıra balık sıçrar; feneri geceleri yanar. |
| Çiçek Tarhı | 2x2 | Odun 8, Taş 2 | Yanından geçenlerin ve etrafında dinlenenlerin keyfi artar (yarıçap 38 piksel, dakikada +0,07). Çiçekler sallanır, gündüz kelebekler uçar; sakinler çiçek koklamaya buraya da gelir. Her tarhın renk düzeni farklıdır. |

Yeni yapı eklemek için `data/buildings.js` + `art/sprites/` yeter; `requires`, `placement: 'shore'`,
`workPoint` gibi alanlar dosyanın başındaki açıklamadadır. Çizimleri kontrol etmek için
`/tools/art-preview.html` sayfasını aç.

## Kasaba Hanı, Pazar Yeri ve olaylar (5. aşama)

| Yapı | Boyut | Maliyet | Ne işe yarar? |
|---|---|---|---|
| Kasaba Hanı | 3x3 | Odun 45, Taş 25 | 1 aşçı içeride kilerdeki ham yiyecekten **sıcak yemek** pişirir (saatte 6 porsiyon, porsiyon başı 1 yiyecek, en çok 20). Burada yiyenler çok daha hızlı doyar, keyiflenir ve 8 saat boyunca yavaş acıkır (açlık 0,6 kat). Akşamları (17:00–01:00) kasabanın en sevilen buluşma yeridir: sakinler önünde toplanır, sohbet arkadaşlığı 1,6 kat hızlı geliştirir. Geceleri pencerelerinden turuncu ışık sızar, tabelası sallanır, bacası tüter. |
| Pazar Yeri | 3x2 | Odun 40, Taş 15 | Önce bir **Kiler** tamamlanmış olmalı. Tamamlandıktan sonraki gün, sonra da 2–3 günde bir 09:00'da sırt çantalı **gezgin tüccar** gelir, tezgâhın önünde 18:00'e kadar durur. Gelince tentenin üstünde flama dalgalanır. |

**Takas** (tüccara ya da Pazar Yeri'ne tıkla): 12 Odun → 8 Yiyecek, 10 Taş → 8 Yiyecek, 10 Yiyecek → 10 Odun,
10 Yiyecek → 8 Taş (her biri ziyaret başına 3 kez) ve ziyaret başına bir kez iki özel paket:

| Paket | Bedel | Etki (1 gün) |
|---|---|---|
| Alet Paketi | 15 Odun + 15 Taş | Herkes %25 daha hızlı çalışır |
| Kasaba İkramı | 25 Yiyecek | Herkesin keyfi hemen +25, keyif yarı hızda düşer |

**Akşam şenliği:** Meydan havuzu, kamp ateşi ya da han varsa, kasabanın ortalama keyfi en az %60 ise,
yağmur yağmıyorsa ve son şenlikten 3 gün geçtiyse saat 19:00'da şenlik başlar. Boş zamanı olanlar
hemen meydana koşar ve 22:00'ye kadar (uyku saati gelse de) dans eder. Meydanın çevresine renkli
fenerler gerilir, havada notalar süzülür, hafif bir ezgi çalar. Bitince herkesin keyfi +30 artar ve
20 saatlik **Şenlik Coşkusu** başlar (iş hızı 1,15 kat, keyif 0,7 kat hızda düşer).

Etkin bonuslar HUD'da kaynakların üstünde kalan süreleriyle görünür.

**Refah:** Bir sakinin mutluluğu ihtiyaçlarının ağırlıklı ortalamasıdır (Keyif %40, Sosyallik / Tokluk /
Enerji %20). HUD'daki **Refah** çubuğu kasaba ortalamasıdır: %70 üstü yeşil, %50–70 sarı, altı kırmızı.

## Sesler

Hiçbir ses dosyası yoktur: her şey Web Audio API ile sentezlenir (`core/SoundEngine.js`). Hangi olayda
ne çalacağı `systems/AudioSystem.js`'tedir:

| Ne zaman | Ses |
|---|---|
| Arayüz düğmesi | hafif tahta tıkırtısı (filtreli gürültü + kısa nota) |
| Şantiye kurma / yıkım | boğuk gümbürtü / alçalan çökme sesi |
| İnşaat tamamlandı, şenlik başladı | neşeli kısa arpej |
| Günlüğe kayıt | iki notalı yumuşak çan |
| Sabah 06:00 | üç notalı sıcak sabah melodisi |
| Tüccar geldi / takas | çan / sikke |
| Yağmur | pembe gürültü hışırtısı (yağmur şiddetiyle) |
| Gündüz, yağmur yokken | ara sıra kuş cıvıltısı |
| Ateşböceği geceleri | cırcır böceği |
| Kamera nehre yakınken | dalgalanan kahverengi gürültü su şırıltısı |
| Şenlik boyunca | pentatonik ezgi |
| (12. aşama) Ticaret teknesi rıhtıma yanaştı / yükünü alıp gitti | çan / sikke |
| (12. aşama) Araştırma tamamlandı, harikanın bir aşaması bitti | ustalık ezgisi |
| (12. aşama) Okulu bitiren çocuk Kalfa oldu | hedef ezgisi |
| (12. aşama) Harika tamamlandı | büyük kutlama ezgisi |
| (12. aşama) Altın çağda saat başı (07:00–22:00) | saat kulesi: dört notalı melodi ve en çok üç derin çan vuruşu |
| (13. aşama) Yadigâr sergilendi | büyük kutlama ezgisi |
| (13. aşama) Lüks mal alındı / altın fermanı ilan edildi | sikke / neşeli arpej |
| (14. aşama) Mevsim festivali sürerken | temaya özgü ezgi: ilkbaharda sekerek, yazın panayır havası, sonbaharda halk havası, kışın çanlı ve yavaş |
| (14. aşama) Festival duyurusu / bitişi | çan / büyük kutlama ezgisi |
| (14. aşama) Kediye / köpeğe tıklayınca | kısa bir miyav / iki havlama |
| (14. aşama) Toplanma Zili | ağır kasaba çanı, üç vuruş |
| (14. aşama) Yaz fırtınasında şimşek | gecikmeli, uzaktan gelen yumuşak gök gürültüsü |
| (14. aşama) Sakin bir anısını hatırlayınca | yumuşak çan |

Tarayıcılar sesi ancak bir kullanıcı etkileşiminden sonra başlatır: motor ilk tıklamada ya da tuşta
açılır. Sessiz tercihi `localStorage`'da (`config.js` → `AUDIO_MUTE_KEY`) saklanır.

**Taş ocağı:** Çalışanlar ocağın önünden içeri iner ve kaya yüzünün önündeki iki çalışma noktasında
(`workPoints`) duvara dönük kazma sallar; toz ve kıymıklar her kazma darbesinde aletin ucundan kalkar.

## Mevsimler, kış ve ustalık (6. aşama)

Yıl dört mevsimdir, her biri 4 gün sürer (`config.js` → `DAYS_PER_SEASON`; yıl = 16 gün). Oyun 1. gün
ilkbaharda başlar. Mevsim oyun gününden hesaplanır, bu yüzden kayıtla birlikte doğru mevsim geri gelir.
HUD'da gün ve saatin altında mevsim simgesi ve "Sonbahar · Gün 2/4" görünür. Mevsim değişince
günlüğe kayıt düşer ve yumuşak bir akor çalar.

| Mevsim | Görünüm | Etki |
|---|---|---|
| İlkbahar | Canlı çimen, çimende ve meşelerde pembe-beyaz çiçekler, bahçede filizler | Ağaçlar 1,3 kat hızlı büyür |
| Yaz | Doygun yeşiller, sıcak gün ışığı, geceleri bol ateşböceği | Daha az yağmur; sakinler nehir kenarını sever |
| Sonbahar | Kehribar çimen; meşeler turuncu, kızıl, altın; rüzgârda süzülen yapraklar; bahçede kabaklar | **Hasat:** bahçe ve böğürtlen +%35; tüccar Kışlık Erzak ve Odun Yükü getirir; daha çok yağmur |
| Kış | Karlı çimen, karlı ağaç tepeleri, karla örtülü çatılar, lapa lapa kar, rüzgâr sesi | Bahçe ve çalılar **donar** (üretim ve meyve yok, kelebek yok); ağaçlar büyümez; **ısınma** başlar |

Balıkçı İskelesi ve Kasaba Hanı kışın da çalışır: kışın kasabanın yiyecek kaynağı bunlardır.

**Isınma (kış):** İçinde sakin yaşayan her kulübe günde 4, yanan kamp ateşi 3, açık han 4 odun yakar
(yalnızca yandıkları saatlerde). Toplam gider HUD'da "Isınma −X odun/gün" olarak, Odun kutusunun
ipucunda da görünür. Kışın oduncu kulübesi karda %45, balıkçı iskelesi buzlu suda %75 verimle çalışır.
Dışarıda dolaşan sakin üşür (enerji 1,45, keyif 1,75 kat hızlı düşer) ve kışın kısa günleri dışarıdaki
herkesin keyfini 1,2 kat hızlı kaçırır. Kendi evinde, handa ya da yanan kamp ateşinin yanında 2 saatlik
**İçi Isındı** bonusu alır. Karakter panelinde "Üşüyor" / "İçi ısındı" etiketi görünür.

**Odun biterse ocaklar söner** ve kasaba donar: bacalardan duman tütmez, kamp ateşi söner, evde ya da
dışarıda herkes üşür. HUD'da kırmızı uyarı yanar, günlüğe kayıt düşer. Donan kasabada:

| İhtiyaç | Etki |
|---|---|
| Keyif | 8 kat hızlı düşer |
| Enerji | 2,6 kat hızlı düşer |
| Tokluk | 1,5 kat hızlı düşer (titreyen beden çabuk acıkır) |
| Sosyallik | 1,6 kat hızlı düşer |
| Uyku ve eğlence | Enerji ve keyfi yalnızca %35 verimle yeniler |

Sönen ocaklar tek tük gelen odunla yanmaz: yeniden yakmak için stokta en az **4 odun** birikmelidir
(`HEATING.relightWood`). Bütün bu sayılar `data/seasons.js` → `HEATING` içindedir.

*Denge (v1.0):* 10 sakinli, tek oduncu kulübeli bir kasaba kışın günde ~27 odun yakar ama karda yalnızca
~17 üretir. Simülasyonda (6 farklı harita) sonbaharı stoksuz bitiren kasabanın (15 odun, 30 yiyecek)
odunu kışın 1.–2. gününde biter. Ocaklar sönük kaldıkça refah genellikle **5–9 oyun saatinde** %50'nin
altına iner; kışın en düşük refahı %24–55 arasında kalır ve Kış Sınavı her seferinde kaybedilir. Kışa ~70 odun ve ~90 yiyecekle giren
kasaba en düşük %72–78'de kalır ve sınavı rahat geçer. Ağacı az haritalarda 70 odun bile yetmeyebilir;
sonbaharda oduncu kulübesini çalıştırmak ve tüccardan Odun Yükü almak bu yüzden önemlidir.

**Mesleki ustalık:** Sakinler çalıştıkları işte deneyim (çalışılan oyun dakikası) kazanır:

| Meslek | Geliştiren işler |
|---|---|
| Odunculuk | ağaç kesmek, oduncu kulübesi |
| Taşçılık | kaya kırmak, taş ocağı |
| Çiftçilik | sebze bahçesi, böğürtlen toplama |
| Balıkçılık | balıkçı iskelesi |
| Aşçılık | handa aşçılık |
| İnşaat | şantiyeler |

Kademeler: **Çırak** → **Kalfa** (480 dk, iş hızı +%20) → **Usta** (1500 dk, +%40). Usta olunca günlüğe
"Demir artık Usta bir Balıkçı oldu!" gibi bir kayıt düşer ve kutlama ezgisi çalar. İş seçerken deneyimli
olunan iş daha yakınmış gibi tercih edilir. Bir üretim binasındaki son boş yer için de şu an
çalışmayan daha deneyimli biri (en az Kalfa) varsa acemi bekler, işi usta alır. Karakter panelindeki
**Meslekler** bölümü en çok gelişmiş üç mesleği yıldızlarla (kademe) ve bir sonraki kademeye ilerleme
çubuğuyla gösterir.

**Denge:** Han ve şenlikte arkadaşlık kazancı biraz düşürüldü (han 1,35, şenlik 1,15 kat; sohbet
dakikada 0,11): "En İyi Arkadaş" olmak artık daha uzun sürüyor.

## Başlangıç ekranı, hedefler ve prestij (7. aşama)

**Başlangıç ekranı:** Oturum kaydı yoksa oyun doğrudan başlamaz. Arkada (varsa son kayıttaki, yoksa
rastgele) kasaba yavaşça yaşar ve kamera meydanın çevresinde süzülür. Ortadaki menü `ui/components/TitleMenu.js`'tedir:
"Kaldığın Yerden Devam Et" son kaydı açar (kasaba adı, gün ve nüfusla). "Yeni Kasaba Kur" bir ad ister:
"Yeşilvadi", "Çamlıköy", "Gümüşdere" gibi rastgele bir Türkçe ad önerilir, "Başka Ad" yenisini getirir.
İsteğe bağlı tohum da girilebilir. Kasaba adı HUD'un en üstünde yazar ve üzerine tıklanarak değiştirilebilir.

**Yeni süsleme ve prestij yapıları:**

| Öğe | Boyut | Maliyet | Etki |
|---|---|---|---|
| Taş Yol | 1 karo | Taş 1 | Arnavut kaldırımı. Üzerinde toprak yoldan %15 daha hızlı yürünür, yol bulma da onu tercih eder. Çimene ya da toprak yolun üstüne döşenir; kaldırılınca toprak yola döner. |
| Sokak Feneri | 1x1 | Odun 1, Taş 1 | Kıvrık direkli fener. 19:00–06:00 arası sıcak sarı geniş bir ışık halkası yayar, yanından geçenlerin keyfini korur. |
| Kasaba Anıtı | 2x2 | Odun 40, Taş 40 | Mermer kaide üstünde elinde yıldız tutan bronz heykel. Kasabada yalnızca bir tane olur. Tamamlanınca refaha kalıcı **+6**, keyif %12 daha yavaş düşer; sakinler önünde gururla durup seyreder, gece yıldızı parlar, büyük bir kutlama ezgisi çalar ve "Tebrikler, Kasabanız Efsaneleşti!" penceresi açılır (oyun sürer). |

**Kasaba Hedefleri** (`G`): sırayla 9 hedef (dokuzuncusu 12. aşamada eklendi). Her biri ilerleme çubuğuyla görünür; tamamlanınca bildirim, ses
ve günlük kaydı gelir.

| Hedef | Koşul |
|---|---|
| İlk Yuva | İlk kulübeyi ya da herhangi bir yapıyı tamamla |
| Sıcak Sofra | Kasaba Hanı kur ve ilk sıcak yemeği pişir |
| Ticaret Yolları | Pazar Yeri kur ve tüccarla ilk takası yap |
| Büyüyen Aile | Nüfus 10 |
| Zanaatkârlar | 3 farklı sakin bir meslekte Usta |
| Kış Sınavı | Bir kışı nüfus eksilmeden ve refah **%65**'in altına düşmeden atlat. Kış boyunca panelde bu kışın en düşük refahı görünür; başaramazsan gelecek kış yeniden denenir |
| Işıltılı Sokaklar | En az 6 Sokak Feneri ve 15 karo Taş Yol |
| Kasabanın Tacı | Kasaba Anıtı'nı inşa et |
| Vadinin İncisi | Büyük Vadi Saat Kulesi Harikası'nı üç aşamasıyla tamamla (12. aşama; panelde tamamlanan ve sıradaki aşama yazar) |

## Büyük harita, biyomlar, harabeler ve Seviye 2 (8. aşama)

**80x80 harita:** Yeni kasabalar 48x48 yerine 80x80 karoluk bir haritada kurulur (`config.js` →
`MAP_WIDTH`, `MAP_HEIGHT`). Kamera sınırları harita boyutundan hesaplanır. Zemin ve nesneler yalnızca
görünen karolar için çizilir (frustum culling), bu yüzden büyük harita çizimi yavaşlatmaz. Harita üretimi
simülasyonda 20–50 ms sürer. Eski kayıtlar kendi 48x48 haritalarıyla açılır (bkz. *Kayıt ve yükleme*).

**Mikro-biyomlar** (`data/tiles.js`, `world/WorldGenerator.js` → `paintBiomes`):

| Biyom | Nerede? | Görünüm | Etkisi |
|---|---|---|---|
| Bereketli Toprak | Nehir kıyısında, kumun ötesinde 6 karo kadar içeri ve iç vadilerde | Koyu, nemli çimen; yonca kümeleri, çiçekli varyasyonda kır çiçekleri | Üstüne kurulan **Sebze Bahçesi +%25** verimle çalışır |
| Kayalık Tepe | Haritanın kuzey şeridi ve köşeleri | Boz, çakıllı toprak; yoğun kaya kümeleri, seyrek çamlar | **Taş Ocağı +%20**; üzerinde biraz yavaş yürünür |
| Derin Orman | Haritanın dış çeperi | Gölgeli yosun, yaprak ve iğne döküntüsü, eğrelti, mantar; çok sık çam ve meşe | Bol odun; ormanın açıklıklarına 12 ek böğürtlen çalısı serpilir |

- **Kasabanın çevresi:** Biyom sınırları gürültüyle kıvrılır. Meydanın 15 karo çevresinde tepe ve derin orman olmaz.
- **Geçişler:** Kenarlar, çimenle yolun arasındaki geçiş gibi komşu karoya taşar. Kışın kar iki toprak zeminin arasındaki sınırı örter.
- **Bonusun görünmesi:** Yapı kısmen biyomdaysa bonus karoların oranıyla bölünür. İnşa ederken imleç bonuslu bir yerdeyse ipucu satırında "Bereketli Toprak: verim +%25" yazar. HUD'daki karo bilgisinde de biyomun etkisi görünür.
- **Toprak yol kaldırılınca:** Biyomun üstüne döşenen yol kaldırılınca harita üretildiğindeki biyom zemini geri gelir.

**Kadim harabeler** (`data/buildings.js` → `ruin`, `RUIN_TYPES`):
- **Yerleri:** Her haritada kasabadan en az 20 karo uzakta ve yollardan kuytu üç harabe vardır. Tepede Gözetleme Kulesi, ormanda Erzak Kampı ve Kadim Çeşme durur.
- **Ulaşım:** Çevreleri temizlenir. Kasabaya bağlı değillerse ormanın içinden onlara giden bir patika açılır.
- **Onarım:** Harabeler yosunlu, kırık taşlı görünür. Tıklanınca Yapı Bilgi Paneli'nde **Onarımı Başlat** düğmesi çıkar; maliyet peşin ödenir, inşaatçılar gelip çekiç sallar.
- **Yıkım:** Harabeler yıkılamaz.

| Harabe | Onarım | Onarılınca |
|---|---|---|
| Yıkık Gözetleme Kulesi | Odun 25, Taş 30 (240 iş) | Mazgallı taş kule. Kasaba refahına **kalıcı +4** verir. Tepesindeki fener 18:00–06:00 geniş bir ışık halkası yayar, yanından geçenlerin keyfini korur. |
| Terk Edilmiş Erzak Kampı | Odun 15, Taş 10 (150 iş) | İçinden bir kez **35 odun, 25 taş, 30 yiyecek** hazinesi çıkar; depo doluysa sığmayan kısım kaybolur ve bildirim söyler. Sonra küçük bir depo (+40 kapasite) ve sakinlerin soluklandığı bir mola yeri olur. |
| Kurumuş Kadim Çeşme | Odun 15, Taş 35 (220 iş) | Şırıl şırıl akan berrak çeşme (dört kare animasyon, gece mavi parıltı). Yanından geçenin keyfi ve enerjisi dolar. Boş zamanında oraya gidip tazelenen sakinin keyfi ve enerjisi çok hızlı yükselir. |

**Yapı Bilgi Paneli** (`ui/components/BuildingPanel.js`): Haritada bir yapıya ya da harabeye tıklayınca sağ
sütunda açılır.
- **Üst kısım:** Yapının seviyesine ya da yıkık hâline göre küçük resmi, adı, rozeti (Seviye 1 / Seviye 2 · Gelişmiş / Kadim Harabe) ve açıklaması.
- **Kişiler:** Orada çalışanların, yaşayanların ya da inşaatçıların adları çip olarak görünür. Bir ada tıklayınca o sakin seçilir ve kamera ona kayar.
- **Üretim:** Kişi başı saatlik üretim ve toplam verim. Verimi oluşturan çarpanlar ayrı satırlarda yazar: mevsim, çevredeki ağaçlar, yağmur, biyom ve Seviye 2. Bunları StructureSystem her karede `building.factors` alanına yazar.
- **Stok ve durum:** Handaki sıcak yemek, çalıdaki porsiyon, depo, ışıklar ve kalıcı bonuslar.
- **Yükseltme kutusu:** Sonraki seviyenin adı, açıklaması ve maliyeti (eksik kaynak kırmızı) ile **Yükselt** ya da **Onarımı Başlat** düğmesi. İş sürerken yerinde ilerleme ve **İptal Et** görünür: hiç çalışılmadıysa tamamı, yoksa yarısı iade edilir.
- **Yık:** Yükseltilmiş yapı yıkılırsa temel ve yükseltme maliyetinin yarısı geri gelir.

**Seviye 2 yükseltmeleri** (`data/buildings.js` → `upgrade`):
- **Yapı ayakta kalır:** Yükseltme başlayınca maliyet ödenir, iş kuyruğuna inşaat işi düşer. Yapı yıkılmaz ve bu sırada eskisi gibi çalışmaya devam eder.
- **Görünüm:** İş bitince yapı yeni görünümüne geçer, kutlama ezgisi çalar, günlüğe yazılır.

| Seviye 1 | Seviye 2 | Maliyet | Ne değişir? |
|---|---|---|---|
| Ahşap Kulübe | **Taş Ev** | Odun 20, Taş 25 | İki katlı, panjurlu, kiremit çatılı taş ev. Kapasite **2 → 4**. Yalıtımlı: kışın **%30 daha az odun** yakar. İçinde uyuyanların keyfi uykuda dolar, sabah keyifle uyanırlar. |
| Oduncu Kulübesi | **Kereste Atölyesi** | Odun 20, Taş 20 | Kiremit çatılı atölye, tezgâhta dönen hızar ve kalas yığını. **2 çalışan**, odun üretimi **+%40**. Karda verim %45 yerine en az **%70**. |
| Sebze Bahçesi | **Cam Sera** | Odun 25, Taş 30 | Beyaz çerçeveli cam duvarlar ve çatı, içinde domatesler. **Kışın donmaz**, kışın da **%60** verimle taze yiyecek üretir. Bereketli toprakta +%25 de eklenir. |
| Taş Ocağı | **Derin Maden Ocağı** | Odun 30, Taş 20 | Ahşap destekli maden girişi, raylar, taş dolu vagon, demir kuşaklı vinç. Taş üretimi **+%50**. |

**Denge ve test (simülasyon, 5 harita):**
- **Onarım:** Üç harabe de her haritada ulaşılabilir çıktı. Onarım iki inşaatçıyla yaklaşık yarım iş gününde bitiyor; erzak hazinesi stoğa giriyor.
- **Kış:** Cam Sera kışın günde 25–40 yiyecek üretti, Kereste Atölyesi karda iki çalışanla %98 verimle çalıştı.
- **Nüfus:** Bir Taş Ev ile konut kapasitesi 12'den 14'e çıktı.
- **Refah:** Kadim Çeşme ve Erzak Kampı boş zaman yeri olarak kullanılırken refah tüm yıl %85–93 arasında kaldı.
- **Kayıt:** Proje ortasında kaydedilip yüklenen oyun kaldığı yerden yükseltmeyi bitirdi.

**Önizleme:** `/tools/art-preview.html` sayfasının başında biyom karoları (dört mevsim), biyom geçişleri
mozaiği, Seviye 2 yapılar (öncesi / sonrası, kış hâlleri) ve harabeler (yıkık / onarılmış, kış hâlleri) var.

**Sıkışan sakinler:** Yapılar bir sakinin durduğu küçük bir cebi kasabadan tamamen ayırırsa sakin artık
orada mahsur kalmaz. Bir sonraki kararında en yakın açık karoya çıkar; şantiye üstünde kalanlar zaten böyle
kenara çekiliyordu.

## Aile, drama ve zanaat (9. aşama)

Sayılar `data/relationships.js` (`ROMANCE`, `MARRIAGE`), `data/family.js` ve `data/equipment.js`
dosyalarındadır; mantık `RelationshipSystem`, `FamilySystem`, `ConflictSystem` ve `CraftingSystem`'dedir.

### Aşk ve düğün

- **Aşk:** İlişki puanı 85 ve üstünde olan iki bekâr yetişkin (yaş farkı en çok 14) aynı toplanma yerinde
  sohbet ederken ya da şenlikte dans ederken aşık olabilir (dakikada %0,6). Sevgililer sohbette başlarında
  pembe-kırmızı çift kalp balonu taşır. Durum metninde "Sevgilisi Elif ile sohbet ediyor" (evlenince "Eşi
  Elif ile…") yazar.
- **Düğün:** En az 2 gündür sevgili olan çift, akşam (17:00–02:00) aynı handa, havuz ya da ateş başında veya
  şenlikte birlikteyken evlenir (dakikada %1,2). 5 gün geçtiği hâlde evlenmedilerse 18:00'de meydanda küçük
  bir tören yapılır.
  - Günlüğe "Düğün var! …" yazılır, kısa bir düğün ezgisi çalar, çiftin başında yüzük balonu belirir.
  - Çiftin keyfi +25, kasabadaki herkesin keyfi +8 artar.
- **Aynı eve taşınma:** Evlenen çift aynı eve taşınır ("Yeni evine taşınıyor").
  - Birinin evinde boş yatak varsa öteki oraya taşınır. Yoksa ikisi birden en az iki boş yataklı bir eve geçer.
  - Seçenekler arasında Taş Ev ve çocuklara yer kalan ev tercih edilir.
  - Hiç yer yoksa evlerden birindeki bekâr bir ev arkadaşı öteki eşin yatağına geçer.
  - Yine olmazsa her sabah 07:00'de ve yeni bir kulübe ya da Taş Ev bitince yeniden denenir.
- **Mutlu Yuva:** Aynı evde birlikte uyuyan ya da akşam aynı toplanma yerinde / şenlikte vakit geçiren eşler
  ertesi sabah +12 keyifle uyanır. 10 saat boyunca keyifleri %30 daha yavaş düşer. Karakter panelinde pembe
  **Mutlu Yuva** etiketi görünür.

### Çocuklar

Her sabah 07:00'de şu koşulları sağlayan her evli çifte %45 olasılıkla bir çocuk katılır:

- aynı evde yaşıyorlar ve evde boş yatak var;
- kasaba refahı en az %62, nüfus 30'dan az;
- en az 1 gündür evliler, son çocuklarından bu yana 4 gün geçti, en çok 2 çocukları var.

Dört yataklı **Taş Ev** aileler için en uygun yuvadır. Kulübede yer yoksa evdeki bekâr bir ev arkadaşı (başka
bir evde boş yatak varsa) yer açmak için oraya taşınır. Göçmenler evli çiftlerin evine yerleşmez: o yataklar
çocuklara ayrılır. Bu yüzden HUD'daki göç ipucu yalnızca açık yatakları sayar. Göç kasabayı en çok 24 kişiye
çıkarır; aileler büyüyerek 30'a kadar çıkarabilir.

- **Görünüm:** Küçük (12x14) bir sprite. Saç ve ten ebeveynlerden, gömlek canlı bir renkten gelir.
- **Kişilik:** Ebeveynlerinden birbirine zıt olmayan özellikler alır.
- **Gün:** Çalışmaz, ekipman kuşanmaz, 07:30–20:30 arası uyanıktır. Meydanda, hanın önünde, havuz, kamp
  ateşi ve anıt çevresinde koşturup oynar, çiçek koklar.
- **Neşe:** Oynayan bir çocuğun 44 piksel yakınındaki yetişkinlerin keyfi dakikada +0,05 artar.
- **Büyüme:** 6–8 gün sonra 18 yaşında yetişkin olur. Günlüğe yazılır, çalışmaya başlar, o da evlenebilir.

### Zıt kişilikler, atışma ve barışma

| Özellik | Zıddı |
|---|---|
| Çalışkan | Uykucu |
| Sosyal Kelebek | İçine Kapanık |
| Doğa Sever | **Hırslı** (yeni: taş ocağını ve anıtı sever, hızlı çalışır, boş durunca keyfi kaçar) |
| Neşeli | **Huysuz** (yeni: az güler, tartışmaya 1,5 kat yatkındır, handa yumuşar) |

Göçmenler ve çocuklar kendi içinde zıt özellik taşımaz. Zıt kişilikli iki sakin sohbetten ve birlikte
çalışmaktan yarı puan kazanır. Kişilik çiplerinin ipucunda zıddı da yazar.

- **Atışma:** Sevgili ya da eş olmayan zıt kişilikli iki yetişkin şu durumlarda atışabilir:

  | Durum | Olasılık (dakikada) |
  |---|---|
  | Aynı yapıda / şantiyede yan yana çalışırken | %3 |
  | Dar bir yerde (12 piksel) karşılaşınca | %1,2 |
  | Aynı toplanma yerinde sohbet ederken | %0,08 |

  Atışınca biri öfke şimşeği, öteki somurtma bulutu çıkarır ve homurtu sesi gelir. İkisinin keyfi 6, ilişki
  puanı 8 düşer; aynı çift 3 saat yeniden atışmaz. Günlüğe yalnızca iş başında ve sohbette çıkan ilk atışma
  yazılır (çift başına günde bir), yoldaki karşılaşmalar yazılmaz. Puan eksiye inince "Hoşlanmıyor",
  −25'in altında "Rakip" olurlar.
- **Barışma:** Puanı −10'un altındaki iki sakin akşam (17:00'den sonra) handa sıcak yemek yerken ya da hanın
  önünde, veya bir şenlikte denk gelirse barışabilir (dakikada %3). İlişki puanı 12'ye (Tanıdık) döner,
  ikisinin başında kalp belirir, günlüğe "X ile Y handa barıştı" yazılır.

### Kişisel ekipman ve Zanaat Atölyesi

Her yetişkinin üç ekipman yuvası vardır: **Alet**, **Kıyafet**, **Çanta**.

| Yapı | Boyut | Maliyet | Ne işe yarar? |
|---|---|---|---|
| Zanaat Atölyesi | 3x2 | Odun 25, Taş 20 | 1 zanaatkâr stoktaki kaynaktan kasabanın **ekipman deposuna** üretir. Arduvaz çatılı atölye: tezgâh, alet askısı, asılı çanta, mankende palto. Çalışırken örsün üstündeki demir kızarır, kıvılcım sıçrar, bacası tüter. |

| Ekipman | Yuva | Malzeme | Üretim işi | Etki | Görünüm |
|---|---|---|---|---|---|
| Sağlam Alet | Alet | 2 demir + 2 odun (eski usul: 4 odun + 4 taş) | 70 | Üretim ve inşaat hızı **+%25** | Elindeki baltanın / kazmanın / çekicin başı çelik, sapı koyu |
| Kalın Kışlık Palto | Kıyafet | 3 yün + 1 odun (eski usul: 6 odun + 4 yiyecek) | 80 | Kışın dışarıda üşümenin enerji ve keyif etkisi **%60 az**; üşüme balonu da seyrekleşir | Sonbahar ve kışta beyaz yakalı lacivert palto |
| Sırt Çantası | Çanta | 2 yün + 2 odun (eski usul: 5 odun + 3 yiyecek) | 60 | Yürürken **%40 daha az** yorulur, çalışma verimi **+%15** | Sırtında deri çanta (önden askıları görünür) |

9. aşamada kasabada lif kaynağı yoktu; paltonun malzemesi odun ve yiyecekti. 10. aşamadan beri asıl tarifler
demir ve yündür; **eski usul** tarif yalnızca kasabada o malzemeyi üreten tamamlanmış bir yapı (Demir Madeni /
Koyun Ağılı) yokken kullanılır, böylece erken oyunda atölye tıkanmaz (bkz. *Üretim zincirleri*).

- **Üretim seçimi** (atölyenin yapı panelinde):
  - **Otomatik:** Depoda en çok eksik olanı sırayla üretir. Sonbahar ve kışta palto önceliklidir.
  - **Alet / Palto / Çanta:** Seçilen ekipmanı, eksik olandan 2 fazla birikene kadar üretir.
  - **Panel:** Sıradaki işi, ilerleme çubuğunu, depodaki ekipmanı ve "N kişide yok" bilgisini gösterir.
- **Üretim durursa:** Malzeme yetmiyorsa panelde nedeni yazar. Herkes donanımlıysa "sipariş bekliyor" yazar ve
  zanaatkâr başka bir işe gider.
- **Kuşanma:** Depoda boşta ekipman varsa ona en çok ihtiyacı olan sakin onu alıp kuşanır ("Palto almaya
  gidiyor" → "Palto kuşanıyor"). Ekipman atölyeden, kilerden ya da erzak kampından alınır.
  - Alet ve çantada en deneyimli çalışan önce gelir (çantada inşaatçı, oduncu ve taşçılara ağırlık verilir).
  - Paltoda sonbahar-kışta önce üşüyenler, sonra dışarıda en çok çalışanlar gelir.
  - Karakter panelindeki **Ekipman** bölümü üç yuvayı küçük simgeleriyle gösterir; boş yuva soluktur.

### Panellerdeki yenilikler

- **Karakter paneli:**
  - **Aile:** Eşi ya da sevgilisi (yüzük / kalp), çocukları ve ebeveynleri tıklanabilir isimler olarak görünür.
  - **Çocuk:** Büyümesine kaç gün kaldığı yazar.
  - **İlişkiler:** Eş en üstte pembe satırda, rakip kırmızı çubukla görünür.
  - **Diğer:** Ekipman yuvaları ve "Mutlu Yuva" / "Üşüyor (palto: %60 az)" etiketleri.
- **Ev paneli:** "Burada yaşayan aile" başlığı altında evli / sevgili / çocuk etiketleri görünür. Kulübenin
  bilgi satırı da aileyi söyler.
- **İş yeri paneli:** Çalışanlar "şu an burada" ya da "son çalışan" olarak listelenir, her birinin yanında
  **İşten Çıkar** düğmesi vardır.
  - Çıkarılan sakin işini hemen bırakır, somurtur ve "İşten çıkarıldı, kendine başka iş arıyor" der.
  - O yapıda bir daha çalışmaz, başka bir işe geçer; günlüğe ve bildirime yazılır.
  - Panelin "İşten çıkarılanlar" bölümündeki **Geri Al** onu yeniden çalışabilir yapar. Anlaşamayan iki
    çalışanı ayırmak için kullanışlıdır.

### Denge ve test (simülasyon)

- **30 gün (tohum 42):**
  - 11 aşk ve 10 düğün oldu (şenlikte, Süs Havuzu'nda, Kasaba Hanı'nda ve Kamp Ateşi'nde); çiftlerin 8'i
    aynı eve taşındı.
  - 16.–20. günlerde 6 çocuk doğdu, hepsi 23.–28. günlerde büyüdü; büyüyenlerden biri sonra evlendi.
  - Nüfus 30'a çıktı. Atölye 90 ekipman üretti; ay sonunda her yetişkinin üç yuvası doluydu.
  - Barışmaların çoğu şenliklerde oldu.
- **Palto:** Kışın dışarıda 3 saat geçiren sakin, üşümeden fazladan paltoyla 2,3 enerji ve 3,8 keyif kaybetti.
  Paltosuz kayıp 5,7 enerji ve 9,5 keyifti: tam %60 daha az.
- **18 gün:** Mutlu Yuva ile 29 sabah uyanışı oldu. Atışmaların 17'si iş başında, 27'si karşılaşmada, 35'i
  sohbette çıktı.
- **İşten Çıkar:**
  - Sebze Bahçesi'nden çıkarılan sakinin işi hemen bitti; sonraki 2 günde orada hiç çalışmadı, iskelede ve
    taş ocağında çalıştı. Geri Al dışlamayı kaldırdı.
  - Tarayıcıda: Oduncu Kulübesi'nden çıkarılan sakinin yerine başkası geldi, Geri Al düğmesi çalıştı.
- **Kayıt:** Evlilikler, aileler, çocuğun büyüme zamanı (çocuk düzeni ve boyuyla), eksi puanlar, atölye ve
  ekipman kayıttan aynen döndü. Yüklemeden sonra doğumlar sürdü. 8. aşama kaydı (sürüm 6) sorunsuz açıldı.

**Önizleme:** `/tools/art-preview.html` sayfasında çocuklar (önden, arkadan, yandan; yürüme ve oturma), paltolu ve çantalı
sakinler, yeni balonlar (aşk, öfke, somurtma, yüzük), ekipman simgeleri, normal ve sağlam aletler ve Zanaat
Atölyesi (boşta, çalışırken, kışın, şantiye) var.

## Üretim zincirleri, hayvancılık ve kasaba seviyesi (10. aşama)

Sayılar `data/resources.js`, `data/buildings.js`, `data/equipment.js`, `data/town.js` ve `data/trade.js`
dosyalarındadır; mantık `EconomySystem`, `BehaviorSystem`, `CraftingSystem`, `StructureSystem` ve
`TownLevelSystem`'dedir.

### İşlenmiş mallar

| Mal | Nereden gelir? | Ne işe yarar? |
|---|---|---|
| **Yün** (Yün ve Kumaş) | Koyun Ağılı | Kışlık palto (3 yün + 1 odun) ve sırt çantası (2 yün + 2 odun) |
| **Demir** (Demir Cevheri) | Demir Madeni | Sağlam (çelik başlı) alet (2 demir + 2 odun), Belediye Konağı (8 demir) |
| **Ekmek** (Un ve Ekmek) | Yel Değirmeni ve Fırın | Öğünlerde önce ekmek yenir: 1 ekmek **2,5 yiyecek** değerindedir |

- **HUD:** Odun / Taş / Yiyecek satırının altında **Mallar** satırı vardır. Özet görünümde yalnızca simge ve miktar,
  ▸ ile açılınca her malın depo doluluğu, kaç yapının ürettiği ve bugünkü üretimi görünür. Seçim tarayıcıda
  hatırlanır. Yiyecek kutusunun ipucunda ekmek dahil toplam besin değeri yazar.
- **Ekmekle yemek:** Öğün 3 yiyecek değeridir. Kilerde ekmek varsa sakin önce ekmek yer ("Evinde taze ekmekle
  yemek yiyor") ve sofradaki sıcak ekmek dakikada +0,25 keyif de verir. Bir ekmek dilimlenince artan yiyecek
  değeri kilerde pay olarak saklanır (`pantry.credit`), hiçbir şey kaybolmaz. Handaki aşçı önce ham yiyecek
  kullanır, kilerde yalnızca ekmek kaldıysa onu sofraya koyar. Göç koşulu da ekmeği yiyecek değeriyle sayar.
- **İlk ürün:** Kasabanın ilk yünü, demiri ve ekmeği çıkınca günlüğe yazılır ve kısa bir başarı ezgisi çalar.
  Fırın ham yiyeceği una çevirdikçe "Yiyecek stoğu tükendi" yazılmaz; kilerde ekmek varsa kasaba aç değildir.

### Yeni yapılar

| Yapı | Boyut | Maliyet | Ne işe yarar? |
|---|---|---|---|
| Koyun Ağılı | 3x3 | Odun 30, Taş 8, Yiyecek 10 | 1 **çoban** kapının önünde değneğiyle durur. Kişi başı saatte **+2 yün** ve yan ürün olarak **+1 yiyecek** (süt-peynir). İlkbaharda kırkım bereketi **%125**, kışın koyunlar ahırda: **%60**. Bereketli toprakta **+%20**. |
| Yel Değirmeni ve Fırın | 3x3 | Odun 40, Taş 35 | **Köy** seviyesinde açılır; önce bir Sebze Bahçesi gerekir. 1 **fırıncı** fırının ağzında çalışır: saatte **4 yiyecek → 4 ekmek** (10 yiyecek değeri). Kışın da çalışır. Kilerde yiyecek yoksa ya da ekmek deposu doluysa boşta kalır, panel nedenini yazar. |
| Demir Madeni | 3x3 | Odun 40, Taş 20 | **Kayalık Tepe**'ye (ayak izinin en az 3 karosu) ya da kayaların yanına (6 karo içinde en az 3 kaya / çakıl) kurulur. 2 **madenci** tünelin iki yanında kazma sallar: kişi başı saatte **+1,5 demir** ve **+1 taş**. Kayalık tepede **+%20**. |
| Belediye Konağı | 3x3 | Odun 60, Taş 80, Demir 8 | **Kasaba** seviyesinde açılır; kasabada yalnızca bir tane olur. Tüm iş ve inşaat verimi **+%15**, refaha kalıcı **+3**. Her sabah 07:00'de vergi ve erzak defterini tutar: temel kaynaklardan deposu en az %50 dolu olanın %15'ini (en çok 12) deposu %30'un altına düşene 1'e 1 aktarır; bildirim ve günlüğe yazılır. |

- **Koyunlar:** Ağıl iki katmanda çizilir (otlak ve ahır / ön çit); dört koyun aradaki derinlik sırasıyla
  dolaşır. Otlar (baş eğik, çiğner), kısa yürüyüşler yapar, durup bakınır, birbirinin içine girmez. Akşam
  20:30'da ahırın önündeki yerlerine yürüyüp yatarlar, başlarının üstünde küçük "z"ler yükselir; sabah kalkarlar.
  Kışın ve yağmurda ahıra yakın dolaşırlar. İlkbaharda bir **kuzu** annesinin peşinden koşturur. Kamera ağıla
  yakınken gündüz ara sıra meleme sesi gelir (yakınlığa göre yüksek).
- **Değirmen:** Dört yelkenli kanat altı karede çeyrek tur döner: rüzgârda ağır ağır, fırıncı çalışırken hızlı
  (hız yumuşakça değişir). Fırının ağzında alev titrer, gece turuncu ışık verir; fırıncı çalışırken baca yoğun,
  gündüz fırın sıcakken ince tüter. Kışın başlık ve fırın karlanır, dönen kanatlara kar tutmaz.
- **Maden:** Madenciler çalışırken cevher vagonu raylarda tünelden dolu çıkar, boş döner; girişteki fener
  18:30-06:30 yanar.
- **Belediye:** Saat kulesinin tepesinde bayrak dalgalanır; gece pencereler ve basamakların iki yanındaki
  fenerler yanar.
- **Meslekler:** Hayvancılık (Çoban), Fırıncılık (Fırıncı), Madencilik (Madenci). *Hırslı* madenciliği, *Doğa
  Sever* çobanlığı sever.

### Zanaat Atölyesi ve tarifler

Alet demirden, palto ve çanta yünden yapılır. Kasabada o malzemeyi üreten tamamlanmış bir yapı **yoksa**
zanaatkâr eski usul (odun / taş / yiyecek) tarifle üretir; üreten yapı **varsa** malzemenin gelmesini bekler
(panel "Yün bekleniyor" der). Tezgâhtaki iş ve sıradaki ekipman eski usulse panelde "(eski usul)" yazar;
ekipmanın ipucunda iki tarif de görünür.

### Kasaba seviyesi (Mezra → Köy → Kasaba → Gelişmiş Şehir)

Kasaba büyüdükçe kendiliğinden seviye atlar; seviye **hiç düşmez** (oyuncu cezalandırılmaz, büyüme ödüllendirilir).
Bir seviyenin koşullarının hepsi aynı anda sağlanmalıdır. *Ortalama refah*, kasaba refahının yaklaşık yarım
günlük yürüyen ortalamasıdır: bir anlık şenlik coşkusu yetmez, kasaba bir süre mutlu kalmalıdır. *Yapı*
sayısına süsleme (bank, fener, çiçek tarhı) ve haritanın doğal parçaları girmez, onarılmış kadim yapılar girer.

| Seviye | Unvan | Nüfus | Yapı | Seviye 2 yapı | Ortalama refah | Ödüller |
|---|---|---|---|---|---|---|
| 1 | Mezra ("Yeşilvadi Mezrası") | — | — | — | — | — |
| 2 | Köy ("Yeşilvadi Köyü") | 13 | 8 | 1 | %63 | Yel Değirmeni ve Fırın; Bilgelik Evi (12. aşama); bir kedi ve bir köpek; tüccar yün balyası ve demir külçesi getirir; her maldan +1 stok |
| 3 | Kasaba ("Yeşilvadi Kasabası") | 20 | 17 | 3 | %68 | Belediye Konağı; Büyük Ticaret Limanı (12. aşama); bir kedi daha; tüccar (Kervancı) ekmek sepeti getirir, yün ve demir alır; +2 stok; sabah 3 göçmen |
| 4 | Gelişmiş Şehir ("Yeşilvadi Şehri") | 25 | 28 | 8 | %75 ve **Belediye Konağı** kurulmuş | Kasaba Harikası (12. aşama); refaha kalıcı +4; göç sınırı 30; bir köpek daha; Kervanbaşı Şehir Kervanı ve Lonca Ustaları (1 gün %20 hızlı çalışma) getirir; +3 stok |

11. aşamada eşikler yaklaşık %25-30 zorlaştırıldı (10. aşamada Köy 10 / 6 / 0 / %60, Kasaba 16 / 13 / 2 / %65,
Şehir 24 / 22 / 6 / %72 idi). Otopilotla şehir olmak 13.–16. günden 18.–24. güne uzadı. 12. aşamada şehrin nüfus
eşiği 28'den **25**'e indi: göç sınırının (24) üstünde en az bir doğum yine şarttır ama oyuncu çok uzun beklemez.
28 yapı için de kadim harabelerin onarımına ya da ikinci ağıl, sera, şifacı gibi yatırımlara gerek vardır. Eski bir kasabanın ulaştığı seviye düşmez.

- **Seviye atlayınca:** büyük kutlama ezgisi, bildirim, günlük kaydı ve yeni unvanı, açılan yapının görselini ve
  ödülleri gösteren kutlama penceresi (oyun durmaz). HUD'daki kasaba adı unvanla yazılır ("Yeşilvadi
  Kasabası"); ad zaten unvanla bitiyorsa ("Ayışığı Köyü") unvan ayrıca eklenir: "Ayışığı Köyü · Kasaba".
- **İzleme:** HUD'da adın yanında seviye arması ve dört pip; üzerine gelince sonraki seviyenin koşulları
  (✓ / ✗) ve ödülleri. Koşulların hepsi sağlanınca pip çerçevesi yanıp söner. Hedefler panelinin (`G`) başında
  **Kasaba Seviyesi** kartı her koşulu ilerleme çubuğuyla gösterir.
- **Kilitli yapılar:** İnşa menüsünde soluk görünür, köşelerinde açılacakları seviyenin adı yazar; ipucu ve
  yerleştirme gerekçesi "Kasaba Köy seviyesine ulaşınca açılır" der.
- **Gezgin tüccar:** Seviye arttıkça mal çeşitliliği (`minTier`) ve her teklifin stoğu (`merchantBonus`) artar,
  unvanı da büyür: Gezgin Tüccar → Kervancı → Kervanbaşı. Takas penceresinde seviyeyle gelen mallar altın tonla
  vurgulanır.
- **Başlangıç ekranı:** "Kaldığın Yerden Devam Et" satırında kasabanın unvanı yazar ("Yeşilvadi Kasabası · Gün 12").

### Yerleşim güvenliği

Bir yapı, başka bir yapının girişini ya da çalışma yerini kasabadan **tamamen koparacak** şekilde (araya geçit
bırakmadan) kurulamaz: "Yel Değirmeni ve Fırın kasabadan kopar: aradaki geçidi kapatma". Yeni yapının kendi önü de
yapı **kurulduktan sonra** kasabaya bağlı olmalıdır (önü yalnızca kendi ayak izinin içinden bağlanan yere kurulamaz). Kesilen ağacın kütüğünden
yetişen fidan da bir yapının girişini kapatacaksa ağaca dönüşmez, kurur. Böylece sık kurulan kasabalarda
değirmen, maden ya da ev kapalı bir cepte kalıp sessizce durmaz.

### Denge ve test (simülasyon)

Başsız simülasyonda (Chromium, sabit 1/60 sn adım, 4x hız) hilesiz bir otopilot oynadı: toplama emri verir,
sırayla yapı kurar ve yükseltir. 4 harita (tohum 42, 7, 2024, 3), 32 gün; `Math.random` da tohumlanarak
deterministik koşuldu.

- **Seviyeler:** Köy 3.–5., Kasaba 8.–10., Gelişmiş Şehir 13.–16. günde (Belediye Konağı tamamlanınca) geldi.
  Eski koşullarda (belediyesiz) şehir 11. günde geliyordu; belediye koşulu temposu kervan ve demir zincirine bağladı.
- **Zincirler:** İlk yün 4., ilk demir 4.–5., ilk ekmek 5.–6. günde çıktı. 32 günde ağıl 440–450 yün, maden
  360–370 demir, fırın 675–735 ekmek üretti.
- **Atölye:** 88–90 ekipmanın tamamına yakını asıl tarifle (yün / demir) yapıldı; eski usul tarif yalnızca ağıl
  ya da maden kurulmadan önce 0–2 kez kullanıldı. 30 sakinin hepsi alet, palto ve çantalı.
- **Kış:** Dört haritada da Kış Sınavı ilk kışta (17. gün) geçildi; kasabanın ortalama refahı en düşük %69–73'te
  kaldı. Ekmek kışın yiyecek stoğunu 2,5 kat uzattığı için donmuş bahçelere rağmen kimse aç kalmadı.
- **Belediye:** Erzak dengesi her sabah bir kez çalıştı (ör. 12 yiyecek → 12 odun); iş verimi 1,15 kat.
- **Koyunlar:** Gündüz otlayıp dolaştılar, 20:30'da ahır önündeki yerlerine yürüyüp yattılar; ilkbaharda kuzu
  annesini izledi. Değirmen kanatları rüzgârda ağır, fırıncı çalışırken hızlı döndü; maden vagonu raylarda gidip geldi.
- **Hata bulundu ve düzeltildi:** Sık kurulan kasabalarda yeni bir yapı, önü yalnızca kendi ayak izinin içinden
  kasabaya bağlanan bir yerde kurulabiliyor ya da başka bir yapıyı kapalı cepte bırakabiliyordu (değirmen, maden ve
  atölye sessizce duruyordu). Yerleşim artık yapı kurulduktan sonraki ulaşılabilirliğe bakar (bkz. *Yerleşim güvenliği*).
- **Hedefli testler (33):** ekmekli öğün ve dilim payı, aşçının önce ham yiyecek kullanması, göç koşulunda ekmek,
  seviye kilitleri, eski usul → asıl tarif geçişi, tüccarın seviye malları ve stokları, yün satışı, belediye
  çarpanı ve günde bir erzak dengesi, unvan biçimleri, kendi girişini koparan yapının reddi.
- **Kayıt:** 9. aşamanın oyunu (sürüm 7) ile büyütülüp kaydedilen kasaba açıldı: seviyesi sessizce Köy belirlendi
  (kutlama penceresi açılmadı), ertesi sabah göçle Kasaba'ya çıkınca kutlandı. Sürüm 8 kaydında yün / demir /
  ekmek, dilim payı ve kasaba seviyesi kaydet-yükle döngüsünde aynen döndü.

**Önizleme:** `/tools/art-preview.html` sayfasının başında işlenmiş mal ve seviye simgeleri, taşınan yükler,
çoban değneği ve fırın küreği, koyunlar ve kuzu (tüm pozlar), Koyun Ağılı (dört mevsim, iki katman, şantiye),
Yel Değirmeni (altı kanat karesi, fırın alevi, gece, kış), Demir Madeni (vagon kareleri, gece, kış) ve Belediye
Konağı (bayrak kareleri, gece, kış, şantiye) var.

## Yaşayan doğa, sağlık, karar olayları ve belediye fermanları (11. aşama)

Sayılar `data/animals.js`, `data/health.js`, `data/dilemmas.js` ve `data/town.js` (`CIVIC_PROJECTS`) dosyalarındadır;
mantık `AnimalSystem`, `HealthSystem`, `DilemmaSystem` ve `CivicSystem`'dedir.

### Yaban hayatı

İlk açılışta (ya da hayvansız eski bir kayıt yüklenince) haritanın sakin köşelerine, tohumdan hep aynı yerlere
**9 tavşan** ve **4 geyik** yerleşir (48x48 haritada orantılı az). Yuvaları meydandan uzak (tavşan 13, geyik 17
karo) bereketli toprak, orman zemini ve çimendedir.

- **Gündüz:** Yuvalarının çevresinde dolaşır, otlar. Tavşanlar zıplayarak koşar, ot kemirir. Geyikler başlarını
  eğip otlar; erkeklerin boynuzu vardır.
- **Ürkme:** Bir sakin yaklaşınca (tavşan 38, geyik 62 piksel) ürküp ondan uzağa, yürünebilir bir yöne kaçarlar.
  Sakin uzaklaşınca yeniden otlarlar.
- **Gece:** Tavşan yuvasına girer, geyik yuvasında yatar.
- **Kış:** Tavşanlar beyaz kürk giyer.
- **Yuva:** Yuvası yapıyla ya da yolla kaplanırsa yakında yeni bir yuva bulurlar.

### Kasaba kedileri ve köpekleri

Kasaba **Köy** olunca (ya da bir Kasaba Hanı veya Belediye Konağı tamamlanınca) sabah 09:00'da harita kenarından
birer birer hayvan gelir (günde en çok bir tane). Gelince bildirim çıkar ve günlüğe yazılır: "Kasabaya Tekir adında
bir kedi yerleşti".

| Seviye | Kedi | Köpek |
|---|---|---|
| Köy | 1 | 1 |
| Kasaba | 2 | 1 |
| Gelişmiş Şehir | 2 | 2 |

- **Görünüm:** Kediler tekir, sarman ya da kara-beyaz; köpekler kahverengi ya da alacalı.
- **Gündüz:** Meydanda ve evlerin önünde dolaşır, oturur. Köpekler ara sıra bir sakinin peşine takılır, kediler
  gündüz de kestirir.
- **Gece, yağmurda ve kışın:** Yanan kamp ateşinin başına, hanın önüne ya da en yakın evin saçağının altına
  kıvrılıp uyurlar.
- **Sevme:** Yanından geçen sakin onu sever. Sakinin başında kalp balonu, hayvanın başında küçük bir kalp çıkar,
  sakine anlık **+6 keyif** gelir (çocuklara +9). Aynı sakin 2 saat içinde yeniden sevmez.

### Sağlık: üşütme ve Şifacı Kulübesi

**Maruziyet:** Her sakinin 0-100 arası bir maruziyeti vardır.
- **Biriken:** Kışın dışarıda üşürken (kışlık palto korur), yağmurda ıslanırken (Doğa Sever ıslanmaz),
  enerjisi ya da tokluğu 12'nin altındayken birikir.
- **Azalan:** Evde, handa ya da ateş başında içi ısınmışken hızlı, iyi durumdayken yavaş azalır.
- **Üşütme:** 45'i aşınca küçük bir olasılıkla **üşütür** ("Üşütmek üzere" etiketi uyarır).

| Durum | Etki |
|---|---|
| Üşütmüş / halsiz | Yürüme ve çalışma **%35 yavaş**, enerji 1,2 kat hızlı düşer; başında ara sıra hapşırma ya da ateş balonu, hapşırma sesi |
| Kendiliğinden iyileşme | ~40 oyun saati (sıcak evinde uyurken iki kat hızlı) |
| Şifacıda tedavi | Bir iksirle hemen iyileşir ve 12 saat **Dinçlik** kazanır: iş ve yürüme **+%15**, enerji %15 yavaş düşer |

| Yapı | Boyut | Maliyet | Ne işe yarar? |
|---|---|---|---|
| Şifacı Kulübesi | 2x2 | Odun 30, Taş 15 | Saman çatısında ot demetleri kurutulan aktar kulübesi. 1 **şifacı**, kulübenin 7 karo çevresindeki ağaçların dibinde ve çiçekli çimende **şifalı ot toplar** (çevrede 6 ağaç varsa tam hız, hiç yoksa %35), sonra kulübenin önündeki taş havanda döverek **iksir** hazırlar (2 ot = 1 iksir; rafta en çok 6 iksir, sepette 10 ot). Çalışırken kazanda yeşil iksir kaynar, buhar tüter; gece penceresi yeşilimsi yanar. |

- **Tedaviye gitme:** Hasta sakin, iksiri olan en yakın kulübeye kendiliğinden gider ("Şifacıya gidiyor"). İçeride
  tedavi olur. Yolda olanlar iksirleri paylaşmaz.
- **Şifacı yoksa:** Hasta sakin gündüz yorulunca evinde kestirir.
- **Paneller ve HUD:** Kulübenin panelinde iksir rafı, ot sepeti, ot toplama verimi ve kasabadaki hastalar görünür.
  HUD'da "N hasta", karakter panelinde "Üşütmüş" / "Dinçlik" etiketleri çıkar.
- **Meslek:** Yeni meslek Şifacılık (Şifacı).

### İkilem ve karar olayları

İlk olay en erken 4. günde gelir, sonra 2-4 günde bir sabah 10:00'da koşulu tutan olaylardan biri gelir. Aynı olay
6 gün içinde tekrarlanmaz.
- **Pencere:** Oyun durur, ortada bir karar penceresi açılır (bkz. aşağıdaki tablo). Koşulu tutmayan seçenek
  soluk görünür ve nedeni yazar ("Kasabada boş yatak yok", "Yetersiz demir").
- **Süre:** Alttaki çubuk 30 saniyelik süreyi gösterir. Süre dolunca varsayılan güvenli seçenek uygulanır, oyun
  önceki hâline döner.
- **Kayıt:** Seçim günlüğe yazılır.

| Olay | Seçenekler (varsayılan **kalın**) |
|---|---|
| Sığınmacı Kafilesi | 40 yiyecek + 20 odun: doyur → 2 gün **İyilik Şöhreti** (refah +5), herkese keyif +10 · En yeteneklisini al → boş bir yatağa bir meslekte **Usta** bir göçmen · **Kibarca geri çevir** (keyif −3) |
| Gezgin Ozanlar | 30 ekmek + 20 yün: **Büyük Panayır** → 2 gün keyif çok yavaş düşer, arkadaşlık 1,6 kat hızlı, refah +4, hemen keyif +20 · 15 yiyecek: bir akşamlık gösteri (keyif +10) · **Uğurla** |
| Sert Fırtına (kışın Kar Fırtınası) | 35 odun + 25 demir ya da **35 odun + 25 taş**: güçlendir → hasarsız · **Şansına güven** (taşla güçlendirmeye gücün yetmiyorsa) → fırtınada 1-3 üretim yapısı hasar alır |
| Kurt Sürüsü (sonbahar-kış, ağıl varsa) | 30 odun + 20 taş: **ağıl çitini yükselt** · Köpekleri nöbete koy (köpek varsa; %75 başarı) · Önlem alma → kurtlar ağıla dalarsa ağıl hasar alır, kasabanın keyfi −6 |
| Kayıp Hazine Haritası | 30 yiyecek + 2 Sağlam Alet: 2 kişilik sefer → bol demir, yün, işlenmiş taş ya da **Kadim Tılsım** (3 gün +%15 iş hızı, keyif yavaş düşer, refaha kalıcı +2; şans sayacıyla en geç 3. başarılı seferde kesin) · 15 yiyecek: tek izci → küçük ganimet · **Haritayı sandığa kaldır** |

- **Fırtına:** Karardan 20-30 saat sonra gelir. Hava birden kararır, gök gürler. Güçlendirilmemiş kasabada
  rastgele üretim yapıları hasar alır:
  - **Görünüm:** Yapının dibine kırık tahtalar saçılır, üstünde fırtına simgesi sallanır.
  - **Çalışma:** Hasarlı yapı onarılana kadar çalışmaz.
  - **Onarım:** Panelde yapının maliyetinin %30'u (yalnızca odun ve taş) ile 90 iş: **Onarımı Başlat**.
  - **Ağıl:** Kurtların bastığı ağılda koyunların çoğu dağılır, onarılana kadar iki koyun kalır.
  - **HUD:** "Fırtına yaklaşıyor" / "Kurt tehlikesi" ve "N hasarlı yapı" uyarıları görünür.
- **Keşif seferi:** Seçilen sakinler elindekini bırakır ve harita kenarına yürüyüp bir gün ufukta kaybolur.
  - **Seçim:** Önce Sağlam Alet kuşananlar, sonra en az deneyimliler seçilir; kasabanın ustaları kalır.
  - **Yoldayken:** İhtiyaçları donar. Aleti olmayana depodan alet verilir, alet seferde aşınır.
  - **Dönüş:** Kenardan döner ve ganimet stoğa girer. Bildirim, günlük ve kutlama ezgisi gelir.
  - **Kadim Tılsım şans sayacı (12. aşama):** Tılsım büyük ganimet tablosunda artık daha sık çıkar (ağırlık 1 → 2).
    Tılsımsız dönen her sefer sayacı (`civic.expeditionsSinceTalisman`) artırır; sayaç 3'e ulaştığı sefer (büyük ya da
    tek izcili) tılsımı **kesin** bulur ve sayaç sıfırlanır. Yani tılsım en geç 3. başarılı seferde gelir.
- **Mimari (12. aşama):** Karar penceresi seçeneklerin koşullarını sisteme sormaz. `DilemmaSystem` her karede aktif
  ikilemin seçeneklerini (`id`, `ok`, `reason`), varsayılan seçeneği ve başlığı `state.dilemma.active`'e yazar;
  `DilemmaModal` yalnızca bunu okur (arayüz yalnızca GameState okur kuralı).

### Belediye fermanları (geç oyun yatırımları)

Belediye Konağı'nın panelinde **Belediye Fermanları** bölümü vardır. Her fermanın açıklaması, maliyeti ve durumu
görünür; **Fermanı İlan Et** düğmesiyle ilan edilir. Ferman ilan edilince büyük kutlama ezgisi çalar, bildirim ve
günlük kaydı düşer.

| Ferman | Maliyet | Etki |
|---|---|---|
| Büyük Kışlık Ziyafet | 40 odun + 80 erzak (önce ekmek, yetmezse yiyecek) | Herkes doyar (tokluk +45, keyif +30); 3 gün **Büyük Ziyafet**: refah +6, iş şevki +%20, keyif yarı hızda düşer. 5 günde bir tekrarlanabilir |
| Altyapı ve Depo Genişletmesi (2 kademe) | 100 odun + 100 taş + 40 demir; sonra 150 + 150 + 60 | Tüm kaynakların depo sınırı kalıcı **+150** (300 → 450 → 600); meydana en yakın 30 / 40 toprak yol karosu arnavut kaldırımına döner |
| Zanaat Loncası Desteği (bir kez) | 50 yün + 50 demir | Meslek deneyimi kazanma hızı ve üretim yapılarındaki çalışma verimi kalıcı **+%15** |

### Denge ve test (simülasyon)

Otopilot (`tools/sim/autopilot.mjs`) 4 haritada (tohum 42, 7, 2024, 3) 32 gün oynadı. Hiçbir koşuda sayfa hatası
olmadı, girişi kopuk üretim yapısı kalmadı.
- **Seviyeler:** Köy 6.–8., Kasaba 9.–12., Gelişmiş Şehir 18.–24. günde geldi.
- **Sağlık:** 32 günde 4-9 kişi üşüttü (çoğu kışın), hepsi şifacıda iksirle iyileşip dinçleşti.
  - İlk ayarda kış akşamlarında bir günde 11 kişi birden hastalanıyordu.
  - Soğuk ve yağmur maruziyeti ile üşütme olasılığı düşürüldü.
- **Hayvanlar:** 13 yaban hayvanı yerleşti. Şehirde 4 kedi-köpek oldu; sakinler onları 32 günde 1400-1700 kez sevdi.
- **Kararlar:** Her koşuda 10-11 karar verildi.
  - Bir haritada fırtına ağıl, taş ocağı ve pazarı vurdu, üçü de aynı gün onarıldı. Güçlendirilmiş kasabalar
    fırtınayı hasarsız atlattı.
  - Seferler 2-3 kez çıktı ve ganimetle döndü (Kadim Tılsım nadir sonuçtur, bu koşularda çıkmadı).
  - Karar pencerelerine hiç dokunmayan "pasif" koşuda (tohum 3) her olay 30 saniye sonra varsayılan seçenekle
    kapandı. Taşla güçlendirmeye gücü yettiğinde kasaba fırtınayı hasarsız atlattı; yetmediğinde riske girdi ve
    hasar onarıldı.
- **Fermanlar:** 6-7 ferman ilan edildi (iki depo kademesi, lonca, 5 günde bir ziyafet); depo sınırı 600-740'a
  çıktı. Kış Sınavı dört haritada da ilk kışta geçildi.
- **Hedefli testler (`tools/sim/tests.mjs`, 51):** Önceki aşamanın kuralları ve 11. aşamanın kuralları test edildi:
  - hastanın yavaşlaması, şifacıya gitmesi, iyileşip dinçleşmesi, kendiliğinden iyileşme, soğukta maruziyet;
  - ot toplama ve iksir hazırlama;
  - kedi ve köpeğin gelişi (günde bir), sevme, yaban hayatının yerleşmesi ve tavşanın ürküp kaçması;
  - karar penceresinin oyunu durdurması ve 30 saniyede varsayılanla kapanması;
  - fırtına hasarı, hasarlı yapının durması, onarımı, güçlendirilmiş kasabanın hasarsız kalması;
  - izcinin sefere çıkıp ganimetle dönmesi;
  - üç ferman (+150 depo, lonca, ziyafet ve bekleme süresi);
  - sürüm 9 kaydının gidiş-dönüşü (hayvanlar, hastalık, iksir, hasar, ferman, fırtına).
- **Uyumluluk (`tools/sim/compat.mjs`, 12):** 9. aşamanın (sürüm 7) ve 10. aşamanın (sürüm 8) kayıtları açıldı ve
  bir gün sorunsuz yaşadı. Yaban hayatı yerleşti, fermanlar boş başladı, olay takvimi kuruldu, eski kasabanın
  seviyesi korundu ya da sessizce belirlendi.

**Önizleme:** `/tools/art-preview.html` sayfasının başında 11. aşamanın çizimleri var:
- tavşanlar (kış kürkü dahil), geyikler (dişi / boynuzlu erkek);
- kedi ve köpeklerin tüm renkleri ve pozları;
- Şifacı Kulübesi (kazan kareleri, gece, kış, şantiye);
- sağlık ve olay simgeleri, hapşırma / ateş balonları ve havan eli.

## Bilgelik, Ar-Ge, nehir ihracatı ve Kasaba Harikası (12. aşama)

Geç oyunda depolarda biriken yüzlerce birimlik stok artık üç yere akar: Bilgelik Evi'nin araştırmalarına, nehir
limanından ihracata (karşılığında **Kasaba Hazinesi**'ne altın) ve üç aşamalı **Kasaba Harikası**'na. Ayrıca 11.
aşamanın üç rötuşu yapıldı (Gelişmiş Şehir nüfus eşiği 25, Kadim Tılsım şans sayacı, karar penceresinin yalnızca
GameState okuması; bkz. ilgili bölümler).

### Yeni yapılar

| Yapı | Boyut | Maliyet | Açılış | Ne yapar? |
|---|---|---|---|---|
| Bilgelik Evi | 3x3 | Odun 70, Taş 60, Yün 15 | **Köy** | Krem sıvalı kanatlar, kitap sırtları görünen raflı pencereler, saat kadranlı kasnak ve bakır-turkuaz gözlem kubbesi. 1 **Bilge** çalışır (yeni meslek: Bilgelik). Bilge araştırma yürütür, ders saatinde çocuklara ders verir. Bilge çalışırken kubbenin yarığından dürbün uzanır; geceleri kitaplıklar ve kapı fenerleri yanar. |
| Büyük Ticaret Limanı | 3x2 | Odun 120, Taş 80, Demir 20 | **Kasaba** | Nehir kıyısına kurulur: bir sütun kum, iki sütun su, önünde teknelerin geçeceği açık su kalmalı (nehri kapatamaz). Kesme taş rıhtım, kırmızı kiremitli liman ambarı, sandık-fıçı-çuval yığınları, kalın kazıklı iskele, ahşap yük vinci ve liman feneri. Kasabada yalnızca bir tane olur. |
| Büyük Vadi Saat Kulesi (Kasaba Harikası) | 4x4 | Aşama başına (aşağıda) | **Gelişmiş Şehir** | Üç aşamada yükselen taş külliye. Kasabada yalnızca bir tane olur, yıkılamaz. |

### Kasaba araştırmaları (Ar-Ge)

Bilgelik Evi'nin panelindeki **Kasaba Araştırmaları** bölümünde dört kart vardır: açıklama, maliyet, durum ve
**Araştır** düğmesi. Maliyet peşin ödenir; Bilge içeride çalıştıkça ilerleme birikir, ilerleme çubuğu panelde
görünür. Aynı anda tek araştırma yürür; bitince teknoloji kalıcıdır (bildirim, günlük, ustalık ezgisi).

| Araştırma | Maliyet | İş | Kalıcı etki |
|---|---|---|---|
| Gelişmiş Çarklar ve Vinçler | Odun 160, Taş 80, Demir 90 | 600 | Oduncu / Kereste Atölyesi, Taş Ocağı, Demir Madeni ve Yel Değirmeni **+%20** üretir |
| Mimarlık Loncası | Odun 160, Taş 220, Demir 50 | 700 | Tüm inşaat, yükseltme, onarım ve harika aşamaları **+%35** hızlı; fırtına / kurt hasarı alan yapı sayısı **yarıya** iner |
| Şifalı Bitki Yetiştiriciliği | Odun 80, Yün 60, Ekmek 90 | 500 | Şifacıda tedavi ve iksir hazırlama **iki kat** hızlı; Dinçlik 12 yerine **24 saat** sürer |
| Kışlık Yalıtım Teknikleri | Odun 140, Taş 90, Yün 120 | 550 | Evlerin kışlık odun tüketimi **%25** azalır (Taş Ev yalıtımıyla çarpılır) |

### Okul: çocuklar ve Kalfa mezunlar

- **Ders saati:** 09:00–15:00 arası çocuklar en yakın Bilgelik Evi'ne yürür, içeride ders dinler (günde en çok 2 saat).
  Bilge o sırada içerideyse iki kat öğrenirler.
- **Mezuniyet:** Toplam 6 saat (Bilgeyle 3 saat) ders dinleyen çocuk büyüyünce rastgele bir meslekte doğrudan
  **Kalfa (Sv. 2)** olarak başlar. Bildirim ve günlüğe "okulda öğrendikleriyle doğrudan Kalfa ... olarak başladı" yazar.
- **Paneller:** Bilgelik Evi'nin panelinde o an derste olan çocuklar ve her öğrencinin ilerlemesi ("Ela %60 · Can
  hazır") görünür. Karakter panelinde "Okula gidiyor: %60", "Okulu bitirdi" ve yetişkinlerde "Bilgelik Evi mezunu"
  etiketleri çıkar.

### Nehir ihracatı ve Kasaba Hazinesi

- **Kasaba Hazinesi (Altın):** Yeni bir kaynak. Depo sınırı yoktur. HUD'un Mallar satırında altın simgesiyle görünür;
  açık görünümde toplam sefer ve kazanılan altın yazar. Altın, Harika'nın aşamalarında harcanır.
- **Otomatik fazlalık ihracatı:** Limanın panelinde stok sınırı seçilir: **Kapalı / 250+ / 400+ / 550+** (varsayılan 400).
  Tekne yanaşınca sınırı aşan her kaynak (altın hariç) orantılı olarak yüklenir; teknenin kapasitesi 640 birimdir.
- **İhracat Sandığı Hazırla:** Her kaynaktan en çok 40 birim, stokta en az 100 kalacak şekilde rıhtıma bir sandık
  konur (panelde ne kadarının gideceği görünür). Sıradaki tekne önce sandığı yükler. Sandık rıhtımda beklerken
  panelde içeriği ve altın değeri yazar.
- **Ticaret teknesi:** 06:00–20:00 arası, bir seferi bitince 4 saat sonra nehrin üst ucundan yola çıkar.
  - **Yol:** Nehirde (su ve köprü altları) süzülür. Köprünün altından geçerken görünmez olur, ardında köpüklü iz bırakır.
  - **Rıhtımda:** Limanın önündeki açık suya yanaşır, 1,5 saat yükler. Bu sırada vinç kancadaki sandığı indirip kaldırır.
  - **Dönüş:** Yükünü alıp nehrin alt ucunda kaybolur.
  - **Görünüm:** Krem yelkenli, kırmızı şeritli; kıçında şapkalı dümenci var, yüklüyken güvertede sandık ve çuvallar görünür.
- **Altın değeri:** Birim başına odun 1, taş 1, yiyecek 1, yün 3, ekmek 3, demir 4. Tekne ayrılırken yükün değeri
  hazineye girer. Bildirim gelir ("Ticaret teknesi yüklendi: … → +X altın"), sikke sesi çalar, günlüğe yazılır.
- **Ticaret Bereketi:** Yüklü seferlerin %20'si nadir bir bonus getirir: 1 gün refah +3 ve iş hızı +%10.
- **Panel:** Teknenin durumu (geliyor / rıhtımda yükleniyor / gidiyor / sıradaki teknenin saati), şu an sınırı aşan
  mallar, hazine, toplam sefer ve altın, son seferin yükü görünür.

### Kasaba Harikası: Büyük Vadi Saat Kulesi

> **20. aşamadan beri** bu harika **Ulu Saat Kulesi** adıyla yeniden tasarlandı: Kasaba seviyesinde ve 20 sakinle açılır,
> aşamaları ve maliyetleri değişti, tamamlanınca kalıcı Altın Çağ başlar (bkz. *Kasaba Zaferi ve Altın Çağ*). Aşağıdaki
> tablo 12. aşamanın ilk tasarımıdır; görünüm, ışık, ısıtma ve saat başı çan aynen geçerlidir.

Gelişmiş Şehir olunca inşa menüsünde açılır. İlk şantiye **Temel** aşamasıdır. Sonraki aşamalar yapının panelinden
**Aşamayı Başlat** ile başlatılır (maliyet peşin; iptalde çalışılmadıysa tamamı, yoksa yarısı iade edilir).
İnşaatçılar her aşamayı emekleriyle yükseltir.

| Aşama | Maliyet | İş | Görünüm |
|---|---|---|---|
| 1. Temel | Odun 200, Taş 300, Ekmek 80, Altın 300 | 600 | Geniş kesme taş kaide, basamaklar, kulenin temel çukuru ve altın köşe taşı, köşelerde sütun kaideleri, taş ve kereste yığınları |
| 2. Gövde | Odun 150, Taş 400, Demir 150, Yün 80, Ekmek 120, Altın 800 | 900 | Mazgallı taş salon: demir kuşaklar, kemerli pencereler, yün kilimli flamalar, renkli camlı gül pencere, perçinli kapı; arduvaz başlıklı köşe kuleleri; yarım kule gövdesi |
| 3. Görkemli Kule | Taş 300, Demir 250, Yün 150, Ekmek 150, Altın 1600 | 1200 | Altın çerçeveli saat kadranı, açık kemerli çan odasında bronz çan, altın kubbe ve tepelik; köşe kulelerine altın başlık ve flama |

- **İskele:** Aşama sürerken sıradaki aşama aşağıdan yukarı dört kademede yükselir. Önünde ahşap iskele, kat kalasları
  ve makarayla çekilen taş blok görünür.
- **Altın çağ:** Üçüncü aşama bitince "Altın Çağ: Vadinin İncisi!" kutlama penceresi açılır ve büyük kutlama
  ezgisi çalar. Ardından:
  - kasaba refahına kalıcı **+12** gelir;
  - geceleri çan odası vadiyi aydınlatan bir fener gibi parlar (230 piksel ışık; mangallar ve pencereler de yanar);
  - kulenin ışığındaki (yaklaşık 26 karo) sakinler kışın üşümez;
  - kule 07:00–22:00 arası **saat başı çan çalar**: dört notalı melodi ve saate göre en çok üç derin vuruş.
- **9. hedef "Vadinin İncisi":** Harika'yı üç aşamasıyla tamamla. Hedef panelinde tamamlanan ve sıradaki aşama görünür.

### Denge ve test (simülasyon)

Otopilot (`tools/sim/autopilot.mjs`) 4 haritada (tohum 42, 7, 3 ve kararlara dokunmayan "pasif" 2024) 34 gün oynadı.
Otopilot Bilgelik Evi'nde kaynak yettikçe araştırma seçer. Limanda harika için biriktirirken sınırı 550, sonra
250 tutar. Harika yükselmiyorken mal birikince sandık hazırlar. Şehir olunca harikanın aşamalarını kaynak yettikçe
başlatır. Hiçbir koşuda sayfa hatası olmadı, girişi kopuk üretim yapısı kalmadı.
- **Seviyeler:** Köy 5.–8., Kasaba 9.–10., Gelişmiş Şehir **16.–19.** günde geldi (eşik 28 iken 18.–24.).
- **Bilgelik Evi:** 13.–17. günde kuruldu. Dört araştırmanın hepsi 18.–25. günde bitti (toplam 1340 birim: odun
  540, taş 390, yün 180, demir 140, ekmek 90). Her koşuda 1-3 çocuk okulu bitirip büyüyünce doğrudan Kalfa oldu.
- **Liman ve ihracat:** Liman 18.–21. günde kuruldu. 34. güne kadar 15-28 sefer **6.000-13.600 birim** mal
  götürdü. Hazineye 10.800-23.800 altın girdi. Hazinede kalan altın kasabanın prestij puanı olarak birikir.
- **Harika:** Temel 20.–25. günde atıldı, Görkemli Kule **25.–30.** günde tamamlandı. Dört koşuda da altın çağ ve
  Vadinin İncisi hedefi geldi. Harika toplam 2.330 birim mal ve 2.700 altın yuttu.
- **Geç oyun stokları:** 11. aşamada son günlerde odun, taş ve yiyecek 600-740'lık depo sınırına dayanıp
  kalıyordu. Şimdi son 12 günün ortalaması 390-550, deponun dolduğu gün sayısı 12 günde 0-2.
  - İlk ayarda tekne 320 birim taşıyor ve 9 saatte bir geliyordu; depo 12 günün 5-9'unda doluydu.
  - Ayar 640 birim, 4 saat aralık ve biraz daha hızlı tekne yapıldı.
- **Otopilot dersleri:** Tek demir madeni zanaatkârın aletlerine yetişip harikanın 400 demirini karşılayamadı.
  Tek fırın da ekmeği harikanın 350 ekmeğine yetiştiremedi. Otopilot bunun için ikinci bir demir madeni ve
  değirmen kurar; oyuncu da panelde "Yetersiz demir" görünce aynısını yapar.
- **Önceki aşamalar:**
  - 0-11 kişi üşüttü, hepsi şifacıda iyileşti. 34 günde 10-11 karar verildi, 6-7 ferman ilan edildi.
  - En düşük ortalama refah %68-73'tü.
- **Hedefli testler (`tools/sim/tests.mjs`, 100):** Önceki aşamaların 51 testine 49 test eklendi:
  - Gelişmiş Şehir eşiğinin 25 olduğu ve karar seçeneklerinin (`ok`, `reason`, varsayılan, başlık) GameState'te
    durduğu.
  - Kadim Tılsım şans sayacı: sıfırdan üç seferde (en geç 3.'sünde) tılsım çıkar; sayaç 2 iken sefer tılsımı kesin
    bulur ve sayaç sıfırlanır; tılsımsız sefer sayacı artırır.
  - Bilgelik Evi: Köy kilidi, Bilgelik Evi olmadan araştırma yapılamaması, maliyetin ödenmesi, aynı anda tek
    araştırma, Bilge'nin gerçekten çalışıp ilerletmesi.
  - Dört araştırmanın etkileri; yalıtımlı evlerin gerçekten %25 az odun yakması; Dinçlik'in 24 saat sürmesi.
  - Okul: çocuğun ders saatinde okula gitmesi, günlük ders sınırı, mezunun Kalfa olması, az okuyanın olmaması.
  - Liman: Kasaba kilidi, karada kurulamaması, tek liman, hazinenin depo sınırına takılmaması, sandığın stokta 100
    bırakması, sınır ayarı ve kapatma.
  - Tekne seferi: geliş → yanaşma → yükleme sırası, fazlalık ve sandığın yüklenmesi, altının hazineye girmesi,
    kapasite, teknenin nehrin öteki ucunda kaybolması.
  - Harika: Şehir kilidi, şantiyesinin iptal edilebilmesi, bitmiş harikanın yıkılamaması, aşama maliyeti,
    inşaatçıların aşamayı yükseltmesi, üç aşama, altın çağ, 9. hedef, refah +12, tek harika.
  - Sürüm 10 kaydının gidiş-dönüşü: araştırmalar, liman ve hazine, harika aşaması, okul mezunu.
- **Uyumluluk (`tools/sim/compat.mjs`, 21):** 9., 10. ve 11. aşamanın kayıtları (sürüm 7, 8 ve 9) açıldı ve bir
  gün sorunsuz yaşadı.
  - Sürüm 9 kaydı (33. gün, 30 sakin, şehir) fermanlarını korudu.
  - Hepsinde araştırma, liman ve hazine boş başladı.

**Önizleme:** `/tools/art-preview.html` sayfasının başında 12. aşamanın çizimleri var:
- Bilgelik Evi (flama kareleri, Bilge çalışırken dürbün, gece, kış, şantiye);
- liman (iki yön, vinç kareleri, gece, kış, kazık çakılan şantiye);
- ticaret teknesi (boş / yüklü, iki kare, iki yön);
- harikanın üç aşaması gündüz ve gece, kış, iskeleli dört yükselme kademesi;
- yeni simgeler (kitap, dişli, tekne, harika).

`node tools/sim/showcase.mjs` oyun içinde şunları çeker:
- rıhtıma yanaşmış tekneyi, Bilgelik Evi'ni ve harikayı;
- üç yapının bilgi panellerini;
- geceleri vadiyi aydınlatan saat kulesini.

## Altın ekonomisi, peyzaj, mikro-yönetim, Kasaba Arşivi ve fotoğraf modu (13. aşama)

Harika bittikten sonra hazinede binlerce altın birikiyordu. Artık bu altının sürekli harcanabileceği yerler var:
lüks ve egzotik mallar, Belediye Konağı'nda sergilenen beş kasaba yadigârı ve altın fermanları. Kasabayı süslemek
için dört peyzaj yapısı geldi. Oyuncu sakinlerine ad verebilir ve onları istediği iş yerine sabitleyebilir. Kasabanın
geçmişi grafiklerle izlenebilir, kasaba arayüzsüz bir tablo gibi seyredilebilir.

### Lüks ve egzotik mallar

Yalnızca **altınla** alınır. Gezgin tüccar tezgâhtayken takas penceresinin **Lüks Mallar (Altın)** sekmesinden, ya da
Büyük Ticaret Limanı kuruluysa limanın panelinden (limandan sipariş) her zaman alınabilir.

| Mal | Fiyat | Etki |
|---|---|---|
| Baharat ve Kahve Sandığı | 400 altın | Hana teslim edilir (önce bir Kasaba Hanı gerekir). 4 gün boyunca handa yemek yiyen herkes 10 saat **%25 hızlı çalışır ve yürür**. Tekrar alınırsa süre uzar. |
| İpek Kumaş ve Mermer Sütunlar | 600 altın (bir kez) | Kalıcı prestij: her Seviye 2 yapı refaha **+0,5** (en çok +8). Hemen: herkesin keyfi +25 ve Şenlik Coşkusu. |

### Kasaba yadigârları

Beş eşsiz eser, tüccardan ya da limandan alınır ve **Belediye Konağı'nda sergilenir** (önce konak gerekir). Fiyat
sergilenen yadigâr sayısıyla artar: **1.500 → 3.000 → 5.000 → 7.000 → 9.000** altın.
- **Görünüm:** Alınan yadigâr konağın basamaklarının iki yanındaki taş kaidelerde durur. Ebedi Ateş Kandili gelince
  basamak fenerleri gece gündüz turkuaz yanar.
- **Panel:** Konağın panelindeki **Kasaba Yadigârları** rafında beş yuva görünür; alınmamışlar soluk durur.

| Yadigâr | Kalıcı etki |
|---|---|
| Güneş Saati Küresi | Tüm üretim ve işleme yapılarında verim +%10 |
| Bereket Boynuzu | Yiyecek üreten yapılar (bahçe, ağıl, iskele) +%25 |
| Usta Lonca Mührü | Meslek deneyimi kazanma +%30 |
| Denizci Pusulası | Ticaret teknesi %50 fazla yük alır, ihracatın altın değeri +%20 |
| Ebedi Ateş Kandili | Evler kışın %30 az odun yakar, dışarıdakiler yarı yarıya az üşür |

### Altın fermanları

Belediye Konağı'nın panelindeki **Altın Fermanları** bölümünden ilan edilir. Her biri 4 günde bir ilan edilebilir.

| Ferman | Fiyat | Etki |
|---|---|---|
| Ustalara Altın İkramiye | 1.000 altın | Herkesin keyfi +15. 3 gün boyunca iş hızı +%20, keyif yavaş düşer, refah +5 |
| Kraliyet Mimarları | 1.500 altın | 2 gün boyunca bütün şantiyeler, yükseltmeler, onarımlar ve harika aşamaları **3 kat** hızlı |

Etkin bonuslar HUD'daki bonus satırında kalan süreleriyle görünür. Her alım bildirim, ses ve günlük kaydı bırakır.

### Peyzaj ve süsleme

| Yapı | Boyut | Maliyet | Ne yapar? |
|---|---|---|---|
| Kiraz Çiçeği Ağacı | 1x1 | Odun 12, Yiyecek 6, Altın 15 | İlkbaharda pembe-beyaz çiçek bulutu, yazın yeşil yapraklar arasında pembe çiçekler, sonbaharda altın-kehribar, kışın karlı dallarda pembe tomurcuklar. Rüzgârda yaprakları savrulur (kışın dökülmez). Yanından geçenin keyfi biraz dolar. |
| Ahşap Çardak | 2x2 | Odun 45, Taş 10, Altın 60 | Sarmaşıklı, çiçek saçaklı kameriye; içinde iki kişilik bank. Sakinler önünden girip banka oturur, çatının altında sohbet eder. Burada arkadaşlık **%60 hızlı** gelişir, bekârlar **2,5 kat** daha kolay aşık olur, çiftler daha kolay evlenir. Sevgilisi / eşi olan sakin sohbete çağırınca çardağı seçer, dostlar da arada bir orada buluşur. |
| Mermer Kemer | 1x1 | Taş 20, Altın 30 | Sarmaşıklı beyaz mermer kemer. Yolların (toprak, taş, meydan) ve bahçe girişlerinin üstüne kurulur. Altındaki yol olduğu gibi kalır, sakinler altından geçer, yolu kapatmaz. |
| Çiçekli Çit | 1x1 | Odun 5 | Beyaz kazıklı, saksı çiçekli alçak çit. Yan yana (ve alt alta) kurulan çitler birleşir. |

### Sakin adı ve işçi atama

- **Ad değiştirme:** Karakter panelinde sakinin adına tıklanır, yeni ad yazılıp Enter'a basılır (en çok 16 harf).
  - Boş ad ya da başka bir sakinin adı kabul edilmez.
  - Günlüğe "X artık Y adıyla anılıyor" yazılır.
  - Ad bütün panellerde, ilişkilerde ve durum metinlerinde hemen değişir.
- **İşçi atama / sabitleme:** Her iş yerinin panelinde **İşçi Ata** düğmesi vardır.
  - **Liste:** Yetişkin sakinler bu işteki ustalıklarına göre (Usta → Kalfa → Çırak) listelenir; başka yere sabitliyse
    o da yazar. Birine tıklamak onu sabitler. Çalışan satırlarında da **Sabitle** / **Sabitlemeyi Kaldır** düğmeleri var.
  - **Sabit sakin:** Mesaide yalnızca kendi iş yerinde çalışır, şantiyelere ya da başka işlere kaymaz, orada ustalaşır.
    Elindeki başka işi bırakıp gelir; yapı sabit olmayan çalışanlarla doluysa biri ona yer açar. Yapı boştaysa ya
    da hasarlıysa dinlenir.
  - **Yuvalar:** Sabit çalışanın yuvası başkasına verilmez. Yuva sayısından fazla sakin sabitlenemez. Yapı yıkılınca
    ya da sakin oradan işten çıkarılınca sabitleme kalkar.
  - **Karakter paneli:** "Sabit iş yeri: …" etiketi görünür.

### Kasaba Arşivi (`I`)

Dock'taki **Arşiv** düğmesi (ya da `I`) ekranın ortasında bir pencere açar:
- **Grafikler:** Son 32 günün dört piksel grafiği: Nüfus, Ortalama Refah, Stok Toplamı ve Kasaba Hazinesi.
  - Her grafikte bugünkü değer, dönemdeki artış / azalış (▲ / ▼) ve en düşük / en yüksek değer yazar.
  - Grafiğin son noktası her zaman bugünün anlık değeridir.
- **Kasabanın tarihi:** Fırından çıkan ekmek, kırkılan yün, çıkarılan demir, pişen sıcak yemek, kıyılan düğün, doğan
  çocuk, atlatılan kış, tamamlanan yapı, takas, ihracat seferi ve kazanılan altın, lüks mallara harcanan altın,
  sergilenen yadigâr, araştırma, şifacıda iyileşen ve verilen karar sayısı.
- **Veri:** Arşiv her sabah bir özet yazar ve en çok 64 gün saklar; kayda girer.

### Fotoğraf / sinematik mod (`F`)

`F` ya da dock'taki **Fotoğraf** düğmesi bütün arayüzü yumuşakça gizler. Sağ altta küçük bir "Arayüzü Göster (F)"
ipucu kalır.
- **Kontroller:** Kamera (WASD, sürükleme, tekerlek) ve zaman tuşları çalışır.
- **Görüntü:** Haritada imleç, seçim halkası, iş işaretleri ve araç önizlemesi çizilmez. Yağan kar, yanan fenerler ve
  gezinen sakinler bir tablo gibi seyredilir.
- **Çıkış:** `F`, `Esc` ya da ipucu arayüzü geri getirir. Karar penceresi ya da kutlama açılırsa mod kendiliğinden
  biter, böylece önemli bir an kaçmaz.

### Denge ve test (simülasyon)

Otopilot 4 haritada (tohum 42, 7, 3 ve kararlara dokunmayan "pasif" 2024) **40 gün** oynadı.
- **Otopilotun harcama düzeni:** Harika bitene kadar altını biriktirir. Bittikten sonra hazineyi şu sırayla harcar:
  - kaynak yettikçe sıradaki yadigâr (fiyatın 300 altın fazlası varsa);
  - bir kez ipek ve mermer;
  - handa baharat bitince yeni sandık;
  - 4 günde bir altın ikramiye;
  - iki şantiye birden sürerken kraliyet mimarları.

  Planın sonunda iki kiraz ağacı, bir çardak, yolun üstüne bir mermer kemer ve iki çiçekli çit kurar.
- **Hata yok:** Hiçbir koşuda sayfa hatası olmadı, girişi kopuk üretim yapısı kalmadı.
- **Önceki aşamalar:**
  - Köy 7.–8., Kasaba 9.–11., Gelişmiş Şehir 15.–18. günde geldi.
  - Dört araştırma bitti. Harika 27.–32. günde tamamlandı.
- **Altın harcaması:**
  - Harika bittikten sonraki 5-13 günde **12.900-30.700 altın** harcandı: 3-5 yadigâr (9.500-25.500), lüks mallar
    (1.400-2.200), altın fermanları (2.000-3.000).
  - 12. aşamada harika sonrası hazine 8.000-21.000 altına birikip kalıyordu. Şimdi son günlerde 4.000-8.000
    altında dolanıyor: ihracat getirir, yadigâr ve fermanlar götürür.
  - Bir haritada (tohum 3) beş yadigârın hepsi 40. günden önce sergilendi.
- **İhracat:** 29-39 sefer 12.100-22.000 birim mal götürdü, 20.900-39.400 altın getirdi. Denizci Pusulası'ndan sonra
  tekne seferde 1.800-2.000 altın getiriyor.
- **Stoklar:** Son 12 günün ortalama odun / taş / yiyecek stoğu 545-630.
  - 12. aşamanın 34 günlük koşularında bu band 390-550 idi.
  - Artışın kaynağı yadigârların (+%10 üretim, +%25 yiyecek) ve altın ikramiyenin üretimi artırmasıdır.
  - Yine de deponun 740 sınırına dayandığı gün 12 günde 0-3; tekne fazlayı götürmeye devam ediyor.
- **Diğer:** 3-7 kişi üşüttü, hepsi iyileşti. 11-13 karar verildi, 8 ferman ilan edildi. En düşük ortalama refah
  %69-71'di.
- **Hedefli testler (`tools/sim/tests.mjs`, 147):** Önceki aşamaların 100 testine 47 test eklendi:
  - Lüks mallar: satıcı ve altın koşulu, baharat sandığının limandan alınıp hana teslimi, handa yiyen sakinin %25
    hızlanması, ipek ve mermerin kalıcı prestiji ve tek seferliği.
  - Yadigârlar:
    - fiyatların 1.500 → 9.000 artışı, tüccar yokken alınamama, aynı yadigârın iki kez alınamaması;
    - beş etkinin hepsi (Ebedi Ateş'in gerçekten %30 az odun yakması, Güneş Saati Küresi'nin taş ocağında gerçekten
      %10 fazla üretmesi dahil).
  - Altın fermanları: ikramiye, bekleme süresi, Kraliyet Mimarları'nda aynı inşaatçının gerçekten 3 kat ilerletmesi.
  - Peyzaj:
    - Mermer kemer: yolun üstüne kurulur, yol karosu kalır, altından geçilir, yol bulma içinden geçer, üstüne yapı
      kurulamaz.
    - Çitlerin birleşmesi, kirazın dört mevsimi.
    - Çardak: iki oturak; iki sakin gerçekten oturup sohbet eder, arkadaşlıkları gelişir.
  - Sakin adı: değiştirme, boş ya da başkasının adını reddetme, 16 harf sınırı.
  - İşçi sabitleme:
    - yalnızca kendi iş yerine gitme, yuvanın başkasına verilmemesi, yuva sınırı;
    - mesaide gerçekten oraya gitme, sabitlemeyi kaldırma.
  - Arşiv: günlük özet, düğün / doğum sayaçları, 64 gün sınırı, pencerenin 4 grafikle açılması.
  - Fotoğraf modu: açılır, kapanır, karar penceresinde kendiliğinden biter.
  - Sürüm 11 kaydının gidiş-dönüşü: yadigârlar, ipek, fermanlar, arşiv, sakin adı, sabit işçi, kemerin yürünebilirliği.
- **Uyumluluk (`tools/sim/compat.mjs`, 32):** Sürüm 7, 8, 9 ve 10 kayıtları açılıp bir gün yaşadı.
  - 12. aşamanın sürüm 10 kaydı (31. gün, şehir, harika ve dört araştırma) araştırmalarını, hazinesini ve harikasını
    korudu.
  - Hepsinde yadigâr ve sabit işçi boş başladı, arşiv kuruldu, düğün sayacı evli çiftlerden doğru tahmin edildi.

**Önizleme:** `/tools/art-preview.html` sayfasının başında 13. aşamanın çizimleri var:
- kiraz ağacının dört mevsimi;
- çardağın tam görünümü, iki katmanı ve kışı;
- mermer kemer ve çitin bütün birleşme biçimleri;
- yadigârlarıyla Belediye Konağı (Ebedi Ateş ve gece dahil);
- yeni simgeler.

`node tools/sim/showcase.mjs` oyun içinde şunları çeker:
- kirazlarla çevrili, içinde oturan sakinli çardağı;
- yadigârları sergileyen konağı;
- konağın ve limanın altın bölümlerini;
- Kasaba Arşivi penceresini ve fotoğraf modunu.

## Anılar, mevsim festivalleri, dünyayla etkileşim ve nadir hava olayları (14. aşama)

Kasaba artık yaşadıklarını hatırlıyor: her sakinin kendi anı defteri var. Her mevsimin son günü büyük bir festival
kutlanıyor. Oyuncu hayvanları sevebiliyor, öncelikli hedef gösterebiliyor ve zil çalıp herkesi meydana toplayabiliyor.
Gökyüzü de iki nadir olayla zenginleşti: sabah sisi ve yaz fırtınası.

### Rötuş: stok dengesi

- **Tekne kapasitesi:** Yadigârlarla artan üretim stokları yükseltmişti. Ticaret teknesinin taban kapasitesi %35
  arttı: 640 → **864** birim.
- **Büyük İhracat Seferi:** Limanın panelinde yeni bir ferman var (250 altın, 2 günde bir).
  - Kervan teknesi saati beklemeden, gece bile, hemen yola çıkar. Nehirde henüz yük almamış bir tekne varsa o
    kervana dönüşür.
  - Normalin **2,5 katı** yük alır ve sınırı **350**'ye indirerek fazlalığı boşaltır. Yükün altın değeri %10 fazladır.
  - Yelkeninde altın şerit ve arma vardır. Panelde ve günlükte "Kervan teknesi" olarak görünür.

### Anılar ve Hatıralar

Her sakinin hayat yolculuğu kendi **anı defterinde** saklanır: en çok 40 anı, ilk anı hep kalır. Aynı anı iki kez
yazılmaz. Defter dolunca önce küçük anılar (dostluklar, kasaba olayları, festivaller) silinir; aşk, düğün, çocuk ve
unvanlar kalır.

- **Yazılan anılar:**
  - Kasabaya göçmen olarak katılma; yeni oyunun ilk sakinleri için "Kasabanın ilk sakinlerinden biri oldu".
  - Dost ve en iyi arkadaş olma; barışma.
  - Aşık olma: "Çardakta Nilay ile birbirlerine aşık oldular" (handa, meydanda, ateş başında, şenlikte).
  - Düğün ("Nilay ile şenlikte evlendi"); çocuğun doğumu (anne babaya ve çocuğa); büyüme.
  - Okulu bitirip Kalfa olma; Kalfa ve Usta unvanları ("Usta Taşçı unvanını kazandı").
  - Hastalanıp iyileşme: "Kış günlerinde hastalandı ama Şifacı'nın iksiriyle iyileşti"; fırtınada "Fırtınalı günlerde".
  - Keşif seferinden dönüş (Kadim Tılsım'la); kasabanın kedisi ya da köpeğiyle can dostu olma.
  - Mevsim festivalleri, Saat Kulesi'nin tamamlanışı, kasabanın seviye atlaması, yeni ad.
- **Nostalji:** Sakin çardakta, bankta, nehir kenarında, çiçeklerin, ateşin, anıtın ya da kadim çeşmenin başında
  otururken (dakikada %0,4) ya da sabah uyanınca (%15) güzel bir anısını hatırlar.
  - Önemli anılar (aşk, düğün, çocuk, festival, dostluk) üç kat sık hatırlanır.
  - Başında çerçeveli anı balonu çıkar; keyfi +8, sosyalliği +3 artar. İki hatırlama arası en az 6 saattir.
- **Karakter Paneli:** Yeni **Anılar ve Hatıralar** bölümü.
  - En yeni 5 anı listelenir; **Tümünü Göster** hepsini açar.
  - Hatırlanan anı vurgulanır. Durum satırında "Anılara daldı: "…"" etiketi çıkar.

### Dört mevsimin büyük festivalleri

Her mevsimin son günü (4., 8., 12., 16. gün döngüsü) kutlanır:
- **Akış:** Sabah 08:00'de duyurulur (bildirim, günlük, HUD'da yanıp sönen festival etiketi). 15:00'te başlar ve
  gece yarısına kadar sürer. Sakinler festival yerinde toplanıp dans eder; festival boyunca temaya özgü ezgi çalar.
- **Varış:** Sakin festivale ilk vardığında bir kez ziyafet, elma şırası ya da keyif alır.
- **Kapanış:** Gece yarısı katılanların anısına yazılır. Bütün kasaba keyif +35 ve 24 saatlik **Mevsim Coşkusu**
  ile yeni mevsime başlar (iş hızı +%15, refah +6, keyif yavaş düşer).
- **Süslemeler:** Festival yerinin çevresindeki boş karolara kurulur, yol kapatmaz; festival bitince kaldırılır.

| Festival | Yer | Süslemeler ve görünüm | Etki |
|---|---|---|---|
| İlkbahar: Çiçek Şenliği | Meydan havuzu | İki çiçek kemeri, çiçek sepetleri, süzülen çiçek yaprakları; **herkes saçına çiçek takar** | Arkadaşlık 1,8 kat, aşk 2,5 kat ("aşk ve dostluk patlaması"); varışta keyif ve sosyallik |
| Yaz: Güneş ve Nehir Panayırı | Büyük Ticaret Limanı (yoksa iskele, yoksa meydan) | Nehir kıyısında rengârenk üçgen flamalar, flama direkleri, ziyafet sofraları (karpuz, ekmek, balık) | Varışta tokluk +30; arkadaşlık 1,4 kat, refah +4 |
| Sonbahar: Büyük Hasat Bayramı | Meydan havuzu | Dev hasat sepeti, kabaklar, elma şırası fıçıları, dökülen sonbahar yaprakları | Varışta keyif +20 ve elma şırası; refah +5 |
| Kış: Işıklar Gecesi ve Kardan Adam Şöleni | Kamp ateşi | Sakinlerin el birliğiyle yaptığı kardan adam üç kademede yükselir; kamp ateşi şölen ateşine dönüşür (geniş ışık, büyük alevler); bütün sokak fenerleri parıldar, kıvılcımlar | Festivaldekiler üşümez; refah +6 |

### Oyuncunun dünyayla doğrudan etkileşimi

- **Hayvan sevme:** Haritadaki bir kediye ya da köpeğe sol tıklanınca hayvan sevinçle iki kez zıplar, başında üç kalp
  uçuşur, kedi miyavlar, köpek havlar; uyuyorsa uyanır. Fare üstüne gelince işaretçi el olur.
- **Öncelikli kesme / kırma:** Seç aracıyla bir ağaca ya da kayaya tıklanınca orası öncelikli hedef olur.
  - Emir yoksa verilir; simgesinin yanında yanıp sönen kırmızı ünlem çıkar.
  - Öncelikli hedef bütün işlerden (şantiyeler dahil) önce seçilir.
  - Boştaki (dinlenen, gezen, sohbet eden) en yakın ve en usta işçiler elindekini bırakıp oraya koşar.
- **Toplanma Zili:** Meydan havuzunun ya da Belediye Konağı'nın panelinde **Zili Çal**.
  - Kasaba çanı üç kez çalar. Uyanık bütün sakinler elindekini bırakıp 1 oyun saatliğine meydanda toplanır, havuza
    dönüp birbirleriyle sohbet eder; uyuyanlar uyanmaz.
  - HUD'da "Meydanda toplanma" etiketi görünür. Zil 3 saatte bir çalınabilir.

### Nadir hava olayları

Ayrıntılar *Hava durumu ve atmosfer* bölümünün tablosunda.
- **Sabah sisi:** İlkbahar ve sonbahar sabahları çöker.
- **Gök gürültülü fırtına:** Yaz öğleden sonraları kısa sürer. Şimşek aralığı oyun zamanına bağlıdır; böylece hangi
  hızda oynanırsa oynansın fırtına başına birkaç şimşek çakar.

### Denge ve test (simülasyon)

Otopilot 4 haritada (tohum 42, 7, 3 ve kararlara dokunmayan "pasif" 2024) **40 gün** oynadı.
- **Otopilotun ihracat düzeni:** Harika bittikten sonra limanın sınırını oyunun varsayılanı 400'de tutar. Stok
  400'ün toplamda 900 birimden fazla üstüne çıkınca Büyük İhracat Seferi ilan eder.
- **Hata yok:** Hiçbir koşuda sayfa hatası olmadı, girişi kopuk üretim yapısı kalmadı. Gelişmiş Şehir 15.–16.,
  harika 28.–30. günde geldi.
- **Mevsim festivalleri:**
  - Her koşuda 9-10 festival kutlandı ve dördünün de her biri en az iki kez geldi: ilkbahar 3, yaz 2-3, sonbahar 2,
    kış 2.
  - Katılım: Çiçek Şenliği 10-22, Panayır 15-22, Hasat Bayramı 19-25, Işıklar Gecesi 8-10 sakin. Kış festivali
    akşamüstü soğukta uyuyanlar yüzünden daha sakin geçiyor.
- **Anılar:** Sakin başına ortalama 35 anı birikti (en az 20, en çok 40). Sakinler 40 günde 440-560 kez güzel bir
  anılarını hatırladı.
  - Örnek bir sakinin son anıları: "Çiçek Şenliği'nde saçına çiçek takıp dans etti", "Kalfa Taşçı oldu", "Güneş ve
    Nehir Panayırı'nda nehir kıyısında ziyafet çekti", "Kasabanın kedisi Pamuk ile can dostu oldu".
  - İlk ayarda 30 kişilik kasabada defter dostluk anılarıyla doluyordu. Bu yüzden "dost oldu" anısı en çok 4 kez
    yazılır, en iyi arkadaşlık eski dostluk anısının yerini alır, defter dolunca önce küçük anılar silinir.
- **Stoklar (rötuşun hedefi 390-500):** Son 12 günün ortalama odun / taş / yiyecek stoğu:
  - tohum 42: 380-434 (iki koşuda);
  - tohum 7: 398-408;
  - tohum 3: 381-386;
  - pasif koşu: 467-544 (yiyecek en yüksekte).

  13. aşamada bu band 545-630 idi. Deponun dolduğu gün 12 günde 0-1. Her koşuda 4-6 Büyük İhracat Seferi ilan edildi.
  - İlk denemede otopilot harika sonrası sınırı 250'de tutuyordu ve sefer sınırı da 250'ydi. Stoklar 200-370'e,
    hedefin altına indi.
  - Seferin sınırı 350'ye, otopilotun sınırı 400'e çekildi.
- **Altın:** Harika sonrası yadigâr, lüks mal ve fermanlara 21.500-31.800 altın harcandı. Seferler yüzünden hazine
  biraz daha bol: son günlerde 5.000-12.600 altın.
- **Nadir hava:** 40 günde 2-9 sabah sisi ve 1-5 yaz fırtınası görüldü.
- **Ad havuzu:** Kalabalık kasabalarda ad havuzu tükenince çocuklar artık "Arda 30" gibi sayılı adlar değil, "Defne
  Su" gibi iki parçalı adlar alıyor.
- **Hedefli testler (`tools/sim/tests.mjs`, 190):** Önceki aşamaların 147 testine 43 test eklendi:
  - Tekne kapasitesi 864. Büyük İhracat Seferi: altın koşulu, hemen yola çıkma, bekleme süresi; gerçek bir seferde
    kervanın normal kapasiteden fazla, 2,5 katından az yük alması ve %10 değer.
  - Sis: yoğunluk ve süre. Yaz fırtınasının yalnızca yazın ve ara sıra çıkması (kışın hiç). Fırtınada gerçekten şimşek
    çakması ve gök gürültüsü olayı.
  - Dört festivalin her biri:
    - festival günleri; sabah duyurusu;
    - doğru yer (yazın liman) ve süslemeler;
    - sakinlerin katılması; Çiçek Şenliği'nde herkesin saçında çiçek, aşk 2,5 ve dostluk 1,8 kat;
    - Işıklar Gecesi'nde şölen ateşinin ısıtması ve kardan adam;
    - bitiş, anılara yazılma, Mevsim Coşkusu, taçların ve süslemelerin kaldırılması.
  - Anılar: düğün iki sakine de yazılır; Usta unvanı ve hastalıktan iyileşme anıları; 40 sınırı ve ilk anının
    korunması; aynı anının yinelenmemesi ve önce küçük anıların silinmesi; dostluk sınırı.
  - Nostalji: bankta otururken anıyı hatırlama, keyif kazancı, bekleme süresi. Karakter Paneli'nde 5 anı ve "Tümünü
    Göster".
  - Gerçek fare tıklamaları:
    - kediye tıklayınca sevinçle zıplaması;
    - ağaca tıklayınca öncelikli kesim emri, emrin bütün işlerden önce seçilmesi, boştaki işçinin elindekini bırakması.
  - Toplanma Zili: çalma, bir saatlik süre, uyanık sakinlerin en az %60'ının meydanda toplanması, bekleme süresi, bitiş.
  - Sürüm 12 kaydının gidiş-dönüşü: anılar, festival geçmişi, kervan seferi, sayaçlar.
- **Uyumluluk (`tools/sim/compat.mjs`, 45):** Sürüm 7, 8, 9, 10 ve 11 kayıtları açılıp bir gün yaşadı.
  - 13. aşamanın sürüm 11 kaydı (37. gün, üç yadigâr) yadigârlarını ve arşivini korudu.
  - Hepsinde her sakine anı defteri açıldı; festival ve hava geçerli başladı.

**Önizleme:** `/tools/art-preview.html` sayfasının başında 14. aşamanın çizimleri var:
- festival süslemelerinin hepsi, kardan adamın üç kademesi ve saç çiçekleri;
- altın şeritli kervan teknesi;
- dört festival, zil, sis ve fırtına simgeleri, anı balonu.

`node tools/sim/showcase.mjs` oyun içinde şunları çeker:
- dört festivali (Işıklar Gecesi'nde kardan adam ve şölen ateşi, Panayır'da limanın flamaları);
- sabah sisini, Toplanma Zili'ni ve şimşek anını;
- bir sakinin anılar panelini.

## Genişletilmiş keşif: maceracı seferleri, mini maceralar ve harabe sırları (16. aşama)

### Keşif seferleri ve "Maceracı Günlüğü"
Keşif seferi artık arka planda işleyen bir sayaç değil (`systems/ExpeditionSystem.js`, `data/exploration.js`):

- **Yola çıkış:** Büyük Ticaret Limanı'nın ya da Belediye Konağı'nın panelinde **Sefere Çıkar** (30 yiyecek; iki sefer
  arasında en az 2 gün). Kafile 3 kişidir: maceralarda işe yarayacak ustalar (madenci, taşçı, bilge, oduncu, şifacı...) ve
  Sağlam Aletliler önce seçilir, sabit işçiler kasabada kalır. "Kayıp Hazine Haritası" kararının seferi de aynı yoldan geçer.
- **Mini maceralar:** Yolculuğun %30'unda (büyük seferde %65'inde de) karar penceresi "Maceracı Günlüğü" olarak açılır
  (oyun durur; 30 saniyede seçilmezse güvenli kamp):

| Macera | Riskli yol | Güvenli yol | Kamp |
|---|---|---|---|
| Keşif Kafilesi Dağ Geçidinde | Maden girişi: bol demir, Kadim Yadigâr Parçası, yazıt (%35 kaza) | Dik patika: Egzotik Üzüm Fidesi, şifalı ot (%12) | standart erzak |
| Azgın Dere | Sal: Kayıp Şehir Haritası (%30 üşüme) | Sığ geçit: balık, yaban meyvesi (%10) | standart erzak |
| Sarmaşıklı Tapınak | İçeri gir: Kadim Meşale, yazıt (%30 tuzak) | Avlu: egzotik fideler, şifalı ot (%8) | standart erzak |
| Yıldızlı Gecede Işıklar | Işıkları izle: harita ya da meşale (%28) | — | masal: kafile dinç döner |

- **Meslek ve ekipman:** Pencerede her seçeneğin bu kafileyle riski yazar. **Sağlam Aletli Usta Madenci** (ya da Usta Taşçı)
  maden kazasını, **Usta Oduncu / Yapı Ustası** salın devrilmesini, **Usta Bilge** tapınak tuzaklarını ve gecede yolunu
  kaybetmeyi **sıfırlar**; Kalfa Madenci, Kalfa Şifacı, Kalfa Balıkçı gibileri riski azaltır. Kazada bir sakin yaralanır ya
  da üşür (dönünce hasta yatar), o maceranın ganimeti yarıya iner, bulgu gelmez.
- **Seferin adı:** seçilen yol seferin adını verir: "Karanlık Maden Seferi", "Kayıp Tapınak Seferi", "Azgın Dere Seferi"...

### Egzotik ganimetler
| Ganimet | Ne yapar? |
|---|---|
| Egzotik Üzüm Fidesi | İnşa menüsünde **Üzüm Asması** olarak Sebze Bahçesi ya da Ahşap Çardak kenarına dikilir: yanındaki bahçe +%10 verim (en çok iki asma), handa yemek yiyenler soğuk üzüm şerbeti içer (keyif +5), çevresine keyif aurası; dört mevsim ayrı çizilir |
| Kadim Meşale | 18:00–06:00 mavi alevle yanan mistik sokak ışığı: çevresindekilerin içini ısıtır (kışın üşütmez), keyif aurası |
| Kayıp Şehir Haritası | Gezgin tüccar kasabanın yolunu iki kat sık bulur (ikinci harita yadigâr parçasına döner) |
| Kadim Yadigâr Parçası | Üç parça birleşince kalıcı +2 refah |

Fide ve meşale sökülünce sandığa geri döner; inşa menüsü eldeki sayıyı gösterir.

### Kadim harabe sırları ve imar şemaları
Kadim harabe onarılınca içinden o harabenin **kadim yazıtı** çıkar (seferlerden de gelebilir). Yazıt, Bilgelik Evi'nin
panelinde **Çöz** ile Bilge'ye verilir; Bilge araştırma yokken yazıtın başına oturur. Çözülen yazıt kalıcı bir **imar şeması**
kazandırır:

| Harabe | Yazıt | Kalıcı etki |
|---|---|---|
| Kadim Çeşme | Antik Su Kemeri Şeması | Sebze bahçelerinin verimi +%15 |
| Gözetleme Kulesi | Kadim Çelik Döküm Tekniği | Zanaat Atölyesi demiri %20 daha az tüketir |
| Erzak Kampı | Kadim Değirmen Taşı | Yel Değirmeni ve Fırın %15 daha hızlı ekmek çıkarır |

### Maceracı anıları ve hikâyeler
Dönen her maceracının anısına seferin hikâyesi yazılır ("Karanlık Maden Seferi'nden sağ salim döndü ve Kadim Yazıt'ı
keşfetti"); kazaya uğrayanın anısına o an da yazılır. Dönenler iki gün boyunca akşamları hana (yoksa ateş başına / meydana)
koşar ve maceralarını anlatır: başlarında dağ ya da hazine balonu çıkar, dinleyenlerin keyfi +8, anlatanın +5 artar
(her maceracı üç kez anlatır). Liman ve Belediye Konağı panelleri yoldaki kafileyi, maceralarını ve ganimet sandığını
gösterir; Kasaba Arşivi'nde sefer, macera, hikâye ve çözülen yazıt sayaçları vardır.

### Denge ve test (simülasyon)
- **Stres matrisi** (6 tohum x 1x / 2x / 4x x 50 gün = 18 koşu): takılma 0, kopuk referans 0 (seferde kaybolan ya da dönüşü
  geciken kafile dahil), taşan ev 0, bekleyen iş 0, üretmeyen iş yeri 0, sayfa hatası 0, kıyafet hatası 0. Otopilot 328 sefer
  düzenledi (318'i döndü; kalan 10 kafile koşu bittiğinde yoldaydı), 648 macera yaşandı ve yalnızca 24'ünde kaza oldu
  (otopilot riski %15'i aşan yola girmez; usta ve aletle sıfırlanan riskli yolları seçer). Handa 1948 hikâye anlatıldı,
  her koşuda üç yazıt da çözüldü (54), 103 asma ve meşale dikildi.
- **Hedefli testler** (`tests.mjs`, 259): risk kuralları (taban, Sağlam Aletli Usta Madenci sıfırlar, aletsiz usta yarıya
  indirir, Kalfa Şifacı patikayı güvenli kılar), sefer düzenleme ve maliyet, ikinci seferin engellenmesi, macera
  penceresinin açılması ve oyunu durdurması, kafile ve risk metni, usta kafilede iken kazasız riskli yol ve seferin adı,
  zorlanan kaza (yaralanma, yarım ganimet), dönüş (kimse kaybolmaz, anı, hasta yatan yaralı, hikâye), şifalı ot ganimeti,
  handa hikâye anlatma ve dinleyenlerin keyfi, üç yadigâr parçasının birleşmesi, Kayıp Şehir Haritası, asmanın kuralları
  ve bahçeye +%10, sökülen asmanın fidesi, meşalenin mavi ışığı ve ısıtması, harabeden yazıt, yazıtın çözülmesi ve üç
  şemanın etkisi, kayıttan keşif durumunun ve hikâyelerin dönmesi.
- **Denetim** (`audit.mjs`, 52): sefer yoldayken macera penceresi açıkken kayıt -> yükleme birebir aynı; pencere yeniden
  açılır, kafile seferde kalır, sefer bir kez döner.
- **Uyumluluk** (`compat.mjs`, sürüm 2-14, 192): eski kayıtlar boş ganimet sandığıyla açılır; sürüm 13 kaydında eski
  biçimde yarım kalmış sefer maceralar açmadan sürer ve döner; sürüm 14 kaydının ganimetleri, yazıtları ve sefer sayısı korunur.
- **Bulunup düzeltilen hata:** seferden şifalı ot gelince Kasaba Günlüğü çöküyordu (otlar kaynak değil, Şifacı Kulübesi
  stoğu); 30 günlük otopilot koşusu yakaladı, hedefli teste eklendi.

## Derinleşen yaşam: sosyal denge, meslek kıyafetleri ve usta işi eserler (15. aşama)

### Sosyal denge: atışma ve barışma
Denetimde 50 günlük koşularda 5330 atışmaya 128 barışma düşüyordu. Sürtüşmeler törpülendi, barışmanın yolları açıldı
(`data/family.js` -> `CONFLICT`, `RECONCILE`):

- **Daha seyrek atışma:** çalışırken, sohbette ve karşılaşınca atışma olasılıkları düştü; aynı çift en az 10 saat ara
  verir. **Küsler birbirini görmezden gelir:** zaten küs olan çiftin yeniden atışma olasılığı dörtte birdir.
- **Küs:** atışıp eksiye düşen her çift (eskiden yalnızca -10'un altı). Küs iki sakin aynı yerde sohbet ederken barışabilir.
- **Gönül alma yerleri:** Kasaba Hanı, Ahşap Çardak, Kamp Ateşi ve şenlik / mevsim festivalleri. Buralarda barışma
  olasılığı **4 kat (+%300)**, kimse atışmaz.
- Barışınca iki sakinin başında **el sıkışma balonu** çıkar; anılarına ve günlüğe yeriyle yazılır ("Han'da Deniz ile
  barıştı", "Çardakta...", "Ateş başında...", "Şenlikte..."). Kasaba Arşivi'nde "Barışan küsler" sayacı.

### Meslek kıyafetleri ve zanaat rozeti
Sakin, en çok deneyimi olan mesleğinin kademesini üzerinde taşır (`data/skills.js` -> `OUTFIT_KITS`,
`art/sprites/outfits.js`):

| Meslek | Kalfa (Lv.2) | Usta (Lv.3) |
|---|---|---|
| Oduncu | deri yelek ve eldiven | kırmızı ekose gömlek ve bere |
| Çiftçi | hasır şapka | çiçekli hasır şapka ve kot tulum |
| Madenci / Taşçı | bandana ve bel feneri | fenerli kask ve koruyucu zırh |
| Şifacı | omuzdan asılı ot çantası | bilge cübbesi ve yaprak çelengi |
| Fırıncı / Aşçı | beyaz önlük | kabarık aşçı şapkası, önlük, boyun mendili |
| Çoban | kırmızı boyun mendili | keçe şapka ve yün yelek |
| Balıkçı | kova şapka | sarı yağmurluk ve şapkası |
| Yapı Ustası | alet kemeri | baret ve alet kemeri |
| Zanaatkâr | deri önlük | koruyucu gözlük ve deri önlük |
| Bilge | mor atkı | kep ve bilge cübbesi |

Çıraklar sade köylü giysisi giyer. Kıyafet bütün yönlerde, yürürken ve otururken çizilir; kışlık palto gövdeyi örter ama
başlık görünür; çocuklar giymez. Kıyafet deneyimden türetilir (kayda girmez): kademe atlayınca hemen, ana meslek
değişince saat başı giyilir. Karakter Paneli'nde adın altında **zanaat rozeti** durur: Çırak bronz, Kalfa gümüş, Usta altın
("Usta Madenci"); üzerine gelince giydiği kıyafet yazar.

### Usta işi eserler
Usta (Lv.3) bir sakin kendi iş yerinde bir mesaiyi bitirince **%4** (sabit iş yerinde +%2, Sağlam Alet'le +%2: en çok
**%8**) şansla eşsiz bir eser ortaya koyar (`data/masterpieces.js`, `systems/CraftsmanshipSystem.js`):

| Usta | İş yeri | Eser | Liman / Tüccar |
|---|---|---|---|
| Oduncu | Kereste Atölyesi | İşlemeli Yadigâr Sandık | 280 / 238 altın |
| Taşçı | Taş Ocağı | Görkemli Taş Figür | 260 / 221 |
| Madenci | Demir Madeni | Kusursuz Demir Heykel | 360 / 306 |
| Fırıncı | Yel Değirmeni ve Fırın | Kraliyet Ziyafet Ekmeği | 240 / 204 |
| Çoban | Koyun Ağılı | İnce Dokuma Kasaba Halısı | 320 / 272 |
| Şifacı | Şifacı Kulübesi | Mucizevi Hayat İksiri | 400 / 340 |

Eser çıkınca ustanın başında altın kıvılcımlar ve madalya balonu belirir, kutlama ezgisi çalar; günlüğe ve ustanın
anılarına yazılır. Nadir kalsın diye bir usta iki eser arasında en az 3 gün dinlenir ve kasabada günde en çok bir eser
çıkar; vitrinde 12 eser bekliyorsa yenisi yapılmaz. Eserler **Kasaba Arşivi'nin "Usta İşi Eserler" vitrininde** listelenir:

- **Sergile:** kasaba refahına kalıcı **+1** (en çok +12). Belediye Konağı'nın paneli vitrindekileri gösterir.
- **Sat:** limandan tam değerine ihraç edilir, gezgin tüccar %85'ini öder (200-400 altın). Liman paneli ihraca hazır eserleri
  ve değerlerini gösterir.

Üretim yapılarının panelinde o iş yerinde çıkabilecek eser ve şansı yazar.

### Denge ve test (simülasyon)
- **Stres matrisi** (6 tohum x 1x / 2x / 4x x 50 gün = 18 koşu): takılma 0, kopuk referans 0, taşan ev 0, bekleyen iş 0,
  üretmeyen iş yeri 0, sayfa hatası 0, kıyafet hatası 0. Atışma 5330'dan 2362'ye indi (-%56); açık barışma 128'den 312'ye
  çıktı (barışma / atışma %2,4 -> %13). Küslük kalıcı değil: 4x koşularının sonunda 2608 ilişki çiftinden yalnızca 1'i küs
  (koşu başına aynı anda en çok ~4); diğerleri gönül alma yerlerinde ya da birlikte çalışıp sohbet ederek düzeliyor.
- **Usta işi eserler:** koşu başına ~30 eser (18 koşuda 547; 216 sergilendi, 331 satıldı); 50. günde kasabaların
  yarıdan çoğu Usta kostümü giyiyor (18 koşuda 457 Usta, 79 Kalfa).
- **Hedefli testler** (`tests.mjs`, 220): barışma olasılığı gönül alma yerlerinde 4 kat, el sıkışma balonu, yerli anı ve
  günlük, gönül alma yerinde atışılmaz; Çırak / Kalfa / Usta kıyafeti, kademe atlayınca anında giyilir, palto ve çocuk,
  12 meslek x 4 yön x 3 kare çizimi, bronz / gümüş / altın rozet; Kalfa eser yapmaz, Usta %4, sabit iş yeri ve Sağlam Alet'le
  %8, usta başına bekleme ve kasabada günlük sınır, anı / günlük / kutlama, sergileme (+1 refah, en çok +12), liman ve tüccar
  satışı, 200-400 altın, Arşiv vitrinindeki Sergile düğmesi, kayıttan eserlerin ve kıyafetlerin dönmesi.
- **Uyumluluk** (`compat.mjs`, sürüm 2-13, 165): eski kayıtlar boş vitrinle açılır, sakinler deneyimlerine göre giyinir;
  sürüm 13 kaydının eserleri korunur. **Denetim** (`audit.mjs`): 49/49.

## Ferah arayüz: ince üst çubuk, birleşik dock, ortalanmış pencereler (17. aşama)

Her köşeye dağılmış bej kutular oyun alanını daraltıyordu; arayüz baştan tasarlandı. Ayrıntılı yerleşim
*Arayüz yerleşimi ve dar pencereler* bölümündedir.

### Düzeltilen hata: Kasaba Sakinleri ►
Listenin CSS'teki `display: flex` kuralı `[hidden]` özniteliğini eziyordu; ► düğmesi listeyi gizliyor ama liste
ekranda kalıyordu. Artık arayüz katmanında `[hidden]` her zaman kazanır ve sakinler listesi gerçek bir çekmecedir:
▸ ile sağa kayarak kapanır, kenarda "kişi simgesi · 8 ◂" sekmesi kalır, sekmeye tıklayınca sağdan kayarak açılır.

### Yeni bölgeler
- **İnce üst çubuk** (`Hud`): eski büyük sol üst kutunun yerine tek satır. Kayıt düğmeleri, tohum ve kontroller
  Ayarlar penceresine, karo bilgisi imlecin yanındaki ipucuna taşındı.
- **Birleşik alt dock** (`BuildMenu` + `dockButton`): İnşa Et (B), Topla (H), Yık (X) | Hedefler (O), Günlük (J),
  Arşiv (I), Fotoğraf (F), Ayarlar. Hedefler ve Günlük düğmelerinde sayaç rozeti vardır; ipucu kısayolu ve açıklamayı
  söyler. Eski sol sütun (Günlük / Hedefler / Arşiv düğmeleri, kontrol ipuçları paneli) kaldırıldı.
- **Ortalanmış pencereler** (`ModalHost`): Hedefler, Günlük, Arşiv ve Ayarlar ekranın ortasında, çerçeveli ve ✕
  düğmeli; `Esc` ya da dışına tıklamak kapatır, aynı anda tek pencere açılır.
- **Sağ alt kart:** Sakin, yapı ve takas kartı listenin altına sıkışmaz; sütunun dibinde bağımsız bir kart olarak
  açılır, liste açık da kapalı da olsa aynı sağ kenarda hizalanır.
- **Ayarlar** (`SettingsPanel`): Kaydet / Yükle / Yeni Harita (onaylı), ses, harita tohumu, yakınlık ve kısayol
  tablosu.

### Görsel stil
Sert sarı-bej kutular yerine koyu ahşap / parşömen tonları: paneller `rgba(40, 28, 23, 0.88)` (yaklaşık %88 opak) ve
hafif arka plan bulanıklığıyla yarı saydam, 6 piksel yuvarlatılmış kenarlı, ince açık çerçeveli. Metin açık parşömen
(`--ui-ink`), başlıklar altın sarısı, ikincil satırlar soluk; bölüm başlıkları küçük büyük harflerle ayrılır. Arşiv
grafikleri de koyu zemine geçti. Bütün renkler `styles/ui.css` başındaki değişkenlerdedir (`--ui-paper`, `--ui-ink`,
`--ui-card`, `--ui-frame` …).

### Test
- **`audit.mjs` 7. bölüm** yeniden yazıldı: 1920x1080, 1366x768, 1024x768, 768x1024 ve 390x844'te yapı / sakin /
  takas kartı, kapalı çekmece, inşa listesi, dört pencere ve karar penceresi açıkken yatay kaydırma, ekrandan taşma,
  içerik taşması, üst çubuk / çekmece / kart / dock / yapı listesi çakışması, kartın hizası, pencerenin ortada ve
  tek olması, bildirimin üst çubuğa ve listeye binmemesi denetlenir.
- **`audit.mjs` 8. bölüm** (yeni, gerçek tıklama ve tuşlarla): çekmecenin kapanıp açılması ve hatırlanması, dock
  sırası ve kısayolları, ipucunun ekran içinde kalması, ✕ / `Esc` / dışına tıklama, tek pencere kuralı, `O` / `G` /
  `J` / `I`, karar penceresinin `Esc`'e dayanması, Ayarlar'dan kayıt ve Yeni Harita onayı, üst çubuktaki hız ve
  duraklatma, harita ipucu, listeden seçilen sakinin kartı.
- Sonuç: `tests.mjs` 260/260, `audit.mjs` 85/85, `compat.mjs` 192/192, sayfa hatası yok.

## Serbest imar, peyzaj fırçası ve kasaba estetiği (18. aşama)

Oyuncu artık yalnızca tek tek bina kurmuyor; kasabanın sokaklarını, meydanlarını ve bahçelerini serbestçe tasarlıyor.
Kurallar `data/landscape.js`, mantık `systems/LandscapeSystem.js` (saf hesaplar `systems/Landscape.js`), görseller
`art/sprites/structuresLandscape.js` ve `art/tiles/index.js` içindedir.

### İnşa menüsünün sekmeleri
Alt dock'taki **İnşa Et** listesi üç sekmeye ayrıldı: **Yapılar**, **Yol & Zemin** ve **Peyzaj & Dekorasyon** (her sekmede
öğe sayısı yazar). Sekme seçimi tarayıcıda hatırlanır; bir öğe seçilince onun sekmesi açılır
(`data/buildings.js` → `buildTabFor`, `data/landscape.js` → `BUILD_TABS`).

### Yol & Zemin fırçası
| Fırça | Bedel | Ne yapar? |
|---|---|---|
| Toprak Patika | 1 odun | Sakinler patikayı yeğler, üzerinde **%10** hızlı yürür. Yağmurda **çamurlanır**: %20 yavaş yürünür, yol bulma çamurlu patikadan kaçınır, karoda su birikintileri görünür. |
| Parke Taş Yol | 1 taş | Arnavut kaldırımı: **%25** hızlı, yağmurda çamur olmaz. Patikanın üstüne de döşenir. |
| Taş Plaka (Meydan Zemini) | 2 taş | En şık döşeme: %20 hızlı, çamurlanmaz, çevresine estetik katar; bank, fener ve süsler üstüne kurulur. |
| Ahşap Köprü | 2 odun | Suyun üzerinden geçit (değişmedi). |

- **Tıklayıp sürükleyerek kesintisiz çizim:** fare hızlı gitse de aradaki karolar dolar (4 yönlü bağlı çizgi;
  `ToolController.lineTiles`); tek tıklama tek karo döşer.
- **Otomatik kenarlık (autotile):** yollar birbirine bağlandığında viraj köşeleri yuvarlanır, kavşak ve L dönüşlerinin iç
  köşelerine küçük bir çimen tutamı taşar; köşenin rengi komşu zeminden (çimen, bereketli toprak, kayalık, orman) gelir,
  mevsimle boyanır (`TileMap.drawRoadCorners`, `art/tiles` → `CORNER_ART`).
- Yol hızları bu aşamada yeniden dengelendi: haritanın kendi toprak yolları da artık +%10 (önce +%30), taş yollar +%25
  (önce +%50). Yol bulma maliyetleri değişmedi (parke 0,35, taş plaka 0,38, patika 0,4); A* tahmini en ucuz karoya (0,35)
  göre düzeltildi.

### Peyzaj & Dekorasyon
| Yapı | Bedel | Ne yapar? |
|---|---|---|
| Ahşap Çit | 2 odun | Kazıklı rustik çit; dört yandaki çit ve kapılara göre birleşir (yatay, dikey, köşe, T, kavşak). Geçilemez; yerleşim kuralı bir yapıyı kasabadan koparmasına izin vermez. Sürükleyerek dizilir. |
| Çit Kapısı | 4 odun | Çitlerle birleşir, çitin yönünü alır; sakinler kapıdan geçer (yolların üstüne de kurulur). |
| Ahşap / Demir Sokak Feneri | 1 odun + 1 taş / 2 demir + 2 taş | Geceleri yanar (demir fener 18:30-06:30, daha geniş ışık). Gece ışıksız sokakta yürüyen sakin **karanlıktan ürker** (keyfi biraz hızlı kaçar); fenerin ışığı altında ürkmez. |
| Mahalle Tabelası | 3 odun | Önerilen bir sokak adıyla dikilir (Gül Sokağı, Çınar Yolu...); Yapı Bilgi Paneli'ndeki kutuya yazıp Enter ile semte ad verilir. İmleçle üzerine gelince ad küçük ahşap bir tabelada okunur; yakınındaki yürüyüş anılarında sokağın adı geçer. |
| Park Bankı | 5 odun + 1 demir | Oturulabilen bank (ahşap bank gibi); güzel bir köşedeyse oturan manzarayı izler, keyfi çok daha hızlı dolar. |
| Çiçek Saksısı | 1 odun + 2 taş | Çevresi çiçek koklama noktasıdır; yanından geçenler çiçek kokusunu içine çeker. Sürükleyerek dizilir. |
| Huş / Meşe / Çam Fidanı | 2 odun + 2 yiyecek | Dikildikten sonra **iki günde** büyür (fidan → genç ağaç → ulu ağaç; adı Huş Ağacı / Süs Meşesi / Süs Çamı olur). Ulu ağacın gölgesinde sakinler oturup dinlenir (yeni etkinlik: `shade`). Kesilmez, odun vermez; mevsimle renk değiştirir. |

Çiçek tarhı, çiçekli çit, kiraz, kemer, çardak, ahşap bank, asma ve kadim meşale de bu sekmeye taşındı.

### Çevre Estetiği ve refah
- Her süsün bir estetik değeri vardır (`AESTHETIC.values`; çardak ve anıt 4, kiraz ve çiçek tarhı 3, saksı 2,2...).
  Değer, süsün çevresindeki **4-5 karoluk** bölgeye merkezde tam, kenara doğru azalarak yayılır; taş plaka ve parke
  döşemenin de küçük katkısı vardır (`computeAestheticField`). Harita ipucu güzel köşelerde "✿ Çevre estetiği: Güzel /
  Çok güzel / Büyüleyici" yazar; süs kurarken dock ipucu süsün katkısını ve oranın güzelliğini gösterir.
- Güzel bir sokaktan geçen sakinin keyfi dolar; bankta oturanın keyfi manzarayla artar. Arada bir hafif güzel anılar
  yazılır: "Güzel bir sokakta yürüdü (Gül Sokağı)", "Çiçek kokusunu içine çekti", "Bankta oturup manzarayı izledi",
  "Ağaç gölgesinde serinleyip dinlendi" (sakin başına en çok iki günde bir; defter dolunca önce bunlar silinir).
- Kasabanın toplam estetik puanı refaha **kalıcı küçük bir çarpan** ekler: 12 puanda +%1, 30'da +%2, 55'te +%3, 85'te +%4,
  120'de +%5 (`townHappiness`: sakinlerin ortalaması × çarpan + bonuslar). Puan ve yüzde üst çubuktaki refahın ipucunda,
  süslerin Yapı Bilgi Paneli'nde yazar; yüzde arttıkça günlüğe "Kasaba güzelleşiyor" düşer.

### Akıllı yıkım fırçası (X)
Tıklanan yapı her boyutta yıkılır (şantiye iptal edilir); **sürüklenince** yollar, köprüler, taş plakalar, çitler ve 1x1
süsler art arda geri dönüştürülür (büyük yapılar sürüklerken yıkılmaz). Oyuncunun döşediği zemin, harita üretildiğindeki
hâline döner (taş plakanın altından çimen ya da patika çıkar) ve **harcananın yarısı** depoya iade edilir; küsurat birikir
(iki karo patika = 1 odun; `landscape.refundCredit`). Fırça bitince tek bir özet bildirimi çıkar. Fırçayla dizilen çit,
saksı ve fidanlar günlüğü ve bildirimleri doldurmaz.

### Kayıt
Kayıt sürümü **15**. Yeni alanlar: tabelanın adı (`buildings[].label`), süs fidanının dikiliş anı (`plantedAt`) ve
`landscape` (iade küsuratı, estetik puanı ve yüzdesi, yürüyüş ve döşenen yol sayaçları). Çit bağlantıları ve estetik
haritası kaydedilmez, yüklenince yapılardan ve zeminden yeniden hesaplanır. 4.-17. aşamanın (sürüm 2-14) kayıtları
sorunsuz açılır: peyzaj durumu boş başlar, estetik ilk adımda hesaplanır (günlüğe yazılmaz), dikiliş anı bilinmeyen
fidanlar büyümüş sayılır.

### Denge ve test (simülasyon)
- **Otopilot** artık imar da yapar: her yeni yapının kapısını en kısa rotayla (BFS) en yakın yola toprak patikayla
  bağlar, taş bolken meydana yakın patikaları parke taşa çevirir, tabela, saksı, park bankı, fener ve süs ağaçları diker,
  bir bahçenin kenarına çit çeker; sonunda döşenen yolu, estetik puanını, güzel sokak anılarını ve **yürüyüş rotalarının
  ne kadarının yollardan geçtiğini** raporlar. Bekçi takılma, kopuk referans ve taşan evleri denetlemeye devam eder.
- **Hedefli testler** (`tests.mjs`, 52 yeni): sekmeler ve görünen öğeler, fırça maliyetleri ve hızlar, kesintisiz
  sürükleme ve viraj, otomatik dış / iç köşeler, parke ve taş plaka, çamur (hız, yol bulma, ipucu), A*'ın yeni yolu
  öncelikli kullanması, yıkım fırçası ve %50 iade (küsurat), taş plakanın altından zeminin geri gelmesi, çit ve kapı
  bağlantıları, çit fırçası, tabela adı ve paneli, estetik alanının yayılması ve yarıçapı, toplam puan, refah çarpanı,
  güzel sokak / çiçek anısı ve sokak adı, karanlık ve fener, park bankında manzara, saksının çiçek noktaları, fidanın
  iki günde büyümesi, gölgede dinlenme planı, kesilemeyen süs ağacı, sürükleyen yıkımın büyük yapıyı yıkmaması, kayıt
  sürümü 15 ve gidiş-dönüş.
- **Uyumluluk** (`compat.mjs`, sürüm 2-15, 220): `save-v15.json` 18. aşamanın otopilotuyla 34 günlük oyundur (3 tabela,
  6 süs ağacı, çitler, 113 karo patika ve 137 karo parke; estetik 92 puan, refah +%4). 34 günlük koşuda bekçi: takılma 0,
  kopuk referans 0; yürüyüş rotalarının %80'i yollardan geçer.
- Sonuç: `tests.mjs` 312/312, `audit.mjs` 85/85, `compat.mjs` 220/220, sayfa hatası yok. **Sanat önizleme** (`tools/art-preview.html`): gerçek `TileMap` kuralıyla çizilen yol
  mozaiği (üç mevsim ve yağmur), çit düzenleri, sokak eşyaları ve üç süs ağacının büyüme kademeleriyle dört mevsimi.

## Sosyal yaşam: flört, evlilik, karakter huyları ve kasaba dedikodusu (19. aşama)

Sakinler artık yalnızca kaynak toplayan işçiler değil: hoşlandıkları kişiyle randevuya çıkar, meydanda konfetiler
arasında evlenir, eşleriyle aynı kulübeye taşınıp akşamları birlikte yemek yer, kendi huylarına göre boş zaman geçirir
ve kasabadaki büyük olayları kulaktan kulağa birbirine anlatırlar. Sayılar `data/social.js`'te, birlikte olmanın etkileri
`systems/SocialSystem.js`'te, planlar `ai/Brain.js`'te (`planDate`, `planHomeDinner`, `planWeddingParty`, huyların
`planPetAnimal`, `planMusic`, `planViewpoint`, okuma bankı / Bilgelik Evi), yürütme `systems/BehaviorSystem.js`'tedir.
9. aşamanın aşk, düğün, ortak ev ve çocuk kuralları (`data/relationships.js`, `systems/FamilySystem.js`) aynen geçerlidir;
19. aşama onları görünür ve yaşanır kılar.

### Flört ve randevular

- İlişki puanı en az **40 (Dost)** olan iki bekâr yetişkin (aşık olabilecekleri biri: aile değil, yaş farkı en çok 14) ya
  da zaten sevgili olanlar boş zamanlarında birbirlerini **randevuya** çağırır. Brain bunu sohbet ihtiyacından ve boş zaman
  etkinliklerinden önce dener (her kararda %35, sevgililerde %55; aynı sakin 4 saat ara verir; mesaide yalnızca molada).
- Randevu yerleri: **çardak** (baş başa: "Elif ile çardakta baş başa buluştu"), **han** (akşam açıkken aynı masa: "…ile handa
  aynı masayı paylaşıyor") ve **yan yana iki bank** (en çok 3 karo aralıklı; davet edilen yandaki banka oturur: "…ile bankta
  yan yana oturuyor"). Yolda durum metni "Elif ile randevuya gidiyor" olur, davet edenin başında aşk balonu çıkar.
- Randevuya çağrılan, sosyalliği dolu olsa da gelir ve süren sohbetini bırakabilir (uyuyan, çalışan, içerideki, seferdeki ya
  da başka bir randevudaki gelmez).
- Randevudaki çift yan yanayken dakikada **+0,12** fazladan ilişki puanı, keyif ve sosyallik kazanır; ilk randevuları
  Yaşam Günlüğü'ne yazılır ("Çardakta Elif ile baş başa ilk randevusuna çıktı"). Bank toplanma yeri olmadığı hâlde bankta
  yan yana oturan çift de **aşık olabilir** ve akşamları **evlenebilir**. Puan 85'i geçince aşk, en az 2 gün sonra düğün
  (9. aşama kuralları).

### Düğün kutlaması

- Çift evlenince kasaba meydanında (havuz başı) **45 dakikalık bir kutlama** başlar: çift ve ilişki puanı en az 25 olan en
  çok **6 dostu** elindeki (yarıda kesilebilen) işi bırakıp meydana koşar. Çift yeni evine taşınmadan önce kutlamaya gider.
- Havuzun üstünde **konfeti demeti** patlar, renkli kâğıtlar süzülerek yağar, küçük kalpler yükselir (`rendering/WeddingConfetti.js`);
  kısa bir fanfar çalar, günlüğe "Meydanda düğün kutlaması: Elif ile Emre için konfetiler havada uçuşuyor (4 dostu el
  çırpıyor)" yazılır. Kutlamadakilerin keyfi dakikada +0,6 dolar, aralarındaki dostluk hızlanır.
- Kutlama bitince katılan dostların Yaşam Günlüğü'ne "Elif ile Emre'nin düğününde konfeti attı", çiftin defterine "Meydanda
  dostlarıyla … düğünlerini kutladı" düşer. Düğün aynı zamanda bir dedikodu haberidir (çift ve davetliler bilir).

### Ortak yaşam: aynı kulübe, boşalan ev, akşam yemeği

- Kulübe kapasitesi **2**'dir (Taş Ev 4). Evlenen çift aynı eve taşınır: birinin evinde yer varsa öteki oraya geçer (9. aşama
  sırası). Taşınanın **boşalan eski kulübesi** göçmenlere açılır: günlüğe "… ortak evlerine taşındı; Kulübe boşaldı ve yeni
  göçmenlere açık" yazılır (`social:homeFreed`, `stats.homesFreed`). Evli çiftin evindeki boş yatak hâlâ çocuklarına ayrılır.
- **Akşam yemeği:** 18:00–20:30 arasında acıkan (tokluk 80'in altında) evli sakin, aynı evde yaşayan ve müsait olan eşini
  evde birlikte yemeğe çağırır (günde bir kez; eş elindeki boş zaman işini bırakır). Kişi başı bir öğün stoktan ödenir.
  Birlikte yerken ikisinin keyfi (+0,35/dk) ve sosyalliği (+0,9/dk) dolar, durum metni "Eşi Emre ile evde akşam yemeği
  yiyor" olur, ertesi sabah **Mutlu Yuva** moraliyle uyanırlar; ilk akşam yemekleri anı defterine yazılır.

### Karakter huyları

Her sakine (çocuklar dahil) bir huy düşer; Karakter Kartı'nda kişilik etiketlerinin yanında altın çerçeveli bir çip olarak
görünür. Yeni kasabanın ilk sakinleri dört huyu paylaşır; göçmenler kasabada en az görülen huyu, çocuklar çoğunlukla (%70)
bir ebeveyninin huyunu alır. Huy, boş zaman tercih ağırlıklarına eklenir (`QUIRKS[...].leisure`).

| Huy | Ne yapar? |
|---|---|
| **Hayvansever** (pati) | Yakındaki (22 karo) bir kediye / köpeğe yürür; hayvan onu bekler. Varınca başını okşar: keyif **+10**, kedinin başında kalp, mırlama / havlama sesi ("Kedi Tekir'in başını okşuyor"). 9 karodan yakında bir hayvan görürse isteği 2,5 katına çıkar |
| **Kitap Kurdu** (kitap) | Fener altındaki (fenere en çok 3 karo) bir bankta ya da Bilgelik Evi'nde kitap okur; başında kitap balonu |
| **Müzisyen** (ud) | Akşamları (17:00 sonrası) handa ya da meydan havuzunun başında çalar: çevresindeki (44 piksel) en yakın **4 dinleyicinin** keyfi dakikada +0,55 dolar, başlarında nota / melodi balonları çıkar; çalarken orası herkese 1,6 kat daha cazip gelir |
| **Doğa Tutkunu** (yaprak) | Süs ağaçlarının gölgesinde (genç fidan da olur) ya da nehir kenarında manzarayı izleyip dinlenir |

### Kasaba dedikodusu

- Büyük olaylar bir **haber** olur: usta işi eser, seferden dönüş (getirilen ganimetle: harita, yazıt, meşale…), barışma
  (günde bir), düğün, mevsim festivali ve akşam şenliği. Olayın kahramanları (usta, kafile, çift ve davetliler, festivale
  katılanlar) haberi bilir.
- Aynı yerde sohbet edenler (dakikada %6) ya da **yolda karşılaşıp selamlaşanlar** (14 piksel, dakikada %35; aynı ikili 3 saat
  ara verir) haberi bilmeyene anlatır: ikisinin başında **fısıltı / haber balonu** çıkar.
- Haberi ilk kez duyanın Yaşam Günlüğü'ne bir not düşer: "Leyla'dan, Emre'nin Kayıp Tapınak Seferi'nden getirdiği kadim
  haritayı duydu". Haberi kahramanın kendisi anlatırsa: "Emre'den, Kayıp Tapınak Seferi'nden getirdikleri kadim haritayı kendi
  ağzından dinledi". Ad ekleri ünlü uyumuna göre (`utils/turkish.js`: Leyla'dan, Mert'ten, Kemal'in, Ozan'ın). Defterde en çok
  6 dedikodu notu tutulur (aşk, düğün ve dostluk anıları silinmez).
- Haber kasabanın %75'ine ulaşınca günlüğe "Kasabada dilden dile dolaşıyor: …" yazılır. Haberler 4 gün dolaşır, en çok 12
  haber tutulur; sakinin son duyduğu haber kartında kalır.

### Karakter Detay Kartı: Sosyal Hayat

Sağ alttaki kartta **İlişkiler**'in altında yeni **Sosyal Hayat** bölümü vardır:

- **Huyu:** adı ve simgesi (üzerine gelince açıklaması).
- **Eşi ve evi:** eşin adı (tıklayınca seçilir) ve "Eşiyle 2 numaralı kulübede birlikte yaşıyor" / "…kulübeye taşınıyorlar" /
  "Eşiyle ortak bir ev bekliyorlar"; sevgilisi varsa "Sevgilisiyle flört ediyor", bekârsa evi.
- **Son duyduğu:** haberin kendisi, kimin anlattığı ve ne zaman ("Leyla anlattı · Gün 12, 18:00").

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 383; 71'i bu aşamanın): Türkçe ad ekleri (Emre'nin, Ozan'ın, Kemal'in, Leyla'dan,
  Mert'ten), her sakinin geçerli bir huyu olması ve dört huyun da görülmesi, göçmenin en az görülen huyu, çocuğun ebeveyn
  huyu; Hayvansever'in planı, hayvanın beklemesi ve okşama (+10 keyif, mırlama); Kitap Kurdu'nun fener altı bankı ve Bilgelik
  Evi; Müzisyen'in akşam saati, en yakın 4 dinleyicisi ve durum metni; Doğa Tutkunu'nun genç ağaç gölgesi; randevu (Dost
  eşiği, yer seçimi, yandaki banka gelen davetli, "randevuya gidiyor", ilişki bonusu, ilk randevu anısı, bankta aşk,
  sevgililerin randevusu); kulübe kapasitesi 2, aynı eve taşınma, boşalan kulübenin göçmenlere açılması ve çiftin evine
  göçmen yerleşmemesi; düğün kutlaması (davetliler, günlük, taşınmadan önce meydana koşma, düğün haberi, konfeti, bitişte
  anılar); akşam yemeği (saat aralığı, eşin daveti, günde bir kez, stoktan ödeme, keyif / sosyallik / Mutlu Yuva, anı);
  dedikodu (usta işi eser, seferden dönüş, barışma haberi, sohbette ve selamlaşırken aktarma, "kendi ağzından", tekrar
  anlatılmama, selamlaşma arası, "dilden dile", eskime); Sosyal Hayat kartı; kayıt sürümü 16 gidiş-dönüşü (evli çift ve
  ortak ev, huylar, son haber, dedikodu, akşam yemeği günü, sayaçlar).
- **Denetim** (`audit.mjs`, 88): düğün kutlaması sürerken kayıt -> yükleme durum kayması yok, kutlama aynen döner, bir kez biter
  ve çift aynı evde kalır.
- **Uyumluluk** (`compat.mjs`, sürüm 2-16, 250): `save-v16.json` bu aşamanın otopilotuyla 34 günlük oyundur (12 evli çift,
  hepsi aynı evde; 11 dolaşan haber; bir keşif seferinin ortası). Sürüm 2-15 kayıtlarında huylar ilk açılışta dağıtılır
  (dördü de görülür), dedikodu boş başlar, evli çiftler kendi evlerinde kalır.
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 30`): takılma 0, kopuk referans 0, taşan ev 0,
  sosyal sıkışma 0, sayfa hatası 0. Altı kasabada 66 düğün (66 çiftin hepsi aynı evde, hepsi meydanda kutlandı), 177 randevu,
  304 akşam yemeği, 5946 dedikodu aktarımı, 381 müzik akşamı, 1120 hayvan sevme, 595 kitap molası; nüfus hiçbir koşuda
  başlangıcın (6) altına inmedi, hepsi 30 tavanına ulaştı, evsiz sakin olmadı. Çiftlerin çoğu evlendiğinde zaten aynı evde ya
  da ev arkadaşı değiş tokuşuyla birleştiği için boşalan kulübe nadirdir (altı koşuda 1).
- **Bulunan ve düzeltilen eski hata:** sefere yürüyen bir sakinin rotasına şantiye kurulunca görevi kesiliyor, sakin "seferde"
  bayrağıyla kasabada kalıyor ve kafile onsuz dönüyordu (tohum 21, "seferde sanılıyor ama süren sefer yok"). Artık görevi
  kesilen sefer üyesi yeniden harita kenarına yönelir (`BehaviorSystem.updateCharacter`); hedefli testle kilitlendi.
- Sonuç: `tests.mjs` 383/383, `audit.mjs` 88/88, `compat.mjs` 250/250, sayfa hatası yok. **Sanat önizleme**
  (`tools/art-preview.html`): huy simgeleri (pati, kitap, ud, yaprak), yeni balonlar (fısıltı, melodi, kitap, pati), zamanla
  ilerleyen düğün konfetisi ve küçük sahneler (bank randevusu, fener altında kitap, kedi okşama, müzisyen ve dinleyenler,
  yolda selamlaşma).

## Kasaba Zaferi ve Çağ Dönüm Noktası: Ulu Saat Kulesi, Tarihçe Kütüğü ve Altın Çağ (20. aşama)

Bu bir "oyun bitti" ekranı değildir: kasaba bir zirveye ulaşır, kalıcı bir unvan kazanır ve oyun zenginleşerek sürer.
Sayılar `data/goldenAge.js`'te, kulenin aşamaları `data/buildings.js` → `wonder`'da; mantık `systems/GoldenAgeSystem.js`
(saf yardımcılar `systems/GoldenAge.js`), kademeli inşa `systems/ConstructionSystem.js`'tedir.

**Tasarım kararı:** 12. aşamadan beri oyunda üç aşamalı, saat kuleli bir Kasaba Harikası (Büyük Vadi Saat Kulesi) vardı.
İkinci bir saat kulesi eklemek yerine o harika **Ulu Saat Kulesi**'ne dönüştürüldü (yapı türü aynı: `wonder`). Böylece eski
kayıtlardaki kule ve aşaması korunur; tamamlanmış kulesi olan eski kasabalar yüklenince Altın Çağ'a sessizce girer.

### Kademeli mega proje: Ulu Saat Kulesi

Kasaba **Kasaba seviyesine** (3) ve **20 sakine** ulaşınca İnşa menüsünde açılır (öncesinde menüde nedeni yazar: "Kasaba
20 sakine ulaşınca açılır (şu an 14)"). Tek seferde dikilmez; Temel şantiye olarak kurulur, sonraki aşamalar yapının
panelinden **Aşamayı Başlat** ile başlatılır (maliyet peşin; iptalde çalışılmadıysa tamamı, yoksa yarısı iade).

| Aşama | Maliyet | İş | Ustalık katkısı |
|---|---|---|---|
| 1. Temel | Odun 300, Taş 400 (bol taş ve kereste) | 600 | — |
| 2. Gövde | Taş 450, Demir 150, Odun 100, Altın 400 (kesme taş ve demir) | 900 | **Yapı Ustaları**: İnşaat ya da Taşçılık'ta Kalfa ×1,25, Usta ×1,6 |
| 3. Mekanizma & Çan | **Kadim Dişli 8**, Demir 120, Taş 150, Altın 900 | 1000 | **Usta zanaatkârlar**: Zanaatkârlık ya da İnşaat'ta Kalfa ×1,25, Usta ×1,6 |

- **Kadim Dişli** (yeni işlenmiş mal, üst çubuktaki **Mallar ▾** listesinde): Gövde bitince Zanaat Atölyesi, hangi üretim
  seçili olursa olsun, önce Mekanizma için dişli döker (dişli başı Demir 5, Altın 30, Odun 2; 90 iş). Stokta 8 dişli olunca
  durur ve ekipman üretimine döner; zanaatkârın ustalığı dökümü hızlandırır. İlk dişli günlüğe yazılır. Dişli ihraç edilmez.
- Kule şantiyesinde çalışan sakinlerin başlarında **çekiç ve ter balonları** çıkar. Kuleye verilen her emek Tarihçe Kütüğü'ne
  yazılır; en çok emek veren "baş usta" olur.

### Çağ Kutlaması ve Altın Çağ

Kule tamamlanınca oyun durmaz; "Çağ Dönüm Noktası: Altın Çağ!" penceresi açılır ve:

- Kasaba meydanında (havuz başı; yoksa kulenin dibinde) **2 saatlik Çağ Kutlaması** başlar: uyanık bütün sakinler
  (yarıda kesilebilen) işlerini bırakıp meydana koşar, konfeti yağar, büyük fanfar çalar; kutlamadakilerin keyfi dakikada
  +0,5 dolar. Bitince katılanların Yaşam Günlüğü'ne "Ulu Saat Kulesi'nin ilk çanını meydanda Çağ Kutlaması'nda dinledi",
  baş ustanın defterine "adı Tarihçe Kütüğü'ne altın harflerle yazıldı" düşer.
- Çan **ilk kez** çalar ve kasaba kalıcı **Altın Çağ** unvanını alır:
  - Kule saati **her sabah 08:00 ve akşam 18:00'de** çalar: çan odasından yayılan altın ses dalgaları ve yükselen notalar
    (`rendering/ChimeWaves.js`), çan ve kule ezgisi. Sesi duyan (uyanık, seferde olmayan) sakinlerin yorgunluğu azalır
    (enerji +12, keyif +4), başlarında çan balonu çıkar. (Kule 07:00-22:00 arası saat başı da çalmaya devam eder.)
  - **Çalışma şevki kalıcı +%10** (bütün iş ve inşaat hızı).
  - **Kasaba refahına kalıcı +%10 çarpan** (%100'ü aşmaz; 12. aşamanın +12'si ve gece aydınlatıp ısıtması da sürer).

### Tarihçe Kütüğü (Kasaba Arşivi'nin sekmesi)

`I` / dock'taki **Arşiv** penceresinin üstünde iki sekme vardır: **Kasaba Arşivi** (grafikler, tarih, usta işi eserler) ve
**Tarihçe Kütüğü**. Kütük, parşömen bir berat gibi kasabanın gurur tablosunu altın harflerle gösterir ve istenildiği an açılır:

- **Kurucu Sakinler:** kasabayı ilk kuranlar;
- **İlk Evlenen Çift** (günüyle);
- **İlk Usta Eseri:** ilk usta işi eseri yapan zanaatkâr ve eser;
- **Ulu Saat Kulesi:** üç aşamanın tamamlandığı günler ve **baş usta** (en çok emek veren; kule yükselirken "şu an en çok emek
  veren" gösterilir);
- **Altın Çağ:** başladığı gün, kule saatinin kaç kez çaldığı, kitaplıktaki antik kitaplar.

Eski kayıtlarda kütük yüklenince doldurulur: kurucular ilk sakinlerin anısından (yoksa en eski kimlikli yetişkinlerden), ilk
çift en eski evlilikten, ilk eser vitrinin ilk eserinden çıkarılır.

### Prestij peyzajı ve gezgin bilgeler

- Altın Çağ'da İnşa menüsünün **Peyzaj & Dekorasyon** sekmesinde iki yeni yapı açılır:
  - **Mermer Çeşme** (2x2; Taş 80, Altın 250): altın kuşaklı beyaz mermer havuz, fışkıran sütun (dört kare animasyon);
    estetik puanı 6 (kasabanın en şık süsü), yanından geçenlerin keyfi dolar.
  - **Altın Çağ Feneri** (1x1; Demir 4, Altın 80): altın taçlı fener; 18:30-06:30 arası 96 piksellik altın ışık yayar,
    karanlıkta ürkmeyi önler, altında yürüyenlerin keyfi yükselir.
- Kasabanın şanı yayıldığı için **gezgin tüccar daha sık gelir** (ziyaretler arası ×0,6) ve altınla iki nadir mal getirir:
  - **Nadir Tohumlar** (120 altın): egzotik üzüm fidesi (bir Üzüm Asması dikilir);
  - **Antik Kitaplar** (150 altın): Bilgelik Evi'nin kitaplığına girer; her kitap araştırmaları kalıcı **%5** hızlandırır
    (en çok 5 kitap, +%25).

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 428; 44'ü bu aşamanın): kulenin adı ve açılışı (Köy'de kapalı, Kasaba'da 20 sakin),
  üç aşamanın adları ve malzemeleri, Yapı Ustası / usta zanaatkâr katkısı (Kalfa ×1,25, Usta ×1,6, yanlış meslek ×1), Gövde
  bitince 8 dişli ihtiyacı, atölyenin önce dişli dökmesi ve dişlinin stoğa girmesi, dişlisiz Mekanizma'nın başlatılamaması,
  gerçek aşama işi (usta zanaatkâr hızlandırır, emek Tarihçe'ye yazılır, çekiç balonlu kule görevi), Altın Çağ'ın başlangıcı,
  çalışma şevki ve refah +%10, 08:00 / 18:00 çanı (09:00'da çalmaz; duyanların enerjisi dolar), ses dalgası çizimi, Çağ
  Kutlaması (meydanda başlar, sakinler koşar, keyif dolar, biter, anı yazılır, oyun sürer), prestij yapılarının kilidi, kurulumu,
  ışığı ve görselleri, tüccarın nadir malları ve sıklığı, antik kitabın araştırma çarpanı, Tarihçe'nin satırları ve Arşiv'deki
  sekmesi (altın harfler, sekmeler arası geçiş), kayıt sürümü 17 gidiş-dönüşü. 12. aşamanın harika testleri yeni kurala göre
  güncellendi.
- **Denetim** (`audit.mjs`, 92): Çağ Kutlaması sürerken kayıt -> yükleme durum kayması yok, kutlama aynen döner, bir kez biter
  ve Altın Çağ sürer.
- **Uyumluluk** (`compat.mjs`, sürüm 2-17, 282): `save-v17.json` bu aşamanın otopilotuyla 34 günlük oyundur (kule G26 / G28 /
  G31, baş usta Atlas, Altın Çağ G31, 3 antik kitap). Tamamlanmış kulesi olan v14 ve v15 kayıtları Altın Çağ'a sessizce girer,
  yarım kuleli v13 ve v16 aşamasını korur; her eski kayıtta Tarihçe sakinlerden çıkarılır.
- **Otopilot** (`autopilot.mjs 42 40`): kuleyi Kasaba seviyesi ve 20 sakinle kurup aşama aşama yükseltti (Temel G26, Gövde G28,
  Mekanizma & Çan G31; 8 Kadim Dişli döküldü, 5 sakin emek verdi). Altın Çağ'da 9 günde çan 19 kez çaldı (her gün 2 kez + ilk çan),
  1 Mermer Çeşme ve 2 Altın Çağ Feneri dikildi, 5 antik kitap alındı; takılma 0, kopuk referans 0.
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0,
  sosyal sıkışma 0, sayfa hatası 0. Kule dört kasabada 36 gün içinde tamamlandı (Altın Çağ G29-G31; toplam 50 çan, 4 Çağ
  Kutlaması); iki kasaba 20 sakine ve Kasaba seviyesine geç ulaştığı için kuleyi G35'te başlattı ve koşu bittiğinde hâlâ
  yükseltiyordu (biri Temel'de, biri Gövde bitmiş ve dişli dökerken). Takılan iş ya da sakin yok.
- Sonuç: `tests.mjs` 428/428, `audit.mjs` 92/92, `compat.mjs` 282/282, sayfa hatası yok. **Sanat önizleme**
  (`tools/art-preview.html`): kulenin üç aşaması, zamanla yayılan çan dalgaları, Mermer Çeşme'nin dört karesi, Altın Çağ
  Feneri'nin gündüz / gece hâli, dişli ve çan simgeleri.

## Vatandaşlık: kişisel kese ve çanta, dilekçeler, Yönetim Güveni, isyan ve yağma (21. aşama)

Bu aşama mevcut sistemlerin (karakterler, sosyal yaşam, refah, meslekler, ikilem olayları) üstüne **bağımsız bir katman** olarak
eklendi: hiçbir eski kural değiştirilmedi, yeni sistemler yalnızca olayları dinler ve kendi rastgele sayı üreteçlerini kullanır
(eski kararların sırası bozulmaz). Sayılar `data/citizens.js`'te; mantık `systems/PurseSystem.js` (kese ve çanta),
`systems/PetitionSystem.js` (dilekçeler; saf hesaplar `systems/Petitions.js`), `systems/TrustSystem.js` (güven, isyan, yağma,
yatıştırma; saf yardımcılar `systems/Citizens.js`), kararlar `ai/Brain.js`'tedir. Sakin varlığı `entities/Character.js`'tir
(oyunda ayrı bir `Resident.js` yoktur; kese ve çanta oraya eklendi).

### Kişisel kese ve çanta

- Her sakinin ekipman yuvalarından (alet, kıyafet, çanta) **bağımsız** bir kesesi (`coins`) ve çantası (`inventory`) vardır.
  Çanta **4 yuvalıdır**; Sırt Çantası kuşanan yetişkinde 6, çocukta 2 (ekipman yalnızca okunur, değişmez). Her yuvada tek tür
  eşya istiflenir: Ekmek (6), Börek (4), Erzak (12), Meyve (4), Şifalı Ot (3), adlı Hatıra (1), Odun Demeti (15).
- **Başlangıç harçlığı:** yeni yetişkin 12, çocuk 3 altın (eski kayıtlarda da).
- **Yevmiye** kasaba hazinesinden ödenmez (gelecekteki vergi / haraç sistemlerinin altyapısı): biten her vardiya +1, bitirilen
  hasat işi (ağaç, kaya, çalı) +1, şantiye / yükseltme / onarım +2, usta işi eser +15. Çocuklar yevmiye almaz.
- **İş yerinden pay:** vardiya sonunda olasılıkla fırıncı bir ekmek, bahçıvan meyve, şifacı bir demet şifalı ot, balıkçı erzak
  alır. Kaynaklı paylar kasaba stoğundan düşülür (stok azken alınmaz); hiçbir şey yoktan ya da boşa gitmez.
- **Alışveriş:** boş zamanında kesesi ve çantasında yeri olan sakin (günde en çok bir kez) Pazar Yeri'ne gider: hastaysa şifalı
  ot, hiç hatırası yoksa kendine bir hatıra (Boncuk Kolye, Oymalı Tahta At… anısına yazılır), çantası boşsa meyve alır. Handa
  yemekten sonra pişmiş bir porsiyonu azık (Börek) olarak alabilir. Harcanan para esnafa gider, hazineye girmez.
- **Çantadan tüketim:** acıkan sakin çantasında yiyecek varsa yürümeden yer ("Çantasından ekmek çıkarıp yiyor"; çok açken her
  zaman, değilse yarı yarıya), üşüten şifalı otu demler (hastalığın kalan süresi %40 kısalır), keyfi düşen hatırasına bakar.
- **Karakter Detay Kartı → Kişisel Kese & Çanta:** kesedeki altın, çantanın yuvaları (simge ve adet; üzerine gelince ne işe
  yaradığı) ve kısa liste; isyancıysa kırmızı "İsyancı" / "Yağmada" etiketi.

### Vatandaş istekleri / dilekçeler

İkilem olaylarından (DilemmaSystem) bağımsızdır; oyunu durdurmaz. 2-3 günde bir (09:00-17:00) bir yetişkin huyuna, mesleğine ve
kasabanın eksiğine göre yöneticiden bir şey ister; başında **parşömen balonu** çıkar, bildirim ve Kasaba Günlüğü'ne düşer, üst
çubuğun altındaki durum çiplerinde görünür (tıklayınca sakin seçilir). Aynı anda en çok 2 açık dilekçe olur.

| Dilekçe | Kim ister? | Nasıl karşılanır? | Hemen Karşıla |
|---|---|---|---|
| Evimin yakınına bir fidan | Doğa Tutkunu (en çok), evi olan herkes | Evinin 7 karo yakınına süs fidanı / kiraz | **Fidanı Dik** (Odun 2, Yiyecek 2) |
| Sokağımıza fener veya bank | Herkes (Hayvansever daha çok) | Evinin yakınına fener ya da bank | **Bank Koy** (Odun 4) |
| Bilgelik Evi / yeni araştırma / antik kitap | Kitap Kurdu | Bilgelik Evi kurmak, araştırma başlatmak, tüccardan kitap almak | — |
| Kışlık odun ve yiyecek stoğu | Oduncu, taşçı, madenci; sonbahar ve kışta herkes | Odun ve yiyecek değeri hedefe çıkınca | — |
| Bana sağlam bir alet | Meslek sahibi (dış işçiler daha çok) | Sağlam Alet kuşanınca | **Aleti Ver** (depodaki alet ya da Demir 4, Odun 3) |
| Meydanda buluşma | Müzisyen (en çok) | Toplanma Zili ya da şenlik | **Zili Çal** |

- Karakter kartının üstündeki parşömen kutusunda istek, ne yapılması gerektiği (stokta "Odun 40/120 · Yiyecek 90/120"), kalan
  süre ve **Kabul Et** (yarım gün ek süre, güven +1) / **Hemen Karşıla** / **Reddet** düğmeleri vardır. Meydan havuzunun ve
  Belediye Konağı'nın panelinde açık dilekçelerin listesi durur.
- Süre 2,5 gündür. **Yerine getirilirse:** güven +6 (kabul edilmişse +8), sakinin keyfi +20, Yaşam Günlüğü'ne olumlu anı
  ("Yöneticiye ilettiği dileği yerine getirildi: fidan"), kasabaya bir günlük **Sesimiz Duyuldu** (+3 refah) bonusu.
  **Reddedilirse:** güven −5, keyif −12, olumsuz anı. **Süresi dolarsa:** güven −6 (söz verilip tutulmadıysa −3 daha), keyif −15.

### Yönetim Güveni ve isyan

- **Yönetim Güveni / Asayiş** (`trust`, 0-100, başlangıç 75) refahla paralel çalışır; refah hesabına dokunmaz. Üst çubukta refah
  çubuğunun altında ince ikinci bir çubuk ve küçük bir kalkan olarak görünür (üzerine gelince yüzdesi ve kuralları); %50'nin
  altına inince durum çiplerinde "Güven %42" uyarısı çıkar.
- Saat başı kasabanın ortalama refahına göre değişir: %70 üstü +0,25, %55-70 +0,1, %35-55 sabit, %25-35 −0,5, %25 altı −0,8.
  Açlıktan kıvranan her sakin (tokluk < 10) −0,06 (en çok −0,6), kışın odun bitip evler soğuyunca −0,3. Akşam şenliği +4, mevsim
  festivali +6, Büyük Ziyafet +8, Altın İkramiye +6, Toplanma Zili günde bir +2 (isyanda +4), evlerin soğuması −3.
- **İsyan:** güven ya da refah **12 saat boyunca %25'in altında** kalırsa çıkar. En mutsuz yetişkinler (en az 2, en çok %60)
  işlerini bırakır; gündüz (08:00-20:00) meydan havuzunun başında öfkeyle toplanır (kızgın ve meşale balonları, "Meydanda öfkeyle
  yönetime bağırıyor"), Kasaba Günlüğü'ne "ALARM · İsyan çıktı!" düşer, üst çubukta kırmızı isyan çipi yanıp söner. Yemek ve uyku
  önce gelir; şenlik, kutlama ve toplanma zili isyandan önce gelir. Öfkesi artanlar 6 saatte bir isyana katılır.
- **Yağma:** isyan sürerken 3 saatte bir en çok 3 isyancı Kiler'e (erzak ve odun; Belediye Konağı yoksa hazine), Fırın'a (ekmek)
  ya da Belediye Konağı'na (hazine) yürür. Yağmalanan mal **kaybolmaz**: kasaba deposundan düşülen erzak, ekmek ve odun birebir
  yağmacıların çantalarına (Erzak, Ekmek, Odun Demeti), altın da keselerine geçer (çantadaki yer kadar; kişi başı en çok 12 erzak,
  6 ekmek, 15 odun, 40 altın). Günlüğe "ALARM · Yağma: … Kiler yapısını yağmaladı; 24 yiyecek, 30 odun … yağmacıların çantalarına
  geçti" yazılır.
- **Yatıştırma:** meydan havuzunun ya da Belediye Konağı'nın panelindeki **Yönetim Güveni** bölümünden **Erzak Dağıt** (sakin başı
  2 yiyecek değeri, herkesin tokluğu +30, güven +10) ve **Altın Dağıt** (yetişkin başı 8 altın keselere, güven +12; ikisi de 12 saatte
  bir), şenlik / festival, Toplanma Zili ya da dilekçeleri karşılamak. Güven %35'in üstüne çıkıp refah %25'in üstündeyken isyan
  biter ("İsyan yatıştı"), isyancılar işlerinin başına döner, anılarına "Kasabadaki isyana katıldı" düşer.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 499; 71'i bu aşamanın): başlangıç harçlığı, çanta yuvaları (4 / Sırt Çantası'yla 6 / çocukta
  2), istif ve taşma, gerçek bir vardiyanın yevmiyesi, inşaat / hasat / usta eseri ödülü ve hazinenin değişmemesi, fırıncının ekmek
  payının kasaba stoğundan gelmesi, şifacının ot payı, çantadan yeme planı ve gerçek yeme (tokluk, sayaç, durum metni), şifalı ot
  çayı, pazar alışverişi ve hatıra anısı, pazara gitme kararı, han azığı, Kişisel Kese & Çanta kartı; huy ve mesleğe göre dilekçe
  seçimi, dilekçenin oluşması (balon, günlük, bildirim, süre), sakin başına tek dilekçe, karttaki parşömen kutusu ve düğmeleri,
  üst çubuk çipi, kabul (+yarım gün, güven +1), "Fidanı Dik" ile karşılama (güven, keyif, olumlu anı, Sesimiz Duyuldu), karttaki
  "Reddet" düğmesi, süre dolması (sözü tutulmayan ek ceza), kışlık stok hedefi, "Aleti Ver", "Zili Çal", 2-3 günlük aralık;
  güvenin refah, açlık, soğuk ve şenlikle değişmesi, üst çubuktaki güven çubuğu ve ipucu; isyanın 12 saatlik eşiği, isyancı
  sayısı, ALARM günlüğü, isyancının işe gitmeyip meydanda toplanması, isyan çipi; gerçek bir Kiler baskını, yağmalanan erzak ve
  odunun kasaba deposundan birebir yağmacının çantasına geçmesi, çanta sınırı, Belediye Konağı'ndan hazinenin keseye geçmesi,
  yağmanın günlüğe ve anılara yazılması; erzak ve altın dağıtımı (bedel, bekleme süresi), eşiği aşınca isyanın bitmesi ve
  sakinlerin işe dönmesi, kritik refahla da isyan çıkması; kayıt sürümü 18 gidiş-dönüşü (kese, adlı hatıralı çanta, güven,
  isyan sayacı, açık dilekçe).
- **Denetim** (`audit.mjs`, 96): isyan ve yağma baskını sürerken kayıt -> yükleme durum kayması yok; isyan, baskın ve dilekçe aynen
  döner, baskın sonuçlanır, yatıştırılan isyan bir kez biter ve sakinler işe döner. Beş çözünürlükte arayüz yerleşimi yine temiz
  (güven, refah çipinin içinde ince bir çubuk ve kalkan olarak durduğu için 1280 piksellik üst çubuk tek satırda kalır).
- **Uyumluluk** (`compat.mjs`, sürüm 2-18, 333): `save-v18.json` bu aşamanın otopilotuyla 34 günlük oyundur (keselerde 1840 altın,
  çantalarda 81 eşya, 12 dilekçenin 11'i karşılandı, güven %99). Sürüm 2-17 kayıtlarında her yetişkin 12, her çocuk 3 altınla,
  boş çantayla açılır, güven %75'tir; bir gün sonra keseler ve çantalar geçerli, isyan yok.
- **Otopilot** (`autopilot.mjs 42 36`): dilekçelerin fidan, bank, alet ve buluşmayı hemen karşılar, ötekileri kabul edip yerine
  getirir (kışlık stok için ek kesim). 13 dilekçenin 12'si karşılandı, biri süresi dolarak kapandı; güven hiç %75'in altına inmedi,
  isyan 0; 2621 altın yevmiye, 354 alışveriş, 328 kez çantadan yemek; takılma 0, kopuk referans 0, sayfa hatası 0. 20. aşamanın
  metrikleri korundu (kule G27 / G29 / G31, Altın Çağ G31, en düşük ortalama refah %70).
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0, bekleyen
  iş 0, üretmeyen iş yeri 0, sosyal sıkışma 0, sayfa hatası 0. Altı kasabada 78 dilekçe (71 karşılandı, 5 süresi doldu, 0 ret),
  isyan 0, yağma 0, en düşük güven her koşuda %75; 16 962 altın yevmiye, 2128 alışveriş, 1924 çantadan yemek, koşu sonunda
  keselerde 13 118 altın ve çantalarda 471 eşya. Ulu Saat Kulesi altı koşunun altısında tamamlandı (Altın Çağ G29-G34).
- Sonuç: `tests.mjs` 499/499, `audit.mjs` 96/96, `compat.mjs` 333/333, sayfa hatası yok. **Sanat önizleme**
  (`tools/art-preview.html`): yeni simgeler (parşömen, güven kalkanı, meşale, kese, hatıra, fener, yağma çuvalı), yeni balonlar
  (dilekçe, meşale, kese, yağma, öfke), çanta eşyaları ve küçük sahneler (dilekçe veren sakin, pazar alışverişi, çantasından yiyen,
  meydanda isyan, Kiler yağması).

## Krallık: iç vergi ve öşür, Krallık Vergisi, Kraliyet Fermanları ve köyü terk etme (22. aşama)

21. aşamada sakinlerin kesesinde ve çantasında biriken servet artık gerçek bir siyasi ve ekonomik gerilime bağlandı. Bu aşama da
mevcut sistemlerin üstüne ayrı bir katman olarak eklendi: kendi rastgele sayı üreteçlerini kullanır, eski kurallara yalnızca üç
küçük bağlantıyla dokunur (Ağır Vergi'nin çalışma hızı çarpanı ve kötü şöhretin göç şartı `systems/TownStatus.js`'te, Kraliyet
Beratı kilidi `systems/ConstructionSystem.js` / `ui/components/BuildMenu.js`'te). Sayılar `data/crown.js`'te; mantık
`systems/TaxSystem.js` (iç vergi), `systems/CrownSystem.js` (Krallık Vergisi, fermanlar, heykel), `systems/DesertionSystem.js`
(terk ediş), saf hesaplar `systems/Crown.js`'tedir.

### İç vergi ve ayni öşür

Belediye Konağı'nın (Konak kurulmadan önce meydan havuzunun) panelindeki **İç Vergi ve Öşür** bölümünden kademe istendiği an
seçilir:

| Kademe | Kesinti | Her tahsilatta | Sürekli etki |
|---|---|---|---|
| **Vergi Muafiyeti** | %0 | Güven +6, herkesin keyfi +5 | — |
| **Düşük / Adil Vergi** | %10 | Güven +2 | — |
| **Standart Vergi** (varsayılan) | %20 | Güven sabit | — |
| **Ağır Vergi / Haraç** | %45 | Güven −8, keyif −10 | Çalışma hızı −%15 (üst çubukta uyarı çipi) |

- **Tahsilat** her 3 günde bir (3., 6., 9. gün…) öğlen 12:00'de yapılır: yetişkinlerin kesesinden orana göre kesilen altın birebir
  **Kasaba Hazinesi**'ne geçer (çocuklardan ve kesesinde 2 altından az olandan alınmaz). Çantadaki erzak, ekmek ve odun demetinin
  her türünden biri bırakılır, **fazlasından aynı oranla öşür** alınıp kilere konur (kilerde yer kadar; kalan çantada kalır, hiçbir
  şey kaybolmaz). Panel, sıradaki tahsilatı ve tahmini getiriyi ("tahminen +41 altın, 8 vergi veren") ve son tahsilatı gösterir.
- Hazinenin artık erken oyunda da bir geliri var: liman ve ihracattan önce de iç vergi altın getirir.

### Krallık Vergisi ve Kraliyet Tahsildarı

- Kasaba bağlı olduğu Krallığa **her 6 günde bir** (6., 12., 18. gün… öğlen) vergi öder. Tutar sabit değildir:
  `(20 + 15 × seviye + 3 × nüfus) × (Altın Çağ'da 1,5) × itibar çarpanı`. Örneğin 10 sakinli bir Mezra 65, 30 sakinli, Altın Çağ'daki
  bir Gelişmiş Şehir 255 altın (Saygın itibarla ~230) öder.
- **Krallık İtibarı** (0-100, başlangıç 50): Saygın (75+) vergide −%10 indirim ve fermanlarda +%20 ödül alır, Şüpheli (40 altı)
  %20 fazla vergi öder.
- Vergi gününden **2 gün önce Kraliyet Tahsildarı yola çıkar**: bildirim, günlük ve üst çubukta "Tahsildar yolda · 89 altın ·
  1 gün 6 saat" çipi (hazine yetmiyorsa kırmızı). Oyuncu iç vergiyi ayarlayıp hazineyi hazırlayabilir.
- Vakti gelince hazineden ödenir; altın yetmezse **tutarın en çok yarısı malla** (1 altın = 2 birim yiyecek / odun / taş, en bol
  olandan) ödenir. Ödenince güven +3, itibar +8.
- **Ödenemezse** tahsildar hazinedeki bütün altına el koyar, kalan borç için depodan zorla yiyecek, odun ve taş çeker (her birinin
  en çok %40'ı); güven −12, itibar −20, herkesin keyfi −10 ve iki gün boyunca **Kraliyet Cezası** (refah −8). Günlüğe "ALARM ·
  Krallık Vergisi ödenemedi" düşer.

### Kraliyet Fermanları ve Kraliyet Aslanlı Heykeli

Köy seviyesinden itibaren Krallık 4-6 günde bir **3 gün süreli** bir görev gönderir. Fermanın kartı Belediye panelinde ve üst
çubukta durur (ihtiyaç, kalan süre, ödül, **Teslim Et** / **Reddet**). İhtiyaç kasaba seviyesiyle ölçeklenir (k = seviye):

| Ferman | Ne ister? | Ödül |
|---|---|---|
| Sınır Garnizonu İçin Erzak | Ekmek 10k+5, Demir 3k+1 (Fırın ve Maden varsa) | 80k altın + 2 Kadim Dişli |
| Saray Kütüphanesi İçin Bilgelik | Süre içinde bir araştırma tamamlamak (Bilgelik Evi varsa) | 70k altın + Antik Kitap (kitaplık doluysa +100 altın) |
| Saray Hazinesi İçin Usta İşi Eser | Depodaki bir usta işi eser (Krallığa gider) | 90k altın + Nadir Tohum |
| Kraliyet Şöleni İçin Balık ve Şerbet | Yiyecek 25k, Ekmek 5k | 60k altın + Nadir Tohum |
| Kraliyet Tersanesi İçin Kereste ve Taş | Odun 30k, Taş 20k | 60k altın + **Kraliyet Beratı** (berat varsa +100 altın) |

- Teslim edilince itibar +10, güven +4. **Süresi dolar ya da reddedilirse** Krallık 40k altın (hazine yetmezse 15k yiyecek de)
  cezası keser; itibar −12, güven −4.
- **Kraliyet Beratı**, İnşa Et → Peyzaj & Dekorasyon sekmesinde **Kraliyet Aslanlı Heykeli**'nin kilidini açar (2x2; Taş 60,
  Altın 120; kasabada bir tane): mermer kaide üstünde taç giymiş altın aslan, kraliyet armalı altın levha, kırmızı flamalar.
  Estetik puanı 7 (kasabanın en şık anıtı), geniş keyif halesi, **kalıcı +4 refah** ve **saat başı +0,1 Yönetim Güveni**.

### Son aşama çöküş: köyü terk etme ve göç engeli

- Yönetim Güveni ya da refah **%20'nin altında 24 saat** kalır ve isyan yağmaya varmışsa (ya da bir gündür sürüyorsa) umut
  tükenir: günlüğe "ALARM · Umut tükendi", üst çubukta kırmızı **Terk ediş!** çipi.
- 6 saatte bir en mutsuz yetişkin — evliyse eşi ve çocuklarıyla birlikte — "Köyü Terk Etme" kararı alır: elindekini bırakır,
  **kesesini ve çantasını yanına alıp** başında bohça balonuyla harita kenarına yürür ("Bohçasını sırtlamış, köyü terk ediyor";
  kartında gri "Köyü terk ediyor" etiketi) ve kasabadan temelli ayrılır. Günlüğe "Elif kesesindeki 77 altın ve çantasındaki 3
  eşyayla köyden temelli ayrıldı. Geride boş bir ev ve hüzün kaldı" yazılır. Ayrılanın bütün bağları temizlenir (ev, iş yeri,
  eş / ebeveyn bağı, ilişkiler, dedikodu, kutlama, dilekçe, isyan, iş emri).
- Kasabanın kilitlenmemesi için **en az 3 çekirdek sakin her koşulda kalır** (çekirdeğe tek kişilik yer kalınca aile değil yalnızca
  bir bekâr ayrılır).
- **Kötü şöhret ve göç:** göç koşullarına "Kasabanın şöhreti" eklendi (nüfus çipinin ipucunda): güven %35'in altındayken ya da
  terk ediş sürerken göçmen gelmez; %50'nin altındayken sabah en çok 1 göçmen gelir. Güven ve refah toparlanınca terk ediş biter
  ("Kasabaya umut döndü"), göç normale döner.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 561; 62'si bu aşamanın): dört kademenin oranları ve varsayılanı, kademenin istendiği an değişmesi
  ve günlüğe yazılması, Standart Vergi'de her kesenin %20'sinin birebir hazineye geçmesi, öşürün çantadaki fazla erzak ve odundan
  kilere geçmesi (birer tanesi kalır), çocuk ve boş kese muafiyeti, 3 günlük öğlen takvimi, Muafiyet (+6 güven, +5 keyif), Düşük
  (+2), Ağır Vergi (%45, −8 güven, −10 keyif, −%15 çalışma hızı, güveni isyan sınırının altına itmesi), Belediye panelindeki dört
  düğme; Krallık Vergisi'nin seviye / nüfus / Altın Çağ'la ölçeklenmesi, 2 gün önce tahsildar uyarısı (günlük, üst çubuk çipi),
  ödeme (güven +3, itibar +8), tam 6 gün sonraki tahsilat, malla ödeme (1 altın = 2 birim), ödenemeyince hazineye el konması,
  depodan mal çekilmesi, güven / itibar / Kraliyet Cezası; fermanların seviye kilidi, ihtiyacın ölçeklenmesi, Belediye panelindeki
  kart ve düğmeleri, tersane teslimi ve Kraliyet Beratı, beratla açılan Aslanlı Heykel (+4 refah, estetik, saatlik güven),
  garnizon (Kadim Dişli), kütüphane (araştırma şartı, Antik Kitap), saray hazinesi (usta eseri Krallığa, Nadir Tohum), süresi
  dolan ve reddedilen fermanın cezası; kötü şöhretin göçe etkisi (%35 altı durur, %50 altı sabah 1 göçmen, toparlanınca normal);
  terk edişin isyan yağmaya varmadan başlamaması, eşikte başlaması ve göçü durdurması, en mutsuz sakinin bohçasıyla harita
  kenarına yürüyüp kesesi ve çantasıyla ayrılması, kartındaki etiket, günlükteki not, ayrılana işaret eden referans kalmaması,
  evli çiftin ailesiyle gitmesi, çekirdek sakinler, krizin bitişi; kayıt sürümü 19 gidiş-dönüşü.
- **Denetim** (`audit.mjs`, 101): tahsildar yoldayken, ferman sürerken, Ağır Vergi seçiliyken ve bir sakin köyü terk ederken kayıt
  -> yükleme durum kayması yok; hepsi aynen döner, sakin bir kez ayrılır, vergi bir kez ödenir, ferman teslim edilir. Kıtlık kışı
  denetiminde (3 gün boyunca yiyecek ve odun geri alınır) kasabanın 6 sakininden 3'ü bu aşamanın kuralıyla köyü kendiliğinden
  terk etti, 3 çekirdek sakin kaldı; denetim artık bilerek ayrılanları "kaybolan" saymıyor.
- **Uyumluluk** (`compat.mjs`, sürüm 2-19, 388): `save-v19.json` bu aşamanın otopilotuyla 34 günlük oyundur (11 tahsilat, 5/5
  Krallık Vergisi, 5 teslim edilen ferman, itibar %100). Sürüm 2-18 kayıtları Standart Vergi ve itibar 50 ile, vergi takvimi
  kurularak açılır; ferman, berat ve terk ediş yoktur. Sürüm 8-9'un "hazine boş başlar" kontrolü, hazinede yalnızca iç vergiden
  gelen altın olmasına göre güncellendi (iç vergi artık erken oyunda da hazineye gelir getirir).
- **Otopilot** (`autopilot.mjs 42 36`): kademeyi güvene göre yönetir (güven %40 altında Muaf, %62 altında Düşük, yoksa Standart;
  Ağır Vergi'ye hiç geçmez), tahsildar yoldayken hazineyi lüks harcamaya açmaz, fermanı kaynak yettiğinde teslim eder. 12 tahsilat
  (+1304 altın), Krallık Vergisi 6/6 ödendi, ceza 0, itibar %100, 5 ferman teslim edildi (1'i süresinde yapılamadı), terk eden 0;
  takılma 0, kopuk referans 0, sayfa hatası 0. Önceki aşamaların metrikleri korundu (kule G26 / G28 / G29, en düşük ortalama refah
  %70, isyan 0).
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0, bekleyen
  iş 0, üretmeyen iş yeri 0, sosyal sıkışma 0, sayfa hatası 0. Altı kasabada 72 iç vergi tahsilatı (+7445 altın), Krallık Vergisi
  36/36 ödendi (ceza 0), 29 ferman teslim edildi (3'ü başarısız), 3 kasaba Kraliyet Beratı alıp Aslanlı Heykel'i dikti, itibar her
  koşuda %100; isyan 0, terk eden 0, en düşük güven %75. Ulu Saat Kulesi altı koşunun altısında tamamlandı.
- Sonuç: `tests.mjs` 561/561, `audit.mjs` 101/101, `compat.mjs` 388/388, sayfa hatası yok. **Sanat önizleme**
  (`tools/art-preview.html`): Kraliyet Aslanlı Heykeli, yeni simgeler (tahsildar, ferman, taç, heykel, bohça), yeni balonlar
  (bohça, tahsildar, ferman) ve küçük sahneler (heykel önünde sakinler, Belediye Konağı önünde tahsildar, bohçasıyla köyü terk eden).

## Yönetilebilir krizler: yangın ve itfaiye, Su Kuyusu, Gözcü Kulesi, haydut baskınları, hasar ve tamir (23. aşama)

22. aşamada kurulan siyasi baskının yanına bu kez **doğadan ve dışarıdan gelen tehlikeler** eklendi. İlke değişmedi: bu oyunda **Game
Over, bina silinmesi ya da sakin ölümü yoktur**. Yanan ya da yağmalanan yapı haritadan silinmez, yalnızca **hasarlı** olur ve
onarılana kadar çalışmaz; yangında ya da baskında darbe alan sakin ölmez, **hafif yaralı** olur ve Şifacı Kulübesi'nde (ya da evinde)
iyileşir. Bu aşama da mevcut sistemlerin üstüne ayrı bir katman olarak eklendi: **kendi tohumlanmış rastgele sayı üretecini**
(`seed + 26`) kullanır, oyunun ana üretecine hiç dokunmaz. Sayılar `data/crisis.js`'te; mantık `systems/CrisisSystem.js`'te (durum
değiştirir), saf hesaplar `systems/Crisis.js`'tedir. Hasar için eskiden fırtınanın kullandığı `building.damaged` bayrağı yeniden
kullanıldı (`building.isDamaged` aynı bayrağın adıdır) ve onarım için eski `mend` projesi korundu.

### Tehlike Sıklığı (Ayarlar)

**Ayarlar** penceresinde (ve kayıtta, `state.crisis.difficulty`) üç seçenek vardır; yeni haritada da seçim hatırlanır:

| Seçenek | Çarpan | Etki |
|---|---|---|
| **Huzurlu** | 0 | Kendiliğinden yangın ve haydut baskını hiç çıkmaz (testler ve `--crisis huzurlu` yine fonksiyonla zorlayabilir) |
| **Dengeli** (varsayılan) | 1 | Ara sıra bir yangın (yazın daha olası), 8-10 günde bir haydut izi |
| **Çetin** | 1,5 | Yangınlar ve baskınlar %50 daha sık |

**Erken oyun ve uyumluluk koruması:** doğal yangın **8. günden**, haydut izi **10. günden** önce çıkmaz. Bir kayıt yüklendiğinde (ya da
sayfa yenilendiğinde), kayıtta aktif bir kriz (yanan yapı ya da bekleyen baskın) yoksa **ilk 24 oyun saatinde** doğal kriz çıkmaz; bu
süre kayda girmez, bu yüzden kayıt -> yükleme gidiş-dönüşünde durum kaymaz.

### Su Kuyusu (`well`, Köy seviyesi)

- 1x1, **15 odun + 25 taş** (Yapılar sekmesi, "Güvenlik" kategorisi); taş halkalı, çıkrıklı, kiremit çatılı, su parıltılı sanat.
- Çevresindeki **8 karoluk** alanda yangın çıkma ihtimalini **%80 azaltır** (×0,2); yangında **kova zinciri** buradan su taşır ve
  yangın 4 yerine **3 kovada** söner. **4 karo** yakınındaki bahçeler sulanır: **+%10 verim**. Estetiğe küçük katkı verir (1,5).

### Gözcü Kulesi (`guardTower`, Kasaba seviyesi) ve Kasaba Bekçileri

- 2x2, **50 odun + 45 taş + 12 demir**; ahşap korkuluklu nöbet köşkü, kemerli kapı, kiremit çatı ve flama (gece penceresi ve feneri
  yanar; çevresindeki karanlık korkusunu giderir: `DARKNESS.lights`).
- **Asayiş ve gözetleme:** ayakta olduğu sürece **Yönetim Güveni**'ne saat başı **+0,2** (nöbetteki her bekçi için +0,1 ek) verir.
- **Kasaba Bekçisi:** kule bir iş yeridir (`workActivity: 'patrol'`): **1 yetişkin** (kasabada en az 12 sağlam yetişkin varsa **2**) gündüz
  mesaisinde kulenin önünde nöbet tutar ("Kasaba bekçisi: Gözcü Kulesi önünde nöbet tutuyor"). Nöbet, üretim yuvaları dolunca boşta
  kalan yetişkinlerin işidir (üretimden düşük öncelikli); oyuncu **İşçi Ata / Sabitle** ile belirli bir sakini bekçi yapabilir.
  Bekçiler yangında koşacakların başında gelir, baskın savunmasının çekirdeğidir.
- Haydut baskınını **2 gün önceden** haber verir (kulesiz 1 gün).

### Yangın ve itfaiye

1. **Çıkış:** 8. günden sonra her gün 14:00'te her sağlam yapı için tür, mevsim, tehlike sıklığı ve kuyu etkisiyle bir olasılık
   yoklanır (tabloda Dengeli, günlük): Değirmen-Fırın ve Zanaat Atölyesi %3, Demir Madeni %1,5, Oduncu %0,8, Pazar / Şifacı / Ağıl %0,6,
   Bahçe %0,4; yazın ×1,8, ilkbaharda ×0,7, kışın ×0,9; yakında Su Kuyusu varsa ×0,2; Çetin'de ×1,5. Aynı anda en çok bir doğal yangın çıkar.
2. **Belirtiler:** yapı `isBurning` olur, `fireProgress` 0'dan başlar; üstünde alev dilleri, duman, zıplayan alev simgesi ve kırmızı
   ilerleme çubuğu görünür (alevler ilerlemeyle büyür); Günlük'e, bildirime ("🔥 … yangın çıktı!") ve üst çubuğun altına
   **"… yanıyor · %57"** çipi düşer (tıklayınca yapıyı seçer). Yanan yapı çalışmaz, çalışanları işi bırakır.
3. **İtfaiye:** yanan yapıya en yakın **en çok 4** sağlam, uyanık yetişkin (önce bekçiler) işi bırakıp en yakın **Su Kuyusu'na**
   (yoksa nehir kıyısına) koşar, başında su kovası balonuyla kovasını doldurur (`fetchWater`), yanan yapıya boşaltır (`fightFire`).
   Her kova yangını 12 puan geriletir; **4 kova** (kuyu yakınsa **3**) atılınca yangın **hasarsız söner**: Güven **+2**, kova atanlara
   "Yangını el birliğiyle söndürdük" anısı. Yangın %40'ı geçtikten sonra atılan her kovada %6 olasılıkla atan sakin hafif yaralanabilir.
4. **Acil Söndür (Kova Zinciri):** yanan yapının panelindeki düğme yangını anında, hasarsız söndürür (Güven +2).
5. **Söndürülemezse:** yangın 6 oyun saatinde (%0 -> %100) tam yanar; yapı **hasarlı** olur (`isDamaged`, hasar nedeni "yangın"),
   **haritadan silinmez**, Güven −2. Hasarlı yapının üstünde kırık-çekiç simgesi durur ve üretim durur.

### Hasar ve tamir

- **Tamir Et:** hasarlı yapının panelindeki düğme **inşa maliyetinin %25'iyle** (yalnızca odun ve taş, en az 1) yapıyı **anında**
  onarır; fırtına hasarına da uygulanır. Süren bir onarım projesi varsa iade edilir.
- **Ustalar otomatik onarır:** yangın ya da baskın hasarından **2 saat sonra** depoda kaynak varsa boştaki inşaatçılar kısa bir
  onarım işini (`buildWork: 60`, maliyet %25) kendiliğinden başlatır. Fırtına hasarı eski kurala bağlıdır (oyuncu başlatır, %30).
- Üst çubuğun altında **"N hasarlı yapı"** çipi; onarılınca günlüğe yazılır ("… yangın hasarından onarıldı").

### Haydut baskınları: üç çözüm yolu

**Erken uyarı:** 10. günden itibaren (ilki 10. gün 10:00, sonra 8-10 günde bir; Çetin'de daha sık) "Ormanda haydut izleri görüldü"
uyarısı gelir; üst çubukta geri sayımlı **"Haydut izleri · 48 sa"** çipi çıkar. Baskın kulesiz **1 gün**, Gözcü Kulesi varsa **2 gün**
sonra gelir. Çipe (ya da Gözcü Kulesi / Belediye / meydan paneline) tıklayınca **Haydut Baskını** penceresi açılır:

| Seçenek | Koşul | Sonuç |
|---|---|---|
| **A · Bekçilerle Püskürt** | Kule ayaktaysa en az 2 sağlam yetişkin; kulesiz en az 4 sağlam yetişkin ve depoda sağlam alet | Kaynak kaybı 0, Güven **+6**, hazineye **15-25 altın** ganimet, 24 saat "Haydutlar Kovuldu" refah bonusu (+4), savunmacılara ve dedikoduya "Haydutları kasabadan kovduk"; savunmacılardan biri **hafif yaralanabilir** (kulesiz %50, kuleyle %30) |
| **B · Haraç Öde** | Hazinede haraç (**25-40 altın**; yoksa kilerde 2 katı yiyecek) | Hasar yok, yaralı yok, Güven **−2** |
| **C · Hazırlıksız Yakalan** | Her zaman seçilebilir; karar verilmezse ve savunma yetmiyorsa kendiliğinden olur | Altının ve yiyeceğin **en çok %15'i** çalınır (asla tamamı değil, odun ve taşa dokunulmaz), kasaba merkezine en uzak **1 sınır yapısı hasarlı** olur, Güven **−8** |

Süre dolunca karar verilmediyse savunma yetiyorsa **A**, yetmiyorsa **C** uygulanır (oyun hiçbir pencerede durmaz). Baskın çözülünce
sıradaki iz 8-10 gün sonraya kurulur.

### Hafif yaralanma ve Şifacı

- `Character.isInjured` ve `injuryTimer` (kalan oyun dakikası) eklendi; yaralı sakin **%20 yavaş yürür ve çalışır**
  (`healthWalkMultiplier` / `healthWorkMultiplier`), Karakter Detay Kartı'nda **"🩹 Hafif Yaralı"** etiketi (kalan süre) görünür, üst
  çubukta "N hafif yaralı" çipi çıkar. Çocuklar yaralanmaz, kimse ölmez.
- Yaralı sakin boş zamanında **önce Şifacı Kulübesi'ne** gider (`tendWound`); vardığında yaraları sarılır, keyfi +10 artar, Yaşam
  Günlüğü'ne "Şifacıda yaraları sarıldı" yazılır. Kulübe yoksa çantasındaki şifalı otu demler ya da evinde kestirir (uyurken iki kat
  hızlı iyileşir); hiçbiri olmasa da **1,5 günde (36 saat)** kendiliğinden geçer.

### Kayıt (sürüm 20)

Sürüm 20'ye `crisis` (tehlike sıklığı, sıradaki haydut izi, bekleyen baskın, sayaçlar, son olaylar), binalara `isBurning`,
`fireProgress`, `fireWater`, `isDamaged` (`damaged` ile aynı), `damageKind` (`storm` / `fire` / `raid`), `damagedAt` ve sakinlere
`isInjured`, `injuryTimer` eklendi. 2-19. sürüm kayıtlarında hiçbir yapı yanmaz / hasarlı değildir, kimse yaralı değildir, tehlike
sıklığı Dengeli'dir; ilk yükleme gününde kriz çıkmaz. Yanan yapı ve bekleyen baskın kaydedilip yüklenince aynen sürer ve bir kez sonuçlanır.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 670; 109'u bu aşamanın): üç tehlike sıklığı (çarpanlar, varsayılan, Ayarlar düğmeleri ve vurgusu,
  Huzurlu'ya geçince bekleyen baskının silinmesi), doğal kriz kapıları (8. gün yangın, 10. gün haydut, Huzurlu hiçbir şey), Su Kuyusu
  (Köy kilidi, maliyet, yangın ihtimalinin ×0,2'ye inmesi, 8 karo sınırı, Çetin ×1,5, 4 karo yakınındaki bahçeye +%10), Gözcü Kulesi
  (Kasaba kilidi, saatlik güven, 1-2 bekçi yuvası, geceleri aydınlatma, nöbetin gerçekten tutulması), baskının kulesiz 1 / kuleyle 2 gün
  önceden duyurulması ve üst çubuk çipi, savunma koşulları, üç çözüm yolunun sayıları (A: kayıpsız, +6 güven, 15-25 altın, anı,
  dedikodu, bonus; B: altınla ve erzakla haraç, -2 güven, hasarsız; C: en çok %15, asla tamamı değil, 1 sınır yapısı hasarlı, -8 güven),
  reddedilen seçimler, karar verilmezse A / C'nin kendiliğinden uygulanması, Haydut Baskını penceresi ve Gözcü Kulesi paneli; yangının
  çıkışı, çip, yayılması, "Acil Söndür", kuyusuz 4 / kuyulu 3 kova, sakinlerin gerçekten su alıp yangına koşması (kuyudan ve nehirden),
  söndürülemeyen yangının yapıyı hasarlı yapıp SİLMEMESİ, kova taşıyanların başında kova balonu; Tamir Et (maliyetin %25'i, kaynak
  yetmezse red, panel düğmesi), ustaların 2 saat sonra kendiliğinden onarması, fırtına hasarının eski kurala bağlı kalması; hafif
  yaralanma (süre, -%20 hız, kart etiketi, üst çubuk çipi, çocukların yaralanmaması, kendiliğinden / şifacıda / şifalı otla iyileşme,
  anı); **ana rastgele sayı üretecinin ve `Math.random`'un hiç tüketilmemesi**; doğal takvim ve yükleme sonrası 24 saatlik koruma;
  yeni sanat ve simgeler; kayıt sürümü 20 gidiş-dönüşü (yanan yapının ilerlemesi, hasarlı yapı, yaralı sakin, bekleyen baskın, sayaçlar)
  ve v19 kaydının sorunsuz açılması.
- **Denetim** (`audit.mjs`, 108; 7'si bu aşamanın): yangın sürerken, haydut izi beklerken, hasarlı yapı ve yaralı sakin varken kayıt ->
  yükleme durum kayması yok (kayıt tek başına kriz koruması için bir alan yazmaz); yüklenen yangın, hasarlı yapı, yaralı sakin ve baskın
  aynen döner, yangın tam bir kez sonuçlanır, baskın varışta bir kez çözülür, hasar onarılır, yaralı iyileşir.
- **Uyumluluk** (`compat.mjs`, sürüm 2-20, 447; 59'u bu aşamanın): `save-v20.json` bu aşamanın otopilotuyla 34 günlük oyundur (Su Kuyusu,
  Gözcü Kulesi, 5 yangın, 3 baskın ve kayıt anında bilerek kurulan bir yanan yapı, bir hasarlı yapı, bir yaralı sakin ve bekleyen baskın:
  bütün kriz alanları kayda girer). Sürüm 2-19 kayıtları hiçbir yapı yanmadan / hasarlı olmadan, kimse yaralı olmadan, Dengeli ayarla
  açılır; yükleme sonrası ilk 24 oyun saatinde (bir gün yaşatılırken) doğal yangın ya da baskın çıkmaz, sayaçlar değişmez.
- **Otopilot** (`autopilot.mjs 42 36`): kasabaya (Köy seviyesinde) ateşli yapıların yanına bir **Su Kuyusu**, (Kasaba seviyesinde) meydandan
  uzağa bir **Gözcü Kulesi** diker (meydana yakın boş yerleri büyük yapılara bırakır); yangın yarıyı aşarsa "Acil Söndür" der, hasarlı yapıyı
  hemen "Tamir Et" ile onarır, haydut izi gelince savunma yetiyorsa püskürtür, yetmiyorsa haraç öder. 5 yangının 5'i söndürüldü (hasar
  bırakan 0), 3 baskının 1'i püskürtüldü, 2'sinde haraç ödendi; bekçiler 88 nöbet vardiyası tuttu; takılma 0, kopuk referans 0, sayfa hatası 0.
  Ulu Saat Kulesi aşamaları G25 / G27 / G28 (22. aşamada G26 / G28 / G29), Altın Çağ G28.
  - **Ana üreteç yalıtımı (KURAL 1) kanıtı:** `autopilot.mjs 42 36 --crisis huzurlu --no-safety` (kriz kapalı, kuyu / kule / yeni politikalar
    kapalı) 22. aşamanın koşusuyla **bire bir aynıdır**: 288 günlük özet satırının ve bütün raporun farkı 0 (kule G26 / G28 / G29,
    Altın Çağ G29, aynı evlilikler, aynı stoklar). Yani kriz katmanı ana rastgele sayı üretecini ve eski davranışı bozmaz; varsayılan
    (Dengeli) koşuda görülen gün kaymaları yeni oynanıştan (Su Kuyusu, Gözcü Kulesi, kovaya koşan sakinler, hasar ve tamir) gelir.
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0, bekleyen iş 0,
  üretmeyen iş yeri 0, sosyal sıkışma 0, sayfa hatası 0. Altı kasabada 18 yangın çıktı, 18'i söndürüldü (hasar bırakan 0); 21 haydut
  baskınının 10'u püskürtüldü, 11'inde haraç ödendi (hazırlıksız yakalanma 0); 1 sakin yaralandı ve şifacıda iyileşti; 3 tamir yapıldı;
  koşu sonunda hasarlı / yanan yapı 0; 6 Su Kuyusu ve 6 Gözcü Kulesi kuruldu. **Ulu Saat Kulesi altı koşunun altısında tamamlandı**
  (Altın Çağ G31, G34, G31, G28, G35, G34; 22. aşamada G29-G34), en düşük güven her koşuda %75, isyan 0, terk eden 0, Krallık Vergisi
  35/35 ödendi, 29 ferman teslim edildi.
- **Bekçi düzeltmesi:** `monitor.mjs` artık bir sakini yalnızca aynı karoda **ve** kıpırdamadan (≤4 piksel) 150 dakika kaldıysa takılmış
  sayar. Her saat başı meydan kavşağından geçen uzun bir yürüyüş buçuk saat örneklerinde hep aynı karoda yakalanıp yanlışlıkla "takıldı"
  sayılabiliyordu (tohum 13, G15: Duru 19 yol noktalı yürüyüşünü normal sürdürüyordu). Bekçi ayrıca yanan yapıyı (100'ü aşan ilerleme,
  hem yanan hem hasarlı, bitiş vaktini aşan yangın), hasar nedenini, yaralı sakinin süresini, varış vaktini aşan baskını ve nöbetçi
  sayısını denetler; yangın, baskın, yaralanma ve tamir sayılarını raporlar.
- Bulunan ve giderilen hatalar (koşular sırasında): kovayı dolduran sakin yangından uzaklaştığı için sorumlu listesinden düşüp kovasını
  atamıyordu (yangın hep hasarla bitiyordu); itfaiyeciler artık "sadık" atanır (yangına koşan, görevde kalır). Kayıt -> yükleme
  gidiş-dönüşünde kriz koruması durum kaymasına yol açıyordu: bu süre artık sahne kurulurken hesaplanır, kayda girmez. `crisis:raidResolved`
  yükünde `damaged` alanı, test günlüğünün fırtına olayı yorumlayıcısıyla çakışıyordu; `damagedId` oldu. Kraliyet Aslanlı Heykeli'nin derinlik
  sıralama değeri eksikti (`NaN`); eklendi.
- Sonuç: `tests.mjs` 670/670, `audit.mjs` 108/108, `compat.mjs` 447/447, sayfa hatası yok. **Sanat önizleme** (`tools/art-preview.html`):
  Su Kuyusu (üç su karesi), Gözcü Kulesi (gündüz / gece / kış), alev ve duman (%25 / %60 / %95), yeni simgeler (alev, kova, kalkan, haydut,
  bandaj, tamir), yeni balonlar ve küçük sahneler (kova zinciri, hasarlı / onarılmış yapı, nöbetteki bekçi, baskın ve savunma, yaralı).


## Tarımsal çeşitlilik: ekim tercihi, Keten ve Şerbetçiotu, Ürün Silosu (24. aşama, 24.1 mikro adımı)

24. aşama kasabanın ekonomisini **hammadde → işleme → ihracat** zincirine genişletiyor ve üç mikro adımda gelecek. Bu ilk adım
(24.1) yalnızca **tarla mahsul seçimini ve depolama katmanını** kurar; Keten ve Şerbetçiotunu işleyecek atölyeler (24.2) ve
ihracat iskelesi (24.3) sonraki adımlardır. Bu yüzden Keten ve Şerbetçiotu şimdilik yalnızca birikir. Kurallar `data/crops.js`'te,
saf hesaplar `systems/Granary.js`'te (mahsul, üretim tanımı, kaynak başına depo sınırı, bozulma miktarı), olaylar ve saatlik
bozulma `systems/GranarySystem.js`'tedir. Katman **rastgelelik kullanmaz**, oyunun hiçbir üretecine dokunmaz.

### Ekim tercihi (Sebze Bahçesi paneli)

Bahçenin paneline tıklanabilir bir **Ekim Tercihi** bölümü eklendi; seçim hemen geçerlidir (`ui:setCrop`):

| Mahsul | Ürün | Saatlik verim (kişi başı) | Tarladaki doku |
|---|---|---|---|
| **Buğday / Sebze** (varsayılan) | Yiyecek (değirmende un ve ekmeğe döner) | 5 (eskisiyle aynı) | Altın sarısı buğday başakları arasında lahana, havuç, domates; ilkbaharda yeşil başak, sonbaharda biçilmiş demet ve kabak |
| **Keten** | Keten (lifli sanayi hammaddesi, gıda değildir) | 3 | Açık mavi çiçekli ince yeşil saplar; ilkbaharda filiz, sonbaharda kuruyan saman sarısı demetler |
| **Meyve / Şerbetçiotu** | Şerbetçiotu (tatlı meyve ve aromatik bitki, gıda değildir) | 3 | Tel gerili ahşap sırıklara sarılmış koyu yeşil yapraklar ve mor salkımlar; sonbaharda kehribar meyveler |

- Mevsim (kışın donma), yağmur, biyom, Cam Sera, Antik Su Kemeri Şeması, üzüm asmaları ve Su Kuyusu çarpanları her mahsule aynen uygulanır.
- Mahsul değişince yarım kalan hasat küsuratı sıfırlanır (eski mahsuldendir); bahçıvanın balonu da mahsule göre yazar ("Mavi çiçekli keten
  saplarını topluyor").
- Keten ve Şerbetçiotu üst çubuktaki **Mallar ▾** listesinde ve depoda yeni kalemlerdir (kendi simgeleri, ipucunda üreten bahçe sayısı);
  ilk hasatları Kasaba Günlüğü'ne yazılır, toplam hasat Arşiv'in sayaçlarında görünür. Gıda sayılmazlar (öğün, göç koşulu, toplam besin).

### Ürün Silosu (`silo`, Köy seviyesi)

Yapılar sekmesinde, Kiler'in hemen ardından: **2x2**, taş temelli, demir çemberli ahşap gövdeli, konik kiremit çatılı tahıl ambarı
(Odun 40, Taş 25; Köy seviyesinde açılır).

- **Tarımsal kapasite:** işleyen her silo **Yiyecek (Buğday), Ekmek (Un), Keten ve Şerbetçiotu**nun depo sınırını **+150** artırır
  (`state.granaryCapacity`; bir kaynağın sınırı `Granary.storageLimit`). Odun, taş, yün ve demirin sınırı değişmez. HUD'daki sınırlar,
  "depo doldu" uyarısı, fırının "ekmek deposu dolu" durumu ve dilekçelerin kışlık stok hedefi bu sınırı kullanır.
- **Güvenli depolama:** silosu olmayan kasabada **yağmurlu ya da kış saatlerinde** kilerdeki ham mahsulün (yiyecek, keten, şerbetçiotu)
  **80'i aşan kısmından saatte %0,4'ü bozulur** (ekmek bozulmaz; küsurat birikir; günde en çok bir bildirim). Kasabada işleyen bir silo
  varken hiçbir mahsul bozulmaz. Bozulma, kıtlığa yol açmayacak kadar hafiftir: yalnızca güvenli stoğun üstünü etkiler.

### Kayıt (sürüm 21)

Binalara `crop`, kayda `resources.flax / hops` ve `granary` eklendi. Sürüm 2-20 kayıtlarında bütün bahçeler Buğday / Sebze ekili açılır,
Keten ve Şerbetçiotu 0'dır, silo sayaçları boştur; geçersiz bir mahsul değeri Buğday'a, bozuk sayaçlar boşa döner.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 726; 56'sı bu adımın): mahsul verisi, Ürün Silosu tanımı ve menüdeki yeri, Mezra'da kilit / Köy'de
  açılma, yeni bahçenin Buğday ekili başlaması, Keten'e geçiş (olay, bildirim, sayaç, küsuratın sıfırlanması), aynı / geçersiz mahsul ve
  bahçe olmayan yapının reddi, Şerbetçiotu → Buğday → Keten → Şerbetçiotu döngüsü, gerçek `performWork` ile Keten ve Şerbetçiotu hasadı
  (bahçeden yiyecek gelmemesi, ilk mal olayı ve günlük notu, sayaçlar), Buğday'a dönüş, Keten / Şerbetçiotunun gıda sayılmaması,
  bahçıvanın etkinlik metni, kışın keten tarlasının da donması, Mallar listesindeki kalemler ve ipucu, simgeler, silonun +150 / iki silonun
  +300 tarımsal kapasitesi (odun / taş / yün / demir değişmez), depoya girişin yeni sınırı izlemesi, fırının ekmek deposu, Silo paneli,
  Ekim Tercihi paneli (üç düğme, vurgu, tıklayınca değişme, bahçe olmayanda gizli), kuru havada bozulmama, yağmurda ve kışta bozulma
  miktarları, ekmeğin korunması, tek bildirim, küsurat, `time:hour` ile bozulma, silo varken bozulmama, üç tarla dokusunun farkı ve
  renkleri (altın / mavi / mor), dört mevsim, silo görseli (kışın karlı çatı), kayıt sürümü 21 gidiş-dönüşü, bozuk değerler ve v20 kaydı.
- **Denetim** (`audit.mjs`): 108/108 (bekçi artık geçersiz mahsulü de denetler). **Geriye uyumluluk** (`compat.mjs`, sürüm 2-21, 510; 63'ü
  bu adımın): `save-v21.json` bu adımın otopilotuyla 34 günlük oyundur (`--crisis-state`; kuleden sonra kurulan silo, Keten ekili bahçe,
  282 keten, bozulma sayacı). v2-v20 kayıtlarının her birinde bütün bahçeler Buğday ekili açılır, Keten / Şerbetçiotu 0, silo sayaçları
  boştur ve bir gün sonra mahsuller geçerlidir; v21 kaydında mahsuller, stoklar, silo kapasitesi ve sayaçlar korunur.
- **Otopilot:** gıda kritikse (kişi başı besin 6'nın altında) bütün bahçeleri hemen Buğday'a döndürür. Ürün Silosu'nu Ulu Saat Kulesi
  tamamlandıktan sonra kurar ve ancak silo varken, kişi başı besin 10'u aşınca (en az 3 bahçeyle) bir bahçeye Keten, (4 bahçeyle) birine
  Şerbetçiotu ektirir; ekilen malın deposu dolunca o bahçe Buğday'a döner. `--no-agri` silo ve çeşitlendirmeyi kapatır.
  - **Bulgu:** siloyu Köy aşamasında (kuyudan hemen sonra) kurdurmak tohum 42'de Belediye Konağı'nı G19'dan G21'e, Ulu Saat Kulesi'ni
    G25 / G27 / G28'den G29 / G31 / G32'ye kaydırdı: Köy aşamasının dar boğazı odun, taş ve inşaat emeğidir. `--no-agri` koşusu (bozulma
    açık) 23. aşamayla kule günlerinde birebir aynıdır (G25 / G27 / G28, Altın Çağ G28; bozulan 315 yiyecek kıtlığa yol açmadı); bu yüzden
    otopilot siloyu kuleden sonraya bıraktı.
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`, 23. aşamayla aynı matris): takılma 0, kopuk referans 0,
  taşan ev 0, bekleyen iş 0, üretmeyen iş yeri 0, sosyal sıkışma 0, sayfa hatası 0. **Ulu Saat Kulesi altı koşunun altısında tamamlandı;
  Altın Çağ G31, G33, G31, G28, G34, G34** (23. aşamada G31, G34, G31, G28, G35, G34: hiçbir koşu gecikmedi). Altı kasabanın altısı kuleden
  sonra bir Ürün Silosu kurdu ve birer bahçeyi Keten'e çevirdi (toplam 2399 keten; 36 günde hiçbir kasaba 4. bahçeye ulaşmadığından
  Şerbetçiotu ekilmedi). **Gıda güvencesi 23. aşamayla birebir aynı:** bekçinin yeni ölçümüyle (3. günden sonra kişi başı en düşük besin
  ve bir öğünlük bile besinin kalmadığı "kritik" saatler) altı tohumda en düşük kişi başı besin 1,2 / 0,2 / 1,0 / 0,8 / 1,7 / 0,2 ve kritik
  saat 15 / 36 / 15 / 25 / 2 / 39, `main` ile aynı (bu saatler oyunun ilk günlerindeki kıtlıktan gelir, silo kurulmadan önce); ortalama kişi
  başı besin 22,4-25,2 (`main`: 22,4-26,8). Silosuz geçen günlerde kasaba başına 169-355 yiyecek bozuldu; kıtlık yaratmadı. Yönetim
  Güveni en düşük %75, isyan 0, terk eden 0, Krallık Vergisi 35/35.

## Katma değerli üretim: Dokuma Tezgâhı ve Kumaş, Şerbethane ve Fıçı Şerbeti (24. aşama, 24.2 mikro adımı)

24.1'de tarladan toplanan ham Keten ve Şerbetçiotu, 24.3'teki dış ticaretten önce kasaba içinde **katma değerli son ürünlere**
dönüşüyor. İki yapı da mevcut **işleme** altyapısını (Yel Değirmeni ve Fırın gibi) kullanır: çalışan saatte 2 kez stoktan girdiyi
alıp ürünü üretir; malzeme yoksa, ürünün deposu doluysa ya da kasaba açken boşta kalır ve kimse çalışmaya gelmez. Sayılar
`data/refinery.js`'te, saf hesaplar `systems/Refinery.js`'te, han / çanta mekanikleri `systems/RefinerySystem.js`'tedir. Katman
**rastgelelik kullanmaz**: hiçbir üretecin sırası değişmez.

| Yapı | Seviye ve maliyet | Çalışan | Zincir | Ürün |
|---|---|---|---|---|
| **Dokuma Tezgâhı** (`loom`, 2x2) | Kasaba · Odun 45, Taş 25, Demir 10 | Dokumacı (zanaatkârlık deneyimi) | 2 Keten → 1 Kumaş (saatte 2 kez) | **Kumaş**: Mallar listesinde yeni sanayi ürünü |
| **Şerbethane** (`brewery`, 2x2) | Kasaba · Odun 35, Taş 40 | Mahzen ustası (aşçılık deneyimi) | 2 Şerbetçiotu → 1 Fıçı Şerbeti (saatte 2 kez) | **Fıçı Şerbeti**: lüks tüketim ve ihracat malı |

### Kumaş

- **Dayanıklı Giysi:** sonbaharda ve kışın Pazar Yeri'ne giden sakin, çantasında giysi yoksa kasabanın kumaşından (1 top) **8 altına**
  Dayanıklı Giysi diktirir. Çantadaki giysi soğuğa karşı **+0,3** korur (Kışlık Palto'yla toplanır, en çok tam koruma): üşüme,
  enerji ve keyif kaybı azalır.
- **Refaha kalıcı katkı:** dokunan her 40 top kumaş kasaba refahına kalıcı **+1** verir (en çok +3).
- 24.3'te yüksek kâr marjlı ana ihraç kalemi olacak (şimdilik liman ihraç etmez).

### Fıçı Şerbeti ve han

- Her saat başı, işleyen her hana kasaba deposundan en çok **2 fıçı** taşınır (handa en çok 12 fıçı; Han paneli gösterir).
- Handa oturup sohbet etmeye başlayan sakin handa fıçı varsa bir bardak içer: **+15 keyif**, handa kaldığı sürece **keyif ve sosyallik
  barları iki kat hızlı dolar**, ertesi gün 12:00'ye kadar **"Keyifli Damak"** moraliyle keyfi %25 yavaş düşer.
- Kesesi yeten (5 altın) ve çantasında testi olmayan sakin, handa en az 3 fıçı varken çantasına bir **Şerbet Testisi** alır; keyfi
  35'in altına inince testiden içer (+15 keyif).
- 24.3 ihracat sözleşmelerinde krallığa satılacak en kıymetli ürünlerden biri olacak.

### İş gücü dengesi

- Dokumacı ve mahzen ustası **lüks / ticaret fazlası** işlerdir: iş seçiminde üretim yapılarından bir kademe sonra gelirler
  (Gözcü Kulesi nöbeti gibi). Fırıncı, çiftçi, balıkçı ve yapı ustası yuvaları dolmadan kimse tezgâha ya da mahzene geçmez.
- Kasabanın kişi başı besini 3'ün altına inince tezgâh ve mahzen boşta kalır; vardiyası süren dokumacı / mahzen ustası da işi bırakıp
  gıdaya döner.

### Kayıt (sürüm 22)

Kumaş ve Fıçı Şerbeti stokları, iki yeni yapı, handaki fıçılar (`sherbet`), çantadaki `garment` / `sherbetJug`, `buffs.merryPalate` ve
sayaçlar kayda girer. Sürüm 2-21 kayıtlarında Kumaş / Fıçı Şerbeti 0'dır, hanlarda fıçı, tezgâh / şerbethane ve yeni çanta eşyası yoktur.
Bozuk bir fıçı değeri 0'a döner; han olmayan yapıda fıçı tutulmaz.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 781; 55'i bu adımın): tanımlar ve Kasaba kilidi, gerçek `performWork` ile 2:1 girdi-çıktı oranları
  (yarım top yok), ilk mal olayı ve günlük notu, malzemesizken / depo doluyken / kasaba açken boşta kalma ve geri açılma, boşta
  tezgâhın etkinlik metni, iş gücü önceliği (temel yuvalar önce; temel yuvalar dolunca boştaki sakin tezgâha geçer), gerçek vardiya
  (sabitlenen dokumacı mesaide gelir, dokur, yevmiye ve zanaatkârlık deneyimi kazanır), han ikmali (saatte 2, en çok 12), şerbet (+15,
  Keyifli Damak'ın bitişi), testi alma ve ikinciyi almama, fıçısız han, gerçek `perform` ile **iki kat sosyallik ve keyif** ve tek ikram,
  gerçek `NeedsSystem` ile Keyifli Damak'ın %25 yavaş keyif kaybı, testiden içme, Dayanıklı Giysi (mevsim, fiyat, kumaş stoğu, ikinciyi
  almama, kumaşsız kasaba), soğuk koruması (+0,3, paltoyla toplam en çok 1), refah katkısı (her 40 topta +1, en çok +3), Mallar listesi ve
  ipucu, üç panel (değirmenin eski metinleri korunur), görseller, kayıt sürümü 22 gidiş-dönüşü, bozuk değerler ve v21 kaydı.
- **Denetim** (`audit.mjs`): 108/108 (bekçi handaki fıçı sayısını, han olmayan yapıda fıçıyı ve açken çalışan lüks işçiyi de denetler).
  **Geriye uyumluluk** (`compat.mjs`, sürüm 2-22, 556): `save-v22.json` bu adımın otopilotuyla 40 günlük oyundur (`--crisis-state`; 96 kumaş,
  5 fıçı, handa 4 fıçı, tezgâh ve şerbethane, çantalarda 27 giysi / testi). v2-v21 kayıtlarının her birinde Kumaş / Fıçı Şerbeti 0, hanlarda
  fıçı yoktur; v22 kaydında hepsi korunur.
- **Otopilot:** Ulu Saat Kulesi tamamlanmış, nüfus 22+ ve kişi başı besin 10'un üstündeyken (temel gıda ve kule hedefleri güvende) silodan sonra
  bir Dokuma Tezgâhı, bir Şerbethane ve Şerbetçiotu için dördüncü bir bahçe kurar (handa, pazarın ya da atölyenin yanında). 24.1'deki bulgu
  (Köy aşamasında kurulan silo kuleyi 4 gün geciktirmişti) yüzünden bu yapıları kuleden önce kurmaz. `autopilot.mjs 42 44`: kule G25 / G27 / G28
  (`main` ile aynı), 178 kumaş, 97 fıçı, handa 72 bardak, 25 testi, 24 Dayanıklı Giysi, refah katkısı +3, açken çalışan lüks işçi 0.
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0, bekleyen iş 0,
  üretmeyen iş yeri 0, sayfa hatası 0. **Ulu Saat Kulesi 6/6; Altın Çağ G31, G33, G31, G28, G34, G34** (24.1 ile birebir aynı; `main`'de G31,
  G34, G31, G28, G35, G34). **Gıda arzı korunuyor:** kişi başı en düşük besin 1,2 / 0,2 / 1,0 / 0,8 / 1,7 / 0,2 ve kritik gıda saatleri
  15 / 36 / 15 / 25 / 2 / 39, `main` ile aynı. **Yönetim Güveni** en düşük her koşuda %75, isyan 0, terk eden 0. Altı kasabanın altısı
  tezgâh ve şerbethane kurdu (kuleden sonraki birkaç günde): 379 top kumaş, 262 fıçı, handa 115 bardak, 57 testi, 24 Dayanıklı Giysi; açken
  çalışan lüks işçi 0.

## Dış ticaret: Ticaret İskelesi / Kervan Konağı, ihracat sözleşmeleri ve hammadde ithalatı (24. aşama, 24.3 mikro adımı)

24.1-24.2'de kurulan tarım ve işleme zinciri dış dünyaya açıldı: Kumaş, Fıçı Şerbeti ve erzak düzenli bir ticaret döngüsüyle hazineye,
hazinedeki altın da geç oyunda azalan ağaç ve taş rezervlerinin yerine hammaddeye dönüşüyor. Sayılar `data/tradePost.js`'te, saf
hesaplar `systems/TradePost.js`'te, takvim ve olaylar `systems/TradePostSystem.js`'tedir. Katman **rastgelelik kullanmaz**: talepler ve
takvim ziyaret sayısından türetilir, hiçbir üretecin sırası değişmez.

### Ticaret İskelesi / Kervan Konağı (`tradingPost`, 3x2, Kasaba seviyesi)

- Odun 70, Taş 50, Demir 20; kasabada bir tane. Ayak izinin bir kenarı **suya** (iskele) ya da bir **yola** (patika, parke, taş plaka,
  köprü; kervan konağı) değmelidir; ikisinden uzak yer "Nehir kıyısına (iskele) ya da bir yolun kenarına (kervan konağı) kurulmalı"
  diye reddedilir.
- İskele tamamlanınca en az 12 saat sonra, 09:00'da ilk **Ticaret Gemisi** (yanında su varsa; suya doğru demir atar) ya da **Kervan**
  (çadırını yol tarafına kurar) gelir ve **24 saat kalır**. Sonraki ziyaretler sırayla **3 ve 4 gün** sonra 09:00'dadır. İskele çalışmıyorsa
  (şantiye, hasar, yangın) gelen olmaz, vakti geçmişse ilk uygun saatte uğrar. Varış Kasaba Günlüğü'ne ve bildirime yazılır; gemi / kervan
  buradayken iskelenin tentesine renkli flamalar asılır.

### İhracat sözleşmeleri ve pazar doygunluğu

| Talep | Teslim | Taban altın |
|---|---|---|
| Kumaş Talebi (her ziyarette) | 10 Kumaş | 40 |
| Şerbet Talebi (her ziyarette) | 8 Fıçı Şerbeti | 35 |
| Ekmek Talebi / Erzak Talebi / Yün Talebi (sırayla) | 25 Ekmek / 40 Yiyecek / 15 Yün | 20 / 18 / 30 |

- Panelde her talep bir kart olarak görünür; depoda yeterli mal varsa **Sözleşmeyi Tamamla** tek tıkla malları yükler ve toplu altını
  Kasaba Hazinesi'ne yazar. Her sözleşme bir ziyarette bir kez tamamlanır.
- **Doygunluk:** aynı mal **3 kez peş peşe** ihraç edilince o malın fiyatı **%12 düşer** (sonraki her peş peşe satışta yeniden; en düşük %55).
  Başka bir mal satılınca öteki malların fiyatı %5 toparlanır; her yeni ziyarette, önceki ziyarette satılmayan malların fiyatı %5 toparlanır.
  Böylece satış çeşitlendikçe fiyat eski kârlı seviyesine döner. Panel düşük çarpanları gösterir.
- Büyük Ticaret Limanı'nın otomatik fazlalık ihracatı da artık kumaşı (birim 6 altın) ve fıçı şerbetini (7 altın) götürür.

### Hammadde ithalatı

Gemi / kervan buradayken panelden altınla **Odun Paketi** (30 odun → 15 altın), **Taş Paketi** (25 taş → 15 altın) ve **Demir Paketi**
(10 demir → 20 altın) alınır; mallar **anında ambara iner** (depoda yer olmalı). Her paketten ziyaret başına 3 tane vardır.

### Kayıt (sürüm 23)

`tradePost` (gemi takvimi, demirli gemi ve sözleşmeleri, pazar çarpanları, seri, sayaçlar) kayda girer; demirli bir gemiyle kaydedilen oyun
yüklenince gemi kalan süresi ve tamamlanmış sözleşmeleriyle yerinde durur. Sürüm 2-22 kayıtlarında dış ticaret boştur. Bozuk çarpanlar,
bilinmeyen mallar, taşan ithalat stoğu ve geçersiz seri temizlenir.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 834; 53'ü bu adımın): tanım, menü, talepler ve paketler; Kasaba kilidi; yol / su kenarı yerleşimi ve
  uzak yerin reddi; suyun yanında gemi, yolda kervan; ilk varış (12 saat sonra 09:00), vakti gelmeden gelmeme, 24 saatlik kalış, varış
  bildirimi ve günlük, iskelede çizilen gemi / kervan; Kumaş (10 → 40) ve Ekmek (25 → 20) sözleşmeleri, ikinci kez ödenmeme, yetersiz mal;
  ithalat (paketler, ziyaret başına 3, yetersiz altın, depoda yer yok, gemi yokken kapalı); ayrılış ve 3 / 4 günlük aralık, üçüncü talebin
  sırası; doygunluk (3 peş peşe satışta %12 düşüş, dördüncüde yeniden, başka malla %5 toparlanma ve serinin bozulması, ziyaretlerle tam
  fiyata dönüş, %55 taban); gerçek saatlerle hasarlı iskeleye gelmeme, onarılınca gelme ve 24 saat sonra ayrılma; panelde üç kart, kapalı /
  açık düğmeler, tıklayınca tamamlama ve ithalat; görseller; kayıt sürümü 23 gidiş-dönüşü (demirli gemi dahil), bozuk değerler, v22 kaydı ve
  v22 kasabasına iskele kurulması.
- **Denetim** (`audit.mjs`): 108/108 (bekçi gemi / kervanın 24 saati aşmamasını, 3 sözleşmeyi, iskelesiz gemiyi ve pazar çarpanlarını da
  denetler). **Geriye uyumluluk** (`compat.mjs`, sürüm 2-23, 605): `save-v23.json` bu adımın otopilotuyla 44 günlük oyundur (`--crisis-state`;
  4 ziyaret, 10 sözleşme, +313 altın). v2-v22 kayıtlarında dış ticaret boştur; v23 kaydında takvim, sözleşmeler ve sayaçlar korunur.
  - **Uyumluluk kontrolü düzeltmesi:** fikstürler aktif bir krizle (yanan yapı, bekleyen baskın) kaydedilir; oyunun kuralı gereği böyle bir
    kayıt yüklenince ilk 24 saatte kriz koruması yoktur. 23. aşamanın kontrolü buna rağmen yeni yangın çıkmamasını şart koşuyordu (v20-v22'de
    şans eseri geçiyordu; v23'te yüklemeden sonra bir doğal yangın çıktı). Kontrol artık korumalı kayıtta eskisi gibi sıkı, aktif kriz
    kaydında yalnızca sayaçların tutarlılığını denetler.
- **Otopilot:** Ulu Saat Kulesi ve Dokuma Tezgâhı tamamlandıktan sonra yolun / nehrin kenarına bir Ticaret İskelesi kurar. Gemi / kervan
  buradayken rezervler korunduğu sürece (en az 10 kumaş, 5 fıçı şerbet, 30 yün; ekmek / erzak satışından sonra kişi başı en az 12 besin)
  sözleşmeleri tamamlar; hazinede vergi ayrıldıktan sonra 400+ altın varken odun 60, taş 50, demir 20'nin altına inince paket ithal eder.
  `autopilot.mjs 42 44`: kule G25 / G27 / G28 (`main` ile aynı), iskele G29, 4 ziyaret, 10 sözleşme (+313 altın; 30 kumaş, 24 fıçı, 50 ekmek,
  40 erzak, 15 yün), rezerv için bekletilen 3 sözleşme, ithalat 0 (hammadde hiç kritik eşiğin altına inmedi).
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0, bekleyen iş 0,
  üretmeyen iş yeri 0, sayfa hatası 0. **Ulu Saat Kulesi 6/6; Altın Çağ G31, G33, G31, G28, G34, G34** (24.1 / 24.2 ile birebir aynı; `main`'de
  G31, G34, G31, G28, G35, G34). Gıda arzı (kişi başı en düşük besin 1,2 / 0,2 / 1,0 / 0,8 / 1,7 / 0,2; kritik gıda saati 15 / 36 / 15 / 25 / 2 / 39)
  ve en düşük Yönetim Güveni (%75) her koşuda `main` ile aynı. Altı kasabanın altısı kuleden sonra iskele kurdu: 7 ziyaret, 15 sözleşme,
  +448 altın; 36 günde hiçbir kasabada hammadde kritik eşiğe inmediği için ithalat yapılmadı.

## Kuşaklar: yaşam evreleri ve yaş döngüsü — Çocuk, Genç, Yetişkin, Kıdemli Bilge (25. aşama, 25.1 mikro adımı)

25. aşama ("Kuşaklar, Çıraklık ve Aile Mirası") kasabaya zamanın akışını getiriyor. İlk adımda her sakin artık yaşlanır ve dört
yaşam evresinden geçer. İlke değişmedi: **Pikselköy'de ölüm ve kalıcı yıkım yoktur.** Yaşlanan sakin oyundan silinmez; **Kıdemli
Bilge** unvanını alır, ağır işlerden emekli olur ve çardakta, bankta, meydan havuzunun başında ya da Bilgelik Evi'nde oturarak
kasabaya bilgelik katar. Sayılar `data/lifeStages.js`'te, saf hesaplar `systems/LifeStages.js`'te, yaşlanma / emeklilik / nasihat
`systems/LifeStageSystem.js`'tedir.

| Evre | Yaş | Davranış | Görünüş |
|---|---|---|---|
| **Çocuk** (`child`) | doğumdan büyüyene kadar | Mevcut çocuk düzeni: koşturur, oynar, okula ve meydana gider; çalışmaz | Küçük silüet (12x14) |
| **Genç** (`youth`) | 18-20 | Büyüyen çocuk ve genç göçmenler; kasabanın işlerine yetişkinler gibi yardım eder (25.2'de çıraklık adayı) | Boynunda turuncu fular, çevik duruş |
| **Yetişkin** (`adult`) | 21-69 | Tam kapasite çalışan, üretken sakin (bugüne kadarki herkes) | Standart çalışma kıyafetleri |
| **Kıdemli Bilge** (`elder`) | 70+ | Emekli usta: ağır işlerden muaf, Bilge Nasihati verir, refaha katkı sunar | Kırlaşmış saç ve şakaklar, ahşap yürüyüş bastonu (otururken bırakır) |

### Yaş döngüsü

- Her sakinin `lifeStage` evresi ve gün cinsinden yaşı (`ageInDays`) vardır; `age` (yıl) bundan türetilir. **Bir yaş = bir oyun yılı**
  (4 mevsim x 4 gün = 16 gün). Yaş yalnızca **gün dönümünde (00:00)** ilerler; gezgin tüccar gibi ziyaretçiler yaşlanmaz.
- Doğum günleri kimlikten türetilir ve yılın ilk 8 gününe dağılır (herkes aynı gün yaşlanmaz); **rastgelelik yoktur**.
- Büyüyen çocuk 18 yaşında **Genç** başlar; 21. doğum gününde **Yetişkin**, 70. doğum gününde **Kıdemli Bilge** olur. Evreler geri
  dönmez (kazanılmış yetişkinlik ve bilgelik korunur). Kuruluş sakinlerinin en yaşlısı (66) ilk kez yaklaşık 57-64. günlerde bilgeleşir;
  otopilotlu 64 günlük koşuda (tohum 42) Deniz 63. gün 00:00'da kasabanın ilk Kıdemli Bilgesi oldu.
- **Gönül ilişkisinde yaş farkı** artık **kuşak yaşına** göre ölçülür (kasabaya katıldıkları / büyüdükleri andaki yaş; herkes birlikte
  yaşlandığı için zamanla değişmez). Bulgu: ilk denemede fark anlık yaşla ölçülüyordu; farklı doğum günleri iki sakinin farkını günden
  güne 13-15 arasında oynatıyor, tohum 42'de eşleşmeleri ve Altın Çağ'ı G28'den G31'e kaydırıyordu. Kuşak yaşıyla eski kural birebir korunur.

### Kıdemli Bilge: emeklilik, Bilge Nasihati ve refah

- **Emeklilik:** emekli bilge inşaata, toplamaya, üretim yuvalarına (sabit iş yeri olsa bile), itfaiyeye, baskın savunmasına ve
  keşif seferine gitmez. Boş zamanında **bankı (x3), çardağı (x2,5), meydan havuzunu (x2), ağaç gölgesini (x2)** ve Bilgelik Evi'nde
  kitap okumayı yeğler; nehir kenarı ve uzun yürüyüşler azalır, adımları %10 ağırdır. Testte bilgenin boş zamanının %83'ü bu oturma
  yerlerinde geçti (yetişkinde %43).
- **En az 3 çekirdek sakin kuralı:** kasabada çalışabilir genç / yetişkin sayısı 3'ün altına inerse en düşük kimlikli bilgeler
  **gönüllü usta** olarak çalışmaya döner (kart "Gönüllü usta" yazar, Kasaba Günlüğü'ne not düşer); yeter sayıya ulaşılınca yeniden
  emekli olurlar ("yeniden emekliliğin tadını çıkarıyor"). Emeklilik her saat başı ve nüfus değiştiğinde yeniden hesaplanır, kaydedilmez.
- **Bilge Nasihati:** boş zamanını (bank, çardak, havuz, han, sohbet...) geçiren emekli bilgenin 40 piksel yakınındaki uyanık yetişkin
  ve gençlerin keyfi dakikada **+0,04**, sosyalliği **+0,02** dolar; bilgenin başında ara sıra kitap / kıvılcım baloncuğu çıkar. Uyuyan,
  çalışan ya da gönüllü bilge nasihat vermez; çocuklar ve öteki bilgeler etkilenmez.
- **Refah:** her emekli bilge kasaba refahına **+1** katar (en çok +3).
- **Kutlama:** bilgeleşen sakinin başında altın kıvılcımlar yükselir; bildirim ve Kasaba Günlüğü aynı cümleyi yazar (ör. "Deniz artık
  kasabanın kıdemli bir bilgesi oldu, gençlere yol gösterecek!"; üç cümleden biri bu katmanın kendi üretecinden seçilir) ve sakinin
  anılarına "70 yaşında Kıdemli Bilge unvanını aldı" eklenir. Gencin yetişkinliğe geçişi de günlüğe yazılır.

### Karakter Detay Kartı

Adın altında **yaşam evresi rozeti** (Çocuk pembe, Genç turuncu, Yetişkin ahşap, Kıdemli Bilge gümüş-mor) ve **yaşı** görünür; bilge
için "Emekli · ağır işlerden muaf" ya da "Gönüllü usta", genç için "Çevik ve hevesli" notu eklenir. Rozetin ipucu evrenin açıklamasını
ve bir sonraki doğum gününe kalan günü gösterir. `tools/art-preview.html` aynı sakinin dört evresini, bilgenin her saç stili ve yönü
(yürüyüş, arkadan, bankta, paltolu), gencin fuları ve çardakta / bankta Bilge Nasihati sahneleriyle gösterir.

### Determinizm ve izole üreteç

Yaşlanma ve evre geçişleri **hiçbir rastgele sayı üretecini tüketmez**; katmanın kendi tohumlanmış üreteci (`seed + 27`) yalnızca süs
için (kutlama cümlesi, nasihat baloncuğu) kullanılır. Emekli bilgenin mola zarı da atılır (`breakChance`), böylece bilge varken bile
ana üretecin sırası değişmez. Test, 20 günlük yaşlanma + bilgeleşme + emeklilik + nasihat boyunca 24 üretecin ve `Math.random`'un
hiç ilerlemediğini doğrular.

- **Bulgu (gençlerin enerjisi):** gençlere uykuda %15 hızlı enerji dolumu denendi; tohum 42'de gençler erken uyanıp iş düzeni değişti ve
  Altın Çağ G28'den G31'e kaydı. "Tohum 42 milim şaşmamalı" kuralı gereği bonus `YOUTH.energyGain = 1` ile kapalı tutuldu ve çıraklıkla
  birlikte dengelenmek üzere 25.2'ye bırakıldı (profil kancası hazır: `buildTraitProfile(..., { youth })`).
- 36 günlük stres koşularında kimse 70'e ulaşmaz (en yaşlı 68): bilge mekanikleri ilk 2 ayın dengesine dokunmaz, uzun oyunlarda devreye girer.

### Kayıt (sürüm 24)

Sakinlere `lifeStage`, `ageInDays` ve `agedDays` (kuşak yaşı için kasabada yaşlanılan gün), kayda `lifeStages` sayaçları (nasihat
dakikası, unvanı alan bilgeler, yetişkinliğe geçen gençler, son kutlama cümlesi) eklendi; emeklilik kaydedilmez, yüklenince sessizce
(günlüğe yazılmadan) yeniden hesaplanır. **Sürüm 2-23 kayıtlarında** evresi olmayan yetişkinler (18-20 yaşındakiler de) `'adult'`,
çocuklar `'child'` başlar (70+ olan olsaydı `'elder'`); yaş aynen korunur, gün sayacı yaştan ve kimlikten kurulur, kuşak yaşı yaşın
kendisidir. Bozuk bir evre ya da yaş sayacı yaştan yeniden kurulur, bozuk sayaçlar sıfırlanır.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 874; 40'ı bu adımın): evre verisi ve saf hesaplar (yaştan evre, geri dönmeyen evreler, doğum
  günleri, yaş / gün dönüşümü), karakter modeli ve profiller (bilgenin ağır adımları ve oturma sevgisi, gencin yetişkinle aynı iş düzeni),
  çocuğun büyüyüp Genç olması, gün dönümünde yaşlanma (ziyaretçi hariç, gerçek saatle tek kez), 70. doğum gününde bilgelik (olay,
  bildirim, aynı günlük cümlesi, anı, ölmeme), görseller (kır saç ve baston, aynı boyut, oturunca bırakılan baston, genç fuları, çocuk
  silüeti), emeklilik (iş bulucu, sabit iş yeri, itfaiye / savunma, sefer), çekirdek sakin güvencesi (gönüllü usta, savunmaya sayılma,
  yeniden emeklilik ve günlük notları), refah katkısı, boş zaman tercihleri, Bilge Nasihati (miktar, menzil, uyuyan / gönüllü bilge),
  Genç -> Yetişkin, ana üreteçlerin ve `Math.random`'un tüketilmemesi, kuşak yaşı (40 gün boyunca sabit fark, büyüyen çocuğun 18'i),
  Karakter Detay Kartı rozetleri, kayıt sürümü 24 gidiş-dönüşü, bozuk değerler, v23 kaydı ve bir gün yaşaması.
- **Denetim** (`audit.mjs`): 111/111 (yeni senaryo: Kıdemli Bilge emekliyken ve bir Genç 21. doğum gününü yeni geçmişken kayıt -> yükleme
  durum kayması yok; yüklemeden sonra kimse yeniden kutlanmaz, bilge emekli kalır, yaş gün dönümünde bir kez ilerler). Bu senaryo iki
  hatayı yakaladı ve düzeltildi: yüklemede emekliliğin ilk eşitlenmesi günlüğe "yeniden emekli" notu düşürüyordu, nasihat dakikası
  yüklenirken yuvarlanıyordu. Bekçi (`monitor.mjs`) artık her örnekte evrenin geçerliliğini, çocuklukla uyumunu, yaş sayacını, bilge
  olmayan emekliyi ve çekirdek sakin güvencesini kopuk referans olarak denetler; işteki emekliyi ve emeklilik gecikmesini sayar.
- **Geriye uyumluluk** (`compat.mjs`, sürüm 2-24, 680; 75'i bu adımın, yeni fikstürün genel kontrolleri dahil): `save-v24.json` bu adımın otopilotuyla **64 günlük** oyundur (`--crisis-state`;
  63. günde kendiliğinden bilgeleşen Deniz, 7 Genç, nasihat sayacı). v2-v23 kayıtlarının her birinde evresi olmayan yetişkinler `'adult'`,
  çocuklar `'child'` başlar, yaşlar değişmez; v24 kaydında evreler, gün sayaçları ve sayaçlar korunur, bilge emeklidir; hepsinde bir gün
  sonra herkesin yaşı bir gün ilerler ve kimse silinmez.
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0, bekleyen iş 0,
  üretmeyen iş yeri 0, sosyal sıkışma 0, sayfa hatası 0. **Altı tohumun altısı 24.3 ile (`main`) birebir aynı:** her koşunun günlük
  olay kaydı ve bekçi raporu (yeni `life` alanı dışında) bayt bayt eşleşti; **Ulu Saat Kulesi 6/6, Altın Çağ G31, G33, G31, G28, G34, G34**
  (tohum 42: kule G25 / G27 / G28, Altın Çağ **G28**). 36. günde altı kasabada 42 Genç, 138 Yetişkin, 0 bilge (en yaşlı 68); 4 genç
  yetişkinliğe geçti, işteki emekli 0.
- **Uzun koşu** (`autopilot.mjs 42 64 --crisis-state`): Ulu Saat Kulesi yine G25 / G27 / G28, Altın Çağ G28. Deniz 63. gün 00:00'da 70 yaşına basıp
  kasabanın ilk Kıdemli Bilgesi oldu (bildirim ve günlükte aynı cümle, emekli); koşu sonunda 7 Genç, 22 Yetişkin, 1 emekli bilge, 58 dakika
  Bilge Nasihati, işteki emekli 0, emeklilik gecikmesi 0; takılma, kopuk referans ve sayfa hatası 0.

## Usta-Çırak sistemi ve mesleki eğitim (25. aşama, 25.2 mikro adımı)

25.1'de evre olarak gelen **Genç**ler (18-20) artık bir ustanın yanında meslek öğrenebiliyor. Çıraklık kasabanın iş gücünü
**kilitlemeyen** tatlı bir yan katmandır: çırak yalnızca ustası tezgâhtayken onun yanında öğrenir; ustası başka işteyse, kasabada
gıda kıtlığı varsa ya da çekirdek iş gücü azsa her zamanki işine koşar. Sayılar `data/apprenticeship.js`'te, saf hesaplar
`systems/Apprenticeship.js`'te, mantık `systems/ApprenticeshipSystem.js`'tedir.

| Yapı | Dal | Usta | Mesleği (deneyim) | Çırak işi |
|---|---|---|---|---|
| Zanaat Atölyesi | Demircilik ve Terzilik | Demirci | Zanaatkârlık | Acemi Çivisi (2 altın) |
| Oduncu Kulübesi | Marangozluk | Marangoz | Odunculuk | Tahta Kaşık (2) |
| Şifacı Kulübesi | Şifacılık | Şifacı | Şifacılık | Ot Kesesi (3) |
| Yel Değirmeni ve Fırın | Fırıncılık | Fırıncı | Fırıncılık | Kıtır Kurabiye (2; yenir, tokluk +8) |
| Dokuma Tezgâhı | Dokumacılık | Dokumacı | Zanaatkârlık | Basit Bez (3) |
| Şerbethane | Şerbetçilik | Şerbethane Ustası | Aşçılık | Acemi Şerbeti (3) |

### Çırak yazma

- **Oyuncu:** Genç'in kartındaki **Çıraklığa Yaz** (en deneyimli ustanın atölyesine) ya da zanaat yapısının panelindeki **Çırak Al: [İsim]**.
- **Çırak Kapısı:** yapının panelinde açılır / kapanır; açık kapılara boştaki (bir yere sabitlenmemiş) gençler her sabah **07:00**'de
  kendiliğinden yazılır. Her yapıda bir çırak yeri vardır (Seviye 2 yapıda iki). Yeni oyunda bütün kapılar kapalıdır.
- Çırağın verisi `c.apprenticeship = { masterId, profession, buildingId, progress 0-100, since, crafted }`. Usta, o yapıya sabitlenmiş
  ya da orada çalışan en deneyimli yetişkindir (yoksa kasabada o meslekte en deneyimli olan); emekli olursa ya da köyü terk ederse
  yapının ustası devralır.

### Mesai, Gururlu Usta ve Çırak İşi

- **Mesai:** ustası yapıda çalışırken (ya da oraya yürürken) çırak mesai saatinde onun yanındaki küçük **taburesine** oturur, izler ve
  getir-götür işlerine bakar (`apprentice` etkinliği; üretim yuvası ayırmaz, üretim yapmaz, yarı yorulur). Kendi ustası yoksa atölyede
  o an çalışan en deneyimli yetişkinden öğrenir. İlerleme mesai saati başına **%1,67**tir (60 saatte %100). Ustası yoksa, kişi başı
  besin 6'nın altındaysa ya da çalışabilir yetişkin 3'ten azsa çırak her zamanki işine gider.
- **Gururlu Usta:** yanında çırağı çalışan ustanın keyfi 6 saat boyunca **%25 yavaş** düşer (kartta "Gururlu Usta" etiketi; ilk kez
  olunca Kasaba Günlüğü'ne yazılır). Çırak **%50**'yi geçince getir-götür işleri ustanın tezgâhına **+%5 verim** katar.
- **Çırak İşi:** %50'den sonra her mesai sonunda %35 olasılıkla **hammadde tüketmeden** mesleğin çırak işinden bir tanesi çantaya girer;
  ilki anılara ve günlüğe yazılır. Çantada 3 çırak işi birikince Pazar Yeri varsa satılır (kesesine değeri kadar altın).
- **Sözler:** usta ve çırak ara sıra konuşur: "Öğreniyorum ustam!", "Çekici doğru tut evlat...", "Ateş tam kıvamında!", "Ölç iki
  kere, kes bir kere!" (dal başına 6-8 söz). Sözler karakterin başının üstünde ekranda net yazılan küçük bir **metin baloncuğudur**
  (`rendering/SpeechBubbles.js`, `c.speech`; kaydedilmez).

### Mezuniyet

Genç 21 yaşında Yetişkin olunca çıraklık biter: ilerlemesi **%100** ise o meslekte **Yetkin Usta** (Usta kademesi, iş hızı +%40),
**%60+** ise **Kıdemli Kalfa** (Kalfa kademesi) olarak başlar; daha azsa ilerlemesi kadar deneyim (yüzde başına 6 dakika) ona kalır.
Unvan bildirime, Kasaba Günlüğü'ne ve anılara yazılır.

### Arayüz

- **Karakter Detay Kartı → Çıraklık:** çırağın ustası (tıklanınca seçilir), meslek dalı ve atölyesi, altın **"%X Çıraklık"** çubuğu,
  yetişkinlikte alacağı unvan, çırak işleri ve **Çıraklıktan Ayır**; çırak olmayan Genç için **Çıraklığa Yaz**; ustanın kartında
  **"Çırağı: [İsim]"** ve Gururlu Usta notu. Çırağın durum satırı "Leyla ustanın yanında marangozluk öğreniyor (%57)" gibi yazar.
- **Atölye paneli → Çıraklık:** dal, usta, Çırak Kapısı düğmesi, çırakların ilerleme çubukları ve boştaki gençler için Çırak Al düğmeleri.
- `tools/art-preview.html`: oduncu kulübesi (iki kare: balta kalkar / iner), dokuma tezgâhı ve fırının önünde usta ile taburedeki
  çırak, konuşma baloncukları; tabure ve çırak işi simgeleri.

### Determinizm ve iş gücü

- Çıraklık **kendi tohumlanmış üretecini** (`seed + 28`) kullanır: plan süresi, konuşma, çırak işi ve satış. Brain mola zarını her
  zamanki gibi attıktan sonra çırak planına bakar; böylece ana üretecin sırası değişmez. Test, kapı kapalıyken 24 saatlik bakımın ve
  mesai sonunun 24 üreteci ve `Math.random`'u hiç ilerletmediğini doğrular.
- **Bulgu (balonlar):** davranış sistemi bir sakinin ikon balonu boşken ana üreteçten balon zarı atar. Sözleri ikon balonuyla
  göstermek bu zarın sırasını değiştirirdi. Bu yüzden sözler ayrı bir metin katmanına alındı ve 25.1'deki bilge kutlaması ile
  Bilge Nasihati baloncukları da bu katmana taşındı ("Sabır her işin başıdır, evlat.").
- **Gençlerin enerji bonusu:** 25.1'de determinizm için kapatılan bonus (`YOUTH.energyGain = 1`) kapalı kalır; gençlere asıl avantaj
  artık çıraklıktan gelir (mezuniyette Usta / Kalfa başlangıcı).
- Hiç çırak yokken katman hiçbir şeyi değiştirmez (Gururlu Usta çarpanı yalnızca bu bonusu almış ustada hesaplanır, çıraksız
  sakinin çarpanı tam olarak 1'dir). Otopilot, önceki aşamalardaki silo / tezgâh / iskele gibi, Çırak Kapılarını **Ulu Saat Kulesi
  tamamlandıktan sonra** açar; `--no-apprentice` kapıları hiç açmaz.

### Kayıt (sürüm 25)

Sakinlere `apprenticeship`, ustalara `buffs.proudMaster`, kayda `apprenticeship` (açık kapılar, yazılan, mezun, Gururlu Usta,
çırak işi, satış, altın, çırak mesai dakikası) eklendi; konuşma baloncukları kaydedilmez. **Sürüm 2-24 kayıtlarında** çırak yoktur,
bütün kapılar kapalı ve sayaçlar boştur. Bilinmeyen dal, Genç olmayan sakinde çıraklık, var olmayan ya da zanaat yapısı olmayan
kapı ve bozuk sayaç temizlenir; yapısı yıkılmış çırak serbest kalır, kayıp ustanın yerine yapının ustası geçer.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 912; 38'i bu adımın): dallar, çırak işleri ve etkinlik; verinin temizlenmesi; mezuniyet kademeleri;
  Genç / yetişkin uygunluğu; usta seçimi; kapı ve kontenjan; kapalı kapıda etkisizlik ve izole üreteç; Çırak Al ve günlük; kontenjan;
  plan (ustası tezgâhta değilken, tezgâhtayken tabure ve yer ayırmama, kıtlıkta işe dönüş); öğrenme hızı ve yorgunluk; Gururlu Usta
  (olay, günlük, gerçek `NeedsSystem` ile %25 yavaş keyif kaybı); %50 altında / üstünde +%5 verim ve çıraksız sakinde 1; ustası kalkınca
  görevin bitmesi; Çırak İşi (hammadde tüketmeden, ilk iş anısı, %50 altında çıkmaması), Pazar'da satış; sözler (ikon balonu boş kalır);
  tabure ve çizim; gerçek saatlerle mesai; kart ve atölye paneli (Çırak Kapısı tıklaması); kayıt sürümü 25 gidiş-dönüşü, bozuk değerler,
  v24 kaydı; sabah 07:00 kapısı; %100'de Yetkin Usta, %70'te Kıdemli Kalfa.
- **Denetim** (`audit.mjs`): 113/113 (yeni senaryo: çırak ustasının yanındayken, Gururlu Usta etkin ve kapı açıkken kayıt -> yükleme durum
  kayması yok, yüklemeden sonra çıraklık sürer). Bekçi çıraklığın Genç'te olmasını, yapının ve ustanın var olmasını, ilerlemenin 0-100
  kalmasını ve kontenjanı denetler; ustasız çırak ve yetişkin çırak örneklerini sayar.
- **Geriye uyumluluk** (`compat.mjs`, sürüm 2-25, 759): `save-v25.json` bu adımın otopilotuyla 64 günlük oyundur (`--crisis-state`; 9 açık
  kapı, 7 çırak, ikisi %100, 37 çırak işi). v2-v24 kayıtlarında çırak yoktur; v25 kaydında çıraklar, ustaları, ilerlemeleri, kapılar ve
  sayaçlar birebir korunur; hepsinde bir gün sonra çıraklık verisi geçerlidir.
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0, bekleyen iş 0,
  üretmeyen iş yeri 0, sayfa hatası 0. **Ulu Saat Kulesi 6/6, Altın Çağ G31, G33, G31, G28, G34, G34** (25.1 ve `main` ile aynı; tohum 42
  kule G25 / G27 / G28). Her koşunun olay kaydı kulenin son aşaması tamamlanana kadar 25.1 ile **bayt bayt aynıdır**; ilk fark kuleden
  sonra, otopilot Çırak Kapılarını açınca başlar. `--no-apprentice` ile tohum 42'nin 36 günlük kaydı ve bekçi raporu 25.1 ile tamamen
  aynıdır. Altı kasabada kuleden sonra 54 kapı açıldı, 44 genç çırak yazıldı, 352 saat çırak mesaisi, 46 Gururlu Usta; 36 günde hiçbir
  çırak %50'ye ulaşmadı (çırak işi 0), yetişkin çırak 0.
  - **Bulgu:** ilk denemede çırak yalnızca kendi ustasından öğreniyordu; usta çoğu zaman başka işte olduğu için 44 çırak toplam 107 saat
    öğrenebildi. Atölyede o an çalışan en deneyimli yetişkinden de öğrenmesine izin verilince 352 saate çıktı (kayıtlı usta değişmez).
- **Uzun koşu** (`autopilot.mjs 42 64 --crisis-state`): kule G25 / G27 / G28, Altın Çağ G28. 8 genç G29'da çırak yazıldı (oduncu kulübelerinde
  dört, fırında iki, atölye ve şifacıda birer); ikisi %100'e, biri %86'ya ulaştı; 364 saat çırak mesaisi, 17 Gururlu Usta, 37 çırak işi
  (33'ü satıldı, +66 altın). Zanaat Atölyesi ve Şifacı Kulübesi'nde çırak %0'da kaldı (atölye yalnızca sipariş varken, şifacı çoğunlukla
  doğada çalışır). Çıraklardan yalnızca Can 21'e bastı; çıraklığı %60'a ulaşmadığı için unvan almadı, ilerlemesi kadar Odunculuk
  deneyimi ona kaldı (unvanlı mezun 0). Takılma, kopuk referans ve sayfa hatası 0.

## Mizaç kalıtımı, kişilik gelişimi ve yeni nesil huylar (25. aşama, 25.3 mikro adımı)

19. aşamanın dört huyuna (Hayvansever, Kitap Kurdu, Müzisyen, Doğa Tutkunu) dört **yeni nesil huy** eklendi. Bu huylar kuruluşta ve
göçle dağıtılmaz; **Altın Çağ'da yetişen kuşak**, evre geçişlerinde mizacını ailesinden, ustasından ya da kendinden alarak edinir.
Sayılar ve sözler `data/temperament.js`'te, huy tanımları `data/social.js`'te, gelişim ve canlı etkiler `systems/TemperamentSystem.js`'te,
saf yardımcılar `systems/Temperament.js`'tedir.

| Huy | Rozet | Canlı etkileri | Dilekçesi |
|---|---|---|---|
| **Zanaatkâr Ruhu** (`craftsman`) | çekiç ve örs (bakır) | Zanaat yapılarında (atölye, oduncu, şifacı, fırın, tezgâh, şerbethane) **%8 hızlı** çalışır, keyfi **%40 az** düşer; Pazar'a 1,5 kat sık gider ve önce tezgâhı için **Acemi Çivisi** alır; çırak işlerinden **ikisini satmadan** çantasında saklar | **Atölye Malzemesi** (demir 6 + odun 6 ya da bir zanaat yapısını Seviye 2'ye yükselt) |
| **Girişimci Kanı** (`entrepreneur`) | sikkeli kese (altın) | Pazar'a 2,5 kat sık gider ama kesesinde 30 altından azı kalacaksa (ilaç dışında) **almaz**; her yevmiyeye **+1 pazarlık payı**; ihracat sözleşmesi tamamlanınca keyfi +6 | **Pazar Harçları** ("Pazar harçları hafifletilsin"; 25 altın ya da iç vergiyi Düşük / Muaf'a indir) |
| **Bilge Düşünür** (`philosopher`) | baykuş (mor) | Boş zamanında Bilgelik Evi'ni, anıtı, çardağı ve fener altı bankı yeğler; **Kıdemli Bilgelerin nasihatinden iki kat** moral alır | Bilgelik Evi, araştırma, antik kitap (Kitap Kurdu gibi, daha güçlü) |
| **Şenlik Neşesi** (`festive`) | köpüklü kadeh ve konfeti (pembe) | Hana, meydan havuzuna ve ateş başına koşar; handa **2 fıçı kalmışken bile testi alır, iki testi taşır** ve keyfi 60'ın altına inince içer; havuzun başında sağa sola dönerek **dans eder**; boş zamanında 36 piksel yakınındaki uyanık sakinlerin keyfini dakikada +0,03 yükseltir | **Fazladan Şerbet** ("Hana fazladan bir şerbet fıçısı açılsın"; depodan hana 3 fıçı ya da bir şenlik) ve Meydanda Buluşma (x5) |

Her yeni huyun dört mizaç sözü vardır ("Bu tezgâh bana göre!", "Ucuza al, değerinde sat!", "Bilmek, iki kere yaşamaktır.", "Haydi bir
şerbet içelim!"). Sözler 25.2'deki **metin baloncuğu** katmanında görünür ve ikon balonuna dokunmaz.

### Mizaç kalıtımı ve kişilik gelişimi

Kasabanın Altın Çağı başladıktan sonra (Ulu Saat Kulesi tamamlanınca) evre geçişlerinde:

- **Çocuk -> Genç** ve **Genç -> Yetişkin:**
  - **Aile etkisi:** ebeveynlerinden birinin huyu varsa **%60** olasılıkla onu miras alır.
  - **Özgün gelişim:** olmazsa kasabada **en az görülen** huy seçilir. Sekiz huyun hepsi aday; eşitlikte bu katmanın üreteci seçer, böylece dağılım dengeli kalır.
- **Usta etkisi (25.2 ile):** çıraklığını **%50+** ilerlemeyle bitirip yetişkin olan genç %60 olasılıkla etkilenir. Bu durumda yarı yarıya ustasının
  kendi huyunu ya da **mesleğin doğasını** alır: atölye, oduncu ve tezgâh -> Zanaatkâr Ruhu; şifacı -> Bilge Düşünür; fırın ve şerbethane
  -> Şenlik Neşesi. Usta etkisi işlemezse mizaç aile etkisiyle ya da özgün olarak olgunlaşır.
- Kaynak sakinde `quirkOrigin = { kind: family | mentor | craft | self, fromId, fromName, day }` olarak tutulur. Ayrıca sakinin anılarına
  ("Zeynep gibi Hayvansever bir mizaçla büyüdü") ve Kasaba Günlüğü'ne yazılır.
- Kuruluş sakinlerinin ve göçmenlerin huyları 19. aşamadaki gibi kalır: dağıtım (`QUIRK_KEYS`) bilinçli olarak dört kuruluş huyuyla
  sınırlıdır. Bu liste değişseydi kuruluştaki dağıtım ve tohumlar değişirdi.

### Arayüz

- **Karakter Detay Kartı:** huy çipi yeni nesil huylarda renkli bir rozettir (bakır, altın, mor, pembe). Açıklaması ipucunda görünür.
  Sosyal Hayat bölümü huyun adını renkli yazar ve **Mizacı** satırını ekler: "Aile mirası · Mehmet (Gün 70)", "Mesleğin doğası ·
  Marangozluk çıraklığı", "Usta etkisi", "Özgün gelişim".
- `tools/art-preview.html`: dört rozet (9x9), her huyun portresi ve sözü, meydan havuzunda dans eden Şenlik Neşesi (üç kare).

### Determinizm

- Katman **kendi tohumlanmış üretecini** (`seed + 29`) kullanır: kalıtım zarları, özgün gelişim, sözler. Test, gelişim, aura ve sözler
  boyunca 24 üretecin ve `Math.random`'un hiç ilerlemediğini doğrular.
- Bütün canlı etkiler huy denetimine bağlıdır. Yeni huylu sakin yokken hiçbir sistemde hiçbir sayı değişmez: Pazar zarı her sakinde
  aynı atılır, çarpanı öteki huylarda tam olarak 1'dir. Dilekçe seçenekleri de yalnızca yeni huylu sakinde eklenir.
- Gelişim Altın Çağ'da açıldığı için kule öncesi oyun 25.2 ile bayt bayt aynıdır.
- **Bulgu:** 19. aşamadan kalan bekçi kontrolü sakinin huyunu dört huyluk sabit bir listeyle denetliyordu. 72 günlük ilk koşuda yeni huylu
  her sakini "huyu yok" diye 1087 kez kopuk referans saydı. Kontrol artık huy tanımlarını okur.

### Kayıt (sürüm 26)

Sakinlere `quirkOrigin`, kayda `temperament` eklendi: gelişen, aile, usta, meslek ve özgün sayıları, Şenlik aurası dakikası, açılan yeni
tür dilekçeler. Yeni nesil huylar sakinin `quirk` alanında saklanır ve yüklenince yeniden dağıtılmaz. **Sürüm 2-25 kayıtlarında**
huylar aynen korunur (huysuz eski kayıtta dört kuruluş huyundan dağıtılır); huy kaynağı ve sayaçlar boştur. Bozuk kaynak ve sayaçlar
temizlenir.

### Denge ve test (simülasyon)

- **Hedefli testler** (`tests.mjs`, 950; 38'i bu adımın):
  - Veri: sekiz huy ve kuruluş dağıtımının dört huyla kalması, açıklama, rozet ve sözler.
  - Gelişim: Altın Çağ kapısı; aile etkisi (200 denemede ~%60) ve özgün gelişim (en az görülen huy); usta etkisi (ustanın huyu, mesleğin
    doğası, %50 altında değişmeme); Genç -> Yetişkin olgunlaşması.
  - Canlı etkiler: gerçek `performWork` ile Zanaatkâr şevki (tam %8 / %40); Pazar sıklığı (aynı zarla); malzeme alımı; Girişimci
    tutumluluğu ve pazarlık payı; sözleşme sevinci; Şenlik testisi (2 fıçıda alma, iki testi, 60'ta içme) ve aurası (menzil); Bilge
    Düşünür'ün iki kat nasihati; mizaç sözleri; Zanaatkârın çırak işi saklaması.
  - Dilekçeler: üç yeni tür (seçenekler, Türkçe metinler, vergiyle karşılanma, Hemen Karşıla bedelleri ve handa fıçı).
  - İzole üreteç; kart rozeti ve mizacın kaynağı.
  - Kayıt sürümü 26 gidiş-dönüşü, bozuk değerler ve v25 kaydı.
- **Denetim** (`audit.mjs`): 115/115. Yeni senaryo: yeni nesil huylu sakinler varken kayıt -> yükleme durum kayması yok ve yüklemeden
  sonra yeniden dağıtılmazlar. Bekçi bilinmeyen huyu ve geçersiz huy kaynağını denetler.
- **Geriye uyumluluk** (`compat.mjs`, sürüm 2-26, 817; 58'i bu adımın): `save-v26.json` bu adımın otopilotuyla **72 günlük** oyundur
  (`--crisis-state`). Kuleden sonra mizacını alan altı genç var: Can 37. gün özgün gelişimle Şenlik Neşesi, Ada ve Toprak Marangozluk çıraklığından Zanaatkâr Ruhu, Defne Su ve Lina aile mirası, Atlas özgün gelişimle Bilge Düşünür. Kayıtta dört yeni nesil huylu sakin, altı huy kaynağı ve 3877 dakika Şenlik aurası var. **Uyumluluk kontrolü düzeltmesi:** 19. aşamanın kontrolü de huyları sabit dört huyluk listeyle denetliyordu; v26'dan itibaren sekiz huyu kabul eder. v2-v25 kayıtlarında huylar aynen korunur, yeni nesil huy ve kaynak yoktur.
- **Stres matrisi** (`stress.mjs --seeds 7,13,21,42,77,101 --speeds 4 --days 36`): takılma 0, kopuk referans 0, taşan ev 0, bekleyen iş 0,
  üretmeyen iş yeri 0, sayfa hatası 0. **Ulu Saat Kulesi 6/6, Altın Çağ G31, G33, G31, G28, G34, G34** (25.2 ile aynı; tohum 42 kule
  G25 / G27 / G28). Her koşunun olay kaydı kule tamamlanana kadar 25.2 ile bayt bayt aynıdır; ilk farklar 25.2'deki satırlardadır
  (otopilot Çırak Kapılarını açınca). 36 günde iki genç Altın Çağ'da yetişkin olup özgün gelişimle yeni nesil huy edindi, 128 dakika
  Şenlik aurası.
- **Uzun koşu** (`autopilot.mjs 42 72 --crisis-state`): kule G25 / G27 / G28, Altın Çağ G28. Altı mizaç gelişimi (aile 2, mesleğin doğası 2, özgün 2; usta
  etkisi zarı tutmadı), son günde dört yeni nesil huylu sakin (iki Zanaatkâr Ruhu, bir Bilge Düşünür, bir Şenlik Neşesi), 3877 dakika
  Şenlik aurası, üç mezun çırak, 49 çırak işi; takılma, kopuk referans ve sayfa hatası 0. 72 günde yeni huylu sakinlerden dilekçe çıkmadı
  (dilekçeler 1-2 günde bir, rastgele bir sakinden gelir); üç yeni dilekçe hedefli testlerle doğrulandı.

## Kod denetimi (15. aşama öncesi)

Yeni özellikten önce bütün katmanlar denetlendi; bulunan her sorun kökünden düzeltildi ve bir testle kilitlendi.

**Düzeltilen hatalar**
- **Dinleyici sızıntısı:** `WeatherSystem` sahne yeniden kurulunca temizlenmiyordu; her Yükle / Yeni Harita'da bir
  `time:hour` dinleyicisi birikiyordu. `TownScene.exit` artık güncelleme listesindeki sistemleri de temizler.
- **Takılma döngüsü:** Kıtlıkta (yiyecek, pişmiş yemek, böğürtlen yok) ya da evsizken sakin "işe git -> yolda acil
  açlık -> yine işe git" döngüsüne giriyor, ne çalışıyor ne yiyordu. `Brain.hasUrgentNeed` yalnızca giderilebilecek
  ihtiyaçta işi keser.
- **Ad kutusu:** Sakinin adı düzenlenirken sağdaki listeden başka sakin seçilince Enter yeni seçilenin adını
  değiştiriyordu; basılı bir tuşla metin kutusuna geçilince kamera yazarken kaymaya devam ediyordu.
- **Tüccar ve şenlik:** Tüccar yoluna kurulan yapının içinden yürüyordu; şenlik yeri yıkılınca şenlik yersiz sürüyordu.
- **İş gücü:** Hasta ya da seferdeki usta "bekleyen usta" sayılıp son iş yuvasını kilitliyordu.
- **Kayıt:** Kopuk referanslı kayıtlar (var olmayan ev, karşılıksız eş, kayıp ebeveyn) yüklenirken onarılır.
- **Arayüz:** Telefon genişliğinde araç çubuğu ekrandan taşıyordu (artık sarılır, kısayol etiketleri gizlenir).
- **Ses:** Sessizde yalnızca kazanç 0'a iniyor, döngüler ve LFO'lar işlemci harcamaya devam ediyordu. Artık bağlam
  askıya alınır, açılınca kazanç 0'dan yumuşakça yükselir; sessiz başlanan oyunda bağlam hiç kurulmaz.

**Performans:** A* arama tamponları yeniden kullanılır (her aramada üç harita boyu dizi ayrılmaz); ilişki puanı
ekleme, keyif auraları, yürüme, çizim ortamı, ışık listesi ve çizim kuyruğu karesel çöp üretmez; ekran dışındaki
ışıklara gradyan kurulmaz; kışın her karedeki `JSON.stringify` kaldırıldı. 30 sakinli geç oyunda simülasyon adımı
~%26 hızlandı. Ölü kod (`Animation.js` ve dört kullanılmayan dışa aktarım) silindi.

**Test altyapısı:** Testler artık makinenin yükünden bağımsız deterministiktir (eskiden sayfa açılışıyla döngünün
durması arasında gerçek zamana bağlı sayıda adım geçiyordu). Uzun koşuların bekçisi örneği saat buçuğunda alır.

**Metrikler**
- Stres matrisi (`stress.mjs`): 6 tohum (7, 13, 21, 42, 77, 101) x 1x / 2x / 4x x 50 gün = 18 koşu: takılma 0,
  kopuk referans 0, taşan ev 0, bekleyen iş 0, üretmeyen iş yeri 0, sayfa hatası 0. Her koşu Gelişmiş Şehir'e ve
  30 sakine ulaştı; toplam 237 düğün, 93 doğum, 93 büyüme, 55 hastalık.
- Denetim (`audit.mjs`): 49/49 · hedefli testler (`tests.mjs`): 190/190 · uyumluluk (`compat.mjs`, sürüm 2-12): 130/130.

## Simülasyon ve test araçları (`tools/sim/`)

Hepsi oyunu Chromium'da (Playwright) gerçek kodla çalıştırır, oyun döngüsünü durdurup sabit adımlarla ilerletir.
`Math.random` tohumlanır, bu yüzden aynı tohum her seferinde aynı sonucu verir. Önce sunucu açılır
(`python3 tools/serve.py`); Playwright genel olarak kurulu olmalıdır (`npm i -g playwright`). Başka bir adres için
`LMGAME_URL` ortam değişkeni kullanılır. Hepsi başarıda 0, hatada 1 ile çıkar.

| Komut | Ne yapar? |
|---|---|
| `node tools/sim/tests.mjs` | Hedefli kural testleri (950; 25.3: yeni nesil huylar, mizaç kalıtımı ve usta etkisi, yeni dilekçeler, kayıt sürümü 26; 25.2: Usta-Çırak, Çırak Kapısı, Gururlu Usta, çırak işi, mezuniyet, metin baloncukları, kayıt sürümü 25; 25.1: yaşam evreleri, yaşlanma, Kıdemli Bilge emekliliği ve çekirdek sakin kuralı, Bilge Nasihati, kuşak yaşı, evre rozeti, kayıt sürümü 24; 23. aşama: tehlike sıklığı ayarı ve doğal kriz kapıları, Su Kuyusu (yangın ihtimali ×0,2, bahçe sulaması), Gözcü Kulesi ve bekçiler, haydut baskınının üç çözümü (püskürt, haraç, hazırlıksız) ve penceresi, yangın (çıkış, kova zinciri, Acil Söndür, hasarlı ama silinmeyen yapı), Tamir Et ve ustaların onarımı, hafif yaralanma ve Şifacı, ana rastgele sayı üretecinin tüketilmemesi, kayıt sürümü 20; 22. aşama: iç vergi kademeleri ve öşür, Krallık Vergisi (uyarı, ödeme, malla ödeme, ceza), Kraliyet Fermanları ve ödülleri, Kraliyet Beratı ve Aslanlı Heykel, kötü şöhret ve göç, köyü terk etme ve çekirdek sakinler; 21. aşama: kişisel kese ve çanta (harçlık, yevmiye, iş yerinden pay, çantadan yemek, şifalı ot, pazar ve han alışverişi), vatandaş dilekçeleri (oluşma, kabul, hemen karşılama, ret, süre dolması), Yönetim Güveni, isyan, yağmanın depodan çantaya birebir aktarımı, erzak / altın dağıtımı; 20. aşama: Ulu Saat Kulesi'nin açılışı, aşamaları, ustalık katkısı ve Kadim Dişli, Altın Çağ çarpanları, 08:00 / 18:00 çanı, Çağ Kutlaması, prestij peyzajı, tüccarın nadir malları, Tarihçe Kütüğü sekmesi; 19. aşama: Türkçe ad ekleri, huyların dağıtımı ve dört huyun davranışı, randevu (çardak, han, yan yana bank), bankta aşk, ortak kulübe ve boşalan ev, düğün kutlaması ve konfeti, evli çiftin akşam yemeği, dedikodunun oluşması, sohbette ve selamlaşmada yayılması, Yaşam Günlüğü notu, Sosyal Hayat kartı; 18. aşama: inşa sekmeleri, zemin fırçaları, kesintisiz sürükleme, otomatik köşeler, çamur, A*'ın yolları yeğlemesi, yıkım fırçası ve iade, çit / kapı, tabela, çevre estetiği ve refah çarpanı, karanlık, park bankı, süs ağaçları; 17. aşama: ortalanmış Arşiv penceresi; 16. aşama: keşif seferi ve maceralar, ganimetler, yazıtlar; 15. aşama: sosyal denge, meslek kıyafetleri, zanaat rozeti, usta işi eserler): ekonomi, tarifler, seviye, yerleşim, sağlık, hayvanlar, kararlar, Kadim Tılsım şans sayacı, fermanlar, araştırmalar, okul, liman ve tekne, harika, lüks mallar, yadigârlar, altın fermanları, peyzaj, sakin adı, işçi sabitleme, arşiv, fotoğraf modu, Büyük İhracat Seferi, sis ve fırtına, mevsim festivalleri, anılar, hayvan sevme, öncelikli kesim, Toplanma Zili, kayıt |
| `node tools/sim/compat.mjs` | `fixtures/` içindeki eski sürüm kayıtlarını (sürüm 2'den 26'ya; 25.3: mizaç; 25.2: çıraklık; 25.1: yaşam evreleri ve gün cinsinden yaşlar) açar, bir gün yaşatır (yolda sefer varsa gün dönene kadar); referans bütünlüğünü, harita farklarını, eski 48x48 haritayı, lamba dönüşümünü ve yarım projeleri denetler |
| `node tools/sim/legacy-fixtures.mjs` | Sürüm 2-6 fikstürlerini sentezler (o aşamaların kodu depoda yok): bugünkü oyunun kaydı README'deki sürüm tarihçesine göre eski biçime indirgenir |
| `node tools/sim/audit.mjs [--shots klasör]` | Denetim testleri: dinleyici sızıntısı, festival / tüccar / karar penceresi / harabe onarımı / fırtına / toplanma zili / maceralı sefer / düğün kutlaması / Çağ Kutlaması / isyan ve yağma / tahsildar, ferman ve köyü terk eden sakin sırasında, yangın ve haydut izi sürerken kayıt-yükleme (durum kayması yok), kopuk referanslı kaydın onarılması, kış ve kıtlık krizi ve toparlanma, yıkımlar sonrası referanslar, metin kutularında tuş kaçağı, sessizde askıya alınan ses ve yumuşak açılış, beş çözünürlükte arayüz yerleşimi (üst çubuk, çekmece, kart, dock, pencereler birbirine binmez), gerçek tıklama ve tuşlarla arayüz etkileşimi (çekmece, dock ipuçları, ✕ / Esc / dışına tıklama, Ayarlar, harita ipucu) |
| `node tools/sim/stress.mjs [--seeds 7,13,…] [--speeds 4,2,1] [--days 50]` | Stres matrisi: her tohum ve hızda otopilotu paralel koşturur, bekçinin (`monitor.mjs`) takılma, kopuk referans, taşan ev, bekleyen iş ve üretmeyen iş yeri raporlarını toplar |
| `node tools/sim/autopilot.mjs 42 40` | Hilesiz otopilotla 40 günlük oyun (24.3: kuleden ve tezgâhtan sonra Ticaret İskelesi kurar, rezervleri koruyarak ihracat sözleşmelerini tamamlar, altın bolken kritik hammaddeyi ithal eder; ziyaretler, sözleşmeler, ithalat ve pazar çarpanları raporlanır; 24.2: kuleden sonra Dokuma Tezgâhı, Şerbethane ve dördüncü bahçe kurar; kumaş, fıçı, handa içilen şerbet, testi ve giysiler raporlanır; 24. aşama: gıda kritikse bahçeleri Buğday'a döndürür, kuleden sonra Ürün Silosu kurar ve bir bahçeye Keten, birine Şerbetçiotu ektirir; `--no-agri` bunu kapatır; gıda güvencesi (kişi başı en düşük besin, kritik gıda saati), ekim değişiklikleri ve bozulan mahsul raporlanır; 23. aşama: Su Kuyusu ve Gözcü Kulesi diker, yangını söndürür, hasarı tamir eder, baskına karşı püskürtür / haraç öder; `--crisis huzurlu|dengeli|cetin`, `--no-safety` (22. aşamayla bire bir aynı koşu), `--crisis-state` (fikstür için kriz durumu kurar); 18. aşama: kapıları yola bağlar, parke döşer, süs ve ağaç diker; döşenen yol, estetik ve yürüyüşlerin yoldan geçme oranı raporlanır): günlük özet (araştırma, altın, sefer, harika aşaması, yadigâr ve harcanan altın dahil), olay günlüğü, ekipman ve refah özeti, sonunda stokların araştırma / ihracat / harikaya, altının yadigâr / lüks mal / fermanlara ne kadar harcandığı, peyzaj ve son 12 günün ortalama stoğu; (14. aşama) mevsim festivalleri ve katılımcıları, anı sayıları ve örnek bir sakinin anıları, nadir hava olayları, Büyük İhracat Seferi sayısı. `--passive` kararları zaman aşımına bırakır, `--quiet` yalnızca sonu basar, `--save dosya.json` kaydı yazar, `--speed 1\|2\|4` oyun hızını seçer, `--json rapor.json` bekçi raporunu yazar (takılma ya da kopuk referans varsa çıkış 1) |
| `node tools/sim/preview.mjs ["başlık"]` | Sanat önizleme sayfasının bölümlerinin ekran görüntüleri (`tools/sim/out/`) |
| `node tools/sim/showcase.mjs 11` | Oyun içi vitrin: yeni yapılar ve hayvanlar, liman ve yanaşan tekne, Bilgelik Evi, harika, peyzaj ve çardak, yadigârlı konak, yapı panelleri, Kasaba Arşivi, fotoğraf modu, karar penceresi, fermanlar, gece görünümü, dört mevsim festivali, sabah sisi, Toplanma Zili, yaz fırtınası, anılar paneli |

`tools/sim/lib.mjs` ortak yardımcıları içerir: oyunu açma, saat saat ilerletme (oyunun hızına göre adım sayısı),
`window.sim` (yapı kurma, kaynak verme, olay günlüğü) ve test kaydı. `tools/sim/monitor.mjs` uzun koşuların bekçisidir:
saat başı sakinlerin takılıp takılmadığını (boşta / yolda aynı karoda 150 dakika, yürünemez karoda 120 dakika), referans
bütünlüğünü ve iş gücünü denetler; 21. aşamadan beri keseleri, çantaları (kapasite, bozuk eşya), dilekçeleri, isyancıları ve
yağma hedeflerini de denetler, güvenin en düşük değerini, isyan saatlerini ve dilekçe sonuçlarını raporlar; 22. aşamadan beri
vergi kademesini, Krallık Vergisi takvimini, fermanları, yolda takılan göçmeni ve çekirdek nüfusu denetler, vergileri, ödemeleri,
fermanları ve terk edenleri raporlar; 23. aşamadan beri yanan / hasarlı yapıları, yaralıları, bekleyen baskını ve nöbetçi sayısını denetler, yangın, baskın, yaralanma ve tamir sayılarını raporlar (takılma denetimi artık konumun da kıpırdamamasını ister); 19. aşamadan beri evlilik akışını da izler (30 saatte yeni evine taşınamayan sakin, boş yatak
varken 48 saat ayrı evlerde kalan evli çift, bitiş vaktini aşan kutlama, huyu olmayan sakin, kayıp sakine işaret eden haber) ve en
düşük nüfusu, evsizleri ve sosyal sayaçları raporlar.

## Arayüz yerleşimi ve dar pencereler

17. aşamadan beri arayüz ekranın kenarlarında ince şeritler hâlinde durur, ortası oyun alanına kalır
(`ui/UIManager.js`, `styles/ui.css` → "17. aşama" bölümü):

- **Üst çubuk:** Tek satırlık, yarı saydam bilgi şeridi. Solda kasaba adı ve seviye pipleri; ortada mevsim, gün ve
  saat (hava simgesiyle), duraklat / 1x / 2x / 4x ve ses; sağda Odun, Taş, Yiyecek, Altın, **Mallar ▾** açılır listesi,
  refah çubuğu ve nüfus. Etkin bonuslar çubuğun hemen altında küçük çipler olarak görünür. 1240 pikselden dar
  pencerede kaynaklar ikinci satıra, telefonda (620 piksel altı) üç kısa satıra sarılır.
- **Sağ sütun:** Üstte **Kasaba Sakinleri** çekmecesi, altta bağımsız bilgi kartı (sakin, yapı ya da takas). Kart
  her zaman sütunun dibine oturur ve çekmeceyle aynı genişlikte, aynı sağ kenardadır; kart açılınca çekmece yer
  açar (ikisi de kendi içinde kayar, üst üste binmez). Çekmece ▸ ile sağa doğru kapanır; kenarda yalnızca kişi
  simgesi ve sakin sayısı yazan ince bir sekme kalır, tıklanınca liste sağdan kayarak açılır. Tercih tarayıcıda
  hatırlanır; telefonda (tercih yoksa) kapalı başlar.
- **Alt dock:** Araçlar (İnşa Et, Topla, Yık) ve pencere düğmeleri (Hedefler, Günlük, Arşiv, Fotoğraf, Ayarlar) tek
  çubukta. Düğmelerin köşesinde kısayol yazar; üzerine gelince kısayol ve açıklama ekrandan taşmayan bir ipucunda
  belirir. İnşa aracında yapı listesi dock'un üstünde açılır, bir araç seçiliyken ipucu satırı dock'un hemen
  üstündedir. 860 pikselden dar pencerede dock yalnızca simgelere iner.
- **Ortalanmış pencereler (`ui/ModalHost.js`):** Kasaba Hedefleri, Kasaba Günlüğü, Kasaba Arşivi ve Ayarlar ekranın
  ortasında, üst çubukla dock arasında açılır; arkada hafif bir karartma olur. Aynı anda yalnızca biri açıktır.
  Sağ üstteki ✕, `Esc` ya da pencerenin dışına tıklamak kapatır (tıklama haritaya geçmez, `Esc` seçimi bırakmaz).
  Karar penceresi açıkken `Esc` pencereleri kapatmaz; karar beklenir.
- **Harita ipucu (`MapTooltip`):** Seç aracında imleç bir karoda kısa süre durunca imlecin yanında karonun adı ve
  durumu (Yürünebilir, İnşa Edilebilir, sakin, yapı, iş emri) görünür; araç seçiliyken, pencere açıkken, sağ tıkla
  sürüklerken ve fotoğraf modunda gizlenir.
- **Alt ve üst sınır:** Dock'un ve üst çubuğun yüksekliği ölçülüp `--ui-bottom-reserve` / `--ui-top-reserve`
  olarak verilir; sağ sütun ve pencereler bu sınırların arasında kalır. Dock sağ sütunun altına uzanmıyorsa
  (geniş ekran) kart pencerenin dibine kadar iner.
- **Bildirimler:** Üst çubuğun hemen altında ortada; 1100 pikselden dar pencerelerde sakinler listesine binmesin
  diye sağ sütunun soluna ortalanır.

## Sık yapılacak işler

| Ne yapmak istiyorum? | Nereye dokunmalı? |
|---|---|
| Yeni zemin karosu | `art/tiles/index.js` (görsel) + `data/tiles.js` (kurallar) |
| Yeni bina | `data/buildings.js` + `art/sprites/` |
| Yeni karakter ihtiyacı / özelliği | `data/characters.js` |
| Yeni sakin (isim, görünüm, özellikler) | `data/characters.js` → `RESIDENT_POOL` |
| Yeni saç stili / kıyafet rengi | `art/sprites/characters.js` → `HAIR_STYLES`, `art/palette.js` → `CHARACTER_COLORS` |
| Yeni etkinlik | `data/activities.js` + `ai/Brain.js` → `resolveLeisure` |
| Karar önceliklerini değiştirmek | `ai/Brain.js` → `decide` |
| Karoların yürüme maliyeti | `data/tiles.js` → `moveCost` |
| Yeni inşa edilebilir yapı | `data/buildings.js` (+ `BUILD_MENU`) + `art/sprites/structures.js` → `getStructureSprite` |
| Maliyet, üretim, inşaat süresi | `data/buildings.js` |
| Neyin kesilip ne verdiği | `data/tiles.js` → `harvest` |
| Mesai saatleri, iş hızı, mola | `data/characters.js` → `WORK_HOURS`, `DEFAULT_WORK`, `TRAITS.*.work` |
| Depo kapasitesi, başlangıç stoğu | `data/resources.js` |
| Yeni hava türü / yağmur etkisi | `data/weather.js` (+ `systems/WeatherSystem.js`, `rendering/WeatherEffects.js`) |
| Arkadaşlık hızı ve seviyeleri, aşk ve evlilik | `data/relationships.js` |
| Çocuklar, Mutlu Yuva, atışma / barışma olasılıkları | `data/family.js` |
| Zıt kişilik çiftleri | `data/characters.js` → `OPPOSING_TRAITS` |
| Yeni ekipman ya da maliyeti / etkisi | `data/equipment.js` (+ simge `art/ui/index.js`, görünüm `art/sprites/characters.js`) |
| Yeni kaynak / işlenmiş mal | `data/resources.js` (+ simge ve taşıma yükü `art/ui/index.js`, başlangıç `STARTING_RESOURCES`) |
| Yan ürün, işleme (girdi -> ürün) | `data/buildings.js` → `production.extra`, `processing` (mantık `systems/BehaviorSystem.js`) |
| Kasaba seviyesi koşulları ve ödülleri | `data/town.js` → `TOWN_TIERS` (ölçüm `systems/TownStatus.js`, akış `systems/TownLevelSystem.js`) |
| Seviyeyle açılan yapı | `data/buildings.js` → `requiresTier` |
| Belediyenin erzak dengesi | `data/town.js` → `TOWN_HALL` |
| Tüccarın seviyeye göre malları | `data/trade.js` → `minTier`, `offerStock` (+ `TOWN_TIERS.merchantBonus`) |
| Hastalık olasılığı, etkileri, Dinçlik | `data/health.js` → `ILLNESS`, `VIGOR` (mantık `systems/HealthSystem.js`) |
| Hayvan sayısı, hızı, ürkme ve sevme | `data/animals.js` → `WILDLIFE`, `PETS` (görsel `art/sprites/animals.js`) |
| Yeni karar olayı ya da seçeneği | `data/dilemmas.js` → `DILEMMAS` (+ özel etki `systems/DilemmaSystem.js` → `apply`) |
| Fırtına hasarı, onarım maliyeti, sefer ganimeti | `data/dilemmas.js` → `STORM`, `EXPEDITION` |
| Belediye fermanları | `data/town.js` → `CIVIC_PROJECTS` (mantık `systems/CivicSystem.js`) |
| Yeni araştırma ya da etkisi, okul kuralları | `data/research.js` → `RESEARCH`, `SCHOOL` (etkilerin saf yardımcıları `systems/ResearchSystem.js`) |
| İhracat değerleri, sınırlar, tekne aralığı / kapasitesi / hızı | `data/trade.js` → `EXPORT` (mantık `systems/HarborSystem.js`) |
| Harikanın aşamaları, maliyetleri, ışığı ve ısıttığı alan | `data/buildings.js` → `wonder.wonder` (görsel `art/sprites/structuresWonder.js`) |
| Proje türlerinin sözcükleri (Yükselt / Onar / Aşama) | `data/buildings.js` → `PROJECT_WORDS` |
| Lüks malların, yadigârların, altın fermanlarının fiyatı ve etkisi | `data/luxury.js` (etkiler `systems/Luxury.js`, simgeler `art/ui/index.js`) |
| Arşivde saklanan gün sayısı, grafiklerin gün sayısı | `config.js` → `HISTORY_DAYS`, `HISTORY_CHART_DAYS` |
| Mevsim festivalinin yeri, süslemeleri, bonusu, anı cümlesi | `data/festivals.js` (bonuslar `data/town.js` → `TOWN_BUFFS`, süsleme görselleri `art/sprites/festival.js`) |
| Yeni anı türü ya da nostalji olasılığı | `systems/MemorySystem.js` (olayı dinle, `addMemory`; sayılar `MEMORY`) |
| Nadir hava olayının mevsimi, saati, olasılığı | `data/weather.js` → `WEATHER_TYPES`, `WEATHER_SPECIALS` (çizim `rendering/WeatherEffects.js`) |
| Büyük İhracat Seferi'nin fiyatı, bekleme süresi, yükü | `data/trade.js` → `EXPORT.grandVoyage` |
| Yeni süs yapısı (altından geçilen, birleşen, oturulan) | `data/buildings.js` → `walkable`, `connects`, `gazebo` (+ `art/sprites/structuresGarden.js`) |
| Zemin fırçası (bedel, sonuç karo) | `data/buildings.js` → `TILE_BUILDS` (hız / maliyet `data/tiles.js`, köşeler `art/tiles` → `CORNER_ART`) |
| Süsün estetik değeri, yarıçap, refah çarpanı eşikleri | `data/landscape.js` → `AESTHETIC` (mantık `systems/LandscapeSystem.js`) |
| Karanlıkta ürkme, ışık yarıçapları, çamur | `data/landscape.js` → `DARKNESS`, `MUD` |
| Süs ağacının büyüme süresi, sokak adları, inşa sekmeleri | `data/landscape.js` → `ORNAMENTAL_TREES`, `STREET_NAMES`, `BUILD_TABS` |
| (20. aşama) Ulu Saat Kulesi'nin açılışı, aşamaları ve ustalık katkısı | `data/goldenAge.js` → `TOWER_UNLOCK`, `TOWER_MASTERY`; aşamalar `data/buildings.js` → `wonder.wonder.stages` |
| Kadim Dişli'nin tarifi, Çağ Kutlaması, çan saatleri ve Altın Çağ çarpanları | `data/goldenAge.js` → `CLOCK_GEAR`, `AGE_CELEBRATION`, `GOLDEN_AGE` |
| Tüccarın Altın Çağ malları | `data/goldenAge.js` → `GOLDEN_OFFERS` (satış `systems/EventSystem.js` → `grantRare`) |
| (19. aşama) Randevu eşiği, olasılığı ve yerleri, randevu bonusu | `data/social.js` → `DATING` (plan `ai/Brain.js` → `planDate`, etki `systems/SocialSystem.js`) |
| Düğün kutlamasının süresi, davetli sayısı; evli çiftin akşam yemeği saatleri | `data/social.js` → `WEDDING_PARTY`, `HOME_DINNER` |
| Yeni bir karakter huyu eklemek | `data/social.js` → `QUIRKS` (simge `art/ui`), boş zaman etkinliği `data/activities.js` + `Brain.resolveLeisure` |
| Dedikodunun yayılma hızı, haber ömrü, defterdeki not sayısı | `data/social.js` → `GOSSIP` |
| Birleşen (çit) ya da fırçayla dizilen yeni süs | `data/buildings.js` → `connects: 'grup'`, `brush: true` (+ `art/sprites/structuresLandscape.js`) |
| Simülasyon / test | `tools/sim/` (bkz. *Simülasyon ve test araçları*) |
| Günlüğe yeni olay | `systems/JournalSystem.js` (olayı dinle, metnini yaz) |
| Kayda yeni alan | `state/GameState.js` → `toJSON` / `restore` (+ `SAVE_VERSION`) |
| Mevsim uzunluğu | `config.js` → `DAYS_PER_SEASON` |
| Mevsim etkileri (hasat, donma, hava, ışık) | `data/seasons.js` → `SEASONS` |
| Isınma gideri, üşüme çarpanları | `data/seasons.js` → `HEATING` |
| Mevsim renkleri, kar görünümü | `art/seasons.js` (+ `art/palette.js` mevsim tonları) |
| Meslekler, kademe eşikleri | `data/skills.js` |
| Göç / şenlik koşulları, bonuslar, kasaba adı önerileri | `data/town.js` |
| Yeni kasaba hedefi | `data/milestones.js` (+ ölçümü `systems/MilestoneSystem.js` → `milestoneProgress`) |
| Harita boyutu | `config.js` → `MAP_WIDTH`, `MAP_HEIGHT` (yalnızca yeni oyunlar; kayıt kendi boyutunu saklar) |
| Yeni biyom ya da biyom bonusu | `data/tiles.js` (`biome.buildingBonus`, `GROUND_TILES`) + `art/tiles/index.js` + `world/WorldGenerator.js` → `paintBiomes` |
| Yükseltme maliyeti / etkileri | `data/buildings.js` → ilgili yapının `upgrade` alanı (+ görsel `art/sprites/structuresTier2.js`) |
| Yeni harabe | `data/buildings.js` (`ruin` alanı, `RUIN_TYPES`) + `art/sprites/structuresTier2.js` |
| Oyunun adı, başlangıç ekranı | `config.js` → `GAME_TITLE`, `ui/components/TitleMenu.js` |
| Takas teklifleri, tüccar takvimi | `data/trade.js` |
| Yeni ses ya da ambiyans | `systems/AudioSystem.js` (sentez araçları `core/SoundEngine.js`) |
| Yeni dinamik olay | `systems/EventSystem.js` (+ günlük metni `JournalSystem.js`) |
| Yeni simülasyon kuralı | `systems/` altında yeni sistem, `TownScene` içinde listeye ekle |
| Yeni arayüz paneli | `ui/components/` + `UIManager` içinde kaydet (`slot`: `top`, `toasts`, `drawer`, `cards`, `bottom`, `free`; ortadaki pencere için `modal = { id, element }` ve `setOpen`, dock düğmesi için `dockButtons`) |
| Panel yerleşimi, dar pencere kuralları | `styles/ui.css` → `.ui-sidebars`, `.ui-column`, `@media` blokları |
| Yeni ekran (menü, ev içi) | `scenes/` + `main.js` içinde `register` |
| Tuş ataması | `core/Input.js` → `KEY_BINDINGS` |
| Renk paleti | `art/palette.js` |
| Gündüz/gece renkleri | `rendering/DayNightOverlay.js` → `KEYFRAMES` |
| Harita üretim ayarları | `world/WorldGenerator.js` (üstteki sabitler) + `config.js` |

## Pixel art nasıl tanımlanır?

Sprite'lar `art/palette.js` içindeki harflerle metin ızgarası olarak yazılır (`.` = şeffaf):

```js
const BENCH = [
  '................',
  '.KKKKKKKKKKKKKK.',
  '.KEEEEEEEEEEEEK.',
  ...
];
```

`PixelSprite.js` bunları ilk kullanımda canvas'a çevirip önbelleğe alır. Yanlış satır uzunluğu
veya palette olmayan bir harf açık bir hata mesajıyla bildirilir.

Varyasyonlar elle tekrar çizilmez, ızgara yardımcılarıyla türetilir:

- `composeRows(taban, [[desen, x, y], ...])`: tabana çiçek, çakıl gibi küçük desenler basar
- `rotateRows` / `flipRowsHorizontal`: kenar geçişleri tek yön çizilir, diğerleri döndürülür
- `shiftRowsVertical`: su animasyonu karelerini üretir
- `recolorRows`: aynı şeklin farklı renk tonu (ör. kırmızı imleç, kulübe çatı renkleri, gece yanan pencereler)
- `squashRows`: nefes alma ve oturma kareleri
- `CharGrid`: kulübe ve havuz gibi büyük çizimler için dikdörtgen/elips/çizgi araçları

Karakterler tek bir gövde şablonu ve saç katmanından üretilir. Şablondaki rakamlar
(`1` saç, `3` üst giysi, `5` pantolon, `6` ten…) kişiye özel palette gerçek renklere dönüşür.

Kenar geçişleri (yol/kum kenarındaki çimen kıvrımı, kıyıdaki su köpüğü) `data/tiles.js`
içindeki `edgeOverlay` alanıyla tanımlanır ve `TileMap` tarafından otomatik çizilir. Elle çizilmiş PNG'ler de
`assets/images/` altına konup `AssetLoader` ile yüklenebilir; iki yöntem birlikte kullanılabilir.
