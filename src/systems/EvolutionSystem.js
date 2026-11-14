// (29.4) Kalıcı Kişilik Evrimi: yaşananlar sakinin dört ekseninden birini iter (drive, company, calling, spirit; -100..+100), her gün
// 0'a doğru söner; eşik aşılınca sabaha karşı (05:00, 06:00 arzu dolumundan önce) özellik KALICI olarak değişir: bir sabah değişmiş uyanır.
// Üç sonuç vardır: dönüşüm (zıt özelliğin yerine yön kutbu), derinleşme (özelliğin derin biçimi) ve edinim (üçüncü özellik).
// Saf hesaplar src/systems/Evolution.js'te, sayılar / adlar / sözler src/data/evolution.js'te.
//
//   Olaylar    : want:fulfilled, fear:realized, moodlet:added / consoled, masterwork:created, skill:levelUp, apprentice:graduated /
//                grandmaster, expedition:memberReturned, relationship:married / quarrel, chemistry:kindred -> push(c, eksen, miktar, kaynak)
//   Gün dönümü : doyum kademesi ve üst üste gerçekleşen korku -> spirit; ardından her eksen 0'a doğru söner; growthToday sıfırlanır
//   Saat başı  : 05:00'te her sakin için pendingShift; varsa evolve (c.away / c.emigrating olan sakin atlanır, sıradaki 05:00'te)
//
// EVRİM HİÇ ZAR ÇEKMEZ. Sistemin izole üreteci (tohum + 40) yalnızca söz seçimi ve söz olasılığı içindir; ana üreteç, öteki sistemlerin
// üreteçleri ve Math.random hiç tüketilmez. Toast yoktur (olay nadirdir): Kasaba Günlüğü, anı, balon, söz ve karakter kartı vardır.
//
// Olay: 'trait:evolved' { character, kind, axis, from, to, cause }
import { TRAITS } from '../data/characters.js';
import { EVOLUTION_RULES, EVOLUTION_SOURCES, EVOLUTION_LINES, EVOLUTION_TEXT, CAUSE_TEXT, DEEP_TRAITS } from '../data/evolution.js';
import { contribution, pendingShift, applyShift, evolves, emptyEvolutionStats, traitShares } from './Evolution.js';
import { engineOn } from './Engines.js';
import { satisfactionTier, recomputeDrive } from './Wants.js';
import { recomputeMood } from './Moodlets.js';
import { refreshChemistry } from './Chemistry.js';
import { addMemory } from './MemorySystem.js';

const S = EVOLUTION_SOURCES;
const capFirst = (text) => (text ? text.charAt(0).toLocaleUpperCase('tr') + text.slice(1) : text);

