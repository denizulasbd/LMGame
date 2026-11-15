// Sağ üstteki "Kasaba Sakinleri" çekmecesi: herkesin portresi (çocuk, paltolu, çantalı, meslek kıyafetli), adı ve şu an
// ne yaptığı. Bir satıra tıklamak o karakteri seçer (karakter kartı açılır, kamera ona kayar).
// (17. aşama) Başlıktaki ▸ düğmesi çekmeceyi sağa doğru kapatır; kapalıyken kenarda yalnızca ince bir sekme kalır
// (kişi simgesi ve sakin sayısı), tıklanınca çekmece sağdan kayarak açılır. Tercih tarayıcıda hatırlanır.
// (Eski hata: listenin CSS'teki display: flex kuralı [hidden] özniteliğini eziyordu; düğme çalışmıyor gibi görünüyordu.)
import { getCharacterPortraitURL, lookKey } from '../../art/sprites/index.js';
import { NEED_KEYS } from '../../data/characters.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';
import { moodMarkOf, markIconURL, MOOD_MARKS } from '../../rendering/ExpressionLayer.js';
import { WANTS } from '../../data/wants.js';
import { wantName } from '../../systems/Wants.js';

// (29.8) çekmecedeki ruh hali işareti: Duygu Katmanı ile AYNI simge (30.2: ExpressionLayer.markIconURL) ve özel gün simgesi
const MARK_CLASS = { cloud: 'is-trauma', sparkle: 'is-positive', sweat: 'is-negative' };

const COLLAPSED_KEY = 'lmgame.ui.residentsCollapsed';

const DRAWER_CLOSE_MS = 180; // kapanma animasyonunun süresi (CSS drawer-out ile aynı)

// Telefon genişliğinde (tercih kaydedilmemişse) çekmece kapalı başlar; oyun alanı kapanmasın
const NARROW_SCREEN = 620;

function readCollapsed() {
  const narrow = typeof window !== 'undefined' && window.innerWidth <= NARROW_SCREEN;
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored === null ? narrow : stored === '1';
  } catch {
    return narrow;
  }
}

function writeCollapsed(collapsed) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    /* depolama erişilemez: tercih yalnızca bu oturumda geçerli */
  }
}

/** İhtiyaçların en düşüğüne göre ruh hâli: iyi / idare eder / kötü. */
function moodClass(character) {
  const lowest = Math.min(...NEED_KEYS.map((k) => character.needs[k]));
  if (lowest < 25) return 'is-bad';
  if (lowest < 50) return 'is-warn';
  return 'is-ok';
}

