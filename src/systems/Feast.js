// (26.2) Büyük Ziyafet Sofrasının saf hesapları (durum değiştirmez). Sayılar src/data/feast.js'te.
//   planFeast(state)           : { tier, contributions: { food, bread, sherbet, cloth }, servings } (kilerden neyin ayrılacağı)
//   currentFeastOf(state)      : bugünkü sofra { feast, tier, left, total } ya da null (çizim ve arayüz için)
//   sanitizeCurrentFeast(raw)  : kayıttaki sofra durumu; bozuksa null
//   state.currentFeast         : null | { tier, day, contributions, servings, served }
// GIDA GÜVENCESİ: planFeast bağışı, kasabanın besin değeri kişi başı FEAST.minPerCapita'nın altına inmeyecek biçimde sınırlar.
import { FEAST, TIERS } from '../data/feast.js';
import { RESOURCES } from '../data/resources.js';
import { foodSupply } from './TownStatus.js';

const unit = (key) => RESOURCES[key].foodValue;

export function planFeast(state) {
  const pop = state.characters.filter((c) => !c.role).length;
  const empty = { tier: 'symbolic', contributions: { food: 0, bread: 0, sherbet: 0, cloth: 0 }, servings: Math.max(1, pop) };
  if (pop <= 0) return empty;
  const spare = Math.floor(foodSupply(state) - pop * FEAST.minPerCapita);
  if (spare <= 0) return empty; // kişi başı besin 3'ün altında (ya da tam eşikte): kilerden hiçbir şey ayrılmaz
  const res = state.resources;
  const lux = (res.sherbet ?? 0) >= FEAST.rich.minSherbet && (res.cloth ?? 0) >= FEAST.rich.minCloth;
  const target = pop * (lux ? FEAST.perResident.rich : FEAST.perResident.modest);
  const budget = Math.min(target, spare);
  const bread = Math.min(res.bread ?? 0, Math.floor((budget * FEAST.breadShare) / unit('bread')));
  const food = Math.min(res.food ?? 0, Math.floor(budget - bread * unit('bread')));
  const value = bread * unit('bread') + food * unit('food');
  if (value < pop * FEAST.minDonation) return empty;
  const tier = lux ? 'rich' : 'modest';
  const contributions = { food, bread, sherbet: 0, cloth: 0 };
  if (lux) {
    contributions.sherbet = Math.min(res.sherbet, Math.max(1, Math.ceil(pop / FEAST.rich.kegsPer)));
    contributions.cloth = Math.min(res.cloth, FEAST.rich.cloth);
  }
  const servings = Math.max(1, Math.min(pop + (FEAST.extraServings[tier] ?? 0), Math.round(value / unit('food'))));
  return { tier, contributions, servings };
}

/** Bugünkü sofra: { feast, tier, left, total } ya da null. */
export function currentFeastOf(state) {
  const f = state?.currentFeast;
  if (!f || f.day !== state.time.day || !TIERS[f.tier]) return null;
  return { feast: f, tier: f.tier, left: Math.max(0, f.servings - f.served), total: f.servings };
}

export function sanitizeCurrentFeast(raw) {
  if (!raw || typeof raw !== 'object' || !TIERS[raw.tier] || !Number.isFinite(raw.day)) return null;
  const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const c = raw.contributions ?? {};
  const servings = Math.max(1, n(raw.servings));
  return { tier: raw.tier, day: Math.floor(raw.day), contributions: { food: n(c.food), bread: n(c.bread), sherbet: n(c.sherbet), cloth: n(c.cloth) }, servings, served: Math.min(servings, n(raw.served)) };
}
