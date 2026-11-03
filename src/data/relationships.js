// Sakinler arasındaki ilişki puanı (-50 ile 100 arası). Puan nasıl değişir ve ne işe yarar:
//   - birlikte sohbet etmek (havuz başı, ateş başı) ve aynı şantiyede / binada çalışmak puan kazandırır
//   - zıt kişilikli iki sakin atışınca puan düşer; eksiye inince "Hoşlanmıyor", -25'in altında "Rakip"
//   - seviye yükseldikçe sohbet sosyalliği ve keyfi daha hızlı doldurur; rakiple sohbet keyif kaçırır
//   - 85+ puanlı iki bekâr yetişkin sohbet ederken aşık olabilir (Partner), sonra evlenir (Eş)
// Hesap src/systems/RelationshipSystem.js ve ConflictSystem.js'te; burada yalnızca sayılar var.

// min: bu seviyeye ulaşmak için gereken puan; socialBonus: sohbette sosyallik kazanç çarpanı;
// funBonus: sohbet ederken dakika başına ek keyif (eksi: keyif kaçar)
export const RELATIONSHIP_LEVELS = [
  { key: 'rival', name: 'Rakip', min: -50, socialBonus: 0.5, funBonus: -0.15 },
  { key: 'dislike', name: 'Hoşlanmıyor', min: -25, socialBonus: 0.8, funBonus: -0.05 },
  { key: 'stranger', name: 'Yabancı', min: -10, socialBonus: 1, funBonus: 0 },
  { key: 'acquaintance', name: 'Tanıdık', min: 10, socialBonus: 1.1, funBonus: 0 },
  { key: 'friend', name: 'Dost', min: 40, socialBonus: 1.45, funBonus: 0.12 },
  { key: 'bestFriend', name: 'En İyi Arkadaş', min: 75, socialBonus: 1.9, funBonus: 0.25 },
];

// Çiftin dakika başına kazandığı puan
export const RELATIONSHIP_RATES = {
  chat: 0.11, // aynı toplanma yerinde sohbet
  work: 0.05, // aynı iş / bina üzerinde birlikte çalışma
};

export const MAX_FRIENDSHIP = 100;
export const MIN_FRIENDSHIP = -50;
export const HOUSEMATE_START = 12; // aynı evde yaşayanlar tanıdık olarak başlar
export const FAMILY_START = 60; // ebeveyn ile çocuk ve kardeşler dost başlar
export const PANEL_MIN_LEVEL = 'acquaintance'; // karakter panelinde gösterilecek en düşük seviye
export const PANEL_LIST_SIZE = 3;
export const PANEL_RIVAL_BELOW = -10; // bu puanın altındaki en kötü ilişki panelde "anlaşamadığı" olarak görünür

// Romantizm: aynı toplanma yerinde sohbet eden ya da şenlikte dans eden iki bekâr yetişkin
// en az minScore puandaysa dakika başına chancePerMinute olasılıkla aşık olur (yaş farkı en çok maxAgeGap)
export const ROMANCE = { minScore: 85, chancePerMinute: 0.006, maxAgeGap: 14 };

// Evlilik: en az minPartnerDays gündür partner olan çift akşam (eveningFrom-eveningTo) bir toplanma
// yerinde ya da şenlikte birlikteyken dakika başına chancePerMinute olasılıkla evlenir; fallbackDays gün
// geçip hâlâ evlenmedilerse fallbackHour'da meydanda küçük bir törenle evlenirler
export const MARRIAGE = {
  minPartnerDays: 2,
  chancePerMinute: 0.012,
  eveningFrom: 17,
  eveningTo: 2,
  fallbackDays: 5,
  fallbackHour: 18,
  coupleFun: 25,  // düğünde çiftin keyfine eklenen
  townFun: 8,     // düğün sevinci: diğer herkesin keyfine eklenen
};
