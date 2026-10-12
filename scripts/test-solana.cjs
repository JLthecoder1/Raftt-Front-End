const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert');
class PublicKey {
  constructor(v) {
    this.v = v;
  }
  toBase58() {
    return this.v;
  }
}
const window = { solanaWeb3: { PublicKey }, RafttSolanaConfig: { programId: 'test' } };
vm.runInNewContext(fs.readFileSync('assets/js/solana/client.js', 'utf8'), {
  window,
  TextEncoder,
  Uint8Array,
  DataView,
  BigInt,
  URL,
});
const c = window.RafttChain;
assert.equal(c.units('0.000001', 6), 1n);
assert.equal(c.units('100.123456', 6), 100123456n);
assert.equal(c.units('18446744073709551615', 0), 18446744073709551615n);
for (const x of ['0', '-1', '1e4', '0.0000001', '18446744073709551616'])
  assert.throws(() => c.units(x, 6));
assert.equal(c.format(1n, 6), '0.000001');
assert.equal(c.format(100123456n, 6), '100.123456');
const b = new Uint8Array(132),
  v = new DataView(b.buffer);
v.setBigUint64(80, 100000000n, true);
v.setBigUint64(88, 50000000n, true);
b[96] = 1;
b[97] = 0;
b[98] = 1;
v.setBigUint64(40, 9007199254740993n, true);
const s = c.decodeOffering(b);
assert.equal(s.offeringId, 9007199254740993n);
assert.equal(Buffer.from(c.u64(9007199254740993n)).toString('hex'), '0100000000002000');
assert.throws(() => c.u64(Number.MAX_SAFE_INTEGER + 1));
assert.equal(s.target, 100000000n);
assert.equal(s.raised, 50000000n);
assert.equal(s.released, true);
assert.equal(s.vault.length, 32);
const idl = JSON.parse(fs.readFileSync('assets/js/solana/raftt.json'));
const crypto = require('crypto');
for (const ix of idl.instructions)
  assert.deepEqual(
    ix.discriminator,
    Array.from(
      crypto
        .createHash('sha256')
        .update('global:' + ix.name)
        .digest()
        .subarray(0, 8),
    ),
  );
assert.equal(idl.types.find((t) => t.name === 'Offering').type.fields[7].name, 'is_released');
console.log('Valores u64, decimais, layout Offering e discriminators: OK');
