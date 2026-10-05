(() => {
  'use strict';
  const leaf = location.pathname.split('/').filter(Boolean).pop() || 'welcome';
  window.RafttRoutes = { page: leaf.endsWith('.html') ? leaf : leaf + '.html' };
  const clean = (value) => {
    const url = new URL(value, location.href);
    if (url.origin !== location.origin) return value;
    url.pathname = url.pathname.replace(/\.html$/, '');
    return url.pathname + url.search + url.hash;
  };
  function updateLinks() {
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (/\.html(?:[?#]|$)/.test(href)) link.setAttribute('href', clean(href));
    });
  }
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method].bind(history);
    history[method] = (state, title, url) => original(state, title, url == null ? url : clean(url));
  }
  new MutationObserver(updateLinks).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  document.addEventListener('DOMContentLoaded', updateLinks);
})();
