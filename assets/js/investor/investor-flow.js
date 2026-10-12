(() => {
  'use strict';
  const applicationMain = document.querySelector('main.raise-main');
  const page = window.RafttRoutes.page,
    params = new URLSearchParams(location.search);
  const read = (k, f) => {
      try {
        return JSON.parse(localStorage.getItem(k)) || f;
      } catch {
        return f;
      }
    },
    write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const money = (n) => window.RafttNumbers.money(n);
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const profile = read('raftt-profile', {
    name: window.RafttI18n.lang === 'en' ? 'Explorer' : 'Explorador',
    email: '',
    role: 'investor',
  });
  profile.roles = ['investor', 'organization'];
  profile.activeWorkspace =
    profile.activeWorkspace || (profile.role === 'organization' ? 'organization' : 'investor');
  const company = read('raftt-company', {});
  const t = (pt, en) => (window.RafttI18n.lang === 'en' ? en : pt);
  const link = (file, label, cls = 'button') => `<a class="${cls}" href="${file}">${label}</a>`;
  const heading = (k, title, description) =>
    `<p class="eyebrow">${k}</p><h1>${title}</h1><p class="lead muted">${description}</p>`;
  const glyphs = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4 5-3 5-5 3 3-5 5-3Z',
    wallet: 'M3 6h16v14H3zM3 6V4h14v2M15 10h6v6h-6zM17 13h1',
    chart: 'M4 20V4M4 20h16M8 15l4-5 4 2 4-7',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-2a8 8 0 0 1 16 0v2',
    building: 'M4 21V5h10v16M14 10h6v11M2 21h20M7 9h4M7 13h4M7 17h4',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    switch: 'M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4',
    chevron: 'm8 10 4 4 4-4',
    logout: 'M9 4H4v16h5M9 12h11M16 8l4 4-4 4',
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'm6 6 12 12M6 18 18 6',
    check: 'm5 12 4 4 10-10',
  };
  function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name === 'user' ? '<path d="' + glyphs.user + '"/>' : '<path d="' + (glyphs[name] || glyphs.grid) + '"/>'}</svg>`;
  }
  let content = '';
  if (page === 'account-workspaces.html')
    content =
      heading(
        'BEM-VINDO A BORDO',
        'Uma conta. Novas possibilidades.',
        'Invista em empresas ou apresente uma startup para captar. Sua conta pode investir e captar ao mesmo tempo. Escolha qual área deseja abrir agora.',
      ) +
      `<div class="grid"><a class="card choice" data-role="investor" href="opportunities.html"><span class="symbol">↗</span><p class="eyebrow">SEUS INVESTIMENTOS</p><h2>Explorar e investir</h2><p>Conheça oportunidades, revise documentos e acompanhe cada etapa do seu investimento.</p><strong>Explorar startups →</strong></a><a class="card choice" data-role="organization" href="company-application.html"><span class="symbol">＋</span><p class="eyebrow">SUA EMPRESA</p><h2>Captar e construir</h2><p>Apresente o negócio, organize sua rodada e defina marcos com orçamento e evidências.</p><strong>Apresentar minha empresa →</strong></a></div>`;
  if (page === 'opportunities.html')
    content = '<p role="status">' + t('Carregando empresas…', 'Loading companies…') + '</p>';
  if (page === 'opportunity-details.html')
    content = '<p role="status">' + t('Carregando empresa…', 'Loading company…') + '</p>';
  if (page === 'profile.html') content = window.RafttSettings.render(profile);
  if (page === 'milestone-releases.html')
    content = `<div id="milestone-workspace" data-i18n-skip></div><details class="card" data-i18n-skip style="margin-top:24px"><summary>${t('Detalhes técnicos', 'Technical details')}</summary><p>${t('Acesse o painel técnico para consultar rodadas e instruções do programa Solana.', 'Open the technical panel to inspect rounds and Solana program instructions.')}</p><a href="/round-v2">${t('Abrir painel técnico da Solana', 'Open Solana technical panel')} ↗</a></details>`;
  if (page === 'company-dashboard.html') {
    const submitted = params.get('stage') === 'submitted' || company.status === 'submitted';
    const name = esc(company.companyName || 'Sua empresa');
    content = `<div class="top"><div>${heading('CAPTAÇÃO · ÁREA DA EMPRESA', name, 'Organize a rodada, apresente evidências e acompanhe o capital por etapa.')}</div>${link('company-application.html', company.companyName ? 'Editar apresentação' : 'Apresentar empresa', 'button')}</div><div class="stats company-stats"><div class="card"><small>Meta informada na candidatura</small><strong class="metric">${company.targetRaise ? money(Number(company.targetRaise)) : 'A definir'}</strong></div><div class="card"><small>Capital captado</small><strong class="metric" data-company-raised>—</strong></div><div class="card"><small>Capital liberado</small><strong class="metric" data-company-released>—</strong></div></div><div class="fundraising-status"><span class="badge">${{ submitted: 'Candidatura em análise', reviewing: 'Candidatura em análise', approved: 'Candidatura aprovada', rejected: 'Candidatura rejeitada' }[company.status] || 'Apresentação em preparação'}</span><p>${company.status === 'approved' ? t('Candidatura aprovada. Crie e vincule a rodada abaixo.', 'Application approved. Create and link the round below.') : company.status === 'rejected' ? t('Confira a justificativa da RAFTT e revise sua candidatura.', 'Check the RAFTT rationale and revise your application.') : submitted ? 'Sua candidatura foi salva na sua conta. Acompanhe a revisão da RAFTT abaixo.' : 'Complete os dados da empresa e defina instrumento, orçamento e marcos antes de publicar a rodada.'}</p></div><div class="grid"><section class="card"><p class="eyebrow">01 / ESTRUTURA DA RODADA</p><h2>Seu plano, em um só lugar.</h2><div class="row"><span>Instrumento</span><strong>${esc({ equity: 'Participação societária', safe: 'SAFE', 'convertible-note': 'Conversível' }[company.structure] || company.structure || 'A definir')}</strong></div>${company.structure === 'equity' && company.equityPercentage ? `<div class="row"><span>${window.RafttI18n.lang === 'en' ? 'Company equity offered' : 'Participação da empresa oferecida'}</span><strong>${esc(company.equityPercentage)}%</strong></div>` : ''}<div class="row"><span>Site da empresa</span><strong>${esc(company.website || 'Não informado')}</strong></div><div class="row"><span>Publicação</span><strong>Após aprovação</strong></div><div class="actions">${link('company-application.html', 'Revisar apresentação', 'button secondary')}</div></section><section class="card"><p class="eyebrow">02 / EXECUÇÃO POR MARCOS</p><h2>Planeje cada entrega.</h2><div id="company-milestone-summary" data-i18n-skip></div><p class="muted">As parcelas seguem o plano da rodada. A IA apoia a análise e o responsável autorizado decide a liberação.</p><div class="actions">${link('milestone-releases.html', 'Planejar marcos e orçamento', 'button secondary')}</div></section></div><div class="workspace-note"><div>${icon('switch')}<strong>Também quer investir?</strong><p>Seu portfólio e sua captação coexistem nesta conta.</p></div>${link('investor-dashboard.html', 'Abrir painel de investimentos →', 'button secondary')}</div>`;
  }
  const nav = [
    ['investor-dashboard.html', 'Visão geral', 'grid'],
    ['opportunities.html', 'Oportunidades', 'compass'],
    ['portfolio.html', 'Meu portfólio', 'wallet'],
    ['map.html', 'Explorar mapa', 'compass'],
  ];
  const companyNav = [
    ['company-dashboard.html', 'Minha captação', 'building'],
    ['company-application.html', 'Apresentação da empresa', 'chart'],
    ['milestone-releases.html', 'Marcos e evidências', 'check'],
  ];
  const activeTitle =
    ([
      ...nav,
      ...companyNav,
      ['profile.html', 'Meu perfil'],
      ['account-workspaces.html', 'Áreas da conta'],
      ['opportunity-details.html', 'Detalhes da startup'],
      ['investment-checkout.html', 'Novo aporte'],
    ].find((n) => n[0] === page) || [])[1] || 'Plataforma';
  const navMarkup = (list) =>
    list
      .map(
        ([f, l, i]) =>
          `<a href="${f}" ${f === page ? 'class="active" aria-current="page"' : ''}>${icon(i)}<span>${l}</span>${f === page ? '<i></i>' : ''}</a>`,
      )
      .join('');
  const chainPage = ['investment-checkout.html'].includes(page);
  if (chainPage) content = '<section id="investment-app" data-i18n-skip></section>';
  if (page === 'opportunity-details.html') {
    content += '<section id="investment-app" data-i18n-skip></section>';
  }
  const workspacePage = ['investor-dashboard.html', 'portfolio.html'].includes(page);
  if (workspacePage)
    content = `<div class="top" data-i18n-skip><div><p class="eyebrow">${t('SEU CENTRO DE NAVEGAÇÃO', 'YOUR NAVIGATION CENTER')}</p><h1>${page === 'portfolio.html' ? t('Meu portfólio', 'My portfolio') : t('Olá, ', 'Hello, ') + esc(profile.name) + '.'}</h1><p class="lead muted">${page === 'portfolio.html' ? t('Acompanhe cada investimento e seu próximo passo.', 'Track each investment and its next step.') : t('Uma visão clara dos seus investimentos, saldos e ações.', 'A clear view of your investments, balances and actions.')}</p></div>${link('opportunities.html', t('Explorar oportunidades →', 'Explore opportunities →'))}</div><section id="investor-workspace" data-i18n-skip></section>`;

  const appRoot =
    document.getElementById('app') ||
    document.body.appendChild(Object.assign(document.createElement('div'), { id: 'app' }));
  appRoot.innerHTML = `<div class="app-shell"><button class="menu-scrim" id="menu-scrim" aria-label="Fechar navegação" hidden></button><aside class="app-sidebar" id="app-sidebar"><a class="logo" href="welcome.html"><img src="assets/images/raftt-symbol.svg" alt=""><span>raftt<span class="logo-period">.</span></span></a><div class="workspace-switch"><button id="workspace-trigger" aria-expanded="false" aria-controls="workspace-popover"><span class="workspace-icon">${icon('switch')}</span><span><small>Área de trabalho</small><strong>${page === 'company-dashboard.html' ? 'Captação' : 'Minha conta'}</strong></span>${icon('chevron')}</button><div id="workspace-popover" class="popover" hidden><small>UMA CONTA, DUAS ÁREAS</small><a href="investor-dashboard.html" data-workspace="investor">${icon('wallet')}Investimentos</a><a href="company-dashboard.html" data-workspace="organization">${icon('building')}Captação da empresa</a></div></div><p class="nav-caption">INVESTIR</p><nav aria-label="Investimentos">${navMarkup(nav)}</nav><p class="nav-caption">CAPTAR</p><nav aria-label="Captação">${navMarkup(companyNav)}</nav><div class="sidebar-bottom"><div class="sidebar-note"><span class="status-dot"></span><span>Construindo próximos capítulos.</span></div><a class="account-link" href="profile.html"><span class="avatar">${esc(profile.name.charAt(0).toUpperCase())}</span><span><strong>${esc(profile.name)}</strong><small>Investidor & empresa</small></span>${icon('chevron')}</a></div></aside><div class="app-body"><header class="app-topbar"><div class="topbar-location"><button id="mobile-menu" class="icon-button" aria-label="Abrir navegação" aria-expanded="false" aria-controls="app-sidebar">${icon('menu')}</button><span class="topbar-brand">Plataforma</span><span class="slash">/</span><strong>${activeTitle}</strong></div><div class="topbar-actions"><select id="app-language" aria-label="Language"><option value="en">EN</option><option value="pt">PT</option></select><span class="demo-label"><span class="status-dot"></span>RAFTT</span><div class="account-menu"><button class="avatar account-trigger" id="account-trigger" aria-expanded="false" aria-controls="account-popover" aria-label="Abrir menu da conta">${esc(profile.name.charAt(0).toUpperCase())}</button><div id="account-popover" class="popover" hidden><strong>${esc(profile.name)}</strong><small>INVESTIR E CAPTAR</small><a href="profile.html">${icon('user')}Perfil e preferências</a><a href="account-workspaces.html">${icon('switch')}Áreas da conta</a><a href="login.html" id="logout">${icon('logout')}Sair da sessão</a></div></div></div></header><main data-page="${page}">${content}<p class="notice">As informações da conta são salvas no banco. As transações usam a rede e o token indicados na rodada.</p></main><footer><span>RAFTT / Infraestrutura para ativos privados</span><span>Signals. Milestones. Progress.</span></footer></div></div>`;
  document.getElementById('app-language').value = window.RafttI18n.lang;
  document.getElementById('app-language').onchange = (e) => window.RafttI18n.change(e.target.value);
  if (applicationMain) {
    const host = appRoot.querySelector('main');
    host.replaceChildren(...applicationMain.childNodes);
    applicationMain.remove();
    document.querySelector('.raise-header')?.remove();
    document.querySelector('.raise-footer')?.remove();
  }
  function togglePopover(id, trigger) {
    const el = document.getElementById(id);
    el.hidden = !el.hidden;
    trigger.setAttribute('aria-expanded', String(!el.hidden));
  }
  document.getElementById('workspace-trigger').onclick = (e) =>
    togglePopover('workspace-popover', e.currentTarget);
  document.getElementById('account-trigger').onclick = (e) =>
    togglePopover('account-popover', e.currentTarget);
  function closeMenus() {
    ['workspace', 'account'].forEach((id) => {
      document.getElementById(id + '-popover').hidden = true;
      document.getElementById(id + '-trigger').setAttribute('aria-expanded', 'false');
    });
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.workspace-switch') && !e.target.closest('.account-menu')) closeMenus();
  });
  function mobileMenu(open) {
    document.getElementById('app-sidebar').classList.toggle('is-open', open);
    document.getElementById('menu-scrim').hidden = !open;
    document.getElementById('mobile-menu').setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }
  document.getElementById('mobile-menu').onclick = () =>
    mobileMenu(!document.getElementById('app-sidebar').classList.contains('is-open'));
  document.getElementById('menu-scrim').onclick = () => mobileMenu(false);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenus();
      mobileMenu(false);
      document.getElementById('mobile-menu').focus();
    }
  });
  document.querySelectorAll('[data-workspace]').forEach(
    (a) =>
      (a.onclick = () => {
        profile.activeWorkspace = a.dataset.workspace;
        write('raftt-profile', profile);
      }),
  );
  // Art direction for the two areas: outlined orbital navigation and rising capital.
  const illustration = (kind) =>
    `<svg class="choice-illustration" viewBox="0 0 400 190" fill="none" aria-hidden="true">${kind === 'invest' ? '<circle cx="205" cy="100" r="68"/><ellipse cx="205" cy="100" rx="110" ry="40" transform="rotate(-25 205 100)"/><ellipse cx="205" cy="100" rx="110" ry="40" transform="rotate(35 205 100)"/><path d="M137 100h136M205 32v136"/><circle class="solid" cx="205" cy="100" r="8"/><circle class="accent" cx="276" cy="50" r="7"/><circle class="accent" cx="132" cy="151" r="5"/>' : '<path d="M120 145h180M140 145V98h30v47M188 145V69h30v76M236 145V39h30v106M134 71l45-24 36 3 60-31"/><circle class="accent" cx="275" cy="19" r="6"/><path d="M107 166h211"/>'}</svg>`;
  document.querySelectorAll('.choice').forEach((c, index) => {
    c.classList.add(index ? 'choice-raise' : 'choice-invest');
    c.querySelector('.symbol').outerHTML = illustration(index ? 'raise' : 'invest');
    c.querySelector('strong').insertAdjacentHTML('beforeend', icon('arrow'));
  });
  if (page === 'company-dashboard.html') {
    document
      .querySelector('main .notice')
      ?.insertAdjacentHTML(
        'beforebegin',
        `<section class="card" data-i18n-skip><h2>${t('Captação vinculada à empresa', 'Company-linked fundraising')}</h2><p>${t('Abra a rodada vinculada à sua empresa para consultar a captação e aprovar transações. Conectar uma carteira não seleciona uma empresa automaticamente.', 'Open the round linked to your company to review fundraising and sign transactions. Connecting a wallet does not select a company automatically.')}</p>${link('#company-chain-rounds', t('Abrir rodadas cadastradas abaixo', 'Open registered rounds below'))}</section>`,
      );
  }
  if (!chainPage && page === 'investor-dashboard.html') {
    document
      .querySelector('main .top')
      ?.insertAdjacentHTML(
        'afterend',
        `<section class="editorial-banner"><div><p class="eyebrow">PRIVATE MARKETS / OPEN HORIZONS</p><h2>Capital que acompanha<br>o próximo capítulo.</h2><p>Descubra startups e acompanhe sua execução, marco a marco.</p>${link('opportunities.html', 'Conhecer startups ' + icon('arrow'), 'button')}</div><div class="orbital-art">${illustration('invest')}<span>Explore. Invest. Follow.</span></div></section>`,
      );
  }
  document.querySelectorAll('main .card').forEach((card, i) => {
    card.style.setProperty('--enter-delay', `${Math.min(i * 35, 180)}ms`);
  });
  document.getElementById('logout').onclick = () => {
    sessionStorage.removeItem('raftt-demo-session');
  };
  document.querySelectorAll('[data-role]').forEach(
    (a) =>
      (a.onclick = () => {
        profile.activeWorkspace = a.dataset.role;
        profile.roles = ['investor', 'organization'];
        write('raftt-profile', profile);
        window.RafttBackend?.saveProfile(profile).catch(() => {});
      }),
  );
  if (page === 'profile.html') window.RafttSettings.init(profile);
  if (workspacePage) {
    document.querySelector('main > .notice')?.remove();
    return;
  }
  if (chainPage) {
    document.querySelector('main > .notice')?.remove();
    document.querySelector('.demo-label').textContent =
      'Solana · ' + (window.RafttSolanaConfig?.network || 'localnet');
    return;
  }
})();
