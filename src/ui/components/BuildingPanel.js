// Yapı Bilgi Paneli: haritada bir yapıya (ya da harabeye) tıklayınca sağ sütunda açılır.
//   - küçük resim (seviyesine / yıkık hâline göre), ad, seviye rozeti, kategori ve açıklama
//   - orada çalışanlar ya da yaşayanlar: isme tıklayınca sakin seçilir ve kamera ona kayar
//   - üretim: kişi başı saatlik üretim ve verim çarpanları (mevsim, ağaçlar, yağmur, biyom, seviye)
//   - stok ve türüne özgü durum satırları (handaki sıcak yemek, çalıdaki meyve, kiler...)
//   - Yükselt / Onar (maliyet ve gerekçeyle), sürmekte olan işin ilerlemesi ve iptali, Yık
//   - (9. aşama) evde yaşayan aile (eşler, çocuklar); iş yerinde çalışanları "İşten Çıkar" ile görevden
//     alma ve geri alma; zanaat atölyesinde üretim seçimi, tezgâhtaki iş ve depodaki ekipman
//   - (11. aşama) şifacı kulübesinin ot ve iksir stoğu, belediye fermanları (ilan et düğmeleri), fırtına hasarı
//     ve onarımı
//   - (13. aşama) limanda "Lüks ve Egzotik Mallar" (altınla sipariş); Belediye Konağı'nda sergilenen yadigârlar ve
//     altın fermanları; iş yerlerinde "İşçi Ata" ile sakini sabitleme (yalnızca orada çalışır) ve sabitlemeyi kaldırma
//   - (12. aşama) Bilgelik Evi'nin araştırma kartları (Araştır düğmesi, ilerleme) ve okulu; limanın fazlalık
//     ihracatı sınırı, ihracat sandığı, tekne durumu ve Kasaba Hazinesi; harikanın aşamaları
//   - (10. aşama) yan ürün (ağılda yiyecek, madende taş), değirmen-fırının işleme satırları (1 yiyecek -> 1
//     ekmek), ekipmanın asıl (demir / yün) ve eski usul tarifi, ağıldaki koyunlar, belediyenin etkileri
// Panel oyun durumunu yalnızca okur; istekleri olay olarak yayınlar (ui:startProject, ui:cancelProject,
// ui:demolishBuilding, ui:selectCharacter, ui:dismissWorker, ui:rehireWorker, ui:setCraftMode, ui:civicProject,
// ui:startResearch, ui:setExportThreshold, ui:prepareCrate, ui:buyLuxury, ui:buyRelic, ui:goldDecree, ui:pinWorker,
// ui:unpinWorker). Ne
// değiştiğini anlamak için her karede kısa bir anahtar üretir; anahtar değişmedikçe DOM'a dokunmaz.
import { CLOCK_GEAR } from '../../data/goldenAge.js';
import { BUILDINGS, mendSpec, PROJECT_WORDS } from '../../data/buildings.js';
import { STORM } from '../../data/dilemmas.js';
import { RESOURCES, RESOURCE_KEYS, formatCost } from '../../data/resources.js';
import { TOWN_HALL, CIVIC_PROJECTS, CIVIC_PROJECT_KEYS } from '../../data/town.js';
import { civicStatus, CivicSystem } from '../../systems/CivicSystem.js';
import { EQUIPMENT, EQUIPMENT_KEYS, CRAFT_MODES } from '../../data/equipment.js';
import { getSeason } from '../../data/seasons.js';
import { RESEARCH, RESEARCH_KEYS, SCHOOL } from '../../data/research.js';
import { EXPORT } from '../../data/trade.js';
import { researchStatus } from '../../systems/ResearchSystem.js';
import { cargoValue, exportExcess, cratePreview, boatStatus, boatCapacity, grandVoyageStatus } from '../../systems/HarborSystem.js';
import { relicExportValue } from '../../systems/Luxury.js';
import { rallyStatus, isRallyActive, RALLY } from '../../systems/RallySystem.js';
import { lacking } from '../../systems/Equipment.js';
import { arePartners } from '../../systems/RelationshipSystem.js';
import { getStructureSprite } from '../../art/sprites/index.js';
import { getIconDataURL, getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';
import { luxuryCards, relicShelf, goldDecreeCards } from './luxuryCards.js';
import { ACTIVITY_SKILLS, SKILL_LEVELS } from '../../data/skills.js';
import { skillLevel } from '../../systems/SkillSystem.js';
import { storedMasterworks, exhibitedMasterworks, masterworkHappiness, masterworkPrice } from '../../systems/Masterworks.js';
import { MASTERPIECE_BY_ACTIVITY, MASTERPIECES, MASTERWORK } from '../../data/masterpieces.js';
import { EXPLORATION, EXOTIC_ITEMS, INSCRIPTIONS, INSCRIPTION_KEYS, VINE } from '../../data/exploration.js';
import { expeditionLaunchStatus, pickParty, decodeStatus } from '../../systems/Exploration.js';
import { AESTHETIC, ORNAMENTAL_TREES, DARKNESS } from '../../data/landscape.js';
import { aestheticLevel } from '../../systems/Landscape.js';

const thumbnailCache = new Map();

function thumbnailURL(type, level, ruined, wonderStage = 0) {
  const key = `${type}:${level}:${ruined}:${wonderStage}`;
  if (!thumbnailCache.has(key)) thumbnailCache.set(key, getStructureSprite(type, { level, ruined, wonderStage: wonderStage || undefined }).toDataURL());
  return thumbnailCache.get(key);
}

/** "120 odun, 40 taş" */
const cargoText = (cargo) =>
  Object.entries(cargo)
    .map(([r, v]) => `${v} ${RESOURCES[r].name.toLocaleLowerCase('tr')}`)
    .join(', ');

const percent = (value) => `%${Math.round(value * 100)}`;

export class BuildingPanel {
  constructor(game) {
    this.slot = 'cards'; // (17. aşama) sağ alt köşedeki bağımsız bilgi kartı
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
    this.decrees = el('div', { className: 'building-decrees' });
    this.research = el('div', { className: 'building-decrees building-research' });
    this.harbor = el('div', { className: 'building-decrees building-harbor' });
    this.luxury = el('div', { className: 'building-decrees building-luxury' });
    this.bell = el('div', { className: 'building-decrees building-bell' });
    this.expedition = el('div', { className: 'building-decrees building-expedition' });
    this.inscriptions = el('div', { className: 'building-decrees building-inscriptions' });
    this.pickerFor = null; // "İşçi Ata" listesi açık olan yapı
    // (18. aşama) Mahalle tabelasının adı: yazıp Enter (ya da kutudan çıkınca) kaydedilir, Esc vazgeçer
    this.signInput = el('input', { className: 'sign-name-input', type: 'text', maxLength: 24, placeholder: 'Sokağa / semte bir ad ver' });
    this.signInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.signInput.blur();
      if (e.key === 'Escape') {
        this.signInput.value = this.signLabel ?? '';
        this.signInput.blur();
      }
      e.stopPropagation();
    });
    this.signInput.addEventListener('blur', () => {
      if (this.buildingId !== null && this.signInput.value.trim()) this.events.emit('ui:renameSign', { id: this.buildingId, name: this.signInput.value });
    });
    this.sign = el('div', { className: 'building-decrees building-sign', hidden: true }, [el('div', { className: 'decree-title', text: 'Tabelanın adı' }), this.signInput]);
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
      this.decrees,
      this.research,
      this.harbor,
      this.luxury,
      this.bell,
      this.expedition,
      this.inscriptions,
      this.sign,
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
    this.lastState = state;
    const lines = this.describe(building, state);
    const people = this.peopleOf(building, state);
    const next = this.nextStep(building);
    const affordable = next ? Object.entries(next.spec.cost).every(([r, v]) => state.resources[r] >= v) : false;
    const craftKey = building.definition.crafting
      ? [building.craftMode, building.craft?.item, Math.floor(building.craftRatio * 20), building.craftStatus, EQUIPMENT_KEYS.map((k) => state.equipment[k]).join(',')].join(':')
      : '';
    const decreeKey = building.definition.civic
      ? CIVIC_PROJECT_KEYS.map((id) => {
          const st = civicStatus(state, id, building.functional);
          return `${st.ok}:${st.reason}:${st.level}`;
        }).join(',')
      : '';
    const researchKey = building.definition.academy
      ? [
          state.research.active?.id,
          state.research.active ? Math.floor((state.research.active.progress / RESEARCH[state.research.active.id].work) * 100) : 0,
          RESEARCH_KEYS.map((id) => researchStatus(state, id, this.academyReady(building)).reason).join(','),
        ].join(':')
      : '';
    const harborKey =
      building.type === 'harbor'
        ? [
            building.exportThreshold,
            JSON.stringify(building.crate),
            JSON.stringify(cratePreview(state)),
            JSON.stringify(exportExcess(state, building.exportThreshold)),
            boatStatus(state),
            JSON.stringify(grandVoyageStatus(state)),
            state.resources.gold,
            state.trade.shipments,
          ].join(':')
        : '';
    const luxuryKey =
      building.type === 'harbor' || building.definition.civic
        ? [JSON.stringify(state.luxury), state.resources.gold, Math.floor((state.buffs.spices ?? 0) / 60), Math.floor((state.buffs.goldBonus ?? 0) / 60), Math.floor((state.buffs.royalArchitects ?? 0) / 60), state.time.day, state.buildings.length].join(':')
        : '';
    const pickerKey = this.pickerFor === building.id ? this.workerCandidates(building, state).map((o) => `${o.character.id}:${o.character.name}:${o.level}:${o.pinnedTo}`).join(',') : '';
    const bellKey = building.type === 'fountain' || building.definition.civic ? `${JSON.stringify(rallyStatus(state))}:${isRallyActive(state)}` : '';
    // (16. aşama) keşif seferi (liman, belediye) ve kadim yazıtlar (Bilgelik Evi)
    const exploreKey =
      building.type === 'harbor' || building.type === 'townHall' || building.definition.academy
        ? JSON.stringify([
            state.exploration,
            state.dilemma.expedition ? [state.dilemma.expedition.members, state.dilemma.expedition.log?.length, Math.floor((state.dilemma.expedition.until - state.totalMinutes) / 60)] : null,
            expeditionLaunchStatus(state, building.type).reason,
          ])
        : '';
    const key = [
      exploreKey,
      bellKey,
      craftKey,
      decreeKey,
      researchKey,
      harborKey,
      luxuryKey,
      pickerKey,
      building.wonderStage,
      building.damaged,
      building.herbs ? Math.floor(building.herbs) : 0,
      building.remedies,
      building.processStatus,
      building.id,
      building.level,
      building.condition,
      building.underConstruction,
      Math.floor(building.buildRatio * 100),
      Math.floor(building.projectRatio * 100),
      building.project?.kind,
      people.title,
      people.list.map((p) => `${p.character.id}:${p.character.name}:${p.tag}:${p.here}:${p.pinned}`).join(','),
      people.canPin,
      (people.excluded ?? []).map((c) => c.id).join(','),
      affordable,
      lines.join('|'),
    ].join('/');
    if (key === this.lastKey) return;
    this.lastKey = key;

    const def = BUILDINGS[building.type];
    this.thumb.src = thumbnailURL(building.type, building.upgraded ? 2 : 1, building.ruined, building.definition.wonder ? Math.max(1, building.wonderStage) : 0);
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
    this.renderDecrees(building, state);
    this.renderResearch(building, state);
    this.renderHarbor(building, state);
    this.renderLuxury(building, state);
    this.renderBell(building, state);
    this.renderExpedition(building, state);
    this.renderInscriptions(building, state);
    // (18. aşama) Mahalle tabelası: ad kutusu (yazılırken üzerine yazılmaz)
    this.sign.hidden = building.type !== 'signpost';
    this.signLabel = building.label;
    if (building.type === 'signpost' && document.activeElement !== this.signInput) this.signInput.value = building.label ?? '';
    this.lines.replaceChildren(...lines.map((text) => el('div', { className: 'building-line', text })));
    this.lines.hidden = lines.length === 0;
    this.renderUpgrade(building, next, state);

    this.demolishButton.hidden = !def.demolishable && !building.underConstruction;
    this.tradeButton.hidden = !(building.type === 'market' && building.open);
    this.demolishButton.textContent = building.underConstruction ? 'Şantiyeyi İptal Et' : 'Yık';
  }

  badgeText(building) {
    if (building.damaged) return building.project ? 'Hasarlı · onarılıyor' : 'Hasarlı · onarılmalı';
    if (building.ruined) return building.project ? 'Kadim Harabe · onarılıyor' : 'Kadim Harabe';
    if (building.definition.ruin) return 'Onarılmış Kadim Yapı';
    if (building.upgraded) return 'Seviye 2 · Gelişmiş';
    if (building.definition.upgrade) return building.project ? 'Seviye 1 · yükseltiliyor' : 'Seviye 1';
    if (building.definition.wonder && !building.underConstruction) {
      const n = building.definition.wonder.stages.length;
      if (building.wonderComplete) return `Aşama ${n}/${n} · Altın Çağ`;
      return `Aşama ${building.wonderStage}/${n}${building.project ? ' · yükseliyor' : ''}`;
    }
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
      // (13. aşama) Sabit çalışanlar en üstte, sonra şu an çalışanlar ve son çalışanlar
      const pinned = state.characters.filter((c) => c.workplaceId === building.id);
      const working = [...building.workerIds].map(byId).filter((c) => c && !pinned.includes(c));
      const recent = building.recentWorkers.map(byId).filter((c) => c && !working.includes(c) && !pinned.includes(c) && !building.excludedWorkers.has(c.id));
      const list = [
        ...pinned.map((character) => ({ character, tag: '', here: building.workerIds.has(character.id), pinned: true })),
        ...working.map((character) => ({ character, tag: '', here: true, pinned: false })),
        ...[...recent].reverse().map((character) => ({ character, tag: '', here: false, pinned: false })),
      ];
      const excluded = [...building.excludedWorkers].map(byId).filter(Boolean);
      const count = building.workerIds.size;
      const title = building.type === 'inn' ? `Aşçı (${count}/${building.workerSlots})` : `Çalışanlar (${count}/${building.workerSlots})`;
      const canPin = pinned.length < building.workerSlots && building.functional;
      return { title, list, empty: 'Şu an kimse yok; mesai saatinde biri gelir', workplace: true, excluded, canPin, building };
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

  renderPeople(building, { title, list, empty, workplace = false, excluded = [], canPin = false }) {
    this.people.hidden = !title;
    if (!title) return;
    const rows = list.map(({ character, tag, here, pinned }) => {
      const label = tag ? `${character.name} · ${tag}` : character.name;
      const chip = this.button(label, `${character.name}: seç ve kamerayı ona kaydır`, () => this.events.emit('ui:selectCharacter', character.id));
      chip.classList.add('person-chip');
      if (!workplace) return chip;
      // İş yeri: çalışanın durumu, "Sabitle / Sabitlemeyi Kaldır" ve "İşten Çıkar" düğmeleri
      const dismiss = this.button('İşten Çıkar', `${character.name} bu yapıda bir daha çalışmasın (anlaşamayan çalışanları ayırmak için)`, () =>
        this.events.emit('ui:dismissWorker', { buildingId: building.id, characterId: character.id })
      );
      dismiss.classList.add('worker-dismiss');
      const pin = pinned
        ? this.button('Sabitlemeyi Kaldır', `${character.name} yeniden istediği işi seçebilsin`, () => this.events.emit('ui:unpinWorker', { characterId: character.id }))
        : this.button('Sabitle', `${character.name} yalnızca burada çalışsın, başka işlere kaymasın`, () => this.events.emit('ui:pinWorker', { buildingId: building.id, characterId: character.id }));
      pin.classList.add('worker-dismiss');
      if (!pinned && !canPin) pin.disabled = true;
      const stateText = pinned ? (here ? 'sabit · burada' : 'sabit çalışan') : here ? 'şu an burada' : 'son çalışan';
      return el('div', { className: 'worker-row' }, [chip, el('span', { className: `worker-state${pinned ? ' is-pinned' : ''}`, text: stateText }), pin, dismiss]);
    });
    const children = [
      el('div', { className: 'building-section-title', text: title }),
      el('div', { className: workplace ? 'worker-list' : 'person-chips' }, rows.length ? rows : [el('span', { className: 'person-empty', text: empty })]),
    ];
    // (13. aşama) İşçi Ata: yetişkin sakinlerden birini seçip bu iş yerine sabitle
    if (workplace && canPin) {
      const open = this.pickerFor === building.id;
      const toggle = this.button(open ? 'Listeyi Kapat' : 'İşçi Ata', 'Kasabadaki yetişkinlerden birini bu iş yerine sabit çalışan olarak ata', () => {
        this.pickerFor = open ? null : building.id;
        this.lastKey = '';
      });
      toggle.classList.add('upgrade-button');
      children.push(toggle);
      if (open) {
        const skill = ACTIVITY_SKILLS[building.definition.workActivity];
        const chips = this.workerCandidates(building, this.lastState).map(({ character, level, pinnedTo }) => {
          const levelName = skill ? SKILL_LEVELS.find((l) => l.level === level).name : '';
          const text = `${character.name}${levelName ? ` · ${levelName}` : ''}${pinnedTo ? ` · ${pinnedTo}` : ''}`;
          const chip = this.button(text, `${character.name} bu iş yerine sabitlensin`, () => {
            this.pickerFor = null;
            this.events.emit('ui:pinWorker', { buildingId: building.id, characterId: character.id });
          });
          chip.classList.add('person-chip');
          if (level >= 2) chip.classList.add('is-skilled');
          return chip;
        });
        children.push(el('div', { className: 'worker-picker' }, chips.length ? chips : [el('span', { className: 'person-empty', text: 'Atanabilecek yetişkin yok' })]));
      }
    }
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
      ? `Tezgâhta: ${(EQUIPMENT[building.craft.item] ?? CLOCK_GEAR).name}${building.craft.recipe === 'fallback' ? ' (eski usul)' : ''} · ${percent(building.craftRatio)}`
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

  /** Belediye fermanları: her biri için açıklama, maliyet, durum ve "İlan Et" düğmesi. */
  renderDecrees(building, state) {
    const show = Boolean(building.definition.civic) && building.functional;
    this.decrees.hidden = !show;
    if (!show) return;
    const cards = CIVIC_PROJECT_KEYS.map((id) => {
      const project = CIVIC_PROJECTS[id];
      const st = civicStatus(state, id, true);
      const done = st.maxed;
      const levelText = project.levels ? `Kademe ${Math.min(st.level, project.levels.length)}/${project.levels.length}` : done ? 'İlan edildi' : project.cooldownDays ? 'Tekrarlanabilir' : 'Bir kez';
      const costs = Object.entries(st.cost).map(([r, v]) =>
        el('span', { className: `build-cost${state.resources[r] < v ? ' is-missing' : ''}` }, [el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }), String(v)])
      );
      if (st.provisions) {
        const stores = state.resources.bread + state.resources.food;
        costs.push(el('span', { className: `build-cost${stores < st.provisions ? ' is-missing' : ''}`, title: 'Erzak: önce ekmek, yetmezse yiyecek' }, [el('img', { src: getIconDataURL('bread'), alt: 'Erzak' }), `${st.provisions} erzak`]));
      }
      const go = this.button(done ? 'Tamamlandı' : 'Fermanı İlan Et', st.ok ? `${project.name}: ${CivicSystem.describeCost(st)}` : st.reason, () =>
        this.events.emit('ui:civicProject', { id })
      );
      go.classList.add('upgrade-button');
      go.disabled = !st.ok;
      return el('div', { className: `decree${done ? ' is-done' : ''}` }, [
        el('div', { className: 'decree-head' }, [el('img', { src: getIconDataURL(project.icon), alt: '' }), project.name, el('span', { className: 'decree-state', text: levelText })]),
        el('div', { className: 'upgrade-text', text: project.description }),
        ...(done ? [] : [el('div', { className: 'upgrade-row' }, [el('span', { className: 'build-costs' }, costs), go])]),
        ...(!st.ok && !done ? [el('div', { className: 'upgrade-text is-active', text: st.reason })] : []),
      ]);
    });
    this.decrees.replaceChildren(el('div', { className: 'building-section-title', text: 'Belediye Fermanları' }), ...cards);
  }

  /** İşçi Ata listesi: bu yapıya sabitli olmayan yetişkinler, bu işteki ustalığa göre (en usta önce). */
  workerCandidates(building, state) {
    if (!state) return [];
    const skill = ACTIVITY_SKILLS[building.definition.workActivity];
    return state.characters
      .filter((c) => !c.isChild && !c.away && c.workplaceId !== building.id)
      .map((c) => {
        const other = c.workplaceId !== null ? state.buildings.find((b) => b.id === c.workplaceId) : null;
        return { character: c, level: skill ? skillLevel(c, skill).level : 1, pinnedTo: other ? `${other.name}'a sabit` : '' };
      })
      .sort((a, b) => b.level - a.level || a.character.name.localeCompare(b.character.name, 'tr'));
  }

  /** (14. aşama) Meydan havuzu ve Belediye Konağı: Toplanma Zili. */
  renderBell(building, state) {
    const show = (building.type === 'fountain' || Boolean(building.definition.civic)) && building.functional;
    this.bell.hidden = !show;
    if (!show) return;
    const st = rallyStatus(state);
    const go = this.button('Zili Çal', st.ok ? 'Kasaba çanı çalar; uyanık herkes bir saatliğine meydanda toplanır' : st.reason, () => this.events.emit('ui:rallyBell'));
    go.classList.add('upgrade-button');
    go.disabled = !st.ok;
    this.bell.replaceChildren(
      el('div', { className: 'building-section-title', text: 'Toplanma Zili' }),
      el('div', { className: 'decree luxury-card' }, [
        el('div', { className: 'decree-head' }, [el('img', { src: getAnyIconURL('bell'), alt: '' }), 'Kasaba çanı', el('span', { className: 'decree-state', text: isRallyActive(state) ? 'Toplanıyorlar' : '3 saatte bir' })]),
        el('div', { className: 'upgrade-text', text: `Çan çalınca uyanık bütün sakinler elindekini bırakıp ${RALLY.minutes} dakikalığına meydanda toplanır (şenlikleri ya da kasabayı toplu seyretmek için). Uyuyanlar uyanmaz.` }),
        el('div', { className: 'upgrade-row' }, [el('span', { className: 'build-costs' }, []), go]),
        ...(st.ok ? [] : [el('div', { className: 'upgrade-text is-active', text: st.reason })]),
      ])
    );
  }

  /** (13. aşama) Liman: lüks mallar; Belediye Konağı: yadigâr rafı ve altın fermanları. */
  renderLuxury(building, state) {
    const harbor = building.type === 'harbor' && building.functional;
    const hall = Boolean(building.definition.civic) && building.functional;
    this.luxury.hidden = !(harbor || hall);
    if (harbor) {
      this.luxury.replaceChildren(el('div', { className: 'building-section-title', text: 'Lüks ve Egzotik Mallar (limandan sipariş)' }), ...luxuryCards(state, this.events, 'harbor'));
    } else if (hall) {
      this.luxury.replaceChildren(
        el('div', { className: 'building-section-title', text: 'Kasaba Yadigârları' }),
        relicShelf(state),
        el('div', { className: 'upgrade-text', text: 'Yadigârlar gezgin tüccardan (Lüks Mallar sekmesi) ya da Büyük Ticaret Limanı\'ndan altınla alınır ve burada sergilenir.' }),
        el('div', { className: 'building-section-title', text: `Altın Fermanları · Hazine ${state.resources.gold ?? 0} altın` }),
        ...goldDecreeCards(state, this.events)
      );
    }
  }

  /** Bilgelik Evi araştırma yapabilir mi (tamamlanmış ve hasarsız)? */
  academyReady(building) {
    return building.functional && !building.damaged;
  }

  /** Bilgelik Evi: dört araştırmanın kartları (durum, maliyet, Araştır düğmesi) ve süren araştırmanın ilerlemesi. */
  renderResearch(building, state) {
    const show = Boolean(building.definition.academy) && building.functional;
    this.research.hidden = !show;
    if (!show) return;
    const ready = this.academyReady(building);
    const active = state.research.active;
    const cards = RESEARCH_KEYS.map((id) => {
      const def = RESEARCH[id];
      const st = researchStatus(state, id, ready);
      const stateText = st.done ? 'Tamamlandı' : st.active ? `Araştırılıyor · ${percent(Math.min(1, active.progress / def.work))}` : 'Araştırılmadı';
      const children = [
        el('div', { className: 'decree-head' }, [el('img', { src: getIconDataURL(def.icon), alt: '' }), def.name, el('span', { className: 'decree-state', text: stateText })]),
        el('div', { className: 'upgrade-text', text: def.description }),
      ];
      if (st.active) {
        children.push(el('div', { className: 'need-bar building-progress' }, [el('span', { className: 'need-fill need-fun', style: `width: ${Math.floor(Math.min(1, active.progress / def.work) * 100)}%` })]));
      } else if (!st.done) {
        const costs = Object.entries(def.cost).map(([r, v]) =>
          el('span', { className: `build-cost${state.resources[r] < v ? ' is-missing' : ''}` }, [el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }), String(v)])
        );
        const go = this.button('Araştır', st.ok ? `${def.name}: maliyet peşin ödenir, Bilge çalıştıkça ilerler` : st.reason, () => this.events.emit('ui:startResearch', { id }));
        go.classList.add('upgrade-button');
        go.disabled = !st.ok;
        children.push(el('div', { className: 'upgrade-row' }, [el('span', { className: 'build-costs' }, costs), go]));
        if (!st.ok) children.push(el('div', { className: 'upgrade-text is-active', text: st.reason }));
      }
      return el('div', { className: `decree${st.done ? ' is-done' : ''}` }, children);
    });
    this.research.replaceChildren(el('div', { className: 'building-section-title', text: 'Kasaba Araştırmaları' }), ...cards);
  }

  /**
   * (16. aşama) Liman ve Belediye Konağı: keşif seferi düzenleme (Sefere Çıkar), yoldaki kafile ve maceraları, son
   * seferlerin günlüğü ve kasabanın egzotik ganimetleri.
   */
  renderExpedition(building, state) {
    const show = (building.type === 'harbor' || building.type === 'townHall') && building.functional;
    this.expedition.hidden = !show;
    if (!show) return;
    const exp = state.dilemma.expedition;
    const ex = state.exploration;
    const children = [el('div', { className: 'building-section-title', text: 'Keşif Seferleri' })];
    if (exp) {
      const names = exp.members.map((id) => state.characters.find((c) => c.id === id)?.name).filter(Boolean);
      const left = Math.max(0, Math.ceil((exp.until - state.totalMinutes) / 60));
      children.push(el('div', { className: 'upgrade-text is-active', text: `Yolda: ${names.join(', ')} · dönüşe ≈${left} saat` }));
      for (const l of exp.log ?? []) children.push(el('div', { className: 'upgrade-text', text: `• ${l.text}` }));
      if ((exp.adventures?.length ?? 0) > (exp.next ?? 0)) children.push(el('div', { className: 'upgrade-text', text: 'Kafile yolda yeni bir maceraya doğru ilerliyor; kararını soracaklar' }));
    } else {
      const st = expeditionLaunchStatus(state, building.type);
      const cost = Object.entries(EXPLORATION.cost).map(([r, v]) =>
        el('span', { className: `build-cost${state.resources[r] < v ? ' is-missing' : ''}` }, [el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }), String(v)])
      );
      const party = pickParty(state.characters, EXPLORATION.partySize).map((c) => c.name);
      const go = this.button('Sefere Çıkar', st.ok ? `${EXPLORATION.partySize} kişilik kafile bir gün sürecek bir sefere çıkar; yolda iki kez kararını isteyecekler` : st.reason, () =>
        this.events.emit('ui:launchExpedition', { source: building.type })
      );
      go.classList.add('upgrade-button');
      go.disabled = !st.ok;
      children.push(el('div', { className: 'upgrade-text', text: `Kafile: ${party.join(', ') || '-'} (ustalar ve Sağlam Aletliler maceralarda riski azaltır)` }));
      children.push(el('div', { className: 'upgrade-row' }, [el('span', { className: 'build-costs' }, cost), go]));
      if (!st.ok) children.push(el('div', { className: 'upgrade-text is-active', text: st.reason }));
    }
    const last = ex.log[ex.log.length - 1];
    if (last) children.push(el('div', { className: 'upgrade-text', text: `Son sefer (Gün ${last.day}): ${last.route} Seferi · ${last.members.join(', ')}${last.finds.length ? ` · ${last.finds.length} ganimet` : ''}` }));
    const inv = [
      ...['vineSeed', 'ancientTorch', 'relicShard'].filter((k) => ex.items[k] > 0).map((k) => `${EXOTIC_ITEMS[k].name} ×${ex.items[k]}${k === 'relicShard' ? `/${EXPLORATION.shardsPerRelic}` : ''}`),
      ...(ex.cityMap ? [`${EXOTIC_ITEMS.cityMap.name} (tüccar iki kat sık gelir)`] : []),
    ];
    children.push(el('div', { className: 'upgrade-text', text: inv.length ? `Ganimet sandığı: ${inv.join(' · ')}` : `${ex.expeditions} sefer düzenlendi · ganimet sandığı boş` }));
    this.expedition.replaceChildren(...children);
  }

  /** (16. aşama) Bilgelik Evi: bulunan kadim yazıtlar, Çöz düğmesi, çözülmekte olanın ilerlemesi ve çözülen şemalar. */
  renderInscriptions(building, state) {
    const ex = state.exploration;
    const found = INSCRIPTION_KEYS.filter((id) => ex.inscriptions[id]);
    const show = Boolean(building.definition.academy) && building.functional;
    this.inscriptions.hidden = !show;
    if (!show) return;
    const cards = found.map((id) => {
      const def = INSCRIPTIONS[id];
      const st = decodeStatus(state, id);
      const status = ex.inscriptions[id].status;
      const ratio = status === 'decoding' && ex.decoding ? Math.min(1, ex.decoding.progress / def.work) : 0;
      const stateText = status === 'decoded' ? 'Çözüldü' : status === 'decoding' ? `Çözülüyor · ${percent(ratio)}` : 'Çözülmeyi bekliyor';
      const children = [
        el('div', { className: 'decree-head' }, [el('img', { src: getAnyIconURL(status === 'decoded' ? 'scheme' : 'inscription'), alt: '' }), def.name, el('span', { className: 'decree-state', text: stateText })]),
        el('div', { className: 'upgrade-text', text: def.description }),
      ];
      if (status === 'decoding') children.push(el('div', { className: 'need-bar building-progress' }, [el('span', { className: 'need-fill need-fun', style: `width: ${Math.floor(ratio * 100)}%` })]));
      else if (status === 'found') {
        const go = this.button('Çöz', st.ok ? 'Bilge araştırma yokken yazıtın başına oturur' : st.reason, () => this.events.emit('ui:decodeInscription', { id }));
        go.classList.add('upgrade-button');
        go.disabled = !st.ok;
        children.push(el('div', { className: 'upgrade-row' }, [el('span', { className: 'person-empty', text: state.research.active ? 'Araştırma bitince çözülür' : '' }), go]));
      }
      return el('div', { className: `decree${status === 'decoded' ? ' is-done' : ''}` }, children);
    });
    const hint = el('div', { className: 'upgrade-text', text: found.length ? 'Bilge, araştırma yokken yazıtları çözer.' : 'Kadim harabeler onarılınca ya da keşif seferlerinden kadim yazıtlar gelir; burada çözülür.' });
    this.inscriptions.replaceChildren(el('div', { className: 'building-section-title', text: 'Kadim Yazıtlar' }), hint, ...cards);
  }

  /** Liman: fazlalık ihracatı sınırı, ihracat sandığı, tekne ve hazine. */
  renderHarbor(building, state) {
    const show = building.type === 'harbor' && building.functional;
    this.harbor.hidden = !show;
    if (!show) return;
    const threshold = building.exportThreshold;
    const chips = EXPORT.thresholds.map((t) => {
      const b = this.button(t === null ? 'Kapalı' : `${t}+`, t === null ? 'Fazlalık ihracatını kapat: tekne yalnızca hazırlanan sandığı götürür' : `Stoğu ${t}'ü aşan mallar ihraç edilsin`, () =>
        this.events.emit('ui:setExportThreshold', { buildingId: building.id, threshold: t })
      );
      b.classList.add('craft-mode');
      b.classList.toggle('is-active', threshold === t);
      return b;
    });
    const excess = exportExcess(state, threshold);
    const excessText = Object.keys(excess).length
      ? `Şu an sınırı aşan: ${cargoText(excess)} (≈${cargoValue(excess, relicExportValue(state))} altın; tekne en çok ${boatCapacity(state)} birim alır)`
      : threshold === null
        ? 'Kapalı: tekne yalnızca rıhtımdaki sandığı götürür'
        : `Şu an ${threshold}'ü aşan stok yok`;
    const preview = cratePreview(state);
    const costs = Object.entries(preview).map(([r, v]) => el('span', { className: 'build-cost' }, [el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }), String(v)]));
    const crate = this.button('İhracat Sandığı Hazırla', Object.keys(preview).length ? `Her kaynaktan en çok ${EXPORT.crate.perResource} birim rıhtıma konur (stokta en az ${EXPORT.crate.minStock} kalır)` : `Sandığa koyacak fazla mal yok (her kaynaktan en az ${EXPORT.crate.minStock} stokta kalır)`, () =>
      this.events.emit('ui:prepareCrate', { buildingId: building.id })
    );
    crate.classList.add('upgrade-button');
    crate.disabled = Object.keys(preview).length === 0;
    const values = Object.entries(EXPORT.values).map(([r, v]) => `${RESOURCES[r].name.toLocaleLowerCase('tr')} ${v}`).join(' · ');
    const children = [
      el('div', { className: 'building-section-title', text: 'Nehir İhracatı' }),
      el('div', { className: 'upgrade-text', text: 'Otomatik fazlalık ihracatı (stok sınırı):' }),
      el('div', { className: 'craft-modes' }, chips),
      el('div', { className: 'upgrade-text', text: excessText }),
      el('div', { className: 'upgrade-row' }, [el('span', { className: 'build-costs' }, costs.length ? costs : [el('span', { className: 'person-empty', text: 'Sandık için fazla mal yok' })]), crate]),
    ];
    if (building.crate) children.push(el('div', { className: 'upgrade-text is-active', text: `Rıhtımda bekleyen sandık: ${cargoText(building.crate)} (≈${cargoValue(building.crate, relicExportValue(state))} altın)` }));
    children.push(el('div', { className: 'upgrade-text is-active', text: boatStatus(state) }));
    // (14. aşama) Büyük İhracat Seferi fermanı
    const gv = grandVoyageStatus(state);
    const spec = EXPORT.grandVoyage;
    const grand = this.button('Büyük İhracat Seferi', gv.ok ? `${spec.price} altın: kervan teknesi hemen gelir` : gv.reason, () => this.events.emit('ui:grandVoyage', { buildingId: building.id }));
    grand.classList.add('upgrade-button');
    grand.disabled = !gv.ok;
    children.push(
      el('div', { className: 'decree luxury-card' }, [
        el('div', { className: 'decree-head' }, [el('img', { src: getIconDataURL('boat'), alt: '' }), 'Büyük İhracat Seferi', el('span', { className: 'decree-state', text: `${spec.cooldownDays} günde bir` })]),
        el('div', { className: 'upgrade-text', text: `Kervan teknesi saati beklemeden yola çıkar, ${spec.capacityMultiplier} kat yük alır ve ${spec.threshold}'ü aşan bütün malları götürür; yükün değeri %${Math.round((spec.valueBonus - 1) * 100)} fazladır. Toplam ${state.trade.grandVoyages ?? 0} kervan seferi.` }),
        el('div', { className: 'upgrade-row' }, [el('span', { className: `luxury-price${(state.resources.gold ?? 0) < spec.price ? ' is-missing' : ''}` }, [el('img', { src: getIconDataURL('coin'), alt: 'Altın' }), String(spec.price)]), grand]),
        ...(gv.ok ? [] : [el('div', { className: 'upgrade-text is-active', text: gv.reason }) ]),
      ])
    );
    children.push(el('div', { className: 'upgrade-text', text: `Birim başına altın: ${values}` }));
    this.harbor.replaceChildren(...children);
  }

  /** Sıradaki geliştirme: harabeyse onarım, yükseltilebiliyorsa Seviye 2, yoksa null. */
  nextStep(building) {
    const def = BUILDINGS[building.type];
    if (building.underConstruction) return null;
    if (building.ruined) return { kind: 'repair', spec: def.ruin };
    if (building.damaged) return { kind: 'mend', spec: mendSpec(building.type, STORM.mend) };
    if (def.wonder && !building.wonderComplete) {
      const stage = def.wonder.stages[building.wonderStage];
      return { kind: 'stage', spec: { ...stage, buildWork: stage.work }, index: building.wonderStage };
    }
    if (def.upgrade && !building.upgraded) return { kind: 'upgrade', spec: def.upgrade };
    return null;
  }

  renderUpgrade(building, next, state) {
    this.upgrade.hidden = !next;
    if (!next) return;
    const { kind, spec } = next;
    const stages = building.definition.wonder?.stages.length ?? 0;
    const title =
      kind === 'repair'
        ? `Onarınca: ${building.definition.name}`
        : kind === 'mend'
          ? 'Fırtına hasarı: onarım gerekli'
          : kind === 'stage'
            ? `Aşama ${next.index + 1}/${stages}: ${spec.name}`
            : `Seviye 2: ${spec.name}`;
    const text = kind === 'repair' ? building.definition.description : spec.description;
    const children = [el('div', { className: 'building-section-title', text: title }), el('div', { className: 'upgrade-text', text })];

    if (building.project) {
      const verb = PROJECT_WORDS[kind].noun;
      children.push(el('div', { className: 'upgrade-text is-active', text: `${verb} sürüyor: ${percent(building.projectRatio)} tamamlandı` }));
      const cancelLabel = PROJECT_WORDS[kind].cancel;
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
      const label = PROJECT_WORDS[kind].start;
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

    if (building.damaged) lines.push(building.project ? 'Hasarlı: inşaatçılar onarıyor' : 'Hasarlı: onarılana kadar kimse çalışamaz');
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
        if (building.damaged) lines.push('Kurtlar çiti yıktı, koyunların çoğu dağıldı: ağılda 2 koyun kaldı');
        else lines.push(`Ağılda ${flock ? flock.sheep.length : def.flock.sheep} koyun${lambs ? ' ve annesinin peşinden koşan bir kuzu' : ''}`);
        if (flock?.sleepers().length) lines.push('Koyunlar ahırın önünde uyuyor');
        lines.push('İlkbaharda kırkım bereketli; kışın koyunlar ahırda, yün azalır');
        break;
      }
      case 'healerHut': {
        const spec = def.apothecary;
        const nature = building.natureFactor ?? 1;
        lines.push(`İksir rafı: ${building.remedies}/${spec.maxRemedies} · şifalı ot: ${Math.floor(building.herbs)}/${spec.maxHerbs}`);
        lines.push(`Ot toplama verimi (çevredeki ağaçlar): %${Math.round(nature * 100)}`);
        lines.push(`Bugün hazırlanan: ${building.producedToday} iksir · tedavi edilen: ${building.treatedToday}`);
        const sick = state.characters.filter((c) => c.illness).map((c) => c.name);
        lines.push(sick.length ? `Kasabada hasta: ${sick.join(', ')}` : 'Kasabada şu an hasta yok');
        if (building.processStatus) lines.push(building.processStatus);
        break;
      }
      case 'academy': {
        const kids = state.characters.filter((c) => c.isChild);
        const pupils = kids.filter((c) => c.task?.activity === 'school' && c.task.buildingId === building.id && c.task.phase === 'perform');
        lines.push(`Okul (${String(SCHOOL.hours.from).padStart(2, '0')}:00-${SCHOOL.hours.to}:00): şu an derste ${pupils.length} çocuk`);
        if (kids.length) {
          const progress = kids.map((c) => {
            const ratio = Math.min(1, (c.schooling ?? 0) / SCHOOL.graduateMinutes);
            return ratio >= 1 ? `${c.name} hazır` : `${c.name} ${percent(ratio)}`;
          });
          lines.push(`Öğrenciler: ${progress.join(' · ')}`);
          lines.push('Okulu bitiren çocuk büyüyünce rastgele bir meslekte doğrudan Kalfa (Sv. 2) olur');
        } else {
          lines.push('Kasabada şu an okul çağında çocuk yok');
        }
        const educated = state.characters.filter((c) => c.educated).length;
        if (educated) lines.push(`Okuldan yetişen: ${educated} sakin`);
        const done = RESEARCH_KEYS.filter((id) => state.research.done[id]).length;
        lines.push(`Tamamlanan araştırma: ${done}/${RESEARCH_KEYS.length}`);
        if (building.processStatus) lines.push(building.processStatus);
        break;
      }
      case 'harbor': {
        const trade = state.trade;
        lines.push(`Kasaba Hazinesi: ${state.resources.gold} altın`);
        lines.push(`Toplam: ${trade.shipments} sefer · ${trade.goldEarned} altın kazanıldı`);
        if (trade.last) lines.push(`Son sefer (Gün ${trade.last.day}): ${cargoText(trade.last.cargo)} → +${trade.last.gold} altın`);
        lines.push(`Ara sıra Ticaret Bereketi (%${Math.round(EXPORT.bonusChance * 100)}): kasabaya refah ve iş hızı`);
        lines.push(building.lit ? 'Liman feneri yanıyor' : 'Liman feneri akşam yanar');
        {
          // (15. aşama) usta işi eserler limandan tam değerine ihraç edilir (Kasaba Arşivi'nin vitrininden)
          const stored = storedMasterworks(state);
          if (stored.length) lines.push(`Usta işi eser: ${stored.length} eser ihraca hazır (${stored.reduce((a, i) => a + masterworkPrice(i.type, 'harbor'), 0)} altın değerinde) · Arşiv'den sat`);
        }
        break;
      }
      case 'wonder': {
        const stages = def.wonder.stages;
        stages.forEach((st, i) => lines.push(`${i < building.wonderStage ? '✓' : i === building.wonderStage && building.project ? '…' : '·'} Aşama ${i + 1}: ${st.name}`));
        if (building.wonderComplete) {
          lines.push(`Altın çağ: kasaba refahı +${def.townBonus.happiness}`);
          lines.push('Geceleri kule bir fener gibi vadiyi aydınlatır; ışığındaki sakinler üşümez');
          lines.push('Saat başı (07:00-22:00) çan çalar');
        } else {
          lines.push('Her aşama inşaatçıların emeğiyle yükselir; maliyet aşama başlarken ödenir');
          lines.push(`Tamamlanınca: refah +${def.townBonus.happiness}, gece feneri, saat başı çan`);
        }
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
        {
          // (15. aşama) zanaat vitrini
          const shown = exhibitedMasterworks(state);
          lines.push(
            shown.length
              ? `Zanaat vitrini: ${shown.map((i) => MASTERPIECES[i.type].name).slice(-3).join(', ')}${shown.length > 3 ? ` ve ${shown.length - 3} eser daha` : ''} · refah +${masterworkHappiness(state)}`
              : `Zanaat vitrini boş: ustaların eserleri Kasaba Arşivi'nden sergilenir (her biri refah +${MASTERWORK.exhibitHappiness})`
          );
        }
        break;
      // 13. aşama: peyzaj
      case 'cherryTree': {
        const look = { spring: 'pembe-beyaz çiçek açmış', summer: 'yeşil yapraklar arasında pembe çiçekli', autumn: 'altın ve kehribar yapraklı', winter: 'karlı dallarında pembe tomurcuklar' };
        lines.push(`Şu an ${look[getSeason(state.time.day).key]}; rüzgârda yaprakları savrulur`);
        lines.push('Yanından geçenlerin keyfi biraz yerine gelir');
        break;
      }
      case 'gazebo': {
        const sitting = state.characters.filter((c) => c.task?.activity === 'gazebo' && c.task.buildingId === building.id && c.task.phase === 'perform').map((c) => c.name);
        lines.push(sitting.length ? `Çardakta oturanlar: ${sitting.join(' ve ')}` : 'Şu an boş; iki kişilik banklar sohbet bekliyor');
        lines.push('Burada sohbet edenlerin arkadaşlığı %60 hızlı gelişir; bekârlar burada daha kolay aşık olur, çiftler evlenir');
        break;
      }
      case 'marbleArch':
        lines.push('Sakinler kemerin altından geçer; yolların üstüne de kurulabilir');
        break;
      case 'flowerFence':
        lines.push('Yan yana kurulan çitler birleşir; bahçe kenarlarını süsler');
        break;
      // 18. aşama: sokak eşyaları ve süs ağaçları
      case 'woodFence': {
        const c = building.connect ?? {};
        const n = ['left', 'right', 'up', 'down'].filter((k) => c[k]).length;
        lines.push(n ? `${n} yönde komşu çite / kapıya bağlı` : 'Tek başına duruyor: yanına çit ekleyince birleşir');
        lines.push('Sakinler çitten geçemez; içeri girilecek yere bir Çit Kapısı koy');
        break;
      }
      case 'fenceGate':
        lines.push('Sakinler kapıyı itip geçer; çitlerle birleşir, yolu kapatmaz');
        break;
      case 'ironLantern':
        lines.push(building.lit ? 'Yanıyor: sokak yumuşak sarı ışıkla aydınlık' : '18:30\'da yanar, 06:30\'da söner');
        lines.push(`Işığı ${Math.round(DARKNESS.lights.ironLantern / 16)} karoya ulaşır: gece buradan geçenler karanlıktan ürkmez`);
        break;
      case 'signpost':
        lines.push('İmleçle üzerine gelince adı tabelada okunur');
        lines.push('Yakınında güzel bir sokakta yürüyenlerin anılarında sokağın adı geçer');
        break;
      case 'parkBench':
        lines.push('Sakinler oturup manzarayı izler; çevresi güzelleştikçe keyifleri daha hızlı dolar');
        break;
      case 'planter':
        lines.push('Yanından geçenler çiçek kokusunu içine çeker; çevresindekiler burada çiçek koklar');
        break;
      case 'birchTree':
      case 'oakTree':
      case 'pineTree': {
        const left = building.plantedAt === null ? 0 : Math.max(0, Math.ceil(ORNAMENTAL_TREES.growHours - (state.totalMinutes - building.plantedAt) / 60));
        const stage = ['Fidan', 'Genç ağaç', 'Ulu ağaç'][building.growthStage];
        lines.push(building.growthStage === 2 ? `${stage}: gölgesinde sakinler oturup dinlenir` : `${stage} · büyüme %${Math.floor(building.growth * 100)} · ulu ağaç olmasına ${left} saat`);
        lines.push('Süs ağacıdır: kesilmez, odun vermez');
        break;
      }
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
        lines.push(`Stok: ${RESOURCE_KEYS.filter((r) => !RESOURCES[r].treasury).map((r) => `${RESOURCES[r].name} ${state.resources[r]}`).join(' · ')} / ${state.storageCapacity}`);
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
        lines.push('Sakinler burada oturup dinlenir; çevresi güzelse manzarayı izleyip keyiflenir');
        break;
      // 16. aşama: keşif ganimetleri
      case 'grapeVine': {
        const gardens = state.buildings.filter((b) => b.type === 'garden' && b.factors?.vineCount > 0).length;
        lines.push(gardens ? `Yanındaki ${gardens} bahçenin verimine +%${Math.round(VINE.gardenBonus * 100)} katıyor` : 'Yanında bahçe yok: yalnızca süs ve keyif');
        lines.push('Handa yemek yiyenler soğuk üzüm şerbeti içer (keyif +5)');
        break;
      }
      case 'ancientTorch':
        lines.push(building.lit ? 'Mavi alev yanıyor: çevresindekilerin içi ısınıyor' : 'Mavi alevi 18:00\'de yanar, 06:00\'da söner');
        lines.push('Kışın yakınındakiler üşümez; gece yanından geçenlerin keyfi yerine gelir');
        break;
      default:
        break;
    }
    // (18. aşama) Süsün çevreye kattığı estetik ve bulunduğu köşenin güzelliği
    if (AESTHETIC.values[building.type] && building.functional) {
      const here = state.landscapeField?.[building.tileY * state.map.width + building.tileX] ?? null;
      const level = here !== null ? aestheticLevel(here) : null;
      lines.push(`Çevre estetiği: +${AESTHETIC.values[building.type]} (yaklaşık ${Math.round(AESTHETIC.radius)} karoya yayılır)${level ? ` · burası ${level.toLocaleLowerCase('tr')}` : ''}`);
      lines.push(`Kasabanın estetiği ${state.landscape?.score ?? 0} puan · refah +%${state.landscape?.percent ?? 0}`);
    }
    // (15. aşama) Ustaların bu iş yerinde çıkarabileceği usta işi eser
    const masterpiece = MASTERPIECES[MASTERPIECE_BY_ACTIVITY[def.workActivity]];
    if (masterpiece && building.functional) {
      const low = Math.round(MASTERWORK.baseChance * 100);
      const high = Math.round((MASTERWORK.baseChance + MASTERWORK.pinnedBonus + MASTERWORK.toolBonus) * 100);
      lines.push(`Usta işi eser: Usta çalışanlar mesai sonunda %${low}-${high} şansla ${masterpiece.name} çıkarır`);
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
    // (16. aşama) Antik Su Kemeri Şeması ve üzüm asmaları
    if (f.scheme > 1) lines.push(`Antik Su Kemeri Şeması: +${percent(f.scheme - 1)}`);
    if (f.vines > 1) lines.push(`Üzüm asmaları (${f.vineCount}): +${percent(f.vines - 1)}`);
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
