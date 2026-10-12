const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
(async () => {
  let fail = false;
  const window = {
    RafttDataConfig: { apiBaseUrl: 'https://api.example' },
    RafttSolanaConfig: { network: 'devnet', programId: 'program' },
    dispatchEvent() {},
  };
  vm.runInNewContext(fs.readFileSync('assets/js/shared/company-data.js', 'utf8'), {
    window,
    CustomEvent: class {},
    fetch: async (url) => {
      assert.equal(url, 'https://api.example/companies');
      if (fail) throw Error('Offline');
      return {
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'company',
              name: 'Company',
              offerings: [{ network: 'devnet', programId: 'program', address: 'round' }],
            },
          ],
        }),
      };
    },
  });
  await window.RafttCompanyData.refresh();
  assert.equal(window.RafttCompanyData.forRound({ address: 'round' }).id, 'company');
  assert.equal(window.RafttCompanyData.forRound({ address: 'another' }), null);
  window.RafttSolanaConfig.network = 'localnet';
  assert.equal(window.RafttCompanyData.forRound({ address: 'round' }), null);
  fail = true;
  await window.RafttCompanyData.refresh();
  assert.equal(window.RafttCompanyData.status, 'unavailable');
  assert.equal(window.RafttCompanyData.companies.length, 0);
  console.log(
    'Company API: exact offering linkage, network isolation and stale data clearing passed.',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
