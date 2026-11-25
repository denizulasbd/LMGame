// (32.5) Hobi evleri (her biri 2x2, görsel 32x44: ev üst karoya 12 piksel taşar). Görsel yapının kapladığı karoların ALT kenarına
// hizalanır. Kışın çatılar karlanır (structures.js → WINTER_ROOFS); bahçe tarhları kendi kış görünümünü çizer (çıplak toprak, kırağı).
//   - Bahçecilik Kulübü: kiremit çatılı küçük ev + camlı sera; önünde mevsim tarhları; ürünler (building.clubWorks, en çok 6)
//     tarhın iki yanına sırayla saksı / çiçek öbeği ekler; kış buluşmasında sera içten yanar, camda eğilmiş siluetler
//   - Dikiş-Nakış Evi: penceresinde renkli kumaş topları ve gergef, kapının yanında ip üstünde kurumaya asılı mendiller;
//     buluşmada / akşam pencere sıcak sarı yanar
//   - Resim Atölyesi: büyük eğimli kuzey penceresi, yan duvarda asılı tablolar (building.clubWorks, en çok 6);
//     buluşmada / akşam pencere yanar
//   - Şövale (9x16): Resim Atölyesi buluşmasında ressamın yanında (Character.js çizer)
import { getSprite, CharGrid } from '../PixelSprite.js';

export const CLUB_ART = { width: 32, height: 44 };

const BED_PLANTS = {
  spring: ['v', 'p', 'P'],
  summer: ['v', 'V', 'o'],
  autumn: ['f', '3', '4'],
  winter: null,
};
const POT_FLOWERS = ['p', 'P', 'i', 'o', 'O', 'u'];

function shadow(g) {
  g.ellipse(16, 42, 15, 1.6, 'k');
}

/** Kiremit üçgen çatı (x0..x1, saçak y, tepe yüksekliği). */
function gableRoof(g, x0, x1, eave, peak) {
  const mid = (x0 + x1) / 2;
  for (let y = peak; y <= eave; y++) {
    const half = Math.round(((y - peak + 1) / (eave - peak + 1)) * ((x1 - x0) / 2 + 1));
    g.hline(Math.round(mid - half), Math.round(mid + half), y, 'C');
    g.set(Math.round(mid - half), y, 'U').set(Math.round(mid + half), y, 'U');
  }
  for (let y = peak + 1; y < eave; y += 2) g.hline(Math.round(mid - (y - peak) * 0.6), Math.round(mid), y, 'Z');
  g.hline(x0 - 1, x1 + 1, eave, 'U');
}

function door(g, x, y, h = 8) {
  g.rect(x, y, 5, h, 'x');
  g.rect(x + 1, y + 1, 3, h - 1, 'w');
  g.set(x + 3, y + Math.floor(h / 2), 'P');
}

// ---------------------------------------------------------------------------------------------------------------- Bahçecilik

