// (34.2) Parsel pazarı: haritanın çevresindeki toprakların içeriği, adı, fiyatı, nüfus kotası ve satın alma kuralları.
// SAF hesaplar: durum yazmaz, zar çekmez. Satın almayı ParcelSystem yapar; sayılar ve metinler data/parcels.js'te.
//
// Parsel (world/Parcels.js) şu alanlarla zenginleşir (describeParcels): stats (karo sayıları), useful (işe yarar karo: su ve kaya
// nesnesi dışı), kind (forest / rocky / lake / meadow), name, direction, quota (nüfus kotası).
// İçerik harita tohumundan gelir (parseller kilitliyken sayılır), bu yüzden ad ve fiyat oyuncunun yaptıklarından etkilenmez.
import { PARCEL_MARKET as M, PARCEL_NAMES as N, PARCEL_TEXT as T } from '../data/parcels.js';
import { TOWN_TIERS } from '../data/town.js';

// ---------------------------------------------------------------------------
// İçerik, ad, kota
// ---------------------------------------------------------------------------

/** Bir parselin karo sayıları (harita okunur, yazılmaz). */
export function parcelStats(map, parcel) {
  const s = { water: 0, rocky: 0, forest: 0, meadow: 0, oak: 0, pine: 0, rock: 0 };
  for (let y = parcel.y; y < parcel.y + parcel.h; y++) {
    for (let x = parcel.x; x < parcel.x + parcel.w; x++) {
      const tile = map.get(x, y);
      if (tile === 'water') s.water++;
      else if (tile === 'rocky') s.rocky++;
      else if (tile === 'forest') s.forest++;
      else if (tile === 'meadow') s.meadow++;
      const object = map.getObject(x, y);
      if (object === 'oak' || object === 'pine' || object === 'rock') s[object]++;
    }
  }
  return s;
}

/** İşe yarar alan: su ve kaya nesneleri dışındaki karolar. */
export function usefulArea(parcel, stats) {
  return Math.max(0, parcel.area - stats.water - stats.rock);
}

/** İçerik türü: göl > kaya > orman > çayır (oranlar data'da). */
export function parcelKind(parcel, stats) {
  const share = (n) => n / parcel.area;
  if (share(stats.water) >= M.content.lake) return 'lake';
  if (share(stats.rocky + stats.rock) >= M.content.rocky) return 'rocky';
  if (share(stats.oak + stats.pine) >= M.content.forest) return 'forest';
  return 'meadow';
}

/** Nüfus kotası: işe yarar alan büyüdükçe artar ([min, max]). */
export function parcelQuota(useful) {
  const q = M.quota;
  return Math.min(q.max, Math.max(q.min, Math.round((useful - q.offset) / q.tilesPerResident)));
}

/** Çekirdeğin merkezine göre sekiz yönden biri (n, ne, e, ...). */
export function parcelDirection(parcel, coreSize) {
  const dx = parcel.x + parcel.w / 2 - coreSize.width / 2;
  const dy = parcel.y + parcel.h / 2 - coreSize.height / 2;
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI; // 0 = kuzey, saat yönünde
  const keys = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  return keys[Math.round(((angle + 360) % 360) / 45) % 8];
}

/**
 * Bütün parselleri içerikleriyle zenginleştirir (yeni nesneler döner). Adlar tekil olur: aynı ad çıkarsa yön, sonra sıra sayısı eklenir.
 * @param {TileMap} map haritanın TEMİZ hâli (kayıttan arazi farkları uygulanmadan önce)
 */
export function describeParcels(map, parcels, coreSize) {
  const used = new Set();
  return parcels.map((parcel) => {
    const stats = parcelStats(map, parcel);
    const useful = usefulArea(parcel, stats);
    const kind = parcelKind(parcel, stats);
    const direction = parcelDirection(parcel, coreSize);
    const def = N.kinds[kind];
    const noun = def.nouns[kind === 'forest' ? (stats.pine >= stats.oak ? 'pine' : 'oak') : 'any'];
    const dirName = N.directions[direction];
    let name = def.withDirection ? `${dirName} ${noun}` : noun;
    if (used.has(name) && !def.withDirection) name = `${dirName} ${noun}`;
    const base = name;
    for (let i = 1; used.has(name); i++) name = `${base}${N.ordinals[i] ?? ` ${i + 1}`}`;
    used.add(name);
    return { ...parcel, stats, useful, kind, kindLabel: def.label, direction, name, quota: parcelQuota(useful) };
  });
}

// ---------------------------------------------------------------------------
// Kayıt defteri: nüfus sınırı yalnızca durumdan (state) hesaplanır, parsel kotaları ise haritadan gelir.
// TownScene her açılışta parselleri buraya yazar; oyun durumu bir sahnenin ömründen uzun yaşamaz.
// ---------------------------------------------------------------------------
let catalog = new Map();

