// Seçili karakterin bilgi paneli: büyütülmüş, nefes alan piksel portre; ad, yaş, ev;
// kişilik etiketleri (zıddıyla); şu anki eylemi; dört ihtiyacın doluluk çubukları; ailesi (eşi /
// sevgilisi, çocukları, ebeveynleri: isme tıklayınca o sakin seçilir); İlişkiler (eşi kalple, en yakın
// arkadaşları ve anlaşamadığı rakibi kırmızı çubukla); kuşandığı ekipman (Alet, Kıyafet, Çanta yuvaları);
// en çok geliştiği meslekler; kışın üşüyüp üşümediği, Mutlu Yuva morali ve kamera takibi.
// (13. aşama) Ada tıklayınca metin kutusuna döner: Enter yeni adı kaydeder ('ui:renameCharacter'), Esc vazgeçer.
// Sabitlenmiş iş yeri ve handaki baharatlı yemeğin hız bonusu durum etiketlerinde görünür.
// (14. aşama) "Anılar ve Hatıralar": sakinin hayat yolculuğu (en yenisi üstte; ilk 5'i, istenirse tümü); o an
// hatırladığı anı vurgulanır ve durum satırında "Anılara daldı" etiketi çıkar.
// (19. aşama) "Sosyal Hayat": huyu (Hayvansever, Kitap Kurdu, Müzisyen, Doğa Tutkunu), eşi ve paylaştıkları ev, son
// duyduğu dedikodu (kimden, ne zaman). Huy ayrıca kişilik etiketlerinin yanında altın çerçeveli bir çip olarak görünür.
// (21. aşama) "Kişisel Kese & Çanta": sakinin altını ve çantasındaki eşyalar (4 yuva, Sırt Çantası'yla 6); isyancıysa
// kırmızı "İsyancı" etiketi. Açık bir dilekçesi varsa kartın üstünde parşömen kutusu: isteği, ne yapılmalı, kalan süre ve
// Kabul Et / Hemen Karşıla / Reddet düğmeleri ('ui:acceptPetition', 'ui:grantPetition', 'ui:rejectPetition').
// (25.1) Adın altında yaşam evresi rozeti (Çocuk / Genç / Yetişkin / Kıdemli Bilge) ve yaşı; bilge emekliyse "Emekli",
// çekirdek sakin kuralıyla çalışıyorsa "Gönüllü usta" yazar. Rozetin ipucu evrenin açıklaması ve bir sonraki doğum günüdür.
// (25.2) "Çıraklık": çırağın ustası, meslek dalı, ilerleme çubuğu (%X Çıraklık), çırak işleri ve mezuniyet beklentisi
// ('ui:releaseApprentice'); çırak olmayan Genç için "Çıraklığa Yaz" ('ui:enrollApprentice'); ustanın kartında "Çırağı: ..."
// ve Gururlu Usta etiketi.
import { getCharacterSprite, getCharacterPortraitURL, characterHeight, CHARACTER_WIDTH, CHARACTER_HEIGHT } from '../../art/sprites/index.js';
import { NEEDS, NEED_KEYS, TRAITS } from '../../data/characters.js';
import { PANEL_LIST_SIZE, PANEL_MIN_LEVEL, PANEL_RIVAL_BELOW, MIN_FRIENDSHIP } from '../../data/relationships.js';
import { EQUIPMENT, EQUIPMENT_SLOTS, SLOT_KEYS } from '../../data/equipment.js';
import { topFriends, worstRelation, partnerOf, childrenOf, getFriendship } from '../../systems/RelationshipSystem.js';
import { topSkills, progressToNext, primarySkill } from '../../systems/SkillSystem.js';
import { isShivering } from '../../systems/HeatingSystem.js';
import { coldProtection } from '../../systems/Equipment.js';
import { opposingTrait } from '../../ai/TraitProfile.js';
import { getSeason } from '../../data/seasons.js';
import { ILLNESS, VIGOR } from '../../data/health.js';
import { PANEL_SKILL_COUNT, SKILL_LEVELS, OUTFIT_KITS, CRAFT_BADGES } from '../../data/skills.js';
import { getIconDataURL, getAnyIconURL } from '../../art/ui/index.js';
import { SCHOOL } from '../../data/research.js';
import { CHARACTER_NAME_MAX_LENGTH } from '../../data/characters.js';
import { LUXURY_GOODS } from '../../data/luxury.js';
import { el } from '../dom.js';
import { QUIRKS } from '../../data/social.js';
import { ITEMS, PETITION_KINDS } from '../../data/citizens.js';
import { RESOURCES } from '../../data/resources.js';
import { inventoryCapacity, petitionOf, isRioter, raidOf } from '../../systems/Citizens.js';
import { petitionProgress, grantStatus, formatRemaining } from '../../systems/Petitions.js';
import { INJURY } from '../../data/crisis.js';
import { LIFE_STAGES, AGING } from '../../data/lifeStages.js';
import { PROFESSIONS, PROUD_MASTER, GRANDMASTER } from '../../data/apprenticeship.js';
import { grandmasterTitle } from '../../systems/Grandmaster.js';
import { apprenticesOf, graduationFor, acceptsApprentice, apprenticeStatus } from '../../systems/Apprenticeship.js';
import { ORIGIN_NAMES } from '../../data/temperament.js';
import { generationName } from '../../systems/Lineage.js';
import { heirloomSlot } from '../../systems/Citizens.js';

const PORTRAIT_SCALE = 5;
const LOW_NEED = 25;
// Boş yuvada soluk gösterilen örnek simge
const SLOT_PLACEHOLDER = { tool: 'sturdyTool', clothing: 'winterCoat', bag: 'backpack' };

export class CharacterPanel {
  constructor(game) {
    this.slot = 'cards'; // (17. aşama) sağ alt köşedeki bağımsız bilgi kartı
    this.events = game.events;
    this.characterId = null;
    this.editingId = null; // adı düzenlenen sakin (düzenleme başladığı andaki seçim)
    this.followingId = null;
    this.builtFor = null;
    this.resetCaches();

    this.build();

    game.events.on('character:selected', (id) => {
      // Ad kutusu açıkken başka bir sakin seçilirse (ör. listeden; liste odağı çalmaz) yazılan ad eski sakine
      // kaydedilir; aksi halde Enter yeni seçilen sakinin adını değiştirirdi
      if (id !== this.characterId) this.editName(false, true);
      this.characterId = id;
      this.element.hidden = id === null;
      this.builtFor = null;
      this.updateFollowButton();
    });
    game.events.on('camera:followChanged', (id) => {
      this.followingId = id;
      this.updateFollowButton();
    });
  }

