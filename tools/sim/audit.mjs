// Denetim testleri (15. aşama öncesi kod denetimi): kalıcı hataların bir daha dönmemesi için uçtan uca kontroller.
//
//   1. Olay aboneliği sızıntısı: Yükle / Yeni Harita sahneyi yeniden kurunca dinleyici sayısı sabit kalır
//   2. Kayıt / yükleme senaryoları: festivalin ortası, tüccar pazardayken, karar penceresi açıkken, harabe onarılırken,
//      fırtına yaklaşırken / gök gürültülü fırtınada, toplanma zili çalarken, (16. aşama) sefer yoldayken macera penceresi açıkken, (19. aşama) meydanda düğün kutlaması sürerken, (20. aşama) Çağ Kutlaması sürerken, (21. aşama) isyan ve yağma baskını sürerken, (22. aşama) tahsildar yolda / ferman sürerken / sakin köyü terk ederken, (23. aşama) yangın sürerken / haydut izi beklerken / hasarlı yapı ve yaralı sakin varken, (25.1) Kıdemli Bilge emekliyken, (25.2) çırak ustasının yanındayken, (25.3) yeni nesil huylu sakinler varken, (25.4) Aile Kütüğü ve devredilmiş ocak varken, (25.5) yadigâr taşıyan sakin ve Kuşak Şöleni varken. Her birinde kayıt -> yükleme -> yeniden
//      kayıt birebir aynıdır (durum kayması yok) ve olay yüklemeden sonra bir kez, doğru biçimde sonuçlanır
//   3. Kış ve kıtlık krizi: odunsuz, yiyeceksiz, böğürtlensiz bir kasaba kışı çökmeden geçirir (donma, hastalık),
//      stok gelince toparlanır; kimse takılmaz, ihtiyaçlar 0-100 arasında kalır
//   4. Referans bütünlüğü: sabit işçinin iş yeri yıkılır, şantiye iptal edilir, şenlik yeri yıkılır, tüccarın yoluna
//      yapı kurulur; kopuk referans kalmaz
//   5. Metin kutuları: kasaba ve sakin adı yazılırken WASD / B / H / X / F / J / O / I / Boşluk oyuna kaçmaz; ad kutusu açıkken
//      listeden başka sakin seçilince yazılan ad yanlış sakine gitmez
//   6. Ses: sessizde AudioContext askıya alınır (işlemci harcamaz), açılınca kazanç 0'dan yumuşakça yükselir;
//      sessiz başlanan oyunda bağlam hiç kurulmaz
//   7. Arayüz yerleşimi (17. aşama): geniş ekran, 1366x768, 1024x768, tablet ve telefon genişliğinde kartlar, çekmece,
//      yapı listesi, ortalanmış pencereler ve karar penceresi açıkken yatay kaydırma yok; üst çubuk, sakinler, kart, dock
//      birbirine binmez; kart çekmeceyle aynı hizada sağ altta, pencere üst çubukla dock arasında ortadadır
//   8. Arayüz etkileşimi (17. aşama): gerçek tıklama ve tuşlarla sakinler çekmecesi (▸ / sekme), dock sırası ve
//      ipuçları, pencereler (✕ / Esc / dışına tıklama, tek pencere, O / J / I / G), Ayarlar (kaydet, yeni harita onayı),
//      üst çubuk (hız, duraklatma), harita ipucu, listeden seçilen sakinin kartı
//
// Kullanım: node tools/sim/audit.mjs [--shots klasör]   (sunucu: python3 tools/serve.py)
import fs from 'fs';
import { openGame, createChecks, parseArgs, BASE_URL, capOutput } from './lib.mjs';

capOutput('audit');
import { installMonitor, monitorReport } from './monitor.mjs';

const { options } = parseArgs();
const shots = options.shots ?? null;
if (shots) fs.mkdirSync(shots, { recursive: true });
const { results, report } = createChecks();
const allErrors = [];
const push = (list) => results.push(...list);

// Sayfa içinde ortak yardımcılar: kayıt anlık görüntüsü ve derin fark
const PAGE_HELPERS = () => {
  const game = window.game;
  window.__audit = {
    snap: () => JSON.parse(JSON.stringify(game.scenes.current.saves.snapshot())),
    diff(a, b, p = '', out = []) {
      if (out.length > 12) return out;
      if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
        if (a !== b) out.push(`${p}: ${JSON.stringify(a)?.slice(0, 60)} -> ${JSON.stringify(b)?.slice(0, 60)}`);
        return out;
      }
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) window.__audit.diff(a[k], b[k], `${p}.${k}`, out);
      return out;
    },
    /** Kaydet, yükle, yeniden kaydet: farkları döndürür (boş = durum kayması yok). */
    roundtrip() {
      const before = window.__audit.snap();
      game.events.emit('ui:save');
      game.events.emit('ui:load');
      return window.__audit.diff(before, window.__audit.snap());
    },
  };
};

