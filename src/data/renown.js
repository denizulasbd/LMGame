// (32.3) Kasaba Şöhreti: Krallık İtibarı'nın (state.crown.reputation, 0-100) günlük yeniden hesabı, kademeler ve Kraliyet Lütfu
// (gizli yapılar). Saf hesaplar systems/Renown.js, durum systems/RenownSystem.js; şalter ENGINES.renown. Denge ayarı yalnızca bu
// dosyadan yapılır. Ayrı bir "prestij" ölçüsü YOKTUR: kasabanın suç, adalet, güven, refah, Nabız, (32.4) eğitim ve (32.5) kulüp
// durumu itibarın HEDEFİNİ belirler; vergi / ferman / karar olayları itibarı yine anında iter, gün dönümünde itibar hedefe kayar.
// Adlar: kodda `prestige` (anıt bonusu), `silkPrestige` ve Kraliyet Beratı (statueRight) zaten var; burada her şey `renown` önekli.

export const RENOWN_SEED_OFFSET = 44; // izole üreteç: tohum + 44 (42 suç, 43 saray). Yalnızca Kraliyet Lütfu zarı.

// ---------------------------------------------------------------------------------------------------------------------- kayma
export const RENOWN_DRIFT = {
  share: 0.2, // gün dönümünde itibar hedefe doğru boşluğun bu payı kadar kayar
  maxStep: 4, // ... en çok bu kadar puan / gün
  minDay: 6, // ilk 5 gün kayma yok (ilk vergiye kadar başlangıç seyri aynı kalsın; yeni gün 6'dan itibaren)
  reasonDays: 2, // "neden" dökümü son 2 günün katkılarından
  reasonsKept: 3,
  tierMargin: 3, // kademe DÜŞÜŞÜ kartı / günlüğü ancak değer eşiğin bu kadar altına inince (sınırda gidip gelme bildirimi olmasın; etkiler değere göre)
};

// ---------------------------------------------------------------------------------------------------------------------- hedef
// target = base + Σ katkı, 0-100'e sınırlı. Her katkının kendi alt / üst sınırı var: tek başına hiçbiri 100'e çıkaramaz.
export const RENOWN_TARGET = {
  base: 50,
  // Suç oranı (Justice.crimeRate: son 8 günde sakin başına suç; 32.1 normal profil ~0,04-0,08): (pivot − oran) × scale
  crime: { pivot: 0.07, scale: 70, min: -10, max: 5 },
  // Çözülen oranı (solvedRatio): yalnızca son 8 günde suç varsa; (oran − pivot) × scale
  solved: { pivot: 0.5, scale: 8, min: -4, max: 4 },
  // Adalet sicili (justiceRecord, yalnızca Adalet Sarayı kararları; Muhtar uyarıları sayılmaz)
  justice: {
    fairPivot: 0.6, fairScale: 15, // (adil oran − 0,6) × 15: hepsi adil +6, hiçbiri adil değil −9
    cruelEach: -4, cruelMin: -12, // son 10 kararda her zalim karar
    impunityEach: -1.5, impunityMin: -6, // cezasızlık puanı başına
    staleEach: -1, staleMin: -3, // sürüncemede kalan dava başına (son 40 kayıt)
  },
  // Yönetim Güveni ve ortalama refah (trustWelfare): (değer − pivot) × scale, sınırlı
  trust: { pivot: 60, scale: 0.15, min: -8, max: 6 },
  welfare: { pivot: 60, scale: 0.12, min: -6, max: 4 },
  // Halkın Nabzı: yetişkinlerde Homurdanan + Kırgın payı × scale (Kırgın iki kat sayılır)
  pulse: { scale: -25, bitterWeight: 2, min: -10 },
  // (32.4) Eğitim payı ve (32.5) kulüp payı: renownEducation / renownClubs 0-1 döndürür, × weight. Bu adımda değer 0: etkisiz.
  education: { weight: 6 },
  clubs: { weight: 5 },
  // Kasaba seviyesi (1 Mezra, 2 Köy, 3 Kasaba, 4 Gelişmiş Şehir; dizin = seviye) ve Altın Çağ küçük taban artışı
  tier: [0, 0, 1, 2, 3],
  goldenAge: 3,
};

export const RENOWN_PART_LABELS = {
  crime: { up: 'Suç oranı düşük', down: 'Suç oranı yüksek' },
  solved: { up: 'Suçlar çözülüyor', down: 'Suçlar çözülmüyor' },
  justice: { up: 'Adil kararlar', down: 'Orantısız kararlar' },
  cruel: { up: 'Zalim karar', down: 'Zalim karar' },
  impunity: { up: 'Cezasızlık', down: 'Cezasızlık' },
  stale: { up: 'Sürüncemede dava', down: 'Sürüncemede dava' },
  trust: { up: 'Güven yüksek', down: 'Güven düşük' },
  welfare: { up: 'Refah yüksek', down: 'Refah düşük' },
  pulse: { up: 'Halk memnun', down: 'Halk hoşnutsuz' },
  education: { up: 'Eğitimli halk', down: 'Eğitimsiz halk' },
  clubs: { up: 'Canlı kulüpler', down: 'Kulüpsüz kasaba' },
  tier: { up: 'Kasabanın büyüklüğü', down: 'Kasabanın büyüklüğü' },
  goldenAge: { up: 'Altın Çağ', down: 'Altın Çağ' },
};

