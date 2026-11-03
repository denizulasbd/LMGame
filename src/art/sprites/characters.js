// Kasaba sakinlerinin sprite'ları (12x18). Tek bir gövde şablonu, saç stili katmanı ve
// kişiye özel renk paletiyle her karakter benzersiz görünür.
//
// Şablon rakamları (karakterin görünüm renkleriyle boyanır):
//   1 saç   2 saç gölgesi   3 üst giysi   4 üst giysi gölgesi
//   5 pantolon   0 pantolon gölgesi   6 ten   7 ten gölgesi   8 ayakkabı
//
// Görünümler: front (aşağı bakan), back (yukarı), side (sağa; sola bakış aynalanır)
// Kareler: idle0/idle1 (nefes), walk0/walk1 (yürüme), sit0/sit1 (oturma, yalnızca önden)
//
// Görünüş (look, 9. aşama): { child, coat, bag }
//   child: çocuk (12x14): aynı baş, kısa gövde — gövdenin iki satırı çıkarılır
//   coat : kürk yakalı kışlık palto (gömlek palto rengine boyanır, etek kemeri örter)
//   bag  : sırt çantası (önden askılar, arkadan çanta, yandan sırtta çıkıntı)
import { PALETTE, CHARACTER_COLORS } from '../palette.js';
import { getSprite, composeRows, flipRowsHorizontal, squashRows, emptyRows } from '../PixelSprite.js';

export const CHARACTER_WIDTH = 12;
export const CHARACTER_HEIGHT = 18;
export const CHILD_HEIGHT = 14;
export const NO_LOOK = Object.freeze({ child: false, coat: false, bag: false });

/** Görünüşe göre sprite yüksekliği. */
export function characterHeight(look = NO_LOOK) {
  return look.child ? CHILD_HEIGHT : CHARACTER_HEIGHT;
}

const HEAD_TOP = 2;
const HEAD_BOTTOM = 9;
const FRONT_EYES = [
  [3, 6],
  [8, 6],
];

// ---------------------------------------------------------------------------
// Gövde şablonları (saçsız). Satır 15-17 bacaklar, karelere göre değişir.
// ---------------------------------------------------------------------------
const FRONT_UPPER = [
  '............',
  '............',
  '...KKKKKK...',
  '..K666666K..',
  '.K66666666K.',
  '.K66666666K.',
  '.K6K6666K6K.',
  '.K66666666K.',
  '.K7p6666p7K.',
  '..KK7777KK..',
  '..K333333K..',
  '.K43333334K.',
  '.K43333334K.',
  '.K64444446K.',
  '..K555555K..',
];

const FRONT_LEGS = {
  idle: ['..K55KK55K..', '..K50KK05K..', '..K88KK88K..'],
  walk0: ['..K55KK55K..', '..K88KK05K..', '...KK.K88K..'],
  walk1: ['..K55KK55K..', '..K50KK88K..', '..K88K.KK...'],
};

const SIDE_UPPER = [
  '............',
  '............',
  '...KKKKKK...',
  '..K666666K..',
  '.K66666666K.',
  '.K66666666K.',
  '.K666666K6K.',
  '.K66666666K.',
  '.K7666666pK.',
  '..KK77777K..',
  '...K3333K...',
  '...K3443K...',
  '...K3443K...',
  '...K4664K...',
  '...K5555K...',
];

const SIDE_LEGS = {
  idle: ['...K5555K...', '...K5005K...', '...K88888K..'],
  walk0: ['..K555555K..', '.K50K..K05K.', '.K88K..K888K'],
  walk1: ['...K5555K...', '...K50K5K...', '...KK8888K..'],
};

// ---------------------------------------------------------------------------
// Saç stilleri: gövdenin üstüne damgalanır ('.' gövdeyi korur)
// ---------------------------------------------------------------------------
const SHORT_FRONT = [
  '............',
  '............',
  '...KKKKKK...',
  '..K111111K..',
  '.K11121111K.',
  '.K11666611K.',
  '..1......1..',
];

const SHORT_SIDE = [
  '............',
  '............',
  '...KKKKKK...',
  '..K111111K..',
  '.K11111211K.',
  '.K11111666K.',
  '..111.......',
  '..11........',
  '..1.........',
];

