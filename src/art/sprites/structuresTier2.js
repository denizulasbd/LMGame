// 8. aşama yapıları: Seviye 2 (yükseltilmiş) yapılar ve kadim harabeler.
//   Taş Ev (kulübe), Kereste Atölyesi (oduncu), Cam Sera (bahçe), Derin Maden Ocağı (taş ocağı)
//   Gözetleme Kulesi, Erzak Kampı, Kadim Çeşme — her biri yıkık ve onarılmış hâliyle
// structures.js'teki gibi her görsel yapının kapladığı karoların ALT kenarına hizalanarak çizilir;
// genişlik yapının karo genişliğine eşittir, yükseklik üstteki karolara taşabilir.
import { getSprite, CharGrid, recolorRows } from '../PixelSprite.js';
import { quarryRows } from './structuresExtra.js';

// Küçük deterministik "rastgelelik": aynı yapı her seferinde aynı taş / yosun dağılımına sahip olsun
function hash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Hazır satırlardan düzenlenebilir ızgara. */
function gridFrom(rows) {
  const g = new CharGrid(rows[0].length, rows.length);
  g.stamp(rows, 0, 0);
  return g;
}

/** Yontma taş duvar: üç satırlık sıralar, kaydırmalı derzler, açık üst kenar ve koyu lekeler. */
function stoneWall(g, x0, y0, x1, y1, salt = 0) {
  for (let y = y0; y <= y1; y++) {
    const course = Math.floor((y - y0) / 3);
    const row = (y - y0) % 3;
    for (let x = x0; x <= x1; x++) {
      const joint = (x - x0 + (course % 2 === 0 ? 0 : 3)) % 6 === 0;
      let c = 'r';
      if (row === 2 || joint) c = 'M';
      else if (row === 0) c = 'q';
      else if (hash(x, y, salt) > 0.82) c = 'R';
      g.set(x, y, c);
    }
  }
}

/** Yosun lekeleri: verilen harflerin üstüne rastgele yeşil benekler (harabeler için). */
function moss(g, x0, y0, x1, y1, density, salt, on = 'rqRM') {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!on.includes(g.get(x, y))) continue;
      const h = hash(x, y, salt);
      if (h < density * 0.5) g.set(x, y, 'f');
      else if (h < density) g.set(x, y, 'v');
    }
  }
}

// ---------------------------------------------------------------------------
// Taş Ev (kulübenin Seviye 2'si; 2x2, görsel 32x46): iki katlı taş duvar, panjurlu pencereler,
// kiremit çatı ve çatı penceresi, taş baca. Pencereler akşam yanar, çatı kulübe gibi tonlanır.
// ---------------------------------------------------------------------------
export const STONE_HOUSE_ART = {
  width: 32,
  height: 46,
  windows: [
    { x: 8.5, y: 22.5 },
    { x: 23.5, y: 22.5 },
    { x: 6.5, y: 34.5 },
    { x: 25.5, y: 34.5 },
  ],
  chimney: { x: 25.5, y: 0 },
};

const ROOF_TONES = [
  {},                              // kiremit
  { C: 'B', U: 'n', Z: 'c' },      // mavi arduvaz
  { C: 'f', U: 'F', Z: 'v' },      // yosunlu yeşil
];

function houseWindow(g, x0, y0) {
  g.rect(x0, y0, 7, 8, 'K');
  g.rect(x0 + 1, y0 + 1, 5, 6, 'A');
  g.hline(x0 + 1, x0 + 5, y0 + 5, 'I');
  g.hline(x0 + 1, x0 + 5, y0 + 6, 'I');
  g.vline(x0 + 3, y0 + 1, y0 + 6, 'x');
  g.hline(x0 + 1, x0 + 5, y0 + 3, 'x');
  // Yeşil panjurlar ve çiçekli pencere önü
  g.vline(x0 - 1, y0 + 1, y0 + 6, 'f');
  g.vline(x0 + 7, y0 + 1, y0 + 6, 'f');
  g.hline(x0 - 1, x0 + 7, y0 + 8, 'E');
  g.set(x0, y0 + 7, 'p').set(x0 + 2, y0 + 7, 'P').set(x0 + 4, y0 + 7, 'p').set(x0 + 6, y0 + 7, 'u');
}

