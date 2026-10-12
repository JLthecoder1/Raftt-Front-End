(async () => {
  'use strict';
  const B = window.RafttBackend,
    t = B.t,
    status = document.getElementById('callback-status'),
    form = document.getElementById('new-password-form');
  const params = new URLSearchParams(location.search),
    hash = new URLSearchParams(location.hash.slice(1));
  const recovery = params.get('flow') === 'recovery' || hash.get('type') === 'recovery';
  try {
    if (hash.get('error') || params.get('error'))
      throw Error(
        t(
          'Link inválido ou expirado. Solicite um novo link.',
          'Invalid or expired link. Request a new link.',
        ),
      );
    if (params.get('code')) B.fail(await B.db.auth.exchangeCodeForSession(params.get('code')));
    const data = B.fail(await B.db.auth.getSession());
    if (!data.session)
      throw Error(
        t(
          'Link inválido ou expirado. Solicite um novo link.',
          'Invalid or expired link. Request a new link.',
        ),
      );
    await B.user();
    history.replaceState(null, '', '/auth-callback' + (recovery ? '?flow=recovery' : ''));
    document.getElementById('callback-heading').textContent = recovery
      ? t('Defina sua nova senha', 'Set your new password')
      : t('E-mail confirmado', 'Email confirmed');
    if (!recovery) {
      await B.signOut();
      location.replace('/login?email=confirmed');
      return;
    }
    form.hidden = false;
    window.RafttPasswordRules.bind(
      document.getElementById('new-password'),
      document.getElementById('confirm-password'),
    );
    status.textContent = t(
      'Use pelo menos 8 caracteres, incluindo letras e números.',
      'Use at least 8 characters, including letters and numbers.',
    );
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const password = document.getElementById('new-password').value;
      const passwordError = window.RafttPasswordRules.error(
        password,
        document.getElementById('confirm-password').value,
      );
      if (passwordError) {
        status.textContent = passwordError;
        return;
      }
      const button = document.getElementById('password-submit');
      button.disabled = true;
      try {
        B.fail(await B.db.auth.updateUser({ password }));
        form.reset();
        await B.signOut();
        location.replace('/login?password=updated');
      } catch (e) {
        status.textContent = e.message;
      } finally {
        button.disabled = false;
      }
    };
  } catch (e) {
    status.textContent = e.message;
    document.getElementById('callback-login').hidden = false;
  }
})();