function buildGardenRows(season, session, works) {
  const g = new CharGrid(CLUB_ART.width, CLUB_ART.height);
  shadow(g);
  // küçük ev (sol)
  g.rect(1, 22, 16, 15, 'x');
  g.rect(2, 23, 14, 13, 'E');
  for (let y = 25; y < 36; y += 3) g.hline(2, 15, y, 'X');
  gableRoof(g, 0, 17, 22, 11);
  door(g, 7, 28);
  g.rect(2, 26, 4, 3, session ? 'y' : 'N').rect(12, 26, 3, 3, session ? 'y' : 'N');
  // sera (sağ): ince beyaz çerçeve, mavi-yeşil cam, içinde fideler
  g.rect(17, 20, 14, 17, 'q');
  g.rect(18, 21, 12, 15, session ? 'y' : 'a');
  for (const x of [21, 24, 27]) g.vline(x, 21, 35, 'q');
  g.hline(18, 29, 28, 'q');
  g.line(17, 20, 24, 15, 'q').line(24, 15, 31, 20, 'q');
  g.line(18, 20, 24, 16, 'c').line(24, 16, 30, 20, 'c');
  for (let x = 19; x < 30; x += 2) g.set(x, 34, 'v').set(x, 33, session ? 'f' : 'V');
  if (session) for (const x of [20, 25]) g.vline(x, 30, 33, 'n').set(x, 29, 'T').set(x + 1, 30, 'n');
  // önde tarhlar (alt karo şeridi): toprak, mevsim fideleri
  g.rect(1, 37, 30, 5, 'D');
  g.hline(1, 30, 37, 'd').hline(1, 30, 39, 'd');
  const plants = BED_PLANTS[season] ?? BED_PLANTS.summer;
  for (let x = 2; x < 30; x += 3) {
    if (x >= 6 && x <= 10) continue; // kapı önü patika
    if (plants) {
      g.set(x, 37, plants[0]).set(x + 1, 36, plants[0]);
      g.set(x, 36, plants[(x >> 1) % 2 ? 1 : 2]);
    } else g.set(x, 37, '6').set(x + 1, 38, '7');
  }
  g.rect(6, 37, 5, 5, 'e');
  // ürünler: sırayla saksı / çiçek öbekleri (tarhın uçlarına ve evin önüne)
  const spots = [[0, 33], [30, 33], [13, 34], [3, 34], [28, 34], [16, 38]];
  for (let i = 0; i < Math.min(works, spots.length); i++) {
    const [x, y] = spots[i];
    g.rect(x, y + 2, 3, 2, 'C').hline(x, x + 2, y + 2, 'Z');
    const col = season === 'winter' ? 'f' : POT_FLOWERS[i % POT_FLOWERS.length];
    g.set(x + 1, y + 1, 'v').set(x, y, col).set(x + 2, y, col).set(x + 1, y - 1, col);
  }
  return g.toRows();
}

export function getGardenClubSprite(season = 'summer', session = false, works = 0) {
  const k = BED_PLANTS[season] !== undefined ? season : 'summer';
  const w = Math.max(0, Math.min(6, works | 0));
  return getSprite(`building:gardenClub:${k}:${session ? 1 : 0}:${w}`, () => buildGardenRows(k, session, w));
}

// ---------------------------------------------------------------------------------------------------------------- Dikiş-Nakış

function buildSewingRows(season, lit) {
  const g = new CharGrid(CLUB_ART.width, CLUB_ART.height);
  shadow(g);
  g.rect(2, 22, 28, 19, 'Q');
  g.rect(3, 23, 26, 17, 'S');
  for (let y = 26; y < 40; y += 3) g.hline(3, 28, y, 's');
  gableRoof(g, 1, 30, 22, 9);
  // çatıda küçük baca
  g.rect(23, 10, 3, 6, 'R').hline(23, 25, 10, 'q');
  door(g, 5, 31, 9);
  // büyük pencere: kumaş topları ve gergef
  g.rect(12, 26, 15, 10, 'x');
  g.rect(13, 27, 13, 8, lit ? 'y' : 'N');
  const rolls = ['o', 'B', 'P', 'p', 'i'];
  rolls.forEach((col, i) => g.rect(14 + i * 2, 31, 2, 4, col).set(14 + i * 2, 31, 'u'));
  g.ellipse(22, 29, 2.5, 2.5, 'X');
  g.ellipse(22, 29, 1.5, 1.5, 'u');
  g.set(22, 29, 'o').set(21, 30, 'p');
  g.hline(12, 26, 36, 'E');
  // mevsim saksısı pencere önünde
  const flower = { spring: 'p', summer: 'o', autumn: '4', winter: null }[season];
  g.rect(14, 37, 11, 2, 'C');
  if (flower) for (let x = 15; x < 24; x += 2) g.set(x, 36, 'v').set(x, 35, flower);
  // kapının yanında ip üstünde mendiller
  g.hline(0, 4, 25, 'w');
  for (const [x, col] of [[0, 'u'], [3, 'p']]) g.rect(x, 26, 2, 3, col);
  return g.toRows();
}

