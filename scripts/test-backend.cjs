const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert');
function setup(kind, search = '') {
  const events = {},
    messages = {},
    calls = [];
  const fields = {
    email: 'victor@example.test',
    password: 'secret-pass1',
    'full-name': 'Victor',
    'signup-email': 'victor@example.test',
    'signup-password': 'secret-pass1',
    'signup-password-confirmation': 'secret-pass1',
    'reset-email': 'victor@example.test',
  };
  const elements = {};
  for (const [id, value] of Object.entries(fields)) elements[id] = { value };
  const form = {
    reportValidity: () => true,
    addEventListener: (name, fn) => (events[name] = fn),
    querySelector: () => ({ disabled: false }),
    reset() {
      calls.push('reset');
    },
  };
  elements[kind + '-form'] = form;
  elements[kind + '-status'] = { textContent: '' };
  const db = {
    auth: {
      signInWithPassword: async (args) => {
        calls.push(['login', args]);
        return { data: {}, error: null };
      },
      signUp: async (args) => {
        calls.push(['signup', args]);
        return { data: { session: null }, error: null };
      },
      resetPasswordForEmail: async (...args) => {
        calls.push(['resetEmail', ...args]);
        return { data: {}, error: null };
      },
    },
  };
  const backend = {
    db,
    t: (pt) => pt,
    fail: (r) => {
      if (r.error) throw r.error;
      return r.data;
    },
    hydrate: async () => calls.push('hydrate'),
  };
  vm.runInNewContext(fs.readFileSync('assets/js/backend/auth-forms.js', 'utf8'), {
    URLSearchParams,
    window: {
      RafttBackend: backend,
      RafttPasswordRules: {
        bind() {},
        error: (p, c) =>
          p.length < 8 || !/[a-z]/i.test(p) || !/[0-9]/.test(p)
            ? 'Senha inválida'
            : p !== c
              ? 'Senhas diferentes'
              : '',
      },
    },
    document: { getElementById: (id) => elements[id], querySelectorAll: () => [] },
    localStorage: { getItem: () => 'pt' },
    sessionStorage: { setItem: (...a) => calls.push(a) },
    location: {
      search,
      origin: 'http://127.0.0.1:8765',
      assign: (p) => calls.push(['redirect', p]),
    },
  });
  return { calls, elements, submit: () => events.submit({ preventDefault() {} }) };
}
(async () => {
  let confirmed = setup('login', '?email=confirmed');
  assert.match(confirmed.elements['login-status'].textContent, /E-mail confirmado/);
  assert.equal(confirmed.calls.length, 0);
  let app = setup('signup');
  await app.submit();
  assert.equal(app.calls[0][0], 'signup');
  assert.equal(app.calls[0][1].options.emailRedirectTo, 'http://127.0.0.1:8765/auth-callback');
  assert(!app.calls.some((c) => c[0] === 'redirect'));
  assert.match(app.elements['signup-status'].textContent, /e-mail/);
  app = setup('signup');
  app.elements['signup-password-confirmation'].value = 'different';
  await app.submit();
  assert.equal(app.calls.length, 0);
  app = setup('signup');
  app.elements['signup-password'].value = 'abcdefgh';
  app.elements['signup-password-confirmation'].value = 'abcdefgh';
  await app.submit();
  assert.equal(app.calls.length, 0);
  app = setup('login');
  await app.submit();
  assert.equal(app.calls[0][0], 'login');
  assert(app.calls.includes('hydrate'));
  assert(app.calls.some((c) => c[0] === 'redirect' && c[1] === '/map'));
  app = setup('reset');
  await app.submit();
  assert.equal(app.calls[0][2].redirectTo, 'http://127.0.0.1:8765/auth-callback?flow=recovery');
  const sql = fs.readFileSync('database/001_initial.sql', 'utf8');
  for (const table of ['profiles', 'companies', 'wallets', 'investments', 'chain_transactions'])
    assert(sql.includes(`create table public.${table}`));
  assert(sql.includes('enable row level security'));
  assert(sql.includes('raftt_private.company_owner(cid)'));
  assert(!sql.includes('grant insert on public.wallets to authenticated'));
  console.log(
    'Auth forms: signup confirmation, password mismatch, login, recovery callbacks and schema restrictions passed (mocked SDK).',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