const HAIR_STYLES = {
  short: {
    front: SHORT_FRONT,
    side: SHORT_SIDE,
  },
  long: {
    front: [
      ...SHORT_FRONT.slice(0, 6),
      '..1......1..',
      '..1......1..',
      '.K1......1K.',
      '.K12....21K.',
      '.K1......1K.',
      '.K2......2K.',
    ],
    side: [
      ...SHORT_SIDE.slice(0, 6),
      '..111.......',
      '..111.......',
      '..111.......',
      '..K112......',
      '..K11K......',
      '...KK.......',
    ],
  },
  bun: {
    front: composeRows(SHORT_FRONT, [[['....KKKK....', '...K1121K...', '...KK11KK...'], 0, 0]]),
    side: composeRows(SHORT_SIDE, [[['.KK.', 'K11K', 'K21K', '.KK.'], 0, 1]]),
  },
  spiky: {
    front: [
      '..K.K..K.K..',
      '.K1K1KK1K1K.',
      '.K11111111K.',
      '.K11111111K.',
      '.K11211211K.',
      '.K16666661K.',
    ],
    side: [
      '...K.K.K....',
      '..K1K1K1K...',
      '.K1111111K..',
      '.K11111111K.',
      '.K11111211K.',
      '.K11111666K.',
      '..111.......',
      '..1.........',
    ],
  },
  // Hasır şapka (altından saç görünür)
  hat: {
    front: [
      '...KKKKKK...',
      '..KPPPPPPK..',
      '..KPPPPPPK..',
      '..KooooooK..',
      'KKPPPPPPPPKK',
      'KPYPPPPPPYPK',
      '..1......1..',
    ],
    side: [
      '...KKKKK....',
      '..KPPPPPK...',
      '..KPPPPPK...',
      '..KoooooK...',
      '.KPPPPPPPPPK',
      '.KKKKKKKKKKK',
      '..111.......',
      '..11........',
    ],
  },
};

// ---------------------------------------------------------------------------
// Kare üretimi
// ---------------------------------------------------------------------------
function assemble(view, legs, hairStyle) {
  const upper = view === 'side' ? SIDE_UPPER : FRONT_UPPER;
  const legRows = (view === 'side' ? SIDE_LEGS : FRONT_LEGS)[legs];
  const hair = HAIR_STYLES[hairStyle] ?? HAIR_STYLES.short;
  return composeRows([...upper, ...legRows], [[view === 'side' ? hair.side : hair.front, 0, 0]]);
}

/** Önden görünümü arkadan görünüme çevirir: yüz saçla örtülür. offset: başın kaç satır yukarıda olduğu. */
function hideFace(rows, offset = 0) {
  const out = rows.map((row) => [...row]);
  for (let y = HEAD_TOP - offset; y <= HEAD_BOTTOM - offset; y++) {
    out[y] = out[y].map((c) => ({ 6: '1', 7: '2', p: '1' })[c] ?? c);
  }
  for (const [x, y] of FRONT_EYES) if (out[y - offset][x] === 'K') out[y - offset][x] = '1';
  return out.map((row) => row.join(''));
}

// --- Kışlık palto: gövde satırları (10-14) lacivert yün palto rengine boyanır, yakada beyaz kürk, önde düğme ---
const COAT_COLORS = { 3: 'B', 4: 'n', 5: 'n', 0: 'n' };
const COAT_FIRST_ROW = 10;
const COAT_LAST_ROW = 14;
// Kürk yaka: görünüme göre yakanın sütunları (yan görünümde yüzün olduğu taraf)
const COAT_COLLAR = { front: [4, 5, 6, 7], back: [3, 4, 5, 6, 7, 8], side: [6, 7] };
const COAT_BUTTONS = [[6, 11], [6, 12]];

// --- Sırt çantası ---
const BAG_STRAPS = [[3, 10], [8, 10], [3, 11], [8, 11]]; // önden omuz askıları
const BAG_BACK = ['KKKKKK', 'KXEEXK', 'KXwwXK', 'KXXXXK', 'KKKKKK']; // arkadan (x 3, y 10)
const BAG_SIDE = ['.KK', 'KXK', 'KEK', 'KwK', '.KK']; // yandan, sırtta (x 1, y 10)

/** Paltoyu ve çantayı yetişkin karesine (18 satır, oturmadan / büzülmeden önce) giydirir. */
function dress(rows, view, look) {
  if (!look.coat && !look.bag) return rows;
  const out = rows.map((row) => [...row]);
  const kind = view === 'side' ? 'side' : view;
  if (look.coat) {
    for (let y = COAT_FIRST_ROW; y <= COAT_LAST_ROW; y++) {
      out[y] = out[y].map((c) => COAT_COLORS[c] ?? c);
    }
    for (const x of COAT_COLLAR[kind]) if (out[COAT_FIRST_ROW][x] !== 'K') out[COAT_FIRST_ROW][x] = 'u';
    if (kind === 'front') for (const [x, y] of COAT_BUTTONS) out[y][x] = 'P';
  }
  if (look.bag) {
    if (kind === 'front') for (const [x, y] of BAG_STRAPS) out[y][x] = 'x';
    const [pattern, px, py] = kind === 'back' ? [BAG_BACK, 3, 10] : kind === 'side' ? [BAG_SIDE, 1, 10] : [null];
    if (pattern) {
      pattern.forEach((line, dy) => [...line].forEach((c, dx) => {
        if (c !== '.') out[py + dy][px + dx] = c;
      }));
    }
  }
  return out.map((row) => row.join(''));
}

