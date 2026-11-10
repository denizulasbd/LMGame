// (28.4) Geç Oyun Beklentisi'nin saf hesapları (durum değiştirmez). Sayılar data/lateGame.js'te.
//   lateGameActive(state)      : kasaba Gelişmiş Şehir (seviye 4) ya da Altın Çağ'da mı
//   lateDecayMultiplier(state) : Keyif / Sosyallik azalma çarpanı (aktifken 1,3; değilse 1)
//   luxuryChecks(state)        : { sherbet, cloth, hotMeal } kalemleri şu an karşılanıyor mu
//   lateDiscontent(state)      : refahtan düşen puan (eksik lüks sayısı x perMissing; aktif değilse 0)
import { LATE_GAME, LATE_GAME_KEYS } from '../data/lateGame.js';
import { isGoldenAge } from './GoldenAge.js';

export function lateGameActive(state) {
  return (state.town?.tier ?? 1) >= LATE_GAME.minTier || isGoldenAge(state);
}

/** Keyif ve Sosyallik ihtiyaçlarının azalma çarpanı. */
export function lateDecayMultiplier(state) {
  return lateGameActive(state) ? LATE_GAME.decay : 1;
}

export function luxuryChecks(state) {
  const inns = state.buildings.filter((b) => b.type === 'inn' && b.functional);
  return {
    sherbet: (state.resources.sherbet ?? 0) >= 1 || inns.some((b) => (b.sherbet ?? 0) >= 1),
    cloth: (state.resources.cloth ?? 0) >= 1 || state.characters.some((c) => (c.inventory ?? []).some((s) => s.kind === 'garment' && s.qty > 0)),
    hotMeal: inns.some((b) => (b.meals ?? 0) >= 1),
  };
}

export function missingLuxuries(state) {
  const checks = luxuryChecks(state);
  return LATE_GAME_KEYS.filter((k) => !checks[k]);
}

export function lateDiscontent(state) {
  return lateGameActive(state) ? missingLuxuries(state).length * LATE_GAME.perMissing : 0;
}
