// (18. aşama) Serbest imar ve peyzaj: sokak eşyaları ve süs ağaçları. Görseller yapının kapladığı karonun ALT
// kenarına hizalanır.
//   Ahşap Çit (1x1, 16x20): kazıklı, iki kuşaklı rustik çit; dört yandaki çitlere / kapılara göre birleşir
//     (yatay, dikey, köşe, T ve dört yol kavşağı: 16 bağlantı durumu).
//   Çit Kapısı (1x1, 16x20): iki direk arasında çaprazlı ahşap kanat; çit dikey uzanıyorsa yandan görünür.
//   Demir Sokak Feneri (1x1, 16x34): dökme demir direk, kıvrık süs kolları, cam fanus (gece sıcak sarı yanar).
//   Mahalle Tabelası (1x1, 16x26): ahşap direkte yön oku biçimli tabela; üzerinde küçük oyma harfler.
//   Park Bankı (1x1, 16x16): yeşil boyalı çıtalar, dökme demir kıvrık ayaklar.
//   Çiçek Saksısı (1x1, 16x16): taş çanak, rengârenk çiçekler (iki kare: rüzgârda eğilir).
//   Süs ağaçları (Huş, Meşe, Çam; 1x1): üç büyüme kademesi (fidan 16x16, genç ağaç 16x26, ulu ağaç 16x34 / meşe 20x34);
//     yaprakları mevsimle boyanır (art/seasons.js -> seasonalFoliageRows).
import { getSprite, CharGrid, recolorRows } from '../PixelSprite.js';
import { seasonalFoliageRows } from '../seasons.js';

export const WOOD_FENCE_ART = { width: 16, height: 20 };
export const IRON_LANTERN_ART = { width: 16, height: 34, light: { x: 8, y: 7 } };
export const SIGNPOST_ART = { width: 16, height: 26, board: { x: 8, y: 6 } };
export const ORNAMENTAL_TREE_ART = { sapling: 16, young: 26, grown: 34 };

// ---------------------------------------------------------------------------
// Ahşap çit
// ---------------------------------------------------------------------------

function fencePost(g, x, top, bottom) {
  g.vline(x - 1, top, bottom, 'K').vline(x, top, bottom, 'X').vline(x + 1, top, bottom, 'w').vline(x + 2, top, bottom, 'K');
  g.hline(x, x + 1, top - 1, 'K');
  g.set(x, top, 'E');
}

function buildWoodFenceRows(c) {
  const g = new CharGrid(WOOD_FENCE_ART.width, WOOD_FENCE_ART.height);
  const { left, right, up, down } = c;
  const horizontal = left || right || !(up || down);
  if (horizontal) {
    const x0 = left ? 0 : 6;
    const x1 = right ? 15 : 9;
    g.hline(x0, x1, 18, 'k').hline(x0, x1, 19, 'k');
    // Kuşaklar: koyu kontur, açık üst yüz
    for (const y of [9, 14]) {
      g.hline(x0, x1, y - 1, 'K').hline(x0, x1, y, 'E').hline(x0, x1, y + 1, 'w').hline(x0, x1, y + 2, 'K');
    }
    // Kenar kazıkları (komşu çit yoksa orta kazık yeter)
    if (left) fencePost(g, 1, 7, 17);
    if (right) fencePost(g, 13, 7, 17);
  }
  if (up || down) {
    const top = up ? 0 : 5;
    const bottom = down ? 19 : 17;
    g.vline(6, top, bottom, 'K').vline(7, top, bottom, 'X').vline(8, top, bottom, 'w').vline(9, top, bottom, 'K');
    for (let y = top + 3; y <= bottom - 1; y += 5) g.hline(6, 9, y, 'E');
  }
  // Orta kazık (her zaman): biraz daha uzun, ucu sivri
  fencePost(g, 7, 5, 17);
  g.set(7, 3, 'K').set(8, 3, 'K').set(7, 4, 'X').set(8, 4, 'w');
  g.hline(6, 9, 18, 'k');
  return g.toRows();
}

