// (28.2) Başusta (Grandmaster) kademesinin saf hesapları. Başusta, çıraklığı %100 ile bitiren Gencin yetişkinliğe geçtiği anda
// kalıcı olarak aldığı unvandır (ApprenticeshipSystem.graduate); başka hiçbir yoldan verilmez. Rastgelelik kullanmaz.
import { GRANDMASTER, PROFESSIONS } from '../data/apprenticeship.js';
import { MASTERPIECES } from '../data/masterpieces.js';

/** Sakin Başusta mı? */
export function isGrandmaster(c) {
  return Boolean(c?.isGrandmaster) && Boolean(PROFESSIONS[c.grandmasterProfession]);
}

/** Başusta, kendi mesleğinin yapısında mı çalışıyor (tasarruf ve eser etkileri yalnızca orada)? */
export function grandmasterAt(c, building) {
  return isGrandmaster(c) && Boolean(building) && c.grandmasterProfession === building.type;
}

/** Başustanın unvanı: "Başusta Demirci". */
export function grandmasterTitle(c) {
  return isGrandmaster(c) ? `${GRANDMASTER.title} ${PROFESSIONS[c.grandmasterProfession].master}` : null;
}

/** Bu üretim hammaddesiz mi olacak (her saveEvery'inci)? Sayacı DEĞİŞTİRMEZ; üretim gerçekleşince grandmasterCommit çağrılır. */
export function grandmasterFreeDue(c, building) {
  return grandmasterAt(c, building) && ((c.grandmasterBatches ?? 0) + 1) % GRANDMASTER.saveEvery === 0;
}

/** Gerçekleşen bir üretimi sayar. Dönüş: bu üretim hammaddesizse true. */
export function grandmasterCommit(c, building, free) {
  if (!grandmasterAt(c, building)) return false;
  c.grandmasterBatches = (c.grandmasterBatches ?? 0) + 1;
  return Boolean(free);
}

/** Usta işi eser şansı çarpanı: Başusta kendi mesleğinin eserinde (eserin mesleği ile çıraklık mesleği aynı) 2 kat. */
export function grandmasterMasterworkMultiplier(c, type) {
  const piece = MASTERPIECES[type];
  if (!isGrandmaster(c) || !piece) return 1;
  return PROFESSIONS[c.grandmasterProfession].skill === piece.skill ? GRANDMASTER.masterworkMultiplier : 1;
}
