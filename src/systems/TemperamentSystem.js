// (25. aşama, 25.3) Mizaç kalıtımı, kişilik gelişimi ve yeni nesil huyların canlı etkileri.
//
//   Gelişim   : kasabanın Altın Çağı başladıktan sonra (state.goldenAge.since) büyüyen çocuk Genç olurken ve Genç Yetişkin
//               olurken mizacını yeniden biçimlendirir: ebeveynlerinden birinin huyu (Aile mirası) ya da kasabada en az görülen huy (Özgün gelişim; yeni nesil
//               dört huy dahil sekiz aday). Çıraklığını %50+ ilerlemeyle bitirip yetişkin olan genç olasılıkla ustasının huyunu
//               (Usta etkisi) ya da mesleğin doğasındaki huyu (Mesleğin doğası: Demirci -> Zanaatkâr Ruhu) alır.
//               Kaynak c.quirkOrigin = { kind, fromId, fromName, day } olarak kayda girer.
//   Şenlik Neşesi aurası: boş zamanını geçiren / şenlikte dans eden Şenlik Neşesi'nin yanındaki uyanık sakinlerin keyfi dolar.
//   Sözler    : yeni nesil huyların mizacına uygun sözler (metin baloncuğu, c.speech).
//   Girişimci : ihracat sözleşmesi tamamlanınca sevinir.
// Öteki etkiler ilgili sistemlerdedir (hepsi huy denetimiyle; yeni huylu sakin yokken hiçbir şeyi değiştirmez): BehaviorSystem
// (Zanaatkâr şevki, Şenlik dansı), Brain (Pazar'a gitme), PurseSystem (malzeme, tutumluluk, pazarlık payı), RefinerySystem
// (testi), ApprenticeshipSystem (çırak işini saklama), LifeStageSystem (Bilge nasihati), PetitionSystem (yeni dilekçeler).
// Bu sistem KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 29).
// Yayınladığı olaylar: 'temperament:developed' { character, quirk, previous, origin }.
import { QUIRKS, ALL_QUIRK_KEYS } from '../data/social.js';
import { DEVELOPMENT, PROFESSION_QUIRKS, TEMPERAMENT, TEMPERAMENT_LINES } from '../data/temperament.js';
import { PROFESSIONS } from '../data/apprenticeship.js';
import { ACTIVITIES } from '../data/activities.js';
import { addMemory } from './MemorySystem.js';
import { ablative } from '../utils/turkish.js';
import { clamp } from '../utils/math.js';
import { developmentOpen, GENERATION_PETITIONS } from './Temperament.js';

