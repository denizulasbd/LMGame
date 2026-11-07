// (26. aşama, 26.3) Gezgin Konuklar: Seyyar Ozan, Nadir Takasçı, Yaşlı Seyyah (Masalcı). Veriler src/data/guest.js'te, saf hesaplar
// src/systems/Guest.js'te, çizim src/rendering/GuestEffects.js'te.
//
//   Geliş    : Altın Çağ'dan sonra, 6-8 günde bir (panayır gününe yakınsa o gün) 09:00'da harita kenarından girer ('guest:arrived').
//   Kalış    : 24-48 saat; gündüz türüne göre (ozan handa / akşam meydanda, takasçı pazarda, masalcı çardakta), gece handa (yoksa çardakta)
//              dinlenir. Konuk state.characters'ta DEĞİL, world.guests'te yürür (`isGuest: true`): konut, iş gücü, nüfus ve göç etkilenmez.
//   Ozan     : 18:00 - 22:00 çalar; Ozan Ezgisi kasaba bonusu, yakındaki boştaki dinleyenlerin keyfi hızla dolar; şarkı sözleri ayrı metin katmanında.
//   Takasçı  : öğlen (günde bir, kalışta en çok 2) fazla lüks mallarla (rezervin üstündeki Kumaş / Fıçı Şerbeti) nadir eşya takas eder:
//              Antik Şema, Mermer Heykel Parçası (Kadim Yadigâr Parçası), Egzotik Tohum. Kilerdeki temel erzağa ve altına dokunmaz.
//   Masalcı  : 10:00 - 17:00 çardakta masal anlatır; dinleyen çocuk ve gençlere Bilgelik (scholarship) deneyimi, Kasaba Bilgeliği sayacı;
//              Kıdemli Bilgelerle nostaljik sohbet (ayrı metin katmanı).
//   Ayrılış  : ayrılış gününün 09:00'unda teşekkür mesajıyla harita kenarına yürür, 'guest:left'.
// Konukları Brain yönetmez; sahne akışını bu sistem yürütür (sakinlerin kararlarına, mesaiye, otopilota dokunulmaz).
// KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 34). Durum: state.activeGuest, state.guestBook (kayda girer).
// Olaylar: 'guest:arrived' { guest, def }, 'guest:barter' { offer, key, text }, 'guest:left' { guest, def }.
import { GUEST, GUEST_TYPES, BARTER_OFFERS } from '../data/guest.js';
import { ACTIVITIES } from '../data/activities.js';
import { Character } from '../entities/Character.js';
import { clamp } from '../utils/math.js';
import { arrivalDue, pickableTypes, affordableOffers } from './Guest.js';
import { levelFor } from './SkillSystem.js';

const FREE_KINDS = new Set(['social', 'leisure', 'festival']);

