// Bir karakterin sıradaki işine karar verir. Sonuç bir "plan"dır:
//   { activity, buildingId?, spot?: {x,y}, finalPoint?: {x,y}, allowBlockedGoal?,
//     reserve?, facing?, duration?, nap?, inviteId? }
// Planı uygulamak (yürümek, yapmak, bitirmek) src/systems/BehaviorSystem.js'in işidir.
//
// Öncelik sırası:
//   0. Kasabaya yeni geldiyse ya da evlenip eşinin evine taşınacaksa önce yeni evine yerleşmek
//   1. Çok açsa (Tokluk < 15) her şeyden önce yemek
//   2. Uyku saati geldiyse ya da enerjisi bittiyse eve dönüp uyumak
//   3. Sırtında yük varsa kilere bırakmak
//   2b. Akşam şenliği varsa (ve çok yorgun değilse) meydana koşmak
//   4. Acıktıysa (kişiye özel eşik) handa sıcak yemek, kilerden / evden yemek, stok yoksa böğürtlen
//   4b. Depoda ona ayrılmış boşta ekipman varsa atölyeye / kilere gidip kuşanmak (yetişkinler)
//   5. Mesai saatindeyse iş kuyruğu: şantiye > toplama emri > üretim binası
//      (kişiliğe göre ara sıra mola verir; çocuklar çalışmaz)
//   6. Yalnız hissediyorsa toplanma yerine gitmek, gerekirse birini davet etmek (çocuklar oynar)
//   7. Değilse kişiliğine göre ağırlıklı bir boş zaman etkinliği (çocuklar: oyun, çiçekler, yürüyüş)
import { ACTIVITIES } from '../data/activities.js';
import { MEAL_FOOD_COST } from '../data/resources.js';
import { WORK_SESSION } from '../data/jobs.js';
import { isBedtime, isWorkHours } from './TraitProfile.js';
import { getSeason } from '../data/seasons.js';

// Çocukların oyun oynadığı yerler: bu yapıların çevresi ve meydan
const PLAYGROUND_TYPES = ['fountain', 'campfire', 'inn', 'monument'];
const PLAZA_PLAY_RADIUS = 8; // meydan merkezine bu kadar karo yakın yollar da oyun yeridir

// Boş zamanda gidilen yapılar: etkinlik -> yapı türü (yalnızca kullanılabilir hâldeyse seçilir)
const LANDMARK_LEISURE = new Map([
  ['monument', 'monument'],
  ['ancientSpring', 'ancientFountain'],
  ['campRest', 'supplyCamp'],
]);

const GATHERING_ACTIVITIES = ['campfire', 'fountain', 'inn'];
const INN_MEAL_PREFERENCE = 0.5; // handaki sıcak yemek, yol maliyeti yarıymış gibi tercih edilir
const EVENING_START = 17;
const EVENING_END = 2;
const PARTNER_SOCIAL_LIMIT = 92;
const FESTIVAL_MIN_ENERGY = 12; // bundan yorgun olan şenliğe gitmez, uyur

export class Brain {
  /**
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   * @param {{ economy: import('../systems/EconomySystem.js').EconomySystem, jobs: import('../systems/JobSystem.js').JobSystem,
   *   relationships: import('../systems/RelationshipSystem.js').RelationshipSystem,
   *   crafting: import('../systems/CraftingSystem.js').CraftingSystem }} services
   */
  constructor(world, rng, { economy, jobs, relationships, crafting }) {
    this.world = world;
    this.rng = rng;
    this.economy = economy;
    this.jobs = jobs;
    this.relationships = relationships;
    this.crafting = crafting;
  }

