// HTML tabanlı arayüz bileşenlerini yönetir. Her bileşen kendi DOM'unu oluşturur
// (`element`), nerede duracağını `slot` ile söyler ve gerekiyorsa her karede render(game) ile güncellenir.
// Bileşenler oyun durumunu yalnızca okur; değişiklik isteklerini olay olarak yayınlar.
//
// Yerleşim (17. aşama, ferah arayüz):
//   top     : ekranın en üstünde ince, yarı saydam tek satırlık bilgi çubuğu (kasaba · zaman ve hız · kaynaklar)
//   toasts  : üst çubuğun hemen altında ortada beliren bildirimler
//   drawer  : sağ üstte açılıp kapanan "Kasaba Sakinleri" çekmecesi (kapalıyken yalnızca ince bir sekme)
//   cards   : sağ altta bağımsız bilgi kartı (sakin, yapı, takas); çekmeceyle aynı sütunda, üst üste binmez
//   bottom  : alt ortada birleşik araç çubuğu (dock): araçlar ve pencere düğmeleri
//   modal   : ekranın ortasında açılan pencereler (Günlük, Hedefler, Arşiv, Ayarlar); bkz. ModalHost
//   left    : (30.2) sol altta dock'un üstünde: Duygu Katmanı açıklaması, hikâye kartları, rehber kartı
//   free    : kendi konumunu CSS ile belirleyenler (karar penceresi, kutlama, başlangıç ekranı, harita ipucu)
// Dock'un yüksekliği ölçülüp --ui-bottom-reserve olarak verilir; sağ sütun ve pencereler onun üstünde biter.
import { el } from './dom.js';
import { ModalHost } from './ModalHost.js';
import { Hud } from './components/Hud.js';
import { ResidentList } from './components/ResidentList.js';
import { CharacterPanel } from './components/CharacterPanel.js';
import { GuestPanel } from './components/GuestPanel.js';
import { BuildingPanel } from './components/BuildingPanel.js';
import { BuildMenu } from './components/BuildMenu.js';
import { Toasts } from './components/Toasts.js';
import { TownJournal } from './components/TownJournal.js';
import { TradePanel } from './components/TradePanel.js';
import { MilestonePanel } from './components/MilestonePanel.js';
import { CelebrationModal } from './components/CelebrationModal.js';
import { TitleMenu } from './components/TitleMenu.js';
import { DilemmaModal } from './components/DilemmaModal.js';
import { StatsPanel } from './components/StatsPanel.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { CrisisModal } from './components/CrisisModal.js';
import { MapTooltip } from './components/MapTooltip.js';
import { ParcelCard } from './components/ParcelCard.js'; // (34.2)
import { GuideCard } from './components/GuideCard.js';
import { ScrollArrows } from './components/ScrollArrows.js';
import { StoryFeed } from './components/StoryFeed.js';
import { HoverTip } from './components/HoverTip.js';
import { CaseModal } from './components/CaseModal.js'; // (32.2)
import { RoyalLetter } from './components/renownCards.js'; // (32.3)

const BOTTOM_GAP = 10; // dock ile pencere kenarı / sağ sütun arasındaki boşluk (piksel)

export class UIManager {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.slots = {
      top: el('div', { className: 'ui-topbar' }),
      toasts: el('div', { className: 'ui-top' }),
      drawer: el('div', { className: 'ui-drawer' }),
      cards: el('div', { className: 'ui-cards' }),
      bottom: el('div', { className: 'ui-bottom' }),
      left: el('div', { className: 'ui-left' }), // (30.2) sol alt sütun: Duygu Katmanı açıklaması, hikâye kartları, rehber kartı
      free: root,
    };
    const right = el('div', { className: 'ui-right' }, [this.slots.drawer, this.slots.cards]);
    root.append(this.slots.top, this.slots.toasts, right, this.slots.bottom, this.slots.left);
    this.modals = new ModalHost(root, game);

