(() => {
  'use strict';
  const page = window.RafttRoutes?.page;
  const admin = page === 'admin-review.html';
  if (!admin && !['company-dashboard.html', 'milestone-releases.html'].includes(page)) return;
  const A = window.RafttApi,
    B = window.RafttBackend,
    C = window.RafttChain,
    V = window.RafttV2;
  const t = A.t,
    esc = A.esc;
  let root,
    company,
    app,
    round,
    chain,
    report,
    busy = false,
    epoch = 0;
  const $ = (id) => root.querySelector('#' + id);
  const button = (id, pt, en, secondary = false) =>
    `<button type="button" id="${id}" ${secondary ? 'class="secondary"' : ''}>${t(pt, en)}</button>`;
  const label = (name, pt, en, options = '') =>
    `<label>${t(pt, en)}<input name="${name}" required ${options}></label>`;
  const field = (name, pt, en) =>
    `<label>${t(pt, en)}<textarea name="${name}" required maxlength="5000"></textarea></label>`;
  const phase = (status) =>
    ({
      submitted: t('Enviada', 'Submitted'),
      draft: t('Rascunho', 'Draft'),
      published: t('Publicada', 'Published'),
      archived: t('Arquivada', 'Archived'),
      changes_requested: t('Ajustes solicitados', 'Changes requested'),
      reviewing: t('Em revisão', 'Under review'),
      approved: t('Aprovada', 'Approved'),
      rejected: t('Rejeitada', 'Rejected'),
    })[status] || status;
  async function query(table, prepare) {
    return B.fail(await prepare(B.db.from(table)));
  }
  function message(text) {
    const target = $('api-feedback');
    if (target) target.textContent = text;
  }
  function buttons() {
    root?.querySelectorAll('button,input,select,textarea').forEach((el) => {
      el.disabled = busy || el.dataset.blocked === 'true';
    });
  }
  async function run(fn) {
    if (busy) return;
    busy = true;
    buttons();
    message(
      t(
        'Processando… confirme na carteira quando solicitado.',
        'Processing… confirm in your wallet when requested.',
      ),
    );
    try {
      const result = await fn();
      message(typeof result === 'string' ? result : t('Dados atualizados.', 'Data updated.'));
    } catch (e) {
      message(e.code === 4001 ? t('Assinatura recusada.', 'Signature rejected.') : e.message);
    } finally {
      busy = false;
      buttons();
      await showPending().catch(() => {});
    }
  }
  function bind(id, fn) {
    const el = $(id);
    if (el) el.onclick = () => run(fn);
  }
  async function showPending() {
    if (!$('api-pending')) return;
    const items = await A.pending();
    $('api-pending').replaceChildren();
    for (const item of items) {
      const row = document.createElement('p'),
        b = document.createElement('button');
      row.className = 'api-address';
      row.append(t('Registro pendente: ', 'Pending registration: ') + item.signature + ' ');
      b.textContent = t('Retomar registro', 'Resume registration');
      b.onclick = () =>
        run(async () => {
          await A.resume(item);
          await selectCompany(company?.id);
          return t(
            'Registro concluído, sem nova transação.',
            'Registration completed without another transaction.',
          );
        });
      row.append(b);
      $('api-pending').append(row);
    }
  }
  async function init() {
    if (!window.RafttAccountReady) return;
    const token = ++epoch;
    if (!root) {
      root = admin
        ? document.querySelector('[data-review-workspace]')
        : document.createElement('section');
      root.id = 'company-chain-rounds';
      root.classList.add('api-workspace');
      root.setAttribute('data-i18n-skip', '');
      if (!admin) document.querySelector('main')?.append(root);
    }
    root.innerHTML = `<p class="eyebrow">RAFTT · ${esc(window.RafttSolanaConfig.network)}</p><h2>${admin ? t('Revisão e autorizações', 'Review and authorizations') : t('Empresa, captação e parcelas', 'Company, fundraising and installments')}</h2><p class="api-note">${t('Dados do banco e transações reais de teste na devnet. A assinatura da carteira confirma cada operação financeira.', 'Database records and real devnet test transactions. Wallet signatures confirm each financial operation.')}</p><p id="api-feedback" class="api-message" role="status" aria-live="polite"></p><div id="api-pending"></div><div class="api-actions"><select id="api-provider" aria-label="Wallet"><option value="phantom">Phantom</option><option value="solflare">Solflare</option></select>${button('api-connect', 'Conectar carteira', 'Connect wallet')}${button('api-refresh', 'Atualizar', 'Refresh', true)}</div><p id="api-wallet" class="api-address"></p><label>${t('Empresa', 'Company')}<select id="api-company"></select></label><div id="api-company-content"></div>`;
    bind('api-connect', async () => {
      if (C.address()) await C.disconnect();
      else await C.connect($('api-provider').value);
      renderWallet();
    });
    bind('api-refresh', () => selectCompany(company?.id));
    renderWallet();
    try {
      const user = await B.user();
      if (admin) {
        const staff = await query('platform_staff', (q) =>
          q.select('role').eq('user_id', user.id).maybeSingle(),
        );
        if (!staff)
          throw Error(t('Área exclusiva da equipe RAFTT.', 'RAFTT staff access required.'));
      }
      const companies = await query('companies', (q) => {
        let a = q.select('id,name').order('created_at', { ascending: false }).limit(200);
        return admin ? a : a.eq('owner_id', user.id);
      });
      if (token !== epoch) return;
      $('api-company').innerHTML = companies
        .map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`)
        .join('');
      $('api-company').onchange = () => run(() => selectCompany($('api-company').value));
      if (!companies.length) {
        $('api-company-content').innerHTML =
          `<p>${t('Nenhuma empresa cadastrada.', 'No registered companies.')}</p>${!admin ? `<a href="/company-application">${t('Cadastrar empresa', 'Register company')}</a>` : ''}`;
        return;
      }
      await selectCompany(
        companies.some((c) => c.id === company?.id) ? company.id : companies[0].id,
      );
      await showPending();
    } catch (e) {
      message(e.message);
    }
  }
  function renderWallet() {
    if (!$('api-wallet')) return;
    $('api-wallet').textContent = C.address()
      ? t('Carteira: ', 'Wallet: ') + C.address()
      : t('Carteira desconectada.', 'Wallet disconnected.');
    $('api-connect').textContent = C.address()
      ? t('Desconectar', 'Disconnect')
      : t('Conectar carteira', 'Connect wallet');
  }
  async function selectCompany(id) {
    if (!id) return;
    const token = ++epoch;
    company = await A.request('/v1/companies/' + id);
    const applications = await A.request('/v1/companies/' + id + '/applications');
    if (token !== epoch) return;
    app = applications[0] || null;
    report = null;
    round = null;
    chain = null;
    $('api-company').value = id;
    const rounds = await query('rounds', (q) =>
      q
        .select('id,chain_address')
        .eq('company_id', id)
        .eq('network', window.RafttSolanaConfig.network)
        .eq('program_id', window.RafttSolanaConfig.programId)
        .order('created_at', { ascending: false })
        .limit(100),
    );
    if (token !== epoch) return;
    $('api-company-content').innerHTML =
      `<h3>${esc(company.name)}</h3><p>${t('Publicação', 'Publication')}: ${esc(phase(company.publication_status))}</p><section id="api-application"></section><section id="api-create"></section><label>${t('Rodada registrada', 'Registered round')}<select id="api-round"><option value="">${t('Selecione uma rodada', 'Select a round')}</option>${rounds.map((r) => `<option value="${esc(r.id)}">${esc(r.chain_address)}</option>`).join('')}</select></label><div id="api-round-content"></div>`;
    await renderApplication();
    if (token !== epoch || !window.RafttAccountReady) return;
    renderCreate();
    $('api-round').onchange = () => run(() => selectRound($('api-round').value));
    const requested = new URLSearchParams(location.search).get('round');
    const selected = rounds.find((r) => r.id === requested)?.id || rounds[0]?.id;
    if (selected) await selectRound(selected);
  }
  async function renderApplication() {
    const target = $('api-application'),
      generation = epoch;
    if (!target) return;
    if (!app) {
      target.innerHTML = `<p>${t('A empresa ainda não enviou uma candidatura.', 'The company has not submitted an application.')}</p>`;
      return;
    }
    const reviews = await query('review_decisions', (q) =>
      q
        .select('reason,decision,created_at')
        .eq('application_id', app.id)
        .order('created_at', { ascending: false })
        .limit(10),
    );
    const docs = await query('documents', (q) =>
      q.select('id,name,bucket,object_path').eq('company_id', company.id).limit(100),
    );
    const savedReports = await query('ai_reports', (q) =>
      q
        .select('id,report,canonical_input,input_hash')
        .eq('application_id', app.id)
        .order('created_at', { ascending: false })
        .limit(1),
    );
    if (generation !== epoch || !window.RafttAccountReady) return;
    report = savedReports[0] || null;
    target.innerHTML = `<h3>${t('Candidatura', 'Application')} · v${esc(app.version)}</h3><p>${phase(app.status)}</p><details><summary>${t('Informações enviadas', 'Submitted information')}</summary><pre id="api-payload"></pre><div id="api-documents"></div></details>${reviews.map((d) => `<p>${esc(phase(d.decision))} · ${esc(d.reason)}</p>`).join('')}${admin ? `<div class="api-actions">${button('api-analyze', 'Analisar com IA', 'Analyze with AI')}</div><p class="api-note">${t('O agente analisa os envios automaticamente e aponta riscos e pendências. A RAFTT registra a decisão e autoriza as operações.', 'The agent analyzes submissions automatically and identifies risks and missing information. RAFTT records decisions and authorizes operations.')}</p><label>${t('Justificativa da decisão', 'Decision rationale')}<textarea id="api-reason" maxlength="5000"></textarea></label><div class="api-actions">${button('api-approve', 'Aprovar candidatura', 'Approve application')}${button('api-changes', 'Solicitar ajustes', 'Request changes', true)}${button('api-reject', 'Rejeitar', 'Reject', true)}</div>` : ''}<div id="api-agent-status"></div><div id="api-report" hidden></div>`;
    if (report) window.RafttAgent?.report($('api-report'), report.report);
    window.RafttAgent?.mount($('api-agent-status'), company.id, app.id, 'application', (row) => {
      report = row;
      window.RafttAgent.report($('api-report'), row.report);
    });
    $('api-payload').textContent = JSON.stringify(app.payload, null, 2);
    for (const doc of docs) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary';
      b.textContent = doc.name;
      b.onclick = () =>
        run(async () => {
          const result = B.fail(
            await B.db.storage.from(doc.bucket).createSignedUrl(doc.object_path, 60),
          );
          window.open(result.signedUrl, '_blank', 'noopener,noreferrer');
        });
      $('api-documents').append(b);
    }
    if (!admin) return;
    bind('api-analyze', async () => {
      report = await A.request('/v1/applications/' + app.id + '/analyze', {});
      $('api-report').hidden = false;
      if (window.RafttAgent) window.RafttAgent.report($('api-report'), report.report);
      else $('api-report').textContent = JSON.stringify(report.report, null, 2);
      return t(
        'Análise salva. Revise o relatório antes de decidir.',
        'Analysis saved. Review the report before deciding.',
      );
    });
    for (const [id, decision] of [
      ['api-approve', 'approved'],
      ['api-changes', 'changes_requested'],
      ['api-reject', 'rejected'],
    ])
      bind(id, async () => {
        const reason = $('api-reason').value.trim();
        if (!reason) throw Error(t('Informe a justificativa.', 'Enter a rationale.'));
        await A.request('/v1/applications/' + app.id + '/decisions', {
          decision,
          reason,
          ...(report ? { reportId: report.id } : {}),
        });
        await selectCompany(company.id);
        return t('Decisão registrada no banco.', 'Decision recorded in the database.');
      });
  }
  function renderCreate() {
    if (admin) return;
    if (app?.status !== 'approved') {
      $('api-create').innerHTML =
        `<p class="api-note">${t('A criação da rodada será habilitada após a aprovação da candidatura atual pela RAFTT.', 'Round creation becomes available after RAFTT approves the current application.')}</p>`;
      return;
    }
    $('api-create').innerHTML =
      `<details><summary>${t('Criar rodada vinculada à empresa', 'Create a company-linked round')}</summary><form id="api-create-form"><div class="api-grid">${label('mint', 'Mint SPL da devnet', 'Devnet SPL mint', 'maxlength="44"')}${label('recipient', 'Carteira destinatária', 'Recipient wallet', 'maxlength="44"')}${label('minimum', 'Mínimo em tokens', 'Minimum in tokens', 'inputmode="decimal" placeholder="10.00"')}${label('cap', 'Limite em tokens', 'Cap in tokens', 'inputmode="decimal" placeholder="50.00"')}${label('deadline', 'Prazo de encerramento', 'Closing deadline', 'type="datetime-local"')}<label>${t('Instrumento declarado', 'Declared instrument')}<select name="instrument"><option value="equity">Equity</option><option value="safe">SAFE</option><option value="convertible">${t('Conversível', 'Convertible')}</option></select></label></div>${field('terms', 'Condições da rodada', 'Round terms')}<p class="api-note">${t('Use ponto decimal. O prazo deve estar a mais de 48 horas. O instrumento é um metadado; este contrato não emite participação societária.', 'Use a decimal point. The deadline must be more than 48 hours away. The instrument is metadata; this contract does not issue equity.')}</p><button>${t('Revisar e criar rodada', 'Review and create round')}</button></form><div id="api-create-review"></div></details>`;
    $('api-create-form').onsubmit = (e) => {
      e.preventDefault();

      // Leia os campos antes de run() desativá-los.
      const values = Object.fromEntries(new FormData(e.currentTarget));

      run(async () => {
        const info = await window.RafttV2Bridge.mintInfo(values.mint.trim());
        const params = {
          applicationId: app.id,
          mint: values.mint.trim(),
          recipient: values.recipient.trim(),
          minimumUnits: C.units(values.minimum, info.decimals).toString(),
          capUnits: C.units(values.cap, info.decimals).toString(),
          deadline: new Date(values.deadline).toISOString(),
          instrument: values.instrument,
          terms: { description: values.terms.trim() },
        };
        if (
          BigInt(params.minimumUnits) <= 0n ||
          BigInt(params.capUnits) < BigInt(params.minimumUnits)
        )
          throw Error(t('Confira mínimo e limite.', 'Check minimum and cap.'));
        $('api-create-review').innerHTML =
          `<p>${t('Confirme os termos antes de assinar:', 'Confirm the terms before signing:')} ${esc(values.minimum)} / ${esc(values.cap)} · ${esc(params.deadline)}</p><p class="api-address">${t('Destinatário', 'Recipient')}: ${esc(params.recipient)}<br>Mint: ${esc(params.mint)}</p>${button('api-create-confirm', 'Confirmar e assinar', 'Confirm and sign')}`;
        bind('api-create-confirm', async () => {
          const result = await A.createLinkedRound(params);
          await selectCompany(company.id);
          return (
            t('Rodada criada e vinculada. Transação: ', 'Round created and linked. Transaction: ') +
            result.signature
          );
        });
        return t(
          'Revise os valores e o destinatário abaixo do formulário.',
          'Review the amounts and recipient below the form.',
        );
      });
    };
  }
  async function selectRound(id) {
    const target = $('api-round-content');
    if (!id) {
      round = null;
      chain = null;
      target.replaceChildren();
      return;
    }
    $('api-round').value = id;
    const token = ++epoch;
    const record = await A.request('/v1/rounds/' + id),
      loaded = await V.load(record.chain_address);
    if (token !== epoch) return;
    if (loaded.mint !== record.mint || loaded.planHash !== record.plan_hash)
      throw Error(
        t(
          'A rodada on-chain difere do cadastro.',
          'The on-chain round differs from the database record.',
        ),
      );
    round = record;
    chain = loaded;
    const raisedCard = document.querySelector('[data-company-raised]'),
      releasedCard = document.querySelector('[data-company-released]');
    if (raisedCard) raisedCard.textContent = C.format(loaded.raised, loaded.decimals) + ' tokens';
    if (releasedCard)
      releasedCard.textContent = C.format(loaded.released, loaded.decimals) + ' tokens';
    const milestones = await query('milestones', (q) =>
      q
        .select('id,sequence,title,description,acceptance_criteria,use_of_funds,plan_hash')
        .eq('round_id', id)
        .order('sequence')
        .limit(1000),
    );
    if (token !== epoch) return;
    const fmt = (n) => C.format(n, chain.decimals),
      statuses = [
        t('Rascunho', 'Draft'),
        t('Captação aberta', 'Fundraising open'),
        t('Captação concluída', 'Fundraising successful'),
        t('Falhada', 'Failed'),
      ];
    target.innerHTML = `<h3>${statuses[chain.status]}</h3><div class="api-metrics"><span>${t('Captado', 'Raised')}<strong>${fmt(chain.raised)}</strong></span><span>${t('Mínimo', 'Minimum')}<strong>${fmt(chain.minimum)}</strong></span><span>${t('Limite', 'Cap')}<strong>${fmt(chain.cap)}</strong></span><span>${t('Saldo no cofre', 'Vault balance')}<strong>${fmt(chain.vaultBalance)}</strong></span><span>${t('Liberado', 'Released')}<strong>${fmt(chain.released)}</strong></span></div><p>${t('Prazo', 'Deadline')}: ${esc(new Date(chain.deadline * 1000).toLocaleString())}</p><p class="api-address">${t('Criadora', 'Creator')}: ${esc(chain.creator)}<br>${t('Autoridade RAFTT', 'RAFTT authority')}: ${esc(chain.platform)}<br>${t('Destinatário', 'Recipient')}: ${esc(chain.recipient)}</p><div class="api-actions">${button('api-sync', 'Sincronizar banco', 'Sync database', true)}${admin && chain.status === 0 ? button('api-open', 'Autorizar e abrir captação', 'Authorize and open fundraising') : ''}${admin ? button('api-publish', 'Publicar empresa', 'Publish company') : ''}${chain.status === 1 && chain.now >= chain.deadline ? button('api-close', 'Encerrar pelo prazo', 'Close at deadline') : ''}</div><div id="api-milestone-add"></div><h3>${t('Parcelas registradas', 'Registered installments')}</h3><div id="api-milestones"></div>`;
    bind('api-sync', async () => {
      await A.request('/v1/rounds/' + id + '/sync', {});
      await selectRound(id);
    });
    bind('api-open', async () => {
      const wallet = await A.verifyWallet(),
        prepared = await A.request('/v1/rounds/' + id + '/open/prepare', {
          walletId: wallet.id,
        });
      const result = await A.operation(id, 'open_round', prepared);
      await selectRound(id);
      return (
        t('Captação aberta. Transação: ', 'Fundraising opened. Transaction: ') + result.signature
      );
    });
    bind('api-publish', async () => {
      await A.request('/v1/companies/' + company.id + '/publish', {});
      await selectCompany(company.id);
      return t(
        'Empresa publicada nas oportunidades e no mapa.',
        'Company published in opportunities and on the map.',
      );
    });
    bind('api-close', async () => {
      const wallet = await A.verifyWallet(),
        prepared = await A.request('/v1/rounds/' + id + '/close/prepare', {
          walletId: wallet.id,
        });
      await A.operation(id, 'close_round', prepared);
      await selectRound(id);
    });
    if (!admin && (chain.status === 0 || chain.status === 2)) await renderMilestoneForm();
    if (!milestones.length)
      $('api-milestones').textContent = t(
        'Nenhuma parcela cadastrada. Os rascunhos locais ainda não são planos registrados na Solana.',
        'No registered installments. Local drafts are not yet registered Solana plans.',
      );
    for (const milestone of milestones) await renderMilestone(milestone);
    buttons();
  }
  async function renderMilestoneForm() {
    $('api-milestone-add').innerHTML =
      `<details><summary>${t('Registrar parcela do plano', 'Register a plan installment')}</summary><form id="api-milestone-form">${label('title', 'Título', 'Title', 'maxlength="200"')}${label('amount', 'Valor em tokens', 'Token amount', 'inputmode="decimal"')}${field('description', 'O que será entregue e como', 'What will be delivered and how')}${field('acceptanceCriteria', 'Critérios mensuráveis e evidências exigidas', 'Measurable criteria and required evidence')}${field('useOfFunds', 'Uso dos recursos e orçamento', 'Use of funds and budget')}<p class="api-note">${t('O plano inicial deve somar o mínimo da rodada. Rascunhos do editor acima precisam ser revisados e registrados aqui.', 'The initial plan must total the round minimum. Drafts from the editor above must be reviewed and registered here.')}</p><button>${t('Registrar e assinar parcela', 'Register and sign installment')}</button></form></details>`;
    $('api-milestone-form').onsubmit = (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(e.currentTarget));
      run(async () => {
        const params = {
          ...values,
          sequence: chain.milestoneCount,
          amountUnits: C.units(values.amount, chain.decimals).toString(),
        };
        delete params.amount;
        await A.verifyWallet();
        const prepared = await A.request('/v1/rounds/' + round.id + '/milestones', params);
        const result = await A.submitPrepared(
          prepared,
          '/v1/rounds/' + round.id + '/milestones',
          params,
        );
        await selectRound(round.id);
        return (
          t('Parcela registrada. Transação: ', 'Installment registered. Transaction: ') +
          result.signature
        );
      });
    };
    await importDrafts();
  }
  async function importDrafts() {
    const form = $('api-milestone-form');
    if (!form || !window.RafttCloudDrafts) return;
    const generation = epoch,
      companyId = company.id;
    try {
      const drafts = await window.RafttCloudDrafts.load('company:' + companyId + ':milestones', []);
      if (generation !== epoch || !window.RafttAccountReady || !drafts.length) return;
      const wrap = document.createElement('label');
      wrap.textContent = t('Preencher a partir de um rascunho', 'Fill from a draft');
      const select = document.createElement('select');
      const first = document.createElement('option');
      first.value = '';
      first.textContent = t('Selecione um rascunho', 'Select a draft');
      select.append(first);
      drafts.forEach((draft, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = draft.title;
        select.append(option);
      });
      select.onchange = () => {
        if (select.value === '') return;
        const draft = drafts[Number(select.value)];
        form.elements.title.value = draft.title || '';
        form.elements.description.value = [draft.deliverable, draft.method]
          .filter(Boolean)
          .join('\n');
        form.elements.acceptanceCriteria.value = [draft.criteria, draft.releaseCriteria]
          .filter(Boolean)
          .join('\n');
        form.elements.useOfFunds.value = (draft.costs || [])
          .map(
            (cost) =>
              `${cost.description}: ${cost.quantity} × ${cost.unitCost} USD. ${cost.justification}`,
          )
          .join('\n');
        form.elements.amount.value = '';
      };
      wrap.append(select);
      form.prepend(wrap);
      const note = document.createElement('p');
      note.className = 'api-note';
      note.textContent = t(
        'O orçamento do rascunho usa USD. Informe separadamente o valor em unidades do token da rodada; não há conversão automática.',
        'The draft budget uses USD. Enter the round token amount separately; there is no automatic conversion.',
      );
      wrap.after(note);
    } catch {}
  }
  async function renderMilestone(m) {
    const generation = epoch;
    const onchain = chain.milestones.find((x) => x.index === m.sequence);
    if (!onchain) return;
    if (onchain.planHash !== m.plan_hash)
      throw Error(
        t(
          'O plano da parcela difere do cadastro.',
          'The installment plan differs from the database record.',
        ),
      );
    const evidence = await query('evidence', (q) =>
      q
        .select('id,description,evidence_hash,document_id,created_at')
        .eq('milestone_id', m.id)
        .order('created_at', { ascending: false })
        .limit(20),
    );
    const reports = await query('ai_reports', (q) =>
      q
        .select('id,report,input_hash,canonical_input,created_at')
        .eq('milestone_id', m.id)
        .order('created_at', { ascending: false })
        .limit(5),
    );
    const decisions = await query('review_decisions', (q) =>
      q
        .select('id,decision,reason,review_hash,created_at')
        .eq('milestone_id', m.id)
        .order('created_at', { ascending: false })
        .limit(5),
    );
    if (generation !== epoch || !window.RafttAccountReady) return;
    const prefix = 'api-ms-' + m.id,
      article = document.createElement('article');
    const phases = [
      t('Planejada', 'Planned'),
      t('Em revisão', 'Under review'),
      t('Autorizada', 'Authorized'),
      t('Paga', 'Paid'),
    ];
    article.innerHTML = `<h4>${m.sequence + 1}. ${esc(m.title)} · ${C.format(onchain.amount, chain.decimals)} tokens</h4><p>${phases[onchain.status]}</p><details><summary>${t('Plano e histórico', 'Plan and history')}</summary><p>${esc(m.description)}</p><p>${esc(m.acceptance_criteria)}</p><p>${esc(m.use_of_funds)}</p>${evidence.map((e) => `<p>${esc(e.description)}<br><small>${esc(e.created_at)}</small></p>`).join('')}<div id="${prefix}-agent-status"></div><div id="${prefix}-report" ${reports.length ? '' : 'hidden'}></div>${decisions.map((d) => `<p>${esc(phase(d.decision))}: ${esc(d.reason)}</p>`).join('')}</details><div id="${prefix}-controls"></div>`;
    $('api-milestones').append(article);
    let latestReport = reports[0] || null;
    if (latestReport) {
      if (window.RafttAgent) window.RafttAgent.report($(prefix + '-report'), latestReport.report);
      else $(prefix + '-report').textContent = JSON.stringify(latestReport.report, null, 2);
    }
    window.RafttAgent?.mount($(prefix + '-agent-status'), company.id, m.id, 'milestone', (row) => {
      latestReport = row;
      window.RafttAgent.report($(prefix + '-report'), row.report);
    });
    const controls = $(prefix + '-controls');
    if (!admin && chain.status === 2 && onchain.status <= 1) {
      controls.innerHTML = `<form id="${prefix}-evidence"><label>${t('Evidências da entrega', 'Delivery evidence')}<textarea name="description" required maxlength="20000"></textarea></label><label>${t('Documento da empresa', 'Company document')}<select name="documentId"><option value="">${t('Somente texto', 'Text only')}</option></select></label><button>${t('Salvar e enviar evidências', 'Save and submit evidence')}</button></form>`;
      const docs = await query('documents', (q) =>
        q.select('id,name').eq('company_id', company.id).limit(100),
      );
      const select = controls.querySelector('[name=documentId]');
      select.innerHTML += docs
        .map((d) => `<option value="${esc(d.id)}">${esc(d.name)}</option>`)
        .join('');
      $(prefix + '-evidence').onsubmit = (e) => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(e.currentTarget));
        run(async () => {
          if (!values.documentId) delete values.documentId;
          await A.verifyWallet();
          const saved = await A.request('/v1/milestones/' + m.id + '/evidence', values),
            prepared = await A.request('/v1/milestones/' + m.id + '/evidence/prepare', {
              evidenceId: saved.id,
            });
          await A.operation(round.id, 'submit_milestone', prepared, m.sequence);
          await selectRound(round.id);
        });
      };
    }
    if (admin && chain.status === 2 && onchain.status === 1) {
      const currentEvidence = evidence.find((e) => e.evidence_hash === onchain.evidenceHash);
      controls.innerHTML = `<div class="api-actions">${button(prefix + '-analyze', 'Analisar evidências com IA', 'Analyze evidence with AI')}</div><label>${t('Justificativa da decisão', 'Decision rationale')}<textarea id="${prefix}-reason" maxlength="5000"></textarea></label><div class="api-actions">${button(prefix + '-approve', 'Aprovar evidências', 'Approve evidence')}${button(prefix + '-changes', 'Solicitar ajustes', 'Request changes', true)}${button(prefix + '-reject', 'Rejeitar', 'Reject', true)}</div>${decisions[0]?.decision === 'approved' ? button(prefix + '-authorize', 'Assinar autorização RAFTT', 'Sign RAFTT authorization') : ''}`;
      bind(prefix + '-analyze', async () => {
        latestReport = await A.request('/v1/milestones/' + m.id + '/analyze', {});
        $(prefix + '-report').hidden = false;
        if (window.RafttAgent) window.RafttAgent.report($(prefix + '-report'), latestReport.report);
        else $(prefix + '-report').textContent = JSON.stringify(latestReport.report, null, 2);
        article.querySelector('details').open = true;
      });
      for (const [suffix, decision] of [
        ['approve', 'approved'],
        ['changes', 'changes_requested'],
        ['reject', 'rejected'],
      ])
        bind(prefix + '-' + suffix, async () => {
          if (!latestReport || !currentEvidence)
            throw Error(
              t(
                'Analise as evidências atuais com IA antes de decidir.',
                'Analyze the current evidence with AI before deciding.',
              ),
            );
          let analyzedEvidence = [];
          try {
            analyzedEvidence = JSON.parse(latestReport.canonical_input).evidence || [];
          } catch {}
          if (
            !analyzedEvidence.some(
              (e) =>
                e.id === currentEvidence.id && e.evidence_hash === currentEvidence.evidence_hash,
            )
          )
            throw Error(
              t(
                'O relatório não analisou estas evidências. Execute uma nova análise.',
                'The report did not analyze this evidence. Run a new analysis.',
              ),
            );
          const reason = $(prefix + '-reason').value.trim();
          if (!reason) throw Error(t('Informe a justificativa.', 'Enter a rationale.'));
          await A.request('/v1/milestones/' + m.id + '/decisions', {
            decision,
            reason,
            reportId: latestReport.id,
            evidenceId: currentEvidence.id,
          });
          await selectRound(round.id);
          return t(
            'Decisão salva. A autorização on-chain requer uma assinatura separada da RAFTT.',
            'Decision saved. On-chain authorization requires a separate RAFTT signature.',
          );
        });
      bind(prefix + '-authorize', async () => {
        const wallet = await A.verifyWallet(),
          prepared = await A.request('/v1/milestones/' + m.id + '/approval/prepare', {
            decisionId: decisions[0].id,
            walletId: wallet.id,
          });
        await A.operation(round.id, 'approve_milestone', prepared, m.sequence);
        await selectRound(round.id);
      });
    }
    if (chain.status === 2 && onchain.status === 2 && chain.nextRelease === m.sequence) {
      const b = document.createElement('button');
      b.textContent = t('Revisar pagamento autorizado', 'Review authorized payment');
      b.onclick = () =>
        run(async () => {
          const amount = C.format(onchain.amount, chain.decimals),
            recipient = chain.recipient;
          const accepted = window.confirm(
            t(
              'Pagar ' + amount + ' tokens ao destinatário ' + recipient + '?',
              'Pay ' + amount + ' tokens to recipient ' + recipient + '?',
            ),
          );
          if (!accepted) return t('Pagamento não enviado.', 'Payment not sent.');
          const wallet = await A.verifyWallet(),
            prepared = await A.request('/v1/milestones/' + m.id + '/release/prepare', {
              walletId: wallet.id,
            });
          await A.operation(round.id, 'release_milestone', prepared, m.sequence);
          await selectRound(round.id);
        });
      controls.append(b);
    }
  }
  window.addEventListener('raftt:account-ready', init);
  window.addEventListener('raftt:auth-signout', () => {
    ++epoch;
    root?.replaceChildren();
    company = null;
    round = null;
    chain = null;
  });
  window.addEventListener('raftt:wallet-change', () => {
    renderWallet();
    if (!busy && round) run(() => selectRound(round.id));
  });
  if (window.RafttAccountReady) init();
})();
