// (34.1) Ekran görüntüsü: genişleyen harita. Bütün dünya tek karede (yakınlık 1): kilitli halkalar, bir parseli açılmış harita,
// bütün parseller açık. Çıktı docs/playtest/img34.1/. Kullanım: node tools/sim/shots34.1.mjs [--seed 42] [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img34.1';
const seed = Number(options.seed ?? 42);
fs.mkdirSync(out, { recursive: true });

async function shot(name, setup) {
  const { browser, page, errors } = await openGame({ seed, viewport: { width: 2400, height: 2400 } });
  const info = await page.evaluate((setup) => {
    const { game, sim } = window;
    const scene = game.scenes.current;
    let opened = null;
    if (setup === 'one') {
      opened = scene.parcels.find((p) => p.ring === 1 && p.neighbors.includes('core') && p.side === 'n' && p.w >= 16) ?? scene.parcels.find((p) => p.neighbors.includes('core'));
      sim.unlockParcel(opened.id);
    }
    if (setup === 'all') sim.unlockAllParcels();
    game.state.time.hour = 12;
    game.state.weather.cloud = 0;
    document.getElementById('ui-layer').style.display = 'none';
    sim.step(2);
    scene.camera.zoom = 1;
    const { width, height } = game.renderer;
    const m = scene.map;
    scene.camera.x = ((m.x0 + m.x1) / 2) * 16 - width / 2;
    scene.camera.y = ((m.y0 + m.y1) / 2) * 16 - height / 2;
    scene.render(game.renderer);
    return { opened: opened?.id ?? null, world: `${m.width}x${m.height}`, parcels: scene.parcels.length };
  }, setup);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(name, JSON.stringify(info), errors.length ? errors.join('\n') : '');
  await browser.close();
}

await shot('kilitli-halka', 'none');
await shot('bir-parsel-acik', 'one');
await shot('butun-parseller', 'all');