  build() {
    this.portrait = el('canvas', {
      className: 'character-portrait',
      width: CHARACTER_WIDTH * PORTRAIT_SCALE,
      height: CHARACTER_HEIGHT * PORTRAIT_SCALE,
    });
    this.portraitCtx = this.portrait.getContext('2d');

    this.name = el('h2', { className: 'character-name is-renamable', title: 'Adını değiştirmek için tıkla' });
    this.nameInput = el('input', { className: 'character-name-input', type: 'text', maxLength: CHARACTER_NAME_MAX_LENGTH, hidden: true });
    this.name.addEventListener('click', () => this.editName(true));
    this.nameInput.addEventListener('keydown', (e) => {
      e.stopPropagation(); // yazarken oyun kısayolları çalışmasın
      if (e.key === 'Enter') this.editName(false, true);
      if (e.key === 'Escape') this.editName(false, false);
    });
    this.nameInput.addEventListener('blur', () => this.editName(false, true));
    this.stageBadge = el('div', { className: 'life-stage-row' });
    this.meta = el('div', { className: 'character-meta' });
    this.traits = el('div', { className: 'character-traits' });
    // (15. aşama) Zanaat rozeti: ana meslek ve kademesi (Çırak bronz, Kalfa gümüş, Usta altın) ve giydiği kıyafet
    this.badgeIcon = el('img', { className: 'craft-badge-icon', alt: '' });
    this.badgeText = el('span', { className: 'craft-badge-text' });
    this.craftBadge = el('div', { className: 'craft-badge', hidden: true }, [this.badgeIcon, this.badgeText]);
    this.lastBadge = null;
    this.status = el('div', { className: 'character-status-text' });

    const closeButton = this.button('✕', 'Kapat (Esc)', () => this.events.emit('ui:selectCharacter', null));
    closeButton.classList.add('character-close');

    this.needRows = {};
    const needs = NEED_KEYS.map((key) => {
      const fill = el('span', { className: `need-fill need-${key}` });
      const value = el('span', { className: 'need-value' });
      const row = el('div', { className: 'need-row' }, [
        el('span', { className: 'need-label', text: NEEDS[key].name }),
        el('span', { className: 'need-bar' }, [fill]),
        value,
      ]);
      this.needRows[key] = { row, fill, value };
      return row;
    });

    this.familyList = el('div', { className: 'family-list' });
    this.relationsList = el('div', { className: 'relations-list' });
    this.equipmentList = el('div', { className: 'equipment-slots' });
    this.skillsList = el('div', { className: 'relations-list skills-list' });
    this.conditions = el('div', { className: 'character-conditions' });
    this.socialList = el('div', { className: 'social-life' });
    this.purseBox = el('div', { className: 'purse-box' });
    this.apprenticeBox = el('div', { className: 'apprentice-box' });
    this.petitionBox = el('div', { className: 'petition-box', hidden: true });
    this.memoryList = el('div', { className: 'memory-list' });
    this.memoryToggle = this.button('Tümünü Göster', 'Sakinin bütün anılarını göster / gizle', () => {
      this.showAllMemories = !this.showAllMemories;
      this.lastMemories = null;
    });
    this.memoryToggle.classList.add('memory-toggle');
    this.memoryBox = el('div', {}, [this.memoryList, this.memoryToggle]);
    this.showAllMemories = false;

    this.followButton = this.button('Kamerayla Takip Et', 'Kamera bu karakteri takip etsin', () => {
      const next = this.followingId === this.characterId ? null : this.characterId;
      this.events.emit('ui:followCharacter', next);
    });
    this.followButton.classList.add('character-follow');

    const section = (title, body) => el('div', { className: 'relations' }, [el('div', { className: 'relations-title', text: title }), body]);
    this.element = el('div', { className: 'panel character-panel ui-interactive', hidden: true }, [
      closeButton,
      el('div', { className: 'character-header' }, [
        el('div', { className: 'character-portrait-frame' }, [this.portrait]),
        el('div', { className: 'character-identity' }, [this.name, this.nameInput, this.stageBadge, this.meta, this.craftBadge, this.traits]),
      ]),
      el('div', { className: 'character-status' }, [el('span', { className: 'character-status-label', text: 'Durum' }), this.status, this.conditions]),
      this.petitionBox,
      el('div', { className: 'character-needs' }, needs),
      section('Aile', this.familyList),
      section('İlişkiler', this.relationsList),
      section('Sosyal Hayat', this.socialList),
      (this.apprenticeSection = section('Çıraklık', this.apprenticeBox)),
      section('Ekipman', this.equipmentList),
      section('Kişisel Kese & Çanta', this.purseBox),
      section('Meslekler', this.skillsList),
      section('Anılar ve Hatıralar', this.memoryBox),
      this.followButton,
    ]);
  }

  /** Sakinin adını düzenlemeye başlar / bitirir (commit: yazılanı kaydet). */
  editName(editing, commit = false) {
    if (editing) {
      if (this.characterId === null) return;
      this.editingId = this.characterId;
      this.nameInput.value = this.name.textContent;
      this.name.hidden = true;
      this.nameInput.hidden = false;
      this.nameInput.focus();
      this.nameInput.select();
      return;
    }
    if (this.nameInput.hidden) return;
    this.nameInput.hidden = true;
    this.name.hidden = false;
    if (commit && this.editingId !== null) this.events.emit('ui:renameCharacter', { id: this.editingId, name: this.nameInput.value });
    this.editingId = null;
  }

  button(label, title, onClick) {
    const b = el('button', { className: 'hud-btn', type: 'button', text: label, title, tabIndex: -1 });
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', onClick);
    return b;
  }

  /** Tıklanınca o sakini seçen isim düğmesi. */
  personChip(character) {
    const chip = this.button(character.name, `${character.name}: seç ve kamerayı ona kaydır`, () => this.events.emit('ui:selectCharacter', character.id));
    chip.classList.add('person-chip');
    return chip;
  }

  updateFollowButton() {
    const following = this.characterId !== null && this.followingId === this.characterId;
    this.followButton.textContent = following ? 'Takibi Bırak' : 'Kamerayla Takip Et';
    this.followButton.classList.toggle('is-active', following);
  }

