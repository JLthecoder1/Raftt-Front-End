const { JSDOM } = require('jsdom'),
  fs = require('fs'),
  assert = require('assert/strict');
(async () => {
  const dom = new JSDOM(fs.readFileSync('company-application.html', 'utf8'), {
      url: 'http://localhost/company-application',
      runScripts: 'outside-only',
    }),
    w = dom.window;
  const company = {
    companyId: 'company',
    deckMethod: 'file',
    documentIds: ['deck'],
    companyName: 'Saved startup',
    structure: 'safe',
  };
  w.localStorage.setItem('raftt-company', JSON.stringify(company));
  w.RafttAccountReady = true;
  let submitted;
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    then(resolve) {
      return Promise.resolve({ data: [{ id: 'deck', name: 'Saved.pdf' }] }).then(resolve);
    },
  };
  w.RafttBackend = {
    t: (pt) => pt,
    fail: (r) => r.data,
    db: { from: () => query },
    saveApplication: async (data, files) => {
      submitted = { data, files };
      return 'company';
    },
  };
  w.RafttCloudDrafts = {
    load: async (_, fallback) => fallback,
    schedule() {},
    remove: async () => {},
  };
  w.RafttNumbers = { isMoney: () => false };
  w.eval(fs.readFileSync('assets/js/company/application-form.js', 'utf8'));
  await new Promise((r) => setTimeout(r, 20));
  const form = w.document.querySelector('#raise-application'),
    deck = w.document.querySelector('#deck-file');
  assert.equal(deck.required, false);
  assert(w.document.querySelector('#deck-upload-field').textContent.includes('Saved.pdf'));
  for (const field of form.querySelectorAll('input:not([type=file]),textarea,select')) {
    if (['radio', 'checkbox'].includes(field.type)) continue;
    field.value =
      field.tagName === 'SELECT'
        ? [...field.options].find((o) => o.value)?.value
        : field.type === 'url'
          ? 'https://example.com'
          : field.type === 'number'
            ? field.min || '10'
            : 'Valid answer';
  }
  for (const name of ['goal', 'asset', 'revenue', 'tokenizedAssets', 'previousCampaign']) {
    const control = form.querySelector('[name=' + name + ']');
    if (control) control.checked = true;
  }
  w.document.querySelector('#raise-step-next').click();
  assert.equal(w.document.querySelector('#raise-submit-final').hidden, false);
  form.dispatchEvent(new w.Event('submit', { cancelable: true }));
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(submitted.files.length, 0);
  assert.deepEqual(Array.from(submitted.data.documentIds), ['deck']);
  dom.window.close();
  const dbdom = new JSDOM('', { url: 'http://localhost/welcome', runScripts: 'outside-only' }),
    b = dbdom.window;
  let payload,
    uploads = 0;
  const q = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    then(resolve) {
      return Promise.resolve({ data: [{ id: 'deck' }] }).then(resolve);
    },
  };
  b.RafttBackendConfig = {};
  b.supabase = {
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }), onAuthStateChange() {} },
      from: () => q,
      rpc: async (name, args) => {
        payload = args.details;
        return { data: 'ok' };
      },
      storage: {
        from: () => ({
          upload: async () => {
            uploads++;
            return {};
          },
        }),
      },
    }),
  };
  b.eval(fs.readFileSync('assets/js/backend/client.js', 'utf8'));
  const details = { companyId: 'company', deckMethod: 'file', documentIds: ['deck'] };
  await b.RafttBackend.saveApplication(details, []);
  assert.equal(uploads, 0);
  assert.deepEqual(Array.from(payload.documentIds), ['deck']);
  dbdom.window.close();
  console.log(
    'Editing: retained deck permits next step, resubmission keeps document IDs, and no second upload occurs.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
