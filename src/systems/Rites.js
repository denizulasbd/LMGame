// (29.7) Anma Töreni ve özel günlerin saf hesapları: boş / kayıttan durum, tören yeri ve saati, katılım ölçütü, en yakın kişiler,
// doğum günü / evlilik yıl dönümü tespiti, "aynı toplulukta" denetimi. Durum değiştirmez, rastgelelik kullanmaz.
import { RITE_RULES as R, SPECIAL_RULES as S, RITE_VENUES } from '../data/rites.js';
import { AGING } from '../data/lifeStages.js';
import { CALENDAR } from '../data/seasons.js';
import { ACTIVITIES } from '../data/activities.js';
import { getFriendship, arePartners } from './RelationshipSystem.js';
import { hasTag } from './Chemistry.js';
import { getMoodlet } from './Moodlets.js';
import { STORY_MAX } from './LifeStory.js';

const COUNT = (n) => Math.max(0, Math.floor(Number(n) || 0));
const ID = (n) => (Number.isFinite(n) ? n : null);
const IDS = (list) => (Array.isArray(list) ? [...new Set(list.filter(Number.isFinite))] : []);
const NAME = (s) => (typeof s === 'string' ? s.slice(0, 40) : null);
// (29.9) isteğe bağlı Yaşam Öyküsü (kitabe): en çok STORY_MAX karakter; yoksa alan hiç yazılmaz (eski kayıt birebir aynı kalır)
const withStory = (out, raw) => {
  if (typeof raw?.story === 'string' && raw.story.trim()) out.story = raw.story.slice(0, STORY_MAX);
  return out;
};

export function emptyRites() {
  return { pending: [], active: null, names: [], held: 0, condolences: 0, celebrated: 0, forgotten: 0 };
}

/** Kayıttaki tören durumu: bozuk kayıtlar atılır, kimlikler sayılar, kitabe en çok namesMax. */
export function restoreRites(data) {
  const out = emptyRites();
  if (!data || typeof data !== 'object') return out;
  for (const k of ['held', 'condolences', 'celebrated', 'forgotten']) out[k] = COUNT(data[k]);
  const dead = (x) => withStory({ name: NAME(x.name), day: COUNT(x.day), age: COUNT(x.age), id: ID(x.id), friends: IDS(x.friends), closestId: ID(x.closestId) }, x);
  out.pending = (Array.isArray(data.pending) ? data.pending : []).filter((x) => x && NAME(x.name) && Number.isFinite(x.day)).map(dead).slice(-R.namesMax);
  out.names = (Array.isArray(data.names) ? data.names : []).filter((x) => x && NAME(x.name)).map((x) => withStory({ name: NAME(x.name), day: COUNT(x.day), age: COUNT(x.age) }, x)).slice(-R.namesMax);
  const a = data.active;
  if (a && typeof a === 'object' && Number.isFinite(a.day) && Array.isArray(a.names)) {
    out.active = {
      names: a.names.map(NAME).filter(Boolean),
      day: COUNT(a.day),
      place: ID(a.place),
      condolence: Boolean(a.condolence),
      attendees: IDS(a.attendees),
      ids: IDS(a.ids),
      dead: (Array.isArray(a.dead) ? a.dead : []).filter((x) => x && NAME(x.name)).map(dead),
    };
    if (!out.active.names.length) out.active = null;
  }
  return out;
}

/** Kopuk kimlikleri temizler (yükleme sonrası): yaşayanlar kümesi. */
export function pruneRites(rites, alive) {
  if (!rites) return;
  for (const p of rites.pending) {
    p.friends = p.friends.filter((id) => alive.has(id));
    if (!alive.has(p.closestId)) p.closestId = null;
  }
  const a = rites.active;
  if (a) {
    a.attendees = a.attendees.filter((id) => alive.has(id));
    a.ids = a.ids.filter((id) => alive.has(id));
    for (const d of a.dead) {
      d.friends = d.friends.filter((id) => alive.has(id));
      if (!alive.has(d.closestId)) d.closestId = null;
    }
  }
}

/** Tören yeri: tamamlanmış anıt varsa anıt, yoksa meydan havuzu (en küçük kimlik). */
export function riteVenue(state) {
  for (const type of RITE_VENUES) {
    const b = state.buildings.filter((x) => x.type === type && x.functional).sort((x, y) => x.id - y.id)[0];
    if (b) return b;
  }
  return null;
}

