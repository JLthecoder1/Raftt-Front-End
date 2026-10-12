(() => {
  'use strict';
  const rules = {
    avatar: {
      width: 512,
      height: 512,
      maxBytes: 2 * 1024 * 1024,
      bucket: 'profile-avatars',
      column: 'avatar_path',
    },
    logo: {
      width: 512,
      height: 512,
      maxBytes: 2 * 1024 * 1024,
      bucket: 'company-logos',
      column: 'logo_path',
    },
    cover: {
      width: 1600,
      height: 900,
      maxBytes: 5 * 1024 * 1024,
      bucket: 'company-covers',
      column: 'cover_path',
    },
  };
  function validate(file, kind) {
    const rule = rules[kind];
    if (!rule) throw Error('Invalid image type');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('format');
    if (file.size > rule.maxBytes) throw Error('size');
    if (!file.size) throw Error('empty');
    return rule;
  }
  function layout(iw, ih, kind, zoom = 1, x = 0, y = 0) {
    const r = rules[kind],
      scale =
        (kind === 'logo'
          ? Math.min(r.width / iw, r.height / ih) * 0.85
          : Math.max(r.width / iw, r.height / ih)) * zoom;
    const width = iw * scale,
      height = ih * scale;
    const offset = (container, image, pos) =>
      (container - image) / 2 + (pos * Math.abs(container - image)) / 2;
    return { width, height, x: offset(r.width, width, x), y: offset(r.height, height, y) };
  }
  window.RafttImageModel = { rules, validate, layout };
})();