function buildStoneHouseRows() {
  const g = new CharGrid(STONE_HOUSE_ART.width, STONE_HOUSE_ART.height);
  g.rect(3, 44, 29, 2, 'k');

  // Temel
  g.rect(0, 41, 32, 3, 'K');
  g.rect(1, 41, 30, 2, 'R');
  g.hline(1, 30, 41, 'r');

  // İki katlı taş duvar ve katlar arası ahşap kuşak
  g.rect(1, 15, 30, 26, 'K');
  stoneWall(g, 2, 16, 29, 40, 4);
  g.hline(2, 29, 29, 'X');
  g.hline(2, 29, 30, 'x');
  g.vline(2, 16, 40, 'R');
  g.vline(29, 16, 40, 'R');

  houseWindow(g, 5, 19);
  houseWindow(g, 20, 19);
  houseWindow(g, 3, 31);
  houseWindow(g, 22, 31);

  // Kemerli kapı
  g.rect(12, 31, 8, 10, 'K');
  g.rect(13, 32, 6, 9, 'w');
  g.hline(13, 18, 32, 'X');
  g.vline(15, 33, 40, 'x');
  g.vline(17, 33, 40, 'x');
  g.set(18, 36, 'P');
  g.hline(11, 20, 30, 'q');
  g.set(12, 31, 'q').set(19, 31, 'q');
  g.rect(11, 41, 10, 2, 'q');

  // Dik kiremit çatı
  for (let y = 2; y <= 14; y++) {
    const inset = Math.max(0, 6 - Math.floor((y - 2) / 2));
    const x0 = inset;
    const x1 = 31 - inset;
    g.hline(x0, x1, y, 'C');
    g.set(x0, y, 'K');
    g.set(x1, y, 'K');
    const course = Math.floor((y - 3) / 3);
    if ((y - 3) % 3 === 2) g.hline(x0 + 1, x1 - 1, y, 'U');
    else for (let x = x0 + 2 + (course % 2) * 3; x < x1; x += 6) g.set(x, y, 'U');
  }
  g.hline(6, 25, 2, 'K');
  g.hline(7, 24, 3, 'Z');
  g.hline(1, 30, 14, 'U');
  g.hline(0, 31, 15, 'K');

  // Yuvarlak çatı penceresi
  g.ellipse(15.5, 9, 2.8, 2.8, 'K');
  g.ellipse(15.5, 9, 1.8, 1.8, 'A');
  g.set(15, 8, 'I');

  // Taş baca
  g.rect(22, 0, 7, 2, 'K');
  g.hline(23, 27, 1, 'q');
  g.rect(23, 2, 5, 8, 'K');
  g.rect(24, 2, 3, 8, 'r');
  g.set(25, 3, 'R').set(24, 5, 'R').set(26, 6, 'R').set(25, 8, 'R');
  return g.toRows();
}

let stoneHouseRows = null;

export function getStoneHouseSprite(lit, tone = 0) {
  const t = ((tone % ROOF_TONES.length) + ROOF_TONES.length) % ROOF_TONES.length;
  return getSprite(`building:stoneHouse:${t}:${lit ? 'lit' : 'day'}`, () => {
    stoneHouseRows ??= buildStoneHouseRows();
    const glass = lit ? { A: 'y', I: 'P' } : { A: 'a', I: 'c' };
    return recolorRows(stoneHouseRows, { ...glass, ...ROOF_TONES[t] });
  });
}

// ---------------------------------------------------------------------------
// Kereste Atölyesi (oduncunun Seviye 2'si; 2x2, görsel 32x42): kiremit çatılı açık atölye,
// tezgâhta dönen hızar (çalışırken iki karede döner), kesilen kütük, kalas yığını, odun piramidi
// ---------------------------------------------------------------------------
const LOG_END = ['xXx', 'XEX', 'xXx'];

