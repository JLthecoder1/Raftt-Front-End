(() => {
  'use strict';
  const page = window.RafttRoutes?.page;
  if (!['company-dashboard.html', 'milestone-releases.html'].includes(page)) return;
  const B = window.RafttBackend,
    cfg = window.RafttSolanaConfig;
  const t = (pt, en) => B.t(pt, en);
  const esc = (x) =>
    String(x ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  let generation = 0;
  async function refresh() {
    if (!window.RafttAccountReady) return;
    const run = ++generation;
    let root = document.getElementById('company-chain-rounds');
    if (!root) {
      root = document.createElement('section');
      root.id = 'company-chain-rounds';
      root.className = 'card';
      root.setAttribute('data-i18n-skip', '');
      document.querySelector('main').append(root);
    }
    root.innerHTML = `<h2>${t('Rodadas da empresa na Solana', 'Company rounds on Solana')}</h2><p role="status">${t('Consultando cadastro…', 'Loading company records…')}</p>`;
    try {
      const user = await B.user();
      const companies = B.fail(
        await B.db
          .from('companies')
          .select('id,name,rounds(network,program_id,chain_address)')
          .eq('owner_id', user.id),
      );
      if (run !== generation || !window.RafttAccountReady) return;
      const entries = companies.flatMap((c) =>
        (c.rounds || [])
          .filter(
            (r) => r.network === cfg.network && r.program_id === cfg.programId && r.chain_address,
          )
          .map((r) => ({ company: c, round: r })),
      );
      root.innerHTML = `<h2>${t('Rodadas da empresa na Solana', 'Company rounds on Solana')}</h2><p class="muted">${t('A empresa vem do seu cadastro. A carteira conectada autoriza transações; ela não substitui o cadastro da empresa.', 'The company comes from your account records. The connected wallet authorizes transactions; it does not replace company records.')}</p>${entries.map(({ company, round }) => `<div class="row"><strong>${esc(company.name)}</strong><a class="button secondary" href="/round-v2?round=${encodeURIComponent(round.chain_address)}">${t('Consultar captação e parcelas', 'View fundraising and installments')}</a></div>`).join('') || `<p>${t('Nenhuma rodada vinculada às suas empresas nesta rede.', 'No round is linked to your companies on this network.')}</p>`}<p><a href="/round-v2">${t('Abrir ambiente de testes do contrato V2', 'Open the V2 contract test environment')}</a></p><p class="muted">${t('Criar uma rodada no painel de teste não a vincula automaticamente ao cadastro da empresa.', 'Creating a round in the test panel does not automatically link it to company records.')}</p>`;
    } catch {
      if (run !== generation) return;
      root.innerHTML = `<h2>${t('Rodadas da empresa na Solana', 'Company rounds on Solana')}</h2><p>${t('Não foi possível consultar as rodadas. Verifique sua sessão e a conexão.', 'Could not load rounds. Check your session and connection.')}</p>`;
    }
  }
  window.addEventListener('raftt:account-ready', refresh);
  window.addEventListener('raftt:auth-signout', () => {
    ++generation;
    document.getElementById('company-chain-rounds')?.remove();
  });
  if (window.RafttAccountReady) refresh();
})();
