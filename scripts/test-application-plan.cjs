const { JSDOM } = require('jsdom'),
  fs = require('fs'),
  assert = require('assert/strict');
(async () => {
  const dom = new JSDOM('<div id="milestone-workspace"></div>', {
      url: 'http://localhost/milestone-releases?setup=application',
      runScripts: 'outside-only',
    }),
    w = dom.window;
  w.RafttAccountReady = true;
  let items = [],
    saved;
  w.localStorage.setItem(
    'raftt-company',
    JSON.stringify({
      companyId: 'company',
      deckMethod: 'file',
      documentIds: ['deck'],
      targetRaise: '1000',
    }),
  );
  w.RafttDraftStorage = { read: () => items };
  w.RafttBackend = {
    t: (pt) => pt,
    hydrate: async () => {},
    saveApplication: async (application, files) => {
      saved = { application, files };
    },
  };
  w.eval(fs.readFileSync('assets/js/company/application-plan.js', 'utf8'));
  const button = w.document.querySelector('#application-plan-submit');
  await button.onclick();
  assert(!saved);
  assert(w.document.body.textContent.includes('pelo menos uma meta'));
  items = [
    {
      title: 'Pilot',
      complete: true,
      deliverable: 'Install hub',
      criteria: 'Verified logs',
      deadline: '2027-01-01',
      costs: [{ description: 'Hub', quantity: 1, unitCost: 500 }],
    },
  ];
  await button.onclick();
  assert.equal(saved.application.milestones[0].title, 'Pilot');
  assert.equal(saved.application.milestones[0].budgetCurrency, 'USD');
  assert.equal(saved.application.milestones[0].status, 'planned');
  assert.equal(saved.application.documentIds[0], 'deck');
  assert.equal(saved.files.length, 0);
  assert(
    fs
      .readFileSync('assets/js/company/application-form.js', 'utf8')
      .includes("location.assign('/milestone-releases?setup=application')"),
  );
  dom.window.close();
  console.log(
    'Application plan: empty plans blocked; structured milestones submitted with existing deck in a new application version.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
