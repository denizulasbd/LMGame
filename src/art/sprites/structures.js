// Kasaba yapıları: kulübe, süs havuzu, bank, kamp ateşi ve böğürtlen çalısı.
// Büyük yapılar CharGrid ile şekillerden çizilir; küçükler doğrudan metin ızgarasıdır.
// Her görsel, yapının kapladığı karoların ALT kenarına hizalanarak çizilir.
import { getSprite, CharGrid, composeRows, recolorRows, flipRowsHorizontal } from '../PixelSprite.js';
import {
  getQuarrySprite,
  getFishingPierSprite,
  getFishingPierSiteSprite,
  getFlowerBedSprite,
  getInnSprite,
  getMarketSprite,
  getLanternSprite,
  getMonumentSprite,
} from './structuresExtra.js';
import {
  getStoneHouseSprite,
  getSawmillSprite,
  getGreenhouseSprite,
  getDeepMineSprite,
  getWatchtowerSprite,
  getSupplyCampSprite,
  getAncientFountainSprite,
} from './structuresTier2.js';
import { getWorkshopSprite } from './structuresCraft.js';
import { getSheepFarmSprite } from './structuresFarm.js';
import { getMillSprite, getIronMineSprite } from './structuresIndustry.js';
import { getTownHallSprite } from './structuresCivic.js';
import { getHealerHutSprite } from './structuresHealth.js';
import { getAcademySprite } from './structuresWisdom.js';
import { getHarborSprite, getHarborSiteSprite } from './structuresHarbor.js';
import { getWonderSprite } from './structuresWonder.js';
import { getCherryTreeSprite, getGazeboLayer, getMarbleArchSprite, getFlowerFenceSprite } from './structuresGarden.js';
import { getGrapeVineSprite, getAncientTorchSprite } from './structuresExplore.js';
import { getMarbleFountainSprite, getGoldenLanternSprite, getRoyalStatueSprite } from './structuresGoldenAge.js';
import { getNoticeBoardSprite, getWoodpileSprite, getScarecrowSprite, getBandstandSprite, getHeroStatueSprite } from './structuresDecor.js';
import { getWellSprite, getGuardTowerSprite } from './structuresSafety.js';
import { getCourthouseSprite } from './structuresJustice.js';
import { getPeaceFountainSprite, getRoseGardenSprite, getRoyalArchiveSprite } from './structuresRoyal.js';
import { getUniversitySprite } from './structuresUniversity.js'; // (32.4)
import { getSiloSprite } from './structuresGranary.js';
import { getLoomSprite, getBrewerySprite } from './structuresRefinery.js';
import { getTradingPostSprite } from './structuresTrade.js';
import {
  getWoodFenceSprite,
  getFenceGateSprite,
  getIronLanternSprite,
  getSignpostSprite,
  getParkBenchSprite,
  getPlanterSprite,
  getOrnamentalTreeSprite,
} from './structuresLandscape.js';
import { seasonalFoliageRows, winterize } from '../seasons.js';

// ---------------------------------------------------------------------------
// Kulübe (2x2 karo, görsel 32x40: çatı ve baca üstteki karoya taşar)
// ---------------------------------------------------------------------------
export const CABIN_ART = {
  width: 32,
  height: 40,
  windows: [
    { x: 7.5, y: 24.5 },
    { x: 24.5, y: 24.5 },
  ],
  chimney: { x: 24.5, y: 0 },
  door: { x: 16, y: 33 },
};

// Çatı renk tonları; her kulübe kimliğine göre birini alır
const ROOF_TONES = [
  {},                              // kiremit
  { C: 'B', U: 'n', Z: 'c' },      // mavi arduvaz
  { C: 'f', U: 'F', Z: 'v' },      // yosunlu yeşil
];

function drawCabinWindow(g, x0) {
  g.rect(x0, 21, 7, 7, 'K');
  g.rect(x0 + 1, 22, 5, 5, 'A');
  g.hline(x0 + 1, x0 + 5, 25, 'I');
  g.hline(x0 + 1, x0 + 5, 26, 'I');
  g.vline(x0 + 3, 22, 26, 'x');
  g.hline(x0 + 1, x0 + 5, 24, 'x');
  g.hline(x0 - 1, x0 + 7, 28, 'E');
  g.hline(x0 - 1, x0 + 7, 29, 'x');
  // Pencere önü çiçekleri
  g.set(x0, 27, 'p').set(x0 + 2, 27, 'P').set(x0 + 4, 27, 'p').set(x0 + 6, 27, 'u');
}

