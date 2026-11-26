// Mevsimlik görünüm dönüşümleri (oyun kuralı yok, yalnızca çizim):
//   - Satır düzeyinde: çimen ve yaprak harflerini mevsimin tonlarına boyamak (recolor), ilkbaharda
//     çiçek damgalamak, kışın üst kenara kar basmak (snowCapRows)
//   - Tuval düzeyinde: herhangi bir yapı görselini kışlık yapmak (winterize): kiremitler karla örtülür,
//     her sütunun en üstüne iki piksellik kar yığılır. Böylece her yapı için ayrı kış çizimi gerekmez.
import { recolorRows, composeRows } from './PixelSprite.js';
import { PALETTE } from './palette.js';
import { mod } from '../utils/math.js';

// Çimen harfleri: G gölge, g çimen, h ışık, H parlak uç. Biyom zeminleri de aynı tablodan boyanır:
// bereketli toprak (! = ~), kayalık (boz ) ( :) ve orman zemini (yosun [ ], döküntü ^)
const GROUND_RECOLOR = {
  spring: {},
  summer: {},
  autumn: { G: '%', g: '&', h: '*', H: '+', '!': '%', '=': '&', '~': '*', '[': '%', ']': '&', '^': '3' },
  winter: { G: '5', g: '6', h: '7', H: '8', '!': '5', '=': '6', '~': '7', '[': '5', ']': '6', '^': '5', ')': '5', '(': '6', ':': '7' },
};

// Meşe yaprakları: F kontur, f gölge, v yaprak, V ışık, H parlak uç. Sonbaharda üç ton karışır.
const AUTUMN_FOLIAGE = [
  { F: '1', f: '2', v: '3', V: '4', H: '9' }, // turuncu
  { F: '1', f: '1', v: '2', V: '3', H: '4' }, // kızıl
  { F: '1', f: '3', v: '4', V: '9', H: '9' }, // altın
];
const WINTER_FOLIAGE = { v: '6', V: '7', H: '8' }; // karla kaplı tepe, altta yeşil gölge kalır
const WINTER_PINE = { L: '7', J: 'J', f: '5' };

// İlkbahar: çimende ve meşede pembe-beyaz bahar çiçekleri
const SPRING_GRASS_BLOSSOMS = [
  [['p'], 5, 3],
  [['u'], 12, 6],
  [['p'], 2, 10],
  [['u'], 9, 13],
];
const SPRING_TREE_BLOSSOMS = [
  [['p'], 5, 2],
  [['u'], 9, 3],
  [['p'], 3, 6],
  [['p'], 11, 5],
  [['u'], 6, 8],
  [['p'], 12, 9],
  [['u'], 8, 11],
  [['p'], 4, 10],
];

export const AUTUMN_FOLIAGE_VARIANTS = AUTUMN_FOLIAGE.length;

/** Çimen ve çimenli zemin karoları için mevsim boyası. */
export function seasonalGroundRows(rows, season, { plainGrass = false } = {}) {
  let out = recolorRows(rows, GROUND_RECOLOR[season] ?? {});
  if (season === 'spring' && plainGrass) out = composeRows(out, SPRING_GRASS_BLOSSOMS);
  return out;
}

/**
 * Ağaç ve çalı görselleri: sonbaharda turuncu / kızıl / altın (variant), kışın karlı tepe,
 * ilkbaharda çiçekli. kind: 'oak' (yapraklı) | 'pine' (iğne yapraklı, sonbaharda yeşil kalır)
 */
export function seasonalFoliageRows(rows, season, kind = 'oak', variant = 0) {
  if (season === 'autumn' && kind === 'oak') return recolorRows(rows, AUTUMN_FOLIAGE[mod(variant, AUTUMN_FOLIAGE.length)]);
  if (season === 'winter') return snowCapRows(recolorRows(rows, kind === 'pine' ? WINTER_PINE : WINTER_FOLIAGE));
  if (season === 'spring' && kind === 'oak') return stampOnLeaves(rows, SPRING_TREE_BLOSSOMS);
  return rows;
}

