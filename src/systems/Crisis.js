// (23. aşama) Kriz katmanının saf hesapları (durum değiştirmez): tehlike sıklığı, yangın olasılığı ve Su Kuyusu etkisi,
// Gözcü Kulesi ve bekçiler, savunma durumu, haraç ve ganimet, tamir maliyeti. Kural sayıları data/crisis.js'te.
// Bu dosya TownStatus'u içe aktarmaz (TownStatus da buradan okuyabilsin).
import { CRISIS_DIFFICULTY, DEFAULT_DIFFICULTY, CRISIS, FIRE, WELL, GUARD, BANDIT, REPAIR } from '../data/crisis.js';
import { BUILDINGS, DAMAGEABLE_TYPES, mendSpec } from '../data/buildings.js';
import { STORM } from '../data/dilemmas.js';
import { getSeason } from '../data/seasons.js';

export function emptyCrisis() {
  return {
    difficulty: DEFAULT_DIFFICULTY,
    nextRaidWarnAt: null, // sıradaki "haydut izi" uyarısının oyun dakikası
    raid: null, // bekleyen baskın { id, warnedAt, arriveAt, early, tribute }
    nextRaidId: 1,
    lastFireDay: null,
    fires: 0, // çıkan yangın
    extinguished: 0, // hasarsız söndürülen
    burned: 0, // söndürülemeyip hasar bırakan
    raids: 0, // gelen baskın
    repelled: 0,
    tributes: 0,
    caught: 0,
    injuries: 0,
    treated: 0, // şifacıda iyileşen
    repairs: 0,
    log: [], // son krizler { day, hour, kind, text }
  };
}

/** Seçili tehlike sıklığının tanımı. */
export function difficultyOf(state) {
  return CRISIS_DIFFICULTY[state.crisis?.difficulty] ?? CRISIS_DIFFICULTY[DEFAULT_DIFFICULTY];
}

/** Doğal kriz çarpanı (Huzurlu 0, Dengeli 1, Çetin 1,5). */
export function crisisRate(state) {
  return difficultyOf(state).rate;
}

/** Yapının ayak izi merkezinin karo koordinatı (Su Kuyusu uzaklığı için). */
function centerTile(b) {
  const { w, h } = BUILDINGS[b.type].size;
  return { x: b.tileX + (w - 1) / 2, y: b.tileY + (h - 1) / 2 };
}

/** Kullanılabilir (inşaatı bitmiş, hasarsız, yanmayan) bir türün yapıları. */
export function usable(state, type) {
  return state.buildings.filter((b) => b.type === type && b.functional && !b.damaged && !b.isBurning);
}

/** Yapıya `radius` karo yakınında kullanılabilir bir Su Kuyusu var mı? Varsa en yakını. */
export function wellNear(state, building, radius = FIRE.wellRadius) {
  const a = centerTile(building);
  let best = null;
  let bestD = Infinity;
  for (const well of usable(state, 'well')) {
    const b = centerTile(well);
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d <= radius && d < bestD) {
      best = well;
      bestD = d;
    }
  }
  return best;
}

/** Bahçenin Su Kuyusu sulama çarpanı (1 ya da 1 + bonus). */
export function wellGardenMultiplier(state, building) {
  if (!WELL.gardenTypes.includes(building.type.replace(/2$/, ''))) return 1;
  return wellNear(state, building, WELL.gardenRadius) ? 1 + WELL.gardenBonus : 1;
}

/** Ayakta ve kullanılabilir Gözcü Kulesi (yoksa null). */
export function towerOf(state) {
  return usable(state, 'guardTower')[0] ?? null;
}

/** Kulede nöbet tutan (içinde çalışan ya da yolda) bekçi sayısı. */
export function guardsOnDuty(state) {
  const tower = towerOf(state);
  return tower ? tower.workerIds.size : 0;
}

/** Bir yapının bugünkü yangın olasılığı (0-1): tür, mevsim, tehlike sıklığı ve Su Kuyusu etkisi. */
export function fireChance(state, building) {
  const base = FIRE.chance[building.type];
  if (!base || !building.functional || building.damaged || building.isBurning) return 0;
  const season = FIRE.seasons[getSeason(state.time.day).key] ?? 1;
  const well = wellNear(state, building) ? 1 - FIRE.wellReduction : 1;
  return base * season * crisisRate(state) * well;
}

/** Yanan bir yapıyı sönmek için gereken kova sayısı (yakında kuyu varsa daha az). */
export function bucketsNeeded(state, building) {
  return wellNear(state, building) ? FIRE.bucketsNearWell : FIRE.buckets;
}

