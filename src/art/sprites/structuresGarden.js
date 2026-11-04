// 13. aşama: peyzaj ve süsleme yapıları.
//   Kiraz Çiçeği Ağacı (1x1, görsel 16x28): ilkbaharda pembe-beyaz çiçek bulutu, yazın yeşil yapraklar arasında pembe
//     çiçekler, sonbaharda altın-kehribar yapraklar, kışın karla örtülü dallarda pembe tomurcuklar. Rüzgârda savrulan
//     yaprakları Building.drawEffects çizer (CHERRY_ART.petals: mevsime göre renkler).
//   Ahşap Çardak (2x2, görsel 32x56): iki katman. Arka katman: sekizgen ahşap döşeme, arka korkuluk ve kafes, iki bank;
//     ön katman: köşe direkleri, sarmaşıklar, alçak ön korkuluk ve çiçek saçaklı ahşap çatı. Banklarda oturan sakinler
//     iki katmanın arasında çizilir (çatının altında kalırlar).
//   Mermer Kemer (1x1, görsel 16x32): iki beyaz mermer sütun ve yarım daire kemer, kilit taşı, kemere sarılmış çiçekli
//     sarmaşık. Altından geçilir.
//   Çiçekli Çit (1x1, görsel 16x20): beyaz boyalı kazıklar, saksı çiçekleri; yanındaki çitlerle birleşir (connect).
// Görseller yapının kapladığı karoların ALT kenarına hizalanır.
import { getSprite, CharGrid, composeRows } from '../PixelSprite.js';

export const CHERRY_ART = {
  width: 16,
  height: 28,
  canopy: { x: 8, y: 9, rx: 7, ry: 6 },
  // Savrulan yaprakların renkleri (mevsime göre; kışın yaprak dökülmez)
  petals: {
    spring: ['#f06b8a', '#ffffff', '#f9b4c6'],
    summer: ['#f06b8a', '#f9b4c6', '#7fcf5a'],
    autumn: ['#f0a830', '#d4652a', '#f6d860'],
    winter: [],
  },
};

export const GAZEBO_ART = { width: 32, height: 56 };
export const ARCH_ART = { width: 16, height: 32 };
export const FENCE_ART = { width: 16, height: 20 };

// Kiraz tacının renkleri (mevsime göre): [gölge, ana, ışık, vurgu, yaprak]
const CHERRY_TONES = {
  spring: { shade: 'l', main: 'p', light: 'u', accent: 'u', leaf: 'p' },
  summer: { shade: 'f', main: 'v', light: 'p', accent: 'u', leaf: 'p' },
  autumn: { shade: '2', main: '3', light: '4', accent: '9', leaf: '4' },
  winter: { shade: '5', main: '7', light: '8', accent: 'p', leaf: '6' },
};

