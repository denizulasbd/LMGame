// (18. aşama) Serbest imar, peyzaj ve kasaba estetiği.
//   - Yağmur yağarken toprak patikalar çamurlanır (map.wet): üzerinde yavaş yürünür, yol bulma parke taşı yeğler.
//   - Süs fidanları (huş, meşe, çam) dikildikten sonra iki günde büyür (building.growth; fidan -> genç -> ulu ağaç).
//   - Çevre Estetiği: süs yapıları ve döşemeli zemin çevresindeki 4-5 karoluk bölgeye estetik yayar (world.aesthetics).
//     Bu bölgelerden geçen sakinin keyfi dolar, güzel bir köşedeki bankta oturan manzarayı izleyip keyiflenir; arada bir
//     "Güzel bir sokakta yürüdü", "Çiçek kokusunu içine çekti" gibi hafif güzel anılar yazılır.
//   - Kasabanın toplam estetik puanı refaha kalıcı küçük bir çarpan ekler (+%1 ... +%5; systems/TownStatus.js).
//   - Gece, hiçbir ışığın düşmediği karanlık sokakta yürüyen sakin ürker (keyfi biraz hızlı kaçar); sokak fenerleri
//     bunu önler.
// Saf hesaplar systems/Landscape.js'te, sayılar data/landscape.js'te.
import { AESTHETIC, DARKNESS, aestheticPercent } from '../data/landscape.js';
import { BUILDINGS, BENCH_TYPES } from '../data/buildings.js';
import { isRainActive } from '../data/weather.js';
import { addMemory } from './MemorySystem.js';
import { clamp } from '../utils/math.js';
import { computeAestheticField, townAestheticScore, treeGrowth, isDarkHour, litSources, isLitPoint } from './Landscape.js';
import { CONFIG } from '../config.js';

const T = CONFIG.TILE_SIZE;
const RECOMPUTE_GROWING_MINUTES = 60; // büyüyen fidan varken estetik saatte bir yeniden hesaplanır
const STREET_SIGN_RADIUS = 7; // karo: anıya sokağın adını veren tabelanın en uzak mesafesi

export class LandscapeSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, rng) {
    this.events = game.events;
    this.world = world;
    this.state = world.state;
    this.rng = rng;
    this.dirty = true;
    this.lastRecompute = -Infinity;
    this.world.aesthetics = new Float32Array(world.map.width * world.map.height);
    const mark = () => (this.dirty = true);
    this.unsubscribers = [
      ...['building:placed', 'building:completed', 'building:removed', 'club:works', 'map:parcelOpened'].map((n) => game.events.on(n, mark)),
      game.events.on('terrain:painted', ({ type }) => {
        this.dirty = true;
        if (type) this.state.landscape.roadsPainted += 1;
      }),
    ];
    this.refreshGrowth();
    this.recompute({ silent: true }); // yüklenen kasabanın ilk değerlendirmesi günlüğe "güzelleşti" diye yazılmaz
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Süs fidanlarının büyümesini günceller; kademe değişen olursa true. */
  refreshGrowth() {
    const now = this.state.totalMinutes;
    let changed = false;
    let growing = false;
    for (const b of this.world.buildings) {
      if (!BUILDINGS[b.type].ornamentalTree) continue;
      const before = b.growthStage;
      b.growth = treeGrowth(b, now);
      if (b.growth < 1 && b.functional) growing = true;
      if (b.growthStage !== before) {
        changed = true;
        if (b.growthStage === 2 && b.functional) this.events.emit('tree:grown', { building: b });
      }
    }
    this.growing = growing;
    return changed;
  }

  /** Çevre estetiği haritasını, kasabanın toplam puanını ve refah yüzdesini yeniden hesaplar. */
  recompute({ silent = false } = {}) {
    const map = this.world.map;
    this.world.aesthetics = computeAestheticField(map, this.world.buildings);
    this.state.landscapeField = this.world.aesthetics; // arayüz için türetilmiş önbellek (kayda girmez)
    this.state.landscapeAt = (x, y) => this.aestheticAt(x, y); // (34.1) arayüz için koordinatla okuma (kayda girmez)
    const score = townAestheticScore(map, this.world.buildings);
    const percent = aestheticPercent(score);
    const before = this.state.landscape.percent;
    this.state.landscape.score = Math.round(score * 10) / 10;
    this.state.landscape.percent = percent;
    this.dirty = false;
    this.lastRecompute = this.state.totalMinutes;
    if (percent !== before && !silent) this.events.emit('landscape:aestheticChanged', { percent, before, score });
  }

  /** Bir karonun çevre estetiği (harita dışında 0). */
  aestheticAt(x, y) {
    const map = this.world.map;
    return map.inBounds(x, y) ? this.world.aesthetics[map.index(x, y)] : 0;
  }

