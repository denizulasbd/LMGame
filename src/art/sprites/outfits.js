// (15. aşama) Meslek kıyafetleri: sakinin en çok geliştirdiği meslekteki kademesi üzerinde görünür.
//   Çırak (1) : sade köylü giysisi (katman yok)
//   Kalfa (2) : mesleğe uygun küçük bir aksesuar (deri yelek ve eldiven, hasır şapka, bandana ve fener, ot çantası,
//               beyaz önlük...)
//   Usta (3)  : tam meslek kostümü (ekose gömlek ve bere, fenerli kask ve zırh, bilge cübbesi ve çelengi, kabarık
//               aşçı şapkası...)
// Hangi mesleğin hangi kiti giydiği src/data/skills.js -> OUTFIT_KITS'te. Katmanlar karakter şablonuna (12x18,
// bkz. characters.js) damgalanır: 'head' başın üstüne ('.' saçı korur; önden, arkadan ve yandan aynı), 'torso'
// gövdenin her pikseli için çağrılır (rakamlar kişinin giysi renkleridir: 3 gömlek, 4 gömlek gölgesi, 5 pantolon,
// 6 el). Kıyafet harfleri ortak paletten gelir, kişinin renkleriyle boyanmaz. Kışlık palto gövdeyi örter
// (başlık görünmeye devam eder); çocuklar kıyafet giymez.

// Gövde satırları: 10 yaka / omuz, 11-12 gövde, 13 eller ve bel, 14 kemer, 15-16 bacak
const COLLAR = 10;
const BELT = 14;

const torsoRow = (y) => y >= COLLAR && y <= 13;
const isShirt = (c) => c === '3' || c === '4';

// --- Başlıklar (12 sütun, 0. satırdan başlar) ---
const HEAD = {
  beret: ['............', '....KKKK....', '...KooooKK..', '..KooooooUK.', '..KUUUUUUK..'],
  straw: ['...KKKKKK...', '..KPPPPPPK..', '..KPPPPPPK..', '..KooooooK..', 'KKPPPPPPPPKK', 'KPYPPPPPPYPK'],
  strawFlower: ['...KKKKKK...', '..KPPPPPPK..', '..KPPPPPPK..', '..KooooopK..', 'KKPPPPPPPPKK', 'KPYPPPPPPYPK'],
  bandana: ['............', '............', '............', '............', '.KooooooooKo', '..........o.'],
  minerHelmet: ['....KKKK....', '...KPyyPK...', '..KPPPPPPK..', '.KPPPPPPPPK.', 'KYYYYYYYYYYK'],
  hardHat: ['............', '...KKKKKK...', '..KOOOOOOK..', '.KOOOOOOOOK.', 'KooooooooooK'],
  wreath: ['............', '............', '............', '..KvVvVvVK..'],
  chefHat: ['.KKKKKKKKKK.', 'KuuuquuuuquK', 'KuquuuuquuuK', '.KKqqqqqqKK.'],
  feltHat: ['............', '...KKKKKK...', '..KwwwwwwK..', '..KxxxxxxK..', 'KKwwwwwwwwKK'],
  bucketHat: ['............', '...KKKKKK...', '..KXXXXXXK..', '.KXXXXXXXXK.', '.KwwwwwwwwK.'],
  sowester: ['............', '...KKKKKK...', '..KPPPPPPK..', '.KPPPPPPPPK.', 'KYYYYYYYYYYK'],
  goggles: ['............', '............', '............', '............', '..KaaKKaaK..'],
  mortarboard: ['.KKKKKKKKKK.', 'KnnnnnnnnnnK', '.KKKnnnnKKP.', '...KnnnnK.P.'],
};

// --- Gövde katmanları: (c, x, y, view) -> yeni karakter ---
// view: 'front' | 'back' | 'side' (yan görünümde yüz sağdadır; sola bakış sonradan aynalanır)
const gloves = (c, y) => (y === 13 && c === '6' ? 'x' : c);