function buildCherryRows(season) {
  const t = CHERRY_TONES[season] ?? CHERRY_TONES.spring;
  const g = new CharGrid(CHERRY_ART.width, CHERRY_ART.height);
  g.rect(3, 25, 11, 2, 'k');
  // Gövde: hafif kıvrık, tacın içine uzanan iki dal
  g.vline(7, 15, 25, 'x').vline(8, 15, 25, 'w');
  g.set(6, 25, 'x').set(9, 25, 'x').set(9, 24, 'w').set(6, 24, 'x');
  g.line(8, 16, 11, 13, 'w');
  g.line(7, 17, 4, 14, 'x');
  // Taç: bulut gibi üst üste binen kümeler (kenarı tırtıklı)
  const blobs = [
    [8, 9.5, 6, 4.6],
    [4, 11, 3.4, 3],
    [12, 11, 3.4, 3],
    [5.5, 6, 3.4, 3],
    [10.5, 6, 3.4, 3],
    [8, 13, 4.2, 2.6],
    [8, 3.8, 3, 2.4],
  ];
  for (const [cx, cy, rx, ry] of blobs) g.ellipse(cx, cy, rx + 0.85, ry + 0.85, 'K');
  for (const [cx, cy, rx, ry] of blobs) g.ellipse(cx, cy, rx, ry, t.main);
  // Işık sol üstten: köşegen boyunca gölge (alt-sağ) ve ışık (üst-sol)
  const { x: cx, y: cy } = { x: 8, y: 9 };
  for (let y = 0; y < 18; y++) {
    for (let x = 0; x < 16; x++) {
      if (g.get(x, y) !== t.main) continue;
      const d = (x - cx) / 7 + (y - cy) / 6;
      if (d > 0.55) g.set(x, y, t.shade);
      else if (d < -0.75) g.set(x, y, t.light);
    }
  }
  // Serpiştirilmiş çiçekler / vurgu noktaları
  for (const [x, y] of [[3, 9], [6, 4], [10, 5], [13, 10], [5, 12], [9, 11], [11, 8], [7, 7], [2, 12], [12, 13], [8, 14], [4, 7]]) {
    if (g.get(x, y) !== 'K' && g.get(x, y) !== '.') g.set(x, y, (x + y) % 3 === 0 ? t.accent : t.leaf);
  }
  if (season === 'winter') {
    // Karlı dalların altında pembe tomurcuklar
    for (const [x, y] of [[4, 13], [9, 14], [12, 12], [6, 10], [10, 9]]) if (g.get(x, y) !== 'K') g.set(x, y, 'p');
  }
  // Dibinde düşmüş birkaç yaprak
  if (season !== 'winter') g.set(2, 26, t.leaf).set(12, 26, t.leaf).set(10, 27, t.light);
  return g.toRows();
}

export function getCherryTreeSprite(season = 'spring') {
  return getSprite(`building:cherryTree:${season}`, () => buildCherryRows(season));
}

// ---------------------------------------------------------------------------
// Ahşap Çardak
// ---------------------------------------------------------------------------

/** Sarmaşık: dikey bir direğe yaprak ve çiçek. */
function vine(g, x, y0, y1, flower = 'p') {
  for (let y = y0; y <= y1; y++) {
    const side = (y * 5) % 3 === 0 ? -1 : 1;
    if (y % 2 === 0) g.set(x + side, y, y % 6 === 0 ? flower : 'v');
    if (y % 5 === 0) g.set(x - side, y, 'V');
  }
}

function gazeboBack() {
  const { width: W, height: H } = GAZEBO_ART;
  const g = new CharGrid(W, H);
  g.rect(1, 53, 30, 3, 'k');
  // Sekizgen ahşap döşeme (üstten bakış: açık kalaslar), ön kenarı ve basamak
  g.rect(3, 41, 26, 12, 'K');
  g.rect(1, 43, 30, 8, 'K');
  g.rect(4, 42, 24, 10, 'E');
  g.rect(2, 44, 28, 6, 'E');
  for (let y = 44; y < 52; y += 2) g.hline(2, 29, y, 'X');
  for (let y = 43; y < 52; y += 2) for (let x = 5 + (y % 4 === 1 ? 4 : 0); x < 29; x += 8) g.set(x, y, 'X');
  g.rect(3, 51, 26, 2, 'w');
  g.hline(3, 28, 52, 'x');
  g.rect(10, 53, 12, 2, 'K');
  g.hline(11, 20, 53, 'E');
  // Arka direkler ve sarmaşıklı kafes duvar
  for (const x of [5, 26]) {
    g.rect(x, 20, 2, 22, 'K');
    g.vline(x, 21, 41, 'w');
  }
  g.rect(7, 25, 19, 13, 'x');
  for (let y = 26; y < 37; y++) for (let x = 7; x < 26; x++) if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) g.set(x, y, 'X');
  g.hline(6, 26, 24, 'E').hline(6, 26, 25, 'w');
  vine(g, 9, 26, 36, 'p');
  vine(g, 16, 25, 35, 'P');
  vine(g, 23, 26, 36, 'i');
  // Kafesin önünde uzun bank (iki oturak: x 10 ve 22, ayak çizgisi 49)
  g.rect(6, 38, 21, 2, 'K');
  g.hline(7, 25, 38, 'E');
  g.rect(6, 40, 21, 2, 'w');
  g.hline(6, 26, 41, 'K');
  for (const x of [7, 16, 25]) g.vline(x, 42, 43, 'x');
  return g.toRows();
}

