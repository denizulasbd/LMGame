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
        el('div', { className: 'character-identity' }, [this.name, this.nameInput, this.meta, this.craftBadge, this.traits]),
      ]),
      el('div', { className: 'character-status' }, [el('span', { className: 'character-status-label', text: 'Durum' }), this.status, this.conditions]),
      el('div', { className: 'character-needs' }, needs),
      section('Aile', this.familyList),
      section('İlişkiler', this.relationsList),
      section('Sosyal Hayat', this.socialList),
      section('Ekipman', this.equipmentList),
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
    return `${character.id}:${character.name}:${character.homeId}:${character.isChild}:${character.partnerId}:${character.married}:${character.quirk}`;
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
    const age = character.isChild ? 'Çocuk' : `${character.age} yaşında`;
    this.meta.textContent = `${age} · ${where}${home ? withWhom : ''}`;

    const quirk = QUIRKS[character.quirk];
    this.traits.replaceChildren(
      ...character.traits.map((key) => {
        const opposite = opposingTrait(key);
        const title = `${TRAITS[key]?.description ?? ''}${opposite ? ` · Zıddı: ${TRAITS[opposite].name} (atışabilirler)` : ''}`;
        return el('span', { className: 'trait-chip', text: TRAITS[key]?.name ?? key, title });
      }),
      ...(quirk ? [el('span', { className: 'trait-chip quirk-chip', title: `Huyu: ${quirk.description}` }, [el('img', { src: getAnyIconURL(quirk.icon), alt: '' }), quirk.name])] : [])
    );
    this.resetCaches();
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
  }

  /** (19. aşama) Sosyal Hayat: huyu, eşi ve paylaştıkları ev, son duyduğu haber. */
  renderSocial(character, state) {
    const quirk = QUIRKS[character.quirk];
    const partner = partnerOf(state, character);
    const news = character.lastNews;
    const homes = state.buildings.filter((b) => b.type === 'cabin');
    const homeIndex = homes.findIndex((b) => b.id === character.homeId);
    const home = homes[homeIndex] ?? null;
    const key = [character.id, character.quirk, partner?.id, character.married, partner?.homeId, character.homeId, character.relocating, partner?.relocating, homeIndex, home?.upgraded, news?.id, news?.from].join('/');
    if (key === this.lastSocial) return;
    this.lastSocial = key;

    const homeName = home ? `${homeIndex + 1} numaralı ${home.upgraded ? 'taş ev' : 'kulübe'}` : null;
    const row = (icon, label, body, title = '') =>
      el('div', { className: 'social-row', title }, [
        el('img', { className: 'social-icon', src: getAnyIconURL(icon), alt: '' }),
        el('div', { className: 'social-text' }, [el('span', { className: 'social-label', text: label }), ...body]),
      ]);
    const rows = [];
    if (quirk) rows.push(row(quirk.icon, 'Huyu', [el('span', { className: 'social-value', text: quirk.name })], quirk.description));

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
    const key = [partner?.id, character.married, children.map((c) => c.id).join(','), parents.map((c) => c.id).join(','), daysLeft].join('/');
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
    const key = main ? `${main.skill}:${main.level.level}` : '';
    if (key === this.lastBadge) return;
    this.lastBadge = key;
    this.craftBadge.hidden = !main;
    if (!main) return;
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
    // 11. aşama: hastalık, Dinçlik, keşif seferi
    if (character.illness) {
      const hours = Math.ceil(character.illness.remaining / 60);
      tags.push({ text: `${ILLNESS.label}: %${Math.round((1 - ILLNESS.workSpeed) * 100)} yavaş (~${hours} sa)`, icon: 'sneeze', cls: 'is-sick' });
    } else if (character.exposure >= ILLNESS.threshold) {
      tags.push({ text: 'Üşütmek üzere', icon: 'cold', cls: 'is-cold' });
    }
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
