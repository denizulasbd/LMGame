// Hedefli testler: oyunun kurallarını tarayıcıda, gerçek sistemlerle tek tek dener.
// Kullanım: node tools/sim/tests.mjs   (sunucu: python3 tools/serve.py)
//   10. aşama: yiyecek değeri, seviye kilitleri, eski usul / asıl tarif, tüccar malları, belediye, unvan, yerleşim
//   11. aşama: hastalık ve şifacı, kasaba hayvanları ve sevme, yaban hayatının ürkmesi, karar olayları (zaman aşımı,
//              fırtına hasarı ve onarım, keşif seferi), belediye fermanları, kayıt gidiş-dönüşü
//   12. aşama: Gelişmiş Şehir eşiği, karar seçeneklerinin GameState'te olması, Kadim Tılsım şans sayacı (en geç 3.
//              seferde), Bilgelik Evi araştırmaları ve etkileri, okul ve Kalfa mezun, liman yerleşimi, ihracat
//              sandığı, ticaret teknesinin seferi ve Kasaba Hazinesi, üç aşamalı Harika ve 9. hedef, kayıt sürüm 10
import { openGame, createChecks } from './lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();

const pageResults = await page.evaluate(async () => {
  const game = window.game;
  const sim = window.sim;
  const scene = game.scenes.current;
  const s = game.state;
  const eco = scene.economy;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail: String(detail) });
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  const rich = () => sim.give({ wood: 250, stone: 250, food: 200, iron: 60, wool: 60, bread: 60 });
  const hours = (h) => sim.step(Math.round(h * 225));
  const plaza = scene.world.landmarks.plaza;

  // ===== 10. aşama =====
  // Yiyecek değeri
  sim.give({ food: 0, bread: 2 });
  s.pantry.credit = 0;
  let r = eco.consumeFood(3);
  check('ekmekle öğün ve dilim payı', r.ok && r.bread && s.resources.bread === 0 && near(s.pantry.credit, 2));
  sim.give({ food: 2, bread: 0 });
  s.pantry.credit = 0.5;
  r = eco.consumeFood(3);
  check('yetersiz besin reddedilir', !r.ok && s.resources.food === 2);
  sim.give({ food: 4, bread: 3 });
  s.pantry.credit = 0;
  r = eco.consumeFood(1, { preferRaw: true });
  check('aşçı önce ham yiyecek kullanır', r.ok && !r.bread && s.resources.food === 3);
  const { immigrationStatus, formatTownTitle, townWorkMultiplier, tierChecks, townHappiness } = await import('/src/systems/TownStatus.js');
  sim.give({ food: 0, bread: 10 });
  check('göç koşulu ekmeği sayar', immigrationStatus(s).checks.find((c) => c.key === 'food').ok);

  // Seviye kilitleri
  rich();
  const lockHall = scene.construction.checkPlacement('townHall', plaza.centerX + 5, plaza.centerY + 5);
  check('belediye Kasaba seviyesinde açılır', !lockHall.ok && lockHall.reason.includes('Kasaba'), lockHall.reason);
  const lockMill = scene.construction.checkPlacement('mill', plaza.centerX + 5, plaza.centerY + 5);
  check('değirmen Köy seviyesinde açılır', !lockMill.ok && lockMill.reason.includes('Köy'), lockMill.reason);

  // Tarifler
  sim.place('storage');
  const workshop = sim.place('workshop');
  sim.give({ wood: 100, stone: 100, food: 100, wool: 0, iron: 0 });
  check('ağıl yokken palto eski usulle', scene.crafting.recipeFor('winterCoat').kind === 'fallback');
  check('maden yokken alet eski usulle', scene.crafting.recipeFor('sturdyTool').kind === 'fallback');
  rich();
  const farm = sim.place('sheepFarm');
  sim.give({ wool: 0 });
  check('ağıl varken yün beklenir', String(scene.crafting.recipeFor('winterCoat').reason).includes('Yün bekleniyor'));
  sim.give({ wool: 3, wood: 10 });
  workshop.craftMode = 'winterCoat';
  scene.crafting.work(workshop, 1);
  check('palto yünden yapılır', workshop.craft?.recipe === 'material' && s.resources.wool === 0);

  // Tüccar
  const { offersFor, offerStock } = await import('/src/data/trade.js');
  check('Mezra tüccarı temel mallar', !offersFor('spring', 1).some((o) => o.id === 'woolBale'));
  check('Kasaba tüccarı kervan malları', ['woolBale', 'breadBasket', 'sellWool'].every((id) => offersFor('spring', 3).some((o) => o.id === id)));
  check('stok seviyeyle artar', offerStock(offersFor('spring', 1)[0], 4) === offersFor('spring', 1)[0].stock + 3);

  // Unvan ve yerleşim
  const { TOWN_TIERS } = await import('/src/data/town.js');
  check('unvan', formatTownTitle('Yeşilvadi', TOWN_TIERS[2]) === 'Yeşilvadi Kasabası');
  check('unvan tekrarı yok', formatTownTitle('Ayışığı Köyü', TOWN_TIERS[2]) === 'Ayışığı Köyü · Kasaba');
  check('Gelişmiş Şehir için belediye gerekir', tierChecks(s, TOWN_TIERS[3]).some((c) => c.key === 'townHall'));
  {
    const map = scene.world.map;
    let spot = null;
    for (let y = 5; y < map.height - 8 && !spot; y++) {
      for (let x = 5; x < map.width - 8 && !spot; x++) {
        let clear = true;
        for (let yy = y - 1; yy <= y + 4 && clear; yy++)
          for (let xx = x - 2; xx <= x + 3 && clear; xx++)
            if (map.get(xx, yy) !== 'grass' || map.getObject(xx, yy) || map.getOccupant(xx, yy) || !scene.world.isReachable(xx, yy)) clear = false;
        if (clear) spot = { x, y };
      }
    }
    const ring = [];
    for (let xx = spot.x - 1; xx <= spot.x + 2; xx++) ring.push({ x: xx, y: spot.y + 3 });
    ring.push({ x: spot.x - 1, y: spot.y + 2 }, { x: spot.x + 2, y: spot.y + 2 });
    for (const t of ring) map.setObject(t.x, t.y, 'rock');
    scene.world.refreshStaticData();
    check('kendi girişini koparan yapı reddedilir', !scene.construction.checkPlacement('lumberHut', spot.x, spot.y).ok);
    for (const t of ring) map.setObject(t.x, t.y, null);
    scene.world.refreshStaticData();
  }

  // ===== 11. aşama =====
  // --- Hastalık ve şifacı ---
  const { ILLNESS, VIGOR } = await import('/src/data/health.js');
  const { healthWalkMultiplier, healthWorkMultiplier } = await import('/src/systems/HealthSystem.js');
  const patient = s.characters.find((c) => !c.isChild);
  scene.health.fallIll(patient);
  check('hasta %35 yavaş yürür ve çalışır', near(healthWalkMultiplier(patient, s.totalMinutes), ILLNESS.walkSpeed) && near(healthWorkMultiplier(patient, s.totalMinutes), ILLNESS.workSpeed));
  rich();
  const hut = sim.place('healerHut');
  check('şifacı kulübesi kuruldu', Boolean(hut));
  hut.remedies = 2;
  const plan = scene.behavior.brain.decide(patient, 11);
  check('hasta şifacıya gider', plan.activity === 'heal' && plan.buildingId === hut.id, plan.activity);
  scene.behavior.endTask(patient);
  scene.behavior.startPlan(patient, plan, 11);
  for (let i = 0; i < 225 * 6 && patient.illness; i++) game.update(1 / 60);
  check('iksirle iyileşir ve Dinçlik alır', !patient.illness && (patient.buffs.vigor ?? 0) > s.totalMinutes && hut.remedies === 1, `iksir ${hut.remedies}`);
  check('dinç sakin %15 hızlı', near(healthWorkMultiplier(patient, s.totalMinutes), VIGOR.workSpeed));
  const other = s.characters.find((c) => !c.isChild && c !== patient);
  scene.health.fallIll(other);
  other.illness.remaining = 5;
  hours(0.2);
  check('hastalık kendiliğinden geçer', !other.illness);
  // Maruziyet: kışın dışarıda paltosuz üşüyen birikir
  const exposed = s.characters.find((c) => !c.isChild && c !== patient && c !== other);
  exposed.exposure = 0;
  const save = { day: s.time.day, heating: { ...s.heating } };
  s.time.day = 13; // kış
  s.heating.cold = true; // odun yok: herkes üşür
  scene.health.update({ gameMinutes: 60, simDt: 0, realDt: 0, hour: 12 });
  check('soğukta maruziyet birikir', exposed.exposure > 3, exposed.exposure.toFixed(1));
  s.time.day = save.day;
  s.heating = save.heating;

  // Şifacı işi: ot toplar, iksir hazırlar
  hut.herbs = 0;
  hut.remedies = 0;
  const brew1 = scene.behavior.apothecaryWork(hut, { activity: 'gatherHerbs' }, 60);
  check('şifacı ot toplar', brew1 && hut.herbs > 1, hut.herbs.toFixed(2));
  hut.herbs = 6;
  scene.behavior.apothecaryWork(hut, { activity: 'brew' }, 90);
  check('otlardan iksir hazırlanır', hut.remedies >= 2 && hut.herbs < 6, `iksir ${hut.remedies} ot ${hut.herbs}`);

  // --- Kasaba hayvanları ---
  s.town.tier = 2;
  s.animalMeta.lastPetDay = 0;
  const before = s.animals.filter((a) => a.isPet).length;
  scene.animals.petArrival();
  check('Köy seviyesinde kedi gelir', s.animals.filter((a) => a.kind === 'cat').length === 1 && before === 0);
  scene.animals.petArrival();
  check('günde en çok bir hayvan gelir', s.animals.filter((a) => a.isPet).length === 1);
  s.animalMeta.lastPetDay = 0;
  scene.animals.petArrival();
  check('ertesi gün köpek gelir', s.animals.some((a) => a.kind === 'dog'));
  const cat = s.animals.find((a) => a.kind === 'cat');
  cat.mode = 'idle';
  cat.timer = 99;
  const lover = s.characters.find((c) => !c.isChild && c.visible && !c.task?.phase);
  const petter = lover ?? s.characters.find((c) => c.visible);
  petter.x = cat.x + 4;
  petter.y = cat.y;
  petter.lastPetAt = -9999;
  petter.needs.fun = 40;
  const funBefore = petter.needs.fun;
  for (let i = 0; i < 30 && petter.lastPetAt < 0; i++) scene.animals.petting(5);
  check('yanından geçen sakin hayvanı sever', petter.needs.fun > funBefore && cat.heart > 0, `keyif ${funBefore} -> ${petter.needs.fun.toFixed(1)}`);
  check('yaban hayatı yerleşti', s.animals.filter((a) => a.kind === 'rabbit').length >= 3 && s.animals.some((a) => a.kind === 'deer'));
  // Ürkme: bir sakini tavşanın dibine koy
  const rabbit = s.animals.find((a) => a.kind === 'rabbit' && a.visible);
  if (rabbit) {
    const walker = s.characters.find((c) => c.visible && c !== petter) ?? petter;
    const keep = { x: walker.x, y: walker.y };
    walker.x = rabbit.x - 10;
    walker.y = rabbit.y;
    const dist0 = Math.hypot(rabbit.x - walker.x, rabbit.y - walker.y);
    for (let i = 0; i < 40; i++) scene.animals.updateWild(rabbit, 1 / 15, 12);
    check('tavşan sakinden ürküp kaçar', Math.hypot(rabbit.x - walker.x, rabbit.y - walker.y) > dist0 + 4, `${dist0.toFixed(0)} -> ${Math.hypot(rabbit.x - walker.x, rabbit.y - walker.y).toFixed(0)}`);
    walker.x = keep.x;
    walker.y = keep.y;
  }

  // --- Karar olayları ---
  const dil = scene.dilemmas;
  const paused0 = s.time.paused;
  check('olay açılır ve oyunu durdurur', dil.maybeStart('refugees') && s.dilemma.active?.id === 'refugees' && s.time.paused);
  sim.step(31 * 60); // 31 gerçek saniye
  check('süre dolunca varsayılan seçenek uygulanır', !s.dilemma.active && s.dilemma.history.refugees === s.time.day && s.time.paused === paused0);
  // Fırtına: risk -> hasar -> onarım
  rich();
  for (const t of ['lumberHut', 'quarry', 'garden']) sim.place(t);
  s.dilemma.history = {};
  dil.maybeStart('storm');
  game.events.emit('ui:chooseDilemma', { optionId: 'risk' });
  check('fırtına yaklaşıyor', s.dilemma.storm && !s.dilemma.storm.fortified);
  s.dilemma.storm.at = s.totalMinutes;
  game.update(1 / 60);
  const damaged = s.buildings.filter((b) => b.damaged);
  check('güçlendirilmemiş kasabada yapılar hasar alır', damaged.length >= 1, damaged.map((b) => b.type).join(','));
  game.update(1 / 60);
  check('hasarlı yapı çalışmaz', damaged.every((b) => b.idle));
  rich();
  const mend = scene.construction.startProject(damaged[0]);
  check('hasarlı yapı onarım projesi başlatır', mend.ok && damaged[0].project?.kind === 'mend', mend.reason);
  damaged[0].project.progress = damaged[0].project.work;
  scene.construction.completeProject(damaged[0]);
  check('onarılan yapı yeniden çalışır', !damaged[0].damaged);
  // Güçlendirilmiş fırtına hasarsız
  for (const b of s.buildings) b.damaged = false;
  s.dilemma.history = {};
  rich();
  dil.maybeStart('storm');
  game.events.emit('ui:chooseDilemma', { optionId: 'fortifyStone' });
  s.dilemma.storm.at = s.totalMinutes;
  game.update(1 / 60);
  check('güçlendirilmiş kasaba fırtınayı hasarsız atlatır', !s.buildings.some((b) => b.damaged));
  // Keşif seferi
  rich();
  s.dilemma.history = {};
  s.time.day = Math.max(s.time.day, 6);
  for (const c of s.characters) c.illness = null;
  const { DILEMMAS } = await import('/src/data/dilemmas.js');
  const req = DILEMMAS.expedition.requires;
  DILEMMAS.expedition.requires = {}; // küçük test kasabası (6 sakin) için nüfus koşulu kaldırılır
  const started = dil.maybeStart('expedition');
  DILEMMAS.expedition.requires = req;
  game.events.emit('ui:chooseDilemma', { optionId: 'scout' });
  const explorer = s.characters.find((c) => c.away);
  check('izci sefere çıkar', started && explorer && s.dilemma.expedition);
  const res0 = { ...s.resources };
  hours(27);
  check('izci döner ve ganimet getirir', !s.characters.some((c) => c.away) && !s.dilemma.expedition && Object.keys(res0).some((k) => s.resources[k] > res0[k]));

  // --- Belediye fermanları ---
  s.town.tier = 3;
  rich();
  const hall = sim.place('townHall');
  if (!hall) check('belediye yeri', false, JSON.stringify(scene.construction.checkPlacement('townHall', plaza.centerX + 4, plaza.centerY - 6).reason));
  const { civicWorkMultiplier } = await import('/src/systems/TownStatus.js');
  check('belediye kuruldu ve iş verimi +%15', hall && near(civicWorkMultiplier(s), 1.15) && townWorkMultiplier(s) >= 1.15 - 1e-9);
  const { civicStatus } = await import('/src/systems/CivicSystem.js');
  sim.give({ wood: 120, stone: 120, iron: 50 });
  const cap0 = s.storageCapacity;
  game.events.emit('ui:civicProject', { id: 'storehouse' });
  check('depo genişletmesi +150 kapasite', s.storageCapacity === cap0 + 150 && s.civic.storageLevel === 1, `${cap0} -> ${s.storageCapacity}`);
  sim.give({ wool: 60, iron: 60 });
  game.events.emit('ui:civicProject', { id: 'craftGuild' });
  check('zanaat loncası kalıcı', s.civic.craftGuild && civicStatus(s, 'craftGuild').maxed);
  sim.give({ bread: 50, food: 50, wood: 60 });
  const happy0 = townHappiness(s);
  game.events.emit('ui:civicProject', { id: 'grandFeast' });
  check('büyük ziyafet bonusu ve refah', (s.buffs.grandFeast ?? 0) > s.totalMinutes && townHappiness(s) > happy0 && s.resources.bread === 0 && s.resources.food === 20);
  check('ziyafet bekleme süresi', !civicStatus(s, 'grandFeast').ok);

  // ===== 12. aşama =====
  // --- Rötuşlar: Gelişmiş Şehir eşiği, karar seçenekleri GameState'te, Kadim Tılsım şans sayacı ---
  check('Gelişmiş Şehir nüfus eşiği 25', TOWN_TIERS[3].requires.population === 25);
  s.dilemma.history = {};
  dil.maybeStart('refugees');
  const act = s.dilemma.active;
  check(
    'karar seçenekleri GameState\'te',
    act && Array.isArray(act.options) && act.options.length >= 2 && act.options.every((o) => typeof o.ok === 'boolean' && 'reason' in o) && act.options.some((o) => o.id === act.defaultId) && typeof act.title === 'string'
  );
  game.events.emit('ui:chooseDilemma', { optionId: act.defaultId });
  {
    const { EXPEDITION } = await import('/src/data/dilemmas.js');
    const hours0 = EXPEDITION.hours;
    EXPEDITION.hours = 2; // seferler kısa sürsün (ganimet ve sayaç kuralları aynı)
    const returns = [];
    const off = game.events.on('expedition:returned', (p) => returns.push(p.buff));
    const expedition = (counter = null) => {
      for (const c of s.characters) c.illness = null;
      s.dilemma.history = {};
      if (counter !== null) s.civic.expeditionsSinceTalisman = counter;
      const req2 = DILEMMAS.expedition.requires;
      DILEMMAS.expedition.requires = {};
      sim.give({ food: 200 });
      const ok = dil.maybeStart('expedition');
      DILEMMAS.expedition.requires = req2;
      const scout = s.dilemma.active?.options?.find((o) => o.id === 'scout');
      if (!scout?.ok) sim.log.push(`izci seçilemedi: ${scout?.reason} (${ok})`);
      game.events.emit('ui:chooseDilemma', { optionId: 'scout' });
      for (let i = 0; i < 40 && s.dilemma.expedition; i++) hours(0.5);
      return ok;
    };
    // Sayaç sıfırdan: üç seferin en az birinde (en geç üçüncüsünde) tılsım çıkmalı
    s.civic.expeditionsSinceTalisman = 0;
    const firstThree = [expedition(0), expedition(), expedition()];
    const firstTalisman = returns.indexOf('talisman');
    check('Kadim Tılsım en geç 3. seferde çıkar', firstThree.every(Boolean) && returns.length === 3 && firstTalisman >= 0 && firstTalisman <= 2, returns.join(','));
    // Sayaç 2'deyken (iki tılsımsız sefer) üçüncü sefer tılsımı kesin bulur ve sayaç sıfırlanır
    for (let round = 0; round < 3; round++) {
      returns.length = 0;
      expedition(2);
      if (returns[0] !== 'talisman' || s.civic.expeditionsSinceTalisman !== 0) break;
    }
    check('şans sayacı dolunca tılsım kesin', returns[0] === 'talisman' && s.civic.expeditionsSinceTalisman === 0 && (s.buffs.talisman ?? 0) > s.totalMinutes, `${returns[0]} sayaç ${s.civic.expeditionsSinceTalisman} ${sim.log.filter((l) => l.includes('izci')).join(' | ')}`);
    // Tılsımsız sefer sayacı artırır
    returns.length = 0;
    expedition(0);
    check('tılsımsız sefer sayacı artırır', returns[0] === 'talisman' ? s.civic.expeditionsSinceTalisman === 0 : s.civic.expeditionsSinceTalisman === 1, `${returns[0]} sayaç ${s.civic.expeditionsSinceTalisman}`);
    off();
    EXPEDITION.hours = hours0;
  }

  // --- Bilgelik Evi ve araştırmalar ---
  const { RESEARCH, SCHOOL } = await import('/src/data/research.js');
  const R = await import('/src/systems/ResearchSystem.js');
  s.town.tier = 1;
  check('Bilgelik Evi Köy seviyesinde açılır', !scene.construction.checkPlacement('academy', plaza.centerX, plaza.centerY + 8).ok && String(scene.construction.checkPlacement('academy', plaza.centerX, plaza.centerY + 8).reason).includes('Köy'));
  s.town.tier = 3;
  check('Bilgelik Evi yokken araştırma yapılamaz', !R.researchStatus(s, 'gears', scene.research.academies().length > 0).ok);
  rich();
  sim.give({ iron: 300, wool: 300, bread: 300 });
  const academy = sim.place('academy');
  check('Bilgelik Evi kuruldu', academy && scene.research.academies().length === 1);
  const wood0 = s.resources.wood;
  game.events.emit('ui:startResearch', { id: 'gears' });
  check('araştırma başlar ve maliyet ödenir', s.research.active?.id === 'gears' && s.resources.wood === wood0 - RESEARCH.gears.cost.wood);
  game.events.emit('ui:startResearch', { id: 'architecture' });
  check('aynı anda tek araştırma', s.research.active?.id === 'gears' && !R.researchStatus(s, 'architecture', true).ok);
  // Bilge mesaide çalışır ve araştırma ilerler (küçük test kasabasında diğer iş yerleri geçici olarak kapatılır)
  const closed = [];
  for (const b of scene.world.getCompleted()) {
    if (b === academy || !b.workerSlots) continue;
    for (const c of s.characters) if (!b.excludedWorkers.has(c.id)) closed.push([b, c.id]) && b.excludedWorkers.add(c.id);
  }
  for (let i = 0; i < 96 && !(s.time.hour >= 9 && s.time.hour < 12); i++) hours(0.25);
  let sage = null;
  for (let i = 0; i < 24 && !(sage && s.research.active.progress > 0); i++) {
    hours(0.25);
    sage ??= s.characters.find((c) => c.task?.activity === 'teach' && c.task.phase === 'perform');
  }
  for (const [b, id] of closed) b.excludedWorkers.delete(id);
  check('Bilge çalışır, araştırma ilerler', s.research.active && s.research.active.progress > 0, `${s.research.active?.progress?.toFixed(0)} · ${sage?.name ?? 'bilge yok'}`);
  scene.research.work(academy, RESEARCH.gears.work);
  check('araştırma tamamlanır', s.research.done.gears && !s.research.active);
  check('Gelişmiş Çarklar: maden, ocak, değirmen, oduncu +%20', ['quarry', 'ironMine', 'mill', 'lumberHut'].every((t) => near(R.researchProductionMultiplier(s, t), 1.2)) && R.researchProductionMultiplier(s, 'garden') === 1);
  scene.research.complete('architecture');
  check('Mimarlık Loncası: inşaat +%35, fırtına direnci x2', near(R.researchBuildMultiplier(s), 1.35) && R.stormResistance(s) === 2);
  scene.research.complete('herbalism');
  const patient2 = s.characters.find((c) => !c.isChild);
  scene.health.cure(patient2);
  check('Şifalı Bitki: tedavi x2, Dinçlik 24 saat', R.healSpeedMultiplier(s) === 2 && patient2.buffs.vigor - s.totalMinutes === 24 * 60);
  scene.research.complete('insulation');
  check('Kışlık Yalıtım: odun tüketimi -%25', near(R.researchHeatingMultiplier(s), 0.75));
  {
    // Gerçek ısınma kaynakları: yalıtımlı evlerin dakikalık odunu dörtte üçe iner
    const { heatingSources } = await import('/src/systems/HeatingSystem.js');
    const homesRate = () => heatingSources(s).filter((x) => x.building.type === 'cabin').reduce((a, x) => a + x.perMinute, 0);
    const withIns = homesRate();
    const done = s.research.done.insulation;
    delete s.research.done.insulation;
    const without = homesRate();
    s.research.done.insulation = done;
    check('yalıtımlı evler kışın daha az odun yakar', withIns > 0 && near(withIns / without, 0.75), `${(withIns * 1440).toFixed(1)} / ${(without * 1440).toFixed(1)} odun/gün`);
  }

  // --- Okul: çocuk ders dinler, büyüyünce Kalfa olur ---
  {
    const adults = s.characters.filter((c) => !c.isChild);
    const home = scene.world.getCompleted('cabin').find((b) => b);
    scene.family.welcomeChild(adults[0], adults[1], home);
    const kid = s.characters[s.characters.length - 1];
    home.occupants.delete(kid.id);
    Object.assign(kid, { task: null, visible: true, pose: 'stand', insideBuildingId: null });
    for (let i = 0; i < 120 && !(s.time.hour >= 9 && s.time.hour < 11); i++) hours(0.25);
    let sawSchool = false;
    for (let i = 0; i < 16; i++) {
      hours(0.25);
      if (kid.task?.activity === 'school' && kid.task.phase === 'perform') sawSchool = true;
    }
    check('çocuk ders saatinde okula gider', sawSchool && kid.schooling > 0, `öğrenme ${kid.schooling?.toFixed(0)} dk`);
    check('günlük ders sınırı', kid.schoolToday <= SCHOOL.minutesPerDay + 1, kid.schoolToday?.toFixed(0));
    kid.schooling = SCHOOL.graduateMinutes;
    const grads = [];
    const off = game.events.on('school:graduated', (p) => grads.push(p));
    scene.family.growUp(kid);
    off();
    const journeyman = (await import('/src/data/skills.js')).SKILL_LEVELS.find((l) => l.level === 2).xp;
    check('okulu bitiren çocuk büyüyünce Kalfa', grads.length === 1 && kid.educated && kid.skills[grads[0].skill] >= journeyman, grads[0]?.skill);
    const other = new (s.characters[0].constructor)({ name: 'Deneme', age: 5, traits: [], appearance: kid.appearance, homeId: home.id, growsUpAt: 0, parentIds: [] });
    other.schooling = 10;
    scene.research.graduate(other);
    check('okula yeterince gitmeyen çocuk Kalfa olmaz', !other.educated);
  }

  // --- Büyük Ticaret Limanı ve nehir ihracatı ---
  const { EXPORT } = await import('/src/data/trade.js');
  const H = await import('/src/systems/HarborSystem.js');
  s.town.tier = 2;
  check('liman Kasaba seviyesinde açılır', !sim.findSpot('harbor', 45));
  s.town.tier = 3;
  {
    const land = scene.construction.checkPlacement('harbor', plaza.centerX, plaza.centerY + 8);
    check('liman karada kurulamaz', !land.ok, land.reason);
  }
  rich();
  const harbor = sim.place('harbor', { maxRadius: 45 });
  if (harbor) s.trade.nextBoatAt = s.totalMinutes + 99999; // tekne testin istediği an gelsin
  check('liman nehir kıyısına kuruldu', harbor && ['left', 'right'].includes(harbor.orientation) && harbor.exportThreshold === EXPORT.defaultThreshold, harbor ? `${harbor.tileX},${harbor.tileY} ${harbor.orientation}` : 'yer yok');
  check('ikinci liman kurulamaz', !sim.findSpot('harbor', 45));
  // Hazine depo sınırını tanımaz
  const g0 = s.resources.gold;
  eco.add('gold', s.storageCapacity + 500);
  check('altın depo sınırına takılmaz', s.resources.gold === g0 + s.storageCapacity + 500);
  s.resources.gold = 0;
  // Sandık
  sim.give({ wood: 300, stone: 300, food: 120, wool: 90, iron: 60, bread: 140 });
  game.events.emit('ui:prepareCrate', { buildingId: harbor.id });
  check('ihracat sandığı hazırlanır', harbor.crate && harbor.crate.wood === 40 && harbor.crate.food === 20 && !harbor.crate.iron && s.resources.wood === 260, JSON.stringify(harbor.crate));
  // Tekne seferi: fazlalık + sandık
  game.events.emit('ui:setExportThreshold', { buildingId: harbor.id, threshold: 250 });
  check('fazlalık sınırı ayarlanır', harbor.exportThreshold === 250);
  sim.give({ wood: 480, stone: 450 });
  const stages = [];
  const offB = ['harbor:boatArriving', 'harbor:boatDocked', 'harbor:shipped'].map((n) => game.events.on(n, () => stages.push(n.split(':')[1])));
  let sawBoat = false;
  for (let i = 0; i < 96 && !(s.time.hour >= 7 && s.time.hour < 12); i++) hours(0.25);
  s.trade.nextBoatAt = s.totalMinutes;
  const woodDock = s.resources.wood;
  for (let i = 0; i < 100 && s.trade.shipments === 0; i++) {
    hours(0.25);
    if (scene.world.boats.length === 1 && s.trade.boat) sawBoat = true;
  }
  const shipped = s.trade.last;
  check('tekne nehirden gelip yanaşır ve yükler', stages.slice(0, 3).join(',') === 'boatArriving,boatDocked,shipped' && sawBoat, stages.join(','));
  check('fazlalık ve sandık ihraç edilir', shipped && shipped.cargo.wood > 40 && shipped.cargo.stone > 40 && s.resources.wood < woodDock && !harbor.crate && !shipped.cargo.iron, shipped && JSON.stringify(shipped.cargo));
  check('ihracat Kasaba Hazinesi\'ne altın getirir', s.resources.gold === H.cargoValue(shipped.cargo) && s.trade.goldEarned === s.resources.gold && s.trade.shipments === 1, `${s.resources.gold} altın`);
  check('tekne kapasitesi aşılmaz', Object.values(shipped.cargo).reduce((a, b) => a + b, 0) <= EXPORT.capacity);
  for (let i = 0; i < 60 && s.trade.boat; i++) hours(0.25);
  check('tekne nehrin öteki ucunda kaybolur', !s.trade.boat && scene.world.boats.length === 0 && s.trade.nextBoatAt > s.totalMinutes);
  offB.forEach((off) => off());
  game.events.emit('ui:setExportThreshold', { buildingId: harbor.id, threshold: null });
  check('ihracat kapatılabilir', harbor.exportThreshold === null && Object.keys(H.exportExcess(s, null)).length === 0);

  // --- Kasaba Harikası: üç aşama ---
  const { BUILDINGS } = await import('/src/data/buildings.js');
  s.town.tier = 3;
  check('Harika Gelişmiş Şehir\'de açılır', !sim.findSpot('wonder'));
  s.town.tier = 4;
  sim.give({ wood: 600, stone: 1200, iron: 600, wool: 400, bread: 500, gold: 3000 });
  {
    // Harikanın şantiyesi iptal edilebilir (tam iade); bitmiş harika yıkılamaz
    const gold0 = s.resources.gold;
    const site = sim.place('wonder', { instant: false });
    const cancel = site ? scene.construction.demolishAt(site.tileX, site.tileY) : { ok: false };
    check('harika şantiyesi iptal edilebilir', site && cancel.ok && !s.buildings.includes(site) && s.resources.gold === gold0, cancel.reason);
  }
  sim.give({ wood: 600, stone: 1200, iron: 600, wool: 400, bread: 500, gold: 3000 }); // iade depo sınırına takılır: yeniden ver
  const wonder = sim.place('wonder');
  const { MILESTONES } = await import('/src/data/milestones.js');
  const { milestoneProgress } = await import('/src/systems/MilestoneSystem.js');
  const pearl = MILESTONES.find((m) => m.id === 'pearl');
  check('Harika kuruldu: Temel (aşama 1/3)', wonder && wonder.wonderStage === 1 && !wonder.wonderComplete && milestoneProgress(pearl, s).current === 1);
  check('Harika yıkılamaz', !scene.construction.demolishAt(wonder.tileX, wonder.tileY).ok && s.buildings.includes(wonder));
  const { landmarkBonus } = await import('/src/systems/TownStatus.js');
  const landmarkW = landmarkBonus(s);
  const stone0 = s.resources.stone;
  game.events.emit('ui:startProject', wonder.id);
  check('Gövde aşaması başlar ve maliyeti ödenir', wonder.project?.kind === 'stage' && s.resources.stone === stone0 - BUILDINGS.wonder.wonder.stages[1].cost.stone);
  // İnşaatçılar aşamayı gerçekten yükseltir
  const p0 = wonder.project.progress;
  for (let i = 0; i < 160 && wonder.project && !(wonder.project.progress > p0); i++) hours(0.25);
  check('inşaatçılar aşamayı yükseltir', wonder.project && wonder.project.progress > p0, `${wonder.project?.progress?.toFixed(0)} ${sim.stamp()} iş: ${s.jobs.map((j) => `${j.type}:${j.buildingId}:${j.assignees.length}`).join(',')} görev: ${s.characters.map((c) => c.task?.activity ?? '-').join(',')}`);
  scene.construction.completeProject(wonder);
  check('Gövde tamamlandı (2/3)', wonder.wonderStage === 2 && milestoneProgress(pearl, s).current === 2 && !s.milestones.pearl);
  game.events.emit('ui:startProject', wonder.id);
  const wonderEvents = [];
  const offW = game.events.on('wonder:completed', (p) => wonderEvents.push(p));
  scene.construction.completeProject(wonder);
  offW();
  check('Görkemli Kule tamamlandı: altın çağ', wonder.wonderComplete && wonderEvents.length === 1 && !scene.construction.projectFor(wonder));
  check('9. hedef Vadinin İncisi tamamlandı', Boolean(s.milestones.pearl));
  check('altın çağ refahı +12', landmarkBonus(s) - landmarkW === 12, `${landmarkW} -> ${landmarkBonus(s)}`);
  check('ikinci harika kurulamaz', !sim.findSpot('wonder'));

  // --- Kayıt gidiş-dönüşü (sürüm 10) ---
  const ill = s.characters.find((c) => !c.isChild);
  scene.health.fallIll(ill);
  hut.remedies = 4;
  farm.damaged = true;
  s.dilemma.storm = { kind: 'storm', at: s.totalMinutes + 600, fortified: true, watchChance: 0 };
  const animals = s.animals.length;
  game.events.emit('ui:save');
  const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  game.events.emit('ui:load');
  const s2 = game.state;
  const ill2 = s2.characters.find((c) => c.id === ill.id);
  check('kayıt sürümü 10', raw.version === 10);
  check('kayıttan araştırmalar döner', ['gears', 'architecture', 'herbalism', 'insulation'].every((id) => s2.research.done[id]) && s2.research.active === null);
  check('kayıttan liman, hazine ve ihracat döner', s2.trade.shipments === 1 && s2.trade.goldEarned > 0 && s2.resources.gold === raw.resources.gold && s2.buildings.find((b) => b.type === 'harbor')?.exportThreshold === null);
  check('kayıttan harika aşaması döner', s2.buildings.find((b) => b.type === 'wonder')?.wonderStage === 3 && s2.buildings.find((b) => b.type === 'wonder')?.wonderComplete);
  check('kayıttan okul mezunu döner', s2.characters.some((c) => c.educated));
  check('kayıttan hayvanlar ve adları döner', s2.animals.length === animals && s2.animals.some((a) => a.name === cat.name));
  check('kayıttan hastalık, iksir ve hasar döner', ill2?.illness && s2.buildings.find((b) => b.id === hut.id)?.remedies === 4 && s2.buildings.find((b) => b.id === farm.id)?.damaged);
  check('kayıttan ferman ve fırtına döner', s2.civic.storageLevel === 1 && s2.civic.craftGuild && s2.dilemma.storm?.fortified);
  return out;
});
results.push(...pageResults);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
