(() => {
  'use strict';
  const page = location.pathname
    .replace(/\.html$/, '')
    .split('/')
    .pop();
  const protectedPages = [
    'map',
    'profile',
    'user-profile',
    'account-workspaces',
    'investor-dashboard',
    'portfolio',
    'company-dashboard',
    'company-application',
    'milestone-releases',
    'admin-review',
    'investment-checkout',
    'round-v2',
  ];
  if (!protectedPages.includes(page)) return;
  const B = window.RafttBackend;
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:#f7f4ec;display:grid;place-content:center;padding:32px;text-align:center';
  overlay.textContent = B.t('Verificando sua conta…', 'Checking your account…');
  document.body.append(overlay);
  (async () => {
    try {
      const session = B.fail(await B.db.auth.getSession());
      if (!session.session) {
        location.replace('/login?access=required');
        return;
      }
      const before = localStorage.getItem('raftt-profile');
      await B.hydrate();
      if (B.isSignedOut()) return;
      if (page === 'admin-review') {
        const staff = B.fail(
          await B.db
            .from('platform_staff')
            .select('role')
            .eq('user_id', session.session.user.id)
            .maybeSingle(),
        );
        if (!staff) {
          location.replace('/investor-dashboard');
          return;
        }
      }
      if (before !== localStorage.getItem('raftt-profile')) {
        location.reload();
        return;
      }
      if (B.isSignedOut()) return;
      window.RafttAccountReady = true;
      overlay.remove();
      window.dispatchEvent(new Event('raftt:account-ready'));
    } catch {
      overlay.textContent = B.t(
        'Não foi possível carregar sua conta. Verifique a conexão e se as tabelas foram criadas.',
        'Could not load your account. Check the connection and whether the tables were created.',
      );
      const retry = document.createElement('button');
      retry.textContent = B.t('Tentar novamente', 'Try again');
      retry.onclick = () => location.reload();
      overlay.append(retry);
      const exit = document.createElement('button');
      exit.textContent = B.t('Voltar ao login', 'Back to login');
      exit.onclick = async () => {
        await B.signOut();
        location.assign('/login');
      };
      overlay.append(exit);
    }
  })();
})();