  update(tick) {
    this.world.map.wet = isRainActive(this.state.weather);
    if (this.refreshGrowth()) this.dirty = true;
    if (this.growing && this.state.totalMinutes - this.lastRecompute >= RECOMPUTE_GROWING_MINUTES) this.dirty = true;
    if (this.dirty) this.recompute();
    const minutes = tick.gameMinutes;
    if (!minutes) return;

    const dark = isDarkHour(tick.hour);
    const lights = dark ? litSources(this.world.buildings) : null;
    const flowers = this.world.buildings.filter((b) => b.functional && AESTHETIC.flowerTypes.includes(b.type));
    const flowerR2 = (AESTHETIC.flowerRadius * T) ** 2;
    for (const c of this.world.characters) {
      c.inDark = false;
      if (!c.visible) continue;
      const task = c.task;
      const walking = Boolean(c.waypoints) && task?.phase === 'travel';
      const value = this.aestheticAt(c.tileX, c.tileY);
      const factor = Math.min(AESTHETIC.maxFactor, value / AESTHETIC.pleasantThreshold);
      // Güzel sokakta yürümek
      if (walking && value >= AESTHETIC.pleasantThreshold) {
        c.needs.fun = clamp(c.needs.fun + AESTHETIC.walkFunPerMinute * factor * minutes, 0, 100);
        this.maybeRemember(c, minutes, () => {
          const street = this.nearestStreet(c);
          this.state.landscape.strolls += 1;
          return { text: street ? `Güzel bir sokakta yürüdü (${street})` : 'Güzel bir sokakta yürüdü', icon: 'aesthetic' };
        });
      }
      // Bankta oturup manzarayı izlemek: güzel bir köşede keyif çok daha hızlı dolar
      if (task?.phase === 'perform' && task.activity === 'bench') {
        const bench = this.world.getBuilding(task.buildingId);
        if (bench && BENCH_TYPES.includes(bench.type) && value > 0) {
          c.needs.fun = clamp(c.needs.fun + AESTHETIC.benchFunPerMinute * factor * minutes, 0, 100);
          if (value >= AESTHETIC.pleasantThreshold) this.maybeRemember(c, minutes, () => ({ text: 'Bankta oturup manzarayı izledi', icon: 'smile' }));
        }
      }
      // Çiçek kokusu: saksı, çiçek tarhı, çiçekli çit ya da kiraz ağacının yanından geçerken / çiçek koklarken
      if ((walking || task?.activity === 'flowers') && flowers.some((f) => (f.center.x - c.x) ** 2 + (f.center.y - c.y) ** 2 <= flowerR2)) {
        this.maybeRemember(c, minutes, () => ({ text: 'Çiçek kokusunu içine çekti', icon: 'flower' }));
      }
      // Ağaç gölgesinde dinlenmek (etkinlik: shade; keyfi etkinliğin kendisi verir)
      if (task?.phase === 'perform' && task.activity === 'shade') {
        this.maybeRemember(c, minutes, () => ({ text: 'Ağaç gölgesinde serinleyip dinlendi', icon: 'smile' }));
      }
      // Karanlık sokak: gece ışıksız yerde yürüyen ürker
      if (dark && walking && !isLitPoint(lights, c.x, c.y)) {
        c.inDark = true;
        c.needs.fun = clamp(c.needs.fun - DARKNESS.funPerMinute * c.mood.scareMul * minutes, 0, 100); // (29.2) sarsılmış sakin iki kat ürker
      }
    }
  }

  /** Hafif güzel anı: olasılıkla ve aynı sakinde en fazla memoryCooldownDays günde bir. */
  maybeRemember(c, minutes, make) {
    if (this.rng.next() >= AESTHETIC.memoryChancePerMinute * minutes) return;
    const day = this.state.time.day;
    const last = [...(c.memories ?? [])].reverse().find((m) => m.kind === 'stroll');
    if (last && day - last.day < AESTHETIC.memoryCooldownDays) return;
    const { text, icon } = make();
    if ((c.memories ?? []).some((m) => m.text === text && day - m.day < AESTHETIC.memoryCooldownDays * 4)) return;
    const memory = addMemory(this.state, c, text, icon, { kind: 'stroll' });
    this.events.emit('landscape:memory', { character: c, memory });
  }

  /** Sakinin yakınındaki en yakın mahalle tabelasının adı (yoksa null). */
  nearestStreet(c) {
    let best = null;
    let bestD = STREET_SIGN_RADIUS * STREET_SIGN_RADIUS;
    for (const b of this.world.buildings) {
      if (b.type !== 'signpost' || !b.functional || !b.label) continue;
      const d = (b.tileX - c.tileX) ** 2 + (b.tileY - c.tileY) ** 2;
      if (d <= bestD) {
        bestD = d;
        best = b.label;
      }
    }
    return best;
  }
}
