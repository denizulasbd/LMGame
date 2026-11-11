// (29.3) Arzular, Korkular ve Yaşam Doyumu: her yetişkin sakinin içinde süren en çok 3 arzu ve 2 korku vardır. Arzu gerçekleşince
// yaşam doyumu artar ve "Dileği Oldu" doğar; korku başına gelince doyum düşer ve "Korktuğu Başına Geldi" doğar. Süresi dolan arzu
// küçük bir hayal kırıklığı, gerçekleşmeden geçen korku küçük bir ferahlıktır. Saf hesaplar src/systems/Wants.js'te, sayılar ve sözler
// src/data/wants.js'te.
//
//   Saat başı (time:hour)  : a) süresi dolan arzular (expired, -2) ve korkular (passed, +2); b) uygunluğu biten kayıtlar (void, cezasız);
//                            c) tarama tipi gerçekleşme (Ruh İkiziyle aynı sohbette dertleşmek); d) 06:00'da boş yuvalar dolar
//                            (önce arzular salt 0, sonra korkular salt 1; o günün durumsuz üreteciyle yuva sırasıyla)
//   Gün dönümü             : doyum 50'ye doğru kayar (üstündeyse -2, altındaysa +1)
//   Olaylar                : evlilik, doğum, mezuniyet, yadigâr, eser, beceri, dostluk, barışma, şerbet, akşam yemeği, ziyafet, alışveriş,
//                            sefer dönüşü, dilekçe (arzular); yangın, atışma, hastalık / yaralanma ve moodlet:added (korkular)
//   Vefat / göç            : önce gerçekleşmeler (Derin Yas -> "yokluğu" korkusu), sonra gidene bağlı bütün kayıtlar void
//
// DETERMİNİZM: seçim ana üreteçten değil (tohum, kimlik, gün, salt) karmasından türeyen durumsuz üreteçten yapılır (kaydet-yükle sonrası
// aynı gün aynı seçim). Sistemin kendi izole üreteci (tohum + 39) yalnızca söz seçimi ve söz olasılığı içindir; ana üreteç, öteki
// sistemlerin üreteçleri ve Math.random hiç tüketilmez. Toast / Kasaba Günlüğü yoktur: görünürlük balon, söz ve karakter kartıdır.
//
// Olaylar: 'want:rolled' { character, kind, entry }, 'want:fulfilled' { character, want, points }, 'fear:realized' { character, fear, points },
//          'satisfaction:tierChanged' { character, from, to }
import { WANTS, FEARS, WANT_CAPS, WANT_RULES, WANT_LINES, FEAR_LINES, FEAR_MOODLETS, WANT_MOODLETS } from '../data/wants.js';
import { recomputeMood } from './Moodlets.js';
import {
  wantsEnabled,
  eligibleWants,
  eligibleFears,
  pickWeighted,
  wantRng,
  holds,
  recomputeDrive,
  satisfactionTier,
  clampSatisfaction,
  emptyWantStats,
  tierForPoints,
  wantName,
} from './Wants.js';
import { addMemory } from './MemorySystem.js';

const DAY = 1440;
const isParentOf = (p, kid) => kid.parentIds.includes(p.id) || (kid.parents ?? []).includes(p.id);

