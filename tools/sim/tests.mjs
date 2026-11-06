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
//              Kasaba Arşivi ve sayaçlar, fotoğraf modu
//   14. aşama: tekne kapasitesi ve Büyük İhracat Seferi, sabah sisi ve yaz fırtınası (şimşek), dört mevsim festivali
//              (duyuru, yer, süsleme, katılım, anı, Mevsim Coşkusu), anılar ve nostalji, hayvan sevme, öncelikli kesim,
//              Toplanma Zili
//   16. aşama: maceralı keşif seferi (risk, usta ve alet, kaza, dönüş, anı, hikâye), egzotik ganimetler (asma, meşale,
//              harita, yadigâr parçası), harabe yazıtları ve imar şemaları, kayıt sürümü 14
//   18. aşama: inşa menüsü sekmeleri, zemin fırçaları (maliyet, hız, kesintisiz sürükleme, otomatik viraj / kavşak),
//              yağmurda çamur, A*'ın yolları öncelikli kullanması, yıkım fırçası (%50 iade, küsurat), ahşap çit ve kapı
//              bağlantıları, mahalle tabelası, çevre estetiği (keyif, anı, refah çarpanı), karanlık ve fener, park bankı,
//              süs ağaçlarının büyümesi ve gölgesi, kayıt sürümü 15
//   19. aşama: Türkçe ad ekleri, karakter huyları (dağıtım, kalıtım, Hayvansever / Kitap Kurdu / Müzisyen / Doğa Tutkunu
//              davranışları), flört ve randevu (çardak, han, yan yana iki bank; ilişki bonusu, ilk randevu anısı, bankta aşk),
//              evlenen çiftin aynı kulübeye taşınması ve boşalan kulübenin göçmenlere açılması, meydanda düğün kutlaması ve
//              konfeti, evli çiftin akşam yemeği, dedikodu (haber oluşturma, sohbette ve selamlaşırken aktarma, Yaşam Günlüğü
//              notu, yayılma, eskime), Karakter Detay Kartı'nın Sosyal Hayat bölümü, kayıt sürümü 16
//   20. aşama: Ulu Saat Kulesi (Kasaba seviyesi + 20 sakin, üç aşama ve malzemeleri, ustalık katkısı, Kadim Dişli dökümü,
//              Tarihçe'ye yazılan emek), Altın Çağ (çalışma şevki ve refah +%10, 08:00 / 18:00 çanı ve ses dalgası, Çağ
//              Kutlaması), prestij peyzajı (Mermer Çeşme, Altın Çağ Feneri), tüccarın nadir malları, Tarihçe Kütüğü sekmesi,
//              kayıt sürümü 17
//   15. aşama: sosyal denge (gönül alma yerleri, el sıkışma, yerli barışma anısı), meslek kıyafetleri ve zanaat
//              rozeti, usta işi eserler (üretim, sergileme, satış, refah), kayıt sürümü 13
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
  // (16. aşama) yolda açılan macera penceresi oyunu durdurur (30 sn sonra güvenli seçenek): sefer bitene dek beklenir
  for (let i = 0; i < 80 && (s.dilemma.expedition || s.characters.some((c) => c.away)); i++) hours(0.5);
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
  // (20. aşama) Ulu Saat Kulesi: Kasaba seviyesinde ve 20 sakinle açılır
  s.town.tier = 2;
  check('Ulu Saat Kulesi Köy seviyesinde açılmaz', !sim.findSpot('wonder') && scene.construction.checkPlacement('wonder', plaza.centerX + 6, plaza.centerY + 6).reason.includes('Kasaba'));
  s.town.tier = 3;
  const popReason = scene.construction.checkPlacement('wonder', plaza.centerX + 6, plaza.centerY + 6).reason;
  check('Ulu Saat Kulesi 20 sakinle açılır', s.characters.length >= 20 || popReason.includes('20 sakine'), popReason);
  const keepPop = BUILDINGS.wonder.requiresPopulation;
  BUILDINGS.wonder.requiresPopulation = Math.min(keepPop, s.characters.length); // test kasabası küçük: nüfus koşulu geçici olarak karşılanır
  s.town.tier = 4;
  sim.give({ wood: 600, stone: 1200, iron: 600, wool: 400, bread: 500, gold: 3000, gears: 8 });
  {
    // Harikanın şantiyesi iptal edilebilir (tam iade); bitmiş harika yıkılamaz
    const gold0 = s.resources.gold;
    const site = sim.place('wonder', { instant: false });
    const cancel = site ? scene.construction.demolishAt(site.tileX, site.tileY) : { ok: false };
    check('harika şantiyesi iptal edilebilir', site && cancel.ok && !s.buildings.includes(site) && s.resources.gold === gold0, cancel.reason);
  }
  sim.give({ wood: 600, stone: 1200, iron: 600, wool: 400, bread: 500, gold: 3000, gears: 8 }); // iade depo sınırına takılır: yeniden ver
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
  BUILDINGS.wonder.requiresPopulation = keepPop;

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
  check('Denizci Pusulası: tekne +%50 yük, altın +%20', H13.boatCapacity(s) === Math.round(EXPORT.capacity * 1.5) && H13.cargoValue({ wood: 100 }, L.relicExportValue(s)) === 120);
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
    // (17. aşama) Arşiv ortalanmış bir penceredir: arkasında karartılmış zemin, köşede ✕
    const archive = document.querySelector('.archive-panel');
    const layerEl = document.getElementById('ui-layer');
    check(
      'Kasaba Arşivi ortalanmış pencerede açılır: 4 grafik ve tarih',
      archive && !archive.hidden && archive.classList.contains('modal-window') && layerEl.classList.contains('has-modal') && archive.querySelector('.modal-close') &&
        archive.querySelectorAll('canvas').length === 4 && archive.querySelectorAll('.archive-total').length >= 12
    );
    game.events.emit('ui:toggleStats');
    check('Arşiv kapanınca zemin karartması kalkar', archive.hidden && !layerEl.classList.contains('has-modal') && document.querySelector('.modal-backdrop').hidden);
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

  // ===== 14. aşama =====
  const clickAt = (wx, wy) => {
    // Haritaya gerçek bir sol tık: dünya noktasını ekrana çevirip girdiye bırakır, sahne bir karede işler
    const cam = scene.camera;
    game.input.pendingClick = { x: (wx - cam.x) * cam.zoom, y: (wy - cam.y) * cam.zoom };
    sim.step(1);
  };
  // --- Rötuş: tekne kapasitesi ve Büyük İhracat Seferi ---
  check('ticaret teknesi taban kapasitesi %35 arttı (864)', EXPORT.capacity === 864);
  {
    for (let i = 0; i < 60 && s.trade.boat; i++) hours(0.25);
    s.resources.gold = 100;
    check('Büyük İhracat Seferi altın ister', !H13.grandVoyageStatus(s).ok);
    sim.give({ gold: 1000, wood: 1600, stone: 1500, food: 900 });
    const gold0 = s.resources.gold;
    game.events.emit('ui:grandVoyage', { buildingId: harbor.id });
    check('Büyük İhracat Seferi ilan edilir, kervan hemen yola çıkar', s.resources.gold === gold0 - EXPORT.grandVoyage.price && s.trade.boat?.grand && s.trade.grandDay === s.time.day);
    check('aynı gün ikinci sefer ilan edilemez', !H13.grandVoyageStatus(s).ok);
    let shipped = null;
    const off = game.events.on('harbor:shipped', (p) => (shipped = p));
    for (let i = 0; i < 80 && !shipped; i++) hours(0.25);
    off();
    const units = shipped ? Object.values(shipped.cargo).reduce((a, b) => a + b, 0) : 0;
    check('kervan teknesi 2,5 kat yük alır ve 350 sınırına boşaltır', shipped?.grand && units > H13.boatCapacity(s) && units <= H13.boatCapacity(s, true), `${units} birim`);
    check('kervan yükü %10 daha değerli', shipped && shipped.gold === H13.cargoValue(shipped.cargo, L.relicExportValue(s) * EXPORT.grandVoyage.valueBonus));
  }

  // --- Hava: sis ve yaz fırtınası ---
  {
    const { WEATHER_TYPES } = await import('/src/data/weather.js');
    scene.weather.force('mist');
    hours(1.5);
    const left = (s.weather.nextChangeAt - s.totalMinutes) / 60;
    check('sabah sisi çöker (yoğunluk ve süre)', s.weather.mist > 0.9 && left > 0 && left <= 4.5, `${s.weather.mist.toFixed(2)} · ${left.toFixed(1)} sa kaldı`);
    check('sis dinlendirir: dışarıda keyif yavaş düşer', WEATHER_TYPES.mist.funDecay < 1);
    // Zar: yazın öğleden sonra fırtına çıkabilir, kışın çıkmaz
    const day0 = s.time.day;
    const type0 = s.weather.type;
    const rolls = { summer: 0, winter: 0 };
    for (let d = 0; d < 40; d++) {
      for (const [season, base] of [['summer', 5], ['winter', 13]]) {
        s.time.day = base + (d % 4) + 16 * Math.floor(d / 4);
        s.weather.type = 'sunny';
        if (scene.weather.rollSpecial(14) === 'thunderstorm') rolls[season]++;
      }
    }
    s.time.day = day0;
    check('gök gürültülü fırtına yalnızca yazın, ara sıra', rolls.summer > 3 && rolls.summer < 30 && rolls.winter === 0, JSON.stringify(rolls));
    scene.weather.force('thunderstorm');
    let flashes = 0;
    const off = game.events.on('weather:lightning', () => flashes++);
    sim.step(400);
    const rainPeak = s.weather.rain;
    sim.step(2000);
    off();
    check('fırtınada şimşek çakar ve gök gürler', flashes >= 2 && rainPeak > 0.9 && WEATHER_TYPES.thunderstorm.downpour > 1, `${flashes} şimşek · yağmur ${s.weather.rain.toFixed(2)} · ${s.weather.type} · duraklı ${s.time.paused}`);
    scene.weather.force(type0 === 'mist' || type0 === 'thunderstorm' ? 'sunny' : type0);
  }

  // --- Mevsim festivalleri ---
  {
    const { SEASON_FESTIVALS } = await import('/src/data/festivals.js');
    const SF = await import('/src/systems/SeasonFestivalSystem.js');
    check('festival günleri mevsimin son günü', SF.isFestivalDay(4) && SF.isFestivalDay(8) && SF.isFestivalDay(16) && !SF.isFestivalDay(5) && !SF.isFestivalDay(3));
    // Duyuru: festival günü sabah 08:00
    const day0 = s.time.day;
    const fday = day0 + ((4 - (day0 % 4)) % 4 || 0) || day0;
    s.time.day = SF.isFestivalDay(day0) ? day0 : day0 + (4 - (day0 % 4));
    const announced = [];
    const offA = game.events.on('seasonFestival:announced', (p) => announced.push(p.theme));
    scene.seasonFestivals.onHour(8);
    offA();
    check('festival günü sabah duyurulur', announced.length === 1 && s.seasonFestival.stage === 'announced' && SF.currentSeasonFestival(s)?.stage === 'announced');
    s.time.day = day0;
    s.seasonFestival.stage = null;
    for (const theme of ['spring', 'summer', 'autumn', 'winter']) {
      if (s.events.festival.active) scene.townEvents.endFestival();
      Object.assign(s.seasonFestival, { day: s.time.day, theme, stage: 'announced' });
      const started = scene.seasonFestivals.start();
      const f = s.events.festival;
      const venue = scene.world.getBuilding(f.venueId);
      const expectVenue = SEASON_FESTIVALS[theme].venues.find((t) => scene.world.getCompleted(t).length);
      check(`${SEASON_FESTIVALS[theme].name}: başlar, yeri ve süslemeleri kurulur`, started && f.active && f.theme === theme && venue?.type === expectVenue && s.seasonFestival.decor.length >= 1 && (s.buffs[SEASON_FESTIVALS[theme].buff] ?? 0) > s.totalMinutes, `${venue?.type} · ${s.seasonFestival.decor.map((d) => d.kind).join(',')}`);
      hours(1.5);
      const attendees = s.seasonFestival.attendees.length;
      if (theme === 'spring') check('Çiçek Şenliği: herkes saçına çiçek takar, aşk ve dostluk artar', s.characters.every((c) => c.flowerCrown) && buffMultiplier(s, 'romance') >= 2.5 && buffMultiplier(s, 'friendship') >= 1.8);
      if (theme === 'winter') check('Işıklar Gecesi: şölen ateşi festivaldekileri ısıtır, kardan adam yükselir', s.characters.filter((c) => s.seasonFestival.attendees.includes(c.id)).every((c) => (c.buffs.warmUntil ?? 0) > s.totalMinutes) && s.seasonFestival.decor.some((d) => d.kind === 'snowman'));
      const ends = [];
      const offE = game.events.on('seasonFestival:ended', (p) => ends.push(p));
      scene.townEvents.endFestival();
      offE();
      const memory = SEASON_FESTIVALS[theme].memory;
      const remembered = s.characters.filter((c) => c.memories.some((m) => m.text === memory)).length;
      check(`${SEASON_FESTIVALS[theme].name}: sakinler katılır, biter, anılara yazılır, Mevsim Coşkusu`, attendees >= 3 && ends.length === 1 && remembered === attendees && !s.events.festival.active && s.seasonFestival.held[theme] >= 1 && (s.buffs.seasonCheer ?? 0) > s.totalMinutes, `${attendees} katılımcı, ${remembered} anı`);
    }
    check('festival bitince çiçek taçları çıkar ve süslemeler kaldırılır', s.characters.every((c) => !c.flowerCrown) && s.seasonFestival.decor.length === 0);
  }

  // --- Anılar ve hatıralar ---
  {
    const { MEMORY, addMemory } = await import('/src/systems/MemorySystem.js');
    const [a, b] = s.characters.filter((c) => !c.isChild);
    const before = a.memories.length;
    game.events.emit('relationship:married', { a, b, venue: null, festival: true });
    check('düğün iki sakinin de anısına yazılır', a.memories.at(-1).text === `${b.name} ile şenlikte evlendi` && b.memories.at(-1).text === `${a.name} ile şenlikte evlendi` && a.memories.length === before + 1);
    game.events.emit('skill:levelUp', { character: a, skill: 'masonry', level: { level: 3, name: 'Usta' } });
    check('Usta unvanı anıya yazılır', a.memories.at(-1).text === 'Usta Taşçı unvanını kazandı');
    {
      // Kalabalıkta dostluk anıları sınırlı; en iyi arkadaşlık "dost oldu"nun yerini alır
      const others = s.characters.filter((c) => c !== a && c !== b);
      const friendLevel = { key: 'friend', name: 'Dost' };
      const kept = a.memories.slice();
      for (const o of others.slice(0, 7)) game.events.emit('relationship:levelUp', { a, b: o, level: friendLevel });
      const dostCount = a.memories.filter((m) => m.text.endsWith(' ile dost oldu')).length;
      // Bu testte dost olunanlardan, daha önce en iyi arkadaşı olmamış biri (anılar yinelenmez)
      const pal = others
        .slice(0, 7)
        .find((o) => a.memories.some((m) => m.text === `${o.name} ile dost oldu`) && !a.memories.some((m) => m.text === `${o.name} ile en iyi arkadaş oldu`));
      game.events.emit('relationship:levelUp', { a, b: pal, level: { key: 'bestFriend', name: 'En İyi Arkadaş' } });
      check('dostluk anıları sınırlı; en iyi arkadaşlık eski dostluk anısının yerini alır', dostCount <= MEMORY.friends && !a.memories.some((m) => m.text === `${pal.name} ile dost oldu`) && a.memories.at(-1).text === `${pal.name} ile en iyi arkadaş oldu`, `${dostCount} dostluk`);
      a.memories = kept;
    }
    game.events.emit('health:cured', { character: a, building: null, wasIll: true });
    check('hastalanıp iyileşmek anıya yazılır', a.memories.at(-1).text.includes("Şifacı'nın iksiriyle iyileşti"));
    const first = a.memories[0].text;
    for (let i = 0; i < 60; i++) addMemory(s, a, `deneme ${i}`, 'heart');
    check('anılar en çok 40; ilk anı korunur', a.memories.length === MEMORY.max && a.memories[0].text === first && a.memories.at(-1).text === 'deneme 59');
    check('her sakinin bir hayat hikâyesi var', s.characters.every((c) => c.memories.length >= 1));
    {
      // Defter dolunca önce küçük anılar (dostluk...) silinir; aynı anı yinelenmez
      const saved = b.memories.slice();
      b.memories = [saved[0]];
      addMemory(s, b, 'Düğün anısı', 'ring', { kind: 'wedding' });
      addMemory(s, b, 'Kaan ile dost oldu', 'heart', { kind: 'friend' });
      addMemory(s, b, 'Kaan ile dost oldu', 'heart', { kind: 'friend' });
      const dup = b.memories.filter((m) => m.text === 'Kaan ile dost oldu').length;
      for (let i = 0; i < 60; i++) addMemory(s, b, `dost ${i}`, 'heart', { kind: 'friend' });
      check('aynı anı yinelenmez; defter dolunca önce dostluk anıları silinir, düğün kalır', dup === 1 && b.memories.length === MEMORY.max && b.memories.some((m) => m.text === 'Düğün anısı') && b.memories[0] === saved[0]);
      b.memories = saved;
    }
    // Nostalji: sakin bankta otururken güzel bir anısını hatırlar
    a.recall = null;
    a.needs.fun = 40;
    const task0 = a.task;
    a.task = { activity: 'bench', phase: 'perform', elapsed: 0, duration: 60 };
    const recalled = [];
    const offR = game.events.on('memory:recalled', (p) => recalled.push(p));
    scene.memories.update({ gameMinutes: 2000 });
    scene.memories.update({ gameMinutes: 2000 });
    offR();
    a.task = task0;
    check('sakin bankta güzel bir anısını hatırlar: keyif ve anı balonu', recalled.length === 1 && recalled[0].character === a && a.needs.fun >= 40 + MEMORY.fun - 1e-6 && a.recall?.text === recalled[0].memory.text, `${recalled.length} kez`);
    game.events.emit('ui:selectCharacter', a.id);
    game.render(0);
    const rows = document.querySelectorAll('.memory-row').length;
    check('Karakter Paneli anıları listeler (son 5 / tümü)', rows === 5 && document.querySelector('.memory-toggle') && !document.querySelector('.memory-toggle').hidden, `${rows} satır`);
    game.events.emit('ui:selectCharacter', null);
  }

  // --- Oyuncunun dünyayla etkileşimi ---
  {
    // Kediyi / köpeği fareyle sevmek
    const pet = s.animals.find((x) => x.isPet && x.visible);
    const cheers = [];
    const offC = game.events.on('pet:cheered', (p) => cheers.push(p));
    scene.camera.centerOn(pet.x, pet.y, game.renderer.width, game.renderer.height);
    clickAt(pet.x, pet.y - 4);
    offC();
    check('kediye / köpeğe tıklayınca sevinçle zıplar, kalpler uçuşur', cheers.length === 1 && cheers[0].animal === pet && pet.cheer > 0, `${pet.kind} ${pet.name}`);
    // Öncelikli kesim: ağaca tıklamak
    const map = scene.world.map;
    let tree = null;
    for (let r = 2; r < 25 && !tree; r++) {
      for (let dy = -r; dy <= r && !tree; dy++) {
        for (let dx = -r; dx <= r && !tree; dx++) {
          const x = plaza.centerX + dx;
          const y = plaza.centerY + dy;
          if ((map.getObject(x, y) === 'oak' || map.getObject(x, y) === 'pine') && !scene.jobs.jobAt(x, y) && scene.world.getApproachSpots(x, y).length) tree = { x, y };
        }
      }
    }
    const idle = s.characters.find((c) => !c.isChild && c.visible && !c.away && c.workplaceId === null);
    scene.behavior.endTask(idle);
    scene.behavior.startPlan(idle, scene.behavior.brain.resolveLeisure(idle, 'stroll', 12) ?? { activity: 'wait', duration: 30, spot: { x: idle.tileX, y: idle.tileY } }, 12);
    scene.camera.centerOn(tree.x * 16 + 8, tree.y * 16 + 8, game.renderer.width, game.renderer.height);
    const urgent = [];
    const offU = game.events.on('job:urgent', (p) => urgent.push(p));
    clickAt(tree.x * 16 + 8, tree.y * 16 + 10);
    offU();
    const job = scene.jobs.jobAt(tree.x, tree.y);
    check('ağaca tıklayınca öncelikli kesim emri verilir', job?.urgent && job.type === 'chop' && urgent.length === 1);
    const other = scene.jobs.designate(...(() => {
      for (let r = 2; r < 25; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = plaza.centerX + dx;
        const y = plaza.centerY + dy;
        if (map.getObject(x, y) === 'rock' && !scene.jobs.jobAt(x, y)) return [x, y];
      }
      return [0, 0];
    })());
    const pick = scene.jobs.findWorkFor(idle, { x: idle.tileX, y: idle.tileY });
    check('öncelikli hedef bütün işlerden önce seçilir', pick?.job === job, pick?.job?.type);
    if (other) scene.jobs.cancel(other);
    check('boştaki işçi elindekini bırakıp koşar', urgent.length === 1 && (!idle.task || idle.task.activity !== 'stroll'));
    // Toplanma Zili
    const R = await import('/src/systems/RallySystem.js');
    for (let i = 0; i < 96 && !(s.time.hour >= 10 && s.time.hour < 13); i++) hours(0.25);
    s.rally = null;
    check('toplanma zili çalınabilir', R.rallyStatus(s).ok);
    game.events.emit('ui:rallyBell');
    check('zil çalınca toplanma bir saat sürer', R.isRallyActive(s) && s.rally.until - s.totalMinutes === 60);
    hours(0.5);
    const gathered = s.characters.filter((c) => c.task?.activity === 'rally').length;
    const awake = s.characters.filter((c) => c.visible && !c.away).length;
    check('uyanık sakinler meydanda toplanır', gathered >= Math.max(3, Math.floor(awake * 0.6)), `${gathered}/${awake}`);
    game.events.emit('ui:rallyBell');
    check('zil hemen yeniden çalınamaz', !R.rallyStatus(s).ok);
    hours(0.75);
    check('bir saat sonra toplanma biter', !R.isRallyActive(s) && s.rally.ended);
    window.__mem = { id: s.characters[0].id, count: s.characters[0].memories.length };
  }

  // ===== 15. aşama =====
  {
    const { RECONCILE, CONFLICT } = await import('/src/data/family.js');
    const { OPPOSING_TRAITS } = await import('/src/data/characters.js');
    const { MASTERPIECES, MASTERWORK } = await import('/src/data/masterpieces.js');
    const MW = await import('/src/systems/Masterworks.js');
    const { townHappinessBonus: bonusOf } = await import('/src/systems/TownStatus.js');
    const { getCharacterSprite } = await import('/src/art/sprites/index.js');
    const sc = () => game.scenes.current;
    const adults = s.characters.filter((c) => !c.isChild && !c.away);
    const [ra, rb, rc] = adults;
    const rel = sc().relationships;

    // --- Sosyal denge ---
    check('atışma bekleme süresi uzadı, olasılıklar törpülendi', CONFLICT.cooldownMinutes >= 600 && CONFLICT.encounterChancePerMinute <= 0.004 && CONFLICT.workChancePerMinute <= 0.012);
    const rate = (place) => {
      let ok = 0;
      const off = game.events.on('relationship:reconciled', () => ok++);
      for (let i = 0; i < 3000; i++) {
        rel.set(ra, rb, -30);
        sc().conflicts.tryReconcile(ra, rb, place, 1);
      }
      off();
      return ok / 3000;
    };
    const chatRate = rate('chat');
    const venueRates = ['inn', 'gazebo', 'campfire', 'festival'].map(rate);
    check('gönül alma yerlerinde (han, çardak, ateş, festival) barışma olasılığı 4 kat (+%300)', venueRates.every((r) => r > chatRate * 3 && r < chatRate * 5.5), `sohbet ${chatRate.toFixed(3)} · ${venueRates.map((r) => r.toFixed(3)).join(' ')}`);
    // Barışma: el sıkışma balonu, yerli anı ve günlük
    rel.set(ra, rb, -30);
    ra.visible = true;
    rb.visible = true;
    let tries = 0;
    while (rel.get(ra, rb) < RECONCILE.below && tries++ < 500) sc().conflicts.tryReconcile(ra, rb, 'inn', 5);
    check('barışınca başlarında el sıkışma balonu çıkar', ra.bubble?.icon === 'handshake' && rb.bubble?.icon === 'handshake', ra.bubble?.icon);
    check("barışma anısı yeriyle yazılır (Han'da ... ile barıştı)", ra.memories.some((m) => m.text === `Han'da ${rb.name} ile barıştı`) && rb.memories.some((m) => m.text === `Han'da ${ra.name} ile barıştı`), ra.memories.at(-1).text);
    check('barışma günlüğe ve sayaca yazılır', s.journal.at(-1).text.includes('handa barıştı') && s.stats.reconciliations >= 1, s.journal.at(-1).text);
    // Gönül alma yerinde zıt kişilikliler atışmaz; meydanda atışabilir
    const [tx, ty] = OPPOSING_TRAITS[0];
    const traits = [ra.traits, rb.traits];
    ra.traits = [tx];
    rb.traits = [ty];
    const quarrels = (activity) => {
      let n = 0;
      const off = game.events.on('relationship:quarrel', () => n++);
      sc().conflicts.cooldowns.clear();
      rel.set(ra, rb, 0);
      for (let i = 0; i < 600; i++) {
        sc().relationships.groups = [{ kind: 'chat', activity, buildingId: null, members: [ra, rb] }];
        sc().conflicts.update({ gameMinutes: 10, hour: 12 });
        sc().conflicts.cooldowns.clear();
        if (rel.get(ra, rb) < 0) rel.set(ra, rb, 0);
      }
      off();
      return n;
    };
    const atGazebo = quarrels('gazebo');
    const atFountain = quarrels('fountain');
    check('çardakta / handa atışılmaz, meydanda atışılabilir', atGazebo === 0 && atFountain > 0, `çardak ${atGazebo} · meydan ${atFountain}`);
    [ra.traits, rb.traits] = traits;
    rel.set(ra, rb, 20);

    // --- Meslek kıyafetleri ---
    const skills0 = { ...rc.skills };
    rc.skills = {};
    sc().craftsmanship.refreshOutfit(rc);
    check('Çırak sade köylü giysisi giyer', rc.outfit === null);
    rc.skills = { mining: 600 };
    sc().craftsmanship.refreshOutfit(rc);
    check('Kalfa madenci bandana ve fener takar', rc.outfit === 'miner:2' && rc.look.outfit === 'miner:2');
    rc.skills = { mining: 1400 };
    sc().craftsmanship.refreshOutfit(rc);
    const { addExperience } = await import('/src/systems/SkillSystem.js');
    addExperience(game.events, rc, 'mineIron', 200);
    check('Usta olunca kostüm hemen giyilir (kademe atlama olayıyla)', rc.outfit === 'miner:3', rc.outfit);
    const plain = getCharacterSprite(rc.appearance, 'down', 'idle0', { child: false, coat: false, bag: false, outfit: null }).toDataURL();
    const dressed = getCharacterSprite(rc.appearance, 'down', 'idle0', rc.look).toDataURL();
    const coatOnly = getCharacterSprite(rc.appearance, 'down', 'idle0', { child: false, coat: true, bag: false, outfit: null }).toDataURL();
    const coatHelmet = getCharacterSprite(rc.appearance, 'down', 'idle0', { child: false, coat: true, bag: false, outfit: 'miner:3' }).toDataURL();
    check('Usta kostümü sprite üzerinde çizilir; paltoyla kask görünmeye devam eder', plain !== dressed && coatOnly !== coatHelmet);
    const kid = s.characters.find((c) => c.isChild);
    if (kid) {
      kid.skills = { mining: 2000 };
      sc().craftsmanship.refreshOutfit(kid);
    }
    check('çocuklar meslek kıyafeti giymez', !kid || (kid.outfit === null && kid.look.outfit === null));
    const kits = ['woodcutting', 'farming', 'masonry', 'mining', 'herbalism', 'baking', 'cooking', 'husbandry', 'fishing', 'building', 'crafting', 'scholarship'];
    const views = [];
    for (const k of kits) {
      rc.skills = { [k]: 2000 };
      sc().craftsmanship.refreshOutfit(rc);
      for (const f of ['down', 'up', 'left', 'right']) for (const fr of ['idle0', 'walk0', 'sit0']) views.push(getCharacterSprite(rc.appearance, f, fr, rc.look).width);
    }
    check('her meslek kiti her yönde ve karede çizilir', views.length === kits.length * 12 && views.every((w) => w === 12));
    // Zanaat rozeti
    rc.skills = { baking: 2000 };
    sc().craftsmanship.refreshOutfit(rc);
    game.events.emit('ui:selectCharacter', rc.id);
    game.render(0);
    const badge = document.querySelector('.craft-badge');
    check('Karakter Paneli altın zanaat rozetiyle "Usta Fırıncı" gösterir', badge && !badge.hidden && badge.classList.contains('is-gold') && badge.textContent.includes('Usta Fırıncı'), badge?.textContent);
    rc.skills = { baking: 600 };
    sc().craftsmanship.refreshOutfit(rc);
    game.render(0);
    check('Kalfa gümüş rozet', badge.classList.contains('is-silver') && badge.textContent.includes('Kalfa Fırıncı'), badge.textContent);
    game.events.emit('ui:selectCharacter', null);

    // --- Usta işi eserler ---
    const mine = s.buildings.find((b) => b.type === 'ironMine' && b.functional) ?? sim.place('ironMine');
    const mw = s.masterworks;
    rc.skills = { mining: 600 };
    mw.lastByMaker = {};
    let made = 0;
    const offMade = game.events.on('masterwork:created', () => made++);
    for (let i = 0; i < 300; i++) game.events.emit('work:finished', { character: rc, activity: 'mineIron', building: mine });
    check('Kalfa usta işi eser çıkarmaz', made === 0);
    rc.skills = { mining: 2000 };
    rc.workplaceId = null;
    rc.equipment.tool = null;
    const before = mw.items.length;
    for (let i = 0; i < 4000; i++) {
      mw.lastByMaker = {};
      mw.today = 0;
      mw.items = mw.items.filter((it) => it.status !== 'stored');
      game.events.emit('work:finished', { character: rc, activity: 'mineIron', building: mine });
    }
    const baseRate = made / 4000;
    check('Usta mesai sonunda %4 şansla eser çıkarır', baseRate > 0.03 && baseRate < 0.05, baseRate.toFixed(3));
    made = 0;
    rc.workplaceId = mine.id;
    rc.equipment.tool = 'sturdyTool';
    for (let i = 0; i < 4000; i++) {
      mw.lastByMaker = {};
      mw.today = 0;
      mw.items = mw.items.filter((it) => it.status !== 'stored');
      game.events.emit('work:finished', { character: rc, activity: 'mineIron', building: mine });
    }
    const topRate = made / 4000;
    check('sabit iş yeri ve Sağlam Alet şansı %8e çıkarır', topRate > 0.065 && topRate < 0.095, topRate.toFixed(3));
    rc.workplaceId = null;
    // Günde bir eser
    mw.items = mw.items.filter((it) => it.status !== 'stored');
    mw.lastByMaker = {};
    mw.today = 0;
    made = 0;
    for (let i = 0; i < 2000; i++) game.events.emit('work:finished', { character: rc, activity: 'mineIron', building: mine });
    check(`usta iki eser arasında ${MASTERWORK.makerCooldownDays} gün dinlenir`, made === 1, `${made}`);
    {
      // Kasabada günde en çok bir eser: başka bir usta da aynı gün eser çıkaramaz
      const other = adults.find((o) => o !== rc && o !== ra);
      const skillsO = { ...other.skills };
      other.skills = { mining: 2000 };
      let extra = 0;
      const offX = game.events.on('masterwork:created', () => extra++);
      for (let i = 0; i < 2000; i++) game.events.emit('work:finished', { character: other, activity: 'mineIron', building: mine });
      offX();
      other.skills = skillsO;
      check(`kasabada günde en çok ${MASTERWORK.townPerDay} usta işi eser`, extra === 0, `${extra}`);
    }
    offMade();
    const item = mw.items.find((it) => it.status === 'stored');
    check('eser vitrine (depoya) girer, ustanın anısına ve günlüğe yazılır', item?.type === 'ironStatue' && item.maker === rc.name && rc.memories.at(-1).text.includes(MASTERPIECES.ironStatue.name) && s.journal.some((j) => j.text.includes(MASTERPIECES.ironStatue.name)));
    check('eser çıkınca ustanın başında kutlama balonu ve kıvılcımlar', rc.bubble?.icon === 'masterpiece' && rc.celebrateAt !== null);
    // Sergileme
    mw.items = mw.items.filter((it) => it.status !== 'exhibited');
    const happy0 = bonusOf(s);
    game.events.emit('ui:exhibitMasterwork', { id: item.id });
    check('sergilenen eser kasaba refahına kalıcı +1 katar', item.status === 'exhibited' && Math.abs(bonusOf(s) - happy0 - 1) < 1e-9 && MW.masterworkHappiness(s) === 1);
    game.events.emit('ui:exhibitMasterwork', { id: item.id });
    check('aynı eser iki kez sergilenmez', MW.masterworkHappiness(s) === 1);
    // Satış
    const forSale = sc().craftsmanship.create(rc, 'lifeElixir');
    const gold0 = s.resources.gold;
    s.events.merchant.present = false;
    game.events.emit('ui:sellMasterwork', { id: forSale.id, source: 'merchant' });
    check('tüccar yokken tüccara eser satılamaz', forSale.status === 'stored' && s.resources.gold === gold0);
    const harborOk = s.buildings.some((b) => b.type === 'harbor' && b.functional && !b.damaged);
    game.events.emit('ui:sellMasterwork', { id: forSale.id, source: 'harbor' });
    check('eser limandan yüksek fiyata (200-400 altın) ihraç edilir', !harborOk || (forSale.status === 'sold' && s.resources.gold === gold0 + MASTERPIECES.lifeElixir.value && MASTERPIECES.lifeElixir.value >= 200 && MASTERPIECES.lifeElixir.value <= 400), `${s.resources.gold - gold0} altın`);
    check('bütün eserlerin fiyatı liman ve tüccarda 200-400 altın', Object.keys(MASTERPIECES).every((k) => [MW.masterworkPrice(k, 'harbor'), MW.masterworkPrice(k, 'merchant')].every((p) => p >= 200 && p <= 400)));
    // Sergi sınırı
    for (let i = 0; i < 20; i++) game.events.emit('ui:exhibitMasterwork', { id: sc().craftsmanship.create(rc, 'townRug').id });
    check(`sergi katkısı en çok +${MASTERWORK.maxExhibitHappiness}`, MW.masterworkHappiness(s) === MASTERWORK.maxExhibitHappiness);
    // Arşiv vitrini: düğmeden sergileme
    const fresh = sc().craftsmanship.create(rc, 'carvedChest');
    game.events.emit('ui:toggleStats');
    game.render(0);
    const rowEl = [...document.querySelectorAll('.masterwork-row.is-stored')].find((r) => r.textContent.includes(MASTERPIECES.carvedChest.name));
    rowEl?.querySelector('button')?.click();
    game.events.emit('ui:toggleStats');
    check("Kasaba Arşivi'nin vitrininde eser listelenir ve Sergile düğmesi çalışır", rowEl && fresh.status === 'exhibited');
    window.__mw15 = { count: mw.items.length, made: mw.made, exhibited: MW.exhibitedMasterworks(s).length, makerId: rc.id };
    rc.skills = { ...skills0, mining: Math.max(2000, ...Object.values(skills0), 0) + 600 }; // ana mesleği madencilik (sonraki testler saatlerce çalıştırır: pay bırakılır)
    sc().craftsmanship.refreshOutfit(rc);
  }

  // ===== 16. aşama =====
  {
    const X = await import('/src/systems/Exploration.js');
    const D = await import('/src/data/exploration.js');
    const sc = () => game.scenes.current;
    const exs = () => sc().expeditions;
    const ex = s.exploration;
    const adults = () => s.characters.filter((c) => !c.isChild && !c.away);
    // --- Risk: meslek ve ekipman ---
    const mineOpt = D.ADVENTURES.mountainPass.options.find((o) => o.id === 'mine');
    const pathOpt = D.ADVENTURES.mountainPass.options.find((o) => o.id === 'path');
    const fake = (skills, tool = null) => ({ name: 'Deneme', skills, equipment: { tool } });
    check('macera riski kafilesiz tabandır', Math.abs(X.optionRisk([fake({})], mineOpt).chance - mineOpt.risk.chance) < 1e-9);
    check('Sağlam Aletli Usta Madenci maden riskini sıfırlar', X.optionRisk([fake({}), fake({ mining: 2000 }, 'sturdyTool')], mineOpt).chance === 0);
    check('aletsiz Usta Madenci riski sıfırlamaz, yarıya indirir', Math.abs(X.optionRisk([fake({ mining: 2000 })], mineOpt).chance - mineOpt.risk.chance * 0.5) < 1e-9);
    check('Kalfa Şifacı patikanın riskini sıfırlar', X.optionRisk([fake({ herbalism: 600 })], pathOpt).chance === 0);
    check('seçenek açıklaması kafilenin riskini söyler', X.describeOption([fake({ mining: 2000 }, 'sturdyTool')], mineOpt).includes('Risk yok') && X.describeOption([fake({})], mineOpt).includes('Kaza riski %35'));

    // --- Sefer düzenleme ---
    for (const c of s.characters) c.illness = null;
    s.dilemma.expedition = null;
    s.dilemma.active = null;
    s.time.paused = false;
    const hall = s.buildings.find((b) => b.type === 'townHall' && b.functional);
    sim.give({ food: 200 });
    ex.lastLaunchDay = -99;
    const st0 = X.expeditionLaunchStatus(s, 'townHall');
    check('Belediye Konağı\'ndan sefer düzenlenebilir', hall && st0.ok, st0.reason);
    const food0 = s.resources.food;
    game.events.emit('ui:launchExpedition', { source: 'townHall' });
    const exp = s.dilemma.expedition;
    check('3 kişilik kafile yola çıkar, erzak ödenir, iki macera planlanır', exp && exp.members.length === 3 && s.resources.food === food0 - D.EXPLORATION.cost.food && exp.adventures.length === 2, exp && exp.adventures.join(','));
    check('aynı anda ikinci sefer düzenlenemez', !X.expeditionLaunchStatus(s, 'townHall').ok);
    const team = exp.members.map((id) => s.characters.find((c) => c.id === id));
    hours(1);
    check('kafile harita kenarına yürür ya da ufukta kaybolur', team.every((c) => c.away));
    // --- İlk macera ---
    let guard = 0;
    while (!(s.dilemma.active?.kind === 'adventure') && guard++ < 200) sim.step(50);
    const act = s.dilemma.active;
    game.render(0);
    const modal = document.querySelector('.dilemma');
    check('yolculuğun ortasında Maceracı Günlüğü penceresi açılır ve oyun durur', act?.kind === 'adventure' && s.time.paused && !modal.hidden && modal.textContent.includes('Maceracı Günlüğü'), act?.id);
    const scen = D.ADVENTURES[act.id];
    check('pencere kafileyi ve seçeneklerin riskini gösterir', team.every((c) => modal.textContent.includes(c.name)) && act.options.some((o) => /Kaza riski|Risk yok/.test(o.detail)));
    // Riskli seçeneği güvenceye al: kafileye kuralı karşılayan bir usta (aletiyle) ver
    const risky = scen.options.find((o) => o.risk && o.safeWith);
    const rule = risky.safeWith[0];
    const keepSkills = { ...team[0].skills };
    const keepTool = team[0].equipment.tool;
    team[0].skills = { [rule.skill]: 2000 };
    if (rule.tool) team[0].equipment.tool = 'sturdyTool';
    const resolved = [];
    const offR = game.events.on('adventure:resolved', (p) => resolved.push(p));
    game.events.emit('ui:chooseDilemma', { optionId: risky.id });
    check('usta kafilede iken riskli yol kazasız geçer ve seferin adını verir', resolved[0]?.success && resolved[0].risk.chance === 0 && exp.route === risky.route && !s.time.paused && !s.dilemma.active, exp.route);
    check('macera ganimeti seferde birikir', Object.keys(exp.loot).length > 0 && exp.log.length === 1);
    team[0].skills = keepSkills;
    team[0].equipment.tool = keepTool;
    // --- İkinci macera: kaza zorlanır (risk 1) ---
    guard = 0;
    while (!(s.dilemma.active?.kind === 'adventure') && guard++ < 300) sim.step(50);
    const act2 = s.dilemma.active;
    const scen2 = D.ADVENTURES[act2.id];
    const bold = scen2.options.find((o) => o.risk);
    const saved = { risk: bold.risk, safeWith: bold.safeWith, easeWith: bold.easeWith };
    bold.risk = { ...bold.risk, chance: 1 };
    bold.safeWith = [];
    bold.easeWith = [];
    const lootBefore = JSON.stringify(exp.loot);
    game.events.emit('ui:chooseDilemma', { optionId: bold.id });
    Object.assign(bold, saved);
    offR();
    check('kazada bir sakin yaralanır, ganimet azalır, bulgu gelmez', resolved[1] && !resolved[1].success && exp.hurt.length === 1 && resolved[1].found.length === 0, lootBefore + ' -> ' + JSON.stringify(exp.loot));
    const victim = s.characters.find((c) => c.id === exp.hurt[0]);
    exp.loot.herbs = (exp.loot.herbs ?? 0) + 3; // şifalı ot ganimeti (Şifacı Kulübesi'nin stoğuna, yoksa yiyeceğe)
    // --- Dönüş ---
    const returned = [];
    const offB = game.events.on('expedition:returned', (p) => returned.push(p));
    guard = 0;
    while (s.dilemma.expedition && guard++ < 120) hours(0.5);
    offB();
    const back = returned[0];
    check('kafile döner: kimse kaybolmaz, herkes görünür ve kasabada', back && team.every((c) => s.characters.includes(c) && !c.away && c.visible !== undefined) && !s.dilemma.expedition);
    check("maceracıların anısına seferin hikâyesi yazılır (… Seferi'nden … döndü)", team.every((c) => c.memories.some((m) => m.text.startsWith(`${back.route} Seferi'nden`))), team[0].memories.at(-1)?.text);
    check('kazada yaralanan dönünce hasta yatar ve anısına yazılır', victim.illness && victim.memories.some((m) => m.text.includes(scen2.title)));
    check('dönenler handa anlatacak bir hikâye taşır', team.every((c) => c.tale && c.tale.route === back.route));
    check('şifalı ot ganimeti günlüğe yazılır', s.journal.some((j) => j.text.includes(`${back.route} Seferi'nden döndü`)));
    check('sefer günlüğü ve sayaç', ex.log.at(-1)?.route === back.route && ex.expeditions >= 1 && s.stats.adventures >= 2);
    // --- Hikâye anlatma ---
    const innB = s.buildings.find((b) => b.type === 'inn' && b.functional);
    const teller = team.find((c) => c !== victim) ?? team[0];
    const listeners = s.characters.filter((c) => !team.includes(c) && !c.isChild && !c.away).slice(0, 2);
    const fun0 = listeners.map((c) => c.needs.fun);
    for (const c of [teller, ...listeners]) {
      c.task = { activity: 'inn', buildingId: innB.id, phase: 'perform', elapsed: 0, duration: 999 };
      c.visible = true;
    }
    teller.needs.fun = 50;
    for (const c of listeners) c.needs.fun = Math.min(c.needs.fun, 80);
    const fun1 = listeners.map((c) => c.needs.fun);
    exs().updateTales(D.EXPLORATION.tale.minutes + 1);
    check('maceracı handa hikâyesini anlatır: başında dağ balonu, dinleyenlerin keyfi artar', teller.bubble?.icon === 'adventure' && listeners.every((c, i) => c.needs.fun > fun1[i]) && teller.tale.told === 1 && s.stats.talesTold >= 1, `${fun0} -> ${listeners.map((c) => c.needs.fun)}`);
    check('anlatmak maceracının anısına yazılır', teller.memories.some((m) => m.text.includes('handa ballandıra ballandıra anlattı')));
    for (const c of [teller, ...listeners]) c.task = null;
    // --- Ganimetler ---
    const shards0 = ex.items.relicShard;
    const relics0 = s.civic.relics ?? 0;
    ex.items.relicShard = 2;
    exs().grantFind('relicShard', 'test');
    check('üç Kadim Yadigâr Parçası birleşince kalıcı +2 refah', ex.items.relicShard === 0 && Math.abs((s.civic.relics ?? 0) - relics0 - 1) < 1e-9);
    ex.items.relicShard = shards0;
    ex.cityMap = false;
    const iv = X.merchantIntervalMultiplier(s);
    exs().grantFind('cityMap', 'test');
    check('Kayıp Şehir Haritası tüccarı iki kat sık getirir', iv === 1 && ex.cityMap && X.merchantIntervalMultiplier(s) === 0.5);
    const sh = ex.items.relicShard;
    exs().grantFind('cityMap', 'test');
    check('ikinci harita yadigâr parçasına döner', ex.items.relicShard === (sh + 1) % 3 || ex.items.relicShard === sh + 1);
    // Üzüm asması
    ex.items.vineSeed = 0;
    const gardenB = s.buildings.find((b) => b.type === 'garden' && b.functional) ?? sim.place('garden');
    const vineSpot = [[-1, 0], [2, 0], [0, -1], [0, 2], [-1, -1], [2, 2], [-1, 1], [2, 1]].map(([dx, dy]) => ({ x: gardenB.tileX + dx, y: gardenB.tileY + dy })).find((p) => {
      ex.items.vineSeed = 1;
      const ok = sc().construction.checkPlacement('grapeVine', p.x, p.y).ok;
      ex.items.vineSeed = 0;
      return ok;
    });
    const noSeed = sc().construction.checkPlacement('grapeVine', vineSpot?.x ?? 0, vineSpot?.y ?? 0);
    check('fide olmadan asma dikilemez', !noSeed.ok && noSeed.reason.includes('Üzüm Fidesi'), noSeed.reason);
    ex.items.vineSeed = 1;
    const far = sim.findSpot('grapeVine') ?? null;
    const farCheck = sc().construction.checkPlacement('grapeVine', plaza.centerX, plaza.centerY + 1);
    check('asma yalnızca bahçe / çardak kenarına dikilir', !farCheck.ok || far !== null, farCheck.reason);
    const vine = vineSpot ? sc().construction.placeSite('grapeVine', vineSpot.x, vineSpot.y) : { ok: false };
    if (vine.ok) {
      const job = sc().jobs.jobs.find((j) => j.buildingId === vine.building.id);
      if (job) sc().jobs.cancel(job);
      sc().construction.complete(vine.building);
    }
    sim.step(5);
    check('fide dikilince harcanır, yanındaki bahçenin verimi +%10', vine.ok && ex.items.vineSeed === 0 && Math.abs((gardenB.factors?.vines ?? 1) - 1.1) < 1e-9, `${vineSpot?.x},${vineSpot?.y} ${gardenB.factors?.vines}`);
    if (vine.ok) sc().construction.demolish(vine.building);
    check('asma sökülünce fide sandığa döner', ex.items.vineSeed === 1);
    // Kadim Meşale
    ex.items.ancientTorch = 1;
    const torch = sim.place('ancientTorch');
    check('meşale dikilir ve ganimet harcanır', torch && ex.items.ancientTorch === 0);
    while (s.time.hour >= 6 && s.time.hour < 19) hours(1);
    hours(0.1);
    const lights = [];
    torch.collectLights(lights, { time: 0, windowsLit: true, hour: 20 });
    check('gece mavi alevle yanar (mavi ışık)', torch.lit && lights.some((l) => l.color[2] > l.color[0]));
    const warmTest = s.characters.find((c) => !c.away && c.visible);
    if (warmTest) {
      warmTest.x = torch.center.x + 10;
      warmTest.y = torch.center.y + 4;
      warmTest.buffs.warmUntil = 0;
      sc().heating.warmCharacters(1);
    }
    check('meşalenin yanındakinin içi ısınır', !warmTest || (warmTest.buffs.warmUntil ?? 0) > s.totalMinutes);
    // --- Harabe sırları ve kadim yazıtlar ---
    for (const k of D.INSCRIPTION_KEYS) delete ex.inscriptions[k];
    ex.decoding = null;
    const fountainRuin = s.buildings.find((b) => b.type === 'ancientFountain') ?? { type: 'ancientFountain' };
    game.events.emit('ruin:restored', { building: fountainRuin, from: 'Kadim Çeşme', treasure: null });
    check('onarılan harabenin içinden kadim yazıt çıkar', ex.inscriptions.aqueduct?.status === 'found');
    s.research.active = null;
    const academyB = s.buildings.find((b) => b.definition.academy && b.functional);
    game.events.emit('ui:decodeInscription', { id: 'aqueduct' });
    check('yazıt Bilgelik Evi\'nde çözülmeye başlar', ex.decoding?.id === 'aqueduct' && ex.inscriptions.aqueduct.status === 'decoding');
    sc().research.work(academyB, D.INSCRIPTIONS.aqueduct.work + 1);
    sim.step(5);
    check('çözülen Antik Su Kemeri Şeması bahçelere kalıcı +%15', X.hasScheme(s, 'aqueduct') && X.schemeGardenMultiplier(s) === 1.15 && Math.abs((gardenB.factors?.scheme ?? 1) - 1.15) < 1e-9);
    ex.inscriptions.steelCasting = { status: 'decoded' };
    ex.inscriptions.millstone = { status: 'decoded' };
    const iron0 = s.resources.iron;
    ex.ironCredit = 0;
    for (let i = 0; i < 5; i++) sc().crafting.saveIron(2);
    check('Kadim Çelik Döküm: atölye demirinin %20\'si geri döner', s.resources.iron === iron0 + 2, `${iron0} -> ${s.resources.iron}`);
    check('Kadim Değirmen Taşı: fırın %15 hızlı', X.schemeBakeMultiplier(s) === 1.15);
    window.__x16 = { inscriptions: Object.keys(ex.inscriptions).length, map: ex.cityMap, tales: team.filter((c) => c.tale).length, teamIds: team.map((c) => c.id), expeditions: ex.expeditions };
  }

  // ===== 18. aşama =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const map = W.map;
    const B = await import('/src/data/buildings.js');
    const LD = await import('/src/data/landscape.js');
    const LS = await import('/src/systems/Landscape.js');
    const { TILE_TYPES } = await import('/src/data/tiles.js');
    const { townHappiness: happy } = await import('/src/systems/TownStatus.js');
    const step = (n) => sim.step(n);
    sim.give({ wood: 300, stone: 300, food: 200, iron: 80, wool: 60, bread: 60 });
    // Temiz, düz bir zemin dikdörtgeni (yapı ve yol yok; içindeki ağaç / kaya temizlenir; kasabaya bağlı)
    const clearRect = (w, h, from = 4) => {
      const p = W.landmarks.plaza;
      for (let r = from; r < 38; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x0 = p.centerX + dx;
            const y0 = p.centerY + dy;
            let ok = true;
            for (let y = y0 - 1; y <= y0 + h && ok; y++) {
              for (let x = x0 - 1; x <= x0 + w && ok; x++) {
                if (!map.inBounds(x, y) || !TILE_TYPES[map.get(x, y)].ground || map.getOccupant(x, y)) ok = false;
              }
            }
            if (!ok) continue;
            for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) map.setObject(x, y, null);
            W.refreshStaticData();
            if (W.isReachable(x0, y0)) return { x: x0, y: y0 };
          }
        }
      }
      return null;
    };
    const instant = (b) => {
      const job = S.jobs.jobs.find((j) => j.buildingId === b.id);
      if (job) S.jobs.cancel(job);
      S.construction.complete(b);
      return b;
    };
    const placeAt = (type, x, y) => {
      const r = S.construction.placeSite(type, x, y, { quiet: true });
      return r.ok ? instant(r.building) : null;
    };

    // --- İnşa menüsü sekmeleri ---
    check('inşa menüsü üç sekme: Yapılar, Yol & Zemin, Peyzaj & Dekorasyon', LD.BUILD_TABS.map((t) => t.id).join(',') === 'buildings,roads,decor');
    check('fırçalar Yol & Zemin, sokak eşyaları Peyzaj sekmesinde', ['path', 'stonePath', 'plazaTile', 'bridge'].every((t) => B.buildTabFor(t) === 'roads') && ['woodFence', 'fenceGate', 'ironLantern', 'signpost', 'parkBench', 'planter', 'birchTree', 'oakTree', 'pineTree', 'lantern', 'bench', 'flowerBed', 'cherryTree'].every((t) => B.buildTabFor(t) === 'decor') && B.buildTabFor('cabin') === 'buildings');
    check('yeni öğeler inşa menüsünde', ['plazaTile', 'woodFence', 'fenceGate', 'ironLantern', 'signpost', 'parkBench', 'planter', 'birchTree', 'oakTree', 'pineTree'].every((t) => B.BUILD_MENU.includes(t)));
    game.events.emit('ui:setTool', { tool: 'build', buildType: 'woodFence' });
    game.render(0);
    const activeTab = document.querySelector('.build-tab.is-active')?.dataset.tab;
    const visibleItems = [...document.querySelectorAll('.build-item')].filter((b) => !b.hidden).map((b) => b.dataset.type);
    check('öğe seçilince sekmesi açılır ve yalnızca o sekmenin öğeleri görünür', activeTab === 'decor' && visibleItems.includes('woodFence') && !visibleItems.includes('cabin') && !visibleItems.includes('path'), `${activeTab} ${visibleItems.length}`);
    document.querySelector('.build-tab[data-tab="roads"]')?.click();
    const roadItems = [...document.querySelectorAll('.build-item')].filter((b) => !b.hidden).map((b) => b.dataset.type);
    check('Yol & Zemin sekmesine tıklayınca fırçalar listelenir', roadItems.join(',') === 'path,stonePath,plazaTile,bridge', roadItems.join(','));
    game.events.emit('ui:setTool', { tool: 'select' });

    // --- Zemin fırçaları: maliyet ve hız ---
    check('toprak patika 1 odun, parke 1 taş, taş plaka 2 taş', B.TILE_BUILDS.path.cost.wood === 1 && B.TILE_BUILDS.stonePath.cost.stone === 1 && B.TILE_BUILDS.plazaTile.cost.stone === 2);
    check('yürüme hızı: patika +%10, parke +%25, taş plaka +%20', near(TILE_TYPES.path.speedMultiplier, 1.1) && near(TILE_TYPES.cobble.speedMultiplier, 1.25) && near(TILE_TYPES.plaza.speedMultiplier, 1.2));
    const area = clearRect(10, 7);
    check('test için açık çimen alanı bulundu', area, JSON.stringify(area));
    const ax = area.x;
    const ay = area.y;
    // Sürükleyerek kesintisiz çizim: fare uzak bir karoya sıçrasa da aradaki karolar dolar
    const wood0 = st.resources.wood;
    S.tools.setTool('build', 'path');
    S.tools.beginStroke({ tileX: ax, tileY: ay + 1 });
    S.tools.continueStroke({ tileX: ax + 6, tileY: ay + 1 });
    S.tools.continueStroke({ tileX: ax + 6, tileY: ay + 4 });
    S.tools.finishStroke();
    S.tools.setTool('select');
    const line = [];
    for (let x = ax; x <= ax + 6; x++) line.push(map.get(x, ay + 1));
    for (let y = ay + 2; y <= ay + 4; y++) line.push(map.get(ax + 6, y));
    check('sürüklenen patika kesintisiz (aradaki karolar dolar, viraj döner)', line.every((t) => t === 'path'), line.join(','));
    check('patika karo başına 1 odun harcar', wood0 - st.resources.wood === 10, wood0 - st.resources.wood);
    check('patika sakinler için yürünebilir ve kasabaya bağlı', W.isReachable(ax + 3, ay + 1));
    // Otomatik viraj / kavşak köşeleri: virajın dış köşesi yuvarlanır
    const calls = [];
    const mock = { drawImage: (img, x, y) => calls.push([x, y]) };
    map.drawRoadCorners(mock, ax + 6, ay + 1, 0, 0, 'summer');
    const outer = calls.length;
    calls.length = 0;
    map.drawRoadCorners(mock, ax + 3, ay + 1, 0, 0, 'summer');
    check('virajda köşe yuvarlanır (otomatik kenarlık), düz yolda köşe çizilmez', outer >= 1 && calls.length === 0, `${outer}/${calls.length}`);
    S.construction.paintTile('path', ax + 3, ay + 2);
    calls.length = 0;
    map.drawRoadCorners(mock, ax + 3, ay + 1, 0, 0, 'summer');
    check('kavşakta iç köşelere çimen tutamı taşar', calls.length >= 1, calls.length);

    // Parke ve taş plaka
    const stone0 = st.resources.stone;
    S.construction.paintTile('stonePath', ax + 1, ay + 1);
    S.construction.paintTile('plazaTile', ax + 2, ay + 1);
    check('parke patikanın, taş plaka zeminin üstüne döşenir', map.get(ax + 1, ay + 1) === 'cobble' && map.get(ax + 2, ay + 1) === 'plaza' && stone0 - st.resources.stone === 3);

    // Çamur: yağmurda patika yavaş ve pahalı, parke etkilenmez
    const pathSpeed = map.getSpeedMultiplier(ax + 4, ay + 1);
    const pathCost = map.getMoveCost(ax + 4, ay + 1);
    const savedWeather = { ...st.weather };
    st.weather.rain = 1;
    step(1);
    check('yağmurda toprak patika çamurlanır (yavaş, yol bulma kaçınır)', map.wet && map.getSpeedMultiplier(ax + 4, ay + 1) < pathSpeed && map.getMoveCost(ax + 4, ay + 1) > pathCost, `${map.getSpeedMultiplier(ax + 4, ay + 1)}`);
    check('yağmurda parke taş çamurlanmaz', near(map.getSpeedMultiplier(ax + 1, ay + 1), 1.25));
    check('harita ipucu çamuru söyler', W.getTileInfo(ax + 4, ay + 1).muddy === true);
    Object.assign(st.weather, savedWeather);
    st.weather.rain = 0;
    step(1);

    // A*: yollar öncelikli — düz çimen yerine bir sıra yandaki parke yoldan yürür
    for (let x = ax; x <= ax + 9; x++) S.construction.paintTile('stonePath', x, ay + 6);
    W.refreshStaticData();
    const route = W.findPath({ x: ax, y: ay + 5 }, { x: ax + 9, y: ay + 5 });
    const onRoad = route ? route.filter((p) => TILE_TYPES[map.get(p.x, p.y)].road).length : 0;
    check('A* yeni döşenen yolu öncelikli kullanır', route && onRoad >= route.length - 3, `${onRoad}/${route?.length}`);

    // --- Yıkım fırçası: yolu kaldırır, harcananın yarısını iade eder ---
    const woodBefore = st.resources.wood;
    S.tools.setTool('demolish');
    S.tools.beginStroke({ tileX: ax + 4, tileY: ay + 1 });
    S.tools.continueStroke({ tileX: ax + 5, tileY: ay + 1 });
    S.tools.finishStroke();
    S.tools.setTool('select');
    check('yıkım fırçası patikayı kaldırır (altındaki çimen geri gelir)', map.get(ax + 4, ay + 1) !== 'path' && TILE_TYPES[map.get(ax + 5, ay + 1)].ground);
    check('iki karo patika = 1 odun iade (%50, küsurat birikir)', st.resources.wood - woodBefore === 1, st.resources.wood - woodBefore);
    const stoneBefore = st.resources.stone;
    S.construction.demolishAt(ax + 2, ay + 1);
    check('taş plaka kaldırılınca harita üretildiğindeki zemine döner ve 1 taş iade', TILE_TYPES[map.get(ax + 2, ay + 1)].ground && st.resources.stone - stoneBefore === 1);

    // --- Ahşap çit ve çit kapısı ---
    const fy = ay + 3;
    const f1 = placeAt('woodFence', ax, fy);
    const f2 = placeAt('woodFence', ax + 1, fy);
    const gate = placeAt('fenceGate', ax + 2, fy);
    const f3 = placeAt('woodFence', ax + 3, fy);
    const f4 = placeAt('woodFence', ax + 3, fy + 1);
    check('çitler yönüne göre birleşir (yatay, köşe)', f2?.connect?.left && f2.connect.right && f3?.connect?.left && f3.connect.down && f4?.connect?.up && !f1.connect.left);
    check('çit kapısı çitlerle birleşir ve sakinler kapıdan geçer', gate?.connect?.left && gate.connect.right && map.isWalkable(ax + 2, fy) && !map.isWalkable(ax + 1, fy));
    // Fırçayla art arda dikilen çit
    S.tools.setTool('build', 'woodFence');
    const before = W.getBuildingsOfType('woodFence').length;
    const by = ay + 5;
    S.tools.beginStroke({ tileX: ax + 5, tileY: by });
    S.tools.continueStroke({ tileX: ax + 8, tileY: by });
    S.tools.finishStroke();
    S.tools.setTool('select');
    check('çit fırçası sürükleyince art arda dört çit diker', W.getBuildingsOfType('woodFence').length - before === 4, W.getBuildingsOfType('woodFence').length - before);
    for (const b of W.buildings.filter((b) => b.type === 'woodFence' && b.underConstruction)) instant(b);

    // --- Mahalle tabelası ---
    const sign = placeAt('signpost', ax + 9, ay);
    check('tabela önerilen bir sokak adıyla dikilir', sign && LD.STREET_NAMES.includes(sign.label) && sign.name === sign.label, sign?.label);
    game.events.emit('ui:renameSign', { id: sign.id, name: '  Çiçekli   Sokak ' });
    check('tabelaya tıklayıp ad verilir (boşluklar toparlanır)', sign.label === 'Çiçekli Sokak' && W.getTileInfo(ax + 9, ay).building.name === 'Çiçekli Sokak' && W.getTileInfo(ax + 9, ay).building.sign);
    game.events.emit('ui:selectBuilding', sign.id);
    game.render(0);
    const signInput = document.querySelector('.sign-name-input');
    check('yapı panelinde tabelanın ad kutusu', signInput && !signInput.closest('.building-sign').hidden && signInput.value === 'Çiçekli Sokak');
    game.events.emit('ui:selectBuilding', null);

    // --- Estetik: süsler çevreye estetik yayar, yürüyen keyiflenir ---
    const score0 = st.landscape.score;
    const beauty0 = S.landscape.aestheticAt(ax + 8, ay + 3);
    const decor = [placeAt('planter', ax + 7, ay + 4), placeAt('planter', ax + 8, ay + 2), placeAt('parkBench', ax + 8, ay + 4), placeAt('ironLantern', ax + 9, ay + 4), placeAt('planter', ax + 9, ay + 2)];
    step(1);
    const here = LS.aestheticLevel(S.landscape.aestheticAt(ax + 8, ay + 3));
    check('süsler çevredeki 4-5 karoya "Çevre Estetiği" yayar', (window.__dec18 = decor.map((d) => !!d).join(",")) && decor.every(Boolean) && S.landscape.aestheticAt(ax + 8, ay + 3) >= LD.AESTHETIC.pleasantThreshold && S.landscape.aestheticAt(ax + 8, ay + 3) - beauty0 > 3, `${here} ${S.landscape.aestheticAt(ax + 8, ay + 3).toFixed(2)} önce ${beauty0.toFixed(2)} ${window.__dec18}`);
    {
      const fake = { width: 20, height: 20, tiles: new Uint8Array(400), inBounds: (x, y) => x >= 0 && y >= 0 && x < 20 && y < 20, index: (x, y) => y * 20 + x, get: () => 'grass' };
      const f = LS.computeAestheticField(fake, [{ type: 'planter', functional: true, tileX: 10, tileY: 10 }]);
      check('estetik merkezde tam, 4 karoda azalarak sürer, 5 karonun ötesinde biter', near(f[fake.index(10, 10)], LD.AESTHETIC.values.planter) && f[fake.index(14, 10)] > 0 && f[fake.index(14, 10)] < f[fake.index(12, 10)] && f[fake.index(16, 10)] === 0);
    }
    check('kasabanın estetik puanı artar', st.landscape.score > score0, `${score0} -> ${st.landscape.score}`);
    // Refah çarpanı: estetik yüzdesi kasaba refahına çarpan olarak eklenir
    const pct = st.landscape.percent;
    const needs0 = st.characters.map((c) => ({ ...c.needs }));
    for (const c of st.characters) for (const k of Object.keys(c.needs)) c.needs[k] = 40;
    st.landscape.percent = 0;
    const h0 = happy(st);
    st.landscape.percent = 5;
    const h5 = happy(st);
    st.landscape.percent = pct;
    st.characters.forEach((c, i) => Object.assign(c.needs, needs0[i]));
    check('kasaba estetiği refaha kalıcı çarpan ekler (+%5 en çok)', h5 > h0 && h5 <= h0 * 1.05 + 0.01 && LS.aestheticWelfareMultiplier({ landscape: { percent: 5 } }) === 1.05, `${h0.toFixed(1)} -> ${h5.toFixed(1)}`);
    check('estetik yüzdesi +%1 ile +%5 arası', LD.aestheticPercent(0) === 0 && LD.aestheticPercent(12) === 1 && LD.aestheticPercent(9999) === 5);
    // Yürüyen sakin: güzel sokakta keyfi dolar, anı yazılır (sokağın adıyla)
    const walker = st.characters.find((c) => !c.isChild && c.visible);
    const keep = { x: walker.x, y: walker.y, task: walker.task, waypoints: walker.waypoints, wi: walker.waypointIndex, fun: walker.needs.fun, memories: walker.memories.slice() };
    walker.x = (ax + 8) * 16 + 8;
    walker.y = (ay + 3) * 16 + 12;
    walker.task = { activity: 'stroll', phase: 'travel' };
    walker.waypoints = [{ x: walker.x + 16, y: walker.y }];
    walker.waypointIndex = 0;
    walker.needs.fun = 40;
    walker.memories = walker.memories.filter((m) => m.kind !== 'stroll');
    S.landscape.update({ gameMinutes: 300, hour: 11 });
    check('güzel sokaktan geçenin keyfi dolar', walker.needs.fun > 40, walker.needs.fun.toFixed(1));
    const strollMem = walker.memories.filter((m) => m.kind === 'stroll').map((m) => m.text);
    check('"Güzel bir sokakta yürüdü" ya da "Çiçek kokusunu içine çekti" anısı (sokağın adıyla)', strollMem.some((t) => t.startsWith('Güzel bir sokakta yürüdü') || t === 'Çiçek kokusunu içine çekti'), strollMem.join(' | '));
    check('yakındaki tabela anıya sokağın adını verir', S.landscape.nearestStreet(walker) === 'Çiçekli Sokak');
    // Karanlık: gece ışıksız yerde yürüyen ürker, fener altında ürkmez
    const lantern = decor[3];
    lantern.lit = true;
    walker.needs.fun = 50;
    walker.x = lantern.center.x + 8;
    walker.y = lantern.center.y;
    S.landscape.update({ gameMinutes: 30, hour: 23 });
    const litFun = walker.needs.fun;
    const litDark = walker.inDark;
    const far = clearRect(3, 3, 14);
    walker.x = far.x * 16 + 8;
    walker.y = far.y * 16 + 12;
    walker.needs.fun = 50;
    S.landscape.update({ gameMinutes: 30, hour: 23 });
    check('gece fener altında yürüyen ürkmez, karanlık sokakta keyfi kaçar', !litDark && litFun >= 50 && walker.inDark && walker.needs.fun < 50, `${litFun.toFixed(2)} / ${walker.needs.fun.toFixed(2)}`);
    check('demir fener geceleri yanar (ışık listesinde)', LS.isLitPoint(LS.litSources(W.buildings), lantern.center.x + 40, lantern.center.y));
    Object.assign(walker, { x: keep.x, y: keep.y, task: keep.task, waypoints: keep.waypoints, waypointIndex: keep.wi });
    walker.needs.fun = keep.fun;
    // Park bankı: güzel köşede oturan manzarayı izler, keyfi daha hızlı dolar
    const sitter = st.characters.find((c) => c !== walker && !c.isChild && c.visible);
    const keep2 = { x: sitter.x, y: sitter.y, task: sitter.task, fun: sitter.needs.fun };
    const bench = decor[2];
    sitter.x = bench.seatPoint.x;
    sitter.y = bench.seatPoint.y;
    sitter.task = { activity: 'bench', phase: 'perform', buildingId: bench.id };
    sitter.needs.fun = 30;
    S.landscape.update({ gameMinutes: 20, hour: 11 });
    check('güzel köşedeki park bankında oturanın keyfi fazladan dolar', sitter.needs.fun > 30.5, sitter.needs.fun.toFixed(2));
    Object.assign(sitter, { x: keep2.x, y: keep2.y, task: keep2.task });
    sitter.needs.fun = keep2.fun;
    check('park bankı oturulabilen bank listesinde', B.BENCH_TYPES.includes('parkBench') && W.freeSpots(bench).length === 1);
    check('çiçek saksısının çevresi çiçek koklama noktası', W.flowerSpots.some((p) => Math.abs(p.x - decor[0].tileX) <= 1 && Math.abs(p.y - decor[0].tileY) <= 1));

    // --- Süs ağaçları: iki günde büyür, gölgesinde dinlenilir ---
    const treeArea = clearRect(3, 3, 10);
    const tree = placeAt('oakTree', treeArea.x + 1, treeArea.y + 1);
    step(1);
    check('fidan dikilir (büyüme 0)', tree && tree.growthStage === 0 && tree.plantedAt !== null && tree.name === 'Meşe Fidanı');
    tree.plantedAt -= 24 * 60;
    step(1);
    check('bir günde genç ağaç olur', tree.growthStage === 1);
    tree.plantedAt -= 25 * 60;
    step(1);
    check('iki günde ulu ağaç olur ve adı değişir', tree.growthStage === 2 && tree.name === 'Süs Meşesi');
    const resident = st.characters.find((c) => !c.isChild);
    const shadePlan = S.behavior.brain.resolveLeisure(resident, 'shade', 11);
    check('sakin ulu ağacın gölgesinde dinlenmeyi planlar', shadePlan && Math.abs(shadePlan.spot.x - tree.tileX) + Math.abs(shadePlan.spot.y - tree.tileY) === 1, JSON.stringify(shadePlan?.spot));
    check('süs ağacı kesilmez (toplama emri verilmez)', !S.jobs.isHarvestable(tree.tileX, tree.tileY));

    // --- Yıkım: dekorasyonlar, çitler ve yapılar yarı iadeyle geri dönüşür ---
    const woodD = st.resources.wood;
    S.tools.setTool('demolish');
    S.tools.beginStroke({ tileX: ax + 5, tileY: ay + 5 });
    S.tools.continueStroke({ tileX: ax + 8, tileY: ay + 5 });
    S.tools.finishStroke();
    S.tools.setTool('select');
    check('yıkım fırçası sürüklenen çitleri söker ve yarısını iade eder', [5, 6, 7, 8].every((dx) => map.getOccupant(ax + dx, ay + 5) === 0) && st.resources.wood - woodD === 4, st.resources.wood - woodD);
    const cabin = sim.place('cabin');
    S.tools.setTool('demolish');
    S.tools.beginStroke({ tileX: ax + 7, tileY: ay + 6 });
    S.tools.continueStroke({ tileX: cabin.tileX, tileY: cabin.tileY });
    S.tools.finishStroke();
    S.tools.setTool('select');
    check('sürükleyen yıkım fırçası büyük yapıları yıkmaz (yalnızca ilk tık)', W.getBuilding(cabin.id));
    window.__l18 = { sign: { id: sign.id, label: sign.label }, tree: { id: tree.id, plantedAt: tree.plantedAt }, credit: { ...st.landscape.refundCredit }, roads: st.landscape.roadsPainted, gateId: gate.id, gate: { x: ax + 2, y: fy } };
  }

  // ===== 19. aşama: sosyal yaşam, aile kurma, huylar ve dedikodu =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const map = W.map;
    const SO = await import('/src/data/social.js');
    const TR = await import('/src/utils/turkish.js');
    const RS = await import('/src/systems/RelationshipSystem.js');
    const { ACTIVITIES: ACT } = await import('/src/data/activities.js');
    const { MEAL_FOOD_COST: MEAL } = await import('/src/data/resources.js');
    const { TILE_TYPES } = await import('/src/data/tiles.js');
    const { WeddingConfetti } = await import('/src/rendering/WeddingConfetti.js');
    const brain = S.behavior.brain;
    const social = S.social;
    sim.give({ wood: 400, stone: 400, food: 300, iron: 80, wool: 60, bread: 60 });
    const clearRect = (w, h, from = 4) => {
      const p = W.landmarks.plaza;
      for (let r = from; r < 38; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x0 = p.centerX + dx;
            const y0 = p.centerY + dy;
            let ok = true;
            for (let y = y0 - 1; y <= y0 + h && ok; y++) for (let x = x0 - 1; x <= x0 + w && ok; x++) if (!map.inBounds(x, y) || !TILE_TYPES[map.get(x, y)].ground || map.getOccupant(x, y)) ok = false;
            if (!ok) continue;
            for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) map.setObject(x, y, null);
            W.refreshStaticData();
            if (W.isReachable(x0, y0)) return { x: x0, y: y0 };
          }
        }
      }
      return null;
    };
    const placeAt = (type, x, y) => {
      const r = S.construction.placeSite(type, x, y, { quiet: true });
      if (!r.ok) return null;
      const job = S.jobs.jobs.find((j) => j.buildingId === r.building.id);
      if (job) S.jobs.cancel(job);
      S.construction.complete(r.building);
      return r.building;
    };
    // Rastgeleliği sabitle (yalnızca bu adımlar için)
    const forced = (rng, value, fn) => {
      const keep = rng.next;
      rng.next = () => value;
      try {
        return fn();
      } finally {
        rng.next = keep;
      }
    };
    const free = (c, x, y) => {
      S.behavior.endTask(c);
      if (c.insideBuildingId) W.getBuilding(c.insideBuildingId)?.occupants.delete(c.id);
      c.insideBuildingId = null;
      c.visible = true;
      c.pose = 'stand';
      c.newcomer = false;
      c.relocating = false;
      c.illness = null;
      if (x !== undefined) {
        c.x = x * 16 + 8;
        c.y = y * 16 + 12;
      }
    };
    const events = [];
    const offs = ['pet:purred', 'social:partyStarted', 'social:homeFreed', 'gossip:shared', 'gossip:spread', 'social:familyDinner', 'social:date'].map((n) => game.events.on(n, (p) => events.push(n)));

    // --- Türkçe ekler ---
    check('Türkçe ekler: Emre\'nin, Ozan\'ın, Duru\'nun, Kemal\'in, Gül\'ün', TR.genitive('Emre') === "Emre'nin" && TR.genitive('Ozan') === "Ozan'ın" && TR.genitive('Duru') === "Duru'nun" && TR.genitive('Kemal') === "Kemal'in" && TR.genitive('Gül') === "Gül'ün");
    check("Türkçe ekler: Leyla'dan, Mert'ten, Deniz'den, Ayşe'den, Ozan'dan", TR.ablative('Leyla') === "Leyla'dan" && TR.ablative('Mert') === "Mert'ten" && TR.ablative('Deniz') === "Deniz'den" && TR.ablative('Ayşe') === "Ayşe'den" && TR.ablative('Ozan') === "Ozan'dan");

    // --- Huylar ---
    check('her sakinin geçerli bir huyu var', st.characters.every((c) => SO.QUIRK_KEYS.includes(c.quirk)), st.characters.filter((c) => !SO.QUIRKS[c.quirk]).map((c) => c.name).join(','));
    const counts = Object.fromEntries(SO.QUIRK_KEYS.map((k) => [k, st.characters.filter((c) => c.quirk === k).length]));
    check('dört huyun dördü de kasabada görülür', SO.QUIRK_KEYS.every((k) => counts[k] > 0), JSON.stringify(counts));
    const least = social.leastCommonQuirk(null);
    check('göçmen kasabada en az görülen huyu alır', counts[least] === Math.min(...Object.values(counts)), `${least} ${JSON.stringify(counts)}`);
    const adults = st.characters.filter((c) => !c.isChild && !c.away && !c.role);
    const kid = { quirk: null };
    forced(social.rng, 0.1, () => social.inheritQuirk(kid, [adults[0], adults[1]]));
    check('çocuk çoğunlukla bir ebeveyninin huyunu alır', kid.quirk === adults[0].quirk || kid.quirk === adults[1].quirk, kid.quirk);
    const musician = adults.find((c) => c.quirk === 'musician') ?? adults[0];
    const mw = {};
    brain.addQuirkLeisure({ ...musician, quirk: 'musician' }, 11, mw);
    const ew = {};
    brain.addQuirkLeisure({ ...musician, quirk: 'musician' }, 19, ew);
    check('Müzisyen gündüz çalmaz, akşam (17:00 sonrası) çalmak ister', mw.music === 0 && ew.music > 0, `${mw.music} / ${ew.music}`);

    // Hayvansever: kediye yürür, kedi bekler, varınca okşar (+10 keyif, mırlama)
    const pet = st.animals.find((a) => a.isPet);
    const lover = adults.find((c) => c !== musician);
    if (pet) {
      pet.visible = true;
      pet.mode = 'idle';
      pet.timer = 5;
      const tile = { x: Math.floor(pet.x / 16), y: Math.floor(pet.y / 16) };
      free(lover, tile.x, tile.y + 1);
      lover.quirk = 'animalLover';
      const petPlan = brain.planPetAnimal(lover, 8);
      check('Hayvansever yakındaki kediye / köpeğe yürümeyi planlar', petPlan?.activity === 'petAnimal' && petPlan.petId === pet.id && petPlan.petName.includes(TR.genitive(pet.name)), JSON.stringify(petPlan));
      lover.task = { ...petPlan, phase: 'travel', elapsed: 0 };
      social.update({ gameMinutes: 1, hour: 11 });
      check('yürürken hayvan onu bekler (heldUntil)', pet.heldBy === lover.id && pet.heldUntil > st.totalMinutes);
      const px = pet.x;
      const py = pet.y;
      for (let i = 0; i < 20; i++) S.animals.updatePet(pet, 0.5, 11, 'summer', false);
      check('bekleyen hayvan yerinden kıpırdamaz', pet.x === px && pet.y === py && pet.pose === 'sit');
      lover.x = pet.x + 6;
      lover.y = pet.y;
      lover.task.phase = 'perform';
      lover.needs.fun = 40;
      const cuddles = st.stats.petCuddles ?? 0;
      social.update({ gameMinutes: 1, hour: 11 });
      check('varınca başını okşar: keyif +10, kalp ve mırlama', lover.needs.fun >= 50 && st.stats.petCuddles === cuddles + 1 && events.includes('pet:purred') && !pet.heldUntil, lover.needs.fun.toFixed(1));
      check('durum metni hayvanın adıyla', S.behavior.performLabel(lover, lover.task, ACT.petAnimal).includes(`${TR.genitive(pet.name)} başını okşuyor`), S.behavior.performLabel(lover, lover.task, ACT.petAnimal));
      free(lover);
    } else check('kasabada sevilecek bir kedi / köpek var', false);

    // Kitap Kurdu: fener altındaki bank ve Bilgelik Evi
    const area = clearRect(6, 3);
    const lantern = placeAt('lantern', area.x, area.y);
    const benchA = placeAt('bench', area.x + 1, area.y + 1);
    const benchB = placeAt('bench', area.x + 3, area.y + 1);
    const reader = adults.find((c) => c !== lover && c !== musician);
    free(reader, area.x + 2, area.y + 2);
    const readPlan = brain.resolveLeisure(reader, 'readBench', 11);
    check('Kitap Kurdu fener altındaki banka oturup kitap okumayı planlar', lantern && readPlan?.activity === 'readBench' && [benchA.id, benchB.id].includes(readPlan.buildingId), JSON.stringify(readPlan));
    const libPlan = brain.resolveLeisure(reader, 'readLibrary', 11);
    check("Kitap Kurdu Bilgelik Evi'nde kitap okumayı planlar", libPlan?.activity === 'readLibrary' && W.getBuilding(libPlan.buildingId)?.type === 'academy' && ACT.readLibrary.indoor);

    // Müzisyen: akşam handa / meydanda çalar, en çok 4 dinleyicinin keyfi dolar
    const fountain = W.getCompleted('fountain')[0];
    free(musician);
    const musicPlan = brain.planMusic(musician, 19, 50);
    check('Müzisyen akşam handa ya da meydan havuzunda çalmayı planlar', musicPlan?.activity === 'music' && ['inn', 'fountain'].includes(W.getBuilding(musicPlan.buildingId)?.type) && ['Handa', 'Meydanda'].includes(musicPlan.placeAt) && brain.planMusic(musician, 10, 50) === null);
    const stage = clearRect(8, 3, 12);
    musician.x = stage.x * 16 + 8;
    musician.y = stage.y * 16 + 12;
    musician.task = { activity: 'music', phase: 'perform', buildingId: fountain.id, placeAt: 'Meydanda', elapsed: 0, duration: 60 };
    const crowd = adults.filter((c) => c !== musician && c !== lover && c !== reader).slice(0, 5);
    crowd.forEach((c, i) => {
      free(c);
      c.x = musician.x + (i + 1) * 7;
      c.y = musician.y;
      c.needs.fun = 30;
    });
    const serenades = st.stats.serenades ?? 0;
    social.update({ gameMinutes: 10, hour: 19 });
    const raised = crowd.filter((c) => c.needs.fun > 34).length;
    check('çalan müzisyenin çevresindeki en yakın 4 dinleyicinin keyfi hızla dolar (5.si uzakta)', raised === 4 && crowd[4].needs.fun === 30 && musician.task.listeners === 4 && st.stats.serenades === serenades + 1, `${raised} ${crowd.map((c) => c.needs.fun.toFixed(1))}`);
    check('durum metni: "Meydanda melodiler çalıyor"', S.behavior.performLabel(musician, musician.task, ACT.music) === 'Meydanda melodiler çalıyor');
    free(musician);

    // Doğa Tutkunu: genç süs ağacının gölgesinde ya da nehir kenarında manzara
    const treeArea = clearRect(3, 3, 6);
    const young = placeAt('oakTree', treeArea.x + 1, treeArea.y + 1);
    young.plantedAt = st.totalMinutes - 25 * 60;
    sim.step(1);
    const fan = crowd[0];
    free(fan, treeArea.x + 1, treeArea.y + 3);
    let viewPlan = null;
    for (let i = 0; i < 12 && viewPlan?.view !== 'tree'; i++) viewPlan = brain.planViewpoint(fan, 40);
    check('Doğa Tutkunu genç süs ağacının gölgesinde manzarayı izler', young.growthStage === 1 && viewPlan?.activity === 'viewpoint' && viewPlan.view === 'tree', JSON.stringify(viewPlan));
    check('durum metni: "Süs ağacının gölgesinde manzarayı izliyor"', S.behavior.performLabel(fan, viewPlan, ACT.viewpoint) === 'Süs ağacının gölgesinde manzarayı izliyor');

    // --- Flört ve randevu ---
    const singles = adults.filter((c) => c.partnerId === null);
    let pair = null;
    for (let i = 0; i < singles.length && !pair; i++) for (let j = i + 1; j < singles.length && !pair; j++) if (RS.canRomance(singles[i], singles[j])) pair = [singles[i], singles[j]];
    check('randevu için iki bekâr yetişkin bulundu', pair, singles.map((c) => `${c.name}${c.age}`).join(','));
    const [A, B] = pair;
    const others = st.characters.filter((c) => c !== A && c !== B);
    for (const o of others) {
      for (const c of [A, B]) if (RS.getFriendship(st, c, o) >= SO.DATING.crushScore && RS.canRomance(c, o)) S.relationships.set(c, o, 10); // hoşlandıkları tek kişi birbirleri olsun
    }
    S.relationships.set(A, B, 45);
    free(A, area.x + 2, area.y + 2);
    free(B, area.x + 4, area.y + 2);
    A.lastDateAt = null;
    B.lastDateAt = null;
    const datePlan = forced(brain.rng, 0.01, () => brain.planDate(A, 18.5));
    check('ilişkisi yüksek (Dost) bekâr, hoşlandığı kişiyi randevuya çağırır', datePlan && datePlan.dateWithId === B.id && datePlan.inviteId === B.id, JSON.stringify(datePlan));
    check('randevu yeri çardak, han ya da yan yana iki bank', ['gazebo', 'inn', 'bench'].includes(datePlan.activity));
    const loner = { ...A, id: -999, homeId: null, partnerId: null, lastDateAt: null, parentIds: [] };
    check('hoşlandığı (Dost seviyesinde) kimse olmayan bekâr randevu istemez', forced(brain.rng, 0.01, () => brain.planDate(loner, 18.5)) === null);
    // Yan yana iki bankta randevu
    const benchPair = brain.benchPair(A);
    check('yan yana iki boş bank bulunur', benchPair && benchPair.map((b) => b.id).sort().join() === [benchA.id, benchB.id].sort().join(), JSON.stringify(benchPair?.map((b) => b.id)));
    const benchDate = { ...brain.benchPlan(benchPair[0], 'bench', 40), dateBenchId: benchPair[1].id, inviteId: B.id, dateWithId: B.id };
    S.behavior.startPlan(A, benchDate, 18.5);
    check('davet edilen yandaki banka oturmaya gelir (randevu)', B.task?.dateWithId === A.id && B.task.buildingId === benchPair[1].id && B.task.meetWithId === A.id && A.lastDateAt === st.totalMinutes, JSON.stringify(B.task && { a: B.task.activity, b: B.task.buildingId }));
    check('durum metni: "… ile randevuya gidiyor"', A.activityLabel.includes(`${B.name} ile randevuya gidiyor`), A.activityLabel);
    // Bankta yan yana: fazladan ilişki puanı, keyif, ilk randevu anısı
    for (const [c, b] of [[A, benchPair[0]], [B, benchPair[1]]]) {
      c.clearPath();
      c.x = b.seatPoint.x;
      c.y = b.seatPoint.y;
      c.task.phase = 'perform';
      c.pose = 'sit';
    }
    const before = RS.getFriendship(st, A, B);
    const dates = st.stats.dates ?? 0;
    social.update({ gameMinutes: 10, hour: 12 });
    check('randevudaki çiftin ilişki puanı fazladan artar', RS.getFriendship(st, A, B) >= before + SO.DATING.bonusRate * 10 * 0.5 - 1e-6 && st.stats.dates === dates + 1, `${before.toFixed(2)} -> ${RS.getFriendship(st, A, B).toFixed(2)}`);
    check('ilk randevu Yaşam Günlüğü\'ne yazılır', A.memories.some((m) => m.kind === 'date' && m.text.includes(B.name)) && B.memories.some((m) => m.kind === 'date' && m.text.includes(A.name)));
    check('durum metni: "… ile bankta yan yana oturuyor"', A.activityLabel === `${B.name} ile bankta yan yana oturuyor`, A.activityLabel);
    // Bankta yan yana oturan çift aşık olabilir
    S.relationships.set(A, B, 90);
    forced(S.relationships.rng, 0, () => social.update({ gameMinutes: 1, hour: 12 }));
    check('bankta yan yana oturan çift aşık olur (sevgili)', RS.arePartners(A, B) && !A.married);
    const loverPlan = forced(brain.rng, 0.01, () => {
      A.lastDateAt = null;
      B.lastDateAt = null;
      free(A, area.x + 2, area.y + 2);
      free(B, area.x + 4, area.y + 2);
      return brain.planDate(A, 19);
    });
    check('sevgililer de birbirlerini randevuya çağırır', loverPlan?.dateWithId === B.id);
    free(A, area.x + 2, area.y + 2);
    free(B, area.x + 4, area.y + 2);

    // --- Ortak ev: evlenen çift aynı kulübeye taşınır, boşalan kulübe göçmenlere açılır ---
    const homeArea = clearRect(6, 3, 8);
    const cabin1 = placeAt('cabin', homeArea.x, homeArea.y);
    const cabin2 = placeAt('cabin', homeArea.x + 3, homeArea.y);
    check('kulübe kapasitesi 2', cabin1?.capacity === 2 && cabin2?.capacity === 2);
    A.homeId = cabin1.id;
    B.homeId = cabin2.id;
    const freedBefore = st.stats.homesFreed ?? 0;
    const partiesBefore = st.stats.weddingParties ?? 0;
    // Dostlar düğüne davetli olsun
    const guests = others.filter((o) => !o.isChild && !o.away && o.visible).slice(0, 8);
    for (const g of guests) S.relationships.set(A, g, Math.max(RS.getFriendship(st, A, g), 30));
    S.relationships.marry(A, B, fountain, false);
    const home = W.getBuilding(A.homeId);
    check('evlenen çift aynı eve taşınır (birinin kulübesinde yer varsa oraya)', A.married && B.married && A.homeId === B.homeId && (A.relocating || B.relocating) && (home === cabin1 || home === cabin2 || home.upgraded), `${A.homeId} ${B.homeId}`);
    const vacated = [cabin1, cabin2].filter((h) => h !== home);
    check('boşalan kulübe göçmenlere açılır (günlük ve sayaç)', vacated.every((h) => W.getResidents(h).length === 0) && st.stats.homesFreed === freedBefore + vacated.length && events.includes('social:homeFreed') && st.journal.slice(-6).some((j) => j.text.includes('yeni göçmenlere açık')));
    const eligible = (h) => W.getResidents(h).length < h.capacity && !W.getResidents(h).some((c) => c.married);
    check('göç sistemi boşalan kulübeyi yeni sakinlere ayırabilir; çiftin evine göçmen yerleşmez', vacated.every(eligible) && !eligible(home) && S.population.findHome() !== null);
    // --- Düğün kutlaması ---
    const party = st.social.party;
    check('meydanda düğün kutlaması başlar (çift ve en çok 6 dost davetli)', party && party.coupleIds.includes(A.id) && party.coupleIds.includes(B.id) && party.guestIds.length > 0 && party.guestIds.length <= SO.WEDDING_PARTY.guests && st.stats.weddingParties === partiesBefore + 1, JSON.stringify(party && { g: party.guestIds.length }));
    check('davetliler çiftin dostları (puan en az 25)', party.guestIds.every((id) => Math.max(RS.getFriendship(st, A, W.getCharacter(id)), RS.getFriendship(st, B, W.getCharacter(id))) >= SO.WEDDING_PARTY.guestScore));
    check('düğün kutlaması günlüğe yazılır', st.journal.slice(-8).some((j) => j.text.startsWith('Meydanda düğün kutlaması') && j.text.includes(A.name)));
    A.needs.energy = 80;
    A.relocating = true;
    S.behavior.endTask(A);
    const partyPlan = brain.decide(A, 19);
    check('çift yeni evine taşınmadan önce meydandaki kutlamaya koşar', partyPlan.activity === 'weddingParty' && partyPlan.buildingId === fountain.id, JSON.stringify({ a: partyPlan.activity }));
    check('düğün haberi dedikoduya düşer (çift ve davetliler bilir)', st.social.gossip.some((n) => n.kind === 'wedding' && n.heardBy.includes(A.id) && n.heardBy.includes(party.guestIds[0])));
    // Konfeti çizilir
    let pixels = 0;
    new WeddingConfetti().draw({ fillRect: () => pixels++ }, party, 0.5);
    check('konfeti yağar (çizim)', pixels > 40, pixels);
    game.render(0);
    const guestId = party.guestIds[0];
    party.attended.push(guestId);
    sim.step(30);
    party.until = st.totalMinutes; // kutlama 45 dakika sürer: sonuna atla
    social.update({ gameMinutes: 1, hour: 19 });
    const partyDetail = JSON.stringify({ p: st.social.party, g: W.getCharacter(guestId).memories.slice(-3).map((m) => m.text) });
    check('kutlama biter, katılanların anısına "düğününde konfeti attı" yazılır', st.social.party === null && W.getCharacter(guestId).memories.some((m) => m.text === `${A.name} ile ${TR.genitive(B.name)} düğününde konfeti attı`) && A.memories.some((m) => m.text.includes('düğünlerini kutladı')), partyDetail);
    check('ev kapasiteleri aşılmaz', st.buildings.filter((b) => b.capacity).every((b) => W.getResidents(b).length <= b.capacity));

    // --- Evli çiftin akşam yemeği ---
    for (const c of [A, B]) {
      free(c, home.tileX, home.tileY + 2);
      c.homeId = home.id;
      c.dinnerDay = null;
      c.needs.hunger = 55;
    }
    const day = st.time.day;
    check('akşam yemeği yalnızca 18:00-20:30 arası', brain.planHomeDinner(A, 12) === null && brain.planHomeDinner(A, 21) === null);
    const dinner = brain.planHomeDinner(A, 18.5);
    check('acıkan eş, eşini evde birlikte yemeğe çağırır', dinner?.activity === 'homeDinner' && dinner.buildingId === home.id && dinner.dinnerWithId === B.id, JSON.stringify(dinner));
    S.behavior.startPlan(A, dinner, 18.5);
    check('eşi de sofraya gelir (günde bir kez)', B.task?.activity === 'homeDinner' && B.task.dinnerWithId === A.id && A.dinnerDay === day && B.dinnerDay === day && brain.planHomeDinner(A, 19) === null);
    const food = st.resources.food + st.resources.bread * 2.5 + st.pantry.credit;
    for (const c of [A, B]) {
      c.clearPath();
      c.task.phase = 'perform';
      S.behavior.enterIndoor(c, c.task, home);
    }
    const foodAfter = st.resources.food + st.resources.bread * 2.5 + st.pantry.credit;
    check('evde yenen akşam yemeği stoktan ödenir (kişi başı bir öğün)', Math.abs(food - foodAfter - MEAL * 2) < 1e-6 && A.insideBuildingId === home.id && B.insideBuildingId === home.id, `${food} -> ${foodAfter}`);
    A.needs.fun = 40;
    A.needs.social = 40;
    const dinners = st.stats.familyDinners ?? 0;
    social.update({ gameMinutes: 10, hour: 18.6 });
    check('birlikte yerken birbirlerinin keyfini ve sosyalliğini doldururlar', A.needs.fun >= 43 && A.needs.social >= 48 && A.buffs.cozyNight && B.buffs.cozyNight && st.stats.familyDinners === dinners + 1, `${A.needs.fun.toFixed(1)} ${A.needs.social.toFixed(1)}`);
    check('durum metni: "Eşi … ile evde akşam yemeği yiyor" ve ilk yemek anısı', A.activityLabel === `Eşi ${B.name} ile evde akşam yemeği yiyor` && A.memories.some((m) => m.kind === 'home'), A.activityLabel);
    for (const c of [A, B]) {
      S.behavior.endTask(c);
      free(c, home.tileX, home.tileY + 2);
    }

    // --- Dedikodu ---
    const M = adults.find((c) => c !== A && c !== B && !c.away);
    const L = adults.find((c) => c !== A && c !== B && c !== M && !c.away);
    const piece = { name: 'İşlemeli Yadigâr Sandık', icon: 'mwChest' };
    game.events.emit('masterwork:created', { item: {}, piece, character: M, building: null });
    const mwNews = st.social.gossip[st.social.gossip.length - 1];
    check('usta işi eser bir haber olur; ustası bilir', mwNews.kind === 'masterwork' && mwNews.heardBy.length === 1 && mwNews.heardBy[0] === M.id && mwNews.story === `${TR.genitive(M.name)} ustalıkla yaptığı ${piece.name} eserini`, mwNews.story);
    const heard = st.stats.gossipHeard ?? 0;
    const newsCount = (c) => c.memories.filter((m) => m.kind === 'gossip' && m.text.includes(piece.name)).length;
    const shared = social.share(M, L);
    check('sohbette haber aktarılır; dinleyenin son duyduğu haber olur', shared && L.lastNews?.id === mwNews.id && L.lastNews.from === M.name && mwNews.heardBy.includes(L.id) && st.stats.gossipHeard === heard + 1);
    check('haberi ilk kez duyanın Yaşam Günlüğü\'ne not düşer (ustanın kendi ağzından)', L.memories.some((m) => m.kind === 'gossip' && m.text === `${TR.ablative(M.name)}, ustalıkla yaptığı ${piece.name} eserini kendi ağzından dinledi`), L.memories[L.memories.length - 1]?.text);
    check('başlarında fısıltı / haber balonu', M.bubble?.icon === 'whisper' || !M.visible);
    const notesBefore = newsCount(L);
    social.share(M, L);
    check('aynı haber ikinci kez anlatılmaz', mwNews.heardBy.filter((id) => id === L.id).length === 1 && newsCount(L) === notesBefore);
    // Seferden dönüş haberi: "Leyla'dan, Emre'nin ... getirdiği kadim haritayı duydu"
    const E = adults.find((c) => c !== M && c !== L && c !== A && c !== B);
    game.events.emit('expedition:returned', { members: [E], route: 'Kayıp Tapınak', finds: ['cityMap'], loot: {}, memories: {}, text: 'Kadim bir harita buldular.' });
    const exNews = st.social.gossip[st.social.gossip.length - 1];
    check('seferden dönüş haberi: "…\'nin Kayıp Tapınak Seferi\'nden getirdiği kadim haritayı"', exNews.kind === 'expedition' && exNews.story === `${TR.genitive(E.name)} Kayıp Tapınak Seferi'nden getirdiği kadim haritayı`, exNews.story);
    social.share(E, L);
    check('haberi kahramanı anlatınca: "… getirdikleri kadim haritayı kendi ağzından dinledi"', L.memories.some((m) => m.text === `${TR.ablative(E.name)}, Kayıp Tapınak Seferi'nden getirdikleri kadim haritayı kendi ağzından dinledi`) && L.lastNews.id === exNews.id, L.memories.at(-1)?.text);
    // Başkasından duyan: "Leyla'dan, Emre'nin Kayıp Tapınak Seferi'nden getirdiği kadim haritayı duydu"
    const Z = adults.find((c) => ![A, B, M, L, E].includes(c) && !exNews.heardBy.includes(c.id) && c !== adults.find((x) => ![A, B, M, L, E].includes(x)));
    if (Z) {
      for (const n of st.social.gossip) if (n !== exNews && !n.heardBy.includes(Z.id)) n.heardBy.push(Z.id);
      social.share(L, Z);
      check('Yaşam Günlüğü: "X\'dan, Y\'nin … getirdiği kadim haritayı duydu"', Z.memories.some((m) => m.text === `${TR.ablative(L.name)}, ${TR.genitive(E.name)} Kayıp Tapınak Seferi'nden getirdiği kadim haritayı duydu`), Z.memories.at(-1)?.text);
    } else check('başkasından duyacak bir sakin var', false);
    // Sohbet grubunda kendiliğinden yayılır
    const X = adults.find((c) => ![A, B, M, L, E].includes(c));
    const keepGroups = S.relationships.groups;
    S.relationships.groups = [{ kind: 'chat', members: [L, X] }];
    forced(social.rng, 0, () => social.spreadGossip(1, st.totalMinutes));
    S.relationships.groups = keepGroups;
    check('aynı yerde sohbet edenler haberi birbirine aktarır', X.lastNews && exNews.heardBy.includes(X.id), X.lastNews?.text);
    // Yolda karşılaşıp selamlaşma
    const Y = adults.find((c) => ![A, B, M, L, E, X, Z].includes(c) && !exNews.heardBy.includes(c.id));
    for (const [c, dx] of [[X, 0], [Y, 6]]) {
      free(c, homeArea.x + 1, homeArea.y + 3);
      c.x += dx;
      c.task = { activity: 'stroll', phase: 'travel', elapsed: 0 };
    }
    S.relationships.groups = [];
    social.greetCooldowns.clear();
    forced(social.rng, 0, () => social.spreadGossip(1, st.totalMinutes));
    check('yolda karşılaşıp selamlaşanlar haberi aktarır', exNews.heardBy.includes(Y.id) && Y.lastNews?.fromId === X.id, Y.lastNews?.text);
    const heardNow = st.stats.gossipHeard;
    forced(social.rng, 0, () => social.spreadGossip(1, st.totalMinutes));
    check('aynı ikili bir süre yeniden selamlaşmaz', st.stats.gossipHeard === heardNow);
    S.relationships.groups = keepGroups;
    for (const c of [X, Y]) free(c);
    // Barışma haberi günde bir kez
    const recBefore = st.social.gossip.filter((n) => n.kind === 'reconcile').length;
    st.social.reconcileNewsDay = null;
    game.events.emit('relationship:reconciled', { a: M, b: L, place: 'inn' });
    game.events.emit('relationship:reconciled', { a: E, b: X, place: 'chat' });
    check('barışma haberi olur (günde bir)', st.social.gossip.filter((n) => n.kind === 'reconcile').length === recBefore + 1);
    // Kasabanın çoğu duyunca günlüğe "dilden dile"
    const everyone = st.characters.filter((c) => !c.role);
    const needed = Math.ceil(everyone.length * SO.GOSSIP.spreadShare);
    for (const c of everyone) if (mwNews.heardBy.length < needed - 1 && !mwNews.heardBy.includes(c.id)) mwNews.heardBy.push(c.id);
    const lastOne = everyone.find((c) => !mwNews.heardBy.includes(c.id));
    for (const n of st.social.gossip) if (n !== mwNews && !n.heardBy.includes(lastOne.id)) n.heardBy.push(lastOne.id); // yalnızca bu haberi duymamış olsun
    social.share(M, lastOne);
    check('haber kasabanın çoğuna yayılınca günlüğe "dilden dile" yazılır', mwNews.spread && st.journal.slice(-5).some((j) => j.text.startsWith('Kasabada dilden dile')), `${mwNews.heardBy.length}/${everyone.length}`);
    // Eski haberler dolaşımdan düşer
    mwNews.at -= 5 * 1440;
    social.expireNews();
    check('4 günden eski haber dolaşımdan düşer (sakinin son duyduğu kalır)', !st.social.gossip.includes(mwNews) && L.lastNews);

    // --- Karakter Detay Kartı ---
    game.events.emit('ui:selectCharacter', A.id);
    game.render(0);
    const card = document.querySelector('.character-panel .social-life')?.textContent ?? '';
    const quirkName = SO.QUIRKS[A.quirk].name;
    check('kartta Sosyal Hayat: huyu, eşi ve evi', card.includes(quirkName) && card.includes(B.name) && card.includes('Eşiyle') && card.includes('birlikte yaşıyor'), card);
    check('kartta huy çipi kişilik etiketlerinin yanında', [...document.querySelectorAll('.character-panel .quirk-chip')].some((e) => e.textContent.includes(quirkName)));
    game.events.emit('ui:selectCharacter', L.id);
    game.render(0);
    const card2 = document.querySelector('.character-panel .social-life')?.textContent ?? '';
    check('kartta son duyduğu dedikodu (kimden, ne zaman)', card2.includes(L.lastNews.text) && card2.includes(`${L.lastNews.from} anlattı`), card2);
    game.events.emit('ui:selectCharacter', null);
    // (16. aşama hatası, 19. aşamada stres matrisinde bulundu) sefere yürürken görevi kesilen sakin yeniden kenara yönelir
    {
      const walker = adults.find((c) => ![A, B, L].includes(c) && !c.away);
      free(walker);
      walker.away = { stage: 'leaving', until: st.totalMinutes + 600, exit: W.findEntryTile(S.behavior.rng) };
      walker.task = null;
      S.behavior.updateCharacter(walker, { gameMinutes: 1, hour: 11, simDt: 1 / 60 });
      check('sefere yürürken görevi kesilen sakin yeniden harita kenarına yönelir', walker.task?.activity === 'expedition' || walker.away.stage === 'away', walker.task?.activity);
      S.behavior.endTask(walker);
      walker.away = null;
      free(walker);
    }
    offs.forEach((off) => off());
    window.__s19 = { a: A.id, b: B.id, home: home.id, quirks: Object.fromEntries(st.characters.map((c) => [c.id, c.quirk])), news: { id: L.id, text: L.lastNews.text, from: L.lastNews.from }, gossip: st.social.gossip.length, dinnerDay: A.dinnerDay, dates: st.stats.dates, dinners: st.stats.familyDinners };
  }

  // ===== 20. aşama: Ulu Saat Kulesi, Altın Çağ, Tarihçe Kütüğü, prestij peyzajı =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const GA = await import('/src/systems/GoldenAge.js');
    const GD = await import('/src/data/goldenAge.js');
    const { BUILDINGS: BD } = await import('/src/data/buildings.js');
    const { offersFor: offers } = await import('/src/data/trade.js');
    const TS = await import('/src/systems/TownStatus.js');
    const { getSeason: season } = await import('/src/data/seasons.js');
    const tower = GA.towerOf(st);
    const stages = BD.wonder.wonder.stages;
    sim.give({ wood: 600, stone: 900, iron: 400, gold: 4000, food: 200 });

    // --- Kulenin kuralları ---
    check('kulenin adı Ulu Saat Kulesi; Kasaba seviyesi ve 20 sakinle açılır', BD.wonder.name === 'Ulu Saat Kulesi' && BD.wonder.requiresTier === 3 && BD.wonder.requiresPopulation === 20 && GD.TOWER_UNLOCK.population === 20);
    check('üç aşama: Temel, Gövde, Mekanizma & Çan', stages.map((x) => x.name).join(',') === 'Temel,Gövde,Mekanizma & Çan');
    check('Temel bol taş ve kereste ister', Object.keys(stages[0].cost).sort().join() === 'stone,wood' && stages[0].cost.stone >= 300 && stages[0].cost.wood >= 300);
    check('Gövde taş ve demir ister; Yapı Ustaları hızlandırır', stages[1].cost.stone > 0 && stages[1].cost.iron > 0 && stages[1].masters.includes('building'));
    check('Mekanizma & Çan Kadim Dişli ister; usta zanaatkârlar hızlandırır', stages[2].cost.gears === 8 && stages[2].masters.includes('crafting'));
    // Ustalık katkısı
    const fake = (wonderStage) => ({ definition: BD.wonder, underConstruction: false, project: { kind: 'stage' }, wonderStage });
    const { skillLevel } = await import('/src/systems/SkillSystem.js');
    const pro = { skills: { building: 99999 } };
    const mid = { skills: { building: 700 } };
    const crafter = { skills: { crafting: 99999 } };
    const mason = { skills: { masonry: 99999 } };
    check('Gövdede Usta yapı ustası 1,6 kat, Kalfa 1,25 kat hızlı', GA.towerMasteryMultiplier(pro, fake(1), skillLevel) === GD.TOWER_MASTERY.master && GA.towerMasteryMultiplier(mid, fake(1), skillLevel) === GD.TOWER_MASTERY.journeyman && GA.towerMasteryMultiplier({ skills: {} }, fake(1), skillLevel) === 1, `${GA.towerMasteryMultiplier(mid, fake(1), skillLevel)}`);
    check('Mekanizma & Çan aşamasında usta zanaatkâr hızlandırır, taşçı hızlandırmaz', GA.towerMasteryMultiplier(crafter, fake(2), skillLevel) === GD.TOWER_MASTERY.master && GA.towerMasteryMultiplier(mason, fake(2), skillLevel) === 1);

    // --- Kadim Dişli ve aşamanın gerçek inşası (kule geçici olarak Gövde'ye döndürülür) ---
    const workshop = W.getCompleted('workshop')[0];
    tower.wonderStage = 2;
    st.resources.gears = 0;
    check('Gövde bitince 8 Kadim Dişli gerekir', GA.gearsNeeded(st) === 8, GA.gearsNeeded(st));
    const keepCraft = workshop.craft;
    workshop.craft = null;
    const pick = S.crafting.chooseItem(workshop);
    check('Zanaat Atölyesi önce Kadim Dişli döker', pick.item === 'clockGear' && pick.recipe.cost.iron === GD.CLOCK_GEAR.cost.iron, JSON.stringify(pick));
    const casts = [];
    const offCast = game.events.on('goldenAge:gearCast', (p) => casts.push(p));
    S.crafting.work(workshop, 1);
    S.crafting.work(workshop, GD.CLOCK_GEAR.work);
    offCast();
    check('dökülen dişli stoğa girer (Mallar)', st.resources.gears === 1 && casts.length === 1 && workshop.craft === null);
    check('dişli eksikken Mekanizma aşaması başlatılamaz', S.construction.checkProject(tower).reason?.includes('Kadim Dişli'), S.construction.checkProject(tower).reason);
    st.resources.gears = 8;
    check('dişliler tamamlanınca atölye dişli dökmeyi bırakır', GA.gearsNeeded(st) === 0 && S.crafting.chooseItem(workshop).item !== 'clockGear');
    const started = S.construction.startProject(tower);
    check('Mekanizma & Çan aşaması başlar, dişliler harcanır', started.ok && tower.project?.kind === 'stage' && st.resources.gears === 0 && GA.towerStageIndex(tower) === 2, started.reason);
    const job = S.jobs.jobs.find((j) => j.buildingId === tower.id && j.project);
    const builder = st.characters.find((c) => !c.isChild && !c.away && c.visible);
    const keepSkills = { ...builder.skills };
    builder.skills = { ...builder.skills, crafting: 99999 };
    S.behavior.endTask(builder);
    const task = { activity: 'build', jobId: job.id, phase: 'perform', elapsed: 0, duration: 60 };
    builder.task = task;
    const workBefore = st.chronicle.towerWork[builder.id] ?? 0;
    const progBefore = job.progress;
    S.behavior.performWork(builder, task, 10);
    const gained = job.progress - progBefore;
    check('kule şantiyesindeki görev tanınır (çekiç balonları)', S.behavior.towerFor(task) === tower);
    check('usta zanaatkârın emeği kuleyi hızlandırır ve Tarihçe\'ye yazılır', (st.chronicle.towerWork[builder.id] ?? 0) - workBefore === gained && gained > 10 * 1.5, `${gained.toFixed(1)}`);
    builder.skills = keepSkills;
    S.behavior.endTask(builder);
    S.construction.cancelProject(tower);
    tower.wonderStage = 3;
    workshop.craft = keepCraft;
    check('kule yeniden tamam (Altın Çağ sürüyor)', tower.wonderComplete && GA.isGoldenAge(st));

    // --- Altın Çağ: kalıcı etkiler ---
    check('Altın Çağ kule tamamlanınca başladı ve Tarihçe\'ye yazıldı', st.goldenAge.since && st.chronicle.goldenAge && st.chronicle.towerStages[3]?.name === 'Mekanizma & Çan');
    const since = st.goldenAge.since;
    for (const c of st.characters) c.needs.fun = 30;
    st.goldenAge.since = null;
    const plainWork = TS.townWorkMultiplier(st);
    const plainHappy = TS.townHappiness(st);
    st.goldenAge.since = since;
    check('çalışma şevki kalıcı +%10', Math.abs(TS.townWorkMultiplier(st) / plainWork - GD.GOLDEN_AGE.workMultiplier) < 1e-9);
    check('kasaba refahına kalıcı +%10 çarpan', Math.abs(TS.townHappiness(st) - Math.min(100, plainHappy * GD.GOLDEN_AGE.welfareMultiplier)) < 1e-6, `${plainHappy.toFixed(1)} -> ${TS.townHappiness(st).toFixed(1)}`);
    // Kule saati 08:00 ve 18:00'de çalar
    const awake = st.characters.filter((c) => !c.isChild && !c.away && !c.isSleeping).slice(0, 3);
    awake.forEach((c) => (c.needs.energy = 40));
    const chimes = st.goldenAge.chimes;
    const heard = [];
    const offChime = game.events.on('goldenAge:chime', (p) => heard.push(p));
    game.events.emit('time:hour', 9);
    check('kule saati 09:00\'da çalmaz', st.goldenAge.chimes === chimes);
    game.events.emit('time:hour', 8);
    check('kule saati 08:00\'de çalar: duyanların yorgunluğu azalır', st.goldenAge.chimes === chimes + 1 && heard.length === 1 && heard[0].heard > 0 && awake.every((c) => c.needs.energy >= 40 + GD.GOLDEN_AGE.chimeEnergy - 1e-6), `${awake.map((c) => c.needs.energy.toFixed(0))}`);
    game.events.emit('time:hour', 18);
    offChime();
    check('kule saati 18:00\'de de çalar', st.goldenAge.chimes === chimes + 2);
    game.render(0);
    check('çan ses dalgası çizilir', S.chimeWaves.startedAt !== null);
    let dots = 0;
    const waves = new S.chimeWaves.constructor();
    waves.ring();
    waves.draw({ fillRect: () => dots++, drawImage: () => dots++ }, tower, 10);
    waves.draw({ fillRect: () => dots++, drawImage: () => dots++ }, tower, 10.8);
    check('ses dalgası halkaları ve altın notalar', dots > 40, dots);

    // --- Çağ Kutlaması (yeniden başlatılarak denenir) ---
    const keepChronicleAge = st.chronicle.goldenAge;
    const celebrations = st.stats.ageCelebrations ?? 0;
    const startedEvents = [];
    const offStart = game.events.on('goldenAge:celebrationStarted', (p) => startedEvents.push(p));
    S.goldenAge.begin(tower);
    offStart();
    const cel = st.goldenAge.celebration;
    check('Çağ Kutlaması meydanda başlar, çan ilk kez çalar', cel && cel.until - st.totalMinutes === GD.AGE_CELEBRATION.minutes && startedEvents.length === 1 && st.stats.ageCelebrations === celebrations + 1 && W.getBuilding(cel.venueId));
    const guest = st.characters.find((c) => !c.isChild && !c.away && c.visible && !c.isSleeping);
    guest.needs.energy = 80;
    guest.needs.hunger = 80;
    S.behavior.endTask(guest);
    const celPlan = S.behavior.brain.decide(guest, 11);
    check('sakinler Çağ Kutlaması\'na koşar', celPlan.activity === 'ageCelebration' && celPlan.buildingId === cel.venueId, celPlan.activity);
    guest.task = { ...celPlan, phase: 'perform', elapsed: 0 };
    guest.needs.fun = 30;
    S.goldenAge.update({ gameMinutes: 10, hour: 11 });
    check('kutlamadakilerin keyfi dolar', guest.needs.fun > 33 && cel.attended.includes(guest.id));
    cel.until = st.totalMinutes;
    S.goldenAge.update({ gameMinutes: 1, hour: 11 });
    check('kutlama biter; katılanlar "ilk çanı" anısını taşır, oyun sürer', st.goldenAge.celebration === null && guest.memories.some((m) => m.text.includes('ilk çanını')) && GA.isGoldenAge(st));
    S.behavior.endTask(guest);
    st.chronicle.goldenAge = keepChronicleAge;

    // --- Prestij peyzajı ---
    st.goldenAge.since = null;
    const locked = S.construction.checkPlacement('marbleFountain', plaza.centerX + 7, plaza.centerY + 7).reason;
    st.goldenAge.since = since;
    check('Mermer Çeşme ve Altın Çağ Feneri Altın Çağ\'da açılır', String(locked).includes('Altın Çağ') && BD.marbleFountain.requiresGoldenAge && BD.goldenLantern.requiresGoldenAge, locked);
    const mf = sim.place('marbleFountain');
    const gl = sim.place('goldenLantern');
    check('Mermer Çeşme kurulur (estetik ve keyif alanı)', mf && mf.functional && BD.marbleFountain.funAura && W.aesthetics.some((v) => v > 0));
    gl.lit = true;
    const lights = [];
    gl.collectLights(lights, { time: 0, windowsLit: true });
    check('Altın Çağ Feneri gece geniş altın ışık yayar', lights.some((l) => l.radius === 96));
    const sprites = await import('/src/art/sprites/index.js');
    check('prestij yapılarının görselleri çizilir (çeşme dört kare)', sprites.getStructureSprite('marbleFountain', { frame: 2 }).width === 32 && sprites.getStructureSprite('goldenLantern', { lit: true }).height === 40);

    // --- Gezgin tüccar: daha sık, nadir tohum ve antik kitap ---
    const sk = season(st.time.day).key;
    check('Altın Çağ\'da tüccar nadir tohum ve antik kitap getirir', offers(sk, 4, true).some((o) => o.id === 'rareSeeds') && offers(sk, 4, true).some((o) => o.id === 'ancientBooks') && !offers(sk, 4, false).some((o) => o.goldenAge));
    check('tüccar daha sık gelir (ziyaret arası x0,6)', GA.goldenMerchantInterval(st) === GD.GOLDEN_AGE.merchantInterval);
    const seeds = st.exploration.items.vineSeed;
    S.townEvents.grantRare('vineSeed');
    const books = st.goldenAge.books;
    S.townEvents.grantRare('ancientBook');
    check('nadir tohum egzotik fide olur; antik kitap araştırmayı %5 hızlandırır', st.exploration.items.vineSeed === seeds + 1 && st.goldenAge.books === books + 1 && Math.abs(GA.bookResearchMultiplier(st) - (1 + st.goldenAge.books * 0.05)) < 1e-9);

    // --- Tarihçe Kütüğü ---
    const ch = st.chronicle;
    check('Tarihçe: kurucu sakinler', ch.founders.length >= 1 && ch.founders.every((f) => typeof f.name === 'string'), ch.founders.map((f) => f.name).join(','));
    check('Tarihçe: ilk evlenen çift ve ilk usta eseri', (ch.firstCouple?.a && ch.firstCouple?.b) && ch.firstMasterwork?.maker, JSON.stringify([ch.firstCouple, ch.firstMasterwork]));
    check('Tarihçe: kulenin aşamaları ve baş ustası', [1, 2, 3].every((i) => ch.towerStages[i]) && GA.towerMasterOf(st)?.name);
    game.events.emit('ui:toggleStats');
    const archive = document.querySelector('.archive-panel');
    archive.querySelector('.archive-tab[data-tab="chronicle"]').click();
    game.render(0);
    const text = archive.querySelector('.chronicle-view')?.textContent ?? '';
    check('Arşiv\'de Tarihçe Kütüğü sekmesi: berat açılır', !archive.querySelector('.chronicle-view').hidden && archive.querySelector('.archive-view').hidden && text.includes('Tarihçe Kütüğü') && text.includes('Kurucu Sakinler') && text.includes(ch.founders[0].name), text.slice(0, 120));
    check('beratta altın harfler: ilk çift, ilk eser, baş usta, Altın Çağ', archive.querySelectorAll('.chronicle-gold').length >= 4 && text.includes('Mekanizma & Çan') && text.includes('Altın Çağ'));
    archive.querySelector('.archive-tab[data-tab="archive"]').click();
    game.render(0);
    check('Kasaba Arşivi sekmesine geri dönülür', !archive.querySelector('.archive-view').hidden);
    game.events.emit('ui:toggleStats');
    window.__s20 = { since: JSON.stringify(st.goldenAge.since), chimes: st.goldenAge.chimes, books: st.goldenAge.books, founders: ch.founders.length, master: GA.towerMasterOf(st)?.name, stages: Object.keys(ch.towerStages).length, couple: ch.firstCouple?.a, fountain: mf.id };
  }

  // --- Kayıt gidiş-dönüşü (sürüm 17) ---
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
  check('kayıt sürümü 17', raw.version === 17);
  // (20. aşama) Altın Çağ, Tarihçe Kütüğü, prestij yapısı kaydı
  {
    const T = window.__s20;
    check('kayıttan Altın Çağ (başlangıcı, çan sayısı, antik kitaplar) döner', JSON.stringify(s2.goldenAge.since) === T.since && s2.goldenAge.chimes === T.chimes && s2.goldenAge.books === T.books);
    check('kayıttan Tarihçe Kütüğü (kurucular, ilk çift, kulenin aşamaları ve baş ustası) döner', s2.chronicle.founders.length === T.founders && Object.keys(s2.chronicle.towerStages).length === T.stages && s2.chronicle.firstCouple?.a === T.couple && (await import('/src/systems/GoldenAge.js')).towerMasterOf(s2)?.name === T.master);
    check('kayıttan Mermer Çeşme ve Kadim Dişli stoğu döner', s2.buildings.some((b) => b.id === T.fountain && b.type === 'marbleFountain') && s2.resources.gears === raw.resources.gears);
  }
  // (19. aşama) evlilik, ortak ev, huylar, dedikodu kaydı
  {
    const T = window.__s19;
    const a2 = s2.characters.find((c) => c.id === T.a);
    const b2 = s2.characters.find((c) => c.id === T.b);
    check('kayıttan evli çift ve ortak evleri döner', a2?.married && b2?.married && a2.partnerId === T.b && a2.homeId === T.home && b2.homeId === T.home);
    check('kayıttan karakter huyları döner', s2.characters.every((c) => T.quirks[c.id] === undefined || c.quirk === T.quirks[c.id]));
    check('kayıttan son duyulan haber ve dolaşan dedikodular döner', s2.characters.find((c) => c.id === T.news.id)?.lastNews?.text === T.news.text && s2.social.gossip.length === T.gossip);
    check('kayıttan akşam yemeği günü ve sosyal sayaçlar döner', a2.dinnerDay === T.dinnerDay && s2.stats.dates === T.dates && s2.stats.familyDinners === T.dinners);
  }
  // (18. aşama) peyzaj kaydı
  {
    const L = window.__l18;
    const sign2 = s2.buildings.find((b) => b.id === L.sign.id);
    const tree2 = s2.buildings.find((b) => b.id === L.tree.id);
    check('kayıttan tabelanın adı döner', sign2?.label === L.sign.label && sign2.name === L.sign.label);
    check('kayıttan süs ağacının dikiliş anı ve büyümesi döner', tree2?.plantedAt === L.tree.plantedAt && tree2.growthStage === 2);
    check('kayıttan yıkım iadesinin küsuratı ve döşenen yol sayacı döner', JSON.stringify(s2.landscape.refundCredit) === JSON.stringify(L.credit) && s2.landscape.roadsPainted === L.roads);
    check('kayıttan çit kapısı yine yürünebilir ve çitler birleşik', game.scenes.current.world.map.isWalkable(L.gate.x, L.gate.y) && s2.buildings.find((b) => b.id === L.gateId)?.connect?.left);
    check('yüklenince kasaba estetiği yeniden hesaplanır', s2.landscape.score > 0 && game.scenes.current.world.aesthetics.some((v) => v > 0));
  }
  check('kayıttan anılar döner', s2.characters.find((c) => c.id === window.__mem.id)?.memories.length === window.__mem.count);
  check('kayıttan festival geçmişi, kervan seferi ve sayaçlar döner', ['spring', 'summer', 'autumn', 'winter'].every((t) => s2.seasonFestival.held[t] >= 1) && s2.trade.grandVoyages >= 1 && s2.stats.rallies >= 1 && s2.stats.seasonFestivals >= 4);
  check('kayıttan yadigârlar, ipek ve fermanlar döner', RELIC_KEYS.every((id) => s2.luxury.relics[id]) && s2.luxury.silk && s2.luxury.decreeDays.goldBonus !== undefined && s2.luxury.goldSpent === s.luxury.goldSpent);
  check('kayıttan arşiv ve sayaçlar döner', s2.history.length === s.history.length && s2.stats.weddings === s.stats.weddings);
  check('kayıttan sakin adı ve sabit işçi döner', s2.characters.some((c) => c.id === window.__renamed.id && c.name === window.__renamed.name && c.customName) && s2.characters.find((c) => c.id === window.__pin.id)?.workplaceId === window.__pin.buildingId, `${s2.characters.map((c) => c.name).join(',')} pin ${s2.characters.find((c) => c.id === window.__pin.id)?.workplaceId}/${window.__pin.buildingId} önce ${s.characters.find((c) => c.id === window.__pin.id)?.workplaceId}`);
  check('kayıttan kemer yine altından geçilir', !window.__arch || (game.scenes.current.world.map.isWalkable(window.__arch.x, window.__arch.y) && game.scenes.current.world.map.getOccupant(window.__arch.x, window.__arch.y) === window.__arch.id));
  check('kayıttan araştırmalar döner', ['gears', 'architecture', 'herbalism', 'insulation'].every((id) => s2.research.done[id]) && s2.research.active === null);
  check('kayıttan liman, hazine ve ihracat döner', s2.trade.shipments === raw.trade.shipments && raw.trade.shipments >= 2 && s2.trade.goldEarned > 0 && s2.resources.gold === raw.resources.gold && s2.buildings.find((b) => b.type === 'harbor')?.exportThreshold === null);
  check('kayıttan harika aşaması döner', s2.buildings.find((b) => b.type === 'wonder')?.wonderStage === 3 && s2.buildings.find((b) => b.type === 'wonder')?.wonderComplete);
  check('kayıttan okul mezunu döner', s2.characters.some((c) => c.educated));
  check('kayıttan hayvanlar ve adları döner', s2.animals.length === animals && s2.animals.some((a) => a.name === cat.name));
  check('kayıttan hastalık, iksir ve hasar döner', ill2?.illness && s2.buildings.find((b) => b.id === hut.id)?.remedies === 4 && s2.buildings.find((b) => b.id === farm.id)?.damaged);
  check('kayıttan usta işi eserler (sergilenen ve satılanlar) döner', s2.masterworks.items.length === raw.masterworks.items.length && s2.masterworks.made === raw.masterworks.made && raw.masterworks.made >= window.__mw15.made && s2.masterworks.items.filter((i) => i.status === 'exhibited').length === raw.masterworks.items.filter((i) => i.status === 'exhibited').length);
  check('yüklenince ustanın kıyafeti deneyiminden yeniden giyilir', s2.characters.find((c) => c.id === window.__mw15.makerId)?.outfit === 'miner:3');
  check('kayıttan keşif ganimetleri, yazıtlar ve şemalar döner', Object.keys(s2.exploration.inscriptions).length === window.__x16.inscriptions && s2.exploration.cityMap === window.__x16.map && s2.exploration.expeditions === window.__x16.expeditions && s2.exploration.inscriptions.aqueduct?.status === 'decoded');
  check('kayıttan maceracıların anlatacağı hikâyeler döner', s2.characters.filter((c) => window.__x16.teamIds.includes(c.id) && c.tale).length === window.__x16.tales);
  check('kayıttan ferman ve fırtına döner', s2.civic.storageLevel === 1 && s2.civic.craftGuild && s2.dilemma.storm?.fortified);
  return out;
});
results.push(...pageResults);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
