// Eski kayıt sürümlerinin (2-6) fikstürlerini üretir. Bu sürümleri yazan kod (4.-8. aşama) depo geçmişinde yoktur;
// bu yüzden kayıtlar bugünkü oyunun o sürümlerin biçimine "indirgenmesiyle" sentezlenir: README'deki sürüm tarihçesine göre
// sonradan eklenen bütün alanlar silinir, eski haritalar (sürüm 2-5) 48x48 ve biyomsuz üretilir, kaldırılan yapı türü
// (Sokak Lambası, 'lamp') geri konur, ilişki puanları eksiye inmez (eksi puan 9. aşamada geldi).
//
//   sürüm 2 (4. aşama): temel kayıt (tohum, zaman, Odun / Taş / Yiyecek, işler, hava, ilişkiler, günlük, sakinler, yapılar, harita farkları)
//   sürüm 3 (5. aşama): + kasaba bonusları, şenlik ve tüccar (events), handaki yemek, sıcak yemek bonusu
//   sürüm 4 (6. aşama): + ısınma, meslek deneyimi, "İçi Isındı", mevsim
//   sürüm 5 (7. aşama): + kasaba adı, hedefler ve sayaçlar
//   sürüm 6 (8. aşama): + harita boyutu ve üretici (80x80, biyomlu), yapı seviyesi, harabe durumu, süren proje
//
// Kullanım: node tools/sim/legacy-fixtures.mjs   (fixtures/save-v2..v6.json dosyalarını yeniden yazar)
import fs from 'fs';
import { openGame } from './lib.mjs';

const CHAR_FIELDS = {
  2: ['id', 'x', 'y', 'name', 'age', 'traits', 'appearance', 'needs', 'homeId', 'facing', 'insideBuildingId', 'carrying', 'newcomer', 'sitting', 'activityLabel'],
  3: ['buffs'],
  4: ['skills'],
};
const BUILDING_FIELDS = {
  2: ['id', 'x', 'y', 'type', 'tileX', 'tileY', 'tone', 'berries', 'underConstruction', 'buildProgress', 'orientation', 'regrowProgress', 'producedToday'],
  3: ['meals'],
  6: ['level', 'condition', 'project'],
};
const TOP_FIELDS = {
  2: ['seed', 'time', 'resources', 'jobs', 'nextJobId', 'regrowth', 'weather', 'relationships', 'journal', 'characters', 'buildings', 'terrain'],
  3: ['buffs', 'events'],
  4: ['heating', 'season'],
  5: ['townName', 'milestones', 'stats'],
  6: ['map'],
};
const upTo = (table, version) => Object.entries(table).filter(([v]) => Number(v) <= version).flatMap(([, f]) => f);
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

function downgrade(save, version) {
  const out = pick(save, upTo(TOP_FIELDS, version));
  out.version = version;
  out.savedAt = 0;
  out.resources = pick(save.resources, ['wood', 'stone', 'food']);
  out.time = pick(save.time, ['day', 'hour', 'minute', 'paused', 'speed']);
  out.jobs = save.jobs.filter((j) => ['build', 'chop', 'mine', 'forage'].includes(j.type)).map(({ urgent, project, ...j }) => j);
  out.weather = pick(save.weather, ['type', 'cloud', 'rain', 'changes', 'nextChangeAt']);
  if (!['sunny', 'cloudy', 'rainy'].includes(out.weather.type)) out.weather.type = 'cloudy';
  out.relationships = Object.fromEntries(Object.entries(save.relationships).map(([k, v]) => [k, Math.max(0, v)]));
  out.journal = save.journal.slice(-40).map(({ icon, ...e }) => (version >= 3 ? { icon, ...e } : e));
  if (out.events) {
    out.events = {
      festival: pick(save.events.festival, ['active', 'venueId', 'lastDay', 'endsAt']),
      merchant: { ...save.events.merchant, present: false, leaving: false },
      immigration: save.events.immigration,
    };
    delete out.events.merchant.tier;
  }
  if (out.buffs) out.buffs = pick(save.buffs, ['tools', 'feast', 'festival']);
  if (out.stats) out.stats = pick(save.stats, ['buildingsCompleted', 'mealsCooked', 'trades', 'wintersSurvived', 'cobbles', 'winter']);
  if (out.heating) out.heating = pick(save.heating, ['buffer', 'cold', 'lastNoticeDay']);
  const charKeys = upTo(CHAR_FIELDS, version);
  out.characters = save.characters.map((c) => {
    const o = pick(c, charKeys);
    if (o.buffs) o.buffs = pick(c.buffs, version >= 4 ? ['warmMeal', 'warmUntil'] : ['warmMeal']);
    return o;
  });
  const buildingKeys = upTo(BUILDING_FIELDS, version);
  // Han, pazar ve lamba 5. aşamada geldi: 4. aşamanın kaydında yoktur
  const later = version < 3 ? new Set(['inn', 'market', 'lantern']) : new Set();
  out.buildings = save.buildings.filter((b) => !later.has(b.type)).map((b) => {
    const o = pick(b, buildingKeys);
    if (version >= 3 && b.type === 'lantern') o.type = 'lamp'; // 5.-8. aşamanın Sokak Lambası
    return o;
  });
  return out;
}

