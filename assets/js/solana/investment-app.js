(() => {
  'use strict';
  if (new URLSearchParams(location.search).has('company')) return;
  const host = document.getElementById('investment-app');
  if (!host) return;
  const C = window.RafttChain,
    cfg = window.RafttSolanaConfig;
  const page = window.RafttRoutes.page,
    params = new URLSearchParams(location.search);
  const pt = window.RafttI18n.lang === 'pt';
  const t = (a, b) => (pt ? a : b);
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const key = `raftt-chain:${cfg.network}:${cfg.programId}`;
  const read = (suffix) => {
    try {
      return JSON.parse(localStorage.getItem(key + suffix) || '{}');
    } catch {
      return {};
    }
  };
  const matches = (s, authority) =>
    s.authority === authority && s.offeringId.toString() === (params.get('offeringId') || '0');
  let revision = 0,
    busy = false,
    selected,
    amount,
    balance = 0n;
  const short = (s) => (s ? s.slice(0, 6) + '…' + s.slice(-4) : '—');
  const href = (p, s) =>
    `${p}?authority=${encodeURIComponent(s.authority)}&offeringId=${s.offeringId}`;
  const meta = (s) =>
    read(':companies')[s.authority] ||
    (cfg.opportunities || []).find((x) => x.authority === s.authority) ||
    {};
  const name = (s) => meta(s).name || t('Oferta', 'Offering') + ' ' + short(s.authority);
  const state = (s) =>
    s.failed
      ? t('Falhada', 'Failed')
      : s.released
        ? t('Fundos liberados', 'Funds released')
        : s.closed || s.raised >= s.target
          ? t('Meta atingida', 'Target reached')
          : t('Aberta', 'Open');
  const open = (s) => !s.closed && !s.failed && !s.released && s.raised < s.target;
  const money = (n, s) => {
    const [whole, frac] = C.format(BigInt(n), s.decimals).split('.');
    return (
      BigInt(whole).toLocaleString(pt ? 'pt-BR' : 'en-US') + (frac ? (pt ? ',' : '.') + frac : '')
    );
  };
  const button = (label, action) =>
    `<button class="button" data-action="${action}">${label}</button>`;
  const link = (label, url) => `<a class="button secondary" href="${esc(url)}">${label}</a>`;
  const proof = (sig) =>
    cfg.network === 'devnet'
      ? `<a target="_blank" rel="noopener" href="https://explorer.solana.com/tx/${encodeURIComponent(sig)}?cluster=devnet">${t('Comprovante da transação', 'Transaction receipt')}</a>`
      : `<details><summary>${t('Comprovante da transação', 'Transaction receipt')}</summary><code>${esc(sig)}</code></details>`;
  const stats = (s) =>
    `<div class="chain-stats"><div><small>${t('Arrecadado', 'Money raised')}</small><strong>${money(s.raised, s)}</strong></div><div><small>${t('Meta', 'Target')}</small><strong>${money(s.target, s)}</strong></div></div><progress max="10000" value="${s.target ? Number((s.raised * 10000n) / s.target) : 0}"></progress><p class="badge">${state(s)}</p><p>${t('Token de teste SPL', 'SPL test token')} · ${esc(cfg.network)}</p><details><summary>${t('Detalhes técnicos', 'Technical details')}</summary><p>Mint: <code>${esc(s.mint)}</code></p><p>${t('Criadora', 'Creator')}: <code>${esc(s.authority)}</code></p><p>${t('Oferta', 'Offering')}: <code>${esc(s.address)}</code></p></details>`;
  function frame(title, body) {
    if (page === 'opportunity-details.html') {
      host.innerHTML = `<section class="card"><h2>${t('Investimento · Solana devnet', 'Investment · Solana devnet')}</h2><div class="actions"><select id="wallet-kind" aria-label="Wallet"><option>Phantom</option><option>Solflare</option></select>${button(C.address() ? short(C.address()) : t('Conectar carteira', 'Connect wallet'), 'connect')}${C.address() ? button(t('Desconectar', 'Disconnect'), 'disconnect') : ''}</div><p id="investment-status" role="status" aria-live="polite"></p><div id="investment-content">${body}</div></section>`;
      host
        .querySelectorAll('[data-action]')
        .forEach((el) => (el.onclick = () => action(el.dataset.action)));
      return;
    }
    host.innerHTML = `<div class="top"><div><p class="eyebrow">RAFTT / ${esc(cfg.network)}</p><h1>${title}</h1></div><div class="actions"><select id="wallet-kind" aria-label="Wallet"><option>Phantom</option><option>Solflare</option></select>${button(C.address() ? short(C.address()) : t('Conectar carteira', 'Connect wallet'), 'connect')}${C.address() ? button(t('Desconectar', 'Disconnect'), 'disconnect') : ''}</div></div><p id="investment-status" role="status" aria-live="polite"></p><div id="investment-content">${body}</div>`;
    host
      .querySelectorAll('[data-action]')
      .forEach((el) => (el.onclick = () => action(el.dataset.action)));
  }
  function status(message) {
    const el = host.querySelector('#investment-status');
    if (el) el.textContent = message;
  }
  function error(e) {
    status(
      e.code === 4001 || /reject|cancel/i.test(e.message)
        ? t('Solicitação cancelada.', 'Request cancelled.')
        : e.message,
    );
  }
  function field(label, id, type = 'text', extra = '') {
    return `<label>${label}<input id="${id}" type="${type}" ${extra}></label>`;
  }
  async function render() {
    const run = ++revision;
    selected = null;
    const investor = C.address();
    if (page === 'opportunity-details.html' && !params.get('authority')) {
      frame(
        '',
        `<p>${t('Esta apresentação ainda não está vinculada a uma oferta na devnet. Os dados da empresa são independentes da blockchain; investir ficará disponível após vincular a oferta.', 'This presentation is not linked to a devnet offering yet. Company information is independent of the blockchain; investing becomes available after linking an offering.')}</p>`,
      );
      return;
    }
    frame(t('Carregando ofertas…', 'Loading offerings…'), '');
    try {
      if (page === 'company-dashboard.html' && !investor) {
        frame(
          t('Captação da startup', 'Startup fundraising'),
          `<section class="card"><h2>${t('Sua startup, sua oferta', 'Your startup, your offering')}</h2><p>${t('Conecte a carteira responsável para criar ou acompanhar sua oferta.', 'Connect the creator wallet to create or manage your offering.')}</p></section>`,
        );
        return;
      }
      const rows = await C.list();
      if (run !== revision || C.address() !== investor) return;
      if (page === 'company-dashboard.html') {
        selected = rows.find((s) => matches(s, investor));
        if (!selected) {
          frame(
            t('Criar oferta', 'Create offering'),
            `<form id="create-offer" class="card chain-form">${field(t('Nome da startup', 'Company name'), 'company-name', 'text', 'required maxlength="100"')}${field(t('Descrição curta', 'Short description'), 'company-description', 'text', 'maxlength="100"')}${field(t('Site', 'Website'), 'company-website', 'url')}${field(t('Token SPL (mint)', 'SPL token (mint)'), 'mint', 'text', 'required')}${field(t('Identificador da oferta', 'Offering identifier'), 'offering-id', 'text', 'required inputmode="numeric" value="0"')}${field(t('Meta em tokens', 'Target in tokens'), 'target', 'text', 'required inputmode="decimal"')}<p>${t('Uma oferta por identificador e carteira. Os dados da empresa ficam somente neste navegador até a integração com armazenamento externo.', 'One offering per identifier and wallet. Company metadata remains in this browser until external storage is integrated.')}</p><button class="button">${t('Revisar oferta', 'Review offering')}</button></form>`,
          );
          host.querySelector('form').onsubmit = (e) => {
            e.preventDefault();
            createReview();
          };
          return;
        }
        const s = selected;
        frame(
          t('Captação da startup', 'Startup fundraising'),
          `<section class="card"><h2>${esc(name(s))}</h2>${stats(s)}<p>${t('Saldo no cofre', 'Vault balance')}: ${money(s.vaultBalance, s)}</p><p>${t('Carteira responsável', 'Creator wallet')}: ${esc(short(s.authority))}</p><div class="actions">${open(s) ? button(t('Encerrar sem sucesso', 'End unsuccessful offering'), 'fail-review') : ''}${!s.failed && !s.released && s.raised >= s.target ? button(t('Liberar capital', 'Release capital'), 'release-review') : ''}</div></section><section class="card"><h3>${t('Próximas funcionalidades', 'Future features')}</h3><p>${t('Liberação por marcos, votação e validação por IA estão previstas para versões futuras. Este contrato libera todo o capital de uma vez.', 'Milestone releases, voting and AI validation are future features. This contract releases all capital at once.')}</p></section>`,
        );
        return;
      }
      if (['portfolio.html', 'investor-dashboard.html'].includes(page)) {
        const positions = investor ? rows.filter((s) => s.hasPosition) : [];
        const authority = params.get('authority');
        selected = positions.find((s) => matches(s, authority));
        if (selected) {
          const s = selected;
          frame(
            t('Meu investimento', 'My investment'),
            `<section class="card"><h2>${esc(name(s))}</h2>${stats(s)}<h3>${t('Posição atual', 'Current position')}: ${money(s.position, s)}</h3>${s.failed && s.position > 0n ? `<p>${t('Captação encerrada sem sucesso. Você pode recuperar seus tokens.', 'This offering ended unsuccessfully. You can recover your tokens.')}</p>${button(t('Solicitar reembolso integral', 'Request full refund'), 'refund-review')}` : ''}<h3>${t('Histórico', 'History')}</h3>${(
              read(':history')[investor] || []
            )
              .filter(
                (e) => e.authority === s.authority && e.offeringId === s.offeringId.toString(),
              )
              .map(
                (e) =>
                  `<p>${esc({ invest: t('Aporte', 'Contribution'), refund: t('Reembolso integral', 'Full refund') }[e.kind] || e.kind)}${e.amount ? ' · ' + money(e.amount, s) : ''} · ${esc(e.time)}${proof(e.signature)}</p>`,
              )
              .join('')}<div id="transaction-history"></div></section>`,
          );
          const history = await C.history(s);
          if (run !== revision) return;
          host.querySelector('#transaction-history').innerHTML =
            history
              .map(
                (x) =>
                  `<p>${x.err ? t('Falhou', 'Failed') : t('Confirmada', 'Confirmed')} · ${x.blockTime ? new Date(x.blockTime * 1000).toLocaleString(pt ? 'pt-BR' : 'en-US') : ''}${proof(x.signature)}</p>`,
              )
              .join('') || t('Nenhuma transação disponível.', 'No transactions available.');
          return;
        }
        frame(
          t('Meu portfólio', 'My portfolio'),
          `<section class="card"><p>${t('Acompanhe seus aportes e as ações disponíveis para cada oferta.', 'Follow your contributions and the actions available for each offering.')}</p>${link(t('Descobrir startups', 'Discover startups'), 'opportunities')}${!investor ? `<p>${t('Conecte sua carteira para consultar suas posições.', 'Connect your wallet to view your positions.')}</p>` : ''}</section><div class="chain-grid">${positions.map((s) => `<section class="card"><h2>${esc(name(s))}</h2><p>${state(s)}</p><strong>${money(s.position, s)}</strong><p>${t('Posição atual em tokens', 'Current token position')}</p>${link(t('Ver investimento e histórico', 'View investment and history'), href('portfolio', s))}</section>`).join('')}</div>${investor && !positions.length ? `<p>${t('Esta carteira ainda não tem investimentos nesta rede.', 'This wallet has no investments on this network.')}</p>` : ''}`,
        );
        return;
      }
      selected = rows.find((s) => matches(s, params.get('authority')));
      if (['opportunity-details.html', 'investment-checkout.html'].includes(page)) {
        if (!selected) {
          frame(
            t('Oferta não encontrada', 'Offering not found'),
            link(t('Ver oportunidades', 'View opportunities'), 'opportunities'),
          );
          return;
        }
        const s = selected,
          m = meta(s);
        if (page === 'investment-checkout.html') {
          checkout();
          return;
        }
        frame(
          esc(name(s)),
          `<div class="chain-opportunity"><section class="card"><p>${esc(m.description || t('Apresentação ainda não cadastrada.', 'Company presentation has not been provided.'))}</p><div class="actions" role="tablist">${button(t('Visão geral', 'Overview'), 'overview')}${button(t('Termos', 'Terms'), 'terms')}${button(t('Atualizações', 'Updates'), 'updates')}</div><div id="opportunity-tab"><h2>${t('Sobre a empresa', 'About the company')}</h2><p>${esc(m.description || '—')}</p>${m.website && /^https?:\/\//.test(m.website) ? link(t('Site da empresa', 'Company website'), m.website) : ''}<p>${t('Equipe, documentos e marcos serão exibidos quando estiverem disponíveis.', 'Team, documents and milestones will appear when available.')}</p></div></section><aside class="card chain-invest">${stats(s)}${open(s) ? link(t('Investir', 'Invest'), href('investment-checkout', s)) : ''}<p>${t('Este contrato registra depósitos de tokens. Não emite equity ou SAFE.', 'This contract records token deposits. It does not issue equity or SAFE.')}</p></aside></div>`,
        );
        return;
      }
      frame(
        t('Descubra startups', 'Discover startups'),
        `<p>${t('Escolha uma oportunidade para entender os termos e investir.', 'Choose an opportunity to review its terms and invest.')}</p><div class="chain-grid">${rows.map((s) => `<article class="card"><p class="eyebrow">${esc(meta(s).sector || 'STARTUP')}</p><h2>${esc(name(s))}</h2><p>${esc(meta(s).description || t('Informações da empresa não disponíveis.', 'Company information unavailable.'))}</p>${stats(s)}${link(t('Ver oportunidade', 'View opportunity'), href('opportunity-details', s))}</article>`).join('')}</div>${!rows.length ? `<section class="card"><h2>${t('Nenhuma oferta publicada', 'No offerings published')}</h2><p>${t('As ofertas aparecerão após serem criadas na rede configurada.', 'Offerings will appear after being created on the configured network.')}</p></section>` : ''}`,
      );
    } catch (e) {
      if (run !== revision) return;
      frame(
        t('Não foi possível consultar a rede', 'Unable to load the network'),
        `<section class="card"><p>${t('Confira o RPC e a publicação do programa na rede configurada. Nenhum valor demonstrativo substitui os dados da blockchain.', 'Check the RPC and program deployment on the configured network. Demonstration values do not replace blockchain data.')}</p>${button(t('Tentar novamente', 'Retry'), 'refresh')}</section>`,
      );
      error(e);
    }
  }
  function checkout() {
    const s = selected;
    frame(
      t('1 · Valor do investimento', '1 · Investment amount'),
      `<form class="card chain-form" id="checkout-form">${stats(s)}<p>${t('Restante da meta', 'Remaining target')}: ${money(s.target - s.raised, s)}</p><p id="token-balance"></p>${field(t('Aporte em tokens', 'Contribution in tokens'), 'contribution', 'text', 'required inputmode="decimal" placeholder="0.00"')}<p>${t('Use ponto para casas decimais. Os valores exibidos seguem o idioma selecionado.', 'Use a decimal point when entering amounts. Displayed values follow your selected language.')}</p><button class="button" ${!open(s) ? 'disabled' : ''}>${t('Revisar investimento', 'Review investment')}</button></form>`,
    );
    host.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        if (!C.address())
          throw Error(t('Conecte a carteira primeiro.', 'Connect your wallet first.'));
        amount = host.querySelector('#contribution').value;
        const n = C.units(amount, s.decimals);
        if (!open(s) || n > s.target - s.raised)
          throw Error(t('Valor superior à meta restante.', 'Amount exceeds remaining target.'));
        balance = await C.funds(s.mint);
        if (n > balance)
          throw Error(t('Saldo de tokens insuficiente.', 'Insufficient token balance.'));
        frame(
          t('2 · Revise o investimento', '2 · Review investment'),
          `<section class="card"><h2>${esc(name(s))}</h2><h3>${money(n, s)} ${t('tokens de teste', 'test tokens')}</h3><p>${esc(cfg.network)} · ${esc(short(s.mint))}</p><p>${t('Destino: cofre da oferta. Não há emissão de participação societária.', 'Destination: offering vault. No equity is issued.')}</p><p>${t('SOL para taxas e criação de contas será verificado antes da assinatura.', 'SOL for fees and account creation will be checked before signing.')}</p><div class="actions">${button(t('Confirmar e assinar', 'Confirm and sign'), 'invest')}${button(t('Voltar', 'Back'), 'checkout')}</div></section>`,
        );
      } catch (err) {
        error(err);
      }
    };
    if (C.address()) {
      const run = revision;
      C.funds(s.mint)
        .then((n) => {
          if (run === revision && host.querySelector('#token-balance'))
            host.querySelector('#token-balance').textContent =
              t('Saldo disponível: ', 'Available balance: ') + money(n, s);
        })
        .catch(error);
    }
  }
  function createReview() {
    const data = Object.fromEntries(
      [
        'company-name',
        'company-description',
        'company-website',
        'mint',
        'target',
        'offering-id',
      ].map((id) => [id, host.querySelector('#' + id).value]),
    );
    frame(
      t('Revisar nova oferta', 'Review new offering'),
      `<section class="card"><h2>${esc(data['company-name'])}</h2><p>${t('Meta', 'Target')}: ${esc(data.target)} · ${esc(cfg.network)}</p><code>${esc(data.mint)}</code><p>${t('Uma oferta por identificador e carteira; liberação integral após atingir a meta.', 'One offering per identifier and wallet; full release after reaching the target.')}</p>${button(t('Criar e assinar', 'Create and sign'), 'create')}</section>`,
    );
    host.querySelector('[data-action=create]').onclick = () =>
      transact(
        'initialize',
        () => C.initialize(data.mint, data.target, data['offering-id']),
        () => {
          const companies = read(':companies');
          companies[C.address()] = {
            name: data['company-name'],
            description: data['company-description'],
            website: data['company-website'],
          };
          localStorage.setItem(key + ':companies', JSON.stringify(companies));
        },
      );
  }
  async function transact(kind, fn, after) {
    if (busy) return;
    busy = true;
    const owner = C.address(),
      s = selected;
    const contribution = kind === 'invest' ? C.units(amount, s.decimals).toString() : null;
    host.querySelectorAll('button,input').forEach((x) => (x.disabled = true));
    try {
      const signature = await fn();
      const entries = read(':history');
      const ownerEntries = entries[owner] || [];
      ownerEntries.push({
        signature,
        kind,
        authority: s?.authority || owner,
        offeringId: s?.offeringId.toString(),
        amount: kind === 'invest' ? contribution : kind === 'refund' ? s.position.toString() : null,
        time: new Date().toISOString(),
      });
      entries[owner] = ownerEntries;
      try {
        localStorage.setItem(key + ':history', JSON.stringify(entries));
      } catch {
        /* Chain signatures remain the source of truth. */
      }

      if (owner !== C.address()) {
        await render();
        return;
      }
      after?.();
      frame(
        t('Transação confirmada', 'Transaction confirmed'),
        `<section class="card"><h2>${kind === 'refund' ? t('Reembolso concluído', 'Refund completed') : kind === 'release' ? t('Capital liberado', 'Capital released') : kind === 'invest' ? t('Investimento confirmado', 'Investment confirmed') : t('Operação concluída', 'Operation completed')}</h2>${proof(signature)}<div class="actions">${s && ['invest', 'refund'].includes(kind) ? link(t('Ver meu investimento', 'View my investment'), href('portfolio', s)) : ''}${button(t('Atualizar dados', 'Refresh data'), 'refresh')}</div></section>`,
      );
      await C.list();
    } catch (e) {
      error(e);
    } finally {
      busy = false;
      host.querySelectorAll('button,input').forEach((x) => (x.disabled = false));
    }
  }
  async function action(kind) {
    try {
      if (kind === 'connect') {
        await C.connect(host.querySelector('#wallet-kind').value.toLowerCase());
        return;
      }
      if (kind === 'disconnect') {
        await C.disconnect();
        return;
      }
      if (kind === 'refresh') {
        await render();
        return;
      }
      if (kind === 'checkout') {
        checkout();
        return;
      }
      if (['overview', 'terms', 'updates'].includes(kind)) {
        host.querySelector('#opportunity-tab').innerHTML =
          kind === 'terms'
            ? `<h2>${t('Termos da oferta', 'Offering terms')}</h2><p>${t('Depósitos em token SPL de teste. Reembolso integral somente após falha. Capital liberado integralmente após a meta. Sem cancelamento enquanto aberta, equity ou SAFE.', 'SPL test token deposits. Full refunds only after failure. Full capital release after the target. No cancellation while open, equity or SAFE.')}</p>`
            : kind === 'updates'
              ? `<p>${t('Nenhuma atualização publicada.', 'No updates published.')}</p>`
              : `<p>${esc(meta(selected).description || t('Apresentação não disponível.', 'Presentation unavailable.'))}</p>`;
        return;
      }
      if (kind.endsWith('-review')) {
        const s = selected,
          operation = {
            'fail-review': 'fail_offering',
            'release-review': 'release',
            'refund-review': 'refund',
          }[kind];
        frame(
          t('Revise a operação', 'Review the action'),
          `<section class="card"><h2>${esc(name(s))}</h2><p>${operation === 'fail_offering' ? t('Novos aportes serão bloqueados e os investidores poderão solicitar reembolso.', 'New contributions will be blocked and investors can request refunds.') : operation === 'refund' ? t('Todo o saldo da sua posição será reembolsado: ', 'Your entire position will be refunded: ') + money(s.position, s) : t('Todo o saldo do cofre será enviado para a conta de tokens da carteira criadora: ', 'The entire vault balance will be sent to the creator wallet token account: ') + money(s.vaultBalance, s) + ' · ' + esc(short(s.authority))}</p>${button(t('Confirmar e assinar', 'Confirm and sign'), operation)}${button(t('Voltar', 'Back'), 'refresh')}</section>`,
        );
        return;
      }
      if (['invest', 'refund', 'release', 'fail_offering'].includes(kind))
        await transact(kind, () => C.act(kind, selected.authority, amount, selected.offeringId));
    } catch (e) {
      error(e);
    }
  }
  window.addEventListener('raftt:wallet-change', () => {
    revision++;
    selected = null;
    amount = null;
    balance = 0n;
    render();
  });
  window.addEventListener('raftt:transaction-phase', (e) =>
    status(
      {
        wallet: t('Aguardando aprovação na carteira', 'Waiting for wallet approval'),
        sending: t('Enviando transação', 'Sending transaction'),
        confirming: t('Confirmando transação', 'Confirming transaction'),
      }[e.detail],
    ),
  );
  render();
})();
