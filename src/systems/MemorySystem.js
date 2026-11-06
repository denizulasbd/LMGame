// Sakinlerin anıları ve yaşam günlüğü (14. aşama). Her sakinin kendi hayat yolculuğu Character.memories'te saklanır
// (kayda girer): { day, hour, text, icon, kind, fond } — en yenisi sonda, en çok MEMORY.max anı (ilk anı hep kalır).
//
//   Anılar olaylardan yazılır: kasabaya katılma, dostluk ve en iyi arkadaşlık, aşk (çardakta / şenlikte), düğün,
//   çocuğun doğumu, büyüme, okul mezuniyeti, Kalfa / Usta unvanı, hastalanıp iyileşme, keşif seferi, barışma,
//   kasabanın kedisi / köpeğiyle dostluk, mevsim festivalleri, harika ve kasaba seviyesi, yeni ad.
//   Nostalji: sakin çardakta, bankta, nehir kenarında, çiçeklerin, ateşin ya da anıtın başında otururken ya da
//   sabah uyanınca arada bir güzel bir anısını hatırlar: başında anı balonu çıkar, keyfi ve iç huzuru artar
//   ('memory:recalled' { character, memory }). Karakter Paneli "Anılar ve Hatıralar" bölümünde listeler.
import { SKILLS } from '../data/skills.js';
import { getSeason } from '../data/seasons.js';
import { clamp } from '../utils/math.js';
import { RECONCILE_PLACES } from '../data/family.js';

export const MEMORY = {
  max: 40,
  friends: 4, // en çok kaç "dost oldu" anısı (en iyi arkadaşlıklar her zaman yazılır)
  recallChancePerMinute: 0.004, // uygun bir yerde otururken
  wakeRecallChance: 0.15, // sabah uyanınca
  cooldownMinutes: 6 * 60, // iki hatırlama arası en az
  showMinutes: 90, // panelde "Anılara daldı" süresi
  fun: 8,
  social: 3,
  // Hatırlamanın geldiği sakin anlar (etkinlik anahtarları)
  calmActivities: ['gazebo', 'bench', 'river', 'flowers', 'campfire', 'monument', 'ancientSpring', 'shade', 'readBench', 'viewpoint'],
};

const PLACE_PHRASES = { gazebo: 'Çardakta ', inn: 'Handa ', fountain: 'Meydanda ', campfire: 'Ateş başında ' };

// Defter dolunca önce bunlar silinir (en eskisinden): dostluklar, kasaba olayları, hayvanlar, festivaller, ad
const MINOR_KINDS = new Set(['friend', 'town', 'pet', 'festival', 'name', 'reconcile', 'stroll', 'gossip']); // gossip: (19. aşama) kulaktan kulağa duyulan haber // stroll: (18. aşama) güzel sokak, çiçek kokusu

/**
 * Sakinin anılarına yeni bir satır ekler. Aynı cümle zaten yazılıysa yinelenmez (ör. bozulup yeniden kurulan dostluk;
 * festivallerde yalnızca tarihi güncellenir). Defter MEMORY.max'ı aşınca ilk anı korunur, önce en eski küçük anı
 * (dostluk, kasaba olayı, festival...) silinir; böylece aşk, düğün, çocuk ve unvanlar kalır.
 */
export function addMemory(state, c, text, icon = 'heart', { kind = 'life', fond = true } = {}) {
  const { day, hour } = state.time;
  c.memories ??= [];
  const same = c.memories.findIndex((m, i) => i > 0 && m.text === text);
  if (same >= 0) {
    if (kind !== 'festival') return c.memories[same];
    c.memories.splice(same, 1); // festival her yıl kutlanır: en yeni tarihiyle sona taşınır
  }
  c.memories.push({ day, hour, text, icon, kind, fond });
  while (c.memories.length > MEMORY.max) {
    const minor = c.memories.findIndex((m, i) => i > 0 && i < c.memories.length - 1 && MINOR_KINDS.has(m.kind));
    c.memories.splice(minor > 0 ? minor : 1, 1);
  }
  return c.memories[c.memories.length - 1];
}

