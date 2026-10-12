const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('assets/js/map/map.js', 'utf8');
const nodes = new Map();
function node(selector) {
  if (!nodes.has(selector))
    nodes.set(selector, {
      textContent: '',
      innerHTML: '',
      classList: { remove() {}, add() {} },
      querySelectorAll() {
        return [];
      },
    });
  return nodes.get(selector);
}
const islands = [
  { id: 'startups', name: { pt: 'Startups', en: 'Startups' }, opps: [] },
  { id: 'pmes', name: { pt: 'PMEs', en: 'SMEs' }, opps: [] },
];
let fail = false,
  calls = 0,
  langUpdates = 0;
const context = {
  window: {},
  ISLANDS: islands,
  $: node,
  lang: 'pt',
  applyLang() {
    langUpdates++;
  },
  document: {},
  console,
};
vm.runInNewContext(fs.readFileSync('assets/js/shared/catalog-model.js', 'utf8'), context);
context.window.RafttCatalog = {
  esc: (x) => String(x ?? '').replaceAll('<', '&lt;'),
  async load() {
    calls++;
    if (fail) throw Error('offline');
    return [
      { id: 'real-company', name: '<script>', publication_status: 'published' },
      { id: 'private-draft', publication_status: 'draft' },
    ];
  },
};
const start = code.indexOf('let openOpportunityCategory = null');
const end = code.indexOf('function openOpportunityMenu', start);
vm.runInNewContext(code.slice(start, end), context);
(async () => {
  await context.refreshMapCompanies();
  assert.equal(calls, 1);
  assert.equal(islands[0].opps.length, 1);
  assert.equal(islands[1].opps.length, 0);
  context.renderOpportunityList(islands[0]);
  assert.ok(node('#opportunity-menu-list').innerHTML.includes('&lt;script>'));
  assert.ok(!node('#opportunity-menu-list').innerHTML.includes('NULLUN'));
  fail = true;
  await context.refreshMapCompanies();
  assert.equal(islands[0].opps.length, 0);
  assert.ok(node('#opportunity-menu-list').innerHTML.includes('map-catalog-retry'));
  assert.equal(langUpdates, 2);
  for (const path of [
    'assets/js/map/map.js',
    'assets/js/map.js',
    'assets/js/map/map-data.js',
    'assets/js/map-data.js',
  ])
    assert.ok(!/nullun|nexo|opportunitySamples/.test(fs.readFileSync(path, 'utf8')));
  console.log(
    'Map catalog: published-only records, empty categories, escaped names, retry and cleared stale companies passed (mocked service).',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
