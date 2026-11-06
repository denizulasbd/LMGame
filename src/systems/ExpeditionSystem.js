// (16. aşama) Keşif seferleri, mini maceralar, kadim yazıtlar ve maceracıların hikâyeleri.
//
//   Sefer      : Liman ya da Belediye Konağı panelinden ('ui:launchExpedition' { source }) ya da "Kayıp Hazine
//                Haritası" kararından ('expedition:launch' { size, count }) yola çıkar. Kafile harita kenarına yürüyüp
//                bir gün görünmez olur (BehaviorSystem); süre dolunca döner.
//   Macera     : yolculuğun %30'unda (büyük seferde %65'inde de) bir "Maceracı Günlüğü" penceresi açılır (karar
//                penceresi, oyun durur; DilemmaSystem.openAdventure). Seçeneklerin riski kafiledeki ustalara ve
//                Sağlam Aletlere göre hesaplanır (Exploration.optionRisk); kazada bir sakin yaralanır / üşür
//                (dönünce hastadır) ve ganimetin yarısı gelir. Seçilen yol seferin adını verir.
//   Dönüş      : ganimet stoğa girer, egzotik eşyalar (fide, meşale, harita, yadigâr parçası) ve kadim yazıtlar kasabaya
//                geçer; her maceracının anısına seferin hikâyesi yazılır; iki gün akşamları handa (yoksa ateş başında /
//                meydanda) maceralarını anlatırlar: başlarında dağ balonu, dinleyenlerin keyfi artar.
//   Yazıt      : harabe onarılınca içinden çıkar ('ruin:restored'); Bilgelik Evi'nde çözülür ('ui:decodeInscription'
//                { id }; Bilge araştırma yokken çalışır, ResearchSystem.work) ve kalıcı bir imar şeması verir.
// Yayınladığı olaylar: 'expedition:departed', 'adventure:opened', 'adventure:resolved' { scenario, option, success,
// member, risk }, 'expedition:returned' { members, loot, route, finds, hurt, memories, ... }, 'exotic:found' { item },
// 'inscription:found' { id, inscription, source }, 'inscription:decodeStarted', 'expedition:taleTold' { teller, listeners }.
import { EXPLORATION, ADVENTURES, ADVENTURE_KEYS, EXOTIC_ITEMS, INSCRIPTIONS, INSCRIPTION_KEYS } from '../data/exploration.js';
import { EXPEDITION } from '../data/dilemmas.js';
import { TOWN_BUFFS } from '../data/town.js';
import { RESOURCES } from '../data/resources.js';
import { pickParty, optionRisk, describeOption, expeditionLaunchStatus, decodeStatus, emptyExploration } from './Exploration.js';
import { clamp } from '../utils/math.js';

const FIND_PHRASES = {
  inscription: "Kadim Yazıt'ı",
  ancientTorch: "Kadim Meşale'yi",
  cityMap: "Kayıp Şehir Haritası'nı",
  vineSeed: 'egzotik fideleri',
  relicShard: 'kadim bir yadigâr parçasını',
};
const FIND_ORDER = ['inscription', 'ancientTorch', 'cityMap', 'relicShard', 'vineSeed'];

