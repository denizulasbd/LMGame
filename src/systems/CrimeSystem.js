// (32.1) Suç Motoru: küçük, insani, hafif mizahi suçlar (şiddet, silah, hapis yok). Sayılar data/justice.js'te, saf hesaplar
// ./Justice.js'te. Bütün kancalar ENGINES.justice ile sarılıdır; kapalıyken hiçbir şey yapmaz ve state.justice'e dokunmaz.
// İsyandan bağımsızdır: yağma koduna, trust.revolt akışına ve isyan çiplerine dokunmaz.
//
//   Plan      : 08:00'da (izole üreteç tohum + 42; ana üreteçlerden zar ÇEKİLMEZ) o günün en çok 1 suçu (kasaba 20 sakini aşınca 2)
//               planlanır: aday sakinlerin risk toplamı kadar olasılıkla bir yuva dolar, sakin riskiyle ağırlıklı seçilir, motivasyon
//               riskin baskın çarpanından, suç türü ve hedef ağırlıklı seçeneklerden. Sakine geçici (kaydedilmeyen) c.crimePlan yazılır
//               { crime, variant, buildingId?, victimId?, motive, at, until, duration }. Pencere (5 saat) geçerse plan düşer.
//   Eylem     : Brain.planCrime boş zamanda / molada (planLeisure'dan hemen önce) sakini hedefin kapısına götürür ('pilfer');
//               bitince 'crime:committed' (activities.finishEvent). Vakti gelen sakin uzun bir boş zaman / sohbet görevindeyse saat
//               başı görevi bırakır ('crime:nudge'; şenlik, iş, uyku bölünmez). Yüklemede yarım kalan plan ve görev sessizce düşer.
//   Kayıt     : çalınan mal yok olmaz, suçlunun çantasına / kesesine geçer (stok aynı miktarda düşer). Tanık aranır (Justice.catchChance);
//               yakalanan dava açık kalır (state.justice.cases), yakalanmayan 'unsolved' kapanmış olarak günlüğe (log) girer.
//   Kapanış   : Adalet Sarayı yokken açık dava bir gün sonra Muhtar uyarısıyla kendiliğinden kapanır (closeCase; tek kapanış yolu).
//               Güven, sadakat, refah etkisi yok; yalnızca sicile (records) yazılır. 32.2 dava penceresi closeCase'i kendi kararıyla çağırır.
//   Görünürlük: hikâye kartı ('crime:caught' / 'crime:unsolved'), Kasaba Günlüğü satırı, suçlunun ve kurbanın anısı, sayaçlar
//               (state.justice.stats). Yakalanınca kurbanla küçük bir ilişki düşüşü (RelationshipSystem.add).
//   Temizlik  : ayrılan / ölen sakinin açık davası düşer, kapanmış davalardaki kimliği null olur, sicilden silinir (Justice.pruneJustice).
import { JUSTICE, CRIMES, CRIME_BUBBLES, CRIME_TEXT, VICTIM_RELATION } from '../data/justice.js';
import { SOUVENIRS } from '../data/citizens.js';
import { engineOn } from './Engines.js';
import { ACTIVITIES } from '../data/activities.js';
import { addItem, takeItem, addCoins } from './Citizens.js';
import { addMemory } from './MemorySystem.js';
import { loyaltyLevel } from './Loyalty.js';
import { getFriendship } from './RelationshipSystem.js';
import {
  emptyJustice, pruneJustice, justiceActive, crimeCandidate, crimeReady, slotsFor, riskFactors, crimeRisk, motiveOf, crimeOptions,
  crimeAmount, severityOf, catchChance, remorseWeights, autoVerdict, caseText, isHungry, welfareOf, trustOf,
} from './Justice.js';

const on = () => engineOn('justice');

