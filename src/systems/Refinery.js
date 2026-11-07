// (24.2) Katma değerli üretimin saf hesapları (durum değiştirmez). Sayılar data/refinery.js'te.
//   isLuxuryWork(type)       : yapı lüks / ticaret fazlası iş mi (Dokuma Tezgâhı, Şerbethane)
//   luxuryHungry(state)      : kasaba aç mı (kişi başı besin eşik altında): lüks atölyeler boşta kalır
//   garmentProtection(c)     : çantasında Dayanıklı Giysi olan sakinin ek soğuk koruması
//   clothWelfare(state)      : dokunan kumaşın kasaba refahına kalıcı katkısı
//   hasPalate(c, now)        : sakinin "Keyifli Damak" morali sürüyor mu
//   palateUntil(totalMinutes): şerbet içilen andan sonraki günün untilHour'u (oyun dakikası)
import { BUILDINGS } from '../data/buildings.js';
import { LUXURY_WORK, GARMENT, CLOTH_WELFARE, INN_SHERBET } from '../data/refinery.js';
import { foodSupply } from './TownStatus.js';

export function isLuxuryWork(type) {
  return Boolean(BUILDINGS[type]?.luxury);
}

export function luxuryHungry(state) {
  const pop = state.characters.length;
  return pop > 0 && foodSupply(state) < pop * LUXURY_WORK.hungryPerCapita;
}

export function garmentProtection(c) {
  return (c.inventory ?? []).some((s) => s.kind === 'garment' && s.qty > 0) ? GARMENT.coldProtection : 0;
}

export function clothWelfare(state) {
  const woven = state.stats?.goods?.cloth ?? 0;
  return Math.min(CLOTH_WELFARE.max, Math.floor(woven / CLOTH_WELFARE.per));
}

export function hasPalate(c, now) {
  return (c.buffs?.merryPalate ?? -1) > now;
}

export function palateUntil(totalMinutes) {
  const day = Math.floor(totalMinutes / 1440);
  return (day + 1) * 1440 + INN_SHERBET.palate.untilHour * 60;
}
