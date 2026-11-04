// (16. aşama) Keşif seferlerinden gelen ve kasabaya dikilen yapılar.
//   Üzüm Asması (1x1, görsel 16x30): iki ahşap direk ve kemerli bir çardak kirişi; üstünde sarmaşık yapraklar.
//     İlkbaharda beyaz çiçekler, yazın yeşil ve mor salkımlar, sonbaharda kızıl yapraklar arasında olgun salkımlar,
//     kışın karlı çıplak dallar.
//   Kadim Meşale (1x1, görsel 16x30): üzeri kadim yazılarla oyulmuş taş sütun ve bronz kâse; gece mavi alevle yanar
//     (üç kare titrer), gündüz kâsede soluk mavi bir köz kalır.
// Görseller yapının kapladığı karonun ALT kenarına hizalanır.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const VINE_ART = { width: 16, height: 30 };
export const TORCH_ART = { width: 16, height: 30, light: { x: 8, y: 6 }, frames: 3 };

const VINE_TONES = {
  spring: { shade: 'f', leaf: 'v', light: 'V', fruit: null, flower: 'u' },
  summer: { shade: 'f', leaf: 'v', light: 'V', fruit: 'i', flower: null },
  autumn: { shade: '2', leaf: '3', light: '4', fruit: 'm', flower: null },
  winter: { shade: 'x', leaf: null, light: null, fruit: null, flower: null },
};

function buildVineRows(season) {
  const t = VINE_TONES[season] ?? VINE_TONES.summer;
  const g = new CharGrid(VINE_ART.width, VINE_ART.height);
  g.ellipse(8, 28.5, 7, 1.3, 'k');
  // Direkler ve kemerli kiriş
  for (const x of [2, 13]) {
    g.vline(x - 1, 9, 28, 'K').vline(x, 9, 28, 'w').vline(x + 1, 9, 28, 'K');
    g.set(x, 9, 'E');
  }
  g.hline(1, 14, 8, 'K').hline(2, 13, 9, 'X').hline(1, 14, 10, 'K');
  g.hline(4, 11, 7, 'K').hline(5, 10, 6, 'K');
  // Sarmaşık gövdesi direklere dolanır
  for (let y = 11; y <= 27; y += 3) {
    g.set(2, y, 'x').set(3, y + 1, 'x');
    g.set(13, y + 1, 'x').set(12, y + 2, 'x');
  }
  if (!t.leaf) {
    // Kış: çıplak dallar ve kar
    g.line(3, 9, 7, 4, 'x').line(12, 9, 9, 4, 'x');
    g.hline(1, 14, 7, '7').hline(4, 11, 5, '8');
    g.set(2, 8, '8').set(13, 8, '8');
    return g.toRows();
  }
  // Yaprak bulutu: kirişin üstünde ve iki yanında sarkan
  const blobs = [
    [8, 5, 6, 3],
    [3, 9, 2.6, 3],
    [13, 9, 2.6, 3],
    [2.5, 14, 2, 2.4],
    [13.5, 15, 2, 2.4],
    [3, 19, 1.8, 2],
    [13, 21, 1.8, 2],
  ];
  for (const [cx, cy, rx, ry] of blobs) g.ellipse(cx, cy, rx + 0.8, ry + 0.8, 'K');
  for (const [cx, cy, rx, ry] of blobs) g.ellipse(cx, cy, rx, ry, t.leaf);
  for (let y = 0; y < 26; y++) {
    for (let x = 0; x < 16; x++) {
      if (g.get(x, y) !== t.leaf) continue;
      if ((x * 7 + y * 3) % 5 === 0) g.set(x, y, t.shade);
      else if ((x + y * 2) % 7 === 0) g.set(x, y, t.light);
    }
  }
  // Kiriş yaprakların arasından görünür
  g.hline(5, 10, 9, 'X');
  if (t.fruit) {
    // Üzüm salkımları (ters üçgen)
    for (const [x, y] of [[4, 11], [11, 12], [7, 8], [2, 16], [13, 17]]) {
      g.hline(x - 1, x + 1, y, t.fruit).set(x, y + 1, t.fruit).set(x - 1, y, 'K').set(x + 1, y + 1, 'K');
      g.set(x, y, season === 'autumn' ? 'i' : 'l');
    }
  }
  if (t.flower) for (const [x, y] of [[5, 3], [10, 4], [3, 10], [12, 11], [8, 6], [2, 15], [14, 16]]) g.set(x, y, t.flower);
  return g.toRows();
}

export function getGrapeVineSprite(season = 'summer') {
  return getSprite(`building:grapeVine:${season}`, () => buildVineRows(season));
}

// Mavi alevin üç karesi: [alevin satırları] (x 5-10, y 1-7)
const FLAMES = [
  ['...cc.', '..cac.', '.caWac', '.caaac', '..cac.', '...N..'],
  ['..c...', '.cac..', '.caWc.', 'caaac.', '.cac..', '..N...'],
  ['....c.', '...cac', '..cWac', '.caaac', '..cac.', '...N..'],
];

function buildTorchRows(lit, frame) {
  const g = new CharGrid(TORCH_ART.width, TORCH_ART.height);
  g.ellipse(8, 28.5, 5, 1.3, 'k');
  // Basamaklı taş kaide
  g.rect(3, 25, 10, 4, 'K');
  g.rect(4, 26, 8, 2, 'r').hline(4, 11, 26, 'q');
  // Oyma yazılı sütun
  g.rect(5, 11, 6, 15, 'K');
  g.rect(6, 12, 4, 13, 'r');
  g.vline(9, 12, 24, 'R');
  for (const y of [14, 17, 20, 23]) g.set(7, y, lit ? 'c' : 'N').set(8, y + 1, lit ? 'a' : 'N');
  // Bronz kâse
  g.hline(3, 12, 8, 'K').hline(4, 11, 9, 'Y').hline(5, 10, 10, 'X').hline(4, 11, 11, 'K');
  g.set(3, 9, 'K').set(12, 9, 'K');
  if (lit) {
    const rows = FLAMES[frame % FLAMES.length];
    rows.forEach((line, dy) => [...line].forEach((ch, dx) => {
      if (ch !== '.') g.set(5 + dx, 1 + dy, ch);
    }));
  } else {
    // Gündüz: kâsede soluk mavi köz
    g.hline(6, 9, 8, 'N').set(7, 7, 'c').set(8, 8, 'b');
  }
  return g.toRows();
}

export function getAncientTorchSprite(lit, frame = 0) {
  const f = lit ? frame % TORCH_ART.frames : 0;
  return getSprite(`building:ancientTorch:${lit ? 1 : 0}:${f}`, () => buildTorchRows(lit, f));
}
