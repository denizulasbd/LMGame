// 9. aşamanın yapısı: Zanaat Atölyesi (3x2, görsel 48x46).
//   - solda sıvalı, ahşap çatkılı kapalı oda: pencere, taş baca (çalışırken tüter, bkz. Building)
//   - sağda açık tezgâh bölmesi: arka duvarda testere ve alet askısı, asılı sırt çantası, mankende
//     kürk yakalı palto; önde uzun ahşap tezgâh
//   - önde kütük üstünde örs: çalışırken üstündeki demir kızarır, kıvılcım sıçrar
//   - arduvaz (mavi-gri) çatı, saçağın altında örs işaretli tabela
import { CharGrid, getSprite } from '../PixelSprite.js';

export const WORKSHOP_ART = { width: 48, height: 46, chimney: { x: 8, y: 0 } };

function buildWorkshopRows(active, frame) {
  const g = new CharGrid(48, 46);
  g.rect(2, 43, 46, 3, 'k');

  // Gövde: dış kontur
  g.rect(1, 17, 46, 26, 'K');

  // Sol oda: sıva, ahşap çatkı, pencere
  g.rect(2, 18, 14, 24, 'S');
  g.hline(2, 15, 18, 'X').hline(2, 15, 29, 'X').hline(2, 15, 41, 'x');
  g.vline(2, 18, 41, 'X');
  g.line(3, 30, 14, 40, 'w');
  g.line(3, 40, 14, 30, 'w');
  g.rect(5, 21, 8, 7, 'K');
  g.rect(6, 22, 6, 5, 'c');
  g.hline(6, 11, 24, 'K').vline(8, 22, 26, 'K');
  g.set(6, 22, 'a').set(9, 22, 'a').set(6, 25, 'a');
  g.hline(5, 12, 28, 'X');

  // Orta direk ve sağ köşe direği
  for (const x of [16, 44]) {
    g.rect(x, 17, 3, 26, 'K');
    g.vline(x + 1, 18, 42, 'X');
  }

  // Açık bölme: koyu ahşap arka duvar, dikey tahtalar
  g.rect(19, 18, 25, 24, 'x');
  for (let x = 21; x < 44; x += 4) g.vline(x, 18, 31, 'w');
  g.hline(19, 43, 18, 'w');

  // Alet askısı: testere, çekiç ve kerpeten
  g.rect(20, 21, 7, 3, 'K');
  g.hline(21, 25, 22, 'q');
  for (let x = 21; x <= 25; x += 2) g.set(x, 23, 'r');
  g.set(26, 22, 'X');
  g.stamp(['KKK', 'KqK', '.X.', '.X.', '.X.'], 28, 20);
  g.stamp(['K.K', 'q.q', '.q.', 'X.X', 'X.X'], 31, 21);

  // Asılı sırt çantası
  g.stamp(['..K..', '.KxK.', 'KKKKK', 'KXEXK', 'KXPXK', 'KXXXK', 'KwwwK', '.KKK.'], 34, 20);

  // Mankende kürk yakalı lacivert palto
  g.vline(41, 19, 20, 'w');
  g.stamp(['.KKK.', 'KuuuK', 'BBuBB', 'BnPnB', 'BnBnB', 'BnPnB', 'KBBBK', '.KnK.'], 39, 21);
  g.vline(41, 29, 31, 'w');

  // Uzun tezgâh: üst tabla, ön panel, ayaklar; üstünde tahta, kumaş ve küçük çekiç
  g.rect(19, 31, 25, 11, 'K');
  g.rect(20, 32, 23, 2, 'E');
  g.rect(20, 34, 23, 7, 'X');
  for (let x = 24; x < 43; x += 6) g.vline(x, 35, 40, 'x');
  g.hline(20, 42, 34, 'w');
  g.stamp(['KKKKKKK', 'XEEEEEX'], 21, 29);
  g.stamp(['KKKK', 'CUCU'], 30, 30);
  g.stamp(['KKK.', 'Kq.K', '.wK.'], 36, 29);

  // Önde kütük üstünde örs (çalışırken demir kızarır, kıvılcım sıçrar)
  g.rect(4, 37, 10, 6, 'K');
  g.rect(5, 38, 8, 4, 'w');
  g.hline(5, 12, 38, 'X');
  g.stamp(['KKKKKKKK.', 'KqqqqqqqK', '.KKrrrRK.', '...KrK...', '..KRRRK..'], 4, 32);
  if (active) {
    g.hline(7, 9, 32, frame % 2 === 0 ? 'O' : 'P');
    g.set(8, 32, 'y');
    const sparks = frame % 2 === 0 ? [[6, 30], [11, 29]] : [[5, 29], [12, 30], [9, 28]];
    for (const [x, y] of sparks) g.set(x, y, frame % 2 === 0 ? 'P' : 'Y');
  }

  // Arduvaz çatı: saçağa doğru genişler, sıralı kiremit çizgileri
  for (let y = 4; y <= 16; y++) {
    const inset = Math.max(0, Math.floor((16 - y) / 2) - 1);
    for (let x = inset; x < 48 - inset; x++) {
      const stripe = (y - 4) % 3 === 0 ? 'n' : (x + y) % 6 === 0 ? 'n' : y < 7 ? 'c' : 'B';
      g.set(x, y, stripe);
    }
    g.set(inset, y, 'K').set(47 - inset, y, 'K');
  }
  g.hline(5, 42, 3, 'K');
  g.hline(0, 47, 17, 'K');
  g.hline(1, 46, 16, 'n');

  // Taş baca (çatının solundan yükselir)
  g.rect(5, 0, 7, 10, 'K');
  g.rect(6, 1, 5, 9, 'r');
  g.hline(6, 10, 1, 'q').hline(6, 10, 4, 'R').hline(6, 10, 7, 'R');
  g.vline(8, 2, 3, 'R').vline(7, 5, 6, 'R').vline(9, 8, 9, 'R');
  g.hline(4, 12, 0, 'K');

  // Tabela: saçağın altında, örs işaretli
  g.rect(25, 12, 12, 7, 'K');
  g.rect(26, 13, 10, 5, 'E');
  g.hline(26, 35, 17, 'X');
  g.stamp(['KKKKKK', '.KKKK.', '..KK..', '.KKKK.'], 28, 13);
  return g.toRows();
}

/** @param {boolean} active zanaatkâr çalışıyor mu (örs kızarır, kıvılcım sıçrar) */
export function getWorkshopSprite(active = false, frame = 0) {
  const f = active ? frame % 2 : 0;
  return getSprite(`building:workshop:${active ? 'on' : 'off'}:${f}`, () => buildWorkshopRows(active, f));
}
