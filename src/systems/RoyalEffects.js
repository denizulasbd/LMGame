// (32.6a) Kasaba Şöhreti'nin kademe ve Kraliyet Lütfu etkisi işlevleri (SAF; durum yazmaz). Renown.js'ten ayrıldı: TownStatus,
// Justice, RelationshipSystem ve ResearchSystem bu çarpanları Renown.js'ten alınca Renown → Justice / Clubs → RelationshipSystem →
// Renown döngüsü oluşuyordu. Bu modül yalnızca data dosyalarına ve Engines.js'e bağlıdır; Renown.js aynı adlarla yeniden dışa aktarır.
import { RENOWN_LEVELS, RENOWN_RANK, RENOWN_GRANT, ROYAL_EFFECTS } from '../data/renown.js';
import { REPUTATION } from '../data/crown.js';
import { engineOn } from './Engines.js';

/** Geçerli kademe tablosu: renown açıkken dört kademe (en üstte Kraliyet Gözdesi), kapalıyken REPUTATION.levels aynen. */
export function renownLevels() {
  return engineOn('renown') ? RENOWN_LEVELS : REPUTATION.levels;
}

/** Kademenin sırası (Şüpheli 0, Sadık 1, Saygın 2, Gözde 3). */
export function renownRank(levelOrKey) {
  return RENOWN_RANK[typeof levelOrKey === 'string' ? levelOrKey : levelOrKey?.key] ?? 1;
}

export function renownLevelOf(value) {
  const levels = renownLevels();
  return levels.find((l) => value >= l.min) ?? levels[levels.length - 1];
}

/** Kasabanın şu anki itibar sırası. */
export function rankOf(state) {
  return renownRank(renownLevelOf(state.crown?.reputation ?? REPUTATION.start));
}


/** Lütfu açılmış mı (kalıcı)? */
export function royalGranted(state, type) {
  return engineOn('renown') && Boolean(state.renown?.grants?.some((g) => g.key === type));
}


/** Kurulmuş (bitmiş) lütuf yapısı. */
function royalBuilt(state, type) {
  return state.buildings.some((b) => b.functional && b.type === type);
}

/** Kurulduktan sonra itibar Şüpheli'ye düştüyse etkiler zayıflar. */
export function royalWeakened(state) {
  return engineOn('renown') && rankOf(state) < RENOWN_GRANT.weakenedBelowRank;
}

/** Bir çarpan etkisinin bugünkü değeri (1 = etkisiz): kurulu değilse 1, Şüpheli'de sapmanın yarısı. */
function royalMul(state, type, field) {
  if (!engineOn('renown') || !royalBuilt(state, type)) return 1;
  const m = ROYAL_EFFECTS[type][field];
  return royalWeakened(state) ? 1 + (m - 1) * RENOWN_GRANT.weakenedShare : m;
}

/** Barış Çeşmesi: kasaba çapında suç riski çarpanı (Justice.riskFactors → renown). */
export function renownCrimeFactor(state) {
  return royalMul(state, 'peaceFountain', 'crimeRisk');
}

/** Kraliyet Gül Bahçesi: aşk ve evlilik olasılığı çarpanı (RelationshipSystem). */
export function renownRomanceFactor(state) {
  return royalMul(state, 'royalRoseGarden', 'romance');
}

/** Kraliyet Arşivi: araştırma ve yazıt çözme hızı çarpanı (ResearchSystem.work). */
export function renownResearchFactor(state) {
  return royalMul(state, 'royalArchive', 'research');
}

/** Kraliyet Gül Bahçesi: refah puanı (TownStatus.townHappinessBonus; Şüpheli'de yarısı). */
export function renownHappiness(state) {
  if (!engineOn('renown') || !royalBuilt(state, 'royalRoseGarden')) return 0;
  const h = ROYAL_EFFECTS.royalRoseGarden.happiness;
  return royalWeakened(state) ? h * RENOWN_GRANT.weakenedShare : h;
}
