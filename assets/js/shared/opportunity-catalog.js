(() => {
  'use strict';
  const B = window.RafttBackend,
    M = window.RafttCatalogModel;
  const t = (pt, en) => (window.RafttI18n?.lang === 'pt' ? pt : en);
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const columns =
    'id,name,description,sector,website,headquarters,logo_path,cover_path,publication_status,rounds(id,instrument,network,program_id,chain_address,mint,decimals,cap_units,minimum_units,deadline,created_at)';
  async function load(id) {
    await B.user();
    let query = B.db.from('companies').select(columns).eq('publication_status', 'published');
    if (id) query = query.eq('id', id);
    return B.fail(await query.order('created_at', { ascending: false }));
  }
  const roundFor = (company) =>
    (company.rounds || [])
      .filter(
        (r) =>
          r.network === window.RafttSolanaConfig?.network &&
          r.program_id === window.RafttSolanaConfig?.programId,
      )
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
  const amount = (round) => {
    const value = round && M.units(round.cap_units, round.decimals);
    return value === null || value === undefined
      ? t('Não informada', 'Not provided')
      : value + ' ' + t('tokens', 'tokens');
  };
  const safeWebsite = (value) => {
    try {
      const u = new URL(value);
      return ['https:', 'http:'].includes(u.protocol) ? u.href : null;
    } catch {
      return null;
    }
  };
  function card(company, index) {
    const round = roundFor(company);
    return `<article class="card opportunity-card" data-company="${esc(company.id)}"><div class="opportunity-cover ${index % 2 ? 'cover-software' : 'cover-physical'}"><span class="cover-grid"></span><span class="company-mark">${esc(company.name.slice(0, 2))}</span><span class="cover-caption">${esc(company.sector || 'STARTUPS')}</span><span class="cover-status">${t('Empresa publicada', 'Published company')}</span></div><p class="eyebrow">STARTUPS</p><h2>${esc(company.name)}</h2><p class="muted">${esc(company.description)}</p><div class="row"><span>${t('Meta da rodada', 'Round target')}</span><strong>${amount(round)}</strong></div><div class="row"><span>${t('Instrumento', 'Instrument')}</span><strong>${esc(round?.instrument || '—')}</strong></div><div class="actions"><a class="button" href="/opportunity-details?company=${encodeURIComponent(company.id)}">${t('Conhecer o projeto', 'View project')} →</a></div></article>`;
  }
  async function images(companies, root) {
    for (const company of companies) {
      const element = [...root.querySelectorAll('[data-company]')].find(
        (n) => n.dataset.company === company.id,
      );
      if (!element) continue;
      for (const [path, bucket, target] of [
        [company.cover_path, 'company-covers', '.opportunity-cover'],
        [company.logo_path, 'company-logos', '.company-mark'],
      ]) {
        if (!path) continue;
        try {
          const result = B.fail(await B.db.storage.from(bucket).createSignedUrl(path, 3600));
          if (!element.isConnected) break;
          const node = element.querySelector(target);
          if (target === '.company-mark') {
            const img = document.createElement('img');
            img.src = result.signedUrl;
            img.alt = company.name;
            img.style.cssText = 'width:64px;height:64px;object-fit:contain';
            node.replaceChildren(img);
          } else {
            node.style.backgroundImage = `url("${result.signedUrl.replace(/["\\\n\r]/g, '')}")`;
            node.style.backgroundSize = 'cover';
            node.style.backgroundPosition = 'center';
          }
        } catch {
          /* Preserve the initial-based fallback. */
        }
      }
    }
  }
  function mount(categories) {
    const main = document.querySelector('main');
    main.setAttribute('data-i18n-skip', '');
    main.innerHTML = `<div class="top"><div><p class="eyebrow">${t('DESCOBERTA', 'DISCOVERY')}</p><h1>${t('Encontre sua próxima oportunidade', 'Find your next opportunity')}</h1><p class="muted">${t('Conheça as empresas publicadas na RAFTT.', 'Explore companies published on RAFTT.')}</p></div></div><form class="market-filters catalog-filters" id="market-filters" role="search"><div class="field search-field"><label for="market-search">${t('Buscar oportunidades', 'Search opportunities')}</label><input id="market-search" type="search" placeholder="${t('Nome ou setor…', 'Name or sector…')}"></div><div class="field"><label for="market-category">${t('Categoria', 'Category')}</label><select id="market-category"><option value="all">${t('Todas as categorias', 'All categories')}</option>${categories.map((c) => `<option value="${c[0]}">${t(c[1], c[2])}</option>`).join('')}</select></div></form><div class="market-results-top"><p id="market-count" role="status" aria-live="polite"></p><a class="button secondary" href="/map">${t('Explorar pelo mapa', 'Explore the map')} ↗</a></div><div class="grid market-results" id="market-results"></div>`;
    const q = document.getElementById('market-search'),
      cat = document.getElementById('market-category'),
      root = document.getElementById('market-results'),
      count = document.getElementById('market-count');
    const params = new URLSearchParams(location.search);
    q.value = params.get('q') || '';
    cat.value = categories.some((c) => c[0] === params.get('category'))
      ? params.get('category')
      : 'all';
    let companies = [],
      state = 'loading';
    function render() {
      const url = new URL(location.href);
      url.searchParams.delete('status');
      for (const [key, value] of [
        ['q', q.value],
        ['category', cat.value === 'all' ? '' : cat.value],
      ])
        value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
      history.replaceState(null, '', url);
      if (state === 'loading') {
        count.textContent = t('Carregando empresas…', 'Loading companies…');
        root.innerHTML = '';
        return;
      }
      if (state === 'error') {
        count.textContent = '';
        root.innerHTML = `<div class="card empty-results"><h2>${t('Não foi possível carregar as empresas', 'Could not load companies')}</h2><p>${t('Verifique a conexão e entre na sua conta para consultar o catálogo.', 'Check your connection and sign in to view the catalog.')}</p><a class="button secondary" href="/login">${t('Entrar', 'Sign in')}</a><button class="secondary" id="catalog-retry">${t('Tentar novamente', 'Try again')}</button></div>`;
        document.getElementById('catalog-retry').onclick = refresh;
        return;
      }
      const results = M.filter(companies, q.value, cat.value);
      count.textContent = results.length + ' ' + t('empresas encontradas', 'companies found');
      root.innerHTML =
        results.map(card).join('') ||
        `<div class="card empty-results"><h2>${t('Nenhuma empresa encontrada', 'No companies found')}</h2><p>${companies.length ? t('Tente outro termo ou categoria.', 'Try another search or category.') : t('Ainda não há empresas publicadas.', 'There are no published companies yet.')}</p><button class="secondary" id="catalog-clear">${t('Limpar filtros', 'Clear filters')}</button></div>`;
      const clear = document.getElementById('catalog-clear');
      if (clear)
        clear.onclick = () => {
          q.value = '';
          cat.value = 'all';
          render();
        };
      images(results, root);
    }
    async function refresh() {
      state = 'loading';
      render();
      try {
        companies = await load();
        state = 'ready';
      } catch {
        state = 'error';
      }
      render();
    }
    q.oninput = render;
    cat.onchange = render;
    document.getElementById('market-filters').onsubmit = (e) => e.preventDefault();
    refresh();
  }
  async function detail() {
    const id = new URLSearchParams(location.search).get('company');
    if (!id) {
      location.replace('/opportunities');
      return;
    }
    const main = document.querySelector('main');
    main.setAttribute('data-i18n-skip', '');
    main.innerHTML = `<p role="status">${t('Carregando empresa…', 'Loading company…')}</p>`;
    try {
      if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))
        throw Error('Invalid company');
      const [company] = await load(id);
      if (!company) {
        main.innerHTML = `<section class="card"><h1>${t('Empresa indisponível', 'Company unavailable')}</h1><a href="/opportunities">${t('Voltar às oportunidades', 'Back to opportunities')}</a></section>`;
        return;
      }
      const round = roundFor(company),
        website = safeWebsite(company.website);
      main.innerHTML = `<div class="breadcrumb"><a href="/opportunities">← ${t('Oportunidades', 'Opportunities')}</a></div><div class="hero"><p class="eyebrow">STARTUPS</p><h1>${esc(company.name)}</h1><p>${esc(company.description)}</p></div><section class="card"><h2>${t('Informações da empresa', 'Company information')}</h2><div class="row"><span>${t('Setor', 'Sector')}</span><strong>${esc(company.sector || '—')}</strong></div><div class="row"><span>${t('Sede', 'Headquarters')}</span><strong>${esc(company.headquarters || '—')}</strong></div>${website ? `<a href="${esc(website)}" target="_blank" rel="noopener noreferrer">${t('Site da empresa', 'Company website')} ↗</a>` : ''}</section><section class="card" style="margin-top:24px"><h2>${t('Rodada', 'Round')}</h2><div class="row"><span>${t('Meta da rodada', 'Round target')}</span><strong>${amount(round)}</strong></div><div class="row"><span>${t('Instrumento', 'Instrument')}</span><strong>${esc(round?.instrument || '—')}</strong></div><p class="muted">${t('As informações vêm do cadastro da empresa. A disponibilidade para investir precisa ser confirmada no programa Solana.', 'Information comes from company records. Investment availability must be confirmed by the Solana program.')}</p>${round?.chain_address ? `<div id="company-investment"></div><p>${t('Endereço da rodada', 'Round address')}: <code>${esc(round.chain_address)}</code></p><div class="actions"><a class="button" href="/round-v2?round=${encodeURIComponent(round.chain_address)}">${t('Consultar rodada e investir', 'View round and invest')}</a></div>` : `<p>${t('Ainda não há rodada vinculada nesta rede.', 'No round is linked on this network yet.')}</p>`}</section>`;
      if (round?.chain_address)
        window.dispatchEvent(new CustomEvent('raftt:catalog-round', { detail: round }));
    } catch {
      main.innerHTML = `<section class="card"><h1>${t('Não foi possível consultar a empresa', 'Could not load company')}</h1><p>${t('Verifique a conexão e sua sessão.', 'Check your connection and session.')}</p><a href="/opportunities">${t('Voltar às oportunidades', 'Back to opportunities')}</a></section>`;
    }
  }
  window.RafttCatalog = { mount, load, esc };
  if (location.pathname.replace(/\.html$/, '').endsWith('/opportunity-details')) detail();
})();