function buildCabinRows() {
  const g = new CharGrid(CABIN_ART.width, CABIN_ART.height);

  // Yere düşen gölge
  g.rect(3, 38, 29, 2, 'k');

  // Taş temel
  g.rect(1, 34, 30, 4, 'K');
  g.rect(2, 34, 28, 3, 'r');
  g.hline(2, 29, 34, 'q');
  g.hline(2, 29, 36, 'R');
  for (let x = 5; x < 29; x += 6) g.set(x, 35, 'M');

  // Kütük duvarlar
  g.rect(1, 17, 30, 17, 'K');
  for (let y = 18; y <= 33; y++) {
    const band = (y - 18) % 3;
    g.hline(2, 29, y, band === 0 ? 'X' : band === 1 ? 'w' : 'x');
  }
  for (let y = 18; y <= 33; y += 3) {
    g.set(2, y, 'E');
    g.set(29, y, 'E');
  }

  drawCabinWindow(g, 4);
  drawCabinWindow(g, 21);

  // Kapı
  g.rect(12, 22, 8, 12, 'K');
  g.rect(13, 23, 6, 11, 'w');
  g.hline(13, 18, 23, 'X');
  g.vline(15, 24, 33, 'x');
  g.vline(17, 24, 33, 'x');
  g.set(18, 28, 'P');
  g.rect(11, 34, 10, 2, 'q');
  g.hline(11, 20, 35, 'r');

  // Çatı: aşağı doğru genişleyen kiremit sıraları
  for (let y = 3; y <= 17; y++) {
    const inset = Math.max(0, 4 - Math.floor((y - 3) / 3));
    const x0 = inset;
    const x1 = 31 - inset;
    g.hline(x0, x1, y, 'C');
    g.set(x0, y, 'K');
    g.set(x1, y, 'K');
    const course = Math.floor((y - 4) / 3);
    if ((y - 4) % 3 === 2) {
      g.hline(x0 + 1, x1 - 1, y, 'U');
    } else {
      for (let x = x0 + 2 + (course % 2) * 3; x < x1; x += 6) g.set(x, y, 'U');
    }
  }
  g.hline(4, 27, 3, 'K');
  g.hline(5, 26, 4, 'Z');
  g.hline(1, 30, 16, 'U');
  g.hline(0, 31, 17, 'K');
  g.hline(2, 29, 18, 'x'); // saçak gölgesi

  // Baca
  g.rect(21, 0, 7, 2, 'K');
  g.hline(22, 26, 1, 'q');
  g.rect(22, 2, 5, 8, 'K');
  g.rect(23, 2, 3, 8, 'r');
  g.set(24, 3, 'R').set(23, 5, 'R').set(25, 5, 'R').set(24, 7, 'R');
  g.hline(22, 26, 10, 'U');

  return g.toRows();
}

let cabinRows = null;

/** lit: pencereler sarı yanar (akşam/gece). tone: çatı rengi indeksi. */
export function getCabinSprite(lit, tone = 0) {
  const t = ((tone % ROOF_TONES.length) + ROOF_TONES.length) % ROOF_TONES.length;
  return getSprite(`building:cabin:${t}:${lit ? 'lit' : 'day'}`, () => {
    cabinRows ??= buildCabinRows();
    const glass = lit ? { A: 'y', I: 'P' } : { A: 'a', I: 'c' };
    return recolorRows(cabinRows, { ...glass, ...ROOF_TONES[t] });
  });
}

// ---------------------------------------------------------------------------
// Süs havuzu (2x2 karo, 32x32) — 2 karelik su animasyonu
// ---------------------------------------------------------------------------
function buildFountainRows(frame) {
  const g = new CharGrid(32, 32);
  g.ellipse(16.5, 28.5, 15, 3.5, 'k');

  // Havuz duvarı (ön yüz) ve kenar taşı
  g.ellipse(16, 22.5, 15.5, 7.5, 'K');
  g.ellipse(16, 22.5, 14.5, 6.5, 'R');
  g.ellipse(16, 21.5, 14.5, 6, 'r');
  for (let x = 4; x < 30; x += 5) g.set(x, 26, 'M').set(x + 2, 28, 'M');
  g.ellipse(16, 19.5, 15.5, 6.5, 'K');
  g.ellipse(16, 19.5, 14.5, 5.5, 'q');

  // Su
  g.ellipse(16, 19.5, 12, 4.2, 'N');
  g.ellipse(16, 19.5, 11, 3.4, 'b');
  const waves = frame === 0
    ? [[7, 19], [8, 19], [21, 21], [22, 21], [12, 22], [24, 18]]
    : [[9, 20], [10, 20], [19, 18], [20, 18], [14, 22], [6, 20]];
  waves.forEach(([x, y]) => g.set(x, y, 'c'));
  g.set(frame === 0 ? 10 : 22, frame === 0 ? 17 : 20, 'a');

  // Orta sütun ve üst çanak
  g.rect(13, 8, 6, 12, 'K');
  g.rect(14, 8, 4, 12, 'r');
  g.vline(14, 9, 19, 'q');
  g.vline(17, 9, 19, 'R');
  g.ellipse(16, 9, 6.5, 2.6, 'K');
  g.ellipse(16, 8.8, 5.5, 1.8, 'q');
  g.ellipse(16, 8.6, 3.5, 1, 'c');

  // Fışkıran su ve damlalar
  g.vline(15, 2, 7, 'a');
  g.vline(16, 3, 7, 'c');
  g.set(15, 1, 'W').set(16, 2, 'W');
  const drops = frame === 0
    ? [[12, 4], [19, 4], [10, 7], [21, 7], [9, 11], [22, 11]]
    : [[13, 3], [18, 3], [11, 6], [20, 6], [10, 10], [21, 10]];
  drops.forEach(([x, y], i) => g.set(x, y, i % 2 === 0 ? 'a' : 'c'));
  g.vline(frame === 0 ? 9 : 10, 12, 15, 'a');
  g.vline(frame === 0 ? 22 : 21, 12, 15, 'a');
  return g.toRows();
}

export function getFountainSprite(frame) {
  const f = frame % 2;
  return getSprite(`building:fountain:${f}`, () => buildFountainRows(f));
}