const dayStart = (day) => (day - 1) * 1440; // GameState.totalMinutes ile aynı ölçek

/** Törenin başlangıç / bitiş dakikası (state.totalMinutes cinsinden). */
export function riteWindow(state, rite = state.rites?.active) {
  if (!rite) return null;
  const base = dayStart(rite.day);
  return { prep: base + R.prepHour * 60, start: base + R.startHour * 60, end: base + R.endHour * 60 };
}

/** Tören şu an sürüyor mu (18:00-19:00)? */
export function isMemorialTime(state) {
  const w = riteWindow(state);
  return Boolean(w) && state.totalMinutes >= w.start && state.totalMinutes < w.end;
}

/** Sakin törene çağrılı mı (ölen için yas tutan ya da ölenle ilişkisi ≥ friendMin olan yetişkin)? */
export function memorialEligible(state, c) {
  const a = state.rites?.active;
  if (!a || !c || c.isChild || c.role || c.away || c.emigrating) return false;
  if (a.ids.includes(c.id)) return true;
  const m = getMoodlet(c, 'mourning');
  return Boolean(m) && a.dead.some((d) => d.id === m.whoId);
}

/** Acil ihtiyacı var mı (açlık, hastalık, bitkinlik)? */
export function urgentNeed(c) {
  return Boolean(c.illness) || c.needs.hunger < R.minHunger || c.needs.energy < R.minEnergy;
}

const parentIdsOf = (c) => [...new Set([...(c.parentIds ?? []), ...(c.parents ?? [])])];
const childIdsOf = (state, c) => state.characters.filter((o) => parentIdsOf(o).includes(c.id)).map((o) => o.id);

/** Ölenin en yakını: eş -> evlat -> ruh ikizi -> en yüksek ilişki puanı (eşitlikte küçük kimlik). Kimlik ya da null. */
export function closestToDead(state, dead) {
  const people = state.characters.filter((o) => o !== dead && !o.role);
  const partner = people.find((o) => o.id === dead.partnerId);
  if (partner) return partner.id;
  const kids = childIdsOf(state, dead).filter((id) => people.some((o) => o.id === id)).sort((x, y) => x - y);
  if (kids.length) return kids[0];
  const kindred = people.filter((o) => hasTag(o, dead.id, 'kindred') || hasTag(dead, o.id, 'kindred')).sort((x, y) => x.id - y.id)[0];
  if (kindred) return kindred.id;
  let best = null;
  for (const o of people) {
    const score = getFriendship(state, o, dead);
    if (score > 0 && (!best || score > best.score || (score === best.score && o.id < best.o.id))) best = { o, score };
  }
  return best?.o.id ?? null;
}

/** Ölenle ilişkisi friendMin ve üstünde olan yetişkinler. */
export function friendsOfDead(state, dead) {
  return state.characters.filter((o) => o !== dead && !o.role && !o.isChild && getFriendship(state, o, dead) >= R.friendMin).map((o) => o.id);
}

// ---------------------------------------------------------------------------------------------------------------------
// Özel günler

/**
 * Bugün doğum günü mü? Gün dönümünde yaş aldı ve bu, takvim yılı penceresindeki (CALENDAR.daysPerYear gün) ilk yaş alışı: kutlama
 * yılda birdir. (30.4a) Her mevsim bir yaş alınır (4 günde bir); eskiden bir yaş = bir takvim yılıydı, kural aynı sonucu verir.
 */
export function isBirthday(c) {
  if (!Number.isFinite(c?.ageInDays) || !((c.agedDays ?? 0) > 0) || !(c.ageInDays > 0)) return false;
  return c.ageInDays % AGING.daysPerAge === 0 && c.ageInDays % CALENDAR.daysPerYear < AGING.daysPerAge;
}

/** (30.4a) Bir sonraki doğum günü kutlamasına kalan gün (1..). */
export function daysToBirthday(c) {
  const start = Math.max(0, Math.floor(c?.ageInDays ?? 0));
  for (let k = 1; k <= 2 * CALENDAR.daysPerYear + AGING.daysPerAge; k++) {
    const d = start + k;
    if (d % AGING.daysPerAge === 0 && d % CALENDAR.daysPerYear < AGING.daysPerAge) return k;
  }
  return CALENDAR.daysPerYear;
}

