// (26. aşama, 26.1) Mevsimlik Panayır Döngüsü ve Meydan Şenlikleri. Mantık: src/systems/FairSystem.js (saf yardımcılar:
// src/systems/Fair.js), çizim: src/rendering/FairDecor.js.
//
// Her mevsimin SON günü, Altın Çağ başladıktan sonra, kasabanın dört panayırından biri kurulur:
//   06:00 - 18:00  Hazırlık evresi ('prep'): meydan havuzunun çevresine geçici tentler ve bayrak flamaları kurulur. Sakinler
//                  normal işlerine gider (otopilot ve üretim aksamaz; sabah mesaisi 08:00 - 17:00 dokunulmaz).
//   18:00 - 22:00  Şenlik saati ('party'): iş çıkışı herkes meydanda toplanır, müzik dinler, havuz başında dans eder; mevsimin
//                  süsleri (çelenk, güneş feneri, hasat sepeti, şenlik ateşi) yanar. Panayır Coşkusu keyif ve sosyallik doldurur.
//   22:00          Kapanış: süsler kaldırılır (harita matrisine hiçbir şey yazılmadı), herkes uykuya geçer.
// Panayır Altın Çağ'dan ÖNCE kurulmaz: erken oyun (ve Ulu Saat Kulesi'ne kadar olan her olay kaydı) aynı kalır.
// Bu katman KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 32): yalnızca söz seçimi ve 2. kuşak neşesinin
// konuşmaları. Ana üretece ve Math.random'a dokunmaz.
export const FAIR = {
  prepHour: 6,
  partyHour: 18,
  endHour: 22,
  minPopulation: 3,
  venues: ['fountain', 'campfire', 'inn'], // meydan havuzu, yoksa kamp ateşi, yoksa han
  theme: 'fair', // state.events.festival.theme: eski mevsim festivalleri gibi kapanışı panayırın kendisi yapar (EventSystem sadece 'festival:ended' yayar)
  buff: 'fairSpirit', // şenlik saatinde etkin kasaba bonusu (data/town.js -> TOWN_BUFFS)
  // Panayır Coşkusu: meydandaki (şenlik etkinliğinin 'perform' evresindeki) sakinlere dakikada eklenen
  funPerMinute: 0.22,
  socialPerMinute: 0.2,
  // "Şenlik Neşesi" huylu 2. kuşak sakin havuz başında dans ederken yanındakilere dakikada fazladan yaydığı keyif
  festiveGeneration: 2,
  festiveJoy: { radius: 52, perMinute: 0.07 },
  speechSeconds: 3.4,
  speechPerMinute: 0.012, // meydandaki sakin başına dakikada konuşma olasılığı (kıdemli bilgeler ve neşeliler için çarpanlar altta)
  elderSpeechMul: 2.2,
  festiveSpeechMul: 2,
};

// type = mevsim anahtarı (state.currentFestival.type). Sıra: ilkbahar, yaz, sonbahar, kış (takvim sırası)
export const FAIRS = {
  spring: {
    name: 'Bahar Çiçek Panayırı',
    icon: 'blossom',
    start: 'Meydanda Bahar Çiçek Panayırı başladı! Bu akşam herkes meydanda toplanıyor.',
    party: 'Bahar Çiçek Panayırı\'nın şenlik saati geldi: çelenkler yanıyor, meydanda müzik çalıyor.',
    end: 'Bahar Çiçek Panayırı sona erdi; meydan toplanıyor, kasaba uykuya çekiliyor.',
    memory: 'Bahar Çiçek Panayırı\'nda meydanda çelenklerin altında dans etti',
    cheers: ['Yaşasın Bahar Panayırı!', 'Ne güzel çiçekler!', 'Baharın şerefine!'],
    colors: ['#f06b8a', '#ffffff', '#f9b4c6', '#a4dd5c'], // tent / flama renkleri
    prop: 'wreath', // şenlik saatinde: çiçek çelenkleri
  },
  summer: {
    name: 'Yaz Güneşi Şenliği',
    icon: 'sunfair',
    start: 'Meydanda Yaz Güneşi Şenliği başladı! Bu akşam herkes meydanda toplanıyor.',
    party: 'Yaz Güneşi Şenliği\'nin şenlik saati geldi: güneş fenerleri yandı, havuz başı kalabalık.',
    end: 'Yaz Güneşi Şenliği sona erdi; fenerler söndü, kasaba serin gecede uykuya dalıyor.',
    memory: 'Yaz Güneşi Şenliği\'nde güneş fenerlerinin altında dans etti',
    cheers: ['Güneş bizimle!', 'Yaşasın yaz!', 'Bu akşam gün batmasın!'],
    colors: ['#ffd23f', '#e8463c', '#4aa3df', '#ff9a3c'],
    prop: 'sunLantern',
  },
  autumn: {
    name: 'Hasat Bayramı',
    icon: 'harvest',
    start: 'Meydanda Hasat Bayramı başladı! Bu akşam herkes meydanda toplanıyor.',
    party: 'Hasat Bayramı\'nın şenlik saati geldi: hasat sepetleri doldu, davullar çalıyor.',
    end: 'Hasat Bayramı sona erdi; sepetler toplandı, kasaba tok ve mutlu uykuya dalıyor.',
    memory: 'Hasat Bayramı\'nda hasat sepetlerinin yanında dans etti',
    cheers: ['Bereketli olsun!', 'Hasat bol, gönül hoş!', 'Yaşasın Hasat Bayramı!'],
    colors: ['#f0a830', '#d4652a', '#9c3424', '#f6d860'],
    prop: 'basket',
  },
  winter: {
    name: 'Kış Dönümü Ateşi',
    icon: 'snowman',
    start: 'Meydanda Kış Dönümü Ateşi başladı! Bu akşam herkes meydanda toplanıyor.',
    party: 'Kış Dönümü Ateşi\'nin şenlik saati geldi: meydan meşalesi yakıldı, herkes etrafında ısınıyor.',
    end: 'Kış Dönümü Ateşi sona erdi; közler örtüldü, kasaba sıcacık uykuya geçiyor.',
    memory: 'Kış Dönümü Ateşi\'nin başında ısınıp dans etti',
    cheers: ['Ateş sönmesin!', 'Kışa inat!', 'Közler bizi ısıtır!'],
    colors: ['#4aa3df', '#e8463c', '#ffffff', '#8a6cf0'],
    prop: 'torch',
  },
};

export const FAIR_TYPES = Object.keys(FAIRS);
export const FAIR_PHASES = ['prep', 'party'];

// Kıdemli Bilgelerin gençleri izlerken söylediği nostalji sözleri
export const ELDER_LINES = [
  'Bizim zamanımızda meydan bu kadar şenlikli değildi.',
  'Şu gençlere bak, ne güzel dans ediyorlar!',
  'Ben de gençken bu havuz başında dönerdim.',
  'Kasaba ne çok büyüdü, ne çok!',
  'Eski panayırları hatırladım, gözlerim doldu.',
];

// "Şenlik Neşesi" huylu 2. kuşak dansçıların sözleri
export const FESTIVE_DANCER_LINES = ['Haydi hep birlikte oynayalım!', 'Dans etmeyen kalmasın!', 'Şu havuzun etrafında dönelim!'];
