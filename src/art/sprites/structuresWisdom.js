// 12. aşama: Bilgelik Evi / Kasaba Okulu ve Kütüphanesi (3x3, görsel 48x70).
//   - krem sıvalı iki kanat, arduvaz (mavi) çatılar; kanat pencerelerinde renkli kitap sırtlı raflar
//   - ortada açık taş revaklı giriş, üstünde açık kitap kabartmalı levha; iki yanında gece yanan fenerler
//   - giriş bloğunun üstünde yuvarlak saat kadranlı kasnak ve bakır-turkuaz gözlem kubbesi, altın tepelik,
//     tepede dalgalanan küçük flama (3 kare); Bilge çalışırken kubbenin yarığından dürbün uzanır
//   - geceleri kitaplık pencereleri sıcak sarı yanar (ışık noktaları ACADEMY_ART.windows / lamps)
// Görsel yapının kapladığı karoların ALT kenarına hizalanır; kubbe üstteki karolara 22 piksel taşar.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const ACADEMY_ART = {
  width: 48,
  height: 70,
  windows: [
    { x: 5.5, y: 48.5 },
    { x: 10.5, y: 48.5 },
    { x: 37.5, y: 48.5 },
    { x: 42.5, y: 48.5 },
  ],
  lamps: [
    { x: 14.5, y: 59.5 },
    { x: 33.5, y: 59.5 },
  ],
  dome: { x: 24, y: 9 },
};

// Kitap sırtlarının renkleri (raflar her pencerede biraz farklı dizilir)
const SPINES = ['o', 'B', 'v', 'P', 'i', 'C', 'Y', 'n'];
// Kubbenin tepesindeki flama (direğin sağına)
const PENNANTS = [
  ['ooo..', 'oo...'],
  ['oooo.', '.oo..'],
  ['ooo..', 'ooo..'],
];

/** Kemerli kitaplık penceresi (5x10): üstte cam, altında iki raf kitap. */
function shelfWindow(g, x, y, lit, seed) {
  g.rect(x, y, 5, 10, 'K');
  g.set(x, y, '.').set(x + 4, y, '.');
  g.rect(x + 1, y + 1, 3, 8, lit ? 'y' : 'a');
  if (!lit) g.set(x + 1, y + 1, 'u');
  // Raflar ve kitaplar
  for (const [row, shelf] of [[y + 3, y + 5], [y + 6, y + 8]]) {
    for (let i = 0; i < 3; i++) {
      const c = SPINES[(seed + i * 3 + row) % SPINES.length];
      // bir kitap eğik dursun: üstte boşluk kalır (gece ışık sızar)
      const tall = (seed + i + row) % 4 !== 0;
      g.set(x + 1 + i, row + 1, c);
      if (tall) g.set(x + 1 + i, row, c);
    }
    g.hline(x + 1, x + 3, shelf, 'x');
  }
  g.hline(x - 1, x + 5, y + 10, 'q');
}