/** Çiçekleri yalnızca yaprak pikselinin üstüne basar (küçük fidanda boşluğa taşmasın). */
function stampOnLeaves(rows, stamps) {
  const grid = rows.map((row) => [...row]);
  for (const [[c], x, y] of stamps) {
    if (grid[y] && 'fvVH'.includes(grid[y][x])) grid[y][x] = c;
  }
  return grid.map((row) => row.join(''));
}

/**
 * Her sütunun en üstteki dolu pikselinin (kontur atlanarak) altına `depth` piksel kar basar.
 * Gölge ('k') ve şeffaf pikseller atlanır.
 */
export function snowCapRows(rows, depth = 2) {
  const grid = rows.map((row) => [...row]);
  const width = grid[0].length;
  for (let x = 0; x < width; x++) {
    let painted = 0;
    for (let y = 0; y < grid.length && painted < depth; y++) {
      const c = grid[y][x];
      if (c === '.' || c === 'k') continue;
      if (c === 'K' || c === 'F' || c === 'Q') {
        if (painted > 0) break;
        continue;
      }
      grid[y][x] = painted === 0 ? '8' : '6';
      painted++;
    }
  }
  return grid.map((row) => row.join(''));
}

// ---------------------------------------------------------------------------
// Tuval düzeyinde kış dönüşümü (yapılar için)
// ---------------------------------------------------------------------------
const winterCache = new WeakMap();
// Çatı tanımının önbellek anahtarı: her karede JSON.stringify çöp üretmesin diye tanım nesnesine bağlı saklanır
const roofKeys = new WeakMap();
const roofKey = (roof) => {
  let key = roofKeys.get(roof);
  if (key === undefined) {
    key = JSON.stringify(roof);
    roofKeys.set(roof, key);
  }
  return key;
};

const hex = (color) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
const OUTLINE = hex(PALETTE.K);
const SNOW = { light: hex(PALETTE[8]), main: hex(PALETTE[7]), dark: hex(PALETTE[5]) };
const SNOW_TOP = hex(PALETTE[8]);
const SNOW_SIDE = hex(PALETTE[6]);

/**
 * Bir yapı görselinin kışlık kopyası (önbellekli). Tuval desteklenmiyorsa olduğu gibi döner.
 * @param {HTMLCanvasElement} canvas
 * @param {{ light?: string[], main?: string[], dark?: string[], maxRow?: number }|null} roof
 *   çatı renkleri (palet harfleri) ve çatının bittiği satır: bu renkler karla örtülür
 */
export function winterize(canvas, roof = null) {
  let perCanvas = winterCache.get(canvas);
  const key = roof ? roofKey(roof) : '-';
  if (perCanvas?.has(key)) return perCanvas.get(key);
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  if (!ctx?.getImageData) return canvas;
  ctx.drawImage(canvas, 0, 0);
  const image = ctx.getImageData(0, 0, out.width, out.height);
  const d = image.data;
  const same = (i, [r, g, b]) => d[i] === r && d[i + 1] === g && d[i + 2] === b;
  const set = (i, [r, g, b]) => {
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  };

  // Çatı: belirtilen renkler (yalnızca çatı satırlarında) karın tonlarına döner
  if (roof) {
    const pairs = ['light', 'main', 'dark'].flatMap((tone) => (roof[tone] ?? []).map((letter) => [hex(PALETTE[letter]), SNOW[tone]]));
    const rows = Math.min(out.height, roof.maxRow ?? out.height);
    for (let i = 0; i < rows * out.width * 4; i += 4) {
      if (d[i + 3] < 255) continue;
      for (const [from, to] of pairs) {
        if (same(i, from)) {
          set(i, to);
          break;
        }
      }
    }
  }
  // Her sütunun tepesine kar
  for (let x = 0; x < out.width; x++) {
    let painted = 0;
    for (let y = 0; y < out.height && painted < 2; y++) {
      const i = (y * out.width + x) * 4;
      if (d[i + 3] < 200) continue; // şeffaf ve yarı saydam gölge
      if (same(i, OUTLINE)) {
        if (painted > 0) break;
        continue;
      }
      set(i, painted === 0 ? SNOW_TOP : SNOW_SIDE);
      painted++;
    }
  }
  ctx.putImageData(image, 0, 0);
  if (!perCanvas) {
    perCanvas = new Map();
    winterCache.set(canvas, perCanvas);
  }
  perCanvas.set(key, out);
  return out;
}
