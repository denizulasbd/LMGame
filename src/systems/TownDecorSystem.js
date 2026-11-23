// (31. aşama) Kasaba Süsleri sistemi: İlan Tahtası'nın dilekçe süresi, Müzik Köşkü'nün Akşam Konseri, Kahraman Heykeli'nin
// onurlandırılması ve yakınlarının gururu; süs yapılarının görünüm durumu (building.look, kaydedilmez). Zar çekmez.
// Olaylar: dinler 'petition:opened', 'ui:startConcert' { buildingId }, 'ui:honorStatue' { buildingId, characterId };
//          yayınlar 'concert:started' { building, bard }, 'concert:ended' { building, listeners }, 'statue:honored' { building, character }.
// Şalter ENGINES.townDecor: kapalıyken hiçbir olaya karşılık vermez, görünüm durumu yazmaz.
import { CONFIG } from '../config.js';
import { NOTICE_BOARD, BANDSTAND, HERO_STATUE } from '../data/townDecor.js';
import { engineOn } from './Engines.js';
import { clamp } from '../utils/math.js';
import {
  hasNoticeBoard,
  noticeLook,
  woodpileFill,
  scarecrowLook,
  concertStatus,
  isConcert,
  bardInTown,
  listening,
  statuePose,
  statueCandidates,
  statueKin,
} from './TownDecor.js';

const T = CONFIG.TILE_SIZE;

