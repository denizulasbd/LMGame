// 4. aşama yapıları: taş ocağı (3x3), balıkçı iskelesi (2x2) ve çiçek tarhı (2x2).
// structures.js'teki gibi her görsel yapının kapladığı karoların ALT kenarına hizalanarak çizilir.
// Animasyonlu parçalar (ocağın vinci, tarhın çiçekleri) kare numarasıyla ayrı sprite olarak üretilir.
import { getSprite, CharGrid, recolorRows, flipRowsHorizontal } from '../PixelSprite.js';

// Küçük deterministik "rastgelelik": aynı yapı her seferinde aynı çakıl dağılımına sahip olsun
function hash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Taş ocağı (3x3, görsel 48x56): kayalık duvar, kesilmiş taş blokları, taşlı el arabası,
// ve kayayı kaldıran ahşap vinç (iki karede sallanır)
// ---------------------------------------------------------------------------
export const QUARRY_ART = {
  width: 48,
  height: 56,
};

const BLOCK = ['KKKKKKKKK', 'KqqqqqqrK', 'KqrrrrrRK', 'KrRRRRRRK', 'KKKKKKKKK'];
const ROCK_PILE = ['..KKK...', '.KqqrK..', 'KqrrrRKK', 'KrRrqrRK', 'KKKKKKKK'];

function buildQuarryRows(frame) {
  const g = new CharGrid(48, 56);
  g.ellipse(24, 52, 23.5, 3.2, 'k');

  // Arkadaki kaya duvarı: düzensiz üst kenar, katmanlar ve çatlaklar
  for (let x = 3; x <= 44; x++) {
    const top = Math.round(15 + 2.6 * Math.sin(x * 0.33) + 1.6 * Math.sin(x * 0.8 + 1));
    for (let y = top; y <= 36; y++) {
      const depth = y - top;
      let c = 'r';
      if (depth === 0) c = 'K';
      else if (depth <= 2) c = depth === 1 ? 'q' : 'r';
      else if (depth % 6 === 5) c = 'R';
      else if (hash(x, y, 1) > 0.93) c = 'q';
      else if (hash(x, y, 2) > 0.9) c = 'R';
      g.set(x, y, c);
    }
  }
  g.vline(3, 20, 36, 'K').vline(44, 20, 36, 'K');
  [[10, 19, 27], [24, 17, 25], [35, 18, 29]].forEach(([x, y0, y1]) => {
    for (let y = y0; y <= y1; y++) g.set(x + (y % 3 === 0 ? 1 : 0), y, 'Q');
  });
  g.hline(3, 44, 37, 'K');

  // Kazılmış ocak zemini: toz, çakıl ve toprak
  g.ellipse(24, 44, 24, 10, 'K');
  g.ellipse(24, 44, 22.6, 8.6, 'z');
  for (let y = 36; y < 54; y++) {
    for (let x = 1; x < 47; x++) {
      if (g.get(x, y) !== 'z') continue;
      const h = hash(x, y, 3);
      if (h > 0.9) g.set(x, y, 'M');
      else if (h > 0.8) g.set(x, y, 's');
      else if (h > 0.76) g.set(x, y, 'r');
    }
  }
  g.hline(8, 40, 36, 'R');

  // Kesilmiş taş blokları (sol önde); kaya yüzünün önündeki şerit çalışanlara boş kalır
  g.stamp(BLOCK, 3, 48).stamp(BLOCK, 12, 48).stamp(BLOCK, 7, 43);
  g.hline(8, 14, 43, 'q');

  // Taşlı el arabası (ön orta)
  g.stamp(ROCK_PILE, 23, 41).stamp(ROCK_PILE, 27, 42);
  g.rect(21, 46, 15, 6, 'K');
  g.rect(22, 47, 13, 4, 'w');
  g.hline(22, 34, 47, 'X');
  g.hline(22, 34, 50, 'x');
  g.vline(28, 47, 50, 'x');
  g.line(35, 48, 38, 52, 'w');
  for (const cx of [25.5, 31.5]) {
    g.ellipse(cx, 52, 2.6, 2.6, 'K');
    g.ellipse(cx, 52, 1.4, 1.4, 'X');
  }

  // Kazma duvara dayalı
  g.line(5, 36, 10, 25, 'w').line(6, 36, 11, 25, 'x');
  g.stamp(['.KKKKK.', 'KqqqqqK', 'K.....K'], 6, 23);
  g.set(6, 25, 'q').set(12, 25, 'q');

  // Vinç: direk, kiriş, destek, makara ve sallanan taş
  const sway = frame === 1 ? 1 : 0;
  g.rect(39, 7, 4, 42, 'K');
  g.vline(40, 8, 47, 'X');
  g.vline(41, 8, 47, 'x');
  g.rect(37, 47, 8, 3, 'K');
  g.hline(38, 43, 47, 'X');
  g.rect(20, 7, 22, 4, 'K');
  g.hline(21, 40, 8, 'E');
  g.hline(21, 40, 9, 'X');
  g.hline(21, 40, 10, 'x');
  g.line(41, 22, 31, 11, 'K').line(40, 22, 31, 12, 'w');
  g.rect(22, 10, 3, 3, 'K');
  g.set(23, 11, 'q');
  // Halat ve asılı blok
  g.vline(23 + sway, 12, 24 + sway, 'X');
  g.stamp(['KKKKKKKK', 'KqqqqqrK', 'KqrrrrRK', 'KKKKKKKK'], 19 + sway, 25 + sway);
  g.set(22 + sway, 24 + sway, 'K').set(24 + sway, 24 + sway, 'K');
  return g.toRows();
}

