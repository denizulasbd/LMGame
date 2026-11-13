// Oyuncunun yönetim araçları: Seç / İnşa et / Kaynak topla / Yık.
//
//   Seç     : (varsayılan) karakter ve yapı seçimi sahnede yapılır
//   İnşa et : yapı seçiliyse fare ucunda yarı saydam hayalet; tıklayınca şantiye kurulur.
//             Yol / köprü seçiliyse sürükleyerek fırça gibi döşenir.
//   Topla   : ağaç, kaya, çakıl ve böğürtlen çalılarına sürükleyerek toplama emri verir;
//             emirli bir hedeften başlayan sürükleme emirleri kaldırır
//   Yık     : yapıyı yıkar / şantiyeyi iptal eder, yolu kaldırır, toplama emrini iptal eder
//
// (18. aşama) Serbest imar:
//   - Yol & Zemin fırçaları (Toprak Patika, Parke Taş Yol, Taş Plaka, Köprü) sürüklenince kesintisiz çizer: fare hızlı
//     gitse de aradaki karolar dolar (4 yönlü bağlı çizgi), yollar birbirine otomatik bağlanır (köşeler TileMap'te).
//   - Fırçayla dikilen süsler (çit, çiçekli çit, saksı, fidan) sürükleyerek art arda kurulur; tek tıkla tek kare.
//   - Yıkım fırçası: tıklanan yapı (her boyutta) yıkılır; sürükleyince yollar, çitler ve küçük süsler (1x1 peyzaj)
//     geri dönüştürülür. Her biri harcananın yarısını depoya iade eder; fırça bitince tek bir özet bildirimi çıkar.
//
// (30.1) İlk saat:
//   - Önizleme (hayalet rengi, neden metni) yalnızca fare karosu, yapı türü, harita sürümü ya da karşılanabilirlik değişince hesaplanır
//     (kare başına checkPlacement yok). Kurulamama nedeni hayaletin yanında haritada çizilir.
//   - İnşa aracında yapı seçiliyken kamera içindeki uygun karolar soluk yeşil boyanır (kare başına en çok SCAN_BUDGET deneme;
//     sonuç tür, harita sürümü ve karşılanabilirlik değişene dek önbellekte). Ekranda hiç uygun yer yoksa en yakın uygun yerin yönü okla gösterilir.
//   - Yapı seçilince liste ince bir şeride iner (listOpen); Esc ya da "Listeyi aç" listeyi geri açar.
//   - Yık aracı tamamlanmış yapıda ilk tıklamada işaretler, 4 sn içinde ikinci tıklama yıkar (fırça süsleri ve şantiyeler tek tık).
// Klavye: B inşa, H topla, X yık, Esc seçime dön. Arayüz 'ui:setTool' ile araç değiştirir;
// değişiklikler 'tool:changed', fare altındaki durum 'tool:preview' olarak yayınlanır.
import { BUILDINGS, TILE_BUILDS, buildTabFor } from '../data/buildings.js';
import { OBJECT_TYPES } from '../data/tiles.js';
import { formatCost } from '../data/resources.js';
import { biomeBonus, biomeFor } from '../systems/StructureSystem.js';
import { drawAreaCursor } from '../rendering/TileCursor.js';
import { getStructureSprite } from '../art/sprites/index.js';
import { getTileSprite } from '../art/tiles/index.js';
import { CONFIG } from '../config.js';
import { AESTHETIC } from '../data/landscape.js';
import { aestheticLevel } from '../systems/Landscape.js';
import { drawHintLabel, wrapText, DANGER_COLOR } from '../rendering/MapLabels.js';

const GHOST_ALPHA = 0.6;
const T = CONFIG.TILE_SIZE;
const SCAN_BUDGET = 24; // kare başına en çok bu kadar checkPlacement (boyama taraması)
const NEAREST_RADIUS = 60; // "uygun yer yok" okunun arayacağı en büyük halka (karo)
const CONFIRM_MS = 4000; // yıkım onayı süresi
const PAINT_COLOR = 'rgba(126, 224, 110, 0.34)';
const PAINT_EDGE = 'rgba(206, 255, 160, 0.5)'; // (30.2) her uygun karonun içinde ince (1 px) çerçeve: soluk dolguyu seçilir kılar
// Önbelleği düşüren olaylar (harita, yapılar, seviye, nüfus); saatlik yenileme geri kalanını yakalar
const INVALIDATE_EVENTS = ['building:placed', 'building:removed', 'building:completed', 'building:upgraded', 'building:damaged', 'world:blocked', 'terrain:painted', 'job:completed', 'town:tierUp', 'population:joined', 'population:died', 'time:hour', 'exploration:itemGained'];

