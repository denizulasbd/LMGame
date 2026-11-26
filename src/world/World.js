// Oyun dünyasına tek kapıdan erişim: harita, yapılar ve sakinler hakkında sorular
// burada yanıtlanır (ör. "bu karoda ne var?", "en yakın boş bank nerede?", "şuradan
// şuraya yol?"). Sistemler ve yapay zekâ doğrudan dizilerle değil bu sınıfla çalışır.
import { CONFIG } from '../config.js';
import { BUILDINGS } from '../data/buildings.js';
import { findPath, pathCost } from '../utils/pathfinding.js';
import { pierLandingTiles, accessTiles } from './footprint.js';

const CARDINALS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

const MIN_MOVE_COST = 0.35; // en ucuz karo maliyeti (parke taş yol); A* tahmininin doğru kalması için

export class World {
  /**
   * @param {import('./TileMap.js').TileMap} map
   * @param {import('../state/GameState.js').GameState} state
   * @param {object} landmarks WorldGenerator'ın döndürdüğü önemli noktalar
   */
  constructor(map, state, landmarks) {
    this.map = map;
    this.state = state;
    this.landmarks = landmarks;
    this.reservations = new Map(); // "x,y" -> karakter kimliği
    this.visitors = []; // kasabalı olmayan, haritada yürüyen karakterler (tüccar)
    this.guests = []; // (26.3) geçici gezgin konuk (Seyyar Ozan / Nadir Takasçı / Yaşlı Seyyah; GuestSystem): nüfusa, konuta, iş gücüne sayılmaz
    this.boats = []; // nehirdeki ticaret teknesi (HarborSystem, 12. aşama; yalnızca çizim)

    // (34.1) Yol bulma ızgarası açık alanın sınır dikdörtgenine kırpılır (kilitli parseller aranmaz); refreshStaticData günceller
    this.pathGrid = {
      x0: 0,
      y0: 0,
      width: map.width,
      height: map.height,
      minCost: MIN_MOVE_COST,
      isWalkable: (x, y) => map.isWalkable(x, y),
      cost: (x, y) => map.getMoveCost(x, y),
    };

    this.refreshStaticData();
  }

  get buildings() {
    return this.state.buildings;
  }

  get characters() {
    return this.state.characters;
  }

