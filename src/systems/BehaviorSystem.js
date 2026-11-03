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
// Uyku bitince 'character:woke' { character } yayınlanır (FamilySystem Mutlu Yuva'yı verir). Oyuncu bir
// çalışanı işten çıkarınca ('ui:dismissWorker') görevi biter ve o yapıda bir daha çalışmaz
// ('ui:rehireWorker' geri alır).
import { ACTIVITIES, LEAVING_HOME_LABEL, BREAK_PREFIX, LOVE_BUBBLES, RIVAL_BUBBLES } from '../data/activities.js';
import { RESOURCES, MEAL_FOOD_COST } from '../data/resources.js';
import { EQUIPMENT } from '../data/equipment.js';
import { RECONCILE } from '../data/family.js';
import { DEFAULT_WORK } from '../data/characters.js';
import { Brain } from '../ai/Brain.js';
import { isBedtime, isWorkHours } from '../ai/TraitProfile.js';
import { WARM_MEAL } from '../data/town.js';
import { buffMultiplier } from './TownStatus.js';
import { workBonus, addExperience } from './SkillSystem.js';
import { isFreezing } from './HeatingSystem.js';
import { equipmentWorkSpeed } from './Equipment.js';
import { arePartners } from './RelationshipSystem.js';
import { HEATING } from '../data/seasons.js';
import { clamp } from '../utils/math.js';