/** connect: { left, right, up, down } yanındaki çitler / kapılar */
export function getWoodFenceSprite(connect = {}) {
  const c = { left: Boolean(connect.left), right: Boolean(connect.right), up: Boolean(connect.up), down: Boolean(connect.down) };
  const key = `${+c.left}${+c.right}${+c.up}${+c.down}`;
  return getSprite(`building:woodFence:${key}`, () => buildWoodFenceRows(c));
}

// ---------------------------------------------------------------------------
// Çit kapısı
// ---------------------------------------------------------------------------

function buildGateRows(vertical) {
  const g = new CharGrid(WOOD_FENCE_ART.width, WOOD_FENCE_ART.height);
  if (vertical) {
    // Yandan görünüm: çit kuzey-güney uzanır, kapı kanadı ince bir şerit
    g.vline(6, 0, 19, 'K').vline(9, 0, 19, 'K');
    g.vline(7, 0, 19, 'X').vline(8, 0, 19, 'w');
    for (const y of [2, 17]) g.rect(5, y - 1, 6, 3, 'K').hline(6, 9, y, 'E');
    g.rect(6, 5, 4, 10, 'K').rect(7, 6, 2, 8, 'E');
    g.vline(8, 6, 13, 'X').set(7, 10, 'P');
    return g.toRows();
  }
  g.hline(0, 15, 18, 'k').hline(1, 14, 19, 'k');
  // İki kalın direk ve topuzları
  for (const x of [1, 13]) {
    g.rect(x - 1, 4, 4, 15, 'K');
    g.vline(x, 5, 17, 'X').vline(x + 1, 5, 17, 'w');
    g.rect(x - 1, 2, 4, 3, 'K').hline(x, x + 1, 3, 'E');
  }
  // Kanat: üç dikey tahta, iki kuşak ve çapraz destek
  g.rect(4, 7, 8, 10, 'K');
  for (let x = 5; x <= 10; x++) g.vline(x, 8, 15, x % 2 === 0 ? 'E' : 'X');
  g.hline(5, 10, 9, 'w').hline(5, 10, 14, 'w');
  g.line(5, 14, 10, 9, 'x');
  g.set(10, 12, 'P'); // mandal
  g.hline(4, 11, 6, 'K').hline(5, 10, 5, 'K');
  return g.toRows();
}

export function getFenceGateSprite(connect = {}) {
  const vertical = (connect.up || connect.down) && !(connect.left || connect.right);
  return getSprite(`building:fenceGate:${vertical ? 'v' : 'h'}`, () => buildGateRows(Boolean(vertical)));
}

// ---------------------------------------------------------------------------
// Demir sokak feneri
// ---------------------------------------------------------------------------

function buildIronLanternRows() {
  const g = new CharGrid(IRON_LANTERN_ART.width, IRON_LANTERN_ART.height);
  g.ellipse(8, 32.5, 4.5, 1.4, 'k');
  // Basamaklı dökme kaide
  g.rect(4, 29, 8, 3, 'K').hline(5, 10, 30, 'R').hline(5, 10, 29, 'r');
  g.rect(5, 26, 6, 3, 'K').hline(6, 9, 27, 'R');
  // Direk (yivli)
  g.rect(6, 12, 4, 15, 'K');
  g.vline(7, 13, 26, 'R').vline(8, 13, 26, 'Q');
  g.set(7, 18, 'r').set(7, 22, 'r');
  // Kıvrık süs kolları
  g.set(4, 13, 'K').set(3, 12, 'K').set(4, 11, 'K').set(11, 13, 'K').set(12, 12, 'K').set(11, 11, 'K');
  g.hline(5, 10, 12, 'K');
  // Fanus: koni çatı, cam, taban
  g.hline(7, 8, 0, 'K').hline(6, 9, 1, 'K').hline(5, 10, 2, 'K').hline(4, 11, 3, 'K');
  g.hline(6, 9, 2, 'R').hline(5, 10, 3, 'Q');
  g.rect(4, 4, 8, 7, 'K');
  g.rect(5, 4, 6, 6, 'A');
  g.hline(5, 10, 9, 'I');
  g.vline(8, 4, 9, 'K');
  g.hline(4, 11, 11, 'K').hline(5, 10, 10, 'R');
  return g.toRows();
}

