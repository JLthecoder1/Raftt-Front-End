import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const port = 18765;
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['serve.mjs'], {
  env: { ...process.env, PORT: String(port) },
});
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`Server exited: ${code}`)));
    child.stdout.on('data', (data) => {
      if (data.toString().includes('server ready')) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  const pages = (await readdir('.')).filter((file) => file.endsWith('.html'));
  for (const page of pages) {
    const path = '/' + page.slice(0, -5);
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /<!doctype html>/i);
    const legacy = await fetch(origin + '/' + page + '?test=1', { redirect: 'manual' });
    assert.equal(legacy.status, 308, page);
    assert.equal(legacy.headers.get('location'), path + '?test=1');
  }
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(config.cleanUrls, true);
  for (const redirect of config.redirects) {
    const response = await fetch(origin + redirect.source, { redirect: 'manual' });
    assert.equal(response.status, 308, redirect.source);
    assert.equal(response.headers.get('location'), redirect.destination, redirect.source);
  }
  assert.equal((await fetch(origin + '/assets/images/raftt-symbol.svg')).status, 200);
  assert.equal((await fetch(origin + '/nonexistent-page')).status, 404);
  console.log(`${pages.length} pages, legacy redirects and static asset checks passed.`);
} finally {
  child.kill();
}
