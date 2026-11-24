// Karakterlerin durum makinesi. Her karakterin bir görevi (task) vardır:
//
//   (görev yok) --Brain.decide--> travel --hedefe vardı--> perform --bitti--> (görev yok)
//                                    \__ acil ihtiyaç doğdu (boş zaman / iş ise) __/
//
//   travel : yol noktalarını MovementSystem yürütür; yürürken kazanım olabilir (yürüyüş keyfi)
//   perform: etkinlik sürer; ihtiyaç kazanımları, sohbet, çalışma, ifade balonları burada işlenir
//
// "İçeride" geçen etkinlikler (uyku, evde yemek, yeni eve yerleşme): karakter kapıdan girip
// görünmez olur, bir sonraki planda kapıdan çıkar.
//
// 10. aşama: üretim yapılarının yan ürünü (ağılda yiyecek, madende taş: production.extra), değirmen-fırında
// işleme (processing: 1 yiyecek -> 1 ekmek), öğünlerin yiyecek değeriyle ödenmesi (önce ekmek: "taze ekmekle
// yemek", biraz da keyif verir) ve belediyenin iş verimi (townWorkMultiplier).
//
// 11. aşama: hasta sakinin şifacıda tedavisi (heal: içeride bir iksir, bitince Dinçlik), şifacının işi (doğadan ot
// toplama gatherHerbs, kulübede iksir hazırlama brew), hastalığın / Dinçliğin çalışma hızına etkisi, Zanaat Loncası
// fermanının üretim ve deneyim çarpanı ve keşif seferi (expedition: harita kenarına yürüyüp bir gün görünmez olur).
//
// Uyku bitince 'character:woke' { character } yayınlanır (FamilySystem Mutlu Yuva'yı verir). Oyuncu bir
// çalışanı işten çıkarınca ('ui:dismissWorker') görevi biter ve o yapıda bir daha çalışmaz
// ('ui:rehireWorker' geri alır).
//
// 21. aşama: biten her vardiya 'work:shiftEnded' { character, activity, building }, bitirilen iş emri 'work:jobDone'
// { character, job, yields } yayınlar (PurseSystem yevmiye öder); etkinliğin finishEvent'i bitince yayınlanır (çantadan
// yemek, alışveriş, yağma). İsyan başlayınca / yağma baskını çıkınca isyancılar elindeki (yarıda kesilebilen) işi bırakır.
//
// 23. aşama: yangında kova taşıyanlar ('fetchWater' / 'fightFire', kind 'crisis': yarıda kesilmez) ve yaralının şifacıda tedavisi
// ('tendWound'); 'crisis:bucketFilled' / 'crisis:bucketThrown' / 'crisis:treated' etkinlik olaylarını CrisisSystem uygular. Yangın
// başlayınca yanan yapıdaki çalışanlar ve koşacak sakinler elindekini bırakır; yangın bitince kova taşıyanların görevi biter.
// Gözcü Kulesi'nde nöbet ('patrol', work) üretim yapmaz.
import { towerMasteryMultiplier, recordTowerWork, towerStageIndex } from './GoldenAge.js';
import { skillLevel } from './SkillSystem.js';
import { engineOn } from './Engines.js';
import { ACTIVITIES, LEAVING_HOME_LABEL, BREAK_PREFIX, LOVE_BUBBLES, RIVAL_BUBBLES } from '../data/activities.js';
import { RESOURCES, MEAL_FOOD_COST } from '../data/resources.js';
import { EQUIPMENT } from '../data/equipment.js';
import { RECONCILE } from '../data/family.js';
import { PROJECT_WORDS } from '../data/buildings.js';
import { DEFAULT_WORK } from '../data/characters.js';
import { Brain } from '../ai/Brain.js';
import { isBedtime, isWorkHours } from '../ai/TraitProfile.js';
import { WARM_MEAL } from '../data/town.js';
import { townWorkMultiplier, civicProductionMultiplier, civicXpMultiplier } from './TownStatus.js';
import { healthWorkMultiplier } from './HealthSystem.js';
import { researchProductionMultiplier, researchBuildMultiplier, healSpeedMultiplier } from './ResearchSystem.js';
import { spiceWorkMultiplier, relicProductionMultiplier, relicXpMultiplier } from './Luxury.js';
import { buffMultiplier, isBuffActive } from './TownStatus.js';
import { LUXURY_GOODS } from '../data/luxury.js';
import { workBonus, addExperience } from './SkillSystem.js';
import { isFreezing } from './HeatingSystem.js';
import { equipmentWorkSpeed } from './Equipment.js';
import { arePartners } from './RelationshipSystem.js';
import { HEATING } from '../data/seasons.js';
import { JOBS } from '../data/jobs.js';
import { ACTIVITY_SKILLS } from '../data/skills.js';

const JOBS_MAX = Object.fromEntries(Object.entries(JOBS).map(([k, v]) => [k, v.maxWorkers]));
import { clamp } from '../utils/math.js';
import { schemeBakeMultiplier } from './Exploration.js';
import { VINE } from '../data/exploration.js';
import { ITEMS } from '../data/citizens.js';
import { productionOf, cropOf } from './Granary.js';
import { CROPS, DEFAULT_CROP } from '../data/crops.js';
import { grandmasterFreeDue, grandmasterCommit } from './Grandmaster.js';
import { valleyProductionMultiplier } from './Valley.js';
import { doctrineProductionMultiplier } from './Doctrine.js';
import { INN_SHERBET } from '../data/refinery.js';
import { PROFESSIONS } from '../data/apprenticeship.js';
import { hasTag } from './Chemistry.js';
import { MOOD_RULES, GRIEVE_LABEL, GRIEVE_FALLBACK } from '../data/moodlets.js';
import { genitive } from '../utils/turkish.js';
import { TEMPERAMENT } from '../data/temperament.js';

const INTERRUPTIBLE_KINDS = new Set(['social', 'leisure', 'idle', 'work']);
const TOWER_BUBBLES = ['hammer', 'hammer', 'sweat', 'sparkle']; // (20. aşama) Ulu Saat Kulesi şantiyesinde

