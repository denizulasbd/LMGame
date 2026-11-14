// (29.6 "Vefa ve Husumet") Sakinin Yönetime sadakati. Saf hesaplar src/systems/Loyalty.js'te, olaylar src/systems/LoyaltySystem.js'te.
//
// c.loyalty: tam sayı -100..+100, başlangıç 0 (kayda girer). Kapsam: rolü olmayan yetişkinler (çocukta, konukta hep 0).
// Gün dönümünde 0'a doğru driftPerDay kadar söner. loyalAt üstü "Sadık", bitterAt altı "Kırgın".
// Etkiler: isyancı sıralaması (mutluluk + sadakat x riotWeight), elebaşı (en düşük sadakatli isyancı), ağır verginin keyif etkisi
// (Sadık x0,5, Kırgın x2), terk edişte sıralama (Sadık, başka aday varken seçilmez).
// (30.3) Beş kademe (Kırgın / Homurdanıyor / Sakin / Memnun / Sadık) ve günlük kaynaklar ENGINES.discontent ile gelir (DISCONTENT).
// HİÇ ZAR ÇEKMEZ: bütün kaynaklar olay tabanlıdır; izole üreteç (tohum + 41) yalnızca söz seçimi içindir (RiteSystem ile ortak).

export const LOYALTY_SEED_OFFSET = 41;

export const LOYALTY = {
  clamp: 100,
  driftPerDay: 1, // gün dönümünde 0'a doğru
  loyalAt: 40, // "Sadık" eşiği (>=)
  bitterAt: -40, // "Kırgın" eşiği (<=)
  riotWeight: 0.3, // isyancı sıralamasında mutluluğa eklenen sadakat payı
  taxJoy: { loyal: 0.5, bitter: 2 }, // ağır verginin keyif etkisi çarpanı
  appease: { leader: 10, rioter: 5 }, // isyan yardımla yatışınca
  hungryBelow: 25, // dağıtım anında tokluğu bunun altındaki sakin "aç" sayılır (reliefHungry; Açlıktan Gözü Dönmüş eşiği)
  // (29.10) Kırgın kasaba: Kırgın yetişkinlerin payı share'i aşınca Yönetim Güveni saat başı perHour x pay kadar erir (TrustSystem.hourly).
  // 29.6'da sadakatin isyanın tetiklenmesine hiçbir yolu yoktu: iyi beslenen kasabada Ağır Vergi ve reddedilen dilekçelerle bile güven %100'de kalıyordu.
  bitterTrust: { share: 0.25, perHour: -1.7 },
};

export const LOYALTY_SOURCES = {
  petitionFulfilled: 15,
  petitionRejected: -15,
  petitionExpired: -8,
  bitterFulfilledBonus: 2, // Kırgın sakinin dileği karşılanınca kazanç bu kat ("gönlünü aldın")
  relief: 4,
  reliefHungry: 8, // erzak / altın dağıtımı (o an aç olana)
  taxCollected: { exempt: 6, low: 2, standard: -1, heavy: -7 }, // 29.10: exempt 2 -> 6, low 0 -> 2, heavy -4 -> -7
  taxRaisedToHeavy: -10, // 29.10: -6 -> -10
  musterFatigue: -3,
  feastServed: 2,
  neglected: -5,
  homeBurned: -6,
  condolence: 5, // (29.7) Taziye Sofrası: törene katılanlara (29.10: 3 -> 5)
  gift: 10, // (29.7) özel günde armağan (29.10: 6 -> 10)
  // (30.3) "Kararın Ağırlığı" (ENGINES.discontent): sadakat artık her gün kıpırdar
  taxDaily: { exempt: 2, low: 1, standard: 0, heavy: -3 }, // her gün dönümünde, o günkü vergi kademesine göre
  hungryDaily: -4, // gün dönümünde (ya da o gün) "Açlıktan Gözü Dönmüş" olan sakin; günde bir kez
  coldDaily: -3, // o gün üşüyerek uyanmış / donmuş olan sakin (gün dönümünde, bir kez)
  friendRejected: -4, // reddedilen dilekçenin sahibiyle ilişki puanı >= friendAt olan her sakin
  friendFulfilled: 2, // karşılanan dilekçenin sahibinin dostları
};

// ---------------------------------------------------------------------------------------------------------------------
// (30.3) Kararın Ağırlığı: hoşnutsuzluk basamakları, iş bırakma, Halkın Nabzı ve anında geri bildirim (ENGINES.discontent).
// Saf hesaplar src/systems/Loyalty.js'te, olaylar src/systems/DiscontentSystem.js'te. HİÇ ZAR ÇEKMEZ (sözler tohum + 41).
export const DISCONTENT_TABLE_VERSION = 1;

