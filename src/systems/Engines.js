// Mekanik şalterleri (29.4b). Kural (29.5'ten itibaren): her yeni mekanik kendi anahtarını buraya `true` olarak ekler ve
// kancalarını `engineOn(key)` ile sarar. Dondurulmuş test takımı (tools/sim/tests.mjs) bütün anahtarları kapatıp eski dünyanın
// tarihini sabit tutar; aşama testleri, audit, compat, autopilot ve stress her zaman hepsi açık koşar.
export const ENGINES = {};
export const engineOn = (key) => ENGINES[key] !== false;
