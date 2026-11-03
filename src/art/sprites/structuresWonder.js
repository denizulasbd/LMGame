// 12. aşama: Kasaba Harikası "Büyük Vadi Saat Kulesi" (4x4, görsel 64 piksel genişlik, aşamaya göre 72 / 96 / 128 yükseklik).
//   1. Temel        : geniş kesme taş kaide, ön yüzde bloklar ve geniş basamaklar; ortada kulenin temel çukuru ve
//                     altın köşe taşı, köşelerde alçak sütun kaideleri, taş blok ve kereste yığınları; basamakların
//                     iki yanında geceleri yanan mangallar
//   2. Gövde        : kaidenin üstünde mazgallı taş salon: demir kuşaklar ve perçinler, kemerli pencereler, yün
//                     kilimli flamalar, renkli camlı gül pencere, perçinli büyük kapı; köşelerde arduvaz başlıklı
//                     kuleler; ortada yarım kalmış kule gövdesi
//   3. Görkemli Kule: kule tamamlanır: altın çerçeveli büyük saat kadranı, açık kemerli çan odasında bronz çan,
//                     altın kubbe ve tepelik; köşe kuleleri altın başlık ve flama alır. Geceleri çan odası fener
//                     gibi yanar (ışık noktası WONDER_ART.beacon).
//   Aşama sürerken (project 'stage') sıradaki aşama iskeleyle aşağıdan yukarı yükselir (4 kademe).
// Tüm koordinatlar 128 piksellik tam yükseklikte tasarlanır; görsel alt kenardan kırpılır, yapının
// kapladığı karoların ALT kenarına hizalanır.
import { getSprite, CharGrid } from '../PixelSprite.js';

const FULL = 128;
export const WONDER_ART = {
  width: 64,
  fullHeight: FULL,
  heights: { 0: 72, 1: 72, 2: 96, 3: 128 },
  beacon: { x: 31.5, y: 20.5 }, // çan odasının fener ışığı (128'lik çerçevede)
  braziers: [
    { x: 16.5, y: 109.5 },
    { x: 47.5, y: 109.5 },
  ],
  windows: [
    { x: 11.5, y: 87.5 },
    { x: 19.5, y: 87.5 },
    { x: 44.5, y: 87.5 },
    { x: 52.5, y: 87.5 },
    { x: 31.5, y: 85.5 },
  ],
};

// Her aşamanın yeni eklediği bölgenin satır aralığı (iskele bu aralıkta aşağıdan yukarı yükselir)
const NEW_SPAN = { 2: [40, 110], 3: [0, 64] };

const FLAGS = [
  ['ooo.', 'oo..'],
  ['oooo', '.oo.'],
  ['ooo.', 'ooo.'],
];

function flag(g, x, y, frame) {
  g.vline(x, y, y + 5, 'K');
  FLAGS[frame % FLAGS.length].forEach((row, dy) => {
    [...row].forEach((c, dx) => {
      if (c !== '.') g.set(x + 1 + dx, y + dy, c);
    });
  });
}

/** Kemerli pencere (5x10). */
function archWindow(g, x, y, lit) {
  g.rect(x, y, 5, 10, 'K');
  g.set(x, y, 'q').set(x + 4, y, 'q');
  g.rect(x + 1, y + 1, 3, 8, lit ? 'Y' : 'n');
  g.set(x + 2, y + 1, lit ? 'y' : 'a');
  g.vline(x + 2, y + 3, y + 8, 'K');
  if (lit) g.set(x + 1, y + 7, 'P');
  else g.set(x + 1, y + 2, 'a');
  g.hline(x - 1, x + 5, y + 10, 'u');
}

