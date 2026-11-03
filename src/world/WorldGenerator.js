// Başlangıç kasabası haritasını tohumlu rastgelelik ve Perlin gürültüsüyle üretir.
// Aynı tohum her zaman aynı haritayı verir.
//
// Adımlar sırasıyla:
//   1. Çimen varyasyonları (çiçek tarlaları, taşlı alanlar)
//   2. Haritayı kuzeyden güneye kesen kıvrımlı nehir
//   3. Nehir kıyısında kum şeridi
//   4. (biyomlu haritada) Mikro-biyomlar: nehir kıyısı ve vadilerde Bereketli Toprak, kuzeyde ve
//      köşelerde Kayalık Tepe, dış çeperde Derin Orman; sınırları gürültüyle doğal kıvrılır
//   5. Merkezde köşeleri yuvarlatılmış meydan
//   6. Meydandan dört yöne kıvrılan yollar (nehri köprüyle geçer) ve yan patikalar
//   7. Meydanda süs havuzu ve banklar, yakınında kamp ateşi
//   8. Yol kenarlarında kapısı yola bağlanan kulübeler
//   9. Gürültüye göre kümelenmiş orman alanları (Derin Ormanda çok sık, tepede ve tarlada seyrek)
//  10. Kayalık alanlar ve dağınık taşlar (Kayalık Tepede yoğun kaya kümeleri)
//  11. Orman kenarlarında böğürtlen çalıları (biyomlu haritada Derin Ormanda da bolca)
//  12. (biyomlu haritada) Kasabadan uzak kuytu köşelerde üç Kadim Harabe ve onlara giden patikalar
//
// `biomes: false` 1-7. aşamaların 48x48 haritasını birebir aynı üretir (eski kayıtlar için):
// o yolda rastgele sayı çekim sırası değişmemelidir.
//
// Yapılar haritanın doluluk katmanına (occupants) işlenir ve kayıt olarak döndürülür;
// bunlardan Building varlıklarını oluşturmak sahnenin işidir.
import { TileMap } from './TileMap.js';
import { Noise2D } from '../utils/noise.js';
import { clamp } from '../utils/math.js';
import { BUILDINGS, RUIN_TYPES } from '../data/buildings.js';
import { isGround } from '../data/tiles.js';

// Görsel varyasyon numaraları (src/data/tiles.js'teki variants sırası)
const GRASS = { PLAIN: 0, FLOWERS: 1, PEBBLES: 2 };
const SAND = { PLAIN: 0, PEBBLES: 1 };
const BRIDGE = { TOP: 0, BOTTOM: 1, SINGLE: 2, MIDDLE: 3 };

const PLAZA_SIZE = 6;
const ROAD_WIDTH = 2;
const SIDE_TRAIL_COUNT = 3;
const SIDE_TRAIL_COUNT_LARGE = 6; // biyomlu büyük haritada daha çok patika
const TOWN_CLEARING_RADIUS = 7; // meydan çevresinde ağaç olmayan alan

const ROAD_TILES = ['path', 'plaza', 'bridge'];

const CABIN_TARGET_COUNT = 3; // başlangıçta her yatak dolu; yeni sakinler için oyuncu kulübe kurar
const CABIN_MIN_COUNT = 3;
const BERRY_BUSH_COUNT = 5;
const FOREST_BERRY_COUNT = 12; // biyomlu haritada Derin Ormana serpilen ek çalılar

// Mikro-biyomlar (yalnızca biyomlu haritada)
const BIOME_TOWN_RADIUS = 15;  // meydana bu kadar yakın yerde tepe ve derin orman olmaz
const MEADOW_RIVER_REACH = 6;  // bereketli toprak nehirden (kumun ötesinden) bu kadar karo içeri girer

// Kadim harabeler: kasabadan uzaklık aralığı, birbirinden ve yollardan en az uzaklık
const RUIN_DISTANCE = { min: 20, ideal: 28 };
const RUIN_SPACING = 16;
const RUIN_ROAD_CLEARANCE = 3;
/**
 * @param {number} width  karo cinsinden
 * @param {number} height karo cinsinden
 * @param {import('../utils/random.js').Random} rng
 * @returns {{ map: TileMap, landmarks: object, structures: object[] }}
 *   structures: [{ id, type, tileX, tileY, ...ek alanlar }]
 */
