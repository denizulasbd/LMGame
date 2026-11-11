// Kasaba draması: zıt kişilikli sakinlerin atışması ve barışması (9. aşama).
//
//   Atışma : zıt özellikli (data/characters.js -> OPPOSING_TRAITS) iki sakin aynı yapıda / şantiyede yan
//            yana çalışırken, aynı toplanma yerinde sohbet ederken ya da dar bir yerde karşılaşınca
//            atışabilir: başlarında öfke şimşeği / somurtma bulutu belirir, keyifleri düşer, ilişki
//            puanları azalır (eksiye inebilir: Hoşlanmıyor, Rakip). Sevgililer ve eşler atışmaz.
//            (29.1) Kimyası eksi olan çift zıt özelliği olmasa da atışabilir (traits: null); eksi kimya riski artırır.
//            'relationship:quarrel' { a, b, traits, kind: 'work' | 'chat' | 'encounter', place, firstToday }
//   Barışma: küs (puanı RECONCILE.below altında) iki sakin aynı yerde sohbet ederken barışabilir; ilişkileri
//            normale döner, başlarında el sıkışma balonu çıkar. (15. aşama) Kasaba Hanı, Ahşap Çardak, Kamp Ateşi ve
//            şenlik / mevsim festivali gönül alma yerleridir: barışma olasılığı 4 kat, orada kimse atışmaz.
//            'relationship:reconciled' { a, b, place: 'inn' | 'gazebo' | 'campfire' | 'festival' | 'chat' }
// Sayılar src/data/family.js -> CONFLICT, RECONCILE. Gruplar RelationshipSystem'den okunur.
import { CONFLICT, RECONCILE } from '../data/family.js';
import { clashingTraits } from '../ai/TraitProfile.js';
import { pairKey, arePartners } from './RelationshipSystem.js';
import { clamp } from '../utils/math.js';
import { chemistryLevel, chemistryFor } from './Chemistry.js';
import { CHEMISTRY_QUARREL_SHARE } from '../data/chemistry.js';

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
    this.grouped = new Set(); // bu adımda bir gruba dahil olanlar (her adımda yeniden kullanılır)
  }

  update(tick) {
    const minutes = tick.gameMinutes;
    if (minutes <= 0) return;
    const evening = tick.hour >= RECONCILE.eveningFrom || tick.hour < 2;
    const grouped = this.grouped;
    grouped.clear();

    for (const group of this.relationships.groups) {
      for (const c of group.members) grouped.add(c.id);
      if (group.members.length < 2) continue;
      const building = group.buildingId ? this.world.getBuilding(group.buildingId) : null;
      const place = reconcilePlace(group);
      this.forPairs(group.members, (a, b) => {
        // Küs iki sakin aynı sohbette denk gelince önce barışmayı dener
        if (place && this.relationships.get(a, b) < RECONCILE.below) {
          this.tryReconcile(a, b, place, minutes);
          return;
        }
        if (VENUES.has(place)) return; // gönül alma yerlerinde atışılmaz
        this.tryQuarrel(a, b, group.kind === 'work' ? 'work' : 'chat', minutes, building);
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
    // (29.1) kimya: eksi kimyada atışma riski artar (zıt özellik olmasa da, yarı olasılıkla); güçlü çekimde azalır
    // (zıt özelliği olmayan çiftte yalnızca kayıtlı kimyaya bakılır: kayıt, sohbet etmiş / bağ kurmuş çiftlerde vardır)
    const stored = a.relationships[b.id]?.chemistry;
    if (!clash && !(stored < 0)) return;
    const chemistry = chemistryLevel(stored ?? chemistryFor(this.state.seed, a, b)).quarrel * (clash ? 1 : CHEMISTRY_QUARREL_SHARE);
    const key = pairKey(a.id, b.id);
    const now = this.state.totalMinutes;
    if ((this.cooldowns.get(key) ?? -1) > now) return;
    // (29.2) tatsız karşılaşma yaşamış ya da aç ve huysuz sakin daha çabuk parlar
    const temper = Math.max(a.profile.quarrelChance, b.profile.quarrelChance) * Math.max(a.mood.quarrelMul, b.mood.quarrelMul);
    // (15. aşama) küsler birbirini görmezden gelir: aynı çiftin üst üste atışması seyrekleşir
    const feud = this.relationships.get(a, b) < RECONCILE.below ? CONFLICT.feudQuarrelMultiplier : 1;
    if (this.rng.next() >= QUARREL_RATES[kind] * temper * feud * chemistry * minutes) return;
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
    this.state.stats.quarrels = (this.state.stats.quarrels ?? 0) + 1;
    this.events.emit('relationship:quarrel', { a, b, traits: clash, kind, place: building?.name ?? null, firstToday });
  }

  tryReconcile(a, b, place, minutes) {
    if (a.isChild || b.isChild || this.relationships.get(a, b) >= RECONCILE.below) return;
    const chance = RECONCILE.chancePerMinute * (VENUES.has(place) ? RECONCILE.venueMultiplier : 1);
    if (this.rng.next() >= chance * minutes) return;
    this.relationships.set(a, b, RECONCILE.resetTo);
    this.cooldowns.set(pairKey(a.id, b.id), this.state.totalMinutes + CONFLICT.cooldownMinutes);
    this.state.stats.reconciliations = (this.state.stats.reconciliations ?? 0) + 1;
    if (a.visible) a.showBubble('handshake', 2.8);
    if (b.visible) b.showBubble('handshake', 2.8);
    this.events.emit('relationship:reconciled', { a, b, place });
  }
}

const VENUES = new Set(RECONCILE.venues);

/** Sohbet grubunun barışma yeri: 'inn' | 'gazebo' | 'campfire' | 'festival' | 'chat'; çalışma grubunda null. */
function reconcilePlace(group) {
  if (group.kind === 'festival') return 'festival';
  if (group.kind === 'work') return null;
  return VENUES.has(group.activity) ? group.activity : 'chat';
}
