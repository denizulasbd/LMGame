import { openGame } from './lib.mjs';
const { browser, page, errors } = await openGame({ seed: 5 });
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const sc = game.scenes.current; const map = sc.map; const T = [];
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  const o = map.openBounds; let found = null;
  for (let y = o.y0; y < o.y1 - 3 && !found; y++) for (let x = o.x0; x < o.x1 - 3 && !found; x++) {
    const c = sc.construction.checkPlacement('cabin', x, y, { roads: true });
    if (c.ok && c.roads.length >= 1) found = { x, y, roads: c.roads.length, note: c.note };
  }
  T.push(JSON.stringify(found));
  const without = sc.construction.checkPlacement('cabin', found.x, found.y);
  T.push('roads=false: ' + without.ok + ' ' + without.reason);
  const w0 = game.state.resources.wood;
  const r = sc.construction.placeSite('cabin', found.x, found.y, { roads: true });
  T.push('placed ' + r.ok + ' roads ' + r.roads + ' refund ' + JSON.stringify(r.refund) + ' tile now ' + map.get(found.x, found.y));
  // reject case: find placement w/ road cut message
  let cut = null;
  for (let y = o.y0; y < o.y1 - 3 && !cut; y++) for (let x = o.x0; x < o.x1 - 3 && !cut; x++) {
    const c = sc.construction.checkPlacement('cabin', x, y, { roads: true });
    if (!c.ok && /yolu kesilir/.test(c.reason)) cut = { x, y, reason: c.reason };
  }
  T.push(JSON.stringify(cut));
  return T;
});
console.log(out.join('\n'), errors);
await browser.close();
