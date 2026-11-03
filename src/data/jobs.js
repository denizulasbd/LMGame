// Oyuncunun verdiği iş emirleri. Hangi nesneden ne çıktığı data/tiles.js (harvest)
// ve data/buildings.js (harvest, buildWork) içinde; burada iş türlerinin ortak kuralları var.
//   marker     : hedefin üzerinde görünen simge (art/ui)
//   maxWorkers : aynı işe aynı anda kaç kişi girebilir
//   priority   : küçük olan önce yapılır (inşaat > hasat)
export const JOBS = {
  build: { name: 'İnşaat', marker: 'hammer', maxWorkers: 2, priority: 0 },
  chop: { name: 'Ağaç Kesimi', marker: 'axe', maxWorkers: 1, priority: 1 },
  mine: { name: 'Taş Kırma', marker: 'pickaxe', maxWorkers: 1, priority: 1 },
  forage: { name: 'Böğürtlen Toplama', marker: 'basket', maxWorkers: 1, priority: 1 },
};

// Bir çalışma oturumunun uzunluğu (oyun dakikası); sonra karakter ihtiyaçlarına bakıp yeniden karar verir
export const WORK_SESSION = [50, 90];