/** Mangal (basamakların iki yanında, kaidenin önünde): taş ayak, demir tas; gece ateşi yanar. */
function brazier(g, x, lit, frame) {
  g.rect(x - 1, 114, 4, 12, 'K');
  g.vline(x, 115, 124, 'q').vline(x + 1, 115, 124, 'r');
  g.rect(x - 2, 111, 6, 4, 'K');
  g.hline(x - 1, x + 2, 112, 'R');
  g.hline(x - 1, x + 2, 113, 'Q');
  if (lit) {
    const f = frame % 2;
    g.hline(x - 1, x + 2, 111, 'O');
    g.set(x, 110, 'P').set(x + 1, 110, 'Y');
    g.set(x + f, 109, 'Y').set(x + 1 - f, 108, 'o');
  } else {
    g.hline(x - 1, x + 2, 111, 'R');
  }
}

function platform(g, lit, frame) {
  g.rect(1, 125, 63, 3, 'k');
  // Üst yüz: düz kesme taş döşeme
  g.rect(1, 71, 62, 41, 'K');
  g.rect(2, 72, 60, 39, 'q');
  for (let y = 77; y < 111; y += 6) g.hline(2, 61, y, 'r');
  for (let y = 72; y < 111; y += 6) {
    const shift = Math.floor(y / 6) % 2 === 0 ? 0 : 5;
    for (let x = 6 + shift; x < 61; x += 10) g.vline(x, y, Math.min(110, y + 4), 'r');
  }
  // Ön yüz: büyük bloklar
  g.rect(1, 111, 62, 12, 'K');
  g.rect(2, 112, 60, 10, 'r');
  g.hline(2, 61, 112, 'q');
  g.hline(2, 61, 117, 'M');
  g.hline(2, 61, 121, 'R');
  for (let x = 8; x < 61; x += 9) g.vline(x, 113, 116, 'M');
  for (let x = 4; x < 61; x += 9) g.vline(x, 118, 120, 'M');
  // Geniş basamaklar
  g.rect(19, 116, 26, 11, 'K');
  for (let i = 0; i < 5; i++) {
    const y = 116 + i * 2;
    g.hline(20 - Math.min(i, 1), 43 + Math.min(i, 1), y, 'u');
    g.hline(20 - Math.min(i, 1), 43 + Math.min(i, 1), y + 1, i === 4 ? 'R' : 'q');
  }
}

function foundationDetails(g) {
  // Temel çukuru: kalın taş çerçeve, koyu iç, altın köşe taşı
  g.rect(18, 76, 28, 24, 'K');
  g.rect(19, 77, 26, 22, 'R');
  g.rect(21, 79, 22, 18, 'M');
  g.rect(22, 80, 20, 16, 'D');
  for (let y = 83; y < 96; y += 4) g.hline(22, 41, y, 'M');
  g.rect(19, 96, 4, 3, 'P');
  g.set(19, 96, 'Y');
  g.hline(19, 22, 99, 'K');
  // Köşelerde alçak sütun kaideleri
  for (const [x, y] of [[4, 66], [54, 66], [4, 92], [54, 92]]) {
    g.rect(x, y, 7, 10, 'K');
    g.rect(x + 1, y + 1, 5, 8, 'q');
    g.vline(x + 5, y + 1, y + 8, 'r');
    g.hline(x + 1, x + 5, y + 1, 'u');
  }
  // Taş blok ve kereste yığınları
  g.stamp(['.KKKKKK.', 'KqqqqqrK', 'KrrrrrRK', 'KKKKKKKK', 'KqqrKqqK', 'KrrRKrrK', 'KKKKKKKK'], 47, 80);
  g.stamp(['KKKKKKKK', 'KEXXXXxK', 'KKKKKKKK', 'KEXXXXxK', 'KKKKKKKK'], 8, 81);
  g.stamp(['.KKKK.', 'KqqrrK', 'KrrRRK', 'KKKKKK'], 49, 101);
}

