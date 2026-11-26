// Aşama 30.1 testleri: rehber kartları, yapı yerleştirme, süresiz karar, yıkım onayı, hata düzeltmeleri, okunurluk.
// Tıklama akışları gerçek fare olaylarıyla (page.mouse) sınanır. Kullanım: node tools/sim/tests/30.1-first-hour.mjs [--verbose]
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });
const open = async (opts) => {
  const g = await openGame(opts);
  g.page.on('pageerror', (e) => errors.push(String(e)));
  return g;
};
const pause = (page) => page.evaluate(() => { game.state.time.paused = true; });
const give = (page) => page.evaluate(() => Object.assign(game.state.resources, { wood: 900, stone: 900, food: 900, iron: 900, gold: 900 }));
const tools = (page, fn, arg) => page.evaluate(fn, arg);

// ---------------------------------------------------------------- Rehber (saf mantık)
{
  const { browser, page } = await open({ seed: 5 });
  const out = await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const G = await import('/src/systems/Guide.js');
    const D = await import('/src/data/guide.js');
    const { GameState } = await import('/src/state/GameState.js');
    c('rehber: tablo sürümlü, 21 adım (30.2: +3 hikâye adımı; 30.4a: +1 ilk vefat; 30.4b: +1 doktrin; 30.6: +4 yiyecek / tahsildar / altın / taş; 32.2: +1 ilk dava; 32.6b: +2 Kasaba / Gelişmiş Şehir; 34.2: +1 parsel satın alma), her adımın görünme ve tamamlanma koşulu var', D.GUIDE_TABLE_VERSION === 8 && D.GUIDE_STEPS.length === 22 &&
      D.GUIDE_STEPS.every((s) => typeof G.CONDITIONS[s.id]?.when === 'function' && typeof G.CONDITIONS[s.id]?.done === 'function' && (typeof s.text === 'function' || s.text.split(/[.?!]\s/).length <= 3)));
    const st = game.state;
    const ids = (guide, facts) => G.currentStep(st, guide, facts)?.id ?? null;
    const g = { done: [], off: false };
    const seq = [];
    seq.push(ids(g, {}));
    g.done.push('move'); seq.push(ids(g, {}));
    g.done.push('meet'); seq.push(ids(g, {}));
    g.done.push('harvest'); seq.push(ids(g, {}));
    c('rehber: görünme sırası move > meet > harvest > build', seq.join() === 'move,meet,harvest,build', seq.join());
    g.done.push('build', 'food'); // (30.6) yiyecek adımı yapı adımından hemen sonra gelir; bu sınama onu tamamlanmış sayar
    const t0 = st.totalMinutes;
    g.at = { build: t0 };
    c('rehber: Hedefler adımı (4 tamam), hız adımı 2 oyun saatinden sonra', ids(g, {}) === 'goals' && G.CONDITIONS.speed.when({ state: st, guide: g, facts: {} }) === false);
    g.at = { build: t0 - 121 };
    c('rehber: hız adımı 2 saat sonra görünür', G.CONDITIONS.speed.when({ state: st, guide: g, facts: {} }) === true);
    g.at = { build: t0 };
    const saved = { ...st.resources };
    st.resources.wood = st.storageCapacity * 0.95;
    c('rehber: depo %90 dolunca Kiler adımı (Hedefler\'den önce)', ids(g, {}) === 'storage');
    Object.assign(st.resources, saved);
    c('rehber: tamamlanma koşulları', G.CONDITIONS.move.done({ facts: { moved: true } }) && G.CONDITIONS.meet.done({ facts: { selected: true } }) &&
      G.CONDITIONS.build.done({ facts: { placed: true } }) && G.CONDITIONS.speed.done({ facts: { speedChanged: true } }) &&
      G.CONDITIONS.goals.done({ facts: { goalsOpened: true } }) && G.CONDITIONS.petition.done({ facts: { petitionSelected: true } }) &&
      !G.CONDITIONS.move.done({ facts: {} }));
    const off = ids({ done: [], off: true }, {});
    c('rehber: kapalıyken kart yok', off === null);
    // kayıt gidiş-dönüş ve eski kayıt varsayılanı
    st.guide = { done: ['move', 'meet'], off: false, at: { build: 77 } };
    st.settings = { dilemmaTimer: true };
    const { CONFIG } = await import('/src/config.js');
    const json = JSON.parse(JSON.stringify({ ...st.toJSON(), version: CONFIG.SAVE_VERSION, terrain: [] }));
    const back = new GameState();
    back.restore(json);
    c('rehber: kayıt gidiş-dönüşü (done, at, settings.dilemmaTimer)', JSON.stringify(back.guide) === JSON.stringify(st.guide) && back.settings.dilemmaTimer === true);
    delete json.guide; delete json.settings;
    const old = new GameState(); old.restore(json);
    c('rehber: eski kayıtta (≤8 nüfus) açık, dilemmaTimer kapalı', old.guide.off === false && old.guide.done.length === 0 && old.settings.dilemmaTimer !== true);
    const big = JSON.parse(JSON.stringify(json));
    while (big.characters.length <= 8) big.characters.push(JSON.parse(JSON.stringify(big.characters[0])));
    c('rehber: eski kayıtta nüfus 8\'den fazlaysa kapalı', G.restoreGuide(undefined, 9).off === true && G.restoreGuide(undefined, 8).off === false);
    return out;
  });
  results.push(...out);
  await browser.close();
}

