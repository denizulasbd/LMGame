// Belediye fermanları (11. aşama): geç oyunda biriken bol kaynağı kalıcı yatırımlara çevirir. Fermanlar
// data/town.js -> CIVIC_PROJECTS'tedir; Belediye Konağı'nın Yapı Bilgi Paneli'nden ilan edilir ('ui:civicProject').
//
//   Büyük Kışlık Ziyafet     : erzak (önce ekmek) + odun; herkes doyar, 3 günlük Büyük Ziyafet bonusu. Tekrarlanabilir
//                              (bekleme süreli).
//   Altyapı ve Depo Genişletmesi: iki kademe; her kademe tüm kaynakların depo sınırına kalıcı +150 ekler ve meydana
//                              yakın toprak yolları arnavut kaldırımına çevirir.
//   Zanaat Loncası Desteği   : bir kez; meslek deneyimi ve üretim yapılarındaki verim kalıcı +%15.
// Durum state.civic'te (kayda girer). Yayınladığı olay: 'civic:decreed' { project, level }.
import { CIVIC_PROJECTS } from '../data/town.js';
import { TILE_TYPES } from '../data/tiles.js';
import { formatCost } from '../data/resources.js';
import { TOWN_BUFFS } from '../data/town.js';
import { clamp } from '../utils/math.js';
import { doctrineGate, chooseDoctrine } from './Doctrine.js';

/**
 * Bir fermanın şimdiki durumu (arayüz ve sistem aynı hesabı kullanır):
 * { ok, reason, cost, provisions, level, maxed }
 */
export function civicStatus(state, id, hasHall = true) {
  const project = CIVIC_PROJECTS[id];
  const civic = state.civic;
  let cost = project.cost ?? {};
  let level = null;
  let reason = null;
  let maxed = false;
  if (project.levels) {
    level = civic.storageLevel;
    maxed = level >= project.levels.length;
    if (!maxed) cost = project.levels[level].cost;
  }
  if (project.once && civic[id]) maxed = true;
  const provisions = project.provisions ?? 0;
  const gate = doctrineGate(state, project.doctrine ?? null); // (28.4)
  if (!hasHall) reason = 'Önce Belediye Konağı tamamlanmalı';
  else if (!maxed && !gate.ok) reason = gate.reason;
  else if (maxed) reason = project.levels ? 'Bütün kademeler tamamlandı' : 'Zaten ilan edildi';
  else if (project.cooldownDays && state.time.day - civic.feastDay < project.cooldownDays) {
    reason = `${project.cooldownDays - (state.time.day - civic.feastDay)} gün sonra yeniden ilan edilebilir`;
  } else {
    const missing = Object.entries(cost).filter(([r, v]) => (state.resources[r] ?? 0) < v);
    const stores = (state.resources.bread ?? 0) + (state.resources.food ?? 0);
    if (missing.length || stores < provisions) reason = `Yetersiz kaynak${provisions && stores < provisions ? ` (erzak ${stores}/${provisions})` : ''}`;
  }
  return { ok: !reason, reason, cost, provisions, level, maxed };
}

/** Depo genişletmesinin depo kapasitesine kalıcı katkısı. */
export function civicStorageBonus(state) {
  const levels = CIVIC_PROJECTS.storehouse.levels;
  let bonus = 0;
  for (let i = 0; i < Math.min(state.civic?.storageLevel ?? 0, levels.length); i++) bonus += levels[i].capacity;
  return bonus;
}

export class CivicSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./EconomySystem.js').EconomySystem} economy
   */
  constructor(game, world, economy) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.unsubscribers = [game.events.on('ui:civicProject', ({ id }) => this.decree(id))];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  hall() {
    return this.world.getCompleted().find((b) => b.definition.civic) ?? null;
  }

  /** Fermanı ilan eder: maliyeti öder ve etkisini uygular. Dönüş: { ok, reason } */
  decree(id) {
    const project = CIVIC_PROJECTS[id];
    if (!project) return { ok: false, reason: 'Bilinmeyen ferman' };
    const status = civicStatus(this.state, id, Boolean(this.hall()));
    if (!status.ok) {
      this.events.emit('toast', { text: `${project.name}: ${status.reason}`, tone: 'warn', icon: project.icon });
      return status;
    }
    if (!this.economy.spend(status.cost)) return { ok: false, reason: 'Yetersiz kaynak' };
    if (status.provisions) this.spendProvisions(status.provisions);
    const civic = this.state.civic;
    civic.decrees = (civic.decrees ?? 0) + 1;
    let detail = '';
    if (id === 'grandFeast') {
      civic.feastDay = this.state.time.day;
      this.state.buffs[project.buff] = this.state.totalMinutes + TOWN_BUFFS[project.buff].hours * 60;
      for (const c of this.state.characters) {
        c.needs.fun = clamp(c.needs.fun + project.instant.fun, 0, 100);
        c.needs.hunger = clamp(c.needs.hunger + project.instant.hunger, 0, 100);
        if (c.visible) c.showBubble('heart', 2.4);
      }
      detail = '3 gün boyunca kasaba bayram havasında!';
    } else if (id === 'storehouse') {
      const level = project.levels[civic.storageLevel];
      civic.storageLevel += 1;
      this.economy.recalculateCapacity();
      const paved = this.paveRoads(level.cobbles);
      detail = `Depo sınırı ${this.economy.capacity}'e çıktı${paved ? `, ${paved} karo yol taşla döşendi` : ''}.`;
    } else if (id === 'craftGuild') {
      civic.craftGuild = true;
      detail = 'Ustalar artık daha hızlı öğreniyor ve üretiyor.';
    } else if (id === 'tradeCharter') {
      civic.tradeCharter = true;
      detail = 'Krallık Vergisi kalıcı olarak %10 düştü.';
    }
    if (chooseDoctrine(this.state, project.doctrine ?? null)) this.events.emit('doctrine:chosen', { doctrine: this.state.doctrine.chosen, source: 'civic', id });
    this.events.emit('civic:decreed', { project, id, level: civic.storageLevel, detail });
    this.events.emit('toast', { text: `Ferman ilan edildi: ${project.name}. ${detail}`, tone: 'success', icon: project.icon });
    return { ok: true };
  }

  /** Erzak birimi harcar: önce ekmek, yetmezse ham yiyecek (birim birim). */
  spendProvisions(units) {
    const bread = Math.min(units, this.economy.amount('bread'));
    if (bread > 0) this.economy.spend({ bread });
    if (units - bread > 0) this.economy.spend({ food: units - bread });
  }

  /** Meydana en yakın toprak yol karolarını taş yola çevirir (en çok count). Döşenen karo sayısı. */
  paveRoads(count) {
    const map = this.world.map;
    const plaza = this.world.landmarks.plaza;
    const roads = [];
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) if (map.get(x, y) === 'path') roads.push({ x, y, d: Math.hypot(x - plaza.centerX, y - plaza.centerY) });
    }
    roads.sort((a, b) => a.d - b.d);
    const chosen = roads.slice(0, count);
    for (const t of chosen) map.set(t.x, t.y, 'cobble');
    if (chosen.length) {
      this.world.refreshStaticData();
      this.events.emit('world:paved', { count: chosen.length, tile: TILE_TYPES.cobble.id });
    }
    return chosen.length;
  }

  /** Fermanın maliyet metni (günlük ve ipucu için). */
  static describeCost(status) {
    const parts = [formatCost(status.cost)];
    if (status.provisions) parts.push(`${status.provisions} erzak (önce ekmek)`);
    return parts.filter((p) => p !== 'Ücretsiz').join(' + ');
  }
}
