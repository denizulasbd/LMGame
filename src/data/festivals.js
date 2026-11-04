// Dört mevsimin büyük kapanış festivalleri (14. aşama). Mantık: src/systems/SeasonFestivalSystem.js; süslemeler
// src/art/sprites/festival.js, ışık ve parıltılar src/rendering/FestivalEffects.js, ezgiler src/systems/AudioSystem.js.
//
// Her mevsimin SON günü sabah announceHour'da duyurulur (bildirim, günlük, HUD), startHour'da başlar ve gece yarısı
// (endHour) biter. Festival süresince kasabanın şenlik kuralları (state.events.festival) geçerlidir: sakinler festival
// yerinde toplanıp dans eder. Bitince herkes ertesi mevsime "Mevsim Coşkusu" bonusuyla başlar.
//   venues  : festival yerinin önceliği (ilk bulunan yapı)
//   buff    : festival sürerken etkin kasaba bonusu (data/town.js -> TOWN_BUFFS)
//   decor   : festival yerinin çevresine kurulan süslemeler (çizim; karo kaplamaz): [tür, adet]
//   arrival : sakin festivale ilk vardığında bir kez: ihtiyaçlarına eklenen ve balonu
//   memory  : katılanların anılarına yazılan cümle
//   warm    : festivaldekiler kışın üşümez (şölen ateşi)
export const SEASON_FESTIVAL = {
  announceHour: 8,
  startHour: 15,
  endHour: 24,
  afterglowBuff: 'seasonCheer', // bitince 24 saat
  afterglowFun: 35,
  decorRadius: [2, 4], // süslemelerin festival yerine uzaklığı (karo)
};

export const SEASON_FESTIVALS = {
  spring: {
    name: 'Çiçek Şenliği',
    icon: 'blossom',
    venues: ['fountain', 'campfire', 'inn'],
    buff: 'blossomFestival',
    decor: [['flowerArch', 2], ['flowerBasket', 3]],
    arrival: { fun: 15, social: 10, bubble: 'love' },
    flowerCrown: true, // sakinler saçlarına çiçek takar
    announce: 'Bugün 15:00\'te meydanda Çiçek Şenliği! Çiçek kemerleri kuruluyor, herkes saçına çiçek takacak.',
    started: 'Çiçek Şenliği başladı! Meydan çiçek kemerleriyle süslendi; aşk ve dostluk havada.',
    ended: 'Çiçek Şenliği bitti. Kasaba yaza aşkla ve dostlukla giriyor.',
    memory: 'Çiçek Şenliği\'nde saçına çiçek takıp dans etti',
  },
  summer: {
    name: 'Güneş ve Nehir Panayırı',
    icon: 'sunfair',
    venues: ['harbor', 'fishingPier', 'fountain'],
    buff: 'sunFair',
    decor: [['feastTable', 2], ['flagPole', 2]],
    arrival: { hunger: 30, fun: 15, bubble: 'apple' },
    announce: 'Bugün 15:00\'te nehir kıyısında Güneş ve Nehir Panayırı! Flamalar asılıyor, ziyafet sofraları kuruluyor.',
    started: 'Güneş ve Nehir Panayırı başladı! Nehir kıyısı rengârenk flamalarla doldu, panayır müziği çalıyor.',
    ended: 'Panayır bitti. Kasaba sonbahara karnı tok, keyfi yerinde giriyor.',
    memory: 'Güneş ve Nehir Panayırı\'nda nehir kıyısında ziyafet çekti',
  },
  autumn: {
    name: 'Büyük Hasat Bayramı',
    icon: 'harvest',
    venues: ['fountain', 'campfire', 'inn'],
    buff: 'harvestFeast',
    decor: [['harvestBasket', 1], ['pumpkin', 3], ['ciderBarrel', 2]],
    arrival: { fun: 20, hunger: 15, bubble: 'apple' },
    announce: 'Bugün 15:00\'te meydanda Büyük Hasat Bayramı! Dev hasat sepeti kuruluyor, fıçılarda elma şırası var.',
    started: 'Büyük Hasat Bayramı başladı! Meydanda dev hasat sepeti ve kabaklar; fıçılardan elma şırası dağıtılıyor.',
    ended: 'Hasat Bayramı bitti. Tarlaların bereketiyle kasaba kışa hazır.',
    memory: 'Büyük Hasat Bayramı\'nda elma şırası içip bereketi kutladı',
  },
  winter: {
    name: 'Işıklar Gecesi ve Kardan Adam Şöleni',
    icon: 'snowman',
    venues: ['campfire', 'fountain', 'inn'],
    buff: 'lightsNight',
    decor: [['snowman', 1]],
    arrival: { fun: 20, bubble: 'fire' },
    warm: true,
    announce: 'Bugün 15:00\'te Işıklar Gecesi! Sakinler meydana el birliğiyle kardan adam dikecek, şölen ateşi yakılacak.',
    started: 'Işıklar Gecesi başladı! Kardan adam yükseliyor, şölen ateşi harlandı, bütün fenerler parıldıyor.',
    ended: 'Işıklar Gecesi bitti. Kış sağlıkla atlatıldı; kasaba ilkbahara coşkuyla giriyor.',
    memory: 'Işıklar Gecesi\'nde el birliğiyle kardan adam yapıp kışı uğurladı',
  },
};

// Kardan adamın yükselme kademeleri (festival başladıktan sonra oyun dakikası): gövde, orta, baş ve şapka
export const SNOWMAN_STAGES = [0, 40, 90];
