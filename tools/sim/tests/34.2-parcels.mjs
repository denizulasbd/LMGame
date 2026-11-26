// Aşama 34.2 testi: parsel satın alma ve nüfus kotası. Parsel sayısı (25-30), yalnızca komşu parsel, seviye kapısı, fiyatın sırayla artması
// ve altının düşmesi, nüfus sınırının artması (en çok 60, mevcut sınır düşmez), kayıt → yükleme, pasif düğme nedenleri, ipucu / kart /
// hikâye kartı / günlük / hedef / rehber, eski (34.1) parsel kimliklerinin çevrilmesi.
// Kullanım: node tools/sim/tests/34.2-parcels.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 34.2
import fs from 'fs';
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 42 });
const { results, report } = createChecks();

const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const { layoutParcels } = await import('/src/world/Parcels.js');
  const { PARCEL_MARKET: M, PARCEL_TEXT: T, PARCELS } = await import('/src/data/parcels.js');
  const TS = await import('/src/systems/TownStatus.js');

  // 1. Parsel sayısı 25-30 (birkaç tohum), kenarlar, kimlikler, komşuluk
  const counts = [1, 2, 3, 7, 42, 77, 101, 200, 999].map((s) => layoutParcels(80, 80, s).parcels.length);
  check('parsel sayısı 25-30 (9 tohum)', counts.every((n) => n >= 25 && n <= 30), counts.join(','));
  const lay = layoutParcels(80, 80, 42);
  check('parsel kenarları 20-40 karo, kimlikler tekil', lay.parcels.every((p) => Math.min(p.w, p.h) >= 20 && Math.max(p.w, p.h) <= 40) && new Set(lay.parcels.map((p) => p.id)).size === lay.parcels.length, lay.parcels.slice(0, 5).map((p) => `${p.w}x${p.h}`).join(' '));
  check('komşuluk karşılıklı; ilk halkanın hepsi çekirdeğe değiyor', lay.parcels.every((p) => p.neighbors.filter((id) => id !== 'core').every((id) => lay.parcels.find((q) => q.id === id).neighbors.includes(p.id))) && lay.parcels.filter((p) => p.ring === 1).every((p) => p.neighbors.includes('core')));
  check('aynı tohum aynı parseller (bölünme yalnızca harita tohumundan)', JSON.stringify(layoutParcels(80, 80, 42).parcels) === JSON.stringify(lay.parcels) && JSON.stringify(layoutParcels(80, 80, 43).parcels) !== JSON.stringify(lay.parcels));

  const scene0 = game.scenes.current;
  const sys = () => game.scenes.current.parcelSystem;
  const st = game.state;
  const parcels = () => game.scenes.current.parcels;
  const ring1 = parcels().filter((p) => p.ring === 1);
  const ring2 = parcels().filter((p) => p.ring === 2);
  check('parseller adlı, içerikli, kotalı (1-4)', parcels().every((p) => p.name && p.kindLabel && p.quota >= 1 && p.quota <= 4 && p.useful > 0 && p.useful <= p.area) && new Set(parcels().map((p) => p.name)).size === parcels().length, parcels().slice(0, 3).map((p) => `${p.name}/${p.kindLabel}/+${p.quota}`).join(' '));
  check('içerik dört türden biri', parcels().every((p) => ['orman', 'kaya', 'göl', 'çayır'].includes(p.kindLabel)), [...new Set(parcels().map((p) => p.kindLabel))].join(','));

  // 2. Başlangıç: komşu şartı, altın şartı
  st.resources.gold = 0;
  st.town.tier = 1;
  const far = ring2[0];
  check('çekirdeğe ya da açık parsele değmeyen parsel: "Önce komşu toprağı al"', sys().status(far.id).reason === T.needNeighbor && !sys().status(far.id).ok);
  const first = sys().buyable()[0];
  check('altın yokken: "Yetersiz altın (X gerekir, 0 var)"', sys().status(first.parcel.id).reason === T.needGold(first.price, 0), sys().status(first.parcel.id).reason);
  check('ilk parselin fiyatı 40-80 altın', first.price >= 40 && first.price <= 80, `${first.parcel.name} ${first.price}`);
  check('yalnızca çekirdeğe değen parseller alınabilir', sys().buyable().every((b) => b.parcel.ring === 1));
  const limit0 = TS.immigrationLimit(st);
  check('başlangıç göç sınırı bugünkü seviye sınırı (Mezra 24)', limit0 === 24 && TS.immigrationBreakdown(st).parcels === 0, `${limit0}`);
  const failed = sys().buy(first.parcel.id);
  check('altınsız satın alma olmaz: parsel kilitli, altın aynı', !failed.ok && st.parcels.length === 0 && st.resources.gold === 0);

  // 3. Mezra: en çok 2 parsel; fiyat sırayla artar, altın düşer
  sim.give({ gold: 100000 });
  const hist = []; // alım sırası: { k: önceki alınmış sayı, price }
  const buyCheapest = () => {
    const pick = sys().buyable()[0];
    hist.push({ k: st.parcels.length, price: pick.price });
    return sys().buy(pick.parcel.id);
  };
  const prices = [];
  const golds = [];
  let limitNow = limit0;
  let monotone = true;
  const watchPrice = ring1.find((p) => p.id !== first.parcel.id);
  const watched = [];
  for (let i = 0; i < 2; i++) {
    const pick = sys().buyable()[0];
    const before = st.resources.gold;
    watched.push(sys().status(watchPrice.id).price);
    const r = buyCheapest();
    prices.push(pick.price);
    golds.push(before - st.resources.gold);
    const lim = TS.immigrationLimit(st);
    if (lim < limitNow) monotone = false;
    limitNow = lim;
    if (!r.ok) check(`Mezra: ${i + 1}. satın alma`, false, r.reason);
  }
  watched.push(sys().status(watchPrice.id).price);
  check('Mezra: iki parsel alındı, altın tam fiyat kadar düştü', st.parcels.length === 2 && golds.every((g, i) => g === prices[i]), `${prices} ${golds}`);
  check('aynı parselin fiyatı her alımdan sonra artıyor', watched[0] < watched[1] && watched[1] < watched[2], watched.join('<'));
  const third = sys().buyable();
  const blockedHamlet = sys().status(ring1.find((p) => !st.parcels.includes(p.id)).id);
  check('Mezra: üçüncü parsel "Köy seviyesinde açılır" (pasif)', third.length === 0 && blockedHamlet.reason === T.needTier('Köy') && !blockedHamlet.ok, blockedHamlet.reason);
  check('göç sınırı arttı: 24 + kotalar; hiç düşmedi', limitNow === 24 + st.parcels.reduce((s, id) => s + parcels().find((p) => p.id === id).quota, 0) && limitNow > 24 && monotone, `${limitNow}`);

  // 4. Köy: toplam 6; Kasaba: ilk halka; Şehir: hepsi
  st.town.tier = 2;
  while (sys().buyable().length && st.parcels.length < 12) buyCheapest();
  check('Köy: toplam en çok 6 parsel', st.parcels.length === 6, `${st.parcels.length}`);
  const blockedVillage = sys().status(ring1.find((p) => !st.parcels.includes(p.id)).id);
  check('Köy: yedinci parsel "Kasaba seviyesinde açılır"', blockedVillage.reason === T.needTier('Kasaba'), blockedVillage.reason);
  st.town.tier = 3;
  while (sys().buyable().length && st.parcels.length < 40) buyCheapest();
  check('Kasaba: ilk halkanın tamamı alındı, ikinci halka kapalı', ring1.every((p) => st.parcels.includes(p.id)) && ring2.every((p) => !st.parcels.includes(p.id)), `${st.parcels.length}`);
  const lockedRing2 = ring2.find((p) => p.neighbors.some((id) => st.parcels.includes(id)));
  check('Kasaba: komşu ikinci halka parseli "Gelişmiş Şehir seviyesinde açılır"', sys().status(lockedRing2.id).reason === T.needTier('Gelişmiş Şehir'), sys().status(lockedRing2.id).reason);
  const atTown = TS.immigrationBreakdown(st);
  check('Kasaba: sınır 24 + kotalar, en çok 60', atTown.total <= M.maxPopulation && atTown.total >= 24, JSON.stringify(atTown));
  st.town.tier = 4;
  while (sys().buyable().length && st.parcels.length < 60) buyCheapest();
  const seq = hist;
  check('Gelişmiş Şehir: bütün parseller alındı', st.parcels.length === parcels().length && parcels().every((p) => st.parcels.includes(p.id)), `${st.parcels.length}/${parcels().length}`);
  const full = TS.immigrationBreakdown(st);
  check('hepsi açıkken göç sınırı 60 (30 + kotalar), 60\'ı aşmaz', full.total === 60 && full.parcels > 30 && full.cap === 60, JSON.stringify(full));
  const N = parcels().length;
  const mid = seq.filter((s) => s.k >= Math.floor(N * 0.45) && s.k <= Math.floor(N * 0.6)).map((s) => s.price);
  const last = seq.slice(-3).map((s) => s.price);
  check('fiyatlar: orta parseller 300-800, son parseller 3.000-6.000', mid.length > 2 && mid.every((p) => p >= 300 && p <= 800) && last.every((p) => p >= 3000 && p <= 6000), `ilk ${seq[0].price} orta ${mid} son ${last}`);
  // Fiyat sırası: ucuz alım sırasında fiyatlar (alınma sayısıyla) artar
  const asc = seq.every((s, i) => i === 0 || s.price >= seq[i - 1].price * 0.8);
  check('fiyatlar ucuzdan pahalıya gidiyor (alınan sayı arttıkça)', seq[seq.length - 1].price > seq[0].price * 20 && asc, `${seq[0].price} → ${seq[seq.length - 1].price}`);

  // 5. Eski kasabanın sınırı düşmez: parselsiz her seviyede bugünkü sınır
  const keep = [...st.parcels];
  st.parcels = [];
  const legacy = [1, 2, 3, 4].map((t) => { st.town.tier = t; return TS.immigrationLimit(st); });
  check('parselsiz kasaba: sınır bugünkü seviye sınırı (24 / 24 / 24 / 30)', legacy.join() === '24,24,24,30', legacy.join());
  st.parcels = keep;
  st.town.tier = 1;
  check('seviye düşük, parsel çok: sınır seviye sınırının altına inmez ve 60\'ı aşmaz', TS.immigrationLimit(st) >= 24 && TS.immigrationLimit(st) <= 60, `${TS.immigrationLimit(st)}`);
  st.parcels = [];
  st.town.tier = 1;

  // 6. Yatak şartı aynen kalır: sınır yükselse de yatak yoksa göçmen gelmez
  st.parcels = [ring1[0].id, ring1[1].id];
  const imm = TS.immigrationStatus(st);
  check('yatak şartı: sınır yükselse de boş yatak olmadıkça göç yok', imm.freeBeds <= TS.freeBeds(st).open && imm.checks.find((c) => c.key === 'beds'), JSON.stringify(imm.checks.find((c) => c.key === 'beds')));
  st.parcels = [];

  return out;
});
results.push(...out);

