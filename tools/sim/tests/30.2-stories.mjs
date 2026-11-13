// Aşama 30.2 testleri: hikâye kartları, Yakından izle, Duygu Katmanı açıklaması, çipler, yerleşim. En çok 30 test.
// Kullanım: node tools/sim/tests/30.2-stories.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 30.2
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const open = async (opts) => {
  const g = await openGame(opts);
  g.page.on('pageerror', (e) => errors.push(String(e)));
  return g;
};

// ---------------------------------------------------------------- Kart metinleri ve tablo (saf)
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const S = await import('/src/systems/StoryCards.js');
    const D = await import('/src/data/storyCards.js');
    const st = game.state;
    const [a, b, k, d] = st.characters.filter((x) => !x.role);
    const mk = (ev, p, ctx = {}) => S.makeCard(ev, p, { state: st, ...ctx });
    const prio = { 'population:died': 5, 'rite:started': 5, 'relationship:married': 4, 'family:childBorn': 4, 'trait:evolved': 4, 'special:morning': 3, 'special:forgotten': 3, 'want:fulfilled': 3, 'fear:realized': 3, 'apprentice:grandmaster': 3, 'masterwork:created': 3, 'relationship:partnered': 2, 'chemistry:kindred': 2, 'loyalty:changed': 2, 'moodlet:mourning': 2, 'moodlet:consoled': 2, 'family:grownUp': 2, 'venerable:became': 2, 'relationship:quarrel': 1, 'relationship:reconciled': 1 };
    c('tablo: sürüm 1, 20 olayın önceliği şartnameyle aynı', D.STORY_TABLE_VERSION === 1 && Object.entries(prio).every(([e, p]) => D.STORY_PRIORITY[e] === p) && D.STORY_LIMITS.visible === 2 && D.STORY_LIMITS.queue === 6 && D.STORY_LIMITS.fadeSeconds === 12 && D.STORY_FILTERS.important.min === 3 && D.STORY_DEFAULT_FILTER === 'important');
    const cases = [
      ['population:died', { character: a, age: 70, text: 'x' }, { story: 'Deniz bir gün geldi. İkinci cümle.' }, `${a.name} aramızdan ayrıldı. Deniz bir gün geldi.`],
      ['rite:started', { rite: { names: ['Deniz'], day: 1, place: null }, ids: [] }, {}, 'Deniz için anma töreni başlıyor.'],
      ['relationship:married', { a, b }, {}, `${a.name} ile ${b.name} evlendi.`],
      ['family:childBorn', { child: d, parents: [a, b] }, {}, null],
      ['trait:evolved', { character: a }, { journal: `${a.name} artık eskisi gibi değil: şu oldu.` }, `${a.name} artık eskisi gibi değil: şu oldu.`],
      ['special:morning', { character: a, kind: 'birthday' }, {}, null],
      ['special:forgotten', { character: a, kind: 'birthday' }, {}, null],
      ['want:fulfilled', { character: a, want: { key: 'find_love' }, points: 20 }, {}, null],
      ['fear:realized', { character: a, fear: { key: 'loss_of_loved' }, points: 14 }, {}, null],
    ];
    const bad = [];
    for (const [ev, p, ctx, expect] of cases) {
      const card = mk(ev, p, ctx);
      if (!card || card.priority !== prio[ev] || !card.text || (expect && card.text !== expect)) bad.push(`${ev}: ${card?.text}`);
    }
    c('metinler (1): ölüm + öykü, tören, evlilik, evlat, evrim, özel gün, dilek, korku', bad.length === 0, bad.join(' | '));
    c('metinler (1b): doğum günü ve evlat cümleleri (ek uyumu)', mk('special:morning', { character: a, kind: 'birthday' }).text.startsWith('Bugün ') && mk('special:morning', { character: a, kind: 'birthday' }).text.endsWith('doğum günü.') && mk('special:forgotten', { character: a, kind: 'anniversary' }).text.includes('evlilik yıl dönümünü kimse hatırlamadı') && /bir evladı oldu: /.test(mk('family:childBorn', { child: d, parents: [a, b] }).text), mk('family:childBorn', { child: d, parents: [a, b] }).text);
    const t2 = {
      grand: mk('apprentice:grandmaster', { character: a })?.text === `${a.name} Başusta oldu.`,
      mw: mk('masterwork:created', { character: a, piece: { name: 'Gümüş Kandil' } })?.text.includes('Gümüş Kandil'),
      love: mk('relationship:partnered', { a, b })?.text === `${a.name} ile ${b.name} birbirine âşık oldu.`,
      kin: mk('chemistry:kindred', { a, b })?.text.includes('ruh ikizi'),
      bitter: mk('loyalty:changed', { character: a, from: 0, to: -60 })?.text === `${a.name} yönetime kırgın.`,
      loyal: mk('loyalty:changed', { character: a, from: 0, to: 60 })?.text === `${a.name} yönetime sadık.`,
      neutral: mk('loyalty:changed', { character: a, from: 60, to: 0 }) === null,
      mourn: mk('moodlet:mourning', { character: a, whoName: 'Kemal' })?.text.includes('Kemal için yas'),
      consoled: mk('moodlet:consoled', { by: a, character: b })?.text.startsWith(`${a.name}, yasta olan `) && mk('moodlet:consoled', { by: a, character: b })?.text.endsWith('teselli etti.'),
      grown: mk('family:grownUp', { character: a })?.text.includes('büyüdü'),
      ven: mk('venerable:became', { character: a })?.text.includes('Saygın Büyük'),
      quarrel: mk('relationship:quarrel', { a, b, firstToday: true })?.priority === 1 && mk('relationship:quarrel', { a, b, firstToday: false }) === null,
      rec: mk('relationship:reconciled', { a, b })?.text.endsWith('barıştı.'),
      lowWant: mk('want:fulfilled', { character: a, want: { key: 'find_love' }, points: 17 }) === null && mk('fear:realized', { character: a, fear: { key: 'loss_of_loved' }, points: 11 }) === null,
    };
    c('metinler (2): usta, aşk, sadakat, yas, teselli, büyüme, atışma; eşik altı dilek / korku kart değil', Object.values(t2).every(Boolean), Object.entries(t2).filter(([, v]) => !v).map(([k2]) => k2).join());
    c('aynı olay aynı metni verir (saf işlev)', JSON.stringify(mk('relationship:married', { a, b })) === JSON.stringify(mk('relationship:married', { a, b })) && mk('want:fulfilled', { character: a, want: { key: 'find_love' }, points: 20 }).text === mk('want:fulfilled', { character: a, want: { key: 'find_love' }, points: 20 }).text);
    // kuyruk sınırı ve öncelik
    let q = [];
    let dropped = [];
    for (let i = 0; i < 8; i++) {
      const card = { key: `k${i}`, priority: i === 3 ? 1 : i < 6 ? 3 : 4, text: `t${i}` };
      const r = S.enqueue(q, card);
      q = r.queue;
      if (r.dropped) dropped.push(r.dropped.key);
    }
    c('kuyruk: en çok 6; taşınca önceliği en düşük (eşitte en eski) atılır; sıradaki en yüksek öncelik', q.length === 6 && dropped.join() === 'k3,k0' && q[S.nextIndex(q)].priority === 4, `${dropped} / ${q.map((x) => x.key)}`);
    const w = S.toggleWatched([1, 2, 3], 4);
    c('izleme listesi saf mantığı: 3 sınırı, çıkarma, kayıt temizliği', !w.ok && S.toggleWatched([1, 2, 3], 2).list.join() === '1,3' && S.restoreWatched([1, 1, 2, 'x', -1, 3, 4, 5]).join() === '1,2,3' && S.restoreWatched('zz').length === 0);
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Yönetici: kuyruk, süzgeç, duraklatma, Git, eylemler, özet
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { sim } = window;
    const sc = game.scenes.current;
    const dir = sc.storyDirector;
    const st = game.state;
    const E = game.events;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 500 });
    sim.step(30);
    st.time.paused = false;
    const [a, b, k, d] = st.characters.filter((x) => !x.role);
    const reset = () => { dir.queue = []; dir.visible = []; dir.missed = []; dir.shownLog.length = 0; dir.paused = false; };
    const married = (x, y, day) => E.emit('relationship:married', { a: x, b: y, venue: null, festival: false });
    // aynı anda 2 kart
    reset();
    E.emit('relationship:married', { a, b });
    E.emit('family:childBorn', { child: d, parents: [a, b], home: null });
    E.emit('trait:evolved', { character: k });
    E.emit('population:died', { character: d, age: 70, cause: 'age', text: 'öldü' });
    const nextUp = dir.queue[(await import('/src/systems/StoryCards.js')).nextIndex(dir.queue)];
    c('aynı anda en çok 2 kart görünür, ötekiler kuyrukta; boşalan yere en yüksek öncelikli gelir', dir.visible.length === 2 && dir.queue.length === 2 && nextUp.event === 'population:died', dir.visible.map((x) => x.event).join());
    // 12 sn sonra solar; fare üstündeyken beklemez
    const before = dir.visible.map((x) => x.uid).join();
    dir.tick(6, { hovered: true });
    dir.tick(20, { hovered: true });
    const held = dir.visible.map((x) => x.uid).join() === before;
    dir.tick(11.5, {});
    const still = dir.visible.length === 2;
    dir.tick(1, {});
    c('kart 12 gerçek sn sonra solar; fare üstündeyken ve duraklatılmışken süre işlemez', held && still && dir.visible.map((x) => x.uid).join() !== before, `${held} ${still}`);
    reset();
    for (let i = 0; i < 3; i++) E.emit('relationship:married', { a, b: st.characters.filter((x) => !x.role)[i + 1] });
    const queued = dir.queue.length;
    const vis = dir.visible.map((x) => x.uid).join();
    dir.tick(100, { paused: true });
    c('duraklatmada kuyruk ilerlemez, görünen kartlar solmaz', dir.visible.map((x) => x.uid).join() === vis && dir.queue.length === queued, `${queued}`);
    // süzgeç
    reset();
    st.settings.storyCards = 'important';
    E.emit('relationship:reconciled', { a, b });
    const lowAway = dir.visible.length + dir.queue.length === 0 && dir.missed.length === 1;
    E.emit('ui:setStoryFilter', { filter: 'all' });
    E.emit('relationship:reconciled', { a: k, b: d });
    const lowIn = dir.visible.length + dir.queue.length === 1;
    E.emit('ui:setStoryFilter', { filter: 'off' });
    E.emit('relationship:married', { a, b });
    const offNone = dir.visible.length + dir.queue.length === 0;
    E.emit('ui:setStoryFilter', { filter: 'important' });
    c('süzgeç: önemli (öncelik ≥3) / hepsi / kapalı; elenen olay gün özetine kalır', lowAway && lowIn && offNone && st.settings.storyCards === 'important', `${lowAway} ${lowIn} ${offNone}`);
    // Git
    reset();
    E.emit('relationship:married', { a, b });
    let picked = null;
    E.on('character:selected', (id) => (picked = id));
    const uid = dir.visible[0].uid;
    E.emit('ui:storyGo', { uid });
    c('"Git": ilk sakini seçer (kamera ona kayar)', picked === a.id && sc.selectedId === a.id && sc.focusId === a.id, `${picked}`);
    // eylem: armağan, bir kez
    reset();
    a.specialDay = { day: st.time.day, kind: 'birthday', celebrated: false, gifted: false };
    st.time.hour = 8;
    const gold0 = st.resources.gold;
    dir.scanSpecial();
    const gcard = dir.visible.find((x) => x.event === 'special:morning');
    const hasBtn = gcard?.action?.type === 'gift';
    E.emit('ui:storyAction', { uid: gcard.uid });
    E.emit('ui:storyAction', { uid: gcard.uid });
    c('"Armağan Gönder" gerçekten uygular ve yalnızca bir kez (5 altın)', hasBtn && a.specialDay.gifted === true && st.resources.gold === gold0 - 5, `${gold0} -> ${st.resources.gold}`);
    // taziye, bir kez
    reset();
    st.rites.active = { names: ['Deniz'], day: st.time.day, place: null, condolence: false, attendees: [], ids: [], dead: [] };
    st.time.hour = 8;
    st.resources.food = 500;
    const g1 = st.resources.gold;
    E.emit('rite:started', { rite: st.rites.active, ids: [] });
    const tc = dir.visible.find((x) => x.event === 'rite:started');
    E.emit('ui:storyAction', { uid: tc.uid });
    E.emit('ui:storyAction', { uid: tc.uid });
    c('"Taziye Sofrası Kur" gerçekten uygular ve yalnızca bir kez (10 altın)', tc?.action?.type === 'condolence' && st.rites.active.condolence === true && st.resources.gold === g1 - 10, `${g1} -> ${st.resources.gold}`);
    st.rites.active = null;
    // gün özeti
    reset();
    st.time.hour = 21;
    for (const [ev, p] of [['relationship:quarrel', { a, b, firstToday: true }], ['relationship:reconciled', { a, b }], ['relationship:partnered', { a: k, b: d }], ['chemistry:kindred', { a, b: d }], ['moodlet:mourning', { character: k, whoName: 'Kemal' }]]) E.emit(ev, p);
    const missed = dir.missed.length;
    st.time.hour = 22;
    E.emit('time:hour', 22);
    dir.sync();
    const sum = [...dir.visible, ...dir.queue].find((x) => x.event === 'story:summary');
    const items = sum ? sum.text.split(';').length : 0;
    reset();
    st.time.day += 1;
    E.emit('time:hour', 22);
    dir.sync();
    c('gün özeti: kart olamayan olaylardan en önemli üçü tek kartta; hiç olay yoksa kart yok', missed === 5 && sum && sum.text.startsWith('Bugün kasabada:') && items === 3 && dir.visible.length + dir.queue.length === 0, sum?.text);
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Kartlar simülasyonu etkilemez
{
  const run = async (filter) => {
    const { browser, page } = await open({ seed: 9 });
    const json = await page.evaluate(async (filter) => {
      const { sim } = window;
      window.game.events.emit('ui:setStoryFilter', { filter });
      sim.give({ wood: 400, stone: 400, food: 300 });
      for (const t of ['storage', 'market', 'inn', 'garden']) sim.place(t);
      sim.step(225 * 30);
      const dir = window.game.scenes.current.storyDirector;
      for (let i = 0; i < 100; i++) dir.tick(0.5, {});
      const snap = window.game.scenes.current.saves.snapshot();
      delete snap.settings;
      return JSON.stringify(snap);
    }, filter);
    await browser.close();
    return json;
  };
  const [all, off] = [await run('all'), await run('off')];
  results.push({ name: 'kartlar simülasyonu etkilemez: kartlar açık ve kapalıyken 30 saatlik koşunun kayıt çıktısı aynı', ok: all === off && all.length > 1000, detail: `${all.length} / ${off.length}` });
}

