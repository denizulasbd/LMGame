# Aşama 34 — Genişleyen Harita: tasarım notu (34.1 altyapı)

## 1. Haritaya bağlı alanlar ve haritayı tarayan sistemler (envanter)
**Kayıtta koordinat taşıyanlar** (hepsi karo ya da piksel, harita sol üstü 0,0):
- `terrain`: tabandan farklı karolar `[indeks, zemin, varyasyon, nesne]`; indeks = y × genişlik + x (**tek indeksli alan**, risk burada).
- `buildings[].tileX/tileY` (yapılar, kulüp tarhları dahil: tarhlar yapı alanıdır), `characters[].x/y` ve `homeX/homeY` gibi hedefler (piksel),
  `animals[].x/y, homeX/homeY`, `jobs[].x/y`, `regrowth[].x/y`, `activeGuest.x/y`, `landscape` (süs ağaçları yapı olarak), suç/dava yerleri (yapı kimliği).
- Türetilmiş, kayda girmeyen: `landscapeField` / `world.aesthetics` (Float32, y × genişlik + x), `world.reachable`, yol bulma tamponları.

**Haritayı tarayan / indeks hesaplayan yerler** (19 dosya, ~110 kullanım):
`world/TileMap` (sınır, indeks, ulaşılabilirlik, çizim), `world/World` (buluşma noktaları, giriş karosu, ulaşılabilirlik),
`world/WorldGenerator` (yalnızca çekirdek üretimi; `assignBridgeVariants` sonradan da çağrılır), `world/TerrainSnapshot` (kayıt),
`utils/pathfinding` (kendi 0..w ızgarası), `systems/Landscape` + `LandscapeSystem` (estetik alanı, `i % width`), `ConstructionSystem`
(sınır, ulaşılabilirlik dizisi), `JobSystem` (toplama), `NatureSystem` (yeniden büyüme), `AnimalSystem` (yuva arama, ölçek),
`HarborSystem` (nehrin harita kenarındaki uçları), `CivicSystem` (yol listesi), `GuideSystem` (kaya var mı), `MoodletSystem` (estetik),
`TradePostSystem`, `scenes/ToolController` (uygun karo boyaması `y × width + x`), `scenes/TownScene` (kamera sınırı, taban karo),
`ui/BuildingPanel` (estetik dizisi), `ui/SettingsPanel` (boyut yazısı), `rendering/Fireflies`, `WeatherEffects`, `SeasonalEffects`, `ai/Brain` (ot toplama).
Kesme (`| 0`) ya da `x >= 0` varsayan koordinat kodu bulunmadı; `Math.floor(x / 16)` eksi koordinatta da doğru çalışır.

## 2. Yaklaşım: (A) seçildi
- **(A) Çekirdek sabit, dünya eksiye uzar.** `TileMap` bir köken (`x0`, `y0` ≤ 0) taşır; `index(x, y) = (y − y0) × genişlik + (x − x0)`.
  Yapı, sakin, hayvan, iş, yeniden büyüme koordinatları **hiç değişmez**; değişen yalnızca TileMap'in iç dizisi ve "0'dan genişliğe" döngüleri.
- **(B) Bir kerelik kaydırma göçü**: her koordinat alanı (piksel ve karo, 15+ alan, iç içe görev hedefleri, yol listeleri) ofset kadar kaydırılır.
  Bir alan unutulursa sessizce bozulur; her yeni aşamada yeni alanlar da kaydırılmak zorunda kalır.
- **Seçim A**: kayıp riski tek bir yerde (arazi farkları) toplanıyor ve o da koordinatla saklanınca kalıcı olarak çözülüyor. Döngüleri
  `map.x0..x1` ya da açık alan sınırına çevirmek mekanik ve testle doğrulanabilir; varlık verisine hiç dokunulmaz.

