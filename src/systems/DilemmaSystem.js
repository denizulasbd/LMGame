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
//               ganimet stoğa girer ('expedition:returned').
// Durum state.dilemma'dadır (kayda girer: açık pencere, yaklaşan fırtına, süren sefer).
import { DILEMMAS, DILEMMA_KEYS, DILEMMA_SCHEDULE, STORM, EXPEDITION } from '../data/dilemmas.js';
import { DAMAGEABLE_TYPES } from '../data/buildings.js';
import { TOWN_BUFFS } from '../data/town.js';
import { SKILL_LEVELS, SKILL_KEYS } from '../data/skills.js';
import { RESOURCES } from '../data/resources.js';
import { getSeason } from '../data/seasons.js';
import { freeBeds, immigrationLimit } from './TownStatus.js';
import { clamp } from '../utils/math.js';

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
  constructor(game, world, rng, { economy, population }, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.economy = economy;
    this.population = population;
    this.attract = attract;
    this.unsubscribers = [
      game.events.on('time:hour', (hour) => {
        if (hour === DILEMMA_SCHEDULE.hour) this.maybeStart();
      }),
      game.events.on('ui:chooseDilemma', ({ optionId }) => this.choose(optionId, false)),
      game.events.on('expedition:memberReturned', () => this.checkExpedition()),
    ];
    if (this.dilemma.nextDay === null) this.scheduleNext(DILEMMA_SCHEDULE.firstDay);
    // Kayıtta açık bir karar penceresi varsa oyun yine durur ve pencere açılır
    if (this.dilemma.active && !attract) {
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
      d.active.remaining -= tick.realDt;
      if (d.active.remaining <= 0) this.choose(null, true);
    }
    if (d.storm && this.state.totalMinutes >= d.storm.at) this.strike();
    if (d.expedition && this.state.totalMinutes >= d.expedition.until + 120) this.checkExpedition(true);
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
    const last = d.history[id];
    return last === undefined || state.time.day - last >= DILEMMA_SCHEDULE.repeatGapDays;
  }

  damageable() {
    return this.world.getCompleted().filter((b) => DAMAGEABLE_TYPES.includes(b.type) && !b.damaged);
  }

  maybeStart(force = null) {
    const d = this.dilemma;
    if (this.attract || d.active) return false;
    if (!force && this.state.time.day < d.nextDay) return false;
    const pool = (force ? [force] : DILEMMA_KEYS).filter((id) => this.eligible(id)).map((id) => [id, DILEMMAS[id].weight]);
    if (pool.length === 0) {
      d.nextDay = this.state.time.day + 1;
      return false;
    }
    const id = force ?? this.rng.weighted(pool);
    d.active = { id, remaining: DILEMMA_SCHEDULE.timeoutSeconds, wasPaused: this.state.time.paused };
    this.events.emit('time:setPaused', true);
    this.events.emit('dilemma:opened', { active: d.active });
    return true;
  }

  // ---------------------------------------------------------------------------
  // Seçenekler
  // ---------------------------------------------------------------------------

  /** Seçimi bekleyen ya da sefere uygun boştaki yetişkinler: görünür, hasta değil, çocuk değil. */
  idleAdults() {
    return this.world.characters.filter((c) => !c.isChild && !c.away && !c.illness && !c.newcomer && !c.role);
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
  optionStatus(option) {
    for (const [r, v] of Object.entries(option.cost ?? {})) {
      if ((this.state.resources[r] ?? 0) < v) return { ok: false, reason: `Yetersiz ${RESOURCES[r].name.toLocaleLowerCase('tr')}` };
    }
    for (const req of (option.requires ?? '').split(',').filter(Boolean)) {
      const [key, n] = req.split(':');
      const count = Number(n ?? 1);
      if (key === 'freeBed' && (freeBeds(this.state).open <= 0 || this.state.characters.length >= immigrationLimit(this.state))) {
        return { ok: false, reason: 'Kasabada boş yatak yok' };
      }
      if (key === 'explorers' && this.idleAdults().length < count) return { ok: false, reason: `${count} sağlıklı yetişkin gerekir` };
      if (key === 'tools') {
        const explorers = this.pickExplorers(count);
        const own = explorers.filter((c) => c.equipment.tool === 'sturdyTool').length;
        if (own + (this.state.equipment.sturdyTool ?? 0) < count) return { ok: false, reason: `${count} Sağlam Alet gerekir` };
      }
      if (key === 'dog' && !this.state.animals.some((a) => a.kind === 'dog')) return { ok: false, reason: 'Kasabada köpek yok' };
    }
    return { ok: true, reason: null };
  }

  /** Süre dolunca: varsayılan seçeneklerden uygulanabilir ilki (yoksa uygulanabilir herhangi biri). */
  defaultOption(def) {
    const defaults = def.options.filter((o) => o.default);
    return defaults.find((o) => this.optionStatus(o).ok) ?? def.options.find((o) => this.optionStatus(o).ok) ?? def.options[def.options.length - 1];
  }

  choose(optionId, auto) {
    const d = this.dilemma;
    if (!d.active) return;
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
    d.active = null;
    this.economy.spend(option.cost ?? {});
    this.apply(id, option.effect ?? {});
    d.history[id] = this.state.time.day;
    this.state.stats.dilemmas = (this.state.stats.dilemmas ?? 0) + 1;
    this.scheduleNext();
    if (!wasPaused) this.events.emit('time:setPaused', false);
    this.events.emit('dilemma:resolved', { dilemma: def, id, option, auto, title: dilemmaTitle(def, this.state) });
    this.events.emit('toast', { text: `${auto ? 'Süre doldu: ' : ''}${option.result}`, tone: 'info', icon: def.icon });
  }

  apply(id, effect) {
    const state = this.state;
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

  /** Kafilenin en yeteneklisi: boş bir yatağa yerleşen ve bir meslekte usta olan göçmen. */
  recruit() {
    const [newcomer] = this.population.welcomeNewcomers(1);
    if (!newcomer) return;
    const skill = this.rng.pick(SKILL_KEYS);
    newcomer.skills[skill] = SKILL_LEVELS[SKILL_LEVELS.length - 1].xp;
    this.events.emit('dilemma:recruited', { character: newcomer, skill });
  }

  sendExpedition(size, count) {
    const explorers = this.pickExplorers(count);
    if (explorers.length === 0) return;
    // Aleti olmayanlara depodan Sağlam Alet verilir (seferde aşınır)
    if (size === 'big') {
      for (const c of explorers) if (c.equipment.tool !== 'sturdyTool' && this.state.equipment.sturdyTool > 0) this.state.equipment.sturdyTool -= 1;
    }
    const exit = this.world.findEntryTile(this.rng);
    const until = this.state.totalMinutes + EXPEDITION.hours * 60;
    this.dilemma.expedition = { members: explorers.map((c) => c.id), until, size };
    this.events.emit('expedition:depart', { ids: explorers.map((c) => c.id), until, exit });
    this.events.emit('expedition:departed', { members: explorers, until });
  }

  /** Seferdekilerin hepsi döndüyse ganimet stoğa girer (force: dönüş gecikirse yine de sonuçlanır). */
  checkExpedition(force = false) {
    const exp = this.dilemma.expedition;
    if (!exp) return;
    const members = exp.members.map((id) => this.world.getCharacter(id)).filter(Boolean);
    if (!force && members.some((c) => c.away)) return;
    this.dilemma.expedition = null;
    const table = EXPEDITION.loot[exp.size] ?? EXPEDITION.loot.small;
    const pick = this.rng.weighted(table.map((entry, i) => [i, entry.weight]));
    const entry = table[pick];
    const got = {};
    for (const [resource, [min, max]] of Object.entries(entry.get)) {
      const added = this.economy.add(resource, this.rng.int(min, max));
      if (added > 0) got[resource] = added;
    }
    if (entry.buff) this.state.buffs[entry.buff] = this.state.totalMinutes + TOWN_BUFFS[entry.buff].hours * 60;
    if (entry.relic) this.state.civic.relics = (this.state.civic.relics ?? 0) + entry.relic / EXPEDITION.relicHappiness;
    this.events.emit('expedition:returned', { members, loot: got, text: entry.text, buff: entry.buff ?? null, relic: Boolean(entry.relic) });
    const list = Object.entries(got).map(([r, v]) => `${v} ${RESOURCES[r].name.toLocaleLowerCase('tr')}`).join(', ');
    this.events.emit('toast', {
      text: `Keşif seferi döndü! ${entry.text}${list ? `: ${list}` : ''}${entry.buff ? ' · Kadim Tılsım: 3 gün herkes daha hızlı ve keyifli' : ''}`,
      tone: 'success',
      icon: 'map',
    });
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
    const count = Math.min(candidates.length, this.rng.int(min, max));
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
