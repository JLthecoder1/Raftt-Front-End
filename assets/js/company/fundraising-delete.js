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
      blocked: recordedFunding || fundedInvestments,
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
  section.innerHTML = `<h2>${t('Excluir captação', 'Delete fundraising')}</h2><p class="muted">${t('A exclusão está disponível apenas enquanto esta rodada não recebeu capital. A apresentação e os marcos da captação serão removidos.', 'Deletion is available only while this round has received no capital. The fundraising presentation and milestones will be removed.')}</p><button class="secondary" id="delete-fundraising" ${initial.blocked ? 'disabled' : ''}>${t('Excluir esta captação', 'Delete this fundraising')}</button><p id="delete-fundraising-status" role="status" aria-live="polite">${initial.blocked ? t('Exclusão indisponível: esta rodada já recebeu capital.', 'Deletion unavailable: this round has received capital.') : ''}</p>`;
  document.querySelector('main').append(section);
  const dialog = document.createElement('dialog');
  dialog.id = 'delete-fundraising-dialog';
  dialog.setAttribute('data-i18n-skip', '');
  dialog.setAttribute('aria-labelledby', 'delete-fundraising-title');
  dialog.style.cssText =
    'border:1px solid #dce3e7;border-radius:12px;padding:28px;width:min(460px,calc(100vw - 48px));box-sizing:border-box;color:#203447;box-shadow:0 25px 90px #15304740';
  dialog.innerHTML = `<h2 id="delete-fundraising-title">${t('Excluir esta captação?', 'Delete this fundraising?')}</h2><p>${t('A apresentação e os marcos desta captação serão removidos. Seu perfil e os outros investimentos serão mantidos.', 'This fundraising presentation and milestones will be removed. Your profile and other investments will be kept.')}</p><p>${t('Esta ação não pode ser desfeita.', 'This action cannot be undone.')}</p><p id="delete-dialog-status" role="alert"></p><div class="actions"><button type="button" class="secondary" id="cancel-delete-fundraising">${t('Cancelar', 'Cancel')}</button><button type="button" id="confirm-delete-fundraising">${t('Sim, excluir captação', 'Yes, delete fundraising')}</button></div>`;
  document.body.append(dialog);
  function blocked() {
    section.querySelector('button').disabled = true;
    section.querySelector('[role=status]').textContent = t(
      'Esta captação já recebeu capital e não pode ser excluída.',
      'This fundraising has received capital and cannot be deleted.',
    );
  }
  section.querySelector('button').onclick = () => {
    if (eligibility().blocked) {
      blocked();
      return;
    }
    dialog.showModal();
  };
  dialog.querySelector('#cancel-delete-fundraising').onclick = () => dialog.close();
  dialog.querySelector('#confirm-delete-fundraising').onclick = () => {
    const latest = eligibility();
    if (latest.blocked) {
      dialog.close();
      blocked();
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
