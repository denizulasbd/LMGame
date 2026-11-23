// Aşama 31 testleri: Kasaba Süsleri (İlan Tahtası, Odun Yığını, Korkuluk, Müzik Köşkü, Kahraman Heykeli). En çok 30 test.
// Kullanım: node tools/sim/tests/31-decor.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 31-decor
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const open = async (opts) => {
  const g = await openGame(opts);
  g.page.on('pageerror', (e) => errors.push(String(e)));
  return g;
};

// ---------------------------------------------------------------- şalter açık: beş yapı ve etkileri
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const B = await import('/src/data/buildings.js');
    const TD = await import('/src/data/townDecor.js');
    const H = await import('/src/systems/TownDecor.js');
    const Gr = await import('/src/systems/Granary.js');
    const He = await import('/src/systems/HeatingSystem.js');
    const SS = await import('/src/systems/StructureSystem.js');
    const S = await import('/src/art/sprites/index.js');
    const { Building } = await import('/src/entities/Building.js');
    const { getSeason } = await import('/src/data/seasons.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    const E = game.events;
    sim.give({ wood: 900, stone: 900, food: 900, gold: 3000, iron: 200 });
    st.town.tier = 4;

    c('menüde beş yeni yapı, hepsi tanımlı ve inşa edilebilir', TD.DECOR_TYPES.every((t) => B.BUILD_MENU.includes(t) && B.BUILDINGS[t]?.buildable), B.BUILD_MENU.slice(-5).join(','));
    c('Müzik Köşkü ve Kahraman Heykeli Şehir seviyesinde, İlan Tahtası Köy seviyesinde açılır', B.BUILDINGS.bandstand.requiresTier === 4 && B.BUILDINGS.heroStatue.requiresTier === 4 && B.BUILDINGS.noticeBoard.requiresTier === 2 && B.BUILDINGS.bandstand.unique);
    st.town.tier = 1;
    const lockedReason = sc.construction.globalBlock('bandstand');
    st.town.tier = 4;
    c('seviye kilidi: Mezra\'da Müzik Köşkü kurulamaz', /Şehir/.test(lockedReason ?? ''), lockedReason);

    // Görseller: her durumda doğru boyutta çizilir
    const sizes = [
      [S.getNoticeBoardSprite(4, true), 16, 26], [S.getNoticeBoardSprite(0, false), 16, 26], [S.getWoodpileSprite(0), 16, 20], [S.getWoodpileSprite(3), 16, 20],
      [S.getScarecrowSprite(true, true), 16, 28], [S.getBandstandSprite(true), 48, 54], [S.getHeroStatueSprite(null), 32, 46],
      ...['hammer', 'book', 'rod', 'sickle'].map((p) => [S.getHeroStatueSprite(p), 32, 46]),
    ];
    c('sprite boyutları (11 durum)', sizes.every(([s, w, h]) => s.width === w && s.height === h), sizes.map(([s]) => `${s.width}x${s.height}`).join(' '));

    // --- İlan Tahtası
    const board = sim.place('noticeBoard');
    c('İlan Tahtası kurulur', board?.functional, board ? `${board.tileX},${board.tileY}` : 'yer yok');
    const before = st.petitions.list.length;
    const pet = sc.petitions.create();
    const p = pet ?? st.petitions.list[st.petitions.list.length - 1];
    const opened = st.petitions.list.length > before && p;
    const { PETITIONS } = await import('/src/data/citizens.js');
    c('tahta varken yeni dilekçe +6 saat sürer ve "duyuruldu" işaretlenir', opened && p.noticed === true && p.deadline - p.createdAt === PETITIONS.deadlineMinutes + TD.NOTICE_BOARD.petitionExtraMinutes, opened ? `${p.deadline - p.createdAt} dk` : 'dilekçe açılmadı');
    const items = H.noticeItems(st);
    c('açık işler listesinde dilekçe ve vergi günü var; dilekçe sakine bağlı', items.some((i) => i.key.startsWith('petition:') && Number.isFinite(i.target.character)) && items.some((i) => i.key === 'tax'), items.map((i) => i.key).join(','));
    st.crown.notice = { at: st.totalMinutes + 600, amount: 999999, announcedAt: st.totalMinutes };
    st.crown.decree = { id: 77, kind: 'garrison', need: { bread: 15, iron: 4 }, createdAt: st.totalMinutes, deadline: st.totalMinutes + 3000 };
    const items2 = H.noticeItems(st);
    const levy = items2.find((i) => i.key === 'levy');
    const decree = items2.find((i) => i.royal);
    c('tahsildar (hazine yetmiyor: acil) ve ferman (istenen mallar adıyla) listede', levy?.urgent && /Ekmek/.test(decree?.need ?? ''), `${levy?.title} · ${decree?.need}`);
    sim.step(2);
    c('tahtada kâğıt ve mühürlü ferman görünür (building.look)', board.look?.notes >= 2 && board.look.royal === true, JSON.stringify(board.look));
    st.crown.notice = null;
    st.crown.decree = null;

    // --- Odun Yığını
    const limit0 = Gr.storageLimit(st, 'wood');
    const stone0 = Gr.storageLimit(st, 'stone');
    const home = st.buildings.find((b) => b.type === 'cabin' && b.functional && st.characters.some((ch) => ch.homeId === b.id));
    let pile = null;
    for (let r = 1; r <= 4 && !pile; r++) {
      for (let dy = -r; dy <= r && !pile; dy++) for (let dx = -r; dx <= r && !pile; dx++) {
        const x = home.tileX + dx, y = home.tileY + dy;
        if (sc.construction.checkPlacement('woodpile', x, y).ok) {
          const res = sc.construction.placeSite('woodpile', x, y);
          if (res.ok) {
            const job = sc.jobs.jobs.find((j) => j.buildingId === res.building.id);
            if (job) sc.jobs.cancel(job);
            sc.construction.complete(res.building);
            pile = res.building;
          }
        }
      }
    }
    sim.step(1);
    c('Odun Yığını yalnızca oduna +25 depo ekler', pile && Gr.storageLimit(st, 'wood') === limit0 + TD.WOODPILE.capacity && Gr.storageLimit(st, 'stone') === stone0, `${limit0} -> ${Gr.storageLimit(st, 'wood')} · taş ${stone0} -> ${Gr.storageLimit(st, 'stone')}`);
    c('yakındaki ev kışın %15 daha az odun yakar', H.woodpileHeatingFactor(st, home) === TD.WOODPILE.heatingFactor);
    st.resources.wood = 0;
    sim.step(1);
    const empty = pile.look?.fill;
    st.resources.wood = Gr.storageLimit(st, 'wood');
    sim.step(1);
    c('kütükler stokla dolup boşalır (0 -> 3)', empty === 0 && pile.look?.fill === 3, `${empty} -> ${pile.look?.fill}`);

    // --- Korkuluk
    const garden = sim.place('garden');
    let crow = null;
    for (let dy = -2; dy <= 4 && !crow; dy++) for (let dx = -2; dx <= 4 && !crow; dx++) {
      const x = garden.tileX + dx, y = garden.tileY + dy;
      if (sc.construction.checkPlacement('scarecrow', x, y).ok) {
        const res = sc.construction.placeSite('scarecrow', x, y);
        if (res.ok) {
          const job = sc.jobs.jobs.find((j) => j.buildingId === res.building.id);
          if (job) sc.jobs.cancel(job);
          sc.construction.complete(res.building);
          crow = res.building;
        }
      }
    }
    const f = SS.productionFactors(garden, sc.world, false, getSeason(st.time.day));
    c('Korkuluk yakındaki bahçeye +%8 verim katar (çarpanda ve toplamda)', crow && f.scarecrow === 1 + TD.SCARECROW.gardenBonus && H.gardensGuarded(st, crow).includes(garden), `x${f.scarecrow}`);

    // --- Müzik Köşkü
    const stand = sim.place('bandstand');
    c('Müzik Köşkü kurulur (tek)', stand?.functional && sc.construction.globalBlock('bandstand') !== null, stand ? 'kuruldu' : 'yer yok');
    st.time.hour = 10;
    c('konser öğlen verilemez (saat kuralı)', !H.concertStatus(st, stand).ok, H.concertStatus(st, stand).reason);
    st.time.hour = 18;
    const gold0 = st.resources.gold;
    const trust0 = st.trust.value;
    E.emit('ui:startConcert', { buildingId: stand.id });
    c('Akşam Konseri: 40 altın, Toplanma Zili gibi köşkte toplanma', st.rally?.concert === true && st.rally.venueId === stand.id && gold0 - st.resources.gold === TD.BANDSTAND.concertGold, `${gold0} -> ${st.resources.gold}`);
    c('konser sürerken ikinci konser verilemez', !H.concertStatus(st, stand).ok);
    sim.step(225 * 3); // 18:00 -> 21:00 (konser 2 saat)
    c('konser bitti: güven arttı, sayaç 1, en az bir dinleyen moodlet aldı', (st.stats.concerts ?? 0) === 1 && st.trust.value >= Math.min(100, trust0) && st.characters.some((ch) => ch.moodlets.some((m) => m.reason === 'concert')), `güven ${trust0.toFixed(1)} -> ${st.trust.value.toFixed(1)} · konser ${st.stats.concerts}`);
    c('iki günlük bekleme süresi', /sonra/.test(H.concertStatus(st, stand).reason ?? ''), H.concertStatus(st, stand).reason);

    // --- Kahraman Heykeli
    const statue = sim.place('heroStatue');
    sim.step(1);
    c('yeni heykel örtülü (onurlandırılmadı)', statue?.functional && statue.look && statue.look.pose === null);
    const cand = H.statueCandidates(st);
    const hero = cand[0];
    // Aile bağı: bir sakini onurlandırılanın çocuğu yap (tohumda akrabalık olmayabilir)
    const child = st.characters.find((x) => x.id !== hero.id && !x.role && !x.away);
    child.parentIds = [hero.id];
    E.emit('ui:honorStatue', { buildingId: statue.id, characterId: hero.id });
    sim.step(1);
    c('onurlandırma: ad, poz ve gün künyede; aynı sakin yeniden aday olmaz', statue.decor?.honoreeName === hero.name && ['hammer', 'book', 'rod', 'sickle'].includes(statue.look.pose) && !H.statueCandidates(st).some((x) => x.id === hero.id), `${statue.decor?.honoreeName} · ${statue.look.pose}`);
    E.emit('ui:honorStatue', { buildingId: statue.id, characterId: cand.find((x) => x.id !== hero.id)?.id });
    c('seçim kalıcı: ikinci onurlandırma yok sayılır', statue.decor.honoreeId === hero.id);
    const kin = H.statueKin(st, hero.id);
    c('yakınlar: eş, ebeveyn, çocuk ve torun sayılır', kin.some((x) => x.id === child.id), kin.map((x) => x.name).join(','));
    if (kin.length) {
      const k = kin.find((x) => x.id === child.id) ?? kin[0];
      k.x = (statue.tileX + 1) * 16;
      k.y = (statue.tileY + 2) * 16;
      sc.townDecor.statuePride();
    }
    c('yakını heykelin yanından geçince gururlanır (Hatırlandı · neden)', child.moodlets.some((m) => m.key === 'celebrated' && m.reason === 'ancestor_pride'), child.name);

    // --- Kayıt
    const json = JSON.parse(JSON.stringify(st.toJSON()));
    const sb = json.buildings.find((b) => b.id === statue.id);
    const plain = json.buildings.find((b) => b.type === 'cabin');
    const back = new Building(sb);
    c('kayıt: decor yalnızca doluyken yazılır ve geri yüklenir; look kaydedilmez', back.decor?.honoreeId === hero.id && !('decor' in plain) && !('look' in sb) && json.buildings.find((b) => b.id === stand.id)?.decor?.concerts === 1);
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- şalter kapalı: menüde yok, kurulamaz, etkisiz
{
  const { browser, page } = await open({ seed: 5, enginesOff: ['townDecor'] });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const B = await import('/src/data/buildings.js');
    const TD = await import('/src/data/townDecor.js');
    const Gr = await import('/src/systems/Granary.js');
    const st = game.state;
    const sc = game.scenes.current;
    st.town.tier = 4;
    c('townDecor kapalı: menüde yok ve kurulamaz', TD.DECOR_TYPES.every((t) => !B.BUILD_MENU.includes(t) && sc.construction.globalBlock(t)));
    window.sim.step(1);
    c('townDecor kapalı: odun deposu eklenmez', Gr.storageLimit(st, 'wood') === Gr.storageLimit(st, 'stone') && (st.woodStoreCapacity ?? 0) === 0);
    return out;
  })));
  await browser.close();
}

const ok = report(errors);
process.exit(ok ? 0 : 1);
