// (29.2) Moodlet Motoru: sakinin yaptığı her günlük eylem, o anki ihtiyaç / çevre durumu ve kişiliği çarpışınca ruh hali
// doğar; ölümler ve krizler yas ve travma bırakır, dostlar teselli eder. Saf hesaplar src/systems/Moodlets.js'te, sayılar
// ve sözler src/data/moodlets.js'te.
//
//   Katman A (eylem x kişilik) : iş bitince (work:shiftEnded / work:jobDone / work:finished), uyanınca (character:woke),
//                                 yiyip içince (task:finished, citizen:sherbet, citizen:ate, feast:served), sohbette
//                                 (saat başı sohbet grupları, relationship:quarrel), boş zaman bitince (task:finished)
//   Katman B (ihtiyaç / çevre) : saat başı tarama (enerji, tokluk, sosyallik, yağmur / soğuk, çevre estetiği)
//   Katman C (travma / zafer)  : population:dying (yas), yangın / yaralanma / kaza (sarsıntı), karşılıksız aşk ve rakiplik
//                                 (kalp kırıklığı), dilekçe reddi (ihmal), düğün / doğum / Başusta (coşku), eser / randevu /
//                                 ozan (ilham), teselli (console)
//   Etkiler                    : c.mood (toplam çarpanlar ve bayraklar) Moodlets.recomputeMood ile güncellenir; MovementSystem,
//                                 NeedsSystem, BehaviorSystem, ConflictSystem, CraftsmanshipSystem, LandscapeSystem ve Brain okur.
//   Teselli                    : Brain.planConsole dostu acılı sakinin yanına yollar ('console' etkinliği); yan yana CONSOLE.minutes
//                                 dakika geçince (ya da aynı sohbette denk gelince) travmanın kalan süresi %40 kısalır, "Yüreği
//                                 Ferahladı" eklenir, ilişki +12 artar, teselli edilen teselli edene Minnettar olur (29.1).
//
// DETERMİNİZM: moodlet'lerin oluşması tamamen olaylara ve duruma bağlıdır. Sistemin kendi izole üreteci (tohum + 38) yalnızca
// söz seçimi ve söz olasılığı için kullanılır; ana üreteç, öteki sistemlerin üreteçleri ve Math.random hiç tüketilmez.
//
// Olaylar: 'moodlet:added' { character, moodlet }, 'moodlet:mourning' { character, whoName }, 'moodlet:consoled' { by, character, trauma }
import { ACTIVITIES } from '../data/activities.js';
import { MOODLETS, MOOD_RULES, MOOD_LINES, TRAIT_LINES, CONSOLE, CONSOLE_LINES } from '../data/moodlets.js';
import { addMoodlet, removeMoodlet, expireMoodlets, hasMoodlet, traumaOf, soothe, recomputeMood, emptyMoodletStats } from './Moodlets.js';
import { getFriendship, isFamily, arePartners } from './RelationshipSystem.js';
import { chemistryFor, hasTag, addTag, refreshChemistry } from './Chemistry.js';
import { skillLevel, skillForActivity } from './SkillSystem.js';
import { isGrandmaster, grandmasterAt } from './Grandmaster.js';
import { isShivering, isFreezing } from './HeatingSystem.js';
import { coldProtection } from './Equipment.js';
import { isRainActive } from '../data/weather.js';
import { getSeason } from '../data/seasons.js';
import { foodSupply } from './TownStatus.js';
import { addMemory } from './MemorySystem.js';
import { genitive } from '../utils/turkish.js';
import { lifeSeedOf } from '../utils/lifeSeed.js';

const peekChemistry = (state, a, b) => a.relationships?.[b.id]?.chemistry ?? chemistryFor(lifeSeedOf(state), a, b);

/** B, acılı A'yı teselli edebilecek kadar yakın mı: eşi / sevgilisi, ailesi, ruh ikizi ya da kimyası eksi olmayan dostu. */
export function canConsole(state, consoler, sufferer) {
  if (!consoler || !sufferer || consoler === sufferer || consoler.role || consoler.isChild || consoler.away || consoler.emigrating) return false;
  if (traumaOf(consoler)) return false; // kendi acısı olan başkasını teselli edemez
  if (arePartners(consoler, sufferer) || isFamily(consoler, sufferer) || hasTag(consoler, sufferer.id, 'kindred')) return true;
  return getFriendship(state, consoler, sufferer) >= CONSOLE.minScore && peekChemistry(state, consoler, sufferer) >= CONSOLE.minChemistry;
}

