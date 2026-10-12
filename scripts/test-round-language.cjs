const { JSDOM } = require('jsdom'),
  fs = require('fs'),
  assert = require('assert/strict');
(async () => {
  const dom = new JSDOM(fs.readFileSync('round-v2.html', 'utf8'), {
      url: 'http://localhost/round-v2',
      runScripts: 'outside-only',
    }),
    w = dom.window;
  w.localStorage.setItem('raftt-lang', 'en');
  w.eval(fs.readFileSync('assets/js/solana/round-language.js', 'utf8'));
  assert.equal(w.document.querySelector('h1').textContent, 'Rounds and milestone releases');
  assert.equal(w.document.querySelector('#connect').textContent, 'Connect');
  const panel = w.document.querySelector('#round-details');
  panel.innerHTML =
    '<h3>Captação aberta</h3><label>Valor do aporte ou cancelamento<input value="10.5"></label><textarea>Documento original</textarea>';
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(panel.querySelector('h3').textContent, 'Fundraising open');
  assert.equal(panel.querySelector('input').value, '10.5');
  assert.equal(panel.querySelector('textarea').value, 'Documento original');
  w.document.querySelector('#round-language').value = 'pt';
  w.document.querySelector('#round-language').dispatchEvent(new w.Event('change'));
  assert.equal(panel.querySelector('h3').textContent, 'Captação aberta');
  assert.equal(w.document.querySelector('#connect').textContent, 'Conectar');
  dom.window.close();
  console.log(
    'Round language: PT/EN static and dynamic labels, persistence, and unchanged transaction values/documents passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