// =====================================================================================================================
// 1-2. Sızıntı ve kayıt / yükleme senaryoları
// =====================================================================================================================
{
  const { browser, page, errors } = await openGame({ seed: 23 });
  await page.evaluate(PAGE_HELPERS);
  const out = await page.evaluate(async () => {
    const game = window.game;
    const sim = window.sim;
    const A = window.__audit;
    const s = game.state;
    const out = [];
    const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail: String(detail) });
    const hours = (h) => sim.step(Math.round(h * 225));
    const scene = () => game.scenes.current;
    { const { ENGINES } = await import('/src/systems/Engines.js'); check('(29.4b) açılışta ENGINES şalterlerinin hepsi açık', Object.values(ENGINES).every((v) => v !== false), Object.keys(ENGINES).join(', ') || 'liste boş'); }
    const rich = () => sim.give({ wood: 400, stone: 400, food: 300, iron: 100, wool: 100, bread: 100, gold: 2000 });
    const count = () => [...game.events.listeners.values()].reduce((n, set) => n + set.size, 0);
    const counter = (name) => {
      const box = { n: 0 };
      box.off = game.events.on(name, () => box.n++);
      return box;
    };

    // --- 1. Dinleyici sızıntısı ---
    hours(2);
    const before = count();
    game.events.emit('ui:save');
    for (let i = 0; i < 3; i++) game.events.emit('ui:load');
    const afterLoads = count();
    check('Yükle sahneyi yeniden kurunca olay dinleyicisi sızmaz', afterLoads === before, `${before} -> ${afterLoads}`);
    const hourly = game.events.listeners.get('time:hour').size;
    game.events.emit('ui:load');
    check("saat başı dinleyicileri (hava dahil) yeniden kurulumda artmaz", game.events.listeners.get('time:hour').size === hourly, `${hourly}`);

    // Kurulum: zengin kasaba, pazar, han, havuz
    rich();
    for (const t of ['storage', 'market', 'inn', 'lumberHut', 'garden', 'cabin', 'cabin']) sim.place(t);
    hours(1);

    // --- 2a. Festivalin tam ortası ---
    {
      const ended = counter('festival:ended');
      if (s.events.festival.active) scene().townEvents.endFestival();
      Object.assign(s.seasonFestival, { day: s.time.day, theme: 'summer', stage: 'announced' });
      const started = scene().seasonFestivals.start();
      hours(0.75);
      const mid = { active: s.events.festival.active, theme: s.events.festival.theme, decor: s.seasonFestival.decor.length, attendees: s.seasonFestival.attendees.length, endsAt: s.events.festival.endsAt };
      const diff = A.roundtrip();
      check('festival ortasında kayıt -> yükleme durum kayması yok', started && diff.length === 0, diff.join(' | '));
      check(
        'yüklenen festival sürer: tema, süsleme, katılımcı, bitiş saati aynı',
        s.events.festival.active && s.events.festival.theme === mid.theme && s.seasonFestival.decor.length === mid.decor && s.seasonFestival.attendees.length >= mid.attendees && s.events.festival.endsAt === mid.endsAt,
        JSON.stringify(mid)
      );
      ended.n = 0;
      hours(Math.max(1, (mid.endsAt - s.totalMinutes) / 60 + 1));
      check('yüklenen festival bir kez ve doğru biter (Mevsim Coşkusu, süslemeler kalkar)', ended.n === 1 && !s.events.festival.active && s.seasonFestival.decor.length === 0 && (s.buffs.seasonCheer ?? 0) > s.totalMinutes, `bitiş ${ended.n}`);
      ended.off();
    }

    // --- 2b. Tüccar pazardayken ---
    {
      // Gün içine (09:00-18:00) al
      while (s.time.hour < 9 || s.time.hour >= 15) hours(1);
      const m = s.events.merchant;
      if (m.present) scene().townEvents.finishMerchantVisit();
      m.nextVisitDay = s.time.day;
      scene().townEvents.tryMerchantVisit();
      hours(1.5);
      const at = { x: m.x, y: m.y, stock: JSON.stringify(m.stock), name: m.name };
      const diff = A.roundtrip();
      const visitor = scene().world.visitors[0];
      check('tüccar pazardayken kayıt -> yükleme durum kayması yok', m.present && diff.length === 0, diff.join(' | '));
      check(
        'yüklenen tüccar yerinde, malları aynı, pazar açık',
        m.present && visitor && Math.hypot(visitor.x - at.x, visitor.y - at.y) < 1 && JSON.stringify(m.stock) === at.stock && m.name === at.name && scene().world.getCompleted('market')[0]?.open,
        `${visitor ? `${visitor.x.toFixed(0)},${visitor.y.toFixed(0)}` : 'yok'} / ${at.x.toFixed(0)},${at.y.toFixed(0)}`
      );
      hours(1);
      check('yüklenen tüccarla takas yapılabilir', scene().townEvents.canTrade(), m.leaving ? 'ayrılıyor' : '');
      const left = counter('merchant:left');
      while (s.events.merchant.present && s.time.hour < 23) hours(1);
      check('yüklenen tüccar akşam bir kez ayrılır', left.n === 1 && !s.events.merchant.present && scene().world.visitors.length === 0, `${left.n}`);
      left.off();
    }

    // --- 2c. Karar penceresi açıkken ---
    {
      const dil = () => scene().dilemmas;
      s.dilemma.history = {};
      s.dilemma.active = null;
      const opened = dil().maybeStart('refugees');
      const options = JSON.stringify(s.dilemma.active?.options ?? null);
      const diff = A.roundtrip();
      game.render(0); // pencerenin görünürlüğü çizimde güncellenir
      const modal = document.querySelector('.dilemma');
      check('karar penceresi açıkken kayıt -> yükleme durum kayması yok', opened && diff.length === 0, diff.join(' | '));
      check('yüklenince karar penceresi yeniden açılır ve oyun durur', s.dilemma.active?.id === 'refugees' && s.time.paused && modal && !modal.hidden && JSON.stringify(s.dilemma.active.options) === options);
      const resolved = counter('dilemma:resolved');
      game.events.emit('ui:chooseDilemma', { optionId: 'decline' });
      sim.step(5);
      game.render(0);
      check('yüklenen karar bir kez sonuçlanır, oyun sürer', resolved.n === 1 && !s.dilemma.active && !s.time.paused && modal.hidden, `${resolved.n}`);
      resolved.off();
    }

    // --- 2d. Harabe onarılırken ---
    {
      rich();
      const ruin = s.buildings.find((b) => b.ruined && !b.project);
      const res = ruin ? scene().construction.startProject(ruin) : { ok: false, reason: 'harabe yok' };
      hours(1.5);
      const progress = ruin?.project?.progress ?? 0;
      const diff = A.roundtrip();
      const again = s.buildings.find((b) => b.id === ruin?.id);
      const job = scene().jobs.jobs.find((j) => j.buildingId === ruin?.id);
      check('harabe onarılırken kayıt -> yükleme durum kayması yok', res.ok && diff.length === 0, `${res.reason ?? ''} ${diff.join(' | ')}`);
      check('yüklenen onarım kaldığı yerden sürer (proje ve iş emri)', again?.project && Math.abs(again.project.progress - progress) < 1e-6 && job && Math.abs(job.progress - progress) < 1e-6, `ilerleme ${progress.toFixed(1)}`);
      const restored = counter('ruin:restored');
      for (let i = 0; i < 96 && again?.project; i++) {
        rich();
        hours(1);
      }
      check('yüklenen harabe onarımı tamamlanır', again && !again.project && !again.ruined && restored.n === 1, `${again?.condition} · ${restored.n}`);
      restored.off();
    }

    // --- 2e. Fırtına yaklaşırken ve gök gürültülü fırtınada ---
    {
      rich();
      const dil = scene().dilemmas;
      s.dilemma.history = {};
      s.dilemma.storm = null;
      dil.maybeStart('storm');
      game.events.emit('ui:chooseDilemma', { optionId: 'risk' });
      s.dilemma.storm.at = s.totalMinutes + 90;
      scene().weather.force('thunderstorm');
      hours(0.25);
      const storm = JSON.stringify(s.dilemma.storm);
      const diff = A.roundtrip();
      check('fırtına sırasında kayıt -> yükleme durum kayması yok', diff.length === 0 && s.weather.type === 'thunderstorm', diff.join(' | '));
      check('yaklaşan fırtına kayıttan aynen döner', JSON.stringify(s.dilemma.storm) === storm);
      const struck = counter('storm:struck');
      hours(2);
      check('yüklenen fırtına bir kez vurur', struck.n === 1 && !s.dilemma.storm, `${struck.n}`);
      struck.off();
    }

    // --- 2f. Toplanma zili çalarken ---
    {
      const R = await import('/src/systems/RallySystem.js');
      s.rally = null;
      while (s.time.hour < 9 || s.time.hour >= 16) hours(1);
      const ok = R.rallyStatus(s).ok;
      if (ok) game.events.emit('ui:rallyBell');
      hours(0.25);
      const until = s.rally?.until;
      const diff = A.roundtrip();
      check('toplanma sırasında kayıt -> yükleme durum kayması yok', ok && diff.length === 0, diff.join(' | '));
      hours(0.25);
      const gathered = s.characters.filter((c) => c.task?.activity === 'rally').length;
      check('yüklenen toplanma sürer ve vaktinde biter', s.rally?.until === until && gathered > 0, `${gathered} sakin`);
    }

    // --- 2h. (19. aşama) Düğün kutlaması sürerken (meydanda konfeti, çift ortak eve taşınacak) ---
    {
      const RS = await import('/src/systems/RelationshipSystem.js');
      while (s.time.hour < 9 || s.time.hour >= 16) hours(1);
      const singles = s.characters.filter((c) => !c.isChild && !c.away && c.partnerId === null && c.lifeStage !== 'elder'); // (29.2b) bilgeler (65+) düğün senaryosuna girmez
      let pair = null;
      for (let i = 0; i < singles.length && !pair; i++) for (let j = i + 1; j < singles.length && !pair; j++) if (RS.canRomance(singles[i], singles[j])) pair = [singles[i], singles[j]];
      const fountain = scene().world.getCompleted('fountain')[0];
      if (pair && fountain) {
        const [a, b] = pair;
        a.partnerId = b.id;
        b.partnerId = a.id;
        a.partnerSince = b.partnerSince = s.totalMinutes - 3 * 1440;
        scene().relationships.marry(a, b, fountain, false);
        hours(0.2);
        const party = JSON.stringify(s.social.party);
        const diff = A.roundtrip();
        check('düğün kutlaması sırasında kayıt -> yükleme durum kayması yok', s.social.party && diff.length === 0, diff.join(' | '));
        check('yüklenen kutlama aynen döner (çift, davetliler, bitiş)', JSON.stringify(s.social.party) === party);
        const ended = counter('social:partyEnded');
        hours(1);
        const a2 = s.characters.find((c) => c.id === a.id);
        const b2 = s.characters.find((c) => c.id === b.id);
        check('yüklenen kutlama bir kez biter; çift aynı evde', ended.n === 1 && s.social.party === null && a2.homeId === b2.homeId, `${ended.n} · ${a2.homeId}/${b2.homeId}`);
        ended.off();
      } else check('kutlama için bekâr çift ve meydan havuzu var', false, `${singles.length} bekâr`);
    }

    // --- 2i. (20. aşama) Çağ Kutlaması sürerken (Altın Çağ başladı, meydanda kutlama, çan) ---
    {
      const GA = await import('/src/systems/GoldenAge.js');
      const { BUILDINGS } = await import('/src/data/buildings.js');
      let tower = GA.towerOf(s);
      if (!tower) {
        // Denetim kasabası küçük: kule seviye ve nüfus koşulu geçici olarak karşılanıp kurulur, aşamaları tamamlanmış sayılır
        const keep = BUILDINGS.wonder.requiresPopulation;
        BUILDINGS.wonder.requiresPopulation = 0;
        s.town.tier = Math.max(s.town.tier, 3);
        rich();
        sim.give({ wood: 500, stone: 600 });
        tower = sim.place('wonder', { maxRadius: 34 });
        BUILDINGS.wonder.requiresPopulation = keep;
        if (tower) {
          tower.wonderStage = 3;
          BUILDINGS.wonder.wonder.stages.forEach((st, i) => (s.chronicle.towerStages[i + 1] ??= { name: st.name, day: s.time.day, hour: s.time.hour, minute: 0 }));
        }
      }
      check('Çağ Kutlaması denemesi için Ulu Saat Kulesi var', tower);
      if (tower) {
        while (s.time.hour < 9 || s.time.hour >= 15) hours(1);
        scene().goldenAge.begin(tower);
        hours(0.3);
        const cel = JSON.stringify(s.goldenAge.celebration);
        const diff = A.roundtrip();
        check('Çağ Kutlaması sırasında kayıt -> yükleme durum kayması yok', s.goldenAge.celebration && diff.length === 0, diff.join(' | '));
        check('yüklenen Çağ Kutlaması aynen döner', JSON.stringify(s.goldenAge.celebration) === cel);
        const ended = counter('goldenAge:celebrationEnded');
        hours(2.2);
        check('yüklenen Çağ Kutlaması bir kez biter, Altın Çağ sürer', ended.n === 1 && s.goldenAge.celebration === null && GA.isGoldenAge(s), `${ended.n}`);
        ended.off();
      }
    }

    // --- 2j. (21. aşama) İsyan sürerken ve yağma baskını yoldayken (dilekçe açık, çantalar dolu) ---
    {
      rich();
      if (!scene().world.getCompleted('storage').length) sim.place('storage');
      while (s.time.hour < 9 || s.time.hour >= 15) hours(1);
      for (const c of s.characters) c.needs.fun = 10;
      s.trust.value = 12;
      s.town.welfare = 30;
      const pet = scene().petitions.create();
      const revolt = scene().trust.startRevolt();
      const storage = scene().world.getCompleted('storage')[0];
      const raid = revolt ? scene().trust.startRaid(storage.id) : null;
      hours(0.2);
      const before = JSON.stringify({ rioters: s.trust.revolt?.rioters, raids: s.trust.revolt?.raids.map((r) => [r.id, r.targetId, r.members]) });
      const diff = A.roundtrip();
      check('isyan ve yağma sürerken kayıt -> yükleme durum kayması yok', revolt && raid && pet && diff.length === 0, diff.join(' | '));
      check('yüklenen isyan, yağma baskını ve dilekçe aynen döner', JSON.stringify({ rioters: s.trust.revolt?.rioters, raids: s.trust.revolt?.raids.map((r) => [r.id, r.targetId, r.members]) }) === before && s.petitions.list.some((p) => p.id === pet?.id));
      const looted = counter('riot:looted');
      hours(3);
      const res = s.resources.food;
      check('yüklenen yağma baskını sonuçlanır (yağmacılar depoya varır)', looted.n >= 1 && s.trust.revolt?.raids.every((r) => r.id !== raid?.id), `${looted.n}`);
      looted.off();
      const ended = counter('revolt:ended');
      s.town.welfare = 70;
      s.trust.relief = {};
      s.trust.value = Math.max(s.trust.value, 25); // (29.3) yağma saatlerinde güvenin ne kadar eridiği geçmişe bağlıdır: yardım dağıtımının ölçüldüğü taban
      game.events.emit('ui:relief', { kind: 'gold' });
      game.events.emit('ui:relief', { kind: 'food' });
      hours(1.2);
      check('yatıştırılan isyan bir kez biter, sakinler işe döner', ended.n === 1 && !s.trust.revolt && s.characters.every((c) => c.task?.activity !== 'protest') && res >= 0, `${ended.n} güven %${Math.round(s.trust.value)}`);
      ended.off();
      s.petitions.list = [];
    }

    // --- 2k. (22. aşama) Tahsildar yoldayken, ferman sürerken, Ağır Vergi seçiliyken ve bir sakin köyü terk ederken ---
    {
      rich();
      s.town.tier = Math.max(s.town.tier, 3);
      while (s.time.hour < 9 || s.time.hour >= 15) hours(1);
      game.events.emit('ui:setTaxRate', { rate: 'heavy' });
      s.crown.nextLevyAt = s.totalMinutes + 1440;
      scene().crown.announceLevy();
      const decree = scene().crown.openDecree('shipyard');
      const leaver = s.characters.find((c) => !c.isChild && !c.away && !c.married && c.visible);
      scene().desertion.startLeaving([leaver]);
      hours(0.2);
      const before = JSON.stringify({ notice: s.crown.notice, decree: s.crown.decree, rate: s.tax.rate, leaving: leaver.emigrating });
      const diff = A.roundtrip();
      check('tahsildar yolda, ferman sürerken ve sakin köyü terk ederken kayıt -> yükleme durum kayması yok', decree && diff.length === 0, diff.join(' | '));
      const l2 = s.characters.find((c) => c.id === leaver.id);
      check('yüklenen tahsildar uyarısı, ferman, vergi kademesi ve yoldaki sakin aynen döner', JSON.stringify({ notice: s.crown.notice, decree: s.crown.decree, rate: s.tax.rate, leaving: l2?.emigrating }) === before);
      const left = counter('population:left');
      hours(10);
      check('yüklenen sakin harita kenarına varıp bir kez ayrılır', left.n === 1 && !s.characters.some((c) => c.id === leaver.id), `${left.n}`);
      left.off();
      const paid = counter('crown:levyPaid');
      hours(16);
      check('yüklenen Krallık Vergisi vakti gelince bir kez ödenir', paid.n === 1 && !s.crown.notice, `${paid.n}`);
      paid.off();
      game.events.emit('ui:deliverDecree');
      // (28.1) Vergi Fermanı: Ağır Vergi seçileli 26 saat geçti; kayıttan dönen kilit hâlâ sürer, kademe değişmez
      const lockLeft = s.tax.lockedUntil - s.totalMinutes;
      game.events.emit('ui:setTaxRate', { rate: 'exempt' });
      check('(28.1) kilitliyken (yüklemeden sonra da) vergi kademesi değişmez', lockLeft > 0 && s.tax.rate === 'heavy', `kilit ${Math.round(lockLeft)} dk kaldı, kademe ${s.tax.rate}`);
      s.tax.lockedUntil = 0;
      game.events.emit('ui:setTaxRate', { rate: 'standard' });
      check('(28.1) kilit dolunca vergi kademesi yeniden değişir ve 3 gün kilitlenir', s.tax.rate === 'standard' && s.tax.lockedUntil - s.totalMinutes === 3 * 1440);
      check('yüklenen ferman teslim edilir', !s.crown.decree && s.crown.delivered >= 1);
    }

    // --- 2k2. (28.2) Başusta kayıt -> yükleme: bayrak, meslek, sayaç ve hammaddesiz üretim sayacı aynen döner; Başusta yalnızca çıraklık mezunudur ---
    {
      const gm = s.characters.find((c) => !c.isChild && !c.role && c.visible);
      gm.isGrandmaster = true;
      gm.grandmasterProfession = 'mill';
      gm.grandmasterBatches = 7;
      s.apprenticeship.grandmasters = (s.apprenticeship.grandmasters ?? 0) + 1;
      const diff = A.roundtrip();
      check('(28.2) Başusta kayıt -> yükleme durum kayması yok', diff.length === 0, diff.join(' | '));
      const g2 = s.characters.find((c) => c.id === gm.id);
      check('(28.2) yüklenen Başusta bayrağı, mesleği ve üretim sayacı aynen döner', g2?.isGrandmaster === true && g2.grandmasterProfession === 'mill' && g2.grandmasterBatches === 7);
      const others = s.characters.filter((c) => c.id !== gm.id && c.isGrandmaster);
      check('(28.2) çıraklıktan mezun olmayan hiç kimse Başusta değil (tek Başusta test bayrağı)', others.length === 0, `${others.length}`);
      g2.isGrandmaster = false;
      g2.grandmasterProfession = null;
      g2.grandmasterBatches = 0;
    }

    // --- 2k3. (28.3) Saygın Büyük ve vefat: kayıt -> yükleme durum kayması yok; ölenin eş / iş / çırak / ev / ilişki referansı kalmaz ---
    {
      const lc = scene().lifecycle;
      const pool = s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.emigrating && c.lifeStage !== 'elder').sort((a, b) => a.id - b.id);
      const v = pool.find((c) => c.partnerId === null);
      const d = pool.find((c) => c !== v && c.partnerId !== null);
      const mate = s.characters.find((c) => c.id === d.partnerId);
      const ward = pool.find((c) => c !== v && c !== d && c !== mate && !c.apprenticeship);
      const workshop = s.buildings.find((b) => b.type === 'workshop' && b.functional);
      for (const c of [v, d]) { c.lifeStage = 'elder'; c.age = 72; c.ageInDays = 72 * (await import('/src/data/lifeStages.js')).AGING.daysPerAge; c.children = []; c.inventory = (c.inventory ?? []).filter((x) => !x.heirloom); }
      const homeV = v.homeId;
      const venerableNow = lc.makeVenerable(v);
      if (workshop) { ward.lifeStage = 'youth'; ward.apprenticeship = { masterId: d.id, profession: 'workshop', buildingId: workshop.id, progress: 10, since: 0, crafted: 0 }; }
      const hadWork = d.workplaceId;
      const diedNow = lc.die(d, { cause: 'age' });
      const dangling = s.characters.filter((c) => c.partnerId === d.id || c.parentIds.includes(d.id) || c.apprenticeship?.masterId === d.id).length + s.buildings.filter((b) => b.workerIds.has(d.id) || b.occupants.has(d.id)).length;
      check('(28.3) vefat eden sakin arkada eş, çırak (usta), iş ya da yapı referansı bırakmaz', venerableNow && diedNow && dangling === 0 && !s.characters.includes(d) && mate.married === false && (!workshop || ward.apprenticeship?.masterId === null), `${dangling}`);
      const diff = A.roundtrip();
      check('(28.3) Saygın Büyük ve vefat sonrası kayıt -> yükleme durum kayması yok', diff.length === 0, diff.join(' | '));
      const v2 = s.characters.find((c) => c.id === v.id);
      check('(28.3) yüklenen Saygın Büyük yataksız kalır (yükleme ona yatak bulmaz), ömrü korunur, ölen geri gelmez', v2?.isVenerable === true && v2.homeId === null && v2.lifespan === v.lifespan && !s.characters.some((c) => c.id === d.id));
      const ids2 = new Set(s.characters.map((c) => c.id));
      const refs = s.characters.filter((c) => (c.partnerId !== null && !ids2.has(c.partnerId)) || c.parentIds.some((x) => !ids2.has(x))).length;
      check('(28.3) yüklemeden sonra kopuk eş / ebeveyn referansı yok', refs === 0, `${refs}`);
      sim.step(30);
      check('(28.3) Saygın Büyük adım atınca da yatak aramaz ve evsiz kalsa da takılmaz', s.characters.some((c) => c.id === v.id) && s.characters.find((c) => c.id === v.id).homeId === null);
      // v2 Saygın Büyük olarak kalır (yataksızlık kayıt -> yüklemede de kararlıdır); ana kasaba akışını bozmaması için emekli sayılır
      const w2 = s.characters.find((c) => c.id === ward.id);
      if (w2) { w2.apprenticeship = null; w2.lifeStage = 'adult'; } // geçici çırak: sonraki çıraklık bölümlerine karışmasın
    }

    // --- 2k4. (28.4) Vadi Karakteri, Kasaba Doktrini ve geç oyun beklentisi: kayıt -> yükleme durum kayması yok; kilitli yol yüklemeden sonra da kilitli ---
    {
      const valley0 = s.valley;
      s.doctrine = { chosen: 'commerce', day: s.time.day };
      s.civic.tradeCharter = true;
      s.town.tier = 4;
      const welfare0 = Math.round(scene().townHappiness?.() ?? 0);
      const diff = A.roundtrip();
      check('(28.4) vadi, doktrin ve Gelişmiş Şehir (geç oyun) kayıt -> yükleme durum kayması yok', diff.length === 0, diff.join(' | '));
      check('(28.4) yüklenen vadi ve doktrin aynen döner (vadi tohumdan, doktrin seçili, Ticaret Beratı)', s.valley === valley0 && s.valley === (await import('/src/systems/Valley.js')).valleyFor(s.seed) && s.doctrine.chosen === 'commerce' && s.civic.tradeCharter === true);
      const RSX = await import('/src/systems/ResearchSystem.js');
      const CVX = await import('/src/systems/CivicSystem.js');
      const lockedAfter = ['gears', 'herbalism', 'cropRotation'].every((id) => !RSX.researchStatus(s, id, true).ok && RSX.researchStatus(s, id, true).locked) && !CVX.civicStatus(s, 'craftGuild', true).ok;
      check('(28.4) doktrin kilidi yüklemeden sonra da sürer (öteki doktrinlerin araştırma ve fermanları kapalı)', lockedAfter);
      const LGX = await import('/src/systems/LateGame.js');
      check('(28.4) yüklemeden sonra geç oyun beklentisi hâlâ açık (seviye 4): azalma x1,3', LGX.lateGameActive(s) && LGX.lateDecayMultiplier(s) === 1.3);
      s.doctrine = { chosen: null, day: null };
      s.civic.tradeCharter = false;
      s.town.tier = Math.min(s.town.tier, 3);
    }

    // --- 2l. (23. aşama) Yangın sürerken, haydut izi beklerken, hasarlı yapı ve yaralı sakin varken ---
    {
      rich();
      s.crisis.difficulty = 'huzurlu'; // doğal krizler karışmasın; testler fonksiyonları doğrudan çağırır
      s.town.tier = Math.max(s.town.tier, 3);
      s.petitions.list = [];
      s.crown.decree = null;
      s.crown.nextDecreeAt = s.totalMinutes + 1e6;
      s.crown.notice = null;
      s.crown.nextLevyAt = s.totalMinutes + 1e6;
      if (s.trust.revolt) scene().trust.endRevolt();
      s.trust.value = 70;
      for (const b of s.buildings) {
        b.isBurning = false;
        b.isDamaged = false;
      }
      for (const c of s.characters) c.isInjured = false;
      s.crisis.raid = null;
      for (let i = 0; i < 4 && s.dilemma.active; i++) sim.step(1900); // açık karar penceresi varsa varsayılan seçenek uygulansın
      while (s.time.hour < 9 || s.time.hour >= 12) hours(1);
      const pickFire = () => s.buildings.find((b) => b.functional && ['workshop', 'mill', 'lumberHut', 'quarry', 'garden'].includes(b.type) && !b.damaged && !b.isBurning);
      const fireB = pickFire();
      scene().crisis.startFire(fireB);
      const hurtOne = s.characters.find((c) => !c.isChild && !c.role && !c.away);
      scene().crisis.injure(hurtOne, 'fire');
      const wreck = s.buildings.find((b) => b.functional && ['quarry', 'garden', 'market', 'lumberHut', 'sheepFarm'].includes(b.type) && b !== fireB && !b.damaged && !b.isBurning);
      scene().crisis.damage(wreck, 'raid');
      const raid = scene().crisis.warnRaid();
      hours(0.2);
      const progressBefore = fireB.fireProgress;
      const diff = A.roundtrip();
      check('yangın sürerken, haydut izi beklerken, hasarlı yapı ve yaralı sakin varken kayıt -> yükleme durum kayması yok', Boolean(raid) && diff.length === 0, diff.join(' | '));
      const f2 = s.buildings.find((b) => b.id === fireB.id);
      const w2 = s.buildings.find((b) => b.id === wreck.id);
      const h2 = s.characters.find((c) => c.id === hurtOne.id);
      check('yüklenen yangın, hasarlı yapı, yaralı sakin ve haydut baskını aynen döner', f2.isBurning && Math.abs(f2.fireProgress - progressBefore) < 1e-6 && w2.isDamaged && w2.damageKind === 'raid' && h2.isInjured && JSON.stringify(s.crisis.raid) === JSON.stringify(raid), `${f2.fireProgress}/${progressBefore}`);
      check('yükleme sonrası aktif kriz kayıtlı olduğundan doğal kriz koruması (24 saat) kurulmaz', scene().crisis.graceUntil === null);
      const outs = counter('crisis:fireOut');
      const burnt = counter('crisis:burnedDown');
      for (let i = 0; i < 28 && f2.isBurning; i++) {
        sim.step(56);
        if (s.dilemma.active) sim.step(1900);
      }
      check('yüklenen yangın tam bir kez sonuçlanır (söner ya da yanıp hasara geçer), sayaç tutarlı', outs.n + burnt.n === 1 && !f2.isBurning && s.crisis.extinguished + s.crisis.burned >= 1, `${outs.n}/${burnt.n} yanıyor=${f2.isBurning} %${Math.round(f2.fireProgress)} gün ${s.time.day} ${s.time.hour}:00 duraklı=${s.time.paused} karar=${s.dilemma.active?.id ?? '-'}`);
      outs.off();
      burnt.off();
      // Haydut baskını yüklemeden sonra varışta bir kez sonuçlanır
      const resolved = counter('crisis:raidResolved');
      s.crisis.raid.arriveAt = s.totalMinutes + 60;
      hours(3);
      check('yüklenen haydut baskını varışta tam bir kez sonuçlanır (savunma yetiyorsa püskürtülür)', resolved.n === 1 && !s.crisis.raid, `${resolved.n}`);
      resolved.off();
      const repaired = counter('building:mended');
      hours(40);
      check('hasarlı yapılar yüklemeden sonra (ustalar ya da bekleme sonrası kaynakla) onarılır; kopuk iş emri kalmaz', repaired.n >= 1 && !w2.damaged && !w2.project, `${repaired.n}`);
      repaired.off();
      check('yaralı sakin yüklemeden sonra bir kez iyileşir (şifacıda ya da kendiliğinden)', !h2.isInjured);
      for (const b of s.buildings) {
        b.isBurning = false;
        b.isDamaged = false;
      }
      for (const c of s.characters) c.isInjured = false;
      s.crisis.raid = null;
    }

    // --- 2m. (25.1) Kıdemli Bilge emekliyken ve nasihat verirken, bir Genç 21. doğum gününün eşiğindeyken ---
    {
      const Y = (await import('/src/data/lifeStages.js')).AGING.daysPerAge; // (30.4a) bir yaş kaç gün
      const adults = s.characters.filter((c) => !c.isChild && !c.role && !c.away && c.lifeStage !== 'elder').sort((a, b) => a.id - b.id);
      const sage = adults[0];
      sage.ageInDays = 65 * Y - 1; // (29.2b) Kıdemli Bilge yaşı 65
      sage.age = 64;
      const youth = adults[1];
      youth.ageInDays = 21 * Y - 1;
      youth.age = 20;
      youth.lifeStage = 'youth';
      youth.profile = youth.buildProfile();
      const promoted = counter('lifeStage:changed');
      scene().lifeStages.ageEveryone();
      s.lifeStages.adviceMinutes += 5;
      const diff = A.roundtrip();
      const sage2 = s.characters.find((c) => c.id === sage.id);
      const youth2 = s.characters.find((c) => c.id === youth.id);
      check('Kıdemli Bilge emekliyken kayıt -> yükleme durum kayması yok (evre, gün cinsinden yaş, sayaçlar)', diff.length === 0 && sage2.lifeStage === 'elder' && sage2.retired && youth2.lifeStage === 'adult' && promoted.n === 2, diff.join(' | ') + ` · ${promoted.n} geçiş`);
      const again = counter('lifeStage:changed');
      const day0 = s.time.day;
      hours(30);
      const turns = s.time.day - day0; // (29.3) 30 saat, başlangıç saatine göre bir ya da iki gün dönümü geçer
      check('yüklemeden sonra bilge yeniden kutlanmaz, emekli kalır, yaşlar gün dönümünde bir kez ilerler', again.n === 0 && sage2.retired && turns >= 1 && sage2.ageInDays === 65 * Y + turns && s.characters.includes(sage2), `${again.n} geçiş · ${sage2.ageInDays} · ${turns} gün dönümü`);
      check('emekli bilge işe gitmez (yükleme sonrası 30 saat)', !sage2.task?.jobId && !sage2.task?.workBuildingId);
      promoted.off();
      again.off();
    }

    // --- 2n. (25.2) Çırak ustasının yanında taburede otururken, Gururlu Usta etkinken ve kapı açıkken ---
    {
      const Y = (await import('/src/data/lifeStages.js')).AGING.daysPerAge; // (30.4a) bir yaş kaç gün
      sim.give({ wood: 300, stone: 200, food: 300 });
      const hut = sim.place('lumberHut');
      const people = s.characters.filter((c) => !c.isChild && !c.role && !c.away && c.lifeStage === 'adult' && !c.emigrating).sort((a, b) => a.id - b.id);
      const master = people[0];
      const pupil = people[people.length - 1];
      pupil.ageInDays = 19 * Y;
      pupil.age = 19;
      pupil.agedDays = 0;
      pupil.lifeStage = 'youth';
      pupil.profile = pupil.buildProfile();
      pupil.workplaceId = null;
      master.workplaceId = hut.id;
      master.skills.woodcutting = 1600;
      game.events.emit('ui:toggleApprenticeDoor', { buildingId: hut.id });
      game.events.emit('ui:enrollApprentice', { characterId: pupil.id, buildingId: hut.id });
      pupil.apprenticeship.progress = 48;
      while (s.time.hour < 9 || s.time.hour >= 14) hours(1);
      let guard = 0;
      while (pupil.task?.activity !== 'apprentice' && guard++ < 12) hours(0.5);
      const sitting = pupil.task?.activity === 'apprentice';
      const diff = A.roundtrip();
      const p2 = s.characters.find((c) => c.id === pupil.id);
      const m2 = s.characters.find((c) => c.id === master.id);
      check('çırak ustasının yanındayken kayıt -> yükleme durum kayması yok (çıraklık, kapı, Gururlu Usta, sayaçlar)', diff.length === 0 && p2.apprenticeship?.masterId === m2.id && s.apprenticeship.open.includes(hut.id), diff.join(' | ') + ` · tabure ${sitting}`);
      const p0 = p2.apprenticeship.progress;
      hours(30);
      check('yüklemeden sonra çıraklık sürer (ilerleme artar, veri geçerli) ve kimse takılmaz', p2.apprenticeship && p2.apprenticeship.progress > p0 && p2.apprenticeship.progress <= 100, `%${p0.toFixed(1)} -> %${p2.apprenticeship?.progress.toFixed(1)}`);
      p2.apprenticeship = null;
      s.apprenticeship.open = [];
    }

    // --- 2o. (25.3) Yeni nesil huylu sakinler (Şenlik Neşesi dans ederken, Bilge Düşünür), mizacın kaynağı ve sayaçlar ---
    {
      const adults = s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.emigrating).sort((a, b) => a.id - b.id);
      const [f, p] = adults;
      const before = [f.quirk, p.quirk];
      f.quirk = 'festive';
      f.quirkOrigin = { kind: 'family', fromId: p.id, fromName: p.name, day: s.time.day };
      p.quirk = 'philosopher';
      p.quirkOrigin = { kind: 'self', fromId: null, fromName: null, day: s.time.day };
      s.temperament.developed += 2;
      s.temperament.family += 1;
      s.temperament.self += 1;
      hours(2);
      const diff = A.roundtrip();
      const f2 = s.characters.find((c) => c.id === f.id);
      check('yeni nesil huylu sakinler varken kayıt -> yükleme durum kayması yok (huy, kaynağı, mizaç sayaçları)', diff.length === 0 && f2.quirk === 'festive' && f2.quirkOrigin?.kind === 'family', diff.join(' | '));
      hours(12);
      check('yüklemeden sonra yeni nesil huylar korunur, yeniden dağıtılmaz', s.characters.find((c) => c.id === f.id).quirk === 'festive' && s.characters.find((c) => c.id === p.id).quirk === 'philosopher');
      const f3 = s.characters.find((c) => c.id === f.id);
      const p3 = s.characters.find((c) => c.id === p.id);
      [f3.quirk, p3.quirk] = before;
      f3.quirkOrigin = p3.quirkOrigin = null;
    }

    // --- 2p. (25.4) Aile Kütüğü: 2. kuşak sakin, devredilmiş ocak reisi ve Tarihçe'deki ilk 2. kuşak düğünü varken ---
    {
      const adults = s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.emigrating && c.homeId !== null).sort((a, b) => a.id - b.id);
      const [p1, kid] = adults;
      const keep = { g: kid.generation, parents: kid.parents, children: p1.children };
      kid.generation = p1.generation + 1;
      kid.parents = [p1.id];
      if (!p1.children.includes(kid.id)) p1.children = [...p1.children, kid.id];
      s.lineage.heads[p1.homeId] = kid.id;
      s.chronicle.firstGen2Couple = { a: kid.name, b: p1.name, ids: [kid.id, p1.id], day: s.time.day, hour: 10, minute: 0 };
      hours(1);
      const diff = A.roundtrip();
      const k2 = s.characters.find((c) => c.id === kid.id);
      check('Aile Kütüğü varken kayıt -> yükleme durum kayması yok (kuşak, doğum ebeveynleri, ocak, çocuklar, reis, Tarihçe)', diff.length === 0 && k2.generation === s.characters.find((c) => c.id === p1.id).generation + 1 && k2.parents.includes(p1.id) && s.lineage.heads[p1.homeId] === kid.id && s.chronicle.firstGen2Couple?.a === kid.name, diff.join(' | '));
      const k3 = s.characters.find((c) => c.id === kid.id);
      const p3 = s.characters.find((c) => c.id === p1.id);
      k3.generation = keep.g;
      k3.parents = keep.parents;
      p3.children = keep.children;
      delete s.lineage.heads[p1.homeId];
      s.chronicle.firstGen2Couple = null;
    }

    // --- 2r. (25.5) Yadigâr taşıyan sakin, çırak geçmişi, arşiv, Tarihçe'deki ilk devir ve süren Kuşak Şöleni varken ---
    {
      const adults = s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.emigrating).sort((a, b) => a.id - b.id);
      const [h, m] = adults;
      const keepInv = h.inventory;
      h.inventory = [...(h.inventory ?? []).slice(0, 2), { kind: 'heirloomCompass', qty: 1, name: 'Eski Seyyah Pusulası', heirloom: { ownerId: m.id, ownerName: m.name, story: `${m.name} Usta'nın 40 yıllık emektar pusulası. Kuşaktan kuşağa aktarılır.`, since: s.time.day, chain: [m.name, h.name] } }];
      const keepM = m.mentees;
      m.mentees = [{ id: h.id, progress: 88 }];
      s.heirloom.transfers += 1;
      s.heirloom.archive.push({ kind: 'heirloomJournal', name: 'Bilge Günlüğü', story: 'x', day: s.time.day });
      s.heirloom.feast = { x: 100, y: 100, startedAt: s.totalMinutes, until: s.totalMinutes + 60 };
      s.chronicle.firstHeirloom = { elder: m.name, heir: h.name, item: 'Eski Seyyah Pusulası', ids: [m.id, h.id], day: s.time.day, hour: 18, minute: 0 };
      const diff = A.roundtrip();
      const h2 = s.characters.find((c) => c.id === h.id);
      const slot = (h2.inventory ?? []).find((x) => x.kind === 'heirloomCompass');
      check('yadigâr varken kayıt -> yükleme durum kayması yok (hikâye, zincir, çırak geçmişi, arşiv, şölen, Tarihçe)', diff.length === 0 && slot?.heirloom.chain.join() === `${m.name},${h.name}` && s.heirloom.feast && s.chronicle.firstHeirloom?.heir === h.name, diff.join(' | '));
      hours(12);
      check('yüklemeden sonra yadigâr çantada kalır (satılmaz, yenmez, öşre gitmez)', (s.characters.find((c) => c.id === h.id).inventory ?? []).some((x) => x.kind === 'heirloomCompass'));
      const h3 = s.characters.find((c) => c.id === h.id);
      h3.inventory = (h3.inventory ?? []).filter((x) => x.kind !== 'heirloomCompass');
      s.characters.find((c) => c.id === m.id).mentees = keepM ?? [];
      s.heirloom.archive = [];
      s.heirloom.feast = null;
      s.chronicle.firstHeirloom = null;
      void keepInv;
    }

    // --- 2s. (26.1) Mevsimlik panayırın şenlik saatinde (18:00 - 22:00), Tarihçe'deki ilk panayırla ---
    {
      const t = s.time;
      const keepT = { day: t.day, hour: t.hour, minute: t.minute };
      const keepGA = s.goldenAge.since;
      const keepFair = s.chronicle.firstFair;
      const keepStat = s.stats.fairs;
      if (!s.buildings.some((b) => b.type === 'fountain' && b.functional)) sim.place('fountain', { instant: true });
      s.goldenAge.since = s.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
      s.events.festival.active = false;
      s.seasonFestival.stage = null;
      s.chronicle.firstFair = null; // bu senaryonun kendi ilk panayırı
      Object.assign(t, { day: 4 * Math.ceil((t.day + 1) / 4), hour: 5, minute: 58 });
      sim.step(10);
      while (t.hour < 19) sim.step(30);
      A.roundtrip(); // gün atlamasının sabah özeti (StatsSystem) yükleme anında bir kez oluşur; ölçüm bundan sonra
      const live = s.currentFestival;
      const tBefore = `${t.day} ${t.hour}:${t.minute}`;
      const diff = A.roundtrip();
      check('panayırın şenlik saatinde kayıt -> yükleme durum kayması yok (currentFestival, şenlik kuralları, Tarihçe)', live?.phase === 'party' && s.currentFestival?.phase === 'party' && s.currentFestival.type === live.type && s.events.festival.active && diff.length === 0, `${JSON.stringify(live)} ${tBefore} -> ${t.day} ${t.hour}:${t.minute} ${diff.join(' | ')}`);
      hours(5);
      check('yüklemeden sonra panayır 22:00\'de kapanır: currentFestival null, şenlik bitti, ilk panayır Tarihçe\'de', s.currentFestival === null && !s.events.festival.active && s.chronicle.firstFair?.type === live?.type, `${s.time.hour}:00 ${JSON.stringify(s.currentFestival)}`);
      s.goldenAge.since = keepGA;
      s.chronicle.firstFair = keepFair;
      s.stats.fairs = keepStat;
      void keepT;
    }

    // --- 2t. (26.2) Büyük Ziyafet Sofrası kuruluyken (şenlik saatinde, ikramlar verilmişken) ---
    {
      const t = s.time;
      const keepGA = s.goldenAge.since;
      const keepStat = [s.stats.feasts, s.stats.feastServings];
      if (!s.buildings.some((b) => b.type === 'fountain' && b.functional)) sim.place('fountain', { instant: true });
      s.goldenAge.since = s.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
      s.events.festival.active = false;
      s.seasonFestival.stage = null;
      s.currentFeast = null;
      s.currentFestival = null;
      s.pantry.credit = 0;
      Object.assign(s.resources, { food: 400, bread: 30, sherbet: 4, cloth: 2 });
      Object.assign(t, { day: 4 * Math.ceil((t.day + 1) / 4), hour: 5, minute: 58 });
      sim.step(10);
      while (t.hour < 19) sim.step(30);
      { const WTa = await import('/src/systems/Wants.js'); for (const c of s.characters) { c.wants.length = 0; c.fears.length = 0; WTa.recomputeDrive(c); } } // (29.3) arzu kancaları (han / ziyafet) kiler ölçümünü karıştırmasın
      A.roundtrip();
      const live = JSON.stringify(s.currentFeast);
      const diff = A.roundtrip();
      check('sofra kuruluyken kayıt -> yükleme durum kayması yok (currentFeast, ikram sayacı, bonuslar)', s.currentFeast?.tier === 'rich' && s.currentFeast.served > 0 && JSON.stringify(s.currentFeast) === live && diff.length === 0, `${live} ${diff.join(' | ')}`);
      const food0 = s.resources.food;
      const spoil0 = s.granary.spoiled.food ?? 0; // (30.4a) silosuz kasabada yağmurda / kışın bozulan mahsul kiler ölçümünden ayrılır
      hours(5);
      check('yüklemeden sonra sofra 22:00\'de toplanır, yenmeyen erzak kilere döner, besin kişi başı 3\'ün üstünde', s.currentFeast === null && s.resources.food + ((s.granary.spoiled.food ?? 0) - spoil0) >= food0 && s.stats.feasts === (keepStat[0] ?? 0) + 1 && Math.floor(s.resources.food + s.resources.bread * 2.5) >= s.characters.length * 3, `${s.resources.food} ${food0}`);
      s.goldenAge.since = keepGA;
      s.stats.feasts = keepStat[0];
      s.stats.feastServings = keepStat[1];
    }

    // --- 2u. (26.3) Gezgin konuk haritadayken (masal anlatırken, dinlenirken) ---
    {
      const t = s.time;
      const keepGA = s.goldenAge.since;
      const keepBook = JSON.stringify(s.guestBook);
      s.goldenAge.since = s.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
      s.activeGuest = null;
      sim.scene().world.guests = [];
      s.guestBook.nextDay = t.day + 1;
      Object.assign(t, { day: t.day + 1, hour: 8, minute: 58 });
      sim.step(10);
      while (t.hour < 11) sim.step(30);
      A.roundtrip();
      const live = JSON.stringify(s.activeGuest);
      const pop = s.characters.length;
      const diff = A.roundtrip();
      check('gezgin konuk haritadayken kayıt -> yükleme durum kayması yok (activeGuest, konuk defteri); konuk nüfusa sayılmaz', s.activeGuest !== null && JSON.stringify(s.activeGuest) === live && sim.scene().world.guests.length === 1 && s.characters.length === pop && !s.characters.some((c) => c.isGuest) && diff.length === 0, `${live} ${diff.join(' | ')}`);
      hours(60);
      check('yüklemeden sonra konuk süresini doldurup ayrılır (activeGuest null, world.guests boş), sakin listesine hiç karışmaz', s.activeGuest === null && sim.scene().world.guests.length === 0 && !s.characters.some((c) => c.isGuest), JSON.stringify(s.activeGuest));
      s.goldenAge.since = keepGA;
      s.guestBook = JSON.parse(keepBook);
    }

    // --- 2v. (27.1) Şenlik ortasında ikramlar verilmişken: çift ikram yok, negatif iade yok, katılımcılar korunur ---
    {
      const t = s.time;
      const keepGA = s.goldenAge.since;
      const keepStat = [s.stats.feasts, s.stats.feastServings, s.stats.fairs];
      const keepFair = s.chronicle.firstFair;
      if (!s.buildings.some((b) => b.type === 'fountain' && b.functional)) sim.place('fountain', { instant: true });
      s.goldenAge.since = s.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
      s.events.festival.active = false;
      s.seasonFestival.stage = null;
      s.currentFeast = null;
      s.currentFestival = null;
      s.pantry.credit = 0;
      Object.assign(s.resources, { food: 400, bread: 30, sherbet: 4, cloth: 2 });
      Object.assign(t, { day: 4 * Math.ceil((t.day + 1) / 4), hour: 5, minute: 58 });
      sim.step(10);
      while (t.hour < 19) sim.step(30);
      { const WTa = await import('/src/systems/Wants.js'); for (const c of s.characters) { c.wants.length = 0; c.fears.length = 0; WTa.recomputeDrive(c); } } // (29.3) aynı gerekçe
      A.roundtrip();
      const eaten = [...(s.currentFeast?.eatenIds ?? [])];
      const dancers = [...(s.currentFestival?.participants ?? [])];
      const diff = A.roundtrip();
      const after = sim.scene().fairSystem.attendees;
      check('27.1: şenlikte kayıt -> yükleme: ikram alanlar (eatenIds) ve dans edenler (participants) korunur, durum kayması yok', eaten.length > 0 && eaten.length === s.currentFeast.served && JSON.stringify(s.currentFeast.eatenIds) === JSON.stringify(eaten) && dancers.length > 0 && dancers.every((id) => after.has(id)) && diff.length === 0, `${eaten.length} ${dancers.length} ${diff.join(' | ')}`);
      // Yüklemeden sonra 22:00'ye kadar: hiçbir sakin iki kez yemez, sayaç kapasiteyi aşmaz, kiler eksilmez
      let peak = 0;
      let dup = false;
      let feastEnd = null;
      let fairEnd = null;
      const off1 = game.events.on('feast:ended', (p) => (feastEnd = p));
      const off2 = game.events.on('fair:ended', (p) => (fairEnd = p));
      const food0 = s.resources.food;
      const spoil0 = s.granary.spoiled.food ?? 0; // (30.4a) bozulan mahsul ayrılır
      while (s.currentFeast && t.hour < 23) {
        sim.step(30);
        const f = s.currentFeast;
        if (f) { peak = Math.max(peak, f.served - f.servings); if (new Set(f.eatenIds).size !== f.eatenIds.length || f.eatenIds.length !== f.served) dup = true; }
      }
      off1(); off2();
      check('27.1: yüklemeden sonra kimse ikinci kez ikram almaz (served <= servings); 22:00 iadesi negatif değil', !dup && peak <= 0 && feastEnd && feastEnd.refund.food >= 0 && feastEnd.refund.bread >= 0 && s.resources.food + ((s.granary.spoiled.food ?? 0) - spoil0) >= food0, `${peak} ${JSON.stringify(feastEnd?.refund)}`);
      check('27.1: kapanış sayımı yüklemeden önce dans edenleri de içerir', fairEnd && dancers.every((id) => fairEnd.attendees.includes(id)), `${fairEnd?.attendees.length}`);
      s.goldenAge.since = keepGA;
      [s.stats.feasts, s.stats.feastServings, s.stats.fairs] = keepStat;
      s.chronicle.firstFair = keepFair;
    }

    // --- 2w. (27.1) Gezgin konuk ayrılış günü çıkışa yürürken ---
    {
      const t = s.time;
      const keepGA = s.goldenAge.since;
      const keepBook = JSON.stringify(s.guestBook);
      s.goldenAge.since = s.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
      s.activeGuest = null;
      sim.scene().world.guests = [];
      s.guestBook.nextDay = t.day + 1;
      Object.assign(t, { day: t.day + 1, hour: 8, minute: 58 });
      sim.step(10);
      while (t.hour < 14) sim.step(30); // konuk meydana / pazara yürüsün
      const g0 = s.activeGuest;
      if (g0) g0.departureDay = t.day + 1;
      Object.assign(t, { day: t.day + 1, hour: 8, minute: 59 });
      let moving = false;
      for (let i = 0; i < 40 && !(s.activeGuest?.leaving && sim.scene().world.guests[0]?.isMoving); i++) sim.step(5);
      moving = Boolean(s.activeGuest?.leaving && sim.scene().world.guests[0]?.isMoving);
      sim.step(20);
      A.roundtrip(); // gün atlamasının sabah özeti (StatsSystem) yükleme anında bir kez oluşur; ölçüm bundan sonra (bu da ayrılırken bir yüklemedir)
      const live = JSON.stringify(s.activeGuest);
      const diff = A.roundtrip();
      const back = sim.scene().world.guests[0];
      sim.step(2);
      check('27.1: konuk çıkışa yürürken kayıt -> yükleme: haritada kalır ve çıkış rotası yeniden kurulur (buharlaşmaz), durum kayması yok', g0 && moving && JSON.stringify(s.activeGuest) !== 'null' && s.activeGuest?.leaving && back?.isMoving && sim.scene().world.guests.length === 1 && diff.length === 0, `${live} ${diff.join(' | ')}`);
      let thanks = null;
      const off = game.events.on('guest:left', (p) => (thanks = p.thanks));
      hours(4);
      off();
      check('27.1: yüklemeden sonra çıkışa varıp teşekkürle ayrılır', s.activeGuest === null && sim.scene().world.guests.length === 0 && thanks === true, `${thanks}`);
      s.goldenAge.since = keepGA;
      s.guestBook = JSON.parse(keepBook);
    }

    // --- 2x. (27.2) Rafları dolu (boşta) Şifacı Kulübesi'nde Tezgâh Pratiği: gerçek akış ve kayıt -> yükleme ---
    {
      const t = s.time;
      const keepGA = s.goldenAge.since;
      s.goldenAge.since = s.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
      rich();
      const hut = sim.scene().world.getCompleted('healerHut').find((b) => !b.damaged) ?? sim.place('healerHut');
      const spec = hut.definition.apothecary;
      let lessonIds = [];
      // (29.2) usta ve çırak ölçüm boyunca tok ve dinç tutulur: açlık / ruh hali dersi bölüp ölçümü kaydırmasın
      const fill = () => { const h = sim.scene().world.getBuilding(hut.id); if (h) { h.remedies = spec.maxRemedies; h.herbs = spec.maxHerbs; } for (const id of lessonIds) { const c = s.characters.find((x) => x.id === id); if (c) { c.needs.hunger = Math.max(c.needs.hunger, 85); c.needs.energy = Math.max(c.needs.energy, 85); c.needs.social = Math.max(c.needs.social, 85); c.needs.fun = Math.max(c.needs.fun, 70); } } }; // yüklemeden sonra yapı yeni nesnedir
      fill();
      const pool = s.characters.filter((c) => !c.role && !c.isChild && !c.away && !c.emigrating && c.lifeStage !== 'elder' && !c.apprenticeship).sort((a, b) => a.id - b.id);
      const master = pool[0];
      const youth = pool[pool.length - 1];
      lessonIds = [master.id, youth.id];
      const keep = { m: { workplaceId: master.workplaceId, herb: master.skills.herbalism }, y: { lifeStage: youth.lifeStage, ageInDays: youth.ageInDays, age: youth.age, workplaceId: youth.workplaceId } };
      master.workplaceId = hut.id;
      master.skills.herbalism = Math.max(master.skills.herbalism ?? 0, 1600);
      for (const c of s.characters) if (c.apprenticeship?.buildingId === hut.id) c.apprenticeship = null;
      Object.assign(youth, { lifeStage: 'youth', ageInDays: 19 * (await import('/src/data/lifeStages.js')).AGING.daysPerAge, age: 19, workplaceId: null });
      youth.profile = youth.buildProfile();
      const enrolled = sim.scene().apprenticeship.enroll(youth, hut);
      Object.assign(t, { day: t.day + 1, hour: 6, minute: 55 });
      sim.step(10);
      const p0 = youth.apprenticeship?.progress ?? 0;
      let practiced = 0;
      // Karar penceresi zamanı durdurabilir: varsayılan seçenekle kapatılır, adım sayısı sınırlıdır
      const run = (until, each = () => {}) => {
        for (let i = 0; i < 600 && s.time.hour < until; i++) { // yüklemeden sonra s.time yeni nesnedir
          if (s.dilemma.active) game.events.emit('ui:chooseDilemma', { optionId: s.dilemma.active.defaultId });
          s.time.paused = false;
          fill();
          sim.step(30);
          each();
        }
      };
      run(12, () => { if (youth.task?.activity === 'apprentice' && hut.idle) practiced++; });
      A.roundtrip(); // gün atlamasının sabah özeti (StatsSystem) yükleme anında bir kez oluşur; ölçüm bundan sonra
      const p1 = s.characters.find((c) => c.id === youth.id).apprenticeship?.progress ?? 0;
      const diff = A.roundtrip();
      const y2 = s.characters.find((c) => c.id === youth.id);
      run(17); // (28.2) Gençler artık daha hızlı toparlandığından şekerleme zamanlaması kayabilir: pencere mesainin sonuna kadar
      const p2 = y2.apprenticeship?.progress ?? 0;
      const hut2 = sim.scene().world.getBuilding(hut.id);
      const maxGain = (5 * 60 + 30) * 100 / 1800; // 12:00 -> 17:00 arası tam hızdan bile fazla olamaz
      check('27.2: rafları dolu (idle) Şifacı Kulübesi\'nde çırak gerçek mesaide Tezgâh Pratiği ile ilerler; kayıt -> yüklemede durum kayması yok, yüklemeden sonra da ilerler', enrolled && hut2.idle && practiced > 0 && p1 > p0 && p2 > p1 && p2 - p1 <= maxGain && diff.length === 0, `${p0.toFixed(2)} -> ${p1.toFixed(2)} -> ${p2.toFixed(2)} pratik ${practiced} ${diff.join(' | ')} | ${y2.task?.activity}/${y2.task?.phase} en${Math.round(y2.needs.energy)} h${s.time.hour} ${y2.lifeStage} idle${hut2.idle} dmg${hut2.damaged}`);
      y2.apprenticeship = null;
      Object.assign(y2, keep.y);
      y2.profile = y2.buildProfile();
      const m2 = s.characters.find((c) => c.id === master.id);
      m2.workplaceId = keep.m.workplaceId;
      m2.skills.herbalism = keep.m.herb;
      s.goldenAge.since = keepGA;
    }

    // --- 2y. (29.1) Sosyal kimya ve duygusal etiketler: kayıt -> yükleme durum kayması yok; kopuk kayıt yüklemede temizlenir ---
    {
      const CH = await import('/src/systems/Chemistry.js');
      const pick = () => s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.emigrating).sort((x, y) => x.id - y.id).slice(0, 3);
      const [a, b, c3] = pick();
      const ids = [a.id, b.id, c3.id];
      const before = new Map([a, b, c3].map((c) => [c.id, JSON.stringify(c.relationships)]));
      CH.chemistryOf(s, a, b);
      CH.chemistryOf(s, a, c3);
      CH.addTag(a, b.id, 'grateful', s.totalMinutes);
      CH.addTag(b, a.id, 'jealous', s.totalMinutes);
      CH.addTag(a, 0, 'resentful', s.totalMinutes);
      CH.addTag(a, c3.id, 'kindred', s.totalMinutes);
      CH.addTag(c3, a.id, 'kindred', s.totalMinutes);
      a.relationships[b.id].together = b.relationships[a.id].together = 24;
      a.relationships[b.id].craft = b.relationships[a.id].craft = true;
      CH.refreshChemistry(s, a, b);
      const want = JSON.stringify(s.characters.map((c) => [c.id, c.relationships]));
      const diff = A.roundtrip();
      check('(29.1) kimya, zanaat bağı ve duygusal etiketler kayıt -> yükleme durum kayması yok', diff.length === 0, diff.join(' | '));
      const [a2, b2, c2] = ids.map((id) => s.characters.find((c) => c.id === id));
      check('(29.1) yüklenen kayıtlar birebir aynı (yönlü etiketler, Yönetime kırgınlık, ruh ikizi, zanaat bağı)', JSON.stringify(s.characters.map((c) => [c.id, c.relationships])) === want && CH.hasTag(a2, b2.id, 'grateful') && !CH.hasTag(b2, a2.id, 'grateful') && CH.hasTag(b2, a2.id, 'jealous') && CH.hasTag(a2, 0, 'resentful') && CH.hasTag(c2, a2.id, 'kindred') && a2.relationships[b2.id].craft === true);
      check('(29.1) yüklemeden sonra kimya aynı hesaplanır (kimlik çifti + tohum: deterministik)', a2.relationships[b2.id].chemistry === CH.chemistryFor(s.seed, a2, b2) && a2.relationships[c2.id].chemistry === CH.chemistryFor(s.seed, a2, c2));
      a2.relationships[987654] = { chemistry: 2, craft: false, together: 0, tags: ['grateful'], until: { grateful: s.totalMinutes + 999 } };
      A.roundtrip();
      const a3 = s.characters.find((c) => c.id === ids[0]);
      check('(29.1) kayıp sakine işaret eden kimya kaydı yüklemede temizlenir (Yönetim kaydı kalır)', !a3.relationships[987654] && CH.hasTag(a3, 0, 'resentful') && CH.hasTag(a3, ids[1], 'grateful'));
      for (const id of ids) { const c = s.characters.find((x) => x.id === id); c.relationships = JSON.parse(before.get(id)); }
      for (const c of s.characters) for (const id of ids) { const r = c.relationships[id]; const back = s.characters.find((x) => x.id === id).relationships[c.id]; if (r && !back) delete c.relationships[id]; }
    }

    // --- 2z. (29.2) Ruh halleri, yas ve teselli: kayıt -> yükleme durum kayması yok; toplam etki yüklemede yeniden kurulur ---
    {
      const MO = await import('/src/systems/Moodlets.js');
      const pick = () => s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.emigrating).sort((x, y) => x.id - y.id).slice(0, 3);
      const [a, b, c3] = pick();
      const ids = [a.id, b.id, c3.id];
      const before = new Map([a, b, c3].map((c) => [c.id, JSON.stringify(c.moodlets)]));
      const stats0 = JSON.stringify(s.moodlets);
      const sat0 = [a, b, c3].map((c) => c.satisfaction);
      for (const c of [a, b, c3]) { c.moodlets.length = 0; c.satisfaction = 50; MO.recomputeMood(c); } // (29.3) doyum kademesi beklenen çarpanları kaydırmasın
      const now = s.totalMinutes;
      MO.addMoodlet(a, 'mourning', now, { tier: 'major', reason: 'mourn_spouse', whoId: 987654, whoName: 'Deniz' });
      MO.addMoodlet(a, 'comforted', now, { reason: 'comforted', whoId: b.id, whoName: b.name });
      MO.addMoodlet(a, 'exhausted', now, { reason: 'exhausted' });
      MO.addMoodlet(b, 'proud_work', now, { reason: 'proud_trait' });
      MO.addMoodlet(b, 'flow_state', now, { reason: 'flow', tier: 'major' });
      MO.addMoodlet(c3, 'neglected', now, { reason: 'neglect_rejected', tier: 'major', harsh: true });
      s.moodlets.consoled += 1; s.moodlets.given.mourning = (s.moodlets.given.mourning ?? 0) + 1;
      const want = JSON.stringify(s.characters.map((c) => [c.id, c.moodlets]));
      const wantStats = JSON.stringify(s.moodlets);
      const moods = [a, b, c3].map((c) => [c.mood.workMul, c.mood.moveMul, c.mood.joyRateMul, c.mood.xpMul, c.mood.feel].join());
      const diff = A.roundtrip();
      check('(29.2) ruh halleri (yas + teselli, akış, ihmal) ve sayaçlar kayıt -> yükleme durum kayması yok', diff.length === 0, diff.join(' | '));
      const loaded = ids.map((id) => s.characters.find((c) => c.id === id));
      check('(29.2) yüklenen moodlet\'ler ve sayaçlar birebir aynı (kişi adı, kademe, süre, koşula bağlı moodlet)', JSON.stringify(s.characters.map((c) => [c.id, c.moodlets])) === want && JSON.stringify(s.moodlets) === wantStats && MO.getMoodlet(loaded[0], 'mourning').whoName === 'Deniz' && MO.getMoodlet(loaded[0], 'exhausted').until === null);
      check('(29.2) toplam etki (c.mood) kayda girmez, yüklemede aynı değerlerle yeniden hesaplanır; teselli yüklemeden sonra da travmayı yarılar', loaded.map((c) => [c.mood.workMul, c.mood.moveMul, c.mood.joyRateMul, c.mood.xpMul, c.mood.feel].join()).join('|') === moods.join('|') && loaded[0].mood.grief === true && MO.traumaOf(loaded[0]) === null && Math.abs(loaded[2].mood.workMul - 0.85) < 1e-9, moods.join('|'));
      scene().moodlets.onHour();
      check('(29.2) yüklemeden sonra saat taraması katman tavanlarını korur (en çok 6; 1 çekirdek + 3 eylem + 2 ihtiyaç)', s.characters.every((c) => c.moodlets.length <= 6 && c.moodlets.filter((m) => m.key === 'mourning' || m.key === 'neglected' || m.key === 'shaken' || m.key === 'heartbroken' || m.key === 'euphoric' || m.key === 'inspired').length <= 1));
      for (const [i, id] of ids.entries()) { const c = s.characters.find((x) => x.id === id); c.moodlets = JSON.parse(before.get(id)); c.satisfaction = sat0[i]; MO.recomputeMood(c); }
      s.moodlets = JSON.parse(stats0);
    }
    // --- 2za. (29.3) Arzular, korkular ve yaşam doyumu: kayıt -> yükleme birebir; kopuk referans yok; tavanlar korunur ---
    {
      const WT = await import('/src/systems/Wants.js');
      const MO = await import('/src/systems/Moodlets.js');
      const pick = () => s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.emigrating).sort((x, y) => x.id - y.id).slice(0, 3);
      const [a, b, c3] = pick();
      const ids = [a.id, b.id, c3.id];
      const fields = ['wants', 'fears', 'satisfaction', 'wantLog', 'fearStreak', 'wishCount'];
      const before = new Map([a, b, c3].map((c) => [c.id, JSON.stringify(fields.map((f) => c[f]))]));
      const stats0 = JSON.stringify(s.wants);
      const now = s.totalMinutes;
      a.wants = [{ key: 'chat_kindred', since: now, until: now + 2880, whoId: b.id, whoName: b.name }, { key: 'get_married', since: now, until: null, whoId: c3.id, whoName: c3.name }, { key: 'quiet_day', since: now, until: now + 2880 }];
      a.fears = [{ key: 'quarrel_foe', since: now, until: now + 4320, whoId: c3.id, whoName: c3.name }, { key: 'go_hungry', since: now, until: now + 4320 }];
      a.satisfaction = 88; a.fearStreak = 0; a.wishCount = 4;
      a.wantLog = [{ key: 'make_friend', kind: 'want', outcome: 'fulfilled', day: s.time.day }, { key: 'fire_at_work', kind: 'fear', outcome: 'realized', day: s.time.day, burned: true }];
      b.wants = [{ key: 'level_up_skill', since: now, until: now + 4320 }]; b.fears = []; b.satisfaction = 12; b.fearStreak = 3; b.wishCount = 0; b.wantLog = [];
      c3.wants = []; c3.fears = [{ key: 'loss_of_loved', since: now, until: null, whoId: a.id, whoName: a.name }]; c3.satisfaction = 50; c3.wantLog = [{ key: 'reconcile', kind: 'want', outcome: 'void', day: s.time.day, whoName: 'Deniz' }];
      for (const c of [a, b, c3]) { WT.recomputeDrive(c); MO.recomputeMood(c); }
      s.wants.rolled.quiet_day = (s.wants.rolled.quiet_day ?? 0) + 1; s.wants.realized.fire_at_work = (s.wants.realized.fire_at_work ?? 0) + 1;
      const want = JSON.stringify(s.characters.map((c) => [c.id, fields.map((f) => c[f])]));
      const wantStats = JSON.stringify(s.wants);
      const moods = [a, b, c3].map((c) => [c.mood.workMul, c.mood.joyRateMul, c.mood.xpMul, c.mood.satisfaction].join());
      const diff = A.roundtrip();
      check('(29.3) arzular, korkular, doyum, sonuç kaydı ve sayaçlar kayıt -> yükleme durum kayması yok', diff.length === 0, diff.join(' | '));
      const loaded = ids.map((id) => s.characters.find((c) => c.id === id));
      check('(29.3) yüklenen arzu / korku / doyum / kayıt / sayaçlar birebir aynı; drive ve doyum kademesi (c.mood) yüklemede yeniden kurulur', JSON.stringify(s.characters.map((c) => [c.id, fields.map((f) => c[f])])) === want && JSON.stringify(s.wants) === wantStats && loaded.map((c) => [c.mood.workMul, c.mood.joyRateMul, c.mood.xpMul, c.mood.satisfaction].join()).join('|') === moods.join('|') && loaded[0].drive.seekIds.includes(b.id) && loaded[0].drive.avoidIds.includes(c3.id) && loaded[1].mood.satisfaction === 'crushed');
      const people = new Set(s.characters.map((c) => c.id));
      check('(29.3) yüklemeden sonra hiçbir arzu / korku kopuk kişiye işaret etmez; tavanlar korunur (3 arzu, 2 korku, kategori başına 1, uzun soluklu 1)', s.characters.every((c) => [...c.wants, ...c.fears].every((e) => !Number.isFinite(e.whoId) || (people.has(e.whoId) && e.whoId !== c.id)) && c.wants.length <= 3 && c.fears.length <= 2 && c.wantLog.length <= 8 && new Set(c.wants.map((w) => w.key)).size === c.wants.length));
      loaded[0].wants.push({ key: 'reconcile', since: now, until: now + 999, whoId: 987654, whoName: 'Hayalet' });
      loaded[0].wants.splice(0, 1); // kategori yeri açılsın (sosyal)
      const diff2 = A.roundtrip();
      const a2 = s.characters.find((c) => c.id === ids[0]);
      check('(29.3) kayıp sakine işaret eden arzu yüklemede temizlenir', !a2.wants.some((w) => w.whoId === 987654) && a2.wants.some((w) => w.key === 'get_married'), diff2.slice(0, 2).join(' | '));
      for (const id of ids) { const c = s.characters.find((x) => x.id === id); const v = JSON.parse(before.get(id)); fields.forEach((f, i) => (c[f] = v[i])); WT.recomputeDrive(c); MO.recomputeMood(c); }
      s.wants = JSON.parse(stats0);
    }
    // --- 2zb. (29.4) Kalıcı kişilik evrimi: kayıt -> yükleme birebir; değişmezler (deepTraits ⊆ traits, en çok 3 özellik, tekrar yok) ---
    {
      const EVX = await import('/src/systems/Evolution.js');
      const ED = await import('/src/data/evolution.js');
      const pick = () => s.characters.filter((c) => !c.isChild && !c.role && !c.away && !c.emigrating).sort((x, y) => x.id - y.id).slice(0, 3);
      const [a, b, c3] = pick();
      const ids = [a.id, b.id, c3.id];
      const fields = ['traits', 'growth', 'growthToday', 'growthCause', 'deepTraits', 'evolutions', 'evolutionCount', 'acquiredCount'];
      const before = new Map([a, b, c3].map((c) => [c.id, JSON.stringify(fields.map((f) => c[f]))]));
      const stats0 = JSON.stringify(s.evolution);
      const day = s.time.day;
      a.traits = ['hardworking', 'cheerful', 'natureLover']; a.deepTraits = ['hardworking', 'cheerful']; a.growth = [-12, 40, -33, 8]; a.growthToday = [0, 7, -5, 0];
      a.growthCause = [null, 'want:make_friend', 'moodlet:nature_bliss', 'tier:fulfilled'];
      a.evolutions = [{ day: day - 20, kind: 'acquired', axis: 2, from: null, to: 'natureLover', cause: 'moodlet:nature_bliss' }, { day: day - 5, kind: 'deepened', axis: 0, from: null, to: 'hardworking', cause: 'masterwork' }];
      a.evolutionCount = 2; a.acquiredCount = 1;
      b.traits = ['grumpy', 'sleepyhead']; b.deepTraits = []; b.growth = [0, 0, 0, -100]; b.growthToday = [0, 0, 0, -20]; b.growthCause = [null, null, null, 'moodlet:mourning'];
      b.evolutions = [{ day: day - 2, kind: 'turned', axis: 3, from: 'cheerful', to: 'grumpy', cause: 'moodlet:mourning' }]; b.evolutionCount = 1; b.acquiredCount = 0;
      c3.traits = ['hardworking', 'sleepyhead']; c3.deepTraits = []; c3.growth = [0, 0, 0, 0]; c3.growthToday = [0, 0, 0, 0]; c3.growthCause = [null, null, null, null]; c3.evolutions = []; c3.evolutionCount = 0; c3.acquiredCount = 0;
      for (const c of [a, b, c3]) { c.profile = c.buildProfile(); }
      s.evolution.turned.grumpy = (s.evolution.turned.grumpy ?? 0) + 1; s.evolution.acquired.natureLover = (s.evolution.acquired.natureLover ?? 0) + 1; s.evolution.deepened.hardworking = (s.evolution.deepened.hardworking ?? 0) + 1; s.evolution.total += 3;
      const want = JSON.stringify(s.characters.map((c) => [c.id, fields.map((f) => c[f])]));
      const wantStats = JSON.stringify(s.evolution);
      const diff = A.roundtrip();
      check('(29.4) eksenler, derin özellikler, evrim kaydı, sayaçlar ve 3 özellikli sakin kayıt -> yükleme durum kayması yok', diff.length === 0, diff.join(' | '));
      const loaded = ids.map((id) => s.characters.find((c) => c.id === id));
      check('(29.4) yüklenen evrim alanları ve sayaçlar birebir aynı (traits dahil)', JSON.stringify(s.characters.map((c) => [c.id, fields.map((f) => c[f])])) === want && JSON.stringify(s.evolution) === wantStats, `${JSON.stringify(s.characters.map((c) => [c.id, fields.map((f) => c[f])])).slice(0, 300)} || ${want.slice(0, 300)} || ${JSON.stringify(s.evolution)} || ${wantStats}`);
      check('(29.4) derin yama yüklemede profile yeniden uygulanır (Yorulmaz yorgunluğu 0,5; Gönül Ferahı x Doğa Sever keyif düşüşü 0,6 x 0,9; derinsiz Çalışkan x Uykucu 0,6 x 1,3)', Math.abs(loaded[0].profile.work.fatigue - 0.5) < 1e-9 && Math.abs(loaded[0].profile.decay.fun - 0.6 * 0.9) < 1e-9 && Math.abs(loaded[2].profile.work.fatigue - 0.6 * 1.3) < 1e-9, JSON.stringify([loaded[0].profile.work.fatigue, loaded[0].profile.decay.fun, loaded[2].profile.work.fatigue]));
      const invariants = () => s.characters.every((c) => c.deepTraits.every((t) => c.traits.includes(t)) && c.traits.length <= 3 && new Set(c.traits).size === c.traits.length && c.growth.length === 4 && c.growth.every((v) => Number.isInteger(v) && Math.abs(v) <= 100) && c.evolutions.length <= ED.EVOLUTION_RULES.logMax && c.evolutionCount >= c.evolutions.length);
      check('(29.4) değişmezler: deepTraits ⊆ traits, özellik sayısı ≤ 3, aynı özellik iki kez yok, 4 eksen, tam sayı ve ±100 içinde, log ≤ 4', invariants());
      // bozuk veri: kayıttan geçerken temizlenir
      loaded[2].growth = [250, 'x', -300, 1.6]; loaded[2].growthToday = [99, 0, 0, 0]; loaded[2].growthCause = ['bilinmeyen', 3, 'masterwork', null]; loaded[2].deepTraits = ['grumpy', 'hardworking', 'hardworking', 'obur']; loaded[2].evolutions = [{ day: 1, kind: 'x' }, { day: 3, kind: 'acquired', axis: 9, to: 'cheerful' }, { day: 4, kind: 'deepened', axis: 0, to: 'hardworking' }];
      const diff2 = A.roundtrip();
      const c2 = s.characters.find((c) => c.id === ids[2]);
      check('(29.4) bozuk eksen / neden / derin özellik / kayıt yüklemede temizlenir (aralık, bilinmeyen anahtar, traits dışı derin özellik, bozuk kayıt)', JSON.stringify(c2.growth) === '[100,0,-100,2]' && JSON.stringify(c2.growthToday) === '[20,0,0,0]' && JSON.stringify(c2.growthCause) === '[null,null,"masterwork",null]' && JSON.stringify(c2.deepTraits) === '["hardworking"]' && c2.evolutions.length === 1 && c2.evolutions[0].kind === 'deepened', `${JSON.stringify([c2.growth, c2.growthCause, c2.deepTraits, c2.evolutions])} ${diff2.slice(0, 2).join(' | ')}`);
      // yükleme sonrası 05:00 sınırı: eşiği aşan eksen sabaha karşı kesintisiz uygulanır
      c2.growth = [0, 0, 0, 0]; c2.growthToday = [0, 0, 0, 0]; c2.evolutions = []; c2.evolutionCount = 0; c2.deepTraits = [];
      const diff3 = A.roundtrip();
      check('(29.4) yüklemeden sonra da değişmezler korunur', invariants() && diff3.length === 0, diff3.slice(0, 2).join(' | '));
      for (const id of ids) { const c = s.characters.find((x) => x.id === id); const v = JSON.parse(before.get(id)); fields.forEach((f, i) => (c[f] = v[i])); c.profile = c.buildProfile(); }
      s.evolution = JSON.parse(stats0);
    }
    // --- 2g. (16. aşama) Sefer yoldayken ve Maceracı Günlüğü penceresi açıkken ---
    {
      rich();
      if (!s.buildings.some((b) => b.type === 'townHall' && b.functional)) {
        s.town.tier = Math.max(s.town.tier, 3);
        sim.place('townHall');
      }
      for (const c of s.characters) c.illness = null;
      s.exploration.lastLaunchDay = -99;
      s.dilemma.expedition = null;
      game.events.emit('ui:launchExpedition', { source: 'townHall' });
      const launched = Boolean(s.dilemma.expedition);
      let guard = 0;
      while (s.dilemma.active?.kind !== 'adventure' && guard++ < 400) sim.step(50);
      const team = [...(s.dilemma.expedition?.members ?? [])];
      const diff = A.roundtrip();
      game.render(0);
      const modal = document.querySelector('.dilemma');
      check('sefer yoldayken macera penceresi açıkken kayıt -> yükleme durum kayması yok', launched && diff.length === 0, diff.join(' | '));
      check('yüklenince macera penceresi yeniden açılır, kafile seferde kalır', s.dilemma.active?.kind === 'adventure' && s.time.paused && !modal.hidden && team.every((id) => s.characters.find((c) => c.id === id)?.away));
      const returned = counter('expedition:returned');
      game.events.emit('ui:chooseDilemma', { optionId: s.dilemma.active.defaultId });
      guard = 0;
      while (s.dilemma.expedition && guard++ < 120) hours(0.5);
      check('yüklenen sefer bir kez döner, kimse kaybolmaz', returned.n === 1 && team.every((id) => { const c = s.characters.find((x) => x.id === id); return c && !c.away; }), `${returned.n}`);
      returned.off();
    }

    // --- Kopuk referanslı (elle bozulmuş) kayıt onarılarak açılır ---
    {
      const data = { ...A.snap(), version: 12, savedAt: 0 };
      const [c0, c1, c2, c3] = data.characters;
      c0.homeId = 999999;
      c1.partnerId = 999998;
      c1.married = true;
      c2.parentIds = [777777, c2.id];
      c3.workplaceId = 555555;
      localStorage.setItem('lmgame.save.v2', JSON.stringify(data));
      game.events.emit('ui:load');
      const by = (id) => s.characters.find((c) => c.id === id);
      const fixed = by(c0.id).homeId !== 999999 && by(c1.id).partnerId === null && !by(c1.id).married && by(c2.id).parentIds.length === 0 && by(c3.id).workplaceId === null;
      hours(2);
      check('kopuk referanslı kayıt onarılarak açılır (ev, eş, ebeveyn, sabit iş yeri)', fixed && s.characters.length === data.characters.length, `ev ${by(c0.id).homeId}`);
    }

    // --- Sabah 06:00 otomatik kaydı ve yeni harita sonrası temizlik ---
    {
      const before2 = count();
      game.events.emit('ui:newGame');
      game.events.emit('ui:newGame');
      check('Yeni Harita iki kez: dinleyici sayısı sabit', count() === before2, `${before2} -> ${count()}`);
    }
    return out;
  });
  push(out);
  allErrors.push(...errors);
  await browser.close();
}

