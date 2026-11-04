// Kasaba Hazinesi'nin harcandığı yerler (13. aşama): lüks ve egzotik mallar, kasaba yadigârları, altın fermanları.
// Kurallar src/data/luxury.js'te; satın alınabilirlik ve etkiler src/systems/Luxury.js'teki saf yardımcılarda.
//
//   'ui:buyLuxury' { id, source }   : Baharat ve Kahve Sandığı (hana teslim; 4 gün handa yiyenlere hız) ya da İpek
//                                     Kumaş ve Mermer Sütunlar (kalıcı Seviye 2 prestiji + anlık şenlik). source:
//                                     'merchant' (tüccar tezgâhta) | 'harbor' (limandan sipariş)
//   'ui:buyRelic' { id, source }    : yadigâr Belediye Konağı'nda sergilenir, kalıcı özelliği hemen başlar; fiyatı
//                                     sergilenen yadigâr sayısıyla artar
//   'ui:goldDecree' { id }          : Ustalara Altın İkramiye ya da Kraliyet Mimarları (bekleme süreli)
// Yayınladığı olaylar: 'luxury:bought' { good, id, price }, 'relic:exhibited' { relic, id, price, count },
// 'goldDecree:issued' { decree, id, price }.
import { LUXURY_GOODS, RELICS, GOLD_DECREES } from '../data/luxury.js';
import { TOWN_BUFFS } from '../data/town.js';
import { luxuryStatus, relicStatus, goldDecreeStatus, relicCount } from './Luxury.js';
import { clamp } from '../utils/math.js';

export class LuxurySystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('./EconomySystem.js').EconomySystem} economy
   */
  constructor(game, economy) {
    this.state = game.state;
    this.events = game.events;
    this.economy = economy;
    this.unsubscribers = [
      game.events.on('ui:buyLuxury', ({ id, source }) => this.buyGood(id, source)),
      game.events.on('ui:buyRelic', ({ id, source }) => this.buyRelic(id, source)),
      game.events.on('ui:goldDecree', ({ id }) => this.decree(id)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get luxury() {
    return this.state.luxury;
  }

  /** Altını öder ve harcamayı kaydeder. */
  pay(price) {
    if (!this.economy.spend({ gold: price })) return false;
    this.luxury.goldSpent += price;
    this.luxury.purchases += 1;
    return true;
  }

  extendBuff(key, hours) {
    const now = this.state.totalMinutes;
    this.state.buffs[key] = Math.max(this.state.buffs[key] ?? 0, now) + hours * 60;
  }

  buyGood(id, source) {
    const good = LUXURY_GOODS[id];
    const status = luxuryStatus(this.state, id, source);
    if (!status.ok) {
      this.events.emit('toast', { text: `${good?.name ?? 'Lüks mal'}: ${status.reason}`, tone: 'warn', icon: good?.icon ?? 'coin' });
      return status;
    }
    if (!this.pay(status.price)) return { ok: false, reason: 'Yetersiz altın' };
    let detail = '';
    if (id === 'spiceCrate') {
      this.extendBuff(good.buff, TOWN_BUFFS[good.buff].hours);
      detail = 'Sandık hana teslim edildi: 4 gün boyunca handa yemek yiyenler daha hızlı çalışıp yürüyecek.';
    } else if (id === 'silkMarble') {
      this.luxury.silk = true;
      this.extendBuff(good.instant.buff, TOWN_BUFFS[good.instant.buff].hours);
      for (const c of this.state.characters) {
        c.needs.fun = clamp(c.needs.fun + good.instant.fun, 0, 100);
        if (c.visible) c.showBubble('sparkle', 2.4);
      }
      detail = 'Taş evler ipek perdeler, yapılar mermer sütunlarla süslendi; kasaba coşkuyla kutluyor!';
    }
    this.events.emit('luxury:bought', { good, id, price: status.price, source });
    this.events.emit('toast', { text: `${good.name} alındı (−${status.price} altın). ${detail}`, tone: 'success', icon: good.icon });
    return { ok: true };
  }

  buyRelic(id, source) {
    const relic = RELICS[id];
    const status = relicStatus(this.state, id, source);
    if (!status.ok) {
      this.events.emit('toast', { text: `${relic?.name ?? 'Yadigâr'}: ${status.reason}`, tone: 'warn', icon: relic?.icon ?? 'coin' });
      return status;
    }
    if (!this.pay(status.price)) return { ok: false, reason: 'Yetersiz altın' };
    const { day, hour, minute } = this.state.time;
    this.luxury.relics[id] = { day, hour, minute };
    const count = relicCount(this.state);
    this.events.emit('relic:exhibited', { relic, id, price: status.price, count });
    this.events.emit('toast', {
      text: `${relic.name} Belediye Konağı'nda sergileniyor (−${status.price} altın). ${relic.description}`,
      tone: 'success',
      icon: relic.icon,
    });
    return { ok: true };
  }

  decree(id) {
    const decree = GOLD_DECREES[id];
    const status = goldDecreeStatus(this.state, id);
    if (!status.ok) {
      this.events.emit('toast', { text: `${decree?.name ?? 'Ferman'}: ${status.reason}`, tone: 'warn', icon: decree?.icon ?? 'coin' });
      return status;
    }
    if (!this.pay(status.price)) return { ok: false, reason: 'Yetersiz altın' };
    this.luxury.decreeDays[id] = this.state.time.day;
    this.extendBuff(decree.buff, TOWN_BUFFS[decree.buff].hours);
    if (decree.instant?.fun) {
      for (const c of this.state.characters) {
        c.needs.fun = clamp(c.needs.fun + decree.instant.fun, 0, 100);
        if (c.visible && !c.isChild) c.showBubble('heart', 2.2);
      }
    }
    this.events.emit('goldDecree:issued', { decree, id, price: status.price });
    this.events.emit('toast', { text: `Altın fermanı: ${decree.name} (−${status.price} altın). ${decree.description}`, tone: 'success', icon: decree.icon });
    return { ok: true };
  }
}