## 3. Kayıt biçimi (sürüm 42)
- `terrain`: `[[x, y, zemin, varyasyon, nesne], ...]` (dünya koordinatı, eksi olabilir). Harita boyutu ne olursa olsun kaymaz.
- `parcels`: açılmış parsel kimlikleri `['r1n0', ...]` (isteğe bağlı; yoksa boş = yalnızca çekirdek). Bilinmeyen kimlik atlanır.
- `map: { width, height, generator }` **çekirdeğin** boyutu olarak kalır (çekirdeği yeniden üretmek için).
- Göç v41 → v42: eski 4'lü hücre `[i, …]` → `[i % w, ⌊i / w⌋, …]`, `w` = kayıttaki çekirdek genişliği (yoksa 48). Aynı dönüşüm
  `GameState.restore` içinde de yapılır, böylece göçten geçmeyen yükleme yolları da güvende. Yeni fikstür `save-v42.json` (açılmış parselli).

## 4. Parsel üretimi
- **Çekirdek** bugünkü üretimle (80×80; eski 48×48 haritalarda 48×48) **aynen** üretilir, sonra dünyaya (0,0)'dan kopyalanır.
- Çekirdeğin çevresinde **iki halka**: kalınlıklar tohumdan (1. halka 14–18, 2. halka 18–24 karo). Her halka dört şeride bölünür
  (kuzey ve güney şeritleri köşeleri de kapsar), her şerit boyunca 12–24 karoluk parçalara kesilir. Parsel: `{ id, ring, side, x, y, w, h, area, neighbors }`.
  Bölünme kendi üretecinden (harita tohumu karması); çekirdeğin üretecine dokunmaz.
- **İçerik** harita tohumu ve **dünya koordinatından** üretilir (konuma bağlı gürültü + karo karması): hangi parselin önce açıldığı içeriği değiştirmez.
  Orman, kaya kümeleri, çayır (bereketli toprak), küçük göller, nehrin devamı, ana yolların dış dünyaya devamı.
- **Dikişsiz kenar**: nehir çekirdeğin üst ve alt satırındaki su aralığından başlar, aynı genişlikte yavaşça kıvrılarak sürer; kum şeridi
  çekirdek suyunu da görür. Çekirdeğe yakın karolar (≈8 karo) en yakın çekirdek kenarının biyomunu gürültülü bir geçişle devralır,
  sonra kendi biyom gürültüsüne bırakır. Ağaç ve kaya sıklıkları çekirdekteki biyom kurallarıyla aynı.
- **En büyük dünya**: 80 + 2 × (18 + 24) = **164×164** (26 896 karo, çekirdeğin ×4,2'si); 48'lik çekirdekte 132×132. Bellek: karo katmanları
  ~160 KB, estetik ~110 KB, taban kopyası ~80 KB: toplam 1 MB'ın altında. Üretim bir kez, sahne açılışında (~birkaç on ms).
- **Performans**: harita tarayan her döngü yalnızca **açık alanın sınır dikdörtgeninde** (`map.openBounds`), çizim yalnızca kamera içinde çalışır;
  yol bulma ızgarası açık alana kırpılır. Parsel açılmadıkça iş yükü bugünküyle aynıdır.

## 5. Kilitli alan kuralları
- `map.isOpen(x, y)` yanlışsa: yürünemez, inşa edilemez, yol döşenemez, toplama / ot toplama emri verilemez (sakin ve hayvan zaten giremez).
- Göçmen, tüccar ve konuk yalnızca **açık alanın kenarından** gelir (açık karonun komşusu kilitli ya da dünya dışıysa kenardır; yol karosu tercih edilir).
- Tekne nehirde dünyanın kenarından gelir (yalnızca çizim, kilitli sudan geçebilir).
- Kamera açık alanın 6 karo ötesine kadar gider (dünya sınırında durur). Kilitli alan soluk ve sisli çizilir, sınırında ince açık renk çizgi.
- 34.1'de açmanın tek yolu geliştirici yoludur: `sim.unlockParcel(id)`, `sim.parcels()` ve adreste `?parcels=all` (yalnızca araçlar).
  34.2: fiyat, nüfus kotası ve satın alma arayüzü (`parcel.area`, `ring`, `neighbors` hazır).
