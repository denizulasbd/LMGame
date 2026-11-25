// (32.3) Kasaba Şöhreti: Krallık İtibarı'nın günlük kayması, kademe geçişleri, Saygın kasabaya Kalfa göçmen ve Kraliyet Lütfu.
// Sayılar data/renown.js, saf hesaplar ./Renown.js. Şalter ENGINES.renown: kapalıyken hiçbir dinleyici kurulmaz, state.renown
// yazılmaz; itibar yalnızca olaylarla (vergi, ferman, karar olayı) değişir.
//
//   Gün dönümü ('time:newDay', bütün öteki gün dinleyicilerinden SONRA kurulur): 6. günden itibaren itibar hedefe doğru boşluğun
//     %12'si (en çok ±4) kayar; olayların anlık etkisi silinmez, yalnızca hedefe çekilir. Katkılar son 2 gün tutulur (neden dökümü),
//     Arşiv satırına günün itibarı yazılır, Gözde serisi sayılır, koşullar tutarsa izole zarla (tohum + 44) Kraliyet Lütfu.
//   Kademe kartı: gün dönümünde (kaymadan sonra) kademe değiştiyse 'renown:tier' (hikâye kartı, Kasaba Günlüğü). Olayların gün
//     içindeki anlık sıçraması kart üretmez; düşüşte 3 puan pay. Etkiler (vergi, ödül, ferman süresi) her an değere göre işler.
//   'population:joined': itibar Saygın ve üstündeyse yeni gelen bir meslekte Kalfa gelir (zar yok).
import { RENOWN_DRIFT, RENOWN_TEXT, RENOWN_EFFECTS, RENOWN_GRANT, ROYAL_TYPES, ROYAL_LETTER, RENOWN_LEVELS, RENOWN_RANK } from '../data/renown.js';
import { BUILDINGS } from '../data/buildings.js';
import { engineOn } from './Engines.js';
import { emptyRenown, renownTarget, renownStep, topRenownReasons, rankOf, renownLevelOf, grantEligible, royalGranted, immigrantSkillFor, KALFA_XP } from './Renown.js';
import { clamp } from '../utils/math.js';

