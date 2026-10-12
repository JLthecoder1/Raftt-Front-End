const { JSDOM } = require('jsdom'),
  fs = require('fs'),
  assert = require('assert/strict');
(async () => {
  async function run(refreshedUser = 'owner', always401 = false) {
    const dom = new JSDOM('', { url: 'http://localhost/admin-review', runScripts: 'outside-only' }),
      w = dom.window;
    let count = 0,
      refresh = 0;
    const tokens = [];
    w.AbortSignal.timeout = AbortSignal.timeout;
    w.RafttApiConfig = { baseUrl: 'http://localhost:3000' };
    w.RafttBackend = {
      t: (pt) => pt,
      fail: (r) => r.data,
      db: {
        auth: {
          getSession: async () => ({
            data: { session: { access_token: 'old', user: { id: 'owner' } } },
          }),
          refreshSession: async () => {
            refresh++;
            return { data: { session: { access_token: 'new', user: { id: refreshedUser } } } };
          },
        },
      },
    };
    w.fetch = async (url, options) => {
      tokens.push(options.headers.Authorization);
      count++;
      return count === 1 || always401
        ? {
            status: 401,
            ok: false,
            json: async () => ({ error: { code: 'unauthorized', message: 'Entre na sua conta.' } }),
          }
        : { status: 200, ok: true, json: async () => ({ data: 'ok' }) };
    };
    w.eval(fs.readFileSync('assets/js/backend/raftt-api.js', 'utf8'));
    if (refreshedUser === 'owner' && !always401)
      assert.equal(await w.RafttApi.request('/v1/me'), 'ok');
    else await assert.rejects(w.RafttApi.request('/v1/me'));
    assert.equal(refresh, 1);
    assert.equal(count, refreshedUser === 'owner' ? 2 : 1);
    if (count === 2) assert.equal(tokens[1], 'Bearer new');
    dom.window.close();
  }
  await run();
  await run('other');
  await run('owner', true);
  console.log(
    'API refresh: expired session renews once, user changes denied, persistent 401 does not loop.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
