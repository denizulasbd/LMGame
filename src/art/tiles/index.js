// Zemin karoları (16x16), kenar geçişleri ve doğal nesneler (ağaç, kaya).
// Yeni karo eklemek için: buraya görsel tanımı ekle, src/data/tiles.js'te kurallarını tanımla.
// Varyasyonlar taban ızgaraya küçük desenler damgalanarak üretilir (composeRows).
import { CONFIG } from '../../config.js';
import {
  getSprite,
  composeRows,
  rotateRows,
  flipRowsHorizontal,
  shiftRowsVertical,
  emptyRows,
  recolorRows,
} from '../PixelSprite.js';
import { seasonalGroundRows, seasonalFoliageRows, snowCapRows } from '../seasons.js';

// ---------------------------------------------------------------------------
// Küçük desenler (damga olarak kullanılır, '.' = alttaki pikseli koru)
// ---------------------------------------------------------------------------
const FLOWER_PINK = ['.p.', 'pPp', '.p.', '.G.'];
const FLOWER_WHITE = ['.u.', 'uPu', '.u.', '.G.'];
const BUD_YELLOW = ['P', 'G'];
const BUD_VIOLET = ['i', 'G'];
const BUD_RED = ['o', 'G'];
const STONE_CLUSTER = ['.qq.', 'qrrR', '.RR.'];
const PEBBLE = ['q', 'R'];
const DIRT_PEBBLE = ['q', 'D'];
const SAND_PEBBLE = ['q', 'z'];
const SHELL = ['.u.', 'upu'];

// ---------------------------------------------------------------------------
// Çimen
// ---------------------------------------------------------------------------
const GRASS_BASE = [
  'gggggggggggggggg',
  'gggghggggggggggg',
  'ggghGhgggggggHgg',
  'gggggggggggggggg',
  'gggggggggGgggggg',
  'gHgggggggggggggg',
  'gggggggggggghggg',
  'ggggggGgggghGhgg',
  'gggggghggggggggg',
  'gggggggggggggggg',
  'gghgggggggggggGg',
  'ghGhgggggHgggggg',
  'gggggggggggggggg',
  'ggggggggggggghgg',
  'gggggGgggggghGhg',
  'gggggggggggggggg',
];

const GRASS_FLOWERS = composeRows(GRASS_BASE, [
  [FLOWER_PINK, 2, 1],
  [FLOWER_WHITE, 10, 8],
  [BUD_YELLOW, 7, 4],
  [BUD_VIOLET, 13, 2],
  [BUD_RED, 4, 12],
  [BUD_YELLOW, 12, 13],
]);

const GRASS_PEBBLES = composeRows(GRASS_BASE, [
  [STONE_CLUSTER, 9, 3],
  [PEBBLE, 3, 10],
  [PEBBLE, 13, 12],
  [PEBBLE, 5, 4],
]);