// ---------------------------------------------------------------------------
// Ahşap bank (1x1, güneye bakar)
// ---------------------------------------------------------------------------
const BENCH = [
  '................',
  '................',
  '................',
  '.KKKKKKKKKKKKKK.',
  '.KEEEEEEEEEEEEK.',
  '.KXXXXXXXXXXXXK.',
  '.KKwKKKKKKKKwKK.',
  '.KEEEEEEEEEEEEK.',
  '.KXXXXXXXXXXXXK.',
  '.KKKKKKKKKKKKKK.',
  'KEEEEEEEEEEEEEEK',
  'KXXXXXXXXXXXXXXK',
  'KwwwwwwwwwwwwwwK',
  '.KKKKKKKKKKKKKK.',
  '..KxK......KxK..',
  '..KKKkkkkkkKKK..',
];

export function getBenchSprite() {
  return getSprite('building:bench', BENCH);
}

// ---------------------------------------------------------------------------
// Kamp ateşi (1x1, görsel 16x20) — 3 karelik alev
// ---------------------------------------------------------------------------
const FLAME = [
  '...o....',
  '...oo...',
  '..oOo...',
  '..oOOo.o',
  '.oOPOo.o',
  '.oOPPOoo',
  'oOPPyPOo',
  'oOPyyPOo',
  'oOPyyPOo',
  '.oOPPOo.',
  '..oOOo..',
];
const FLAMES = [
  FLAME,
  flipRowsHorizontal(FLAME),
  ['........', '..o.o...', ...FLAME.slice(2)],
];
const SPARKS = [
  [[5, 1, 'O'], [10, 3, 'P']],
  [[9, 0, 'P'], [6, 2, 'O']],
  [[4, 3, 'O'], [11, 1, 'O']],
];

function buildCampfireBase(lit) {
  const g = new CharGrid(16, 20);
  g.ellipse(8.5, 17.5, 7.5, 2.2, 'k');
  // Çapraz kütükler
  g.line(4, 17, 11, 13, 'w');
  g.line(4, 16, 11, 12, 'X');
  g.line(4, 13, 11, 17, 'x');
  g.line(4, 12, 11, 16, 'w');
  g.set(4, 16, 'E').set(11, 12, 'E').set(4, 12, 'E');
  // Kor
  g.set(7, 15, lit ? 'O' : 'R').set(9, 14, lit ? 'P' : 'R').set(8, 16, lit ? 'o' : 'R');
  // Taş halka
  const stones = 10;
  for (let i = 0; i < stones; i++) {
    const angle = (i / stones) * Math.PI * 2;
    const x = Math.round(8 + Math.cos(angle) * 6.6 - 1);
    const y = Math.round(15 + Math.sin(angle) * 2.8 - 0.5);
    g.stamp(['qr', 'RQ'], x, y);
  }
  return g;
}

export function getCampfireSprite(lit, frame) {
  if (!lit) return getSprite('building:campfire:off', () => buildCampfireBase(false).toRows());
  const f = frame % FLAMES.length;
  return getSprite(`building:campfire:${f}`, () => {
    const g = buildCampfireBase(true);
    // Arka taşların önüne, kütüklerin üstüne alev
    g.stamp(FLAMES[f], 4, 4);
    SPARKS[f].forEach(([x, y, c]) => g.set(x, y, c));
    return g.toRows();
  });
}

// ---------------------------------------------------------------------------
// Böğürtlen çalısı (1x1) — üzerindeki meyve sayısına göre 4 görünüm
// ---------------------------------------------------------------------------
const BUSH = [
  '................',
  '................',
  '.....FFFFFF.....',
  '...FFvvVVvvFF...',
  '..FvvVVVvvvvfF..',
  '.FvvVVvvvvvvffF.',
  '.FvVVvvvvvvvffF.',
  'FvvvvvvvvvfvfffF',
  'FvvvvvvvvvvvfffF',
  'FfvvvvvvvvvffffF',
  'FffvvvvvvvffffFF',
  '.FfffvvvvffffFF.',
  '..FFffffffffFF..',
  '...FFFFFFFFFF...',
  '...kkkkkkkkkk...',
  '................',
];
const BERRY = ['ml', 'mm'];
const BERRY_SPOTS = [
  [4, 5],
  [9, 4],
  [6, 8],
  [11, 8],
  [3, 9],
  [8, 10],
];
const BLOSSOMS = [
  [[5, 6], 'u'],
  [[10, 5], 'u'],
  [[8, 9], 'p'],
];

/** Çalı: meyve sayısına göre; sonbaharda yaprakları turuncu, kışın meyvesiz ve karlı. */
export function getBerryBushSprite(berries, maxBerries, season = 'summer') {
  const level = season === 'winter' ? 0 : Math.max(0, Math.min(3, Math.ceil((berries / maxBerries) * 3)));
  return getSprite(`building:bush:${level}:${season}`, () => {
    const leaves = seasonalFoliageRows(BUSH, season === 'spring' ? 'summer' : season, 'oak', 0);
    if (season === 'winter') return leaves;
    if (level === 0) {
      return composeRows(leaves, BLOSSOMS.map(([[x, y], c]) => [[c], x, y]));
    }
    const count = level * 2;
    return composeRows(leaves, BERRY_SPOTS.slice(0, count).map(([x, y]) => [BERRY, x, y]));
  });
}

// ---------------------------------------------------------------------------
// Oduncu kulübesi (2x2, görsel 32x40): açık önlü sundurma, içeride odun yığını,
// önünde baltası saplı kütük
// ---------------------------------------------------------------------------
const LOG_END = ['xXx', 'XEX', 'xXx'];

