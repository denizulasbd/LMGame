// (25. aşama, 25.5) Aile yadigârları, miras intikali ve Kuşak Şöleni. Hesaplar src/systems/Heirloom.js (saf) ve HeirloomSystem.js'te;
// burada yalnızca eşyalar, sözler ve sayılar var.
//
// İlke: yadigâr SATILMAZ, FEDA EDİLMEZ, YOK EDİLMEZ (data/citizens.js -> ITEMS: heirloom: true, locked: true). Kıdemli Bilge olan ya
// da ocağını devreden sakinin çantasında, kasabanın Altın Çağı başladıktan sonra meslek geçmişine ya da kişiliğine uygun bir yadigâr
// belirir; ertesi akşam (handoverHour) törenle evladına ya da en çok emek verdiği çırağına devreder. Taşıyan yeni nesil "Ata Mirası
// Gururu" kazanır (keyfi yavaş düşer). Kasabada ilk devirde meydanda Kuşak Şöleni kurulur ve Tarihçe'ye yazılır.
// Bu katman KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 31): yalnızca veda sözlerini seçer.

// Yadigârlar: name (çantada), noun (hikâye cümlesinde, belirtme durumu), skills (meslek geçmişi), icon
export const HEIRLOOMS = {
  heirloomHammer: { name: 'Ata Yadigârı Çekiç', noun: 'çekici', icon: 'heirloomHammer', skills: ['crafting', 'mining', 'masonry'] },
  heirloomShuttle: { name: 'Ata Yadigârı Mekik', noun: 'mekiği', icon: 'heirloomShuttle', skills: ['husbandry'], workplaces: ['loom'] },
  heirloomCompass: { name: 'Eski Seyyah Pusulası', noun: 'pusulası', icon: 'heirloomCompass', skills: ['fishing'] },
  heirloomYeast: { name: 'Kadim Maya Kavanozu', noun: 'maya kavanozu', icon: 'heirloomYeast', skills: ['baking', 'cooking'] },
  heirloomTrowel: { name: 'Usta Mala', noun: 'malası', icon: 'heirloomTrowel', skills: ['building', 'woodcutting', 'farming'] },
  heirloomJournal: { name: 'Bilge Günlüğü', noun: 'günlüğü', icon: 'heirloomJournal', skills: ['scholarship', 'herbalism'], quirks: ['philosopher', 'bookworm'] },
};
export const HEIRLOOM_KINDS = Object.keys(HEIRLOOMS);

export const HEIRLOOM = {
  handoverHour: 18, // tören saati (yadigâr belirdikten sonraki ilk akşam)
  prideFunDecay: 0.9, // Ata Mirası Gururu: taşıyanın keyfi %10 yavaş düşer
  feastMinutes: 60, // Kuşak Şöleni (ilk devirde)
  speechSeconds: 3.6,
  adoptFriendship: 40, // evladı ve çırağı yoksa yadigârı alabilecek 2. kuşak dostun en düşük ilişki puanı (manevi evlat)
};

// Devir sözleri (metin baloncuğu): {item} -> yadigârın adı (küçük harf), {heir} -> devralan
export const HANDOVER_LINES = {
  elder: ['Bu {item} artık senin evlat, hakkını ver!', 'Ocağımız sana emanet...', 'Yılların emeği bu, iyi bak ona.', 'Benden sonra sen taşı, {heir}.'],
  heir: ['Söz veriyorum, layık olacağım!', 'Ocağımız bana emanet!', 'Bunu hep yanımda taşıyacağım.', 'Sağ ol, kuşaktan kuşağa!'],
};
