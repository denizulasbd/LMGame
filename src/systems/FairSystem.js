// (26. aşama, 26.1) Mevsimlik panayırlar. Kurallar src/data/fair.js'te, saf yardımcılar src/systems/Fair.js'te.
//
//   06:00 'prep'  : mevsimin son günü (Altın Çağ'dan sonra) panayır kurulur: meydan havuzunun çevresine tentler ve flamalar
//                   çizilir. Kasaba Günlüğü ve üst bildirim: "Meydanda ... başladı! Bu akşam herkes meydanda toplanıyor."
//                   Sakinler normal işine gider; hiçbir davranışa, üretime ya da otopilota dokunulmaz.
//   18:00 'party' : şenlik saati. Kasabanın şenlik kuralları (state.events.festival, tema yok) 22:00'ye kadar başlar:
//                   iş çıkışı herkes meydanda toplanır ('festival:started' { venue, festival, fair: true }). Meydandakilere
//                   Panayır Coşkusu (keyif + sosyallik), "Şenlik Neşesi" huylu 2. kuşak dansçılar yanındakilere fazladan neşe
//                   yayar, Kıdemli Bilgeler nostalji sözleri söyler (c.speech: 25.2'deki AYRI metin katmanı; ikon balonuna ve
//                   balon zarına dokunulmaz).
//   22:00         : kapanış; süsler kalkar, anılar yazılır, ilk panayır Tarihçe Kütüğü'ne düşer ('fair:ended').
//
// Bu sistem KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 32): yalnızca söz seçimi ve konuşma sıklığı.
// Ana üretece ve Math.random'a dokunmaz. Durum: state.currentFestival (kayda girer), state.chronicle.firstFair, stats.fairs.
// Olaylar: 'fair:prep' { fair, type }, 'fair:ended' { fair, type, attendees, first }, 'fair:cancelled' { fair, type } (27.1: yer
// yıkıldı / hasarlı, şenlik başlamadı; FeastSystem sofrayı kilere iade eder), ayrıca 'festival:started' { fair: true }.
// (27.1) Katılımcılar currentFestival.participants'ta da tutulur: şenlik ortasında kayıt -> yükleme kapanış sayımını ve anıları korur.
import { FAIR, FAIRS, ELDER_LINES, FESTIVE_DANCER_LINES } from '../data/fair.js';
import { SEASON_FESTIVAL } from '../data/festivals.js';
import { SEASON_FESTIVALS } from '../data/festivals.js';
import { TOWN_BUFFS } from '../data/town.js';
import { getSeason } from '../data/seasons.js';
import { clamp } from '../utils/math.js';
import { addMemory } from './MemorySystem.js';
import { isFairDay, fairOpen, fairVenue } from './Fair.js';

