import { openGame } from './lib.mjs';
const { browser, page, errors } = await openGame({ seed: 5 });
const out = await page.evaluate(async () => {
  const { sim, game } = window; const T = [];
  const sc = () => game.scenes.current; const st = game.state;
  sim.give({ wood: 400, stone: 400 });
  const o = sc().map.openBounds; let plan = null;
  for (let y = o.y0; y < o.y1 && !plan; y++) for (let x = o.x0; x < o.x1 && !plan; x++) { const r = sc().construction.checkPlacement('cabin', x, y); if (r.ok && r.clears.trees >= 1) plan = { x, y }; }
  const site = sc().construction.placeSite('cabin', plan.x, plan.y);
  localStorage.setItem('lmgame.save.v2', JSON.stringify({ ...sc().saves.snapshot(), version: 42 }));
  game.events.emit('ui:load');
  const b = game.state.buildings.find((b) => b.tileX === plan.x && b.tileY === plan.y);
  T.push(`after load jobs ${game.state.jobs.map((j) => j.type + ':' + (j.siteId ?? '-') + ':' + j.assignees.length).join(',')} clearing ${sc().world.isClearing(b)}`);
  for (let i = 0; i < 8; i++) { sim.step(225 * 3); T.push(`${game.state.time.hour} jobs ${game.state.jobs.map((j) => j.type + ':' + (j.progress | 0)).join(',')} clearing ${sc().world.isClearing(sc().world.getBuilding(b.id))} chars ${sc().world.characters.length}`); }
  return T;
});
console.log(out.join('\n'), errors);
await browser.close();
