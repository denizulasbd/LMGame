// Kasaba draması: zıt kişilikli sakinlerin atışması ve barışması (9. aşama).
//
//   Atışma : zıt özellikli (data/characters.js -> OPPOSING_TRAITS) iki sakin aynı yapıda / şantiyede yan
//            yana çalışırken, aynı toplanma yerinde sohbet ederken ya da dar bir yerde karşılaşınca
//            atışabilir: başlarında öfke şimşeği / somurtma bulutu belirir, keyifleri düşer, ilişki
//            puanları azalır (eksiye inebilir: Hoşlanmıyor, Rakip). Sevgililer ve eşler atışmaz.
//            'relationship:quarrel' { a, b, traits, kind: 'work' | 'chat' | 'encounter', place, firstToday }
//   Barışma: puanı eksiye düşmüş iki sakin akşam aynı handa (sıcak yemekte ya da han önünde sohbette)
//            ya da şenlikte denk gelirse barışabilir; ilişkileri normale döner.
//            'relationship:reconciled' { a, b, place: 'inn' | 'festival' }
// Sayılar src/data/family.js -> CONFLICT, RECONCILE. Gruplar RelationshipSystem'den okunur.
import { CONFLICT, RECONCILE } from '../data/family.js';
import { clashingTraits } from '../ai/TraitProfile.js';
import { pairKey, arePartners } from './RelationshipSystem.js';
import { clamp } from '../utils/math.js';

const QUARREL_RATES = {
  work: CONFLICT.workChancePerMinute,
  chat: CONFLICT.chatChancePerMinute,
  encounter: CONFLICT.encounterChancePerMinute,
};

export class ConflictSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./RelationshipSystem.js').RelationshipSystem} relationships
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, relationships, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.relationships = relationships;
    this.rng = rng;
    this.cooldowns = new Map(); // çift -> yeniden atışabileceği oyun dakikası (kaydedilmez)
    this.lastQuarrelDay = new Map(); // çift -> günlüğe en son yazıldığı gün
  }

  update(tick) {
    const minutes = tick.gameMinutes;
    if (minutes <= 0) return;
    const evening = tick.hour >= RECONCILE.eveningFrom || tick.hour < 2;
    const grouped = new Set();

    for (const group of this.relationships.groups) {
      for (const c of group.members) grouped.add(c.id);
      const building = group.buildingId ? this.world.getBuilding(group.buildingId) : null;
      const reconcilePlace = group.kind === 'festival' ? 'festival' : group.activity === 'inn' && evening ? 'inn' : null;
      this.forPairs(group.members, (a, b) => {
        if (reconcilePlace) {
          this.tryReconcile(a, b, reconcilePlace, minutes);
          return;
        }
        const kind = group.kind === 'work' ? 'work' : 'chat';
        this.tryQuarrel(a, b, kind, minutes, building);
      });
    }

    // Handa sıcak yemek yiyenler (içeride) akşam denk gelirse barışabilir
    if (evening) {
      for (const inn of this.world.getCompleted('inn')) {
        const diners = [...inn.occupants]
          .map((id) => this.world.getCharacter(id))
          .filter((c) => c?.task?.activity === 'innMeal' && c.task.phase === 'perform');
        this.forPairs(diners, (a, b) => this.tryReconcile(a, b, 'inn', minutes));
      }
    }

    this.checkEncounters(grouped, minutes);
  }

  forPairs(list, fn) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) fn(list[i], list[j]);
  }

  /** Dar bir yerde (aynı karoda / yan yana) karşılaşan zıt kişilikliler. */
  checkEncounters(grouped, minutes) {
    const radiusSq = CONFLICT.encounterRadius * CONFLICT.encounterRadius;
    const walkers = this.world.characters.filter((c) => c.visible && !c.isChild && !grouped.has(c.id) && c.task?.activity !== 'festival');
    this.forPairs(walkers, (a, b) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx * dx + dy * dy > radiusSq) return;
      this.tryQuarrel(a, b, 'encounter', minutes, null);
    });
  }

  tryQuarrel(a, b, kind, minutes, building) {
    if (a.isChild || b.isChild || arePartners(a, b)) return;
    const clash = clashingTraits(a.traits, b.traits);
    if (!clash) return;
    const key = pairKey(a.id, b.id);
    const now = this.state.totalMinutes;
    if ((this.cooldowns.get(key) ?? -1) > now) return;
    const temper = Math.max(a.profile.quarrelChance, b.profile.quarrelChance);
    if (this.rng.next() >= QUARREL_RATES[kind] * temper * minutes) return;
    this.quarrel(a, b, clash, kind, building);
  }

  quarrel(a, b, clash, kind, building) {
    const key = pairKey(a.id, b.id);
    const now = this.state.totalMinutes;
    this.cooldowns.set(key, now + CONFLICT.cooldownMinutes);
    this.relationships.add(a, b, -CONFLICT.scoreLoss);
    for (const c of [a, b]) c.needs.fun = clamp(c.needs.fun - CONFLICT.funLoss, 0, 100);
    // Biri öfkeden parlar, öteki somurtur (ya da ikisi de)
    const first = this.rng.next() < 0.5;
    a.showBubble(first ? 'angry' : 'sulk', 2.6);
    b.showBubble(first || this.rng.next() < 0.4 ? 'angry' : 'sulk', 2.6);
    const day = this.state.time.day;
    const firstToday = this.lastQuarrelDay.get(key) !== day;
    this.lastQuarrelDay.set(key, day);
    this.events.emit('relationship:quarrel', { a, b, traits: clash, kind, place: building?.name ?? null, firstToday });
  }

  tryReconcile(a, b, place, minutes) {
    if (this.relationships.get(a, b) >= RECONCILE.below) return;
    if (this.rng.next() >= RECONCILE.chancePerMinute * minutes) return;
    this.relationships.set(a, b, RECONCILE.resetTo);
    this.cooldowns.set(pairKey(a.id, b.id), this.state.totalMinutes + CONFLICT.cooldownMinutes);
    if (a.visible) a.showBubble('heart', 2.6);
    if (b.visible) b.showBubble('heart', 2.6);
    this.events.emit('relationship:reconciled', { a, b, place });
  }
}
