// (30.1) Rehber kartlarının saf mantığı: hangi adım görünür, hangisi tamamlandı. Durum yazmaz (state.guide'ı GuideSystem
// değiştirir), zar çekmez. Bağlam: { state, facts }; facts bu oturumda gözlenen eylemlerdir ({ moved, selected, speedChanged,
// goalsOpened, upgraded, placed, petitionSelected }) ve kaydedilmez; kalıcı olan yalnızca state.guide.done'dır.
//   state.guide = { done: [adım kimlikleri], off: bool, at?: { adım: oyun dakikası } }   (isteğe bağlı alanlar)
import { GUIDE_STEPS, GUIDE_STORAGE_RATIO, GUIDE_SPEED_DELAY_MINUTES, GUIDE_OLD_SAVE_POPULATION, GUIDE_WATCH_POPULATION } from '../data/guide.js';
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';
import { storageLimit } from './Granary.js';
import { nextTownTier, tierChecks } from './TownStatus.js';

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
