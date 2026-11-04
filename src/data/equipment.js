// Kişisel ekipman (9. aşama). Her yetişkin sakinin üç yuvası vardır: Alet, Kıyafet, Çanta.
// Zanaat Atölyesi'ndeki zanaatkâr ekipmanı kasaba deposuna üretir (state.equipment); boşta ekipman
// olunca ona en çok ihtiyacı olan sakin atölyeye ya da kilere gidip kuşanır. Hesaplar
// src/systems/CraftingSystem.js'te; etkileri BehaviorSystem (iş hızı), NeedsSystem (üşüme, yol
// yorgunluğu) ve HeatingSystem (üşüme balonu) uygular.
//
// 10. aşama — gerçek üretim zinciri: alet demirden, palto ve çanta yünden yapılır.
//   slot     : hangi yuvaya takılır
//   cost     : asıl tarif: üretimde stoktan harcanan kaynak (demir / yün içerir)
//   material : asıl tarifin özel malzemesi (bunu üreten yapı: Demir Madeni / Koyun Ağılı)
//   fallbackCost : eski usul tarif (9. aşamanın odun / taş / yiyecek maliyeti). Kasabada henüz o malzemeyi
//              üreten tamamlanmış bir yapı yoksa kullanılır; böylece erken oyunda atölye tıkanmaz.
//              Üreten yapı varsa zanaatkâr malzemenin gelmesini bekler (yedek tarif daha pahalıdır).
//   work     : üretim süresi (oyun dakikası × iş hızı)
//   workSpeed: kuşananın üretim ve inşaat hızı çarpanı
//   coldProtection : kışın dışarıda üşümenin etkisini bu oranda azaltır (0,6 = %60 daha az üşür)
//   travelFatigue  : yürürken enerji azalma çarpanı (0,6 = %40 daha az yorulur)
export const EQUIPMENT_SLOTS = {
  tool: { name: 'Alet' },
  clothing: { name: 'Kıyafet' },
  bag: { name: 'Çanta' },
};
export const SLOT_KEYS = Object.keys(EQUIPMENT_SLOTS);

export const EQUIPMENT = {
  sturdyTool: {
    slot: 'tool',
    name: 'Sağlam Alet',
    shortName: 'Alet',
    icon: 'sturdyTool',
    description: 'Çelik başlı, sağlam saplı alet takımı: tüm üretim ve inşaat hızı +%25.',
    cost: { iron: 2, wood: 2 },
    material: 'iron',
    fallbackCost: { wood: 4, stone: 4 },
    work: 70,
    workSpeed: 1.25,
  },
  winterCoat: {
    slot: 'clothing',
    name: 'Kalın Kışlık Palto',
    shortName: 'Palto',
    icon: 'winterCoat',
    description: 'Yün kumaştan, kürk yakalı kalın palto: kışın dışarıda %60 daha az üşür.',
    cost: { wool: 3, wood: 1 },
    material: 'wool',
    fallbackCost: { wood: 6, food: 4 },
    work: 80,
    coldProtection: 0.6,
  },
  backpack: {
    slot: 'bag',
    name: 'Sırt Çantası',
    shortName: 'Çanta',
    icon: 'backpack',
    description: 'Kalın yün keçeden, ahşap çerçeveli sırt çantası: uzak yollarda %40 daha az yorulur, çalışma verimi +%15.',
    cost: { wool: 2, wood: 2 },
    material: 'wool',
    fallbackCost: { wood: 5, food: 3 },
    work: 60,
    workSpeed: 1.15,
    travelFatigue: 0.6,
  },
};
export const EQUIPMENT_KEYS = Object.keys(EQUIPMENT);

// Atölyede üretim seçimi: 'auto' depoda en çok eksik olanı sırayla üretir; bir ekipman seçilirse
// o ekipman ihtiyaçtan spareStock fazla birikene kadar üretilir
export const CRAFT_MODES = {
  auto: { name: 'Otomatik', description: 'Eksik olana göre sırayla üretir' },
  sturdyTool: { name: 'Alet' },
  winterCoat: { name: 'Palto' },
  backpack: { name: 'Çanta' },
};
export const CRAFTING = {
  spareStock: 2,
  coatSeasons: ['autumn', 'winter'], // bu mevsimlerde palto önceliklidir ve sakinler giyer
};
