// Oyuncunun verdiği iş emirleri (iş kuyruğu) ve bu işlerin kime gideceği.
//
//   İş türleri (data/jobs.js): build (şantiye, yükseltme, onarım), chop (ağaç), mine (kaya/çakıl),
//   forage (böğürtlen)
//   Bir iş: { id, type, x, y, object?, buildingId?, project?, work, progress, assignees: [] }
//   project: 'upgrade' | 'repair' — inşaat işi var olan bir yapıyı geliştiriyor (Building.project)
//
// Sakinler işleri kendileri seçer (Brain -> findWorkFor). İş bitince 'job:completed'
// olayı yayınlanır: ConstructionSystem şantiyeyi binaya, NatureSystem kesilen ağacı
// kütüğe/fidana çevirir. Hasat edilen kaynak, karakterin sırtında kilere taşınır.
import { JOBS } from '../data/jobs.js';
import { OBJECT_TYPES } from '../data/tiles.js';
import { BUILDINGS } from '../data/buildings.js';
import { ACTIVITY_SKILLS, SKILL_PREFERENCE_TILES } from '../data/skills.js';
import { getSeason } from '../data/seasons.js';
import { skillLevel } from './SkillSystem.js';

const PRODUCTION_PRIORITY = 2; // üretim binalarında çalışmak, emirli işlerden sonra gelir
const PATH_CHECKS = 5; // en yakın birkaç aday için gerçek yol aranır