// ---------------------------------------------------------------- Karar süresi
{
  const { browser, page } = await open({ seed: 5 });
  const out = await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { sim } = window;
    const sc = game.scenes.current;
    const d = sc.dilemmas;
    const { DILEMMAS } = await import('/src/data/dilemmas.js');
    // doğrudan etkin pencere kur
    const mk = () => { d.dilemma.active = { id: Object.keys(DILEMMAS)[0], remaining: 30, wasPaused: false }; };
    game.state.settings.dilemmaTimer = false;
    mk();
    sim.step(60 * 40);
    c('karar: bayrak kapalıyken süre işlemiyor, pencere bekliyor', d.dilemma.active && d.dilemma.active.remaining === 30);
    game.state.settings.dilemmaTimer = true;
    mk();
    sim.step(60 * 40);
    c('karar: bayrak açıkken süre bugünkü gibi işler (30 sn sonra varsayılan)', !d.dilemma.active);
    return out;
  });
  results.push(...out);
  await browser.close();
}

// ---------------------------------------------------------------- Canlı sayfa: gerçek fare
const live = await open({ seed: 42, stopLoop: false });
{
  const { page } = live;
  await pause(live.page);
  await page.waitForTimeout(400);
  // Rehber kartı, tek kart, yanıp sönme, Anladım
  const s1 = await page.evaluate(() => ({ cards: [...document.querySelectorAll('.guide-card')].filter((c) => !c.hidden).length, id: document.querySelector('.guide-card').dataset.step }));
  check('rehber: aynı anda tek kart, ilk adım move', s1.cards === 1 && s1.id === 'move', JSON.stringify(s1));
  await page.click('.guide-ok');
  await page.waitForTimeout(200);
  const s2 = await page.evaluate(() => ({ id: document.querySelector('.guide-card').dataset.step, done: game.state.guide.done.join() }));
  check('rehber: "Anladım" adımı tamamlar, sıradaki kart gelir', s2.id === 'meet' && s2.done === 'move', JSON.stringify(s2));
  await page.click('.guide-ok');
  await page.waitForTimeout(500);
  const s3 = await page.evaluate(() => ({ id: document.querySelector('.guide-card').dataset.step, glow: document.querySelector('.tool-btn[data-tool="harvest"]').classList.contains('guide-glow') }));
  check('rehber: Topla kartında Topla düğmesi yanıp söner', s3.id === 'harvest' && s3.glow, JSON.stringify(s3));
  // Ayarlar: kapat / baştan başlat
  await page.evaluate(() => game.events.emit('ui:guideSetOff', { off: true }));
  await page.waitForTimeout(200);
  const hid = await page.evaluate(() => document.querySelector('.guide-card').hidden);
  await page.evaluate(() => game.events.emit('ui:guideRestart'));
  await page.waitForTimeout(300);
  const rs = await page.evaluate(() => ({ id: document.querySelector('.guide-card').dataset.step, off: game.state.guide.off, done: game.state.guide.done.length }));
  check('rehber: kapatınca kart gizlenir, baştan başlatınca ilk adım', hid && rs.id === 'move' && !rs.off && rs.done === 0, JSON.stringify(rs));
  // Yetersiz kaynak ipucu
  const hint = await page.evaluate(() => {
    const e = game.scenes.current.economy;
    return [e.shortfall({ stone: 9999 }), e.shortfall({ wood: 9999 }), e.shortfall({ food: 9999 })];
  });
  check('bildirim: yetersiz kaynak nasıl bulunacağını söyler', hint[0] === 'Yetersiz kaynak: Taş · Topla aracıyla kayalardan.' && /ağaçlardan/.test(hint[1]) && /çalılardan/.test(hint[2]), hint.join(' | '));
  // Hedefler açıklaması
  await page.keyboard.press('o');
  await page.waitForTimeout(900);
  const gh = await page.evaluate(() => document.querySelector('.tier-check[data-check="upgraded"] .tier-check-hint')?.textContent);
  check('hedefler: "Seviye 2 yapı" açıklaması', gh === 'Bir yapının panelindeki Yükselt düğmesiyle', gh);
  await page.keyboard.press('Escape');
}

