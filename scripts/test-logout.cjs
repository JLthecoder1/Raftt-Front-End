const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert/strict');
const source = fs.readFileSync('assets/js/backend/client.js', 'utf8');
const peers = [];
class Channel {
  constructor() {
    peers.push(this);
  }
  postMessage(data) {
    for (const peer of peers) if (peer !== this) peer.onmessage?.({ data });
  }
}
function tab(path, useChannel = true) {
  const listeners = {},
    cache = new Map([
      ['raftt-profile', 'private'],
      ['raftt-cache-owner', 'A'],
    ]);
  const scopes = [];
  let callback,
    session = true,
    cleared = 0,
    disconnected = 0,
    redirect;
  const localStorage = {
    get length() {
      return cache.size;
    },
    key: (i) => [...cache.keys()][i],
    getItem: (k) => cache.get(k) ?? null,
    setItem: (k, v) => cache.set(k, v),
    removeItem: (k) => cache.delete(k),
  };
  const window = {
    RafttAccountReady: true,
    RafttBackendConfig: {},
    addEventListener: (k, f) => (listeners[k] ??= []).push(f),
    dispatchEvent: (e) => {
      for (const f of listeners[e.type] ?? []) f(e);
    },
    RafttChain: {
      disconnect: async () => {
        disconnected++;
      },
    },
    supabase: {
      createClient: () => ({
        auth: {
          onAuthStateChange: (f) => {
            callback = f;
          },
          signOut: async ({ scope }) => {
            scopes.push(scope);
            session = false;
            callback('SIGNED_OUT');
            return { error: null };
          },
          getSession: async () => ({ data: { session: session ? {} : null } }),
        },
      }),
    },
  };
  vm.runInNewContext(source, {
    window,
    localStorage,
    sessionStorage: localStorage,
    Event,
    BroadcastChannel: useChannel ? Channel : undefined,
    document: {
      addEventListener() {},
      body: {
        replaceChildren() {
          cleared++;
        },
      },
    },
    location: {
      pathname: path,
      replace: (p) => {
        redirect = p;
      },
    },
  });
  return {
    window,
    cache,
    scopes,
    listeners,
    loseSession() {
      session = false;
    },
    state: () => ({ cleared, disconnected, redirect }),
  };
}
(async () => {
  const a = tab('/company-dashboard'),
    b = tab('/portfolio'),
    publicTab = tab('/welcome');
  await a.window.RafttBackend.signOut();
  await new Promise((r) => setImmediate(r));
  for (const t of [a, b, publicTab]) {
    assert.equal(t.cache.has('raftt-profile'), false);
    assert.equal(t.window.RafttAccountReady, false);
    assert.equal(t.state().disconnected, 1);
  }
  assert.deepEqual(a.scopes, ['global']);
  assert.deepEqual(b.scopes, ['local']);
  assert.equal(a.state().cleared, 1);
  assert.equal(b.state().redirect, '/login?access=signed-out');
  assert.equal(publicTab.state().redirect, undefined);
  const fallback = tab('/profile', false);
  fallback.listeners.storage[0]({ key: 'raftt-auth-logout', newValue: 'new' });
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(fallback.scopes, ['local']);
  assert.equal(fallback.state().cleared, 1);
  const history = tab('/investor-dashboard', false);
  history.loseSession();
  await history.listeners.pageshow[0]({ persisted: true });
  assert.equal(history.state().redirect, '/login?access=signed-out');
  console.log(
    'Logout: synchronized tabs, storage fallback, private DOM removal, wallet cleanup, public pages and browser history passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
