// 11. aşama: hayvanlar. Hepsi sağa bakar; sola bakınca aynalanır. Ayak noktası en alt satırın ortasıdır.
//   Tavşan (9x8): oturma, iki zıplama karesi, ot kemirme; kışın beyaz kürk
//   Geyik (16x16): ayakta, iki yürüme karesi, otlama (baş eğik), yatma; erkeği boynuzlu
//   Kedi (10x8): oturma, iki yürüme karesi, kıvrılıp uyuma; tekir (gri), sarman (turuncu), kara-beyaz
//   Köpek (12x10): oturma, iki yürüme karesi, kıvrılıp uyuma; kahverengi, alacalı
// Şekiller elips ve dikdörtgenlerden çizilir, kontur (K) otomatik eklenir; ayrıntılar (göz, burun, kulak içi)
// konturdan sonra basılır. Böylece her poz aynı çizim kuralıyla tutarlı görünür.
import { getSprite, CharGrid, flipRowsHorizontal } from '../PixelSprite.js';

const FILLED = (c) => c !== '.' && c !== 'k';

/** Dolu piksellerin dört yanındaki boş piksellere kontur basar. */
function outline(g) {
  const src = g.cells.map((row) => [...row]);
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (src[y][x] !== '.') continue;
      const near = [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => FILLED(src[y + dy]?.[x + dx] ?? '.'));
      if (near) g.set(x, y, 'K');
    }
  }
}

/** Ayakların altına yumuşak gölge (yalnızca boş piksellere). */
function shadow(g, x0, x1) {
  const y = g.height - 1;
  for (let x = x0; x <= x1; x++) if (g.get(x, y) === '.') g.set(x, y, 'k');
}

function sprite(w, h, body, details) {
  const g = new CharGrid(w, h);
  body(g);
  outline(g);
  details?.(g);
  return g;
}

// ---------------------------------------------------------------------------
// Tavşan
// ---------------------------------------------------------------------------
const RABBIT_FUR = [
  { main: 'E', shade: 'X', belly: 'S', ear: 'p' }, // kahverengi
  { main: 'r', shade: 'R', belly: 'q', ear: 'p' }, // gri
];
const RABBIT_WINTER = { main: 'u', shade: '6', belly: 'u', ear: 'p' };

function rabbitRows(pose, fur) {
  const { main, shade, belly, ear } = fur;
  return sprite(9, 8, (g) => {
    if (pose === 'hop1') {
      // havada: gövde uzanır, arka ayaklar geride
      g.ellipse(3.6, 4.3, 3.2, 1.6, main);
      g.ellipse(6.6, 3, 1.5, 1.4, main);
      g.set(6, 1, main).set(7, 1, main).set(5, 0, main);
      g.set(1, 5, shade).set(0, 5, shade);
    } else if (pose === 'eat') {
      g.ellipse(3.4, 5.2, 3, 2, main);
      g.ellipse(6.6, 5.5, 1.5, 1.4, main);
      g.set(5, 3, main).set(4, 2, main);
    } else {
      // oturma / zıplama başı: kambur gövde, dik kulaklar
      const lift = pose === 'hop0' ? 1 : 0;
      g.ellipse(3.4, 5.2 - lift, 3, 2, main);
      g.ellipse(6.4, 3.4 - lift, 1.6, 1.5, main);
      g.set(6, 1 - lift, main).set(6, 0, main).set(7, 1 - lift, main);
    }
  }, (g) => {
    // ayrıntılar: kuyruk, göz, kulak içi, karın, gölge
    const head = pose === 'eat' ? { x: 7, y: 5 } : pose === 'hop1' ? { x: 7, y: 3 } : { x: 7, y: pose === 'hop0' ? 2 : 3 };
    g.set(head.x, head.y, 'K');
    g.set(0, pose === 'hop1' ? 3 : 4, 'u');
    if (pose === 'sit' || pose === 'hop0') g.set(6, pose === 'hop0' ? 0 : 1, ear);
    for (let x = 2; x <= 5; x++) if (g.get(x, 6) === main) g.set(x, 6, belly);
    if (pose !== 'hop1') g.set(2, 6, shade).set(5, 6, shade);
    shadow(g, 1, 7);
  }).toRows();
}

/** pose: sit | hop0 | hop1 | eat */
export function getRabbitSprite(pose = 'sit', facing = 'right', variant = 0, winter = false) {
  const fur = winter ? RABBIT_WINTER : RABBIT_FUR[variant % RABBIT_FUR.length];
  return getSprite(`animal:rabbit:${pose}:${facing}:${winter ? 'w' : variant % RABBIT_FUR.length}`, () => {
    const rows = rabbitRows(pose, fur);
    return facing === 'left' ? flipRowsHorizontal(rows) : rows;
  });
}

