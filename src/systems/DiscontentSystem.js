// (30.3) "Kararın Ağırlığı": hoşnutsuzluğun görünür basamakları. Sayılar src/data/loyalty.js'te (DISCONTENT), saf hesaplar ./Loyalty.js'te.
// Bütün kancalar ENGINES.discontent ile sarılıdır; kapalıyken hiçbir şey yapmaz ve state.pulse'a dokunmaz.
//
//   Halkın Nabzı : 'loyalty:delta' { character, delta, reason } günün neden toplamlarına yazılır (state.pulse.reasons, son 2 gün);
//                  gün dönümünde yetişkinlerin sadakat ortalaması state.pulse.daily'ye (son 3 gün). Yön oku: saatlik halka (kaydedilmez;
//                  24 saat dolmadıysa günlük ortalamaya bakar). summary(): yüz, ad, yön, kademe sayıları, ilk üç neden, güven.
//   Geri bildirim: oyuncunun yönetim eylemleri ('ui:setTaxRate', dilekçe kabul / karşılama / ret, 'ui:relief', 'ui:condolence',
//                  'ui:giftSpecialDay', 'ui:chooseDilemma') aynı adımda sadakati değiştirirse 'pulse:feedback' { text, tone, count, reason }.
//                  Ön dinleyiciler bu sistem kurulurken (eylemi işleyen sistemlerden ÖNCE), son dinleyiciler attachLate() ile (hepsinden SONRA)
//                  bağlanır. Taziye Sofrası'nın etkisi törenin sonunda (19:00) gelir: 'rite:held' (condolence) aynı satırı yayınlar.
//   İş bırakma   : 10:00'da en az 2 Kırgın yetişkin varsa 'strike:started' { ids } (BehaviorSystem işlerini keser; Brain.planStrike),
//                  12:00'de 'strike:ended' { ids }. Zar çekmez.
//   Homurdanma   : saat başı Homurdanan / Kırgın görünür yetişkin söz üreteciyle (tohum + 41, RiteSystem ile ortak) yakınabilir.
//                  Söz c.grumble'a yazılır (c.speech'e DEĞİL: öteki sistemlerin "süren söz varsa" kuralı ve üreteç sıraları değişmez).
//   Kıtlık       : EconomySystem.eaten (yenen yiyecek değeri) günlük pencerede tutulur (state.pulse.eaten); "≈ N gün yeter" foodDays().
//                  1 günün altına inildiği an 'pantry:low' { buildingId, days } (hikâye kartı; "Git" kileri seçer).
import { DISCONTENT, LOYALTY_LINES, PULSE_REASONS } from '../data/loyalty.js';
import { REVOLT } from '../data/citizens.js';
import { engineOn } from './Engines.js';
import { loyaltyScope, loyaltyLevel, pulseStats, pulseFace, pulseDirection, reasonKey, topReasons, restorePulse, foodDaysLeft, strikerIds, isHangry } from './Loyalty.js';
import { trustValue } from './Citizens.js';
import { foodSupply } from './TownStatus.js';

const on = () => engineOn('discontent');
// Oyuncunun yönetim eylemleri (anında geri bildirim)
const ACTIONS = ['ui:setTaxRate', 'ui:rejectPetition', 'ui:acceptPetition', 'ui:grantPetition', 'ui:relief', 'ui:condolence', 'ui:giftSpecialDay', 'ui:chooseDilemma'];

