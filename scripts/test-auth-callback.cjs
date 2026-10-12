const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert/strict');
async function setup(search = '', hasSession = true) {
  const calls = [];
  const nodes = {
    'callback-status': { textContent: '' },
    'new-password-form': { hidden: true },
    'callback-heading': { textContent: '' },
    'callback-login': { hidden: true },
    'new-password': { value: 'Newpassword1' },
    'confirm-password': { value: 'Newpassword1' },
    'password-submit': { disabled: false },
  };
  const B = {
    t: (p) => p,
    fail: (r) => {
      if (r.error) throw r.error;
      return r.data;
    },
    user: async () => calls.push('user'),
    signOut: async () => calls.push('signOut'),
    hydrate: async () => calls.push('hydrate'),
    db: {
      auth: {
        getSession: async () => ({ data: { session: hasSession ? {} : null } }),
        exchangeCodeForSession: async () => ({ data: {} }),
      },
    },
  };
  await vm.runInNewContext(fs.readFileSync('assets/js/backend/callback.js', 'utf8'), {
    window: {
      RafttBackend: B,
      RafttPasswordRules: { bind: () => calls.push('passwordForm'), error: () => '' },
    },
    document: { getElementById: (id) => nodes[id] },
    URLSearchParams,
    history: { replaceState() {} },
    location: { search, hash: '', replace: (path) => calls.push(path) },
  });
  return { calls, nodes };
}
(async () => {
  let app = await setup('?code=confirmed-code');
  assert.deepEqual(app.calls, ['user', 'signOut', '/login?email=confirmed']);
  assert.equal(app.nodes['new-password-form'].hidden, true);
  app = await setup('?flow=recovery');
  assert.equal(app.nodes['new-password-form'].hidden, false);
  assert(!app.calls.includes('signOut'));
  assert(app.calls.includes('passwordForm'));
  app = await setup('?flow=recovery', false);
  assert.equal(app.nodes['new-password-form'].hidden, true);
  assert.equal(app.nodes['callback-login'].hidden, false);
  assert(!app.calls.includes('/login?email=confirmed'));
  console.log(
    'Email confirmation returns to login; recovery remains separate; missing session is rejected.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