export class CrimeSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy: import('./EconomySystem.js').EconomySystem, relationships: import('./RelationshipSystem.js').RelationshipSystem }} services
   * @param {import('../utils/random.js').Random} dice izole üreteç (tohum + 42). "rng" değil: aşama testleri sahnedeki .rng üreteçlerini
   *   tarayıp sızıntı arar; bu üreteç yalnızca suç kararlarında ilerler.
   */
  constructor(game, world, { economy, relationships }, dice) {
    this.game = game;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.relationships = relationships;
    this.dice = dice;
    this.scuffed = new Map(); // haylazlık işareti: yapı kimliği -> bitiş dakikası (kaydedilmez)
    const sub = (name, fn) => game.events.on(name, (p) => on() && fn(p ?? {}));
    this.unsubscribers = [
      game.events.on('time:hour', (hour) => on() && this.hourly(Number.isFinite(hour) ? hour : this.state.time.hour)),
      sub('crime:committed', ({ character, task, building }) => this.commit(character, task, building)),
      sub('population:left', () => this.prune()),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get state() {
    return this.game.state;
  }

  /** state.justice (ilk suçta kurulur; boşsa kayda yazılmaz). */
  get justice() {
    return (this.state.justice ??= emptyJustice());
  }

  // ------------------------------------------------------------------------------------------------------------------- saatlik

  hourly(hour) {
    const now = this.state.totalMinutes;
    for (const c of this.state.characters) {
      if (!c.crimePlan || now <= c.crimePlan.until) continue;
      delete c.crimePlan; // pencere geçti: sakin boş zaman bulamadı
      this.events.emit('crime:dropped', { character: c, reason: 'window' });
    }
    if (hour === JUSTICE.planHour) this.planDay();
    this.nudge(now, hour);
    this.closeDue(now);
    for (const [id, until] of this.scuffed) {
      if (now < until) continue;
      this.scuffed.delete(id);
      const b = this.world.getBuilding(id);
      if (b) b.scuffed = false;
    }
    this.prune();
  }

  /** Günün suçlarını planlar (izole üreteç). Dönüş: planlanan sakinler. */
  planDay() {
    const s = this.state;
    for (const c of s.characters) delete c.crimePlan;
    if (!justiceActive(s)) return [];
    const pool = [];
    for (const c of s.characters) {
      if (!crimeCandidate(s, c)) continue;
      const f = riskFactors(s, c);
      const risk = crimeRisk(s, c, f);
      if (risk > 0) pool.push({ c, f, risk });
    }
    const planned = [];
    const dayStart = (s.time.day - 1) * 1440;
    const rel = (a, b) => getFriendship(s, a, b);
    for (let slot = 0; slot < slotsFor(s) && pool.length; slot++) {
      const total = pool.reduce((a, x) => a + x.risk, 0);
      if (this.dice.next() >= Math.min(JUSTICE.maxDailyChance, total)) continue;
      const pick = this.dice.weighted(pool.map((x) => [x, x.risk]));
      pool.splice(pool.indexOf(pick), 1);
      const motive = motiveOf(pick.c, pick.f);
      const option = this.dice.weighted(crimeOptions(s, pick.c, motive, rel));
      const hour = this.dice.int(JUSTICE.hours[0], JUSTICE.hours[1] - 1);
      const at = dayStart + hour * 60 + this.dice.int(0, 59);
      const duration = this.dice.int(JUSTICE.duration[0], JUSTICE.duration[1]);
      if (!option) continue;
      const until = Math.min(at + JUSTICE.windowHours * 60, dayStart + JUSTICE.dayEndHour * 60);
      pick.c.crimePlan = { ...option, motive, at, until, duration, factors: pick.f };
      planned.push(pick.c);
      this.events.emit('crime:planned', { character: pick.c, plan: pick.c.crimePlan });
    }
    return planned;
  }

  /**
   * Vakti gelen planlı sakin uzun bir boş zaman / sohbet görevindeyse (meydan, ateş başı, bank) görevi bırakır ki Brain yeniden
   * karar versin ('crime:nudge'; BehaviorSystem.interrupt). Şenlik, iş, uyku ve içerideki sakin bölünmez. Zar çekmez.
   */
  nudge(now, hour) {
    const ids = [];
    for (const c of this.state.characters) {
      const p = c.crimePlan;
      if (!p || now < p.at || !c.visible || !c.task || !crimeReady(this.state, c, hour)) continue;
      const kind = ACTIVITIES[c.task.activity]?.kind;
      if (JUSTICE.nudgeKinds.includes(kind)) ids.push(c.id);
    }
    if (ids.length) this.events.emit('crime:nudge', { ids });
  }

  // ------------------------------------------------------------------------------------------------------------------- eylem

  /** Eylem bitti ('crime:committed'): malı aktarır, tanık arar, davayı yazar. Dönüş: dava ya da null (bir şey olmadıysa). */
  commit(c, task, building) {
    const plan = task?.crime;
    const s = this.state;
    if (!c || !plan || !CRIMES[plan.crime] || !s.characters.includes(c)) return null;
    const victim = plan.victimId !== undefined ? this.world.getCharacter(plan.victimId) : null;
    if (plan.victimId !== undefined && !victim) return null;
    const target = plan.buildingId !== undefined ? this.world.getBuilding(plan.buildingId) : null;
    if (plan.buildingId !== undefined && !target?.functional) return null;
    // Bağlam (eylemden önce): açlık, kese, sadakat, refah, güven, tekrar
    const j = this.justice;
    const context = {
      hungry: isHungry(c),
      coins: c.coins ?? 0,
      loyaltyTier: loyaltyLevel(c),
      welfare: Math.round(welfareOf(s)),
      trust: Math.round(trustOf(s)),
      repeat: (j.records[c.id]?.count ?? 0) + j.cases.filter((k) => k.offenderId === c.id).length,
      ageStage: c.lifeStage,
    };
    // Mal: stoktan / handan / tezgâhtan / keseden suçlunun çantasına ya da kesesine
    let stolen = null;
    let lootName = null;
    if (plan.crime !== 'pettyVandal') {
      stolen = crimeAmount(s, c, plan, this.dice.next(), { building: target, victim });
      if (!stolen) return null;
      const def = CRIMES[plan.crime].variants[plan.variant];
      if (stolen.coins) {
        const moved = Math.min(stolen.amount, victim.coins ?? 0);
        victim.coins = (victim.coins ?? 0) - moved;
        const got = addCoins(c, moved);
        if (got < moved) victim.coins += moved - got;
        stolen.amount = got;
      } else {
        if (stolen.item === 'souvenir') lootName = this.dice.pick(SOUVENIRS);
        let got = addItem(c, stolen.item, stolen.amount, lootName);
        if (def.source === 'stock' && got > 0 && !this.economy.spend({ [stolen.resource]: got })) {
          takeItem(c, stolen.item, got);
          got = 0;
        } else if (def.source === 'inn' && got > 0) target[def.field] = Math.max(0, (target[def.field] ?? 0) - got);
        stolen.amount = got;
      }
      stolen.value = stolen.amount * (def.value ?? 1);
      if (stolen.amount <= 0) return null;
    }
    // Tanık ve yakalanma
    const spot = { x: c.tileX, y: c.tileY };
    const chance = catchChance(s, c, spot, { victim });
    const caught = this.dice.next() < chance.p;
    let witness = null;
    if (caught && chance.witnesses.length) {
      const guards = chance.witnesses.filter((w) => w.guard);
      witness = guards.length ? guards[0] : this.dice.weighted(chance.witnesses.map((w) => [w, w.p]));
    }
    const remorse = this.dice.weighted(remorseWeights(c, plan.motive));
    const now = s.totalMinutes;
    const k = {
      id: j.nextId++,
      day: s.time.day,
      minute: now,
      crime: plan.crime,
      variant: plan.variant,
      severity: severityOf(plan, target),
      motive: plan.motive,
      offenderId: c.id,
      offenderName: c.name,
      ...(victim ? { victimId: victim.id, victimName: victim.name } : {}),
      ...(target ? { buildingId: target.id, buildingName: target.name } : {}),
      stolen,
      ...(witness ? { witnessId: witness.id, witnessName: witness.name } : {}),
      witnessIsGuard: Boolean(witness?.guard),
      context,
      remorse,
      deadline: now + JUSTICE.closeAfterMinutes,
      status: caught ? 'open' : 'closed',
      verdict: null,
      ...(caught ? {} : { unsolved: true, closedDay: s.time.day }),
    };
    const st = j.stats;
    st.committed += 1;
    st.byType[k.crime] = (st.byType[k.crime] ?? 0) + 1;
    if (caught) {
      st.caught += 1;
      j.cases.push(k);
    } else {
      st.unsolved += 1;
      this.pushLog(k);
    }
    this.announce(k, c, { victim, witness: witness ? this.world.getCharacter(witness.id) : null, target, lootName });
    if (target && plan.crime === 'pettyVandal') {
      target.scuffed = true; // görünür etki: küçük onarım işareti (kaydedilmez; hasar sistemi çağrılmaz)
      this.scuffed.set(target.id, now + JUSTICE.vandalHours * 60);
    }
    if (caught && victim && this.relationships) this.relationships.add(victim, c, VICTIM_RELATION);
    this.events.emit('crime:recorded', { kase: k, caught });
    return k;
  }

  /** Kart, günlük, anılar, balon. */
  announce(k, c, { victim, witness, target, lootName }) {
    const s = this.state;
    const opts = { lootName, buildingType: target?.type ?? null };
    const caught = k.status === 'open';
    const text = caseText(k, caught ? 'caught' : 'unsolved', opts);
    const entry = s.addJournal(caseText(k, caught ? 'journalCaught' : 'journalUnsolved', opts), caught ? 'shield' : 'whisper');
    this.events.emit('journal:added', entry);
    addMemory(s, c, caseText(k, caught ? 'memoryCaught' : 'memoryUnsolved', opts), caught ? 'sweat' : 'whisper', { kind: 'life', fond: !caught, ...(witness ? { whoId: witness.id } : {}) });
    if (victim) addMemory(s, victim, caseText(k, caught ? 'memoryVictimCaught' : 'memoryVictimUnsolved', opts), 'purse', { kind: 'life', fond: false, ...(caught ? { whoId: c.id } : {}) });
    if (c.visible) c.showBubble(caught ? CRIME_BUBBLES.caught : CRIME_BUBBLES.unsolved, 2.4);
    this.events.emit(caught ? 'crime:caught' : 'crime:unsolved', { kase: k, text, character: c, witness, victim, building: target });
  }

  // ------------------------------------------------------------------------------------------------------------------- kapanış

  closeDue(now = this.state.totalMinutes) {
    const j = this.state.justice;
    if (!j?.cases.length) return;
    for (const k of [...j.cases]) {
      const verdict = autoVerdict(this.state, k, now);
      if (verdict) this.closeCase(k, verdict);
    }
  }

  /**
   * Davayı kapatır (TEK kapanış yolu; 32.2 dava penceresi kendi kararıyla çağırır). verdict: { kind, by, auto }. Sicile yazar,
   * açık listeden kapanmış günlüğe taşır. Güven / sadakat / refah etkisi YOK (32.1). Dönüş: dava ya da null.
   */
  closeCase(k, verdict) {
    const j = this.state.justice;
    const i = j?.cases.indexOf(k) ?? -1;
    if (i < 0) return null;
    j.cases.splice(i, 1);
    const day = this.state.time.day;
    k.status = 'closed';
    k.verdict = { kind: verdict.kind, by: verdict.by, auto: Boolean(verdict.auto), day };
    k.closedDay = day;
    const r = (j.records[k.offenderId] ??= { count: 0, lastDay: 0 });
    r.count += 1;
    r.lastDay = day;
    this.pushLog(k);
    const c = this.world.getCharacter(k.offenderId);
    if (c && verdict.kind === 'warning') addMemory(this.state, c, CRIME_TEXT.memoryWarned, 'scroll', { kind: 'life', fond: false });
    this.events.emit('crime:closed', { kase: k, verdict: k.verdict });
    return k;
  }

  pushLog(k) {
    const j = this.justice;
    j.log.push(k);
    if (j.log.length > JUSTICE.logSize) j.log.splice(0, j.log.length - JUSTICE.logSize);
  }

  // ------------------------------------------------------------------------------------------------------------------- temizlik

  prune() {
    const ids = new Set(this.state.characters.map((c) => c.id));
    for (const c of this.state.characters) if (c.crimePlan && c.crimePlan.victimId !== undefined && !ids.has(c.crimePlan.victimId)) delete c.crimePlan;
    if (this.state.justice) pruneJustice(this.state.justice, ids);
  }
}

