// Sakinler arası ilişki puanları (-50 ile 100 arası), romantizm ve evlilik.
//
//   - Aynı toplanma yerinde sohbet eden ya da aynı şantiye / binada birlikte çalışan her çift,
//     oyun dakikası başına puan kazanır (src/data/relationships.js -> RELATIONSHIP_RATES); zıt
//     kişilikliler yarı puan kazanır. Puan atışmalarla düşer (ConflictSystem).
//   - Puan seviyeyi belirler (Rakip, Hoşlanmıyor, Yabancı, Tanıdık, Dost, En İyi Arkadaş); seviye
//     değişince 'relationship:levelUp' / 'relationship:levelDown' { a, b, level, previous } yayınlanır
//   - Seviye, sohbetin sosyallik ve keyif kazancını değiştirir (bondFor)
//   - Romantizm: ROMANCE.minScore'u geçmiş iki bekâr yetişkin sohbet ederken / şenlikte aşık olabilir:
//     'relationship:partnered' { a, b, building }
//   - Evlilik: bir süredir partner olan çift akşam bir toplanma yerinde ya da şenlikte evlenir (bir süre
//     daha geçerse 18:00'de meydanda küçük bir törenle): 'relationship:married' { a, b, venue, festival }
//     Evliliğin sonuçlarını (aynı eve taşınma, Mutlu Yuva, çocuk) FamilySystem uygular.
//
// Puanlar GameState.relationships içinde "küçükId-büyükId" anahtarıyla saklanır; kaydedilen
// çift yoksa aynı evde yaşayanlar HOUSEMATE_START, aile (ebeveyn-çocuk, kardeş) FAMILY_START ile başlar.
// Aşağıdaki saf yardımcılar arayüz ve diğer sistemler tarafından da kullanılır.
import { ACTIVITIES } from '../data/activities.js';
import {
  RELATIONSHIP_LEVELS,
  RELATIONSHIP_RATES,
  MAX_FRIENDSHIP,
  MIN_FRIENDSHIP,
  HOUSEMATE_START,
  FAMILY_START,
  ROMANCE,
  MARRIAGE,
} from '../data/relationships.js';
import { CONFLICT } from '../data/family.js';
import { clashingTraits } from '../ai/TraitProfile.js';
import { clamp } from '../utils/math.js';
import { buffMultiplier } from './TownStatus.js';

const FESTIVAL_NEAR_PIXELS = 34; // şenlikte iki karodan yakın olanlar

export function pairKey(idA, idB) {
  return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
}

/** Ebeveyn-çocuk ya da kardeş mi? (aşık olamazlar, dost başlarlar) */
export function isFamily(a, b) {
  if (a.parentIds.includes(b.id) || b.parentIds.includes(a.id)) return true;
  return a.parentIds.some((id) => b.parentIds.includes(id));
}

/** İki karakter arasındaki ilişki puanı. */
export function getFriendship(state, a, b) {
  const stored = state.relationships[pairKey(a.id, b.id)];
  if (stored !== undefined) return stored;
  if (isFamily(a, b)) return FAMILY_START;
  return a.homeId !== null && a.homeId === b.homeId ? HOUSEMATE_START : 0;
}

export function levelIndexFor(score) {
  let index = 0;
  RELATIONSHIP_LEVELS.forEach((level, i) => {
    if (score >= level.min) index = i;
  });
  return index;
}

export function levelForScore(score) {
  return RELATIONSHIP_LEVELS[levelIndexFor(score)];
}

/** Sakinin partneri ya da eşi (yoksa null). */
export function partnerOf(state, character) {
  if (character.partnerId === null) return null;
  return state.characters.find((c) => c.id === character.partnerId) ?? null;
}

/** İki kişi şu an sevgili / eş mi? */
export function arePartners(a, b) {
  return a.partnerId === b.id && b.partnerId === a.id;
}

/** Sakinin çocukları (büyümüş olsalar da). */
export function childrenOf(state, character) {
  return state.characters.filter((c) => c.parentIds.includes(character.id));
}

