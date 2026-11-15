// (29.1) Sosyal Kimya ve Duygusal Etiketler: olaylardan etiket doğurur, kimyayı güncel tutar, etiketleri davranışa yansıtır.
// Saf hesaplar src/systems/Chemistry.js'te, sayılar ve sözler src/data/chemistry.js'te.
//
//   Kimya     : her saat başı kayıtlı çiftlerin kimyası yeniden hesaplanır (meslek kademesi, huy, zanaat bağı değişmiş olabilir).
//               Aynı üretim yapısında birlikte çalışanlar kalıcı zanaat bağı kurar (+1).
//   Etiketler : grateful   <- yangını söndürenlere (evin sakinleri / çalışanları), yarasını saran / iyileştiren şifacıya,
//                             dileğini karşılayan Yönetime, mezun eden ustasına, yadigârını devreden büyüğüne
//               admiration <- atölyede yanında çalıştığı Başustaya, sohbet ettiği dostu Kıdemli Bilgeye, şaheser çıkaran ustaya
//               resentful  <- dilekçesi reddedilince Yönetime, atışmada haksızlığa uğrayınca karşısındakine,
//                             hoşlandığı kişi başkasına aşık olunca ona
//               jealous    <- aynı yapıda kendisinden önce kademe atlayan iş arkadaşına, eşine ilgi gösteren bekâra,
//                             sevdiğini kapan rakibe
//               kindred    <- kimyası +2 / +3 olup en iyi arkadaş olan çift (karşılıklı; her sakinin tek ruh ikizi olur)
//   Davranış  : minnettar sakin sohbette karşısındakine günde bir ikramda bulunur (keyif, tokluk); Brain ve JobSystem
//               etiketlere bakarak oturacağı masayı ve gideceği şantiyeyi seçer (Chemistry.hasTag).
//   Görsel    : kimyası +2 / +3 olan iki yetişkin yolda karşılaşınca başlarında mavi şimşek ('spark') çakar; etiketi olan
//               sakin selamını etiketine göre söyler (metin baloncuğu).
//
// DETERMİNİZM: bu sistemin üreteci YOKTUR. Kıvılcım kimlik çiftinden ve tohumdan türer (izole); söz seçimi kimliklerden ve
// oyun saatinden hesaplanır. Ana üreteç, öteki sistemlerin üreteçleri ve Math.random hiç tüketilmez.
//
// Olaylar: 'chemistry:tag' { from, toId, to, tag }, 'chemistry:kindred' { a, b }, 'chemistry:spark' { a, b, chemistry },
//          'chemistry:treat' { from, to }, 'chemistry:craftBond' { a, b }
import {
  EMOTION_RULES,
  EMOTION_TAGS,
  KINDRED_MIN_CHEMISTRY,
  RULER_ID,
  TAG_GREETINGS,
  SPARK_GREETINGS,
  TREAT_LINES,
  TAG_BUBBLES,
} from '../data/chemistry.js';
import { ROMANCE } from '../data/relationships.js';
import { chemistryFor, chemistryOf, refreshChemistry, bondCraft, addTag, removeTag, hasTag, tagsOf, expireTags, pruneRelations } from './Chemistry.js';
import { getFriendship, isFamily, arePartners, pairKey } from './RelationshipSystem.js';
import { skillLevel } from './SkillSystem.js';
import { PROFESSIONS } from '../data/apprenticeship.js';
import { ageGap } from './LifeStages.js';
import { closeKin } from './Lineage.js';
import { addMemory } from './MemorySystem.js';
import { clamp } from '../utils/math.js';
import { engineOn } from './Engines.js';
import { DEBT_RULES, DEBT_MEMORIES } from '../data/loyalty.js';

// Selamda öne çıkan etiket (ilk bulunan söylenir)
const GREETING_ORDER = ['resentful', 'jealous', 'grateful', 'admiration', 'kindred'];

