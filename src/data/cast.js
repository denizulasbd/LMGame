// (33.1) Rastgele kadro: yeni oyunda başlangıç altılısının güvenlik kuralları, tanıdık yüz olasılıkları ve görünüş ayarları.
// Mantık src/systems/Residents.js'tedir (saf); burada yalnızca sayılar var.
import { STARTING_RESIDENT_COUNT } from './characters.js';

export const START_CAST = {
  count: STARTING_RESIDENT_COUNT, // başlangıçtaki sakin sayısı (6)
  // Güvenlik kuralları (ilk günlerde iş gücü, nüfus ve bilgeleşme / yadigâr akışı için)
  minWorking: { min: 20, max: 45, count: 4 }, // en az 4 kişi 20-45 yaş arası
  maxElders: { over: 55, count: 1 }, // 55 yaş üstü en çok 1 kişi
  wise: { min: 50, max: 58 }, // en az bir kişi 50-58 arası (bilgeleşme ve yadigâr akışı: eski Mehmet'in rolü)
  maxSameTrait: 2, // aynı özelliği taşıyan en çok 2 kişi
  usefulTraits: ['hardworking', 'ambitious', 'natureLover'], // işe yarar özellikler
  minUseful: 2, // en az 2 kişide bunlardan biri
  maxAttempts: 4000, // kurallar tutmazsa yeniden dener; bu kadar denemeden sonra aşağıdaki sabit plan
  // Yaş dilimleri (ağırlıklı seçim); kurallar bir denemeyi reddeder, dilimler kabul oranını yükseltir
  ageBrackets: [
    { min: 18, max: 19, weight: 1 },
    { min: 20, max: 45, weight: 8 },
    { min: 46, max: 54, weight: 1.5 },
    { min: 55, max: 64, weight: 1.2 },
  ],
  // Rastgele deneme tükenirse (pratikte hiç): kuralları kendiliğinden sağlayan sabit plan
  fallback: [
    { age: 24, traits: ['hardworking', 'cheerful'] },
    { age: 29, traits: ['ambitious', 'introvert'] },
    { age: 33, traits: ['natureLover', 'glutton'] },
    { age: 38, traits: ['socialButterfly', 'nightOwl'] },
    { age: 52, traits: ['sleepyhead', 'cheerful'] },
    { age: 21, traits: ['grumpy', 'socialButterfly'] },
  ],
};

// Tanıdık yüzler: elle yazılmış 14 karakter (data/characters.js -> RESIDENT_POOL) silinmedi, ara sıra aramıza döner
export const FAMILIAR = {
  startChance: 0.25, // yeni oyunda başlangıç altılısında biri onlardan olur
  immigrantChance: 0.1, // her göçmen için
};

// Yaşlıların saçı: bu yaştan sonra çoğu kişinin saçı gri olur
export const GRAY_HAIR = { fromAge: 55, chance: 0.8 };

// Son vefat eden, köyden ayrılan ya da sürgün edilen en çok bu kadar kişinin adı (state.recentNames) yeni gelenlere verilmez
export const RECENT_NAMES_KEEP = 12;