/** Teselli edenin yakınlık sırası (küçük = önce): eş, aile, ruh ikizi, dost. */
function closeness(state, consoler, sufferer) {
  if (arePartners(consoler, sufferer)) return 0;
  if (isFamily(consoler, sufferer)) return 1;
  if (hasTag(consoler, sufferer.id, 'kindred')) return 2;
  return 3 + (100 - getFriendship(state, consoler, sufferer)) / 200;
}

/**
 * Bu sakinin teselli etmeye gideceği acılı sakin (yoksa null): uyanık, kasabada, henüz teselli edilmemiş, başka bir teselli
 * eden yolda değil ve bu sakin ona EN YAKIN uygun kişi (eş > aile > ruh ikizi > dost; eşitlikte küçük kimlik).
 */
export function findSufferer(state, characters, c) {
  let pick = null;
  for (const s of characters) {
    if (s === c || s.role || s.away || s.emigrating || !s.visible || s.isSleeping || !traumaOf(s)) continue;
    if (!canConsole(state, c, s)) continue;
    let taken = false;
    let better = false;
    const mine = closeness(state, c, s);
    for (const o of characters) {
      if (o === c || o === s) continue;
      if (o.task?.activity === 'console' && o.task.consoleId === s.id) taken = true;
      else if (canConsole(state, o, s) && !o.isSleeping && o.visible) {
        const theirs = closeness(state, o, s);
        if (theirs < mine || (theirs === mine && o.id < c.id)) better = true;
      }
    }
    if (taken || better) continue;
    if (!pick || s.id < pick.id) pick = s;
  }
  return pick;
}