/** Taş ocağının satırları (Derin Maden Ocağı bunların üstüne çizilir). */
export function quarryRows(frame = 0) {
  return buildQuarryRows(frame);
}

export function getQuarrySprite(frame = 0) {
  return getSprite(`building:quarry:${frame}`, () => buildQuarryRows(frame));
}

// ---------------------------------------------------------------------------
// Balıkçı iskelesi (2x2, görsel 32x40): kıyıdan suya uzanan tahta yol, uçta korkuluk ve fener.
// Sol yarısı kum, sağ yarısı su üstündedir; "left" yönü aynalanır. Fener geceleri yanar.
// ---------------------------------------------------------------------------
export const PIER_ART = {
  width: 32,
  height: 40,
  light: { x: 22.5, y: 4.5 },     // fenerin ışık noktası (yönü 'right' iken)
  bobberReach: 17,
};

/** Üstten bakılan tahta yüzey: yatay kuşaklar, aralarda koyu derz ve kaydırmalı kısa derzler. */
function deckTop(g, x0, x1, y0, y1) {
  g.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, 'X');
  g.hline(x0, x1, y0, 'E');
  for (let y = y0 + 3; y <= y1; y += 3) g.hline(x0, x1, y, 'x');
  for (let band = 0; y0 + 1 + band * 3 <= y1; band++) {
    const top = y0 + 1 + band * 3;
    for (let x = x0 + 2 + ((band * 5) % 9); x < x1; x += 9) g.vline(x, top, Math.min(y1, top + 1), 'x');
  }
}

/** Güverte ön yüzü: koyu ahşap ve kiriş gölgeleri. */
function deckFront(g, x0, x1, y0, y1) {
  g.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, 'w');
  g.hline(x0, x1, y0, 'K');
  g.hline(x0, x1, y1, 'K');
  for (let x = x0 + 3; x < x1; x += 6) g.vline(x, y0 + 1, y1 - 1, 'x');
}

