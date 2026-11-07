// (20. aşama) Altın Çağ ve Ulu Saat Kulesi için saf yardımcılar: durum okuma ve çarpanlar. Sistemler (BehaviorSystem,
// TownStatus, CraftingSystem, EventSystem, ResearchSystem) ve arayüz bunları okur; durumu GoldenAgeSystem yazar.
//   state.goldenAge : { since: { day, hour, minute } | null, chimes, celebration, books, lastChime }
//   state.chronicle : { founders, firstCouple, firstMasterwork, towerWork, towerMaster, towerStages, goldenAge }
import { GOLDEN_AGE, TOWER_MASTERY, CLOCK_GEAR } from '../data/goldenAge.js';
import { BUILDINGS } from '../data/buildings.js';

export function emptyGoldenAge() {
  return { since: null, chimes: 0, celebration: null, books: 0, lastChime: null };
}

export function emptyChronicle() {
  return { founders: [], firstCouple: null, firstMasterwork: null, towerWork: {}, towerMaster: null, towerStages: {}, goldenAge: null, firstGen2Couple: null };
}

/** Kasaba Altın Çağ'da mı (Ulu Saat Kulesi tamamlandı)? */
export function isGoldenAge(state) {
  return Boolean(state?.goldenAge?.since);
}

/** Kasabanın Ulu Saat Kulesi (yoksa null). */
export function towerOf(state) {
  return state?.buildings?.find((b) => b.type === 'wonder') ?? null;
}

/** Altın Çağ'ın kalıcı çalışma şevki çarpanı (+%10). */
export function goldenWorkMultiplier(state) {
  return isGoldenAge(state) ? GOLDEN_AGE.workMultiplier : 1;
}

/** Altın Çağ'ın kalıcı refah çarpanı (+%10). */
export function goldenWelfareMultiplier(state) {
  return isGoldenAge(state) ? GOLDEN_AGE.welfareMultiplier : 1;
}

/** Tüccar ziyaretleri arası gün çarpanı: Altın Çağ'da kasabanın şanı yayılır, tüccar daha sık gelir. */
export function goldenMerchantInterval(state) {
  return isGoldenAge(state) ? GOLDEN_AGE.merchantInterval : 1;
}

/** Bilgelik Evi kitaplığındaki antik kitapların araştırma hızı çarpanı. */
export function bookResearchMultiplier(state) {
  const books = Math.min(GOLDEN_AGE.maxBooks, state?.goldenAge?.books ?? 0);
  return 1 + books * GOLDEN_AGE.bookResearch;
}

/** Kulenin şu an inşa edilen aşaması (0 tabanlı; Temel şantiyesi 0) ya da null. */
export function towerStageIndex(building) {
  if (!building?.definition?.wonder) return null;
  if (building.underConstruction) return 0;
  if (building.project?.kind === 'stage') return building.wonderStage;
  return null;
}

/**
 * Ustalık katkısı: kulenin sürmekte olan aşamasının masters mesleklerinden birinde Kalfa olan inşaatçı daha hızlı,
 * Usta olan çok daha hızlı çalışır. levelOf(c, skill) -> { level }.
 */
export function towerMasteryMultiplier(c, building, levelOf) {
  const index = towerStageIndex(building);
  if (index === null) return 1;
  const masters = building.definition.wonder.stages[index]?.masters ?? [];
  let best = 1;
  for (const skill of masters) best = Math.max(best, levelOf(c, skill).level);
  return best >= 3 ? TOWER_MASTERY.master : best === 2 ? TOWER_MASTERY.journeyman : 1;
}

/** Mekanizma & Çan aşaması için daha kaç Kadim Dişli dökülmeli (aşama başlamadıysa ve Gövde bittiyse). */
export function gearsNeeded(state) {
  const tower = towerOf(state);
  if (!tower || tower.underConstruction || tower.project || tower.wonderComplete) return 0;
  const stages = BUILDINGS.wonder.wonder.stages;
  const next = stages[tower.wonderStage];
  const need = next?.cost?.gears ?? 0;
  if (!need || tower.wonderStage < stages.length - 1) return 0;
  return Math.max(0, need - (state.resources.gears ?? 0));
}

/** Kadim Dişli'nin döküm süresi (Usta zanaatkâr daha hızlı). */
export function gearWork(masterLevel) {
  return masterLevel >= 3 ? CLOCK_GEAR.work / CLOCK_GEAR.masterSpeed : CLOCK_GEAR.work;
}

/** Kulenin inşasına katkı (Tarihçe Kütüğü'nün "baş usta"sı için). */
export function recordTowerWork(state, c, amount) {
  if (!state.chronicle || !(amount > 0)) return;
  const work = state.chronicle.towerWork;
  work[c.id] = (work[c.id] ?? 0) + amount;
}

/** Kuleye en çok emek veren sakin: { id, name, work } ya da null. */
export function towerMasterOf(state) {
  const work = state.chronicle?.towerWork ?? {};
  let best = null;
  for (const [id, amount] of Object.entries(work)) {
    if (!best || amount > best.work) best = { id: Number(id), work: amount };
  }
  if (!best) return null;
  const c = state.characters.find((o) => o.id === best.id);
  return { id: best.id, name: c?.name ?? state.chronicle.towerMaster?.name ?? '?', work: Math.round(best.work) };
}
