(() => {
  'use strict';
  window.RafttDataConfig ||= { apiBaseUrl: null };
  let generation = 0;
  let companies = [],
    status = 'unconfigured';
  async function refresh() {
    const run = ++generation;
    companies = [];
    if (window.RafttBackend) {
      if (!window.RafttAccountReady) {
        status = 'loading';
        return;
      }
      status = 'loading';
      try {
        const data = window.RafttBackend.fail(
          await window.RafttBackend.db
            .from('companies')
            .select(
              'id,name,description,rounds(id,network,program_id,chain_address,instrument,terms,deadline,milestones(id,sequence,title,description,acceptance_criteria,use_of_funds,deadline,chain_status)),announcements(id,title,body,published_at)',
            ),
        );
        if (run !== generation || !window.RafttAccountReady) return;
        companies = data.map((c) => ({
          ...c,
          milestones: (c.rounds || []).flatMap((r) =>
            (r.milestones || []).map((m) => ({
              ...m,
              executionPlan: m.use_of_funds,
              acceptanceCriteria: m.acceptance_criteria,
              status: m.chain_status,
              dueDate: m.deadline,
            })),
          ),
          documents: (c.rounds || [])
            .filter((r) => r.chain_address)
            .map((r) => ({
              title: r.instrument,
              description: r.terms?.description || '',
              roundId: r.id,
            })),
          updates: (c.announcements || [])
            .filter((a) => a.published_at)
            .map((a) => ({ title: a.title, body: a.body, publishedAt: a.published_at })),
          decisions: (c.rounds || []).flatMap((r) =>
            (r.milestones || [])
              .filter((m) => ['authorized', 'paid'].includes(m.chain_status))
              .map((m) => ({
                title: m.title,
                status: m.chain_status,
                description: m.chain_status === 'paid' ? 'paid' : 'authorized',
              })),
          ),
          offerings: (c.rounds || [])
            .filter((r) => r.chain_address)
            .map((r) => ({
              network: r.network,
              programId: r.program_id,
              address: r.chain_address,
            })),
        }));
        status = 'ready';
      } catch {
        if (run !== generation) return;
        status = 'unavailable';
      }
      window.dispatchEvent(new CustomEvent('raftt:companies-change'));
      return;
    }
    const base = window.RafttDataConfig.apiBaseUrl;
    if (!base) {
      status = 'unconfigured';
      return;
    }
    status = 'loading';
    try {
      const response = await fetch(`${base.replace(/\/$/, '')}/companies`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Company API unavailable');
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(items)) throw new Error('Invalid company response');
      companies = items.filter(
        (x) =>
          x && typeof x.id === 'string' && typeof x.name === 'string' && Array.isArray(x.offerings),
      );
      status = 'ready';
    } catch {
      companies = [];
      status = 'unavailable';
    }
    window.dispatchEvent(new CustomEvent('raftt:companies-change'));
  }
  window.addEventListener?.('raftt:account-ready', refresh);
  window.addEventListener?.('raftt:backend-synced', refresh);
  window.addEventListener?.('raftt:auth-signout', () => {
    generation++;
    companies = [];
    status = 'loading';
    window.dispatchEvent(new CustomEvent('raftt:companies-change'));
  });
  const forRound = (row) =>
    companies.find((company) =>
      (company.offerings || []).some(
        (link) =>
          link.network === window.RafttSolanaConfig.network &&
          link.programId === window.RafttSolanaConfig.programId &&
          link.address === row.address,
      ),
    ) || null;
  window.RafttCompanyData = {
    refresh,
    forRound,
    get status() {
      return status;
    },
    get companies() {
      return companies;
    },
  };
})();
