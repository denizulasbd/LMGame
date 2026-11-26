// Karo ve doğal nesne türlerinin oyun kuralları (görselden bağımsız).
//   walkable  : karakterler üzerinden geçebilir mi
//   buildable : üzerine bina kurulabilir mi
//   ground    : doğal toprak zemin mi (çimen ve biyom karoları); yapılar, ağaçlar, yollar bunların üstüne kurulur
//   variants  : görsel varyasyonların okunabilir adları (sıra art/tiles ile aynı)
//   edgeOverlay: komşu karo `neighbors` listesindeyse o kenara çizilecek geçiş görseli; dizi olabilir
//               (komşunun türüne göre farklı geçiş, ör. yolun kenarına çimen ya da bereketli toprak taşar)
//   moveCost  : yol bulmada bu karoya adım atmanın maliyeti (düşük = tercih edilir).
//               Yollar ve köprü ucuz olduğu için sakinler doğal olarak patikalardan yürür.
//   speedMultiplier: karakterin bu karo üzerindeki yürüme hızı çarpanı
//   road      : (18. aşama) döşenmiş yol (patika, parke, taş plaka, köprü): kenarları birbirine bağlanır (otomatik
//               viraj ve kavşak köşeleri), otopilot ve sakinler yolları öncelikli kullanır
//   biome     : (mikro-biyom karoları) { hint, buildingBonus: { yapıTürü: oran } }; üstüne kurulan
//               yapının verimi ayak izindeki bu karoların oranıyla artar (bkz. systems/StructureSystem.js)

// Doğal toprak zeminler: çimen ve mikro-biyomlar (8. aşama). Sıra, geçişlerin önceliğidir:
// listede sonra gelen biyom kenarını öncekinin üstüne taşırır.
export const GROUND_TILES = ['grass', 'meadow', 'rocky', 'forest'];

// Yol, kum, meydan gibi karoların kenarına komşu zeminden taşan geçişler
const GROUND_FRINGES = [
  { sprite: 'grassFringe', neighbors: ['grass'] },
  { sprite: 'meadowFringe', neighbors: ['meadow'] },
  { sprite: 'rockyFringe', neighbors: ['rocky'] },
  { sprite: 'forestFringe', neighbors: ['forest'] },
];

export const TILE_TYPES = {
  grass: {
    id: 0,
    name: 'Çimen',
    walkable: true,
    buildable: true,
    ground: true,
    moveCost: 1,
    variants: ['Sade', 'Çiçekli', 'Taşlı'],
    // Biyomlar çimenin üstüne kenarlarını taşırır: geçiş yumuşak görünür
    edgeOverlay: GROUND_FRINGES.slice(1),
  },
  path: {
    id: 1,
    name: 'Toprak Patika',
    walkable: true,
    buildable: false,
    moveCost: 0.4,
    speedMultiplier: 1.1, // (18. aşama) +%10; yağmurda çamurlanır (data/landscape.js -> MUD)
    road: true,
    variants: ['Sade'],
    edgeOverlay: GROUND_FRINGES,
  },
  water: {
    id: 2,
    name: 'Nehir',
    walkable: false,
    buildable: false,
    variants: ['Akıntı'],
    edgeOverlay: { sprite: 'waterFoam', neighbors: [...GROUND_TILES, 'sand', 'path', 'plaza'] },
  },
  sand: {
    id: 3,
    name: 'Kum',
    walkable: true,
    buildable: false,
    moveCost: 1.4,
    speedMultiplier: 0.85,
    variants: ['Sade', 'Çakıllı'],
    edgeOverlay: GROUND_FRINGES,
  },
  plaza: {
    id: 4,
    name: 'Taş Plaka',
    walkable: true,
    buildable: false,
    moveCost: 0.38,
    speedMultiplier: 1.2,
    road: true,
    variants: ['Sade'],
    edgeOverlay: GROUND_FRINGES,
  },
  bridge: {
    id: 5,
    name: 'Ahşap Köprü',
    walkable: true,
    buildable: false,
    moveCost: 0.4,
    speedMultiplier: 1.2,
    road: true,
    variants: ['Kuzey', 'Güney', 'Tek', 'Orta'],
  },
  cobble: {
    id: 6,
    name: 'Parke Taş Yol',
    walkable: true,
    buildable: false,
    moveCost: 0.35,
    speedMultiplier: 1.25, // (18. aşama) +%25; yağmurda çamur olmaz
    road: true,
    variants: ['Sade'],
    edgeOverlay: GROUND_FRINGES,
  },
  // --- Mikro-biyomlar (8. aşama) ---
  meadow: {
    id: 7,
    name: 'Bereketli Toprak',
    walkable: true,
    buildable: true,
    ground: true,
    moveCost: 1,
    variants: ['Yoncalı', 'Çiçekli'],
    biome: { hint: 'Bahçe verimi +%25, Koyun Ağılı +%20', buildingBonus: { garden: 0.25, sheepFarm: 0.2 } },
  },
  rocky: {
    id: 8,
    name: 'Kayalık Tepe',
    walkable: true,
    buildable: true,
    ground: true,
    moveCost: 1.2,
    speedMultiplier: 0.9,
    variants: ['Çakıllı', 'Taşlı'],
    biome: { hint: 'Taş Ocağı ve Demir Madeni verimi +%20', buildingBonus: { quarry: 0.2, ironMine: 0.2 } },
    edgeOverlay: GROUND_FRINGES.slice(1, 2), // bereketli toprak kayalığın kenarına taşar
  },
  forest: {
    id: 9,
    name: 'Orman Zemini',
    walkable: true,
    buildable: true,
    ground: true,
    moveCost: 1.1,
    variants: ['Yosunlu', 'Yapraklı'],
    biome: { hint: 'Sık ağaçlar ve bol böğürtlen' },
    edgeOverlay: GROUND_FRINGES.slice(1, 3),
  },
};

