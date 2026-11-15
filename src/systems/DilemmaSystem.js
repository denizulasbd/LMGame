// İkilem ve karar olayları (11. aşama). Olaylar ve seçenekler src/data/dilemmas.js'te, pencere
// src/ui/components/DilemmaModal.js'te. (Göç, tüccar ve şenlik gibi zamanlanmış olaylar EventSystem'de; karar
// isteyen olaylar oyunu durdurduğu ve kendi zamanlayıcısı olduğu için bu ayrı sistemdedir.)
//
//   Zamanlama : ilk olay en erken 4. gün, sonra 2-4 günde bir sabah 10:00'da; koşulu tutan olaylardan ağırlıklı
//               biri seçilir (aynı olay 6 gün içinde tekrarlanmaz). Oyun durur, karar penceresi açılır
//               ('dilemma:opened'). Oyuncu 30 saniye içinde seçmezse varsayılan güvenli seçenek uygulanır
//               (süre gerçek zamanla işler, oyun duraklatılmışken de).
//   Sonuçlar  : bonus (İyilik Şöhreti, Büyük Panayır), anlık keyif, usta bir göçmen, fırtına / kurt hazırlığı,
//               keşif seferi. 'dilemma:resolved' { dilemma, option, auto } günlüğe ve sese gider.
//   Fırtına   : karardan 20-30 saat sonra gelir ('storm:struck'); güçlendirilmemiş kasabada 1-3 üretim yapısı
//               hasar alır (onarılana kadar çalışmaz). Kurtlar ağıla dalarsa ağıl hasar alır, kasaba korkar.
//   Sefer     : seçilen sakinler harita kenarına yürüyüp bir gün görünmez olur (BehaviorSystem); hepsi dönünce
//               ganimet stoğa girer ('expedition:returned'). (16. aşama) Seferin yolculuğu, maceraları ve dönüşü
//               ExpeditionSystem'dedir; bu sistem kararın etkisini 'expedition:launch' ile ona iletir.
//   Macera    : (16. aşama) seferdeki kafilenin "Maceracı Günlüğü" pencereleri de buradan açılır (openAdventure):
//               aynı pencere, duraklatma ve süre; tanım data/exploration.js -> ADVENTURES. Seçim 'adventure:chosen'
//               { id, optionId, auto } olarak ExpeditionSystem'e gider (olay takvimini ve geçmişini etkilemez).
// Durum state.dilemma'dadır (kayda girer: açık pencere, yaklaşan fırtına, süren sefer).
import { activePopulation } from './LifeStages.js';
import { DILEMMAS, DILEMMA_KEYS, DILEMMA_SCHEDULE, STORM, MIDGAME, COST_SCALE } from '../data/dilemmas.js';
import { engineOn } from './Engines.js';
import { pickTargets, fillNames, describeOption, scaledOption } from './Midgame.js';
import { loyaltyScope, loyaltyOf } from './Loyalty.js';
import { townTier } from './TownStatus.js';
import { riteVenue } from './Rites.js';
import { SATISFACTION } from '../data/wants.js';
import { ADVENTURES } from '../data/exploration.js';
import { idleAdults as idleAdultsOf } from './Exploration.js';
import { DAMAGEABLE_TYPES } from '../data/buildings.js';
import { TOWN_BUFFS } from '../data/town.js';
import { SKILL_LEVELS, SKILL_KEYS } from '../data/skills.js';
import { RESOURCES } from '../data/resources.js';
import { getSeason } from '../data/seasons.js';
import { freeBeds, immigrationLimit } from './TownStatus.js';
import { clamp } from '../utils/math.js';
import { stormResistance } from './ResearchSystem.js';

/** Bir olayın başlığı (kışın fırtına "Kar Fırtınası"). */
export function dilemmaTitle(dilemma, state) {
  return dilemma.winterTitle && getSeason(state.time.day).cold ? dilemma.winterTitle : dilemma.title;
}

