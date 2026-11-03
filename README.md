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
tohum verilebilir: `http://localhost:8080/?seed=42` (mevcut tohum sol sütunun dibindeki ipuçları panelinde yazar);
tohumlu adres her zaman yeni oyun başlatır ve tohumu adres çubuğundan siler, böylece F5 o oyunu sürdürür.

**Kontroller**

| Girdi | Eylem |
|---|---|
| Sol tık (karakterin / yapının üstüne) | Sakini ya da yapıyı (harabe dahil) seç, bilgi panelini aç |
| Yapı panelinde bir isme tık | O sakini seç ve kamerayı ona kaydır |
| Yapı panelinde **Yükselt** / **Onarımı Başlat** | Yapıyı Seviye 2'ye yükselt ya da harabeyi onar (maliyet peşin) |
| Yapı panelinde **İşten Çıkar** / **Geri Al** | Çalışanı o iş yerinden çıkar (başka iş arar) / yeniden çalışabilsin |
| Zanaat Atölyesi panelinde **Otomatik / Alet / Palto / Çanta** | Atölyenin ne üreteceğini seç |
| Karakter panelinde eşin, çocuğun, ebeveynin ya da bir ilişkinin adı | O sakini seç |
| `B` | İnşa et aracı (alt çubuktan yapı seç, haritada tıkla; yolu sürükleyerek döşe) |
| `H` | Kaynak topla aracı (ağaç, kaya, çalı üzerinde sürükle; emirliden başlarsan kaldırır) |
| `X` | Yık / iptal aracı (yapı, şantiye, yol, toplama emri) |
| Sağ üstteki listede bir isim | Sakini seç ve kamerayı ona kaydır |
| `Esc` / paneldeki ✕ | Önce aracı, sonra seçimi bırak |
| `J` / HUD altındaki **Günlük** düğmesi | Kasaba Günlüğü'nü aç / kapat |
| `G` / HUD altındaki **Hedefler** düğmesi | Kasaba Hedefleri panelini aç / kapat |
| HUD'daki kasaba adına tık | Kasabanın adını değiştir (Enter kaydeder, Esc vazgeçer) |
| Gezgin tüccara ya da tüccar varken Pazar Yeri'ne tık | Takas penceresini aç |
| HUD'daki hoparlör düğmesi | Sesi kapat / aç (tercih hatırlanır; ses ilk tıklamayla başlar) |
| HUD'da **6/8 Sakin** üzerine gel | Yarın sabahki göç koşulları (yatak, yiyecek, refah) |
| HUD'daki mevsim satırı ("Sonbahar · Gün 2/4") | Hangi mevsimde ve kaçıncı gününde olduğun; üzerine gelince yıl |
| HUD: **Kaydet** / **Yükle** / **Yeni Harita** | Oyunu kaydet, son kayda dön, rastgele yeni haritayla baştan başla (onay ister) |
| WASD / ok tuşları | Kamerayı kaydır (takibi bırakır) |
| Sağ (veya orta) tık + sürükle | Haritayı sürükle |
| Fare tekerleği, `+` / `-` | Yakınlaştır / uzaklaştır (2x – 6x) |
| Boşluk | Zamanı durdur / devam ettir |
| `1` `2` `3` veya HUD butonları | 1x / 2x / 4x zaman hızı |

## Klasör yapısı