  /** Kimlik bilgisi değişince yeniden kurulur (karakter, ev, çocukluk, aile durumu). */
  identityKey(character) {
    return `${character.id}:${character.name}:${character.homeId}:${character.isChild}:${character.partnerId}:${character.married}:${character.quirk}:${character.lifeStage}:${character.age}:${character.retired}`;
  }

  /** Değişmedikçe bir kez kurulan kısımlar: ad, yaş, ev, özellik etiketleri. */
  buildIdentity(character, state) {
    this.name.textContent = character.name;

    const homes = state.buildings.filter((b) => b.type === 'cabin');
    const homeIndex = homes.findIndex((b) => b.id === character.homeId);
    const home = homes[homeIndex];
    const roommates = state.characters
      .filter((o) => o !== character && o.homeId === character.homeId)
      .map((o) => o.name);
    const where = home ? `${homeIndex + 1} numaralı ${home.upgraded ? 'taş ev' : 'kulübe'}` : 'Evsiz';
    const withWhom = roommates.length ? ` · ${roommates.join(', ')} ile` : ' · tek başına';
    this.renderLifeStage(character);
    this.meta.textContent = `${where}${home ? withWhom : ''}`;

    const quirk = QUIRKS[character.quirk];
    this.traits.replaceChildren(
      ...character.traits.map((key) => {
        const opposite = opposingTrait(key);
        const title = `${TRAITS[key]?.description ?? ''}${opposite ? ` · Zıddı: ${TRAITS[opposite].name} (atışabilirler)` : ''}`;
        return el('span', { className: 'trait-chip', text: TRAITS[key]?.name ?? key, title });
      }),
      ...(quirk ? [el('span', { className: `trait-chip quirk-chip${quirk.color ? ` quirk-${quirk.color}` : ''}`, title: `Huyu: ${quirk.description}${quirk.generation ? ' (yeni nesil huy)' : ''}` }, [el('img', { src: getAnyIconURL(quirk.icon), alt: '' }), quirk.name])] : [])
    );
    this.resetCaches();
  }

  /** (25.1) Yaşam evresi rozeti ve yaş: "Kıdemli Bilge · 70 yaşında · Emekli". */
  renderLifeStage(character) {
    const key = LIFE_STAGES[character.lifeStage] ? character.lifeStage : character.isChild ? 'child' : 'adult';
    const stage = LIFE_STAGES[key];
    const daysToBirthday = AGING.daysPerYear - (character.ageInDays % AGING.daysPerYear);
    const note =
      key === 'elder' ? (character.retired ? 'Emekli · ağır işlerden muaf' : 'Gönüllü usta · kasabada çalışan el az') : key === 'youth' ? 'Çevik ve hevesli' : null;
    const title = `${stage.description} Bir sonraki doğum gününe ${daysToBirthday} gün var.`;
    this.stageBadge.replaceChildren(
      el('span', { className: `life-stage-badge is-${key}`, title }, [el('img', { src: getAnyIconURL(stage.icon), alt: '' }), stage.name]),
      el('span', { className: 'life-stage-age', text: `${character.age} yaşında` }),
      ...(note ? [el('span', { className: 'life-stage-note', text: note })] : []),
      // (28.3) Saygın Büyük: nüfus kotasından muaf, yatağı yok
      ...(character.isVenerable ? [el('span', { className: 'life-stage-venerable', title: 'Ocağını ve yadigârını devretti; yatağını gençlere bıraktı. Nüfus sınırına sayılmaz; geceleri Bilgelik Evi\'nde, handa ya da belediyede sabahlar.', text: 'Saygın Büyük (Nüfus Kotasından Muaf)' })] : [])
    );
  }

  /** null: yeni sakinin listeleri boş olsa bile (anahtar '') bir kez çizilsin, öncekinden kalmasın. */
  resetCaches() {
    this.lastFrame = null;
    this.lastStatus = null;
    this.lastNeeds = {};
    this.lastRelations = null;
    this.lastSkills = null;
    this.lastConditions = null;
    this.lastFamily = null;
    this.lastEquipment = null;
    this.lastMemories = null;
    this.lastSocial = null;
    this.lastPurse = null;
    this.lastApprentice = null;
    this.lastPetition = null;
  }

  render(game) {
    if (this.characterId === null) return;
    const character = game.state.characters.find((c) => c.id === this.characterId);
    if (!character) {
      this.element.hidden = true;
      return;
    }
    const identity = this.identityKey(character);
    if (this.builtFor !== identity) {
      this.buildIdentity(character, game.state);
      this.builtFor = identity;
    }

    this.renderPortrait(character);

    if (character.activityLabel !== this.lastStatus) {
      this.lastStatus = character.activityLabel;
      this.status.textContent = character.activityLabel;
    }

    for (const key of NEED_KEYS) {
      const value = Math.round(character.needs[key]);
      if (this.lastNeeds[key] === value) continue;
      this.lastNeeds[key] = value;
      const { row, fill, value: label } = this.needRows[key];
      fill.style.width = `${value}%`;
      label.textContent = String(value);
      row.classList.toggle('is-low', value < LOW_NEED);
    }
    this.renderFamily(character, game.state);
    this.renderRelations(character, game.state);
    this.renderEquipment(character);
    this.renderSkills(character);
    this.renderBadge(character);
    this.renderConditions(character, game.state);
    this.renderMemories(character, game.state);
    this.renderSocial(character, game.state);
    this.renderPurse(character, game.state);
    this.renderApprenticeship(character, game.state);
    this.renderPetition(character, game.state);
  }