export class ToolController {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ construction: import('../systems/ConstructionSystem.js').ConstructionSystem, jobs: import('../systems/JobSystem.js').JobSystem }} services
   */
  constructor(game, world, { construction, jobs }) {
    this.game = game;
    this.events = game.events;
    this.world = world;
    this.construction = construction;
    this.jobs = jobs;

    this.tool = 'select';
    this.buildType = null;
    this.lastBuildType = 'cabin';
    this.stroke = null;
    this.hovered = null;
    this.preview = { ok: false, text: '' };
    this.listOpen = true; // (30.1) inşa listesi açık mı (yapı seçilince şeride iner)
    this.version = 0; // (30.1) harita / yapı sürümü: önizleme ve boyama önbelleği bunu izler
    this.previewKey = '';
    this.previewCache = null;
    this.paint = { key: '', results: new Map(), queue: [], queueAt: 0, rect: null, visibleOk: 0, complete: false, blocked: false, nearest: undefined, searching: null };
    this.demolishArm = null; // (30.1) { id, until } yıkım onayı bekleyen yapı
    this.wrapCache = new Map();
    this.checks = 0; // (30.1) sayaç: yapılan checkPlacement çağrıları (test ve ölçüm için)
    this.view = null;

    this.unsubscribers = [
      game.events.on('ui:setTool', ({ tool, buildType = null }) => this.setTool(tool, buildType)),
      game.events.on('ui:buildList', ({ open }) => this.setListOpen(open)),
      ...INVALIDATE_EVENTS.map((name) => game.events.on(name, () => this.version++)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get isActive() {
    return this.tool !== 'select';
  }

  setTool(tool, buildType = null) {
    this.finishStroke();
    this.tool = tool;
    this.buildType = tool === 'build' ? buildType ?? this.lastBuildType : null;
    if (this.buildType) this.lastBuildType = this.buildType;
    // (30.1) Listeden bir yapı seçmek listeyi şeride indirir; aracı düğmeyle / B ile açmak listeyi açar
    this.listOpen = !(tool === 'build' && buildType);
    this.demolishArm = null;
    this.preview = { ok: false, text: '' };
    this.previewKey = '';
    this.emitChanged();
    this.events.emit('tool:preview', this.preview);
  }

  emitChanged() {
    this.events.emit('tool:changed', { tool: this.tool, buildType: this.buildType, listOpen: this.listOpen });
  }

  /** (30.1) Yapı listesini aç / şeride indir ("Listeyi aç" düğmesi, Esc). */
  setListOpen(open) {
    if (this.tool !== 'build') return;
    this.listOpen = Boolean(open) || !this.buildType;
    this.emitChanged();
  }

  /** Araç kısayolları. Esc bir araç kapattıysa true döner (sahne seçimi bırakmasın). */
  handleKeys() {
    const { input } = this.game;
    if (input.wasPressed('toolBuild')) this.setTool(this.tool === 'build' ? 'select' : 'build');
    if (input.wasPressed('toolHarvest')) this.setTool(this.tool === 'harvest' ? 'select' : 'harvest');
    if (input.wasPressed('toolDemolish')) this.setTool(this.tool === 'demolish' ? 'select' : 'demolish');
    if (input.wasPressed('cancel') && this.isActive) {
      // (30.1) Yapı şeridi küçükken Esc önce listeyi geri açar; ikinci Esc aracı bırakır
      if (this.tool === 'build' && this.buildType && !this.listOpen) this.setListOpen(true);
      else this.setTool('select');
      return true;
    }
    return false;
  }

  /**
   * @param {{tileX:number, tileY:number}|null} hovered
   * @param {{ camera: import('../rendering/Camera.js').Camera, width: number, height: number }|null} view (30.1) görünen alan (boyama taraması)
   */
  update(hovered, view = null) {
    const { input } = this.game;
    this.hovered = hovered;
    this.view = view;
    const pressed = input.consumeLeftPress();
    const released = input.consumeLeftRelease();
    if (!this.isActive) return;
    input.consumeClick(); // araç açıkken tıklama seçim yapmaz

    if (pressed && hovered) this.beginStroke(hovered);
    else if (this.stroke && input.mouse.leftHeld && hovered) this.continueStroke(hovered);
    if (released) this.finishStroke();
    this.updatePreview();
    this.updatePaint();
  }

  // ---------------------------------------------------------------------------
  // Tıklama ve fırça
  // ---------------------------------------------------------------------------

  isTileBuild() {
    return Boolean(this.buildType && TILE_BUILDS[this.buildType]);
  }

  /** (18. aşama) Sürükleyerek art arda dikilen süs (çit, saksı, fidan) mi? */
  isBrushBuild() {
    return Boolean(this.buildType && BUILDINGS[this.buildType]?.brush);
  }

  beginStroke(tile) {
    if (this.tool === 'build' && !this.isTileBuild() && !this.isBrushBuild()) {
      const anchor = this.construction.anchorFor(this.buildType, tile.tileX, tile.tileY);
      const result = this.construction.placeSite(this.buildType, anchor.x, anchor.y);
      if (!result.ok) this.events.emit('toast', { text: result.reason, tone: 'warn', icon: 'demolish' });
      return;
    }
    let mode = 'add';
    if (this.tool === 'harvest' && this.jobs.jobAt(tile.tileX, tile.tileY)) mode = 'remove';
    this.stroke = { mode, visited: new Set(), changed: false, failure: null, last: null, placed: 0, removed: { tiles: 0, buildings: 0, names: [] }, refund: {} };
    if (this.tool === 'demolish') {
      // İlk tıklama: toplama emri iptali ya da her boyutta yapı / yol; sürükleme yalnızca yol ve küçük süs
      const job = this.jobs.jobAt(tile.tileX, tile.tileY);
      if (job && job.type !== 'build') {
        this.jobs.cancel(job);
        this.stroke.mode = 'jobs';
        this.stroke.visited.add(`${tile.tileX},${tile.tileY}`);
        this.stroke.last = { x: tile.tileX, y: tile.tileY };
        return;
      }
      this.stroke.first = true;
    }
    this.continueStroke(tile);
  }

  /** Fare bir karodan uzaktaki karoya sıçrasa da aradaki karolar sırayla işlenir (4 yönlü bağlı çizgi). */
  continueStroke(tile) {
    const last = this.stroke.last;
    const points = last ? lineTiles(last.x, last.y, tile.tileX, tile.tileY) : [{ x: tile.tileX, y: tile.tileY }];
    for (const p of points) this.strokeTile(p.x, p.y);
    this.stroke.last = { x: tile.tileX, y: tile.tileY };
  }

  strokeTile(x, y) {
    const key = `${x},${y}`;
    if (this.stroke.visited.has(key)) return;
    this.stroke.visited.add(key);

    if (this.tool === 'build' && this.isBrushBuild()) {
      const result = this.construction.placeSite(this.buildType, x, y, { quiet: true });
      if (result.ok) {
        this.stroke.placed += 1;
        this.stroke.changed = true;
      } else this.stroke.failure ??= result.reason;
    } else if (this.tool === 'build') {
      const result = this.construction.paintTile(this.buildType, x, y);
      if (result.ok) {
        this.stroke.changed = true;
        this.stroke.placed += 1;
      } else if (!result.already) this.stroke.failure ??= result.reason;
    } else if (this.tool === 'harvest') {
      const job = this.jobs.jobAt(x, y);
      if (this.stroke.mode === 'remove' && job && job.type !== 'build') this.jobs.cancel(job);
      if (this.stroke.mode === 'add' && !job) this.jobs.designate(x, y);
    } else if (this.tool === 'demolish') {
      this.demolishTile(x, y);
    }
  }

  /** (30.1) Onay isteyen yıkım: tamamlanmış ve fırçayla dizilmemiş yapı (yol, çit, saksı, fidan ve şantiyeler tek tık). */
  needsDemolishConfirm(building) {
    return !building.underConstruction && !BUILDINGS[building.type]?.brush && !isSmallDecor(building.type);
  }

  /** Yıkım fırçası: ilk karoda her şey; sürüklerken yalnızca yol / zemin ve 1x1 peyzaj süsleri. */
  demolishTile(x, y) {
    const stroke = this.stroke;
    if (stroke.mode === 'jobs') {
      const job = this.jobs.jobAt(x, y);
      if (job && job.type !== 'build') this.jobs.cancel(job);
      return;
    }
    const first = stroke.first;
    stroke.first = false;
    const check = this.construction.describeDemolish(x, y);
    if (!check.ok) {
      if (first) stroke.failure ??= check.reason;
      return;
    }
    if (check.building && !first && !isSmallDecor(check.building.type)) return;
    // (30.1) Tamamlanmış yapı ilk tıklamada yalnızca işaretlenir; 4 sn içinde aynı yapıya ikinci tıklama yıkar
    if (first && check.building && this.needsDemolishConfirm(check.building)) {
      const now = performance.now();
      const arm = this.demolishArm;
      if (arm && arm.id === check.building.id && now <= arm.until) this.demolishArm = null;
      else {
        this.demolishArm = { id: check.building.id, until: now + CONFIRM_MS };
        return;
      }
    } else if (first) this.demolishArm = null;
    const before = { ...this.world.state.resources };
    const result = this.construction.demolishAt(x, y, { quiet: true, refresh: false });
    if (!result.ok) return;
    stroke.changed = true;
    if (result.kind === 'tile') stroke.removed.tiles += 1;
    else {
      stroke.removed.buildings += 1;
      if (stroke.removed.names.length < 3 && !stroke.removed.names.includes(check.building.name)) stroke.removed.names.push(check.building.name);
    }
    for (const [r, v] of Object.entries(this.world.state.resources)) {
      const gained = v - (before[r] ?? 0);
      if (gained > 0) stroke.refund[r] = (stroke.refund[r] ?? 0) + gained;
    }
  }

  finishStroke() {
    if (!this.stroke) return;
    const stroke = this.stroke;
    if (stroke.changed) this.world.refreshStaticData();
    if (!stroke.changed && stroke.failure) {
      this.events.emit('toast', { text: stroke.failure, tone: 'warn', icon: 'demolish' });
    }
    if (this.tool === 'demolish' && stroke.changed) {
      const parts = [];
      if (stroke.removed.buildings) parts.push(stroke.removed.buildings === 1 ? stroke.removed.names[0] : `${stroke.removed.buildings} yapı / süs`);
      if (stroke.removed.tiles) parts.push(`${stroke.removed.tiles} karo zemin`);
      const refund = Object.keys(stroke.refund).length ? ` · iade: ${formatCost(stroke.refund)}` : '';
      this.events.emit('toast', { text: `Geri dönüştürüldü: ${parts.join(', ')} (%50 iade)${refund}`, tone: 'info', icon: 'demolish' });
    }
    if (this.tool === 'build' && this.isBrushBuild() && stroke.placed > 0) {
      const def = BUILDINGS[this.buildType];
      const total = Object.fromEntries(Object.entries(def.cost).map(([r, v]) => [r, v * stroke.placed]));
      this.events.emit('toast', { text: `${stroke.placed} × ${def.name} dikiliyor (${formatCost(total)})`, tone: 'info', icon: 'hammer' });
    }
    this.stroke = null;
  }

  // ---------------------------------------------------------------------------
  // Önizleme
  // ---------------------------------------------------------------------------

  updatePreview() {
    let next;
    if (this.tool === 'build') {
      // (30.1) Yapı yerleştirme önizlemesi pahalıdır (ulaşılabilirlik taraması): yalnızca fare karosu, yapı türü, harita sürümü ya da
      // karşılanabilirlik değişince hesaplanır; durağan fareyle kare başına checkPlacement çağrılmaz
      const tile = this.hovered;
      const key = `${this.buildType}|${tile ? `${tile.tileX},${tile.tileY}` : '-'}|${this.version}|${this.affordable()}`;
      if (key !== this.previewKey || !this.previewCache) {
        this.previewKey = key;
        this.previewCache = this.computePreview();
      }
      next = this.previewCache;
    } else {
      next = this.computePreview();
      this.previewKey = '';
      this.previewCache = null;
    }
    if (this.demolishArm && performance.now() > this.demolishArm.until) this.demolishArm = null;
    if (next.ok !== this.preview.ok || next.text !== this.preview.text) {
      this.preview = next;
      this.events.emit('tool:preview', next);
    } else {
      Object.assign(this.preview, next);
    }
  }

  /** Seçili yapının bedeli şu an karşılanıyor mu (önbellek anahtarı; kare başına ayırma yapmaz). */
  affordable() {
    const cost = BUILDINGS[this.buildType]?.cost ?? TILE_BUILDS[this.buildType]?.cost;
    if (!cost) return true;
    const resources = this.world.state.resources;
    for (const r in cost) if ((resources[r] ?? 0) < cost[r]) return false;
    return true;
  }

  /** Sayaçlı checkPlacement: boyama taramasının ve önizlemenin tek giriş noktası. */
  check(type, x, y) {
    this.checks++;
    return this.construction.checkPlacement(type, x, y);
  }

  // ---------------------------------------------------------------------------
  // (30.1) Uygun karo boyaması
  // ---------------------------------------------------------------------------

  /** Boyama bu araç ve yapı türü için geçerli mi (yalnızca tek tıkla kurulan, fırçasız yapılar)? */
  paintActive() {
    return this.tool === 'build' && Boolean(this.buildType) && !this.isTileBuild() && !this.isBrushBuild() && Boolean(this.view);
  }

  /** Görünen karo dikdörtgeni { x0, y0, x1, y1 } (harita içine kırpılmış). */
  viewRect() {
    const { camera, width, height } = this.view;
    const map = this.world.map;
    return {
      x0: Math.max(0, Math.floor(camera.x / T)),
      y0: Math.max(0, Math.floor(camera.y / T)),
      x1: Math.min(map.width - 1, Math.floor((camera.x + width / camera.zoom) / T)),
      y1: Math.min(map.height - 1, Math.floor((camera.y + height / camera.zoom) / T)),
    };
  }

  /**
   * Kamera içindeki karolar için "imleç bu karodayken yapı kurulabilir mi" sonucunu önbelleğe alır (anahtar: yapı türü, harita sürümü,
   * karşılanabilirlik). Her kare en çok SCAN_BUDGET yeni karo denenir; kamera yeni karolara kayınca yalnızca görülmemişler eklenir.
   * Bedel karşılanmıyorsa ya da yapı konumdan bağımsız kilitliyse (seviye, nüfus, tek olabilen) hiç tarama yapılmaz.
   */
  updatePaint() {
    const p = this.paint;
    if (!this.paintActive()) {
      p.key = '';
      return;
    }
    const afford = this.affordable();
    const key = `${this.buildType}|${this.version}|${afford}`;
    if (key !== p.key) {
      p.key = key;
      p.results.clear();
      p.queue.length = 0;
      p.queueAt = 0;
      p.rect = null;
      p.nearest = undefined;
      p.searching = null;
      p.blocked = !afford || Boolean(this.construction.globalBlock(this.buildType));
    }
    if (p.blocked) {
      p.visibleOk = 0;
      p.complete = false;
      return;
    }
    const rect = this.viewRect();
    const r = p.rect;
    if (!r || r.x0 !== rect.x0 || r.y0 !== rect.y0 || r.x1 !== rect.x1 || r.y1 !== rect.y1) {
      p.rect = rect;
      p.queue.length = 0;
      p.queueAt = 0;
      p.nearest = undefined;
      p.searching = null;
      const cx = (rect.x0 + rect.x1) / 2;
      const cy = (rect.y0 + rect.y1) / 2;
      for (let y = rect.y0; y <= rect.y1; y++) for (let x = rect.x0; x <= rect.x1; x++) if (!p.results.has(y * this.world.map.width + x)) p.queue.push(y * this.world.map.width + x);
      const w = this.world.map.width;
      p.queue.sort((a, b) => Math.hypot((a % w) - cx, Math.floor(a / w) - cy) - Math.hypot((b % w) - cx, Math.floor(b / w) - cy));
    }
    const w = this.world.map.width;
    for (let n = 0; n < SCAN_BUDGET && p.queueAt < p.queue.length; n++) {
      const index = p.queue[p.queueAt++];
      const x = index % w;
      const y = (index - x) / w;
      const anchor = this.construction.anchorFor(this.buildType, x, y);
      p.results.set(index, this.check(this.buildType, anchor.x, anchor.y).ok);
    }
    p.complete = p.queueAt >= p.queue.length;
    let ok = 0;
    for (let y = rect.y0; y <= rect.y1; y++) for (let x = rect.x0; x <= rect.x1; x++) if (p.results.get(y * w + x)) ok++;
    p.visibleOk = ok;
    // Ekranda hiç uygun karo yoksa görünen alanın merkezinden dışa doğru halka halka en yakın uygun karo aranır
    if (p.complete && ok === 0 && p.nearest === undefined) {
      p.searching ??= { cx: Math.round((rect.x0 + rect.x1) / 2), cy: Math.round((rect.y0 + rect.y1) / 2), ring: 1, i: 0, rect };
      this.stepNearest();
    } else if (ok > 0) p.searching = null;
  }

  stepNearest() {
    const p = this.paint;
    const s = p.searching;
    if (!s) return;
    const map = this.world.map;
    for (let n = 0; n < SCAN_BUDGET; ) {
      if (s.ring > NEAREST_RADIUS) {
        p.nearest = null;
        p.searching = null;
        return;
      }
      const r = s.ring;
      const perimeter = 8 * r;
      if (s.i >= perimeter) {
        s.ring++;
        s.i = 0;
        continue;
      }
      // Halkanın i'inci karosu: üst kenar, sağ kenar, alt kenar (sağdan sola), sol kenar (alttan yukarı)
      const i = s.i++;
      const side = Math.floor(i / (2 * r));
      const k = i % (2 * r);
      const dx = side === 0 ? -r + k : side === 1 ? r : side === 2 ? r - k : -r;
      const dy = side === 0 ? -r : side === 1 ? -r + k : side === 2 ? r : r - k;
      const x = s.cx + dx;
      const y = s.cy + dy;
      if (!map.inBounds(x, y)) continue;
      const inView = x >= s.rect.x0 && x <= s.rect.x1 && y >= s.rect.y0 && y <= s.rect.y1;
      if (inView) continue;
      n++;
      const anchor = this.construction.anchorFor(this.buildType, x, y);
      if (this.check(this.buildType, anchor.x, anchor.y).ok) {
        p.nearest = { x, y };
        p.searching = null;
        return;
      }
    }
  }

  computePreview() {
    const tile = this.hovered;
    if (!tile) return { ok: false, text: '' };
    const { tileX: x, tileY: y } = tile;

    if (this.tool === 'build') {
      if (this.isTileBuild()) {
        const def = TILE_BUILDS[this.buildType];
        const check = this.construction.checkPaint(this.buildType, x, y);
        return { ok: check.ok, text: check.ok ? `${def.name} · ${formatCost(def.cost)} · tıkla ya da sürükleyerek çiz` : check.reason };
      }
      const def = BUILDINGS[this.buildType];
      const anchor = this.construction.anchorFor(this.buildType, x, y);
      const check = this.check(this.buildType, anchor.x, anchor.y);
      // Biyom bonusu (bereketli toprakta bahçe, kayalıkta taş ocağı) kurmadan önce görünsün
      const bonus = biomeBonus(this.world.map, this.buildType, anchor.x, anchor.y);
      const biome = bonus > 0 ? ` · ${biomeFor(this.buildType).name}: verim +%${Math.round(bonus * 100)}` : '';
      // (18. aşama) Süsün çevreye katacağı estetik ve buradaki mevcut estetik
      const value = AESTHETIC.values[this.buildType];
      const here = this.world.aesthetics?.[this.world.map.index(anchor.x, anchor.y)] ?? 0;
      const level = aestheticLevel(here);
      const beauty = value ? ` · Çevre estetiği +${value}${level ? ` (burası: ${level})` : ''}` : '';
      const how = this.isBrushBuild() ? 'tıkla ya da sürükleyerek diz' : 'tıkla ve kur';
      return {
        ok: check.ok,
        text: check.ok ? `${def.name} · ${formatCost(def.cost)}${biome}${beauty} · ${how}` : check.reason,
        anchor,
        doors: check.doors,
        orientation: check.orientation,
      };
    }
    if (this.tool === 'harvest') {
      const job = this.jobs.jobAt(x, y);
      if (job && job.type !== 'build') return { ok: true, text: 'Toplama emrini kaldır' };
      if (!this.jobs.isHarvestable(x, y)) return { ok: false, text: 'Burada toplanacak bir şey yok' };
      const building = this.world.getBuilding(this.world.map.getOccupant(x, y));
      const name = building ? building.name : OBJECT_TYPES[this.world.map.getObject(x, y)].name;
      return { ok: true, text: `Toplama emri ver: ${name}` };
    }
    if (this.tool === 'demolish') {
      const job = this.jobs.jobAt(x, y);
      if (job && job.type !== 'build') return { ok: true, text: 'Toplama emrini iptal et' };
      const check = this.construction.describeDemolish(x, y);
      if (check.ok && check.building) {
        if (this.needsDemolishConfirm(check.building)) {
          const refund = this.construction.demolishRefund(check.building);
          const back = Object.keys(refund).length ? formatCost(refund) : 'yok';
          const armed = this.demolishArm?.id === check.building.id;
          return {
            ok: true,
            text: armed ? `Yıkmak için yeniden tıkla (iade: ${back})` : `${check.reason} · işaretlemek için tıkla (iade: ${back})`,
            armed,
            building: check.building,
          };
        }
        const drag = isSmallDecor(check.building.type) ? ' · sürükleyerek fırçala' : '';
        return { ok: true, text: `${check.reason} (%50 iade)${drag}` };
      }
      return { ok: check.ok, text: check.ok ? `${check.reason} · sürükleyerek fırçala` : check.reason };
    }
    return { ok: false, text: '' };
  }

  /** Dünya koordinatında çizilir (atmosfer katmanının üstünde). Salt okunur: durum yazmaz, kare başına ayırma yapmaz. */
  render(renderer, env, camera = null) {
    const tile = this.hovered;
    if (!this.isActive) return;
    if (this.paintActive() && !this.paint.blocked) this.renderPaint(renderer);
    if (this.tool === 'demolish') this.renderArmed(renderer, env);
    if (!tile) return;
    const { ok } = this.preview;

    if (this.tool === 'build' && !this.isTileBuild()) {
      const def = BUILDINGS[this.buildType];
      const anchor = this.preview.anchor ?? this.construction.anchorFor(this.buildType, tile.tileX, tile.tileY);
      const sprite = getStructureSprite(this.buildType, {
        windowsLit: env.windowsLit,
        orientation: this.preview.orientation,
        frame: Math.floor(env.time * 1.4),
      });
      const baseY = (anchor.y + def.size.h) * T;
      renderer.drawImageAlpha(sprite, anchor.x * T, baseY - sprite.height, GHOST_ALPHA);
      drawAreaCursor(renderer, anchor.x, anchor.y, def.size.w, def.size.h, env.time, ok);
      for (const door of this.preview.doors ?? []) {
        renderer.fillRect(door.x * T + 4, door.y * T + 4, T - 8, T - 8, ok ? 'rgba(255, 243, 176, 0.45)' : 'rgba(232, 70, 60, 0.4)');
      }
      if (camera) this.renderBuildLabel(renderer, camera, anchor, def.size);
      return;
    }
    if (this.tool === 'build') {
      renderer.drawImageAlpha(getTileSprite(TILE_BUILDS[this.buildType].result, 0, env.time), tile.tileX * T, tile.tileY * T, GHOST_ALPHA);
    }
    drawAreaCursor(renderer, tile.tileX, tile.tileY, 1, 1, env.time, ok);
    if (camera && this.tool === 'build' && !ok) this.drawLabel(renderer, camera, this.preview.text, tile.tileX, tile.tileY, 1, 1, 'bad');
    if (camera && this.tool === 'demolish' && this.preview.armed) this.drawLabel(renderer, camera, this.preview.text, tile.tileX, tile.tileY, 1, 1, 'bad');
  }

  /** Kamera içindeki uygun karoları soluk yeşil boyar (önbellekten okur; yeni hesap yapmaz). */
  renderPaint(renderer) {
    const p = this.paint;
    if (!p.rect) return;
    const w = this.world.map.width;
    const r = p.rect;
    for (let y = r.y0; y <= r.y1; y++) {
      for (let x = r.x0; x <= r.x1; x++) {
        if (!p.results.get(y * w + x)) continue;
        const px = x * T;
        const py = y * T;
        renderer.fillRect(px, py, T, T, PAINT_COLOR);
        renderer.fillRect(px, py, T, 1, PAINT_EDGE);
        renderer.fillRect(px, py + T - 1, T, 1, PAINT_EDGE);
        renderer.fillRect(px, py + 1, 1, T - 2, PAINT_EDGE);
        renderer.fillRect(px + T - 1, py + 1, 1, T - 2, PAINT_EDGE);
      }
    }
  }

  /** Yıkım onayı bekleyen yapıyı kırmızı kalın çerçeveyle işaretler. */
  renderArmed(renderer, env) {
    const arm = this.demolishArm;
    if (!arm) return;
    const b = this.world.getBuilding(arm.id);
    if (!b) return;
    const { w, h } = b.definition.size;
    const x = b.tileX * T;
    const y = b.tileY * T;
    const blink = Math.sin(env.time * 8) > 0 ? 0.9 : 0.6;
    renderer.fillRect(x, y, w * T, h * T, `rgba(232, 70, 60, ${0.18 * blink})`);
    renderer.fillRect(x - 2, y - 2, w * T + 4, 2, DANGER_COLOR);
    renderer.fillRect(x - 2, y + h * T, w * T + 4, 2, DANGER_COLOR);
    renderer.fillRect(x - 2, y, 2, h * T, DANGER_COLOR);
    renderer.fillRect(x + w * T, y, 2, h * T, DANGER_COLOR);
  }

  /** Hayaletin yanındaki etiketler: kurulamama nedeni (en çok iki satır) ve ekranda hiç uygun yer yoksa "Bu ekranda uygun yer yok" + yön oku. */
  renderBuildLabel(renderer, camera, anchor, size) {
    const p = this.paint;
    let dy = 0;
    if (!this.preview.ok && this.preview.text) {
      this.drawLabel(renderer, camera, this.preview.text, anchor.x, anchor.y, size.w, size.h, 'bad');
      dy = this.wrapCache.get(this.preview.text).lines.length * 15 + 14;
    }
    if (this.paintActive() && !p.blocked && p.complete && p.visibleOk === 0) {
      const tile = this.hovered;
      const arrow = p.nearest ? Math.atan2(p.nearest.y - tile.tileY, p.nearest.x - tile.tileX) : null;
      this.drawLabel(renderer, camera, 'Bu ekranda uygun yer yok', anchor.x, anchor.y, size.w, size.h, 'info', arrow, dy);
    }
  }

  /** Dünya karo dikdörtgeninin ekran karşılığının yanına etiket çizer (ekrandan taşmaz). */
  drawLabel(renderer, camera, text, tx, ty, tw, th, tone, arrow = null, dy = 0) {
    let wrapped = this.wrapCache.get(text);
    if (!wrapped) {
      wrapped = wrapText(renderer.ctx, text, 2);
      this.wrapCache.set(text, wrapped);
    }
    const z = camera.zoom;
    const target = { x: (tx * T - camera.x) * z, y: (ty * T - camera.y) * z + dy, w: tw * T * z, h: th * T * z };
    renderer.resetCamera();
    drawHintLabel(renderer, wrapped, target, tone, arrow);
    renderer.applyCamera(camera);
  }
}

/** (18. aşama) Yıkım fırçasının sürüklerken kaldırdığı küçük süs: 1x1 peyzaj / süsleme yapısı. */
function isSmallDecor(type) {
  const def = BUILDINGS[type];
  return Boolean(def && def.size.w === 1 && def.size.h === 1 && buildTabFor(type) === 'decor');
}

/** İki karo arasındaki 4 yönlü bağlı karolar (başlangıç hariç, bitiş dahil): fırça çizgisi kopmasın. */
export function lineTiles(x0, y0, x1, y1) {
  const out = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x1 > x0 ? 1 : -1;
  const sy = y1 > y0 ? 1 : -1;
  let err = dx - dy;
  while (x !== x1 || y !== y1) {
    // Çapraz adım yerine önce yatay, sonra dikey: yol karoları köşeden değil kenardan birleşsin
    if (x !== x1 && (y === y1 || 2 * err > -dy)) {
      err -= dy;
      x += sx;
    } else {
      err += dx;
      y += sy;
    }
    out.push({ x, y });
  }
  if (out.length === 0) out.push({ x: x1, y: y1 });
  return out;
}
