// (34.1) Genişleyen harita: çekirdek haritayı (bugünkü üretim, hiç değişmeden) çevresindeki parsel halkalarıyla birlikte
// tek bir dünya haritasına yerleştirir ve halkaların içeriğini üretir.
//
// İçerik yalnızca harita tohumundan ve DÜNYA KOORDİNATINDAN gelir (konuma bağlı gürültü + karo karması): hangi parselin
// önce açıldığı, kaç parsel olduğu içeriği değiştirmez. Çekirdeğe yakın karolar en yakın çekirdek kenarının biyomunu devralır;
// nehir çekirdeğin üst ve alt satırındaki su aralığından aynı genişlikte sürer; ana yollar dış dünyaya devam eder.
// Halkalar kilitli başlar (map.open = 0); açmak openParcel'in işidir.
import { TileMap } from './TileMap.js';
import { assignBridgeVariants } from './WorldGenerator.js';
import { layoutParcels, parcelSeed } from './Parcels.js';
import { Noise2D } from '../utils/noise.js';
import { Random } from '../utils/random.js';
import { isGround } from '../data/tiles.js';
import { EXPANSION as EX } from '../data/parcels.js';

const GRASS = { PLAIN: 0, FLOWERS: 1, PEBBLES: 2 };
const ROADS = new Set(['path', 'bridge', 'plaza']);
const BIOMES = new Set(['grass', 'meadow', 'rocky', 'forest']);
const OFF = 1000; // gürültü örneklemesinde eksi koordinatlardan kaçınmak için

/** Karo başına durumsuz rastgele sayı [0, 1): tohum, konum ve tuz karması. */
function hash01(seed, x, y, salt) {
  let h = (seed ^ Math.imul(x + 0x9e37, 0x85ebca6b) ^ Math.imul(y + 0x7f4a, 0xc2b2ae35) ^ Math.imul(salt + 1, 0x27d4eb2f)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * @param {TileMap} core generateTown'un ürettiği çekirdek harita (0,0'dan başlar)
 * @param {number} seed harita tohumu (state.seed)
 * @returns {{ map: TileMap, parcels: object[], core: { x0, y0, x1, y1 } }}
 */
export function expandWorld(core, seed) {
  const { parcels, bounds } = layoutParcels(core.width, core.height, seed);
  const map = new TileMap(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0, 'grass', { x0: bounds.x0, y0: bounds.y0 });
  // Çekirdek olduğu gibi kopyalanır (zemin, varyasyon, nesne, yapı doluluğu)
  for (let y = 0; y < core.height; y++) {
    const from = core.index(0, y);
    const to = map.index(0, y);
    for (const layer of ['tiles', 'variants', 'objects', 'occupants', 'passable']) map[layer].set(core[layer].subarray(from, from + core.width), to);
  }
  const coreRect = { x0: 0, y0: 0, x1: core.width, y1: core.height };
  if (parcels.length) generateRings(map, core, coreRect, (seed >>> 0) ^ parcelSeed(seed, 1));
  // Halkalar kilitli başlar
  map.open.fill(0);
  map.setOpenRect(0, 0, core.width, core.height, true);
  return { map, parcels, core: coreRect };
}

/**
 * (34.2) Kayıttaki açık parsel kimliklerini bugünkü bölünmeye uyarlar (saf hesap). Hiçbir karo ve yapı kilitli kalmaz:
 *  - bilinen kimlik olduğu gibi kalır;
 *  - bilinmeyen kimlik 34.1'in ilk bölünmesinden (`r1n0`) gelir: o bölünme yeniden üretilir, dikdörtgenine değen bütün yeni parseller açılır;
 *  - kayıtlı arazi farkı ya da yapı kilitli bir parselde duruyorsa o parsel de açılır (sigorta).
 * @param {string[]} ids kayıttaki kimlikler
 * @param {object[]} parcels bugünkü parseller
 * @param {{ width, height }} coreSize çekirdek boyutu
 * @param {number} seed harita tohumu
 * @param {Array<{x, y}>} points kayıtta saklı konumlar (arazi farkları, yapı karoları)
 */
export function reconcileParcels(ids, parcels, coreSize, seed, points = []) {
  const known = new Set(parcels.map((p) => p.id));
  const open = new Set(ids.filter((id) => known.has(id)));
  const stray = ids.filter((id) => !known.has(id));
  if (stray.length) {
    const old = layoutParcels(coreSize.width, coreSize.height, seed, true).parcels;
    for (const id of stray) {
      const was = old.find((p) => p.id === id);
      if (!was) continue; // tanınmayan kimlik: sessizce atlanır
      for (const p of parcels) if (rectsOverlap(was, p)) open.add(p.id);
    }
  }
  const inCore = (x, y) => x >= 0 && y >= 0 && x < coreSize.width && y < coreSize.height;
  for (const { x, y } of points) {
    if (inCore(x, y)) continue;
    const p = parcels.find((q) => x >= q.x && y >= q.y && x < q.x + q.w && y < q.y + q.h);
    if (p) open.add(p.id);
  }
  return parcels.filter((p) => open.has(p.id)).map((p) => p.id);
}

function rectsOverlap(a, b) {
  return Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) && Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);
}