  /** (25.2) Çıraklık: çırağın ustası, dalı ve ilerlemesi; ustanın çırakları; Genç için "Çıraklığa Yaz". */
  renderApprenticeship(character, state) {
    const a = character.apprenticeship;
    const pupils = apprenticesOf(state, character);
    const youth = character.lifeStage === 'youth' && !character.role;
    const proud = (character.buffs.proudMaster ?? -1) > state.totalMinutes;
    const canEnroll = youth && !a && state.buildings.some((b) => acceptsApprentice(state, b));
    const status = apprenticeStatus(state, character); // (27.3) bekleme / pratik nedeni
    const key = a
      ? `a:${a.masterId}:${a.buildingId}:${Math.floor(a.progress)}:${a.crafted}:${status?.text}`
      : `${youth}:${canEnroll}:${pupils.map((p) => `${p.id}-${Math.floor(p.apprenticeship.progress)}`).join(',')}:${proud}`;
    if (key === this.lastApprentice) return;
    this.lastApprentice = key;
    this.apprenticeSection.hidden = !a && !youth && pupils.length === 0;
    const rows = [];
    const row = (label, value) => el('div', { className: 'social-row' }, [el('span', { className: 'social-label', text: label }), el('span', { className: 'social-value' }, value)]);
    if (a) {
      const prof = PROFESSIONS[a.profession];
      const master = state.characters.find((c) => c.id === a.masterId);
      const building = state.buildings.find((b) => b.id === a.buildingId);
      const pct = Math.floor(a.progress);
      const grad = graduationFor(a.progress);
      rows.push(row('Ustası', [master ? this.personChip(master) : el('span', { className: 'social-muted', text: 'Usta bekleniyor' })]));
      rows.push(row('Meslek dalı', [el('span', { text: `${prof.name} · ${building?.name ?? ''}` })]));
      rows.push(
        el('div', { className: 'apprentice-progress', title: `Ustası tezgâhtayken mesai saatlerinde ilerler. %${PROUD_MASTER.workBoostFrom}'den sonra çırak işi çıkarır ve ustanın verimine katkı sağlar.` }, [
          el('span', { className: 'apprentice-bar' }, [el('span', { className: 'apprentice-fill', style: `width: ${pct}%` })]),
          el('span', { className: 'apprentice-pct', text: `%${pct} Çıraklık` }),
        ])
      );
      if (status) rows.push(el('div', { className: `apprentice-note${status.ok ? ' is-ok' : ''}`, text: status.text }));
      rows.push(row('Yetişkinlikte', [el('span', { text: grad.title ? `${grad.title} ${prof.master}` : `${prof.master} deneyimiyle (%${pct})` })]));
      if (a.crafted) rows.push(row('Çırak işi', [el('span', { text: `${a.crafted} parça` })]));
      const leave = this.button('Çıraklıktan Ayır', 'Genç her zamanki işlerine döner (ilerlemesi silinir)', () => this.events.emit('ui:releaseApprentice', { characterId: character.id }));
      rows.push(el('div', { className: 'apprentice-actions' }, [leave]));
    } else if (youth) {
      rows.push(el('div', { className: 'social-row' }, [el('span', { className: 'social-value social-muted', text: 'Henüz bir ustanın yanında değil' })]));
      const join = this.button('Çıraklığa Yaz', canEnroll ? 'En deneyimli ustanın atölyesine çırak olur' : 'Çırak alabilecek bir zanaat yapısı yok (ya da hepsi dolu)', () => this.events.emit('ui:enrollApprentice', { characterId: character.id }));
      join.disabled = !canEnroll;
      rows.push(el('div', { className: 'apprentice-actions' }, [join]));
    }
    if (pupils.length) {
      rows.push(row(pupils.length > 1 ? 'Çırakları' : 'Çırağı', pupils.map((p) => this.personChip(p))));
      if (proud) rows.push(el('div', { className: 'social-row' }, [el('span', { className: 'social-value', text: 'Gururlu Usta: keyfi yavaş düşüyor' })]));
    }
    this.apprenticeBox.replaceChildren(...rows);
  }

  /** (21. aşama) Kişisel Kese & Çanta: altını ve çantasındaki eşyalar (boş yuvalar soluk). */
  renderPurse(character, state) {
    const capacity = inventoryCapacity(character);
    const rioter = isRioter(state, character);
    const raid = rioter ? raidOf(state, character) : null;
    const inv = character.inventory ?? [];
    const leaving = Boolean(character.emigrating); // (22. aşama) köyü terk ediyor
    const key = `${character.id}:${character.coins}:${capacity}:${rioter}:${leaving}:${raid?.id ?? ''}:${inv.map((s) => `${s.kind}${s.qty}${s.name ?? ''}${s.heirloom ? s.heirloom.chain.join('>') : ''}`).join(',')}`;
    if (key === this.lastPurse) return;
    this.lastPurse = key;
    const coins = el('div', { className: 'purse-coins', title: 'Kişisel kese: yevmiyeler, usta eseri ödülleri ve alışveriş (kasaba hazinesinden ayrıdır)' }, [
      el('img', { src: getAnyIconURL('purse'), alt: '' }),
      el('span', { className: 'purse-amount', text: `${character.coins ?? 0}` }),
      el('span', { className: 'purse-unit', text: 'altın' }),
      ...(leaving
        ? [el('span', { className: 'purse-rioter is-leaving', text: 'Köyü terk ediyor', title: 'Umudunu kaybetti: kesesi ve çantasıyla kasabadan temelli ayrılıyor' })]
        : rioter
          ? [el('span', { className: 'purse-rioter', text: raid ? 'Yağmada' : 'İsyancı', title: 'Yönetime öfkeli: işi bıraktı, meydanda toplanıyor' })]
          : []),
    ]);
    const slots = [];
    for (let i = 0; i < capacity; i++) {
      const item = inv[i];
      const def = item ? ITEMS[item.kind] : null;
      const name = item ? item.name ?? def.name : 'Boş yuva';
      // (25.5) Aile yadigârı: hikâyesi ve devir zinciri; satılmaz, feda edilmez
      const heir = item?.heirloom;
      const hint = heir ? `${name} · Aile yadigârı (satılmaz, feda edilmez)\n${heir.story}\nKuşaktan kuşağa: ${heir.chain.join(' → ')}` : def ? `${name}${item.qty > 1 ? ` ×${item.qty}` : ''}${def.hunger ? ` · tokluk +${def.hunger}` : ''}${def.heal ? ' · hastalığı çabuk geçirir' : ''}${def.fun ? ' · bakınca keyif verir' : ''}${def.resource && !def.hunger ? ` · ${RESOURCES[def.resource].name}` : ''}` : 'Boş yuva';
      slots.push(
        el('span', { className: `bag-slot${item ? '' : ' is-empty'}${heir ? ' is-heirloom' : ''}`, title: hint }, [
          ...(item ? [el('img', { src: getAnyIconURL(def.icon), alt: '' })] : []),
          ...(item && item.qty > 1 ? [el('span', { className: 'bag-qty', text: String(item.qty) })] : []),
        ])
      );
    }
    const summary = inv.length ? inv.map((s) => `${s.name ?? ITEMS[s.kind].name}${s.qty > 1 ? ` ×${s.qty}` : ''}`).join(', ') : 'Çantası boş';
    // (27.3) Aile yadigârının devir zinciri: ipucunun yanı sıra kartta da okunur bir satır
    const relic = inv.find((s) => s.heirloom);
    const chain = relic
      ? [
          el('div', { className: 'social-row' }, [el('span', { className: 'social-label', text: 'Aile yadigârı' }), el('span', { className: 'social-value', text: relic.name ?? ITEMS[relic.kind].name })]),
          el('div', { className: 'heirloom-chain', title: relic.heirloom.story }, relic.heirloom.chain.flatMap((name, i) => [...(i ? [el('span', { className: 'chain-arrow', text: '→' })] : []), el('span', { className: 'chain-link', text: name })])),
        ]
      : [];
    this.purseBox.replaceChildren(coins, el('div', { className: 'bag-slots' }, slots), el('div', { className: 'bag-summary', text: summary }), ...chain);
  }