function buildSawmillRows(frame) {
  const g = new CharGrid(32, 42);
  g.rect(3, 40, 29, 2, 'k');

  // Arka tahta duvar ve iç gölge
  g.rect(1, 16, 30, 23, 'K');
  for (let y = 17; y <= 37; y++) g.hline(2, 29, y, (y - 17) % 3 === 1 ? 'x' : 'w');
  g.rect(4, 20, 24, 13, 'x');
  for (let y = 22; y < 33; y += 4) g.hline(5, 26, y, 'w');

  // Talaşlı toprak zemin
  g.rect(2, 36, 28, 3, 'D');
  g.hline(2, 29, 36, 'd');
  [[4, 37], [8, 38], [13, 37], [18, 38], [25, 37], [28, 38]].forEach(([x, y]) => g.set(x, y, 'S'));

  // Arkada odun piramidi
  [[19, 29], [22, 29], [25, 29], [20, 26], [23, 26], [21, 23]].forEach(([x, y]) => g.stamp(LOG_END, x, y));

  // Direkler
  for (const x of [2, 28]) {
    g.rect(x, 17, 3, 20, 'K');
    g.vline(x + 1, 17, 36, 'X');
  }

  // Kiremit çatı ve havalandırma bacası
  for (let y = 5; y <= 17; y++) {
    const inset = Math.max(0, 4 - Math.floor((y - 5) / 3));
    g.hline(inset, 31 - inset, y, 'C');
    g.set(inset, y, 'K');
    g.set(31 - inset, y, 'K');
    if ((y - 5) % 3 === 2) g.hline(inset + 1, 30 - inset, y, 'U');
    else for (let x = inset + 2 + (y % 2) * 3; x < 31 - inset; x += 6) g.set(x, y, 'U');
  }
  g.hline(4, 27, 4, 'K');
  g.hline(5, 26, 5, 'Z');
  g.hline(0, 31, 17, 'K');
  g.rect(13, 0, 6, 5, 'K');
  g.rect(14, 1, 4, 4, 'X');
  g.hline(12, 19, 0, 'K');

  // Hızar tezgâhı: tablası, ayakları, yarısı tablanın üstünde dönen daire testere
  const blade = { x: 10.5, y: 28.5 };
  g.ellipse(blade.x, blade.y, 5.4, 5.4, 'K');
  g.ellipse(blade.x, blade.y, 4.4, 4.4, 'q');
  g.ellipse(blade.x, blade.y, 2.2, 2.2, 'r');
  g.set(10, 28, 'Q');
  const teeth = frame === 0
    ? [[10, 23], [15, 28], [6, 25], [14, 25], [5, 28]]
    : [[12, 23], [8, 23], [15, 26], [5, 26], [16, 29]];
  teeth.forEach(([x, y]) => g.set(x, y, 'u'));
  g.rect(3, 30, 16, 3, 'K');
  g.hline(4, 17, 30, 'E');
  g.hline(4, 17, 31, 'X');
  for (const x of [5, 16]) g.vline(x, 33, 38, 'x');
  // Tezgâhtaki kütük
  g.rect(12, 26, 7, 4, 'K');
  g.rect(13, 27, 5, 2, 'w');
  g.hline(13, 17, 27, 'X');
  g.stamp(['K', 'E', 'K'], 18, 26);

  // Önde kalas yığını
  g.rect(20, 33, 10, 5, 'K');
  for (let y = 34; y <= 36; y++) g.hline(21, 28, y, y % 2 === 0 ? 'E' : 'X');
  g.hline(21, 28, 37, 'x');
  return g.toRows();
}

export function getSawmillSprite(frame = 0) {
  const f = frame % 2;
  return getSprite(`building:sawmill:${f}`, () => buildSawmillRows(f));
}

