(() => {
  'use strict';
  const host = document.getElementById('investor-workspace');
  if (!host) return;
  const C = window.RafttChain,
    V = window.RafttV2,
    B = window.RafttV2Bridge,
    M = window.RafttWorkspaceModel;
  const cfg = window.RafttSolanaConfig,
    page = window.RafttRoutes.page;
  const en = window.RafttI18n.lang === 'en',
    t = (pt, english) => (en ? english : pt);
  const locale = en ? 'en-US' : 'pt-BR';
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );
  const short = (value) => (value ? value.slice(0, 6) + '…' + value.slice(-4) : '—');
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  };
  let rows = [],
    assets = [],
    sol = null,
    loaded = false,
    error = '',
    message = '',
    busy = false,
    generation = 0,
    filter = 'all',
    review = null;
  const mode = 'chain';
  sessionStorage.setItem('raftt-investor-view', 'chain');
  const money = (value) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
      Number(value || 0),
    );
  const format = (amount, decimals) => {
    const [whole, fraction = ''] = C.format(BigInt(amount), decimals).split('.');
    const trimmed = fraction.replace(/0+$/, '');
    return BigInt(whole).toLocaleString(locale) + (trimmed ? (en ? '.' : ',') + trimmed : '');
  };
  const labels = {
    fundraising: t('Em captação', 'Fundraising'),
    funded: t('Captação concluída', 'Fundraising complete'),
    execution: t('Em execução', 'In execution'),
    refund: t('Reembolso disponível', 'Refund available'),
    refunded: t('Posição encerrada', 'Position closed'),
    empty: t('Sem posição ativa', 'No active position'),
    draft: t('Rascunho', 'Draft'),
  };
  function metadata(row) {
    const company = window.RafttCompanyData?.forRound(row);
    if (company) return company;
    const key = `raftt-chain:${cfg.network}:${cfg.programId}:companies`;
    const entry = read(key, {})[row.authority || row.creator];
    const round = (cfg.rounds || []).find((item) => item.address === row.address);
    return (
      round ||
      entry ||
      (cfg.opportunities || []).find((item) => item.authority === row.authority) ||
      {}
    );
  }
  const title = (row) =>
    metadata(row).name ||
    (row.version === 2
      ? t('Rodada ', 'Round ') + '#' + row.id
      : t('Oferta anterior ', 'Legacy offering ') + short(row.address));
  function normalized(row, version) {
    return {
      ...row,
      version,
      position: BigInt(row.position),
      vaultBalance: BigInt(row.vaultBalance),
      failed: version === 2 ? row.status === 3 : row.failed,
      closed: version === 2 ? row.status === 2 : row.closed,
      legacyReleased: version === 1 && row.released,
      released: version === 2 ? row.released : 0n,
      target: version === 2 ? row.cap : row.target,
    };
  }
  const button = (text, action, extra = '') =>
    `<button type="button" class="button secondary" data-action="${action}" ${busy ? 'disabled' : ''} ${extra}>${text}</button>`;
  const unit = (row) => t('tokens de teste', 'test tokens') + ' · ' + short(row.mint);
  function amountGroups(groups) {
    return groups.length
      ? groups
          .map(
            (group) =>
              `<div class="metric-stack">${format(group.amount, group.decimals)}<span class="workspace-unit">${t('tokens de teste', 'test tokens')} · ${short(group.mint)}</span></div>`,
          )
          .join('')
      : '—';
  }
  function toolbar() {
    const owner = C.address();
    return `<section class="workspace-toolbar"><div><h2>${t('Sua carteira', 'Your wallet')}</h2><p class="muted wallet-address">${owner ? `${esc(short(owner))} ${button(t('Copiar endereço', 'Copy address'), 'copy-wallet')}` : t('Conecte para consultar seus dados na Solana.', 'Connect to view your Solana data.')}</p><small>${t('Rede Solana', 'Solana network')}: ${esc(cfg.network)}</small></div><div class="actions"><select id="workspace-provider" aria-label="${t('Provedor da carteira', 'Wallet provider')}"><option value="phantom">Phantom</option><option value="solflare">Solflare</option></select>${owner ? button(t('Atualizar', 'Refresh'), 'refresh') + button(t('Desconectar', 'Disconnect'), 'disconnect') : button(t('Conectar carteira', 'Connect wallet'), 'connect')}</div></section>`;
  }
  function walletCard() {
    if (!loaded || !C.address()) return '';
    return `<section class="card workspace-section"><div class="workspace-section-head"><div><h2>${t('Saldo disponível na carteira', 'Available wallet balance')}</h2><p class="muted">${t('Estes saldos pertencem à carteira. Valores investidos no cofre aparecem nas posições abaixo.', 'These balances belong to the wallet. Amounts invested in a vault appear in the positions below.')}</p></div></div><div class="wallet-assets"><div class="row"><span>SOL · ${t('taxas da rede', 'network fees')}</span><strong>${format(sol, 9)} SOL</strong></div>${assets.map((a) => `<div class="row"><span>${t('Token de teste', 'Test token')} · ${esc(short(a.mint))}</span><strong>${format(a.amount, a.decimals)}</strong></div>`).join('') || `<p class="muted">${t('Nenhum saldo de token SPL disponível.', 'No SPL token balance available.')}</p>`}</div><p class="workspace-note">${t('Tokens da rede de testes não representam dólares reais.', 'Test-network tokens do not represent real dollars.')}</p></section>`;
  }
  function card(row) {
    const state = M.positionState(row),
      canCancel =
        row.version === 2 &&
        row.status === 1 &&
        row.now < row.deadline - 172800 &&
        row.position > 0n;
    const canRefund = row.failed && row.position > 0n;
    const percent = row.target
      ? Math.min(100, Number((row.raised * 10000n) / row.target) / 100)
      : 0;
    const info = metadata(row);
    const positionLabel = row.legacyReleased
      ? t('Aporte registrado · histórico', 'Recorded contribution · history')
      : t('Aporte registrado', 'Recorded contribution');
    return `<article class="card position-card"><div><p class="eyebrow">${row.version === 2 ? t('RODADA POR PARCELAS', 'MILESTONE ROUND') : t('OFERTA ANTERIOR · V1', 'LEGACY OFFERING · V1')}</p><h3>${esc(title(row))}</h3>${info.description ? `<p class="muted">${esc(info.description)}</p>` : ''}<span class="badge" data-kind="${state}">${labels[state]}</span></div><div class="position-value">${format(row.position, row.decimals)}<span class="workspace-unit">${positionLabel}<br>${esc(unit(row))}</span></div><div class="position-meta"><div><small>${t('Captação total da rodada', 'Total round fundraising')}</small><strong>${format(row.raised, row.decimals)} / ${format(row.target, row.decimals)}</strong></div><div><small>${t('Saldo total no cofre', 'Total vault balance')}</small><strong>${format(row.vaultBalance, row.decimals)}</strong></div><div><small>${t('Próximo passo', 'Next step')}</small><strong>${canRefund ? t('Solicitar reembolso', 'Request refund') : row.failed ? t('Sem valor a reembolsar', 'No refundable balance') : row.closed ? t('Acompanhar execução', 'Follow execution') : t('Acompanhar captação', 'Follow fundraising')}</strong></div></div><div class="wide" style="grid-column:1/-1"><progress max="100" value="${percent}" aria-label="${t('Progresso da rodada', 'Round progress')}"></progress><small class="muted">${t('Progresso da captação da rodada, não saldo da carteira.', 'Round fundraising progress, not wallet balance.')}</small></div><div class="actions">${button(t('Histórico de transações', 'Transaction history'), 'history', `data-round="${esc(row.address)}"`)}${canRefund ? button(t('Solicitar reembolso', 'Request refund'), 'review-refund', `data-round="${esc(row.address)}"`) : ''}${canCancel ? button(t('Cancelar aporte', 'Cancel contribution'), 'review-cancel', `data-round="${esc(row.address)}"`) : ''}${row.version === 2 ? `<a class="button secondary" href="/round-v2?round=${encodeURIComponent(row.address)}">${t('Ver metas e parcelas', 'View milestones')}</a>` : ''}</div><div class="history-list wide" id="history-${esc(row.address)}" style="grid-column:1/-1" aria-live="polite"></div><details><summary>${t('Identificadores da rodada', 'Round identifiers')}</summary><p>${t('Rodada', 'Round')}: <code>${esc(row.address)}</code></p><p>Mint: <code>${esc(row.mint)}</code></p><p>${t('Criadora', 'Creator')}: <code>${esc(row.creator || row.authority)}</code></p></details>${row.legacyReleased ? `<p class="workspace-note" style="grid-column:1/-1">${t('O contrato v1 mantém o aporte histórico após a liberação. Esse número não é saldo disponível nem retorno recebido.', 'The v1 contract retains the historical contribution after release. This number is not an available balance or a received return.')}</p>` : ''}</article>`;
  }
  function reviewPanel() {
    if (!review) return '';
    const row = rows.find((r) => r.address === review.address);
    if (!row) return '';
    return `<section class="workspace-review"><h2>${review.kind === 'refund' ? t('Revisar reembolso', 'Review refund') : t('Revisar cancelamento', 'Review cancellation')}</h2><p>${esc(title(row))} · ${format(row.position, row.decimals)} ${esc(unit(row))}</p>${review.kind === 'cancel' ? `<label for="withdraw-amount">${t('Valor a cancelar · use ponto decimal', 'Amount to cancel · use a decimal point')}</label><input id="withdraw-amount" value="${C.format(row.position, row.decimals)}" inputmode="decimal">` : ''}<p class="muted">${t('Os tokens serão devolvidos à carteira conectada. A operação só será concluída após sua assinatura e a confirmação da rede.', 'Tokens will return to the connected wallet. The operation completes only after your signature and network confirmation.')}</p><div class="actions">${button(t('Voltar', 'Back'), 'dismiss-review')}${button(t('Confirmar na carteira', 'Confirm in wallet'), 'confirm-withdraw')}</div></section>`;
  }
  function chainContent() {
    const connected = !!C.address(),
      positive = rows.filter((row) => row.position > 0n),
      held = positive.filter((row) => !row.legacyReleased);
    const grouped = M.groupAmounts(held, 'position'),
      pending = rows.filter((row) => row.failed && row.position > 0n);
    const list = rows.filter(
      (row) =>
        filter === 'all' ||
        (filter === 'active' && row.position > 0n) ||
        (filter === 'refund' && row.failed && row.position > 0n) ||
        (filter === 'closed' && row.position === 0n),
    );
    const emptyTitle = !connected
      ? t('Seu portfólio começa com uma conexão', 'Your portfolio starts with a connection')
      : loaded
        ? t('Nenhum investimento nesta carteira', 'No investments in this wallet')
        : t('Consultando seus investimentos…', 'Loading your investments…');
    return `<div class="workspace-kpis"><section class="card"><h2>${t('Principal registrado nas posições', 'Recorded position principal')}</h2><div class="workspace-metric">${loaded ? amountGroups(grouped) : '—'}</div><p class="workspace-note">${t('Agrupado por token. Não é saldo disponível. Aportes liberados da v1 ficam fora deste total.', 'Grouped by token. Not an available balance. Released v1 contributions are excluded.')}</p></section><section class="card"><h2>${t('Rodadas com aporte registrado', 'Rounds with a recorded contribution')}</h2><div class="workspace-metric">${loaded ? rows.length : '—'}</div><p class="workspace-note">${t('Inclui posições ativas e encerradas.', 'Includes active and closed positions.')}</p></section><section class="card"><h2>${t('Reembolsos disponíveis', 'Available refunds')}</h2><div class="workspace-metric">${loaded ? pending.length : '—'}</div><p class="workspace-note">${t('Ações que você pode executar como investidor.', 'Actions you can perform as an investor.')}</p></section></div>${error ? `<p class="workspace-alert" data-error="true">${esc(error)}</p>` : ''}${message ? `<p class="workspace-alert" role="status">${esc(message)}</p>` : ''}${page === 'investor-dashboard.html' ? `<div class="grid"><section class="card"><h2>${t('Seu próximo passo', 'Your next step')}</h2><p>${pending.length ? t('Há uma rodada falhada com tokens disponíveis para reembolso.', 'A failed round has tokens available for refund.') : t('Descubra oportunidades e acompanhe cada investimento pelo portfólio.', 'Discover opportunities and track each investment in your portfolio.')}</p><a class="button secondary" href="/portfolio">${t('Abrir portfólio', 'Open portfolio')}</a></section><section class="card"><h2>${t('Metas e liberações', 'Milestones and releases')}</h2><p>${t('A RAFTT revisa as análises e autoriza cada parcela. Investidores acompanham o progresso da execução.', 'RAFTT reviews the analyses and authorizes each installment. Investors follow execution progress.')}</p><a class="button secondary" href="/round-v2">${t('Consultar uma rodada', 'View a round')}</a></section></div>` : ''}${walletCard()}${reviewPanel()}<section class="workspace-section"><div class="workspace-section-head"><h2>${t('Seus investimentos', 'Your investments')}</h2><div class="workspace-filters"><label for="position-filter">${t('Exibir', 'Show')}<select id="position-filter"><option value="all">${t('Todas as posições', 'All positions')}</option><option value="active">${t('Posições positivas', 'Positive positions')}</option><option value="refund">${t('Com reembolso disponível', 'Refund available')}</option><option value="closed">${t('Posições zeradas', 'Zero positions')}</option></select></label></div></div><div class="position-list">${list.length ? list.map(card).join('') : `<div class="card workspace-empty"><h2>${emptyTitle}</h2><p class="muted">${!connected ? t('Conectar uma carteira não cria um investimento. Você verá as posições do endereço selecionado.', 'Connecting a wallet does not create an investment. You will see positions for the selected address.') : error ? t('Não foi possível consultar a rede. Os dados não foram substituídos por valores fictícios.', 'The network could not be queried. No fictional values were substituted.') : rows.length ? t('Nenhuma posição corresponde ao filtro escolhido.', 'No positions match the selected filter.') : t('Explore startups ou consulte uma rodada v2 para realizar seu primeiro aporte de teste.', 'Explore startups or open a v2 round to make your first test contribution.')}</p><a class="button secondary" href="/opportunities">${t('Explorar oportunidades', 'Explore opportunities')}</a></div>`}</div></section><p class="workspace-note">${t('Dados da Solana de testes. Não há cálculo de equity ou retorno financeiro nestas posições.', 'Solana test data. These positions do not calculate equity or financial returns.')}</p>`;
  }
  function overview() {
    const active = rows.filter((row) => row.position > 0n && !row.legacyReleased);
    const amounts = M.groupAmounts(active, 'position');
    const companies = new Set(
      rows.map((row) => window.RafttCompanyData?.forRound(row)?.id).filter(Boolean),
    );
    const unresolved = rows.some((row) => !window.RafttCompanyData?.forRound(row));
    const pending = rows.filter((row) => row.failed && row.position > 0n);
    const values = [
      [
        t('Aportes confirmados', 'Confirmed investments'),
        loaded ? amountGroups(amounts) : '—',
        t(
          'Total investido ainda registrado nas posições, separado por token.',
          'Invested principal still recorded in positions, grouped by token.',
        ),
      ],
      [
        t('Empresas no portfólio', 'Portfolio companies'),
        loaded && !unresolved ? companies.size : '—',
        t(
          'Empresas cadastradas relacionadas aos seus investimentos.',
          'Registered companies linked to your investments.',
        ),
      ],
      [
        t('Posições com saldo', 'Positions with a balance'),
        loaded ? active.length : '—',
        t(
          'Investimentos com uma posição positiva nesta carteira.',
          'Investments with a positive position in this wallet.',
        ),
      ],
      [
        t('Saldo disponível em SOL', 'Available SOL balance'),
        sol !== null ? format(sol, 9) + ' SOL' : '—',
        t(
          'Saldo da carteira usado para taxas da rede. Não inclui tokens investidos.',
          'Wallet balance used for network fees. Does not include invested tokens.',
        ),
      ],
      [
        t('Ações pendentes', 'Pending actions'),
        loaded ? pending.length : '—',
        t(
          'Rodadas falhadas com reembolso disponível para esta carteira.',
          'Failed rounds with refunds available to this wallet.',
        ),
      ],
    ];
    return `<div class="workspace-overview">${values.map(([label, value, note]) => `<section class="card"><h2>${label}</h2><div class="workspace-metric">${value}</div><p class="workspace-note">${note}</p></section>`).join('')}</div>`;
  }
  function followUp() {
    const data = window.RafttCompanyData;
    const linked = rows
      .map((row) => ({ row, company: data?.forRound(row) }))
      .filter((x) => x.company)
      .filter((x, i, list) => list.findIndex((other) => other.company.id === x.company.id) === i);
    const empty = t(
      'Nenhuma informação publicada para este investimento.',
      'No information published for this investment.',
    );
    const safeUrl = (value) => {
      try {
        const url = new URL(value);
        return ['https:', 'http:'].includes(url.protocol) ? esc(url.href) : '';
      } catch {
        return '';
      }
    };
    const documents = (items) =>
      (Array.isArray(items) ? items : [])
        .map((item) => {
          const url = safeUrl(item.url);
          return url
            ? `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${esc(item.title || t('Documento', 'Document'))} ↗</a></li>`
            : '';
        })
        .join('');
    return `<section class="workspace-section"><div class="workspace-section-head"><h2>${t('Acompanhamento das empresas', 'Company follow-up')}</h2></div><p class="workspace-note">${data?.status === 'unconfigured' ? t('Entre na sua conta para consultar as informações das empresas.', 'Sign in to view company information.') : data?.status === 'unavailable' ? t('Informações das empresas temporariamente indisponíveis. Seus dados financeiros continuam separados.', 'Company information is temporarily unavailable. Financial data remains separate.') : t('Documentos e declarações da empresa são separados das movimentações confirmadas na blockchain.', 'Company documents and statements are separate from confirmed blockchain movements.')}</p>${
      linked.length
        ? linked
            .map(
              ({ company }) =>
                `<section class="card"><h2>${esc(company.name)}</h2><p class="muted">${esc(company.description)}</p><div class="grid"><details open><summary>${t('Marcos e evidências', 'Milestones and evidence')}</summary>${Array.isArray(company.milestones) && company.milestones.length ? company.milestones.map((m) => `<article><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><p>${t('Como será feito', 'Execution plan')}: ${esc(m.executionPlan || '—')}</p><p>${t('Critério de aceite', 'Acceptance criterion')}: ${esc(m.acceptanceCriteria || '—')}</p><p>${t('Estado da parcela', 'Installment state')}: ${esc({ planned: t('Planejada', 'Planned'), submitted: t('Em revisão', 'Under review'), authorized: t('Autorizada', 'Authorized'), paid: t('Paga', 'Paid') }[m.status] || '—')}</p><p>${t('Prazo', 'Due date')}: ${esc(m.dueDate || '—')}</p><ul>${documents(m.evidence)}</ul></article>`).join('') : `<p>${empty}</p>`}</details><details open><summary>${t('Documentos e condições', 'Documents and terms')}</summary><ul>${(company.documents || []).map((d) => `<li><strong>${esc(d.title)}</strong><p>${esc(d.description)}</p></li>`).join('')}</ul>${company.documents?.length ? '' : `<p>${empty}</p>`}</details><details open><summary>${t('Comunicados e atualizações', 'Announcements and updates')}</summary>${Array.isArray(company.updates) && company.updates.length ? company.updates.map((u) => `<article><h3>${esc(u.title)}</h3><p>${esc(u.body)}</p><small>${esc(u.publishedAt)}</small></article>`).join('') : `<p>${empty}</p>`}</details><details open><summary>${t('Autorizações e pagamentos', 'Authorizations and payments')}</summary>${Array.isArray(company.decisions) && company.decisions.length ? company.decisions.map((d) => `<article><h3>${esc(d.title)}</h3><p>${d.status === 'paid' ? t('Pagamento registrado na Solana.', 'Payment recorded on Solana.') : t('Parcela autorizada pela RAFTT.', 'Installment authorized by RAFTT.')}</p></article>`).join('') : `<p>${empty}</p>`}</details></div></section>`,
            )
            .join('')
        : `<div class="grid">${[
            [
              t('Marcos e evidências', 'Milestones and evidence'),
              t(
                'Entregas, plano de execução e comprovantes serão apresentados por investimento.',
                'Deliverables, execution plans and evidence will be displayed for each investment.',
              ),
            ],
            [
              t('Documentos e condições', 'Documents and terms'),
              t(
                'Termos, instrumento e direitos serão carregados do cadastro da empresa.',
                'Terms, instruments and rights will be loaded from company records.',
              ),
            ],
            [t('Comunicados e atualizações', 'Announcements and updates'), empty],
            [
              t('Autorizações e pagamentos', 'Authorizations and payments'),
              t(
                'Autorizações e pagamentos confirmados serão apresentados por investimento.',
                'Confirmed authorizations and payments will appear for each investment.',
              ),
            ],
          ]
            .map(
              ([label, text]) =>
                `<section class="card"><h2>${label}</h2><p class="muted">${text}</p><span class="badge">${t('Aguardando informações', 'Awaiting information')}</span></section>`,
            )
            .join('')}</div>`
    }</section>`;
  }
  window.addEventListener('raftt:companies-change', () => render());
  window.RafttCompanyData?.refresh();
  function render() {
    let content = chainContent();
    if (mode !== 'demo') {
      const start = content.indexOf('<div class="workspace-kpis">');
      const end = content.indexOf('</section></div>', start);
      if (start >= 0 && end >= 0)
        content =
          content.slice(0, start) + overview() + content.slice(end + '</section></div>'.length);
      content += followUp();
    }
    host.innerHTML = toolbar() + content;
    host
      .querySelectorAll('[data-action]')
      .forEach((el) => (el.onclick = () => action(el.dataset.action, el.dataset.round)));
    const select = host.querySelector('#position-filter');
    if (select) {
      select.value = filter;
      select.onchange = () => {
        filter = select.value;
        render();
      };
    }
    const badge = document.querySelector('.demo-label');
    if (badge) badge.textContent = window.RafttEnvironment?.label() || 'Solana · ' + cfg.network;
  }
  async function refresh() {
    const run = ++generation,
      owner = C.address();
    rows = [];
    assets = [];
    sol = null;
    loaded = false;
    error = '';
    review = null;
    render();
    if (!owner) return;
    try {
      const result = await Promise.allSettled([
        C.list(),
        V.list(),
        B.rpc().getBalance(B.pk(owner)),
        B.rpc().getParsedTokenAccountsByOwner(B.pk(owner), { programId: B.token }),
      ]);
      if (run !== generation || owner !== C.address()) return;
      if (result[0].status === 'rejected' || result[1].status === 'rejected')
        throw Error(
          t(
            'Dados financeiros indisponíveis na rede configurada. Tente atualizar em alguns instantes. As informações das empresas continuam disponíveis em Oportunidades.',
            'Financial data is unavailable on the configured network. Try refreshing shortly. Company information remains available in Opportunities.',
          ),
        );
      rows = [
        ...result[0].value.filter((s) => s.hasPosition).map((s) => normalized(s, 1)),
        ...result[1].value.filter((s) => s.hasPosition).map((s) => normalized(s, 2)),
      ];
      if (result[2].status === 'rejected' || result[3].status === 'rejected')
        throw Error(
          t(
            'Não foi possível consultar o saldo da carteira.',
            'Wallet balances could not be loaded.',
          ),
        );
      sol = BigInt(result[2].value);
      const tokens = result[3].value.value
        .map((x) => x.account.data.parsed.info)
        .map((x) => ({
          mint: x.mint,
          decimals: x.tokenAmount.decimals,
          amount: BigInt(x.tokenAmount.amount),
        }));
      assets = M.groupAmounts(tokens, 'amount').filter((a) => a.amount > 0n);
      loaded = true;
    } catch (e) {
      if (run !== generation) return;
      rows = [];
      error = e.message || String(e);
    }
    render();
  }
  async function action(name, address) {
    if (busy) return;
    if (name === 'copy-wallet') {
      try {
        await navigator.clipboard.writeText(C.address());
        message = t('Endereço copiado.', 'Address copied.');
      } catch {
        message = C.address();
      }
      render();
      return;
    }
    if (name === 'dismiss-review') {
      review = null;
      render();
      return;
    }
    if (name.startsWith('review-')) {
      review = {
        kind: name === 'review-refund' ? 'refund' : 'cancel',
        address,
        owner: C.address(),
      };
      render();
      host
        .querySelector('.workspace-review')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const provider = host.querySelector('#workspace-provider')?.value;
    const chosen = review,
      amount = host.querySelector('#withdraw-amount')?.value;
    busy = true;
    message = '';
    render();
    try {
      if (name === 'connect') {
        await C.connect(provider);
        await refresh();
      }
      if (name === 'disconnect') {
        await C.disconnect();
        await refresh();
      }
      if (name === 'refresh') await refresh();
      if (name === 'confirm-withdraw') {
        if (!chosen || chosen.owner !== C.address())
          throw Error(
            t(
              'A carteira mudou. Revise a operação novamente.',
              'Wallet changed. Review the operation again.',
            ),
          );
        const row = rows.find((r) => r.address === chosen.address);
        if (!row) throw Error(t('Consulte a posição novamente.', 'Refresh the position first.'));
        if (chosen.kind === 'cancel' && C.units(amount, row.decimals) > row.position)
          throw Error(t('Valor acima da sua posição.', 'Amount exceeds your position.'));
        let wallet, registeredRound;
        if (window.RafttApi && row.version === 2) {
          const result = await window.RafttBackend.db
            .from('rounds')
            .select('id')
            .eq('chain_address', row.address)
            .eq('network', cfg.network)
            .eq('program_id', cfg.programId)
            .limit(1);
          if (result.error) throw result.error;
          registeredRound = result.data?.[0];
          if (registeredRound) {
            await window.RafttApi.request('/v1/rounds/' + registeredRound.id);
            wallet = await window.RafttApi.verifyWallet();
          }
        }
        if (chosen.owner !== C.address())
          throw Error(t('A carteira mudou. Revise novamente.', 'Wallet changed. Review again.'));
        const signature =
          row.version === 2
            ? await V.act(chosen.kind === 'refund' ? 'refund_round' : 'cancel_round', row.address, {
                amount,
              })
            : await C.act('refund', row.authority, undefined, row.offeringId);
        message = t('Transação confirmada: ', 'Transaction confirmed: ') + signature;
        if (wallet) {
          try {
            await window.RafttApi.recordConfirmed(
              registeredRound.id,
              chosen.kind === 'refund' ? 'refund_round' : 'cancel_round',
              signature,
              wallet.id,
            );
          } catch (error) {
            message +=
              t(' · Registro no banco pendente. ', ' · Database registration pending. ') +
              error.message;
          }
        }
        await refresh();
      }
      if (name === 'history') {
        const row = rows.find((r) => r.address === address),
          owner = C.address(),
          run = generation;
        if (!row) return;
        const pk = B.pda(B.bytes('position-v2'), B.pk(address).toBytes(), B.pk(owner).toBytes());
        const history =
          row.version === 1
            ? await C.history(row)
            : await B.rpc().getSignaturesForAddress(pk, { limit: 50 });
        if (owner !== C.address() || run !== generation) return;
        const area = host.querySelector('#history-' + address);
        if (area)
          area.innerHTML =
            history
              .map(
                (x) =>
                  `<p><span>${x.err ? t('Falhou', 'Failed') : t('Confirmada', 'Confirmed')} · ${x.blockTime ? esc(new Date(x.blockTime * 1000).toLocaleString(locale)) : t('Horário indisponível', 'Time unavailable')}</span>${cfg.network === 'devnet' ? `<a href="https://explorer.solana.com/tx/${encodeURIComponent(x.signature)}?cluster=devnet" target="_blank" rel="noopener">${t('Ver comprovante', 'View receipt')}</a>` : `<code>${esc(x.signature)}</code>`}</p>`,
              )
              .join('') || `<p>${t('Nenhuma transação encontrada.', 'No transactions found.')}</p>`;
      }
    } catch (e) {
      error =
        e.code === 4001 ? t('Assinatura recusada.', 'Signature rejected.') : e.message || String(e);
    } finally {
      busy = false;
      if (name !== 'history' || error) render();
      else host.querySelectorAll('button').forEach((b) => (b.disabled = false));
    }
  }
  window.addEventListener('raftt:auth-signout', () => {
    ++generation;
    rows = [];
    assets = [];
    sol = null;
    loaded = false;
    review = null;
    error = '';
    message = '';
    render();
  });
  window.addEventListener('raftt:wallet-change', () => {
    ++generation;
    rows = [];
    assets = [];
    sol = null;
    loaded = false;
    review = null;
    error = '';
    message = '';
    render();
    if (!busy) refresh();
  });
  window.addEventListener('raftt:transaction-phase', (e) => {
    message =
      {
        wallet: t('Confirme a operação na carteira.', 'Confirm the operation in your wallet.'),
        sending: t('Enviando transação…', 'Sending transaction…'),
        confirming: t('Aguardando confirmação da rede…', 'Waiting for network confirmation…'),
      }[e.detail] || '';
    const box = host.querySelector('.workspace-alert[role=status]');
    if (box) box.textContent = message;
  });
  render();
  if (C.address()) refresh();
  else C.restore?.().catch(() => {});
})();
