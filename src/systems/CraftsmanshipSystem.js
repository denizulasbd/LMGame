// (15. aşama) Görsel ustalık ve usta işi eserler.
//
//   Meslek kıyafeti: her sakinin ana mesleğindeki kademesi (SkillSystem.outfitFor) Character.outfit'e yazılır;
//   sprite bunu çizer (Kalfa'da aksesuar, Usta'da tam kostüm). Deneyimden türetildiği için kaydedilmez; kademe
//   atlayınca, okul bitince, büyüyünce, yeni sakin gelince ve saat başı tazelenir.
//
//   Usta işi eser: Usta (Lv.3) bir sakin kendi iş yerinde (Kereste Atölyesi, Taş Ocağı, Demir Madeni, Fırın, Koyun
//   Ağılı, Şifacı Kulübesi) bir mesaiyi bitirince MASTERWORK.baseChance (+ sabit iş yeri, + Sağlam Alet) olasılıkla
//   bir eser çıkarır (iki eser arasında en az MASTERWORK.makerCooldownDays gün; kasabada günde en çok MASTERWORK.townPerDay). Eser Kasaba Arşivi'nin vitrinine girer:
//     'ui:exhibitMasterwork' { id }         : sergilenir, kasaba refahına kalıcı +1 (en çok +12)
//     'ui:sellMasterwork' { id, source }    : limandan ('harbor') ya da gezgin tüccara ('merchant') satılır
// Yayınladığı olaylar: 'masterwork:created' { item, piece, character, building }, 'masterwork:exhibited' { item, piece },
// 'masterwork:sold' { item, piece, price, source }.
import { MASTERPIECES, MASTERPIECE_BY_ACTIVITY, MASTERWORK } from '../data/masterpieces.js';
import { skillLevel, outfitFor } from './SkillSystem.js';
import { masterworkItem, masterworkSaleStatus, masterworkExhibitStatus, storedMasterworks } from './Masterworks.js';
import { addMemory } from './MemorySystem.js';
import { grandmasterMasterworkMultiplier } from './Grandmaster.js';

export class CraftsmanshipSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./EconomySystem.js').EconomySystem} economy
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, economy, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.rng = rng;
    const refresh = ({ character } = {}) => (character ? this.refreshOutfit(character) : this.refreshAll());
    this.unsubscribers = [
      game.events.on('skill:levelUp', refresh),
      game.events.on('school:graduated', refresh),
      game.events.on('family:grownUp', refresh),
      game.events.on('population:joined', refresh),
      game.events.on('time:hour', () => this.refreshAll()),
      game.events.on('work:finished', (p) => this.onWorkFinished(p)),
      game.events.on('ui:exhibitMasterwork', ({ id }) => this.exhibit(id)),
      game.events.on('ui:sellMasterwork', ({ id, source }) => this.sell(id, source)),
    ];
    this.refreshAll();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get masterworks() {
    return this.state.masterworks;
  }

  // ---------------------------------------------------------------------------
  // Meslek kıyafetleri
  // ---------------------------------------------------------------------------

  refreshAll() {
    for (const c of this.state.characters) this.refreshOutfit(c);
  }

  refreshOutfit(c) {
    c.outfit = outfitFor(c);
  }

  // ---------------------------------------------------------------------------
  // Usta işi eserler
  // ---------------------------------------------------------------------------

  /** Eser olasılığı: Usta değilse 0. */
  chanceFor(c, type, building) {
    const piece = MASTERPIECES[type];
    if (!piece || skillLevel(c, piece.skill).level < 3) return 0;
    let chance = MASTERWORK.baseChance;
    if (c.workplaceId !== null && c.workplaceId === building?.id) chance += MASTERWORK.pinnedBonus;
    if (c.equipment?.tool === 'sturdyTool') chance += MASTERWORK.toolBonus;
    chance += c.mood?.masterwork ?? 0; // (29.2) Ustalık Akışı +%2, İlham Dolu +%3
    return chance * grandmasterMasterworkMultiplier(c, type); // (28.2) Başusta kendi mesleğinin eserinde 2 kat
  }

  onWorkFinished({ character: c, activity, building }) {
    const type = MASTERPIECE_BY_ACTIVITY[activity];
    if (!type || !building?.functional) return;
    const day = this.state.time.day;
    const mw = this.masterworks;
    if (mw.lastDay === day && (mw.today ?? 0) >= MASTERWORK.townPerDay) return; // kasabada bugünün eseri çıktı
    const last = mw.lastByMaker[c.id];
    if (last !== undefined && day - last < MASTERWORK.makerCooldownDays) return; // usta eserler arasında dinlenir
    if (storedMasterworks(this.state).length >= MASTERWORK.maxStored) return; // vitrin dolu
    const chance = this.chanceFor(c, type, building);
    if (chance <= 0 || this.rng.next() >= chance) return;
    this.create(c, type, building);
  }

  /** Ustanın elinden yeni bir eser çıkar (testler ve sistem doğrudan çağırabilir). */
  create(c, type, building = null) {
    const piece = MASTERPIECES[type];
    const mw = this.masterworks;
    const { day, hour } = this.state.time;
    const item = { id: mw.nextId++, type, makerId: c.id, maker: c.name, day, hour, status: 'stored' };
    mw.items.push(item);
    mw.made += 1;
    mw.lastByMaker[c.id] = day;
    mw.today = mw.lastDay === day ? (mw.today ?? 0) + 1 : 1;
    mw.lastDay = day;
    if (c.visible) c.showBubble('masterpiece', 3.5);
    c.celebrate?.();
    addMemory(this.state, c, `Usta işi bir eser yaptı: ${piece.name}`, piece.icon, { kind: 'masterwork' });
    this.events.emit('masterwork:created', { item, piece, character: c, building });
    this.events.emit('toast', {
      text: `${c.name} usta işi bir eser ortaya koydu: ${piece.name}! Kasaba Arşivi'nden sergileyebilir ya da satabilirsin.`,
      tone: 'success',
      icon: piece.icon,
    });
    return item;
  }

  exhibit(id) {
    const status = masterworkExhibitStatus(this.state, id);
    const item = masterworkItem(this.state, id);
    if (!status.ok) {
      this.events.emit('toast', { text: `Usta işi eser: ${status.reason}`, tone: 'warn', icon: 'masterpiece' });
      return status;
    }
    item.status = 'exhibited';
    this.masterworks.exhibited += 1;
    const piece = MASTERPIECES[item.type];
    this.events.emit('masterwork:exhibited', { item, piece });
    this.events.emit('toast', { text: `${piece.name} vitrinde sergileniyor: kasaba refahına kalıcı +1`, tone: 'success', icon: piece.icon });
    return status;
  }

  sell(id, source) {
    const status = masterworkSaleStatus(this.state, id, source);
    const item = masterworkItem(this.state, id);
    if (!status.ok) {
      this.events.emit('toast', { text: `Usta işi eser: ${status.reason}`, tone: 'warn', icon: 'coin' });
      return status;
    }
    item.status = 'sold';
    item.price = status.price;
    this.masterworks.sold += 1;
    this.masterworks.goldEarned += status.price;
    this.economy.add('gold', status.price, 'sale');
    const piece = MASTERPIECES[item.type];
    this.events.emit('masterwork:sold', { item, piece, price: status.price, source });
    this.events.emit('toast', {
      text: `${piece.name} ${source === 'harbor' ? 'limandan ihraç edildi' : 'gezgin tüccara satıldı'}: +${status.price} altın`,
      tone: 'success',
      icon: 'coin',
    });
    return status;
  }
}