const INTERRUPTIBLE_KINDS = new Set(['social', 'leisure', 'idle', 'work']);

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
    this.brain = new Brain(world, rng, services);
    this.unsubscribers = [
      game.events.on('world:blocked', ({ tiles }) => this.onTilesBlocked(tiles)),
      game.events.on('ui:dismissWorker', ({ buildingId, characterId }) => this.dismissWorker(buildingId, characterId)),
      game.events.on('ui:rehireWorker', ({ buildingId, characterId }) => this.rehireWorker(buildingId, characterId)),
      // Şenlik başlayınca boş zamanı olanlar elindekini bırakıp şenliğe katılır
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

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    for (const c of this.world.characters) this.updateCharacter(c, tick);
  }

  updateCharacter(c, tick) {
    this.updateBubble(c, tick.simDt);
    const task = c.task;

    if (!task) {
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
    if (plan.inviteId) this.invite(c, hour);
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
    if (!partner || !this.brain.isAvailableForChat(partner, hour)) return;
    const building = this.world.getBuilding(c.task.buildingId);
    const partnerPlan = this.brain.planGathering(partner, building, c.task.spot);
    if (!partnerPlan) return;

    this.endTask(partner);
    partnerPlan.meetWithId = c.id;
    c.task.meetWithId = partner.id;
    c.activityLabel = this.travelLabel(c.task, ACTIVITIES[c.task.activity]);
    this.startPlan(partner, partnerPlan, hour);
    c.showBubble('chat', 2);
  }

  isUrgent(c, plan) {
    if (plan.activity === 'eat' || plan.activity === 'meal') return c.needs.hunger < c.profile.thresholds.hunger + 5;
    if (plan.activity === 'sleep') return true;
    return false;
  }

  travelLabel(task, activity) {
    if (task.meetWithId) {
      const partner = this.world.getCharacter(task.meetWithId);
      if (partner) return `${partner.name} ile buluşmaya gidiyor`;
    }
    let label = activity.travelLabel ?? activity.label;
    if (task.activity === 'haul' && task.cargo) label = label.replace('{resource}', RESOURCES[task.cargo].name.toLowerCase());
    if (task.item) label = label.replace('{item}', EQUIPMENT[task.item].name);
    return task.onBreak ? `${BREAK_PREFIX}${label}` : label;
  }

  performLabel(c, task, activity) {
    const building = task.buildingId ? this.world.getBuilding(task.buildingId) : null;
    let label = activity.label;
    if (task.activity === 'sleep' && task.nap) label = activity.napLabel;
    if (task.activity === 'meal' && building?.type === 'storage') label = activity.storageLabel;
    if (task.activity === 'build' && building?.project) label = building.project.kind === 'repair' ? 'Onarıyor: {target}' : 'Yükseltiyor: {target}';
    if (task.activity === 'craft') label = building?.craft ? label.replace('{item}', this.crafting.currentItemName(building)) : activity.idleLabel;
    if (task.item) label = label.replace('{item}', EQUIPMENT[task.item].name);
    if (building) label = label.replace('{target}', building.name);
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
    if (task.activity === 'meal' && !this.economy.spend({ food: MEAL_FOOD_COST })) {
      // Yolda stok bitti: kapıdan çıkıp başka çare arasın
      this.endTask(c);
      return;
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
    if (task.activity === 'sleep') this.applyHomeComfort(c, minutes);

    let bubbles = activity.bubbles;
    if (activity.kind === 'social' || activity.kind === 'festival') bubbles = this.performSocial(c, task, activity, minutes);
    // Şenlikte ritimle sağa sola dönerek dans eder
    if (activity.dance) c.facing = Math.floor((c.animTime + c.id * 0.3) / 0.6) % 2 === 0 ? 'left' : 'right';
    if (activity.kind === 'work' && !this.performWork(c, task, minutes)) {
      this.endTask(c);
      return;
    }
    if (c.visible) this.maybeShowBubble(c, bubbles);

    if (this.isFinished(c, task, activity, tick.hour)) {
      if (task.activity === 'moveIn') c.newcomer = false;
      if (task.activity === 'relocate') c.relocating = false;
      if (task.activity === 'equip') this.crafting.equip(c, task.item);
      if (task.activity === 'sleep' && !task.nap) this.events.emit('character:woke', { character: c });
      // Sıcak yemek bir süre tok tutar (NeedsSystem acıkmayı yavaşlatır)
      if (task.activity === 'innMeal') c.buffs.warmMeal = this.world.state.totalMinutes + WARM_MEAL.hours * 60;
      this.endTask(c);
    }
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
      gain *= bond.socialBonus;
      c.needs.fun = clamp(c.needs.fun + bond.funBonus * minutes, 0, 100);
    }
    c.needs.social = clamp(c.needs.social + gain * minutes, 0, 100);
    if (partner) {
      if (activity.faceBuilding) c.faceToward(building.center.x, building.center.y);
      else c.faceToward(partner.x, partner.y);
      const label = activity.partnerLabel.replace('{partner}', this.partnerName(c, partner));
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
    const work = c.profile.work;
    c.needs.energy = clamp(c.needs.energy - DEFAULT_WORK.energyCost * work.fatigue * minutes, 0, 100);
    c.needs.fun = clamp(c.needs.fun - DEFAULT_WORK.funCost * minutes, 0, 100);
    // Kasaba bonusları (Alet Paketi, Şenlik Coşkusu) herkesi, meslek ustalığı ustayı, kişisel ekipman
    // (Sağlam Alet, Sırt Çantası) da kuşananı hızlandırır
    const amount =
      minutes * work.speed * buffMultiplier(this.world.state, 'workSpeed') * workBonus(c, task.activity) * equipmentWorkSpeed(c);
    addExperience(this.events, c, task.activity, minutes);

    if (task.jobId) {
      const job = this.jobs.getJob(task.jobId);
      if (!job) return false;
      if (!this.jobs.applyWork(job, amount)) return true;
      const { yields } = this.jobs.complete(job);
      this.collectYields(c, yields);
      return false;
    }

    const building = this.world.getBuilding(task.workBuildingId);
    if (!building || building.frozen) return false; // tarla dondu: iş biter
    if (building.definition.kitchen) {
      this.cook(building, amount);
      return true;
    }
    if (building.definition.crafting) {
      const working = this.crafting.work(building, amount);
      if (working) c.activityLabel = this.performLabel(c, task, ACTIVITIES[task.activity]);
      return working;
    }
    const production = building?.definition.production;
    if (!production) return false;
    // Verim (oduncu için çevredeki ağaç sayısı) StructureSystem'de hesaplanır
    building.productionBuffer += (production.perHour / 60) * amount * building.efficiency;
    const whole = Math.floor(building.productionBuffer);
    if (whole > 0) {
      building.productionBuffer -= whole;
      building.producedToday += this.economy.add(production.resource, whole);
    }
    return true;
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
      if (!this.economy.spend({ food: kitchen.foodPerMeal })) {
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
    return task.elapsed >= (task.duration ?? 0);
  }

  /** Aynı toplanma yerinde etkinliğini sürdüren diğer karakter: yakın olan, ama arkadaşlar öne geçer. */
  nearestPartner(c, task) {
    let best = null;
    for (const other of this.world.characters) {
      if (other === c || other.task?.buildingId !== task.buildingId) continue;
      if (other.task.activity !== task.activity || other.task.phase !== 'perform') continue;
      const rank = Math.hypot(other.x - c.x, other.y - c.y) - this.relationships.get(c, other) * 0.8;
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
