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
      const lights = completed('lantern');
      const cobbles = state.stats.cobbles ?? 0;
      const done = (lights >= milestone.lights ? 1 : 0) + (cobbles >= milestone.cobbles ? 1 : 0);
      return { current: done, target: milestone.target, detail: `Fener ${lights}/${milestone.lights} · Taş yol ${cobbles}/${milestone.cobbles}` };
    }
    case 'monument':
      return { current: completed('monument'), target: milestone.target };
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
    for (const milestone of MILESTONES) {
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