// ---- İlk on dakika senaryosu: yalnızca rehber kartlarını izleyerek (gerçek fare / klavye)
{
  const { page } = await open({ seed: 42, stopLoop: false }).then((g) => { live.second = g; return g; });
  const cardId = () => page.evaluate(() => { const c = document.querySelector('.guide-card'); return c && !c.hidden ? c.dataset.step : null; });
  await page.evaluate(() => { game.state.time.speed = 1; sim.step(225 * 4 * 4); });
  const stone0 = await page.evaluate(() => game.state.resources.stone);
  const seen = [];
  for (let i = 0; i < 40 && seen.length < 4; i++) {
    const id = await cardId();
    if (!id) { await page.waitForTimeout(100); continue; }
    if (seen.includes(id)) { await page.waitForTimeout(150); continue; }
    seen.push(id);
    if (id === 'move') {
      await page.keyboard.down('d'); await page.waitForTimeout(250); await page.keyboard.up('d');
    } else if (id === 'meet') {
      const pos = await page.evaluate(() => {
        const sc = game.scenes.current; const cam = sc.camera;
        for (const c of game.state.characters) {
          if (!c.visible) continue;
          const x = (c.x - cam.x) * cam.zoom; const y = (c.y - c.spriteHeight / 2 - cam.y) * cam.zoom;
          if (x > 20 && x < innerWidth - 340 && y > 80 && y < innerHeight - 140) return { x, y };
        }
        return null;
      });
      if (pos) { await page.mouse.click(pos.x, pos.y); }
      else await page.click('.resident-row, .resident');
    } else if (id === 'harvest') {
      await page.click('.tool-btn[data-tool="harvest"]');
      await page.mouse.move(400, 300); await page.mouse.wheel(0, 400); await page.waitForTimeout(200); await page.mouse.wheel(0, 400); await page.waitForTimeout(300);
      const spots = await page.evaluate(() => {
        const sc = game.scenes.current; const cam = sc.camera; const map = sc.map; const T = 16;
        sc.camera.centerOn(sc.world.landmarks.plaza.centerX * T, sc.world.landmarks.plaza.centerY * T, innerWidth, innerHeight); sc.clampCamera(sc.camera); // (34.1)
        const out = [];
        for (let y = map.y0; y < map.y1; y++) for (let x = map.x0; x < map.x1; x++) {
          if (!sc.jobs.isHarvestable(x, y)) continue;
          const o = map.getObject(x, y); if (o !== 'rock' && o !== 'pebbles' && !String(o).includes('rock')) continue;
          const sx = (x * T + 8 - cam.x) * cam.zoom; const sy = (y * T + 8 - cam.y) * cam.zoom;
          if (sx > 20 && sx < innerWidth - 340 && sy > 80 && sy < innerHeight - 140) out.push({ x: sx, y: sy });
        }
        return out.slice(0, 20);
      });
      console.log("spots", spots.length);
      for (const p of spots) { await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 2, p.y + 2); await page.mouse.up(); }
      await page.evaluate(() => { game.events.emit('ui:setTool', { tool: 'select' }); game.state.time.speed = 4; sim.step(225 * 120); });
    } else if (id === 'build') {
      await page.click('.tool-btn[data-tool="build"]');
      await page.click('.build-item[data-type="cabin"]');
      await page.waitForTimeout(1500);
      const spot = await page.evaluate(() => {
        const t = game.scenes.current.tools; const cam = game.scenes.current.camera; const T = 16;
        const m34 = game.scenes.current.map; let best = null;
        for (const [k, v] of t.paint.results) if (v) { const { x, y } = m34.coordOf(k); const sx = (x * T + 8 - cam.x) * cam.zoom, sy = (y * T + 8 - cam.y) * cam.zoom; if (sx > 20 && sx < innerWidth - 340 && sy > 80 && sy < innerHeight - 160) { best = { x: sx, y: sy }; break; } }
        return best;
      });
      if (spot) { await page.mouse.move(spot.x, spot.y); await page.waitForTimeout(120); await page.mouse.click(spot.x, spot.y); }
    }
    await page.waitForTimeout(500);
  }
  const fin = await page.evaluate(() => ({ stone: game.state.resources.stone, placed: game.state.buildings.some((b) => b.type === 'cabin' && b.underConstruction !== undefined && b.id > 100) || game.scenes.current.guideSystem.facts.placed, jobs: game.state.stats }));
  check('ilk on dakika: rehber kartları sırasıyla move, meet, harvest, build', seen.join() === 'move,meet,harvest,build', seen.join());
  check('ilk on dakika: yalnızca kartlarla yapı yerleştirildi', fin.placed === true);
  const gained = await page.evaluate(() => game.state.resources.stone);
  check('ilk on dakika: taş toplandı (≥ 10 elde, yapı bedeli düşüldükten sonra bile)', gained >= 10 && gained + 10 >= stone0 + 10, `${stone0} -> ${gained} spots=${await page.evaluate(() => globalThis.__spots)} jobs=${await page.evaluate(() => game.state.jobs.length)}`);
}