  decide(c, hour) {
    const { needs, profile } = c;
    const bedtime = isBedtime(profile, hour);

    if (c.newcomer || c.relocating) {
      const plan = this.planMoveIn(c);
      if (plan) return plan;
      c.newcomer = false;
      c.relocating = false;
    }
    if (needs.hunger < 15) {
      const plan = this.planEat(c);
      if (plan) return plan;
    }
    if (this.world.state.events.festival.active && needs.energy > FESTIVAL_MIN_ENERGY) {
      const plan = this.planFestival(c);
      if (plan) return plan;
    }
    if (bedtime || needs.energy < profile.thresholds.energy) {
      const plan = this.planSleep(c, !bedtime);
      if (plan) return plan;
    }
    if (c.carrying) {
      const plan = this.planHaul(c);
      if (plan) return plan;
    }
    if (needs.hunger < profile.thresholds.hunger) {
      const plan = this.planEat(c);
      if (plan) return plan;
    }
    if (!c.isChild) {
      const plan = this.planEquip(c);
      if (plan) return plan;
    }

    let onBreak = false;
    if (isWorkHours(hour) && !c.isChild) {
      if (this.rng.next() >= profile.work.breakChance) {
        const plan = this.planWork(c);
        if (plan) return plan;
      } else {
        onBreak = true;
      }
    }
    if (needs.social < profile.thresholds.social && !c.isChild) {
      const plan = this.planSocial(c, hour);
      if (plan) return { ...plan, onBreak };
    }
    const leisure = this.planLeisure(c, hour);
    return leisure ? { ...leisure, onBreak } : this.planWait();
  }

  /** Boş zaman etkinliğini yarıda kesmeyi gerektiren bir durum var mı? */
  hasUrgentNeed(c, hour) {
    const { needs, profile } = c;
    return (
      isBedtime(profile, hour) ||
      needs.energy < profile.thresholds.energy - 5 ||
      needs.hunger < profile.thresholds.hunger - 5
    );
  }

  /**
   * Bu karakter şu an sohbete davet edilebilir mi? Mesai saatinde yalnızca molada olanlar
   * davet edilir (kimse çalışanı işinden alıkoymasın).
   */
  isAvailableForChat(c, hour) {
    if (c.isChild || c.insideBuildingId || !c.visible || isBedtime(c.profile, hour)) return false;
    if (c.needs.social >= PARTNER_SOCIAL_LIMIT) return false;
    if (isWorkHours(hour) && !c.task?.onBreak) return false;
    if (!c.task) return true;
    const kind = ACTIVITIES[c.task.activity].kind;
    return kind === 'leisure' || kind === 'idle';
  }

  // ---------------------------------------------------------------------------
  // Plan oluşturucular
  // ---------------------------------------------------------------------------

  planWait() {
    return { activity: 'wait', duration: this.durationFor('wait') };
  }

  planSleep(c, nap) {
    const home = this.world.getBuilding(c.homeId);
    if (!home) return null;
    if (c.insideBuildingId === home.id) return { activity: 'sleep', buildingId: home.id, nap };
    const doors = this.world.getSpots(home);
    if (doors.length === 0) return null;
    return {
      activity: 'sleep',
      buildingId: home.id,
      nap,
      spot: this.nearest(doors, c),
      finalPoint: home.entrancePoint,
    };
  }

  /** Acıkınca: stokta yiyecek varsa evde / kilerde yemek (daha hızlı), yoksa böğürtlen. */
  planEat(c) {
    const meal = this.planMeal(c);
    const berries = this.planBerries(c);
    if (meal && berries) return berries.cost < meal.cost * 0.4 ? berries : meal;
    return meal ?? berries;
  }

