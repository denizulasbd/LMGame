// İnşaat ve yıkım kuralları:
//   - checkPlacement : hayalet önizleme için "buraya kurulabilir mi, neden olmaz?"
//   - placeSite      : maliyeti öder, şantiye kurar ve inşaat işi açar
//   - paintTile      : yol ve köprü gibi zeminleri anında döşer
//   - demolishAt     : yapıyı yıkar (iade ile) ya da yolu/köprüyü kaldırır; (18. aşama) oyuncunun döşediği zemin
//                      harita üretildiğindeki hâline döner ve harcananın yarısı depoya iade edilir (küsurat birikir)
//   - inşaat işi bitince ('job:completed') şantiyeyi gerçek binaya çevirir
//   - startProject   : (8. aşama) var olan yapıyı Seviye 2'ye yükseltir ya da harabeyi onarır; maliyet
//                      peşin ödenir, inşaatçılar yapının çevresinde çalışır, yapı bu sırada işlemeye devam eder
//   - proje bitince yapı Seviye 2 olur ('building:upgraded') ya da harabe onarılır ('ruin:restored';
//     erzak kampının hazinesi stoğa eklenir)
import { isGoldenAge } from './GoldenAge.js';
import { BUILDINGS, TILE_BUILDS, TILE_REMOVAL, TILE_BUILD_BY_RESULT, mendSpec, PROJECT_WORDS } from '../data/buildings.js';
import { STREET_NAMES } from '../data/landscape.js';
import { STORM } from '../data/dilemmas.js';
import { mendSpecFor } from './Crisis.js';
import { OBJECT_TYPES, TILE_TYPES, GROUND_TILES } from '../data/tiles.js';
import { formatCost } from '../data/resources.js';
import { Building } from '../entities/Building.js';
import { assignBridgeVariants } from '../world/WorldGenerator.js';
import { accessTiles, hasAccessRule } from '../world/footprint.js';
import { TOWN_TIERS } from '../data/town.js';
import { EXOTIC_ITEMS } from '../data/exploration.js';
import { itemCount } from './Exploration.js';

const DEMOLISH_REFUND = 0.5;

