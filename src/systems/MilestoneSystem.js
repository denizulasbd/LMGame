// Kasaba hedefleri (başarımlar): data/milestones.js'teki hedeflerin ilerlemesini ölçer, tamamlananları
// GameState.milestones'a { gün, saat, dakika } ile yazar ve 'milestone:completed' { milestone } yayınlar
// (bildirim, günlük ve ses dinler). Kasaba Anıtı tamamlanınca ayrıca 'town:legendary' yayınlanır.
//
// Olaya bağlı sayaçlar GameState.stats'ta tutulur: tamamlanan yapı, pişen sıcak yemek, takas, atlatılan
// kış. Kış sınavı: kış başlarken nüfus ve en düşük refah takibe alınır; ilkbahar geldiğinde kimse
// eksilmemiş ve refah WINTER_TRIAL_MIN_HAPPINESS'in (%65) altına düşmemişse kış atlatılmış sayılır.
import { MILESTONES, WINTER_TRIAL_MIN_HAPPINESS } from '../data/milestones.js';
import { townHappiness } from './TownStatus.js';
import { skillLevel } from './SkillSystem.js';
import { SKILL_KEYS } from '../data/skills.js';
import { engineOn } from './Engines.js';
import { chosenDoctrine } from './Doctrine.js';
import { pulseStats, pulseFace } from './Loyalty.js';
import { CLUB_KEYS } from '../data/clubs.js';

/** (30.4b) Şu an geçerli hedef listesi: ENGINES.midgame kapalıyken eski dokuz hedef. */
export function activeMilestones() {
  // (32.6b) `engine` alanı olan geç oyun hedefleri o şalter kapalıyken listede yoktur
  return MILESTONES.filter((m) => (!m.midgame || engineOn('midgame')) && (!m.engine || engineOn(m.engine)));
}

/** (30.4b) Tamamlanmamış ilk hedef ("Sıradaki") ya da null. */
export function nextMilestone(state) {
  return activeMilestones().find((m) => !state.milestones[m.id]) ?? null;
}

const CHECK_EVERY_MINUTES = 10;

/** Bir hedefin anlık ilerlemesi: { current, target } (panel ve kontrol aynı hesabı kullanır). */
export function milestoneProgress(milestone, state) {
  const completed = (type) => state.buildings.filter((b) => b.type === type && b.functional).length;
  switch (milestone.kind) {
    case 'buildingsCompleted':
      return { current: state.stats.buildingsCompleted, target: milestone.target };
    case 'mealsCooked':
      return { current: state.stats.mealsCooked, target: milestone.target };
    case 'trades':
      return { current: state.stats.trades, target: milestone.target };
    case 'population':
      return { current: state.characters.length, target: milestone.target };
    case 'masters': {
      const masters = state.characters.filter((c) => SKILL_KEYS.some((s) => skillLevel(c, s).level === 3)).length;
      return { current: masters, target: milestone.target };
    }
    case 'wintersSurvived': {
      // Kış sürerken bu kışın en düşük refahı da gösterilir
      const winter = state.stats.winter;
      const detail = winter ? `Bu kış en düşük refah %${Math.round(winter.minHappiness)} (en az %${WINTER_TRIAL_MIN_HAPPINESS})` : undefined;
      return { current: state.stats.wintersSurvived, target: milestone.target, detail };
    }
    case 'streets': {
      const lights = completed('lantern') + completed('ironLantern'); // (18. aşama) demir fenerler de sayılır
      const cobbles = state.stats.cobbles ?? 0;
      const done = (lights >= milestone.lights ? 1 : 0) + (cobbles >= milestone.cobbles ? 1 : 0);
      return { current: done, target: milestone.target, detail: `Fener ${lights}/${milestone.lights} · Taş yol ${cobbles}/${milestone.cobbles}` };
    }
    case 'monument':
      return { current: completed('monument'), target: milestone.target };
    case 'wonder': {
      // Harikanın tamamlanan aşaması (12. aşama): Temel -> Gövde -> Görkemli Kule
      const stage = state.buildings.filter((b) => b.type === 'wonder' && b.functional).reduce((m, b) => Math.max(m, b.wonderStage ?? 0), 0);
      const names = ['Temel', 'Gövde', 'Görkemli Kule'];
      const detail = stage > 0 && stage < milestone.target ? `Tamamlanan: ${names.slice(0, stage).join(', ')} · sıradaki: ${names[stage]}` : undefined;
      return { current: Math.min(stage, milestone.target), target: milestone.target, detail };
    }
    // (30.4b) ara hedefler; sayaçlar isteğe bağlı kayıt alanlarıdır (stats.pleasedStreak, stats.condolences)
    case 'petitionsMet':
      return { current: state.petitions?.fulfilled ?? 0, target: milestone.target };
    case 'pulseStreak':
      return { current: state.stats.pleasedStreak ?? 0, target: milestone.target };
    case 'condolences':
      return { current: state.stats.condolences ?? 0, target: milestone.target };
    case 'doctrine':
      return { current: chosenDoctrine(state) ? 1 : 0, target: milestone.target };
    case 'heirloomPassed':
      return { current: state.chronicle?.firstHeirloom ? 1 : 0, target: milestone.target };
    // (32.6b) geç oyun hedefleri: yalnızca okur
    case 'justiceServed': {
      const built = state.buildings.some((b) => b.type === 'courthouse' && b.functional) ? 1 : 0;
      const fair = Math.min(milestone.fair, state.justice?.stats?.court?.fair ?? 0);
      return { current: built + fair, target: milestone.target, detail: `Saray ${built}/1 · Adil karar ${fair}/${milestone.fair}` };
    }
    case 'firstClub': {
      const built = state.buildings.some((b) => CLUB_KEYS.includes(b.type) && b.functional) ? 1 : 0;
      const met = Object.values(state.clubs ?? {}).some((r) => (r?.realized ?? 0) > 0) ? 1 : 0;
      return { current: built + met, target: milestone.target, detail: `Hobi evi ${built}/1 · İlk buluşma ${met}/1` };
    }
    case 'firstGraduate': {
      const built = state.buildings.some((b) => b.type === 'university' && b.functional) ? 1 : 0;
      return { current: Math.min(1, state.university?.graduated ?? 0), target: milestone.target, detail: `Darülfünun ${built}/1 · Mezun ${Math.min(1, state.university?.graduated ?? 0)}/1` };
    }
    case 'royalFavorite': {
      const rep = Math.floor(state.crown?.reputation ?? 0);
      return { current: Math.min(rep, milestone.target), target: milestone.target, detail: `Krallık İtibarı %${rep}/${milestone.target}` };
    }
    default:
      return { current: 0, target: milestone.target };
  }
}

