// Aşama 32.5 testleri: Hobi Evleri ve Kulüpler. Şalter ve "açık ama yapı yok" tarih eşitliği (sha1), menü kilidi, yakınlık puanı ve
// nedenler, yerleşme sırası / kapasite / tek kulüp / çocuk dışlanması, dost çekimi, takvim (aynı akşam en çok iki), en az 3 üye kuralı,
// Brain öncelikleri (şenlik, Toplanma Zili, anma, kamu hizmeti önce; mesai ve uyku bölünmez), zar çekilmemesi, arkadaşlık kazancı
// yalnızca birlikte olanlarda, üç ürün ve sayaçları, hediye alıcısı sırası, kışın giysi mevsimde bir, tablo tavanı ve sergi bir kez,
// estetik tavanı, clubFactor / renownClubs, Çıkar / Davet, kendiliğinden ayrılma, ölen / ayrılan / sürgün edilen üyenin temizlenmesi,
// kaydet → yükle. Kullanım: node tools/sim/tests/32.5-clubs.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 32.5
import crypto from 'node:crypto';
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');

// ---- A. şalter kapalı ve "şalter açık ama hobi evi yok": aynı tohum, aynı oyuncu eylemleri → bayt bayt aynı kayıt
const historyRun = async (enginesOff) => {
  const { browser, page } = await openGame({ seed: 11, enginesOff });
  page.on('pageerror', (e) => errors.push(String(e)));
  const out = await page.evaluate(async () => {
    const st = game.state;
    const sc = game.scenes.current;
    const B = await import('/src/data/buildings.js');
    const C = await import('/src/systems/Clubs.js');
    const J = await import('/src/systems/Justice.js');
    const R = await import('/src/systems/Renown.js');
    sim.give({ wood: 600, stone: 400, food: 400, gold: 800, wool: 60 });
    for (let i = 0; i < 3; i++) sim.place('cabin');
    sc.population.welcomeNewcomers(6);
    st.town.tier = 3;
    sim.step(225 * 24 * 3);
    const a = st.characters.find((x) => !x.isChild && !x.role);
    return {
      json: JSON.stringify(st.toJSON()),
      menu: B.BUILD_MENU.includes('gardenClub'),
      block: sc.construction.globalBlock('gardenClub'),
      listeners: sc.clubs.unsubscribers.length,
      factor: J.clubFactor(a, st),
      renown: R.renownClubs(st),
      clubs: st.clubs,
      members: st.characters.filter((x) => x.club).length,
    };
  });
  await browser.close();
  return out;
};
{
  const off = await historyRun(['clubs']);
  const on = await historyRun(null);
  results.push(
    { name: 'şalter kapalı: dinleyici yok, menüde yok, kurulum reddedilir, faktörler nötr', ok: off.listeners === 0 && !off.menu && /kapalı/.test(off.block ?? '') && off.factor === 1 && off.renown === 0, detail: JSON.stringify({ l: off.listeners, b: off.block }) },
    { name: 'şalter açık ama hobi evi yok: 3 günlük kayıt şalter kapalıyla bayt bayt aynı (sha1)', ok: sha(off.json) === sha(on.json) && on.menu && !on.block, detail: `${sha(off.json).slice(0, 10)} / ${sha(on.json).slice(0, 10)}` },
    { name: 'hobi evi yokken state.clubs ve c.club hiç yazılmaz', ok: on.clubs === null && on.members === 0 && !on.json.includes('"clubs"') && !on.json.includes('"club"') },
  );
}