// ---------------------------------------------------------------- Yakından izle ve çekmece
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { sim } = window;
    const sc = game.scenes.current;
    const dir = sc.storyDirector;
    const st = game.state;
    const E = game.events;
    const { GameState } = await import('/src/state/GameState.js');
    const { CONFIG } = await import('/src/config.js');
    sim.step(30);
    const [a, b, k, d] = st.characters.filter((x) => !x.role);
    c('Yakından izle: en çok 3 sakin, dördüncüsü reddedilir', (() => {
      for (const x of [a, b, k, d]) E.emit('ui:toggleWatch', { id: x.id });
      return st.watched.length === 3 && !st.watched.includes(d.id);
    })(), st.watched.join());
    // kayıt gidiş-dönüş
    const json = JSON.parse(JSON.stringify({ ...st.toJSON(), version: CONFIG.SAVE_VERSION, terrain: [] }));
    const back = new GameState();
    back.restore(json);
    const none = JSON.parse(JSON.stringify({ ...st.toJSON(), version: CONFIG.SAVE_VERSION, terrain: [] }));
    const keep = st.watched;
    st.watched = [];
    const empty = JSON.parse(JSON.stringify(st.toJSON()));
    st.watched = keep;
    c('kayıt gidiş-dönüşü: watched yazılır, geri yüklenir; boşken kayda hiç yazılmaz; kayıt sürümü 40', back.watched.join() === st.watched.join() && !('watched' in empty) && CONFIG.SAVE_VERSION === 40 && Array.isArray(json.watched));
    // ölen sakin düşer
    const gone = a;
    st.characters.splice(st.characters.indexOf(gone), 1);
    E.emit('population:left', { character: gone, reason: 'death' });
    c('ölen ya da ayrılan sakin izleme listesinden düşer', !st.watched.includes(gone.id) && st.watched.length === 2, st.watched.join());
    st.characters.push(gone);
    // izlenenin düşük öncelikli olayı kart olur ve yıldız görünür
    dir.queue = []; dir.visible = []; dir.missed = [];
    E.emit('relationship:reconciled', { a: b, b: d });
    const card = dir.visible[0];
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    game.render(0);
    const star = document.querySelector('.story-card .story-watched');
    c('izlenen sakinin öncelik 1 olayı süzgeçten bağımsız kart olur, kartta yıldız görünür', card?.event === 'relationship:reconciled' && Boolean(star) && !star.hidden, `${dir.visible.length}`);
    // çekmece sırası ve simgeler
    st.watched = [k.id, b.id];
    const list = document.querySelector('.resident-list');
    const rosterOrder = () => [...list.querySelectorAll('.resident-row .resident-name')].map((n) => n.textContent);
    game.render(0);
    const rows = rosterOrder();
    c('sakinler çekmecesinde izlenenler en üstte (izleme sırasıyla)', rows[0] === k.name && rows[1] === b.name && list.querySelectorAll('.resident-row.is-watched').length === 2, rows.slice(0, 3).join());
    // simgeler katmanla aynı
    const { moodMarkOf, markIconURL } = await import('/src/rendering/ExpressionLayer.js');
    k.moodlets.push({ key: 'shaken', tier: 'major', since: 0, until: null, reason: 'x' });
    const { recomputeMood } = await import('/src/systems/Moodlets.js');
    recomputeMood(k);
    game.render(0);
    const row = [...list.querySelectorAll('.resident-row')].find((r2) => r2.querySelector('.resident-name').textContent === k.name);
    const mk = moodMarkOf(k);
    const m = row.querySelector('.resident-mood-mark');
    const wishRows = [...list.querySelectorAll('.resident-wish:not([hidden])')].length;
    const wantful = st.characters.filter((x) => x.wants?.length).length;
    c('çekmece simgeleri Duygu Katmanı işaretleriyle aynı simge; açık dileği olanda dilek simgesi', Boolean(mk) && !m.hidden && m.src === markIconURL(mk) && wishRows === wantful, `${mk} ${wishRows}/${wantful}`);
    c('çekmece başlığında "?" ipucu simgelerin anlamını listeler', document.querySelector('.resident-help-btn')?.textContent === '?' && document.querySelectorAll('.resident-help-tip > div').length >= 5);
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Duygu Katmanı açıklaması, ayarlar, rehber
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { sim } = window;
    const sc = game.scenes.current;
    const E = game.events;
    const st = game.state;
    sim.step(30);
    const frame = async () => { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); game.render(0); };
    localStorage.removeItem('lmgame.ui.emotionLegendHidden');
    const legend = document.querySelector('.emotion-legend');
    const hint = document.querySelector('.map-hint');
    await frame();
    const closedBefore = legend.hidden && hint.hidden;
    sc.expression.setEnabled(true);
    await frame();
    const rows = legend.querySelectorAll('.legend-row').length;
    const shown = !legend.hidden && !hint.hidden;
    E.emit('ui:selectCharacter', st.characters[0].id);
    await frame();
    const hintGone = hint.hidden;
    legend.querySelector('.legend-close').click();
    await frame();
    const hiddenNow = legend.hidden;
    sc.expression.setEnabled(false);
    sc.expression.setEnabled(true);
    await frame();
    c('Duygu Katmanı açıklaması: açılınca 3 işaret + 4 çizgi rengi satırı, seçili sakin yoksa harita ipucu', closedBefore && shown && rows === 7 && hintGone, `${rows}`);
    const { readLegendHidden } = await import('/src/ui/components/StoryFeed.js');
    c('açıklama kapatılınca tercih hatırlanır (localStorage)', hiddenNow && readLegendHidden() === true);
    sc.expression.setEnabled(false);
    localStorage.removeItem('lmgame.ui.emotionLegendHidden');
    // Ayarlar
    E.emit('ui:setStoryFilter', { filter: 'all' });
    const { GameState } = await import('/src/state/GameState.js');
    const { CONFIG } = await import('/src/config.js');
    const json = JSON.parse(JSON.stringify({ ...st.toJSON(), version: CONFIG.SAVE_VERSION, terrain: [] }));
    const back = new GameState();
    back.restore(json);
    const fresh = new GameState();
    E.emit('ui:toggleSettings');
    await frame();
    const active = [...document.querySelectorAll('.settings-story.is-active')].map((b) => b.textContent);
    E.emit('ui:toggleSettings');
    c('ayar: Hikâye kartları Hepsi / Yalnızca önemli / Kapalı; kayıtta gidiş-dönüş; varsayılan "Yalnızca önemli"', back.settings.storyCards === 'all' && fresh.settings.storyCards === undefined && document.querySelectorAll('.settings-story').length === 3 && active.join() === 'Hepsi', active.join());
    // rehber adımları
    const G = await import('/src/systems/Guide.js');
    const D = await import('/src/data/guide.js');
    const ids = D.GUIDE_STEPS.map((s) => s.id);
    const ctx = (facts, guide = { done: ['move', 'meet', 'harvest', 'build', 'goals', 'speed'], off: false }) => ({ state: st, facts, guide });
    const step = (facts, guide) => G.currentStep(st, guide ?? { done: ['move', 'meet', 'harvest', 'build', 'goals', 'speed'], off: false }, facts)?.id;
    const nine = st.characters.length >= 8;
    c('rehber: kart adımları (ilk kart, eylem düğmeli kart, nüfus 8 iken Yakından izle)', ids.slice(-3).join() === 'cards,cardAction,watch' && G.CONDITIONS.cards.when(ctx({ storyShown: true })) && !G.CONDITIONS.cards.when(ctx({})) && D.GUIDE_STEPS.find((s) => s.id === 'cards').text === 'Sol alttaki kartlar kasabada olup biteni anlatır. **Git** seni oraya götürür.' && D.GUIDE_STEPS.find((s) => s.id === 'cardAction').text === 'Bazı kartlarda yapabileceğin bir şey vardır.' && G.CONDITIONS.cardAction.when(ctx({ storyActionShown: true }, { done: ['cards'], off: false })) && G.CONDITIONS.watch.when(ctx({})) === nine && G.CONDITIONS.watch.done({ state: { watched: [3] } }), `${ids.length} ${nine}`);
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Çipler
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { sim } = window;
    const sc = game.scenes.current;
    const E = game.events;
    const st = game.state;
    sim.give({ wood: 400, stone: 400, food: 300, gold: 800 });
    for (const t of ['storage', 'market', 'inn', 'lumberHut', 'garden', 'fountain']) sim.place(t);
    sim.step(225 * 4);
    const hud = game.ui.components.find((x) => x.moreButton);
    const frame = async () => { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); hud.lastBuffs = ''; hud.renderWelfare(st); };
    const chips = () => hud.chipList;
    const people = st.characters.filter((x) => !x.role);
    const b0 = st.buildings.find((x) => x.functional && x.type === 'inn');
    // koşul kurucuları: her tür tek tek
    const kinds = {
      buff: () => { st.buffs.tools = st.totalMinutes + 600; },
      sick: () => { people[0].illness = { until: st.totalMinutes + 600 }; },
      away: () => { people[1].away = true; },
      damaged: () => { b0.damaged = true; },
      burning: () => { b0.isBurning = true; b0.fireProgress = 40; },
      revolt: () => { st.trust.revolt = { rioters: [people[0].id], raids: [], leaderId: people[0].id, startedAt: st.totalMinutes }; },
      exodus: () => { st.exodus = { active: true }; },
      heavyTax: () => { st.tax.rate = 'heavy'; },
      petition: () => { st.petitions.list = [{ id: 1, characterId: people[0].id, name: people[0].name, kind: 'sapling', text: 'Bir fidan istiyorum', status: 'open', deadline: st.totalMinutes + 900 }]; },
      decree: () => { st.crown.decree = { id: 1, kind: Object.keys(window.__decrees)[0], deadline: st.totalMinutes + 900 }; },
      tahsildar: () => { st.crown.notice = { amount: 40 }; st.crown.nextLevyAt = st.totalMinutes + 300; },
      rite: () => { st.rites.active = { names: ['Deniz'], day: st.time.day, place: b0.id, condolence: false, attendees: [], ids: [], dead: [] }; },
      grief: () => { people[2].moodlets.push({ key: 'mourning', tier: 'major', since: 0, until: null, reason: 'x', whoName: 'Kemal' }); },
    };
    window.__decrees = (await import('/src/data/crown.js')).DECREES;
    const snapshotState = JSON.stringify([st.buffs, st.trust, st.exodus, st.tax, st.petitions, st.crown, st.rites]);
    void snapshotState;
    const clean = () => {
      st.buffs = {}; for (const p of people) { p.illness = null; p.away = false; p.moodlets = p.moodlets.filter((m) => m.key !== 'mourning'); }
      b0.damaged = false; b0.isBurning = false; st.trust.revolt = null; st.exodus = { active: false }; st.tax.rate = 'standard'; st.petitions.list = []; st.crown.decree = null; st.crown.notice = null; st.rites.active = null;
    };
    const problems = [];
    let types = 0;
    const events = [];
    const emit0 = E.emit.bind(E);
    E.emit = (name, p) => { events.push(name); return emit0(name, p); };
    for (const [name, setup] of Object.entries(kinds)) {
      clean();
      setup();
      await frame();
      const list = chips();
      if (!list.length) { problems.push(`${name}: çip yok`); continue; }
      types++;
      for (const d of list) {
        const lines = d.title.split('\n');
        if (lines.length !== 4 || !/^Ne: .+/.test(lines[0]) || !/^Neden: .+/.test(lines[1]) || !/^Süre: .+/.test(lines[2]) || !/^Etki: .+/.test(lines[3])) problems.push(`${name}/${d.text}: ipucu eksik`);
        events.length = 0;
        const dom = [...document.querySelectorAll('.hud-buffs .buff-chip')];
        d.onClick();
        if (!events.some((e) => e.startsWith('ui:'))) problems.push(`${name}/${d.text}: tıklama etkisiz`);
        void dom;
      }
    }
    E.emit = emit0;
    clean();
    c('çipler: her tür için ipucu dört satır (ne, neden, süre, etki) dolu ve her çip tıklanınca bir etki üretir', problems.length === 0 && types >= 12, `${types} tür; ${problems.slice(0, 4).join(' | ')}`);
    // 4 sınırı ve öncelik
    clean();
    kinds.buff(); kinds.sick(); kinds.away(); kinds.damaged(); kinds.petition(); kinds.rite(); kinds.burning(); kinds.exodus(); kinds.heavyTax(); kinds.grief();
    await frame();
    const shownDom = [...document.querySelectorAll('.hud-buffs > .buff-chip:not(.is-more)')];
    const list = chips();
    const groups = list.map((d) => d.group);
    const sorted = [...groups].sort((x, y) => x - y);
    const moreN = Number(hud.moreCount.textContent);
    c('çipler: üst şeritte en çok 4 çip, kriz → karar bekleyen → süreli etki sırası, fazlası "Olaylar ▾ (N)" listesinde', shownDom.length === 4 && groups.join() === sorted.join() && list.length > 4 && moreN === list.length - 4 && !hud.moreButton.hidden && hud.moreList.children.length === moreN && groups[0] === 0 && groups[2] === 1, `${shownDom.length} ${groups} ${moreN}`);
    clean();
    // kasaba adı ipucu ve nüfus ibareleri
    await frame();
    hud.lastTitle = '';
    hud.renderTitle(st);
    st.characters.push(...[]);
    const nameTip = hud.townName.title;
    c('vadi ve doktrin bilgisi kasaba adının ipucunda; nüfus yanındaki "Saygın" ibaresinin kendi ipucu var', /Vadi Karakteri: /.test(nameTip) && /Kasaba Doktrini/.test(nameTip) && (document.querySelector('.hud-valley-chip')?.offsetWidth ?? 0) <= 1, nameTip.slice(0, 60));
    const v = people[3];
    v.isVenerable = true; v.homeId = null;
    hud.lastWelfare = ''; hud.renderWelfare(st);
    c('"Saygın (+N)" ibaresinin ipucu dolu', hud.venerable.textContent.includes('Saygın') && hud.venerable.title.length > 20, hud.venerable.textContent);
    v.isVenerable = false;
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Yerleşim: kasaba adı, harita ipucu, sol alt köşe (beş çözünürlük + 1024x640)
{
  const { browser, page } = await open({ seed: 5 });
  await page.evaluate(async () => {
    const { sim } = window;
    sim.give({ wood: 400, stone: 400, food: 300 });
    for (const t of ['storage', 'market', 'inn']) sim.place(t);
    sim.step(225 * 3);
    game.state.townName = 'Gökyüzü Ötesindeki Çok Uzun Kasaba';
  });
  const sizes = [[1920, 1080], [1600, 900], [1366, 768], [1024, 640], [390, 844]];
  const bad = [];
  const bad2 = [];
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    const r = await page.evaluate(async () => {
      if (innerWidth <= 620) document.querySelector('.resident-drawer:not(.is-collapsed) .resident-toggle')?.click(); // telefonda çekmece kapalı başlar
      await new Promise((rr) => setTimeout(rr, 300));
      const frame = () => new Promise((rr) => requestAnimationFrame(() => requestAnimationFrame(rr)));
      const E = game.events;
      const dir = game.scenes.current.storyDirector;
      const st = game.state;
      const rect = (e) => e.getBoundingClientRect();
      const vis = (e) => Boolean(e) && !e.hidden && e.offsetParent !== null && rect(e).width > 0;
      const area = (a, b) => (a && b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0);
      const out = { name: [], left: [] };
      st.townName = 'Gökyüzü Ötesindeki Çok Uzun Kasaba';
      st.guide = { done: ['move', 'meet'], off: false };
      document.querySelector('.hud-town-name') && (document.querySelector('.hud-town-name').click = null);
      game.render(0);
      await frame();
      game.render(0);
      await new Promise((rr) => setTimeout(rr, 600));
      game.render(0);
      const town = rect(document.querySelector('.hud-town-name'));
      const season = rect(document.querySelector('.hud-season-chip'));
      const clock = rect(document.querySelector('.hud-clock-chip'));
      const res = rect(document.querySelector('.hud-zone-res'));
      if (area(town, season) > 0 || area(town, clock) > 0 || area(town, res) > 0) out.name.push(`ad çakışıyor ${JSON.stringify([town.right, season.left])}`);
      if (!document.querySelector('.hud-town-name').title.includes('Gökyüzü')) out.name.push('tam ad ipucunda yok');
      // harita ipucu (karo adı) üst şeridin üstüne binmez
      const tip = document.querySelector('.map-tooltip');
      const top = rect(document.querySelector('.hud.topbar'));
      if (tip) {
        tip.hidden = false;
        document.querySelector('.map-tip-name').textContent = 'Deneme';
        tip.style.transform = 'translate(10px, 2px)';
      }
      // sol alt köşe: iki kart + Duygu açıklaması + rehber kartı + izlenenler
      dir.queue = []; dir.visible = []; dir.missed = [];
      const people = st.characters.filter((x) => !x.role);
      st.watched = people.slice(0, 3).map((x) => x.id);
      E.emit('relationship:married', { a: people[0], b: people[1] });
      E.emit('population:died', { character: people[2], age: 70, cause: 'age', text: 'Uzun bir hayat sürdü ve herkesin sevgisini kazandı' });
      game.scenes.current.expression.setEnabled(true);
      st.settings.dilemmaTimer = true;
      await frame();
      game.render(0);
      const parts = {
        'üst şerit': document.querySelector('.hud.topbar'),
        'çipler': document.querySelector('.hud-under'),
        'açıklama': document.querySelector('.emotion-legend'),
        'kart': [...document.querySelectorAll('.story-card')],
        'rehber': document.querySelector('.guide-card'),
        'dock': document.querySelector('.dock.build-bar'),
        'sakinler': document.querySelector('.residents') ?? document.querySelector('.resident-tab'),
      };
      const rs = [];
      for (const [name, v] of Object.entries(parts)) for (const e of [].concat(v)) if (vis(e)) rs.push([name, rect(e)]);
      for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (area(rs[i][1], rs[j][1]) > 4) out.left.push(`${rs[i][0]} ~ ${rs[j][0]}`);
      const names = rs.map((x) => x[0]);
      if (names.filter((n) => n === 'kart').length !== 2 || !names.includes('açıklama') || !names.includes('rehber')) out.left.push(`eksik öğe: ${names.join()}`);
      for (const [n, b] of rs) if (b.left < -1 || b.right > innerWidth + 1 || b.bottom > innerHeight + 1 || b.top < -1) out.left.push(`${n} taşıyor`);
      const left = [...document.querySelectorAll('.emotion-legend, .story-card, .guide-card')].filter(vis).map(rect);
      const dock = rect(document.querySelector('.dock.build-bar'));
      if (left.some((b) => b.bottom > dock.top + 1 && b.right > dock.left)) out.left.push('sol alt dock\'a biniyor');
      if (tip && vis(tip) && area(rect(tip), top) > 4) out.name.push('harita ipucu üst şeride biniyor');
      game.scenes.current.expression.setEnabled(false);
      return out;
    });
    if (r.name.length) bad.push(`${w}x${h}: ${r.name.join(';')}`);
    if (r.left.length) bad2.push(`${w}x${h}: ${r.left.slice(0, 3).join(';')}`);
  }
  results.push({ name: 'üst şerit: uzun kasaba adı beş çözünürlükte (1920, 1600, 1366, 1024x640, 390) mevsim / saat / kaynak çipine binmez, tam ad ipucunda', ok: bad.length === 0, detail: bad.join(' | ') });
  results.push({ name: 'sol alt köşe: iki hikâye kartı, Duygu açıklaması ve rehber kartı birbirine, üst şeride, çiplere, dock\'a ve sakinlere binmez (beş çözünürlük, 1024x640 dahil)', ok: bad2.length === 0, detail: bad2.join(' | ') });
  await browser.close();
}