// ---------------------------------------------------------------------------
// Mikro-biyom zeminleri (8. aşama). Doku, karo içi konuma göre deterministik bir "gürültüyle"
// serpiştirilir; üstüne yonca, çiçek, çakıl, mantar gibi küçük desenler damgalanır.
// ---------------------------------------------------------------------------
function speckle(x, y, salt) {
  let h = (x * 374761393 + y * 668265263 + salt * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 16x16 taban doku: base harfi, specks [[eşik, harf], ...] (eşik altındaki gürültü o harfi alır). */
function groundTexture(base, specks, salt) {
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let row = '';
    for (let x = 0; x < 16; x++) {
      const n = speckle(x, y, salt);
      row += specks.find(([limit]) => n < limit)?.[1] ?? base;
    }
    rows.push(row);
  }
  return rows;
}

const CLOVER = ['.~.', '~h~', '.!.'];
const CLOVER_SMALL = ['~~', '.!'];
const MUSHROOM = ['.o.', 'ouo', '.S.'];
const TWIG = ['x..', '.xw', '..x'];
const FERN = ['].]', '.].', '[]['];
const TUFT = ['g.g', '.G.'];

// Bereketli toprak: koyu nemli çimen, yonca kümeleri; çiçekli varyasyonda kır çiçekleri
const MEADOW_BASE = composeRows(groundTexture('=', [[0.1, '!'], [0.2, '~'], [0.23, 'h']], 7), [
  [CLOVER, 2, 2],
  [CLOVER, 10, 9],
  [CLOVER_SMALL, 12, 2],
  [CLOVER_SMALL, 4, 12],
]);
const MEADOW_FLOWERS = composeRows(MEADOW_BASE, [
  [FLOWER_WHITE, 6, 3],
  [BUD_YELLOW, 13, 6],
  [BUD_VIOLET, 3, 9],
  [FLOWER_PINK, 11, 11],
  [BUD_YELLOW, 7, 13],
]);

// Kayalık tepe: boz toprak, çakıllar ve tek tük çimen tutamı; taşlı varyasyonda iri taş kümeleri
const ROCKY_BASE = composeRows(groundTexture('(', [[0.12, ')'], [0.22, ':'], [0.25, 'R']], 11), [
  [PEBBLE, 3, 3],
  [PEBBLE, 12, 7],
  [TUFT, 7, 11],
  [PEBBLE, 2, 13],
]);
const ROCKY_STONES = composeRows(ROCKY_BASE, [
  [STONE_CLUSTER, 8, 2],
  [STONE_CLUSTER, 2, 8],
  [PEBBLE, 13, 12],
]);

// Orman zemini: gölgeli yosun, yaprak ve iğne döküntüsü, eğrelti; yapraklı varyasyonda mantar ve dal
const FOREST_BASE = composeRows(groundTexture(']', [[0.16, '['], [0.26, '^'], [0.28, 'G']], 13), [
  [FERN, 3, 2],
  [FERN, 11, 10],
]);
const FOREST_LITTER = composeRows(FOREST_BASE, [
  [MUSHROOM, 11, 3],
  [TWIG, 3, 10],
  [MUSHROOM, 6, 12],
]);

// ---------------------------------------------------------------------------
// Toprak yol
// ---------------------------------------------------------------------------
const PATH_BASE = composeRows(
  [
    'dddddddddddddddd',
    'ddeddddddDdddddd',
    'dddddddddddddedd',
    'ddddDddddddddddd',
    'ddddddddeddddddd',
    'dedddddddddDDddd',
    'dddddddddddddddd',
    'ddddddDdddddddde',
    'dddddddddeddddDd',
    'ddeddddddddddddd',
    'dddddddddddddDdd',
    'ddddddeddddddddd',
    'dDdddddddddedddd',
    'dddddddddddddddd',
    'ddddeddddDdddded',
    'dddddddddddddddd',
  ],
  [
    [DIRT_PEBBLE, 5, 2],
    [DIRT_PEBBLE, 11, 9],
    [DIRT_PEBBLE, 2, 13],
  ]
);

// ---------------------------------------------------------------------------
// Kum
// ---------------------------------------------------------------------------
const SAND_BASE = [
  'ssssssssssssssss',
  'ssSsssssssssszss',
  'ssssssssSsssssss',
  'sssszsssssssssss',
  'ssssssssssssSsss',
  'sSssssssszssssss',
  'ssssssssssssssss',
  'sssssssSssssssss',
  'ssszsssssssssSss',
  'ssssssssssssssss',
  'ssssssssszssssss',
  'sSssssssssssssss',
  'sssssszsssssssss',
  'ssssssssssssSsss',
  'sssSssssssssssss',
  'ssssssssszssssss',
];

const SAND_PEBBLES = composeRows(SAND_BASE, [
  [SAND_PEBBLE, 4, 6],
  [SAND_PEBBLE, 13, 10],
  [SHELL, 9, 2],
]);

// ---------------------------------------------------------------------------
// Meydan taşı (arnavut kaldırımı)
// ---------------------------------------------------------------------------
const PLAZA = composeRows(
  [
    'MMMMMMMMMMMMMMMM',
    'qqqqqqqMqqqqqqqM',
    'rrqrrrrMrrrrrqrM',
    'RRRRRRRMRRRRRRRM',
    'MMMMMMMMMMMMMMMM',
    'qqqMqqqqqqqMqqqq',
    'rrrMrrrrrqrMrrrr',
    'RRRMRRRRRRRMRRRR',
    'MMMMMMMMMMMMMMMM',
    'qqqqqqqMqqqqqqqM',
    'rqrrrrrMrrrqrrrM',
    'RRRRRRRMRRRRRRRM',
    'MMMMMMMMMMMMMMMM',
    'qqqMqqqqqqqMqqqq',
    'rrrMrrqrrrrMrrrr',
    'RRRMRRRRRRRMRRRR',
  ],
  [
    [['g'], 5, 0],
    [['gh'], 12, 8],
    [['g'], 3, 13],
  ]
);

// ---------------------------------------------------------------------------
// Ahşap köprü (dikey akan nehir üzerinde yatay yol için)
// Varyasyonlar: 0 üst korkuluk, 1 alt korkuluk, 2 tek sıra (iki korkuluk), 3 orta
// ---------------------------------------------------------------------------
const RAIL_DARK = 'xxxxxxxxxxxxxxxx';
const RAIL_LIGHT = 'XEXXXwXXXEXXXwXX';
const PLANK = 'EXwxEXwxEXwxEXwx';
const PLANK_KNOT = 'EXwxEwwxEXwxEXwx';
const PLANK_NAIL = 'qXwxqXwxqXwxqXwx';

function buildBridge(railTop, railBottom) {
  const planksNeeded = 16 - (railTop ? 3 : 0) - (railBottom ? 3 : 0);
  const planks = [];
  for (let i = 0; i < planksNeeded; i++) {
    if (i === 0 || i === planksNeeded - 1) planks.push(PLANK_NAIL);
    else planks.push(i % 4 === 2 ? PLANK_KNOT : PLANK);
  }
  return [
    ...(railTop ? [RAIL_DARK, RAIL_LIGHT, RAIL_DARK] : []),
    ...planks,
    ...(railBottom ? [RAIL_DARK, RAIL_LIGHT, RAIL_DARK] : []),
  ];
}

// ---------------------------------------------------------------------------
// Su (animasyonlu: dalgalar aşağı doğru akar)
// ---------------------------------------------------------------------------
const WATER_BASE = [
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbbcccb',
  'bbbccccbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbNNNbbbb',
  'bbbbbbbbbbbbbbbb',
  'cbbbbbbbbbbbbbcc',
  'bbbbbbabbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbccccbb',
  'bbNNNbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbccbbbbbbbb',
  'bbbbbbbbbbbbbbab',
  'bbbbbbbbbbbbbbbb',
  'bbbcccbbbbNNbbbb',
];
const WATER_FRAME_COUNT = 8;
const WATER_FRAME_SHIFT = 2; // her karede kaç satır kayar

// ---------------------------------------------------------------------------
// Kenar geçişleri. Hepsi "üst kenar" için çizilir, diğer yönler döndürülerek elde edilir.
// ---------------------------------------------------------------------------
const EDGE_ART = {
  // Çimenin komşu karoya taşan kıvrımlı kenarı (yol, kum, meydan üzerine)
  grassFringe: [
    'gggghgggggghgggg',
    'ggGgggggGggggGgg',
    'GgGGgGGgGGGgGGgG',
    '.G..G..G...G..G.',
    ...emptyRows(12, 16),
  ],
  // Biyomların komşu karoya taşan kenarları (çimenin kıvrımlı kenarı, kendi renkleriyle)
  meadowFringe: null,
  rockyFringe: null,
  forestFringe: null,
  // Suyun kıyıya değdiği yerde köpük
  waterFoam: [
    'WaWWaWWWaWWaWWaW',
    'a.aa..aWa..aa.a.',
    '.....a.........a',
    ...emptyRows(13, 16),
  ],
};
EDGE_ART.meadowFringe = recolorRows(EDGE_ART.grassFringe, { g: '=', G: '!', h: '~' });
EDGE_ART.rockyFringe = recolorRows(EDGE_ART.grassFringe, { g: '(', G: ')', h: ':' });
EDGE_ART.forestFringe = recolorRows(EDGE_ART.grassFringe, { g: ']', G: '[', h: '^' });
// (18. aşama) Yol köşeleri (otomatik kenarlık / autotile): hepsi sol üst köşe için çizilir, döndürülerek diğerleri elde
// edilir. Dış köşe: yolun iki yanı da zeminse köşe yuvarlanır (viraj). İç köşe: iki yanı yol ama çaprazı zeminse
// köşeye küçük bir çimen tutamı taşar (kavşak ve L dönüşleri doğal görünür).
const CORNER_ART = {
  grassCornerOuter: [
    'ggggghG.........',
    'gggGgG..........',
    'ggGgG...........',
    'gGgG............',
    'hgG.............',
    'gG..............',
    'G...............',
    ...emptyRows(9, 16),
  ],
  grassCornerInner: [
    'gGG.............',
    'GG..............',
    'G...............',
    ...emptyRows(13, 16),
  ],
};
for (const [ground, colors] of [['meadow', { g: '=', G: '!', h: '~' }], ['rocky', { g: '(', G: ')', h: ':' }], ['forest', { g: ']', G: '[', h: '^' }]]) {
  CORNER_ART[`${ground}CornerOuter`] = recolorRows(CORNER_ART.grassCornerOuter, colors);
  CORNER_ART[`${ground}CornerInner`] = recolorRows(CORNER_ART.grassCornerInner, colors);
}

// (18. aşama) Yağmurda çamurlanan toprak patikanın su birikintileri (iki desen, karonun konumuna göre seçilir)
const MUD_ART = [
  [
    ...emptyRows(3, 16),
    '....DDDD........',
    '...DDccDD.......',
    '....DDDD........',
    '..........DD....',
    '.........DcbD...',
    '..........DD....',
    ...emptyRows(1, 16),
    '..DD............',
    '.DbcD...........',
    '..DD.....DDD....',
    '........DDDDD...',
    ...emptyRows(2, 16),
  ],
  [
    ...emptyRows(1, 16),
    '.........DDD....',
    '........DbcbD...',
    '.........DDD....',
    ...emptyRows(3, 16),
    '...DDDDD........',
    '..DDcbbDD.......',
    '...DDDDD........',
    ...emptyRows(2, 16),
    '..........DD....',
    '.........DccD...',
    '..........DD....',
    ...emptyRows(1, 16),
  ],
];

const ANIMATED_EDGES = { waterFoam: 2 }; // kenar adı -> kare sayısı (2 kare = aynalı)
// Mevsimle boyanan (zeminden taşan) kenarlar; köpük boyanmaz
const GROUND_EDGES = new Set(['grassFringe', 'meadowFringe', 'rockyFringe', 'forestFringe']);

// ---------------------------------------------------------------------------
// Doğal nesneler. Karonun alt kenarına hizalanır; 16'dan uzun olanlar
// üstteki karoya taşar (ör. ağaç tepeleri).
// ---------------------------------------------------------------------------
const OAK = [
  '.....FFFFFF.....',
  '...FFvvvvvvFF...',
  '..FvvVVVvvvvfF..',
  '.FvVVHVVvvvvffF.',
  '.FvVHVVvvvvvffF.',
  'FvvVVVvvvvvvfffF',
  'FvvvVvvvvVvvfffF',
  'FfvvvvvvVVVvfffF',
  'FfvvvvvvvVvvfffF',
  'FffvvvvvvvvffffF',
  '.FfffvvvvvffffF.',
  '.FFffffvfffffFF.',
  '..FFfffffffFFF..',
  '...FFFFxwFFFF...',
  '......xwwX......',
  '......xwwX......',
  '......xwwX......',
  '.....xxwwXx.....',
  '....kxxwwxxk....',
  '...kkkkkkkkkk...',
  '....kkkkkkkk....',
  ...emptyRows(3, 16),
];

const PINE = [
  '.......FF.......',
  '......FLJF......',
  '.....FLJJfF.....',
  '....FLLJJffF....',
  '.....FFJfFF.....',
  '....FLLJJffF....',
  '...FLLJJJJffF...',
  '..FLLJJJJJfffF..',
  '...FFJJJJffFF...',
  '..FLLJJJJJJffF..',
  '.FLLJJJJJJJfffF.',
  'FLLJJJJJJJJffffF',
  'FFFffffffffffFFF',
  '...FFFFFFFFFF...',
  '.......xw.......',
  '.......xw.......',
  '.......xw.......',
  '.....kkxwkk.....',
  '....kkkkkkkk....',
  '.....kkkkkk.....',
  ...emptyRows(4, 16),
];

const ROCK = [
  ...emptyRows(3, 16),
  '......QQQQ......',
  '....QQqqqrQQ....',
  '...QqqqqqrrrQ...',
  '..QqqqqqrrrrRQ..',
  '..QqqvvrrrrRRQ..',
  '.QrqvvrrrrrRRRQ.',
  '.QrrrrrrrRRRRRQ.',
  '.QRrrrrRRRRRRRQ.',
  '.QRRRRRRRRRRRQQ.',
  '..QQQQQQQQQQQQ..',
  '...kkkkkkkkkk...',
  ...emptyRows(2, 16),
];

const PEBBLES = [
  ...emptyRows(7, 16),
  '..........QQQ...',
  '...QQQ...QqrRQ..',
  '..QqqrQ..QrRRQ..',
  '..QqrRRQ..QQQk..',
  '..QRRRQk........',
  '...QQQkk........',
  '....kk..........',
  ...emptyRows(2, 16),
];

// Kesilmiş ağaç kütüğü: halkalı üst yüz, kabuk, kökler
const STUMP = [
  ...emptyRows(8, 16),
  '.....KKKKKK.....',
  '....KEEXXEEK....',
  '....KEXwwXEK....',
  '....KXEEEEXK....',
  '....KwxwwxwK....',
  '...KwwxwwxwwK...',
  '..KKwKKKKKKwKK..',
  '...kkkkkkkkkk...',
];

// Kütükten çıkan, zamanla ağaca dönüşen fidan
const SAPLING = [
  ...emptyRows(6, 16),
  '.......FF.......',
  '......FVvF......',
  '.....FVvvfF.....',
  '......FvfF......',
  '.....FvVvfF.....',
  '.......xw.......',
  '.......xw.......',
  '......kxwk......',
  '.....kkkkkk.....',
  '................',
];

// ---------------------------------------------------------------------------
// Taş yol (arnavut kaldırımı): kaydırmalı sıralarda yuvarlak taşlar, aralarında harç
// ---------------------------------------------------------------------------
function buildCobble() {
  const rows = Array.from({ length: 16 }, () => Array(16).fill('M'));
  for (let band = 0; band < 4; band++) {
    const y0 = band * 4;
    const offset = band % 2 === 0 ? 0 : 2;
    for (let x0 = -2 + offset; x0 < 16; x0 += 4) {
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const x = x0 + dx;
          const y = y0 + dy;
          if (x < 0 || x > 15) continue;
          let c = 'r';
          if (dy === 0 && dx < 2) c = 'q';
          else if (dy === 2 || dx === 2) c = 'R';
          if ((x0 * 7 + band * 3) % 5 === 0 && c === 'r') c = 'q'; // bazı taşlar daha açık
          rows[y][x] = c;
        }
      }
    }
  }
  return rows.map((r) => r.join(''));
}
const COBBLE = buildCobble();