/** stage 0: kazıklar ve tahta yığını, 1: yürüyüş yolu, 2: platform, 3: tamamlandı (korkuluk, fener, süsler). */
function buildPierRows(stage = 3) {
  const g = new CharGrid(32, 40);

  // Kumun üstüne düşen gölge
  g.hline(1, 18, 37, 'k').hline(2, 17, 38, 'k');

  // Kazıklar: güvertenin altından suya iner, sudakilerin dibinde küçük köpük halkaları
  for (const x of [3, 11, 20, 28]) {
    g.rect(x, 31, 3, 8, 'K');
    g.vline(x + 1, 31, 37, 'w');
    g.set(x + 1, 31, 'X');
  }
  for (const x of [20, 28]) {
    g.hline(x - 2, x + 4, 38, 'a');
    g.set(x - 3, 39, 'W').set(x + 5, 39, 'W').set(x + 1, 39, 'W');
  }

  // Şantiye: henüz döşenmemiş tahtalar kıyıda yığılı durur
  if (stage < 3) {
    g.rect(1, 29, 11, 2, 'E').rect(1, 31, 11, 2, 'X').hline(1, 11, 33, 'x');
    g.hline(1, 11, 28, 'K').hline(0, 0, 29, 'K').vline(12, 29, 33, 'K');
  }

  // Kıyıdan uzanan dar yol: üst yüzey + ön yüz
  if (stage >= 1) {
    g.hline(0, 20, 22, 'K');
    deckTop(g, 0, 20, 23, 30);
    deckFront(g, 0, 20, 31, 34);
  }

  // Uçtaki geniş platform
  if (stage >= 2) {
    g.rect(19, 15, 13, 1, 'K');
    g.vline(19, 15, 22, 'K');
    g.vline(31, 15, 35, 'K');
    deckTop(g, 20, 30, 16, 30);
    deckFront(g, 19, 31, 31, 35);
  }
  if (stage < 3) return g.toRows();

  // Arka korkuluk: üç direk ve iki kuşak
  for (const x of [20, 25, 29]) {
    g.rect(x, 9, 2, 8, 'K');
    g.vline(x, 10, 15, 'X');
    g.set(x, 9, 'E');
  }
  g.hline(22, 24, 11, 'X').hline(22, 24, 12, 'x');
  g.hline(27, 28, 11, 'X').hline(27, 28, 12, 'x');

  // Fener: korkuluk direğinin tepesinde (pencere rengi 'A' / 'I' yanma durumuna göre boyanır)
  g.rect(20, 2, 6, 8, 'K');
  g.rect(21, 3, 4, 6, 'A');
  g.hline(21, 24, 6, 'I');
  g.hline(22, 23, 1, 'K');
  g.vline(23, 3, 8, 'x');

  // Yol üstünde yem kovası (balık kuyruğu görünür) ve sandık
  g.rect(8, 23, 5, 6, 'K');
  g.rect(9, 24, 3, 4, 'w');
  g.hline(9, 11, 24, 'E');
  g.hline(9, 11, 26, 'x');
  g.stamp(['.O.', 'oOo'], 9, 21);
  g.rect(2, 24, 5, 5, 'K');
  g.rect(3, 25, 3, 3, 'X');
  g.hline(3, 5, 25, 'E');
  g.set(4, 27, 'x');
  return g.toRows();
}

/** İskele şantiyesi: kazıklar çakılır, yol ve platform döşenir (suyun üstünde olduğu için toprak zemin yok). */
export function getFishingPierSiteSprite(stage, flipped = false) {
  return getSprite(`building:pierSite:${stage}:${flipped ? 'L' : 'R'}`, () => {
    const rows = buildPierRows(stage);
    return flipped ? flipRowsHorizontal(rows) : rows;
  });
}

export function getFishingPierSprite(lit, flipped = false) {
  return getSprite(`building:pier:${lit ? 'lit' : 'day'}:${flipped ? 'L' : 'R'}`, () => {
    const rows = recolorRows(buildPierRows(), lit ? { A: 'y', I: 'P' } : { A: 'a', I: 'c' });
    return flipped ? flipRowsHorizontal(rows) : rows;
  });
}

