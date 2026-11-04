// Kasaba Hazinesi'nin (altın) harcama kanalları (13. aşama). Mantık: src/systems/LuxurySystem.js, etkilerin saf
// yardımcıları src/systems/Luxury.js.
//
// Lüks ve egzotik mallar: yalnızca altınla; gezgin tüccar tezgâhtayken (takas penceresinin "Lüks Mallar" sekmesi) ya
// da Büyük Ticaret Limanı kuruluyken (limanın paneli) satın alınır.
//   price      : altın fiyatı
//   requires   : bu yapı tamamlanmış olmalı ('inn' -> baharat hana teslim edilir)
//   once       : bir kez alınır (ipek ve mermer kalıcıdır)
//
// Kasaba yadigârları: Belediye Konağı'nda sergilenen beş eşsiz eser. Fiyatı sergilenen yadigâr sayısıyla artar
// (RELIC_PRICES); her biri kalıcı bir kasaba özelliği verir.
//
// Altın fermanları: Belediye Konağı'nın panelinden; bekleme süreli, bir kasaba bonusu (data/town.js -> TOWN_BUFFS) verir.

export const LUXURY_GOODS = {
  spiceCrate: {
    name: 'Baharat ve Kahve Sandığı',
    icon: 'spice',
    price: 400,
    requires: { type: 'inn', reason: 'Önce bir Kasaba Hanı tamamlanmalı (sandık hana teslim edilir)' },
    buff: 'spices', // 4 gün boyunca handa baharatlı yemek ve kahve verilir
    personal: { hours: 10, workSpeed: 1.25, walkSpeed: 1.25 }, // handa yiyen sakinin kişisel bonusu
    description: 'Uzak limanlardan tarçın, karabiber ve kavrulmuş kahve. Hana teslim edilir: 4 gün boyunca handa yemek yiyen herkes 10 saat %25 hızlı çalışır ve yürür.',
  },
  silkMarble: {
    name: 'İpek Kumaş ve Mermer Sütunlar',
    icon: 'silk',
    price: 600,
    once: true,
    prestige: { perUpgraded: 0.5, max: 8 }, // her Seviye 2 yapı kasaba refahına kalıcı +0,5 (en çok +8)
    instant: { fun: 25, buff: 'festival' },
    description: 'Taş evlere ipek perdeler, yapılara mermer sütunlar. Kalıcı: her Seviye 2 yapı refaha +0,5 (en çok +8). Hemen: herkesin keyfi +25 ve Şenlik Coşkusu.',
  },
};
export const LUXURY_KEYS = Object.keys(LUXURY_GOODS);

export const RELICS = {
  sunSphere: {
    name: 'Güneş Saati Küresi',
    icon: 'relicSun',
    description: 'Altın halkalı gök küresi: tüm üretim yapılarında verim kalıcı +%10.',
    effect: { production: 1.1 },
  },
  cornucopia: {
    name: 'Bereket Boynuzu',
    icon: 'relicHorn',
    description: 'Meyveyle taşan kadim boynuz: yiyecek üreten yapılar (bahçe, ağıl, iskele) kalıcı +%25.',
    effect: { food: 1.25 },
  },
  guildSeal: {
    name: 'Usta Lonca Mührü',
    icon: 'relicSeal',
    description: 'Ustaların kırmızı mumlu mührü: meslek deneyimi kazanma kalıcı +%30.',
    effect: { xp: 1.3 },
  },
  compass: {
    name: 'Denizci Pusulası',
    icon: 'relicCompass',
    description: 'Pirinç denizci pusulası: ticaret teknesi %50 daha fazla yük alır, ihracatın altın değeri +%20.',
    effect: { exportCapacity: 1.5, exportValue: 1.2 },
  },
  eternalFlame: {
    name: 'Ebedi Ateş Kandili',
    icon: 'relicFlame',
    description: 'Hiç sönmeyen turkuaz alevli kandil: evler kışın %30 daha az odun yakar, dışarıdakiler yarı yarıya az üşür.',
    effect: { heating: 0.7, cold: 0.5 },
  },
};
export const RELIC_KEYS = Object.keys(RELICS);
// Sergilenen yadigâr sayısına göre sıradakinin fiyatı (altın)
export const RELIC_PRICES = [1500, 3000, 5000, 7000, 9000];

export const GOLD_DECREES = {
  goldBonus: {
    name: 'Ustalara Altın İkramiye',
    icon: 'coin',
    price: 1000,
    buff: 'goldBonus',
    instant: { fun: 15 },
    cooldownDays: 4,
    description: 'Meydanda herkese altın ikramiye dağıtılır: keyif +15; 3 gün boyunca iş hızı +%20, keyif yavaş düşer, refah +5.',
  },
  royalArchitects: {
    name: 'Kraliyet Mimarları',
    icon: 'hammer',
    price: 1500,
    buff: 'royalArchitects',
    cooldownDays: 4,
    description: 'Başkentten kraliyet mimarları kiralanır: 2 gün boyunca tüm şantiyeler, yükseltmeler, onarımlar ve harika aşamaları 3 kat hızlı ilerler.',
  },
};
export const GOLD_DECREE_KEYS = Object.keys(GOLD_DECREES);
