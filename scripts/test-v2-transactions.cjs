const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const idl = JSON.parse(fs.readFileSync('assets/js/solana/raftt.json'));
class PK {
  constructor(x) {
    this.x = x;
  }
  toBase58() {
    return typeof this.x === 'string' ? this.x : Buffer.from(this.x).toString('hex');
  }
  toBytes() {
    return typeof this.x === 'string' ? new Uint8Array(32).fill(1) : this.x;
  }
}
let wallet = new PK('investor'),
  sent = [],
  now = 1000;
const round = new Uint8Array(294),
  view = new DataView(round.buffer);
view.setBigUint64(176, 10n, true);
view.setBigUint64(184, 20n, true);
view.setBigInt64(192, 200000n, true);
view.setBigUint64(200, 5n, true);
view.setUint16(224, 1, true);
round[228] = 1;
const position = new Uint8Array(81);
new DataView(position.buffer).setBigUint64(72, 5n, true);
const milestone = new Uint8Array(148);
new DataView(milestone.buffer).setBigUint64(42, 10n, true);
milestone[50] = 2;
const rpc = {
  getSlot: async () => 1,
  getBlockTime: async () => now,
  getTokenAccountBalance: async () => ({ value: { amount: '100' } }),
};
const window = {
  RafttChain: { units: (x) => BigInt(x) },
  RafttV2Bridge: {
    W: {
      TransactionInstruction: class {
        constructor(x) {
          Object.assign(this, x);
        }
      },
      SystemProgram: { programId: new PK('system') },
    },
    pk: (x) => (x instanceof PK ? x : new PK(x)),
    bytes: (x) => new TextEncoder().encode(x),
    pda: (...seeds) => new PK(Buffer.concat(seeds.map((x) => Buffer.from(x))).toString('hex')),
    ready: async () => {},
    walletKey: () => wallet,
    programId: new PK(idl.address),
    token: new PK('token'),
    rpc: () => rpc,
    mintInfo: async () => ({ decimals: 0 }),
    account: async (_address, kind) =>
      ({ Round: round, RoundPosition: position, Milestone: milestone })[kind],
    tokenAccount: async (_mint, _owner, create) => ({
      address: new PK(create ? 'destination' : 'source'),
      ix: { associated: true },
    }),
    send: async (ixs, owner) => {
      assert.equal(owner, wallet.toBase58());
      sent = ixs;
      return 'confirmed';
    },
  },
};
vm.runInNewContext(fs.readFileSync('assets/js/solana/v2-client.js', 'utf8'), {
  window,
  fetch: async () => ({ json: async () => idl }),
  Uint8Array,
  DataView,
  BigInt,
  Number,
  TextEncoder,
  crypto: crypto.webcrypto,
});
(async () => {
  const V = window.RafttV2;
  await V.act('invest_round', 'round', { amount: '3' });
  const ix = sent.at(-1),
    spec = idl.instructions.find((x) => x.name === 'invest_round');
  assert.equal(ix.keys.length, spec.accounts.length);
  assert.equal(ix.data.length, 16);
  assert.equal(new DataView(ix.data.buffer).getBigUint64(8, true), 3n);
  assert.equal(
    ix.keys[spec.accounts.findIndex((x) => x.name === 'investor_token')].pubkey.toBase58(),
    'source',
  );
  assert.deepEqual(Array.from(ix.data.slice(0, 8)), spec.discriminator);
  for (let i = 0; i < spec.accounts.length; i++) {
    assert.equal(ix.keys[i].isSigner, !!spec.accounts[i].signer);
    assert.equal(ix.keys[i].isWritable, !!spec.accounts[i].writable);
  }
  await assert.rejects(V.act('invest_round', 'round', { amount: '16' }), /limite restante/);
  now = 200000 - 172800;
  await assert.rejects(
    V.act('cancel_round', 'round', { amount: '1' }),
    /Cancelamento indisponível/,
  );
  now--;
  await V.act('cancel_round', 'round', { amount: '5' });
  assert.equal(sent.length, 2);
  await assert.rejects(V.act('refund_round', 'round'), /rodada falhada/);
  round[228] = 3;
  await V.act('refund_round', 'round');
  assert.equal(sent.at(-1).data.length, 8);
  new DataView(position.buffer).setBigUint64(72, 0n, true);
  await assert.rejects(V.act('refund_round', 'round'), /posição positiva/);
  round[228] = 2;
  await V.act('release_milestone', 'round', { index: 0 });
  assert.equal(sent.length, 2);
  milestone[50] = 3;
  await assert.rejects(V.act('release_milestone', 'round', { index: 0 }), /já paga/);
  console.log(
    'V2 transactions: compiled IDL account order, amount bytes, cap, exact cancellation boundary, positive refund and one-time release passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
