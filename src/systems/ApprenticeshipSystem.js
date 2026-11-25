// (25. aşama, 25.2) Usta-Çırak sistemi ve mesleki eğitim.
//
//   Yazılma    : oyuncu bir Genç'i kartından ya da zanaat yapısının panelinden çırak yazar; ya da yapının "Çırak Kapısı"nı
//                açar ve boştaki (bir yere sabitlenmemiş) gençler her sabah 07:00'de oraya kendiliğinden yazılır. Çırağın verisi
//                c.apprenticeship = { masterId, profession, buildingId, progress 0-100, since, crafted }.
//   Mesai      : ustası o yapıda çalışırken (ya da oraya yürürken) çırak mesai saatinde onun yanındaki taburesine gider, izler ve
//                getir-götür işlerine bakar (etkinlik 'apprentice'); ilerlemesi dakikada ~%0,028 artar. Ustası orada değilse, kasabada
//                gıda kıtlığı varsa ya da çekirdek iş gücü azsa çırak her zamanki işine koşar (iş gücü kilitlenmez).
//   Gururlu Usta: yanında çırağı çalışan ustanın keyfi bir süre yavaş düşer (buffs.proudMaster); çırak %50'yi geçince ustanın
//                tezgâhına +%5 verim.
//   Çırak İşi  : %50'den sonra mesai sonunda olasılıkla hammadde tüketmeden çantaya küçük bir yan ürün; birikince Pazar'da satılır.
//   Mezuniyet  : Genç 21 yaşında Yetişkin olunca %100'de Yetkin Usta, %60'ta Kıdemli Kalfa olarak başlar (meslek deneyimi).
//   (27.2) Darboğazlar: Şifacı ustası ot toplarken (gatherHerbs, o kulübenin işi) fiilen mesaidedir, çırak kulübede otları ayıklar.
//                Zanaat yapısı boşta beklerken (building.idle: sipariş bitti / raflar dolu) kayıtlı usta kasabadaysa çırak taburesinde
//                "Tezgâh Pratiği" yapar (APPRENTICE.practiceRate hızla; usta gururu ve verim katkısı yok). Hasarlı / yanan yapıya çırak
//                yazılmaz; ders sürerken yapı hasar alır / yanarsa ya da kasaba gıda / iş gücü eşiğinin altına düşerse çırak işine döner.
//   Sözler     : usta ve çırak ara sıra konuşur ("Öğreniyorum ustam!"); metin baloncuğu ayrı bir katmandır (c.speech): ikon
//                balonuna (c.bubble) dokunmaz, böylece davranış sisteminin balon zarı ve ana üreteç hiç etkilenmez.
//
// Bu sistem KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 28). Hiçbir çırak yokken hiçbir şeyi değiştirmez.
// Yayınladığı olaylar: 'apprentice:enrolled' { character, master, building }, 'apprentice:released' { character, reason },
//   'apprentice:graduated' { character, profession, title }, 'apprentice:crafted' { character, item }, 'apprentice:proud' { master, apprentice }.
import { PROFESSIONS, APPRENTICE, PROUD_MASTER, APPRENTICE_CRAFT, GRADUATION } from '../data/apprenticeship.js';
import { grandmasterTitle } from './Grandmaster.js';
import { ITEMS } from '../data/citizens.js';
import { WORK_SESSION } from '../data/jobs.js';
import {
  professionFor,
  canApprentice,
  canMaster,
  pickMaster,
  acceptsApprentice,
  safeForApprentice,
  doorOpen,
  townCanSpare,
  graduationFor,
  apprenticesOf,
} from './Apprenticeship.js';
import { addItem, roomFor, takeItem, addCoins } from './Citizens.js';
import { addMemory } from './MemorySystem.js';
import { levelFor } from './SkillSystem.js';
import { clamp } from '../utils/math.js';
import { TEMPERAMENT } from '../data/temperament.js';

