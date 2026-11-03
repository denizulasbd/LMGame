// Sol üstteki bilgi paneli: gün, saat, hava durumu simgesi, gün evresi, hız kontrolleri, nüfus,
// kasaba kaynakları (miktar / depo kapasitesi, değişince +5 / -10 vurgusu), Kaydet / Yükle /
// Yeni Harita düğmeleri, ses aç / kapat, kasaba refahı (ortalama mutluluk), nüfus / konut kapasitesi,
// etkin kasaba bonusları ve farenin altındaki karonun bilgisi.
import { CONFIG } from '../../config.js';
import { getDayPhase } from '../../systems/TimeSystem.js';
import { getIconDataURL, getAnyIconURL } from '../../art/ui/index.js';
import { RESOURCES, RESOURCE_KEYS } from '../../data/resources.js';
import { JOBS } from '../../data/jobs.js';
import { describeWeather } from '../../data/weather.js';
import { IMMIGRATION, TOWN_NAME_MAX_LENGTH } from '../../data/town.js';
import { getSeason } from '../../data/seasons.js';
import { heatingPerDay } from '../../systems/HeatingSystem.js';
import { townHappiness, happinessLevel, housingCapacity, immigrationStatus, activeBuffs } from '../../systems/TownStatus.js';
import { el } from '../dom.js';

const DELTA_MERGE_MS = 500; // bu süre içindeki değişiklikler tek vurguda toplanır
const DELTA_VISIBLE_MS = 1400;
const WELFARE_REFRESH_MS = 500; // refah ve nüfus bilgisinin yenilenme aralığı
const CONFIRM_TIMEOUT_MS = 6000; // "Yeni Harita" onayı bu sürede verilmezse vazgeçilir

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
    const buffKey = `${buffs.map((b) => `${b.key}:${Math.ceil(b.minutesLeft / 60)}`).join('|')}|${heating}|${freezing}`;
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
      this.buffs.hidden = chips.length === 0;
      this.buffs.replaceChildren(...chips);
      this.resources.wood.box.title = heating > 0 ? `Odun · ısınma gideri −${heating}/gün` : 'Odun';
    }
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
    this.townRow = el('div', { className: 'hud-row hud-town' }, [
      el('img', { className: 'hud-icon', src: getAnyIconURL('heart'), alt: '' }),
      this.townName,
      this.townInput,
    ]);
    this.lastTownName = '';
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
    const resourceBoxes = RESOURCE_KEYS.map((key) => {
      const amount = el('span', { className: 'resource-amount' });
      const box = el('span', { className: 'resource', title: RESOURCES[key].name }, [
        el('img', { className: 'resource-icon', src: getIconDataURL(RESOURCES[key].icon), alt: '' }),
        amount,
      ]);
      this.resources[key] = { box, amount, last: '' };
      return box;
    });

    this.element = el('div', { className: 'panel hud ui-interactive' }, [
      this.townRow,
      el('div', { className: 'hud-row' }, [this.icon, this.day, this.clock, this.weatherIcon]),
      el('div', { className: 'hud-row hud-season-row' }, [this.seasonIcon, this.seasonText, this.phase]),
      el('div', { className: 'hud-row' }, [this.pauseButton, ...this.speedButtons, this.muteButton, this.pausedBadge, this.population]),
      this.welfareRow,
      this.buffs,
      el('div', { className: 'hud-row hud-resources' }, resourceBoxes),
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
    if (game.state.townName !== this.lastTownName) {
      this.lastTownName = game.state.townName;
      this.townName.textContent = game.state.townName;
    }
    this.renderTime(game.state.time);
    const now = performance.now();
    if (now - this.welfareAt >= WELFARE_REFRESH_MS) {
      this.welfareAt = now;
      this.renderWelfare(game.state);
    }
    for (const key of RESOURCE_KEYS) {
      const slot = this.resources[key];
      const text = `${game.state.resources[key]}/${game.state.storageCapacity}`;
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
