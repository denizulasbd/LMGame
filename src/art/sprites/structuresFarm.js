// 10. aşama: Koyun Ağılı (3x3, görsel 48x54) ve koyunlar.
//   - ağıl iki katmanda çizilir: 'back' (otlak, arka ve yan çitler, sol üstte samanlı ahır, sağda su
//     yalağı, saman balyası) ve 'front' (ön çit ve kapı). Oyunda koyunlar bu iki katmanın arasında
//     derinlik sırasıyla çizilir: ön çitin arkasında kalan koyunun bacakları çitin ardında görünür.
//   - inşa menüsü, yapı paneli ve önizleme için 'full' görsel: iki katman + dört duran koyun
//   - koyunlar (12x9, kuzu 9x7): ayakta, yürüme (iki kare), otlama (baş eğik, iki kare çiğneme), uyku
// Görsel yapının kapladığı karoların ALT kenarına hizalanır; ahırın çatısı üstteki karoya 6 piksel taşar.
import { getSprite, CharGrid, flipRowsHorizontal } from '../PixelSprite.js';
import { seasonalGroundRows, winterize } from '../seasons.js';

// Ahırın kışın karla örtülen çatı renkleri (her karede yeni nesne üretilmesin diye sabit)
const FARM_WINTER_ROOF = { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 10 };

// Küçük deterministik "rastgelelik": her ağılın çim tutamları aynı yerde kalsın
function hash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Ağılın ölçüleri. pen: koyunların ayak noktalarının dolaşabileceği alan; beds: geceleri ahırın önünde
// yattıkları yerler (hepsi yapının sol üst köşesine göre, karo ayak izi koordinatında piksel)
export const SHEEP_FARM_ART = {
  width: 48,
  height: 54,
  top: 6, // görselin ayak izinin üstüne taşan kısmı (ahır çatısı)
  pen: { left: 7, right: 40, top: 19, bottom: 40 },
  beds: [
    { x: 7, y: 19 },
    { x: 19, y: 19 },
    { x: 13, y: 24 },
    { x: 26, y: 23 },
    { x: 6, y: 27 },
  ],
  trough: { x0: 30, x1: 44, y0: 9, y1: 16 }, // koyunlar bu alana girmez
};

const W = SHEEP_FARM_ART.width;
const H = SHEEP_FARM_ART.height;
const OY = SHEEP_FARM_ART.top;

/** Çit direği: koyu gövde, açık başlık. */
function post(g, x, y0, y1) {
  g.vline(x, y0, y1, 'x');
  g.set(x, y0, 'E');
  g.set(x, y0 + 1, 'X');
}

function buildBackRows() {
  const g = new CharGrid(W, H);
  // Otlak: çim, koyu lekeler, açık tutamlar; kapıdan ortaya uzanan çiğnenmiş patika
  g.rect(1, OY + 3, W - 2, H - OY - 4, 'g');
  for (let y = OY + 3; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const h = hash(x, y, 7);
      if (h > 0.92) g.set(x, y, 'h');
      else if (h > 0.86) g.set(x, y, 'G');
      else if (h > 0.84) g.set(x, y, 'H');
    }
  }
  for (let y = OY + 22; y < H - 1; y++) {
    const half = 2 + Math.round((y - (OY + 22)) / 6);
    for (let x = 24 - half; x <= 23 + half; x++) g.set(x, y, hash(x, y, 9) > 0.7 ? 'e' : 'd');
  }
  // Ortadaki çamurlu yemlik izleri ve birkaç kır çiçeği
  [[12, 36], [31, 34], [37, 43], [8, 44]].forEach(([x, y]) => g.set(x, y, 'u').set(x + 1, y - 1, 'P'));

  // Arka çit (iki kuşak) ve yan çitler
  g.hline(0, W - 1, OY + 1, 'X').hline(0, W - 1, OY + 3, 'X');
  for (let x = 0; x < W; x += 6) post(g, x, OY - 1, OY + 4);
  post(g, W - 1, OY - 1, OY + 4);
  for (const x of [0, W - 1]) {
    g.vline(x, OY, H - 7, 'X');
    for (let y = OY + 5; y < H - 6; y += 6) {
      g.set(x, y, 'E');
      g.set(x, y + 1, 'x');
    }
  }

  // Ahır (sol üst): tahta arka duvar, tek eğimli kiremit çatı, içi saman dolu
  g.rect(2, 4, 19, 17, 'K');
  g.rect(3, 9, 17, 11, 'x');
  for (let y = 10; y < 20; y += 3) g.hline(3, 19, y, 'w');
  // İçerideki saman yığını (alçak, tutam tutam) ve duvara dayalı yaba
  for (let x = 4; x <= 18; x++) {
    const top = 17 + Math.round(Math.sin(x * 0.9) + Math.sin(x * 2.3) * 0.6);
    for (let y = top; y <= 19; y++) g.set(x, y, y === top ? 'y' : hash(x, y, 3) > 0.55 ? 'Y' : 'P');
    if (hash(x, 0, 4) > 0.6) g.set(x, top - 1, 'P');
  }
  g.line(15, 10, 17, 16, 'X');
  g.set(14, 10, 'q').set(15, 9, 'q').set(16, 9, 'q');
  // Direkler
  for (const x of [2, 19]) {
    g.vline(x, 8, 20, 'K');
    g.vline(x + 1, 8, 20, 'X');
  }
  // Çatı: önden arkaya inen kiremit sıraları, saçak
  for (let y = 0; y <= 8; y++) {
    const x0 = Math.max(0, 3 - Math.floor(y / 3));
    for (let x = x0; x <= 22 - x0; x++) g.set(x, y, y % 3 === 2 ? 'U' : (x + y) % 5 === 0 ? 'Z' : 'C');
    g.set(x0, y, 'K').set(22 - x0, y, 'K');
  }
  g.hline(3, 19, 0, 'K');
  g.hline(0, 22, 9, 'K');
  g.hline(1, 21, 8, 'U');

  // Su yalağı (sağ üst): ahşap tekne, içinde su
  g.rect(31, OY + 9, 13, 6, 'K');
  g.rect(32, OY + 10, 11, 4, 'w');
  g.hline(32, 42, OY + 10, 'X');
  g.rect(33, OY + 10, 9, 2, 'b');
  g.hline(34, 37, OY + 10, 'c');
  g.set(39, OY + 11, 'a');
  g.vline(32, OY + 15, OY + 16, 'x').vline(42, OY + 15, OY + 16, 'x');

  // Saman balyası (sağda, yalağın altında)
  g.rect(37, OY + 20, 8, 6, 'K');
  g.rect(38, OY + 21, 6, 4, 'P');
  g.hline(38, 43, OY + 21, 'y');
  g.vline(40, OY + 21, OY + 24, 'X').vline(42, OY + 21, OY + 24, 'X');
  g.set(39, OY + 23, 'Y').set(43, OY + 24, 'Y');
  return g.toRows();
}