// ---------------------------------------------------------------------------------------------------------------------- kademeler
// renown açıkken REPUTATION.levels'in yerine geçer (anahtarlar 'good' / 'ok' / 'bad' korunur, en üste 'favored' eklenir).
// levy: Krallık Vergisi çarpanı, reward: ferman altın ödülü çarpanı (var olan değerler aynen).
export const RENOWN_LEVELS = [
  { min: 90, key: 'favored', name: 'Kraliyet Gözdesi', levy: 0.85, reward: 1.25 },
  { min: 75, key: 'good', name: 'Saygın', levy: 0.9, reward: 1.2 },
  { min: 40, key: 'ok', name: 'Sadık', levy: 1, reward: 1 },
  { min: 0, key: 'bad', name: 'Şüpheli', levy: 1.2, reward: 0.9 },
];
export const RENOWN_RANK = { bad: 0, ok: 1, good: 2, favored: 3 };

// ---------------------------------------------------------------------------------------------------------------------- etkiler
export const RENOWN_EFFECTS = {
  // Göç (Saygın ve üstü): yeni gelen sakin bir meslekte Kalfa olarak gelir (o meslekte SKILL_LEVELS[1].xp deneyim). Meslek
  // kimlikten türer (zar yok), nüfusa / yatağa dokunmaz.
  skilledImmigrant: { minRank: 2, skills: ['woodcutting', 'masonry', 'farming', 'building', 'crafting', 'cooking', 'fishing', 'baking'] },
  // Şüpheli: Kraliyet Fermanı'nın süresi 3 günden 2 güne iner (para cezası değil; ferman reddedilebilir)
  suspiciousDecreeMinutes: 2880,
};

export const RENOWN_TEXT = {
  rise: {
    favored: 'Krallık sarayında adınız artık saygıyla anılıyor: {town} Kraliyet Gözdesi oldu.',
    good: '{town} Krallık katında Saygın sayılıyor: tahsildar daha az, ferman ödülü daha çok.',
    ok: '{town} yeniden Krallığa Sadık bir kasaba olarak anılıyor.',
  },
  fall: {
    good: '{town} artık Kraliyet Gözdesi değil; saray hâlâ Saygın diyor.',
    ok: "{town} Saygın'lıktan düştü: Krallık katında artık yalnızca Sadık.",
    bad: '{town} Krallık katında Şüpheli! Vergi ağırlaşır, fermanlar kısa süreli gelir.',
  },
};

// ---------------------------------------------------------------------------------------------------------------------- Kraliyet Lütfu
// Kilit (nadir): Kasaba seviyesi (3) ve (Gelişmiş Şehir (4) ya da Altın Çağ); itibar art arda `streakDays` gün dönümü Gözde (≥ 90) iken her
// gün dönümünde izole zarla `chance`; en az `gapDays` gün arayla bir lütuf; sıra zarla, henüz açılmamışlardan. Kalıcıdır.
export const RENOWN_GRANT = {
  minTier: 3,
  cityTier: 4,
  streakDays: 6,
  chance: 0.15,
  gapDays: 12,
  weakenedBelowRank: 1, // kurulduktan sonra itibar Şüpheli'ye (rank 0) düşerse etkiler yarıya iner
  weakenedShare: 0.5,
};
export const ROYAL_TYPES = ['peaceFountain', 'royalRoseGarden', 'royalArchive'];
export const ROYAL_CATEGORY = 'Kraliyet Lütfu';

export const ROYAL_EFFECTS = {
  peaceFountain: { crimeRisk: 0.85 }, // kasaba çapında suç riski çarpanı (Justice.riskFactors → renown)
  royalRoseGarden: { happiness: 2, romance: 1.2 }, // refah +2 (townHappinessBonus), aşk / evlilik olasılığı ×1,2
  royalArchive: { research: 1.15 }, // araştırma ve yazıt çözme hızı ×1,15
};

export const ROYAL_LETTER = {
  title: 'Kraliyet Lütufnamesi',
  seal: 'Mühr-i Hümayun',
  lead: '{town} halkına,',
  body: {
    peaceFountain: 'Adaletiniz ve huzurunuz saraya ulaştı. Meydanınıza Barış Çeşmesi kurulmasına izin veriyoruz: suyu sakin, sokakları sakin olsun.',
    royalRoseGarden: 'Kasabanızın zarafeti katımızda anılır oldu. Saray bahçıvanlarının gül fidanlarını size bağışlıyoruz: bir Kraliyet Gül Bahçesi kurun.',
    royalArchive: 'Sadakatinizin kaydı tutulsun. Kasabanıza Kraliyet Arşivi kurma izni veriyoruz: bilgeleriniz saray defterlerinden yararlansın.',
  },
  close: 'Bu lütuf kalıcıdır. İnşa Et → Kraliyet Lütfu.',
};
