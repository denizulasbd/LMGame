// (34.3) Orman kendiliğinden yenilenir (gün dönümü). Ağaç sayısı başlangıçtakinin belli oranının altına inince açık alanda, var olan
// ağaçların yanına, kasabadan uzak yerlere fidan çıkar (saf hesaplar: Forest.js, sayılar: data/forest.js). Fidanı ağaca çeviren
// NatureSystem'dir (state.regrowth). Oyuncunun peyzaj fidanları ve süsleri yapıdır; bu sisteme girmez.
import { BUILDINGS } from '../data/buildings.js';
import { countTrees, saplingsForToday, townMask, sproutSpots } from './Forest.js';

export class ForestSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   * @param {{ baseObjects: () => Uint8Array }} options baseObjects: haritanın üretildiği andaki nesne katmanı (başlangıç ağaç sayısı)
   */
  constructor(game, world, rng, { baseObjects }) {
    this.state = game.state;
    this.world = world;
    this.rng = rng;
    this.baseObjects = baseObjects;
    this.unsubscribe = game.events.on('time:newDay', () => this.newDay());
    this.lastSprouted = 0;
  }

  destroy() {
    this.unsubscribe();
  }

  /** Açık alandaki ağaç sayısının başlangıçtakine oranı (başlangıçta hiç ağaç yoksa 1). */
  ratio() {
    const base = countTrees(this.world.map, this.baseObjects());
    return base > 0 ? countTrees(this.world.map) / base : 1;
  }

  newDay() {
    this.lastSprouted = this.sprout(saplingsForToday(this.ratio()));
  }

  /** En çok count fidan diker; dikilen sayıyı döndürür (testler ve günlük çağrı). */
  sprout(count) {
    if (count <= 0) return 0;
    const map = this.world.map;
    const mask = townMask(map, this.world.buildings, (b) => BUILDINGS[b.type]?.size ?? { w: 1, h: 1 });
    const marked = new Set(this.state.jobs.filter((j) => !j.buildingId).map((j) => `${j.x},${j.y}`));
    const spots = this.rng.shuffle(sproutSpots(map, mask, marked));
    let planted = 0;
    for (const spot of spots.slice(0, count)) {
      map.setObject(spot.x, spot.y, 'sapling');
      this.state.regrowth.push({ x: spot.x, y: spot.y, tree: spot.tree, stage: 'sapling', hours: 0 });
      planted++;
    }
    if (planted > 0) this.world.refreshStaticData();
    return planted;
  }
}
