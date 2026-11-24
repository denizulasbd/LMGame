// (30.2) Hikâye kartlarının yöneticisi. SİMÜLASYONA DOKUNMAZ: güncelleme listesinde değildir, zar çekmez, oyun durumuna yalnızca
// isteğe bağlı oyuncu tercihlerini (state.watched, state.settings.storyCards) yazar. Olayları dinleyip kart üretir; kartları
// gerçek zamanla (StoryFeed her karede tick(dt) çağırır) ilerletir.
//   queue   : bekleyen kartlar (en çok 6; fazlası önceliği düşükten atılır -> missed)
//   visible : görünen kartlar (en çok 2; her birinin kalan süresi: 12 gerçek sn, fare üstünde / duraklatılmışken işlemez)
//   missed  : bugün kart olamayan olaylar (süzgeç ya da kuyruk dolu); 22:00 gün özetine girer
// Olaylar: bkz. data/storyCards.js (STORY_PRIORITY). Ek olarak 'time:hour' (06:00 özel gün taraması, 22:00 özet; RiteSystem'den SONRA,
// sync() içinde işlenir), 'ui:toggleWatch' { id }, 'ui:setStoryFilter' { filter }, 'ui:storyAction' { uid }, 'ui:storyGo' { uid }.
import { STORY_LIMITS as L } from '../data/storyCards.js';
import { makeCard, allows, enqueue, nextIndex, daySummary, toggleWatched, pruneWatched, filterKeyOf, actionStatus, isWatchedCard } from './StoryCards.js';
import { epitaphStory } from './LifeStory.js';
import { specialKindOf } from './Rites.js';
import { engineOn } from './Engines.js';

const EVENTS = [
  'population:died', 'rite:started', 'relationship:married', 'family:childBorn', 'trait:evolved', 'special:forgotten',
  'want:fulfilled', 'fear:realized', 'apprentice:grandmaster', 'masterwork:created', 'relationship:partnered', 'chemistry:kindred',
  'loyalty:changed', 'moodlet:mourning', 'moodlet:consoled', 'family:grownUp', 'venerable:became', 'relationship:quarrel',
  'relationship:reconciled', 'pantry:low', 'dilemma:resolved', 'storm:struck', 'crisis:raidResolved',
  'crime:caught', 'crime:unsolved', // (32.1)
  'court:verdict', 'court:exiled', 'court:revealed', 'court:stale', // (32.2)
];