export class DiscontentSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} speechRng söz üreteci (tohum + 41; RiteSystem ile aynı örnek)
   * @param {{ economy?: import('./EconomySystem.js').EconomySystem }} services
   */
  constructor(game, world, speechRng, { economy = null } = {}) {
    this.game = game;
    this.events = game.events;
    this.world = world;
    this.speech = speechRng; // "rng" değil: aşama testleri sahnedeki .rng üreteçlerini tarar (söz üreteci RiteSystem.rng ile aynı örnek)
    this.economy = economy;
    this.ring = []; // saatlik sadakat ortalaması (kaydedilmez)
    this.capture = null; // süren yönetim eyleminin sadakat değişimleri
    this.passive = new Map(); // Taziye Sofrası'nın (törenin sonunda gelen) değişimleri
    this.lastCause = new Map(); // sakin -> son olumsuz neden (homurdanma sözü; kaydedilmez)
    this.feedback = null; // son geri bildirim { text, tone, count, reason, at }
    this.eatenMark = this.eatenNow();
    this.lowWarned = false;
    this.striking = [];
    this.late = [];
    const sub = (name, fn) => game.events.on(name, (p) => on() && fn(p ?? {}));
    this.unsubscribers = [
      ...ACTIONS.map((name) => sub(name, () => this.begin(name))),
      sub('loyalty:delta', (p) => this.onDelta(p)),
      sub('time:hour', (hour) => this.hourly(Number.isFinite(hour) ? hour : this.state.time.hour)),
      sub('time:newDay', () => this.newDay()),
      sub('rite:held', ({ condolence }) => condolence && this.flushPassive('condolence')),
    ];
  }

  /** Son dinleyiciler: eylemi işleyen bütün sistemlerden SONRA bağlanır (TownScene kurulumun sonunda çağırır). */
  attachLate() {
    for (const name of ACTIONS) this.late.push(this.events.on(name, () => on() && this.end()));
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.late.forEach((off) => off());
  }

  get state() {
    return this.game.state;
  }

  /** state.pulse (yoksa boş kurulur; yalnızca şalter açıkken). */
  get pulse() {
    if (!this.state.pulse) this.state.pulse = restorePulse(null);
    return this.state.pulse;
  }

  // ------------------------------------------------------------------------------------------------------------------- Nabız

  onDelta({ character, delta, reason }) {
    const key = reasonKey(reason);
    if (!key || !delta) return;
    const day = this.state.time.day;
    const reasons = this.pulse.reasons;
    let row = reasons[reasons.length - 1];
    if (!row || row.day !== day) {
      row = { day, totals: {} };
      reasons.push(row);
      while (reasons.length > DISCONTENT.pulse.dayWindow) reasons.shift();
    }
    row.totals[key] = (row.totals[key] ?? 0) + delta;
    if (delta < 0 && character) this.lastCause.set(character.id, key);
    if (this.capture) this.add(this.capture, character, delta, key);
    else if (key === 'condolence') this.add(this.passive, character, delta, key);
  }

  add(map, character, delta, key) {
    const id = character?.id ?? -1;
    const e = map.get(id) ?? { delta: 0, keys: {} };
    e.delta += delta;
    e.keys[key] = (e.keys[key] ?? 0) + delta;
    map.set(id, e);
  }

  newDay() {
    const p = this.pulse;
    const { avg } = pulseStats(this.state);
    p.daily.push(Math.round(avg * 10) / 10);
    while (p.daily.length > DISCONTENT.pulse.dailyKeep) p.daily.shift();
    const day = this.state.time.day;
    p.reasons = p.reasons.filter((r) => r.day > day - DISCONTENT.pulse.dayWindow);
    // Kıtlık: dünkü tüketim pencereye
    const now = this.eatenNow();
    const eaten = Math.max(0, now - this.eatenMark);
    this.eatenMark = now;
    p.eaten = [...(p.eaten ?? []), Math.round(eaten * 10) / 10].slice(-DISCONTENT.famine.windowDays);
  }

  eatenNow() {
    const v = this.economy?.eaten;
    return Number.isFinite(v) ? v : 0;
  }

  /** Nabız özeti (üst çubuk, ipucu, ölçüm). */
  summary() {
    const st = pulseStats(this.state);
    const face = pulseFace(st.avg);
    const ref = this.ring.length >= DISCONTENT.pulse.ringHours ? this.ring[0] : this.state.pulse?.daily?.at(-1);
    const top = topReasons(this.state.pulse?.reasons ?? [], this.state.time.day);
    const trust = Math.round(trustValue(this.state));
    return { avg: st.avg, n: st.n, counts: st.counts, face, name: DISCONTENT.faces[face].name, icon: DISCONTENT.faces[face].icon, dir: pulseDirection(st.avg, ref), top, trust, critical: REVOLT.critical, revolt: Boolean(this.state.trust?.revolt) };
  }

  // ------------------------------------------------------------------------------------------------------------------- Geri bildirim

  begin(action) {
    this.capture = new Map();
    this.captureAction = action;
  }

  end() {
    const map = this.capture;
    this.capture = null;
    if (map) this.report(map);
  }

  flushPassive() {
    const map = this.passive;
    this.passive = new Map();
    this.report(map);
  }

  /** Bir eylemin sadakat değişimlerinden tek satır: "Halk: 12 sakin hoşnutsuz (Ağır Vergi)". Değişim yoksa satır yok. */
  report(map) {
    let net = 0;
    let neg = 0;
    let pos = 0;
    const keys = {};
    for (const e of map.values()) {
      net += e.delta;
      if (e.delta < 0) neg++;
      else if (e.delta > 0) pos++;
      for (const [k, v] of Object.entries(e.keys)) keys[k] = (keys[k] ?? 0) + v;
    }
    if (!neg && !pos) return null;
    const sad = net < 0 || (net === 0 && neg >= pos);
    const reason = Object.entries(keys).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0] ?? 'other';
    const count = sad ? neg : pos;
    const fb = { text: `Halk: ${count} sakin ${sad ? 'hoşnutsuz' : 'memnun'} (${PULSE_REASONS[reason] ?? PULSE_REASONS.other})`, tone: sad ? 'bad' : 'good', count, reason, net, at: this.state.totalMinutes };
    this.feedback = fb;
    this.events.emit('pulse:feedback', fb);
    return fb;
  }

  // ------------------------------------------------------------------------------------------------------------------- Saatlik

  hourly(hour) {
    const { avg } = pulseStats(this.state);
    this.ring.push(avg);
    while (this.ring.length > DISCONTENT.pulse.ringHours) this.ring.shift();
    this.checkPantry();
    const [h0, h1] = DISCONTENT.strike.hours;
    if (hour === h0) {
      this.striking = strikerIds(this.state);
      if (this.striking.length) this.events.emit('strike:started', { ids: [...this.striking] });
    } else if (hour === h1 && this.striking.length) {
      const ids = this.striking;
      this.striking = [];
      this.events.emit('strike:ended', { ids });
    }
    this.grumble();
  }

  /** Homurdanan / Kırgın sakinler ara sıra yönetimden yakınır (söz üreteci; oynanışı etkilemez). */
  grumble() {
    if (!this.speech) return;
    const g = DISCONTENT.grumble;
    for (const c of this.state.characters) {
      if (!loyaltyScope(c) || !c.visible || c.away || c.isSleeping || c.grumble) continue;
      const level = loyaltyLevel(c);
      if (level !== 'grumbling' && level !== 'bitter') continue;
      const kind = c.task?.activity ? c.task.activity : 'idle';
      if (kind === 'sleep') continue;
      if (this.speech.next() >= g.chance * (level === 'bitter' ? g.bitterMul : 1)) continue;
      const lines = LOYALTY_LINES[this.causeOf(c)] ?? LOYALTY_LINES.general;
      c.grumble = { text: lines[Math.floor(this.speech.next() * lines.length)], at: -1, duration: g.seconds };
    }
  }

  /** Sözün nedeni: açlık > son olumsuz neden (vergi / dilekçe / soğuk) > Ağır Vergi > genel. */
  causeOf(c) {
    if (isHangry(c)) return 'hunger';
    const k = this.lastCause.get(c.id);
    if (k?.startsWith('tax:')) return 'tax';
    if (k === 'petitionRejected' || k === 'petitionExpired' || k === 'neglected') return 'petition';
    if (k === 'cold') return 'cold';
    if (k === 'hunger') return 'hunger';
    if (this.state.tax?.rate === 'heavy') return 'tax';
    return 'general';
  }

  // ------------------------------------------------------------------------------------------------------------------- Kıtlık

  /** Kiler kaç gün yeter (≈). */
  foodDays() {
    return foodDaysLeft(foodSupply(this.state), this.state.pulse?.eaten);
  }

  checkPantry() {
    const days = this.foodDays();
    if (days >= DISCONTENT.famine.redBelowDays) {
      this.lowWarned = false;
      return;
    }
    if (this.lowWarned) return;
    this.lowWarned = true;
    const storage = this.world.getCompleted?.('storage')?.[0] ?? null;
    this.events.emit('pantry:low', { buildingId: storage?.id ?? null, days });
  }
}
