// Aşama 29.8: Görsel İfade Dili — Duygu Katmanı (işaretler, bağ çizgileri), düşünce / konuşma balonları, beden dili, tercih, fotoğraf modu.
// Çalıştır: node tools/sim/tests/29.8-expression.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 29.8
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const EL = await import('/src/rendering/ExpressionLayer.js');
  const SB = await import('/src/rendering/SpeechBubbles.js');
  const BL = await import('/src/rendering/BodyLanguage.js');
  const { ACTIVITIES } = await import('/src/data/activities.js');
  const { WANTS, FEARS } = await import('/src/data/wants.js');
  const { pairKey } = await import('/src/systems/RelationshipSystem.js');
  const { recomputeMood, addMoodlet } = await import('/src/systems/Moodlets.js');
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  sim.step(225 * 3);
  const scene = () => game.scenes.current;
  const s = () => game.state;
  const adults = () => s().characters.filter((c) => !c.isChild && !c.role && !c.away);
  const makeCtx = (events) => ({
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    measureText: (t) => ({ width: t.length * 5 }),
    fillRect() { events?.push('rect'); },
    fillText(t) { events?.push(`speech:${t}`); },
    drawImage() { events?.push('thought'); },
    stroke() { events?.push(`line:${this.strokeStyle}`); },
  });
  const cam = { x: 0, y: 0, zoom: 2 };

  // 1. salt okunur çizim: oyun durumunun JSON'u çizim öncesi / sonrası aynı
  {
    const a = adults()[0];
    game.events.emit('ui:selectCharacter', a.id);
    scene().expression.setEnabled(true);
    const before = JSON.stringify(s());
    for (let i = 0; i < 3; i++) game.render(0);
    const after = JSON.stringify(s());
    check('29.8: Duygu Katmanı açıkken çizim salt okunur (oyun durumunun JSON\'u çizim öncesi / sonrası aynı)', before === after && before.length > 1000);
    scene().expression.setEnabled(false);
    game.events.emit('ui:selectCharacter', null);
  }

  // 2. kare başına ayırma yok (27.3 kalıbı): sabit yuvalar, aynı nesneler, kareler arası aynı çıktı
  {
    const layer = new EL.ExpressionLayer({ on: () => () => {}, emit() {} });
    layer.enabled = true;
    const slots = [layer.linkChar, layer.linkColor, layer.linkScore, layer.budget, BL.bodyOffset];
    const state = { characters: [], relationships: {} };
    const mk = (id, mood) => ({ id, visible: true, role: null, x: 40 + id * 6, y: 90, spriteHeight: 18, homeId: null, parentIds: [], partnerId: null, relationships: {}, mood });
    for (let i = 1; i <= 6; i++) state.characters.push(mk(i, { tone: i % 2 ? 'trauma' : 'neutral', feel: 'Kederli' }));
    for (let i = 2; i <= 6; i++) state.relationships[pairKey(1, i)] = 50 + i;
    const frames = [];
    const r = { ctx: makeCtx(), width: 800, height: 600 };
    for (let f = 0; f < 4; f++) {
      const ev = [];
      r.ctx = makeCtx(ev);
      layer.draw(r, cam, state, 1.5, 1, null);
      frames.push(ev.join());
    }
    const same = frames.every((x) => x === frames[0]) && frames[0].includes('line:');
    check('29.8: Duygu Katmanı kare başına yeni dizi / nesne ayırmaz (bağ yuvaları ve bütçe aynı nesneler) ve aynı kare aynı çizimi verir', same && slots[0] === layer.linkChar && slots[1] === layer.linkColor && slots[2] === layer.linkScore && slots[3] === layer.budget && slots[4] === BL.bodyOffset && BL.computeBodyOffset({ pose: 'stand', animTime: 0 }, 'grief') === BL.bodyOffset);
  }

  // 3. düşünce balonu dilim kuralı
  {
    const leisure = Object.keys(ACTIVITIES).find((k) => ACTIVITIES[k].kind === 'leisure');
    const work = Object.keys(ACTIVITIES).find((k) => ACTIVITIES[k].kind === 'work');
    const base = (id) => ({ id, visible: true, isChild: false, isSleeping: false, role: null, speech: null, task: { phase: 'perform', activity: leisure } });
    let ok = true;
    let shown = 0;
    for (let id = 0; id < 20; id++) for (let m = 0; m < 400; m += 7) {
      const want = (Math.floor(m / 20) + id) % 9 === 0;
      if (EL.thoughtVisible(base(id), m) !== want) ok = false;
      if (want) shown++;
    }
    const c = base(9); // dakika 0'da (0 + 9) % 9 === 0
    const gates = [
      EL.thoughtVisible(c, 0) === true,
      EL.thoughtVisible({ ...c, isChild: true }, 0) === false,
      EL.thoughtVisible({ ...c, isSleeping: true }, 0) === false,
      EL.thoughtVisible({ ...c, speech: { text: 'x' } }, 0) === false,
      EL.thoughtVisible({ ...c, task: { phase: 'travel', activity: leisure } }, 0) === false,
      EL.thoughtVisible({ ...c, task: { phase: 'perform', activity: work } }, 0) === false,
      EL.thoughtVisible({ ...c, task: null }, 0) === false,
    ];
    check('29.8: düşünce balonu yalnızca (floor(dakika / 20) + kimlik) % 9 === 0 diliminde, perform evresinde boş zaman / sosyal etkinlikte; çocukta, uyuyanda, konuşurken yok', ok && shown > 20 && gates.every(Boolean), gates.join());
  }

  // 4. düşünce içeriği
  {
    const wantKeys = Object.keys(WANTS).slice(0, 3);
    const best = wantKeys.map((k) => WANTS[k]).sort((a, b) => b.points - a.points)[0];
    const fearKey = Object.keys(FEARS)[0];
    const c = { wants: wantKeys.map((key) => ({ key })), fears: [{ key: fearKey }], satisfaction: 60 };
    const wantIcon = EL.thoughtIconOf(c);
    const fearIcon = EL.thoughtIconOf({ ...c, satisfaction: 30 });
    check('29.8: düşünce simgesi en yüksek puanlı arzunun; doyum < 40 ise korkunun simgesidir; ikisi de yoksa balon yok', wantIcon === best.icon && fearIcon === FEARS[fearKey].icon && EL.thoughtIconOf({ wants: [], fears: [], satisfaction: 60 }) === null);
  }

  // 5. balon sınırı (12) ve öncelik
  {
    const leisure = Object.keys(ACTIVITIES).find((k) => ACTIVITIES[k].kind === 'leisure');
    const wantKey = Object.keys(WANTS)[0];
    const speaker = (id) => ({ id, visible: true, x: 100 + id, y: 200, spriteHeight: 18, bubble: null, speech: { text: `t${id}`, duration: 3, remaining: 2, at: -1 } });
    const thinker = (id) => ({ id, visible: true, x: 100 + id, y: 300, spriteHeight: 18, bubble: null, speech: null, isChild: false, isSleeping: false, role: null, satisfaction: 60, wants: [{ key: wantKey }], fears: [], task: { phase: 'perform', activity: leisure } });
    const frame = (chars, minutes, sel) => {
      const ev = [];
      const r = { ctx: makeCtx(ev) };
      const budget = { left: EL.BUBBLE_LIMIT };
      SB.drawSpeechBubbles(r, cam, chars, budget, sel, 1);
      EL.drawThoughtBubbles(r, cam, chars, minutes, budget, sel, 1);
      SB.drawSpeechBubbles(r, cam, chars, budget, sel, 2);
      EL.drawThoughtBubbles(r, cam, chars, minutes, budget, sel, 2);
      return ev.filter((e) => e !== 'rect');
    };
    // A: 14 konuşma (seçili sonuncu) + 5 düşünce adayı -> yalnızca 12 balon, hepsi konuşma, seçilinin sözü ilk
    const A = [...Array.from({ length: 13 }, (_, i) => speaker(100 + i)), speaker(113), ...[0, 9, 18, 27, 36].map(thinker)];
    const a = frame(A, 0, 113);
    // B: seçili sakin düşünüyor (listenin sonunda) + 12 konuşma -> seçilinin düşüncesi ilk, toplam 12
    const B = [...Array.from({ length: 12 }, (_, i) => speaker(100 + i)), thinker(0)];
    const b = frame(B, 0, 0);
    // C: 5 konuşma + 10 düşünce adayı, seçili yok -> 5 konuşma + 7 düşünce
    const C = [...Array.from({ length: 5 }, (_, i) => speaker(100 + i)), ...Array.from({ length: 10 }, (_, i) => thinker(i * 9))];
    const c = frame(C, 0, null);
    const count = (ev, p) => ev.filter((e) => e.startsWith(p)).length;
    check('29.8: ekrandaki balon sayısı en çok 12; konuşma düşünceden önce gelir, seçili sakin her şeyden önce', a.length === 12 && count(a, 'speech') === 12 && count(a, 'thought') === 0 && a[0] === 'speech:t113' && b.length === 12 && b[0] === 'thought' && count(b, 'speech') === 11 && c.length === 12 && count(c, 'speech') === 5 && count(c, 'thought') === 7, `${a.length}/${b.length}/${c.length}`);
  }

  // 6. ruh hali işareti eşlemesi
  {
    const m = (tone, feel) => EL.moodMarkOf({ mood: { tone, feel } });
    check('29.8: ruh hali işareti: travma koyu bulut, coşkulu / ilhamlı pırıltı, yorgun / bıkkın ter damlası, dengeli işaretsiz; renkler moodlet çip tonları', m('trauma', 'Kederli') === 'cloud' && m('trauma', 'Sarsılmış') === 'cloud' && m('positive', 'Coşkulu') === 'sparkle' && m('positive', 'İlhamlı') === 'sparkle' && m('negative', 'Yorgun') === 'sweat' && m('negative', 'Bıkkın') === 'sweat' && m('neutral', 'Dengeli') === null && m('positive', 'Keyifli') === null && EL.MARK_COLORS.trauma === '#8a3fa0' && EL.MARK_COLORS.positive === '#d9a520' && EL.MARK_COLORS.negative === '#d98a2c');
  }

  // 7. bağ çizgisi renkleri
  {
    const P = (id, over = {}) => ({ id, partnerId: null, relationships: {}, ...over });
    const a = P(1, { partnerId: 2 });
    const b = P(2, { partnerId: 1 });
    const x = P(3);
    const kin = P(1, { relationships: { 3: { tags: ['kindred'] } } });
    const sore = P(1, { relationships: { 3: { tags: ['resentful'] } } });
    check('29.8: bağ çizgisi renkleri: eş pembe, ruh ikizi altın, kırgın / rakip kırmızı, puan ≥ 40 yeşil, öteki çizgisiz', EL.bondColorOf(a, b, 10) === 'pink' && EL.bondColorOf(kin, x, 20) === 'gold' && EL.bondColorOf(sore, x, 20) === 'red' && EL.bondColorOf(P(1), x, -30) === 'red' && EL.bondColorOf(P(1), x, 40) === 'green' && EL.bondColorOf(P(1), x, 39) === null && EL.bondColorOf({ ...a, relationships: { 2: { tags: ['resentful'] } } }, b, 10) === 'pink');
  }

  // 8. en çok 8 çizgi, mutlak puana göre
  {
    const layer = new EL.ExpressionLayer({ on: () => () => {}, emit() {} });
    const mk = (id) => ({ id, visible: true, role: null, x: 100 + id * 3, y: 120, spriteHeight: 18, homeId: null, parentIds: [], partnerId: null, relationships: {} });
    const state = { characters: Array.from({ length: 15 }, (_, i) => mk(i + 1)), relationships: {} };
    for (let id = 2; id <= 13; id++) state.relationships[pairKey(1, id)] = 40 + id; // 42..53 yeşil
    state.relationships[pairKey(1, 14)] = -60; // kırmızı, mutlak puanı en yüksek
    state.relationships[pairKey(1, 15)] = 10; // çizgisiz
    const n = layer.collectLinks(state, cam, { width: 1000, height: 800 }, state.characters[0]);
    const ids = layer.linkChar.slice(0, n).map((c) => c.id);
    const colors = layer.linkColor.slice(0, n);
    check('29.8: seçili sakinden en çok 8 bağ çizgisi, mutlak puana göre (en güçlü ilk); puanı düşük olan çizgisiz', n === 8 && ids.join() === '14,13,12,11,10,9,8,7' && colors[0] === 'red' && colors.slice(1).every((c) => c === 'green'), ids.join());
  }

  // 9. beden dili önceliği (tek gövde hareketi)
  {
    const mk = (keys, over = {}) => ({ mood: { grief: false, shirk: false }, moodlets: keys.map((key) => ({ key, whoId: 7 })), pose: 'work', animTime: 0, specialDay: null, ...over });
    const day = 3;
    const k = (c) => BL.bodyKind(c, day);
    const prio = [
      k(mk(['euphoric', 'exhausted', 'side_by_side'], { mood: { grief: true, shirk: false }, specialDay: { day } })) === 'grief',
      k(mk(['mourning', 'euphoric'])) === 'grief',
      k(mk(['celebrated', 'exhausted', 'side_by_side'], { specialDay: { day } })) === 'joy',
      k(mk(['exhausted', 'side_by_side', 'rubbing_wrong'])) === 'tired',
      k(mk(['proud_work'], { mood: { grief: false, shirk: true } })) === 'tired',
      k(mk(['side_by_side', 'rubbing_wrong'], { specialDay: { day } })) === 'side',
      k(mk(['rubbing_wrong'], { specialDay: { day } })) === 'rub',
      k(mk(['rubbing_wrong'], { pose: 'stand', specialDay: { day } })) === 'special',
      k(mk([], { specialDay: { day } })) === 'special',
      k(mk([], { specialDay: { day: day - 1 } })) === null,
      k(mk(['wish_come_true'])) === 'joy',
    ];
    check('29.8: beden dili önceliği yukarıdan aşağıya (yas > coşku > yorgunluk > yan yana > sırt dönme > özel gün); bir sakinde tek hareket', prio.every(Boolean), prio.map((x) => (x ? 1 : 0)).join(''));
  }

  // 10. beden dili çizim kaydırmaları ve yürüyüş kareleri
  {
    const c = adults()[0];
    const keep = { moodlets: [...c.moodlets], pose: c.pose, animTime: c.animTime };
    const setMoodlets = (list) => { c.moodlets.length = 0; for (const key of list) addMoodlet(c, key, s().totalMinutes, { reason: null }); recomputeMood(c); };
    c.pose = 'walk';
    setMoodlets(['mourning']);
    const grief = [0, 0.17, 0.34, 0.5].map((t) => { c.animTime = t; return c.currentFrame(); });
    setMoodlets([]);
    const normal = [0, 0.17, 0.34, 0.5].map((t) => { c.animTime = t; return c.currentFrame(); });
    setMoodlets(['exhausted']);
    c.animTime = 0.2;
    const tired = c.currentFrame();
    setMoodlets([]);
    c.animTime = 0.2;
    const fresh = c.currentFrame();
    const stand = (kind, t, pose = 'stand') => ({ ...BL.computeBodyOffset({ pose, animTime: t }, kind) });
    const hop = [stand('joy', 0.05), stand('joy', 0.25), stand('joy', 0.45)].map((o) => o.y);
    const offs = [stand('grief', 0).y === 1, stand('tired', 1.5).x === 1 && stand('tired', 0).x === 0, hop.join() === '-2,0,-2', stand('joy', 0.05, 'work').y === 0];
    // sırt dönme: kırgın olduğu sakine arkasını döner (c.facing değişmez)
    const A = { id: 1, x: 100, y: 100, facing: 'right', moodlets: [{ key: 'rubbing_wrong', whoId: 2 }] };
    const B = { id: 2, x: 130, y: 100, facing: 'left', moodlets: [] };
    BL.expressionContext.characters = [A, B];
    const rub = BL.displayFacing(A, 'rub') === 'left' && A.facing === 'right' && BL.displayFacing(A, null) === 'right';
    BL.expressionContext.characters = s().characters;
    c.moodlets.length = 0;
    for (const m of keep.moodlets) c.moodlets.push(m);
    recomputeMood(c);
    c.pose = keep.pose;
    c.animTime = keep.animTime;
    check('29.8: beden dili: yaslı sakin yürürken sallanmaz ve 1 piksel aşağıdadır; coşkulu 2 piksel zıplar (0,4 sn); tükenmiş yarı hızda sallanır / dururken kayar; kırgın çalışanlar sırt döner', grief.every((f) => f === 'walk0') && new Set(normal).size === 2 && tired === 'walk0' && fresh === 'walk1' && offs.every(Boolean) && rub, `${grief} ${normal} ${tired}/${fresh} ${offs} ${rub}`);
  }

  // 11. tercih hatırlanır, M tuşu
  {
    const KEY = EL.EMOTION_PREF_KEY;
    localStorage.removeItem(KEY);
    const mk = () => new EL.ExpressionLayer(game.events);
    const first = scene().expression;
    first.setEnabled(false);
    first.setEnabled(true);
    const stored = localStorage.getItem(KEY) === '1';
    const second = mk();
    const remembered = second.enabled === true;
    second.destroy();
    first.setEnabled(false);
    const third = mk();
    const off = third.enabled === false && localStorage.getItem(KEY) === '0';
    third.destroy();
    // kısayol: M tuşu (Input -> ui:toggleEmotions)
    const before = first.enabled;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', bubbles: true }));
    scene().update(0.016);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM', bubbles: true }));
    const viaKey = first.enabled === !before;
    first.setEnabled(false);
    check('29.8: Duygu Katmanı tercihi tarayıcıda hatırlanır (açık / kapalı) ve M tuşu katmanı açıp kapatır', stored && remembered && off && viaKey && EL.EMOTION_PREF_KEY === 'lmgame.ui.emotionLayer');
  }

  // 12. fotoğraf modunda gizli
  {
    const layer = scene().expression;
    const orig = layer.draw;
    let calls = 0;
    layer.draw = function (...a) { calls++; return orig.apply(this, a); };
    layer.setEnabled(true);
    game.events.emit('ui:setCinematic', false);
    game.render(0);
    const normalCalls = calls;
    game.events.emit('ui:setCinematic', true);
    game.render(0);
    const photoCalls = calls - normalCalls;
    const keyBefore = layer.enabled;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', bubbles: true }));
    scene().update(0.016);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM', bubbles: true }));
    const ignored = layer.enabled === keyBefore;
    game.events.emit('ui:setCinematic', false);
    layer.draw = orig;
    layer.setEnabled(false);
    check('29.8: fotoğraf modunda Duygu Katmanı çizilmez (tercih korunur) ve M tuşu yok sayılır', normalCalls === 1 && photoCalls === 0 && ignored && keyBefore === true);
  }

  // 13. kapalıyken yalnızca seçili ve imlecin üstündeki sakinde işaret
  {
    const layer = new EL.ExpressionLayer({ on: () => () => {}, emit() {} });
    const state = { characters: [1, 2, 3, 4].map((id) => ({ id, visible: true, role: null, x: 100 + id * 20, y: 150, spriteHeight: 18, mood: { tone: 'trauma', feel: 'Kederli' }, homeId: null, parentIds: [], partnerId: null, relationships: {} })), relationships: {} };
    const count = (enabled, sel, hov) => {
      layer.enabled = enabled;
      const ev = [];
      layer.draw({ ctx: makeCtx(ev), width: 800, height: 600 }, cam, state, 0, sel, hov);
      return ev.filter((e) => e === 'rect').length;
    };
    const one = count(false, 1, null);
    check('29.8: Duygu Katmanı kapalıyken işaret yalnızca seçili ve imlecin üstündeki sakinde; açıkken herkeste', count(false, null, null) === 0 && one > 0 && count(false, 1, 2) === one * 2 && count(true, null, null) === one * 4);
  }

  // 14. dock düğmesi
  {
    const btn = document.querySelector('.dock-btn.emotion-toggle');
    const layer = scene().expression;
    layer.setEnabled(true);
    const active = btn?.classList.contains('is-active');
    layer.setEnabled(false);
    check('29.8: dock\'ta "Duygular" düğmesi (kısayol M) ve açıkken etkin görünümü', btn && btn.querySelector('.dock-key')?.textContent === 'M' && /Duygular/.test(btn.getAttribute('aria-label')) && active && !btn.classList.contains('is-active'));
  }
  return out;
});
results.push(...out);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