// ---------------------------------------------------------------------------
// Geyik
// ---------------------------------------------------------------------------
function deerRows(pose, stag) {
  return sprite(16, 16, (g) => {
    if (pose === 'lie') {
      g.ellipse(7, 12.5, 5.5, 2.2, 'X');
      g.rect(11, 7, 2, 5, 'X');
      g.ellipse(12.8, 6.5, 1.9, 1.4, 'X');
      g.set(14, 6, 'X');
      return;
    }
    const grazing = pose === 'graze';
    g.ellipse(7, 8.6, 5, 2.4, 'X');
    // boyun ve baş
    if (grazing) {
      g.rect(11, 9, 2, 3, 'X');
      g.ellipse(13, 12, 1.8, 1.3, 'X');
    } else {
      g.rect(11, 4, 2, 5, 'X');
      g.ellipse(12.8, 3.6, 1.9, 1.4, 'X');
      g.set(14, 3, 'X');
    }
    // bacaklar: yürürken çaprazlar açılıp kapanır
    const legs = pose === 'walk1' ? [3, 5, 9, 11] : pose === 'walk0' ? [2, 4, 10, 12] : [3, 4, 10, 11];
    for (const x of legs) g.vline(x, 10, 14, 'w');
  }, (g) => {
    if (pose === 'lie') {
      g.set(13, 6, 'K');
      for (const [x, y] of [[4, 11], [7, 11], [9, 12]]) g.set(x, y, 'u');
      g.set(1, 12, 'u');
      if (stag) g.set(11, 4, 'x').set(11, 3, 'x').set(10, 3, 'x').set(13, 4, 'x').set(13, 3, 'x').set(14, 2, 'x');
      shadow(g, 2, 13);
      return;
    }
    const grazing = pose === 'graze';
    // karın açık, sırtta beyaz benekler, beyaz kuyruk
    for (let x = 4; x <= 10; x++) if (g.get(x, 10) === 'X') g.set(x, 10, 'E');
    for (const [x, y] of [[5, 7], [8, 7], [7, 8], [10, 8]]) g.set(x, y, 'u');
    g.set(2, 7, 'u').set(1, 7, 'u');
    // göz ve burun; kulak
    if (grazing) {
      g.set(13, 11, 'K').set(14, 12, 'K');
      g.set(11, 9, 'E');
    } else {
      g.set(13, 3, 'K').set(14, 4, 'K');
      g.set(11, 2, 'X').set(11, 1, 'K');
      if (stag) {
        // dallanan boynuzlar
        g.set(12, 1, 'x').set(12, 0, 'x').set(11, 0, 'x').set(13, 0, 'x').set(14, 1, 'x').set(13, 2, 'x');
      }
    }
    // toynaklar
    for (let x = 0; x < 16; x++) if (g.get(x, 14) === 'w') g.set(x, 14, 'K');
    shadow(g, 2, 13);
  }).toRows();
}

/** pose: stand | walk0 | walk1 | graze | lie */
export function getDeerSprite(pose = 'stand', facing = 'right', stag = false) {
  return getSprite(`animal:deer:${pose}:${facing}:${stag ? 's' : 'd'}`, () => {
    const rows = deerRows(pose, stag);
    return facing === 'left' ? flipRowsHorizontal(rows) : rows;
  });
}

// ---------------------------------------------------------------------------
// Kedi
// ---------------------------------------------------------------------------
const CAT_COATS = [
  { main: 'r', shade: 'R', stripe: 'R', belly: 'q', name: 'tekir' },
  { main: 'O', shade: '3', stripe: '3', belly: 'S', name: 'sarman' },
  { main: 'Q', shade: 'K', stripe: 'Q', belly: 'u', name: 'kara-beyaz' },
];

function catRows(pose, coat) {
  const { main, shade, stripe, belly } = coat;
  return sprite(10, 8, (g) => {
    if (pose === 'sleep') {
      // kıvrılmış: yuvarlak gövde, kuyruk etrafında, baş patilerde
      g.ellipse(4.5, 5.4, 3.6, 2, main);
      g.ellipse(7.4, 5.6, 1.4, 1.2, main);
      g.set(7, 3, main);
      return;
    }
    if (pose === 'sit') {
      g.ellipse(4, 5, 2.2, 2.4, main);
      g.ellipse(5.6, 2.6, 1.6, 1.4, main);
      g.set(4, 1, main).set(6, 1, main);
      g.set(1, 6, main).set(0, 5, main).set(0, 4, main); // kuyruk
      return;
    }
    g.ellipse(4.2, 4.4, 3.2, 1.4, main);
    g.ellipse(7.8, 3, 1.5, 1.3, main);
    g.set(7, 1, main).set(9, 1, main);
    g.set(1, 3, main).set(0, 2, main).set(0, 1, main); // dik kuyruk
    const legs = pose === 'walk1' ? [2, 5] : [3, 6];
    for (const x of legs) {
      g.set(x, 5, main).set(x, 6, main);
    }
    g.set(legs[0] + 1, 6, main);
  }, (g) => {
    if (pose === 'sleep') {
      g.set(7, 5, 'K'); // kapalı göz
      g.set(3, 4, stripe).set(5, 4, stripe);
      for (let x = 2; x <= 6; x++) if (g.get(x, 6) === main) g.set(x, 6, shade);
      g.set(1, 6, belly);
    } else if (pose === 'sit') {
      g.set(6, 2, 'P').set(5, 3, 'p');
      g.set(3, 4, stripe).set(4, 5, belly).set(4, 6, belly);
    } else {
      g.set(8, 2, 'P').set(9, 3, 'p');
      g.set(3, 3, stripe).set(5, 3, stripe);
      g.set(4, 5, belly);
    }
    shadow(g, 1, 8);
  }).toRows();
}

