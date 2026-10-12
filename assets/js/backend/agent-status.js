(() => {
  'use strict';
  const t = (pt, en) => (localStorage.getItem('raftt-lang') === 'en' ? en : pt);
  const labels = {
    queued: () => t('Na fila de análise', 'Analysis queued'),
    processing: () => t('Agente analisando', 'Agent analyzing'),
    completed: () => t('Análise concluída', 'Analysis complete'),
    failed: () =>
      t(
        'Análise não concluída. A equipe pode tentar novamente.',
        'Analysis failed. Staff can try again.',
      ),
    superseded: () =>
      t('Substituída por um envio mais recente', 'Superseded by a newer submission'),
  };
  const recommendations = {
    review_required: () => t('Pronta para revisão RAFTT', 'Ready for RAFTT review'),
    changes_requested: () => t('Ajustes recomendados', 'Changes recommended'),
    insufficient_evidence: () => t('Comprovação insuficiente', 'Insufficient evidence'),
  };
  function report(node, value) {
    node.replaceChildren();
    node.hidden = false;
    const paragraph = (title, text) => {
      const h = document.createElement('h4'),
        p = document.createElement('p');
      h.textContent = title;
      p.textContent = text || t('Não informado', 'Not provided');
      node.append(h, p);
    };
    paragraph(
      t('Recomendação do agente', 'Agent recommendation'),
      recommendations[value.recommendation]?.() || value.recommendation,
    );
    paragraph(t('Resumo', 'Summary'), value.summary);
    paragraph(t('Critérios e execução', 'Criteria and execution'), value.milestone_assessment);
    for (const [key, pt, en] of [
      ['risks', 'Riscos', 'Risks'],
      ['missing_information', 'Pendências', 'Missing information'],
    ]) {
      const h = document.createElement('h4'),
        list = document.createElement('ul');
      h.textContent = t(pt, en);
      for (const item of value[key] || []) {
        const li = document.createElement('li');
        li.textContent = item;
        list.append(li);
      }
      if (!list.childElementCount) {
        const li = document.createElement('li');
        li.textContent = t('Nenhum item indicado', 'No items reported');
        list.append(li);
      }
      node.append(h, list);
    }
    const meta = document.createElement('p');
    meta.className = 'api-note';
    meta.textContent =
      t('Documentos lidos: ', 'Documents read: ') +
      (value.processing?.documents_read?.length || 0) +
      '. ' +
      t(
        'A análise não substitui a autorização da RAFTT.',
        'Analysis does not replace RAFTT authorization.',
      );
    node.append(meta);
  }
  let cached, pending, health;
  async function jobs(company) {
    if (cached?.company === company && Date.now() - cached.at < 8000) return cached.rows;
    if (pending?.company === company) return pending.promise;
    const promise = window.RafttApi.request('/v1/companies/' + company + '/agent-jobs')
      .then((rows) => {
        cached = { company, at: Date.now(), rows };
        return rows;
      })
      .finally(() => {
        pending = null;
      });
    pending = { company, promise };
    return promise;
  }
  function mount(host, companyId, targetId, kind, onReport) {
    const status = document.createElement('p');
    status.className = 'api-note';
    status.setAttribute('role', 'status');
    status.textContent = t('Consultando agente…', 'Checking agent…');
    host.append(status);
    let timer,
      loadedId,
      closed = false;
    const update = async () => {
      if (closed || !host.isConnected || !window.RafttAccountReady) {
        clearInterval(timer);
        closed = true;
        return;
      }
      try {
        const [rows, config] = await Promise.all([
          jobs(companyId),
          health ||
            (health = window.RafttApi.request('/health').catch((e) => {
              health = null;
              throw e;
            })),
        ]);
        if (!host.isConnected || !window.RafttAccountReady) return;
        const job = rows.find((j) => j.kind === kind && j.target_id === targetId);
        status.textContent = !config.aiConfigured
          ? t('Agente aguardando configuração no servidor.', 'Agent awaiting server configuration.')
          : !config.agentEnabled
            ? t(
                'Análise automática pausada; análise manual disponível.',
                'Automatic analysis paused; manual analysis available.',
              )
            : job
              ? labels[job.status]?.() || job.status
              : t('Nenhuma análise solicitada.', 'No analysis requested.');
        if (job?.status === 'completed' && job.report_id && loadedId !== job.report_id) {
          const result = await window.RafttBackend.db
            .from('ai_reports')
            .select('id,report,canonical_input,input_hash')
            .eq('id', job.report_id)
            .eq('company_id', companyId)
            .maybeSingle();
          const row = window.RafttBackend.fail(result);
          if (!host.isConnected || !window.RafttAccountReady) return;
          if (row) {
            loadedId = row.id;
            onReport?.(row);
          }
        }
      } catch {
        if (host.isConnected)
          status.textContent = t(
            'Não foi possível consultar o agente. Confira o backend e a migração 005.',
            'Could not check the agent. Check the backend and migration 005.',
          );
      }
    };
    update();
    timer = setInterval(update, 15000);
    window.addEventListener(
      'raftt:auth-signout',
      () => {
        closed = true;
        clearInterval(timer);
      },
      { once: true },
    );
  }
  window.RafttAgent = { mount, report };
})();
