// Mekanik şalterleri (29.4b). (33.0) Eski kural ("her yeni mekanik kendi şalterini ekler, eski dünyanın tarihi bozulmaz") KALDIRILDI:
// determinizm artık şart değil, yeni mekanik şalter eklemek zorunda değildir. Buradaki mevcut şalterler SİLİNMEZ (kayıtlar ve
// testler onlara dayanır); yeni bir şalter yalnızca gerçekten kapatılabilir bir özellik için, istenirse eklenir. Aşama testleri,
// audit, compat ve autopilot hepsi açık koşar. Dondurulmuş takım tools/sim/archive/tests.mjs kapıdan çıktı (elle koşulur).
export const ENGINES = {
  bonds: true, // (29.5) Omuz Omuza: bağ puanlı iş seçimi ve yan yana çalışma moodlet'leri
  loyalty: true, // (29.6) Vefa ve Husumet: sadakat, isyan elebaşı, yangın minneti, yağma kırgınlığı, anının kişisi
  rites: true, // (29.7) Anma Töreni ve özel günler (doğum günü, evlilik yıl dönümü)
  discontent: true, // (30.3) Kararın Ağırlığı: günlük sadakat kaynakları, beş kademe, iş bırakma, Halkın Nabzı, anında geri bildirim
  gentleExodus: true, // (30.4a) terk ediş sınırı: günde ve isyan başına en çok kaç sakin ayrılır (aile tek birim)
  swiftAging: true, // (30.4a) kuşaklar: her mevsim bir yaş (AGING.daysPerAge); takvim yılı 16 gün kalır
  midgame: true, // (30.4b) orta oyun: sekiz yeni karar olayı (kişili olaylar, yeni etki türleri, tekrar kuralları) ve beş ara hedef
  novicePath: true, // (30.6) Para ve Akış: acemi dostu denge (olay bedelleri kasaya göre, Krallık Vergisi ve ferman cezası yumuşar, yiyecek rehberi) ve davranış değişiklikleri
  townDecor: true, // (31) Kasaba Süsleri: İlan Tahtası, Odun Yığını, Korkuluk, Müzik Köşkü, Kahraman Heykeli (inşa menüsü ve etkileri)
  traitScarcity: true, // (30.4a) kişilik çeşitliliği: yaygın özelliğe doğru evrim katkısı küçülür, nadire doğru büyür
  justice: true, // (32.1) Suç Motoru: küçük suçlar (handan aşırma, kese hafifletme, ufak haylazlık), tanık ve bekçi, dava kaydı, Muhtar uyarısı
  court: true, // (32.2) Adalet Sarayı ve Dava: dava penceresi, cezalar, orantılılık, cezasızlık, sürgün (justice kapalıyken etkisiz)
  university: true, // (32.4) Darülfünun: Bilgelik Evi mezunu gençlerin yüksek okulu (kabul, bölüm, ders, Müderris, mezuniyet, bölüm deneyimi)
  educationMerit: true, // (32.4) Bilgelik Evi mezunlarının (c.educated) suç riski ×0,85 ve itibardaki eğitim payı (Darülfünun kurulmasa da tarihi değiştirir; university'ye bağlı)
  clubs: true, // (32.5) Hobi Evleri ve Kulüpler: Bahçecilik Kulübü, Dikiş-Nakış Evi, Resim Atölyesi (üyelik, akşam buluşmaları, küçük ürünler)
  renown: true, // (32.3) Kasaba Şöhreti: Krallık İtibarı'nın günlük hedefe kayması, Kraliyet Gözdesi kademesi, rozet, Kraliyet Lütfu (gizli yapılar)
};
// (30.4a) Açılıştan ÖNCE bilinmesi gereken şalterler (kurucuların ageInDays değeri sahne kurulurken hesaplanır): modül yüklenirken
// globalThis.__LMGAME_ENGINES_OFF dizisi okunur (anahtar adları; '*' hepsi). tools/sim/lib.mjs -> openGame({ enginesOff }) bunu sayfa
// açılmadan enjekte eder; dondurulmuş tests.mjs bütün şalterleri bu yolla kapatır.
{
  const off = globalThis.__LMGAME_ENGINES_OFF;
  if (Array.isArray(off)) for (const k of Object.keys(ENGINES)) if (off.includes('*') || off.includes(k)) ENGINES[k] = false;
}
export const engineOn = (key) => ENGINES[key] !== false && (key !== 'court' || ENGINES.justice !== false) && (key !== 'educationMerit' || ENGINES.university !== false); // (32.2) court, justice'e; (32.4) educationMerit, university'ye bağlı