function turret(g, x, stage, frame) {
  // Köşe kulesi: gövde ve konik başlık (aşama 3'te altın)
  g.rect(x, 62, 9, 49, 'K');
  g.rect(x + 1, 63, 7, 47, 'q');
  for (let y = 67; y < 110; y += 5) g.hline(x + 1, x + 7, y, 'r');
  g.vline(x + 6, 63, 109, 'r');
  g.rect(x + 3, 70, 3, 5, 'K');
  g.set(x + 4, 71, 'n').set(x + 4, 72, 'n');
  const [light, main, dark] = stage >= 3 ? ['Y', 'P', 'O'] : ['c', 'B', 'n'];
  for (let y = 50; y <= 62; y++) {
    const half = Math.max(0, Math.round((y - 50) * 0.42));
    for (let xx = x + 4 - half; xx <= x + 4 + half; xx++) g.set(xx, y, xx < x + 4 ? light : xx === x + 4 ? main : dark);
    g.set(x + 4 - half, y, 'K').set(x + 4 + half, y, 'K');
  }
  g.hline(x - 1, x + 9, 62, 'K');
  if (stage >= 3) flag(g, x + 4, 44, frame);
  else g.vline(x + 4, 47, 49, 'K');
}

function hall(g, lit) {
  // Mazgallı taş salon
  g.rect(5, 64, 54, 47, 'K');
  g.rect(6, 65, 52, 45, 'q');
  for (let y = 69; y < 110; y += 5) g.hline(6, 57, y, 'r');
  for (let y = 65; y < 110; y += 5) {
    const shift = Math.floor(y / 5) % 2 === 0 ? 0 : 4;
    for (let x = 9 + shift; x < 58; x += 8) g.vline(x, y + 1, Math.min(109, y + 3), 'r');
  }
  // Mazgallar
  g.hline(5, 58, 64, 'K');
  for (let x = 5; x < 58; x += 6) {
    g.rect(x, 59, 4, 6, 'K');
    g.rect(x + 1, 60, 2, 4, 'q');
    g.set(x + 1, 60, 'u');
  }
  // Demir kuşaklar ve perçinler
  for (const y of [77, 98]) {
    g.hline(6, 57, y, 'R');
    g.hline(6, 57, y + 1, 'Q');
    for (let x = 8; x < 58; x += 4) g.set(x, y, 'q');
  }
  // Kemerli pencereler
  for (const x of [9, 17, 42, 50]) archWindow(g, x, 82, lit);
  // Yün kilimli flamalar (kuşaktan sarkar)
  for (const [x, c] of [[14, 'o'], [24, 'i'], [38, 'i'], [47, 'o']]) {
    g.rect(x, 79, 3, 12, 'K');
    g.rect(x + 1, 79, 1, 11, c);
    g.set(x + 1, 82, 'P').set(x + 1, 86, 'P');
    g.set(x, 91, '.').set(x + 2, 91, '.');
  }
  // Gül pencere (renkli cam)
  g.ellipse(32, 85.5, 5.2, 5.2, 'K');
  g.ellipse(32, 85.5, 4.3, 4.3, lit ? 'Y' : 'B');
  if (!lit) {
    g.set(31, 82, 'o').set(32, 82, 'o').set(29, 85, 'v').set(34, 85, 'P').set(31, 88, 'i').set(32, 88, 'i');
    g.set(30, 83, 'c').set(33, 87, 'n');
  } else {
    g.set(31, 82, 'P').set(29, 85, 'O').set(34, 85, 'P').set(32, 88, 'O');
  }
  g.hline(28, 35, 85, 'K');
  g.vline(31, 82, 89, 'K');
  g.set(31, 85, 'P').set(32, 85, 'P');
  // Büyük kapı: kemer, kilit taşı, perçinli kanatlar
  g.rect(24, 92, 16, 19, 'K');
  g.set(24, 92, 'q').set(25, 92, 'q').set(38, 92, 'q').set(39, 92, 'q').set(24, 93, 'q').set(39, 93, 'q');
  g.rect(26, 95, 12, 15, 'w');
  g.hline(27, 36, 94, 'w');
  g.vline(31, 95, 109, 'K').vline(32, 95, 109, 'K');
  for (const y of [98, 103, 107]) for (const x of [27, 29, 34, 36]) g.set(x, y, 'P');
  g.vline(28, 96, 108, 'x').vline(35, 96, 108, 'x');
  g.rect(30, 90, 4, 3, 'K');
  g.hline(31, 32, 91, 'P');
}

