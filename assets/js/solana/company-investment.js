(() => {
  'use strict';
  const C = window.RafttChain,
    V = window.RafttV2;
  const t = (pt, en) => window.RafttBackend.t(pt, en);
  const esc = (x) =>
    String(x ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  let linked,
    state,
    revision = 0,
    busy = false,
    review = null,
    feedback = '';
  const host = () => document.getElementById('company-investment');
  const fmt = (n) => C.format(n, state.decimals);
  function render() {
    const root = host();
    if (!root) return;
    const me = C.address();
    const statuses = [
      t('Rascunho', 'Draft'),
      t('Captação aberta', 'Fundraising open'),
      t('Captação concluída', 'Fundraising complete'),
      t('Falhada', 'Failed'),
    ];
    if (!state) {
      root.textContent =
        feedback || t('Consultando a rodada na Solana…', 'Loading the round from Solana…');
      return;
    }
    const open = state.status === 1 && state.now < state.deadline && state.raised < state.cap;
    const cancel = state.status === 1 && state.now < state.deadline - 172800 && state.position > 0n;
    const refund = state.status === 3 && state.position > 0n;
    const button = (action, label) =>
      `<button type="button" class="button secondary" data-chain-action="${action}" ${busy ? 'disabled' : ''}>${label}</button>`;
    root.innerHTML = `<h3>${statuses[state.status]}</h3><div class="row"><span>${t('Captado / limite', 'Raised / cap')}</span><strong>${fmt(state.raised)} / ${fmt(state.cap)}</strong></div><div class="row"><span>${t('Mínimo para concluir', 'Minimum for success')}</span><strong>${fmt(state.minimum)}</strong></div><p>${t('Encerramento', 'Deadline')}: ${esc(new Date(state.deadline * 1000).toLocaleString())}</p><p>${t('Minha posição', 'My position')}: ${me ? fmt(state.position) : '—'}</p><p class="muted">${t('Tokens SPL de teste. A posição registra aportes; não representa equity emitido ou saldo disponível.', 'SPL test tokens. The position records contributions; it does not represent issued equity or an available balance.')}</p><div class="actions">${me ? button('disconnect', t('Desconectar carteira', 'Disconnect wallet')) : `<select id="company-wallet-provider" aria-label="Wallet"><option value="phantom">Phantom</option><option value="solflare">Solflare</option></select>${button('connect', t('Conectar carteira', 'Connect wallet'))}`}${button('refresh', t('Atualizar', 'Refresh'))}</div>${me && (open || cancel) ? `<label>${t('Valor em tokens · use ponto decimal', 'Token amount · use a decimal point')}<input id="company-token-amount" inputmode="decimal" ${busy ? 'disabled' : ''}></label>` : ''}<div class="actions">${me && open ? button('review-invest', t('Revisar investimento', 'Review investment')) : ''}${me && cancel ? button('review-cancel', t('Revisar cancelamento', 'Review cancellation')) : ''}${me && refund ? button('review-refund', t('Revisar reembolso', 'Review refund')) : ''}</div>${review ? `<section class="card"><h3>${t('Confirme a operação', 'Confirm the operation')}</h3><p>${esc(review.label)} · ${esc(review.amount)} ${t('tokens', 'tokens')}</p><p>${t('A carteira assina; a operação depende da confirmação da Solana.', 'The wallet signs; the operation depends on Solana confirmation.')}</p><div class="actions">${review.kind === 'invest' && review.terms ? `<p>${esc(review.terms.description || JSON.stringify(review.terms))}</p><label><input type="checkbox" id="company-accept-terms">${t('Li e aceito os termos desta rodada.', 'I have read and accept this round’s terms.')}</label>` : ''}${button('confirm', t('Confirmar e assinar', 'Confirm and sign'))}${button('back', t('Voltar', 'Back'))}</div></section>` : ''}<p role="status" aria-live="polite">${esc(feedback)}</p>`;
    root
      .querySelectorAll('[data-chain-action]')
      .forEach((b) => (b.onclick = () => action(b.dataset.chainAction)));
  }
  async function reload() {
    const run = ++revision,
      owner = C.address();
    state = null;
    render();
    try {
      const loaded = await V.load(linked.chain_address);
      if (run !== revision || owner !== C.address()) return;
      if (loaded.mint !== linked.mint || loaded.decimals !== Number(linked.decimals))
        throw Error(
          t(
            'O token da rodada difere do cadastro. O investimento foi bloqueado.',
            'The round token differs from company records. Investment was blocked.',
          ),
        );
      state = loaded;
    } catch (e) {
      if (run !== revision) return;
      feedback = e.message;
    }
    render();
  }
  async function action(name) {
    if (busy) return;
    if (name === 'back') {
      review = null;
      render();
      return;
    }
    if (name.startsWith('review-')) {
      try {
        if (!C.address() || !state)
          throw Error(
            t(
              'Conecte a carteira e atualize a rodada.',
              'Connect your wallet and refresh the round.',
            ),
          );
        const kind = name.slice(7),
          amount =
            kind === 'refund'
              ? fmt(state.position)
              : host().querySelector('#company-token-amount').value;
        C.units(amount, state.decimals);
        const registered =
          window.RafttApi && linked.id
            ? await window.RafttApi.request('/v1/rounds/' + linked.id)
            : null;
        review = {
          terms: registered?.terms,
          termsVersion: registered?.terms_version,
          kind,
          amount,
          owner: C.address(),
          label: {
            invest: t('Investimento', 'Investment'),
            cancel: t('Cancelamento', 'Cancellation'),
            refund: t('Reembolso integral', 'Full refund'),
          }[kind],
        };
        feedback = '';
      } catch (e) {
        feedback = e.message;
      }
      render();
      return;
    }
    const provider = host()?.querySelector('#company-wallet-provider')?.value;
    const chosen = review;
    const acceptedTerms = !!host()?.querySelector('#company-accept-terms')?.checked;
    busy = true;
    feedback = t('Processando…', 'Processing…');
    render();
    try {
      if (name === 'connect') await C.connect(provider);
      if (name === 'disconnect') await C.disconnect();
      if (name === 'confirm') {
        if (!chosen || chosen.owner !== C.address())
          throw Error(t('A carteira mudou. Revise novamente.', 'Wallet changed. Review again.'));
        let wallet;
        if (window.RafttApi && linked.id) {
          if (chosen.kind === 'invest' && !acceptedTerms)
            throw Error(
              t('Aceite os termos antes de investir.', 'Accept the terms before investing.'),
            );
          wallet = await window.RafttApi.verifyWallet();
          if (chosen.kind === 'invest')
            await window.RafttApi.request('/v1/rounds/' + linked.id + '/terms', {
              termsVersion: chosen.termsVersion,
            });
        }
        if (chosen.owner !== C.address())
          throw Error(t('A carteira mudou. Revise novamente.', 'Wallet changed. Review again.'));
        const signature = await V.act(
          { invest: 'invest_round', cancel: 'cancel_round', refund: 'refund_round' }[chosen.kind],
          linked.chain_address,
          { amount: chosen.amount },
        );
        feedback = t('Transação confirmada: ', 'Transaction confirmed: ') + signature;
        if (wallet) {
          try {
            await window.RafttApi.recordConfirmed(
              linked.id,
              { invest: 'invest_round', cancel: 'cancel_round', refund: 'refund_round' }[
                chosen.kind
              ],
              signature,
              wallet.id,
            );
          } catch (error) {
            feedback +=
              t(' · Registro no banco pendente. ', ' · Database registration pending. ') +
              error.message;
          }
        }
      } else feedback = '';
      review = null;
      await reload();
    } catch (e) {
      feedback = e.code === 4001 ? t('Assinatura recusada.', 'Signature rejected.') : e.message;
    } finally {
      busy = false;
      render();
    }
  }
  window.addEventListener('raftt:catalog-round', (e) => {
    linked = e.detail;
    review = null;
    feedback = '';
    reload();
  });
  window.addEventListener('raftt:wallet-change', () => {
    ++revision;
    state = null;
    review = null;
    feedback = '';
    if (linked && !busy) reload();
    else render();
  });
  window.addEventListener('raftt:transaction-phase', (e) => {
    feedback =
      {
        wallet: t('Confirme na carteira…', 'Confirm in your wallet…'),
        sending: t('Enviando transação…', 'Sending transaction…'),
        confirming: t('Aguardando confirmação…', 'Waiting for confirmation…'),
      }[e.detail] || '';
    render();
  });
})();