  /** (21. aşama) Açık dilekçe: isteği, ne yapılmalı, kalan süre ve yanıt düğmeleri. */
  renderPetition(character, state) {
    const p = petitionOf(state, character);
    if (!p) {
      if (this.lastPetition !== '') {
        this.lastPetition = '';
        this.petitionBox.hidden = true;
        this.petitionBox.replaceChildren();
      }
      return;
    }
    const def = PETITION_KINDS[p.kind];
    const progress = petitionProgress(state, p);
    const grant = grantStatus(state, p, state.equipment?.sturdyTool ?? 0);
    const left = formatRemaining(p.deadline - state.totalMinutes);
    const key = `${p.id}:${p.status}:${left}:${progress}:${grant.ok}:${grant.reason}`;
    if (key === this.lastPetition) return;
    this.lastPetition = key;
    const buttons = [];
    if (p.status !== 'accepted') buttons.push(this.button('Kabul Et', 'Dileği kabul et: yerine getirmek için yarım gün ek süre (güven +1)', () => this.events.emit('ui:acceptPetition', { id: p.id })));
    if (grant.available) {
      const cost = Object.entries(grant.cost).map(([r, v]) => `${RESOURCES[r].name} ${v}`).join(', ');
      const b = this.button(grant.label, grant.ok ? `Hemen karşıla${cost ? ` (${cost})` : ''}${grant.reason ? ` · ${grant.reason}` : ''}` : grant.reason, () => this.events.emit('ui:grantPetition', { id: p.id }));
      b.disabled = !grant.ok;
      b.classList.add('is-grant');
      buttons.push(b);
    }
    const reject = this.button('Reddet', 'Dileği reddet: sakinin keyfi ve Yönetim Güveni düşer', () => this.events.emit('ui:rejectPetition', { id: p.id }));
    reject.classList.add('is-reject');
    buttons.push(reject);
    this.petitionBox.hidden = false;
    this.petitionBox.replaceChildren(
      el('div', { className: 'petition-head' }, [
        el('img', { src: getAnyIconURL('scroll'), alt: '' }),
        el('span', { className: 'petition-title', text: `Dilekçe · ${def.name}` }),
        el('span', { className: `petition-state${p.status === 'accepted' ? ' is-accepted' : ''}`, text: p.status === 'accepted' ? 'Söz verildi' : 'Yanıt bekliyor' }),
      ]),
      el('div', { className: 'petition-text', text: `"${p.text}"` }),
      el('div', { className: 'petition-progress', text: progress }),
      el('div', { className: 'petition-meta', text: `Kalan süre: ${left}` }),
      el('div', { className: 'petition-buttons' }, buttons)
    );
  }

  /** (19. aşama) Sosyal Hayat: huyu, eşi ve paylaştıkları ev, son duyduğu haber. */
  renderSocial(character, state) {
    const quirk = QUIRKS[character.quirk];
    const partner = partnerOf(state, character);
    const news = character.lastNews;
    const homes = state.buildings.filter((b) => b.type === 'cabin');
    const homeIndex = homes.findIndex((b) => b.id === character.homeId);
    const home = homes[homeIndex] ?? null;
    const key = [character.id, character.quirk, character.quirkOrigin?.kind, partner?.id, character.married, partner?.homeId, character.homeId, character.relocating, partner?.relocating, homeIndex, home?.upgraded, news?.id, news?.from].join('/');
    if (key === this.lastSocial) return;
    this.lastSocial = key;

    const homeName = home ? `${homeIndex + 1} numaralı ${home.upgraded ? 'taş ev' : 'kulübe'}` : null;
    const row = (icon, label, body, title = '') =>
      el('div', { className: 'social-row', title }, [
        el('img', { className: 'social-icon', src: getAnyIconURL(icon), alt: '' }),
        el('div', { className: 'social-text' }, [el('span', { className: 'social-label', text: label }), ...body]),
      ]);
    const rows = [];
    if (quirk) rows.push(row(quirk.icon, 'Huyu', [el('span', { className: `social-value${quirk.color ? ` quirk-text-${quirk.color}` : ''}`, text: quirk.name })], quirk.description));
    // (25.3) Huyun kaynağı: Aile mirası (kimden), Usta etkisi, Mesleğin doğası, Özgün gelişim
    const origin = character.quirkOrigin;
    if (quirk && origin) {
      const from = origin.fromName ? ` · ${origin.kind === 'craft' ? `${origin.fromName} çıraklığı` : origin.fromName}` : '';
      rows.push(row(quirk.icon, 'Mizacı', [el('span', { className: 'social-value', text: `${ORIGIN_NAMES[origin.kind]}${from}${origin.day ? ` (Gün ${origin.day})` : ''}` })], 'Altın Çağ kuşağı: evre geçişinde mizacını ailesinden, ustasından ya da kendinden aldı'));
    }

    // Ev: eşiyle paylaşılan ev ya da taşınma
    let homeText;
    if (partner && character.married) {
      if (partner.homeId === character.homeId && homeName) homeText = character.relocating || partner.relocating ? `Eşiyle ${homeIndex + 1} numaralı ${home.upgraded ? 'taş eve' : 'kulübeye'} taşınıyorlar` : `Eşiyle ${homeName}de birlikte yaşıyor`;
      else homeText = 'Eşiyle ortak bir ev bekliyorlar (yer açılınca taşınacaklar)';
    } else if (partner) {
      homeText = homeName ? `Sevgilisiyle flört ediyor · ${homeName}de oturuyor` : 'Sevgilisiyle flört ediyor';
    } else {
      homeText = character.isChild ? (homeName ? `Ailesiyle ${homeName}de` : 'Ailesiyle') : homeName ? `Bekâr · ${homeName}de oturuyor` : 'Bekâr · henüz evi yok';
    }
    const homeBody = [el('span', { className: 'social-value', text: homeText })];
    if (partner) homeBody.unshift(this.personChip(partner));
    rows.push(row(character.married ? 'ring' : partner ? 'love' : 'heart', partner ? (character.married ? 'Eşi ve evi' : 'Sevgilisi') : 'Evi', homeBody));

    // Son duyduğu dedikodu
    if (news) {
      const when = `Gün ${news.day}, ${String(news.hour).padStart(2, '0')}:00`;
      rows.push(row('whisper', 'Son duyduğu', [el('span', { className: 'social-value social-news', text: `"${news.text}"` }), el('span', { className: 'social-meta', text: `${news.from} anlattı · ${when}` })]));
    } else {
      rows.push(row('whisper', 'Son duyduğu', [el('span', { className: 'social-value social-muted', text: 'Henüz kulağına ilginç bir haber gelmedi' })]));
    }
    this.socialList.replaceChildren(...rows);
  }