```
LMGame/
├── index.html              Tek sayfa: canvas + HTML arayüz katmanı
├── tools/serve.py          Önbelleksiz geliştirme sunucusu
├── tools/art-preview.html  Yapı ve simgeleri büyütülmüş gösteren sanat önizleme sayfası (/tools/art-preview.html)
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
    │   ├── SeasonalEffects.js Sonbaharda ağaçlardan süzülen yapraklar (kar yağışı WeatherEffects'te)
    │   ├── RenderQueue.js  Y-sıralı çizim kuyruğu (ağacın arkasındaki gerçekten arkada kalır)
    │   ├── TileCursor.js   Karo / alan vurgusu (köşe parantezleri; seçili yapı, hayalet önizleme)
    │   └── Animation.js    Kare tabanlı animasyon oynatıcı
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
    │       └── structuresCraft.js Zanaat Atölyesi (tezgâh, alet askısı, mankende palto, kıvılcımlı örs)
    ├── data/               Saf veri tanımları (oyun kuralları, denge değerleri)
    │   ├── tiles.js        Karo/nesne kuralları: yürünebilir, inşa edilebilir, yol bulma maliyeti;
    │   │                   mikro-biyom karoları ve yapı bonusları
    │   ├── buildings.js    Yapı kuralları: boyut, maliyet, inşaat süresi, üretim, kapasite; inşa menüsü;
    │   │                   Seviye 2 yükseltmeleri (upgrade) ve kadim harabeler (ruin)
    │   ├── resources.js    Odun / Taş / Yiyecek, başlangıç stoğu, depo kapasitesi, öğün maliyeti
    │   ├── jobs.js         İş emri türleri (inşaat, kesim, kırma, toplama), öncelik, işçi sayısı
    │   ├── weather.js      Hava türleri ve geçiş olasılıkları, yağmurun etkileri, ateşböceği saatleri
    │   ├── relationships.js İlişki seviyeleri (Rakip … En İyi Arkadaş), puan hızları, aşk ve evlilik kuralları
    │   ├── family.js       Mutlu Yuva, çocuklar ve büyüme, çocuk adları; atışma ve barışma olasılıkları
    │   ├── equipment.js    Ekipman yuvaları, Sağlam Alet / Kışlık Palto / Sırt Çantası, atölye üretim modları
    │   ├── town.js         Refah ağırlıkları, göç koşulları, şenlik kuralları, kasaba bonusları, sıcak yemek
    │   ├── trade.js        Takas teklifleri (sonbahara özel olanlar dahil) ve gezgin tüccarın ziyaret düzeni
    │   ├── seasons.js      4 mevsim: bahçe / çalı / büyüme çarpanları, kış, hava ağırlıkları, ışık tonu; ısınma
    │   ├── skills.js       Meslekler, etkinlik -> meslek eşlemesi, Çırak / Kalfa / Usta kademeleri
    │   ├── milestones.js   8 kasaba hedefi: ad, açıklama, simge, ölçüm türü ve hedef sayı
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
    │   └── Building.js     Yapı: şantiye ilerlemesi, içindekiler, çalışanlar, üretim, ışıklar, çizim
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
    │   ├── EconomySystem.js Kaynak bankası: harca / ekle / iade, depo kapasitesi, uyarılar
    │   ├── JobSystem.js    İş kuyruğu: toplama ve inşaat emirleri, kime hangi iş, tamamlanma
    │   ├── ConstructionSystem.js Yerleşim kontrolü, şantiye, yol/köprü döşeme, yıkım; yükseltme ve
    │   │                   harabe onarımı (proje başlat / iptal / tamamla, erzak hazinesi)
    │   ├── NatureSystem.js Kesilen ağaç: kütük → fidan → ağaç
    │   ├── PopulationSystem.js Göçmen üretir, boş eve yerleştirir ve harita kenarından yürütür
    │   ├── EventSystem.js  Dinamik olaylar: göç koşulları, gezgin tüccar ve takas, akşam şenliği
    │   ├── TownStatus.js   Saf hesaplar: refah (anıt ve gözetleme kulesi bonusu dahil), konut kapasitesi,
    │   │                   göç durumu, kasaba bonusları
    │   ├── AudioSystem.js  Olayları seslere bağlar; yağmur, su, kuş, cırcır, kış rüzgârı, şenlik ezgisi
    │   ├── HeatingSystem.js Kışın odun yakma, odun bitince soğuk evler, üşüme ve "İçi Isındı"
    │   ├── SkillSystem.js  Meslek deneyimi, kademe atlama, ustalık iş hızı bonusu
    │   ├── MilestoneSystem.js Kasaba hedefleri: ilerleme, tamamlanma, kış sınavı takibi, anıt kutlaması
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
    │   ├── UIManager.js
    │   ├── dom.js          Küçük DOM oluşturma yardımcısı
    │   └── components/     Hud (zaman, hava, kaynaklar, kayıt düğmeleri), ResidentList, CharacterPanel
    │                       (ihtiyaçlar, aile, ilişkiler, ekipman, meslekler), BuildingPanel (Yapı Bilgi
    │                       Paneli: evdeki aile, çalışanlar + İşten Çıkar, atölye üretimi, verim
    │                       çarpanları, Yükselt / Onar), BuildMenu (alt araç çubuğu),
    │                       Toasts (bildirimler), TownJournal (Kasaba Günlüğü), TradePanel
    │                       (takas penceresi), MilestonePanel (hedefler), CelebrationModal (anıt
    │                       kutlaması), TitleMenu (başlangıç ekranı), ControlsHint
    ├── state/              Kaydedilebilir oyun durumu
    │   ├── GameState.js    Tek doğruluk kaynağı; toJSON / restore ile kayıt dönüşümü
    │   └── SaveManager.js  localStorage yuvaları ('main' ve 'session'), sürüm kontrolü
    └── utils/              math, random (tohumlu), noise (Perlin), pathfinding (A*)
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
100'dür, her Kiler +100 ekler. Değişiklikler HUD'da +5 / -10 olarak belirir.

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
olduğunda evinde ya da Kilerde hızlıca yer (öğün başı 3 yiyecek); stok bitince böğürtlen çalılarına yönelir.

**Göç:** Her sabah 08:00'de şu üç koşul birlikte sağlanırsa haritanın kenarındaki yoldan yeni sakinler
gelir (sabah başına en fazla 2, kasabada en fazla 24 kişi; 8. aşamada 15'ten çıkarıldı): **boş yatak**, **güvenli yiyecek stoğu**
(en az 15 ve sakin başı 3) ve **refah en az %55**. Başlangıçta 3 kulübe ve 6 sakin vardır, her yatak
doludur. Boş yatak olduğu hâlde göçmen gelmezse nedeni bildirim ve günlükte yazar; HUD'daki
**6/8 Sakin** yazısının üzerine gelince koşulların durumu görünür.
9. aşamadan beri evli çiftlerin evlerindeki boş yataklar çocuklara ayrılır: göçmenler oraya yerleşmez
(bkz. *Aile, drama ve zanaat*).

**Doğa:** Kesilen ağacın yerinde kütük kalır; 24 saat sonra fidan, 36 saat sonra yeniden ağaç olur.

## Kayıt ve yükleme

Kayıt `localStorage`'a yazılır ve iki yuvası vardır:

| Yuva | Ne zaman yazılır? | Ne işe yarar? |
|---|---|---|
| `main` | **Kaydet** düğmesi ve her sabah **06:00** ("Otomatik kaydedildi" bildirimi) | **Yükle** düğmesi bunu açar; HUD'da kaydın tarihi görünür |
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
(`craftMode`, `craft`) ve iş yerlerinden çıkarılan çalışanlar (`excludedWorkers`) eklendi. Kayıt sürümü
7'dir; 4.–8. aşamanın (sürüm 2–6) kayıtları da açılır: eksik alanlar varsayılanla dolar (herkes bekâr,
yetişkin ve ekipmansız başlar), adı olmayan kasabaya tohumdan bir ad önerilir. Harita boyutu yazılmamış eski kayıtlar **48x48, biyomsuz** haritalarıyla açılır
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

**Kasaba Günlüğü** (`J` ya da HUD altındaki düğme) olayları saatiyle listeler: "Gün 2, 08:00 – Leyla kasabaya
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

**Kasaba Hedefleri** (`G`): sırayla 8 hedef. Her biri ilerleme çubuğuyla görünür; tamamlanınca bildirim, ses
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
| Sağlam Alet | Alet | 4 odun + 4 taş | 70 | Üretim ve inşaat hızı **+%25** | Elindeki baltanın / kazmanın / çekicin başı çelik, sapı koyu |
| Kalın Kışlık Palto | Kıyafet | 6 odun + 4 yiyecek | 80 | Kışın dışarıda üşümenin enerji ve keyif etkisi **%60 az**; üşüme balonu da seyrekleşir | Sonbahar ve kışta beyaz yakalı lacivert palto |
| Sırt Çantası | Çanta | 5 odun + 3 yiyecek | 60 | Yürürken **%40 daha az** yorulur, çalışma verimi **+%15** | Sırtında deri çanta (önden askıları görünür) |

Kasabada lif kaynağı yoktur. Bu yüzden paltonun malzemesi odun (düğme, astar, kalıp) ve yiyecektir (kürk ve
yağlı deri karşılığı).

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

## Arayüz yerleşimi ve dar pencereler

Sol sütunda HUD, Günlük, Hedefler ve en altta kontrol ipuçları; sağ sütunda takas penceresi, sakin listesi,
karakter ve yapı panelleri durur. İki sütun aynı esnek kapsayıcıdadır (`.ui-sidebars`, `styles/ui.css`):

- **Geniş pencere:** Sütunlar iki kenarda durur. Yer daralınca önce sağ sütun incelir (en az 240 piksel).
- **680 pikselden dar pencere:** Sütunlar alt alta dizilir ve pencere yüksekliğini paylaşır.
- **Taşan içerik:** Her sütun kendi içinde dikey kayar; paneller ezilmez, üst üste binmez.
- **Alt sınır:** Sütunlar alttaki inşa çubuğunun üstünde biter. Çubuğun yüksekliği `UIManager` tarafından
  ölçülür ve `--ui-bottom-reserve` olarak verilir; yapı listesi açılınca sütunlar yukarı çekilir.
- **İpuçları paneli:** Dar ya da kısa (640 pikselden alçak) pencerelerde gizlenir.
- **Bildirimler:** 1100 pikselden dar pencerelerde inşa çubuğunun hemen üstünde ortalanır.

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
| Yeni arayüz paneli | `ui/components/` + `UIManager` içinde kaydet (`slot`: `left` / `right` sütun, `top`, `bottom`, `free`) |
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
