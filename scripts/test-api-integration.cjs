const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
function setup() {
  const events = {},
    storage = new Map(),
    calls = [],
    counts = { signed: 0, sent: 0, confirmed: 0 };
  let user = 'user-a',
    owner = 'wallet-a',
    token = 'access-token',
    status = { confirmationStatus: 'finalized', err: null };
  let responder = async (path) =>
    path.endsWith('/wallets') ? [{ id: 'wallet-id', address: owner }] : { id: 'recorded' };
  let instruction = 'create_round';
  const transaction = {
    feePayer: { toBase58: () => 'wallet-a' },
    recentBlockhash: 'blockhash',
    instructions: [
      {
        programId: { toBase58: () => 'raftt-program' },
        get data() {
          return crypto
            .createHash('sha256')
            .update('global:' + instruction)
            .digest()
            .subarray(0, 8);
        },
      },
    ],
    serialize: () => new Uint8Array([1]),
  };
  const rpc = {
    sendRawTransaction: async () => {
      counts.sent++;
      return 'signature';
    },
    getSignatureStatuses: async () => ({ value: [status] }),
    confirmTransaction: async () => {
      counts.confirmed++;
      return { value: { err: null } };
    },
  };
  const provider = {
    signTransaction: async (tx) => {
      counts.signed++;
      return tx;
    },
  };
  const window = {
    RafttApiConfig: { baseUrl: 'http://127.0.0.1:3000' },
    RafttSolanaConfig: { programId: 'raftt-program' },
    RafttBackend: {
      t: (pt) => pt,
      fail: (r) => {
        if (r.error) throw r.error;
        return r.data;
      },
      user: async () => ({ id: user }),
      db: {
        auth: {
          getSession: async () => ({ data: { session: token ? { access_token: token } : null } }),
        },
      },
    },
    RafttChain: { address: () => owner, provider: () => provider },
    RafttV2Bridge: { ready: async () => {}, rpc: () => rpc },
    solanaWeb3: { Transaction: { from: () => transaction } },
    addEventListener: (name, fn) => (events[name] = fn),
    dispatchEvent: () => {},
  };
  provider.signMessage = async () => ({ signature: new Uint8Array(64) });
  vm.runInNewContext(fs.readFileSync('assets/js/backend/raftt-api.js', 'utf8'), {
    window,
    URL,
    AbortSignal,
    Uint8Array,
    TextEncoder,
    crypto: crypto.webcrypto,
    localStorage: { getItem: (k) => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
    btoa: (x) => Buffer.from(x, 'binary').toString('base64'),
    atob: (x) => Buffer.from(x, 'base64').toString('binary'),
    Event: class {},
    CustomEvent: class {},
    fetch: async (url, options) => {
      calls.push({ url: url.toString(), options });
      const result = await responder(new URL(url).pathname, options);
      return { ok: !result.error, json: async () => (result.error ? result : { data: result }) };
    },
  });
  return {
    api: window.RafttApi,
    window,
    counts,
    calls,
    storage,
    events,
    setOwner: (x) => (owner = x),
    setUser: (x) => (user = x),
    setToken: (x) => (token = x),
    setResponder: (x) => (responder = x),
    setInstruction: (x) => (instruction = x),
    setStatus: (x) => (status = x),
  };
}
(async () => {
  const a = setup();
  await a.api.request('/v1/me');
  assert.equal(a.calls[0].options.headers.Authorization, 'Bearer access-token');
  await assert.rejects(a.api.request('https://outside.example/v1/me'), /Endpoint/);
  assert.equal(a.calls.length, 1);
  a.setToken(null);
  await assert.rejects(a.api.request('/v1/me'), /Entre na sua conta/);
  assert.equal(a.calls.length, 1);
  a.setToken('access-token');
  a.window.RafttApiConfig.baseUrl = 'http://unsafe.example';
  await assert.rejects(a.api.request('/v1/me'), /HTTPS/);
  assert.equal(a.calls.length, 1);
  const b = setup();
  await b.api.verifyWallet();
  assert.equal(b.calls.length, 1);
  await b.api.verifyWallet();
  assert.equal(b.calls.length, 1);
  b.events['raftt:wallet-change']();
  await b.api.verifyWallet();
  assert.equal(b.calls.length, 2);
  const c = setup();
  c.setResponder(async () => {
    c.setOwner('wallet-b');
    return [{ address: 'wallet-a', id: 'wallet-id' }];
  });
  await assert.rejects(c.api.verifyWallet(), /mudou/);
  const d = setup();
  d.setInstruction('fail_round');
  await assert.rejects(
    d.api.submitPrepared(
      { transaction: 'AA==', last_valid_block_height: 10 },
      '/v1/rounds/register',
      { draftId: 'draft' },
    ),
    /difere/,
  );
  assert.equal(d.counts.signed, 0);
  const e = setup();
  let failed = true;
  e.setResponder(async () =>
    failed
      ? { error: { message: 'RPC unavailable', code: 'rpc_unavailable' } }
      : { id: 'round-id' },
  );
  await assert.rejects(
    e.api.submitPrepared(
      { transaction: 'AA==', last_valid_block_height: 10 },
      '/v1/rounds/register',
      { draftId: 'draft' },
    ),
    /registro está pendente/,
  );
  assert.equal(e.counts.sent, 1);
  const pending = await e.api.pending();
  assert.equal(pending.length, 1);
  assert.equal(pending[0].signature, 'signature');
  failed = false;
  await e.api.resume(pending[0]);
  assert.equal(e.counts.sent, 1);
  assert.equal((await e.api.pending()).length, 0);
  assert.equal(e.counts.confirmed, 0);
  const f = setup();
  await f.api.recordConfirmed('round', 'refund_round', 'signature', 'wallet-id');
  f.setUser('user-b');
  assert.equal((await f.api.pending()).length, 0);
  for (const name of ['company-dashboard', 'milestone-releases', 'admin-review']) {
    const html = fs.readFileSync(name + '.html', 'utf8');
    assert.match(html, /operational-workspace/);
    assert.ok(html.indexOf('raftt-api.js') < html.indexOf('operational-workspace.js'));
    assert.doesNotMatch(html, /src="assets\/js\/company\/chain-rounds/);
  }
  const admin = fs.readFileSync('admin-review.html', 'utf8');
  assert.doesNotMatch(admin, /NULLUN|demo-workflows.js|Demo proposal/);
  console.log(
    'API integration: session, HTTPS, wallet changes, instruction validation, pending retry without duplicate transaction and operational routes passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