export function getSewingClubSprite(season = 'summer', lit = false) {
  const k = ['spring', 'summer', 'autumn', 'winter'].includes(season) ? season : 'summer';
  return getSprite(`building:sewingClub:${k}:${lit ? 1 : 0}`, () => buildSewingRows(k, lit));
}

// ---------------------------------------------------------------------------------------------------------------- Resim Atölyesi

function buildPaintingRows(season, lit, works) {
  const g = new CharGrid(CLUB_ART.width, CLUB_ART.height);
  shadow(g);
  g.rect(1, 20, 30, 21, 'x');
  g.rect(2, 21, 28, 19, 'X');
  for (let x = 4; x < 30; x += 4) g.vline(x, 21, 39, 'w');
  // eğimli çatı: solda alçak, sağda yüksek; büyük kuzey penceresi çatının içinde
  for (let y = 6; y <= 20; y++) {
    const x0 = Math.max(0, 31 - Math.round((y - 5) * 2.2));
    g.hline(x0, 31, y, 'C');
    g.set(x0, y, 'U');
  }
  g.hline(0, 31, 20, 'U');
  // kuzey penceresi (çatıda büyük camlı yüzey)
  for (let y = 9; y <= 18; y++) {
    const x0 = Math.max(4, 33 - Math.round((y - 5) * 2.2));
    g.hline(x0, 28, y, lit ? 'y' : 'c');
  }
  for (const x of [16, 22]) g.vline(x, 12, 18, 'q');
  g.hline(10, 28, 15, 'q');
  // ön duvar: kapı ve tabelalı kısa saçak
  door(g, 6, 31, 9);
  g.rect(13, 23, 16, 3, 'E').hline(14, 27, 24, 'O');
  // duvarda asılı tablolar (ürünler)
  const frames = [[13, 28], [18, 28], [23, 28], [13, 34], [18, 34], [23, 34]];
  const pal = [['v', 'c'], ['O', 'P'], ['b', 'u'], ['p', 'v'], ['f', 'a'], ['3', '9']];
  for (let i = 0; i < frames.length; i++) {
    const [x, y] = frames[i];
    if (i < works) {
      g.rect(x, y, 5, 4, 'Y');
      g.rect(x + 1, y + 1, 3, 2, pal[i][1]);
      g.set(x + 2, y + 2, pal[i][0]).set(x + 1, y + 2, pal[i][0]);
    } else g.rect(x + 1, y + 1, 3, 2, 'w');
  }
  // atölye kapısı önünde saksı (mevsim)
  const flower = { spring: 'p', summer: 'P', autumn: '3', winter: null }[season];
  g.rect(1, 38, 3, 3, 'C');
  if (flower) g.set(2, 37, flower).set(1, 36, 'v').set(3, 36, flower);
  return g.toRows();
}

export function getPaintingClubSprite(season = 'summer', lit = false, works = 0) {
  const k = ['spring', 'summer', 'autumn', 'winter'].includes(season) ? season : 'summer';
  const w = Math.max(0, Math.min(6, works | 0));
  return getSprite(`building:paintingClub:${k}:${lit ? 1 : 0}:${w}`, () => buildPaintingRows(k, lit, w));
}

// ---------------------------------------------------------------------------------------------------------------- şövale

const EASEL = [
  '....x....',
  '...xXx...',
  '.uuuuuuu.',
  '.ucvvbbu.',
  '.ucvPbbu.',
  '.uvvvvfu.',
  '.uooffvu.',
  '.uuuuuuu.',
  '..xX.Xx..',
  '..x..Xx..',
  '.xX...Xx.',
  '.x....Xx.',
  'xX.....X.',
  'x......X.',
  'x.......x',
  '.........',
];

export function getEaselSprite() {
  return getSprite('ui:easel', () => EASEL);
}
