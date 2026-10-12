(() => {
  'use strict';
  const prefix = 'raftt-company-draft:';
  const legacy = ['raftt-milestones', 'raftt-demo-round-closed'];
  function key(name) {
    if (!window.RafttAccountReady) return null;
    const owner = localStorage.getItem('raftt-cache-owner');
    if (!owner) return null;
    let company;
    try {
      company = JSON.parse(localStorage.getItem('raftt-company') || '{}');
    } catch {
      return null;
    }
    return (
      prefix +
      encodeURIComponent(owner) +
      ':' +
      encodeURIComponent(company.companyId || 'draft') +
      ':' +
      name
    );
  }
  const cloudName = (name) => {
    let company = {};
    try {
      company = JSON.parse(localStorage.getItem('raftt-company') || '{}');
    } catch {}
    return 'company:' + (company.companyId || 'new') + ':' + name;
  };
  async function hydrate(name, fallback) {
    const path = key(name);
    if (!path || !window.RafttCloudDrafts) return;
    const data = await window.RafttCloudDrafts.load(cloudName(name), read(name, fallback));
    if (key(name) === path) localStorage.setItem(path, JSON.stringify(data));
  }
  function read(name, fallback) {
    const path = key(name);
    if (!path) return fallback;
    try {
      return JSON.parse(localStorage.getItem(path)) ?? fallback;
    } catch {
      return fallback;
    }
  }
  function write(name, value) {
    const path = key(name);
    if (!path) throw Error('Entre na sua conta antes de salvar / Sign in before saving');
    localStorage.setItem(path, JSON.stringify(value));
    window.RafttCloudDrafts?.schedule(cloudName(name), value);
  }
  function remove(name) {
    const path = key(name);
    if (path) localStorage.removeItem(path);
    return window.RafttCloudDrafts?.remove(cloudName(name));
  }
  function clear(owner) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const path = localStorage.key(i);
      if (path?.startsWith(prefix + encodeURIComponent(owner) + ':')) keys.push(path);
    }
    keys.concat(legacy).forEach((path) => localStorage.removeItem(path));
    sessionStorage.removeItem('raftt-fundraising-deleted');
  }
  window.RafttDraftStorage = { key, read, write, remove, clear, hydrate };
})();