// =====================================================================================================================
// 3-4. Kış ve kıtlık krizi, referans bütünlüğü
// =====================================================================================================================
{
  const { browser, page, errors } = await openGame({ seed: 31 });
  await installMonitor(page);
  const out = await page.evaluate(async () => {
    const game = window.game;
    const sim = window.sim;
    const s = game.state;
    const out = [];
    const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail: String(detail) });
    const scene = () => game.scenes.current;
    const hours = (h) => {
      for (let i = 0; i < h; i++) {
        sim.step(112);
        window.__monitor.sample(); // saat buçuğunda (saat başı görev geçişlerinden uzak)
        sim.step(113);
      }
    };
    const starve = () => {
      sim.give({ wood: 0, food: 0, bread: 0 });
      s.pantry.credit = 0;
      for (const b of s.buildings) {
        if (b.type === 'berryBush') b.berries = 0;
        if (b.meals) b.meals = 0;
      }
      for (const c of s.characters) c.carrying = null;
    };
    const events = { cold: 0, restored: 0, ill: 0, recovered: 0, cured: 0 };
    game.events.on('heating:cold', () => events.cold++);
    game.events.on('heating:restored', () => events.restored++);
    game.events.on('health:fellIll', () => events.ill++);
    game.events.on('health:recovered', () => events.recovered++);
    game.events.on('health:cured', () => events.cured++);

    // --- 4. Referans bütünlüğü: yıkımlar ve iptaller ---
    sim.give({ wood: 400, stone: 400, food: 200 });
    for (const t of ['storage', 'lumberHut', 'garden', 'quarry', 'inn', 'market']) sim.place(t);
    hours(3);
    const hut = s.buildings.find((b) => b.type === 'lumberHut');
    const worker = s.characters.find((c) => !c.isChild);
    game.events.emit('ui:pinWorker', { buildingId: hut.id, characterId: worker.id });
    check('sakin bir iş yerine sabitlenir', worker.workplaceId === hut.id);
    while (s.time.hour < 9 || s.time.hour > 15) hours(1);
    hours(1);
    scene().construction.demolish(hut);
    check('sabit iş yeri yıkılınca sabitleme kalkar', worker.workplaceId === null && !s.characters.some((c) => c.workplaceId === hut.id));
    // Şantiye işçilerle birlikte iptal edilir
    const site = scene().construction.placeSite('cabin', sim.findSpot('cabin').x, sim.findSpot('cabin').y);
    hours(1);
    if (site.ok) scene().construction.demolish(site.building);
    hours(1);
    check('şantiye iptal edilince işi ve atananları temizlenir', !scene().jobs.jobs.some((j) => j.buildingId === site.building?.id));
    // Şenlik yeri yıkılınca şenlik taşınır ya da biter
    {
      const venue = scene().townEvents.findVenue();
      scene().townEvents.startFestival(venue);
      const extra = sim.place('campfire');
      const target = s.buildings.find((b) => b.id === s.events.festival.venueId);
      const removable = target && target.definition.demolishable !== false && target.occupants.size === 0 && !scene().world.getResidents(target).length;
      if (removable) scene().construction.demolish(target);
      const moved = s.events.festival.active ? s.buildings.some((b) => b.id === s.events.festival.venueId) : true;
      check('şenlik yeri yıkılınca şenlik başka yere taşınır ya da biter', !removable || moved, `${target?.type} -> ${s.buildings.find((b) => b.id === s.events.festival.venueId)?.type ?? 'bitti'}`);
      if (s.events.festival.active) scene().townEvents.endFestival();
      if (extra) scene().construction.demolish(extra);
    }
    // Tüccarın yoluna yapı kurulur
    {
      const m = s.events.merchant;
      while (s.time.hour < 9 || s.time.hour >= 14) hours(1);
      if (m.present) scene().townEvents.finishMerchantVisit();
      m.nextVisitDay = s.time.day;
      scene().townEvents.tryMerchantVisit();
      const merchant = scene().world.visitors[0];
      sim.step(60);
      let blocked = false;
      const pts = merchant?.remainingWaypoints() ?? [];
      // Yolun ortasındaki bir karoya küçük bir yapı (çiçek tarhı) kur
      for (let i = Math.floor(pts.length / 2); i < pts.length && !blocked; i++) {
        const tx = Math.floor(pts[i].x / 16);
        const ty = Math.floor(pts[i].y / 16);
        if (scene().construction.checkPlacement('flowerBed', tx, ty).ok) blocked = scene().construction.placeSite('flowerBed', tx, ty).ok;
      }
      const map = scene().world.map;
      const through = merchant
        ? merchant.remainingWaypoints().filter((p) => !map.isWalkable(Math.floor(p.x / 16), Math.floor(p.y / 16))).length
        : 0;
      check('tüccarın yoluna yapı kurulunca tüccar yeni yoldan yürür', !blocked || through <= 1, `${blocked ? 'yol kesildi' : 'kesilemedi'} · yürünemez nokta ${through}`);
    }

    // --- 3. Kış ve kıtlık ---
    // Kışın ilk gününe sar (13. gün)
    while (s.time.day < 12) {
      sim.give({ wood: 200, food: 150 });
      hours(6);
    }
    const sickBefore = s.stats.illnesses;
    // (22. aşama) Uzun kıtlıkta umudunu yitiren sakinler köyü bilerek terk edebilir: onlar "kaybolan" sayılmaz
    let emigrated = 0;
    const offLeft = game.events.on('population:left', () => emigrated++);
    while (s.time.day < 13) hours(1);
    starve();
    let peakSick = 0;
    let freezingHours = 0;
    let badNeeds = 0;
    for (let h = 0; h < 72; h++) {
      if (h % 3 === 0) starve(); // kıtlık sürsün: üretilen her şey geri alınır
      hours(1);
      if (s.heating.cold) freezingHours++;
      peakSick = Math.max(peakSick, s.characters.filter((c) => c.illness).length);
      for (const c of s.characters) for (const v of Object.values(c.needs)) if (!(v >= 0 && v <= 100)) badNeeds++;
    }
    const pop = s.characters.length;
    check('kıtlık kışında ocaklar söner (odun bitti)', events.cold >= 1 && freezingHours >= 24, `${freezingHours} saat soğuk`);
    check('kıtlık kışında sakinler hastalanır', s.stats.illnesses > sickBefore && peakSick >= 1, `en çok ${peakSick} hasta`);
    check('kriz boyunca ihtiyaçlar 0-100 arasında, sayı', badNeeds === 0, `${badNeeds} geçersiz`);
    // Toparlanma: kervan gelir
    sim.give({ wood: 200, food: 200 });
    hours(12);
    check('odun gelince ocaklar yeniden yanar', !s.heating.cold && events.restored >= 1);
    hours(48);
    const sickAfter = s.characters.filter((c) => c.illness).length;
    check('stok gelince kasaba toparlanır: hastalar iyileşir', sickAfter < Math.max(1, peakSick) && events.recovered + events.cured >= 1, `${peakSick} -> ${sickAfter} hasta`);
    offLeft();
    const popEnd = s.characters.length + emigrated;
    check('kriz sırasında kimse kaybolmaz (köyü bilerek terk edenler ayrı sayılır)', popEnd >= pop && pop > 0 && s.characters.length >= 3, `${pop} sakin · ${emigrated} sakin köyü terk etti`);
    return out;
  });
  const mon = await monitorReport(page);
  push(out);
  results.push({ name: 'kriz ve yıkımlar boyunca kimse takılmaz', ok: mon.stuck.length === 0, detail: mon.stuck.slice(0, 3).map((x) => `G${x.day} ${x.hour}:00 ${x.name}@${x.tile} ${x.reason} ${x.label} ${JSON.stringify(x.detail)}`).join(' | ') });
  results.push({ name: 'kriz ve yıkımlar boyunca kopuk referans yok', ok: mon.brokenCount === 0, detail: mon.broken.slice(0, 3).join(' | ') });
  allErrors.push(...errors);
  await browser.close();
}