/** Bugün evlilik yıl dönümü mü (16 günde bir; eşi hâlâ yanında)? */
export function isAnniversary(c, day) {
  return Number.isFinite(c?.weddingDay) && Boolean(c.married) && day > c.weddingDay && (day - c.weddingDay) % S.yearDays === 0;
}

/** 'birthday' | 'anniversary' | null (ikisi aynı güne düşerse doğum günü). */
export function specialKindOf(c, day) {
  if (!c || c.role) return null;
  if (isBirthday(c)) return 'birthday';
  if (isAnniversary(c, day)) return 'anniversary';
  return null;
}

/**
 * Özel günü birlikte geçirecek yakınlar: yıl dönümünde eşi; doğum gününde en yakın SPECIAL_RULES.closest kişi (eş, ebeveyn,
 * sonra ilişki puanı; eşitlikte küçük kimlik). Kimlik dizisi.
 */
export function specialCompanions(state, c, kind = c?.specialDay?.kind) {
  const alive = (id) => state.characters.some((o) => o.id === id && o !== c && !o.role);
  if (kind === 'anniversary') return alive(c.partnerId) ? [c.partnerId] : [];
  const out = [];
  if (alive(c.partnerId)) out.push(c.partnerId);
  for (const id of parentIdsOf(c).sort((x, y) => x - y)) if (out.length < S.closest && alive(id) && !out.includes(id)) out.push(id);
  if (out.length < S.closest) {
    const ranked = state.characters
      .filter((o) => o !== c && !o.role && !out.includes(o.id))
      .map((o) => ({ id: o.id, score: getFriendship(state, c, o) }))
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score || x.id - y.id);
    for (const x of ranked) if (out.length < S.closest) out.push(x.id);
  }
  return out;
}

/**
 * İkisi şu an aynı toplulukta mı (aynı yerde aynı sohbet / şenlik etkinliğinde)? meals: (yıl dönümü) evde aile yemeği ve handa
 * birlikte yemek / şerbet de sayılır.
 */
export function sameGathering(a, b, meals = false) {
  const t = a?.task;
  const u = b?.task;
  if (!t || !u || t.phase !== 'perform' || u.phase !== 'perform') return false;
  if (t.activity !== u.activity) return false;
  const kind = ACTIVITIES[t.activity]?.kind;
  if (t.activity === 'homeDinner' || t.activity === 'innMeal') return meals && t.buildingId === u.buildingId;
  if (kind !== 'social' && kind !== 'festival') return false;
  return (t.buildingId ?? null) === (u.buildingId ?? null) && (t.buildingId != null || Math.hypot(a.x - b.x, a.y - b.y) <= 48);
}

/** Armağan gönderilebilir mi: { ok, reason }. */
export function giftStatus(state, c) {
  const d = c?.specialDay;
  if (!d || d.day !== state.time.day || state.time.hour >= S.deadlineHour) return { ok: false, reason: 'Bugün onun özel günü değil' };
  if (d.gifted) return { ok: false, reason: 'Bugün armağan gönderildi' };
  if ((state.resources.gold ?? 0) < S.giftCost) return { ok: false, reason: `Hazinede ${S.giftCost} altın yok` };
  return { ok: true, reason: null };
}

/** Taziye Sofrası kurulabilir mi: { ok, reason }. foodSupply: kilerdeki yiyecek değeri. */
export function condolenceStatus(state, foodSupply) {
  const a = state.rites?.active;
  const w = riteWindow(state);
  if (!a || !w || state.totalMinutes < w.prep || state.totalMinutes >= w.end) return { ok: false, reason: 'Bugün anma töreni yok' };
  if (a.condolence) return { ok: false, reason: 'Taziye Sofrası kuruldu' };
  if (foodSupply < R.condolenceCost.food) return { ok: false, reason: `Kilerde ${R.condolenceCost.food} yiyecek değeri yok` };
  if ((state.resources.gold ?? 0) < R.condolenceCost.gold) return { ok: false, reason: `Hazinede ${R.condolenceCost.gold} altın yok` };
  return { ok: true, reason: null };
}

/** Wants.recomputeDrive: özel gün nedeniyle aranan kişiler (kaydedilmez; RiteSystem kurar). */
export function specialSeekIds(c) {
  return Array.isArray(c?.specialSeek) ? c.specialSeek : [];
}

export { arePartners };