export class DilemmaSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   * @param {{ economy: import('./EconomySystem.js').EconomySystem, population: import('./PopulationSystem.js').PopulationSystem }} services
   */
  constructor(game, world, rng, { economy, population, loyalty = null, chemistry = null, moodlets = null, health = null, desertion = null, relationships = null }, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.economy = economy;
    this.population = population;
    // (30.4b) orta oyun etkilerinin çağırdığı mevcut sistemler (yeni mekanik yok)
    this.loyalty = loyalty;
    this.chemistry = chemistry;
    this.moodlets = moodlets;
    this.health = health;
    this.desertion = desertion;
    this.relationships = relationships;
    this.attract = attract;
    this.unsubscribers = [
      game.events.on('time:hour', (hour) => {
        if (hour === DILEMMA_SCHEDULE.hour) this.maybeStart();
      }),
      game.events.on('ui:chooseDilemma', ({ optionId }) => this.choose(optionId, false)),
      // (30.1) Ayarlar: "Kararlarda süre sınırı" Kapalı / 30 saniye (açıkken açık pencerenin sayacı kaldığı yerden işler)
      game.events.on('ui:setDilemmaTimer', ({ on }) => (this.state.settings.dilemmaTimer = Boolean(on))),
    ];
    if (this.dilemma.nextDay === null) this.scheduleNext(DILEMMA_SCHEDULE.firstDay);
    // Kayıtta açık bir karar penceresi varsa oyun yine durur ve pencere açılır
    if (this.dilemma.active && !attract) {
      this.publishOptions();
      this.events.emit('time:setPaused', true);
      this.events.emit('dilemma:opened', { active: this.dilemma.active });
    }
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get dilemma() {
    return this.state.dilemma;
  }

  scheduleNext(minDay = 0) {
    const [a, b] = DILEMMA_SCHEDULE.intervalDays;
    this.dilemma.nextDay = Math.max(minDay, this.state.time.day + this.rng.int(a, b));
  }

  update(tick) {
    const d = this.dilemma;
    if (d.active) {
      // (30.1) Oyuncu için süre yok: pencere seçim yapılana dek bekler. Süre yalnızca Ayarlar'da "30 saniye" seçiliyken
      // (state.settings.dilemmaTimer) ve başsız araçlarda işler (bkz. tools/sim/lib.mjs)
      if (this.state.settings?.dilemmaTimer === true) d.active.remaining -= tick.realDt;
      if (d.active.remaining <= 0) this.choose(null, true);
      else this.publishOptions();
    }
    if (d.storm && this.state.totalMinutes >= d.storm.at) this.strike();
  }

  /** Açık pencerenin tanımı: olay (DILEMMAS) ya da seferdeki macera (ADVENTURES). */
  definitionFor(active) {
    return active?.kind === 'adventure' ? ADVENTURES[active.id] : DILEMMAS[active?.id];
  }

  /**
   * (16. aşama) Seferdeki kafilenin macera penceresini açar. extra: { text: kafileyle birlikte metin, details:
   * { seçenek: bu kafileyle risk açıklaması } }. Başka bir pencere açıksa false (ExpeditionSystem sonra yeniden dener).
   */
  openAdventure(id, extra = {}) {
    const d = this.dilemma;
    if (this.attract || d.active || !ADVENTURES[id]) return false;
    d.active = { id, kind: 'adventure', remaining: DILEMMA_SCHEDULE.timeoutSeconds, wasPaused: this.state.time.paused, text: extra.text ?? null, details: extra.details ?? {} };
    this.publishOptions();
    this.events.emit('time:setPaused', true);
    this.events.emit('dilemma:opened', { active: d.active });
    return true;
  }

  /** Sefer bitince hâlâ açık kalan macera penceresi sessizce kapanır. */
  closeAdventure() {
    const d = this.dilemma;
    if (d.active?.kind !== 'adventure') return;
    const wasPaused = d.active.wasPaused;
    d.active = null;
    if (!wasPaused) this.events.emit('time:setPaused', false);
  }

  // ---------------------------------------------------------------------------
  // Olay seçimi
  // ---------------------------------------------------------------------------

  /** Olay koşulları tutuyor mu? */
  eligible(id) {
    const def = DILEMMAS[id];
    const req = def.requires ?? {};
    const state = this.state;
    const d = this.dilemma;
    if (req.minPopulation && state.characters.length < req.minPopulation) return false;
    if (req.minDay && state.time.day < req.minDay) return false;
    if (req.building && this.world.getCompleted(req.building).length === 0) return false;
    if (req.seasons && !req.seasons.includes(getSeason(state.time.day).key)) return false;
    if (req.minBuildings && this.damageable().length < req.minBuildings) return false;
    if ((id === 'storm' || id === 'wolves') && d.storm) return false;
    if (id === 'expedition' && d.expedition) return false;
    const mid = engineOn('midgame');
    if (mid && !this.midgameRequires(def)) return false;
    const last = d.history[id];
    return last === undefined || state.time.day - last >= (mid ? MIDGAME.repeatGapDays : DILEMMA_SCHEDULE.repeatGapDays);
  }

  /** (30.4b) Orta oyun kartlarının ek koşulları (yeni kartlar ve hedef kuralı). */
  midgameRequires(def) {
    const req = def.requires ?? {};
    const state = this.state;
    if (req.minTier && townTier(state).tier < req.minTier) return false;
    for (const [type, n] of Object.entries(req.buildingsMin ?? {})) if (this.world.getCompleted(type).length < n) return false;
    if (req.plaza && !riteVenue(state)) return false;
    if (req.child && !state.characters.some((c) => c.isChild)) return false;
    if (req.foodRatio && (state.resources.food ?? 0) < this.economy.limit('food') * req.foodRatio) return false;
    if (def.target && !pickTargets(state, def.target)) return false;
    // (30.6) en az iki seçeneği karşılanamayan kart o gün çıkmaz
    if (def.midgame && engineOn('novicePath') && def.options.filter((o) => this.optionStatus(o).ok).length < COST_SCALE.minAffordable) return false;
    return true;
  }

  /** Olayın bugünkü konu kişileri { who, who2 } (kuralsız olay: boş). Zar çekmez. */
  targetsFor(def) {
    return def.target ? pickTargets(this.state, def.target) ?? {} : {};
  }

  /** Açık pencerenin kişi adları ({who} / {who2}). */
  namesOf(active) {
    const find = (id) => this.state.characters.find((c) => c.id === id);
    return { who: find(active?.who)?.name, who2: find(active?.who2)?.name };
  }

  damageable() {
    return this.world.getCompleted().filter((b) => DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.isBurning);
  }

  maybeStart(force = null) {
    const d = this.dilemma;
    if (this.attract || d.active) return false;
    if (!force && this.state.time.day < d.nextDay) return false;
    const mid = engineOn('midgame');
    const keys = DILEMMA_KEYS.filter((k) => mid || !DILEMMAS[k].midgame);
    let pool = (force ? [force] : keys).filter((id) => this.eligible(id)).map((id) => [id, DILEMMAS[id].weight]);
    if (mid && !force) pool = this.shapePool(pool);
    if (pool.length === 0) {
      d.nextDay = this.state.time.day + 1;
      return false;
    }
    const id = force ?? this.rng.weighted(pool);
    d.active = { id, remaining: DILEMMA_SCHEDULE.timeoutSeconds, wasPaused: this.state.time.paused };
    if (mid && DILEMMAS[id].target) {
      const t = this.targetsFor(DILEMMAS[id]);
      if (t.who) d.active.who = t.who.id;
      if (t.who2) d.active.who2 = t.who2.id;
    }
    this.publishOptions();
    this.events.emit('time:setPaused', true);
    this.events.emit('dilemma:opened', { active: d.active });
    return true;
  }

  /**
   * (30.4b) Havuzun şekli: seçilen kart son iki karttan biri olamaz (başka uygun kart varsa); lateDay'den sonra yeni kartların
   * toplam ağırlığı eski kartlarınkinin en az lateRatio katı olacak biçimde ölçeklenir. Zar çekmez (yalnızca ağırlıklar).
   */
  shapePool(pool) {
    const d = this.dilemma;
    let out = pool;
    const recent = d.recent ?? [];
    const fresh = pool.filter(([id]) => !recent.includes(id));
    if (fresh.length) out = fresh;
    if (this.state.time.day > MIDGAME.lateDay) {
      const sum = (list) => list.reduce((a, [, w]) => a + w, 0);
      const olds = out.filter(([id]) => !DILEMMAS[id].midgame);
      const news = out.filter(([id]) => DILEMMAS[id].midgame);
      const oldSum = sum(olds);
      const newSum = sum(news);
      if (oldSum > 0 && newSum > 0 && newSum < MIDGAME.lateRatio * oldSum) {
        const k = (MIDGAME.lateRatio * oldSum) / newSum;
        out = out.map(([id, w]) => [id, DILEMMAS[id].midgame ? w * k : w]);
      }
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Seçenekler
  // ---------------------------------------------------------------------------

  /** Seçimi bekleyen ya da sefere uygun boştaki yetişkinler: görünür, hasta değil, çocuk değil. */
  idleAdults() {
    return idleAdultsOf(this.world.characters);
  }

  /** Sefere gidecekler: önce Sağlam Alet kuşananlar, sonra en az deneyimliler (kasabanın ustaları kalsın). */
  pickExplorers(count) {
    const xp = (c) => Object.values(c.skills).reduce((a, b) => a + b, 0);
    return [...this.idleAdults()]
      .sort((a, b) => Number(b.equipment.tool === 'sturdyTool') - Number(a.equipment.tool === 'sturdyTool') || xp(a) - xp(b))
      .slice(0, count);
  }

  /**
   * Bir seçeneğin şimdi seçilip seçilemeyeceği: { ok, reason }. Arayüz de aynı sonucu gösterir.
   */
  /** (30.6) Orta oyun seçeneğinin bugünkü (kasaba seviyesine göre ölçeklenmiş) hâli; şalter kapalıyken aynen. */
  priced(option) {
    return option.midgame && engineOn('novicePath') ? scaledOption(option, townTier(this.state).tier) : option;
  }

  optionStatus(raw) {
    const option = this.priced(raw);
    for (const [r, v] of Object.entries(option.cost ?? {})) {
      if ((this.state.resources[r] ?? 0) < v) return { ok: false, reason: `Yetersiz ${RESOURCES[r].name.toLocaleLowerCase('tr')}${engineOn('novicePath') ? ` (${v} gerekir, ${Math.floor(this.state.resources[r] ?? 0)} var)` : ''}` };
    }
    for (const req of (option.requires ?? '').split(',').filter(Boolean)) {
      const [key, n] = req.split(':');
      const count = Number(n ?? 1);
      if (key === 'freeBed' && (freeBeds(this.state).open <= 0 || activePopulation(this.state) >= immigrationLimit(this.state))) {
        return { ok: false, reason: 'Kasabada boş yatak yok' };
      }
      if (key === 'explorers' && this.idleAdults().length < count) return { ok: false, reason: `${count} sağlıklı yetişkin gerekir` };
      if (key === 'tools') {
        const explorers = this.pickExplorers(count);
        const own = explorers.filter((c) => c.equipment.tool === 'sturdyTool').length;
        if (own + (this.state.equipment.sturdyTool ?? 0) < count) return { ok: false, reason: `${count} Sağlam Alet gerekir` };
      }
      if (key === 'dog' && !this.state.animals.some((a) => a.kind === 'dog')) return { ok: false, reason: 'Kasabada köpek yok' };
      if (key === 'guardTower' && this.world.getCompleted('guardTower').length === 0) return { ok: false, reason: 'Gözcü Kulesi gerekir' };
    }
    return { ok: true, reason: null };
  }

  /**
   * Açık pencerenin seçeneklerinin durumu GameState'e yazılır (arayüz yalnızca durumu okur):
   * active.options = [{ id, ok, reason }], active.defaultId: süre dolunca uygulanacak seçenek.
   */
  publishOptions() {
    const active = this.dilemma.active;
    if (!active) return;
    const def = this.definitionFor(active);
    if (active.kind === 'adventure') {
      // Macera seçenekleri her zaman seçilebilir; açıklamaları bu kafileyle riski içerir
      active.options = def.options.map((o) => ({ id: o.id, ok: true, reason: null, detail: active.details?.[o.id] ?? o.detail }));
      active.defaultId = (def.options.find((o) => o.default) ?? def.options[def.options.length - 1]).id;
      active.title = def.title;
      return;
    }
    active.options = def.options.map((o) => ({ id: o.id, ...this.optionStatus(o), ...(o.midgame && engineOn('novicePath') ? { cost: { ...this.priced(o).cost } } : {}) }));
    active.defaultId = this.defaultOption(def).id;
    active.title = dilemmaTitle(def, this.state);
    if (def.midgame) {
      // (30.4b) kişi adları, bedel ve etki (sadakat dahil) yazılı; pencerede sakinin portresi
      const names = this.namesOf(active);
      active.text = fillNames(def.text, names);
      active.portraits = [active.who, active.who2].map((id) => this.state.characters.find((c) => c.id === id)).filter(Boolean).map((c) => ({ id: c.id, name: c.name, appearance: c.appearance, look: c.look, isChild: Boolean(c.isChild) }));
      active.options.forEach((st, i) => {
        const o = this.priced(def.options[i]);
        st.label = fillNames(o.label, names);
        st.detail = describeOption(o, names);
      });
    }
  }

  /** Süre dolunca: varsayılan seçeneklerden uygulanabilir ilki (yoksa uygulanabilir herhangi biri). */
  defaultOption(def) {
    const defaults = def.options.filter((o) => o.default);
    return defaults.find((o) => this.optionStatus(o).ok) ?? def.options.find((o) => this.optionStatus(o).ok) ?? def.options[def.options.length - 1];
  }

  choose(optionId, auto) {
    const d = this.dilemma;
    if (!d.active) return;
    if (d.active.kind === 'adventure') {
      this.chooseAdventure(optionId, auto);
      return;
    }
    const def = DILEMMAS[d.active.id];
    let option = def.options.find((o) => o.id === optionId);
    if (!option || !this.optionStatus(option).ok) {
      if (!auto) {
        if (option) this.events.emit('toast', { text: this.optionStatus(option).reason, tone: 'warn', icon: def.icon });
        return;
      }
      option = this.defaultOption(def);
    }
    const wasPaused = d.active.wasPaused;
    const id = d.active.id;
    const names = def.midgame ? this.namesOf(d.active) : {};
    const ctx = def.midgame ? { who: this.state.characters.find((c) => c.id === d.active.who) ?? null, who2: this.state.characters.find((c) => c.id === d.active.who2) ?? null } : {};
    d.active = null;
    const priced = this.priced(option);
    this.economy.spend(priced.cost ?? {});
    this.apply(id, priced.effect ?? {}, ctx);
    d.history[id] = this.state.time.day;
    if (engineOn('midgame')) d.recent = [...(d.recent ?? []), id].slice(-MIDGAME.noRepeatLast);
    this.state.stats.dilemmas = (this.state.stats.dilemmas ?? 0) + 1;
    this.scheduleNext();
    if (!wasPaused) this.events.emit('time:setPaused', false);
    const result = fillNames(option.result, names);
    this.events.emit('dilemma:resolved', {
      dilemma: def, id, option, auto, title: dilemmaTitle(def, this.state),
      label: fillNames(option.label, names), result, targetIds: [ctx.who?.id, ctx.who2?.id].filter((x) => x !== undefined),
    });
    this.events.emit('toast', { text: `${auto ? 'Süre doldu: ' : ''}${result}`, tone: 'info', icon: def.icon });
  }

  chooseAdventure(optionId, auto) {
    const d = this.dilemma;
    const def = ADVENTURES[d.active.id];
    const option = def.options.find((o) => o.id === optionId) ?? (auto ? def.options.find((o) => o.default) ?? def.options[def.options.length - 1] : null);
    if (!option) return;
    const { id, wasPaused } = d.active;
    d.active = null;
    if (!wasPaused) this.events.emit('time:setPaused', false);
    this.events.emit('adventure:chosen', { id, optionId: option.id, auto });
  }

  apply(id, effect, ctx = {}) {
    const state = this.state;
    if (engineOn('midgame')) this.applyMidgame(id, effect, ctx);
    if (effect.buff) state.buffs[effect.buff] = state.totalMinutes + TOWN_BUFFS[effect.buff].hours * 60;
    if (effect.fun) {
      for (const c of state.characters) {
        c.needs.fun = clamp(c.needs.fun + effect.fun, 0, 100);
        if (effect.fun > 0 && c.visible && !c.bubble) c.showBubble('note', 2);
      }
    }
    if (effect.recruit) this.recruit();
    if (effect.fortify !== undefined || effect.watchChance) {
      const [a, b] = STORM.delayHours;
      state.dilemma.storm = { kind: id, at: state.totalMinutes + this.rng.int(a, b) * 60, fortified: Boolean(effect.fortify), watchChance: effect.watchChance ?? 0 };
    }
    if (effect.expedition) this.sendExpedition(effect.expedition, effect.explorers);
  }

  /**
   * (30.4b) Orta oyun etkileri: her biri var olan sistemi çağırır (EconomySystem, LoyaltySystem, ChemistrySystem, MoodletSystem,
   * HealthSystem, DesertionSystem, RelationshipSystem). Zar çekmez; kişi seçimleri kimlik sırasıyla.
   */
  applyMidgame(id, e, ctx = {}) {
    const st = this.state;
    const reason = `dilemma:${id}`;
    const { who = null, who2 = null } = ctx;
    const alive = (c) => (c && st.characters.includes(c) ? c : null);
    const adults = () => st.characters.filter(loyaltyScope);
    const parents = () => (who?.parentIds ?? []).map((pid) => st.characters.find((c) => c.id === pid)).filter(Boolean);
    const circle = (key) => {
      switch (key) {
        case 'all': return adults();
        case 'target': return [alive(who)].filter(Boolean);
        case 'target2': return [alive(who2)].filter(Boolean);
        case 'both': return [alive(who), alive(who2)].filter(Boolean);
        case 'friendsOfTarget': return who && this.loyalty ? this.loyalty.friendsOf(who) : [];
        case 'parentsOfTarget': return parents();
        case 'elders': return st.characters.filter((c) => loyaltyScope(c) && c.lifeStage === 'elder');
        default: return [];
      }
    };
    if (e.gold) this.economy.add('gold', e.gold, 'event');
    for (const [r, v] of Object.entries(e.resources ?? {})) {
      if (v > 0) this.economy.add(r, v);
      else if (v < 0) this.economy.spend({ [r]: Math.min(-v, this.economy.amount(r)) });
    }
    // sadakat: dostlar, kişi ayrılmadan ÖNCE seçilir
    const loyaltyJobs = [];
    for (const [key, v] of Object.entries(e.loyalty ?? {})) {
      if (key === 'lowest') {
        const [n, d] = v;
        const list = adults().sort((a, b) => loyaltyOf(a) - loyaltyOf(b) || a.id - b.id).slice(0, n);
        loyaltyJobs.push([list, d]);
      } else loyaltyJobs.push([circle(key), v]);
    }
    for (const [list, delta] of loyaltyJobs) for (const c of list) this.loyalty?.adjust(c, delta, reason);
    if (e.trust && st.trust) st.trust.value = clamp((Number.isFinite(st.trust.value) ? st.trust.value : 0) + e.trust, 0, 100);
    for (const [key, v] of Object.entries(e.satisfaction ?? {})) {
      for (const c of key === 'all' ? st.characters : circle(key)) if (Number.isFinite(c.satisfaction)) c.satisfaction = clamp(c.satisfaction + v, SATISFACTION.min, SATISFACTION.max);
    }
    if (e.energy) for (const c of st.characters) c.needs.energy = clamp(c.needs.energy + e.energy, 0, 100);
    if (e.reputation && st.crown) st.crown.reputation = clamp((st.crown.reputation ?? 0) + e.reputation, 0, 100);
    if (e.relation?.pair && alive(who) && alive(who2)) this.relationships?.add(who, who2, e.relation.pair);
    if (e.tag) {
      const from = e.tag.from === 'target2' ? alive(who2) : alive(who);
      const to = e.tag.to === 'target' ? alive(who) : alive(who2);
      if (from && to) this.chemistry?.tag(from, to.id, e.tag.tag);
    }
    if (e.moodlet) for (const c of circle(e.moodlet.who)) this.moodlets?.apply(c, e.moodlet.key, { reason: e.moodlet.reason });
    if (e.sick) {
      const list = st.characters.filter((c) => loyaltyScope(c) && !c.illness && !c.away).sort((a, b) => a.needs.energy - b.needs.energy || a.id - b.id).slice(0, e.sick);
      for (const c of list) this.health?.fallIll(c);
    }
    if (e.quarantine) this.dilemma.quarantineUntil = st.totalMinutes + e.quarantine * 1440;
    if (e.leave === 'target' && alive(who)) this.desertion?.startLeaving([who]);
  }

  /** Kafilenin en yeteneklisi: boş bir yatağa yerleşen ve bir meslekte usta olan göçmen. */
  recruit() {
    const [newcomer] = this.population.welcomeNewcomers(1);
    if (!newcomer) return;
    const skill = this.rng.pick(SKILL_KEYS);
    newcomer.skills[skill] = SKILL_LEVELS[SKILL_LEVELS.length - 1].xp;
    this.events.emit('dilemma:recruited', { character: newcomer, skill });
  }

  /** Kayıp Hazine Haritası: kafileyi ExpeditionSystem yola çıkarır (maceralar ve dönüş orada). */
  sendExpedition(size, count) {
    this.events.emit('expedition:launch', { size, count });
  }

  // ---------------------------------------------------------------------------
  // Fırtına ve kurtlar
  // ---------------------------------------------------------------------------

  strike() {
    const storm = this.dilemma.storm;
    this.dilemma.storm = null;
    const winter = getSeason(this.state.time.day).cold;
    if (storm.kind === 'wolves') {
      const safe = storm.fortified || (storm.watchChance && this.rng.next() < storm.watchChance);
      const farms = this.world.getCompleted('sheepFarm').filter((b) => !b.damaged);
      if (safe || farms.length === 0) {
        this.events.emit('storm:struck', { kind: 'wolves', damaged: [], safe: true });
        this.events.emit('toast', { text: storm.watchChance && !storm.fortified ? 'Köpekler havlayarak kurt sürüsünü ormana kovaladı!' : 'Kurtlar yükseltilmiş çiti aşamadı, sürü ormana çekildi.', tone: 'success', icon: 'wolf' });
        return;
      }
      for (const farm of farms) farm.damaged = true;
      for (const c of this.state.characters) c.needs.fun = clamp(c.needs.fun + STORM.wolfFun, 0, 100);
      this.events.emit('storm:struck', { kind: 'wolves', damaged: farms, safe: false });
      this.events.emit('toast', { text: 'Kurtlar Koyun Ağılı\'na daldı! Koyunlar dağıldı, çit yıkıldı: ağıl onarılmalı.', tone: 'warn', icon: 'wolf' });
      return;
    }
    // Fırtına: hava birden kararır, yağmur (kışın kar) bastırır
    const w = this.state.weather;
    w.type = 'rainy';
    w.rain = 1;
    w.cloud = 1;
    if (storm.fortified) {
      this.events.emit('storm:struck', { kind: 'storm', damaged: [], safe: true, winter });
      this.events.emit('toast', { text: `${winter ? 'Kar fırtınası' : 'Fırtına'} koptu, ama güçlendirilmiş kasaba hasarsız atlattı!`, tone: 'success', icon: 'storm' });
      return;
    }
    const candidates = this.damageable();
    const [min, max] = STORM.damage;
    // Mimarlık Loncası araştırması yapıları fırtınaya iki kat dayanıklı kılar
    const count = Math.min(candidates.length, Math.floor(this.rng.int(min, max) / stormResistance(this.state)));
    const damaged = [];
    for (let i = 0; i < count; i++) {
      const b = candidates.splice(this.rng.int(0, candidates.length - 1), 1)[0];
      b.damaged = true;
      damaged.push(b);
    }
    this.events.emit('storm:struck', { kind: 'storm', damaged, safe: damaged.length === 0, winter });
    this.events.emit('toast', {
      text: damaged.length
        ? `${winter ? 'Kar fırtınası' : 'Fırtına'} hasar verdi: ${damaged.map((b) => b.name).join(', ')}. Yapıya tıklayıp onarabilirsin.`
        : `${winter ? 'Kar fırtınası' : 'Fırtına'} geçti; şans eseri hasar yok.`,
      tone: damaged.length ? 'warn' : 'info',
      icon: 'storm',
    });
  }
}