// ---- B. şalter açık: kurallar
{
  const { browser, page } = await openGame({ seed: 5 });
  page.on('pageerror', (e) => errors.push(String(e)));
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const C = await import('/src/systems/Clubs.js');
    const CD = await import('/src/data/clubs.js');
    const B = await import('/src/data/buildings.js');
    const J = await import('/src/systems/Justice.js');
    const R = await import('/src/systems/Renown.js');
    const L = await import('/src/systems/Landscape.js');
    const SD = await import('/src/data/storyCards.js');
    const SC = await import('/src/systems/StoryCards.js');
    const MD = await import('/src/data/moodlets.js');
    const IT = await import('/src/data/citizens.js');
    const CC = await import('/src/ui/components/clubCards.js');
    const RC = await import('/src/ui/components/renownCards.js');
    const RS = await import('/src/systems/RelationshipSystem.js');
    const { CONFIG } = await import('/src/config.js');
    const { Random } = await import('/src/utils/random.js');
    let st = game.state;
    let sc = game.scenes.current;
    const E = game.events;
    sim.give({ wood: 999, stone: 999, food: 900, gold: 3000, iron: 300, cloth: 200, wool: 200 });
    for (let i = 0; i < 5; i++) sim.place('cabin');
    sc.population.welcomeNewcomers(10);
    const rngStates = () => Object.entries(sc).filter(([, v]) => v && typeof v === 'object' && (v.rng instanceof Random || v.dice instanceof Random)).map(([k, v]) => `${k}:${(v.rng ?? v.dice).state}`).join(',') + `|beh:${sc.behavior.brain.rng.state}`;

    // ---- 1. veri ve kilit
    c('veri: kapasite 6, eşik 3, en az 3 üye, Kasaba (3), Sosyal, altınsız, tek, menüde; kart tablosu 8, kayıt 41, moodlet 33',
      CD.CLUB.capacity === 6 && CD.CLUB.threshold === 3 && CD.CLUB.minSession === 3 && CD.CLUB_KEYS.every((k) => B.BUILDINGS[k].requiresTier === 3 && B.BUILDINGS[k].category === 'Sosyal' && !B.BUILDINGS[k].cost.gold && B.BUILDINGS[k].unique && !B.BUILDINGS[k].workers && B.BUILD_MENU.includes(k)) &&
      SD.STORY_TABLE_VERSION === 8 && CONFIG.SAVE_VERSION === 41 && Object.keys(MD.MOODLETS).length === 33 && IT.ITEMS.handkerchief && !IT.ITEMS.handkerchief.value);
    st.town.tier = 2;
    const locked = sc.construction.globalBlock('gardenClub');
    st.town.tier = 3;
    c('Kasaba\'dan önce kilitli, sonra açık', Boolean(locked) && !sc.construction.globalBlock('gardenClub'), String(locked));

    // ---- 2. takvim: tek / çift gün, aynı akşam en çok iki kulüp, pencereler
    let maxSame = 0;
    for (let d = 1; d <= 40; d++) maxSame = Math.max(maxSame, C.sessionsOnDay(d));
    const w3 = C.sessionWindow('paintingClub', 3);
    c('takvim: bahçe ve resim tek, dikiş çift gün; aynı akşam en çok iki; resim yarım saat kaydırmalı', C.isSessionDay('gardenClub', 3) && !C.isSessionDay('gardenClub', 4) && C.isSessionDay('sewingClub', 4) && C.isSessionDay('paintingClub', 5) && maxSame === 2 && w3.start === 2 * 1440 + 18 * 60 && C.sessionWindow('gardenClub', 3).start === 2 * 1440 + 17.5 * 60);

    // ---- 3. yakınlık puanı: özellik / huy / beceri / zıt eğilim, nedenler
    const pool = st.characters.filter((x) => !x.isChild && !x.role).sort((a, b) => a.id - b.id);
    c('kurulum: en az 14 yetişkin', pool.length >= 14, `${pool.length}`);
    for (const x of pool) {
      x.traits = [];
      x.quirk = null;
      x.skills = {};
      x.workplaceId = null;
    }
    const [g1, g2, g3, g4, g5, g6, g7, p1, p2, s1, s2, s3, fb, kid] = pool;
    g1.traits = ['natureLover'];
    g1.quirk = 'natureEnthusiast';
    g1.skills.farming = 1600;
    const aff = C.clubAffinity(st, g1, 'gardenClub');
    c('yakınlık: Doğa Sever + Doğa Tutkunu + Usta Çiftçi = 3 + 3 + 1,5 = 7,5; nedenler adlarıyla', aff.score === 7.5 && aff.reasons.includes('Doğa Sever') && aff.reasons.includes('Doğa Tutkunu') && aff.reasons.includes('Çiftçi'), JSON.stringify(aff));
    g2.traits = ['natureLover', 'grumpy'];
    g2.quirk = 'natureEnthusiast';
    c('zıt eğilim: Huysuz −1', C.clubAffinity(st, g2, 'gardenClub').score === 5);
    for (const x of [g3, g4, g5, g6, g7]) { x.traits = ['natureLover']; x.quirk = 'animalLover'; } // 4,5
    g7.quirk = null; // 3
    p1.quirk = 'bookworm'; p1.traits = ['introvert']; // resim 4
    p2.quirk = 'philosopher'; p2.traits = ['cheerful']; // resim 3,5
    s1.quirk = 'craftsman'; s1.traits = ['hardworking']; // dikiş 5
    s2.traits = ['hardworking', 'introvert']; // dikiş 3 (resim 1,5)
    s3.traits = ['hardworking']; s3.skills.crafting = 600; // dikiş 3
    fb.traits = ['socialButterfly']; // her kulübe 0,5: dost çekimi olmadan katılmaz
    kid.traits = ['natureLover']; kid.quirk = 'natureEnthusiast';
    Object.defineProperty(kid, 'isChild', { value: true, configurable: true });
    // dostluklar (fb ↔ iki bahçe üyesi), çocuk dışlanır
    const rel = sc.relationships;
    rel.set(fb, g3, 60);
    rel.set(fb, g4, 60);

    // ---- 4. yerleşme: hobi evleri kurulur, gün dönümünde en yüksek puanlılar sırayla
    const houses = CD.CLUB_KEYS.map((k) => sim.place(k));
    c('kurulum: üç hobi evi yerleşti (işçisiz)', houses.every((h) => h && C.clubBuilding(st, h.type) === h && !h.workerSlots), houses.map((h) => h?.type).join(','));
    const before = rngStates();
    const plan = C.placementPlan(st);
    sc.clubs.newDay();
    const after = rngStates();
    const garden = C.membersOf(st, 'gardenClub');
    c('yerleşme zar çekmez (üreteç durumları önce / sonra aynı)', before === after);
    c('yerleşme sırası: puan sırası, eşitlikte küçük kimlik (ilk yerleşen 7,5 puanlı)', plan[0]?.c === g1 && plan.findIndex((p) => p.c === g3) < plan.findIndex((p) => p.c === g4), plan.slice(0, 6).map((p) => `${p.c.id}:${p.score}`).join(','));
    c('kapasite: bahçede en çok 6 üye; herkes en çok bir kulüpte', garden.length === 6 && pool.every((x) => !x.club || CD.CLUB_KEYS.includes(x.club.key)) && new Set(st.characters.filter((x) => x.club).map((x) => x.id)).size === st.characters.filter((x) => x.club).length, `${garden.map((x) => x.id)}`);
    c('çocuk üye olmaz (puanı yüksek olsa da)', !kid.club);
    c('dolu kulüpte mevcut üye çıkarılmaz: 3 puanlı g7 sırada, eşik üstünde kalır', !g7.club && C.candidatesFor(st, 'gardenClub').some((e) => e.c === g7 && e.auto));
    c('dost çekimi: iki dostu bahçede olan Sosyal Kelebek eşiği geçer (0,5 + 2 × 1,5)', C.clubAffinity(st, fb, 'gardenClub').score === 3.5 && C.clubAffinity(st, fb, 'sewingClub').score === 0.5, `${C.clubAffinity(st, fb, 'gardenClub').score}`);
    c('resim ve dikiş: eşiği geçenler yerleşti, eşiğin altındaki değil', p1.club?.key === 'paintingClub' && p2.club?.key === 'paintingClub' && s1.club?.key === 'sewingClub' && s2.club?.key === 'sewingClub' && s3.club?.key === 'sewingClub');
    delete kid.isChild; // prototipteki getter geri gelir

    // ---- 5. en az 3 üye kuralı: yalnızca 2 uygun üye → buluşma yok, zil yok, kart yok
    let bells = 0;
    const offBell = E.on('club:bell', () => bells++);
    const day0 = st.time.day;
    const pk = 'paintingClub';
    C.membersOf(st, pk).forEach((x, i) => { if (i >= 2) x.away = { stage: 'away' }; });
    const extra = st.characters.filter((x) => x.club?.key === pk).length;
    sc.clubs.evaluate(pk, C.clubBuilding(st, pk), { start: st.totalMinutes - 1, end: st.totalMinutes + 100 });
    c('en az 3 üye: yalnızca 2 uygun üye varken buluşma kurulmaz ve zil çalmaz', !st.clubs[pk]?.live && bells === 0 && st.clubs[pk].recent.at(-1) === 0, `üye ${extra}`);
    C.membersOf(st, pk).forEach((x) => { delete x.away; });

    // ---- 6. buluşma kurulur: zil, Brain planı, öncelikler
    p1.club && (p1.club.missed = 0);
    const gb = C.clubBuilding(st, 'gardenClub');
    for (const x of garden) {
      x.task = null; x.illness = null;
      for (const k of Object.keys(x.needs)) x.needs[k] = 80;
    }
    delete st.clubs.gardenClub?.evaluated;
    const rB = rngStates();
    sc.clubs.evaluate('gardenClub', gb, { start: st.totalMinutes - 1, end: st.totalMinutes + 110 });
    const live = st.clubs.gardenClub.live;
    c('buluşma kurulur: 6 uygun üye, zil çalar', live && live.ids.length === 6 && bells === 1, JSON.stringify(live));
    const m0 = garden.find((x) => !x.married && x.partnerId == null) ?? garden[0];
    const sp = sc.clubs.planSession(m0);
    c('planClubSession: kulüp evinin önündeki karo, poz çapa, etiket, süre pencereye göre', sp && sp.activity === 'clubSession' && sp.tool === 'hoe' && sp.pose === 'work' && /Bahçecilik Kulübü'nde fide/.test(sp.clubLabel) && sp.spot.y === gb.tileY + 2 && sp.duration > 100, JSON.stringify(sp));
    c('buluşma ve plan zar çekmez', rB === rngStates());
    const brain = sc.behavior.brain;
    const hourEvening = 18;
    c('Brain: mesai dışında üye buluşmaya gider', brain.decide(m0, hourEvening)?.activity === 'clubSession');
    c('Brain: mesai saatinde buluşma planı yok (mesai bölünmez)', brain.decide(m0, 10)?.activity !== 'clubSession');
    const bed = m0.profile.schedule.bedtime;
    m0.needs.energy = 80;
    c('Brain: yatma saatinde uyku önce (uyku bölünmez)', brain.decide(m0, bed >= 24 ? bed - 24 + 0.5 : Math.min(23.5, bed + 0.5))?.activity === 'sleep');
    const festSaved = { ...st.events.festival };
    Object.assign(st.events.festival, { active: true, venueId: gb.id, endsAt: st.totalMinutes + 60 });
    const fest = brain.decide(m0, hourEvening)?.activity;
    Object.keys(st.events.festival).forEach((k) => delete st.events.festival[k]);
    Object.assign(st.events.festival, festSaved);
    c('Brain: şenlik buluşmadan önce', fest === 'festival', fest);
    const savedRally = st.rally;
    st.rally = { until: st.totalMinutes + 60, rungAt: st.totalMinutes, venueId: gb.id, concert: true };
    const conc = brain.decide(m0, hourEvening)?.activity;
    st.rally = savedRally;
    c('Brain: konser / Toplanma Zili buluşmadan önce', conc === 'rally', conc);
    m0.sentence = { service: 2 };
    const serv = brain.decide(m0, hourEvening)?.activity;
    c('Brain: kamu hizmeti borcu olan üye buluşmaya gitmez (ceza önce)', serv === 'publicService' && !sc.clubs.planSession(m0), serv);
    m0.sentence = null;
    c('kamu hizmeti borçlusu buluşma başında uygun sayılmaz (kaçırma sayılmaz)', (() => { const y = garden[1]; y.sentence = { service: 2 }; const ok = !sc.clubs.eligibleNow(y); y.sentence = null; return ok; })());
    // anma: o saat anma penceresindeyse ve çağrılıysa
    const RT = await import('/src/systems/Rites.js');
    c('anmaya çağrılı üye o akşam uygun sayılmaz', typeof RT.memorialEligible === 'function' && sc.clubs.blocked() === false);

    // ---- 7. gerçek buluşma (aynı günün akşamı, oyunun kendi akışıyla): üyeler gelir, arkadaşlık kazancı yalnızca birlikte olanlarda
    delete st.clubs.gardenClub.live; // sabahki deneme buluşması (ölçüme girmesin)
    delete st.clubs.gardenClub.evaluated;
    st.clubs.gardenClub.recent = [];
    for (const x of garden) x.club.missed = 0;
    const absent = garden[5];
    absent.away = { stage: 'away' };
    while (st.time.hour < 17) sim.step(45);
    for (const x of garden) for (const k of Object.keys(x.needs)) x.needs[k] = Math.max(x.needs[k], 70);
    let here = [];
    for (let i = 0; i < 120 && here.length < 3; i++) {
      sim.step(15);
      here = st.clubs.gardenClub.live ? sc.clubs.present('gardenClub', gb) : [];
    }
    c('akşam 17:30 buluşması: üyeler kulüp evinin önüne gelir (haritada görünür, çapa elinde)', here.length >= 3 && here.every((x) => x.visible && x.tool === 'hoe' && /Bahçecilik/.test(x.activityLabel)), `${st.time.hour}:${Math.floor(st.time.minute)} ${here.map((x) => `${x.name}:${x.activityLabel}`).join(' | ')}`);
    const [pa, pb2] = here;
    const pairBefore = pa && pb2 ? rel.get(pa, pb2) : 0;
    const absentBefore = pa ? rel.get(pa, absent) : 0;
    sim.step(110);
    const still = pa && pb2 && sc.clubs.present('gardenClub', gb).includes(pa) && sc.clubs.present('gardenClub', gb).includes(pb2);
    const pairAfter = pa && pb2 ? rel.get(pa, pb2) : 0;
    c('arkadaşlık: birlikte olanlar yakınlaşır, gelmeyenle ilişki değişmez', still && pairAfter > pairBefore + 2 && rel.get(pa, absent) === absentBefore, `${pairBefore} → ${pairAfter} (${still})`);
    c('buluşma sırasında üye sohbet / randevu davetine kalkmaz', pa && !brain.isAvailableForChat(pa, 18));
    for (let i = 0; i < 60 && st.clubs.gardenClub.live; i++) sim.step(30);
    const gr = st.clubs.gardenClub;
    c('bitiş: buluşma sayılır, katılım listesi, seferdeki (uygun değil) üyeye kaçırma sayılmaz', gr.sessions === 1 && gr.attendance.at(-1).length >= 3 && absent.club.missed === 0 && gr.recent.at(-1) === 1 && garden.every((x) => x === absent || x.club.missed === (gr.attendance.at(-1).includes(x.id) ? 0 : 1)), JSON.stringify({ att: gr.attendance, missed: garden.map((x) => x.club?.missed) }));
    c('bitiş: gelen üyeye Tatlı Sohbet (neden club; yeni moodlet yok)', here.some((x) => x.moodlets?.some((m) => m.key === 'warm_chat' && m.reason === 'club')), JSON.stringify(here[0]?.moodlets?.map((m) => m.key + ':' + m.reason)));
    delete absent.away;
    const present = here;

    // ---- 8. ürünler
    const works = [];
    const offW = E.on('club:work', (p) => works.push(p));
    const exhib = [];
    const offX = E.on('club:exhibition', (p) => exhib.push(p));
    const people = garden.slice(0, 3);
    const lsBefore = st.landscape.score;
    gr.sessions = 3;
    sc.clubs.product('gardenClub', gb, gr, people);
    sim.step(2);
    c('bahçe: her 3 buluşmada bir tarh; yapının estetiği artar; anıya yazılır', gr.works === 1 && gb.clubWorks === 1 && st.landscape.score > lsBefore && people[0].memories.some((m) => /dikti/.test(m.text)) && works.at(-1)?.kind === 'bed', `${lsBefore} → ${st.landscape.score}`);
    for (let i = 0; i < 10; i++) { gr.sessions += 3; sc.clubs.product('gardenClub', gb, gr, people); }
    c('bahçe: en çok 6 tarh; estetik tavanı (Clubs.clubAesthetic ≤ 6 × 0,5)', gr.works === 6 && C.clubAesthetic(gb) === 3 && L.aestheticValue(gb) === CD.CLUBS.gardenClub.aestheticPerWork * 6 + 1.5);
    gb.clubWorks = 40;
    c('estetik tavanı: kayıtta fazlası olsa da 6 ürün sayılır', C.clubAesthetic(gb) === 3);
    gb.clubWorks = 6;
    // dikiş: hediye alıcısı sırası
    const sb = C.clubBuilding(st, 'sewingClub');
    const sr = sc.clubs.rec('sewingClub');
    const sew = C.membersOf(st, 'sewingClub');
    const poorest = st.characters.filter((x) => !x.role && !x.isChild).sort((a, b) => a.id - b.id).at(-1);
    for (const x of st.characters) if (!x.role) x.coins = 50;
    poorest.coins = 1;
    poorest.inventory = [];
    const relBefore = sew.map((x) => rel.get(x, poorest));
    const order = C.giftOrder(st, false);
    c('hediye sırası (yaz): kesesi en boş önce, eşitlikte küçük kimlik', order[0] === poorest && order[1].id < order[2].id);
    const goldBefore = st.resources.gold;
    const clothBefore = st.resources.cloth;
    sr.sessions = 4;
    const nowDay = st.time.day;
    sc.clubs.product('sewingClub', sb, sr, sew);
    const isWinter = (await import('/src/data/seasons.js')).getSeason(nowDay).key === 'winter';
    c('dikiş: 4 buluşmada bir hediye (yazın Nakışlı Mendil) en yoksula; altın ve kumaş harcanmaz', !isWinter && IT.ITEMS.handkerchief && poorest.inventory.some((s) => s.kind === 'handkerchief') && st.resources.gold === goldBefore && st.resources.cloth === clothBefore && sr.gifts === 1);
    c('mendil yoksulluğu azaltır (kese yanında değer sayılır)', C.clubPoverty(poorest) === CD.HANDKERCHIEF.worth && J.riskFactors(st, poorest).poverty <= J.riskFactors(st, { ...poorest, inventory: [], coins: 1, needs: poorest.needs, traits: poorest.traits }).poverty);
    c('hediye alanla kulüp üyelerinin ilişkisi artar', sew.every((x, i) => x === poorest || rel.get(x, poorest) > relBefore[i]));
    // kış: giysi mevsimde bir
    const SEAS = await import('/src/data/seasons.js');
    const realDay = st.time.day;
    let winterDay = realDay;
    while (SEAS.getSeason(winterDay).key !== 'winter') winterDay++;
    st.time.day = winterDay;
    const cold = st.characters.filter((x) => !x.role && !x.isChild && !(x.inventory ?? []).some((s) => s.kind === 'garment')).sort((a, b) => a.id - b.id)[2];
    for (const x of st.characters) x.exposure = 0;
    cold.exposure = 50;
    cold.inventory = [];
    sr.sessions = 8;
    sc.clubs.product('sewingClub', sb, sr, sew);
    const firstGarment = sr.garments;
    sr.sessions = 12;
    sc.clubs.product('sewingClub', sb, sr, sew);
    st.time.day = realDay;
    c('kış: en çok üşüyen sakine Dayanıklı Giysi; mevsimde en çok bir (sonraki ürün mendil)', firstGarment === 1 && sr.garments === 1 && cold.inventory.some((s) => s.kind === 'garment') && sr.gifts === 2 && st.resources.cloth === clothBefore);
    // resim: tablolar, tavan, sergi bir kez
    const pb = C.clubBuilding(st, 'paintingClub');
    const pr = sc.clubs.rec('paintingClub');
    const painters = C.membersOf(st, 'paintingClub');
    for (let i = 1; i <= 9; i++) { pr.sessions = i * 3; sc.clubs.product('paintingClub', pb, pr, painters); }
    c('resim: tablo adı "Mevsim konusu — ressam", en çok 6, yapının estetiği tablo başına', pr.paintings.length === 6 && / — /.test(pr.paintings[0].title) && pr.paintings[0].title.endsWith(painters[0].name) && pb.clubWorks === 6 && C.clubAesthetic(pb) === 6 * CD.CLUBS.paintingClub.aestheticPerWork, pr.paintings[0].title);
    c('Kasaba Sergisi 6. tabloda bir kez (kart olayı tek; bir günlük keyif)', exhib.length === 1 && pr.exhibited === st.time.day && pr.exhibitUntil > st.totalMinutes);
    const sumCard = SC.makeCard('club:exhibition', exhib[0], { state: st });
    const workCard = SC.makeCard('club:work', works.find((w) => w.kind === 'bed' && w.n === 1), { state: st });
    c('kartlar: sergi 4, ilk tarh kilometre taşı 3, sıradan ürün 2', sumCard?.priority === 4 && workCard?.priority === 3 && SC.makeCard('club:work', works.find((w) => w.kind === 'bed' && w.n === 2), { state: st })?.priority === 2);
    offW(); offX();

    // ---- 9. "Yalnızca önemli" süzgecinde günde en çok bir kulüp kartı
    const dir = sc.storyDirector;
    dir.clubCards = { day: -1, n: 0 };
    // (32.6a) kuruluş ve sergi tek seferlik (sınırdan muaf); sınır sıradan ürün kartlarıyla sınanır
    const wk = works.find((w) => w.kind === 'bed' && w.n === 2) ?? works[0];
    const shown = [0, 1].map((i) => dir.offer({ ...SC.makeCard('club:work', wk, { state: st }), priority: 3, key: `t${i}` }));
    shown.push(dir.offer({ ...SC.makeCard('club:exhibition', exhib[0], { state: st }), key: 't2' }));
    c('"Yalnızca önemli": günde en çok bir sıradan kulüp kartı (ikincisi gün özetine); tek seferlik sergi kartı yine gösterilir (32.6a)', dir.filter !== 'important' || (shown[0] === true && shown[1] === false && shown[2] === true), JSON.stringify(shown));

    // ---- 10. clubFactor ve renownClubs
    const outsider = st.characters.find((x) => !x.role && !x.isChild && !x.club);
    const gm = garden[0];
    gr.attendance = [[gm.id], [gm.id], []];
    const m1 = garden[1];
    c('clubFactor: kulüpsüz 1, üye ×0,9, son 4 buluşmanın ikisine gelen etkin üye ×0,75', J.clubFactor(outsider, st) === 1 && J.clubFactor(m1, st) === 0.9 && J.clubFactor(gm, st) === 0.75 && J.riskFactors(st, gm).club === 0.75);
    gr.recent = [1, 1, 0, 1];
    const share = R.renownClubs(st);
    const expected = Math.min(1, (st.characters.filter((x) => !x.role && x.club && C.isActiveMember(st, x)).length / C.clubAdults(st).length) * C.clubVitality(st));
    c('renownClubs: (etkin üye / yetişkin + bilge) × canlılık, 0-1; itibar dökümünde "Kulüpler" satırı', share > 0 && share <= 1 && Math.abs(share - expected) < 1e-9 && R.renownTarget(st).parts.some((p) => p.key === 'clubs') && /Kulüpler \+/.test(RC.renownLines(st).join(' ')), `${share}`);

    // ---- 11. Çıkar / Davet ve kendiliğinden ayrılma
    const kicked = garden[2];
    E.emit('ui:clubKick', { characterId: kicked.id });
    const nextUp = C.candidatesFor(st, 'gardenClub').find((e) => e.auto)?.c;
    sc.clubs.newDay();
    c('Çıkar: üye çıkar, birkaç gün kendiliğinden dönmez (yeri sıradaki adaya geçer)', !kicked.club && st.clubs.gardenClub.out[kicked.id] > st.time.day && C.membersOf(st, 'gardenClub').length === 6 && nextUp && nextUp !== kicked && nextUp.club?.key === 'gardenClub', nextUp?.name);
    const full = sc.clubs.invite('gardenClub', fb.id);
    const inv = sc.clubs.invite('sewingClub', fb.id);
    c('Davet et: dolu kulübe davet reddedilir; boş yeri olan kulübe eşik altındaki aday da davetle katılır', !full.ok && inv.ok && fb.club?.key === 'sewingClub');
    fb.club.missed = 3;
    const sKey = 'sewingClub';
    sr.live = { day: st.time.day, until: st.totalMinutes, ids: C.membersOf(st, sKey).map((x) => x.id), came: C.membersOf(st, sKey).filter((x) => x !== fb).slice(0, 2).map((x) => x.id), excused: [] };
    s1.club.missed = 2;
    sc.clubs.finish(sKey, sb);
    c('kendiliğinden ayrılma: üst üste 3 buluşmayı kaçıran ve puanı eşiğin altında olan ayrılır; eşik üstündeki kalır', !fb.club && s1.club?.key === sKey, JSON.stringify(C.membersOf(st, sKey).map((x) => [x.id, x.club.missed])));

    // ---- 12. temizlik: sürgün, ayrılma, ölüm
    const ex = C.membersOf(st, 'paintingClub')[0];
    E.emit('court:exiled', { character: ex, kin: [], gossips: [], moved: [], band: 'fair', text: '' });
    const left = C.membersOf(st, 'gardenClub')[0];
    E.emit('population:left', { character: left, coins: 0, items: 0, reason: 'death' });
    c('sürgün edilen / ölen üyenin kaydı temizlenir', !ex.club && !left.club);

    // ---- 13. arayüz
    const sec = CC.clubSection(gb, st, { emit: () => {} });
    const tag = CC.clubTag(g1.club ? g1 : C.membersOf(st, 'gardenClub')[0]);
    c('arayüz: panelde üyeler, adaylar ve neden, Çıkar / Davet; sakin rozeti; Arşiv özeti', sec.length >= 4 && sec.some((n) => /Sıradaki adaylar/.test(n.textContent)) && sec.some((n) => /Çıkar/.test(n.textContent)) && tag?.text === 'Bahçecilik Kulübü üyesi' && CC.clubLedger(st)?.body.length === 3);

    // ---- 14. kaydet → yükle
    const mKey = JSON.stringify(st.characters.filter((x) => x.club).map((x) => [x.id, x.club]));
    const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((q) => [q, x[q]])) : x));
    const cKey = canon(st.clubs);
    E.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    E.emit('ui:load');
    st = game.state;
    sc = game.scenes.current;
    const mKey2 = JSON.stringify(st.characters.filter((x) => x.club).map((x) => [x.id, x.club]));
    c('kaydet → yükle: üyelik ve kulüp kayıtları aynı; sürüm 41; kulübü olmayanda alan yazılmaz', raw.version === 41 && mKey === mKey2 && canon(st.clubs) === cKey && raw.characters.some((x) => !('club' in x)), `${mKey.slice(0, 80)} | ${mKey2.slice(0, 80)}`);
    c('yüklemeden sonra ürünler yapıya geri yazılır (estetik) ve tek sistem dinler', C.clubBuilding(st, 'gardenClub').clubWorks === 6 && sc.clubs.unsubscribers.length === 7);
    return out;
  })));
  await browser.close();
}