export class ResidentList {
  constructor(game) {
    this.slot = 'drawer';
    this.collapsed = false;
    this.selectedId = null;
    this.rows = new Map(); // karakter kimliği -> { row, status, mood }
    this.rosterKey = '';

    this.title = el('span', { className: 'resident-title' });
    // (30.2) "?" ipucu: satır simgelerinin anlamı
    const legendRow = (src, text) => el('div', {}, [el('img', { src, alt: '' }), el('span', { text })]);
    this.helpTip = el('div', { className: 'panel resident-help-tip ui-interactive', hidden: true }, [
      ...Object.entries(MOOD_MARKS).map(([key, def]) => legendRow(markIconURL(key), def.name)),
      legendRow(getAnyIconURL('star'), 'Yakından izleniyor (satırdaki yıldızla aç / kapat)'),
      legendRow(getAnyIconURL('flower'), 'Bugün özel günü'),
      legendRow(getAnyIconURL('sparkle'), 'Açık bir dileği var (simge dileğin türünü gösterir)'),
    ]);
    this.helpButton = el('button', { className: 'hud-btn resident-help-btn', type: 'button', text: '?', title: 'Simgeler ne demek?', tabIndex: -1 });
    this.helpButton.addEventListener('mousedown', (e) => e.preventDefault());
    this.helpButton.addEventListener('click', () => (this.helpTip.hidden = !this.helpTip.hidden));
    this.helpWrap = el('span', { className: 'resident-help' }, [this.helpButton, this.helpTip]);
    this.toggle = el('button', { className: 'hud-btn resident-toggle', type: 'button', text: '▸', title: 'Listeyi gizle', tabIndex: -1 });
    this.toggle.setAttribute('aria-label', 'Sakinler listesini gizle');
    this.toggle.addEventListener('mousedown', (e) => e.preventDefault());
    this.toggle.addEventListener('click', () => this.setCollapsed(true));
    this.list = el('div', { className: 'resident-list' });
    this.panel = el('div', { className: 'panel residents ui-interactive' }, [
      el('div', { className: 'resident-header' }, [el('img', { className: 'resident-title-icon', src: getAnyIconURL('people'), alt: '' }), this.title, this.helpWrap, this.toggle]),
      this.list,
    ]);
    // Kapalıyken kalan ince sekme
    this.tabCount = el('span', { className: 'resident-tab-count' });
    this.tab = el('button', { className: 'hud-btn resident-tab ui-interactive', type: 'button', title: 'Kasaba Sakinleri listesini aç', tabIndex: -1 }, [
      el('img', { src: getAnyIconURL('people'), alt: '' }),
      this.tabCount,
      el('span', { className: 'resident-tab-caret', text: '◂' }),
    ]);
    this.tab.setAttribute('aria-label', 'Sakinler listesini aç');
    this.tab.addEventListener('mousedown', (e) => e.preventDefault());
    this.tab.addEventListener('click', () => this.setCollapsed(false));
    this.element = el('div', { className: 'resident-drawer' }, [this.tab, this.panel]);
    this.setCollapsed(readCollapsed(), false);

    this.events = game.events;
    game.events.on('character:selected', (id) => {
      this.selectedId = id;
      for (const [rowId, { row }] of this.rows) row.classList.toggle('is-selected', rowId === id);
    });
  }

  setCollapsed(collapsed, remember = true) {
    const changed = collapsed !== this.collapsed;
    this.collapsed = collapsed;
    clearTimeout(this.closeTimer);
    this.element.classList.toggle('is-collapsed', collapsed);
    this.panel.setAttribute('aria-hidden', String(collapsed));
    this.tab.hidden = !collapsed;
    this.panel.classList.remove('is-opening', 'is-closing');
    if (collapsed) {
      // Sağa doğru kayarak kapanır, ardından tamamen gizlenir (ekran dışında görünmez bir panel kalmaz)
      if (changed && this.panel.offsetParent !== null) {
        void this.panel.offsetWidth;
        this.panel.classList.add('is-closing');
        this.closeTimer = setTimeout(() => (this.panel.hidden = true), DRAWER_CLOSE_MS);
      } else {
        this.panel.hidden = true;
      }
    } else {
      this.panel.hidden = false;
      // Açılırken sağdan kayarak gelir (animasyon her açılışta yeniden başlar)
      if (changed) {
        void this.panel.offsetWidth;
        this.panel.classList.add('is-opening');
      }
    }
    if (remember) writeCollapsed(collapsed);
    if (!collapsed) this.rosterKey = ''; // kapalıyken güncellenmeyen satırlar yenilensin
  }

