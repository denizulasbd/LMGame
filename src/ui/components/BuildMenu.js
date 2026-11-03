// Alt ortadaki yönetim araç çubuğu: Seç / İnşa et / Topla / Yık araçları, inşa menüsü
// (yapı küçük resimleri ve maliyetleri) ve fare altındaki duruma göre ipucu satırı.
// Araç değişikliği 'ui:setTool' olarak istenir; asıl mantık scenes/ToolController.js'te.
import { BUILD_MENU, getBuildDefinition, TILE_BUILDS } from '../../data/buildings.js';
import { TOWN_TIERS } from '../../data/town.js';
import { RESOURCES } from '../../data/resources.js';
import { getStructureSprite } from '../../art/sprites/index.js';
import { getTileSprite } from '../../art/tiles/index.js';
import { getIconDataURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

const TOOLS = [
  { tool: 'select', label: 'Seç', key: 'Esc', icon: 'select', hint: 'Sakinlere ve yapılara tıklayarak incele.' },
  { tool: 'build', label: 'İnşa Et', key: 'B', icon: 'hammer', hint: 'Bir yapı seç, haritada yerini göster ve tıkla.' },
  { tool: 'harvest', label: 'Topla', key: 'H', icon: 'axe', hint: 'Ağaç, kaya ve çalıların üzerinde sürükleyerek toplama emri ver.' },
  { tool: 'demolish', label: 'Yık', key: 'X', icon: 'demolish', hint: 'Yapıyı yık, şantiyeyi ya da toplama emrini iptal et.' },
];

const thumbnailCache = new Map();

function thumbnailURL(type) {
  if (!thumbnailCache.has(type)) {
    const sprite = TILE_BUILDS[type] ? getTileSprite(TILE_BUILDS[type].result, 0, 0) : getStructureSprite(type, {});
    thumbnailCache.set(type, sprite.toDataURL());
  }
  return thumbnailCache.get(type);
}

export class BuildMenu {
  constructor(game) {
    this.slot = 'bottom';
    this.events = game.events;
    this.tool = 'select';
    this.buildType = null;
    this.affordKey = '';

    this.toolButtons = TOOLS.map((t) => {
      const b = this.button(
        [el('img', { className: 'tool-icon', src: getIconDataURL(t.icon), alt: '' }), el('span', { text: t.label }), el('kbd', { text: t.key })],
        `${t.label} (${t.key})`,
        () => this.events.emit('ui:setTool', { tool: this.tool === t.tool && t.tool !== 'select' ? 'select' : t.tool })
      );
      b.classList.add('tool-btn');
      b.dataset.tool = t.tool;
      return b;
    });

    this.items = BUILD_MENU.map((type) => {
      const def = getBuildDefinition(type);
      const costs = Object.entries(def.cost ?? {}).map(([r, v]) =>
        el('span', { className: 'build-cost', dataset: { resource: r } }, [
          el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }),
          String(v),
        ])
      );
      const b = this.button(
        [
          el('span', { className: 'build-thumb' }, [el('img', { src: thumbnailURL(type), alt: '' })]),
          el('span', { className: 'build-name', text: def.name }),
          el('span', { className: 'build-costs' }, costs.length ? costs : [el('span', { className: 'build-cost', text: 'Ücretsiz' })]),
        ],
        `${def.name} — ${def.description}`,
        () => this.events.emit('ui:setTool', { tool: 'build', buildType: type })
      );
      b.classList.add('build-item');
      b.dataset.type = type;
      return { type, def, button: b };
    });

    this.itemRow = el('div', { className: 'build-items', hidden: true }, this.items.map((i) => i.button));
    this.hint = el('div', { className: 'build-hint' });
    this.element = el('div', { className: 'panel build-bar ui-interactive' }, [
      this.itemRow,
      el('div', { className: 'tool-row' }, this.toolButtons),
      this.hint,
    ]);

    game.events.on('tool:changed', ({ tool, buildType }) => {
      this.tool = tool;
      this.buildType = buildType;
      for (const b of this.toolButtons) b.classList.toggle('is-active', b.dataset.tool === tool);
      for (const item of this.items) item.button.classList.toggle('is-active', item.type === buildType);
      this.itemRow.hidden = tool !== 'build';
      this.setHint(TOOLS.find((t) => t.tool === tool).hint, null);
    });
    game.events.on('tool:preview', ({ ok, text }) => {
      if (this.tool === 'select') return;
      this.setHint(text || TOOLS.find((t) => t.tool === this.tool).hint, text ? ok : null);
    });
  }

  button(children, title, onClick) {
    const b = el('button', { type: 'button', title, tabIndex: -1 }, children);
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', onClick);
    return b;
  }

  setHint(text, ok) {
    this.hint.textContent = text;
    this.hint.classList.toggle('is-ok', ok === true);
    this.hint.classList.toggle('is-bad', ok === false);
  }

  /** Kaynak yetmeyen yapılar ve eksik maliyet kalemleri soluk görünür. */
  render(game) {
    if (this.itemRow.hidden) return;
    const resources = game.state.resources;
    const built = new Set(game.state.buildings.filter((b) => !b.underConstruction).map((b) => b.type));
    const tier = game.state.town?.tier ?? 1;
    const key = `${tier}|${Object.values(resources).join(',')}|${game.state.buildings.map((b) => `${b.type}${b.underConstruction ? '~' : ''}`).sort().join(',')}`;
    if (key === this.affordKey) return;
    this.affordKey = key;
    for (const { type, def, button } of this.items) {
      const cost = def.cost ?? {};
      // Önce başka bir yapı gerektiren (pazar -> kiler) kilitli görünür
      const needsOther = def.requiresBuilding && !built.has(def.requiresBuilding.type);
      const alreadyHave = def.unique && game.state.buildings.some((b) => b.type === type);
      // Kasaba seviyesiyle açılan yapılar (değirmen: Köy, belediye: Kasaba) kilit simgesiyle görünür
      const tierLocked = def.requiresTier && tier < def.requiresTier;
      const locked = needsOther || alreadyHave || tierLocked;
      button.classList.toggle('is-locked', Boolean(locked));
      button.classList.toggle('is-tier-locked', Boolean(tierLocked));
      button.dataset.tier = tierLocked ? TOWN_TIERS[def.requiresTier - 1].name : '';
      button.title = tierLocked
        ? `${def.name} — kasaba ${TOWN_TIERS[def.requiresTier - 1].name} seviyesine ulaşınca açılır. ${def.description}`
        : needsOther
        ? `${def.name} — ${def.requiresBuilding.reason}`
        : alreadyHave
          ? `${def.name} — kasabada zaten var (yalnızca bir tane olabilir)`
          : `${def.name} — ${def.description}`;
      button.classList.toggle('is-unaffordable', locked || Object.entries(cost).some(([r, v]) => resources[r] < v));
      for (const node of button.querySelectorAll('.build-cost[data-resource]')) {
        node.classList.toggle('is-missing', resources[node.dataset.resource] < cost[node.dataset.resource]);
      }
    }
  }
}