/** pose: sit | walk0 | walk1 | sleep */
export function getCatSprite(pose = 'sit', facing = 'right', variant = 0) {
  const coat = CAT_COATS[variant % CAT_COATS.length];
  return getSprite(`animal:cat:${pose}:${facing}:${variant % CAT_COATS.length}`, () => {
    const rows = catRows(pose, coat);
    return facing === 'left' ? flipRowsHorizontal(rows) : rows;
  });
}

// ---------------------------------------------------------------------------
// Köpek
// ---------------------------------------------------------------------------
const DOG_COATS = [
  { main: 'X', shade: 'w', ear: 'x', belly: 'E', patch: 'X', name: 'kahverengi' },
  { main: 'u', shade: 'q', ear: 'w', belly: 'u', patch: 'w', name: 'alacalı' },
];

function dogRows(pose, coat) {
  const { main, shade, ear, belly, patch } = coat;
  return sprite(12, 10, (g) => {
    if (pose === 'sleep') {
      g.ellipse(5.5, 7.2, 4.4, 2, main);
      g.ellipse(9.2, 7.4, 1.8, 1.4, main);
      g.set(1, 6, main);
      return;
    }
    if (pose === 'sit') {
      g.ellipse(5, 6.4, 2.6, 2.6, main);
      g.ellipse(7.4, 3.2, 1.9, 1.7, main);
      g.set(9, 3, main).set(9, 4, main); // burun
      g.set(2, 8, main).set(1, 7, main); // kuyruk
      return;
    }
    g.ellipse(5.2, 5.4, 3.8, 1.8, main);
    g.ellipse(9.2, 3.6, 1.8, 1.6, main);
    g.set(11, 4, main);
    g.set(1, 4, main).set(0, 3, main).set(0, 2, main); // sallanan kuyruk
    const legs = pose === 'walk1' ? [2, 4, 6, 8] : [3, 4, 7, 8];
    for (const x of legs) g.vline(x, 7, 8, main);
  }, (g) => {
    if (pose === 'sleep') {
      g.set(9, 7, 'K');
      g.set(8, 6, ear).set(9, 6, ear);
      for (let x = 3; x <= 7; x++) if (g.get(x, 8) === main) g.set(x, 8, shade);
      g.set(4, 6, patch === main ? shade : patch);
    } else if (pose === 'sit') {
      g.set(8, 3, 'K').set(10, 4, 'K');
      g.set(6, 2, ear).set(6, 3, ear).set(6, 4, ear);
      g.set(5, 6, belly).set(5, 7, belly);
      g.set(4, 5, patch === main ? shade : patch);
      g.set(8, 5, 'o'); // dil
    } else {
      g.set(10, 3, 'K').set(12 - 1, 4, 'K');
      g.set(8, 2, ear).set(8, 3, ear).set(8, 4, ear);
      g.set(4, 4, patch === main ? shade : patch).set(5, 4, patch === main ? shade : patch);
      for (let x = 3; x <= 7; x++) if (g.get(x, 6) === main) g.set(x, 6, belly);
      for (let x = 0; x < 12; x++) if (g.get(x, 8) === main) g.set(x, 8, shade);
    }
    shadow(g, 1, 10);
  }).toRows();
}

/** pose: sit | walk0 | walk1 | sleep */
export function getDogSprite(pose = 'sit', facing = 'right', variant = 0) {
  const coat = DOG_COATS[variant % DOG_COATS.length];
  return getSprite(`animal:dog:${pose}:${facing}:${variant % DOG_COATS.length}`, () => {
    const rows = dogRows(pose, coat);
    return facing === 'left' ? flipRowsHorizontal(rows) : rows;
  });
}

/** Türüne göre hayvan görseli. */
export function getAnimalSprite(kind, pose, facing, variant = 0, winter = false) {
  switch (kind) {
    case 'rabbit':
      return getRabbitSprite(pose, facing, variant, winter);
    case 'deer':
      return getDeerSprite(pose, facing, variant === 1);
    case 'cat':
      return getCatSprite(pose, facing, variant);
    case 'dog':
      return getDogSprite(pose, facing, variant);
    default:
      throw new Error(`Hayvan görseli yok: ${kind}`);
  }
}
