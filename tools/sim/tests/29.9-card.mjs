// Aşama 29.9: Yeni karakter kartı (dört sekme), Sakinler çekmecesi işaretleri ve Yaşam Öyküsü (kitabeye yazılma dahil).
// Çalıştır: node tools/sim/tests/29.9-card.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 29.9
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const LS = await import('/src/systems/LifeStory.js');
  const RI = await import('/src/systems/Rites.js');
  const { addMoodlet, recomputeMood } = await import('/src/systems/Moodlets.js');
  const { EVOLUTION_AXES } = await import('/src/data/evolution.js');
  const { TRAITS } = await import('/src/data/characters.js');
  const { CharacterPanel } = await import('/src/ui/components/CharacterPanel.js');
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  sim.step(225 * 3);
  const s = () => game.state;
  const scene = () => game.scenes.current;
  const adults = () => s().characters.filter((c) => !c.isChild && !c.role && !c.away);
  const panel = game.ui.components.find((x) => x.setTab);
  const drawer = game.ui.components.find((x) => x.rows && x.rebuild);
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const who = adults()[0];
  localStorage.removeItem('lmgame.ui.cardTab');
  panel.setAllTabs(false);
  panel.setTab('summary', false);
  game.events.emit('ui:selectCharacter', who.id);
  await frame();
  const body = (id) => panel.bodies[id];
  const showTab = (id) => { panel.setTab(id, false); panel.render(game); return body(id); };

  // 1. dört sekme ve içerikleri
  {
    const labels = [...document.querySelectorAll('.card-tab')].map((b) => b.getAttribute('aria-label'));
    const sum = showTab('summary');
    const inner = showTab('inner');
    const axes = [...inner.querySelectorAll('.axis-row')].map((r) => `${r.querySelector('.axis-minus').textContent}|${r.querySelector('.axis-plus').textContent}`);
    const wantAxes = EVOLUTION_AXES.map((a) => `${TRAITS[a.minus].name}|${TRAITS[a.plus].name}`);
    const bonds = showTab('bonds');
    const life = showTab('life');
    const sentences = life.querySelector('.story-box').textContent.split('. ').length;
    check('29.9: kart dört sekmeli (Özet, İç Dünya, Bağlar, Hayat); Özet portre / ad / evre / çipler / durum cümlesi / ihtiyaç / takip, İç Dünya moodlet / doyum / dört eksen / değişim günlüğü, Bağlar aile / ilişki / sosyal / omuz omuza, Hayat öykü / anı / meslek / ekipman / kese',
      labels.join() === 'Özet,İç Dünya,Bağlar,Hayat' && sum.querySelector('.character-portrait') && sum.querySelector('.character-name') && sum.querySelector('.life-stage-row') && sum.querySelector('.trait-chip') && sum.querySelector('.summary-line')?.textContent.includes(' · ') && sum.querySelectorAll('.need-row').length === 4 && sum.querySelector('.character-follow') && sum.querySelector('.mood-badge')
      && inner.querySelector('.moodlet-list') && inner.querySelector('.satisfaction-bar') && axes.join() === wantAxes.join() && inner.querySelector('.evolution-log')
      && bonds.querySelector('.family-list') && bonds.querySelector('.relations-list') && bonds.querySelector('.social-life') && bonds.querySelector('.bond-top')
      && life.querySelector('.story-box') && life.querySelector('.memory-list') && life.querySelector('.skills-list') && life.querySelector('.equipment-slots') && life.querySelector('.purse-box') && sentences >= 3, `${labels} ${axes.length} ${sentences}`);
    panel.setTab('summary', false);
  }

  // 2. eski bölümlerdeki her bilgi bir sekmede (liste sürümlü tek test)
  {
    const old = [
      ['Ruh Hali ve İç Dünya', 'inner'], ['Arzular, Korkular ve Yaşam Doyumu', 'inner'], ['Aile', 'bonds'], ['İlişkiler', 'bonds'], ['Sosyal Hayat', 'bonds'], ['Çıraklık', 'bonds'],
      ['Ekipman', 'life'], ['Kişisel Kese & Çanta', 'life'], ['Meslekler', 'life'], ['Anılar ve Hatıralar', 'life'],
    ];
    const oldParts = [
      ['.character-portrait', 'summary'], ['.character-name', 'summary'], ['.life-stage-row', 'summary'], ['.character-meta', 'summary'], ['.character-traits', 'summary'], ['.trait-hint', 'summary'], ['.craft-badge', 'summary'], ['.mood-badge', 'summary'],
      ['.character-status-text', 'summary'], ['.character-conditions', 'summary'], ['.petition-box', 'summary'], ['.loyalty-box', 'summary'], ['.character-needs', 'summary'], ['.character-follow', 'summary'],
      ['.moodlet-list', 'inner'], ['.want-box', 'inner'], ['.family-list', 'bonds'], ['.relations-list:not(.skills-list):not(.evolution-log)', 'bonds'], ['.social-life', 'bonds'], ['.apprentice-box', 'bonds'], ['.equipment-slots', 'life'], ['.purse-box', 'life'], ['.skills-list', 'life'], ['.memory-list', 'life'],
    ];
    const titlesIn = (id) => [...body(id).querySelectorAll('.relations-title')].map((t) => t.textContent);
    const titleOk = old.every(([t, tab]) => titlesIn(tab).includes(t) && Object.keys(panel.bodies).filter((id) => titlesIn(id).includes(t)).length === 1);
    const partOk = oldParts.every(([sel, tab]) => Boolean(body(tab).querySelector(sel)) && Object.keys(panel.bodies).filter((id) => body(id).querySelector(sel)).length === 1);
    check('29.9: eski on iki bölümün ve kartın her parçasının tam olarak bir sekmede bulunduğu (hiçbir bilgi silinmedi)', titleOk && partOk, `${titleOk} ${oldParts.filter(([sel, tab]) => !body(tab).querySelector(sel) || Object.keys(panel.bodies).filter((id) => body(id).querySelector(sel)).length !== 1).map((x) => x[0])}`);
  }

  // 3. yalnızca etkin sekmenin DOM'u kurulur
  {
    addMoodlet(who, 'warm_chat', s().totalMinutes, { reason: null });
    recomputeMood(who);
    const result = [];
    for (const id of ['summary', 'inner', 'bonds', 'life']) {
      panel.setTab(id, false);
      panel.render(game);
      const attached = [...document.querySelectorAll('.character-panel .card-tab-body')].map((b) => b.dataset.tab);
      result.push(attached.join() === id);
    }
    panel.setTab('summary', false);
    panel.render(game);
    const noInner = document.querySelectorAll('.character-panel .moodlet-chip').length === 0 && document.querySelectorAll('.character-panel .axis-row').length === 0 && document.querySelectorAll('.character-panel .story-box').length === 0;
    panel.setTab('inner', false);
    panel.render(game);
    const innerOnly = document.querySelectorAll('.character-panel .moodlet-chip').length >= 1 && document.querySelectorAll('.character-panel .need-row').length === 0;
    // etkin olmayan sekmenin bölümleri yenilenmez: Özet'te iken İç Dünya çipleri yeniden kurulmaz
    panel.setTab('summary', false);
    const chipsBefore = body('inner').querySelectorAll('.moodlet-chip').length;
    who.moodlets.length = 0;
    recomputeMood(who);
    panel.render(game);
    const stale = body('inner').querySelectorAll('.moodlet-chip').length === chipsBefore;
    check('29.9: yalnızca etkin sekmenin gövdesi DOM\'a takılır ve yalnızca o sekmenin bölümleri yenilenir', result.every(Boolean) && noInner && innerOnly && stale, `${result} ${noInner} ${innerOnly} ${stale}`);
  }

  // 4. sekme seçimi hatırlanır
  {
    document.querySelector('.card-tab[data-tab="life"]').click();
    const stored = localStorage.getItem('lmgame.ui.cardTab') === 'life';
    const fresh = new CharacterPanel(game);
    const restored = fresh.tab === 'life';
    document.querySelector('.card-tab[data-tab="summary"]').click();
    check('29.9: sekme seçimi tarayıcıda hatırlanır (yeni kart son sekmeyle açılır)', stored && restored && localStorage.getItem('lmgame.ui.cardTab') === 'summary' && panel.tab === 'summary');
  }

  // 5. içerik değişmeden DOM yenilenmez
  {
    panel.setTab('inner', false);
    panel.render(game);
    const axisNode = panel.axisList.firstChild;
    const moodNode = panel.moodList.firstChild;
    for (let i = 0; i < 4; i++) panel.render(game);
    const stable = panel.axisList.firstChild === axisNode && panel.moodList.firstChild === moodNode;
    who.growth[0] = who.growth[0] + 30;
    panel.render(game);
    const axisChanged = panel.axisList.firstChild !== axisNode;
    who.growth[0] -= 30;
    panel.setTab('life', false);
    panel.render(game);
    const storyNode = panel.storyBox.firstChild;
    const memNode = panel.memoryList.firstChild;
    for (let i = 0; i < 4; i++) panel.render(game);
    const lifeStable = panel.storyBox.firstChild === storyNode && panel.memoryList.firstChild === memNode;
    panel.setTab('summary', false);
    check('29.9: içerik değişmedikçe kartın DOM düğümleri yenilenmez (eksenler, ruh hali, öykü, anılar); değişince yenilenir', stable && axisChanged && lifeStable);
  }

  // 6. Özet: tek cümlelik durum, en önemli arzu ve korku
  {
    const mate = adults()[1];
    addMoodlet(who, 'mourning', s().totalMinutes, { reason: 'mourning', whoId: mate.id, whoName: 'Deniz' });
    recomputeMood(who);
    panel.setTab('summary', false);
    panel.render(game);
    const line = panel.summaryLine.textContent;
    const desires = panel.desireBox.querySelectorAll('.want-chip, .fear-chip').length;
    who.moodlets.length = 0;
    recomputeMood(who);
    panel.render(game);
    check('29.9: Özet tek cümlelik durum ("Kederli · Deniz\'in yasını tutuyor") ve en çok 1 arzu + 1 korku gösterir', line === 'Kederli · Deniz\'in yasını tutuyor' && desires <= 2 && !panel.desireSection.hidden, `${line} / ${desires}`);
  }

  // 7. çocukta gizlenen bölümler
  {
    const kid = adults()[2];
    const keepGrows = kid.growsUpAt;
    panel.setAllTabs(true);
    game.events.emit('ui:selectCharacter', kid.id);
    panel.render(game);
    const adultShown = !panel.wantSection.hidden && !panel.axisSection.hidden && !panel.evolutionSection.hidden && !panel.desireSection.hidden;
    kid.growsUpAt = s().totalMinutes + 99999;
    panel.resetCaches();
    panel.render(game);
    const hidden = panel.wantSection.hidden && panel.axisSection.hidden && panel.evolutionSection.hidden && panel.desireSection.hidden;
    kid.growsUpAt = keepGrows;
    panel.setAllTabs(false);
    game.events.emit('ui:selectCharacter', who.id);
    check('29.9: çocukta Arzular / Korkular, Kişilik Eksenleri, Değişim Günlüğü ve Özet arzusu gizlenir; yetişkinde görünür', adultShown && hidden);
  }

  // 8. Sakinler çekmecesi: ruh hali işareti ve özel gün simgesi
  {
    drawer.setCollapsed(false, false);
    drawer.rosterKey = '';
    drawer.render(game);
    const rowOf = (c) => drawer.rows.get(c.id);
    const a = adults()[0];
    const b = adults()[1];
    const keepSpecial = a.specialDay;
    addMoodlet(a, 'mourning', s().totalMinutes, { reason: 'mourning', whoName: 'Deniz' });
    recomputeMood(a);
    a.specialDay = { day: s().time.day, kind: 'birthday', celebrated: false, gifted: false };
    drawer.render(game);
    const shown = !rowOf(a).mark.hidden && rowOf(a).mark.classList.contains('is-trauma') && !rowOf(a).special.hidden;
    const plain = rowOf(b).mark.hidden && rowOf(b).special.hidden;
    a.moodlets.length = 0;
    recomputeMood(a);
    a.specialDay = keepSpecial ?? null;
    drawer.render(game);
    check('29.9: Sakinler çekmecesinin her satırında ruh hali işareti (travma / coşku / yorgunluk) ve özel gün simgesi; işaretsiz sakinde gizli', shown && plain && rowOf(a).mark.hidden && rowOf(a).special.hidden);
  }

  // 9. Yaşam Öyküsü: aynı durum aynı metin (zarsız)
  {
    const realRandom = Math.random;
    Math.random = () => { throw new Error('Math.random kullanıldı'); };
    let a;
    let b;
    let threw = false;
    try { a = LS.lifeStory(who, s()); b = LS.lifeStory(who, s()); } catch { threw = true; }
    Math.random = realRandom;
    const sentences = a?.split('. ').length ?? 0;
    check('29.9: Yaşam Öyküsü şablon tabanlıdır: aynı durum aynı metni verir (Math.random çağrılmaz), 3-6 cümle', !threw && a === b && sentences >= 3 && sentences <= 6, a);
  }

  // 10. kurucu / göçmen / kasabada doğan ayrımı
  {
    const base = { name: 'Deniz', age: 40, children: [], parentIds: [], parents: [], memories: [], evolutions: [], skills: {}, satisfaction: 70, wishCount: 0, loyalty: 0, partnerId: null, isVenerable: false, isChild: false, role: null, generation: 1 };
    const st = { characters: [] };
    const founder = LS.lifeStory({ ...base }, st, { dead: true });
    const immigrant = LS.lifeStory({ ...base, memories: [{ kind: 'arrival', text: 'Kasabaya göçmen olarak katıldı', day: 3 }] }, st, { dead: true });
    const born = LS.lifeStory({ ...base, parentIds: [5], generation: 2 }, st, { dead: true });
    check('29.9: öykü kurucu ("kurucularındandı"), göçmen ve kasabada doğan ("dünyaya geldi") sakini ayırır', founder.startsWith('Deniz kasabanın kurucularındandı') && immigrant.startsWith('Deniz kasabaya göçmen olarak geldi') && born.startsWith('Deniz bu kasabada dünyaya geldi') && LS.originOf({ ...base }) === 'founder', `${founder}`);
  }

  // 11. kişilik değişimi, Başusta, eş ve çocuklar; yaş yazıyla
  {
    const partner = { id: 9, name: 'Elif', parentIds: [] };
    const st = { characters: [partner] };
    const c = {
      name: 'Deniz', id: 1, age: 68, children: [11, 12], parentIds: [], parents: [], memories: [], skills: { baking: 3000 }, satisfaction: 90, wishCount: 5, loyalty: 0,
      partnerId: 9, married: true, isVenerable: false, isChild: false, role: null, generation: 1, isGrandmaster: true, grandmasterProfession: Object.keys((await import('/src/data/apprenticeship.js')).PROFESSIONS)[0],
      evolutions: [{ day: 12, kind: 'turned', axis: 1, from: 'socialButterfly', to: 'introvert', cause: 'moodlet:mourning' }, { day: 60, kind: 'turned', axis: 1, from: 'introvert', to: 'socialButterfly', cause: 'consoled' }],
    };
    const t = LS.lifeStory(c, st, { dead: true });
    check('29.9: öykü eşi, çocukları, kişilik değişimini ("Derin Yas\'tan sonra İçine Kapanık yanı ağır bastı"), Başusta unvanını, doyum ifadesini ve yaşı yazıyla ("Altmış sekiz") söyler', t.includes('Elif ile evlendi') && t.includes('iki evlat büyüttü') && t.includes('İçine Kapanık yanı ağır bastı') && t.includes('Başusta') && t.includes('Hayattan umduğunu fazlasıyla buldu') && !t.includes('dileğinin') && t.includes('Altmış sekiz yaşında') && t.includes('gönlü zengin göçtü') && LS.numberWords(68) === 'altmış sekiz', t);
  }

  // 12. 400 karakter sınırı
  {
    const long = 'u'.repeat(300);
    const c = { name: 'Deniz', id: 1, age: 70, children: [1, 2, 3, 4, 5, 6], parentIds: [], parents: [], skills: { baking: 3000 }, satisfaction: 90, wishCount: 0, loyalty: 90, partnerId: null, isVenerable: true, isChild: false, role: null, generation: 1,
      memories: [{ kind: 'masterwork', text: `Usta işi bir eser yaptı: ${long}`, day: 1 }, { kind: 'life', text: `${long} yasını tuttu`, day: 2 }, { kind: 'life', text: long, day: 3 }],
      evolutions: [] };
    const full = LS.lifeStory(c, { characters: [] }, { dead: true });
    const cut = LS.epitaphStory(c, { characters: [] });
    check('29.9: kitabe öyküsü en çok 400 karakter (uzun anılarda sondaki isteğe bağlı cümleler düşer, 3 cümlenin altına inmez)', full.length > 400 && cut.length <= LS.STORY_MAX && LS.STORY_MAX === 400 && cut.split('. ').length >= 3, `${full.length}/${cut.length}`);
  }

  // 13. vefatta kitabeye yazılır (gerçek akış: referanslar silinmeden önce üretilir)
  {
    const [dead] = adults().filter((c) => !c.married);
    const expected = LS.epitaphStory(dead, s());
    const day0 = s().time.day;
    scene().lifecycle.die(dead, { cause: 'age' });
    const pend = s().rites.pending.at(-1);
    let n = 0;
    while (!(s().rites.names.length && s().rites.names.at(-1).name === dead.name) && n++ < 225 * 60) sim.step(1);
    const row = s().rites.names.at(-1);
    const json = JSON.parse(JSON.stringify(s().rites));
    const round = RI.restoreRites(json);
    check('29.9: vefatta öykü üretilir, bekleyen kayda ve tören sonrası kitabeye (rites.names[].story) yazılır; kayıt gidiş-dönüşünde korunur', pend?.story === expected && row?.name === dead.name && row.story === expected && expected.length <= 400 && round.names.at(-1).story === expected && s().time.day > day0, `${pend?.story === expected} ${row?.story === expected} ${s().time.day - day0}`);
  }

  // 14. story alanı olmayan kayıt bozulmaz; uzun alan kırpılır
  {
    const old = RI.restoreRites({ names: [{ name: 'Ayşe', day: 3, age: 70 }, { name: 'Ali', day: 4, age: 80, story: 'x'.repeat(900) }, { name: 'Veli', day: 5, age: 60, story: 42 }], pending: [{ name: 'Can', day: 6, age: 50 }], held: 3 });
    check('29.9: story alanı olmayan kitabe kaydı bozulmaz (alan hiç yazılmaz), uzun alan 400\'e kırpılır, geçersiz alan atılır', !('story' in old.names[0]) && old.names[1].story.length === 400 && !('story' in old.names[2]) && !('story' in old.pending[0]) && old.held === 3 && JSON.stringify(old.names[0]) === '{"name":"Ayşe","day":3,"age":70}');
  }
  return out;
});
results.push(...out);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
