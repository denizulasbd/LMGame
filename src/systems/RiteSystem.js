// (29.7 "Anma Töreni ve Özel Günler") Vefatın ertesi akşamı anma töreni, kitabe, Taziye Sofrası; doğum günü ve evlilik yıl dönümü,
// kutlanma / unutulma, Armağan. Sayılar ve sözler src/data/rites.js'te, saf hesaplar ./Rites.js'te; törene yürüyüş Brain.planMemorial.
//
//   Tören     : 'population:died' -> state.rites.pending'e { name, day, age, id, friends, closestId } (ilişkiler silinmeden önce
//               'population:dying'de çıkarılır). Vefatı izleyen gün 06:00'da aynı gün ölenler tek törende toplanır (active); 18:00-19:00
//               arasında yas tutanlar ve ölenle ilişkisi ≥ 40 olan uyanık yetişkinler anıtın (yoksa meydan havuzunun) başında anar.
//               19:00'da: katılanların yası x0,7 (Taziye Sofrası'yla x0,5) kısalır, "Helalleşti" moodlet'i (evrim spirit +3), ölenin en
//               yakını veda sözü söyler, adlar kitabeye (en çok 40) yazılır ('rite:held' { names, attendees, place, condolence }).
//               18:00'de 'rite:started' { rite, ids }: çağrılılar yarıda kesilebilen işini bırakır; 19:00'da 'rite:ended' { ids } ile
//               anma görevleri biter (BehaviorSystem.interrupt).
//   Taziye    : tören günü 06:00'dan bitimine dek 20 yiyecek + 10 altınla bir kez ('ui:condolence'): katılanlara sadakat +3, moodlet major.
//   Özel gün  : 06:00'da doğum günü (o gün yaş alan, çocuk dahil) ya da evlilik yıl dönümü (16 günde bir) olan sakine "Bugün Onun Günü";
//               yakınlarıyla (doğum gününde en yakın 2 kişi, yıl dönümünde eşi) birbirini arar (c.specialSeek, kaydedilmez). 22:00'ye dek
//               onlardan biriyle aynı toplulukta bulunursa "Hatırlandı" (doyum +6, ilişki +5), yoksa "Unutuldu" (doyum -4, evrim spirit -3 /
//               company -2; çocukta yalnızca moodlet). Yastaki sakinin günü atlanır. Armağan ('ui:giftSpecialDay' { id }, 5 altın, günde
//               bir): sadakat +6, doyum +4, "Unutuldu" olmaz.
// Kancaların hepsi ENGINES.rites ile sarılıdır. HİÇ ZAR ÇEKMEZ: izole üreteç (tohum + 41) yalnızca sözlerin seçimi içindir; moodlet'ler
// MoodletSystem'in söz üretecine dokunmadan (Moodlets.addMoodlet) uygulanır.
import { RITE_RULES as R, SPECIAL_RULES as S, FAREWELL_LINES, CELEBRATE_LINES } from '../data/rites.js';
import { LOYALTY_SOURCES } from '../data/loyalty.js';
import { MOODLETS } from '../data/moodlets.js';
import { engineOn } from './Engines.js';
import {
  emptyRites,
  riteVenue,
  riteWindow,
  friendsOfDead,
  closestToDead,
  specialKindOf,
  specialCompanions,
  sameGathering,
  giftStatus,
  condolenceStatus,
  memorialEligible,
  urgentNeed,
} from './Rites.js';
import { addMoodlet, hasMoodlet, getMoodlet, emptyMoodletStats } from './Moodlets.js';
import { recomputeDrive, clampSatisfaction } from './Wants.js';
import { foodSupply } from './TownStatus.js';
import { genitive } from '../utils/turkish.js';
import { epitaphStory } from './LifeStory.js';

const on = () => engineOn('rites');