  rebuild(characters, watched = []) {
    this.list.replaceChildren();
    this.rows.clear();
    // (30.2) izlenenler en üstte (kendi aralarında izleme sırasıyla), ötekiler listedeki sırada
    const ordered = [...watched.map((id) => characters.find((c) => c.id === id)).filter(Boolean), ...characters.filter((c) => !watched.includes(c.id))];
    for (const c of ordered) {
      const status = el('span', { className: 'resident-status' });
      const mood = el('span', { className: 'status-dot resident-mood' });
      const mark = el('img', { className: 'resident-mark resident-mood-mark', alt: '', hidden: true });
      const isWatched = watched.includes(c.id);
      const watchBtn = el('span', { className: 'resident-watch', role: 'button', title: isWatched ? 'Yakından izlemeyi bırak' : 'Yakından izle (en çok 3 sakin)' }, [el('img', { src: getAnyIconURL('star'), alt: 'Yakından izle' })]);
      watchBtn.addEventListener('mousedown', (e) => e.preventDefault());
      watchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.events.emit('ui:toggleWatch', { id: c.id });
      });
      const wish = el('img', { className: 'resident-wish', alt: '', hidden: true });
      const special = el('img', { className: 'resident-mark resident-special', src: getAnyIconURL('flower'), alt: '', title: 'Bugün onun özel günü', hidden: true });
      const row = el('button', { className: 'resident-row', type: 'button', tabIndex: -1 }, [
        el('img', { className: `resident-portrait${c.isChild ? ' is-child' : ''}`, src: getCharacterPortraitURL(c.appearance, c.look), alt: '' }),
        el('span', { className: 'resident-text' }, [el('span', { className: 'resident-name', text: c.name }), status]),
        watchBtn,
        wish,
        special,
        mark,
        mood,
      ]);
      row.classList.toggle('is-watched', isWatched);
      row.addEventListener('mousedown', (e) => e.preventDefault());
      row.addEventListener('click', () => this.events.emit('ui:selectCharacter', c.id));
      row.classList.toggle('is-selected', c.id === this.selectedId);
      this.list.append(row);
      this.rows.set(c.id, { row, status, mood, mark, special, wish, lastStatus: '', lastMood: '', lastMark: undefined, lastSpecial: undefined, lastWish: undefined });
    }
  }

  render(game) {
    const characters = game.state.characters;
    const watched = game.state.watched ?? [];
    const rosterKey = `${watched.join('.')}|${characters.map((c) => `${c.id}:${lookKey(c.look)}`).join(',')}`;
    if (rosterKey !== this.rosterKey) {
      this.rosterKey = rosterKey;
      this.title.textContent = `Kasaba Sakinleri (${characters.length})`;
      this.tabCount.textContent = String(characters.length);
      this.rebuild(characters, watched);
    }
    if (this.collapsed) return;

    for (const c of characters) {
      const entry = this.rows.get(c.id);
      if (entry.lastStatus !== c.activityLabel) {
        entry.lastStatus = c.activityLabel;
        entry.status.textContent = c.activityLabel;
      }
      // (29.8) ruh hali işareti ve özel gün simgesi (yalnızca değişince yazılır)
      // (29.10) dengeli ruh halinde işaret gösterilmez (moodMarkOf zaten null döner; açıkça da denetlenir)
      const markKey = c.mood?.feel === 'Dengeli' ? null : moodMarkOf(c);
      if (entry.lastMark !== markKey) {
        entry.lastMark = markKey;
        entry.mark.hidden = !markKey;
        if (markKey) {
          entry.mark.src = markIconURL(markKey);
          entry.mark.className = `resident-mark resident-mood-mark ${MARK_CLASS[markKey]}`;
          entry.mark.dataset.mark = markKey;
          entry.mark.title = `Ruh hali: ${MOOD_MARKS[markKey].name}`;
          entry.mark.alt = entry.mark.title;
        }
      }
      // (30.2) açık dileği olan sakinde dilek simgesi (dileğin kendi simgesi)
      const want = c.wants?.length ? c.wants[0] : null;
      const wishKey = want ? want.key : null;
      if (entry.lastWish !== wishKey) {
        entry.lastWish = wishKey;
        const def = want ? WANTS[want.key] : null;
        entry.wish.hidden = !def;
        if (def) {
          entry.wish.src = getAnyIconURL(def.icon);
          entry.wish.title = entry.wish.alt = `Dileği: ${wantName('want', want)}`;
        }
      }
      const special = c.specialDay && c.specialDay.day === game.state.time.day ? c.specialDay.kind ?? 'birthday' : false;
      if (entry.lastSpecial !== special) {
        entry.lastSpecial = special;
        entry.special.hidden = !special;
        // (29.10) özel gün işaretinin açıklaması türüne göre
        if (special) entry.special.title = entry.special.alt = special === 'anniversary' ? 'Özel gün: bugün evlilik yıl dönümü' : 'Özel gün: bugün doğum günü';
      }
      const mood = moodClass(c);
      if (entry.lastMood !== mood) {
        entry.lastMood = mood;
        entry.mood.className = `status-dot resident-mood ${mood}`;
      }
    }
  }
}
