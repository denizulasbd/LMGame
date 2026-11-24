// (30.1) Rehber kartlarının saf mantığı: hangi adım görünür, hangisi tamamlandı. Durum yazmaz (state.guide'ı GuideSystem
// değiştirir), zar çekmez. Bağlam: { state, facts }; facts bu oturumda gözlenen eylemlerdir ({ moved, selected, speedChanged,
// goalsOpened, upgraded, placed, petitionSelected }) ve kaydedilmez; kalıcı olan yalnızca state.guide.done'dır.
//   state.guide = { done: [adım kimlikleri], off: bool, at?: { adım: oyun dakikası } }   (isteğe bağlı alanlar)
import { GUIDE_STEPS, GUIDE_GOLD_DRY_DAYS, GUIDE_STONE_DRY_DAYS, GUIDE_STORAGE_RATIO, GUIDE_SPEED_DELAY_MINUTES, GUIDE_OLD_SAVE_POPULATION, GUIDE_WATCH_POPULATION } from '../data/guide.js';
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';
import { storageLimit } from './Granary.js';
import { nextTownTier, tierChecks } from './TownStatus.js';

import { engineOn } from './Engines.js';
import { courtOf } from './Justice.js';
import { foodSupply } from './TownStatus.js';
import { foodDaysLeft } from './Loyalty.js';
import { levyAmount } from './Crown.js';
import { easiestGoldWay, stoneSource } from './Money.js';
import { LEVY } from '../data/crown.js';
import { DISCONTENT } from '../data/loyalty.js';
import { chosenDoctrine } from './Doctrine.js';
export const emptyGuide = () => ({ done: [], off: false });

/** Kayıttaki rehber durumu. Yoksa: nüfusu 8'den fazla olan kayıtta kapalı, yoksa açık. */
export function restoreGuide(data, population = 0) {
  if (!data || typeof data !== 'object') return { done: [], off: population > GUIDE_OLD_SAVE_POPULATION };
  const ids = new Set(GUIDE_STEPS.map((s) => s.id));
  const done = Array.isArray(data.done) ? [...new Set(data.done.filter((id) => ids.has(id)))] : [];
  const out = { done, off: data.off === true };
  if (data.at && typeof data.at === 'object') {
    const at = {};
    for (const [id, v] of Object.entries(data.at)) if (ids.has(id) && Number.isFinite(v)) at[id] = v;
    if (Object.keys(at).length) out.at = at;
  }
  return out;
}

const isDone = (guide, id) => guide.done.includes(id);

/** Depo sınırının %90'ına dayanan, sınırlı bir kaynak var mı? */
export function storageNearlyFull(state) {
  return Object.keys(RESOURCES).some((key) => {
    const limit = storageLimit(state, key);
    return Number.isFinite(limit) && limit > 0 && (state.resources[key] ?? 0) >= limit * GUIDE_STORAGE_RATIO;
  });
}

/** Tamamlanmış (şantiyesi bitmiş) bir depo yapısı var mı? */
export function hasStorageBuilding(state) {
  return state.buildings.some((b) => b.functional && (BUILDINGS[b.type]?.storageBonus ?? 0) > 0);
}

/** Bir sonraki kasaba seviyesinin "Seviye 2 yapı" koşulu: { target, current } ya da null. */
export function upgradeCheck(state) {
  const next = nextTownTier(state);
  return next ? tierChecks(state, next).find((c) => c.key === 'upgraded') ?? null : null;
}

