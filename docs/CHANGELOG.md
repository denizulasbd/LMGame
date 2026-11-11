# Değişiklik günlüğü

Bundan sonraki aşama notları buraya yazılır: aşama başına en çok 20 satır. README'ye yeni aşama bölümü eklenmez.

## Aşama 29.4b — Test altyapısının hafifletilmesi (kayıt sürümü 39 kalır, oyun davranışı değişmedi)
- `tools/sim/lib.mjs`: `createChecks().report()` varsayılan olarak yalnızca kalan testleri, toplamı ve sayfa hatalarını basar; `--verbose` / `LMGAME_VERBOSE=1` eski çıktıyı verir. `capOutput`: 60 satırı aşan çıktı son 40 satıra kısaltılır, tam günlük `tools/sim/out/<ad>.log` dosyasına yazılır (autopilot, stress, audit, compat, tests).
- `tools/sim/tests/`: aşama başına bir test dosyası (`_template.mjs` iskeleti); taze `openGame`, bütün mekanikler açık. `tests.mjs` DONDURULDU, yeni test eklenmez.
- `tools/sim/gate.mjs`: `--quick` (tests/* + autopilot 42 12 + audit) ve `--full` (tests, tests/*, audit, compat --sample, stress 4x 50 gün, determinizm); paralel, en çok 40 satır çıktı, günlükler `tools/sim/out/gate/`.
- `src/systems/Engines.js`: `ENGINES` / `engineOn(key)` şalterleri. Kural (29.5'ten): her yeni mekanik anahtarını `true` ekler, kancalarını `engineOn` ile sarar. `tests.mjs` hepsini kapatır; audit açılışta hepsinin açık olduğunu denetler. Bugün liste boş.
- `compat.mjs --sample` (v2, v6, v10, v14, v18, v22, v26, v30, v33, v36 + son üç sürüm); `--all` bütün fikstürler (29.10'da ve elle).
