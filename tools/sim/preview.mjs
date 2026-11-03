// Sanat önizleme sayfasının (tools/art-preview.html) bölümlerinin ekran görüntüleri.
// Kullanım: node tools/sim/preview.mjs [--out klasör] ["başlık parçası" ...]
//   Başlık parçası verilmezse bütün bölümler çekilir; dosyalar: <klasör>/onizleme-00.png ...
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { positional, options } = parseArgs();
const out = options.out ?? 'tools/sim/out';
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ path: 'tools/art-preview.html', viewport: { width: 1400, height: 900 }, randomSeed: null });
await page.waitForTimeout(1500);
const boxes = await page.evaluate((want) => {
  return [...document.querySelectorAll('h2')]
    .filter((h) => !want.length || want.some((w) => h.textContent.includes(w)))
    .map((h) => {
      const row = h.nextElementSibling;
      const a = h.getBoundingClientRect();
      const b = row.getBoundingClientRect();
      return { title: h.textContent, y: a.top + window.scrollY, h: b.bottom - a.top, w: Math.max(a.width, b.width) };
    });
}, positional);
let i = 0;
for (const box of boxes) {
  const file = `${out}/onizleme-${String(i++).padStart(2, '0')}.png`;
  await page.screenshot({ path: file, clip: { x: 0, y: box.y, width: Math.min(1400, box.w + 20), height: Math.min(1800, box.h + 4) }, fullPage: true });
  console.log(file, '·', box.title);
}
console.log('Sayfa hataları:', errors.length ? errors.join('\n') : 'yok');
await browser.close();
process.exit(errors.length ? 1 : 0);