// ---------------------------------------------------------------------------
// Çiçek tarhı (2x2, görsel 32x32): tahta kenarlı yükseltilmiş yatak; lale, papatya, lavanta ve
// pembe çiçekler. İki karede rüzgârda sallanır; her tarhın renk düzeni farklıdır (tone).
// ---------------------------------------------------------------------------
const FLOWER_PALETTES = [
  { tulip: 'o', daisy: 'u', lavender: 'i', bloom: 'p' },
  { tulip: 'P', daisy: 'p', lavender: 'o', bloom: 'O' },
  { tulip: 'i', daisy: 'P', lavender: 'p', bloom: 'u' },
];
const FLOWER_KINDS = ['tulip', 'daisy', 'lavender', 'bloom'];
const FLOWER_HEADS = {
  tulip: ['c.c', 'ccc', '.c.'],
  daisy: ['.c.', 'cPc', '.c.'],
  lavender: ['.c.', '.cc', 'cc.', '.c.'],
  bloom: ['.cc.', 'cOOc', '.cc.'],
};

function tint(pattern, color) {
  // Sarı ya da turuncu çiçeğin merkezi kontrast için kırmızıya döner
  const center = color === 'P' || color === 'O' ? 'o' : 'P';
  return pattern.map((row) => [...row].map((ch) => (ch === 'c' ? color : ch === 'P' || ch === 'O' ? center : ch)).join(''));
}

function buildFlowerBedRows(tone, frame) {
  const palette = FLOWER_PALETTES[((tone % 3) + 3) % 3];
  const g = new CharGrid(32, 32);
  g.ellipse(16, 29.5, 15.5, 2.4, 'k');

  // Tahta çerçeve ve toprak
  g.rect(1, 8, 30, 21, 'K');
  g.rect(2, 9, 28, 19, 'w');
  g.rect(4, 11, 24, 14, 'x');
  g.rect(5, 12, 22, 12, 'D');
  g.hline(2, 29, 9, 'E');
  g.hline(2, 29, 10, 'X');
  g.hline(2, 29, 26, 'x');
  g.hline(2, 29, 27, 'K');
  for (const x of [2, 29]) g.vline(x, 10, 25, 'X');

  // Çiçekler: arka sıra yukarıda, ön sıra aşağıda
  const rows = [15, 20, 25];
  rows.forEach((baseY, r) => {
    for (let c = 0; c < 4; c++) {
      const kind = FLOWER_KINDS[(r + c * 3) % 4];
      const head = tint(FLOWER_HEADS[kind], palette[kind]);
      const x = 7 + c * 6 + (r % 2 === 1 ? 2 : 0);
      const stemTop = baseY - 3;
      g.vline(x + 1, stemTop, baseY, 'f');
      g.set(x, baseY - 1, 'v').set(x + 2, baseY - 2, 'v');
      const sway = (c + r) % 2 === frame ? 1 : 0;
      g.stamp(head, x - Math.floor((head[0].length - 3) / 2) + sway, stemTop - head.length + 1);
    }
  });

  // Köşe taşları ve çimen tutamları
  g.stamp(['.KK.', 'KqrK', 'KRRK'], 0, 24).stamp(['.KK.', 'KqrK', 'KRRK'], 28, 24);
  g.set(4, 29, 'g').set(5, 28, 'h').set(26, 29, 'g').set(27, 28, 'h');
  return g.toRows();
}

export function getFlowerBedSprite(tone = 0, frame = 0) {
  return getSprite(`building:flowerBed:${((tone % 3) + 3) % 3}:${frame}`, () => buildFlowerBedRows(tone, frame));
}