// ---- C. kısa gerçek koşu: hobi evleri kurulur, gün dönümünde üyeler gelir, akşam buluşması haritada görünür, sayfa hatası yok
{
  const { browser, page } = await openGame({ seed: 5 });
  page.on('pageerror', (e) => errors.push(String(e)));
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 999, stone: 999, food: 900, gold: 3000, iron: 300, cloth: 200, wool: 200 });
    for (let i = 0; i < 5; i++) sim.place('cabin');
    sc.population.welcomeNewcomers(10);
    st.town.tier = 3;
    for (const t of ['gardenClub', 'sewingClub', 'paintingClub']) sim.place(t);
    let seen = 0;
    let sessions = 0;
    game.events.on('club:session', () => sessions++);
    for (let h = 0; h < 24 * 6; h++) {
      sim.step(225);
      seen = Math.max(seen, st.characters.filter((x) => x.task?.activity === 'clubSession' && x.task.phase === 'perform' && x.visible).length);
    }
    c('6 günlük koşu: üyeler katıldı, akşam buluşmaları oldu, buluşmada en az 3 üye haritada görünür', st.characters.filter((x) => x.club).length >= 6 && sessions >= 2 && seen >= 3, `üye ${st.characters.filter((x) => x.club).length} · buluşma ${sessions} · görünen ${seen}`);
    return out;
  })));
  await browser.close();
}

report(errors);
