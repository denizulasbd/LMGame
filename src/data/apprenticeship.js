// (25. aşama, 25.2) Usta-Çırak sistemi ve mesleki eğitim. Hesaplar src/systems/Apprenticeship.js (saf) ve
// ApprenticeshipSystem.js'te (durum değiştirir); burada yalnızca sayılar, adlar ve sözler var.
//
// İlke: çıraklık kasabanın iş gücünü KİLİTLEMEZ. Genç (18-20) bir sakin, oyuncunun "Çırak Kapısı"nı açtığı (ya da kartından
// doğrudan yazdığı) bir zanaat yapısına çırak olur; mesai saatlerinde ustası o yapıda çalışırken onun yanındaki taburesinde
// izler ve getir-götür işlerine bakar. Ustası orada değilse, kasabada gıda kıtlığı varsa ya da çekirdek iş gücü azsa çırak
// her zamanki gibi kasabanın işine koşar. Usta ve çırak ana üreteci hiç tüketmez: bu katmanın kendi üreteci vardır.

// Zanaat yapıları -> meslek. skill: ustanın / mezunun geliştirdiği meslek (data/skills.js); item: çırak işi (data/citizens.js)
export const PROFESSIONS = {
  workshop: {
    name: 'Demircilik ve Terzilik',
    master: 'Demirci',
    skill: 'crafting',
    item: 'noviceNails',
    lines: {
      master: ['Çekici doğru tut evlat...', 'Demir sıcakken dövülür!', 'Dikişi sık at, sağlam olsun.', 'Acele etme, sabırla.'],
      apprentice: ['Öğreniyorum ustam!', 'Ateş tam kıvamında!', 'Örsü ben silerim!', 'Bir çivi daha!'],
    },
  },
  lumberHut: {
    name: 'Marangozluk',
    master: 'Marangoz',
    skill: 'woodcutting',
    item: 'woodenSpoon',
    lines: {
      master: ['Testereyi damara göre sür.', 'Ölç iki kere, kes bir kere!', 'Rendeyi yavaş çek evlat.'],
      apprentice: ['Talaşları toplarım ustam!', 'Ne güzel kokuyor çam!', 'Öğreniyorum ustam!'],
    },
  },
  healerHut: {
    name: 'Şifacılık',
    master: 'Şifacı',
    skill: 'herbalism',
    item: 'herbSachet',
    lines: {
      master: ['Nane mi bu, ısırgan mı?', 'Havanı ağır ağır döv.', 'Her otun bir dili var.'],
      apprentice: ['Kekik kokusu ne hoş!', 'Otları kuruturum ustam!', 'Öğreniyorum ustam!'],
    },
  },
  mill: {
    name: 'Fırıncılık',
    master: 'Fırıncı',
    skill: 'baking',
    item: 'crispCookie',
    lines: {
      master: ['Hamuru dinlendir evlat.', 'Fırın tam kıvamında!', 'Unu eleyerek ser.'],
      apprentice: ['Ekmek kokusu geldi!', 'Hamuru ben yoğururum!', 'Öğreniyorum ustam!'],
    },
  },
  loom: {
    name: 'Dokumacılık',
    master: 'Dokumacı',
    skill: 'crafting',
    item: 'plainCloth',
    lines: {
      master: ['Mekiği sık at, gergin tut.', 'Bir ilmek, bir sabır.', 'Desen kendi kendine çıkmaz evlat.'],
      apprentice: ['İplikleri sararım ustam!', 'Mekik uçuyor!', 'Öğreniyorum ustam!'],
    },
  },
  brewery: {
    name: 'Şerbetçilik',
    master: 'Şerbethane Ustası',
    skill: 'cooking',
    item: 'syrupVial',
    lines: {
      master: ['Kazanı yavaş karıştır.', 'Şerbetçiotu tam vaktinde!', 'Tadına bak, sonra dök.'],
      apprentice: ['Mis gibi kokuyor!', 'Fıçıları ben yuvarlarım!', 'Öğreniyorum ustam!'],
    },
  },
};
export const PROFESSION_TYPES = Object.keys(PROFESSIONS);