/** Doğal toprak zemin mi (çimen ya da bir biyom)? */
export function isGround(tile) {
  return Boolean(TILE_TYPES[tile]?.ground);
}

// Zeminin üzerinde duran doğal nesneler. Bir karoda en fazla bir nesne bulunur.
// id 0 "nesne yok" anlamına gelir.
//   harvest   : toplama emriyle ne kazanılır { job, work (oyun dakikası), yields, leaves }
//               leaves: iş bitince yerinde kalan nesne (34.3'ten beri ağaç ve kaya kalıntı bırakmaz: null)
//   clearable : üzerine inşaat yapılırken kendiliğinden temizlenir (çakıl, kütük, fidan)
// (34.3) Kayanın kendi taşı ve eskiden geride kalan çakılın taşı (kaya artık ikisini birden verir)
export const ROCK_STONE = 7;
export const PEBBLE_STONE = 2;

export const OBJECT_TYPES = {
  oak: {
    id: 1,
    name: 'Meşe Ağacı',
    walkable: false,
    buildable: false,
    harvest: { job: 'chop', work: 45, yields: { wood: 8 }, leaves: null },
  },
  pine: {
    id: 2,
    name: 'Çam Ağacı',
    walkable: false,
    buildable: false,
    harvest: { job: 'chop', work: 40, yields: { wood: 7 }, leaves: null },
  },
  rock: {
    id: 3,
    name: 'Kaya',
    walkable: false,
    buildable: false,
    harvest: { job: 'mine', work: 60, yields: { stone: ROCK_STONE + PEBBLE_STONE }, leaves: null }, // (34.3) çakıl bırakmaz: çakılın taşı verime eklenir (7 + 2 = 9)
  },
  pebbles: {
    id: 4,
    name: 'Çakıl Taşları',
    walkable: true,
    buildable: false,
    clearable: true,
    extraMoveCost: 0.3,
    harvest: { job: 'mine', work: 15, yields: { stone: PEBBLE_STONE }, leaves: null },
  },
  // (34.3) Kütük artık oluşmaz; yalnızca eski kayıtlarda bulunur ve açılışta temizlenir (TownScene -> purgeStumps)
  stump: { id: 5, name: 'Ağaç Kütüğü', walkable: true, buildable: false, clearable: true, extraMoveCost: 0.5 },
  sapling: { id: 6, name: 'Fidan', walkable: true, buildable: false, clearable: true, extraMoveCost: 0.3 },
};

// Fidanın ağaca dönüşme süresi (oyun saati). (34.3) kütük aşaması kalktı: yeni fidanlar orman yenilenmesiyle gelir (data/forest.js)
export const TREE_REGROWTH = { saplingHours: 36 };

const byId = (types) => Object.fromEntries(Object.entries(types).map(([key, def]) => [def.id, key]));

// Haritada sayısal id -> ad dönüşümü için
export const TILE_BY_ID = byId(TILE_TYPES);
export const OBJECT_BY_ID = byId(OBJECT_TYPES);
