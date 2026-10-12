const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const tick = () => new Promise((resolve) => setImmediate(resolve));
function setup() {
  const events = {},
    sent = [];
  let owner = null,
    response = null;
  const row = {
    mint: 'mint',
    decimals: 0,
    status: 1,
    now: 1000,
    deadline: 200000,
    raised: 5n,
    minimum: 10n,
    cap: 20n,
    position: 5n,
  };
  const host = {
    buttons: [],
    html: '',
    set innerHTML(value) {
      this.html = value;
      this.buttons = [...value.matchAll(/data-chain-action="([^"]+)"/g)].map((m) => ({
        dataset: { chainAction: m[1] },
      }));
    },
    get innerHTML() {
      return this.html;
    },
    set textContent(x) {
      this.html = x;
      this.buttons = [];
    },
    querySelectorAll() {
      return this.buttons;
    },
    querySelector(selector) {
      return { value: selector === '#company-wallet-provider' ? 'phantom' : '3' };
    },
  };
  const window = {
    RafttBackend: { t: (pt) => pt },
    RafttChain: {
      address: () => owner,
      format: (x) => x.toString(),
      units: (x) => {
        const n = BigInt(x);
        if (n <= 0n) throw Error('invalid');
        return n;
      },
      connect: async () => {
        owner = 'alice';
        events['raftt:wallet-change']();
      },
      disconnect: async () => {
        owner = null;
        events['raftt:wallet-change']();
      },
    },
    RafttV2: {
      load: async () => (response ? await response : { ...row }),
      act: async (...args) => {
        sent.push(args);
        return 'signature';
      },
    },
    addEventListener: (name, fn) => (events[name] = fn),
  };
  vm.runInNewContext(fs.readFileSync('assets/js/solana/company-investment.js', 'utf8'), {
    window,
    document: { getElementById: () => host },
    Date,
  });
  return {
    host,
    sent,
    row,
    link: (mint = 'mint') =>
      events['raftt:catalog-round']({ detail: { chain_address: 'round', mint, decimals: 0 } }),
    click: async (name) => {
      const b = host.buttons.find((b) => b.dataset.chainAction === name);
      assert.ok(b, name);
      await b.onclick();
    },
    setOwner: (x) => {
      owner = x;
      events['raftt:wallet-change']();
    },
    defer: (p) => (response = p),
  };
}
(async () => {
  const a = setup();
  a.link();
  await tick();
  assert.match(a.host.html, /Conectar carteira/);
  assert.ok(!a.host.html.includes('review-invest'));
  await a.click('connect');
  assert.match(a.host.html, /Revisar investimento/);
  await a.click('review-invest');
  assert.equal(a.sent.length, 0, 'review must not send transaction');
  assert.match(a.host.html, /Confirme a operação/);
  await a.click('confirm');
  assert.equal(a.sent[0][0], 'invest_round');
  assert.equal(a.sent[0][1], 'round');
  assert.equal(a.sent[0][2].amount, '3');
  assert.match(a.host.html, /Transação confirmada/);
  await a.click('review-invest');
  a.setOwner('bob');
  await tick();
  assert.ok(
    !a.host.buttons.some((b) => b.dataset.chainAction === 'confirm'),
    'wallet switch clears pending review',
  );
  a.row.status = 3;
  await a.click('refresh');
  assert.match(a.host.html, /Revisar reembolso/);
  assert.ok(!a.host.html.includes('review-invest'));
  a.link('wrong-mint');
  await tick();
  assert.match(a.host.html, /investimento foi bloqueado/);
  assert.ok(!a.host.html.includes('review-refund'));
  const b = setup();
  b.setOwner('alice');
  let resolve;
  b.defer(new Promise((r) => (resolve = r)));
  b.link();
  b.setOwner('bob');
  resolve({ ...b.row });
  await tick();
  assert.ok(!b.host.html.includes('Confirme a operação'));
  console.log(
    'Company investment: live round, review-before-signing, confirmed operation, wallet-change reset, failed-round refund and mint mismatch passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