// B. Arayüz, satın alma, hikâye kartı, rehber, kayıt → yükleme: taze bir oyunda (harita kilitleri durumla tutarlı)
const second = await openGame({ seed: 42 });
const out2 = await second.page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const { PARCEL_TEXT: T } = await import('/src/data/parcels.js');
  const TS = await import('/src/systems/TownStatus.js');
  const sys = () => game.scenes.current.parcelSystem;
  const st = game.state;
  const parcels = () => game.scenes.current.parcels;
  const ring1 = parcels().filter((p) => p.ring === 1);
  const far = parcels().filter((p) => p.ring === 2)[0];
  st.town.tier = 1;
  // 7. Parsel kartı ve pasif düğme nedenleri
  game.ui.render();
  const card = () => document.querySelector('.parcel-card');
  const open = (id) => { game.events.emit('ui:openParcel', { id, x: 600, y: 300 }); game.ui.render(); game.ui.render(); };
  const reasonOf = () => card().querySelector('.parcel-reason')?.textContent ?? '';
  const buyBtn = () => card().querySelector('.parcel-buy');
  st.resources.gold = 10;
  const target = sys().buyable()[0];
  open(target.parcel.id);
  check('kart açıldı: ad, boyut, içerik, kota, fiyat dökümü, Satın Al', !card().hidden && card().textContent.includes(target.parcel.name) && card().textContent.includes(`${target.parcel.w}×${target.parcel.h}`) && card().textContent.includes(target.parcel.kindLabel) && card().textContent.includes(`Nüfus kotası: +${target.parcel.quota}`) && /işe yarar karo ×/.test(card().textContent) && buyBtn().textContent === 'Satın Al', card().textContent.slice(0, 160));
  check('kart: altın yetmiyorsa düğme pasif, neden yazılı ("Yetersiz altın (… gerekir, 10 var)")', buyBtn().disabled && reasonOf() === T.needGold(target.price, 10), reasonOf());
  open(far.id);
  check('kart: komşu değilse "Önce komşu toprağı al" (pasif)', buyBtn().disabled && reasonOf() === T.needNeighbor, reasonOf());
  st.parcels = [ring1[0].id, ring1[1].id];
  open(ring1.find((p) => !st.parcels.includes(p.id)).id);
  check('kart: seviye kapısı "Köy seviyesinde açılır" (pasif)', buyBtn().disabled && reasonOf() === T.needTier('Köy'), reasonOf());
  st.parcels = [];
  st.resources.gold = 5000;
  const target2 = sys().buyable()[0];
  open(target2.parcel.id);
  check('kart: alınabilirken düğme etkin, neden yok', !buyBtn().disabled && card().querySelector('.parcel-reason').hidden);

  // 8. İpucu (harita üstü) ve Hud nüfus ipucu
  const tile = { x: target2.parcel.x + 5, y: target2.parcel.y + 5 };
  const info = game.scenes.current.world.getTileInfo(tile.x, tile.y);
  info.parcel = game.scenes.current.parcelTip(target2.parcel);
  check('ipucu metni: "Bu toprak henüz kasabanın değil · ad · en×boy · içerik · fiyat altın · Nüfus +n"', info.locked && new RegExp(`^Bu toprak henüz kasabanın değil · ${target2.parcel.name} · ${target2.parcel.w}×${target2.parcel.h} · (orman|kaya|göl|çayır) · ${target2.price} altın · Nüfus \\+${target2.parcel.quota}$`).test(info.parcel.tip), info.parcel.tip);
  game.events.emit('map:hover', info);
  check('harita ipucu kutusu parsel bilgisini gösteriyor', document.querySelector('.map-tip-name')?.textContent === 'Bu toprak henüz kasabanın değil' && document.querySelector('.map-tip-status')?.textContent.includes(target2.parcel.name));
  const pop = document.querySelector('.hud-pop');
  game.ui.render();
  check('nüfus çipi ipucunda göç sınırı dökümü (seviye + parseller)', /Göç sınırı: 24 \(seviye\) \+ 0 \(parseller\) = 24/.test(pop.title), pop.title.slice(0, 160));

  // 9. Satın alma düğmesi: efekt, hikâye kartı, günlük, hedef, çip
  const g0 = st.resources.gold;
  const journal0 = st.journal.length;
  const events = [];
  game.events.on('parcel:bought', (p) => events.push(p));
  buyBtn().click();
  game.ui.render();
  const bought = target2.parcel;
  check('Satın Al: altın düştü, parsel açık, kart kapandı', st.resources.gold === g0 - target2.price && st.parcels.includes(bought.id) && game.scenes.current.map.isOpen(bought.x + 2, bought.y + 2) && card().hidden, `${g0} → ${st.resources.gold}`);
  check('satın alma olayı yayınlandı, sevinç efekti başladı', events.length === 1 && events[0].parcel.id === bought.id && Boolean(game.scenes.current.parcelFx));
  check('Kasaba Günlüğü satırı', st.journal.slice(journal0).some((j) => j.text.includes('Kasaba genişledi') && j.text.includes(bought.name)), st.journal.slice(-1)[0]?.text);
  const director = game.scenes.current.storyDirector;
  const storyText = T.story(bought.name);
  check('hikâye kartı: "Kasaba genişledi: … artık bizim!"', [...director.visible, ...director.queue].some((c) => c.text === storyText) || director.log.some((l) => l.text === storyText), storyText);
  check('hedef: İlk Genişleme tamamlandı', Boolean(st.milestones.firstExpansion));
  const limitText = TS.immigrationBreakdown(st);
  check('nüfus çipi ipucu: 24 + kota', limitText.parcels === bought.quota && limitText.total === 24 + bought.quota, JSON.stringify(limitText));
  // Satın alma efekti zamanla biter
  for (let i = 0; i < 60 * 2; i++) { game.update(1 / 60); game.scenes.current.parcelFx && (game.scenes.current.animationTime += 0.03); }
  game.scenes.current.drawParcelFrames(game.renderer);
  check('efekt kendiliğinden biter', game.scenes.current.parcelFx === null);

  // 10. Rehber kartı (bir kez): nüfus sınırına yaklaşınca; parsel alınınca biter. Tablo sürümü 8.
  const GD = await import('/src/data/guide.js');
  const GS = await import('/src/systems/Guide.js');
  check('rehber tablo sürümü 8 ve "expand" adımı', GD.GUIDE_TABLE_VERSION === 8 && GD.GUIDE_STEPS.some((s) => s.id === 'expand') && GD.GUIDE_STEPS.find((s) => s.id === 'expand').text === T.guide);
  st.parcels = [];
  st.guide = { done: GD.GUIDE_STEPS.map((s) => s.id).filter((id) => id !== 'expand'), off: false };
  const ctx = { state: st, facts: {}, guide: st.guide };
  const farFromLimit = GS.currentStep(st, st.guide, {});
  const mk = (n) => st.characters.slice(0, n);
  const realChars = st.characters;
  st.characters = [...realChars];
  while (st.characters.length < 22) st.characters.push({ ...realChars[0], id: 9000 + st.characters.length });
  const near = GS.currentStep(st, st.guide, {});
  st.characters = realChars;
  const capped = GS.currentStep(st, st.guide, { capped: true });
  check('rehber: nüfus sınırına 2 kişi kalınca ya da göç sınırda kalınca "Kasaban sıkıştı" (uzakken yok)', !farFromLimit && near?.id === 'expand' && capped?.id === 'expand' && near.text === T.guide, `${farFromLimit?.id} ${near?.id} ${capped?.id}`);
  st.parcels = ['p1n0'];
  check('rehber: parsel alınınca adım tamamlanır', GS.newlyDone(st, st.guide, {}).includes('expand'));
  st.parcels = [];
  void ctx; void mk;

  // 11. Kayıt → yükleme: satın alınan parsel açık kalır, altın ve sınır aynı
  st.town.tier = 3;
  st.resources.gold = 9999;
  const pick = sys().buyable()[0];
  sys().buy(pick.parcel.id);
  const second = sys().buyable()[0];
  sys().buy(second.parcel.id);
  const snap = game.scenes.current.saves.snapshot();
  const expectLimit = TS.immigrationLimit(st);
  const expectGold = st.resources.gold;
  const ids = [...st.parcels];
  localStorage.setItem('lmgame.save.v2', JSON.stringify({ ...snap, version: 42 }));
  game.events.emit('ui:load');
  const st2 = game.state;
  const m2 = game.scenes.current.map;
  check('kayıt: parseller kayıtta', snap.parcels.join() === ids.join(), snap.parcels.join());
  check('yükleme: satın alınan parseller açık', ids.every((id) => st2.parcels.includes(id) && m2.isOpen(game.scenes.current.parcels.find((p) => p.id === id).x + 1, game.scenes.current.parcels.find((p) => p.id === id).y + 1)));
  check('yükleme: altın ve göç sınırı aynı', st2.resources.gold === expectGold && TS.immigrationLimit(st2) === expectLimit, `${expectLimit} ${TS.immigrationLimit(st2)}`);
  check('yükleme: parseller kilitli komşusu değil olan hâlâ kilitli', game.scenes.current.parcels.filter((p) => !ids.includes(p.id)).every((p) => !m2.isOpen(p.x + 1, p.y + 1)));
  check('yükleme: fiyat satın alma sayısını hatırlıyor', game.scenes.current.parcelSystem.status(game.scenes.current.parcelSystem.buyable()[0].parcel.id).breakdown.step === 3);
  sim.step(225);
  check('yüklemeden sonra bir saat sorunsuz', game.state.characters.length > 0);
  return out;
});
results.push(...out2);
await second.browser.close();

