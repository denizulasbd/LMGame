// Stres matrisi: birkaç tohumda ve hızda otopilotlu uzun simülasyonları paralel koşturur, bekçi raporlarını toplar.
// Her koşu ayrı bir tarayıcıdır (autopilot.mjs --json); sonunda tablo ve toplam basılır.
//
// Kullanım: node tools/sim/stress.mjs [--seeds 7,13,21,42,77,101] [--speeds 4,2,1] [--days 50] [--jobs 4] [--out klasör]
// Çıkış kodu: herhangi bir koşuda sayfa hatası, takılan sakin, kopuk referans ya da taşan ev varsa 1.
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from './lib.mjs';

const { options } = parseArgs();
const seeds = String(options.seeds ?? '7,13,21,42,77,101').split(',').map(Number);
const speeds = String(options.speeds ?? '4,2,1').split(',').map(Number);
const days = Number(options.days ?? 50);
const jobs = Number(options.jobs ?? Math.max(1, Math.min(4, os.cpus().length)));
const out = options.out ?? fs.mkdtempSync(path.join(os.tmpdir(), 'lmgame-stress-'));
fs.mkdirSync(out, { recursive: true });
const here = path.dirname(fileURLToPath(import.meta.url));

const queue = [];
// En uzun koşular (1x) önce başlasın ki sona tek başına kalmasın
for (const speed of [...speeds].sort((a, b) => a - b)) for (const seed of seeds) queue.push({ seed, speed });

const results = [];
const started = Date.now();
async function worker() {
  while (queue.length) {
    const { seed, speed } = queue.shift();
    const json = path.join(out, `s${seed}-x${speed}.json`);
    const log = path.join(out, `s${seed}-x${speed}.log`);
    const t0 = Date.now();
    const code = await new Promise((resolve) => {
      const child = spawn(process.execPath, [path.join(here, 'autopilot.mjs'), String(seed), String(days), '--speed', String(speed), '--quiet', '--json', json], {
        stdio: ['ignore', fs.openSync(log, 'w'), fs.openSync(log, 'a')],
      });
      child.on('exit', resolve);
    });
    let data = null;
    try {
      data = JSON.parse(fs.readFileSync(json, 'utf8'));
    } catch {
      /* koşu rapor yazamadan çöktü */
    }
    const minutes = ((Date.now() - t0) / 60000).toFixed(1);
    results.push({ seed, speed, code, data, minutes, log });
    const m = data?.monitor;
    console.log(
      `${code === 0 ? 'TAMAM' : 'SORUN'} tohum ${seed} ${speed}x: ${m ? `gün ${m.day}, nüfus ${m.pop} (en çok ${m.maxPop}, ${m.children} çocuk, ${m.married} evli), seviye ${m.tier}, refah %${m.welfare}, takılma ${m.stuck.length}, kopuk ${m.brokenCount}, taşan ${m.overfullCount}, hata ${data.errors.length}` : 'rapor yok'} · ${minutes} dk`
    );
  }
}
await Promise.all(Array.from({ length: jobs }, worker));