// =====================================================================================================================
// 5-6. Metin kutuları ve ses (döngü çalışır, gerçek tuş ve tıklamalar)
// =====================================================================================================================
{
  const { browser, page, errors } = await openGame({ seed: 8, stopLoop: false });
  const state = () =>
    page.evaluate(() => {
      const scene = window.game.scenes.current;
      return {
        cam: [Math.round(scene.camera.x), Math.round(scene.camera.y)],
        tool: scene.tools.tool,
        paused: window.game.state.time.paused,
        cinematic: scene.cinematic,
        town: window.game.state.townName,
        // (17. aşama) Ortalanmış pencerelerden herhangi biri (Günlük, Hedefler, Arşiv, Ayarlar) açıldı mı?
        modal: document.getElementById('ui-layer').classList.contains('has-modal'),
      };
    });
  await page.evaluate(() => (window.game.state.time.paused = true));
  await page.mouse.click(5, 5); // ses bağlamı için kullanıcı etkileşimi
  await page.waitForTimeout(200);
  let before = await state();
  await page.click('.hud-town-name');
  await page.keyboard.type('Kasaba wasd bhxf jgoi');
  await page.keyboard.press('Space');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  let after = await state();
  results.push({
    name: 'kasaba adı yazılırken oyun tuşları kaçmaz (kamera, araç, duraklatma, fotoğraf modu)',
    ok: after.cam.join() === before.cam.join() && after.tool === 'select' && after.paused === before.paused && !after.cinematic && !after.modal,
    detail: JSON.stringify({ before, after }),
  });
  results.push({ name: 'kasaba adı yazılan metinle kaydedilir', ok: after.town === 'Kasaba wasd bhxf jgoi w' /* basılı W kutuya yazılır, kameraya gitmez */, detail: after.town });
  // Sakin adı: aynı denetim + listeden başka sakin seçilince ad doğru sakine gider
  const ids = await page.evaluate(() => window.game.state.characters.slice(0, 2).map((c) => ({ id: c.id, name: c.name })));
  await page.evaluate((id) => window.game.events.emit('ui:selectCharacter', id), ids[0].id);
  await page.waitForTimeout(2500); // kamera seçilen sakine kayarken ölçülmesin
  before = await state();
  await page.click('.character-name.is-renamable');
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Bahadır wasd');
  await page.keyboard.press('Space');
  await page.keyboard.type('fhb');
  after = await state();
  results.push({ name: 'sakin adı yazılırken oyun tuşları kaçmaz', ok: after.cam.join() === before.cam.join() && after.tool === 'select' && after.paused === before.paused && !after.cinematic && !after.modal, detail: JSON.stringify(after) });
  // Ad kutusu açıkken sağdaki listeden ikinci sakini seç (liste odağı çalmaz), sonra Enter
  const rowCount = await page.locator('.residents .resident-row').count();
  const row = page.locator('.residents .resident-row').nth(1);
  if ((await row.count()) > 0) await row.click();
  else await page.evaluate((id) => window.game.events.emit('ui:selectCharacter', id), ids[1].id);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const names = await page.evaluate((ids) => ids.map(({ id }) => window.game.state.characters.find((c) => c.id === id).name), ids);
  results.push({
    name: 'ad kutusu açıkken başka sakin seçilince ad ilk sakine yazılır, ikinciye değil',
    ok: names[0] === 'Bahadır wasd fhb' && names[1] === ids[1].name,
    detail: `${names.join(' / ')} (satır ${rowCount})`,
  });

  // --- 6. Ses ---
  const audio = () =>
    page.evaluate(() => {
      const sound = window.game.sound;
      return { ctx: sound.ctx ? sound.ctx.state : null, gain: sound.master ? sound.master.gain.value : null, muted: sound.muted, volume: sound.volume };
    });
  let a = await audio();
  if (a.muted) {
    await page.evaluate(() => window.game.events.emit('ui:toggleMute'));
    await page.waitForTimeout(300);
    a = await audio();
  }
  results.push({ name: 'ses ilk tıklamayla başlar', ok: a.ctx === 'running', detail: JSON.stringify(a) });
  await page.evaluate(() => window.game.events.emit('ui:toggleMute'));
  await page.waitForTimeout(700);
  a = await audio();
  results.push({ name: 'sessizde ses bağlamı askıya alınır (Web Audio düğümleri işlemci harcamaz)', ok: a.muted && a.ctx === 'suspended' && a.gain < 0.01, detail: JSON.stringify(a) });
  const curve = await page.evaluate(async () => {
    const sound = window.game.sound;
    window.game.events.emit('ui:toggleMute');
    const values = [];
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 40));
      values.push(sound.master.gain.value);
    }
    return { values, state: sound.ctx.state, volume: sound.volume };
  });
  const v = curve.values;
  const smooth = v.every((x, i) => i === 0 || x >= v[i - 1] - 1e-6) && v[0] < curve.volume * 0.7 && v[v.length - 1] > curve.volume * 0.8;
  results.push({ name: 'ses açılınca kazanç 0dan yumuşakça yükselir (tık / cızırtı yok)', ok: curve.state === 'running' && smooth, detail: v.map((x) => x.toFixed(2)).join(' ') });
  allErrors.push(...errors);
  await browser.close();
}
{
  // Sessiz başlanan oyun: tıklamada bağlam kurulmaz; ses düğmesiyle açılınca kurulur
  const { browser, page, errors } = await openGame({ seed: 8, stopLoop: false });
  await page.evaluate(() => {
    localStorage.setItem('lmgame.audio.muted', '1');
  });
  await page.goto(`${BASE_URL}/?seed=8`);
  await page.waitForFunction(() => window.game?.scenes?.current?.world);
  await page.mouse.click(400, 300);
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(300);
  const muted = await page.evaluate(() => ({ ctx: window.game.sound.ctx?.state ?? null, muted: window.game.sound.muted }));
  results.push({ name: 'sessiz başlanan oyunda tıklama ses bağlamı kurmaz', ok: muted.muted && muted.ctx === null, detail: JSON.stringify(muted) });
  await page.click('.hud-mute');
  await page.waitForTimeout(400);
  const on = await page.evaluate(() => ({ ctx: window.game.sound.ctx?.state ?? null, muted: window.game.sound.muted }));
  results.push({ name: 'ses düğmesiyle açılınca bağlam kurulur ve çalar', ok: !on.muted && on.ctx === 'running', detail: JSON.stringify(on) });
  await page.evaluate(() => localStorage.removeItem('lmgame.audio.muted'));
  allErrors.push(...errors);
  await browser.close();
}

