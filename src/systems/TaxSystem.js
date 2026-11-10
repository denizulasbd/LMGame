// (22. aşama) İç vergi ve ayni öşür. Sayılar src/data/crown.js'te, saf hesaplar ./Crown.js'te.
//
//   Kademe   : oyuncu Belediye Konağı'nın (ya da meydan havuzunun) panelinden istediği an seçer ('ui:setTaxRate' { rate }):
//              Vergi Muafiyeti %0, Düşük / Adil %10, Standart %20 (varsayılan), Ağır Vergi / Haraç %45. Ağır Vergi seçili kaldıkça
//              kasabanın çalışma hızı -%15'tir (TownStatus.townWorkMultiplier).
//   Tahsilat : her 3 günde bir 12:00'de yetişkinlerin kesesinden orana göre altın kesilip Kasaba Hazinesi'ne, çantalarındaki
//              fazla erzak / ekmek / odundan öşür kilere aktarılır (kilerde yer kadar; hiçbir şey kaybolmaz). Her tahsilatta
//              kademenin güven ve keyif etkisi uygulanır (Muaf +6 / +5, Düşük +2, Standart 0, Ağır -8 / -10): 'tax:collected'.
//   Ferman   : (28.1) kademe değiştirilince state.tax.lockedUntil = şimdi + 3 oyun günü; kilit sürerken kademe değişmez ('tax:rateLocked').
// Durum: state.tax (kayda girer).
import { TAX, TAX_RATES } from '../data/crown.js';
import { ITEMS } from '../data/citizens.js';
import { emptyTax, nextOnSchedule, taxRateOf, coinTax, titheOf, taxLockLeft } from './Crown.js';
import { takeItem } from './Citizens.js';
import { clamp } from '../utils/math.js';
import { formatRemaining } from './Petitions.js';

export class TaxSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy: import('./EconomySystem.js').EconomySystem, trust: import('./TrustSystem.js').TrustSystem }} services
   */
  constructor(game, world, { economy, trust }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.trust = trust;
    this.state.tax ??= emptyTax();
    if (!Number.isFinite(this.state.tax.nextAt)) this.state.tax.nextAt = nextOnSchedule(this.state.totalMinutes, TAX.everyDays, TAX.hour);
    this.unsubscribers = [
      game.events.on('ui:setTaxRate', ({ rate }) => this.setRate(rate)),
      game.events.on('time:hour', () => {
        if (this.state.totalMinutes >= this.state.tax.nextAt) this.collect();
      }),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  setRate(rate) {
    if (!TAX_RATES[rate] || this.state.tax.rate === rate) return false;
    // (28.1) Vergi Fermanı kilidi: kademe değiştirilince 3 oyun günü sabit kalır (tahsilat öncesi geçiş istismarını kapatır)
    const left = taxLockLeft(this.state);
    if (left > 0) {
      this.events.emit('tax:rateLocked', { rate, minutesLeft: left });
      this.events.emit('toast', { text: `Vergi Fermanı kilitli: kademe ${formatRemaining(left)} sonra değiştirilebilir`, tone: 'warn', icon: 'coin' });
      return false;
    }
    const from = this.state.tax.rate;
    this.state.tax.rate = rate;
    this.state.tax.lockedUntil = this.state.totalMinutes + TAX.lockDays * 1440;
    this.events.emit('tax:rateChanged', { rate, from, def: TAX_RATES[rate] });
    this.events.emit('toast', { text: `İç vergi: ${TAX_RATES[rate].name} (${TAX_RATES[rate].description})`, tone: rate === 'heavy' ? 'warn' : 'info', icon: TAX_RATES[rate].icon });
    return true;
  }

  /** İç vergi tahsilatı: keselerden hazineye, çantalardaki fazla maldan kilere. Dönüş: { gold, goods, payers }. */
  collect() {
    const s = this.state;
    const def = taxRateOf(s);
    s.tax.nextAt = nextOnSchedule(s.totalMinutes, TAX.everyDays, TAX.hour);
    let gold = 0;
    const goods = {};
    let payers = 0;
    for (const c of s.characters) {
      if (c.isChild || c.role) continue;
      let paid = false;
      const coins = coinTax(c, def.percent);
      if (coins > 0) {
        c.coins -= coins;
        this.economy.add('gold', coins);
        gold += coins;
        paid = true;
      }
      for (const [kind, want] of Object.entries(titheOf(c, def.percent))) {
        const resource = TAX.tithe[kind];
        const amount = Math.min(want, this.economy.room(resource));
        if (amount <= 0) continue;
        const taken = takeItem(c, kind, amount);
        if (taken > 0) {
          this.economy.add(resource, taken);
          goods[resource] = (goods[resource] ?? 0) + taken;
          paid = true;
        }
      }
      if (paid) payers += 1;
      if (def.fun) c.needs.fun = clamp(c.needs.fun + def.fun, 0, 100);
      if (c.visible && !c.bubble) c.showBubble(def.trust < 0 ? 'angry' : def.trust > 0 ? 'heart' : 'purse', 2);
    }
    if (def.trust) this.trust?.adjust(def.trust, `tax:${s.tax.rate}`);
    const units = Object.values(goods).reduce((a, b) => a + b, 0);
    s.tax.collections += 1;
    s.tax.totalGold += gold;
    s.tax.totalGoods += units;
    s.tax.last = { day: s.time.day, hour: s.time.hour, rate: s.tax.rate, gold, goods, payers };
    s.tax.log.push(s.tax.last);
    if (s.tax.log.length > TAX.logSize) s.tax.log.splice(0, s.tax.log.length - TAX.logSize);
    this.events.emit('tax:collected', { rate: s.tax.rate, def, gold, goods, payers });
    const goodsText = Object.entries(goods).map(([r, v]) => `${v} ${ITEMS[Object.keys(TAX.tithe).find((k) => TAX.tithe[k] === r)]?.name.toLocaleLowerCase('tr') ?? r}`).join(', ');
    this.events.emit('toast', {
      text: def.percent ? `İç vergi tahsil edildi (${def.name}): hazineye +${gold} altın${goodsText ? `, öşür: ${goodsText}` : ''}` : `${def.name}: bu dönem vergi alınmadı, halk minnettar`,
      tone: def.trust < 0 ? 'warn' : 'success',
      icon: 'coin',
    });
    return { gold, goods, payers };
  }
}
