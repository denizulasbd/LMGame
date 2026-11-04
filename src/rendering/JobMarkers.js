// İş emri verilmiş hedeflerin üstündeki simgeler (balta, kazma, sepet) ve ilerleme çubuğu.
// Şantiyeler kendi çekiç + ilerleme çubuğunu çizer (Building.drawOverlay).
import { JOBS } from '../data/jobs.js';
import { getIconSprite } from '../art/ui/index.js';

const TALL_OBJECTS = new Set(['oak', 'pine']);

export function drawJobMarkers(renderer, jobs, time) {
  for (const job of jobs) {
    if (job.type === 'build') continue;
    const offsetY = TALL_OBJECTS.has(job.object) ? -24 : job.buildingId ? -8 : -6;
    const bob = Math.sin(time * 3 + job.id) > 0 ? 0 : 1;
    const x = job.x * 16 + 3;
    const y = job.y * 16 + offsetY + bob;
    renderer.drawImage(getIconSprite(JOBS[job.type].marker), x, y);
    // (14. aşama) Öncelikli hedef: simgenin yanında yanıp sönen kırmızı ünlem
    if (job.urgent && Math.floor(time * 4) % 2 === 0) {
      renderer.fillRect(x + 10, y - 1, 2, 5, '#1b1423');
      renderer.fillRect(x + 10, y + 5, 2, 2, '#1b1423');
      renderer.fillRect(x + 10, y, 1, 3, '#e8463c');
      renderer.fillRect(x + 10, y + 5, 1, 1, '#e8463c');
    }

    if (job.progress > 0) {
      const ratio = Math.min(1, job.progress / job.work);
      renderer.fillRect(x - 2, y + 10, 13, 4, '#1b1423');
      renderer.fillRect(x - 1, y + 11, 11, 2, '#7d5233');
      renderer.fillRect(x - 1, y + 11, Math.round(11 * ratio), 2, '#ffd23f');
    }
  }
}