// =====================================================================================================================
// 7. Arayüz yerleşimi (17. aşama): ince üst çubuk, sağ sütun (sakinler çekmecesi + sağ alt kart), birleşik alt dock ve
//    ortalanmış pencereler. Beş çözünürlükte, her senaryoda: yatay kaydırma yok, paneller ve düğmeler ekrandan taşmaz,
//    bölgeler birbirine binmez, kart çekmeceyle aynı hizada sağ alttadır, pencere üst çubukla dock arasında ortalanır.
// =====================================================================================================================
{
  const viewports = [
    { name: 'geniş ekran 1920x1080', width: 1920, height: 1080 },
    { name: '1366x768', width: 1366, height: 768 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: 'tablet 768x1024', width: 768, height: 1024 },
    { name: 'telefon 390x844', width: 390, height: 844 },
  ];
  const { browser, page, errors } = await openGame({ seed: 12 });
  await page.evaluate(() => {
    const sim = window.sim;
    localStorage.removeItem('lmgame.ui.residentsCollapsed');
    sim.give({ wood: 400, stone: 400, food: 300 });
    for (const t of ['storage', 'market', 'inn', 'lumberHut', 'garden']) sim.place(t);
    sim.step(225 * 3);
    for (let i = 0; i < 6; i++) window.game.state.addJournal(`Denetim kaydı ${i}: uzun bir günlük satırı, sarılması gereken bir metin`);
  });
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(150);
    const r = await page.evaluate(async () => {
      const game = window.game;
      const scene = game.scenes.current;
      const s = game.state;
      const E = game.events;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const problems = [];
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const rect = (e) => e.getBoundingClientRect();
      const visible = (e) => Boolean(e) && !e.hidden && e.offsetParent !== null && rect(e).width > 0;
      const shown = (sel) => [...document.querySelectorAll(sel)].filter(visible);
      const q = (sel) => document.querySelector(sel);
      const area = (a, b) => (a && b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0);
      const clip = (a, b) => ({ left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom), width: a.width });
      const px = (b) => `${Math.round(b.left)},${Math.round(b.top)}-${Math.round(b.right)},${Math.round(b.bottom)}`;
      const regions = () => {
        const collapsed = q('.resident-drawer').classList.contains('is-collapsed');
        // Kart sütunundaki görünen kartların birleşimi (ör. takas penceresi ve altında sakin kartı)
        const cardEls = shown('.ui-cards > .panel');
        const union = cardEls.length
          ? cardEls.map(rect).reduce((a, b) => ({ left: Math.min(a.left, b.left), right: Math.max(a.right, b.right), top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom), width: Math.max(a.width, b.width) }))
          : null;
        return {
          collapsed,
          top: visible(q('.hud.topbar')) ? rect(q('.hud.topbar')) : null,
          drawer: visible(q(collapsed ? '.resident-tab' : '.residents')) ? rect(q(collapsed ? '.resident-tab' : '.residents')) : null,
          card: union ? clip(union, rect(q('.ui-cards'))) : null,
          cards: rect(q('.ui-cards')),
          column: rect(q('.ui-right')),
          dock: visible(q('.dock.build-bar')) ? rect(q('.dock.build-bar')) : null,
          items: visible(q('.build-items')) ? rect(q('.build-items')) : null,
          hint: visible(q('.build-hint')) ? rect(q('.build-hint')) : null,
          modals: shown('.modal-window'),
          // (30.2) sol alt sütun: Duygu açıklaması, hikâye kartları, rehber kartı; izlenenler ve çipler üst şeridin altında
          legend: visible(q('.emotion-legend')) ? rect(q('.emotion-legend')) : null,
          story: shown('.story-card').map(rect),
          guide: visible(q('.guide-card')) ? rect(q('.guide-card')) : null,
          chips: visible(q('.hud-under')) ? rect(q('.hud-under')) : null,
        };
      };
      const inspect = (label) => {
        const doc = document.scrollingElement;
        if (doc.scrollWidth > W + 1) problems.push(`${label}: sayfa yatay kayıyor (${doc.scrollWidth}>${W})`);
        const g = regions();
        // Paneller ekranda ve içerikleri yatay taşmıyor (kayan kartlar sütunun görünen kısmıyla kırpılır)
        for (const p of shown('#ui-layer .panel')) {
          if (p.closest('.title-screen')) continue;
          const b = p.closest('.ui-cards') ? clip(rect(p), g.cards) : rect(p);
          if (b.left < -1 || b.right > W + 1 || b.top < -1 || b.bottom > H + 1) problems.push(`${label}: ${p.className.split(' ').slice(1, 3).join('.')} ekrandan taşıyor (${px(b)})`);
          if (p.scrollWidth > p.clientWidth + 2) problems.push(`${label}: ${p.className.split(' ').slice(1, 3).join('.')} içeriği yatay taşıyor (${p.scrollWidth}>${p.clientWidth})`);
        }
        for (const btn of shown('.hud button, .dock-wrap button, .ui-right button, .modal-layer button')) {
          const b = rect(btn);
          if (b.right > W + 1 || b.left < -1) problems.push(`${label}: düğme ekran dışında "${btn.textContent.trim().slice(0, 20)}"`);
        }
        // Bölgeler birbirine binmez
        const pairs = [
          ['üst çubuk', g.top, 'sakinler', g.drawer],
          ['üst çubuk', g.top, 'kart', g.card],
          ['üst çubuk', g.top, 'dock', g.dock],
          ['üst çubuk', g.top, 'yapı listesi', g.items],
          ['sakinler', g.drawer, 'kart', g.card],
          ['sakinler', g.drawer, 'dock', g.dock],
          ['sakinler', g.drawer, 'yapı listesi', g.items],
          ['kart', g.card, 'dock', g.dock],
          ['kart', g.card, 'yapı listesi', g.items],
          ['kart', g.card, 'araç ipucu', g.hint],
          ['yapı listesi', g.items, 'dock', g.dock],
          // (30.2) sol alt sütun birbirine, dock'a, üst şeride, çiplere, sakinlere ve karta binmez
          ['açıklama', g.legend, 'dock', g.dock],
          ['açıklama', g.legend, 'üst çubuk', g.top],
          ['açıklama', g.legend, 'çipler', g.chips],
          ['açıklama', g.legend, 'sakinler', g.collapsed ? null : g.drawer],
          ['açıklama', g.legend, 'kart', g.card],
          ['rehber', g.guide, 'dock', g.dock],
          ['rehber', g.guide, 'açıklama', g.legend],
          ['rehber', g.guide, 'sakinler', g.collapsed ? null : g.drawer],
          ['rehber', g.guide, 'kart', g.card],
          ...g.story.flatMap((sc, i) => [
            [`hikâye kartı ${i + 1}`, sc, 'dock', g.dock],
            [`hikâye kartı ${i + 1}`, sc, 'üst çubuk', g.top],
            [`hikâye kartı ${i + 1}`, sc, 'açıklama', g.legend],
            [`hikâye kartı ${i + 1}`, sc, 'rehber', g.guide],
            [`hikâye kartı ${i + 1}`, sc, 'çipler', g.chips],
            [`hikâye kartı ${i + 1}`, sc, 'sakinler', g.collapsed ? null : g.drawer],
            [`hikâye kartı ${i + 1}`, sc, 'kart', g.card],
          ]),
        ];
        for (const [an, a, bn, b] of pairs) if (area(a, b) > 4) problems.push(`${label}: ${an} ile ${bn} üst üste biniyor (${px(a)} / ${px(b)})`);
        // Üst çubuk: geniş ekranda tek satır, dar ekranda bile ince
        if (g.top && g.top.height > (W >= 1240 ? 52 : 150)) problems.push(`${label}: üst çubuk çok yüksek (${Math.round(g.top.height)} px)`);
        // Dock: tek satır ve ortada
        if (g.dock) {
          if (g.dock.height > 62) problems.push(`${label}: dock birden çok satıra bölünmüş (${Math.round(g.dock.height)} px)`);
          if (Math.abs((g.dock.left + g.dock.right) / 2 - W / 2) > 2) problems.push(`${label}: dock ortada değil`);
        }
        // Kart: çekmeceyle aynı sağ kenarda, onun altında ve sütunun dibinde
        if (g.card) {
          // Açık liste kartla aynı sağ kenarda; kapalıyken kalan sekme çekmece kulpu gibi ekran kenarına yaslanır
          if (g.drawer && !g.collapsed && Math.abs(g.drawer.right - g.card.right) > 1) problems.push(`${label}: kart ile sakinler sağ kenarı hizasız (${Math.round(g.drawer.right)} / ${Math.round(g.card.right)})`);
          if (g.drawer && g.collapsed && Math.abs(g.drawer.right - W) > 1) problems.push(`${label}: kapalı çekmecenin sekmesi ekran kenarında değil (${Math.round(g.drawer.right)})`);
          if (g.drawer && !g.collapsed && Math.abs(g.drawer.width - g.card.width) > 1) problems.push(`${label}: kart ile sakinler genişliği farklı (${Math.round(g.drawer.width)} / ${Math.round(g.card.width)})`);
          if (g.drawer && g.card.top < g.drawer.bottom - 1 && !g.collapsed) problems.push(`${label}: kart sakinler listesinin altında değil`);
          if (Math.abs(g.cards.bottom - g.column.bottom) > 2 || g.card.bottom < g.cards.bottom - 2) problems.push(`${label}: kart sütunun dibine oturmuyor`);
          if (W > 620 && g.card.left < W / 2) problems.push(`${label}: kart sağ yarıda değil`);
        }
        // Ortalanmış pencere: tek, ortada, üst çubuğun ve dock'un arasında
        if (g.modals.length > 1) problems.push(`${label}: aynı anda ${g.modals.length} pencere açık`);
        for (const m of g.modals) {
          const b = rect(m);
          if (Math.abs((b.left + b.right) / 2 - W / 2) > 2) problems.push(`${label}: ${m.dataset.modal} penceresi ortada değil`);
          if (g.top && b.top < g.top.bottom - 1) problems.push(`${label}: ${m.dataset.modal} penceresi üst çubuğa biniyor`);
          if (g.dock && b.bottom > g.dock.top + 1) problems.push(`${label}: ${m.dataset.modal} penceresi dock'a biniyor`);
          if (!visible(q('.modal-backdrop'))) problems.push(`${label}: pencere açıkken zemin karartması yok`);
          if (!m.querySelector('.modal-close') || !visible(m.querySelector('.modal-close'))) problems.push(`${label}: ${m.dataset.modal} penceresinde ✕ yok`);
        }
        for (const p of shown('.dilemma-panel')) {
          const b = rect(p);
          if (b.left < -1 || b.right > W + 1 || b.top < -1 || b.bottom > H + 1) problems.push(`${label}: karar penceresi ekrana sığmıyor`);
        }
      };
      const select = (id) => {
        E.emit('ui:selectCharacter', id);
      };
      // 0. (30.2) sol alt sütun: iki hikâye kartı + Duygu açıklaması + rehber kartı + izlenenler, hepsi aynı anda
      {
        const dir = scene.storyDirector;
        const people = s.characters.filter((x) => !x.role);
        s.guide = { done: ['move', 'meet'], off: false };
        s.watched = people.slice(0, 3).map((x) => x.id);
        dir.queue = [];
        dir.visible = [];
        dir.paused = false;
        E.emit('relationship:married', { a: people[0], b: people[1] });
        E.emit('population:died', { character: people[2], age: 70, cause: 'age', text: 'Uzun bir hayat sürdü ve herkesin sevgisini kazandı' });
        scene.expression.setEnabled(true);
        if (window.innerWidth <= 620 && !q('.resident-drawer').classList.contains('is-collapsed')) q('.resident-toggle').click();
        await wait(320);
        game.render(0);
        await frame();
        game.render(0);
        if (shown('.story-card').length !== 2) problems.push(`hikâye kartı sayısı ${shown('.story-card').length} (2 bekleniyordu)`);
        if (!visible(q('.emotion-legend'))) problems.push('Duygu açıklaması görünmüyor');
        if (!visible(q('.guide-card'))) problems.push('rehber kartı görünmüyor');
        inspect('sol alt sütun (kartlar + açıklama + rehber)');
        scene.expression.setEnabled(false);
        dir.queue = [];
        dir.visible = [];
        game.render(0);
        s.watched = [];
        if (window.innerWidth <= 620 && q('.resident-drawer').classList.contains('is-collapsed')) q('.resident-tab').click();
        await wait(320);
      }
      // 1. Yapı kartı (han) ve sakin kartı
      E.emit('ui:selectBuilding', s.buildings.find((b) => b.type === 'inn').id);
      await frame();
      inspect('yapı kartı');
      select(s.characters[0].id);
      await frame();
      inspect('sakin kartı');
      // 2. Takas penceresi (kart sütununda)
      E.emit('ui:openTrade');
      await frame();
      inspect('takas kartı');
      select(s.characters[0].id);
      // 3. Çekmece kapalıyken sakin kartı
      q('.resident-toggle').click();
      await wait(260); // kapanma animasyonu bitsin
      inspect('çekmece kapalı + sakin kartı');
      if (!visible(q('.resident-tab')) || visible(q('.residents'))) problems.push('çekmece kapanınca yalnızca sekme kalmıyor');
      q('.resident-tab').click();
      await wait(320); // açılma animasyonu bitsin
      if (!visible(q('.residents')) || visible(q('.resident-tab'))) problems.push('sekmeye tıklayınca liste geri açılmıyor');
      // 4. İnşa aracı: yapı listesi dock'un üstünde
      E.emit('ui:setTool', { tool: 'build', buildType: 'cabin' });
      await frame();
      inspect('inşa listesi + kart');
      E.emit('ui:setTool', { tool: 'select' });
      // 5. Ortalanmış pencereler (kart açıkken)
      for (const [event, name] of [['ui:toggleGoals', 'Hedefler'], ['ui:toggleJournal', 'Günlük'], ['ui:toggleStats', 'Arşiv'], ['ui:toggleSettings', 'Ayarlar']]) {
        E.emit(event);
        await frame();
        inspect(`${name} penceresi`);
      }
      // Hepsi sırayla açıldı: yalnızca sonuncusu (Ayarlar) açık kalmalı
      const open = shown('.modal-window').map((m) => m.dataset.modal);
      if (open.join() !== 'settings') problems.push(`pencereler tek tek açılmıyor (${open.join(',')})`);
      E.emit('ui:toggleSettings');
      // 6. Karar penceresi
      s.dilemma.history = {};
      scene.dilemmas.maybeStart('bards');
      await frame();
      inspect('karar penceresi');
      if (s.dilemma.active) E.emit('ui:chooseDilemma', { optionId: 'decline' });
      // 7. Bildirim: üst çubuğa binmez; orta genişlikte sakinler listesine de binmez
      E.emit('toast', { text: 'Denetim bildirimi: kasabaya yeni bir sakin geldi, karşılamaya hazırlanın', tone: 'info', icon: 'sparkle' });
      await wait(400); // giriş animasyonu bitsin
      const g = regions();
      for (const t of shown('.toast')) {
        if (area(rect(t), g.top) > 4) problems.push('bildirim üst çubuğa biniyor');
        if (W > 620 && !g.collapsed && area(rect(t), g.drawer) > 4) problems.push(`bildirim sakinler listesine biniyor (${px(rect(t))})`);
        if (rect(t).left < -1 || rect(t).right > W + 1) problems.push('bildirim ekrandan taşıyor');
      }
      select(null);
      game.render(0);
      return problems;
    });
    if (shots) {
      await page.evaluate(() => {
        window.game.events.emit('ui:selectCharacter', window.game.state.characters[0].id);
        window.game.render(0);
      });
      await page.screenshot({ path: `${shots}/ui-${vp.width}x${vp.height}.png` });
      await page.evaluate(() => window.game.events.emit('ui:toggleJournal'));
      await page.screenshot({ path: `${shots}/ui-${vp.width}x${vp.height}-journal.png` });
      await page.evaluate(() => {
        window.game.events.emit('ui:toggleJournal');
        window.game.events.emit('ui:selectCharacter', null);
      });
    }
    results.push({ name: `arayüz yerleşimi ${vp.name}: çakışma ya da taşma yok`, ok: r.length === 0, detail: r.slice(0, 6).join(' | ') });
  }
  allErrors.push(...errors);
  await browser.close();
}