export function registerParcels(parcels) {
  catalog = new Map(parcels.map((p) => [p.id, p]));
}

/** Kayıt defterindeki bütün parseller (sahne açıkken). */
export function registeredParcels() {
  return [...catalog.values()];
}

export function parcelById(id) {
  return catalog.get(id) ?? null;
}

// ---------------------------------------------------------------------------
// Fiyat
// ---------------------------------------------------------------------------

/**
 * Alınmış parsel sayısı arttıkça fiyat büyür; dökümü paneldeki satır için hazır döner.
 * Çarpan ilk parselde ×1, sonuncuda ×ratio olur (aradaki üstel); toplam parsel sayısı kayıt defterinden gelir.
 */
export function parcelPrice(parcel, purchased, total = Math.max(2, catalog.size)) {
  const p = M.price;
  const multiplier = Math.pow(p.ratio, Math.min(1, purchased / Math.max(1, total - 1)));
  const raw = parcel.useful * p.perTile * multiplier;
  const price = Math.max(p.min, Math.round(raw / p.roundTo) * p.roundTo);
  return { useful: parcel.useful, perTile: p.perTile, multiplier: Math.round(multiplier * 10) / 10, step: purchased + 1, total: price };
}

/** Parselin satın alma sayısına göre bugünkü fiyatı (altın). */
export function priceOf(parcel, state) {
  return parcelPrice(parcel, state.parcels.length).total;
}

// ---------------------------------------------------------------------------
// Satın alma kuralları
// ---------------------------------------------------------------------------

/** Açık parsel kimlikleri ('core' her zaman açık). */
export function openIds(state) {
  return new Set(['core', ...state.parcels]);
}

/** Bu parsel verilen seviyede, verilen sayıda parselle alınabilir mi? (komşuluk ve altın hariç) */
export function tierAllows(tier, parcel, count) {
  const gate = M.gates[tier] ?? M.gates[4];
  if (gate.maxParcels !== undefined && count >= gate.maxParcels) return false;
  if (gate.ring !== undefined && parcel.ring > gate.ring) return false;
  return true;
}

/** Bu parseli alabilmek için gereken ilk seviyenin adı (şimdikinden yüksek); yoksa null. */
export function tierNeeded(state, parcel) {
  const now = state.town?.tier ?? 1;
  const found = TOWN_TIERS.find((t) => t.tier > now && tierAllows(t.tier, parcel, state.parcels.length));
  return found ? found.name : null;
}

/**
 * Satın alınabilir mi? Dönüş: { ok, reason | null, price, breakdown, owned }.
 * Sıra: sahip → komşu → seviye → altın (ilk tutmayan neden yazılır).
 */
export function purchaseStatus(state, parcel, gold) {
  const breakdown = parcelPrice(parcel, state.parcels.length);
  const price = breakdown.total;
  const out = { ok: false, reason: null, price, breakdown, owned: false };
  if (state.parcels.includes(parcel.id)) return { ...out, owned: true, reason: T.owned };
  const open = openIds(state);
  if (!parcel.neighbors.some((id) => open.has(id))) return { ...out, reason: T.needNeighbor };
  if (!tierAllows(state.town?.tier ?? 1, parcel, state.parcels.length)) return { ...out, reason: T.needTier(tierNeeded(state, parcel) ?? TOWN_TIERS[TOWN_TIERS.length - 1].name) };
  if (gold < price) return { ...out, reason: T.needGold(price, gold) };
  return { ...out, ok: true };
}

/** Şu an alınabilir (komşu ve seviye uygun, altın aranmaz) parseller, ucuzdan pahalıya. */
export function buyableParcels(state, parcels) {
  const open = openIds(state);
  return parcels
    .filter((p) => !state.parcels.includes(p.id) && p.neighbors.some((id) => open.has(id)) && tierAllows(state.town?.tier ?? 1, p, state.parcels.length))
    .map((p) => ({ parcel: p, price: priceOf(p, state) }))
    .sort((a, b) => a.price - b.price || a.parcel.id.localeCompare(b.parcel.id));
}

// ---------------------------------------------------------------------------
// Nüfus sınırı
// ---------------------------------------------------------------------------

/** Açık parsellerin toplam nüfus kotası. */
export function parcelPopulationBonus(state) {
  let sum = 0;
  for (const id of state.parcels) sum += parcelById(id)?.quota ?? 0;
  return sum;
}

/** Göç sınırının dökümü: seviye sınırı + parsel kotası, en çok maxPopulation. Mevcut seviye sınırı hiçbir zaman düşmez. */
export function populationLimitBreakdown(state, tierLimit) {
  const parcels = parcelPopulationBonus(state);
  const total = Math.max(tierLimit, Math.min(M.maxPopulation, tierLimit + parcels));
  return { tier: tierLimit, parcels, total, cap: M.maxPopulation };
}
