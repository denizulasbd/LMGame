// Yaşayan doğa ve kasaba hayvanları (11. aşama). Kurallar src/data/animals.js'te.
//
//   Yaban hayatı : ilk açılışta (ya da hayvansız eski bir kayıt yüklenince) haritanın sakin köşelerine tavşanlar ve
//                  geyikler yerleştirilir (tohumdan, hep aynı yerlere). Yuvalarının çevresinde dolaşır, otlar;
//                  bir sakin yaklaşınca ürküp ondan uzağa kaçar. Gece tavşan yuvasına girer, geyik yatar. Yuvası
//                  yapılarla kaplanırsa yeni bir yuva arar.
//   Kasaba hayvanı: kasaba büyüdükçe (Köy, Kasaba, Gelişmiş Şehir; han ya da belediye kurulunca da) sabah
//                  09:00'da harita kenarından bir kedi ya da köpek gelir ('pet:arrived'). Meydanda ve evlerin
//                  önünde dolaşır, oturur; köpek ara sıra bir sakinin peşine takılır. Gece, yağmurda ve kışın
//                  yanan kamp ateşinin başına, hanın ya da bir evin saçağının altına kıvrılıp uyur.
//   Sevme       : yanından geçen sakin onu sever: sakinin başında kalp balonu, hayvanın başında küçük kalp,
//                  sakine anlık keyif (çocuklara daha çok). Aynı sakin bir süre yeniden sevmez.
import { CHEER_TIME } from '../entities/Animal.js';
import { WILDLIFE, PETS } from '../data/animals.js';
import { getSeason } from '../data/seasons.js';
import { isRainActive } from '../data/weather.js';
import { Animal } from '../entities/Animal.js';
import { Random } from '../utils/random.js';
import { isWithinHours } from './StructureSystem.js';
import { townTier } from './TownStatus.js';
import { clamp } from '../utils/math.js';

const T = 16;
const PET_NIGHT = { from: 21.5, to: 6.5 };
const PLAZA_ROAM_TILES = 11; // kasaba hayvanları meydana bu kadar karo yakın dolaşır

