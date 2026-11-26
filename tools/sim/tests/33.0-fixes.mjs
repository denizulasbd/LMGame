// Aşama 33.0 Ek düzeltmeleri (kısa test): Ek 3 (ferman / tahsildar çipi Belediye'yi açar ve Krallık bölümüne kaydırır),
// Ek 4 (kulüpten çıkarılan kişi aday listesinin sonuna gider; davet düğmeleri doğru kişiyi hedefler).
// Ek 1 (Darülfünun kabulü) 32.4-university.mjs'te, Ek 2 (Halkın beklediği satırı) 32.2-court.mjs'te sınanır.
// Kullanım: node tools/sim/tests/33.0-fixes.mjs   ya da   node tools/sim/gate.mjs --quick --only 33.0
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const st = game.state;
  const sc = game.scenes.current;
  const E = game.events;
  const C = await import('/src/systems/Clubs.js');
  const CC = await import('/src/ui/components/clubCards.js');
  const CD = await import('/src/data/clubs.js');
  const CR = await import('/src/data/crown.js');
  sim.give({ wood: 999, stone: 999, food: 900, gold: 3000, iron: 300, cloth: 200, wool: 200 });
  st.town.tier = 3;
  for (let i = 0; i < 5; i++) sim.place('cabin');
  sc.population.welcomeNewcomers(10);

  // ---- Ek 3: ferman / tahsildar çipi -> Belediye paneli, Krallık bölümüne kaydırma
  const hall = sim.place('townHall');
  const scrolled = [];
  const realScroll = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = function (...a) { scrolled.push(this.className); };
  const clickChip = async (re) => {
    sim.step(60);
    await new Promise((r) => setTimeout(r, 600)); // çipler gerçek zamanda aralıklı tazelenir
    game.ui.render();
    const chip = [...document.querySelectorAll('.buff-chip, .hud-more-list > *')].find((b) => re.test(b.textContent));
    chip?.click();
    game.ui.render();
    game.ui.render();
    return Boolean(chip);
  };
  st.crown.notice = { at: st.totalMinutes + 1440, amount: 40, announcedAt: st.totalMinutes };
  const sawNotice = await clickChip(/Tahsildar yolda/);
  const panelHall = game.ui.components?.buildingPanel ?? null;
  const open1 = !document.querySelector('.building-panel, .building-card')?.hidden;
  check('tahsildar çipi: tıklayınca Belediye paneli açılır ve Krallık bölümüne kaydırılır', hall && sawNotice && scrolled.some((c) => /building-crown/.test(c)), `${sawNotice} ${scrolled.join('|')} ${open1}`);
  scrolled.length = 0;
  E.emit('ui:selectBuilding', null);
  st.crown.notice = null;
  st.crown.decree = { id: 1, kind: Object.keys(CR.DECREES)[0], deadline: st.totalMinutes + 900 };
  const sawDecree = await clickChip(/Ferman ·/);
  const chips = [...document.querySelectorAll('.buff-chip, .hud-more-list > *')].map((b) => b.textContent.slice(0, 40)).join('/');
  check('ferman çipi: tıklayınca Belediye paneli açılır ve Krallık bölümüne kaydırılır', sawDecree && scrolled.some((c) => /building-crown/.test(c)), `${sawDecree} ${scrolled.join('|')} chips: ${chips}`);
  HTMLElement.prototype.scrollIntoView = realScroll;
  st.crown.decree = null;
  E.emit('ui:selectBuilding', null);

  // ---- Ek 4: kulüpten çıkarılan kişi aday listesinin sonuna gider; Davet et doğru kişiyi hedefler
  const club = sim.place('gardenClub');
  sc.clubs.newDay();
  const members = C.membersOf(st, 'gardenClub');
  check('kurulum: kulüpte üye var', Boolean(club) && members.length >= 1, `${members.length}`);
  const m = members[0];
  const ranked = C.candidatesFor(st, 'gardenClub').filter((e) => e.score > 0);
  E.emit('ui:clubKick', { characterId: m.id });
  const cands = C.candidatesFor(st, 'gardenClub');
  check('Çıkar: çıkarılan kişi aday listesinin SONUNDA (puanı yüksek olsa da); öteki adaylar puan sırasında', cands.length >= 2 && cands.at(-1).c.id === m.id && cands.slice(0, -1).every((e, i, a) => i === 0 || a[i - 1].score >= e.score), cands.map((e) => `${e.c.id}:${e.score}${e.kicked ? 'k' : ''}`).join(','));
  const sent = [];
  const nodes = CC.clubSection(club, st, { emit: (n, p) => sent.push([n, p]) });
  const rows = nodes.flatMap((n) => [...(n.querySelectorAll?.('.club-row.is-candidate') ?? [])]);
  const shown = cands.slice(0, 5);
  rows.forEach((r) => r.querySelector('button')?.click());
  const invited = sent.filter(([n]) => n === 'ui:clubInvite').map(([, p]) => p.characterId);
  check('Davet et düğmeleri satırdaki kişiyi hedefler (sırayla, doğru kimlik)', rows.length === shown.length && invited.join() === shown.map((e) => e.c.id).join(), `${invited.join()} / ${shown.map((e) => e.c.id).join()}`);
  return out;
});
results.push(...out);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
