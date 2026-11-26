// Oyunu tarayıcı depolamasına (localStorage) yazar / okur. İki yuva vardır:
//   'main'    : "Kaydet" düğmesi ve her sabah 06:00'daki otomatik kayıt; "Yükle" bunu açar
//   'session' : sayfa kapanırken yazılır; F5 ile oyun tam kaldığı yerden devam eder
// Kayıt düz bir nesnedir: GameState.toJSON() + harita farkları + sürüm + kayıt zamanı.
// Burada oyun kuralı yoktur; neyin kaydedileceğine GameState ve sahne karar verir.
import { CONFIG } from '../config.js';
import { defaultTownName } from './GameState.js';
import { LEGACY_BUILDING_TYPES } from '../data/buildings.js';
import { lifespanFor } from '../systems/Venerable.js';
import { valleyFor } from '../systems/Valley.js';
import { migrateChemistry } from '../systems/Chemistry.js';
import { migrateMoodlets } from '../systems/Moodlets.js';
import { migrateWants } from '../systems/Wants.js';
import { migrateEvolution } from '../systems/Evolution.js';
import { rescaleAgeDays } from '../systems/LifeStages.js';
import { lifeSeedOf } from '../utils/lifeSeed.js';

const SLOT_KEYS = {
  main: CONFIG.SAVE_KEY,
  session: CONFIG.SESSION_KEY,
};

/**
 * Eski kayıtları bugünkü veriye uyarlar: kaldırılan yapı türleri (ör. Sokak Lambası) yerini alan
 * türe çevrilir; kurulmuş ya da yarım kalmış lambalar yüklenince Sokak Feneri olarak çalışır.
 */
function migrate(data) {
  // (29.1) v35 -> v36: mevcut her ilişkiye (puanı olan çiftler, sevgililer / eşler) kimlik çiftinden ve tohumdan türeyen deterministik
  // kimya ve boş duygusal etiket yapısı bağlanır (rastgelelik tüketmez). Daha eski sürümlerin aşağıdaki göçleri sakin alanlarını
  // değiştirmediği için (kimya yalnızca özellik, huy, çıraklık ve Başusta bilgisine bakar) sıra önemli değildir.
  const bindChemistry = data.version < 36;
  // (29.2) v36 -> v37: her sakine boş ruh hali listesi (moodlets: []), duruma boş ruh hali sayaçları (state.moodlets)
  if (data.version < 37) migrateMoodlets(data);
  // (29.4) v38 -> v39: her sakine sıfır eksenler, boş listeler ve sayaçlar; duruma boş evrim sayaçları (özellikler değişmez, zar çekilmez)
  if (data.version < 39) migrateEvolution(data);
  // (29.6-29.7) v39 -> v40: her sakine sadakat 0, evlilik günü ve özel gün yok; boş tören durumu; isyan sürüyorsa elebaşı yok (zar çekmez)
  if (data.version < 40) {
    if (Array.isArray(data.characters)) {
      for (const c of data.characters) {
        if (c && typeof c === 'object') Object.assign(c, { loyalty: 0, weddingDay: null, specialDay: null });
      }
    }
    data.rites = { pending: [], active: null, names: [], held: 0, condolences: 0, celebrated: 0, forgotten: 0 };
    if (data.trust?.revolt && typeof data.trust.revolt === 'object') data.trust.revolt.leaderId = null;
  }
  // (30.4a) v40 -> v41: her mevsim bir yaş. Gün cinsinden yaş 16 günlük yaştan bugünkü AGING.daysPerAge'e ölçeklenir (yaş ve yaş içindeki
  // ilerleme korunur, aşağı yuvarlama); kuşak yaşı (ageInDays - agedDays) aynı oranla ölçeklenir. ENGINES.swiftAging kapalıyken değişmez. Zar çekmez.
  if (data.version < 41 && Array.isArray(data.characters)) {
    for (const c of data.characters) {
      if (!c || typeof c !== 'object' || !Number.isFinite(c.ageInDays) || c.ageInDays < 0) continue;
      const days = rescaleAgeDays(c.ageInDays);
      const cohort = rescaleAgeDays(Math.max(0, c.ageInDays - (Number.isFinite(c.agedDays) ? Math.max(0, c.agedDays) : 0)));
      if (Number.isFinite(c.agedDays)) c.agedDays = Math.max(0, Math.min(days, days - cohort));
      c.ageInDays = days;
    }
  }
  // (29.3) v37 -> v38: her sakine boş arzu / korku listeleri, 50 doyum, boş sonuç kaydı; duruma boş sayaçlar (zar çekmez:
  // listeler yüklemeden sonraki ilk 06:00'da dolar)
  if (data.version < 38) migrateWants(data);
  // (28.4) v34 -> v35: tohumdan deterministik Vadi Karakteri, boş Kasaba Doktrini
  if (data.version < 35) {
    data.valley = valleyFor(data.seed);
    data.doctrine = { chosen: null, day: null };
  }
  // (28.3) v33 -> v34: herkese kimliğinden ve tohumdan türeyen deterministik ömür (80-90 yaş), hiç kimse Saygın Büyük değil; yaşam evresi sayaçlarına vefat alanları
  if (data.version < 34) {
    if (Array.isArray(data.characters)) {
      for (const c of data.characters) {
        if (c && typeof c === 'object') {
          c.isVenerable = false;
          c.lifespan = lifespanFor(lifeSeedOf(data), c.id);
        }
      }
    }
    if (data.lifeStages && typeof data.lifeStages === 'object') {
      Object.assign(data.lifeStages, { venerables: 0, deaths: 0, accidents: 0, lastDeath: null });
    }
  }
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
  if (bindChemistry) migrateChemistry(data);
  if (Array.isArray(data.buildings)) {
    for (const b of data.buildings) {
      if (b && LEGACY_BUILDING_TYPES[b.type]) b.type = LEGACY_BUILDING_TYPES[b.type];
    }
  }
  return data;
}

