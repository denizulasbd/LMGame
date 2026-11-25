// (32.5) Hobi Evleri ve Kulüpler: SAF hesaplar (durum yazmaz, zar çekmez). Sayılar data/clubs.js, durum systems/ClubSystem.js.
//   clubBuilding / clubBuildings : kasabanın işleyen hobi evi (şalter kapalıyken null / boş)
//   canJoin / clubAffinity       : üyelik koşulu ve yakınlık puanı (özellik, huy, beceri, iş yeri, dost çekimi, zıt eğilim) + nedenler
//   membersOf / candidatesFor    : üyeler (kimlik sırası) ve sıradaki adaylar (puan sırası, eşitlikte kimlik)
//   isSessionDay / sessionWindow / nextSession : takvim (tek / çift gün, kaydırmalı saatler)
//   sessionSpots                 : kulüp evinin önündeki / yanındaki buluşma karoları (önce ön sıra)
//   clubCrimeFactor / renownClubShare / clubPoverty : öteki sistemlerin kancaları
//   giftOrder                    : Nakışlı Mendil / Dayanıklı Giysi alıcısının sırası (zarsız)
// Character.js bu dosyanın yalnızca sanitizeClub işlevini, Justice.js ve Renown.js faktör işlevlerini çağırır.
import { CLUB_BELL } from '../data/clubs.js';
import { ACTIVITIES } from '../data/activities.js';
import { CLUB, CLUB_KEYS, CLUBS, CLUB_SCHEDULE, CLUB_AFFINITY, AFFINITY_RULES as AR, CLUB_CRIME, CLUB_RENOWN, HANDKERCHIEF, PAINTING_TITLES, CLUB_TEXT } from '../data/clubs.js';
import { BUILDINGS } from '../data/buildings.js';
import { TRAITS } from '../data/characters.js';
import { QUIRKS } from '../data/social.js';
import { SKILLS } from '../data/skills.js';
import { levelFor } from './SkillSystem.js';
import { getFriendship, levelIndexFor } from './Friendship.js'; // (32.6a) döngüsüz modül
import { RELATIONSHIP_LEVELS } from '../data/relationships.js';
import { engineOn } from './Engines.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const round2 = (v) => Math.round(v * 100) / 100;

export const isClubKey = (k) => CLUB_KEYS.includes(k);
export const clubName = (k) => CLUBS[k]?.name ?? 'Kulüp';

// ---------------------------------------------------------------------------------------------------------------------- yapı

/** Kasabanın işleyen (bitmiş, hasarsız, yanmayan) hobi evi ya da null. Şalter kapalıyken null. */
export function clubBuilding(state, key) {
  if (!engineOn('clubs') || !isClubKey(key)) return null;
  return state.buildings.find((b) => b.type === key && b.functional && !b.damaged && !b.isBurning && !b.underConstruction) ?? null;
}

/** İşleyen hobi evlerinin anahtarları (kulüp sırasıyla). */
export function activeClubKeys(state) {
  return CLUB_KEYS.filter((k) => clubBuilding(state, k));
}

/** Kasabada (inşaatta da olsa) herhangi bir hobi evi var mı? Yoksa bu katmanın hiçbir kancası çalışmaz. */
export function anyClubHouse(state) {
  return engineOn('clubs') && state.buildings.some((b) => isClubKey(b.type));
}

// ---------------------------------------------------------------------------------------------------------------------- üyelik

/** Kulübe girebilir mi: Genç, Yetişkin ya da Kıdemli Bilge; seferde, ayrılırken, sürgünde, isyancıyken değil. */
export function canJoin(state, c) {
  if (!c || c.role || c.isChild || !['youth', 'adult', 'elder'].includes(c.lifeStage)) return false;
  if (c.away || c.emigrating || c.sentence?.exile) return false;
  if (state.trust?.revolt?.rioters?.includes(c.id)) return false;
  return true;
}

