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

// Hazırlık: kamera çekirdeğin kuzey-batı köşesinde (yakınlık 2); ekranın üst-sol kısmı kilitli ilk halka
await page.evaluate(() => {
  const { game } = window;
  const sc = game.scenes.current;
  const s = game.state;
  s.guide = { done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'cards', 'cardAction', 'watch', 'levy', 'gold', 'stone', 'doctrine', 'lifespan', 'court', 'expand'], off: true };
  s.time.hour = 12;
  s.weather.cloud = 0;
  s.resources.gold = 60;
  sc.camera.zoom = 2;
  sc.camera.centerOn(8 * 16, 8 * 16, game.renderer.width, game.renderer.height);
});
await wait(300);
// Ekranda (330, 130) noktasının altındaki parsel
const at = async (sx, sy) => page.evaluate(({ sx, sy }) => {
  const sc = window.game.scenes.current;
  const w = sc.camera.screenToWorld(sx, sy);
  const p = sc.parcelAt(Math.floor(w.x / 16), Math.floor(w.y / 16));
  return p ? { id: p.id, name: p.name } : null;
}, { sx, sy });
const spot = { x: 330, y: 130 };
const setup = { ...(await at(spot.x, spot.y)), hover: spot };
await page.mouse.move(spot.x, spot.y);
await wait(500);
await page.evaluate(() => window.game.ui.render());
await shot('1-ipucu');

// Parsel kartı, altın yetmiyor (pasif düğme, neden yazılı)
await page.mouse.click(spot.x, spot.y);
await wait(300);
await page.mouse.move(640, 700);
await shot('2-kart-yetersiz-altin');

// Alınabilir (altın yeter): kart yenilenir
await page.evaluate(() => { window.game.state.resources.gold = 500; });
await wait(400);
await shot('3-kart-alinabilir');

// Pasif: seviye kapısı (Mezra'da iki parselden sonra) — iki parsel geliştirici yoluyla açılır, üçüncüsüne tıklanır
await page.evaluate((keep) => {
  const { game, sim } = window;
  const sc = game.scenes.current;
  const others = sc.parcels.filter((q) => q.ring === 1 && q.neighbors.includes('core') && q.id !== keep);
  sim.unlockParcel(others[0].id);
  sim.unlockParcel(others[1].id);
  const t = others[2];
  sc.camera.centerOn((t.x + t.w / 2) * 16, (t.y + t.h / 2) * 16, game.renderer.width, game.renderer.height);
}, setup.id);
await wait(300);
const spot2 = { x: 900, y: 400 };
await page.mouse.click(spot2.x, spot2.y);
await wait(300);
await page.mouse.move(640, 760);
await shot('4-kart-seviye-kapisi');

// Satın alma: kartta Satın Al; hemen ardından sevinç efekti ve hikâye kartı
await page.evaluate((id) => {
  const sc = window.game.scenes.current;
  window.game.state.town.tier = 3;
  window.game.state.resources.gold = 900;
  sc.camera.centerOn(8 * 16, 8 * 16, window.game.renderer.width, window.game.renderer.height);
  window.game.events.emit('ui:openParcel', { id, x: 500, y: 260 });
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