export function generateTown(width, height, rng, { biomes = false } = {}) {
  const map = new TileMap(width, height, 'grass');
  const noise = new Noise2D(rng);
  const plaza = {
    x: Math.floor(width / 2) - PLAZA_SIZE / 2,
    y: Math.floor(height / 2) - PLAZA_SIZE / 2,
    w: PLAZA_SIZE,
    h: PLAZA_SIZE,
  };
  plaza.centerX = plaza.x + plaza.w / 2;
  plaza.centerY = plaza.y + plaza.h / 2;

  paintGrassVariants(map, noise, rng);
  const riverSide = carveRiver(map, noise, rng);
  addRiverBanks(map, noise, rng);
  if (biomes) paintBiomes(map, noise, rng, plaza);
  paintPlaza(map, plaza);
  carveMainRoads(map, noise, plaza);
  const clearings = carveSideTrails(map, rng, plaza, biomes ? SIDE_TRAIL_COUNT_LARGE : SIDE_TRAIL_COUNT);
  assignBridgeVariants(map);

  const placer = new StructurePlacer(map);
  placePlazaFeatures(placer, plaza);
  const campfire = placeCampfire(placer, map, rng, plaza);
  placeCabins(placer, map, rng, plaza, campfire);

  placeTrees(map, noise, rng, plaza, clearings);
  placeRocks(map, noise, rng, plaza);
  placeBerryBushes(placer, map, rng, plaza);
  const ruins = biomes ? placeRuins(placer, map, rng, plaza) : [];
  if (biomes) placeForestBerries(placer, map, rng, plaza);
  if (ruins.length) assignBridgeVariants(map);

  return {
    map,
    landmarks: { plaza, riverSide, clearings, ruins },
    structures: placer.records,
  };
}

// ---------------------------------------------------------------------------
// 1. Çimen
// ---------------------------------------------------------------------------
function paintGrassVariants(map, noise, rng) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const flowerField = noise.fbm(x * 0.18 + 200, y * 0.18 + 200, 2);
      let variant = GRASS.PLAIN;
      if (flowerField > 0.22 && rng.chance(0.6)) variant = GRASS.FLOWERS;
      else if (rng.chance(0.04)) variant = GRASS.FLOWERS;
      else if (rng.chance(0.05)) variant = GRASS.PEBBLES;
      map.set(x, y, 'grass', variant);
    }
  }
}

// ---------------------------------------------------------------------------
// 2-3. Nehir ve kıyı
// ---------------------------------------------------------------------------
function carveRiver(map, noise, rng) {
  const side = rng.chance(0.5) ? 'west' : 'east';
  const baseX = map.width * (side === 'west' ? 0.22 : 0.78);
  const phase = rng.next() * Math.PI * 2;

  for (let y = 0; y < map.height; y++) {
    // Sinüs ana kıvrımı verir, gürültü onu düzensizleştirir
    const meander = Math.sin(y * 0.16 + phase) * 2.5 + noise.fbm(y * 0.07, 7.3, 2) * 4;
    const halfWidth = 1.1 + (noise.perlin(y * 0.15, 3.7) + 1) * 0.55; // ~1.1 - 2.2
    const centerX = baseX + meander;

    for (let x = Math.floor(centerX - halfWidth - 1); x <= Math.ceil(centerX + halfWidth); x++) {
      if (Math.abs(x + 0.5 - centerX) <= halfWidth) map.set(x, y, 'water');
    }
  }
  return side;
}

function addRiverBanks(map, noise, rng) {
  const bank = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.get(x, y) === 'water') continue;
      const distance = distanceToTile(map, x, y, 'water', 2);
      // İlk sıra her zaman kum; ikinci sıra gürültüye göre (kıyı şeridi düzensiz olsun)
      const wide = noise.perlin(x * 0.3 + 50, y * 0.3 + 50) > 0.05;
      if (distance === 1 || (distance === 2 && wide)) bank.push([x, y]);
    }
  }
  for (const [x, y] of bank) {
    map.set(x, y, 'sand', rng.chance(0.1) ? SAND.PEBBLES : SAND.PLAIN);
  }
}

// ---------------------------------------------------------------------------
// 4. Mikro-biyomlar
// ---------------------------------------------------------------------------

/** Her karonun en yakın su karosuna 4 yönlü adım uzaklığı (çok kaynaklı BFS). */
function waterDistances(map) {
  const distance = new Int16Array(map.width * map.height).fill(-1);
  let frontier = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.get(x, y) !== 'water') continue;
      distance[map.index(x, y)] = 0;
      frontier.push([x, y]);
    }
  }
  while (frontier.length > 0) {
    const next = [];
    for (const [x, y] of frontier) {
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!map.inBounds(nx, ny) || distance[map.index(nx, ny)] !== -1) continue;
        distance[map.index(nx, ny)] = distance[map.index(x, y)] + 1;
        next.push([nx, ny]);
      }
    }
    frontier = next;
  }
  return distance;
}

/**
 * Çimenlik karoları konuma göre biyomlara boyar. Her biyomun bir "eğilim" puanı vardır (kuzeye / köşeye
 * yakınlık, harita kenarına yakınlık, nehre yakınlık); buna gürültü eklenince sınırlar kıvrımlı ve doğal olur.
 */