export class MoodletSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng izole üreteç (tohum + 38): yalnızca sözler
   * @param {{ relationships: import('./RelationshipSystem.js').RelationshipSystem }} services
   */
  constructor(game, world, rng, { relationships }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.relationships = relationships;
    this.state.moodlets ??= emptyMoodletStats();
    for (const c of this.state.characters) recomputeMood(c);
    const on = (name, fn) => game.events.on(name, fn);
    this.unsubscribers = [
      on('time:hour', () => this.onHour()),
      on('work:shiftEnded', ({ character, activity, building } = {}) => this.onWork(character, activity, building)),
      on('work:jobDone', ({ character, job } = {}) => this.onWork(character, job?.type, null)),
      on('work:finished', ({ character, building } = {}) => this.onProduction(character, building)),
      on('character:woke', ({ character } = {}) => this.onWoke(character)),
      on('task:finished', ({ character, task } = {}) => this.onTaskFinished(character, task)),
      on('citizen:sherbet', ({ character } = {}) => this.feast(character, 'feast_sherbet')),
      on('feast:served', ({ character } = {}) => this.feast(character, 'feast_table')),
      on('citizen:ate', ({ character } = {}) => this.ration(character)),
      on('relationship:quarrel', ({ a, b } = {}) => this.onQuarrel(a, b)),
      on('relationship:levelDown', ({ a, b, level } = {}) => this.onLevelDown(a, b, level)),
      on('population:dying', ({ character } = {}) => this.onDying(character)),
      on('crisis:burnedDown', ({ building } = {}) => this.onFire(building, 'shaken_burned', 'major')),
      on('crisis:injured', ({ character } = {}) => this.apply(character, 'shaken', { reason: 'shaken_injured', tier: 'major' })),
      on('life:fatalAccident', ({ character } = {}) => this.onAccident(character)),
      on('chemistry:unrequited', ({ from, target } = {}) => this.apply(from, 'heartbroken', { reason: 'heart_unrequited', tier: 'major', whoId: target?.id, whoName: target?.name })),
      on('petition:resolved', ({ outcome, character } = {}) => this.onPetition(character, outcome)),
      on('relationship:married', ({ a, b } = {}) => this.onMarried(a, b)),
      on('family:childBorn', ({ child, parents } = {}) => { for (const p of parents ?? []) this.apply(p, 'euphoric', { reason: 'euphoric_child', tier: 'major', whoId: child?.id, whoName: child?.name }); }),
      on('apprentice:grandmaster', ({ character } = {}) => this.apply(character, 'euphoric', { reason: 'euphoric_master', tier: 'major' })),
      on('masterwork:created', ({ character } = {}) => this.apply(character, 'inspired', { reason: 'inspired_work', tier: 'major' })),
      on('social:date', ({ a, b } = {}) => this.onDate(a, b)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get stats() {
    return (this.state.moodlets ??= emptyMoodletStats());
  }

  /**
   * Sakine moodlet verir. Yeni eklendiyse sayaç artar, olay yayınlanır, görünürse başında ikon ve (izole üreteçle) söz çıkar.
   * Dönüş: yeni eklendiyse kayıt, tazelendiyse / eklenemediyse null.
   */
  apply(c, key, opts = {}) {
    if (!c || c.role || !this.state.characters.includes(c)) return null;
    const had = hasMoodlet(c, key);
    const m = addMoodlet(c, key, this.state.totalMinutes, opts);
    if (!m || had) return null;
    const stats = this.stats;
    stats.given[key] = (stats.given[key] ?? 0) + 1;
    this.express(c, m);
    this.events.emit('moodlet:added', { character: c, moodlet: m });
    return m;
  }

  /** Harita üstü ifade: ikon balonu ve kişiliğe özgü kısa söz (süren sözün üstüne yazmaz). */
  express(c, m) {
    if (!c.visible || c.away) return;
    const def = MOODLETS[m.key];
    c.showBubble(def.icon, MOOD_RULES.bubbleSeconds);
    if (c.speech) return;
    if (this.rng.next() >= MOOD_RULES.speechChance) return;
    const own = TRAIT_LINES[m.key];
    let text = null;
    if (own) {
      for (const t of c.traits) if (own[t]) text = text ?? own[t];
      if (!text && own[c.quirk]) text = own[c.quirk];
    }
    // Kişiliğe özgü söz varsa yarı yarıya o, yoksa genel sözlerden biri
    const lines = MOOD_LINES[m.key];
    if (!text || this.rng.next() < 0.5) text = lines[Math.floor(this.rng.next() * lines.length)];
    c.speech = { text: text.replace('{who}', m.whoName ?? ''), at: -1, duration: MOOD_RULES.speechSeconds };
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Katman A: eylem x kişilik

  /** İş bitti (mesai ya da iş emri): gurur ya da angarya. */
  onWork(c, activity, building) {
    if (!c || c.isChild || !activity || activity === 'apprentice') return;
    const heavy = MOOD_RULES.heavyWork.includes(activity);
    const traits = c.traits;
    // Angarya: ağır işte Uykucu / yorgun, ya da doğasına ters iş
    let drudge = null;
    if (heavy && c.needs.energy < MOOD_RULES.drudgeryEnergy) drudge = 'drudgery_tired';
    else if (heavy && traits.includes('sleepyhead')) drudge = 'drudgery_sleepy';
    else for (const t of traits) if (MOOD_RULES.misfit[t]?.includes(activity)) drudge = 'drudgery_misfit';
    if (drudge) {
      removeMoodlet(c, 'proud_work');
      this.apply(c, 'drudgery', { reason: drudge, tier: drudge === 'drudgery_tired' && traits.includes('sleepyhead') ? 'major' : 'minor' });
      return;
    }
    // Gurur: Çalışkan / Hırslı / Zanaatkâr Ruhu ya da sevdiği (tercih ettiği / usta olduğu) meslek
    const skill = skillForActivity(activity);
    let proud = null;
    if (traits.includes('hardworking')) proud = 'proud_trait';
    else if (traits.includes('ambitious')) proud = 'proud_ambitious';
    else if (c.quirk === MOOD_RULES.proudQuirk) proud = 'proud_craft';
    else if (skill && ((c.profile.skillPreference[skill] ?? 0) > 0 || skillLevel(c, skill).level >= 3)) proud = 'proud_loved';
    if (proud) {
      removeMoodlet(c, 'drudgery');
      this.apply(c, 'proud_work', { reason: proud });
    }
  }

  /**
   * Üretim yapısında mesai bitti: Usta (Sv.3+) ya da Başusta, kendi uzmanlık mesleğinin yapısında dinç (enerji > %50) ve keyifli
   * (keyif > %50) art arda 2 üretim tamamlarsa Ustalık Akışı'na girer. (29.2b) Oyuncunun sakini sabitlemesi gerekmez: otopilot da akışa girer.
   */
  onProduction(c, building) {
    if (!c || !building) return;
    const skill = skillForActivity(building.definition?.workActivity);
    const grand = grandmasterAt(c, building);
    const master = grand || Boolean(skill && skillLevel(c, skill).level >= 3);
    if (!master || c.needs.energy <= MOOD_RULES.flowEnergy || c.needs.fun <= MOOD_RULES.flowFun) {
      c.flowStreak = 0;
      return;
    }
    c.flowStreak = (c.flowStreak ?? 0) + 1;
    if (c.flowStreak >= MOOD_RULES.flowStreak) this.apply(c, 'flow_state', { reason: 'flow', tier: grand ? 'major' : 'minor' });
  }

  /** Sabah uyanışı: deliksiz uyku ya da üşüyerek uyanma. */
  onWoke(c) {
    if (!c || c.role) return;
    const state = this.state;
    const home = c.homeId !== null ? this.world.getBuilding(c.homeId) : null;
    const winter = getSeason(state.time.day).cold;
    if (!home && !c.isVenerable) return void this.apply(c, 'cold_wake', { reason: 'cold_homeless', tier: 'major' });
    if (isFreezing(state)) return void this.apply(c, 'cold_wake', { reason: 'cold_room', tier: 'major' });
    if (c.needs.energy < MOOD_RULES.coldWakeEnergy) return void this.apply(c, 'cold_wake', { reason: 'cold_tired' });
    if (c.needs.energy <= MOOD_RULES.restedEnergy || c.needs.hunger < MOOD_RULES.restedHunger || !home) return;
    const stone = (home.stat?.('sleepFunPerMinute', 0) ?? 0) > 0;
    const happy = (c.buffs.happyHome ?? -1) > state.totalMinutes;
    const reason = stone ? 'rested_stone' : winter ? 'rested_warm' : happy ? 'rested_home' : null;
    if (!reason) return;
    removeMoodlet(c, 'cold_wake');
    this.apply(c, 'well_rested', { reason, tier: c.traits.includes('sleepyhead') ? 'major' : 'minor' });
  }

  /** Bir etkinlik bitti: sıcak yemek, kuru tayın, tenha huzur, çardakta / handa hoş vakit, yas tutma sayacı. */
  onTaskFinished(c, task) {
    if (!c || !task || c.role) return;
    const activity = task.activity;
    if (activity === 'innMeal') return void this.feast(c, 'feast_inn');
    if (activity === 'meal' || activity === 'eat') return void (task.bread ? null : this.ration(c));
    if (task.grieve) this.stats.grieved += 1;
    if (MOOD_RULES.warmVenues.includes(activity) && !c.mood.grief) {
      const strong = c.traits.some((t) => MOOD_RULES.chatStrong.traits.includes(t)) || MOOD_RULES.chatStrong.quirks.includes(c.quirk);
      return void this.apply(c, 'warm_chat', { reason: 'chat_venue', tier: strong ? 'major' : 'minor' });
    }
    if (!MOOD_RULES.quietActivities.includes(activity) || task.grieve) return;
    const reader = activity === 'readLibrary' || activity === 'readBench';
    const calm = c.traits.some((t) => MOOD_RULES.quietTraits.includes(t)) || MOOD_RULES.quietQuirks.includes(c.quirk);
    if (!calm || (activity === 'stroll' && !c.traits.includes('natureLover'))) return;
    if (!reader && this.crowdAround(c) > MOOD_RULES.quietCrowd) return;
    this.apply(c, 'quiet_peace', { reason: reader ? 'quiet_read' : 'quiet' });
  }

  crowdAround(c) {
    const r2 = MOOD_RULES.quietRadius * MOOD_RULES.quietRadius;
    let n = 0;
    for (const o of this.world.characters) {
      if (o !== c && o.visible && (o.x - c.x) ** 2 + (o.y - c.y) ** 2 <= r2) n++;
    }
    return n;
  }

  /** Damak Şöleni: sıcak yemek, soğuk şerbet ya da ziyafet ikramı (Obur ve Neşeli'de güçlü). */
  feast(c, reason) {
    if (!c) return;
    removeMoodlet(c, 'raw_ration');
    const strong = c.traits?.some((t) => MOOD_RULES.feastStrongTraits.includes(t));
    this.apply(c, 'feast_bliss', { reason, tier: strong ? 'major' : 'minor' });
  }

  /** Kuru Tayın: kışın ya da kıtlıkta ekmeksiz / çeşitsiz soğuk erzak. */
  ration(c) {
    if (!c || hasMoodlet(c, 'feast_bliss')) return;
    const state = this.state;
    const winter = getSeason(state.time.day).cold;
    const scarce = foodSupply(state) < Math.max(1, state.characters.length) * MOOD_RULES.rationFoodPerHead;
    if (!winter && !scarce) return;
    this.apply(c, 'raw_ration', { reason: scarce ? 'ration_scarce' : 'ration_winter' });
  }

  onQuarrel(a, b) {
    if (!a || !b) return;
    for (const [c, o] of [[a, b], [b, a]]) {
      removeMoodlet(c, 'warm_chat');
      this.apply(c, 'sour_encounter', { reason: 'sour_quarrel', tier: c.traits.some((t) => MOOD_RULES.sourStrongTraits.includes(t)) ? 'major' : 'minor', whoId: o.id, whoName: o.name });
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Katman C: travmalar ve zaferler

  /** Vefat (referanslar temizlenmeden ÖNCE): eşi, ebeveynleri, evlatları, ruh ikizi, ustası ve çırakları yasa girer. */
  onDying(dead) {
    if (!dead) return;
    const state = this.state;
    for (const c of state.characters) {
      if (c === dead || c.role) continue;
      let reason = null;
      if (c.partnerId === dead.id || dead.partnerId === c.id) reason = 'mourn_spouse';
      else if (c.parentIds.includes(dead.id) || (c.parents ?? []).includes(dead.id)) reason = 'mourn_parent';
      else if (dead.parentIds.includes(c.id) || (dead.parents ?? []).includes(c.id)) reason = 'mourn_child';
      else if (hasTag(c, dead.id, 'kindred')) reason = 'mourn_kindred';
      else if (c.apprenticeship?.masterId === dead.id || (dead.mentees ?? []).some((m) => m.id === c.id)) reason = 'mourn_master';
      else if (dead.apprenticeship?.masterId === c.id || (c.mentees ?? []).some((m) => m.id === dead.id)) reason = 'mourn_pupil';
      if (!reason) continue;
      const m = this.apply(c, 'mourning', { reason, tier: 'major', whoId: dead.id, whoName: dead.name });
      if (!m) continue;
      this.stats.mourners += 1;
      addMemory(state, c, `${genitive(dead.name)} yasını tuttu`, 'candle', { kind: 'life', fond: false });
      this.events.emit('moodlet:mourning', { character: c, whoName: dead.name });
    }
  }

  /**
   * Yangında bina kül oldu: yapının içindekiler, sakinleri ve çalışanları sarsılır. (29.2b) Yangını söndürmek kahramanlıktır,
   * sarsılma yalnızca kaybedilen yapıda (ve yaralanmada / kazada tanıklıkta) verilir.
   */
  onFire(building, reason, tier) {
    if (!building) return;
    for (const c of this.world.characters) {
      if (c.role || c.isChild) continue;
      const involved = c.homeId === building.id || c.insideBuildingId === building.id || building.workerIds?.has(c.id);
      if (involved) this.apply(c, 'shaken', { reason, tier });
    }
  }

  /** Ölümlü kaza: yakınında olanlar (ve aynı sefere çıkanlar) sarsılır. */
  onAccident(victim) {
    if (!victim) return;
    const r2 = MOOD_RULES.shakenRadius * MOOD_RULES.shakenRadius;
    for (const c of this.world.characters) {
      if (c === victim || c.role) continue;
      const near = c.visible && victim.visible && (c.x - victim.x) ** 2 + (c.y - victim.y) ** 2 <= r2;
      const fellow = Boolean(c.away && victim.away);
      if (near || fellow) this.apply(c, 'shaken', { reason: 'shaken_witness', tier: 'major', whoId: victim.id, whoName: victim.name });
    }
  }

  onLevelDown(a, b, level) {
    if (!a || !b || level?.key !== MOOD_RULES.rivalLevel) return;
    for (const [c, o] of [[a, b], [b, a]]) this.apply(c, 'heartbroken', { reason: 'heart_rival', whoId: o.id, whoName: o.name });
  }

  onPetition(c, outcome) {
    if (!c || (outcome !== 'rejected' && outcome !== 'expired')) return;
    const harsh = (this.state.trust?.value ?? 100) < MOOD_RULES.neglectTrust;
    this.apply(c, 'neglected', { reason: outcome === 'rejected' ? 'neglect_rejected' : 'neglect_expired', tier: outcome === 'rejected' ? 'major' : 'minor', harsh });
  }

  onMarried(a, b) {
    if (!a || !b) return;
    this.apply(a, 'euphoric', { reason: 'euphoric_wed', tier: 'major', whoId: b.id, whoName: b.name });
    this.apply(b, 'euphoric', { reason: 'euphoric_wed', tier: 'major', whoId: a.id, whoName: a.name });
  }

  onDate(a, b) {
    if (!a || !b || peekChemistry(this.state, a, b) < MOOD_RULES.inspiringChemistry) return;
    this.apply(a, 'inspired', { reason: 'inspired_date', whoId: b.id, whoName: b.name });
    this.apply(b, 'inspired', { reason: 'inspired_date', whoId: a.id, whoName: a.name });
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Saat başı: süre, ihtiyaç ve çevre taraması, sohbetler, ozan

  onHour() {
    const state = this.state;
    const now = state.totalMinutes;
    const raining = isRainActive(state.weather);
    const field = this.world.aesthetics;
    const map = this.world.map;
    for (const c of this.world.characters) {
      if (c.role) continue;
      expireMoodlets(c, now);
      if (c.away) continue;
      this.scanNeeds(c);
      if (!c.visible || c.isSleeping) continue;
      // Hava: yağmur / kış soğuğu
      const cold = isShivering(c, state);
      if (raining || cold) {
        if (c.profile.rainLover && raining) this.apply(c, 'nature_bliss', { reason: 'nature_rain' });
        else if (cold && coldProtection(c) <= 0) this.apply(c, 'chilled', { reason: 'chilled' });
        else if (raining && !c.profile.rainLover) this.apply(c, 'drenched', { reason: 'drenched' });
      } else if (c.traits.includes('natureLover') && c.task?.phase === 'perform' && MOOD_RULES.outdoorWork.includes(c.task.activity)) {
        this.apply(c, 'nature_bliss', { reason: 'nature_work' });
      }
      // Çevre estetiği: güzel bir sokakta durup vakit geçiren (yürüyüp geçen değil)
      if (field && c.task?.phase === 'perform' && !c.mood.grief) {
        const kind = ACTIVITIES[c.task.activity]?.kind;
        if ((kind === 'leisure' || kind === 'social') && map.inBounds(c.tileX, c.tileY) && field[map.index(c.tileX, c.tileY)] >= MOOD_RULES.aestheticAt) this.apply(c, 'aesthetic_joy', { reason: 'aesthetic' });
      }
    }
    this.scanChats();
    this.scanBard();
  }

  /** İhtiyaç eşikleri: eşiğin altında moodlet başlar, eşiğin `recover` üstüne çıkınca silinir. */
  scanNeeds(c) {
    const n = c.needs;
    const R = MOOD_RULES;
    this.threshold(c, 'exhausted', n.energy, R.exhausted, 'exhausted', !c.isSleeping);
    this.threshold(c, 'hangry', n.hunger, R.hangry, 'hangry', true);
    this.threshold(c, 'lonely_ache', n.social, c.traits.includes('socialButterfly') ? R.lonelySocial : R.lonely, 'lonely', !c.isChild);
  }

  threshold(c, key, value, limit, reason, allowed) {
    if (hasMoodlet(c, key)) {
      if (value >= limit + MOOD_RULES.recover) removeMoodlet(c, key);
    } else if (allowed && value < limit) {
      this.apply(c, key, { reason, tier: value < limit / 2 ? 'major' : 'minor' });
    }
  }

  /** Süren sohbetler: olumlu kimya tatlı sohbet, eksi kimya tatsız karşılaşma; dost acılı sakini sohbette de teselli eder. */
  scanChats() {
    const state = this.state;
    for (const group of this.relationships.groups) {
      if (group.kind !== 'chat') continue;
      const members = group.members;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const a = members[i];
          const b = members[j];
          if (a.role || b.role) continue;
          const chemistry = peekChemistry(state, a, b);
          for (const [c, o] of [[a, b], [b, a]]) {
            if (c.isChild || c.mood.grief) continue;
            if (chemistry >= 1) {
              const strong = chemistry >= 2 || c.traits.some((t) => MOOD_RULES.chatStrong.traits.includes(t)) || MOOD_RULES.chatStrong.quirks.includes(c.quirk);
              this.apply(c, 'warm_chat', { reason: 'chat_friend', tier: strong ? 'major' : 'minor', whoId: o.id, whoName: o.name });
            } else if (chemistry < 0) {
              this.apply(c, 'sour_encounter', { reason: 'sour_chat', tier: c.traits.some((t) => MOOD_RULES.sourStrongTraits.includes(t)) ? 'major' : 'minor', whoId: o.id, whoName: o.name });
            }
          }
          if (traumaOf(a) && canConsole(state, b, a)) this.console(b, a);
          else if (traumaOf(b) && canConsole(state, a, b)) this.console(a, b);
        }
      }
    }
  }

  /** Seyyar Ozan çalarken yakınında uyanık duranlar ilham alır. */
  scanBard() {
    for (const g of this.world.guests ?? []) {
      if (!g.playing) continue;
      const r2 = MOOD_RULES.bardRadius * MOOD_RULES.bardRadius;
      for (const c of this.world.characters) {
        if (c.role || !c.visible || c.isSleeping || c.away) continue;
        if ((c.x - g.x) ** 2 + (c.y - g.y) ** 2 <= r2) this.apply(c, 'inspired', { reason: 'inspired_bard' });
      }
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Teselli

  /** Her adım: teselliye gelen dost, acılı sakinin yanında CONSOLE.minutes dakika durunca teselli gerçekleşir. */
  update(tick) {
    const minutes = tick.gameMinutes;
    if (minutes <= 0) return;
    const r2 = CONSOLE.radius * CONSOLE.radius;
    for (const c of this.world.characters) {
      const task = c.task;
      if (!task || task.activity !== 'console' || task.phase !== 'perform' || task.consoled) continue;
      const s = this.world.getCharacter(task.consoleId);
      if (!s || !traumaOf(s) || (s.x - c.x) ** 2 + (s.y - c.y) ** 2 > r2) {
        task.duration = 0; // acılı sakin gitmiş ya da teselliye gerek kalmamış: görev biter, yeniden düşünür
        continue;
      }
      c.faceToward(s.x, s.y);
      task.near = (task.near ?? 0) + minutes;
      if (task.near >= CONSOLE.minutes) {
        task.consoled = true;
        this.console(c, s);
      }
    }
  }

  /** Teselli gerçekleşir: süre kısalır, Yüreği Ferahladı, ilişki +12, Minnettar etiketi, iki günlüğe anı. */
  console(by, sufferer) {
    const state = this.state;
    if (!state.characters.includes(by) || !state.characters.includes(sufferer)) return null; // (30.6) aynı saatte vefat eden / ayrılan sakine kayıt yazılmaz
    const now = state.totalMinutes;
    const result = soothe(sufferer, now, by);
    if (!result) return null;
    const stats = this.stats;
    stats.consoled += 1;
    stats.given.comforted = (stats.given.comforted ?? 0) + 1;
    this.relationships.add(by, sufferer, CONSOLE.relationship);
    addTag(sufferer, by.id, 'grateful', now);
    refreshChemistry(state, sufferer, by);
    by.lastConsoleAt = now;
    const what = result.trauma.key === 'mourning' ? 'yasında' : result.trauma.key === 'shaken' ? 'korkusunda' : 'kederinde';
    addMemory(state, sufferer, `${by.name} ${what} onu teselli etti`, 'handshake', { kind: 'life', fond: true, whoId: by.id });
    addMemory(state, by, `${sufferer.name} acılıyken yanında oldu, onu teselli etti`, 'handshake', { kind: 'life', fond: true, whoId: sufferer.id });
    if (by.visible) {
      by.showBubble('heart', 2.4);
      if (!by.speech) by.speech = { text: CONSOLE_LINES[Math.floor(this.rng.next() * CONSOLE_LINES.length)], at: -1, duration: MOOD_RULES.speechSeconds };
    }
    const comforted = sufferer.moodlets.find((m) => m.key === 'comforted');
    if (comforted) this.express(sufferer, comforted);
    this.events.emit('moodlet:added', { character: sufferer, moodlet: comforted });
    this.events.emit('moodlet:consoled', { by, character: sufferer, trauma: result.trauma, before: result.before, after: result.after });
    return result;
  }
}