function buildAcademyRows(lit, frame, active) {
  const W = ACADEMY_ART.width;
  const g = new CharGrid(W, ACADEMY_ART.height);
  g.rect(1, 67, 47, 3, 'k');

  // Kanatlar: sıvalı duvar, köşe pilastırları, taş kaide
  g.rect(1, 38, 46, 28, 'K');
  g.rect(2, 39, 44, 26, 'S');
  for (const x of [2, 13, 34, 45]) g.vline(x, 39, 60, 's');
  g.hline(2, 45, 43, 'z');
  g.rect(2, 61, 44, 4, 'r');
  g.hline(2, 45, 61, 'q');
  for (let x = 4; x < 46; x += 5) g.set(x, 63, 'M');
  shelfWindow(g, 3, 45, lit, 0);
  shelfWindow(g, 8, 45, lit, 2);
  shelfWindow(g, 35, 45, lit, 5);
  shelfWindow(g, 40, 45, lit, 1);

  // Arduvaz kırma çatılar (kanatların üstünde)
  for (let y = 29; y <= 38; y++) {
    const inset = Math.max(0, Math.floor((38 - y) * 0.9));
    for (const [x0, x1] of [[inset, 16], [31, W - 1 - inset]]) {
      for (let x = x0; x <= x1; x++) g.set(x, y, (y - 29) % 3 === 2 ? 'n' : (x * 3 + y) % 7 === 0 ? 'c' : 'B');
      g.set(x0, y, 'K').set(x1, y, 'K');
    }
  }
  g.hline(0, W - 1, 38, 'K');
  g.hline(1, W - 2, 37, 'n');

  // Kasnak (kubbenin oturduğu silindir) ve saat kadranı
  g.rect(15, 13, 18, 16, 'K');
  g.rect(16, 14, 16, 15, 'S');
  g.vline(30, 14, 28, 's').vline(31, 14, 28, 's');
  g.hline(16, 31, 14, 'E');
  g.ellipse(24, 21, 4.6, 4.6, 'K');
  g.ellipse(24, 21, 3.7, 3.7, 'u');
  g.set(24, 18, 'K').set(24, 24, 'R').set(21, 21, 'R').set(27, 21, 'R'); // 12, 6, 9, 3
  g.set(24, 19, 'K').set(24, 20, 'K').set(25, 21, 'K').set(26, 21, 'K'); // akrep ve yelkovan
  g.set(24, 21, 'P');
  // Kasnağın iki yanında küçük yuvarlak pencereler
  for (const x of [18, 29]) {
    g.rect(x, 24, 2, 3, 'K');
    g.vline(x + (x < 24 ? 1 : 0), 25, 25, lit ? 'y' : 'a');
  }

  // Gözlem kubbesi: bakır-turkuaz, ışık solda; ortasında gözlem yarığı
  for (let y = 3; y <= 13; y++) {
    const t = (13.5 - y) / 10.5;
    const half = Math.max(1, Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * 9.5));
    for (let x = 24 - half; x <= 23 + half; x++) {
      const rel = (x - (24 - half)) / (2 * half);
      g.set(x, y, rel < 0.28 ? 'c' : rel < 0.72 ? 'b' : 'N');
    }
    g.set(24 - half, y, 'K').set(23 + half, y, 'K');
  }
  g.hline(14, 33, 13, 'K');
  g.hline(15, 32, 12, 'N');
  for (const x of [18, 29]) for (let y = 6; y <= 11; y++) if (g.get(x, y) !== 'K') g.set(x, y, 'a'); // kaburgalar
  // Gözlem yarığı; Bilge çalışırken dürbün dışarı uzanır
  g.vline(25, 4, 11, 'K').vline(26, 5, 11, 'K');
  if (active) {
    g.line(26, 7, 33, 2, 'R');
    g.line(27, 7, 34, 3, 'q');
    g.set(34, 2, 'K').set(35, 2, 'K').set(35, 3, 'K').set(33, 1, 'K');
    g.set(34, 3, 'a');
  }
  // Altın tepelik ve flama
  g.rect(23, 1, 2, 2, 'P');
  g.set(23, 1, 'Y');
  g.vline(23, 0, 0, 'K');
  g.vline(22, 0, 2, 'K');
  // Flama (direk: 22. sütun; flama solda dalgalanır)
  PENNANTS[frame % PENNANTS.length].forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '.') g.set(21 - x, y, c);
    });
  });

  // Giriş bloğu: taş revak (kasnağın önünde, alçak üçgen alınlık)
  g.rect(13, 30, 22, 36, 'K');
  g.rect(14, 32, 20, 33, 'q');
  for (let y = 34; y < 61; y += 4) g.hline(14, 33, y, 'r');
  for (let y = 34; y < 61; y += 4) for (let x = 15 + ((y / 4) % 2) * 3; x < 34; x += 6) g.set(x, y + 2, 'M');
  // Alçak alınlık
  for (let y = 26; y <= 31; y++) {
    const half = Math.round((y - 26) * 2.1) + 1;
    for (let x = 24 - half; x <= 23 + half; x++) g.set(x, y, 'q');
    g.set(24 - half, y, 'K').set(23 + half, y, 'K');
  }
  g.hline(12, 35, 31, 'K');
  g.hline(13, 34, 32, 'u');
  g.set(23, 29, 'P').set(24, 29, 'P').set(23, 28, 'Y');
  // Açık kitap kabartmalı levha
  g.rect(18, 35, 12, 7, 'K');
  g.rect(19, 36, 10, 5, 'E');
  g.hline(20, 23, 37, 'u').hline(24, 27, 37, 'u');
  g.hline(20, 23, 38, 'u').hline(24, 27, 38, 'u');
  g.set(21, 38, 'R').set(22, 38, 'R').set(25, 38, 'R').set(26, 38, 'R');
  g.hline(20, 27, 39, 'X');
  g.vline(23, 37, 39, 'K').vline(24, 37, 39, 'K');
  // Revak sütunları
  for (const x of [15, 31]) {
    g.rect(x, 43, 3, 19, 'K');
    g.vline(x + 1, 44, 60, 'u');
    g.set(x + 1, 52, 'q');
    g.hline(x - 1, x + 3, 43, 'q');
  }
  // Kemerli çift kanat kapı ve tepe camı
  g.rect(19, 45, 10, 17, 'K');
  g.set(19, 45, 'q').set(28, 45, 'q');
  g.rect(20, 47, 8, 15, 'w');
  g.hline(21, 26, 46, lit ? 'y' : 'a');
  g.hline(20, 27, 47, 'K');
  g.vline(23, 48, 61, 'K').vline(24, 48, 61, 'K');
  g.vline(21, 49, 60, 'x').vline(26, 49, 60, 'x');
  g.set(22, 54, 'P').set(25, 54, 'P');

  // Basamaklar
  g.rect(16, 62, 16, 6, 'K');
  g.hline(17, 30, 62, 'q').hline(17, 30, 63, 'r');
  g.hline(17, 30, 64, 'q').hline(17, 30, 65, 'r');
  g.hline(18, 29, 66, 'q').hline(18, 29, 67, 'R');
  // Fenerler (basamakların iki yanında)
  for (const x of [14, 33]) {
    g.vline(x, 60, 67, 'K');
    g.rect(x - 1, 57, 3, 3, 'K');
    g.set(x, 58, lit ? 'P' : 'R');
  }
  // Kanatların önünde saksılarda defne
  for (const x of [5, 39]) g.stamp(['.vVv.', 'vVvfv', '.vfv.', '.KCK.', '.KUK.'], x, 61);
  return g.toRows();
}

/**
 * @param {boolean} lit gece: kitaplık pencereleri ve fenerler yanar
 * @param {number} frame flamanın dalgası
 * @param {boolean} active Bilge çalışıyor: kubbeden dürbün uzanır
 */
export function getAcademySprite(lit = false, frame = 0, active = false) {
  const f = frame % PENNANTS.length;
  return getSprite(`building:academy:${lit ? 1 : 0}:${f}:${active ? 1 : 0}`, () => buildAcademyRows(lit, f, active));
}
