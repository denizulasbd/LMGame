// Aile kurma (9. aşama): evliliğin sonuçları, Mutlu Yuva, çocuklar ve büyüme.
//
//   Düğün      : 'relationship:married' gelince çiftin ve kasabanın keyfi artar; çift aynı eve taşınır.
//                Yer yoksa (iki evde de boş yatak yok) bekâr bir ev arkadaşıyla yer değiştirilir; o da
//                olmazsa her sabah, yeni bir kulübe tamamlanınca ya da bir ev Taş Ev'e yükseltilince
//                yeniden denenir. Taşınan sakin 'relocate' etkinliğiyle yeni evine yürür.
//   Mutlu Yuva : eşiyle aynı evde uyuyan ya da akşam aynı toplanma yerinde vakit geçiren sakin ertesi
//                sabah keyifle uyanır ve bir süre keyfi yavaş azalır (buffs.happyHome; NeedsSystem uygular).
//   Çocuklar   : her sabah 07:00'de aynı evde yaşayan, evinde boş yatak olan evli çiftlere kasaba refahı
//                yüksekse belli bir olasılıkla bir çocuk katılır (ev doluysa bekâr bir ev arkadaşı boş yatağı
//                olan başka bir eve geçip yer açar). Çocuk evde uyanır, çalışmaz, oynar; birkaç gün sonra
//                büyüyüp yetişkin olur.
// Yayınladığı olaylar: 'family:homeShared' { a, b, home, swapped?, vacated? (boşalan evler) }, 'family:madeRoom' { character, from, to },
//   'family:childBorn' { child, parents, home }, 'family:grownUp' { character }, 'population:changed'.
import { activePopulation } from './LifeStages.js';
import { pickName, unavailableNames } from './Residents.js';
import { Character } from '../entities/Character.js';
import { HAPPY_HOME, CHILDREN, CHILD_SHIRTS, CHILD_HAIR_STYLES } from '../data/family.js';
import { MARRIAGE } from '../data/relationships.js';
import { ACTIVITIES } from '../data/activities.js';
import { APPEARANCE_PARTS, NEED_KEYS, TRAITS } from '../data/characters.js';
import { partnerOf, childrenOf } from './RelationshipSystem.js';
import { townHappiness, immigrationLimit } from './TownStatus.js';
import { clashesWithOwn } from '../ai/TraitProfile.js';
import { clamp } from '../utils/math.js';

const TOGETHER_KINDS = new Set(['social', 'festival']);

