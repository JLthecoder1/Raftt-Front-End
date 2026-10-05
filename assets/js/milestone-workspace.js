(() => {
  'use strict';
  const pt = localStorage.getItem('raftt-lang') === 'pt',
    t = (a, b) => (pt ? a : b),
    esc = (s) =>
      String(s ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
  const read = (k, f) => {
      try {
        return JSON.parse(localStorage.getItem(k)) || f;
      } catch {
        return f;
      }
    },
    money = (n) => window.RafttNumbers.money(n),
    company = read('raftt-company', {});
  let items = read('raftt-milestones', []);
  const total = (m) => m.costs.reduce((n, c) => n + c.quantity * c.unitCost, 0),
    allocated = () => items.reduce((n, m) => n + total(m), 0),
    released = () =>
      items
        .filter((m) => ['executed', 'completed'].includes(m.status))
        .reduce((n, m) => n + total(m), 0),
    net = Number(company.targetRaise || 0) * 0.93;
  const save = () => localStorage.setItem('raftt-milestones', JSON.stringify(items));
  const summary = document.getElementById('company-milestone-summary');
  if (summary)
    summary.innerHTML = `<p>${t(`${items.length} marcos criados · ${money(allocated())} planejados · ${money(released())} liberados.`, `${items.length} milestones created · ${money(allocated())} planned · ${money(released())} released.`)}</p>${items
      .slice(0, 3)
      .map(
        (m, index) =>
          `<div class="row"><span>${String(index + 1).padStart(2, '0')} · ${esc(m.title)}</span><strong>${money(total(m))}</strong></div>`,
      )
      .join('')}`;
  const root = document.getElementById('milestone-workspace');
  if (!root) return;
  const statuses = {
    draft: t('Rascunho', 'Draft'),
    review: t('Plano em revisão', 'Plan under review'),
    ready: t('Plano aprovado', 'Plan approved'),
    evidence: t('Entrega em revisão', 'Delivery under review'),
    authorized: t('Parcela autorizada', 'Installment authorized'),
    executed: t('Em execução · parcela paga', 'In progress · installment paid'),
    completed: t('Entrega comprovada', 'Delivery verified'),
  };
  root.innerHTML = `<div class="top"><div><p class="eyebrow">${t('CAPTAÇÃO / PLANO DE EXECUÇÃO', 'FUNDRAISING / EXECUTION PLAN')}</p><h1>${t('Do plano à entrega.', 'From plan to delivery.')}</h1><p class="muted">${t('Explique cada etapa e seu orçamento. Acompanhe o que foi planejado, aprovado e efetivamente liberado.', 'Explain each stage and its budget. Track what was planned, approved and actually released.')}</p></div><button id="new-milestone">+ ${t('Criar marco', 'Create milestone')}</button></div><div class="ms-overview" id="ms-overview"></div><p id="ms-round" class="ms-review"></p><div class="ms-process"><span>01 · ${t('Descreva a execução', 'Describe execution')}</span><span>02 · ${t('Detalhe os custos', 'Itemize costs')}</span><span>03 · ${t('Revise o plano', 'Review the plan')}</span><span>04 · ${t('Comprove e solicite', 'Verify and request')}</span></div><section class="ms-list-section"><div class="ms-list-heading"><h2>${t('Marcos criados', 'Created milestones')}</h2><span id="ms-count"></span></div><p id="ms-feedback" role="status" aria-live="polite"></p><div id="ms-list"></div></section><p class="muted">${t('A IA pode apoiar a análise dos custos e das evidências. Esta demonstração realiza apenas checagens do plano; a decisão de liberação pertence ao responsável autorizado.', 'AI can support cost and evidence analysis. This demo only performs plan checks; release decisions belong to the authorized reviewer.')}</p><dialog id="ms-editor" aria-labelledby="ms-editor-title"><form id="ms-form"><header><div><p class="eyebrow">${t('PLANO DO MARCO', 'MILESTONE PLAN')}</p><h2 id="ms-editor-title">${t('Uma entrega, um orçamento.', 'One delivery, one budget.')}</h2></div><button type="button" id="ms-close" class="secondary" aria-label="${t('Fechar', 'Close')}">×</button></header><div class="ms-form-body"><div class="ms-fields"><label>${t('Nome do marco', 'Milestone name')}<input name="title" required maxlength="100" placeholder="${t('Ex.: concluir protótipo funcional', 'E.g., complete a functional prototype')}"></label><label>${t('Responsável pela execução', 'Execution owner')}<input name="owner" required maxlength="100"></label><label>${t('Início previsto', 'Planned start')}<input name="start" type="date" required></label><label>${t('Data de entrega', 'Delivery date')}<input name="deadline" type="date" required></label><label class="full">${t('O que será entregue?', 'What will be delivered?')}<textarea name="deliverable" required rows="3" maxlength="3000" placeholder="${t('Descreva um resultado concreto, a quantidade e a qualidade esperadas.', 'Describe a concrete result, expected quantity and quality.')}"></textarea></label><label class="full">${t('Como será feito?', 'How will it be done?')}<textarea name="method" required rows="3" maxlength="3000" placeholder="${t('Liste as atividades, equipe, ferramentas, fornecedores e sequência de execução.', 'List activities, team, tools, suppliers and execution sequence.')}"></textarea></label><label class="full">${t('Como comprovar a conclusão?', 'How will completion be verified?')}<textarea name="criteria" required rows="3" maxlength="3000" placeholder="${t('Critério mensurável + evidência. Ex.: 3 pilotos concluídos, relatório de uso e aceite dos clientes.', 'Measurable criterion + evidence. E.g., 3 completed pilots, usage report and customer acceptance.')}"></textarea></label><label class="full">${t('Condições para receber esta parcela', 'Conditions to receive this installment')}<textarea name="releaseCriteria" required rows="2" maxlength="2000" placeholder="${t('Ex.: rodada fechada, orçamento aprovado e conclusão do marco anterior comprovada.', 'E.g., round closed, approved budget and verified completion of prior milestone.')}"></textarea></label><label class="full">${t('Pré-requisito', 'Prerequisite')}<select name="dependency"><option value="">${t('Sem marco anterior', 'No prior milestone')}</option></select></label></div><section class="ms-budget"><h3>${t('Quanto custa executar esta etapa?', 'How much does this stage cost?')}</h3><p class="muted">${t('Informe cada gasto e sua finalidade. A soma representa o capital solicitado antes da execução. Valores em USD.', 'Specify each expense and its purpose. The sum represents capital requested before execution. Amounts in USD.')}</p><div id="ms-costs"></div><button type="button" class="secondary" id="ms-add-cost">+ ${t('Adicionar custo', 'Add cost')}</button><div class="row"><span>${t('Capital necessário', 'Required capital')}</span><strong id="ms-budget-total"></strong></div></section><label>${t('Premissas, riscos e contingência', 'Assumptions, risks and contingency')}<textarea name="risks" rows="2" maxlength="2000" placeholder="${t('Explique estimativas, cotações, riscos e qualquer reserva incluída nos custos.', 'Explain estimates, quotes, risks and any reserve included in costs.')}"></textarea></label><p id="ms-form-error" role="alert"></p></div><div class="ms-editor-actions"><button type="button" class="secondary" id="ms-save-draft">${t('Salvar rascunho', 'Save draft')}</button><button type="submit">${t('Salvar plano completo', 'Save complete plan')}</button></div></form></dialog>`;
  const $ = (s) => root.querySelector(s),
    dialog = $('#ms-editor'),
    form = $('#ms-form');
  let editing = null;
  function costRow(c = { description: '', quantity: 1, unitCost: 0, justification: '' }) {
    const row = document.createElement('div');
    row.className = 'ms-cost-row';
    row.innerHTML = `<label>${t('Item de custo', 'Cost item')}<input data-cost="description" required maxlength="150" value="${esc(c.description)}"></label><label>${t('Quantidade', 'Quantity')}<input data-cost="quantity" type="number" min="0.01" step="0.01" required value="${c.quantity}"></label><label>${t('Valor unitário · USD', 'Unit cost · USD')}<input data-cost="unitCost" type="number" min="0.01" step="0.01" required value="${c.unitCost || ''}"></label><label class="ms-cost-purpose">${t('Uso e base do valor', 'Purpose and cost basis')}<input data-cost="justification" required maxlength="500" placeholder="${t('Ex.: 2 meses de desenvolvimento; cotação do fornecedor', 'E.g., 2 months of development; supplier quote')}" value="${esc(c.justification)}"></label><button type="button" class="secondary" aria-label="${t('Remover custo', 'Remove cost')}">×</button>`;
    row.querySelector('button').onclick = () => {
      row.remove();
      updateBudget();
    };
    row.oninput = updateBudget;
    $('#ms-costs').append(row);
    window.RafttNumbers.attach(row.querySelector('[data-cost=unitCost]'));
    updateBudget();
  }
  function costs() {
    return [...root.querySelectorAll('.ms-cost-row')].map((row) =>
      Object.fromEntries(
        [...row.querySelectorAll('[data-cost]')].map((el) => [
          el.dataset.cost,
          el.dataset.cost === 'unitCost'
            ? window.RafttNumbers.value(el) || 0
            : el.dataset.cost === 'quantity'
              ? Number(el.value)
              : el.value.trim(),
        ]),
      ),
    );
  }
  function updateBudget() {
    $('#ms-budget-total').textContent = money(
      costs().reduce((n, c) => n + c.quantity * c.unitCost, 0),
    );
  }
  function open(m) {
    editing = m?.id || null;
    form.reset();
    $('#ms-form-error').textContent = '';
    for (const key of [
      'title',
      'owner',
      'start',
      'deadline',
      'deliverable',
      'method',
      'criteria',
      'releaseCriteria',
      'risks',
    ])
      form.elements[key].value = m?.[key] || '';
    form.elements.dependency.innerHTML =
      `<option value="">${t('Sem marco anterior', 'No prior milestone')}</option>` +
      items
        .filter((i) => i.id !== editing && items.indexOf(i) < (m ? items.indexOf(m) : items.length))
        .map((i) => `<option value="${i.id}">${esc(i.title || t('Rascunho', 'Draft'))}</option>`)
        .join('');
    form.elements.dependency.value = m?.dependency || '';
    $('#ms-costs').innerHTML = '';
    (m?.costs?.length ? m.costs : [undefined]).forEach(costRow);
    dialog.showModal();
  }
  function store(draft) {
    const values = Object.fromEntries(new FormData(form));
    for (const k in values) values[k] = values[k].trim();
    const c = costs(),
      budget = c.reduce((n, v) => n + v.quantity * v.unitCost, 0);
    if (!values.title) {
      $('#ms-form-error').textContent = t(
        'Dê um nome ao marco para salvá-lo.',
        'Name the milestone to save it.',
      );
      return;
    }
    if (!draft) {
      if (!form.reportValidity()) return;
      if (values.deadline < values.start) {
        $('#ms-form-error').textContent = t(
          'A entrega deve ocorrer após o início.',
          'Delivery must be on or after the start.',
        );
        return;
      }
      if (!c.length || !Number.isFinite(budget) || budget <= 0) {
        $('#ms-form-error').textContent = t(
          'Adicione pelo menos um custo válido.',
          'Add at least one valid cost.',
        );
        return;
      }
    }
    const old = items.find((i) => i.id === editing);
    const item = {
      ...values,
      id: editing || crypto.randomUUID(),
      costs: c,
      status: 'draft',
      complete: !draft,
      evidence: '',
      created: old?.created || new Date().toISOString(),
    };
    if (old) items[items.indexOf(old)] = item;
    else items.push(item);
    save();
    dialog.close();
    render();
  }
  $('#new-milestone').onclick = () => open();
  $('#ms-close').onclick = () => dialog.close();
  $('#ms-add-cost').onclick = () => costRow();
  $('#ms-save-draft').onclick = () => store(true);
  form.onsubmit = (e) => {
    e.preventDefault();
    store(false);
  };
  function checks(m, requireDependency = true) {
    const issues = [];
    if (!m.complete)
      issues.push(t('Complete o plano e seus custos.', 'Complete the plan and its costs.'));
    if (!net)
      issues.push(
        t(
          'Defina a meta de captação na apresentação da empresa.',
          'Set the fundraising target in the company presentation.',
        ),
      );
    if (net && allocated() > net + 0.005)
      issues.push(
        t(
          'O orçamento total dos marcos supera o capital líquido estimado.',
          'Total milestone budgets exceed estimated net capital.',
        ),
      );
    if (
      requireDependency &&
      m.dependency &&
      !items.some((i) => i.id === m.dependency && i.status === 'completed')
    )
      issues.push(
        t(
          'A entrega do marco anterior precisa estar comprovada.',
          'The prior milestone delivery must be verified.',
        ),
      );
    return issues;
  }
  function render() {
    const closed = read('raftt-demo-round-closed', false);
    $('#ms-round').innerHTML = closed
      ? t(
          'Rodada fechada na simulação. As liberações continuam sujeitas ao plano e às evidências.',
          'Round closed in the simulation. Releases remain subject to the plan and evidence.',
        )
      : `${t('Antes de liberar capital, a rodada precisa estar fechada.', 'Before releasing capital, the round must be closed.')} <button class="secondary" id="ms-close-round">${t('Simular fechamento da rodada', 'Simulate round closing')}</button>`;
    $('#ms-close-round')?.addEventListener('click', () => {
      if (!net) {
        $('#ms-feedback').textContent = t(
          'Defina primeiro a meta na apresentação da empresa.',
          'First set the target in the company presentation.',
        );
        return;
      }
      localStorage.setItem('raftt-demo-round-closed', 'true');
      render();
    });
    const amount = allocated();
    $('#ms-overview').innerHTML = [
      [
        t('Capital líquido estimado', 'Estimated net capital'),
        net ? money(net) : t('Defina a meta', 'Set a target'),
      ],
      [t('Orçamento dos marcos', 'Milestone budget'), money(amount)],
      [t('Capital liberado', 'Released capital'), money(released())],
      [t('Ainda não alocado', 'Not yet allocated'), net ? money(net - amount) : '—'],
    ]
      .map(
        ([label, value]) =>
          `<div class="card"><small>${label}</small><strong>${value}</strong></div>`,
      )
      .join('');
    $('#ms-count').textContent = t(
      `${items.length} ${items.length === 1 ? 'etapa' : 'etapas'}`,
      `${items.length} ${items.length === 1 ? 'stage' : 'stages'}`,
    );
    $('#ms-list').innerHTML = items.length
      ? items
          .map((m, index) => {
            const budget = total(m),
              issues = checks(m);
            return `<article class="ms-card"><div class="ms-card-top"><span class="ms-index">${String(index + 1).padStart(2, '0')}</span><div><h3>${esc(m.title)}</h3><p>${esc(m.owner || t('Responsável a definir', 'Owner to be defined'))} · ${m.deadline ? new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(m.deadline + 'T00:00:00Z')) : t('Prazo a definir', 'Deadline to be defined')}</p></div><div><span class="badge">${statuses[m.status] || statuses.draft}</span><strong class="ms-amount">${money(budget)}</strong></div></div><p class="ms-deliverable">${esc(m.deliverable || t('Descreva a entrega desta etapa.', 'Describe this stage’s delivery.'))}</p><details><summary>${t('Ver plano, custos e evidências', 'View plan, costs and evidence')}</summary><div class="ms-detail-grid"><section><h4>${t('Como será feito', 'Execution method')}</h4><p>${esc(m.method)}</p><h4>${t('Condições de liberação', 'Release conditions')}</h4><p>${esc(m.releaseCriteria)}</p><h4>${t('Critérios de conclusão', 'Completion criteria')}</h4><p>${esc(m.criteria)}</p><h4>${t('Premissas e riscos', 'Assumptions and risks')}</h4><p>${esc(m.risks || '—')}</p><h4>${t('Pré-requisito', 'Prerequisite')}</h4><p>${esc(items.find((i) => i.id === m.dependency)?.title || t('Nenhum marco anterior', 'No prior milestone'))}</p></section><section><h4>${t('Orçamento detalhado · USD', 'Itemized budget · USD')}</h4>${m.costs.map((c) => `<div class="ms-cost-detail"><strong>${esc(c.description)}</strong><span>${c.quantity} × ${money(c.unitCost)} = ${money(c.quantity * c.unitCost)}</span><p>${esc(c.justification)}</p></div>`).join('')}<h4>${t('Evidência para liberar a parcela', 'Evidence to release the installment')}</h4><p>${esc(m.evidence || t('Ainda não enviada', 'Not submitted yet'))}</p><h4>${t('Evidência da entrega', 'Delivery evidence')}</h4><p>${esc(m.deliveryEvidence || t('Ainda não enviada', 'Not submitted yet'))}</p></section></div></details><div class="ms-review"><strong>${t('Checagem do plano · demonstração', 'Plan check · demo')}</strong><p>${issues.length ? issues.map(esc).join(' ') : t('Descrição, execução, custos e critérios registrados. Os valores ainda precisam de validação com documentos e cotações.', 'Description, execution, costs and criteria recorded. Amounts still need validation against documents and quotes.')}</p></div><div class="actions">${['draft', 'review'].includes(m.status) ? `<button class="secondary" data-action="edit" data-id="${m.id}">${t('Editar plano', 'Edit plan')}</button>` : ''}${m.status === 'draft' ? `<button data-action="review" data-id="${m.id}">${t('Enviar plano para revisão', 'Submit plan for review')}</button>` : ''}${m.status === 'review' ? `<button data-action="ready" data-id="${m.id}">${t('Simular aprovação do plano', 'Simulate plan approval')}</button>` : ''}${m.status === 'ready' ? `<button data-action="evidence" data-id="${m.id}">${t('Solicitar parcela · enviar evidências', 'Request installment · submit evidence')}</button>` : ''}${m.status === 'evidence' ? `<button data-action="authorized" data-id="${m.id}">${t('Simular autorização da parcela', 'Simulate installment authorization')}</button>` : ''}${m.status === 'authorized' ? `<button data-action="executed" data-id="${m.id}">${t('Confirmar pagamento de teste', 'Confirm test payment')} · ${money(budget)}</button>` : ''}${m.status === 'executed' ? `<button data-action="completed" data-id="${m.id}">${t('Comprovar conclusão da entrega', 'Verify delivery completion')}</button>` : ''}${m.status === 'draft' ? `<button class="secondary" data-action="delete" data-id="${m.id}">${t('Excluir rascunho', 'Delete draft')}</button>` : ''}</div></article>`;
          })
          .join('')
      : `<div class="ms-empty"><span>01 /</span><h3>${t('Sua primeira entrega começa aqui.', 'Your first delivery starts here.')}</h3><p>${t('Nenhum marco criado. Defina a entrega, explique como executá-la e discrimine os custos. O plano ficará salvo nesta conta de demonstração.', 'No milestones created. Define the delivery, explain execution and itemize costs. Your plan will be saved in this demo account.')}</p><button id="first-milestone">+ ${t('Criar primeiro marco', 'Create first milestone')}</button></div>`;
    $('#first-milestone')?.addEventListener('click', () => open());
    root
      .querySelectorAll('[data-action]')
      .forEach((b) => (b.onclick = () => action(b.dataset.action, b.dataset.id)));
  }
  function action(a, id) {
    const m = items.find((i) => i.id === id);
    $('#ms-feedback').textContent = '';
    if (a === 'edit') return open(m);
    if (a === 'delete') {
      if (items.some((i) => i.dependency === id)) {
        $('#ms-feedback').textContent = t(
          'Outro marco depende deste. Ajuste o pré-requisito antes de excluir.',
          'Another milestone depends on this one. Update its prerequisite before deleting.',
        );
        return;
      }
      items = items.filter((i) => i.id !== id);
      save();
      render();
      return;
    }
    const expected = {
      review: 'draft',
      ready: 'review',
      evidence: 'ready',
      authorized: 'evidence',
      executed: 'authorized',
      completed: 'executed',
    };
    if (m.status !== expected[a]) return;
    const issues = checks(m, !['review', 'ready'].includes(a));
    if (issues.length) {
      $('#ms-feedback').textContent = issues.join(' ');
      return;
    }
    if (
      ['evidence', 'authorized', 'executed'].includes(a) &&
      !read('raftt-demo-round-closed', false)
    ) {
      $('#ms-feedback').textContent = t(
        'Simule o fechamento da rodada antes de solicitar ou liberar capital.',
        'Simulate round closing before requesting or releasing capital.',
      );
      return;
    }
    if (a === 'evidence' || a === 'completed') {
      openEvidence(m, a === 'completed');
      return;
    }
    m.status = a;
    m.updated = new Date().toISOString();
    save();
    render();
  }
  function openEvidence(m, completion = false) {
    const d = document.createElement('dialog');
    d.className = 'ms-evidence-dialog';
    d.setAttribute('aria-label', t('Evidências da entrega', 'Delivery evidence'));
    d.innerHTML = `<form><h2>${completion ? t('Comprove a entrega', 'Verify the delivery') : t('Solicite o capital para executar', 'Request capital to execute')}</h2><p>${esc(completion ? m.criteria : m.releaseCriteria)}</p><label>${completion ? t('Resultados e fontes de comprovação', 'Results and evidence sources') : t('Condições atendidas e fontes de comprovação', 'Conditions met and evidence sources')}<textarea required rows="5" maxlength="5000" placeholder="${t('Descreva os resultados e inclua links dos relatórios, testes, contratos ou documentos.', 'Describe results and include links to reports, tests, contracts or documents.')}"></textarea></label><p class="muted">${t('Explique o que cada fonte comprova. Enviar evidências não libera o capital automaticamente.', 'Explain what each source proves. Submitting evidence does not release capital automatically.')}</p><div class="actions"><button type="button" class="secondary">${t('Cancelar', 'Cancel')}</button><button type="submit">${completion ? t('Registrar entrega · teste', 'Record delivery · test') : t('Enviar para análise', 'Submit for review')}</button></div></form>`;
    root.append(d);
    d.querySelector('button').onclick = () => d.close();
    d.onclose = () => d.remove();
    d.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      if (!d.querySelector('form').reportValidity()) return;
      const evidence = d.querySelector('textarea').value.trim();
      if (!evidence) return;
      if (completion) {
        m.deliveryEvidence = evidence;
        m.status = 'completed';
      } else {
        m.evidence = evidence;
        m.status = 'evidence';
      }
      save();
      d.close();
      render();
    };
    d.showModal();
  }
  render();
})();
