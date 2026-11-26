// (34.2) Ekran görüntüleri: parsel satın alma. Kilitli toprağın üstünde ipucu ve çerçeve vurgusu, parsel kartı (alınabilir ve pasif:
// altın yetmiyor / komşu değil), satın alma sonrası (sevinç efekti, hikâye kartı) ve alınan parselle büyümüş harita.
// Çıktı docs/playtest/img34.2/. Kullanım: node tools/sim/shots34.2.mjs [--seed 42] [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img34.2';
const seed = Number(options.seed ?? 42);
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed, stopLoop: false, viewport: { width: 1280, height: 800 } });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await wait(450); await page.screenshot({ path: `${out}/${name}.png` }); console.log(`${out}/${name}.png`); };

// Hazırlık: kuzey şeridinde çekirdeğe değen bir parsel; kamera çekirdeğin kuzey kenarında, yakınlık 2
const setup = await page.evaluate(() => {
  const { game } = window;
  const sc = game.scenes.current;
  const s = game.state;
  s.guide = { done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'cards', 'cardAction', 'watch', 'levy', 'gold', 'stone', 'doctrine', 'lifespan', 'court', 'expand'], off: true };
  s.time.hour = 12;
  s.weather.cloud = 0;
  s.resources.gold = 60;
  sc.camera.zoom = 2;
  const p = sc.parcels.find((q) => q.ring === 1 && q.side === 'n' && q.neighbors.includes('core') && q.kind !== undefined);
  sc.camera.centerOn((p.x + p.w / 2) * 16, (p.y + p.h - 4) * 16, game.renderer.width, game.renderer.height);
  const t = (wx, wy) => ({ x: (wx * 16 - sc.camera.x) * sc.camera.zoom, y: (wy * 16 - sc.camera.y) * sc.camera.zoom });
  const hover = t(p.x + p.w / 2 + 3, p.y + p.h - 6);
  return { id: p.id, name: p.name, hover };
});
await page.mouse.move(setup.hover.x, setup.hover.y);
await wait(500);
await page.evaluate(() => window.game.ui.render());
await shot('1-ipucu');

// Parsel kartı, altın yetmiyor (pasif düğme, neden yazılı)
await page.mouse.click(setup.hover.x, setup.hover.y);
await wait(300);
await page.mouse.move(640, 700);
await shot('2-kart-yetersiz-altin');

// Alınabilir (altın yeter): kart yenilenir
await page.evaluate(() => { window.game.state.resources.gold = 500; });
await wait(400);
await shot('3-kart-alinabilir');

// Pasif: komşu değil (ikinci halka) — kamera ikinci halkaya
const far = await page.evaluate((id) => {
  const { game } = window;
  const sc = game.scenes.current;
  const p = sc.parcels.find((q) => q.id === id);
  const q = sc.parcels.find((r) => r.ring === 2 && r.side === 'n' && r.x < p.x + p.w && r.x + r.w > p.x);
  sc.camera.centerOn((q.x + q.w / 2) * 16, (q.y + q.h / 2) * 16, game.renderer.width, game.renderer.height);
  return { x: (q.x + q.w / 2) * 16 * 0 + (((q.x + q.w / 2) * 16 - sc.camera.x) * sc.camera.zoom), y: ((q.y + q.h / 2) * 16 - sc.camera.y) * sc.camera.zoom };
}, setup.id);
await wait(200);
await page.mouse.click(far.x, far.y);
await wait(300);
await page.mouse.move(640, 760);
await shot('4-kart-komsu-degil');

// Satın alma: kartta Satın Al; hemen ardından sevinç efekti ve hikâye kartı
await page.evaluate((id) => {
  const sc = window.game.scenes.current;
  const p = sc.parcels.find((q) => q.id === id);
  sc.camera.centerOn((p.x + p.w / 2) * 16, (p.y + p.h - 4) * 16, window.game.renderer.width, window.game.renderer.height);
  window.game.events.emit('ui:openParcel', { id, x: 700, y: 260 });
}, setup.id);
await wait(300);
await page.click('.parcel-buy');
await wait(350);
await shot('5-satin-alma-sevinci');
await wait(2500);
await page.mouse.move(640, 760);
await page.evaluate(() => { window.game.scenes.current.camera.zoom = 1; });
await shot('6-satin-alindiktan-sonra');
console.log(setup.name, errors.length ? errors.join('\n') : 'hata yok');
await browser.close();