export class EvolutionSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng izole üreteç (tohum + 40): yalnızca sözler
   * @param {{ moodlets: import('./MoodletSystem.js').MoodletSystem, relationships: import('./RelationshipSystem.js').RelationshipSystem }} services
   */
  constructor(game, world, rng, { moodlets, relationships } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.moodlets = moodlets;
    this.relationships = relationships;
    this.state.evolution ??= emptyEvolutionStats();
    // (30.4a) kişilik çeşitliliği: özellik payları gün dönümünde bir kez hesaplanır (kaydedilmez; yüklemede / açılışta yeniden)
    this.shares = null;
    this.sharesDay = null;
    this.refreshShares();
    const on = (name, fn) => game.events.on(name, fn);
    // iki taraflı olaylar: tablo olay anında okunur (denge denemelerinde bellekte değiştirilebilsin)
    const both = (table, source) => ({ a, b } = {}) => {
      for (const c of [a, b]) this.pushAll(c, S[table], source);
    };
    this.unsubscribers = [
      on('time:hour', (hour) => this.onHour(Number.isFinite(hour) ? hour : this.state.time.hour)),
      on('time:newDay', () => this.onNewDay()),
      on('want:fulfilled', ({ character, want, points } = {}) => this.onWantFulfilled(character, want, points)),
      on('fear:realized', ({ character, fear, points } = {}) => this.onFearRealized(character, fear, points)),
      on('moodlet:added', ({ character, moodlet } = {}) => this.onMoodlet(character, moodlet)),
      on('moodlet:consoled', ({ by, character } = {}) => {
        this.pushAll(character, S.consoled, 'consoled');
        this.pushAll(by, S.consoler, 'consoler');
      }),
      on('masterwork:created', ({ character } = {}) => this.pushAll(character, S.masterwork, 'masterwork')),
      on('skill:levelUp', ({ character } = {}) => this.pushAll(character, S.skillLevelUp, 'skill')),
      on('apprentice:graduated', ({ character } = {}) => this.pushAll(character, S.graduated, 'graduated')),
      on('apprentice:grandmaster', ({ character } = {}) => this.pushAll(character, S.grandmaster, 'grandmaster')),
      on('expedition:memberReturned', ({ character } = {}) => this.pushAll(character, S.expedition, 'expedition')),
      on('relationship:married', both('married', 'married')),
      on('chemistry:kindred', both('kindred', 'kindred')),
      on('relationship:quarrel', both('quarrel', 'quarrel')),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get stats() {
    return (this.state.evolution ??= emptyEvolutionStats());
  }

  /** Olayın sakini: kasabada yaşayan, eksen biriktirebilen bir yetişkin mi. */
  eligible(c) {
    return evolves(c) && this.state.characters.includes(c);
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Katkılar

  /**
   * Tek katkı: contribution ile hesaplanır (evre çarpanı, yuvarlama, günlük sınır, ±100), growth ve growthToday güncellenir.
   * Katkı anlamlıysa (>= causeMin) ve işareti eksenin yeni işaretiyle aynıysa growthCause yazılır.
   * @returns {number} eksene işleyen miktar
   */
  push(c, axisIndex, amount, sourceKey, { daily = false } = {}) {
    if (!this.eligible(c)) return 0;
    const delta = contribution(c, axisIndex, amount, { daily, shares: engineOn('traitScarcity') ? this.shares : null });
    if (delta === 0) return 0;
    c.growth[axisIndex] += delta;
    if (!daily) c.growthToday[axisIndex] += delta;
    const sameSign = Math.sign(delta) === Math.sign(c.growth[axisIndex]);
    if (Math.abs(delta) >= EVOLUTION_RULES.causeMin && sameSign) c.growthCause[axisIndex] = sourceKey;
    // (29.10) küçük katkılar birikince growthCause boş kalıyordu: eksenin en son (aynı yönlü) katkısının kaynağı yedek olarak tutulur.
    // Kaydedilmez (Character.toJSON listesinde yok); yüklemeden sonraki ilk değişimde yedek yoksa neden yine boş kalabilir.
    else if (sameSign) (c.growthLast ??= [null, null, null, null])[axisIndex] = sourceKey;
    return delta;
  }

  /** [[eksen, miktar], ...] listesini aynı kaynakla uygular. */
  pushAll(c, list, sourceKey, opts) {
    if (!list || !this.eligible(c)) return;
    for (const [axis, amount] of list) this.push(c, axis, amount, sourceKey, opts);
  }

  onWantFulfilled(c, want, points) {
    if (!this.eligible(c) || !want) return;
    this.push(c, 3, (Number(points) || 0) * S.wantFulfilled.spiritPerPoint, 'want:fulfilled');
    const extra = S.wants[want.key];
    if (extra) this.pushAll(c, extra, `want:${want.key}`);
  }

  onFearRealized(c, fear, points) {
    if (!this.eligible(c) || !fear) return;
    this.push(c, 3, (Number(points) || 0) * S.fearRealized.spiritPerPoint, 'fear:realized');
    const extra = S.fears[fear.key];
    if (extra) this.pushAll(c, extra, `fear:${fear.key}`);
  }

  /** moodlet:added: moodlet anahtarına göre (Dileği Oldu / Korktuğu Başına Geldi çifte sayılmaz). */
  onMoodlet(c, m) {
    if (!m || !this.eligible(c) || S.moodletIgnored.includes(m.key)) return;
    const strong = m.tier === 'major' || m.tier === 'critical';
    const list = (strong && S.moodletMajor[m.key]) || S.moodlets[m.key];
    if (list) this.pushAll(c, list, `moodlet:${m.key}`);
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Gün dönümü ve sabah denetimi

  /** (30.4a) Yetişkinler arasında özellik payları (ENGINES.traitScarcity kapalıyken null: çarpan 1). Zar yok. */
  refreshShares() {
    this.shares = engineOn('traitScarcity') ? traitShares(this.state) : null;
    this.sharesDay = this.state.time?.day ?? null;
    return this.shares;
  }

  onNewDay() {
    this.refreshShares();
    for (const c of this.state.characters) {
      if (!this.eligible(c)) continue;
      // doyum kademesi ve üst üste gerçekleşen korku (gün dönümü katkıları dailyCap'e takılmaz)
      const tier = satisfactionTier(c.satisfaction).key;
      const spirit = S.dailyTier[tier] ?? 0;
      if (spirit !== 0) this.push(c, 3, spirit, `tier:${tier}`, { daily: true });
      if ((c.fearStreak ?? 0) >= S.fearStreak.at) this.push(c, 3, S.fearStreak.spirit, 'fear:streak', { daily: true });
      // sönme: her eksen 0'a doğru decayPerDay kadar yaklaşır
      for (let i = 0; i < c.growth.length; i++) {
        const v = c.growth[i];
        if (v === 0) continue;
        c.growth[i] = v > 0 ? Math.max(0, v - EVOLUTION_RULES.decayPerDay) : Math.min(0, v + EVOLUTION_RULES.decayPerDay);
        if (c.growth[i] === 0) {
          c.growthCause[i] = null;
          if (c.growthLast) c.growthLast[i] = null;
        }
      }
      c.growthToday.fill(0);
    }
  }

  onHour(hour) {
    if (hour !== EVOLUTION_RULES.checkHour) return;
    const day = this.state.time.day;
    for (const c of [...this.state.characters]) {
      if (!this.eligible(c) || c.away || c.emigrating) continue;
      const shift = pendingShift(c, day);
      if (shift) this.evolve(c, shift);
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Değişim

  /** Değişimi uygular; sıra önemlidir (profil -> kimya -> arzu / ruh hali -> anı -> günlük -> ifade -> olay). */
  evolve(c, shift) {
    const state = this.state;
    const { traits, deepTraits } = applyShift(c, shift);
    const cause = c.growthCause[shift.axis] ?? c.growthLast?.[shift.axis] ?? null;
    const fond = Math.sign(c.growth[shift.axis]) > 0;
    // a) özellikler, eksen, sayaçlar, kayıt
    c.traits = traits;
    c.deepTraits = deepTraits;
    c.growth[shift.axis] = 0;
    c.growthCause[shift.axis] = null;
    if (c.growthLast) c.growthLast[shift.axis] = null;
    c.evolutionCount += 1;
    if (shift.kind === 'acquired') c.acquiredCount += 1;
    c.evolutions.push({ day: state.time.day, kind: shift.kind, axis: shift.axis, from: shift.from, to: shift.to, cause });
    if (c.evolutions.length > EVOLUTION_RULES.logMax) c.evolutions.splice(0, c.evolutions.length - EVOLUTION_RULES.logMax);
    const stats = this.stats;
    stats[shift.kind][shift.to] = (stats[shift.kind][shift.to] ?? 0) + 1;
    stats.total += 1;
    // b) profil (derin yama alanları dahil); sürmekte olan görev kesilmez, yeni profil bir sonraki karardan itibaren geçerlidir
    c.profile = c.buildProfile();
    // c) kimya: özellik uyumu değişti; etiketlerin tutarlılığı mevcut kurallara bırakılır
    for (const key of Object.keys(c.relationships ?? {})) {
      const other = state.characters.find((o) => o.id === Number(key) && !o.role);
      if (other && other !== c) refreshChemistry(state, c, other);
    }
    // d) arzu ağırlıkları özelliklerden etkilenir; ruh hali çarpanları
    recomputeDrive(c);
    recomputeMood(c);
    // e) anı, f) Kasaba Günlüğü
    const text = this.describe(c, shift, cause);
    addMemory(state, c, text.memory, fond ? 'sparkle' : 'sulk', { kind: 'life', fond });
    const entry = state.addJournal(text.journal, fond ? 'sparkle' : 'sulk');
    this.events.emit('journal:added', entry);
    // g) balon ve söz
    this.say(c, shift, fond);
    // h) olay
    this.events.emit('trait:evolved', { character: c, kind: shift.kind, axis: shift.axis, from: shift.from, to: shift.to, cause });
  }

  /** Anı ve günlük metni (nedeni içerir). */
  describe(c, shift, cause) {
    const causeText = cause && CAUSE_TEXT[cause] ? CAUSE_TEXT[cause] : EVOLUTION_TEXT.noCause;
    const fill = (tpl, cap) =>
      tpl
        .replace('{name}', c.name)
        .replace('{cause}', cap ? capFirst(causeText) : causeText)
        .replace('{from}', TRAITS[shift.from]?.name ?? '')
        .replace('{to}', TRAITS[shift.to]?.name ?? '')
        .replace('{deep}', DEEP_TRAITS[shift.to]?.name ?? '');
    return { journal: fill(EVOLUTION_TEXT.journal[shift.kind], false), memory: fill(EVOLUTION_TEXT.memory[shift.kind], true) };
  }

  /** Görünürse ikon balonu ve (speechChance) söz; söz üreteci yalnızca görünür sakinde ilerler. */
  say(c, shift, fond) {
    if (!c.visible || c.away) return;
    c.showBubble(fond ? 'sparkle' : 'sulk', EVOLUTION_RULES.bubbleSeconds);
    if (c.speech) return;
    const lines = EVOLUTION_LINES[shift.kind]?.[shift.to];
    if (!lines || lines.length === 0) return;
    if (this.rng.next() >= EVOLUTION_RULES.speechChance) return;
    c.speech = { text: lines[Math.floor(this.rng.next() * lines.length)], at: -1, duration: EVOLUTION_RULES.speechSeconds };
  }
}
