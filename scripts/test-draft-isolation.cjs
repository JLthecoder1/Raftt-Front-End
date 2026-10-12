const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert/strict');
function storage() {
  const m = new Map();
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i],
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}
const localStorage = storage(),
  sessionStorage = storage(),
  window = { RafttAccountReady: false };
vm.runInNewContext(fs.readFileSync('assets/js/company/draft-storage.js', 'utf8'), {
  window,
  localStorage,
  sessionStorage,
});
const D = window.RafttDraftStorage;
function account(user, company) {
  localStorage.setItem('raftt-cache-owner', user);
  localStorage.setItem('raftt-company', JSON.stringify({ companyId: company }));
  window.RafttAccountReady = true;
}
assert.throws(() => D.write('milestones', []));
account('A', 'one');
D.write('milestones', [{ title: 'A1' }]);
D.write('round-closed', true);
account('A', 'two');
assert.equal(D.read('milestones', []).length, 0);
D.write('milestones', [{ title: 'A2' }]);
account('B', 'one');
assert.equal(D.read('milestones', []).length, 0);
D.write('milestones', [{ title: 'B1' }]);
account('A', 'one');
assert.equal(D.read('milestones', [])[0].title, 'A1');
assert.equal(D.read('round-closed', false), true);
localStorage.setItem('raftt-milestones', '[{"title":"old unknown owner"}]');
sessionStorage.setItem('raftt-fundraising-deleted', 'true');
D.clear('A');
assert.equal(D.read('milestones', []).length, 0);
account('A', 'two');
assert.equal(D.read('milestones', []).length, 0);
assert.equal(localStorage.getItem('raftt-milestones'), null);
assert.equal(sessionStorage.getItem('raftt-fundraising-deleted'), null);
account('B', 'one');
assert.equal(D.read('milestones', [])[0].title, 'B1');
D.remove('milestones');
assert.equal(D.read('milestones', []).length, 0);
window.RafttAccountReady = false;
assert.equal(D.read('round-closed', false), false);
assert.throws(() => D.write('round-closed', true));
assert(fs.readFileSync('assets/js/backend/client.js', 'utf8').includes('draftKeys.forEach'));
assert(
  fs
    .readFileSync('assets/js/company/milestone-workspace.js', 'utf8')
    .includes("'raftt:account-ready'"),
);
console.log(
  'Draft isolation: two users, two companies, unauthenticated writes, logout cleanup and legacy state passed.',
);
(async () => {
  const local = storage(),
    session = storage();
  local.setItem('raftt-cache-owner', 'A');
  local.setItem('raftt-company-draft:A:one:milestones', '[1]');
  local.setItem('raftt-company-draft:A:two:milestones', '[2]');
  local.setItem('raftt-company-draft:B:one:milestones', '[3]');
  local.setItem('raftt-milestones', '[4]');
  local.setItem('raftt-lang', 'en');
  const w = {
    addEventListener() {},
    dispatchEvent() {},
    RafttAccountReady: true,
    RafttBackendConfig: {},
    supabase: {
      createClient: () => ({
        auth: { onAuthStateChange() {}, signOut: async () => ({ data: {}, error: null }) },
      }),
    },
  };
  vm.runInNewContext(fs.readFileSync('assets/js/backend/client.js', 'utf8'), {
    window: w,
    Event,
    document: { addEventListener() {} },
    location: { pathname: '/welcome' },
    localStorage: local,
    sessionStorage: session,
  });
  await w.RafttBackend.signOut();
  assert.equal(w.RafttAccountReady, false);
  assert.equal(local.getItem('raftt-company-draft:A:one:milestones'), null);
  assert.equal(local.getItem('raftt-company-draft:A:two:milestones'), null);
  assert.equal(local.getItem('raftt-company-draft:B:one:milestones'), '[3]');
  assert.equal(local.getItem('raftt-milestones'), null);
  assert.equal(local.getItem('raftt-lang'), 'en');
  console.log(
    'Real signOut handler clears only the active account drafts without the editor loaded.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