function paintBiomes(map, noise, rng, plaza) {
  const water = waterDistances(map);
  const { width, height } = map;
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map.get(x, y) !== 'grass') continue;
      const fromTown = Math.hypot(x + 0.5 - plaza.centerX, y + 0.5 - plaza.centerY);
      const edge = Math.min(x, y, width - 1 - x, height - 1 - y);

      // Kayalık Tepe: kuzey şeridi ve köşeler
      const north = 1 - y / (height * 0.3);
      const corner = Math.max(...corners.map(([cx, cy]) => 1 - Math.hypot(x - cx, y - cy) / (width * 0.3)));
      const rocky = Math.max(north, corner * 0.85) + noise.fbm(x * 0.09 + 610, y * 0.09 + 610, 3) * 0.9;
      // Derin Orman: dış çeper
      const rim = 1 - edge / (width * 0.17);
      const forest = rim + noise.fbm(x * 0.08 + 820, y * 0.08 + 820, 3) * 0.9;
      // Bereketli Toprak: nehir kıyısı (kumun ötesi) ve iç vadiler
      const nearRiver = water[map.index(x, y)] <= MEADOW_RIVER_REACH + noise.perlin(x * 0.15 + 930, y * 0.15 + 930) * 3;
      const valley = noise.fbm(x * 0.06 + 1040, y * 0.06 + 1040, 2) < -0.24;

      let biome = null;
      if (fromTown > BIOME_TOWN_RADIUS && rocky > 0.55) biome = 'rocky';
      else if (fromTown > BIOME_TOWN_RADIUS && forest > 0.45) biome = 'forest';
      else if (nearRiver || valley) biome = 'meadow';
      if (!biome) continue;

      let variant = 0;
      if (biome === 'meadow') variant = noise.fbm(x * 0.2 + 1150, y * 0.2 + 1150, 2) > 0.1 || rng.chance(0.08) ? 1 : 0;
      else if (biome === 'rocky') variant = rng.chance(0.3) ? 1 : 0;
      else variant = rng.chance(0.22) ? 1 : 0;
      map.set(x, y, biome, variant);
    }
  }
}

/** En yakın `type` karosuna Chebyshev uzaklığı (maxRadius'a kadar), yoksa Infinity. */
function distanceToTile(map, x, y, type, maxRadius) {
  for (let r = 1; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (map.get(x + dx, y + dy) === type) return r;
      }
    }
  }
  return Infinity;
}