/**
 * Kulübün üyeleri (kimlik sırası). (32.6a) `placed` (isteğe bağlı Map kimlik → kulüp anahtarı): yerleşme planındaki geçici üyelikler;
 * sakin nesnesine yazmadan "bu plan uygulanırsa" üyeleri verir (placementPlan saf kalsın diye).
 */
export function membersOf(state, key, placed = null) {
  const keyOf = placed ? (c) => placed.get(c.id) ?? c.club?.key : (c) => c.club?.key;
  return state.characters.filter((c) => keyOf(c) === key).sort((a, b) => a.id - b.id);
}

/** Üyenin kulüpteki yakın dostları (topFriends: en yüksek puanlı AR.friendCount kişi, en az AR.friendLevel). */
export function clubFriends(state, c, key, placed = null) {
  const minIndex = RELATIONSHIP_LEVELS.findIndex((l) => l.key === AR.friendLevel);
  const members = membersOf(state, key, placed).filter((o) => o !== c);
  return members
    .map((o) => ({ o, score: getFriendship(state, c, o) }))
    .filter((e) => levelIndexFor(e.score) >= minIndex)
    .sort((x, y) => y.score - x.score || x.o.id - y.o.id)
    .slice(0, AR.friendCount)
    .map((e) => e.o);
}

/**
 * Yakınlık puanı: { score, reasons: [kısa ad, ...] } (zar yok). Özellik + huy + beceri (seviye başına, en çok skillCap) + iş yeri +
 * kulüpteki yakın dost başına (en çok friendCap) + kalabalığı seven özellik − zıt eğilim. Nedenler panelde gösterilir.
 */
export function clubAffinity(state, c, key, placed = null) {
  const t = CLUB_AFFINITY[key];
  if (!t || !c) return { score: 0, reasons: [] };
  let score = 0;
  const reasons = [];
  for (const tr of c.traits ?? []) {
    const v = t.traits[tr];
    if (v) {
      score += v;
      if (v > 0) reasons.push(TRAITS[tr]?.name ?? tr);
    }
    if (AR.social[tr]) score += AR.social[tr];
    if (tr === 'grumpy') score += AR.grumpy;
  }
  if (c.quirk) {
    const v = t.quirks[c.quirk];
    if (v) {
      score += v;
      if (v > 0) reasons.push(QUIRKS[c.quirk]?.name ?? c.quirk);
    }
    if (AR.social[c.quirk]) score += AR.social[c.quirk];
  }
  for (const [sk, w] of Object.entries(t.skills)) {
    const lv = Math.min(AR.skillCap, levelFor(c.skills?.[sk] ?? 0).level - 1);
    if (lv > 0) {
      score += lv * w;
      reasons.push(SKILLS[sk].title);
    }
  }
  if (t.work.length && c.workplaceId !== null && c.workplaceId !== undefined) {
    const w = state.buildings.find((b) => b.id === c.workplaceId);
    if (w && t.work.includes(w.type)) {
      score += AR.work;
      reasons.push(BUILDINGS[w.type]?.name ?? w.type);
    }
  }
  if (t.elder && c.lifeStage === 'elder') {
    score += t.elder;
    reasons.push('Kıdemli Bilge');
  }
  const friends = clubFriends(state, c, key, placed).length;
  if (friends) {
    score += Math.min(AR.friendCap, friends * AR.friend);
    reasons.push(friends > 1 ? `${friends} dostu üye` : 'dostu üye');
  }
  return { score: round2(score), reasons: [...new Set(reasons)] };
}

/** Kendiliğinden katılabilecek mi (eşik, kapasite ve oyuncunun çıkarma süresi dışında). */
function kickedFrom(state, key, c) {
  const out = state.clubs?.[key]?.out;
  return Boolean(out && Number.isFinite(out[c.id]) && state.time.day < out[c.id]);
}

/**
 * Sıradaki adaylar: kulübü olmayan, katılabilecek sakinler, puan sırasıyla (eşitlikte kimlik). Dönüş [{ c, score, reasons, auto }]
 * (auto: eşiği geçti ve çıkarılma süresi yok: gün dönümünde kendiliğinden katılır).
 */
