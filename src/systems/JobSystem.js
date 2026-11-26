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
import { ownCraftSkill } from './Wants.js';
import { WANT_RULES } from '../data/wants.js';
import { LUXURY_WORK } from '../data/refinery.js';
import { hasTag, hasAnyTag } from './Chemistry.js';
import { EMOTION_RULES } from '../data/chemistry.js';
import { BOND_RULES } from '../data/bonds.js';
import { crewBond } from './Bonds.js';
import { engineOn } from './Engines.js';
import { educationLevel } from './University.js'; // (32.4)
import { apprenticesOf } from './Apprenticeship.js'; // (32.4)
import { UNIVERSITY } from '../data/university.js'; // (32.4)

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

  /**
   * (14. aşama) Öncelikli toplama / kırma: oyuncu seç aracıyla bir ağaca, kayaya ya da çalıya tıklar. Emir yoksa verilir
   * ve öne alınır; boştaki işçiler ilk iş olarak oraya koşar ('job:urgent' { job }). Dönüş: iş ya da null.
   */
  prioritize(x, y) {
    const job = this.jobAt(x, y) ?? this.designate(x, y);
    if (!job || job.type === 'build') return null;
    job.urgent = true;
    this.events.emit('job:urgent', { job });
    return job;
  }

  /** Bu karoya toplama emri verilebilir mi? */
  isHarvestable(x, y) {
    if (!this.world.map.isOpen(x, y)) return false; // (34.1) kilitli parselde toplama yok
    const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
    if (building) return !building.underConstruction && Boolean(BUILDINGS[building.type].harvest) && building.berries > 0;
    const object = this.world.map.getObject(x, y);
    return Boolean(object && OBJECT_TYPES[object].harvest);
  }

  /** (30.6) Bu karoda toplanabilecek şeyin iş türü ('chop' ağaç, 'mine' kaya, 'forage' çalı) ya da null. */
  harvestKind(x, y) {
    if (!this.isHarvestable(x, y)) return null;
    const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
    if (building) return BUILDINGS[building.type].harvest.job;
    return OBJECT_TYPES[this.world.map.getObject(x, y)].harvest.job;
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
  /**
   * Bu yapıya sabitlenmiş ama şu an içinde çalışmayan sakin sayısı (onların yuvası boş bekletilir). (27.1) Emekli Kıdemli Bilge
   * (c.retired) işe gitmediği için yuvayı tutmaz; gönüllü ustaya dönünce (retired = false) yeniden sayılır.
   */
  reservedForPinned(building) {
    return this.world.characters.filter((o) => o.workplaceId === building.id && !building.workerIds.has(o.id) && !o.away && !o.retired).length;
  }

  /** Sabitlenmiş sakinin işi: kendi iş yerinde boş bir çalışma yeri (yapı kullanılamıyorsa null). */
  pinnedWork(c, origin) {
    const building = this.world.getBuilding(c.workplaceId);
    if (!building || !building.functional || !building.workerSlots || building.frozen || building.idle || building.damaged || building.isBurning) return null;
    if (building.workerIds.size >= building.workerSlots && !building.workerIds.has(c.id)) return null;
    const free = this.world.getSpots(building).filter((s) => !this.world.isReserved(s.x, s.y, c.id));
    if (free.length === 0) return null;
    const spot = free.reduce((best, s) => (dist(s, origin) < dist(best, origin) ? s : best));
    return this.world.findPath(origin, spot) ? { building, spot } : null;
  }

  expertWaiting(c, building) {
    const def = BUILDINGS[building.type];
    if (building.workerIds.size < building.workerSlots - 1) return false;
    const skill = ACTIVITY_SKILLS[def.workActivity];
    if (!skill) return false;
    const mine = skillLevel(c, skill).level;
    return this.world.characters.some((other) => {
      // Hasta ya da seferdeki usta beklenmez: yoksa son yuva o iyileşene kadar boş kalırdı
      if (other === c || !other.visible || other.newcomer || other.isChild || other.retired || other.illness || other.away || building.excludedWorkers.has(other.id)) return false;
      if (other.workplaceId !== null && other.workplaceId !== undefined && other.workplaceId !== building.id) return false; // başka yere sabitli
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
    // (25.1) Emekli Kıdemli Bilge ağır işlere gitmez (çekirdek sakin kuralıyla gönüllü bilgeler çalışır)
    if (c.isChild || c.retired) return null;
    // (13. aşama) Oyuncunun sabitlediği sakin yalnızca kendi iş yerinde çalışır (orası boştaysa dinlenir)
    if (c.workplaceId !== null && c.workplaceId !== undefined) return this.pinnedWork(c, origin);
    const candidates = [];
    const freeSpot = (spots) => {
      const free = spots.filter((s) => !this.world.isReserved(s.x, s.y, c.id));
      if (free.length === 0) return null;
      return free.reduce((best, s) => (dist(s, origin) < dist(best, origin) ? s : best));
    };

    // Deneyimli olduğu iş daha yakınmış gibi görünür: ustalar kendi işini seçer (Hırslı taş işini sever)
    // (29.3) mesleğinde ilerlemek / eser çıkarmak isteyen kendi uzmanlık işini biraz daha yakın görür (öncelik sırası değişmez)
    const ownSkill = ownCraftSkill(c);
    const preference = (activity) => {
      const skill = ACTIVITY_SKILLS[activity];
      if (!skill) return 0;
      return (skillLevel(c, skill).level - 1) * SKILL_PREFERENCE_TILES + (c.profile.skillPreference[skill] ?? 0) + (ownSkill !== null && skill === ownSkill ? WANT_RULES.workTiles : 0);
    };

    const bonds = engineOn('bonds');
    const grateful = hasAnyTag(c, 'grateful');
    for (const job of this.jobs) {
      const full = job.assignees.length >= JOBS[job.type].maxWorkers && !job.assignees.includes(c.id);
      if (full || !this.isValid(job)) continue;
      const spot = freeSpot(this.spotsFor(job));
      // Öncelikli işaretlenen hedef her işten önce gelir
      // (29.1) minnettar olduğu biri o işte çalışıyorsa yardıma koşar (iş daha yakınmış gibi görünür)
      const helping = grateful && job.assignees.some((id) => hasTag(c, id, 'grateful')) ? EMOTION_RULES.helpTiles : 0;
      if (spot) candidates.push({ priority: job.urgent ? -1 : JOBS[job.type].priority, d: dist(spot, origin) - preference(job.type) - helping - (bonds ? crewBond(this.state, c, job.assignees) * BOND_RULES.tilesPerPoint : 0), job, spot });
    }
    for (const building of this.world.getCompleted()) {
      const def = BUILDINGS[building.type];
      const workers = building.workerSlots;
      if (!workers || (building.workerIds.size >= workers && !building.workerIds.has(c.id))) continue;
      if (building.frozen || building.idle) continue; // kışın donmuş tarlada, malzemesiz atölyede iş yok
      if (building.excludedWorkers.has(c.id)) continue; // oyuncu bu işten çıkardı
      // (32.4) Müderris yetişkindir (öğrenci ve Genç olmaz); çırağı olan usta tezgâhından ayrılmaz (çırağın ilerlemesi ustaya bağlı)
      if (def.university && (c.lifeStage === 'youth' || c.higherStudy || apprenticesOf(this.state, c).length > 0)) continue;
      if (!building.workerIds.has(c.id) && this.reservedForPinned(building) >= workers - building.workerIds.size) continue; // yuvalar sabit çalışanlara ayrılmış
      if (!building.workerIds.has(c.id) && this.expertWaiting(c, building)) continue;
      const spot = freeSpot(this.world.getSpots(building));
      // (23. aşama) Gözcü Kulesi'nde nöbet, üretim yuvaları dolunca boşta kalan yetişkinlerin işidir (üretimden daha az öncelikli)
      // (24.2) Dokuma Tezgâhı ve Şerbethane lüks / ticaret fazlası işlerdir: fırıncı, çiftçi ve inşaat yuvalarından sonra gelir
      // (32.4) Darülfünun'un Müderris yuvası yalnızca ders saatinde açıktır (yapı başka saatte boşta): üretimden önce gelir; eğitimli öne çıkar
      const priority = def.guard ? PRODUCTION_PRIORITY + 1 : def.luxury ? PRODUCTION_PRIORITY + LUXURY_WORK.priority : def.university ? PRODUCTION_PRIORITY - 0.5 : PRODUCTION_PRIORITY;
      const scholar = def.university ? educationLevel(c) * UNIVERSITY.professorEducatedTiles : 0;
      if (spot) candidates.push({ priority, d: dist(spot, origin) - preference(def.workActivity) - scholar - (bonds ? crewBond(this.state, c, building.workerIds) * BOND_RULES.tilesPerPoint : 0), building, spot });
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