// ---------------------------------------------------------------------------
// Cam Sera (bahçenin Seviye 2'si; 3x3, görsel 48x54): tuğla taban, beyaz çerçeveli cam duvarlar ve
// üçgen cam çatı; camın ardında domates ve yeşillikler. Kışın da yeşil kalır (çatıya kar yağar).
// ---------------------------------------------------------------------------
function buildGreenhouseRows() {
  const W = 48;
  const g = new CharGrid(W, 54);
  g.rect(2, 52, 45, 2, 'k');

  // Tuğla taban
  g.rect(1, 44, 46, 8, 'K');
  for (let y = 45; y <= 50; y++) {
    for (let x = 2; x <= 45; x++) {
      const row = (y - 45) % 3;
      const joint = (x + (Math.floor((y - 45) / 3) % 2) * 3) % 6 === 0;
      g.set(x, y, row === 2 || joint ? 'M' : row === 0 ? 'Z' : 'C');
    }
  }

  // Cam duvarlar: alt bölmelerde bitkiler, üstte gökyüzü yansıması
  g.rect(1, 23, 46, 22, 'K');
  for (let y = 24; y <= 43; y++) {
    for (let x = 2; x <= 45; x++) {
      let c = y < 33 ? 'a' : 'c';
      if (y >= 33) {
        const h = hash(x, y, 9);
        c = h > 0.55 ? 'v' : h > 0.3 ? 'f' : h > 0.22 ? 'V' : 'c';
        if (h > 0.95 && y < 41) c = 'o';
      }
      g.set(x, y, c);
    }
  }
  for (let i = 0; i < 6; i++) g.line(5 + i * 8, 31, 8 + i * 8, 25, 'W'); // cam yansımaları
  for (let x = 2; x <= 45; x += 7) g.vline(x, 23, 44, 'u');
  g.hline(1, 46, 23, 'u');
  g.hline(1, 46, 33, 'u');
  g.hline(1, 46, 44, 'u');
  g.vline(1, 23, 44, 'K');
  g.vline(46, 23, 44, 'K');

  // Kapı
  g.rect(20, 33, 8, 12, 'K');
  g.rect(21, 34, 6, 10, 'a');
  g.vline(23, 34, 43, 'u');
  g.vline(24, 34, 43, 'u');
  g.set(26, 39, 'P');

  // Üçgen cam çatı: kenarlarda kontur, mertekler ve yansıma
  for (let y = 4; y <= 22; y++) {
    const half = Math.round((y - 4) * 1.25) + 1;
    const x0 = Math.max(0, 23 - half);
    const x1 = Math.min(W - 1, 24 + half);
    for (let x = x0; x <= x1; x++) g.set(x, y, (x + y) % 9 === 0 ? 'W' : y < 12 ? 'a' : 'c');
    g.set(x0, y, 'K');
    g.set(x1, y, 'K');
  }
  for (const xEnd of [8, 16, 31, 39]) g.line(xEnd < 24 ? 23 : 24, 5, xEnd, 22, 'u');
  g.vline(23, 4, 22, 'u');
  g.vline(24, 4, 22, 'u');
  g.hline(0, 47, 22, 'K');
  // Çatı mahyası ve havalandırma kapağı
  g.rect(21, 1, 6, 4, 'K');
  g.rect(22, 2, 4, 2, 'X');
  g.hline(22, 25, 2, 'E');
  return g.toRows();
}

export function getGreenhouseSprite() {
  return getSprite('building:greenhouse', buildGreenhouseRows);
}

