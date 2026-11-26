// Karo tabanlı harita: zemin, görsel varyasyon, doğal nesne ve yapı doluluğu katmanları.
// Veri sorgulama (yürünebilir mi, inşa edilebilir mi, adım maliyeti) ve görünen alanı çizme burada.
import { CONFIG } from '../config.js';
import { TILE_TYPES, TILE_BY_ID, OBJECT_TYPES, OBJECT_BY_ID } from '../data/tiles.js';
import { getTileSprite, getEdgeSprite, getObjectSprite, getCornerSprite, getMudSprite } from '../art/tiles/index.js';
import { MUD } from '../data/landscape.js';
import { AUTUMN_FOLIAGE_VARIANTS } from '../art/seasons.js';
import { LOCKED_VIEW } from '../data/parcels.js';

// Kenar yönleri: 0 üst, 1 sağ, 2 alt, 3 sol (art/tiles döndürme sırasıyla aynı)
const NEIGHBOR_OFFSETS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

// Karo türü -> kenar geçişleri listesi (data/tiles.js'te tek nesne ya da dizi olabilir)
const EDGE_OVERLAYS = Object.fromEntries(
  Object.entries(TILE_TYPES)
    .filter(([, def]) => def.edgeOverlay)
    .map(([name, def]) => [name, [].concat(def.edgeOverlay)])
);

// (18. aşama) Yol köşeleri: köşe k, kenar k ile kenar (k+3)%4 arasındadır (0 sol üst, 1 sağ üst, 2 sağ alt, 3 sol alt)
const CORNER_DIAGONALS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];
const isRoad = (tile) => Boolean(tile && TILE_TYPES[tile].road && tile !== 'bridge');
const isGroundTile = (tile) => Boolean(tile && TILE_TYPES[tile].ground);
const MUDDY = new Set(MUD.tiles);
// (34.1) Hızlı yürünebilirlik tabloları (kimliğe göre): genişleyen haritada taşma ve yol bulma çok daha çok karo dolaşır
const TILE_WALK = new Uint8Array(256);
for (const def of Object.values(TILE_TYPES)) TILE_WALK[def.id] = def.walkable ? 1 : 0;
const OBJECT_WALK = new Uint8Array(256);
OBJECT_WALK[0] = 1;
for (const def of Object.values(OBJECT_TYPES)) OBJECT_WALK[def.id] = def.walkable ? 1 : 0;

// Ağaç gibi uzun nesneler üstteki karolara taşar; görünür alanın altına bu kadar
// fazladan satır eklenir ki ekranın altından taşan tepeler kesilmesin.
const OBJECT_OVERDRAW_ROWS = 1;

export class TileMap {
  /**
   * (34.1) x0 / y0: dünyanın sol üst karosu (genişleyen haritada eksi olabilir; çekirdek her zaman 0,0'dan başlar).
   * Bütün katmanlar dünya boyutundadır; indeks = (y - y0) * width + (x - x0).
   */
  constructor(width, height, fillTile = 'grass', { x0 = 0, y0 = 0 } = {}) {
    this.width = width;
    this.height = height;
    this.x0 = x0;
    this.y0 = y0;
    this.tiles = new Uint8Array(width * height).fill(TILE_TYPES[fillTile].id);
    this.variants = new Uint8Array(width * height);
    this.objects = new Uint8Array(width * height); // 0 = nesne yok
    this.occupants = new Uint16Array(width * height); // üzerindeki yapının kimliği, 0 = boş
    this.passable = new Uint8Array(width * height); // 1: üzerindeki yapının altından / içinden geçilebilir (kemer)
    this.wet = false; // (18. aşama) yağmur yağıyor: toprak patika çamurlu (LandscapeSystem her adımda yazar)
    // (34.1) Açık (kasabanın) karolar: 1. Kilitli karo yürünmez, inşa edilmez, toplanmaz. openBounds: açık alanın sınır dikdörtgeni
    // (x1 / y1 hariç); haritayı tarayan sistemler yalnızca bu dikdörtgende döner.
    this.open = new Uint8Array(width * height).fill(1);
    this.openBounds = { x0, y0, x1: x0 + width, y1: y0 + height };
    this.version = 0; // açık alan değişince artar
  }

  /** Dünyanın sağ / alt sınırı (hariç). */
  get x1() {
    return this.x0 + this.width;
  }

  get y1() {
    return this.y0 + this.height;
  }

  /** (34.1) Karo açık (satın alınmış ya da çekirdek) mı? */
  isOpen(x, y) {
    return this.inBounds(x, y) && this.open[this.index(x, y)] === 1;
  }

