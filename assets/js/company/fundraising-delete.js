(() => {
  'use strict';
  if (window.RafttRoutes?.page !== 'company-dashboard.html') return;
  const t = (pt, en) => window.RafttBackend.t(pt, en);
  function initialize() {
    const section = document.createElement('section');
    section.className = 'card';
    section.setAttribute('data-i18n-skip', '');
    const title = document.createElement('h2');
    title.textContent = t('Limpar rascunhos de planejamento', 'Clear planning drafts');
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = t(
      'Remove apenas os rascunhos editáveis dos marcos. Sua empresa, candidaturas enviadas e registros financeiros são mantidos.',
      'Removes editable milestone drafts only. Your company, submitted applications and financial records are kept.',
    );
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = t('Limpar rascunhos', 'Clear drafts');
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    button.onclick = async () => {
      if (
        !confirm(
          t(
            'Limpar os rascunhos dos marcos desta empresa?',
            'Clear milestone drafts for this company?',
          ),
        )
      )
        return;
      button.disabled = true;
      try {
        await window.RafttDraftStorage.remove('milestones');
        await window.RafttDraftStorage.remove('round-closed');
        status.textContent = t(
          'Rascunhos removidos. Recarregue para atualizar o editor.',
          'Drafts removed. Reload to update the editor.',
        );
      } catch (e) {
        status.textContent =
          t(
            'Não foi possível remover o rascunho da conta. ',
            'Could not remove the account draft. ',
          ) + e.message;
      } finally {
        button.disabled = false;
      }
    };
    section.append(title, note, button, status);
    document.querySelector('main')?.append(section);
  }
  if (window.RafttAccountReady) initialize();
  else window.addEventListener('raftt:account-ready', initialize, { once: true });
})();
