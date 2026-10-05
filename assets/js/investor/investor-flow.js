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
    }),
    investments = read('raftt-investments', []);
  profile.roles = ['investor', 'organization'];
  profile.activeWorkspace =
    profile.activeWorkspace || (profile.role === 'organization' ? 'organization' : 'investor');
  const company = read('raftt-company', {});
  const projects = {
    nullun: {
      name: 'NULLUN',
      description:
        'Inteligência operacional para conectar sinais de sensores, equipamentos e sistemas.',
      min: 250,
    },
    nexo: {
      name: 'Nexo Software',
      description:
        'Software para organizar a operação e o relacionamento com clientes de pequenas empresas.',
      min: 250,
    },
  };
  const id = Object.hasOwn(projects, params.get('opportunity'))
      ? params.get('opportunity')
      : 'nullun',
    project = projects[id];
  const t = (pt, en) => (window.RafttI18n.lang === 'en' ? en : pt);
  // Explicit demo offer: startup terms remain fixed as the investor changes their principal.
  const offer = Object.freeze({
    instrument: 'equity',
    roundTarget: 100000,
    startupEquityPercent: 10,
    companyFeePercent: 7,
    version: 'demo-equity-v1',
  });
  const percent = (value, digits = 2) =>
    new Intl.NumberFormat(window.RafttI18n.lang === 'en' ? 'en-US' : 'pt-BR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value) + '%';
  const offerDetails = () =>
    `<section class="card offer-terms" data-i18n-skip><p class="eyebrow">${t('CONDIÇÕES DA RODADA · EXEMPLO', 'ROUND TERMS · EXAMPLE')}</p><h2>${t('O que a startup oferece ao veículo', 'What the startup offers the vehicle')}</h2><div class="row"><span>${t('Empresa emissora', 'Issuing company')}</span><strong>${esc(project.name)}</strong></div><div class="row"><span>${t('Instrumento oferecido', 'Offered instrument')}</span><strong>${t('Participação societária (equity)', 'Equity')}</strong></div><div class="row"><span>${t('Investidor na startup', 'Investor in the startup')}</span><strong>${t('Veículo coletivo da rodada (SPV)', 'Round investment vehicle (SPV)')}</strong></div><div class="row"><span>${t('Meta bruta da rodada', 'Gross round target')}</span><strong>${money(offer.roundTarget)}</strong></div><div class="row"><span>${t('Participação da startup oferecida ao veículo', 'Startup ownership offered to the vehicle')}</span><strong>${percent(offer.startupEquityPercent)}</strong></div><p>${t('No fechamento ilustrativo, o veículo investe US$ 100.000 e recebe 10% da startup. Essa porcentagem é uma condição da oferta e não aumenta quando você altera seu aporte.', 'At illustrative closing, the vehicle invests US$100,000 and receives 10% of the startup. This percentage is an offer term and does not increase when you change your investment.')}</p><details><summary>${t('Fechamento, taxas e direitos', 'Closing, fees and rights')}</summary><p>${t('Participação estimada até o fechamento da rodada e a confirmação dos aportes. Comissão da empresa: 7% da captação, com US$ 93.000 líquidos neste exemplo. A taxa adicional do investidor não compra participação. Direitos de representação e decisões seguem o mandato e os contratos do veículo; liberações seguem os marcos aprovados.', 'Ownership is estimated until round closing and payment confirmation. Company commission: 7% of funds raised, leaving US$93,000 net in this example. The additional investor fee does not buy ownership. Representation and decisions follow the vehicle mandate and agreements; releases follow approved milestones.')}</p><p>${t('Equity via veículo: você participa do veículo e tem exposição econômica indireta à startup. Não é uma participação direta. Em ofertas SAFE ou conversíveis, a participação futura depende das condições de conversão e não deve aparecer como equity atual.', 'Equity through a vehicle: you participate in the vehicle and hold indirect economic exposure to the startup. For SAFE or convertible offers, future ownership depends on conversion terms and must not be shown as current equity.')}</p><p>${t('Oferta fictícia do MVP. Nenhum contrato real foi disponibilizado ou assinado. Diluição, custos e condições contratuais podem alterar os direitos finais; não há retorno garantido.', 'Fictional MVP offer. No real agreement has been provided or signed. Dilution, costs and contractual terms may change final rights; returns are not guaranteed.')}</p></details></section>`;
  const link = (file, label, cls = 'button') => `<a class="${cls}" href="${file}">${label}</a>`;
  const route = `opportunity-details.html?opportunity=${id}`,
    checkout = `investment-checkout.html?opportunity=${id}`;
  const fee = (a) =>
    Math.min(
      250,
      Math.round(
        (Math.min(a, 1000) * 0.025 +
          Math.min(Math.max(a - 1000, 0), 4000) * 0.02 +
          Math.max(a - 5000, 0) * 0.015) *
          100,
      ) / 100,
    );
  const labels = {
    pending: 'Pagamento pendente',
    confirmed: 'Aporte confirmado',
    failed: 'Pagamento falhou',
    consolidated: 'Participação consolidada',
    cancelled: 'Cancelado',
  };
  const totals = investments
    .filter((i) => ['confirmed', 'consolidated'].includes(i.status))
    .reduce((n, i) => n + i.amount, 0);
  const stats = () =>
    `<div class="stats"><div class="card"><small>Aportes confirmados</small><strong class="metric">${money(totals)}</strong></div><div class="card"><small>Projetos na carteira</small><strong class="metric">${new Set(investments.filter((i) => ['confirmed', 'consolidated'].includes(i.status)).map((i) => i.project)).size}</strong></div><div class="card"><small>Capital liberado · sua parcela</small><strong class="metric">${money(investments.filter((i) => i.status === 'consolidated').reduce((n, i) => n + i.amount * 0.93 * (i.project === 'nullun' && read('raftt-release', {}).executed ? 0.25 : 0), 0))}</strong></div><div class="card"><small>Saldo reservado · sua parcela</small><strong class="metric">${money(investments.filter((i) => i.status === 'consolidated').reduce((n, i) => n + i.amount * 0.93 * (i.project === 'nullun' && read('raftt-release', {}).executed ? 0.75 : 1), 0))}</strong></div><div class="card"><small>Ações pendentes</small><strong class="metric">${investments.filter((i) => ['pending', 'failed'].includes(i.status)).length}</strong></div></div>`;
  const heading = (k, t, d) =>
    `<p class="eyebrow">${k}</p><h1>${t}</h1><p class="lead muted">${d}</p>`;
  const milestones = () =>
    `<div class="step"><h3>01 · Início da execução</h3><span class="badge">25% do orçamento</span><p>Condição: rodada fechada e orçamento aprovado. Uso: desenvolvimento e contratações.</p></div><div class="step"><h3>02 · Produto funcional</h3><span class="badge">25% do orçamento</span><p>Condição: demonstração funcional e relatório técnico. Uso: executar pilotos.</p></div><div class="step"><h3>03 · Pilotos comprovados</h3><span class="badge">25% do orçamento</span><p>Condição: resultados dos pilotos e registros de uso. Uso: expansão da operação.</p></div><div class="step"><h3>04 · Marco comercial</h3><span class="badge">25% do orçamento</span><p>Condição: contratos e receita comprovada. Uso: próxima fase de crescimento.</p></div>`;
  const table = () =>
    investments.length
      ? `<div class="tablewrap"><table><thead><tr><th>Projeto</th><th>Aporte</th><th>Taxa</th><th>Estado</th><th>Próximo passo</th></tr></thead><tbody>${investments.map((i) => `<tr><td>${esc(projects[i.project]?.name || i.project)}</td><td>${money(i.amount)}</td><td>${money(i.fee)}</td><td><span class="badge">${labels[i.status]}</span></td><td>${['pending', 'failed'].includes(i.status) ? link('investment-checkout.html?opportunity=' + i.project + '&investment=' + i.key, 'Continuar', 'button secondary') : link('portfolio.html?investment=' + i.key, 'Acompanhar', 'button secondary')}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="card"><h2>Sua primeira expedição começa aqui</h2><p class="muted">Você ainda não possui aportes. Explore as startups, leia as condições e simule sua participação.</p>${link('opportunities.html', 'Explorar oportunidades')}</div>`;
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
    content =
      heading(
        'DESCUBERTA',
        'Encontre sua próxima oportunidade',
        'O MVP demonstra investimentos em startups. As demais ilhas representam categorias futuras.',
      ) +
      `<div class="top"><span class="badge">Startups · 2 casos fictícios</span>${link('map.html', 'Explorar pelo mapa', 'button secondary')}</div><div class="grid">${Object.entries(
        projects,
      )
        .map(
          ([key, p]) =>
            `<article class="card"><p class="eyebrow">STARTUP · PARTICIPAÇÃO SOCIETÁRIA</p><h2>${p.name}</h2><p class="muted">${p.description}</p><div class="row"><span>Meta da rodada</span><strong>US$ 100.000</strong></div><div class="row"><span>Mínimo · demo</span><strong>${money(p.min)}</strong></div><div class="row"><span>Plano de execução</span><strong>4 marcos</strong></div><div class="actions">${link('opportunity-details.html?opportunity=' + key, 'Conhecer o projeto →')}</div></article>`,
        )
        .join('')}</div>`;
  if (page === 'opportunity-details.html')
    content = `<div class="breadcrumb">${link('opportunities.html', '← Oportunidades', '')} / ${project.name}</div><div class="hero"><p class="eyebrow">STARTUPS · CASO FICTÍCIO</p><h1>${project.name}</h1><p>${project.description}</p></div>${offerDetails()}<div class="split" style="margin-top:24px"><section class="card"><h2>Plano de execução</h2>${milestones()}<h2 style="margin-top:28px">Informações e documentos</h2><details><summary>Resumo do negócio · declaração da empresa</summary><p>${project.description} Plano ilustrativo: concluir produto, realizar pilotos e converter clientes pagantes.</p></details><details><summary>Condições da rodada · documento de exemplo</summary><p>Meta US$ 100.000. Veículo adquire 10% da startup. Participação proporcional ao principal consolidado. Comissão da empresa: 7% no fechamento; capital líquido US$ 93.000. Cada marco financia 25% do orçamento líquido, US$ 23.250.</p></details><details><summary>Riscos e direitos · documento de exemplo</summary><p>Possibilidade de perda integral, diluição, baixa liquidez e atrasos de execução. A participação é indireta por veículo; não há retorno garantido. Em conversíveis, os direitos dependem da conversão.</p></details><details><summary>Análise por IA · exemplo ilustrativo</summary><p>Fonte: plano demonstrativo desta página. Lacunas: não há balanços, contratos ou testes reais. A IA organiza informações; o responsável autorizado decide as liberações.</p></details></section><aside class="card"><span class="badge">Captação · simulação</span><h2 style="margin-top:18px">Condições claras antes do aporte</h2><div class="row"><span>Meta bruta</span><strong>US$ 100.000</strong></div><div class="row"><span>Instrumento</span><strong>Equity · veículo</strong></div><div class="row"><span>Participação do veículo</span><strong>10%</strong></div><div class="row"><span>Mínimo</span><strong>${money(project.min)}</strong></div><p class="muted">Taxa do investidor por faixas, limitada a US$ 250 por rodada. Comissão da empresa: 7%.</p>${link(checkout, 'Simular investimento →')}<p><small>A participação se consolida somente no fechamento da rodada.</small></p></aside></div>`;
  if (page === 'investment-checkout.html')
    content =
      `<div class="breadcrumb">${link(route, '← Voltar ao projeto', '')} / Aporte / Confirmação</div>` +
      heading(
        project.name + ' · APORTE SIMULADO',
        'Revise e confirme seu aporte',
        'O valor principal, as taxas e os direitos ficam visíveis antes da confirmação.',
      ) +
      `${offerDetails()}<div class="split" style="margin-top:24px"><section class="card"><h2>1. Defina sua participação</h2><form id="invest-form"><label for="amount">Aporte em USD</label><input id="amount" type="number" min="250" max="100000" step="1" value="1000" required><small>Mínimo US$ 250 · máximo US$ 100.000 no exemplo.</small>${window.RafttSettings.entitySelect(profile)}<label for="payment">Forma de pagamento · teste</label><select id="payment">${(profile.paymentMethods || []).map((m) => `<option value="${esc(m.id)}">${esc(m.name)} · ${window.RafttI18n.lang === 'en' ? 'test' : 'teste'}</option>`).join('')}<option>USDC · Solana (simulado)</option><option>Saldo de demonstração</option></select><h2 style="margin-top:24px">2. Revise as condições</h2><label class="check"><input type="checkbox" id="terms" required>Li as condições e os riscos. Entendo que este aporte é uma simulação.</label><button id="confirm">Confirmar aporte simulado</button></form><div id="outcomes" hidden><p role="status">Aporte registrado. Pagamento pendente.</p><div class="actions"><button data-outcome="confirmed">Simular pagamento confirmado</button><button class="danger" data-outcome="failed">Simular falha</button></div></div><p id="result" role="status" aria-live="polite"></p><div class="actions">${link('portfolio.html', 'Ver meu portfólio', 'button secondary')}</div></section><aside class="card"><h2>Resumo do aporte</h2><div class="row"><span>Projeto</span><strong>${project.name}</strong></div><div class="row"><span>Principal</span><strong id="principal"></strong></div><div class="row"><span>Taxa adicional</span><strong id="fee"></strong></div><div class="row"><span>Total</span><strong id="total"></strong></div><h3 data-i18n-skip>${t('O que você recebe pelo veículo', 'What you receive through the vehicle')}</h3><p id="rights" class="muted" data-i18n-skip></p><details open><summary>Taxa por faixas</summary><p>2,5% nos primeiros US$ 1.000; 2% entre US$ 1.000 e US$ 5.000; 1,5% no excedente. Teto de US$ 250 por investidor nesta rodada.</p></details><small>Verificações de produção serão integradas depois. Nenhum pagamento real é executado.</small></aside></div>`;
  if (page === 'investor-dashboard.html')
    content =
      `<div class="top"><div>${heading('SEU CENTRO DE NAVEGAÇÃO', 'Olá, ' + esc(profile.name) + '.', 'Acompanhe seus aportes, as pendências e a execução das empresas.')}</div>${link('opportunities.html', 'Explorar oportunidades →')}</div>` +
      stats() +
      `<div class="grid"><section class="card"><h2>Próximos passos</h2><p>Aportes pendentes precisam de confirmação. Aportes confirmados aguardam o fechamento da rodada para consolidar a participação.</p>${link('portfolio.html', 'Abrir carteira', 'button secondary')}</section><section class="card"><h2>Marcos e liberações</h2><p>As evidências passam por revisão. Aprovação autoriza a execução; só uma execução confirmada registra capital liberado.</p>${link('milestone-releases.html', 'Acompanhar demonstração', 'button secondary')}</section></div><section style="margin-top:24px"><h2>Seus investimentos</h2>${table()}</section>`;
  if (page === 'portfolio.html') {
    const selected = investments.find((i) => i.key === params.get('investment'));
    content =
      heading(
        'MEU PORTFÓLIO',
        'Sua jornada de investimento',
        'Acompanhe o estado de cada aporte e a consolidação dos seus direitos.',
      ) +
      stats() +
      table();
    if (selected)
      content += `<section class="card" style="margin-top:24px"><h2>${esc(projects[selected.project]?.name)} · acompanhamento</h2>${selected.entity ? `<div class="row"><span>${window.RafttI18n.lang === 'en' ? 'Investing as' : 'Investindo como'}</span><strong data-i18n-skip>${esc(selected.entity.name)}</strong></div>` : ''}<div class="row"><span>Estado</span><strong>${labels[selected.status]}</strong></div><div class="row"><span>Participação no veículo · ${selected.status === 'consolidated' ? 'consolidada' : 'estimada'}</span><strong>${((selected.amount / 100000) * 100).toFixed(2)}%</strong></div><div class="row"><span>Participação indireta na startup</span><strong>${((selected.amount / 100000) * 10).toFixed(3)}%</strong></div><p class="muted">Exemplo equity: rodada US$ 100.000 e veículo com 10%. Antes de diluição e custos. Sem estimativa de retorno.</p>${selected.status === 'confirmed' ? '<button id="close-round">Simular fechamento da rodada</button>' : ''}${['pending', 'failed'].includes(selected.status) ? '<button id="cancel-investment" class="danger">Cancelar aporte simulado</button>' : ''}<div class="actions">${selected.project === 'nullun' ? link('milestone-releases.html', 'Evidências e liberações', 'button secondary') : '<span class="badge">Marcos aguardando fechamento e evidências</span>'}${link('opportunity-details.html?opportunity=' + selected.project, 'Rever condições', 'button secondary')}</div><details><summary>Regras de decisão e acompanhamento</summary><p>No exemplo, o responsável autorizado revisa as evidências e libera as parcelas. Votações são exigidas apenas quando previstas no mandato. Atrasos geram revisão do plano; dinheiro utilizado não é recuperado automaticamente.</p></details></section>`;
  }
  if (page === 'profile.html') content = window.RafttSettings.render(profile);
  if (page === 'milestone-releases.html')
    content = '<div id="milestone-workspace" data-i18n-skip></div>';
  if (page === 'company-dashboard.html') {
    const submitted = params.get('stage') === 'submitted' || company.status === 'submitted';
    const name = esc(company.companyName || 'Sua empresa');
    content = `<div class="top"><div>${heading('CAPTAÇÃO · ÁREA DA EMPRESA', name, 'Organize a rodada, apresente evidências e acompanhe o capital por etapa.')}</div>${link('company-application.html', company.companyName ? 'Editar apresentação' : 'Apresentar empresa', 'button')}</div><div class="stats company-stats"><div class="card"><small>Meta da rodada</small><strong class="metric">${company.targetRaise ? money(Number(company.targetRaise)) : 'A definir'}</strong></div><div class="card"><small>Capital líquido estimado</small><strong class="metric">${company.targetRaise ? money(Number(company.targetRaise) * 0.93) : 'A definir'}</strong></div><div class="card"><small>Comissão no fechamento</small><strong class="metric">7%</strong></div></div><div class="fundraising-status"><span class="badge">${submitted ? 'Proposta em análise' : 'Apresentação em preparação'}</span><p>${submitted ? 'Sua proposta foi registrada na demonstração. Aguarde a revisão das informações e do plano.' : 'Complete os dados da empresa e defina instrumento, orçamento e marcos antes de publicar a rodada.'}</p></div><div class="grid"><section class="card"><p class="eyebrow">01 / ESTRUTURA DA RODADA</p><h2>Seu plano, em um só lugar.</h2><div class="row"><span>Instrumento</span><strong>${esc({ equity: 'Participação societária', safe: 'SAFE', 'convertible-note': 'Conversível' }[company.structure] || company.structure || 'A definir')}</strong></div>${company.structure === 'equity' && company.equityPercentage ? `<div class="row"><span>${window.RafttI18n.lang === 'en' ? 'Company equity offered' : 'Participação da empresa oferecida'}</span><strong>${esc(company.equityPercentage)}%</strong></div>` : ''}<div class="row"><span>Site da empresa</span><strong>${esc(company.website || 'Não informado')}</strong></div><div class="row"><span>Publicação</span><strong>Após aprovação</strong></div><div class="actions">${link('company-application.html', 'Revisar apresentação', 'button secondary')}</div></section><section class="card"><p class="eyebrow">02 / EXECUÇÃO POR MARCOS</p><h2>Planeje cada entrega.</h2><div id="company-milestone-summary" data-i18n-skip></div><p class="muted">As parcelas seguem o plano da rodada. A IA apoia a análise e o responsável autorizado decide a liberação.</p><div class="actions">${link('milestone-releases.html', 'Planejar marcos e orçamento', 'button secondary')}</div></section></div><div class="workspace-note"><div>${icon('switch')}<strong>Também quer investir?</strong><p>Seu portfólio e sua captação coexistem nesta conta.</p></div>${link('investor-dashboard.html', 'Abrir painel de investimentos →', 'button secondary')}</div>`;
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
  const appRoot =
    document.getElementById('app') ||
    document.body.appendChild(Object.assign(document.createElement('div'), { id: 'app' }));
  appRoot.innerHTML = `<div class="app-shell"><button class="menu-scrim" id="menu-scrim" aria-label="Fechar navegação" hidden></button><aside class="app-sidebar" id="app-sidebar"><a class="logo" href="welcome.html"><img src="assets/images/raftt-symbol.svg" alt=""><span>raftt<span class="logo-period">.</span></span></a><div class="workspace-switch"><button id="workspace-trigger" aria-expanded="false" aria-controls="workspace-popover"><span class="workspace-icon">${icon('switch')}</span><span><small>Área de trabalho</small><strong>${page === 'company-dashboard.html' ? 'Captação' : 'Minha conta'}</strong></span>${icon('chevron')}</button><div id="workspace-popover" class="popover" hidden><small>UMA CONTA, DUAS ÁREAS</small><a href="investor-dashboard.html" data-workspace="investor">${icon('wallet')}Investimentos</a><a href="company-dashboard.html" data-workspace="organization">${icon('building')}Captação da empresa</a></div></div><p class="nav-caption">INVESTIR</p><nav aria-label="Investimentos">${navMarkup(nav)}</nav><p class="nav-caption">CAPTAR</p><nav aria-label="Captação">${navMarkup(companyNav)}</nav><div class="sidebar-bottom"><div class="sidebar-note"><span class="status-dot"></span><span>Construindo próximos capítulos.</span></div><a class="account-link" href="profile.html"><span class="avatar">${esc(profile.name.charAt(0).toUpperCase())}</span><span><strong>${esc(profile.name)}</strong><small>Investidor & empresa</small></span>${icon('chevron')}</a></div></aside><div class="app-body"><header class="app-topbar"><div class="topbar-location"><button id="mobile-menu" class="icon-button" aria-label="Abrir navegação" aria-expanded="false" aria-controls="app-sidebar">${icon('menu')}</button><span class="topbar-brand">Plataforma</span><span class="slash">/</span><strong>${activeTitle}</strong></div><div class="topbar-actions"><select id="app-language" aria-label="Language"><option value="en">EN</option><option value="pt">PT</option></select><span class="demo-label"><span class="status-dot"></span>Ambiente demo</span><div class="account-menu"><button class="avatar account-trigger" id="account-trigger" aria-expanded="false" aria-controls="account-popover" aria-label="Abrir menu da conta">${esc(profile.name.charAt(0).toUpperCase())}</button><div id="account-popover" class="popover" hidden><strong>${esc(profile.name)}</strong><small>INVESTIR E CAPTAR</small><a href="profile.html">${icon('user')}Perfil e preferências</a><a href="account-workspaces.html">${icon('switch')}Áreas da conta</a><a href="login.html" id="logout">${icon('logout')}Sair da sessão</a></div></div></div></header><main data-page="${page}">${content}<p class="notice">Ambiente de demonstração. Os valores e movimentos apresentados são simulados.</p></main><footer><span>RAFTT / Infraestrutura para ativos privados</span><span>Signals. Milestones. Progress.</span></footer></div></div>`;
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
  if (page === 'opportunities.html') window.RafttSettings.market(projects);
  if (page === 'investor-dashboard.html') {
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
        sessionStorage.setItem('raftt-demo-session', 'true');
      }),
  );
  if (page === 'profile.html') window.RafttSettings.init(profile);
  if (page === 'investment-checkout.html') {
    const amount = document.getElementById('amount'),
      form = document.getElementById('invest-form'),
      outcomes = document.getElementById('outcomes');
    let current = investments.find((i) => i.key === params.get('investment') && i.project === id);
    if (current) amount.value = current.amount;
    function update() {
      const a = window.RafttNumbers.value(amount),
        valid = amount.checkValidity();
      const prior = investments
        .filter(
          (i) => i.project === id && i !== current && !['cancelled', 'failed'].includes(i.status),
        )
        .reduce((n, i) => n + i.amount, 0);
      const f = Math.max(0, Math.round((fee(prior + a) - fee(prior)) * 100) / 100);
      document.getElementById('principal').textContent = valid ? money(a) : '—';
      document.getElementById('fee').textContent = valid ? money(f) : '—';
      document.getElementById('total').textContent = valid ? money(a + f) : '—';
      document.getElementById('rights').textContent = valid
        ? t(
            `Participação estimada no veículo: ${percent((a / offer.roundTarget) * 100)}. Participação econômica indireta na startup: ${percent((a / offer.roundTarget) * offer.startupEquityPercent, 3)}. Base: seu principal ÷ meta da rodada × participação do veículo na startup. Estimativa antes de diluição e custos, sem previsão de valorização.`,
            `Estimated ownership in the vehicle: ${percent((a / offer.roundTarget) * 100)}. Indirect economic ownership in the startup: ${percent((a / offer.roundTarget) * offer.startupEquityPercent, 3)}. Basis: your principal ÷ round target × vehicle ownership in the startup. Estimate before dilution and costs, with no projected appreciation.`,
          )
        : '';
      return f;
    }
    amount.oninput = update;
    update();
    if (current && ['pending', 'failed'].includes(current.status)) {
      form.hidden = true;
      outcomes.hidden = false;
    } else if (current) {
      form.hidden = true;
      document.getElementById('result').textContent = labels[current.status];
    }
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const f = update();
      current = {
        key: crypto.randomUUID(),
        project: id,
        amount: window.RafttNumbers.value(amount),
        fee: f,
        offer: { ...offer },
        status: 'pending',
        created: new Date().toISOString(),
        payment: document.getElementById('payment').value,
        entity: window.RafttSettings.selectedEntity(profile),
      };
      investments.push(current);
      write('raftt-investments', investments);
      history.replaceState(null, '', checkout + '&investment=' + current.key);
      amount.disabled = true;
      form.hidden = true;
      outcomes.hidden = false;
    };
    document.querySelectorAll('[data-outcome]').forEach(
      (b) =>
        (b.onclick = () => {
          if (!current) return;
          current.status = b.dataset.outcome;
          write('raftt-investments', investments);
          document.getElementById('result').textContent =
            labels[current.status] +
            '. ' +
            (current.status === 'confirmed'
              ? 'Acompanhe no portfólio.'
              : 'Abra o aporte no portfólio para tentar novamente.');
          outcomes.hidden = true;
        }),
    );
  }

  const selected = investments.find((i) => i.key === params.get('investment'));
  document.getElementById('close-round')?.addEventListener('click', () => {
    investments
      .filter((i) => i.project === selected.project && i.status === 'confirmed')
      .forEach((i) => (i.status = 'consolidated'));
    write('raftt-investments', investments);
    location.reload();
  });
  document.getElementById('cancel-investment')?.addEventListener('click', () => {
    selected.status = 'cancelled';
    write('raftt-investments', investments);
    location.reload();
  });
})();