export class ApprenticeshipSystem {
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
      on('time:hour', (hour) => this.hourly(hour)),
      on('lifeStage:changed', ({ character, from, to }) => from === 'youth' && to === 'adult' && this.graduate(character)),
      on('work:shiftEnded', ({ character, activity }) => activity === 'apprentice' && this.shiftEnded(character)),
      on('population:left', ({ character } = {}) => character && this.onLeft(character)),
      on('ui:enrollApprentice', ({ characterId, buildingId }) => this.enroll(this.world.getCharacter(characterId), buildingId === undefined ? null : this.world.getBuilding(buildingId), { byPlayer: true })),
      on('ui:releaseApprentice', ({ characterId }) => this.release(this.world.getCharacter(characterId), 'player')),
      on('ui:toggleApprenticeDoor', ({ buildingId }) => this.toggleDoor(this.world.getBuilding(buildingId))),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get apprentices() {
    return this.state.characters.filter((c) => c.apprenticeship);
  }

  // ---------------------------------------------------------------------------
  // Yazılma, ayrılma, kapı
  // ---------------------------------------------------------------------------

  /** Oyuncu ya da sabah kapısı: Genç'i yapıya çırak yazar (yapı verilmezse en deneyimli ustanın yapısı). Başarılıysa true. */
  enroll(c, building = null, { byPlayer = false } = {}) {
    if (!canApprentice(c)) return false;
    const target = building ?? this.bestBuilding();
    if (!target || !acceptsApprentice(this.state, target)) return false;
    const master = pickMaster(this.state, target);
    const prof = professionFor(target.type);
    c.apprenticeship = { masterId: master?.id ?? null, profession: target.type, buildingId: target.id, progress: 0, since: this.state.totalMinutes, crafted: 0 };
    this.state.apprenticeship.enrolled += 1;
    this.events.emit('apprentice:enrolled', { character: c, master, building: target, byPlayer });
    this.events.emit('toast', { text: `${c.name}, ${master ? `${master.name} ustanın yanında ` : ''}${prof.name} çıraklığına başladı!`, tone: 'success', icon: 'hammer' });
    addMemory(this.state, c, `${master ? `${master.name} ustanın yanında ` : ''}${prof.name} çıraklığına başladı`, 'hammer', { kind: 'apprentice' });
    return true;
  }

  /** En iyi kontenjanı boş zanaat yapısı: açık kapılılar önce, sonra ustasının deneyimi en yüksek olan (eşitlikte küçük kimlik). */
  bestBuilding(onlyOpen = false) {
    const options = this.world.buildings.filter((b) => acceptsApprentice(this.state, b) && (!onlyOpen || doorOpen(this.state, b)));
    let best = null;
    for (const b of options) {
      const master = pickMaster(this.state, b);
      const score = (doorOpen(this.state, b) ? 1e6 : 0) + (master ? master.skills?.[PROFESSIONS[b.type].skill] ?? 0 : -1);
      if (!best || score > best.score || (score === best.score && b.id < best.b.id)) best = { b, score };
    }
    return best?.b ?? null;
  }

  release(c, reason = 'player') {
    if (!c?.apprenticeship) return false;
    c.apprenticeship = null;
    if (c.task?.activity === 'apprentice') c.task.elapsed = Infinity; // görevi bir sonraki adımda bitsin
    this.events.emit('apprentice:released', { character: c, reason });
    return true;
  }

  toggleDoor(building) {
    if (!building || !professionFor(building.type)) return false;
    const open = this.state.apprenticeship.open;
    const i = open.indexOf(building.id);
    if (i >= 0) open.splice(i, 1);
    else open.push(building.id);
    this.events.emit('apprentice:doorChanged', { building, open: i < 0 });
    return i < 0;
  }

  onLeft(c) {
    if (c.apprenticeship) c.apprenticeship = null;
    for (const a of apprenticesOf(this.state, c)) a.apprenticeship.masterId = null;
  }

  // ---------------------------------------------------------------------------
  // Saatlik bakım: kopuk usta / yapı, sabah kapısı
  // ---------------------------------------------------------------------------