export class RiteSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng izole söz üreteci (tohum + 41)
   * @param {{ economy, relationships, loyalty }} services
   */
  constructor(game, world, rng, { economy, relationships, loyalty } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.economy = economy;
    this.relationships = relationships;
    this.loyalty = loyalty;
    this.state.rites ??= emptyRites();
    this.dying = new Map(); // vefat eden kimlik -> { friends, closestId } (kaydedilmez; 'population:died'e dek)
    const sub = (name, fn) => game.events.on(name, (p = {}) => on() && fn(p));
    this.unsubscribers = [
      sub('population:dying', ({ character }) => character && this.dying.set(character.id, { friends: friendsOfDead(this.state, character), closestId: closestToDead(this.state, character), story: epitaphStory(character, this.state) })), // (29.9) öykü, referanslar silinmeden önce
      sub('population:died', ({ character, age }) => this.onDied(character, age)),
      sub('relationship:married', ({ a, b }) => this.onMarried(a, b)),
      sub('time:hour', (hour) => this.onHour(Number.isFinite(hour) ? hour : this.state.time.hour)),
      sub('ui:condolence', () => this.condolence()),
      sub('ui:giftSpecialDay', ({ id }) => this.gift(this.world.getCharacter(id))),
      sub('population:left', () => this.refreshSeeks()),
    ];
    if (on()) this.refreshSeeks();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get rites() {
    return (this.state.rites ??= emptyRites());
  }

  log(text, icon) {
    const entry = this.state.addJournal(text, icon);
    this.events.emit('journal:added', entry);
  }

  /** Moodlet'i MoodletSystem'in söz üretecine dokunmadan verir; yeni eklendiyse sayaç ve 'moodlet:added' (evrim, sadakat dinler). */
  mood(c, key, opts = {}) {
    if (!c || c.role) return null;
    const had = hasMoodlet(c, key);
    const m = addMoodlet(c, key, this.state.totalMinutes, opts);
    if (!m || had) return m;
    const stats = (this.state.moodlets ??= emptyMoodletStats());
    stats.given[key] = (stats.given[key] ?? 0) + 1;
    if (c.visible && !c.away) c.showBubble(MOODLETS[key].icon, 2.4);
    this.events.emit('moodlet:added', { character: c, moodlet: m });
    return m;
  }

  say(c, lines, who) {
    if (!c || !c.visible || c.away || c.speech || !lines?.length) return;
    const text = lines[Math.floor(this.rng.next() * lines.length)];
    c.speech = { text: text.replace('{who}', who ?? ''), at: -1, duration: 3.4 };
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Anma Töreni

  onDied(c, age) {
    if (!c) return;
    const snap = this.dying.get(c.id) ?? { friends: [], closestId: null, story: null };
    this.dying.delete(c.id);
    const alive = (id) => this.state.characters.some((o) => o.id === id);
    const entry = { name: c.name, day: this.state.time.day, age: Math.max(0, Math.floor(Number(age ?? c.age) || 0)), id: c.id, friends: snap.friends.filter(alive), closestId: alive(snap.closestId) ? snap.closestId : null };
    if (snap.story) entry.story = snap.story;
    this.rites.pending.push(entry);
    for (const a of [this.rites.active, ...this.rites.pending]) {
      if (!a?.ids) continue;
      a.ids = a.ids.filter(alive);
      a.attendees = a.attendees.filter(alive);
    }
  }

  onHour(hour) {
    const r = this.rites;
    const day = this.state.time.day;
    if (r.active && (r.active.day < day || hour >= R.endHour)) this.finish();
    if (!r.active && hour >= R.prepHour && hour < R.endHour) this.open(day);
    // 18:00: çağrılılar yarıda kesilebilen işini bırakıp anma yerine yürür (BehaviorSystem; zar çekmez)
    if (r.active && hour === R.startHour && r.active.day === day) {
      const ids = this.state.characters.filter((c) => memorialEligible(this.state, c) && !urgentNeed(c)).map((c) => c.id);
      this.events.emit('rite:started', { rite: r.active, ids });
    }
    if (hour === S.startHour) this.startSpecialDays();
    if (hour === S.deadlineHour) this.closeSpecialDays();
  }

  /** Vefatı bugünden önce olan en eski günün ölenleri tek törende toplanır. */
  open(day) {
    const r = this.rites;
    const due = r.pending.filter((p) => p.day < day);
    if (!due.length) return null;
    const first = Math.min(...due.map((p) => p.day));
    const dead = due.filter((p) => p.day === first);
    r.pending = r.pending.filter((p) => !dead.includes(p));
    const alive = new Set(this.state.characters.map((c) => c.id));
    const ids = [...new Set(dead.flatMap((d) => d.friends))].filter((id) => alive.has(id) && !dead.some((d) => d.id === id)).sort((a, b) => a - b);
    const venue = riteVenue(this.state);
    r.active = { names: dead.map((d) => d.name), day, place: venue?.id ?? null, condolence: false, attendees: [], ids, dead };
    this.events.emit('rite:scheduled', { rite: r.active });
    return r.active;
  }

  /** Tören sırasında anıtın başında anan sakinler katılımcı sayılır. */
  update() {
    if (!on()) return;
    const a = this.rites.active;
    if (a) {
      const w = riteWindow(this.state, a);
      const now = this.state.totalMinutes;
      if (now >= w.start && now < w.end) {
        for (const c of this.state.characters) {
          if (c.task?.activity === 'memorial' && c.task.phase === 'perform' && !a.attendees.includes(c.id)) a.attendees.push(c.id);
        }
      }
    }
    this.scanCelebrations();
  }

  /** 19:00: tören biter. */
  finish() {
    const r = this.rites;
    const a = r.active;
    if (!a) return;
    r.active = null;
    const now = this.state.totalMinutes;
    const mul = a.condolence ? R.condolenceMul : R.mourningMul;
    const attendees = a.attendees.map((id) => this.world.getCharacter(id)).filter((c) => c && !c.role);
    for (const c of attendees) {
      const m = getMoodlet(c, 'mourning');
      if (m && m.until !== null && m.until > now) m.until = Math.round(now + (m.until - now) * mul);
      this.mood(c, 'farewell', { reason: 'farewell_rite', tier: a.condolence ? 'major' : 'minor', whoName: a.names[0] });
      if (a.condolence) this.loyalty?.adjust(c, LOYALTY_SOURCES.condolence, 'condolence');
    }
    // Ölenin en yakını (eş -> evlat -> ruh ikizi -> en yüksek ilişki) veda sözü söyler
    for (const d of a.dead) {
      const speaker = this.world.getCharacter(d.closestId);
      if (speaker && attendees.includes(speaker)) this.say(speaker, FAREWELL_LINES, d.name);
    }
    for (const d of a.dead) {
      const row = { name: d.name, day: d.day, age: d.age };
      if (d.story) row.story = d.story;
      r.names.push(row);
    }
    if (r.names.length > R.namesMax) r.names.splice(0, r.names.length - R.namesMax);
    r.held += 1;
    const place = this.world.getBuilding(a.place);
    const names = a.names.join(', ');
    this.log(`Anma töreni: ${names} için ${place ? `${place.name} başında` : 'meydanda'} ${attendees.length} kişi helalleşti${a.condolence ? ' (Taziye Sofrası kuruldu)' : ''}`, 'candle');
    this.events.emit('rite:held', { names: a.names, attendees: attendees.map((c) => c.id), place: a.place, condolence: a.condolence });
    // 19:00: hâlâ anma yerinde duran ya da oraya yürüyen herkes görevi bırakır (BehaviorSystem; tören 19:00'u aşmaz)
    this.events.emit('rite:ended', { ids: this.state.characters.filter((c) => c.task?.activity === 'memorial').map((c) => c.id) });
  }

  /** Taziye Sofrası: tören başına bir kez, 20 yiyecek + 10 altın. Dönüş: { ok, reason }. */
  condolence() {
    const st = condolenceStatus(this.state, foodSupply(this.state));
    if (!st.ok) {
      this.events.emit('toast', { text: `Taziye Sofrası: ${st.reason}`, tone: 'warn', icon: 'candle' });
      return st;
    }
    if (!this.economy.canFeed(R.condolenceCost.food) || (this.state.resources.gold ?? 0) < R.condolenceCost.gold) return { ok: false, reason: 'Kaynak yetmiyor' };
    this.economy.consumeFood(R.condolenceCost.food);
    this.economy.spend({ gold: R.condolenceCost.gold });
    const a = this.rites.active;
    a.condolence = true;
    this.rites.condolences += 1;
    this.log(`Taziye Sofrası kuruldu: ${a.names.join(', ')} için kasaba sofra açtı`, 'candle');
    this.events.emit('rite:condolence', { rite: a });
    return { ok: true, reason: null };
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Özel günler

  onMarried(a, b) {
    const day = this.state.time.day;
    if (a) a.weddingDay = day;
    if (b) b.weddingDay = day;
  }

  /** 06:00: bugün doğum günü / yıl dönümü olanlar. */
  startSpecialDays() {
    const day = this.state.time.day;
    for (const c of this.state.characters) {
      if (c.role) continue;
      c.specialDay = null;
      if (c.away || c.emigrating) continue;
      const kind = specialKindOf(c, day);
      if (!kind || c.mood?.grief) continue; // yastaki sakinin günü atlanır
      if (kind === 'anniversary' && !specialCompanions(this.state, c, kind).length) continue;
      c.specialDay = { day, kind, celebrated: false, gifted: false };
      this.mood(c, 'special_day', { reason: kind === 'birthday' ? 'special_birthday' : 'special_anniversary' });
    }
    this.refreshSeeks();
  }

  /** Bugün özel günü süren (kutlanmamış ya da kutlanmış) sakinler. */
  specialToday() {
    const day = this.state.time.day;
    return this.state.characters.filter((c) => c.specialDay && c.specialDay.day === day && !c.role);
  }

  /** c.specialSeek: özel gün sahibi ile yakınları birbirini arar (tarihten türetilir, kaydedilmez). */
  refreshSeeks() {
    const before = new Map(this.state.characters.map((c) => [c, (c.specialSeek ?? []).join()]));
    for (const c of this.state.characters) c.specialSeek = [];
    if (on() && this.state.time.hour >= S.startHour && this.state.time.hour < S.deadlineHour) {
      for (const c of this.specialToday()) {
        for (const id of specialCompanions(this.state, c)) {
          const o = this.world.getCharacter(id);
          if (!o) continue;
          if (!c.specialSeek.includes(id)) c.specialSeek.push(id);
          if (!o.specialSeek.includes(c.id)) o.specialSeek.push(c.id);
        }
      }
    }
    for (const c of this.state.characters) if (before.get(c) !== c.specialSeek.join()) recomputeDrive(c);
  }

  scanCelebrations() {
    const hour = this.state.time.hour;
    if (hour < S.startHour || hour >= S.deadlineHour) return;
    for (const c of this.specialToday()) {
      if (c.specialDay.celebrated) continue;
      for (const id of specialCompanions(this.state, c)) {
        const o = this.world.getCharacter(id);
        if (o && sameGathering(c, o, c.specialDay.kind === 'anniversary')) {
          this.celebrate(c, o);
          break;
        }
      }
    }
  }

  celebrate(c, by) {
    c.specialDay.celebrated = true;
    this.rites.celebrated += 1;
    if (!c.isChild) c.satisfaction = clampSatisfaction(c.satisfaction + S.celebratedJoy);
    this.relationships?.add(c, by, S.celebratedFriendship);
    this.mood(c, 'celebrated', { reason: c.specialDay.kind === 'birthday' ? 'celebrated_birthday' : 'celebrated_anniversary', whoId: by.id, whoName: by.name });
    this.say(by, CELEBRATE_LINES[c.specialDay.kind], c.name);
    this.events.emit('special:celebrated', { character: c, by, kind: c.specialDay.kind });
  }

  /** 22:00: kutlanmayan (armağan da gelmeyen) özel gün "Unutuldu". */
  closeSpecialDays() {
    for (const c of this.specialToday()) {
      const d = c.specialDay;
      c.specialDay = null;
      if (d.celebrated || d.gifted) continue;
      this.rites.forgotten += 1;
      this.mood(c, 'forgotten', { reason: d.kind === 'birthday' ? 'forgotten_birthday' : 'forgotten_anniversary' });
      if (!c.isChild) c.satisfaction = clampSatisfaction(c.satisfaction + S.forgottenJoy);
      this.events.emit('special:forgotten', { character: c, kind: d.kind });
    }
    this.refreshSeeks();
  }

  /** Armağan Gönder (5 altın, günde bir kez). Dönüş: { ok, reason }. */
  gift(c) {
    const st = giftStatus(this.state, c);
    if (!st.ok) {
      this.events.emit('toast', { text: `Armağan: ${st.reason}`, tone: 'warn', icon: 'coin' });
      return st;
    }
    if (!this.economy.spend({ gold: S.giftCost })) return { ok: false, reason: 'Hazinede altın yok' };
    c.specialDay.gifted = true;
    this.loyalty?.adjust(c, LOYALTY_SOURCES.gift, 'gift');
    if (!c.isChild) c.satisfaction = clampSatisfaction(c.satisfaction + S.giftJoy);
    if (c.visible) c.showBubble('sparkle', 2.4);
    this.log(`${genitive(c.name)} ${c.specialDay.kind === 'birthday' ? 'doğum günü' : 'evlilik yıl dönümü'} için Yönetim'den armağan gitti`, 'coin');
    this.events.emit('special:gifted', { character: c });
    return { ok: true, reason: null };
  }
}