// ---------------------------------------------------------------------------
// 4. Meydan
// ---------------------------------------------------------------------------
function paintPlaza(map, plaza) {
  for (let y = plaza.y; y < plaza.y + plaza.h; y++) {
    for (let x = plaza.x; x < plaza.x + plaza.w; x++) {
      const cornerX = x === plaza.x || x === plaza.x + plaza.w - 1;
      const cornerY = y === plaza.y || y === plaza.y + plaza.h - 1;
      if (cornerX && cornerY) continue; // yuvarlatılmış köşe
      map.set(x, y, 'plaza');
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Yollar
// ---------------------------------------------------------------------------

/** Yol karosu boyar: suyun üstü köprü, meydan olduğu gibi kalır, diğer her şey toprak yol. */
function paintRoad(map, x, y) {
  const tile = map.get(x, y);
  if (!tile || tile === 'plaza' || tile === 'bridge') return;
  map.set(x, y, tile === 'water' ? 'bridge' : 'path');
}

/**
 * Meydandan harita kenarına kadar kıvrılan, ROAD_WIDTH genişliğinde yol.
 * axis 'x' ise yol yatay ilerler (doğu/batı), 'y' ise dikey (kuzey/güney).
 */
function carveRoad(map, noise, { startMain, endMain, axis, basePerp, noiseOffset }) {
  const step = Math.sign(endMain - startMain);
  const perpLimit = axis === 'x' ? map.height : map.width;
  let offset = 0;

  const cellAt = (main, perp) => (axis === 'x' ? [main, perp] : [perp, main]);
  const paintBrush = (main, perp) => {
    for (let w = 0; w < ROAD_WIDTH; w++) paintRoad(map, ...cellAt(main, perp + w));
  };
  // Önümüzdeki birkaç karoda su/kum varsa köprüyü düz geçmek için kıvrılmayı durdur
  const nearRiver = (main, perp) => {
    for (let ahead = -1; ahead <= 4; ahead++) {
      for (let w = -1; w <= ROAD_WIDTH; w++) {
        const tile = map.get(...cellAt(main + ahead * step, perp + w));
        if (tile === 'water' || tile === 'sand' || tile === 'bridge') return true;
      }
    }
    return false;
  };

  let travelled = 0;
  for (let main = startMain; main !== endMain + step; main += step, travelled++) {
    const perp = basePerp + offset;
    paintBrush(main, perp);

    if (travelled < 3 || nearRiver(main, perp)) continue;
    const target = Math.round(noise.perlin(travelled * 0.12 + noiseOffset, noiseOffset * 0.37) * 4);
    if (target === offset) continue;
    const nextOffset = offset + Math.sign(target - offset);
    const nextPerp = basePerp + nextOffset;
    if (nextPerp < 1 || nextPerp + ROAD_WIDTH > perpLimit - 1) continue;
    // Yana kayarken eski ve yeni konumu birlikte boya ki yol kopmasın
    offset = nextOffset;
    paintBrush(main, nextPerp);
  }
}

function carveMainRoads(map, noise, plaza) {
  const midX = Math.floor(plaza.centerX) - 1;
  const midY = Math.floor(plaza.centerY) - 1;
  const roads = [
    { axis: 'x', startMain: plaza.x + plaza.w, endMain: map.width - 1, basePerp: midY, noiseOffset: 11.3 },
    { axis: 'x', startMain: plaza.x - 1, endMain: 0, basePerp: midY, noiseOffset: 23.7 },
    { axis: 'y', startMain: plaza.y + plaza.h, endMain: map.height - 1, basePerp: midX, noiseOffset: 37.1 },
    { axis: 'y', startMain: plaza.y - 1, endMain: 0, basePerp: midX, noiseOffset: 49.9 },
  ];
  for (const road of roads) carveRoad(map, noise, road);
}

/** Ana yollardan çimenliğe doğru tek karo genişliğinde patikalar; uçlarında açıklık bırakır. */
function carveSideTrails(map, rng, plaza, trailCount) {
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const candidates = [];
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      if (map.get(x, y) !== 'path') continue;
      const far = Math.hypot(x - plaza.centerX, y - plaza.centerY) > 7;
      if (far) candidates.push([x, y]);
    }
  }

  const clearings = [];
  for (let attempt = 0; attempt < 40 && clearings.length < trailCount; attempt++) {
    if (candidates.length === 0) break;
    const [sx, sy] = rng.pick(candidates);
    const [dx, dy] = rng.pick(directions);
    if (!isGround(map.get(sx + dx, sy + dy))) continue;

    const length = rng.int(5, 9);
    const trail = [];
    let x = sx;
    let y = sy;
    for (let i = 0; i < length; i++) {
      x += dx;
      y += dy;
      // Ara sıra yana kıvrıl
      if (i > 1 && rng.chance(0.25)) {
        const side = rng.chance(0.5) ? 1 : -1;
        const nx = x + dy * side;
        const ny = y + dx * side;
        if (isGround(map.get(nx, ny))) {
          trail.push([x, y]);
          x = nx;
          y = ny;
        }
      }
      if (!isGround(map.get(x, y)) || x < 2 || y < 2 || x > map.width - 3 || y > map.height - 3) break;
      trail.push([x, y]);
    }
    if (trail.length < 4) continue;

    for (const [tx, ty] of trail) map.set(tx, ty, 'path');
    const [ex, ey] = trail[trail.length - 1];
    clearings.push({ x: ex, y: ey, radius: 2 });
  }
  return clearings;
}

export function assignBridgeVariants(map) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.get(x, y) !== 'bridge') continue;
      const up = map.get(x, y - 1) === 'bridge';
      const down = map.get(x, y + 1) === 'bridge';
      let variant = BRIDGE.SINGLE;
      if (up && down) variant = BRIDGE.MIDDLE;
      else if (down) variant = BRIDGE.TOP;
      else if (up) variant = BRIDGE.BOTTOM;
      map.setVariant(x, y, variant);
    }
  }
}

// ---------------------------------------------------------------------------
// 6-7. Ağaçlar ve kayalar
// ---------------------------------------------------------------------------
function isNearRoad(map, x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (ROAD_TILES.includes(map.get(x + dx, y + dy))) return true;
    }
  }
  return false;
}

function isInClearing(x, y, clearings) {
  return clearings.some((c) => Math.hypot(x - c.x, y - c.y) <= c.radius);
}

function isNearStructure(map, x, y, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (map.getOccupant(x + dx, y + dy) !== 0) return true;
    }
  }
  return false;
}

// Biyoma göre ağaç sıklığı: Derin Orman çok sık (ama yer yer açıklıklı), tepe ve tarla seyrek
const TREE_DENSITY = {
  grass: (base) => base,
  meadow: (base) => base * 0.3,
  rocky: (base) => base * 0.3,
  forest: (base, forest) => Math.max(base, 0.5 + forest * 0.45),
};

function placeTrees(map, noise, rng, plaza, clearings) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.get(x, y);
      if (!isGround(tile) || isNearRoad(map, x, y) || isInClearing(x, y, clearings)) continue;
      if (isNearStructure(map, x, y, 2)) continue;

      const fromCenter = Math.hypot(x + 0.5 - plaza.centerX, y + 0.5 - plaza.centerY);
      const outskirts = clamp((fromCenter - TOWN_CLEARING_RADIUS) / 6, 0, 1);
      const edgeDistance = Math.min(x, y, map.width - 1 - x, map.height - 1 - y);
      const edgeBonus = edgeDistance < 3 ? 0.3 - edgeDistance * 0.1 : 0;
      const forest = noise.fbm(x * 0.11 + 100, y * 0.11 + 100, 3);

      const base = (forest + 0.12) * 1.7 * outskirts + edgeBonus * outskirts;
      const density = TREE_DENSITY[tile](base, forest) * (tile === 'forest' ? outskirts : 1);
      if (rng.next() >= density) continue;

      // Tepelerde yalnızca çam; ormanda çam ve meşe karışık
      const conifer = tile === 'rocky' || noise.perlin(x * 0.08 + 300, y * 0.08 + 300) > 0.05;
      map.setObject(x, y, conifer ? 'pine' : 'oak');
    }
  }
}