export class TemperamentSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng yalnızca bu sistemin üreteci
   */
  constructor(game, world, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('family:grownUp', ({ character }) => this.onGrownUp(character)),
      // Genç -> Yetişkin: önce (ApprenticeshipSystem'in mezuniyetiyle) usta etkisi; o gün mizaç değişmediyse aile / özgün gelişim
      on('lifeStage:changed', ({ character, from, to }) => from === 'youth' && to === 'adult' && this.onAdult(character)),
      on('apprentice:graduated', (e) => this.onGraduated(e)),
      on('trade:contractDone', () => this.onContract()),
      on('petition:opened', ({ petition }) => {
        if (GENERATION_PETITIONS.includes(petition.kind)) this.state.temperament.petitions[petition.kind] = (this.state.temperament.petitions[petition.kind] ?? 0) + 1;
      }),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Huyların kasabadaki sayısı (sekizi). */
  counts(except = null) {
    const out = Object.fromEntries(ALL_QUIRK_KEYS.map((k) => [k, 0]));
    for (const c of this.state.characters) if (c !== except && out[c.quirk] !== undefined) out[c.quirk] += 1;
    return out;
  }

  /** Özgün gelişim: kasabada en az görülen huy (sekizi aday; eşitlikte bu katmanın üreteci). */
  originalQuirk(c) {
    const counts = this.counts(c);
    const min = Math.min(...Object.values(counts));
    return this.rng.pick(ALL_QUIRK_KEYS.filter((k) => counts[k] === min));
  }

  /** Genç Yetişkin oldu: usta etkisi bugün işlemediyse mizaç aile etkisiyle ya da özgün olarak olgunlaşır (Altın Çağ'da). */
  onAdult(c) {
    if (!c || c.role || !developmentOpen(this.state)) return;
    if (c.quirkOrigin && c.quirkOrigin.day === this.state.time.day && (c.quirkOrigin.kind === 'mentor' || c.quirkOrigin.kind === 'craft')) return;
    this.onGrownUp(c);
  }

  /** Çocuk Genç oldu (ya da Genç olgunlaştı): aile etkisi ya da özgün gelişim (Altın Çağ'da). */
  onGrownUp(c) {
    if (!c || c.role || !developmentOpen(this.state)) return;
    const parents = c.parentIds.map((id) => this.world.getCharacter(id)).filter((p) => p && QUIRKS[p.quirk]);
    if (parents.length && this.rng.next() < DEVELOPMENT.family) {
      const parent = this.rng.pick(parents);
      this.apply(c, parent.quirk, { kind: 'family', fromId: parent.id, fromName: parent.name });
      return;
    }
    this.apply(c, this.originalQuirk(c), { kind: 'self' });
  }

  /** Çırak yetişkin oldu: usta etkisi (Altın Çağ'da, %50+ ilerlemeyle). */
  onGraduated({ character: c, profession, progress, masterId }) {
    if (!c || !developmentOpen(this.state) || !(progress >= DEVELOPMENT.mentorFrom)) return;
    if (this.rng.next() >= DEVELOPMENT.mentor) return;
    const master = masterId !== null && masterId !== undefined ? this.world.getCharacter(masterId) : null;
    if (master && QUIRKS[master.quirk] && this.rng.next() < DEVELOPMENT.mentorOwnQuirk) {
      this.apply(c, master.quirk, { kind: 'mentor', fromId: master.id, fromName: master.name });
      return;
    }
    const quirk = PROFESSION_QUIRKS[profession];
    if (quirk) this.apply(c, quirk, { kind: 'craft', fromName: PROFESSIONS[profession]?.name ?? null });
  }

  apply(c, quirk, origin) {
    const previous = c.quirk;
    c.quirk = quirk;
    c.quirkOrigin = { kind: origin.kind, fromId: origin.fromId ?? null, fromName: origin.fromName ?? null, day: this.state.time.day }; // kayıttakiyle aynı sıra
    const t = this.state.temperament;
    t.developed += 1;
    t[origin.kind] += 1;
    const name = QUIRKS[quirk].name;
    const text =
      origin.kind === 'family'
        ? `${origin.fromName} gibi ${name} bir mizaçla büyüdü`
        : origin.kind === 'mentor'
          ? `Ustası ${ablative(origin.fromName)} ${name} mizacını kaptı`
          : origin.kind === 'craft'
            ? `${origin.fromName} çıraklığında ${name} mizacı gelişti`
            : `Kendine özgü bir mizaçla büyüdü: ${name}`;
    addMemory(this.state, c, text, QUIRKS[quirk].icon, { kind: 'temperament' });
    this.events.emit('temperament:developed', { character: c, quirk, previous, origin: c.quirkOrigin });
  }

  // ---------------------------------------------------------------------------
  // Canlı etkiler
  // ---------------------------------------------------------------------------

  onContract() {
    for (const c of this.state.characters) {
      if (c.quirk !== 'entrepreneur' || c.away) continue;
      c.needs.fun = clamp(c.needs.fun + TEMPERAMENT.contractFun, 0, 100);
      if (c.visible && !c.speech) this.say(c, 'Bu işten kâr çıkar!');
    }
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    const minutes = tick.gameMinutes;
    let festive = null;
    for (const c of this.world.characters) {
      if (!QUIRKS[c.quirk]?.generation || !c.visible || c.away || c.isSleeping) continue;
      const kind = c.task?.phase === 'perform' ? ACTIVITIES[c.task.activity]?.kind : null;
      if (c.quirk === 'festive' && (kind === 'leisure' || kind === 'social' || kind === 'festival')) (festive ??= []).push(c);
      if (!c.speech && (kind === 'leisure' || kind === 'social' || kind === 'work' || kind === 'festival') && this.rng.next() < TEMPERAMENT.speechPerMinute * minutes) {
        this.say(c, this.rng.pick(TEMPERAMENT_LINES[c.quirk]));
      }
    }
    if (festive) this.applyFestiveAura(festive, minutes);
  }

  /** Şenlik Neşesi aurası: yanındaki uyanık sakinlerin keyfi dolar (her dinleyici bir kez). */
  applyFestiveAura(sources, minutes) {
    const { radius, perMinute } = TEMPERAMENT.festiveAura;
    const r2 = radius * radius;
    let n = 0;
    for (const o of this.world.characters) {
      if (o.role || !o.visible || o.isSleeping || sources.includes(o)) continue;
      if (!sources.some((s) => (s.x - o.x) ** 2 + (s.y - o.y) ** 2 <= r2)) continue;
      o.needs.fun = clamp(o.needs.fun + perMinute * minutes, 0, 100);
      n++;
    }
    if (n) this.state.temperament.auraMinutes += minutes;
  }

  say(c, text) {
    c.speech = { text, at: -1, duration: TEMPERAMENT.speechSeconds };
  }
}