export const DISCONTENT = {
  friendAt: 40, // dilekçe sahibinin "dostu": ilişki puanı bu ve üstü
  // Beş kademe (yukarıdan aşağıya ilk uyan): sadakat <= max. Etkiler Moodlets.recomputeMood'a MOOD_LIMITS kırpmasından önce katılır.
  levels: [
    { key: 'bitter', max: -40, effects: { workMul: 0.8, quarrelMul: 1.2 } },
    { key: 'grumbling', max: -20, effects: { workMul: 0.92 } },
    { key: 'calm', max: 19, effects: {} },
    { key: 'pleased', max: 39, effects: { workMul: 1.03 } },
    { key: 'loyal', max: 100, effects: { workMul: 1.06 } },
  ],
  // İş bırakma: Kırgın yetişkinler 10:00-12:00 meydanda toplanır (en az minBitter kişi; tek kişi protesto etmez)
  strike: { hours: [10, 12], minBitter: 2 },
  // Homurdanma sözü: Homurdanan / Kırgın sakin saat başı bu olasılıkla (söz üreteci) yakınır; Kırgın'da kat
  grumble: { chance: 0.12, bitterMul: 1.6, seconds: 3.4 },
  // Halkın Nabzı: yetişkinlerin sadakat ortalamasından yüz. Öfkeli <= angryAt · Homurdanıyor <= grumblingAt · Sakin ·
  // Memnun >= pleasedAt · Minnettar >= gratefulAt
  faceAt: { angry: -30, grumbling: -10, pleased: 10, grateful: 30 },
  faces: {
    angry: { name: 'Öfkeli', icon: 'pulseAngry' },
    grumbling: { name: 'Homurdanıyor', icon: 'pulseGrumble' },
    calm: { name: 'Sakin', icon: 'pulseCalm' },
    pleased: { name: 'Memnun', icon: 'pulsePleased' },
    grateful: { name: 'Minnettar', icon: 'pulseGrateful' },
  },
  pulse: { dayWindow: 2, dailyKeep: 3, arrowAt: 2, topReasons: 3, ringHours: 24 },
  feedback: { seconds: 4, flashSeconds: 1.2 },
  // Kıtlık: "≈ N gün yeter" (stok ÷ son 2 günün günlük tüketimi); 1 günün altında sayaç kırmızı ve yanıp söner, hikâye kartı
  famine: { windowDays: 2, redBelowDays: 1, criticalDays: 3 }, // tüketim kaydı yoksa (oyunun ilk günü) tahmin yapılmaz
};

// Nabız ipucundaki neden adları (LoyaltySystem.adjust'in nedenleri gruplanır; gün dönümü kayması neden sayılmaz)
export const PULSE_REASONS = {
  'tax:heavy': 'Ağır Vergi',
  'tax:standard': 'Standart Vergi',
  'tax:low': 'Düşük Vergi',
  'tax:exempt': 'Vergi Muafiyeti',
  petitionRejected: 'reddedilen dilekçe',
  petitionFulfilled: 'karşılanan dilekçe',
  petitionExpired: 'unutulan dilekçe',
  'relief:food': 'erzak dağıtımı',
  'relief:gold': 'altın dağıtımı',
  hunger: 'açlık',
  cold: 'soğuk',
  muster: 'seferberlik yorgunluğu',
  feast: 'ziyafet ikramı',
  neglected: '"Sesimiz Duyulmadı"',
  homeBurned: 'yanan ev',
  appeased: 'yatışan isyan',
  condolence: 'Taziye Sofrası',
  gift: 'özel gün armağanı',
  other: 'öteki',
};

// Homurdanma sözleri (nedenine göre; söz üreteci seçer)
export const LOYALTY_LINES = {
  tax: ['Bu vergiyle nasıl geçinelim?', 'Kesemde bir şey kalmadı!', 'Haraç gibi vergi bu!', 'Alın terimiz hazineye gidiyor.'],
  hunger: ['Karnımız aç, kimin umurunda?', 'Kiler boş, yönetim nerede?', 'Bir lokma ekmeğe muhtacız!'],
  petition: ['Dileğimizi kimse dinlemiyor.', 'Dilekçemi yırtıp attılar!', 'Bizi duyan yok mu?'],
  cold: ['Bu soğukta odun bile yok!', 'Donuyoruz, kimse aldırmıyor.'],
  general: ['Bu yönetimden hayır yok.', 'Böyle gitmez bu iş!', 'Söz verdiler, tutmadılar.'],
};

// Vefa / husumet (29.6): etiket kuralları ve anı metinleri ({who}: kişinin adı)
export const DEBT_RULES = {
  fireThanks: 3, // yangında en çok bu kadar söndürene (kimlik sırasıyla) minnet
  recallMinutes: 240, // hatırlanan anının kişisi bu süre aranır / kaçınılır (kaydedilmez)
};
export const DEBT_MEMORIES = {
  fireHome: '{who} yangında evini kurtardı',
  fireWork: '{who} yangında iş yerini kurtardı',
  looted: '{who} isyanda evini yağmaladı',
  lootedWork: '{who} isyanda iş yerini yağmaladı',
};

export const LOYALTY_TIERS = {
  loyal: { name: 'Sadık', icon: 'heart', hint: 'Yönetime gönülden bağlı: ağır vergiye daha az kırılır, isyana ve göçe en son katılır.' },
  bitter: { name: 'Kırgın', icon: 'sulk', hint: 'Yönetime kırgın: ağır vergi onu iki kat üzer, isyanda ilk o ayaklanır. Dileği karşılanırsa gönlü iki kat alınır.' },
  // (30.3) beş kademe (Sakin'de rozet yok)
  grumbling: { name: 'Homurdanıyor', icon: 'angry', hint: 'Yönetimden şikâyetçi: işini biraz isteksiz yapar (iş −%8), ara sıra yakınır. Daha da düşerse Kırgın olur.' },
  pleased: { name: 'Memnun', icon: 'smile', hint: 'Yönetimden memnun: işine biraz daha gönülden sarılır (iş +%3).' },
};
// (30.3) Kademe etkisi açıklamaları (rozetin ipucuna eklenir)
export const LOYALTY_EFFECT_TEXT = {
  bitter: 'İş −%20 · atışma +%20 · her sabah 10:00-12:00 meydanda iş bırakır (en az 2 Kırgın varsa)',
  grumbling: 'İş −%8',
  pleased: 'İş +%3',
  loyal: 'İş +%6',
};
