(() => {
  'use strict';
  const cfg = window.RafttBackendConfig;
  const db = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const t = (pt, en) => (localStorage.getItem('raftt-lang') === 'en' ? en : pt);
  const fail = (result) => {
    if (result.error) throw result.error;
    return result.data;
  };
  const ownedKeys = ['raftt-profile', 'raftt-company', 'raftt-investments', 'raftt-release'];
  function clearCache() {
    window.RafttAccountReady = false;
    const owner = localStorage.getItem('raftt-cache-owner');
    const draftKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        owner &&
        (key?.startsWith('raftt-company-draft:' + encodeURIComponent(owner) + ':') ||
          key?.startsWith('raftt-account-draft:' + encodeURIComponent(owner) + ':'))
      )
        draftKeys.push(key);
    }
    draftKeys.forEach((key) => localStorage.removeItem(key));
    ['raftt-milestones', 'raftt-demo-round-closed'].forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem('raftt-fundraising-deleted');
    ownedKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('raftt-cache-owner');
    sessionStorage.removeItem('raftt-demo-session');
    sessionStorage.removeItem('raftt-wallet-provider');
  }
  async function user() {
    const data = fail(await db.auth.getUser());
    if (!data.user) throw Error(t('Entre na sua conta.', 'Sign in to your account.'));
    return data.user;
  }
  async function hydrate() {
    const current = await user();
    if (localStorage.getItem('raftt-cache-owner') !== current.id) clearCache();
    const p = fail(await db.from('profiles').select('*').eq('id', current.id).single());
    const profile = {
      ...p.settings,
      name: p.name,
      avatarPath: p.avatar_path || null,
      email: current.email,
      language: p.language,
      roles: ['investor', 'organization'],
    };
    if (logoutHandled) throw Error('Session ended');
    localStorage.setItem('raftt-profile', JSON.stringify(profile));
    localStorage.setItem('raftt-cache-owner', current.id);
    const companies = fail(
      await db
        .from('companies')
        .select('id')
        .eq('owner_id', current.id)
        .order('created_at', { ascending: false })
        .limit(1),
    );
    if (companies.length) {
      const apps = fail(
        await db
          .from('company_applications')
          .select('payload,status')
          .eq('company_id', companies[0].id)
          .order('version', { ascending: false })
          .limit(1),
      );
      if (logoutHandled) throw Error('Session ended');
      if (apps.length)
        localStorage.setItem(
          'raftt-company',
          JSON.stringify({
            ...apps[0].payload,
            companyId: companies[0].id,
            status: apps[0].status,
          }),
        );
      else localStorage.removeItem('raftt-company');
    } else {
      if (logoutHandled) throw Error('Session ended');
      localStorage.removeItem('raftt-company');
    }
    return profile;
  }
  async function saveProfile(p) {
    const current = await user();
    const { name, email, language, avatarPath, ...settings } = p;
    // Account email and password are managed exclusively by Auth.
    fail(
      await db
        .from('profiles')
        .update({
          name,
          language: localStorage.getItem('raftt-lang') === 'en' ? 'en' : 'pt',
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id),
    );
  }
  async function saveApplication(details, files) {
    const current = await user();
    let cid = details.companyId;
    if (!cid) {
      const c = fail(
        await db
          .from('companies')
          .insert({
            owner_id: current.id,
            name: details.companyName || details.name || 'Startup',
            description: details.businessDescription || '',
          })
          .select('id')
          .single(),
      );
      cid = c.id;
      // Keep the company ID if subsequent uploads fail, allowing a safe retry.
      localStorage.setItem('raftt-company', JSON.stringify({ ...details, companyId: cid }));
    }
    const documents = [];
    if (!files.length && details.deckMethod === 'file') {
      const retained = [...new Set(details.documentIds || [])];
      if (!retained.length)
        throw Error(
          t(
            'Selecione um deck ou mantenha o arquivo salvo.',
            'Select a deck or keep the saved file.',
          ),
        );
      const rows = fail(
        await db.from('documents').select('id').eq('company_id', cid).in('id', retained),
      );
      if (rows.length !== retained.length)
        throw Error(
          t(
            'O deck salvo não pertence a esta empresa ou está indisponível.',
            'The saved deck does not belong to this company or is unavailable.',
          ),
        );
      documents.push(...rows.map((row) => row.id));
    }
    for (const file of files) {
      const path = `${cid}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fail(await db.storage.from('company-private').upload(path, file, { upsert: false }));
      const doc = fail(
        await db
          .from('documents')
          .insert({
            company_id: cid,
            uploaded_by: current.id,
            object_path: path,
            name: file.name,
            kind: 'application',
          })
          .select('id')
          .single(),
      );
      documents.push(doc.id);
    }
    fail(
      await db.rpc('submit_company_application', {
        cid,
        details: {
          ...details,
          language: localStorage.getItem('raftt-lang') === 'en' ? 'en' : 'pt',
          companyId: cid,
          documentIds: documents,
        },
      }),
    );
    details.documentIds = documents;
    return cid;
  }
  const logoutKey = 'raftt-auth-logout';
  const protectedPages = new Set([
    'map',
    'profile',
    'user-profile',
    'account-workspaces',
    'investor-dashboard',
    'portfolio',
    'company-dashboard',
    'company-application',
    'milestone-releases',
    'admin-review',
    'investment-checkout',
    'round-v2',
  ]);
  let logoutHandled = false;
  let channel;
  try {
    if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel('raftt-auth');
  } catch {}
  function endSession(broadcast = false) {
    if (logoutHandled) return;
    logoutHandled = true;
    clearCache();
    if (broadcast) {
      const signal = String(Date.now()) + ':' + Math.random();
      try {
        localStorage.setItem(logoutKey, signal);
      } catch {}
      try {
        channel?.postMessage({ type: 'logout' });
      } catch {}
    }
    window.dispatchEvent(new Event('raftt:auth-signout'));
    Promise.resolve()
      .then(() => window.RafttChain?.disconnect())
      .catch(() => {});
    const page = location.pathname
      .replace(/\.html$/, '')
      .split('/')
      .pop();
    if (protectedPages.has(page)) {
      // Remove account data immediately, including pages restored from browser history.
      document.body?.replaceChildren();
      location.replace('/login?access=signed-out');
    }
  }
  function remoteLogout() {
    if (logoutHandled) return;
    endSession(false);
    // Clear this tab's cached auth state; server-wide revocation is performed by the initiating tab.
    db.auth.signOut({ scope: 'local' }).catch(() => {});
  }
  window.addEventListener('storage', (event) => {
    if (event.key === logoutKey && event.newValue) remoteLogout();
  });
  if (channel)
    channel.onmessage = (event) => {
      if (event.data?.type === 'logout') remoteLogout();
    };
  window.addEventListener('pageshow', async (event) => {
    if (!event.persisted) return;
    const result = await db.auth.getSession();
    if (!result.data?.session) endSession(false);
  });
  async function signOut() {
    const pending = db.auth.signOut({ scope: 'global' });
    endSession(true);
    const result = await pending;
    if (result.error) {
      await db.auth.signOut({ scope: 'local' });
      throw result.error;
    }
  }
  document.addEventListener(
    'click',
    async (event) => {
      if (!event.target.closest?.('#logout,[data-demo-sign-out]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        await signOut();
      } catch {
        /* Local session is already cleared. */
      }
      location.replace('/login?access=signed-out');
    },
    true,
  );
  window.RafttBackend = {
    db,
    user,
    hydrate,
    saveProfile,
    saveApplication,
    signOut,
    isSignedOut: () => logoutHandled,
    t,
    fail,
  };
  db.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') logoutHandled = false;
    if (event === 'SIGNED_OUT') endSession(true);
  });
})();
