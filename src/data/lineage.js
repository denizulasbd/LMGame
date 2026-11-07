// (25. aşama, 25.4) Aile Kütüğü, yeni evlilikler ve konut mirası. Hesaplar src/systems/Lineage.js (saf) ve LineageSystem.js'te;
// burada yalnızca adlar ve sayılar var.
//
// Soy verisi (her sakinde): generation (1: kurucular ve göçmenler, 2: onların kasabada doğan çocukları, 3: torunlar...),
// parents (doğum ebeveynleri; köyden ayrılsalar da kayıtta kalır: kardeş evliliği engeli bunu kullanır), familyId (soyun ocak
// kimliği; çocuk ilk ebeveyninin ocağını taşır), children (kasabada doğan çocukları).
//
// Yeni Yuva (Altın Çağ kuşağı): kasabanın Altın Çağı başladıktan sonra evlenen ve en az biri 2. kuşak olan çift, kasabada boş bir
// kulübe varsa oraya taşınır; yoksa ebeveyn evinde "Geniş Aile" olarak yaşar ya da (aynı çatı altında yer yoksa) Belediye
// Konağı'na "Yeni Konut Talebi" dilekçesi verir. Ocak Devri: Kıdemli Bilge olan ocak reisi, evli yetişkin çocuğuna reisliği devreder.
// Bu katman KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 30); yalnızca eşit uzaklıktaki boş kulübeler arasında seçer.

// Kartta kuşak adı: [kurucu, göçmen] / 2. kuşak / 3. ve sonrası
export const GENERATION_NAMES = {
  founder: '1. Kuşak Kurucu',
  settler: '1. Kuşak Göçmen',
  second: '2. Kuşak Kasabalı',
  later: (n) => `${n}. Kuşak Torun`,
};

export const NEW_HOME = {
  // Geniş Aile: ebeveynlerden birinin evinde yaşayan evli 2. kuşak çift; ev doluysa (ya da ayrı kaldılarsa) dilekçe verirler
  petitionKind: 'newHome',
};

// Ocak adı: soyun kurucusunun adından ("Zeynep Ocağı")
export function familyName(founderName) {
  return `${founderName} Ocağı`;
}
