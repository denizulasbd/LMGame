// (28.4) Kasaba Doktrinleri: Bilgelik Evi araştırmaları ve Belediye fermanları üç karşılıklı dışlayan yola ayrılır. Bir doktrine bağlı
// ilk araştırma / ferman başlatıldığında doktrin SEÇİLİR (state.doctrine.chosen) ve ötekilerin araştırma / fermanları kilitlenir.
// Hiçbir doktrine bağlı olmayan (nötr) araştırma ve fermanlar herkese açıktır. Seçilen doktrinin kalıcı etkileri hemen başlar.
//   production : yapı türü -> verim çarpanı     aesthetic: çevre estetiğinin refaha katkı çarpanı (1 = değişmez)
//   granary    : tarımsal kaynakların Ürün Silosu katkısına çarpan ek (0,5 = silo +%50)
//   contract   : ihracat sözleşmesi altını çarpanı      export: liman satış değeri çarpanı      levy: Krallık Vergisi çarpanı
export const DOCTRINES = {
  industry: {
    name: 'Zanaat ve Sanayi Doktrini',
    icon: 'anvil',
    short: 'Madenler iki kat, estetik düşer',
    description: 'Dökümhaneler ve atölyeler her şeyin önünde: Taş Ocağı ve Demir Madeni verimi iki katına çıkar, Zanaat Atölyesi, Dokuma Tezgâhı ve Şerbethane +%20 çalışır; ama is ve gürültü çevre estetiğini düşürür (refah katkısı -%8).',
    production: { quarry: 2, ironMine: 2, workshop: 1.2, loom: 1.2, brewery: 1.2 },
    aesthetic: 0.92,
    when: 'Zayıf madenli Bereketli Delta\'yı dengeler; Rüzgârlı Boğaz\'ın madenlerini uçurur.',
  },
  agrarian: {
    name: 'Tarım ve Doğa Doktrini',
    icon: 'harvest',
    short: 'Bahçe, fırın ve silolar coşar, maden azalır',
    description: 'Toprağa ve mevsime bağlı yaşam: Sebze Bahçesi +%30, Fırın (Yel Değirmeni) +%40 üretir, Ürün Silosu\'nun tarımsal kapasite katkısı +%50 artar; ama maden ocaklarına işçi ayrılmaz (Taş Ocağı ve Demir Madeni -%20).',
    production: { garden: 1.3, mill: 1.4, quarry: 0.8, ironMine: 0.8 },
    granary: 0.5,
    when: 'Güneşsiz Kadim Orman\'ın bahçelerini kurtarır; Bereketli Delta\'nın bolluğunu uçurur.',
  },
  commerce: {
    name: 'Ticaret ve Diplomasi Doktrini',
    icon: 'boat',
    short: 'Sözleşme ve ihracat kazançlı, Krallık yumuşar',
    description: 'Kervanlar ve elçiler: ihracat sözleşmeleri +%30, liman satışı +%25 kazandırır, Krallık Vergisi -%30 düşer; ama kasaba yerel üretime sırt çevirir (Sebze Bahçesi ve Oduncu -%10).',
    production: { garden: 0.9, lumberHut: 0.9 },
    contract: 1.3,
    export: 1.25,
    levy: 0.7,
    when: 'Hangi vadide olursan ol kıtlığı altınla kapatmak için.',
  },
};
export const DOCTRINE_KEYS = Object.keys(DOCTRINES);
