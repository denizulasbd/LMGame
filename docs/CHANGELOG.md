# Değişiklik günlüğü

Bundan sonraki aşama notları buraya yazılır: aşama başına en çok 20 satır. README'ye yeni aşama bölümü eklenmez.

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