export class BehaviorSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   * @param {{ economy: import('./EconomySystem.js').EconomySystem, jobs: import('./JobSystem.js').JobSystem,
   *   relationships: import('./RelationshipSystem.js').RelationshipSystem,
   *   crafting: import('./CraftingSystem.js').CraftingSystem }} services
   */
  constructor(game, world, rng, services) {
    this.world = world;
    this.events = game.events;
    this.rng = rng;
    this.economy = services.economy;
    this.jobs = services.jobs;
    this.relationships = services.relationships;
    this.crafting = services.crafting;
    this.health = services.health;
    this.research = services.research;
    this.crisis = services.crisis ?? null; // (23. aşama)
    this.apprenticeship = services.apprenticeship ?? null; // (25.2)
    this.university = services.university ?? null; // (32.4)
    this.state = game.state;
    this.brain = new Brain(world, rng, services);
    this.unsubscribers = [
      game.events.on('world:blocked', ({ tiles }) => this.onTilesBlocked(tiles)),
      game.events.on('ui:dismissWorker', ({ buildingId, characterId }) => this.dismissWorker(buildingId, characterId)),
      game.events.on('ui:rehireWorker', ({ buildingId, characterId }) => this.rehireWorker(buildingId, characterId)),
      game.events.on('ui:pinWorker', ({ buildingId, characterId }) => this.pinWorker(buildingId, characterId)),
      game.events.on('ui:unpinWorker', ({ characterId }) => this.unpinWorker(characterId)),
      game.events.on('building:removed', (building) => {
        for (const c of this.world.characters) if (c.workplaceId === building.id) c.workplaceId = null;
      }),
      // (32.4) Darülfünun ders zili (14:00): derse gidecek öğrencilerin yarıda kesilebilir işi biter (şalter kapalıyken olay yok)
      game.events.on('university:bell', ({ ids }) => this.interrupt(ids)),
      game.events.on('expedition:depart', ({ ids, until, exit }) => this.departExpedition(ids, until, exit)),
      // Şenlik başlayınca boş zamanı olanlar elindekini bırakıp şenliğe katılır
      // (14. aşama) Toplanma Zili: uyanık herkes elindekini bırakır (uyuyanlar uyanmaz)
      game.events.on('rally:rung', () => {
        for (const c of this.world.characters) {
          const kind = c.task ? ACTIVITIES[c.task.activity].kind : 'idle';
          if (c.visible && !c.away && INTERRUPTIBLE_KINDS.has(kind)) this.endTask(c);
        }
      }),
      // (14. aşama) Öncelikli hedef: boştaki en uygun işçiler hemen oraya koşar
      game.events.on('job:urgent', ({ job }) => this.sendToUrgentJob(job)),
      // (19. aşama) Düğün kutlaması: çift ve davetliler elindeki (yarıda kesilebilen) işi bırakıp meydana koşar
      game.events.on('social:partyStarted', ({ ids }) => {
        for (const id of ids) {
          const c = this.world.getCharacter(id);
          const kind = c?.task ? ACTIVITIES[c.task.activity].kind : 'idle';
          if (c && c.visible && !c.away && INTERRUPTIBLE_KINDS.has(kind)) this.endTask(c);
        }
      }),
      // (20. aşama) Çağ Kutlaması: uyanık herkes (yarıda kesilebilen) elindekini bırakıp meydana koşar
      game.events.on('goldenAge:celebrationStarted', () => {
        for (const c of this.world.characters) {
          const kind = c.task ? ACTIVITIES[c.task.activity].kind : 'idle';
          if (c.visible && !c.away && INTERRUPTIBLE_KINDS.has(kind)) this.endTask(c);
        }
      }),
      // (21. aşama) İsyan: isyancılar ve yağmaya çıkanlar elindeki (yarıda kesilebilen) işi bırakır; bitince işlerine döner
      // (29.7) Anma Töreni: 18:00'de yas tutanlar ve ölenin dostları elindeki (yarıda kesilebilen) işi bırakıp anma yerine yürür
      game.events.on('rite:started', ({ ids }) => this.interrupt(ids)),
      game.events.on('rite:ended', ({ ids }) => this.interrupt(ids, ['memorial'], true)),
      game.events.on('revolt:started', ({ rioters }) => this.interrupt(rioters)),
      game.events.on('revolt:joined', ({ ids }) => this.interrupt(ids)),
      game.events.on('revolt:raid', ({ raid }) => this.interrupt(raid.members, ['protest'])),
      game.events.on('revolt:ended', ({ rioters }) => this.interrupt(rioters, ['protest'], true)),
      // (30.3) İş bırakma: 10:00'da Kırgın yetişkinler elindeki (yarıda kesilebilen) işi bırakıp meydana yürür; 12:00'de işe döner
      game.events.on('strike:started', ({ ids }) => engineOn('discontent') && this.interrupt(ids)),
      game.events.on('strike:ended', ({ ids }) => engineOn('discontent') && this.interrupt(ids, ['strike'], true)),
      // (32.1) Suç: vakti gelen planlı sakin süren boş zaman / sohbet görevini bırakır (CrimeSystem yalnızca bu türleri gönderir)
      game.events.on('crime:nudge', ({ ids }) => engineOn('justice') && this.interrupt(ids)),
      // (32.2) Adalet Sarayı: sürgün edilen yola çıkar, yasaklı hana / pazara giderken döner (force: her görev bırakılır)
      game.events.on('court:interrupt', ({ ids, activities = null }) => engineOn('court') && this.interrupt(ids, activities ?? Object.keys(ACTIVITIES), true)),
      // (23. aşama) Yangın: yanan yapıdaki çalışanlar ve koşacak sakinler elindeki (yarıda kesilebilen) işi bırakır
      game.events.on('crisis:fireStarted', ({ building, responders }) => {
        this.interrupt([...building.workerIds, ...responders]);
      }),
      game.events.on('crisis:fireOut', ({ building }) => this.stopFirefighting(building)),
      game.events.on('crisis:burnedDown', ({ building }) => this.stopFirefighting(building)),
      // (22. aşama) Köyü terk etmeye karar verenler elindeki her işi bırakır (uyuyan uyanır, içerideki kapıdan çıkar)
      game.events.on('exodus:leaving', ({ ids }) => {
        for (const id of ids) {
          const c = this.world.getCharacter(id);
          if (c && !c.away) this.endTask(c);
        }
      }),
      game.events.on('festival:started', () => {
        for (const c of this.world.characters) {
          const kind = c.task ? ACTIVITIES[c.task.activity].kind : 'idle';
          if (c.visible && (kind === 'social' || kind === 'leisure' || kind === 'idle')) this.endTask(c);
        }
      }),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /**
   * (21. aşama) Verilen sakinlerin yarıda kesilebilen işini bitirir (extra: ayrıca kesilecek etkinlikler; only: yalnızca
   * onlar). Uyuyanlar, içeridekiler ve seferdekiler etkilenmez.
   */
  interrupt(ids, extra = [], only = false) {
    for (const id of ids ?? []) {
      const c = this.world.getCharacter(id);
      if (!c || !c.visible || c.away) continue;
      const activity = c.task?.activity;
      const kind = c.task ? ACTIVITIES[activity].kind : 'idle';
      const hit = extra.includes(activity) || (!only && INTERRUPTIBLE_KINDS.has(kind));
      if (hit) this.endTask(c);
    }
  }

  /** (23. aşama) Yangın bitti (söndü ya da yanıp bitti): yangına koşanlar görevi bırakır, kovalar boşalır. */
  stopFirefighting(building) {
    const others = this.state.buildings.some((b) => b.isBurning);
    for (const c of this.world.characters) {
      if (c.task?.fireId === building.id) this.endTask(c);
      if (!others) c.waterBucket = false;
    }
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    for (const c of this.world.characters) this.updateCharacter(c, tick);
  }

  updateCharacter(c, tick) {
    this.updateBubble(c, tick.simDt);
    // Keşif seferi: harita dışındayken hiçbir şey yapmaz; vakit gelince kenardan geri döner
    if (c.away?.stage === 'away') {
      if (this.state.totalMinutes >= c.away.until) this.returnFromExpedition(c);
      return;
    }
    const task = c.task;

    if (!task) {
      // Sefere yürürken görevi kesildiyse (ör. rotasına şantiye kuruldu) yeniden harita kenarına yönelir;
      // aksi hâlde "seferde" bayrağıyla kasabada kalır, kafile onsuz dönerdi
      if (c.away?.stage === 'leaving') {
        this.departExpedition([c.id], c.away.until, c.away.exit);
        return;
      }
      // Kiler yıkıldıysa sırtındaki yük doğrudan stoğa girer
      if (c.carrying && this.world.getCompleted('storage').length === 0) this.deliver(c);
      this.startPlan(c, this.brain.decide(c, tick.hour), tick.hour);
      return;
    }

    const activity = ACTIVITIES[task.activity];
    if (!this.isTargetValid(task)) {
      this.endTask(c);
      return;
    }
    if (task.phase === 'travel') {
      this.applyEffects(c, activity.travelEffects, tick.gameMinutes, activity);
      if (task.leavingHome && c.waypointIndex >= 1) {
        task.leavingHome = false;
        c.activityLabel = this.travelLabel(task, activity);
      }
      if (INTERRUPTIBLE_KINDS.has(activity.kind) && this.shouldStop(c, activity, tick.hour)) {
        this.endTask(c);
        return;
      }
      if (!c.isMoving) this.arrive(c, task);
      return;
    }

    this.perform(c, task, activity, tick);
  }

  /** İşin ya da yapının hâlâ var olup olmadığı (yıkıldıysa / iptal edildiyse görev biter). */
  isTargetValid(task) {
    if (task.jobId) {
      const job = this.jobs.getJob(task.jobId);
      return Boolean(job && this.jobs.isValid(job));
    }
    if (task.buildingId) return Boolean(this.world.getBuilding(task.buildingId));
    return true;
  }

  // ---------------------------------------------------------------------------
  // Görev başlatma
  // ---------------------------------------------------------------------------

  startPlan(c, plan, hour) {
    const activity = ACTIVITIES[plan.activity];

    // İçeride yapılacak iş için zaten o binadaysa yerinden kalkmaz
    if (activity.indoor && c.insideBuildingId && c.insideBuildingId === plan.buildingId) {
      c.task = { ...plan, phase: 'perform', elapsed: 0 };
      this.enterIndoor(c, c.task, this.world.getBuilding(plan.buildingId));
      if (c.task && plan.dinnerWithId !== undefined && !plan.invited) this.inviteToDinner(c, hour);
      return;
    }

    const points = [];
    const doorTile = this.leaveBuilding(c);
    let from = doorTile ?? { x: c.tileX, y: c.tileY };
    if (doorTile) points.push(this.world.standPoint(doorTile.x, doorTile.y));

    // Bank ya da iskele gibi yürünemez bir karodaysa önce en yakın yürünebilir karoya iner
    if (!doorTile && !this.world.map.isWalkable(from.x, from.y)) {
      const step = this.walkableNeighbor(from) ?? this.nearestFreeTile(from.x, from.y);
      if (step) {
        points.push(this.world.standPoint(step.x, step.y));
        from = step;
      }
    }

    // Yapılar arasında kapalı kalmış bir cepteyse (kasabaya yolu yok) en yakın açık karoya çıkar;
    // yoksa hiçbir yere gidemeyip olduğu yerde bekler
    if (!doorTile && this.world.map.isWalkable(from.x, from.y) && !this.world.isReachable(from.x, from.y)) {
      const free = this.nearestFreeTile(from.x, from.y);
      if (free) {
        const point = this.world.standPoint(free.x, free.y);
        c.x = point.x;
        c.y = point.y;
        from = free;
      }
    }

    if (plan.spot) {
      const path = this.world.findPath(from, plan.spot, { allowBlockedGoal: plan.allowBlockedGoal });
      if (!path) {
        // Ulaşılamayan hedef: biraz bekleyip yeniden düşünsün
        this.startPlan(c, this.brain.planWait(), hour);
        return;
      }
      for (const step of path.slice(1)) points.push(this.world.standPoint(step.x, step.y));
      if (plan.allowBlockedGoal && path.length > 1) points.pop(); // bankın kendisine değil oturağa
      if (plan.reserve) this.world.reserve(plan.spot.x, plan.spot.y, c.id);
    }
    if (plan.finalPoint) points.push(plan.finalPoint);

    c.task = { ...plan, phase: 'travel', elapsed: 0, leavingHome: Boolean(doorTile) };
    if (plan.jobId) this.jobs.assign(this.jobs.getJob(plan.jobId), c.id);
    if (plan.workBuildingId) {
      const workplace = this.world.getBuilding(plan.workBuildingId);
      workplace.workerIds.add(c.id);
      workplace.noteWorker(c.id);
    }

    c.setWaypoints(points);
    c.pose = points.length > 0 ? 'walk' : 'stand';
    c.activityLabel = doorTile ? LEAVING_HOME_LABEL : this.travelLabel(c.task, activity);

    if (activity.urgentBubble && this.isUrgent(c, plan)) c.showBubble(activity.urgentBubble, 2.6);
    if (plan.dateWithId !== undefined) c.lastDateAt = this.state.totalMinutes;
    if (plan.inviteId) this.invite(c, hour);
    if (plan.dinnerWithId !== undefined && !plan.invited) this.inviteToDinner(c, hour);
  }

  /** (19. aşama) Evli sakin eşini evde birlikte akşam yemeğine çağırır (eş elindeki boş zaman işini bırakır). */
  inviteToDinner(c, hour) {
    const day = this.state.time.day;
    c.dinnerDay = day;
    const partner = this.world.getCharacter(c.task.dinnerWithId);
    const home = this.world.getBuilding(c.task.buildingId);
    if (!partner || !home || !this.brain.canJoinDinner(partner) || partner.dinnerDay === day) return;
    const plan = this.brain.homeDinnerPlan(partner, home);
    if (!plan) return;
    partner.dinnerDay = day;
    if (partner.task) this.endTask(partner);
    this.startPlan(partner, { ...plan, dinnerWithId: c.id, invited: true }, hour);
    if (c.visible) c.showBubble('heart', 2);
  }

  /** Evdeyse kapıda belirir; kapı önü karosunu döndürür. */
  leaveBuilding(c) {
    if (!c.insideBuildingId) return null;
    const building = this.world.getBuilding(c.insideBuildingId);
    c.insideBuildingId = null;
    c.visible = true;
    c.pose = 'stand';
    if (!building) return null;
    building.occupants.delete(c.id);
    const entrance = building.entrancePoint;
    c.x = entrance.x;
    c.y = entrance.y;
    c.facing = 'down';
    const doors = this.world.getSpots(building);
    return doors.length > 0 ? doors[0] : null;
  }

  walkableNeighbor(tile) {
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      if (this.world.map.isWalkable(tile.x + dx, tile.y + dy)) return { x: tile.x + dx, y: tile.y + dy };
    }
    return null;
  }

  /** Sohbet daveti: davet edilen yarım bıraktığı boş zaman işinden vazgeçip buluşmaya gelir. */
  invite(c, hour) {
    const partner = this.world.getCharacter(c.task.inviteId);
    const dating = c.task.dateWithId !== undefined;
    if (!partner || !(dating ? this.brain.isAvailableForDate(partner, c, hour) : this.brain.isAvailableForChat(partner, hour))) return;
    const building = this.world.getBuilding(c.task.buildingId);
    // (19. aşama) Bank randevusu: davet edilen yandaki banka oturur
    const benchMate = c.task.dateBenchId ? this.world.getBuilding(c.task.dateBenchId) : null;
    const partnerPlan = benchMate
      ? this.world.freeSpots(benchMate, partner.id).length > 0
        ? this.brain.benchPlan(benchMate, c.task.activity, c.task.duration)
        : null
      : this.brain.planGathering(partner, building, c.task.spot);
    if (!partnerPlan) return;

    this.endTask(partner);
    partnerPlan.meetWithId = c.id;
    if (dating) {
      partnerPlan.dateWithId = c.id;
      partnerPlan.duration = Math.max(partnerPlan.duration ?? 0, c.task.duration ?? 0);
    }
    c.task.meetWithId = partner.id;
    c.activityLabel = this.travelLabel(c.task, ACTIVITIES[c.task.activity]);
    this.startPlan(partner, partnerPlan, hour);
    c.showBubble(dating ? 'love' : 'chat', 2);
  }

  isUrgent(c, plan) {
    if (plan.activity === 'eat' || plan.activity === 'meal') return c.needs.hunger < c.profile.thresholds.hunger + 5;
    if (plan.activity === 'sleep') return true;
    return false;
  }

  travelLabel(task, activity) {
    if (task.meetWithId) {
      const partner = this.world.getCharacter(task.meetWithId);
      if (partner) return `${partner.name} ile ${task.dateWithId !== undefined ? 'randevuya' : 'buluşmaya'} gidiyor`;
    }
    let label = activity.travelLabel ?? activity.label;
    if (task.consoleName) label = label.replace('{name}', task.consoleName); // (29.2)
    // (19. aşama) huyların etkinlikleri: hayvanın adı ve çalınan yer
    if (task.petName) label = label.replace('{pet}', task.petName);
    if (task.placeTo) label = label.replace('{place}', task.placeTo);
    if (task.activity === 'haul' && task.cargo) label = label.replace('{resource}', RESOURCES[task.cargo].name.toLowerCase());
    if (task.item) label = label.replace('{item}', EQUIPMENT[task.item].name);
    if (task.bagItem) label = label.replace('{bag}', ITEMS[task.bagItem].name.toLocaleLowerCase('tr'));
    return task.onBreak ? `${BREAK_PREFIX}${label}` : label;
  }

  performLabel(c, task, activity) {
    const building = task.buildingId ? this.world.getBuilding(task.buildingId) : null;
    let label = activity.label;
    if (task.activity === 'sleep' && task.nap) label = activity.napLabel;
    if (task.activity === 'sleep' && c.isVenerable) label = building ? `${building.name}'nde sabahlıyor (Saygın Büyük)` : 'Sabahlıyor'; // (28.3)
    if (task.activity === 'meal' && building?.type === 'storage') label = task.bread ? activity.breadStorageLabel : activity.storageLabel;
    else if (task.activity === 'meal' && task.bread) label = activity.breadLabel;
    if ((task.activity === 'bake' || task.activity === 'weave' || task.activity === 'brewSherbet') && building?.idle) label = activity.idleLabel;
    // (24. aşama) bahçıvan seçili mahsulde çalışır (Buğday'da eski metin kalır)
    if (task.activity === 'farm' && building && cropOf(building) && cropOf(building) !== DEFAULT_CROP) label = CROPS[cropOf(building)].label;
    if (task.activity === 'build' && building?.project) label = `${PROJECT_WORDS[building.project.kind].doing}: {target}`;
    if (task.activity === 'craft') label = building?.craft ? label.replace('{item}', this.crafting.currentItemName(building)) : activity.idleLabel;
    if (task.activity === 'teach' && !this.state.research?.active) label = activity.teachLabel;
    if (task.item) label = label.replace('{item}', EQUIPMENT[task.item].name);
    if (building) label = label.replace('{target}', building.name);
    // (19. aşama) huyların etkinlikleri
    if (task.activity === 'viewpoint' && task.view === 'tree') label = activity.treeLabel;
    // (29.2) yas ve teselli
    if (task.grieve) label = task.grieveFor ? GRIEVE_LABEL.replace('{who}', genitive(task.grieveFor)) : GRIEVE_FALLBACK;
    if (task.consoleName) label = label.replace('{name}', task.consoleName);
    if (task.petName) label = label.replace('{pet}', task.petName);
    if (task.placeAt) label = label.replace('{place}', task.placeAt);
    if (task.bagItem) label = label.replace('{bag}', ITEMS[task.bagItem].name.toLocaleLowerCase('tr'));
    label = label.charAt(0).toLocaleUpperCase('tr') + label.slice(1);
    return task.onBreak ? `${BREAK_PREFIX}${label}` : label;
  }

  // ---------------------------------------------------------------------------
  // Varış ve etkinlik
  // ---------------------------------------------------------------------------

  arrive(c, task) {
    const activity = ACTIVITIES[task.activity];
    const building = task.buildingId ? this.world.getBuilding(task.buildingId) : null;
    task.phase = 'perform';
    task.elapsed = 0;
    c.clearPath();
    c.pose = activity.pose ?? 'stand';

    if (activity.indoor) {
      this.enterIndoor(c, task, building);
      return;
    }
    if (task.activity === 'expedition') {
      // Harita kenarına vardı: bir gün boyunca ufukta kaybolur
      c.away = { ...(c.away ?? {}), stage: 'away' };
      c.visible = false;
      c.pose = 'hidden';
      c.bubble = null;
      c.activityLabel = activity.label;
      c.task = null;
      return;
    }

    if (task.activity === 'eat') {
      if (!building || building.berries <= 0) {
        // Başkası son meyveyi toplamış: yeniden düşün
        this.endTask(c);
        return;
      }
      building.berries -= 1;
    }
    if (task.activity === 'haul') this.deliver(c);

    c.tool = activity.tool ?? null;
    c.workEffect = activity.effect ?? null;
    if (task.facing) c.facing = task.facing;
    else if (task.faceTarget) c.faceToward(task.faceTarget.x, task.faceTarget.y);
    else if (building) c.faceToward(building.center.x, building.center.y);
    c.activityLabel = this.performLabel(c, task, activity);
    c.bubbleCooldown = 0.4 + this.rng.next() * 1.2;
  }

  /** Kapıdan girip görünmez olur (uyku, yemek, yerleşme). */
  enterIndoor(c, task, building) {
    if (!building) {
      this.endTask(c);
      return;
    }
    if (task.activity === 'innMeal') {
      // Handa pişmiş yemek kalmadıysa kapıdan dönüp başka çare arar
      if (building.meals <= 0) {
        this.endTask(c);
        return;
      }
      building.meals -= 1;
    }
    if (task.activity === 'heal' && !this.health.takeRemedy(building)) {
      // Kapıya vardığında iksir kalmamış: başka çare arar
      this.endTask(c);
      return;
    }
    if (task.activity === 'meal' || task.activity === 'homeDinner') {
      const paid = this.economy.consumeFood(MEAL_FOOD_COST);
      if (!paid.ok) {
        // Yolda stok bitti: kapıdan çıkıp başka çare arasın
        this.endTask(c);
        return;
      }
      task.bread = paid.bread; // taze ekmekle yemek: biraz da keyif verir
    }
    c.visible = false;
    c.pose = 'hidden';
    c.bubble = null;
    c.tool = null;
    c.insideBuildingId = building.id;
    building.occupants.add(c.id);
    c.activityLabel = this.performLabel(c, task, ACTIVITIES[task.activity]);
  }

  /** Taşınan yükü stoğa ekler. */
  deliver(c) {
    if (!c.carrying) return;
    this.economy.add(c.carrying.resource, c.carrying.amount);
    c.carrying = null;
  }

  perform(c, task, activity, tick) {
    const minutes = tick.gameMinutes;
    task.elapsed += minutes;
    this.applyEffects(c, activity.effects, minutes, activity);
    if (task.bread) this.applyEffects(c, activity.breadEffects, minutes, activity);
    // (24.2) Handa sohbete oturan sakin handa fıçı varsa şerbet içer (RefinerySystem.serve task.sherbet'i yazar); içtiyse
    // handa kaldığı sürece keyif barı iki kat hızlı dolar (sosyallik performSocial'da)
    if (task.activity === 'inn' && task.phase === 'perform' && task.sherbet === undefined) {
      task.sherbet = false;
      this.events.emit('citizen:innVisit', { character: c, task, building: this.world.getBuilding(task.buildingId) });
    }
    if (task.sherbet) for (let i = 1; i < INN_SHERBET.multiplier; i++) this.applyEffects(c, activity.effects, minutes, activity);
    if (task.activity === 'school' && task.phase === 'perform') {
      const school = this.world.getBuilding(task.buildingId);
      if (school) this.research.learn(c, school, minutes);
    }
    if (task.activity === 'lecture' && task.phase === 'perform') this.university?.learn(c, this.world.getBuilding(task.buildingId), minutes); // (32.4)
    if (task.activity === 'sleep') this.applyHomeComfort(c, minutes);

    let bubbles = activity.bubbles;
    if (task.activity === 'build' && this.towerFor(task)) bubbles = TOWER_BUBBLES; // (20. aşama) kule şantiyesinde çekiç balonları
    if (activity.kind === 'social' || activity.kind === 'festival') bubbles = this.performSocial(c, task, activity, minutes);
    // Şenlikte ritimle sağa sola dönerek dans eder
    if (activity.dance || (c.quirk === 'festive' && task.activity === 'fountain')) c.facing = Math.floor((c.animTime + c.id * 0.3) / 0.6) % 2 === 0 ? 'left' : 'right';
    if (activity.kind === 'work' && !this.performWork(c, task, minutes)) {
      this.endTask(c);
      return;
    }
    if (c.visible) this.maybeShowBubble(c, bubbles);

    if (this.isFinished(c, task, activity, tick.hour)) {
      if (task.activity === 'moveIn') c.newcomer = false;
      if (task.activity === 'relocate') c.relocating = false;
      if (task.activity === 'equip') this.crafting.equip(c, task.item);
      if (task.activity === 'heal') this.health.cure(c, this.world.getBuilding(task.buildingId));
      if (task.activity === 'sleep' && !task.nap) this.events.emit('character:woke', { character: c });
      // (15. aşama) Üretim yapısında bir mesai bitti: ustalar nadiren usta işi bir eser çıkarır (CraftsmanshipSystem)
      if (activity.kind === 'work' && task.workBuildingId) {
        this.events.emit('work:finished', { character: c, activity: task.activity, building: this.world.getBuilding(task.workBuildingId) });
      }
      // (21. aşama) Vardiya bitti (yevmiye ve iş yerinden pay) ve etkinliğin vatandaşlık olayı (çanta, alışveriş, yağma)
      if (activity.kind === 'work') {
        this.events.emit('work:shiftEnded', { character: c, activity: task.activity, building: task.workBuildingId ? this.world.getBuilding(task.workBuildingId) : null });
      }
      this.events.emit('task:finished', { character: c, task }); // (29.2) eylem x kişilik moodlet'leri
      if (activity.finishEvent) this.events.emit(activity.finishEvent, { character: c, task, building: task.buildingId ? this.world.getBuilding(task.buildingId) : null });
      // Sıcak yemek bir süre tok tutar (NeedsSystem acıkmayı yavaşlatır)
      if (task.activity === 'innMeal') {
        c.buffs.warmMeal = this.world.state.totalMinutes + WARM_MEAL.hours * 60;
        // (16. aşama) Kasabada üzüm asması varsa yemeğin yanında soğuk üzüm şerbeti
        if (this.world.buildings.some((b) => b.type === 'grapeVine' && b.functional)) c.needs.fun = clamp(c.needs.fun + VINE.sherbetFun, 0, 100);
        // (13. aşama) Handa baharat ve kahve varken yiyen sakin bir süre hızlı çalışır ve yürür
        if (isBuffActive(this.state, LUXURY_GOODS.spiceCrate.buff)) {
          c.buffs.spiced = this.state.totalMinutes + LUXURY_GOODS.spiceCrate.personal.hours * 60;
          if (c.visible) c.showBubble('sparkle', 2);
        }
      }
      this.endTask(c);
    }
  }

  /** (20. aşama) Görev Ulu Saat Kulesi'nin inşaatı mı? Kule (yapı) ya da null. */
  towerFor(task) {
    if (!task.jobId || task.activity !== 'build') return null;
    const job = this.jobs.getJob(task.jobId);
    const building = job?.buildingId ? this.world.getBuilding(job.buildingId) : null;
    return building?.definition.wonder && towerStageIndex(building) !== null ? building : null; // yalnızca süren aşama
  }

  /** Taş Evde (Seviye 2) uyuyanın keyfi uykuda yavaşça dolar: sabah keyifle uyanır. */
  applyHomeComfort(c, minutes) {
    const home = c.insideBuildingId ? this.world.getBuilding(c.insideBuildingId) : null;
    const bonus = home?.stat('sleepFunPerMinute', 0) ?? 0;
    if (bonus > 0) c.needs.fun = clamp(c.needs.fun + bonus * minutes, 0, 100);
  }

  performSocial(c, task, activity, minutes) {
    const building = this.world.getBuilding(task.buildingId);
    const partner = this.nearestPartner(c, task);
    let gain = (partner ? activity.socialGain : activity.aloneSocialGain) * c.profile.gain.social;
    if (partner) {
      // Yakın arkadaşla sohbet sosyalliği daha hızlı doldurur ve keyif de verir
      const bond = this.relationships.bondFor(c, partner);
      // (29.2) Tatlı Sohbet kazancı artırır, Kalbi Kırık azaltır (yalnızca olumlu keyif kazancı çarpılır)
      gain *= bond.socialBonus * c.mood.socialMul;
      c.needs.fun = clamp(c.needs.fun + (bond.funBonus > 0 ? bond.funBonus * c.mood.socialMul : bond.funBonus) * minutes, 0, 100);
    }
    if (task.sherbet) gain *= INN_SHERBET.multiplier; // (24.2) fıçı şerbetiyle sohbet iki kat
    c.needs.social = clamp(c.needs.social + gain * minutes, 0, 100);
    if (partner) {
      if (activity.faceBuilding) c.faceToward(building.center.x, building.center.y);
      else c.faceToward(partner.x, partner.y);
      // (19. aşama) randevudaki çift: handa aynı masayı paylaşır, çardakta baş başa oturur
      const dating = task.dateWithId === partner.id && activity.dateLabel;
      const label = (dating ? activity.dateLabel : activity.partnerLabel).replace('{partner}', this.partnerName(c, partner));
      c.activityLabel = label.charAt(0).toLocaleUpperCase('tr') + label.slice(1);
      // Sevgilisiyle / eşiyle sohbette çift kalp, anlaşamadığıyla somurtma
      if (arePartners(c, partner)) return LOVE_BUBBLES;
      if (this.relationships.get(c, partner) < RECONCILE.below) return RIVAL_BUBBLES;
      return activity.partnerBubbles;
    }
    c.faceToward(building.center.x, building.center.y);
    c.activityLabel = this.performLabel(c, task, activity);
    return activity.bubbles;
  }

  /** Durum metnindeki ad: "eşi Ayşe" / "sevgilisi Ayşe" ya da yalnızca "Ayşe". */
  partnerName(c, partner) {
    if (!arePartners(c, partner)) return partner.name;
    return `${c.married ? 'eşi' : 'sevgilisi'} ${partner.name}`;
  }

  /**
   * Çalışma: iş emrine katkı ya da üretim binasında üretim. Yorgunluk burada işlenir.
   * İş bittiyse ya da hedef kalmadıysa false döner (görev biter).
   */
  performWork(c, task, minutes) {
    // (25.2) Çırak ustasını izler: yorgunluğu ve öğrenmesi ApprenticeshipSystem'dedir (üretim yok, deneyim yok)
    if (task.activity === 'apprentice') return this.apprenticeship ? this.apprenticeship.learn(c, task, minutes) : false;
    const work = c.profile.work;
    // (25.3) Zanaatkâr Ruhu zanaat yapılarında şevkle çalışır: daha az sıkılır, biraz hızlı çalışır (öteki sakinlere dokunulmaz)
    const crafty = c.quirk === 'craftsman' && task.workBuildingId && PROFESSIONS[this.world.getBuilding(task.workBuildingId)?.type];
    c.needs.energy = clamp(c.needs.energy - DEFAULT_WORK.energyCost * work.fatigue * minutes, 0, 100);
    c.needs.fun = clamp(c.needs.fun - DEFAULT_WORK.funCost * (crafty ? TEMPERAMENT.craftFunCost : 1) * minutes, 0, 100);
    // Kasaba bonusları (Alet Paketi, Şenlik Coşkusu, Lonca Ustaları) ve Belediye Konağı herkesi, meslek
    // ustalığı ustayı, kişisel ekipman (Sağlam Alet, Sırt Çantası) da kuşananı hızlandırır
    // Üşüten sakin %35 yavaş, şifacıdan Dinçlik alan %15 hızlı çalışır
    let amount =
      minutes *
      work.speed *
      townWorkMultiplier(this.state) *
      workBonus(c, task.activity) *
      equipmentWorkSpeed(c) *
      healthWorkMultiplier(c, this.state.totalMinutes) *
      spiceWorkMultiplier(c, this.state.totalMinutes) *
      c.mood.workMul; // (29.2) ruh hali: gurur / akış hızlandırır, angarya / yas / açlık yavaşlatır
    // Zanaat Loncası fermanı üretim yapılarında (inşaat ve toplama emirleri hariç) verimi artırır
    if (task.workBuildingId) amount *= civicProductionMultiplier(this.state);
    if (crafty) amount *= TEMPERAMENT.craftWorkSpeed;
    // (25.2) Gururlu Usta: %50'yi geçen çırağın getir-götür işi tezgâha +%5 verim (çırak yoksa çarpılmaz)
    if (task.workBuildingId && this.apprenticeship && c.buffs.proudMaster !== undefined) amount *= this.apprenticeship.masterBoost(c, task);
    // (12. aşama) Mimarlık Loncası inşaatı, yükseltmeyi ve onarımı hızlandırır
    // (13. aşama) Kraliyet Mimarları fermanı inşaatları 3 kat hızlandırır
    if (task.jobId && task.activity === 'build') amount *= researchBuildMultiplier(this.state) * buffMultiplier(this.state, 'buildSpeed');
    // (20. aşama) Ulu Saat Kulesi: aşamanın ustaları (Yapı Ustası, usta zanaatkâr) daha hızlı yükseltir; emek Tarihçe'ye yazılır
    const tower = this.towerFor(task);
    if (tower) {
      amount *= towerMasteryMultiplier(c, tower, skillLevel);
      recordTowerWork(this.state, c, amount);
    }
    addExperience(this.events, c, task.activity, minutes, civicXpMultiplier(this.state) * relicXpMultiplier(this.state) * c.mood.xpMul);

    if (task.jobId) {
      const job = this.jobs.getJob(task.jobId);
      if (!job) return false;
      if (!this.jobs.applyWork(job, amount)) return true;
      const { yields } = this.jobs.complete(job);
      this.collectYields(c, yields);
      this.events.emit('work:jobDone', { character: c, job, yields }); // (21. aşama) yevmiye
      return false;
    }

    const building = this.world.getBuilding(task.workBuildingId);
    if (!building || building.frozen || building.damaged || building.isBurning) return false; // tarla dondu / fırtına yıktı / yapı yanıyor: iş biter
    if (building.definition.academy) return this.research.work(building, amount);
    if (building.definition.university) return Boolean(this.university?.work(building)); // (32.4) Müderris
    // (23. aşama) Gözcü Kulesi: bekçi nöbet tutar (üretim yok; güven katkısı CrisisSystem'de saatliktir)
    if (building.definition.guard) return true;
    // (12. aşama) Gelişmiş Çarklar: oduncu, taş ocağı, maden ve değirmende verim +%20
    amount *= researchProductionMultiplier(this.state, building.type);
    // (28.4) Vadi Karakteri ve Kasaba Doktrini: yapı türüne göre asimetrik verim
    amount *= valleyProductionMultiplier(this.state, building.type) * doctrineProductionMultiplier(this.state, building.type);
    if (building.definition.apothecary) return this.apothecaryWork(building, task, amount * (task.activity === 'brew' ? healSpeedMultiplier(this.state) : 1));
    if (building.definition.kitchen) {
      this.cook(building, amount);
      return true;
    }
    if (building.definition.crafting) {
      const working = this.crafting.work(building, amount, c);
      if (working) c.activityLabel = this.performLabel(c, task, ACTIVITIES[task.activity]);
      return working;
    }
    // (24.2) Lüks atölye boşa düştüyse (kasaba açlıkta, malzeme yok) dokumacı / mahzen ustası işi bırakıp gıdaya döner
    if (building.definition.luxury && building.idle) return false;
    // (13. aşama) Güneş Saati Küresi üretim ve işleme yapılarında verimi artırır
    if (building.definition.processing) return this.process(building, amount * relicProductionMultiplier(this.state) * (building.type === 'mill' ? schemeBakeMultiplier(this.state) : 1), c);
    const production = productionOf(building); // (24. aşama) bahçede seçili mahsulün ürünü ve verimi
    if (!production) return false;
    // Verim (oduncu için çevredeki ağaç sayısı) StructureSystem'de hesaplanır; Bereket Boynuzu yiyeceği artırır
    building.productionBuffer += (production.perHour / 60) * amount * building.efficiency * relicProductionMultiplier(this.state, production.resource);
    const whole = Math.floor(building.productionBuffer);
    if (whole > 0) {
      building.productionBuffer -= whole;
      building.producedToday += this.economy.produce(production.resource, whole, building);
    }
    // Yan ürün (ağılda süt-peynir, madende taş): aynı verimle, kendi küsuratıyla
    for (const [resource, perHour] of Object.entries(production.extra ?? {})) {
      const buffers = (building.extraBuffers ??= {});
      buffers[resource] = (buffers[resource] ?? 0) + (perHour / 60) * amount * building.efficiency * relicProductionMultiplier(this.state, resource);
      const extra = Math.floor(buffers[resource]);
      if (extra > 0) {
        buffers[resource] -= extra;
        const added = this.economy.produce(resource, extra, building);
        building.extraToday = (building.extraToday ?? 0) + added;
      }
    }
    return true;
  }

  /**
   * Şifacı: doğada şifalı ot toplar (gatherHerbs; çevresinde ağaç azsa yavaş) ya da kulübede otları havanda
   * döverek iksir hazırlar (brew). Toplanacak / dövülecek bir şey kalmayınca iş biter.
   */
  apothecaryWork(building, task, amount) {
    const spec = building.definition.apothecary;
    if (task.activity === 'gatherHerbs') {
      if (building.herbs >= spec.maxHerbs) return false;
      const factor = building.natureFactor ?? 1; // çevredeki ağaçlar (StructureSystem hesaplar)
      building.herbs = Math.min(spec.maxHerbs, building.herbs + (spec.herbsPerHour / 60) * amount * factor);
      return true;
    }
    if (building.remedies >= spec.maxRemedies || building.herbs < spec.herbsPerRemedy) return false;
    building.productionBuffer += (spec.brewPerHour / 60) * amount;
    while (building.productionBuffer >= 1) {
      if (building.remedies >= spec.maxRemedies || building.herbs < spec.herbsPerRemedy) {
        building.productionBuffer = 0;
        return false;
      }
      building.productionBuffer -= 1;
      building.herbs -= spec.herbsPerRemedy;
      building.remedies += 1;
      building.producedToday += 1;
      this.events.emit('apothecary:brewed', { building });
    }
    return true;
  }

  /** Keşif seferine çıkanlar ellerindekini bırakıp harita kenarına yürür (yol yoksa hemen yola koyulur). */
  departExpedition(ids, until, exit) {
    for (const id of ids) {
      const c = this.world.getCharacter(id);
      if (!c) continue;
      this.endTask(c);
      c.away = { stage: 'leaving', until, exit };
      this.startPlan(c, { activity: 'expedition', spot: exit, duration: 0 }, this.state.time.hour);
      if (c.task?.activity !== 'expedition') {
        // Kenara yol bulunamadı: doğrudan sefere çıkmış sayılır
        this.endTask(c);
        c.away.stage = 'away';
        c.visible = false;
        c.pose = 'hidden';
        c.insideBuildingId = null;
        c.activityLabel = ACTIVITIES.expedition.label;
      }
    }
  }

  /** Keşif seferinden dönüş: harita kenarında belirir, evine yürür; ganimeti DilemmaSystem dağıtır. */
  returnFromExpedition(c) {
    const exit = c.away.exit ?? this.world.findEntryTile(this.rng);
    c.away = null;
    c.visible = true;
    c.pose = 'stand';
    c.task = null;
    if (exit) {
      const p = this.world.standPoint(exit.x, exit.y);
      c.x = p.x;
      c.y = p.y;
    }
    c.needs.fun = clamp(c.needs.fun + 15, 0, 100);
    c.showBubble('sparkle', 2.4);
    this.events.emit('expedition:memberReturned', { character: c });
  }

  /**
   * İşleme (değirmen-fırın): saatte perHour kez stoktan malzemeyi (1 yiyecek) alıp ürünü (1 ekmek) üretir.
   * Malzeme biter ya da ürünün deposu dolarsa iş biter (fırıncı başka işe geçer; yapı boşta kalır).
   */
  process(building, amount, worker = null) {
    const processing = building.definition.processing;
    building.productionBuffer += (processing.perHour / 60) * amount;
    while (building.productionBuffer >= 1) {
      const room = Object.keys(processing.output).every((r) => this.economy.room(r) > 0);
      // (28.2) Başusta kendi mesleğinin yapısında her 5. üretimi hammaddesiz yapar (deterministik sayaç)
      const free = room && grandmasterFreeDue(worker, building);
      if (!room || (!free && !this.economy.spend(processing.input))) {
        building.productionBuffer = 0;
        return false;
      }
      if (grandmasterCommit(worker, building, free)) this.noteGrandmasterSaved(worker, building);
      building.productionBuffer -= 1;
      for (const [resource, value] of Object.entries(processing.output)) {
        building.producedToday += this.economy.produce(resource, value, building);
      }
      this.events.emit('processing:made', { building });
    }
    return true;
  }

  /** (28.2) Başustanın hammaddesiz üretimini sayar ve olay yayar. */
  noteGrandmasterSaved(worker, building) {
    this.state.apprenticeship.grandmasterSaved = (this.state.apprenticeship.grandmasterSaved ?? 0) + 1;
    if (worker.visible) worker.showBubble('sparkle', 1.6);
    this.events.emit('grandmaster:saved', { character: worker, building });
  }

  /**
   * Handa aşçılık: kilerdeki ham yiyecekten sıcak yemek porsiyonu pişirir. Yemek dolabı doluysa
   * ya da kilerde yiyecek yoksa bekler (yine de mutfakta kalır).
   */
  cook(building, amount) {
    const kitchen = building.definition.kitchen;
    if (building.meals >= kitchen.capacity) return;
    building.mealBuffer += (kitchen.perHour / 60) * amount;
    while (building.mealBuffer >= 1 && building.meals < kitchen.capacity) {
      // Aşçı önce ham yiyecek kullanır; kilerde yalnızca ekmek kaldıysa onu da sofraya koyar
      if (!this.economy.consumeFood(kitchen.foodPerMeal, { preferRaw: true }).ok) {
        building.mealBuffer = 0;
        return;
      }
      building.mealBuffer -= 1;
      building.meals += 1;
      building.producedToday += 1;
      this.events.emit('kitchen:cooked', { building });
    }
  }

  /** Hasat edilen kaynak: kiler varsa sırtında taşınır, yoksa doğrudan stoğa girer. */
  collectYields(c, yields) {
    const entries = Object.entries(yields).filter(([, amount]) => amount > 0);
    if (entries.length === 0) return;
    const hasStorage = this.world.getCompleted('storage').length > 0;
    for (const [resource, amount] of entries) {
      if (hasStorage && !c.carrying) c.carrying = { resource, amount };
      else this.economy.add(resource, amount);
    }
  }

  shouldStop(c, activity, hour) {
    if (activity.kind === 'work' && !isWorkHours(hour)) return true;
    return this.brain.hasUrgentNeed(c, hour);
  }

  isFinished(c, task, activity, hour) {
    const { needs } = c;
    if (task.activity === 'sleep') {
      if (needs.hunger < 10) return true; // açlıktan uyanır
      if (isBedtime(c.profile, hour)) return false;
      return task.nap ? needs.energy >= 85 : needs.energy >= 97;
    }
    if ((task.activity === 'eat' || task.activity === 'meal' || task.activity === 'innMeal') && needs.hunger >= 99.5) return true;
    // Şenlik bitince herkes dağılır
    if (activity.kind === 'festival' && !this.world.state.events.festival.active) return true;
    if (INTERRUPTIBLE_KINDS.has(activity.kind) && this.shouldStop(c, activity, hour)) return true;
    // (29.2) gururlu / akıştaki / ilhamlı sakin tezgâh başında daha uzun kalır
    const stretch = activity.kind === 'work' && c.mood.focus ? MOOD_RULES.focusDuration : 1;
    return task.elapsed >= (task.duration ?? 0) * stretch;
  }

  /** Aynı toplanma yerinde etkinliğini sürdüren diğer karakter: yakın olan, ama arkadaşlar öne geçer. */
  nearestPartner(c, task) {
    let best = null;
    for (const other of this.world.characters) {
      if (other === c || other.task?.buildingId !== task.buildingId) continue;
      if (other.task.activity !== task.activity || other.task.phase !== 'perform') continue;
      // (29.1) kırgın olduğu kişiye ancak başka kimse yoksa döner; minnettar olduğuna öncelik verir
      const feeling = hasTag(c, other.id, 'resentful') ? 500 : hasTag(c, other.id, 'grateful') ? -40 : 0;
      const rank = Math.hypot(other.x - c.x, other.y - c.y) - this.relationships.get(c, other) * 0.8 + feeling;
      if (!best || rank < best.rank) best = { other, rank };
    }
    return best?.other ?? null;
  }

  applyEffects(c, effects, minutes, activity) {
    if (!effects) return;
    // Ocaklar sönükken soğuk evde uyku da, donarken eğlence de yarım dinlendirir
    const freezing = isFreezing(this.world.state);
    for (const [need, rate] of Object.entries(effects)) {
      let gain = rate * (c.profile.gain[need] ?? 1);
      if (activity.nature && need === 'fun') gain *= c.profile.gain.nature;
      if (freezing && gain > 0 && (need === 'fun' || need === 'energy')) gain *= HEATING.freezingRecovery;
      c.needs[need] = clamp(c.needs[need] + gain * minutes, 0, 100);
    }
  }

  endTask(c) {
    this.world.releaseAll(c.id);
    this.jobs.releaseCharacter(c.id);
    for (const building of this.world.buildings) building.workerIds.delete(c.id);
    c.clearPath();
    c.task = null;
    c.tool = null;
    c.workEffect = null;
    // Oturan karakter bir sonraki planda kalkana kadar oturur (bankın üstünde dikilmesin)
    if (c.pose !== 'hidden' && c.pose !== 'sit') c.pose = 'stand';
  }

  /**
   * Yeni bir şantiye kurulunca: o karolarda duranları kenara çeker, yolu oradan
   * geçenlere yeniden rota çizdirir.
   */
  onTilesBlocked(tiles) {
    const blocked = new Set(tiles.map((t) => `${t.x},${t.y}`));
    for (const c of this.world.characters) {
      if (!c.visible) continue;
      const standing = blocked.has(`${c.tileX},${c.tileY}`);
      const crossing = c.remainingWaypoints().some((p) => blocked.has(`${Math.floor(p.x / 16)},${Math.floor(p.y / 16)}`));
      if (!standing && !crossing) continue;
      if (standing) {
        const free = this.nearestFreeTile(c.tileX, c.tileY);
        if (free) {
          const point = this.world.standPoint(free.x, free.y);
          c.x = point.x;
          c.y = point.y;
        }
      }
      this.endTask(c);
      c.pose = 'stand';
    }
  }

  /** Oyuncu çalışanı işten çıkarır: görevi biter, bu yapıda bir daha çalışmaz. */
  dismissWorker(buildingId, characterId) {
    const building = this.world.getBuilding(buildingId);
    const c = this.world.getCharacter(characterId);
    if (!building || !c || building.excludedWorkers.has(c.id)) return;
    building.excludedWorkers.add(c.id);
    if (c.workplaceId === building.id) c.workplaceId = null; // işten çıkarılan sabit çalışanın sabitlemesi kalkar
    if (c.task?.workBuildingId === building.id) {
      this.endTask(c);
      c.activityLabel = 'İşten çıkarıldı, kendine başka iş arıyor';
      if (c.visible) c.showBubble('sulk', 2.4);
    }
    this.events.emit('worker:dismissed', { building, character: c });
    this.events.emit('toast', { text: `${c.name} artık ${building.name} işinde çalışmayacak`, tone: 'info', icon: 'sulk' });
  }

  rehireWorker(buildingId, characterId) {
    const building = this.world.getBuilding(buildingId);
    const c = this.world.getCharacter(characterId);
    if (!building || !c || !building.excludedWorkers.delete(c.id)) return;
    this.events.emit('toast', { text: `${c.name} yeniden ${building.name} işinde çalışabilir`, tone: 'info', icon: 'hammer' });
  }

  /** Öncelikli işaretlenen hedefe boştaki (dinlenen, gezen, sohbet eden) en uygun yetişkinleri gönderir. */
  sendToUrgentJob(job) {
    const skill = ACTIVITY_SKILLS[job.type];
    const idle = this.world.characters.filter((c) => {
      if (c.isChild || !c.visible || c.away || c.newcomer || c.workplaceId !== null) return false;
      const kind = c.task ? ACTIVITIES[c.task.activity].kind : 'idle';
      return kind === 'leisure' || kind === 'idle' || kind === 'social';
    });
    const score = (c) => Math.hypot(c.tileX - job.x, c.tileY - job.y) - (skill ? (c.skills?.[skill] ?? 0) / 100 : 0);
    idle.sort((a, b) => score(a) - score(b));
    const sent = idle.slice(0, Math.max(0, JOBS_MAX[job.type] - job.assignees.length));
    for (const c of sent) {
      this.endTask(c);
      c.activityLabel = 'Öncelikli işe koşuyor';
    }
    return sent;
  }

  /**
   * (13. aşama) Oyuncu bir sakini bu iş yerine sabitler: yalnızca orada çalışır, başka işlere kaymaz. Başka bir işte
   * çalışıyorsa elindekini bırakıp gelir; yapı sabit olmayan çalışanlarla doluysa biri yer açar.
   */
  pinWorker(buildingId, characterId) {
    const building = this.world.getBuilding(buildingId);
    const c = this.world.getCharacter(characterId);
    if (!building || !c || !building.workerSlots || c.isChild || c.workplaceId === building.id) return false;
    const pinned = this.world.characters.filter((o) => o.workplaceId === building.id);
    if (pinned.length >= building.workerSlots) {
      this.events.emit('toast', { text: `${building.name}: bütün yuvalar sabit çalışanlara ayrılmış`, tone: 'warn', icon: 'pin' });
      return false;
    }
    c.workplaceId = building.id;
    building.excludedWorkers.delete(c.id);
    // Başka bir işteyse bırakır; yapı doluysa sabit olmayan bir çalışan yer açar
    if (c.task && ACTIVITIES[c.task.activity].kind === 'work' && c.task.workBuildingId !== building.id && c.visible) this.endTask(c);
    if (building.workerIds.size >= building.workerSlots && !building.workerIds.has(c.id)) {
      const loose = [...building.workerIds].map((id) => this.world.getCharacter(id)).find((o) => o && o.workplaceId !== building.id);
      if (loose) {
        this.endTask(loose);
        loose.activityLabel = 'Yerini sabit çalışana bıraktı, başka iş arıyor';
      }
    }
    if (c.visible) c.showBubble('sparkle', 2);
    this.events.emit('worker:pinned', { building, character: c });
    this.events.emit('toast', { text: `${c.name} artık yalnızca ${building.name} işinde çalışacak`, tone: 'info', icon: 'pin' });
    return true;
  }

  unpinWorker(characterId) {
    const c = this.world.getCharacter(characterId);
    if (!c || c.workplaceId === null) return false;
    const building = this.world.getBuilding(c.workplaceId);
    c.workplaceId = null;
    this.events.emit('worker:unpinned', { building, character: c });
    this.events.emit('toast', { text: `${c.name} artık istediği işi seçebilir`, tone: 'info', icon: 'pin' });
    return true;
  }

  nearestFreeTile(x, y) {
    for (let r = 1; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.world.map.isWalkable(x + dx, y + dy) && this.world.isReachable(x + dx, y + dy)) return { x: x + dx, y: y + dy };
        }
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // İfade balonları
  // ---------------------------------------------------------------------------

  updateBubble(c, simDt) {
    c.bubbleCooldown -= simDt;
    if (!c.bubble) return;
    c.bubble.time += simDt;
    if (c.bubble.time >= c.bubble.duration) c.bubble = null;
  }

  maybeShowBubble(c, icons) {
    if (!icons || icons.length === 0 || c.bubble || c.bubbleCooldown > 0) return;
    c.showBubble(this.rng.pick(icons));
    c.bubbleCooldown = (3 + this.rng.next() * 4) / c.profile.bubbleRate;
  }
}