function placeRocks(map, noise, rng, plaza) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.get(x, y);
      if (map.getObject(x, y) || isNearRoad(map, x, y) || isNearStructure(map, x, y, 1)) continue;
      if (Math.hypot(x + 0.5 - plaza.centerX, y + 0.5 - plaza.centerY) < 6) continue;

      if (tile === 'rocky') {
        // Kayalık Tepe: yoğun kaya kümeleri, aralarda çakıl
        const cluster = noise.fbm(x * 0.2 + 500, y * 0.2 + 500, 2);
        if (cluster > -0.05 && rng.chance(0.42)) map.setObject(x, y, rng.chance(0.65) ? 'rock' : 'pebbles');
        else if (rng.chance(0.06)) map.setObject(x, y, 'pebbles');
      } else if (isGround(tile)) {
        const rocky = noise.fbm(x * 0.2 + 500, y * 0.2 + 500, 2);
        if (rocky > 0.28 && rng.chance(tile === 'grass' ? 0.35 : 0.15)) {
          map.setObject(x, y, rng.chance(0.55) ? 'rock' : 'pebbles');
        } else if (rng.chance(0.012)) {
          map.setObject(x, y, 'pebbles');
        }
      } else if (tile === 'sand' && rng.chance(0.04)) {
        map.setObject(x, y, 'pebbles');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6-7, 10. Kasaba yapıları
// ---------------------------------------------------------------------------

/** Yapıları haritaya işler ve kayıtlarını tutar. Kimlikler 1'den başlar. */
class StructurePlacer {
  constructor(map) {
    this.map = map;
    this.records = [];
    this.nextId = 1;
  }

  canPlace(type, x, y, allowedTiles) {
    const { w, h } = BUILDINGS[type].size;
    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        if (!this.map.inBounds(tx, ty)) return false;
        if (!allowedTiles.includes(this.map.get(tx, ty))) return false;
        if (this.map.getOccupant(tx, ty) !== 0) return false;
      }
    }
    return true;
  }

  place(type, x, y, extra = {}) {
    const { w, h } = BUILDINGS[type].size;
    const id = this.nextId++;
    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        this.map.setOccupant(tx, ty, id);
        this.map.setObject(tx, ty, null);
      }
    }
    const record = { id, type, tileX: x, tileY: y, ...extra };
    this.records.push(record);
    return record;
  }
}

/** Meydanın ortasına süs havuzu, kuzey ve güney kenarlarına banklar (yol ağızlarını kapatmadan). */
function placePlazaFeatures(placer, plaza) {
  const fx = Math.floor(plaza.centerX) - 1;
  const fy = Math.floor(plaza.centerY) - 1;
  if (placer.canPlace('fountain', fx, fy, ['plaza'])) placer.place('fountain', fx, fy);

  const benchSpots = [
    [plaza.x + 1, plaza.y],
    [plaza.x + plaza.w - 2, plaza.y],
    [plaza.x + 1, plaza.y + plaza.h - 1],
    [plaza.x + plaza.w - 2, plaza.y + plaza.h - 1],
  ];
  for (const [x, y] of benchSpots) {
    if (placer.canPlace('bench', x, y, ['plaza'])) placer.place('bench', x, y);
  }
}

/** Meydana birkaç karo uzaklıkta, çevresi açık ve yola yakın bir çimenliğe kamp ateşi. */
function placeCampfire(placer, map, rng, plaza) {
  const ringOk = (tile) => isGround(tile) || tile === 'path' || tile === 'plaza';
  let best = null;
  for (let y = 2; y < map.height - 2; y++) {
    for (let x = 2; x < map.width - 2; x++) {
      if (!isGround(map.get(x, y)) || map.getOccupant(x, y) !== 0) continue;
      const distance = Math.hypot(x + 0.5 - plaza.centerX, y + 0.5 - plaza.centerY);
      if (distance < 5.5 || distance > 9.5) continue;

      let roadTiles = 0;
      let valid = true;
      for (let dy = -1; dy <= 1 && valid; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tile = map.get(x + dx, y + dy);
          if (!ringOk(tile) || map.getOccupant(x + dx, y + dy) !== 0) {
            valid = false;
            break;
          }
          if (!isGround(tile)) roadTiles++;
        }
      }
      if (!valid || roadTiles > 3) continue;
      if (!hasTileWithin(map, x, y, ['path', 'plaza'], 2)) continue;

      const score = Math.abs(distance - 7) + rng.next() * 0.6;
      if (!best || score < best.score) best = { x, y, score };
    }
  }
  if (!best) return null;
  clearObjects(map, best.x, best.y, 2);
  return placer.place('campfire', best.x, best.y);
}