const OBJECT_ART = { oak: OAK, pine: PINE, rock: ROCK, pebbles: PEBBLES, stump: STUMP, sapling: SAPLING };

// ---------------------------------------------------------------------------
// Dışa açık API
// ---------------------------------------------------------------------------
const TILE_ART = {
  grass: [GRASS_BASE, GRASS_FLOWERS, GRASS_PEBBLES],
  path: [PATH_BASE],
  sand: [SAND_BASE, SAND_PEBBLES],
  plaza: [PLAZA],
  cobble: [COBBLE],
  meadow: [MEADOW_BASE, MEADOW_FLOWERS],
  rocky: [ROCKY_BASE, ROCKY_STONES],
  forest: [FOREST_BASE, FOREST_LITTER],
  bridge: [buildBridge(true, false), buildBridge(false, true), buildBridge(true, true), buildBridge(false, false)],
};

// Kışın sade varyasyona dönen (çiçekli, mantarlı) karolar
const WINTER_PLAIN_VARIANT = { grass: { 1: 0 }, meadow: { 1: 0 }, forest: { 1: 0 } };

const tileSpriteCache = new Map();

function cachedTile(name, variant, frame, factory, season = 'summer') {
  const key = `${name}:${variant}:${frame}:${season}`;
  let sprite = tileSpriteCache.get(key);
  if (!sprite) {
    sprite = getSprite(`tile:${key}`, factory);
    tileSpriteCache.set(key, sprite);
  }
  return sprite;
}

