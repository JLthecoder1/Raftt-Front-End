const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('assets/js/backend/operational-workspace.js', 'utf8');
const wait = async (fn) => {
  for (let i = 0; i < 100; i++) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw Error('DOM test timed out');
};
function setup(admin, staff = true) {
  const dom = new JSDOM('<main data-review-workspace></main>', {
      url: 'http://127.0.0.1:8765/' + (admin ? 'admin-review' : 'company-dashboard'),
      runScripts: 'outside-only',
    }),
    w = dom.window;
  const calls = [],
    model = { status: 'submitted', published: false, ai: false, chainStatus: 0, milestones: [] };
  const company = {
    id: 'company',
    name: '<img src=x onerror=alert(1)>',
    publication_status: 'draft',
  };
  const app = () => ({
    id: 'application',
    version: 1,
    status: model.status,
    payload: { name: '<script>evil</script>' },
  });
  const row = {
    id: 'round',
    company_id: 'company',
    chain_address: 'chain-address',
    mint: 'mint',
    plan_hash: 'hash',
  };
  const tables = {
    companies: [company],
    platform_staff: staff ? { role: 'admin' } : null,
    rounds: [row],
    documents: [],
    review_decisions: [],
    milestones: [],
  };
  function query(table) {
    const q = {};
    for (const key of ['select', 'eq', 'order', 'limit', 'maybeSingle']) q[key] = () => q;
    q.then = (resolve, reject) =>
      Promise.resolve({
        data: Object.hasOwn(tables, table) ? tables[table] : [],
        error: null,
      }).then(resolve, reject);
    return q;
  }
  const escape = (x) =>
    String(x ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  w.RafttAccountReady = true;
  w.RafttRoutes = { page: admin ? 'admin-review.html' : 'company-dashboard.html' };
  w.RafttSolanaConfig = { network: 'devnet', programId: 'program' };
  w.RafttBackend = { user: async () => ({ id: 'user' }), fail: (r) => r.data, db: { from: query } };
  w.RafttChain = {
    address: () => null,
    format: (n) => String(n),
    units: (n) => BigInt(n),
    connect: async () => {},
    disconnect: async () => {},
  };
  w.RafttV2Bridge = { mintInfo: async () => ({ decimals: 0 }) };
  w.RafttV2 = {
    load: async () => ({
      mint: 'mint',
      planHash: 'hash',
      creator: 'creator',
      platform: 'reviewer',
      recipient: 'recipient',
      status: model.chainStatus,
      raised: 0n,
      minimum: 10n,
      cap: 20n,
      vaultBalance: 0n,
      released: 0n,
      deadline: 2000000000,
      now: 100,
      allocated: 10n,
      milestoneCount: 1,
      milestones: model.milestones,
      nextRelease: 0,
      decimals: 0,
    }),
  };
  w.RafttApi = {
    t: (pt) => pt,
    esc: escape,
    pending: async () => [],
    verifyWallet: async () => ({ id: 'wallet' }),
    operation: async (id, op) => {
      calls.push({ op });
      if (op === 'open_round') model.chainStatus = 1;
      if (op === 'approve_milestone') model.milestones[0].status = 2;
      return { signature: 'signature' };
    },
    request: async (path, body) => {
      calls.push({ path, body });
      if (path === '/v1/companies/company')
        return { ...company, publication_status: model.published ? 'published' : 'draft' };
      if (path.endsWith('/applications')) return [app()];
      if (path === '/v1/rounds/round') return row;
      if (path.endsWith('/analyze')) {
        if (!model.ai) throw Error('IA não configurada');
        const report = {
          id: 'report',
          report: { summary: 'Real report' },
          canonical_input: JSON.stringify({ evidence: tables.evidence || [] }),
        };
        if (path.includes('/milestones/')) tables.ai_reports = [report];
        return report;
      }
      if (path.endsWith('/decisions')) {
        if (path.includes('/milestones/')) {
          tables.review_decisions = [{ id: 'milestone-decision', ...body }];
          return tables.review_decisions[0];
        }
        model.status = body.decision;
        return { id: 'decision' };
      }
      if (path.endsWith('/publish')) {
        model.published = true;
        return company;
      }
      if (path.endsWith('/prepare')) return { transaction: 'unsigned' };
      return {};
    },
  };
  w.eval(source);
  return { w, dom, calls, model, tables, $: (id) => w.document.getElementById(id) };
}
async function testInvestment() {
  const dom = new JSDOM('<section id="company-investment"></section>', {
      runScripts: 'outside-only',
    }),
    w = dom.window,
    calls = [];
  let owner = 'wallet-a';
  w.RafttBackend = { t: (pt) => pt };
  w.RafttChain = { address: () => owner, format: (n) => String(n), units: (n) => BigInt(n) };
  w.RafttV2 = {
    load: async () => ({
      mint: 'mint',
      decimals: 0,
      status: 1,
      now: 1,
      deadline: 2000000000,
      raised: 0n,
      cap: 100n,
      minimum: 10n,
      position: 0n,
    }),
    act: async (...args) => {
      calls.push({ act: args });
      return 'signature';
    },
  };
  w.RafttApi = {
    request: async (path, body) => {
      calls.push({ path, body });
      return { terms: { description: 'Test terms' }, terms_version: 7 };
    },
    verifyWallet: async () => ({ id: 'verified-wallet' }),
    recordConfirmed: async (...args) => {
      calls.push({ record: args });
    },
  };
  w.eval(fs.readFileSync('assets/js/solana/company-investment.js', 'utf8'));
  w.dispatchEvent(
    new w.CustomEvent('raftt:catalog-round', {
      detail: { id: 'round-id', chain_address: 'chain-address', mint: 'mint', decimals: 0 },
    }),
  );
  const click = (name) => w.document.querySelector('[data-chain-action="' + name + '"]').click();
  await wait(() => w.document.querySelector('#company-token-amount'));
  w.document.querySelector('#company-token-amount').value = '5';
  click('review-invest');
  await wait(() => w.document.querySelector('#company-accept-terms'));
  click('confirm');
  await wait(() => /Aceite os termos/.test(w.document.body.textContent));
  assert.equal(calls.filter((x) => x.act).length, 0);
  w.document.querySelector('#company-accept-terms').checked = true;
  click('confirm');
  await wait(() => calls.some((x) => x.record));
  assert.equal(calls.find((x) => x.path?.endsWith('/terms')).body.termsVersion, 7);
  assert.equal(calls.filter((x) => x.act).length, 1);
  assert.equal(calls.find((x) => x.record).record[0], 'round-id');
  await wait(() => !w.document.querySelector('[data-chain-action=refresh]').disabled);
  w.document.querySelector('#company-token-amount').value = '5';
  click('review-invest');
  await wait(() => w.document.querySelector('#company-accept-terms'));
  w.document.querySelector('#company-accept-terms').checked = true;
  w.RafttApi.verifyWallet = async () => {
    owner = 'wallet-b';
    return { id: 'wallet-b-id' };
  };
  click('confirm');
  await wait(() => /carteira mudou/.test(w.document.body.textContent));
  assert.equal(calls.filter((x) => x.act).length, 1);
  dom.window.close();
}
(async () => {
  const c = setup(false);
  await wait(() => c.$('api-milestones'));
  assert.equal(c.$('api-create-form'), null);
  assert.match(c.$('api-create').textContent, /aprovação/);
  assert.equal(c.w.document.querySelectorAll('img,script').length, 0);
  c.model.status = 'approved';
  c.$('api-refresh').click();
  await wait(() => c.$('api-create-form'));
  assert.ok(c.$('api-create-form').querySelector('[name=minimum]'));
  assert.ok(c.$('api-milestone-form'));
  const a = setup(true);
  await wait(() => a.$('api-open'));
  a.$('api-analyze').click();
  await wait(() => /IA não configurada/.test(a.$('api-feedback').textContent));
  assert.equal(a.$('api-report').hidden, true);
  a.$('api-approve').click();
  await wait(() => /justificativa/.test(a.$('api-feedback').textContent));
  assert.equal(a.model.status, 'submitted');
  a.$('api-reason').value = 'Verified current application';
  a.$('api-approve').click();
  await wait(() => a.model.status === 'approved');
  await wait(() => !a.$('api-refresh').disabled);
  const decision = a.calls.find((x) => x.path?.endsWith('/decisions'));
  assert.equal(decision.body.reason, 'Verified current application');
  assert.equal(decision.body.decision, 'approved');
  a.$('api-open').click();
  await wait(() => a.model.chainStatus === 1);
  await wait(() => !a.$('api-refresh').disabled);
  assert.ok(a.calls.some((x) => x.path?.endsWith('/open/prepare')));
  a.$('api-publish').click();
  await wait(() => a.model.published);
  await wait(() => !a.$('api-refresh').disabled);
  assert.match(a.$('api-company-content').textContent, /Publicada/);
  a.model.chainStatus = 2;
  a.model.milestones = [
    { index: 0, amount: 10n, status: 1, planHash: 'milestone-hash', evidenceHash: 'evidence-hash' },
  ];
  a.tables.milestones = [
    {
      id: 'milestone',
      sequence: 0,
      title: 'Delivery',
      description: 'Work',
      acceptance_criteria: 'Criteria',
      use_of_funds: 'Budget',
      plan_hash: 'milestone-hash',
    },
  ];
  a.tables.evidence = [
    { id: 'evidence', description: 'Current evidence', evidence_hash: 'evidence-hash' },
  ];
  a.tables.ai_reports = [
    {
      id: 'old-report',
      report: { summary: 'Outdated' },
      canonical_input: JSON.stringify({
        evidence: [{ id: 'old-evidence', evidence_hash: 'old-hash' }],
      }),
    },
  ];
  a.tables.review_decisions = [];
  a.$('api-refresh').click();
  await wait(() => a.$('api-ms-milestone-approve'));
  await wait(() => !a.$('api-refresh').disabled);
  a.$('api-ms-milestone-reason').value = 'Reviewed evidence';
  a.$('api-ms-milestone-approve').click();
  await wait(() => /não analisou/.test(a.$('api-feedback').textContent));
  assert.equal(
    a.calls.filter((x) => x.path?.includes('/milestones/') && x.path.endsWith('/decisions')).length,
    0,
  );
  a.model.ai = true;
  a.$('api-ms-milestone-analyze').click();
  await wait(() => !a.$('api-refresh').disabled);
  a.$('api-ms-milestone-approve').click();
  await wait(() => a.$('api-ms-milestone-authorize'));
  await wait(() => !a.$('api-refresh').disabled);
  a.$('api-ms-milestone-authorize').click();
  await wait(() => a.model.milestones[0].status === 2);
  await wait(() => !a.$('api-refresh').disabled);
  assert.ok(
    a.calls.some(
      (x) => x.path?.endsWith('/approval/prepare') && x.body.decisionId === 'milestone-decision',
    ),
  );
  assert.ok(a.w.document.querySelector('#api-ms-milestone-controls button'));
  const denied = setup(true, false);
  await wait(() => /exclusiva/.test(denied.$('api-feedback').textContent));
  assert.equal(denied.calls.length, 0);
  a.w.RafttAccountReady = false;
  a.w.dispatchEvent(new a.w.Event('raftt:auth-signout'));
  assert.equal(a.$('company-chain-rounds').textContent, '');
  for (const item of [c, a, denied]) item.dom.window.close();
  await testInvestment();
  console.log(
    'Operational DOM: approval gate, safe rendering, AI unavailable, review rationale, API decisions, wallet authorization, publication, staff denial and sign-out passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