/** Aşık olabilirler mi: ikisi de bekâr yetişkin, aile değiller ve yaşları birbirine yakın. */
export function canRomance(a, b) {
  if (a.isChild || b.isChild || a.partnerId !== null || b.partnerId !== null) return false;
  if (a.role || b.role) return false;
  return !isFamily(a, b) && Math.abs(a.age - b.age) <= ROMANCE.maxAgeGap;
}

/**
 * Bir karakterin en yakın arkadaşları: en az `minLevel` seviyesindeki en yüksek puanlı `count` kişi.
 * `exclude` içindeki kimlikler atlanır (ör. paneldeki eş). Dönüş: [{ character, score, level }]
 */
export function topFriends(state, character, count, minLevel = 'acquaintance', exclude = []) {
  const minIndex = RELATIONSHIP_LEVELS.findIndex((l) => l.key === minLevel);
  return state.characters
    .filter((other) => other !== character && !exclude.includes(other.id))
    .map((other) => {
      const score = getFriendship(state, character, other);
      return { character: other, score, level: levelForScore(score) };
    })
    .filter((entry) => levelIndexFor(entry.score) >= minIndex)
    .sort((x, y) => y.score - x.score)
    .slice(0, count);
}

/** En kötü ilişkisi (puanı `below`'un altındaysa): { character, score, level } ya da null. */
export function worstRelation(state, character, below) {
  let worst = null;
  for (const other of state.characters) {
    if (other === character) continue;
    const score = getFriendship(state, character, other);
    if (score < below && (!worst || score < worst.score)) worst = { character: other, score, level: levelForScore(score) };
  }
  return worst;
}

function isEvening(hour, from, to) {
  return hour >= from || hour < to;
}

/**
 * Şu an aynı yerde aynı işi yapan sakin grupları (sohbet, şenlik, birlikte çalışma).
 * Dönüş: [{ id, kind: 'chat' | 'festival' | 'work', activity, buildingId, rate, near, members }]
 */
export function activityGroups(characters) {
  const groups = new Map();
  for (const c of characters) {
    const key = groupKey(c);
    if (!key) continue;
    if (!groups.has(key.id)) groups.set(key.id, { ...key, members: [] });
    groups.get(key.id).members.push(c);
  }
  return [...groups.values()];
}

/** Karakterin şu an hangi sohbet / çalışma grubunda olduğu, yoksa null. */
function groupKey(c) {
  const task = c.task;
  if (!task || task.phase !== 'perform' || !c.visible) return null;
  const activity = ACTIVITIES[task.activity];
  if (activity.kind === 'social' || activity.kind === 'festival') {
    // Han ve şenlik gibi yerlerde arkadaşlık daha hızlı gelişir
    const multiplier = activity.friendshipMultiplier ?? 1;
    const festival = activity.kind === 'festival';
    return {
      id: `chat:${task.activity}:${task.buildingId}`,
      kind: festival ? 'festival' : 'chat',
      activity: task.activity,
      buildingId: task.buildingId,
      rate: RELATIONSHIP_RATES.chat * multiplier,
      near: festival ? FESTIVAL_NEAR_PIXELS : null,
    };
  }
  if (activity.kind === 'work') {
    const target = task.jobId ? `job:${task.jobId}` : `building:${task.workBuildingId}`;
    return {
      id: `work:${target}`,
      kind: 'work',
      activity: task.activity,
      buildingId: task.workBuildingId ?? task.buildingId ?? null,
      rate: RELATIONSHIP_RATES.work,
      near: null,
    };
  }
  return null;
}