// ---- Yerleştirme (canlı sayfa, duraklatılmış zaman)
{
  const { page } = live;
  await page.evaluate(() => game.events.emit('ui:guideSetOff', { off: true }));
  await give(page);
  await page.keyboard.press('b');
  await page.click('.build-item[data-type="cabin"]');
  await page.waitForTimeout(1800);
  const strip = await page.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    return { stripVisible: !document.querySelector('.build-strip').hidden, listHidden: document.querySelector('.build-items').hidden, h: r(document.querySelector('.build-strip')).height, name: document.querySelector('.build-strip-name').textContent };
  });
  check('şerit: yapı seçilince liste tek satırlık şeride iner', strip.stripVisible && strip.listHidden && strip.h <= 40 && strip.name === 'Kulübe', JSON.stringify(strip));
  // boyama birebir
  const paint = await page.evaluate(() => {
    const sc = game.scenes.current; const t = sc.tools; const p = t.paint; const w = sc.map.width; let diff = 0, n = 0, ok = 0;
    const r = p.rect;
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
      const a = sc.construction.anchorFor('cabin', x, y);
      const fresh = sc.construction.checkPlacement('cabin', a.x, a.y, { roads: true }).ok; // (34.3) yerleşim aracı yol üstüne de kurar
      n++; if (fresh) ok++; if (Boolean(p.results.get(sc.map.index(x, y))) !== fresh) diff++;
    }
    return { complete: p.complete, diff, n, ok };
  });
  check('boyama: kamera içindeki uygun karolar checkPlacement ile birebir', paint.complete && paint.diff === 0 && paint.ok > 0, JSON.stringify(paint));
  const c0 = await page.evaluate(() => game.scenes.current.tools.checks);
  await page.mouse.move(600, 300);
  await page.waitForTimeout(300);
  const c1 = await page.evaluate(() => game.scenes.current.tools.checks);
  await page.waitForTimeout(700);
  const c2 = await page.evaluate(() => game.scenes.current.tools.checks);
  check('boyama / önizleme: durağan fareyle kare başına checkPlacement çağrısı yok', c2 === c1 && c1 - c0 <= 2, `${c0} ${c1} ${c2}`);
  // renk = ok ve neden haritada
  await page.evaluate(() => {
    window.__texts = [];
    const ctx = game.renderer.ctx; const orig = ctx.fillText.bind(ctx);
    ctx.fillText = (t, ...a) => { window.__texts.push(t); return orig(t, ...a); };
  });
  let mism = 0, samples = 0, badText = null;
  for (let y = 120; y < 560; y += 55) for (let x = 60; x < 640; x += 70) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(40);
    const r = await page.evaluate(() => {
      const sc = game.scenes.current; const t = sc.tools; const h = t.hovered; if (!h) return null;
      const a = sc.construction.anchorFor(t.buildType, h.tileX, h.tileY);
      const c = sc.construction.checkPlacement(t.buildType, a.x, a.y, { roads: true });
      return { ok: t.preview.ok, fresh: c.ok, cls: document.querySelector('.build-strip-info').classList.contains('is-bad'), text: t.preview.text, reason: c.reason };
    });
    if (!r) continue;
    samples++;
    if (r.ok !== r.fresh || r.cls === r.ok) mism++;
    if (!r.ok && !badText) badText = r.reason;
  }
  check('renk doğruluğu: önizleme rengi her zaman checkPlacement.ok ile aynı', samples > 10 && mism === 0, `${samples} örnek, ${mism} uyuşmazlık`);
  await page.waitForTimeout(150);
  const drawn = await page.evaluate(() => window.__texts);
  check('neden metni imlecin yanında haritada çizilir', badText && drawn.some((t) => badText.startsWith(t.replace('…', '').slice(0, 12))), `${badText} | ${drawn.slice(-3).join(' / ')}`);
  // "uygun yer yok": konumdan bağımsız kilidi olmayan, ekranda hiç yeri olmayan bir yapı bul
  let none = null;
  const cands = await page.evaluate(() => [...document.querySelectorAll('.build-item')].map((b) => b.dataset.type).filter((b, i, a) => true).filter((t) => { try { return !game.scenes.current.construction.globalBlock(t) && !game.scenes.current.tools.isTileBuild.call({ buildType: t }); } catch { return false; } }));
  for (const type of cands.filter((t) => t !== 'cabin').slice(0, 12)) {
    await page.evaluate((t) => { window.__texts.length = 0; game.events.emit('ui:setTool', { tool: 'build', buildType: t }); }, type);
    await page.mouse.move(500, 300);
    await page.waitForTimeout(1700);
    none = await page.evaluate((type) => {
      const t = game.scenes.current.tools; const p = t.paint; const r = p.rect;
      return { type, complete: p.complete, vis: p.visibleOk, nearest: p.nearest, texts: window.__texts.slice(-8), outside: p.nearest ? !(p.nearest.x >= r.x0 && p.nearest.x <= r.x1 && p.nearest.y >= r.y0 && p.nearest.y <= r.y1) : null };
    }, type);
    if (none.complete && none.vis === 0) break;
  }
  check('uygun yer yok: ekranda yer yoksa mesaj ve en yakın yerin yönü', none.complete && none.vis === 0 && none.texts.includes('Bu ekranda uygun yer yok') && (none.nearest === null || none.outside), JSON.stringify({ ...none, texts: undefined }));
  await page.evaluate(() => game.events.emit('ui:setTool', { tool: 'build', buildType: 'cabin' }));
  // Esc (30.6: Esc hiçbir şey AÇMAZ; şeritteyken ilk Esc aracı bırakır)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const e1 = await page.evaluate(() => ({ list: !document.querySelector('.build-items').hidden, tool: game.scenes.current.tools.tool }));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const e2 = await page.evaluate(() => game.scenes.current.tools.tool);
  check('şerit: Esc listeyi AÇMAZ, aracı bırakır (30.6)', !e1.list && e1.tool === 'select' && e2 === 'select', JSON.stringify({ e1, e2 }));
  // Menü açıkken ve şerit modunda gerçek tıklamayla kurulum, yığın boyu sabit
  const okTile = (mode) => page.evaluate((mode) => {
    const sc = game.scenes.current; const cam = sc.camera; const T = 16; const w = sc.map.width;
    const bar = document.querySelector(mode === 'list' ? '.build-items' : '.build-strip').getBoundingClientRect();
    let best = null;
    for (const [k, v] of sc.tools.paint.results) if (v) {
      const { x, y } = sc.map.coordOf(k); // (34.1) dünya kökeni
      const sx = (x * T + 8 - cam.x) * cam.zoom, sy = (y * T + 8 - cam.y) * cam.zoom;
      if (sx > 20 && sx < innerWidth - 340 && sy > 80 && sy < bar.top - 6 && (!best || sy > best.y)) best = { x: sx, y: sy };
    }
    return best;
  }, mode);
  let wrapH = new Set();
  for (const mode of ['list', 'strip']) {
    await page.evaluate(() => game.events.emit('ui:setTool', { tool: 'build' }));
    await page.waitForTimeout(150);
    if (mode !== 'list') { if (await page.evaluate(() => document.querySelector('.build-items').hidden)) console.log('liste gizli', await page.evaluate(() => JSON.stringify({ tool: game.scenes.current.tools.tool, open: game.scenes.current.tools.listOpen }))); await page.click('.build-item[data-type="cabin"]'); }
    await page.waitForTimeout(1800);
    const p = await okTile(mode);
    const n0 = await page.evaluate(() => game.state.buildings.length);
    if (p) { await page.mouse.move(p.x, p.y); await page.waitForTimeout(100); await page.mouse.click(p.x, p.y); }
    await page.waitForTimeout(250);
    const n1 = await page.evaluate(() => game.state.buildings.length);
    check(`tıklama (${mode === 'list' ? 'liste açık' : 'şerit'}): listenin hemen üstündeki uygun karoya gerçek tıklama kurar`, p && n1 === n0 + 1, `${n0} -> ${n1}`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(120); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  }
  // dekor türü uzun metin: yığın boyu değişmez
  await page.evaluate(() => game.events.emit('ui:setTool', { tool: 'build', buildType: 'cherryTree' }));
  for (let y = 150; y < 450; y += 60) for (let x = 80; x < 640; x += 90) {
    await page.mouse.move(x, y); await page.waitForTimeout(25);
    wrapH.add(Math.round(await page.evaluate(() => document.querySelector('.dock-wrap').getBoundingClientRect().height)));
  }
  check('kaçan tıklama: ipucu metni uzasa da dock yığınının boyu sabit kalır', wrapH.size === 1, [...wrapH].join());
  await page.evaluate(() => game.events.emit('ui:setTool', { tool: 'select' }));
}

