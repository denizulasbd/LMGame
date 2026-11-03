// İnşaat ve yıkım kuralları:
//   - checkPlacement : hayalet önizleme için "buraya kurulabilir mi, neden olmaz?"
//   - placeSite      : maliyeti öder, şantiye kurar ve inşaat işi açar
//   - paintTile      : yol ve köprü gibi zeminleri anında döşer
//   - demolishAt     : yapıyı yıkar (iade ile) ya da yolu/köprüyü kaldırır
//   - inşaat işi bitince ('job:completed') şantiyeyi gerçek binaya çevirir
//   - startProject   : (8. aşama) var olan yapıyı Seviye 2'ye yükseltir ya da harabeyi onarır; maliyet
//                      peşin ödenir, inşaatçılar yapının çevresinde çalışır, yapı bu sırada işlemeye devam eder
//   - proje bitince yapı Seviye 2 olur ('building:upgraded') ya da harabe onarılır ('ruin:restored';
//     erzak kampının hazinesi stoğa eklenir)
import { BUILDINGS, TILE_BUILDS, TILE_REMOVAL } from '../data/buildings.js';
import { OBJECT_TYPES, TILE_TYPES, GROUND_TILES } from '../data/tiles.js';
import { formatCost } from '../data/resources.js';
import { Building } from '../entities/Building.js';
import { assignBridgeVariants } from '../world/WorldGenerator.js';
import { accessTiles, hasAccessRule } from '../world/footprint.js';

const DEMOLISH_REFUND = 0.5;