// --- Çocuk: yetişkin karesinden üst iki boş satır ve gövdenin iki satırı çıkarılır ---
const CHILD_REMOVED_ROWS = [0, 1, 11, 12];
const CHILD_HEAD_OFFSET = 2; // baş iki satır yukarı kayar
const CHILD_HIP_ROW = 10; // nefes alırken çöken satır (yetişkinde 14)
const CHILD_SEAT_ROWS = 11; // otururken korunan üst satırlar (baş, omuz, eller, kalça)
const CHILD_SIT_SQUASH = 10; // oturma karesinde omuz satırı

function buildFrame(view, frame, hairStyle, look) {
  const baseView = view === 'back' ? 'front' : view;
  const sitting = frame === 'sit0' || frame === 'sit1';
  const legs = frame === 'walk0' || frame === 'walk1' ? frame : 'idle';
  let rows = dress(assemble(sitting ? 'front' : baseView, legs, hairStyle), sitting ? 'front' : view, look);
  if (look.child) rows = rows.filter((_, i) => !CHILD_REMOVED_ROWS.includes(i));
  const height = rows.length;
  const offset = look.child ? CHILD_HEAD_OFFSET : 0;

  if (sitting) {
    // Oturma: bacaklar kısalır, ayakkabılar öne gelir
    const keep = look.child ? CHILD_SEAT_ROWS : 15;
    const seated = [...emptyRows(height - keep - 1, CHARACTER_WIDTH), ...rows.slice(0, keep), '..K88KK88K..'];
    rows = frame === 'sit1' ? squashRows(seated, [look.child ? CHILD_SIT_SQUASH : 12]) : seated;
    return view === 'back' ? hideFace(rows, offset - (height - keep - 1)) : rows;
  }
  if (frame === 'idle1') rows = squashRows(rows, [look.child ? CHILD_HIP_ROW : 14]); // nefes: gövde 1 piksel çöker
  return view === 'back' ? hideFace(rows, offset) : rows;
}

/** Görünüşün önbellek anahtarı: '' (yetişkin), 'c' (çocuk), 'C' (palto), 'B' (çanta) birleşimleri. */
export function lookKey(look = NO_LOOK) {
  return `${look.child ? 'c' : ''}${look.coat ? 'C' : ''}${look.bag ? 'B' : ''}`;
}

const paletteCache = new Map();

function appearanceKey(a) {
  return `${a.hair}-${a.hairColor}-${a.skin}-${a.shirt}-${a.pants}`;
}

function appearancePalette(a) {
  const key = appearanceKey(a);
  if (!paletteCache.has(key)) {
    const hair = CHARACTER_COLORS.hair[a.hairColor] ?? CHARACTER_COLORS.hair.brown;
    const skin = CHARACTER_COLORS.skin[a.skin] ?? CHARACTER_COLORS.skin.light;
    const shirt = CHARACTER_COLORS.cloth[a.shirt] ?? CHARACTER_COLORS.cloth.red;
    const pants = CHARACTER_COLORS.cloth[a.pants] ?? CHARACTER_COLORS.cloth.navy;
    paletteCache.set(key, {
      ...PALETTE,
      1: hair[0],
      2: hair[1],
      3: shirt[0],
      4: shirt[1],
      5: pants[0],
      0: pants[1],
      6: skin[0],
      7: skin[1],
      8: CHARACTER_COLORS.shoes,
    });
  }
  return paletteCache.get(key);
}

/**
 * @param {object} appearance { hair, hairColor, skin, shirt, pants }
 * @param {'down'|'up'|'left'|'right'} facing
 * @param {'idle0'|'idle1'|'walk0'|'walk1'|'sit0'|'sit1'} frame
 * @param {{ child?: boolean, coat?: boolean, bag?: boolean }} look çocuk / palto / sırt çantası
 */
export function getCharacterSprite(appearance, facing, frame, look = NO_LOOK) {
  const view = facing === 'up' ? 'back' : facing === 'down' ? 'front' : 'side';
  const flip = facing === 'left';
  const key = `char:${appearanceKey(appearance)}:${lookKey(look)}:${view}:${frame}:${flip ? 'L' : 'R'}`;
  return getSprite(
    key,
    () => {
      const rows = buildFrame(view, frame, appearance.hair, look);
      return flip ? flipRowsHorizontal(rows) : rows;
    },
    appearancePalette(appearance)
  );
}

const portraitCache = new Map();

/** Arayüzdeki <img> öğeleri için karakterin önden duruş görselinin data URL'si. */
export function getCharacterPortraitURL(appearance, look = NO_LOOK) {
  const key = `${appearanceKey(appearance)}:${lookKey(look)}`;
  if (!portraitCache.has(key)) {
    portraitCache.set(key, getCharacterSprite(appearance, 'down', 'idle0', look).toDataURL());
  }
  return portraitCache.get(key);
}
