// 12. aşama: Büyük Ticaret Limanı / İhracat İskelesi (3x2, görsel 48x60) ve nehirdeki ticaret teknesi.
//   Liman ('right' yönünde; 'left' aynalanır): kumdaki sütunda kesme taş rıhtım ve kırmızı kiremitli küçük
//   liman ambarı (gece penceresi yanar, çatıda flama), önünde sandık, fıçı ve çuval yığınları; suya uzanan
//   kalın kazıklı ahşap iskele, üstünde ahşap yük vinci (tekne yanaşınca kancada bir sandık iner-kalkar),
//   halat kangalı, iskele ucunda babalar ve gece yanan liman feneri.
//   Şantiye: suya kazıklar çakılır, rıhtımın taşları dizilir, iskele kalasları döşenir (3 kademe).
//   Tekne (30x22, yandan): ahşap gövde, krem yelken (kırmızı şeritli), direkte flama, kıçta dümenci;
//   yüklüyken güvertede sandık ve çuvallar. İki kare: yelken şişer, flama dalgalanır, gövdede köpük.
// Görsel yapının kapladığı karoların ALT kenarına hizalanır; vinç ve ambar üstteki karolara 28 piksel taşar.
import { getSprite, CharGrid, flipRowsHorizontal } from '../PixelSprite.js';

export const HARBOR_ART = {
  width: 48,
  height: 60,
  light: { x: 45.5, y: 22.5 }, // liman fenerinin ışık noktası ('right' yönünde)
  window: { x: 8.5, y: 27.5 }, // ambar penceresi
};

export const BOAT_ART = { width: 30, height: 22 };

const FLAGS = [
  ['ooo.', 'oo..'],
  ['oooo', '.oo.'],
];

/** Üstten görünen tahta güverte: yatay kalaslar, derzler, kaydırmalı ek yerleri. */
function planks(g, x0, x1, y0, y1) {
  g.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, 'X');
  g.hline(x0, x1, y0, 'E');
  for (let y = y0 + 3; y <= y1; y += 3) g.hline(x0, x1, y, 'x');
  for (let band = 0; y0 + 1 + band * 3 <= y1; band++) {
    for (let x = x0 + 4 + (band % 2) * 5; x < x1; x += 10) {
      g.set(x, y0 + 1 + band * 3, 'x');
      g.set(x, y0 + 2 + band * 3, 'x');
    }
  }
}

/** Kazık: koyu kontur, ahşap gövde; dibinde suda köpük halkası. */
function pile(g, x, top, bottom) {
  g.rect(x, top, 3, bottom - top + 1, 'K');
  g.vline(x + 1, top, bottom - 1, 'w');
  g.set(x + 1, top, 'X');
  g.set(x - 1, bottom, 'a').set(x + 3, bottom, 'a').set(x - 2, bottom, 'W');
}

/** Sandık (5x5): koyu kontur, açık tahta, çapraz kuşak. */
function crate(g, x, y, tone = 'X') {
  g.rect(x, y, 5, 5, 'K');
  g.rect(x + 1, y + 1, 3, 3, tone);
  g.set(x + 1, y + 1, 'E');
  g.set(x + 2, y + 2, 'x');
}

/** Taş rıhtım ve kazıklar (inşaat aşamalarında da kullanılır). */
function quay(g, stage = 3) {
  // Kazıklar
  for (const x of [19, 28, 37, 44]) pile(g, x, stage >= 1 ? 50 : 52, 58);
  // Kesme taş rıhtım: üst yüzü düz taş, ön yüzü bloklar
  const rows = stage >= 2 ? 30 : 46;
  g.rect(0, rows, 19, 57 - rows, 'K');
  g.rect(1, rows + 1, 17, 52 - rows - 1, 'q');
  for (let y = rows + 4; y < 52; y += 5) g.hline(1, 17, y, 'r');
  for (let y = rows + 1; y < 52; y += 5) for (let x = 3 + ((y / 5) % 2) * 4; x < 18; x += 7) g.vline(x, y + 1, y + 3, 'r');
  g.rect(1, 52, 17, 4, 'R');
  g.hline(1, 17, 52, 'r');
  for (let x = 4; x < 18; x += 5) g.vline(x, 53, 55, 'M');
  g.hline(1, 18, 57, 'k');
}

