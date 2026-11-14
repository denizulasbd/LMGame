// (23. aşama) Yönetilebilir krizler. Sayılar src/data/crisis.js'te, saf hesaplar src/systems/Crisis.js'te.
//
//   Yangın     : 8. günden sonra (yazın, ateşli yapılarda, çevrede Su Kuyusu yoksa daha olası) her gün 14:00'te bir yapı
//                tutuşabilir ('crisis:fireStarted'). Yapı fireProgress 0->100 yanar; 100'e varırsa söner ama yapı HASARLI
//                olur ('crisis:burnedDown'; haritadan silinmez, onarılana kadar çalışmaz). Yakındaki sağlam yetişkinler (ve
//                Kasaba Bekçileri) işi bırakıp en yakın Su Kuyusu'na (yoksa nehir kıyısına) koşar, kovayı doldurup yangına
//                boşaltır (Brain -> planFirefight; 'crisis:bucketFilled' / 'crisis:bucketThrown'). Yeterli kova (3-4) atılırsa
//                yangın hasarsız söner ('crisis:fireOut'; Güven +2, "el birliğiyle" anısı).
//   Seferberlik: (28.1) oyuncu 30 altına "Acil Seferberlik" ilan edebilir ('ui:emergencyMuster'): yangın SÖNMEZ, ama o yangına
//                4 yerine 8 kişi koşar ve kovayı 2 kat hızlı taşır; kova atan herkes yangın bitince Enerji -40 / Keyif -20
//                (Aşırı Yorgunluk) kaybeder ('crisis:musterFatigue').
//   Tamir      : (28.1) panelden anında "Tamir Et" pahalı bir lükstür: maliyetin %50'si + 25 altın ('ui:repairBuilding');
//                ustalar hasardan 2 saat sonra kaynak yetiyorsa maliyetin %20'sine onarım projesini kendiliğinden başlatır.
//   Gözcü Kulesi: saatlik Güven katkısı, 1-2 Kasaba Bekçisi (nöbet = work 'patrol'), baskın 2 gün önceden haber verilir.
//   Haydutlar  : 10. günden sonra 8-10 günde bir "haydut izi" uyarısı ('crisis:raidWarning'); süre dolunca ya da oyuncu karar
//                verince üç yol: A) bekçilerle püskürt (kayıp yok, Güven +6, ganimet, ufak yaralanma olasılığı), B) haraç öde
//                (altın ya da erzak, Güven -2) ya da C) hazırlıksız yakalan (stoğun en çok %15'i gider, 1 yapı hasarlı, Güven
//                -8). Karar verilmezse savunma yetiyorsa A, yetmiyorsa C uygulanır ('crisis:raidResolved').
//   Yaralanma  : yangın / baskında yaralanan sakin ölmez; "hafif yaralı" olur (isInjured; yürüme ve çalışma %20 yavaş), boş
//                zamanında Şifacı Kulübesi'ne gider ('crisis:treated'), şifalı ot demler ya da evinde dinlenir; 1,5 günde
//                kendiliğinden geçer.
//
// Bu sistem KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 26): oyunun ana üretecine dokunmaz. Doğal krizler
// 8. günden (haydut 10.) önce, Huzurlu ayarda ve kayıt yüklendikten sonraki ilk 24 saatte çıkmaz; testler fonksiyonları
// doğrudan çağırabilir (startFire, warnRaid, resolveRaid, injure).
import { CRISIS, FIRE, GUARD, BANDIT, INJURY, REPAIR, CRISIS_DIFFICULTY } from '../data/crisis.js';
import { FATAL } from '../data/lifeStages.js';
import {
  emptyCrisis,
  crisisRate,
  naturalCrisisAllowed,
  fireChance,
  bucketsNeeded,
  towerOf,
  defenseStatus,
  tributeStatus,
  stolenAmount,
  instantRepairCost,
  fightersFor,
  damageableNow,
  ablePeople,
  usable,
  crisisActive,
} from './Crisis.js';
import { addMemory } from './MemorySystem.js';

