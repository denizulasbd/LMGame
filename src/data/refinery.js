// (24. aşama, 24.2) Katma değerli üretim: Dokuma Tezgâhı (Keten -> Kumaş) ve Şerbethane (Şerbetçiotu -> Fıçı Şerbeti).
// Yapı tanımları data/buildings.js'te (loom, brewery: processing), saf hesaplar systems/Refinery.js'te, olaylar ve saatlik
// işler (handa fıçı ikmali, çantadan şerbet içme) systems/RefinerySystem.js'tedir. Rastgelelik kullanılmaz.
//
//   LUXURY_WORK      : dokumacı ve şerbetçi "lüks / ticaret fazlası" işlerdir
//     priority       : iş seçiminde üretim yapılarından bu kadar kademe sonra gelir (JobSystem; Gözcü Kulesi nöbeti gibi):
//                      fırıncı, çiftçi ve yapı ustası yuvaları dolmadan kimse tezgâha / mahzene geçmez
//     hungryPerCapita: kasabanın kişi başı besini bunun altındayken tezgâh ve mahzen boşta kalır (herkes gıdaya döner)
//   INN_SHERBET      : handaki fıçı şerbeti
//     capacity       : handaki fıçı yuvası; restockPerHour: her saat kasaba deposundan hana taşınan fıçı (han işlerken)
//     fun            : fıçı şerbeti içen sakinin anında kazandığı keyif (+15)
//     multiplier     : handa oturduğu sürece keyif ve sosyallik barlarının dolma hızı çarpanı (iki kat)
//     palate         : "Keyifli Damak": şerbet içen sakin ertesi gün untilHour'a kadar bu çarpanla yavaş keyif kaybeder
//   SHERBET_JUG      : handan çantaya alınan Şerbet Testisi (fiyatı keseden; handa en az minCasks fıçı varken)
//     drinkBelowFun  : çantasında testi olan sakinin keyfi bunun altına inince içer (+fun)
//   GARMENT          : Pazar Yeri'nin terzi tezgâhında kasabanın kumaşından dikilen Dayanıklı Giysi
//     price          : keseden ödenen dikiş ücreti; cloth: kasaba deposundan düşen kumaş
//     seasons        : sakinin giysi almayı düşündüğü mevsimler (kışa hazırlık)
//     coldProtection : çantasında giysi olan sakinin soğuğa karşı ek koruması (paltoyla toplanır, en çok 1)
//   CLOTH_WELFARE    : dokunan her `per` kumaş kasaba refahına kalıcı +1 (en çok max)
export const LUXURY_WORK = {
  priority: 1,
  hungryPerCapita: 3,
};

export const INN_SHERBET = {
  capacity: 12,
  restockPerHour: 2,
  fun: 15,
  multiplier: 2,
  palate: { untilHour: 12, funDecay: 0.75 },
};

export const SHERBET_JUG = {
  price: 5,
  minCasks: 3,
  drinkBelowFun: 35,
  fun: 15,
};

export const GARMENT = {
  price: 8,
  cloth: 1,
  seasons: ['autumn', 'winter'],
  coldProtection: 0.3,
};

export const CLOTH_WELFARE = {
  per: 40,
  max: 3,
};
