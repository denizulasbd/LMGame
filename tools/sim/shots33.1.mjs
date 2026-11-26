// (33.1) Ekran görüntüsü: AYNI harita tohumuyla açılmış üç yeni kasabanın "Kasaba Sakinleri" listesi yan yana
// (harita aynı, sakinler farklı). Çıktı docs/playtest/img33.1/. Kullanım: node tools/sim/shots33.1.mjs [--seed 21] [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img33.1';
const seed = Number(options.seed ?? 21);
fs.mkdirSync(out, { recursive: true });

const lives = [101, 202, 303]; // farklı hayat tohumları: aynı harita, farklı insanlar
const shots = [];
for (const life of lives) {
  const { browser, page, errors } = await openGame({ seed, life, stopLoop: false, viewport: { width: 1280, height: 800 } });
  await page.evaluate(() => { try { localStorage.setItem('lmgame.ui.residentsCollapsed', '0'); } catch { /* yok */ } });
  await page.reload();
  await page.waitForFunction(() => window.game?.scenes?.current?.world);
  await page.waitForTimeout(1500);
  const names = await page.evaluate(() => game.state.characters.map((c) => `${c.name} (${c.age})`).join(', '));
  console.log(`hayat ${life}: ${names}`);
  await page.screenshot({ path: `${out}/kasaba-${life}.png` });
  const panel = page.locator('.resident-drawer .panel.residents').first();
  const buf = await panel.screenshot();
  shots.push({ life, data: buf.toString('base64'), names });
  if (errors.length) console.log(errors.join('\n'));
  await browser.close();
}

// yan yana birleştirme: küçük bir sayfa üç resmi yan yana dizer
const { chromium } = (await import('module')).createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 400 }, deviceScaleFactor: 2 });
const html = `<body style="margin:0;background:#2b2233;color:#fff3b0;font:14px sans-serif;padding:16px">
<div style="margin-bottom:10px">Aynı harita tohumu (${seed}) · üç yeni kasaba · sakinler her seferinde farklı</div>
<div style="display:flex;gap:16px;align-items:flex-start">${shots.map((s) => `<div><img style="image-rendering:pixelated" src="data:image/png;base64,${s.data}"><div style="margin-top:6px;font-size:11px;opacity:.7">hayat tohumu ${s.life}</div></div>`).join('')}</div></body>`;
await page.setContent(html);
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/uc-kasaba-yan-yana.png`, fullPage: true });
console.log(`${out}/uc-kasaba-yan-yana.png`);
await browser.close();
