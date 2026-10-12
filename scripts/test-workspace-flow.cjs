const vm = require('node:vm'),
  fs = require('node:fs'),
  assert = require('node:assert/strict');
function setup(lang) {
  const storage = new Map(),
    events = {};
  let owner = null,
    deferred = null;
  const host = {
    html: '',
    buttons: [],
    set innerHTML(value) {
      this.html = value;
      this.buttons = [...value.matchAll(/<button\b([^>]*)>/g)].map((m) => ({
        dataset: {
          action: m[1].match(/data-action="([^"]+)"/)?.[1],
          round: m[1].match(/data-round="([^"]+)"/)?.[1],
        },
        disabled: m[1].includes('disabled'),
      }));
    },
    get innerHTML() {
      return this.html;
    },
    querySelectorAll(selector) {
      return selector === '[data-action]'
        ? this.buttons.filter((b) => b.dataset.action)
        : this.buttons;
    },
    querySelector(selector) {
      if (selector === '#workspace-provider') return { value: 'phantom' };
      if (selector === '#position-filter') return { value: 'all' };
      return null;
    },
  };
  const row = {
    authority: 'creator',
    address: 'roundAlice',
    mint: 'mintA',
    decimals: 6,
    position: 5000000n,
    hasPosition: true,
    raised: 5000000n,
    target: 10000000n,
    vaultBalance: 5000000n,
    closed: false,
    failed: false,
    released: false,
  };
  const window = {
    RafttRoutes: { page: 'portfolio.html' },
    RafttI18n: { lang },
    RafttSolanaConfig: { network: 'localnet', programId: 'program' },
    addEventListener: (name, fn) => (events[name] = fn),
  };
  const dispatch = () => events['raftt:wallet-change']?.();
  window.RafttChain = {
    address: () => owner,
    connect: async () => {
      owner = 'alice';
      dispatch();
    },
    disconnect: async () => {
      owner = null;
      dispatch();
    },
    list: async () => (deferred ? await deferred : owner === 'alice' ? [row] : []),
    format: (n, d) => {
      const v = n.toString().padStart(d + 1, '0');
      return d ? v.slice(0, -d) + '.' + v.slice(-d) : v;
    },
  };
  window.RafttV2 = { list: async () => [] };
  window.RafttV2Bridge = {
    pk: (x) => x,
    token: 'token',
    rpc: () => ({
      getBalance: async () => 10000000000,
      getParsedTokenAccountsByOwner: async () => ({ value: [] }),
    }),
  };
  const context = {
    window,
    document: {
      getElementById: (id) => (id === 'investor-workspace' ? host : null),
      querySelector: () => null,
    },
    localStorage: { getItem: (k) => storage.get(k) || null },
    sessionStorage: { getItem: () => 'demo', setItem: () => {} },
    URLSearchParams,
    Map,
    BigInt,
    Intl,
    console,
    navigator: {},
  };
  vm.runInNewContext(fs.readFileSync('assets/js/investor/workspace-model.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync('assets/js/investor/investor-workspace.js', 'utf8'), context);
  return {
    host,
    click: async (name) => {
      const button = host.buttons.find((b) => b.dataset.action === name);
      assert.ok(button, name);
      await button.onclick();
    },
    setOwner: (value) => {
      owner = value;
      dispatch();
    },
    defer: (promise) => (deferred = promise),
  };
}
(async () => {
  for (const lang of ['pt', 'en']) {
    const app = setup(lang);
    assert.match(app.host.html, lang === 'pt' ? /Conecte para consultar/ : /Connect to view/);
    assert.match(app.host.html, lang === 'pt' ? /Empresas no portfólio/ : /Portfolio companies/);
    assert.match(
      app.host.html,
      lang === 'pt' ? /Saldo disponível em SOL/ : /Available SOL balance/,
    );
    assert.match(app.host.html, lang === 'pt' ? /Marcos e evidências/ : /Milestones and evidence/);
    assert.match(app.host.html, lang === 'pt' ? /Documentos e condições/ : /Documents and terms/);
    assert.match(
      app.host.html,
      lang === 'pt' ? /Autorizações e pagamentos/ : /Authorizations and payments/,
    );
    assert.ok(!app.host.html.includes('roundAlice'));
    await app.click('connect');
    assert.ok(app.host.html.includes('roundAlice'));
    assert.match(app.host.html, /10 SOL/);
    assert.match(
      app.host.html,
      lang === 'pt' ? /Saldo disponível na carteira/ : /Available wallet balance/,
    );
    assert.ok(!app.host.html.includes('mode-demo'));
    assert.ok(!app.host.html.includes('NULLUN'));
    assert.ok(!app.host.html.includes('Nexo Software'));
    await app.click('disconnect');
    assert.ok(!app.host.html.includes('roundAlice'));
    assert.ok(!app.host.html.includes('10 SOL'));
  }
  const app = setup('en');
  await app.click('connect');
  let resolve;
  app.defer(new Promise((r) => (resolve = r)));
  const request = app.click('refresh');
  app.setOwner('bob');
  resolve([
    {
      authority: 'creator',
      address: 'staleAlice',
      mint: 'mintA',
      decimals: 6,
      position: 5n,
      hasPosition: true,
      raised: 5n,
      target: 10n,
      vaultBalance: 5n,
      released: false,
    },
  ]);
  await request;
  assert.ok(
    !app.host.html.includes('staleAlice'),
    'Previous wallet response must not reappear after account change',
  );
  console.log(
    'Workspace flow: PT/EN, connect/disconnect, wallet balance, no demo companies and stale-wallet response passed.',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
