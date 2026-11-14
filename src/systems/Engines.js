// Mekanik şalterleri (29.4b). Kural (29.5'ten itibaren): her yeni mekanik kendi anahtarını buraya `true` olarak ekler ve
// kancalarını `engineOn(key)` ile sarar. Dondurulmuş test takımı (tools/sim/tests.mjs) bütün anahtarları kapatıp eski dünyanın
// tarihini sabit tutar; aşama testleri, audit, compat, autopilot ve stress her zaman hepsi açık koşar.
export const ENGINES = {
  bonds: true, // (29.5) Omuz Omuza: bağ puanlı iş seçimi ve yan yana çalışma moodlet'leri
  loyalty: true, // (29.6) Vefa ve Husumet: sadakat, isyan elebaşı, yangın minneti, yağma kırgınlığı, anının kişisi
  rites: true, // (29.7) Anma Töreni ve özel günler (doğum günü, evlilik yıl dönümü)
  discontent: true, // (30.3) Kararın Ağırlığı: günlük sadakat kaynakları, beş kademe, iş bırakma, Halkın Nabzı, anında geri bildirim
  gentleExodus: true, // (30.4a) terk ediş sınırı: günde ve isyan başına en çok kaç sakin ayrılır (aile tek birim)
  swiftAging: true, // (30.4a) kuşaklar: her mevsim bir yaş (AGING.daysPerAge); takvim yılı 16 gün kalır
  midgame: true, // (30.4b) orta oyun: sekiz yeni karar olayı (kişili olaylar, yeni etki türleri, tekrar kuralları) ve beş ara hedef
  traitScarcity: true, // (30.4a) kişilik çeşitliliği: yaygın özelliğe doğru evrim katkısı küçülür, nadire doğru büyür
};
// (30.4a) Açılıştan ÖNCE bilinmesi gereken şalterler (kurucuların ageInDays değeri sahne kurulurken hesaplanır): modül yüklenirken
// globalThis.__LMGAME_ENGINES_OFF dizisi okunur (anahtar adları; '*' hepsi). tools/sim/lib.mjs -> openGame({ enginesOff }) bunu sayfa
// açılmadan enjekte eder; dondurulmuş tests.mjs bütün şalterleri bu yolla kapatır.
{
  const off = globalThis.__LMGAME_ENGINES_OFF;
  if (Array.isArray(off)) for (const k of Object.keys(ENGINES)) if (off.includes('*') || off.includes(k)) ENGINES[k] = false;
}
export const engineOn = (key) => ENGINES[key] !== false;
