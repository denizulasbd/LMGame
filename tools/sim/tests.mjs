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
//   21. aşama: kişisel kese ve çanta (harçlık, yuvalar, istif, yevmiye, iş yerinden pay, çantadan yemek, şifalı ot,
//              pazar alışverişi, han azığı, Kişisel Kese & Çanta kartı), vatandaş dilekçeleri (huy / meslek eşlemesi,
//              oluşma, kabul, hemen karşılama, ret, süre dolması, stok / alet / buluşma, kart ve üst çubuk), Yönetim Güveni
//              (refah, açlık, soğuk, şenlik), isyan (12 saatlik eşik, isyancılar, alarm), yağma (kasaba deposundan
//              yağmacıların çantasına / kesesine birebir), yatıştırma (erzak ve altın dağıtımı), kayıt sürümü 18
//   22. aşama: iç vergi kademeleri (keselerden hazineye birebir, öşür, güven / keyif / verim etkileri, takvim, panel
//              düğmeleri), Krallık Vergisi (ölçeklenme, 2 gün önce tahsildar uyarısı, ödeme, malla ödeme, ceza), Kraliyet
//              Fermanları (seviye kilidi, beş ferman, teslim ve ödüller, Kraliyet Beratı ve Aslanlı Heykel, süre dolması ve
//              ret cezası), kötü şöhretin göçe etkisi, köyü terk etme (eşik, aile, çekirdek sakinler, referans temizliği,
//              bitişi), kayıt sürümü 19
//   23. aşama: yangın ve itfaiye, Su Kuyusu, Gözcü Kulesi ve bekçiler, haydut baskınları, hasar / tamir, yaralanma, kayıt sürümü 20
//   24. aşama (24.1): bahçenin ekim tercihi (Buğday / Keten / Şerbetçiotu; değiştirme döngüsü, geçersiz seçimler, gerçek hasat,
//              ilk mal, etkinlik metni, kışın donma), Mallar listesindeki yeni kalemler, Ürün Silosu (seviye kilidi, +150 tarımsal
//              kapasite, iki silo, fırının ekmek deposu), silosuz kasabada yağmurda / kışın mahsul bozulması ve silonun koruması,
//              Ekim Tercihi paneli, tarla ve silo görselleri, kayıt sürümü 21 (gidiş-dönüş, bozuk değerler, v20 kaydı)
//   24. aşama (24.2): Dokuma Tezgâhı ve Şerbethane (tanım, Kasaba kilidi, 2:1 girdi-çıktı oranları gerçek performWork ile, ilk mal,
//              malzemesizken / depo doluyken / kasaba açken boşta kalma), lüks iş önceliği (temel yuvalar önce, dolunca tezgâha), gerçek
//              vardiya (sabit dokumacı, yevmiye, deneyim), han ikmali, handa şerbet (+15 keyif, iki kat keyif ve sosyallik, Keyifli
//              Damak), Şerbet Testisi alma / içme, Dayanıklı Giysi (mevsim, kumaş stoğu, soğuk koruması), kumaşın refah katkısı, HUD ve
//              paneller, görseller, kayıt sürümü 22 (gidiş-dönüş, bozuk değerler, v21 kaydı)
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

  // --- Kayıt gidiş-dönüşü (sürüm 19) ---
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
  check('kayıt sürümü 22', raw.version === 22);
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
  // ===== 21. aşama: kişisel kese ve çanta, vatandaş dilekçeleri, Yönetim Güveni, isyan ve yağma =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const CZ = await import('/src/systems/Citizens.js');
    const CD = await import('/src/data/citizens.js');
    const PT = await import('/src/systems/Petitions.js');
    const TR = await import('/src/systems/TrustSystem.js');
    const { Character: Ch } = await import('/src/entities/Character.js');
    const now = () => st.totalMinutes;
    sim.give({ wood: 300, stone: 300, food: 250, bread: 60, iron: 80, gold: 2000 });
    for (const t of ['market', 'mill', 'healerHut', 'inn', 'storage', 'workshop']) if (!W.getCompleted(t).length) sim.place(t);
    const hudOf = () => game.ui.components.find((x) => x.renderWelfare);
    const renderNow = () => {
      hudOf().welfareAt = -Infinity; // üst çubuk yarım saniyede bir yenilenir: hemen çizilsin
      game.render(0);
    };
    st.petitions.list = [];
    st.petitions.nextAt = now() + 1e6; // bu bölümde dilekçeleri test kendisi açar
    if (st.trust.revolt) S.trust.endRevolt();
    st.trust.value = 75;
    const adults = st.characters.filter((c) => !c.isChild && !c.away && c.visible);
    const A = adults[0];
    const B = adults[1];
    const resetBag = (c) => {
      c.inventory = [];
      c.equipment.bag = null;
    };

    // --- Kişisel kese ve çanta ---
    const fresh = new Ch({ id: 99001, name: 'Deneme', traits: [], appearance: A.appearance });
    const kid = new Ch({ id: 99002, name: 'Minik', traits: [], appearance: A.appearance, growsUpAt: 1e9 });
    check('yeni sakine başlangıç harçlığı (yetişkin 12, çocuk 3) ve boş çanta', fresh.coins === CD.PURSE.allowance.adult && kid.coins === CD.PURSE.allowance.child && fresh.inventory.length === 0);
    check('her sakinin kesesi sayı ve çantası dizi', st.characters.every((c) => Number.isFinite(c.coins) && c.coins >= 0 && Array.isArray(c.inventory)));
    const keepBag = A.equipment.bag;
    resetBag(A);
    check('çanta 4 yuva; Sırt Çantası kuşanınca 6; çocukta 2 (ekipman yuvası değişmez)', CZ.inventoryCapacity(A) === 4 && (A.equipment.bag = 'backpack', CZ.inventoryCapacity(A) === 6) && CZ.inventoryCapacity(kid) === 2 && A.equipment.bag === 'backpack');
    A.equipment.bag = null;
    const put = CZ.addItem(A, 'bread', 8);
    check('eşyalar istiflenir (ekmek 6\'lık yığın), fazlası yeni yuvaya', put === 8 && A.inventory.length === 2 && A.inventory[0].qty === 6 && CZ.countItem(A, 'bread') === 8);
    CZ.addItem(A, 'souvenir', 1, 'Boncuk Kolye');
    CZ.addItem(A, 'herb', 1);
    check('çanta dolunca yeni tür sığmaz', CZ.addItem(A, 'fruit', 1) === 0 && A.inventory.length === 4 && CZ.roomFor(A, 'fruit') === 0);
    check('çantadan eşya çıkar', CZ.takeItem(A, 'bread', 3) === 3 && CZ.countItem(A, 'bread') === 5);
    check('çantanın kısa yazımı adlı hatırayı gösterir', CZ.describeInventory(A).includes('Boncuk Kolye') && CZ.describeInventory(A).includes('Ekmek ×'));
    resetBag(A);

    // Yevmiye: gerçek bir vardiya bitince
    let shift = null;
    for (const c of adults) {
      if (shift) break;
      S.behavior.endTask(c);
      const plan = S.behavior.brain.planWork(c);
      if (!plan?.workBuildingId) continue;
      S.behavior.startPlan(c, plan, 10);
      if (!c.task) continue;
      c.clearPath();
      c.task.phase = 'perform';
      shift = c;
    }
    if (shift) {
      const before = shift.coins;
      const wages = st.stats.wagesPaid;
      shift.task.elapsed = (shift.task.duration ?? 60) + 1;
      sim.step(1);
      check('vardiya bitince yevmiye keseye girer (hazineden düşülmez)', shift.coins >= before + CD.PURSE.wage.shift && st.stats.wagesPaid > wages, `${before}->${shift.coins}`);
    } else check('vardiya bitince yevmiye keseye girer (hazineden düşülmez)', false, 'çalışan yok');
    let coins = B.coins;
    const gold = st.resources.gold;
    game.events.emit('work:jobDone', { character: B, job: { type: 'build' }, yields: {} });
    game.events.emit('work:jobDone', { character: B, job: { type: 'chop' }, yields: {} });
    game.events.emit('masterwork:created', { character: B, piece: { name: 'x' } });
    check('inşaat (+2), hasat (+1) ve usta işi eser (+15) ödülü; kasaba hazinesi değişmez', B.coins === coins + 18 && st.resources.gold === gold, `${coins}->${B.coins}`);
    coins = kid.coins;
    S.purse.pay(kid, 5);
    check('çocuklara yevmiye ödenmez', kid.coins === coins);

    // İş yerinden pay: fırıncı ekmeği kasaba stoğundan alır (kaybolmaz, çantaya geçer)
    const mill = W.getCompleted('mill')[0];
    resetBag(B);
    sim.give({ bread: 40 });
    let townBread = st.resources.bread;
    for (let i = 0; i < 60 && CZ.countItem(B, 'bread') === 0; i++) S.purse.onShift(B, mill);
    check('fırıncı vardiya sonunda ekmek payını kasaba stoğundan çantasına alır', CZ.countItem(B, 'bread') === 1 && st.resources.bread === townBread - 1, `${townBread}->${st.resources.bread}`);
    resetBag(B);
    for (let i = 0; i < 60 && CZ.countItem(B, 'herb') === 0; i++) S.purse.onShift(B, W.getCompleted('healerHut')[0]);
    const hutB = W.getCompleted('healerHut')[0];
    check('şifacı kulübesinden şifalı ot payı', CZ.countItem(B, 'herb') === 1 || (hutB?.herbs ?? 0) < 3, `ot ${hutB?.herbs}`);

    // Çantadan yemek
    resetBag(B);
    CZ.addItem(B, 'bread', 2);
    S.behavior.endTask(B);
    B.needs.hunger = 10;
    const snackPlan = S.behavior.brain.decide(B, 13);
    check('çok acıkınca yürümeden çantasından yer (snack)', snackPlan.activity === 'snack' && snackPlan.bagItem === 'bread', snackPlan.activity);
    S.behavior.startPlan(B, snackPlan, 13);
    sim.step(3);
    const snackLabel = B.activityLabel;
    const meals = st.stats.bagMeals;
    for (let i = 0; i < 300 && B.task?.activity === 'snack'; i++) sim.step(5);
    check('çantadaki ekmek yenir: tokluk dolar, ekmek azalır, sayaç artar', B.needs.hunger >= 60 && CZ.countItem(B, 'bread') < 2 && st.stats.bagMeals === meals + 1, `${Math.round(B.needs.hunger)} ${CZ.countItem(B, 'bread')}`);
    check('durum metni: "Çantasından ekmek çıkarıp yiyor"', snackLabel === 'Çantasından ekmek çıkarıp yiyor', snackLabel);

    // Şifalı ot çayı
    resetBag(B);
    CZ.addItem(B, 'herb', 1);
    S.health.fallIll(B);
    const remain = B.illness.remaining;
    S.behavior.endTask(B);
    B.needs.hunger = 90;
    const tea = S.behavior.brain.decide(B, 13);
    check('üşüyen sakin çantasındaki şifalı otu demler', tea.activity === 'herbTea', tea.activity);
    S.purse.herbTea(B);
    check('şifalı ot hastalığın kalan süresini %40 kısaltır ve çantadan çıkar', Math.abs(B.illness.remaining - remain * 0.6) < 1e-6 && CZ.countItem(B, 'herb') === 0);
    B.illness = null;

    // Pazar alışverişi ve han azığı
    const market = W.getCompleted('market')[0];
    resetBag(B);
    B.coins = 20;
    const bought = S.purse.shop(B, market);
    check('Pazar Yeri\'nden alışveriş: kese azalır, eşya çantaya girer', bought && B.coins === 20 - CD.SHOP.prices[bought] && CZ.countItem(B, bought) === 1, bought);
    const bought2 = S.purse.shop(B, market);
    check('hatıra adıyla çantada durur ve anıya yazılır', [bought, bought2].includes('souvenir') && B.inventory.some((x) => x.kind === 'souvenir' && x.name) && B.memories.at(-1).text.includes("Pazar Yeri'nden"), `${bought},${bought2}`);
    B.coins = 2;
    resetBag(B);
    check('kesesi yetmeyen alışveriş yapamaz', S.purse.shop(B, market) === 'fruit' ? B.coins === 0 : B.coins === 2);
    B.coins = 20;
    resetBag(B);
    S.behavior.endTask(B);
    B.lastShopAt = null;
    B.needs = { hunger: 95, energy: 95, social: 95, fun: 95 };
    let shopPlan = null;
    for (let i = 0; i < 200 && shopPlan?.activity !== 'shop'; i++) {
      B.lastShopAt = null;
      shopPlan = S.behavior.brain.decide(B, 19);
    }
    check('boş zamanında kesesi olan sakin Pazar Yeri\'ne alışverişe gider', shopPlan?.activity === 'shop' && shopPlan.buildingId === market.id);
    const inn = W.getCompleted('inn')[0];
    inn.meals = 6;
    resetBag(B);
    let took = false;
    for (let i = 0; i < 80 && !took; i++) took = S.purse.takeaway(B, inn);
    check('handa yemekten sonra azık (Börek) alır: handaki pişmiş yemek bir azalır', took && CZ.countItem(B, 'pie') === 1 && inn.meals === 5);

    // Karakter kartı: Kişisel Kese & Çanta
    game.events.emit('ui:selectCharacter', B.id);
    renderNow();
    const pbox = document.querySelector('.character-panel .purse-box');
    const card = pbox?.closest('.character-panel');
    const purseText = pbox?.textContent ?? '';
    check('Karakter kartında "Kişisel Kese & Çanta" satırı: altın ve çantadaki eşyalar', card && !card.hidden && card.textContent.includes('Kişisel Kese & Çanta') && purseText.includes(String(B.coins)) && purseText.includes('Börek') && pbox.querySelectorAll('.bag-slot').length === CZ.inventoryCapacity(B), purseText);

    // --- Vatandaş dilekçeleri ---
    const nat = adults.find((c) => c.homeId !== null) ?? A;
    const natQuirk = nat.quirk;
    nat.quirk = 'natureEnthusiast';
    const opts = Object.fromEntries(S.petitions.optionsFor(nat));
    check('Doğa Tutkunu en çok fidan ister', opts.sapling === 5 && Object.values(opts).every((w) => w <= 5));
    const bw = adults.find((c) => c !== nat);
    const keepQuirk = bw.quirk;
    bw.quirk = 'bookworm';
    const bwOpts = Object.keys(Object.fromEntries(S.petitions.optionsFor(bw)));
    check('Kitap Kurdu Bilgelik Evi / araştırma / antik kitap ister', bwOpts.some((k) => ['academy', 'research', 'books'].includes(k)), bwOpts.join(','));
    bw.quirk = 'musician';
    check('Müzisyen meydanda buluşma ister', Object.fromEntries(S.petitions.optionsFor(bw)).gathering === 5);
    bw.quirk = keepQuirk;
    const toasts = [];
    const offToast = game.events.on('toast', (t) => toasts.push(t.text));
    const p1 = S.petitions.create('sapling', nat.id);
    offToast();
    check('dilekçe oluşur: parşömen balonu, günlük ve bildirim', p1 && p1.kind === 'sapling' && (!nat.visible || nat.bubble?.icon === 'scroll') && st.journal.slice(-3).some((j) => j.text.startsWith('Dilekçe') && j.icon === 'scroll') && toasts.some((t) => t.includes('fidan')), p1?.kind);
    check('dilekçenin süresi 2,5 gün', p1.deadline - p1.createdAt === CD.PETITIONS.deadlineMinutes);
    check('aynı sakin aynı anda tek dilekçe verir', S.petitions.create('sapling', nat.id) === null);
    game.events.emit('ui:selectCharacter', nat.id);
    renderNow();
    const box = document.querySelector('.character-panel .petition-box');
    check('kartta dilekçe kutusu: istek, ne yapılmalı, kalan süre, Kabul Et / Fidanı Dik / Reddet', !box.hidden && box.textContent.includes('Evimin yakınına') && box.textContent.includes('Kalan süre') && [...box.querySelectorAll('button')].map((b) => b.textContent).join(',') === 'Kabul Et,Fidanı Dik,Reddet');
    const hudChips = [...document.querySelectorAll('.hud-buffs .buff-chip.is-petition')].map((b) => b.textContent);
    check('üst çubukta dilekçe çipi (tıklayınca sakin seçilir)', hudChips.some((t) => t.includes(nat.name)), hudChips.join('|'));
    // Kabul ve hemen karşılama
    const trust0 = st.trust.value = 60;
    game.events.emit('ui:acceptPetition', { id: p1.id });
    check('kabul: söz verildi, yarım gün ek süre, güven +1', p1.status === 'accepted' && p1.deadline - p1.createdAt === CD.PETITIONS.deadlineMinutes + CD.PETITIONS.acceptExtraMinutes && st.trust.value === trust0 + 1);
    const fun0 = nat.needs.fun = 40;
    const wood0 = st.resources.wood;
    game.events.emit('ui:grantPetition', { id: p1.id });
    const tree = st.buildings.filter((b) => PT.PETITION_TYPES.sapling.includes(b.type) && !(p1.baseline.ids ?? []).includes(b.id)).find((b) => PT.distanceToHome(W.getBuilding(nat.homeId), b) <= CD.PETITIONS.nearHome);
    check('"Fidanı Dik": evinin yakınına fidan dikilir (bedeli ödenir)', tree && st.resources.wood < wood0, tree?.type);
    check('karşılanan dilekçe: güven +8, keyif +20, olumlu anı, "Sesimiz Duyuldu" refah bonusu', !S.petitions.find(p1.id) && st.trust.value === trust0 + 1 + 8 && nat.needs.fun === fun0 + 20 && nat.memories.at(-1).fond && nat.memories.at(-1).text.includes('dileği yerine getirildi') && st.buffs.heard > now() && st.petitions.log.at(-1).outcome === 'fulfilled', `${st.trust.value}`);
    // Ret
    const p2 = S.petitions.create('street', nat.id) ?? S.petitions.create(null, nat.id);
    st.trust.value = 60;
    nat.needs.fun = 50;
    game.events.emit('ui:selectCharacter', nat.id);
    renderNow();
    [...document.querySelectorAll('.character-panel .petition-box button')].find((b) => b.textContent === 'Reddet').click();
    check('"Reddet" düğmesi: güven -5, keyif -12, olumsuz anı', !S.petitions.find(p2.id) && st.trust.value === 55 && nat.needs.fun === 38 && nat.memories.at(-1).fond === false && st.petitions.log.at(-1).outcome === 'rejected');
    // Süre dolması (kabul edilmiş: ek ceza)
    const p3 = S.petitions.create('stock', A.id) ?? S.petitions.create('tool', A.id) ?? S.petitions.create(null, A.id);
    st.resources.wood = 0;
    game.events.emit('ui:acceptPetition', { id: p3.id });
    st.trust.value = 60;
    p3.deadline = now();
    S.petitions.hourly(12);
    check('süresi dolan dilekçe: güven -6 (sözü tutulmadıysa -3 daha), olumsuz anı', !S.petitions.find(p3.id) && (st.petitions.log.at(-1).outcome === 'expired' ? st.trust.value === 60 - 9 : st.petitions.log.at(-1).outcome === 'fulfilled'), `${st.petitions.log.at(-1).outcome} ${st.trust.value}`);
    sim.give({ wood: 250 });
    // Kışlık stok: hedefe ulaşınca kendiliğinden karşılanır
    st.resources.wood = 20;
    st.resources.food = 20;
    st.resources.bread = 0;
    st.pantry.credit = 0;
    const pS = S.petitions.open(B, 'stock');
    check('kışlık stok dilekçesinin hedefi var; ilerleme metni', pS.target.wood > 20 && pS.target.food > 20 && PT.petitionProgress(st, pS).includes(`Odun 20/${pS.target.wood}`));
    S.petitions.hourly(10);
    check('stok hedefe ulaşmadan karşılanmaz', S.petitions.find(pS.id));
    sim.give({ wood: pS.target.wood, food: pS.target.food });
    S.petitions.hourly(11);
    check('stok güvenli seviyeye çıkınca dilekçe karşılanır', !S.petitions.find(pS.id) && st.petitions.log.at(-1).outcome === 'fulfilled');
    // Sağlam alet
    const keepTool = B.equipment.tool;
    B.equipment.tool = null;
    st.equipment.sturdyTool = 0;
    const pT = S.petitions.open(B, 'tool');
    const iron0 = st.resources.iron;
    game.events.emit('ui:grantPetition', { id: pT.id });
    check('"Aleti Ver": Sağlam Alet kuşanır (demir ve odun ödenir), dilekçe karşılanır', B.equipment.tool === 'sturdyTool' && st.resources.iron === iron0 - CD.PETITION_KINDS.tool.grant.iron && !S.petitions.find(pT.id));
    B.equipment.tool = keepTool;
    // Meydanda buluşma: Toplanma Zili
    st.rally = null;
    const pG = S.petitions.open(B, 'gathering');
    game.events.emit('ui:grantPetition', { id: pG.id });
    check('"Zili Çal": toplanma zili çalar, buluşma dilekçesi karşılanır', !S.petitions.find(pG.id) && st.rally && st.petitions.log.at(-1).outcome === 'fulfilled');
    st.rally = null;
    // Kendiliğinden oluşma aralığı
    st.time.hour = 10;
    st.petitions.nextAt = now();
    const made0 = st.petitions.made;
    S.petitions.hourly(10);
    const gap = st.petitions.nextAt - now();
    check('dilekçeler kendiliğinden 2-3 günde bir gelir', st.petitions.made === made0 + 1 && gap >= CD.PETITIONS.intervalMinutes[0] && gap <= CD.PETITIONS.intervalMinutes[1], gap);
    st.petitions.list = [];
    st.petitions.nextAt = now() + 1e6;

    // --- Yönetim Güveni ---
    st.trust.value = 50;
    st.heating.cold = false;
    for (const c of st.characters) c.needs.hunger = Math.max(c.needs.hunger, 60);
    st.town.welfare = 80;
    S.trust.hourly();
    check('yüksek refahta (%70+) güven saat başı artar', Math.abs(st.trust.value - 50.25) < 1e-6, st.trust.value);
    st.town.welfare = 30;
    st.trust.value = 50;
    S.trust.hourly();
    check('refah %35 altında güven erir', Math.abs(st.trust.value - 49.5) < 1e-6, st.trust.value);
    st.town.welfare = 50;
    st.trust.value = 50;
    st.heating.cold = true;
    const starving = st.characters.slice(0, 3);
    for (const c of starving) c.needs.hunger = 5;
    S.trust.hourly();
    check('açlık ve soğuk güveni düşürür', st.trust.value < 50 - 0.3 - 0.06 * 2, st.trust.value);
    st.heating.cold = false;
    for (const c of starving) c.needs.hunger = 70;
    st.trust.value = 70;
    S.trust.trust.eventDays = {};
    S.trust.onEvent('festival');
    check('şenlik güveni artırır', st.trust.value === 70 + CD.TRUST.events.festival);
    renderNow();
    const tm = document.querySelector('.hud .trust-mini');
    const tf = document.querySelector('.hud .trust-mini-fill');
    check('üst çubukta refahın yanında Yönetim Güveni (ince çubuk ve kalkan); ipucunda yüzdesi', tm && tm.dataset.trust === String(Math.round(st.trust.value)) && tf.style.width === `${Math.round(st.trust.value)}%` && document.querySelector('.hud-welfare').title.includes(`Yönetim Güveni: %${Math.round(st.trust.value)}`));

    // --- İsyan ---
    for (const c of st.characters) c.needs.fun = 15;
    st.town.welfare = 30;
    st.trust.value = 20;
    st.trust.lowSince = null;
    S.trust.hourly();
    check('güven kritik eşiğin altına inince isyan hemen çıkmaz (12 saat bekler)', !st.trust.revolt && st.trust.lowSince !== null);
    st.trust.lowSince = now() - CD.REVOLT.graceHours * 60;
    st.trust.value = 20;
    S.trust.hourly();
    const rv = st.trust.revolt;
    const adultCount = st.characters.filter((c) => !c.isChild && !c.role).length;
    check('güven 12 saat %25 altında kalınca isyan çıkar', rv && rv.rioters.length >= CD.REVOLT.minRioters && rv.rioters.length <= Math.ceil(adultCount * CD.REVOLT.maxShare) && st.stats.revolts >= 1, rv?.rioters.length);
    check('isyan kasaba günlüğüne alarm düşer', st.journal.slice(-4).some((j) => j.text.startsWith('ALARM') && j.icon === 'torch'));
    const rioter = W.getCharacter(rv.rioters[0]);
    S.behavior.endTask(rioter);
    rioter.needs = { hunger: 90, energy: 90, social: 60, fun: 15 };
    rioter.carrying = null;
    const riotPlan = S.behavior.brain.decide(rioter, 10);
    check('isyancı mesaide işe gitmez, meydanda öfkeyle toplanır', riotPlan.activity === 'protest', riotPlan.activity);
    S.behavior.startPlan(rioter, riotPlan, 10);
    check('isyancının durum metni: öfkeyle meydana yürüyor', /öfke|Öfke|yönetime/.test(rioter.activityLabel), rioter.activityLabel);
    renderNow();
    check('üst çubukta isyan alarmı', [...document.querySelectorAll('.hud-buffs .buff-chip.is-revolt')].some((b) => b.textContent.includes('İsyan')));
    // Yağma: gerçek baskın (Kiler)
    const storage = W.getCompleted('storage')[0];
    sim.give({ food: 120, wood: 120, gold: 500 });
    const res0 = { food: st.resources.food, wood: st.resources.wood, gold: st.resources.gold };
    const totals = () => st.characters.reduce((a, c) => {
      const r = CZ.inventoryResources(c);
      a.food += r.food ?? 0;
      a.wood += r.wood ?? 0;
      a.coins += c.coins;
      return a;
    }, { food: 0, wood: 0, coins: 0 });
    const t0 = totals();
    for (const id of rv.rioters) resetBag(W.getCharacter(id));
    const t0b = totals();
    const hasHall = st.buildings.some((b) => b.functional && b.type === 'townHall');
    const lootedEv = { food: 0, wood: 0, gold: 0 };
    const offLoot = game.events.on('riot:looted', ({ goods, gold }) => {
      lootedEv.food += goods.food ?? 0;
      lootedEv.wood += goods.wood ?? 0;
      lootedEv.gold += gold;
    });
    const raid = S.trust.startRaid(storage.id);
    check('yağma baskını: en çok 3 isyancı Kiler\'e yürür', raid && raid.members.length >= 1 && raid.members.length <= 3 && raid.members.every((id) => rv.rioters.includes(id)) && raid.members.every((id) => W.getCharacter(id).task?.activity !== 'protest'));
    st.time.hour = 10;
    for (let i = 0; i < 12 && st.trust.revolt?.raids.length; i++) sim.step(225);
    offLoot();
    const t1 = totals();
    check('yağmacılar Kiler\'e yürüyüp erzak ve odun yağmalar', lootedEv.food > 0 && lootedEv.wood > 0 && raid.members.some((id) => CZ.countItem(W.getCharacter(id), 'firewood') > 0), JSON.stringify(lootedEv));
    check('yağmalanan odun çantalarda: kasaba deposundan düşülenle birebir', t1.wood - t0b.wood === lootedEv.wood, `${t1.wood - t0b.wood}/${lootedEv.wood}`);
    // Birebir aktarım (anlık ölçüm): bir yağmacının tek baskını
    const looter0 = W.getCharacter(st.trust.revolt.rioters[0]);
    resetBag(looter0);
    sim.give({ food: 100, wood: 100 });
    st.trust.revolt.raids.push({ id: 998, targetId: storage.id, target: storage.name, members: [looter0.id], done: [], startedAt: now(), until: now() + 240, goods: {}, gold: 0 });
    const before1 = { food: st.resources.food, wood: st.resources.wood, gold: st.resources.gold, coins: looter0.coins };
    const got1 = S.trust.loot(looter0, storage);
    const inv1 = CZ.inventoryResources(looter0);
    check('yağmalanan mallar kaybolmaz: kasaba deposundan düşülen erzak ve odun birebir yağmacının çantasına geçer', got1 && before1.food - st.resources.food === inv1.food && before1.wood - st.resources.wood === inv1.wood && inv1.food === Math.min(CD.REVOLT.loot.food, 12) && inv1.wood > 0, JSON.stringify([inv1, before1.food - st.resources.food]));
    check('yağmacının çantasındaki yer sınırı aşılmaz', looter0.inventory.length <= CZ.inventoryCapacity(looter0));
    const goldLoot = lootedEv.gold;
    check(hasHall ? 'Kiler yağmasında hazine (Belediye Konağı\'nda) korunur' : 'Kiler yağmasında hazineden altın da yağmalanır', hasHall ? goldLoot === 0 : goldLoot > 0, `${goldLoot}`);
    check('yağma günlüğe, sayaçlara ve yağmacının anısına yazılır', st.stats.raids >= 1 && st.stats.lootedGoods >= lootedEv.wood && st.journal.some((j) => j.text.startsWith('ALARM · Yağma')) && raid.members.some((id) => W.getCharacter(id).memories.at(-1)?.text.includes('yağmasına')));
    // Hazine yağması: Belediye Konağı
    const hall = W.getCompleted('townHall')[0];
    if (hall) {
      const looter = W.getCharacter(st.trust.revolt.rioters[0]);
      const raid2 = { id: 999, targetId: hall.id, target: hall.name, members: [looter.id], done: [], startedAt: now(), until: now() + 240, goods: {}, gold: 0 };
      st.trust.revolt.raids.push(raid2);
      const g0 = st.resources.gold;
      const c0 = looter.coins;
      const got = S.trust.loot(looter, hall);
      check('Belediye Konağı yağması: hazineden düşülen altın birebir yağmacının kesesine geçer', got.gold > 0 && g0 - st.resources.gold === got.gold && looter.coins - c0 === got.gold && got.gold <= CD.REVOLT.loot.gold);
    } else check('Belediye Konağı yağması: hazineden düşülen altın birebir yağmacının kesesine geçer', true, 'konak yok');
    // Yatıştırma
    st.town.welfare = 60;
    st.trust.relief = {};
    st.trust.value = 20;
    const foodStatus = TR.reliefStatus(st, 'food');
    const supply0 = scene.economy.foodSupply();
    game.events.emit('ui:relief', { kind: 'food' });
    check('acil erzak dağıtımı: yiyecek harcanır, güven +10', st.trust.value === 30 && Math.round(supply0 - scene.economy.foodSupply()) === foodStatus.cost && st.trust.revolt, st.trust.value);
    check('erzak 12 saatte bir dağıtılabilir', !TR.reliefStatus(st, 'food').ok);
    const g1 = st.resources.gold;
    const someone = W.getCharacter(st.trust.revolt.rioters[0]);
    const sc0 = someone.coins;
    game.events.emit('ui:relief', { kind: 'gold' });
    check('altın dağıtımı: hazineden sakinlerin keselerine, güven eşiği aşınca isyan biter', st.resources.gold < g1 && someone.coins > sc0 && !st.trust.revolt && st.journal.some((j) => j.text.startsWith('İsyan yatıştı')), `${st.trust.value}`);
    S.behavior.endTask(someone);
    someone.needs = { hunger: 90, energy: 90, social: 60, fun: 15 };
    const after = S.behavior.brain.decide(someone, 10);
    check('isyan bitince sakinler işlerinin başına döner', after.activity !== 'protest' && after.activity !== 'loot', after.activity);
    // Refah kritikse isyan güven yüksek olsa da sürer; refah düzelince biter
    st.trust.value = 60;
    st.town.welfare = 20;
    st.trust.lowSince = now() - CD.REVOLT.graceHours * 60;
    S.trust.hourly();
    check('refah uzun süre %25 altında kalırsa da isyan çıkar', st.trust.revolt);
    st.town.welfare = 60;
    st.trust.value = 60;
    S.trust.hourly();
    check('refah ve güven eşiği aşınca isyan kendiliğinden biter', !st.trust.revolt);
    for (const c of st.characters) c.needs.fun = 70;
    st.trust.value = 77;
    nat.quirk = natQuirk;
    // Kayıt için açık bir dilekçe ve dolu bir çanta bırak
    resetBag(A);
    CZ.addItem(A, 'souvenir', 1, 'Pirinç Yüzük');
    CZ.addItem(A, 'ration', 5);
    A.coins = 321;
    const pk = S.petitions.open(A, 'street');
    A.equipment.bag = keepBag;
    const T = { id: A.id, coins: A.coins, inv: JSON.stringify(A.inventory), trust: st.trust.value, pid: pk.id, pkind: pk.kind, deadline: pk.deadline, made: st.petitions.made, revolts: st.trust.revolts, raids: st.stats.raids };
    // --- Kayıt gidiş-dönüşü (sürüm 18): kese, çanta, dilekçe, güven ---
    game.events.emit('ui:save');
    const raw18 = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    game.events.emit('ui:load');
    const s3 = game.state;
    const a3 = s3.characters.find((c) => c.id === T.id);
    check('kayıt sürümü 22: sakinlerin kesesi ve çantası kayda yazılır', raw18.version === 22 && raw18.characters.every((c) => Number.isFinite(c.coins) && Array.isArray(c.inventory)) && raw18.trust && raw18.petitions);
    check('kayıttan kişisel kese ve çanta (adlı hatıra dahil) döner', a3?.coins === T.coins && JSON.stringify(a3.inventory) === T.inv, `${a3?.coins} ${JSON.stringify(a3?.inventory)}`);
    check('kayıttan Yönetim Güveni ve isyan sayacı döner', Math.abs(s3.trust.value - T.trust) < 1e-9 && s3.trust.revolts === T.revolts && s3.stats.raids === T.raids);
    const pk3 = s3.petitions.list.find((p) => p.id === T.pid);
    check('kayıttan açık dilekçe (türü, sahibi, süresi) ve sayaçlar döner', pk3?.kind === T.pkind && pk3.characterId === T.id && pk3.deadline === T.deadline && s3.petitions.made === T.made);
  }

  // ===== 22. aşama: iç vergi ve öşür, Krallık Vergisi, Kraliyet Fermanları, Kraliyet Heykeli, köyü terk etme =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const CR = await import('/src/systems/Crown.js');
    const CD = await import('/src/data/crown.js');
    const TS = await import('/src/systems/TownStatus.js');
    const CZ = await import('/src/systems/Citizens.js');
    const now = () => st.totalMinutes;
    const renderNow = () => {
      game.ui.components.find((x) => x.renderWelfare).welfareAt = -Infinity;
      game.render(0);
    };
    sim.give({ wood: 500, stone: 500, food: 300, bread: 80, iron: 80, gold: 3000 });
    st.trust.value = 70;
    if (st.trust.revolt) S.trust.endRevolt();
    st.petitions.list = [];
    st.petitions.nextAt = now() + 1e6;
    st.crown.decree = null;
    st.crown.nextDecreeAt = now() + 1e6;
    st.crown.nextLevyAt = now() + 1e6;
    st.crown.notice = null;
    const adults = () => st.characters.filter((c) => !c.isChild && !c.role);

    // --- İç vergi kademeleri ---
    check('dört vergi kademesi: Muaf %0, Düşük %10, Standart %20 (varsayılan), Ağır %45', CD.TAX_RATE_KEYS.join(',') === 'exempt,low,standard,heavy' && CD.TAX_RATES.exempt.percent === 0 && CD.TAX_RATES.low.percent === 10 && CD.TAX_RATES.standard.percent === 20 && CD.TAX_RATES.heavy.percent === 45 && CD.TAX.defaultRate === 'standard');
    game.events.emit('ui:setTaxRate', { rate: 'low' });
    check('vergi kademesi istenen an değişir ("ui:setTaxRate") ve günlüğe yazılır', st.tax.rate === 'low' && st.journal.at(-1).text.includes('Düşük'));
    // Tahsilat: keselerden hazineye birebir, öşür çantadan kilere
    game.events.emit('ui:setTaxRate', { rate: 'standard' });
    for (const c of adults()) {
      c.coins = 50;
      c.inventory = [];
    }
    const payer = adults()[0];
    CZ.addItem(payer, 'ration', 6);
    CZ.addItem(payer, 'firewood', 11);
    sim.give({ food: 50, wood: 50 }); // kilerde öşre yer olsun
    const gold0 = st.resources.gold;
    const food0 = st.resources.food;
    const wood0 = st.resources.wood;
    const trust0 = st.trust.value;
    const res = S.tax.collect();
    const expect = adults().length * 10;
    check('Standart Vergi: her yetişkinin kesesinden %20 kesilir, birebir Kasaba Hazinesi\'ne geçer', res.gold === expect && st.resources.gold === gold0 + expect && adults().every((c) => c.coins === 40), `${res.gold}/${expect}`);
    check('öşür: çantadaki fazla erzak ve odundan %20 kilere geçer (birer tanesi bırakılır)', st.resources.food === food0 + 1 && st.resources.wood === wood0 + 2 && CZ.countItem(payer, 'ration') === 5 && CZ.countItem(payer, 'firewood') === 9, `${st.resources.food - food0} ${st.resources.wood - wood0}`);
    check('Standart Vergi güveni değiştirmez; tahsilat günlüğe yazılır', st.trust.value === trust0 && st.journal.at(-1).text.startsWith('İç vergi tahsil edildi'));
    check('sıradaki tahsilat 3 gün sonra öğlen 12:00', st.tax.nextAt - now() <= 3 * 1440 && st.tax.nextAt > now() && st.tax.nextAt % 1440 === 720 && (Math.floor(st.tax.nextAt / 1440) + 1) % 3 === 0, CR.formatStamp(st.tax.nextAt));
    check('çocuklardan ve kesesi boş olandan vergi alınmaz', CR.coinTax({ isChild: true, coins: 99 }, 45) === 0 && CR.coinTax({ coins: 1 }, 45) === 0 && CR.coinTax({ coins: 10 }, 45) === 4);
    // Muafiyet ve düşük vergi
    game.events.emit('ui:setTaxRate', { rate: 'exempt' });
    const fan = adults()[1];
    fan.needs.fun = 50;
    st.trust.value = 60;
    const g1 = st.resources.gold;
    S.tax.collect();
    check('Vergi Muafiyeti: kesinti yok, güven +6, keyif +5', st.resources.gold === g1 && adults().every((c) => c.coins === 40) && st.trust.value === 66 && fan.needs.fun === 55);
    game.events.emit('ui:setTaxRate', { rate: 'low' });
    st.trust.value = 60;
    const g2 = st.resources.gold;
    S.tax.collect();
    check('Düşük / Adil Vergi: %10 kesinti, güven +2', st.resources.gold === g2 + adults().length * 4 && st.trust.value === 62);
    // Ağır Vergi
    const workStd = (game.events.emit('ui:setTaxRate', { rate: 'standard' }), TS.townWorkMultiplier(st));
    game.events.emit('ui:setTaxRate', { rate: 'heavy' });
    const workHeavy = TS.townWorkMultiplier(st);
    check('Ağır Vergi seçiliyken çalışma hızı -%15', Math.abs(workHeavy / workStd - 0.85) < 1e-9, `${workHeavy}/${workStd}`);
    st.trust.value = 40;
    fan.needs.fun = 50;
    const c0 = fan.coins;
    S.tax.collect();
    check('Ağır Vergi / Haraç: %45 kesinti, güven -8, keyif -10', fan.coins === c0 - Math.floor(c0 * 0.45) && st.trust.value === 32 && fan.needs.fun === 40);
    S.tax.collect();
    S.tax.collect();
    check('Ağır Vergi güveni hızla isyan sınırının altına iter', st.trust.value < 25, st.trust.value);
    game.events.emit('ui:setTaxRate', { rate: 'standard' });
    st.trust.value = 70;
    // Belediye panelinde vergi düğmeleri
    if (!W.getCompleted('townHall').length) {
      st.town.tier = Math.max(st.town.tier, 3);
      sim.place('townHall');
    }
    const hall = W.getCompleted('townHall')[0];
    game.events.emit('ui:selectBuilding', hall.id);
    renderNow();
    const taxButtons = [...document.querySelectorAll('.building-crown .tax-rate-button')];
    check('Belediye Konağı panelinde dört vergi düğmesi; seçili kademe vurgulu', taxButtons.length === 4 && taxButtons.find((b) => b.dataset.rate === 'standard').classList.contains('is-active'));
    taxButtons.find((b) => b.dataset.rate === 'low').click();
    check('panelden kademe seçilir', st.tax.rate === 'low');
    game.events.emit('ui:setTaxRate', { rate: 'standard' });

    // --- Krallık Vergisi ---
    const keepTier = st.town.tier;
    const keepSince = st.goldenAge.since;
    st.goldenAge.since = null;
    st.crown.reputation = 50;
    st.town.tier = 1;
    const a1 = CR.levyAmount(st);
    st.town.tier = 3;
    const a3 = CR.levyAmount(st);
    st.goldenAge.since = keepSince ?? { day: 1, hour: 0, minute: 0 };
    const a3g = CR.levyAmount(st);
    check('Krallık Vergisi seviye, nüfus ve Altın Çağ\'la ölçeklenir', a3 > a1 && a3g === Math.round(a3 * CD.LEVY.goldenAge) && a1 === CD.LEVY.base + CD.LEVY.perTier + CD.LEVY.perResident * st.characters.length, `${a1} ${a3} ${a3g}`);
    st.goldenAge.since = keepSince;
    st.town.tier = keepTier;
    // Tahsildar uyarısı: iki gün önce
    st.crown.nextLevyAt = now() + 2 * 1440;
    st.crown.notice = null;
    const notices = [];
    const offN = game.events.on('crown:levyNotice', (p) => notices.push(p));
    S.crown.hourly(st.time.hour);
    offN();
    const amount = st.crown.notice?.amount;
    renderNow();
    check('vergi gününden 2 gün önce "Kraliyet Tahsildarı Yolda" uyarısı ve tutarı (günlük, üst çubuk)', notices.length === 1 && amount === CR.levyAmount(st) && st.journal.at(-1).text.includes('Kraliyet Tahsildarı yolda') && [...document.querySelectorAll('.hud-buffs .buff-chip.is-crown')].some((b) => b.textContent.includes(`${amount} altın`)));
    // Ödeme
    st.resources.gold = amount + 100;
    st.crown.reputation = 50;
    st.trust.value = 60;
    st.crown.nextLevyAt = now();
    S.crown.hourly(st.time.hour);
    check('vakti gelince hazineden ödenir: güven +3, itibar +8', st.resources.gold === 100 && st.trust.value === 63 && st.crown.reputation === 58 && st.crown.lastLevy.ok && !st.crown.notice);
    check('sıradaki Krallık Vergisi tam 6 gün sonra', st.crown.nextLevyAt - now() === 6 * 1440);
    check('ilk Krallık Vergisi takvimde 6. günün öğlenidir', CR.nextOnSchedule(0, CD.LEVY.everyDays, CD.LEVY.hour) === 5 * 1440 + 720);
    // Altın yetmezse yarısına kadar malla
    sim.give({ food: 200, wood: 200, stone: 200 });
    const amt2 = CR.levyAmount(st);
    st.resources.gold = Math.ceil(amt2 * 0.6);
    st.crown.notice = { at: now(), amount: amt2 };
    st.crown.nextLevyAt = now();
    const stock0 = st.resources.food + st.resources.wood + st.resources.stone;
    S.crown.hourly(st.time.hour);
    check('altın yetmezse vergi tutarının yarısına kadarı malla ödenir (1 altın = 2 birim)', st.crown.lastLevy.ok && st.resources.gold === 0 && stock0 - (st.resources.food + st.resources.wood + st.resources.stone) === (amt2 - Math.ceil(amt2 * 0.6)) * 2, JSON.stringify(st.crown.lastLevy));
    // Ödenemezse ceza
    st.resources.gold = 7;
    sim.give({ food: 100, wood: 100, stone: 100 });
    const amt3 = CR.levyAmount(st);
    st.crown.notice = { at: now(), amount: amt3 };
    st.crown.nextLevyAt = now();
    st.trust.value = 60;
    st.crown.reputation = 50;
    delete st.buffs.royalPenalty;
    const bonus0 = TS.townHappinessBonus(st);
    S.crown.hourly(st.time.hour);
    const L3 = st.crown.lastLevy;
    check('ödenemeyen Krallık Vergisi: hazineye el konur, depodan zorla mal çekilir', !L3.ok && L3.gold === 7 && st.resources.gold === 0 && Object.values(L3.goods).reduce((a, b) => a + b, 0) > 0 && st.resources.food < 100, JSON.stringify(L3));
    check('ceza: güven -12, itibar -20, refah darbesi (Kraliyet Cezası -8)', st.trust.value === 48 && st.crown.reputation === 30 && TS.townHappinessBonus(st) === bonus0 - 8 && st.journal.at(-1).text.startsWith('ALARM · Krallık Vergisi'));
    check('düşük itibar vergiyi artırır', CR.reputationLevel(st.crown.reputation).levy > 1);
    delete st.buffs.royalPenalty;
    st.crown.reputation = 60;
    st.crown.nextLevyAt = now() + 1e6;
    sim.give({ wood: 400, stone: 400, food: 250, bread: 80, iron: 80, gold: 3000 });

    // --- Kraliyet Fermanları ---
    st.town.tier = 1;
    check('Mezra seviyesinde ferman gelmez', S.crown.availableDecrees().length === 0);
    st.town.tier = Math.max(keepTier, 3);
    check('Köy seviyesinden itibaren fermanlar gelir (tersane her zaman)', S.crown.availableDecrees().includes('shipyard'));
    st.crown.statueRight = false;
    const placeBefore = S.construction.checkPlacement('royalStatue', 1, 1);
    check('Aslanlı Heykel beratsız dikilemez', !placeBefore.ok && placeBefore.reason.includes('Kraliyet Beratı'));
    const d1 = S.crown.openDecree('shipyard');
    check('ferman açılır: seviyeye göre ihtiyaç, 3 günlük süre, ödül; günlük ve bildirim', d1.need.wood === 30 * Math.min(4, st.town.tier) && d1.deadline - d1.createdAt === CD.DECREE.deadlineMinutes && d1.reward.item === 'statueRight' && st.journal.at(-1).text.includes('Kraliyet Fermanı'));
    game.events.emit('ui:selectBuilding', hall.id);
    renderNow();
    const deliverBtn = [...document.querySelectorAll('.building-crown .royal-decree button')].find((b) => b.textContent === 'Teslim Et');
    check('Belediye panelinde ferman kartı: istek, ihtiyaç, ödül ve Teslim Et / Reddet', deliverBtn && !deliverBtn.disabled && document.querySelector('.building-crown .royal-decree').textContent.includes('Reddet'));
    const w1 = st.resources.wood;
    const gd1 = st.resources.gold;
    st.crown.reputation = 60;
    st.trust.value = 60;
    deliverBtn.click();
    check('ferman teslim edilir: kaynaklar harcanır, altın ödülü ve Kraliyet Beratı; itibar +10, güven +4', st.resources.wood === w1 - d1.need.wood && st.resources.gold === gd1 + d1.reward.gold && st.crown.statueRight && st.crown.reputation === 70 && st.trust.value === 64 && !st.crown.decree);
    renderNow();
    const placeAfter = S.construction.checkPlacement('royalStatue', 1, 1);
    check('berat alınınca Aslanlı Heykel İnşa menüsünde açılır', !placeAfter.reason?.includes('Kraliyet Beratı'), placeAfter.reason);
    const bonusBefore = TS.landmarkBonus(st);
    const statue = sim.place('royalStatue', { maxRadius: 30 });
    check('Kraliyet Aslanlı Heykeli dikilir: kalıcı refah +4 ve estetik', statue && TS.landmarkBonus(st) === bonusBefore + 4 && W.aesthetics.some((v) => v > 0));
    st.trust.value = 50;
    st.town.welfare = 50;
    S.crown.hourly(st.time.hour);
    check('heykel saat başı güven verir', Math.abs(st.trust.value - (50 + CD.ROYAL_STATUE.trustPerHour)) < 1e-9, st.trust.value);
    // Garnizon: Kadim Dişli ödülü
    const gears0 = st.resources.gears;
    S.crown.openDecree('garrison');
    game.events.emit('ui:deliverDecree');
    check('Garnizon fermanı: ekmek ve demir teslim edilir, Kadim Dişli ödülü', st.resources.gears === gears0 + 2 && st.crown.decreeLog.at(-1).outcome === 'delivered');
    // Saray kütüphanesi: araştırma
    const dL = S.crown.openDecree('library');
    check('kütüphane fermanı araştırma bitmeden teslim edilemez', !CR.decreeStatus(st, dL).ok);
    dL.baseline.done = Object.keys(st.research.done).length - 1;
    const books0 = st.goldenAge.books;
    game.events.emit('ui:deliverDecree');
    check('araştırma tamamlanınca teslim edilir: Antik Kitap (ya da kitaplık doluysa altın)', st.crown.decreeLog.at(-1).outcome === 'delivered' && (st.goldenAge.books === books0 + 1 || st.crown.decreeLog.at(-1).item === null));
    // Usta işi eser
    st.masterworks.items.push({ id: 9999, type: 'ironStatue', maker: 'Usta', makerId: -1, status: 'stored', day: 1, hour: 1 });
    const seeds0 = st.exploration.items.vineSeed;
    S.crown.openDecree('treasure');
    game.events.emit('ui:deliverDecree');
    check('saray hazinesi fermanı: depodaki usta işi eser Krallığa gider, Nadir Tohum ödülü', st.masterworks.items.find((i) => i.id === 9999).status === 'sold' && st.exploration.items.vineSeed === seeds0 + 1);
    st.masterworks.items = st.masterworks.items.filter((i) => i.id !== 9999);
    // Süresi dolan ve reddedilen ferman: ceza
    S.crown.openDecree('feast');
    st.crown.decree.deadline = now();
    st.crown.reputation = 60;
    st.trust.value = 60;
    const gf = st.resources.gold;
    S.crown.hourly(st.time.hour);
    const fine = st.crown.decreeLog.at(-1);
    check('süresi dolan ferman: Krallık altın cezası keser, itibar -12, güven -4', fine.outcome === 'expired' && st.resources.gold === gf - fine.fine.gold && fine.fine.gold > 0 && st.crown.reputation === 48 && Math.abs(st.trust.value - (56 + CD.ROYAL_STATUE.trustPerHour)) < 1e-9, st.trust.value); // heykelin saatlik güveni de işler
    S.crown.openDecree('shipyard');
    game.events.emit('ui:selectBuilding', hall.id);
    renderNow();
    [...document.querySelectorAll('.building-crown .royal-decree button')].find((b) => b.textContent === 'Reddet').click();
    check('"Reddet" düğmesi: ferman reddedilir ve ceza kesilir', st.crown.decreeLog.at(-1).outcome === 'rejected' && !st.crown.decree);
    check('berat zaten varsa tersane ödülü altına döner', S.crown.rewardFor('shipyard').item === 'statueRight' && st.crown.statueRight);

    // --- Kötü şöhret ve göç ---
    st.trust.value = 30;
    let im = TS.immigrationStatus(st);
    check('güven %35 altındayken kötü şöhret yüzünden göçmen gelmez', !im.ok && im.checks.find((c) => c.key === 'fame').ok === false);
    st.trust.value = 45;
    im = TS.immigrationStatus(st);
    check('güven %50 altındayken sabah en çok 1 göçmen', im.checks.find((c) => c.key === 'fame').ok && im.maxPerMorning === 1);
    st.trust.value = 80;
    check('güven toparlanınca göç normale döner', TS.immigrationStatus(st).checks.find((c) => c.key === 'fame').ok && TS.immigrationStatus(st).maxPerMorning >= 2);

    // --- Köyü terk etme ---
    const E = st.exodus;
    st.trust.value = 10;
    st.town.welfare = 10;
    E.lowSince = now() - 30 * 60;
    E.active = false;
    E.lastAt = null;
    if (st.trust.revolt) S.trust.endRevolt();
    S.desertion.hourly();
    check('isyan yağmaya varmadan terk ediş başlamaz', !E.active);
    for (const c of st.characters) c.needs.fun = 5;
    S.trust.startRevolt();
    check('terk ediş denemesi için isyan var', st.trust.revolt);
    st.trust.revolt.looted = { food: 12 };
    // En mutsuz bekâr sakin ayrılsın: herkes mutlu, o mutsuz
    for (const c of st.characters) c.needs = { hunger: 90, energy: 90, social: 90, fun: 90 };
    const single = st.characters.find((c) => !c.isChild && !c.married && !c.away && c.visible && !c.role && !st.characters.some((o) => o.parentIds.includes(c.id)));
    single.needs.fun = 0;
    single.coins = 77;
    single.inventory = [];
    CZ.addItem(single, 'bread', 3);
    const singleId = single.id;
    const pop0 = st.characters.length;
    const leftEv = [];
    const offL = game.events.on('population:left', (p) => leftEv.push(p));
    S.desertion.hourly();
    check('güven / refah %20 altında 24 saat kalınca ve isyan yağmaya varınca terk ediş başlar (göç durur)', E.active && TS.immigrationStatus(st).checks.find((c) => c.key === 'fame').ok === false && st.journal.some((j) => j.text.startsWith('ALARM · Umut tükendi')));
    check('en mutsuz sakin bohçasını toplar (emigrating), elindeki işi bırakır', single.emigrating && single.emigrating.exit && single.bubble?.icon === 'bundle' || (single.emigrating && !single.visible));
    const plan = S.behavior.brain.decide(single, 11);
    check('köyü terk eden harita kenarına yürür (emigrate)', plan.activity === 'emigrate' && plan.spot.x === single.emigrating.exit.x);
    game.events.emit('ui:selectCharacter', singleId);
    renderNow();
    check('karakter kartında "Köyü terk ediyor" etiketi', document.querySelector('.character-panel .purse-rioter.is-leaving')?.textContent === 'Köyü terk ediyor');
    for (let i = 0; i < 40 && st.characters.some((c) => c.id === singleId); i++) sim.step(225);
    offL();
    check('sakin kesesi ve çantasıyla kasabadan temelli ayrılır', !st.characters.some((c) => c.id === singleId) && st.characters.length === pop0 - 1 && leftEv[0]?.coins === 77 && leftEv[0]?.items === 3 && E.left >= 1 && E.coins >= 77 && st.stats.emigrants >= 1, JSON.stringify(leftEv[0] ? { coins: leftEv[0].coins, items: leftEv[0].items } : null));
    check('günlüğe acı bir not düşer', st.journal.some((j) => j.text.includes('köyden temelli ayrıldı') && j.icon === 'bundle'));
    const dangling = st.characters.filter((c) => c.partnerId === singleId || c.parentIds.includes(singleId)).length + Object.keys(st.relationships).filter((k) => k.split('-').map(Number).includes(singleId)).length + st.buildings.filter((b) => b.occupants.has(singleId) || b.workerIds.has(singleId)).length + (st.trust.revolt?.rioters.includes(singleId) ? 1 : 0);
    check('ayrılan sakine işaret eden referans kalmaz (eş, ebeveyn, ilişki, yapı, isyan)', dangling === 0, dangling);
    // Evli çift ailesiyle birlikte ayrılır
    const wife = st.characters.find((c) => c.married && !c.away && st.characters.find((p) => p.id === c.partnerId && !p.away));
    if (wife) {
      for (const c of st.characters) c.needs.fun = 90;
      wife.needs.fun = 0;
      E.lastAt = null;
      const group = S.desertion.leaveNext();
      check('evli sakin eşi (ve çocuklarıyla) birlikte ayrılır', group && group.includes(wife) && group.some((c) => c.id === wife.partnerId) && group.every((c) => c.emigrating), group?.map((c) => c.name).join(','));
      for (const c of group ?? []) S.desertion.depart(c);
      check('ayrılan çiftin bağı kimsede kalmaz', !st.characters.some((c) => group.some((g) => g.id === c.partnerId)));
    } else check('evli sakin eşi (ve çocuklarıyla) birlikte ayrılır', true, 'evli çift yok');
    // Çekirdek sakinler
    const keepCore = CD.EXODUS.core;
    const staying = st.characters.filter((c) => !c.role && !c.emigrating).length;
    CD.EXODUS.core = staying;
    E.lastAt = null;
    check(`en az ${keepCore} çekirdek sakin her koşulda kalır (çekirdek dolunca kimse ayrılmaz)`, S.desertion.leaveNext() === null);
    CD.EXODUS.core = staying - 1;
    const one = S.desertion.leaveNext();
    check('çekirdeğe bir kişilik yer kalınca aile değil yalnızca bir sakin ayrılır', one?.length === 1);
    for (const c of one ?? []) c.emigrating = null;
    CD.EXODUS.core = keepCore;
    check('çekirdek sakin sayısı 3', keepCore === 3);
    // Kriz çözülünce terk ediş biter, göç döner
    st.trust.value = 70;
    st.town.welfare = 70;
    S.desertion.hourly();
    check('güven ve refah toparlanınca terk ediş biter, göç yeniden açılır', !E.active && E.lowSince === null && TS.immigrationStatus(st).checks.find((c) => c.key === 'fame').ok && st.journal.some((j) => j.text.startsWith('Kasabaya umut döndü')));
    if (st.trust.revolt) S.trust.endRevolt();

    // --- Kayıt gidiş-dönüşü (sürüm 19) ---
    game.events.emit('ui:setTaxRate', { rate: 'low' });
    S.crown.openDecree('shipyard');
    const leaver = st.characters.find((c) => !c.isChild && !c.away && !c.role);
    leaver.emigrating = { since: now(), exit: { x: 1, y: 1 } };
    const T = { rate: st.tax.rate, collections: st.tax.collections, rep: st.crown.reputation, decree: st.crown.decree.id, kind: st.crown.decree.kind, deadline: st.crown.decree.deadline, right: st.crown.statueRight, left: E.left, emig: leaver.id, paid: st.crown.paid, levies: st.crown.levies, emigrants: st.stats.emigrants };
    game.events.emit('ui:save');
    const raw19 = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    game.events.emit('ui:load');
    const s4 = game.state;
    check('kayıt sürümü 22: vergi, Krallık ve terk ediş kayda yazılır', raw19.version === 22 && raw19.tax && raw19.crown && raw19.exodus);
    check('kayıttan vergi kademesi ve tahsilat sayacı döner', s4.tax.rate === T.rate && s4.tax.collections === T.collections);
    check('kayıttan Krallık İtibarı, vergi sayaçları, süren ferman ve Kraliyet Beratı döner', s4.crown.reputation === T.rep && s4.crown.decree?.id === T.decree && s4.crown.decree.kind === T.kind && s4.crown.decree.deadline === T.deadline && s4.crown.statueRight === T.right && s4.crown.paid === T.paid && s4.crown.levies === T.levies);
    check('kayıttan göç istatistikleri ve yola çıkmış sakin döner', s4.exodus.left === T.left && s4.stats.emigrants === T.emigrants && s4.characters.find((c) => c.id === T.emig)?.emigrating?.exit?.x === 1);
    check('kayıttan Kraliyet Aslanlı Heykeli döner', s4.buildings.some((b) => b.type === 'royalStatue'));
  }

  // ===== 23. aşama: yangın ve itfaiye, Su Kuyusu, Gözcü Kulesi ve bekçiler, haydut baskınları, hasar / tamir, yaralanma =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const CRI = await import('/src/systems/Crisis.js');
    const CD = await import('/src/data/crisis.js');
    const BD = await import('/src/data/buildings.js');
    const HS = await import('/src/systems/HealthSystem.js');
    const SP = await import('/src/systems/StructureSystem.js');
    const ART = await import('/src/art/sprites/index.js');
    const UI = await import('/src/art/ui/index.js');
    const now = () => st.totalMinutes;
    const crisis = () => game.scenes.current.crisis;
    const renderNow = () => {
      game.ui.components.find((x) => x.renderWelfare).welfareAt = -Infinity;
      game.render(0);
    };
    const adults = () => st.characters.filter((c) => !c.isChild && !c.role);
    // Doğal krizler testi bozmasın: Huzurlu; testler fonksiyonları doğrudan çağırır
    st.crisis.difficulty = 'huzurlu';
    st.crisis.raid = null;
    st.crisis.nextRaidWarnAt = null;
    for (const b of st.buildings) {
      b.isBurning = false;
      b.isDamaged = false;
    }
    st.town.tier = 4;
    st.trust.value = 70;
    if (st.trust.revolt) S.trust.endRevolt();
    st.petitions.list = [];
    st.petitions.nextAt = now() + 1e6;
    st.crown.decree = null;
    st.crown.nextDecreeAt = now() + 1e6;
    st.crown.nextLevyAt = now() + 1e6;
    st.crown.notice = null;
    sim.give({ wood: 600, stone: 600, food: 300, bread: 80, iron: 80, gold: 800 });
    const placeAt = (type, x, y) => {
      const res = S.construction.placeSite(type, x, y);
      if (!res.ok) return null;
      const job = S.jobs.jobs.find((j) => j.buildingId === res.building.id);
      if (job) S.jobs.cancel(job);
      S.construction.complete(res.building);
      return res.building;
    };
    const firstOf = (type) => st.buildings.find((b) => b.type === type && b.functional && !b.damaged);
    const popBefore = st.characters.length;
    const buildingsBefore = st.buildings.length;

    // --- Ayar: Tehlike Sıklığı ---
    check('üç tehlike sıklığı: Huzurlu (çarpan 0), Dengeli (1, varsayılan), Çetin (1,5)', CD.CRISIS_DIFFICULTY_KEYS.join(',') === 'huzurlu,dengeli,cetin' && CD.CRISIS_DIFFICULTY.huzurlu.rate === 0 && CD.CRISIS_DIFFICULTY.dengeli.rate === 1 && CD.CRISIS_DIFFICULTY.cetin.rate === 1.5 && CD.DEFAULT_DIFFICULTY === 'dengeli' && CRI.emptyCrisis().difficulty === 'dengeli');
    game.events.emit('ui:setCrisisDifficulty', { difficulty: 'cetin' });
    check('"ui:setCrisisDifficulty" tehlike sıklığını değiştirir ve çarpanı verir', st.crisis.difficulty === 'cetin' && CRI.crisisRate(st) === 1.5);
    game.events.emit('ui:setCrisisDifficulty', { difficulty: 'yok' });
    check('bilinmeyen tehlike sıklığı yok sayılır', st.crisis.difficulty === 'cetin');
    game.events.emit('ui:setCrisisDifficulty', { difficulty: 'huzurlu' });
    game.events.emit('ui:toggleSettings');
    renderNow();
    const crisisBtns = [...document.querySelectorAll('.settings-crisis')];
    check('Ayarlar penceresinde Tehlike Sıklığı: üç düğme, seçili olan vurgulu', crisisBtns.length === 3 && crisisBtns.map((b) => b.textContent).join(',') === 'Huzurlu,Dengeli,Çetin' && crisisBtns.find((b) => b.dataset.difficulty === 'huzurlu').classList.contains('is-active'));
    crisisBtns.find((b) => b.dataset.difficulty === 'dengeli').click();
    renderNow();
    check('Ayarlar düğmesi tehlike sıklığını seçer', st.crisis.difficulty === 'dengeli' && crisisBtns.find((b) => b.dataset.difficulty === 'dengeli').classList.contains('is-active'));
    game.events.emit('ui:toggleSettings');
    crisis().warnRaid();
    game.events.emit('ui:setCrisisDifficulty', { difficulty: 'huzurlu' });
    check('Huzurlu\'ya geçince bekleyen haydut tehlikesi geçer', !st.crisis.raid && st.crisis.nextRaidWarnAt === null && st.crisis.difficulty === 'huzurlu');

    // --- Doğal kriz kapıları: gün, tehlike sıklığı ---
    const realDay = st.time.day;
    st.time.day = 7;
    st.crisis.difficulty = 'dengeli';
    check('doğal yangın 8. günden önce çıkmaz, haydut 10. günden önce görülmez', !CRI.naturalCrisisAllowed(st, 'fire'));
    st.time.day = 8;
    check('8. günde doğal yangın açılır; haydut hâlâ kapalı', CRI.naturalCrisisAllowed(st, 'fire') && !CRI.naturalCrisisAllowed(st, 'bandit'));
    st.time.day = 10;
    check('10. günde haydut izleri açılır', CRI.naturalCrisisAllowed(st, 'bandit'));
    st.crisis.difficulty = 'huzurlu';
    check('Huzurlu: hiçbir doğal kriz çıkmaz', !CRI.naturalCrisisAllowed(st, 'fire') && !CRI.naturalCrisisAllowed(st, 'bandit'));
    st.time.day = realDay;

    // --- Su Kuyusu ---
    st.town.tier = 1;
    const lockWell = S.construction.checkPlacement('well', plaza.centerX + 3, plaza.centerY + 3);
    check('Su Kuyusu Köy seviyesinde açılır', !lockWell.ok && lockWell.reason.includes('Köy'), lockWell.reason);
    st.town.tier = 4;
    const wellDef = BD.BUILDINGS.well;
    check('Su Kuyusu tanımı: 1x1, odun + taş, Güvenlik, yangın emniyeti 8 karo / %80, sulama 4 karo / %10', wellDef.size.w === 1 && wellDef.cost.wood > 0 && wellDef.cost.stone > 0 && wellDef.category === 'Güvenlik' && wellDef.requiresTier === 2 && CD.FIRE.wellRadius === 8 && CD.FIRE.wellReduction === 0.8 && CD.WELL.gardenRadius === 4 && CD.WELL.gardenBonus === 0.1);
    check('Su Kuyusu İnşa menüsünde', BD.BUILD_MENU.includes('well') && BD.BUILD_MENU.includes('guardTower'));
    // Yangın olasılığı: kuyusuz / kuyulu
    const target = st.buildings.find((b) => b.type === 'workshop' && b.functional) ?? st.buildings.find((b) => b.type === 'lumberHut' && b.functional);
    for (const w of st.buildings.filter((b) => b.type === 'well')) w.damaged = true; // eski testlerden kalan olursa sayılmasın
    st.crisis.difficulty = 'dengeli';
    const chanceNoWell = CRI.fireChance(st, target);
    for (const w of st.buildings.filter((b) => b.type === 'well')) w.damaged = false;
    let wellSpot = null;
    for (let r = 1; r <= 6 && !wellSpot; r++) {
      for (let dy = -r; dy <= r && !wellSpot; dy++) {
        for (let dx = -r; dx <= r && !wellSpot; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = target.tileX + dx;
          const y = target.tileY + dy;
          if (S.construction.checkPlacement('well', x, y).ok) wellSpot = { x, y };
        }
      }
    }
    const wellB = wellSpot ? placeAt('well', wellSpot.x, wellSpot.y) : null;
    check('Su Kuyusu kurulur (anında tamam)', wellB && wellB.functional && wellB.type === 'well');
    const chanceWell = CRI.fireChance(st, target);
    check('yakında Su Kuyusu varken yangın ihtimali %80 azalır (×0,2)', chanceNoWell > 0 && Math.abs(chanceWell - chanceNoWell * 0.2) < 1e-12, `${chanceNoWell} -> ${chanceWell}`);
    st.crisis.difficulty = 'cetin';
    check('Çetin: yangın ihtimali %50 artar', Math.abs(CRI.fireChance(st, target) - chanceWell * 1.5) < 1e-12);
    st.crisis.difficulty = 'huzurlu';
    check('Huzurlu: yangın ihtimali sıfır', CRI.fireChance(st, target) === 0);
    check('kuyunun yangın etkisi 8 karoyla sınırlı', CRI.wellNear(st, target)?.id === wellB.id && !CRI.wellNear(st, { ...target, type: target.type, tileX: wellB.tileX + 30, tileY: wellB.tileY, definition: target.definition }, 8));
    // Bahçe sulaması
    let garden = st.buildings.find((b) => b.type === 'garden' && b.functional);
    for (let r = 2; r <= 24 && !garden; r++) {
      for (let dy = -r; dy <= r && !garden; dy++) {
        for (let dx = -r; dx <= r && !garden; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && S.construction.checkPlacement('garden', plaza.centerX + dx, plaza.centerY + dy).ok) garden = placeAt('garden', plaza.centerX + dx, plaza.centerY + dy);
        }
      }
    }
    const wellsNow = () => st.buildings.filter((b) => b.type === 'well');
    let wellNearGarden = CRI.wellNear(st, garden, 4);
    for (let r = 1; r <= 3 && !wellNearGarden; r++) {
      for (let dy = -r - 1; dy <= r + 2 && !wellNearGarden; dy++) {
        for (let dx = -r - 1; dx <= r + 2 && !wellNearGarden; dx++) {
          if (S.construction.checkPlacement('well', garden.tileX + dx, garden.tileY + dy).ok) wellNearGarden = placeAt('well', garden.tileX + dx, garden.tileY + dy);
        }
      }
    }
    const live = SP.productionFactors(garden, W, false, { farm: 1 });
    wellsNow().forEach((w) => (w.damaged = true));
    const dry = SP.productionFactors(garden, W, false, { farm: 1 });
    wellsNow().forEach((w) => (w.damaged = false));
    check('kuyusuz bahçede sulama çarpanı 1', dry.well === 1);
    check('4 karo yakınındaki bahçeye kuyu +%10 sulama verimi verir', Boolean(wellNearGarden) && Math.abs(live.well - 1.1) < 1e-9 && Math.abs(live.total / dry.total - 1.1) < 1e-9, JSON.stringify([dry.well, live.well, live.total / dry.total]));

    // --- Gözcü Kulesi ---
    st.town.tier = 2;
    const lockTower = S.construction.checkPlacement('guardTower', plaza.centerX + 3, plaza.centerY + 3);
    check('Gözcü Kulesi Kasaba seviyesinde açılır', !lockTower.ok && lockTower.reason.includes('Kasaba'), lockTower.reason);
    st.town.tier = 4;
    const towerDef = BD.BUILDINGS.guardTower;
    check('Gözcü Kulesi tanımı: 2x2, odun + taş + demir, nöbet işi (patrol), Güvenlik', towerDef.size.w === 2 && towerDef.cost.wood > 0 && towerDef.cost.stone > 0 && towerDef.cost.iron > 0 && towerDef.workActivity === 'patrol' && towerDef.guard === true && towerDef.category === 'Güvenlik' && towerDef.requiresTier === 3);
    // Baskın uyarısı: kulesiz 1 gün
    st.crisis.raid = null;
    const raidNoTower = crisis().warnRaid();
    check('kulesiz haydut baskını 1 gün önceden haber verilir', raidNoTower && !raidNoTower.early && raidNoTower.arriveAt - raidNoTower.warnedAt === 1440 && raidNoTower.tribute >= 25 && raidNoTower.tribute <= 40, JSON.stringify(raidNoTower));
    check('haydut izi günlüğe ve bildirime düşer', st.journal.at(-1).text.includes('haydut izleri'));
    renderNow();
    const raidChip = [...document.querySelectorAll('.hud-buffs .buff-chip')].find((c) => c.textContent.includes('Haydut izleri'));
    check('üst çubuğun altında haydut izi çipi (geri sayım) görünür', Boolean(raidChip) && raidChip.textContent.includes('sa'), raidChip?.textContent);
    // Savunma: kulesiz yetişkin + alet
    st.equipment.sturdyTool = 0;
    check('kulesiz savunma için depoda sağlam alet gerekir', !CRI.defenseStatus(st).ok && CRI.defenseStatus(st).reason.includes('alet'));
    st.equipment.sturdyTool = 2;
    check('kulesiz savunma: yeterli yetişkin ve alet varsa yapılabilir', CRI.defenseStatus(st).ok && CRI.defenseStatus(st).tower === null);
    // B: haraç (altın)
    sim.give({ gold: 500 });
    st.crisis.difficulty = 'dengeli';
    const tribute = st.crisis.raid.tribute;
    const g0 = st.resources.gold;
    const food0 = st.resources.food;
    const trustB0 = st.trust.value;
    const injuredBefore = st.characters.filter((c) => c.isInjured).length;
    const damagedBefore = st.buildings.filter((b) => b.damaged).length;
    const resB = crisis().resolveRaid('tribute');
    check('B) Haraç: hazineden tam haraç gider; hasar ve yaralı yok; Güven -2', resB.ok && g0 - st.resources.gold === tribute && st.resources.food === food0 && st.characters.filter((c) => c.isInjured).length === injuredBefore && st.buildings.filter((b) => b.damaged).length === damagedBefore && Math.abs(st.trust.value - (trustB0 - 2)) < 1e-9 && !st.crisis.raid && st.crisis.tributes >= 1);
    check('baskın çözülünce sıradaki haydut izi 8-10 gün sonraya kurulur', Number.isFinite(st.crisis.nextRaidWarnAt) && st.crisis.nextRaidWarnAt - now() >= 8 * 1440 && st.crisis.nextRaidWarnAt - now() <= 10 * 1440);
    st.crisis.difficulty = 'huzurlu';
    // B: altın yoksa erzak
    crisis().warnRaid();
    sim.give({ gold: 3, food: 200, bread: 0 });
    const payFood = CRI.tributeStatus(st, st.crisis.raid.tribute);
    const foodB0 = st.resources.food;
    crisis().resolveRaid('tribute');
    check('altın yetmezse haraç kilerden erzakla ödenir', payFood.ok && payFood.gold === 0 && payFood.food > 0 && foodB0 - st.resources.food >= payFood.food - 2 && st.resources.gold === 3, JSON.stringify(payFood));
    // Haraç ödenemez
    crisis().warnRaid();
    sim.give({ gold: 0, food: 0, bread: 0 });
    const badPay = crisis().resolveRaid('tribute');
    check('haraç ödenemezse seçim reddedilir, baskın sürer', !badPay.ok && Boolean(st.crisis.raid));
    // C: hazırlıksız yakalanma
    sim.give({ wood: 500, stone: 500, food: 400, bread: 0, gold: 1000 });
    for (const b of st.buildings) b.isDamaged = false;
    const foodC0 = st.resources.food;
    const goldC0 = st.resources.gold;
    const woodC0 = st.resources.wood;
    const stoneC0 = st.resources.stone;
    const trustC0 = st.trust.value;
    const dmgC0 = st.buildings.filter((b) => b.damaged).length;
    const resC = crisis().resolveRaid('caught');
    const stolenFood = foodC0 - st.resources.food;
    const stolenGold = goldC0 - st.resources.gold;
    const damagedC = st.buildings.filter((b) => b.damaged);
    check('C) Hazırlıksız: en çok stoğun %15\'i gider (asla tamamı değil), odun ve taş dokunulmaz', resC.ok && stolenFood > 0 && stolenFood <= Math.floor(foodC0 * 0.15) && stolenGold > 0 && stolenGold <= Math.floor(goldC0 * 0.15) && st.resources.food > 0 && st.resources.gold > 0 && st.resources.wood === woodC0 && st.resources.stone === stoneC0, `${stolenFood}/${foodC0} ${stolenGold}/${goldC0}`);
    check('C) tam olarak 1 yapı HASARLI olur (haritadan silinmez); Güven -8', damagedC.length === dmgC0 + 1 && damagedC[0].damageKind === 'raid' && st.buildings.includes(damagedC[0]) && Math.abs(st.trust.value - (trustC0 - 8)) < 1e-9, damagedC.map((b) => b.name).join(','));
    check('hasarlı yapı sınırdakilerden seçilir (kasaba merkezine en uzak)', damagedC[0] && st.buildings.filter((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type)).every((b) => Math.hypot(b.tileX - plaza.centerX, b.tileY - plaza.centerY) <= Math.hypot(damagedC[0].tileX - plaza.centerX, damagedC[0].tileY - plaza.centerY) + 1e-9 || b.damaged));
    check('stok 1 iken hiçbir şey çalınmaz (asla tamamı değil)', CRI.stolenAmount(1) === 0 && CRI.stolenAmount(0) === 0 && CRI.stolenAmount(100) === 15 && CRI.stolenAmount(7) === 1);
    // Kuleyi kur
    const tower = sim.place('guardTower', { maxRadius: 40 });
    check('Gözcü Kulesi kurulur', tower && tower.functional && CRI.towerOf(st)?.id === tower.id);
    check('kule varken yetişkinler yeterliyse 1-2 bekçi yuvası; sayı yetişkin sayısına göre', (() => { crisis().guardHour(); return tower.guardSlots === (CRI.ablePeople(st).length >= CD.GUARD.twoGuardsAdults ? 2 : 1) && tower.workerSlots === tower.guardSlots; })());
    check('kuleli savunma: en az 2 sağlam yetişkin yeter (alet gerekmez)', (() => { st.equipment.sturdyTool = 0; return CRI.defenseStatus(st).ok && CRI.defenseStatus(st).tower?.id === tower.id; })());
    // Kule güven katkısı
    st.trust.value = 50;
    crisis().guardHour();
    check('Gözcü Kulesi saat başı Yönetim Güveni\'ne katkı verir (+0,2 ve nöbetçi başına +0,1)', Math.abs(st.trust.value - (50 + CD.GUARD.trustPerHour + tower.workerIds.size * CD.GUARD.trustPerGuard)) < 1e-9, String(st.trust.value));
    const lightRadius = (await import('/src/data/landscape.js')).DARKNESS.lights.guardTower;
    {
      const LS = await import('/src/systems/Landscape.js');
      const wasLit = tower.lit;
      tower.lit = true;
      const sources = LS.litSources([tower]);
      const nearby = { x: tower.center.x + 40, y: tower.center.y + 40 };
      const lit = sources.length === 1 && LS.isLitPoint(sources, nearby.x, nearby.y) && !LS.isLitPoint(sources, tower.center.x + 400, tower.center.y);
      tower.lit = wasLit;
      check('kule geceleri çevresini aydınlatır: yakınındaki yürüyen sakin karanlıkta ürkmez (ışık yarıçapı ~90 piksel)', lightRadius >= 80 && Boolean(towerDef.litHours) && lit);
    }
    // Bekçi nöbeti
    let patrolling = null;
    // Nöbet üretimden sonra gelir (boştaki yetişkinlerin işi); testte bir sakini kuleye sabitleyip nöbeti doğrularız
    const guardCandidate = adults().find((c) => !c.away && !c.illness && c.workplaceId === null);
    game.events.emit('ui:pinWorker', { buildingId: tower.id, characterId: guardCandidate.id });
    for (let i = 0; i < 30 && !patrolling; i++) {
      hours(1);
      patrolling = st.characters.find((c) => c.task?.activity === 'patrol');
    }
    check('Kasaba Bekçisi: 1-2 yetişkin kuleye nöbete gider (devriye)', patrolling && !patrolling.isChild && tower.workerIds.has(patrolling.id) && patrolling.activityLabel.includes('bekçi'), patrolling?.activityLabel);
    check('nöbetçi sayısı kule yuvalarını aşmaz', tower.workerIds.size <= tower.guardSlots);
    // Kuleyle baskın 2 gün önceden
    st.crisis.raid = null;
    const raidTower = crisis().warnRaid();
    check('Gözcü Kulesi varken haydut baskını 2 gün önceden haber verilir', raidTower.early && raidTower.arriveAt - raidTower.warnedAt === 2 * 1440);
    // A: bekçilerle püskürt
    sim.give({ wood: 500, stone: 500, food: 400, gold: 500 });
    for (const c of st.characters) c.isInjured = false;
    const goldA0 = st.resources.gold;
    const stockA = { wood: st.resources.wood, stone: st.resources.stone, food: st.resources.food };
    const trustA0 = st.trust.value;
    const dmgA0 = st.buildings.filter((b) => b.damaged).length;
    const resA = crisis().resolveRaid('defend');
    const gainA = st.resources.gold - goldA0;
    const hurt = st.characters.filter((c) => c.isInjured);
    check('A) Bekçilerle Püskürt: kaynak kaybı yok, +15-25 altın ganimet, Güven +6, "Haydutlar Kovuldu" bonusu', resA.ok && gainA >= 15 && gainA <= 25 && st.resources.wood === stockA.wood && st.resources.stone === stockA.stone && st.resources.food === stockA.food && Math.abs(st.trust.value - (trustA0 + 6)) < 1e-9 && st.buffs.banditsRepelled > now(), `${gainA}`);
    check('A) hiçbir yapı hasar görmez; en çok 1 savunmacı hafif yaralanır', st.buildings.filter((b) => b.damaged).length === dmgA0 && hurt.length <= 1);
    check('A) savunmacılar "Haydutları kasabadan kovduk" anısı kazanır; dedikodu dolaşır', resA.defenders.length > 0 && st.characters.find((c) => c.id === resA.defenders[0]).memories.some((m) => m.text === 'Haydutları kasabadan kovduk') && st.social.gossip.some((n) => n.kind === 'raid'));
    check('günlüğe baskın sonucu yazılır', st.journal.some((j) => j.text.startsWith('Haydutlar püskürtüldü')));
    check('bonus "Haydutlar Kovuldu" refaha eklenir', (await import('/src/systems/TownStatus.js')).townHappinessBonus(st) >= 4);
    // Savunma yoksa A reddedilir
    crisis().warnRaid();
    const savedTower = tower.damaged;
    tower.damaged = true;
    st.equipment.sturdyTool = 0;
    const adultsAble = CRI.ablePeople(st);
    const savedAway = adultsAble.map((c) => c.away);
    adultsAble.forEach((c, i) => { if (i >= 2) c.away = { stage: 'away', until: now() + 1e6 }; });
    const denyA = crisis().resolveRaid('defend');
    check('savunma yetmiyorsa "Bekçilerle Püskürt" reddedilir (nedeniyle), baskın sürer', !denyA.ok && Boolean(st.crisis.raid) && denyA.reason.length > 0, denyA.reason);
    // Otomatik çözüm: süre dolunca savunma yoksa hazırlıksız yakalanır
    st.crisis.raid.arriveAt = now();
    const cb = st.crisis.caught;
    crisis().hourly();
    check('karar verilmezse varışta savunma yetmiyorsa C uygulanır (kendiliğinden)', !st.crisis.raid && st.crisis.caught === cb + 1);
    adultsAble.forEach((c, i) => (c.away = savedAway[i]));
    tower.damaged = savedTower;
    st.equipment.sturdyTool = 1;
    crisis().warnRaid();
    st.crisis.raid.arriveAt = now();
    const rb = st.crisis.repelled;
    crisis().hourly();
    check('karar verilmezse varışta savunma yetiyorsa A uygulanır (kendiliğinden)', !st.crisis.raid && st.crisis.repelled === rb + 1);
    // Baskın penceresi
    crisis().warnRaid();
    game.events.emit('ui:openRaid');
    renderNow();
    const modal = document.querySelector('.crisis-panel');
    const optionBtns = modal ? [...modal.querySelectorAll('.crisis-option .upgrade-button')] : [];
    check('haydut izi çipi/Kule paneli: üç net seçenekli pencere (A püskürt, B haraç, C hazırlıksız)', modal && !modal.hidden && optionBtns.length === 3 && optionBtns[0].textContent.startsWith('A') && optionBtns[1].textContent.startsWith('B') && optionBtns[2].textContent.startsWith('C'), optionBtns.map((b) => b.textContent).join(' | '));
    sim.give({ gold: 800 });
    renderNow();
    const tribBefore = st.crisis.tributes;
    [...document.querySelectorAll('.crisis-panel .crisis-option .upgrade-button')][1].click();
    renderNow();
    check('pencerede "Haraç Öde" düğmesi baskını çözer ve pencere kapanır', st.crisis.tributes === tribBefore + 1 && !st.crisis.raid && document.querySelector('.crisis-panel').hidden);
    game.events.emit('ui:selectBuilding', null);
    crisis().warnRaid();
    game.events.emit('ui:selectBuilding', tower.id);
    renderNow();
    check('Gözcü Kulesi panelinde haydut baskını kartı (üç seçenek) ve bekçiler', document.querySelectorAll('.building-crisis .crisis-option').length === 3 && document.querySelector('.building-crisis').textContent.includes('Asayiş'));
    crisis().resolveRaid('tribute');
    game.events.emit('ui:selectBuilding', null);

    // --- Yangın ---
    // Gündüz olsun (sakinler uyanık): koşacak itfaiyeciler gerekir
    for (let i = 0; i < 24 && st.time.hour !== 9; i++) hours(1);
    for (const b of st.buildings) b.isDamaged = false;
    st.trust.value = 60;
    const burner = st.buildings.find((b) => b.type === 'lumberHut' && b.functional) ?? st.buildings.find((b) => BD.DAMAGEABLE_TYPES.includes(b.type) && b.functional);
    const trustF0 = st.trust.value;
    let fireEvent = null;
    const offFire = game.events.on('crisis:fireStarted', (p) => (fireEvent = p));
    crisis().startFire(burner);
    offFire();
    check('yangın başlar: isBurning, fireProgress 0, hasar nedeni "yangın"', burner.isBurning && burner.fireProgress === 0 && burner.damageKind === 'fire' && !burner.damaged);
    check('yangın günlüğe yazılır ve "yangın çıktı" olayı yayılır', st.journal.some((j) => j.text.includes(`${burner.name} yangın çıktı`)) && fireEvent?.building === burner && fireEvent.responders.length > 0 && fireEvent.responders.length <= CD.FIRE.maxFighters);
    renderNow();
    const fireChip = [...document.querySelectorAll('.hud-buffs .buff-chip')].find((c) => c.textContent.includes('yanıyor'));
    check('üst çubuk altında yangın uyarı çipi ("yanıyor · %…")', Boolean(fireChip) && fireChip.textContent.includes(burner.name), fireChip?.textContent);
    check('yanan yapı çalışmaz (iş yeri boşta)', (() => { sim.step(2); return burner.idle === true; })());
    const p0 = burner.fireProgress;
    crisis().update({ gameMinutes: 60 });
    check('yangın zamanla yayılır (6 saatte %100)', Math.abs(burner.fireProgress - p0 - 100 / 6) < 1e-6, String(burner.fireProgress));
    // Panel: Acil Söndür
    game.events.emit('ui:selectBuilding', burner.id);
    renderNow();
    st.trust.value = 60;
    const extBtn = [...document.querySelectorAll('.building-crisis button')].find((b) => b.textContent.startsWith('Acil Söndür'));
    check('yanan yapının panelinde "Acil Söndür (Kova Zinciri)" düğmesi', Boolean(extBtn) && extBtn.textContent.includes('Kova Zinciri'));
    const trustE0 = st.trust.value;
    const extinguishedBefore = st.crisis.extinguished;
    extBtn.click();
    check('Acil Söndür: yangın anında söner, yapı hasar almaz, Güven +2', !burner.isBurning && !burner.damaged && burner.fireProgress === 0 && Math.abs(st.trust.value - (trustE0 + 2)) < 1e-9 && st.crisis.extinguished === extinguishedBefore + 1 && st.journal.some((j) => j.text.includes('acil kova zinciriyle')));
    game.events.emit('ui:selectBuilding', null);
    // Kova ile söndürme (kuyu uzakta: 4 kova)
    wellsNow().forEach((w) => (w.damaged = true)); // kuyular devre dışı: kuyusuz kasaba
    const farTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.isBurning);
    st.trust.value = 60;
    if (farTarget) {
      crisis().startFire(farTarget);
      const helperA = adults()[0];
      const helperB = adults()[1];
      const trustK0 = st.trust.value;
      const fireOutEvents = [];
      const offOut = game.events.on('crisis:fireOut', (p) => fireOutEvents.push(p));
      for (let i = 0; i < 3; i++) crisis().onBucket(i % 2 ? helperA : helperB, farTarget);
      check('kuyu yokken yangın için 4 kova gerekir', farTarget.isBurning && farTarget.fireWater === 3 && CRI.bucketsNeeded(st, farTarget) === 4);
      crisis().onBucket(helperA, farTarget);
      offOut();
      check('4. kovada yangın söner: hasarsız, "yangını el birliğiyle söndürdük" anısı ve Güven +2', !farTarget.isBurning && !farTarget.damaged && fireOutEvents.length === 1 && fireOutEvents[0].helpers.length === 2 && helperA.memories.some((m) => m.text === 'Yangını el birliğiyle söndürdük') && Math.abs(st.trust.value - (trustK0 + 2)) < 1e-9 && st.journal.some((j) => j.text.includes('el birliğiyle')));
    } else check('kuyu yokken kova ile söndürme (uygun yapı bulunamadı)', false);
    wellsNow().forEach((w) => (w.damaged = false));
    const nearTarget = target;
    nearTarget.isBurning = false;
    nearTarget.isDamaged = false;
    crisis().startFire(nearTarget);
    check('yakında Su Kuyusu varken (kova zinciri) 3 kova yeter', CRI.bucketsNeeded(st, nearTarget) === 3);
    for (let i = 0; i < 3; i++) crisis().onBucket(adults()[i % 2], nearTarget);
    check('3 kovada yangın söner (kuyu yakın)', !nearTarget.isBurning && !nearTarget.damaged);
    // Sakinler gerçekten koşar: kovalar atılır ve yangın söner (sim ile)
    {
      const fightTarget = nearTarget;
      let seen = new Set();
      let buckets = 0;
      const offB = game.events.on('crisis:bucket', () => buckets++);
      crisis().startFire(fightTarget);
      for (let i = 0; i < 72 && fightTarget.isBurning; i++) {
        sim.step(19);
        for (const c of st.characters) if (c.task && ['fetchWater', 'fightFire'].includes(c.task.activity)) seen.add(c.task.activity);
      }
      offB();
      check('sakinler işi bırakıp kova taşır: su alır (fetchWater), yangına boşaltır (fightFire) ve yangını söndürür', !fightTarget.isBurning && seen.has('fetchWater') && seen.has('fightFire') && buckets >= 3 && !fightTarget.damaged, `${[...seen]} ${buckets} kova`);
      check('yangını söndüren kova taşıyıcıların başında su kovası balonu çıkar', (() => { try { return UI.getBubbleSprite('bucket') && UI.getBubbleSprite('shield') && UI.getBubbleSprite('bandit') && UI.getBubbleSprite('bandage'); } catch (e) { return false; } })());
    }
    // Kuyu yokken nehirden su taşıma: kovayı dolduranlar yangına koşar (sorumlu sakinler kova doluyken sıralamadan düşmez)
    {
      wellsNow().forEach((w) => (w.damaged = true));
      const riverTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.isBurning && b.id !== nearTarget.id) ?? nearTarget;
      riverTarget.isBurning = false;
      let thrownRiver = 0;
      let filledRiver = 0;
      const offT = game.events.on('crisis:bucketThrown', () => thrownRiver++);
      const offF = game.events.on('crisis:bucketFilled', () => filledRiver++);
      const sourceKind = crisis().waterSource(riverTarget, adults()[0])?.kind ?? null;
      crisis().startFire(riverTarget);
      for (let i = 0; i < 72 && riverTarget.isBurning; i++) {
        sim.step(19);
        if (st.dilemma.active) sim.step(1900);
      }
      offT();
      offF();
      wellsNow().forEach((w) => (w.damaged = false));
      check('kuyu yokken sakinler nehirden su taşır: kovayı dolduranlar yangına koşar, kovalar atılır ve yangın hasarsız söner', sourceKind === 'river' && !riverTarget.isBurning && !riverTarget.damaged && thrownRiver >= 4 && filledRiver >= thrownRiver, `${sourceKind} dolan ${filledRiver} atılan ${thrownRiver} hasar ${riverTarget.damaged}`);
    }
    // Yanıp biten yangın: hasarlı ama silinmez
    const burnTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && b.id !== nearTarget.id) ?? nearTarget;
    const burnCount = st.buildings.length;
    st.trust.value = 60;
    const burnTrust0 = st.trust.value;
    crisis().startFire(burnTarget);
    burnTarget.fireProgress = 99;
    crisis().update({ gameMinutes: 30 });
    check('söndürülemeyen yangın: yapı HASARLI olur (isDamaged), haritadan SİLİNMEZ', !burnTarget.isBurning && burnTarget.damaged && burnTarget.isDamaged === true && burnTarget.damageKind === 'fire' && st.buildings.length === burnCount && st.buildings.includes(burnTarget));
    check('yanıp biten yapıda Güven -2; günlük ve sayaç', Math.abs(st.trust.value - (burnTrust0 - 2)) < 1e-9 && st.crisis.burned >= 1 && st.journal.some((j) => j.text.includes('yanıp hasar gördü')));
    sim.step(6);
    check('hasarlı yapı üretim yapamaz (boşta, çalışan yok)', burnTarget.idle === true && burnTarget.workerSlots >= 0 && [...burnTarget.workerIds].length === 0);
    renderNow();
    check('hasarlı yapı için "N hasarlı yapı" çipi', [...document.querySelectorAll('.hud-buffs .buff-chip')].some((c) => c.textContent.includes('hasarlı yapı')));

    // --- Tamir ---
    game.events.emit('ui:selectBuilding', burnTarget.id);
    renderNow();
    const repairBtn = [...document.querySelectorAll('.building-crisis button')].find((b) => b.textContent === 'Tamir Et');
    const cost = CRI.repairCost(burnTarget.type);
    const expectCost = Object.fromEntries(Object.entries(burnTarget.definition.cost).filter(([r]) => r === 'wood' || r === 'stone').map(([r, v]) => [r, Math.max(1, Math.ceil(v * 0.25))]));
    check('tamir bedeli inşa maliyetinin %25\'i (yalnızca odun ve taş)', JSON.stringify(cost) === JSON.stringify(expectCost) && Object.keys(cost).every((r) => r === 'wood' || r === 'stone'), JSON.stringify(cost));
    check('hasarlı yapının panelinde "Tamir Et" düğmesi ve hasar kartı', Boolean(repairBtn) && document.querySelector('.building-crisis').textContent.includes('Hasar'));
    sim.give({ wood: 0, stone: 0 });
    renderNow();
    const poor = crisis().repairNow(burnTarget);
    check('kaynak yetmezse Tamir Et reddedilir, yapı hasarlı kalır', !poor.ok && burnTarget.damaged);
    sim.give({ wood: 400, stone: 400 });
    const wr0 = st.resources.wood;
    const sr0 = st.resources.stone;
    const repairs0 = st.crisis.repairs;
    game.events.emit('ui:repairBuilding', { buildingId: burnTarget.id });
    check('Tamir Et: bedel düşülür, yapı ANINDA onarılır (isDamaged = false)', !burnTarget.damaged && wr0 - st.resources.wood === (cost.wood ?? 0) && sr0 - st.resources.stone === (cost.stone ?? 0) && burnTarget.damageKind === null && st.crisis.repairs === repairs0 + 1);
    check('onarım günlüğe yazılır (yangın hasarından)', st.journal.some((j) => j.text.includes(`${burnTarget.name} yangın hasarından onarıldı`)));
    game.events.emit('ui:selectBuilding', null);
    sim.step(2);
    check('onarılan yapı yeniden çalışabilir', burnTarget.idle === false || burnTarget.definition.crafting || burnTarget.definition.processing || burnTarget.definition.apothecary);
    // Ustalar otomatik onarır
    const autoTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.project);
    sim.give({ wood: 400, stone: 400 });
    crisis().damage(autoTarget, 'fire');
    autoTarget.damagedAt = now() - 30; // henüz 2 saat dolmadı
    crisis().autoRepair();
    check('hasardan 2 saat geçmeden usta onarımı başlamaz (oyuncuya fırsat)', !autoTarget.project);
    autoTarget.damagedAt = now() - 150;
    const wA = st.resources.wood;
    crisis().autoRepair();
    check('boştaki ustalar 2 saat sonra kaynak varsa onarım projesini kendiliğinden başlatır (maliyet %25)', autoTarget.project?.kind === 'mend' && autoTarget.project.work === CD.REPAIR.buildWork && wA - st.resources.wood === (CRI.repairCost(autoTarget.type).wood ?? 0));
    let mended = false;
    for (let i = 0; i < 40 && !mended; i++) {
      hours(1);
      mended = !autoTarget.damaged;
    }
    check('inşaatçılar kısa sürede binayı onarır (isDamaged = false)', mended && !autoTarget.project, `${autoTarget.damaged}`);
    // Fırtına hasarı eski kuralı korur (otomatik başlamaz, %30)
    const stormTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.project);
    stormTarget.damaged = true;
    crisis().autoRepair();
    const stormSpec = CRI.mendSpecFor(stormTarget);
    const stormWood = stormTarget.definition.cost.wood ? Math.max(1, Math.ceil(stormTarget.definition.cost.wood * 0.3)) : undefined;
    check('fırtına hasarı eski kurala bağlı kalır: oyuncu başlatır (maliyet %30), usta kendiliğinden başlamaz', !stormTarget.project && stormSpec.buildWork === 90 && stormSpec.cost.wood === stormWood, JSON.stringify(stormSpec.cost));
    crisis().repairNow(stormTarget);
    check('"Tamir Et" fırtına hasarını da anında onarır', !stormTarget.damaged);

    // --- Hafif yaralanma ve Şifacı ---
    const victim = adults()[2];
    victim.isInjured = false;
    const popD = st.characters.length;
    crisis().injure(victim, 'fire');
    check('yaralanma: isInjured ve 1,5 günlük (2160 dk) injuryTimer; sakin ölmez', victim.isInjured && victim.injuryTimer === 36 * 60 && st.characters.includes(victim));
    check('yaralı sakin %20 yavaş yürür ve çalışır', Math.abs(HS.healthWalkMultiplier(victim, now()) - 0.8) < 1e-9 && Math.abs(HS.healthWorkMultiplier(victim, now()) - 0.8) < 1e-9 && HS.healthWalkMultiplier(adults().find((c) => !c.isInjured && !c.illness && !HS.hasVigor(c, now())), now()) === 1);
    game.events.emit('ui:selectCharacter', victim.id);
    renderNow();
    check('Karakter Kartı "🩹 Hafif Yaralı" etiketini gösterir', [...document.querySelectorAll('.condition-chip')].some((c) => c.textContent.includes('Hafif Yaralı')), [...document.querySelectorAll('.condition-chip')].map((c) => c.textContent).join('|'));
    renderNow();
    check('yaralılar üst çubukta "hafif yaralı" çipinde sayılır', [...document.querySelectorAll('.hud-buffs .buff-chip')].some((c) => c.textContent.includes('hafif yaralı')));
    game.events.emit('ui:selectCharacter', null);
    // Çocuklar yaralanmaz
    const kid = st.characters.find((c) => c.isChild);
    if (kid) check('çocuklar yaralanmaz', !crisis().injure(kid, 'raid') && !kid.isInjured);
    // Şifacı yokken kendiliğinden iyileşme
    const healers = st.buildings.filter((b) => b.type === 'healerHut');
    const healerStates = healers.map((b) => b.damaged);
    healers.forEach((b) => (b.damaged = true));
    victim.task = null;
    crisis().update({ gameMinutes: 36 * 60 + 1 });
    check('Şifacı Kulübesi yoksa bile yara 1,5 günde kendiliğinden iyileşir', !victim.isInjured && st.journal.some((j) => j.text.includes('yarası kendiliğinden iyileşti')));
    // Şifacıda iyileşme
    healers.forEach((b, i) => (b.damaged = healerStates[i]));
    const healer = firstOf('healerHut') ?? sim.place('healerHut', { maxRadius: 40 });
    const patient = adults().find((c) => c !== victim && !c.illness && !c.away);
    patient.isInjured = false;
    crisis().injure(patient, 'raid');
    patient.needs.fun = 40;
    const treated0 = st.crisis.treated;
    let healedAt = null;
    for (let i = 0; i < 48 && !healedAt; i++) {
      hours(1);
      if (!patient.isInjured) healedAt = i;
    }
    check('yaralı sakin Şifacı Kulübesi\'ne gider, orada iyileşir (isInjured = false)', healedAt !== null && st.crisis.treated === treated0 + 1, `${healedAt} saat`);
    check('şifacıda sarılınca keyif artar ve Yaşam Günlüğü\'ne "Şifacıda yaraları sarıldı" yazılır', patient.memories.some((m) => m.text === 'Şifacıda yaraları sarıldı') && st.journal.some((j) => j.text.includes('Şifacı Kulübesi\'nde sarıldı')));
    // Şifalı ot
    const herbal = adults().find((c) => !c.isInjured && !c.illness);
    herbal.isInjured = true;
    herbal.injuryTimer = 36 * 60;
    game.events.emit('citizen:herbTea', { character: herbal });
    check('şifalı ot demleyen yaralının yarası çabuk kapanır', herbal.injuryTimer <= 180);
    herbal.isInjured = false;
    herbal.injuryTimer = 0;

    // --- Ana üreteç yalıtımı (KURAL 1) ---
    {
      const mainRng = S.behavior.rng;
      const rngStateBefore = mainRng.state;
      let randomCalls = 0;
      const realRandom = Math.random;
      Math.random = () => { randomCalls++; return realRandom(); };
      const b = st.buildings.find((x) => x.functional && BD.DAMAGEABLE_TYPES.includes(x.type) && !x.damaged);
      crisis().startFire(b);
      crisis().onBucket(adults()[0], b);
      crisis().extinguish(b, { byPlayer: true });
      crisis().startFire(b);
      b.fireProgress = 100;
      crisis().update({ gameMinutes: 1 });
      crisis().repairNow(b);
      crisis().warnRaid();
      crisis().resolveRaid('defend');
      crisis().warnRaid();
      crisis().resolveRaid('caught');
      for (const x of st.buildings) x.isDamaged = false;
      crisis().injure(adults()[3], 'raid');
      crisis().update({ gameMinutes: 3000 });
      st.crisis.difficulty = 'cetin';
      crisis().rollFire();
      crisis().hourly();
      st.crisis.difficulty = 'huzurlu';
      Math.random = realRandom;
      check('kriz sistemi oyunun ana rastgele sayı üretecini ve Math.random\'u tüketmez', mainRng.state === rngStateBefore && randomCalls === 0, `${mainRng.state}/${rngStateBefore} ${randomCalls}`);
      check('kriz sistemi kendi tohumlanmış üretecini kullanır (seed + 26)', crisis().rng !== S.behavior.rng && crisis().rng.state !== undefined);
      st.crisis.raid = null;
      for (const x of st.buildings) { x.isBurning = false; x.isDamaged = false; }
      for (const c of st.characters) { c.isInjured = false; c.injuryTimer = 0; }
    }

    // --- Doğal takvim (Çetin) ve yükleme sonrası 24 saat koruması ---
    {
      const c = crisis();
      st.crisis.difficulty = 'cetin';
      st.crisis.raid = null;
      st.crisis.nextRaidWarnAt = null;
      const dayKept = st.time.day;
      st.time.day = Math.max(dayKept, 12);
      const firesBefore = st.crisis.fires;
      const graceSaved = c.graceUntil;
      c.graceUntil = now() + 1440;
      c.hourly();
      check('kayıt yüklendikten sonraki ilk 24 saatte doğal kriz çıkmaz (haydut takvimi bile kurulmaz)', st.crisis.nextRaidWarnAt === null && st.crisis.fires === firesBefore && !st.crisis.raid);
      c.graceUntil = null;
      c.hourly();
      check('koruma bitince haydut izi takvimi kurulur (Çetin: 8-10 günlük aralık ≥ 1/1,5)', Number.isFinite(st.crisis.nextRaidWarnAt));
      st.crisis.nextRaidWarnAt = now() - 1;
      c.hourly();
      check('takvim gelince doğal haydut izi uyarısı çıkar', Boolean(st.crisis.raid));
      st.crisis.raid = null;
      st.crisis.difficulty = 'huzurlu';
      st.crisis.nextRaidWarnAt = now() - 1;
      c.hourly();
      check('Huzurlu: takvim dolsa bile doğal haydut izi çıkmaz', !st.crisis.raid);
      // Çetin'de doğal yangın zamanla kesinlikle çıkar (günlük yoklama, kendi üretecinden)
      st.crisis.difficulty = 'cetin';
      for (const x of st.buildings) x.isBurning = false;
      let natural = 0;
      for (let i = 0; i < 400 && natural === 0; i++) {
        c.rollFire();
        natural = st.buildings.filter((x) => x.isBurning).length;
      }
      check('Çetin: doğal yangın yoklaması ateşli yapılarda yangın çıkarır', natural === 1);
      for (const x of st.buildings) { x.isBurning = false; x.isDamaged = false; }
      st.crisis.difficulty = 'huzurlu';
      st.crisis.nextRaidWarnAt = null;
      st.crisis.raid = null;
      c.graceUntil = graceSaved;
      st.time.day = dayKept;
    }

    // --- Sanat ---
    {
      const w = ART.getStructureSprite('well', {});
      const t = ART.getStructureSprite('guardTower', {});
      const tl = ART.getStructureSprite('guardTower', { lit: true });
      check('Su Kuyusu sprite\'ı 16x24, Gözcü Kulesi 32x56 (geceleri farklı)', w.width === 16 && w.height === 24 && t.width === 32 && t.height === 56 && t !== tl);
      check('yeni simgeler: alev, kova, kalkan, haydut, bandaj, tamir (dünya ve arayüz)', ['fire', 'bucket', 'shield', 'bandit', 'bandage', 'repair'].every((n) => { try { return UI.getIconSprite(n) && UI.getAnyIconURL(n); } catch (e) { return false; } }));
    }

    check('kriz boyunca kimse ölmedi ve nüfus eksilmedi; hiçbir yapı haritadan silinmedi', st.characters.length >= popBefore && st.buildings.length >= buildingsBefore);
    // --- Kayıt gidiş-dönüşü (sürüm 20) ---
    {
      const b = st.buildings.find((x) => x.functional && BD.DAMAGEABLE_TYPES.includes(x.type) && !x.damaged);
      const d = st.buildings.find((x) => x.functional && BD.DAMAGEABLE_TYPES.includes(x.type) && !x.damaged && x !== b);
      crisis().startFire(b);
      b.fireProgress = 42;
      b.fireWater = 2;
      crisis().damage(d, 'raid');
      const hurtOne = adults()[4];
      crisis().injure(hurtOne, 'raid');
      hurtOne.injuryTimer = 1000;
      st.crisis.difficulty = 'cetin';
      st.crisis.raid = null;
      crisis().warnRaid();
      const T = { b: b.id, d: d.id, hurt: hurtOne.id, raid: JSON.stringify(st.crisis.raid), fires: st.crisis.fires, repairs: st.crisis.repairs, extinguished: st.crisis.extinguished };
      game.events.emit('ui:save');
      const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
      game.events.emit('ui:load');
      const s5 = game.state;
      const b2 = s5.buildings.find((x) => x.id === T.b);
      const d2 = s5.buildings.find((x) => x.id === T.d);
      const h2 = s5.characters.find((c) => c.id === T.hurt);
      check('kayıt sürümü 22: kriz durumu, yanan / hasarlı yapı bayrakları ve yaralı sakin kayda yazılır', raw.version === 22 && raw.crisis && raw.buildings.find((x) => x.id === T.b).isBurning === true && raw.buildings.find((x) => x.id === T.d).isDamaged === true && raw.characters.find((c) => c.id === T.hurt).isInjured === true);
      check('kayıttan yanan yapı (ilerleme ve kova sayısı), hasarlı yapı ve hasar nedeni döner', b2.isBurning && b2.fireProgress === 42 && b2.fireWater === 2 && d2.isDamaged && d2.damageKind === 'raid');
      check('kayıttan yaralı sakin ve kalan iyileşme süresi döner', h2.isInjured && h2.injuryTimer === 1000);
      check('kayıttan tehlike sıklığı, bekleyen haydut baskını ve sayaçlar döner', s5.crisis.difficulty === 'cetin' && JSON.stringify(s5.crisis.raid) === T.raid && s5.crisis.fires === T.fires && s5.crisis.repairs === T.repairs && s5.crisis.extinguished === T.extinguished);
      check('yüklemeden sonra krizin kendi üreteci ve koruma süresi yeniden kurulur (aktif kriz kaydedildiyse koruma yok)', game.scenes.current.crisis.graceUntil === null);
      // Aktif kriz yokken yükleyince koruma var
      const s6s = game.scenes.current;
      for (const x of s5.buildings) { x.isBurning = false; x.isDamaged = false; }
      s5.crisis.raid = null;
      game.events.emit('ui:save');
      game.events.emit('ui:load');
      check('aktif kriz yokken yüklenince ilk 24 oyun saatinde doğal kriz korumasında', game.scenes.current.crisis.graceUntil === game.state.totalMinutes + 1440);
      // Eski (v19) kayıt: kriz yok
      game.events.emit('ui:save');
      const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
      old.version = 19;
      delete old.crisis;
      for (const x of old.buildings) for (const k of ['isBurning', 'isDamaged', 'fireProgress', 'fireWater', 'damageKind', 'damagedAt']) delete x[k];
      for (const c of old.characters) { delete c.isInjured; delete c.injuryTimer; }
      localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
      game.events.emit('ui:load');
      const s7 = game.state;
      check('v19 kaydı yüklenince hiçbir yapı yanmıyor / hasarlı değil, kimse yaralı değil, kriz boş ve Dengeli', s7.buildings.every((x) => !x.isBurning && !x.isDamaged) && s7.characters.every((c) => !c.isInjured) && s7.crisis.difficulty === 'dengeli' && !s7.crisis.raid && s7.crisis.fires === 0);
      check('v19 kaydı yüklenince ilk 24 saatte kriz çıkmaz', game.scenes.current.crisis.graceUntil === s7.totalMinutes + 1440);
    }
  }

  // ===== 24. aşama (24.1): tarımsal çeşitlilik, bahçenin ekim tercihi, Keten ve Şerbetçiotu, Ürün Silosu, mahsul bozulması =====
  {
    const S = () => game.scenes.current;
    const st = game.state;
    const CR = await import('/src/data/crops.js');
    const GR = await import('/src/systems/Granary.js');
    const BD = await import('/src/data/buildings.js');
    const RS = await import('/src/data/resources.js');
    const TS = await import('/src/systems/TownStatus.js');
    const ART = await import('/src/art/sprites/index.js');
    const UI = await import('/src/art/ui/index.js');
    const { CONFIG } = await import('/src/config.js');
    // Testi doğal krizler, dilekçe ve fermanlar bozmasın
    st.crisis.difficulty = 'huzurlu';
    st.crisis.raid = null;
    st.crisis.nextRaidWarnAt = null;
    st.petitions.list = [];
    st.petitions.nextAt = st.totalMinutes + 1e6;
    st.crown.decree = null;
    st.crown.nextDecreeAt = st.totalMinutes + 1e6;
    st.crown.nextLevyAt = st.totalMinutes + 1e6;
    const placeAt = (type, x, y) => {
      const res = S().construction.placeSite(type, x, y);
      if (!res.ok) return null;
      const job = S().jobs.jobs.find((j) => j.buildingId === res.building.id);
      if (job) S().jobs.cancel(job);
      S().construction.complete(res.building);
      return res.building;
    };
    const events = [];
    const offs = ['crop:changed', 'goods:firstProduced', 'granary:spoiled', 'toast'].map((n) => game.events.on(n, (p) => events.push({ n, p })));
    const recalc = () => S().economy.recalculateCapacity();

    // --- Veri ---
    check('üç mahsul: Buğday / Sebze (varsayılan, yiyecek), Keten, Meyve / Şerbetçiotu', CR.CROP_KEYS.join(',') === 'grain,flax,hops' && CR.DEFAULT_CROP === 'grain' && CR.CROPS.grain.resource === 'food' && CR.CROPS.flax.resource === 'flax' && CR.CROPS.hops.resource === 'hops');
    check('Sebze Bahçesi üç mahsulü seçebilir; öteki üretim yapıları seçemez', BD.BUILDINGS.garden.crops.join(',') === 'grain,flax,hops' && GR.canChooseCrop('garden') && !GR.canChooseCrop('lumberHut') && !GR.canChooseCrop('sheepFarm'));
    check('Buğday verimi bahçenin eski verimiyle aynı (saatte 5 yiyecek)', CR.CROPS.grain.perHour === BD.BUILDINGS.garden.production.perHour && BD.BUILDINGS.garden.production.resource === 'food');
    check('Keten ve Şerbetçiotu yeni mal kalemleri (Mallar listesinde, gıda değil)', RS.GOODS_KEYS.includes('flax') && RS.GOODS_KEYS.includes('hops') && !RS.RESOURCES.flax.foodValue && !RS.RESOURCES.hops.foodValue && !RS.FOOD_KEYS.includes('flax') && RS.STARTING_RESOURCES.flax === 0 && RS.STARTING_RESOURCES.hops === 0);
    check('tarımsal kaynaklar: yiyecek, ekmek, keten, şerbetçiotu', CR.AGRI_KEYS.join(',') === 'food,bread,flax,hops' && GR.isAgricultural('bread') && !GR.isAgricultural('wood') && !GR.isAgricultural('wool'));
    const siloDef = BD.BUILDINGS.silo;
    check('Ürün Silosu: 2x2, Depolama, Köy seviyesinde, odun ve taş maliyetli, +150 tarımsal kapasite', siloDef && siloDef.size.w === 2 && siloDef.size.h === 2 && siloDef.category === 'Depolama' && siloDef.requiresTier === 2 && Object.keys(siloDef.cost).sort().join(',') === 'stone,wood' && siloDef.granary.capacity === 150 && siloDef.buildable && siloDef.demolishable);
    check('Ürün Silosu Yapılar sekmesinde, Kiler\'in hemen ardından', BD.BUILD_MENU.indexOf('silo') === BD.BUILD_MENU.indexOf('storage') + 1 && BD.buildTabFor('silo') === 'buildings');

    // --- Seviye kilidi ---
    sim.give({ wood: 600, stone: 600, food: 120, bread: 0, flax: 0, hops: 0 });
    const tierWas = st.town.tier;
    st.town.tier = Math.max(2, tierWas);
    const spot = sim.findSpot('silo');
    st.town.tier = 1;
    const locked = spot ? S().construction.checkPlacement('silo', spot.x, spot.y) : { ok: true };
    st.town.tier = 2;
    const open = spot ? S().construction.checkPlacement('silo', spot.x, spot.y) : { ok: false };
    check('Ürün Silosu Mezra\'da kilitli, Köy seviyesinde kurulabilir', spot && !locked.ok && open.ok, locked.reason);
    st.town.tier = Math.max(2, tierWas);

    // --- Bahçe ve ekim tercihi ---
    for (const b of st.buildings.filter((x) => x.type === 'silo')) S().construction.demolish?.(b);
    const garden = sim.place('garden');
    check('yeni bahçe Buğday / Sebze ekili başlar ve yiyecek üretir', garden && garden.crop === 'grain' && GR.productionOf(garden).resource === 'food' && GR.productionOf(garden).perHour === 5);
    const switchesBefore = st.granary.switches;
    events.length = 0;
    garden.productionBuffer = 0.7;
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    check('ekim tercihi Keten\'e geçer: ürün keten, saatte 3', garden.crop === 'flax' && GR.productionOf(garden).resource === 'flax' && GR.productionOf(garden).perHour === 3);
    check('mahsul değişince olay, bildirim ve sayaç; yarım kalan hasat sıfırlanır', events.some((e) => e.n === 'crop:changed' && e.p.crop === 'flax' && e.p.from === 'grain') && events.some((e) => e.n === 'toast' && /Keten/.test(e.p.text)) && st.granary.switches === switchesBefore + 1 && garden.productionBuffer === 0);
    events.length = 0;
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'wheat' });
    const lumber = st.buildings.find((b) => b.type === 'lumberHut');
    if (lumber) game.events.emit('ui:setCrop', { buildingId: lumber.id, crop: 'flax' });
    check('aynı mahsul, geçersiz mahsul ve bahçe olmayan yapı reddedilir', garden.crop === 'flax' && !events.some((e) => e.n === 'crop:changed') && (!lumber || lumber.crop === null));
    const cycle = [];
    for (const c of ['hops', 'grain', 'flax', 'hops']) {
      game.events.emit('ui:setCrop', { buildingId: garden.id, crop: c });
      cycle.push(`${garden.crop}:${GR.productionOf(garden).resource}`);
    }
    check('mahsul değiştirme döngüsü (Şerbetçiotu → Buğday → Keten → Şerbetçiotu) üretimi her seferinde izler', cycle.join(',') === 'hops:hops,grain:food,flax:flax,hops:hops', cycle.join(','));
    check('Buğday dışı mahsulde bahçe tanımı değişmez (yalnızca yapıya özgü üretim)', BD.BUILDINGS.garden.production.resource === 'food' && GR.productionOf(garden) !== BD.BUILDINGS.garden.production);

    // --- Hasat (gerçek BehaviorSystem.performWork) ---
    const worker = st.characters.find((c) => !c.isChild && !c.role);
    const work = (b, minutes) => {
      for (let i = 0; i < minutes; i++) S().behavior.performWork(worker, { workBuildingId: b.id, activity: 'farm' }, 1);
    };
    st.time.day = 6; // yaz (mevsim verimi 1'in üstünde)
    S().structures.update({ hour: 10, gameMinutes: 0 });
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    sim.give({ food: 50, flax: 0, hops: 0 });
    st.stats.goods.flax = 0;
    events.length = 0;
    garden.producedToday = 0;
    const foodBefore = st.resources.food;
    work(garden, 120);
    check('Keten hasadı: bahçıvan çalıştıkça keten birikir, bahçeden yiyecek gelmez', st.resources.flax > 0 && st.resources.food === foodBefore && garden.producedToday === st.resources.flax, `keten ${st.resources.flax}, yiyecek ${foodBefore}->${st.resources.food}`);
    check('ilk keten: ilk mal olayı ve Kasaba Günlüğü\'ne not', events.some((e) => e.n === 'goods:firstProduced' && e.p.resource === 'flax') && st.journal.some((j) => /keten/.test(j.text)) && st.stats.goods.flax === st.resources.flax);
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'hops' });
    st.stats.goods.hops = 0;
    work(garden, 120);
    check('Şerbetçiotu hasadı: şerbetçiotu birikir, keten artmaz', st.resources.hops > 0 && st.stats.goods.hops === st.resources.hops && st.journal.some((j) => /şerbetçiotu/.test(j.text)));
    const flaxPer = (() => {
      game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'grain' });
      const f0 = st.resources.food;
      work(garden, 120);
      return st.resources.food - f0;
    })();
    check('Buğday\'a dönünce yine yiyecek gelir (verim keten / şerbetçiotundan yüksek)', flaxPer > st.resources.hops, `buğday +${flaxPer}, şerbetçiotu ${st.resources.hops}`);
    check('Keten ve Şerbetçiotu gıda sayılmaz (göç koşulu / toplam besin)', (() => { const a = TS.foodSupply(st); sim.give({ flax: 90, hops: 90 }); const b = TS.foodSupply(st); return a === b; })());
    // Bahçıvanın etkinlik metni
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    const lbl = S().behavior.performLabel(worker, { activity: 'farm', buildingId: garden.id }, { label: 'Bahçeyi çapalıyor' });
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'grain' });
    const lbl2 = S().behavior.performLabel(worker, { activity: 'farm', buildingId: garden.id }, { label: 'Bahçeyi çapalıyor' });
    check('bahçıvanın etkinlik metni mahsule göre (Buğday\'da eski metin)', /keten/i.test(lbl) && lbl2 === 'Bahçeyi çapalıyor', `${lbl} / ${lbl2}`);
    // Zanaat ve mevsim: kışın keten de donar
    st.time.day = 14;
    S().structures.update({ hour: 10, gameMinutes: 0 });
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    check('kışın keten tarlası da donar (mevsim çarpanı her mahsule uygulanır)', garden.upgraded || garden.frozen);
    st.time.day = 6;
    S().structures.update({ hour: 10, gameMinutes: 0 });

    // --- HUD: Mallar listesi ---
    game.render(0);
    const hud = game.ui.components.find((x) => x.renderWelfare);
    check('üst çubuktaki Mallar listesinde Keten ve Şerbetçiotu kalemleri', hud.resources.flax && hud.resources.hops && hud.goodsMenu.contains(hud.resources.flax.box) && hud.goodsMenu.contains(hud.resources.hops.box));
    hud.renderGoodsDetail(st);
    check('Mallar ipucu keteni üreten bahçeyi sayar', /1 yapı/.test(hud.resources.flax.box.title) && /Keten/.test(hud.resources.flax.box.title), hud.resources.flax.box.title.split('\n')[0]);
    check('Keten ve Şerbetçiotu simgeleri (arayüz ve sırtta taşıma demeti)', ['flax', 'hops'].every((n) => UI.getIconDataURL(n) && UI.getCarrySprite(n)));

    // --- Ürün Silosu: kapasite ---
    recalc();
    const base = st.storageCapacity;
    check('silo yokken tarımsal sınır genel kapasiteyle aynı', st.granaryCapacity === 0 && GR.storageLimit(st, 'food') === base && GR.storageLimit(st, 'flax') === base && GR.storageLimit(st, 'gold') === Infinity);
    const silo = sim.place('silo');
    recalc();
    check('Ürün Silosu kurulunca yiyecek, ekmek, keten ve şerbetçiotu sınırı +150', silo && st.granaryCapacity === 150 && ['food', 'bread', 'flax', 'hops'].every((r) => GR.storageLimit(st, r) === base + 150));
    check('silo odun, taş, yün ve demirin sınırını değiştirmez; genel kapasite aynı', st.storageCapacity === base && ['wood', 'stone', 'wool', 'iron'].every((r) => GR.storageLimit(st, r) === base));
    sim.give({ food: base, wood: base, flax: base });
    const addedFood = S().economy.add('food', 400);
    const addedWood = S().economy.add('wood', 50);
    const addedFlax = S().economy.add('flax', 400);
    check('depoya giriş: yiyecek ve keten 150 fazla sığar, odun sığmaz', addedFood === 150 && addedWood === 0 && addedFlax === 150 && st.resources.food === base + 150);
    const silo2 = sim.place('silo');
    recalc();
    check('iki silo +300', silo2 && st.granaryCapacity === 300 && GR.storageLimit(st, 'hops') === base + 300);
    // Değirmen: ekmek deposu dolu sayılmaz
    sim.give({ bread: base + 10 });
    const mill = st.buildings.find((b) => b.type === 'mill' && b.functional) ?? sim.place('mill');
    if (mill) {
      S().structures.updateProcessing(mill, BD.BUILDINGS.mill.processing);
      check('ekmek genel kapasiteyi aşsa da siloda yer varsa fırın çalışır', !/dolu/.test(mill.processStatus ?? ''), mill.processStatus);
    }
    // Panel
    const panel = game.ui.components.find((x) => x.renderCrafting);
    const show = (b) => {
      panel.buildingId = b.id;
      panel.element.hidden = false;
      panel.lastKey = '';
      panel.render(game);
    };
    show(silo);
    check('Silo panelinde tarımsal depo katkısı ve stok sınırları', panel.lines.textContent.includes('Tarımsal depo katkısı: +150') && panel.lines.textContent.includes(`Yiyecek ${st.resources.food}/${base + 300}`) && /çürümez/.test(panel.lines.textContent));
    show(garden);
    const btns = [...panel.cropBox.querySelectorAll('button')];
    check('bahçe panelinde Ekim Tercihi: üç düğme, seçili olan vurgulu', !panel.cropBox.hidden && /Ekim Tercihi/.test(panel.cropBox.textContent) && btns.length === 3 && btns.filter((b) => b.classList.contains('is-active')).map((b) => b.dataset.crop).join() === garden.crop);
    btns.find((b) => b.dataset.crop === 'hops').click();
    panel.render(game);
    check('düğmeye tıklayınca mahsul değişir ve panel yenilenir', garden.crop === 'hops' && panel.cropBox.querySelector('.is-active').dataset.crop === 'hops' && /Şerbetçiotu/.test(panel.cropBox.textContent));
    check('silo varken panel bozulmanın önlendiğini söyler', /bozulmaz/.test(panel.cropBox.textContent));
    show(lumber ?? silo);
    check('bahçe olmayan yapıda Ekim Tercihi gizli', panel.cropBox.hidden);
    panel.buildingId = null;
    panel.element.hidden = true;

    // --- Bozulma (yağmur / kış, silosuz) ---
    const G = S().granary;
    const removeSilos = () => {
      for (const b of st.buildings.filter((x) => x.type === 'silo')) {
        b.underConstruction = true; // işlemez hale getir (yıkımdan bağımsız)
      }
      recalc();
    };
    const restoreSilos = () => {
      for (const b of st.buildings.filter((x) => x.type === 'silo')) b.underConstruction = false;
      recalc();
    };
    const setWeather = (type) => {
      st.weather.type = type;
      st.weather.rain = type === 'rainy' ? 1 : 0;
    };
    removeSilos();
    st.granary.spoiled = {};
    st.granary.buffers = {};
    st.time.day = 6;
    setWeather('sunny');
    sim.give({ food: 180, flax: 180, hops: 180, bread: 80 });
    G.spoil(10);
    check('kuru yaz havasında mahsul bozulmaz', st.resources.food === 180 && st.resources.flax === 180);
    setWeather('rainy');
    const rainy = G.spoilWeather();
    const lost = G.spoil(10);
    check('silosuz kasabada yağmurda güvenli stoğun (80) üstündeki ham mahsul bozulur', rainy && lost.food === 4 && lost.flax === 4 && lost.hops === 4 && st.resources.food === 176, JSON.stringify(lost));
    check('ekmek bozulmaz; bozulan miktar sayaçta, bildirim bir kez', st.resources.bread === 80 && st.granary.spoiled.food === 4 && events.filter((e) => e.n === 'toast' && /Nem ve soğuk/.test(e.p.text)).length === 1, `ekmek ${st.resources.bread}, sayaç ${JSON.stringify(st.granary.spoiled)}, bildirim ${events.filter((e) => e.n === 'toast').map((e) => e.p.text).join(' | ')}`);
    events.length = 0;
    G.spoil(1);
    check('aynı gün ikinci bozulmada yeni bildirim yok; küsurat birikir', !events.some((e) => e.n === 'toast') && st.granary.buffers.food > 0 && st.granary.buffers.food < 1);
    setWeather('sunny');
    st.time.day = 14; // kış
    sim.give({ food: 60, flax: 200 });
    const w = G.spoil(10);
    check('kışın da bozulur; güvenli stok altındaki yiyecek korunur', !w.food && w.flax > 0 && st.resources.food === 60);
    // Gerçek saat olayı
    sim.give({ flax: 200 });
    const f0 = st.resources.flax;
    for (let i = 0; i < 5; i++) game.events.emit('time:hour', 10);
    check('saat başı (time:hour) bozulma işler', st.resources.flax < f0 && st.resources.flax >= f0 - 5, `${f0}->${st.resources.flax}`);
    restoreSilos();
    sim.give({ food: 300, flax: 300, hops: 300 });
    setWeather('rainy');
    const safe = G.spoil(24);
    check('Ürün Silosu varken yağmurda ve kışın hiçbir mahsul bozulmaz', Object.keys(safe).length === 0 && st.resources.food === 300 && st.resources.flax === 300 && GR.spoilageAt(st, 'food', 24) === 0);
    setWeather('sunny');
    st.time.day = 6;

    // --- Görseller ---
    const sprites = ['grain', 'flax', 'hops'].map((c) => ART.getStructureSprite('garden', { season: 'summer', crop: c }));
    const reader = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const pixels = (cv) => {
      reader.canvas.width = cv.width;
      reader.canvas.height = cv.height;
      reader.clearRect(0, 0, cv.width, cv.height);
      reader.drawImage(cv, 0, 0);
      return reader.getImageData(0, 0, cv.width, cv.height).data;
    };
    const px = (cv) => { const d = pixels(cv); let h = 0; for (let i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) | 0; return h; };
    check('üç mahsulün tarla dokusu farklı (48x48)', sprites.every((sp) => sp.width === 48 && sp.height === 48) && new Set(sprites.map(px)).size === 3);
    const goldPixels = (cv) => { const d = pixels(cv); let n = 0, blue = 0, purple = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 230 && d[i + 1] > 190 && d[i + 2] < 110) n++; if (d[i] < 120 && d[i + 1] > 150 && d[i + 2] > 200) blue++; if (d[i] > 120 && d[i + 1] < 80 && d[i + 2] > 100) purple++; } return { n, blue, purple }; };
    const [gp, fp, hp] = sprites.map(goldPixels);
    check('Buğday altın sarısı, Keten açık mavi çiçekli, Şerbetçiotu mor salkımlı', gp.n > 40 && fp.blue > 20 && hp.purple > 10 && fp.n < gp.n, JSON.stringify([gp, fp, hp]));
    check('mahsul tarlası her mevsim çizilir; kışın karla örtülür', ['grain', 'flax', 'hops'].every((c) => ['spring', 'summer', 'autumn', 'winter'].every((s2) => ART.getStructureSprite('garden', { season: s2, crop: c }).width === 48)));
    const siloSprite = ART.getStructureSprite('silo', {});
    check('Ürün Silosu görseli 32x48; kışın çatısı karlanır', siloSprite.width === 32 && siloSprite.height === 48 && ART.getStructureSprite('silo', { season: 'winter' }) !== siloSprite);
    check('yapının görseli seçili mahsulü kullanır', garden.currentSprite({ season: 'summer', time: 0 }) === ART.getStructureSprite('garden', { season: 'summer', crop: garden.crop }));

    // --- Kayıt gidiş-dönüşü (sürüm 21) ---
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    const other = sim.place('garden');
    game.events.emit('ui:setCrop', { buildingId: other.id, crop: 'hops' });
    sim.give({ flax: 77, hops: 33 });
    st.granary.spoiled = { food: 12, flax: 5 };
    st.granary.buffers = { hops: 0.25 };
    const T = { g: garden.id, o: other.id, switches: st.granary.switches };
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 22: bahçelerin mahsulü, Keten / Şerbetçiotu stoğu ve silo sayaçları kayda yazılır', CONFIG.SAVE_VERSION === 22 && raw.version === 22 && raw.buildings.find((b) => b.id === T.g).crop === 'flax' && raw.buildings.find((b) => b.id === T.o).crop === 'hops' && raw.resources.flax === 77 && raw.resources.hops === 33 && raw.granary.spoiled.food === 12);
    game.events.emit('ui:load');
    const s2 = game.state;
    const g2 = s2.buildings.find((b) => b.id === T.g);
    const o2 = s2.buildings.find((b) => b.id === T.o);
    check('kayıttan bahçelerin mahsulü ve üretimi döner', g2.crop === 'flax' && o2.crop === 'hops' && GR.productionOf(g2).resource === 'flax' && GR.productionOf(o2).resource === 'hops');
    check('kayıttan Keten / Şerbetçiotu stoğu, bozulma sayaçları, küsurat ve değişiklik sayısı döner', s2.resources.flax === 77 && s2.resources.hops === 33 && s2.granary.spoiled.food === 12 && s2.granary.spoiled.flax === 5 && s2.granary.buffers.hops === 0.25 && s2.granary.switches === T.switches);
    check('yüklemeden sonra silo kapasitesi yeniden hesaplanır', s2.granaryCapacity === 300 && GR.storageLimit(s2, 'food') === s2.storageCapacity + 300);
    check('yüklenen kasabada ekim tercihi değiştirilebilir', (() => { game.events.emit('ui:setCrop', { buildingId: g2.id, crop: 'grain' }); return g2.crop === 'grain'; })());
    // Bozuk mahsul değeri
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.buildings.find((b) => b.id === T.o).crop = 'tütün';
    bad.granary = { spoiled: { food: -5, gold: 9 }, buffers: { food: 7 }, switches: 'x' };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('geçersiz mahsul Buğday\'a, bozuk silo sayaçları boşa döner', game.state.buildings.find((b) => b.id === T.o).crop === 'grain' && !game.state.granary.spoiled.food && !game.state.granary.spoiled.gold && !game.state.granary.buffers.food && game.state.granary.switches === 0);
    // Eski (v20) kayıt: mahsul, keten / şerbetçiotu ve silo yok
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 20;
    delete old.granary;
    delete old.resources.flax;
    delete old.resources.hops;
    old.buildings = old.buildings.filter((b) => b.type !== 'silo');
    for (const b of old.buildings) delete b.crop;
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    const s3 = game.state;
    check('v20 kaydı yüklenince bütün bahçeler Buğday / Sebze ekili, yiyecek üretir', s3.buildings.filter((b) => b.type === 'garden').length >= 2 && s3.buildings.filter((b) => b.type === 'garden').every((b) => b.crop === 'grain' && GR.productionOf(b).resource === 'food'));
    check('v20 kaydında Keten / Şerbetçiotu 0, silo kapasitesi 0, silo sayaçları boş', s3.resources.flax === 0 && s3.resources.hops === 0 && s3.granaryCapacity === 0 && Object.keys(s3.granary.spoiled).length === 0 && s3.granary.switches === 0);
    check('v20 kaydında bahçe dışı yapıların mahsulü yok', s3.buildings.filter((b) => b.type !== 'garden').every((b) => b.crop === null));
    offs.forEach((off) => off());
  }

  // ===== 24. aşama (24.2): Dokuma Tezgâhı ve Kumaş, Şerbethane ve Fıçı Şerbeti, han tüketimi, Dayanıklı Giysi, lüks iş önceliği =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const BD = await import('/src/data/buildings.js');
    const RS = await import('/src/data/resources.js');
    const RF = await import('/src/data/refinery.js');
    const RX = await import('/src/systems/Refinery.js');
    const EQ = await import('/src/systems/Equipment.js');
    const TS = await import('/src/systems/TownStatus.js');
    const CZ = await import('/src/systems/Citizens.js');
    const ACT = (await import('/src/data/activities.js')).ACTIVITIES;
    const SK = await import('/src/data/skills.js');
    const ART = await import('/src/art/sprites/index.js');
    const UI = await import('/src/art/ui/index.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    s0.crown.decree = null;
    s0.crown.nextDecreeAt = s0.totalMinutes + 1e6;
    s0.crown.nextLevyAt = s0.totalMinutes + 1e6;
    const events = [];
    const offs = ['goods:firstProduced', 'citizen:sherbet', 'citizen:bought', 'processing:made'].map((n) => game.events.on(n, (p) => events.push({ n, p })));

    // --- Veri ---
    check('Kumaş ve Fıçı Şerbeti yeni mal kalemleri (Mallar listesinde, gıda değil, başlangıçta 0)', ['cloth', 'sherbet'].every((k) => RS.GOODS_KEYS.includes(k) && !RS.RESOURCES[k].foodValue && RS.STARTING_RESOURCES[k] === 0));
    const loomDef = BD.BUILDINGS.loom;
    const brewDef = BD.BUILDINGS.brewery;
    check('Dokuma Tezgâhı: 2x2, Kasaba seviyesi, odun + taş + demir, 1 dokumacı, 2 keten -> 1 kumaş, lüks iş', loomDef.size.w === 2 && loomDef.size.h === 2 && loomDef.requiresTier === 3 && loomDef.cost.wood > 0 && loomDef.cost.stone > 0 && loomDef.cost.iron > 0 && loomDef.workers === 1 && loomDef.workActivity === 'weave' && loomDef.processing.input.flax === 2 && loomDef.processing.output.cloth === 1 && loomDef.luxury === true);
    check('Şerbethane: 2x2, Kasaba seviyesi, taş + kereste, 1 mahzen ustası, 2 şerbetçiotu -> 1 fıçı, lüks iş', brewDef.size.w === 2 && brewDef.size.h === 2 && brewDef.requiresTier === 3 && Object.keys(brewDef.cost).sort().join() === 'stone,wood' && brewDef.workers === 1 && brewDef.workActivity === 'brewSherbet' && brewDef.processing.input.hops === 2 && brewDef.processing.output.sherbet === 1 && brewDef.luxury === true);
    check('iki yapı Yapılar sekmesinde, Kasaba Hanı\'nın ardından', BD.BUILD_MENU.indexOf('loom') === BD.BUILD_MENU.indexOf('inn') + 1 && BD.BUILD_MENU.indexOf('brewery') === BD.BUILD_MENU.indexOf('loom') + 1 && BD.buildTabFor('loom') === 'buildings');
    check('dokumacı zanaatkârlık, mahzen ustası aşçılık deneyimi kazanır; etkinlik metinleri ve aletleri var', SK.ACTIVITY_SKILLS.weave === 'crafting' && SK.ACTIVITY_SKILLS.brewSherbet === 'cooking' && ACT.weave.tool === 'shuttle' && ACT.brewSherbet.tool === 'ladle' && ACT.weave.idleLabel && ACT.brewSherbet.idleLabel);
    check('çanta eşyaları: Dayanıklı Giysi ve Şerbet Testisi', (await import('/src/data/citizens.js')).ITEMS.garment && (await import('/src/data/citizens.js')).ITEMS.sherbetJug.fun === 15);

    // --- Seviye kilidi ---
    sim.give({ wood: 800, stone: 800, iron: 200, food: 300, bread: 60, flax: 0, hops: 0, cloth: 0, sherbet: 0 });
    s0.town.tier = 3;
    const spot = sim.findSpot('loom');
    s0.town.tier = 2;
    const lockedLoom = spot ? S().construction.checkPlacement('loom', spot.x, spot.y) : { ok: true };
    const lockedBrew = spot ? S().construction.checkPlacement('brewery', spot.x, spot.y) : { ok: true };
    s0.town.tier = 3;
    check('Dokuma Tezgâhı ve Şerbethane Köy\'de kilitli, Kasaba seviyesinde kurulabilir', spot && !lockedLoom.ok && !lockedBrew.ok && /Kasaba/.test(lockedLoom.reason) && S().construction.checkPlacement('loom', spot.x, spot.y).ok, lockedLoom.reason);
    s0.town.tier = 4;

    // --- Girdi / çıktı oranları (gerçek performWork) ---
    const loom = sim.place('loom');
    const brewery = sim.place('brewery');
    const worker = s0.characters.find((c) => !c.isChild && !c.role);
    const work = (b, activity, minutes) => {
      for (let i = 0; i < minutes; i++) S().behavior.performWork(worker, { workBuildingId: b.id, activity }, 1);
    };
    const refresh = () => S().structures.update({ hour: 10, gameMinutes: 0 });
    check('iki yapı kuruldu ve iş yuvası var', loom && brewery && loom.workerSlots === 1 && brewery.workerSlots === 1);
    sim.give({ flax: 0, cloth: 0 });
    refresh();
    check('kilerde keten yokken tezgâh boşta, panelde nedeni', loom.idle && /Keten bekleniyor/.test(loom.processStatus) && /Keten/.test(loom.processStatus), loom.processStatus);
    sim.give({ flax: 40, cloth: 0, food: 300 });
    s0.stats.goods.cloth = 0;
    events.length = 0;
    refresh();
    check('keten gelince tezgâh hazır', !loom.idle && loom.processStatus === null);
    loom.producedToday = 0;
    work(loom, 'weave', 180);
    const woven = s0.resources.cloth;
    check('dokuma: her top kumaş tam 2 keten harcar', woven > 0 && 40 - s0.resources.flax === woven * 2 && loom.producedToday === woven, `kumaş ${woven}, keten ${s0.resources.flax}`);
    check('ilk kumaş: ilk mal olayı, günlük notu ve toplam sayaç', events.some((e) => e.n === 'goods:firstProduced' && e.p.resource === 'cloth') && s0.journal.some((j) => /kumaş/.test(j.text)) && s0.stats.goods.cloth === woven);
    sim.give({ flax: 1 });
    work(loom, 'weave', 120);
    check('tek keten kalınca dokuma durur (yarım top yok)', s0.resources.flax === 1 && s0.resources.cloth === woven);
    sim.give({ hops: 30, sherbet: 0 });
    s0.stats.goods.sherbet = 0;
    refresh();
    work(brewery, 'brewSherbet', 180);
    check('şerbethane: her fıçı tam 2 şerbetçiotu harcar', s0.resources.sherbet > 0 && 30 - s0.resources.hops === s0.resources.sherbet * 2 && s0.stats.goods.sherbet === s0.resources.sherbet, `fıçı ${s0.resources.sherbet}, şerbetçiotu ${s0.resources.hops}`);
    sim.give({ flax: 40, cloth: S().economy.limit('cloth') });
    refresh();
    check('kumaş deposu doluysa tezgâh boşta', loom.idle && /dolu/.test(loom.processStatus), loom.processStatus);
    sim.give({ cloth: 0 });
    // Kasaba açken lüks işler durur
    const pop = s0.characters.length;
    sim.give({ food: Math.floor(pop * 2), bread: 0, hops: 10 });
    s0.pantry.credit = 0;
    refresh();
    check('kasaba açken (kişi başı besin 3\'ün altında) tezgâh ve mahzen boşta', RX.luxuryHungry(s0) && loom.idle && brewery.idle && /besin azaldı/.test(loom.processStatus));
    sim.give({ food: 300, hops: 10, flax: 10 });
    refresh();
    check('besin gelince lüks işler yeniden açılır', !RX.luxuryHungry(s0) && !loom.idle && !brewery.idle);
    check('boşta tezgâhta dokumacının etkinlik metni', (() => { loom.idle = true; const l = S().behavior.performLabel(worker, { activity: 'weave', buildingId: loom.id }, ACT.weave); loom.idle = false; return /keten bekliyor/.test(l); })());

    // --- İş gücü önceliği ---
    {
      const J = S().jobs;
      const savedJobs = J.jobs;
      J.jobs = [];
      const idler = s0.characters.find((c) => !c.isChild && !c.role && c.workplaceId == null && !c.away && !building_has(c));
      function building_has(c) { return s0.buildings.some((b) => b.workerIds.has(c.id)); }
      const origin = { x: idler.tileX, y: idler.tileY };
      const first = J.findWorkFor(idler, origin);
      // Bütün temel iş yerlerini dolu / boşta say: geriye yalnızca lüks işler kalsın
      const basics = s0.buildings.filter((b) => b.functional && b.workerSlots && !b.definition.luxury);
      const saved = basics.map((b) => b.idle);
      for (const b of basics) b.idle = true;
      const second = J.findWorkFor(idler, origin);
      basics.forEach((b, i) => (b.idle = saved[i]));
      J.jobs = savedJobs;
      check('iş seçiminde temel üretim yerleri (bahçe, fırın, ...) lüks işlerden önce gelir', first && first.building && !first.building.definition.luxury, first?.building?.type);
      check('temel yuvalar dolunca boştaki sakin dokuma tezgâhına / mahzene geçer (ticaret fazlası)', second && second.building && second.building.definition.luxury, second?.building?.type);
    }

    // --- Gerçek vardiya: sabitlenen dokumacı mesaide gelir, dokur ve yevmiye alır ---
    {
      st().time.day = 6;
      st().time.hour = 8;
      st().time.minute = 0;
      sim.give({ flax: 60, cloth: 0, food: 300 });
      const weaver = s0.characters.find((c) => !c.isChild && !c.role && !c.away && !c.illness && !c.isInjured && c.id !== worker.id);
      game.events.emit('ui:pinWorker', { buildingId: loom.id, characterId: weaver.id });
      const coins0 = weaver.coins;
      const xp0 = weaver.skills?.crafting ?? 0;
      let sawWeave = false;
      for (let h = 0; h < 10; h++) {
        hours(1);
        if (weaver.task?.activity === 'weave' && weaver.task.phase === 'perform') sawWeave = true;
      }
      check('sabitlenen dokumacı mesaide tezgâhta çalışır (weave) ve kumaş dokur', weaver.workplaceId === loom.id && sawWeave && s0.resources.cloth > 0, `kumaş ${s0.resources.cloth}`);
      check('dokumacının vardiyası yevmiye ve zanaatkârlık deneyimi kazandırır', weaver.coins > coins0 && (weaver.skills?.crafting ?? 0) > xp0, `${coins0}->${weaver.coins}`);
      game.events.emit('ui:unpinWorker', { buildingId: loom.id, characterId: weaver.id });
    }

    // --- Han: fıçı ikmali, şerbet, iki kat dolum, Keyifli Damak, testi ---
    const inn = s0.buildings.find((b) => b.type === 'inn' && b.functional) ?? sim.place('inn');
    const R = S().refinery;
    inn.sherbet = 0;
    sim.give({ sherbet: 30 });
    const moved = R.restock();
    check('saat başı kasaba deposundan hana en çok 2 fıçı taşınır', moved >= 2 && inn.sherbet === 2 && s0.resources.sherbet === 30 - moved);
    for (let i = 0; i < 10; i++) R.restock();
    check('handa en çok 12 fıçı durur', inn.sherbet === 12);
    const guest = s0.characters.find((c) => !c.isChild && !c.role && !c.away && c.id !== worker.id);
    guest.needs.fun = 40;
    guest.coins = 30;
    guest.inventory = [];
    delete guest.buffs.merryPalate;
    const served0 = s0.stats.sherbetServed ?? 0;
    const task = { activity: 'inn', phase: 'perform', buildingId: inn.id, elapsed: 0 };
    events.length = 0;
    const ok = R.serve(guest, task, inn);
    check('handa sohbete oturan sakin fıçı şerbeti içer: +15 keyif', ok && task.sherbet === true && guest.needs.fun === 55 && s0.stats.sherbetServed === served0 + 1 && events.some((e) => e.n === 'citizen:sherbet'));
    const until = guest.buffs.merryPalate;
    const nextNoon = (Math.floor(s0.totalMinutes / 1440) + 1) * 1440 + 12 * 60;
    check('Keyifli Damak: ertesi gün 12:00\'ye kadar sürer', until === nextNoon && RX.hasPalate(guest, s0.totalMinutes) && !RX.hasPalate(guest, nextNoon));
    check('kesesi yeten sakin çantasına bir Şerbet Testisi alır (5 altın, handan 1 fıçı)', CZ.countItem(guest, 'sherbetJug') === 1 && guest.coins === 25 && inn.sherbet === 10 && events.some((e) => e.n === 'citizen:bought' && e.p.kind === 'sherbetJug'));
    const t2 = { activity: 'inn', phase: 'perform', buildingId: inn.id, elapsed: 0 };
    R.serve(guest, t2, inn);
    check('testisi olan ikinci testiyi almaz', CZ.countItem(guest, 'sherbetJug') === 1 && inn.sherbet === 9);
    inn.sherbet = 0;
    const t3 = { activity: 'inn', phase: 'perform', buildingId: inn.id, elapsed: 0 };
    check('handa fıçı yoksa şerbet yok', !R.serve(guest, t3, inn) && !t3.sherbet);
    // İki kat sosyallik ve keyif (gerçek BehaviorSystem.perform)
    {
      const B = S().behavior;
      const a = ACT.inn;
      const run = (withSherbet) => {
        inn.sherbet = withSherbet ? 5 : 0;
        guest.needs.social = 20;
        guest.needs.fun = 20;
        const tk = { activity: 'inn', phase: 'perform', buildingId: inn.id, elapsed: 0, duration: 1e6 };
        guest.task = tk;
        B.perform(guest, tk, a, { gameMinutes: 1, hour: 19 });
        const f1 = guest.needs.fun;
        const s1 = guest.needs.social;
        B.perform(guest, tk, a, { gameMinutes: 10, hour: 19 });
        return { social: guest.needs.social - s1, fun: guest.needs.fun - f1, sherbet: tk.sherbet, jumped: f1 - 20 };
      };
      const plain = run(false);
      const merry = run(true);
      check('handa şerbet içen sakinin sosyallik barı iki kat hızlı dolar', merry.sherbet && !plain.sherbet && plain.social > 0 && Math.abs(merry.social - 2 * plain.social) < 1e-6, `${plain.social.toFixed(3)} / ${merry.social.toFixed(3)}`);
      check('… keyif barı da iki kat hızlı dolar ve +15 ilk bardakta', merry.fun > plain.fun * 1.9 && merry.jumped >= 15, `${plain.fun.toFixed(3)} / ${merry.fun.toFixed(3)} / +${merry.jumped.toFixed(1)}`);
      check('perform şerbeti yalnızca bir kez ikram eder (ilk adımda)', inn.sherbet === 4);
      guest.task = null;
    }
    // Keyifli Damak: keyif yavaş düşer (gerçek NeedsSystem)
    {
      const needs = S().systems.find((x) => x.constructor.name === 'NeedsSystem');
      const drop = (palate) => {
        if (palate) guest.buffs.merryPalate = s0.totalMinutes + 600;
        else delete guest.buffs.merryPalate;
        guest.needs.fun = 80;
        needs.update({ gameMinutes: 60, hour: 10, realDt: 0, simDt: 0 });
        return 80 - guest.needs.fun;
      };
      const normal = drop(false);
      const merryDrop = drop(true);
      check('Keyifli Damak varken keyif %25 yavaş düşer', normal > 0 && Math.abs(merryDrop - normal * RF.INN_SHERBET.palate.funDecay) < normal * 0.05, `${normal.toFixed(3)} / ${merryDrop.toFixed(3)}`);
      delete guest.buffs.merryPalate;
    }
    // Testiden içme
    guest.needs.fun = 20;
    guest.inventory = [{ kind: 'sherbetJug', qty: 1 }];
    const asleep = guest.task;
    const drank = R.drinkJugs();
    check('keyfi düşen sakin çantasındaki testiden içer (+15 keyif, testi biter)', drank >= 1 && guest.needs.fun === 35 && CZ.countItem(guest, 'sherbetJug') === 0);
    guest.needs.fun = 80;
    guest.inventory = [{ kind: 'sherbetJug', qty: 1 }];
    R.drinkJugs();
    check('keyfi yerindeyse testiye dokunmaz', CZ.countItem(guest, 'sherbetJug') === 1);
    guest.inventory = [];

    // --- Kumaş: Dayanıklı Giysi, soğuk direnci, refah ---
    {
      const market = s0.buildings.find((b) => b.type === 'market' && b.functional) ?? sim.place('market');
      const P = S().purse;
      const buyer = s0.characters.find((c) => !c.isChild && !c.role && c.id !== guest.id && c.id !== worker.id);
      const setup = (day, cloth) => {
        s0.time.day = day;
        sim.give({ cloth });
        buyer.coins = 40;
        buyer.inventory = [{ kind: 'souvenir', qty: 1, name: 'Boncuk Kolye' }, { kind: 'ration', qty: 6 }, { kind: 'ration', qty: 6 }];
        buyer.illness = null;
        buyer.exposure = 0;
      };
      setup(6, 10);
      const summer = P.shop(buyer, market);
      setup(10, 10);
      const g0 = s0.stats.garments ?? 0;
      const autumn = P.shop(buyer, market);
      check('sonbaharda Pazar Yeri\'nin terzisi kumaştan Dayanıklı Giysi diker (8 altın, 1 kumaş)', summer !== 'garment' && autumn === 'garment' && CZ.countItem(buyer, 'garment') === 1 && buyer.coins === 32 && s0.resources.cloth === 9 && s0.stats.garments === g0 + 1, `${summer} / ${autumn}`);
      check('giysisi olan ikinciyi almaz', P.shop(buyer, market) !== 'garment' || CZ.countItem(buyer, 'garment') === 1);
      setup(14, 0);
      buyer.inventory = buyer.inventory.filter((x) => x.kind !== 'garment');
      check('kasabada kumaş yokken giysi dikilmez', P.shop(buyer, market) !== 'garment');
      const bare = { equipment: { tool: null, clothing: null, bag: null }, inventory: [] };
      const dressed = { equipment: { tool: null, clothing: null, bag: null }, inventory: [{ kind: 'garment', qty: 1 }] };
      const coat = { equipment: { tool: null, clothing: 'winterCoat', bag: null }, inventory: [{ kind: 'garment', qty: 1 }] };
      check('Dayanıklı Giysi kışın soğuğa karşı +0,3 korur; paltoyla toplanır (en çok 1)', EQ.coldProtection(bare) === 0 && Math.abs(EQ.coldProtection(dressed) - 0.3) < 1e-9 && EQ.coldProtection(coat) <= 1 && EQ.coldProtection(coat) > EQ.coldProtection({ ...coat, inventory: [] }));
      const cloth0 = s0.stats.goods.cloth;
      s0.stats.goods.cloth = 0;
      const b0 = TS.townHappinessBonus(s0);
      s0.stats.goods.cloth = 85;
      const b1 = TS.townHappinessBonus(s0);
      s0.stats.goods.cloth = 900;
      const b2 = TS.townHappinessBonus(s0);
      s0.stats.goods.cloth = cloth0;
      check('dokunan kumaş refaha kalıcı katkı verir: her 40 topta +1, en çok +3', RX.clothWelfare({ stats: { goods: { cloth: 39 } } }) === 0 && b1 - b0 === 2 && b2 - b0 === 3);
      s0.time.day = 6;
    }

    // --- HUD, panel ---
    game.render(0);
    const hud = game.ui.components.find((x) => x.renderWelfare);
    check('Mallar listesinde Kumaş ve Fıçı Şerbeti', hud.resources.cloth && hud.resources.sherbet && hud.goodsMenu.contains(hud.resources.cloth.box) && hud.goodsMenu.contains(hud.resources.sherbet.box));
    hud.renderGoodsDetail(s0);
    check('Kumaş ipucu tezgâhı üretici sayar', /1 yapı/.test(hud.resources.cloth.box.title), hud.resources.cloth.box.title.split('\n')[0]);
    const panel = game.ui.components.find((x) => x.renderCrafting);
    const show = (b) => { panel.buildingId = b.id; panel.element.hidden = false; panel.lastKey = ''; panel.render(game); return panel.lines.textContent; };
    sim.give({ flax: 20, cloth: 0 });
    refresh();
    const loomText = show(loom);
    check('Dokuma Tezgâhı paneli: saatlik oran, toplam kumaş ve refah katkısı, giysi ve lüks iş notu', /dokumacı başı/.test(loomText) && /Keten 4 → Kumaş 2/.test(loomText) && /Dokunan toplam kumaş/.test(loomText) && /Dayanıklı Giysi/.test(loomText) && /Lüks iş/.test(loomText), loomText.slice(0, 160));
    inn.sherbet = 7;
    const brewText = show(brewery);
    check('Şerbethane paneli: oran ve hanlardaki fıçılar', /mahzen ustası başı/.test(brewText) && /Şerbetçiotu 4 → Fıçı Şerbeti 2/.test(brewText) && /7\/12/.test(brewText));
    const innText = show(inn);
    check('Han paneli handaki fıçıyı ve etkisini gösterir', /Fıçı şerbeti: 7\/12/.test(innText) && /iki kat/.test(innText));
    const millB = s0.buildings.find((b) => b.type === 'mill' && b.functional);
    if (millB) check('değirmen paneli eski metinlerini korur', /fırıncı başı/.test(show(millB)) && /Öğünlerde önce ekmek/.test(panel.lines.textContent));
    panel.buildingId = null;
    panel.element.hidden = true;

    // --- Görseller ---
    const L0 = ART.getStructureSprite('loom', {});
    const L1 = ART.getStructureSprite('loom', { active: true, frame: 1 });
    const B0 = ART.getStructureSprite('brewery', {});
    const B1 = ART.getStructureSprite('brewery', { active: true, frame: 1 });
    check('Dokuma Tezgâhı ve Şerbethane görselleri 32x40; çalışırken mekik / ateş kareleri farklı; kışın çatı karlanır', [L0, L1, B0, B1].every((x) => x.width === 32 && x.height === 40) && L0 !== L1 && B0 !== B1 && L0.toDataURL() !== L1.toDataURL() && B0.toDataURL() !== B1.toDataURL() && ART.getStructureSprite('loom', { season: 'winter' }).toDataURL() !== L0.toDataURL());
    check('yeni simgeler, balonlar, taşıma demetleri ve aletler (kumaş, fıçı, mekik, kepçe)', ['cloth', 'sherbet'].every((n) => UI.getIconDataURL(n) && UI.getCarrySprite(n) && UI.getBubbleSprite(n)) && UI.getHeldToolSprite('shuttle', false) && UI.getHeldToolSprite('ladle', true));

    // --- Kayıt gidiş-dönüşü (sürüm 22) ---
    inn.sherbet = 6;
    sim.give({ cloth: 21, sherbet: 13 });
    guest.inventory = [{ kind: 'sherbetJug', qty: 2 }, { kind: 'garment', qty: 1 }];
    guest.buffs.merryPalate = s0.totalMinutes + 500;
    s0.stats.sherbetServed = 17;
    s0.stats.garments = 4;
    s0.stats.goods.cloth = 55;
    const T = { inn: inn.id, loom: loom.id, brew: brewery.id, guest: guest.id, palate: guest.buffs.merryPalate };
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 22: tezgâh, şerbethane, Kumaş / Fıçı Şerbeti, handaki fıçılar ve çanta eşyaları kayda yazılır', CONFIG.SAVE_VERSION === 22 && raw.version === 22 && raw.resources.cloth === 21 && raw.resources.sherbet === 13 && raw.buildings.find((b) => b.id === T.inn).sherbet === 6 && raw.buildings.some((b) => b.id === T.loom && b.type === 'loom') && raw.characters.find((c) => c.id === T.guest).inventory.some((x) => x.kind === 'garment'));
    game.events.emit('ui:load');
    const s2 = st();
    const inn2 = s2.buildings.find((b) => b.id === T.inn);
    const g2 = s2.characters.find((c) => c.id === T.guest);
    check('kayıttan yapılar, stoklar ve handaki fıçılar döner', s2.buildings.find((b) => b.id === T.loom)?.type === 'loom' && s2.buildings.find((b) => b.id === T.brew)?.type === 'brewery' && s2.resources.cloth === 21 && s2.resources.sherbet === 13 && inn2.sherbet === 6);
    check('kayıttan testi, giysi, Keyifli Damak ve sayaçlar döner', CZ.countItem(g2, 'sherbetJug') === 2 && CZ.countItem(g2, 'garment') === 1 && g2.buffs.merryPalate === T.palate && s2.stats.sherbetServed === 17 && s2.stats.garments === 4 && s2.stats.goods.cloth === 55 && TS.townHappinessBonus(s2) >= 1);
    check('yüklenen kasabada tezgâh yeniden dokuyabilir', (() => { sim.give({ flax: 10, food: 300 }); game.scenes.current.structures.update({ hour: 10, gameMinutes: 0 }); return !s2.buildings.find((b) => b.id === T.loom).idle; })());
    // Bozuk değer
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.buildings.find((b) => b.id === T.inn).sherbet = 'çok';
    bad.buildings.find((b) => b.id === T.loom).sherbet = 9;
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('bozuk fıçı değeri 0\'a döner; han olmayan yapıda fıçı tutulmaz', st().buildings.find((b) => b.id === T.inn).sherbet === 0 && st().buildings.find((b) => b.id === T.loom).sherbet === 0);
    // Eski (v21) kayıt
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 21;
    delete old.resources.cloth;
    delete old.resources.sherbet;
    old.buildings = old.buildings.filter((b) => b.type !== 'loom' && b.type !== 'brewery');
    for (const b of old.buildings) delete b.sherbet;
    for (const c of old.characters) {
      c.inventory = (c.inventory ?? []).filter((x) => x.kind !== 'garment' && x.kind !== 'sherbetJug');
      if (c.buffs) delete c.buffs.merryPalate;
    }
    delete old.stats.sherbetServed;
    delete old.stats.garments;
    delete old.stats.jugsDrunk;
    delete old.stats.sherbetJugs;
    if (old.stats.goods) { delete old.stats.goods.cloth; delete old.stats.goods.sherbet; }
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    const s3 = st();
    check('v21 kaydı yüklenince Kumaş / Fıçı Şerbeti 0, hanlarda fıçı yok, yeni yapı ve eşya yok', s3.resources.cloth === 0 && s3.resources.sherbet === 0 && s3.buildings.filter((b) => b.type === 'inn').every((b) => b.sherbet === 0) && !s3.buildings.some((b) => b.type === 'loom' || b.type === 'brewery') && s3.characters.every((c) => !c.inventory.some((x) => x.kind === 'garment' || x.kind === 'sherbetJug')));
    check('v21 kaydında kumaşın refah katkısı 0, bir gün sorunsuz yaşar', RX.clothWelfare(s3) === 0 && (() => { const d = s3.time.day; hours(24); return game.state.time.day === d + 1; })());
    offs.forEach((off) => off());
  }

  return out;
});
results.push(...pageResults);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