export class MemorySystem {
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
    const remember = (c, text, icon, opts) => c && addMemory(this.state, c, text, icon, opts);
    const both = (a, b, textA, textB, icon, opts) => {
      remember(a, textA, icon, opts);
      remember(b, textB, icon, opts);
    };
    const all = (text, icon) => {
      for (const c of this.state.characters) if (!c.away) remember(c, text, icon, { kind: 'town' });
    };
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('population:joined', ({ character }) => remember(character, 'Kasabaya göçmen olarak katıldı', 'heart', { kind: 'arrival' })),
      on('relationship:levelUp', ({ a, b, level }) => {
        if (level.key !== 'friend' && level.key !== 'bestFriend') return;
        for (const [c, other] of [[a, b], [b, a]]) this.rememberFriend(c, other, level.key === 'bestFriend');
      }),
      on('relationship:partnered', ({ a, b, building }) => {
        const festival = this.state.events.festival.active && building?.id === this.state.events.festival.venueId;
        const where = festival ? 'Şenlikte ' : PLACE_PHRASES[building?.type] ?? '';
        both(a, b, `${where}${b.name} ile birbirlerine aşık oldular`, `${where}${a.name} ile birbirlerine aşık oldular`, 'love', { kind: 'love' });
      }),
      on('relationship:married', ({ a, b, venue, festival }) => {
        const where = festival ? 'şenlikte' : venue ? `${venue.name} başında` : 'meydanda';
        both(a, b, `${b.name} ile ${where} evlendi`, `${a.name} ile ${where} evlendi`, 'ring', { kind: 'wedding' });
      }),
      on('family:childBorn', ({ child, parents }) => {
        for (const p of parents) remember(p, `Çocuğu ${child.name} dünyaya geldi`, 'love', { kind: 'child' });
        remember(child, `Dünyaya geldi; anne babası ${parents[0].name} ve ${parents[1].name}`, 'love', { kind: 'birth' });
      }),
      on('family:grownUp', ({ character }) => remember(character, 'Büyüdü ve kasabanın genç bir sakini oldu', 'star', { kind: 'grownUp' })),
      on('school:graduated', ({ character, skill }) => remember(character, `Bilgelik Evi'ni bitirip Kalfa ${SKILLS[skill].title} olarak başladı`, 'book', { kind: 'school' })),
      on('skill:levelUp', ({ character, skill, level }) => {
        if (level.level < 2) return;
        const text = level.level === 3 ? `Usta ${SKILLS[skill].title} unvanını kazandı` : `Kalfa ${SKILLS[skill].title} oldu`;
        remember(character, text, SKILLS[skill].icon, { kind: 'skill' });
      }),
      on('health:cured', ({ character, wasIll }) => {
        if (!wasIll) return;
        remember(character, `${this.hardTimes()} hastalandı ama Şifacı'nın iksiriyle iyileşti`, 'remedy', { kind: 'health' });
      }),
      // (16. aşama) Seferin hikâyesi: yolun adı, sağ salim mi döndü, neler keşfetti (ExpeditionSystem yazar)
      on('expedition:returned', ({ members, buff, memories }) =>
        members.forEach((c) =>
          remember(c, memories?.[c.id] ?? (buff === 'talisman' ? 'Keşif seferinden Kadim Tılsım\'la döndü' : 'Keşif seferinden ganimetle döndü'), 'map', { kind: 'expedition' })
        )
      ),
      on('adventure:resolved', ({ success, member, option, scenario }) => {
        if (!success && member) remember(member, `${scenario.title}: ${option.risk.text}, ama kafileyle yola devam etti`, 'mountain', { kind: 'expedition', fond: false });
      }),
      on('expedition:taleTold', ({ teller, route }) => {
        if (!teller.memories?.some((m) => m.text === `${route} Seferi'ni handa ballandıra ballandıra anlattı`)) {
          remember(teller, `${route} Seferi'ni handa ballandıra ballandıra anlattı`, 'adventure', { kind: 'expedition' });
        }
      }),
      on('relationship:reconciled', ({ a, b, place }) => {
        const where = RECONCILE_PLACES[place] ?? '';
        both(a, b, `${where}${b.name} ile barıştı`, `${where}${a.name} ile barıştı`, 'handshake', { kind: 'reconcile' });
      }),
      on('pet:petted', ({ animal, character }) => {
        if (!animal?.name || character.memories?.some((m) => m.kind === 'pet' && m.text.includes(animal.name))) return;
        remember(character, `Kasabanın ${animal.kind === 'cat' ? 'kedisi' : 'köpeği'} ${animal.name} ile can dostu oldu`, 'paw', { kind: 'pet' });
      }),
      on('seasonFestival:ended', ({ festival, attendees }) => {
        for (const id of attendees) remember(this.world.getCharacter(id), festival.memory, festival.icon, { kind: 'festival' });
      }),
      on('wonder:completed', () => all("Ulu Saat Kulesi'nin tamamlanışını ve Altın Çağ'ın başlangıcını gördü", 'wonder')),
      on('town:tierUp', ({ tier }) => all(`Kasaba ${tier.name} oldu; o gün meydanda kutlama vardı`, tier.icon)),
      on('character:renamed', ({ character, from }) => remember(character, `Artık ${character.name} adıyla anılıyor (eskiden ${from})`, 'heart', { kind: 'name', fond: false })),
      on('character:woke', ({ character }) => {
        if (this.rng.next() < MEMORY.wakeRecallChance) this.recall(character);
      }),
    ];
    // Yeni oyunun ilk sakinleri (ve anısı olmayan eski kayıt sakinleri) kasabanın kurucuları olarak başlar
    for (const c of this.state.characters) {
      if (c.memories?.length) continue;
      const first = this.state.time.day <= 1 ? 'Kasabanın ilk sakinlerinden biri oldu' : 'Kasabada yaşamaya başladı';
      c.memories = [{ day: this.state.time.day, hour: this.state.time.hour, text: c.isChild ? 'Kasabada doğup büyüyor' : first, icon: 'heart', kind: 'arrival', fond: true }];
    }
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /**
   * Dostluk anısı: kalabalık kasabada defter dostluklarla dolmasın diye en çok MEMORY.friends dostluk yazılır; en iyi
   * arkadaşlık her zaman yazılır ve aynı kişiyle olan "dost oldu" anısının yerini alır.
   */
  rememberFriend(c, other, best) {
    const memories = (c.memories ??= []);
    const friendText = `${other.name} ile dost oldu`;
    if (best) {
      const i = memories.findIndex((m, k) => k > 0 && m.text === friendText);
      if (i > 0) memories.splice(i, 1);
      addMemory(this.state, c, `${other.name} ile en iyi arkadaş oldu`, 'heart', { kind: 'friend' });
      return;
    }
    const friends = memories.filter((m) => m.kind === 'friend' && m.text.endsWith(' ile dost oldu')).length;
    if (friends < MEMORY.friends) addMemory(this.state, c, friendText, 'heart', { kind: 'friend' });
  }

  /** "Kış günlerinde" / "Fırtınalı günlerde": hastalığın anısının başı. */
  hardTimes() {
    if (this.state.dilemma?.storm || this.state.weather.type === 'thunderstorm') return 'Fırtınalı günlerde';
    return `${getSeason(this.state.time.day).name} günlerinde`;
  }

  update(tick) {
    const minutes = tick.gameMinutes;
    if (minutes <= 0) return;
    for (const c of this.world.characters) {
      const task = c.task;
      if (!task || task.phase !== 'perform' || !MEMORY.calmActivities.includes(task.activity)) continue;
      if (this.rng.next() < MEMORY.recallChancePerMinute * minutes) this.recall(c);
    }
  }

  /** Güzel bir anıyı hatırlar: anı balonu, keyif ve iç huzur. Dönüş: anı ya da null. */
  recall(c) {
    const now = this.state.totalMinutes;
    if (c.recall && now - c.recall.at < MEMORY.cooldownMinutes) return null;
    const fond = (c.memories ?? []).filter((m) => m.fond);
    if (fond.length === 0) return null;
    // Önemli anılar (aşk, düğün, çocuk, festival) daha sık hatırlanır
    const weight = (m) => (['love', 'wedding', 'child', 'festival', 'friend'].includes(m.kind) ? 3 : 1);
    const memory = this.rng.weighted(fond.map((m) => [m, weight(m)]));
    c.recall = { at: now, until: now + MEMORY.showMinutes, text: memory.text, day: memory.day };
    c.needs.fun = clamp(c.needs.fun + MEMORY.fun, 0, 100);
    c.needs.social = clamp(c.needs.social + MEMORY.social, 0, 100);
    if (c.visible) c.showBubble('memory', 2.6);
    this.state.stats.recollections = (this.state.stats.recollections ?? 0) + 1;
    this.events.emit('memory:recalled', { character: c, memory });
    return memory;
  }
}
