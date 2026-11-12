// (29.6 "Vefa ve Husumet") Sakinin Yönetime sadakati. Saf hesaplar src/systems/Loyalty.js'te, olaylar src/systems/LoyaltySystem.js'te.
//
// c.loyalty: tam sayı -100..+100, başlangıç 0 (kayda girer). Kapsam: rolü olmayan yetişkinler (çocukta, konukta hep 0).
// Gün dönümünde 0'a doğru driftPerDay kadar söner. loyalAt üstü "Sadık", bitterAt altı "Kırgın".
// Etkiler: isyancı sıralaması (mutluluk + sadakat x riotWeight), elebaşı (en düşük sadakatli isyancı), ağır verginin keyif etkisi
// (Sadık x0,5, Kırgın x2), terk edişte sıralama (Sadık, başka aday varken seçilmez).
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
};

export const LOYALTY_SOURCES = {
  petitionFulfilled: 15,
  petitionRejected: -15,
  petitionExpired: -8,
  bitterFulfilledBonus: 2, // Kırgın sakinin dileği karşılanınca kazanç bu kat ("gönlünü aldın")
  relief: 4,
  reliefHungry: 8, // erzak / altın dağıtımı (o an aç olana)
  taxCollected: { exempt: 2, low: 0, standard: -1, heavy: -4 },
  taxRaisedToHeavy: -6,
  musterFatigue: -3,
  feastServed: 2,
  neglected: -5,
  homeBurned: -6,
  condolence: 3, // (29.7) Taziye Sofrası: törene katılanlara
  gift: 6, // (29.7) özel günde armağan
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
};
