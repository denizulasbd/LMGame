// (17. aşama) İnce üst bilgi çubuğu: ekranın en üstünde yarı saydam, tek satırlık HUD.
//   Sol  : kasaba adı ve unvanı (tıklayınca ad değişir), seviye arması ve dört seviye pipi (üzerine gelince sonraki
//          seviyenin koşulları)
//   Orta : mevsim ve günü, gün / saat, gün evresi ve hava simgesi, Duraklat ve 1x / 2x / 4x, ses düğmesi
//   Sağ  : Odun / Taş / Yiyecek (miktar / depo, değişince +5 / -10 vurgusu), Kasaba Hazinesi (Altın), açılır "Mallar"
//          listesi (Yün, Demir, Ekmek, Keten, Şerbetçiotu: depo, üreticiler ve bugünkü üretim; açık / kapalı tercihi hatırlanır), refah
//          göstergesi ve nüfus (üzerine gelince göç koşulları)
//   Altında: etkin kasaba bonusları ve uyarılar (ısınma, hasta, sefer, fırtına, festival) küçük çipler hâlinde.
// (21. aşama) Refah göstergesinin yanında küçük kalkanla Yönetim Güveni (üzerine gelince güven ve isyan durumu); durum
// çiplerinde açık dilekçeler (tıklayınca dilekçe sahibi seçilir) ve isyan alarmı (tıklayınca meydan havuzu / Belediye
// Konağı paneli açılır: acil erzak ve altın dağıtımı).
// Kaydet / Yükle / Yeni Harita Ayarlar penceresine, farenin altındaki karonun bilgisi harita ipucuna taşındı.
import { VALLEYS } from '../../data/valley.js';
import { DOCTRINES } from '../../data/doctrines.js';
import { LATE_GAME } from '../../data/lateGame.js';
import { lateGameActive, missingLuxuries } from '../../systems/LateGame.js';
import { activePopulation } from '../../systems/LifeStages.js';
import { CONFIG } from '../../config.js';
import { getDayPhase } from '../../systems/TimeSystem.js';
import { getIconDataURL, getAnyIconURL } from '../../art/ui/index.js';
import { RESOURCES, RESOURCE_KEYS, BASE_RESOURCE_KEYS, GOODS_KEYS } from '../../data/resources.js';
import { BUILDINGS } from '../../data/buildings.js';
import { TOWN_TIERS } from '../../data/town.js';
import { describeWeather } from '../../data/weather.js';
import { currentSeasonFestival } from '../../systems/SeasonFestivalSystem.js';
import { currentFair } from '../../systems/Fair.js';
import { currentGuest } from '../../systems/Guest.js';
import { isRallyActive } from '../../systems/RallySystem.js';
import { IMMIGRATION, TOWN_NAME_MAX_LENGTH } from '../../data/town.js';
import { getSeason } from '../../data/seasons.js';
import { heatingPerDay } from '../../systems/HeatingSystem.js';
import {
  townHappiness,
  happinessLevel,
  housingCapacity,
  immigrationStatus,
  activeBuffs,
  townTier,
  nextTownTier,
  tierChecks,
  formatTownTitle,
  foodSupply,
} from '../../systems/TownStatus.js';
import { el } from '../dom.js';
import { trustValue, trustLevel } from '../../systems/Citizens.js';
import { PETITION_KINDS, REVOLT } from '../../data/citizens.js';
import { DECREES, TAX_RATES } from '../../data/crown.js';
import { levyPlan } from '../../systems/Crown.js';
import { formatRemaining } from '../../systems/Petitions.js';
import { raidHoursLeft, defenseStatus } from '../../systems/Crisis.js';
import { productionOf, storageLimit } from '../../systems/Granary.js';
import { TOWN_BUFFS } from '../../data/town.js';
import { getCharacterPortraitURL } from '../../art/sprites/index.js';
import { moodMarkOf, markIconURL, MOOD_MARKS } from '../../rendering/ExpressionLayer.js';

/** (30.2) Üst şeridin altında aynı anda görünen en çok çip; fazlası "Olaylar" listesinde. */
export const CHIP_LIMIT = 4;

/** Çip ipucu: dört satır (ne, neden, süre, etki). */
function chipTip({ what, why, left, effect }) {
  return `Ne: ${what}\nNeden: ${why}\nSüre: ${left}\nEtki: ${effect}`;
}

/** Kasaba bonusunun etkisi (data/town.js alanlarından). */
function buffEffect(b) {
  const def = TOWN_BUFFS[b.key] ?? {};
  const parts = [];
  if (def.workSpeed) parts.push(`çalışma hızı ${def.workSpeed > 1 ? '+' : '−'}%${Math.round(Math.abs(def.workSpeed - 1) * 100)}`);
  if (def.funDecay) parts.push(`keyif %${Math.round((1 - def.funDecay) * 100)} yavaş azalır`);
  if (def.friendship) parts.push(`dostluk x${def.friendship}`);
  if (def.happiness) parts.push(`refah ${def.happiness > 0 ? '+' : ''}${def.happiness}`);
  if (def.instantFun) parts.push(`anında keyif +${def.instantFun}`);
  return `${parts.length ? parts.join(', ') : 'kasabaya küçük bir etki'}. Tıkla: Kasaba Günlüğü.`;
}

const DELTA_MERGE_MS = 500; // bu süre içindeki değişiklikler tek vurguda toplanır
const DELTA_VISIBLE_MS = 1400;
const WELFARE_REFRESH_MS = 500; // refah ve nüfus bilgisinin yenilenme aralığı
const GOODS_PREF_KEY = 'lmgame.hud.goodsExpanded'; // işlenmiş mallar satırı açık mı (tarayıcıda hatırlanır)