export class ConstructionSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./EconomySystem.js').EconomySystem} economy
   * @param {import('./JobSystem.js').JobSystem} jobs
   * @param {{ groundAt?: (x: number, y: number) => string|null }} options
   *   groundAt: harita üretildiğinde o karoda olan doğal zemin (yol kaldırılınca biyom geri gelsin)
   */
  constructor(game, world, economy, jobs, { groundAt = null } = {}) {
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.jobs = jobs;
    this.groundAt = groundAt;
    this.unsubscribe = game.events.on('job:completed', ({ job }) => {
      if (job.type !== 'build') return;
      const building = this.world.getBuilding(job.buildingId);
      if (job.project) this.completeProject(building);
      else this.complete(building);
    });
  }

  destroy() {
    this.unsubscribe();
  }

  /** Fare bir karonun üzerindeyken binanın sol üst karosu (fare ayak izinin ortasında kalsın). */
  anchorFor(type, tileX, tileY) {
    const def = BUILDINGS[type];
    if (!def) return { x: tileX, y: tileY };
    return { x: tileX - Math.floor((def.size.w - 1) / 2), y: tileY - Math.floor((def.size.h - 1) / 2) };
  }

  /**
   * Bir yapının (sol üst köşesi tileX, tileY) buraya kurulup kurulamayacağı.
   * Dönüş: { ok, reason, footprint: [{x,y}], doors: [{x,y}], orientation? }
   */
  checkPlacement(type, tileX, tileY) {
    const def = BUILDINGS[type];
    const map = this.world.map;
    const allowed = def.allowedTiles ?? GROUND_TILES;
    const footprint = [];
    // Kasabada tek olabilen yapı (anıt) zaten varsa önce bu söylenir
    let reason = def.unique && this.world.getBuildingsOfType(type).length > 0 ? `Kasabada yalnızca bir ${def.name} olabilir` : null;
    let orientation = 'right';

    for (let y = tileY; y < tileY + def.size.h; y++) {
      for (let x = tileX; x < tileX + def.size.w; x++) {
        footprint.push({ x, y });
        if (reason) continue;
        if (!map.inBounds(x, y)) reason = 'Harita dışına taşıyor';
        else if (map.getOccupant(x, y) !== 0) reason = 'Başka bir yapının üstüne kurulamaz';
        else if (!allowed.includes(map.get(x, y))) reason = `${TILE_TYPES[map.get(x, y)].name} üzerine kurulamaz`;
        else {
          const object = map.getObject(x, y);
          if (object && !OBJECT_TYPES[object].clearable) reason = `Önce ${OBJECT_TYPES[object].name.toLowerCase()} temizlenmeli`;
        }
      }
    }

    // Yakınında kaya gibi doğal nesneler isteyen yapılar (taş ocağı)
    if (!reason && def.requires) reason = this.checkRequirements(def, tileX, tileY);
    // Önce başka bir yapı gerektirenler (pazar yeri -> kiler)
    if (!reason && def.requiresBuilding && this.world.getCompleted(def.requiresBuilding.type).length === 0) {
      reason = def.requiresBuilding.reason;
    }

    // İskele: bir sütun kum, yanındaki sütun su olmalı; su yönü belirler
    if (!reason && def.placement === 'shore') {
      orientation = this.shoreOrientation(tileX, tileY) ?? null;
      if (!orientation) {
        reason = 'Nehir kıyısına, kumla suyun birleştiği yere kurulmalı';
        orientation = 'right';
      }
    }

    // Kapı / çalışma noktası yürünebilir ve kasabaya bağlı olmalı
    const doors = accessTiles(type, tileX, tileY, orientation);
    const approachable = (x, y) => map.isWalkable(x, y) && this.world.isReachable(x, y);
    if (!reason && def.doorTiles && !doors.every((d) => approachable(d.x, d.y))) {
      reason = 'Kapının önü yola bağlı ve açık olmalı';
    }
    // Şantiyede herkes yapının çevresinde çalıştığı için çevresine ulaşılabilmesi her yapıda şarttır
    if (!reason && !def.doorTiles && !doors.some((d) => approachable(d.x, d.y))) {
      reason = def.spots === 'front' ? 'Önü açık ve yola bağlı olmalı' : def.spots === 'pier' ? 'Kıyıya ulaşılamıyor' : 'Çevresine ulaşılamıyor';
    }
    // Başka bir yapının kapısını ya da çalışma yerini kapatmasın
    if (!reason) {
      const covered = new Set(footprint.map((t) => `${t.x},${t.y}`));
      const blocked = this.world.buildings.find(
        (b) => hasAccessRule(BUILDINGS[b.type]) &&
          accessTiles(b.type, b.tileX, b.tileY, b.orientation).some((t) => covered.has(`${t.x},${t.y}`))
      );
      if (blocked) reason = `${blocked.name} girişinin önüne kurulamaz`;
    }
    if (!reason && !this.economy.canAfford(def.cost)) {
      reason = `Yetersiz kaynak: ${this.economy.missing(def.cost).join(', ')}`;
    }
    return { ok: !reason, reason, footprint, doors, orientation };
  }

  /** Yakında yeterince kaya / çakıl var mı? Yoksa gerekçe metni döner. */
  checkRequirements(def, tileX, tileY) {
    const { nearObjects, radius, min, reason } = def.requires;
    const cx = tileX + Math.floor(def.size.w / 2);
    const cy = tileY + Math.floor(def.size.h / 2);
    let count = 0;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (nearObjects.includes(this.world.map.getObject(x, y))) count++;
      }
    }
    return count >= min ? null : reason;
  }

  /**
   * 2x2 iskele ayak izi için su yönü: sol sütun kum + sağ sütun su ise 'right', tersi ise 'left'.
   * Her iki satırın da aynı olması gerekir. Uygun değilse null.
   */
  shoreOrientation(tileX, tileY) {
    const map = this.world.map;
    const column = (x) => [map.get(x, tileY), map.get(x, tileY + 1)];
    const left = column(tileX);
    const right = column(tileX + 1);
    const all = (tiles, type) => tiles.every((t) => t === type);
    if (all(left, 'sand') && all(right, 'water')) return 'right';
    if (all(left, 'water') && all(right, 'sand')) return 'left';
    return null;
  }

  /** Şantiye kurar. Dönüş: { ok, reason, building } */
  placeSite(type, tileX, tileY) {
    const check = this.checkPlacement(type, tileX, tileY);
    if (!check.ok) return check;
    const def = BUILDINGS[type];
    this.economy.spend(def.cost);

    const cabins = this.world.getBuildingsOfType('cabin').length;
    // tone: kulübede çatı rengi, çiçek tarhında renk düzeni; yapı sayısına göre dönüşür
    const tone = type === 'flowerBed' ? this.world.getBuildingsOfType('flowerBed').length : cabins;
    const building = new Building({ type, tileX, tileY, tone, orientation: check.orientation, underConstruction: true });
    this.world.addBuilding(building);
    this.jobs.createBuildJob(building);
    this.events.emit('world:blocked', { tiles: check.footprint });
    this.events.emit('building:placed', { building });
    this.events.emit('toast', { text: `Şantiye kuruldu: ${def.name} (${formatCost(def.cost)})`, tone: 'info', icon: 'hammer' });
    return { ok: true, building };
  }

  /** Yol / köprü döşenebilir mi? */
  checkPaint(type, x, y) {
    const def = TILE_BUILDS[type];
    const map = this.world.map;
    if (!map.inBounds(x, y)) return { ok: false, reason: 'Harita dışı' };
    const tile = map.get(x, y);
    if (tile === def.result) return { ok: false, reason: `Zaten ${def.name.toLowerCase()}`, already: true };
    if (map.getOccupant(x, y) !== 0) return { ok: false, reason: 'Yapının üstüne döşenemez' };
    if (!def.allowedTiles.includes(tile)) return { ok: false, reason: `${TILE_TYPES[tile].name} üzerine döşenemez` };
    const object = map.getObject(x, y);
    if (object && !OBJECT_TYPES[object].clearable) return { ok: false, reason: `Önce ${OBJECT_TYPES[object].name.toLowerCase()} temizlenmeli` };
    if (!this.economy.canAfford(def.cost)) return { ok: false, reason: `Yetersiz kaynak: ${this.economy.missing(def.cost).join(', ')}` };
    return { ok: true };
  }

  /** Zemini anında döşer. Ulaşılabilirlik güncellemesini çağıran (fırça bitince) yapar. */
  paintTile(type, x, y) {
    const check = this.checkPaint(type, x, y);
    if (!check.ok) return check;
    const def = TILE_BUILDS[type];
    this.economy.spend(def.cost);
    this.world.map.setObject(x, y, null);
    this.world.map.set(x, y, def.result);
    if (def.result === 'bridge') assignBridgeVariants(this.world.map);
    return { ok: true };
  }

  /** Bu karoda yıkılabilecek bir şey var mı (önizleme için)? */
  describeDemolish(x, y) {
    const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
    if (building) {
      const reason = this.demolishBlocker(building);
      return { ok: !reason, reason: reason ?? `${building.underConstruction ? 'Şantiyeyi iptal et' : 'Yık'}: ${building.name}` };
    }
    const tile = this.world.map.get(x, y);
    if (TILE_REMOVAL[tile]) {
      if (this.world.charactersOnTile(x, y).length > 0) return { ok: false, reason: 'Üzerinde biri var' };
      return { ok: true, reason: `Kaldır: ${TILE_TYPES[tile].name}` };
    }
    return { ok: false, reason: 'Burada yıkılacak bir şey yok' };
  }

  demolishBlocker(building) {
    if (!BUILDINGS[building.type].demolishable) return `${building.name} yıkılamaz`;
    const residents = this.world.getResidents(building);
    if (residents.length > 0) return `Bu evde ${residents.map((c) => c.name).join(' ve ')} yaşıyor`;
    if (building.occupants.size > 0) return 'İçeride biri var';
    return null;
  }

  /** Yıkım aracı: yapıyı yıkar ya da yolu / köprüyü kaldırır. Dönüş: { ok, reason } */
  demolishAt(x, y) {
    const check = this.describeDemolish(x, y);
    if (!check.ok) return check;
    const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
    if (building) return this.demolish(building);

    const tile = this.world.map.get(x, y);
    // Toprak yol, harita üretildiğinde altında olan biyom zeminine (yoksa çimene) döner
    const removed = TILE_REMOVAL[tile] === 'grass' ? this.groundAt?.(x, y) ?? 'grass' : TILE_REMOVAL[tile];
    this.world.map.set(x, y, removed);
    if (tile === 'bridge') assignBridgeVariants(this.world.map);
    this.world.refreshStaticData();
    return { ok: true };
  }

  demolish(building) {
    const def = BUILDINGS[building.type];
    const ratio = building.underConstruction && building.buildProgress === 0 ? 1 : DEMOLISH_REFUND;
    const name = building.name;
    this.jobs.cancelForBuilding(building.id);
    this.world.removeBuilding(building);
    this.economy.refund(def.cost, ratio);
    // Yükseltilmiş ya da yükseltilmekte olan yapıda yükseltme maliyetinin de yarısı geri gelir
    if (def.upgrade && (building.upgraded || building.project)) this.economy.refund(def.upgrade.cost, DEMOLISH_REFUND);
    this.events.emit('building:removed', building);
    this.events.emit('toast', {
      text: `${building.underConstruction ? 'Şantiye iptal edildi' : 'Yıkıldı'}: ${name} (%${Math.round(ratio * 100)} iade)`,
      tone: 'info',
      icon: 'demolish',
    });
    return { ok: true };
  }

  /** İnşaat işi bitti: şantiye gerçek binaya dönüşür. */
  complete(building) {
    if (!building || !building.underConstruction) return;
    building.underConstruction = false;
    building.buildProgress = building.definition.buildWork;
    this.world.refreshStaticData();
    this.events.emit('building:completed', building);
    const extra = building.type === 'cabin' ? ' Yarın sabah yeni sakinler gelebilir.' : '';
    this.events.emit('toast', { text: `İnşaat tamamlandı: ${building.name}!${extra}`, tone: 'success', icon: 'hammer' });
  }

  // ---------------------------------------------------------------------------
  // Yükseltme (Seviye 2) ve harabe onarımı
  // ---------------------------------------------------------------------------

  /** Yapının sıradaki geliştirmesi: harabeyse onarım, yükseltilebiliyorsa yükseltme, yoksa null. */
  projectFor(building) {
    const def = BUILDINGS[building.type];
    if (building.ruined) return def.ruin ? { kind: 'repair', spec: def.ruin } : null;
    if (def.upgrade && !building.upgraded) return { kind: 'upgrade', spec: def.upgrade };
    return null;
  }

  /** Yükseltme / onarım başlatılabilir mi? Dönüş: { ok, reason, kind?, spec? } */
  checkProject(building) {
    if (!building) return { ok: false, reason: 'Yapı bulunamadı' };
    const next = this.projectFor(building);
    if (!next) return { ok: false, reason: building.upgraded ? 'Zaten Seviye 2' : 'Bu yapı geliştirilemez' };
    const { kind, spec } = next;
    let reason = null;
    if (building.underConstruction) reason = 'Önce inşaatı bitmeli';
    else if (building.project) reason = kind === 'repair' ? 'Onarım sürüyor' : 'Yükseltme sürüyor';
    else if (!this.hasReachableRing(building)) reason = 'Çevresine ulaşılamıyor: önce bir yol aç';
    else if (!this.economy.canAfford(spec.cost)) reason = `Yetersiz kaynak: ${this.economy.missing(spec.cost).join(', ')}`;
    return { ok: !reason, reason, kind, spec };
  }

  /** İnşaatçıların duracağı halkada kasabaya bağlı en az bir karo var mı? */
  hasReachableRing(building) {
    const { w, h } = BUILDINGS[building.type].size;
    for (let y = building.tileY - 1; y <= building.tileY + h; y++) {
      for (let x = building.tileX - 1; x <= building.tileX + w; x++) {
        const inside = x >= building.tileX && x < building.tileX + w && y >= building.tileY && y < building.tileY + h;
        if (!inside && this.world.map.isWalkable(x, y) && this.world.isReachable(x, y)) return true;
      }
    }
    return false;
  }

  /** Yükseltmeyi ya da onarımı başlatır: maliyeti öder ve inşaat işi açar. Dönüş: { ok, reason } */
  startProject(building) {
    const check = this.checkProject(building);
    if (!check.ok) return check;
    const { kind, spec } = check;
    this.economy.spend(spec.cost);
    const before = building.name;
    building.project = { kind, progress: 0, work: spec.buildWork };
    this.world.invalidateSpots(building);
    this.jobs.createProjectJob(building);
    this.events.emit('building:projectStarted', { building, kind });
    this.events.emit('toast', {
      text: kind === 'repair' ? `Onarım başladı: ${before} (${formatCost(spec.cost)})` : `Yükseltme başladı: ${before} → ${spec.name} (${formatCost(spec.cost)})`,
      tone: 'info',
      icon: 'hammer',
    });
    return { ok: true };
  }

  /** Sürmekte olan yükseltmeyi / onarımı iptal eder (hiç çalışılmadıysa tamamı, yoksa yarısı iade). */
  cancelProject(building) {
    if (!building?.project) return { ok: false, reason: 'Sürmekte olan bir iş yok' };
    const spec = this.projectFor(building).spec;
    const ratio = building.project.progress === 0 ? 1 : DEMOLISH_REFUND;
    for (const job of [...this.jobs.jobs]) if (job.buildingId === building.id && job.project) this.jobs.cancel(job);
    building.project = null;
    this.world.invalidateSpots(building);
    this.economy.refund(spec.cost, ratio);
    this.events.emit('toast', { text: `İptal edildi: ${building.name} (%${Math.round(ratio * 100)} iade)`, tone: 'info', icon: 'demolish' });
    return { ok: true };
  }

  /** Yükseltme / onarım işi bitti. */
  completeProject(building) {
    if (!building?.project) return;
    const { kind } = building.project;
    const before = building.name;
    building.project = null;
    if (kind === 'repair') {
      building.condition = 'restored';
      this.economy.recalculateCapacity(); // onarılan kampın depo katkısı hazineden önce gelsin
      const treasure = BUILDINGS[building.type].ruin.treasure ?? null;
      const found = {};
      let spilled = false;
      for (const [resource, amount] of Object.entries(treasure ?? {})) {
        const added = this.economy.add(resource, amount);
        if (added > 0) found[resource] = added;
        if (added < amount) spilled = true;
      }
      this.world.invalidateSpots(building);
      this.world.refreshStaticData();
      this.events.emit('ruin:restored', { building, from: before, treasure: treasure ? found : null });
      const full = spilled ? ' (depo dolu olduğu için bir kısmı sığmadı)' : '';
      const loot = treasure ? ` İçinden çıkan hazine: ${formatCost(found)}${full}!` : '';
      this.events.emit('toast', { text: `${before} onarıldı: ${building.name} yeniden hayat buldu!${loot}`, tone: 'success', icon: 'star' });
      return;
    }
    building.level = 2;
    this.world.invalidateSpots(building);
    this.world.refreshStaticData();
    this.events.emit('building:upgraded', { building, from: before });
    this.events.emit('toast', { text: `Yükseltme tamamlandı: ${before} artık bir ${building.name}!`, tone: 'success', icon: 'star' });
  }
}
