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
          c.lifespan = lifespanFor(data.seed, c.id);
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