const TORSO = {
  // Oduncu Kalfa: deri yelek ve eldiven
  leatherVest(c, x, y, view) {
    c = gloves(c, y);
    if (!torsoRow(y) || !isShirt(c)) return c;
    if (view === 'back') return c === '4' ? 'x' : 'w';
    const edge = view === 'side' ? x === 4 || x === 7 : x === 3 || x === 4 || x === 7 || x === 8;
    return edge ? (c === '4' ? 'x' : 'w') : c;
  },
  // Usta Oduncu: kırmızı ekose gömlek, eldiven
  plaid(c, x, y) {
    c = gloves(c, y);
    if (!torsoRow(y) || !isShirt(c)) return c;
    if (c === '4') return 'U';
    return (x + y) % 2 === 0 ? 'o' : 'U';
  },
  // Usta Çiftçi: kot tulum (göğüslük ve askılar)
  overalls(c, x, y, view) {
    if (y === BELT && c === '5') return 'B';
    if (y === COLLAR && isShirt(c) && (view === 'side' ? x === 5 : x === 4 || x === 7)) return 'n';
    if (y > COLLAR && torsoRow(y) && isShirt(c) && (view === 'side' ? x === 5 || x === 6 : x >= 4 && x <= 7)) return c === '4' ? 'n' : 'B';
    return c;
  },
  // Madenci Kalfa: belde küçük fener
  beltLamp(c, x, y, view) {
    if (y === BELT && view !== 'back' && x === (view === 'side' ? 6 : 8)) return 'P';
    return c;
  },
  // Usta Madenci: kalın koruyucu zırh (omuz plakaları, parlak göğüs), eldiven
  armor(c, x, y, view) {
    c = gloves(c, y);
    if (!torsoRow(y) || !isShirt(c)) return c;
    if (y === COLLAR && (view === 'side' ? x === 4 : x === 3 || x === 8)) return 'q';
    if (y === 12 && view === 'front' && (x === 5 || x === 6)) return 'q';
    return c === '4' ? 'R' : 'r';
  },
  // Şifacı Kalfa: omuzdan çapraz askılı ot çantası
  herbBag(c, x, y, view) {
    if (view === 'front') {
      if ([[4, 10], [5, 11], [6, 12]].some(([px, py]) => px === x && py === y)) return 'x';
      if (y === 13 && (x === 7 || x === 8)) return 'v';
      if (y === 12 && x === 8) return 'V';
    }
    if (view === 'side' && y === 12 && (x === 4 || x === 5)) return x === 4 ? 'v' : 'f';
    if (view === 'back' && [[7, 10], [6, 11], [5, 12]].some(([px, py]) => px === x && py === y)) return 'x';
    return c;
  },
  // Usta Şifacı: yere kadar bilge cübbesi, yakada altın toka
  robe(c, x, y, view) {
    if (y === COLLAR && view === 'front' && (x === 5 || x === 6) && isShirt(c)) return 'P';
    if (y >= COLLAR && y <= 16 && (isShirt(c) || c === '5' || c === '0')) return c === '4' || c === '0' ? 'F' : 'f';
    return c;
  },
  // Fırıncı / Aşçı Kalfa: beyaz önlük
  apron(c, x, y, view) {
    return apronOf(c, x, y, view, 'u', 'q');
  },
  // Usta Fırıncı / Aşçı: önlük ve kırmızı boyun mendili
  chefApron(c, x, y, view) {
    if (y === COLLAR && isShirt(c) && view !== 'back') return 'o';
    return apronOf(c, x, y, view, 'u', 'q');
  },
  // Çoban Kalfa: kırmızı boyun mendili
  neckerchief(c, x, y, view) {
    if (y === COLLAR && isShirt(c)) return 'o';
    if (y === 11 && view === 'front' && (x === 5 || x === 6)) return 'o';
    return c;
  },
  // Usta Çoban: beyaz yün yelek ve boyun mendili
  woolVest(c, x, y, view) {
    if (y === COLLAR && isShirt(c) && view !== 'back') return 'o';
    if (!torsoRow(y) || !isShirt(c)) return c;
    if (view === 'back') return c === '4' ? 'q' : 'u';
    const edge = view === 'side' ? x === 4 || x === 7 : x === 3 || x === 4 || x === 7 || x === 8;
    return edge ? (c === '4' ? 'q' : 'u') : c;
  },
  // Usta Balıkçı: sarı yağmurluk
  raincoat(c, x, y) {
    if (y === 13 && c === '6') return c;
    if (!torsoRow(y) || !isShirt(c)) return c;
    return c === '4' ? 'Y' : 'P';
  },
  // Yapı Ustası Kalfa / Usta: alet kemeri (pirinç toka, yanında çekiç)
  toolBelt(c, x, y, view) {
    if (y !== BELT || (c !== '5' && c !== '0')) return c;
    if (view === 'front' && (x === 5 || x === 6)) return 'P';
    if (view !== 'back' && x === (view === 'side' ? 7 : 8)) return 'q';
    return 'x';
  },
  // Zanaatkâr: deri önlük
  leatherApron(c, x, y, view) {
    return apronOf(c, x, y, view, 'w', 'x');
  },
  // Bilge Kalfa: mor atkı
  scarf(c, x, y, view) {
    if (y === COLLAR && isShirt(c)) return 'i';
    if (y === 11 && view === 'front' && x === 7) return 'i';
    return c;
  },
  // Usta Bilge: lacivert bilge cübbesi
  scholarRobe(c, x, y) {
    if (y >= COLLAR && y <= 16 && (isShirt(c) || c === '5' || c === '0')) return c === '4' || c === '0' ? 'K' : 'n';
    return c;
  },
};