  hourly(hour) {
    const list = this.apprentices;
    for (const c of list) {
      const a = c.apprenticeship;
      const building = this.world.getBuilding(a.buildingId);
      if (!building || !professionFor(building.type) || c.lifeStage !== 'youth' || c.emigrating) {
        this.release(c, building ? 'grown' : 'building');
        continue;
      }
      const master = a.masterId !== null ? this.world.getCharacter(a.masterId) : null;
      // Usta emekli olduysa, köyü terk ettiyse ya da yapıda daha deneyimli biri çalışıyorsa yapının ustası devralır
      const best = pickMaster(this.state, building);
      if (!master || master.retired || master.emigrating || (best && best !== master && best.workplaceId === building.id)) a.masterId = best?.id ?? null;
    }
    if (hour === APPRENTICE.enrollHour && this.state.apprenticeship.open.length) {
      for (const c of this.state.characters.filter((x) => canApprentice(x) && (x.workplaceId === null || x.workplaceId === undefined)).sort((x, y) => x.id - y.id)) {
        const b = this.bestBuilding(true);
        if (!b) break;
        this.enroll(c, b);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Mesai: plan, öğrenme, ustanın gururu ve verimi
  // ---------------------------------------------------------------------------

  /**
   * Şu an çırağa yol gösteren usta: kendi ustası yapıda çalışıyorsa (ya da oraya yürüyorsa) o; değilse yapıda o an çalışan en
   * deneyimli yetişkin ("bugün kalfa Mert gösteriyor"); kimse yoksa null. Kayıtlı usta değişmez.
   */
  masterAtWork(c) {
    const a = c.apprenticeship;
    if (!a) return null;
    const own = a.masterId !== null ? this.world.getCharacter(a.masterId) : null;
    if (own && own.task?.workBuildingId === a.buildingId && !own.away) return own;
    // (27.2) Şifacı ustası kulübenin otlarını topluyorsa (gatherHerbs, workBuildingId = kulübe) fiilen şifacılık mesaisindedir
    if (own && own.task?.activity === 'gatherHerbs' && own.task.workBuildingId === a.buildingId && !own.away) return own;
    const skill = PROFESSIONS[a.profession].skill;
    let best = null;
    for (const o of this.world.characters) {
      if (o === c || o.task?.workBuildingId !== a.buildingId || !canMaster(o)) continue;
      if (!best || (o.skills?.[skill] ?? 0) > (best.skills?.[skill] ?? 0)) best = o;
    }
    return best;
  }

  /**
   * (27.2) Tezgâh Pratiği: yapı boşta bekliyorsa (building.idle) ve çırağın kayıtlı ustası kasabadaysa (seferde / köyü terk etmiyor,
   * emekli değil) o usta "yanındaymış gibi" sayılır. Yoksa null. Normal (boşta olmayan) yapıda hiçbir şeyi değiştirmez.
   */
  practiceMaster(c) {
    const a = c.apprenticeship;
    if (!a || a.masterId === null) return null;
    const building = this.world.getBuilding(a.buildingId);
    if (!building || building.idle !== true || !safeForApprentice(building)) return null;
    const own = this.world.getCharacter(a.masterId);
    return own && canMaster(own) ? own : null;
  }

  /** Brain çağırır (mesai saatinde, mola zarı atıldıktan sonra): çırağın planı ya da null (o zaman her zamanki işine gider). */
  planFor(c) {
    const a = c.apprenticeship;
    if (!a || !townCanSpare(this.state)) return null;
    const building = this.world.getBuilding(a.buildingId);
    if (!building || !safeForApprentice(building)) return null; // (27.2) hasarlı / yanan yapıda ders yok
    const atWork = this.masterAtWork(c);
    const master = atWork ?? this.practiceMaster(c);
    if (!master) return null;
    const spots = this.world.getSpots(building);
    if (spots.length === 0) return null;
    const origin = { x: c.tileX, y: c.tileY };
    const spot = spots.reduce((best, s) => (Math.hypot(s.x - origin.x, s.y - origin.y) < Math.hypot(best.x - origin.x, best.y - origin.y) ? s : best));
    const fp = atWork ? master.task?.finalPoint : null;
    return {
      activity: 'apprentice',
      buildingId: building.id,
      spot,
      finalPoint: fp ? { x: fp.x + APPRENTICE.standOffset.x, y: fp.y + APPRENTICE.standOffset.y } : undefined,
      faceTarget: (atWork && master.task?.finalPoint) || building.center,
      duration: this.rng.int(WORK_SESSION[0], WORK_SESSION[1]),
    };
  }

  /** BehaviorSystem.performWork çağırır: çırağın mesai dakikaları. false: görev biter. */
  learn(c, task, minutes) {
    const a = c.apprenticeship;
    if (!a) return false;
    const building = this.world.getBuilding(a.buildingId);
    if (!building || !safeForApprentice(building)) return false; // (27.2) yapı hasar aldı / yanıyor: çırak kalkar
    if (!townCanSpare(this.state)) return false; // (27.2) mesai ortasında gıda / iş gücü kritik: çırak temel işine döner
    c.needs.energy = clamp(c.needs.energy - 0.02 * APPRENTICE.fatigue * minutes, 0, 100);
    const atWork = this.masterAtWork(c);
    const master = atWork ?? this.practiceMaster(c);
    if (!master) return false; // ustası tezgâhtan kalktı: çırak da kalkar (bir sonraki planda işine döner)
    if (task.phase !== 'perform') return true;
    const rate = atWork ? 1 : APPRENTICE.practiceRate;
    a.progress = Math.min(100, a.progress + APPRENTICE.perMinute * rate * minutes);
    this.state.apprenticeship.minutes += minutes;
    const prof = PROFESSIONS[a.profession];
    if (!atWork) {
      // (27.2) Tezgâh Pratiği: usta tezgâhta değil; gurur / verim yok, sözler yalnızca çıraktan
      c.faceToward(building.center.x, building.center.y);
      c.activityLabel = `Tezgâh Pratiği: ${prof.name.toLocaleLowerCase('tr')} (%${Math.floor(a.progress)})`;
      if (c.visible && this.rng.next() < APPRENTICE.speechPerMinute * minutes) this.say(c, this.rng.pick(prof.lines.apprentice));
      return true;
    }
    c.faceToward(master.x, master.y);
    c.activityLabel = `${master.name} ustanın yanında ${prof.name.toLocaleLowerCase('tr')} öğreniyor (%${Math.floor(a.progress)})`;
    // Gururlu Usta
    const now = this.state.totalMinutes;
    if (!((master.buffs.proudMaster ?? -1) > now)) {
      if (!master.buffs.proudSince) {
        this.state.apprenticeship.masters += 1;
        master.buffs.proudSince = now;
        this.events.emit('apprentice:proud', { master, apprentice: c });
      }
    }
    master.buffs.proudMaster = now + PROUD_MASTER.hours * 60;
    // Usta ve çırak ara sıra konuşur (kendi üreteci; ikon balonuna dokunmaz)
    if (c.visible && this.rng.next() < APPRENTICE.speechPerMinute * minutes) {
      const fromMaster = this.rng.next() < 0.5;
      const who = fromMaster && master.visible ? master : c;
      this.say(who, this.rng.pick(prof.lines[who === master ? 'master' : 'apprentice']));
    }
    return true;
  }

  /**
   * (32.4) Darülfünun telafisi: dersteki öğrenci çırağın ders dakikası, ustası O AN tezgâhtaysa (ya da Tezgâh Pratiği koşulu varsa,
   * practiceRate ile) çıraklık sayılır ("ustanın notları"). Yalnızca dersin gerçekten götürdüğü çıraklık telafi edilir; zar yok.
   * Kazanılan ilerleme döner. UniversitySystem.learn çağırır; öğrenci değilse hiç çağrılmaz.
   */
  lectureCredit(c, minutes, scale = 1) {
    const a = c?.apprenticeship;
    if (!a || minutes <= 0 || !townCanSpare(this.state)) return 0;
    const building = this.world.getBuilding(a.buildingId);
    if (!building || !safeForApprentice(building)) return 0;
    const k = this.masterAtWork(c) ? 1 : this.practiceMaster(c) ? APPRENTICE.practiceRate : 0;
    const before = a.progress;
    a.progress = Math.min(100, a.progress + APPRENTICE.perMinute * k * minutes * scale);
    return a.progress - before;
  }

  say(c, text) {
    c.speech = { text, at: -1, duration: APPRENTICE.speechSeconds }; // ilk çizimde gerçek zamanla başlar
  }

  /** Ustanın çalışmasına çırağın getir-götür katkısı (çarpan; çırak yoksa tam olarak 1). */
  masterBoost(master, task) {
    if (!task.workBuildingId || !((master.buffs.proudMaster ?? -1) > this.state.totalMinutes)) return 1;
    for (const c of this.state.characters) {
      const a = c.apprenticeship;
      if (a && a.buildingId === task.workBuildingId && a.progress >= PROUD_MASTER.workBoostFrom && c.task?.activity === 'apprentice' && c.task.phase === 'perform' && this.masterAtWork(c) === master) return PROUD_MASTER.workBoost;
    }
    return 1;
  }

  /** Çırağın mesaisi bitti: çırak işi ve satış. */
  shiftEnded(c) {
    const a = c.apprenticeship;
    if (!a || a.progress < APPRENTICE_CRAFT.craftFrom) return;
    const item = PROFESSIONS[a.profession].item;
    if (roomFor(c, item) > 0 && this.rng.next() < APPRENTICE_CRAFT.craftChance) {
      addItem(c, item, 1);
      a.crafted += 1;
      this.state.apprenticeship.crafted += 1;
      if (a.crafted === 1) addMemory(this.state, c, `İlk ${ITEMS[item].name.toLocaleLowerCase('tr')} işini kendi elleriyle çıkardı`, 'sparkle', { kind: 'apprentice' });
      this.events.emit('apprentice:crafted', { character: c, item });
      this.say(c, `Bak ustam, ${ITEMS[item].name.toLocaleLowerCase('tr')}!`);
    }
    // Pazar Yeri varsa biriken çırak işleri satılır
    const crafts = (c.inventory ?? []).filter((s) => ITEMS[s.kind]?.craft && s.kind !== 'crispCookie');
    // (25.3) Zanaatkâr Ruhu çırak işlerinden birkaçını satmaz, çantasında saklar
    const keep = c.quirk === 'craftsman' ? TEMPERAMENT.craftKeep : 0;
    const count = crafts.reduce((n, s) => n + s.qty, 0) - keep;
    if (count >= APPRENTICE_CRAFT.sellAt && this.world.getCompleted('market').length > 0) {
      let coins = 0;
      let left = count;
      for (const s of [...crafts]) {
        const take = Math.min(left, s.qty);
        if (take <= 0) break;
        coins += takeItem(c, s.kind, take) * ITEMS[s.kind].value;
        left -= take;
      }
      addCoins(c, coins);
      this.state.apprenticeship.sold += count;
      this.state.apprenticeship.coins += coins;
    }
  }

  // ---------------------------------------------------------------------------
  // Mezuniyet
  // ---------------------------------------------------------------------------

  graduate(c) {
    const a = c.apprenticeship;
    if (!a) return;
    const prof = PROFESSIONS[a.profession];
    const { xp, title } = graduationFor(a.progress);
    const before = levelFor(c.skills[prof.skill] ?? 0);
    c.skills[prof.skill] = Math.max(c.skills[prof.skill] ?? 0, xp);
    const after = levelFor(c.skills[prof.skill]);
    c.apprenticeship = null;
    if (title) this.state.apprenticeship.graduated += 1;
    // (28.2) Başusta: yalnızca çıraklığı %100 ile bitirenler (Yetkin Usta); kalıcıdır, başka yoldan verilmez
    const grandmaster = a.progress >= GRADUATION.master && !c.isGrandmaster;
    if (grandmaster) {
      c.isGrandmaster = true;
      c.grandmasterProfession = a.profession;
      c.grandmasterBatches = 0;
      this.state.apprenticeship.grandmasters = (this.state.apprenticeship.grandmasters ?? 0) + 1;
    }
    if (after.level > before.level) this.events.emit('skill:levelUp', { character: c, skill: prof.skill, level: after });
    this.events.emit('apprentice:graduated', { character: c, profession: a.profession, title, progress: a.progress, masterId: a.masterId, grandmaster });
    if (grandmaster) {
      this.events.emit('toast', { text: `${c.name} çıraklığını %100 ile tamamladı: artık ${grandmasterTitle(c)}! Usta işi eser şansı iki katına çıktı, her 5. üretimde hammadde harcamaz.`, tone: 'success', icon: 'star' });
      addMemory(this.state, c, `Çıraklığını kusursuz tamamlayıp ${grandmasterTitle(c)} unvanını aldı`, 'star', { kind: 'apprentice' });
      this.events.emit('apprentice:grandmaster', { character: c, profession: a.profession });
    } else if (title) {
      this.events.emit('toast', { text: `${c.name} çıraklığını tamamladı: artık ${title} ${prof.master}!`, tone: 'success', icon: 'star' });
      addMemory(this.state, c, `Çıraklığını tamamlayıp ${title} ${prof.master} olarak yetişkinliğe adım attı`, 'star', { kind: 'apprentice' });
    }
  }
}
