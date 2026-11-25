// (32.4) Darülfünun (4x3, görsel 64x62). Görsel yapının kapladığı karoların ALT kenarına hizalanır; kubbe üst karoya 14 piksel taşar.
//   - kesme taş medrese: ortada bakır yeşili (zamanla oksitlenmiş) büyük kubbe ve altın alem, iki yanda küçük yan kubbeler
//   - ön cephede beş kemerli revak (avlu): yan kemerlerde kitaplık rafları, ortada çift kanatlı ahşap kapı; kapının iki yanında
//     avludan görünen mevsim ağacı (ilkbahar pembe çiçek, yaz yeşil, sonbahar turuncu, kışın çıplak dal) ve taş basamaklar
//   - ders saatinde (building.look.lecture; kaydedilmez) ve akşamları revak pencereleri sıcak sarı yanar
//   - kışın kubbeler ve saçak karlanır (structures.js → WINTER_ROOFS.university)
import { getSprite, CharGrid } from '../PixelSprite.js';

export const UNIVERSITY_ART = { width: 64, height: 62, windows: [{ x: 10, y: 40 }, { x: 22, y: 40 }, { x: 42, y: 40 }, { x: 54, y: 40 }] };

const TREES = {
  spring: ['p', 'v', 'V'],
  summer: ['v', 'f', 'V'],
  autumn: ['O', 'Y', 'o'],
  winter: null,
};

function dome(g, cx, cy, rx, ry, top) {
  // mavi kurşun-çini kubbe: koyu kontur, ana ton, sol üstte ışık, dikey kaburgalar
  g.ellipse(cx, cy, rx + 1, ry + 1, 'N');
  g.ellipse(cx, cy, rx, ry, 'b');
  g.ellipse(cx - Math.round(rx / 3), cy - Math.round(ry / 3), Math.max(1, Math.round(rx / 2.2)), Math.max(1, Math.round(ry / 2)), 'c');
  g.set(cx - Math.round(rx / 2), cy - Math.round(ry / 2), 'a');
  if (rx >= 8) for (const k of [-0.6, -0.25, 0.25, 0.6]) {
    const x = cx + Math.round(k * rx);
    const h = Math.round(ry * Math.sqrt(1 - k * k));
    g.vline(x, cy - h + 1, cy + ry - 1, 'N');
  }
  // alem (altın top ve hilal)
  g.vline(cx, top + 3, cy - ry - 1, 'Y').set(cx, top + 2, 'P').set(cx - 1, top, 'Y').set(cx - 1, top + 1, 'Y').set(cx + 1, top, 'Y').set(cx + 1, top + 1, 'Y');
}

function buildUniversityRows(season = 'summer', lit = false) {
  const W = UNIVERSITY_ART.width;
  const H = UNIVERSITY_ART.height;
  const g = new CharGrid(W, H);
  g.ellipse(32, H - 2.5, 30, 2, 'k');
  // basamaklar (kapının önünde iki sıra)
  g.rect(24, 54, 16, 2, 'q').hline(24, 39, 55, 'R');
  g.rect(22, 56, 20, 3, 'r').hline(22, 41, 56, 'q').hline(22, 41, 58, 'R');
  // kubbeler (önce çizilir; alt yarılarını salonun duvarı örter): büyük orta, iki yan
  dome(g, 32, 16, 13, 11, 0);
  dome(g, 13, 17, 5, 4, 7);
  dome(g, 51, 17, 5, 4, 7);
  // arka gövde (kubbeli salon) — revakın arkasında, üstte görünür; üst kenarı kubbelerin kasnağı
  g.rect(8, 18, 48, 14, 'Q');
  g.rect(9, 19, 46, 12, 'r');
  g.hline(8, 55, 18, 'q');
  for (let y = 22; y < 31; y += 3) g.hline(9, 54, y, 'R');
  // kubbe kasnağında küçük pencereler
  for (const x of [22, 27, 36, 41]) g.rect(x, 19, 2, 3, lit ? 'Y' : 'x');
  // ön cephe (revak duvarı)
  g.rect(1, 31, 62, 23, 'Q');
  g.rect(2, 32, 60, 21, 'q');
  for (let y = 34; y < 53; y += 4) {
    g.hline(2, 61, y, 'r');
    for (let x = 3 + ((y / 4) % 2) * 4; x < 61; x += 8) g.set(x, y + 1, 'r').set(x, y + 2, 'r');
  }
  // saçak (ince kiremit; kışın karlanır)
  g.rect(0, 29, 64, 3, 'C').hline(0, 63, 29, 'Z').hline(0, 63, 31, 'U');
  // beş kemerli revak: dört kitaplıklı pencere + ortada kapı
  for (const ax of [6, 18, 38, 50]) {
    g.rect(ax, 36, 8, 14, 'Q');
    g.rect(ax + 1, 37, 6, 13, lit ? 'Y' : 'N');
    g.set(ax + 1, 37, 'Q').set(ax + 6, 37, 'Q').hline(ax + 2, ax + 5, 36, 'q');
    // raflar ve kitap sırtları
    for (let yy = 41; yy < 50; yy += 3) {
      g.hline(ax + 1, ax + 6, yy, lit ? 'O' : 'x');
      g.set(ax + 2, yy - 1, lit ? 'o' : 'U').set(ax + 3, yy - 1, lit ? 'P' : 'w').set(ax + 4, yy - 1, lit ? 'O' : 'n').set(ax + 5, yy - 1, lit ? 'o' : 'B');
    }
    // sütun başlıkları
    g.rect(ax - 1, 35, 10, 1, 'u');
  }
  // orta kemer: çift kanat ahşap kapı, kemer taşları
  g.rect(27, 35, 10, 19, 'Q');
  g.rect(28, 37, 8, 17, 'x');
  g.hline(29, 34, 35, 'u').set(28, 36, 'u').set(35, 36, 'u');
  g.rect(29, 39, 3, 14, 'w').rect(32, 39, 3, 14, 'w');
  g.vline(31, 39, 52, 'x').vline(32, 39, 52, 'x');
  g.set(30, 46, 'P').set(33, 46, 'P');
  // kapı üstünde kitabe (altın yazı şeridi)
  g.rect(25, 32, 14, 3, 'S').hline(26, 37, 33, 'Y').set(25, 32, 'Q').set(38, 32, 'Q');
  // avludan görünen mevsim ağaçları (revak duvarının arkasından taşar)
  const tree = season in TREES ? TREES[season] : TREES.summer;
  for (const tx of [4, 59]) {
    g.vline(tx, 22, 30, 'x').set(tx - 1, 25, 'x').set(tx + 1, 24, 'x');
    if (tree) {
      g.ellipse(tx, 22, 4, 4, tree[1]);
      g.ellipse(tx - 1, 21, 2, 2, tree[2]);
      for (const [dx, dy] of [[-2, 20], [2, 21], [0, 24], [-3, 23], [3, 19]]) g.set(tx + dx, dy, tree[0]);
    } else {
      g.line(tx, 24, tx - 3, 19, 'x');
      g.line(tx, 23, tx + 3, 18, 'x');
      g.set(tx - 3, 18, 'u').set(tx + 3, 17, 'u');
    }
  }
  return g.toRows();
}

/** Darülfünun: mevsim (avlu ağaçları) ve aydınlık pencereler (ders saati ya da akşam). */
export function getUniversitySprite(season = 'summer', lit = false) {
  const key = TREES[season] !== undefined ? season : 'summer';
  return getSprite(`building:university:${key}:${lit ? 1 : 0}`, () => buildUniversityRows(key, lit));
}
