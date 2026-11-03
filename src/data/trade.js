// Gezgin tüccar ve takas teklifleri. Kurallar src/systems/EventSystem.js'te, pencere
// src/ui/components/TradePanel.js'te.
//   give : kasabanın verdiği, get : kasabanın aldığı, buff : alınan kasaba bonusu (data/town.js)
//   stock: bir ziyarette bu teklif kaç kez yapılabilir
//   seasons: yalnızca bu mevsimlerde sunulur (yoksa her mevsim)
/** Bu mevsimde sunulan teklifler. */
export function offersFor(seasonKey) {
  return TRADE_OFFERS.filter((o) => !o.seasons || o.seasons.includes(seasonKey));
}

export const TRADE_OFFERS = [
  { id: 'woodForFood', give: { wood: 12 }, get: { food: 8 }, stock: 3 },
  { id: 'stoneForFood', give: { stone: 10 }, get: { food: 8 }, stock: 3 },
  { id: 'foodForWood', give: { food: 10 }, get: { wood: 10 }, stock: 3 },
  { id: 'foodForStone', give: { food: 10 }, get: { stone: 8 }, stock: 3 },
  // Sonbahar: tüccar kışlık erzak ve odun yüküyle gelir
  { id: 'winterProvisions', give: { stone: 15 }, get: { food: 25 }, stock: 2, seasons: ['autumn'], name: 'Kışlık Erzak' },
  { id: 'firewood', give: { food: 15 }, get: { wood: 25 }, stock: 2, seasons: ['autumn'], name: 'Odun Yükü' },
  {
    id: 'toolKit',
    give: { wood: 15, stone: 15 },
    buff: 'tools',
    stock: 1,
    name: 'Alet Paketi',
    description: '1 gün boyunca herkes %25 daha hızlı çalışır.',
  },
  {
    id: 'townFeast',
    give: { food: 25 },
    buff: 'feast',
    stock: 1,
    name: 'Kasaba İkramı',
    description: 'Herkesin keyfi hemen artar ve 1 gün boyunca yavaş düşer.',
  },
];

export const MERCHANT = {
  arrivalHour: 9,
  departHour: 18,
  intervalDays: [2, 3],   // iki ziyaret arası gün
  firstVisitDelayDays: 1, // pazar tamamlandıktan sonraki ilk ziyaret
  names: ['Rıza', 'Nermin', 'Halil', 'Gülsüm'],
  appearances: [
    { hair: 'hat', hairColor: 'brown', skin: 'tan', shirt: 'mustard', pants: 'brown' },
    { hair: 'bun', hairColor: 'gray', skin: 'light', shirt: 'teal', pants: 'plum' },
    { hair: 'short', hairColor: 'black', skin: 'deep', shirt: 'red', pants: 'navy' },
    { hair: 'long', hairColor: 'auburn', skin: 'medium', shirt: 'lavender', pants: 'denim' },
  ],
};
