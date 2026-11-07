// Dört mevsimin büyük kapanış festivalleri (14. aşama). Kurallar src/data/festivals.js'te.
//
//   Duyuru : mevsimin son günü 08:00'de ('seasonFestival:announced' { festival, theme }): bildirim, günlük, HUD.
//   Başlama: 15:00'te festival yeri seçilir (ilkbaharda meydan, yazın nehir kıyısındaki liman / iskele, sonbaharda
//            meydan, kışın kamp ateşi), çevresine temaya göre süslemeler kurulur ve kasabanın şenlik kuralları
//            (state.events.festival, theme ile) başlar: sakinler orada toplanıp dans eder ('festival:started').
//            Festival bonusu (çiçek şenliğinde aşk ve dostluk patlaması) gece yarısına kadar sürer.
//   Süresince: festivale ilk varan sakin bir kez ziyafet / elma şırası / keyif alır; kışın şölen ateşi ısıtır;
//            ilkbaharda herkes saçına çiçek takar (Character.flowerCrown).
//   Kapanış: gece yarısı EventSystem şenliği bitirir ('festival:ended' { theme }); burada kasabaya Mevsim Coşkusu
//            verilir, katılanlar anılarına yazılır ('seasonFestival:ended' { festival, theme, attendees }).
// Durum state.seasonFestival'dedir (kayda girer):
//   { day, theme, stage: 'announced' | 'active' | null, startedAt, decor: [{ kind, x, y }], attendees: [id], held }
import { SEASON_FESTIVAL, SEASON_FESTIVALS } from '../data/festivals.js';
import { TOWN_BUFFS } from '../data/town.js';
import { getSeason } from '../data/seasons.js';
import { clamp } from '../utils/math.js';
import { fairOwnsToday } from './Fair.js';

const T = 16;

/** Bu gün bir mevsimin son günü mü (festival günü)? */
export function isFestivalDay(day) {
  const season = getSeason(day);
  return season.dayOfSeason === season.daysInSeason;
}

/** Yaklaşan ya da süren festival (arayüz için): { festival, theme, stage } ya da null. */
export function currentSeasonFestival(state) {
  const sf = state.seasonFestival;
  if (!sf?.stage || sf.day !== state.time.day) return null;
  return { festival: SEASON_FESTIVALS[sf.theme], theme: sf.theme, stage: sf.stage };
}

