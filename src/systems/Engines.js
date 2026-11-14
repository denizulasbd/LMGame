// Mekanik şalterleri (29.4b). Kural (29.5'ten itibaren): her yeni mekanik kendi anahtarını buraya `true` olarak ekler ve
// kancalarını `engineOn(key)` ile sarar. Dondurulmuş test takımı (tools/sim/tests.mjs) bütün anahtarları kapatıp eski dünyanın
// tarihini sabit tutar; aşama testleri, audit, compat, autopilot ve stress her zaman hepsi açık koşar.
export const ENGINES = {
  bonds: true, // (29.5) Omuz Omuza: bağ puanlı iş seçimi ve yan yana çalışma moodlet'leri
  loyalty: true, // (29.6) Vefa ve Husumet: sadakat, isyan elebaşı, yangın minneti, yağma kırgınlığı, anının kişisi
  rites: true, // (29.7) Anma Töreni ve özel günler (doğum günü, evlilik yıl dönümü)
  discontent: true, // (30.3) Kararın Ağırlığı: günlük sadakat kaynakları, beş kademe, iş bırakma, Halkın Nabzı, anında geri bildirim
  gentleExodus: true, // (30.4a) terk ediş sınırı: günde ve isyan başına en çok kaç sakin ayrılır (aile tek birim)
};
export const engineOn = (key) => ENGINES[key] !== false;
