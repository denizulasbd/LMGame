// Kasaba Zaferi ve Altın Çağ (20. aşama): Ulu Saat Kulesi'nin kademeli inşası, Kadim Dişli, Çağ Kutlaması, kule
// saatinin sabah / akşam çanı, Tarihçe Kütüğü, prestij peyzajı ve tüccarın nadir malları. Bu bir oyun sonu değildir:
// kule bitince oyun sürer, kasaba kalıcı "Altın Çağ" unvanını taşır. Mantık src/systems/GoldenAgeSystem.js'te
// (saf yardımcılar src/systems/GoldenAge.js), kulenin aşamaları data/buildings.js -> wonder.

// Kulenin açılışı: kasaba en az requiresTier seviyesinde (Kasaba) ve en az population sakinli olmalı
export const TOWER_UNLOCK = { requiresTier: 3, population: 20 };

// Kulenin aşamalarında ustalık katkısı: aşamanın masters mesleklerinden birinde Kalfa olan inşaatçı bonus.journeyman,
// Usta olan bonus.master kat hızlı çalışır (Yapı Ustaları gövdeyi, usta zanaatkârlar mekanizmayı hızlandırır)
export const TOWER_MASTERY = { journeyman: 1.25, master: 1.6 };

// Kadim Dişli: Mekanizma & Çan aşaması için Zanaat Atölyesi'nde dökülen pirinç-çelik dişli. Gövde bitince
// atölye (hangi üretim seçiliyse) önce dişlileri döker; stokta kulenin istediği kadar dişli olunca durur.
export const CLOCK_GEAR = {
  name: 'Kadim Dişli',
  cost: { iron: 5, gold: 30, wood: 2 },
  work: 90,
  masterSpeed: 1.5, // Usta zanaatkâr dişliyi bu kat hızlı döker
};

// Çağ Kutlaması: kule tamamlanınca uyanık bütün sakinler meydanda (havuz başı; yoksa kulenin dibi) minutes dakika
// kutlar; konfeti yağar, çan ilk kez çalar. Kutlamadakilerin keyfi dakikada funPerMinute dolar.
export const AGE_CELEBRATION = { minutes: 120, funPerMinute: 0.5 };

// Altın Çağ: kule saati her gün chimeHours'ta çalar. Sesi duyan (uyanık, dışarıda ya da içeride; seferde değil) sakinin
// enerjisi chimeEnergy dolar ve yorgunluğu azalır. Kalıcı etkiler: çalışma şevki workMultiplier (+%10), kasaba refahı
// welfareMultiplier (+%10, %100'ü aşmaz). Çan dalgası chimeWaveSeconds saniye çizilir.
export const GOLDEN_AGE = {
  chimeHours: [8, 18],
  chimeEnergy: 12,
  chimeFun: 4,
  workMultiplier: 1.1,
  welfareMultiplier: 1.1,
  chimeWaveSeconds: 3.2,
  merchantInterval: 0.6, // tüccar ziyaretleri arası gün çarpanı (daha sık gelir)
  maxBooks: 5, // Antik Kitap: Bilgelik Evi kitaplığındaki her kitap araştırmayı bookResearch hızlandırır (en çok maxBooks)
  bookResearch: 0.05,
};

// Tarihçe Kütüğü (Kasaba Arşivi'nin sekmesi): kurucular, ilk evlenen çift, ilk usta işi eser, kulenin baş ustası
export const CHRONICLE = { founders: 6 };

// Altın Çağ'da gezgin tüccarın getirdiği nadir mallar (altınla; data/trade.js -> TRADE_OFFERS'a eklenir)
export const GOLDEN_OFFERS = [
  {
    id: 'rareSeeds',
    give: { gold: 120 },
    grant: 'vineSeed',
    stock: 1,
    goldenAge: true,
    name: 'Nadir Tohumlar',
    description: 'Uzak bağlardan egzotik üzüm fidesi: bir Üzüm Asması dikilebilir.',
  },
  {
    id: 'ancientBooks',
    give: { gold: 150 },
    grant: 'ancientBook',
    stock: 1,
    goldenAge: true,
    name: 'Antik Kitaplar',
    description: "Bilgelik Evi'nin kitaplığına girer: her kitap araştırmaları kalıcı %5 hızlandırır (en çok 5).",
  },
];
