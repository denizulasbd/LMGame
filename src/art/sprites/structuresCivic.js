// 10. aşama: Belediye Konağı / Meydan Konağı (3x3, görsel 48x72).
//   - iki katlı, krem sıvalı kanatlar; kırmızı kiremitli kırma çatılar
//   - ortada dört sütunlu revak, altın arma işlemeli üçgen alınlık, kemerli çift kanat kapı, geniş taş basamaklar
//   - alınlığın üstünde saat kulesi (beyaz kadran, akrep ve yelkovan), mavi kubbe, direkte dalgalanan
//     kırmızı bayrak (3 kare)
//   - sütunlar arasında asılı kırmızı flamalar; basamakların iki yanında geceleri yanan fenerler; geceleri
//     pencereler sarı yanar (ışık noktaları TOWN_HALL_ART.windows / lamps)
// Görsel yapının kapladığı karoların ALT kenarına hizalanır; kule üstteki karolara 24 piksel taşar.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const TOWN_HALL_ART = {
  width: 48,
  height: 72,
  windows: [
    { x: 6.5, y: 43.5 },
    { x: 11.5, y: 43.5 },
    { x: 36.5, y: 43.5 },
    { x: 41.5, y: 43.5 },
    { x: 6.5, y: 55.5 },
    { x: 11.5, y: 55.5 },
    { x: 36.5, y: 55.5 },
    { x: 41.5, y: 55.5 },
  ],
  lamps: [
    { x: 15.5, y: 61.5 },
    { x: 32.5, y: 61.5 },
  ],
  clock: { x: 24, y: 15 },
};

// Bayrağın üç dalga karesi (direğin sağına doğru; kırmızı, altın kenar)
const FLAGS = [
  ['oooooo.', 'oPooooo', 'oooooo.', 'ooooo..'],
  ['ooooo..', 'oPooooo', 'ooooooo', '.ooooo.'],
  ['oooo...', 'oPoooo.', 'oooooo.', 'ooooooo'],
];

/** Kemerli pencere: koyu çerçeve, cam, ortada kayıt; altta denizlik. */
function windowAt(g, x, y, lit) {
  g.rect(x, y, 5, 7, 'K');
  g.rect(x + 1, y + 1, 3, 5, lit ? 'y' : 'a');
  g.set(x, y, '.').set(x + 4, y, '.');
  g.hline(x + 1, x + 3, y, 'K');
  g.vline(x + 2, y + 1, y + 5, 'K');
  g.hline(x + 1, x + 3, y + 3, 'K');
  if (lit) g.set(x + 1, y + 4, 'P');
  else g.set(x + 1, y + 1, 'u');
  g.hline(x - 1, x + 5, y + 7, 'q');
}

