// Sosyal yaşam simülasyonu (19. aşama). Sayılar src/data/social.js'te; planları (randevu, akşam yemeği, huyların boş
// zaman etkinlikleri, düğün kutlamasına gitmek) src/ai/Brain.js kurar, yürütmeyi BehaviorSystem yapar. Bu sistem
// etkinliklerin "birlikte" olan etkilerini işler:
//
//   Huylar       : her sakine bir huy düşer (Hayvansever, Kitap Kurdu, Müzisyen, Doğa Tutkunu). İlk sakinler dört huyu
//                  paylaşır; göçmenler ve çocuklar kasabada en az görülen huyu (çocuklar çoğunlukla bir ebeveyninkini) alır.
//                  Eski kayıtlarda huyu olmayan sakinlere ilk açılışta dağıtılır.
//   Randevu      : randevudaki çift (task.dateWithId karşılıklı) yan yanayken fazladan ilişki puanı ve keyif kazanır;
//                  bankta yan yana oturan çift de aşık olabilir ve (akşamları) evlenebilir.
//   Düğün        : 'relationship:married' gelince meydanda (havuz başı) kutlama başlar: çift ve en çok 6 dostu davet edilir,
//                  konfeti yağar ('social:partyStarted' { party, ids }); bitince katılanlara anı yazılır.
//   Ortak yaşam  : evlenen çift taşınınca boşalan ev göçmenlere açılır ('social:homeFreed'); evli çift akşam evde
//                  birlikte yemek yer, birbirinin keyfini ve sosyalliğini doldurur, ertesi sabah Mutlu Yuva'yla uyanır.
//   Müzisyen     : çaldığı yerin çevresindeki en çok 4 sakinin keyfi hızla dolar, başlarında nota balonu çıkar.
//   Hayvansever  : yürüdüğü kedi / köpek onu bekler; varınca başını okşar (keyif +10, kedi mırlar: 'pet:purred').
//   Dedikodu     : büyük olaylar haber olur; sohbette ve yolda selamlaşırken bilmeyene aktarılır ('gossip:shared'),
//                  ilk kez duyanın Yaşam Günlüğü'ne not düşer. Kasabanın çoğu duyunca 'gossip:spread'.
// Durum: state.social (kutlama, haberler) ve sakinlerin quirk / lastNews / dinnerDay / lastDateAt alanları (kayda girer).
import { QUIRKS, QUIRK_KEYS, QUIRK_RULES, DATING, WEDDING_PARTY, HOME_DINNER, GOSSIP } from '../data/social.js';
import { ACTIVITIES } from '../data/activities.js';
import { EXOTIC_ITEMS } from '../data/exploration.js';
import { partnerOf, arePartners, getFriendship } from './RelationshipSystem.js';
import { addMemory } from './MemorySystem.js';
import { genitive, ablative } from '../utils/turkish.js';
import { clamp } from '../utils/math.js';

// Seferden getirilen ganimetin dedikodudaki adı (en ilginci seçilir)
const FIND_STORIES = [
  ['cityMap', 'kadim haritayı'],
  ['inscription', 'kadim yazıtı'],
  ['ancientTorch', 'kadim meşaleyi'],
  ['relicShard', 'yadigâr parçasını'],
  ['vineSeed', 'egzotik fideleri'],
];

// İlk randevunun anısındaki yer
const DATE_MEMORIES = {
  gazebo: (name) => `Çardakta ${name} ile baş başa ilk randevusuna çıktı`,
  inn: (name) => `Handa ${name} ile aynı masada ilk randevusuna çıktı`,
  bench: (name) => `${name} ile bankta yan yana oturup ilk randevusuna çıktı`,
};

