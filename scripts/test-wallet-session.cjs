const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert');
const stored = new Map(),
  listeners = {},
  calls = [];
let reject = false;
const provider = {
  publicKey: { toBase58: () => 'wallet-A' },
  connect: async (options) => {
    calls.push(options);
    if (reject) throw Error('rejected');
  },
  signTransaction() {},
  on: (name, handler) => {
    listeners[name] = handler;
  },
  disconnect: async () => listeners.disconnect(),
};
class PublicKey {
  constructor(value) {
    this.value = value;
  }
}
const window = {
  solanaWeb3: { PublicKey },
  RafttSolanaConfig: { programId: 'test' },
  phantom: { solana: provider },
  dispatchEvent() {},
};
const context = {
  window,
  TextEncoder,
  URL,
  Event,
  sessionStorage: {
    getItem: (k) => stored.get(k),
    setItem: (k, v) => stored.set(k, v),
    removeItem: (k) => stored.delete(k),
  },
};
const source = fs.readFileSync('assets/js/solana/client.js', 'utf8');
(async () => {
  vm.runInNewContext(source, context);
  let C = window.RafttChain;
  await C.restore();
  assert.equal(calls.length, 0);
  reject = true;
  await assert.rejects(C.connect());
  assert.equal(C.address(), undefined);
  reject = false;
  await C.connect();
  assert.equal(C.address(), 'wallet-A');
  await assert.rejects(window.RafttV2Bridge.send([], 'previous-wallet'), /Carteira alterada/);
  vm.runInNewContext(source, context);
  C = window.RafttChain;
  await C.restore();
  assert.equal(C.address(), 'wallet-A');
  assert.equal(calls.at(-1).onlyIfTrusted, true);
  await C.disconnect();
  assert.equal(C.address(), undefined);
  await C.restore();
  assert.equal(C.address(), undefined);
  console.log('Wallet session: rejection, trusted restore, disconnect passed.');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
