const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const idl = JSON.parse(fs.readFileSync('assets/js/solana/raftt.json'));
class PK {
  constructor(v) {
    this.v = v instanceof PK ? v.v : v;
  }
  toBytes() {
    return new Uint8Array(32);
  }
  toBase58() {
    return String(this.v);
  }
  equals(p) {
    return this.v === p.v;
  }
  static findProgramAddressSync(seeds) {
    return [new PK(seeds.map((s) => Buffer.from(s).toString('hex')).join(':'))];
  }
}
let captured;
class Transaction {
  constructor(options) {
    this.options = options;
    this.ixs = [];
  }
  add(...ixs) {
    this.ixs.push(...ixs);
    return this;
  }
  compileMessage() {
    return {};
  }
}
class Connection {
  async getGenesisHash() {
    return 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
  }
  async getAccountInfo(key) {
    return key.toBase58() === idl.address ? { executable: true } : null;
  }
  async getParsedAccountInfo() {
    return {
      value: {
        owner: new PK('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        data: { parsed: { type: 'mint', info: { decimals: 6 } } },
      },
    };
  }
  async getLatestBlockhash() {
    return { blockhash: 'block', lastValidBlockHeight: 1 };
  }
  async getFeeForMessage() {
    return { value: 5000 };
  }
  async getMinimumBalanceForRentExemption() {
    return 1;
  }
  async getBalance() {
    return 1000000000;
  }
}
const provider = {
  publicKey: new PK('creator'),
  connect: async () => {},
  on: () => {},
  signTransaction: async (tx) => {
    captured = tx;
    throw Error('STOP_BEFORE_SEND');
  },
};
const window = {
  RafttSolanaConfig: {
    network: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    programId: idl.address,
  },
  solanaWeb3: {
    PublicKey: PK,
    Connection,
    Transaction,
    TransactionInstruction: class {
      constructor(x) {
        Object.assign(this, x);
      }
    },
    SystemProgram: { programId: new PK('system') },
    SYSVAR_RENT_PUBKEY: new PK('rent'),
  },
  phantom: { solana: provider },
  dispatchEvent: () => {},
};
vm.runInNewContext(fs.readFileSync('assets/js/solana/client.js', 'utf8'), {
  window,
  URL,
  TextEncoder,
  Uint8Array,
  DataView,
  BigInt,
  Event: class {},
  CustomEvent: class {},
  fetch: async () => ({ ok: true, json: async () => idl }),
});
(async () => {
  const C = window.RafttChain;
  assert.notEqual(
    C.offeringFor('creator', '1').toBase58(),
    C.offeringFor('creator', '2').toBase58(),
  );
  await C.connect();
  await assert.rejects(C.initialize('mint', '10.000001', '9007199254740993'), /STOP_BEFORE_SEND/);
  const ix = captured.ixs[0],
    view = new DataView(ix.data.buffer);
  assert.equal(ix.data.length, 24);
  assert.equal(view.getBigUint64(8, true), 9007199254740993n);
  assert.equal(view.getBigUint64(16, true), 10000001n);
  const spec = idl.instructions.find((i) => i.name === 'initialize');
  assert.deepEqual(Array.from(ix.data.slice(0, 8)), spec.discriminator);
  assert.equal(ix.keys.length, spec.accounts.length);
  const offering = ix.keys[spec.accounts.findIndex((a) => a.name === 'offering')].pubkey;
  assert.equal(offering.toBase58(), C.offeringFor('creator', '9007199254740993').toBase58());
  console.log(
    'Legacy offering: distinct ID PDAs, initialize argument order and precision beyond Number.MAX_SAFE_INTEGER passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
