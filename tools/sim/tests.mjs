// Hedefli testler: oyunun kurallarını tarayıcıda, gerçek sistemlerle tek tek dener.
// Kullanım: node tools/sim/tests.mjs   (sunucu: python3 tools/serve.py)
//   10. aşama: yiyecek değeri, seviye kilitleri, eski usul / asıl tarif, tüccar malları, belediye, unvan, yerleşim
//   11. aşama: hastalık ve şifacı, kasaba hayvanları ve sevme, yaban hayatının ürkmesi, karar olayları (zaman aşımı,
//              fırtına hasarı ve onarım, keşif seferi), belediye fermanları, kayıt gidiş-dönüşü
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

  // --- Kayıt gidiş-dönüşü (sürüm 9) ---
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
  check('kayıt sürümü 9', raw.version === 9);
  check('kayıttan hayvanlar ve adları döner', s2.animals.length === animals && s2.animals.some((a) => a.name === cat.name));
  check('kayıttan hastalık, iksir ve hasar döner', ill2?.illness && s2.buildings.find((b) => b.id === hut.id)?.remedies === 4 && s2.buildings.find((b) => b.id === farm.id)?.damaged);
  check('kayıttan ferman ve fırtına döner', s2.civic.storageLevel === 1 && s2.civic.craftGuild && s2.dilemma.storm?.fortified);
  return out;
});
results.push(...pageResults);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
