const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert');
const idl = JSON.parse(fs.readFileSync('assets/js/solana/raftt.json'));
const cfgText = fs.readFileSync('assets/js/solana/config.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(cfgText, context);
assert.equal(context.window.RafttSolanaConfig.programId, idl.address);
class PublicKey {
  constructor(v) {
    this.v = typeof v === 'string' ? v : 'creator';
  }
  toBase58() {
    return this.v;
  }
  toBytes() {
    return new Uint8Array(32);
  }
  equals(p) {
    return this.v === p.v;
  }
  static findProgramAddressSync() {
    return [new PublicKey('pda')];
  }
}
let failed = false,
  released = false,
  closed = false,
  target = 100n,
  raised = 20n,
  position = 5n;
function data(kind) {
  const b = new Uint8Array(kind === 'Offering' ? 132 : 81);
  b.set(idl.accounts.find((x) => x.name === kind).discriminator);
  const v = new DataView(b.buffer);
  if (kind === 'Offering') {
    v.setBigUint64(80, target, true);
    v.setBigUint64(88, raised, true);
    b[96] = +closed;
    b[97] = +failed;
    b[98] = +released;
  } else v.setBigUint64(72, position, true);
  return b;
}
let calls = 0;
class Connection {
  async getGenesisHash() {
    return 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
  }
  async getAccountInfo(p) {
    if (p.v === idl.address) return { executable: true };
    return {
      owner: new PublicKey(idl.address),
      data: data(calls++ % 2 === 0 ? 'Offering' : 'Position'),
    };
  }
  async getParsedAccountInfo() {
    return {
      value: {
        owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        data: { parsed: { type: 'mint', info: { decimals: 0 } } },
      },
    };
  }
  async getTokenAccountBalance() {
    return { value: { amount: '20' } };
  }
}
const wallet = {
  publicKey: new PublicKey('investor'),
  connect: async () => {},
  disconnect: async () => {},
  signTransaction: async () => {},
  on: () => {},
};
const window = {
  solanaWeb3: { PublicKey, Connection, SystemProgram: { programId: new PublicKey('system') } },
  RafttSolanaConfig: context.window.RafttSolanaConfig,
  phantom: { solana: wallet },
  dispatchEvent: () => {},
};
vm.runInNewContext(fs.readFileSync('assets/js/solana/client.js', 'utf8'), {
  window,
  TextEncoder,
  Uint8Array,
  DataView,
  BigInt,
  URL,
  Event: class {},
  fetch: async () => ({ ok: true, json: async () => idl }),
});
(async () => {
  const c = window.RafttChain;
  await c.connect();
  const load = () => {
    calls = 0;
    return c.load('creator');
  };
  let s = await load();
  assert.equal(s.position, 5n);
  assert.equal(s.investor, 'investor');
  for (const [action, update, message] of [
    [
      'refund',
      () => {
        failed = false;
      },
      /Reembolso/,
    ],
    ['release', () => {}, /criadora/],
    [
      'invest',
      () => {
        closed = true;
      },
      /indisponível/,
    ],
    [
      'invest',
      () => {
        closed = false;
      },
      /ultrapassa/,
    ],
    ['fail_offering', () => {}, /criadora/],
  ]) {
    update();
    calls = 0;
    await assert.rejects(c.act(action, 'creator', '81'), message);
  }
  failed = true;
  calls = 0;
  s = await c.load('creator');
  assert.equal(s.failed, true);
  await c.disconnect();
  calls = 0;
  s = await c.load('creator');
  assert.equal(s.position, 0n);
  assert.equal(s.investor, undefined);
  console.log('IDL identity, public reads, wallet isolation and unavailable-action guards: OK');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