// İlerleme (0-100): ustası aynı yapıda çalışırken mesai dakikası başına perMinute (28.2: yaklaşık 30 mesai saatinde %100; eskiden 60).
// Çırak yarı yorulur (fatigue) ve keyfi yavaş düşer; çırak işine ancak craftFrom'dan sonra başlar.
export const APPRENTICE = {
  perMinute: 100 / 1800, // (28.2) 30 mesai saatinde %100 (eskiden 60 saat)
  fatigue: 0.5,
  funCost: 0.5,
  perBuilding: 1, // her zanaat yapısında en çok bu kadar çırak (Seviye 2 yapıda bir fazlası)
  enrollHour: 7, // açık kapılara boştaki gençler bu saatte yazılır
  minFoodPerCapita: 6, // kişi başı besin bunun altındaysa çıraklar tarlaya / işe koşar (gıda dengesi önce)
  minCoreAdults: 3, // çalışabilir yetişkin bundan azsa çıraklık bekler
  standOffset: { x: 9, y: 1 }, // taburenin ustanın çalıştığı noktaya göre yeri (piksel)
  speechPerMinute: 0.012, // usta / çırak konuşma olasılığı (kendi üreteciyle)
  speechSeconds: 3.2,
  practiceRate: 0.6, // (27.1/27.2) Tezgâh Pratiği: yapı boşta (sipariş / raf dolu) beklerken ustasının taburesinde normalin %60'ı hızla
};

// Gururlu Usta: yanında çırağı çalışan ustanın keyfi %25 yavaş düşer (hours saat sürer, her birlikte mesaide yenilenir);
// çırak %50'yi geçince getir-götür işleri ustanın tezgâhına verim katar (28.2: +%5 -> +%20, çırak bulundurmak hemen kârlı).
export const PROUD_MASTER = { hours: 6, funDecay: 0.75, workBoostFrom: 50, workBoost: 1.2 };

// Çırak İşi: ilerleme craftFrom'u geçince her mesai sonunda craftChance olasılıkla, hammadde tüketmeden mesleğin çırak
// işinden bir tane çantasına koyar; çantada sellAt tane biriken çırak işi Pazar Yeri varsa satılır (kesesine değeri kadar).
export const APPRENTICE_CRAFT = { craftFrom: 50, craftChance: 0.35, sellAt: 3 };

// Mezuniyet: Genç 21 yaşında Yetişkin olunca ilerleme master'ı geçtiyse o meslekte Yetkin Usta (Usta kademesi), journeyman'ı
// geçtiyse Kıdemli Kalfa (Kalfa kademesinin üst ucu) olarak başlar; daha azsa ilerlemesi kadar deneyimle başlar.
export const GRADUATION = { master: 100, journeyman: 60, masterXp: 1500, journeymanXp: 1200, partialXpPerPercent: 6 };

// (28.2) Başusta: çıraklığı %100 ile bitiren Genç, 21 yaşında Yetişkin olunca Yetkin Usta'nın yanında kalıcı Başusta olur
// (Character.isGrandmaster + grandmasterProfession = o çıraklığın zanaat yapısı). Yalnızca çıraklıktan tam mezunlara verilir; normal
// çalışarak usta olanlar ASLA Başusta olamaz.
//   masterworkMultiplier: kendi mesleğinin yapısında çalışırken usta işi eser şansı (taban + sabit iş yeri + Sağlam Alet) bu kat artar
//                         (taban %4 -> %8; sabit iş yeri ve Sağlam Alet ile %16'ya kadar)
//   saveEvery           : kendi mesleğinin işleme / zanaat yapısında her 5. üretim hiç hammadde harcamaz (deterministik sayaç; üreteç yok)
export const GRANDMASTER = { masterworkMultiplier: 2, saveEvery: 5, title: 'Başusta' };