  /** Aile: medeni durum (eşi / sevgilisi), çocukları ve ebeveynleri; çocuksa büyümesine kalan süre. */
  renderFamily(character, state) {
    const partner = partnerOf(state, character);
    const children = childrenOf(state, character);
    const parents = character.parentIds.map((id) => state.characters.find((c) => c.id === id)).filter(Boolean);
    const daysLeft = character.isChild ? Math.max(0, Math.ceil((character.growsUpAt - state.totalMinutes) / 1440)) : null;
    const key = [partner?.id, character.married, children.map((c) => c.id).join(','), parents.map((c) => c.id).join(','), daysLeft, character.generation, character.familyId, (character.parents ?? []).join(',')].join('/');
    if (key === this.lastFamily) return;
    this.lastFamily = key;

    const rows = [];
    const row = (label, people, icon = null) =>
      el('div', { className: 'family-row' }, [
        el('span', { className: 'family-label' }, [...(icon ? [el('img', { src: getAnyIconURL(icon), alt: '' })] : []), label]),
        el('span', { className: 'person-chips' }, people.map((p) => this.personChip(p))),
      ]);
    if (character.isChild) {
      rows.push(el('div', { className: 'family-row' }, [el('span', { className: 'family-label' }, [`Büyümesine ${daysLeft} gün var; şimdilik oynuyor, çalışmıyor`])]));
    } else if (partner) {
      rows.push(row(character.married ? 'Eşi' : 'Sevgilisi', [partner], character.married ? 'ring' : 'love'));
    } else {
      rows.push(el('div', { className: 'family-row' }, [el('span', { className: 'family-label' }, ['Bekâr'])]));
    }
    if (children.length) rows.push(row('Çocukları', children));
    if (parents.length) rows.push(row('Ebeveynleri', parents));
    // (25.4) Aile Kütüğü: kuşak, ocak ve köyden ayrılmış doğum ebeveynleri
    const gone = (character.parents ?? []).filter((id) => !parents.some((p) => p.id === id)).length;
    const fam = state.lineage?.families?.[character.familyId];
    rows.push(
      el('div', { className: 'family-row lineage-row' }, [
        el('span', { className: `lineage-badge gen-${Math.min(3, character.generation ?? 1)}`, text: generationName(state, character) }),
        ...(fam ? [el('span', { className: 'family-label', text: ` · ${fam.name}` })] : []),
        ...(gone ? [el('span', { className: 'family-label', text: ` · ${gone} ebeveyni kasabadan ayrıldı` })] : []),
      ])
    );
    this.familyList.replaceChildren(...rows);
  }

  /**
   * İlişkiler: eşi / sevgilisi (kalple, en üstte), en yakın arkadaşları ve varsa anlaşamadığı biri
   * (kırmızı çubukla). Yalnızca değişince yeniden kurulur.
   */
  renderRelations(character, state) {
    const partner = partnerOf(state, character);
    const friends = topFriends(state, character, PANEL_LIST_SIZE, PANEL_MIN_LEVEL, partner ? [partner.id] : []);
    const rival = worstRelation(state, character, PANEL_RIVAL_BELOW);
    const entries = [
      ...(partner ? [{ character: partner, score: getFriendship(state, character, partner), kind: 'partner' }] : []),
      ...friends.map((f) => ({ ...f, kind: 'friend' })),
      ...(rival ? [{ ...rival, kind: 'rival' }] : []),
    ];
    const key = entries.map((e) => `${e.kind}:${e.character.id}:${Math.floor(e.score)}`).join('|');
    if (key === this.lastRelations) return;
    this.lastRelations = key;

    if (entries.length === 0) {
      this.relationsList.replaceChildren(el('div', { className: 'relations-empty', text: 'Henüz yakın bir bağı yok. Sohbet ettikçe ve birlikte çalıştıkça arkadaş olurlar.' }));
      return;
    }
    this.relationsList.replaceChildren(...entries.map((entry) => this.relationRow(character, entry)));
  }

  relationRow(character, { character: other, score, level, kind }) {
    const isRival = kind === 'rival';
    const isPartner = kind === 'partner';
    const label = isPartner ? (character.married ? 'Eşi' : 'Sevgilisi') : level.name;
    const levelClass = isPartner ? 'is-partner' : `is-${level.key}`;
    // Rakip çubuğu puanın eksi tarafını gösterir (-50 = dolu)
    const width = isRival ? Math.round((Math.abs(score) / Math.abs(MIN_FRIENDSHIP)) * 100) : Math.floor(Math.max(0, score));
    const name = el('span', { className: 'relation-name' }, [
      other.name,
      ...(isPartner ? [el('img', { className: 'relation-heart', src: getAnyIconURL(character.married ? 'ring' : 'love'), alt: '' })] : []),
    ]);
    const row = el('button', { className: `relation-row${isRival ? ' is-rival' : ''}${isPartner ? ' is-partner' : ''}`, type: 'button', tabIndex: -1, title: `${other.name}: ${Math.floor(score)} puan · tıkla ve seç` }, [
      el('img', { className: 'relation-portrait', src: getCharacterPortraitURL(other.appearance, other.look), alt: '' }),
      el('div', { className: 'relation-info' }, [name, el('span', { className: `relation-level ${levelClass}`, text: isRival ? `${label} · anlaşamıyorlar` : label })]),
      el('span', { className: 'need-bar relation-bar' }, [el('span', { className: `need-fill relation-fill ${levelClass}`, style: `width: ${width}%` })]),
    ]);
    row.addEventListener('mousedown', (e) => e.preventDefault());
    row.addEventListener('click', () => this.events.emit('ui:selectCharacter', other.id));
    return row;
  }