export class SocialSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   * @param {{ relationships: import('./RelationshipSystem.js').RelationshipSystem }} services
   */
  constructor(game, world, rng, { relationships }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.relationships = relationships;
    this.greetCooldowns = new Map(); // "küçükId-büyükId" -> yeniden selamlaşabilecekleri oyun dakikası
    this.festivalGoers = new Set(); // süren akşam şenliğinde dans edenler (şenlik haberini bilirler)
    this.sanitize();
    this.assignQuirks(this.state.characters.filter((c) => !QUIRKS[c.quirk]), true);

    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('population:joined', ({ character }) => this.assignQuirks([character])),
      on('family:childBorn', ({ child, parents }) => this.inheritQuirk(child, parents)),
      on('relationship:married', (event) => this.onMarried(event)),
      on('family:homeShared', ({ a, b, vacated }) => {
        for (const home of vacated ?? []) this.onHomeFreed(home, a, b);
      }),
      on('masterwork:created', ({ piece, character }) =>
        this.createNews('masterwork', `${character.name} usta işi bir eser yaptı: ${piece.name}`, `${genitive(character.name)} ustalıkla yaptığı ${piece.name} eserini`, 'masterpiece', [character], {
          [character.id]: `ustalıkla yaptığı ${piece.name} eserini`,
        })
      ),
      on('expedition:returned', ({ members, route, finds }) => this.onExpedition(members, route, finds ?? [])),
      on('relationship:reconciled', ({ a, b }) => this.onReconciled(a, b)),
      on('seasonFestival:ended', ({ festival, attendees }) => {
        const people = (attendees ?? []).map((id) => this.world.getCharacter(id)).filter(Boolean);
        this.createNews('festival', `${festival.name} coşkuyla kutlandı`, `meydandaki ${festival.name} coşkusunu`, festival.icon ?? 'star', people);
      }),
      on('festival:ended', ({ theme }) => {
        // Mevsim festivalinin haberini seasonFestival:ended verir; burada akşam şenliği
        const people = [...this.festivalGoers].map((id) => this.world.getCharacter(id)).filter(Boolean);
        this.festivalGoers.clear();
        if (!theme) this.createNews('festival', 'Meydanda neşeli bir şenlik yapıldı', 'meydandaki neşeli şenliği', 'star', people);
      }),
      on('time:hour', () => this.expireNews()),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Kayıttan gelen kutlamanın ve haberlerin kopuk sakin kimliklerini temizler. */
  sanitize() {
    const social = this.state.social;
    const ids = new Set(this.state.characters.map((c) => c.id));
    const party = social.party;
    if (party && (!party.coupleIds.every((id) => ids.has(id)) || party.until <= this.state.totalMinutes)) social.party = null;
    else if (party) party.guestIds = party.guestIds.filter((id) => ids.has(id));
    for (const news of social.gossip) news.heardBy = news.heardBy.filter((id) => ids.has(id));
  }

  // ---------------------------------------------------------------------------
  // Huylar
  // ---------------------------------------------------------------------------

  /** Kasabada şu an en az görülen huylar arasından seçer (çeşitlilik); ilk sakinler karışık bir desteden alır. */
  assignQuirks(list, initial = false) {
    if (list.length === 0) return;
    if (initial && list.length === this.state.characters.length) {
      // Yeni kasaba (ya da hiç huyu olmayan eski kayıt): dört huy sırayla dağıtılır, hepsi görülür
      const deck = this.rng.shuffle([...QUIRK_KEYS]);
      list.forEach((c, i) => (c.quirk = deck[i % deck.length]));
      return;
    }
    for (const c of list) c.quirk = this.leastCommonQuirk(c);
  }

  leastCommonQuirk(except) {
    const counts = Object.fromEntries(QUIRK_KEYS.map((k) => [k, 0]));
    // (25.3) yeni nesil huylar sayılmaz (dağıtım 19. aşamanın dört huyuyla kalır)
    for (const c of this.state.characters) if (c !== except && counts[c.quirk] !== undefined) counts[c.quirk] += 1;
    const min = Math.min(...Object.values(counts));
    return this.rng.pick(QUIRK_KEYS.filter((k) => counts[k] === min));
  }

  /** Çocuk çoğunlukla bir ebeveyninin huyunu alır. */
  inheritQuirk(child, parents) {
    const options = parents.map((p) => p.quirk).filter((q) => QUIRKS[q]);
    child.quirk = options.length && this.rng.next() < 0.7 ? this.rng.pick(options) : this.leastCommonQuirk(child);
  }

  // ---------------------------------------------------------------------------
  // Düğün kutlaması ve ortak ev
  // ---------------------------------------------------------------------------

  onMarried({ a, b }) {
    if (this.state.social.party) this.endParty(); // süren kutlama varsa önce o biter (anıları yazılır)
    const now = this.state.totalMinutes;
    const venue = this.world.getCompleted('fountain')[0] ?? null;
    const plaza = this.world.landmarks.plaza;
    const point = venue ? venue.center : { x: plaza.centerX * 16 + 8, y: plaza.centerY * 16 + 8 };
    const free = (c) => c && !c.away && !c.isSleeping && !c.role;
    const friends = this.state.characters
      .filter((c) => c !== a && c !== b && free(c) && c.visible)
      .map((c) => ({ c, score: Math.max(getFriendship(this.state, a, c), getFriendship(this.state, b, c)) }))
      .filter((f) => f.score >= WEDDING_PARTY.guestScore)
      .sort((x, y) => y.score - x.score)
      .slice(0, WEDDING_PARTY.guests)
      .map((f) => f.c);
    const party = {
      venueId: venue?.id ?? null,
      x: point.x,
      y: point.y,
      coupleIds: [a.id, b.id],
      guestIds: friends.map((c) => c.id),
      attended: [],
      names: `${a.name} ile ${b.name}`,
      startedAt: now,
      until: now + WEDDING_PARTY.minutes,
    };
    this.state.social.party = party;
    this.state.stats.weddingParties = (this.state.stats.weddingParties ?? 0) + 1;
    for (const c of friends) if (c.visible) c.showBubble('laugh', 2.4);
    const ids = [...party.coupleIds, ...party.guestIds].filter((id) => free(this.world.getCharacter(id)));
    this.events.emit('social:partyStarted', { party, ids, a, b, guests: friends });
    // Düğün haberi: çift ve davetliler bilir, gerisi kulaktan kulağa duyar
    this.createNews('wedding', `${a.name} ile ${b.name} evlendi`, `${a.name} ile ${genitive(b.name)} düğününü`, 'ring', [a, b, ...friends], {
      [a.id]: `${b.name} ile düğünlerini`,
      [b.id]: `${a.name} ile düğünlerini`,
    });
  }

  /** Şu an kutlama sürüyor mu ve bu sakin davetli mi? */
  partyFor(c) {
    const party = this.state.social.party;
    if (!party || this.state.totalMinutes >= party.until) return null;
    return party.coupleIds.includes(c.id) || party.guestIds.includes(c.id) ? party : null;
  }

  endParty() {
    const party = this.state.social.party;
    this.state.social.party = null;
    if (!party) return;
    const [a, b] = party.coupleIds.map((id) => this.world.getCharacter(id));
    if (!a || !b) return;
    for (const id of party.attended ?? []) {
      const c = this.world.getCharacter(id);
      if (!c || party.coupleIds.includes(id)) continue;
      addMemory(this.state, c, `${a.name} ile ${genitive(b.name)} düğününde konfeti attı`, 'ring', { kind: 'party' });
    }
    for (const [c, o] of [[a, b], [b, a]]) addMemory(this.state, c, `Meydanda dostlarıyla ${o.name} ile düğünlerini kutladı`, 'ring', { kind: 'wedding' });
    this.events.emit('social:partyEnded', { party, attended: party.attended?.length ?? 0 });
  }

  onHomeFreed(home, a, b) {
    if (!home || this.world.getResidents(home).length > 0) return;
    this.state.stats.homesFreed = (this.state.stats.homesFreed ?? 0) + 1;
    this.events.emit('social:homeFreed', { home, a, b });
  }

  // ---------------------------------------------------------------------------
  // Dedikodu
  // ---------------------------------------------------------------------------

  onExpedition(members, route, finds) {
    if (!members?.length) return;
    const leader = members[0];
    const find = FIND_STORIES.find(([key]) => finds.includes(key));
    const tail = find ? `${route} Seferi'nden getirdiği ${find[1]}` : `${route} Seferi'nden ganimetle dönüşünü`;
    const story = `${genitive(leader.name)} ${tail}`;
    const findName = find ? (find[0] === 'inscription' ? 'kadim bir yazıt' : EXOTIC_ITEMS[find[0]]?.name ?? 'ganimet') : null;
    const text = `${route} Seferi döndü${findName ? `; ${findName} getirdiler` : ''}`;
    this.createNews('expedition', text, story, 'map', members, Object.fromEntries(members.map((c) => [c.id, find ? `${route} Seferi'nden getirdikleri ${find[1]}` : `${route} Seferi'nden ganimetle dönüşlerini`])));
  }

  onReconciled(a, b) {
    const day = this.state.time.day;
    if (this.state.social.reconcileNewsDay === day) return; // günde bir barışma haberi yeter
    this.state.social.reconcileNewsDay = day;
    this.createNews('reconcile', `${a.name} ile ${b.name} barıştı`, `${a.name} ile ${genitive(b.name)} barıştığını`, 'handshake', [a, b], {
      [a.id]: `${b.name} ile barıştığını`,
      [b.id]: `${a.name} ile barıştığını`,
    });
  }

  /**
   * Yeni bir haber: kahramanları bilir; en çok GOSSIP.maxItems haber dolaşır (en eskisi düşer). selfStories: haberi
   * kahramanın kendisi anlatınca kullanılan cümle ({ id: "ustalıkla yaptığı … eserini" } -> "… kendi ağzından duydu").
   */
  createNews(kind, text, story, icon, knowers, selfStories = {}) {
    const { day, hour } = this.state.time;
    const social = this.state.social;
    const news = {
      id: social.nextNewsId++,
      kind,
      text,
      story,
      icon,
      day,
      hour,
      at: this.state.totalMinutes,
      heardBy: [...new Set(knowers.filter((c) => c && this.state.characters.includes(c)).map((c) => c.id))], // (28.3) vefat edenler / ayrılanlar haberi duymaz
      selfStories,
      spread: false,
    };
    for (const id of Object.keys(news.selfStories)) if (!this.state.characters.some((c) => c.id === Number(id))) delete news.selfStories[id];
    social.gossip.push(news);
    if (social.gossip.length > GOSSIP.maxItems) social.gossip.splice(0, social.gossip.length - GOSSIP.maxItems);
    this.events.emit('gossip:created', { news });
    return news;
  }

  expireNews() {
    const now = this.state.totalMinutes;
    const social = this.state.social;
    social.gossip = social.gossip.filter((n) => now - (n.at ?? (n.day - 1) * 1440 + n.hour * 60) < GOSSIP.maxAgeDays * 1440);
  }

  /** Anlatanın bildiği, dinleyenin duymadığı en yeni haber (yoksa null). */
  newsToShare(teller, listener) {
    const list = this.state.social.gossip;
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n.heardBy.includes(teller.id) && !n.heardBy.includes(listener.id)) return n;
    }
    return null;
  }

  /** Haberi aktarır: dinleyenin Yaşam Günlüğü'ne not düşer, ikisinin başında fısıltı balonu. Dönüş: aktarıldı mı. */
  share(teller, listener) {
    const news = this.newsToShare(teller, listener) ?? this.newsToShare(listener, teller);
    if (!news) return false;
    const [from, to] = news.heardBy.includes(teller.id) ? [teller, listener] : [listener, teller];
    news.heardBy.push(to.id);
    const { day, hour } = this.state.time;
    to.lastNews = { id: news.id, text: news.text, story: news.story, icon: news.icon, from: from.name, fromId: from.id, day, hour };
    const own = news.selfStories?.[from.id];
    const note = own ? `${ablative(from.name)}, ${own} kendi ağzından dinledi` : `${ablative(from.name)}, ${news.story} duydu`;
    addMemory(this.state, to, note, 'whisper', { kind: 'gossip', fond: false });
    const notes = to.memories.filter((m) => m.kind === 'gossip');
    for (const old of notes.slice(0, Math.max(0, notes.length - GOSSIP.memoryKeep))) to.memories.splice(to.memories.indexOf(old), 1);
    if (from.visible) from.showBubble('whisper', 2.4);
    if (to.visible) to.showBubble(news.kind === 'wedding' ? 'heart' : 'whisper', 2.4);
    this.state.stats.gossipHeard = (this.state.stats.gossipHeard ?? 0) + 1;
    this.events.emit('gossip:shared', { teller: from, listener: to, news });
    const people = this.state.characters.filter((c) => !c.role).length;
    if (!news.spread && people > 2 && news.heardBy.length >= Math.ceil(people * GOSSIP.spreadShare)) {
      news.spread = true;
      this.events.emit('gossip:spread', { news });
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Her adım
  // ---------------------------------------------------------------------------

  update(tick) {
    const minutes = tick.gameMinutes;
    if (minutes <= 0) return;
    const now = this.state.totalMinutes;
    const party = this.state.social.party;
    if (party && now >= party.until) this.endParty();
    if (this.state.events.festival.active) {
      for (const c of this.world.characters) if (c.task?.activity === 'festival' && c.task.phase === 'perform') this.festivalGoers.add(c.id);
    }

    for (const c of this.world.characters) {
      const task = c.task;
      if (!task) continue;
      if (task.phase === 'travel') {
        if (task.activity === 'petAnimal') this.holdPet(c, task, now);
        continue;
      }
      if (task.phase !== 'perform') continue;
      switch (task.activity) {
        case 'weddingParty':
          this.celebrate(c, minutes);
          break;
        case 'homeDinner':
          this.dine(c, task, minutes);
          break;
        case 'music':
          this.playMusic(c, task, minutes);
          break;
        case 'petAnimal':
          this.petAnimal(c, task);
          break;
        case 'readBench':
        case 'readLibrary':
          if (!task.counted) {
            task.counted = true;
            this.state.stats.booksRead = (this.state.stats.booksRead ?? 0) + 1;
          }
          break;
        default:
          break;
      }
      if (task.dateWithId !== undefined && task.dateWithId !== null) this.date(c, task, minutes, tick.hour);
    }
    this.spreadGossip(minutes, now);
  }

  celebrate(c, minutes) {
    const party = this.state.social.party;
    c.needs.fun = clamp(c.needs.fun + WEDDING_PARTY.funPerMinute * minutes, 0, 100);
    if (!party) return;
    party.attended ??= [];
    if (!party.attended.includes(c.id)) party.attended.push(c.id);
  }

  /** Randevudaki çift yan yanayken: fazladan ilişki puanı ve keyif; bankta yan yana oturanlar da aşık olabilir. */
  date(c, task, minutes, hour) {
    const other = this.world.getCharacter(task.dateWithId);
    if (!other || other.task?.dateWithId !== c.id || other.task.phase !== 'perform') return;
    if (Math.hypot(c.x - other.x, c.y - other.y) > DATING.nearPixels && c.insideBuildingId === null) return;
    c.needs.fun = clamp(c.needs.fun + DATING.funPerMinute * minutes, 0, 100);
    c.needs.social = clamp(c.needs.social + DATING.socialPerMinute * minutes, 0, 100);
    if (!task.met) {
      task.met = true;
      if (c.id < other.id) {
        this.state.stats.dates = (this.state.stats.dates ?? 0) + 1;
        this.events.emit('social:date', { a: c, b: other, activity: task.activity });
        const text = DATE_MEMORIES[task.activity] ?? ((name) => `${name} ile ilk randevusuna çıktı`);
        for (const [x, y] of [[c, other], [other, c]]) {
          if (!x.memories?.some((m) => m.kind === 'date' && m.text.includes(y.name))) addMemory(this.state, x, text(y.name), 'love', { kind: 'date', whoId: y.id });
        }
      }
    }
    if (c.id > other.id) return; // çift başına bir kez
    this.relationships.add(c, other, DATING.bonusRate * minutes);
    const bench = task.activity === 'bench';
    if (bench) {
      // Bank sohbet grubu değildir: aşk ve düğün olasılığı burada denenir
      const group = { activity: 'bench', buildingId: task.buildingId, kind: 'date' };
      this.relationships.tryRomance(c, other, group, minutes);
      if (hour >= 17 || hour < 2) this.relationships.tryMarriage(c, other, group, minutes);
      for (const [x, y] of [[c, other], [other, c]]) {
        const who = arePartners(x, y) ? `${x.married ? 'Eşi' : 'Sevgilisi'} ${y.name}` : y.name;
        x.activityLabel = `${who} ile bankta yan yana oturuyor`;
        if (!x.bubble && this.rng.next() < 0.03 * minutes) x.showBubble(arePartners(x, y) ? 'love' : 'heart', 2);
      }
    }
  }

  /** Evli çift evde birlikte yemek yer: birbirinin keyfini ve sosyalliğini doldurur, Mutlu Yuva'yla uyanır. */
  dine(c, task, minutes) {
    const other = partnerOf(this.state, c);
    const together = other && other.task?.activity === 'homeDinner' && other.task.phase === 'perform' && other.insideBuildingId !== null && other.insideBuildingId === c.insideBuildingId;
    if (!together) return;
    c.needs.fun = clamp(c.needs.fun + HOME_DINNER.funPerMinute * minutes, 0, 100);
    c.needs.social = clamp(c.needs.social + HOME_DINNER.socialPerMinute * minutes, 0, 100);
    c.activityLabel = ACTIVITIES.homeDinner.partnerLabel.replace('{partner}', other.name);
    c.buffs.cozyNight = true;
    if (task.together) return;
    task.together = true;
    if (c.id < other.id) {
      this.state.stats.familyDinners = (this.state.stats.familyDinners ?? 0) + 1;
      this.events.emit('social:familyDinner', { a: c, b: other });
    }
    if (!c.memories?.some((m) => m.kind === 'home')) addMemory(this.state, c, `Eşi ${other.name} ile evlerinde ilk akşam yemeğini yedi`, 'heart', { kind: 'home' });
  }

  /** Müzisyen çalarken çevresindeki en çok QUIRK_RULES.listeners sakinin keyfi hızla dolar. */
  playMusic(c, task, minutes) {
    const r2 = QUIRK_RULES.listenRadius * QUIRK_RULES.listenRadius;
    if (!task.counted) {
      task.counted = true;
      this.state.stats.serenades = (this.state.stats.serenades ?? 0) + 1;
      this.events.emit('social:serenade', { character: c });
    }
    c.needs.fun = clamp(c.needs.fun + QUIRK_RULES.musicianFunPerMinute * minutes, 0, 100);
    const listeners = this.world.characters
      .filter((o) => o !== c && o.visible && !o.away && !o.isSleeping && (o.x - c.x) ** 2 + (o.y - c.y) ** 2 <= r2)
      .sort((x, y) => (x.x - c.x) ** 2 + (x.y - c.y) ** 2 - ((y.x - c.x) ** 2 + (y.y - c.y) ** 2))
      .slice(0, QUIRK_RULES.listeners);
    task.listeners = listeners.length;
    for (const o of listeners) {
      o.needs.fun = clamp(o.needs.fun + QUIRK_RULES.listenFunPerMinute * minutes, 0, 100);
      if (!o.bubble && this.rng.next() < 0.05 * minutes) o.showBubble(this.rng.next() < 0.5 ? 'melody' : 'note', 2);
    }
  }

  /** Hayvansever yürürken kedi / köpek onu bekler (AnimalSystem heldUntil'e bakar). */
  holdPet(c, task, now) {
    const pet = this.state.animals.find((a) => a.id === task.petId);
    if (!pet) return;
    pet.heldBy = c.id;
    pet.heldUntil = now + QUIRK_RULES.petHoldMinutes;
  }

  /** Varınca hayvanın başını okşar (bir kez): keyif, kalp ve mırlama; hayvan gitmişse yalnızca biraz keyif. */
  petAnimal(c, task) {
    if (task.petted) return;
    task.petted = true;
    const pet = this.state.animals.find((a) => a.id === task.petId);
    if (pet) {
      pet.heldUntil = null;
      pet.heldBy = null;
    }
    if (!pet || !pet.visible || Math.hypot(pet.x - c.x, pet.y - c.y) > 30) {
      c.needs.fun = clamp(c.needs.fun + 2, 0, 100);
      return;
    }
    c.needs.fun = clamp(c.needs.fun + QUIRK_RULES.petFun, 0, 100);
    c.faceToward(pet.x, pet.y);
    pet.facing = c.x < pet.x ? 'left' : 'right';
    pet.showHeart();
    c.showBubble('heart', 2);
    c.lastPetAt = this.state.totalMinutes;
    this.state.stats.petted = (this.state.stats.petted ?? 0) + 1;
    this.state.stats.petCuddles = (this.state.stats.petCuddles ?? 0) + 1;
    this.events.emit('pet:petted', { animal: pet, character: c });
    this.events.emit('pet:purred', { animal: pet, character: c });
  }

  /** Sohbet edenler ve yolda selamlaşanlar haberleri birbirine aktarır. */
  spreadGossip(minutes, now) {
    const hasNews = this.state.social.gossip.length > 0;
    const grouped = new Set();
    for (const group of this.relationships.groups) {
      if (group.kind === 'work') continue;
      for (const m of group.members) grouped.add(m.id);
      if (!hasNews) continue;
      const members = group.members;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          if (this.rng.next() < GOSSIP.chatChance * minutes) this.share(members[i], members[j]);
        }
      }
    }
    // Yolda karşılaşıp selamlaşma
    const r2 = GOSSIP.greetRadius * GOSSIP.greetRadius;
    const walkers = this.world.characters.filter((c) => c.visible && !c.away && !grouped.has(c.id) && c.task?.phase === 'travel');
    for (let i = 0; i < walkers.length; i++) {
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i];
        const b = walkers[j];
        if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 > r2) continue;
        const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
        if ((this.greetCooldowns.get(key) ?? -1) > now) continue;
        if (this.rng.next() >= GOSSIP.greetChance * minutes) continue;
        this.greetCooldowns.set(key, now + GOSSIP.greetCooldown);
        this.greet(a, b);
      }
    }
    if (this.greetCooldowns.size > 400) for (const [k, t] of this.greetCooldowns) if (t <= now) this.greetCooldowns.delete(k);
  }

  greet(a, b) {
    for (const c of [a, b]) c.needs.social = clamp(c.needs.social + 2, 0, 100);
    if (this.share(a, b)) return true;
    if (!a.bubble && getFriendship(this.state, a, b) >= 10) a.showBubble('chat', 1.6);
    this.events.emit('social:greeted', { a, b });
    return false;
  }
}

/** Arayüz için: huyun adı ve açıklaması (yoksa null). */
export function quirkInfo(c) {
  return QUIRKS[c?.quirk] ?? null;
}
