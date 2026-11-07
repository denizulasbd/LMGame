// Karakter ihtiyaçlarını oyun zamanıyla azaltır. Azalma hızı kişilik özelliklerine
// (src/data/characters.js -> TRAITS.decay) ve uyuyup uyumadığına göre değişir.
// İhtiyaçların karşılanması etkinliklerin işidir (BehaviorSystem); istisnalar: fenerlerin ve
// çiçek tarhlarının yanından geçenlere verdiği küçük keyif ve yağmurun dışarıdaki sakinlerin
// keyfine etkisi (Doğa Sever gibi yağmuru sevenler hariç). Kasaba bonusları keyfin, handaki sıcak
// yemek de açlığın daha yavaş azalmasını sağlar. Kışın üşüyenlerin enerjisi ve keyfi hızlı düşer;
// odun bitince (ocaklar sönük) herkesin tüm ihtiyaçları çok daha hızlı azalır.
// 9. aşama: kışlık palto dışarıdaki üşümenin etkisini azaltır, sırt çantası yolda yorgunluğu azaltır,
// "Mutlu Yuva" morali keyfin yavaş düşmesini sağlar, oynayan çocuklar yanındaki yetişkinleri keyiflendirir.
import { NEEDS, NEED_KEYS, SLEEP_DECAY_MULTIPLIER } from '../data/characters.js';
import { BUILDINGS } from '../data/buildings.js';
import { RAIN_EFFECTS, isRainActive, WEATHER_TYPES } from '../data/weather.js';
import { WARM_MEAL } from '../data/town.js';
import { HAPPY_HOME, CHILD_JOY } from '../data/family.js';
import { buffMultiplier, prestige } from './TownStatus.js';
import { HEATING, getSeason } from '../data/seasons.js';
import { isShivering, isFreezing } from './HeatingSystem.js';
import { coldProtection, travelFatigue } from './Equipment.js';
import { hasPalate } from './Refinery.js';
import { INN_SHERBET } from '../data/refinery.js';
import { healthEnergyMultiplier } from './HealthSystem.js';
import { PROUD_MASTER } from '../data/apprenticeship.js';
import { clamp } from '../utils/math.js';

/** Üşüme çarpanının fazlası paltoyla azalır: 1 + (m - 1) × (1 - koruma). */
function protectedCold(multiplier, protection) {
  return 1 + (multiplier - 1) * (1 - protection);
}