export class MilestoneSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {number} cobbleTileId taş yol karosunun harita kimliği (data/tiles.js)
   */
  constructor(game, world, cobbleTileId) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.cobbleTileId = cobbleTileId;
    this.sinceCheck = CHECK_EVERY_MINUTES;

    const stats = this.state.stats;
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('building:completed', () => {
        stats.buildingsCompleted++;
        this.check();
      }),
      on('kitchen:cooked', () => {
        stats.mealsCooked++;
        if (stats.mealsCooked === 1) this.check();
      }),
      on('trade:completed', () => {
        stats.trades++;
        this.check();
      }),
      on('wonder:stageCompleted', () => this.check()),
      on('petition:resolved', () => engineOn('midgame') && this.check()),
      on('doctrine:chosen', () => engineOn('midgame') && this.check()),
      on('heirloom:passed', () => engineOn('midgame') && this.check()),
      on('rite:held', ({ condolence } = {}) => {
        if (!engineOn('midgame') || !condolence) return;
        stats.condolences = (stats.condolences ?? 0) + 1;
        this.check();
      }),
      // Halkın Nabzı art arda kaç gündür Memnun / Minnettar: gün dönümünde bakılır (ortalama sadakat; Nabız ile aynı hesap)
      on('time:newDay', () => {
        if (!engineOn('midgame')) return;
        const face = pulseFace(pulseStats(this.state).avg);
        stats.pleasedStreak = face === 'pleased' || face === 'grateful' ? (stats.pleasedStreak ?? 0) + 1 : 0;
        this.check();
      }),
      on('wonder:completed', () => this.check()),
      on('time:seasonChanged', ({ season, previous }) => this.onSeasonChanged(season, previous)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    // Kış sürüyorsa en düşük refahı izle
    const winter = this.state.stats.winter;
    if (winter) winter.minHappiness = Math.min(winter.minHappiness, townHappiness(this.state));
    this.sinceCheck -= tick.gameMinutes;
    if (this.sinceCheck <= 0) {
      this.sinceCheck = CHECK_EVERY_MINUTES;
      this.check();
    }
  }

  onSeasonChanged(season, previous) {
    const stats = this.state.stats;
    if (season.cold) {
      stats.winter = { minHappiness: townHappiness(this.state), startPopulation: this.state.characters.length };
      return;
    }
    if (previous.cold && stats.winter) {
      const { minHappiness, startPopulation } = stats.winter;
      const kept = this.state.characters.length >= startPopulation;
      if (kept && minHappiness >= WINTER_TRIAL_MIN_HAPPINESS) {
        stats.wintersSurvived++;
      } else {
        this.events.emit('toast', {
          text: `Kış zor geçti (en düşük refah %${Math.round(minHappiness)}). Kış Sınavı gelecek kış yeniden denenebilir.`,
          tone: 'warn',
          icon: 'winter',
        });
      }
      stats.winter = null;
      this.check();
    }
  }

  /** Haritadaki taş yol karolarını sayar (Işıltılı Sokaklar hedefi ve panel için stats'a yazılır). */
  countCobbles() {
    const tiles = this.world.map.tiles;
    let count = 0;
    for (let i = 0; i < tiles.length; i++) if (tiles[i] === this.cobbleTileId) count++;
    this.state.stats.cobbles = count;
  }

  /** Tamamlanmamış hedefleri kontrol eder; tamamlananları kaydedip duyurur. */
  check() {
    this.countCobbles();
    for (const milestone of activeMilestones()) {
      if (this.state.milestones[milestone.id]) continue;
      const { current, target } = milestoneProgress(milestone, this.state);
      if (current < target) continue;
      const { day, hour, minute } = this.state.time;
      this.state.milestones[milestone.id] = { day, hour, minute };
      this.events.emit('milestone:completed', { milestone });
      this.events.emit('toast', { text: `Hedef tamamlandı: ${milestone.name}!`, tone: 'success', icon: milestone.icon });
      if (milestone.kind === 'monument') this.events.emit('town:legendary', { townName: this.state.townName });
    }
  }
}