// ---------------------------------------------------------------------------
// Derin Maden Ocağı (taş ocağının Seviye 2'si; 3x3, görsel 48x56): ocağın kaya duvarına açılmış
// ahşap destekli maden girişi, raylar ve taş dolu vagon, demir kuşaklarla güçlendirilmiş vinç
// ---------------------------------------------------------------------------
function buildDeepMineRows(frame) {
  const g = gridFrom(quarryRows(frame));

  // Maden girişi: kaya duvarında karanlık tünel ve kalın ahşap çerçeve
  g.rect(13, 22, 11, 15, 'K');
  g.rect(15, 25, 7, 12, 'K');
  for (let y = 26; y <= 36; y++) g.hline(16, 20, y, y % 4 === 0 ? 'Q' : 'K');
  for (const x of [13, 22]) {
    g.vline(x, 24, 36, 'X');
    g.vline(x + 1, 24, 36, 'x');
  }
  g.hline(12, 25, 22, 'K');
  g.hline(13, 24, 23, 'E');
  g.hline(13, 24, 24, 'X');
  g.set(17, 21, 'O').set(18, 20, 'Y').set(18, 21, 'O'); // girişte asılı fener

  // Raylar: tünelden öne doğru, traversler
  g.rect(2, 47, 44, 5, 'z');
  for (let x = 3; x <= 44; x += 3) g.vline(x, 47, 51, 'x');
  g.hline(2, 45, 48, 'R');
  g.hline(2, 45, 50, 'R');
  g.hline(2, 45, 47, 'q');
  g.hline(2, 45, 49, 'q');
  for (let y = 37; y <= 46; y++) {
    g.set(17, y, 'q');
    g.set(20, y, 'q');
    if (y % 2 === 0) g.hline(16, 21, y, 'x');
  }

  // Taş dolu maden vagonu
  g.rect(27, 40, 13, 7, 'K');
  g.rect(28, 41, 11, 5, 'R');
  g.hline(28, 38, 41, 'r');
  g.vline(33, 41, 45, 'Q');
  g.stamp(['..KK..KK.', '.KqqKKqrK', 'KqrrRrrRK'], 29, 37);
  for (const cx of [30.5, 36.5]) {
    g.ellipse(cx, 47, 2.2, 2.2, 'K');
    g.set(Math.floor(cx), 47, 'q');
  }

  // Vinç: demir kuşaklar ve ikinci destek
  for (let y = 10; y <= 46; y += 6) g.hline(39, 42, y, 'Q');
  g.line(44, 46, 42, 24, 'K');
  g.line(45, 46, 43, 24, 'Q');
  g.set(40, 9, 'q').set(40, 21, 'q').set(40, 33, 'q');
  return g.toRows();
}

export function getDeepMineSprite(frame = 0) {
  const f = frame % 2;
  return getSprite(`building:deepMine:${f}`, () => buildDeepMineRows(f));
}

// ---------------------------------------------------------------------------
// Gözetleme Kulesi (2x2, görsel 32x64): yıkıkken yosunlu, tepesi kırık bir taş gövde ve çevresine
// saçılmış bloklar; onarılınca mazgallı taş kule, ahşap külah çatı, tepede fener ve bayrak
// ---------------------------------------------------------------------------
export const WATCHTOWER_ART = { width: 32, height: 64, light: { x: 16, y: 12 } };