export function getIronLanternSprite(lit) {
  return getSprite(`building:ironLantern:${lit ? 'lit' : 'day'}`, () => recolorRows(buildIronLanternRows(), lit ? { A: 'y', I: 'P' } : { A: 'a', I: 'c' }));
}

// ---------------------------------------------------------------------------
// Mahalle tabelası
// ---------------------------------------------------------------------------

function buildSignpostRows() {
  const g = new CharGrid(SIGNPOST_ART.width, SIGNPOST_ART.height);
  g.ellipse(8, 24.5, 4, 1.3, 'k');
  // Direk
  g.rect(6, 10, 4, 15, 'K');
  g.vline(7, 10, 24, 'X').vline(8, 10, 24, 'w');
  g.set(7, 23, 'E');
  // Ok biçimli tabela (sağa bakar)
  g.rect(0, 2, 14, 7, 'K');
  g.set(14, 3, 'K').set(14, 4, 'K').set(14, 5, 'K').set(14, 6, 'K').set(14, 7, 'K').set(15, 5, 'K').set(15, 4, 'K').set(15, 6, 'K');
  g.rect(1, 3, 13, 5, 'E');
  g.hline(1, 13, 7, 'X');
  g.set(14, 4, 'E').set(14, 5, 'E').set(14, 6, 'X');
  // Oyma harfler (küçük koyu çizgiler)
  for (const x of [2, 3, 5, 6, 8, 10, 11]) g.set(x, 4, 'x');
  for (const x of [2, 4, 5, 7, 9, 10, 12]) g.set(x, 5, 'w');
  // Çiviler ve tepedeki küçük çatı
  g.set(1, 3, 'q').set(12, 3, 'q');
  g.hline(5, 10, 1, 'K').hline(6, 9, 0, 'K');
  // Dibinde bir tutam çimen ve çiçek
  g.set(5, 24, 'g').set(4, 23, 'g').set(10, 24, 'g').set(11, 23, 'h').set(11, 22, 'p');
  return g.toRows();
}

export function getSignpostSprite() {
  return getSprite('building:signpost', buildSignpostRows);
}

// ---------------------------------------------------------------------------
// Park bankı
// ---------------------------------------------------------------------------

function buildParkBenchRows() {
  const g = new CharGrid(16, 16);
  g.hline(1, 14, 15, 'k').hline(2, 13, 14, 'k');
  // Sırtlık (iki çıta)
  g.rect(1, 2, 14, 6, 'K');
  g.hline(2, 13, 3, 'V').hline(2, 13, 4, 'f');
  g.hline(2, 13, 6, 'V').hline(2, 13, 5, 'K');
  g.hline(2, 13, 6, 'v');
  // Oturak
  g.rect(0, 8, 16, 4, 'K');
  g.hline(1, 14, 9, 'V').hline(1, 14, 10, 'v');
  // Dökme demir kıvrık ayaklar ve kolçaklar
  for (const x of [1, 13]) {
    g.vline(x, 1, 13, 'K').vline(x + 1, 1, 13, 'K');
    g.set(x, 13, 'K').set(x + (x === 1 ? -1 : 2), 14, 'K');
    g.set(x + (x === 1 ? 1 : 0), 7, 'Q');
  }
  g.vline(7, 12, 13, 'K').vline(8, 12, 13, 'K');
  return g.toRows();
}

export function getParkBenchSprite() {
  return getSprite('building:parkBench', buildParkBenchRows);
}

// ---------------------------------------------------------------------------
// Çiçek saksısı
// ---------------------------------------------------------------------------

const PLANTER_FLOWERS = ['p', 'P', 'i', 'o', 'u', 'O'];