function buildLumberHutRows() {
  const g = new CharGrid(32, 40);
  g.rect(3, 38, 29, 2, 'k');

  // Arka duvar ve iç gölge
  g.rect(1, 14, 30, 23, 'K');
  for (let y = 15; y <= 35; y++) {
    const band = (y - 15) % 3;
    g.hline(2, 29, y, band === 0 ? 'w' : band === 1 ? 'x' : 'w');
  }
  g.rect(4, 19, 24, 15, 'x');
  for (let y = 21; y < 33; y += 4) g.hline(5, 26, y, 'w');

  // Toprak zemin ve talaş
  g.rect(2, 34, 28, 3, 'D');
  g.hline(2, 29, 34, 'd');
  [[5, 35], [9, 36], [14, 35], [21, 36], [26, 35]].forEach(([x, y]) => g.set(x, y, 'e'));

  // Odun yığını (piramit)
  [[16, 30], [19, 30], [22, 30], [25, 30], [17, 27], [20, 27], [23, 27], [19, 24], [22, 24]].forEach(([x, y]) =>
    g.stamp(LOG_END, x, y)
  );

  // Taşıyıcı direkler
  for (const x of [2, 28]) {
    g.rect(x, 15, 3, 20, 'K');
    g.vline(x + 1, 15, 34, 'X');
  }

  // Tek eğimli ahşap çatı
  for (let y = 4; y <= 16; y++) {
    const inset = Math.max(0, 3 - Math.floor((y - 4) / 4));
    g.hline(inset, 31 - inset, y, (y - 4) % 3 === 2 ? 'x' : 'X');
    g.set(inset, y, 'K');
    g.set(31 - inset, y, 'K');
    if ((y - 4) % 3 !== 2) for (let x = inset + 2 + ((y % 2) * 3); x < 31 - inset; x += 6) g.set(x, y, 'w');
  }
  g.hline(3, 28, 3, 'K');
  g.hline(4, 27, 4, 'E');
  g.hline(0, 31, 17, 'K');
  g.hline(1, 30, 16, 'w');

  // Kütük ve saplı balta (ön sol)
  g.rect(5, 30, 7, 5, 'K');
  g.rect(6, 30, 5, 4, 'w');
  g.hline(6, 10, 30, 'E');
  g.hline(6, 10, 31, 'X');
  g.line(9, 29, 12, 25, 'w');
  g.stamp(['KK.', 'KqK', 'KqK', '.K.'], 11, 23);
  return g.toRows();
}

export function getLumberHutSprite() {
  return getSprite('building:lumberHut', buildLumberHutRows);
}

// ---------------------------------------------------------------------------
// Sebze bahçesi (3x3, 48x48): çitli tarla, ekim tercihine göre ekin sıraları (24. aşama)
//   grain (Buğday / Sebze, varsayılan): altın sarısı buğday başakları arasında lahana, havuç, domates
//   flax  (Keten)                     : açık mavi çiçekli ince yeşil saplar; sonbaharda kuruyup demetlenir
//   hops  (Meyve / Şerbetçiotu)       : ahşap sırıklara sarılmış koyu yeşil yapraklar ve mor salkımlar
// ---------------------------------------------------------------------------
const CABBAGE = ['.vVv.', 'vVfVv', 'fvVvf', '.fff.'];
const CARROT = ['v.v', '.v.', '.O.', '.O.'];
const TOMATO = ['.xo.', 'vxvo', 'ovxv', '.xv.', '.x..'];
const SPROUT = ['.....', '.v.v.', '..V..', '.fvf.'];
const PUMPKIN = ['..x..', '.OOO.', 'OOYOO', '.OOO.'];
const SNOW_MOUND = ['.....', '.787.', '67776', '56665'];
// Buğday: altın başaklar (yazın), yeşil başaklar (ilkbaharda), biçilmiş demet (sonbaharda)
const WHEAT = ['9.9.9', 'P9P9P', 'YPYPY', '.Y.Y.', '.Y.Y.'];
const WHEAT_GREEN = ['V.V.V', 'vVvVv', '.v.v.', '.f.f.'];
const SHEAF = ['.9P9.', '9PYP9', '.4Y4.', '.Y4Y.', 'Y4.4Y'];
// Keten: mavi çiçekli yeşil saplar (yazın), filiz (ilkbaharda), kuruyan saman sarısı demetler (sonbaharda)
const FLAX = ['c.a.c', 'vcvav', '.v.v.', '.f.f.', '.f.f.'];
const FLAX_SPROUT = ['.....', '.v.V.', 'v.v.v', '.f.f.'];
const FLAX_DRY = ['.s.s.', 'szszs', '.z.z.', '.zXz.', 'z.X.z'];
// Şerbetçiotu: sırığa sarılmış koyu yeşil yapraklar ve mor salkımlar; sonbaharda kehribar meyveler; kışın çıplak sırık
const HOPS = ['...x.', '.fFx.', 'flmxF', 'Fmlxf', '.Ffx.', '...x.'];
const HOPS_SPROUT = ['...x.', '...x.', '..vx.', '.v.x.', '..vx.', '...x.'];
const HOPS_RIPE = ['...x.', '.4Fx.', 'flmx4', 'F4lxf', '.Flx.', '...x.'];
const HOPS_BARE = ['...x.', '...x.', '...x.', '.787.', '67776', '56665'];
// Mahsule ve mevsime göre ekin sıraları
const CROP_ROWS = {
  grain: {
    spring: [SPROUT, WHEAT_GREEN, CABBAGE, WHEAT_GREEN, SPROUT],
    summer: [WHEAT, CABBAGE, WHEAT, TOMATO, WHEAT],
    autumn: [SHEAF, PUMPKIN, WHEAT, PUMPKIN, SHEAF],
    winter: [SNOW_MOUND, SNOW_MOUND, SNOW_MOUND, SNOW_MOUND, SNOW_MOUND],
  },
  flax: {
    spring: [FLAX_SPROUT, FLAX_SPROUT, FLAX_SPROUT, FLAX_SPROUT, FLAX_SPROUT],
    summer: [FLAX, FLAX, FLAX, FLAX, FLAX],
    autumn: [FLAX_DRY, FLAX, FLAX_DRY, FLAX, FLAX_DRY],
    winter: [SNOW_MOUND, SNOW_MOUND, SNOW_MOUND, SNOW_MOUND, SNOW_MOUND],
  },
  hops: {
    spring: [HOPS_SPROUT, HOPS_SPROUT, HOPS_SPROUT, HOPS_SPROUT, HOPS_SPROUT],
    summer: [HOPS, HOPS, HOPS, HOPS, HOPS],
    autumn: [HOPS_RIPE, HOPS, HOPS_RIPE, HOPS, HOPS_RIPE],
    winter: [HOPS_BARE, HOPS_BARE, HOPS_BARE, HOPS_BARE, HOPS_BARE],
  },
};
export const GARDEN_CROPS = Object.keys(CROP_ROWS);

