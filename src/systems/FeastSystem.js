// (26. aşama, 26.2) Geleneksel İkramlar: Büyük Ziyafet Sofrası. Kurallar src/data/feast.js'te, saf hesaplar src/systems/Feast.js'te.
//
//   06:00 'fair:prep'      : meydan havuzunun yanına sofra kurulur; kilerden erzak ayrılır (Feast.planFeast: kişi başı besin 3'ün altına
//                            inmez; kıtlıkta kilerden hiçbir şey ayrılmaz, yalnızca Sembolik İkram). Fıçı Şerbeti ve Kumaş varsa Zengin Şölen
//                            Sofrası. Gündüz mesaisine dokunulmaz: hiçbir sakin sofraya yönlendirilmez.
//   18:00 'festival:started' { fair }: şenlik saati; Gelenek Bağı (+ zengin sofrada Bolluk Ziyafeti) bonusları ertesi sabaha kadar, kasaba
//                            güveni +5 / +10 ('feast:started' -> TrustSystem). Şenlikte dans eden sakin sofradan tek ikram alır (tokluk, keyif,
//                            sosyallik); zengin sofrada şerbet içenler Keyifli Damak'la güne başlar.
//   Süresince              : hafif yaralılar 2 kat hızlı iyileşir; sofrada neşeli kadeh / lokma sözleri (c.speech: AYRI metin katmanı),
//                            Şenlik Neşesi şarkı tutturur, Zanaatkâr Ruhu işçiliği över, Girişimci Kanı bolluğu ticaret itibarına yorar.
//   22:00 'fair:ended'     : sofra toplanır, yenmeyen erzak kilere döner.
// KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 33): yalnızca söz seçimi. Durum: state.currentFeast (kayda girer), stats.feasts.
// Olaylar: 'feast:set' { feast, tier }, 'feast:started' { tier }, 'feast:ended' { tier, served, total, refund }.
import { FEAST, TIERS, TOAST_LINES, QUIRK_LINES } from '../data/feast.js';
import { INJURY } from '../data/crisis.js';
import { TOWN_BUFFS } from '../data/town.js';
import { clamp } from '../utils/math.js';
import { planFeast } from './Feast.js';
import { palateUntil } from './Refinery.js';
import { currentFair } from './Fair.js';

