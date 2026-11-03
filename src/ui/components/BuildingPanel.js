// Yapı Bilgi Paneli: haritada bir yapıya (ya da harabeye) tıklayınca sağ sütunda açılır.
//   - küçük resim (seviyesine / yıkık hâline göre), ad, seviye rozeti, kategori ve açıklama
//   - orada çalışanlar ya da yaşayanlar: isme tıklayınca sakin seçilir ve kamera ona kayar
//   - üretim: kişi başı saatlik üretim ve verim çarpanları (mevsim, ağaçlar, yağmur, biyom, seviye)
//   - stok ve türüne özgü durum satırları (handaki sıcak yemek, çalıdaki meyve, kiler...)
//   - Yükselt / Onar (maliyet ve gerekçeyle), sürmekte olan işin ilerlemesi ve iptali, Yık
//   - (9. aşama) evde yaşayan aile (eşler, çocuklar); iş yerinde çalışanları "İşten Çıkar" ile görevden
//     alma ve geri alma; zanaat atölyesinde üretim seçimi, tezgâhtaki iş ve depodaki ekipman
//   - (10. aşama) yan ürün (ağılda yiyecek, madende taş), değirmen-fırının işleme satırları (1 yiyecek -> 1
//     ekmek), ekipmanın asıl (demir / yün) ve eski usul tarifi, ağıldaki koyunlar, belediyenin etkileri
// Panel oyun durumunu yalnızca okur; istekleri olay olarak yayınlar (ui:startProject, ui:cancelProject,
// ui:demolishBuilding, ui:selectCharacter, ui:dismissWorker, ui:rehireWorker, ui:setCraftMode). Ne
// değiştiğini anlamak için her karede kısa bir anahtar üretir; anahtar değişmedikçe DOM'a dokunmaz.
import { BUILDINGS } from '../../data/buildings.js';
import { RESOURCES, RESOURCE_KEYS, formatCost } from '../../data/resources.js';
import { TOWN_HALL } from '../../data/town.js';
import { EQUIPMENT, EQUIPMENT_KEYS, CRAFT_MODES } from '../../data/equipment.js';
import { getSeason } from '../../data/seasons.js';
import { lacking } from '../../systems/Equipment.js';
import { arePartners } from '../../systems/RelationshipSystem.js';
import { getStructureSprite } from '../../art/sprites/index.js';
import { getIconDataURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

const thumbnailCache = new Map();

function thumbnailURL(type, level, ruined) {
  const key = `${type}:${level}:${ruined}`;
  if (!thumbnailCache.has(key)) thumbnailCache.set(key, getStructureSprite(type, { level, ruined }).toDataURL());
  return thumbnailCache.get(key);
}

const percent = (value) => `%${Math.round(value * 100)}`;

export class BuildingPanel {
  constructor(game) {
    this.slot = 'right';
    this.events = game.events;
    this.buildingId = null;
    this.lastKey = '';

    this.thumb = el('img', { className: 'building-thumb', alt: '' });
    this.name = el('h2', { className: 'character-name' });
    this.badge = el('span', { className: 'building-badge' });
    this.meta = el('div', { className: 'character-meta' });
    this.description = el('div', { className: 'building-description' });
    this.progress = el('div', { className: 'need-bar building-progress' }, [el('span', { className: 'need-fill need-fun' })]);
    this.people = el('div', { className: 'building-people' });
    this.crafting = el('div', { className: 'building-crafting' });
    this.lines = el('div', { className: 'building-lines' });
    this.upgrade = el('div', { className: 'building-upgrade' });
    this.tradeButton = this.button('Takas Penceresini Aç', 'Gezgin tüccarla takas et', () => this.events.emit('ui:openTrade'));
    this.tradeButton.classList.add('building-demolish');
    this.demolishButton = this.button('Yık', 'Yapıyı yık (yarı maliyet iade edilir)', () =>
      this.events.emit('ui:demolishBuilding', this.buildingId)
    );
    this.demolishButton.classList.add('building-demolish');
    const close = this.button('✕', 'Kapat (Esc)', () => this.events.emit('ui:selectBuilding', null));
    close.classList.add('character-close');

    this.element = el('div', { className: 'panel character-panel building-panel ui-interactive', hidden: true }, [
      close,
      el('div', { className: 'character-header' }, [
        el('div', { className: 'building-thumb-frame' }, [this.thumb]),
        el('div', { className: 'character-identity' }, [this.name, this.badge, this.meta]),
      ]),
      this.description,
      this.progress,
      this.people,
      this.crafting,
      this.lines,
      this.upgrade,
      this.tradeButton,
      this.demolishButton,
    ]);

    game.events.on('building:selected', (id) => {
      this.buildingId = id;
      this.element.hidden = id === null;
      this.lastKey = '';
    });
  }

  button(label, title, onClick) {
    const b = el('button', { className: 'hud-btn', type: 'button', text: label, title, tabIndex: -1 });
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', onClick);
    return b;
  }

  render(game) {
    if (this.buildingId === null) return;
    const state = game.state;
    const building = state.buildings.find((b) => b.id === this.buildingId);
    if (!building) {
      this.element.hidden = true;
      return;
    }
    const lines = this.describe(building, state);
    const people = this.peopleOf(building, state);
    const next = this.nextStep(building);
    const affordable = next ? Object.entries(next.spec.cost).every(([r, v]) => state.resources[r] >= v) : false;
    const craftKey = building.definition.crafting
      ? [building.craftMode, building.craft?.item, Math.floor(building.craftRatio * 20), building.craftStatus, EQUIPMENT_KEYS.map((k) => state.equipment[k]).join(',')].join(':')
      : '';
    const key = [
      craftKey,
      building.processStatus,
      building.id,
      building.level,
      building.condition,
      building.underConstruction,
      Math.floor(building.buildRatio * 100),
      Math.floor(building.projectRatio * 100),
      building.project?.kind,
      people.title,
      people.list.map((p) => `${p.character.id}:${p.tag}:${p.here}`).join(','),
      (people.excluded ?? []).map((c) => c.id).join(','),
      affordable,
      lines.join('|'),
    ].join('/');
    if (key === this.lastKey) return;
    this.lastKey = key;

    const def = BUILDINGS[building.type];
    this.thumb.src = thumbnailURL(building.type, building.upgraded ? 2 : 1, building.ruined);
    this.name.textContent = building.underConstruction ? `Şantiye: ${building.name}` : building.name;
    this.badge.textContent = this.badgeText(building);
    this.badge.className = `building-badge${building.upgraded ? ' is-tier2' : ''}${building.ruined ? ' is-ruin' : ''}`;
    this.meta.textContent = def.category ?? 'Kasabanın doğal bir parçası';
    this.description.textContent = building.description ?? '';
    this.description.hidden = !building.description;

    const ratio = building.underConstruction ? building.buildRatio : building.projectRatio;
    this.progress.hidden = !(building.underConstruction || building.project);
    this.progress.firstElementChild.style.width = `${Math.floor(ratio * 100)}%`;

    this.renderPeople(building, people);
    this.renderCrafting(building, state);
    this.lines.replaceChildren(...lines.map((text) => el('div', { className: 'building-line', text })));
    this.lines.hidden = lines.length === 0;
    this.renderUpgrade(building, next, state);

    this.demolishButton.hidden = !def.demolishable;
    this.tradeButton.hidden = !(building.type === 'market' && building.open);
    this.demolishButton.textContent = building.underConstruction ? 'Şantiyeyi İptal Et' : 'Yık';
  }

  badgeText(building) {
    if (building.ruined) return building.project ? 'Kadim Harabe · onarılıyor' : 'Kadim Harabe';
    if (building.definition.ruin) return 'Onarılmış Kadim Yapı';
    if (building.upgraded) return 'Seviye 2 · Gelişmiş';
    if (building.definition.upgrade) return building.project ? 'Seviye 1 · yükseltiliyor' : 'Seviye 1';
    return '';
  }

  /**
   * Panelde listelenen kişiler: inşaatçılar, ev sakinleri (aile rolleriyle) ya da iş yerinin çalışanları
   * (şu an çalışanlar ve son çalışanlar; oyuncu işten çıkarabilir). Dönüş:
   * { title, list: [{ character, tag, here }], empty, workplace, excluded }
   */
  peopleOf(building, state) {
    const byId = (id) => state.characters.find((c) => c.id === id);
    if (building.underConstruction || building.project) {
      const job = state.jobs.find((j) => j.type === 'build' && j.buildingId === building.id);
      const list = (job?.assignees ?? []).map(byId).filter(Boolean).map((character) => ({ character, tag: '', here: true }));
      return { title: 'İnşaatçılar', list, empty: 'İnşaatçı bekleniyor (mesai 08:00-17:00)' };
    }
    if (building.capacity) {
      const residents = state.characters.filter((c) => c.homeId === building.id);
      const list = residents.map((character) => ({ character, tag: this.familyTag(character, residents), here: building.occupants.has(character.id) }));
      return { title: `Burada yaşayan aile (${residents.length}/${building.capacity})`, list, empty: 'Boş, yeni sakin bekliyor' };
    }
    if (building.workerSlots) {
      const working = [...building.workerIds].map(byId).filter(Boolean);
      const recent = building.recentWorkers.map(byId).filter((c) => c && !working.includes(c) && !building.excludedWorkers.has(c.id));
      const list = [...working.map((character) => ({ character, tag: '', here: true })), ...[...recent].reverse().map((character) => ({ character, tag: '', here: false }))];
      const excluded = [...building.excludedWorkers].map(byId).filter(Boolean);
      const title = building.type === 'inn' ? `Aşçı (${working.length}/${building.workerSlots})` : `Çalışanlar (${working.length}/${building.workerSlots})`;
      return { title, list, empty: 'Şu an kimse yok; mesai saatinde biri gelir', workplace: true, excluded };
    }
    return { title: '', list: [], empty: '' };
  }

  /** Evdeki rolü: "eşi Mehmet", "sevgilisi Elif", "çocuk" ya da boş. */
  familyTag(character, residents) {
    if (character.isChild) return 'çocuk';
    const partner = residents.find((o) => arePartners(character, o));
    if (partner) return character.married ? 'evli' : 'sevgili';
    return '';
  }

  renderPeople(building, { title, list, empty, workplace = false, excluded = [] }) {
    this.people.hidden = !title;
    if (!title) return;
    const rows = list.map(({ character, tag, here }) => {
      const label = tag ? `${character.name} · ${tag}` : character.name;
      const chip = this.button(label, `${character.name}: seç ve kamerayı ona kaydır`, () => this.events.emit('ui:selectCharacter', character.id));
      chip.classList.add('person-chip');
      if (!workplace) return chip;
      // İş yeri: çalışanın yanında durumu ve "İşten Çıkar" düğmesi
      const dismiss = this.button('İşten Çıkar', `${character.name} bu yapıda bir daha çalışmasın (anlaşamayan çalışanları ayırmak için)`, () =>
        this.events.emit('ui:dismissWorker', { buildingId: building.id, characterId: character.id })
      );
      dismiss.classList.add('worker-dismiss');
      return el('div', { className: 'worker-row' }, [chip, el('span', { className: 'worker-state', text: here ? 'şu an burada' : 'son çalışan' }), dismiss]);
    });
    const children = [
      el('div', { className: 'building-section-title', text: title }),
      el('div', { className: workplace ? 'worker-list' : 'person-chips' }, rows.length ? rows : [el('span', { className: 'person-empty', text: empty })]),
    ];
    if (excluded.length) {
      children.push(el('div', { className: 'building-section-title is-sub', text: 'İşten çıkarılanlar (burada çalışmaz)' }));
      children.push(
        el(
          'div',
          { className: 'person-chips' },
          excluded.map((c) => {
            const undo = this.button(`${c.name} · Geri Al`, `${c.name} yeniden burada çalışabilsin`, () =>
              this.events.emit('ui:rehireWorker', { buildingId: building.id, characterId: c.id })
            );
            undo.classList.add('person-chip', 'is-excluded');
            // Yalnızca adın üstü çizilir; "Geri Al" okunur kalsın
            undo.replaceChildren(el('span', { className: 'excluded-name', text: c.name }), ' · Geri Al');
            return undo;
          })
        )
      );
    }
    this.people.replaceChildren(...children);
  }

  /** Zanaat atölyesi: üretim seçimi, tezgâhtaki iş ve depodaki ekipman (eksik sayısıyla). */
  renderCrafting(building, state) {
    const crafting = building.definition.crafting && building.functional;
    this.crafting.hidden = !crafting;
    if (!crafting) return;
    const modes = Object.entries(CRAFT_MODES).map(([mode, def]) => {
      const b = this.button(def.name, mode === 'auto' ? def.description : `Yalnızca ${EQUIPMENT[mode].name} üret`, () =>
        this.events.emit('ui:setCraftMode', { buildingId: building.id, mode })
      );
      b.classList.add('craft-mode');
      b.classList.toggle('is-active', building.craftMode === mode);
      return b;
    });
    const current = building.craft
      ? `Tezgâhta: ${EQUIPMENT[building.craft.item].name}${building.craft.recipe === 'fallback' ? ' (eski usul)' : ''} · ${percent(building.craftRatio)}`
      : building.craftStatus ?? 'Zanaatkâr bekleniyor (mesai 08:00-17:00)';
    const stock = EQUIPMENT_KEYS.map((item) => {
      const def = EQUIPMENT[item];
      const missing = lacking(state.characters, item).length;
      const title = `${def.name}: ${def.description}\nTarif: ${formatCost(def.cost)}\nEski usul (${RESOURCES[def.material].name} üreten yapı yokken): ${formatCost(def.fallbackCost)}`;
      return el('div', { className: 'craft-stock', title }, [
        el('img', { src: getIconDataURL(def.icon), alt: '' }),
        el('span', { className: 'craft-stock-name', text: def.shortName }),
        el('span', { className: 'craft-stock-count', text: `depoda ${state.equipment[item]}` }),
        el('span', { className: 'craft-stock-need', text: missing ? `${missing} kişide yok` : 'herkeste var' }),
      ]);
    });
    this.crafting.replaceChildren(
      el('div', { className: 'building-section-title', text: 'Üretim' }),
      el('div', { className: 'craft-modes' }, modes),
      el('div', { className: `upgrade-text${building.craft ? ' is-active' : ''}`, text: current }),
      el('div', { className: 'craft-stock-list' }, stock)
    );
  }

  /** Sıradaki geliştirme: harabeyse onarım, yükseltilebiliyorsa Seviye 2, yoksa null. */
  nextStep(building) {
    const def = BUILDINGS[building.type];
    if (building.underConstruction) return null;
    if (building.ruined) return { kind: 'repair', spec: def.ruin };
    if (def.upgrade && !building.upgraded) return { kind: 'upgrade', spec: def.upgrade };
    return null;
  }

  renderUpgrade(building, next, state) {
    this.upgrade.hidden = !next;
    if (!next) return;
    const { kind, spec } = next;
    const title = kind === 'repair' ? `Onarınca: ${building.definition.name}` : `Seviye 2: ${spec.name}`;
    const text = kind === 'repair' ? building.definition.description : spec.description;
    const children = [el('div', { className: 'building-section-title', text: title }), el('div', { className: 'upgrade-text', text })];

    if (building.project) {
      const verb = kind === 'repair' ? 'Onarım' : 'Yükseltme';
      children.push(el('div', { className: 'upgrade-text is-active', text: `${verb} sürüyor: ${percent(building.projectRatio)} tamamlandı` }));
      const cancelLabel = kind === 'repair' ? 'Onarımı İptal Et' : 'Yükseltmeyi İptal Et';
      const cancel = this.button(cancelLabel, 'Hiç çalışılmadıysa tamamı, yoksa yarısı iade edilir', () =>
        this.events.emit('ui:cancelProject', building.id)
      );
      cancel.classList.add('building-demolish');
      children.push(cancel);
    } else {
      const costs = Object.entries(spec.cost).map(([r, v]) =>
        el('span', { className: `build-cost${state.resources[r] < v ? ' is-missing' : ''}` }, [
          el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }),
          String(v),
        ])
      );
      const missing = Object.entries(spec.cost).filter(([r, v]) => state.resources[r] < v).map(([r]) => RESOURCES[r].name);
      const label = kind === 'repair' ? 'Onarımı Başlat' : 'Yükselt';
      const go = this.button(label, missing.length ? `Yetersiz kaynak: ${missing.join(', ')}` : 'İnşaatçılar gelip çalışmaya başlar', () =>
        this.events.emit('ui:startProject', building.id)
      );
      go.classList.add('upgrade-button');
      go.disabled = missing.length > 0;
      children.push(el('div', { className: 'upgrade-row' }, [el('span', { className: 'build-costs' }, costs), go]));
    }
    this.upgrade.replaceChildren(...children);
  }

  /** Türüne göre durum satırları (üretim ve verim çarpanları, stok, ışık...). */
  describe(building, state) {
    const def = BUILDINGS[building.type];
    const lines = [];
    if (building.underConstruction) {
      lines.push(`%${Math.floor(building.buildRatio * 100)} tamamlandı`);
      return lines;
    }
    if (building.ruined) {
      lines.push(building.project ? 'İnşaatçılar yosunlu taşları yeniden diziyor' : 'Yosunlu taşlar ve kırık parçalar: onarılmayı bekliyor');
      if (def.ruin.treasure) lines.push('İçinde bir hazine saklı olabilir...');
      return lines;
    }

    if (def.production && building.factors) lines.push(...this.productionLines(building, state));
    if (def.processing) lines.push(...this.processingLines(building));

    switch (building.type) {
      case 'cabin': {
        const people = state.characters.filter((c) => c.homeId === building.id);
        const residents = people.length;
        const couple = people.find((c) => c.married && people.some((o) => arePartners(c, o)));
        if (couple) {
          const kids = people.filter((c) => c.isChild && c.parentIds.includes(couple.id));
          const spouse = people.find((o) => arePartners(couple, o));
          lines.push(`Aile: ${couple.name} ile ${spouse.name} evli${kids.length ? ` · çocukları ${kids.map((k) => k.name).join(', ')}` : ''}`);
          if (residents < building.capacity) lines.push('Boş yatak var: kasaba mutluysa aileye bir çocuk katılabilir');
        }
        if (residents < building.capacity) lines.push('Boş yatak var: yarın 08:00\'de yeni sakin gelebilir');
        lines.push(`İçeride: ${building.occupants.size} kişi`);
        if (building.upgraded) {
          lines.push(`Yalıtımlı: kışın %${Math.round((1 - def.upgrade.heatingFactor) * 100)} daha az odun yakar`);
          lines.push('Burada uyuyanlar keyifle uyanır');
        }
        break;
      }
      case 'fishingPier':
        lines.push(building.lit ? 'Feneri yanıyor' : 'Feneri akşam yanar');
        break;
      case 'workshop':
        lines.push(`Bugün üretilen: ${building.producedToday} ekipman`);
        lines.push('Alet demirden, palto ve çanta yünden yapılır; üreten yapı yoksa eski usulle odun, taş ve yiyecekten');
        lines.push('Sakinler boşta kalan ekipmanı buradan ya da kilerden alıp kuşanır');
        break;
      case 'sheepFarm': {
        const flock = building.flock;
        const lambs = flock?.lamb ? 1 : 0;
        lines.push(`Ağılda ${flock ? flock.sheep.length : def.flock.sheep} koyun${lambs ? ' ve annesinin peşinden koşan bir kuzu' : ''}`);
        if (flock?.sleepers().length) lines.push('Koyunlar ahırın önünde uyuyor');
        lines.push('İlkbaharda kırkım bereketli; kışın koyunlar ahırda, yün azalır');
        break;
      }
      case 'ironMine':
        lines.push(building.lit ? 'Girişteki fener yanıyor' : 'Girişteki fener akşam yanar');
        lines.push('Çıkan demir zanaatkârın çelik başlı aletlerine gider');
        break;
      case 'townHall':
        lines.push(`Bürokrasi düzende: kasabanın tüm iş ve inşaat verimi +%${Math.round((def.civic.workSpeed - 1) * 100)}`);
        lines.push(`Kalıcı refah: kasaba refahı +${def.townBonus.happiness}`);
        lines.push(
          `Her sabah ${String(TOWN_HALL.hour).padStart(2, '0')}:00: deposu %${Math.round(TOWN_HALL.richRatio * 100)} dolu olan temel kaynaktan en çok ${TOWN_HALL.max} birimi, %${Math.round(TOWN_HALL.poorRatio * 100)}'in altına düşene aktarır`
        );
        lines.push(state.town?.balanceDay === state.time.day ? 'Bugünün erzak defteri tutuldu' : 'Erzak defteri yarın sabah tutulacak');
        break;
      case 'flowerBed':
        lines.push('Yanından geçenlerin ve etrafında dinlenenlerin keyfi artar');
        lines.push('Gündüzleri çiçeklerin üstünde kelebekler uçar');
        break;
      case 'inn': {
        const kitchen = def.kitchen;
        lines.push(`Stok · sıcak yemek: ${building.meals}/${kitchen.capacity} porsiyon (saatte ${kitchen.perHour})`);
        lines.push('Burada yiyenler çabuk doyar, keyiflenir ve 8 saat yavaş acıkır');
        lines.push(building.lit ? 'Akşam açık: sakinler önünde toplanıp sohbet ediyor' : 'Akşam 17:00\'de kapısı sohbete açılır');
        lines.push(`Bugün pişen: ${building.producedToday} porsiyon`);
        break;
      }
      case 'market': {
        const m = state.events.merchant;
        if (building.open) lines.push(`${m.name} tezgâhta: 18:00'e kadar takas yapabilirsin`);
        else if (m.nextVisitDay) lines.push(`Gezgin tüccar Gün ${m.nextVisitDay} sabahı (09:00) bekleniyor`);
        else lines.push('Gezgin tüccar yakında haberi alıp gelecek');
        lines.push('Odun ve taşı yiyeceğe (ya da tersine) çevirir; Alet Paketi ve Kasaba İkramı satar');
        lines.push('Kasaba büyüdükçe tüccar yün, demir, ekmek ve kervan malları getirir; stoğu da artar');
        break;
      }
      case 'storage':
      case 'supplyCamp':
        lines.push(`Depo kapasitesine katkı: +${def.storageBonus}`);
        lines.push(`Stok: ${RESOURCE_KEYS.map((r) => `${RESOURCES[r].name} ${state.resources[r]}`).join(' · ')} / ${state.storageCapacity}`);
        if (building.type === 'supplyCamp') lines.push('Uzak yollarda yorulanlar burada soluklanır');
        break;
      case 'berryBush':
        if (getSeason(state.time.day).berries === 0) lines.push('Kış: çalı dondu, ilkbaharda yeniden meyve verir');
        lines.push(`Stok · porsiyon: ${building.berries}/${def.maxBerries}`);
        if (state.jobs.some((j) => j.buildingId === building.id)) lines.push('Toplama emri var: kilere taşınacak');
        break;
      case 'campfire':
        lines.push(building.lit ? 'Çıtır çıtır yanıyor; akşamları herkes burada' : 'Söndü, akşam 17:00\'de yakılacak');
        break;
      case 'lantern':
        lines.push(building.lit ? 'Yanıyor: çevresi sıcak sarı ışıkla aydınlık' : '19:00\'da yanar, 06:00\'da söner');
        lines.push('Gece yanından geçenlerin keyfini korur');
        break;
      case 'monument':
        lines.push(`Kalıcı prestij: kasaba refahı +${def.prestige.happinessBonus}, keyif %${Math.round((1 - def.prestige.funDecay) * 100)} daha yavaş düşer`);
        lines.push('Sakinler önünde gururla durup seyreder');
        break;
      case 'watchtower':
        lines.push(`Kalıcı refah: kasaba refahı +${def.townBonus.happiness}`);
        lines.push(building.lit ? 'Fener yanıyor: çevresi geniş bir ışık halkasıyla aydınlık' : 'Feneri 18:00\'de yanar, 06:00\'da söner');
        break;
      case 'ancientFountain':
        lines.push('Yanına gelenlerin keyfi ve enerjisi çok hızlı dolar');
        lines.push('Sakinler tazelenmek için buraya yürür');
        break;
      case 'fountain':
        lines.push('Gündüzleri sakinlerin buluşup sohbet ettiği yer');
        break;
      case 'bench':
        lines.push('Sakinler burada oturup dinlenir');
        break;
      default:
        break;
    }
    return lines;
  }

  /** Saatlik üretim ve onu oluşturan çarpanlar (StructureSystem her karede building.factors'a yazar). */
  productionLines(building, state) {
    const production = BUILDINGS[building.type].production;
    const season = getSeason(state.time.day);
    const f = building.factors;
    const resource = RESOURCES[production.resource].name;
    const lines = [`Saatlik üretim (kişi başı): +${(production.perHour * f.total).toFixed(1)} ${resource} · verim ${percent(f.total)}`];
    if (production.seasonal) {
      if (f.seasonalRaw === 0 && f.seasonal === 0) lines.push(`${season.name}: donmuş, ilkbahara kadar üretim yok`);
      else if (f.seasonal > f.seasonalRaw) lines.push(`${season.name}: ${percent(f.seasonal)} (${building.name} sayesinde; normalde ${percent(f.seasonalRaw)})`);
      else if (f.seasonal > 1) lines.push(`${season.name} ${production.seasonal === 'pasture' ? 'kırkımı' : 'hasadı'}: +${percent(f.seasonal - 1)}`);
      else if (f.seasonal < 1) lines.push(`${season.name} soğuğu: ${percent(f.seasonal)}`);
    }
    if (production.needsTrees) lines.push(`Çevredeki ağaçlar: ${percent(f.trees)}`);
    if (production.rainBonus) lines.push(f.rain > 1 ? `Yağmur yağıyor: +${percent(production.rainBonus)}` : `Yağmurda +${percent(production.rainBonus)}`);
    if (f.biome > 1) lines.push(`${f.biomeName}: +${percent(f.biome - 1)}${f.biomeFull ? '' : ' (kısmen biyomda)'}`);
    if (f.upgrade > 1) lines.push(`Seviye 2: +${percent(f.upgrade - 1)}`);
    lines.push(`Bugün üretilen: +${building.producedToday} ${resource}`);
    // Yan ürün: ağılda süt-peynir (yiyecek), madende taş
    for (const [extra, perHour] of Object.entries(production.extra ?? {})) {
      lines.push(`Yan ürün (kişi başı saatte): +${(perHour * f.total).toFixed(1)} ${RESOURCES[extra].name} · bugün +${building.extraToday ?? 0}`);
    }
    return lines;
  }

  /** İşleme yapısı (değirmen-fırın): saatlik dönüşüm, yiyecek değeri, durum ve bugünkü üretim. */
  processingLines(building) {
    const { perHour, input, output } = building.definition.processing;
    const scale = (cost) => Object.fromEntries(Object.entries(cost).map(([r, v]) => [r, v * perHour]));
    const value = Object.entries(output).reduce((sum, [r, v]) => sum + v * perHour * (RESOURCES[r].foodValue ?? 0), 0);
    const lines = [`Saatlik (fırıncı başı): ${formatCost(scale(input))} → ${formatCost(scale(output))}${value ? ` (${String(value).replace('.', ',')} yiyecek değeri)` : ''}`];
    lines.push(building.processStatus ?? (building.active ? 'Değirmen öğütüyor, fırın yanıyor' : 'Hazır: fırıncı mesaide gelir'));
    lines.push(`Bugün çıkan: +${building.producedToday} ${RESOURCES[Object.keys(output)[0]].name.toLocaleLowerCase('tr')}`);
    lines.push('Öğünlerde önce ekmek yenir: 1 ekmek 2,5 yiyecek sayılır ve biraz keyif verir');
    return lines;
  }
}