// ---- Yıkım onayı
{
  const { page } = live;
  const info = await page.evaluate(() => {
    const sc = game.scenes.current;
    const b = sim.place('cabin', { instant: true });
    const site = sim.place('planter', { instant: true });
    const cam = sc.camera; sc.camera.centerOn((b.tileX + 1) * 16, (b.tileY + 1) * 16, innerWidth, innerHeight);
    return { id: b.id, sx: (b.tileX * 16 + 8 - cam.x) * cam.zoom, sy: (b.tileY * 16 + 8 - cam.y) * cam.zoom, planter: site?.id ?? null };
  });
  await page.waitForTimeout(200);
  await page.keyboard.press('x');
  await page.mouse.move(info.sx, info.sy); await page.waitForTimeout(100);
  await page.mouse.click(info.sx, info.sy); await page.waitForTimeout(150);
  const a = await page.evaluate((id) => ({ exists: Boolean(game.scenes.current.world.getBuilding(id)), armed: game.scenes.current.tools.demolishArm?.id === id, text: game.scenes.current.tools.preview.text }), info.id);
  await page.mouse.click(info.sx, info.sy); await page.waitForTimeout(150);
  const b2 = await page.evaluate((id) => Boolean(game.scenes.current.world.getBuilding(id)), info.id);
  check('yıkım: ilk tıklama işaretler (iade yazar), ikinci tıklama yıkar', a.exists && a.armed && /Yıkmak için yeniden tıkla \(iade:/.test(a.text) && !b2, JSON.stringify(a));
  // 4 saniye
  const i2 = await page.evaluate(() => { const sc = game.scenes.current; const b = sim.place('cabin', { instant: true, maxRadius: 30 }); const cam = sc.camera; sc.camera.centerOn((b.tileX + 1) * 16, (b.tileY + 1) * 16, innerWidth, innerHeight); return { id: b.id, sx: (b.tileX * 16 + 8 - cam.x) * cam.zoom, sy: (b.tileY * 16 + 8 - cam.y) * cam.zoom }; });
  await page.waitForTimeout(200);
  await page.mouse.move(i2.sx, i2.sy); await page.mouse.click(i2.sx, i2.sy);
  await page.waitForTimeout(4400);
  await page.mouse.click(i2.sx, i2.sy); await page.waitForTimeout(150);
  const still = await page.evaluate((id) => ({ exists: Boolean(game.scenes.current.world.getBuilding(id)), armed: game.scenes.current.tools.demolishArm?.id === id }), i2.id);
  check('yıkım: 4 saniye geçince ikinci tıklama yıkmaz, yeniden işaretler', still.exists && still.armed, JSON.stringify(still));
  // fırça süsü ve şantiye tek tık
  const i3 = await page.evaluate(() => {
    const sc = game.scenes.current; const cam = sc.camera;
    const p = sim.place('planter', { instant: true }); const s = sim.place('cabin', { instant: false });
    sc.camera.centerOn(p.tileX * 16, p.tileY * 16, innerWidth, innerHeight);
    const pos = (b) => ({ x: (b.tileX * 16 + 8 - cam.x) * cam.zoom, y: (b.tileY * 16 + 8 - cam.y) * cam.zoom });
    return { p: p.id, s: s.id, pp: pos(p), sp: pos(s) };
  });
  await page.waitForTimeout(200);
  await page.mouse.click(i3.pp.x, i3.pp.y); await page.waitForTimeout(100);
  const pGone = await page.evaluate((id) => !game.scenes.current.world.getBuilding(id), i3.p);
  await page.evaluate((s) => { const sc = game.scenes.current; const b = sc.world.getBuilding(s); sc.camera.centerOn(b.tileX * 16, b.tileY * 16, innerWidth, innerHeight); }, i3.s);
  await page.waitForTimeout(200);
  const sp = await page.evaluate((s) => { const sc = game.scenes.current; const b = sc.world.getBuilding(s); const cam = sc.camera; return { x: (b.tileX * 16 + 8 - cam.x) * cam.zoom, y: (b.tileY * 16 + 8 - cam.y) * cam.zoom }; }, i3.s);
  await page.mouse.click(sp.x, sp.y); await page.waitForTimeout(100);
  const sGone = await page.evaluate((id) => !game.scenes.current.world.getBuilding(id), i3.s);
  check('yıkım: fırça süsü ve şantiye bugünkü gibi tek tıkla', pGone && sGone, `${pGone} ${sGone}`);
  await page.keyboard.press('Escape');
}

// ---- Hata düzeltmeleri
{
  const { page } = live;
  // 5.2 hasta çipi
  await page.evaluate(() => { const c = game.state.characters[1]; c.illness = { kind: 'cold', day: 1, until: 99999 }; });
  await page.waitForTimeout(900);
  const sick = await page.evaluate(() => [...document.querySelectorAll('.buff-chip.is-action')].find((b) => /hasta/.test(b.textContent)) ? true : false);
  let sel = null;
  if (sick) { await page.click('.buff-chip.is-action:has-text("hasta")'); await page.waitForTimeout(300); sel = await page.evaluate(() => game.scenes.current.selectedId); }
  check('hata: "N hasta" çipi ilk hasta sakini seçer', sick && sel === (await page.evaluate(() => game.state.characters[1].id)), String(sel));
  await page.evaluate(() => { delete game.state.characters[1].illness; game.state.characters[1].illness = null; });
  // 5.4 çubuk
  await page.evaluate(async () => { const { TOWN_TIERS } = await import('/src/data/town.js'); Object.assign(TOWN_TIERS[1].requires, { population: 3, buildings: 3 }); });
  await page.keyboard.press('o'); await page.waitForTimeout(1000);
  const bar = await page.evaluate(() => [...document.querySelectorAll('.tier-check.is-ok')].map((c) => { const b = c.querySelector('.need-bar'); const f = c.querySelector('.need-fill'); return Math.round(f.getBoundingClientRect().width) >= Math.round(b.clientWidth) && b.classList.contains('is-full'); }));
  check('hata: sayı tamamlanınca seviye çubuğu tam dolu', bar.length >= 2 && bar.every(Boolean), JSON.stringify(bar));
  await page.keyboard.press('Escape');
}

// ---- Üst şerit, okunurluk, küçük pencere (1024 / 1280)
for (const [w, h] of [[1024, 640], [1280, 800]]) {
  const g = await open({ seed: 42, stopLoop: false, viewport: { width: w, height: h } });
  const { page } = g;
  await page.evaluate(() => { const s = game.state; s.time.paused = true; s.townName = 'Dutluca Şehri'; s.town.tier = 4; s.time.day = 46; s.resources.wood = 306; game.events.emit('ui:guideSetOff', { off: true }); });
  await page.waitForTimeout(800);
  const top = await page.evaluate(() => {
    const zones = [...document.querySelectorAll('.hud.topbar > .hud-zone')].map((z) => z.getBoundingClientRect());
    let overlap = false;
    for (let i = 0; i < zones.length; i++) for (let j = i + 1; j < zones.length; j++) { const a = zones[i], b = zones[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlap = true; }
    const s = document.querySelector('.hud-season-chip').getBoundingClientRect(); const n = document.querySelector('.hud-zone-town').getBoundingClientRect(); const clock = document.querySelector('.hud-clock');
    return { overlap, seasonVsName: s.left < n.right - 1 && n.left < s.right - 1 && s.top < n.bottom - 1 && n.top < s.bottom - 1, clockOk: clock.scrollWidth <= clock.clientWidth + 1 && parseFloat(getComputedStyle(clock).fontSize) >= 17 };
  });
  check(`hata ${w}: üst şeritte kasaba adı mevsim çipine binmiyor, saat okunur`, !top.overlap && !top.seasonVsName && top.clockOk, JSON.stringify(top));
  const nums = await page.evaluate(() => {
    const bad = [];
    const walker = document.createTreeWalker(document.querySelector('#ui-layer'), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { const n = walker.currentNode; if (!/\d/.test(n.textContent)) continue; const e = n.parentElement; const r = e.getBoundingClientRect(); if (!r.width) continue; let hid = false; for (let x = e; x; x = x.parentElement) if (x.hidden) hid = true; if (hid) continue; const cs = getComputedStyle(e); if (parseFloat(cs.fontSize) < 13 || !cs.fontVariantNumeric.includes('tabular')) bad.push(`${e.className}:${cs.fontSize}`); }
    return [...new Set(bad)];
  });
  check(`okunurluk ${w}: üst şerit sayıları ≥ 13 px ve sabit genişlikli`, nums.length === 0, nums.join(', '));
  if (w === 1024) {
    await page.evaluate(() => game.events.emit('ui:selectCharacter', game.state.characters[0].id));
    await page.waitForTimeout(700);
    const res = [];
    for (const tab of ['Özet', 'İç Dünya', 'Bağlar', 'Hayat']) {
      await page.click(`.character-panel >> text=${tab}`); await page.waitForTimeout(250);
      res.push(await page.evaluate(() => { const p = [...document.querySelectorAll('.character-panel')].find((e) => !e.hidden).getBoundingClientRect(); const d = document.querySelector('.build-bar').getBoundingClientRect(); return Math.round(p.bottom) <= Math.round(d.top); }));
    }
    check('hata 1024×640: sakin kartı araç çubuğunun altına taşmıyor (dört sekme)', res.every(Boolean), JSON.stringify(res));
  }
  // yapı listesi ilk sıra adları
  await page.keyboard.press('b'); await page.waitForTimeout(400);
  const names = await page.evaluate(() => {
    const tabs = document.querySelector('.build-tabs').getBoundingClientRect();
    return [...document.querySelectorAll('.build-item:not([hidden])')].slice(0, 6).every((b) => { const n = b.querySelector('.build-name').getBoundingClientRect(); const c = b.getBoundingClientRect(); return n.top >= tabs.bottom - 1 && n.bottom <= c.bottom + 1 && b.querySelector('.build-name').scrollWidth <= b.clientWidth; });
  });
  check(`kesik adlar ${w}: ilk sıradaki kart adları sekme çubuğunun altında, tam görünür`, names);
  await g.browser.close();
}

// ---- Sayfa yenileme (gerçek page.reload)
{
  const g = await open({ seed: 42, stopLoop: false });
  const { page } = g;
  await page.evaluate(() => { game.state.resources.gold = 777; });
  await page.reload(); await page.waitForFunction(() => window.game?.scenes?.current?.world);
  const a = await page.evaluate(() => game.state.resources.gold);
  await page.evaluate(() => { game.state.resources.gold = 555; });
  await page.reload(); await page.waitForFunction(() => window.game?.scenes?.current?.world);
  const b = await page.evaluate(() => game.state.resources.gold);
  await page.goto('http://localhost:8080/?seed=42'); await page.waitForFunction(() => window.game?.scenes?.current?.world);
  const c = await page.evaluate(() => game.state.resources.gold);
  await page.goto('http://localhost:8080/?seed=7'); await page.waitForFunction(() => window.game?.scenes?.current?.world);
  const d = await page.evaluate(() => ({ g: game.state.resources.gold, seed: game.state.seed }));
  check('yenileme: ?seed ile başlayan oyun ilk yenilemede ve aynı tohumlu adres yeniden açılınca kayıttan sürer; başka tohum yeni oyun', a === 777 && b === 555 && c === 555 && d.seed === 7 && d.g !== 555, `${a} ${b} ${c} ${JSON.stringify(d)}`);
  await g.browser.close();
}

// En çok 30 test: ilgili denetimler tek teste birleştirilir (biri kalırsa birleşik test kalır)
const groups = [
  [/^rehber: (tablo|görünme|Hedefler adımı|hız adımı|depo|tamamlanma|kapalıyken)/, 'rehber: tablo, görünme ve tamamlanma koşulları'],
  [/^rehber: (kayıt|eski)/, 'rehber: kayıt gidiş-dönüşü ve eski kayıt varsayılanı'],
  [/^rehber: (aynı|"Anladım"|Topla)/, 'rehber: tek kart, "Anladım" ve yanıp sönen düğme'],
  [/^(bildirim|hedefler:)/, 'ipuçları: yetersiz kaynak bildirimi ve Seviye 2 yapı açıklaması'],
  [/^ilk on dakika/, 'ilk on dakika (gerçek fare): kartları izleyerek taş topla ve yapı yerleştir'],
  [/^(renk|neden)/, 'yerleştirme: renk = ok ve neden metni haritada'],
  [/^(boyama)/, 'yerleştirme: boyama checkPlacement ile birebir, kare başına çağrı yok'],
  [/^(tıklama|kaçan)/, 'yerleştirme: gerçek tıklama (liste açık / şerit), dock boyu sabit'],
  [/^yıkım: (ilk|4)/, 'yıkım onayı: iki tıklama ve 4 saniye'],
  [/^(hata \d+: üst|okunurluk)/, 'hata: üst şerit çakışması ve sayı okunurluğu (1024, 1280)'],
  [/^kesik/, 'hata: yapı listesi ilk sıra adları kesilmiyor (1024, 1280)'],
];
for (const [re, name] of groups) {
  const hit = results.filter((r) => re.test(r.name));
  if (hit.length < 1) continue;
  const merged = { name, ok: hit.every((r) => r.ok), detail: hit.filter((r) => !r.ok).map((r) => `${r.name} ${r.detail}`).join(' | ') };
  const at = results.indexOf(hit[0]);
  for (const r of hit) results.splice(results.indexOf(r), 1);
  results.splice(at, 0, merged);
}
const ok = report(errors);
await live.browser.close();
if (live.second) await live.second.browser.close();
process.exit(ok ? 0 : 1);
