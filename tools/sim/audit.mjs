// Denetim testleri (15. aşama öncesi kod denetimi): kalıcı hataların bir daha dönmemesi için uçtan uca kontroller.
//
//   1. Olay aboneliği sızıntısı: Yükle / Yeni Harita sahneyi yeniden kurunca dinleyici sayısı sabit kalır
//   2. Kayıt / yükleme senaryoları: festivalin ortası, tüccar pazardayken, karar penceresi açıkken, harabe onarılırken,
//      fırtına yaklaşırken / gök gürültülü fırtınada, toplanma zili çalarken, (16. aşama) sefer yoldayken macera penceresi açıkken. Her birinde kayıt -> yükleme -> yeniden
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
import { openGame, createChecks, parseArgs, BASE_URL } from './lib.mjs';
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
    check('kriz sırasında kimse kaybolmaz', s.characters.length === pop && pop > 0, `${pop} sakin`);
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
    'dock tek çubukta: İnşa Et, Topla, Yık | Hedefler, Günlük, Arşiv, Fotoğraf, Ayarlar',
    dock.map((d) => d.label).join(',') === 'İnşa Et,Topla,Yık,Hedefler,Günlük,Arşiv,Fotoğraf,Ayarlar' && dock.map((d) => d.key).join(',') === 'B,H,X,O,J,I,F,',
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

const ok = report(allErrors);
process.exit(ok ? 0 : 1);