/** Bir parseli açar (yürünür, inşa edilir). */
export function openParcel(map, parcel) {
  map.setOpenRect(parcel.x, parcel.y, parcel.w, parcel.h, true);
}

function generateRings(map, core, c, seed) {
  const noise = new Noise2D(new Random(seed));
  const inCore = (x, y) => x >= c.x0 && y >= c.y0 && x < c.x1 && y < c.y1;
  const coreDistance = (x, y) => Math.max(x < c.x0 ? c.x0 - x : x >= c.x1 ? x - c.x1 + 1 : 0, y < c.y0 ? c.y0 - y : y >= c.y1 ? y - c.y1 + 1 : 0);
  const outer = [];
  for (let y = map.y0; y < map.y1; y++) for (let x = map.x0; x < map.x1; x++) if (!inCore(x, y)) outer.push(x, y);
  const each = (fn) => {
    for (let i = 0; i < outer.length; i += 2) fn(outer[i], outer[i + 1]);
  };

  // 1. Çimen ve varyasyonları
  each((x, y) => {
    const field = noise.fbm(x * 0.18 + OFF, y * 0.18 + OFF, 2);
    const r = hash01(seed, x, y, 1);
    let variant = GRASS.PLAIN;
    if (field > 0.22 && r < 0.6) variant = GRASS.FLOWERS;
    else if (r < 0.04) variant = GRASS.FLOWERS;
    else if (r < 0.09) variant = GRASS.PEBBLES;
    map.set(x, y, 'grass', variant);
  });

  // 2. Ana yolların devamı (çekirdek kenarındaki yol karolarından dışarı, dümdüz)
  const roadCells = [];
  for (let x = c.x0; x < c.x1; x++) {
    if (ROADS.has(core.get(x, c.y0))) for (let y = c.y0 - 1; y >= map.y0; y--) roadCells.push(x, y);
    if (ROADS.has(core.get(x, c.y1 - 1))) for (let y = c.y1; y < map.y1; y++) roadCells.push(x, y);
  }
  for (let y = c.y0; y < c.y1; y++) {
    if (ROADS.has(core.get(c.x0, y))) for (let x = c.x0 - 1; x >= map.x0; x--) roadCells.push(x, y);
    if (ROADS.has(core.get(c.x1 - 1, y))) for (let x = c.x1; x < map.x1; x++) roadCells.push(x, y);
  }
  const roadSet = new Set();
  for (let i = 0; i < roadCells.length; i += 2) roadSet.add(map.index(roadCells[i], roadCells[i + 1]));
  const nearRoad = (x, y, r) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (map.inBounds(x + dx, y + dy) && roadSet.has(map.index(x + dx, y + dy))) return true;
    return false;
  };

  // 3. Nehrin devamı: çekirdeğin üst / alt satırındaki su aralığı aynı genişlikte, yavaşça kıvrılarak sürer
  const continueRiver = (row, step, salt) => {
    const xs = [];
    for (let x = c.x0; x < c.x1; x++) if (core.get(x, row) === 'water') xs.push(x);
    if (!xs.length) return;
    const c0 = (xs[0] + xs[xs.length - 1] + 1) / 2;
    const hw0 = (xs[xs.length - 1] - xs[0] + 1) / 2;
    const wave = (k) => noise.fbm(k * EX.river.drift + OFF + salt, 7.3 + salt, 2) * EX.river.meander;
    const start = wave(0);
    for (let k = 1, y = row + step; y >= map.y0 && y < map.y1; k++, y += step) {
      const center = c0 + wave(k) - start;
      const hw = Math.max(1.1, Math.min(2.4, hw0 + noise.perlin(k * 0.15 + OFF, 3.7 + salt) * 0.4 * Math.min(1, k / 6)));
      for (let x = Math.floor(center - hw - 1); x <= Math.ceil(center + hw); x++) {
        if (map.inBounds(x, y) && Math.abs(x + 0.5 - center) <= hw) map.set(x, y, 'water');
      }
    }
  };
  continueRiver(c.y0, -1, 11);
  continueRiver(c.y1 - 1, 1, 29);

  // 4. Küçük göller (çekirdekten ve yollardan uzakta)
  each((x, y) => {
    if (coreDistance(x, y) < EX.lake.coreGap || nearRoad(x, y, EX.lake.roadGap)) return;
    if (noise.fbm(x * EX.lake.scale + OFF + 300, y * EX.lake.scale + OFF + 300, 2) > EX.lake.threshold) map.set(x, y, 'water');
  });

  // 5. Kıyı kumu (çekirdek suyunu da görür): ilk sıra her zaman, ikinci sıra gürültüye göre
  const waterNear = (x, y, r) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if ((dx || dy) && map.get(x + dx, y + dy) === 'water') return true;
    return false;
  };
  const sand = [];
  each((x, y) => {
    if (map.get(x, y) === 'water') return;
    const wide = noise.perlin(x * 0.3 + OFF + 50, y * 0.3 + OFF + 50) > 0.05;
    if (waterNear(x, y, 1) || (wide && waterNear(x, y, 2))) sand.push(x, y);
  });
  for (let i = 0; i < sand.length; i += 2) map.set(sand[i], sand[i + 1], 'sand', hash01(seed, sand[i], sand[i + 1], 2) < 0.1 ? 1 : 0);

  // 6. Biyomlar: çekirdeğe yakın karolar en yakın çekirdek kenarının biyomunu devralır, uzaklaştıkça kendi gürültüsüne bırakır
  const water = waterSteps(map, EX.meadowRiverReach);
  each((x, y) => {
    if (map.get(x, y) !== 'grass') return;
    const d = coreDistance(x, y);
    const edge = core.get(Math.min(c.x1 - 1, Math.max(c.x0, x)), Math.min(c.y1 - 1, Math.max(c.y0, y)));
    let biome = null;
    const blend = noise.perlin(x * 0.21 + OFF + 700, y * 0.21 + OFF + 700) * 0.5 + 0.5;
    if (BIOMES.has(edge) && blend < 1 - (d - 1) / EX.inheritReach) biome = edge;
    else {
      const rocky = noise.fbm(x * EX.biomeScale + OFF + 610, y * EX.biomeScale + OFF + 610, 3);
      const forest = noise.fbm(x * EX.biomeScale + OFF + 820, y * EX.biomeScale + OFF + 820, 3);
      if (rocky > EX.rocky) biome = 'rocky';
      else if (forest > EX.forest) biome = 'forest';
      else if (water[map.index(x, y)] > 0) biome = 'meadow';
      else biome = 'grass';
    }
    if (biome === 'grass') return;
    const r = hash01(seed, x, y, 3);
    let variant = 0;
    if (biome === 'meadow') variant = noise.fbm(x * 0.2 + OFF + 1150, y * 0.2 + OFF + 1150, 2) > 0.1 || r < 0.08 ? 1 : 0;
    else if (biome === 'rocky') variant = r < 0.3 ? 1 : 0;
    else variant = r < 0.22 ? 1 : 0;
    map.set(x, y, biome, variant);
  });

  // 7. Yollar boyanır (suyun üstü köprü)
  for (let i = 0; i < roadCells.length; i += 2) {
    const [x, y] = [roadCells[i], roadCells[i + 1]];
    map.set(x, y, map.get(x, y) === 'water' ? 'bridge' : 'path');
  }
  assignBridgeVariants(map);

  // 8. Ağaçlar ve kayalar (çekirdekteki biyom kurallarıyla aynı oranlar)
  each((x, y) => {
    const tile = map.get(x, y);
    if (!isGround(tile) || nearRoad(x, y, 1)) return;
    const forestN = noise.fbm(x * 0.11 + OFF + 100, y * 0.11 + OFF + 100, 3);
    const base = (forestN + 0.12) * 1.7;
    const density = tile === 'forest' ? Math.max(base, EX.trees.forestBase + forestN * EX.trees.forestGain) : tile === 'grass' ? base : base * EX.trees.sparse;
    const r = hash01(seed, x, y, 4);
    if (r < density) {
      const conifer = tile === 'rocky' || noise.perlin(x * 0.08 + OFF + 300, y * 0.08 + OFF + 300) > 0.05;
      map.setObject(x, y, conifer ? 'pine' : 'oak');
      return;
    }
    const q = hash01(seed, x, y, 5);
    const cluster = noise.fbm(x * 0.2 + OFF + 500, y * 0.2 + OFF + 500, 2);
    if (tile === 'rocky') {
      if (cluster > EX.rocks.cluster && q < EX.rocks.rockyChance) map.setObject(x, y, hash01(seed, x, y, 6) < 0.65 ? 'rock' : 'pebbles');
      else if (q > 0.94) map.setObject(x, y, 'pebbles');
    } else if (cluster > EX.rocks.scatterAt && q < (tile === 'grass' ? EX.rocks.scatterChance : 0.15)) {
      map.setObject(x, y, hash01(seed, x, y, 6) < 0.55 ? 'rock' : 'pebbles');
    } else if (q > 1 - EX.rocks.pebbleChance) map.setObject(x, y, 'pebbles');
  });
}

/** Su karosuna 4 yönlü adım uzaklığı `reach` içinde olan karolar: 1..reach, değilse 0 (su karosu da 0). */
function waterSteps(map, reach) {
  const dist = new Int16Array(map.width * map.height);
  let frontier = [];
  for (let y = map.y0; y < map.y1; y++) {
    for (let x = map.x0; x < map.x1; x++) {
      if (map.get(x, y) !== 'water') continue;
      dist[map.index(x, y)] = -1;
      frontier.push(x, y);
    }
  }
  for (let step = 1; step <= reach && frontier.length; step++) {
    const next = [];
    for (let i = 0; i < frontier.length; i += 2) {
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const nx = frontier[i] + dx;
        const ny = frontier[i + 1] + dy;
        if (!map.inBounds(nx, ny) || dist[map.index(nx, ny)] !== 0) continue;
        dist[map.index(nx, ny)] = step;
        next.push(nx, ny);
      }
    }
    frontier = next;
  }
  for (let i = 0; i < dist.length; i++) if (dist[i] < 0) dist[i] = 0;
  return dist;
}
