# Değişiklik günlüğü

Bundan sonraki aşama notları buraya yazılır: aşama başına en çok 20 satır. README'ye yeni aşama bölümü eklenmez.

## Aşama 30.1 — İlk saat (kayıt sürümü 40 kalır; yeni simülasyon sistemi yok)
- Rehber: `data/guide.js` (9 adım, tablo sürümü 1), `systems/Guide.js` (saf görünme / tamamlanma koşulları), `GuideSystem` (yalnızca olay dinler, güncelleme listesinde değil), `GuideCard` (araç çubuğunun üstünde tek kart, "Anladım", düğme yanıp söner). İsteğe bağlı kayıt alanı `guide { done, off, at? }`; eski kayıtta nüfus > 8 ise kapalı. Ayarlar: Rehber Açık / Kapalı / baştan başlat.
- Karar süresi: yalnızca `state.settings.dilemmaTimer === true` iken işler (isteğe bağlı alan; Ayarlar "Kapalı / 30 saniye"). `tools/sim/lib.mjs` bayrağı açar (yükleme / sıfırlamadan sonra da).
- Yerleştirme: önizleme yalnızca fare karosu / tür / harita sürümü / karşılanabilirlik değişince hesaplanır; kurulamama nedeni haritada; kamera içindeki uygun karolar soluk yeşil (kare başına 24 deneme, önbellekli); ekranda yer yoksa mesaj + en yakın yerin oku; liste seçimden sonra tek satırlık şeride iner (Esc / "Listeyi aç"). `ConstructionSystem.globalBlock`, `demolishRefund`, "Yetersiz kaynak: Taş · Topla aracıyla kayalardan." ipucu.
- Kaçan tıklama nedeni: ipucu satırı uzun metinde (dekor türleri: "Çevre estetiği … (burası: …)") iki satıra sarılıp dock yığınını 15 px yükseltiyor, fare altındaki harita menünün altında kalıyordu. İpucu / şerit sabit yükseklik.
- Yıkım onayı: tamamlanmış yapıda ilk tık işaretler, 4 sn içinde ikinci tık yıkar (fırça süsleri, yollar, şantiyeler tek tık).
- Hatalar: üst şerit bölgeleri sarılıyor (adın üstüne binme); "N hasta" çipi tıklanır; Hedefler çubuğu tam dolu + "Seviye 2 yapı" açıklaması; yapı listesi ilk sıra adları (panel kayıyor, ızgara değil); 1024×640 sakin kartı kendi içinde kayar; yenileme: aynı tohumlu `?seed=` adresi oturum kaydını Gün 1'e sıfırlıyordu (artık sürdürür), oturum kaydı her 06:00'da da tazelenir.
- Okunurluk: sayılar ≥ 13 px, `tabular-nums`, sayı öğelerinde okunaklı sistem yazı tipi.
- Ölçüm: `autopilot 42 50` raporu tabanla bayt bayt aynı; kayıt `guide` ve `settings.dilemmaTimer` çıkarılınca aynı. Testler: tools/sim/tests/30.1-first-hour.mjs (22).