/**
 * Yol kenarlarına kulübeler. Kapı (güney) önündeki iki karo yola kısa bir patikayla bağlanır.
 * Önce geniş aralıkla dağıtmayı dener; yer kalmazsa aralığı daraltır.
 */
function placeCabins(placer, map, rng, plaza, campfire) {
  const candidates = [];
  for (let y = 1; y < map.height - 4; y++) {
    for (let x = 1; x < map.width - 3; x++) {
      const candidate = evaluateCabinSite(map, x, y, plaza, campfire);
      if (candidate) candidates.push({ ...candidate, score: candidate.score + rng.next() * 0.8 });
    }
  }
  candidates.sort((a, b) => a.score - b.score);

  const placed = [];
  for (const spacing of [7, 5]) {
    for (const c of candidates) {
      if (placed.length >= CABIN_TARGET_COUNT) break;
      if (placed.some((p) => Math.max(Math.abs(p.tileX - c.x), Math.abs(p.tileY - c.y)) < spacing)) continue;
      // Önceki kulübelerin patikaları bu alanı değiştirmiş olabilir: yeniden doğrula
      if (!evaluateCabinSite(map, c.x, c.y, plaza, campfire)) continue;
      const record = placer.place('cabin', c.x, c.y, { tone: placed.length });
      connectDoorToRoad(map, c.x, c.y);
      placed.push(record);
    }
    if (placed.length >= CABIN_MIN_COUNT) break;
  }
  return placed;
}

function evaluateCabinSite(map, x, y, plaza, campfire) {
  // Gövde 2x2 çimen
  for (let ty = y; ty < y + 2; ty++) {
    for (let tx = x; tx < x + 2; tx++) {
      if (!isGround(map.get(tx, ty)) || map.getOccupant(tx, ty) !== 0) return null;
    }
  }
  // Kapı önü
  for (let tx = x; tx < x + 2; tx++) {
    const tile = map.get(tx, y + 2);
    if ((!isGround(tile) && tile !== 'path') || map.getOccupant(tx, y + 2) !== 0) return null;
  }
  // Çevrede su, kum, köprü, meydan ya da başka yapı olmasın
  for (let ty = y - 2; ty <= y + 3; ty++) {
    for (let tx = x - 1; tx <= x + 2; tx++) {
      const tile = map.get(tx, ty);
      if (tile === 'water' || tile === 'sand' || tile === 'bridge' || tile === 'plaza') return null;
      if (map.getOccupant(tx, ty) !== 0) return null;
    }
  }
  const distance = Math.hypot(x + 1 - plaza.centerX, y + 1 - plaza.centerY);
  if (distance < 6 || distance > 17) return null;
  if (campfire && Math.hypot(x + 1 - campfire.tileX, y + 1 - campfire.tileY) < 4) return null;

  const roadDistance = distanceToRoad(map, x, y + 2, 4);
  if (roadDistance === Infinity) return null;
  return { x, y, score: roadDistance * 1.5 + Math.abs(distance - 10) * 0.2 };
}

/** Çimen üzerinden 4 yönlü en yakın yol karosuna adım sayısı (maxSteps'e kadar). */
function distanceToRoad(map, x, y, maxSteps) {
  return bfsToRoad(map, x, y, maxSteps)?.length ?? Infinity;
}

/** Kapı önünden en yakın yola giden kısa patika yolu (yol karosu hariç); bulunamazsa null. */
function bfsToRoad(map, startX, startY, maxSteps) {
  const isRoad = (tx, ty) => map.get(tx, ty) === 'path' || map.get(tx, ty) === 'plaza';
  const key = (tx, ty) => ty * map.width + tx;
  const previous = new Map([[key(startX, startY), null]]);
  let frontier = [[startX, startY]];
  for (let step = 0; step <= maxSteps; step++) {
    const next = [];
    for (const [cx, cy] of frontier) {
      if (isRoad(cx, cy) && !(cx === startX && cy === startY)) {
        const path = [];
        for (let k = previous.get(key(cx, cy)); k !== null; k = previous.get(k)) {
          path.push([k % map.width, Math.floor(k / map.width)]);
        }
        return path;
      }
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!map.inBounds(nx, ny) || previous.has(key(nx, ny))) continue;
        const tile = map.get(nx, ny);
        if ((!isGround(tile) && !isRoad(nx, ny)) || map.getOccupant(nx, ny) !== 0) continue;
        previous.set(key(nx, ny), key(cx, cy));
        next.push([nx, ny]);
      }
    }
    frontier = next;
  }
  return null;
}

