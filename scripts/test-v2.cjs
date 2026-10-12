const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
class PublicKey {
  constructor(v) {
    this.v = v;
  }
  toBase58() {
    return typeof this.v === 'string' ? this.v : Buffer.from(this.v).toString('hex');
  }
}
const window = { RafttV2Bridge: { pk: (x) => new PublicKey(x) }, RafttChain: {} };
vm.runInNewContext(fs.readFileSync('assets/js/solana/v2-client.js', 'utf8'), {
  window,
  Uint8Array,
  DataView,
  BigInt,
  Number,
  TextEncoder,
  crypto: crypto.webcrypto,
});
const v = window.RafttV2;
assert.equal(Buffer.from(v.u64(18446744073709551615n)).toString('hex'), 'ffffffffffffffff');
assert.equal(Buffer.from(v.u16(513)).toString('hex'), '0102');
assert.throws(() => v.u16(65536));
const b = new Uint8Array(294),
  view = new DataView(b.buffer);
for (const [o, n] of [
  [168, 2n],
  [176, 200n],
  [184, 1000n],
  [200, 600n],
  [208, 200n],
  [216, 100n],
])
  view.setBigUint64(o, n, true);
view.setBigInt64(192, 2000000n, true);
view.setUint16(224, 3, true);
view.setUint16(226, 1, true);
b[228] = 2;
b[229] = 9; // bump belongs before both hashes
b.fill(0xab, 230, 262);
b.fill(0xcd, 262, 294);
const r = v.decodeRound(b);
assert.equal(r.planHash, 'ab'.repeat(32));
assert.equal(r.reviewHash, 'cd'.repeat(32));
assert.equal(r.minimum, 200n);
assert.equal(r.cap, 1000n);
assert.equal(r.raised, 600n);
assert.equal(r.status, 2);
assert.equal(r.milestoneCount, 3);
assert.equal(r.nextRelease, 1);
assert.equal(r.deadline, 2000000);
const m = new Uint8Array(148),
  mv = new DataView(m.buffer);
mv.setUint16(40, 2, true);
mv.setBigUint64(42, 50n, true);
m[50] = 3;
assert.equal(v.decodeMilestone(m).amount, 50n);
assert.equal(v.decodeMilestone(m).index, 2);
assert.equal(v.decodeMilestone(m).status, 3);
const idl = JSON.parse(fs.readFileSync('assets/js/solana/raftt.json', 'utf8'));
for (const spec of idl.instructions)
  assert.deepEqual(
    spec.discriminator,
    Array.from(
      crypto
        .createHash('sha256')
        .update('global:' + spec.name)
        .digest()
        .subarray(0, 8),
    ),
    spec.name,
  );
for (const a of idl.accounts)
  assert.deepEqual(
    a.discriminator,
    Array.from(
      crypto
        .createHash('sha256')
        .update('account:' + a.name)
        .digest()
        .subarray(0, 8),
    ),
    a.name,
  );
const size = (t) =>
  typeof t === 'string'
    ? { pubkey: 32, u64: 8, i64: 8, u16: 2, u8: 1, bool: 1 }[t]
    : size(t.array[0]) * t.array[1];
for (const [name, expected] of [
  ['Round', 294],
  ['Milestone', 148],
  ['PlatformConfig', 41],
  ['RoundPosition', 81],
])
  assert.equal(
    8 + idl.types.find((t) => t.name === name).type.fields.reduce((n, f) => n + size(f.type), 0),
    expected,
    name,
  );
console.log('V2: serialização, layouts e discriminadores verificados.');