export class AnimalSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.unsubscribers = [
      game.events.on('time:hour', (hour) => {
        if (hour === PETS.arrivalHour) this.petArrival();
      }),
      game.events.on('ui:petAnimal', ({ id }) => this.cheer(id)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get animals() {
    return this.state.animals;
  }

  /**
   * (14. aşama) Oyuncu bir kediye ya da köpeğe fareyle tıklayınca: sevinçle zıplar, kalpler uçuşur, miyavlar / havlar
   * ('pet:cheered' { animal }). Uyuyorsa uyanır.
   */
  cheer(id) {
    const a = this.animals.find((x) => x.id === id && x.isPet);
    if (!a) return null;
    a.cheer = CHEER_TIME;
    if (a.mode === 'sleep' || a.pose === 'sleep') {
      a.mode = 'idle';
      a.pose = 'sit';
      a.timer = 2;
    }
    this.state.stats.cheered = (this.state.stats.cheered ?? 0) + 1;
    this.events.emit('pet:cheered', { animal: a });
    return a;
  }

  update(tick) {
    if (!this.state.animalMeta.wildlifeSeeded) this.seedWildlife();
    for (const a of this.animals) if (a.cheer > 0) a.cheer = Math.max(0, a.cheer - tick.realDt); // oyun dursa da zıplar
    const dt = tick.simDt;
    if (dt <= 0) return;
    const season = getSeason(this.state.time.day).key;
    const raining = isRainActive(this.state.weather);
    for (const a of this.animals) {
      a.anim += dt;
      a.heart = Math.max(0, a.heart - dt);
      if (a.isPet) this.updatePet(a, dt, tick.hour, season, raining);
      else this.updateWild(a, dt, tick.hour);
    }
    if (tick.gameMinutes > 0) this.petting(tick.gameMinutes);
  }

  // ---------------------------------------------------------------------------
  // Yaban hayatı
  // ---------------------------------------------------------------------------

  /** Tavşan ve geyikleri haritanın sakin köşelerine yerleştirir (tohumdan, hep aynı). */
  seedWildlife() {
    this.state.animalMeta.wildlifeSeeded = true;
    const rng = new Random(this.state.seed + 11);
    const map = this.world.map;
    const scale = (map.width * map.height) / (80 * 80);
    for (const [kind, def] of Object.entries(WILDLIFE)) {
      const count = Math.max(1, Math.round(def.count * scale));
      const homes = [];
      for (let i = 0; i < count; i++) {
        const home = this.findHome(def, rng, homes);
        if (!home) break;
        homes.push(home);
        const p = this.world.standPoint(home.x, home.y);
        const animal = new Animal({ kind, x: p.x, y: p.y, homeX: home.x, homeY: home.y, variant: kind === 'deer' ? i % 2 : rng.int(0, 1) });
        animal.facing = rng.next() < 0.5 ? 'left' : 'right';
        animal.timer = rng.next() * 4;
        this.animals.push(animal);
      }
    }
  }

  /** Kasabadan uzak, uygun zeminde, boş ve diğer yuvalardan uzak bir yuva karosu. */
  findHome(def, rng, taken = [], near = null) {
    const map = this.world.map;
    const plaza = this.world.landmarks.plaza;
    for (let attempt = 0; attempt < 400; attempt++) {
      const x = near ? near.x + rng.int(-10, 10) : rng.int(2, map.width - 3);
      const y = near ? near.y + rng.int(-10, 10) : rng.int(2, map.height - 3);
      if (!map.inBounds(x, y) || !def.tiles.includes(map.get(x, y)) || !map.isWalkable(x, y) || map.getObject(x, y)) continue;
      if (Math.hypot(x - plaza.centerX, y - plaza.centerY) < def.minTownDistance) continue;
      if (taken.some((h) => Math.hypot(h.x - x, h.y - y) < 6)) continue;
      return { x, y };
    }
    return null;
  }

  updateWild(a, dt, hour) {
    const def = WILDLIFE[a.kind];
    const map = this.world.map;
    // Yuvası yapı ya da yolla kaplandıysa yakında yeni bir yuva arar
    if (!map.isWalkable(a.homeX, a.homeY) || map.getOccupant(a.homeX, a.homeY)) {
      const home = this.findHome(def, this.rng, [], { x: a.homeX, y: a.homeY }) ?? this.findHome(def, this.rng);
      if (home) {
        a.homeX = home.x;
        a.homeY = home.y;
      }
    }
    const threat = this.nearestPerson(a, def.fleeRadius);
    if (threat) {
      // Ürküp kaçar: sakinin tersine, yürünebilir bir yöne
      if (a.mode !== 'flee' || !a.target) a.target = this.fleeTarget(a, threat, def.fleeRadius * 1.4);
      a.mode = 'flee';
      a.visible = true;
      a.pose = 'walk';
      if (!a.target || this.moveStraight(a, a.target, def.fleeSpeed * dt)) a.target = null;
      return;
    }
    if (a.mode === 'flee') {
      a.mode = 'idle';
      a.timer = 1 + this.rng.next() * 2;
    }
    const home = this.world.standPoint(a.homeX, a.homeY);
    if (isWithinHours(hour, def.restHours)) {
      // Gece: yuvasına döner; tavşan içine girer (görünmez), geyik yatar
      if (Math.hypot(home.x - a.x, home.y - a.y) > 2) {
        a.pose = 'walk';
        a.visible = true;
        if (!this.moveStraight(a, home, def.speed * dt)) return;
      }
      a.mode = 'rest';
      a.pose = 'sleep';
      if (a.kind === 'rabbit') a.visible = false;
      return;
    }
    if (a.mode === 'rest') {
      a.mode = 'idle';
      a.visible = true;
      a.timer = this.rng.next() * 3;
    }
    if (a.mode === 'wander' && a.target) {
      a.pose = 'walk';
      if (this.moveStraight(a, a.target, def.speed * dt)) {
        a.mode = 'idle';
        a.target = null;
        a.timer = 2 + this.rng.next() * 6;
        a.pose = this.rng.next() < 0.65 ? 'eat' : 'sit';
      }
      return;
    }
    a.timer -= dt;
    if (a.timer > 0) return;
    // Yuvasının çevresinde rastgele bir yere
    for (let attempt = 0; attempt < 6; attempt++) {
      const tx = a.homeX + this.rng.int(-def.homeRadius, def.homeRadius);
      const ty = a.homeY + this.rng.int(-def.homeRadius, def.homeRadius);
      if (!map.isWalkable(tx, ty) || map.getOccupant(tx, ty)) continue;
      a.target = { x: tx * T + 4 + this.rng.next() * 8, y: ty * T + 8 + this.rng.next() * 6 };
      a.mode = 'wander';
      return;
    }
    a.timer = 1;
  }

  /** En yakın görünür sakin (radius içinde) ya da null. */
  nearestPerson(a, radius) {
    let best = null;
    let bestD = radius;
    for (const c of this.world.characters) {
      if (!c.visible) continue;
      const d = Math.hypot(c.x - a.x, c.y - a.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  /** Sakinden uzağa, yürünebilir bir kaçış noktası (birkaç açı denenir). */
  fleeTarget(a, threat, distance) {
    const base = Math.atan2(a.y - threat.y, a.x - threat.x);
    for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5]) {
      const angle = base + turn;
      const x = a.x + Math.cos(angle) * distance;
      const y = a.y + Math.sin(angle) * distance;
      if (this.pathClear(a.x, a.y, x, y)) return { x, y };
    }
    return null;
  }

  /** İki nokta arasındaki karolar yürünebilir mi (düz çizgide yarım karo adımlarla)? */
  pathClear(x0, y0, x1, y1) {
    const map = this.world.map;
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8);
    for (let i = 1; i <= steps; i++) {
      const x = Math.floor((x0 + ((x1 - x0) * i) / steps) / T);
      const y = Math.floor((y0 + ((y1 - y0) * i) / steps) / T);
      if (!map.isWalkable(x, y)) return false;
    }
    return true;
  }

  /** Hedefe düz yürür; vardıysa true. Önü kapanırsa durur (true döner, yeni hedef seçilir). */
  moveStraight(a, target, step) {
    const dx = target.x - a.x;
    const dy = target.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d <= Math.max(0.5, step)) {
      if (this.world.map.isWalkable(Math.floor(target.x / T), Math.floor(target.y / T))) {
        a.x = target.x;
        a.y = target.y;
      }
      return true;
    }
    const nx = a.x + (dx / d) * step;
    const ny = a.y + (dy / d) * step;
    if (Math.abs(dx) > 0.3) a.facing = dx < 0 ? 'left' : 'right';
    if (!this.world.map.isWalkable(Math.floor(nx / T), Math.floor(ny / T))) return true;
    a.x = nx;
    a.y = ny;
    return false;
  }

  // ---------------------------------------------------------------------------
  // Kasaba hayvanları
  // ---------------------------------------------------------------------------

  /** Kasabanın şu an barındırabileceği kedi / köpek sayısı. */
  petTarget() {
    let tier = townTier(this.state).tier;
    if (tier < 2 && this.world.getCompleted().some((b) => PETS.unlockBuildings.includes(b.type))) tier = 2;
    return PETS.schedule[tier] ?? PETS.schedule[1];
  }

  /** Sabah: hedef sayıya ulaşılmadıysa harita kenarından bir kedi ya da köpek gelir (günde en çok bir). */
  petArrival() {
    const meta = this.state.animalMeta;
    if (meta.lastPetDay === this.state.time.day) return;
    const target = this.petTarget();
    const count = (kind) => this.animals.filter((a) => a.kind === kind).length;
    const kind = ['cat', 'dog'].find((k) => count(k) < target[k]);
    if (!kind) return;
    const entry = this.world.findEntryTile(this.rng);
    if (!entry) return;
    meta.lastPetDay = this.state.time.day;
    const def = PETS[kind];
    const taken = new Set(this.animals.map((a) => a.name));
    const name = def.names.find((n) => !taken.has(n)) ?? `${def.name} ${count(kind) + 1}`;
    const p = this.world.standPoint(entry.x, entry.y);
    const pet = new Animal({ kind, x: p.x, y: p.y, name, variant: count(kind) % def.variants });
    this.animals.push(pet);
    const plaza = this.world.landmarks.plaza;
    this.walkPetTo(pet, this.nearestWalkable(plaza.centerX, plaza.centerY + 2) ?? entry);
    pet.mode = 'arrive';
    this.events.emit('pet:arrived', { animal: pet });
    this.events.emit('toast', { text: `Kasabaya bir ${def.name.toLocaleLowerCase('tr')} geldi: ${name}! Sakinler onu sevmeye bayılacak.`, tone: 'success', icon: 'paw' });
  }

  nearestWalkable(x, y) {
    for (let r = 0; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (this.world.map.isWalkable(x + dx, y + dy) && this.world.isReachable(x + dx, y + dy)) return { x: x + dx, y: y + dy };
        }
      }
    }
    return null;
  }

  /** Kasaba hayvanını yol bularak bir karoya yürütür (yol yoksa false). */
  walkPetTo(a, tile) {
    const path = this.world.findPath({ x: a.tileX, y: a.tileY }, tile);
    if (!path) return false;
    const points = path.slice(1).map((s) => {
      const p = this.world.standPoint(s.x, s.y);
      return { x: p.x + (this.rng.next() - 0.5) * 6, y: p.y };
    });
    a.waypoints = points.length ? points : null;
    a.waypointIndex = 0;
    return true;
  }

  /** Yol noktalarında yürür; bittiyse true. */
  followPath(a, step) {
    if (!a.waypoints) return true;
    let budget = step;
    while (budget > 0 && a.waypoints) {
      const t = a.waypoints[a.waypointIndex];
      const dx = t.x - a.x;
      const dy = t.y - a.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.3) a.facing = dx < 0 ? 'left' : 'right';
      if (d <= budget) {
        a.x = t.x;
        a.y = t.y;
        budget -= d;
        a.waypointIndex++;
        if (a.waypointIndex >= a.waypoints.length) a.clearPath();
      } else {
        a.x += (dx / d) * budget;
        a.y += (dy / d) * budget;
        budget = 0;
      }
    }
    return !a.waypoints;
  }

  /** Uyku yeri: yanan kamp ateşinin başı, hanın önü ya da en yakın evin saçağı. */
  shelterTile(a) {
    const near = (spots) => spots.reduce((best, s) => (!best || Math.hypot(s.x - a.tileX, s.y - a.tileY) < Math.hypot(best.x - a.tileX, best.y - a.tileY) ? s : best), null);
    const fire = this.world.getCompleted('campfire').find((b) => b.lit);
    if (fire) {
      const spot = near(this.world.getSpots(fire));
      if (spot) return spot;
    }
    const inn = this.world.getCompleted('inn')[0];
    if (inn) {
      const spot = near(this.world.getGatherSpots(inn));
      if (spot) return spot;
    }
    const homes = this.world.getCompleted('cabin').flatMap((b) => this.world.getSpots(b));
    return near(homes);
  }

  updatePet(a, dt, hour, season, raining) {
    const speed = PETS[a.kind].speed;
    const night = isWithinHours(hour, PET_NIGHT);
    const wantsShelter = night || raining || (season === 'winter' && a.mode === 'sleep');
    // Gelişte: önce meydana yürür
    if (a.mode === 'arrive') {
      a.pose = 'walk';
      if (this.followPath(a, speed * dt)) {
        a.mode = 'idle';
        a.timer = 2;
        a.pose = 'sit';
      }
      return;
    }
    if (wantsShelter && a.mode !== 'sleep' && a.mode !== 'toShelter') {
      const tile = this.shelterTile(a);
      if (tile && this.walkPetTo(a, tile)) a.mode = 'toShelter';
    }
    if (a.mode === 'toShelter') {
      a.pose = 'walk';
      if (this.followPath(a, speed * dt)) {
        a.mode = 'sleep';
        a.pose = 'sleep';
        a.timer = 30 + this.rng.next() * 60;
      }
      return;
    }
    if (a.mode === 'sleep') {
      a.pose = 'sleep';
      a.timer -= dt;
      if (wantsShelter && (night || raining)) return;
      if (a.timer > 0) return; // kışın gündüz de bir süre kestirir
      a.mode = 'idle';
      a.timer = 1;
      a.pose = 'sit';
      return;
    }
    if (a.mode === 'follow') {
      const c = this.world.getCharacter(a.followId);
      a.timer -= dt;
      if (!c || !c.visible || a.timer <= 0) {
        a.mode = 'idle';
        a.timer = 2 + this.rng.next() * 3;
        a.pose = 'sit';
        return;
      }
      const side = c.facing === 'left' ? 9 : -9;
      const target = { x: c.x + side, y: c.y + 2 };
      if (Math.hypot(target.x - a.x, target.y - a.y) < 4) {
        a.pose = 'sit';
        a.facing = c.x < a.x ? 'left' : 'right';
      } else {
        a.pose = 'walk';
        this.moveStraight(a, target, speed * 1.1 * dt);
      }
      return;
    }
    if (a.mode === 'wander') {
      a.pose = 'walk';
      if (this.followPath(a, speed * dt)) {
        a.mode = 'idle';
        a.timer = 3 + this.rng.next() * 6;
        a.pose = 'sit';
      }
      return;
    }
    a.timer -= dt;
    if (a.timer > 0) return;
    this.choosePetAction(a, season);
  }

  /** Boşta kalan kasaba hayvanının sıradaki işi: dolaşmak, kestirmek, (köpek) bir sakinin peşine takılmak. */
  choosePetAction(a, season) {
    const roll = this.rng.next();
    const nap = a.kind === 'cat' ? 0.3 : 0.12;
    if (roll < (season === 'winter' ? nap + 0.3 : nap)) {
      const tile = this.shelterTile(a);
      if (tile && this.walkPetTo(a, tile)) {
        a.mode = 'toShelter';
        return;
      }
    }
    if (a.kind === 'dog' && roll < 0.45) {
      const person = this.nearestPerson(a, 8 * T);
      if (person) {
        a.mode = 'follow';
        a.followId = person.id;
        a.timer = 6 + this.rng.next() * 8;
        return;
      }
    }
    // Meydanda ya da bir evin önünde rastgele bir yer
    const plaza = this.world.landmarks.plaza;
    const spots = this.world.strollSpots.filter((s) => Math.hypot(s.x - plaza.centerX, s.y - plaza.centerY) <= PLAZA_ROAM_TILES);
    const doors = this.world.getCompleted('cabin').flatMap((b) => this.world.getSpots(b));
    const pool = this.rng.next() < 0.7 ? spots : doors;
    const tile = pool.length ? this.rng.pick(pool) : null;
    if (tile && this.walkPetTo(a, tile)) {
      a.mode = 'wander';
      return;
    }
    a.timer = 2 + this.rng.next() * 3;
  }

  /** Yanından geçen sakinler kedileri ve köpekleri sever: kalp ve anlık keyif. */
  petting(minutes) {
    const now = this.state.totalMinutes;
    const pets = this.animals.filter((a) => a.isPet && a.visible && a.mode !== 'arrive');
    if (pets.length === 0) return;
    for (const c of this.world.characters) {
      if (!c.visible || (c.lastPetAt ?? -Infinity) > now - PETS.petCooldownMinutes) continue;
      const pet = pets.find((a) => Math.hypot(a.x - c.x, a.y - c.y) <= PETS.petRadius);
      if (!pet || this.rng.next() > PETS.petChancePerMinute * minutes) continue;
      c.lastPetAt = now;
      c.needs.fun = clamp(c.needs.fun + (c.isChild ? PETS.childPetFun : PETS.petFun), 0, 100);
      if (!c.bubble) c.showBubble('heart', 1.8);
      pet.showHeart();
      pet.facing = c.x < pet.x ? 'left' : 'right';
      this.state.stats.petted = (this.state.stats.petted ?? 0) + 1;
      this.events.emit('pet:petted', { animal: pet, character: c });
    }
  }
}