// 12. Eski (34.1) kayıt: açık parsel kimlikleri (`r1n1`, `r1w0`) yeni parsellere çevrilir; arazi ve yapı kaybolmaz
{
  const raw = fs.readFileSync(new URL('../fixtures/save-v42-asama34.1.json', import.meta.url), 'utf8');
  const data = JSON.parse(raw);
  const r = await page.evaluate(async ({ raw }) => {
    const { game } = window;
    const { layoutParcels } = await import('/src/world/Parcels.js');
    localStorage.setItem('lmgame.save.v2', raw);
    game.events.emit('ui:load');
    const scene = game.scenes.current;
    const map = scene.map;
    const src = JSON.parse(raw);
    const old = layoutParcels(80, 80, src.seed, true).parcels.filter((p) => src.parcels.includes(p.id));
    const covered = old.every((o) => scene.parcels.filter((p) => game.state.parcels.includes(p.id)).some((p) => Math.min(o.x + o.w, p.x + p.w) > Math.max(o.x, p.x) && Math.min(o.y + o.h, p.y + p.h) > Math.max(o.y, p.y)));
    const lostTerrain = src.terrain.filter(([x, y, t, v, o]) => !map.isOpen(x, y) && (x < 0 || y < 0 || x >= 80 || y >= 80)).length;
    const wrong = src.terrain.filter(([x, y, t, v, o]) => map.get(x, y) === null || map.tiles[map.index(x, y)] !== t || map.variants[map.index(x, y)] !== v || map.objects[map.index(x, y)] !== (o === 5 ? 0 : o)).length;
    const lockedBuildings = game.state.buildings.filter((b) => !map.isOpen(b.tileX, b.tileY)).length;
    const buildings = src.buildings.filter((b) => !game.state.buildings.some((n) => n.id === b.id && n.tileX === b.tileX && n.tileY === b.tileY)).length;
    // dönüştürülmüş kimlikler kaydedilince yeni biçimde
    const snap = scene.saves.snapshot();
    return { oldIds: src.parcels, newIds: [...game.state.parcels], covered, lostTerrain, wrong, lockedBuildings, buildings, snapIds: snap.parcels, firstGoal: Boolean(game.state.milestones.firstExpansion) };
  }, { raw });
  const c = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });
  c('eski v42 kaydı açılıyor: eski parsel kimlikleri yeni parsellere çevrildi', r.newIds.length >= r.oldIds.length && r.newIds.every((id) => /^p\d[nesw]\d+$/.test(id)) && r.covered, `${r.oldIds} → ${r.newIds}`);
  c('eski v42 kaydı: hiçbir arazi farkı ve yapı kaybolmadı, hepsi açık alanda', r.wrong === 0 && r.lostTerrain === 0 && r.lockedBuildings === 0 && r.buildings === 0, `${r.wrong} farklı, ${r.lostTerrain} kilitli arazi, ${r.lockedBuildings} kilitli yapı, ${r.buildings} kaymış`);
  c('eski v42 kaydı yeniden kaydedilince yeni kimliklerle yazılır', r.snapIds.join() === r.newIds.join());
}

// 13. Yeni v42 fikstürü (34.2 bölünmesiyle üretilmiş): açılmış parseller yerinde
{
  const file = new URL('../fixtures/save-v42.json', import.meta.url);
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    const r = await page.evaluate((raw) => {
      const { game } = window;
      localStorage.setItem('lmgame.save.v2', raw);
      game.events.emit('ui:load');
      const scene = game.scenes.current;
      const src = JSON.parse(raw);
      return { ids: [...game.state.parcels], open: src.parcels.every((id) => { const p = scene.parcels.find((q) => q.id === id); return p && scene.map.isOpen(p.x + 1, p.y + 1); }), wrong: src.terrain.filter(([x, y, t, v, o]) => scene.map.tiles[scene.map.index(x, y)] !== t || scene.map.objects[scene.map.index(x, y)] !== (o === 5 ? 0 : o)).length };
    }, raw);
    results.push({ name: 'save-v42.json (34.2 bölünmesi): parseller aynen açık, arazi yerinde', ok: r.ids.join() === data.parcels.join() && r.open && r.wrong === 0, detail: `${r.ids}` });
  } else {
    results.push({ name: 'save-v42.json fikstürü var', ok: false, detail: 'yok' });
  }
}

const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