/**
 * Bir zemin karosunun görselini döndürür. time (saniye) animasyonlu karolar içindir; season çimenli
 * karoları mevsimin tonuna boyar (kışın çiçekli çimen sade karlı çimene döner).
 */
export function getTileSprite(name, variant = 0, time = 0, season = 'summer') {
  if (name === 'water') {
    const frame = Math.floor(time * CONFIG.WATER_ANIMATION_FPS) % WATER_FRAME_COUNT;
    return cachedTile('water', 0, frame, () => shiftRowsVertical(WATER_BASE, frame * WATER_FRAME_SHIFT));
  }
  const variants = TILE_ART[name];
  if (!variants) throw new Error(`Karo görseli yok: ${name}`);
  let v = variant < variants.length ? variant : 0;
  if (season === 'winter' && WINTER_PLAIN_VARIANT[name]?.[v] !== undefined) v = WINTER_PLAIN_VARIANT[name][v]; // çiçekler karın altında
  return cachedTile(name, v, 0, () => seasonalGroundRows(variants[v], season, { plainGrass: name === 'grass' && v === 0 }), season);
}

/** Kenar geçişi görseli. dir: 0 üst, 1 sağ, 2 alt, 3 sol. */
export function getEdgeSprite(kind, dir, time = 0, season = 'summer') {
  const frames = ANIMATED_EDGES[kind] ?? 1;
  const frame = frames > 1 ? Math.floor(time * 2) % frames : 0;
  const tinted = GROUND_EDGES.has(kind) ? season : 'summer';
  return getSprite(`edge:${kind}:${dir}:${frame}:${tinted}`, () => {
    const base = frame === 1 ? flipRowsHorizontal(EDGE_ART[kind]) : EDGE_ART[kind];
    return rotateRows(seasonalGroundRows(base, tinted), dir);
  });
}

