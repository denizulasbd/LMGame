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
| HUD'da **Mallar** satırındaki ▸ / ▾ | İşlenmiş malları (Yün, Demir, Ekmek) özet ya da açık görünüme al (seçim hatırlanır) |
| HUD'da kasaba unvanının yanındaki dört pip | Kasaba seviyesi; üzerine gelince sonraki seviyenin koşulları ve ödülleri |
| Karar penceresindeki seçenekler | Sürpriz olayda kararını ver (oyun durur; 30 sn içinde seçmezsen varsayılan güvenli seçenek) |
| Belediye Konağı panelinde **Fermanı İlan Et** | Büyük Ziyafet, Depo Genişletmesi ya da Zanaat Loncası fermanını ilan et |
| Hasarlı yapının panelinde **Onarımı Başlat** | Fırtınada / kurt saldırısında hasar gören yapıyı onar |
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
    │       ├── structuresCraft.js Zanaat Atölyesi (tezgâh, alet askısı, mankende palto, kıvılcımlı örs)
    │       ├── structuresFarm.js Koyun Ağılı (iki katman: otlak + ahır / ön çit) ve koyunlar, kuzu
    │       ├── structuresIndustry.js Yel Değirmeni ve Fırın (dönen kanatlar, alevli fırın), Demir Madeni
    │       │                 (kayalık tepe, tünel, raylarda gidip gelen cevher vagonu)
    │       ├── structuresCivic.js Belediye Konağı (saat kulesi, dalgalanan bayrak, sütunlu revak)
    │       ├── structuresHealth.js Şifacı Kulübesi (saman çatıda kurutulan otlar, havan, kaynayan kazan)
    │       └── animals.js    Tavşan, geyik, kedi ve köpek (otomatik konturlu, poz ve renk çeşitleri)
    ├── data/               Saf veri tanımları (oyun kuralları, denge değerleri)
    │   ├── tiles.js        Karo/nesne kuralları: yürünebilir, inşa edilebilir, yol bulma maliyeti;
    │   │                   mikro-biyom karoları ve yapı bonusları
    │   ├── buildings.js    Yapı kuralları: boyut, maliyet, inşaat süresi, üretim, kapasite; inşa menüsü;
    │   │                   Seviye 2 yükseltmeleri (upgrade) ve kadim harabeler (ruin)
    │   ├── resources.js    Odun / Taş / Yiyecek ve işlenmiş mallar Yün / Demir / Ekmek (ekmek 2,5 yiyecek
    │   │                   değerinde), başlangıç stoğu, depo kapasitesi, öğün maliyeti
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
    │   │                   stok ve gezgin tüccarın ziyaret düzeni
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
    │   ├── Building.js     Yapı: şantiye ilerlemesi, içindekiler, çalışanlar, üretim, ışıklar, çizim
    │   ├── Flock.js        Koyun ağılındaki sürü (yalnızca görsel): otlama, dolaşma, gece ahır önünde uyku
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
    │                       çarpanları, yan ürün, değirmenin işleme satırları, Yükselt / Onar), BuildMenu (alt
    │                       araç çubuğu; seviye kilitli yapılar),
    │                       Toasts (bildirimler), TownJournal (Kasaba Günlüğü), TradePanel
    │                       (takas penceresi), MilestonePanel (hedefler + kasaba seviyesi kartı),
    │                       CelebrationModal (anıt ve seviye kutlaması), DilemmaModal (karar penceresi),
    │                       TitleMenu (başlangıç ekranı), ControlsHint
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
(`craftMode`, `craft`) ve iş yerlerinden çıkarılan çalışanlar (`excludedWorkers`) eklendi. 10. aşamada
işlenmiş mallar (`resources.wool / iron / bread`), dilimlenmiş ekmekten artan yiyecek değeri (`pantry.credit`),
kasaba seviyesi (`town`: seviye, her seviyeye ulaşılan an, ortalama refah, belediyenin son erzak dengesi günü),
işlenmiş malların toplam üretimi (`stats.goods`), atölyedeki işin tarifi (`craft.recipe`: demir / yün ya da eski
usul) ve yeni yapılar (Koyun Ağılı, Yel Değirmeni ve Fırın, Demir Madeni, Belediye Konağı) eklendi. 11. aşamada
hayvanlar (`animals`: tür, ad, renk, yuva; `animalMeta`), sakinlerin hastalığı ve maruziyeti (`illness`, `exposure`),
Dinçlik bonusu (`buffs.vigor`), keşif seferindekiler (`away`), şifacı kulübesinin ot ve iksir stoğu (`herbs`,
`remedies`), yapıların fırtına hasarı (`damaged`), belediye fermanları (`civic`: depo kademesi, lonca, son ziyafet,
kadim tılsımlar) ve karar olayları (`dilemma`: açık pencere ve kalan süresi, yaklaşan fırtına, süren sefer, olay
geçmişi) eklendi. Kayıt sürümü 9'dur; 4.–10. aşamanın (sürüm 2–8) kayıtları da açılır: eksik alanlar varsayılanla
dolar (herkes bekâr, yetişkin, sağlıklı ve ekipmansız başlar; yün, demir ve ekmek 0 olur; yaban hayatı ilk
açılışta yerleşir), adı olmayan kasabaya tohumdan bir ad önerilir. Açık bir karar penceresiyle kaydedilen oyun
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
| 2 | Köy ("Yeşilvadi Köyü") | 13 | 8 | 1 | %63 | Yel Değirmeni ve Fırın; bir kedi ve bir köpek; tüccar yün balyası ve demir külçesi getirir; her maldan +1 stok |
| 3 | Kasaba ("Yeşilvadi Kasabası") | 20 | 17 | 3 | %68 | Belediye Konağı; bir kedi daha; tüccar (Kervancı) ekmek sepeti getirir, yün ve demir alır; +2 stok; sabah 3 göçmen |
| 4 | Gelişmiş Şehir ("Yeşilvadi Şehri") | 28 | 28 | 8 | %75 ve **Belediye Konağı** kurulmuş | Refaha kalıcı +4; göç sınırı 30; bir köpek daha; Kervanbaşı Şehir Kervanı ve Lonca Ustaları (1 gün %20 hızlı çalışma) getirir; +3 stok |

