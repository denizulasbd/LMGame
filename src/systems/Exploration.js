// (16. aşama) Keşfin saf hesapları: kafile seçimi, maceradaki risk (meslek ve ekipmana göre), sefer düzenleme
// durumu, egzotik ganimetler ve kadim imar şemalarının etkileri. Sistemler (ExpeditionSystem, DilemmaSystem,
// StructureSystem, CraftingSystem, BehaviorSystem, EventSystem, ResearchSystem) ve arayüz yalnızca GameState'i okuyarak
// bunları kullanır. Kurallar src/data/exploration.js'te.
//
// Durum state.exploration'dadır (kayda girer):
//   { items: { vineSeed, ancientTorch, relicShard }, cityMap, inscriptions: { id: { status: 'found' | 'decoding' |
//     'decoded', source, day } }, decoding: { id, progress } | null, expeditions, lastLaunchDay, ironCredit, log: [...] }
// Süren sefer state.dilemma.expedition'dadır (11. aşamadan beri): { members, until, size, startedAt, source,
//   adventures, next, nextAt, log, loot, finds, hurt, spirit, route }
import { EXPLORATION, INSCRIPTIONS, ruleTitle } from '../data/exploration.js';
import { skillLevel } from './SkillSystem.js';

export function emptyExploration() {
  return {
    items: { vineSeed: 0, ancientTorch: 0, relicShard: 0 },
    cityMap: false,
    inscriptions: {},
    decoding: null,
    expeditions: 0,
    lastLaunchDay: -99,
    ironCredit: 0,
    log: [],
  };
}

/** Sefere gidebilecek sakinler: yetişkin, kasabada, sağlıklı, yeni gelmemiş, ziyaretçi değil. */
export function idleAdults(characters) {
  return characters.filter((c) => !c.isChild && !c.away && !c.illness && !c.newcomer && !c.role);
}

const ADVENTURE_SKILLS = ['mining', 'masonry', 'scholarship', 'woodcutting', 'building', 'herbalism', 'fishing'];

/**
 * Düzenlenen seferin kafilesi: maceralarda işe yarayacak ustalar (madenci, bilge, oduncu, şifacı...) ve Sağlam
 * Aletliler önce; eşit olanlardan sabit işçiler (oyuncunun iş yerine bağladıkları) kasabada kalır.
 */
export function pickParty(characters, count) {
  const score = (c) => {
    let best = 0;
    for (const skill of ADVENTURE_SKILLS) best = Math.max(best, skillLevel(c, skill).level);
    return best * 2 + (c.equipment?.tool === 'sturdyTool' ? 1 : 0) - (c.workplaceId !== null ? 1.5 : 0);
  };
  return [...idleAdults(characters)].sort((a, b) => score(b) - score(a) || a.id - b.id).slice(0, count);
}

/** Kural kafiledeki biri tarafından karşılanıyor mu? Karşılayan sakini döndürür. */
function memberFor(members, rule) {
  return members.find((c) => skillLevel(c, rule.skill).level >= rule.level && (!rule.tool || c.equipment?.tool === 'sturdyTool')) ?? null;
}

/**
 * Bir macera seçeneğinin bu kafileyle riski: { chance, base, safeBy: { name, text } | null, eased: [metin] }.
 * safeWith kuralını karşılayan biri varsa risk sıfırdır; easeWith kuralları riski çarpar.
 */
export function optionRisk(members, option) {
  const base = option.risk?.chance ?? 0;
  if (base <= 0) return { chance: 0, base: 0, safeBy: null, eased: [] };
  for (const rule of option.safeWith ?? []) {
    const who = memberFor(members, rule);
    if (who) return { chance: 0, base, safeBy: { name: who.name, text: rule.text ?? ruleTitle(rule) }, eased: [] };
  }
  let chance = base;
  const eased = [];
  for (const rule of option.easeWith ?? []) {
    const who = memberFor(members, rule);
    if (!who) continue;
    chance *= rule.factor;
    eased.push(`${who.name} (${ruleTitle(rule)})`);
  }
  return { chance, base, safeBy: null, eased };
}

