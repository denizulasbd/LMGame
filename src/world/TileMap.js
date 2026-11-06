// Karo tabanlı harita: zemin, görsel varyasyon, doğal nesne ve yapı doluluğu katmanları.
// Veri sorgulama (yürünebilir mi, inşa edilebilir mi, adım maliyeti) ve görünen alanı çizme burada.
import { CONFIG } from '../config.js';
import { TILE_TYPES, TILE_BY_ID, OBJECT_TYPES, OBJECT_BY_ID } from '../data/tiles.js';
import { getTileSprite, getEdgeSprite, getObjectSprite, getCornerSprite, getMudSprite } from '../art/tiles/index.js';
import { MUD } from '../data/landscape.js';
import { AUTUMN_FOLIAGE_VARIANTS } from '../art/seasons.js';

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

// Ağaç gibi uzun nesneler üstteki karolara taşar; görünür alanın altına bu kadar
// fazladan satır eklenir ki ekranın altından taşan tepeler kesilmesin.
const OBJECT_OVERDRAW_ROWS = 1;

export class TileMap {
  constructor(width, height, fillTile = 'grass') {
    this.width = width;
    this.height = height;
    this.tiles = new Uint8Array(width * height).fill(TILE_TYPES[fillTile].id);
    this.variants = new Uint8Array(width * height);
    this.objects = new Uint8Array(width * height); // 0 = nesne yok
    this.occupants = new Uint16Array(width * height); // üzerindeki yapının kimliği, 0 = boş
    this.passable = new Uint8Array(width * height); // 1: üzerindeki yapının altından / içinden geçilebilir (kemer)
    this.wet = false; // (18. aşama) yağmur yağıyor: toprak patika çamurlu (LandscapeSystem her adımda yazar)
  }

  get pixelWidth() {
    return this.width * CONFIG.TILE_SIZE;
  }

  get pixelHeight() {
    return this.height * CONFIG.TILE_SIZE;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  index(x, y) {
    return y * this.width + x;
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
    const tile = this.get(x, y);
    if (!tile || !TILE_TYPES[tile].walkable) return false;
    if (this.getOccupant(x, y) !== 0 && !this.passable[this.index(x, y)]) return false;
    const object = this.getObject(x, y);
    return !object || OBJECT_TYPES[object].walkable;
  }

  isBuildable(x, y) {
    const tile = this.get(x, y);
    if (!tile || !TILE_TYPES[tile].buildable) return false;
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
    const reachable = new Uint8Array(this.width * this.height);
    if (!this.isWalkable(seedX, seedY) || blocked?.has(this.index(seedX, seedY))) return reachable;
    const stack = [[seedX, seedY]];
    reachable[this.index(seedX, seedY)] = 1;
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      for (const [dx, dy] of NEIGHBOR_OFFSETS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const i = this.index(nx, ny);
        if (reachable[i] || !this.isWalkable(nx, ny) || blocked?.has(i)) continue;
        reachable[i] = 1;
        stack.push([nx, ny]);
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
    };
  }

  // ---- Çizim ----

  /** Kameranın gördüğü karo aralığı (frustum culling). */
  getVisibleRange(camera, renderer, extraRowsBelow = 0) {
    const size = CONFIG.TILE_SIZE;
    const view = camera.getViewBounds(renderer.width, renderer.height);
    return {
      x0: Math.max(0, Math.floor(view.left / size)),
      y0: Math.max(0, Math.floor(view.top / size)),
      x1: Math.min(this.width, Math.ceil(view.right / size)),
      y1: Math.min(this.height, Math.ceil(view.bottom / size) + extraRowsBelow),
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
}