export class ConstructionSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./EconomySystem.js').EconomySystem} economy
   * @param {import('./JobSystem.js').JobSystem} jobs
   * @param {{ groundAt?: (x: number, y: number) => string|null, baseTileAt?: (x: number, y: number) => string|null }} options
   *   groundAt: harita üretildiğinde o karoda olan doğal zemin (yol kaldırılınca biyom geri gelsin)
   *   baseTileAt: (18. aşama) harita üretildiğinde o karoda olan zemin (oyuncunun döşediği zemin kaldırılınca geri gelir)
   */
  constructor(game, world, economy, jobs, { groundAt = null, baseTileAt = null } = {}) {
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.jobs = jobs;
    this.groundAt = groundAt;
    this.baseTileAt = baseTileAt;
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
    // Kasaba seviyesiyle açılan yapılar (değirmen: Köy, belediye: Kasaba) önce bunu söyler
    if (!reason && def.requiresTier && (this.world.state.town?.tier ?? 1) < def.requiresTier) {
      reason = `${TOWN_TIERS[def.requiresTier - 1].name} seviyesine ulaşınca açılır`;
    }
    // (20. aşama) Nüfusla açılan yapılar (Ulu Saat Kulesi: 20 sakin); Altın Çağ'la açılan prestij yapıları
    if (!reason && def.requiresPopulation && this.world.state.characters.length < def.requiresPopulation) {
      reason = `Kasaba ${def.requiresPopulation} sakine ulaşınca açılır (şu an ${this.world.state.characters.length})`;
    }
    if (!reason && def.requiresGoldenAge && !isGoldenAge(this.world.state)) reason = "Ulu Saat Kulesi tamamlanıp Altın Çağ başlayınca açılır";
    // (22. aşama) Kraliyet Beratı'yla açılan anıt (Kraliyet Fermanı ödülü)
    if (!reason && def.requiresRoyalRight && !this.world.state.crown?.statueRight) reason = 'Bir Kraliyet Fermanı ödülü olarak Kraliyet Beratı alınınca açılır';
    // (16. aşama) Seferden gelen egzotik ganimetle dikilen yapılar (üzüm asması, kadim meşale)
    if (!reason && def.item && itemCount(this.world.state, def.item) < 1) {
      reason = `Önce bir keşif seferinden ${EXOTIC_ITEMS[def.item].name} getirilmeli`;
    }
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

    // Yakınında kaya gibi doğal nesneler isteyen yapılar (taş ocağı, demir madeni)
    if (!reason && def.requires) reason = this.checkRequirements(def, tileX, tileY);
    // Önce başka bir yapı gerektirenler (pazar yeri -> kiler)
    if (!reason && def.requiresBuilding && this.world.getCompleted(def.requiresBuilding.type).length === 0) {
      reason = def.requiresBuilding.reason;
    }
    // Asma: bir Sebze Bahçesi'nin ya da Ahşap Çardak'ın hemen yanına dikilir
    if (!reason && def.placement === 'nearGarden' && !this.touchesAny(tileX, tileY, def.size, ['garden', 'gazebo'])) {
      reason = 'Sebze Bahçesi ya da Ahşap Çardak kenarına dikilmeli';
    }

    // (24.3) Ticaret İskelesi / Kervan Konağı: ayak izinin bir kenarı suya ya da yola değmeli
    if (!reason && def.placement === 'tradeSite' && !this.touchesTile(tileX, tileY, def.size, ['water', 'path', 'cobble', 'plaza', 'bridge'])) {
      reason = 'Nehir kıyısına (iskele) ya da bir yolun kenarına (kervan konağı) kurulmalı';
    }
    // İskele: bir sütun kum, yanındaki sütun su olmalı; su yönü belirler
    if (!reason && def.placement === 'shore') {
      orientation = this.shoreOrientation(tileX, tileY) ?? null;
      if (!orientation) {
        reason = 'Nehir kıyısına, kumla suyun birleştiği yere kurulmalı';
        orientation = 'right';
      }
    }
    // Liman (12. aşama): kara yanı kum, kalanı su; suyun ötesinde teknelerin geçeceği açık bir su şeridi olmalı
    if (!reason && def.placement === 'harbor') {
      orientation = this.shoreOrientation(tileX, tileY, def.size.w) ?? null;
      if (!orientation) {
        reason = 'Nehir kıyısına kurulmalı: bir sütun kum, iki sütun su';
        orientation = 'right';
      } else {
        const channelX = orientation === 'right' ? tileX + def.size.w : tileX - 1;
        const open = [tileY, tileY + 1].every((y) => map.get(channelX, y) === 'water' && map.getOccupant(channelX, y) === 0);
        if (!open) reason = 'Limanın önünde teknelerin yanaşacağı açık su kalmalı (nehrin tamamını kapatma)';
      }
    }

    // Kapı / çalışma noktası yürünebilir ve yapı kurulduktan SONRA da kasabaya bağlı olmalı (önü yalnızca
    // kendi ayak izinin içinden bağlanan yapı kendi girişini koparmasın). Ulaşılabilirlik bir kez hesaplanır.
    const doors = accessTiles(type, tileX, tileY, orientation);
    let after = null;
    // Altından geçilebilen yapı (kemer) yolu kapatmaz
    const reachableAfter = () => (after ??= this.world.reachabilityWithout(def.walkable ? [] : footprint));
    const approachable = (x, y) => map.isWalkable(x, y) && map.inBounds(x, y) && reachableAfter()[map.index(x, y)] === 1;
    if (!reason && def.doorTiles && !doors.every((d) => approachable(d.x, d.y))) {
      reason = 'Kapının önü yola bağlı ve açık olmalı';
    }
    // Şantiyede herkes yapının çevresinde çalıştığı için çevresine ulaşılabilmesi her yapıda şarttır
    if (!reason && !def.doorTiles && !doors.some((d) => approachable(d.x, d.y))) {
      reason = def.spots === 'front' ? 'Önü açık ve yola bağlı olmalı' : def.spots === 'pier' ? 'Kıyıya ulaşılamıyor' : 'Çevresine ulaşılamıyor';
    }
    // Başka bir yapının kapısını ya da çalışma yerini kapatmasın (altından geçilebilen kemer kapatmaz)
    if (!reason && !def.walkable) {
      const covered = new Set(footprint.map((t) => `${t.x},${t.y}`));
      const blocked = this.world.buildings.find(
        (b) => hasAccessRule(BUILDINGS[b.type]) &&
          accessTiles(b.type, b.tileX, b.tileY, b.orientation).some((t) => covered.has(`${t.x},${t.y}`))
      );
      if (blocked) reason = `${blocked.name} girişinin önüne kurulamaz`;
    }
    // Başka bir yapıyı (ve onun önündeki yolu) kasabadan tamamen koparıp kapalı bir cepte bırakmasın
    if (!reason) {
      const isolated = this.world.wouldIsolate(footprint, reachableAfter());
      if (isolated) reason = `${isolated.name} kasabadan kopar: aradaki geçidi kapatma`;
    }
    // (29.2b) Yakındaki bir şantiyenin ya da iş yerinin SON açık çalışma karosunu kapatmasın (iş sonsuza dek beklemesin)
    if (!reason && !def.walkable) {
      const starved = this.wouldStarveWork(footprint, reachableAfter());
      if (starved) reason = `${starved.name} ${starved.underConstruction ? 'şantiyesinin' : 'iş yerinin'} son çalışma yerini kapatır: etrafında bir karo açık bırak`;
    }
    if (!reason && !this.economy.canAfford(def.cost)) {
      reason = `Yetersiz kaynak: ${this.economy.missing(def.cost).join(', ')}`;
    }
    return { ok: !reason, reason, footprint, doors, orientation };
  }

  /**
   * (29.2b) Bu ayak izi kurulursa çalışma noktası (halka / kapı önü / ön cephe) bugün var ama kurulunca SIFIRA inecek yakın bir
   * şantiye ya da iş yeri var mı? İlkini döndürür (yoksa null). Yalnızca ayak izine iki karo yakın yapılara bakılır.
   */
  wouldStarveWork(footprint, after) {
    const map = this.world.map;
    const covered = new Set(footprint.map((t) => map.index(t.x, t.y)));
    const xs = footprint.map((t) => t.x);
    const ys = footprint.map((t) => t.y);
    const [x0, x1, y0, y1] = [Math.min(...xs) - 2, Math.max(...xs) + 2, Math.min(...ys) - 2, Math.max(...ys) + 2];
    const usableNow = (x, y) => map.inBounds(x, y) && map.isWalkable(x, y) && this.world.isReachable(x, y);
    const usableAfter = (x, y) => map.inBounds(x, y) && map.isWalkable(x, y) && !covered.has(map.index(x, y)) && after[map.index(x, y)] === 1;
    for (const b of this.world.buildings) {
      const { w, h } = BUILDINGS[b.type].size;
      if (b.tileX + w - 1 < x0 || b.tileX > x1 || b.tileY + h - 1 < y0 || b.tileY > y1) continue;
      if (!b.underConstruction && !b.workerSlots) continue; // yalnızca şantiye ve iş yerleri
      // Yalnızca doğrudan (1 karolu) çalışma noktalarına bakılır: iki karo uzaktan çalışma yedeği (World.getSpots) kuralı gevşetmez
      if (this.world.computeSpots(b, usableNow).length === 0) continue; // zaten kapalıysa bu yapının suçu değil
      if (this.world.computeSpots(b, usableAfter).length === 0) return b;
    }
    return null;
  }

  /**
   * Yakında yeterince kaya / çakıl var mı? Yoksa gerekçe metni döner. requires.biome verilmişse ayak izinin
   * en az min karosu o biyomdaysa (demir madeni: kayalık tepe) yakında nesne aranmaz.
   */
  checkRequirements(def, tileX, tileY) {
    const { nearObjects, radius, min, reason, biome } = def.requires;
    if (biome) {
      let tiles = 0;
      for (let y = tileY; y < tileY + def.size.h; y++) {
        for (let x = tileX; x < tileX + def.size.w; x++) if (this.world.map.get(x, y) === biome.tile) tiles++;
      }
      if (tiles >= biome.min) return null;
    }
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
  shoreOrientation(tileX, tileY, width = 2) {
    const map = this.world.map;
    const column = (x) => [map.get(x, tileY), map.get(x, tileY + 1)];
    const all = (tiles, type) => tiles.every((t) => t === type);
    const columns = Array.from({ length: width }, (_, i) => column(tileX + i));
    // 'right': sol sütun kum, diğerleri su; 'left': sağ sütun kum, diğerleri su
    if (all(columns[0], 'sand') && columns.slice(1).every((c) => all(c, 'water'))) return 'right';
    if (all(columns[width - 1], 'sand') && columns.slice(0, -1).every((c) => all(c, 'water'))) return 'left';
    return null;
  }

  /** (24.3) Ayak izinin dört yanındaki karolardan biri verilen zeminlerden mi (çaprazlar hariç)? */
  touchesTile(tileX, tileY, size, tiles) {
    const map = this.world.map;
    const around = [];
    for (let x = tileX; x < tileX + size.w; x++) around.push([x, tileY - 1], [x, tileY + size.h]);
    for (let y = tileY; y < tileY + size.h; y++) around.push([tileX - 1, y], [tileX + size.w, y]);
    return around.some(([x, y]) => map.inBounds(x, y) && tiles.includes(map.get(x, y)));
  }

  /** Ayak izi, verilen türlerden bir yapıya (şantiye dahil) bitişik mi (çaprazlar dahil)? */
  touchesAny(tileX, tileY, size, types) {
    return this.world.buildings.some((b) => {
      if (!types.includes(b.type)) return false;
      const { w, h } = b.definition.size;
      const dx = Math.max(b.tileX - (tileX + size.w - 1), 0, tileX - (b.tileX + w - 1));
      const dy = Math.max(b.tileY - (tileY + size.h - 1), 0, tileY - (b.tileY + h - 1));
      return Math.max(dx, dy) === 1;
    });
  }

  /** Şantiye kurar. quiet: (18. aşama fırçası) bildirim çıkmaz. Dönüş: { ok, reason, building } */
  placeSite(type, tileX, tileY, { quiet = false } = {}) {
    const check = this.checkPlacement(type, tileX, tileY);
    if (!check.ok) return check;
    const def = BUILDINGS[type];
    this.economy.spend(def.cost);
    if (def.item) this.world.state.exploration.items[def.item] -= 1; // (16. aşama) egzotik ganimet harcanır

    const cabins = this.world.getBuildingsOfType('cabin').length;
    // tone: kulübede çatı rengi, çiçek tarhında renk düzeni; yapı sayısına göre dönüşür
    const tone = type === 'flowerBed' ? this.world.getBuildingsOfType('flowerBed').length : cabins;
    // (18. aşama) Mahalle tabelası önerilen bir sokak adıyla dikilir (oyuncu panelden değiştirir)
    const label = type === 'signpost' ? this.suggestStreetName() : null;
    const building = new Building({ type, tileX, tileY, tone, orientation: check.orientation, underConstruction: true, label });
    this.world.addBuilding(building);
    this.jobs.createBuildJob(building);
    this.events.emit('world:blocked', { tiles: check.footprint });
    this.events.emit('building:placed', { building });
    if (!quiet) this.events.emit('toast', { text: `Şantiye kuruldu: ${def.name} (${formatCost(def.cost)})`, tone: 'info', icon: 'hammer' });
    return { ok: true, building };
  }

  /** Kasabada henüz kullanılmayan ilk sokak adı (hepsi kullanıldıysa numaralı). */
  suggestStreetName() {
    const used = new Set(this.world.getBuildingsOfType('signpost').map((b) => b.label));
    const free = STREET_NAMES.find((n) => !used.has(n));
    return free ?? `${STREET_NAMES[used.size % STREET_NAMES.length]} ${Math.floor(used.size / STREET_NAMES.length) + 1}`;
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
    this.events.emit('terrain:painted', { x, y, type, tile: def.result });
    return { ok: true };
  }

  /** Bu karoda yıkılabilecek bir şey var mı (önizleme için)? */
  describeDemolish(x, y) {
    const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
    if (building) {
      const reason = this.demolishBlocker(building);
      return { ok: !reason, reason: reason ?? `${building.underConstruction ? 'Şantiyeyi iptal et' : 'Yık'}: ${building.name}`, building };
    }
    const tile = this.world.map.get(x, y);
    const removed = this.tileAfterRemoval(x, y);
    if (removed) {
      if (this.world.charactersOnTile(x, y).length > 0) return { ok: false, reason: 'Üzerinde biri var' };
      const refund = this.tileRefund(x, y);
      const back = Object.keys(refund).length ? ` (%50 iade: ${formatCost(refund)})` : '';
      return { ok: true, reason: `Kaldır: ${TILE_TYPES[tile].name}${back}`, tile };
    }
    return { ok: false, reason: 'Burada yıkılacak bir şey yok' };
  }

  /**
   * (18. aşama) Kaldırılınca karonun döneceği zemin ya da null (kaldırılacak bir şey yok). Oyuncunun döşediği zemin
   * harita üretildiğindeki hâline döner (taş plakanın altından patika ya da çimen); haritayla gelen yollar eski
   * kurala göre bir alt kademeye iner (parke -> patika -> doğal zemin, köprü -> su).
   */
  tileAfterRemoval(x, y) {
    const tile = this.world.map.get(x, y);
    const base = this.baseTileAt?.(x, y) ?? null;
    if (base && base !== tile && TILE_BUILD_BY_RESULT[tile]) return base;
    if (!TILE_REMOVAL[tile]) return null;
    return TILE_REMOVAL[tile] === 'grass' ? this.groundAt?.(x, y) ?? 'grass' : TILE_REMOVAL[tile];
  }

  /** (18. aşama) Oyuncunun döşediği zemin kaldırılınca harcananın yarısı: { kaynak: miktar (küsuratlı) } */
  tileRefund(x, y) {
    const tile = this.world.map.get(x, y);
    const base = this.baseTileAt?.(x, y) ?? null;
    const build = TILE_BUILDS[TILE_BUILD_BY_RESULT[tile]];
    if (!build || base === tile) return {};
    return Object.fromEntries(Object.entries(build.cost).map(([r, v]) => [r, v * DEMOLISH_REFUND]));
  }

  /** Küsuratlı iadeyi biriktirir; birikim bir birimi geçince depoya ekler (iki karo patika = 1 odun). */
  refundFractional(cost) {
    const credit = (this.world.state.landscape ??= { refundCredit: {} }).refundCredit ??= {};
    const added = {};
    for (const [r, v] of Object.entries(cost)) {
      credit[r] = (credit[r] ?? 0) + v;
      const whole = Math.floor(credit[r] + 1e-9);
      if (whole > 0) {
        credit[r] -= whole;
        this.economy.add(r, whole);
        added[r] = whole;
      }
      if (credit[r] < 1e-9) delete credit[r];
    }
    return added;
  }

  demolishBlocker(building) {
    // Yıkılamayan yapının (harika) şantiyesi yine de iptal edilebilir
    if (!BUILDINGS[building.type].demolishable && !building.underConstruction) return `${building.name} yıkılamaz`;
    const residents = this.world.getResidents(building);
    if (residents.length > 0) return `Bu evde ${residents.map((c) => c.name).join(' ve ')} yaşıyor`;
    if (building.occupants.size > 0) return 'İçeride biri var';
    return null;
  }

  /**
   * Yıkım aracı: yapıyı yıkar ya da yolu / köprüyü kaldırır. (18. aşama) options: { quiet: bildirim çıkmaz (fırça),
   * refresh: false ise ulaşılabilirlik fırça bitince bir kez yenilenir }. Dönüş: { ok, reason, kind, refund }
   */
  demolishAt(x, y, { quiet = false, refresh = true } = {}) {
    const check = this.describeDemolish(x, y);
    if (!check.ok) return check;
    const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
    if (building) return { ...this.demolish(building, { quiet }), kind: 'building', building };

    const tile = this.world.map.get(x, y);
    const removed = this.tileAfterRemoval(x, y);
    const refund = this.refundFractional(this.tileRefund(x, y));
    this.world.map.set(x, y, removed);
    if (tile === 'bridge' || removed === 'bridge') assignBridgeVariants(this.world.map);
    if (refresh) this.world.refreshStaticData();
    this.events.emit('terrain:painted', { x, y, type: null, tile: removed, removed: tile });
    return { ok: true, kind: 'tile', tile, refund };
  }

  demolish(building, { quiet = false } = {}) {
    const def = BUILDINGS[building.type];
    const ratio = building.underConstruction && building.buildProgress === 0 ? 1 : DEMOLISH_REFUND;
    const name = building.name;
    this.jobs.cancelForBuilding(building.id);
    this.world.removeBuilding(building);
    this.economy.refund(def.cost, ratio);
    // (16. aşama) Asma / meşale sökülünce fide / meşale sandığa geri döner
    if (def.item) this.world.state.exploration.items[def.item] = (this.world.state.exploration.items[def.item] ?? 0) + 1;
    // Yükseltilmiş ya da yükseltilmekte olan yapıda yükseltme maliyetinin de yarısı geri gelir
    if (def.upgrade && (building.upgraded || building.project)) this.economy.refund(def.upgrade.cost, DEMOLISH_REFUND);
    this.events.emit('building:removed', building);
    if (!quiet) {
      this.events.emit('toast', {
        text: `${building.underConstruction ? 'Şantiye iptal edildi' : 'Yıkıldı'}: ${name} (%${Math.round(ratio * 100)} iade)`,
        tone: 'info',
        icon: 'demolish',
      });
    }
    return { ok: true, ratio };
  }

  /** İnşaat işi bitti: şantiye gerçek binaya dönüşür. */
  complete(building) {
    if (!building || !building.underConstruction) return;
    building.underConstruction = false;
    building.buildProgress = building.definition.buildWork;
    // (18. aşama) Süs fidanı dikildiği andan itibaren iki günde büyür
    if (building.definition.ornamentalTree) {
      building.plantedAt = this.world.state.totalMinutes;
      building.growth = 0;
    }
    // Çok aşamalı harika: şantiye ilk aşamaydı (Temel); sonraki aşamalar panelden başlatılır
    if (building.definition.wonder) building.wonderStage = 1;
    this.world.refreshStaticData();
    this.events.emit('building:completed', building);
    if (building.definition.wonder) {
      const [first, second] = building.definition.wonder.stages;
      this.events.emit('wonder:stageCompleted', { building, stage: first, index: 1 });
      this.events.emit('toast', { text: `${building.name}: ${first.name} atıldı! Sıradaki aşamayı (${second.name}) panelden başlatabilirsin.`, tone: 'success', icon: 'wonder' });
      return;
    }
    const extra = building.type === 'cabin' ? ' Yarın sabah yeni sakinler gelebilir.' : '';
    if (building.definition.brush) return; // (18. aşama) fırçayla dizilen çit, saksı ve fidanlar tek tek bildirilmez
    this.events.emit('toast', { text: `İnşaat tamamlandı: ${building.name}!${extra}`, tone: 'success', icon: 'hammer' });
  }

  // ---------------------------------------------------------------------------
  // Yükseltme (Seviye 2) ve harabe onarımı
  // ---------------------------------------------------------------------------

  /** Yapının sıradaki geliştirmesi: harabeyse onarım, yükseltilebiliyorsa yükseltme, yoksa null. */
  projectFor(building) {
    const def = BUILDINGS[building.type];
    if (building.ruined) return def.ruin ? { kind: 'repair', spec: def.ruin } : null;
    // Fırtınada / kurt saldırısında hasar gören yapı önce onarılır (11. aşama)
    // (23. aşama) Yangın / baskın hasarı %25 maliyet + kısa iş; fırtına hasarı eski kural
    if (building.damaged) return { kind: 'mend', spec: mendSpecFor(building) };
    // Çok aşamalı harika: sıradaki aşama (Gövde, Görkemli Kule)
    if (def.wonder && !building.wonderComplete) {
      const stage = def.wonder.stages[building.wonderStage];
      return { kind: 'stage', spec: { ...stage, buildWork: stage.work } };
    }
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
    else if (building.project) reason = PROJECT_WORDS[kind].busy;
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
      text:
        kind === 'upgrade'
          ? `Yükseltme başladı: ${before} → ${spec.name} (${formatCost(spec.cost)})`
          : kind === 'stage'
            ? `${before}: ${spec.name} aşaması başladı (${formatCost(spec.cost)})`
            : `Onarım başladı: ${before} (${formatCost(spec.cost)})`,
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
    if (kind === 'stage') {
      building.wonderStage += 1;
      this.world.invalidateSpots(building);
      this.world.refreshStaticData();
      const stage = building.definition.wonder.stages[building.wonderStage - 1];
      this.events.emit('wonder:stageCompleted', { building, stage, index: building.wonderStage });
      if (building.wonderComplete) {
        this.events.emit('wonder:completed', { building, townName: this.world.state.townName });
        this.events.emit('toast', { text: `${building.name} tamamlandı! Kasaba altın çağını yaşıyor.`, tone: 'success', icon: 'wonder' });
      } else {
        this.events.emit('toast', { text: `${building.name}: ${stage.name} aşaması tamamlandı. Sıradaki aşamayı panelden başlatabilirsin.`, tone: 'success', icon: 'wonder' });
      }
      return;
    }
    if (kind === 'mend') {
      const damageKind = building.damageKind;
      building.isDamaged = false;
      this.world.invalidateSpots(building);
      this.events.emit('building:mended', { building, kind: damageKind, instant: false });
      this.events.emit('toast', { text: `${building.name} onarıldı, yeniden çalışıyor`, tone: 'success', icon: 'hammer' });
      return;
    }
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
