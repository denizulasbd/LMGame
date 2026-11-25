// (32.5) Hobi Evleri ve Kulüpler: üyelik, buluşma, ürünler. Sayılar data/clubs.js, saf hesaplar ./Clubs.js.
// Şalter ENGINES.clubs kapalıyken hiçbir dinleyici kurulmaz. Kasabada hobi evi yokken hiçbir şey yazılmaz (state.clubs ve c.club
// boş kalır; tarih şalter kapalıyken olduğu gibidir). Bu sistemin üreteci YOKTUR.
//
//   Üyelik   ('time:newDay', Darülfünun'dan SONRA): sürgündeki / isyandaki üye temizlenir; işleyen hobi evlerine eşiği geçen en yüksek
//             puanlılar sırayla yerleşir (Clubs.placementPlan); bahar başında bahçe üyelerine birer Meyve.
//   Buluşma  (update): buluşma penceresinin başında uygun üyeler sayılır (seferde / hasta / yaralı / yasta / kamu hizmeti borçlu /
//             uyuyan / anmaya çağrılı değil); en az 3 ise state.clubs[k].live kurulur ve 'club:bell' { ids } yayınlanır (Brain:
//             planClubSession). Şenlik, Toplanma Zili / konser, anma, düğün ya da Çağ Kutlaması sürüyorsa en çok 30 dk beklenir.
//             Buluşmada birlikte olan üyeler arasında arkadaşlık kazancı (RelationshipSystem.add), bitişte Tatlı Sohbet (neden 'club').
//   Ürünler  : bahçe tarhları (estetik), Nakışlı Mendil / kışın Dayanıklı Giysi hediyesi, atölye tabloları ve Kasaba Sergisi.
// Yayınladığı olaylar: 'club:joined' { character, key, reason }, 'club:left' { character, key, reason }, 'club:founded' { key, members },
//   'club:bell' { key, ids }, 'club:skipped' { key, reason: blocked | few | empty }, 'club:session' { key, came, building }, 'club:work' { key, kind, text, ids, building, milestone, recipient? },
//   'club:exhibition' { key, building, ids, text }, 'club:works' (estetik yeniden hesaplanır), 'toast'.
import { CLUB, CLUB_KEYS, CLUBS, CLUB_TEXT as TX } from '../data/clubs.js';
import { RELATIONSHIP_RATES } from '../data/relationships.js';
import { getSeason } from '../data/seasons.js';
import { ITEMS } from '../data/citizens.js';
import { engineOn } from './Engines.js';
import {
  clubBuilding, anyClubHouse, canJoin, membersOf, clubAffinity, placementPlan, sessionWindow, sessionSpots, giftOrder, paintingTitle, emptyClub,
  clubName, isClubKey, memberHomeDistance, leadMinutes,
} from './Clubs.js';
import { serviceDue } from './Justice.js';
import { isMemorialTime, memorialEligible, riteWindow } from './Rites.js';
import { isRallyActive } from './RallySystem.js';
import { addItem, roomFor, countItem } from './Citizens.js';
import { addMemory } from './MemorySystem.js';
import { clamp } from '../utils/math.js';

const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const SESSION_ACTS = new Set(['clubSession', 'clubSessionIn']);
const seasonIndexOf = (day) => Math.floor(Math.max(0, day - 1) / getSeason(day).daysInSeason);

