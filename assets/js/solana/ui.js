(() => {
  'use strict';
  if (!window.RafttSolanaConfig.developerMode) return;
  const main = document.querySelector('main') || document.body;
  const panel = document.createElement('section');
  panel.className = 'card';
  panel.style.marginBottom = '24px';
  panel.setAttribute('data-i18n-skip', '');
  panel.innerHTML = `<p class="eyebrow">SOLANA · TESTE ON-CHAIN</p><h2>Testar contrato RAFTT</h2><p>Rede: <strong id="chain-network"></strong>. Este painel envia transações de teste; os demais cards continuam sendo demonstrações. Não aplica taxas, equity ou marcos.</p><div class="actions"><select id="chain-wallet"><option value="phantom">Phantom</option><option value="solflare">Solflare</option></select><button type="button" id="chain-connect">Conectar carteira</button><button type="button" id="chain-disconnect" class="secondary">Desconectar</button></div><p id="chain-address"></p><label for="chain-authority">Carteira criadora da oferta (endereço público)</label><input id="chain-authority" autocomplete="off"><label>Identificador da oferta · u64</label><input id="chain-offering-id" value="0" inputmode="numeric"><div class="actions"><button type="button" id="chain-load">Consultar oferta e minha posição</button></div><pre id="chain-state" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre><details id="chain-create"><summary>Criar oferta de teste · várias por carteira</summary><label for="chain-mint">Endereço do mint SPL de teste</label><input id="chain-mint" autocomplete="off"><label for="chain-target">Meta em unidades do token (use ponto decimal)</label><input id="chain-target" inputmode="decimal" value="100"><button type="button" id="chain-initialize">Criar oferta na Solana</button></details><label for="chain-amount">Aporte em unidades do token da oferta</label><input id="chain-amount" inputmode="decimal" value="1"><div class="actions"><button type="button" data-chain-action="invest">Investir tokens de teste</button><button type="button" data-chain-action="refund">Solicitar reembolso</button><button type="button" data-chain-action="fail_offering" class="danger">Marcar oferta como falha</button><button type="button" data-chain-action="release">Liberar todos os fundos</button></div><p>Falha e liberação exigem a carteira criadora. Reembolso exige oferta falhada. A liberação ocorre uma única vez, após atingir a meta completa.</p><p role="status" aria-live="polite" id="chain-status"></p><a id="chain-explorer" target="_blank" rel="noopener" hidden>Ver transação no Explorer</a>`;
  main.prepend(panel);
  const $ = (id) => panel.querySelector('#' + id);
  $('chain-network').textContent = window.RafttSolanaConfig.network;
  $('chain-authority').value = sessionStorage.getItem('raftt-chain-authority') || '';
  const status = (message) => {
    $('chain-status').textContent = message;
  };
  let busy = false;
  async function run(fn) {
    if (busy) return;
    busy = true;
    panel.querySelectorAll('button').forEach((b) => (b.disabled = true));
    $('chain-explorer').hidden = true;
    status('Processando… confirme a transação na carteira quando solicitado.');
    try {
      await fn();
    } catch (e) {
      status(e.message || String(e));
    } finally {
      busy = false;
      panel.querySelectorAll('button').forEach((b) => (b.disabled = false));
    }
  }
  async function refresh() {
    const authority = $('chain-authority').value.trim();
    const s = await window.RafttChain.load(authority, $('chain-offering-id').value);
    sessionStorage.setItem('raftt-chain-authority', authority);
    $('chain-state').textContent =
      `Oferta: ${s.address}\nToken: ${s.mint}\nMeta: ${window.RafttChain.format(s.target, s.decimals)}\nArrecadado histórico: ${window.RafttChain.format(s.raised, s.decimals)}\nSaldo no cofre: ${window.RafttChain.format(BigInt(s.vaultBalance), s.decimals)}\nMinha posição: ${window.RafttChain.format(s.position, s.decimals)}\nEstado: ${s.released ? 'Fundos liberados' : s.failed ? 'Falhada' : s.closed ? 'Meta atingida' : 'Aberta'}`;
  }
  function result(sig) {
    status('Transação confirmada: ' + sig);
    if (window.RafttSolanaConfig.network === 'devnet') {
      $('chain-explorer').href =
        'https://explorer.solana.com/tx/' + encodeURIComponent(sig) + '?cluster=devnet';
      $('chain-explorer').hidden = false;
    }
  }
  window.addEventListener('raftt:transaction-sent', (e) =>
    status('Enviada, aguardando confirmação: ' + e.detail),
  );
  $('chain-connect').onclick = () =>
    run(async () => {
      const address = await window.RafttChain.connect($('chain-wallet').value);
      $('chain-address').textContent = 'Carteira: ' + address;
      if (!$('chain-authority').value) $('chain-authority').value = address;
      status('Carteira conectada. Consulte ou crie uma oferta.');
    });
  $('chain-disconnect').onclick = () =>
    run(async () => {
      await window.RafttChain.disconnect();
      $('chain-address').textContent = '';
      $('chain-state').textContent = '';
      status('Carteira desconectada.');
    });
  $('chain-load').onclick = () =>
    run(async () => {
      await refresh();
      status('Dados consultados na blockchain.');
    });
  $('chain-initialize').onclick = () =>
    run(async () => {
      const sig = await window.RafttChain.initialize(
        $('chain-mint').value.trim(),
        $('chain-target').value,
        $('chain-offering-id').value,
      );
      $('chain-authority').value = window.RafttChain.address();
      result(sig);
      try {
        await refresh();
      } catch (e) {
        status('Confirmada: ' + sig + '. Atualização falhou: ' + e.message);
      }
    });
  panel.querySelectorAll('[data-chain-action]').forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const sig = await window.RafttChain.act(
            b.dataset.chainAction,
            $('chain-authority').value.trim(),
            $('chain-amount').value,
            $('chain-offering-id').value,
          );
          result(sig);
          try {
            await refresh();
          } catch (e) {
            status('Confirmada: ' + sig + '. Atualização falhou: ' + e.message);
          }
        })),
  );
  // O checkout passa a usar este painel; sua antiga simulação não pode registrar um aporte on-chain.
  const demo = document.getElementById('invest-form');
  if (demo) {
    demo.closest('section').hidden = true;
  }
})();
