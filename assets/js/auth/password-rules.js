(() => {
  'use strict';
  const t = (pt, en) => (localStorage.getItem('raftt-lang') === 'en' ? en : pt);
  function error(password, confirmation) {
    if (password.length < 8 || !/\p{L}/u.test(password) || !/[0-9]/.test(password))
      return t(
        'Use pelo menos 8 caracteres, incluindo letras e números.',
        'Use at least 8 characters, including letters and numbers.',
      );
    if (password !== confirmation) return t('As senhas não coincidem.', 'Passwords do not match.');
    return '';
  }
  function bind(password, confirmation) {
    if (!password || !confirmation || password.dataset.passwordRules) return;
    password.dataset.passwordRules = 'true';
    const existingHint = document.getElementById(password.id + '-rules');
    const hint = existingHint || document.createElement('p');
    hint.id = password.id + '-rules';
    hint.setAttribute('role', 'status');
    hint.setAttribute('aria-live', 'polite');
    hint.style.cssText = 'font-size:13px;line-height:1.5;margin:8px 0 16px;';
    if (!existingHint) confirmation.insertAdjacentElement('afterend', hint);
    password.setAttribute('aria-describedby', hint.id);
    confirmation.setAttribute('aria-describedby', hint.id);
    function update() {
      const strength = error(password.value, password.value);
      const mismatch = confirmation.value && password.value !== confirmation.value;
      password.setCustomValidity(password.value ? strength : '');
      confirmation.setCustomValidity(
        mismatch ? t('As senhas não coincidem.', 'Passwords do not match.') : '',
      );
      hint.textContent = !confirmation.value
        ? t(
            'Use pelo menos 8 caracteres, incluindo letras e números. Confirme a senha no segundo campo.',
            'Use at least 8 characters, including letters and numbers. Confirm your password in the second field.',
          )
        : mismatch
          ? t('As senhas não coincidem.', 'Passwords do not match.')
          : strength ||
            t(
              'As senhas coincidem e atendem aos requisitos.',
              'Passwords match and meet the requirements.',
            );
      hint.style.color = mismatch || (password.value && strength) ? '#b42318' : '#475467';
      confirmation.setAttribute('aria-invalid', mismatch ? 'true' : 'false');
    }
    password.addEventListener('input', update);
    confirmation.addEventListener('input', update);
    password.form?.addEventListener('reset', () => setTimeout(update, 0));
    update();
  }
  window.RafttPasswordRules = { error, bind };
  bind(
    document.getElementById('signup-password'),
    document.getElementById('signup-password-confirmation'),
  );
})();