function buildPlanterRows(tone, frame) {
  const g = new CharGrid(16, 16);
  g.ellipse(8, 15, 6.5, 1.2, 'k');
  // Taş çanak
  g.rect(2, 9, 12, 2, 'K');
  g.rect(3, 11, 10, 3, 'K');
  g.hline(3, 12, 9, 'q').hline(3, 12, 10, 'r');
  g.hline(4, 11, 11, 'r').hline(4, 11, 12, 'R');
  g.hline(5, 10, 14, 'K');
  g.set(5, 12, 'q').set(9, 11, 'q');
  // Yapraklar ve çiçekler (rüzgârda bir piksel eğilir)
  const sway = frame % 2;
  for (let i = 0; i < 6; i++) {
    const x = 3 + i * 2 + (i % 2 === 0 ? sway : 0);
    const y = 4 + ((i * 3) % 4);
    g.vline(x, y + 1, 8, i % 2 ? 'f' : 'v');
    g.set(x - 1, y + 2, 'v').set(x + 1, y + 3, 'V');
    const color = PLANTER_FLOWERS[(tone + i) % PLANTER_FLOWERS.length];
    g.set(x, y, color).set(x - 1, y, color).set(x + 1, y, color).set(x, y - 1, color);
    g.set(x, y, 'P');
  }
  g.hline(3, 12, 8, 'f');
  return g.toRows();
}

export function getPlanterSprite(tone = 0, frame = 0) {
  return getSprite(`building:planter:${tone % 3}:${frame % 2}`, () => buildPlanterRows(tone % 3, frame % 2));
}

// ---------------------------------------------------------------------------
// Süs ağaçları (huş, meşe, çam)
// ---------------------------------------------------------------------------

/** Yaprak bulutunu dokulandırır: koyu kenar, gölge ve ışık benekleri (meşe tonları; mevsim boyası bunları değiştirir). */
function shadeCanopy(g, leaf, shade, light, top, bottom) {
  for (let y = top; y <= bottom; y++) {
    for (let x = 0; x < g.width; x++) {
      if (g.get(x, y) !== leaf) continue;
      const below = g.get(x, y + 1);
      const right = g.get(x + 1, y);
      if (below === '.' || below === null || right === '.' || right === null) g.set(x, y, shade);
      else if ((x * 5 + y * 3) % 7 === 0) g.set(x, y, light);
      else if ((x * 3 + y * 7) % 11 === 0) g.set(x, y, shade);
    }
  }
}

function outlineCanopy(g, fill, outline) {
  const cells = [];
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (g.get(x, y) !== '.') continue;
      const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => fill.includes(g.get(x + dx, y + dy)));
      if (touches) cells.push([x, y]);
    }
  }
  for (const [x, y] of cells) g.set(x, y, outline);
}

function buildSaplingRows(kind) {
  const g = new CharGrid(16, ORNAMENTAL_TREE_ART.sapling);
  g.ellipse(8, 15, 4, 1, 'k');
  // Küçük destek kazığı ve bağ
  g.vline(10, 6, 14, 'w').set(10, 5, 'X').set(9, 10, 'E');
  g.vline(7, 9, 14, kind === 'birch' ? 'q' : 'w');
  if (kind === 'pine') {
    g.hline(6, 8, 9, 'J').hline(5, 9, 10, 'L').hline(6, 8, 7, 'L').hline(5, 9, 8, 'J').set(7, 6, 'J');
    outlineCanopy(g, ['J', 'L'], 'F');
  } else {
    g.ellipse(7, 7, 3.2, 2.6, 'v');
    g.set(5, 6, 'V').set(8, 6, 'V').set(7, 8, 'f');
    outlineCanopy(g, ['v', 'V', 'f'], 'F');
  }
  g.hline(5, 9, 14, 'D').set(6, 13, 'd').set(8, 13, 'd');
  return g.toRows();
}