/** (18. aşama) Yol köşesi görseli. kind: '<zemin>CornerOuter' | '<zemin>CornerInner'; corner: 0 sol üst, 1 sağ üst, 2 sağ alt, 3 sol alt. */
export function getCornerSprite(kind, corner, season = 'summer') {
  return getSprite(`corner:${kind}:${corner}:${season}`, () => rotateRows(seasonalGroundRows(CORNER_ART[kind], season), corner));
}

/** (18. aşama) Yağmurda çamurlu patikanın birikintileri (variant 0/1). */
export function getMudSprite(variant = 0) {
  return getSprite(`mud:${variant % MUD_ART.length}`, () => MUD_ART[variant % MUD_ART.length]);
}

// Mevsimde görünümü değişen nesneler: ağaçlar ve fidan yaprak döker / karlanır; kaya ve kütük karlanır
const OBJECT_FOLIAGE = { oak: 'oak', sapling: 'oak', pine: 'pine' };

/**
 * Doğal nesne görseli (ağaç, kaya...). variant yalnızca sonbaharda meşenin tonunu seçer
 * (turuncu / kızıl / altın), harita konumundan türetilir.
 */
export function getObjectSprite(name, season = 'summer', variant = 0) {
  const rows = OBJECT_ART[name];
  if (!rows) throw new Error(`Nesne görseli yok: ${name}`);
  const foliage = OBJECT_FOLIAGE[name];
  const v = season === 'autumn' && foliage === 'oak' ? variant : 0;
  return getSprite(`object:${name}:${season}:${v}`, () => {
    if (foliage) return seasonalFoliageRows(rows, season, foliage, v);
    return season === 'winter' ? snowCapRows(rows) : rows;
  });
}
