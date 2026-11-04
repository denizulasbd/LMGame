// Oyun içi vitrin: yeni yapıları ve hayvanları kurup birkaç saat yaşatır, yakın plan ekran görüntüleri alır
// (gündüz, gece), karar penceresini ve belediye fermanlarını açar. (12. aşama) Bilgelik Evi, liman ve rıhtıma
// yanaşan ticaret teknesi, Büyük Vadi Saat Kulesi (gündüz / gece) ve bu yapıların bilgi panelleri. (13. aşama) Peyzaj
// (kiraz ağaçları, çardakta oturan çift, mermer kemer, çiçekli çitler), yadigârları sergileyen Belediye Konağı,
// Belediye ve liman panellerinin altın bölümleri, Kasaba Arşivi penceresi ve fotoğraf modu. (14. aşama) Dört mevsim
// festivali, sabah sisi, Toplanma Zili, yaz fırtınasında şimşek ve bir sakinin anılar paneli.
// Kullanım: node tools/sim/showcase.mjs [tohum=11] [--out klasör]
import fs from 'fs';
import { openGame, parseArgs, runHours } from './lib.mjs';

const { positional, options } = parseArgs();
const seed = Number(positional[0] ?? 11);
const out = options.out ?? 'tools/sim/out';
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed, viewport: { width: 1360, height: 860 } });

await page.evaluate(() => {
  const game = window.game;
  const sim = window.sim;
  const s = game.state;
  s.town.tier = 3;
  for (const t of ['storage', 'garden', 'sheepFarm', 'workshop', 'ironMine', 'mill', 'healerHut', 'inn', 'market', 'townHall', 'cabin', 'cabin']) {
    sim.give({ wood: 300, stone: 300, food: 200, iron: 60, wool: 60, bread: 60 });
    sim.place(t, { maxRadius: 40 });
  }
  s.animalMeta.lastPetDay = 0;
  for (let i = 0; i < 4; i++) {
    s.animalMeta.lastPetDay = 0;
    game.scenes.current.animals.petArrival();
  }
  sim.give({ wood: 150, stone: 120, food: 160, wool: 40, iron: 30, bread: 50 });
});
await runHours(page, 4); // 10:00