// Birleşik denetimler (en çok 30 test): aynı konunun ardışık denetimleri tek test olarak raporlanır
const fold = (prefixes, name) => {
  const idx = prefixes.map((p) => results.findIndex((r) => r.name.startsWith(p)));
  if (idx.some((i) => i < 0)) return;
  const parts = idx.map((i) => results[i]);
  const merged = { name, ok: parts.every((r) => r.ok), detail: parts.filter((r) => !r.ok).map((r) => r.detail || r.name).join(' | ') };
  for (const i of [...idx].sort((a, b) => b - a)) results.splice(i, 1);
  results.splice(Math.min(...idx), 0, merged);
};
fold(['metinler (1):', 'metinler (1b)'], 'metinler (1): ölüm + öykü, tören, evlilik, evlat, evrim, özel gün, dilek, korku; ek uyumu');
fold(['tablo:', 'aynı olay aynı metni'], 'tablo: sürüm 1, 20 olayın önceliği ve sınırlar şartnameyle aynı; aynı olay aynı metni verir');
fold(['kuyruk:', 'izleme listesi saf'], 'saf mantık: kuyruk sınırı 6 ve öncelik; izleme listesi 3 sınırı ve kayıt temizliği');
fold(['çekmece simgeleri', 'çekmece başlığında'], 'çekmece simgeleri Duygu Katmanı işaretleriyle aynı; dilek simgesi; "?" ipucu simgeleri listeler');
fold(['vadi ve doktrin', '"Saygın (+N)"'], 'ipuçları: vadi / doktrin kasaba adında; "Saygın (+N)" ibaresinin kendi ipucu var');
if (results.length > 30) results.push({ name: 'en çok 30 test', ok: false, detail: `${results.length}` });
const ok = report(errors);
process.exit(ok ? 0 : 1);