export class FairSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng yalnızca bu sistemin üreteci (seed + 32)
   */
  constructor(game, world, rng, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.attract = attract;
    this.attendees = new Set();
    this.unsubscribers = [game.events.on('time:hour', (hour) => this.onHour(hour))];
    this.reconcile();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get cf() {
    return this.state.currentFestival;
  }

  /** Kayıttan: bugüne ait olmayan ya da saati geçmiş panayır temizlenir; evre saate göre ayarlanır. */
  reconcile() {
    const cf = this.cf;
    if (!cf) return;
    const { day, hour } = this.state.time;
    if (cf.day !== day || hour >= FAIR.endHour || hour < FAIR.prepHour || !FAIRS[cf.type]) {
      this.state.currentFestival = null;
      return;
    }
    cf.phase = hour >= FAIR.partyHour ? 'party' : 'prep';
    if (!Array.isArray(cf.participants)) cf.participants = [];
    this.attendees = new Set(cf.participants);
  }

  /** Gün atlanmış ya da 22:00 kaçırılmışsa (zaman sıçraması, kayıt) başka güne ait panayır kalıntısı yeni panayırı engellemesin. */
  dropStale() {
    const cf = this.cf;
    if (cf && cf.day !== this.state.time.day) {
      this.state.currentFestival = null;
      this.attendees.clear();
    }
  }

  onHour(hour) {
    this.dropStale();
    if (hour === FAIR.prepHour) this.prepare();
    else if (hour === FAIR.partyHour) this.beginParty();
    else if (hour === FAIR.endHour) this.close();
  }

  /** 06:00: panayırı kur (Altın Çağ'dan sonra, mevsimin son günü, yer varsa). */
  prepare() {
    const day = this.state.time.day;
    if (this.cf || !fairOpen(this.state) || !isFairDay(day)) return false;
    if (this.state.characters.length < FAIR.minPopulation || !fairVenue(this.world)) return false;
    const type = getSeason(day).key;
    const fair = FAIRS[type];
    this.state.currentFestival = { type, day, phase: 'prep', participants: [] };
    this.attendees.clear();
    this.events.emit('fair:prep', { fair, type });
    if (!this.attract) this.events.emit('toast', { text: fair.start, tone: 'success', icon: fair.icon });
    return true;
  }

  /** 18:00: şenlik saati; sakinler iş çıkışı meydana toplanır. */
  beginParty() {
    const cf = this.cf;
    if (!cf || cf.phase !== 'prep' || cf.day !== this.state.time.day) return false;
    const fair = FAIRS[cf.type];
    const venue = fairVenue(this.world);
    if (!venue) {
      // (27.1) Meydan yıkıldı / hasarlı: panayır iptal; sofraya ayrılan erzak 'fair:cancelled' ile kilere döner
      this.state.currentFestival = null;
      this.attendees.clear();
      this.events.emit('fair:cancelled', { fair, type: cf.type });
      return false;
    }
    cf.phase = 'party';
    const f = this.state.events.festival;
    const endsAt = this.state.totalMinutes + (FAIR.endHour - this.state.time.hour) * 60 - this.state.time.minute;
    if (!f.active) {
      Object.assign(f, { active: true, venueId: venue.id, lastDay: this.state.time.day, endsAt, theme: FAIR.theme });
      this.state.buffs[FAIR.buff] = endsAt;
      this.events.emit('festival:started', { venue, theme: FAIR.theme, festival: fair, fair: true });
    }
    if (!this.attract) this.events.emit('toast', { text: fair.party, tone: 'success', icon: fair.icon });
    return true;
  }

  /** 22:00: kapanış. Süsler kalkar (harita hiç değişmedi); katılanlar anılarına yazar. */
  close() {
    const cf = this.cf;
    if (!cf) return false;
    const fair = FAIRS[cf.type];
    const held = cf.phase === 'party';
    const attendees = [...this.attendees];
    this.attendees.clear();
    this.state.currentFestival = null;
    if (!held) return false; // şenlik saatine gelemeden gün bitti
    this.state.stats.fairs = (this.state.stats.fairs ?? 0) + 1;
    const first = !this.state.chronicle.firstFair;
    if (first) {
      const { day, hour, minute } = this.state.time;
      this.state.chronicle.firstFair = { type: cf.type, name: fair.name, count: attendees.length, day, hour, minute };
    }
    for (const id of attendees) {
      const c = this.world.getCharacter(id);
      if (!c) continue;
      // Altın Çağ'dan sonra mevsimin festivali panayırdır: aynı mevsimin eski festival anısı yerini ona bırakır (defter şişmez)
      const oldText = SEASON_FESTIVALS[cf.type]?.memory;
      const at = c.memories?.findIndex((m, i) => i > 0 && m.text === oldText) ?? -1;
      if (at > 0) c.memories.splice(at, 1);
      addMemory(this.state, c, fair.memory, fair.icon, { kind: 'festival' });
    }
    // Mevsim Coşkusu: panayır Altın Çağ'dan sonra eski mevsim festivalinin yerini aldığı için kapanış armağanı aynıdır
    const cheer = SEASON_FESTIVAL.afterglowBuff;
    this.state.buffs[cheer] = this.state.totalMinutes + TOWN_BUFFS[cheer].hours * 60;
    for (const c of this.state.characters) c.needs.fun = clamp(c.needs.fun + SEASON_FESTIVAL.afterglowFun, 0, 100);
    this.events.emit('fair:ended', { fair, type: cf.type, attendees, first });
    if (!this.attract) this.events.emit('toast', { text: `${fair.end} (${attendees.length} sakin katıldı)`, tone: 'info', icon: fair.icon });
    return true;
  }

  /** Şenlik saatinde meydandakiler: Panayır Coşkusu, 2. kuşak neşesi, nostalji ve tezahürat sözleri. */
  update(tick) {
    this.dropStale();
    const cf = this.cf;
    if (!cf || cf.phase !== 'party' || !(tick.gameMinutes > 0)) return;
    const minutes = tick.gameMinutes;
    const fair = FAIRS[cf.type];
    const dancers = [];
    for (const c of this.world.characters) {
      if (c.task?.activity !== 'festival' || c.task.phase !== 'perform') continue;
      if (!this.attendees.has(c.id)) {
        this.attendees.add(c.id);
        (cf.participants ??= []).push(c.id);
      }
      c.needs.fun = clamp(c.needs.fun + FAIR.funPerMinute * minutes, 0, 100);
      c.needs.social = clamp(c.needs.social + FAIR.socialPerMinute * minutes, 0, 100);
      if (c.quirk === 'festive' && (c.generation ?? 1) >= FAIR.festiveGeneration) dancers.push(c);
      this.maybeSpeak(c, fair, minutes);
    }
    if (dancers.length) this.spreadJoy(dancers, minutes);
  }

  /** "Şenlik Neşesi" huylu 2. kuşak dansçı havuz başında yanındakilere fazladan neşe yayar. */
  spreadJoy(dancers, minutes) {
    const { radius, perMinute } = FAIR.festiveJoy;
    for (const d of dancers) {
      for (const c of this.world.characters) {
        if (c === d || c.task?.activity !== 'festival' || c.task.phase !== 'perform') continue;
        if (Math.hypot(c.x - d.x, c.y - d.y) > radius) continue;
        c.needs.fun = clamp(c.needs.fun + perMinute * minutes, 0, 100);
      }
    }
  }

  maybeSpeak(c, fair, minutes) {
    if (!c.visible || c.speech) return;
    const festiveGen2 = c.quirk === 'festive' && (c.generation ?? 1) >= FAIR.festiveGeneration;
    const mul = c.isElder ? FAIR.elderSpeechMul : festiveGen2 ? FAIR.festiveSpeechMul : 1;
    if (this.rng.next() >= FAIR.speechPerMinute * mul * minutes) return;
    const lines = c.isElder ? ELDER_LINES : festiveGen2 ? FESTIVE_DANCER_LINES : fair.cheers;
    c.speech = { text: this.rng.pick(lines), at: -1, duration: FAIR.speechSeconds };
  }
}

// Bonus adı mevcut mu (data/town.js'te tanımlı olmalı)
if (!TOWN_BUFFS[FAIR.buff]) throw new Error(`TOWN_BUFFS.${FAIR.buff} yok`);
