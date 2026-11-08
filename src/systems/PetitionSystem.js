// (21. aşama) Vatandaş istekleri / dilekçeler. Sayılar src/data/citizens.js'te, saf hesaplar ./Petitions.js'te.
// Mevcut ikilem olaylarından (DilemmaSystem) bağımsızdır: oyunu durdurmaz, karar penceresi açmaz.
//
//   Oluşma   : 2-3 günde bir (09:00-17:00 arası saat başı) bir yetişkin huyuna, mesleğine ve kasabanın o anki eksiğine göre
//              yöneticiden bir şey ister (Doğa Tutkunu evinin yanına fidan, Kitap Kurdu Bilgelik Evi / araştırma / antik kitap,
//              oduncu-taşçı-madenci ve sonbahar-kış kışlık stok ya da sağlam alet, Müzisyen meydanda buluşma, herkes sokağına
//              fener / bank). Başında parşömen balonu çıkar, günlüğe ve bildirime düşer: 'petition:opened'. Aynı anda en çok 2.
//   Yanıt    : oyuncu karakter kartından (ya da meydan / Belediye panelinden) kabul eder ('ui:acceptPetition': +yarım gün
//              süre), reddeder ('ui:rejectPetition') ya da bedelini ödeyip hemen karşılar ('ui:grantPetition': fidan diker,
//              bank koyar, alet verir, zili çalar).
//   Sonuç    : istek 2,5 gün içinde yerine gelirse sakinin keyfi ve Yönetim Güveni artar, kasabaya bir günlük "Sesimiz
//              Duyuldu" refah bonusu gelir, sakin Yaşam Günlüğü'ne olumlu bir anı yazar; süresi dolarsa ya da reddedilirse
//              keyfi ve güven düşer: 'petition:resolved' { petition, outcome: fulfilled | rejected | expired }.
// Durum: state.petitions (kayda girer).
import { PETITIONS, PETITION_KINDS } from '../data/citizens.js';
import { BUILDINGS } from '../data/buildings.js';
import { GOLDEN_AGE } from '../data/goldenAge.js';
import { getSeason } from '../data/seasons.js';
import { emptyPetitions, petitionOf } from './Citizens.js';
import { petitionMet, nearHomeIds, grantStatus, researchLeft, PETITION_TYPES } from './Petitions.js';
import { isGoldenAge } from './GoldenAge.js';
import { primarySkill } from './SkillSystem.js';
import { foodSupply } from './TownStatus.js';
import { addMemory } from './MemorySystem.js';
import { clamp } from '../utils/math.js';
import { genitive } from '../utils/turkish.js';
import { storageLimit } from './Granary.js';
import { CRAFT_TYPES, innForCask } from './Petitions.js';

// (27.2) Yeni nesil huyların (25.3) kendi dilekçeleri. Altın Çağ'da bu huylu sakinlerin kendi dilekçeleri ağırlıkça öne çıkar ve
// adaylar arasında önceliklidir (kendi üreteciyle, seed + 23); Altın Çağ'dan önce hiçbir ağırlık ya da zar değişmez.
export const NEW_GEN_PETITIONS = { craftsman: ['craftTools'], entrepreneur: ['marketFees'], philosopher: ['academy', 'research', 'books'], festive: ['sherbetCask'] };
export const NEW_GEN_PRIORITY = { weight: 3, chance: 0.5 }; // ağırlık çarpanı; Altın Çağ'da ilki açıldıktan sonra adaya öncelik olasılığı

const OUTDOOR_TRADES = ['woodcutting', 'masonry', 'mining'];
const HEARD_BUFF = 'heard';