export class FamilySystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('relationship:married', (event) => this.onMarried(event)),
      on('character:woke', ({ character }) => this.onWoke(character)),
      on('time:hour', (hour) => {
        if (hour === CHILDREN.birthHour) {
          this.reuniteCouples();
          this.tryBirths();
        }
      }),
      on('building:completed', (building) => {
        if (building.capacity) this.reuniteCouples();
      }),
      on('building:upgraded', ({ building }) => {
        if (building.capacity) this.reuniteCouples();
      }),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    const now = this.state.totalMinutes;
    for (const c of this.world.characters) {
      if (c.isChild && now >= c.growsUpAt) this.growUp(c);
    }
    this.markTogetherness(tick.hour);
  }

  /** Evli çiftlerin birlikte geçirdiği zamanı işaretler: sabah Mutlu Yuva moraliyle uyanırlar. */
  markTogetherness(hour) {
    const evening = hour >= HAPPY_HOME.eveningFrom || hour < MARRIAGE.eveningTo;
    for (const a of this.world.characters) {
      if (!a.married || a.buffs.cozyNight) continue;
      const b = partnerOf(this.state, a);
      if (!b) continue;
      const sleepingTogether = a.isSleeping && b.isSleeping && a.insideBuildingId !== null && a.insideBuildingId === b.insideBuildingId;
      const eveningTogether =
        evening &&
        a.task?.phase === 'perform' &&
        b.task?.phase === 'perform' &&
        TOGETHER_KINDS.has(ACTIVITIES[a.task.activity].kind) &&
        a.task.buildingId === b.task.buildingId;
      if (sleepingTogether || eveningTogether) {
        a.buffs.cozyNight = true;
        b.buffs.cozyNight = true;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Düğün ve aynı eve taşınma
  // ---------------------------------------------------------------------------

  onMarried({ a, b }) {
    const now = this.state.totalMinutes;
    for (const c of this.world.characters) {
      const amount = c === a || c === b ? MARRIAGE.coupleFun : MARRIAGE.townFun;
      c.needs.fun = clamp(c.needs.fun + amount, 0, 100);
    }
    for (const c of [a, b]) c.buffs.happyHome = now + HAPPY_HOME.hours * 60;
    this.moveTogether(a, b);
  }

  /** Ayrı evlerde yaşayan evli çiftleri yeniden aynı eve taşımayı dener. */
  reuniteCouples() {
    for (const a of this.world.characters) {
      const b = partnerOf(this.state, a);
      if (b && a.married && a.id < b.id && a.homeId !== b.homeId && !a.isVenerable && !b.isVenerable) this.moveTogether(a, b);
    }
  }

  freeBeds(home, leaving = []) {
    const residents = this.world.getResidents(home).filter((c) => !leaving.includes(c));
    return home.capacity - residents.length;
  }

  /**
   * Çifti aynı eve yerleştirir: birinin evinde boş yer varsa öteki oraya, yoksa en az iki boş yataklı
   * bir eve ikisi birden (Taş Ev öncelikli, çocuklara yer kalsın), o da yoksa bekâr bir ev arkadaşıyla
   * yer değiştirerek. Başarılıysa true.
   */
  moveTogether(a, b) {
    if (a.homeId !== null && a.homeId === b.homeId) return true;
    if (a.isVenerable || b.isVenerable) return false; // (28.3) Saygın Büyük yatağını bıraktı: çift yeniden aynı eve taşınmaz
    const homes = this.world.getCompleted('cabin');
    const homeA = this.world.getBuilding(a.homeId);
    const homeB = this.world.getBuilding(b.homeId);
    const options = [];
    if (homeA?.functional && this.freeBeds(homeA) >= 1) options.push({ home: homeA, movers: [b] });
    if (homeB?.functional && this.freeBeds(homeB) >= 1) options.push({ home: homeB, movers: [a] });
    for (const home of homes) {
      if (home === homeA || home === homeB) continue;
      if (this.freeBeds(home) >= 2) options.push({ home, movers: [a, b] });
    }
    if (options.length > 0) {
      const score = ({ home, movers }) => this.freeBeds(home) - movers.length + (home.upgraded ? 2 : 0) - movers.length * 0.5;
      const best = options.reduce((x, y) => (score(y) > score(x) ? y : x));
      const left = best.movers.map((c) => this.world.getBuilding(c.homeId)).filter((h) => h && h !== best.home);
      for (const c of best.movers) this.relocate(c, best.home);
      // (19. aşama) taşınanların boşalan eski evi göçmenlere açılır (SocialSystem bildirir)
      const vacated = [...new Set(left)].filter((h) => this.world.getResidents(h).length === 0);
      this.events.emit('family:homeShared', { a, b, home: best.home, vacated });
      return true;
    }
    // Yer değiştirme: A'nın evindeki bekâr bir ev arkadaşı B'nin yatağına geçer (ya da tersi)
    for (const [stay, move, stayHome, moveHome] of [[a, b, homeA, homeB], [b, a, homeB, homeA]]) {
      if (!stayHome || !moveHome) continue;
      const mate = this.world
        .getResidents(stayHome)
        .find((c) => c !== stay && !c.isChild && c.partnerId === null && childrenOf(this.state, c).every((k) => k.homeId !== stayHome.id));
      if (!mate) continue;
      this.relocate(mate, moveHome);
      this.relocate(move, stayHome);
      this.events.emit('family:homeShared', { a, b, home: stayHome, swapped: mate });
      return true;
    }
    return false;
  }

  relocate(c, home) {
    if (c.homeId === home.id) return;
    c.homeId = home.id;
    c.relocating = true;
  }

  // ---------------------------------------------------------------------------
  // Mutlu Yuva
  // ---------------------------------------------------------------------------

  onWoke(c) {
    if (!c.buffs.cozyNight) return;
    delete c.buffs.cozyNight;
    c.buffs.happyHome = this.state.totalMinutes + HAPPY_HOME.hours * 60;
    c.needs.fun = clamp(c.needs.fun + HAPPY_HOME.wakeFun, 0, 100);
  }

  // ---------------------------------------------------------------------------
  // Çocuklar
  // ---------------------------------------------------------------------------

  /**
   * Bu sabah çocuk sahibi olabilecek çiftler: [{ a, b, home }]. Evi dolu olan çift için evdeki bekâr
   * bir ev arkadaşı başka bir evdeki boş yatağa geçerek yer açar.
   */
  /** (34.2) Doğum sınırı: bugünkü 30 ya da (parsel kotasıyla büyümüş) göç sınırı, hangisi büyükse; hiçbir kasabanın sınırı düşmez. */
  birthLimit() {
    return Math.max(CHILDREN.maxPopulation, immigrationLimit(this.state));
  }

  eligibleCouples() {
    const now = this.state.totalMinutes;
    if (activePopulation(this.state) >= this.birthLimit()) return [];
    if (townHappiness(this.state) < CHILDREN.minHappiness) return [];
    const couples = [];
    for (const a of this.world.characters) {
      const b = partnerOf(this.state, a);
      if (!b || !a.married || a.id > b.id || a.homeId !== b.homeId) continue;
      const home = this.world.getBuilding(a.homeId);
      if (!home?.functional) continue;
      if (now - a.marriedAt < CHILDREN.minDaysMarried * 1440) continue;
      if (a.lastChildAt !== null && now - a.lastChildAt < CHILDREN.minDaysBetween * 1440) continue;
      const kids = childrenOf(this.state, a).filter((k) => k.parentIds.includes(b.id));
      if (kids.length >= CHILDREN.maxPerCouple) continue;
      if (this.freeBeds(home) < 1 && !this.makeRoom(home, [a, b])) continue;
      couples.push({ a, b, home });
    }
    return couples;
  }

  /** Dolu aile evindeki bekâr bir yetişkin, evli çift barınmayan başka bir evin boş yatağına taşınır. */
  makeRoom(home, couple) {
    const mover = this.world
      .getResidents(home)
      .find((c) => !couple.includes(c) && !c.isChild && c.partnerId === null && !couple.some((p) => c.parentIds.includes(p.id)));
    if (!mover) return false;
    const target = this.world
      .getCompleted('cabin')
      .find((h) => h !== home && this.freeBeds(h) >= 1 && !this.world.getResidents(h).some((c) => c.married));
    if (!target) return false;
    this.relocate(mover, target);
    this.events.emit('family:madeRoom', { character: mover, from: home, to: target });
    return true;
  }

  tryBirths() {
    for (const { a, b, home } of this.eligibleCouples()) {
      if (activePopulation(this.state) >= this.birthLimit()) return;
      if (this.rng.next() < CHILDREN.chancePerDay) this.welcomeChild(a, b, home);
    }
  }

  /** Aileye yeni bir çocuk katılır: evde, yatağında uyurken belirir. */
  welcomeChild(a, b, home) {
    const now = this.state.totalMinutes;
    const parents = this.rng.next() < 0.5 ? [a, b] : [b, a];
    const days = this.rng.int(CHILDREN.growDays[0], CHILDREN.growDays[1]);
    const child = new Character({
      name: this.pickName(),
      age: 5,
      traits: this.inheritTraits(a, b),
      appearance: {
        hair: this.rng.pick(CHILD_HAIR_STYLES),
        hairColor: parents[0].appearance.hairColor === 'gray' ? parents[1].appearance.hairColor : parents[0].appearance.hairColor,
        skin: parents[1].appearance.skin,
        shirt: this.rng.pick(CHILD_SHIRTS),
        pants: this.rng.pick(APPEARANCE_PARTS.pants),
      },
      needs: Object.fromEntries(NEED_KEYS.map((k) => [k, 95])),
      homeId: home.id,
      growsUpAt: now + days * 1440,
      parentIds: [a.id, b.id],
    });
    const entrance = home.entrancePoint;
    child.x = entrance.x;
    child.y = entrance.y;
    child.visible = false;
    child.pose = 'hidden';
    child.insideBuildingId = home.id;
    child.task = { activity: 'sleep', buildingId: home.id, phase: 'perform', elapsed: 0 };
    child.activityLabel = ACTIVITIES.sleep.label;
    home.occupants.add(child.id);
    this.state.characters.push(child);
    a.lastChildAt = now;
    b.lastChildAt = now;

    this.events.emit('population:changed', this.state.characters.length);
    this.events.emit('family:childBorn', { child, parents: [a, b], home });
    this.events.emit('toast', { text: `${a.name} ve ${b.name} ailesine küçük ${child.name} katıldı!`, tone: 'success', icon: 'love' });
  }

  /** Her ebeveynden bir kişilik özelliği (birbiriyle çatışmayan); ortak özellik varsa bir tane daha rastgele. */
  inheritTraits(a, b) {
    const traits = [];
    for (const parent of [a, b]) {
      const options = parent.traits.filter((t) => TRAITS[t] && !traits.includes(t) && !clashesWithOwn(traits, t));
      if (options.length) traits.push(this.rng.pick(options));
    }
    if (traits.length < 2) {
      const extra = this.rng.shuffle(Object.keys(TRAITS)).find((t) => !traits.includes(t) && !clashesWithOwn(traits, t));
      if (extra) traits.push(extra);
    }
    return traits;
  }

  /** (33.1) Yeni doğana büyük ad havuzundan boştaki bir ad (kasabadakilerle ve son ayrılanlarla çakışmaz). */
  pickName() {
    return pickName(this.rng, unavailableNames(this.state));
  }

  growUp(c) {
    c.growUp();
    this.events.emit('family:grownUp', { character: c });
    this.events.emit('toast', { text: `${c.name} büyüdü! Artık kasabanın genç bir sakini; çalışabilir.`, tone: 'success', icon: 'star' });
  }
}