  /** (34.1) Bir dikdörtgeni açar ya da kilitler; sınır dikdörtgeni yeniden hesaplanır. */
  setOpenRect(rx, ry, w, h, value) {
    for (let y = ry; y < ry + h; y++) for (let x = rx; x < rx + w; x++) if (this.inBounds(x, y)) this.open[this.index(x, y)] = value ? 1 : 0;
    this.refreshOpenBounds();
  }

  refreshOpenBounds() {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < this.open.length; i++) {
      if (!this.open[i]) continue;
      const { x, y } = this.coordOf(i);
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x + 1 > x1) x1 = x + 1;
      if (y + 1 > y1) y1 = y + 1;
    }
    this.openBounds = x0 === Infinity ? { x0: 0, y0: 0, x1: 0, y1: 0 } : { x0, y0, x1, y1 };
    this.version++;
  }

  /** İndeksin dünya koordinatı. */
  coordOf(i) {
    const lx = i % this.width;
    return { x: lx + this.x0, y: (i - lx) / this.width + this.y0 };
  }

  get pixelWidth() {
    return this.width * CONFIG.TILE_SIZE;
  }

  /** (34.1) Dünyanın sol / üst kenarı (piksel; genişleyen haritada eksi). */
  get pixelLeft() {
    return this.x0 * CONFIG.TILE_SIZE;
  }

  get pixelTop() {
    return this.y0 * CONFIG.TILE_SIZE;
  }

  get pixelHeight() {
    return this.height * CONFIG.TILE_SIZE;
  }

  inBounds(x, y) {
    return x >= this.x0 && y >= this.y0 && x < this.x0 + this.width && y < this.y0 + this.height;
  }

  index(x, y) {
    return (y - this.y0) * this.width + (x - this.x0);
  }

  // ---- Zemin ----

  get(x, y) {
    return this.inBounds(x, y) ? TILE_BY_ID[this.tiles[this.index(x, y)]] : null;
  }

  getVariant(x, y) {
    return this.inBounds(x, y) ? this.variants[this.index(x, y)] : 0;
  }

  set(x, y, name, variant = 0) {
    if (!this.inBounds(x, y)) return;
    const i = this.index(x, y);
    this.tiles[i] = TILE_TYPES[name].id;
    this.variants[i] = variant;
  }

  setVariant(x, y, variant) {
    if (this.inBounds(x, y)) this.variants[this.index(x, y)] = variant;
  }

  // ---- Nesneler ----

  getObject(x, y) {
    if (!this.inBounds(x, y)) return null;
    const id = this.objects[this.index(x, y)];
    return id === 0 ? null : OBJECT_BY_ID[id];
  }

  setObject(x, y, name) {
    if (this.inBounds(x, y)) this.objects[this.index(x, y)] = name ? OBJECT_TYPES[name].id : 0;
  }

  // ---- Yapı doluluğu ----

  getOccupant(x, y) {
    return this.inBounds(x, y) ? this.occupants[this.index(x, y)] : 0;
  }

  /** passable: sakinler bu yapının karosundan geçebilir (13. aşama: Mermer Kemer). */
  setOccupant(x, y, buildingId, passable = false) {
    if (!this.inBounds(x, y)) return;
    const i = this.index(x, y);
    this.occupants[i] = buildingId;
    this.passable[i] = buildingId !== 0 && passable ? 1 : 0;
  }

  // ---- Kurallar ----

  isWalkable(x, y) {
    return this.inBounds(x, y) && this.walkableAt(this.index(x, y));
  }

  /** (34.1) İndeksle yürünebilirlik: açık, zemini yürünür, yapı yok (ya da kemer), nesnesi yürünür. */
  walkableAt(i) {
    return this.open[i] === 1 && TILE_WALK[this.tiles[i]] === 1 && (this.occupants[i] === 0 || this.passable[i] === 1) && OBJECT_WALK[this.objects[i]] === 1;
  }

  isBuildable(x, y) {
    const tile = this.get(x, y);
    if (!tile || !TILE_TYPES[tile].buildable) return false;
    if (!this.open[this.index(x, y)]) return false; // (34.1) kilitli toprak
    if (this.getOccupant(x, y) !== 0) return false;
    const object = this.getObject(x, y);
    return !object || OBJECT_TYPES[object].buildable;
  }

  /** Yol bulmada bu karoya adım atmanın maliyeti. */
  getMoveCost(x, y) {
    const tile = this.get(x, y);
    const object = this.getObject(x, y);
    const mud = this.wet && MUDDY.has(tile) ? MUD.extraMoveCost : 0; // (18. aşama) çamurlu patika
    return (TILE_TYPES[tile]?.moveCost ?? 1) + (object ? OBJECT_TYPES[object].extraMoveCost ?? 0 : 0) + mud;
  }

  /** Karakterin bu karo üzerindeki yürüme hızı çarpanı (yağmurda çamurlu patikada yavaş). */
  getSpeedMultiplier(x, y) {
    const tile = this.get(x, y);
    const base = TILE_TYPES[tile]?.speedMultiplier ?? 1;
    return this.wet && MUDDY.has(tile) ? base * MUD.speedMultiplier : base;
  }

  /**
   * Bir başlangıç karosundan 4 yönlü yürünerek ulaşılabilen karoları işaretler.
   * blocked: (isteğe bağlı) yürünemez sayılacak ek karoların index kümesi ("buraya yapı kurulsa?" sorusu için)
   * Dönüş: her karo için 1 (ulaşılabilir) / 0 içeren dizi.
   */
  computeReachable(seedX, seedY, blocked = null) {
    const { width, height } = this;
    const reachable = new Uint8Array(width * height);
    if (!this.isWalkable(seedX, seedY) || blocked?.has(this.index(seedX, seedY))) return reachable;
    // (34.1) İndeks yığınıyla taşma (genişleyen haritada çok karo): komşu karolar yerel sütun / satırla sınırlanır
    const stack = new Int32Array(width * height);
    let top = 0;
    const start = this.index(seedX, seedY);
    reachable[start] = 1;
    stack[top++] = start;
    while (top > 0) {
      const i = stack[--top];
      const lx = i % width;
      const ly = (i - lx) / width;
      for (let k = 0; k < 4; k++) {
        let n;
        if (k === 0) n = ly > 0 ? i - width : -1;
        else if (k === 1) n = lx < width - 1 ? i + 1 : -1;
        else if (k === 2) n = ly < height - 1 ? i + width : -1;
        else n = lx > 0 ? i - 1 : -1;
        if (n < 0 || reachable[n] || !this.walkableAt(n) || blocked?.has(n)) continue;
        reachable[n] = 1;
        stack[top++] = n;
      }
    }
    return reachable;
  }

  /** Arayüz ve oyun mantığı için bir karonun tam özeti. Harita dışıysa null. */
  getTileInfo(x, y) {
    if (!this.inBounds(x, y)) return null;
    const tile = this.get(x, y);
    const variant = this.getVariant(x, y);
    const object = this.getObject(x, y);
    const tileDef = TILE_TYPES[tile];
    return {
      x,
      y,
      tile,
      tileName: tileDef.name,
      variantName: tileDef.variants[variant] ?? null,
      biomeHint: tileDef.biome?.hint ?? null, // mikro-biyom: "Bahçe verimi +%25" gibi
      object,
      objectName: object ? OBJECT_TYPES[object].name : null,
      occupantId: this.getOccupant(x, y),
      walkable: this.isWalkable(x, y),
      buildable: this.isBuildable(x, y),
      locked: !this.isOpen(x, y), // (34.1)
    };
  }

  // ---- Çizim ----

  /** Kameranın gördüğü karo aralığı (frustum culling). */
  getVisibleRange(camera, renderer, extraRowsBelow = 0) {
    const size = CONFIG.TILE_SIZE;
    const view = camera.getViewBounds(renderer.width, renderer.height);
    return {
      x0: Math.max(this.x0, Math.floor(view.left / size)),
      y0: Math.max(this.y0, Math.floor(view.top / size)),
      x1: Math.min(this.x1, Math.ceil(view.right / size)),
      y1: Math.min(this.y1, Math.ceil(view.bottom / size) + extraRowsBelow),
    };
  }

  /**
   * Zemin karoları, kenar geçişleri ve (18. aşama) yol köşeleri. time: animasyon için saniye; season: mevsim anahtarı;
   * wet: yağmur yağıyor (toprak patikada çamur birikintileri).
   */
  renderGround(renderer, camera, time, season = 'summer', { wet = false } = {}) {
    const size = CONFIG.TILE_SIZE;
    const { x0, y0, x1, y1 } = this.getVisibleRange(camera, renderer);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const tile = this.get(x, y);
        const px = x * size;
        const py = y * size;
        renderer.drawImage(getTileSprite(tile, this.getVariant(x, y), time, season), px, py);

        const overlays = EDGE_OVERLAYS[tile];
        if (!overlays) continue;
        for (let dir = 0; dir < 4; dir++) {
          const [dx, dy] = NEIGHBOR_OFFSETS[dir];
          const neighbor = this.get(x + dx, y + dy);
          if (!neighbor) continue;
          // Kışın kar biyom sınırlarını örter: iki toprak zemin arasında geçiş çizilmez
          if (season === 'winter' && TILE_TYPES[tile].ground && TILE_TYPES[neighbor].ground) continue;
          const overlay = overlays.find((o) => o.neighbors.includes(neighbor));
          if (overlay) renderer.drawImage(getEdgeSprite(overlay.sprite, dir, time, season), px, py);
        }
        if (isRoad(tile)) this.drawRoadCorners(renderer, x, y, px, py, season);
        if (wet && MUDDY.has(tile) && (x * 3 + y * 5) % 3 !== 0) renderer.drawImage(getMudSprite((x + y * 7) % 2), px, py);
      }
    }
  }

  /**
   * (18. aşama) Otomatik yol köşeleri: iki yanı zemin olan köşe yuvarlanır (viraj), iki yanı yol olup çaprazı zemin
   * olan köşeye küçük bir çimen tutamı taşar (kavşak). Köşenin rengi komşu zeminden (çimen, bereketli toprak...).
   */
  drawRoadCorners(renderer, x, y, px, py, season) {
    for (let corner = 0; corner < 4; corner++) {
      const [ax, ay] = NEIGHBOR_OFFSETS[corner];
      const [bx, by] = NEIGHBOR_OFFSETS[(corner + 3) % 4];
      const a = this.get(x + ax, y + ay);
      const b = this.get(x + bx, y + by);
      if (!a || !b) continue;
      let kind = null;
      if (isGroundTile(a) && isGroundTile(b)) kind = `${a}CornerOuter`;
      else if (isRoad(a) && isRoad(b)) {
        const [dx, dy] = CORNER_DIAGONALS[corner];
        const diagonal = this.get(x + dx, y + dy);
        if (isGroundTile(diagonal)) kind = `${diagonal}CornerInner`;
      }
      if (kind) renderer.drawImage(getCornerSprite(kind, corner, season), px, py);
    }
  }

  /**
   * Görünen doğal nesneleri (ağaç, kaya) derinlik kuyruğuna ekler. Sıralama anahtarı
   * nesnenin taban çizgisidir; böylece karakterler ve yapılarla doğru sırada çizilirler.
   */
  queueObjects(queue, renderer, camera, season = 'summer') {
    const size = CONFIG.TILE_SIZE;
    const { x0, y0, x1, y1 } = this.getVisibleRange(camera, renderer, OBJECT_OVERDRAW_ROWS);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const object = this.getObject(x, y);
        if (!object) continue;
        // Sonbaharda her meşe konumuna göre turuncu, kızıl ya da altın olur
        const sprite = getObjectSprite(object, season, (x * 7 + y * 13) % AUTUMN_FOLIAGE_VARIANTS);
        const px = x * size + Math.floor((size - sprite.width) / 2);
        const py = (y + 1) * size - sprite.height;
        // Taban, gölgenin biraz üstü: karonun alt kenarından 3 piksel yukarısı
        queue.addImage((y + 1) * size - 3, sprite, px, py);
      }
    }
  }

  /** (34.1) Kilitli (satın alınmamış) karoları soluk bir sisle örter; açık alanın kenarına ince bir çizgi çeker. */
  renderLocked(renderer, camera) {
    const size = CONFIG.TILE_SIZE;
    const { x0, y0, x1, y1 } = this.getVisibleRange(camera, renderer, OBJECT_OVERDRAW_ROWS);
    for (let y = y0; y < y1; y++) {
      let run = null; // koşunun ilk karosu (eksi koordinat olabilir)
      for (let x = x0; x <= x1; x++) {
        const locked = x < x1 && !this.open[this.index(x, y)];
        if (locked && run === null) run = x;
        if (!locked && run !== null) {
          renderer.fillRect(run * size, y * size, (x - run) * size, size, LOCKED_VIEW.fog);
          run = null;
        }
      }
    }
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (this.open[this.index(x, y)]) continue;
        const px = x * size;
        const py = y * size;
        if (this.isOpen(x, y - 1)) renderer.fillRect(px, py, size, 1, LOCKED_VIEW.border);
        if (this.isOpen(x, y + 1)) renderer.fillRect(px, py + size - 1, size, 1, LOCKED_VIEW.border);
        if (this.isOpen(x - 1, y)) renderer.fillRect(px, py, 1, size, LOCKED_VIEW.border);
        if (this.isOpen(x + 1, y)) renderer.fillRect(px + size - 1, py, 1, size, LOCKED_VIEW.border);
      }
    }
  }
}
