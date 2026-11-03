// Gezgin tüccar ve takas teklifleri. Kurallar src/systems/EventSystem.js'te, pencere
// src/ui/components/TradePanel.js'te.
//   give : kasabanın verdiği, get : kasabanın aldığı, buff : alınan kasaba bonusu (data/town.js)
//   stock: bir ziyarette bu teklif kaç kez yapılabilir
//   seasons: yalnızca bu mevsimlerde sunulur (yoksa her mevsim)
//   minTier: (10. aşama) kasaba en az bu seviyedeyse sunulur (data/town.js -> TOWN_TIERS); kasaba
//            büyüdükçe tüccarın mal çeşitliliği artar, her teklifin stoğu da merchantBonus kadar büyür
import { TOWN_TIERS } from './town.js';

/** Bu mevsimde ve bu kasaba seviyesinde sunulan teklifler. */
export function offersFor(seasonKey, tier = 1) {
  return TRADE_OFFERS.filter((o) => (!o.seasons || o.seasons.includes(seasonKey)) && (o.minTier ?? 1) <= tier);
}

/** Bir teklifin bu kasaba seviyesindeki ziyaret başı stoğu (seviye arttıkça mal miktarı artar). */
export function offerStock(offer, tier = 1) {
  const def = TOWN_TIERS.find((t) => t.tier === tier) ?? TOWN_TIERS[0];
  return offer.stock + (offer.buff ? 0 : def.merchantBonus ?? 0);
}

export const TRADE_OFFERS = [
  { id: 'woodForFood', give: { wood: 12 }, get: { food: 8 }, stock: 3 },
  { id: 'stoneForFood', give: { stone: 10 }, get: { food: 8 }, stock: 3 },
  { id: 'foodForWood', give: { food: 10 }, get: { wood: 10 }, stock: 3 },
  { id: 'foodForStone', give: { food: 10 }, get: { stone: 8 }, stock: 3 },
  // Sonbahar: tüccar kışlık erzak ve odun yüküyle gelir
  { id: 'winterProvisions', give: { stone: 15 }, get: { food: 25 }, stock: 2, seasons: ['autumn'], name: 'Kışlık Erzak' },
  { id: 'firewood', give: { food: 15 }, get: { wood: 25 }, stock: 2, seasons: ['autumn'], name: 'Odun Yükü' },
  // Köy (2. seviye): işlenmiş mallar
  { id: 'woolBale', give: { food: 12 }, get: { wool: 6 }, stock: 2, minTier: 2, name: 'Yün Balyası' },
  { id: 'ironIngots', give: { stone: 12 }, get: { iron: 4 }, stock: 2, minTier: 2, name: 'Demir Külçesi' },
  // Kasaba (3. seviye): kervan; ekmek getirir, kasabanın yün ve demir fazlasını alır
  { id: 'breadBasket', give: { wood: 14 }, get: { bread: 6 }, stock: 2, minTier: 3, name: 'Ekmek Sepeti' },
  { id: 'sellWool', give: { wool: 8 }, get: { food: 16 }, stock: 2, minTier: 3, name: 'Yün Satışı' },
  { id: 'sellIron', give: { iron: 6 }, get: { stone: 18 }, stock: 2, minTier: 3, name: 'Demir Satışı' },
  // Gelişmiş Şehir (4. seviye): büyük kervan ve lonca ustaları
  { id: 'cityCaravan', give: { food: 30, wood: 20 }, get: { iron: 10, wool: 10 }, stock: 1, minTier: 4, name: 'Şehir Kervanı' },
  {
    id: 'guildMasters',
    give: { iron: 6, wool: 6 },
    buff: 'guild',
    stock: 1,
    minTier: 4,
    name: 'Lonca Ustaları',
    description: '1 gün boyunca herkes %20 daha hızlı çalışır, keyfi daha yavaş düşer.',
  },
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
  // Kasaba seviyesine göre tüccarın unvanı (Mezra, Köy, Kasaba, Gelişmiş Şehir)
  titles: ['Gezgin Tüccar', 'Gezgin Tüccar', 'Kervancı', 'Kervanbaşı'],
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
