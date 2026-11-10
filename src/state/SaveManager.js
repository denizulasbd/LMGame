// Oyunu tarayıcı depolamasına (localStorage) yazar / okur. İki yuva vardır:
//   'main'    : "Kaydet" düğmesi ve her sabah 06:00'daki otomatik kayıt; "Yükle" bunu açar
//   'session' : sayfa kapanırken yazılır; F5 ile oyun tam kaldığı yerden devam eder
// Kayıt düz bir nesnedir: GameState.toJSON() + harita farkları + sürüm + kayıt zamanı.
// Burada oyun kuralı yoktur; neyin kaydedileceğine GameState ve sahne karar verir.
import { CONFIG } from '../config.js';
import { defaultTownName } from './GameState.js';
import { LEGACY_BUILDING_TYPES } from '../data/buildings.js';

const SLOT_KEYS = {
  main: CONFIG.SAVE_KEY,
  session: CONFIG.SESSION_KEY,
};

/**
 * Eski kayıtları bugünkü veriye uyarlar: kaldırılan yapı türleri (ör. Sokak Lambası) yerini alan
 * türe çevrilir; kurulmuş ya da yarım kalmış lambalar yüklenince Sokak Feneri olarak çalışır.
 */
function migrate(data) {
  // (28.2) v32 -> v33: sakinlere Başusta alanları (hiçbiri Başusta değil), çıraklık sayaçlarına grandmasters / grandmasterSaved
  if (data.version < 33) {
    if (Array.isArray(data.characters)) {
      for (const c of data.characters) {
        if (c && typeof c === 'object') {
          c.isGrandmaster = false;
          c.grandmasterProfession = null;
          c.grandmasterBatches = 0;
        }
      }
    }
    if (data.apprenticeship && typeof data.apprenticeship === 'object') {
      data.apprenticeship.grandmasters = 0;
      data.apprenticeship.grandmasterSaved = 0;
    }
  }
  // (28.1) v31 -> v32: yangınlara Acil Seferberlik bayrağı, vergiye Vergi Fermanı kilidi (alanlar eksikse güvenle eklenir)
  if (data.version < 32) {
    if (Array.isArray(data.buildings)) {
      for (const b of data.buildings) if (b && typeof b === 'object') b.emergencyMuster = false;
    }
    if (data.tax && typeof data.tax === 'object') data.tax.lockedUntil = 0;
  }
  if (Array.isArray(data.buildings)) {
    for (const b of data.buildings) {
      if (b && LEGACY_BUILDING_TYPES[b.type]) b.type = LEGACY_BUILDING_TYPES[b.type];
    }
  }
  return data;
}

export const SaveManager = {
  /** @param {object} snapshot GameState.toJSON() çıktısı + terrain */
  write(snapshot, slot = 'main') {
    try {
      const payload = { ...snapshot, version: CONFIG.SAVE_VERSION, savedAt: Date.now() };
      localStorage.setItem(SLOT_KEYS[slot], JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('Kayıt başarısız:', err);
      return false;
    }
  },

  /** Yuvadaki kayıt ya da null (yok, bozuk ya da başka sürümden). */
  read(slot = 'main') {
    try {
      const raw = localStorage.getItem(SLOT_KEYS[slot]);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const supported = data && data.version >= CONFIG.SAVE_MIN_VERSION && data.version <= CONFIG.SAVE_VERSION;
      return supported ? migrate(data) : null;
    } catch (err) {
      console.warn('Kayıt okunamadı:', err);
      return null;
    }
  },

  exists(slot = 'main') {
    return this.read(slot) !== null;
  },

  /** Arayüzde göstermek için kısa özet: { day, hour, minute, population, townName, tier, savedAt } ya da null. */
  describe(slot = 'main') {
    const data = this.read(slot);
    if (!data) return null;
    return {
      day: data.time.day,
      hour: data.time.hour,
      minute: data.time.minute,
      population: data.characters.length,
      townName: data.townName ?? defaultTownName(data.seed), // eski kayıtlarda ad tohumdan önerilir
      tier: Number.isInteger(data.town?.tier) ? data.town.tier : null, // 10. aşamadan eski kayıtlarda yok
      savedAt: data.savedAt,
    };
  },

  clear(slot = 'main') {
    try {
      localStorage.removeItem(SLOT_KEYS[slot]);
    } catch {
      /* depolama erişilemez */
    }
  },
};