// ---------------------------------------------------------------------------
// Kasaba Hanı (3x3, görsel 48x64): taş temel, ahşap kirişli sıvalı iki kat, kiremit çatı ve baca,
// kapının üstünde zincirle asılı bira bardağı tabelası (üç karede sallanır), kapı yanında fener.
// Pencere renkleri 'A' / 'I' gece yanınca turuncuya döner.
// ---------------------------------------------------------------------------
export const INN_ART = {
  width: 48,
  height: 64,
  windows: [
    { x: 7.5, y: 47.5 },
    { x: 40.5, y: 47.5 },
    { x: 8.5, y: 29.5 },
    { x: 24, y: 29.5 },
    { x: 39.5, y: 29.5 },
  ],
  lantern: { x: 16.5, y: 43.5 },
  chimney: { x: 38.5, y: 1 },
};

function innWindow(g, x0, y0, w, h) {
  g.rect(x0 - 1, y0 - 1, w + 2, h + 2, 'K');
  g.rect(x0, y0, w, h, 'A');
  g.hline(x0, x0 + w - 1, y0 + h - 2, 'I');
  g.hline(x0, x0 + w - 1, y0 + h - 1, 'I');
  g.vline(x0 + Math.floor(w / 2), y0, y0 + h - 1, 'x');
  g.hline(x0, x0 + w - 1, y0 + Math.floor(h / 2) - 1, 'x');
  g.hline(x0 - 2, x0 + w + 1, y0 + h + 1, 'E');
}

function buildInnRows(sway) {
  const g = new CharGrid(48, 64);
  g.rect(3, 61, 45, 3, 'k');

  // Taş temel
  g.rect(0, 54, 48, 7, 'K');
  g.rect(1, 55, 46, 5, 'r');
  g.hline(1, 46, 55, 'q');
  g.hline(1, 46, 58, 'R');
  for (let x = 4; x < 46; x += 7) g.set(x, 56, 'M').set(x + 3, 58, 'M');

  // Alt kat: krem sıva, koyu kirişler
  g.rect(1, 36, 46, 18, 'K');
  g.rect(2, 37, 44, 17, 'S');
  for (const x of [2, 13, 34, 45]) g.vline(x, 37, 53, 'x');
  g.hline(2, 45, 37, 'x');
  g.line(3, 52, 12, 39, 'w');
  g.line(35, 39, 44, 52, 'w');
  innWindow(g, 5, 44, 6, 6);
  innWindow(g, 38, 44, 6, 6);

  // Kapı: kemerli ahşap, basamak
  g.rect(19, 41, 10, 13, 'K');
  g.rect(20, 42, 8, 12, 'w');
  g.hline(21, 26, 41, 'K');
  g.vline(22, 43, 53, 'x').vline(25, 43, 53, 'x');
  g.set(26, 48, 'P');
  g.rect(18, 54, 12, 2, 'q');
  g.hline(18, 29, 55, 'r');

  // Kapı yanındaki fener (gece yanar)
  g.rect(15, 42, 3, 4, 'K');
  g.set(16, 43, 'A').set(16, 44, 'I');
  g.vline(16, 40, 41, 'K');

  // Üst kat: dışa taşan, çapraz kirişli
  g.rect(0, 22, 48, 15, 'K');
  g.rect(1, 23, 46, 13, 'S');
  for (const x of [1, 16, 31, 46]) g.vline(x, 23, 35, 'x');
  g.hline(1, 46, 35, 'x');
  g.hline(0, 47, 36, 'w');
  innWindow(g, 6, 26, 6, 6);
  innWindow(g, 21, 26, 6, 6);
  innWindow(g, 37, 26, 6, 6);

  // Çatı: kiremit sıraları, yukarı doğru daralır
  for (let y = 5; y <= 21; y++) {
    const inset = Math.max(0, 7 - Math.floor((y - 5) / 2));
    const x0 = inset;
    const x1 = 47 - inset;
    g.hline(x0, x1, y, (y - 5) % 3 === 2 ? 'U' : 'C');
    g.set(x0, y, 'K').set(x1, y, 'K');
    if ((y - 5) % 3 === 0) for (let x = x0 + 2 + (y % 2) * 2; x < x1; x += 4) g.set(x, y, 'Z');
  }
  g.hline(7, 40, 4, 'K');
  g.hline(0, 47, 21, 'K');

  // Baca
  g.rect(36, 0, 6, 12, 'K');
  g.rect(37, 1, 4, 10, 'r');
  g.hline(37, 40, 1, 'q');
  g.set(38, 5, 'M').set(39, 8, 'M');

  // Tabela: kirişten iki zincirle sarkan tahta; üstünde köpüklü bardak (sway: -1, 0, 1)
  g.set(19, 38, 'K').set(28, 38, 'K');
  g.set(19 + sway, 39, 'K').set(28 + sway, 39, 'K');
  const sx = 17 + sway;
  g.rect(sx, 40, 14, 1, 'K');
  g.stamp(
    [
      'KKKKKKKKKKKKKK',
      'KXXXXXXXXXXXXK',
      'KXXXXuuuXXXXXK',
      'KXXXPPPPPKXXXK',
      'KXXXPYPPPK.KXK',
      'KXXXPPPPPKKXXK',
      'KXXXKKKKKXXXXK',
      'KKKKKKKKKKKKKK',
    ],
    sx,
    33
  );

  // Kapı önü süsleri: fıçı ve çiçek saksısı
  g.rect(3, 50, 6, 6, 'K');
  g.rect(4, 51, 4, 4, 'w');
  g.hline(4, 7, 52, 'x').hline(4, 7, 54, 'x');
  g.stamp(['.pop.', 'pPvPp', 'KxxxK', 'KXXXK'], 40, 50);
  return g.toRows();
}