export class RelationshipSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.groups = []; // bu karenin sohbet / çalışma grupları (ConflictSystem ve FamilySystem de okur)
    this.unsubscribers = [game.events.on('time:hour', (hour) => this.onHour(hour))];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get(a, b) {
    return getFriendship(this.state, a, b);
  }

  /** Sohbetin kazanç çarpanları: { socialBonus, funBonus } (bu iki kişinin seviyesine göre). */
  bondFor(a, b) {
    return levelForScore(this.get(a, b));
  }

  /** Çifte puan ekler (eksi olabilir); zıt kişilikliler yarı puan kazanır. Seviye değişirse olayı yayınlar. */
  add(a, b, amount) {
    const gain = amount > 0 && clashingTraits(a.traits, b.traits) ? amount * CONFLICT.clashGainMultiplier : amount;
    this.set(a, b, this.get(a, b) + gain);
  }

  /** Puanı doğrudan ayarlar (barışma); seviye değişirse olayı yayınlar. */
  set(a, b, score) {
    const before = this.get(a, b);
    const after = clamp(score, MIN_FRIENDSHIP, MAX_FRIENDSHIP);
    this.state.relationships[pairKey(a.id, b.id)] = after;
    const from = levelIndexFor(before);
    const to = levelIndexFor(after);
    if (to === from) return;
    this.events.emit(to > from ? 'relationship:levelUp' : 'relationship:levelDown', {
      a,
      b,
      level: RELATIONSHIP_LEVELS[to],
      previous: RELATIONSHIP_LEVELS[from],
    });
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    this.groups = activityGroups(this.world.characters);
    const evening = isEvening(tick.hour, MARRIAGE.eveningFrom, MARRIAGE.eveningTo);
    for (const group of this.groups) {
      const { members, near } = group;
      // Büyük Panayır (11. aşama) sohbetlerde arkadaşlığı hızlandırır
      const rate = group.rate * (group.kind === 'work' ? 1 : buffMultiplier(this.state ?? this.world.state, 'friendship'));
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const a = members[i];
          const b = members[j];
          // Kalabalık şenlikte yalnızca yan yana dans edenler yakınlaşır
          if (near && Math.hypot(a.x - b.x, a.y - b.y) > near) continue;
          this.add(a, b, rate * tick.gameMinutes);
          if (group.kind === 'work') continue;
          this.tryRomance(a, b, group, tick.gameMinutes);
          if (evening) this.tryMarriage(a, b, group, tick.gameMinutes);
        }
      }
    }
  }

  /** Yakın iki bekâr sohbet ederken / dans ederken aşık olabilir. */
  tryRomance(a, b, group, minutes) {
    if (!canRomance(a, b) || this.get(a, b) < ROMANCE.minScore) return;
    if (this.rng.next() >= ROMANCE.chancePerMinute * minutes) return;
    const now = this.state.totalMinutes;
    a.partnerId = b.id;
    b.partnerId = a.id;
    a.partnerSince = now;
    b.partnerSince = now;
    a.showBubble('love', 3);
    b.showBubble('love', 3);
    this.events.emit('relationship:partnered', { a, b, building: this.world.getBuilding(group.buildingId) });
  }

  /** Bir süredir sevgili olan çift akşam birlikte vakit geçirirken evlenebilir. */
  tryMarriage(a, b, group, minutes) {
    if (!arePartners(a, b) || a.married) return;
    if (this.state.totalMinutes - a.partnerSince < MARRIAGE.minPartnerDays * 1440) return;
    if (this.rng.next() >= MARRIAGE.chancePerMinute * minutes) return;
    this.marry(a, b, this.world.getBuilding(group.buildingId), group.kind === 'festival');
  }

  /** Uzun süredir evlenmeyen çiftler akşamüstü meydanda küçük bir törenle evlenir. */
  onHour(hour) {
    if (hour !== MARRIAGE.fallbackHour) return;
    const now = this.state.totalMinutes;
    const venue = this.world.getCompleted('fountain')[0] ?? null;
    for (const a of this.world.characters) {
      const b = partnerOf(this.state, a);
      if (!b || a.married || a.id > b.id) continue;
      if (now - a.partnerSince >= MARRIAGE.fallbackDays * 1440) this.marry(a, b, venue, false);
    }
  }

  marry(a, b, venue, festival) {
    const now = this.state.totalMinutes;
    for (const c of [a, b]) {
      c.married = true;
      c.marriedAt = now;
      c.showBubble('ring', 3.5);
    }
    this.events.emit('relationship:married', { a, b, venue, festival });
  }
}