function buildWatchtowerRows(ruined) {
  const g = new CharGrid(32, 64);
  g.ellipse(16, 61.5, 15, 2.6, 'k');

  // Taban basamağı
  g.rect(3, 55, 26, 6, 'K');
  g.rect(4, 56, 24, 4, 'R');
  g.hline(4, 27, 56, 'q');

  if (ruined) {
    // Kırık gövde: düzensiz üst kenar
    for (let x = 6; x <= 25; x++) {
      const top = 34 + Math.round(4 * Math.abs(Math.sin(x * 0.9)) + (x > 17 ? 6 : 0) + hash(x, 0, 3) * 3);
      for (let y = top; y <= 55; y++) g.set(x, y, 'r');
      g.set(x, top, 'K');
    }
    stoneWall(g, 7, 40, 24, 54, 7);
    for (let x = 6; x <= 25; x++) {
      const top = 34 + Math.round(4 * Math.abs(Math.sin(x * 0.9)) + (x > 17 ? 6 : 0) + hash(x, 0, 3) * 3);
      g.set(x, top, 'K');
      if (top + 1 < 40) g.vline(x, top + 1, 39, x % 3 === 0 ? 'R' : 'r');
    }
    g.vline(6, 36, 55, 'K');
    g.vline(25, 42, 55, 'K');
    // Çökmüş kapı kemeri ve çatlaklar
    g.rect(13, 47, 6, 9, 'K');
    g.rect(14, 48, 4, 7, 'Q');
    g.line(9, 42, 12, 50, 'Q');
    g.line(22, 45, 20, 52, 'Q');
    moss(g, 6, 34, 25, 55, 0.3, 11);
    // Sarmaşık ve çevreye saçılmış bloklar
    g.line(24, 44, 23, 54, 'v').line(25, 46, 24, 53, 'f');
    g.stamp(['.KKK.', 'KqrrK', 'KRRRK', '.KKK.'], 0, 55);
    g.stamp(['KKKK', 'KqrK', 'KKKK'], 27, 57);
    g.stamp(['.KK.', 'KqrK', '.KK.'], 22, 59);
    g.stamp(['vfv', '.v.'], 2, 53).stamp(['fvf', '.f.'], 26, 53);
    return g.toRows();
  }

  // Taş gövde
  g.rect(6, 22, 20, 34, 'K');
  stoneWall(g, 7, 23, 24, 55, 7);
  g.vline(7, 23, 55, 'q');
  g.vline(24, 23, 55, 'R');
  // Ok mazgalları ve kemerli kapı
  for (const y of [28, 38]) {
    g.rect(15, y, 2, 5, 'K');
    g.set(15, y + 1, 'Q');
  }
  g.rect(12, 46, 8, 10, 'K');
  g.rect(13, 47, 6, 9, 'w');
  g.hline(13, 18, 47, 'X');
  g.vline(15, 48, 55, 'x');
  g.set(17, 51, 'P');
  g.hline(11, 20, 45, 'q');

  // Mazgallı seyir katı
  g.rect(3, 16, 26, 7, 'K');
  g.rect(4, 17, 24, 5, 'r');
  g.hline(4, 27, 17, 'q');
  g.hline(4, 27, 21, 'R');
  for (let x = 3; x <= 27; x += 5) {
    g.rect(x, 13, 3, 3, 'K');
    g.rect(x + 1, 14, 1, 2, 'q');
  }

  // Fener ve ahşap direkler
  for (const x of [5, 26]) g.vline(x, 8, 15, 'x');
  g.rect(13, 9, 6, 6, 'K');
  g.rect(14, 10, 4, 4, 'A');
  g.set(15, 11, 'I').set(16, 12, 'I');

  // Ahşap külah çatı ve bayrak
  for (let y = 1; y <= 9; y++) {
    const half = 2 + Math.round((y - 1) * 1.6);
    const x0 = 16 - half;
    const x1 = 15 + half;
    g.hline(x0, x1, y, (y + x0) % 2 === 0 ? 'X' : 'w');
    g.set(x0, y, 'K').set(x1, y, 'K');
  }
  g.hline(2, 29, 9, 'K');
  g.vline(16, 0, 1, 'K');
  g.stamp(['oo', 'oO', 'o.'], 17, 0);
  return g.toRows();
}

export function getWatchtowerSprite(ruined, lit) {
  return getSprite(`building:watchtower:${ruined ? 'ruin' : lit ? 'lit' : 'day'}`, () => {
    const rows = buildWatchtowerRows(ruined);
    return ruined ? rows : recolorRows(rows, lit ? { A: 'y', I: 'P' } : { A: 'a', I: 'c' });
  });
}

