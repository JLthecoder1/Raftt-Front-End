const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const window = {};
vm.runInNewContext(fs.readFileSync('assets/js/investor/workspace-model.js', 'utf8'), {
  window,
  Map,
  BigInt,
});
const { groupAmounts, positionState } = window.RafttWorkspaceModel;
const amounts = groupAmounts(
  [
    { mint: 'A', decimals: 6, position: 9007199254740993n },
    { mint: 'A', decimals: 6, position: 2n },
    { mint: 'B', decimals: 6, position: 11n },
  ],
  'position',
);
assert.equal(amounts.length, 2);
assert.equal(amounts[0].amount, 9007199254740995n);
assert.equal(amounts[1].amount, 11n);
assert.equal(groupAmounts([], 'position').length, 0);
assert.equal(positionState({ position: 0n, failed: true }), 'refunded');
assert.equal(positionState({ position: 5n, failed: true }), 'refund');
assert.equal(
  positionState({ position: 10n, failed: false, version: 1, legacyReleased: true, released: 0n }),
  'execution',
);
assert.equal(
  positionState({
    position: 10n,
    failed: false,
    version: 2,
    closed: true,
    status: 2,
    released: 0n,
  }),
  'funded',
);
assert.equal(
  positionState({
    position: 10n,
    failed: false,
    version: 2,
    closed: false,
    status: 1,
    released: 0n,
  }),
  'fundraising',
);
assert.equal(
  positionState({
    position: 10n,
    failed: false,
    version: 2,
    closed: true,
    status: 2,
    released: 4n,
  }),
  'execution',
);
const flow = fs.readFileSync('assets/js/investor/investor-flow.js', 'utf8');
const pages = flow.match(/const chainPage = \[([\s\S]*?)\]\.includes\(page\)/)[1];
for (const page of ['investor-dashboard.html', 'portfolio.html', 'company-dashboard.html'])
  assert.ok(!pages.includes(page), page + ' must keep its application shell');
console.log(
  'Workspace: precision, separate mints, refund/execution states and preserved page shell passed.',
);