/** Doğal kriz çıkabilir mi: tehlike sıklığı ve gün (kayıt sonrası ilk 24 saat CrisisSystem'de ayrıca denetlenir). */
export function naturalCrisisAllowed(state, kind) {
  if (crisisRate(state) <= 0) return false;
  const day = kind === 'bandit' ? CRISIS.banditStartDay : CRISIS.fireStartDay;
  return state.time.day >= day;
}

/** Kasabada aktif bir kriz (yanan yapı ya da bekleyen baskın) var mı? */
export function crisisActive(state) {
  return Boolean(state.crisis?.raid) || state.buildings.some((b) => b.isBurning);
}

/** Yetişkin, kasabada ve sağlam sakinler (savunmaya yarar). */
export function ablePeople(state) {
  return state.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.isInjured && !c.emigrating);
}

/**
 * Baskını savunabilir miyiz? Gözcü Kulesi ayaktaysa en az 2 sağlam yetişkin; kulesiz en az `minAdults` sağlam yetişkin
 * ve depoda en az bir sağlam alet. Dönüş: { ok, reason, tower, adults }.
 */
export function defenseStatus(state) {
  const adults = ablePeople(state).length;
  const tower = towerOf(state);
  if (tower) {
    if (adults < 2) return { ok: false, reason: 'Nöbet tutacak yeterli yetişkin yok', tower, adults };
    return { ok: true, reason: null, tower, adults };
  }
  const tools = state.equipment?.sturdyTool ?? 0;
  if (adults < BANDIT.defense.minAdults) return { ok: false, reason: `Savunma için en az ${BANDIT.defense.minAdults} sağlam yetişkin gerekir (şu an ${adults})`, tower: null, adults };
  if (tools < BANDIT.defense.minTools) return { ok: false, reason: 'Depoda sağlam alet yok: Gözcü Kulesi kur ya da alet üret', tower: null, adults };
  return { ok: true, reason: null, tower: null, adults };
}

/** Haraç ödenebilir mi: önce altın, yetmezse kilerden yiyecek. Dönüş: { ok, gold, food, reason }. */
export function tributeStatus(state, tribute) {
  const gold = state.resources.gold ?? 0;
  if (gold >= tribute) return { ok: true, gold: tribute, food: 0, reason: null };
  const food = Math.ceil(tribute * BANDIT.tributeFoodPerGold);
  const supply = (state.resources.food ?? 0) + (state.resources.bread ?? 0) * 2.5;
  if (supply >= food) return { ok: true, gold: 0, food, reason: null };
  return { ok: false, gold: 0, food: 0, reason: `Hazinede ${tribute} altın ya da kilerde ${food} yiyecek yok` };
}

/** Hazırlıksız yakalanınca çalınacak miktar (mevcut stoğun en çok %15'i, asla tamamı değil). */
export function stolenAmount(stock) {
  return Math.max(0, Math.min(Math.floor(stock * BANDIT.caughtMaxShare), stock - 1));
}

/** Baskına kalan oyun saati (uyarı çipi için); yoksa null. */
export function raidHoursLeft(state) {
  const raid = state.crisis?.raid;
  return raid ? Math.max(0, Math.ceil((raid.arriveAt - state.totalMinutes) / 60)) : null;
}

/** Tamirin bedeli: inşa maliyetinin %25'i (yalnızca odun ve taş, en az 1). */
export function repairCost(type) {
  const def = BUILDINGS[type];
  return Object.fromEntries(
    Object.entries(def?.cost ?? {})
      .filter(([r]) => r === 'wood' || r === 'stone')
      .map(([r, v]) => [r, Math.max(1, Math.ceil(v * REPAIR.costRatio))])
  );
}

/** Yangın ya da baskınla hasar gören yapının onarım projesi (ustalar yapar; fırtına hasarı eski kuralı korur). */
export function crisisMendSpec(type) {
  const def = BUILDINGS[type];
  return {
    name: def.name,
    description: 'Yanık kirişler ve kırık çitler onarılır; yapı yeniden çalışır. Boşta kalan ustalar kaynak yettikçe bunu kendiliğinden yapar.',
    cost: repairCost(type),
    buildWork: REPAIR.buildWork,
  };
}

/** Hasarlı yapının onarım projesi: yangın / baskın hasarı %25 + kısa iş, fırtına hasarı eski kural (%30). */
export function mendSpecFor(building) {
  return building.damageKind === 'fire' || building.damageKind === 'raid' ? crisisMendSpec(building.type) : mendSpec(building.type, STORM.mend);
}

const DAMAGEABLE = new Set(DAMAGEABLE_TYPES);

/** Hasar alabilecek yapılar: fırtınayla aynı üretim yapıları listesi (sağlam, yanmayan). */
export function damageableNow(state) {
  return state.buildings.filter((b) => b.functional && !b.damaged && !b.isBurning && DAMAGEABLE.has(b.type));
}
