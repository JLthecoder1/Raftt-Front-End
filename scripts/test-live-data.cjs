const { JSDOM } = require('jsdom');
const vm = require('node:vm'),
  fs = require('node:fs'),
  assert = require('node:assert/strict');
const tick = () => new Promise((r) => setImmediate(r));
function testDrafts() {
  const storage = new Map([['raftt-cache-owner', 'alice']]),
    events = {},
    timers = new Map(),
    calls = [],
    statuses = [];
  let user = 'alice',
    counter = 0;
  let response = { data: null, error: null };
  const builder = {
    select: () => builder,
    eq: (field, value) => {
      calls.push({ field, value });
      return builder;
    },
    maybeSingle: async () => response,
    upsert: async (row) => {
      calls.push({ row });
      return { data: null, error: null };
    },
    delete: () => builder,
    then: (resolve) => resolve({ data: null, error: null }),
  };
  const window = {
    RafttAccountReady: true,
    RafttBackend: {
      user: async () => ({ id: user }),
      t: (pt) => pt,
      fail: (r) => {
        if (r.error) throw r.error;
        return r.data;
      },
      db: {
        from: (table) => {
          assert.equal(table, 'workspace_drafts');
          return builder;
        },
      },
    },
    addEventListener: (name, fn) => (events[name] = fn),
    dispatchEvent: (e) => statuses.push(e.detail),
  };
  vm.runInNewContext(fs.readFileSync('assets/js/backend/drafts.js', 'utf8'), {
    window,
    localStorage: {
      getItem: (k) => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    },
    CustomEvent: class {
      constructor(name, options) {
        this.detail = options.detail;
      }
    },
    setTimeout: (fn) => {
      const id = ++counter;
      timers.set(id, fn);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    Map,
    JSON,
    Date,
  });
  return {
    api: window.RafttCloudDrafts,
    window,
    storage,
    calls,
    statuses,
    events,
    setUser: (x) => (user = x),
    setResponse: (x) => (response = x),
    flush: async () => {
      const jobs = [...timers.values()];
      timers.clear();
      for (const job of jobs) job();
      await tick();
      await tick();
    },
  };
}
async function testApplication() {
  const html = fs.readFileSync('company-application.html', 'utf8');
  assert.doesNotMatch(html, /Arquivos não são enviados|Enviar proposta simulada|\.key"/);
  const dom = new JSDOM(html, {
      url: 'http://127.0.0.1:8765/company-application',
      runScripts: 'outside-only',
    }),
    w = dom.window;
  const saved = [],
    drafts = [];
  w.localStorage.setItem('raftt-company', JSON.stringify({ companyId: 'company-id' }));
  w.RafttAccountReady = true;
  w.RafttBackend = {
    t: (pt) => pt,
    saveApplication: async (data, files) => {
      saved.push({ data, files });
      return 'company-id';
    },
  };
  w.RafttCloudDrafts = {
    load: async () => ({
      companyName: 'Stored startup',
      deckMethod: 'url',
      deckUrl: 'https://example.com/deck',
      structure: 'safe',
    }),
    schedule: (name, payload) => drafts.push({ name, payload }),
    remove: async () => {},
  };
  w.RafttNumbers = { isMoney: () => false };
  w.eval(fs.readFileSync('assets/js/company/application-form.js', 'utf8'));
  await tick();
  const form = w.document.querySelector('#raise-application');
  assert.equal(form.querySelector('[name=companyName]').value, 'Stored startup');
  for (const control of form.querySelectorAll('input:not([type=file]),textarea,select')) {
    if (['radio', 'checkbox'].includes(control.type)) continue;
    if (control.tagName === 'SELECT') {
      control.value = [...control.options].find((o) => o.value)?.value || '';
      continue;
    }
    control.value =
      control.type === 'email'
        ? 'founder@example.com'
        : control.type === 'url'
          ? 'https://example.com'
          : control.type === 'number'
            ? control.min || '10'
            : 'Valid answer';
  }
  form.querySelector('[name=companyName]').value = 'Actual startup';
  form.querySelector('[name=companyName]').dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.ok(drafts.some((d) => d.payload.companyName === 'Actual startup'));
  for (const name of ['goal', 'asset', 'revenue', 'tokenizedAssets', 'previousCampaign']) {
    const first = form.querySelector('[name=' + name + ']');
    if (first) first.checked = true;
  }
  w.document.querySelector('#raise-step-next').click();
  assert.equal(w.document.querySelector('#raise-submit-final').hidden, false);
  form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  await tick();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].data.companyId, 'company-id');
  assert.equal(saved[0].data.companyName, 'Actual startup');
  assert.equal(saved[0].files.length, 0);
  assert.match(w.document.querySelector('#raise-status').textContent, /salva na sua conta/);
  assert.doesNotMatch(JSON.stringify(drafts), /deckFile/);
  dom.window.close();
}
function testShells() {
  for (const page of [
    'profile',
    'milestone-releases',
    'company-dashboard',
    'company-application',
    'investor-dashboard',
    'portfolio',
    'investment-checkout',
    'account-workspaces',
  ]) {
    const dom = new JSDOM(fs.readFileSync(page + '.html', 'utf8'), {
        url: 'http://127.0.0.1:8765/' + page,
        runScripts: 'outside-only',
      }),
      w = dom.window;
    w.localStorage.setItem('raftt-profile', JSON.stringify({ name: 'Actual user' }));
    w.localStorage.setItem(
      'raftt-company',
      JSON.stringify({ companyName: 'Actual company', status: 'approved', targetRaise: '1000' }),
    );
    w.RafttRoutes = { page: page + '.html' };
    w.RafttI18n = { lang: 'en' };
    w.RafttNumbers = { money: (n) => String(n) };
    w.RafttSettings = {
      render: () => '<section id="profile-settings">Profile</section>',
      init: () => {},
    };
    w.RafttSolanaConfig = { network: 'devnet' };
    w.eval(fs.readFileSync('assets/js/investor/investor-flow.js', 'utf8'));
    assert.ok(w.document.querySelector('.app-sidebar'), page);
    assert.ok(w.document.querySelector('main'), page);
    if (page === 'profile') assert.ok(w.document.querySelector('#profile-settings'));
    if (page === 'milestone-releases') assert.ok(w.document.querySelector('#milestone-workspace'));
    if (page === 'company-application') assert.ok(w.document.querySelector('#raise-application'));
    if (['portfolio', 'investor-dashboard'].includes(page))
      assert.ok(w.document.querySelector('#investor-workspace'));
    assert.doesNotMatch(w.document.body.textContent, /simulados|7%|93%/);
    dom.window.close();
  }
}
async function testNotifications() {
  const dom = new JSDOM('<main></main>', { runScripts: 'outside-only' }),
    w = dom.window,
    calls = [];
  const row = {
    id: 'notification',
    kind: 'application_decision',
    content: { message: '<img src=x onerror=alert(1)>' },
    read_at: null,
    created_at: '2026-10-12T00:00:00Z',
  };
  w.RafttAccountReady = true;
  w.RafttBackend = {
    user: async () => ({ id: 'alice' }),
    t: (pt) => pt,
    fail: (r) => r.data,
    db: {
      from: (table) => {
        assert.equal(table, 'notifications');
        const q = {};
        q.select = q.order = q.limit = () => q;
        q.eq = (field, value) => {
          calls.push({ field, value });
          return q;
        };
        q.update = (body) => {
          row.read_at = body.read_at;
          return q;
        };
        q.then = (resolve) => resolve({ data: [row], error: null });
        return q;
      },
    },
  };
  w.eval(fs.readFileSync('assets/js/account/notifications.js', 'utf8'));
  await tick();
  await tick();
  assert.equal(w.document.querySelectorAll('img').length, 0);
  assert.ok(calls.some((x) => x.field === 'user_id' && x.value === 'alice'));
  w.document.querySelector('button').click();
  await tick();
  await tick();
  assert.ok(row.read_at);
  assert.ok(calls.some((x) => x.field === 'id' && x.value === 'notification'));
  assert.equal(w.document.querySelector('button'), null);
  w.RafttAccountReady = false;
  w.dispatchEvent(new w.Event('raftt:auth-signout'));
  assert.equal(w.document.querySelector('#account-notifications'), null);
  dom.window.close();
}
(async () => {
  const d = testDrafts();
  d.api.schedule('company-application', { companyName: 'A', user_id: 'victim' });
  await d.flush();
  assert.equal(d.calls.find((x) => x.row).row.user_id, 'alice');
  assert.equal(d.statuses.at(-1).status, 'saved');
  d.setResponse({ data: null, error: Error('Missing migration') });
  d.api.schedule('company-application', { companyName: 'Offline' });
  await d.flush();
  const restored = await d.api.load('company-application', {});
  assert.equal(restored.companyName, 'Offline');
  assert.equal(d.statuses.at(-1).status, 'local');
  d.api.schedule('company-application', { companyName: 'Queued' });
  d.events['raftt:auth-signout']();
  const count = d.calls.filter((x) => x.row).length;
  await d.flush();
  assert.equal(d.calls.filter((x) => x.row).length, count);
  d.setUser('bob');
  d.storage.set('raftt-cache-owner', 'bob');
  d.setResponse({ data: null, error: null });
  assert.deepEqual(await d.api.load('company-application', {}), {});
  await testApplication();
  testShells();
  await testNotifications();
  console.log(
    'Live data: account-scoped cloud drafts, offline recovery, canceled sign-out writes, restored application, actual final submission and truthful upload labels passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