function buildGardenRows(season = 'summer', crop = 'grain') {
  const g = new CharGrid(48, 48);
  const frozen = season === 'winter';
  g.rect(1, 3, 46, 43, frozen ? '5' : 'D');
  g.rect(3, 6, 42, 37, frozen ? '6' : 'd');

  // Sıralar: koyu karık + ekinler (kışın donmuş, karla örtülü)
  const rows = (CROP_ROWS[crop] ?? CROP_ROWS.grain)[season] ?? CROP_ROWS.grain.summer;
  rows.forEach((plant, i) => {
    const y = 8 + i * 7;
    g.hline(4, 43, y + 4, frozen ? '5' : 'D');
    // Şerbetçiotu sırıklarını birbirine bağlayan tel
    if (crop === 'hops') g.hline(5, 41, y, 'x');
    for (let x = 5; x < 42; x += 7) g.stamp(plant, x, y);
  });

  // Çit: direkler + iki sıra kuşak, alt ortada kapı aralığı
  const fence = (y0) => {
    g.hline(0, 47, y0 + 1, 'X');
    g.hline(0, 47, y0 + 3, 'X');
  };
  fence(0);
  fence(42);
  g.vline(0, 0, 47, 'X');
  g.vline(47, 0, 47, 'X');
  for (let x = 0; x < 48; x += 6) {
    g.vline(x, 0, 5, 'x');
    g.set(x, 0, 'E');
    g.vline(x, 42, 47, 'x');
    g.set(x, 42, 'E');
  }
  for (let y = 0; y < 48; y += 6) {
    g.set(0, y, 'E');
    g.set(47, y, 'E');
  }
  // Kapı aralığı
  g.rect(20, 42, 8, 6, frozen ? '6' : 'd');
  g.vline(19, 41, 47, 'x');
  g.vline(28, 41, 47, 'x');
  g.set(19, 41, 'E').set(28, 41, 'E');
  return g.toRows();
}

/** @param {string} crop (24. aşama) ekim tercihi: 'grain' | 'flax' | 'hops' */
export function getGardenSprite(season = 'summer', crop = 'grain') {
  const key = CROP_ROWS[crop] ? crop : 'grain';
  return getSprite(`building:garden:${season}:${key}`, () => buildGardenRows(season, key));
}

// ---------------------------------------------------------------------------
// Kiler (3x2, görsel 48x44): kırmızı ahır, beyaz pervazlar, çapraz kuşaklı çift kapı
// ---------------------------------------------------------------------------
function buildStorageRows() {
  const g = new CharGrid(48, 44);
  g.rect(3, 42, 45, 2, 'k');

  // Temel
  g.rect(1, 39, 46, 3, 'K');
  g.rect(2, 39, 44, 2, 'r');
  g.hline(2, 45, 39, 'q');

  // Dikey tahta duvar
  g.rect(1, 18, 46, 21, 'K');
  for (let x = 2; x <= 45; x++) g.vline(x, 19, 38, x % 4 === 0 ? 'U' : x % 4 === 1 ? 'Z' : 'C');
  g.vline(2, 19, 38, 'S');
  g.vline(45, 19, 38, 'S');

  // Üçgen alınlık ve çatı saçakları
  for (let y = 2; y <= 18; y++) {
    const half = Math.round((y - 2) * 1.45);
    const xl = Math.max(0, 23 - half);
    const xr = Math.min(47, 24 + half);
    for (let x = xl; x <= xr; x++) g.set(x, y, x % 4 === 0 ? 'U' : x % 4 === 1 ? 'Z' : 'C');
    g.hline(xl, Math.min(xr, xl + 3), y, 'R');
    g.hline(Math.max(xl, xr - 3), xr, y, 'R');
    g.set(xl, y, 'K');
    g.set(xr, y, 'K');
    if (y % 3 === 0) {
      g.set(xl + 1, y, 'Q');
      g.set(xr - 1, y, 'Q');
    }
  }
  g.hline(22, 25, 1, 'K');
  g.hline(1, 46, 19, 'S'); // saçak altı pervaz

  // Saman penceresi
  g.rect(19, 8, 10, 8, 'K');
  g.rect(20, 9, 8, 6, 'S');
  g.rect(21, 10, 6, 4, 'x');
  g.hline(21, 26, 12, 'P');
  g.set(23, 11, 'P').set(25, 13, 'Y');

  // Çift kapı
  g.rect(15, 23, 18, 16, 'K');
  g.rect(16, 24, 16, 15, 'S');
  for (const x0 of [17, 25]) {
    g.rect(x0, 25, 6, 13, 'C');
    g.vline(x0 + 2, 25, 37, 'U');
    g.line(x0, 25, x0 + 5, 37, 'S');
    g.line(x0 + 5, 25, x0, 37, 'S');
  }
  g.vline(23, 24, 38, 'K');
  g.vline(24, 24, 38, 'K');

  // Yan tarafta çuval ve sandık
  g.stamp(['.KKK.', 'KsSsK', 'KsszK', 'KzzzK', '.KKK.'], 4, 33);
  g.stamp(['KKKKKK', 'KXEXEK', 'KxXxXK', 'KXEXEK', 'KKKKKK'], 37, 33);
  return g.toRows();
}