  /** Harita veya yapılar değiştiğinde ulaşılabilirlik ve buluşma noktalarını yeniden hesaplar. */
  refreshStaticData() {
    const open = this.map.openBounds;
    Object.assign(this.pathGrid, { x0: open.x0, y0: open.y0, width: open.x1 - open.x0, height: open.y1 - open.y0 });
    const seed = this.findReachabilitySeed();
    this.reachable = seed ? this.map.computeReachable(seed.x, seed.y) : new Uint8Array(this.map.width * this.map.height);
    this.spotCache = new Map();
    this.treeCountCache = new Map();

    this.riverbankSpots = [];
    this.flowerSpots = [];
    this.strollSpots = [];
    for (let y = open.y0; y < open.y1; y++) {
      for (let x = open.x0; x < open.x1; x++) {
        if (!this.isReachable(x, y)) continue;
        const tile = this.map.get(x, y);
        if (tile === 'sand') {
          const water = CARDINALS.find(([dx, dy]) => this.map.get(x + dx, y + dy) === 'water');
          if (water) this.riverbankSpots.push({ x, y, facing: directionName(water[0], water[1]) });
        } else if ((tile === 'grass' || tile === 'meadow') && this.map.getVariant(x, y) === 1 && !this.map.getObject(x, y)) {
          this.flowerSpots.push({ x, y });
        } else if (tile === 'path' || tile === 'plaza' || tile === 'cobble') {
          this.strollSpots.push({ x, y });
        }
      }
    }

    // Kurulmuş çiçek tarhlarının ve (18. aşama) çiçek saksılarının çevresi de çiçek koklama noktasıdır (yüz tarhına dönük)
    for (const bed of this.buildings.filter((b) => b.functional && (b.type === 'flowerBed' || b.type === 'planter'))) {
      const { w, h } = BUILDINGS[bed.type].size;
      for (let y = bed.tileY - 1; y <= bed.tileY + h; y++) {
        for (let x = bed.tileX - 1; x <= bed.tileX + w; x++) {
          const inside = x >= bed.tileX && x < bed.tileX + w && y >= bed.tileY && y < bed.tileY + h;
          if (inside || !this.map.isWalkable(x, y) || !this.isReachable(x, y)) continue;
          const dx = bed.tileX + (w - 1) / 2 - x;
          const dy = bed.tileY + (h - 1) / 2 - y;
          this.flowerSpots.push({ x, y, facing: Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up' });
        }
      }
    }
  }

  findReachabilitySeed() {
    const { plaza } = this.landmarks;
    for (let y = plaza.y; y < plaza.y + plaza.h; y++) {
      for (let x = plaza.x; x < plaza.x + plaza.w; x++) {
        if (this.map.isWalkable(x, y)) return { x, y };
      }
    }
    return null;
  }

  isReachable(x, y) {
    return this.map.inBounds(x, y) && this.reachable[this.map.index(x, y)] === 1;
  }

  /**
   * Bu karolar yürünemez olsaydı (yeni yapı, yeniden büyüyen ağaç) kasabaya bağlı karolar: her karo için 1 / 0.
   * Yerleşim kontrolü yeni yapının kendi girişini de bununla ölçer: önü yalnızca kendi ayak izinin içinden
   * kasabaya bağlanan bir yapı, kurulunca kendi girişini koparmasın.
   */
  reachabilityWithout(tiles) {
    const blocked = new Set(tiles.filter((t) => this.map.inBounds(t.x, t.y)).map((t) => this.map.index(t.x, t.y)));
    if (blocked.size === 0) return this.reachable;
    const seed = this.findReachabilitySeed();
    return seed ? this.map.computeReachable(seed.x, seed.y, blocked) : new Uint8Array(this.map.width * this.map.height);
  }

  /**
   * Bu karolar yürünemez olsaydı kasabaya bağlantısı tamamen kopacak bir yapı var mı? Bugün girişine / çalışma
   * yerine ulaşılabilen ama sonra hiçbir giriş karosu kasabaya bağlı kalmayacak ilk yapıyı döndürür (yoksa null).
   * Böylece yapılar arasında kapalı ceplerde kalan değirmen, maden ya da ev oluşmaz.
   * after: (isteğe bağlı) önceden hesaplanmış reachabilityWithout(tiles) sonucu
   */
  wouldIsolate(tiles, after = this.reachabilityWithout(tiles)) {
    if (after === this.reachable) return null;
    for (const b of this.buildings) {
      // Fener ve çiçek tarhı gibi kullanılmayan süs yapıları sayılmaz
      if (BUILDINGS[b.type].spots === 'none') continue;
      const access = accessTiles(b.type, b.tileX, b.tileY, b.orientation).filter((t) => this.map.inBounds(t.x, t.y));
      const before = access.some((t) => this.isReachable(t.x, t.y));
      if (!before) continue;
      if (!access.some((t) => after[this.map.index(t.x, t.y)] === 1)) return b;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Koordinat yardımcıları
  // ---------------------------------------------------------------------------

  /** Bir karoda duran karakterin ayak noktası (dünya pikseli). */
  standPoint(tileX, tileY) {
    const size = CONFIG.TILE_SIZE;
    return { x: tileX * size + size / 2, y: tileY * size + 12 };
  }

  // ---------------------------------------------------------------------------
  // Yapılar ve sakinler
  // ---------------------------------------------------------------------------

  getBuilding(id) {
    return this.buildings.find((b) => b.id === id) ?? null;
  }

  getBuildingsOfType(type) {
    return this.buildings.filter((b) => b.type === type);
  }

  /** Kullanılabilir yapılar: inşaatı bitmiş ve yıkık harabe olmayan (isteğe bağlı türe göre). */
  getCompleted(type = null) {
    return this.buildings.filter((b) => b.functional && (type === null || b.type === type));
  }

  /** Yapının kullanım noktaları değişti (yükseltme / onarım başladı ya da bitti): önbelleği tazele. */
  invalidateSpots(building) {
    for (const key of [...this.spotCache.keys()]) {
      if (key === building.id || String(key).startsWith(`${building.id}:`)) this.spotCache.delete(key);
    }
  }

  /** Haritaya yapı ekler ve kapladığı karoları doldurur (üzerindeki çakıl/kütük temizlenir). */
  addBuilding(building) {
    const { w, h } = BUILDINGS[building.type].size;
    const passable = Boolean(BUILDINGS[building.type].walkable);
    for (let y = building.tileY; y < building.tileY + h; y++) {
      for (let x = building.tileX; x < building.tileX + w; x++) {
        this.map.setOccupant(x, y, building.id, passable);
        this.map.setObject(x, y, null);
      }
    }
    this.buildings.push(building);
    this.refreshStaticData();
  }

  removeBuilding(building) {
    const { w, h } = BUILDINGS[building.type].size;
    for (let y = building.tileY; y < building.tileY + h; y++) {
      for (let x = building.tileX; x < building.tileX + w; x++) this.map.setOccupant(x, y, 0);
    }
    const index = this.buildings.indexOf(building);
    if (index >= 0) this.buildings.splice(index, 1);
    this.refreshStaticData();
  }

  /** Bir karoda (görünür) duran karakterler. */
  charactersOnTile(x, y) {
    return this.characters.filter((c) => c.visible && c.tileX === x && c.tileY === y);
  }

  /** Çevredeki ağaç sayısı (oduncu verimi için; harita değişince önbellek temizlenir). */
  countTreesNear(cx, cy, radius) {
    const key = `${cx},${cy},${radius}`;
    if (!this.treeCountCache.has(key)) {
      let count = 0;
      for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
          const object = this.map.getObject(x, y);
          if (object === 'oak' || object === 'pine') count++;
        }
      }
      this.treeCountCache.set(key, count);
    }
    return this.treeCountCache.get(key);
  }

  /** Bir karodaki nesneye (ağaç, kaya) uzanmak için durulabilecek komşu karolar. */
  getApproachSpots(x, y) {
    return CARDINALS.map(([dx, dy]) => ({ x: x + dx, y: y + dy })).filter(
      (s) => this.map.isWalkable(s.x, s.y) && this.isReachable(s.x, s.y)
    );
  }

  /** Haritanın kenarındaki, kasabaya bağlı bir giriş karosu (göçmenler buradan gelir). */
  findEntryTile(rng) {
    const border = [];
    const roads = [];
    // (34.1) Açık alanın kenarı: komşularından biri kilitli ya da dünya dışı olan ulaşılabilir karo (parselsiz haritada harita kenarı)
    const map = this.map;
    const { x0, y0, x1, y1 } = map.openBounds;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (map.isOpen(x, y - 1) && map.isOpen(x, y + 1) && map.isOpen(x - 1, y) && map.isOpen(x + 1, y)) continue;
        if (!this.isReachable(x, y)) continue;
        border.push({ x, y });
        if (this.map.get(x, y) === 'path' || this.map.get(x, y) === 'cobble') roads.push({ x, y });
      }
    }
    const pool = roads.length ? roads : border.length ? border : this.strollSpots;
    return pool.length ? rng.pick(pool) : null;
  }