function buildHarborRows(lit, frame, active) {
  const g = new CharGrid(HARBOR_ART.width, HARBOR_ART.height);
  // İskelenin suya düşen gölgesi
  g.hline(16, 47, 54, 'k').hline(17, 46, 55, 'k');
  quay(g, 3);

  // İskele: kalın kalaslar, ön yüzü ve kontur
  g.rect(15, 33, 33, 19, 'K');
  planks(g, 16, 46, 34, 49);
  g.rect(16, 50, 31, 2, 'w');
  g.hline(16, 46, 50, 'x');
  // Babalar (iskele ucunda)
  for (const y of [36, 45]) {
    g.rect(44, y, 3, 3, 'K');
    g.set(45, y + 1, 'r');
    g.set(45, y, 'q');
  }
  // Halat kangalı
  g.ellipse(22.5, 45, 3, 2.2, 'x');
  g.ellipse(22.5, 45, 2, 1.3, 'E');
  g.set(22, 45, 'x').set(23, 45, 'X');
  g.line(25, 46, 30, 48, 'E');

  // Liman ambarı (rıhtımın arka yarısında)
  g.rect(1, 21, 16, 15, 'K');
  g.rect(2, 22, 14, 13, 'w');
  for (let x = 3; x < 16; x += 3) g.vline(x, 22, 34, 'X');
  g.rect(10, 27, 5, 8, 'K');
  g.rect(11, 28, 3, 7, 'x');
  g.set(13, 31, 'P');
  g.rect(3, 25, 4, 4, 'K');
  g.rect(4, 26, 2, 2, lit ? 'y' : 'a');
  if (!lit) g.set(4, 26, 'u');
  // Kiremit çatı
  for (let y = 12; y <= 21; y++) {
    const inset = Math.max(0, Math.floor((21 - y) * 0.75));
    for (let x = inset; x <= 17 - inset; x++) g.set(x, y, (y - 12) % 3 === 2 ? 'U' : (x + y) % 5 === 0 ? 'Z' : 'C');
    g.set(inset, y, 'K').set(17 - inset, y, 'K');
  }
  g.hline(0, 17, 21, 'K');
  g.hline(5, 12, 11, 'K');
  // Çatıda flama
  g.vline(9, 6, 11, 'K');
  FLAGS[frame % FLAGS.length].forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '.') g.set(10 + x, 6 + y, c);
    });
  });

  // Rıhtımda sandık, fıçı ve çuval yığını
  crate(g, 1, 40);
  crate(g, 6, 41, 'w');
  crate(g, 3, 36);
  // Fıçı
  g.rect(12, 38, 5, 7, 'K');
  g.rect(13, 39, 3, 5, 'w');
  g.hline(13, 15, 40, 'q').hline(13, 15, 42, 'q');
  g.set(13, 39, 'X');
  // Çuvallar
  g.stamp(['.KKK.', 'KSSsK', 'KSssK', '.KKK.'], 11, 46);
  g.stamp(['.KK.', 'KSsK', 'KssK', '.KK.'], 2, 46);

  // Yük vinci: ahşap direk, kol, payanda, halat ve kanca; dibinde ırgat
  g.rect(31, 8, 3, 38, 'K');
  g.vline(32, 9, 44, 'w');
  g.set(32, 9, 'X');
  g.rect(26, 6, 22, 3, 'K');
  g.hline(27, 46, 7, 'X');
  g.line(33, 22, 43, 8, 'K');
  g.line(34, 22, 44, 9, 'w');
  g.rect(29, 42, 7, 5, 'K');
  g.rect(30, 43, 5, 3, 'x');
  g.ellipse(29.5, 39.5, 2.6, 2.6, 'K');
  g.ellipse(29.5, 39.5, 1.6, 1.6, 'X');
  g.set(29, 39, 'x');
  // Halat: tekne yanaşmışken kancadaki sandık iner-kalkar
  const drop = active ? (frame % 2 === 0 ? 24 : 30) : 20;
  g.vline(42, 9, drop, 'x');
  g.set(41, drop + 1, 'R').set(42, drop + 1, 'R').set(43, drop + 1, 'R');
  if (active) crate(g, 40, drop + 2);

  // Liman feneri (iskele ucunda)
  g.vline(46, 24, 48, 'K');
  g.vline(45, 25, 47, 'x');
  g.rect(44, 20, 4, 4, 'K');
  g.rect(45, 21, 2, 2, lit ? 'P' : 'R');
  if (lit) g.set(45, 21, 'y');
  g.hline(44, 47, 19, 'K');
  return g.toRows();
}

function buildHarborSiteRows(stage) {
  const g = new CharGrid(HARBOR_ART.width, HARBOR_ART.height);
  quay(g, stage);
  if (stage >= 1) {
    // Kalaslar yarıya kadar döşenmiş
    const end = stage >= 2 ? 46 : 32;
    g.rect(15, 41, end - 14, 11, 'K');
    planks(g, 16, end - 1, 42, 49);
    g.rect(16, 50, end - 16, 2, 'w');
  }
  // Kumda kalas ve taş yığını, kazık yığını
  g.stamp(['..KKKK', '.KqrqK', 'KqrqrK', 'KKKKKK'], 2, 24 + (stage >= 2 ? 0 : 18));
  if (stage < 2) {
    g.rect(4, 38, 12, 3, 'K');
    g.hline(5, 14, 39, 'E');
  }
  // Kazık çakma iskelesi (üç ayak ve tokmak)
  g.line(36, 26, 32, 44, 'x');
  g.line(36, 26, 40, 44, 'x');
  g.vline(36, 26, 44, 'w');
  g.rect(34, 30 + stage * 2, 5, 3, 'K');
  g.hline(35, 37, 31 + stage * 2, 'R');
  return g.toRows();
}

