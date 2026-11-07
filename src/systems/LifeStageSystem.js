// (25. aşama, 25.1) Yaşam evreleri ve yaş döngüsü: Çocuk -> Genç -> Yetişkin -> Kıdemli Bilge.
//
//   Yaşlanma    : her gün dönümünde (00:00, 'time:newDay') kasabalı her sakinin yaşı bir gün ilerler (ageInDays); bir oyun yılı
//                 (16 gün) dolunca bir yaş büyür. Genç (18-20) 21 yaşında Yetişkin, Yetişkin 70 yaşında Kıdemli Bilge olur.
//                 Çocuğun büyümesi FamilySystem'in işidir: büyüyen çocuk Genç evresinden başlar.
//   Emeklilik   : Kıdemli Bilge ağır işlere (inşaat, toplama, üretim, itfaiye, baskın savunması, keşif seferi) gitmez; ÖLMEZ ve
//                 oyundan silinmez. Kasabada çalışabilir en az 3 çekirdek sakin (genç / yetişkin) güvencesi korunur: daha azsa
//                 en dinç bilgeler gönüllü usta olarak çalışmaya devam eder (retired = false).
//   Bilge Nasihati: emekli bilge boş zamanında yakınındaki uyanık yetişkin ve gençlerin keyfini ve sosyalliğini yavaşça doldurur.
//   Refah       : her emekli bilge kasaba refahına +1 (en çok +3; TownStatus.townHappinessBonus).
//
// Bu sistem KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 27) ve onu yalnızca süs için (nasihat baloncuğu, günlük
// cümlesi) tüketir. Yaş ve evre geçişleri rastgelelik kullanmaz: oyunun ana üretecinin sırası hiç değişmez.
// Yayınladığı olaylar: 'lifeStage:changed' { character, from, to }, 'lifeStage:retired' { character, retired }, 'toast'.
import { ELDER, ELDER_LINES, ELDER_ADVICE, LIFE_STAGES } from '../data/lifeStages.js';
import { ACTIVITIES } from '../data/activities.js';
import { retirementPlan, isResident } from './LifeStages.js';
import { addMemory } from './MemorySystem.js';
import { clamp } from '../utils/math.js';
import { TEMPERAMENT } from '../data/temperament.js';

const ADVICE_BUBBLE_PER_MINUTE = 0.02; // nasihat veren bilgenin başında ara sıra bir söz (metin baloncuğu)

export class LifeStageSystem {
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
      on('time:newDay', () => this.ageEveryone()),
      on('time:hour', () => this.refreshRetirement()),
      on('population:changed', () => this.refreshRetirement()),
      on('population:left', () => this.refreshRetirement()),
      on('family:grownUp', ({ character }) => {
        this.events.emit('lifeStage:changed', { character, from: 'child', to: character.lifeStage });
        this.refreshRetirement();
      }),
    ];
    this.refreshRetirement({ silent: true }); // yüklemede / yeni oyunda ilk eşitleme günlüğe yazılmaz
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Gün dönümü: herkes bir gün yaşlanır; evre değişenler kutlanır. */
  ageEveryone() {
    const changes = [];
    for (const c of this.state.characters) {
      if (!isResident(c)) continue;
      const change = c.ageOneDay();
      if (change) changes.push({ character: c, ...change });
    }
    for (const change of changes) this.onStageChanged(change);
    if (changes.length) this.refreshRetirement();
  }

  /** Evre geçişi: olay, bildirim, Kasaba Günlüğü (JournalSystem) ve sakinin anısı. */
  onStageChanged({ character: c, from, to }) {
    // Kutlama cümlesi olaydan önce seçilir: Kasaba Günlüğü (olayı dinler) ve bildirim aynı cümleyi yazar
    const line = to === 'elder' ? this.rng.pick(ELDER_LINES).replace('{name}', c.name) : null;
    if (line) this.state.lifeStages.lastElderLine = line;
    this.events.emit('lifeStage:changed', { character: c, from, to });
    if (to === 'adult') this.state.lifeStages.adults += 1;
    if (to === 'elder') {
      this.state.lifeStages.elders += 1;
      this.events.emit('toast', { text: line, tone: 'success', icon: LIFE_STAGES.elder.icon });
      addMemory(this.state, c, `${c.age} yaşında Kıdemli Bilge unvanını aldı; artık gençlere yol gösteriyor`, 'book', { kind: 'elder' });
      // (25.2) Söz ikon balonu yerine metin katmanında: ikon balonu davranış sisteminin balon zarını (ana üreteç) etkilerdi
      c.speech = { text: 'Yılların birikimi artık gençlerin!', at: -1, duration: 3.5 };
      c.celebrate();
      // Emekliliği sessizce başlar; çekirdek sakin kuralı yüzünden çalışmaya devam ediyorsa günlüğe gönüllü olarak düşer
      c.retired = retirementPlan(this.state).retired.has(c.id);
      if (!c.retired) this.events.emit('lifeStage:retired', { character: c, retired: false });
    }
  }

  /** Emekli / gönüllü bilgeleri çekirdek sakin kuralına göre yeniden hesaplar. */
  refreshRetirement({ silent = false } = {}) {
    const { retired } = retirementPlan(this.state);
    for (const c of this.state.characters) {
      const next = retired.has(c.id);
      if (c.retired === next) continue;
      c.retired = next;
      if (!silent && c.lifeStage === 'elder') this.events.emit('lifeStage:retired', { character: c, retired: next });
    }
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    this.applyAdvice(tick.gameMinutes);
  }

  /** Bilge Nasihati: boş zamanını geçiren emekli bilgenin yakınındaki uyanık yetişkin ve gençlerin morali yavaşça artar. */
  applyAdvice(minutes) {
    const sages = this.world.characters.filter((c) => c.retired && c.lifeStage === 'elder' && c.visible && !c.away && this.isAtLeisure(c));
    if (sages.length === 0) return;
    const radiusSq = ELDER.advice.radius * ELDER.advice.radius;
    let listeners = 0;
    for (const c of this.world.characters) {
      if (c.isChild || c.lifeStage === 'elder' || c.role || !c.visible || c.isSleeping) continue;
      if (!sages.some((s) => (s.x - c.x) ** 2 + (s.y - c.y) ** 2 <= radiusSq)) continue;
      // (25.3) Bilge Düşünür nasihatten iki kat moral alır
      const k = c.quirk === 'philosopher' ? TEMPERAMENT.sageAdvice : 1;
      c.needs.fun = clamp(c.needs.fun + ELDER.advice.fun * k * minutes, 0, 100);
      c.needs.social = clamp(c.needs.social + ELDER.advice.social * k * minutes, 0, 100);
      listeners += 1;
    }
    if (listeners === 0) return;
    this.state.lifeStages.adviceMinutes += minutes;
    // (25.2) Nasihat sözleri metin katmanında (ikon balonu ana üretecin balon zarını değiştirirdi)
    for (const s of sages) {
      if (!s.speech && this.rng.next() < ADVICE_BUBBLE_PER_MINUTE * minutes) s.speech = { text: this.rng.pick(ELDER_ADVICE), at: -1, duration: 3.4 };
    }
  }

  isAtLeisure(c) {
    const kind = c.task ? ACTIVITIES[c.task.activity]?.kind : null;
    return c.task?.phase === 'perform' && (kind === 'leisure' || kind === 'social');
  }
}