export function getInnSprite(lit, frame = 0) {
  const sway = [0, 1, 0, -1][((frame % 4) + 4) % 4];
  return getSprite(`building:inn:${lit ? 'lit' : 'day'}:${sway}`, () =>
    recolorRows(buildInnRows(sway), lit ? { A: 'Y', I: 'O' } : { A: 'a', I: 'c' })
  );
}

// ---------------------------------------------------------------------------
// Pazar Yeri (3x2, görsel 48x46): kırmızı-beyaz çizgili tente, ahşap tezgâh ve üstünde elma,
// lahana, ekmek ve kabak; yanlarda fıçı ve çuval. Tüccar geldiğinde tentenin üstünde flama dalgalanır.
// ---------------------------------------------------------------------------
export const MARKET_ART = { width: 48, height: 46 };

function buildMarketRows(open, frame) {
  const g = new CharGrid(48, 46);
  g.rect(2, 43, 46, 3, 'k');

  // Direkler
  for (const x of [3, 43]) {
    g.rect(x, 10, 3, 33, 'K');
    g.vline(x + 1, 11, 42, 'X');
  }

  // Tezgâh: üst tabla ve ön panel
  g.rect(5, 27, 38, 16, 'K');
  g.rect(6, 28, 36, 2, 'E');
  g.rect(6, 30, 36, 12, 'X');
  for (let x = 10; x < 42; x += 6) g.vline(x, 31, 41, 'x');
  g.hline(6, 41, 30, 'w');
  g.hline(6, 41, 41, 'x');

  // Mallar: elma kasası, lahanalar, ekmekler, kabak
  g.rect(8, 23, 9, 5, 'K');
  g.rect(9, 24, 7, 3, 'w');
  [[9, 22], [11, 21], [13, 22], [15, 21], [10, 23], [14, 23]].forEach(([x, y]) => g.set(x, y, 'o').set(x + 1, y, 'o'));
  g.set(11, 20, 'u');
  g.stamp(['.vVv.', 'vVfVv', 'fvVvf'], 19, 24).stamp(['.vVv.', 'vVfVv', 'fvVvf'], 23, 23);
  g.stamp(['.KKKK.', 'KEXEXK', 'KXEXEK', '.KKKK.'], 29, 24);
  g.stamp(['..x..', '.OOO.', 'OOYOO', 'OOOOO', '.OOO.'], 36, 23);

  // Yan süsler: fıçı (sol) ve çuval (sağ)
  g.rect(0, 33, 6, 10, 'K');
  g.rect(1, 34, 4, 8, 'w');
  g.hline(1, 4, 36, 'x').hline(1, 4, 40, 'x');
  g.stamp(['.KK.', 'KssK', 'KszK', 'KszK', 'KKKK'], 44, 37);

  // Tente: çizgili, üstten alta genişler; altta dalgalı saçak
  for (let y = 6; y <= 17; y++) {
    const inset = Math.max(0, Math.floor((17 - y) / 3));
    for (let x = inset; x < 48 - inset; x++) g.set(x, y, Math.floor((x + 1) / 4) % 2 === 0 ? 'o' : 'u');
    g.set(inset, y, 'K').set(47 - inset, y, 'K');
  }
  g.hline(4, 43, 5, 'K');
  for (let x = 0; x < 48; x++) {
    const stripe = Math.floor((x + 1) / 4) % 2 === 0 ? 'o' : 'u';
    const edge = (x + 1) % 4;
    g.set(x, 18, stripe);
    if (edge === 1 || edge === 2) g.set(x, 19, stripe);
    else g.set(x, 19, 'K');
    if (edge === 0 || edge === 3) g.set(x, 18, 'K');
  }
  g.rect(6, 20, 36, 2, 'k');

  // Tabela: tentenin ortasında altın sikke
  g.stamp(['.KKKKK.', 'KPPPPPK', 'KPYuYPK', 'KPPPPPK', '.KKKKK.'], 20, 8);

  // Tüccar geldiğinde: tepede dalgalanan flama
  if (open) {
    g.vline(24, 0, 5, 'x');
    const wave = frame % 2 === 0 ? ['ooo..', 'oPPo.', 'ooo..'] : ['oo...', 'oPPoo', 'oo...'];
    g.stamp(wave, 25, 0);
  }
  return g.toRows();
}

