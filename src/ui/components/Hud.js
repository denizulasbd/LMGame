// Sol üstteki bilgi paneli: gün, saat, hava durumu simgesi, gün evresi, hız kontrolleri, nüfus,
// kasaba kaynakları (miktar / depo kapasitesi, değişince +5 / -10 vurgusu), Kaydet / Yükle /
// Yeni Harita düğmeleri, ses aç / kapat, kasaba refahı (ortalama mutluluk), nüfus / konut kapasitesi,
// etkin kasaba bonusları ve farenin altındaki karonun bilgisi.
// 10. aşama: kasaba adının yanında seviye unvanı ("Yeşilvadi Kasabası"), seviye armaları (4 pip, üzerine
// gelince sonraki seviyenin koşulları) ve kaynak çubuğunun altında işlenmiş mallar satırı (Yün, Demir, Ekmek):
// özet görünümde yalnızca simge ve miktar, açılınca depo kapasitesi ve her malın üreticileri ile bugünkü
// üretimi. Seçim tarayıcıda hatırlanır.
import { CONFIG } from '../../config.js';
import { getDayPhase } from '../../systems/TimeSystem.js';
import { getIconDataURL, getAnyIconURL } from '../../art/ui/index.js';
import { RESOURCES, RESOURCE_KEYS, BASE_RESOURCE_KEYS, GOODS_KEYS } from '../../data/resources.js';
import { BUILDINGS } from '../../data/buildings.js';
import { TOWN_TIERS } from '../../data/town.js';
import { JOBS } from '../../data/jobs.js';
import { describeWeather } from '../../data/weather.js';
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