// ---------------------------------------------------------------------------
// Erzak Kampı (2x2, görsel 32x38): yıkıkken çökmüş yırtık çadır, kırık sandık ve devrik fıçı,
// otlar; onarılınca gergin kanvas çadır, sandıklar, fıçılar, çuvallar ve küçük bayrak
// ---------------------------------------------------------------------------
const CRATE = ['KKKKKKK', 'KXEXEXK', 'KxXxXxK', 'KEXKXEK', 'KxXxXxK', 'KKKKKKK'];
const BARREL = ['.KKKK.', 'KwXXwK', 'KqqqqK', 'KwXXwK', 'KqqqqK', 'KwXXwK', '.KKKK.'];
const SACK = ['.KKK.', 'KsSsK', 'KsssK', 'KzszK', '.KKK.'];

function buildSupplyCampRows(ruined) {
  const g = new CharGrid(32, 38);
  g.ellipse(16, 35.5, 15.5, 2.4, 'k');

  if (ruined) {
    // Çökmüş çadır: yamuk, yırtık kanvas ve kırık direk
    for (let y = 18; y <= 33; y++) {
      const half = Math.round((y - 18) * 0.9) + 2;
      const x0 = 12 - half + Math.floor((y - 18) / 4);
      const x1 = 13 + half;
      for (let x = Math.max(1, x0); x <= Math.min(29, x1); x++) {
        const h = hash(x, y, 21);
        g.set(x, y, h > 0.85 ? '.' : h > 0.6 ? 'z' : h > 0.25 ? 'D' : 'd');
      }
      g.set(Math.max(1, x0), y, 'K');
      g.set(Math.min(29, x1), y, 'K');
    }
    g.line(13, 16, 19, 33, 'x').line(14, 16, 20, 33, 'w');
    g.hline(2, 29, 33, 'K');
    // Kırık sandık ve devrik fıçı
    g.stamp(['KKKK.KK', 'KXE.XEK', 'Kx.xX.K', 'KKK.KKK'], 21, 29);
    g.stamp(['.KKKKKKK.', 'KwqwqwqwK', 'KXqXqXqXK', '.KKKKKKK.'], 1, 30);
    g.stamp(['.x.', 'xKx'], 9, 33);
    moss(g, 1, 18, 30, 35, 0.22, 23, 'zDdXxw');
    g.stamp(['vfv', '.v.'], 27, 32).stamp(['fvf', '.f.'], 5, 27).stamp(['.v.', 'vfv'], 16, 33);
    return g.toRows();
  }

  // Kanvas çadır (A biçimi), açık giriş
  for (let y = 8; y <= 32; y++) {
    const half = Math.round((y - 8) * 0.55) + 1;
    const x0 = 11 - half;
    const x1 = 12 + half;
    g.hline(x0, x1, y, (x0 + y) % 4 === 0 ? 's' : 'S');
    g.set(x0, y, 'K').set(x1, y, 'K');
    g.set(x0 + 1, y, 'z');
  }
  g.hline(0, 23, 32, 'K');
  g.stamp(['..K..', '.KxK.', '.KxK.', 'KxxxK', 'KxxxK', 'KxxxK'], 9, 26);
  g.vline(11, 4, 8, 'x').stamp(['PO', 'P.'], 12, 4);

  // Sandıklar, fıçılar, çuval
  g.stamp(CRATE, 22, 26).stamp(CRATE, 24, 20);
  g.stamp(BARREL, 25, 29).stamp(BARREL, 18, 29);
  g.stamp(SACK, 1, 30);
  g.stamp(['.p.', 'pPp', '.v.'], 28, 17);
  return g.toRows();
}

export function getSupplyCampSprite(ruined) {
  return getSprite(`building:supplyCamp:${ruined ? 'ruin' : 'ok'}`, () => buildSupplyCampRows(ruined));
}

