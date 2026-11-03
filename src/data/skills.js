// Mesleki ustalık: sakinler bir işi yaptıkça o meslekte deneyim (oyun dakikası) kazanır.
// Kademe atladıkça o işte daha hızlı çalışır. Hesaplar src/systems/SkillSystem.js'te.
//
//   SKILLS          : meslekler; title günlükte "Usta bir Balıkçı" gibi kullanılır
//   ACTIVITY_SKILLS : hangi etkinlik hangi mesleği geliştirir (data/activities.js anahtarları)
//   SKILL_LEVELS    : kademeler; xp = o meslekte çalışılmış oyun dakikası, bonus = iş hızı çarpanı
export const SKILLS = {
  woodcutting: { name: 'Odunculuk', title: 'Oduncu', icon: 'axe' },
  masonry: { name: 'Taşçılık', title: 'Taşçı', icon: 'pickaxe' },
  farming: { name: 'Çiftçilik', title: 'Çiftçi', icon: 'basket' },
  fishing: { name: 'Balıkçılık', title: 'Balıkçı', icon: 'fish' },
  cooking: { name: 'Aşçılık', title: 'Aşçı', icon: 'food' },
  building: { name: 'İnşaat', title: 'Yapı Ustası', icon: 'hammer' },
  crafting: { name: 'Zanaatkârlık', title: 'Zanaatkâr', icon: 'anvil' },
  // 10. aşama: hayvancılık, fırıncılık ve madencilik
  husbandry: { name: 'Hayvancılık', title: 'Çoban', icon: 'wool' },
  baking: { name: 'Fırıncılık', title: 'Fırıncı', icon: 'bread' },
  mining: { name: 'Madencilik', title: 'Madenci', icon: 'iron' },
};

export const SKILL_KEYS = Object.keys(SKILLS);

export const ACTIVITY_SKILLS = {
  chop: 'woodcutting',
  lumber: 'woodcutting',
  mine: 'masonry',
  quarry: 'masonry',
  farm: 'farming',
  forage: 'farming',
  fish: 'fishing',
  cook: 'cooking',
  build: 'building',
  craft: 'crafting',
  herd: 'husbandry',
  bake: 'baking',
  mineIron: 'mining',
};

export const SKILL_LEVELS = [
  { level: 1, name: 'Çırak', xp: 0, bonus: 1 },
  { level: 2, name: 'Kalfa', xp: 480, bonus: 1.2 },   // ~8 saatlik çalışma (bir mesai günü)
  { level: 3, name: 'Usta', xp: 1500, bonus: 1.4 },  // ~25 saatlik çalışma (üç mesai günü)
];

// İş seçerken deneyimin etkisi: her kademe işi bu kadar karo yakınmış gibi gösterir
export const SKILL_PREFERENCE_TILES = 8;
// Karakter panelinde gösterilen en fazla meslek
export const PANEL_SKILL_COUNT = 3;