export function getMarketSprite(open = false, frame = 0) {
  const f = open ? frame % 2 : 0;
  return getSprite(`building:market:${open ? 'open' : 'closed'}:${f}`, () => buildMarketRows(open, f));
}

// ---------------------------------------------------------------------------
// Sokak Feneri (1x1, görsel 16x32): kıvrık ahşap-demir direk, ucunda zincirle asılı fener.
// Fener camı 'A' / 'I' gece yanınca sarıya döner.
// ---------------------------------------------------------------------------
export const LANTERN_ART = { width: 16, height: 32, light: { x: 11.5, y: 13.5 } };

function buildLanternRows() {
  const g = new CharGrid(16, 32);
  g.ellipse(6, 30.5, 4.5, 1.4, 'k');
  // Taş kaide
  g.rect(2, 27, 7, 3, 'K');
  g.rect(3, 27, 5, 2, 'q');
  g.hline(3, 7, 28, 'r');
  // Direk
  g.rect(4, 6, 3, 21, 'K');
  g.vline(5, 7, 26, 'x');
  g.set(5, 12, 'w').set(5, 18, 'w').set(5, 23, 'w');
  // Kıvrık kol
  g.hline(5, 11, 3, 'K');
  g.hline(6, 11, 4, 'x');
  g.hline(5, 12, 5, 'K');
  g.set(12, 4, 'K').set(4, 4, 'K').set(4, 5, 'K');
  // Zincir ve fener
  g.vline(11, 6, 8, 'K');
  g.hline(10, 12, 9, 'K');
  g.rect(9, 10, 5, 7, 'K');
  g.rect(10, 11, 3, 4, 'A');
  g.hline(10, 12, 14, 'I');
  g.hline(9, 13, 16, 'K');
  g.set(11, 17, 'K');
  return g.toRows();
}