export class PetitionSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy, construction, crafting, trust }} services
   * @param {import('../utils/random.js').Random} rng
   * @param {{ attract?: boolean }} options
   */
  constructor(game, world, services, rng, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = services.economy;
    this.construction = services.construction;
    this.crafting = services.crafting;
    this.trust = services.trust;
    this.rng = rng;
    this.attract = attract;
    this.state.petitions ??= emptyPetitions();
    if (this.state.petitions.nextAt === null) this.state.petitions.nextAt = this.state.totalMinutes + PETITIONS.firstAfterMinutes;

    const on = (name, handler) => game.events.on(name, handler);
    const meet = () => {
      for (const p of this.state.petitions.list) if (p.kind === 'gathering') p.met = true;
    };
    this.unsubscribers = [
      on('time:hour', (hour) => this.hourly(hour)),
      on('ui:acceptPetition', ({ id }) => this.accept(id)),
      on('ui:rejectPetition', ({ id }) => this.reject(id)),
      on('ui:grantPetition', ({ id }) => this.grant(id)),
      on('rally:rung', meet),
      on('festival:started', meet),
      on('seasonFestival:ended', meet),
      // Yapı kurulunca / araştırma başlayınca / alet kuşanılınca dilekçe hemen karşılanmış sayılır
      on('building:placed', () => this.checkAll()),
      on('research:started', () => this.checkAll()),
      on('equipment:equipped', () => this.checkAll()),
      on('goldenAge:book', () => this.checkAll()),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get list() {
    return this.state.petitions.list;
  }

  find(id) {
    return this.list.find((p) => p.id === id) ?? null;
  }

  hourly(hour) {
    this.checkAll();
    const now = this.state.totalMinutes;
    for (const p of [...this.list]) if (now >= p.deadline) this.resolve(p, 'expired');
    const pt = this.state.petitions;
    if (!this.attract && now >= pt.nextAt && hour >= PETITIONS.hours[0] && hour < PETITIONS.hours[1] && this.list.length < PETITIONS.maxOpen) {
      if (this.create()) pt.nextAt = now + this.rng.int(PETITIONS.intervalMinutes[0], PETITIONS.intervalMinutes[1]);
      else pt.nextAt = now + 240; // uygun kimse yoksa birkaç saat sonra yeniden dener
    }
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    // Açık dilekçesi olan sakinin başında arada bir parşömen balonu
    const now = this.state.totalMinutes;
    for (const p of this.list) {
      if (now - (p.bubbleAt ?? -Infinity) < PETITIONS.bubbleEveryMinutes) continue;
      const c = this.world.getCharacter(p.characterId);
      if (!c?.visible || c.bubble) continue;
      c.showBubble('scroll', 2.6);
      p.bubbleAt = now;
    }
  }

  /** Karşılanan dilekçeleri sonuçlandırır; kayıp sakinin dilekçesi düşer. */
  checkAll() {
    for (const p of [...this.list]) {
      if (!this.world.getCharacter(p.characterId)) {
        this.list.splice(this.list.indexOf(p), 1);
        continue;
      }
      if (petitionMet(this.state, p)) this.resolve(p, 'fulfilled');
    }
  }

  // ---------------------------------------------------------------------------
  // Oluşma
  // ---------------------------------------------------------------------------

  /** Bu sakinin isteyebileceği dilekçeler ve ağırlıkları: [[tür, ağırlık], ...] */
  optionsFor(c) {
    const s = this.state;
    const out = [];
    const quirk = c.quirk;
    const skill = primarySkill(c)?.skill ?? null;
    const has = (type) => s.buildings.some((b) => b.type === type);
    const season = getSeason(s.time.day).key;
    if (c.homeId !== null) {
      out.push(['sapling', quirk === 'natureEnthusiast' ? 5 : 1]);
      out.push(['street', quirk === 'animalLover' ? 3 : 2]);
    }
    if (quirk === 'bookworm') {
      if (!s.buildings.some((b) => BUILDINGS[b.type].academy)) out.push(['academy', 5]);
      else if (!s.research.active && researchLeft(s)) out.push(['research', 4]);
      if (isGoldenAge(s) && (s.goldenAge.books ?? 0) < GOLDEN_AGE.maxBooks) out.push(['books', 4]);
    }
    const outdoor = OUTDOOR_TRADES.includes(skill);
    if ((outdoor || season === 'autumn' || season === 'winter') && this.stockTarget()) out.push(['stock', outdoor ? 4 : 2]);
    if (skill && c.equipment.tool !== 'sturdyTool' && has('workshop')) out.push(['tool', outdoor ? 4 : 2]);
    if (s.buildings.some((b) => (b.type === 'fountain' || b.type === 'campfire') && b.functional)) out.push(['gathering', quirk === 'musician' || quirk === 'festive' ? 5 : 1]);
    // (25.3) Yeni nesil huylar (yalnızca o huydaki sakinler; öteki sakinlerin seçenekleri ve zarları değişmez)
    if (quirk === 'philosopher') {
      if (!s.buildings.some((b) => BUILDINGS[b.type].academy)) out.push(['academy', 5]);
      else if (!s.research.active && researchLeft(s)) out.push(['research', 4]);
      if (isGoldenAge(s) && (s.goldenAge.books ?? 0) < GOLDEN_AGE.maxBooks) out.push(['books', 5]);
    }
    if (quirk === 'craftsman' && s.buildings.some((b) => CRAFT_TYPES.includes(b.type) && b.functional)) out.push(['craftTools', 5]);
    if (quirk === 'entrepreneur' && !['low', 'exempt'].includes(s.tax?.rate)) out.push(['marketFees', 5]);
    if (quirk === 'festive' && innForCask(s)) out.push(['sherbetCask', 5]);
    // (27.2) Altın Çağ'da yeni nesil huyların kendi dilekçeleri belirgin biçimde öne çıkar (öncesinde hiçbir ağırlık değişmez)
    const own = isGoldenAge(s) ? NEW_GEN_PETITIONS[quirk] : null;
    if (own) {
      let found = false;
      for (const o of out) if (own.includes(o[0])) { o[1] *= NEW_GEN_PRIORITY.weight; found = true; }
      // Bilge Düşünür: araştırmalar ve kitaplar bitmişse meydanda bilgelik sohbeti (Toplanma) kendi dilekçesi gibi öne çıkar
      if (!found && quirk === 'philosopher') for (const o of out) if (o[0] === 'gathering') o[1] = 5 * NEW_GEN_PRIORITY.weight;
    }
    return out;
  }

  /** (27.2) Sakinin bu seçeneklerinden yeni nesil huyuna özgü olanlar (Bilge Düşünür'de yedek: bilgelik sohbeti). */
  newGenKinds(c, options) {
    const own = NEW_GEN_PETITIONS[c.quirk];
    if (!own) return [];
    const mine = options.filter(([k]) => own.includes(k));
    if (mine.length || c.quirk !== 'philosopher') return mine;
    return options.filter(([k]) => k === 'gathering');
  }

  /** (27.2) Altın Çağ başladığından beri yeni nesil huylu bir sakinin kendi dilekçesi açıldı mı (açık listede ya da defterde)? */
  newGenOpenedInGoldenAge() {
    const s = this.state;
    const since = s.goldenAge?.since?.day ?? Infinity;
    const isNew = (p) => {
      if (!(p.day >= since)) return false;
      const quirk = s.characters.find((x) => x.id === p.characterId)?.quirk;
      const own = NEW_GEN_PETITIONS[quirk];
      return Boolean(own) && (own.includes(p.kind) || (quirk === 'philosopher' && p.kind === 'gathering'));
    };
    return (s.petitions.list ?? []).some(isNew) || (s.petitions.log ?? []).some(isNew);
  }

  /** Kışlık stok hedefi (zaten güvenli seviyedeyse null). */
  stockTarget() {
    const s = this.state;
    const cap = s.storageCapacity;
    const pop = s.characters.length;
    const target = (current) => Math.round(Math.min(cap * 0.7, Math.max(current + 30, pop * 5)));
    const wood = target(s.resources.wood ?? 0);
    const foodCap = storageLimit(s, 'food'); // (24. aşama) Ürün Silosu yiyeceğe yer açar
    const food = Math.round(Math.min(foodCap * 0.7, Math.max(Math.floor(foodSupply(s)) + 30, pop * 5)));
    if ((s.resources.wood ?? 0) >= wood && foodSupply(s) >= food) return null;
    return { wood, food };
  }

  /** Uygun bir sakinden yeni bir dilekçe. Dönüş: dilekçe ya da null. */
  create(forceKind = null, forceId = null) {
    const s = this.state;
    const pool = s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.newcomer && !petitionOf(s, c) && (forceId === null || c.id === forceId));
    let order = this.rng.shuffle([...pool]);
    // (27.2) Altın Çağ'da kendi dilekçesi açılabilen yeni nesil huylu sakinler adaylar arasında öne geçer: Altın Çağ'da henüz hiç
    // açılmadıysa her zaman (ve yalnızca kendi dilekçesi), sonra NEW_GEN_PRIORITY.chance olasılıkla (kendi üreteci)
    let firstOnly = false;
    if (isGoldenAge(s) && !forceKind && forceId === null) {
      const special = new Set(order.filter((c) => this.newGenKinds(c, this.optionsFor(c)).length > 0));
      if (special.size) {
        firstOnly = !this.newGenOpenedInGoldenAge();
        if (firstOnly || this.rng.next() < NEW_GEN_PRIORITY.chance) order = [...order.filter((c) => special.has(c)), ...order.filter((c) => !special.has(c))];
      }
    }
    for (const c of order) {
      let options = this.optionsFor(c);
      if (forceKind) options = options.filter(([k]) => k === forceKind);
      if (firstOnly) {
        const mine = this.newGenKinds(c, options);
        if (mine.length) options = mine;
      }
      if (options.length === 0) continue;
      return this.open(c, this.rng.weighted(options));
    }
    return null;
  }

  open(c, kind) {
    const s = this.state;
    const now = s.totalMinutes;
    const def = PETITION_KINDS[kind];
    const pt = s.petitions;
    const baseline = {};
    if (PETITION_TYPES[kind]) baseline.ids = nearHomeIds(s, c.homeId, kind);
    if (kind === 'research') {
      baseline.done = Object.keys(s.research.done ?? {}).length;
      baseline.active = s.research.active?.id ?? null;
    }
    if (kind === 'books') baseline.books = s.goldenAge?.books ?? 0;
    if (kind === 'craftTools') baseline.upgraded = s.buildings.filter((b) => CRAFT_TYPES.includes(b.type) && b.upgraded).length;
    const p = {
      id: pt.nextId++,
      kind,
      characterId: c.id,
      name: c.name,
      text: def.text,
      createdAt: now,
      deadline: now + PETITIONS.deadlineMinutes,
      status: 'open',
      baseline,
      ...(kind === 'stock' ? { target: this.stockTarget() } : {}),
      day: s.time.day,
      hour: s.time.hour,
    };
    pt.list.push(p);
    pt.made += 1;
    if (c.visible) c.showBubble('scroll', 3);
    p.bubbleAt = now;
    this.events.emit('petition:opened', { petition: p, character: c });
    this.events.emit('toast', { text: `Dilekçe · ${c.name}: "${def.text}"`, tone: 'info', icon: 'scroll' });
    return p;
  }

  // ---------------------------------------------------------------------------
  // Yanıt
  // ---------------------------------------------------------------------------

  accept(id) {
    const p = this.find(id);
    if (!p || p.status === 'accepted') return false;
    p.status = 'accepted';
    p.deadline += PETITIONS.acceptExtraMinutes;
    this.state.petitions.accepted += 1;
    const c = this.world.getCharacter(p.characterId);
    if (c) {
      c.needs.fun = clamp(c.needs.fun + PETITIONS.accept.fun, 0, 100);
      if (c.visible) c.showBubble('sparkle', 2);
    }
    this.trust?.adjust(PETITIONS.accept.trust, 'petitionAccepted');
    this.events.emit('petition:accepted', { petition: p, character: c });
    this.events.emit('toast', { text: `${genitive(p.name)} dileği kabul edildi: ${PETITION_KINDS[p.kind].name}`, tone: 'info', icon: 'scroll' });
    return true;
  }

  reject(id) {
    const p = this.find(id);
    if (!p) return false;
    this.resolve(p, 'rejected');
    return true;
  }

  /** "Hemen Karşıla": bedeli ödenir ve istek yerine getirilir (fidan, bank, alet, toplanma zili). */
  grant(id) {
    const p = this.find(id);
    if (!p) return { ok: false };
    const c = this.world.getCharacter(p.characterId);
    const status = grantStatus(this.state, p, this.crafting?.stock?.sturdyTool ?? 0);
    const fail = (reason) => {
      this.events.emit('toast', { text: `${PETITION_KINDS[p.kind].name}: ${reason}`, tone: 'warn', icon: 'scroll' });
      return { ok: false, reason };
    };
    if (!status.available) return fail('Bu istek ancak kasabada yapılacak işlerle karşılanır');
    if (!status.ok) return fail(status.reason);
    if (p.kind === 'sapling' || p.kind === 'street') {
      const types = p.kind === 'sapling' ? this.rng.shuffle(['oakTree', 'birchTree', 'pineTree']) : ['bench', 'lantern'];
      const placed = this.placeNearHome(c, types);
      if (!placed) return fail('Evinin yakınında uygun bir yer yok');
    } else if (p.kind === 'tool') {
      if ((this.crafting?.stock?.sturdyTool ?? 0) > 0) this.crafting.equip(c, 'sturdyTool');
      else {
        if (!this.economy.spend(status.cost)) return fail('Yetersiz malzeme');
        c.equipment.tool = 'sturdyTool';
        if (c.visible) c.showBubble('sparkle', 2.4);
        this.events.emit('equipment:equipped', { character: c, item: 'sturdyTool' });
      }
    } else if (p.kind === 'gathering') {
      this.events.emit('ui:rallyBell');
    } else if (p.kind === 'craftTools' || p.kind === 'marketFees' || p.kind === 'sherbetCask') {
      // (25.3) bedel depodan / hazineden düşer; Fazladan Şerbet'te fıçılar hana taşınır
      const inn = p.kind === 'sherbetCask' ? innForCask(this.state) : null;
      if (p.kind === 'sherbetCask' && !inn) return fail('Fıçıya yer olan bir han yok');
      if (!this.economy.spend(status.cost)) return fail('Yetersiz kaynak');
      if (inn) inn.sherbet = Math.min(12, (inn.sherbet ?? 0) + status.cost.sherbet);
      p.met = true;
    }
    this.checkAll();
    return { ok: !this.find(id) };
  }

  /** Sakinin evinin çevresinde (en çok 4 karo) verilen türlerden ilk sığanı kurar. */
  placeNearHome(c, types) {
    const home = c ? this.world.getBuilding(c.homeId) : null;
    if (!home || !this.construction) return null;
    const { w, h } = home.definition.size;
    for (let r = 1; r <= 4; r++) {
      for (let y = home.tileY - r; y < home.tileY + h + r; y++) {
        for (let x = home.tileX - r; x < home.tileX + w + r; x++) {
          const ring = Math.max(home.tileX - x, x - (home.tileX + w - 1), home.tileY - y, y - (home.tileY + h - 1));
          if (ring !== r) continue;
          for (const type of types) {
            if (!this.construction.checkPlacement(type, x, y).ok) continue;
            const res = this.construction.placeSite(type, x, y, { quiet: true });
            if (res.ok) return res.building;
          }
        }
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Sonuç
  // ---------------------------------------------------------------------------

  resolve(p, outcome) {
    const s = this.state;
    const index = this.list.indexOf(p);
    if (index < 0) return;
    this.list.splice(index, 1);
    const pt = s.petitions;
    const c = this.world.getCharacter(p.characterId);
    const def = PETITION_KINDS[p.kind];
    const accepted = p.status === 'accepted';
    if (outcome === 'fulfilled') {
      pt.fulfilled += 1;
      this.trust?.adjust(PETITIONS.reward.trust + (accepted ? PETITIONS.reward.acceptedBonus : 0), 'petitionFulfilled');
      s.buffs[HEARD_BUFF] = Math.max(s.buffs[HEARD_BUFF] ?? 0, s.totalMinutes) + 24 * 60;
      if (c) {
        c.needs.fun = clamp(c.needs.fun + PETITIONS.reward.fun, 0, 100);
        addMemory(s, c, `Yöneticiye ilettiği dileği yerine getirildi: ${def.name.toLocaleLowerCase('tr')}`, 'scroll', { kind: 'life', fond: true });
        if (c.visible) c.showBubble('heart', 2.4);
      }
    } else {
      const rejected = outcome === 'rejected';
      pt[rejected ? 'rejected' : 'expired'] += 1;
      const delta = rejected ? PETITIONS.reject.trust : PETITIONS.expire.trust + (accepted ? PETITIONS.expire.brokenPromise : 0);
      this.trust?.adjust(delta, rejected ? 'petitionRejected' : 'petitionExpired');
      if (c) {
        c.needs.fun = clamp(c.needs.fun + (rejected ? PETITIONS.reject.fun : PETITIONS.expire.fun), 0, 100);
        const text = rejected ? `Dilekçesi reddedildi: ${def.name.toLocaleLowerCase('tr')}` : `Dilekçesi yanıtsız kaldı: ${def.name.toLocaleLowerCase('tr')}`;
        addMemory(s, c, text, 'sulk', { kind: 'life', fond: false });
        if (c.visible) c.showBubble('sulk', 2.4);
      }
    }
    const { day, hour } = s.time;
    pt.log.push({ id: p.id, kind: p.kind, name: p.name, characterId: p.characterId, text: p.text, outcome, accepted, day, hour });
    if (pt.log.length > PETITIONS.logSize) pt.log.splice(0, pt.log.length - PETITIONS.logSize);
    this.events.emit('petition:resolved', { petition: p, outcome, character: c });
    const tone = outcome === 'fulfilled' ? 'success' : 'warn';
    const verb = outcome === 'fulfilled' ? 'karşılandı' : outcome === 'rejected' ? 'reddedildi' : 'süresi doldu';
    this.events.emit('toast', { text: `${genitive(p.name)} dilekçesi ${verb}: ${def.name}`, tone, icon: outcome === 'fulfilled' ? 'scroll' : 'sulk' });
  }
}
