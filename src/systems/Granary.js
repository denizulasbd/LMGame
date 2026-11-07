// (24. aşama) Tarımsal çeşitliliğin saf hesapları (durum değiştirmez). Kurallar data/crops.js'te.
//   cropOf(building)          : mahsul seçebilen yapının (bahçe) seçili mahsulü; ötekilerde null
//   productionOf(building)    : yapının bugünkü üretim tanımı: bahçede seçili mahsulün ürünü ve verimi, ötekilerde tanımın kendisi
//   storageLimit(state, key)  : bir kaynağın depo sınırı: genel kapasite + (tarımsal kaynaksa) silo katkısı; hazine sınırsız
//   hasGranary(state)         : kasabada işleyen bir Ürün Silosu var mı (mahsuller bozulmaz)
//   spoilageAt(state, key, h) : silosuz kasabada h saatte bu kaynaktan bozulacak (küsuratlı) miktar
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';
import { CROPS, DEFAULT_CROP, AGRI_KEYS, SPOILAGE } from '../data/crops.js';

/** Yapı türü mahsul seçebiliyor mu (Sebze Bahçesi). */
export function canChooseCrop(type) {
  return Array.isArray(BUILDINGS[type]?.crops);
}

/** Geçerli bir mahsul anahtarı (geçersiz / eksik -> varsayılan Buğday). */
export function normalizeCrop(type, crop) {
  if (!canChooseCrop(type)) return null;
  return BUILDINGS[type].crops.includes(crop) ? crop : DEFAULT_CROP;
}

export function cropOf(building) {
  return canChooseCrop(building.type) ? normalizeCrop(building.type, building.crop) : null;
}

/** Üretim tanımı: mahsul seçen yapıda ana ürün ve saatlik verim mahsulden gelir. */
export function productionOf(building) {
  const production = BUILDINGS[building.type].production;
  const crop = cropOf(building);
  if (!production || !crop) return production;
  const { resource, perHour } = CROPS[crop];
  return production.resource === resource && production.perHour === perHour ? production : { ...production, resource, perHour };
}

/** Bu yapı türü bu kaynağı (herhangi bir mahsulle) üretebilir mi. */
export function canProduce(type, resource) {
  const def = BUILDINGS[type];
  if (def.production?.resource === resource) return true;
  return canChooseCrop(type) && def.crops.some((c) => CROPS[c].resource === resource);
}

export function isAgricultural(resource) {
  return AGRI_KEYS.includes(resource);
}

/** Bir kaynağın depo sınırı (Kiler'ler, belediye fermanı ve tarımsal kaynaklarda Ürün Silosu). */
export function storageLimit(state, resource) {
  if (RESOURCES[resource]?.treasury) return Infinity;
  return state.storageCapacity + (isAgricultural(resource) ? state.granaryCapacity ?? 0 : 0);
}

export function hasGranary(state) {
  return (state.granaryCapacity ?? 0) > 0;
}

/** Silosuz kasabada h saatte bozulacak miktar (yalnızca güvenli stoğun üstü; silo varsa 0). */
export function spoilageAt(state, resource, hours = 1) {
  if (hasGranary(state) || !SPOILAGE.keys.includes(resource)) return 0;
  const excess = (state.resources[resource] ?? 0) - SPOILAGE.safeStock;
  return excess > 0 ? excess * SPOILAGE.perHour * hours : 0;
}

/** Kayıttaki silo / bozulma durumu (eski kayıtlarda boş). */
export function emptyGranary() {
  return { spoiled: {}, buffers: {}, switches: 0 };
}

export function restoreGranary(data) {
  const out = emptyGranary();
  if (!data || typeof data !== 'object') return out;
  for (const key of SPOILAGE.keys) {
    const spoiled = Math.floor(Number(data.spoiled?.[key]) || 0);
    if (spoiled > 0) out.spoiled[key] = spoiled;
    const buffer = Number(data.buffers?.[key]) || 0;
    if (buffer > 0 && buffer < 1) out.buffers[key] = buffer;
  }
  out.switches = Math.max(0, Math.floor(Number(data.switches) || 0));
  return out;
}