function buildBroadleafRows(kind, grown) {
  const height = grown ? ORNAMENTAL_TREE_ART.grown : ORNAMENTAL_TREE_ART.young;
  const g = new CharGrid(16, height);
  const birch = kind === 'birch';
  const base = height - 1;
  g.ellipse(8, base - 0.5, grown ? 6.5 : 4.5, 1.5, 'k');
  // Gövde
  const trunkTop = grown ? (birch ? 17 : 19) : 12;
  const tw = grown && !birch ? 3 : 2;
  const tx = 8 - Math.floor(tw / 2);
  for (let y = trunkTop; y <= base - 1; y++) {
    for (let i = 0; i < tw; i++) g.set(tx + i, y, birch ? (i === 0 ? 'u' : 'q') : i === 0 ? 'w' : 'x');
    if (birch && (y * 5) % 7 === 0) g.set(tx + (y % 2), y, 'K'); // huşun kara benekleri
  }
  g.set(tx - 1, base - 1, birch ? 'q' : 'w').set(tx + tw, base - 1, birch ? 'r' : 'x');
  // Taç
  if (birch) {
    // Huş: dar, yukarı uzanan, salkım salkım dallar
    const blobs = grown
      ? [[8, 10, 4.4, 8.5], [5, 15, 2.6, 3.4], [11, 15, 2.6, 3.4], [8, 3, 2.8, 2.6]]
      : [[8, 7, 3.6, 6.2], [8, 2.5, 2, 1.8]];
    for (const [cx, cy, rx, ry] of blobs) g.ellipse(cx, cy, rx, ry, 'v');
  } else {
    // Meşe: geniş, yuvarlak, gölgelik taç
    const blobs = grown
      ? [[8, 11, 7.6, 8], [3.5, 15, 3.4, 3.6], [12.5, 15, 3.4, 3.6], [8, 4, 4.6, 3.4]]
      : [[8, 7, 5.4, 6], [8, 3, 3.2, 2.4]];
    for (const [cx, cy, rx, ry] of blobs) g.ellipse(cx, cy, rx, ry, 'v');
  }
  shadeCanopy(g, 'v', 'f', 'V', 0, trunkTop + 2);
  g.set(6, 3, 'H').set(7, 4, 'V');
  outlineCanopy(g, ['v', 'V', 'f', 'H'], 'F');
  return g.toRows();
}

function buildPineRows(grown) {
  const height = grown ? ORNAMENTAL_TREE_ART.grown : ORNAMENTAL_TREE_ART.young;
  const g = new CharGrid(16, height);
  const base = height - 1;
  g.ellipse(8, base - 0.5, grown ? 5.5 : 4, 1.4, 'k');
  g.vline(7, base - 5, base - 1, 'w').vline(8, base - 5, base - 1, 'x');
  // Katman katman üçgen dallar
  const tiers = grown ? 5 : 3;
  const bottom = base - 5;
  const step = Math.floor((bottom - 1) / tiers);
  for (let t = 0; t < tiers; t++) {
    const tipY = 1 + t * step;
    const halfMax = 2 + t * (grown ? 1.3 : 1.6);
    for (let y = tipY; y <= tipY + step + 1 && y <= bottom; y++) {
      const half = Math.min(halfMax, ((y - tipY + 1) / (step + 1)) * halfMax + 0.5);
      for (let x = Math.round(8 - half); x <= Math.round(7 + half); x++) g.set(x, y, x < 8 ? 'L' : 'J');
    }
  }
  // Katman diplerinde koyu gölge çizgisi: dallar kat kat okunsun
  for (let t = 0; t < tiers - 1; t++) {
    const y = 1 + (t + 1) * step;
    for (let x = 0; x < 16; x++) if ((x + t) % 3 !== 0 && (g.get(x, y) === 'J' || g.get(x, y) === 'L')) g.set(x, y, g.get(x, y) === 'L' ? 'J' : 'F');
  }
  outlineCanopy(g, ['J', 'L'], 'F');
  return g.toRows();
}

/** kind: 'birch' | 'oak' | 'pine'; stage: 0 fidan, 1 genç ağaç, 2 ulu ağaç; season: mevsim anahtarı */
export function getOrnamentalTreeSprite(kind, stage = 2, season = 'summer') {
  const foliage = kind === 'pine' ? 'pine' : 'oak';
  // Huş sonbaharda altın sarısı olur (sonbahar tonlarının üçüncüsü), meşe kızıl
  const variant = kind === 'birch' ? 2 : 0;
  return getSprite(`building:tree:${kind}:${stage}:${season}`, () => {
    const rows = stage === 0 ? buildSaplingRows(kind) : kind === 'pine' ? buildPineRows(stage === 2) : buildBroadleafRows(kind, stage === 2);
    return seasonalFoliageRows(rows, season, foliage, variant);
  });
}
