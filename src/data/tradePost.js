// (24.3) Dış ticaret: Ticaret İskelesi / Kervan Konağı, ihracat sözleşmeleri, pazar doygunluğu ve hammadde ithalatı.
// Yapı tanımı data/buildings.js -> tradingPost; saf hesaplar systems/TradePost.js'te, takvim ve olaylar systems/TradePostSystem.js'te.
// Rastgelelik kullanılmaz: talepler ve takvim ziyaret sayısından türetilir, hiçbir üretecin sırası değişmez.
//
//   VISIT
//     firstHours    : yapı tamamlandıktan sonra ilk geminin / kervanın gelmesine kalan en az süre (saat); varışlar arrivalHour'da
//     intervalDays  : iki ziyaret arası gün (sırayla 3 ve 4: "3-4 günde bir")
//     arrivalHour   : gemi / kervan bu saatte demir atar (çadır kurar)
//     stayHours     : rıhtımda / konakta kalma süresi (24 saat)
//   CONTRACTS       : ihracat talepleri (her ziyarette 3 tane): Kumaş ve Fıçı Şerbeti her zaman, üçüncüsü sırayla Ekmek, Erzak, Yün
//     qty / gold    : teslim edilecek birim ve karşılığındaki taban altın (pazar çarpanıyla çarpılır)
//   MARKET          : pazar doygunluğu
//     streak        : aynı mal bu kadar kez peş peşe ihraç edilince ...
//     drop          : ... o malın fiyat çarpanı bu kadar düşer (her ek satışta yeniden)
//     floor         : çarpan bundan aşağı inmez
//     recoverOnOther: başka bir mal satıldığında, satılmayan her malın düşük çarpanı bu kadar toparlanır
//     recoverPerVisit: her yeni ziyarette, önceki ziyarette satılmayan malların çarpanı bu kadar toparlanır (en çok 1)
//   IMPORTS         : tüccardan ithal edilen hammadde paketleri (yalnızca gemi / kervan buradayken; ziyaret başına stock kez)
export const VISIT = {
  firstHours: 12,
  intervalDays: [3, 4],
  arrivalHour: 9,
  stayHours: 24,
};

export const CONTRACTS = {
  cloth: { qty: 10, gold: 40, title: 'Kumaş Talebi', buyer: 'Krallık dokuma loncası' },
  sherbet: { qty: 8, gold: 35, title: 'Şerbet Talebi', buyer: 'Saray mahzeni' },
  bread: { qty: 25, gold: 20, title: 'Ekmek Talebi', buyer: 'Garnizon fırını' },
  food: { qty: 40, gold: 18, title: 'Erzak Talebi', buyer: 'Kervan kumanyası' },
  wool: { qty: 15, gold: 30, title: 'Yün Talebi', buyer: 'Şehir terzileri' },
};
export const FIXED_CONTRACTS = ['cloth', 'sherbet'];
export const ROTATING_CONTRACTS = ['bread', 'food', 'wool'];

export const MARKET = {
  streak: 3,
  drop: 0.12,
  floor: 0.55,
  recoverOnOther: 0.05,
  recoverPerVisit: 0.05,
};

export const IMPORTS = {
  wood: { name: 'Odun Paketi', give: { gold: 15 }, get: { wood: 30 }, stock: 3 },
  stone: { name: 'Taş Paketi', give: { gold: 15 }, get: { stone: 25 }, stock: 3 },
  iron: { name: 'Demir Paketi', give: { gold: 20 }, get: { iron: 10 }, stock: 3 },
};
export const IMPORT_KEYS = Object.keys(IMPORTS);
