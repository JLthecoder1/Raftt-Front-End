const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const window = { RafttBackend: { t: (pt) => pt } };
vm.runInNewContext(fs.readFileSync('assets/js/auth/password-rules.js', 'utf8'), {
  window,
  localStorage: { getItem: () => 'pt' },
  document: { getElementById: () => null },
});
const error = window.RafttPasswordRules.error;
assert(error('Abc1', 'Abc1'));
assert(error('abcdefgh', 'abcdefgh'));
assert(error('12345678', '12345678'));
assert.match(error('Password1', 'Password2'), /coincidem/);
assert.equal(error('Password1', 'Password1'), '');
assert.equal(error('Oláteste123!', 'Oláteste123!'), '');
assert(error(' Password1 ', 'Password1'));
console.log('Password length, letters, numbers, exact confirmation and Unicode checks passed.');
