// (32.6b) Gerçek tarayıcıda elle oyun: bir Chromium açar, oyunu gerçek zamanlı çalıştırır ve küçük bir HTTP denetleyicisiyle fare / klavye
// gönderir, ekran görüntüsü alır, ekrandaki yazıyı okur. Oyuncu günlüğü içindir: YALNIZCA oyun arayüzüyle oynanır (sim yardımcıları, kaynak
// verme, durum yazma YOK); hız düğmeleri ve duraklatma oyunun kendi arayüzündendir. Denetleyici oyun durumunu hiç yazmaz.
//   node tools/sim/play.mjs --save kayit.json [--port 9100] [--out docs/playtest/img6] [--width 1280] [--height 800] [--seed 42]
// Uç noktalar (GET, sorgu parametreli; hepsi JSON döner):
//   /shot?name=ad            ekran görüntüsü (out/ad.png)
//   /click?x=&y=[&right=1][&double=1]      fareyle tıkla (gerçek fare olayı)
//   /sel?q=CSS[&text=regex][&i=0][&right=1] CSS seçiciye (ve yazı süzgecine) uyan görünür ilk öğenin ortasına tıkla
//   /drag?x1=&y1=&x2=&y2=    basılı tutarak sürükle (Topla / yapı fırçası)
//   /move?x=&y=              fareyi taşı (ipucu için)
//   /key?k=Space             tuşa bas (Playwright adı: Space, Escape, o, w ...)
//   /wheel?dy=               tekerlek
//   /text?q=CSS[&all=1]      görünür öğenin yazısı (ekranı okumak gibi)
//   /rects?q=CSS             eşleşen öğelerin kutuları (tıklanacak yeri bulmak için)
//   /wait?ms=                bekle (gerçek zaman)
//   /quit
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';
import { parseArgs, BASE_URL } from './lib.mjs';

const require = createRequire(import.meta.url);
const { options } = parseArgs();
const port = Number(options.port ?? 9100);
const out = path.resolve(String(options.out ?? 'docs/playtest/img6'));
fs.mkdirSync(out, { recursive: true });
const { chromium } = require('playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(options.width ?? 1280), height: Number(options.height ?? 800) }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.stack ?? e).slice(0, 400)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[error] ${m.text().slice(0, 300)}`); });
if (options.save) {
  const raw = fs.readFileSync(String(options.save), 'utf8');
  await page.addInitScript((r) => { if (!localStorage.getItem('lmgame.__seeded')) { localStorage.setItem('lmgame.save.v2', r); localStorage.setItem('lmgame.__seeded', '1'); } }, raw);
}
await page.goto(options.save ? `${BASE_URL}/` : `${BASE_URL}/?seed=${options.seed ?? 42}`);
await page.waitForFunction(() => window.game?.scenes?.current?.world);

const visible = async (q, text, i = 0) => {
  const loc = text ? page.locator(q).filter({ hasText: new RegExp(text, 'i') }) : page.locator(q);
  const n = await loc.count();
  let seen = 0;
  for (let k = 0; k < n; k++) {
    const el = loc.nth(k);
    if (!(await el.isVisible())) continue;
    if (seen++ === i) return el;
  }
  return null;
};
const json = (res, obj, code = 200) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const q = Object.fromEntries(u.searchParams);
  try {
    switch (u.pathname) {
      case '/shot': {
        const file = path.join(out, `${q.name ?? 'shot'}.png`);
        await page.screenshot({ path: file });
        return json(res, { path: file });
      }
      case '/click':
        await page.mouse.click(Number(q.x), Number(q.y), { button: q.right ? 'right' : 'left', clickCount: q.double ? 2 : 1 });
        return json(res, { ok: true });
      case '/sel': {
        const el = await visible(q.q, q.text, Number(q.i ?? 0));
        if (!el) return json(res, { ok: false, error: 'görünür öğe yok' });
        const box = await el.boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: q.right ? 'right' : 'left' });
        return json(res, { ok: true, box, text: (await el.innerText()).slice(0, 120) });
      }
      case '/drag':
        await page.mouse.move(Number(q.x1), Number(q.y1));
        await page.mouse.down();
        await page.mouse.move(Number(q.x2), Number(q.y2), { steps: 12 });
        await page.mouse.up();
        return json(res, { ok: true });
      case '/move':
        await page.mouse.move(Number(q.x), Number(q.y));
        return json(res, { ok: true });
      case '/key':
        await page.keyboard.press(q.k);
        return json(res, { ok: true });
      case '/wheel':
        await page.mouse.wheel(0, Number(q.dy ?? 0));
        return json(res, { ok: true });
      case '/text': {
        const loc = page.locator(q.q);
        const n = await loc.count();
        const texts = [];
        for (let k = 0; k < n && (q.all || !texts.length); k++) if (await loc.nth(k).isVisible()) texts.push((await loc.nth(k).innerText()).slice(0, 1500));
        return json(res, { texts });
      }
      case '/rects': {
        const rects = await page.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null || e.getClientRects().length).slice(0, 60).map((e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), text: (e.innerText ?? '').slice(0, 60).replace(/\s+/g, ' '), cls: (e.className?.toString?.() ?? '').slice(0, 60) }; }), q.q);
        return json(res, { rects });
      }
      case '/wait':
        await page.waitForTimeout(Number(q.ms ?? 1000));
        return json(res, { ok: true });
      case '/errors':
        return json(res, { errors });
      case '/quit':
        json(res, { bye: true });
        await browser.close();
        process.exit(0);
        break;
      default:
        return json(res, { error: 'bilinmeyen uç nokta' }, 404);
    }
  } catch (e) {
    return json(res, { ok: false, error: String(e.message ?? e).slice(0, 300) }, 500);
  }
});
server.listen(port, () => console.log(`play: http://localhost:${port} (oyun ${BASE_URL}, çıktı ${out})`));