function readGoodsPreference() {
  try {
    return localStorage.getItem(GOODS_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

function writeGoodsPreference(expanded) {
  try {
    localStorage.setItem(GOODS_PREF_KEY, expanded ? '1' : '0');
  } catch {
    /* depolama erişilemez: tercih yalnızca bu oturumda geçerli */
  }
}

/**
 * Bir malın üreticileri ve bugünkü üretimi: { count, today }. Üretim yapısının ana ürünü (producedToday),
 * yan ürünü (extraToday) ve işleme yapısının ürünü sayılır.
 */
function producersOf(state, resource) {
  let count = 0;
  let today = 0;
  for (const b of state.buildings) {
    if (!b.functional) continue;
    const def = BUILDINGS[b.type];
    if (productionOf(b)?.resource === resource) {
      count++;
      today += b.producedToday;
    } else if (def.production?.extra?.[resource] !== undefined) {
      count++;
      today += b.extraToday ?? 0;
    } else if (def.processing?.output[resource] !== undefined) {
      count++;
      today += b.producedToday;
    }
  }
  return { count, today };
}

const pad = (n) => String(n).padStart(2, '0');

export class Hud {
  constructor(game) {
    this.slot = 'top';
    this.lastClock = '';
    this.lastIcon = '';
    this.lastWeather = '';
    this.lastControls = '';

    this.build(game);
    this.setGoodsExpanded(readGoodsPreference());

    game.events.on('resources:changed', ({ resource, delta }) => this.showDelta(resource, delta));
    game.events.on('audio:muteChanged', (muted) => {
      this.muteIcon.src = getIconDataURL(muted ? 'mute' : 'sound');
      this.muteButton.title = muted ? 'Sesi aç' : 'Sesi kapat';
      this.muteButton.classList.toggle('is-active', muted);
    });
  }

  /**
   * Refah çubuğu, "6/8 Sakin" ve etkin bonuslar. Nüfusun üzerine gelince göç koşulları görünür:
   * oyuncu yeni sakin için ev mi kurmalı, mutluluğu mu artırmalı, bir bakışta anlasın.
   */
  renderWelfare(state) {
    const happiness = Math.round(townHappiness(state));
    const level = happinessLevel(happiness);
    const population = activePopulation(state); // (28.3) Saygın Büyükler nüfus kotasına sayılmaz
    const venerable = state.characters.length - population;
    const capacity = housingCapacity(state);
    const status = immigrationStatus(state);
    const trust = Math.round(trustValue(state));
    const revolt = state.trust?.revolt ?? null;
    const key = `${happiness}|${population}|${venerable}|${capacity}|${state.landscape?.percent}|${status.checks.map((c) => c.text).join("|")}|${trust}|${Boolean(revolt)}`;
    if (key !== this.lastWelfare) {
      this.lastWelfare = key;
      this.welfareFill.style.width = `${happiness}%`;
      this.welfareFill.className = `need-fill welfare-fill is-${level.key}`;
      this.welfareValue.textContent = `%${happiness}`;
      this.welfareIcon.src = getIconDataURL(level.key === 'bad' ? 'frown' : 'smile');
      // (18. aşama) Kasabanın estetiği refaha kalıcı küçük bir çarpan ekler
      const beauty = state.landscape?.percent ? ` Kasaba estetiği (${state.landscape.score} puan): refah +%${state.landscape.percent}.` : ' Süs, fener, ağaç ve taş plakalarla kasabayı güzelleştirdikçe refah +%5\'e kadar artar.';
      // (21. aşama) Yönetim Güveni
      const tl = trustLevel(trust);
      this.trustFill.style.width = `${trust}%`;
      this.trustFill.className = `trust-mini-fill is-${revolt ? 'revolt' : tl.key}`;
      this.trustWrap.className = `trust-mini is-${revolt ? 'revolt' : tl.key}`;
      this.trustWrap.dataset.trust = String(trust);
      this.trustIcon.src = getAnyIconURL(revolt ? 'torch' : 'trust');
      const trustLine = revolt
        ? `\nYönetim Güveni: %${trust} · İSYAN sürüyor! Güven %${REVOLT.endTrust}'in üstüne çıkınca yatışır (meydan havuzu / Belediye Konağı: erzak ve altın dağıt).`
        : `\nYönetim Güveni: %${trust} (${tl.name}). Dilekçeleri karşılamak ve yüksek refah güveni artırır; reddetmek, açlık, soğuk ve %35 altı refah eritir. %${REVOLT.critical} altında uzun kalırsa isyan çıkar.`;
      this.welfareRow.title = `Refah (ortalama mutluluk): ${level.name}. Göç için en az %${IMMIGRATION.minHappiness} gerekir.${beauty}${trustLine}`;
      this.population.textContent = `${population}/${capacity}`; // (28.3) örn. 28/30 (+2 Saygın)
      this.venerable.textContent = venerable ? ` (+${venerable} Saygın)` : '';
      this.venerable.title = venerable ? `Saygın (+${venerable}): yatağı olmayan, nüfus kotasına sayılmayan bilgeler. Kasabanın büyükleri; nasihat verirler.` : '';
      this.populationWrap.classList.toggle('is-full', population >= capacity);
      this.population.classList.toggle('is-full', population >= capacity);
      const lines = status.checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.text}`);
      this.populationWrap.title = `${population} sakin / ${capacity} yatak${venerable ? ` (+${venerable} Saygın Büyük: yatağı olmayan, nüfus kotasına sayılmayan bilgeler)` : ''}. Yarın 08:00 göç koşulları:\n${lines.join('\n')}`;
    }
    const buffs = activeBuffs(state);
    const heating = Math.round(heatingPerDay(state) * 10) / 10;
    const freezing = state.heating.cold && heating > 0;
    // 11. aşama: hasta sakinler, seferdekiler, yaklaşan fırtına ve hasarlı yapılar da bu satırda
    const sick = state.characters.filter((c) => c.illness).map((c) => c.name);
    const away = state.characters.filter((c) => c.away).map((c) => c.name);
    const storm = state.dilemma?.storm;
    const damaged = state.buildings.filter((b) => b.damaged && !b.isBurning).map((b) => b.name);
    // (23. aşama) yanan yapılar, bekleyen haydut baskını, hafif yaralılar
    const burning = state.buildings.filter((b) => b.isBurning);
    const raidLeft = raidHoursLeft(state);
    const injured = state.characters.filter((c) => c.isInjured).map((c) => c.name);
    // (29.2) yasta ve ağır travmada olan sakinler (sayılar; çip tıklanınca ilk sakin seçilir)
    let mourners = 0;
    let shaken = 0;
    let griefId = -1;
    let mournerId = -1;
    for (const c of state.characters) {
      for (const m of c.moodlets) {
        if (m.key === 'mourning') {
          mourners++;
          if (mournerId < 0) mournerId = c.id;
        } else if (m.key === 'shaken' || m.key === 'heartbroken') {
          shaken++;
          if (griefId < 0) griefId = c.id;
        }
      }
    }
    if (mournerId >= 0) griefId = mournerId;
    // 14. aşama: duyurulan / süren mevsim festivali ve toplanma zili
    const festival = currentSeasonFestival(state);
    const fairNow = currentFair(state);
    const guestNow = currentGuest(state);
    const rally = isRallyActive(state) ? Math.ceil((state.rally.until - state.totalMinutes) / 10) : 0;
    // (21. aşama) açık dilekçeler ve isyan
    const petitions = state.petitions?.list ?? [];
    const revoltNow = state.trust?.revolt ?? null;
    const buffKey = `${state.valley}|${state.doctrine?.chosen}|${lateGameActive(state)}|${missingLuxuries(state).join(',')}|${buffs.map((b) => `${b.key}:${Math.ceil(b.minutesLeft / 60)}`).join('|')}|${heating}|${freezing}|${sick}|${away}|${storm?.kind}|${damaged}|${festival?.theme}:${festival?.stage}|${fairNow?.type}:${fairNow?.phase}|${guestNow?.type}:${guestNow?.guest.name}:${guestNow?.guest.leaving}|${rally}|${petitions.map((p) => `${p.id}${p.status}`).join(',')}|${revoltNow ? `${revoltNow.rioters.length}:${revoltNow.raids.length}:${revoltNow.leaderId ?? ''}` : ''}|${Math.min(50, Math.round(trustValue(state)))}|${state.tax?.rate}|${state.crown?.notice ? `${state.crown.notice.amount}:${Math.ceil((state.crown.nextLevyAt - state.totalMinutes) / 60)}:${levyPlan(state, state.crown.notice.amount).ok}` : ''}|${state.crown?.decree ? `${state.crown.decree.id}:${Math.ceil((state.crown.decree.deadline - state.totalMinutes) / 60)}` : ''}|${state.exodus?.active}|${burning.map((b) => `${b.id}:${Math.floor(b.fireProgress / 10)}`).join(',')}|${raidLeft}|${injured}|${state.buildings.filter((b) => b.damaged && (b.damageKind === 'fire' || b.damageKind === 'raid')).length}|${state.rites?.active ? `${state.rites.active.names.join()}:${state.rites.active.condolence}` : ''}|${Math.floor(state.totalMinutes / 60)}`;
    const griefKey = mourners * 10000 + shaken * 100 + (griefId % 97);
    if (buffKey !== this.lastBuffs || griefKey !== this.lastGrief) {
      this.lastBuffs = buffKey;
      this.lastGrief = griefKey;
      // (30.2) Çipler: öncelik grubu (0 kriz, 1 oyuncudan karar bekleyen, 2 süreli etki) ve ekleniş sırası; en çok CHIP_LIMIT çip
      // görünür, fazlası tek "Olaylar" listesinde. Her çipin ipucu dört şeyi söyler (ne, neden, süre, etki) ve HER çip tıklanınca bir şey yapar.
      const list = [];
      const ev = this.game.events;
      const add = (group, icon, text, tip, cls, onClick) => list.push({ group, icon, text, title: chipTip(tip), cls, onClick, seq: list.length });
      const firstOf = (types) => state.buildings.find((x) => x.functional && types.includes(x.type));
      const pick = (types, fallback) => () => {
        const target = firstOf(types);
        if (target) ev.emit('ui:selectBuilding', target.id);
        else fallback();
      };
      const openGoals = () => ev.emit('ui:toggleGoals');
      const openJournal = () => ev.emit('ui:toggleJournal');
      const hallB = state.buildings.find((x) => x.functional && BUILDINGS[x.type].civic) ?? state.buildings.find((x) => x.functional && x.type === 'fountain');
      const openHall = () => (hallB ? ev.emit('ui:selectBuilding', hallB.id) : openGoals());
      const selectChar = (id) => () => (Number.isFinite(id) && id >= 0 ? ev.emit('ui:selectCharacter', id) : openJournal());
      for (const bf of buffs) {
        add(2, bf.icon, `${bf.name} · ${Math.ceil(bf.minutesLeft / 60)} sa`, {
          what: `${bf.name}: kasabaya etkin bir bonus.`,
          why: 'Bir ferman, ikram, şenlik ya da olay bunu başlattı.',
          left: `${Math.ceil(bf.minutesLeft / 60)} oyun saati kaldı.`,
          effect: buffEffect(bf),
        }, '', openJournal);
      }
      if (heating > 0) {
        add(2, freezing ? 'cold' : 'fire', freezing ? 'Odun bitti! Evler soğuk' : `Isınma −${heating} odun/gün`, {
          what: freezing ? 'Odun tükendi, evler soğuk.' : 'Kışın evler, kamp ateşi ve açık han odun yakar.',
          why: 'Mevsim kış.',
          left: 'Kış boyunca sürer.',
          effect: freezing ? 'Soğuk sakinleri hasta eder, mutluluğu düşürür. Odun topla.' : `Günde ${heating} odun harcanır.`,
        }, freezing ? ' is-freezing' : '', pick(['lumberHut', 'storage'], openGoals));
      }
      if (lateGameActive(state) && missingLuxuries(state).length) {
        const missing = missingLuxuries(state).map((k) => LATE_GAME.luxuries[k].name);
        add(2, 'map', `Eksik lüks ${missing.length}`, {
          what: `Kasabada eksik lüks var: ${missing.join(', ')}.`,
          why: 'Geç oyunda sakinler şerbet, kumaş ve sıcak yemek bekler.',
          left: 'Lüks karşılanana kadar sürer.',
          effect: `Refah −${missing.length * LATE_GAME.perMissing}; Keyif ve Sosyallik %${Math.round((LATE_GAME.decay - 1) * 100)} çabuk azalır.`,
        }, ' is-freezing', pick(['market', 'inn'], openGoals));
      }
      if (festival?.stage === 'announced') add(2, festival.festival.icon, `${festival.festival.name} · 15:00`, { what: `${festival.festival.name} duyuruldu.`, why: festival.festival.announce, left: "Bugün 15:00'te başlar.", effect: 'Şenlik coşkusu: keyif ve sosyallik artar.' }, ' is-festival', pick(['fountain'], openJournal));
      if (fairNow?.phase === 'prep') add(2, fairNow.fair.icon, `${fairNow.fair.name} · 18:00`, { what: `${fairNow.fair.name} hazırlanıyor.`, why: fairNow.fair.start, left: "Bugün 18:00'de başlar.", effect: 'Panayır coşkusu: meydandakilerin keyfi artar.' }, ' is-festival', pick(['fountain'], openJournal));
      if (guestNow) {
        add(2, guestNow.def.icon, `${guestNow.def.name} · ${guestNow.guest.name}`, {
          what: `${guestNow.def.name} ${guestNow.guest.name} kasabaya uğradı.`,
          why: 'Gezgin konuklar zaman zaman yola düşer.',
          left: `${guestNow.guest.departureDay}. günün 09:00'una kadar.`,
          effect: 'Geçici misafir: nüfusa ve konuta sayılmaz; takas ya da ezgiyle kasabaya fayda sağlar.',
        }, ' is-festival', () => ev.emit('ui:selectGuest', true));
      }
      if (rally) add(2, 'bell', 'Meydanda toplanma', { what: 'Toplanma Zili çaldı.', why: 'Yönetim sakinleri meydana çağırdı.', left: `Yaklaşık ${rally} dakika (bir oyun saati içinde biter).`, effect: 'Sakinler işi bırakıp meydanda toplanır.' }, '', pick(['fountain'], openGoals));
      if (sick.length) {
        const firstSick = state.characters.find((c) => c.illness);
        add(2, 'sneeze', `${sick.length} hasta`, {
          what: `Üşüten sakinler: ${sick.join(', ')}.`,
          why: 'Soğuk ya da yağmur sakinleri hasta eder.',
          left: 'Şifacı iksiriyle hemen, yoksa birkaç günde iyileşirler.',
          effect: 'Hasta sakin yavaş çalışır. Tıkla: ilk hasta sakine odaklan.',
        }, ' is-freezing', selectChar(firstSick?.id));
      }
      if (away.length) add(2, 'map', `Seferde: ${away.length}`, { what: `Keşif seferindekiler: ${away.join(', ')}.`, why: 'Keşif seferine çıktılar.', left: 'Sefer bitince dönerler.', effect: 'Seferdekiler işe ve kasaba sayımına katılmaz. Tıkla: ilk sakine odaklan.' }, '', selectChar(state.characters.find((c) => c.away)?.id));
      if (storm) {
        const label = storm.kind === 'wolves' ? 'Kurt tehlikesi' : 'Fırtına yaklaşıyor';
        add(2, storm.kind === 'wolves' ? 'wolf' : 'storm', `${label}${storm.fortified ? ' · hazır' : ''}`, {
          what: `${label}.`,
          why: 'Karar penceresindeki olay yaklaşıyor.',
          left: 'Birkaç gün içinde vurur.',
          effect: storm.fortified ? 'Kasaba güçlendirildi: hasar riski düşük.' : 'Güçlendirilmedi: yapılar hasar alabilir. Tıkla: Hedefler.',
        }, storm.fortified ? '' : ' is-freezing', openGoals);
      }
      if (damaged.length) {
        const crisisDamage = state.buildings.some((x) => x.damaged && !x.isBurning && (x.damageKind === 'fire' || x.damageKind === 'raid'));
        const firstDamaged = state.buildings.find((x) => x.damaged && !x.isBurning);
        add(2, crisisDamage ? 'repair' : 'storm', `${damaged.length} hasarlı yapı`, {
          what: `Hasarlı yapılar: ${damaged.join(', ')}.`,
          why: 'Fırtına, yangın ya da baskın yapıya zarar verdi.',
          left: 'Ustalar kendiliğinden onarır; panelden pahalı "Tamir Et" hemen onarır.',
          effect: 'Hasarlı yapı verimsiz çalışır. Tıkla: ilk hasarlı yapıyı seç.',
        }, ' is-freezing', () => (firstDamaged ? ev.emit('ui:selectBuilding', firstDamaged.id) : openGoals()));
      }
      if (injured.length) add(2, 'bandage', `${injured.length} hafif yaralı`, { what: `Yaralılar: ${injured.join(', ')}.`, why: 'Yangın, baskın ya da kaza.', left: "Şifacı'da sarılırlar; yoksa 1,5 günde kendiliğinden geçer.", effect: 'Yürüme ve çalışma %20 yavaş. Tıkla: ilk yaralıya odaklan.' }, '', selectChar(state.characters.find((c) => c.isInjured)?.id));
      if (mourners + shaken > 0) {
        const text = mourners > 0 ? `🕯️ ${mourners} sakin yasta${shaken ? ` · ${shaken} acılı` : ''}` : `${shaken} sakin acılı`;
        add(2, 'candle', text, { what: 'Yas tutan, sarsılmış ya da kalbi kırık sakinler var.', why: 'Bir sevdiklerini kaybettiler ya da ağır bir şey yaşadılar.', left: 'Birkaç gün; dostların tesellisi ve anma töreni kısaltır.', effect: 'Daha yavaş çalışırlar, keyifleri çabuk kaçar. Tıkla: sakine odaklan.' }, ' hud-grief-chip', selectChar(griefId));
      }
      if (state.tax?.rate === 'heavy') add(2, 'torch', 'Ağır Vergi · verim -%15', { what: 'İç vergi Ağır.', why: 'Belediyede Ağır Vergi seçili.', left: 'Sen değiştirene kadar sürer.', effect: TAX_RATES.heavy.description }, ' is-freezing', openHall);
      const trustNow = Math.round(trustValue(state));
      if (!revoltNow && trustNow < 50) add(2, 'trust', `Güven %${trustNow}`, { what: `Yönetim Güveni düşük (${trustLevel(trustNow).name}).`, why: 'Reddedilen dilekçeler, açlık, soğuk ve düşük refah güveni eritir.', left: `%${REVOLT.critical} altında ${REVOLT.graceHours} saat kalırsa isyan çıkar.`, effect: 'Dilekleri karşıla, erzak / altın dağıt. Tıkla: Belediye.' }, ' is-freezing', openHall);
      // Krizler (grup 0)
      if (revoltNow) {
        const venue = state.buildings.find((x) => x.functional && x.type === 'fountain') ?? hallB;
        add(0, 'torch', `İsyan! ${revoltNow.rioters.length} isyancı${revoltNow.raids.length ? ' · yağma' : ''}`, {
          what: `İsyan sürüyor.${leaderOf(state, revoltNow) ? ` Elebaşı: ${leaderOf(state, revoltNow)}.` : ''}`,
          why: 'Yönetim Güveni çok uzun süre düşük kaldı.',
          left: `Güven %${REVOLT.endTrust}'in üstüne çıkınca yatışır.`,
          effect: 'Sakinler işi bıraktı, yağma olabilir. Tıkla: meydan havuzunda acil erzak ve altın dağıt.',
        }, ' is-revolt', () => (venue ? ev.emit('ui:selectBuilding', venue.id) : openGoals()));
      }
      for (const bu of burning) {
        add(0, 'fire', `${bu.name} yanıyor · %${Math.round(bu.fireProgress)}`, {
          what: `${bu.name} yanıyor.`,
          why: 'Yangın çıktı.',
          left: '%100\'e varana dek sürer; sakinler kovalarla söndürüyor.',
          effect: 'Yanan yapı hasar alır (silinmez). Tıkla: yapıyı seç, 30 altına "Acil Seferberlik" ilan et.',
        }, ' is-revolt', () => ev.emit('ui:selectBuilding', bu.id));
      }
      if (raidLeft !== null) {
        const ok = defenseStatus(state).ok;
        const when = raidLeft <= 1 ? 'birazdan' : raidLeft <= 48 ? `${raidLeft} sa` : `${Math.ceil(raidLeft / 24)} gün`;
        add(0, 'bandit', `Haydut izleri · ${when}`, {
          what: 'Ormanda haydut izleri görüldü.',
          why: 'Bir haydut baskını yaklaşıyor.',
          left: `${when} içinde vurur.`,
          effect: `Savunma ${ok ? 'yeterli' : 'yetersiz'}. Tıkla: bekçilerle püskürt, haraç öde ya da bekle.`,
        }, ok ? ' is-crown' : ' is-revolt', () => ev.emit('ui:openRaid'));
      }
      if (state.exodus?.active) add(0, 'bundle', 'Terk ediş! Sakinler köyden gidiyor', { what: 'Sakinler köyü terk ediyor.', why: 'Umut tükendi: güven ve refah çok düşük.', left: 'Güven ve refah toparlanana kadar sürer.', effect: 'En mutsuz sakinler kesesi ve çantasıyla gider, göçmen gelmez. Tıkla: Belediye.' }, ' is-revolt', openHall);
      // Oyuncudan karar bekleyenler (grup 1)
      const cr = state.crown;
      if (cr?.notice) {
        const ok = levyPlan(state, cr.notice.amount).ok;
        add(1, 'collector', `Tahsildar yolda · ${cr.notice.amount} altın · ${formatRemaining(cr.nextLevyAt - state.totalMinutes)}`, {
          what: `Kraliyet Tahsildarı ${cr.notice.amount} altın Krallık Vergisi bekliyor.`,
          why: 'Krallık düzenli vergi toplar.',
          left: `${formatRemaining(cr.nextLevyAt - state.totalMinutes)} sonra ödenir.`,
          effect: ok ? 'Hazine yetiyor: vakti gelince ödenecek.' : 'Hazine yetmiyor! Ödenemezse Krallık el koyar ve "Kraliyet Cezası" gelir. İç vergiyi ayarla. Tıkla: Belediye.',
        }, ok ? ' is-crown' : ' is-crown is-short', openHall);
      }
      if (cr?.decree) {
        const def = DECREES[cr.decree.kind];
        add(1, 'decree', `Ferman · ${def.name} · ${formatRemaining(cr.decree.deadline - state.totalMinutes)}`, { what: `Kraliyet Fermanı: "${def.text}"`, why: 'Krallık senden bir teslimat istiyor.', left: `${formatRemaining(cr.decree.deadline - state.totalMinutes)} içinde teslim edilmeli.`, effect: "Teslim edilirse itibar ve ödül kazanılır. Tıkla: Belediye Konağı'ndan teslim et." }, ' is-crown', openHall);
      }
      for (const pt of petitions) {
        add(1, 'scroll', `Dilekçe · ${pt.name}`, {
          what: `${PETITION_KINDS[pt.kind].name}: "${pt.text}"${pt.status === 'accepted' ? ' (söz verildi)' : ''}`,
          why: `${pt.name} senden bir şey istiyor.`,
          left: `${formatRemaining(pt.deadline - state.totalMinutes)} içinde yanıtlanmalı.`,
          effect: 'Karşılanırsa güven artar; reddedilirse eriyebilir. Tıkla: sakini seç.',
        }, pt.status === 'accepted' ? ' is-petition is-accepted' : ' is-petition', () => ev.emit('ui:selectCharacter', pt.characterId));
      }
      if (state.rites?.active) {
        const rite = state.rites.active;
        add(1, 'candle', `Anma töreni · ${rite.names.join(', ')}`, {
          what: `${rite.names.join(', ')} için anma töreni.`,
          why: 'Bir sakin vefat etti.',
          left: 'Tören akşamı 19:00\'da biter.',
          effect: rite.condolence ? 'Taziye Sofrası kuruldu: yas kısalır, sadakat artar.' : 'Taziye Sofrası (20 yiyecek + 10 altın) kurarsan yas daha çabuk geçer. Tıkla: tören yerini seç.',
        }, '', () => {
          const venue = rite.place !== null && rite.place !== undefined ? state.buildings.find((x) => x.id === rite.place) : null;
          if (venue) ev.emit('ui:selectBuilding', venue.id);
          else openJournal();
        });
      }
      list.sort((x, y) => x.group - y.group || x.seq - y.seq);
      const shownChips = list.slice(0, CHIP_LIMIT);
      const rest = list.slice(CHIP_LIMIT);
      const make = (d) => {
        const bt = el('button', { className: `buff-chip is-action is-click${d.cls}`, type: 'button', title: d.title, tabIndex: -1 }, [el('img', { src: getAnyIconURL(d.icon), alt: '' }), d.text]);
        bt.addEventListener('mousedown', (e) => e.preventDefault());
        bt.addEventListener('click', () => {
          this.setMoreOpen(false);
          d.onClick();
        });
        return bt;
      };
      const chips = shownChips.map(make);
      this.moreList.replaceChildren(...rest.map(make));
      this.moreButton.hidden = rest.length === 0;
      this.moreCount.textContent = String(rest.length);
      this.moreButton.title = chipTip({ what: `${rest.length} olay daha var.`, why: `Çubukta en çok ${CHIP_LIMIT} çip görünür (kriz, karar bekleyenler, süreli etkiler sırasıyla).`, left: 'Her olayın kendi süresi çipinde yazar.', effect: 'Tıkla: listeyi aç / kapat.' });
      if (!rest.length) this.setMoreOpen(false);
      this.chipList = list;
      this.buffs.hidden = chips.length === 0 && rest.length === 0;
      this.buffs.replaceChildren(...chips, this.moreWrap);
      this.resources.wood.box.title = heating > 0 ? `Odun · ısınma gideri −${heating}/gün\n${RESOURCES.wood.hint}` : `Odun\n${RESOURCES.wood.hint}`;
    }
  }

  /**
   * Kasaba adı + unvan ("Yeşilvadi Kasabası"), seviye armaları ve ipucunda sonraki seviyenin koşulları.
   */
  renderTitle(state) {
    const tier = townTier(state);
    const next = nextTownTier(state);
    const checks = next ? tierChecks(state, next) : [];
    const key = `${state.townName}|${tier.tier}|${checks.map((c) => `${c.current}:${c.ok}`).join(',')}|${state.valley}|${state.doctrine?.chosen}`;
    if (key === this.lastTitle) return;
    this.lastTitle = key;
    this.townName.textContent = formatTownTitle(state.townName, tier);
    this.tierIcon.src = getIconDataURL(tier.icon);
    this.tierPips.forEach((pip, i) => pip.classList.toggle('is-on', i < tier.tier));
    const lines = [`${tier.name} (${tier.tier}/${TOWN_TIERS.length})`];
    if (next) {
      lines.push(`Sonraki seviye: ${next.name}`);
      for (const c of checks) lines.push(`${c.ok ? '✓' : '✗'} ${c.text}`);
      lines.push(`Ödül: ${next.perks.join(' · ')}`);
    } else {
      lines.push('En yüksek seviye: kasaban artık gelişmiş bir şehir!');
    }
    lines.push('', 'Adı değiştirmek için tıkla · Ayrıntılar: Hedefler (O)');
    const valley = VALLEYS[state.valley];
    const doctrine = DOCTRINES[state.doctrine?.chosen];
    const place = `${formatTownTitle(state.townName, tier)}\nVadi Karakteri: ${valley?.name ?? '-'}. ${valley?.description ?? ''}\n${doctrine ? `Kasaba Doktrini: ${doctrine.name}. ${doctrine.description}` : 'Kasaba Doktrini: henüz seçilmedi (Bilgelik Evi araştırması ya da Belediye fermanıyla seçilir).'}\n\n`;
    this.townName.title = place + lines.join('\n');
    this.tierBadge.title = lines.slice(0, -2).join('\n');
    this.tierBadge.classList.toggle('is-ready', Boolean(next) && checks.every((c) => c.ok));
  }

  /** İşlenmiş mallar satırı: açıkken her malın üreticileri ve bugünkü üretimi; Yiyecek ipucunda toplam besin. */
  renderGoodsDetail(state) {
    const supply = Math.floor(foodSupply(state));
    const bread = state.resources.bread ?? 0;
    this.resources.food.box.title = bread > 0
      ? `Yiyecek · kilerdeki toplam besin değeri ${supply} (${bread} ekmek × 2,5 dahil)\n${RESOURCES.food.hint}`
      : `Yiyecek\n${RESOURCES.food.hint}`;
    for (const key of GOODS_KEYS) {
      const slot = this.resources[key];
      if (RESOURCES[key].treasury) {
        // Kasaba Hazinesi (12. aşama): depo sınırı yok; liman teknelerinin getirdiği altın
        const trade = state.trade;
        const text = trade.shipments ? `${trade.shipments} sefer · +${trade.goldEarned}` : 'liman teknesi bekleniyor';
        if (slot.detail.textContent !== text) slot.detail.textContent = text;
        slot.box.title = `${RESOURCES[key].longName}: ${state.resources[key]} (sınırsız)\n${RESOURCES[key].hint}\n${trade.shipments ? `${trade.shipments} ihracat seferinden toplam ${trade.goldEarned} altın` : 'Henüz ihracat yapılmadı'}`;
        continue;
      }
      const { count, today } = producersOf(state, key);
      const text = count ? `${count} yapı · bugün +${today}` : 'üreten yapı yok';
      if (slot.detail.textContent !== text) slot.detail.textContent = text;
      slot.box.title = `${RESOURCES[key].longName}: ${state.resources[key]}/${storageLimit(state, key)}\n${RESOURCES[key].hint}\n${count ? `${count} yapı üretiyor, bugün +${today}` : 'Henüz üreten yapı yok'}`;
    }
  }

  /** "Mallar" açılır listesi (Yün, Demir, Ekmek, Keten, Şerbetçiotu: depo, üreticiler, bugünkü üretim); tercih hatırlanır. */
  setGoodsExpanded(expanded) {
    this.goodsExpanded = expanded;
    this.goodsMenu.hidden = !expanded;
    this.goodsToggle.classList.toggle('is-active', expanded);
    this.goodsToggle.title = expanded ? 'İşlenmiş malları gizle' : 'İşlenmiş mallar: Yün, Demir, Ekmek, Keten, Şerbetçiotu, Kumaş, Fıçı Şerbeti (depo ve üreticiler)';
    for (const key of GOODS_KEYS) this.resources[key].last = ''; // miktar metni yeniden yazılsın
    writeGoodsPreference(expanded);
  }

  /** Kaynak değişince yanında yükselip kaybolan +5 / -10 vurgusu. */
  showDelta(resource, delta) {
    const slot = this.resources[resource];
    if (!slot) return;
    const now = performance.now();
    const recent = slot.lastDelta && now - slot.lastDelta.at < DELTA_MERGE_MS && Math.sign(slot.lastDelta.value) === Math.sign(delta);
    if (recent) {
      slot.lastDelta.value += delta;
      slot.lastDelta.at = now;
      slot.lastDelta.node.textContent = formatDelta(slot.lastDelta.value);
      return;
    }
    const node = el('span', { className: `resource-delta ${delta > 0 ? 'is-gain' : 'is-loss'}`, text: formatDelta(delta) });
    slot.box.append(node);
    slot.lastDelta = { value: delta, at: now, node };
    setTimeout(() => node.remove(), DELTA_VISIBLE_MS);
  }

  build(game) {
    this.icon = el('img', { className: 'hud-icon', alt: '' });
    this.weatherIcon = el('img', { className: 'hud-icon hud-weather', alt: '' });
    this.day = el('span', { className: 'hud-day' });
    this.clock = el('span', { className: 'hud-clock' });
    this.phase = el('span', { className: 'hud-phase' });

    // Kasaba adı: tıklayınca metin kutusuna döner, Enter ile kaydedilir ('ui:renameTown')
    this.townName = el('button', { className: 'hud-town-name', type: 'button', title: 'Kasabanın adını değiştirmek için tıkla', tabIndex: -1 });
    this.townInput = el('input', { className: 'hud-town-input', type: 'text', maxLength: TOWN_NAME_MAX_LENGTH, hidden: true });
    this.townName.addEventListener('click', () => this.editTownName(true));
    this.townInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.editTownName(false, true);
      if (e.key === 'Escape') this.editTownName(false, false);
    });
    this.townInput.addEventListener('blur', () => this.editTownName(false, true));
    // Seviye: arması ve dört pip (Mezra, Köy, Kasaba, Gelişmiş Şehir)
    this.tierIcon = el('img', { className: 'hud-icon hud-tier-icon', alt: '' });
    this.tierPips = TOWN_TIERS.map(() => el('span', { className: 'tier-pip' }));
    this.tierBadge = el('span', { className: 'hud-tier' }, this.tierPips);
    this.lastTitle = '';
    this.lastTownName = null;
    this.game = game;
    this.seasonIcon = el('img', { className: 'hud-icon', alt: '' });
    this.seasonText = el('span', { className: 'hud-season' });

    // Butonlar odak almasın: aksi halde Boşluk tuşu odaklı butona tıklar ve
    // duraklatma iki kez tetiklenir.
    const button = (label, title, onClick) => {
      const b = el('button', { className: 'hud-btn', type: 'button', text: label, title, tabIndex: -1 });
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', onClick);
      return b;
    };

    this.pauseButton = button('❚❚', 'Duraklat (Boşluk)', () => game.events.emit('time:togglePause'));
    this.speedButtons = CONFIG.TIME_SPEEDS.map((speed, i) => {
      const b = button(`${speed}x`, `${speed} kat hız (${i + 1})`, () => game.events.emit('time:setSpeed', speed));
      b.dataset.speed = String(speed);
      return b;
    });
    this.pausedBadge = el('span', { className: 'hud-paused', text: 'DURDU' });
    this.population = el('span', { className: 'hud-population' });
    this.venerable = el('span', { className: 'hud-venerable' }); // (30.2) kendi ipucu var
    this.populationWrap = el('span', { className: 'hud-chip hud-pop' }, [el('img', { className: 'hud-icon', src: getAnyIconURL('people'), alt: '' }), this.population, this.venerable]);
    this.muteButton = button('', 'Sesi kapat / aç', () => game.events.emit('ui:toggleMute'));
    this.muteIcon = el('img', { className: 'hud-btn-icon', alt: '' });
    this.muteButton.append(this.muteIcon);
    this.muteButton.classList.add('hud-mute');

    // Refah: küçük gösterge (simge, çubuk, yüzde)
    this.welfareIcon = el('img', { className: 'hud-icon', alt: '' });
    this.welfareFill = el('span', { className: 'need-fill welfare-fill' });
    this.welfareValue = el('span', { className: 'welfare-value' });
    // (21. aşama) Yönetim Güveni: refah çipinin içinde küçük kalkan ve yüzde
    // (ince üst çubuk dar: güven, refah çubuğunun altında ikinci ince çubuk ve sağda küçük kalkan; yüzdesi ipucunda)
    this.trustFill = el('span', { className: 'trust-mini-fill' });
    this.trustIcon = el('img', { className: 'hud-icon trust-icon', src: getAnyIconURL('trust'), alt: '' });
    this.trustWrap = el('span', { className: 'trust-mini' }, [this.trustIcon]);
    this.welfareRow = el('span', { className: 'hud-chip hud-welfare' }, [
      this.welfareIcon,
      el('span', { className: 'welfare-bars' }, [el('span', { className: 'need-bar welfare-bar' }, [this.welfareFill]), el('span', { className: 'trust-mini-bar' }, [this.trustFill])]),
      this.welfareValue,
      this.trustWrap,
    ]);
    this.buffs = el('div', { className: 'hud-buffs ui-interactive' });
    // (30.2) "Olaylar ▾ (N)": çubuğa sığmayan çipler
    this.moreCount = el('span');
    this.moreButton = el('button', { className: 'buff-chip is-more', type: 'button', tabIndex: -1, hidden: true }, [el('span', { text: 'Olaylar ▾ (' }), this.moreCount, el('span', { text: ')' })]);
    this.moreButton.addEventListener('mousedown', (e) => e.preventDefault());
    this.moreButton.addEventListener('click', () => this.setMoreOpen(this.moreList.hidden));
    this.moreList = el('div', { className: 'panel hud-more-list ui-interactive', hidden: true });
    this.moreWrap = el('span', { className: 'hud-more' }, [this.moreButton, this.moreList]);
    this.watch = el('div', { className: 'watch-strip ui-interactive', hidden: true });
    this.watchKey = '';
    this.under = el('div', { className: 'hud-under' }, [this.buffs, this.watch]);
    this.chipList = [];
    this.lastWelfare = '';
    this.lastBuffs = '';
    this.welfareAt = -Infinity; // ilk karede hemen çizilsin

    this.resources = {};
    const resourceBox = (key, goods) => {
      const amount = el('span', { className: 'resource-amount' });
      const detail = el('span', { className: 'resource-detail' });
      const box = el('span', { className: `resource${goods ? ' is-goods' : ''}`, title: `${RESOURCES[key].name}\n${RESOURCES[key].hint}` }, [
        el('img', { className: 'resource-icon', src: getIconDataURL(RESOURCES[key].icon), alt: '' }),
        el('span', { className: 'resource-text' }, [
          ...(goods ? [el('span', { className: 'resource-name', text: RESOURCES[key].name })] : []),
          amount,
          ...(goods ? [detail] : []),
        ]),
      ]);
      this.resources[key] = { box, amount, detail, last: '' };
      return box;
    };
    // Temel kaynaklar ve hazine üst çubukta; işlenmiş mallar açılır listede
    const goodsKeys = GOODS_KEYS.filter((k) => !RESOURCES[k].treasury);
    const treasuryKeys = GOODS_KEYS.filter((k) => RESOURCES[k].treasury);
    const resourceBoxes = [...BASE_RESOURCE_KEYS, ...treasuryKeys].map((key) => resourceBox(key, false));
    this.goodsSummary = el('span', { className: 'goods-summary' });
    this.goodsToggle = button('', '', () => this.setGoodsExpanded(!this.goodsExpanded));
    this.goodsToggle.classList.add('goods-toggle');
    this.goodsToggle.append(el('img', { className: 'hud-btn-icon', src: getIconDataURL(RESOURCES.bread.icon), alt: '' }), el('span', { text: 'Mallar' }), this.goodsSummary, el('span', { className: 'goods-caret', text: '▾' }));
    this.goodsMenu = el('div', { className: 'hud-goods-menu', hidden: true }, goodsKeys.map((key) => resourceBox(key, true)));
    this.goodsWrap = el('span', { className: 'hud-goods' }, [this.goodsToggle, this.goodsMenu]);

    const zone = (cls, children) => el('div', { className: `hud-zone ${cls}` }, children);
    this.element = el('div', { className: 'panel hud topbar ui-interactive' }, [
      zone('hud-zone-town', [this.tierIcon, this.townName, this.townInput, this.tierBadge]),
      zone('hud-zone-time', [
        el('span', { className: 'hud-chip hud-season-chip' }, [this.seasonIcon, this.seasonText]),
        el('span', { className: 'hud-chip hud-clock-chip' }, [this.icon, this.day, this.clock, this.weatherIcon]),
        el('span', { className: 'hud-speed' }, [this.pauseButton, ...this.speedButtons]),
        this.pausedBadge,
        this.muteButton,
      ]),
      zone('hud-zone-res', [...resourceBoxes, this.goodsWrap, this.welfareRow, this.populationWrap]),
      this.under,
    ]);
  }

  setMoreOpen(open) {
    this.moreList.hidden = !open;
    this.moreButton.classList.toggle('is-open', open);
  }

  /** Kasaba adını düzenlemeye başlar / bitirir (commit: yazılanı kaydet). */
  editTownName(editing, commit = false) {
    if (editing) {
      this.townInput.value = this.game.state.townName;
      this.townName.hidden = true;
      this.townInput.hidden = false;
      this.townInput.focus();
      this.townInput.select();
      return;
    }
    if (this.townInput.hidden) return;
    this.townInput.hidden = true;
    this.townName.hidden = false;
    if (commit) this.game.events.emit('ui:renameTown', this.townInput.value);
  }

  render(game) {
    this.weatherState = game.state.weather;
    this.renderTime(game.state.time);
    const now = performance.now();
    // Unvan ve seviye ipucu yarım saniyede bir (ad değişince hemen) yenilenir
    if (now - this.welfareAt >= WELFARE_REFRESH_MS || game.state.townName !== this.lastTownName) {
      this.welfareAt = now;
      this.lastTownName = game.state.townName;
      this.renderTitle(game.state);
      this.renderWelfare(game.state);
      this.renderGoodsDetail(game.state);
    }
    for (const key of RESOURCE_KEYS) {
      const slot = this.resources[key];
      const treasury = Boolean(RESOURCES[key].treasury); // hazinenin (altın) depo sınırı yok
      const compact = (RESOURCES[key].processed && !this.goodsExpanded) || treasury;
      const limit = storageLimit(game.state, key); // (24. aşama) tarımsal kaynaklarda Ürün Silosu dahil
      const text = compact ? String(game.state.resources[key]) : `${game.state.resources[key]}/${limit}`;
      if (text !== slot.last) {
        slot.last = text;
        slot.amount.textContent = text;
        slot.box.classList.toggle('is-full', !treasury && game.state.resources[key] >= limit);
        slot.box.classList.toggle('is-empty', game.state.resources[key] === 0);
      }
    }
    this.renderWatch(game.state);
    this.renderGoodsSummary(game.state);
  }

  /** (30.2) Yakından izlenen sakinlerin küçük portreleri: ruh hali işareti, ipucunda etkinlik; tıklayınca seçer. */
  renderWatch(state) {
    const list = (state.watched ?? []).map((id) => state.characters.find((c) => c.id === id)).filter(Boolean);
    const key = list.map((c) => `${c.id}:${moodMarkOf(c)}:${c.activityLabel}`).join('|');
    if (key === this.watchKey) return;
    this.watchKey = key;
    this.watch.hidden = list.length === 0;
    this.watch.replaceChildren(
      ...list.map((c) => {
        const mark = moodMarkOf(c);
        const b = el('button', { className: 'watch-item', type: 'button', tabIndex: -1, title: `${c.name} (yakından izleniyor)\n${c.activityLabel}${mark ? `\nRuh hali: ${MOOD_MARKS[mark].name}` : ''}` }, [
          el('img', { className: 'watch-portrait', src: getCharacterPortraitURL(c.appearance, c.look), alt: c.name }),
          ...(mark ? [el('img', { className: 'watch-mark', src: markIconURL(mark), alt: '' })] : []),
          el('img', { className: 'watch-star', src: getAnyIconURL('star'), alt: '' }),
        ]);
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', () => this.game.events.emit('ui:selectCharacter', c.id));
        return b;
      })
    );
  }

  /** "Mallar" düğmesinin yanında işlenmiş malların toplamı (açılır liste kapalıyken bir bakışta). */
  renderGoodsSummary(state) {
    const total = GOODS_KEYS.filter((k) => !RESOURCES[k].treasury).reduce((a, k) => a + (state.resources[k] ?? 0), 0);
    const text = String(total);
    if (this.goodsSummary.textContent !== text) this.goodsSummary.textContent = text;
  }

  renderTime(time) {
    const clock = `${time.day}|${time.hour}|${time.minute}`;
    if (clock !== this.lastClock) {
      this.lastClock = clock;
      const phase = getDayPhase(time.hour);
      this.day.textContent = `Gün ${time.day}`;
      this.clock.textContent = `${pad(time.hour)}:${pad(time.minute)}`;
      this.phase.textContent = phase.name;
      this.icon.title = phase.name;
      const season = getSeason(time.day);
      this.seasonText.textContent = `${season.name} ${season.dayOfSeason}/${season.daysInSeason}`;
      this.seasonText.parentElement.title = `${season.name}: mevsimin ${season.dayOfSeason}. günü (${season.daysInSeason} günde biri) · ${season.year}. yıl`;
      if (season.key !== this.lastSeason) {
        this.lastSeason = season.key;
        this.seasonIcon.src = getIconDataURL(season.icon);
      }
      if (phase.icon !== this.lastIcon) {
        this.lastIcon = phase.icon;
        this.icon.src = getIconDataURL(phase.icon);
      }
    }

    const weather = describeWeather(this.weatherState, time.hour + time.minute / 60, getSeason(time.day).key);
    if (weather.key !== this.lastWeather) {
      this.lastWeather = weather.key;
      this.weatherIcon.src = getIconDataURL(weather.icon);
      this.weatherIcon.title = `Hava: ${weather.name}`;
    }

    const controls = `${time.paused}|${time.speed}`;
    if (controls !== this.lastControls) {
      this.lastControls = controls;
      this.pauseButton.classList.toggle('is-active', time.paused);
      this.pausedBadge.classList.toggle('is-visible', time.paused);
      for (const b of this.speedButtons) {
        b.classList.toggle('is-active', !time.paused && Number(b.dataset.speed) === time.speed);
      }
    }
  }
}

function formatDelta(value) {
  return value > 0 ? `+${value}` : String(value);
}

/** (29.6) İsyan elebaşının adı (yoksa null). */
function leaderOf(state, revolt) {
  return Number.isFinite(revolt?.leaderId) ? state.characters.find((c) => c.id === revolt.leaderId)?.name ?? null : null;
}
