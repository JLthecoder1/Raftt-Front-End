(() => {
  'use strict';
  const C = window.RafttChain;
  const target = document.querySelector('.topbar-actions');
  if (!C || !target) return;
  const pt = window.RafttI18n?.lang === 'pt';
  const t = (a, b) => (pt ? a : b);
  const box = document.createElement('div');
  box.setAttribute('data-i18n-skip', '');
  box.className = 'wallet-header-controls';
  const select = document.createElement('select');
  select.setAttribute('aria-label', t('Carteira', 'Wallet'));
  for (const name of ['Phantom', 'Solflare']) {
    const option = document.createElement('option');
    option.value = name.toLowerCase();
    option.textContent = name;
    select.append(option);
  }
  const button = document.createElement('button');
  button.className = 'button secondary';
  button.type = 'button';
  const status = document.createElement('span');
  status.setAttribute('role', 'status');
  status.className = 'wallet-header-status';
  status.setAttribute('aria-live', 'polite');
  box.append(select, button, status);
  target.prepend(box);
  function render() {
    const address = C.address();
    select.hidden = !!address;
    button.textContent = address
      ? `${address.slice(0, 4)}…${address.slice(-4)} · ${t('Desconectar', 'Disconnect')}`
      : t('Conectar carteira', 'Connect wallet');
    button.title = address || t('Conectar Phantom ou Solflare', 'Connect Phantom or Solflare');
  }
  button.onclick = async () => {
    button.disabled = true;
    status.textContent = '';
    try {
      if (C.address()) await C.disconnect();
      else await C.connect(select.value);
    } catch (e) {
      status.textContent =
        e.code === 4001
          ? t('Conexão recusada.', 'Connection rejected.')
          : t(
              'Não foi possível conectar. Verifique a extensão da carteira.',
              'Could not connect. Check your wallet extension.',
            );
    } finally {
      button.disabled = false;
      render();
    }
  };
  window.addEventListener('raftt:wallet-change', render);
  render();
  C.restore().then(render);
})();
