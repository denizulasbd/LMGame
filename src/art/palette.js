// Oyunun tek renk paleti. Tüm pixel art bu harflerle çizilir; böylece görsel bütünlük
// korunur ve bir tonu değiştirmek tüm oyuna yansır. Sıcak, yumuşak, retro tonlar.
// Harf seçimi: büyük harf genelde aynı ailenin koyu/ayrık tonu.
export const PALETTE = {
  '.': null,                       // şeffaf

  // Kontur ve gölge
  K: '#1b1423',                    // en koyu kontur (morumsu siyah)
  k: 'rgba(27, 20, 35, 0.28)',     // yere düşen yumuşak gölge

  // Çimen
  G: '#2f6b3a',                    // çimen gölgesi
  g: '#4a9a46',                    // çimen
  h: '#6cc04a',                    // çimen ışığı
  H: '#a4dd5c',                    // çimen parlak uç

  // Yaprak (meşe)
  F: '#1e4d2e',                    // yaprak en koyu / kontur
  f: '#2e7a3c',                    // yaprak gölge
  v: '#45a34a',                    // yaprak
  V: '#7fcf5a',                    // yaprak ışığı

  // İğne yaprak (çam)
  J: '#2a6b55',
  L: '#4a9a72',

  // Su
  N: '#1f3f7a',                    // derin su
  b: '#2f6fb5',                    // su
  c: '#4aa3df',                    // dalga
  a: '#9be3f2',                    // köpük / parıltı
  W: '#eefbff',                    // beyaz köpük

  // Kum
  z: '#c9a86a',                    // kum gölgesi
  s: '#e9cf8f',                    // kum
  S: '#f6e6b4',                    // kum ışığı

  // Toprak yol
  D: '#7d5233',                    // toprak koyu
  d: '#a8754a',                    // toprak
  e: '#c99563',                    // toprak açık

  // Taş / kaya
  Q: '#3d3f4d',                    // kaya kontur
  R: '#5d6070',                    // kaya gölge
  r: '#8b8f9c',                    // kaya
  q: '#b9bcc6',                    // kaya ışığı
  M: '#6b5d50',                    // taş arası harç

  // Çatı kiremidi
  U: '#7d3330',                    // kiremit gölge
  C: '#b4523f',                    // kiremit
  Z: '#d9775a',                    // kiremit ışık

  // Böğürtlen
  m: '#3e1f48',                    // böğürtlen koyu
  l: '#8e3a7a',                    // böğürtlen parlak

  // Ahşap
  x: '#4f2d1a',                    // ahşap koyu
  w: '#7a4a2a',                    // ahşap / gövde
  X: '#a8703f',                    // ahşap açık
  E: '#c98f55',                    // ahşap parlak

  // Çiçekler ve vurgu renkleri
  p: '#f06b8a',                    // pembe
  P: '#ffd23f',                    // sarı
  u: '#ffffff',                    // beyaz
  o: '#e8463c',                    // kırmızı
  O: '#ff9a3c',                    // turuncu
  i: '#8a6cf0',                    // menekşe
  y: '#fff3b0',                    // açık krem (imleç)
  Y: '#ffb84d',                    // kehribar

  // Mikro-biyom zeminleri (8. aşama)
  // Bereketli toprak: koyu, nemli, yoncalı çimen
  '!': '#285e33',                  // derin gölge
  '=': '#3b8540',                  // bereketli çimen
  '~': '#5cad4c',                  // yonca yaprağı
  // Kayalık tepe: boz, taşlı toprak
  ')': '#77705a',                  // boz gölge
  '(': '#968d6e',                  // boz toprak
  ':': '#b6ab88',                  // boz ışık
  // Orman zemini: gölgeli yosun ve yaprak döküntüsü
  '[': '#24492c',                  // koyu yosun
  ']': '#33633a',                  // yosun
  '^': '#6b5434',                  // çürümüş yaprak / iğne

  // Mevsim tonları: sonbahar çimeni (gölge -> uç)
  '%': '#7c7a34',
  '&': '#a3a146',
  '*': '#c9b65a',
  '+': '#e2cc72',
  // Sonbahar yaprakları: koyu kızıl, kızıl, turuncu, kehribar, altın
  1: '#5a2418',
  2: '#9c3424',
  3: '#d4652a',
  4: '#f0a830',
  9: '#f6d860',
  // Kar ve kırağı: mavi gölge -> beyaz
  5: '#a9bcd2',
  6: '#d8e4f0',
  7: '#eef4fa',
  8: '#ffffff',

  // Karakterler
  T: '#f5c7a0',                    // ten
  t: '#d99a76',                    // ten gölgesi
  j: '#6b3e26',                    // saç (kahverengi)
  B: '#3d5aa8',                    // kumaş mavi
  n: '#29366f',                    // kumaş lacivert
};

// Kasaba sakinlerinin görünüm renkleri: [ana ton, gölge tonu].
// Karakter şablonlarındaki rakamlar bu tonlarla boyanır (bkz. art/sprites/characters.js).
export const CHARACTER_COLORS = {
  hair: {
    black: ['#2f2838', '#1b1423'],
    brown: ['#6b3e26', '#4a2a18'],
    auburn: ['#a0482a', '#6e2c1a'],
    blonde: ['#f0c862', '#c99a3a'],
    ginger: ['#e07a32', '#a85424'],
    gray: ['#c8c6cc', '#8e8a96'],
  },
  skin: {
    light: ['#f5c7a0', '#d99a76'],
    medium: ['#e0a878', '#b97c56'],
    tan: ['#c4895e', '#93603e'],
    deep: ['#8d5a3b', '#64402a'],
  },
  cloth: {
    rose: ['#f06b8a', '#b84466'],
    forest: ['#3f8f4a', '#2a6136'],
    sky: ['#5aa8e6', '#3a74b0'],
    mustard: ['#e6b53c', '#b0832a'],
    lavender: ['#a58be8', '#7560b8'],
    red: ['#d9463c', '#9e2e2a'],
    teal: ['#2f9a8f', '#1f6b63'],
    mint: ['#8fdcb0', '#5aa880'],
    navy: ['#33417a', '#222b54'],
    brown: ['#7a5236', '#553820'],
    denim: ['#4a6aa8', '#33497a'],
    plum: ['#7a3a6b', '#56264b'],
  },
  shoes: '#3a2a20',
};