const DELTA_MERGE_MS = 500; // bu süre içindeki değişiklikler tek vurguda toplanır
const DELTA_VISIBLE_MS = 1400;
const WELFARE_REFRESH_MS = 500; // refah ve nüfus bilgisinin yenilenme aralığı
const CONFIRM_TIMEOUT_MS = 6000; // "Yeni Harita" onayı bu sürede verilmezse vazgeçilir
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
    if (def.production?.resource === resource) {
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
    this.slot = 'left';
    this.hoverInfo = null;
    this.hoverDirty = true;
    this.lastClock = '';
    this.lastIcon = '';
    this.lastWeather = '';
    this.confirmTimer = null;
    this.lastControls = '';

    this.build(game);
    this.setGoodsExpanded(readGoodsPreference());

    game.events.on('map:hover', (info) => {
      this.hoverInfo = info;
      this.hoverDirty = true;
    });
    game.events.on('resources:changed', ({ resource, delta }) => this.showDelta(resource, delta));
    game.events.on('save:changed', (info) => this.showSaveInfo(info));
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
    const population = state.characters.length;
    const capacity = housingCapacity(state);
    const status = immigrationStatus(state);
    const key = `${happiness}|${population}|${capacity}|${status.checks.map((c) => c.text).join('|')}`;
    if (key !== this.lastWelfare) {
      this.lastWelfare = key;
      this.welfareFill.style.width = `${happiness}%`;
      this.welfareFill.className = `need-fill welfare-fill is-${level.key}`;
      this.welfareValue.textContent = `%${happiness}`;
      this.welfareIcon.src = getIconDataURL(level.key === 'bad' ? 'frown' : 'smile');
      this.welfareRow.title = `Ortalama mutluluk: ${level.name}. Göç için en az %${IMMIGRATION.minHappiness} gerekir.`;
      this.population.textContent = `${population}/${capacity} Sakin`;
      this.population.classList.toggle('is-full', population >= capacity);
      const lines = status.checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.text}`);
      this.population.title = `Sakin / yatak. Yarın 08:00 göç koşulları:\n${lines.join('\n')}`;
    }
    const buffs = activeBuffs(state);
    const heating = Math.round(heatingPerDay(state) * 10) / 10;
    const freezing = state.heating.cold && heating > 0;
    // 11. aşama: hasta sakinler, seferdekiler, yaklaşan fırtına ve hasarlı yapılar da bu satırda
    const sick = state.characters.filter((c) => c.illness).map((c) => c.name);
    const away = state.characters.filter((c) => c.away).map((c) => c.name);
    const storm = state.dilemma?.storm;
    const damaged = state.buildings.filter((b) => b.damaged).map((b) => b.name);
    const buffKey = `${buffs.map((b) => `${b.key}:${Math.ceil(b.minutesLeft / 60)}`).join('|')}|${heating}|${freezing}|${sick}|${away}|${storm?.kind}|${damaged}`;
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
      if (sick.length) chips.push(chip('sneeze', `${sick.length} hasta`, `Üşütenler: ${sick.join(', ')}. Şifacı Kulübesi'nde iksirle hemen iyileşirler.`, ' is-freezing'));
      if (away.length) chips.push(chip('map', `Seferde: ${away.length}`, `Keşif seferindekiler: ${away.join(', ')}`));
      if (storm) {
        const label = storm.kind === 'wolves' ? 'Kurt tehlikesi' : 'Fırtına yaklaşıyor';
        chips.push(chip(storm.kind === 'wolves' ? 'wolf' : 'storm', `${label}${storm.fortified ? ' · hazır' : ''}`, storm.fortified ? 'Kasaba güçlendirildi' : 'Güçlendirilmedi: hasar verebilir', storm.fortified ? '' : ' is-freezing'));
      }
      if (damaged.length) chips.push(chip('storm', `${damaged.length} hasarlı yapı`, `Onarılmalı: ${damaged.join(', ')}`, ' is-freezing'));
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
    lines.push('', 'Adı değiştirmek için tıkla · Ayrıntılar: Hedefler (G)');
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
      const { count, today } = producersOf(state, key);
      const text = count ? `${count} yapı · bugün +${today}` : 'üreten yapı yok';
      if (slot.detail.textContent !== text) slot.detail.textContent = text;
      slot.box.title = `${RESOURCES[key].longName}: ${state.resources[key]}/${state.storageCapacity}\n${RESOURCES[key].hint}\n${count ? `${count} yapı üretiyor, bugün +${today}` : 'Henüz üreten yapı yok'}`;
    }
  }

  setGoodsExpanded(expanded) {
    this.goodsExpanded = expanded;
    this.goodsRow.classList.toggle('is-expanded', expanded);
    this.goodsToggle.textContent = expanded ? '▾' : '▸';
    this.goodsToggle.title = expanded ? 'İşlenmiş malları özet görünüme al' : 'İşlenmiş malları aç: depo ve üreticiler';
    for (const key of GOODS_KEYS) this.resources[key].last = ''; // miktar metni yeniden yazılsın
    writeGoodsPreference(expanded);
  }

  /** Kayıt var mı / ne zaman alındı: "Yükle" düğmesini ve bilgi satırını günceller. */
  showSaveInfo({ exists, label }) {
    this.loadButton.disabled = !exists;
    this.saveInfo.textContent = exists ? `Kayıt: ${label}` : 'Henüz kayıt yok';
    this.loadButton.title = exists ? `Son kayda dön (${label})` : 'Yüklenecek kayıt yok';
  }

  setConfirming(confirming) {
    clearTimeout(this.confirmTimer);
    this.saveButtons.hidden = confirming;
    this.confirmRow.hidden = !confirming;
    if (confirming) this.confirmTimer = setTimeout(() => this.setConfirming(false), CONFIRM_TIMEOUT_MS);
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
    this.townRow = el('div', { className: 'hud-row hud-town' }, [this.tierIcon, this.townName, this.townInput, this.tierBadge]);
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
    this.muteButton = button('', 'Sesi kapat / aç', () => game.events.emit('ui:toggleMute'));
    this.muteIcon = el('img', { className: 'hud-btn-icon', alt: '' });
    this.muteButton.append(this.muteIcon);
    this.muteButton.classList.add('hud-mute');

    // Refah: ortalama mutluluk çubuğu, ardından etkin kasaba bonusları
    this.welfareIcon = el('img', { className: 'hud-icon', alt: '' });
    this.welfareFill = el('span', { className: 'need-fill welfare-fill' });
    this.welfareValue = el('span', { className: 'welfare-value' });
    this.welfareRow = el('div', { className: 'hud-row hud-welfare' }, [
      this.welfareIcon,
      el('span', { className: 'welfare-label', text: 'Refah' }),
      el('span', { className: 'need-bar welfare-bar' }, [this.welfareFill]),
      this.welfareValue,
    ]);
    this.buffs = el('div', { className: 'hud-buffs' });
    this.lastWelfare = '';
    this.lastBuffs = '';
    this.welfareAt = -Infinity; // ilk karede hemen çizilsin

    this.saveButton = button('Kaydet', 'Oyunu kaydet (her sabah 06:00\'da otomatik kayıt da alınır)', () => game.events.emit('ui:save'));
    this.loadButton = button('Yükle', 'Son kayda dön', () => game.events.emit('ui:load'));
    this.newButton = button('Yeni Harita', 'Rastgele yeni bir harita ile baştan başla', () => this.setConfirming(true));
    this.saveInfo = el('span', { className: 'hud-save-info' });
    this.saveButtons = el('div', { className: 'hud-row hud-save' }, [this.saveButton, this.loadButton, this.newButton]);
    const confirmYes = button('Evet, baştan başla', 'Mevcut oyun silinir', () => {
      this.setConfirming(false);
      game.events.emit('ui:newGame');
    });
    confirmYes.classList.add('is-danger');
    const confirmNo = button('Vazgeç', 'Oyuna devam et', () => this.setConfirming(false));
    this.confirmRow = el('div', { className: 'hud-row hud-save hud-confirm', hidden: true }, [
      el('span', { className: 'hud-confirm-text', text: 'Yeni harita? Kaydedilmemiş ilerleme kaybolur.' }),
      confirmYes,
      confirmNo,
    ]);

    this.tileName = el('span', { className: 'hud-tile-name' });
    this.coords = el('span', { className: 'hud-coords' });
    this.statusDot = el('span', { className: 'status-dot' });
    this.statusText = el('span');

    this.resources = {};
    const resourceBox = (key, goods) => {
      const amount = el('span', { className: 'resource-amount' });
      const detail = el('span', { className: 'resource-detail' });
      const box = el('span', { className: `resource${goods ? ' is-goods' : ''}`, title: `${RESOURCES[key].name}\n${RESOURCES[key].hint}` }, [
        el('img', { className: 'resource-icon', src: getIconDataURL(RESOURCES[key].icon), alt: '' }),
        el('span', { className: 'resource-text' }, [
          el('span', { className: 'resource-name', text: RESOURCES[key].name }),
          amount,
          ...(goods ? [detail] : []),
        ]),
      ]);
      this.resources[key] = { box, amount, detail, last: '' };
      return box;
    };
    const resourceBoxes = BASE_RESOURCE_KEYS.map((key) => resourceBox(key, false));
    // İşlenmiş mallar: özet (simge + miktar) ya da açık (kapasite, üreticiler, bugünkü üretim)
    this.goodsToggle = button('▸', '', () => this.setGoodsExpanded(!this.goodsExpanded));
    this.goodsToggle.classList.add('goods-toggle');
    this.goodsRow = el('div', { className: 'hud-row hud-goods' }, [
      this.goodsToggle,
      el('span', { className: 'goods-label', text: 'Mallar' }),
      ...GOODS_KEYS.map((key) => resourceBox(key, true)),
    ]);

    this.element = el('div', { className: 'panel hud ui-interactive' }, [
      this.townRow,
      el('div', { className: 'hud-row' }, [this.icon, this.day, this.clock, this.weatherIcon]),
      el('div', { className: 'hud-row hud-season-row' }, [this.seasonIcon, this.seasonText, this.phase]),
      el('div', { className: 'hud-row' }, [this.pauseButton, ...this.speedButtons, this.muteButton, this.pausedBadge, this.population]),
      this.welfareRow,
      this.buffs,
      el('div', { className: 'hud-row hud-resources' }, resourceBoxes),
      this.goodsRow,
      this.saveButtons,
      this.confirmRow,
      this.saveInfo,
      el('div', { className: 'hud-divider' }),
      el('div', { className: 'hud-row' }, [this.tileName, this.coords]),
      el('div', { className: 'hud-row hud-status' }, [this.statusDot, this.statusText]),
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
      const compact = RESOURCES[key].processed && !this.goodsExpanded;
      const text = compact ? String(game.state.resources[key]) : `${game.state.resources[key]}/${game.state.storageCapacity}`;
      if (text !== slot.last) {
        slot.last = text;
        slot.amount.textContent = text;
        slot.box.classList.toggle('is-full', game.state.resources[key] >= game.state.storageCapacity);
        slot.box.classList.toggle('is-empty', game.state.resources[key] === 0);
      }
    }
    if (this.hoverDirty) {
      this.renderTile(this.hoverInfo);
      this.hoverDirty = false;
    }
  }

  renderTime(time) {
    const clock = `${time.day}|${time.hour}|${time.minute}`;
    if (clock !== this.lastClock) {
      this.lastClock = clock;
      const phase = getDayPhase(time.hour);
      this.day.textContent = `Gün ${time.day}`;
      this.clock.textContent = `${pad(time.hour)}:${pad(time.minute)}`;
      this.phase.textContent = phase.name;
      const season = getSeason(time.day);
      this.seasonText.textContent = `${season.name} · Gün ${season.dayOfSeason}/${season.daysInSeason}`;
      this.seasonText.title = `${season.year}. yıl`;
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

  renderTile(info) {
    if (!info) {
      this.tileName.textContent = 'Bir karonun üzerine gel';
      this.coords.textContent = '';
      this.statusDot.className = 'status-dot';
      this.statusText.textContent = '—';
      return;
    }

    this.coords.textContent = `${info.x}, ${info.y}`;

    if (info.character) {
      this.tileName.textContent = info.character.name;
      this.statusDot.className = 'status-dot is-info';
      this.statusText.textContent = info.character.visitor ? 'Gezgin tüccar · tıkla ve takas et' : 'Kasaba sakini · tıkla ve incele';
      return;
    }
    if (info.building) {
      this.tileName.textContent = info.building.name;
      this.statusDot.className = 'status-dot is-info';
      const job = info.job && info.job !== 'build' ? ` · Emir: ${JOBS[info.job].name}` : '';
      this.statusText.textContent = `${info.building.detail ?? 'Geçilemez'}${job}`;
      return;
    }
    if (info.job) {
      this.tileName.textContent = info.objectName ?? info.tileName;
      this.statusDot.className = 'status-dot is-info';
      this.statusText.textContent = `Emir verildi: ${JOBS[info.job].name}`;
      return;
    }

    const variant = info.variantName && info.variantName !== 'Sade' && !info.biomeHint ? ` (${info.variantName})` : '';
    const object = info.objectName ? ` · ${info.objectName}` : '';
    this.tileName.textContent = `${info.tileName}${variant}${object}`;

    let status = 'Geçilemez';
    let tone = 'is-bad';
    if (info.buildable) {
      status = 'İnşa Edilebilir';
      tone = 'is-ok';
    } else if (info.walkable) {
      status = 'Yürünebilir · İnşa Edilemez';
      tone = 'is-warn';
    }
    this.statusDot.className = `status-dot ${tone}`;
    this.statusText.textContent = info.biomeHint ? `${status} · ${info.biomeHint}` : status;
  }
}

function formatDelta(value) {
  return value > 0 ? `+${value}` : String(value);
}
