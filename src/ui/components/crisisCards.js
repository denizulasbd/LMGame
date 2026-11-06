// (23. aşama) Kriz kartları: Yapı Bilgi Paneli ile Haydut Baskını penceresinin ortak parçaları. Yalnızca durumu okur ve olay yayınlar
// ('ui:raidChoice' { choice: 'defend' | 'tribute' | 'caught' }).
import { el } from '../dom.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { BANDIT } from '../../data/crisis.js';
import { defenseStatus, tributeStatus, raidHoursLeft, towerOf } from '../../systems/Crisis.js';

function action(label, title, onClick, disabled = false) {
  const b = el('button', { className: 'hud-btn upgrade-button', type: 'button', text: label, title, tabIndex: -1 });
  b.disabled = disabled;
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', onClick);
  return b;
}

/** Bekleyen haydut baskınının üç çözüm yolu. Baskın yoksa null. */
export function raidCard(state, emit) {
  const raid = state.crisis?.raid;
  if (!raid) return null;
  const hours = raidHoursLeft(state);
  const def = defenseStatus(state);
  const pay = tributeStatus(state, raid.tribute);
  const tower = towerOf(state);
  const when = hours <= 1 ? 'birazdan' : hours < 24 ? `${hours} saat sonra` : `${Math.ceil(hours / 24)} gün sonra`;
  const choose = (choice) => () => emit('ui:raidChoice', { choice });
  const tributeText = pay.ok ? (pay.gold > 0 ? `${pay.gold} altın` : `${pay.food} yiyecek değerinde erzak`) : `${raid.tribute} altın`;
  const row = (button, text, cls = '') => el('div', { className: `crisis-option${cls}` }, [button, el('div', { className: 'upgrade-text', text })]);
  return el('div', { className: 'decree luxury-card is-raid' }, [
    el('div', { className: 'decree-head' }, [el('img', { src: getAnyIconURL('bandit'), alt: '' }), 'Ormanda haydut izleri', el('span', { className: 'decree-state', text: when })]),
    el('div', {
      className: 'upgrade-text is-active',
      text: tower
        ? 'Gözcü Kulesi haydutları 2 gün önceden gördü. Karar ver: püskür, haraç ver ya da bekle.'
        : 'Ormanda taze izler var: haydutlar kasabaya yaklaşıyor. Gözcü Kulesi olsaydı 2 gün önceden haber alırdın.',
    }),
    row(
      action('A · Bekçilerle Püskürt', def.ok ? 'Kayıp yok · Güven +6 · ganimet · bir savunmacı hafif yaralanabilir' : def.reason, choose('defend'), !def.ok),
      def.ok
        ? `Kayıp yok, Güven +${BANDIT.repelTrust}, ${BANDIT.loot.min}-${BANDIT.loot.max} altın ganimet ve bir günlük refah bonusu. Savunmaya katılan bir sakin hafif yaralanabilir.`
        : def.reason
    ),
    row(
      action(`B · Haraç Öde (${tributeText})`, pay.ok ? `Savaşa girmeden savuştur: hasar ve yaralı yok, Güven ${BANDIT.tributeTrust}` : pay.reason, choose('tribute'), !pay.ok),
      pay.ok ? `Hasar ve yaralı yok, Güven ${BANDIT.tributeTrust}. Hazineden altın (yoksa kilerden erzak) gider.` : pay.reason
    ),
    row(
      action('C · Hazırlıksız Yakalan', `Stoğun en çok %${Math.round(BANDIT.caughtMaxShare * 100)}'i gider, bir yapı hasar görür, Güven ${BANDIT.caughtTrust}`, choose('caught')),
      `Altın ve yiyeceğin en çok %${Math.round(BANDIT.caughtMaxShare * 100)}'i çalınır, bir sınır yapısı hasar görür, Güven ${BANDIT.caughtTrust}. Karar vermezsen: ${def.ok ? 'A uygulanır' : 'C uygulanır'}.`,
      ' is-risky'
    ),
  ]);
}
