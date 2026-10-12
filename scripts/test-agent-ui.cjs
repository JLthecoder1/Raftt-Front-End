const { JSDOM } = require('jsdom'),
  fs = require('fs'),
  assert = require('assert/strict');
(async () => {
  const dom = new JSDOM('<main id="status"></main><section id="report"></section>', {
      url: 'http://localhost/company-dashboard',
      runScripts: 'outside-only',
    }),
    w = dom.window;
  const input = {
    recommendation: 'changes_requested',
    summary: '<img src=x onerror=alert(1)>',
    milestone_assessment: 'Criterion unverified',
    risks: ['Unverified revenue'],
    missing_information: ['Financial statements'],
    processing: { documents_read: [{ id: 'doc' }] },
  };
  w.RafttAccountReady = true;
  let seen;
  w.RafttApi = {
    request: async (path) =>
      path === '/health'
        ? { aiConfigured: true, agentEnabled: true }
        : [{ kind: 'application', target_id: 'app', status: 'completed', report_id: 'report' }],
  };
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    maybeSingle: async () => ({ data: { id: 'report', report: input } }),
  };
  w.RafttBackend = {
    t: (pt, en) => (w.localStorage.getItem('raftt-lang') === 'en' ? en : pt),
    db: {
      from: () => query,
      auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) },
    },
    fail: (r) => r.data,
  };
  w.RafttApiConfig = { baseUrl: 'http://localhost:3000' };
  w.AbortSignal.timeout = AbortSignal.timeout;
  w.fetch = async (url) => ({
    ok: true,
    json: async () =>
      url.pathname === '/health'
        ? { aiConfigured: true, agentEnabled: true }
        : {
            data: [
              { kind: 'application', target_id: 'app', status: 'completed', report_id: 'report' },
            ],
          },
  });
  w.eval(fs.readFileSync('assets/js/backend/raftt-api.js', 'utf8'));
  w.eval(fs.readFileSync('assets/js/backend/agent-status.js', 'utf8'));
  w.RafttAgent.mount(
    w.document.querySelector('#status'),
    'company',
    'app',
    'application',
    (row) => {
      seen = row;
      w.RafttAgent.report(w.document.querySelector('#report'), row.report);
    },
  );
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(seen.id, 'report');
  assert(w.document.querySelector('#status').textContent.includes('concluída'));
  assert.equal(w.document.querySelector('#report img'), null);
  assert(w.document.querySelector('#report').textContent.includes('Pendências'));
  assert(w.document.querySelector('#report').textContent.includes('Documentos lidos: 1'));
  w.localStorage.setItem('raftt-lang', 'en');
  w.RafttAgent.report(w.document.querySelector('#report'), input);
  assert(w.document.querySelector('#report').textContent.includes('Missing information'));
  w.dispatchEvent(new w.Event('raftt:auth-signout'));
  dom.window.close();
  console.log(
    'Agent UI: persisted automatic report, translated labels, private status and safe rendering passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