export class GuestSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng yalnızca bu sistemin üreteci (seed + 34)
   * @param {{ expeditions?: import('./ExpeditionSystem.js').ExpeditionSystem, attract?: boolean }} options
   */
  constructor(game, world, rng, { expeditions = null, attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.expeditions = expeditions;
    this.attract = attract;
    this.character = null; // haritadaki konuk (yalnızca çalışma anında)
    this.targetKey = null;
    this.unsubscribers = [game.events.on('time:hour', (hour) => this.onHour(hour))];
    this.restore();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.world.guests = [];
  }

  get guest() {
    return this.state.activeGuest;
  }

  get def() {
    return this.guest ? GUEST_TYPES[this.guest.type] : null;
  }

  // ---------------------------------------------------------------------------
  // Geliş, kalış, ayrılış
  // ---------------------------------------------------------------------------

  onHour(hour) {
    const day = this.state.time.day;
    if (hour === GUEST.arrivalHour) {
      if (this.guest && this.guest.departureDay <= day && !this.guest.leaving) this.sendAway();
      else if (!this.guest) this.arrive();
    }
    if (!this.guest) return;
    if (hour === GUEST.wakeHour && this.guest.resting) this.wake();
    if (hour === this.def.barterHour && this.guest.type === 'collector') this.barter();
    if (hour === this.def.playFrom && this.guest.type === 'bard') this.startBuff();
    this.route();
  }

  /** 09:00: yeni konuk. */
  arrive() {
    if (this.guest || !arrivalDue(this.state)) return false;
    const entry = this.world.findEntryTile(this.rng);
    if (!entry) return false;
    const book = this.state.guestBook;
    const type = this.rng.pick(pickableTypes(book.lastType));
    const def = GUEST_TYPES[type];
    const day = this.state.time.day;
    const point = this.world.standPoint(entry.x, entry.y);
    const stay = this.rng.int(GUEST.stayDays[0], GUEST.stayDays[1]);
    this.state.activeGuest = {
      type,
      name: this.rng.pick(def.names),
      look: this.rng.int(0, def.appearances.length - 1),
      arrivalDay: day,
      departureDay: day + stay,
      x: point.x,
      y: point.y,
      leaving: false,
      resting: false,
      barters: 0,
      lastBarterDay: null,
    };
    book.visits += 1;
    book.lastType = type;
    this.spawn();
    this.events.emit('guest:arrived', { guest: this.guest, def });
    if (!this.attract) this.events.emit('toast', { text: def.arrive.replace('{name}', this.guest.name), tone: 'success', icon: def.icon });
    this.route();
    return true;
  }

  /** Kayıttan: konuğu kaldığı yerde yeniden oluşturur (süresi dolduysa sessizce uğurlar). */
  restore() {
    const g = this.guest;
    if (!g) return;
    const { day, hour } = this.state.time;
    if (g.departureDay < day || (g.departureDay === day && hour >= GUEST.departHour && !g.leaving)) {
      this.finish(false);
      return;
    }
    this.spawn();
    if (g.resting && !(hour >= GUEST.restHour || hour < GUEST.wakeHour)) g.resting = false;
    if (this.character) this.character.visible = !g.resting;
    this.route();
  }

  spawn() {
    const g = this.guest;
    const def = GUEST_TYPES[g.type];
    // Character kurucusu görsel rastgelelik için Math.random çağırır (nefes ve balon zamanı); konuk bunu tüketmesin: değerler kendi üretecimizden verilir
    const realRandom = Math.random;
    Math.random = () => 0;
    let c;
    try {
      c = new Character({ name: g.name, age: g.type === 'storyteller' ? 68 : 38, traits: [], appearance: def.appearances[g.look], x: g.x, y: g.y, lifeStage: g.type === 'storyteller' ? 'elder' : null });
    } finally {
      Math.random = realRandom;
    }
    c.animTime = this.rng.next() * 2;
    c.bubbleCooldown = 2 + this.rng.next() * 4;
    c.role = 'guest';
    c.isGuest = true;
    c.backpack = g.type === 'collector';
    c.activityLabel = def.name;
    c.visible = !g.resting;
    this.character = c;
    this.world.guests = [c];
    this.targetKey = null;
  }

  sendAway() {
    const g = this.guest;
    if (!g || !this.character) return;
    g.leaving = true;
    g.resting = false;
    this.character.visible = true;
    this.character.activityLabel = 'Kasabadan ayrılıyor';
    this.character.speech = null;
    const exit = this.world.findEntryTile(this.rng);
    this.walkTo(exit);
    this.targetKey = 'leave';
    if (!this.character.isMoving) this.finish(true);
  }

  finish(thanks) {
    const g = this.guest;
    const def = GUEST_TYPES[g.type];
    const book = this.state.guestBook;
    const day = this.state.time.day;
    this.state.activeGuest = null;
    book.nextDay = day + this.rng.int(GUEST.intervalDays[0], GUEST.intervalDays[1]);
    this.character = null;
    this.world.guests = [];
    this.targetKey = null;
    this.events.emit('guest:left', { guest: g, def, thanks });
    if (thanks && !this.attract) this.events.emit('toast', { text: def.thanks.replace('{name}', g.name), tone: 'info', icon: def.icon });
  }

  wake() {
    const g = this.guest;
    g.resting = false;
    if (this.character) {
      this.character.visible = true;
      this.character.speech = null;
    }
    this.targetKey = null;
  }

  // ---------------------------------------------------------------------------
  // Günlük akış: nereye gideceği
  // ---------------------------------------------------------------------------

  spotOf(type) {
    const b = this.world.getCompleted(type).find((x) => !x.damaged);
    return b ? this.world.getSpots(b)[0] ?? null : null;
  }

  /** Şu saatte konuğun duracağı yer: { key, tile, rest }. */
  destination(hour) {
    const g = this.guest;
    const night = hour >= GUEST.restHour || hour < GUEST.wakeHour;
    const inn = () => this.spotOf('inn');
    const gazebo = () => this.spotOf('gazebo');
    const plaza = () => this.spotOf('fountain') ?? this.spotOf('campfire');
    if (night) {
      const tile = inn() ?? gazebo() ?? plaza();
      return { key: 'rest', tile, rest: true };
    }
    if (g.type === 'bard') {
      const tile = hour >= this.def.playFrom && hour < this.def.playTo ? plaza() ?? inn() : inn() ?? plaza();
      return { key: hour >= this.def.playFrom ? 'play' : 'inn', tile, rest: false };
    }
    if (g.type === 'collector') {
      const tile = hour < 18 ? this.spotOf('market') ?? this.spotOf('tradingPost') ?? plaza() : inn() ?? plaza();
      return { key: hour < 18 ? 'stall' : 'inn', tile, rest: false };
    }
    // Masalcı
    const tell = hour >= this.def.tellFrom && hour < this.def.tellTo;
    return { key: tell ? 'tell' : 'inn', tile: tell ? gazebo() ?? this.spotOf('academy') ?? plaza() : inn() ?? plaza(), rest: false };
  }

  route() {
    const g = this.guest;
    const c = this.character;
    if (!g || !c || g.leaving) return;
    const dest = this.destination(this.state.time.hour);
    const key = `${dest.key}:${dest.tile ? `${dest.tile.x},${dest.tile.y}` : '-'}`;
    if (key === this.targetKey) return;
    this.targetKey = key;
    this.dest = dest;
    if (!dest.tile) {
      c.clearPath();
      return;
    }
    c.visible = !g.resting;
    this.walkTo(dest.tile);
  }

  walkTo(tile) {
    const c = this.character;
    if (!tile || !c) return;
    const from = { x: c.tileX, y: c.tileY };
    const path = this.world.findPath(from, tile);
    if (path && path.length > 1) {
      c.setWaypoints(path.slice(1).map((s) => this.world.standPoint(s.x, s.y)));
      c.pose = 'walk';
    } else {
      const p = this.world.standPoint(tile.x, tile.y);
      c.x = p.x;
      c.y = p.y;
      c.clearPath();
    }
  }

  // ---------------------------------------------------------------------------
  // Etkiler
  // ---------------------------------------------------------------------------

  /** 18:00: Ozan Ezgisi bonusu (22:00'ye kadar). */
  startBuff() {
    const hours = this.def.playTo - this.state.time.hour;
    this.state.buffs[this.def.buff] = this.state.totalMinutes + hours * 60 - this.state.time.minute;
  }

  /** Öğlen: fazla lüks mallarla nadir takas. */
  barter() {
    const g = this.guest;
    if (!g || g.leaving || g.resting || g.barters >= this.def.maxBarters || g.lastBarterDay === this.state.time.day) return false;
    const offers = affordableOffers(this.state, this.def.reserve);
    g.lastBarterDay = this.state.time.day;
    if (!offers.length) {
      if (this.character?.visible) this.character.speech = { text: this.def.noBarter, at: -1, duration: GUEST.speechSeconds };
      return false;
    }
    const key = this.rng.pick(offers);
    const offer = BARTER_OFFERS[key];
    for (const [r, q] of Object.entries(offer.cost)) this.state.resources[r] -= q;
    if (this.expeditions) this.expeditions.grantFind(offer.grant, 'guest');
    g.barters += 1;
    const book = this.state.guestBook;
    book.barters += 1;
    book.rare[key] += 1;
    this.events.emit('guest:barter', { offer, key, text: offer.text });
    if (!this.attract) this.events.emit('toast', { text: `${g.name} takas yaptı: ${offer.name} (${offer.text})`, tone: 'success', icon: offer.icon });
    if (this.character?.visible) this.character.speech = { text: this.rng.pick(this.def.lines), at: -1, duration: GUEST.speechSeconds };
    return true;
  }

  /** Dinleyebilecek boştaki sakin mi? */
  isListener(c, c0) {
    if (c.away || c.isSleeping || !c.visible) return false;
    const kind = c.task ? ACTIVITIES[c.task.activity]?.kind : 'idle';
    if (!(kind === 'idle' || FREE_KINDS.has(kind))) return false;
    return Math.hypot(c.x - c0.x, c.y - c0.y) <= GUEST.listenRadius;
  }

  update(tick) {
    const g = this.guest;
    const c = this.character;
    if (!g || !c) return;
    g.x = c.x;
    g.y = c.y;
    if (c.isMoving) return;
    if (g.leaving) {
      this.finish(true);
      return;
    }
    c.pose = 'stand';
    if (this.dest?.rest) {
      if (!g.resting) {
        g.resting = true;
        c.visible = false;
      }
      return;
    }
    c.facing = 'down';
    if (!(tick.gameMinutes > 0)) return;
    const hour = this.state.time.hour;
    if (g.type === 'bard') this.performBard(c, tick.gameMinutes, hour);
    else if (g.type === 'storyteller') this.performTales(c, tick.gameMinutes, hour);
    else c.activityLabel = 'Nadide eşyalarını sergiliyor';
  }

  performBard(c, minutes, hour) {
    const def = this.def;
    const playing = hour >= def.playFrom && hour < def.playTo && this.dest?.key === 'play';
    c.activityLabel = playing ? 'Lir çalıyor' : 'Handa dinleniyor';
    c.playing = playing;
    if (!playing) return;
    for (const l of this.world.characters) {
      if (this.isListener(l, c)) l.needs.fun = clamp(l.needs.fun + def.funPerMinute * minutes, 0, 100);
    }
    if (!c.speech && this.rng.next() < def.speechPerMinute * minutes) c.speech = { text: this.rng.pick(def.lines), at: -1, duration: GUEST.speechSeconds };
  }

  performTales(c, minutes, hour) {
    const def = this.def;
    const telling = hour >= def.tellFrom && hour < def.tellTo && this.dest?.key === 'tell';
    c.activityLabel = telling ? 'Masal anlatıyor' : 'Handa dinleniyor';
    if (!telling) return;
    let kids = 0;
    let elder = null;
    for (const l of this.world.characters) {
      if (!this.isListener(l, c)) continue;
      if (l.isChild || l.lifeStage === 'youth') {
        kids++;
        const before = levelFor(l.skills.scholarship ?? 0);
        l.skills.scholarship = (l.skills.scholarship ?? 0) + def.xpPerMinute * minutes;
        const after = levelFor(l.skills.scholarship);
        if (after.level > before.level) this.events.emit('skill:levelUp', { character: l, skill: 'scholarship', level: after });
        this.state.guestBook.wisdom += def.wisdomPerMinute * minutes;
      } else if (l.isElder && !elder) elder = l;
    }
    if (!c.speech && kids > 0 && this.rng.next() < def.speechPerMinute * minutes) c.speech = { text: this.rng.pick(def.lines), at: -1, duration: GUEST.speechSeconds };
    // Kıdemli Bilgelerle nostaljik sohbet: ikisi de konuşur (ayrı metin katmanı)
    if (elder && !elder.speech && !c.speech && this.rng.next() < def.speechPerMinute * minutes) {
      elder.speech = { text: this.rng.pick(def.elderLines), at: -1, duration: GUEST.speechSeconds };
      c.speech = { text: this.rng.pick(def.elderLines), at: -1, duration: GUEST.speechSeconds };
    }
    this.state.guestBook.wisdom = Math.round(this.state.guestBook.wisdom * 1000) / 1000;
  }
}