/** Bir kasaba kurar, birkaç gün yaşatır ve bugünkü biçimde anlık kaydını döndürür. */
async function growTown(page, { legacyMap }) {
  return page.evaluate(
    async ({ legacyMap }) => {
      const game = window.game;
      const sim = window.sim;
      if (legacyMap) {
        game.state.map = { width: 48, height: 48, generator: 1 };
        game.scenes.switchTo('town');
        game.loop.stop();
      }
      sim.give({ wood: 300, stone: 200, food: 150 });
      const types = legacyMap ? ['storage', 'lumberHut', 'garden', 'cabin', 'quarry', 'inn', 'market', 'lantern', 'lantern'] : ['storage', 'lumberHut', 'garden', 'cabin', 'quarry', 'inn', 'lantern'];
      for (const t of types) sim.place(t, { maxRadius: 20 });
      const scene = game.scenes.current;
      sim.place('cabin', { instant: false }); // yarım kalan şantiye
      for (let d = 0; d < 5; d++) {
        sim.give({ wood: Math.max(game.state.resources.wood, 80), food: Math.max(game.state.resources.food, 60) });
        sim.step(225 * 24);
      }
      // Ağaç kes: harita farkları (kütük) kayda girsin
      const plaza = scene.world.landmarks.plaza;
      const map = scene.world.map;
      let made = 0;
      for (let r = 2; r < 18 && made < 4; r++) {
        for (let dy = -r; dy <= r && made < 4; dy++) {
          for (let dx = -r; dx <= r && made < 4; dx++) {
            const x = plaza.centerX + dx;
            const y = plaza.centerY + dy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !['oak', 'pine'].includes(map.getObject(x, y))) continue;
            if (scene.world.getApproachSpots(x, y).length && scene.jobs.designate(x, y)) made++;
          }
        }
      }
      while (game.state.time.hour < 9 || game.state.time.hour > 13) sim.step(225);
      sim.step(225 * 4);
      if (!legacyMap) {
        // 8. aşama: yarım kalmış bir yükseltme kayda girsin
        sim.give({ wood: 300, stone: 200 });
        const cabin = game.state.buildings.find((b) => b.type === 'cabin' && b.functional && !b.upgraded && !b.project);
        if (cabin) scene.construction.startProject(cabin);
        sim.step(100);
      }
      return JSON.parse(JSON.stringify(scene.saves.snapshot()));
    },
    { legacyMap }
  );
}

const fixtures = new URL('./fixtures/', import.meta.url);
{
  const { browser, page, errors } = await openGame({ seed: 4 });
  const save = await growTown(page, { legacyMap: true });
  for (const v of [2, 3, 4, 5]) {
    const data = downgrade(save, v);
    fs.writeFileSync(new URL(`save-v${v}.json`, fixtures), JSON.stringify(data));
    console.log(`save-v${v}.json: gün ${data.time.day}, ${data.characters.length} sakin, ${data.buildings.length} yapı, ${data.terrain.length} karo farkı`);
  }
  if (errors.length) console.log(errors.join('\n'));
  await browser.close();
}
{
  const { browser, page, errors } = await openGame({ seed: 6 });
  const save = await growTown(page, { legacyMap: false });
  const data = downgrade(save, 6);
  fs.writeFileSync(new URL('save-v6.json', fixtures), JSON.stringify(data));
  console.log(`save-v6.json: gün ${data.time.day}, ${data.characters.length} sakin, ${data.buildings.length} yapı, proje ${data.buildings.filter((b) => b.project).length}`);
  if (errors.length) console.log(errors.join('\n'));
  await browser.close();
}
