// (31. aşama) Kasaba Süsleri: saf yardımcılar (zar çekmez, durum değiştirmez). Kurallar data/townDecor.js, sistem TownDecorSystem.js.
import { NOTICE_BOARD, WOODPILE, SCARECROW, BANDSTAND, HERO_STATUE } from '../data/townDecor.js';
import { BUILDINGS } from '../data/buildings.js';
import { DECREES } from '../data/crown.js';
import { RESOURCES } from '../data/resources.js';
import { TOWN_BUFFS } from '../data/town.js';
import { SKILL_KEYS } from '../data/skills.js';
import { engineOn } from './Engines.js';
import { courtOf } from './Justice.js'; // (32.2)
import { CRIMES } from '../data/justice.js';
import { getSeason } from '../data/seasons.js';

const usable = (state, type) => state.buildings.filter((b) => b.type === type && b.functional);
const center = (b) => {
  const { w, h } = BUILDINGS[b.type].size;
  return { x: b.tileX + w / 2, y: b.tileY + h / 2 };
};
/** İki yapının ayak izleri arasındaki karo uzaklığı (Chebyshev; bitişik = 1, üst üste = 0). */
function footprintGap(a, b) {
  const sa = BUILDINGS[a.type].size;
  const sb = BUILDINGS[b.type].size;
  const dx = Math.max(a.tileX - (b.tileX + sb.w - 1), 0, b.tileX - (a.tileX + sa.w - 1));
  const dy = Math.max(a.tileY - (b.tileY + sb.h - 1), 0, b.tileY - (a.tileY + sa.h - 1));
  return Math.max(dx, dy);
}
const hoursText = (minutes) => {
  const h = Math.max(0, Math.ceil(minutes / 60));
  return h >= 24 ? `${Math.floor(h / 24)} gün ${h % 24} sa` : `${h} sa`;
};

// ---------------------------------------------------------------------------
// İlan Tahtası
// ---------------------------------------------------------------------------

export const hasNoticeBoard = (state) => engineOn('townDecor') && usable(state, 'noticeBoard').length > 0;

/**
 * Kasabanın açık işleri (en acil önce). Her öğe: { key, icon, title, text, left, target }
 *   target: { character: id } | { hall: true } | null  (panel tıklanınca ne seçileceği)
 */
export function noticeItems(state) {
  const now = state.totalMinutes;
  const items = [];
  const revolt = state.trust?.revolt;
  if (revolt) items.push({ key: 'revolt', icon: 'torch', title: 'İsyan sürüyor', text: 'Halk meydanda. Erzak ya da altın dağıtmak güveni toparlar.', left: null, urgent: true, target: { hall: true } });
  const raid = state.crisis?.raid;
  if (raid) items.push({ key: 'raid', icon: 'shield', title: 'Haydut izleri', text: 'Baskın yaklaşıyor: bekçilerle püskürt, haraç öde ya da hazırlıksız yakalan.', left: hoursText(raid.arriveAt - now), urgent: true, target: { hall: true } });
  const notice = state.crown?.notice;
  if (notice) {
    const gold = state.resources.gold ?? 0;
    items.push({
      key: 'levy',
      icon: 'collector',
      title: `Kraliyet tahsildarı: ${notice.amount} altın`,
      text: gold >= notice.amount ? 'Hazine yetiyor: vakti gelince ödenecek.' : `Hazinede ${gold} altın var. Ödenemezse Krallık el koyar ve Kraliyet Cezası gelir.`,
      left: hoursText(notice.at - now),
      urgent: gold < notice.amount,
      target: { hall: true },
    });
  }
  const decree = state.crown?.decree;
  if (decree) {
    const def = DECREES[decree.kind];
    const need = decree.need && typeof decree.need === 'object' ? Object.entries(decree.need).map(([r, v]) => `${v} ${RESOURCES[r]?.name ?? r}`).join(', ') : '';
    items.push({ key: `decree:${decree.id}`, icon: 'decree', title: `Kraliyet Fermanı: ${def?.name ?? 'ferman'}`, text: def?.text ?? '', need, left: hoursText(decree.deadline - now), urgent: false, target: { hall: true }, royal: true });
  }
  const penaltyUntil = state.buffs?.royalPenalty;
  if (Number.isFinite(penaltyUntil) && penaltyUntil > now) {
    items.push({ key: 'penalty', icon: 'collector', title: TOWN_BUFFS.royalPenalty.name, text: `Krallık Vergisi ödenemedi: kasaba refahı ${TOWN_BUFFS.royalPenalty.happiness}. Süre dolunca kalkar.`, left: hoursText(penaltyUntil - now), urgent: false, target: { hall: true } });
  }
  const petitions = (state.petitions?.list ?? []).filter((p) => p.status === 'open' || p.status === 'accepted');
  petitions.sort((a, b) => a.deadline - b.deadline || a.id - b.id);
  for (const p of petitions) {
    items.push({ key: `petition:${p.id}`, icon: 'scroll', title: `Dilekçe · ${p.name}`, text: p.text, left: hoursText(p.deadline - now), urgent: p.deadline - now < 6 * 60, target: { character: p.characterId }, noticed: Boolean(p.noticed) });
  }
  // (32.2) Adalet Sarayı'nın açık davaları (en acil önce; tıklayınca dava dosyası açılır)
  if (courtOf(state)) {
    const cases = (state.justice?.cases ?? []).filter((k) => k.court).sort((a, b) => a.deadline - b.deadline || a.id - b.id);
    for (const k of cases) items.push({ key: `case:${k.id}`, icon: 'scales', title: `Dava · ${k.offenderName}`, text: `${CRIMES[k.crime]?.name ?? 'Suç'}: Adalet Sarayı'nda kararını bekliyor.`, left: hoursText(k.deadline - now), urgent: k.deadline - now < 12 * 60, target: { case: k.id } });
  }
  const taxAt = state.tax?.nextAt;
  if (Number.isFinite(taxAt) && taxAt > now) items.push({ key: 'tax', icon: 'coin', title: 'İç vergi tahsilatı', text: 'Sakinlerin kesesinden kademeye göre vergi alınır.', left: hoursText(taxAt - now), urgent: false, target: { hall: true } });
  return items;
}