results.sort((a, b) => a.speed - b.speed || a.seed - b.seed);
const sum = (f) => results.reduce((a, r) => a + (r.data ? f(r.data) : 0), 0);
const q = sum((d) => d.monitor.quarrels ?? 0);
const rc = sum((d) => d.monitor.reconciliations ?? 0);
console.log(`\n${results.length} koşu, ${((Date.now() - started) / 60000).toFixed(1)} dk · raporlar: ${out}`);
console.log(
  `toplam: takılma ${sum((d) => d.monitor.stuck.length)}, kopuk referans ${sum((d) => d.monitor.brokenCount)}, taşan ev ${sum((d) => d.monitor.overfullCount)}, ` +
    `bekleyen iş ${sum((d) => d.monitor.staleJobs.length)}, üretmeyen iş yeri ${sum((d) => d.monitor.stalledWorkplaces.length)}, sayfa hatası ${sum((d) => d.errors.length)}`
);
console.log(
  `olaylar: düğün ${sum((d) => d.monitor.events.weddings)}, doğum ${sum((d) => d.monitor.events.births)}, büyüme ${sum((d) => d.monitor.events.grownUp)}, ` +
    `atışma ${sum((d) => d.monitor.events.quarrels)}, barışma ${sum((d) => d.monitor.events.reconciled)}, hastalık ${sum((d) => d.monitor.events.ill)}`
);
console.log(
  `(15. aşama) barışma / atışma: ${rc}/${q} (%${q ? Math.round((rc / q) * 100) : 0}) · usta işi eser ${sum((d) => d.monitor.events.masterworks)} ` +
    `(sergilenen ${sum((d) => d.monitor.events.exhibited)}, satılan ${sum((d) => d.monitor.events.sold)}) · Usta kostümü giyen ${sum((d) => d.monitor.outfits.filter((o) => o.endsWith(':3')).length)}, ` +
    `Kalfa ${sum((d) => d.monitor.outfits.filter((o) => o.endsWith(':2')).length)} · kıyafet hatası ${sum((d) => d.monitor.outfitErrors.length)} · ` +
    `küs çift (son / en çok / toplam çift): ${sum((d) => d.monitor.feuds ?? 0)} / ${sum((d) => d.monitor.maxFeuds ?? 0)} / ${sum((d) => d.monitor.pairs ?? 0)}`
);
console.log(
  `(16. aşama) sefer ${sum((d) => d.monitor.events.expeditions)} (dönen ${sum((d) => d.monitor.events.returned)}) · macera ${sum((d) => d.monitor.events.adventures)} ` +
    `(kaza ${sum((d) => d.monitor.events.mishaps)}) · handa anlatılan hikâye ${sum((d) => d.monitor.events.tales)} · çözülen yazıt ${sum((d) => d.monitor.decoded ?? 0)} · ` +
    `dikilen asma / meşale ${sum((d) => d.monitor.exotic ?? 0)}`
);
const so = (f) => sum((d) => (d.monitor.social ? f(d.monitor.social) : 0));
console.log(
  `(19. aşama) evli çift ${so((x) => x.couples)} (aynı evde ${so((x) => x.couplesTogether)}) · sosyal sıkışma ${so((x) => x.stuck.length)} · ` +
    `randevu ${so((x) => x.dates)} · düğün kutlaması ${so((x) => x.parties)} · akşam yemeği ${so((x) => x.dinners)} · boşalan ev ${so((x) => x.homesFreed)} · ` +
    `dedikodu ${so((x) => x.gossip)} · müzik ${so((x) => x.serenades)} · hayvan sevme ${so((x) => x.cuddles)} · kitap ${so((x) => x.books)} · ` +
    `en düşük nüfus (toplam) ${so((x) => x.minPop)} · en çok evsiz ${Math.max(0, ...results.map((r) => r.data?.monitor.social?.homelessMax ?? 0))}`
);
const ga = (f) => sum((d) => (d.monitor.golden ? f(d.monitor.golden) : 0));
console.log(
  `(20. aşama) Ulu Saat Kulesi tamamlanan koşu ${results.filter((r) => r.data?.monitor.golden?.stage >= 3).length}/${results.length} · ` +
    `aşamalar ${results.map((r) => `${r.seed}:${r.data?.monitor.golden?.stage ?? '-'}`).join(' ')} · Altın Çağ günleri ${results.map((r) => r.data?.monitor.golden?.since ?? '-').join(',')} · ` +
    `çan ${ga((g) => g.chimes)} · Çağ Kutlaması ${ga((g) => g.celebrations)}`
);
const cz = (f) => sum((d) => (d.monitor.citizens ? f(d.monitor.citizens) : 0));
console.log(
  `(21. aşama) isyan ${cz((z) => z.revolts)} (${cz((z) => z.revoltHours)} saat) · yağma ${cz((z) => z.raids)} · en düşük güven ${results.map((r) => `${r.seed}:${r.data?.monitor.citizens?.trustMin ?? '-'}`).join(' ')} · ` +
    `dilekçe ${cz((z) => z.petitions.made)} (karşılanan ${cz((z) => z.petitions.fulfilled)}, reddedilen ${cz((z) => z.petitions.rejected)}, süresi dolan ${cz((z) => z.petitions.expired)}) · ` +
    `yevmiye ${cz((z) => z.wages)} altın · alışveriş ${cz((z) => z.purchases)} · çantadan yemek ${cz((z) => z.bagMeals)} · keselerde ${cz((z) => z.coins)} altın, çantalarda ${cz((z) => z.items)} eşya`
);
const kr = (f) => sum((d) => (d.monitor.crown ? f(d.monitor.crown) : 0));
console.log(
  `(22. aşama) vergi tahsilatı ${kr((k) => k.collections)} (+${kr((k) => k.taxGold)} altın, ${kr((k) => k.taxGoods)} öşür) · Krallık Vergisi ${kr((k) => k.paid)}/${kr((k) => k.levies)} ödendi (ceza ${kr((k) => k.failed)}) · ` +
    `ferman teslim ${kr((k) => k.delivered)}, başarısız ${kr((k) => k.decreesFailed)} · berat ${kr((k) => (k.statueRight ? 1 : 0))} · heykel ${kr((k) => k.statues)} · terk eden ${kr((k) => k.emigrants)} · ` +
    `son kademe ${results.map((r) => `${r.seed}:${r.data?.monitor.crown?.rate ?? '-'}`).join(' ')} · itibar ${results.map((r) => `${r.seed}:${r.data?.monitor.crown?.reputation ?? '-'}`).join(' ')}`
);
const cs = (f) => sum((d) => (d.monitor.crisis ? f(d.monitor.crisis) : 0));
console.log(
  `(23. aşama) yangın ${cs((c) => c.fires)} (söndürülen ${cs((c) => c.extinguished)}, hasar bırakan ${cs((c) => c.burned)}) · haydut baskını ${cs((c) => c.raids)} (püskürtülen ${cs((c) => c.repelled)}, haraç ${cs((c) => c.tributes)}, hazırlıksız ${cs((c) => c.caught)}) · ` +
    `yaralanma ${cs((c) => c.injuries)} (şifacıda iyileşen ${cs((c) => c.treated)}) · tamir ${cs((c) => c.repairs)} · koşu sonunda hasarlı ${cs((c) => c.damagedNow)}, yanan ${cs((c) => c.burningNow)}, yaralı ${cs((c) => c.injuredNow)} · ` +
    `Su Kuyusu ${cs((c) => c.wells)}, Gözcü Kulesi ${cs((c) => c.towers)} · 3 günü aşan hasar ${cs((c) => c.longDamaged)} · en düşük güven ${results.map((r) => `${r.seed}:${r.data?.monitor.citizens?.trustMin ?? '-'}`).join(' ')}`
);
const lf = (f) => sum((d) => (d.monitor.life ? f(d.monitor.life) : 0));
console.log(
  `(25.1) yaşam evreleri (son gün): genç ${lf((l) => l.counts.youth)}, yetişkin ${lf((l) => l.counts.adult)}, Kıdemli Bilge ${lf((l) => l.counts.elder)} (emekli ${lf((l) => l.retired)}) · ` +
    `unvanı alan bilge ${lf((l) => l.state.elders ?? 0)}, yetişkinliğe geçen genç ${lf((l) => l.state.adults ?? 0)} · nasihat ${Math.round(lf((l) => l.state.adviceMinutes ?? 0))} dk · ` +
    `işteki emekli ${lf((l) => l.retiredWorking)} · en yaşlı ${results.map((r) => `${r.seed}:${r.data?.monitor.life ? Math.max(...r.data.monitor.life.ages) : '-'}`).join(' ')}`
);
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(results.map(({ data, ...r }) => ({ ...r, monitor: data?.monitor, errors: data?.errors })), null, 1));
process.exit(results.every((r) => r.code === 0) ? 0 : 1);