function buildFrontRows() {
  const g = new CharGrid(W, H);
  const y0 = H - 9;
  // Ön çit: iki kuşak, direkler; ortada iki kanatlı kapı (çapraz destekli)
  g.hline(0, W - 1, y0 + 2, 'X').hline(0, W - 1, y0 + 5, 'X');
  g.hline(0, W - 1, y0 + 3, 'x');
  for (let x = 0; x < W; x += 6) post(g, x, y0, y0 + 7);
  post(g, W - 1, y0, y0 + 7);
  // Kapı: iki kanat, açık renk çerçeve, çapraz kuşak ve demir mandal
  g.rect(19, y0 + 1, 10, 6, 'K');
  g.rect(20, y0 + 2, 8, 4, 'E');
  g.vline(24, y0 + 1, y0 + 6, 'K');
  g.line(20, y0 + 5, 23, y0 + 2, 'X');
  g.line(25, y0 + 2, 27, y0 + 5, 'X');
  g.set(23, y0 + 3, 'R').set(25, y0 + 3, 'R');
  post(g, 18, y0 - 1, y0 + 7);
  post(g, 29, y0 - 1, y0 + 7);
  // Çitin dibine düşen gölge
  for (let x = 1; x < W - 1; x++) if (g.get(x, H - 1) === '.') g.set(x, H - 1, 'k');
  return g.toRows();
}

/** Mevsime göre çim (sonbaharda kehribar, kışın kar). */
function seasonal(rows, season) {
  return season === 'spring' || season === 'summer' ? rows : seasonalGroundRows(rows, season);
}

/**
 * Ağılın katmanları: 'back' (otlak, ahır, yalak, arka ve yan çit) ya da 'front' (ön çit ve kapı).
 * Kışın çim karla örtülür, çatı ve çit tepeleri karlanır.
 */
export function getSheepFarmLayer(layer, season = 'summer') {
  const key = `building:sheepFarm:${layer}:${season}`;
  const sprite = getSprite(key, () => seasonal(layer === 'front' ? buildFrontRows() : buildBackRows(), season));
  if (season !== 'winter') return sprite;
  return winterize(sprite, layer === 'back' ? FARM_WINTER_ROOF : null);
}

