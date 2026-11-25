// (32.5) Ekran görüntüleri: Hobi Evleri ve Kulüpler. Üç yapı (yaz ve kış), HARİTADA akşam buluşmaları (bahçede çapa sallayan üyeler,
// Resim Atölyesi'nin önünde şövaleler, Dikiş-Nakış Evi'nin önünde taburelerde nakış; kışın serada), kulüp paneli (üyeler, katılım
// işaretleri, sıradaki adaylar ve nedenleri, Çıkar / Davet et), tablo duvarı, sakin rozeti, Kasaba Sergisi kartı, Belediye'deki itibar
// dökümünde "Kulüpler" satırı ve 1024×640 panel. Çıktı docs/playtest/img32.5/.
// Kullanım: node tools/sim/shots32.5.mjs [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img32.5';
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed: 21, stopLoop: false, viewport: { width: 1280, height: 800 } });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name, clip = null) => { await wait(400); await page.screenshot({ path: `${out}/${name}.png`, ...(clip ? { clip } : {}) }); console.log(`${out}/${name}.png`); };
const park = () => page.mouse.move(640, 790);
const focus = (type, { select = true, zoom = 4, dx = 60, dy = 0 } = {}) =>
  page.evaluate(({ type, select, zoom, dx, dy }) => {
    const sc = game.scenes.current;
    const b = game.state.buildings.find((x) => x.type === type);
    if (!b) return false;
    sc.camera.zoom = zoom;
    const { w, h } = b.definition.size;
    sc.camera.centerOn((b.tileX + w / 2) * 16 + (select ? dx : 0), (b.tileY + h / 2) * 16 + dy, game.renderer.width, game.renderer.height);
    game.events.emit('ui:selectBuilding', select ? b.id : null);
    return true;
  }, { type, select, zoom, dx, dy });
// gün + saat: oyunun kendi akışıyla ilerler (buluşma takvimi totalMinutes'a bağlı)
const toTime = (day, h, m = 0) => page.evaluate(({ day, h, m }) => {
  const st = game.state;
  let guard = 0;
  while (!(st.time.day > day || (st.time.day === day && (st.time.hour > h || (st.time.hour === h && st.time.minute >= m)))) && guard++ < 225 * 24 * 16) window.sim.step(1);
}, { day, h, m });

// Hazırlık: Kasaba; han, pazar, Belediye, kulübeler; üç hobi evi yan yana; kişilikleri uygun sakinler; birkaç ürün
await page.evaluate(async () => {
  const { sim } = window;
  const s = game.state;
  const sc = game.scenes.current;
  sim.give({ wood: 1500, stone: 1500, food: 900, gold: 3000, iron: 300, cloth: 200, wool: 200 });
  s.town.tier = 3;
  s.guide = { done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'cards', 'cardAction', 'watch', 'levy', 'gold', 'stone', 'doctrine', 'lifespan', 'court'], off: true };
  for (const t of ['storage', 'inn', 'market', 'cabin', 'cabin', 'cabin', 'cabin', 'cabin', 'townHall']) sim.place(t);
  for (const t of ['gardenClub', 'paintingClub', 'sewingClub']) sim.place(t, { maxRadius: 14 });
  sc.population.welcomeNewcomers(10);
  const people = s.characters.filter((c) => !c.isChild && !c.role).sort((a, b) => a.id - b.id);
  const set = (c, traits, quirk) => { c.traits = traits; c.quirk = quirk; c.newcomer = false; };
  people.forEach((c, i) => {
    if (i < 5) set(c, ['natureLover', 'cheerful'], 'natureEnthusiast');
    else if (i < 9) set(c, ['introvert', 'cheerful'], i % 2 ? 'bookworm' : 'philosopher');
    else if (i < 13) set(c, ['hardworking', 'introvert'], 'craftsman');
  });
  sc.clubs.newDay();
  const C = await import('/src/systems/Clubs.js');
  const gr = sc.clubs.rec('gardenClub');
  gr.works = 4;
  gr.sessions = 12;
  const pr = sc.clubs.rec('paintingClub');
  const painters = C.membersOf(s, 'paintingClub');
  pr.paintings = ['Bahar Sabahı', 'Yaz Öğleni', 'Nehir Kıyısı', 'Güz Akşamı'].map((t, i) => ({ title: `${t} — ${painters[i % painters.length].name}`, day: 1 }));
  pr.works = 4;
  pr.sessions = 12;
  const att = (k) => C.membersOf(s, k).map((c) => c.id);
  for (const k of ['gardenClub', 'paintingClub', 'sewingClub']) {
    const r = sc.clubs.rec(k);
    r.attendance = [att(k), att(k).slice(1), att(k)];
    r.recent = [1, 1, 1, 0];
  }
  sc.clubs.syncWorks();
  window.__member = C.membersOf(s, 'gardenClub')[0].id;
  sim.step(2);
});
await wait(600);