async function shoot(name, focus, zoom = 4) {
  await page.evaluate(({ focus, zoom }) => {
    const game = window.game;
    const scene = game.scenes.current;
    let target = null;
    if (focus.type) target = game.state.buildings.find((b) => b.type === focus.type)?.center;
    if (focus.animal) {
      const a = game.state.animals.find((x) => x.kind === focus.animal && x.visible);
      target = a ? { x: a.x, y: a.y } : null;
    }
    if (target) {
      scene.camera.zoom = zoom;
      scene.camera.centerOn(target.x, target.y, game.renderer.width, game.renderer.height);
      scene.camera.clamp(scene.map.pixelWidth, scene.map.pixelHeight, game.renderer.width, game.renderer.height);
    }
    game.render(0);
  }, { focus, zoom });
  const file = `${out}/vitrin-${name}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}

await shoot('sifaci', { type: 'healerHut' });
await shoot('tavsan', { animal: 'rabbit' }, 5);
await shoot('geyik', { animal: 'deer' }, 5);
await shoot('kedi', { animal: 'cat' }, 5);
// --- 12. aşama ---
await page.evaluate(() => {
  const game = window.game;
  const sim = window.sim;
  const s = game.state;
  s.town.tier = 4;
  sim.give({ wood: 400, stone: 400, food: 300, iron: 200, wool: 200, bread: 200, gold: 0 });
  sim.place('academy', { maxRadius: 40 });
  sim.give({ wood: 400, stone: 400, iron: 100 });
  sim.place('harbor', { maxRadius: 45 });
  sim.give({ wood: 400, stone: 400, bread: 200, gold: 200, iron: 200 });
  const w = sim.place('wonder', { maxRadius: 40 });
  if (w) w.wonderStage = 3;
  game.events.emit('ui:startResearch', { id: 'gears' });
  sim.give({ wood: 520, stone: 480, food: 450 });
  s.trade.nextBoatAt = s.totalMinutes;
});
await page.evaluate(() => {
  for (let i = 0; i < 40 && window.game.state.trade.boat?.stage !== 'docked'; i++) window.sim.step(56);
});
await shoot('liman-tekne', { type: 'harbor' }, 4);
await shoot('bilgelik', { type: 'academy' }, 4);
await shoot('harika', { type: 'wonder' }, 3);
// Paneller: sakin listesi gizlenir, panel tüm yüksekliğiyle çekilir
await page.setViewportSize({ width: 1360, height: 1500 });
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.residents')) el.style.display = 'none';
});
for (const type of ['academy', 'harbor', 'wonder']) {
  await page.evaluate((type) => {
    const game = window.game;
    const b = game.state.buildings.find((x) => x.type === type);
    if (b) game.events.emit('ui:selectBuilding', b.id);
    game.render(0);
  }, type);
  await page.locator('.building-panel').screenshot({ path: `${out}/vitrin-panel-${type}.png` });
  console.log(`${out}/vitrin-panel-${type}.png`);
}
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.residents')) el.style.display = '';
});
await page.setViewportSize({ width: 1360, height: 860 });

// --- 13. aşama ---
await page.evaluate(() => {
  const game = window.game;
  const sim = window.sim;
  const s = game.state;
  const scene = game.scenes.current;
  sim.give({ wood: 400, stone: 400, food: 300, gold: 40000 });
  for (const id of ['sunSphere', 'cornucopia', 'guildSeal', 'compass', 'eternalFlame']) game.events.emit('ui:buyRelic', { id, source: 'harbor' });
  game.events.emit('ui:buyLuxury', { id: 'silkMarble', source: 'harbor' });
  game.events.emit('ui:goldDecree', { id: 'goldBonus' });
  const gazebo = sim.place('gazebo', { maxRadius: 40 });
  // Çardağın çevresine kiraz ağaçları, önüne çiçekli çit sırası, yola mermer kemer
  if (gazebo) {
    const tryPlace = (type, x, y) => {
      if (!scene.construction.checkPlacement(type, x, y).ok) return null;
      const b = scene.construction.placeSite(type, x, y).building;
      const job = scene.jobs.jobs.find((j) => j.buildingId === b.id);
      if (job) scene.jobs.cancel(job);
      scene.construction.complete(b);
      return b;
    };
    for (const [dx, dy] of [[-2, 0], [3, 0], [-2, 2], [3, 2], [-1, -1], [2, -1]]) tryPlace('cherryTree', gazebo.tileX + dx, gazebo.tileY + dy);
    for (let dx = -2; dx <= 3; dx++) if (dx < 0 || dx > 1) tryPlace('flowerFence', gazebo.tileX + dx, gazebo.tileY + 3);
    const map = scene.world.map;
    for (let r = 1; r < 12; r++) {
      const t = [[0, r], [r, 0], [0, -r], [-r, 0]].map(([dx, dy]) => ({ x: gazebo.tileX + dx, y: gazebo.tileY + 3 + dy })).find((p) => map.get(p.x, p.y) === 'path');
      if (t && tryPlace('marbleArch', t.x, t.y)) break;
    }
    // Bir çift çardakta otursun
    const [a, b] = s.characters.filter((c) => !c.isChild && c.visible).slice(0, 2);
    const brain = scene.behavior.brain;
    for (const c of [a, b]) scene.behavior.endTask(c);
    const planA = brain.planGathering(a, gazebo);
    scene.behavior.startPlan(a, planA, s.time.hour);
    scene.behavior.startPlan(b, brain.planGathering(b, gazebo, planA.spot), s.time.hour);
  }
});
await runHours(page, 1);
await shoot('peyzaj-cardak', { type: 'gazebo' }, 4);
await shoot('belediye-yadigarlar', { type: 'townHall' }, 4);
await page.setViewportSize({ width: 1360, height: 1700 });
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.residents')) el.style.display = 'none';
});
for (const type of ['townHall', 'harbor']) {
  await page.evaluate((type) => {
    const game = window.game;
    const b = game.state.buildings.find((x) => x.type === type);
    if (b) game.events.emit('ui:selectBuilding', b.id);
    game.render(0);
  }, type);
  await page.locator('.building-panel').screenshot({ path: `${out}/vitrin-altin-${type}.png` });
  console.log(`${out}/vitrin-altin-${type}.png`);
}
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.residents')) el.style.display = '';
  window.game.events.emit('ui:selectBuilding', null);
});
await page.setViewportSize({ width: 1360, height: 860 });
await runHours(page, 30); // arşivde birkaç gün birikir
await page.evaluate(() => {
  window.game.events.emit('ui:toggleStats');
  window.game.render(0);
});
await page.screenshot({ path: `${out}/vitrin-arsiv.png` });
console.log(`${out}/vitrin-arsiv.png`);
await page.evaluate(() => {
  window.game.events.emit('ui:toggleStats');
  window.game.events.emit('ui:toggleCinematic');
});
await page.waitForTimeout(700); // arayüz yumuşakça kaybolur
await shoot('fotograf-modu', { type: 'gazebo' }, 3);
await page.evaluate(() => window.game.events.emit('ui:toggleCinematic'));

await page.evaluate(() => {
  const game = window.game;
  const b = game.state.buildings.find((x) => x.type === 'townHall');
  game.events.emit('ui:selectBuilding', b.id);
  game.render(0);
});
await page.screenshot({ path: `${out}/vitrin-fermanlar.png`, clip: { x: 880, y: 0, width: 480, height: 860 } });
console.log(`${out}/vitrin-fermanlar.png`);
await page.evaluate(() => {
  const game = window.game;
  game.events.emit('ui:selectBuilding', null);
  game.state.dilemma.history = {};
  game.scenes.current.dilemmas.maybeStart('bards');
  game.render(0);
});
await shoot('karar', {});
await page.evaluate(() => window.game.events.emit('ui:chooseDilemma', { optionId: 'fair' }));
await runHours(page, 12); // 22:00
await shoot('gece-kedi', { animal: 'cat' }, 5);
await shoot('gece-harika', { type: 'wonder' }, 2);

// --- 14. aşama: mevsim festivalleri, sis, fırtına, anılar, toplanma zili ---
async function festival(theme) {
  await page.evaluate((theme) => {
    const game = window.game;
    const s = game.state;
    if (s.events.festival.active) game.scenes.current.townEvents.endFestival();
    Object.assign(s.seasonFestival, { day: s.time.day, theme, stage: 'announced' });
    game.scenes.current.seasonFestivals.start();
  }, theme);
  await runHours(page, 1.5);
  await page.evaluate(() => {
    const game = window.game;
    const venue = game.state.buildings.find((b) => b.id === game.state.events.festival.venueId);
    const scene = game.scenes.current;
    scene.camera.zoom = 3;
    scene.camera.centerOn(venue.center.x, venue.center.y + 12, game.renderer.width, game.renderer.height);
    scene.camera.clamp(scene.map.pixelWidth, scene.map.pixelHeight, game.renderer.width, game.renderer.height);
    game.render(0);
  });
  await page.screenshot({ path: `${out}/vitrin-festival-${theme}.png` });
  console.log(`${out}/vitrin-festival-${theme}.png`);
}
await festival('winter'); // gece: şölen ateşi, kardan adam, parıldayan fenerler
await page.evaluate(() => window.game.scenes.current.townEvents.endFestival());
await runHours(page, 10); // sabah
await page.evaluate(() => window.game.scenes.current.weather.force('mist'));
await runHours(page, 1);
await shoot('sabah-sisi', { type: 'fountain' }, 3);
await festival('spring');
await festival('autumn');
await festival('summer');
await page.evaluate(() => window.game.scenes.current.townEvents.endFestival());
// Anılar: en çok anısı olan sakinin paneli
await page.setViewportSize({ width: 1360, height: 1500 });
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.residents')) el.style.display = 'none';
  const game = window.game;
  const c = [...game.state.characters].sort((a, b) => b.memories.length - a.memories.length)[0];
  game.scenes.current.memories.recall(c);
  game.events.emit('ui:selectCharacter', c.id);
  game.render(0);
});
await page.locator('.character-panel:not([hidden])').first().screenshot({ path: `${out}/vitrin-anilar.png` });
console.log(`${out}/vitrin-anilar.png`);
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.residents')) el.style.display = '';
  window.game.events.emit('ui:selectCharacter', null);
});
await page.setViewportSize({ width: 1360, height: 860 });
// Toplanma Zili ve fırtına
await page.evaluate(() => {
  window.game.state.rally = null;
  window.game.events.emit('ui:rallyBell');
});
await runHours(page, 0.5);
await shoot('toplanma-zili', { type: 'fountain' }, 3);
await page.evaluate(() => window.game.scenes.current.weather.force('thunderstorm'));
await runHours(page, 0.6);
await page.evaluate(() => {
  const fx = window.game.scenes.current.weatherFx;
  fx.flash = 0.9; // şimşek anı
});
await shoot('yaz-firtinasi', { type: 'fountain' }, 3);
console.log('Sayfa hataları:', errors.length ? errors.join('\n') : 'yok');
await browser.close();
process.exit(errors.length ? 1 : 0);