  /**
   * Oturup yemek: pişmiş yemeği olan han (tercih edilir, sıcak yemek), kiler ya da ev (kilerden 3 yiyecek).
   * En kısa yol seçilir; han yolu yarı maliyetli sayılır.
   */
  planMeal(c) {
    const origin = this.originTile(c);
    const places = [];
    for (const inn of this.world.getCompleted('inn')) if (inn.meals > 0) places.push({ place: inn, activity: 'innMeal' });
    if (this.economy.amount('food') >= MEAL_FOOD_COST) {
      for (const storage of this.world.getCompleted('storage')) places.push({ place: storage, activity: 'meal' });
      const home = this.world.getBuilding(c.homeId);
      if (home && !home.underConstruction) places.push({ place: home, activity: 'meal' });
    }

    let best = null;
    for (const { place, activity } of places) {
      // Zaten oradaysa yürümeden yer
      if (c.insideBuildingId === place.id) return { activity, buildingId: place.id, cost: 0, duration: this.durationFor(activity) };
      const doors = this.world.getSpots(place);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path) * (activity === 'innMeal' ? INN_MEAL_PREFERENCE : 1);
      if (!best || cost < best.cost) best = { place, activity, spot, cost };
    }
    if (!best) return null;
    return {
      activity: best.activity,
      buildingId: best.place.id,
      spot: best.spot,
      finalPoint: best.place.entrancePoint,
      cost: best.cost,
      duration: this.durationFor(best.activity),
    };
  }

  /** Taşıdığı yükü en yakın kilere bırakma planı. */
  planHaul(c) {
    const origin = this.originTile(c);
    let best = null;
    for (const storage of this.world.getCompleted('storage')) {
      const doors = this.world.getSpots(storage);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path);
      if (!best || cost < best.cost) best = { storage, spot, cost };
    }
    if (!best) return null;
    return {
      activity: 'haul',
      cargo: c.carrying.resource,
      buildingId: best.storage.id,
      spot: best.spot,
      faceTarget: best.storage.entrancePoint,
      duration: this.durationFor('haul'),
    };
  }

  /** İş kuyruğundan bir iş ya da üretim binasında boş bir koltuk. */
  planWork(c) {
    const found = this.jobs.findWorkFor(c, this.originTile(c));
    if (!found) return null;
    const duration = this.rng.int(WORK_SESSION[0], WORK_SESSION[1]);
    if (found.job) {
      return {
        activity: found.job.type,
        jobId: found.job.id,
        buildingId: found.job.buildingId ?? null,
        spot: found.spot,
        reserve: true,
        faceTarget: this.jobs.targetCenter(found.job),
        duration,
      };
    }
    const building = found.building;
    return {
      activity: building.definition.workActivity,
      buildingId: building.id,
      workBuildingId: building.id,
      spot: found.spot,
      reserve: true,
      faceTarget: building.center,
      // iskele ucu / ocağın kaya yüzü önü; handa aşçı kapıdan içeri girer
      finalPoint: this.freeWorkPoint(building, c) ?? (ACTIVITIES[building.definition.workActivity].indoor ? building.entrancePoint : undefined),
      facing: building.workFacing,
      duration,
    };
  }

  /** Yapının diğer çalışanların tutmadığı ilk çalışma noktası (tanımlı değilse undefined). */
  freeWorkPoint(building, c) {
    const points = building.workPoints;
    if (points.length === 0) return undefined;
    const taken = [...building.workerIds]
      .filter((id) => id !== c.id)
      .map((id) => this.world.getCharacter(id)?.task?.finalPoint)
      .filter(Boolean);
    return points.find((p) => !taken.some((t) => t.x === p.x && t.y === p.y)) ?? points[0];
  }

  /** Yeni gelen sakin kenardaki yoldan yürüyüp evine yerleşir; evlenen sakin eşiyle paylaşacağı eve taşınır. */
  planMoveIn(c) {
    const home = this.world.getBuilding(c.homeId);
    if (!home) return null;
    const activity = c.newcomer ? 'moveIn' : 'relocate';
    if (c.insideBuildingId === home.id) return { activity, buildingId: home.id, duration: this.durationFor(activity) };
    const doors = this.world.getSpots(home);
    if (doors.length === 0) return null;
    return {
      activity,
      buildingId: home.id,
      spot: this.nearest(doors, c),
      finalPoint: home.entrancePoint,
      duration: this.durationFor(activity),
    };
  }

  /**
   * Depoda bu sakine ayrılmış boşta ekipman varsa en yakın atölyeye / kilere gidip kuşanma planı.
   * Alınacak yer yoksa (atölye yıkılmış) olduğu yerde kuşanır.
   */
  planEquip(c) {
    const item = this.crafting.itemFor(c);
    if (!item) return null;
    const plan = { activity: 'equip', item, duration: this.durationFor('equip') };
    const origin = this.originTile(c);
    let best = null;
    for (const place of this.crafting.pickupPlaces()) {
      const doors = this.world.getSpots(place);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path);
      if (!best || cost < best.cost) best = { place, spot, cost };
    }
    if (!best) return plan;
    return { ...plan, buildingId: best.place.id, spot: best.spot, faceTarget: best.place.entrancePoint };
  }

  planBerries(c) {
    const origin = this.originTile(c);
    let best = null;
    for (const bush of this.world.getBuildingsOfType('berryBush')) {
      // Toplama emri verilmiş çalıdan atıştırılmaz (kilere gidecek)
      if (bush.berries <= 0 || this.jobs.jobAt(bush.tileX, bush.tileY)) continue;
      const spots = this.world.freeSpots(bush, c.id);
      if (spots.length === 0) continue;
      const spot = this.nearest(spots, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path);
      if (!best || cost < best.cost) best = { bush, spot, cost };
    }
    if (!best) return null;
    return {
      activity: 'eat',
      buildingId: best.bush.id,
      spot: best.spot,
      reserve: true,
      cost: best.cost,
      duration: this.durationFor('eat'),
    };
  }

  planSocial(c, hour) {
    const gatherings = this.availableGatherings();

    // Önce zaten insanların toplandığı yere katıl
    let best = null;
    for (const building of gatherings) {
      const count = this.participants(building, c).length;
      if (count === 0 || this.world.freeGatherSpots(building, c.id).length === 0) continue;
      const rank = count + (building.type === 'inn' ? 1.5 : building.type === 'campfire' ? 0.5 : 0);
      const better = !best || rank > best.count;
      if (better) best = { building, count: rank };
    }
    if (best) return this.planGathering(c, best.building);

    // Kimse yoksa uygun birini davet et
    const campfire = gatherings.find((b) => b.type === 'campfire');
    const fountain = gatherings.find((b) => b.type === 'fountain');
    const inn = gatherings.find((b) => b.type === 'inn');
    const evening = hour >= EVENING_START || hour < EVENING_END;
    // Akşamları han kamp ateşinden de çok sevilir
    const place = evening ? inn ?? campfire ?? fountain : fountain ?? campfire ?? inn;
    if (!place) return null;

    const plan = this.planGathering(c, place);
    if (!plan) return null;
    const partner = this.findPartner(c, hour);
    if (partner) plan.inviteId = partner.id;
    return plan;
  }

  /**
   * Toplanma yerine (havuz/ateş) gitme planı.
   * - Havuzda sohbet edenler yan yana durur: nearSpot (davet edenin yeri) verilirse ona en yakın boş yer.
   * - Ateş başında herkes ateşe döner: dolu yerlerin yanına ceza verilerek çember boyunca yayılırlar.
   */
  planGathering(c, building, nearSpot = null, mode = 'gather') {
    const spots = this.world.freeGatherSpots(building, c.id, mode);
    if (spots.length === 0) return null;
    const spread = mode === 'festival' || Boolean(ACTIVITIES[building.type].faceBuilding);
    const reference = spread || !nearSpot ? this.originTile(c) : nearSpot;
    const taken = spread ? this.world.getGatherSpots(building, mode).filter((s) => this.world.isReserved(s.x, s.y, c.id)) : [];
    const crowding = (spot) => taken.filter((t) => Math.max(Math.abs(t.x - spot.x), Math.abs(t.y - spot.y)) <= 1).length;
    const score = (spot) => Math.sqrt(distanceSq(spot, reference)) + crowding(spot) * 4;
    const ordered = [...spots]
      .filter((s) => !nearSpot || s.x !== nearSpot.x || s.y !== nearSpot.y)
      .sort((a, b) => score(a) - score(b));
    if (ordered.length === 0) return null;
    return {
      activity: building.type,
      buildingId: building.id,
      spot: ordered[0],
      reserve: true,
      duration: this.durationFor(building.type),
    };
  }

  /** Şenlik yerine gidip bitene kadar dans etmek. */
  planFestival(c) {
    const festival = this.world.state.events.festival;
    const venue = this.world.getBuilding(festival.venueId);
    if (!venue) return null;
    const plan = this.planGathering(c, venue, null, 'festival');
    if (!plan) return null;
    return { ...plan, activity: 'festival', duration: Math.max(10, festival.endsAt - this.world.state.totalMinutes) };
  }

  planLeisure(c, hour) {
    const weights = { ...c.profile.leisure };
    // Mevsim tercihleri: kışın nehir ve çiçek yerine ateş başı ve han, yazın nehir kenarı
    for (const [name, m] of Object.entries(getSeason(this.world.state.time.day).leisure)) weights[name] = (weights[name] ?? 0) * m;
    const campfire = this.world.getBuildingsOfType('campfire')[0];
    const evening = hour >= EVENING_START + 1 || hour < EVENING_END;
    if (!campfire?.lit) weights.campfire = 0;
    else if (evening) weights.campfire *= 4;
    const inn = this.world.getCompleted('inn').find((b) => b.lit);
    if (!inn) weights.inn = 0;
    else if (evening) weights.inn *= 5;
    // Anıt, kadim çeşme ve erzak kampı yalnızca kullanılabilir hâldeyse
    for (const [activity, type] of LANDMARK_LEISURE) {
      if (this.world.getCompleted(type).length === 0) weights[activity] = 0;
    }
    for (const building of this.availableGatherings()) {
      if (this.participants(building, c).length > 0) weights[building.type] *= 1.6;
    }

    const options = Object.entries(weights).filter(([name, w]) => w > 0 && ACTIVITIES[name]);
    while (options.length > 0) {
      const choice = this.rng.weighted(options);
      const plan = this.resolveLeisure(c, choice, hour);
      if (plan) return plan;
      options.splice(options.findIndex(([name]) => name === choice), 1);
    }
    return null;
  }

  resolveLeisure(c, activity, hour) {
    const duration = this.durationFor(activity);
    switch (activity) {
      case 'bench': {
        const benches = this.world
          .getCompleted('bench')
          .filter((b) => this.world.freeSpots(b, c.id).length > 0);
        if (benches.length === 0) return null;
        const bench = this.nearest(benches.map((b) => ({ x: b.tileX, y: b.tileY, bench: b })), c).bench;
        return {
          activity,
          buildingId: bench.id,
          spot: { x: bench.tileX, y: bench.tileY },
          allowBlockedGoal: true,
          finalPoint: bench.seatPoint,
          reserve: true,
          facing: 'down',
          duration,
        };
      }
      case 'river':
      case 'flowers': {
        const pool = activity === 'river' ? this.world.riverbankSpots : this.world.flowerSpots;
        const spot = this.pickNearby(pool, c, 26);
        if (!spot) return null;
        return { activity, spot, reserve: true, facing: spot.facing ?? 'down', duration };
      }
      case 'monument':
      case 'ancientSpring':
      case 'campRest': {
        // Anıtı gururla seyreder, kadim çeşmede tazelenir ya da erzak kampında soluklanır
        const places = this.world.getCompleted(LANDMARK_LEISURE.get(activity)).map((b) => ({ x: b.tileX, y: b.tileY, building: b }));
        if (places.length === 0) return null;
        const place = this.nearest(places, c).building;
        const spots = this.world.freeGatherSpots(place, c.id);
        if (spots.length === 0) return null;
        return { activity, buildingId: place.id, spot: this.nearest(spots, c), reserve: true, duration };
      }
      case 'fountain':
      case 'inn':
      case 'campfire': {
        const building = this.availableGatherings().find((b) => b.type === activity);
        return building ? this.planGathering(c, building) : null;
      }
      case 'play': {
        // Çocuklar meydanda, havuzun, ateşin ve hanın çevresinde koşuşturur
        const spot = this.pickNearby(this.playSpots(), c, 30);
        if (!spot) return null;
        return { activity, spot, reserve: true, facing: this.rng.pick(['down', 'left', 'right']), duration };
      }
      case 'stroll': {
        const candidates = this.world.strollSpots.filter((s) => {
          const d = Math.sqrt(distanceSq(s, { x: c.tileX, y: c.tileY }));
          return d >= 6 && d <= 20;
        });
        if (candidates.length === 0) return null;
        const spot = this.rng.pick(candidates);
        return { activity, spot, facing: this.rng.pick(['down', 'left', 'right']), duration };
      }
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Yardımcılar
  // ---------------------------------------------------------------------------

  durationFor(activity) {
    const range = ACTIVITIES[activity].duration;
    return range ? this.rng.int(range[0], range[1]) : 0;
  }

  /** Planın başlayacağı karo: evdeyse kapı önü, değilse bulunduğu karo. */
  originTile(c) {
    if (c.insideBuildingId) {
      const home = this.world.getBuilding(c.insideBuildingId);
      const door = home && this.world.getSpots(home)[0];
      if (door) return door;
    }
    return { x: c.tileX, y: c.tileY };
  }

  nearest(items, c) {
    const origin = this.originTile(c);
    return items.reduce((best, item) => (distanceSq(item, origin) < distanceSq(best, origin) ? item : best));
  }

  /** Yakındaki boş noktalardan rastgele birini seçer (hep aynı yere gidilmesin). */
  pickNearby(pool, c, maxDistance) {
    const origin = this.originTile(c);
    const free = pool.filter(
      (s) => !this.world.isReserved(s.x, s.y, c.id) && distanceSq(s, origin) <= maxDistance * maxDistance
    );
    if (free.length === 0) return null;
    free.sort((a, b) => distanceSq(a, origin) - distanceSq(b, origin));
    return this.rng.pick(free.slice(0, 8));
  }

  /** Çocukların oyun yerleri: toplanma yapılarının çevresi ve meydana yakın yollar. */
  playSpots() {
    const spots = [];
    for (const building of this.world.getCompleted()) {
      if (PLAYGROUND_TYPES.includes(building.type)) spots.push(...this.world.getGatherSpots(building));
    }
    const plaza = this.world.landmarks.plaza;
    const center = { x: plaza.centerX, y: plaza.centerY };
    for (const s of this.world.strollSpots) {
      if (distanceSq(s, center) <= PLAZA_PLAY_RADIUS * PLAZA_PLAY_RADIUS) spots.push(s);
    }
    return spots;
  }

  /** Şu an kullanılabilen toplanma yerleri (ateş yalnızca yanarken, han akşamları açıkken). */
  availableGatherings() {
    return this.world
      .getCompleted()
      .filter((b) => GATHERING_ACTIVITIES.includes(b.type) && (b.type === 'fountain' || b.lit));
  }

  /** Bir toplanma yerinde olan ya da oraya giden diğer karakterler. */
  participants(building, except) {
    return this.world.characters.filter(
      (o) => o !== except && o.task?.buildingId === building.id && GATHERING_ACTIVITIES.includes(o.task.activity)
    );
  }

  /** Sohbete çağrılacak uygun kişi: yakın olan, ama dost olduğu kişiler öne geçer. */
  findPartner(c, hour) {
    let best = null;
    for (const other of this.world.characters) {
      if (other === c || !this.isAvailableForChat(other, hour)) continue;
      const rank = Math.sqrt(distanceSq(other, c)) - this.relationships.get(c, other) * 0.8;
      if (!best || rank < best.rank) best = { other, rank };
    }
    return best?.other ?? null;
  }
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