/** Her adımın görünme (when) ve tamamlanma (done) koşulu; ikisi de ({ state, facts, guide }) alır. */
export const CONDITIONS = {
  // (30.4a) ilk doğal vefat (kaza sayılmaz); yalnızca "Anladım" ile tamamlanır
  lifespan: {
    when: ({ state }) => (state.lifeStages?.deaths ?? 0) - (state.lifeStages?.accidents ?? 0) >= 1,
    done: () => false,
  },
  // (32.2) Adalet Sarayı varken ilk açık dava; yalnızca "Anladım" ile tamamlanır
  court: {
    when: ({ state }) => Boolean(courtOf(state)) && Boolean(state.justice?.cases?.some((k) => k.court)),
    done: () => false,
  },
  move: { when: () => true, done: ({ facts }) => Boolean(facts.moved) },
  meet: { when: ({ guide }) => isDone(guide, 'move'), done: ({ facts }) => Boolean(facts.selected) },
  harvest: {
    when: ({ guide }) => isDone(guide, 'meet'),
    done: ({ state }) => state.jobs.some((j) => j.type !== 'build'),
  },
  build: { when: ({ guide }) => isDone(guide, 'harvest'), done: ({ facts }) => Boolean(facts.placed) },
  storage: {
    when: ({ state }) => storageNearlyFull(state),
    done: ({ state }) => hasStorageBuilding(state),
  },
  speed: {
    when: ({ state, guide }) => isDone(guide, 'build') && state.totalMinutes - (guide.at?.build ?? 0) >= GUIDE_SPEED_DELAY_MINUTES,
    done: ({ facts }) => Boolean(facts.speedChanged),
  },
  goals: { when: ({ guide }) => isDone(guide, 'build'), done: ({ facts }) => Boolean(facts.goalsOpened) },
  upgrade: {
    when: ({ state }) => {
      const check = upgradeCheck(state);
      return Boolean(check && check.target > 0 && check.current === 0);
    },
    done: ({ state, facts }) => Boolean(facts.upgraded) || (upgradeCheck(state)?.current ?? 0) > 0,
  },
  petition: {
    when: ({ state }) => (state.petitions?.list ?? []).length > 0,
    done: ({ facts }) => Boolean(facts.petitionSelected),
  },
  // (30.2) ilk hikâye kartı çıkınca; "Git"e basınca ya da kart kaybolunca tamam
  cards: { when: ({ facts }) => Boolean(facts.storyShown), done: ({ facts }) => Boolean(facts.storyGo) },
  cardAction: { when: ({ facts, guide }) => Boolean(facts.storyActionShown) && isDone(guide, 'cards'), done: ({ facts }) => Boolean(facts.storyActed) },
  // (30.4b) Kasaba Doktrini ilk kez mümkün olduğunda (Belediye Konağı hazır, doktrin seçilmemiş); seçilince ya da "Anladım" ile biter
  doctrine: {
    when: ({ state }) => engineOn('midgame') && !chosenDoctrine(state) && state.buildings.some((b) => b.type === 'townHall' && b.functional),
    done: ({ state }) => engineOn('midgame') && Boolean(chosenDoctrine(state)),
  },
  // (30.6) yapı adımından hemen sonra: yiyecek üreten bir yapı (bahçe, balıkçı, ağıl) yerleştirilene dek
  food: {
    when: ({ state, guide }) => engineOn('novicePath') && isDone(guide, 'build') && !hasFoodProducer(state),
    done: ({ state }) => engineOn('novicePath') && hasFoodProducer(state),
  },
  // (30.6) Kraliyet Tahsildarı ilk duyurulduğunda; ilk tahsilat gerçekleşince biter
  levy: {
    when: ({ state }) => engineOn('novicePath') && Boolean(state.crown?.notice) && (state.crown.levies ?? 0) === 0,
    done: ({ state }) => engineOn('novicePath') && (state.crown?.levies ?? 0) >= 1,
  },
  // (30.6) hazine ilk kez 3 gün 0'da kalınca; biraz altın girince biter
  gold: {
    when: ({ facts }) => engineOn('novicePath') && (facts.goldDry ?? 0) >= GUIDE_GOLD_DRY_DAYS,
    done: ({ state, facts }) => engineOn('novicePath') && (state.resources.gold ?? 0) >= 20 && (facts.goldDry ?? 0) === 0,
  },
  // (30.6) çevredeki kayalar tükenince ya da taş 2 gün 0'da kalınca; bir taş üreten yapı kurulunca biter
  stone: {
    when: ({ facts }) => engineOn('novicePath') && (facts.rocksGone === true || (facts.stoneDry ?? 0) >= GUIDE_STONE_DRY_DAYS),
    done: ({ state }) => engineOn('novicePath') && state.buildings.some((b) => b.type === 'quarry'),
  },
  watch: { when: ({ state }) => state.characters.length >= GUIDE_WATCH_POPULATION, done: ({ state }) => (state.watched?.length ?? 0) > 0 },
};

/** Koşulu kendiliğinden sağlanmış (görünmeden bitmiş) adımlar: oyuncu sırayı beklemeden yaptıysa kart çıkmaz. */
export function newlyDone(state, guide, facts) {
  const ctx = { state, facts, guide };
  return GUIDE_STEPS.filter((s) => !isDone(guide, s.id) && CONDITIONS[s.id].done(ctx)).map((s) => s.id);
}

/** Görünecek adım (tablo sırasında koşulu sağlanan ilk tamamlanmamış adım) ya da null; rehber kapalıysa null. */
export function currentStep(state, guide, facts) {
  if (guide.off) return null;
  const ctx = { state, facts, guide };
  return GUIDE_STEPS.find((s) => !isDone(guide, s.id) && CONDITIONS[s.id].when(ctx)) ?? null;
}

/** (30.6) Yiyecek üreten bir yapı (bahçe, iskele, ağıl: şantiyesi dahil) yerleştirilmiş mi? Çalılar (doğal) sayılmaz. */
export function hasFoodProducer(state) {
  return state.buildings.some((b) => {
    const def = BUILDINGS[b.type];
    return def?.buildable && (def.production?.resource === 'food' || def.production?.extra?.food !== undefined);
  });
}

/** (30.6) Kartların değişken metni için sayılar: { days, amount, inKind, way, source }. */
export function guideVars(state) {
  const supply = foodSupply(state);
  const pop = state.characters.filter((c) => !c.role).length;
  const days = foodDaysLeft(supply, state.pulse?.eaten, pop);
  const notice = state.crown?.notice;
  const dayLeft = notice ? Math.max(0, Math.ceil((notice.at - state.totalMinutes) / 1440)) : 0;
  return {
    days: Number.isFinite(days) ? (days >= 10 ? Math.round(days) : Math.round(days * 10) / 10).toString().replace('.', ',') : '?',
    amount: notice?.amount ?? levyAmount(state),
    daysLeft: dayLeft,
    inKind: LEVY.inKindShare > 0,
    way: easiestGoldWay(state),
    source: stoneSource(state),
  };
}