export function getStorageSprite() {
  return getSprite('building:storage', buildStorageRows);
}

// ---------------------------------------------------------------------------
// Şantiye (her boyut için): çitli toprak alan, malzeme yığını; ilerledikçe iskele yükselir
//   stage 0: temel ve malzeme, 1: direkler ve kiriş, 2: çatı tahtaları
// ---------------------------------------------------------------------------
const SITE_TOP_EXTRA = 10; // iskele direkleri yapının üstüne bu kadar taşar

function buildSiteRows(w, h, stage) {
  const W = w * 16;
  const H = h * 16;
  const oy = SITE_TOP_EXTRA;
  const g = new CharGrid(W, H + oy);

  // Kazılmış toprak
  g.rect(1, oy + 1, W - 2, H - 2, 'd');
  for (let i = 0; i < (W * H) / 40; i++) {
    const x = 2 + ((i * 37) % (W - 4));
    const y = oy + 2 + ((i * 53) % (H - 4));
    g.set(x, y, i % 3 === 0 ? 'e' : 'D');
  }

  // Malzeme: tahta yığını ve taş öbeği
  const by = oy + H - 9;
  g.rect(3, by, Math.min(10, W - 6), 2, 'E');
  g.rect(3, by + 2, Math.min(10, W - 6), 2, 'X');
  g.hline(3, 2 + Math.min(10, W - 6), by + 4, 'x');
  if (W >= 32) g.stamp(['.qr.', 'qrRR', 'rRRQ'], W - 9, by + 1);

  // İskele
  if (stage >= 1) {
    const poles = W >= 48 ? [4, W / 2, W - 5] : [4, W - 5];
    for (const x of poles) {
      g.vline(x, 2, oy + H - 6, 'w');
      g.vline(x + 1, 2, oy + H - 6, 'x');
    }
    g.hline(4, W - 4, oy + Math.floor(H / 2), 'X');
    g.hline(4, W - 4, 2, 'X');
    g.line(5, oy + Math.floor(H / 2), Math.min(W - 6, 5 + Math.floor(H / 2) - 2), 3, 'w');
  }
  if (stage >= 2) {
    for (let y = 3; y <= 5; y++) {
      for (let x = 5; x < W - 5; x++) if ((x + y) % 4 !== 0) g.set(x, y, y === 5 ? 'U' : 'C');
    }
  }

  // Çit
  g.hline(0, W - 1, oy + 2, 'X');
  g.hline(0, W - 1, oy + H - 3, 'X');
  g.vline(0, oy + 2, oy + H - 3, 'X');
  g.vline(W - 1, oy + 2, oy + H - 3, 'X');
  for (let x = 0; x < W; x += 5) {
    g.vline(x, oy, oy + 4, 'x');
    g.set(x, oy, 'E');
    g.vline(x, oy + H - 5, oy + H - 1, 'x');
    g.set(x, oy + H - 5, 'E');
  }
  g.vline(W - 1, oy, oy + 4, 'x');
  g.vline(W - 1, oy + H - 5, oy + H - 1, 'x');
  return g.toRows();
}

export function getConstructionSiteSprite(w, h, stage, type = null, orientation = 'right') {
  if (type === 'fishingPier') return getFishingPierSiteSprite(stage, orientation === 'left');
  if (type === 'harbor') return getHarborSiteSprite(stage, orientation === 'left');
  return getSprite(`building:site:${w}x${h}:${stage}`, () => buildSiteRows(w, h, stage));
}

// ---------------------------------------------------------------------------
// Tek giriş: türüne ve anlık durumuna göre yapı görseli (inşa menüsü ve hayalet önizleme de kullanır)
//   state: { windowsLit, tone, frame, lit, berries, maxBerries, active, orientation, open, season,
//            level (2 = yükseltilmiş), ruined (yıkık harabe), sailFrame (değirmen kanatlarının açısı),
//            wonderStage (harikanın tamamlanan aşaması; verilmezse tamamlanmış hali), scaffold / step
//            (harikada sıradaki aşama iskelede yükseliyor) }
// Kışın her yapı karla örtülür (çatılar beyazlar, tepelere kar yığılır); çalı ve bahçe kendi kış
// çizimlerini kullanır (bahçenin Seviye 2'si Cam Sera ise kışın da yeşildir, yalnızca çatısı karlanır).
// ---------------------------------------------------------------------------
const OWN_WINTER_ART = new Set(['berryBush', 'garden', 'sheepFarm', 'mill', 'cherryTree', 'grapeVine', 'ancientTorch', 'birchTree', 'oakTree', 'pineTree', 'royalRoseGarden']);

