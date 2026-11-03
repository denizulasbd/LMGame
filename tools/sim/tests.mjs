// Hedefli testler: oyunun kurallarını tarayıcıda, gerçek sistemlerle tek tek dener.
// Kullanım: node tools/sim/tests.mjs   (sunucu: python3 tools/serve.py)
//   10. aşama: yiyecek değeri, seviye kilitleri, eski usul / asıl tarif, tüccar malları, belediye, unvan, yerleşim
//   11. aşama: hastalık ve şifacı, kasaba hayvanları ve sevme, yaban hayatının ürkmesi, karar olayları (zaman aşımı,
//              fırtına hasarı ve onarım, keşif seferi), belediye fermanları, kayıt gidiş-dönüşü
//   12. aşama: Gelişmiş Şehir eşiği, karar seçeneklerinin GameState'te olması, Kadim Tılsım şans sayacı (en geç 3.
//              seferde), Bilgelik Evi araştırmaları ve etkileri, okul ve Kalfa mezun, liman yerleşimi, ihracat
//              sandığı, ticaret teknesinin seferi ve Kasaba Hazinesi, üç aşamalı Harika ve 9. hedef
//   13. aşama: lüks mallar (baharat, ipek ve mermer), beş yadigâr ve artan fiyatları, etkileri (gerçek üretim dahil),
//              altın fermanları (ikramiye, 3 kat hızlı inşaat), kemer / çit / kiraz / çardak, sakin adı, işçi sabitleme,
//              Kasaba Arşivi ve sayaçlar, fotoğraf modu, kayıt sürümü 11
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

  // ===== 13. aşama =====
  const L = await import('/src/systems/Luxury.js');
  const { LUXURY_GOODS, RELIC_PRICES, RELIC_KEYS, GOLD_DECREES } = await import('/src/data/luxury.js');
  const { ACTIVITIES } = await import('/src/data/activities.js');
  const now = () => s.totalMinutes;
  // --- Lüks mallar: satıcı ve koşullar ---
  s.events.merchant.present = false;
  check('tüccar yokken tüccardan lüks mal alınamaz', !L.luxuryStatus(s, 'silkMarble', 'merchant').ok);
  s.resources.gold = 0;
  check('altın yetmezse alınamaz', String(L.luxuryStatus(s, 'silkMarble', 'harbor').reason).includes('Yetersiz altın'));
  rich();
  let inn = scene.world.getCompleted('inn')[0] ?? sim.place('inn');
  s.resources.gold = 400;
  game.events.emit('ui:buyLuxury', { id: 'spiceCrate', source: 'harbor' });
  check('baharat sandığı limandan alınır ve hana teslim edilir', s.resources.gold === 0 && (s.buffs.spices ?? 0) - now() === 96 * 60 && s.luxury.goldSpent === 400, `${s.resources.gold} altın`);
  {
    // Handa yemek yiyen sakin baharatlı yemekle hızlanır
    const eater = s.characters.find((c) => !c.isChild && !c.away);
    eater.task = { activity: 'innMeal', buildingId: inn.id, phase: 'perform', elapsed: 100, duration: 1 };
    scene.behavior.perform(eater, eater.task, ACTIVITIES.innMeal, { gameMinutes: 1, hour: 19, simDt: 1, realDt: 1 / 60 });
    check('handa yiyen sakin %25 hızlı çalışır ve yürür', L.isSpiced(eater, now()) && near(L.spiceWorkMultiplier(eater, now()), 1.25) && near(L.spiceWalkMultiplier(eater, now()), 1.25) && (eater.buffs.spiced - now()) === LUXURY_GOODS.spiceCrate.personal.hours * 60);
  }
  {
    const cabin = scene.world.getCompleted('cabin')[0];
    cabin.level = 2;
    const { townHappinessBonus } = await import('/src/systems/TownStatus.js');
    const bonus0 = townHappinessBonus(s);
    s.resources.gold = 700;
    game.events.emit('ui:buyLuxury', { id: 'silkMarble', source: 'harbor' });
    check('ipek ve mermer: Seviye 2 yapılara kalıcı prestij ve şenlik', s.luxury.silk && L.silkPrestige(s) >= 0.5 && townHappinessBonus(s) > bonus0 && (s.buffs.festival ?? 0) > now() && s.resources.gold === 100);
    s.resources.gold = 700;
    game.events.emit('ui:buyLuxury', { id: 'silkMarble', source: 'harbor' });
    check('ipek ve mermer bir kez alınır', s.resources.gold === 700 && L.luxuryStatus(s, 'silkMarble', 'harbor').done);
  }
  // --- Kasaba yadigârları ---
  check('ilk yadigâr 1.500 altın', L.relicPrice(s) === RELIC_PRICES[0] && L.relicPrice(s) === 1500);
  s.resources.gold = 40000;
  game.events.emit('ui:buyRelic', { id: 'sunSphere', source: 'merchant' });
  check('tüccar yokken yadigâr alınamaz', !L.hasRelic(s, 'sunSphere'));
  game.events.emit('ui:buyRelic', { id: 'sunSphere', source: 'harbor' });
  check('yadigâr alınır ve sergilenir; sıradaki pahalanır', L.hasRelic(s, 'sunSphere') && s.resources.gold === 38500 && L.relicPrice(s) === 3000);
  game.events.emit('ui:buyRelic', { id: 'sunSphere', source: 'harbor' });
  check('aynı yadigâr iki kez alınamaz', s.resources.gold === 38500);
  for (const id of ['cornucopia', 'guildSeal', 'compass', 'eternalFlame']) game.events.emit('ui:buyRelic', { id, source: 'harbor' });
  const relicTotal = RELIC_PRICES.reduce((a, b) => a + b, 0);
  check('beş yadigâr: 1.500 → 3.000 → 5.000 → 7.000 → 9.000', L.relicCount(s) === 5 && s.resources.gold === 40000 - relicTotal && L.relicPrice(s) === null && L.relicMask(s) === 31, `${s.resources.gold}`);
  check('Güneş Saati Küresi ve Bereket Boynuzu', near(L.relicProductionMultiplier(s, 'wood'), 1.1) && near(L.relicProductionMultiplier(s, 'food'), 1.1 * 1.25));
  check('Usta Lonca Mührü: deneyim +%30', near(L.relicXpMultiplier(s), 1.3));
  const H13 = await import('/src/systems/HarborSystem.js');
  check('Denizci Pusulası: tekne +%50 yük, altın +%20', H13.boatCapacity(s) === Math.round(640 * 1.5) && H13.cargoValue({ wood: 100 }, L.relicExportValue(s)) === 120);
  {
    const { heatingSources } = await import('/src/systems/HeatingSystem.js');
    const rate = () => heatingSources(s).filter((x) => x.building.type === 'cabin').reduce((a, x) => a + x.perMinute, 0);
    const withFlame = rate();
    const saved = s.luxury.relics.eternalFlame;
    delete s.luxury.relics.eternalFlame;
    const without = rate();
    s.luxury.relics.eternalFlame = saved;
    check('Ebedi Ateş: evler %30 az odun yakar, üşüme yarıya iner', near(withFlame / without, 0.7) && near(L.relicColdMultiplier(s), 0.5));
  }
  {
    // Gerçek üretim: Güneş Saati Küresi ile aynı emek daha çok üretir
    const quarry = scene.world.getCompleted('quarry')[0] ?? sim.place('quarry');
    const worker = s.characters.find((c) => !c.isChild && !c.away && !c.illness);
    const run = () => {
      quarry.productionBuffer = 0;
      worker.task = { activity: 'mine', workBuildingId: quarry.id, buildingId: quarry.id, phase: 'perform', elapsed: 0, duration: 999 };
      scene.behavior.performWork(worker, worker.task, 60);
      return quarry.productionBuffer + quarry.producedToday;
    };
    quarry.producedToday = 0;
    const withSun = run();
    const saved = s.luxury.relics.sunSphere;
    delete s.luxury.relics.sunSphere;
    quarry.producedToday = 0;
    const without = run();
    s.luxury.relics.sunSphere = saved;
    worker.task = null;
    check('Güneş Saati Küresi üretim yapısında gerçekten +%10', without > 0 && near(withSun / without, 1.1), `${withSun.toFixed(2)} / ${without.toFixed(2)}`);
  }
  // --- Altın fermanları ---
  s.resources.gold = 3000;
  const fun0 = s.characters.reduce((a, c) => a + c.needs.fun, 0);
  game.events.emit('ui:goldDecree', { id: 'goldBonus' });
  const { buffMultiplier } = await import('/src/systems/TownStatus.js');
  check('Ustalara Altın İkramiye: 3 gün iş hızı +%20 ve keyif', s.resources.gold === 2000 && (s.buffs.goldBonus ?? 0) - now() === 72 * 60 && buffMultiplier(s, 'workSpeed') >= 1.2 - 1e-9 && s.characters.reduce((a, c) => a + c.needs.fun, 0) > fun0);
  game.events.emit('ui:goldDecree', { id: 'goldBonus' });
  check('altın fermanının bekleme süresi', s.resources.gold === 2000 && L.goldDecreeStatus(s, 'goldBonus').waitDays === GOLD_DECREES.goldBonus.cooldownDays);
  {
    // Kraliyet Mimarları: aynı inşaatçı aynı sürede 3 kat ilerletir
    const site = sim.place('storage', { instant: false });
    const builder = s.characters.find((c) => !c.isChild && !c.away && !c.illness);
    const job = s.jobs.find((j) => j.buildingId === site.id);
    const progress = () => {
      const before = site.buildProgress;
      builder.task = { activity: 'build', jobId: job.id, buildingId: site.id, phase: 'perform', elapsed: 0, duration: 999 };
      scene.behavior.performWork(builder, builder.task, 3);
      return site.buildProgress - before;
    };
    const normal = progress();
    game.events.emit('ui:goldDecree', { id: 'royalArchitects' });
    const royal = progress();
    builder.task = null;
    check('Kraliyet Mimarları: şantiyeler 3 kat hızlı', (s.buffs.royalArchitects ?? 0) > now() && normal > 0 && near(royal / normal, 3), `${normal.toFixed(2)} -> ${royal.toFixed(2)}`);
    scene.construction.demolish(site);
  }

  // --- Peyzaj: kemer, çit, kiraz, çardak ---
  rich();
  sim.give({ gold: 2000 });
  {
    const map = scene.world.map;
    // Yolun üstüne kemer: yol karosu kalır, altından geçilir
    let road = null;
    for (let r = 1; r < 30 && !road; r++) {
      for (let dy = -r; dy <= r && !road; dy++) {
        for (let dx = -r; dx <= r && !road; dx++) {
          const x = plaza.centerX + dx;
          const y = plaza.centerY + dy;
          if (map.get(x, y) === 'path' && map.getOccupant(x, y) === 0 && scene.construction.checkPlacement('marbleArch', x, y).ok) road = { x, y };
        }
      }
    }
    const arch = road && scene.construction.placeSite('marbleArch', road.x, road.y).building;
    if (arch) {
      const job = scene.jobs.jobs.find((j) => j.buildingId === arch.id);
      if (job) scene.jobs.cancel(job);
      scene.construction.complete(arch);
    }
    check('kemer yolun üstüne kurulur ve altından geçilir', arch && map.get(road.x, road.y) === 'path' && map.isWalkable(road.x, road.y) && map.getOccupant(road.x, road.y) === arch.id && scene.world.isReachable(road.x, road.y));
    check('kemerin üstüne başka yapı kurulamaz', arch && !scene.construction.checkPlacement('bench', road.x, road.y).ok);
    const neighbor = arch && [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: road.x + dx, y: road.y + dy })).find((t) => map.isWalkable(t.x, t.y));
    check('yol bulma kemerin içinden geçer', neighbor && scene.world.findPath(neighbor, { x: road.x, y: road.y }));
    window.__arch = arch && { id: arch.id, x: road.x, y: road.y };
    // Yan yana iki çit birleşir
    let spot = null;
    for (let r = 3; r < 30 && !spot; r++) {
      for (let dy = -r; dy <= r && !spot; dy++) {
        for (let dx = -r; dx <= r && !spot; dx++) {
          const x = plaza.centerX + dx;
          const y = plaza.centerY + dy;
          if (scene.construction.checkPlacement('flowerFence', x, y).ok && scene.construction.checkPlacement('flowerFence', x + 1, y).ok) spot = { x, y };
        }
      }
    }
    const f1 = scene.construction.placeSite('flowerFence', spot.x, spot.y).building;
    const f2 = scene.construction.checkPlacement('flowerFence', spot.x + 1, spot.y).ok ? scene.construction.placeSite('flowerFence', spot.x + 1, spot.y).building : null;
    for (const f of [f1, f2].filter(Boolean)) {
      const job = scene.jobs.jobs.find((j) => j.buildingId === f.id);
      if (job) scene.jobs.cancel(job);
      scene.construction.complete(f);
    }
    check('yan yana çiçekli çitler birleşir', f1?.connect?.right && f2?.connect?.left && !f1.connect.left);
    // Kiraz ağacı mevsimle değişir
    const cherry = sim.place('cherryTree');
    const { getStructureSprite } = await import('/src/art/sprites/index.js');
    check('kiraz ağacı kurulur, dört mevsim ayrı görünür', cherry && new Set(['spring', 'summer', 'autumn', 'winter'].map((season) => getStructureSprite('cherryTree', { season }))).size === 4);
    // Çardak: iki oturak; iki sakin oturup sohbet eder, arkadaşlık hızla gelişir
    const gazebo = sim.place('gazebo');
    const seats = gazebo ? scene.world.getGatherSpots(gazebo) : [];
    check('çardak kurulur, iki oturaklı', gazebo && seats.length === 2 && seats.every((t) => t.seat));
    const [a, b] = s.characters.filter((c) => !c.isChild && !c.away && !c.illness && c.visible).slice(-2);
    const brain = scene.behavior.brain;
    for (const c of [a, b]) scene.behavior.endTask(c);
    const planA = brain.planGathering(a, gazebo);
    scene.behavior.startPlan(a, planA, s.time.hour);
    const planB = brain.planGathering(b, gazebo, planA.spot);
    scene.behavior.startPlan(b, planB, s.time.hour);
    const rel0 = scene.relationships.get(a, b);
    let both = false;
    for (let i = 0; i < 12 && !both; i++) {
      hours(0.25);
      both = [a, b].every((c) => c.task?.activity === 'gazebo' && c.task.phase === 'perform');
    }
    hours(0.25);
    const sat = [a, b].every((c) => c.task?.activity === 'gazebo' && c.pose === 'sit');
    check('iki sakin çardakta oturup sohbet eder', both && sat, `${a.task?.activity}/${a.pose} ${b.task?.activity}/${b.pose}`);
    check('çardakta arkadaşlık gelişir (x1,6), aşk olasılığı x2,5', scene.relationships.get(a, b) > rel0 && ACTIVITIES.gazebo.friendshipMultiplier === 1.6 && ACTIVITIES.gazebo.romanceMultiplier === 2.5);
  }

  // --- Sakin adı ---
  {
    const c = s.characters.find((x) => !x.isChild);
    const other = s.characters.find((x) => x !== c);
    const old = c.name;
    game.events.emit('ui:renameCharacter', { id: c.id, name: '  Deniz  Ulaş  ' });
    check('sakinin adı değiştirilir', c.name === 'Deniz Ulaş' && c.customName && s.journal.at(-1).text.includes(old));
    game.events.emit('ui:renameCharacter', { id: c.id, name: other.name });
    game.events.emit('ui:renameCharacter', { id: c.id, name: '   ' });
    check('boş ya da başkasının adı verilemez', c.name === 'Deniz Ulaş');
    game.events.emit('ui:renameCharacter', { id: c.id, name: 'Çokuzunbiradıolankasabalı' });
    check('ad en çok 16 harf', c.name.length === 16);
    window.__renamed = { id: c.id, name: c.name };
  }

  // --- İşçi atama / sabitleme ---
  {
    const lumber = scene.world.getCompleted('lumberHut').find((b) => !b.damaged);
    lumber.excludedWorkers.clear();
    const adults = s.characters.filter((c) => !c.isChild && !c.away && c.visible);
    const pinned = adults[0];
    const free = adults[1];
    game.events.emit('ui:pinWorker', { buildingId: lumber.id, characterId: pinned.id });
    check('sakin iş yerine sabitlenir', pinned.workplaceId === lumber.id);
    const origin = { x: pinned.tileX, y: pinned.tileY };
    const work = scene.jobs.findWorkFor(pinned, origin);
    check('sabit sakin yalnızca kendi iş yerinde çalışır', work === null || (work.building === lumber && !work.job));
    if (lumber.workerSlots === 1) {
      const other = scene.jobs.findWorkFor(free, { x: free.tileX, y: free.tileY });
      check('sabit çalışanın yuvası başkasına verilmez', !other || other.building !== lumber);
      game.events.emit('ui:pinWorker', { buildingId: lumber.id, characterId: free.id });
      check('yuva sayısından fazla sakin sabitlenemez', free.workplaceId === null);
    }
    for (let i = 0; i < 96 && !(s.time.hour >= 9 && s.time.hour < 12); i++) hours(0.25);
    let worked = false;
    for (let i = 0; i < 16 && !worked; i++) {
      hours(0.25);
      worked = pinned.task?.workBuildingId === lumber.id;
      if (pinned.task?.jobId || (pinned.task?.workBuildingId && pinned.task.workBuildingId !== lumber.id)) break;
    }
    check('sabit sakin mesaide kendi iş yerine gider', worked, `${pinned.task?.activity} ${sim.stamp()}`);
    game.events.emit('ui:unpinWorker', { characterId: pinned.id });
    check('sabitleme kaldırılır', pinned.workplaceId === null);
    window.__pin = { id: free.id, buildingId: lumber.id };
    game.events.emit('ui:pinWorker', { buildingId: lumber.id, characterId: free.id });
  }

  // --- Kasaba Arşivi ve istatistikler ---
  {
    const len0 = s.history.length;
    const day0 = s.time.day;
    while (s.time.day === day0) hours(1);
    check('her gün başında arşive özet yazılır', s.history.length >= Math.min(64, len0 + 1) && s.history.at(-1).day === s.time.day && ['population', 'welfare', 'stock', 'gold'].every((k) => Number.isFinite(s.history.at(-1)[k])));
    const w0 = s.stats.weddings;
    const b0 = s.stats.births;
    const [x, y] = s.characters;
    game.events.emit('relationship:married', { a: x, b: y, venue: null, festival: false });
    game.events.emit('family:childBorn', { child: x, parents: [x, y], home: null });
    check('düğün ve doğum sayaçları', s.stats.weddings === w0 + 1 && s.stats.births === b0 + 1);
    s.stats.weddings = w0;
    s.stats.births = b0;
    const saved = s.history.slice();
    for (let i = 0; i < 80; i++) s.history.push({ ...saved.at(-1), day: -i });
    scene.stats.record();
    check('arşiv en çok 64 gün saklar', s.history.length === 64);
    s.history = saved;
    game.events.emit('ui:toggleStats');
    game.render(0);
    const archive = document.querySelector('.archive');
    check('Kasaba Arşivi açılır: 4 grafik ve tarih', archive && !archive.hidden && archive.querySelectorAll('canvas').length === 4 && archive.querySelectorAll('.archive-total').length >= 12);
    game.events.emit('ui:toggleStats');
    // Fotoğraf modu
    game.events.emit('ui:toggleCinematic');
    const layer = document.getElementById('ui-layer');
    check('fotoğraf modu arayüzü gizler', layer.classList.contains('is-cinematic') && scene.cinematic);
    game.render(0);
    game.events.emit('ui:toggleCinematic');
    check('fotoğraf modundan çıkılır', !layer.classList.contains('is-cinematic') && !scene.cinematic);
    game.events.emit('ui:toggleCinematic');
    s.dilemma.history = {};
    dil.maybeStart('bards');
    check('karar penceresi açılınca fotoğraf modu biter', !layer.classList.contains('is-cinematic') && !scene.cinematic);
    game.events.emit('ui:chooseDilemma', { optionId: s.dilemma.active.defaultId });
  }

  // --- Kayıt gidiş-dönüşü (sürüm 11) ---
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
  check('kayıt sürümü 11', raw.version === 11);
  check('kayıttan yadigârlar, ipek ve fermanlar döner', RELIC_KEYS.every((id) => s2.luxury.relics[id]) && s2.luxury.silk && s2.luxury.decreeDays.goldBonus !== undefined && s2.luxury.goldSpent === s.luxury.goldSpent);
  check('kayıttan arşiv ve sayaçlar döner', s2.history.length === s.history.length && s2.stats.weddings === s.stats.weddings);
  check('kayıttan sakin adı ve sabit işçi döner', s2.characters.some((c) => c.id === window.__renamed.id && c.name === window.__renamed.name && c.customName) && s2.characters.find((c) => c.id === window.__pin.id)?.workplaceId === window.__pin.buildingId, `${s2.characters.map((c) => c.name).join(',')} pin ${s2.characters.find((c) => c.id === window.__pin.id)?.workplaceId}/${window.__pin.buildingId} önce ${s.characters.find((c) => c.id === window.__pin.id)?.workplaceId}`);
  check('kayıttan kemer yine altından geçilir', !window.__arch || (game.scenes.current.world.map.isWalkable(window.__arch.x, window.__arch.y) && game.scenes.current.world.map.getOccupant(window.__arch.x, window.__arch.y) === window.__arch.id));
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