export class JobSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   */
  constructor(game, world) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
  }

  get jobs() {
    return this.state.jobs;
  }

  getJob(id) {
    return this.jobs.find((j) => j.id === id) ?? null;
  }

  /** Bir karodaki nesneyi ya da yapıyı hedefleyen iş. */
  jobAt(x, y) {
    const occupant = this.world.map.getOccupant(x, y);
    return this.jobs.find((j) => (j.buildingId ? j.buildingId === occupant && occupant !== 0 : j.x === x && j.y === y)) ?? null;
  }

  /** Bu karoya toplama emri verilebilir mi? */
  isHarvestable(x, y) {
    const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
    if (building) return !building.underConstruction && Boolean(BUILDINGS[building.type].harvest) && building.berries > 0;
    const object = this.world.map.getObject(x, y);
    return Boolean(object && OBJECT_TYPES[object].harvest);
  }

  /** Toplama emri verir. Başarılıysa iş döner. */
  designate(x, y) {
    if (this.jobAt(x, y) || !this.isHarvestable(x, y)) return null;
    const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
    if (building) {
      const harvest = BUILDINGS[building.type].harvest;
      return this.addJob({
        type: harvest.job,
        x: building.tileX,
        y: building.tileY,
        buildingId: building.id,
        work: harvest.workPerBerry * building.berries,
      });
    }
    const object = this.world.map.getObject(x, y);
    const harvest = OBJECT_TYPES[object].harvest;
    return this.addJob({ type: harvest.job, x, y, object, work: harvest.work });
  }

  createBuildJob(building) {
    return this.addJob({
      type: 'build',
      x: building.tileX,
      y: building.tileY,
      buildingId: building.id,
      work: building.definition.buildWork,
      progress: building.buildProgress,
    });
  }

  /** Yükseltme ya da onarım işi (yapı ayakta kalır, inşaatçılar çevresinde çalışır). */
  createProjectJob(building) {
    return this.addJob({
      type: 'build',
      project: building.project.kind,
      x: building.tileX,
      y: building.tileY,
      buildingId: building.id,
      work: building.project.work,
      progress: building.project.progress,
    });
  }

  addJob(fields) {
    const job = { id: this.state.nextJobId++, progress: 0, assignees: [], ...fields };
    this.jobs.push(job);
    return job;
  }

  cancel(job) {
    const index = this.jobs.indexOf(job);
    if (index >= 0) this.jobs.splice(index, 1);
  }

  /** Bir yapıya bağlı tüm işleri siler (yıkım). */
  cancelForBuilding(buildingId) {
    for (const job of [...this.jobs]) if (job.buildingId === buildingId) this.cancel(job);
  }

  assign(job, characterId) {
    if (!job.assignees.includes(characterId)) job.assignees.push(characterId);
  }

  releaseCharacter(characterId) {
    for (const job of this.jobs) job.assignees = job.assignees.filter((id) => id !== characterId);
  }

  /** İşin hâlâ geçerli olup olmadığı (hedef yok olduysa iş silinir). */
  isValid(job) {
    if (!this.jobs.includes(job)) return false;
    if (job.buildingId) {
      const building = this.world.getBuilding(job.buildingId);
      if (!building) return false;
      if (job.type === 'forage' && building.berries <= 0) return false;
      return true;
    }
    return this.world.map.getObject(job.x, job.y) === job.object;
  }

  /** Hedef geçersizleşen işleri temizler. */
  update() {
    for (const job of [...this.jobs]) if (!this.isValid(job)) this.cancel(job);
  }

  /** İşe katkı ekler; iş bittiyse true. */
  applyWork(job, amount) {
    job.progress = Math.min(job.work, job.progress + amount);
    if (job.type === 'build') {
      const building = this.world.getBuilding(job.buildingId);
      if (building?.project && job.project) building.project.progress = job.progress;
      else if (building) building.buildProgress = job.progress;
    }
    return job.progress >= job.work;
  }

  /**
   * İşi tamamlar ve dünyaya etkisini uygular.
   * Dönüş: { yields: { kaynak: miktar } } — hasat edilen kaynak (inşaatta boş)
   */
  complete(job) {
    this.cancel(job);
    let yields = {};
    if (job.type === 'forage') {
      const bush = this.world.getBuilding(job.buildingId);
      const harvest = BUILDINGS.berryBush.harvest;
      const taken = bush ? bush.berries : 0;
      if (bush) bush.berries = 0;
      // Sonbahar hasadı daha bereketli
      const bounty = Math.max(1, getSeason(this.state.time.day).berries);
      yields = Object.fromEntries(Object.entries(harvest.yieldsPerBerry).map(([r, v]) => [r, Math.round(v * taken * bounty)]));
    } else if (job.type === 'chop' || job.type === 'mine') {
      const harvest = OBJECT_TYPES[job.object].harvest;
      this.world.map.setObject(job.x, job.y, harvest.leaves);
      this.world.refreshStaticData();
      yields = { ...harvest.yields };
    }
    this.events.emit('job:completed', { job, yields });
    return { yields };
  }

  // ---------------------------------------------------------------------------
  // İş arama
  // ---------------------------------------------------------------------------

  /** İşin hedefine uzanmak için durulabilecek karolar. */
  spotsFor(job) {
    if (job.buildingId) {
      const building = this.world.getBuilding(job.buildingId);
      return building ? this.world.getSpots(building) : [];
    }
    return this.world.getApproachSpots(job.x, job.y);
  }

  /** İşin hedefinin dünya pikseli merkezi. */
  targetCenter(job) {
    const building = job.buildingId ? this.world.getBuilding(job.buildingId) : null;
    if (building) return building.center;
    return { x: job.x * 16 + 8, y: job.y * 16 + 8 };
  }

  /**
   * Bu üretim binasındaki son boş yer için daha deneyimli (en az Kalfa) ve şu an çalışmayan biri
   * varsa acemi beklesin: işi usta alsın. Son yer değilse ya da usta yoksa false.
   */
  expertWaiting(c, building) {
    const def = BUILDINGS[building.type];
    if (building.workerIds.size < building.workerSlots - 1) return false;
    const skill = ACTIVITY_SKILLS[def.workActivity];
    if (!skill) return false;
    const mine = skillLevel(c, skill).level;
    return this.world.characters.some((other) => {
      if (other === c || !other.visible || other.newcomer || other.isChild || building.excludedWorkers.has(other.id)) return false;
      if (other.task?.workBuildingId || other.task?.jobId) return false; // zaten çalışıyor
      const level = skillLevel(other, skill).level;
      return level >= 2 && level > mine;
    });
  }

  /**
   * Karakter için en uygun işi bulur: önce şantiyeler, sonra toplama emirleri,
   * sonra üretim binalarındaki boş koltuklar. Yakın olan tercih edilir. Çocuklar çalışmaz; oyuncunun
   * işten çıkardığı sakin o yapıya gitmez; yapacak işi olmayan (boşta) atölyeye kimse gitmez.
   * Dönüş: { job?, building?, spot } ya da null
   */
  findWorkFor(c, origin) {
    if (c.isChild) return null;
    const candidates = [];
    const freeSpot = (spots) => {
      const free = spots.filter((s) => !this.world.isReserved(s.x, s.y, c.id));
      if (free.length === 0) return null;
      return free.reduce((best, s) => (dist(s, origin) < dist(best, origin) ? s : best));
    };

    // Deneyimli olduğu iş daha yakınmış gibi görünür: ustalar kendi işini seçer (Hırslı taş işini sever)
    const preference = (activity) => {
      const skill = ACTIVITY_SKILLS[activity];
      return skill ? (skillLevel(c, skill).level - 1) * SKILL_PREFERENCE_TILES + (c.profile.skillPreference[skill] ?? 0) : 0;
    };

    for (const job of this.jobs) {
      const full = job.assignees.length >= JOBS[job.type].maxWorkers && !job.assignees.includes(c.id);
      if (full || !this.isValid(job)) continue;
      const spot = freeSpot(this.spotsFor(job));
      if (spot) candidates.push({ priority: JOBS[job.type].priority, d: dist(spot, origin) - preference(job.type), job, spot });
    }
    for (const building of this.world.getCompleted()) {
      const def = BUILDINGS[building.type];
      const workers = building.workerSlots;
      if (!workers || (building.workerIds.size >= workers && !building.workerIds.has(c.id))) continue;
      if (building.frozen || building.idle) continue; // kışın donmuş tarlada, malzemesiz atölyede iş yok
      if (building.excludedWorkers.has(c.id)) continue; // oyuncu bu işten çıkardı
      if (!building.workerIds.has(c.id) && this.expertWaiting(c, building)) continue;
      const spot = freeSpot(this.world.getSpots(building));
      if (spot) candidates.push({ priority: PRODUCTION_PRIORITY, d: dist(spot, origin) - preference(def.workActivity), building, spot });
    }

    candidates.sort((a, b) => a.priority - b.priority || a.d - b.d);
    for (const candidate of candidates.slice(0, PATH_CHECKS)) {
      if (this.world.findPath(origin, candidate.spot)) return candidate;
    }
    return null;
  }
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
