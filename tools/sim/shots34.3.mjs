// (34.3) Ekran görüntüleri: alan açma. Ağaçlı / kayalı alanda önizleme (turuncu karolar + not), yol üstüne inşada ilk tıklama (mavi karolar,
// kırmızı çerçeve, "yeniden tıkla"), temizlenmiş ve kurulmuş yapı. Çıktı docs/playtest/img34.3/.
// Kullanım: node tools/sim/shots34.3.mjs [--seed 42] [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img34.3';
const seed = Number(options.seed ?? 42);
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed, stopLoop: false, viewport: { width: 1280, height: 800 } });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await wait(500); await page.screenshot({ path: `${out}/${name}.png` }); console.log(`${out}/${name}.png`); };

const plans = await page.evaluate(() => {
  const { game, sim } = window;
  const sc = game.scenes.current;
  game.state.guide = { done: [], off: true };
  game.state.time.hour = 11;
  game.state.weather.cloud = 0;
  sim.give({ wood: 400, stone: 400, food: 300, gold: 500 });
  const o = sc.map.openBounds;
  const best = { trees: null, road: null };
  for (let y = o.y0; y < o.y1 - 2; y++) {
    for (let x = o.x0; x < o.x1 - 2; x++) {
      const r = sc.construction.checkPlacement('cabin', x, y, { roads: true });
      if (!r.ok) continue;
      const score = r.clears.trees * 2 + r.clears.rocks * 3;
      if (r.roads.length === 0 && r.clears.trees >= 2 && (!best.trees || score > best.trees.score)) best.trees = { x, y, score, note: r.note };
      if (r.roads.length >= 2 && r.clears.tiles.length === 0 && !best.road) best.road = { x, y, note: r.note };
    }
  }
  return best;
});
console.log(JSON.stringify(plans));

const focus = async (plan) => {
  await page.evaluate(({ x, y }) => {
    const sc = window.game.scenes.current;
    sc.camera.zoom = 3;
    sc.camera.centerOn((x + 1) * 16, (y + 1) * 16, window.game.renderer.width, window.game.renderer.height);
  }, plan);
  await wait(300);
  return page.evaluate(({ x, y }) => {
    const c = window.game.scenes.current.camera;
    return { sx: (x * 16 + 8 - c.x) * c.zoom, sy: (y * 16 + 8 - c.y) * c.zoom };
  }, plan);
};
const tool = () => page.evaluate(() => window.game.scenes.current.tools.setTool('build', 'cabin'));

// 1. Ağaçlı alanda önizleme
await tool();
let p = await focus(plans.trees);
await page.mouse.move(p.sx, p.sy);
await wait(500);
await shot('1-agacli-alanda-onizleme');

// 2. Yol üstünde ilk tıklama: işaretli, onay bekliyor
p = await focus(plans.road);
await page.mouse.move(p.sx, p.sy);
await wait(500);
await page.mouse.click(p.sx, p.sy);
await wait(300);
await page.mouse.move(p.sx + 2, p.sy + 2);
await shot('2-yol-ustunde-onay');
await page.evaluate(() => window.game.scenes.current.tools.setTool('select'));

// 3. Ağaçlı alana şantiye, alan açılır ve yapı biter
p = await focus(plans.trees);
await tool();
await page.mouse.move(p.sx, p.sy);
await wait(300);
await page.mouse.click(p.sx, p.sy);
await wait(300);
await page.evaluate(() => window.game.scenes.current.tools.setTool('select'));
await page.mouse.move(40, 760);
await shot('3-alan-aciliyor');
await page.evaluate(() => {
  const { game, sim } = window;
  game.loop.stop();
  for (let i = 0; i < 30; i++) {
    const site = game.state.buildings.find((b) => b.type === 'cabin' && b.underConstruction);
    if (!site) break;
    sim.step(225 * 3);
  }
  game.loop.start();
});
await wait(600);
await shot('4-temizlenip-kurulmus');
console.log(errors.length ? errors.join('\n') : 'hata yok');
await browser.close();
