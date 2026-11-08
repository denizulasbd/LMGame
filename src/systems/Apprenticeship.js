// (25.2) Usta-Çırak sisteminin saf hesapları: meslek, çırak verisinin temizlenmesi, usta seçimi, uygunluk, kapı ve kapasite,
// mezuniyet deneyimi ve kayıttaki sayaçlar. Durum değiştirmez, rastgelelik kullanmaz (ApprenticeshipSystem uygular).
import { PROFESSIONS, APPRENTICE, GRADUATION } from '../data/apprenticeship.js';
import { BUILDINGS } from '../data/buildings.js';
import { foodSupply } from './TownStatus.js';

/** Yapının çıraklık mesleği (zanaat yapısı değilse null). */
export function professionFor(type) {
  return PROFESSIONS[type] ?? null;
}

/** Kayıttan / dışarıdan gelen çıraklık verisi: { masterId, profession, buildingId, progress, since, crafted } ya da null. */
export function sanitizeApprenticeship(data) {
  if (!data || typeof data !== 'object' || !PROFESSIONS[data.profession] || !Number.isFinite(data.buildingId)) return null;
  const progress = Number(data.progress);
  return {
    masterId: Number.isFinite(data.masterId) ? data.masterId : null,
    profession: data.profession,
    buildingId: data.buildingId,
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0,
    since: Number.isFinite(data.since) ? data.since : 0,
    crafted: Math.max(0, Math.floor(Number(data.crafted) || 0)),
  };
}

/** Çırak olabilir mi: Genç, kasabada, köyü terk etmiyor, oyuncunun bir yere sabitlediği biri değil. */
export function canApprentice(c) {
  return Boolean(c) && !c.role && !c.isChild && c.lifeStage === 'youth' && !c.away && !c.emigrating && !c.apprenticeship;
}

/** Usta olabilir mi: yetişkin (ya da gönüllü bilge), kasabada, emekli değil. */
export function canMaster(c) {
  return Boolean(c) && !c.role && !c.isChild && c.lifeStage !== 'youth' && !c.retired && !c.away && !c.emigrating;
}

/**
 * Yapının ustası: o yapıya sabitlenmiş ya da orada çalışan yetişkinlerden mesleğin deneyimi en yüksek olan; yoksa kasabada o
 * meslekte en deneyimli yetişkin. Eşitlikte küçük kimlik. Kimse yoksa null.
 */
export function pickMaster(state, building) {
  const prof = professionFor(building?.type);
  if (!prof) return null;
  const xp = (c) => c.skills?.[prof.skill] ?? 0;
  const better = (a, b) => (xp(b) > xp(a) || (xp(b) === xp(a) && b.id < a.id) ? b : a);
  const pool = state.characters.filter(canMaster);
  const local = pool.filter((c) => c.workplaceId === building.id || building.workerIds?.has(c.id));
  if (local.length) return local.reduce(better);
  const skilled = pool.filter((c) => xp(c) > 0);
  return skilled.length ? skilled.reduce(better) : null;
}

/** Bu ustanın çırakları. */
export function apprenticesOf(state, master) {
  return master ? state.characters.filter((c) => c.apprenticeship && c.apprenticeship.masterId === master.id) : [];
}

/** Yapıdaki çıraklar. */
export function apprenticesAt(state, building) {
  return building ? state.characters.filter((c) => c.apprenticeship && c.apprenticeship.buildingId === building.id) : [];
}

/** Yapının çırak kontenjanı (Seviye 2 yapıda bir fazla). */
export function apprenticeSlots(building) {
  return APPRENTICE.perBuilding + (building?.upgraded ? 1 : 0);
}

/** (27.2) Yapı çırağa güvenli mi: tamamlanmış, hasarsız ve yanmıyor. */
export function safeForApprentice(building) {
  return Boolean(building) && building.functional && !building.damaged && !building.isDamaged && !building.isBurning;
}

/** Yapı çırak alabilir mi (zanaat yapısı, tamamlanmış, hasarsız / yanmıyor, kontenjanı dolmamış). */
export function acceptsApprentice(state, building) {
  if (!building || !professionFor(building.type) || !safeForApprentice(building)) return false;
  return apprenticesAt(state, building).length < apprenticeSlots(building);
}

/** Oyuncunun "Çırak Kapısı"nı açtığı yapı mı (boştaki gençler sabah kendiliğinden yazılır)? */
export function doorOpen(state, building) {
  return Boolean(building) && (state.apprenticeship?.open ?? []).includes(building.id);
}

/** Kasaba çırakları işten alabilecek durumda mı: gıda ve çekirdek iş gücü güvende. */
export function townCanSpare(state) {
  const pop = state.characters.filter((c) => !c.role).length || 1;
  const workers = state.characters.filter((c) => !c.role && !c.isChild && c.lifeStage !== 'youth' && !c.retired && !c.away && !c.emigrating).length;
  return foodSupply(state) / pop >= APPRENTICE.minFoodPerCapita && workers >= APPRENTICE.minCoreAdults;
}

/** Mezuniyette o meslekte başlanacak deneyim (dakika) ve unvan. */
export function graduationFor(progress) {
  if (progress >= GRADUATION.master) return { xp: GRADUATION.masterXp, title: 'Yetkin Usta' };
  if (progress >= GRADUATION.journeyman) return { xp: GRADUATION.journeymanXp, title: 'Kıdemli Kalfa' };
  return { xp: Math.round(progress * GRADUATION.partialXpPerPercent), title: null };
}

/** Kayıttaki çıraklık durumu: açık kapılar ve sayaçlar. */
export function emptyApprenticeshipState() {
  return { open: [], enrolled: 0, graduated: 0, masters: 0, crafted: 0, sold: 0, coins: 0, minutes: 0 };
}

export function restoreApprenticeshipState(data, buildings = []) {
  const out = emptyApprenticeshipState();
  if (!data || typeof data !== 'object') return out;
  const valid = new Set(buildings.filter((b) => b && PROFESSIONS[b.type]).map((b) => b.id));
  out.open = [...new Set(Array.isArray(data.open) ? data.open : [])].filter((id) => valid.has(id));
  for (const key of ['enrolled', 'graduated', 'masters', 'crafted', 'sold', 'coins']) out[key] = Math.max(0, Math.floor(Number(data[key]) || 0));
  out.minutes = Number.isFinite(Number(data.minutes)) ? Math.max(0, Number(data.minutes)) : 0;
  return out;
}

/** Zanaat yapısı tanımı (arayüz için). */
export function isCraftBuilding(type) {
  return Boolean(PROFESSIONS[type]) && Boolean(BUILDINGS[type]);
}
