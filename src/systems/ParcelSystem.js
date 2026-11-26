// (34.2) Parsel satın alma: kilitli toprağı altınla kasabaya katar. Kurallar, fiyat ve kota systems/ParcelMarket.js'te (saf);
// bu sınıf yalnızca eylemi yapar: altını öder, parseli açar, olayı yayınlar. Güncelleme listesinde değil, yalnızca olay dinler.
//   'parcel:bought' { parcel, price, quota }  — günlük, hikâye kartı, hedef, ses ve efekt dinler.
//   'ui:buyParcel' { id }                     — parsel kartının "Satın Al" düğmesi.
// Satın alma bu yoldan başka yerde olmaz (geliştirici yolu sim.unlockParcel altın istemez ve olay yayınlamaz).
import { PARCEL_TEXT as T } from '../data/parcels.js';
import { purchaseStatus, buyableParcels } from './ParcelMarket.js';

export class ParcelSystem {
  constructor(game, scene, economy) {
    this.game = game;
    this.scene = scene;
    this.economy = economy;
    this.unsubscribers = [game.events.on('ui:buyParcel', ({ id } = {}) => this.buy(id))];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get state() {
    return this.game.state;
  }

  parcel(id) {
    return this.scene.parcels.find((p) => p.id === id) ?? null;
  }

  /** Bir parselin satın alma durumu ({ ok, reason, price, breakdown, owned }). */
  status(id) {
    const parcel = this.parcel(id);
    return parcel ? purchaseStatus(this.state, parcel, this.economy.amount('gold')) : null;
  }

  /** Şu an alınabilir (komşu ve seviye uygun) parseller, ucuzdan pahalıya: [{ parcel, price }]. */
  buyable() {
    return buyableParcels(this.state, this.scene.parcels);
  }

  /** Satın alır. Dönüş: { ok, reason?, parcel?, price? } */
  buy(id) {
    const parcel = this.parcel(id);
    const status = this.status(id);
    if (!parcel || !status) return { ok: false, reason: 'Parsel bulunamadı' };
    if (!status.ok) return { ok: false, reason: status.reason };
    if (!this.economy.spend({ gold: status.price })) return { ok: false, reason: status.reason ?? T.needGold(status.price, this.economy.amount('gold')) };
    this.scene.unlockParcel(parcel.id);
    this.game.events.emit('parcel:bought', { parcel, price: status.price, quota: parcel.quota });
    this.game.events.emit('toast', { text: T.toast(parcel.name), tone: 'success', icon: 'coin' });
    return { ok: true, parcel, price: status.price };
  }
}