function towerStump(g) {
  // Yarım kalmış kule gövdesi: düzensiz üst kenar
  for (let x = 22; x <= 41; x++) {
    const top = 42 + ((x * 7) % 5) + (x > 34 ? 3 : 0);
    g.vline(x, top, 64, x === 22 || x === 41 ? 'K' : (top + x) % 3 === 0 ? 'r' : 'q');
    g.set(x, top, 'K');
  }
  for (let y = 50; y < 64; y += 5) g.hline(23, 40, y, 'r');
}

function tower(g, lit, frame) {
  // Kule gövdesi
  g.rect(21, 28, 22, 37, 'K');
  g.rect(22, 30, 20, 34, 'q');
  for (let y = 33; y < 64; y += 5) g.hline(22, 41, y, 'r');
  g.vline(23, 30, 63, 'u').vline(40, 30, 63, 'r');
  g.hline(20, 43, 29, 'K');
  g.hline(21, 42, 28, 'u');
  // Saat kadranı: altın çerçeve, beyaz kadran, saat işaretleri ve akrep-yelkovan
  g.ellipse(32, 44.5, 8.2, 8.2, 'K');
  g.ellipse(32, 44.5, 7.3, 7.3, 'P');
  g.ellipse(32, 44.5, 6.2, 6.2, 'u');
  // Saat işaretleri: 12, 3, 6, 9 koyu; aradakiler gri
  g.set(31, 39, 'K').set(32, 39, 'K').set(31, 50, 'K').set(32, 50, 'K').set(26, 44, 'K').set(26, 45, 'K').set(37, 44, 'K').set(37, 45, 'K');
  g.set(28, 40, 'R').set(35, 40, 'R').set(28, 49, 'R').set(35, 49, 'R');
  g.vline(31, 40, 44, 'K'); // yelkovan 12'de
  g.hline(32, 35, 44, 'K'); // akrep 3'te
  g.set(31, 44, 'O');
  // Kadranın altında küçük kemerli pencere
  g.rect(30, 55, 4, 7, 'K');
  g.rect(31, 56, 2, 5, lit ? 'Y' : 'n');
  // Çan odası: iki açık kemer, ortada bronz çan; gece fener gibi yanar
  g.rect(22, 14, 20, 15, 'K');
  g.rect(23, 15, 18, 13, 'q');
  for (const x of [24, 33]) {
    g.rect(x, 17, 7, 11, 'K');
    g.rect(x + 1, 18, 5, 10, lit ? 'y' : 'N');
    g.set(x + 1, 18, 'K').set(x + 5, 18, 'K');
  }
  g.vline(31, 16, 27, 'q').vline(32, 16, 27, 'r');
  // Çan (kemerlerin arasında asılı, sallanır)
  const swing = frame % 3 === 1 ? 1 : frame % 3 === 2 ? -1 : 0;
  g.stamp(['.KKK.', 'KYPOK', 'KYPOK', 'KPPOK', 'KKKKK', '..K..'], 29 + swing, 20);
  g.hline(28 + swing, 34 + swing, 24, 'K');
  g.set(30 + swing, 21, 'y');
  g.hline(21, 42, 14, 'K');
  g.hline(22, 41, 13, 'u');
  g.hline(21, 42, 12, 'K');
  // Altın kubbe ve tepelik
  for (let y = 3; y <= 12; y++) {
    const t = (12.5 - y) / 9.5;
    const half = Math.max(1, Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * 9));
    for (let x = 32 - half; x <= 31 + half; x++) {
      const rel = (x - (32 - half)) / (2 * half);
      g.set(x, y, rel < 0.3 ? 'Y' : rel < 0.72 ? 'P' : 'O');
    }
    g.set(32 - half, y, 'K').set(31 + half, y, 'K');
  }
  for (const x of [27, 36]) for (let y = 6; y <= 11; y++) if (g.get(x, y) !== 'K') g.set(x, y, 'y');
  g.rect(31, 0, 2, 4, 'K');
  g.set(31, 1, 'P').set(32, 1, 'Y').set(31, 2, 'P').set(32, 2, 'P');
}