function gazeboFront() {
  const { width: W, height: H } = GAZEBO_ART;
  const g = new CharGrid(W, H);
  // Ön köşe direkleri ve sarmaşıklar
  for (const x of [1, 29]) {
    g.rect(x, 18, 2, 34, 'K');
    g.vline(x, 19, 51, 'X');
  }
  vine(g, 2, 22, 48, 'p');
  vine(g, 29, 22, 48, 'u');
  // Alçak ön korkuluk (ortası giriş)
  for (const [a, b] of [[3, 8], [23, 28]]) {
    g.hline(a, b, 47, 'K').hline(a, b, 48, 'E');
    for (let x = a; x <= b; x += 2) g.vline(x, 49, 51, 'w');
  }
  // Ahşap çatı: sivri, saçakları geniş
  for (let y = 5; y <= 19; y++) {
    const half = Math.round(2 + (y - 5) * 1.0);
    const x0 = 16 - half;
    const x1 = 15 + half;
    for (let x = x0; x <= x1; x++) g.set(x, y, (y - 5) % 4 === 3 ? 'x' : (x + y * 3) % 9 === 0 ? 'E' : x < 16 ? 'X' : 'w');
    g.set(x0, y, 'K').set(x1, y, 'K');
  }
  g.hline(0, 31, 20, 'K');
  g.hline(1, 30, 19, 'x');
  g.rect(15, 1, 2, 5, 'K');
  g.set(15, 2, 'P').set(16, 2, 'Y').set(15, 3, 'P').set(16, 3, 'P');
  // Saçaktan sarkan çiçek girlandı
  for (let x = 2; x < 30; x++) {
    const drop = 21 + Math.round(1.5 + Math.sin(x * 0.75) * 1.5);
    g.vline(x, 21, drop, x % 2 === 0 ? 'v' : 'f');
    if (x % 4 === 1) g.set(x, drop + 1, ['p', 'u', 'P', 'i'][(x >> 2) % 4]);
  }
  return g.toRows();
}

/** layer: 'back' | 'front' | 'full' (menü ve önizleme) */
export function getGazeboLayer(layer = 'full') {
  return getSprite(`building:gazebo:${layer}`, () => {
    if (layer === 'back') return gazeboBack();
    if (layer === 'front') return gazeboFront();
    return composeRows(gazeboBack(), [[gazeboFront(), 0, 0]]);
  });
}

// ---------------------------------------------------------------------------
// Mermer Kemer
// ---------------------------------------------------------------------------

