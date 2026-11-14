// Aşama 29.10: büyük entegrasyon — bilinen kusurların kapanışı (durum satırı, Yaşam Öyküsü, boş evrim nedeni, kitabe alanı,
// çekmece işaretleri, "Bu oturumda" başlığı) ve Kırgın kasabanın güveni eritmesi. En çok 20 test. Uzun koşu / profil ölçümleri autopilot --profile ve stress'tedir.
// Çalıştır: node tools/sim/tests/29.10-integration.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 29.10
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const LS = await import('/src/systems/LifeStory.js');
  const RI = await import('/src/systems/Rites.js');
  const { MOODLETS } = await import('/src/data/moodlets.js');
  const { reasonText, recomputeMood } = await import('/src/systems/Moodlets.js');
  const { WANTS } = await import('/src/data/wants.js');
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  sim.step(225 * 2);
  const s = () => game.state;
  const scene = () => game.scenes.current;
  const adults = () => s().characters.filter((c) => !c.isChild && !c.role && !c.away);
  const base = { name: 'Deniz', id: 501, age: 40, children: [], parentIds: [], parents: [], memories: [], evolutions: [], skills: {}, satisfaction: 50, wishCount: 0, loyalty: 0, partnerId: null, isVenerable: false, isChild: false, role: null, generation: 1 };

  // 1. durum satırı: arzu / korku nedeni moodlet adını yinelemez
  {
    const wantKey = Object.keys(WANTS)[0];
    const c = { mood: { feel: 'Coşkulu' }, moodlets: [{ key: 'wish_come_true', tier: 'minor', reason: `wish_${wantKey}` }] };
    const d = { mood: { feel: 'Sarsılmış' }, moodlets: [{ key: 'dread_realized', tier: 'minor', reason: 'dread_x' }] };
    const t = LS.statusSentence(c, s(), MOODLETS, reasonText);
    const u = LS.statusSentence(d, s(), MOODLETS, (m) => `Korktuğu başına geldi: Yalnız kalmak`);
    const n = (x, y) => x.toLocaleLowerCase('tr').split(y.toLocaleLowerCase('tr')).length - 1;
    check('29.10: durum satırı "Dileği Oldu: Dileği oldu: …" diye yinelemez (wish_come_true / dread_realized)', n(t, 'dileği oldu') === 1 && t.startsWith('Coşkulu · Dileği Oldu: ') && !t.includes(': Dileği') && u === 'Sarsılmış · Korktuğu Başına Geldi: Yalnız kalmak', `${t} | ${u}`);
  }

  // 2. kurucu / göçmen / doğan: doğru kaynak (Tarihçe kurucuları ve ilk anı), kurucu artık "göçmen" sayılmaz
  {
    const founderMem = { ...base, memories: [{ kind: 'arrival', text: 'Kasabanın ilk sakinlerinden biri oldu', day: 1 }] };
    const immMem = { ...base, memories: [{ kind: 'arrival', text: 'Kasabaya göçmen olarak katıldı', day: 9 }] };
    const st = { characters: [], chronicle: { founders: [{ id: 777, name: 'Ali' }] } };
    const listed = { ...immMem, id: 777 };
    const real = adults().filter((c) => (s().chronicle?.founders ?? []).some((f) => f.id === c.id));
    const realOk = real.length > 0 && real.every((c) => LS.originOf(c, s()) === 'founder' && LS.lifeStory(c, s()).includes('kurucularından'));
    check('29.10: kurucu sakin "göçmen olarak geldi" diye anlatılmaz (Tarihçe kurucuları / ilk anı okunur)', LS.originOf(founderMem, st) === 'founder' && LS.originOf(immMem, st) === 'immigrant' && LS.originOf(listed, st) === 'founder' && realOk, `${real.length} kurucu`);
  }

  // 3. dilek sayısı cümlesi yok; doyum kademesinden tek ifade
  {
    const st = { characters: [] };
    const rad = LS.lifeStory({ ...base, wishCount: 7, satisfaction: 95 }, st, { dead: true });
    const crush = LS.lifeStory({ ...base, wishCount: 7, satisfaction: 10 }, st);
    const mid = LS.lifeStory({ ...base, wishCount: 7, satisfaction: 50 }, st);
    check('29.10: "N dileğinin gerçek olduğunu gördü" yok; doyum kademesinden tek ifade (Hâlinden Memnun\'da cümle yok)', !/dileğinin/.test(rad + crush + mid) && rad.includes('Hayattan umduğunu fazlasıyla buldu') && crush.includes('Umduklarının azını görüyor') && !/Hayattan|Umduklar|Dileklerinin|Aradığını/.test(mid), `${rad} | ${crush}`);
  }

  // 4. anılar tırnaksız cümle; arzu kaynaklı anı girmez; öncelik sırası
  {
    const st = { characters: [] };
    const c = {
      ...base,
      memories: [
        { kind: 'arrival', text: 'Kasabanın ilk sakinlerinden biri oldu', day: 1 },
        { kind: 'life', text: 'Dileği oldu: Kafamı dinleyeyim', fond: true, day: 2 },
        { kind: 'life', text: 'Korktuğu başına geldi: Yalnız kalmak', fond: false, day: 3 },
        { kind: 'life', text: 'Ece kederinde onu teselli etti', fond: true, day: 4 },
        { kind: 'life', text: "Ali'nin yasını tuttu", fond: false, day: 5 },
        { kind: 'masterwork', text: 'Usta işi bir eser yaptı: Ceviz Sandık', day: 6 },
        { kind: 'life', text: 'Pazar Yeri\'nden kendine bir boncuk aldı', day: 7 },
      ],
    };
    const t = LS.lifeStory(c, st, { dead: true });
    check('29.10: öyküde tırnaklı alıntı ve "Dileği oldu" anısı yok; anılar cümleye çevrilir (öncelik: usta işi eser, yas)', !/[“”"]/.test(t) && !/Dileği oldu|Korktuğu başına|Anılarında|boncuk/.test(t) && t.includes('Elinden Ceviz Sandık adlı usta işi bir eser çıktı') && t.includes("; Ali'nin yasını tuttu") && !t.includes('teselli'), t);
  }

  // 5. yangından kurtarılma ve teselli cümleleri; düğün anısı yalnızca eş artık yoksa
  {
    const st = { characters: [] };
    const c = { ...base, memories: [{ kind: 'wedding', text: 'Can ile meydanda evlendi', day: 3 }, { kind: 'life', text: 'Ece yangında evini kurtardı', day: 4 }, { kind: 'life', text: 'Ece yasında onu teselli etti', day: 5 }] };
    const widow = LS.lifeStory(c, st, { dead: true });
    const partner = { id: 9, name: 'Can', parentIds: [] };
    const married = LS.lifeStory({ ...c, partnerId: 9, married: true }, { characters: [partner] }, { dead: true });
    const fireOnly = LS.lifeStory({ ...base, memories: [{ kind: 'life', text: 'Ece yangında evini kurtardı', day: 4 }, { kind: 'life', text: 'Ece yasında onu teselli etti', day: 5 }] }, st);
    check('29.10: düğün anısı eş yoksa cümleye girer (eş varsa aile cümlesi anlatır); yangın ve teselli anısı cümleye çevrilir', widow.includes('Can ile meydanda evlendiği günü hiç unutmadı') && !married.includes('unutmadı') && married.includes('Can ile evlendi') && fireOnly.includes('Bir yangında evini Ece kurtardı; yasında Ece onu teselli etti'), `${widow} | ${fireOnly}`);
  }

  // 6. nedeni boş kişilik değişimi: "Zamanla" yok
  {
    const st = { characters: [] };
    const t = LS.lifeStory({ ...base, evolutions: [{ day: 3, kind: 'turned', axis: 1, from: 'socialButterfly', to: 'introvert', cause: null }] }, st, { dead: true });
    const twice = LS.lifeStory({ ...base, evolutions: [{ day: 3, kind: 'acquired', axis: 2, from: null, to: 'ambitious', cause: 'expedition' }, { day: 30, kind: 'deepened', axis: 2, from: null, to: 'ambitious', cause: 'expedition' }] }, st, { dead: true });
    const n = twice.toLocaleLowerCase('tr').split('seferlerden').length - 1;
    check('29.10: nedeni boş kişilik değişimi "Zamanla" demeden anlatılır; iki değişimin nedeni aynıysa yinelenmez', !t.includes('Zamanla') && t.includes('İçine Kapanık yanı ağır bastı') && n === 1 && twice.includes('yıllar geçtikçe Hırslı yanı derinleşti'), `${t} | ${twice}`);
  }

  // 7. küçük katkılar birikince değişimin nedeni boş kalmaz (en son katkının kaynağı)
  {
    const evo = scene().evolution;
    const EV = await import('/src/systems/Evolution.js');
    const c = adults().find((x) => EV.evolves(x));
    c.growth = [0, 0, 0, 0];
    c.growthCause = [null, null, null, null];
    c.growthToday = [0, 0, 0, 0];
    const before = c.evolutions.length;
    for (let i = 0; i < 40; i++) evo.push(c, 0, 1, 'consoled', { daily: true });
    const cause0 = c.growthCause[0];
    const shift = c.traits.includes('hardworking') ? { axis: 0, kind: 'deepened', from: null, to: 'hardworking' } : c.traits.includes('sleepyhead') ? { axis: 0, kind: 'turned', from: 'sleepyhead', to: 'hardworking' } : { axis: 0, kind: 'acquired', from: null, to: 'hardworking' };
    evo.evolve(c, shift);
    const log = c.evolutions.at(-1);
    check('29.10: küçük katkılar birikince growthCause boşsa değişime en son katkının kaynağı yazılır', cause0 === null && c.evolutions.length === before + 1 && log.cause === 'consoled' && !(c.growthLast?.[0]), `${cause0} ${log?.cause} ${c.growth[0]}`);
  }

  // 8. hatırlama yalnızca güzel anı seçer -> kaçınma dalı yok
  {
    const c = adults()[1];
    c.recall = null;
    for (const m of c.memories) m.fond = false;
    c.memories.push({ day: 1, hour: 8, text: 'kırgın anı', icon: 'sulk', kind: 'life', fond: false, whoId: adults()[2].id });
    const got = scene().memories.recall(c);
    c.memories.pop();
    check('29.10: anı hatırlama yalnızca güzel anıları seçer (kırgın anı hatırlanmaz; recall dalında kaçınma yok)', got === null && !(c.drive?.avoidIds ?? []).includes(adults()[2].id));
  }

  // 9. kitabe: story yalnızca dolu öyküde yazılır; tören sonrası bekleyen liste temizlenir
  {
    const before = JSON.stringify(s().rites.names);
    scene().rites.dying.set(-5, { friends: [], closestId: null, story: '' });
    scene().rites.onDied({ id: -5, name: 'Boşöykü', age: 70 }, 70);
    const pend = s().rites.pending.at(-1);
    const noStory = pend && pend.name === 'Boşöykü' && !('story' in pend);
    const day0 = s().time.day;
    let n = 0;
    while (s().rites.pending.length && n++ < 225 * 60 * 3) sim.step(1);
    while (s().rites.active && n++ < 225 * 60 * 4) sim.step(1);
    const row = s().rites.names.find((r) => r.name === 'Boşöykü');
    const saved = JSON.parse(JSON.stringify(s().rites));
    check('29.10: boş öykü kitabeye "story" alanı olarak yazılmaz; tören sonrası rites.pending ve active temizlenir', noStory && row && !('story' in row) && s().rites.pending.length === 0 && s().rites.active === null && saved.pending.length === 0 && before !== JSON.stringify(s().rites.names), `${noStory} ${Boolean(row)} ${s().rites.pending.length} ${s().time.day - day0}`);
  }

  // 10. çekmece işaretleri: title açıklaması; dengeli ruh halinde işaret yok
  {
    const drawer = game.ui.components.find((x) => x.rows && x.rebuild);
    const [a, b] = adults();
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    a.mood = { ...(a.mood ?? {}), feel: 'Dengeli', tone: 'neutral' };
    b.mood = { ...(b.mood ?? {}), feel: 'Coşkulu', tone: 'positive' };
    b.specialDay = { day: s().time.day, kind: 'anniversary', celebrated: false, gifted: false };
    drawer.render?.(game);
    await frame();
    const ra = drawer.rows.get(a.id);
    const rb = drawer.rows.get(b.id);
    const ok = ra && rb && ra.mark.hidden && !rb.mark.hidden && rb.mark.title.length > 0 && !rb.special.hidden && rb.special.title.includes('yıl dönümü');
    b.specialDay = null;
    recomputeMood?.(a, s().totalMinutes);
    check('29.10: çekmece işaretlerinde title açıklaması var (özel gün türüyle); dengeli ruh halinde işaret yok', ok, `${ra?.mark.hidden} ${rb?.mark.hidden} ${rb?.mark.title} | ${rb?.special.title}`);
  }

  // 11. "omuz omuza" bölümü "Bu oturumda" diye nitelenir
  {
    const titles = [...document.querySelectorAll('h3, .panel-section-title, .section-title')].map((h) => h.textContent);
    const src = await (await fetch('/src/ui/components/CharacterPanel.js')).text();
    check('29.10: "En çok kiminle omuz omuza" bölümü "Bu Oturumda" diye nitelenir (sayaç kayda girmez)', src.includes("'Bu Oturumda En Çok Kiminle Omuz Omuza'") && !src.includes("section('En Çok Kiminle Omuz Omuza'"), titles.filter((t) => /Omuz/.test(t)).join(','));
  }

  // 12. Kırgın kasaba güveni eritir (eşik altı etkisiz)
  {
    const { LOYALTY } = await import('/src/data/loyalty.js');
    const trust = scene().trust;
    const ad = adults();
    const saved = ad.map((c) => c.loyalty);
    const run = (n) => {
      ad.forEach((c, i) => (c.loyalty = i < n ? -80 : 0));
      s().trust.value = 60;
      trust.hourly();
      return s().trust.value;
    };
    const none = run(0);
    const few = run(Math.floor(ad.length * LOYALTY.bitterTrust.share) - 1);
    const many = run(ad.length);
    ad.forEach((c, i) => (c.loyalty = saved[i]));
    check('29.10: Kırgın payı eşiği aşınca Yönetim Güveni saat başı erir; eşik altında etkisiz', few === none && none - many >= Math.abs(LOYALTY.bitterTrust.perHour) - 0.01, `${none} ${few} ${many}`);
  }
  // 13. doyum sönmesi kademeli (29.10b): 50'nin üstünde driftAbove + floor((doyum - 50) / driftStep); altında kayma aynı
  {
    const { WANT_RULES } = await import('/src/data/wants.js');
    const ad = adults();
    const saved = ad.map((c) => c.satisfaction);
    const probe = [95, 75, 63, 52, 50, 45, 10];
    const expect = (v) => (v > 50 ? v - Math.min(WANT_RULES.driftAbove + Math.floor((v - 50) / WANT_RULES.driftStep), v - 50) : v < 50 ? v + Math.min(WANT_RULES.driftBelow, 50 - v) : v);
    ad.forEach((c, i) => (c.satisfaction = probe[i % probe.length]));
    const start = ad.map((c) => c.satisfaction);
    scene().wants.onNewDay();
    const bad = ad.filter((c, i) => c.satisfaction !== expect(start[i]));
    ad.forEach((c, i) => (c.satisfaction = saved[i]));
    check('29.10b: doyum 50\'nin üstünde kademeli söner (95 -> -6, 75 -> -4, 63 -> -3, 52 -> 50), 50 ve altında eski kayma', WANT_RULES.driftStep === 11 && expect(95) === 89 && expect(75) === 71 && expect(63) === 60 && expect(52) === 50 && expect(45) === 46 && bad.length === 0, `${bad.length} sapma / ${ad.length}`);
  }

  // 14. sadakat ayarı (29.10b): Kırgın kasaba erimesi yumuşatıldı, kasabayı bir günde boşaltmaz
  {
    const { LOYALTY } = await import('/src/data/loyalty.js');
    // (30.3) sadakat artık günler içinde Kırgın'a indiği için erime -1,7 -> -0,4 (günde en çok ~10 puan) ayarlandı
    check('29.10b / 30.3: Kırgın kasaba erimesi saat başı -0,4 (günde en çok ~10 puan), eşik %25', LOYALTY.bitterTrust.perHour === -0.4 && LOYALTY.bitterTrust.share === 0.25, JSON.stringify(LOYALTY.bitterTrust));
  }
  return out;
});
results.push(...out);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