// Kışın karla örtülen çatı renkleri (açık / ana / koyu ton) ve çatının bittiği satır.
// Kulübenin üç çatı tonu (kiremit, arduvaz, yosun) hepsi listede; ahırın yalnızca saçakları.
const WINTER_ROOFS = {
  cabin: { light: ['Z', 'c', 'v'], main: ['C', 'B', 'f'], dark: ['U', 'n', 'F'], maxRow: 18 },
  'cabin:2': { light: ['Z', 'c', 'v'], main: ['C', 'B', 'f'], dark: ['U', 'n', 'F'], maxRow: 15 },
  inn: { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 22 },
  storage: { main: ['R'], maxRow: 19 },
  lumberHut: { light: ['E'], main: ['X'], dark: ['x'], maxRow: 17 },
  'lumberHut:2': { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 18 },
  watchtower: { light: ['X'], main: ['w'], maxRow: 9 },
  well: { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 4 },
  guardTower: { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 9 },
  silo: { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 15 },
  loom: { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 12 },
  brewery: { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 14 },
  tradingPost: { light: ['E'], main: ['X'], dark: ['x'], maxRow: 12 },
  supplyCamp: { light: ['S'], main: ['s'], maxRow: 17 },
  workshop: { light: ['c'], main: ['B'], dark: ['n'], maxRow: 17 },
  townHall: { light: ['Z', 'c'], main: ['C', 'B'], dark: ['U', 'n'], maxRow: 36 },
  healerHut: { light: ['Y'], main: ['P'], dark: ['X'], maxRow: 19 },
  academy: { light: ['c'], main: ['B', 'b'], dark: ['n', 'N'], maxRow: 39 },
  harbor: { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 22 },
  gazebo: { light: ['E'], main: ['X'], dark: ['w'], maxRow: 21 },
  courthouse: { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 22 }, // (32.2) alınlığın saçağı
  royalArchive: { light: ['c'], main: ['b'], dark: ['N'], maxRow: 13 }, // (32.3) kubbe
  university: { light: ['c', 'a', 'Z'], main: ['b', 'C'], dark: ['U'], maxRow: 32 }, // (32.4) kubbeler ve saçak
};

export function getStructureSprite(type, state = {}) {
  const level = state.level === 2 ? 2 : 1;
  const sprite = level === 2 ? getUpgradedSprite(type, state) : getBaseStructureSprite(type, state);
  if (state.season !== 'winter' || (OWN_WINTER_ART.has(type) && level === 1)) return sprite;
  return winterize(sprite, WINTER_ROOFS[`${type}:${level}`] ?? WINTER_ROOFS[type] ?? null);
}

/** Seviye 2 (yükseltilmiş) yapıların görselleri. */
function getUpgradedSprite(type, state) {
  switch (type) {
    case 'cabin':
      return getStoneHouseSprite(Boolean(state.windowsLit), state.tone ?? 0);
    case 'lumberHut':
      return getSawmillSprite(state.active ? state.frame ?? 0 : 0);
    case 'garden':
      return getGreenhouseSprite();
    case 'quarry':
      return getDeepMineSprite(state.active ? (state.frame ?? 0) % 2 : 0);
    default:
      return getBaseStructureSprite(type, state);
  }
}