// =====================================================================================================================
// 8. Arayüz etkileşimi (17. aşama): gerçek fare tıklamaları ve tuşlarla sakinler çekmecesi, dock ve ipuçları,
//    ortalanmış pencereler (✕ / Esc / dışına tıklama), Ayarlar, üst çubuk ve harita ipucu
// =====================================================================================================================
{
  const W = 1366;
  const H = 768;
  const { browser, page, errors } = await openGame({ seed: 8, stopLoop: false, viewport: { width: W, height: H } });
  await page.evaluate(() => {
    localStorage.removeItem('lmgame.ui.residentsCollapsed');
    window.game.state.time.paused = true;
  });
  const ui = () =>
    page.evaluate(() => {
      const scene = window.game.scenes.current;
      // Sabit konumlu öğelerin (ipuçları) offsetParent'ı yoktur: görünürlüğü kutusundan anlaşılır
      const vis = (e) => Boolean(e) && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
      const q = (sel) => document.querySelector(sel);
      return {
        modals: [...document.querySelectorAll('.modal-window')].filter(vis).map((m) => m.dataset.modal),
        backdrop: vis(q('.modal-backdrop')),
        list: vis(q('.residents')) && vis(q('.resident-list')),
        tab: vis(q('.resident-tab')),
        tabCount: q('.resident-tab-count')?.textContent ?? '',
        selected: scene.selectedId,
        tool: scene.tools.tool,
        tooltip: vis(q('.map-tooltip')),
        tooltipName: q('.map-tip-name')?.textContent ?? '',
        dockTip: vis(q('.dock-tip')) ? `${q('.dock-tip-title').textContent} | ${q('.dock-tip-text').textContent}` : '',
      };
    });
  const until = async (fn, ms = 1500) => {
    const t0 = Date.now();
    let v = await ui();
    while (!fn(v) && Date.now() - t0 < ms) {
      await page.waitForTimeout(50);
      v = await ui();
    }
    return v;
  };
  const pass = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });

  // --- Sakinler çekmecesi: ▸ kapatır, sekme açar, tercih hatırlanır ---
  let u = await ui();
  const residents = await page.evaluate(() => window.game.state.characters.filter((c) => !c.visitor).length);
  pass('sakinler listesi açık başlar', u.list && !u.tab);
  await page.click('.resident-toggle');
  u = await until((v) => v.tab && !v.list);
  pass('▸ düğmesi sakinler listesini kapatır, yalnızca ince sekme kalır (kişi simgesi ve sayı)', !u.list && u.tab && u.tabCount === String(residents), `${u.tabCount}/${residents}`);
  const tabBox = await page.evaluate(() => {
    const t = document.querySelector('.resident-tab').getBoundingClientRect();
    return { w: t.width, h: t.height, right: t.right };
  });
  pass('kapalı çekmecenin sekmesi küçük ve sağ kenarda', tabBox.w < 90 && tabBox.h < 50 && W - tabBox.right < 12, JSON.stringify(tabBox));
  pass('çekmece tercihi hatırlanır', (await page.evaluate(() => localStorage.getItem('lmgame.ui.residentsCollapsed'))) === '1');
  await page.click('.resident-tab');
  u = await until((v) => v.list);
  pass('sekmeye tıklayınca liste sağdan açılır', u.list && !u.tab && (await page.evaluate(() => document.querySelector('.residents').classList.contains('is-opening') || document.querySelector('.resident-drawer').classList.contains('is-opening'))));
  pass('çekmece düğmeleri haritaya tıklama geçirmez', u.tool === 'select' && u.selected === null, JSON.stringify(u));

  // --- Dock: sıra, kısayollar, ipuçları ---
  const dock = await page.evaluate(() =>
    [...document.querySelectorAll('.dock .dock-btn')].map((b) => ({ label: b.querySelector('.dock-label').textContent, key: b.querySelector('.dock-key')?.textContent ?? '' }))
  );
  pass(
    'dock tek çubukta: İnşa Et, Topla, Yık | Hedefler, Günlük, Arşiv, Duygular, Fotoğraf, Ayarlar',
    dock.map((d) => d.label).join(',') === 'İnşa Et,Topla,Yık,Hedefler,Günlük,Arşiv,Duygular,Fotoğraf,Ayarlar' && dock.map((d) => d.key).join(',') === 'B,H,X,O,J,I,M,F,',
    dock.map((d) => `${d.label}(${d.key})`).join(' ')
  );
  await page.hover('.dock .journal-toggle');
  u = await until((v) => v.dockTip);
  pass('dock düğmesinin üzerine gelince kısayol ve açıklama ipucu belirir', u.dockTip.startsWith('Günlük · J') && u.dockTip.length > 20, u.dockTip);
  const tipBoxes = [];
  for (const sel of ['.dock .tool-btn[data-tool="build"]', '.dock .settings-toggle']) {
    await page.hover(sel);
    await page.waitForTimeout(60);
    tipBoxes.push(
      await page.evaluate((sel) => {
        const t = document.querySelector('.dock-tip').getBoundingClientRect();
        const b = document.querySelector(sel).getBoundingClientRect();
        return { left: t.left, right: t.right, bottom: t.bottom, btnTop: b.top };
      }, sel)
    );
  }
  pass('dock ipucu düğmenin üstünde ve ekranın içinde', tipBoxes.every((t) => t.left >= 0 && t.right <= W && t.bottom <= t.btnTop), JSON.stringify(tipBoxes));
  await page.mouse.move(W / 2, H / 2);
  u = await until((v) => !v.dockTip);
  pass('fare dock\'tan çıkınca ipucu kaybolur', !u.dockTip);

  // --- Ortalanmış pencereler ---
  await page.evaluate(() => window.game.events.emit('ui:selectCharacter', window.game.state.characters[0].id));
  await page.waitForTimeout(100);
  const chosen = (await ui()).selected;
  await page.click('.dock .goals-toggle');
  u = await until((v) => v.modals.length);
  const goalsBox = await page.evaluate(() => document.querySelector('[data-modal="goals"]').getBoundingClientRect().toJSON());
  pass('Hedefler düğmesi pencereyi ekranın ortasında açar', u.modals.join() === 'goals' && u.backdrop && Math.abs((goalsBox.left + goalsBox.right) / 2 - W / 2) <= 2, JSON.stringify(u.modals));
  await page.click('.dock .journal-toggle');
  u = await until((v) => v.modals.join() === 'journal');
  pass('pencere açıkken başkasını açmak öncekini kapatır (aynı anda tek pencere)', u.modals.join() === 'journal' && u.backdrop, u.modals.join());
  await page.keyboard.press('Escape');
  u = await until((v) => !v.modals.length);
  pass('Esc açık pencereyi kapatır, seçili sakine dokunmaz', !u.modals.length && !u.backdrop && u.selected === chosen && u.tool === 'select', JSON.stringify({ sel: u.selected, chosen }));
  await page.keyboard.press('Escape');
  u = await until((v) => v.selected === null);
  pass('pencere yokken Esc eskisi gibi seçimi bırakır', u.selected === null);
  await page.keyboard.press('KeyI');
  u = await until((v) => v.modals.length);
  pass('I tuşu Kasaba Arşivi\'ni açar', u.modals.join() === 'archive');
  await page.click('[data-modal="archive"] .modal-close');
  u = await until((v) => !v.modals.length);
  pass('✕ düğmesi pencereyi kapatır', !u.modals.length && !u.backdrop);
  await page.click('.dock .settings-toggle');
  u = await until((v) => v.modals.length);
  pass('Ayarlar düğmesi Ayarlar penceresini açar', u.modals.join() === 'settings');
  await page.mouse.click(40, H / 2);
  u = await until((v) => !v.modals.length);
  pass('pencerenin dışına tıklamak pencereyi kapatır, tıklama haritaya geçmez', !u.modals.length && u.selected === null && u.tool === 'select', JSON.stringify(u));
  await page.keyboard.press('KeyO');
  u = await until((v) => v.modals.length);
  pass('O tuşu Kasaba Hedefleri\'ni açar', u.modals.join() === 'goals');
  await page.keyboard.press('KeyO');
  u = await until((v) => !v.modals.length);
  pass('O tuşuna yeniden basmak Hedefler\'i kapatır', !u.modals.length);
  await page.keyboard.press('KeyG');
  u = await until((v) => v.modals.length);
  pass('eski G kısayolu da Hedefler\'i açar', u.modals.join() === 'goals');
  await page.keyboard.press('KeyJ');
  u = await until((v) => v.modals.join() === 'journal');
  pass('J tuşu Hedefler açıkken Günlük\'e geçer', u.modals.join() === 'journal');
  await page.keyboard.press('Escape');
  await until((v) => !v.modals.length);
  // Karar penceresi açıkken Esc pencereleri ve kararı kapatmaz
  await page.evaluate(async () => {
    const s = window.game.state;
    const { DILEMMAS } = await import('/src/data/dilemmas.js');
    s.dilemma.history = {};
    for (const id of Object.keys(DILEMMAS)) if (window.game.scenes.current.dilemmas.maybeStart(id)) break;
  });
  await page.waitForTimeout(100);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const dilemmaOpen = await page.evaluate(() => Boolean(window.game.state.dilemma.active) && !document.querySelector('.dilemma').hidden);
  pass('karar penceresi Esc ile kaybolmaz (seçim beklenir)', dilemmaOpen);
  await page.evaluate(() => window.game.events.emit('ui:chooseDilemma', { optionId: window.game.state.dilemma.active.defaultId }));
  await page.evaluate(() => (window.game.state.time.paused = true));

  // --- Ayarlar: kaydet / yükle / yeni harita onayı ---
  await page.click('.dock .settings-toggle');
  await until((v) => v.modals.length);
  await page.evaluate(() => localStorage.removeItem('lmgame.save.v2'));
  await page.click('.settings-save');
  await page.waitForTimeout(150);
  const saved = await page.evaluate(() => ({ save: Boolean(localStorage.getItem('lmgame.save.v2')), load: !document.querySelector('.settings-load').disabled, info: document.querySelector('.settings-save-info').textContent }));
  pass('Ayarlar > Kaydet oyunu kaydeder, Yükle etkinleşir', saved.save && saved.load && saved.info.startsWith('Son kayıt'), JSON.stringify(saved));
  await page.click('.settings-new');
  const confirm = await page.evaluate(() => ({ confirm: !document.querySelector('.settings-confirm').hidden, row: !document.querySelector('.settings-save').closest('.settings-row').hidden }));
  await page.click('.settings-confirm button:not(.is-danger)');
  const back = await page.evaluate(() => ({ confirm: !document.querySelector('.settings-confirm').hidden, seed: window.game.state.seed }));
  pass('Yeni Harita önce onay ister, Vazgeç geri döner', confirm.confirm && !confirm.row && !back.confirm, JSON.stringify({ confirm, back }));
  await page.keyboard.press('Escape');
  await until((v) => !v.modals.length);

  // --- Üst çubuk: tek satır, hız ve duraklatma düğmeleri, temel kaynaklar ---
  const bar = await page.evaluate(() => {
    const hud = document.querySelector('.hud.topbar');
    const b = hud.getBoundingClientRect();
    return {
      h: b.height,
      zones: ['.hud-zone-town', '.hud-zone-time', '.hud-zone-res'].map((z) => Boolean(hud.querySelector(z))),
      town: hud.querySelector('.hud-town-name')?.textContent,
      speeds: [...hud.querySelectorAll('.hud-speed button[data-speed]')].map((x) => x.textContent.trim()),
      pause: Boolean(hud.querySelector('.hud-speed button:not([data-speed])')),
      resources: hud.querySelectorAll('.hud-zone-res .resource:not(.is-goods)').length,
      welfare: Boolean(hud.querySelector('.hud-welfare')),
      mute: Boolean(hud.querySelector('.hud-mute')),
    };
  });
  pass(
    'üst çubuk tek satır: kasaba adı, zaman ve hız, kaynaklar ve refah',
    bar.h <= 52 && bar.zones.every(Boolean) && bar.town && bar.speeds.join() === '1x,2x,4x' && bar.pause && bar.resources >= 4 && bar.welfare && bar.mute,
    JSON.stringify(bar)
  );
  await page.click('.hud-speed [data-speed="2"]');
  await page.waitForTimeout(100);
  const sp = await page.evaluate(() => ({ speed: window.game.state.time.speed, paused: window.game.state.time.paused }));
  pass('üst çubuktaki 2x düğmesi hızı ayarlar ve oyunu sürdürür', sp.speed === 2 && !sp.paused, JSON.stringify(sp));
  await page.click('.hud-speed button:first-child');
  await page.waitForTimeout(100);
  pass('üst çubuktaki duraklat düğmesi oyunu durdurur', await page.evaluate(() => window.game.state.time.paused));

  // --- Harita ipucu: yalnızca Seç aracında, pencere yokken, imlecin yanında ---
  await page.mouse.move(W / 2 - 80, H / 2 + 30);
  await page.mouse.move(W / 2 - 70, H / 2 + 40);
  u = await until((v) => v.tooltip, 1500);
  const tipAt = await page.evaluate(() => document.querySelector('.map-tooltip').getBoundingClientRect().toJSON());
  pass('harita ipucu imlecin altındaki karoyu gösterir', u.tooltip && u.tooltipName.length > 1 && Math.abs(tipAt.left - (W / 2 - 70)) < 60 && Math.abs(tipAt.top - (H / 2 + 40)) < 60, `${u.tooltipName} @${Math.round(tipAt.left)},${Math.round(tipAt.top)}`);
  await page.keyboard.press('KeyB');
  u = await until((v) => !v.tooltip);
  pass('inşa aracı seçilince harita ipucu gizlenir (araç ipucu dock\'ta)', !u.tooltip && u.tool === 'build');
  await page.keyboard.press('Escape');
  await page.keyboard.press('KeyJ');
  u = await until((v) => v.modals.length && !v.tooltip);
  pass('pencere açıkken harita ipucu gizlenir', !u.tooltip && u.tool === 'select' && u.modals.join() === 'journal', JSON.stringify(u));
  await page.keyboard.press('Escape');

  // --- Sakin kartı: listedeki satıra tıklayınca sağ altta bağımsız kart ---
  await page.click('.residents .resident-row');
  await page.waitForTimeout(150);
  const card = await page.evaluate(() => {
    const c = document.querySelector('.ui-cards .character-panel:not(.trade-panel)');
    const l = document.querySelector('.residents').getBoundingClientRect();
    const b = c && !c.hidden ? c.getBoundingClientRect() : null;
    return b && { right: b.right, left: b.left, top: b.top, listRight: l.right, listBottom: l.bottom };
  });
  pass('listeden seçilen sakinin kartı sağ altta, listeyle aynı hizada açılır', card && Math.abs(card.right - card.listRight) <= 1 && card.top >= card.listBottom && card.left > W / 2, JSON.stringify(card));
  pass('etkileşim boyunca sayfa hatası yok', errors.length === 0, errors.slice(0, 2).join(' | '));
  allErrors.push(...errors);
  await browser.close();
}