/** Tam (128 satırlık) çizim ızgarası. stage 0 ve 1: temel. */
function buildWonderGrid(stage, lit, frame) {
  const g = new CharGrid(WONDER_ART.width, FULL);
  platform(g, lit, frame);
  if (stage <= 1) {
    foundationDetails(g);
  } else {
    if (stage >= 3) tower(g, lit, frame);
    else towerStump(g);
    hall(g, lit);
    turret(g, 1, stage, frame);
    turret(g, 54, stage, frame + 1);
  }
  brazier(g, 16, lit, frame);
  brazier(g, 47, lit, frame);
  return g;
}

const cropRows = (rows, height) => rows.slice(FULL - height);

/**
 * Aşama sürerken: sıradaki aşama aşağıdan yukarı (step 0-3) yükselir, önünde ahşap iskele durur.
 */
function buildScaffoldRows(stage, step, frame) {
  const next = Math.min(3, stage + 1);
  const cur = buildWonderGrid(stage, false, frame).toRows();
  const nxt = buildWonderGrid(next, false, frame).toRows();
  const [top, bottom] = NEW_SPAN[next] ?? [0, 0];
  const cut = Math.round(bottom - ((bottom - top) * (step + 1)) / 5);
  const g = new CharGrid(WONDER_ART.width, FULL);
  nxt.forEach((row, y) => [...(y >= cut ? row : cur[y])].forEach((c, x) => g.set(x, y, c)));
  // İskele: dikmeler, kat kalasları ve çapraz payandalar
  const poles = next === 2 ? [[4, 18], [45, 59]] : [[19, 44]];
  const upTo = next === 2 ? 52 : 2;
  for (const [a, b] of poles) {
    for (const x of [a, b]) {
      g.vline(x, upTo, 110, 'x');
      g.set(x, upTo, 'K');
    }
    for (let y = upTo + 6; y < 110; y += 12) {
      g.hline(a, b, y, 'E');
      g.hline(a, b, y + 1, 'x');
      if (y + 12 < 110) g.line(a, y + 1, b, y + 11, 'w');
    }
  }
  // Tepedeki makara ve halatla çekilen taş blok
  const hookX = next === 2 ? 32 : 46;
  const hookTop = next === 2 ? 40 : 0;
  g.hline(hookX - 3, hookX + 1, hookTop, 'K');
  g.vline(hookX, hookTop + 1, hookTop + 10 + (frame % 2) * 2, 'x');
  g.stamp(['KKKK', 'KqrK', 'KKKK'], hookX - 1, hookTop + 11 + (frame % 2) * 2);
  return cropRows(g.toRows(), WONDER_ART.heights[next]);
}

/**
 * @param {number} stage tamamlanan aşama (0-3)
 * @param {{ lit?: boolean, frame?: number, scaffold?: boolean, step?: number }} opts
 *   scaffold: sıradaki aşama sürüyor (step 0-3 ilerleme kademesi)
 */
export function getWonderSprite(stage = 3, { lit = false, frame = 0, scaffold = false, step = 0 } = {}) {
  const s = Math.max(1, Math.min(3, stage));
  if (scaffold && s < 3) {
    const k = Math.max(0, Math.min(3, step));
    const f = frame % 2;
    return getSprite(`building:wonder:scaffold:${s}:${k}:${f}`, () => buildScaffoldRows(s, k, f));
  }
  const f = frame % 6;
  return getSprite(`building:wonder:${s}:${lit ? 1 : 0}:${f}`, () => cropRows(buildWonderGrid(s, lit, f).toRows(), WONDER_ART.heights[s]));
}

/** Görselin yüksekliği (aşamaya ve iskeleye göre). */
export function wonderSpriteHeight(stage, scaffold = false) {
  const s = Math.max(1, Math.min(3, stage));
  return WONDER_ART.heights[scaffold && s < 3 ? s + 1 : s];
}