function getBaseStructureSprite(type, state) {
  switch (type) {
    case 'watchtower':
      return getWatchtowerSprite(Boolean(state.ruined), Boolean(state.lit));
    case 'supplyCamp':
      return getSupplyCampSprite(Boolean(state.ruined));
    case 'ancientFountain':
      return getAncientFountainSprite(Boolean(state.ruined), state.frame ?? 0);
    case 'cabin':
      return getCabinSprite(Boolean(state.windowsLit), state.tone ?? 0);
    case 'fountain':
      return getFountainSprite(state.frame ?? 0);
    case 'bench':
      return getBenchSprite();
    case 'campfire':
      return getCampfireSprite(state.lit ?? true, state.frame ?? 0);
    case 'berryBush':
      return getBerryBushSprite(state.berries ?? 3, state.maxBerries ?? 3, state.season);
    case 'lumberHut':
      return getLumberHutSprite();
    case 'garden':
      return getGardenSprite(state.season, state.crop ?? 'grain');
    case 'storage':
      return getStorageSprite();
    // 24. aşama: tarımsal depolama
    case 'silo':
      return getSiloSprite();
    // 24.2: katma değerli üretim
    case 'loom':
      return getLoomSprite(Boolean(state.active), state.frame ?? 0);
    case 'brewery':
      return getBrewerySprite(Boolean(state.active), state.frame ?? 0);
    // 24.3: dış ticaret
    case 'tradingPost':
      return getTradingPostSprite(Boolean(state.lit ?? state.windowsLit), Boolean(state.docked));
    case 'quarry':
      return getQuarrySprite(state.active ? (state.frame ?? 0) % 2 : 0);
    case 'fishingPier':
      return getFishingPierSprite(Boolean(state.lit ?? state.windowsLit), state.orientation === 'left');
    case 'flowerBed':
      return getFlowerBedSprite(state.tone ?? 0, (state.frame ?? 0) % 2);
    case 'inn':
      return getInnSprite(Boolean(state.lit ?? state.windowsLit), state.frame ?? 0);
    case 'market':
      return getMarketSprite(Boolean(state.open), state.frame ?? 0);
    case 'workshop':
      return getWorkshopSprite(Boolean(state.active), state.frame ?? 0);
    case 'lantern':
      return getLanternSprite(Boolean(state.lit ?? state.windowsLit));
    case 'sheepFarm':
      return getSheepFarmSprite(state.season ?? 'summer');
    case 'mill':
      return getMillSprite(state.sailFrame ?? 1, Boolean(state.active), state.frame ?? 0, Boolean(state.windowsLit), state.season);
    case 'ironMine':
      return getIronMineSprite(state.frame ?? 0, Boolean(state.active), Boolean(state.lit ?? state.windowsLit));
    case 'townHall':
      return getTownHallSprite(Boolean(state.windowsLit), state.frame ?? 0, state.relics ?? 0);
    case 'cherryTree':
      return getCherryTreeSprite(state.season ?? 'spring');
    case 'grapeVine':
      return getGrapeVineSprite(state.season ?? 'summer');
    case 'ancientTorch':
      return getAncientTorchSprite(Boolean(state.lit ?? state.windowsLit), state.frame ?? 0);
    case 'gazebo':
      return getGazeboLayer('full');
    case 'marbleArch':
      return getMarbleArchSprite();
    case 'flowerFence':
      return getFlowerFenceSprite(state.connect ?? {});
    // 18. aşama: sokak eşyaları ve süs ağaçları
    case 'woodFence':
      return getWoodFenceSprite(state.connect ?? {});
    case 'fenceGate':
      return getFenceGateSprite(state.connect ?? {});
    case 'ironLantern':
      return getIronLanternSprite(Boolean(state.lit ?? state.windowsLit));
    // 20. aşama: Altın Çağ'ın prestij peyzajı
    case 'marbleFountain':
      return getMarbleFountainSprite(state.frame ?? 0);
    case 'goldenLantern':
      return getGoldenLanternSprite(Boolean(state.lit ?? state.windowsLit));
    // 22. aşama: Kraliyet Beratı'yla dikilen anıt
    // (31. aşama) Kasaba Süsleri: görünüm durumu state.look'ta (TownDecorSystem yazar; menü önizlemesinde dolu / örtüsüz)
    case 'noticeBoard':
      return getNoticeBoardSprite(state.look?.notes ?? 2, Boolean(state.look?.royal));
    case 'woodpile':
      return getWoodpileSprite(state.look?.fill ?? 3);
    case 'scarecrow':
      return getScarecrowSprite(Boolean(state.look?.crow), Boolean(state.look?.dressed));
    case 'bandstand':
      return getBandstandSprite(Boolean(state.lit) || Boolean(state.look?.concert));
    case 'heroStatue':
      return getHeroStatueSprite(state.look ? state.look.pose : 'hammer');
    case 'royalStatue':
      return getRoyalStatueSprite();
    // (32.2) Adalet Sarayı: mevsim saksıları ve açık davada kapıda parşömen (state.look.cases; menü önizlemesinde yok)
    case 'courthouse':
      return getCourthouseSprite(state.season ?? 'summer', Boolean(state.look?.cases));
    // (32.3) Kraliyet Lütfu yapıları
    case 'peaceFountain':
      return getPeaceFountainSprite(state.frame ?? 0, Boolean(state.lit));
    case 'royalRoseGarden':
      return getRoseGardenSprite(state.season ?? 'summer');
    case 'royalArchive':
      return getRoyalArchiveSprite(Boolean(state.windowsLit));
    // (32.4) Darülfünun: mevsim ağaçları; ders saatinde (state.look.lecture) ve akşam pencereler yanar
    case 'university':
      return getUniversitySprite(state.season ?? 'summer', Boolean(state.look?.lecture || state.windowsLit));
    // 23. aşama: güvenlik yapıları
    case 'well':
      return getWellSprite(state.frame ?? 0);
    case 'guardTower':
      return getGuardTowerSprite(Boolean(state.lit ?? state.windowsLit));
    case 'signpost':
      return getSignpostSprite();
    case 'parkBench':
      return getParkBenchSprite();
    case 'planter':
      return getPlanterSprite(state.tone ?? 0, state.frame ?? 0);
    case 'birchTree':
      return getOrnamentalTreeSprite('birch', state.growthStage ?? 2, state.season ?? 'summer');
    case 'oakTree':
      return getOrnamentalTreeSprite('oak', state.growthStage ?? 2, state.season ?? 'summer');
    case 'pineTree':
      return getOrnamentalTreeSprite('pine', state.growthStage ?? 2, state.season ?? 'summer');
    case 'healerHut':
      return getHealerHutSprite(Boolean(state.active), state.frame ?? 0, Boolean(state.windowsLit));
    case 'monument':
      return getMonumentSprite();
    case 'academy':
      return getAcademySprite(Boolean(state.windowsLit), state.frame ?? 0, Boolean(state.active));
    case 'harbor':
      return getHarborSprite(Boolean(state.lit ?? state.windowsLit), state.frame ?? 0, Boolean(state.active), state.orientation === 'left');
    case 'wonder':
      return getWonderSprite(state.wonderStage ?? 3, {
        lit: Boolean(state.windowsLit),
        frame: state.frame ?? 0,
        scaffold: Boolean(state.scaffold),
        step: state.step ?? 0,
      });
    default:
      throw new Error(`Yapı görseli yok: ${type}`);
  }
}
