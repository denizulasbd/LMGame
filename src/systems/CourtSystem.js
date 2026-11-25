// (32.2) Adalet Sarayı ve Dava: hâkim oyuncunun kendisidir. Sayılar ve metinler data/justice.js'te (COURT, SENTENCES, DESERVED,
// BANDS, VERDICT_EFFECTS, IMPUNITY, REVEAL, EXILE, SHAME), saf hesaplar ./Justice.js'te. Bütün kancalar ENGINES.court ile sarılıdır
// (justice kapalıyken court da etkisiz): kapalıyken hiçbir şey yapmaz, 32.1'in Muhtar kuralı birebir sürer. Dava penceresi oyunu
// DURDURMAZ. İsyandan bağımsızdır: yağmaya, trust.revolt akışına ve terk ediş koduna dokunmaz (sürgün terk ediş sayaçlarına YAZILMAZ).
//
//   Dava      : saray varken yakalanan suç Muhtar'a gitmez (Justice.courtOf). Dava açılırken bir kez izole üreteçle (tohum + 43) ifade,
//               tanık ve kurban sözü değişkeni seçilip davaya yazılır (k.statement); süre COURT.deadlineDays (2) gün.
//   Karar     : 'ui:courtVerdict' { caseId, sentence, restitution } (pencere ya da otopilot). HER ceza HER suçta seçilebilir. Hak edilen
//               sertlik (Justice.deserved) ile seçilenin farkı bandı verir (Adil / Sert / Zalim / Hafif / Gevşek); etkiler var olan
//               API'lerle (TrustSystem.adjust, LoyaltySystem.adjust, nedenler 'verdict:<bant>'). Dava CrimeSystem.closeCase ile kapanır.
//   Cezalar   : Para cezası keseden hazineye (yetmezse kalanı saat başına COURT.fineHourCoins ile kamu hizmetine), Kamu Hizmeti
//               (c.sentence.service saat; Brain.planService, 'court:served'), Uzaklaştırma (c.sentence.banUntil; Brain han / pazar
//               ağırlıkları 0, hana giderken yolda döner), Sürgün (c.sentence.exile; yalnızca suçlu bohçasıyla kenara yürür).
//   Süre      : saray varken süresi dolan dava "sürüncemede" kalır: otomatik Uyarı, Yönetim Güveni −2, cezasızlık +1, hikâye kartı.
//   Tanık     : saray varken her gün REVEAL.hour'da yakalanmamış eski suçlar (son REVEAL.days gün; log'daki gizli offenderId) için bir
//               izole zar; tutarsa bir sakin konuşur ve dava açılır ('court:revealed').
//   Sürgün    : removeResident ile ortak temizlik, ocak reisliği ve kütük vefattaki gibi temizlenir, yadigâr HeirloomSystem'in
//               'population:left' kuralıyla mirasçıya / arşive geçer; evde yetişkini kalmayan çocuk en yakın akrabanın (yoksa boş yatağı
//               olan) evine taşınır. Geride kalan aileye 'shamed' (Mahcup), eşe 'heartbroken'; tanıyan birkaç sakinden aileye süreli
//               'resentful' etiketi (karalama). 'population:left' { reason: 'exile' }; sayaç justice.stats.court.exiled.
import { COURT, SENTENCES, VERDICT_EFFECTS, REVEAL, EXILE, SHAME, COURT_TEXT, BANDS, BAND_REASONS, STATEMENTS, VICTIM_PLEAS, WITNESS_LINES, VICTIM_RELATION, CRIMES } from '../data/justice.js';
import { engineOn } from './Engines.js';
import { addMemory } from './MemorySystem.js';
import { getFriendship } from './RelationshipSystem.js';
import { removeResident } from './DesertionSystem.js';
import { loyaltyScope } from './Loyalty.js';
import { addItem, takeItem, addCoins } from './Citizens.js';
import { INN_SHERBET } from '../data/refinery.js';
import {
  courtOf, deserved, verdictBand, fineAmount, finePlan, restitutionStatus, victimPlea, kinOf, emptyCourtStats, caseVars, fill, lootText, isBanned, normalizeVerdict, canonicalCase,
} from './Justice.js';