function connectDoorToRoad(map, x, y) {
  // Rota kapı önü karoları patikaya çevrilmeden önce hesaplanır; yoksa BFS kapı önünü
  // "yol" sanıp hemen dururdu.
  const route = bfsToRoad(map, x, y + 2, 4) ?? [];
  for (const [tx, ty] of route) {
    if (isGround(map.get(tx, ty))) map.set(tx, ty, 'path');
  }
  map.set(x, y + 2, 'path');
  map.set(x + 1, y + 2, 'path');
}

/** Orman kenarlarında, meydandan ulaşılabilen çimenliklere böğürtlen çalıları. */
function placeBerryBushes(placer, map, rng, plaza) {
  const seed = findWalkableIn(map, plaza);
  if (!seed) return [];
  const reachable = map.computeReachable(seed.x, seed.y);
  const isReachable = (x, y) => map.inBounds(x, y) && reachable[map.index(x, y)] === 1;
  const maxBerries = BUILDINGS.berryBush.maxBerries;

  const placed = [];
  for (const minTrees of [2, 1]) {
    const candidates = [];
    for (let y = 1; y < map.height - 1; y++) {
      for (let x = 1; x < map.width - 1; x++) {
        if (!isGround(map.get(x, y)) || map.getObject(x, y) || map.getOccupant(x, y) !== 0) continue;
        const distance = Math.hypot(x + 0.5 - plaza.centerX, y + 0.5 - plaza.centerY);
        if (distance < 6 || distance > 20) continue;
        if (isNearRoad(map, x, y) || isNearStructure(map, x, y, 2)) continue;
        const trees = countTrees(map, x, y, 2);
        if (trees < minTrees) continue;
        const approachable = [[0, 1], [1, 0], [-1, 0], [0, -1]].some(
          ([dx, dy]) => map.isWalkable(x + dx, y + dy) && isReachable(x + dx, y + dy)
        );
        if (!approachable) continue;
        candidates.push({ x, y, score: Math.abs(trees - 3) + rng.next() * 1.5 });
      }
    }
    candidates.sort((a, b) => a.score - b.score);
    for (const c of candidates) {
      if (placed.length >= BERRY_BUSH_COUNT) break;
      if (placed.some((p) => Math.hypot(p.tileX - c.x, p.tileY - c.y) < 5)) continue;
      if (map.getOccupant(c.x, c.y) !== 0) continue;
      placed.push(placer.place('berryBush', c.x, c.y, { berries: maxBerries }));
    }
    if (placed.length >= BERRY_BUSH_COUNT - 1) break;
  }
  return placed;
}

/** Derin Ormanın açıklıklarına, ulaşılabilen yerlere ek böğürtlen çalıları. */
function placeForestBerries(placer, map, rng, plaza) {
  const seed = findWalkableIn(map, plaza);
  if (!seed) return [];
  const reachable = map.computeReachable(seed.x, seed.y);
  const isReachable = (x, y) => map.inBounds(x, y) && reachable[map.index(x, y)] === 1;
  const maxBerries = BUILDINGS.berryBush.maxBerries;
  const candidates = [];
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      if (map.get(x, y) !== 'forest' || map.getObject(x, y) || map.getOccupant(x, y) !== 0) continue;
      if (isNearRoad(map, x, y) || isNearStructure(map, x, y, 2)) continue;
      const approachable = [[0, 1], [1, 0], [-1, 0], [0, -1]].some(
        ([dx, dy]) => map.isWalkable(x + dx, y + dy) && isReachable(x + dx, y + dy)
      );
      if (approachable) candidates.push({ x, y, score: rng.next() });
    }
  }
  candidates.sort((a, b) => a.score - b.score);
  const placed = [];
  for (const c of candidates) {
    if (placed.length >= FOREST_BERRY_COUNT) break;
    if (placed.some((p) => Math.hypot(p.tileX - c.x, p.tileY - c.y) < 5)) continue;
    if (Math.hypot(c.x + 0.5 - plaza.centerX, c.y + 0.5 - plaza.centerY) < 12) continue;
    placed.push(placer.place('berryBush', c.x, c.y, { berries: maxBerries }));
  }
  return placed;
}

// ---------------------------------------------------------------------------
// 12. Kadim harabeler
// ---------------------------------------------------------------------------

/**
 * Üç harabeyi kasabadan uzak, yollardan kuytu, tercih ettikleri biyomdaki yerlere koyar
 * (Gözetleme Kulesi tepede, Erzak Kampı ve Kadim Çeşme ormanda). Çevrelerindeki ağaç ve
 * kayalar temizlenir; kasabaya bağlı değillerse ormanın içinden onlara giden bir patika açılır.
 */
