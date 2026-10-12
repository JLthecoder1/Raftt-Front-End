(() => {
  'use strict';
  const B = window.RafttBackend;
  const cache = new Map(),
    timers = new Map(),
    queues = new Map();
  let generation = 0;
  const key = (user, name) => user + ':' + name;
  const localKey = (user, name) =>
    'raftt-account-draft:' + encodeURIComponent(user) + ':' + encodeURIComponent(name);
  function local(user, name) {
    try {
      return JSON.parse(localStorage.getItem(localKey(user, name)));
    } catch {
      return null;
    }
  }
  async function owner() {
    const user = await B.user();
    if (!window.RafttAccountReady || localStorage.getItem('raftt-cache-owner') !== user.id)
      throw Error(B.t('Entre na sua conta antes de salvar.', 'Sign in before saving.'));
    return user.id;
  }
  function notify(name, status) {
    window.dispatchEvent(new CustomEvent('raftt:draft-status', { detail: { name, status } }));
  }
  async function load(name, fallback) {
    const user = await owner(),
      run = generation;
    const saved = local(user, name);
    const result = await B.db
      .from('workspace_drafts')
      .select('payload,updated_at')
      .eq('user_id', user)
      .eq('workspace_key', name)
      .maybeSingle();
    if (run !== generation) throw Error('Account changed');
    if (result.error) {
      notify(name, 'local');
      if (saved) return saved.payload;
      throw result.error;
    }
    if (saved?.pending) {
      schedule(name, saved.payload);
      return saved.payload;
    }
    if (result.data) {
      cache.set(key(user, name), result.data.payload);
      return result.data.payload;
    }
    return saved?.payload ?? fallback;
  }
  function schedule(name, payload) {
    if (!window.RafttAccountReady) return;
    const user = localStorage.getItem('raftt-cache-owner');
    if (!user) return;
    const k = key(user, name),
      run = generation;
    cache.set(k, JSON.parse(JSON.stringify(payload)));
    localStorage.setItem(localKey(user, name), JSON.stringify({ payload, pending: true }));
    clearTimeout(timers.get(k));
    notify(name, 'saving');
    timers.set(
      k,
      setTimeout(() => {
        const snapshot = cache.get(k);
        const previous = queues.get(k) || Promise.resolve();
        const job = previous
          .catch(() => {})
          .then(async () => {
            if (run !== generation || (await owner()) !== user) return;
            B.fail(
              await B.db.from('workspace_drafts').upsert(
                {
                  user_id: user,
                  workspace_key: name,
                  payload: snapshot,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,workspace_key' },
              ),
            );
            if (run === generation && cache.get(k) === snapshot) {
              localStorage.setItem(
                localKey(user, name),
                JSON.stringify({ payload: snapshot, pending: false }),
              );
              notify(name, 'saved');
            }
          })
          .catch(() => {
            if (run === generation) notify(name, 'local');
          });
        queues.set(k, job);
      }, 800),
    );
  }
  async function remove(name) {
    const user = await owner(),
      k = key(user, name);
    clearTimeout(timers.get(k));
    await queues.get(k)?.catch(() => {});
    B.fail(
      await B.db.from('workspace_drafts').delete().eq('user_id', user).eq('workspace_key', name),
    );
    cache.delete(k);
    localStorage.removeItem(localKey(user, name));
  }
  window.addEventListener('raftt:auth-signout', () => {
    generation++;
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    cache.clear();
    queues.clear();
  });
  window.RafttCloudDrafts = { load, schedule, remove };
})();
