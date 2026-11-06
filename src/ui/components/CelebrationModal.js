// Kasaba Anıtı tamamlanınca ('town:legendary') ve (10. aşama) kasaba seviye atlayınca ('town:tierUp')
// ekranın ortasında açılan kutlama penceresi. Seviye penceresinde yeni unvan, açılan yapılar ve ödüller yazar.
// (12. aşama) Kasaba Harikası tamamlanınca ('wonder:completed') altın çağ penceresi açılır.
// Oyun durmaz; "Oynamaya Devam Et" pencereyi kapatır.
import { getStructureSprite } from '../../art/sprites/index.js';
import { BUILDINGS } from '../../data/buildings.js';
import { el } from '../dom.js';

export class CelebrationModal {
  constructor(game) {
    this.slot = 'free';
    this.art = el('canvas', { className: 'celebration-art', width: 32 * 4, height: 56 * 4 });
    this.message = el('p', { className: 'celebration-text' });
    this.title = el('h2', { className: 'celebration-title' });
    this.perks = el('ul', { className: 'celebration-perks' });
    const ok = el('button', { className: 'hud-btn title-btn is-primary', type: 'button', text: 'Oynamaya Devam Et', tabIndex: -1 });
    ok.addEventListener('click', () => (this.element.hidden = true));
    this.confetti = el('div', { className: 'celebration-confetti' });
    for (let i = 0; i < 24; i++) {
      this.confetti.append(el('span', { style: `left: ${(i * 41) % 100}%; animation-delay: ${(i % 8) * 0.25}s; background: ${['#ffd23f', '#f06b8a', '#4aa3df', '#a4dd5c'][i % 4]}` }));
    }
    this.element = el('div', { className: 'celebration ui-interactive', hidden: true }, [
      this.confetti,
      el('div', { className: 'panel celebration-panel' }, [
        this.title,
        this.art,
        this.message,
        this.perks,
        ok,
      ]),
    ]);
    game.events.on('town:legendary', ({ townName }) => this.show(townName, game.state));
    game.events.on('town:tierUp', (info) => this.showTier(info, game.state));
    game.events.on('wonder:completed', ({ townName }) => this.showWonder(townName, game.state));
  }

  /**
   * Görseli tam sayı ölçekle çizer: tuval görselin ölçeklenmiş boyutunu alır, ekranda da (CSS) piksel
   * piksel aynı boyutta görünür (oranı bozulmaz, bulanıklaşmaz).
   */
  drawArt(sprite, scale) {
    this.art.width = sprite.width * scale;
    this.art.height = sprite.height * scale;
    this.art.style.width = `${this.art.width}px`;
    this.art.style.height = `${this.art.height}px`;
    const ctx = this.art.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.art.width, this.art.height);
    ctx.drawImage(sprite, 0, 0, this.art.width, this.art.height);
  }

  show(townName, state) {
    this.title.textContent = 'Tebrikler, Kasabanız Efsaneleşti!';
    this.drawArt(getStructureSprite('monument', {}), 3);
    this.message.textContent =
      `${townName}, ${state.time.day} günde ${state.characters.length} sakinli, mutlu bir kasabaya dönüştü. ` +
      'Kasaba Anıtı artık meydanın gururu. (Oynamaya devam edebilirsiniz.)';
    this.perks.replaceChildren();
    this.perks.hidden = true;
    this.element.hidden = false;
  }

  /** (12. aşama, 20. aşamada yenilendi) Ulu Saat Kulesi tamamlandı: Çağ Dönüm Noktası, Altın Çağ başlar (oyun sürer). */
  showWonder(townName, state) {
    this.title.textContent = 'Çağ Dönüm Noktası: Altın Çağ!';
    this.drawArt(getStructureSprite('wonder', { wonderStage: 3, windowsLit: true, frame: 1 }), 2);
    this.message.textContent =
      `${townName}, ${state.time.day}. günde Ulu Saat Kulesi'ni üç aşamasıyla tamamladı ve Altın Çağ'a girdi! ` +
      'Meydanda Çağ Kutlaması başladı, çan ilk kez çaldı. Bu bir son değil: kasaban büyümeye devam ediyor.';
    this.perks.replaceChildren(
      ...[
        'Kalıcı unvan: Altın Çağ · çalışma şevki +%10',
        'Kasaba refahına kalıcı +%10 çarpan (ve +12)',
        "Kule saati her sabah 08:00 ve akşam 18:00'de çalar: duyanların yorgunluğu azalır",
        'Yeni prestij peyzajı: Mermer Çeşme ve Altın Çağ Feneri',
        'Gezgin tüccar daha sık gelir: nadir tohumlar ve antik kitaplar',
        "Arşiv'de Tarihçe Kütüğü: kurucular, ilk çift, ilk usta eseri, kulenin baş ustası",
      ].map((text) => el('li', { text }))
    );
    this.perks.hidden = false;
    this.element.hidden = false;
  }

  /** Kasaba seviye atladı: yeni unvan, açılan yapının görseli (yoksa belediye / anıt) ve ödüller. */
  showTier({ tier, title }, state) {
    this.title.textContent = `Kasabanız büyüdü: ${tier.name}!`;
    const unlocked = tier.unlocks?.[0];
    this.drawArt(getStructureSprite(unlocked ?? (tier.tier >= 4 ? 'townHall' : 'cabin'), { level: unlocked ? 1 : 2, frame: 1, sailFrame: 1 }), 2);
    const unlocks = (tier.unlocks ?? []).map((type) => BUILDINGS[type].name);
    this.message.textContent =
      `${title}: ${state.characters.length} sakin, ${state.time.day}. gün. ` +
      (unlocks.length ? `Artık ${unlocks.join(', ')} inşa edebilirsin.` : 'Kasabanın şanı uzak diyarlara yayıldı.');
    this.perks.replaceChildren(...tier.perks.map((text) => el('li', { text })));
    this.perks.hidden = false;
    this.element.hidden = false;
  }
}
