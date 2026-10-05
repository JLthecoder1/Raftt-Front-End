(() => {
  'use strict';
  const read = (k, f) => {
      try {
        return JSON.parse(localStorage.getItem(k)) || f;
      } catch {
        return f;
      }
    },
    pt = localStorage.getItem('raftt-lang') === 'pt',
    t = (a, b) => (pt ? a : b);
  function eligibility() {
    const c = read('raftt-company', {}),
      investments = read('raftt-investments', []),
      milestones = read('raftt-milestones', []);
    const fundedInvestments = investments.some(
      (i) =>
        c.fundraisingId &&
        i.fundraisingId === c.fundraisingId &&
        ['confirmed', 'consolidated'].includes(i.status) &&
        Number(i.amount) > 0,
    );
    const recordedFunding = ['confirmedFunding', 'amountRaised', 'fundsReceived'].some(
      (k) => c[k] !== undefined && (!Number.isFinite(Number(c[k])) || Number(c[k]) > 0),
    );
    return {
      exists: Boolean(c.companyName),
      blocked:
        recordedFunding ||
        fundedInvestments ||
        read('raftt-demo-round-closed', false) ||
        milestones.some((m) => ['authorized', 'executed', 'completed'].includes(m.status)),
      company: c,
      investments,
    };
  }
  const initial = eligibility();
  if (!initial.exists) {
    if (sessionStorage.getItem('raftt-fundraising-deleted')) {
      sessionStorage.removeItem('raftt-fundraising-deleted');
      const message = document.createElement('p');
      message.setAttribute('role', 'status');
      message.setAttribute('data-i18n-skip', '');
      message.textContent = t(
        'Captação excluída. Você pode criar uma nova apresentação.',
        'Fundraising deleted. You can create a new presentation.',
      );
      document.querySelector('main').prepend(message);
    }
    return;
  }
  const section = document.createElement('section');
  section.className = 'card';
  section.style.marginTop = '28px';
  section.setAttribute('data-i18n-skip', '');
  section.innerHTML = `<h2>${t('Excluir captação', 'Delete fundraising')}</h2><p class="muted">${t('A exclusão está disponível apenas enquanto esta rodada não recebeu capital. A apresentação e os marcos da captação serão removidos.', 'Deletion is available only while this round has received no capital. The fundraising presentation and milestones will be removed.')}</p><button class="secondary" id="delete-fundraising" ${initial.blocked ? 'disabled' : ''}>${t('Excluir esta captação', 'Delete this fundraising')}</button><p id="delete-fundraising-status" role="status" aria-live="polite">${initial.blocked ? t('Exclusão indisponível: esta rodada já recebeu capital ou possui uma liberação autorizada.', 'Deletion unavailable: this round has received capital or has an authorized release.') : ''}</p>`;
  document.querySelector('main').append(section);
  section.querySelector('button').onclick = () => {
    const current = eligibility();
    if (current.blocked) {
      section.querySelector('button').disabled = true;
      section.querySelector('[role=status]').textContent = t(
        'Esta captação não pode ser excluída porque já recebeu capital ou possui liberação autorizada.',
        'This fundraising cannot be deleted because it has received capital or has an authorized release.',
      );
      return;
    }
    if (
      !confirm(
        t(
          'Excluir esta captação e seus marcos? Essa ação não pode ser desfeita. Seu perfil e seus outros investimentos serão mantidos.',
          'Delete this fundraising and its milestones? This action cannot be undone. Your profile and other investments will be kept.',
        ),
      )
    )
      return;
    const latest = eligibility();
    if (latest.blocked) {
      location.reload();
      return;
    }
    if (latest.company.fundraisingId) {
      const records = latest.investments.map((i) =>
        i.fundraisingId === latest.company.fundraisingId && ['pending', 'failed'].includes(i.status)
          ? { ...i, status: 'cancelled' }
          : i,
      );
      localStorage.setItem('raftt-investments', JSON.stringify(records));
    }
    ['raftt-company', 'raftt-milestones', 'raftt-demo-round-closed'].forEach((k) =>
      localStorage.removeItem(k),
    );
    sessionStorage.setItem('raftt-fundraising-deleted', 'true');
    location.assign('company-dashboard.html');
  };
})();
