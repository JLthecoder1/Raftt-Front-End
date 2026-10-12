(() => {
  const B = window.RafttBackend;
  const t = (pt, en) => B.t(pt, en);
  function initialize() {
    const root = document.getElementById('milestone-workspace');
    if (!root || document.getElementById('application-plan-submit')) return;
    const panel = document.createElement('section');
    panel.className = 'card';
    const title = document.createElement('h2'),
      note = document.createElement('p'),
      button = document.createElement('button'),
      status = document.createElement('p');
    title.textContent = t('Complete o plano da candidatura', 'Complete your application plan');
    note.textContent = t(
      'Crie e salve as metas com entregas, critérios, prazos e custos. Depois envie o plano abaixo para incluir essas informações na revisão da RAFTT e na análise do agente.',
      'Create and save milestones with deliverables, criteria, dates and costs. Then submit the plan below to include it in RAFTT review and agent analysis.',
    );
    button.id = 'application-plan-submit';
    button.textContent = t(
      'Enviar plano de metas para revisão',
      'Submit milestone plan for review',
    );
    status.setAttribute('role', 'status');
    panel.append(title, note, button, status);
    root.before(panel);
    button.onclick = async () => {
      button.disabled = true;
      try {
        if (!window.RafttAccountReady)
          throw Error(t('Entre na sua conta.', 'Sign in to your account.'));
        const items = window.RafttDraftStorage.read('milestones', []);
        if (
          !items.length ||
          items.some(
            (m) =>
              !m.complete ||
              !m.title ||
              !m.deliverable ||
              !m.criteria ||
              !m.deadline ||
              !m.costs?.length,
          )
        )
          throw Error(
            t(
              'Complete e salve pelo menos uma meta com entrega, critérios, prazo e custos antes de enviar.',
              'Complete and save at least one milestone with deliverable, criteria, deadline and costs before submitting.',
            ),
          );
        await B.hydrate();
        const application = JSON.parse(localStorage.getItem('raftt-company') || '{}');
        if (!application.companyId)
          throw Error(t('Cadastre sua empresa primeiro.', 'Register your company first.'));
        application.milestones = items.map((m) => ({
          ...m,
          budgetCurrency: 'USD',
          status: 'planned',
        }));
        application.status = 'submitted';
        await B.saveApplication(application, []);
        localStorage.setItem('raftt-company', JSON.stringify(application));
        status.textContent = t(
          'Plano enviado em uma nova versão da candidatura. A análise automática usará estas metas.',
          'Plan submitted in a new application version. Automatic analysis will use these milestones.',
        );
      } catch (e) {
        status.textContent = e.message;
      } finally {
        button.disabled = false;
      }
    };
  }
  if (window.RafttAccountReady) initialize();
  else window.addEventListener('raftt:account-ready', initialize, { once: true });
})();