export class RenownSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../utils/random.js').Random} dice izole üreteç (tohum + 44): yalnızca Kraliyet Lütfu zarı
   */
  constructor(game, dice, { attract = false } = {}) {
    this.game = game;
    this.events = game.events;
    this.dice = dice;
    this.unsubscribers = [];
    if (attract || !engineOn('renown')) return;
    this.state.renown ??= emptyRenown();
    if (this.state.renown.rank === null) this.state.renown.rank = rankOf(this.state);
    const on = (name, fn) => this.unsubscribers.push(game.events.on(name, fn));
    on('time:newDay', (day) => this.newDay(day));
    on('population:joined', ({ character } = {}) => this.welcome(character));
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get state() {
    return this.game.state;
  }

  get renown() {
    return (this.state.renown ??= emptyRenown());
  }

  /** Gün dönümü: kayma, nedenler, Arşiv satırı, Gözde serisi, lütuf zarı. Dönüş: { from, to, target } ya da null (ilk 5 gün). */
  newDay(day = this.state.time.day) {
    const s = this.state;
    if (!engineOn('renown') || !s.crown || day < RENOWN_DRIFT.minDay) return null;
    const r = this.renown;
    const { target, values } = renownTarget(s);
    const from = s.crown.reputation;
    const to = clamp(Math.round((from + renownStep(from, target)) * 10) / 10, 0, 100);
    s.crown.reputation = to;
    r.drift = { day, from, to, target };
    r.daily.push({ day, parts: Object.fromEntries(Object.entries(values).filter(([, v]) => v !== 0)) });
    while (r.daily.length > RENOWN_DRIFT.reasonDays) r.daily.shift();
    r.reasons = topRenownReasons(r.daily);
    // Arşiv: günün özeti StatsSystem'de (bu dinleyiciden önce) yazıldı; itibarı kaymadan sonraki değerle ekle
    const last = s.history?.[s.history.length - 1];
    if (last && last.day === day) last.reputation = Math.round(to);
    this.checkTier();
    r.gozdeStreak = renownLevelOf(to).key === 'favored' ? r.gozdeStreak + 1 : 0;
    this.rollGrant(day);
    this.events.emit('renown:drift', { day, from, to, target });
    return r.drift;
  }

  /** Kademe değiştiyse kart ve günlük. */
  checkTier() {
    if (!engineOn('renown')) return null;
    const r = this.renown;
    const rank = rankOf(this.state);
    if (r.rank === null) r.rank = rank;
    if (rank === r.rank) return null;
    // düşüşte küçük pay: eşiğin hemen altına inip dönen değer kart / günlük üretmez (etkiler zaten değere göre işler)
    if (rank < r.rank && this.state.crown.reputation >= (RENOWN_LEVELS.find((l) => RENOWN_RANK[l.key] === r.rank)?.min ?? 0) - RENOWN_DRIFT.tierMargin) return null;
    const up = rank > r.rank;
    r.rank = rank;
    const level = renownLevelOf(this.state.crown.reputation);
    const text = (up ? RENOWN_TEXT.rise : RENOWN_TEXT.fall)[level.key]?.replace('{town}', this.state.townName || 'Kasaba') ?? `Krallık İtibarı: ${level.name}`;
    r.tiers.push({ day: this.state.time.day, key: level.key, up });
    if (r.tiers.length > 12) r.tiers.splice(0, r.tiers.length - 12);
    this.log(text, 'crown');
    this.events.emit('renown:tier', { key: level.key, name: level.name, up, text });
    return { key: level.key, up };
  }

  /** Koşullar tutarsa izole zarla Kraliyet Lütfu. force: testler (zarı atlar). */
  rollGrant(day = this.state.time.day, { force = false } = {}) {
    if (!grantEligible(this.state, day)) return null;
    if (!force && this.dice.next() >= RENOWN_GRANT.chance) return null;
    const open = ROYAL_TYPES.filter((t) => !royalGranted(this.state, t));
    const key = open.length === 1 ? open[0] : open[Math.floor(this.dice.next() * open.length) % open.length];
    return this.grant(key, day);
  }

  /** Lütfu açar (kalıcı). */
  grant(key, day = this.state.time.day) {
    const r = this.renown;
    if (!ROYAL_TYPES.includes(key) || royalGranted(this.state, key)) return null;
    r.grants.push({ key, day });
    r.lastGrantDay = day;
    const name = BUILDINGS[key].name;
    const town = this.state.townName || 'Kasaba';
    const body = ROYAL_LETTER.body[key];
    this.log(`${ROYAL_LETTER.title} geldi: ${name} kurulabilir (Kraliyet Lütfu)`, 'decree');
    this.events.emit('toast', { text: `${ROYAL_LETTER.title}: ${name} kurma izni! İnşa Et → ${BUILDINGS[key].category}.`, tone: 'success', icon: 'decree' });
    this.events.emit('renown:grant', { key, day, name, town, body });
    return { key, day };
  }

  /** Saygın ve üstünde yeni gelen bir meslekte Kalfa gelir. */
  welcome(c) {
    if (!engineOn('renown') || !c || c.role || c.isChild) return;
    // (32.6a) eşik veriden: minReputation sayıysa itibar değeri (ör. ≥ 70), değilse kademe (minRank)
    const rule = RENOWN_EFFECTS.skilledImmigrant;
    if (Number.isFinite(rule.minReputation) ? (this.state.crown?.reputation ?? 0) < rule.minReputation : rankOf(this.state) < rule.minRank) return;
    const skill = immigrantSkillFor(c);
    c.skills ??= {};
    c.skills[skill] = Math.max(c.skills[skill] ?? 0, KALFA_XP());
    c.renownSkilled = true; // kaydedilmez: yalnızca bu oturumun bilgisi
    this.events.emit('renown:skilledImmigrant', { character: c, skill });
  }

  log(text, icon) {
    const entry = this.state.addJournal(text, icon);
    this.events.emit('journal:added', entry);
  }
}