// ---------------------------------------------------------------------------
// Koyunlar (sağa bakar; sola bakınca aynalanır). Ayak noktası en alt satırın ortasıdır.
// ---------------------------------------------------------------------------
const SHEEP = {
  stand: [
    '..KK.KK.....',
    '.KuuKuuKKKK.',
    'KuuuuuuuKQQK',
    'KuuuuuuuKQqK',
    'K6uuuuuuuKQK',
    '.K66uuu66KK.',
    '..KKKKKKKK..',
    '..Q.Q..Q.Q..',
    '.kQkQkkQkQk.',
  ],
  walk0: [
    '..KK.KK.....',
    '.KuuKuuKKKK.',
    'KuuuuuuuKQQK',
    'KuuuuuuuKQqK',
    'K6uuuuuuuKQK',
    '.K66uuu66KK.',
    '..KKKKKKKK..',
    '..Q.Q..Q.Q..',
    '.kQkQkkQkQk.',
  ],
  walk1: [
    '..KK.KK.....',
    '.KuuKuuKKKK.',
    'KuuuuuuuKQQK',
    'KuuuuuuuKQqK',
    'K6uuuuuuuKQK',
    '.K66uuu66KK.',
    '..KKKKKKKK..',
    '...QQ...QQ..',
    '.kkQkQkkQkQk',
  ],
  graze0: [
    '..KK.KK.....',
    '.KuuKuuK....',
    'KuuuuuuuK...',
    'KuuuuuuuuKK.',
    'K6uuuuuuKQQK',
    '.K66uuu6KQqK',
    '..KKKKKKKQQK',
    '..Q.Q..Q.KK.',
    '.kQkQkkQkk..',
  ],
  graze1: [
    '..KK.KK.....',
    '.KuuKuuK....',
    'KuuuuuuuK...',
    'KuuuuuuuuKK.',
    'K6uuuuuuKQQK',
    '.K66uuu6KQQK',
    '..KKKKKKKQqK',
    '..Q.Q..Q.KKK',
    '.kQkQkkQkk..',
  ],
  sleep: [
    '............',
    '............',
    '............',
    '..KK.KK.....',
    '.KuuKuuKKKK.',
    'KuuuuuuuKQQK',
    'K6uuuuuuKQQK',
    'K666uu666KK.',
    '.KKKKKKKKKk.',
  ],
};
// Yürürken ilk kare bacakları açık, ikinci kare çapraz
SHEEP.walk0 = SHEEP.stand;

const LAMB = {
  stand: [
    '.KK.K....',
    'KuuKuKKK.',
    'KuuuuKQQK',
    'K6uuuKqQK',
    '.K666KKK.',
    '..Q.Q.Q..',
    '.kQkQkQk.',
  ],
  walk1: [
    '.KK.K....',
    'KuuKuKKK.',
    'KuuuuKQQK',
    'K6uuuKqQK',
    '.K666KKK.',
    '..QQ..QQ.',
    '.kQkkkQk.',
  ],
  graze0: [
    '.KK.K....',
    'KuuKuK...',
    'KuuuuuKK.',
    'K6uuuKQQK',
    '.K666KqQK',
    '..Q.QKKK.',
    '.kQkQk...',
  ],
  sleep: [
    '.........',
    '.........',
    '.KK.K....',
    'KuuKuKKK.',
    'KuuuuKQQK',
    'K666KKKK.',
    '.KKKKKk..',
  ],
};
LAMB.walk0 = LAMB.stand;
LAMB.graze1 = LAMB.graze0;

/**
 * Koyun ya da kuzu görseli. pose: stand | walk0 | walk1 | graze0 | graze1 | sleep
 * @param {'left'|'right'} facing
 */
export function getSheepSprite(pose, facing = 'right', lamb = false) {
  const table = lamb ? LAMB : SHEEP;
  const rows = table[pose] ?? table.stand;
  return getSprite(`sheep:${lamb ? 'lamb' : 'adult'}:${pose}:${facing}`, () => (facing === 'left' ? flipRowsHorizontal(rows) : rows));
}

// Menü, panel ve önizleme için duran koyunlar (ayak noktası, poz, yön)
const STATIC_FLOCK = [
  { x: 14, y: 26, pose: 'graze0', facing: 'right' },
  { x: 30, y: 24, pose: 'stand', facing: 'left' },
  { x: 22, y: 34, pose: 'graze1', facing: 'left' },
  { x: 35, y: 37, pose: 'stand', facing: 'right' },
  { x: 9, y: 36, pose: 'stand', facing: 'right', lamb: true },
];

/** Tam ağıl görseli (iki katman + duran koyunlar): inşa menüsü, yapı paneli ve önizleme. */
export function getSheepFarmSprite(season = 'summer') {
  const key = `building:sheepFarm:full:${season}`;
  const sprite = getSprite(key, () => {
    const g = new CharGrid(W, H);
    g.stamp(buildBackRows(), 0, 0);
    for (const s of STATIC_FLOCK) {
      // Yarı saydam gölge tek görselde çimenin yerine geçmesin: koyu çim tonuyla çizilir
      const rows = (s.lamb ? LAMB : SHEEP)[s.pose].map((r) => r.replaceAll('k', 'G'));
      const flipped = s.facing === 'left' ? flipRowsHorizontal(rows) : rows;
      const w = rows[0].length;
      g.stamp(flipped, Math.round(s.x - w / 2), OY + s.y - rows.length + 1);
    }
    g.stamp(buildFrontRows(), 0, 0);
    return seasonal(g.toRows(), season);
  });
  return season === 'winter' ? winterize(sprite, FARM_WINTER_ROOF) : sprite;
}