  getCharacter(id) {
    return this.characters.find((c) => c.id === id) ?? null;
  }

  getResidents(building) {
    return this.characters.filter((c) => c.homeId === building.id);
  }

  /**
   * Dünya pikselindeki noktanın altındaki en öndeki görünür karakter. (27.3) Gezgin konuklar (world.guests, isGuest: true) da
   * tıklanabilir; çağıran konuğu sakinden isGuest ile ayırır. Yalnızca arayüz kullanır (simülasyon kararları çağırmaz).
   */
  findCharacterAt(worldX, worldY, { guests = true } = {}) {
    let best = null;
    for (const c of this.characters) {
      if (c.hitTest(worldX, worldY) && (!best || c.sortY > best.sortY)) best = c;
    }
    if (guests) for (const g of this.guests) if (g.visible && g.hitTest(worldX, worldY) && (!best || g.sortY > best.sortY)) best = g;
    return best;
  }

  /**
   * Yapıyı kullanmak için durulabilecek karolar (önbellekli). Her biri { x, y }.
   * Tanımlar src/data/buildings.js -> spots alanında.
   */
  getSpots(building) {
    if (this.spotCache.has(building.id)) return this.spotCache.get(building.id);
    const usable = (x, y) => this.map.isWalkable(x, y) && this.isReachable(x, y);
    let spots = this.computeSpots(building, usable);
    // (29.2b) Şantiyenin / yükseltmenin çevresi her yandan kapanmışsa işçiler iki karo uzaktan da çalışır (iş sonsuza dek beklemesin)
    if (spots.length === 0 && this.usesRing(building)) spots = this.computeSpots(building, usable, 2);
    this.spotCache.set(building.id, spots);
    return spots;
  }

