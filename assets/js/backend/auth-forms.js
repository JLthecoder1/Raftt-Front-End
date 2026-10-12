(() => {
  'use strict';
  const B = window.RafttBackend,
    db = B.db,
    t = B.t;
  const value = (id) => document.getElementById(id)?.value.trim() || '';
  const callback = () => location.origin + '/auth-callback';
  function bind(id, statusId, task) {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('[type=submit]'),
        status = document.getElementById(statusId);
      button.disabled = true;
      status.textContent = t('Processando…', 'Processing…');
      try {
        await task(status);
      } catch (e) {
        status.textContent = /Invalid login credentials/i.test(e.message)
          ? t('E-mail ou senha incorretos.', 'Incorrect email or password.')
          : /Email not confirmed/i.test(e.message)
            ? t('Confirme seu e-mail antes de entrar.', 'Confirm your email before signing in.')
            : /rate limit/i.test(e.message)
              ? t(
                  'Muitas tentativas. Aguarde antes de tentar novamente.',
                  'Too many attempts. Please wait before trying again.',
                )
              : t('Não foi possível concluir. ', 'Could not complete. ') + (e.message || '');
      } finally {
        button.disabled = false;
      }
    });
  }
  bind('login-form', 'login-status', async () => {
    B.fail(
      await db.auth.signInWithPassword({
        email: value('email'),
        password: document.getElementById('password').value,
      }),
    );
    await B.hydrate();
    sessionStorage.setItem('raftt-map-welcome', 'true');
    location.assign('/map');
  });
  window.RafttPasswordRules?.bind(
    document.getElementById('signup-password'),
    document.getElementById('signup-password-confirmation'),
  );
  bind('signup-form', 'signup-status', async (status) => {
    const password = document.getElementById('signup-password').value;
    const passwordError = window.RafttPasswordRules.error(
      password,
      document.getElementById('signup-password-confirmation').value,
    );
    if (passwordError) throw Error(passwordError);
    const data = B.fail(
      await db.auth.signUp({
        email: value('signup-email'),
        password,
        options: {
          emailRedirectTo: callback(),
          data: {
            name: value('full-name'),
            language: localStorage.getItem('raftt-lang') === 'en' ? 'en' : 'pt',
          },
        },
      }),
    );
    if (data.session) {
      await B.signOut();
      location.assign('/login?account=created');
    } else {
      status.textContent = t(
        'Confira seu e-mail para confirmar o cadastro.',
        'Check your email to confirm your account.',
      );
      document.getElementById('signup-form').reset();
    }
  });
  bind('reset-form', 'reset-status', async (status) => {
    B.fail(
      await db.auth.resetPasswordForEmail(value('reset-email'), {
        redirectTo: callback() + '?flow=recovery',
      }),
    );
    status.textContent = t(
      'Se o endereço estiver cadastrado, você receberá um link de recuperação.',
      'If the address is registered, you will receive a recovery link.',
    );
  });
  const loginParams = new URLSearchParams(location.search);
  if (loginParams.get('email') === 'confirmed' || loginParams.get('account') === 'created') {
    const status = document.getElementById('login-status');
    if (status)
      status.textContent =
        loginParams.get('email') === 'confirmed'
          ? t(
              'E-mail confirmado. Entre com seu e-mail e senha.',
              'Email confirmed. Sign in with your email and password.',
            )
          : t(
              'Conta criada. Entre com seu e-mail e senha.',
              'Account created. Sign in with your email and password.',
            );
  }
  if (new URLSearchParams(location.search).get('password') === 'updated') {
    const status = document.getElementById('login-status');
    if (status)
      status.textContent = t(
        'Senha alterada. Entre com sua nova senha.',
        'Password changed. Sign in with your new password.',
      );
  }
  document.querySelectorAll('[data-social-provider]').forEach((button) => {
    button.disabled = true;
    button.title = t('Login social ainda não configurado.', 'Social login is not configured yet.');
  });
})();