// =====================================================================================================================
// 9. (27.3) Gerçek fareyle gezgin konuk kartı ve havuzdaki Büyük Ziyafet Sofrası bloğu; canlı çizimde balon ölçümü ve
//    konuk aksesuarının kuyruğa sabit işlevle girmesi (oyun döngüsü çalışırken, gerçek kareler)
// =====================================================================================================================
{
  const W = 1366;
  const H = 768;
  const { browser, page, errors } = await openGame({ seed: 8, stopLoop: false, viewport: { width: W, height: H } });
  const pass = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });
  await page.evaluate(async () => {
    const game = window.game;
    const s = game.state;
    s.time.paused = true;
    s.goldenAge.since = s.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
    const scene = game.scenes.current;
    const { GUEST_TYPES } = await import('/src/data/guest.js');
    const { Random } = await import('/src/utils/random.js');
    const entry = scene.world.findEntryTile(new Random(3));
    const p = scene.world.standPoint(entry.x, entry.y);
    s.activeGuest = { type: 'collector', name: GUEST_TYPES.collector.names[0], look: 0, arrivalDay: s.time.day, departureDay: s.time.day + 1, x: p.x, y: p.y, leaving: false, resting: false, barters: 0, lastBarterDay: null, exit: null };
    scene.guestSystem.spawn();
    const g = scene.guestSystem.character;
    g.visible = true;
    g.clearPath();
    // Konuğu meydanın yakınında, üstünde sakin olmayan bir karoya koy ve ekranın ortasına al (kamera doğrudan)
    const plaza = scene.world.landmarks.plaza;
    for (let r = 2; r < 12; r++) {
      const q = scene.world.standPoint(plaza.centerX + r, plaza.centerY + 1);
      g.x = q.x;
      g.y = q.y;
      if (scene.world.findCharacterAt(g.x, g.y - 6) === g) break;
    }
    const cam = scene.camera;
    cam.x = g.x - 683 / cam.zoom;
    cam.y = g.y - 6 - 384 / cam.zoom;
    // Canlı çizimde ölçüm sayacı ve kuyruğa giren işlevler
    window.__measures = 0;
    const real = CanvasRenderingContext2D.prototype.measureText;
    CanvasRenderingContext2D.prototype.measureText = function (t) { if (t === 'Takas zamanı, dostlar!') window.__measures++; return real.call(this, t); };
    g.speech = { text: 'Takas zamanı, dostlar!', at: -1, duration: 600 };
    window.__fns = new Set();
    const q = scene.queue;
    const realCall = q.addCall.bind(q);
    q.addCall = (sortY, fn, ...rest) => { window.__fns.add(fn); return realCall(sortY, fn, ...rest); };
  });
  await page.waitForTimeout(600); // ~30+ gerçek kare
  const live = await page.evaluate(() => ({ measures: window.__measures, fns: window.__fns.size, frames: performance.now() }));
  pass('27.3: canlı çizimde konuşma balonu metni bir kez ölçülür (karelerce measureText yok)', live.measures === 1, `${live.measures}`);
  pass('27.3: canlı çizimde konuk aksesuarı kuyruğa her karede aynı sabit işlevle girer (kapanış yok)', live.fns === 1, `${live.fns}`);
  // Bir kare sonra (kamera sınırlara oturduktan sonra) ekran konumu
  const pt = await page.evaluate(() => {
    const scene = window.game.scenes.current;
    const g = scene.world.guests[0];
    const cam = scene.camera;
    return { x: (g.x - cam.x) * cam.zoom, y: (g.y - 6 - cam.y) * cam.zoom };
  });
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(250);
  const g1 = await page.evaluate(() => {
    const c = document.querySelector('.guest-panel');
    const b = c && !c.hidden ? c.getBoundingClientRect().toJSON() : null;
    const col = document.querySelector('.ui-cards').getBoundingClientRect().toJSON(); // kart sütunu kendi içinde kaydırılır
    return { open: Boolean(b), box: b, col, text: c?.textContent ?? '', selected: window.game.scenes.current.guestSelected, offers: c?.querySelectorAll('.guest-offer').length ?? 0 };
  });
  pass('27.3: gerçek fareyle Nadir Takasçı\'ya tıklamak misafir kartını sağ altta açar (ad, tür, takas teklifleri)', g1.open && g1.selected && g1.text.includes('Nadir Takasçı') && g1.offers === 3 && g1.box.right <= W && g1.box.left > W / 2 && g1.col.bottom <= H && g1.col.top >= 0, `${JSON.stringify(g1.box)} sütun ${JSON.stringify(g1.col)}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  pass('27.3: Esc misafir kartını kapatır', await page.evaluate(() => document.querySelector('.guest-panel').hidden && !window.game.scenes.current.guestSelected));
  // Havuz: süren sofra
  const fp = await page.evaluate(async () => {
    const game = window.game;
    const s = game.state;
    const scene = game.scenes.current;
    const FA = await import('/src/systems/Fair.js');
    let f = scene.world.getCompleted('fountain')[0];
    if (!f) {
      const { x, y } = window.sim?.findSpot?.('fountain') ?? {};
      if (x !== undefined) {
        const r = scene.construction.placeSite('fountain', x, y);
        scene.construction.complete(r.building);
        f = r.building;
      }
    }
    let day = s.time.day;
    while (!FA.isFairDay(day)) day++;
    Object.assign(s.time, { day, hour: 19, minute: 0 });
    s.currentFestival = { type: 'summer', day, phase: 'party', participants: [] };
    s.currentFeast = { tier: 'modest', day, contributions: { food: 30, bread: 6, sherbet: 0, cloth: 0 }, servings: 20, served: 4, eatenIds: [] };
    s.buffs.tradition = s.totalMinutes + 600;
    const cam = scene.camera;
    cam.x = f.center.x - 683 / cam.zoom;
    cam.y = f.center.y - 384 / cam.zoom;
    return { x: 683, y: 384, ok: Boolean(f) };
  });
  await page.waitForTimeout(150);
  await page.mouse.click(fp.x, fp.y);
  await page.waitForTimeout(250);
  const feast = await page.evaluate(() => {
    const box = document.querySelector('.building-feast');
    return { shown: Boolean(box) && !box.hidden, text: box?.textContent ?? '' };
  });
  pass('27.3: gerçek fareyle meydan havuzuna tıklayınca panelde Mütevazı Sofra, kilerden ayrılanlar, ikram ve Gelenek Bağı görünür', fp.ok && feast.shown && feast.text.includes('Mütevazı Sofra') && feast.text.includes('Yiyecek 30 · Ekmek 6') && feast.text.includes('4/20 verildi') && feast.text.includes('Gelenek Bağı'), feast.text.slice(0, 160));
  pass('27.3: etkileşim boyunca sayfa hatası yok', errors.length === 0, errors.slice(0, 2).join(' | '));
  allErrors.push(...errors);
  await browser.close();
}

const ok = report(allErrors);
process.exit(ok ? 0 : 1);