export class CrisisSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy: import('./EconomySystem.js').EconomySystem, trust: import('./TrustSystem.js').TrustSystem,
   *   construction: import('./ConstructionSystem.js').ConstructionSystem, social?: import('./SocialSystem.js').SocialSystem }} services
   * @param {import('../utils/random.js').Random} rng
   * @param {{ attract?: boolean }} options
   */
  constructor(game, world, { economy, trust, construction, social = null }, rng, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.trust = trust;
    this.construction = construction;
    this.social = social;
    this.rng = rng;
    this.attract = attract;
    this.state.crisis ??= emptyCrisis();
    // Kayıt yüklendikten (sahne kurulduktan) sonraki ilk CRISIS.graceHours saatte, aktif bir kriz yoksa doğal kriz çıkmaz.
    // Bu süre kayda girmez: kayıt -> yükleme gidiş-dönüşünde durum kaymaz.
    this.graceUntil = crisisActive(this.state) ? null : this.state.totalMinutes + CRISIS.graceHours * 60;
    this.helpers = new Map(); // yanan yapı kimliği -> kova atan sakin kimlikleri (kaydedilmez)
    this.assignCache = { at: -1, key: '', map: new Map() };
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('time:hour', () => this.hourly()),
      on('ui:emergencyMuster', ({ buildingId }) => this.muster(this.world.getBuilding(buildingId))),
      on('ui:repairBuilding', ({ buildingId }) => this.repairNow(this.world.getBuilding(buildingId))),
      on('ui:raidChoice', ({ choice }) => this.resolveRaid(choice)),
      on('ui:setCrisisDifficulty', ({ difficulty }) => this.setDifficulty(difficulty)),
      on('crisis:bucketFilled', ({ character }) => this.onBucketFilled(character)),
      on('crisis:bucketThrown', ({ character, task }) => this.onBucket(character, this.world.getBuilding(task?.fireId))),
      on('crisis:treated', ({ character, building }) => this.treat(character, building)),
      on('citizen:herbTea', ({ character }) => this.onHerbTea(character)),
      on('building:mended', ({ building }) => this.onMended(building)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get crisis() {
    return this.state.crisis;
  }

  note(kind, text) {
    const { day, hour } = this.state.time;
    this.crisis.log.push({ day, hour, kind, text });
    if (this.crisis.log.length > CRISIS.logSize) this.crisis.log.splice(0, this.crisis.log.length - CRISIS.logSize);
  }

  // ---------------------------------------------------------------------------
  // Her adım: yangının yayılması, yaralanmanın iyileşmesi
  // ---------------------------------------------------------------------------

  update(tick) {
    const minutes = tick.gameMinutes;
    if (!(minutes > 0)) return;
    for (const b of [...this.state.buildings]) {
      if (!b.isBurning) continue;
      b.fireProgress = Math.min(100, b.fireProgress + (100 * minutes) / FIRE.burnMinutes);
      if (b.fireProgress >= 100) this.burnDown(b);
    }
    for (const c of this.state.characters) {
      if (!c.isInjured) continue;
      const sleepingHome = c.isSleeping && c.insideBuildingId === c.homeId;
      c.injuryTimer -= minutes * (sleepingHome ? INJURY.sleepRecovery : 1);
      if (c.injuryTimer <= 0) this.heal(c, 'natural');
    }
  }

  // ---------------------------------------------------------------------------
  // Saatlik: doğal yangın yoklaması, haydut takvimi, Gözcü Kulesi, otomatik tamir
  // ---------------------------------------------------------------------------

  hourly() {
    const s = this.state;
    const now = s.totalMinutes;
    const hour = s.time.hour;
    this.guardHour();
    const grace = this.graceUntil !== null && now <= this.graceUntil;
    if (!this.attract) {
      if (!grace && hour === FIRE.checkHour && naturalCrisisAllowed(s, 'fire') && !s.buildings.some((b) => b.isBurning)) this.rollFire();
      if (!grace && naturalCrisisAllowed(s, 'bandit')) {
        const c = this.crisis;
        if (!c.raid) {
          if (c.nextRaidWarnAt === null) c.nextRaidWarnAt = this.firstWarningAt(now);
          if (now >= c.nextRaidWarnAt) this.warnRaid();
        }
      }
      if (this.crisis.raid && now >= this.crisis.raid.arriveAt) this.raidArrives();
    }
    this.autoRepair();
  }

  /** İlk haydut izi: 10. günün 10:00'u (daha ileri bir günden başlayan kayıtlarda şimdiden bir aralık sonra). */
  firstWarningAt(now) {
    const first = (CRISIS.banditStartDay - 1) * 1440 + 10 * 60;
    return now > first ? now + this.nextInterval() : first;
  }

  nextInterval() {
    const [a, b] = BANDIT.intervalDays;
    return Math.max(1440, Math.round((this.rng.int(a, b) * 1440) / Math.max(0.5, crisisRate(this.state))));
  }

  /** Doğal yangın yoklaması: her sağlam yapı için tür / mevsim / kuyu olasılığıyla (en çok bir yangın). */
  rollFire() {
    const candidates = this.state.buildings.filter((b) => fireChance(this.state, b) > 0).sort((a, b) => a.id - b.id);
    for (const b of candidates) {
      if (this.rng.next() < fireChance(this.state, b)) {
        this.startFire(b, { natural: true });
        return b;
      }
    }
    return null;
  }

  /** Gözcü Kulesi: nöbet yeri sayısı ve Yönetim Güveni'ne saatlik katkı. */
  guardHour() {
    const s = this.state;
    for (const b of s.buildings) {
      if (b.type !== 'guardTower') continue;
      b.guardSlots = ablePeople(s).length >= GUARD.twoGuardsAdults ? 2 : 1;
    }
    const tower = towerOf(s);
    if (!tower) return;
    this.trust.adjust(GUARD.trustPerHour + tower.workerIds.size * GUARD.trustPerGuard);
  }

  // ---------------------------------------------------------------------------
  // Yangın
  // ---------------------------------------------------------------------------

  /** Yapıda yangın başlatır. Dönüş: yapı ya da null (sağlam değilse). */
  startFire(building, { natural = false } = {}) {
    if (!building || !building.functional || building.damaged || building.isBurning) return null;
    const s = this.state;
    building.isBurning = true;
    building.fireProgress = 0;
    building.fireWater = 0;
    building.emergencyMuster = false;
    building.damageKind = 'fire';
    this.helpers.set(building.id, new Set());
    this.crisis.fires += 1;
    this.crisis.lastFireDay = s.time.day;
    s.stats.fires = (s.stats.fires ?? 0) + 1;
    this.world.invalidateSpots?.(building);
    const responders = this.responders(building);
    this.note('fire', `${building.name} tutuştu`);
    this.events.emit('crisis:fireStarted', { building, natural, responders: responders.map((c) => c.id) });
    this.events.emit('toast', { text: `🔥 ${building.name} yangın çıktı! Sakinler kovalarla koşuyor; panelden 30 altına "Acil Seferberlik" ilan edebilirsin.`, tone: 'warn', icon: 'fire' });
    return building;
  }

  /**
   * Yanan yapıya koşacak sakinler: kuledeki bekçiler önde, sonra uzaklığa göre en yakın sağlam yetişkinler (exclude: başka bir
   * yangına ya da bu yangına zaten bağlı olanlar sayılmaz).
   */
  responders(building, exclude = new Set()) {
    const tower = towerOf(this.state);
    const guards = new Set(tower ? [...tower.workerIds] : []);
    const cx = building.center.x;
    const cy = building.center.y;
    return ablePeople(this.state)
      .filter((c) => !c.isSleeping && !exclude.has(c.id))
      .map((c) => ({ c, d: Math.hypot(c.x - cx, c.y - cy) - (guards.has(c.id) ? 160 : 0) }))
      .sort((a, b) => a.d - b.d || a.c.id - b.c.id)
      .slice(0, fightersFor(building))
      .map((x) => x.c);
  }

  /** Bu sakin şu an hangi yanan yapıya koşmalı (yoksa null)? Brain her karar anında sorar (dakikada bir önbelleğe alınır). */
  fireAssignment(c) {
    const burning = this.state.buildings.filter((b) => b.isBurning).sort((a, b) => b.fireProgress - a.fireProgress || a.id - b.id);
    if (burning.length === 0) return null;
    const at = Math.floor(this.state.totalMinutes);
    const key = burning.map((b) => `${b.id}${b.emergencyMuster ? 'm' : ''}`).join(',');
    const cache = this.assignCache;
    if (cache.at !== at || cache.key !== key) {
      cache.at = at;
      cache.key = key;
      cache.map = new Map();
      const taken = new Set();
      const able = ablePeople(this.state);
      for (const b of burning) {
        // Sadakat: bu yangına zaten koşanlar (görevi bu yangınsa ya da dolu kovayla yolda olanlar) görevde kalır. Yalnızca uzaklığa
        // bakılsaydı kovayı dolduran (artık yangından uzak) sakin sıralamada düşer, kovasını atamadan bırakırdı.
        const committed = able.filter((p) => !taken.has(p.id) && (p.task?.fireId === b.id || (p.waterBucket && b === burning[0])));
        for (const p of committed) {
          taken.add(p.id);
          cache.map.set(p.id, b.id);
        }
        const slots = Math.max(0, fightersFor(b) - committed.length);
        for (const r of this.responders(b, taken).slice(0, slots)) {
          taken.add(r.id);
          cache.map.set(r.id, b.id);
        }
      }
    }
    const id = cache.map.get(c.id);
    return id ? this.world.getBuilding(id) : null;
  }

  /** Kova doldurulacak yer: yanan yapıya en yakın Su Kuyusu; yoksa en yakın nehir kıyısı. Dönüş: { spot, building?, kind } ya da null. */
  waterSource(fire, c) {
    const wells = usable(this.state, 'well')
      .map((w) => ({ w, d: Math.hypot(w.center.x - fire.center.x, w.center.y - fire.center.y) }))
      .sort((a, b) => a.d - b.d || a.w.id - b.w.id);
    const origin = { x: c.tileX, y: c.tileY };
    for (const { w } of wells) {
      const spots = this.world.getSpots(w);
      if (!spots.length) continue;
      const spot = spots.reduce((best, p) => (Math.hypot(p.x - c.tileX, p.y - c.tileY) < Math.hypot(best.x - c.tileX, best.y - c.tileY) ? p : best));
      if (this.world.findPath(origin, spot)) return { kind: 'well', building: w, spot };
    }
    const fx = Math.floor(fire.center.x / 16);
    const fy = Math.floor(fire.center.y / 16);
    const banks = (this.world.riverbankSpots ?? [])
      .filter((p) => Math.hypot(p.x - fx, p.y - fy) <= FIRE.bankRadius)
      .sort((a, b) => Math.hypot(a.x - fx, a.y - fy) - Math.hypot(b.x - fx, b.y - fy));
    for (const spot of banks.slice(0, 6)) if (this.world.findPath(origin, spot)) return { kind: 'river', building: null, spot };
    return null;
  }

  onBucketFilled(c) {
    if (!c) return;
    c.waterBucket = true;
    if (c.visible) c.showBubble('bucket', 2);
  }

  /** Sakin kovayı yangına boşalttı: yangın geriler, yeterli kovada söner. */
  onBucket(c, building) {
    if (!c) return;
    c.waterBucket = false;
    if (!building?.isBurning) return;
    building.fireWater += 1;
    building.fireProgress = Math.max(0, building.fireProgress - FIRE.bucketSetback);
    (this.helpers.get(building.id) ?? this.helpers.set(building.id, new Set()).get(building.id)).add(c.id);
    if (c.visible) c.showBubble('bucket', 1.8);
    this.events.emit('crisis:bucket', { character: c, building, water: building.fireWater });
    if (building.fireWater >= bucketsNeeded(this.state, building)) {
      this.extinguish(building, { byPlayer: false });
      return;
    }
    if (building.fireProgress > FIRE.injuryAfter) {
      // (28.3) tek zar: yaralanma aralığının hemen yanında çok küçük bir ölümcül kaza aralığı (üreteç akışı değişmez)
      const roll = this.rng.next();
      if (roll < FIRE.injuryChance) this.injure(c, 'fire');
      else if (roll < FIRE.injuryChance + FATAL.fire) this.fatalAccident(c, 'fire');
    }
  }

  /** Acil Seferberlik bedeli ve yapılabilirliği: { ok, reason, cost }. */
  musterStatus(building) {
    const cost = { gold: FIRE.muster.gold };
    if (!building?.isBurning) return { ok: false, reason: 'Yapı yanmıyor', cost };
    if (building.emergencyMuster) return { ok: false, reason: 'Seferberlik zaten ilan edildi', cost };
    if (!this.economy.canAfford(cost)) return { ok: false, reason: `Yetersiz kaynak: ${this.economy.missing(cost).join(', ')}`, cost };
    return { ok: true, reason: null, cost };
  }

  /**
   * (28.1) "Acil Seferberlik": 30 altına yangına 8 kişi (en yakın uyanık, sağlam yetişkinler) çağrılır ve kova 2 kat hızlı taşınır.
   * Yangın SÖNMEZ; söndürmek yine kovalara (sönmeden çabuk) bağlıdır. Dönüş: { ok, reason, cost }.
   */
  muster(building) {
    const st = this.musterStatus(building);
    if (!st.ok) {
      if (building) this.events.emit('toast', { text: `Seferberlik ilan edilemedi: ${st.reason}`, tone: 'warn', icon: 'fire' });
      return st;
    }
    this.economy.spend(st.cost);
    building.emergencyMuster = true;
    const responders = this.responders(building);
    this.note('muster', `${building.name} için acil seferberlik ilan edildi`);
    this.events.emit('crisis:musterCalled', { building, responders: responders.map((c) => c.id) });
    this.events.emit('toast', { text: `📯 ${building.name} için Acil Seferberlik! ${responders.length} kişi koşuyor (-${FIRE.muster.gold} altın); kova atanlar yangın sonrası bitkin düşecek`, tone: 'warn', icon: 'bucket' });
    return st;
  }

  /** (28.1) Seferberlik yangını bitince kova atan herkes Aşırı Yorgunluk yaşar: Enerji -40, Keyif -20. */
  musterFatigue(building, helperIds) {
    if (!building?.emergencyMuster) return [];
    const tired = [];
    for (const id of helperIds) {
      const c = this.world.getCharacter(id);
      if (!c) continue;
      c.needs.energy = Math.max(0, c.needs.energy - FIRE.muster.energy);
      c.needs.fun = Math.max(0, c.needs.fun - FIRE.muster.fun);
      if (c.visible) c.showBubble('sweat', 2.2);
      tired.push(c.id);
    }
    this.events.emit('crisis:musterFatigue', { building, helpers: tired });
    return tired;
  }

  /** Yangını hasarsız söndürür (sakinler kovalarla). Dönüş: true. */
  extinguish(building, { byPlayer = false } = {}) {
    if (!building?.isBurning) return false;
    const s = this.state;
    const helperIds = [...(this.helpers.get(building.id) ?? [])];
    this.helpers.delete(building.id);
    const progress = building.fireProgress;
    const mustered = building.emergencyMuster;
    building.isBurning = false;
    building.fireProgress = 0;
    building.fireWater = 0;
    building.damageKind = building.damaged ? building.damageKind : null;
    this.crisis.extinguished += 1;
    s.stats.firesPutOut = (s.stats.firesPutOut ?? 0) + 1;
    this.trust.adjust(FIRE.trustOut, 'fireOut');
    const helpers = helperIds.map((id) => this.world.getCharacter(id)).filter(Boolean);
    for (const c of helpers) {
      addMemory(s, c, 'Yangını el birliğiyle söndürdük', 'fire', { kind: 'town' });
      c.needs.fun = Math.min(100, c.needs.fun + 4);
      if (c.visible) c.showBubble('sparkle', 2.2);
    }
    if (mustered) this.musterFatigue({ emergencyMuster: true, name: building.name }, helperIds);
    building.emergencyMuster = false;
    this.note('fireOut', `${building.name} yangını söndürüldü`);
    this.events.emit('crisis:fireOut', { building, byPlayer, helpers: helpers.map((c) => c.id), progress });
    this.events.emit('toast', { text: `${building.name} yangını söndürüldü${byPlayer ? '' : ': yangını el birliğiyle söndürdük'} (Güven +${FIRE.trustOut})`, tone: 'success', icon: 'bucket' });
    return true;
  }

  /** Söndürülemeyen yangın: yapı yanıp biter ama haritadan silinmez, HASARLI olur. */
  burnDown(building) {
    if (!building?.isBurning) return false;
    const s = this.state;
    const helperIds = [...(this.helpers.get(building.id) ?? [])];
    this.helpers.delete(building.id);
    building.isBurning = false;
    building.fireProgress = 0;
    building.fireWater = 0;
    this.musterFatigue(building, helperIds);
    building.emergencyMuster = false;
    this.damage(building, 'fire');
    this.crisis.burned += 1;
    this.trust.adjust(FIRE.trustBurned, 'fireBurned');
    const pool = (helperIds.length ? helperIds.map((id) => this.world.getCharacter(id)) : this.responders(building)).filter(Boolean);
    if (pool.length && this.rng.next() < FIRE.burnedInjuryChance) this.injure(pool[0], 'fire');
    this.note('burned', `${building.name} yanıp hasar gördü`);
    this.events.emit('crisis:burnedDown', { building });
    this.events.emit('toast', { text: `${building.name} yangında hasar gördü! Onarılana kadar çalışmaz: panelden "Tamir Et" de ya da ustaların onarmasını bekle.`, tone: 'warn', icon: 'repair' });
    return true;
  }

  /** Yapıyı hasarlı yapar (silinmez): nedeni kaydedilir, çalışanları işi bırakır. */
  damage(building, kind) {
    building.isDamaged = true;
    building.damageKind = kind;
    building.damagedAt = this.state.totalMinutes;
    this.world.invalidateSpots?.(building);
  }

  // ---------------------------------------------------------------------------
  // Tamir
  // ---------------------------------------------------------------------------

  /** Anında tamirin bedeli ve yapılabilirliği: { ok, reason, cost }. */
  repairStatus(building) {
    if (!building || !building.damaged) return { ok: false, reason: 'Yapı hasarlı değil', cost: {} };
    if (building.isBurning) return { ok: false, reason: 'Önce yangın söndürülmeli', cost: {} };
    const cost = instantRepairCost(building.type);
    if (!this.economy.canAfford(cost)) return { ok: false, reason: `Yetersiz kaynak: ${this.economy.missing(cost).join(', ')}`, cost };
    return { ok: true, reason: null, cost };
  }

  /** "Tamir Et": inşa maliyetinin %50'si + 25 altınla yapıyı anında onarır (28.1: pahalı acil durum lüksü). Dönüş: { ok, reason }. */
  repairNow(building) {
    const st = this.repairStatus(building);
    if (!st.ok) {
      if (building) this.events.emit('toast', { text: `Tamir edilemedi: ${st.reason}`, tone: 'warn', icon: 'repair' });
      return st;
    }
    if (building.project) this.construction.cancelProject(building); // süren onarım projesi iade edilir, yerine anlık tamir
    this.economy.spend(st.cost);
    this.finishRepair(building, true);
    return { ok: true, reason: null, cost: st.cost };
  }

  finishRepair(building, instant) {
    const kind = building.damageKind;
    building.isDamaged = false;
    building.project = null;
    this.world.invalidateSpots?.(building);
    this.events.emit('building:mended', { building, kind, instant });
    this.events.emit('crisis:repaired', { building, kind, instant });
    this.events.emit('toast', { text: `${building.name} ${instant ? 'anında tamir edildi' : 'onarıldı'}, yeniden çalışıyor`, tone: 'success', icon: 'hammer' });
  }

  /** Onarılan her yapı (anında tamir ya da ustaların onarımı) sayaçlara yazılır. */
  onMended(building) {
    this.crisis.repairs += 1;
    this.state.stats.repairs = (this.state.stats.repairs ?? 0) + 1;
    this.note('repair', `${building?.name ?? 'Yapı'} onarıldı`);
  }

  /** Boştaki ustalar: yangın / baskın hasarını, hasardan REPAIR.autoDelayHours saat sonra kaynak yetiyorsa kendiliğinden onarmaya başlar. */
  autoRepair() {
    const s = this.state;
    for (const b of s.buildings) {
      if (!b.damaged || b.isBurning || b.project || (b.damageKind !== 'fire' && b.damageKind !== 'raid')) continue;
      if (Number.isFinite(b.damagedAt) && s.totalMinutes - b.damagedAt < REPAIR.autoDelayHours * 60) continue;
      const check = this.construction.checkProject(b);
      if (check.ok) this.construction.startProject(b);
    }
  }

  // ---------------------------------------------------------------------------
  // Haydut baskını
  // ---------------------------------------------------------------------------

  /** "Ormanda haydut izleri görüldü": baskın Gözcü Kulesi varsa 2, yoksa 1 gün sonra gelir. Dönüş: baskın ya da null. */
  warnRaid() {
    const c = this.crisis;
    if (c.raid) return null;
    const s = this.state;
    const early = Boolean(towerOf(s));
    const days = early ? GUARD.warnDaysWithTower : GUARD.warnDaysWithout;
    const tribute = this.rng.int(BANDIT.tribute.min, BANDIT.tribute.max);
    c.raid = { id: c.nextRaidId++, warnedAt: s.totalMinutes, arriveAt: s.totalMinutes + days * 1440, early, tribute };
    c.nextRaidWarnAt = null;
    this.note('raidWarning', 'Ormanda haydut izleri görüldü');
    this.events.emit('crisis:raidWarning', { raid: c.raid, early });
    this.events.emit('toast', {
      text: `Ormanda haydut izleri görüldü! ${days} gün içinde baskın bekleniyor${early ? ' (Gözcü Kulesi erken haber verdi)' : ''}. Çipe tıkla: püskürt, haraç öde ya da bekle.`,
      tone: 'warn',
      icon: 'bandit',
    });
    return c.raid;
  }

  /** Haydutlar sınıra vardı: karar verilmediyse savunma yetiyorsa püskürtülür, yetmiyorsa hazırlıksız yakalanılır. */
  raidArrives() {
    if (!this.crisis.raid) return null;
    return this.resolveRaid(defenseStatus(this.state).ok ? 'defend' : 'caught', { auto: true });
  }

  /**
   * Baskını çözer. choice: 'defend' (A: bekçilerle püskürt), 'tribute' (B: haraç öde), 'caught' (C: hazırlıksız yakalan).
   * Dönüş: { ok, reason?, choice, ... } — başarısız seçimde (savunma yok, haraç ödenemiyor) baskın sürer.
   */
  resolveRaid(choice, { auto = false } = {}) {
    const c = this.crisis;
    const s = this.state;
    if (!c.raid) return { ok: false, reason: 'Bekleyen baskın yok', choice };
    let result;
    if (choice === 'defend') {
      const def = defenseStatus(s);
      if (!def.ok) {
        this.events.emit('toast', { text: `Savunma kurulamadı: ${def.reason}`, tone: 'warn', icon: 'shield' });
        return { ok: false, reason: def.reason, choice };
      }
      result = this.repel(def);
    } else if (choice === 'tribute') {
      const pay = tributeStatus(s, c.raid.tribute);
      if (!pay.ok) {
        this.events.emit('toast', { text: `Haraç ödenemedi: ${pay.reason}`, tone: 'warn', icon: 'coin' });
        return { ok: false, reason: pay.reason, choice };
      }
      result = this.payTribute(pay);
    } else if (choice === 'caught') {
      result = this.caughtUnprepared();
    } else {
      return { ok: false, reason: 'Bilinmeyen seçim', choice };
    }
    c.raid = null;
    c.raids += 1;
    c.nextRaidWarnAt = s.totalMinutes + this.nextInterval();
    this.note('raid', result.text);
    this.events.emit('crisis:raidResolved', { choice, auto, ...result });
    return { ok: true, choice, auto, ...result };
  }

  /** A) Bekçilerle püskürtme: kayıp yok, Güven +6, ganimet, Haydutlar Kovuldu bonusu, bir savunmacı hafif yaralanabilir. */
  repel(def) {
    const s = this.state;
    const tower = def.tower;
    const guards = tower ? [...tower.workerIds].map((id) => this.world.getCharacter(id)).filter(Boolean) : [];
    const pool = ablePeople(s).sort((a, b) => a.id - b.id);
    const defenders = [...new Set([...guards, ...pool])].slice(0, Math.max(BANDIT.defenders, guards.length));
    const loot = this.rng.int(BANDIT.loot.min, BANDIT.loot.max);
    this.economy.add('gold', loot, 'raid');
    this.trust.adjust(BANDIT.repelTrust, 'raidRepelled');
    s.buffs[BANDIT.buff] = s.totalMinutes + 24 * 60;
    this.crisis.repelled += 1;
    s.stats.raidsRepelled = (s.stats.raidsRepelled ?? 0) + 1;
    let injured = null;
    const chance = tower ? BANDIT.repelInjuryChanceTower : BANDIT.repelInjuryChance;
    const roll = this.rng.next();
    if (defenders.length && roll < chance) {
      injured = this.rng.pick(defenders);
      this.injure(injured, 'raid');
    } else if (defenders.length && roll < chance + FATAL.raid) {
      this.fatalAccident(this.rng.pick(defenders), 'raid'); // (28.3) nadir ölümcül kaza
    }
    for (const d of defenders) {
      addMemory(s, d, 'Haydutları kasabadan kovduk', 'shield', { kind: 'town' });
      if (d.visible) d.showBubble('shield', 2.6);
    }
    this.social?.createNews?.('raid', 'Haydutlar kasabadan kovuldu', 'haydutların kasabadan kovulduğunu', 'shield', defenders, Object.fromEntries(defenders.map((d) => [d.id, 'haydutları kasabadan kovduğunu'])));
    return { text: `Haydutlar bekçilerce püskürtüldü (+${loot} altın ganimet, Güven +${BANDIT.repelTrust})`, defenders: defenders.map((d) => d.id), loot, injured: injured ? injured.id : null, trust: BANDIT.repelTrust };
  }

  /** B) Haraç: önce altın, yetmezse kilerden yiyecek; kimse yaralanmaz, yapı zarar görmez. */
  payTribute(pay) {
    if (pay.gold > 0) this.economy.spend({ gold: pay.gold });
    else this.economy.consumeFood(pay.food);
    this.trust.adjust(BANDIT.tributeTrust, 'raidTribute');
    this.crisis.tributes += 1;
    const what = pay.gold > 0 ? `${pay.gold} altın` : `${pay.food} yiyecek değerinde erzak`;
    return { text: `Haydutlara haraç verildi (${what}); kimse yaralanmadı, Güven ${BANDIT.tributeTrust}`, paidGold: pay.gold, paidFood: pay.food, trust: BANDIT.tributeTrust };
  }

  /** C) Hazırlıksız yakalanma: stoğun en çok %15'i (altın ve yiyecek) gider, bir sınır yapısı hasarlanır, Güven -8. */
  caughtUnprepared() {
    const s = this.state;
    const gold = stolenAmount(s.resources.gold ?? 0);
    const food = stolenAmount(s.resources.food ?? 0);
    if (gold > 0) this.economy.spend({ gold });
    if (food > 0) this.economy.spend({ food });
    const plaza = this.world.landmarks?.plaza;
    const candidates = damageableNow(s)
      .map((b) => ({ b, d: plaza ? Math.hypot(b.tileX - plaza.centerX, b.tileY - plaza.centerY) : 0 }))
      .sort((a, b) => b.d - a.d || a.b.id - b.b.id);
    const target = candidates[0]?.b ?? null;
    if (target) this.damage(target, 'raid');
    this.trust.adjust(BANDIT.caughtTrust, 'raidCaught');
    this.crisis.caught += 1;
    const lost = [gold ? `${gold} altın` : null, food ? `${food} yiyecek` : null].filter(Boolean).join(' ve ');
    return {
      text: `Haydutlar hazırlıksız yakaladı${lost ? `: ${lost} çalındı` : ''}${target ? `, ${target.name} hasar gördü` : ''} (Güven ${BANDIT.caughtTrust})`,
      stolenGold: gold,
      stolenFood: food,
      damagedId: target ? target.id : null,
      trust: BANDIT.caughtTrust,
    };
  }

  // ---------------------------------------------------------------------------
  // Yaralanma ve iyileşme
  // ---------------------------------------------------------------------------

  /** Sakini hafif yaralar (ölüm yoktur). Dönüş: true (yeni yaralandıysa). */
  /** (28.3) Ölümcül kaza: kasabada yeterli sağlam yetişkin varsa (çekirdek iş gücü korunur) sakin anında ölür ('life:fatalAccident' -> LifecycleSystem). */
  fatalAccident(c, cause) {
    if (!c || c.isChild || c.role || ablePeople(this.state).length < FATAL.minAble) return false;
    this.events.emit('life:fatalAccident', { character: c, cause });
    return true;
  }

  injure(c, cause = 'fire') {
    if (!c || c.isInjured || c.isChild) return false;
    c.isInjured = true;
    c.injuryTimer = INJURY.naturalHours * 60;
    this.crisis.injuries += 1;
    if (c.visible) c.showBubble('bandage', 2.6);
    this.events.emit('crisis:injured', { character: c, cause });
    return true;
  }

  /** İyileşme: 'healer' (Şifacı Kulübesi), 'natural' (1,5 günde kendiliğinden). */
  heal(c, how = 'natural') {
    if (!c?.isInjured) return false;
    c.isInjured = false;
    c.injuryTimer = 0;
    this.events.emit('crisis:healed', { character: c, how });
    return true;
  }

  /** Şifacıda yaraları sarıldı: hızla iyileşir, keyfi artar, anı yazılır. */
  treat(c, building) {
    if (!c?.isInjured) return false;
    this.heal(c, 'healer');
    this.crisis.treated += 1;
    c.needs.fun = Math.min(100, c.needs.fun + INJURY.treatedFun);
    addMemory(this.state, c, 'Şifacıda yaraları sarıldı', 'herb', { kind: 'life' });
    this.events.emit('crisis:treatedAt', { character: c, building });
    return true;
  }

  /** Çantadaki şifalı ot demlenince yara çabuk kapanır. */
  onHerbTea(c) {
    if (c?.isInjured) c.injuryTimer = Math.min(c.injuryTimer, (INJURY.naturalHours * 60) / INJURY.herbMultiplier / 4);
  }

  // ---------------------------------------------------------------------------
  // Ayar
  // ---------------------------------------------------------------------------

  setDifficulty(key) {
    const def = CRISIS_DIFFICULTY[key];
    if (!def || this.crisis.difficulty === key) return false;
    this.crisis.difficulty = key;
    if (key === 'huzurlu') {
      // Huzurlu'ya geçince bekleyen baskın tehlikesi geçer (yanan yapılar kendi seyrinde söner)
      this.crisis.raid = null;
      this.crisis.nextRaidWarnAt = null;
    }
    this.events.emit('crisis:difficultyChanged', { difficulty: key });
    this.events.emit('toast', { text: `Tehlike sıklığı: ${def.name}. ${def.description}`, tone: 'info', icon: 'shield' });
    return true;
  }
}