11. aşamada eşikler yaklaşık %25-30 zorlaştırıldı (10. aşamada Köy 10 / 6 / 0 / %60, Kasaba 16 / 13 / 2 / %65,
Şehir 24 / 22 / 6 / %72 idi). Otopilotla şehir olmak 13.–16. günden 18.–24. güne uzadı. Şehir için nüfusun 28'e
çıkması göç sınırının (24) üstünde olduğu için aile çocuklarına, 28 yapı için de kadim harabelerin onarımına ya da
ikinci ağıl, sera, şifacı gibi yatırımlara gerek vardır. Eski bir kasabanın ulaştığı seviye düşmez.

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
| Kayıp Hazine Haritası | 30 yiyecek + 2 Sağlam Alet: 2 kişilik sefer → bol demir, yün, işlenmiş taş ya da nadiren **Kadim Tılsım** (3 gün +%15 iş hızı, keyif yavaş düşer, refaha kalıcı +2) · 15 yiyecek: tek izci → küçük ganimet · **Haritayı sandığa kaldır** |

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

## Simülasyon ve test araçları (`tools/sim/`)

Hepsi oyunu Chromium'da (Playwright) gerçek kodla çalıştırır, oyun döngüsünü durdurup sabit adımlarla ilerletir.
`Math.random` tohumlanır, bu yüzden aynı tohum her seferinde aynı sonucu verir. Önce sunucu açılır
(`python3 tools/serve.py`); Playwright genel olarak kurulu olmalıdır (`npm i -g playwright`). Başka bir adres için
`LMGAME_URL` ortam değişkeni kullanılır. Hepsi başarıda 0, hatada 1 ile çıkar.

| Komut | Ne yapar? |
|---|---|
| `node tools/sim/tests.mjs` | Hedefli kural testleri (51): ekonomi, tarifler, seviye, yerleşim, sağlık, hayvanlar, kararlar, fermanlar, kayıt |
| `node tools/sim/compat.mjs` | `fixtures/` içindeki eski sürüm kayıtlarını (sürüm 7 ve 8) açar, bir gün yaşatır |
| `node tools/sim/autopilot.mjs 42 32` | Hilesiz otopilotla 32 günlük oyun: günlük özet, olay günlüğü, ekipman ve refah özeti. `--passive` kararları zaman aşımına bırakır, `--quiet` yalnızca sonu basar, `--save dosya.json` kaydı yazar |
| `node tools/sim/preview.mjs ["başlık"]` | Sanat önizleme sayfasının bölümlerinin ekran görüntüleri (`tools/sim/out/`) |
| `node tools/sim/showcase.mjs 11` | Oyun içi vitrin: yeni yapılar ve hayvanlar, karar penceresi, fermanlar, gece görünümü |

`tools/sim/lib.mjs` ortak yardımcıları içerir: oyunu açma, saat saat ilerletme, `window.sim` (yapı kurma,
kaynak verme, olay günlüğü) ve test kaydı.

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
