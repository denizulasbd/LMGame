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

const GHOST_ALPHA = 0.6;
const T = CONFIG.TILE_SIZE;

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

    this.unsubscribe = game.events.on('ui:setTool', ({ tool, buildType = null }) => this.setTool(tool, buildType));
  }

  destroy() {
    this.unsubscribe();
  }

  get isActive() {
    return this.tool !== 'select';
  }

  setTool(tool, buildType = null) {
    this.finishStroke();
    this.tool = tool;
    this.buildType = tool === 'build' ? buildType ?? this.lastBuildType : null;
    if (this.buildType) this.lastBuildType = this.buildType;
    this.preview = { ok: false, text: '' };
    this.events.emit('tool:changed', { tool: this.tool, buildType: this.buildType });
    this.events.emit('tool:preview', this.preview);
  }

  /** Araç kısayolları. Esc bir araç kapattıysa true döner (sahne seçimi bırakmasın). */
  handleKeys() {
    const { input } = this.game;
    if (input.wasPressed('toolBuild')) this.setTool(this.tool === 'build' ? 'select' : 'build');
    if (input.wasPressed('toolHarvest')) this.setTool(this.tool === 'harvest' ? 'select' : 'harvest');
    if (input.wasPressed('toolDemolish')) this.setTool(this.tool === 'demolish' ? 'select' : 'demolish');
    if (input.wasPressed('cancel') && this.isActive) {
      this.setTool('select');
      return true;
    }
    return false;
  }

  /** @param {{tileX:number, tileY:number}|null} hovered */
  update(hovered) {
    const { input } = this.game;
    this.hovered = hovered;
    const pressed = input.consumeLeftPress();
    const released = input.consumeLeftRelease();
    if (!this.isActive) return;
    input.consumeClick(); // araç açıkken tıklama seçim yapmaz

    if (pressed && hovered) this.beginStroke(hovered);
    else if (this.stroke && input.mouse.leftHeld && hovered) this.continueStroke(hovered);
    if (released) this.finishStroke();
    this.updatePreview();
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
    const next = this.computePreview();
    if (next.ok !== this.preview.ok || next.text !== this.preview.text) {
      this.preview = next;
      this.events.emit('tool:preview', next);
    } else {
      this.preview = { ...this.preview, ...next };
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
      const check = this.construction.checkPlacement(this.buildType, anchor.x, anchor.y);
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
        const drag = isSmallDecor(check.building.type) ? ' · sürükleyerek fırçala' : '';
        return { ok: true, text: `${check.reason} (%50 iade)${drag}` };
      }
      return { ok: check.ok, text: check.ok ? `${check.reason} · sürükleyerek fırçala` : check.reason };
    }
    return { ok: false, text: '' };
  }

  /** Dünya koordinatında çizilir (atmosfer katmanının üstünde). */
  render(renderer, env) {
    const tile = this.hovered;
    if (!this.isActive || !tile) return;
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
      return;
    }
    if (this.tool === 'build') {
      renderer.drawImageAlpha(getTileSprite(TILE_BUILDS[this.buildType].result, 0, env.time), tile.tileX * T, tile.tileY * T, GHOST_ALPHA);
    }
    drawAreaCursor(renderer, tile.tileX, tile.tileY, 1, 1, env.time, ok);
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