/** Seçeneğin pencerede görünen açıklaması: ganimet + bu kafileyle risk. */
export function describeOption(members, option) {
  const r = optionRisk(members, option);
  if (r.base <= 0) return option.detail;
  if (r.safeBy) return `${option.detail} · Risk yok: ${r.safeBy.name} (${r.safeBy.text})`;
  const pct = Math.round(r.chance * 100);
  const eased = r.eased.length ? ` (%${Math.round(r.base * 100)}'den ${r.eased.join(', ')} sayesinde)` : '';
  return `${option.detail} · Kaza riski %${pct}${eased}`;
}

/** Liman ya da Belediye Konağı'ndan sefer düzenlenebilir mi? { ok, reason } */
export function expeditionLaunchStatus(state, source) {
  const ok = (type) => state.buildings.some((b) => b.type === type && b.functional && !b.damaged);
  if (source !== 'harbor' && source !== 'townHall') return { ok: false, reason: 'Sefer Liman ya da Belediye Konağı\'ndan düzenlenir' };
  if (!ok(source)) return { ok: false, reason: source === 'harbor' ? 'Önce Büyük Ticaret Limanı tamamlanmalı' : 'Önce Belediye Konağı tamamlanmalı' };
  if (state.dilemma?.expedition) return { ok: false, reason: 'Bir keşif kafilesi zaten yolda' };
  if (state.dilemma?.active) return { ok: false, reason: 'Önce açık karar penceresi sonuçlanmalı' };
  const ex = state.exploration ?? emptyExploration();
  const wait = EXPLORATION.cooldownDays - (state.time.day - ex.lastLaunchDay);
  if (wait > 0) return { ok: false, reason: `Kafile dinleniyor: ${wait} gün sonra yeniden yola çıkabilir` };
  for (const [r, v] of Object.entries(EXPLORATION.cost)) {
    if ((state.resources[r] ?? 0) < v) return { ok: false, reason: `Erzak yetmiyor (${v} yiyecek gerekir)` };
  }
  if (idleAdults(state.characters).length < EXPLORATION.partySize + 2) return { ok: false, reason: `Sefer için ${EXPLORATION.partySize} sağlıklı yetişkin gerekir (kasabada da birkaç kişi kalmalı)` };
  return { ok: true, reason: null };
}

// ---------------------------------------------------------------------------
// Kadim yazıtlar ve imar şemaları
// ---------------------------------------------------------------------------

export function inscriptionStatus(state, id) {
  return state.exploration?.inscriptions?.[id]?.status ?? null;
}

export function hasScheme(state, id) {
  return inscriptionStatus(state, id) === 'decoded';
}

/** Antik Su Kemeri Şeması: bahçelerin verim çarpanı. */
export function schemeGardenMultiplier(state) {
  return hasScheme(state, 'aqueduct') ? INSCRIPTIONS.aqueduct.effect.gardenYield : 1;
}

/** Kadim Çelik Döküm Tekniği: atölyede demirden tasarruf oranı (0-1). */
export function schemeIronSaving(state) {
  return hasScheme(state, 'steelCasting') ? INSCRIPTIONS.steelCasting.effect.ironSaving : 0;
}

/** Kadim Değirmen Taşı: fırının ekmek çıkarma hızı çarpanı. */
export function schemeBakeMultiplier(state) {
  return hasScheme(state, 'millstone') ? INSCRIPTIONS.millstone.effect.bakeSpeed : 1;
}

/** Yazıt çözülebilir mi? { ok, reason } */
export function decodeStatus(state, id) {
  const status = inscriptionStatus(state, id);
  if (!INSCRIPTIONS[id] || !status) return { ok: false, reason: 'Bu yazıt henüz bulunmadı' };
  if (status === 'decoded') return { ok: false, reason: 'Çözüldü', done: true };
  if (status === 'decoding') return { ok: false, reason: 'Çözülüyor', active: true };
  if (state.exploration.decoding) return { ok: false, reason: 'Bilge başka bir yazıtla uğraşıyor' };
  if (!state.buildings.some((b) => b.definition.academy && b.functional && !b.damaged)) return { ok: false, reason: 'Önce Bilgelik Evi tamamlanmalı' };
  return { ok: true, reason: null };
}

/** Kayıp Şehir Haritası: gezgin tüccarın iki ziyareti arası gün çarpanı. */
export function merchantIntervalMultiplier(state) {
  return state.exploration?.cityMap ? 0.5 : 1;
}

/** Dikilmeyi bekleyen egzotik eşya sayısı (fide / meşale). */
export function itemCount(state, item) {
  return state.exploration?.items?.[item] ?? 0;
}