## Aşama 29.10b — Doyum sönmesi ve sadakat sarmalı yaması (kayıt sürümü 40 kalır)
- `WANT_RULES.driftStep` (11): 50'nin üstünde günlük sönme `driftAbove + floor((doyum − 50) / driftStep)`; altı aynı. Başlangıç 10 idi; dondurulmuş 29.3 testi (60 → 58) 10'da kırıldığı için 11'e çekildi.
- Ölçüm (6 tohum × 50 gün): ortalama doyum 47.7–58.9, uç kademe ≤ %10, arzu gerçekleşme %41–48. Tohum 42 / 77 × 120 gün: G50 → G120 doyum 56.0 → 54.5 / 47.7 → 51.5.
- `LOYALTY.bitterTrust.perHour` −2 → −1,7: tyrant 40. günde tohum 42'de 8, 77'de 30 sakin bırakır, her ikisinde 1 isyan (−2'de 3 sakin kalıyordu; −1,6'da 77'de isyan çıkmadı: dar aralık).
- `autopilot --profile careless|repent` eklendi; careless ve repent hedefleri ayarsız tuttu (isyan 0, terk 0). `(29.10b)` satırı: nüfus / güven / son 10 günde isyan.
- §3 (yalnızca rapor): 120. günde en yaygın özellik hardworking %63–66 (>%45; ayar yapılmadı).
- Testler: 29.10-integration.mjs'e 2 test (kademeli sönme, sadakat ayarı).

## Aşama 29.4b — Test altyapısının hafifletilmesi (kayıt sürümü 39 kalır, oyun davranışı değişmedi)
- `tools/sim/lib.mjs`: `createChecks().report()` varsayılan olarak yalnızca kalan testleri, toplamı ve sayfa hatalarını basar; `--verbose` / `LMGAME_VERBOSE=1` eski çıktıyı verir. `capOutput`: 60 satırı aşan çıktı son 40 satıra kısaltılır, tam günlük `tools/sim/out/<ad>.log` dosyasına yazılır (autopilot, stress, audit, compat, tests).
- `tools/sim/tests/`: aşama başına bir test dosyası (`_template.mjs` iskeleti); taze `openGame`, bütün mekanikler açık. `tests.mjs` DONDURULDU, yeni test eklenmez.
- `tools/sim/gate.mjs`: `--quick` (tests/* + autopilot 42 12 + audit) ve `--full` (tests, tests/*, audit, compat --sample, stress 4x 50 gün, determinizm); paralel, en çok 40 satır çıktı, günlükler `tools/sim/out/gate/`.
- `src/systems/Engines.js`: `ENGINES` / `engineOn(key)` şalterleri. Kural (29.5'ten): her yeni mekanik anahtarını `true` ekler, kancalarını `engineOn` ile sarar. `tests.mjs` hepsini kapatır; audit açılışta hepsinin açık olduğunu denetler. Bugün liste boş.
- `compat.mjs --sample` (v2, v6, v10, v14, v18, v22, v26, v30, v33, v36 + son üç sürüm); `--all` bütün fikstürler (29.10'da ve elle).

## Aşama 29.5 — Sosyal iş seçimi ve "Omuz Omuza" (kayıt sürümü 39 kalır)
- `src/data/bonds.js` (BOND_RULES, puan tablosu), `src/systems/Bonds.js` (bondWeight −4..+4, crewBond −6..+6, saf), `src/systems/BondSystem.js` (saatlik tarama).
- `findWorkFor`: aday mesafesinden crewBond × tilesPerPoint düşülür; öncelik ve eleme yok. Şalter: `ENGINES.bonds`.
- Yeni moodlet'ler `side_by_side` / `rubbing_wrong` (toplam 28); evrim: company ±1. Dondurulmuş testte yalnızca moodlet sayısı 26→28, eylem katmanı 13→15.
- Ayar: tilesPerPoint 2 → 1 (2'de tohum 42/77 hazine altını −%40/−%28 düştü).
- Ölçüm: autopilot `(29.5)` satırı ve `--engines-off bonds`. Testler: tools/sim/tests/29.5-bonds.mjs (21).
- Bilinen: tohum 77'de hazine altını şalter açıkken ~−%18 (kabul %5'i aşar).

## Aşama 29.6-29.7 — Vefa, Husumet, Anma Töreni ve Özel Günler (kayıt sürümü 40)
- `src/data/loyalty.js`, `src/systems/Loyalty.js` (saf), `src/systems/LoyaltySystem.js`: `c.loyalty` -100..+100 (yetişkin, rolsüz), günde 1 söner; Sadık ≥ 40 / Kırgın ≤ -40, eşik geçişinde `loyalty:changed`. Kaynaklar: dilekçe, dağıtım (aç olana +8), vergi tahsilatı ve Ağır Vergi'ye geçiş, seferberlik, ziyafet, "Sesimiz Duyulmadı", evin yanması, yardımla yatışan isyan.
- İsyan: sıralama mutluluk + sadakat x 0,3; elebaşı en düşük sadakatli isyancı (`trust.revolt.leaderId`, günlük ve isyan çipi ipucu). Ağır Vergi keyfi Sadık x0,5 / Kırgın x2 (altın aynı). Terk edişte düşük sadakatli önce, Sadık en sonda.
- Vefa / husumet: yangında en çok 3 söndürene minnet + "{who} yangında evini kurtardı"; yağmalanan yapının sakini / çalışanı yağmacıya kırgın. `addMemory(..., { whoId })` (teselli, yangın, yağma, randevu, düğün); hatırlanan anının kişisi 240 dk `seekIds` / `avoidIds`'e girer (`c.recall.whoId`, kaydedilmez).
- `src/data/rites.js`, `src/systems/Rites.js` (saf), `src/systems/RiteSystem.js`: vefatın ertesi günü 18:00-19:00 anıtta (yoksa meydan havuzunda) Anma Töreni (`Brain.planMemorial`, `rite:started` ile yarıda kesilebilen işler bırakılır); yas x0,7, "Helalleşti", veda sözü, kitabe (40 ad; anıt paneli ve Tarihçe). Taziye Sofrası (20 yiyecek + 10 altın): yas x0,5, sadakat +3, major.
- Özel günler: doğum günü (o gün yaş alan) ve evlilik yıl dönümü (`c.weddingDay`, 16 gün). 06:00 "Bugün Onun Günü", yakınla birbirini arama (`c.specialSeek`, kaydedilmez); 22:00'ye dek aynı sohbette → "Hatırlandı" (doyum +3, ilişki +5), değilse "Unutuldu" (doyum -4, evrim spirit -3 / company -2). Armağan (5 altın): sadakat +6, doyum +4.
- Yeni moodlet'ler `farewell`, `special_day`, `celebrated`, `forgotten` (toplam 32, eylem katmanı 19). Evrim: farewell spirit +3, forgotten spirit -3 / company -2.
- Şalterler `ENGINES.loyalty` / `ENGINES.rites`; tören / özel gün zar çekmez, söz üreteci tohum + 41. Moodlet'ler MoodletSystem'in söz üretecine dokunmadan verilir.
- Kayıt v40: `loyalty`, `weddingDay`, `specialDay`, `memories[].whoId`, `trust.revolt.leaderId`, `rites`. Göç zar çekmez; `save-v40.json` fikstürü, compat --sample'a girer.
- Dondurulmuş `tests.mjs`: yalnızca sayılar (moodlet 28→32, eylem 15→19, "kayıt sürümü 39"→40). 29.5 testinde de aynı iki sayı.
- Ayar: `SPECIAL_RULES.celebratedJoy` 6 → 3 (6 ve 4'te tohum 42 / 13 son gün doyumu 71,5 / 70,6). `closest` 2 → 1 denendi (50 günde tohum 21 kutlanma %45), 2'de kaldı. Doğum gününde yalnızca sohbet sayılır; aile yemeği / han sofrası yalnızca yıl dönümünde. 19:00'da `rite:ended` anma görevlerini bitirir (yürüyüş yüzünden 20:00'ye sarkıyordu).
- Ölçüm: autopilot `(29.6)` / `(29.7)` satırları (JSON: `rites`, `gold`); `stress.mjs --engines-off` ve hazine altını ortalaması. Testler: tests/29.6-loyalty.mjs (19), tests/29.7-rites.mjs (19).
- §2 teşhisi: 6 tohum x 50 gün, bonds açık 47.111 / kapalı 47.622 altın (-%1,1 ≤ %8): dokunulmadı; tohum 77'deki -%18 tek tohum gürültüsü.

## Aşama 29.8-29.9 — Görsel İfade Dili ve Yeni Karakter Kartı (kayıt sürümü 40 kalır, simülasyon değişmedi)
- Çizim salt okunur: durum yazılmaz, zar / `Math.random` / `Date.now` yok, kare başına ayırma yok (sabit yuvalar, `budget` nesnesi). Yeni `ENGINES` anahtarı yok.
- `src/rendering/ExpressionLayer.js`: Duygu Katmanı (M, dock "Duygular", tercih `lmgame.ui.emotionLayer`, fotoğraf modunda gizli): ruh hali işareti (bulut / pırıltı / ter damlası; renkler moodlet çipleriyle aynı), seçili sakinden en çok 8 bağ çizgisi (eş pembe > ruh ikizi altın > kırgın / rakip kırmızı > puan ≥ 40 yeşil; |puan|'a göre). Kapalıyken yalnızca seçili + imleç altındaki sakinde işaret.
- Düşünce balonu (bulut, iki daire): `(floor(dakika / 20) + kimlik) % 9 === 0` diliminde, `perform` evresinde boş zaman / sosyal etkinlikte, konuşma yokken; arzu (doyum < 40 ise korku) simgesi. Balon bütçesi 12: seçili sakin > konuşma > düşünce. `SpeechBubbles`: ikon balonu ile söz tek balon (ikon solda).
- `src/rendering/BodyLanguage.js`: tek gövde hareketi, öncelik yas > coşku > yorgunluk > yan yana (pırıltı) > sırt dönme > özel gün (kurdele). `Character.queueDraw/currentFrame` yalnızca çizim kaydırması yapar (`c.facing` değişmez).
- `CharacterPanel`: dört sekme (Özet, İç Dünya, Bağlar, Hayat; seçim `lmgame.ui.cardTab`); yalnızca etkin sekmenin gövdesi takılı ve yenilenir. Yeni: tek cümlelik durum, öne çıkan arzu / korku, dört eksen çubuğu, değişim günlüğü, omuz omuza (BondSystem.pairs: bu oturumun sayacı), Yaşam Öyküsü. `ResidentList`: ruh hali ve özel gün işareti.
- `src/systems/LifeStory.js` (saf): 3-6 cümle, şablon tabanlı; vefatta (`population:dying`) üretilip `rites.pending[].story` ve `rites.names[].story` (≤ 400) alanına yazılır; sanitize korur, alan yoksa hiçbir şey yazılmaz. Anıt kitabesinde ada tıklayınca öykü açılır; Tarihçe'deki kitabe kaydında son öykü görünür.
- `gate.mjs --full` iki evreli: önce hafif araçlar (tests, tests/*, audit, compat), bitince ağır olanlar (stress, determinizm); audit'in ses zamanlama testi artık yük altında kırılmaz.
- Dondurulmuş `tests.mjs`: yalnızca başında `setAllTabs(true)` (dört sekme birden = eski tek kart düzeni). `audit.mjs`: dock beklentisine "Duygular (M)" eklendi; telefon dock'u için düğme genişliği 38 → 34 px.
- Testler: tools/sim/tests/29.8-expression.mjs (14), 29.9-card.mjs (14).

## Aşama 29.10 — Büyük entegrasyon, uzun koşu dengesi ve final denetimi (kayıt sürümü 40 kalır, yeni kayıt alanı yok)
- Durum satırı: neden metni moodlet adıyla başlıyorsa yinelenmez ("Dileği Oldu: Kafamı dinleyeyim").
- Yaşam Öyküsü: geliş biçimi Tarihçe kurucularından / ilk anıdan okunur (kurucu artık "göçmen" değil); dilek sayısı cümlesi yerine doyum kademesinden tek ifade; anılar tırnaksız cümle (öncelik düğün, evlat, usta işi eser, yas, yangından kurtarılma, teselli; arzu / korku anıları girmez); nedensiz değişim "Zamanla" demez; aynı neden iki kez yazılmaz.
- Evrim: küçük katkılar birikince değişimin nedeni boş kalmaz (en son aynı yönlü katkının kaynağı, `c.growthLast`, kaydedilmez).
- Ölü yol: hatırlama yalnızca güzel anıyı seçtiği için `c.recall` kaçınma dalı ve onun testi silindi; arama kaldı.
- `story` tutarsızlığı: tohum 42 x 50 gün kaydındaki 41 alanın 40'ı eski dedikodu yapısı (`social.gossip[].story` 10, `characters[].lastNews.story` 30); kitabede 1 öykü (305 bayt). Boş öykü yazılmaz, `rites.pending` tören sonrası boşalır (testli).
- Çekmece: işaretlere `title` / `alt` (özel gün türüyle); dengeli ruh halinde işaret yok. Kart: "Bu Oturumda En Çok Kiminle Omuz Omuza".
- Sadakat isyana bağlandı: Kırgın yetişkin payı ≥ %25 iken Güven saat başı `-2 x pay` erir (`LOYALTY.bitterTrust`, `ENGINES.loyalty`). 29.6'da Ağır Vergi + bütün dilekçeler reddinde bile güven %100'de kalıyor, isyan çıkmıyordu.
- Ayarlar (`data/loyalty.js`): vergi tahsilatı exempt 2→6, low 0→2, heavy -4→-7; Ağır Vergi'ye geçiş -6→-10; armağan 6→10; Taziye 3→5.
- `autopilot.mjs --profile tyrant|benevolent` (ve `--profile-report`): günlük Sadık / Kırgın oranı, isyanlar (elebaşı, en düşük sadakat), terk edenler. `--checkpoints 50,120`: kayıt boyutu, doyum, değişim, kuşak, gün süresi.
- `tests.mjs --engines-on`: 4 test kalır, hepsi (b): Ağır Vergi keyfi (fikstürde sadakat 40'a çıkınca 29.6'nın Sadık x0,5 kuralı), panayır ikon balonu ve minnettar yardımı (bonds: dünya tarihi / bağ puanı), karşılıksız aşk etiketi (loyalty açıkken seçilen sakin değişiyor). (a) gerçek hata yok.
- Uzun koşu (42 / 77 x 120 gün): kayıt x1,09 / x1,08; son 20 gün / 20-40. gün süresi x0,65-0,90 / x1,12-1,23; takılma, kopuk referans, sayfa hatası 0. Yadigâr 42'de oluşur (2, devir 1), 77'de 0-1 (Kıdemli Bilge + Altın Çağ geç).
- Açık: 120. günde değişim yaşayan %75-81 (> %70). `decayPerDay` 4: %31-34 ama 50. günde tohum 42'de 1 değişim (bant 3-14); `shiftAt` 64 etkisiz; usta işi eser katkısı [7,-5] %77/%75. Hepsi geri alındı.
- Testler: tools/sim/tests/29.10-integration.mjs (12). 29.6 / 29.7 / 29.9 testlerinde yalnızca sayılar ve silinen kaçınma dalı.

### 29. aşama referans tablosu (son `gate --full`, 6 tohum x 50 gün x 4x)
| Ölçüt (bant) | 7 | 13 | 21 | 42 | 77 | 101 |
|---|---|---|---|---|---|---|
| Arzu gerçekleşme (%35-65) | 43 | 48 | 44 | 43 | 42 | 39 |
| Korku gerçekleşme (%10-35) | 15 | 16 | 17 | 15 | 20 | 19 |
| Ortalama doyum (45-70) | 58,2 | 66,5 | 58,6 | 62,6 | 55,3 | 52,6 |
| Uç doyum kademeleri (≤ %25) | 0 | **29** | 13 | 17 | 3 | 0 |
| Kişilik değişimi (3-14) | 6 | 8 | 12 | 3 | 7 | 14 |
| `side_by_side` (≥ 30) | 254 | 422 | 343 | 331 | 372 | 311 |
| Özel günde kutlanma (%50-85) | 69 | 77 | 75 | 80 | 68 | 67 |
| Tören = vefat günü | 0=0 | 0=0 | 2=2 | 1=1 | 0=0 | 1=1 |
| Sadık / Kırgın (≤ %40) | 0/0 | 3/0 | 0/0 | 0/0 | 0/0 | 0/0 |
`compat --all`: 1917/1917. Tohum 13'te uç kademe %29 (31 kişide 9; kademe sınırları dondurulmuş testte sabit), sapma olarak bırakıldı.
