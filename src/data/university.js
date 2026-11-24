// (32.4) Darülfünun: Bilgelik Evi'nin üst kademesi (lise / üniversite gibi). Bütün sayılar, adlar ve metinler bu dosyadadır;
// saf hesaplar systems/University.js, durum systems/UniversitySystem.js, arayüz ui/components/universityCards.js,
// görsel art/sprites/structuresUniversity.js. Şalter ENGINES.university; Bilgelik Evi mezunlarının (c.educated) suç riski ve
// itibardaki eğitim payı ayrıca ENGINES.educationMerit'e bağlıdır (Darülfünun kurulmasa da tarihi değiştirdiği için).
//
// İlke: Bilgelik Evi çocukların okulu olarak AYNEN kalır (ders saatleri, 360 dakikalık mezuniyet, rastgele meslekte Kalfa,
// c.educated). Darülfünun yalnızca Bilgelik Evi mezunu gençler (18-20) içindir. Rastgelelik YOK: kabul, bölüm ve mezuniyet
// kimlik, özellik ve becerilerden türer; bu katmanın üreteci yoktur.

// Kabul: gün dönümünde (00:00, yaşlanmadan sonra) boş yer kadar uygun genç alınır; fazlası sırada bekler
// (en yüksek Bilgelik Evi ilerlemesi `schooling` önce, eşitlikte küçük kimlik).
export const UNIVERSITY = {
  capacity: 6,
  // Ders: 14:00-16:00 arası, günde en çok 90 dakika (ham dakika; çarpanlar ilerlemeye uygulanır)
  hours: { from: 14, to: 16 },
  minutesPerDay: 90,
  minSession: 10, // bugün bundan az ders hakkı kaldıysa gitmez
  // Müderris kapıyı ders başlamadan biraz önce açar (yapı bu saatlerde "boşta" sayılmaz; JobSystem iş verir)
  teacherHours: { from: 13.5, to: 16 },
  // Ders çarpanları: Müderris içerideyken ×2, Kraliyet Arşivi (32.3) kuruluysa ×1,2, misafir Kıdemli Bilge içerideyken ×1,25
  professorMultiplier: 2,
  archiveMultiplier: 1.2,
  guestMultiplier: 1.25,
  // Mezuniyet: genç Yetişkin olurken toplam ilerleme (ders dakikası × çarpanlar) bu eşiği geçtiyse
  graduateMinutes: 540,
  // Mezunun bölümünde ömür boyu deneyim kazancı (SkillSystem.addExperience; çıraklığın kendi yazımlarına uygulanmaz)
  fieldXpMultiplier: 1.15,
  // Bilgelik bölümü mezunu Bilgelik Evi'nde Bilge olarak çalışırken araştırma hızı
  scholarResearch: 1.15,
  // Öğrenci çırağın telafisi (ApprenticeshipSystem.lectureCredit): ders dakikası, ustası o an tezgâhtaysa çıraklık sayılır, bu çarpanla
  // (derse gidiş-dönüş yürüyüşünü de karşılar). Ölçüm: sabit ×1,2 yetmiyordu (ustanın tezgâh saatleri öğleden sonraya yığılıyor,
  // ders o günün çıraklığının yarısını götürüyordu: 6,3 / 11,7).
  apprenticeCredit: 1.3,
  // Misafir hoca: Kıdemli Bilgenin boş zaman ağırlığı (ELDER.readLibraryBase ile çarpılır; yalnızca yapı varken ve ders saatinde)
  guestWeight: 0.6,
  // Müderris seçimi (JobSystem): eğitim seviyesi başına yapı bu kadar karo yakınmış gibi görünür (Bilgelik becerisi zaten sayılır)
  professorEducatedTiles: 6,
};

// Eğitim seviyesinin suç riskine etkisi (Justice.educationFactor): 1 = Bilgelik Evi mezunu (educationMerit), 2 = Darülfünun mezunu.
// Ders alan öğrenci (genç) ×0,8.
export const EDUCATION_CRIME = { 1: 0.85, 2: 0.65, student: 0.8 };

// İtibar hedefindeki eğitim payı (Renown.renownEducation): yetişkinler içinde (Darülfünun mezunu payı + levelOneWeight × yalnızca
// Bilgelik Evi mezunu payı), 0-1'e kırpılır. Beklenen 0-0,6 (ağırlık RENOWN_TARGET.education = 6).
export const EDUCATION_RENOWN = { levelOneWeight: 0.3 };

// Bölüm (field, bir SKILL_KEYS değeri) kabulde bir kez belirlenir:
//   (1) çırağın meslek becerisi (apprenticeship.profession → PROFESSIONS[*].skill);
//   (2) yoksa huy, sonra özellik tablosu (dizi: kimliğe göre seçilir — zar yok);
//   (3) yoksa primarySkill; o da yoksa FIELD_FALLBACK (kimliğe göre).
export const FIELD_BY_QUIRK = {
  philosopher: 'scholarship',
  bookworm: 'scholarship',
  craftsman: 'crafting',
  natureEnthusiast: ['herbalism', 'farming'],
  animalLover: 'husbandry',
  entrepreneur: 'baking',
  festive: 'cooking',
};
export const FIELD_BY_TRAIT = {
  introvert: 'scholarship',
  natureLover: ['herbalism', 'farming'],
  craftsman: 'crafting',
  glutton: 'cooking',
  hardworking: 'building',
  ambitious: 'masonry',
};
export const FIELD_FALLBACK = ['scholarship', 'herbalism', 'building', 'crafting'];

export const UNIVERSITY_TEXT = {
  name: 'Darülfünun',
  professor: 'Müderris',
  admitted: "{name} Darülfünun'a kabul edildi: {field} bölümü.",
  graduated: "{name} Darülfünun'u {field} bölümünden bitirdi.",
  dropped: "{name} Darülfünun'u yarım bıraktı ({field}, %{pct}).",
  memoryAdmitted: "Darülfünun'a {field} bölümüne kabul edildi",
  memoryGraduated: "Darülfünun'u {field} bölümünden bitirdi",
  memoryDropped: "Darülfünun'u yarım bıraktı",
  academyLine: "Mezunlar Darülfünun'a devam edebilir (Gelişmiş Şehir)",
};