export function getLanternSprite(lit) {
  return getSprite(`building:lantern:${lit ? 'lit' : 'day'}`, () =>
    recolorRows(buildLanternRows(), lit ? { A: 'y', I: 'P' } : { A: 'a', I: 'c' })
  );
}

// ---------------------------------------------------------------------------
// Kasaba Anıtı (2x2, görsel 32x56): basamaklı mermer kaide, altın yazıt, elinde yıldız tutan
// bronz heykel ve çevresinde çiçekler. Gece yıldız hafifçe parlar.
// ---------------------------------------------------------------------------
export const MONUMENT_ART = { width: 32, height: 56, star: { x: 24.5, y: 2.5 } };

function buildMonumentRows() {
  const g = new CharGrid(32, 56);
  g.ellipse(16, 54, 16, 2.4, 'k');

  // Basamaklar
  g.rect(0, 47, 32, 7, 'K');
  g.rect(1, 48, 30, 2, '7');
  g.rect(1, 50, 30, 3, '6');
  g.hline(1, 30, 50, '5');
  g.rect(3, 43, 26, 5, 'K');
  g.rect(4, 44, 24, 3, '7');
  g.hline(4, 27, 46, '5');

  // Kaide ve altın yazıt
  g.rect(8, 28, 16, 16, 'K');
  g.rect(9, 29, 14, 14, '7');
  g.vline(21, 29, 42, '6').vline(22, 29, 42, '5');
  g.hline(9, 22, 29, '8');
  g.rect(10, 34, 11, 6, 'K');
  g.rect(11, 35, 9, 4, 'P');
  g.hline(12, 18, 36, 'Y').hline(12, 16, 37, 'Y');
  g.hline(7, 24, 27, 'K').hline(8, 23, 28, '6');

  // Bronz heykel: aşağı doğru genişleyen cüppeli figür, belinde altın kuşak
  for (let y = 11; y <= 26; y++) {
    const half = 3 + Math.floor((y - 11) / 3);
    const x0 = 16 - half;
    const x1 = 16 + half;
    g.hline(x0, x1, y, 'X');
    g.set(x0, y, 'K').set(x1, y, 'K');
    g.set(x0 + 1, y, 'E');
    g.set(x1 - 1, y, 'w');
  }
  g.hline(10, 22, 26, 'K');
  g.hline(13, 19, 11, 'K');
  for (const x of [14, 18]) g.vline(x, 19, 25, 'w'); // cüppe kıvrımları
  g.hline(13, 19, 17, 'P').set(16, 17, 'Y');
  // Baş ve boyun
  g.ellipse(16.5, 6.5, 3.4, 3.4, 'K');
  g.ellipse(16.5, 6.5, 2.4, 2.4, 'X');
  g.set(15, 5, 'E').set(15, 6, 'E').set(18, 7, 'w');
  g.vline(16, 9, 10, 'X').set(15, 10, 'K').set(17, 10, 'K');
  // Kaldırılmış sağ kol ve elindeki yıldız
  g.line(19, 12, 24, 5, 'K').line(20, 12, 24, 6, 'X').line(20, 13, 25, 6, 'K');
  g.stamp(['..K..', '.KPK.', 'KPYPK', '.KPK.', '..K..'], 22, 0);
  // Göğsündeki sol kol
  g.line(13, 12, 12, 17, 'w').line(12, 17, 15, 18, 'w');

  // Çiçekler
  g.stamp(['.p.', 'pPp', '.v.'], 1, 44).stamp(['.o.', 'oPo', '.v.'], 28, 44);
  g.stamp(['.u.', 'uPu', '.v.'], 5, 51).stamp(['.p.', 'pPp', '.v.'], 24, 51);
  return g.toRows();
}

export function getMonumentSprite() {
  return getSprite('building:monument', buildMonumentRows);
}