// ---------------------------------------------------------------------------
// Kadim Çeşme (2x2, görsel 32x40): yıkıkken çatlak, kupkuru, yosunlu taş havuz ve kırık sütun;
// onarılınca oymalı sütundan şırıl şırıl akan berrak su (dört kare), parıltılar
// ---------------------------------------------------------------------------
function buildAncientFountainRows(ruined, frame) {
  const g = new CharGrid(32, 40);
  g.ellipse(16.5, 36.5, 15, 3, 'k');

  // Sekizgen havuz duvarı ve kenar taşı
  g.ellipse(16, 30.5, 15.5, 7, 'K');
  g.ellipse(16, 30.5, 14.5, 6, 'R');
  g.ellipse(16, 29.5, 14.5, 5.6, 'r');
  for (let x = 4; x < 30; x += 4) g.set(x, 33, 'M').set(x + 2, 35, 'M');
  g.ellipse(16, 27.5, 15.5, 6.2, 'K');
  g.ellipse(16, 27.5, 14.5, 5.2, 'q');

  if (ruined) {
    // Kuru, çatlak havuz tabanı
    g.ellipse(16, 27.5, 12, 4, 'D');
    g.ellipse(16, 27.5, 10.5, 3, 'd');
    g.line(8, 27, 13, 29, 'D').line(18, 26, 24, 28, 'D').line(14, 26, 16, 29, 'D');
    // Kırık sütun ve devrik başlık
    g.rect(13, 14, 6, 14, 'K');
    g.rect(14, 15, 4, 13, 'r');
    g.vline(14, 16, 27, 'q');
    g.hline(13, 18, 14, 'K').set(14, 13, 'K').set(15, 12, 'K').set(16, 13, 'K').set(15, 13, 'r');
    g.stamp(['.KKKK.', 'KqqqrK', 'KRRRRK', '.KKKK.'], 23, 32);
    g.line(4, 26, 7, 33, 'Q').line(26, 25, 24, 34, 'Q');
    moss(g, 1, 12, 31, 37, 0.32, 31);
    g.stamp(['vfv', '.v.'], 1, 31).stamp(['.v.', 'fvf'], 26, 22).stamp(['vf', '.v'], 12, 34);
    return g.toRows();
  }

  // Berrak su ve halkalar
  g.ellipse(16, 27.5, 12, 4, 'N');
  g.ellipse(16, 27.5, 11, 3.2, 'b');
  const ripple = [[6, 27], [10, 29], [21, 26], [24, 28], [13, 25], [18, 30]];
  ripple.forEach(([x, y], i) => {
    if ((i + frame) % 2 === 0) g.set(x, y, 'c').set(x + 1, y, 'c');
  });
  g.set(8 + frame * 4, 26 + (frame % 2), 'a');

  // Oymalı sütun, altın şerit ve aslan ağzından akan su
  g.rect(13, 10, 6, 18, 'K');
  g.rect(14, 11, 4, 17, 'q');
  g.vline(17, 11, 27, 'r');
  g.hline(14, 17, 16, 'P');
  g.hline(14, 17, 22, 'P');
  g.ellipse(16, 10, 5.5, 2.4, 'K');
  g.ellipse(16, 9.8, 4.5, 1.6, 'q');
  g.stamp(['.KK.', 'KPPK', '.KK.'], 14, 6);
  g.set(15, 5, 'Y');
  // Akan su (kareye göre kayan parıltılar)
  for (let y = 12; y <= 25; y++) {
    const c = (y + frame) % 4 === 0 ? 'W' : (y + frame) % 4 === 2 ? 'a' : 'c';
    g.set(19, y, c).set(12, y, (y + frame + 2) % 4 === 0 ? 'W' : 'c');
  }
  const sparkles = [[4, 22], [27, 21], [9, 19], [23, 18]];
  g.set(...sparkles[frame % 4], 'W');
  g.set(...sparkles[(frame + 2) % 4], 'a');
  // Yosun ve çiçekler (bakımlı)
  g.stamp(['.p.', 'pPp', '.v.'], 1, 30).stamp(['.u.', 'uPu', '.v.'], 28, 30);
  return g.toRows();
}

export function getAncientFountainSprite(ruined, frame = 0) {
  const f = ruined ? 0 : frame % 4;
  return getSprite(`building:ancientFountain:${ruined ? 'ruin' : f}`, () => buildAncientFountainRows(ruined, f));
}