function buildTownHallRows(lit, frame) {
  const g = new CharGrid(TOWN_HALL_ART.width, TOWN_HALL_ART.height);
  // Gölge ve önündeki taş meydan şeridi
  g.rect(1, 69, 47, 3, 'k');

  // Kanatlar: iki katlı sıvalı duvar, katlar arası silme, taş kaide
  g.rect(1, 36, 46, 32, 'K');
  g.rect(2, 37, 44, 30, 'S');
  for (let x = 2; x <= 45; x++) {
    if (x % 9 === 0) g.vline(x, 37, 64, 's');
  }
  g.hline(2, 45, 49, 'z').hline(2, 45, 50, 'E');
  g.rect(2, 63, 44, 4, 'r');
  g.hline(2, 45, 63, 'q');
  for (let x = 4; x < 46; x += 5) g.set(x, 65, 'M');
  // Kanat pencereleri (iki kat)
  for (const x of [4, 9, 34, 39]) {
    windowAt(g, x, 40, lit);
    windowAt(g, x, 52, lit);
  }

  // Kırma çatılar (kanatların üstünde)
  for (let y = 26; y <= 36; y++) {
    const inset = Math.max(0, Math.floor((36 - y) * 0.9));
    for (const [x0, x1] of [[0 + inset, 17], [30, 47 - inset]]) {
      for (let x = x0; x <= x1; x++) g.set(x, y, (y - 26) % 3 === 2 ? 'U' : (x + y) % 5 === 0 ? 'Z' : 'C');
      g.set(x0, y, 'K').set(x1, y, 'K');
    }
  }
  g.hline(0, 47, 36, 'K');
  g.hline(1, 46, 35, 'U');

  // Saat kulesi: revakın alınlığının arkasından yükselir (önce çizilir, alınlık dibini örter)
  g.rect(19, 9, 10, 16, 'K');
  g.rect(20, 10, 8, 15, 'S');
  g.vline(27, 10, 24, 's');
  g.hline(18, 29, 9, 'K');
  g.ellipse(24, 15, 3.6, 3.6, 'K');
  g.ellipse(24, 15, 2.7, 2.7, 'u');
  g.set(24, 13, 'K').set(24, 14, 'K').set(25, 15, 'K').set(26, 15, 'K'); // akrep ve yelkovan
  g.set(24, 15, 'R');
  // Mavi kubbe
  for (let y = 4; y <= 8; y++) {
    const half = Math.max(2, Math.round(Math.sqrt(Math.max(0, 1 - ((8 - y) / 4.6) ** 2)) * 5.5));
    for (let x = 24 - half; x <= 23 + half; x++) g.set(x, y, x >= 24 + half / 3 ? 'n' : y < 6 ? 'c' : 'B');
    g.set(24 - half, y, 'K').set(23 + half, y, 'K');
  }
  g.hline(21, 26, 3, 'K');
  // Direk ve dalgalanan bayrak
  g.vline(23, 0, 3, 'K');
  FLAGS[frame % FLAGS.length].forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '.') g.set(24 + x, y, c);
    });
  });

  // Revak: gölgeli iç duvar, alınlık, dört sütun
  g.rect(13, 31, 22, 33, 'K');
  g.rect(14, 33, 20, 30, 's');
  g.rect(15, 34, 18, 28, 'z');
  // Alınlık (üçgen) ve altın arma
  for (let y = 20; y <= 31; y++) {
    const half = Math.round((y - 20) * 1.05);
    const x0 = 23 - half;
    const x1 = 24 + half;
    for (let x = x0; x <= x1; x++) g.set(x, y, 'S');
    g.set(x0, y, 'K').set(x1, y, 'K');
  }
  g.hline(11, 36, 32, 'K');
  g.hline(12, 35, 31, 'q');
  g.ellipse(24, 27.5, 3.2, 2.6, 'K');
  g.ellipse(24, 27.5, 2.3, 1.7, 'P');
  g.set(24, 27, 'Y').set(23, 28, 'Y').set(24, 26, 'u');
  // Sütunlar: açık gövde, gölgeli kenar, başlık ve kaide
  for (const x of [14, 19, 27, 32]) {
    g.rect(x, 33, 3, 29, 'K');
    g.vline(x + 1, 34, 61, 'u');
    g.set(x + 1, 47, 'q').set(x + 1, 55, 'q');
    g.hline(x - 1, x + 3, 33, 'q');
    g.hline(x - 1, x + 3, 61, 'q');
  }
  // Kemerli çift kanat kapı ve üstündeki tepe penceresi
  g.rect(20, 48, 8, 14, 'K');
  g.rect(21, 50, 6, 12, 'w');
  g.hline(22, 25, 49, 'w');
  g.vline(23, 50, 61, 'K').vline(24, 50, 61, 'K');
  g.vline(22, 51, 60, 'x').vline(26, 51, 60, 'x');
  g.set(22, 56, 'P').set(25, 56, 'P');
  g.rect(21, 45, 6, 2, 'K');
  g.hline(22, 25, 46, lit ? 'y' : 'a');
  // Flamalar: dış sütunlarla iç sütunlar arasında
  for (const x of [17, 30]) {
    g.rect(x, 36, 2, 8, 'o');
    g.set(x, 43, '.').set(x + 1, 44, 'o');
    g.set(x, 38, 'P').set(x + 1, 40, 'P');
  }
  // Basamaklar
  g.rect(12, 62, 24, 6, 'K');
  g.hline(13, 34, 62, 'q').hline(13, 34, 63, 'r');
  g.hline(14, 33, 64, 'q').hline(14, 33, 65, 'r');
  g.hline(15, 32, 66, 'q').hline(15, 32, 67, 'R');
  // Fenerler (basamakların iki yanında)
  for (const x of [15, 32]) {
    g.vline(x, 61, 67, 'K');
    g.rect(x - 1, 59, 3, 3, 'K');
    g.set(x, 60, lit ? 'P' : 'R');
  }
  return g.toRows();
}

/**
 * @param {boolean} lit gece: pencereler ve fenerler yanar
 * @param {number} frame bayrağın dalgası
 */
export function getTownHallSprite(lit = false, frame = 0) {
  const f = frame % FLAGS.length;
  return getSprite(`building:townHall:${lit ? 1 : 0}:${f}`, () => buildTownHallRows(lit, f));
}
