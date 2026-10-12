const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync('assets/js/shared/app-language.js', 'utf8');
for (const lang of ['pt', 'en']) {
  const window = {};
  vm.runInNewContext(
    source.replace(
      '  window.RafttI18n = {',
      '  window.testTranslate = translate;\n  window.RafttI18n = {',
    ),
    {
      window,
      localStorage: { getItem: () => lang, setItem() {} },
      document: { documentElement: {}, readyState: 'loading', addEventListener() {} },
      location: {},
    },
  );
  const t = window.testTranslate;
  assert.equal(
    t('Crie sua conta com e-mail e senha. Você receberá um e-mail para confirmar o cadastro.'),
    lang === 'pt'
      ? 'Crie sua conta com e-mail e senha. Você receberá um e-mail para confirmar o cadastro.'
      : 'Create your account with email and password. You will receive an email to confirm your account.',
  );
  assert.equal(
    t('8+ caracteres, letras e números'),
    lang === 'pt' ? '8+ caracteres, letras e números' : '8+ characters, letters and numbers',
  );
  assert.equal(
    t('Passwords do not match.'),
    lang === 'pt' ? 'As senhas não coincidem.' : 'Passwords do not match.',
  );
  assert.equal(t('Nova senha'), lang === 'pt' ? 'Nova senha' : 'New password');
  assert.equal(
    t(
      'Use pelo menos 8 caracteres, incluindo letras e números. Confirme a senha no segundo\n campo.',
    ).trim(),
    lang === 'pt'
      ? 'Use pelo menos 8 caracteres, incluindo letras e números. Confirme a senha no segundo\n campo.'
      : 'Use at least 8 characters, including letters and numbers. Confirm your password in the second field.',
  );
}
console.log(
  'Auth translation PT/EN: notice, placeholder, mismatch, recovery and multiline text passed.',
);
