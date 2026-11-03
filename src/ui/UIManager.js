// HTML tabanlı arayüz bileşenlerini yönetir. Her bileşen kendi DOM'unu oluşturur
// (`element`), nerede duracağını `slot` ile söyler ve gerekiyorsa her karede render(game) ile güncellenir.
// Bileşenler oyun durumunu yalnızca okur; değişiklik isteklerini olay olarak yayınlar.
//
// Yerleşim: sol sütun (HUD, günlük, hedefler, ipuçları), sağ sütun (sakin listesi + paneller), üst orta
// (bildirimler), alt orta (inşa araç çubuğu), serbest (kendi konumunu CSS ile belirleyen, ör. pencereler).
// İki sütun aynı esnek kapsayıcıdadır (.ui-sidebars): pencere daralınca küçülür, çok darda alt alta
// dizilir ve her sütun kendi içinde kayar; böylece paneller hiçbir genişlikte üst üste binmez. Alttaki
// inşa çubuğunun yüksekliği ölçülüp --ui-bottom-reserve olarak verilir; sütunlar onun üstünde biter.
import { el } from './dom.js';
import { Hud } from './components/Hud.js';
import { ControlsHint } from './components/ControlsHint.js';
import { ResidentList } from './components/ResidentList.js';
import { CharacterPanel } from './components/CharacterPanel.js';
import { BuildingPanel } from './components/BuildingPanel.js';
import { BuildMenu } from './components/BuildMenu.js';
import { Toasts } from './components/Toasts.js';
import { TownJournal } from './components/TownJournal.js';
import { TradePanel } from './components/TradePanel.js';
import { MilestonePanel } from './components/MilestonePanel.js';
import { CelebrationModal } from './components/CelebrationModal.js';
import { TitleMenu } from './components/TitleMenu.js';

const BOTTOM_GAP = 12; // inşa çubuğu ile pencere kenarı / sütunlar arasındaki boşluk (piksel)

export class UIManager {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.slots = {
      left: el('div', { className: 'ui-column ui-column-left' }),
      right: el('div', { className: 'ui-column ui-column-right' }),
      top: el('div', { className: 'ui-top' }),
      bottom: el('div', { className: 'ui-bottom' }),
      free: root,
    };
    const sidebars = el('div', { className: 'ui-sidebars' }, [this.slots.left, this.slots.right]);
    root.append(sidebars, this.slots.top, this.slots.bottom);
    this.observeBottomReserve();

    this.components = [
      new Hud(game),
      new ControlsHint(game),
      new TradePanel(game), // sağ sütunun en üstünde: açılınca hemen görünsün
      new ResidentList(game),
      new CharacterPanel(game),
      new BuildingPanel(game),
      new BuildMenu(game),
      new Toasts(game),
      new TownJournal(game),
      new MilestonePanel(game),
      new CelebrationModal(game),
      new TitleMenu(game),
    ];
    for (const component of this.components) {
      (this.slots[component.slot] ?? root).appendChild(component.element);
    }
  }

  /** İnşa çubuğu büyüyüp küçüldükçe (ör. yapı listesi açılınca) sütunların alt sınırını günceller. */
  observeBottomReserve() {
    const update = () => {
      const height = this.slots.bottom.offsetHeight;
      this.root.style.setProperty('--ui-bottom-reserve', `${height + BOTTOM_GAP * 2}px`);
    };
    update();
    if (typeof ResizeObserver === 'function') new ResizeObserver(update).observe(this.slots.bottom);
  }

  render() {
    // Yalnızca olaylarla güncellenen bileşenlerin (ör. bildirimler) render'ı yoktur
    for (const component of this.components) component.render?.(this.game);
  }
}
