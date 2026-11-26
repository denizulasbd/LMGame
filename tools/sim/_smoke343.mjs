import { openGame } from './lib.mjs';
const { browser, page, errors } = await openGame({ seed: 5 });
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const sc = game.scenes.current;
  const map = sc.map;
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  const T = [];
  // en çok ağaç / kaya içeren 3x3 (cabin 2x2?) 
  const { BUILDINGS } = await import('/src/data/buildings.js');
  const def = BUILDINGS.cabin;
  let best = null;
  const o = map.openBounds;
  for (let y = o.y0; y < o.y1 - 3; y++) for (let x = o.x0; x < o.x1 - 3; x++) {
    const c = sc.construction.checkPlacement('cabin', x, y);
    if (c.ok && c.clears.tiles.length >= 2 && (!best || c.clears.tiles.length > best.n)) best = { x, y, n: c.clears.tiles.length, note: c.note };
  }
  T.push(JSON.stringify(best), JSON.stringify(def.size));
  if (!best) return T;
  const r = sc.construction.placeSite('cabin', best.x, best.y);
  T.push('placed ' + r.ok + ' cleared ' + r.cleared + ' jobs ' + game.state.jobs.length);
  for (let i = 0; i < 14; i++) { sim.step(225 * 4); const b = r.building; T.push(`h${i}: clearing=${sc.world.isClearing(b)} under=${b.underConstruction} jobs=${game.state.jobs.map((j) => j.type + (j.progress | 0)).join(',')} wood=${game.state.resources.wood}`); }
  return T;
});
console.log(out.join('\n'), errors);
await browser.close();