/** @param {boolean} flipped 'left' yönü: su solda */
export function getHarborSprite(lit = false, frame = 0, active = false, flipped = false) {
  const f = frame % 2;
  return getSprite(`building:harbor:${lit ? 1 : 0}:${f}:${active ? 1 : 0}:${flipped ? 'L' : 'R'}`, () => {
    const rows = buildHarborRows(lit, f, active);
    return flipped ? flipRowsHorizontal(rows) : rows;
  });
}

export function getHarborSiteSprite(stage, flipped = false) {
  return getSprite(`building:harbor:site:${stage}:${flipped ? 'L' : 'R'}`, () => {
    const rows = buildHarborSiteRows(stage);
    return flipped ? flipRowsHorizontal(rows) : rows;
  });
}

// ---------------------------------------------------------------------------
// Ticaret teknesi
// ---------------------------------------------------------------------------

function buildBoatRows(loaded, frame) {
  const { width: W, height: H } = BOAT_ART;
  const g = new CharGrid(W, H);
  // Gövde: kıç (sol) alçak, pruva (sağ) kalkık
  const hull = [
    [14, 2, 27],
    [15, 3, 27],
    [16, 4, 26],
    [17, 5, 25],
    [18, 7, 23],
  ];
  for (const [y, x0, x1] of hull) g.hline(x0 - 1, x1 + 1, y, 'K');
  for (const [y, x0, x1] of hull.slice(0, -1)) g.hline(x0, x1, y, y === 14 ? 'E' : y === 15 ? 'X' : y === 16 ? 'w' : 'x');
  g.hline(2, 27, 13, 'K');
  // Kalkık pruva ve kıç
  g.rect(27, 10, 2, 4, 'K');
  g.set(27, 11, 'E').set(27, 12, 'X');
  g.rect(1, 11, 2, 3, 'K');
  g.set(2, 12, 'X');
  // Gövde boyası: mavi şerit ve lombozlar
  g.hline(4, 25, 15, 'B');
  for (const x of [8, 14, 20]) g.set(x, 15, 'n');
  // Direk, seren ve yelken (yelken rüzgârla şişer)
  g.vline(15, 1, 12, 'x');
  g.vline(16, 2, 12, 'K');
  g.hline(8, 22, 2, 'K');
  g.hline(9, 21, 10, 'K');
  const belly = frame % 2 === 0 ? 0 : 1;
  for (let y = 3; y <= 9; y++) {
    const bulge = y >= 4 && y <= 8 ? belly : 0;
    g.hline(9, 21 + bulge, y, 'S');
    g.set(8, y, 'K').set(22 + bulge, y, 'K');
  }
  g.hline(9, 21, 3, 'y');
  g.hline(9, 21 + belly, 6, 'o');
  g.hline(9, 21 + belly, 7, 'o');
  for (let y = 4; y <= 9; y++) g.set(20 + (y >= 4 && y <= 8 ? belly : 0), y, 's');
  g.set(15, 5, 'K').set(15, 8, 'K'); // yelken bağları
  // Flama
  FLAGS[frame % FLAGS.length].forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '.') g.set(17 + x, y, c);
    });
  });
  g.set(16, 0, 'K').set(16, 1, 'K');
  // Kıçta dümenci (şapkalı) ve dümen yekesi
  g.stamp(['.jj.', 'jjjj', '.TT.', '.BB.', '.Bn.'], 2, 8);
  g.line(3, 13, 1, 15, 'x');
  if (loaded) {
    // Güvertede sandık, çuval ve fıçı
    g.stamp(['KKKKK', 'KXEXK', 'KxXxK', 'KKKKK'], 9, 9);
    g.stamp(['KKKK', 'KwXK', 'KKKK'], 10, 6);
    g.stamp(['.KKK.', 'KSSsK', 'KSssK'], 18, 10);
    g.stamp(['KKK', 'KqK', 'KwK'], 23, 10);
  } else {
    g.stamp(['.KK.', 'KEXK'], 21, 11); // halat kangalı
  }
  // Su çizgisi ve köpük
  g.hline(3, 26, 19, 'k');
  const foam = frame % 2 === 0 ? [5, 12, 19, 25] : [7, 14, 21, 27];
  for (const x of foam) g.set(x, 19, 'a').set(x + 1, 19, 'W');
  g.set(29, 17 + (frame % 2), 'a').set(0, 16, 'a');
  return g.toRows();
}

/**
 * @param {'left'|'right'} facing gidiş yönü
 * @param {boolean} loaded güvertede yük var mı
 * @param {number} frame yelken / flama / köpük karesi
 */
export function getBoatSprite(facing = 'right', loaded = false, frame = 0) {
  const f = frame % 2;
  return getSprite(`boat:${facing}:${loaded ? 1 : 0}:${f}`, () => {
    const rows = buildBoatRows(loaded, f);
    return facing === 'left' ? flipRowsHorizontal(rows) : rows;
  });
}