export class WantSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng izole üreteç (tohum + 39): yalnızca sözler
   * @param {{ moodlets: import('./MoodletSystem.js').MoodletSystem, relationships: import('./RelationshipSystem.js').RelationshipSystem }} services
   */
  constructor(game, world, rng, { moodlets, relationships }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.moodlets = moodlets;
    this.relationships = relationships;
    this.state.wants ??= emptyWantStats();
    for (const c of this.state.characters) recomputeDrive(c);
    const on = (name, fn) => game.events.on(name, fn);
    const want = (key) => ({ character } = {}) => this.fulfilFirst(character, [key]);
    this.unsubscribers = [
      on('time:hour', (hour) => this.onHour(Number.isFinite(hour) ? hour : this.state.time.hour)),
      on('time:newDay', () => this.onNewDay()),
      // --- arzular ---
      on('apprentice:graduated', ({ character, masterId, grandmaster } = {}) => this.onGraduated(character, masterId, grandmaster)),
      on('heirloom:passed', ({ from } = {}) => this.fulfilFirst(from, ['pass_heirloom'])),
      on('family:childBorn', ({ parents } = {}) => this.onChildBorn(parents ?? [])),
      on('relationship:married', ({ a, b } = {}) => { this.fulfilFirst(a, ['get_married']); this.fulfilFirst(b, ['get_married']); }),
      on('relationship:partnered', ({ a, b } = {}) => { this.fulfilFirst(a, ['find_love']); this.fulfilFirst(b, ['find_love']); }),
      on('masterwork:created', ({ character } = {}) => this.fulfilFirst(character, ['craft_masterwork'])),
      on('skill:levelUp', ({ character } = {}) => this.fulfilFirst(character, ['level_up_skill'])),
      // (uyarlama) seviye yükselişi olayla yayınlanır: Dost seviyesine ilk kez çıkan ilişki "yeni bir dost" sayılır
      on('relationship:levelUp', ({ a, b, level, previous } = {}) => this.onLevelUp(a, b, level, previous)),
      on('relationship:reconciled', ({ a, b } = {}) => { this.fulfilWith(a, 'reconcile', b); this.fulfilWith(b, 'reconcile', a); }),
      on('citizen:sherbet', ({ character, building } = {}) => this.onSherbet(character, building)),
      on('social:familyDinner', ({ a, b } = {}) => { this.fulfilFirst(a, ['family_dinner']); this.fulfilFirst(b, ['family_dinner']); }),
      on('feast:served', want('feast_meal')),
      on('citizen:bought', ({ character, kind } = {}) => this.fulfilFirst(character, kind === 'pie' ? ['feast_meal', 'treat_self'] : ['treat_self'])),
      on('expedition:memberReturned', want('go_expedition')),
      on('petition:resolved', ({ character, outcome } = {}) => this.onPetition(character, outcome)),
      // --- korkular ---
      on('crisis:fireStarted', ({ building } = {}) => this.onFire(building, false)),
      on('crisis:burnedDown', ({ building } = {}) => this.onFire(building, true)),
      on('relationship:quarrel', ({ a, b } = {}) => { this.realizeWith(a, 'quarrel_foe', b); this.realizeWith(b, 'quarrel_foe', a); }),
      on('health:fellIll', ({ character } = {}) => this.realizeFirst(character, 'fall_ill')),
      on('crisis:injured', ({ character } = {}) => this.realizeFirst(character, 'fall_ill')),
      on('moodlet:added', ({ character, moodlet } = {}) => this.onMoodlet(character, moodlet)),
      // --- vefat / göç: önce gerçekleşmeler (yukarıdaki moodlet:added yas için çoktan çalıştı), sonra gidene bağlı kayıtlar void ---
      on('population:dying', ({ character } = {}) => character && this.voidRefs([character.id])),
      on('population:left', ({ character } = {}) => character && this.voidRefs([character.id])),
      on('exodus:leaving', ({ ids } = {}) => this.voidRefs(ids ?? [])),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get stats() {
    return (this.state.wants ??= emptyWantStats());
  }

  count(group, key) {
    const g = this.stats[group];
    g[key] = (g[key] ?? 0) + 1;
  }

  /** Olayın sakini: kasabada yaşayan, arzu taşıyabilen bir yetişkin mi. */
  eligible(c) {
    return wantsEnabled(c) && this.state.characters.includes(c);
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Saat başı ve gün dönümü

  onHour(hour) {
    const state = this.state;
    const now = state.totalMinutes;
    for (const c of state.characters) {
      if (!wantsEnabled(c)) continue;
      this.sweep(c, now);
      this.scanKindred(c);
      if (hour === WANT_RULES.rollHour && !c.away && !c.emigrating) this.roll(c);
    }
  }

  /** a) süre dolumu, b) uygunluk. */
  sweep(c, now) {
    let changed = false;
    for (let i = c.wants.length - 1; i >= 0; i--) {
      const w = c.wants[i];
      if (w.until !== null && w.until <= now) {
        c.wants.splice(i, 1);
        this.log(c, w, 'want', 'expired');
        this.count('expired', w.key);
        this.adjust(c, -WANT_RULES.expirePenalty);
        changed = true;
      } else if (!holds(this.state, c, 'want', w)) {
        c.wants.splice(i, 1);
        this.log(c, w, 'want', 'void');
        changed = true;
      }
    }
    for (let i = c.fears.length - 1; i >= 0; i--) {
      const f = c.fears[i];
      if (f.until !== null && f.until <= now) {
        c.fears.splice(i, 1);
        this.log(c, f, 'fear', 'passed');
        this.count('passed', f.key);
        this.adjust(c, WANT_RULES.passReward);
        changed = true;
      } else if (!holds(this.state, c, 'fear', f)) {
        c.fears.splice(i, 1);
        this.log(c, f, 'fear', 'void');
        changed = true;
      }
    }
    if (changed) recomputeDrive(c);
  }

  /** c) Ruh İkiziyle aynı sohbet grubunda: dertleşti. */
  scanKindred(c) {
    const w = c.wants.find((x) => x.key === 'chat_kindred');
    if (!w) return;
    for (const group of this.relationships?.groups ?? []) {
      if (group.kind !== 'chat' || !group.members.includes(c)) continue;
      if (group.members.some((o) => o.id === w.whoId)) return void this.fulfil(c, w);
    }
  }

  /** d) Boş yuvaları o günün durumsuz üreteciyle doldurur (liste boşsa zar çekilmez). */
  roll(c) {
    const state = this.state;
    const now = state.totalMinutes;
    const day = state.time.day;
    let added = false;
    for (const [kind, list, cap, salt, eligibleFn] of [
      ['want', c.wants, WANT_CAPS.wants, 0, eligibleWants],
      ['fear', c.fears, WANT_CAPS.fears, 1, eligibleFears],
    ]) {
      if (list.length >= cap) continue;
      const rng = wantRng(state.seed, c.id, day, salt);
      while (list.length < cap) {
        const pick = pickWeighted(eligibleFn(state, this.world, c), rng);
        if (!pick) break;
        const days = (kind === 'want' ? WANTS : FEARS)[pick.key].days;
        const entry = { key: pick.key, since: now, until: days === null ? null : now + days * DAY };
        if (pick.whoId !== null) {
          entry.whoId = pick.whoId;
          entry.whoName = pick.whoName;
        }
        list.push(entry);
        this.count(kind === 'want' ? 'rolled' : 'fearsRolled', pick.key);
        added = true;
        this.events.emit('want:rolled', { character: c, kind, entry });
      }
    }
    if (added) recomputeDrive(c);
  }

  onNewDay() {
    for (const c of this.state.characters) {
      if (!wantsEnabled(c)) continue;
      const v = c.satisfaction;
      if (v > WANT_RULES.driftCenter) this.adjust(c, -Math.min(WANT_RULES.driftAbove, v - WANT_RULES.driftCenter));
      else if (v < WANT_RULES.driftCenter) this.adjust(c, Math.min(WANT_RULES.driftBelow, WANT_RULES.driftCenter - v));
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Doyum, kayıt, ifade

  /** Doyumu değiştirir (0..100); kademe değişirse olay. recomputeMood her değişimde çağrılır. */
  adjust(c, delta) {
    const before = c.satisfaction;
    const after = clampSatisfaction(before + delta);
    if (after === before) return;
    const from = satisfactionTier(before);
    c.satisfaction = after;
    recomputeMood(c);
    const to = satisfactionTier(after);
    if (to !== from) this.events.emit('satisfaction:tierChanged', { character: c, from: from.key, to: to.key });
  }

  log(c, entry, kind, outcome, extra = null) {
    const e = { key: entry.key, kind, outcome, day: this.state.time.day };
    if (typeof entry.whoName === 'string') e.whoName = entry.whoName;
    if (extra) Object.assign(e, extra);
    c.wantLog.push(e);
    if (c.wantLog.length > WANT_CAPS.log) c.wantLog.splice(0, c.wantLog.length - WANT_CAPS.log);
    return e;
  }

  say(c, lines, entry, icon) {
    if (!c.visible || c.away) return;
    c.showBubble(icon, WANT_RULES.bubbleSeconds);
    if (c.speech || !lines || lines.length === 0) return;
    if (this.rng.next() >= WANT_RULES.speechChance) return;
    const text = lines[Math.floor(this.rng.next() * lines.length)];
    c.speech = { text: text.replace('{who}', entry.whoName ?? ''), at: -1, duration: WANT_RULES.speechSeconds };
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Gerçekleşme

  /** Arzu gerçekleşti. */
  fulfil(c, want, points = WANTS[want.key].points) {
    const i = c.wants.indexOf(want);
    if (i < 0) return false;
    c.wants.splice(i, 1);
    this.adjust(c, points);
    c.fearStreak = 0;
    c.wishCount += 1;
    this.log(c, want, 'want', 'fulfilled');
    this.count('fulfilled', want.key);
    const tier = tierForPoints(points);
    this.moodlets?.apply(c, 'wish_come_true', { reason: `wish_${want.key}`, tier, whoId: want.whoId, whoName: want.whoName });
    if (points >= WANT_RULES.memoryAt) addMemory(this.state, c, `Dileği oldu: ${wantName('want', want)}`, 'sparkle', { kind: 'life', fond: true });
    this.say(c, WANT_LINES[want.key], want, WANTS[want.key].icon);
    this.events.emit('want:fulfilled', { character: c, want, points });
    recomputeDrive(c);
    recomputeMood(c);
    return true;
  }

  /** Korku başına geldi. */
  realize(c, fear, points = FEARS[fear.key].points, extra = null) {
    const i = c.fears.indexOf(fear);
    if (i < 0) return false;
    c.fears.splice(i, 1);
    this.adjust(c, -points);
    c.fearStreak += 1;
    this.log(c, fear, 'fear', 'realized', extra);
    this.count('realized', fear.key);
    // "Yokluğu" korkusunda Derin Yas yeterlidir: ikinci bir olumsuz moodlet verilmez
    if (fear.key !== 'loss_of_loved') this.moodlets?.apply(c, 'dread_realized', { reason: `dread_${fear.key}`, tier: tierForPoints(points), whoId: fear.whoId, whoName: fear.whoName });
    if (points >= WANT_RULES.memoryAt) addMemory(this.state, c, `Korktuğu başına geldi: ${wantName('fear', fear)}`, 'sulk', { kind: 'life', fond: false });
    this.say(c, FEAR_LINES[fear.key], fear, FEARS[fear.key].icon);
    this.events.emit('fear:realized', { character: c, fear, points });
    recomputeDrive(c);
    recomputeMood(c);
    return true;
  }

  /** Katalog sırasıyla ilk eşleşen aktif arzuyu gerçekleştirir (aynı olay en çok bir arzu). */
  fulfilFirst(c, keys, points) {
    if (!this.eligible(c)) return false;
    for (const w of c.wants) {
      if (keys.includes(w.key)) return this.fulfil(c, w, points);
    }
    return false;
  }

  /** Hedefli arzu: whoId eşleşirse. */
  fulfilWith(c, key, other) {
    if (!this.eligible(c) || !other) return false;
    const w = c.wants.find((x) => x.key === key && x.whoId === other.id);
    return w ? this.fulfil(c, w) : false;
  }

  realizeFirst(c, key, points) {
    if (!this.eligible(c)) return false;
    const f = c.fears.find((x) => x.key === key);
    return f ? this.realize(c, f, points) : false;
  }

  realizeWith(c, key, other) {
    if (!this.eligible(c) || !other) return false;
    const f = c.fears.find((x) => x.key === key && x.whoId === other.id);
    return f ? this.realize(c, f) : false;
  }

  onGraduated(pupil, masterId, grandmaster) {
    if (!pupil || !Number.isFinite(masterId)) return;
    const master = this.state.characters.find((o) => o.id === masterId);
    if (!master || !this.eligible(master)) return;
    const w = master.wants.find((x) => x.key === 'see_pupil_master');
    if (w) this.fulfil(master, w, WANTS.see_pupil_master.points + (grandmaster ? WANTS.see_pupil_master.grandmasterBonus : 0));
  }

  /** Doğum: ebeveynlerin "evladımız olsun", ebeveynlerin ebeveynlerinin "torun seveyim" arzusu. */
  onChildBorn(parents) {
    for (const p of parents) if (p) this.fulfilFirst(p, ['have_child']);
    for (const c of this.state.characters) {
      if (parents.includes(c) || !c.wants?.length) continue;
      if (parents.some((p) => p && isParentOf(c, p))) this.fulfilFirst(c, ['see_grandchild']);
    }
  }

  onLevelUp(a, b, level, previous) {
    if (!a || !b || level?.key !== 'friend' || (previous?.min ?? 0) >= WANT_RULES.friendScore) return;
    this.fulfilFirst(a, ['make_friend']);
    this.fulfilFirst(b, ['make_friend']);
  }

  /** Handa şerbet: ziyafet arzusu ya da eşiyle birlikte (aynı handa) içiyorsa "handa şerbet" arzusu. */
  onSherbet(c, inn) {
    if (!this.eligible(c)) return;
    for (const w of c.wants) {
      if (w.key === 'feast_meal') return void this.fulfil(c, w);
      if (w.key === 'sherbet_with_spouse' && this.together(c, w.whoId, inn)) return void this.fulfil(c, w);
    }
  }

  /** Eşi aynı handa mı: aynı yapının içinde, aynı han toplanmasında ya da nearRadius piksel içinde. */
  together(c, id, inn) {
    const p = this.state.characters.find((o) => o.id === id);
    if (!p || !inn) return false;
    if (p.insideBuildingId !== null && p.insideBuildingId === inn.id) return true;
    if (p.task?.buildingId === inn.id && p.task.phase === 'perform') return true;
    const r = WANT_RULES.nearRadius;
    return p.visible && (p.x - c.x) ** 2 + (p.y - c.y) ** 2 <= r * r;
  }

  /** Dilekçe: olumlu sonuç "kabul görsün" arzusunu gerçekleştirir ve "duyulmaması" korkusunu geçirir; olumsuzsa arzu cezasız silinir. */
  onPetition(c, outcome) {
    if (!this.eligible(c)) return;
    const w = c.wants.find((x) => x.key === 'be_heard');
    const f = c.fears.find((x) => x.key === 'unheard');
    if (outcome === 'fulfilled') {
      if (w) this.fulfil(c, w);
      if (f) {
        c.fears.splice(c.fears.indexOf(f), 1);
        this.log(c, f, 'fear', 'passed');
        this.count('passed', f.key);
        this.adjust(c, WANT_RULES.passReward);
        recomputeDrive(c);
      }
    } else if (w) {
      c.wants.splice(c.wants.indexOf(w), 1);
      this.log(c, w, 'want', 'void');
      recomputeDrive(c);
    }
  }

  /**
   * Yangın: yapının çalışanı ya da sakini olan korkanlar. Tutuşunca 10; aynı korku tutuşta gerçekleşmişse kül olunca ek -6 (sayaç artmaz;
   * kayıt `burned` işaretlenir); tutuşta henüz korkmayan, kül olurken korkusu sürüyorsa 16.
   */
  onFire(building, burned) {
    if (!building) return;
    const def = FEARS.fire_at_work;
    const day = this.state.time.day;
    for (const c of this.state.characters) {
      if (!wantsEnabled(c)) continue;
      if (!(c.homeId === building.id || building.workerIds?.has(c.id))) continue;
      const f = c.fears.find((x) => x.key === 'fire_at_work');
      if (f) {
        this.realize(c, f, burned ? def.points + def.burnedPoints : def.points, burned ? { burned: true } : null);
        continue;
      }
      if (!burned) continue;
      for (let i = c.wantLog.length - 1; i >= 0; i--) {
        const e = c.wantLog[i];
        if (e.key !== 'fire_at_work' || e.outcome !== 'realized' || e.burned || day - e.day > 1) continue;
        e.burned = true;
        this.adjust(c, -def.burnedPoints);
        break;
      }
    }
  }

  /** moodlet:added tek dinleyici: moodlet -> korku / arzu. */
  onMoodlet(c, m) {
    if (!m || !this.eligible(c) || m.key === 'wish_come_true' || m.key === 'dread_realized') return;
    const fearKey = FEAR_MOODLETS[m.key];
    if (fearKey) {
      const f = c.fears.find((x) => x.key === fearKey && (fearKey !== 'loss_of_loved' || x.whoId === m.whoId));
      if (f) this.realize(c, f);
    }
    const wantKey = WANT_MOODLETS[m.key];
    if (wantKey) this.fulfilFirst(c, [wantKey]);
  }

  /** Giden (vefat / göç) kişiye bağlı bütün kayıtlar cezasız silinir; günlükte yalnızca ad kalır. */
  voidRefs(ids) {
    if (!ids.length) return;
    for (const c of this.state.characters) {
      if (!wantsEnabled(c) || ids.includes(c.id)) continue;
      let changed = false;
      for (const [kind, list] of [['want', c.wants], ['fear', c.fears]]) {
        for (let i = list.length - 1; i >= 0; i--) {
          if (!ids.includes(list[i].whoId)) continue;
          this.log(c, list[i], kind, 'void');
          list.splice(i, 1);
          changed = true;
        }
      }
      if (changed) recomputeDrive(c);
    }
  }
}