export class TownDecorSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy, trust, moodlets }} deps
   */
  constructor(game, world, { economy, trust, moodlets }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.trust = trust;
    this.moodlets = moodlets;
    this.lastMinute = Math.floor(this.state.totalMinutes);
    this.lastPride = Math.floor(this.state.totalMinutes / 10);
    this.concertId = null; // süren konserin köşkü (bitişi yakalamak için)
    this.listeners = new Set();
    this.unsubscribers = [
      game.events.on('petition:opened', ({ petition }) => this.notePetition(petition)),
      game.events.on('ui:startConcert', ({ buildingId }) => this.startConcert(buildingId)),
      game.events.on('ui:honorStatue', ({ buildingId, characterId }) => this.honor(buildingId, characterId)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** İlan Tahtası: yeni dilekçe tahtaya asılır, komşular okur; süresi uzar. */
  notePetition(p) {
    if (!p || p.noticed || !hasNoticeBoard(this.state)) return;
    p.deadline += NOTICE_BOARD.petitionExtraMinutes;
    p.noticed = true;
  }

  startConcert(buildingId) {
    if (!engineOn('townDecor')) return { ok: false };
    const s = this.state;
    const stand = this.world.getBuilding(buildingId);
    if (!stand || stand.type !== 'bandstand') return { ok: false };
    const status = concertStatus(s, stand);
    if (!status.ok) {
      this.events.emit('toast', { text: `Akşam Konseri: ${status.reason}`, tone: 'warn', icon: 'melody' });
      return status;
    }
    if (!this.economy.spend({ gold: BANDSTAND.concertGold })) return { ok: false };
    const now = s.totalMinutes;
    s.rally = { until: now + BANDSTAND.minutes, rungAt: now, venueId: stand.id, concert: true };
    stand.decor = { ...(stand.decor ?? {}), concertAt: now, concerts: (stand.decor?.concerts ?? 0) + 1 };
    this.concertId = stand.id;
    this.listeners = new Set();
    const bard = bardInTown(s);
    this.events.emit('concert:started', { building: stand, bard });
    this.events.emit('toast', {
      text: bard ? 'Akşam Konseri başladı! Seyyar Ozan da sahnede: kasaba köşkün önünde toplanıyor.' : 'Akşam Konseri başladı! Sakinler Müzik Köşkü\'nün önünde toplanıyor.',
      tone: 'info',
      icon: 'melody',
    });
    return { ok: true };
  }

  honor(buildingId, characterId) {
    if (!engineOn('townDecor')) return { ok: false };
    const statue = this.world.getBuilding(buildingId);
    if (!statue || statue.type !== 'heroStatue' || !statue.functional || Number.isFinite(statue.decor?.honoreeId)) return { ok: false };
    const c = statueCandidates(this.state).find((x) => x.id === characterId);
    if (!c) return { ok: false };
    statue.decor = { ...(statue.decor ?? {}), honoreeId: c.id, honoreeName: c.name, pose: statuePose(c), honoredDay: this.state.time.day };
    this.events.emit('statue:honored', { building: statue, character: c });
    this.events.emit('toast', { text: `${c.name} adına heykel dikildi. Adı künyede, ailesi gururlu.`, tone: 'info', icon: 'masterpiece' });
    return { ok: true };
  }

  update() {
    if (!engineOn('townDecor')) return;
    const s = this.state;
    this.refreshLooks();
    const minute = Math.floor(s.totalMinutes);
    const steps = Math.min(30, minute - this.lastMinute);
    this.lastMinute = minute;
    if (steps > 0) this.concertMinutes(steps);
    const pride = Math.floor(s.totalMinutes / 10);
    if (pride !== this.lastPride) {
      this.lastPride = pride;
      this.statuePride();
    }
  }

  /** Görünüm durumu (Building.currentSprite okur; kaydedilmez). */
  refreshLooks() {
    const s = this.state;
    let notice = null;
    let fill = null;
    for (const b of this.world.buildings) {
      if (!b.functional) continue;
      switch (b.type) {
        case 'noticeBoard':
          notice ??= noticeLook(s);
          b.look = notice;
          break;
        case 'woodpile':
          fill ??= woodpileFill(s);
          b.look = { fill };
          break;
        case 'scarecrow':
          b.look = scarecrowLook(s, b, s.totalMinutes / 6);
          break;
        case 'bandstand':
          b.look = { concert: isConcert(s) && s.rally.venueId === b.id };
          break;
        case 'heroStatue':
          b.look = { pose: b.decor?.pose ?? null };
          break;
        default:
          break;
      }
    }
  }

  /** Konser dakikaları: dinleyenlerin keyfi ve sosyalliği dolar; bitişte güven. */
  concertMinutes(steps) {
    const s = this.state;
    if (isConcert(s)) {
      const stand = this.world.getBuilding(s.rally.venueId);
      if (!stand) return;
      this.concertId = stand.id;
      const mul = bardInTown(s) ? BANDSTAND.bardMul : 1;
      for (const c of s.characters) {
        if (c.away || c.isSleeping || c.role || !listening(stand, c, T)) continue;
        c.needs.fun = clamp(c.needs.fun + BANDSTAND.funPerMinute * mul * steps, 0, 100);
        c.needs.social = clamp(c.needs.social + BANDSTAND.socialPerMinute * mul * steps, 0, 100);
        if (!this.listeners.has(c.id)) {
          this.listeners.add(c.id);
          this.moodlets?.apply(c, 'warm_chat', { reason: 'concert' });
        }
      }
      return;
    }
    if (this.concertId !== null) {
      const stand = this.world.getBuilding(this.concertId);
      const listeners = this.listeners.size;
      this.concertId = null;
      this.listeners = new Set();
      this.trust?.adjust(BANDSTAND.trust, 'concert');
      s.stats.concerts = (s.stats.concerts ?? 0) + 1;
      this.events.emit('concert:ended', { building: stand, listeners });
    }
  }

  /** Kahraman Heykeli: yakınından geçen aile bireyleri gururlanır (moodlet günde bir tazelenir). */
  statuePride() {
    for (const statue of this.world.buildings) {
      if (statue.type !== 'heroStatue' || !statue.functional || !Number.isFinite(statue.decor?.honoreeId)) continue;
      const cx = (statue.tileX + 1) * T;
      const cy = (statue.tileY + 1) * T;
      for (const c of statueKin(this.state, statue.decor.honoreeId)) {
        if (c.away || Math.hypot(c.x - cx, c.y - cy) > HERO_STATUE.radius * T) continue;
        this.moodlets?.apply(c, 'celebrated', { reason: 'ancestor_pride', whoId: statue.decor.honoreeId, whoName: statue.decor.honoreeName });
      }
    }
  }
}
