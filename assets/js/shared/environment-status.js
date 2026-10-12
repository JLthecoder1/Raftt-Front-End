(() => {
  'use strict';
  const label = () => {
    const network = window.RafttSolanaConfig?.network;
    return network ? 'Solana · ' + network : 'RAFTT';
  };
  function refresh() {
    document.querySelectorAll('.demo-label').forEach((el) => {
      el.setAttribute('data-i18n-skip', '');
      el.textContent = label();
    });
  }
  window.RafttEnvironment = { label, refresh };
  window.addEventListener('raftt:account-ready', refresh);
  window.addEventListener('raftt:wallet-change', refresh);
  refresh();
})();
