const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert');
const window = {};
vm.runInNewContext(fs.readFileSync('assets/js/media/image-model.js', 'utf8'), { window });
const M = window.RafttImageModel;
assert.equal(M.validate({ type: 'image/png', size: 100 }, 'avatar').width, 512);
assert.throws(() => M.validate({ type: 'image/svg+xml', size: 100 }, 'logo'), /format/);
assert.throws(
  () => M.validate({ type: 'image/jpeg', size: 2 * 1024 * 1024 + 1 }, 'avatar'),
  /size/,
);
assert.equal(M.validate({ type: 'image/webp', size: 5 * 1024 * 1024 }, 'cover').height, 900);
for (const [w, h] of [
  [2000, 500],
  [500, 2000],
  [512, 512],
]) {
  for (const zoom of [1, 3])
    for (const x of [-1, 0, 1])
      for (const y of [-1, 0, 1]) {
        const a = M.layout(w, h, 'cover', zoom, x, y);
        assert(a.x <= 1e-9 && a.y <= 1e-9);
        assert(a.x + a.width >= 1600 - 1e-9 && a.y + a.height >= 900 - 1e-9);
      }
  const logo = M.layout(w, h, 'logo');
  assert(logo.width <= 512 && logo.height <= 512);
  assert(logo.x >= 0 && logo.y >= 0);
}
const sql = fs.readFileSync('database/002_images.sql', 'utf8');
assert.match(sql, /2097152/);
assert.match(sql, /5242880/);
assert.match(sql, /avatar_own_path/);
assert.match(sql, /company_owner/);
console.log('Image validation, cover crop boundaries, logo containment and bucket limits passed.');
