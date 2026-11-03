// Oyuncunun yönetim araçları: Seç / İnşa et / Kaynak topla / Yık.
//
//   Seç     : (varsayılan) karakter ve yapı seçimi sahnede yapılır
//   İnşa et : yapı seçiliyse fare ucunda yarı saydam hayalet; tıklayınca şantiye kurulur.
//             Yol / köprü seçiliyse sürükleyerek fırça gibi döşenir.
//   Topla   : ağaç, kaya, çakıl ve böğürtlen çalılarına sürükleyerek toplama emri verir;
//             emirli bir hedeften başlayan sürükleme emirleri kaldırır
//   Yık     : yapıyı yıkar / şantiyeyi iptal eder, yolu kaldırır, toplama emrini iptal eder
//
// Klavye: B inşa, H topla, X yık, Esc seçime dön. Arayüz 'ui:setTool' ile araç değiştirir;
// değişiklikler 'tool:changed', fare altındaki durum 'tool:preview' olarak yayınlanır.
import { BUILDINGS, TILE_BUILDS } from '../data/buildings.js';
import { OBJECT_TYPES } from '../data/tiles.js';
import { formatCost } from '../data/resources.js';
import { biomeBonus, biomeFor } from '../systems/StructureSystem.js';
import { drawAreaCursor } from '../rendering/TileCursor.js';
import { getStructureSprite } from '../art/sprites/index.js';
import { getTileSprite } from '../art/tiles/index.js';
import { CONFIG } from '../config.js';

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

  beginStroke(tile) {
    if (this.tool === 'build' && !this.isTileBuild()) {
      const anchor = this.construction.anchorFor(this.buildType, tile.tileX, tile.tileY);
      const result = this.construction.placeSite(this.buildType, anchor.x, anchor.y);
      if (!result.ok) this.events.emit('toast', { text: result.reason, tone: 'warn', icon: 'demolish' });
      return;
    }
    if (this.tool === 'demolish') {
      const job = this.jobs.jobAt(tile.tileX, tile.tileY);
      if (job && job.type !== 'build') {
        this.jobs.cancel(job);
        return;
      }
      const result = this.construction.demolishAt(tile.tileX, tile.tileY);
      if (!result.ok) this.events.emit('toast', { text: result.reason, tone: 'warn', icon: 'demolish' });
      return;
    }
    const mode = this.tool === 'harvest' && this.jobs.jobAt(tile.tileX, tile.tileY) ? 'remove' : 'add';
    this.stroke = { mode, visited: new Set(), changed: false, failure: null };
    this.continueStroke(tile);
  }

  continueStroke(tile) {
    const key = `${tile.tileX},${tile.tileY}`;
    if (this.stroke.visited.has(key)) return;
    this.stroke.visited.add(key);

    if (this.tool === 'build') {
      const result = this.construction.paintTile(this.buildType, tile.tileX, tile.tileY);
      if (result.ok) this.stroke.changed = true;
      else if (!result.already) this.stroke.failure ??= result.reason;
    } else if (this.tool === 'harvest') {
      const job = this.jobs.jobAt(tile.tileX, tile.tileY);
      if (this.stroke.mode === 'remove' && job && job.type !== 'build') this.jobs.cancel(job);
      if (this.stroke.mode === 'add' && !job) this.jobs.designate(tile.tileX, tile.tileY);
    }
  }

  finishStroke() {
    if (!this.stroke) return;
    if (this.stroke.changed) this.world.refreshStaticData();
    if (!this.stroke.changed && this.stroke.failure) {
      this.events.emit('toast', { text: this.stroke.failure, tone: 'warn', icon: 'demolish' });
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
        return { ok: check.ok, text: check.ok ? `${def.name} · ${formatCost(def.cost)}` : check.reason };
      }
      const def = BUILDINGS[this.buildType];
      const anchor = this.construction.anchorFor(this.buildType, x, y);
      const check = this.construction.checkPlacement(this.buildType, anchor.x, anchor.y);
      // Biyom bonusu (bereketli toprakta bahçe, kayalıkta taş ocağı) kurmadan önce görünsün
      const bonus = biomeBonus(this.world.map, this.buildType, anchor.x, anchor.y);
      const biome = bonus > 0 ? ` · ${biomeFor(this.buildType).name}: verim +%${Math.round(bonus * 100)}` : '';
      return {
        ok: check.ok,
        text: check.ok ? `${def.name} · ${formatCost(def.cost)}${biome} · tıkla ve kur` : check.reason,
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
      return { ok: check.ok, text: check.reason };
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