export class SeasonFestivalSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, rng, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.attract = attract;
    this.unsubscribers = [
      game.events.on('time:hour', (hour) => this.onHour(hour)),
      game.events.on('festival:ended', ({ theme } = {}) => SEASON_FESTIVALS[theme] && this.finish(theme)),
    ];
    // Kayıttan: yarım kalan duyuru eski bir güne aitse temizlenir; süren festivalin taçları yeniden takılır
    const sf = this.sf;
    if (sf.stage === 'announced' && sf.day !== this.state.time.day) sf.stage = null;
    if (sf.stage === 'active' && !this.state.events.festival.active) sf.stage = null;
    this.applyCrowns();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    for (const c of this.world.characters) c.flowerCrown = false;
  }

  get sf() {
    return this.state.seasonFestival;
  }

  onHour(hour) {
    const day = this.state.time.day;
    // (26.1) Altın Çağ'dan sonra o günün festivali panayıra (FairSystem) devredilir; Altın Çağ öncesi hiçbir şey değişmez
    if (fairOwnsToday(this.state)) return;
    if (hour === SEASON_FESTIVAL.announceHour && isFestivalDay(day) && this.sf.day !== day) this.announce();
    if (hour === SEASON_FESTIVAL.startHour && this.sf.stage === 'announced' && this.sf.day === day) this.start();
  }

  announce() {
    const theme = getSeason(this.state.time.day).key;
    const festival = SEASON_FESTIVALS[theme];
    Object.assign(this.sf, { day: this.state.time.day, theme, stage: 'announced', startedAt: null, decor: [], attendees: [] });
    this.events.emit('seasonFestival:announced', { festival, theme });
    if (!this.attract) this.events.emit('toast', { text: festival.announce, tone: 'info', icon: festival.icon });
  }

  venueFor(festival) {
    for (const type of festival.venues) {
      const venue = this.world.getCompleted(type).find((b) => !b.damaged);
      if (venue) return venue;
    }
    return null;
  }

  start() {
    const sf = this.sf;
    const festival = SEASON_FESTIVALS[sf.theme];
    const venue = this.venueFor(festival);
    if (!venue) {
      sf.stage = null;
      return false;
    }
    const f = this.state.events.festival;
    const now = this.state.totalMinutes;
    const endsAt = this.state.time.day * 1440 + (SEASON_FESTIVAL.endHour - 24) * 60; // gece yarısı
    Object.assign(f, { active: true, venueId: venue.id, lastDay: this.state.time.day, endsAt, theme: sf.theme });
    this.state.buffs[festival.buff] = endsAt;
    sf.stage = 'active';
    sf.startedAt = now;
    sf.attendees = [];
    sf.decor = this.placeDecor(venue, festival);
    this.applyCrowns();
    this.events.emit('festival:started', { venue, theme: sf.theme, festival });
    if (!this.attract) this.events.emit('toast', { text: festival.started, tone: 'success', icon: festival.icon });
    return true;
  }

  /** Süslemeler: festival yerinin çevresinde, yürünebilir ve boş karolara (yolu kapatmaz; yalnızca çizilir). */
  placeDecor(venue, festival) {
    const map = this.world.map;
    const { w, h } = venue.definition.size;
    const [rMin, rMax] = SEASON_FESTIVAL.decorRadius;
    const candidates = [];
    for (let y = venue.tileY - rMax; y < venue.tileY + h + rMax; y++) {
      for (let x = venue.tileX - rMax; x < venue.tileX + w + rMax; x++) {
        const dx = x < venue.tileX ? venue.tileX - x : x >= venue.tileX + w ? x - (venue.tileX + w - 1) : 0;
        const dy = y < venue.tileY ? venue.tileY - y : y >= venue.tileY + h ? y - (venue.tileY + h - 1) : 0;
        const d = Math.max(dx, dy);
        if (d < rMin || d > rMax || !map.isWalkable(x, y) || map.getOccupant(x, y) !== 0 || map.get(x, y) === 'water') continue;
        candidates.push({ x, y, d });
      }
    }
    // Yerin önüne ve yanlarına yayılsın: adaylar karıştırılır, birbirine çok yakın olanlar atlanır
    const shuffled = this.rng.shuffle(candidates).sort((a, b) => a.d - b.d);
    const decor = [];
    for (const [kind, count] of festival.decor) {
      for (let i = 0; i < count; i++) {
        const spot = shuffled.find((c) => !decor.some((d) => Math.abs(d.tx - c.x) + Math.abs(d.ty - c.y) < 3));
        if (!spot) break;
        decor.push({ kind, tx: spot.x, ty: spot.y, x: spot.x * T + 8, y: spot.y * T + 14 });
      }
    }
    return decor;
  }

  /** İlkbaharın Çiçek Şenliği'nde (duyurudan bitişe kadar) herkes saçına çiçek takar. */
  applyCrowns() {
    const sf = this.sf;
    const on = Boolean(sf.stage && sf.day === this.state.time.day && SEASON_FESTIVALS[sf.theme]?.flowerCrown);
    for (const c of this.world.characters) c.flowerCrown = on;
  }

  update(tick) {
    const sf = this.sf;
    if (sf.stage === 'announced' && sf.day !== this.state.time.day) sf.stage = null; // başlayamadan gün bitti
    if (sf.stage !== 'active' || tick.gameMinutes <= 0) return;
    const festival = SEASON_FESTIVALS[sf.theme];
    const now = this.state.totalMinutes;
    for (const c of this.world.characters) {
      c.flowerCrown = Boolean(festival.flowerCrown);
      if (c.task?.activity !== 'festival' || c.task.phase !== 'perform') continue;
      if (!sf.attendees.includes(c.id)) {
        // İlk varış: ziyafet, elma şırası, aşk ve dostluk
        sf.attendees.push(c.id);
        for (const [need, value] of Object.entries(festival.arrival)) {
          if (need !== 'bubble') c.needs[need] = clamp(c.needs[need] + value, 0, 100);
        }
        if (c.visible) c.showBubble(festival.arrival.bubble, 2.2);
      }
      if (festival.warm) c.buffs.warmUntil = Math.max(c.buffs.warmUntil ?? 0, now + 120); // şölen ateşi ısıtır
    }
  }

  /** Gece yarısı: Mevsim Coşkusu, anılar, sayaç. */
  finish(theme) {
    const sf = this.sf;
    const festival = SEASON_FESTIVALS[theme];
    const attendees = [...(sf.attendees ?? [])];
    sf.stage = null;
    sf.decor = [];
    sf.held = { ...(sf.held ?? {}), [theme]: (sf.held?.[theme] ?? 0) + 1 };
    this.state.stats.seasonFestivals = (this.state.stats.seasonFestivals ?? 0) + 1;
    const buff = SEASON_FESTIVAL.afterglowBuff;
    this.state.buffs[buff] = this.state.totalMinutes + TOWN_BUFFS[buff].hours * 60;
    for (const c of this.state.characters) c.needs.fun = clamp(c.needs.fun + SEASON_FESTIVAL.afterglowFun, 0, 100);
    this.applyCrowns();
    this.events.emit('seasonFestival:ended', { festival, theme, attendees });
    if (!this.attract) this.events.emit('toast', { text: `${festival.ended} (${attendees.length} sakin katıldı)`, tone: 'success', icon: festival.icon });
  }
}