function buildArchRows() {
  const g = new CharGrid(ARCH_ART.width, ARCH_ART.height);
  g.hline(0, 3, 31, 'k').hline(12, 15, 31, 'k');
  // Sütunlar ve kaideleri
  for (const x of [0, 12]) {
    g.rect(x, 10, 4, 18, 'K');
    g.vline(x + 1, 11, 27, 'u').vline(x + 2, 11, 27, 'q');
    g.rect(x, 26, 4, 5, 'K');
    g.hline(x + 1, x + 2, 27, 'q').hline(x + 1, x + 2, 28, 'r').hline(x + 1, x + 2, 29, 'r');
    g.hline(x, x + 3, 10, 'K');
  }
  // Yarım daire kemer (dış K, iç beyaz mermer, iç kenar gölge)
  for (let y = 0; y <= 11; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - 8;
      const dy = y + 0.5 - 11;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 8.2 && d > 7.1) g.set(x, y, 'K');
      else if (d <= 7.1 && d > 4.4) g.set(x, y, dy < -5 ? 'u' : 'q');
      else if (d <= 4.4 && d > 3.6) g.set(x, y, 'K');
    }
  }
  // Kilit taşı
  g.rect(7, 2, 2, 3, 'P');
  g.set(7, 2, 'Y');
  // Kemere sarılmış çiçekli sarmaşık
  for (const [x, y, c] of [[2, 6, 'v'], [3, 4, 'V'], [5, 3, 'p'], [11, 3, 'v'], [13, 5, 'u'], [14, 8, 'v'], [1, 9, 'p'], [2, 13, 'v'], [13, 15, 'V'], [14, 18, 'p'], [1, 20, 'v'], [2, 23, 'i']]) g.set(x, y, c);
  return g.toRows();
}

export function getMarbleArchSprite() {
  return getSprite('building:marbleArch', buildArchRows);
}

// ---------------------------------------------------------------------------
// Çiçekli Çit
// ---------------------------------------------------------------------------

const FLOWER_COLORS = ['p', 'P', 'i', 'o', 'u'];

function buildFenceRows(connect) {
  const g = new CharGrid(FENCE_ART.width, FENCE_ART.height);
  const { left, right, up, down } = connect;
  const x0 = left ? 0 : 2;
  const x1 = right ? 15 : 13;
  const horizontal = left || right || !(up || down);
  if (horizontal) {
    g.hline(x0, x1, 18, 'k').hline(x0, x1, 19, 'k');
    // Kuşaklar (arkada), üstünde beyaz kazıklar: iki piksel, sivri uçlu, ince gri gölgeli
    g.hline(x0, x1, 10, 'q').hline(x0, x1, 11, 'r');
    g.hline(x0, x1, 14, 'q').hline(x0, x1, 15, 'r');
    for (let x = x0 + (left ? 1 : 0); x < x1; x += 3) {
      g.vline(x, 8, 17, 'u').vline(x + 1, 8, 17, 'q');
      g.set(x, 7, 'u');
      g.set(x, 17, 'r').set(x + 1, 17, 'R');
    }
  }
  if (up || down) {
    // Derinliğe uzanan çit: ortada direk, yukarı / aşağı uzanır
    const top = up ? 0 : 6;
    const bottom = down ? 19 : 17;
    g.vline(7, top, bottom, 'u').vline(8, top, bottom, 'q').vline(9, top, bottom, 'r');
    if (!up) g.set(7, top - 1, 'u');
    for (let y = top + 2; y <= bottom; y += 4) g.hline(6, 10, y, 'q');
  }
  // Ortadaki saksı ve çiçekler (renk düzeni yöne göre değişir)
  const seed = (left ? 1 : 0) + (right ? 2 : 0) + (up ? 4 : 0) + (down ? 8 : 0);
  g.stamp(['.KKKK.', 'KCZCCK', '.KUUK.'], 5, 15);
  for (let i = 0; i < 5; i++) {
    const x = 5 + i;
    const y = 12 + (i % 2);
    g.set(x, y + 1, 'v');
    g.set(x, y, FLOWER_COLORS[(seed + i) % FLOWER_COLORS.length]);
  }
  g.set(7, 11, 'V').set(8, 12, 'v');
  return g.toRows();
}

/** connect: { left, right, up, down } yanındaki çitler */
export function getFlowerFenceSprite(connect = {}) {
  const c = { left: Boolean(connect.left), right: Boolean(connect.right), up: Boolean(connect.up), down: Boolean(connect.down) };
  const key = `${c.left ? 1 : 0}${c.right ? 1 : 0}${c.up ? 1 : 0}${c.down ? 1 : 0}`;
  return getSprite(`building:flowerFence:${key}`, () => buildFenceRows(c));
}