export class NeedsSystem {
  /** @param {import('../world/World.js').World} world */
  constructor(world) {
    this.world = world;
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    const state = this.world.state;
    const raining = isRainActive(state.weather);
    const weatherFun = WEATHER_TYPES[state.weather.type]?.funDecay ?? 1;
    // Kasaba İkramı, Şenlik Coşkusu ve anıtın kalıcı gururu keyfin yavaş düşmesini sağlar
    const funBuff = buffMultiplier(state, 'funDecay') * (prestige(state)?.funDecay ?? 1);
    const now = state.totalMinutes;
    const season = getSeason(state.time.day);
    const freezing = isFreezing(state);
    for (const c of this.world.characters) {
      if (c.away) continue; // keşif seferindekiler kendi erzaklarıyla yaşar (ihtiyaçları donar)
      const sleeping = c.isSleeping;
      const healthEnergy = healthEnergyMultiplier(c, now); // üşüten çabuk, dinç yavaş yorulur
      const rainy = raining && c.visible; // yağmur yalnızca dışarıdakileri ıslatır
      const shivering = isShivering(c, state);
      const winter = season.cold;
      // Palto yalnızca dışarıda korur (evde soğuk ocakta paltolu da üşür)
      const protection = c.visible ? coldProtection(c) : 0;
      const walking = c.task?.phase === 'travel' && c.isMoving;
      const happyHome = (c.buffs.happyHome ?? -1) > now;
      const proud = (c.buffs.proudMaster ?? -1) > now; // (25.2) Gururlu Usta
      for (const need of NEED_KEYS) {
        const perMinute = NEEDS[need].decayPerHour / 60;
        let multiplier = c.profile.decay[need] * (sleeping ? SLEEP_DECAY_MULTIPLIER[need] : 1);
        if (rainy && need === 'fun' && !c.profile.rainLover) multiplier *= RAIN_EFFECTS.funDecayMultiplier;
        // (14. aşama) Sisli sabah dinlendirir: dışarıdakilerin keyfi yavaş düşer
        if (need === 'fun' && c.visible && weatherFun !== 1) multiplier *= weatherFun;
        if (need === 'fun') multiplier *= funBuff;
        if (need === 'hunger' && (c.buffs.warmMeal ?? -1) > now) multiplier *= WARM_MEAL.hungerDecay;
        // Kışın üşüyen sakin daha çabuk yorulur ve keyfi kaçar; odun bitince evler de soğuktur ve
        // herkes donar: keyif çok hızlı kaçar, beden çabuk acıkır, kimse sohbete çıkmaz
        if (shivering && need === 'energy') multiplier *= protectedCold(freezing ? HEATING.freezingEnergy : HEATING.coldEnergy, protection);
        if (shivering && need === 'fun') multiplier *= protectedCold(freezing ? HEATING.freezingFun : HEATING.coldFun, protection);
        if (freezing && need === 'hunger') multiplier *= HEATING.freezingHunger;
        if (freezing && need === 'social') multiplier *= HEATING.freezingSocial;
        // Kışın kısa, karanlık günleri dışarıdaki herkesin keyfini biraz kaçırır
        if (winter && c.visible && need === 'fun') multiplier *= HEATING.winterGloom;
        // Sırt çantalı sakin uzun yollarda daha az yorulur; eşiyle mutlu uyanan güne keyifle başlar
        if (walking && need === 'energy') multiplier *= travelFatigue(c);
        if (happyHome && need === 'fun') multiplier *= HAPPY_HOME.funDecay;
        if (proud && need === 'fun') multiplier *= PROUD_MASTER.funDecay;
        // (24.2) Handa fıçı şerbeti içen güne "Keyifli Damak"la başlar: keyfi yavaş düşer
        if (need === 'fun' && hasPalate(c, now)) multiplier *= INN_SHERBET.palate.funDecay;
        if (need === 'energy') multiplier *= healthEnergy;
        c.needs[need] = clamp(c.needs[need] - perMinute * multiplier * tick.gameMinutes, 0, 100);
      }
      if (rainy && c.profile.rainLover) {
        c.needs.fun = clamp(c.needs.fun + RAIN_EFFECTS.rainLoverFunPerMinute * tick.gameMinutes, 0, 100);
      }
    }
    this.applyFunAuras(tick.gameMinutes);
    this.applyChildJoy(tick.gameMinutes);
  }

  /** Oynayan çocukları gören (yakınındaki, görünür) yetişkinlerin keyfi yavaşça artar. */
  applyChildJoy(minutes) {
    const players = this.world.characters.filter((c) => c.isChild && c.visible && c.task?.activity === 'play');
    if (players.length === 0) return;
    const radiusSq = CHILD_JOY.radius * CHILD_JOY.radius;
    for (const c of this.world.characters) {
      if (c.isChild || !c.visible) continue;
      if (players.some((p) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 <= radiusSq)) {
        c.needs.fun = clamp(c.needs.fun + CHILD_JOY.perMinute * minutes, 0, 100);
      }
    }
  }

  /**
   * Keyif veren yapıların (yanan sokak feneri, çiçek tarhı, anıt, kadim çeşme) yakınındaki görünür
   * sakinlerin keyfi yavaşça artar; kadim çeşme enerjiyi de doldurur. Fener yalnızca yanarken etki eder.
   */
  applyFunAuras(minutes) {
    // Kaynaklar her adımda yeniden kullanılan bir diziye toplanır (filtre dizisi çöp üretmesin)
    const sources = this.auraSources ?? (this.auraSources = []);
    sources.length = 0;
    for (const b of this.world.buildings) {
      const def = BUILDINGS[b.type];
      if (def.funAura && b.functional && (!def.litHours || b.lit)) sources.push(b);
    }
    if (sources.length === 0) return;
    for (const c of this.world.characters) {
      if (!c.visible) continue;
      for (const source of sources) {
        const aura = BUILDINGS[source.type].funAura;
        if (Math.hypot(source.center.x - c.x, source.center.y - c.y) <= aura.radius) {
          c.needs.fun = clamp(c.needs.fun + aura.perMinute * minutes, 0, 100);
          if (aura.energyPerMinute) c.needs.energy = clamp(c.needs.energy + aura.energyPerMinute * minutes, 0, 100);
        }
      }
    }
  }
}
