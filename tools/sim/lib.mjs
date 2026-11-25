// Başsız simülasyon araçlarının ortak kütüphanesi. Oyunu Chromium'da (Playwright) açar, oyun döngüsünü durdurur
// ve oyunu sabit 1/60 sn adımlarla, 4x hızda ilerletir (1 oyun saati = 225 adım). Math.random tohumlanır, böylece
// aynı tohum her seferinde aynı sonucu verir.
//
// Gereken: Playwright (npm i -g playwright) ve proje kökünde çalışan sunucu: python3 tools/serve.py
// Adres: LMGAME_URL ortam değişkeni (varsayılan http://localhost:8080).
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const BASE_URL = process.env.LMGAME_URL ?? 'http://localhost:8080';
export const STEPS_PER_HOUR = 225;
/** Ayrıntılı çıktı: --verbose bayrağı ya da LMGAME_VERBOSE=1 (varsayılan: sessiz). */
export const VERBOSE = process.argv.includes('--verbose') || process.env.LMGAME_VERBOSE === '1';

/** Komut satırı: konum argümanları ve --anahtar değer seçenekleri. */
export function parseArgs(argv = process.argv.slice(2)) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) options[key] = true;
      else {
        options[key] = next;
        i++;
      }
    } else positional.push(argv[i]);
  }
  return { positional, options };
}

/**
 * Tarayıcıyı açar, oyunu verilen tohumla yükler ve döngüyü durdurur.
 * Dönüş: { browser, page, errors } — errors: sayfa hataları ve konsol uyarıları
 * (30.4a) enginesOff: kapatılacak ENGINES anahtarları (dizi ya da virgüllü metin; '*' hepsi). Sayfa açılmadan önce
 * globalThis.__LMGAME_ENGINES_OFF olarak enjekte edilir: Engines.js modül yüklenirken okur (açılışta bilinmesi gereken şalterler).
 */
export async function openGame({ seed = 42, path = '', viewport = { width: 1280, height: 800 }, randomSeed = seed, stopLoop = true, enginesOff = null } = {}) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
  });
  const off = Array.isArray(enginesOff) ? enginesOff : typeof enginesOff === 'string' ? enginesOff.split(',').map((k) => k.trim()).filter(Boolean) : [];
  if (off.length) await page.addInitScript((keys) => { globalThis.__LMGAME_ENGINES_OFF = keys; }, off);
  if (randomSeed !== null) {
    await page.addInitScript((s) => {
      let x = (s * 2654435761) >>> 0 || 1;
      Math.random = () => {
        x ^= x << 13;
        x >>>= 0;
        x ^= x >>> 17;
        x ^= x << 5;
        x >>>= 0;
        return x / 4294967296;
      };
    }, randomSeed);
  }
  if (stopLoop && !path) {
    // Oyun döngüsü hiç kare çalıştırmasın: aksi halde sayfa açılışıyla loop.stop() arasında gerçek zamana (ve
    // makinenin yüküne) bağlı sayıda adım geçer ve aynı tohum farklı sonuç verir. Kare isteği bir kez yutulur.
    await page.addInitScript(() => {
      const raf = window.requestAnimationFrame.bind(window);
      let swallowed = false;
      window.requestAnimationFrame = (cb) => {
        if (!swallowed && window.game === undefined) {
          swallowed = true;
          return 0;
        }
        return raf(cb);
      };
    });
  }
  await page.goto(path ? `${BASE_URL}/${path}` : `${BASE_URL}/?seed=${seed}`);
  if (!path) {
    await page.waitForFunction(() => window.game?.scenes?.current?.world);
    await installHelpers(page, stopLoop);
  }
  return { browser, page, errors };
}

/**
 * Sayfaya yardımcılar kurar (window.sim):
 *   sim.step(n)          : n adım ilerlet (karar penceresi açıksa 30 sn sonra varsayılan seçenek uygulanır)
 *   sim.place(type, opt) : meydana en yakın uygun yere yapı kur; opt.instant: inşaatı hemen bitir
 *   sim.give(resources)  : kaynak ver (depo sınırını yok sayar)
 *   sim.log              : önemli olayların saatli listesi
 */