  /** Şantiyede, yükseltmede ve onarımda herkes yapının çevresinde (halkada) çalışır. */
  usesRing(building) {
    return Boolean(building.underConstruction || building.project);
  }

  /**
   * Yapının kullanım noktaları; hangi karoların kullanılabilir sayılacağını `usable(x, y)` belirler (yerleşim kontrolü, yeni yapı
   * kurulursa kalacak noktaları bununla ölçer). ringWidth: halka kalınlığı (varsayılan 1; çaprazlar dahil).
   */
  computeSpots(building, usable, ringWidth = 1) {
    const def = BUILDINGS[building.type];
    const { tileX, tileY } = building;
    const { w, h } = def.size;
    const kind = this.usesRing(building) ? 'ring' : def.spots;
    let spots = [];

    if (kind === 'door') {
      spots = def.doorTiles.map(({ dx, dy }) => ({ x: tileX + dx, y: tileY + dy })).filter((s) => usable(s.x, s.y));
    } else if (kind === 'ring') {
      for (let y = tileY - ringWidth; y <= tileY + h - 1 + ringWidth; y++) {
        for (let x = tileX - ringWidth; x <= tileX + w - 1 + ringWidth; x++) {
          const inside = x >= tileX && x < tileX + w && y >= tileY && y < tileY + h;
          if (!inside && usable(x, y)) spots.push({ x, y });
        }
      }
    } else if (kind === 'front') {
      for (let x = tileX; x < tileX + w; x++) if (usable(x, tileY + h)) spots.push({ x, y: tileY + h });
    } else if (kind === 'pier') {
      spots = pierLandingTiles(tileX, tileY, building.orientation, w).filter((s) => usable(s.x, s.y));
    } else if (kind === 'adjacent') {
      spots = CARDINALS.map(([dx, dy]) => ({ x: tileX + dx, y: tileY + dy })).filter((s) => usable(s.x, s.y));
    } else if (kind === 'self') {
      const approachable = CARDINALS.some(([dx, dy]) => usable(tileX + dx, tileY + dy));
      if (approachable) spots = [{ x: tileX, y: tileY }];
    }
    return spots;
  }

  // ---------------------------------------------------------------------------
  // Rezervasyon: iki karakter aynı banka / aynı noktaya yönelmesin
  // ---------------------------------------------------------------------------

  spotKey(x, y) {
    return `${x},${y}`;
  }

  isReserved(x, y, exceptCharacterId = null) {
    const owner = this.reservations.get(this.spotKey(x, y));
    return owner !== undefined && owner !== exceptCharacterId;
  }

  reserve(x, y, characterId) {
    this.reservations.set(this.spotKey(x, y), characterId);
  }