    this.dock = new BuildMenu(game);
    this.hoverTip = new HoverTip(); // (30.3) özel ipucu (üst çubuk, Nabız, sayaçlar, vergi düğmeleri)
    this.components = [
      this.hoverTip,
      new Hud(game),
      new TradePanel(game),
      new ResidentList(game),
      new CharacterPanel(game),
      new GuestPanel(game), // (27.3) gezgin konuk kartı
      new BuildingPanel(game),
      this.dock,
      new Toasts(game),
      new MilestonePanel(game),
      new TownJournal(game),
      new StatsPanel(game),
      new SettingsPanel(game),
      new CaseModal(game), // (32.2) dava dosyası (oyunu durdurmaz)
      new RoyalLetter(game), // (32.3) Kraliyet Lütufnamesi (oyunu durdurmaz)
      new CrisisModal(game),
      new CelebrationModal(game),
      new DilemmaModal(game),
      new TitleMenu(game),
      new MapTooltip(game),
      new ParcelCard(game), // (34.2) kilitli toprağa tıklayınca parsel kartı
      new StoryFeed(game), // (30.2)
      new GuideCard(game), // (30.1)
      new ScrollArrows(game), // (Erişilebilirlik) kayan panellerin yanında ▲ / ▼ düğmeleri; Ayarlar'dan açılır
    ];
    for (const component of this.components) {
      if (component.element) (this.slots[component.slot] ?? root).appendChild(component.element);
      // Ekrana göre konumlanan yardımcı öğeler (ör. dock ipucu) dönüşümlü kapların dışında, serbest katmanda durur
      for (const extra of component.floating ?? []) root.appendChild(extra);
      // Ortadaki pencereler ModalHost'a kaydolur; düğmeleri dock'a eklenir
      if (component.modal) {
        this.modals.register(component.modal.id, component.modal.element, () => component.setOpen(false));
        component.modalHost = this.modals;
      }
    }
    // Dock sırası: Hedefler, Günlük, Arşiv, Fotoğraf, Ayarlar (bileşenlerin listedeki sırası)
    this.dock.addDockButtons(this.components.flatMap((c) => c.dockButtons ?? []));
    this.observeBottomReserve();
    this.setupCinematic();
  }

  /**
   * (13. aşama) Fotoğraf / sinematik mod (F ya da Fotoğraf düğmesi): bütün arayüz yumuşakça gizlenir, yalnızca sağ
   * altta küçük bir "Arayüzü Göster (F)" ipucu kalır. Karar penceresi ya da kutlama açılınca mod kendiliğinden biter.
   * Sahne 'ui:setCinematic' ile haber alır (imleç ve seçim çizilmez).
   */
  setupCinematic() {
    const events = this.game.events;
    this.cinematic = false;
    const hint = el('button', { className: 'hud-btn cinematic-hint ui-interactive', type: 'button', tabIndex: -1, title: 'Arayüzü yeniden göster' }, [
      el('span', { text: 'Arayüzü Göster' }),
      el('kbd', { text: 'F' }),
    ]);
    hint.addEventListener('mousedown', (e) => e.preventDefault());
    hint.addEventListener('click', () => this.setCinematic(false));
    this.root.appendChild(hint);
    events.on('ui:toggleCinematic', () => this.setCinematic(!this.cinematic));
    // (30.6) Fotoğraf modundan F ve Esc HER durumda çıkar: odak bir metin kutusunda kalsa bile (Input yazarken tuşları yok sayar)
    window.addEventListener('keydown', (e) => {
      if (!this.cinematic || e.repeat) return;
      const typing = e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable);
      if (!typing || (e.code !== 'KeyF' && e.key !== 'Escape')) return;
      e.preventDefault();
      e.target.blur();
      this.setCinematic(false);
    }, true);
    for (const name of ['dilemma:opened', 'town:tierUp', 'town:legendary', 'wonder:completed', 'title:show']) {
      events.on(name, () => this.setCinematic(false));
    }
  }

  setCinematic(on) {
    if (on && this.root.classList.contains('is-title')) return; // başlangıç ekranında olmaz
    if (on === this.cinematic) return;
    if (on) this.modals.closeCurrent(); // fotoğrafa açık pencere girmesin
    this.cinematic = on;
    if (on && document.activeElement instanceof HTMLElement) document.activeElement.blur(); // (30.6) odak gizli bir kutuda kalıp F'yi yutmasın
    this.root.classList.toggle('is-cinematic', on);
    this.game.events.emit('ui:setCinematic', on);
  }

  /** Dock büyüyüp küçüldükçe (ör. yapı listesi açılınca) sağ sütunun ve pencerelerin alt sınırını günceller. */
  observeBottomReserve() {
    const update = () => {
      const height = this.slots.bottom.offsetHeight;
      this.root.style.setProperty('--ui-bottom-reserve', `${height + BOTTOM_GAP * 2}px`);
      const top = this.slots.top.offsetHeight;
      this.root.style.setProperty('--ui-top-reserve', `${top + BOTTOM_GAP * 2}px`);
      // Dock sağ sütunun altına uzanmıyorsa kart pencerenin dibine kadar iner (geniş ekran)
      const dock = this.slots.bottom.getBoundingClientRect();
      const column = this.root.querySelector('.ui-right')?.getBoundingClientRect();
      this.root.classList.toggle('has-free-corner', Boolean(column) && dock.right + BOTTOM_GAP <= column.left);
    };
    update();
    window.addEventListener('resize', update);
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(update);
      observer.observe(this.slots.bottom);
      observer.observe(this.slots.top);
    }
  }

  render() {
    // Yalnızca olaylarla güncellenen bileşenlerin (ör. bildirimler) render'ı yoktur
    for (const component of this.components) component.render?.(this.game);
  }
}
