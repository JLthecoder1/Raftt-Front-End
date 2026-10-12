(() => {
  'use strict';
  const A = window.RafttApi;
  let root,
    busy = false,
    generation = 0;
  async function render() {
    if (!window.RafttAccountReady) return;
    const run = ++generation,
      items = await A.pending();
    if (run !== generation) return;
    root?.remove();
    if (!items.length) return;
    root = document.createElement('section');
    root.className = 'api-workspace';
    root.setAttribute('data-i18n-skip', '');
    const h = document.createElement('h3');
    h.textContent = A.t('Registros pendentes no banco', 'Pending database registrations');
    root.append(h);
    const note = document.createElement('p');
    note.textContent = A.t(
      'A transação já foi enviada. Retome somente o registro, sem investir ou pagar novamente.',
      'The transaction has already been sent. Resume registration without investing or paying again.',
    );
    root.append(note);
    const feedback = document.createElement('p');
    feedback.setAttribute('role', 'status');
    root.append(feedback);
    for (const item of items) {
      const row = document.createElement('p');
      row.className = 'api-address';
      row.append(item.signature + ' ');
      const button = document.createElement('button');
      button.textContent = A.t('Retomar registro', 'Resume registration');
      button.onclick = async () => {
        if (busy) return;
        busy = true;
        root.querySelectorAll('button').forEach((b) => (b.disabled = true));
        try {
          await window.RafttV2Bridge.ready();
          await A.resume(item);
          await render();
        } catch (e) {
          feedback.textContent = e.message;
        } finally {
          busy = false;
          root.querySelectorAll('button').forEach((b) => (b.disabled = false));
        }
      };
      row.append(button);
      root.append(row);
    }
    (document.querySelector('main') || document.getElementById('app') || document.body).append(
      root,
    );
  }
  window.addEventListener('raftt:account-ready', () => render().catch(() => {}));
  window.addEventListener('raftt:pending-registration', () => render().catch(() => {}));
  window.addEventListener('raftt:auth-signout', () => {
    ++generation;
    root?.remove();
  });
})();
