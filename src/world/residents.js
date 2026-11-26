// Başlangıç sakinlerini oluşturur: rastgele kadro (Residents.js) 6 kişi üretir, kulübelere
// dağıtır (gerekirse paylaşırlar) ve uyku saatindeyse evlerinde uyur hâlde başlatır.
import { Character } from '../entities/Character.js';
import { NEED_KEYS } from '../data/characters.js';
import { makeStartingCast, unavailableNames } from '../systems/Residents.js';
import { ACTIVITIES } from '../data/activities.js';
import { isBedtime } from '../ai/TraitProfile.js';

// Başlangıç ihtiyaç aralıkları; uyuyanlar dinlenmiş başlar ki sabah kısa sürede uyansınlar
const START_NEEDS = {
  hunger: [55, 90],
  energy: [88, 99],
  social: [40, 85],
  fun: [50, 90],
};

/**
 * @param {import('./World.js').World} world
 * @param {import('../utils/random.js').Random} rng
 * @param {number} hour başlangıç saati
 * @returns {Character[]}
 */
export function createStartingResidents(world, rng, hour) {
  const homes = world.getBuildingsOfType('cabin');
  // (33.1) Her yeni oyunda rastgele kadro (ad, görünüş, kişilik; güvenlik kuralları data/cast.js); %25 olasılıkla biri tanıdık yüzlerden
  const picked = makeStartingCast(rng, { taken: unavailableNames(world.state) });

  return picked.map((def, i) => {
    const home = homes.length > 0 ? homes[i % homes.length] : null;
    const needs = Object.fromEntries(NEED_KEYS.map((k) => [k, rng.int(START_NEEDS[k][0], START_NEEDS[k][1])]));
    const character = new Character({
      name: def.name,
      age: def.age,
      traits: def.traits,
      appearance: def.appearance,
      needs,
      homeId: home?.id ?? null,
    });

    if (home && isBedtime(character.profile, hour)) {
      const entrance = home.entrancePoint;
      character.x = entrance.x;
      character.y = entrance.y;
      character.visible = false;
      character.pose = 'hidden';
      character.insideBuildingId = home.id;
      home.occupants.add(character.id);
      character.task = { activity: 'sleep', buildingId: home.id, phase: 'perform', elapsed: 0 };
      character.activityLabel = ACTIVITIES.sleep.label;
    } else {
      const doors = home ? world.getSpots(home) : [];
      const spot = doors.length > 0 ? doors[i % doors.length] : rng.pick(world.strollSpots);
      const point = world.standPoint(spot.x, spot.y);
      character.x = point.x;
      character.y = point.y;
    }
    return character;
  });
}
