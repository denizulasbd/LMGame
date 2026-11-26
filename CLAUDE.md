# LMGame — Claude için çalışma notu

Her oturumun başında oku. Kısa tutuldu; ayrıntı için `README.md` (oyun ve sistemler) ve `docs/CHANGELOG.md` (aşama notları).

## Oyun ne, nasıl çalışır
Tarayıcıda çalışan pixel art kasaba yönetimi / hayat simülasyonu. Saf HTML + ES modülleri; derleme adımı ve harici kütüphane yok.
- Çalıştır: `python3 tools/serve.py` (sonra `http://localhost:8080`; `?seed=42` yeni oyun başlatır). **Testler bu sunucuya ihtiyaç duyar**
  (kapı `gate.mjs` sunucu kapalıysa kendisi açar). Testler Playwright/Chromium kullanır.
- Klasörler: `src/` oyun (ai, art, core, data, entities, rendering, scenes, state, systems, ui, utils, world) · `assets/` ses, yazı, görsel, harita ·
  `styles/` · `docs/` CHANGELOG ve oyuncu günlükleri · `tools/serve.py` sunucu · `tools/sim/` test ve ölçüm araçları
  (`gate.mjs` kapı, `tests/` aşama testleri, `compat.mjs` + `fixtures/` eski kayıtlar, `autopilot.mjs`, `audit.mjs`, `stress.mjs`, `cycles.mjs`, `archive/` eski takım).

## Kod düzeni (yeni kod nereye?)
- Sayılar ve metinler: `src/data/<ad>.js` (kod içinde sihirli sayı ve gömülü metin olmasın).
- Saf hesaplar (durum değiştirmez): `src/systems/<Ad>.js`.
- Durum değiştiren / olay dinleyen: `src/systems/<Ad>System.js`.
- Panel ve pencereler: `src/ui/components/`. Görseller: `src/art/sprites/`.
- Büyük dosyalara (`BuildingPanel`, `CharacterPanel`, `Brain`) yalnızca ince bir kanca ekle; asıl iş kendi dosyasında.
- Döngüsel içe aktarma yasak (`node tools/sim/cycles.mjs`).

## Oyunun ruhu
Sakin, sıcak, hafif mizahi. Metinler Türkçe, kısa ve güler yüzlü. Şiddet yok (suç ve ceza bile "mahalle" ölçeğinde, kasvetsiz).

## Rastgelelik (33.0'dan beri)
- **Harita yalnızca harita tohumundan gelir**; aynı tohum aynı haritayı verir.
- **İnsanlar (isim, görünüş, kişilik) her oyunda rastgele olabilir** (33.1'de uygulanacak).
- Sakinlerin kararları kişiliklerine göre **kuralla** verilir. Kullanıcı kararlara ayrıca "şans" eklenmesini istemiyor.
- **Determinizm şartı yok:** bayt bayt eşitlik, "şalter kapalıyken tarih aynı", izole üreteç (tohum + N) zorunlu değil. Yeni kod
  sistemin mevcut üretecini normal biçimde kullanabilir. `ENGINES` şalterleri durur ama yeni mekanik şalter eklemek zorunda değil.

## Kayıt (en büyük risk)
Kullanıcının arkadaşları oyunu oynuyor; **kayıt kaybı kabul edilemez.**
- Eski kayıtlar açılmaya devam etmeli (`tools/sim/fixtures/`, `compat.mjs`).
- Okunamayan kayıt asla silinmez, yedeklenir (32.7: `lmgame.save.broken.*`).
- Yeni alanlar isteğe bağlı olsun. Gerekirse kayıt sürümü artırılır (`SAVE_VERSION`, şu an 41) ve göç yazılır; yeni fikstür eklenir.
- Kayda dokunan her adımda `compat.mjs` yeşil kalmalı.

## Test politikası
- Yeni özellik için **kısa** bir aşama testi: `tools/sim/tests/_template.mjs` kopyala (`<aşama>-<ad>.mjs`). Eski `archive/tests.mjs`'e test ekleme.
- Her adımda `node tools/sim/gate.mjs --quick` (varsayılan, hedef ≤ 5 dk): cycles + bütün aşama testleri + 1 tohum × 15 gün otopilot + `compat --sample`.
- `--full` (quick + `compat --all` + 3 tohum × 30 gün otopilot; yalnızca çökme ve monitor) büyük adımların sonunda bir kez.
- Uzun denge ölçümü (stress, determinizm, audit, çok günlük A/B) yalnızca kullanıcı isterse; en çok 3 tohum × 30 gün.
- Bir testi geçirmek için kontrolü silme; işlevsel kontrol (mekanik çalışıyor mu, kayıt temiz mi, çökme var mı) korunur.

## Akış
- Küçük adımlar; her adım kullanıcının verdiği dalda; her adım commit ve push.
- `main`'e merge ve PR **yalnızca kullanıcı isterse**.
- Uzun koşudan önce push et (oturum kesilirse iş kaybolmasın).
- `docs/CHANGELOG.md`: aşama başına **en çok 10 satır**. README'ye yeni aşama bölümü ekleme; yalnızca kontrol tablosu / gerekli satırlar.

## Rapor
Kullanıcı kodlama bilmiyor: sade dille yaz. İçerik: değişen dosyalar, kısa test sonucu (kapı süresi dahil), kullanıcının karar vermesi gerekenler.
Teknik ayrıntıyı uzatma; "ne değişti, ne işe yarıyor, ne kaldı" yeter.
