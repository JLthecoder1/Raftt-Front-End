const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('assets/js/shared/catalog-model.js', 'utf8'), context);
const model = context.window.RafttCatalogModel;
const companies = [
  {
    name: 'São Tech',
    description: 'Energia',
    sector: 'Tecnologia',
    publication_status: 'published',
  },
  { name: 'São Draft', publication_status: 'draft' },
];
assert.equal(model.filter(companies, 'sao', 'all').length, 1);
assert.equal(model.filter(companies, 'energia', 'startups').length, 1);
assert.equal(model.filter(companies, '', 'real-estate').length, 0);
assert.equal(model.filter(companies, 'inexistente', 'all').length, 0);
assert.equal(model.units('18446744073709551615', 6), '18446744073709.551615');
assert.equal(model.units(10000000, 6), '10.000000');
assert.equal(model.units(Number.MAX_SAFE_INTEGER + 1, 6), null);
assert.equal(model.units('-1', 6), null);
assert.equal(model.units('1', 19), null);
const code = fs.readFileSync('assets/js/shared/opportunity-catalog.js', 'utf8');
assert.ok(code.includes(".eq('publication_status', 'published')"));
assert.ok(!code.includes('market-status'));
assert.ok(code.includes('encodeURIComponent(company.id)'));
assert.ok(code.includes('There are no published companies yet.'));
assert.ok(code.includes('/round-v2?round='));
assert.ok(code.includes('encodeURIComponent(round.chain_address)'));
console.log(
  'Catalog: published-only filtering, accent search, categories, exact units and removed availability passed.',
);
