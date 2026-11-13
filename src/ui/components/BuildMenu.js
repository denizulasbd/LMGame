// (17. aşama) Alt ortadaki birleşik araç çubuğu (dock): İnşa Et (B) / Topla (H) / Yık (X) araçları ve pencere
// düğmeleri (Hedefler, Günlük, Arşiv, Fotoğraf, Ayarlar; UIManager addDockButtons ile ekler). Aracın düğmesine
// yeniden basmak ya da Esc aracı bırakır (Seç). İnşa aracı seçiliyken dock'un üstünde yapı listesi (küçük resimler ve
// maliyetler), bir araç seçiliyken fare altındaki duruma göre kısa bir ipucu satırı belirir. Düğmelerin üzerine
// gelince kısayol ve açıklama küçük bir ipucunda (.dock-tip) görünür; ipucu pencere kenarından taşmaz.
// (30.1) Bir yapı seçilince liste, yapının adını, bedelini ve "Listeyi aç" düğmesini gösteren tek satırlık ince bir şeride iner
// (haritayı örtmesin); Esc ya da düğme listeyi geri açar ('ui:buildList'). İpucu satırı tek satırdır ve yüksekliği sabittir: metin
// uzunluğu yığının boyunu değiştirip fare altındaki haritayı örtmesin (kaçan tıklama). Kurulamama nedeni haritada çizilir.
// Araç değişikliği 'ui:setTool' olarak istenir; asıl mantık scenes/ToolController.js'te.
// (18. aşama) Yapı listesi üç sekmeye ayrılır: Yapılar, Yol & Zemin (fırçalar), Peyzaj & Dekorasyon. Sekme seçimi
// tarayıcıda hatırlanır; bir öğe seçilince (ör. kısayolla) onun sekmesine geçilir.
import { BUILD_MENU, getBuildDefinition, TILE_BUILDS, buildTabFor } from '../../data/buildings.js';
import { BUILD_TABS } from '../../data/landscape.js';
import { TOWN_TIERS } from '../../data/town.js';
import { RESOURCES } from '../../data/resources.js';
import { getStructureSprite } from '../../art/sprites/index.js';
import { getTileSprite } from '../../art/tiles/index.js';
import { getIconDataURL, getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';
import { dockButton } from '../dockButton.js';
import { EXOTIC_ITEMS } from '../../data/exploration.js';

const TOOLS = [
  { tool: 'select', label: 'Seç', key: 'Esc', icon: 'select', hint: 'Sakinlere ve yapılara tıklayarak incele.' },
  { tool: 'build', label: 'İnşa Et', key: 'B', icon: 'hammer', hint: 'Bir yapı seç, haritada yerini göster ve tıkla.', tip: 'Yapı, yol ve köprü kur' },
  { tool: 'harvest', label: 'Topla', key: 'H', icon: 'axe', hint: 'Ağaç, kaya ve çalıların üzerinde sürükleyerek toplama emri ver.', tip: 'Ağaç, kaya ve çalılara toplama emri ver' },
  { tool: 'demolish', label: 'Yık', key: 'X', icon: 'demolish', hint: 'Yapıyı yık, şantiyeyi ya da toplama emrini iptal et.', tip: 'Yapıyı yık, şantiyeyi ya da emri iptal et' },
];

const thumbnailCache = new Map();
const TAB_KEY = 'lmgame.ui.buildTab';

function readTab() {
  try {
    const saved = localStorage.getItem(TAB_KEY);
    return BUILD_TABS.some((t) => t.id === saved) ? saved : 'buildings';
  } catch {
    return 'buildings';
  }
}

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

    this.toolButtons = TOOLS.filter((t) => t.tool !== 'select').map((t) => {
      const b = dockButton({
        icon: t.icon,
        label: t.label,
        key: t.key,
        tip: `${t.tip} · yeniden basınca ya da Esc ile bırakılır`,
        onClick: () => this.events.emit('ui:setTool', { tool: this.tool === t.tool ? 'select' : t.tool }),
        className: 'tool-btn',
      });
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
      // (16. aşama) Ganimetle dikilen yapılar: bedel yerine eldeki fide / meşale sayısı
      const itemChip = def.item
        ? el('span', { className: 'build-cost build-item-count', dataset: { item: def.item } }, [el('img', { src: getAnyIconURL(EXOTIC_ITEMS[def.item].icon), alt: EXOTIC_ITEMS[def.item].name }), '0'])
        : null;
      const b = this.button(
        [
          el('span', { className: 'build-thumb' }, [el('img', { src: thumbnailURL(type), alt: '' })]),
          el('span', { className: 'build-name', text: def.name }),
          el('span', { className: 'build-costs' }, itemChip ? [itemChip] : costs.length ? costs : [el('span', { className: 'build-cost', text: 'Ücretsiz' })]),
        ],
        `${def.name} — ${def.description}`,
        () => this.events.emit('ui:setTool', { tool: 'build', buildType: type })
      );
      b.classList.add('build-item');
      b.dataset.type = type;
      b.dataset.tab = buildTabFor(type);
      return { type, def, button: b, tab: buildTabFor(type) };
    });

    // (18. aşama) Sekmeler
    this.tab = readTab();
    this.tabButtons = BUILD_TABS.map((t) => {
      const count = this.items.filter((i) => i.tab === t.id).length;
      const b = this.button(
        [el('img', { src: getIconDataURL(t.icon), alt: '' }), el('span', { className: 'build-tab-name', text: t.name }), el('span', { className: 'build-tab-count', text: String(count) })],
        t.name,
        () => this.setTab(t.id)
      );
      b.classList.add('build-tab');
      b.dataset.tab = t.id;
      return b;
    });
    this.tabRow = el('div', { className: 'build-tabs' }, this.tabButtons);
    this.itemList = el('div', { className: 'build-item-list' }, this.items.map((i) => i.button));
    this.itemRow = el('div', { className: 'panel build-items ui-interactive', hidden: true }, [this.tabRow, this.itemList]);
    this.setTab(this.tab);
    this.hint = el('div', { className: 'build-hint', hidden: true });
    // (30.1) ince yapı şeridi: seçili yapının küçük resmi, adı, bedeli, durum metni ve "Listeyi aç"
    this.stripThumb = el('img', { className: 'build-strip-thumb', alt: '' });
    this.stripName = el('span', { className: 'build-strip-name' });
    this.stripCosts = el('span', { className: 'build-costs build-strip-costs' });
    this.stripInfo = el('span', { className: 'build-strip-info' });
    this.stripOpen = this.button([el('span', { text: 'Listeyi aç' }), el('kbd', { text: 'Esc' })], 'Yapı listesini aç (Esc)', () => this.events.emit('ui:buildList', { open: true }));
    this.stripOpen.classList.add('hud-btn', 'build-strip-open');
    this.strip = el('div', { className: 'panel build-strip ui-interactive', hidden: true }, [this.stripThumb, this.stripName, this.stripCosts, this.stripInfo, this.stripOpen]);
    this.extras = el('div', { className: 'dock-group dock-windows' });
    this.bar = el('div', { className: 'panel dock build-bar ui-interactive' }, [
      el('div', { className: 'dock-group dock-tools tool-row' }, this.toolButtons),
      el('span', { className: 'dock-divider' }),
      this.extras,
    ]);
    this.element = el('div', { className: 'dock-wrap' }, [this.itemRow, this.strip, this.hint, this.bar]);
    // Dock düğmesi ipucu: kısayol ve açıklama düğmenin üstünde, ekran kenarına taşmadan (UIManager serbest katmana ekler)
    this.tipTitle = el('div', { className: 'dock-tip-title' });
    this.tipText = el('div', { className: 'dock-tip-text' });
    this.tip = el('div', { className: 'dock-tip', hidden: true }, [this.tipTitle, this.tipText]);
    this.floating = [this.tip];
    this.bar.addEventListener('mouseover', (e) => this.showTip(e.target.closest?.('.dock-btn')));
    this.bar.addEventListener('mouseleave', () => this.showTip(null));
    this.bar.addEventListener('click', () => this.showTip(null));

    game.events.on('tool:changed', ({ tool, buildType, listOpen = true }) => {
      this.tool = tool;
      this.buildType = buildType;
      for (const b of this.toolButtons) b.classList.toggle('is-active', b.dataset.tool === tool);
      for (const item of this.items) item.button.classList.toggle('is-active', item.type === buildType);
      if (tool === 'build' && buildType && buildTabFor(buildType) !== this.tab) this.setTab(buildTabFor(buildType), false);
      const stripped = tool === 'build' && Boolean(buildType) && !listOpen;
      this.itemRow.hidden = tool !== 'build' || stripped;
      this.strip.hidden = !stripped;
      this.hint.hidden = tool === 'select' || stripped;
      if (stripped) this.fillStrip(buildType);
      this.setHint(TOOLS.find((t) => t.tool === tool).hint, null);
    });
    game.events.on('tool:preview', ({ ok, text }) => {
      if (this.tool === 'select') return;
      this.setHint(text || TOOLS.find((t) => t.tool === this.tool).hint, text ? ok : null);
      if (!this.strip.hidden) {
        this.stripInfo.textContent = text ?? '';
        this.stripInfo.title = text ?? '';
        this.stripInfo.classList.toggle('is-bad', Boolean(text) && !ok);
      }
    });
  }

  /** (30.1) Şeridi seçili yapıyla doldurur (ad, küçük resim, bedel). */
  fillStrip(type) {
    const def = getBuildDefinition(type);
    const tileDef = TILE_BUILDS[type];
    const cost = (tileDef ?? def).cost ?? {};
    this.stripThumb.src = thumbnailURL(type);
    this.stripName.textContent = (tileDef ?? def).name;
    this.stripCosts.replaceChildren(
      ...(Object.keys(cost).length
        ? Object.entries(cost).map(([r, v]) => el('span', { className: 'build-cost', dataset: { resource: r } }, [el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }), String(v)]))
        : [el('span', { className: 'build-cost', text: 'Ücretsiz' })])
    );
    this.stripInfo.textContent = '';
    this.stripInfo.classList.remove('is-bad');
  }

  /** (18. aşama) Görünen sekmeyi seçer; remember: tarayıcıda hatırla. */
  setTab(id, remember = true) {
    this.tab = id;
    for (const b of this.tabButtons) b.classList.toggle('is-active', b.dataset.tab === id);
    for (const item of this.items) item.button.hidden = item.tab !== id;
    if (!remember) return;
    try {
      localStorage.setItem(TAB_KEY, id);
    } catch {
      /* depolama erişilemez */
    }
  }

  /** Düğmenin ipucunu düğmenin hemen üstünde, pencere kenarlarına sığacak biçimde gösterir (null: gizle). */
  showTip(button) {
    if (!button) {
      this.tip.hidden = true;
      this.tipFor = null;
      return;
    }
    if (button === this.tipFor && !this.tip.hidden) return;
    this.tipFor = button;
    this.tipTitle.textContent = button.dataset.tipTitle ?? '';
    this.tipText.textContent = button.dataset.tip ?? '';
    this.tipText.hidden = !button.dataset.tip;
    this.tip.hidden = false;
    const r = button.getBoundingClientRect();
    const w = this.tip.offsetWidth;
    const h = this.tip.offsetHeight;
    const x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    const y = Math.max(8, r.top - h - 10);
    this.tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  /** Pencere düğmelerini (Hedefler, Günlük, Arşiv, Fotoğraf, Ayarlar) dock'un sağ grubuna ekler. */
  addDockButtons(buttons) {
    this.extras.replaceChildren(...buttons);
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
    const items = game.state.exploration?.items ?? {};
    const royal = Boolean(game.state.crown?.statueRight);
    const key = `${tier}|${royal}|${Object.values(resources).join(',')}|${Object.values(items).join(',')}|${game.state.buildings.map((b) => `${b.type}${b.underConstruction ? '~' : ''}`).sort().join(',')}`;
    if (key === this.affordKey) return;
    this.affordKey = key;
    for (const { type, def, button } of this.items) {
      const cost = def.cost ?? {};
      // Önce başka bir yapı gerektiren (pazar -> kiler) kilitli görünür
      const needsOther = def.requiresBuilding && !built.has(def.requiresBuilding.type);
      const alreadyHave = def.unique && game.state.buildings.some((b) => b.type === type);
      // Kasaba seviyesiyle açılan yapılar (değirmen: Köy, belediye: Kasaba) kilit simgesiyle görünür
      const tierLocked = def.requiresTier && tier < def.requiresTier;
      const noItem = def.item && (items[def.item] ?? 0) < 1;
      const noRight = def.requiresRoyalRight && !royal; // (22. aşama) Kraliyet Beratı
      const locked = needsOther || alreadyHave || tierLocked || noItem || noRight;
      const chip = button.querySelector('.build-item-count');
      if (chip) {
        chip.lastChild.textContent = `${items[def.item] ?? 0}`;
        chip.classList.toggle('is-missing', Boolean(noItem));
      }
      button.classList.toggle('is-locked', Boolean(locked));
      button.classList.toggle('is-tier-locked', Boolean(tierLocked));
      button.dataset.tier = tierLocked ? TOWN_TIERS[def.requiresTier - 1].name : '';
      button.title = tierLocked
        ? `${def.name} — kasaba ${TOWN_TIERS[def.requiresTier - 1].name} seviyesine ulaşınca açılır · ${def.description}`
        : needsOther
        ? `${def.name} — ${def.requiresBuilding.reason}`
        : alreadyHave
          ? `${def.name} — kasabada zaten var (yalnızca bir tane olabilir)`
          : noItem
            ? `${def.name} — önce bir keşif seferinden ${EXOTIC_ITEMS[def.item].name} getirilmeli · ${def.description}`
            : noRight
              ? `${def.name} — bir Kraliyet Fermanı'nın ödülü olarak Kraliyet Beratı alınınca açılır · ${def.description}`
              : `${def.name} — ${def.description}`;
      button.classList.toggle('is-unaffordable', locked || Object.entries(cost).some(([r, v]) => resources[r] < v));
      for (const node of button.querySelectorAll('.build-cost[data-resource]')) {
        node.classList.toggle('is-missing', resources[node.dataset.resource] < cost[node.dataset.resource]);
      }
    }
  }
}
