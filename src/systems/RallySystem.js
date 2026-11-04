// Toplanma Zili (14. aşama): oyuncu meydan havuzunun ya da Belediye Konağı'nın panelinden zili çalar ('ui:rallyBell');
// kasaba çanı çalar, uyanık bütün sakinler elindekini bırakıp 1 oyun saatliğine meydanda toplanır (Brain -> rally).
// Şenlikleri ya da kasabayı toplu hâlde seyretmek için bir sandbox oyuncağı. Zil 3 saatte bir çalınabilir.
// Durum state.rally'dedir: { until, rungAt, venueId } ya da null. Olaylar: 'rally:rung' { venue }, 'rally:ended'.
export const RALLY = { minutes: 60, cooldownMinutes: 180 };

/** Meydanın toplanma yeri: meydan havuzu (yoksa kamp ateşi). */
function rallyVenue(state) {
  return state.buildings.find((b) => b.type === 'fountain' && b.functional) ?? state.buildings.find((b) => b.type === 'campfire' && b.functional) ?? null;
}

/** Zil çalınabilir mi? { ok, reason, waitMinutes } */
export function rallyStatus(state) {
  if (!rallyVenue(state)) return { ok: false, reason: 'Meydanda toplanılacak bir havuz ya da ateş yok' };
  const now = state.totalMinutes;
  if (state.rally && now < state.rally.until) return { ok: false, reason: 'Sakinler zaten meydanda toplanıyor' };
  if (state.rally && now - state.rally.rungAt < RALLY.cooldownMinutes) {
    const waitMinutes = RALLY.cooldownMinutes - (now - state.rally.rungAt);
    return { ok: false, reason: `Zil ${Math.ceil(waitMinutes / 60)} saat sonra yeniden çalınabilir`, waitMinutes };
  }
  return { ok: true, reason: null };
}

/** Toplanma sürüyor mu? */
export function isRallyActive(state) {
  return Boolean(state.rally) && state.totalMinutes < state.rally.until;
}

export class RallySystem {
  /** @param {import('../core/Game.js').Game} game */
  constructor(game) {
    this.state = game.state;
    this.events = game.events;
    this.unsubscribers = [game.events.on('ui:rallyBell', () => this.ring())];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  ring() {
    const status = rallyStatus(this.state);
    if (!status.ok) {
      this.events.emit('toast', { text: `Toplanma Zili: ${status.reason}`, tone: 'warn', icon: 'bell' });
      return status;
    }
    const venue = rallyVenue(this.state);
    const now = this.state.totalMinutes;
    this.state.rally = { until: now + RALLY.minutes, rungAt: now, venueId: venue.id };
    this.state.stats.rallies = (this.state.stats.rallies ?? 0) + 1;
    this.events.emit('rally:rung', { venue });
    this.events.emit('toast', { text: 'Kasaba çanı çaldı! Sakinler bir saatliğine meydanda toplanıyor.', tone: 'info', icon: 'bell' });
    return { ok: true };
  }

  update() {
    const rally = this.state.rally;
    if (rally && !rally.ended && this.state.totalMinutes >= rally.until) {
      rally.ended = true;
      this.events.emit('rally:ended', {});
    }
  }
}
