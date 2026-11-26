// Aşama 34.3b: eksi koordinatlı (sol / üst) toprakta çizim hatası. Sonbaharda meşe rengi ve yağmurda çamur görseli konumdan
// `%` ile seçiliyordu; eksi koordinatta -1 çıkıp oyun döngüsünü durduruyordu (sonbaharda harita donuyor, yağmurda ekran kararıyordu).
// Kullanım: node tools/sim/tests/34.3b-negative.mjs [--verbose]
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 42 });
const { results, report } = createChecks();
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const { mod } = await import('/src/utils/math.js');
  check('mod: eksi sayıda 0..n-1', mod(-1, 3) === 2 && mod(-7, 2) === 1 && mod(5, 3) === 2 && mod(0, 4) === 0, `${mod(-1, 3)} ${mod(-7, 2)}`);

  const opened = sim.unlockAllParcels();
  const scene = game.scenes.current;
  const map = scene.map;
  check('dünyada eksi koordinatlı açık toprak var', map.openBounds.x0 < 0 && map.openBounds.y0 < 0, `açılan ${opened}, açık sol üst ${map.openBounds.x0},${map.openBounds.y0}`);

  // Eksi koordinatlı karolara yol döşe (çamur yalnızca patikada çizilir) ve meşe dik
  let paths = 0;
  let oaks = 0;
  for (let y = map.openBounds.y0; y < map.openBounds.y0 + 8; y++) {
    for (let x = map.openBounds.x0; x < map.openBounds.x0 + 8; x++) {
      if (!map.isOpen(x, y)) continue;
      // ilk üç satır patika (her sütun: çamur görseli konumdan seçilir), altı meşe
      if (y < map.openBounds.y0 + 3) {
        map.set(x, y, 'path');
        map.setObject(x, y, null);
        paths += 1;
      } else {
        map.setObject(x, y, 'oak');
        oaks += 1;
      }
    }
  }
  check('sol üstte patika ve meşe hazırlandı', paths > 10 && oaks > 10, `patika ${paths}, meşe ${oaks}`);

  const { renderer } = game;
  const T = 16;
  const corners = [
    ['sol üst', map.openBounds.x0, map.openBounds.y0],
    ['sağ üst', map.openBounds.x1 - 1, map.openBounds.y0],
    ['sol alt', map.openBounds.x0, map.openBounds.y1 - 1],
    ['sağ alt', map.openBounds.x1 - 1, map.openBounds.y1 - 1],
  ];
  const queue = scene.queue;
  const failures = [];
  for (const season of ['spring', 'summer', 'autumn', 'winter']) {
    for (const wet of [false, true]) {
      for (const [label, tx, ty] of corners) {
        scene.camera.x = tx * T - renderer.width / scene.camera.zoom / 2;
        scene.camera.y = ty * T - renderer.height / scene.camera.zoom / 2;
        try {
          map.renderGround(renderer, scene.camera, 0, season, { wet });
          map.queueObjects(queue, renderer, scene.camera, season);
          queue.flush(renderer);
        } catch (err) {
          failures.push(`${season}${wet ? '+yağmur' : ''} ${label}: ${String(err).slice(0, 80)}`);
        }
      }
    }
  }
  check('dört köşe × dört mevsim × yağmur: zemin ve ağaç çizimi hatasız', failures.length === 0, failures.slice(0, 3).join(' | '));

  return out;
});
results.push(...out);

// Tam kare: kamera sol üstte, sonbahar ve yağmur. Test aracı oyun döngüsünü durdurur; burada simülasyon adımı ve tam çizim
// (Game.render: zemin, nesneler, yapılar, efektler, gece / hava katmanı) elle çağrılır. Düzeltmeden önce bu çağrı hata fırlatıyordu.
const frame = await page.evaluate(async () => {
  const { game, sim } = window;
  const scene = game.scenes.current;
  const { getSeason } = await import('/src/data/seasons.js');
  let day = game.state.time.day;
  for (let d = day; d < day + 16; d++) if (getSeason(d).key === 'autumn') { day = d; break; }
  game.state.time.day = day;
  const w = game.state.weather;
  w.type = 'rainy';
  w.rain = 0.95;
  w.cloud = 0.9;
  w.nextChangeAt = game.state.totalMinutes + 600;
  const errs = [];
  const before = game.state.totalMinutes;
  for (let i = 0; i < 6; i++) {
    sim.step(10);
    scene.camera.x = scene.map.openBounds.x0 * 16;
    scene.camera.y = scene.map.openBounds.y0 * 16;
    try {
      game.render(0);
    } catch (err) {
      errs.push(String(err).slice(0, 100));
    }
  }
  return { season: getSeason(game.state.time.day).key, rain: w.rain, before, after: game.state.totalMinutes, errs };
});
results.push({ name: 'sonbahar + yağmur, kamera sol üstte: tam kare hatasız, oyun ilerliyor', ok: frame.errs.length === 0 && frame.after > frame.before && frame.season === 'autumn', detail: `${frame.season} · yağmur ${frame.rain.toFixed(2)} · ${frame.before} → ${frame.after} · ${frame.errs[0] ?? 'hata yok'}` });

const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
