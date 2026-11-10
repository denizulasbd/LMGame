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
      this.population.textContent = `${population}/${capacity}${venerable ? ` (+${venerable} Saygın)` : ''}`; // (28.3) örn. 28/30 (+2 Saygın)
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
    // 14. aşama: duyurulan / süren mevsim festivali ve toplanma zili
    const festival = currentSeasonFestival(state);
    const fairNow = currentFair(state);
    const guestNow = currentGuest(state);
    const rally = isRallyActive(state) ? Math.ceil((state.rally.until - state.totalMinutes) / 10) : 0;
    // (21. aşama) açık dilekçeler ve isyan
    const petitions = state.petitions?.list ?? [];
    const revoltNow = state.trust?.revolt ?? null;
    const buffKey = `${state.valley}|${state.doctrine?.chosen}|${lateGameActive(state)}|${missingLuxuries(state).join(',')}|${buffs.map((b) => `${b.key}:${Math.ceil(b.minutesLeft / 60)}`).join('|')}|${heating}|${freezing}|${sick}|${away}|${storm?.kind}|${damaged}|${festival?.theme}:${festival?.stage}|${fairNow?.type}:${fairNow?.phase}|${guestNow?.type}:${guestNow?.guest.name}:${guestNow?.guest.leaving}|${rally}|${petitions.map((p) => `${p.id}${p.status}`).join(',')}|${revoltNow ? `${revoltNow.rioters.length}:${revoltNow.raids.length}` : ''}|${Math.min(50, Math.round(trustValue(state)))}|${state.tax?.rate}|${state.crown?.notice ? `${state.crown.notice.amount}:${Math.ceil((state.crown.nextLevyAt - state.totalMinutes) / 60)}:${levyPlan(state, state.crown.notice.amount).ok}` : ''}|${state.crown?.decree ? `${state.crown.decree.id}:${Math.ceil((state.crown.decree.deadline - state.totalMinutes) / 60)}` : ''}|${state.exodus?.active}|${burning.map((b) => `${b.id}:${Math.floor(b.fireProgress / 10)}`).join(',')}|${raidLeft}|${injured}|${state.buildings.filter((b) => b.damaged && (b.damageKind === 'fire' || b.damageKind === 'raid')).length}`;
    if (buffKey !== this.lastBuffs) {
      this.lastBuffs = buffKey;
      const chips = buffs.map((b) =>
        el('span', { className: 'buff-chip', title: b.name }, [
          el('img', { src: getAnyIconURL(b.icon), alt: '' }),
          `${b.name} · ${Math.ceil(b.minutesLeft / 60)} sa`,
        ])
      );
      // Kışın ısınma gideri (ya da odun bittiyse uyarı)
      if (heating > 0) {
        chips.unshift(
          el('span', { className: `buff-chip heating-chip${freezing ? ' is-freezing' : ''}`, title: 'Kışın evler, yanan kamp ateşi ve açık han odun yakar' }, [
            el('img', { src: getAnyIconURL(freezing ? 'cold' : 'fire'), alt: '' }),
            freezing ? 'Odun bitti! Evler soğuk' : `Isınma −${heating} odun/gün`,
          ])
        );
      }
      const chip = (icon, text, title, cls = '') =>
        el('span', { className: `buff-chip${cls}`, title }, [el('img', { src: getAnyIconURL(icon), alt: '' }), text]);
      // (28.4) Vadi Karakteri (oyunun başından beri), Kasaba Doktrini ve geç oyun beklentisi: üst çubuğun altındaki çip satırında
      {
        const valley = VALLEYS[state.valley];
        const doctrine = DOCTRINES[state.doctrine?.chosen];
        const late = lateGameActive(state);
        const missing = missingLuxuries(state).map((k) => LATE_GAME.luxuries[k].name);
        const title = `Vadi Karakteri: ${valley?.name}. ${valley?.description ?? ''}\n${doctrine ? `Kasaba Doktrini: ${doctrine.name}. ${doctrine.description}` : 'Kasaba Doktrini: henüz seçilmedi (Bilgelik Evi araştırması ya da Belediye fermanıyla seçilir).'}${late ? `\nGeç oyun beklentisi: Keyif ve Sosyallik %${Math.round((LATE_GAME.decay - 1) * 100)} çabuk azalır; ${missing.length ? `EKSİK lüks: ${missing.join(', ')} (refah -${missing.length * LATE_GAME.perMissing})` : 'lüks kalemleri tam (şerbet, kumaş, sıcak yemek)'}.` : ''}`;
        chips.unshift(
          el('span', { className: `buff-chip hud-valley-chip${late && missing.length ? ' is-freezing' : ''}`, title }, [
            el('img', { src: getAnyIconURL('map'), alt: '' }),
            el('span', { className: 'hud-valley', text: `${valley?.name ?? '-'}${doctrine ? ` · ${doctrine.name.replace(' Doktrini', '')}` : ''}${late && missing.length ? ` · eksik lüks ${missing.length}` : ''}` }),
          ])
        );
      }
      if (festival?.stage === 'announced') chips.unshift(chip(festival.festival.icon, `${festival.festival.name} · 15:00`, festival.festival.announce, ' is-festival'));
      if (fairNow?.phase === 'prep') chips.unshift(chip(fairNow.fair.icon, `${fairNow.fair.name} · 18:00`, fairNow.fair.start, ' is-festival'));
      if (guestNow) chips.push(chip(guestNow.def.icon, `${guestNow.def.name} · ${guestNow.guest.name}`, `${guestNow.def.name} ${guestNow.guest.name} kasabaya uğradı (${guestNow.guest.departureDay}. günün 09:00'una kadar). Geçici misafir: nüfusa ve konuta sayılmaz.`, ' is-festival'));
      if (rally) chips.push(chip('bell', 'Meydanda toplanma', 'Toplanma Zili çaldı: sakinler bir saatliğine meydanda'));
      if (sick.length) chips.push(chip('sneeze', `${sick.length} hasta`, `Üşütenler: ${sick.join(', ')}. Şifacı Kulübesi'nde iksirle hemen iyileşirler.`, ' is-freezing'));
      if (away.length) chips.push(chip('map', `Seferde: ${away.length}`, `Keşif seferindekiler: ${away.join(', ')}`));
      if (storm) {
        const label = storm.kind === 'wolves' ? 'Kurt tehlikesi' : 'Fırtına yaklaşıyor';
        chips.push(chip(storm.kind === 'wolves' ? 'wolf' : 'storm', `${label}${storm.fortified ? ' · hazır' : ''}`, storm.fortified ? 'Kasaba güçlendirildi' : 'Güçlendirilmedi: hasar verebilir', storm.fortified ? '' : ' is-freezing'));
      }
      if (damaged.length) {
        const crisisDamage = state.buildings.some((b) => b.damaged && !b.isBurning && (b.damageKind === 'fire' || b.damageKind === 'raid'));
        chips.push(chip(crisisDamage ? 'repair' : 'storm', `${damaged.length} hasarlı yapı`, `Onarılmalı (ustalar kendiliğinden ya da panelden pahalı "Tamir Et"): ${damaged.join(', ')}`, ' is-freezing'));
      }
      if (injured.length) chips.push(chip('bandage', `${injured.length} hafif yaralı`, `Yürüme ve çalışma %20 yavaş: ${injured.join(', ')}. Şifacı Kulübesi'nde sarılırlar; yoksa 1,5 günde kendiliğinden geçer.`));
      // (21. aşama) İsyan alarmı ve açık dilekçeler (tıklanabilir)
      const action = (icon, text, title, cls, onClick) => {
        const b = el('button', { className: `buff-chip is-action${cls}`, type: 'button', title, tabIndex: -1 }, [el('img', { src: getAnyIconURL(icon), alt: '' }), text]);
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', onClick);
        return b;
      };
      if (revoltNow) {
        const venue = state.buildings.find((b) => b.functional && b.type === 'fountain') ?? state.buildings.find((b) => b.functional && BUILDINGS[b.type].civic);
        chips.unshift(
          action('torch', `İsyan! ${revoltNow.rioters.length} isyancı${revoltNow.raids.length ? ' · yağma' : ''}`, 'Sakinler işi bıraktı. Tıkla: meydan havuzunda / Belediye Konağı\'nda acil erzak ve altın dağıt', ' is-revolt', () => venue && this.game.events.emit('ui:selectBuilding', venue.id))
        );
      }
      // (23. aşama) Yangın alarmı (her yanan yapı için, tıklayınca yapı seçilir) ve haydut izi (tıklayınca karar penceresi)
      for (const b of burning) {
        chips.unshift(action('fire', `${b.name} yanıyor · %${Math.round(b.fireProgress)}`, 'Sakinler kovalarla koşuyor. Tıkla: yapıyı seç, panelden 30 altına "Acil Seferberlik" ilan et (8 kişi, 2 kat hız; sonra yorgunluk). %100\'e varırsa yapı hasar alır (silinmez).', ' is-revolt', () => this.game.events.emit('ui:selectBuilding', b.id)));
      }
      if (raidLeft !== null) {
        const ok = defenseStatus(state).ok;
        const when = raidLeft <= 1 ? 'birazdan' : raidLeft <= 48 ? `${raidLeft} sa` : `${Math.ceil(raidLeft / 24)} gün`;
        chips.unshift(action('bandit', `Haydut izleri · ${when}`, `Ormanda haydut izleri görüldü. Tıkla: bekçilerle püskürt, haraç öde ya da bekle (${ok ? 'savunma yeterli' : 'savunma yetersiz'}).`, ok ? ' is-crown' : ' is-revolt', () => this.game.events.emit('ui:openRaid')));
      }
      // (22. aşama) Kraliyet Tahsildarı, Kraliyet Fermanı, Ağır Vergi ve terk ediş
      const hall = state.buildings.find((b) => b.functional && BUILDINGS[b.type].civic) ?? state.buildings.find((b) => b.functional && b.type === 'fountain');
      const openHall = () => hall && this.game.events.emit('ui:selectBuilding', hall.id);
      const cr = state.crown;
      if (state.exodus?.active) chips.unshift(action('bundle', 'Terk ediş! Sakinler köyden gidiyor', 'Umut tükendi: en mutsuz sakinler kesesi ve çantasıyla köyü terk ediyor, göçmen gelmiyor. Güveni ve refahı toparla', ' is-revolt', openHall));
      if (cr?.notice) {
        const ok = levyPlan(state, cr.notice.amount).ok;
        chips.push(action('collector', `Tahsildar yolda · ${cr.notice.amount} altın · ${formatRemaining(cr.nextLevyAt - state.totalMinutes)}`, ok ? 'Krallık Vergisi vakti gelince hazineden ödenecek' : 'Hazine yetmiyor! Ödenemezse Krallık hazineye el koyar ve depodan mal çeker. İç vergiyi ayarla', ok ? ' is-crown' : ' is-crown is-short', openHall));
      }
      if (cr?.decree) {
        const def = DECREES[cr.decree.kind];
        chips.push(action('decree', `Ferman · ${def.name} · ${formatRemaining(cr.decree.deadline - state.totalMinutes)}`, `"${def.text}" · Belediye Konağı'nın panelinden teslim et`, ' is-crown', openHall));
      }
      if (state.tax?.rate === 'heavy') chips.push(chip('torch', 'Ağır Vergi · verim -%15', `${TAX_RATES.heavy.description}`, ' is-freezing'));
      const trustNow = Math.round(trustValue(state));
      if (!revoltNow && trustNow < 50) chips.push(chip('trust', `Güven %${trustNow}`, `Yönetim Güveni düşük (${trustLevel(trustNow).name}). %${REVOLT.critical} altında ${REVOLT.graceHours} saat kalırsa isyan çıkar: dilekleri karşıla, erzak / altın dağıt`, ' is-freezing'));
      for (const p of petitions) {
        chips.push(action('scroll', `Dilekçe · ${p.name}`, `${PETITION_KINDS[p.kind].name}: "${p.text}"${p.status === 'accepted' ? ' (söz verildi)' : ''} · tıkla: sakini seç`, p.status === 'accepted' ? ' is-petition is-accepted' : ' is-petition', () => this.game.events.emit('ui:selectCharacter', p.characterId)));
      }
      this.buffs.hidden = chips.length === 0;
      this.buffs.replaceChildren(...chips);
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
    const key = `${state.townName}|${tier.tier}|${checks.map((c) => `${c.current}:${c.ok}`).join(',')}`;
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
    this.townName.title = lines.join('\n');
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
    this.populationWrap = el('span', { className: 'hud-chip hud-pop' }, [el('img', { className: 'hud-icon', src: getAnyIconURL('people'), alt: '' }), this.population]);
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
      this.buffs,
    ]);
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
    this.renderGoodsSummary(game.state);
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