  /** Ekipman yuvaları: kuşandığı ekipmanın simgesi ve adı, boşsa soluk simge. */
  renderEquipment(character) {
    const key = `${character.isChild}:${SLOT_KEYS.map((s) => character.equipment[s]).join(',')}`;
    if (key === this.lastEquipment) return;
    this.lastEquipment = key;
    this.equipmentList.classList.toggle('is-note', character.isChild);
    if (character.isChild) {
      this.equipmentList.replaceChildren(el('div', { className: 'relations-empty', text: 'Çocuklar ekipman kuşanmaz; büyüyünce onlar da sıraya girer.' }));
      return;
    }
    this.equipmentList.replaceChildren(
      ...SLOT_KEYS.map((slot) => {
        const item = character.equipment[slot];
        const def = item ? EQUIPMENT[item] : null;
        const title = def ? `${def.name}: ${def.description}` : `${EQUIPMENT_SLOTS[slot].name} yuvası boş. Zanaat Atölyesi üretince sakin gelip kuşanır.`;
        return el('div', { className: `equipment-slot${def ? '' : ' is-empty'}`, title }, [
          el('img', { className: 'equipment-icon', src: getIconDataURL(def ? def.icon : SLOT_PLACEHOLDER[slot]), alt: '' }),
          el('span', { className: 'equipment-slot-name', text: EQUIPMENT_SLOTS[slot].name }),
          el('span', { className: 'equipment-item', text: def ? def.shortName : 'Boş' }),
        ]);
      })
    );
  }

  /** Meslekler: ad, kademe (Çırak / Kalfa / Usta) yıldızları ve bir sonraki kademeye ilerleme. */
  /** (15. aşama) Ana mesleğin zanaat rozeti: "Usta Madenci" altın, "Kalfa Fırıncı" gümüş, "Çırak Oduncu" bronz. */
  renderBadge(character) {
    const main = character.isChild ? null : primarySkill(character);
    const gmTitle = grandmasterTitle(character); // (28.2) "Başusta Demirci"
    const key = main ? `${main.skill}:${main.level.level}:${gmTitle ?? ''}` : '';
    if (key === this.lastBadge) return;
    this.lastBadge = key;
    this.craftBadge.hidden = !main;
    if (!main) return;
    if (gmTitle) {
      // (28.2) Başusta: altın-mor rozet, yıldız ikonu
      this.craftBadge.className = 'craft-badge is-grandmaster';
      this.badgeIcon.src = getAnyIconURL('star');
      this.badgeText.textContent = gmTitle;
      this.craftBadge.title = `Başusta: çıraklığını %100 ile tamamladı · usta işi eser şansı 2 kat, her ${GRANDMASTER.saveEvery}. üretimde hammadde harcamaz (${PROFESSIONS[character.grandmasterProfession].name})`;
      return;
    }
    const badge = CRAFT_BADGES[main.level.level];
    const kit = OUTFIT_KITS[main.skill];
    const wear = main.level.level === 3 ? kit?.master : main.level.level === 2 ? kit?.journeyman : null;
    this.craftBadge.className = `craft-badge is-${badge.metal}`;
    this.badgeIcon.src = getIconDataURL(`badge${badge.metal[0].toUpperCase()}${badge.metal.slice(1)}`);
    this.badgeText.textContent = `${main.level.name} ${main.def.title}`;
    this.craftBadge.title = `${badge.name} zanaat rozeti · ${main.def.name}${wear ? ` · Kıyafeti: ${wear}` : ' · Çıraklar sade köylü giysisi giyer'}`;
  }

  renderSkills(character) {
    const skills = topSkills(character, PANEL_SKILL_COUNT);
    const key = skills.map((s) => `${s.skill}:${Math.floor(s.xp / 10)}`).join('|');
    if (key === this.lastSkills) return;
    this.lastSkills = key;
    if (skills.length === 0) {
      const text = character.isChild ? 'Çocuklar çalışmaz; büyüyünce bir meslek edinir.' : 'Henüz bir işte deneyimi yok. Çalıştıkça Çıraklıktan Ustalığa yükselir.';
      this.skillsList.replaceChildren(el('div', { className: 'relations-empty', text }));
      return;
    }
    this.skillsList.replaceChildren(
      ...skills.map(({ def, xp, level }) => {
        const stars = SKILL_LEVELS.map((l) => el('img', { className: 'skill-star', src: getIconDataURL(l.level <= level.level ? 'star' : 'starEmpty'), alt: '' }));
        const bonus = Math.round((level.bonus - 1) * 100);
        return el('div', { className: 'relation-row skill-row', title: `${def.name}: ${Math.floor(xp)} dakika deneyim${bonus ? ` · iş hızı +%${bonus}` : ''}` }, [
          el('img', { className: 'skill-icon', src: getAnyIconURL(def.icon), alt: '' }),
          el('div', { className: 'relation-info' }, [
            el('span', { className: 'relation-name', text: def.name }),
            el('span', { className: `relation-level skill-level is-${level.level}`, text: level.name }),
          ]),
          el('div', { className: 'skill-side' }, [
            el('span', { className: 'skill-stars' }, stars),
            el('span', { className: 'need-bar relation-bar' }, [
              el('span', { className: 'need-fill skill-fill', style: `width: ${Math.round(progressToNext(xp) * 100)}%` }),
            ]),
          ]),
        ]);
      })
    );
  }