async function installHelpers(page, stopLoop) {
  await page.evaluate((stopLoop) => {
    const game = window.game;
    if (stopLoop) game.loop.stop();
    game.state.time.speed = 4;
    // (30.1) Başsız araçlarda karar penceresinin 30 sn'lik süresi işler (oyuncu için varsayılan: süre yok); yükleme / sıfırlama
    // tercihi silerse yeniden açılır, böylece otopilot, stres ve dondurulmuş testler eskisi gibi çalışır
    game.state.settings.dilemmaTimer = true;
    for (const method of ['restore', 'reset']) {
      const original = game.state[method].bind(game.state);
      game.state[method] = (...args) => {
        const out = original(...args);
        game.state.settings.dilemmaTimer = true;
        return out;
      };
    }
    const stamp = () => {
      const t = game.state.time;
      return `G${t.day} ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    };
    const sim = {
      log: [],
      stamp,
      step(n) {
        for (let i = 0; i < n; i++) game.update(1 / 60);
      },
      scene: () => game.scenes.current,
      give(resources) {
        Object.assign(game.state.resources, resources);
      },
      findSpot(type, maxRadius = 30) {
        const scene = game.scenes.current;
        const plaza = scene.world.landmarks.plaza;
        for (let r = 3; r <= maxRadius; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
              if (scene.construction.checkPlacement(type, plaza.centerX + dx, plaza.centerY + dy).ok) return { x: plaza.centerX + dx, y: plaza.centerY + dy };
            }
          }
        }
        return null;
      },
      // (32.6a) Konutların (kulübe) ağırlık merkezine en yakın uygun yer: halka halka aranır; yapının önü (kapı sırası) kasabaya bağlı
      // ve oradan meydana yol bulunabilmeli. Konut yoksa ya da yer bulunamazsa null (çağıran findSpot'a düşer).
      findSpotNearHomes(type, maxRadius = 18) {
        const scene = game.scenes.current;
        const world = scene.world;
        const homes = game.state.buildings.filter((b) => b.type === 'cabin' && !b.underConstruction);
        if (!homes.length) return null;
        const cx = Math.round(homes.reduce((a, b) => a + b.tileX + 1, 0) / homes.length);
        const cy = Math.round(homes.reduce((a, b) => a + b.tileY + 1, 0) / homes.length);
        const size = window.__buildingsData?.BUILDINGS?.[type]?.size ?? { w: 2, h: 2 };
        const plaza = world.landmarks.plaza;
        const goal = { x: plaza.centerX, y: plaza.centerY + 2 };
        for (let r = 0; r <= maxRadius; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
              const x = cx + dx - Math.floor(size.w / 2);
              const y = cy + dy - Math.floor(size.h / 2);
              if (!scene.construction.checkPlacement(type, x, y).ok) continue;
              const door = { x: x + Math.floor(size.w / 2), y: y + size.h };
              if (!world.isReachable(door.x, door.y)) continue;
              const target = world.map.isWalkable(goal.x, goal.y) ? goal : { x: plaza.centerX, y: plaza.centerY };
              if (!world.findPath(door, target)) continue;
              return { x, y };
            }
          }
        }
        return null;
      },
      place(type, { instant = true, maxRadius = 30 } = {}) {
        const scene = game.scenes.current;
        const spot = sim.findSpot(type, maxRadius);
        if (!spot) return null;
        const res = scene.construction.placeSite(type, spot.x, spot.y);
        if (!res.ok) return null;
        if (instant) {
          const job = scene.jobs.jobs.find((j) => j.buildingId === res.building.id);
          if (job) scene.jobs.cancel(job);
          scene.construction.complete(res.building);
        }
        return res.building;
      },
    };
    const watch = [
      'town:tierUp', 'goods:firstProduced', 'heating:cold', 'milestone:completed', 'townHall:balanced', 'building:upgraded',
      'pet:arrived', 'health:fellIll', 'health:cured', 'health:recovered', 'dilemma:opened', 'dilemma:resolved', 'storm:struck',
      'expedition:departed', 'expedition:returned', 'civic:decreed', 'building:mended',
      'relic:exhibited', 'luxury:bought', 'goldDecree:issued',
      'crisis:fireStarted', 'crisis:fireOut', 'crisis:burnedDown', 'crisis:raidWarning', 'crisis:raidResolved', 'crisis:injured', 'crisis:repaired',
    ];
    for (const name of watch) {
      game.events.on(name, (p) => {
        const what =
          p?.tier?.name ?? p?.resource ?? p?.milestone?.id ?? p?.option?.id ?? p?.project?.name ?? p?.active?.id ??
          p?.relic?.name ?? p?.good?.name ?? p?.decree?.name ??
          p?.animal?.name ?? p?.character?.name ?? p?.building?.type ?? p?.kind ?? '';
        const extra = p?.amount ? `${p.from}->${p.to} ${p.amount}` : Array.isArray(p?.damaged) ? `hasar: ${p.damaged.map((b) => b.type).join(',') || 'yok'}` : p?.auto ? '(süre doldu)' : '';
        sim.log.push(`${stamp()} ${name} ${what} ${extra}`.trim());
      });
    }
    game.events.on('building:completed', (b) => sim.log.push(`${stamp()} kuruldu ${b.type}`));
    window.sim = sim;
  }, stopLoop);
}

/** Verilen zaman hızında bir oyun saati kaç sabit adımdır (4x: 225, 2x: 450, 1x: 900). */
export const stepsPerHour = (speed = 4) => Math.round((STEPS_PER_HOUR * 4) / speed);

/**
 * Oyunu saat cinsinden ilerletir (her oyun saatinde isteğe bağlı bir sayfa işlevi çağrılır). Adım sayısı oyunun o anki
 * hızına (state.time.speed) göre hesaplanır: 1x hızda aynı oyun saati dört kat daha çok (ve daha küçük) adımla geçer.
 */
export async function runHours(page, hours, hook = null, halfHook = null) {
  await page.evaluate(
    ({ hours, hook, halfHook, base }) => {
      const perHour = Math.round((base * 4) / (window.game.state.time.speed || 4));
      const steps = Math.round(hours * perHour);
      for (let i = 0; i < steps; i++) {
        window.game.update(1 / 60);
        if (hook && i % perHour === 0) window[hook]?.();
        // Saat buçuğunda çağrılan ikinci işlev (bekçi): görevlerin çoğu saat başında biter / başlar, o tek adımlık
        // geçişler örneğe "görevsiz sakin" olarak yansımasın
        if (halfHook && i % perHour === perHour >> 1) window[halfHook]?.();
      }
    },
    { hours, hook, halfHook, base: STEPS_PER_HOUR }
  );
}

/** Basit test kaydı: check(ad, koşul, ayrıntı); sonunda özet ve çıkış kodu. */
export function createChecks() {
  const results = [];
  return {
    results,
    check(name, ok, detail = '') {
      results.push({ name, ok: Boolean(ok), detail });
    },
    report(errors = []) {
      // Varsayılan: yalnızca KALAN testler, toplam satırı ve sayfa hataları. --verbose / LMGAME_VERBOSE=1: her satır.
      for (const r of results) if (VERBOSE || !r.ok) console.log(`${r.ok ? 'GEÇTİ' : 'KALDI'} ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
      const failed = results.filter((r) => !r.ok).length;
      console.log(`\n${results.length - failed}/${results.length} test geçti`);
      console.log('Sayfa hataları:', errors.length ? `\n${errors.join('\n')}` : 'yok');
      return failed === 0 && errors.length === 0;
    },
  };
}

/**
 * Ekrana en çok `limit` satır basar (29.4b). Varsayılan: console.log çıktısı toplanır; çıkışta 60 satırı geçmişse yalnızca son
 * 40 satır ve tam günlüğün yolu (tools/sim/out/<ad>.log) basılır. --verbose / LMGAME_VERBOSE=1: her şey olduğu gibi akar.
 */
export function capOutput(name, { limit = 60, tail = 40 } = {}) {
  if (VERBOSE) return;
  const lines = [];
  const orig = console.log.bind(console);
  console.log = (...a) => { lines.push(a.join(' ')); };
  process.on('exit', () => {
    const text = lines.join('\n').split('\n');
    if (text.length <= limit) return orig(text.join('\n'));
    const dir = new URL('./out/', import.meta.url);
    let where = '';
    try {
      fs.mkdirSync(dir, { recursive: true });
      const file = new URL(`${name}.log`, dir);
      fs.writeFileSync(file, text.join('\n'));
      where = ` (tam günlük: tools/sim/out/${name}.log; hepsi için --verbose)`;
    } catch { /* yazılamadı */ }
    orig(`... ${text.length - tail} satır kısaltıldı${where}\n${text.slice(-tail).join('\n')}`);
  });
}