const BROKEN_PREFIX = 'lmgame.save.broken.';
const MAX_BROKEN = 3;
let brokenNotice = false; // (32.7) açılışta "Bir kayıt okunamadı ve yedeklendi." uyarısı için

/** Ham metni kayda çevirir (JSON, sürüm, göç). Okunamazsa nedeniyle birlikte hata fırlatır. */
function parseRaw(raw) {
  const data = JSON.parse(raw);
  const supported = data && typeof data === 'object' && data.version >= CONFIG.SAVE_MIN_VERSION && data.version <= CONFIG.SAVE_VERSION;
  if (!supported) throw new Error(`desteklenmeyen kayıt sürümü ${data?.version}`);
  return migrate(data);
}

const storageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const SaveManager = {
  parseRaw,

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

  /** Yuvadaki ham metin ya da null (yok / depolama erişilemez). */
  readRaw(slot = 'main') {
    return storageGet(SLOT_KEYS[slot]);
  },

  /**
   * (32.7) Yuvadaki kayıt ya da null (yok, bozuk ya da desteklenmeyen sürümden). Okunamayan kayıt SİLİNMEZ:
   * ham metin önce yedek anahtarına kopyalanır, yalnızca yedek yazıldıysa yuva temizlenir.
   */
  read(slot = 'main') {
    const raw = storageGet(SLOT_KEYS[slot]);
    if (!raw) return null;
    try {
      return parseRaw(raw);
    } catch (err) {
      console.warn(`${slot} kaydı okunamadı:`, err);
      this.quarantine(slot);
      return null;
    }
  },

  /**
   * (32.7) Yuvanın ham verisini `lmgame.save.broken.<yuva>.<zaman damgası>` anahtarına kopyalar (en çok 3 yedek, en eskisi
   * silinir), sonra yuvayı temizler. Yedek yazılamazsa yuva olduğu gibi kalır. Dönüş: yedek anahtarı ya da null.
   */
  quarantine(slot = 'main', { clear = true } = {}) {
    const raw = storageGet(SLOT_KEYS[slot]);
    if (raw === null) return null;
    const key = this.backupRaw(slot, raw);
    if (key === null) return null;
    brokenNotice = true;
    if (clear) this.clear(slot);
    return key;
  },

  /** Ham metni yedek anahtarına yazar ve sınırı uygular. Dönüş: anahtar ya da null. */
  backupRaw(slot, raw) {
    try {
      let ts = Date.now();
      while (localStorage.getItem(`${BROKEN_PREFIX}${slot}.${ts}`) !== null) ts += 1;
      const key = `${BROKEN_PREFIX}${slot}.${ts}`;
      localStorage.setItem(key, raw);
      const all = this.listBroken(); // eskiden yeniye
      for (const old of all.slice(0, Math.max(0, all.length - MAX_BROKEN))) if (old.key !== key) this.removeBroken(old.key);
      return key;
    } catch (err) {
      console.warn('Yedek yazılamadı:', err);
      return null;
    }
  },

  /** Yedekler, eskiden yeniye: [{ key, slot, ts, size }]. */
  listBroken() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(BROKEN_PREFIX)) continue;
        const [slot, ts] = key.slice(BROKEN_PREFIX.length).split('.');
        out.push({ key, slot, ts: Number(ts) || 0, size: (localStorage.getItem(key) ?? '').length });
      }
    } catch {
      /* depolama erişilemez */
    }
    return out.sort((a, b) => a.ts - b.ts || a.key.localeCompare(b.key));
  },

  readBroken(key) {
    return key?.startsWith(BROKEN_PREFIX) ? storageGet(key) : null;
  },

  removeBroken(key) {
    try {
      if (key?.startsWith(BROKEN_PREFIX)) localStorage.removeItem(key);
    } catch {
      /* depolama erişilemez */
    }
  },

  /** Yeni bir yedek oluştuysa true döner ve uyarıyı sıfırlar. */
  takeNotice() {
    const had = brokenNotice;
    brokenNotice = false;
    return had;
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