  /** Anılar: en yenisi üstte; kapalıyken son 5 anı. Hatırlanan anı vurgulanır. */
  renderMemories(character, state) {
    const memories = character.memories ?? [];
    const recalling = character.recall && character.recall.until > state.totalMinutes ? character.recall : null;
    const key = `${character.id}:${memories.length}:${memories.at(-1)?.text}:${this.showAllMemories}:${recalling?.text ?? ''}`;
    if (key === this.lastMemories) return;
    this.lastMemories = key;
    const shown = [...memories].reverse().slice(0, this.showAllMemories ? memories.length : 5);
    this.memoryList.replaceChildren(
      ...(shown.length
        ? shown.map((m) =>
            el('div', { className: `memory-row${recalling && recalling.text === m.text ? ' is-recalled' : ''}`, title: `Gün ${m.day}, ${String(m.hour).padStart(2, '0')}:00` }, [
              el('img', { src: getAnyIconURL(m.icon ?? 'heart'), alt: '' }),
              el('span', { className: 'memory-day', text: `Gün ${m.day}` }),
              el('span', { text: m.text }),
            ])
          )
        : [el('div', { className: 'relations-empty', text: 'Henüz anlatacak bir anısı yok.' })])
    );
    this.memoryToggle.hidden = memories.length <= 5;
    this.memoryToggle.textContent = this.showAllMemories ? 'Son Anılar' : `Tümünü Göster (${memories.length})`;
  }

  /** Durum etiketleri: kışın üşüyor (paltolu daha az) / içi ısındı, sıcak yemekle tok, Mutlu Yuva. */
  renderConditions(character, state) {
    const now = state.totalMinutes;
    const tags = [];
    if (getSeason(state.time.day).cold) {
      const protection = coldProtection(character);
      if (isShivering(character, state)) {
        tags.push({ text: protection > 0 && character.visible ? `Üşüyor (palto: %${Math.round(protection * 100)} az)` : 'Üşüyor', icon: 'cold', cls: 'is-cold' });
      } else tags.push({ text: 'İçi ısındı', icon: 'fire', cls: 'is-warm' });
    }
    if ((character.buffs.warmMeal ?? -1) > now) tags.push({ text: 'Sıcak yemekle tok', icon: 'food', cls: 'is-warm' });
    if ((character.buffs.happyHome ?? -1) > now) tags.push({ text: 'Mutlu Yuva', icon: 'love', cls: 'is-love' });
    if ((character.buffs.proudMaster ?? -1) > now) tags.push({ text: 'Gururlu Usta', icon: 'star', cls: 'is-love' }); // (25.2)
    // (25.5) Ata Mirası Gururu: yadigâr taşıyan yeni nesil
    const heirSlot = character.lifeStage !== 'elder' ? heirloomSlot(character) : null;
    if (heirSlot) tags.push({ text: `Ata Mirası Gururu: ${heirSlot.name}`, icon: ITEMS[heirSlot.kind].icon, cls: 'is-love' });
    // 11. aşama: hastalık, Dinçlik, keşif seferi
    if (character.illness) {
      const hours = Math.ceil(character.illness.remaining / 60);
      tags.push({ text: `${ILLNESS.label}: %${Math.round((1 - ILLNESS.workSpeed) * 100)} yavaş (~${hours} sa)`, icon: 'sneeze', cls: 'is-sick' });
    } else if (character.exposure >= ILLNESS.threshold) {
      tags.push({ text: 'Üşütmek üzere', icon: 'cold', cls: 'is-cold' });
    }
    // 23. aşama: hafif yaralı (yürüme ve çalışma %20 yavaş); yangında kovası dolu
    if (character.isInjured) {
      const hours = Math.max(1, Math.ceil(character.injuryTimer / 60));
      tags.push({ text: `🩹 Hafif Yaralı: %${Math.round((1 - INJURY.speed) * 100)} yavaş (~${hours} sa; Şifacı Kulübesi'nde çabuk sarılır)`, icon: 'bandage', cls: 'is-sick' });
    }
    if (character.waterBucket) tags.push({ text: 'Kovası dolu: yangına koşuyor', icon: 'bucket', cls: 'is-vigor' });
    // 12. aşama: okul
    if (character.isChild && (character.schooling ?? 0) > 0) {
      const ratio = Math.min(1, character.schooling / SCHOOL.graduateMinutes);
      tags.push({ text: ratio >= 1 ? 'Okulu bitirdi: büyüyünce Kalfa olacak' : `Okula gidiyor: %${Math.round(ratio * 100)}`, icon: 'book', cls: 'is-vigor' });
    }
    if (character.educated) tags.push({ text: 'Bilgelik Evi mezunu', icon: 'book', cls: 'is-vigor' });
    // 13. aşama: sabit iş yeri ve handaki baharatlı yemek
    if (character.workplaceId !== null) {
      const place = state.buildings.find((b) => b.id === character.workplaceId);
      if (place) tags.push({ text: `Sabit iş yeri: ${place.name}`, icon: 'pin', cls: 'is-warm' });
    }
    if (character.recall && character.recall.until > now) {
      tags.push({ text: `Anılara daldı: “${character.recall.text}”`, icon: 'memory', cls: 'is-love' });
    }
    if ((character.buffs.spiced ?? -1) > now) {
      tags.push({ text: `Baharat ve kahve: %${Math.round((LUXURY_GOODS.spiceCrate.personal.workSpeed - 1) * 100)} hızlı`, icon: 'spice', cls: 'is-vigor' });
    }
    if ((character.buffs.vigor ?? -1) > now) tags.push({ text: `${VIGOR.name}: %${Math.round((VIGOR.workSpeed - 1) * 100)} hızlı`, icon: 'herb', cls: 'is-vigor' });
    if (character.away) {
      const back = character.away.until - now;
      tags.push({ text: `Keşif seferinde (~${Math.max(1, Math.ceil(back / 60))} sa sonra döner)`, icon: 'map', cls: 'is-warm' });
    }
    const key = tags.map((t) => t.text).join('|');
    if (key === this.lastConditions) return;
    this.lastConditions = key;
    this.conditions.replaceChildren(
      ...tags.map((t) => el('span', { className: `condition-chip ${t.cls}` }, [el('img', { src: getAnyIconURL(t.icon), alt: '' }), t.text]))
    );
  }

  /** Portre gerçek zamanla nefes alır (oyun duraklasa da canlı görünsün); çocuk portresi alta oturur. */
  renderPortrait(character) {
    const seconds = performance.now() / 1000;
    const frame = seconds % 1.6 > 1.1 ? 'idle1' : 'idle0';
    const look = character.look;
    const key = `${character.id}:${frame}:${look.child}:${look.coat}:${look.bag}`;
    if (key === this.lastFrame) return;
    this.lastFrame = key;

    const ctx = this.portraitCtx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.portrait.width, this.portrait.height);
    const height = characterHeight(look) * PORTRAIT_SCALE;
    ctx.drawImage(getCharacterSprite(character.appearance, 'down', frame, look), 0, this.portrait.height - height, this.portrait.width, height);
  }
}
