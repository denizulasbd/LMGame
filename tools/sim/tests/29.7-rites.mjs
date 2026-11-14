// Aşama 29.7: Anma Töreni ve Özel Günler — tören saati ve yeri, katılım, yas kısalması, kitabe, Taziye Sofrası, doğum günü / yıl dönümü,
// kutlandı / unutuldu, Armağan, sızıntı, şalterler ve v39 -> v40 göçü. Çalıştır: node tools/sim/tests/29.7-rites.mjs [--verbose]
import fs from 'fs';
import { openGame, createChecks } from '../lib.mjs';

const fixture = fs.readFileSync(new URL('../fixtures/save-v39.json', import.meta.url), 'utf8');
const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();
const out = await page.evaluate(async (fixture) => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const RD = await import('/src/data/rites.js');
  const RI = await import('/src/systems/Rites.js');
  const MD = await import('/src/data/moodlets.js');
  const EV = await import('/src/data/evolution.js');
  const { ENGINES } = await import('/src/systems/Engines.js');
  const { pairKey } = await import('/src/systems/RelationshipSystem.js');
  const { getMoodlet } = await import('/src/systems/Moodlets.js');
  const { AGING } = await import('/src/data/lifeStages.js');
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  sim.step(225 * 3);
  const scene = () => game.scenes.current;
  const s = () => game.state;
  const adults = () => s().characters.filter((c) => !c.isChild && !c.role && !c.away);
  const rites = () => s().rites;
  const now = () => s().totalMinutes;
  const stepTo = (day, hour) => { let n = 0; while ((s().time.day < day || (s().time.day === day && s().time.hour < hour)) && n++ < 225 * 80) sim.step(1); };

  // 1. vefat -> ertesi gün 18:00 tören (gerçek akış)
  const [dead, friend, partnerless] = adults().filter((c) => !c.married);
  for (const x of [friend, partnerless]) s().relationships[pairKey(dead.id, x.id)] = 60;
  const d0 = s().time.day;
  scene().lifecycle.die(dead, { cause: 'age' });
  const pend = rites().pending.at(-1);
  const pendOk = pend?.name === dead.name && pend.day === d0 && pend.friends.includes(friend.id) && pend.friends.includes(partnerless.id);
  stepTo(d0 + 1, 7);
  const act = rites().active;
  check('vefat: bekleyen törene ad / gün / dostlar (≥ 40); ertesi gün 06:00\'da tören (18:00-19:00) hazırlanır', pendOk && act?.day === d0 + 1 && act.names[0] === dead.name && RI.riteWindow(s(), act).start === (d0) * 1440 + 18 * 60, JSON.stringify(act && { day: act.day, names: act.names }));
  const place = s().buildings.find((x) => x.id === act?.place);
  const monument = s().buildings.find((x) => x.type === 'monument' && x.functional);
  check('tören yeri: tamamlanmış anıt varsa anıt, yoksa meydan havuzu', place && place.type === (monument ? 'monument' : 'fountain'), place?.type);
  stepTo(d0 + 1, 18);
  sim.step(225 / 2);
  const memorial = s().characters.filter((c) => c.task?.activity === 'memorial');
  const lateEnd = memorial.every((c) => !c.task.duration || now() + (c.task.timer ?? 0) <= RI.riteWindow(s(), act).end + 1);
  check('18:00\'de çağrılılar anma yerine gider (planMemorial), görev 19:00\'da biter', memorial.length > 0 && memorial.every((c) => RI.memorialEligible(s(), c)) && lateEnd, `${memorial.map((c) => c.name).join(',')}`);
  stepTo(d0 + 1, 20);
  const held = rites().held;
  const att = adults().filter((c) => c.moodlets.some((m) => m.key === 'farewell'));
  check('19:00\'da tören biter: kitabe, günlük kaydı; katılanlara "Helalleşti" (eylem, 24 sa, keyif x0,9)', held === 1 && !rites().active && rites().names.at(-1)?.name === dead.name && s().journal.some((j) => j.text.startsWith('Anma töreni')) && att.length > 0 && MD.MOODLETS.farewell.layer === 'action' && MD.MOODLETS.farewell.hours === 24 && MD.MOODLETS.farewell.effects.joyRateMul === 0.9, att.map((c) => c.name).join());

  // 2. katılım ölçütü
  const [m1, f1, st1] = adults();
  const kid = s().characters.find((c) => c.isChild);
  rites().active = { names: ['X'], day: s().time.day, place: null, condolence: false, attendees: [], ids: [f1.id], dead: [{ id: 9999, name: 'X', day: 1, age: 70, friends: [f1.id], closestId: null }] };
  m1.moodlets = []; scene().moodlets.apply(m1, 'mourning', { reason: 'mourn_kindred', tier: 'major', whoId: 9999, whoName: 'X' });
  st1.moodlets = [];
  check('katılım: yas tutan ve ölenle dost (≥ 40) yetişkin; yabancı ve çocuk değil', RI.memorialEligible(s(), m1) && RI.memorialEligible(s(), f1) && !RI.memorialEligible(s(), st1) && (!kid || !RI.memorialEligible(s(), kid)));

  // 3. yas kısalması 0,7 / 0,5, evrim, taziye tek seferlik
  const setRite = (condolence) => {
    const day = s().time.day;
    rites().active = { names: ['X'], day, place: null, condolence, attendees: [m1.id], ids: [], dead: [{ id: 9999, name: 'X', day: day - 1, age: 70, friends: [], closestId: null }] };
    m1.moodlets = []; m1.loyalty = 0;
    scene().moodlets.apply(m1, 'mourning', { reason: 'mourn_kindred', tier: 'major', whoId: 9999, whoName: 'X' });
    const m = getMoodlet(m1, 'mourning'); m.until = now() + 600;
    return m;
  };
  let mm = setRite(false); const g0 = m1.growth[3];
  scene().rites.finish();
  const r07 = mm.until === now() + 420;
  const fw = getMoodlet(m1, 'farewell');
  const spirit = m1.growth[3] - g0;
  mm = setRite(true);
  scene().rites.finish();
  const r05 = mm.until === now() + 300;
  check('yasın kalan süresi x0,7, Taziye Sofrası\'yla x0,5 (Helalleşti major, sadakat +condolence); evrim spirit +3', r07 && r05 && getMoodlet(m1, 'farewell')?.tier === 'major' && m1.loyalty === (await import('/src/data/loyalty.js')).LOYALTY_SOURCES.condolence && fw?.tier === 'minor' && EV.EVOLUTION_SOURCES.moodlets.farewell[0].join() === '3,3' && Math.abs(spirit - 3 * (EV.EVOLUTION_RULES.stageMul[m1.lifeStage] ?? 1)) <= 0.5, `${r07} ${r05} ${m1.loyalty} · spirit ${spirit}`);
  const day = s().time.day;
  rites().active = { names: ['Y'], day, place: null, condolence: false, attendees: [], ids: [], dead: [] };
  const hourBack = s().time.hour; s().time.hour = 10;
  s().resources.gold = 100; const food0 = RI.condolenceStatus(s(), 999).ok; const gold0 = s().resources.gold;
  const fs0 = (await import('/src/systems/TownStatus.js')).foodSupply(s());
  game.events.emit('ui:condolence');
  const fs1 = (await import('/src/systems/TownStatus.js')).foodSupply(s());
  const once = rites().active.condolence && s().resources.gold === gold0 - 10 && Math.round(fs0 - fs1) === 20;
  game.events.emit('ui:condolence');
  s().time.hour = hourBack;
  check('Taziye Sofrası: 20 yiyecek + 10 altın, tören başına bir kez', food0 && once && s().resources.gold === gold0 - 10 && rites().condolences >= 1, `${gold0}->${s().resources.gold} · yiyecek -${Math.round(fs0 - fs1)}`);
  rites().active = null;

  // 4. aynı gün iki vefat tek tören; kitabe sınırı
  const [e1, e2] = adults().filter((c) => !c.married).slice(-2);
  const held0 = rites().held;
  rites().pending = [];
  const today = s().time.day;
  scene().lifecycle.die(e1, { cause: 'age' }); scene().lifecycle.die(e2, { cause: 'age' });
  scene().rites.open(today + 1); rites().active.day = today + 1;
  const twoNames = rites().active?.names.length === 2 && rites().pending.length === 0;
  scene().rites.finish();
  for (let i = 0; i < 45; i++) rites().names.push({ name: `A${i}`, day: 1, age: 70 });
  rites().active = { names: ['Z'], day: s().time.day, place: null, condolence: false, attendees: [], ids: [], dead: [{ id: 1, name: 'Z', day: 1, age: 80, friends: [], closestId: null }] };
  scene().rites.finish();
  check('aynı gün iki vefat tek törende anılır; kitabe en çok 40 ad', twoNames && rites().held === held0 + 2 && rites().names.length === 40 && rites().names.at(-1).name === 'Z');

  // 5. tören ortasında kaydet-yükle
  const lives = adults();
  rites().active = { names: ['K'], day: s().time.day, place: s().buildings.find((x) => x.type === 'fountain')?.id ?? null, condolence: true, attendees: [lives[0].id], ids: [lives[1].id], dead: [{ id: 4242, name: 'K', day: s().time.day - 1, age: 77, friends: [lives[1].id], closestId: lives[1].id }] };
  game.events.emit('ui:save');
  const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  game.events.emit('ui:load');
  const back = game.state.rites?.active;
  check('tören ortasında kaydet-yükle: tören, katılanlar ve taziye geri gelir; kayıt sürümü (güncel)', raw.version === (await import('/src/config.js')).CONFIG.SAVE_VERSION && back?.names[0] === 'K' && back.condolence && back.attendees[0] === lives[0].id && back.dead[0].closestId === lives[1].id, JSON.stringify(back));
  game.state.rites.active = null;

  // 6. özel günler
  const S2 = () => game.state;
  const sc = scene();
  const people = () => S2().characters.filter((c) => !c.isChild && !c.role && !c.away);
  const [bd, mate, other] = people();
  const clear = (...cs) => { for (const c of cs) { c.moodlets = []; c.specialDay = null; c.mood.grief = false; } };
  clear(bd, mate, other);
  bd.ageInDays = 30 * AGING.daysPerYear; bd.agedDays = Math.max(1, bd.agedDays);
  const dday = S2().time.day;
  const [w1, w2] = people().filter((c) => !c.married && c.partnerId === null).slice(-2);
  game.events.emit('relationship:married', { a: w1, b: w2, venue: null, festival: false });
  check('doğum günü (o gün yaş alan), yıl dönümü (16 günde bir, eşi yanında); evlenince c.weddingDay yazılır', RI.isBirthday(bd) && !RI.isBirthday({ ageInDays: 30 * AGING.daysPerYear + 1, agedDays: 3 }) && RI.isAnniversary({ weddingDay: dday - 16, married: true }, dday) && !RI.isAnniversary({ weddingDay: dday - 8, married: true }, dday) && !RI.isAnniversary({ weddingDay: null, married: true }, dday) && w1.weddingDay === dday && w2.weddingDay === dday);
  // doğum günü sahibi ile yakınları birbirini arar
  const hb = S2().time.hour; S2().time.hour = 6;
  for (const c of S2().characters) if (c !== bd) { c.agedDays = c.agedDays || 1; if (c.ageInDays % AGING.daysPerYear === 0) c.ageInDays += 1; }
  sc.rites.startSpecialDays();
  const comps = RI.specialCompanions(S2(), bd);
  const sd = getMoodlet(bd, 'special_day');
  check('06:00: "Bugün Onun Günü" (16 sa, keyif x0,85); en yakın kişi(ler)le birbirinin seekIds\'inde', bd.specialDay?.kind === 'birthday' && sd && MD.MOODLETS.special_day.hours === 16 && comps.length === RD.SPECIAL_RULES.closest && comps.every((id) => bd.drive.seekIds.includes(id) && S2().characters.find((c) => c.id === id).drive.seekIds.includes(bd.id)), `${comps.join()} · ${bd.drive.seekIds.join()}`);
  // kutlandı
  const cmp = S2().characters.find((c) => c.id === comps[0]);
  const fountain = S2().buildings.find((x) => x.type === 'fountain');
  const sat0 = bd.satisfaction; const rel0 = S2().relationships[pairKey(bd.id, cmp.id)] ?? 0;
  for (const c of [bd, cmp]) c.task = { activity: 'fountain', buildingId: fountain.id, phase: 'perform' };
  S2().time.hour = 12;
  sc.rites.update();
  for (const c of [bd, cmp]) c.task = null;
  check(`yakınıyla aynı sohbette: Hatırlandı, doyum +${RD.SPECIAL_RULES.celebratedJoy}, ilişki +5`, bd.specialDay?.celebrated && getMoodlet(bd, 'celebrated') && bd.satisfaction === Math.min(100, sat0 + RD.SPECIAL_RULES.celebratedJoy) && Math.round((S2().relationships[pairKey(bd.id, cmp.id)] - rel0) * 10) >= 50 && S2().rites.celebrated >= 1, `${sat0}->${bd.satisfaction}`);
  // unutuldu (yetişkin) ve çocuk
  const forgottenOne = other;
  forgottenOne.specialDay = { day: S2().time.day, kind: 'birthday', celebrated: false, gifted: false };
  const child = S2().characters.find((c) => c.isChild);
  if (child) { child.moodlets = []; child.specialDay = { day: S2().time.day, kind: 'birthday', celebrated: false, gifted: false }; }
  const fsat = forgottenOne.satisfaction; const fg = [...forgottenOne.growth]; const csat = child?.satisfaction; const cg = child ? [...child.growth] : null;
  const gifted = mate; gifted.loyalty = 0; gifted.specialDay = { day: S2().time.day, kind: 'birthday', celebrated: false, gifted: false };
  const gsat = gifted.satisfaction; const ggold = S2().resources.gold;
  game.events.emit('ui:giftSpecialDay', { id: gifted.id });
  game.events.emit('ui:giftSpecialDay', { id: gifted.id });
  const giftOk = gifted.specialDay.gifted && gifted.loyalty === (await import('/src/data/loyalty.js')).LOYALTY_SOURCES.gift && gifted.satisfaction === Math.min(100, gsat + 4) && S2().resources.gold === ggold - 5;
  const f0 = S2().rites.forgotten;
  S2().time.hour = 22;
  sc.rites.closeSpecialDays();
  const near = (got, want) => Math.abs(got - want) <= 0.5 && Math.sign(got) === Math.sign(want);
  const stageMul = (c) => EV.EVOLUTION_RULES.stageMul[c.lifeStage] ?? 1;
  const fOk = getMoodlet(forgottenOne, 'forgotten') && forgottenOne.satisfaction === Math.max(0, fsat - 4) && near(forgottenOne.growth[3] - fg[3], -3 * stageMul(forgottenOne)) && near(forgottenOne.growth[1] - fg[1], -2 * stageMul(forgottenOne));
  check('22:00\'de kutlanmayan: Unutuldu (keyif x1,15), doyum -4, evrim spirit -3 / company -2; seekIds temizlenir', fOk && MD.MOODLETS.forgotten.effects.joyRateMul === 1.15 && !bd.drive.seekIds.includes(comps[0]) && !(bd.specialSeek ?? []).length, `${fsat}->${forgottenOne.satisfaction} · ${fg}->${forgottenOne.growth}`);
  check('çocukta yalnızca moodlet (doyum ve evrim değişmez)', !child || (getMoodlet(child, 'forgotten') && child.satisfaction === csat && child.growth.join() === cg.join()));
  check('Armağan: 5 altın, sadakat +6, doyum +4, günde bir kez; o gün Unutuldu olmaz', giftOk && !getMoodlet(gifted, 'forgotten') && S2().rites.forgotten === f0 + 1 + (child ? 1 : 0), `${gifted.loyalty} · ${S2().resources.gold}`);
  // yastaki sakin atlanır
  S2().time.hour = 6; clear(bd); bd.ageInDays = 31 * AGING.daysPerYear;
  sc.moodlets.apply(bd, 'mourning', { reason: 'mourn_kindred', tier: 'major', whoId: 9999, whoName: 'X' });
  sc.rites.startSpecialDays();
  check('yastaki sakinin özel günü atlanır', bd.specialDay === null && !getMoodlet(bd, 'special_day'));
  S2().time.hour = hb;

  // 7. sızıntı: bütün üreteçler aynı, yalnızca söz üreteci (tohum + 41) ilerleyebilir
  const rngs = Object.entries(sc).filter(([, v]) => v && typeof v === 'object' && v.rng && typeof v.rng.state === 'number' && v !== sc.rites).map(([k, v]) => [k, v.rng]);
  const before = JSON.stringify(rngs.map(([, r]) => r.state));
  let calls = 0; const realRandom = Math.random; Math.random = () => { calls++; return realRandom(); };
  const [x1, x2] = people();
  clear(x1, x2);
  S2().rites.active = { names: ['Q'], day: S2().time.day, place: null, condolence: false, attendees: [x1.id, x2.id], ids: [], dead: [{ id: 77, name: 'Q', day: 1, age: 80, friends: [], closestId: x1.id }] };
  sc.rites.finish();
  S2().time.hour = 6; x1.ageInDays = 40 * AGING.daysPerYear; sc.rites.startSpecialDays();
  for (const c of [x1, x2]) c.task = { activity: 'fountain', buildingId: fountain.id, phase: 'perform' };
  S2().time.hour = 12; sc.rites.update(); for (const c of [x1, x2]) c.task = null;
  S2().time.hour = 22; sc.rites.closeSpecialDays(); S2().time.hour = hb;
  Math.random = realRandom;
  check('tören + özel gün: üreteçler ve Math.random aynı (söz üreteci hariç)', rngs.length > 5 && before === JSON.stringify(rngs.map(([, r]) => r.state)) && calls === 0, `${rngs.length} üreteç, ${calls}`);

  // 8. şalter kapalı
  ENGINES.rites = false;
  const [o1, o2] = people().filter((c) => !c.married && c.partnerId === null).slice(0, 2);
  const pend0 = S2().rites.pending.length;
  if (o1 && o2) game.events.emit('relationship:married', { a: o1, b: o2, venue: null, festival: false });
  const victim = people().find((c) => !c.married && c !== o1 && c !== o2);
  sc.lifecycle.die(victim, { cause: 'age' });
  S2().time.hour = 6; const before6 = people().map((c) => c.specialDay); game.events.emit('time:hour', 6); S2().time.hour = hb;
  ENGINES.rites = true;
  check('ENGINES.rites=false: weddingDay yazılmaz, tören kuyruğu ve özel gün yok; dört yeni moodlet (toplam 32)', (!o1 || o1.weddingDay === null) && S2().rites.pending.length === pend0 && people().every((c, i) => c.specialDay === (before6[i] ?? null)) && MD.MOODLET_KEYS.length === 32 && ['farewell', 'special_day', 'celebrated', 'forgotten'].every((k) => MD.MOODLETS[k].layer === 'action' && MD.MOOD_LINES[k]?.length >= 2) && MD.MOODLETS.celebrated.hours === 12 && MD.MOODLETS.forgotten.tone === 'negative');

  // 9. v39 -> v40 göç
  localStorage.setItem('lmgame.save.v2', fixture);
  game.events.emit('ui:load');
  const g = game.state;
  const migr = g.characters.every((c) => c.loyalty === 0 && c.weddingDay === null && c.specialDay === null) && JSON.stringify(g.rites) === JSON.stringify(RI.emptyRites()) && (g.trust.revolt === null || g.trust.revolt.leaderId === null);
  game.events.emit('ui:save');
  const re = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  check('v39 -> v40: sadakat 0, weddingDay / specialDay null, boş tören durumu; yeniden kayıtta güncel sürüm', migr && re.version === (await import('/src/config.js')).CONFIG.SAVE_VERSION && re.characters.every((c) => c.loyalty === 0) && Array.isArray(re.rites.names));
  return out;
}, fixture);
results.push(...out);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