/** Tahtadaki kâğıt sayısı (vergi takvimi sayılmaz) ve mühürlü ferman. */
export function noticeLook(state) {
  const items = noticeItems(state).filter((i) => i.key !== 'tax');
  return { notes: Math.min(NOTICE_BOARD.maxNotes, items.filter((i) => !i.royal).length), royal: items.some((i) => i.royal) };
}

// ---------------------------------------------------------------------------
// Odun Yığını
// ---------------------------------------------------------------------------

/** Odun yığınlarının oduna eklediği depo kapasitesi. */
export function woodStoreCapacity(state) {
  if (!engineOn('townDecor')) return 0;
  return usable(state, 'woodpile').length * WOODPILE.capacity;
}

/** Odun yığınının görünen dolulukları (0-3): kasabanın odun stoğunun depo sınırına oranı. */
export function woodpileFill(state) {
  const limit = (state.storageCapacity ?? 0) + (state.woodStoreCapacity ?? 0);
  const ratio = limit > 0 ? (state.resources.wood ?? 0) / limit : 0;
  return WOODPILE.fillSteps.filter((t) => ratio >= t).length;
}

/** Bu evin kış ısınma çarpanı (yakınında Odun Yığını varsa WOODPILE.heatingFactor, yoksa 1). */
export function woodpileHeatingFactor(state, home) {
  if (!engineOn('townDecor')) return 1;
  const c = center(home);
  for (const pile of usable(state, 'woodpile')) {
    const p = center(pile);
    if (Math.hypot(c.x - p.x, c.y - p.y) <= WOODPILE.radius) return WOODPILE.heatingFactor;
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Korkuluk
// ---------------------------------------------------------------------------

/** Bahçenin korkuluk çarpanı: SCARECROW.radius içinde korkuluk varsa 1 + bonus (bahçe başına bir). */
export function scarecrowGardenMultiplier(state, garden) {
  if (!engineOn('townDecor') || garden.type !== 'garden') return 1;
  return usable(state, 'scarecrow').some((s) => footprintGap(garden, s) <= SCARECROW.radius) ? 1 + SCARECROW.gardenBonus : 1;
}

/** Korkuluğun koruduğu bahçeler. */
export function gardensGuarded(state, scarecrow) {
  return usable(state, 'garden').filter((g) => footprintGap(g, scarecrow) <= SCARECROW.radius);
}

/** Korkuluğun görünümü: kolunda karga (gerçek zamanlı döngü, yalnızca görsel) ve sonbahar kıyafeti. */
export function scarecrowLook(state, building, time) {
  const phase = ((time + building.id * 3.7) % SCARECROW.crowSeconds) / SCARECROW.crowSeconds;
  return { crow: phase < 0.45, dressed: getSeason(state.time.day).key === 'autumn' };
}

// ---------------------------------------------------------------------------
// Müzik Köşkü
// ---------------------------------------------------------------------------

export const isConcert = (state) => Boolean(state.rally?.concert) && state.totalMinutes < state.rally.until;

/** Konser verilebilir mi? { ok, reason } */
export function concertStatus(state, building) {
  if (!engineOn('townDecor')) return { ok: false, reason: 'Kapalı' };
  if (!building?.functional) return { ok: false, reason: 'Köşk henüz bitmedi' };
  if (isConcert(state)) return { ok: false, reason: 'Konser sürüyor' };
  if (state.rally && state.totalMinutes < state.rally.until) return { ok: false, reason: 'Sakinler zaten meydanda toplanıyor' };
  const hour = state.time.hour;
  if (hour < BANDSTAND.startHour || hour > BANDSTAND.lastStartHour) return { ok: false, reason: `Konser akşam ${BANDSTAND.startHour}:00 ile ${BANDSTAND.lastStartHour}:59 arasında başlar` };
  const last = building.decor?.concertAt;
  if (Number.isFinite(last)) {
    const wait = last + BANDSTAND.cooldownDays * 1440 - state.totalMinutes;
    if (wait > 0) return { ok: false, reason: `Sıradaki konser ${hoursText(wait)} sonra` };
  }
  if ((state.resources.gold ?? 0) < BANDSTAND.concertGold) return { ok: false, reason: `Yetersiz altın: ${BANDSTAND.concertGold} gerekir` };
  return { ok: true, reason: null };
}

/** Seyyar Ozan kasabada mı (konserde çalar)? */
export const bardInTown = (state) => state.activeGuest?.type === 'bard' && !state.activeGuest.leaving;

/** Sakin köşkü dinliyor mu (merkezden BANDSTAND.radius karo)? */
export function listening(stand, c, tileSize) {
  const m = center(stand);
  return Math.hypot(c.x / tileSize - m.x, c.y / tileSize - m.y) <= BANDSTAND.radius;
}

// ---------------------------------------------------------------------------
// Kahraman Heykeli
// ---------------------------------------------------------------------------

/** Onurlandırılan sakinin en güçlü becerisine göre heykelin pozu. */
export function statuePose(c) {
  if (!c?.skills) return HERO_STATUE.defaultPose;
  let best = null;
  for (const k of SKILL_KEYS) if ((c.skills[k] ?? 0) > 0 && (!best || c.skills[k] > c.skills[best])) best = k;
  return HERO_STATUE.poses[best] ?? HERO_STATUE.defaultPose;
}

/** Heykeli dikilebilecek sakinler: yetişkin, rolsüz, başka heykeli olmayan (en deneyimli önce). */
export function statueCandidates(state) {
  const honored = new Set(state.buildings.map((b) => b.decor?.honoreeId).filter(Number.isFinite));
  const xp = (c) => SKILL_KEYS.reduce((a, k) => a + (c.skills?.[k] ?? 0), 0);
  return state.characters.filter((c) => !c.isChild && !c.role && !honored.has(c.id)).sort((a, b) => xp(b) - xp(a) || a.id - b.id);
}

/** Onurlandırılanın yaşayan yakınları: eş, ebeveynler, çocuklar ve torunlar. */
export function statueKin(state, honoreeId) {
  const kin = new Set();
  const byId = new Map(state.characters.map((c) => [c.id, c]));
  const h = byId.get(honoreeId);
  if (h) {
    if (Number.isFinite(h.partnerId)) kin.add(h.partnerId);
    for (const p of h.parentIds ?? []) kin.add(p);
  }
  for (const c of state.characters) {
    if ((c.parentIds ?? []).includes(honoreeId)) {
      kin.add(c.id);
      for (const g of state.characters) if ((g.parentIds ?? []).includes(c.id)) kin.add(g.id);
    }
  }
  kin.delete(honoreeId);
  return [...kin].map((id) => byId.get(id)).filter(Boolean);
}

/** Heykelin künyesi (onurlandırılan yaşamasa da adı kalır). */
export function statueTitle(building) {
  const d = building.decor;
  return d?.honoreeName ? `${d.honoreeName} Heykeli` : null;
}