function apronOf(c, x, y, view, main, shade) {
  if (view === 'back') return y === 12 && (x === 5 || x === 6) && isShirt(c) ? main : c; // arkada bağcık
  if (y === COLLAR) return view === 'front' && (x === 5 || x === 6) && isShirt(c) ? main : c;
  if (y < 11 || y > BELT) return c;
  const inside = view === 'side' ? x === 6 || x === 7 : x >= 4 && x <= 7;
  if (!inside || c === 'K' || c === '6') return c;
  return y === BELT ? shade : main;
}

/** Birden çok gövde katmanını sırayla uygular. */
const layers = (...fns) => (c, x, y, view) => fns.reduce((acc, fn) => fn(acc, x, y, view), c);

// Kitler: her kademede { head?, torso? }
export const OUTFIT_ART = {
  lumberjack: { 2: { torso: TORSO.leatherVest }, 3: { head: HEAD.beret, torso: TORSO.plaid } },
  farmer: { 2: { head: HEAD.straw }, 3: { head: HEAD.strawFlower, torso: TORSO.overalls } },
  miner: { 2: { head: HEAD.bandana, torso: TORSO.beltLamp }, 3: { head: HEAD.minerHelmet, torso: TORSO.armor } },
  healer: { 2: { torso: TORSO.herbBag }, 3: { head: HEAD.wreath, torso: TORSO.robe } },
  baker: { 2: { torso: TORSO.apron }, 3: { head: HEAD.chefHat, torso: TORSO.chefApron } },
  shepherd: { 2: { torso: TORSO.neckerchief }, 3: { head: HEAD.feltHat, torso: TORSO.woolVest } },
  fisher: { 2: { head: HEAD.bucketHat }, 3: { head: HEAD.sowester, torso: TORSO.raincoat } },
  builder: { 2: { torso: TORSO.toolBelt }, 3: { head: HEAD.hardHat, torso: TORSO.toolBelt } },
  artisan: { 2: { torso: TORSO.leatherApron }, 3: { head: HEAD.goggles, torso: layers(TORSO.leatherApron, gloves3) } },
  scholar: { 2: { torso: TORSO.scarf }, 3: { head: HEAD.mortarboard, torso: TORSO.scholarRobe } },
};

function gloves3(c, x, y) {
  return gloves(c, y);
}

/** Kıyafet anahtarı ('miner:3') -> { head, torso } ya da null. */
export function outfitArt(key) {
  if (!key) return null;
  const [kit, level] = key.split(':');
  return OUTFIT_ART[kit]?.[level] ?? null;
}

/**
 * Kıyafeti yetişkin karesine (18 satır, dizi dizisi olarak) giydirir. covered: kışlık palto gövdeyi örtüyor.
 * @param {string[][]} out kare (yerinde değiştirilir)
 */
export function applyOutfit(out, view, key, covered = false) {
  const art = outfitArt(key);
  if (!art) return;
  if (art.torso && !covered) {
    for (let y = COLLAR; y < Math.min(out.length, 17); y++) {
      for (let x = 0; x < out[y].length; x++) out[y][x] = art.torso(out[y][x], x, y, view);
    }
  }
  if (art.head) {
    art.head.forEach((line, y) => [...line].forEach((ch, x) => {
      if (ch !== '.') out[y][x] = ch;
    }));
  }
}