export class ExpeditionSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy, health, dilemmas }} services
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, { economy, health, dilemmas }, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.health = health;
    this.dilemmas = dilemmas;
    this.rng = rng;
    this.state.exploration ??= emptyExploration();
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('ui:launchExpedition', ({ source }) => this.launchFrom(source)),
      on('expedition:launch', ({ size, count }) => this.launch(size, count, 'dilemma')),
      on('expedition:memberReturned', () => this.finish(false)),
      on('adventure:chosen', (p) => this.resolve(p)),
      on('ruin:restored', ({ building }) => this.onRuinRestored(building)),
      on('ui:decodeInscription', ({ id }) => this.startDecoding(id)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get exploration() {
    return this.state.exploration;
  }

  get expedition() {
    return this.state.dilemma.expedition;
  }

  members(exp = this.expedition) {
    return (exp?.members ?? []).map((id) => this.world.getCharacter(id)).filter(Boolean);
  }

  // ---------------------------------------------------------------------------
  // Yola çıkış
  // ---------------------------------------------------------------------------

  /** Liman / Belediye Konağı panelinden düzenlenen 3 kişilik sefer. */
  launchFrom(source) {
    const status = expeditionLaunchStatus(this.state, source);
    if (!status.ok) {
      this.events.emit('toast', { text: `Keşif seferi: ${status.reason}`, tone: 'warn', icon: 'map' });
      return status;
    }
    this.economy.spend(EXPLORATION.cost);
    this.exploration.lastLaunchDay = this.state.time.day;
    return this.launch('grand', EXPLORATION.partySize, source) ? status : { ok: false, reason: 'Kafile kurulamadı' };
  }

  /** Kafileyi yola çıkarır. size: 'small' (1 macera) | 'big' | 'grand' (2 macera). */
  launch(size, count, source) {
    if (this.expedition) return false;
    const party = source === 'dilemma' ? this.dilemmas.pickExplorers(count) : pickParty(this.state.characters, count);
    if (party.length === 0) return false;
    // "Kayıp Hazine Haritası" kararının büyük seferi: aleti olmayanlara depodan Sağlam Alet verilir (seferde aşınır)
    if (size === 'big') {
      for (const c of party) if (c.equipment.tool !== 'sturdyTool' && this.state.equipment.sturdyTool > 0) this.state.equipment.sturdyTool -= 1;
    }
    const now = this.state.totalMinutes;
    const minutes = (source === 'dilemma' ? EXPEDITION.hours : EXPLORATION.hours) * 60;
    const plan = this.rng.shuffle([...ADVENTURE_KEYS]).slice(0, size === 'small' ? 1 : 2);
    const exit = this.world.findEntryTile(this.rng);
    this.state.dilemma.expedition = {
      members: party.map((c) => c.id),
      until: now + minutes,
      size,
      source,
      startedAt: now,
      adventures: plan,
      next: 0,
      nextAt: now + Math.round(minutes * EXPLORATION.adventureAt[0]),
      log: [],
      loot: {},
      finds: [],
      hurt: [],
      spirit: 0,
      route: null,
    };
    this.exploration.expeditions += 1;
    this.events.emit('expedition:depart', { ids: party.map((c) => c.id), until: now + minutes, exit });
    this.events.emit('expedition:departed', { members: party, until: now + minutes, source });
    if (source !== 'dilemma') {
      this.events.emit('toast', { text: `Keşif kafilesi yola çıktı: ${party.map((c) => c.name).join(', ')}. Yarın bu saatlerde dönerler; yolda kararını isteyecekler!`, tone: 'success', icon: 'map' });
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Maceralar
  // ---------------------------------------------------------------------------

  update(tick) {
    const exp = this.expedition;
    if (exp && tick.gameMinutes > 0) {
      const now = this.state.totalMinutes;
      if (exp.adventures && exp.next < exp.adventures.length && now >= exp.nextAt && now < exp.until) this.openNext(exp);
      if (now >= exp.until + 120) this.finish(true); // dönüş gecikirse yine de sonuçlanır
    }
    if (tick.gameMinutes > 0) this.updateTales(tick.gameMinutes);
  }

  openNext(exp) {
    const id = exp.adventures[exp.next];
    const def = ADVENTURES[id];
    const members = this.members(exp);
    if (!def || members.length === 0) {
      exp.next += 1;
      return;
    }
    const details = Object.fromEntries(def.options.map((o) => [o.id, describeOption(members, o)]));
    const text = `${def.text} (Kafile: ${members.map((c) => c.name).join(', ')})`;
    if (!this.dilemmas.openAdventure(id, { text, details })) {
      exp.nextAt = this.state.totalMinutes + EXPLORATION.retryMinutes; // başka bir pencere açık: biraz sonra
      return;
    }
    this.events.emit('adventure:opened', { id, scenario: def, members });
  }

  /** Macera penceresinde seçim yapıldı (DilemmaSystem 'adventure:chosen' yayınlar). */
  resolve({ id, optionId, auto }) {
    const exp = this.expedition;
    const def = ADVENTURES[id];
    if (!exp || !def) return;
    const option = def.options.find((o) => o.id === optionId) ?? def.options.find((o) => o.default);
    const members = this.members(exp);
    const risk = optionRisk(members, option);
    const mishap = risk.chance > 0 && this.rng.next() < risk.chance;
    const victim = mishap ? this.rng.pick(members) : null;
    for (const [resource, [min, max]] of Object.entries(option.loot ?? {})) {
      const n = this.rng.int(min, max);
      exp.loot[resource] = (exp.loot[resource] ?? 0) + (mishap ? Math.floor(n / 2) : n);
    }
    const found = [];
    if (!mishap) for (const f of option.finds ?? []) if (this.rng.next() < f.chance) found.push(f.item);
    exp.finds.push(...found);
    if (victim && !exp.hurt.includes(victim.id)) exp.hurt.push(victim.id);
    exp.spirit += option.spirit ?? 0;
    // Seferin adı: riskli bir yol seçildiyse onun adı, yoksa ilk yolun adı
    if (!exp.route || (option.risk && !exp.routeBold)) {
      exp.route = option.route;
      exp.routeBold = Boolean(option.risk);
    }
    const text = mishap
      ? `${def.title}: ${option.label} — ${victim.name} ${option.risk.text}; kafile ganimetin yarısıyla yola devam ediyor`
      : `${def.title}: ${option.label}${found.length ? ` — ${found.map((f) => (f === 'inscription' ? 'kadim bir yazıt' : EXOTIC_ITEMS[f].name)).join(', ')} bulundu!` : ' — yol sorunsuz geçti'}`;
    exp.log.push({ id, option: option.id, success: !mishap, victim: victim?.id ?? null, found, text, day: this.state.time.day, hour: this.state.time.hour });
    exp.next += 1;
    if (exp.next < exp.adventures.length) {
      const total = exp.until - exp.startedAt;
      exp.nextAt = Math.max(this.state.totalMinutes + 60, exp.startedAt + Math.round(total * EXPLORATION.adventureAt[exp.next]));
    }
    this.state.stats.adventures = (this.state.stats.adventures ?? 0) + 1;
    this.events.emit('adventure:resolved', { id, scenario: def, option, success: !mishap, member: victim, risk, found, auto });
    this.events.emit('toast', { text: `Maceracı Günlüğü · ${text}`, tone: mishap ? 'warn' : 'success', icon: def.icon });
  }

  // ---------------------------------------------------------------------------
  // Dönüş
  // ---------------------------------------------------------------------------

  /** Seferdekilerin hepsi döndüyse ganimet dağıtılır (force: dönüş gecikirse yine de sonuçlanır). */
  finish(force) {
    const exp = this.expedition;
    if (!exp) return;
    const members = this.members(exp);
    if (!force && members.some((c) => c.away)) return;
    this.state.dilemma.expedition = null;
    // Kapanmamış bir macera penceresi kaldıysa (dönüş gecikmesi) kapatılır
    if (this.state.dilemma.active?.kind === 'adventure') this.dilemmas.closeAdventure();

    // 11. aşamanın ganimet tablosu (seferin kendi ödülü) + maceralardan gelenler
    const table = EXPEDITION.loot[exp.size === 'small' ? 'small' : 'big'];
    const civic = this.state.civic;
    const sinceTalisman = (civic.expeditionsSinceTalisman ?? 0) + 1;
    const talismanEntry = EXPEDITION.loot.big.find((e) => e.buff === 'talisman');
    let entry = table[this.rng.weighted(table.map((e, i) => [i, e.weight]))];
    if (!entry.buff && sinceTalisman >= EXPEDITION.talismanPity) entry = talismanEntry;
    civic.expeditionsSinceTalisman = entry.buff === 'talisman' ? 0 : sinceTalisman;
    const got = {};
    const add = (resource, amount) => {
      if (amount <= 0) return;
      if (resource === 'herbs') {
        const hut = this.world.getCompleted('healerHut')[0];
        if (hut) {
          hut.herbs = (hut.herbs ?? 0) + amount;
          got.herbs = (got.herbs ?? 0) + amount;
          return;
        }
        resource = 'food'; // şifacı kulübesi yoksa otlar mutfağa
      }
      const added = this.economy.add(resource, amount);
      if (added > 0) got[resource] = (got[resource] ?? 0) + added;
    };
    for (const [resource, [min, max]] of Object.entries(entry.get)) add(resource, this.rng.int(min, max));
    for (const [resource, amount] of Object.entries(exp.loot ?? {})) add(resource, amount);
    if (entry.buff) this.state.buffs[entry.buff] = this.state.totalMinutes + TOWN_BUFFS[entry.buff].hours * 60;
    if (entry.relic) civic.relics = (civic.relics ?? 0) + entry.relic / EXPEDITION.relicHappiness;

    const finds = (exp.finds ?? []).map((item) => this.grantFind(item, 'expedition')).filter(Boolean);
    // Yaralananlar / üşüyenler dönünce hasta yatar
    const hurt = (exp.hurt ?? []).map((id) => this.world.getCharacter(id)).filter(Boolean);
    for (const c of hurt) {
      if (!c.illness) this.health.fallIll(c);
      if (c.illness) c.illness.remaining = Math.max(c.illness.remaining, EXPLORATION.injuryHours * 60);
    }
    const route = exp.route ?? (exp.size === 'small' ? 'Keşif' : 'Kayıp Hazine');
    const findText = FIND_ORDER.filter((k) => finds.includes(k)).map((k) => FIND_PHRASES[k]);
    const memories = {};
    const until = this.state.totalMinutes + EXPLORATION.tale.days * 1440;
    for (const c of members) {
      const hurtNow = hurt.includes(c);
      const how = hurtNow ? 'yaralı ama yüzü gülerek döndü' : 'sağ salim döndü';
      memories[c.id] = `${route} Seferi'nden ${how}${findText.length ? ` ve ${joinList(findText)} keşfetti` : ''}`;
      c.needs.fun = clamp(c.needs.fun + (exp.spirit ?? 0), 0, 100);
      c.tale = { until, told: 0, progress: 0, route };
    }
    this.exploration.log.push({ day: this.state.time.day, route, members: members.map((c) => c.name), finds, hurt: hurt.map((c) => c.name), adventures: (exp.log ?? []).map((l) => l.text) });
    if (this.exploration.log.length > 12) this.exploration.log.splice(0, this.exploration.log.length - 12);
    this.events.emit('expedition:returned', { members, loot: got, text: entry.text, buff: entry.buff ?? null, relic: Boolean(entry.relic), route, finds, hurt, memories, size: exp.size });
    const list = Object.entries(got).map(([r, v]) => `${v} ${r === 'herbs' ? 'şifalı ot' : RESOURCES[r].name.toLocaleLowerCase('tr')}`).join(', ');
    const findList = finds.map((f) => (f === 'inscription' ? 'kadim bir yazıt' : EXOTIC_ITEMS[f].name)).join(', ');
    this.events.emit('toast', {
      text: `${route} Seferi döndü! ${entry.text}${list ? `: ${list}` : ''}${findList ? ` · Ganimet: ${findList}` : ''}${entry.buff ? ' · Kadim Tılsım: 3 gün herkes daha hızlı ve keyifli' : ''}`,
      tone: 'success',
      icon: 'map',
    });
  }

  /** Egzotik bir ganimeti ya da yazıtı kasabaya geçirir; ne olduğunu döndürür. */
  grantFind(item, source) {
    const ex = this.exploration;
    if (item === 'inscription') {
      const id = INSCRIPTION_KEYS.find((k) => !ex.inscriptions[k]);
      if (!id) return this.grantFind('relicShard', source); // bütün yazıtlar bulundu: yadigâr parçası
      this.foundInscription(id, source);
      return 'inscription';
    }
    if (item === 'cityMap') {
      if (ex.cityMap) return this.grantFind('relicShard', source); // ikinci harita: kadim bir parçaya döner
      ex.cityMap = true;
      this.events.emit('exotic:found', { item, def: EXOTIC_ITEMS.cityMap });
      return item;
    }
    if (!EXOTIC_ITEMS[item]) return null;
    ex.items[item] = (ex.items[item] ?? 0) + 1;
    if (item === 'relicShard' && ex.items.relicShard >= EXPLORATION.shardsPerRelic) {
      ex.items.relicShard -= EXPLORATION.shardsPerRelic;
      this.state.civic.relics = (this.state.civic.relics ?? 0) + EXPLORATION.relicHappiness / EXPEDITION.relicHappiness;
      this.events.emit('exotic:relicAssembled', {});
      this.events.emit('toast', { text: 'Üç Kadim Yadigâr Parçası birleşti! Belediyede sergilenen yadigâr kasaba refahına kalıcı +2 katıyor.', tone: 'success', icon: 'relicShard' });
    }
    this.events.emit('exotic:found', { item, def: EXOTIC_ITEMS[item] });
    return item;
  }

  foundInscription(id, source) {
    const ex = this.exploration;
    if (ex.inscriptions[id]) return false;
    ex.inscriptions[id] = { status: 'found', source, day: this.state.time.day };
    this.events.emit('inscription:found', { id, inscription: INSCRIPTIONS[id], source });
    this.events.emit('toast', { text: `Kadim bir yazıt bulundu: ${INSCRIPTIONS[id].name}! Bilgelik Evi'nde çözülmeyi bekliyor.`, tone: 'success', icon: 'inscription' });
    return true;
  }

  /** Harabe onarılınca içinden o harabenin yazıtı çıkar (bulunmuşsa yadigâr parçası). */
  onRuinRestored(building) {
    const id = INSCRIPTION_KEYS.find((k) => INSCRIPTIONS[k].ruin === building.type);
    if (id && !this.exploration.inscriptions[id]) this.foundInscription(id, 'ruin');
    else this.grantFind('relicShard', 'ruin');
  }

  startDecoding(id) {
    const status = decodeStatus(this.state, id);
    if (!status.ok) {
      this.events.emit('toast', { text: `Kadim yazıt: ${status.reason}`, tone: 'warn', icon: 'inscription' });
      return status;
    }
    this.exploration.inscriptions[id].status = 'decoding';
    this.exploration.decoding = { id, progress: 0 };
    this.events.emit('inscription:decodeStarted', { id, inscription: INSCRIPTIONS[id] });
    this.events.emit('toast', { text: `Bilge yazıtın başına oturdu: ${INSCRIPTIONS[id].name}`, tone: 'info', icon: 'inscription' });
    return status;
  }

  // ---------------------------------------------------------------------------
  // Maceraları anlatmak
  // ---------------------------------------------------------------------------

  updateTales(minutes) {
    const now = this.state.totalMinutes;
    const cfg = EXPLORATION.tale;
    for (const c of this.world.characters) {
      const tale = c.tale;
      if (!tale) continue;
      if (now >= tale.until || tale.told >= cfg.tellings) {
        c.tale = null;
        continue;
      }
      const task = c.task;
      if (!task || task.phase !== 'perform' || !cfg.venues.includes(task.activity)) continue;
      tale.progress += minutes;
      if (tale.progress < cfg.minutes) continue;
      const listeners = this.world.characters.filter(
        (o) => o !== c && !o.away && o.task?.phase === 'perform' && o.task.buildingId === task.buildingId && cfg.venues.includes(o.task.activity)
      );
      if (listeners.length === 0) {
        tale.progress = cfg.minutes; // dinleyen gelince hemen anlatır
        continue;
      }
      tale.progress = 0;
      tale.told += 1;
      c.needs.fun = clamp(c.needs.fun + cfg.tellerFun, 0, 100);
      if (c.visible) c.showBubble(tale.told % 2 ? 'adventure' : 'treasure', 3);
      for (const o of listeners) {
        o.needs.fun = clamp(o.needs.fun + cfg.listenerFun, 0, 100);
        if (o.visible && !o.bubble) o.showBubble('laugh', 2.2);
      }
      this.state.stats.talesTold = (this.state.stats.talesTold ?? 0) + 1;
      this.events.emit('expedition:taleTold', { teller: c, listeners, route: tale.route });
    }
  }
}

function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ve ${items[items.length - 1]}`;
}