  releaseAll(characterId) {
    for (const [key, owner] of this.reservations) {
      if (owner === characterId) this.reservations.delete(key);
    }
  }

  freeSpots(building, characterId = null) {
    return this.getSpots(building).filter((s) => !this.isReserved(s.x, s.y, characterId));
  }

  /**
   * Toplanıp sohbet etme noktaları (önbellekli):
   *   mode 'festival'      -> yapının çevresinde iki karo genişliğinde halka (kalabalık şenlik)
   *   gatherSpots 'terrace'-> yapının önündeki iki sıra (hanın önü)
   *   diğerleri            -> getSpots (havuz ve ateşin çevresi)
   */
  getGatherSpots(building, mode = 'gather') {
    const key = `${building.id}:${mode}`;
    if (this.spotCache.has(key)) return this.spotCache.get(key);
    const def = BUILDINGS[building.type];
    const { w, h } = def.size;
    const { tileX, tileY } = building;
    const usable = (x, y) => this.map.isWalkable(x, y) && this.isReachable(x, y);
    let spots;
    if (mode === 'festival') {
      spots = [];
      for (let y = tileY - 2; y <= tileY + h + 1; y++) {
        for (let x = tileX - 2; x <= tileX + w + 1; x++) {
          const inside = x >= tileX && x < tileX + w && y >= tileY && y < tileY + h;
          if (!inside && usable(x, y)) spots.push({ x, y });
        }
      }
    } else if (def.gazebo) {
      // Çardak: önündeki iki karodan içeri girilip banklara oturulur (her karo bir oturak)
      spots = [];
      def.gazebo.seats.forEach((seat, i) => {
        const x = tileX + Math.min(i, w - 1);
        const y = tileY + h;
        if (usable(x, y)) spots.push({ x, y, seat: { x: building.x + seat.x, y: building.y + seat.y } });
      });
    } else if (def.gatherSpots === 'terrace') {
      spots = [];
      for (let y = tileY + h; y <= tileY + h + 1; y++) {
        for (let x = tileX - 1; x <= tileX + w; x++) if (usable(x, y)) spots.push({ x, y });
      }
    } else {
      spots = this.getSpots(building);
    }
    this.spotCache.set(key, spots);
    return spots;
  }

  freeGatherSpots(building, characterId = null, mode = 'gather') {
    return this.getGatherSpots(building, mode).filter((s) => !this.isReserved(s.x, s.y, characterId));
  }

  // ---------------------------------------------------------------------------
  // Ziyaretçiler (gezgin tüccar): kasaba sakini sayılmaz, kaydı EventSystem tutar
  // ---------------------------------------------------------------------------

  /** Dünya pikselindeki noktanın altındaki ziyaretçi. */
  findVisitorAt(worldX, worldY) {
    return this.visitors.find((v) => v.hitTest(worldX, worldY)) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Yol bulma
  // ---------------------------------------------------------------------------

  /** Karo yolunu döndürür (başlangıç ve hedef dahil) ya da null. */
  findPath(from, to, options = {}) {
    return findPath(this.pathGrid, from, to, options);
  }

  pathCost(path) {
    return pathCost(this.pathGrid, path);
  }

  // ---------------------------------------------------------------------------
  // Arayüz için karo özeti
  // ---------------------------------------------------------------------------

  getTileInfo(x, y) {
    const info = this.map.getTileInfo(x, y);
    if (!info) return null;
    const building = info.occupantId ? this.getBuilding(info.occupantId) : null;
    info.building = building ? { ...building.describe(this), type: building.type, sign: building.type === 'signpost' } : null;
    info.aesthetic = this.aesthetics ? this.aesthetics[this.map.index(x, y)] : 0; // (18. aşama) çevre estetiği
    info.muddy = this.map.wet && info.tile === 'path';
    return info;
  }
}

function directionName(dx, dy) {
  if (dx > 0) return 'right';
  if (dx < 0) return 'left';
  if (dy < 0) return 'up';
  return 'down';
}
