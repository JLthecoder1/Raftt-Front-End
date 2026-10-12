(() => {
  'use strict';
  const V = window.RafttV2,
    C = window.RafttChain,
    $ = (id) => document.getElementById(id);
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  let current = null,
    busy = false;
  $('network').textContent = window.RafttSolanaConfig.network;
  const requestedRound = new URLSearchParams(location.search).get('round');
  if (requestedRound) $('round-address').value = requestedRound;
  const status = ['Rascunho', 'Captação aberta', 'Captação concluída', 'Falhada'];
  const phase = ['Planejada', 'Solicitação em revisão', 'Autorizada pela RAFTT', 'Parcela paga'];
  function controls() {
    document
      .querySelectorAll('button')
      .forEach((b) => (b.disabled = busy || b.dataset.blocked === 'true'));
  }
  function render(s) {
    current = s;
    const me = C.address(),
      creator = me === s.creator,
      reviewer = me === s.platform,
      open = s.status === 1,
      closedTime = s.now >= s.deadline;
    const cancel = open && s.now < s.deadline - 172800 && s.position > 0n;
    const fmt = (n) => C.format(n, s.decimals),
      pct = Number((s.raised * 10000n) / s.cap) / 100;
    const button = (name, label, allowed) =>
      `<button data-action="${name}" data-blocked="${!allowed}">${label}</button>`;
    $('round-details').innerHTML =
      `<h3>${status[s.status]}</h3><p class="address">Criadora: ${esc(s.creator)}<br>RAFTT: ${esc(s.platform)}<br>Destinatário: ${esc(s.recipient)}</p><progress max="100" value="${pct}" aria-label="Progresso da captação"></progress><p>${fmt(s.raised)} / ${fmt(s.cap)} tokens · mínimo ${fmt(s.minimum)}</p><div class="grid"><p>Saldo no cofre: <strong>${fmt(s.vaultBalance)}</strong></p><p>Minha posição: <strong>${fmt(s.position)}</strong></p><p>Total liberado: <strong>${fmt(s.released)}</strong></p><p>Encerramento: ${esc(new Date(s.deadline * 1000).toLocaleString())}<br>Cancelamento até: ${esc(new Date((s.deadline - 172800) * 1000).toLocaleString())}</p></div><label>Valor do aporte ou cancelamento<input id="action-amount" inputmode="decimal"></label><div class="actions">${button('invest_round', 'Investir', !!me && open && !closedTime && s.raised < s.cap)}${button('cancel_round', 'Cancelar aporte', !!me && cancel)}${button('refund_round', 'Solicitar reembolso', !!me && s.status === 3 && s.position > 0n)}${button('close_round', 'Encerrar pelo prazo', !!me && open && closedTime)}${button('fail_round', 'RAFTT · cancelar rodada', reviewer && s.status <= 1)}</div><p class="muted">O cancelamento fica bloqueado a partir de ${esc(new Date((s.deadline - 172800) * 1000).toLocaleString())}. Após o encerramento bem-sucedido, a posição permanece registrada.</p>
    ${s.status === 0 ? `<label>Análise do plano pela IA e decisão da RAFTT<textarea id="round-review" rows="4"></textarea></label><div class="actions">${button('open_round', 'RAFTT · aprovar e abrir captação', reviewer && s.allocated === s.minimum && s.milestoneCount > 0)}</div>` : ''}
    <h3>Parcelas</h3>${s.milestones.map((m) => `<article><h4>Parcela ${m.index + 1} · ${fmt(m.amount)} tokens</h4><p>${phase[m.status]}</p><p class="muted address">Plano: ${m.planHash}<br>Evidências: ${m.evidenceHash}<br>Análise: ${m.reviewHash}</p><label>Documento da solicitação ou relatório da análise<textarea data-document="${m.index}" rows="3"></textarea></label><div class="actions"><button data-action="submit_milestone" data-index="${m.index}" data-blocked="${!(creator && s.status === 2 && m.status <= 1)}">Enviar solicitação</button><button data-action="approve_milestone" data-index="${m.index}" data-blocked="${!(reviewer && s.status === 2 && m.status === 1)}">RAFTT · autorizar parcela</button><button data-action="release_milestone" data-index="${m.index}" data-blocked="${!(me && s.status === 2 && m.status === 2 && s.nextRelease === m.index)}">Executar pagamento autorizado</button></div></article>`).join('')}
    ${creator && (s.status === 0 || s.status === 2) ? `<form id="milestone-form"><h3 class="wide">${s.status === 0 ? 'Adicionar parcela ao plano mínimo' : 'Propor parcela adicional com o excedente'}</h3><label>Valor em tokens<input name="amount" required inputmode="decimal"></label><label>Plano da parcela<textarea name="document" required></textarea></label><button>Registrar parcela ${s.milestoneCount + 1}</button></form>` : ''}`;
    controls();
  }
  async function reload() {
    const address = $('round-address').value.trim(),
      owner = C.address();
    const s = await V.load(address);
    if (owner !== C.address())
      throw Error('Carteira mudou durante a consulta. Consulte novamente.');
    render(s);
  }
  async function run(fn) {
    if (busy) return;
    busy = true;
    controls();
    $('feedback').textContent = 'Processando… confirme na carteira quando solicitado.';
    try {
      const result = await fn();
      $('feedback').textContent =
        typeof result === 'string' ? 'Transação confirmada: ' + result : 'Dados atualizados.';
    } catch (e) {
      $('feedback').textContent =
        e.code === 4001
          ? 'Assinatura recusada. Nenhuma operação foi enviada.'
          : e.message || String(e);
    } finally {
      busy = false;
      controls();
    }
  }
  $('connect').onclick = () =>
    run(async () => {
      await C.connect($('provider').value);
      $('wallet').textContent = C.address();
    });
  $('disconnect').onclick = () =>
    run(async () => {
      await C.disconnect();
    });
  window.addEventListener('raftt:wallet-change', () => {
    current = null;
    $('round-details').replaceChildren();
    $('wallet').textContent = C.address() || 'Desconectada';
  });
  $('setup').onclick = () => run(() => V.setup($('reviewer').value.trim()));
  $('load-form').onsubmit = (e) => {
    e.preventDefault();
    run(reload);
  };
  $('create-form').onsubmit = (e) => {
    e.preventDefault();
    run(async () => {
      const data = Object.fromEntries(new FormData(e.target)),
        result = await V.create(data);
      $('round-address').value = result.address;
      await reload();
      return result.signature;
    });
  };
  $('round-details').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled || !current) return;
    const address = current.address,
      name = b.dataset.action,
      index = Number(b.dataset.index || 0),
      amount = $('action-amount')?.value,
      doc =
        name === 'open_round'
          ? $('round-review')?.value
          : $('round-details').querySelector(`[data-document="${index}"]`)?.value;
    run(async () => {
      const signature = await V.act(name, address, { amount, index, document: doc });
      await reload();
      return signature;
    });
  });
  $('round-details').addEventListener('submit', (e) => {
    if (e.target.id !== 'milestone-form') return;
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target)),
      address = current.address,
      index = current.milestoneCount;
    run(async () => {
      const signature = await V.act('add_milestone', address, { ...data, index });
      await reload();
      return signature;
    });
  });
  window.addEventListener('raftt:transaction-phase', (e) => {
    $('feedback').textContent =
      {
        wallet: 'Aguardando assinatura na carteira…',
        sending: 'Enviando transação…',
        confirming: 'Aguardando confirmação na Solana…',
      }[e.detail] || e.detail;
  });
  if (requestedRound) run(reload);
})();