const on = () => engineOn('court');
const cap = (s) => (s ? s[0].toLocaleUpperCase('tr') + s.slice(1) : s);

export class CourtSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {object} services { crime, economy, trust, loyalty, chemistry, moodlets, relationships, jobs }
   * @param {import('../utils/random.js').Random} dice izole üreteç (tohum + 43); yalnızca mahkeme kararlarında ilerler
   */
  constructor(game, world, { crime, economy, trust, loyalty, chemistry, moodlets, relationships, jobs }, dice) {
    this.game = game;
    this.events = game.events;
    this.world = world;
    this.crime = crime;
    this.economy = economy;
    this.trust = trust;
    this.loyalty = loyalty;
    this.chemistry = chemistry;
    this.moodlets = moodlets;
    this.relationships = relationships;
    this.jobs = jobs;
    this.dice = dice;
    this.last = null; // son kararın sonucu (pencere sonuç ekranı; kaydedilmez)
    const sub = (name, fn) => game.events.on(name, (p) => on() && fn(p ?? {}));
    this.unsubscribers = [
      game.events.on('time:hour', (hour) => on() && this.hourly(Number.isFinite(hour) ? hour : this.state.time.hour)),
      sub('crime:recorded', ({ kase, caught }) => caught && this.adoptCase(kase, true)),
      game.events.on('building:completed', (b) => on() && b?.type === 'courthouse' && this.adoptAll()),
      sub('ui:courtVerdict', ({ caseId, sentence, restitution }) => this.decideById(caseId, sentence, restitution)),
      sub('court:served', ({ character, task }) => this.served(character, task)),
      sub('court:exileArrived', ({ character }) => this.departExile(character)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get state() {
    return this.game.state;
  }

  get courtStats() {
    const st = this.state.justice.stats;
    return (st.court ??= emptyCourtStats());
  }

  findOpen(id) {
    return this.state.justice?.cases.find((k) => k.id === id) ?? null;
  }

  // ------------------------------------------------------------------------------------------------------------------- dava

  /** Saray varken açık davayı sarayın sayar: süre 2 gün, ifade değişkenleri izole üreteçle bir kez seçilir. */
  adoptCase(k, fresh = false) {
    const s = this.state;
    if (!k || k.status !== 'open' || k.court || !courtOf(s)) return false;
    k.court = true;
    k.deadline = Math.max(k.deadline ?? 0, (k.minute ?? s.totalMinutes) + COURT.deadlineDays * 1440);
    const victim = Number.isInteger(k.victimId) ? this.world.getCharacter(k.victimId) : null;
    const offender = this.world.getCharacter(k.offenderId);
    const lines = STATEMENTS[k.motive]?.[k.remorse] ?? STATEMENTS.temptation.confess;
    const statement = { offender: this.dice.int(0, lines.length - 1), witness: this.dice.int(0, WITNESS_LINES.resident.length - 1) };
    const plea = victim && offender ? victimPlea(s, k, victim, getFriendship(s, victim, offender) ?? 0) : null;
    if (plea) {
      statement.plea = plea;
      statement.pleaLine = this.dice.int(0, VICTIM_PLEAS[plea].lines.length - 1);
    }
    k.statement = statement;
    canonicalCase(k);
    this.events.emit('court:caseOpened', { kase: k, fresh });
    this.refreshLook();
    return true;
  }

  /** Saray tamamlandı: açık davaların hepsi saraya geçer. */
  adoptAll() {
    for (const k of this.state.justice?.cases ?? []) this.adoptCase(k);
    this.refreshLook();
  }

  /** Sarayın görünüm durumu (kaydedilmez): açık dava sayısı (kapıda parşömen). */
  refreshLook() {
    const n = (this.state.justice?.cases ?? []).filter((k) => k.court).length;
    for (const b of this.state.buildings) if (b.type === 'courthouse' && (b.look?.cases ?? 0) !== n) b.look = { cases: n };
  }

  // ------------------------------------------------------------------------------------------------------------------- saatlik

  hourly(hour) {
    const s = this.state;
    const now = s.totalMinutes;
    const court = courtOf(s);
    if (court && s.justice) {
      for (const k of s.justice.cases) if (!k.court) this.adoptCase(k);
      for (const k of [...s.justice.cases]) if (k.court && now >= k.deadline) this.stale(k);
      if (hour === REVEAL.hour) this.revealDay();
    }
    this.refreshLook();
    for (const c of [...s.characters]) {
      const st = c.sentence;
      if (!st) continue;
      if (st.exile && now - st.exile.since > EXILE.timeoutMinutes) {
        this.departExile(c);
        continue;
      }
      if (Number.isFinite(st.banUntil) && now >= st.banUntil) {
        delete st.banUntil;
        this.events.emit('court:banEnded', { character: c });
      }
      if (isBanned(s, c)) this.turnBack(c);
      if (!Object.keys(st).length) c.sentence = null;
    }
  }

  /** Sürüncemede kalan dava: otomatik Uyarı, güven −2, cezasızlık +1. */
  stale(k) {
    const s = this.state;
    this.trust?.adjust(COURT.stale.trust, 'court:stale');
    const closed = this.crime.closeCase(k, { kind: 'warning', by: 'court', auto: true, extra: { stale: true, impunity: COURT.stale.impunity, at: s.totalMinutes, effects: { trust: COURT.stale.trust, down: 0, up: 0, downPts: 0, upPts: 0 } } });
    if (!closed) return null;
    canonicalCase(k);
    this.courtStats.stale += 1;
    const text = fill(COURT_TEXT.stale, { who: k.offenderName });
    const entry = s.addJournal(fill(COURT_TEXT.staleJournal, { who: k.offenderName }), 'scales');
    this.events.emit('journal:added', entry);
    const c = this.world.getCharacter(k.offenderId);
    if (c) addMemory(s, c, COURT_TEXT.memoryStale, 'scroll', { kind: 'life', fond: false });
    this.events.emit('court:stale', { kase: k, text, character: c });
    this.refreshLook();
    return k;
  }

  /** Günde bir izole zar: yakalanmamış eski bir suçun tanığı konuşur ve dava açılır. */
  revealDay() {
    const s = this.state;
    const j = s.justice;
    const from = s.time.day - REVEAL.days;
    const pool = j.log.filter((k) => k.unsolved && !k.revealed && k.day > from && Number.isInteger(k.offenderId) && this.world.getCharacter(k.offenderId));
    if (!pool.length) return null;
    if (this.dice.next() >= REVEAL.chance) return null;
    const k = this.dice.pick(pool);
    const offender = this.world.getCharacter(k.offenderId);
    const witnesses = s.characters.filter((o) => o !== offender && !o.role && !o.isChild && !o.away && !o.sentence?.exile && o.id !== k.victimId).sort((a, b) => a.id - b.id);
    if (!witnesses.length) return null;
    const w = this.dice.pick(witnesses);
    j.log.splice(j.log.indexOf(k), 1);
    k.status = 'open';
    delete k.unsolved;
    delete k.closedDay;
    k.witnessId = w.id;
    k.witnessName = w.name;
    k.witnessIsGuard = false;
    k.revealed = { day: s.time.day, witnessName: w.name };
    k.deadline = s.totalMinutes + COURT.deadlineDays * 1440;
    j.cases.push(k);
    j.stats.caught += 1;
    j.stats.unsolved = Math.max(0, j.stats.unsolved - 1);
    this.courtStats.revealed += 1;
    this.adoptCase(k);
    const building = Number.isInteger(k.buildingId) ? this.world.getBuilding(k.buildingId) : null;
    const vars = { ...caseVars(k, { buildingType: building?.type ?? null }), who: k.offenderName, witness: w.name };
    vars.lostCap = cap(vars.lost);
    const text = fill(COURT_TEXT.revealed, vars);
    const entry = s.addJournal(fill(COURT_TEXT.revealedJournal, vars), 'scales');
    this.events.emit('journal:added', entry);
    const victim = Number.isInteger(k.victimId) ? this.world.getCharacter(k.victimId) : null;
    if (victim && this.relationships) this.relationships.add(victim, offender, VICTIM_RELATION);
    this.events.emit('court:revealed', { kase: k, text, character: offender, witness: w });
    return k;
  }

  // ------------------------------------------------------------------------------------------------------------------- karar

  decideById(id, sentence, restitution) {
    const k = this.findOpen(Number(id));
    return k ? this.decide(k, sentence, { restitution: Boolean(restitution) }) : null;
  }

  /**
   * Hâkimin kararı. HER ceza HER suçta seçilebilir. Dönüş: sonuç { kase, band, sentence, deserved, harsh, lines, reason } ya da null
   * (dava açık değil / saray yok / suçlu yok). Etkiler hemen uygulanır; dava kapanır.
   */
  decide(k, sentence, { restitution = false } = {}) {
    const s = this.state;
    const def = SENTENCES[sentence];
    if (!def || !k || k.status !== 'open' || !courtOf(s) || !s.justice.cases.includes(k)) return null;
    const c = this.world.getCharacter(k.offenderId);
    if (!c) return null;
    const now = s.totalMinutes;
    const victim = Number.isInteger(k.victimId) ? this.world.getCharacter(k.victimId) : null;
    // 1. İade (ceza değil): hâlâ duruyorsa
    let returned = 0;
    if (restitution && restitutionStatus(s, k, c).possible) returned = this.restore(k, c, victim);
    // 2. Orantı
    const want = deserved(k, s, { restitution: returned > 0 });
    const band = verdictBand(def.harsh - want);
    // 3. Ceza
    const extra = { at: now, band, harsh: def.harsh, deserved: want };
    if (returned) extra.restitution = returned;
    if (sentence === 'fineLight' || sentence === 'fineHeavy') {
      const asked = fineAmount(k, sentence);
      const plan = finePlan(c.coins, asked);
      c.coins = Math.max(0, (c.coins ?? 0) - plan.paid);
      if (plan.paid) this.economy?.add('gold', plan.paid, 'fine');
      extra.fine = { asked, paid: plan.paid, hours: plan.hours };
      if (plan.hours) this.addService(c, plan.hours, k.id);
    } else if (def.hours) {
      this.addService(c, def.hours, k.id);
      extra.service = def.hours;
    } else if (sentence === 'ban') {
      c.sentence = { ...(c.sentence ?? {}), banUntil: now + COURT.banDays * 1440 };
      this.turnBack(c);
    }
    // 4. Halkın tepkisi (var olan API'ler; sadakat nedeni 'verdict:<bant>')
    const effects = this.applyBand(k, band, c, victim, sentence);
    extra.effects = effects;
    const imp = VERDICT_EFFECTS[band].impunity;
    if (imp) extra.impunity = imp;
    // 5. Kapanış (tek yol)
    this.crime.closeCase(k, { kind: sentence, by: 'court', auto: false, extra });
    canonicalCase(k);
    const st = this.courtStats;
    st[band] += 1;
    st.decided += 1;
    st.waitMinutes += Math.max(0, now - (k.minute ?? now));
    // 6. Görünürlük
    const sentenceName = def.name;
    addMemory(s, c, fill(COURT_TEXT.memoryOffender, { sentence: sentenceName }), 'scales', { kind: 'life', fond: false });
    if (victim) addMemory(s, victim, fill(COURT_TEXT.memoryVictim, { who: c.name, sentence: sentenceName }), 'scales', { kind: 'life', fond: band === 'fair', whoId: c.id });
    const vars = { who: c.name, sentence: sentenceName, band: BANDS.names[band], bandLower: BANDS.names[band].toLocaleLowerCase('tr') };
    const entry = s.addJournal(fill(COURT_TEXT.verdictJournal, vars), 'scales');
    this.events.emit('journal:added', entry);
    if (c.visible) c.showBubble(band === 'fair' ? 'scroll' : band === 'harsh' || band === 'cruel' ? 'sulk' : 'laugh', 2.4);
    this.events.emit('court:verdict', { kase: k, band, sentence, text: fill(COURT_TEXT.verdictCard, vars), character: c, victim });
    if (sentence === 'exile') this.startExile(c, k, band);
    this.last = { caseId: k.id, band, sentence, deserved: want, reason: BAND_REASONS[band] };
    this.refreshLook();
    return this.last;
  }

  /** Çalınanı sahibine iade eder (stok / han / kese). Dönüş: iade edilen miktar. */
  restore(k, c, victim) {
    const s = this.state;
    const st = k.stolen;
    const status = restitutionStatus(s, k, c);
    if (!status.possible) return 0;
    const n = status.amount;
    if (st.coins) {
      const moved = Math.min(n, c.coins ?? 0);
      c.coins -= moved;
      const got = addCoins(victim, moved);
      if (got < moved) c.coins += moved - got;
      return got;
    }
    const taken = takeItem(c, st.item, n);
    if (!taken) return 0;
    const v = CRIMES[k.crime]?.variants[k.variant];
    if (v?.source === 'stock') {
      const back = this.economy?.add(v.resource, taken) ?? 0;
      if (back < taken) addItem(c, st.item, taken - back); // depo doluysa kalan çantada kalır
      return back;
    }
    if (v?.source === 'inn') {
      const inn = this.world.getBuilding(k.buildingId);
      // (32.3 düzeltmesi) han fıçısı INN_SHERBET.capacity'yi aşmasın (bekçi "geçersiz fıçı sayısı" buluyordu); sığmayan çantada kalır
      const room = v.field === 'sherbet' ? Math.max(0, INN_SHERBET.capacity - (inn?.[v.field] ?? 0)) : Infinity;
      const back = inn ? Math.min(taken, room) : 0;
      if (inn) inn[v.field] = (inn[v.field] ?? 0) + back;
      if (back < taken) addItem(c, st.item, taken - back);
      return back;
    }
    return taken; // pazar tezgâhı: mal tezgâha döner (stok tutulmaz)
  }

  addService(c, hours, caseId) {
    const st = (c.sentence = { ...(c.sentence ?? {}) });
    st.service = (st.service ?? 0) + hours;
    st.caseId = caseId;
  }

  /** Bant etkileri: { trust, down, up, downPts, upPts } (gerçek değişimler). */
  applyBand(k, band, c, victim, sentence) {
    const s = this.state;
    const e = VERDICT_EFFECTS[band];
    const out = { trust: 0, down: 0, up: 0, downPts: 0, upPts: 0 };
    const reason = `verdict:${band}`;
    const touched = new Map();
    const adj = (x, d) => {
      if (!x || !d || !this.loyalty) return;
      const got = this.loyalty.adjust(x, d, sentence === 'exile' && d < 0 ? 'verdict:exile' : reason);
      if (!got) return;
      touched.set(x.id, (touched.get(x.id) ?? 0) + got);
    };
    if (e.trust) out.trust = this.trust?.adjust(e.trust, reason) ?? 0;
    const kinSet = () => {
      const set = new Map([[c.id, c]]);
      for (const x of kinOf(s, c)) set.set(x.id, x);
      for (const x of this.loyalty?.friendsOf(c) ?? []) set.set(x.id, x);
      return [...set.values()];
    };
    const victimSide = () => {
      const set = new Map();
      const add = (x) => x && !x.role && x !== c && set.set(x.id, x);
      if (victim) {
        add(victim);
        for (const x of this.loyalty?.friendsOf(victim) ?? []) add(x);
      } else if (Number.isInteger(k.buildingId)) {
        const b = this.world.getBuilding(k.buildingId);
        for (const id of b?.workerIds ?? []) add(this.world.getCharacter(id)); // hancı, pazarcı: malın sahibi sayılır
      }
      return [...set.values()];
    };
    if (band === 'fair') {
      if (k.remorse === 'confess' || k.remorse === 'apologize') adj(c, e.offenderRemorseful);
      adj(victim, e.victim);
    } else if (band === 'harsh') {
      for (const x of kinSet()) adj(x, e.kin);
    } else if (band === 'cruel') {
      const kin = kinSet();
      const kinIds = new Set(kin.map((x) => x.id));
      for (const x of kin) adj(x, e.kin + (sentence === 'exile' && x !== c ? EXILE.cruelKin : 0));
      for (const x of [...s.characters]) if (!kinIds.has(x.id) && !x.isChild && loyaltyScope(x)) adj(x, e.everyone);
    } else if (band === 'lenient') {
      for (const x of victimSide()) adj(x, e.victimSide);
    } else if (band === 'lax') {
      if (victim) adj(victim, e.victim);
      else for (const x of victimSide()) adj(x, e.victim);
    }
    for (const d of touched.values()) {
      if (d < 0) {
        out.down += 1;
        out.downPts += d;
      } else if (d > 0) {
        out.up += 1;
        out.upPts += d;
      }
    }
    return out;
  }

  // ------------------------------------------------------------------------------------------------------------------- kamu hizmeti, yasak

  /** Bir hizmet oturumu bitti: kalan saat düşer; bitince sicilde "borcunu ödedi". */
  served(c, task) {
    const st = c?.sentence;
    if (!st || !(st.service > 0)) return;
    const s = this.state;
    const hours = (task?.duration ?? COURT.serviceMinutes) / 60;
    st.service = Math.max(0, Math.round((st.service - hours) * 100) / 100);
    if (st.serviceDay !== s.time.day) {
      st.serviceDay = s.time.day;
      st.serviceToday = 0;
    }
    st.serviceToday = (st.serviceToday ?? 0) + hours;
    if (st.service > 0) return;
    const caseId = st.caseId;
    delete st.service;
    delete st.serviceDay;
    delete st.serviceToday;
    delete st.caseId;
    if (!Object.keys(st).length) c.sentence = null;
    const k = s.justice?.log.find((x) => x.id === caseId);
    if (k?.verdict) {
      k.verdict = normalizeVerdict({ ...k.verdict, served: true });
      canonicalCase(k);
    }
    addMemory(s, c, COURT_TEXT.memoryServed, 'broom', { kind: 'life', fond: true });
    if (c.visible) c.showBubble('sparkle', 2);
    this.events.emit('court:serviceDone', { character: c, kase: k ?? null });
  }

  /** Yasaklı sakin hana / pazara gidiyorsa yolda döner. */
  turnBack(c) {
    const t = c.task;
    if (!t || !COURT.banActivities.includes(t.activity)) return false;
    const b = Number.isInteger(t.buildingId) ? this.world.getBuilding(t.buildingId) : null;
    if (!b || !COURT.banVenues.includes(b.type)) return false;
    this.events.emit('court:interrupt', { ids: [c.id] });
    if (c.visible) {
      c.showBubble('sulk', 2);
      if (!c.speech) c.speech = { text: COURT_TEXT.turnBack, at: -1, duration: 2.6 };
    }
    return true;
  }

  // ------------------------------------------------------------------------------------------------------------------- sürgün

  /** Sürgün yolu: yalnızca suçlu, bohçasıyla harita kenarına yürür (Brain.planExile). Çıkış yoksa hemen ayrılır. */
  startExile(c, k, band) {
    const s = this.state;
    const exit = this.world.findEntryTile(this.dice);
    c.sentence = { exile: { since: s.totalMinutes, exit: exit ? { x: exit.x, y: exit.y } : null, band, crime: k.crime } };
    delete c.crimePlan;
    if (c.visible) c.showBubble('bundle', 3);
    this.events.emit('court:interrupt', { ids: [c.id] });
    this.events.emit('toast', { text: `${c.name} bohçasını topladı: kasabadan sürülüyor.`, tone: 'warn', icon: 'bundle' });
    if (!exit) this.departExile(c);
  }

  /**
   * Sürgün edilen kasabadan çıkar (terk edişten AYRI: exodus.left, exodus.cap, stats.emigrants değişmez). Kesesi ve çantası onunla
   * gider; yadigâr HeirloomSystem'in 'population:left' kuralıyla mirasçıya / arşive geçer. Dönüş: true.
   */
  departExile(c) {
    const s = this.state;
    if (!c || !s.characters.includes(c)) return false;
    const meta = c.sentence?.exile ?? {};
    const band = BANDS.keys.includes(meta.band) ? meta.band : 'fair';
    const kin = kinOf(s, c);
    const spouse = c.married ? this.world.getCharacter(c.partnerId) : null;
    // Karalama adayları (referanslar silinmeden önce): suçluyu tanıyan, aileden olmayan yetişkinler
    const kinIds = new Set(kin.map((x) => x.id));
    const known = s.characters
      .filter((o) => o !== c && !kinIds.has(o.id) && !o.role && !o.isChild)
      .map((o) => ({ o, rel: getFriendship(s, o, c) ?? 0 }))
      .filter((x) => x.rel !== 0 || (x.o.traits ?? []).includes('grumpy'))
      .sort((a, b) => a.o.id - b.o.id);
    const coins = c.coins ?? 0;
    const items = (c.inventory ?? []).reduce((n, x) => n + x.qty, 0);
    const homeId = c.homeId;
    removeResident(s, this.world, this.jobs, c);
    // Ocak kütüğü ve aile kayıtları (vefattaki gibi): reisliği varsa düşer (evin en yaşlı yetişkini reis sayılır)
    const lineage = s.lineage;
    if (lineage?.heads) for (const [home, head] of Object.entries(lineage.heads)) if (head === c.id) delete lineage.heads[home];
    for (const o of s.characters) {
      if (o.children) o.children = o.children.filter((x) => x !== c.id);
      if (o.parents) o.parents = o.parents.filter((x) => x !== c.id);
      if (o.mentees) o.mentees = o.mentees.filter((m) => m.id !== c.id);
      if (o.apprenticeship?.masterId === c.id) o.apprenticeship.masterId = null;
    }
    const moved = this.housekeepChildren(kin, homeId);
    const st = this.courtStats;
    st.exiled += 1;
    const j = s.justice;
    (j.exiles ??= []).push({ name: c.name, day: s.time.day, crime: meta.crime ?? 'innPilfer', band });
    if (j.exiles.length > 12) j.exiles.splice(0, j.exiles.length - 12);
    this.events.emit('population:changed', s.characters.length);
    this.events.emit('population:left', { character: c, coins, items, reason: 'exile' });
    // Geride kalanlar: utanç, eşe kırık kalp, karalama
    const left = kin.filter((x) => s.characters.includes(x));
    const hours = band === 'fair' ? SHAME.hours.fair : SHAME.hours.other;
    for (const x of left) {
      this.moodlets?.apply(x, 'shamed', { tier: SHAME.tier[band] ?? 'minor', hours, reason: 'shamed_exile', whoName: c.name });
      addMemory(s, x, fill(COURT_TEXT.memoryKin, { who: c.name }), 'bundle', { kind: 'life', fond: false });
    }
    if (spouse && s.characters.includes(spouse)) this.moodlets?.apply(spouse, 'heartbroken', { reason: 'heart_exile', whoName: c.name });
    const sl = band === 'fair' ? SHAME.slander.fair : SHAME.slander.other;
    const pool = known.filter((x) => s.characters.includes(x.o));
    const gossips = [];
    for (let i = 0; i < sl.people && pool.length && left.length; i++) {
      const pick = this.dice.weighted(pool.map((x) => [x, 1 + Math.abs(x.rel) / 25 + ((x.o.traits ?? []).includes('grumpy') ? 1 : 0)]));
      pool.splice(pool.indexOf(pick), 1);
      gossips.push(pick.o);
      for (const x of left) this.chemistry?.tag(pick.o, x.id, 'resentful', sl.days);
    }
    const vars = { who: c.name };
    const entry = s.addJournal(fill(COURT_TEXT.exileJournal, vars), 'bundle');
    this.events.emit('journal:added', entry);
    this.events.emit('court:exiled', { character: c, kin: left, gossips, moved, band, text: fill(COURT_TEXT.exileCard, vars) });
    return true;
  }

  /**
   * (32.2) Geride kalan çocuk kuralı (vefatta özel bir kural yok: çocuk evinde kalır). Evinde yetişkin kalmadıysa önce akrabasının
   * (öteki ebeveyn, büyük ebeveyn, ağabey / abla) boş yatağı olan evine, yoksa boş yatağı olan en yakın eve taşınır; hiçbiri yoksa
   * kendi evinde kalır (evsiz kalmaz). Dönüş: [{ id, from, to }].
   */
  housekeepChildren(kin, homeId) {
    const s = this.state;
    const moved = [];
    const residents = (h) => s.characters.filter((x) => x.homeId === h.id);
    const free = (h) => h && h.functional && h.capacity > 0 && residents(h).length < h.capacity;
    for (const ch of kin.filter((x) => x.isChild && s.characters.includes(x)).sort((a, b) => a.id - b.id)) {
      const home = this.world.getBuilding(ch.homeId);
      if (home && residents(home).some((x) => !x.isChild)) continue;
      const relatives = kinOf(s, ch).filter((x) => !x.isChild && x.homeId !== null && x.homeId !== undefined);
      let target = relatives.map((x) => this.world.getBuilding(x.homeId)).find((h) => h && h.id !== ch.homeId && free(h)) ?? null;
      if (!target) {
        const from = home ?? this.world.getBuilding(homeId);
        const d = (h) => (from ? Math.hypot(h.tileX - from.tileX, h.tileY - from.tileY) : 0);
        target = this.world.getCompleted('cabin').filter((h) => h.id !== ch.homeId && free(h) && residents(h).some((x) => !x.isChild)).sort((a, b) => d(a) - d(b) || a.id - b.id)[0] ?? null;
      }
      if (!target) continue;
      moved.push({ id: ch.id, from: ch.homeId, to: target.id });
      ch.homeId = target.id;
      ch.relocating = true;
    }
    return moved;
  }
}

/** Sonuç ekranının etki satırları (karar ayrıntısından; saf). */
export function verdictLines(k) {
  const v = k?.verdict;
  if (!v) return [];
  const out = [];
  const e = v.effects;
  if (e?.trust) out.push(`Yönetim Güveni ${e.trust > 0 ? '+' : '−'}${Math.abs(e.trust)}`);
  if (e?.down) out.push(`${e.down} sakinin sadakati düştü (toplam ${e.downPts})`);
  if (e?.up) out.push(`${e.up} sakinin sadakati arttı (toplam +${e.upPts})`);
  if (v.impunity) out.push(`Cezasızlık +${v.impunity}: suç riski artar`);
  if (v.fine) out.push(`Para cezası: ${v.fine.paid} altın hazineye${v.fine.hours ? `; kesesi yetmedi, kalanı ${v.fine.hours} saat kamu hizmeti` : ''}`);
  if (v.service) out.push(`${v.service} saat kamu hizmeti (boş zamanında)`);
  if (v.kind === 'ban') out.push(`${COURT.banDays} gün Han ve Pazar yasağı`);
  if (v.kind === 'exile') out.push('Kasabadan sürüldü; ailesi kalıyor');
  if (v.restitution && k.stolen) out.push(`İade: ${lootText({ ...k.stolen, amount: v.restitution })} sahibine döndü`);
  if (!out.length) out.push('Başka bir etkisi olmadı');
  return out;
}
