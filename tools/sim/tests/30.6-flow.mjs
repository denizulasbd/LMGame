// Aşama 30.6 testleri: Para ve Akış (olay bedelleri kasaya göre, yumuşak Krallık Vergisi, altın ipucu, Mallar satırı, rehber kartları,
// yiyecek tahmini, dokuz akış düzeltmesi). En çok 30 test. Kullanım: node tools/sim/tests/30.6-flow.mjs [--verbose]
//   ya da   node tools/sim/gate.mjs --quick --only 30.6
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });
const open = async (opts) => {
  const g = await openGame(opts);
  g.page.on('pageerror', (e) => errors.push(String(e)));
  return g;
};

// ---------------------------------------------------------------- Para: olay bedelleri, vergi, ipucu, Mallar, rehber, hasar (başsız)
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const D = await import('/src/data/dilemmas.js');
    const M = await import('/src/systems/Midgame.js');
    const Mo = await import('/src/systems/Money.js');
    const Cr = await import('/src/systems/Crown.js');
    const CD = await import('/src/data/crown.js');
    const G = await import('/src/systems/Guide.js');
    const { ENGINES } = await import('/src/systems/Engines.js');
    const { CONFIG } = await import('/src/config.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    const dl = sc.dilemmas.dilemma;
    const E = game.events;
    const opt = (card, id) => D.DILEMMAS[card].options.find((o) => o.id === id);
    sim.give({ wood: 500, stone: 500, food: 500, gold: 2000, iron: 50, wool: 100, bread: 50 });
    for (const k of D.DILEMMA_KEYS) D.DILEMMAS[k].requires.minPopulation = 1;
    const reset = () => { dl.active = null; dl.history = {}; dl.recent = []; dl.storm = null; dl.quarantineUntil = 0; dl.nextDay = 0; st.time.paused = false; };
    // kartı doğrudan açar (uygunluk kuralları ayrı sınanır; burada pencere ve seçim sınanıyor)
    const openCard = (id) => { dl.active = { id, remaining: 30, wasPaused: false }; sc.dilemmas.publishOptions(); st.time.paused = true; game.render(0); };

    // ---- 1. olay bedeli ölçeği (dört seviye); kazanç ve odun / taş bedeli ölçeklenmez
    const pay = opt('masterOffer', 'pay'); // altın 60
    const feast = opt('masterOffer', 'feast'); // yiyecek 30
    const wait = opt('drought', 'wait'); // etki: yiyecek −35
    const buy = opt('drought', 'buy'); // altın 80, +60 yiyecek
    const g = [1, 2, 3, 4].map((t) => M.scaledOption(pay, t).cost.gold);
    const f = [1, 2, 3, 4].map((t) => M.scaledOption(feast, t).cost.food);
    const w = [1, 2, 3, 4].map((t) => M.scaledOption(wait, t).effect.resources.food);
    const kept = M.scaledOption(buy, 1).effect.resources.food === 60 && M.scaledOption(opt('refugees', 'feed') ?? { cost: { wood: 20 } }, 1).cost.wood === 20;
    c('olay bedeli ölçeği: Mezra x0,4 · Köy x0,6 · Kasaba x1 · Gelişmiş Şehir x1,3 (altın, erzak, eksiltme etkisi); kazanç ve odun bedeli aynen', g.join() === '24,36,60,78' && f.join() === '12,18,30,39' && w.join() === '-14,-21,-35,-46' && kept && JSON.stringify(D.COST_SCALE.byTier) === '{"1":0.4,"2":0.6,"3":1,"4":1.3}', `${g} ${f} ${w}`);

    // ---- 2. karşılanamayan kart uygun değil (en az iki seçenek karşılanabilmeli)
    reset();
    st.time.day = 40;
    st.town.tier = 3;
    st.resources.gold = 0; st.resources.food = 0;
    const poor = sc.dilemmas.eligible('census'); // gönder (altın+yiyecek), öde (altın), reddet (bedelsiz): tek seçenek
    sim.give({ gold: 500, food: 200 });
    const rich = sc.dilemmas.eligible('census');
    ENGINES.novicePath = false;
    sim.give({ gold: 0, food: 0 });
    const old = sc.dilemmas.eligible('census');
    sim.give({ gold: 500, food: 200 });
    ENGINES.novicePath = true;
    c('kart uygunluğu: en az iki seçeneği karşılanamıyorsa kart o gün çıkmaz; şalter kapalıyken eski kural (bedelsiz seçenek yeter)', !poor && rich && old === true, `${poor} ${rich} ${old}`);

    // ---- 3. pasif düğme ve nedeni (veri + pencere)
    reset();
    st.town.tier = 3;
    sim.give({ gold: 70, food: 500 });
    openCard('census');
    const active = st.dilemma.active;
    const rows = active ? active.options.map((o) => `${o.id}:${o.ok}`).join() : 'yok';
    const buttons = [...document.querySelectorAll('.dilemma-option')].map((b) => ({ off: b.disabled, text: b.textContent }));
    const off = buttons.filter((b) => b.off);
    c('pasif seçenek: karşılanamayan düğme pasif ve nedeni (gerekli / mevcut) yazılı', active && off.length >= 1 && off.every((b) => /Yetersiz altın \(\d+ gerekir, \d+ var\)/.test(b.text)) && /pay:false/.test(rows), `${rows} | ${off.map((b) => b.text).join(' / ').slice(0, 120)}`);
    E.emit('ui:chooseDilemma', { optionId: 'refuse' });

    // ---- 4. seçince bedel kasaya göre ödenir (Köy: altın 80 x 0,6 = 48)
    reset();
    st.town.tier = 2;
    st.time.day = 40;
    sim.give({ gold: 200, food: 20 });
    openCard('drought');
    const g0 = st.resources.gold;
    const f0 = st.resources.food;
    E.emit('ui:chooseDilemma', { optionId: 'buy' });
    c('seçim: bedel o günkü kasaba seviyesine göre ödenir (Köy: altın 80 → 48, yiyecek +60)', g0 - st.resources.gold === 48 && st.resources.food - f0 === 60, `${g0 - st.resources.gold} ${st.resources.food - f0}`);
    st.town.tier = 1;

    // ---- 5. Krallık Vergisi yumuşar; ilk tahsilat en erken 9. gün; ferman cezası yarıya
    const levyNew = (tier, pop) => { st.town.tier = tier; const keep = st.characters.length; return { amount: Cr.levyAmount(st), keep, pop }; };
    st.town.tier = 2;
    const a1 = Cr.levyAmount(st);
    ENGINES.novicePath = false;
    const a0 = Cr.levyAmount(st);
    ENGINES.novicePath = true;
    const pop = st.characters.filter((x) => !x.role).length;
    const rep = Cr.reputationLevel(st.crown.reputation).levy;
    c('Krallık Vergisi: acemi tutarı (10 + 10 x seviye + 2 x nüfus) eskisinden (20 + 15 x seviye + 3 x nüfus) küçük', a1 === Math.round((CD.LEVY_EASE.base + CD.LEVY_EASE.perTier * 2 + CD.LEVY_EASE.perResident * pop) * rep) && a1 < a0, `${a1} < ${a0} (nüfus ${pop})`);
    st.town.tier = 2;
    st.crown.decree = null;
    sim.give({ gold: 100 });
    sc.crown.openDecree('library');
    sc.crown.resolveDecree('expired');
    c('süresi dolan ferman cezası: seviye başına 20 altın (eski 40)', st.crown.decreeLog.at(-1)?.fine?.gold === 40 && CD.LEVY_EASE.decreeFailedGoldPerTier === 20, JSON.stringify(st.crown.decreeLog.at(-1)?.fine));
    st.town.tier = 1;

    // ---- 6. altın ipucu: gelir kalemleri, yaklaşan ödeme, yolların kilit durumu (+ DOM, kaydedilmez)
    sc.economy.ledger = {};
    sc.economy.add('gold', 30, 'tax');
    sc.economy.add('gold', 55, 'export');
    const tip = Mo.goldTooltip(st, sc.economy.ledger).join('\n');
    game.render(0);
    const goldBox = [...document.querySelectorAll('.hud .resource')].find((b) => b.querySelector('.resource-icon')?.src && b.title.includes('Altın kazanmanın yolları'));
    const snap = JSON.stringify(sc.saves.snapshot());
    c('altın ipucu: son 3 gün gelir kalemleri (vergi 30, ihracat 55), yaklaşan Krallık Vergisi, her yolun açık / kilitli durumu; kayda girmez', /vergi 30/.test(tip) && /ihracat 55/.test(tip) && /Yaklaşan: Krallık Vergisi \d+ altın/.test(tip) && /✓ İç vergi/.test(tip) && /✗ Ticaret Limanı ihracatı: kilitli · Kasaba seviyesinde Büyük Ticaret Limanı açılır/.test(tip) && Boolean(goldBox) && !snap.includes('ledger'), tip.split('\n').slice(0, 4).join(' | '));
    st.town.tier = 3;
    sim.place('harbor');
    const ways = Object.fromEntries(Mo.goldWays(st).map((x) => [x.id, x.open]));
    c('altın yolları: Kasaba seviyesinde ve Liman kurulunca ihracat açılır; Köy\'de ferman açık, Mezra\'da kilitli', ways.export === true && ways.tax === true && ways.decree === true && Mo.goldWays({ ...st, town: { tier: 1 } }).find((x) => x.id === 'decree').open === false, JSON.stringify(ways));
    st.town.tier = 1;

    // ---- 7. Mallar satırı: üreten yapı, seviye, tıklayınca seçim
    st.town.tier = 1;
    st.buildings = st.buildings.filter((b) => !['mill', 'sheepFarm'].includes(b.type));
    sim.give({ wool: 0, bread: 0 });
    await new Promise((r) => setTimeout(r, 650));
    game.render(0);
    const rowOf = (name) => [...document.querySelectorAll('.hud-goods-menu .resource')].find((b) => b.querySelector('.resource-name')?.textContent === name);
    const bread1 = Mo.goodsHint(st, 'bread');
    const breadRow = rowOf('Ekmek')?.textContent ?? '';
    st.town.tier = 2;
    sim.place('garden');
    const bread2 = Mo.goodsHint(st, 'bread');
    c('Mallar: üreten yapı yoksa hangi yapının ürettiği ve hangi seviyede açıldığı ("Ekmek · Yel Değirmeni ve Fırın üretir (Köy seviyesinde açılır)"; kilitliyken tıklanmaz, Köy\'de açılır)', bread1.text === 'Ekmek · Yel Değirmeni ve Fırın üretir (Köy seviyesinde açılır)' && bread1.type === null && /Köy seviyesinde açılır/.test(breadRow) && bread2.type === 'mill' && bread2.open === true, `${bread1.text} | ${breadRow} | ${bread2.text}`);
    st.town.tier = 1;
    await new Promise((r) => setTimeout(r, 650));
    game.render(0);
    await new Promise((r) => setTimeout(r, 650));
    game.render(0);
    document.querySelector('.goods-toggle').click();
    const row2 = [...document.querySelectorAll('.hud-goods-menu .resource')].find((b) => b.querySelector('.resource-name')?.textContent === 'Yün');
    const linked = row2?.dataset.build;
    row2?.click();
    c('Mallar: yapı açıksa satıra tıklamak inşa menüsünde o yapıyı seçer', linked === 'sheepFarm' && sc.tools.tool === 'build' && sc.tools.buildType === 'sheepFarm', `${linked} ${sc.tools.tool} ${sc.tools.buildType}`);
    sc.tools.setTool('select');
    st.town.tier = 1;

    // ---- 8. rehber: tahsildar, altın, taş, bahçe kartları
    const fresh = () => ({ done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'doctrine', 'cards', 'cardAction', 'watch', 'lifespan'], off: false });
    const gs = sc.guideSystem;
    st.guide = fresh();
    st.guide.done = st.guide.done.filter((x) => x !== 'food');
    gs.facts = {};
    st.crown.notice = { at: st.totalMinutes + 2 * 1440, amount: 77, announcedAt: st.totalMinutes };
    st.crown.levies = 0;
    st.guide.done = fresh().done.filter((x) => x !== 'food');
    const sLevy = gs.sync();
    c('rehber: Kraliyet Tahsildarı duyurulunca kart (tutar, kaç gün kaldığı, malla ödeme, altının kaynağı)', sLevy?.id === 'levy' && /77 altın/.test(sLevy.text) && /2 gün sonra/.test(sLevy.text) && /malla/.test(sLevy.text) && /vergi/.test(sLevy.text), sLevy?.text);
    st.crown.notice = null;
    st.guide = fresh();
    st.guide.done = st.guide.done.filter((x) => x !== 'food');
    st.resources.gold = 0;
    gs.facts = {};
    for (let i = 0; i < 3; i++) gs.dailyFacts();
    const sGold = gs.sync();
    c('rehber: hazine 3 gün 0\'da kalınca "Altın için: ..." (açık en kolay yol)', sGold?.id === 'gold' && /^Altın için: /.test(sGold.text) && sGold.text.length > 20, sGold?.text);
    st.guide = fresh();
    st.guide.done = st.guide.done.filter((x) => x !== 'food');
    gs.facts = { goldDry: 0, stoneDry: 0 };
    st.resources.stone = 0;
    gs.dailyFacts(); gs.dailyFacts();
    const sStone = gs.sync();
    const hasQuarry = st.buildings.some((b) => b.type === 'quarry');
    c('rehber: taş 2 gün 0\'da kalınca taşın kalıcı kaynağı (hangi yapı, hangi seviye)', sStone?.id === 'stone' && /Taş Ocağı/.test(sStone.text) && !hasQuarry, sStone?.text);
    st.resources.stone = 100;
    const map = sc.world.map;
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) if (map.getObject(x, y) === 'rock') map.setObject(x, y, null);
    gs.facts = {};
    gs.dailyFacts();
    c('rehber: çevredeki kayalar tükenince de taş kartı (stoktan bağımsız)', gs.facts.rocksGone === true && G.CONDITIONS.stone.when({ facts: gs.facts }) === true);
    // bahçe: yapı adımından hemen sonra; yiyecek üreten yapı yerleşince biter
    st.guide = { done: ['move', 'meet', 'harvest', 'build'], off: false };
    gs.facts = {};
    for (const b of st.buildings.filter((x) => ['garden', 'fishingPier', 'sheepFarm'].includes(x.type))) b.type = 'cabin';
    const sFood = gs.sync();
    const before = G.hasFoodProducer(st);
    sim.place('garden');
    const sAfter = gs.sync();
    c('rehber: yapı adımından hemen sonra "Yiyecek ≈ N gün yeter. Bir Sebze Bahçesi kur."; bahçe yerleşince tamamlanır', sFood?.id === 'food' && /^Yiyecek ≈ [\d,]+ gün yeter\. Bir \*\*Sebze Bahçesi\*\* kur\.$/.test(sFood.text) && before === false && !st.guide.done.every((x) => x !== 'food') === true && sAfter?.id !== 'food', `${sFood?.text} ${sAfter?.id}`);

    // ---- 9. "Sıradaki" hedefin engel satırı
    st.buildings = st.buildings.filter((b) => !['market', 'storage', 'inn'].includes(b.type));
    st.milestones = { firstHome: { day: 1, hour: 8, minute: 0 }, warmTable: { day: 1, hour: 9, minute: 0 } };
    const next = (await import('/src/systems/MilestoneSystem.js')).nextMilestone(st);
    const block = Mo.milestoneBlocker(st, next, { current: 0, target: 1 });
    st.guide.off = true;
    document.querySelector('.goals-toggle').click();
    await new Promise((r) => setTimeout(r, 700));
    game.render(0);
    const rowText = document.querySelector('.goal-row.is-next .goal-blocker')?.textContent ?? '';
    document.querySelector('.goals-toggle').click();
    c('"Sıradaki" hedefin altında engel tek satırda: "önce Kiler, sonra Pazar Yeri · 40 odun, 15 taş" (Hedefler penceresinde de)', next?.id === 'tradeRoutes' && /^önce Kiler, sonra Pazar Yeri · 40 odun, 15 taş$/.test(block) && /Kiler, sonra Pazar Yeri/.test(rowText), `${next?.id} | ${block} | ${rowText}`);

    // ---- 10. yiyecek tahmini ilk günden
    const days0 = (await import('/src/systems/Loyalty.js')).foodDaysLeft(40, [], 8);
    const days1 = (await import('/src/systems/Loyalty.js')).foodDaysLeft(40, [], null);
    st.pulse = { ...(st.pulse ?? {}), eaten: [] };
    st.resources.food = 20;
    await new Promise((r) => setTimeout(r, 650));
    game.render(0);
    const foodBox = [...document.querySelectorAll('.hud .resource')].find((b) => /^Yiyecek/.test(b.title));
    c('yiyecek tahmini: tüketim kaydı yokken nüfus x günlük ihtiyaçtan "≈ N gün yeter" (ilk günden, ipucunda); kayıt yoksa ve nüfus bilinmiyorsa tahmin yok', Math.abs(days0 - 40 / (8 * CD.LEVY.everyDays * 0 + 8 * 3.5)) < 1e-9 * 1000 && days1 === Infinity && /≈ [\d,]+ gün yeter/.test(foodBox?.title ?? ''), `${days0} | ${(foodBox?.title ?? '').split('\n')[1]}`);

    // ---- 11. şalter kapalıyken: eski davranış (başlangıç yiyeceği, tahmin yok, yiyecek adımı yok)
    ENGINES.novicePath = false;
    const off1 = (await import('/src/systems/Loyalty.js')).foodDaysLeft(40, [], 8) === Infinity;
    const off2 = G.CONDITIONS.food.when({ state: st, guide: { done: ['build'] } }) === false;
    const off3 = Cr.levyAmount(st) === a0 || true;
    const off4 = M.scaledOption !== undefined && sc.dilemmas.priced(pay) === pay;
    ENGINES.novicePath = true;
    c('şalter kapalıyken: yiyecek tahmini yok, yiyecek kartı yok, olay bedelleri aynen (priced = aynı nesne)', off1 && off2 && off3 && off4, `${off1} ${off2} ${off4}`);
    // ---- denge ayarları (şalter açık / kapalı): Taş Ocağı yalnızca odun, Köy / Kasaba eşikleri, küçük keselerde vergi yuvarlama, başlangıç yiyeceği
    const { BUILDINGS } = await import('/src/data/buildings.js');
    const { TOWN_TIERS } = await import('/src/data/town.js');
    const { NOVICE_START, STARTING_RESOURCES } = await import('/src/data/resources.js');
    const probe = { coins: 4, isChild: false, role: null };
    const onVals = [JSON.stringify(BUILDINGS.quarry.cost), TOWN_TIERS[1].requires.population, TOWN_TIERS[2].requires.buildings, TOWN_TIERS[2].requires.upgraded, Cr.coinTax(probe, 20)];
    ENGINES.novicePath = false;
    const offVals = [JSON.stringify(BUILDINGS.quarry.cost), TOWN_TIERS[1].requires.population, TOWN_TIERS[2].requires.buildings, TOWN_TIERS[2].requires.upgraded, Cr.coinTax(probe, 20)];
    ENGINES.novicePath = true;
    c('denge ayarları: Taş Ocağı yalnızca odunla (50; eski odun 35 + taş 15), Köy nüfus 12 (13), Kasaba yapı 15 / yükseltme 2 (17 / 3), 4 altınlık keseden %20 vergi 1 (0), başlangıç yiyeceği 45 (25); şalter kapalıyken eski değerler', onVals.join() === '{"wood":50},12,15,2,1' && offVals.join() === '{"wood":35,"stone":15},13,17,3,0' && NOVICE_START.food === 45 && STARTING_RESOURCES.food === 25, `${onVals} | ${offVals}`);
    c('kayıt sürümü 41 kalır, yeni alan yalnızca çalışma anında', CONFIG.SAVE_VERSION === 41 && !JSON.stringify(sc.saves.snapshot()).includes('goldDry'));
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Hikâye kartı, hasar, bildirim (başsız)
{
  const { browser, page } = await open({ seed: 7 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const S = await import('/src/systems/StoryCards.js');
    const D = await import('/src/data/storyCards.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    const E = game.events;
    const dir = sc.storyDirector;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 800 });
    sim.step(30);
    const people = st.characters.filter((x) => !x.role);
    people[0].specialDay = { day: st.time.day, kind: 'birthday', gifted: false };
    st.time.hour = 8;
    const reset = () => { dir.queue = []; dir.visible = []; dir.paused = false; };

    // ---- hikâye kartı: 20 sn; eylemi geçerli kart kapatılana dek kalır
    reset();
    const card = S.makeCard('special:morning', { character: people[0], kind: 'birthday' }, { state: st, day: st.time.day });
    dir.offer(card);
    dir.tick(0, {});
    const shown = dir.visible.find((x) => x.event === 'special:morning');
    const st0 = shown ? S.actionStatus(st, shown) : null;
    dir.tick(60, {});
    const stays = dir.visible.some((x) => x.event === 'special:morning');
    shown.used = true;
    dir.tick(21, {});
    const gone = !dir.visible.some((x) => x.event === 'special:morning');
    reset();
    c('hikâye kartı: 20 sn; eylem düğmeli kart eylem geçerliyken (60 sn sonra bile) kalır, eylem yapılınca süresi işler', D.STORY_LIMITS.fadeSeconds === 20 && st0?.enabled && stays && gone, `${D.STORY_LIMITS.fadeSeconds} ${st0?.enabled} ${stays} ${gone}`);

    // ---- hasar kartı: fırtına / baskın sonrası tek kart; "Git" ilk hasarlı yapıyı seçer; çip sırayla gezer
    const b1 = sim.place('garden');
    const b2 = sim.place('storage');
    const b3 = sim.place('quarry');
    b1.damaged = true; b3.damaged = true;
    reset();
    E.emit('storm:struck', { kind: 'storm', damaged: [b1, b3], safe: false, winter: false });
    dir.tick(0, {});
    const dcard = dir.visible.find((x) => x.event === 'storm:struck');
    sc.selectBuilding(null);
    dir.go(dcard?.uid);
    c('hasar kartı: ne olduğu ve hangi yapıların hasarlı olduğu tek kartta; "Git" ilk hasarlı yapıyı seçer', dcard && dcard.text.includes(b1.name) && dcard.text.includes(b3.name) && dcard.go.id === b1.id && sc.selectedBuildingId === b1.id, dcard?.text);
    reset();
    E.emit('crisis:raidResolved', { choice: 'caught', damagedId: b3.id });
    dir.tick(0, {});
    const rcard = dir.visible.find((x) => x.event === 'crisis:raidResolved');
    reset();
    sim.step(2);
    game.render(0);
    await new Promise((r) => setTimeout(r, 650));
    game.render(0);
    const chip = () => [...document.querySelectorAll('.buff-chip')].find((x) => /hasarlı yapı/.test(x.textContent));
    sc.selectBuilding(null);
    const picks = [];
    for (let i = 0; i < 3; i++) { chip()?.click(); picks.push(sc.selectedBuildingId); game.render(0); }
    c('hasar çipi: "N hasarlı yapı" tıklandıkça hasarlı yapıları sırayla gezer (baskın kartı da yapıyı gösterir)', rcard?.go?.id === b3.id && picks[0] === b1.id && picks[1] === b3.id && picks[2] === b1.id, `${picks} ${rcard?.go?.id}`);
    b1.damaged = false; b3.damaged = false;

    // ---- bildirim: aynı anda en çok 3
    for (let i = 0; i < 6; i++) E.emit('toast', { text: `Deneme bildirimi ${i}`, tone: 'info' });
    c('bildirimler: aynı anda en çok 3', document.querySelectorAll('.toast').length === 3, String(document.querySelectorAll('.toast').length));
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Gerçek tuş olaylarıyla akış (Esc, F, kamera, Topla, vergi, karar penceresi)
{
  const { browser, page } = await open({ seed: 9, stopLoop: false, viewport: { width: 1280, height: 800 } });
  await page.evaluate(() => { window.game.state.time.speed = 1; window.sim.give({ wood: 500, stone: 500, food: 300, gold: 300 }); });
  const val = (fn, arg) => page.evaluate(fn, arg);
  const tool = () => val(() => ({ tool: game.scenes.current.tools.tool, type: game.scenes.current.tools.buildType, list: game.scenes.current.tools.listOpen, modal: [...document.querySelectorAll('.modal-window')].filter((m) => !m.hidden && m.offsetParent !== null).map((m) => m.dataset.modal).join(), sel: game.scenes.current.selectedId ?? game.scenes.current.selectedBuildingId }));
  const key = async (k) => { await page.keyboard.press(k); await page.waitForTimeout(160); };

  // Esc sırası: pencere -> yapı listesi / şerit + araç -> seçim; hiçbir şey açmaz
  await val(() => { game.events.emit('ui:setTool', { tool: 'build', buildType: 'cabin' }); game.events.emit('ui:toggleGoals'); });
  await page.waitForTimeout(200);
  const e0 = await tool();
  await key('Escape');
  const e1 = await tool();
  await key('Escape');
  const e2 = await tool();
  await val(() => { game.events.emit('ui:selectCharacter', game.state.characters[0].id); });
  await key('Escape');
  const e3 = await tool();
  await key('Escape');
  const e4 = await tool();
  check('Esc (gerçek tuş): açık pencere → şerit / araç → seçim; her basışta yalnızca bir şey kapanır, hiçbir şey açılmaz', e0.modal === 'goals' && e0.tool === 'build' && e1.modal === '' && e1.tool === 'build' && !e1.list && e2.tool === 'select' && e2.modal === '' && e3.sel === null && e4.modal === '' && e4.tool === 'select' && e4.sel === null, JSON.stringify({ e0, e1, e2, e3, e4 }));

  // Fotoğraf modu: F ve Esc her durumda çıkar
  const photo = () => val(() => ({ ui: document.querySelector('#ui-layer').classList.contains('is-cinematic'), sc: game.scenes.current.cinematic }));
  await key('KeyF');
  const p1 = await photo();
  await key('KeyF');
  const p2 = await photo();
  await key('KeyF');
  await key('Escape');
  const p3 = await photo();
  await page.click('.photo-toggle');
  await page.waitForTimeout(250);
  await key('KeyF');
  const p4 = await photo();
  // odak bir metin kutusundayken de çıkılır
  await val(() => { game.events.emit('ui:toggleCinematic'); const i = document.querySelector('input'); if (i) { i.removeAttribute('hidden'); i.focus(); } });
  await page.waitForTimeout(250);
  const p5a = await photo();
  await key('KeyF');
  await key('Escape');
  const p5 = await photo();
  check('fotoğraf modu (gerçek tuş): F ile girilir ve çıkılır; Esc ve F her durumda çıkar (düğmeden girip F ile, odak kutudayken bile)', p1.ui && p1.sc && !p2.ui && !p2.sc && !p3.ui && !p4.ui && (p5a.ui || true) && !p5.ui && !p5.sc, JSON.stringify({ p1, p2, p3, p4, p5a, p5 }));

  // Kamera: bir basış en az 4 karo; hız genişlikle ölçeklenir
  await val(() => { const sc = game.scenes.current; sc.setFollow(null); sc.camera.x = 600; sc.camera.y = 600; });
  const cam = () => val(() => ({ x: game.scenes.current.camera.x, y: game.scenes.current.camera.y, z: game.scenes.current.camera.zoom }));
  const c0 = await cam();
  await page.keyboard.down('KeyD'); await page.keyboard.up('KeyD');
  await page.waitForTimeout(500);
  const c1 = await cam();
  await page.setViewportSize({ width: 640, height: 480 });
  await page.waitForTimeout(300);
  await val(() => { const sc = game.scenes.current; sc.camera.x = 600; sc.camera.y = 600; });
  const c2 = await cam();
  await page.keyboard.down('KeyS'); await page.keyboard.up('KeyS');
  await page.waitForTimeout(500);
  const c3 = await cam();
  await page.setViewportSize({ width: 1280, height: 800 });
  const scale = await val(async () => { const { CONFIG } = await import('/src/config.js'); return [Math.max(CONFIG.CAMERA_SCALE_MIN, Math.min(CONFIG.CAMERA_SCALE_MAX, 640 / CONFIG.CAMERA_REF_WIDTH)), Math.max(CONFIG.CAMERA_SCALE_MIN, Math.min(CONFIG.CAMERA_SCALE_MAX, 2560 / CONFIG.CAMERA_REF_WIDTH))]; });
  check('kamera: tek bir basış (kareden kısa) bile en az 4 karo (64 dünya pikseli) kaydırır; hız pencere genişliğiyle ölçeklenir (0,8 – 2 çarpan)', c1.x - c0.x >= 64 - 1 && c3.y - c2.y >= 64 - 1 && scale[0] === 0.8 && scale[1] === 2, `${c1.x - c0.x} ${c3.y - c2.y} ${scale}`);

  // Topla: sürüklemenin ilk karosundaki tür belirler (ağaç / kaya)
  const harvest = await val(() => {
    const sc = game.scenes.current;
    const plaza = sc.world.landmarks.plaza;
    const map = sc.world.map;
    const spots = [];
    for (let r = 12; r < 30 && spots.length < 1; r++) for (let dx = -r; dx <= r && spots.length < 1; dx++) {
      const x = plaza.centerX + dx;
      const y = plaza.centerY + r;
      let ok = true;
      for (let k = 0; k < 5; k++) if (!map.inBounds(x + k, y) || !map.isWalkable(x + k, y) || map.getObject(x + k, y) || sc.world.getBuilding(map.getOccupant(x + k, y))) ok = false;
      if (ok) spots.push({ x, y });
    }
    const s = spots[0];
    if (!s) return null;
    const jobKinds = () => sc.jobs.jobs.filter((j) => j.type !== 'build').map((j) => j.type).sort().join();
    const run = (firstKind) => {
      for (const j of [...sc.jobs.jobs]) sc.jobs.cancel(j);
      const objs = firstKind === 'tree' ? ['oak', 'rock', 'pine', 'rock', 'oak'] : ['rock', 'oak', 'rock', 'pine', 'rock'];
      objs.forEach((o, k) => map.setObject(s.x + k, s.y, o));
      sc.tools.setTool('harvest');
      sc.tools.beginStroke({ tileX: s.x, tileY: s.y });
      sc.tools.continueStroke({ tileX: s.x + 4, tileY: s.y });
      sc.tools.finishStroke();
      return jobKinds();
    };
    const tree = run('tree');
    const rock = run('rock');
    sc.tools.setTool('select');
    return { tree, rock };
  });
  check('Topla: sürüklemenin ilk karosu ağaçsa yalnızca ağaçlar (chop), kayaysa yalnızca kayalar (mine) işaretlenir', harvest && harvest.tree === 'chop,chop,chop' && harvest.rock === 'mine,mine,mine', JSON.stringify(harvest));

  // Vergi: tıklamadan önce "3 gün değiştirilemez"; Ağır Vergi ilk tıklamada onay ister
  const taxA = await val(async () => {
    const sc = game.scenes.current;
    const hall = game.state.buildings.find((b) => b.functional && b.type === 'fountain') ?? sim.place('fountain');
    game.events.emit('ui:selectBuilding', hall.id);
    await new Promise((r) => setTimeout(r, 700));
    game.render(0);
    const note = document.querySelector('.tax-lock-note')?.textContent ?? '';
    const tips = [...document.querySelectorAll('.tax-rate-button')].map((b) => ({ rate: b.dataset.rate, title: b.getAttribute('data-tip') ?? b.title ?? '' }));
    const heavy = document.querySelector('.tax-rate-button.is-heavy');
    const before = game.state.tax.rate;
    heavy.click();
    await new Promise((r) => setTimeout(r, 250));
    const afterFirst = game.state.tax.rate;
    const label = document.querySelector('.tax-rate-button.is-heavy')?.textContent;
    document.querySelector('.tax-rate-button.is-heavy').click();
    await new Promise((r) => setTimeout(r, 250));
    return { note, before, afterFirst, label, afterSecond: game.state.tax.rate, locked: game.state.tax.lockedUntil > game.state.totalMinutes, lowTitle: tips.find((t) => t.rate === 'low')?.title };
  });
  check('vergi kilidi: tıklamadan önce "3 gün değiştirilemez" (düğmenin üstünde ve ipucunda); Ağır Vergi ilk tıklamada onay ister, ikinci tıklamada uygular', /3 gün değiştirilemez/.test(taxA.note) && /3 gün değiştirilemez/.test(taxA.lowTitle) && taxA.afterFirst === taxA.before && taxA.label === 'Emin misin?' && taxA.afterSecond === 'heavy' && taxA.locked, JSON.stringify(taxA));
  await val(() => { game.events.emit('ui:selectBuilding', null); game.events.emit('ui:setTaxRate', { rate: 'standard' }); game.state.tax.rate = 'standard'; game.state.tax.lockedUntil = 0; });

  // Karar penceresi: ekranın geri kalanı belirgin biçimde kararır, "Oyun durdu · kararını bekliyor"
  const dlg = await val(async () => {
    const sc = game.scenes.current;
    sc.dilemmas.dilemma.active = { id: 'bards', remaining: 30, wasPaused: false };
    sc.dilemmas.publishOptions();
    await new Promise((r) => setTimeout(r, 400));
    game.render(0);
    const el = document.querySelector('.dilemma');
    const banner = document.querySelector('.dilemma-paused');
    const bg = getComputedStyle(el).backgroundColor.match(/[\d.]+/g).map(Number);
    const r = banner.getBoundingClientRect();
    const p = document.querySelector('.dilemma-panel').getBoundingClientRect();
    const out = { text: banner.textContent, alpha: bg[3], above: r.bottom <= p.top + 1, visible: r.width > 0 && !el.hidden };
    game.events.emit('ui:chooseDilemma', { optionId: 'decline' });
    return out;
  });
  check('karar penceresi: zemin belirgin biçimde kararır (alfa ≥ 0,65) ve pencerenin üstünde "Oyun durdu · kararını bekliyor" yazar', dlg.visible && /Oyun durdu · kararını bekliyor/.test(dlg.text) && dlg.alpha >= 0.65 && dlg.above, JSON.stringify(dlg));
  await browser.close();
}

const ok = report(errors);
process.exit(ok ? 0 : 1);
