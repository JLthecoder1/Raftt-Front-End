(() => {
  'use strict';
  const B = window.RafttBackend,
    t = B.t;
  let generation = 0,
    root;
  async function refresh() {
    if (!window.RafttAccountReady) return;
    const run = ++generation,
      user = await B.user();
    root ||= document.createElement('section');
    root.className = 'card';
    root.id = 'account-notifications';
    root.setAttribute('data-i18n-skip', '');
    if (!root.isConnected) document.querySelector('main')?.append(root);
    root.replaceChildren();
    const h = document.createElement('h2');
    h.textContent = t('Atualizações da sua conta', 'Account updates');
    root.append(h);
    try {
      const rows = B.fail(
        await B.db
          .from('notifications')
          .select('id,kind,content,read_at,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
      );
      if (run !== generation || !window.RafttAccountReady) return;
      if (!rows.length) {
        const p = document.createElement('p');
        p.textContent = t('Nenhuma atualização por enquanto.', 'No updates yet.');
        root.append(p);
      }
      for (const row of rows) {
        const article = document.createElement('article'),
          title = document.createElement('h3'),
          p = document.createElement('p'),
          date = document.createElement('small');
        title.textContent = row.content?.title || t('Atualização da RAFTT', 'RAFTT update');
        const decision = row.content?.decision;
        if (row.kind === 'agent_analysis')
          title.textContent = t('Análise do agente concluída', 'Agent analysis complete');
        p.textContent =
          row.content?.message ||
          row.content?.body ||
          row.content?.reason ||
          {
            approved: t('Sua candidatura foi aprovada.', 'Your application was approved.'),
            rejected: t(
              'Sua candidatura foi rejeitada. Confira a justificativa na área da empresa.',
              'Your application was rejected. Check the rationale in the company workspace.',
            ),
            changes_requested: t(
              'A RAFTT solicitou ajustes na candidatura.',
              'RAFTT requested changes to your application.',
            ),
          }[decision] ||
          t(
            'Consulte sua empresa para acompanhar a revisão.',
            'Open your company workspace to follow the review.',
          );
        if (row.kind === 'agent_analysis')
          p.textContent = t(
            'O relatório está disponível na área da empresa ou na parcela correspondente.',
            'The report is available in the company workspace or the corresponding installment.',
          );
        date.textContent = new Date(row.created_at).toLocaleString();
        article.append(title, p, date);
        if (!row.read_at) {
          const button = document.createElement('button');
          button.className = 'secondary';
          button.textContent = t('Marcar como lida', 'Mark as read');
          button.onclick = async () => {
            button.disabled = true;
            try {
              B.fail(
                await B.db
                  .from('notifications')
                  .update({ read_at: new Date().toISOString() })
                  .eq('id', row.id)
                  .eq('user_id', user.id),
              );
              await refresh();
            } catch (e) {
              p.textContent = e.message;
              button.disabled = false;
            }
          };
          article.append(button);
        }
        root.append(article);
      }
    } catch {
      if (run === generation) {
        const p = document.createElement('p');
        p.textContent = t(
          'Não foi possível consultar as atualizações.',
          'Could not load account updates.',
        );
        root.append(p);
      }
    }
  }
  window.addEventListener('raftt:account-ready', refresh);
  window.addEventListener('raftt:backend-synced', refresh);
  window.addEventListener('raftt:auth-signout', () => {
    ++generation;
    root?.remove();
  });
  if (window.RafttAccountReady) refresh();
})();