export function candidatesFor(state, key) {
  return state.characters
    .filter((c) => !c.club && canJoin(state, c))
    .map((c) => ({ c, ...clubAffinity(state, c, key) }))
    .map((e) => ({ ...e, auto: e.score >= CLUB.threshold && !kickedFrom(state, key, e.c) }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score || a.c.id - b.c.id);
}

/**
 * Gün dönümü yerleşmesi: işleyen kulüplere eşiği geçen en yüksek puanlı sakini sırayla yerleştirir (her adımda yeniden puanlar:
 * dost çekimi yeni üyeyle değişir). Dönüş: [{ c, key, score }] (durum yazmaz; ClubSystem uygular). (32.6a) Planlanan üyelikler
 * geçici bir haritada (`taken`) tutulur ve dost çekimi oradan hesaplanır: sakin nesnesine hiç yazılmaz (eskiden c.club geçici yazılıp
 * geri alınıyordu; arada hata fırlarsa durum bozuk kalabilirdi).
 */
export function placementPlan(state) {
  const keys = activeClubKeys(state);
  if (!keys.length) return [];
  const taken = new Map(); // kimlik -> kulüp (bu plan içinde)
  const counts = Object.fromEntries(keys.map((k) => [k, membersOf(state, k).length]));
  const plan = [];
  const pool = state.characters.filter((c) => !c.club && canJoin(state, c));
  for (;;) {
    let best = null;
    for (const c of pool) {
      if (taken.has(c.id)) continue;
      for (const k of keys) {
        if (counts[k] >= CLUB.capacity || kickedFrom(state, k, c)) continue;
        const score = clubAffinity(state, c, k, taken).score; // planlanan üyeler dost çekiminde sayılır (yalnızca haritada)
        if (score < CLUB.threshold) continue;
        if (!best || score > best.score || (score === best.score && (c.id < best.c.id || (c.id === best.c.id && keys.indexOf(k) < keys.indexOf(best.key))))) best = { c, key: k, score };
      }
    }
    if (!best) break;
    taken.set(best.c.id, best.key);
    counts[best.key] += 1;
    plan.push(best);
  }
  return plan;
}

// ---------------------------------------------------------------------------------------------------------------------- takvim

/** Bu gün bu kulübün buluşma günü mü (tek / çift)? */
export function isSessionDay(key, day) {
  const s = CLUB_SCHEDULE[key];
  return Boolean(s) && ((day % 2) + 2) % 2 === s.parity;
}

/**
 * Bugünün buluşma penceresi (oyun dakikası) ya da null. (32.6a) `rec` (state.clubs[k], isteğe bağlı): dün düşen buluşmanın telafisi
 * bugünse (rec.makeup === day) takvim dışı günde de aynı saatlerde pencere açılır ({ makeup: true }).
 */
export function sessionWindow(key, day, rec = null) {
  const makeup = rec?.makeup === day;
  if (!isSessionDay(key, day) && !makeup) return null;
  const s = CLUB_SCHEDULE[key];
  const base = (day - 1) * 1440;
  return { start: base + s.from, end: base + s.to, ...(makeup && !isSessionDay(key, day) ? { makeup: true } : {}) };
}

/** Bir gün kaç kulübün buluşma günü (takvim tasarımı: en çok iki). */
export function sessionsOnDay(day) {
  return CLUB_KEYS.filter((k) => isSessionDay(k, day)).length;
}

/** "17:30" biçimi. */
export const clock = (minuteOfDay) => `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(Math.round(minuteOfDay % 60)).padStart(2, '0')}`;

/** Sonraki buluşma: { day, from, to, today } (bugünkü bitmediyse bugün). */
export function nextSession(state, key) {
  const now = state.totalMinutes;
  for (let d = state.time.day; d < state.time.day + 3; d++) {
    const w = sessionWindow(key, d, state.clubs?.[key]);
    if (w && now < w.end) return { day: d, from: CLUB_SCHEDULE[key].from, to: CLUB_SCHEDULE[key].to, today: d === state.time.day, ...(w.makeup ? { makeup: true } : {}) };
  }
  return null;
}

/**
 * (32.6a) Kulüp zili bu etkinliği kaldırır mı: türü CLUB_BELL.kinds içinde ve CLUB_BELL.keep dışında. Elle yazılmış liste yerine
 * ACTIVITIES'ten türetilir (yeni bir boş zaman etkinliği kendiliğinden girer). `acts` test içindir.
 */
export function clubBellInterrupts(activity, acts = ACTIVITIES) {
  const a = acts[activity];
  return Boolean(a) && CLUB_BELL.kinds.includes(a.kind) && !CLUB_BELL.keep.includes(activity);
}

/**
 * (32.6a) Üyelerin evinden kulüp evine ortalama uzaklık (karo, Manhattan; evsiz üye sayılmaz) ya da null. Yol bulma yapılmaz:
 * panel uyarısının yedeği ve ClubSystem'in yol bulamadığı üye için tahmin.
 */
export function memberHomeDistance(state, key, building) {
  if (!building) return null;
  const def = BUILDINGS[building.type];
  const cx = building.tileX + (def?.size?.w ?? 1) / 2;
  const cy = building.tileY + (def?.size?.h ?? 1);
  const d = [];
  for (const c of membersOf(state, key)) {
    const home = Number.isInteger(c.homeId) ? state.buildings.find((b) => b.id === c.homeId) : null;
    if (!home) continue;
    const hd = BUILDINGS[home.type];
    d.push(Math.abs(home.tileX + (hd?.size?.w ?? 1) / 2 - cx) + Math.abs(home.tileY + (hd?.size?.h ?? 1) - cy));
  }
  return d.length ? d.reduce((a, b) => a + b, 0) / d.length : null;
}

/** (32.6a) Ortalama yürüyüş (karo) → zilin erken çalma payı (dakika, 0-leadMax). */
export function leadMinutes(tiles) {
  if (!Number.isFinite(tiles) || tiles <= 0) return 0;
  return Math.min(CLUB.leadMax, Math.round(tiles * CLUB.walkMinutesPerTile));
}

/** (32.6a) Panel uyarısı: kulüp evi üyelerin evlerinden uzaksa metin, değilse null (ClubSystem'in yol ölçümü varsa o kullanılır). */
export function farHouseWarning(state, key, building) {
  const r = state.clubs?.[key];
  const tiles = Number.isFinite(r?.lead?.tiles) ? r.lead.tiles : memberHomeDistance(state, key, building);
  if (!Number.isFinite(tiles) || tiles < CLUB.farTiles) return null;
  return CLUB_TEXT.farHouse.replace('{tiles}', String(Math.round(tiles))).replace('{min}', String(Math.round(tiles * CLUB.walkMinutesPerTile)));
}

// ---------------------------------------------------------------------------------------------------------------------- buluşma karoları

/** Kulüp evinin çevresindeki yürünebilir, kasabaya bağlı karolar: önce ön sıra (soldan sağa), sonra yanlar, en son arka. */
export function sessionSpots(world, building) {
  const def = BUILDINGS[building.type];
  const { w, h } = def.size;
  const { tileX: x0, tileY: y0 } = building;
  const ok = (x, y) => world.map.isWalkable(x, y) && world.isReachable(x, y);
  const out = [];
  for (let x = x0; x < x0 + w; x++) if (ok(x, y0 + h)) out.push({ x, y: y0 + h, side: 'front' });
  for (const x of [x0 - 1, x0 + w]) if (ok(x, y0 + h)) out.push({ x, y: y0 + h, side: 'front' });
  for (let y = y0 + h - 1; y >= y0; y--) for (const x of [x0 - 1, x0 + w]) if (ok(x, y)) out.push({ x, y, side: x < x0 ? 'left' : 'right' });
  for (let x = x0; x < x0 + w; x++) if (ok(x, y0 - 1)) out.push({ x, y: y0 - 1, side: 'back' });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------- kancalar

/** Son `attendanceKept` buluşmada kaç kez geldi. */
export function attendedCount(state, c) {
  const key = c?.club?.key;
  const list = key ? state.clubs?.[key]?.attendance ?? [] : [];
  return list.filter((ids) => ids.includes(c.id)).length;
}

/** Etkin üye: son buluşmaların en az activeMin'ine katılmış. */
export function isActiveMember(state, c) {
  return Boolean(c?.club) && attendedCount(state, c) >= CLUB_CRIME.activeMin;
}

/** (Justice.clubFactor) üye ×0,9 · etkin üye ×0,75 · değilse 1. Şalter kapalıyken ya da yapı yokken 1. */
export function clubCrimeFactor(state, c) {
  if (!engineOn('clubs') || !c?.club || !state) return 1;
  return isActiveMember(state, c) ? CLUB_CRIME.active : CLUB_CRIME.member;
}

/** (Justice yoksulluk hesabı) çantadaki Nakışlı Mendil kese yanında değer sayılır. Şalter kapalıyken 0. */
export function clubPoverty(c) {
  if (!engineOn('clubs') || !c?.inventory?.length) return 0;
  let n = 0;
  for (const s of c.inventory) if (s.kind === 'handkerchief') n += s.qty;
  return n * HANDKERCHIEF.worth;
}

/** Yetişkin + Kıdemli Bilge (misafirler hariç). */
export function clubAdults(state) {
  return state.characters.filter((c) => !c.role && (c.lifeStage === 'adult' || c.lifeStage === 'elder'));
}

/** Kulüplerin canlılığı 0-1: son buluşma günlerinden kaçında buluşma gerçekleşti (state.clubs[k].held / tried). */
export function clubVitality(state) {
  let held = 0;
  let tried = 0;
  for (const k of CLUB_KEYS) {
    const r = state.clubs?.[k];
    if (!r?.recent?.length) continue;
    held += r.recent.filter(Boolean).length;
    tried += r.recent.length;
  }
  return tried ? held / tried : 0;
}

/** (Renown.renownClubs) (etkin üye / yetişkin + bilge) × canlılık, 0-1. Şalter kapalıyken 0. */
export function renownClubShare(state) {
  if (!engineOn('clubs') || !state.clubs) return 0;
  const adults = clubAdults(state);
  if (!adults.length) return 0;
  const active = state.characters.filter((c) => !c.role && c.club && isActiveMember(state, c)).length;
  return clamp01((active / adults.length) * clubVitality(state) * CLUB_RENOWN.scale);
}

/** Hobi evinin estetik katkısı (Landscape.aestheticValue): ürün başına, tavanlı (runtime building.clubWorks; kaydedilmez). */
export function clubAesthetic(building) {
  const def = CLUBS[building?.type];
  if (!def?.aestheticPerWork || !engineOn('clubs')) return 0;
  return Math.min(def.maxWorks, building.clubWorks ?? 0) * def.aestheticPerWork;
}

/**
 * Hediye alıcısının sırası (zarsız): kışın önce en çok üşüyen (exposure, giysisi olmayan), sonra kesesi en boş; eşitlikte kimlik.
 * Çocuk ve misafir dahil değil; çantasında yer olmalı (ClubSystem bakar).
 */
export function giftOrder(state, winter) {
  return state.characters
    .filter((c) => !c.role && !c.isChild && !c.away && !c.emigrating && !c.sentence?.exile)
    .sort((a, b) => {
      if (winter) {
        const ga = (a.inventory ?? []).some((s) => s.kind === 'garment') ? 1 : 0;
        const gb = (b.inventory ?? []).some((s) => s.kind === 'garment') ? 1 : 0;
        if (ga !== gb) return ga - gb;
        const ea = a.exposure ?? 0;
        const eb = b.exposure ?? 0;
        if (ea !== eb) return eb - ea;
      }
      return (a.coins ?? 0) - (b.coins ?? 0) || a.id - b.id;
    });
}

/** Tablonun adı: mevsimin konu listesinden sırayla + ressam ("Bahar Sabahı — Ayşe"). */
export function paintingTitle(seasonKey, index, painter) {
  const list = PAINTING_TITLES[seasonKey] ?? PAINTING_TITLES.summer;
  return `${list[index % list.length]} — ${painter}`;
}

// ---------------------------------------------------------------------------------------------------------------------- kayıt

/** c.club (isteğe bağlı): { key, since, missed } ya da null. */
export function sanitizeClub(raw) {
  if (!raw || typeof raw !== 'object' || !isClubKey(raw.key)) return null;
  const n = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
  return { key: raw.key, since: n(raw.since), missed: n(raw.missed) };
}

/** state.clubs[k]: { sessions, lastSession, attendance: [[kimlik]] (son 4), recent: [0/1] (son 6 buluşma günü), works, ... }. */
export function emptyClub() {
  return { sessions: 0, lastSession: null, attendance: [], recent: [], works: 0, products: 0 };
}

export function restoreClubs(data, ids) {
  if (!data || typeof data !== 'object') return null;
  const out = {};
  const int = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
  for (const k of CLUB_KEYS) {
    const r = data[k];
    if (!r || typeof r !== 'object') continue;
    const c = emptyClub();
    c.sessions = int(r.sessions);
    c.lastSession = Number.isInteger(r.lastSession) ? r.lastSession : null;
    c.works = int(r.works);
    c.products = int(r.products);
    if (Array.isArray(r.attendance)) c.attendance = r.attendance.filter(Array.isArray).slice(-CLUB.attendanceKept).map((l) => l.filter((id) => ids.has(id)));
    if (Array.isArray(r.recent)) c.recent = r.recent.slice(-6).map((v) => (v ? 1 : 0));
    if (Array.isArray(r.paintings)) c.paintings = r.paintings.filter((p) => p && typeof p.title === 'string').slice(0, CLUBS.paintingClub.maxWorks).map((p) => ({ title: p.title.slice(0, 48), day: int(p.day) }));
    if (r.exhibited) c.exhibited = int(r.exhibited);
    if (Number.isInteger(r.exhibitUntil)) c.exhibitUntil = r.exhibitUntil;
    if (Number.isInteger(r.garmentSeason)) c.garmentSeason = r.garmentSeason;
    if (Number.isInteger(r.fruitYear)) c.fruitYear = r.fruitYear;
    if (r.founded) c.founded = int(r.founded);
    if (Number.isInteger(r.evaluated)) c.evaluated = r.evaluated;
    if (Number.isInteger(r.makeup)) c.makeup = r.makeup; // (32.6a) telafi buluşmasının günü
    if (r.planned) c.planned = int(r.planned); // (32.6a) sayaçlar: takvimdeki buluşma günü, gerçekleşen (telafi dahil), telafi
    if (r.realized) c.realized = int(r.realized);
    if (r.madeUp) c.madeUp = int(r.madeUp);
    if (r.live && Number.isInteger(r.live.day) && Number.isInteger(r.live.until)) {
      c.live = { day: r.live.day, until: r.live.until, ids: (r.live.ids ?? []).filter((id) => ids.has(id)), came: (r.live.came ?? []).filter((id) => ids.has(id)), excused: (r.live.excused ?? []).filter((id) => ids.has(id)), ...(r.live.makeup ? { makeup: 1 } : {}) };
    }
    if (r.out && typeof r.out === 'object') {
      c.out = {};
      for (const [id, until] of Object.entries(r.out)) if (ids.has(Number(id)) && Number.isInteger(until)) c.out[id] = until;
    }
    if (r.lead && Number.isInteger(r.lead.day) && Number.isFinite(r.lead.tiles)) c.lead = { day: r.lead.day, tiles: Math.max(0, Math.round(r.lead.tiles * 10) / 10), minutes: int(r.lead.minutes) }; // (32.6a)
    if (r.gifts) c.gifts = int(r.gifts);
    if (r.garments) c.garments = int(r.garments);
    out[k] = c;
  }
  return Object.keys(out).length ? out : null;
}