export class ClubSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   */
  constructor(game, world, { moodlets = null, relationships = null } = {}) {
    this.game = game;
    this.events = game.events;
    this.world = world;
    this.moodlets = moodlets;
    this.relationships = relationships;
    this.minutes = new Map(); // bu buluşmada üye başına geçirilen dakika (kaydedilmez)
    this.lastMinute = null;
    this.unsubscribers = [];
    if (!engineOn('clubs')) return;
    const on = (name, fn) => this.unsubscribers.push(game.events.on(name, fn));
    on('time:newDay', () => this.newDay());
    on('population:left', ({ character } = {}) => character?.club && this.leave(character, 'gone', { silent: true }));
    on('court:exiled', ({ character } = {}) => character?.club && this.leave(character, 'exile', { silent: true }));
    on('building:completed', (b) => b && isClubKey(b.type) && this.syncWorks());
    on('building:removed', (b) => b && isClubKey(b.type) && this.houseRemoved(b.type));
    on('ui:clubKick', ({ characterId } = {}) => this.kick(characterId));
    on('ui:clubInvite', ({ key, characterId } = {}) => this.invite(key, characterId));
    this.syncWorks(); // yüklenen kasabanın ürünleri yapının estetiğine (LandscapeSystem bizden sonra kurulur)
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get state() {
    return this.game.state;
  }

  /** Kulübün kaydı (ilk kullanımda kurulur; yalnızca kasabada hobi evi varken çağrılır). */
  rec(key) {
    const s = this.state;
    s.clubs ??= {};
    return (s.clubs[key] ??= emptyClub());
  }

  /** Ürün sayılarını yapıya (runtime building.clubWorks; kaydedilmez) yazar, estetik yeniden hesaplanır. */
  syncWorks() {
    const s = this.state;
    let changed = false;
    for (const b of this.world.buildings) {
      if (!isClubKey(b.type)) continue;
      const works = s.clubs?.[b.type]?.works ?? 0;
      if ((b.clubWorks ?? 0) !== works) {
        b.clubWorks = works;
        changed = true;
      }
    }
    if (changed) this.events.emit('club:works', {});
  }

  // ---------------------------------------------------------------------------------------------------------------------- üyelik

  join(c, key, reason = 'auto') {
    const s = this.state;
    c.club = { key, since: s.time.day, missed: 0 };
    const r = this.rec(key);
    if (r.out) delete r.out[c.id];
    addMemory(s, c, fill(TX.memoryJoined, { club: clubName(key) }), CLUBS[key].icon, { kind: 'life' });
    this.events.emit('club:joined', { character: c, key, reason });
    const members = membersOf(s, key);
    if (!r.founded && members.length >= CLUB.minSession) {
      r.founded = s.time.day;
      this.events.emit('club:founded', { key, members, building: clubBuilding(s, key) });
    }
  }

  leave(c, reason, { silent = false } = {}) {
    const key = c?.club?.key;
    if (!key) return;
    c.club = null;
    const r = this.state.clubs?.[key];
    if (r?.live) r.live.ids = r.live.ids.filter((id) => id !== c.id);
    // kasabadan ayrılan / ölen / sürgün edilen: kimliği kulüp kayıtlarından da silinir (kopuk referans kalmasın)
    if (reason === 'gone' || reason === 'exile') {
      for (const k of CLUB_KEYS) {
        const rr = this.state.clubs?.[k];
        if (!rr) continue;
        rr.attendance = rr.attendance.map((ids) => ids.filter((id) => id !== c.id));
        if (rr.live) {
          rr.live.came = rr.live.came.filter((id) => id !== c.id);
          rr.live.excused = rr.live.excused.filter((id) => id !== c.id);
        }
        if (rr.out) delete rr.out[c.id];
      }
    }
    this.events.emit('club:left', { character: c, key, reason, silent });
  }

  newDay() {
    const s = this.state;
    if (!anyClubHouse(s)) return;
    // sürgündeki / ayrılan üye temizlenir (isyancı ve seferdeki üye kalır; yalnızca buluşmaya uygun sayılmaz)
    for (const c of s.characters) if (c.club && (c.sentence?.exile || c.emigrating || c.isChild || c.role)) this.leave(c, c.sentence?.exile ? 'exile' : 'gone', { silent: true });
    for (const p of placementPlan(s)) this.join(p.c, p.key, 'auto');
    // bahar başı: bahçe üyelerine birer Meyve
    const season = getSeason(s.time.day);
    const garden = clubBuilding(s, 'gardenClub');
    if (garden && season.key === 'spring' && season.dayOfSeason === 1) {
      const r = this.rec('gardenClub');
      if (r.fruitYear !== season.year) {
        r.fruitYear = season.year;
        const got = [];
        for (const c of membersOf(s, 'gardenClub')) if (roomFor(c, 'fruit') > 0 && addItem(c, 'fruit', CLUBS.gardenClub.springFruit) > 0) got.push(c);
        for (const c of got) addMemory(s, c, TX.memoryFruit, 'apple', { kind: 'life' });
        if (got.length) this.events.emit('club:fruit', { key: 'gardenClub', ids: got.map((c) => c.id), text: TX.fruit });
      }
    }
  }

  /** Oyuncu: üyeyi kulüpten çıkarır (bir süre kendiliğinden dönmez). */
  kick(characterId) {
    const c = this.state.characters.find((x) => x.id === characterId);
    if (!c?.club) return { ok: false };
    const key = c.club.key;
    const r = this.rec(key);
    r.out ??= {};
    r.out[c.id] = this.state.time.day + CLUB.kickDays;
    this.leave(c, 'kicked');
    this.events.emit('toast', { text: fill(TX.kicked, { name: c.name, club: clubName(key) }), tone: 'info', icon: CLUBS[key].icon });
    return { ok: true };
  }

  /** Oyuncu: sıradaki bir adayı davet eder (kapasite içinde; kulübü olmayan, katılabilen sakin). */
  invite(key, characterId) {
    const s = this.state;
    if (!clubBuilding(s, key)) return { ok: false, reason: 'Kulüp evi yok' };
    if (membersOf(s, key).length >= CLUB.capacity) return { ok: false, reason: 'Kulüp dolu' };
    const c = s.characters.find((x) => x.id === characterId);
    if (!c || c.club || !canJoin(s, c)) return { ok: false, reason: 'Bu sakin katılamaz' };
    this.join(c, key, 'invited');
    this.events.emit('toast', { text: fill(TX.invited, { name: c.name, club: clubName(key) }), tone: 'success', icon: CLUBS[key].icon });
    return { ok: true };
  }

  houseRemoved(key) {
    const s = this.state;
    if (s.buildings.some((b) => b.type === key)) return;
    for (const c of membersOf(s, key)) this.leave(c, 'closed', { silent: true });
    if (s.clubs?.[key]) delete s.clubs[key].live;
  }

  // ---------------------------------------------------------------------------------------------------------------------- buluşma

  /** Şenlik, Toplanma Zili / konser, anma, düğün kutlaması ya da Çağ Kutlaması sürüyor mu (bunlar buluşmadan önce gelir)? */
  blocked() {
    const s = this.state;
    return Boolean(s.events?.festival?.active || isRallyActive(s) || isMemorialTime(s) || s.social?.party || s.goldenAge?.celebration);
  }

  /** Bugünün anma töreni buluşma penceresiyle çakışıyor mu (tören önce gelir: çağrılı üye o akşam uygun sayılmaz)? */
  memorialOverlaps(until = this.state.totalMinutes + 1) {
    const w = riteWindow(this.state);
    return Boolean(w) && w.end > this.state.totalMinutes && w.start < until;
  }

  /** Buluşma başında uygun mu (uygun değilse kaçırma sayılmaz). */
  eligibleNow(c, until = null) {
    const s = this.state;
    if (!canJoin(s, c) || c.away || c.illness || c.isInjured || c.mood?.grief) return false;
    if (serviceDue(s, c)) return false; // (32.2) kamu hizmeti önce; borçlu üye o akşam gelmez
    if (c.task?.activity === 'sleep' && !c.task.nap) return false;
    if ((isMemorialTime(s) || (until !== null && this.memorialOverlaps(until))) && memorialEligible(s, c)) return false;
    return true;
  }

  update(tick) {
    if (!engineOn('clubs')) return;
    const s = this.state;
    if (!s.clubs && !anyClubHouse(s)) return;
    const now = s.totalMinutes;
    const minute = Math.floor(now);
    const steps = this.lastMinute === null ? 0 : Math.max(0, Math.min(30, minute - this.lastMinute));
    this.lastMinute = minute;
    const day = s.time.day;
    for (const key of CLUB_KEYS) {
      const b = clubBuilding(s, key);
      const r = s.clubs?.[key];
      if (!b) {
        if (r?.live) this.finish(key, null);
        continue;
      }
      const live = r?.live;
      if (live) {
        if (steps > 0) this.tickSession(key, b, live, steps);
        if (now >= live.until || live.day !== day) this.finish(key, b);
      } else {
        const w = sessionWindow(key, day);
        // (32.6a) zil, üyelerin tahmini yürüme süresi kadar erken çalar (en çok CLUB.leadMax): varış buluşma başına yakın olsun
        if (w && r?.evaluated !== day && now >= w.start - CLUB.leadMax && now < w.end && now >= w.start - this.leadFor(key, b, day)) this.evaluate(key, b, w);
      }
      this.exhibitAura(key, b, steps);
      this.refreshLook(key, b);
    }
  }

  /**
   * (32.6a) Bu günün erken çalma payı (dakika): üyelerin evinin kapısından buluşma karosuna yol uzunluğunun ortalaması × dakika / karo
   * (yol bulunamazsa Manhattan uzaklığı). Gün başına bir kez hesaplanır ve state.clubs[k].lead'e yazılır (panel uyarısı da onu okur).
   */
  leadFor(key, b, day) {
    const s = this.state;
    const prev = s.clubs?.[key]?.lead;
    if (prev?.day === day) return prev.minutes;
    const members = membersOf(s, key);
    if (!members.length) return 0;
    const target = sessionSpots(this.world, b)[0] ?? this.world.getSpots(b)[0] ?? null;
    const lengths = [];
    for (const c of members) {
      const home = Number.isInteger(c.homeId) ? this.world.getBuilding(c.homeId) : null;
      const door = home ? this.world.getSpots(home)[0] : null;
      if (!door || !target) continue;
      const path = this.world.findPath(door, target);
      lengths.push(path ? path.length : Math.abs(door.x - target.x) + Math.abs(door.y - target.y));
    }
    const tiles = lengths.length ? lengths.reduce((a, v) => a + v, 0) / lengths.length : memberHomeDistance(s, key, b) ?? 0;
    const minutes = leadMinutes(tiles);
    this.rec(key).lead = { day, tiles: Math.round(tiles * 10) / 10, minutes };
    return minutes;
  }

  /** Pencerenin başında (32.6a: yürüme payı kadar önce): uygun üyeleri say, en az 3 ise buluşmayı kur. */
  evaluate(key, b, w) {
    const s = this.state;
    const members = membersOf(s, key);
    if (!members.length) return;
    const r = this.rec(key);
    if (this.blocked()) {
      if (s.totalMinutes < w.start + CLUB.blockedGrace) return;
      r.evaluated = s.time.day;
      r.recent = [...r.recent, 0].slice(-6);
      this.events.emit('club:skipped', { key, reason: 'blocked', eligible: 0 });
      return;
    }
    r.evaluated = s.time.day;
    const ids = members.filter((c) => this.eligibleNow(c, w.end)).map((c) => c.id);
    if (ids.length < CLUB.minSession) {
      r.recent = [...r.recent, 0].slice(-6);
      this.events.emit('club:skipped', { key, reason: 'few', eligible: ids.length, members: members.length });
      return;
    }
    r.live = { day: s.time.day, until: w.end, ids, came: [], excused: members.filter((c) => !ids.includes(c.id)).map((c) => c.id) };
    this.minutes = new Map();
    this.events.emit('club:bell', { key, ids });
  }

  /** Şu an kulüp evinde buluşmada (perform) olan üyeler. */
  present(key, b) {
    return this.world.characters.filter((c) => c.club?.key === key && SESSION_ACTS.has(c.task?.activity) && c.task.buildingId === b.id && c.task.phase === 'perform');
  }

  tickSession(key, b, live, steps) {
    const here = this.present(key, b);
    // ölçüm için (kaydedilmez): buluşmanın 45. dakikasında üyelerin ne yaptığı
    if (!this.sample?.[key] && this.state.totalMinutes >= live.until - 75) {
      this.sample ??= {};
      this.sample[key] = membersOf(this.state, key).map((c) => (c.away ? 'away' : c.task?.activity ?? 'none'));
    }
    for (const c of here) {
      if (!live.came.includes(c.id)) live.came.push(c.id);
      this.minutes.set(c.id, (this.minutes.get(c.id) ?? 0) + steps);
    }
    // arkadaşlık: yalnızca aynı buluşmada birlikte olanlar (aşk zarı yok)
    if (this.relationships && here.length > 1) {
      const rate = RELATIONSHIP_RATES.chat * CLUB.friendshipMultiplier * steps;
      for (let i = 0; i < here.length; i++) for (let j = i + 1; j < here.length; j++) this.relationships.add(here[i], here[j], rate * this.relationships.chatMultiplier(here[i], here[j]));
    }
  }

  finish(key, b) {
    const s = this.state;
    const r = this.rec(key);
    const live = r.live;
    delete r.live;
    if (!live) return;
    const came = live.came.filter((id) => s.characters.some((c) => c.id === id && c.club?.key === key));
    const held = came.length >= 2;
    r.recent = [...r.recent, held ? 1 : 0].slice(-6);
    for (const c of membersOf(s, key)) {
      if (came.includes(c.id)) c.club.missed = 0;
      else if (live.ids.includes(c.id)) c.club.missed += 1;
    }
    if (!held) this.events.emit('club:skipped', { key, reason: 'empty', eligible: live.ids.length, acts: this.sample?.[key] ?? [] });
    if (this.sample) delete this.sample[key];
    if (held) {
      r.sessions += 1;
      r.lastSession = s.time.day;
      r.attendance = [...r.attendance, came].slice(-CLUB.attendanceKept);
      const people = came.map((id) => s.characters.find((c) => c.id === id)).filter(Boolean);
      for (const c of people) {
        if ((this.minutes.get(c.id) ?? CLUB.moodletMinutes) >= CLUB.moodletMinutes) this.moodlets?.apply(c, 'warm_chat', { reason: 'club', whoName: clubName(key) });
      }
      this.events.emit('club:session', { key, came, building: b });
      if (b) this.product(key, b, r, people);
    }
    this.minutes = new Map();
    // kendiliğinden ayrılma: üst üste kaçırdı ve puanı eşiğin altında
    for (const c of membersOf(s, key)) {
      if (c.club.missed >= CLUB.missLimit && clubAffinity(s, c, key).score < CLUB.threshold) this.leave(c, 'drifted');
    }
  }

  // ---------------------------------------------------------------------------------------------------------------------- ürünler

  product(key, b, r, people) {
    const def = CLUBS[key];
    if (r.sessions % def.every !== 0) return;
    const s = this.state;
    const vars = { club: def.name };
    if (key === 'gardenClub') {
      if (r.works >= def.maxWorks) return;
      r.works += 1;
      r.products += 1;
      const what = TX.bedWords[(r.works - 1) % TX.bedWords.length];
      for (const c of people) addMemory(s, c, fill(TX.memoryBed, { ...vars, what }), def.icon, { kind: 'life' });
      this.syncWorks();
      this.events.emit('club:work', { key, kind: 'bed', ids: people.map((c) => c.id), building: b, n: r.works, milestone: r.works === 1 || r.works === def.maxWorks, text: fill(TX.bed, { ...vars, what, n: r.works, max: def.maxWorks }) });
      return;
    }
    if (key === 'sewingClub') {
      const season = getSeason(s.time.day);
      const sIndex = seasonIndexOf(s.time.day);
      const winter = season.key === 'winter';
      const garment = winter && r.garmentSeason !== sIndex;
      const kind = garment ? 'garment' : 'handkerchief';
      const order = giftOrder(s, winter).filter((c) => roomFor(c, kind) > 0 && countItem(c, kind) === 0);
      const to = order[0];
      if (!to) return;
      if (addItem(to, kind, 1) <= 0) return;
      if (garment) {
        r.garmentSeason = sIndex;
        r.garments = (r.garments ?? 0) + 1;
      } else r.gifts = (r.gifts ?? 0) + 1;
      r.products += 1;
      for (const c of people) {
        if (c !== to) this.relationships?.add(c, to, def.giftRelation);
        addMemory(s, c, fill(garment ? TX.memoryGiftGarment : TX.memoryGift, { ...vars, name: to.name }), def.icon, { kind: 'life', whoId: to.id });
      }
      addMemory(s, to, fill(TX.memoryReceived, { ...vars, item: ITEMS[kind].name }), def.icon, { kind: 'life' });
      const n = (r.gifts ?? 0) + (r.garments ?? 0);
      this.events.emit('club:work', { key, kind, ids: people.map((c) => c.id), recipient: to, building: b, n, milestone: n === 1 || garment, text: fill(garment ? TX.garment : TX.handkerchief, { ...vars, name: to.name }) });
      return;
    }
    if (key === 'paintingClub') {
      r.paintings ??= [];
      if (r.paintings.length >= def.maxWorks) return;
      const sorted = [...people].sort((a, b2) => a.id - b2.id);
      const painter = sorted[r.paintings.length % sorted.length];
      const title = paintingTitle(getSeason(s.time.day).key, r.paintings.length, painter.name);
      r.paintings.push({ title, day: s.time.day });
      r.works = r.paintings.length;
      r.products += 1;
      for (const c of people) addMemory(s, c, fill(TX.memoryPainting, { title }), def.icon, { kind: 'life' });
      this.syncWorks();
      this.events.emit('club:work', { key, kind: 'painting', ids: people.map((c) => c.id), building: b, n: r.works, milestone: r.works === 1, title, text: fill(TX.painting, { title, n: r.works, max: def.maxWorks }) });
      if (r.paintings.length >= def.exhibitAt && !r.exhibited) {
        r.exhibited = s.time.day;
        r.exhibitUntil = Math.floor(s.totalMinutes + def.exhibitMinutes);
        for (const c of membersOf(s, key)) addMemory(s, c, TX.memoryExhibition, 'star', { kind: 'life' });
        this.events.emit('club:exhibition', { key, building: b, ids: membersOf(s, key).map((c) => c.id), text: TX.exhibition });
      }
    }
  }

  /** Kasaba Sergisi: atölyenin çevresinde dışarıda olanlara bir gün hafif keyif. */
  exhibitAura(key, b, steps) {
    const r = this.state.clubs?.[key];
    if (key !== 'paintingClub' || !steps || !r?.exhibitUntil || this.state.totalMinutes >= r.exhibitUntil) return;
    const def = CLUBS.paintingClub;
    const T = 16;
    const radius = def.exhibitRadius * T;
    for (const c of this.world.characters) {
      if (!c.visible || c.role || Math.hypot(c.x - b.center.x, c.y - b.center.y) > radius) continue;
      c.needs.fun = clamp(c.needs.fun + def.exhibitFun * steps, 0, 100);
    }
  }

  /** Görünüm (Building.look; kaydedilmez): buluşma, kış serası, ürün sayısı. */
  refreshLook(key, b) {
    const r = this.state.clubs?.[key];
    const session = Boolean(r?.live);
    const works = b.clubWorks ?? 0;
    const look = b.look;
    if (look?.session === session && look?.works === works) return;
    b.look = { ...(look ?? {}), session, works };
  }

  // ---------------------------------------------------------------------------------------------------------------------- Brain

  /** Brain (boş zaman dalında, kamu hizmeti ve suç planından sonra): üyenin buluşma planı ya da null. Zar çekmez. */
  planSession(c) {
    const s = this.state;
    const key = c.club?.key;
    const live = key ? s.clubs?.[key]?.live : null;
    if (!live || live.day !== s.time.day || s.totalMinutes >= live.until - 5) return null;
    if (c.isChild || c.away || c.illness || serviceDue(s, c) || c.mood?.grief) return null;
    const b = clubBuilding(s, key);
    if (!b) return null;
    const def = CLUBS[key];
    const duration = Math.max(5, Math.round(live.until - s.totalMinutes));
    const origin = this.originTile(c);
    if (def.winterIndoor && getSeason(s.time.day).key === 'winter') {
      const doors = this.world.getSpots(b);
      const spot = this.nearest(doors, origin);
      if (!spot || !this.world.findPath(origin, spot)) return null;
      return { activity: 'clubSessionIn', buildingId: b.id, spot, finalPoint: b.entrancePoint, duration, clubKey: key, clubLabel: def.winterLabel, clubTravel: def.travel };
    }
    const spots = sessionSpots(this.world, b);
    if (!spots.length) return null;
    const idx = Math.max(0, membersOf(s, key).findIndex((o) => o.id === c.id));
    for (let i = 0; i < spots.length; i++) {
      const spot = spots[(idx + i) % spots.length];
      if (this.world.isReserved(spot.x, spot.y, c.id)) continue;
      if (!this.world.findPath(origin, spot)) continue;
      const facing = def.pose === 'sit' ? 'down' : def.easel ? ((idx + i) % 2 === 0 ? 'right' : 'left') : spot.side === 'front' ? 'up' : spot.side === 'left' ? 'right' : spot.side === 'right' ? 'left' : 'down';
      return { activity: 'clubSession', buildingId: b.id, spot, reserve: true, facing, duration, clubKey: key, clubLabel: def.label, clubTravel: def.travel, pose: def.pose, tool: def.tool, ...(def.easel ? { easel: true } : {}) };
    }
    return null;
  }

  /** Üyenin kendi kulüp evi açık mı (boş zaman ağırlığı 'clubHobby' yalnızca o zaman eklenir). */
  hobbyAvailable(c) {
    return Boolean(c?.club && clubBuilding(this.state, c.club.key));
  }

  /** Buluşma dışında kendi kulüp evinde tek başına uğraş (içeride). */
  planHobby(c, duration) {
    const key = c.club?.key;
    const b = key ? clubBuilding(this.state, key) : null;
    if (!b) return null;
    const origin = this.originTile(c);
    const spot = this.nearest(this.world.getSpots(b), origin);
    if (!spot || !this.world.findPath(origin, spot)) return null;
    return { activity: 'clubHobby', buildingId: b.id, spot, finalPoint: b.entrancePoint, duration, clubKey: key, clubLabel: CLUBS[key].hobbyLabel, clubTravel: CLUBS[key].travel };
  }

  originTile(c) {
    if (c.insideBuildingId) {
      const home = this.world.getBuilding(c.insideBuildingId);
      const door = home && this.world.getSpots(home)[0];
      if (door) return door;
    }
    return { x: c.tileX, y: c.tileY };
  }

  nearest(spots, o) {
    let best = null;
    for (const p of spots ?? []) if (!best || Math.hypot(p.x - o.x, p.y - o.y) < Math.hypot(best.x - o.x, best.y - o.y)) best = p;
    return best;
  }
}