export class FeastSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng yalnızca bu sistemin üreteci (seed + 33)
   * @param {{ crisis?: import('./CrisisSystem.js').CrisisSystem, attract?: boolean }} options
   */
  constructor(game, world, rng, { crisis = null, attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.crisis = crisis;
    this.attract = attract;
    this.unsubscribers = [
      game.events.on('fair:prep', () => this.setTable()),
      game.events.on('festival:started', ({ fair } = {}) => fair && this.beginParty()),
      game.events.on('fair:ended', () => this.clearTable()),
      game.events.on('time:hour', () => this.dropStale()),
    ];
    this.reconcile();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get feast() {
    return this.state.currentFeast;
  }

  /** Kayıttan: panayırsız ya da başka güne ait sofra temizlenir (artık erzak kilere dönmez: kayıt anında zaten ayrılmıştı). */
  reconcile() {
    if (this.feast && !currentFair(this.state)) this.state.currentFeast = null;
    else if (this.feast && this.feast.day !== this.state.time.day) this.state.currentFeast = null;
  }

  dropStale() {
    if (this.feast && (this.feast.day !== this.state.time.day || !currentFair(this.state))) this.state.currentFeast = null;
  }

  /** 06:00: sofrayı kur, kilerden ayır. */
  setTable() {
    if (this.feast) return false;
    const plan = planFeast(this.state);
    const res = this.state.resources;
    for (const key of ['food', 'bread', 'sherbet', 'cloth']) res[key] = Math.max(0, (res[key] ?? 0) - plan.contributions[key]);
    this.state.currentFeast = { tier: plan.tier, day: this.state.time.day, contributions: { ...plan.contributions }, servings: plan.servings, served: 0 };
    this.events.emit('feast:set', { feast: this.feast, tier: plan.tier });
    return true;
  }

  /** 18:00: şenlik saati; bonuslar ve güven. */
  beginParty() {
    const feast = this.feast;
    if (!feast || feast.day !== this.state.time.day) return false;
    const endsAt = this.state.totalMinutes + (22 - this.state.time.hour) * 60 - this.state.time.minute + FEAST.afterglowHours * 60;
    for (const key of FEAST.buffs[feast.tier]) this.state.buffs[key] = Math.max(this.state.buffs[key] ?? 0, endsAt);
    this.events.emit('feast:started', { tier: feast.tier });
    if (!this.attract) this.events.emit('toast', { text: `${TIERS[feast.tier].name}: sofra açıldı, kadehler kalkıyor!`, tone: 'success', icon: TIERS[feast.tier].icon });
    return true;
  }

  /** 22:00: sofrayı topla; yenmeyen erzak kilere döner. */
  clearTable() {
    const feast = this.feast;
    if (!feast) return false;
    const frac = feast.servings > 0 ? (feast.servings - feast.served) / feast.servings : 0;
    const refund = { food: Math.floor(feast.contributions.food * frac), bread: Math.floor(feast.contributions.bread * frac) };
    this.state.resources.food = (this.state.resources.food ?? 0) + refund.food;
    this.state.resources.bread = (this.state.resources.bread ?? 0) + refund.bread;
    this.state.stats.feasts = (this.state.stats.feasts ?? 0) + 1;
    this.state.stats.feastServings = (this.state.stats.feastServings ?? 0) + feast.served;
    this.state.currentFeast = null;
    this.events.emit('feast:ended', { tier: feast.tier, served: feast.served, total: feast.servings, refund });
    return true;
  }

  /** Şenlik saatinde: ikramlar, iyileşme, sözler. */
  update(tick) {
    const fair = currentFair(this.state);
    const feast = this.feast;
    if (!feast || fair?.phase !== 'party' || !(tick.gameMinutes > 0)) return;
    const minutes = tick.gameMinutes;
    const now = this.state.totalMinutes;
    const fill = FEAST.fill[feast.tier];
    for (const c of this.state.characters) {
      // Hafif yaralılar: iyi beslenme ve moral (Gelenek Bağı) sürerken iki kat hızlı iyileşir (ek dakika; uyurken evde iki kat yine geçerli)
      if (c.isInjured && (this.state.buffs.tradition ?? -1) > now) {
        const sleepingHome = c.isSleeping && c.insideBuildingId === c.homeId;
        c.injuryTimer -= minutes * (FEAST.healMultiplier - 1) * (sleepingHome ? INJURY.sleepRecovery : 1);
        if (c.injuryTimer <= 0 && this.crisis) this.crisis.heal(c, 'natural');
      }
      if (c.task?.activity !== 'festival' || c.task.phase !== 'perform') continue;
      if (c.feasted !== feast.day && feast.served < feast.servings) this.serve(c, feast, fill, now);
      if (c.feasted === feast.day) this.maybeSpeak(c, feast, minutes);
    }
  }

  /** Sofraya gelen sakin tek ikram alır (sofra boşalınca ikram biter). */
  serve(c, feast, fill, now) {
    c.feasted = feast.day; // yalnızca bellekte (kayda girmez)
    feast.served += 1;
    c.needs.hunger = clamp(c.needs.hunger + fill.hunger, 0, 100);
    c.needs.fun = clamp(c.needs.fun + fill.fun, 0, 100);
    c.needs.social = clamp(c.needs.social + fill.social, 0, 100);
    if (feast.tier === 'rich' && feast.contributions.sherbet > 0) c.buffs.merryPalate = Math.max(c.buffs.merryPalate ?? 0, palateUntil(now)); // Keyifli Damak
  }

  maybeSpeak(c, feast, minutes) {
    if (!c.visible || c.speech) return;
    const quirk = QUIRK_LINES[c.quirk];
    const mul = c.quirk === 'festive' ? FEAST.festiveSpeechMul : c.quirk === 'craftsman' ? FEAST.craftsmanSpeechMul : c.quirk === 'entrepreneur' ? FEAST.entrepreneurSpeechMul : 1;
    if (this.rng.next() >= FEAST.speechPerMinute * mul * minutes) return;
    // Huya özgü söz çoğunlukla; yoksa genel kadeh / lokma sözü
    const lines = quirk && this.rng.next() < 0.7 ? quirk : TOAST_LINES[feast.tier];
    c.speech = { text: this.rng.pick(lines), at: -1, duration: FEAST.speechSeconds };
  }
}

for (const key of Object.values(FEAST.buffs).flat()) if (!TOWN_BUFFS[key]) throw new Error(`TOWN_BUFFS.${key} yok`);
