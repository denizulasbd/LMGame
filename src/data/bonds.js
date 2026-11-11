// (29.5 "Omuz Omuza") Sosyal iş seçimi: bağ puanı iş seçimini ağırlıklandırır, yan yana çalışan dostlar keyiflenir, kırgınlar gerilir.
// Saf hesaplar src/systems/Bonds.js'te, olaylar ve moodlet'ler src/systems/BondSystem.js'te. Hiç zar çekilmez.

export const BOND_RULES = {
  tilesPerPoint: 1, // findWorkFor: puan başına iş bu kadar karo yakın / uzak görünür
  sideAt: 2, // "Omuz Omuza" için en az bağ puanı
  rubAt: -2, // "Diken Üstünde" için en çok bağ puanı
  scanRadius: 64, // aynı işte sayılmak için piksel uzaklığı (şantiye ve toplama emirlerinde)
  majorAt: 3, // bu puan ve üstünde Omuz Omuza "major" kademededir
};

// Bağ puanı koşulları (toplanır, sonra -4..+4'e kırpılır)
export const BOND_POINTS = {
  partner: 3,
  kindred: 3,
  friendHigh: { min: 70, points: 2 },
  friendMid: { min: 40, points: 1 },
  chemistryGood: { min: 2, points: 1 },
  grateful: 1,
  resentful: -3,
  rival: { below: -10, points: -3 },
  chemistryBad: { below: 0, points: -1 },
  avoided: -2,
  clamp: 4,
  crewClamp: 6,
};