export class StoryDirector {
  constructor(game, { attract = false } = {}) {
    this.game = game;
    this.events = game.events;
    this.attract = attract;
    this.queue = [];
    this.visible = [];
    this.missed = [];
    this.nextUid = 1;
    this.created = 0; // kuyruğa ya da ekrana giren kart sayısı (denetim)
    this.log = []; // { day, event, priority, text, shown }  (denetim: kuyruğa girişler; shown: kuyruğa girdi / false: süzgeç ya da kuyruk taştı)
    this.shownLog = []; // { day, event, priority, text }  (denetim: ekranda gösterilen kartlar)
    this.autoTick = false; // başsız denetim: her sync'te 1/60 gerçek saniye ilerler (4x oyunu taklit eder)
    this.stories = new Map(); // ölmek üzere olan sakin -> yaşam öyküsünün ilk cümlesi
    this.lastJournal = '';
    this.scanDay = -1;
    this.pendingHour = null;
    this.summaryDay = -1;
    this.seenSpecial = new Set();
    this.crimeCards = { day: -1, n: 0 }; // (32.1) "Yalnızca önemli" süzgecinde bugünkü suç kartı sayısı
    this.paused = false;
    this.hovered = false;
    this.unsubscribers = [];
    if (attract) return;
    const on = (name, fn) => this.unsubscribers.push(game.events.on(name, fn));
    on('journal:added', (entry) => (this.lastJournal = entry?.text ?? ''));
    on('population:dying', ({ character } = {}) => {
      if (!character) return;
      try {
        this.stories.set(character.id, epitaphStory(character, this.state));
      } catch {
        /* öykü üretilemezse kartta ölüm metni kullanılır */
      }
    });
    for (const name of EVENTS) on(name, (p) => this.onEvent(name, p ?? {}));
    on('time:hour', (hour) => (this.pendingHour = Number.isFinite(hour) ? hour : this.state.time.hour));
    on('ui:toggleWatch', ({ id } = {}) => this.toggleWatch(id));
    on('ui:setStoryFilter', ({ filter } = {}) => this.setFilter(filter));
    on('ui:storyAction', ({ uid } = {}) => this.act(uid));
    on('ui:storyGo', ({ uid } = {}) => this.go(uid));
    on('ui:storyDismiss', ({ uid } = {}) => this.dismiss(uid));
    on('population:left', () => this.pruneWatch());
    on('population:died', () => this.pruneWatch());
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get state() {
    return this.game.state;
  }

  get filter() {
    return filterKeyOf(this.state.settings?.storyCards);
  }

  get watched() {
    return (this.state.watched ??= []);
  }

  // ---------------------------------------------------------------------------------------------------------------- tercihler

  setFilter(filter) {
    const key = filterKeyOf(filter);
    this.state.settings ??= {};
    this.state.settings.storyCards = key;
    this.events.emit('story:filterChanged', key);
    if (key === 'off') {
      this.queue = [];
      this.visible = [];
    }
  }

  toggleWatch(id) {
    if (!this.state.characters.some((c) => c.id === id)) return false;
    const res = toggleWatched(this.watched, id);
    if (!res.ok) {
      this.events.emit('toast', { text: `En çok ${L.watchedMax} sakini yakından izleyebilirsin`, tone: 'warn', icon: 'star' });
      return false;
    }
    this.state.watched = res.list;
    this.events.emit('story:watchChanged', { id, on: res.on });
    return true;
  }

  pruneWatch() {
    const next = pruneWatched(this.watched, this.state);
    if (next.length !== this.watched.length) {
      this.state.watched = next;
      this.events.emit('story:watchChanged', { id: null, on: false });
    }
  }

  // ---------------------------------------------------------------------------------------------------------------- kart üretimi

  onEvent(name, p) {
    const ctx = { state: this.state, day: this.state.time.day };
    if (name === 'population:died') ctx.story = this.stories.get(p.character?.id) ?? '';
    if (name === 'trait:evolved') ctx.journal = this.lastJournal && this.lastJournal.includes(p.character?.name ?? '\0') ? this.lastJournal : '';
    if (name === 'relationship:quarrel') ctx.watchedForce = [p.a, p.b].some((c) => c && this.watched.includes(c.id));
    const card = makeCard(name, p, ctx);
    if (name === 'population:died') this.stories.delete(p.character?.id);
    if (card) this.offer(card);
  }

  /** Kartı süzgeçten geçirip kuyruğa alır; geçemeyen ya da atılan olay "missed"e (gün özeti) girer. */
  offer(card) {
    const filter = this.filter;
    if (filter === 'off') return false;
    if (!allows(card, filter, this.watched)) {
      this.missed.push(card);
      this.record(card, false);
      return false;
    }
    if (this.visible.some((c) => c.key === card.key)) return false;
    // (32.1) "Yalnızca önemli" süzgecinde günde en çok bir suç kartı; fazlası gün özetine (izlenen sakinin kartı sayılmaz)
    if (card.crime && filter === 'important' && !isWatchedCard(card, this.watched)) {
      if (this.crimeCards.day !== card.day) this.crimeCards = { day: card.day, n: 0 };
      if (this.crimeCards.n >= L.crimePerDay) {
        this.missed.push(card);
        this.record(card, false);
        return false;
      }
      this.crimeCards.n += 1;
    }
    const res = enqueue(this.queue, card);
    this.queue = res.queue;
    if (res.dropped) {
      this.missed.push(res.dropped);
      this.record(res.dropped, false);
    }
    if (res.added) this.record(card, true);
    this.promote();
    return res.added;
  }

  record(card, shown) {
    if (shown) this.created += 1;
    this.log.push({ day: card.day, event: card.event, priority: card.priority, text: card.text, shown });
    if (this.log.length > 4000) this.log.splice(0, 1000);
  }

  /** Oyun-saati işleri (06:00 özel gün taraması, 22:00 gün özeti): RiteSystem aynı saat olayında işini bitirdikten sonra. */
  sync() {
    if (this.attract) return;
    const t = this.state.time;
    if (this.pendingHour !== null) {
      const hour = this.pendingHour;
      this.pendingHour = null;
      if (hour >= L.summaryHour && this.summaryDay !== t.day) {
        this.summaryDay = t.day;
        const card = daySummary(this.missed, t.day);
        this.missed = [];
        if (card && this.filter !== 'off') {
          const res = enqueue(this.queue, card);
          this.queue = res.queue;
          if (res.added) this.record(card, true);
          this.promote();
        }
      }
    }
    if (t.hour >= L.specialStartHour && t.hour < L.summaryHour) this.scanSpecial();
    if (this.autoTick) this.tick(1 / 60, { paused: t.paused });
  }

  /** 06:00'dan sonra bugün özel günü olan sakinler için (günde bir kez) sabah kartı. */
  scanSpecial() {
    const day = this.state.time.day;
    for (const c of this.state.characters) {
      const d = c.specialDay;
      if (!d || d.day !== day || c.role) continue;
      const key = `${day}:${c.id}`;
      if (this.seenSpecial.has(key)) continue;
      this.seenSpecial.add(key);
      if (this.seenSpecial.size > 400) this.seenSpecial = new Set([...this.seenSpecial].slice(-100));
      const card = makeCard('special:morning', { character: c, kind: d.kind ?? specialKindOf(c, day) }, { state: this.state, day });
      if (card) this.offer(card);
    }
  }

  // ---------------------------------------------------------------------------------------------------------------- gerçek zaman

  /** Gerçek zaman adımı (saniye). Duraklatılmışken ya da fare kartın üstündeyken süre işlemez; boşalan yere kuyruktan kart gelir. */
  tick(dt, { paused = false, hovered = false } = {}) {
    this.paused = paused;
    this.hovered = hovered;
    if (paused) return;
    if (!hovered) {
      for (const card of this.visible) if (!card.open && !this.holds(card)) card.left -= dt;
      this.visible = this.visible.filter((c) => c.left > 0);
    }
    this.promote();
  }

  /** (30.6) Eylem düğmesi olan kart (armağan / taziye), eylem hâlâ geçerliyken ve yapılmamışken solmaz; oyuncu kapatana dek kalır. */
  holds(card) {
    if (!engineOn('novicePath') || !card.action || card.action.type === 'story' || card.action.type === 'case' || card.used) return false; // (32.2) dava kartı normal solar
    return actionStatus(this.state, card).enabled;
  }

  promote() {
    if (this.paused) return;
    while (this.visible.length < L.visible && this.queue.length) {
      const i = nextIndex(this.queue);
      const [card] = this.queue.splice(i, 1);
      card.uid = this.nextUid++;
      card.left = L.fadeSeconds;
      card.used = false;
      card.open = false;
      this.visible.push(card);
      this.shownLog.push({ day: this.state.time.day, event: card.event, priority: card.priority, text: card.text });
      if (this.shownLog.length > 4000) this.shownLog.splice(0, 1000);
      this.events.emit('story:shown', { uid: card.uid, action: Boolean(card.action && card.action.type !== 'story') });
    }
  }

  find(uid) {
    return this.visible.find((c) => c.uid === uid) ?? null;
  }

  dismiss(uid) {
    this.visible = this.visible.filter((c) => c.uid !== uid);
    this.promote();
  }

  /** "Git": sakini seçer ve kamerayı kaydırır (sakin yoksa yapıyı seçer). */
  go(uid) {
    const card = this.find(uid);
    const g = card?.go;
    if (!g) return false;
    if (g.kind === 'character') {
      if (!this.state.characters.some((c) => c.id === g.id)) return false;
      this.events.emit('ui:selectCharacter', g.id);
    } else if (g.kind === 'building') {
      if (!this.state.buildings.some((b) => b.id === g.id)) return false;
      this.events.emit('ui:selectBuilding', g.id);
    }
    return true;
  }

  /** Eylem düğmesi: armağan / taziye (bir kez), öykü (kartı açar). */
  act(uid) {
    const card = this.find(uid);
    if (!card?.action) return false;
    const a = card.action;
    if (a.type === 'story') {
      card.open = !card.open;
      return true;
    }
    const st = actionStatus(this.state, card);
    if (!st.enabled || card.used) return false;
    if (a.type === 'case') {
      this.events.emit('ui:openCase', { id: a.id }); // (32.2) dosya her basışta açılır (kart "kullanıldı" sayılmaz)
      return true;
    }
    card.used = true;
    if (a.type === 'gift') this.events.emit('ui:giftSpecialDay', { id: a.id });
    else if (a.type === 'condolence') this.events.emit('ui:condolence');
    return true;
  }
}
