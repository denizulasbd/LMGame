// Başsız simülasyon araçlarının ortak kütüphanesi. Oyunu Chromium'da (Playwright) açar, oyun döngüsünü durdurur
// ve oyunu sabit 1/60 sn adımlarla, 4x hızda ilerletir (1 oyun saati = 225 adım). Math.random tohumlanır, böylece
// aynı tohum her seferinde aynı sonucu verir.
//
// Gereken: Playwright (npm i -g playwright) ve proje kökünde çalışan sunucu: python3 tools/serve.py
// Adres: LMGAME_URL ortam değişkeni (varsayılan http://localhost:8080).
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const BASE_URL = process.env.LMGAME_URL ?? 'http://localhost:8080';
export const STEPS_PER_HOUR = 225;

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
 */
export async function openGame({ seed = 42, path = '', viewport = { width: 1280, height: 800 }, randomSeed = seed, stopLoop = true } = {}) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
  });
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
    ];
    for (const name of watch) {
      game.events.on(name, (p) => {
        const what =
          p?.tier?.name ?? p?.resource ?? p?.milestone?.id ?? p?.option?.id ?? p?.project?.name ?? p?.active?.id ??
          p?.relic?.name ?? p?.good?.name ?? p?.decree?.name ??
          p?.animal?.name ?? p?.character?.name ?? p?.building?.type ?? p?.kind ?? '';
        const extra = p?.amount ? `${p.from}->${p.to} ${p.amount}` : p?.damaged ? `hasar: ${p.damaged.map((b) => b.type).join(',') || 'yok'}` : p?.auto ? '(süre doldu)' : '';
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
export async function runHours(page, hours, hook = null) {
  await page.evaluate(
    ({ hours, hook, base }) => {
      const perHour = Math.round((base * 4) / (window.game.state.time.speed || 4));
      const steps = Math.round(hours * perHour);
      for (let i = 0; i < steps; i++) {
        window.game.update(1 / 60);
        if (hook && i % perHour === 0) window[hook]?.();
      }
    },
    { hours, hook, base: STEPS_PER_HOUR }
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
      for (const r of results) console.log(`${r.ok ? 'GEÇTİ' : 'KALDI'} ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
      const failed = results.filter((r) => !r.ok).length;
      console.log(`\n${results.length - failed}/${results.length} test geçti`);
      console.log('Sayfa hataları:', errors.length ? `\n${errors.join('\n')}` : 'yok');
      return failed === 0 && errors.length === 0;
    },
  };
}