// 1-3. yapılar (yaz, gündüz)
await toTime(1, 12, 0);
for (const [type, name] of [['gardenClub', '01-bahcecilik-kulubu-yaz'], ['sewingClub', '02-dikis-nakis-evi-yaz'], ['paintingClub', '03-resim-atolyesi-yaz']]) {
  await focus(type, { select: false, zoom: 6 });
  await park();
  await shot(name);
}
// 4-5. tek gün akşamı: Bahçecilik Kulübü ve Resim Atölyesi buluşması HARİTADA
await toTime(1, 18, 20);
await focus('gardenClub', { select: false, zoom: 5, dy: 8 });
await park();
await shot('04-harita-bahce-bulusmasi');
await toTime(1, 18, 32);
await focus('paintingClub', { select: false, zoom: 5, dy: 8 });
await shot('05-harita-resim-atolyesi-sovaleler');
// 6. panel (buluşma sırasında): üyeler, katılım, adaylar, Çıkar / Davet
await focus('gardenClub', { zoom: 4, dx: 90 });
await wait(800);
await page.evaluate(() => document.querySelector('.building-club')?.scrollIntoView({ block: 'start' }));
await shot('06-panel-bahce');
// 7. tablo duvarı
await focus('paintingClub', { zoom: 4, dx: 90 });
await wait(800);
await page.evaluate(() => document.querySelector('.building-club .club-gallery')?.scrollIntoView({ block: 'center' }));
await shot('07-tablo-duvari');
await page.evaluate(() => game.events.emit('ui:selectBuilding', null));
// 8. çift gün akşamı: Dikiş-Nakış Evi (taburelerde nakış, aydınlık pencere)
await toTime(2, 18, 15);
await focus('sewingClub', { select: false, zoom: 5, dy: 8 });
await park();
await shot('08-harita-dikis-bulusmasi');
// 9. sakin kartı rozeti
await page.evaluate(() => game.events.emit('ui:selectCharacter', window.__member));
await wait(800);
await shot('09-sakin-rozeti');
await page.evaluate(() => game.events.emit('ui:selectCharacter', null));
// 10. Kasaba Sergisi kartı (altıncı tablo)
await page.evaluate(async () => {
  const C = await import('/src/systems/Clubs.js');
  const s = game.state;
  const sc = game.scenes.current;
  const pr = sc.clubs.rec('paintingClub');
  const pb = C.clubBuilding(s, 'paintingClub');
  const painters = C.membersOf(s, 'paintingClub');
  pr.sessions = 15;
  sc.clubs.product('paintingClub', pb, pr, painters);
  pr.sessions = 18;
  sc.clubs.product('paintingClub', pb, pr, painters);
  window.sim.step(2);
});
await focus('paintingClub', { select: false, zoom: 4 });
await wait(900);
await park();
await shot('10-kasaba-sergisi-karti');
// 11. Belediye: itibar dökümünde "Kulüpler" satırı
await focus('townHall', { zoom: 3 });
await wait(800);
await page.evaluate(() => [...document.querySelectorAll('.building-panel div')].find((n) => /^Kulüpler \+/.test(n.textContent) && n.children.length === 0)?.scrollIntoView({ block: 'center' }));
await wait(300);
await shot('11-itibar-kulupler-satiri');
await page.evaluate(() => game.events.emit('ui:selectBuilding', null));
// 12-14. kış: üç yapı karlı; bahçe buluşması serada (cam içten yanar, üyeler içeride)
await toTime(13, 12, 0);
for (const [type, name] of [['gardenClub', '12a-bahcecilik-kulubu-kis'], ['sewingClub', '12b-dikis-nakis-evi-kis'], ['paintingClub', '12c-resim-atolyesi-kis']]) {
  await focus(type, { select: false, zoom: 6 });
  await park();
  await shot(name);
}
await toTime(13, 18, 10);
await focus('gardenClub', { select: false, zoom: 5, dy: 8 });
await shot('13-kis-bulusmasi-serada');
// 14. 1024×640 panel
await page.setViewportSize({ width: 1024, height: 640 });
await wait(600);
await focus('sewingClub', { zoom: 3, dx: 110 });
await wait(900);
await page.evaluate(() => document.querySelector('.building-club')?.scrollIntoView({ block: 'start' }));
await shot('14-panel-1024x640');

if (errors.length) console.log('Sayfa hataları:\n' + errors.join('\n'));
await browser.close();
process.exit(errors.length ? 1 : 0);
