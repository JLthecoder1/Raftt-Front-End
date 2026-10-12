(() => {
  'use strict';
  const B = window.RafttBackend;
  const t = (pt, en) => B.t(pt, en);
  const englishErrors = {
    ai_unconfigured:
      'Configure the AI provider, API key and model in the backend to run a real analysis.',
    ai_invalid: 'The AI returned an invalid analysis.',
    ai_incomplete: 'The AI analysis was not completed.',
    unauthorized: 'Sign in again to continue.',
    forbidden: 'Your account does not have permission for this action.',
    approval_required: 'The current application or decision must be approved by RAFTT.',
    wrong_review_wallet: 'Connect the RAFTT authority wallet configured in the contract.',
    challenge_expired: 'The wallet challenge expired or was already used. Try again.',
    invalid_wallet_signature: 'The wallet signature is invalid.',
    draft_expired:
      'The creation draft expired. Check the existing transaction before creating another round.',
    rate_limit: 'Too many requests. Try again in a minute.',
    invalid_deadline: 'The deadline must be more than 48 hours away.',
    invalid_budget: 'Check the minimum and cap amounts.',
    stale_evidence: 'The evidence changed. A new review is required.',
    stale_report: 'The report did not analyze this evidence version. Run a new analysis.',
    release_unavailable: 'The installment must be authorized and next in the payment order.',
    deadline_not_reached: 'The round must be open and its deadline reached on Solana.',
    open_round_required: 'The company needs an open, valid round before publication.',
    round_required: 'Link a round to the company before publication.',
    terms_changed: 'Review the current version of the round terms.',
    superseded: 'Use the latest application or decision.',
    internal_error: 'The backend could not complete this request.',
  };
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  function baseUrl() {
    const value = window.RafttApiConfig?.baseUrl;
    if (!value)
      throw Error(
        t(
          'Configure o endereço do backend em api-config.js.',
          'Configure the backend URL in api-config.js.',
        ),
      );
    const url = new URL(value);
    if (
      url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
    )
      throw Error(
        t(
          'O backend exige HTTPS fora do ambiente local.',
          'The backend requires HTTPS outside localhost.',
        ),
      );
    return url;
  }
  async function request(path, body) {
    const session = B.fail(await B.db.auth.getSession()).session;
    if (!session) throw Error(t('Entre na sua conta.', 'Sign in to your account.'));
    const base = baseUrl();
    const url = new URL(path, base);
    if ((!path.startsWith('/v1/') && path !== '/health') || url.origin !== base.origin)
      throw Error(t('Endpoint da API inválido.', 'Invalid API endpoint.'));
    let response;
    const send = (token) =>
      fetch(url, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(70000),
      });
    try {
      response = await send(session.access_token);
      if (response.status === 401 && typeof B.db.auth.refreshSession === 'function') {
        const refreshed = await B.db.auth.refreshSession();
        const renewed = refreshed.data?.session;
        if (!refreshed.error && renewed?.access_token && renewed.user?.id === session.user?.id) {
          await response.body?.cancel();
          response = await send(renewed.access_token);
        }
      }
    } catch (error) {
      if (error.name === 'TimeoutError')
        throw Error(
          t(
            'A consulta demorou demais. Atualize antes de repetir uma ação.',
            'The request timed out. Refresh before repeating an action.',
          ),
        );
      throw Error(
        t(
          'Não foi possível acessar o backend. Mantenha npm start aberto e confira o endereço configurado.',
          'Could not reach the backend. Keep npm start running and check the configured URL.',
        ),
      );
    }
    let result;
    try {
      result = await response.json();
    } catch {
      throw Error(t('Resposta inválida do backend.', 'Invalid backend response.'));
    }
    if (!response.ok) {
      const supplied = result.error?.message || 'Falha na API.';
      const error = Error(t(supplied, englishErrors[result.error?.code] || supplied));
      error.code = result.error?.code;
      throw error;
    }
    return path === '/health' ? result : result.data;
  }
  async function sessionUser() {
    return (await B.user()).id;
  }
  let verified = null;
  async function verifyWallet() {
    const C = window.RafttChain,
      provider = C?.provider(),
      owner = C?.address(),
      userId = await sessionUser();
    if (!provider?.signMessage || !owner)
      throw Error(
        t(
          'Conecte sua carteira para verificar a assinatura.',
          'Connect your wallet to verify its signature.',
        ),
      );
    if (verified?.address === owner && verified.userId === userId) return verified.wallet;
    const existing = (await request('/v1/wallets')).find((w) => w.address === owner);
    if (existing) {
      if (C.address() !== owner || (await sessionUser()) !== userId)
        throw Error(
          t(
            'A conta ou carteira mudou. Tente novamente.',
            'The account or wallet changed. Try again.',
          ),
        );
      verified = { address: owner, userId, wallet: existing };
      return existing;
    }
    const challenge = await request('/v1/wallets/challenges', { address: owner });
    const result = await provider.signMessage(new TextEncoder().encode(challenge.message), 'utf8');
    if (C.address() !== owner || (await sessionUser()) !== userId)
      throw Error(
        t(
          'A conta ou carteira mudou. Tente novamente.',
          'The account or wallet changed. Try again.',
        ),
      );
    let binary = '';
    for (const byte of result.signature || result) binary += String.fromCharCode(byte);
    const wallet = await request('/v1/wallets/verify', {
      challengeId: challenge.id,
      signature: btoa(binary),
    });
    verified = { address: owner, userId, wallet };
    return wallet;
  }
  async function signPrepared(prepared) {
    const C = window.RafttChain,
      provider = C?.provider(),
      owner = C?.address(),
      userId = await sessionUser(),
      W = window.solanaWeb3;
    if (!provider?.signTransaction || !owner || !W)
      throw Error(t('Conecte sua carteira.', 'Connect your wallet.'));
    await window.RafttV2Bridge.ready();
    const tx = W.Transaction.from(
      Uint8Array.from(atob(prepared.transaction), (c) => c.charCodeAt(0)),
    );
    if (
      tx.feePayer?.toBase58() !== owner ||
      tx.instructions.some(
        (ix) =>
          ![
            window.RafttSolanaConfig.programId,
            'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          ].includes(ix.programId.toBase58()),
      )
    )
      throw Error(
        t(
          'A transação recebida não corresponde à carteira ou ao programa configurado.',
          'The received transaction does not match the configured wallet or program.',
        ),
      );
    window.dispatchEvent(new CustomEvent('raftt:transaction-phase', { detail: 'wallet' }));
    const signed = await provider.signTransaction(tx);
    if (C.address() !== owner || (await sessionUser()) !== userId)
      throw Error(
        t(
          'A conta ou carteira mudou. A transação não foi enviada.',
          'The account or wallet changed. The transaction was not sent.',
        ),
      );
    const rpc = window.RafttV2Bridge.rpc();
    const signature = await rpc.sendRawTransaction(signed.serialize(), { skipPreflight: false });
    window.dispatchEvent(new CustomEvent('raftt:transaction-sent', { detail: signature }));
    // Persist a submitted signature immediately: a timeout must not cause a second payment.
    return {
      signature,
      blockhash: tx.recentBlockhash,
      lastValidBlockHeight: prepared.last_valid_block_height,
    };
  }
  const pendingKey = (userId) => 'raftt-backend-pending:' + userId;
  async function pending() {
    try {
      return JSON.parse(localStorage.getItem(pendingKey(await sessionUser()))) || [];
    } catch {
      return [];
    }
  }
  async function storePending(item) {
    const user = await sessionUser(),
      rows = await pending();
    rows.push(item);
    localStorage.setItem(pendingKey(user), JSON.stringify(rows));
    window.dispatchEvent(new Event('raftt:pending-registration'));
  }
  async function removePending(id) {
    localStorage.setItem(
      pendingKey(await sessionUser()),
      JSON.stringify((await pending()).filter((x) => x.id !== id)),
    );
  }
  async function finish(item) {
    const status = (
      await window.RafttV2Bridge.rpc().getSignatureStatuses([item.signature], {
        searchTransactionHistory: true,
      })
    ).value[0];
    if (status?.err) {
      await removePending(item.id);
      throw Error(t('Transação falhou na Solana.', 'Transaction failed on Solana.'));
    }
    if (item.blockhash && status?.confirmationStatus !== 'finalized') {
      const result = await window.RafttV2Bridge.rpc().confirmTransaction(
        {
          signature: item.signature,
          blockhash: item.blockhash,
          lastValidBlockHeight: item.lastValidBlockHeight,
        },
        'finalized',
      );
      if (result.value.err) {
        await removePending(item.id);
        throw Error(t('Transação falhou na Solana.', 'Transaction failed on Solana.'));
      }
    }
    const result = await request(item.path, item.body);
    await removePending(item.id);
    window.dispatchEvent(new CustomEvent('raftt:backend-synced', { detail: result }));
    return result;
  }
  async function submitPrepared(prepared, path, body) {
    const operation =
      body.operation ||
      (path.endsWith('/register')
        ? 'create_round'
        : path.endsWith('/milestones')
          ? 'add_milestone'
          : null);
    if (!operation)
      throw Error(
        t('Operação de assinatura não identificada.', 'Signing operation was not identified.'),
      );
    const transaction = window.solanaWeb3.Transaction.from(
      Uint8Array.from(atob(prepared.transaction), (c) => c.charCodeAt(0)),
    );
    const instructions = transaction.instructions.filter(
      (ix) => ix.programId.toBase58() === window.RafttSolanaConfig.programId,
    );
    const discriminator = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode('global:' + operation)),
    ).slice(0, 8);
    if (instructions.length !== 1 || !discriminator.every((n, i) => instructions[0].data[i] === n))
      throw Error(
        t(
          'A instrução recebida difere da operação escolhida.',
          'The received instruction differs from the selected operation.',
        ),
      );
    const submitted = await signPrepared(prepared);
    const item = {
      id: crypto.randomUUID(),
      path,
      body: { ...body, signature: submitted.signature },
      ...submitted,
    };
    await storePending(item);
    try {
      return { result: await finish(item), signature: item.signature };
    } catch (error) {
      error.message =
        t(
          'Transação enviada. O registro está pendente; use “Retomar registro”, sem enviar outra transação. ',
          'Transaction sent. Registration is pending; use “Resume registration” without sending another transaction. ',
        ) + error.message;
      throw error;
    }
  }
  async function createLinkedRound(params) {
    if ((await pending()).length)
      throw Error(
        t(
          'Retome os registros pendentes antes de criar uma rodada.',
          'Resume pending registrations before creating a round.',
        ),
      );
    const wallet = await verifyWallet(),
      prepared = await request('/v1/rounds/prepare', { ...params, walletId: wallet.id });
    return submitPrepared(prepared, '/v1/rounds/register', { draftId: prepared.draftId });
  }
  async function operation(roundId, operation, prepared, sequence) {
    const wallet = await verifyWallet();
    return submitPrepared(prepared, '/v1/rounds/' + roundId + '/transactions', {
      walletId: wallet.id,
      operation,
      ...(sequence === undefined ? {} : { sequence }),
    });
  }
  async function recordConfirmed(roundId, operation, signature, walletId, sequence) {
    const item = {
      id: crypto.randomUUID(),
      path: '/v1/rounds/' + roundId + '/transactions',
      signature,
      body: { signature, operation, walletId, ...(sequence === undefined ? {} : { sequence }) },
    };
    await storePending(item);
    return finish(item);
  }
  window.addEventListener('raftt:wallet-change', () => {
    verified = null;
  });
  window.addEventListener('raftt:auth-signout', () => {
    verified = null;
  });
  window.RafttApi = {
    request,
    verifyWallet,
    signPrepared,
    submitPrepared,
    createLinkedRound,
    operation,
    recordConfirmed,
    pending,
    resume: finish,
    t,
    esc,
  };
})();