export class ChemistrySystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ relationships: import('./RelationshipSystem.js').RelationshipSystem }} services
   */
  constructor(game, world, { relationships }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.relationships = relationships;
    this.encounterCooldowns = new Map(); // çift -> yeniden parıldayabileceği oyun dakikası (kaydedilmez)
    this.treatDays = new Map(); // "veren>alan" -> ikram ettiği gün (kaydedilmez)
    pruneRelations(this.state.characters);
    const on = (name, fn) => game.events.on(name, fn);
    this.unsubscribers = [
      on('time:hour', () => this.onHour()),
      on('crisis:fireOut', ({ building, helpers } = {}) => this.onFireOut(building, helpers ?? [])),
      on('health:cured', ({ character, building } = {}) => this.thankHealers(character, building)),
      on('crisis:treatedAt', ({ character, building } = {}) => this.thankHealers(character, building)),
      on('petition:resolved', ({ outcome, character } = {}) => this.onPetition(character, outcome)),
      on('masterwork:created', ({ character, building } = {}) => this.onMasterwork(character, building)),
      on('apprentice:graduated', ({ character, masterId } = {}) => this.onGraduated(character, masterId)),
      on('heirloom:passed', ({ from, to } = {}) => from && to && this.tag(to, from.id, 'grateful')),
      on('apprentice:grandmaster', ({ character } = {}) => this.onGrandmaster(character)),
      on('skill:levelUp', ({ character, skill, level } = {}) => this.onSkillUp(character, skill, level)),
      on('relationship:quarrel', ({ a, b } = {}) => this.onQuarrel(a, b)),
      on('relationship:reconciled', ({ a, b } = {}) => this.onReconciled(a, b)),
      on('relationship:partnered', ({ a, b } = {}) => this.onPartnered(a, b)),
      on('population:left', () => pruneRelations(this.state.characters)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** İki sakinin kimyası (kayıt yoksa hesaplar ve yazar). */
  get(a, b) {
    return chemistryOf(this.state, a, b);
  }

  /** Kayıt açmadan kimya (yolda karşılaşan her çift için kayıt birikmesin). */
  peek(a, b) {
    return a.relationships?.[b.id]?.chemistry ?? chemistryFor(this.state.seed, a, b);
  }

  /**
   * A'ya B'ye (ya da Yönetime: toId = RULER_ID) karşı bir etiket verir. Yeni eklendiyse olayı yayınlar ve true döner.
   * days: etiketin varsayılan süresinin yerine (ör. atışma kırgınlığı kısa sürer).
   */
  tag(from, toId, tag, days = null) {
    if (!from || from.role) return false;
    // (30.6) vefat eden / ayrılan sakine kayıt yazılmaz (yadigâr devri ölenin ardından gelir: kopuk referans)
    if (toId !== RULER_ID && !this.state.characters.some((x) => x.id === toId)) return false;
    const now = this.state.totalMinutes;
    const added = addTag(from, toId, tag, now);
    if (days !== null && EMOTION_TAGS[tag].days !== null) from.relationships[toId].until[tag] = Math.round(now + days * 1440);
    if (!added) return false;
    if (tag === 'admiration') this.trimAdmiration(from, toId);
    const to = toId === RULER_ID ? null : this.world.getCharacter(toId);
    if (to) refreshChemistry(this.state, from, to);
    this.state.stats.emotionTags = (this.state.stats.emotionTags ?? 0) + 1;
    this.events.emit('chemistry:tag', { from, toId, to, tag });
    return true;
  }

  /** Hayranlık sınırlıdır: sınır aşılınca bitişi en yakın (en eski) hayranlık silinir (eşitlikte küçük kimlik). */
  trimAdmiration(from, keepId) {
    for (;;) {
      let count = 0;
      let oldest = null;
      for (const key in from.relationships) {
        const rel = from.relationships[key];
        if (!rel.tags.includes('admiration')) continue;
        count++;
        const id = Number(key);
        if (id === keepId) continue;
        if (!oldest || rel.until.admiration < oldest.until || (rel.until.admiration === oldest.until && id < oldest.id)) oldest = { id, until: rel.until.admiration };
      }
      if (count <= EMOTION_RULES.admireLimit || !oldest) return;
      removeTag(from, oldest.id, 'admiration');
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Olaylardan etiketler

  /** Yangın söndü: yapının sakinleri ve çalışanları, söndürenlere minnettar olur. */
  onFireOut(building, helperIds) {
    if (!building || helperIds.length === 0) return;
    const saved = this.world.characters.filter((c) => !c.role && (c.homeId === building.id || c.workplaceId === building.id || building.workerIds?.has(c.id)));
    // (29.6) Vefa: söndürenlerden en çok DEBT_RULES.fireThanks kişiye (kimlik sırasıyla) minnet ve kişinin adıyla bir anı
    const loyalty = engineOn('loyalty');
    for (const c of saved) {
      const ids = loyalty ? helperIds.filter((id) => id !== c.id && this.world.getCharacter(id)).sort((a, b) => a - b).slice(0, DEBT_RULES.fireThanks) : helperIds;
      for (const id of ids) {
        if (id !== c.id && this.world.getCharacter(id)) this.tag(c, id, 'grateful');
      }
      const first = loyalty ? this.world.getCharacter(ids[0]) : null;
      if (first) addMemory(this.state, c, (c.homeId === building.id ? DEBT_MEMORIES.fireHome : DEBT_MEMORIES.fireWork).replace('{who}', first.name), 'bucket', { kind: 'life', fond: true, whoId: first.id });
    }
  }

  /** Şifacı Kulübesi'nde iyileşen / yarası sarılan sakin, o sırada kulübede çalışan şifacılara minnettar olur. */
  thankHealers(c, building) {
    if (!c || !building) return;
    let thanked = 0;
    for (const id of building.workerIds ?? []) {
      if (id !== c.id && this.world.getCharacter(id) && ++thanked) this.tag(c, id, 'grateful');
    }
    if (thanked > 0) return;
    // Kulübede o an kimse yoksa: oraya sabitlenmiş şifacı, o da yoksa kasabanın en usta şifacısı (en az Kalfa)
    let best = null;
    for (const o of this.world.characters) {
      if (o === c || o.role || o.isChild) continue;
      const xp = (o.workplaceId === building.id ? 1e9 : 0) + (o.skills?.herbalism ?? 0);
      if (o.workplaceId !== building.id && skillLevel(o, 'herbalism').level < EMOTION_RULES.healerLevel) continue;
      if (!best || xp > best.xp) best = { o, xp };
    }
    if (best) this.tag(c, best.o.id, 'grateful');
  }

  /** Mezun olan çırak ustasına minnettar olur. */
  onGraduated(c, masterId) {
    if (c && Number.isFinite(masterId) && this.world.getCharacter(masterId)) this.tag(c, masterId, 'grateful');
  }

  /** Dileği karşılanan Yönetime minnettar, reddedilen kırgın olur. */
  onPetition(c, outcome) {
    if (!c) return;
    if (outcome === 'fulfilled') this.tag(c, RULER_ID, 'grateful');
    else if (outcome === 'rejected') this.tag(c, RULER_ID, 'resentful');
  }

  /** Şaheser: aynı yapıda çalışanlar ve ustanın dostları hayran kalır. */
  onMasterwork(master, building) {
    if (!master) return;
    for (const c of this.world.characters) {
      if (c === master || c.role) continue;
      const coworker = building?.workerIds?.has(c.id);
      if (coworker || getFriendship(this.state, c, master) >= EMOTION_RULES.admireScore) this.tag(c, master.id, 'admiration');
    }
  }

  /** Yeni Başusta: dostları ve ustası hayran kalır. */
  onGrandmaster(c) {
    if (!c) return;
    for (const o of this.world.characters) {
      if (o === c || o.role || o.isGrandmaster) continue;
      if (getFriendship(this.state, o, c) >= EMOTION_RULES.admireScore) this.tag(o, c.id, 'admiration');
    }
  }

  /** Kademe atlayan sakine, aynı yapıda o an çalışan ve o meslekte geride kalan (dostu olmayan) iş arkadaşları kıskanır. */
  onSkillUp(c, skill, level) {
    if (!c || !skill || (level?.level ?? 0) < 2) return;
    const building = c.task?.workBuildingId ? this.world.getBuilding(c.task.workBuildingId) : null;
    if (!building?.workerIds) return;
    for (const id of building.workerIds) {
      const o = this.world.getCharacter(id);
      if (!o || o === c || o.isChild || isFamily(o, c) || arePartners(o, c)) continue;
      if (skillLevel(o, skill).level >= level.level) continue;
      if (getFriendship(this.state, o, c) >= EMOTION_RULES.jealousBelow) continue;
      this.tag(o, c.id, 'jealous');
    }
  }

  /** Atışmada haksızlığa uğrayan (daha sakin mizaçlı; eşitse keyfi düşük olan) kısa bir süre kırgın kalır. */
  onQuarrel(a, b) {
    if (!a || !b) return;
    const ta = a.profile?.quarrelChance ?? 1;
    const tb = b.profile?.quarrelChance ?? 1;
    let wronged;
    if (ta !== tb) wronged = ta < tb ? a : b;
    else if (a.needs.fun !== b.needs.fun) wronged = a.needs.fun < b.needs.fun ? a : b;
    else wronged = a.id > b.id ? a : b;
    this.tag(wronged, wronged === a ? b.id : a.id, 'resentful', EMOTION_RULES.quarrelResentDays);
  }

  onReconciled(a, b) {
    if (!a || !b) return;
    removeTag(a, b.id, 'resentful');
    removeTag(b, a.id, 'resentful');
  }

  /** Karşılıksız aşk: çiftten birine gönlü olan bekâr ona kırılır, sevdiğini kapanı kıskanır. */
  onPartnered(a, b) {
    if (!a || !b) return;
    for (const x of this.world.characters) {
      if (x === a || x === b || x.role || x.isChild || x.partnerId !== null) continue;
      let best = null;
      for (const [target, rival] of [[a, b], [b, a]]) {
        if (isFamily(x, target) || closeKin(x, target) || ageGap(x, target) > ROMANCE.maxAgeGap) continue;
        const score = getFriendship(this.state, x, target);
        if (score < EMOTION_RULES.crushScore || this.peek(x, target) < 1) continue;
        if (!best || score > best.score) best = { target, rival, score };
      }
      if (!best) continue;
      this.tag(x, best.target.id, 'resentful');
      this.tag(x, best.rival.id, 'jealous');
      this.events.emit('chemistry:unrequited', { from: x, target: best.target, rival: best.rival }); // (29.2) Kalbi Kırık
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Saat başı: süre, kimya, zanaat bağı, hayranlık, eş kıskançlığı, ruh ikizi

  onHour() {
    const state = this.state;
    const now = state.totalMinutes;
    const characters = this.world.characters;
    for (const c of characters) expireTags(c, now);
    pruneRelations(this.state.characters); // (30.6) kopuk kimya kaydı (ölen sakine) hiçbir karede kalmaz

    const present = new Set(characters); // (30.3) aynı saatte ayrılan / ölen sakin grupta kalmış olabilir: ona kayıt yazılmaz (kopuk referans)
    for (const group of this.relationships.groups) {
      const members = group.members;
      if (members.length < 2) continue;
      const workshop = group.kind === 'work' && group.id.startsWith('work:building:') && Boolean(PROFESSIONS[this.world.getBuilding(group.buildingId)?.type]);
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const a = members[i];
          const b = members[j];
          if (a.role || b.role || !present.has(a) || !present.has(b)) continue;
          if (workshop && bondCraft(state, a, b, EMOTION_RULES.craftHours)) this.events.emit('chemistry:craftBond', { a, b });
          this.admire(a, b, workshop);
          this.admire(b, a, workshop);
          if (group.kind !== 'work') {
            this.attention(a, b);
            this.attention(b, a);
          }
        }
      }
    }

    // Kayıtlı çiftlerin kimyası ve Ruh İkizi bağı
    for (const a of characters) {
      const all = a.relationships;
      if (!all) continue;
      for (const key in all) {
        const id = Number(key);
        if (id <= a.id) continue; // her çift bir kez (Yönetim kaydı da atlanır)
        const b = this.world.getCharacter(id);
        if (!b || !present.has(b) || !this.state.characters.includes(b)) continue; // (30.6) vefat eden / ayrılan sakin dünya tablosunda bir an daha kalabilir: ona ruh ikizi bağı kurulmaz
        const chemistry = refreshChemistry(state, a, b);
        if (chemistry >= KINDRED_MIN_CHEMISTRY) {
          if (!hasTag(a, b.id, 'kindred') && getFriendship(state, a, b) >= EMOTION_RULES.kindredScore && this.kindredCount(a) < EMOTION_RULES.kindredLimit && this.kindredCount(b) < EMOTION_RULES.kindredLimit) this.becomeKindred(a, b);
        } else if (hasTag(a, b.id, 'kindred')) {
          removeTag(a, b.id, 'kindred');
          removeTag(b, a.id, 'kindred');
        }
      }
    }

    if (this.encounterCooldowns.size > 400) for (const [k, t] of this.encounterCooldowns) if (t <= now) this.encounterCooldowns.delete(k);
    const day = state.time.day;
    if (this.treatDays.size > 200) for (const [k, d] of this.treatDays) if (d !== day) this.treatDays.delete(k);
  }

  /** A, atölyede yanında çalıştığı Başustaya ve sohbet ettiği dostu Kıdemli Bilgeye hayran olur. */
  admire(a, b, workshop = false) {
    const master = workshop && b.isGrandmaster && !a.isGrandmaster;
    const sage = !workshop && b.lifeStage === 'elder' && a.lifeStage !== 'elder' && getFriendship(this.state, a, b) >= EMOTION_RULES.elderAdmireScore;
    if (master || sage) this.tag(a, b.id, 'admiration');
  }

  /** X, Y'nin eşiyle / sevgilisiyle sohbet ediyor ve aralarında güçlü kimya var: Y'nin eşi X'i kıskanır. */
  attention(x, y) {
    if (y.partnerId === null || y.partnerId === x.id || x.isChild || x.partnerId !== null) return;
    if (isFamily(x, y) || closeKin(x, y)) return;
    const z = this.world.getCharacter(y.partnerId);
    if (!z || isFamily(z, x)) return;
    if (this.get(x, y) < EMOTION_RULES.rivalAttention) return;
    this.tag(z, x.id, 'jealous');
  }

  /** Sakinin ruh ikizi sayısı. */
  kindredCount(c) {
    let n = 0;
    for (const id in c.relationships) if (c.relationships[id].tags.includes('kindred')) n++;
    return n;
  }

  becomeKindred(a, b) {
    const now = this.state.totalMinutes;
    addTag(a, b.id, 'kindred', now);
    addTag(b, a.id, 'kindred', now);
    this.state.stats.kindredBonds = (this.state.stats.kindredBonds ?? 0) + 1;
    addMemory(this.state, a, `${b.name} ile ruh ikizi olduklarını anladı`, 'love', { kind: 'life', fond: true });
    addMemory(this.state, b, `${a.name} ile ruh ikizi olduklarını anladı`, 'love', { kind: 'life', fond: true });
    this.events.emit('chemistry:kindred', { a, b });
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Her adım: ikram ve yolda karşılaşma

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    this.treats();
    this.encounters();
  }

  /** Minnettar sakin, aynı sohbette oturduğu kişiye günde bir kez ikramda bulunur. */
  treats() {
    const day = this.state.time.day;
    for (const group of this.relationships.groups) {
      if (group.kind !== 'chat' || group.members.length < 2) continue;
      for (const giver of group.members) {
        const all = giver.relationships;
        if (!all || giver.isChild) continue;
        for (const taker of group.members) {
          if (taker === giver || !all[taker.id] || !all[taker.id].tags.includes('grateful')) continue;
          const key = `${giver.id}>${taker.id}`;
          if (this.treatDays.get(key) === day) continue;
          this.treatDays.set(key, day);
          this.treat(giver, taker);
        }
      }
    }
  }

  treat(giver, taker) {
    taker.needs.fun = clamp(taker.needs.fun + EMOTION_RULES.treatFun, 0, 100);
    taker.needs.hunger = clamp(taker.needs.hunger + EMOTION_RULES.treatHunger, 0, 100);
    giver.needs.fun = clamp(giver.needs.fun + EMOTION_RULES.treatGiverFun, 0, 100);
    if (giver.visible) {
      giver.showBubble('heart', 2.2);
      this.say(giver, this.line(TREAT_LINES, giver, taker));
    }
    this.state.stats.treats = (this.state.stats.treats ?? 0) + 1;
    this.events.emit('chemistry:treat', { from: giver, to: taker });
  }

  /** Yolda karşılaşan iki sakin: güçlü kimyada şimşek, etiket varsa etikete göre selam. */
  encounters() {
    const now = this.state.totalMinutes;
    const r2 = EMOTION_RULES.encounterRadius * EMOTION_RULES.encounterRadius;
    const walkers = this.walkers ?? (this.walkers = []);
    walkers.length = 0;
    for (const c of this.world.characters) {
      if (c.visible && !c.away && !c.role && c.task?.phase === 'travel') walkers.push(c);
    }
    for (let i = 0; i < walkers.length; i++) {
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i];
        const b = walkers[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy > r2) continue;
        const key = pairKey(a.id, b.id);
        if ((this.encounterCooldowns.get(key) ?? -1) > now) continue;
        this.encounterCooldowns.set(key, now + EMOTION_RULES.encounterCooldown);
        this.meet(a, b);
      }
    }
  }

  meet(a, b) {
    const chemistry = this.peek(a, b);
    const spark = chemistry >= KINDRED_MIN_CHEMISTRY && !a.isChild && !b.isChild && !isFamily(a, b);
    const tagA = this.greetingTag(a, b);
    const tagB = this.greetingTag(b, a);
    if (!spark && !tagA && !tagB) return false;
    if (spark) {
      a.showBubble('spark', EMOTION_RULES.sparkSeconds);
      b.showBubble('spark', EMOTION_RULES.sparkSeconds);
      this.state.stats.sparks = (this.state.stats.sparks ?? 0) + 1;
      this.events.emit('chemistry:spark', { a, b, chemistry });
    }
    if (tagA) this.greet(a, b, tagA, spark);
    if (tagB) this.greet(b, a, tagB, spark);
    if (spark && !tagA && !tagB) this.say(a.id < b.id ? a : b, this.line(SPARK_GREETINGS, a, b));
    return true;
  }

  greetingTag(c, other) {
    const tags = tagsOf(c, other.id);
    if (tags.length === 0) return null;
    return GREETING_ORDER.find((t) => tags.includes(t)) ?? null;
  }

  greet(c, other, tag, spark) {
    this.say(c, this.line(TAG_GREETINGS[tag], c, other));
    if (!spark) c.showBubble(TAG_BUBBLES[tag], 2.2);
    this.state.stats.tagGreetings = (this.state.stats.tagGreetings ?? 0) + 1;
  }

  /** Rastgelelik tüketmeden söz seçer: kimliklerden ve oyun saatinden. */
  line(lines, c, other) {
    const index = (c.id * 31 + other.id * 17 + Math.floor(this.state.totalMinutes / 60)) % lines.length;
    return lines[index].replace('{name}', other.name);
  }

  say(c, text) {
    if (c.speech) return; // süren bir sözün (usta / çırak, mizaç) üstüne yazmaz
    c.speech = { text, at: -1, duration: EMOTION_RULES.speechSeconds };
  }
}
