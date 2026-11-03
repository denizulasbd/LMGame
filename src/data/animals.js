// Yaşayan doğa ve kasaba hayvanları (11. aşama). Mantık src/systems/AnimalSystem.js'te, görseller
// src/art/sprites/animals.js'te. Hayvanlar kayda girer (konum, yuva, ad); anlık hâlleri yüklenince yeniden kurulur.
//
// Yaban hayatı: haritanın sakin köşelerinde (kasabadan uzak orman, bereketli toprak ve çimen) yuvalarının
// çevresinde dolaşır. Sakin çok yaklaşınca ürküp kaçar; uzaklaşınca yeniden otlar.
//   count        : 80x80 haritada kaç tane (küçük haritada orantılı azalır)
//   speed        : dolaşma / kaçma hızı (dünya pikseli / oyun-hızlı saniye; sakinler 28)
//   fleeRadius   : bir sakin bu kadar piksel yaklaşınca ürker
//   homeRadius   : yuvanın çevresinde dolaştığı yarıçap (karo)
//   tiles        : yuva seçerken tercih ettiği zemin karoları
//   minTownDistance : yuva meydandan en az bu kadar karo uzakta
//   restHours    : bu saatlerde yuvasında dinlenir (tavşan yuvasına girer, geyik yatar)
export const WILDLIFE = {
  rabbit: {
    name: 'Tavşan',
    count: 9,
    speed: 16,
    fleeSpeed: 44,
    fleeRadius: 38,
    homeRadius: 5,
    tiles: ['meadow', 'forest', 'grass'],
    minTownDistance: 13,
    restHours: { from: 21, to: 5 },
  },
  deer: {
    name: 'Geyik',
    count: 4,
    speed: 12,
    fleeSpeed: 36,
    fleeRadius: 62,
    homeRadius: 8,
    tiles: ['forest', 'meadow'],
    minTownDistance: 17,
    restHours: { from: 22, to: 4 },
  },
};

// Kasaba hayvanları: kasaba büyüyünce (ya da han / belediye kurulunca) birer birer gelir, meydanda ve evlerin
// çevresinde dolaşır; gece, yağmurda ve kışın saçak altında ya da ateş başında kıvrılıp uyur.
//   schedule : kasaba seviyesine göre kasabadaki kedi / köpek sayısı (han ya da belediye varsa en az 2. seviye)
//   petRadius, petCooldownMinutes, petChancePerMinute: yanından geçen sakin onu sever (kalp, anlık keyif)
export const PETS = {
  cat: {
    name: 'Kedi',
    names: ['Tekir', 'Pamuk', 'Minnoş', 'Duman', 'Boncuk'],
    speed: 18,
    variants: 3, // tekir (gri), sarman (turuncu), kara-beyaz
  },
  dog: {
    name: 'Köpek',
    names: ['Karabaş', 'Çomar', 'Paşa', 'Fındık'],
    speed: 24,
    variants: 2, // kahverengi, alacalı
  },
  schedule: {
    1: { cat: 0, dog: 0 },
    2: { cat: 1, dog: 1 },
    3: { cat: 2, dog: 1 },
    4: { cat: 2, dog: 2 },
  },
  unlockBuildings: ['inn', 'townHall'], // bunlardan biri tamamlanmışsa Mezra'da da gelirler
  arrivalHour: 9, // yeni hayvan sabah bu saatte harita kenarından gelir (günde en çok bir tane)
  petRadius: 13,
  petChancePerMinute: 0.35,
  petCooldownMinutes: 120,
  petFun: 6,
  childPetFun: 9,
};
