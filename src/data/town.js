// Kasabanın geneline ait kurallar: refah (ortalama mutluluk), göç koşulları, şenlik ve
// kasaba çapındaki geçici bonuslar. Hesaplar src/systems/TownStatus.js ve EventSystem.js'te.

// Bir sakinin mutluluğu ihtiyaçlarının ağırlıklı ortalamasıdır (0-100)
export const HAPPINESS_WEIGHTS = { fun: 0.4, social: 0.2, hunger: 0.2, energy: 0.2 };

// Refah göstergesinin renk eşikleri
export const HAPPINESS_LEVELS = [
  { min: 70, key: 'good', name: 'Mutlu' },
  { min: 50, key: 'ok', name: 'Huzurlu' },
  { min: 0, key: 'bad', name: 'Mutsuz' },
];

// Göç: sabah ARRIVAL_HOUR'da şu koşullar sağlanırsa en fazla maxPerMorning kişi gelir
export const IMMIGRATION = {
  arrivalHour: 8,
  maxPerMorning: 2,
  maxPopulation: 24,
  minHappiness: 55,
  minFood: 15,           // en az bu kadar
  foodPerResident: 3,    // ve sakin başı bu kadar yiyecek (bir öğün)
};

// Akşam şenliği: başlangıç saatinde koşullar sağlanırsa bitişe kadar sürer
export const FESTIVAL = {
  startHour: 19,
  endHour: 22,
  minDaysBetween: 3,
  minFun: 60,            // kasabanın ortalama keyfi
  minPopulation: 3,
  // Şenlik yeri önceliği: meydan havuzu, kamp ateşi, han
  venues: ['fountain', 'campfire', 'inn'],
  afterglowFun: 30,      // şenlik bitince herkesin keyfine eklenen
};

// Kasaba çapındaki geçici bonuslar. hours: süre; workSpeed: iş hızı çarpanı; funDecay: keyif azalma
// çarpanı; instantFun: başladığı an herkese eklenen keyif
export const TOWN_BUFFS = {
  tools: { name: 'Alet Paketi', icon: 'hammer', hours: 24, workSpeed: 1.25 },
  feast: { name: 'Kasaba İkramı', icon: 'food', hours: 24, funDecay: 0.5, instantFun: 25 },
  festival: { name: 'Şenlik Coşkusu', icon: 'sparkle', hours: 20, workSpeed: 1.15, funDecay: 0.7 },
};

// Handa sıcak yemek yiyen sakinin kişisel bonusu: bu kadar oyun saati boyunca yavaş acıkır
export const WARM_MEAL = { hours: 8, hungerDecay: 0.6 };

// Kasaba adı önerileri (başlangıç ekranında rastgele biri önerilir; zar düğmesi yenisini getirir)
export const TOWN_NAMES = [
  'Yeşilvadi',
  'Çamlıköy',
  'Gümüşdere',
  'Kuzupınar',
  'Elmalıyurt',
  'Sarıçiçek',
  'Ilgınbağ',
  'Akçakaya',
  'Serinsu',
  'Lavantalı',
  'Dutluca',
  'Ayışığı Köyü',
  'Kırlangıç',
  'Göknarlı',
  'Bal Tepesi',
  'Söğütlüdere',
];
export const TOWN_NAME_MAX_LENGTH = 24;
