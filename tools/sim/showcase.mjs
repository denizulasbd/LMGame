// Oyun içi vitrin: yeni yapıları ve hayvanları kurup birkaç saat yaşatır, yakın plan ekran görüntüleri alır
// (gündüz, gece), karar penceresini ve belediye fermanlarını açar.
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
console.log('Sayfa hataları:', errors.length ? errors.join('\n') : 'yok');
await browser.close();
process.exit(errors.length ? 1 : 0);