function placeRuins(placer, map, rng, plaza) {
  const placed = [];
  for (const type of RUIN_TYPES) {
    const def = BUILDINGS[type];
    const { w, h } = def.size;
    let best = null;
    for (let y = 2; y < map.height - h - 2; y++) {
      for (let x = 2; x < map.width - w - 2; x++) {
        const site = evaluateRuinSite(map, x, y, w, h, def.ruin.biomes, plaza, placed);
        if (site && (!best || site.score + rng.next() * 0.5 < best.score)) best = site;
      }
    }
    if (!best) continue;
    for (let ty = best.y - 1; ty <= best.y + h; ty++) {
      for (let tx = best.x - 1; tx <= best.x + w; tx++) map.setObject(tx, ty, null);
    }
    const record = placer.place(type, best.x, best.y, { condition: 'ruined' });
    connectRuin(map, record, w, h, plaza);
    placed.push(record);
  }
  return placed;
}

function evaluateRuinSite(map, x, y, w, h, biomes, plaza, placed) {
  // Listedeki ilk biyom asıl tercihtir; sonrakiler yarı puan alır
  let preferred = 0;
  for (let ty = y - 1; ty <= y + h; ty++) {
    for (let tx = x - 1; tx <= x + w; tx++) {
      const tile = map.get(tx, ty);
      if (!isGround(tile) || map.getOccupant(tx, ty) !== 0) return null;
      const rank = biomes.indexOf(tile);
      if (rank >= 0) preferred += rank === 0 ? 1 : 0.5;
    }
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  const distance = Math.hypot(cx - plaza.centerX, cy - plaza.centerY);
  if (distance < RUIN_DISTANCE.min) return null;
  if (placed.some((p) => Math.hypot(p.tileX - x, p.tileY - y) < RUIN_SPACING)) return null;
  if (hasTileWithin(map, Math.round(cx), Math.round(cy), ['path', 'plaza', 'bridge'], RUIN_ROAD_CLEARANCE)) return null;
  const ring = (w + 2) * (h + 2);
  return { x, y, score: (1 - preferred / ring) * 10 + Math.abs(distance - RUIN_DISTANCE.ideal) * 0.25 };
}

/**
 * Harabenin çevresinden kasabaya ulaşılabilen en yakın karoya, ağaçların arasından geçen en ucuz
 * patikayı açar (Dijkstra; nesneli karolar pahalıdır, yani mümkünse ağaçların arasından süzülür).
 */
function connectRuin(map, record, w, h, plaza) {
  const seed = findWalkableIn(map, plaza);
  if (!seed) return;
  const reachable = map.computeReachable(seed.x, seed.y);
  const ring = [];
  for (let y = record.tileY - 1; y <= record.tileY + h; y++) {
    for (let x = record.tileX - 1; x <= record.tileX + w; x++) {
      const inside = x >= record.tileX && x < record.tileX + w && y >= record.tileY && y < record.tileY + h;
      if (!inside && map.inBounds(x, y)) ring.push([x, y]);
    }
  }
  if (ring.some(([x, y]) => reachable[map.index(x, y)] === 1)) return;

  const cost = new Float32Array(map.width * map.height).fill(Infinity);
  const previous = new Int32Array(map.width * map.height).fill(-1);
  const open = [];
  for (const [x, y] of ring) {
    cost[map.index(x, y)] = 0;
    open.push(map.index(x, y));
  }
  let goal = -1;
  while (open.length > 0) {
    let bestAt = 0;
    for (let i = 1; i < open.length; i++) if (cost[open[i]] < cost[open[bestAt]]) bestAt = i;
    const current = open.splice(bestAt, 1)[0];
    if (reachable[current] === 1) {
      goal = current;
      break;
    }
    const cx = current % map.width;
    const cy = Math.floor(current / map.width);
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!map.inBounds(nx, ny) || map.getOccupant(nx, ny) !== 0) continue;
      const tile = map.get(nx, ny);
      if (tile === 'water') continue;
      const step = 1 + (map.getObject(nx, ny) ? 3 : 0);
      const i = map.index(nx, ny);
      if (cost[current] + step < cost[i]) {
        if (cost[i] === Infinity) open.push(i);
        cost[i] = cost[current] + step;
        previous[i] = current;
      }
    }
  }
  for (let i = goal; i !== -1; i = previous[i]) {
    const x = i % map.width;
    const y = Math.floor(i / map.width);
    map.setObject(x, y, null);
    if (isGround(map.get(x, y))) map.set(x, y, 'path');
  }
}

function countTrees(map, x, y, radius) {
  let count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const object = map.getObject(x + dx, y + dy);
      if (object === 'oak' || object === 'pine') count++;
    }
  }
  return count;
}

function hasTileWithin(map, x, y, types, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (types.includes(map.get(x + dx, y + dy))) return true;
    }
  }
  return false;
}

function clearObjects(map, x, y, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) map.setObject(x + dx, y + dy, null);
  }
}

function findWalkableIn(map, rect) {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (map.isWalkable(x, y)) return { x, y };
    }
  }
  return null;
}
