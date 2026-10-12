(() => {
  'use strict';
  const dictionary = {
    '← Metas e parcelas': '← Milestones and installments',
    Idioma: 'Language',
    'Rodadas e liberação por etapas': 'Rounds and milestone releases',
    'Ambiente de teste': 'Test network',
    '. Rodadas v2 usam mínimo, prazo e aprovação da RAFTT. Ofertas antigas continuam no painel anterior.':
      '. V2 rounds use a minimum, deadline and RAFTT approval. Legacy offerings remain in the previous panel.',
    'Configuração inicial da RAFTT · responsável pelo deploy':
      'Initial RAFTT configuration · deployment authority',
    'Uma única vez: o responsável pelo deploy registra a carteira que revisará as rodadas e parcelas. Use uma carteira de teste diferente da startup.':
      'One-time setup: the deployment authority registers the wallet that reviews rounds and installments. Use a test wallet separate from the startup.',
    'Carteira autorizada da RAFTT': 'Authorized RAFTT wallet',
    'Registrar autoridade': 'Register authority',
    'Consultar rodada': 'Inspect round',
    'Endereço público da rodada v2': 'V2 round public address',
    'Consultar e atualizar': 'Load and refresh',
    'Criar uma nova rodada': 'Create a new round',
    'Identificador da rodada': 'Round identifier',
    'Mint SPL de teste': 'Test SPL mint',
    'Mínimo em tokens': 'Minimum in tokens',
    'Objetivo e limite de captação': 'Fundraising cap',
    'Encerramento · horário local': 'Closing deadline · local time',
    'Carteira destinatária dos fundos': 'Recipient wallet',
    'Plano para o cenário mínimo': 'Plan for the minimum funding scenario',
    'Metas, entregas, custos e condições. O orçamento inicial das parcelas deve somar o mínimo.':
      'Milestones, deliverables, costs and conditions. Initial installment budgets must add up to the minimum.',
    'Criar rascunho na Solana': 'Create draft on Solana',
    'Resultado da operação': 'Operation result',
    'Conecte a carteira e consulte uma rodada.': 'Connect your wallet and load a round.',
    'Os documentos são resumidos por SHA-256 no contrato. Guarde os textos e relatórios fora da blockchain. A análise automática de candidaturas e evidências está nas áreas da empresa e de revisão da RAFTT. Este painel técnico opera diretamente na Solana e não vincula novas rodadas ao cadastro da empresa.':
      'The contract stores SHA-256 document hashes. Keep texts and reports off-chain. Automatic application and evidence analysis is available in company and RAFTT review workspaces. This technical panel operates directly on Solana and does not link new rounds to company records.',
    'Captação concluída': 'Fundraising successful',
    'Captação aberta': 'Fundraising open',
    Rascunho: 'Draft',
    Falhada: 'Failed',
    'Solicitação em revisão': 'Submission under review',
    'Autorizada pela RAFTT': 'Authorized by RAFTT',
    'Parcela paga': 'Installment paid',
    Planejada: 'Planned',
    'Criadora:': 'Creator:',
    'Destinatário:': 'Recipient:',
    'Progresso da captação': 'Fundraising progress',
    mínimo: 'minimum',
    'Saldo no cofre:': 'Vault balance:',
    'Minha posição:': 'My position:',
    'Total liberado:': 'Total released:',
    'Encerramento:': 'Closing deadline:',
    'Cancelamento até:': 'Cancellation until:',
    'Valor do aporte ou cancelamento': 'Investment or cancellation amount',
    'Cancelar aporte': 'Cancel investment',
    'Solicitar reembolso': 'Request refund',
    'Encerrar pelo prazo': 'Close at deadline',
    'RAFTT · cancelar rodada': 'RAFTT · cancel round',
    Investir: 'Invest',
    'O cancelamento fica bloqueado a partir de': 'Cancellation is locked from',
    'Após o encerramento bem-sucedido, a posição permanece registrada.':
      'The position remains recorded after successful fundraising.',
    'Análise do plano pela IA e decisão da RAFTT': 'AI plan analysis and RAFTT decision',
    'RAFTT · aprovar e abrir captação': 'RAFTT · approve and open fundraising',
    'Documento da solicitação ou relatório da análise': 'Submission document or analysis report',
    'Enviar solicitação': 'Submit request',
    'RAFTT · autorizar parcela': 'RAFTT · authorize installment',
    'Executar pagamento autorizado': 'Execute authorized payment',
    'Adicionar parcela ao plano mínimo': 'Add an installment to the minimum plan',
    'Propor parcela adicional com o excedente': 'Propose an additional installment using surplus',
    'Valor em tokens': 'Amount in tokens',
    'Plano da parcela': 'Installment plan',
    'Registrar parcela': 'Register installment',
    'Evidências:': 'Evidence:',
    'Análise:': 'Review:',
    'Plano:': 'Plan:',
    Parcelas: 'Installments',
    'Parcela ': 'Installment ',
    'Carteira mudou durante a consulta. Consulte novamente.':
      'Wallet changed while loading. Load again.',
    'Processando… confirme na carteira quando solicitado.':
      'Processing… confirm in your wallet when requested.',
    'Transação confirmada:': 'Transaction confirmed:',
    'Dados atualizados.': 'Data updated.',
    'Assinatura recusada. Nenhuma operação foi enviada.':
      'Signature declined. No operation was sent.',
    'Aguardando assinatura na carteira…': 'Waiting for wallet signature…',
    'Enviando transação…': 'Sending transaction…',
    'Aguardando confirmação na Solana…': 'Waiting for confirmation on Solana…',
    'Conecte a carteira': 'Connect your wallet',
    Carteira: 'Wallet',
    Desconectada: 'Disconnected',
    Desconectar: 'Disconnect',
    Conectar: 'Connect',
    Provedor: 'Provider',
    'Valor u64 inválido': 'Invalid u64 value',
    'Índice inválido': 'Invalid index',
    'Informe o documento ou relatório da análise': 'Enter the document or analysis report',
    'IDL sem instrução v2': 'IDL missing V2 instruction',
    'Rodada v2 não encontrada': 'V2 round not found',
    'Parcela não encontrada': 'Installment not found',
    'Não foi possível consultar o horário da rede': 'Could not read network time',
    'Prazo inválido': 'Invalid deadline',
    'Carteira alterada; consulte novamente': 'Wallet changed; load again',
    'Captação indisponível.': 'Fundraising unavailable.',
    'Aporte acima do limite restante.': 'Investment exceeds remaining cap.',
    'Saldo de tokens insuficiente.': 'Insufficient token balance.',
    'Cancelamento indisponível para este prazo ou valor.':
      'Cancellation unavailable for this deadline or amount.',
    'Reembolso exige rodada falhada e posição positiva.':
      'Refund requires a failed round and a positive position.',
    'Parcela ainda não autorizada, fora de ordem ou já paga.':
      'Installment not authorized, out of order or already paid.',
  };
  const entries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
  const textSources = new WeakMap(),
    attributeSources = new WeakMap();
  const english = () => localStorage.getItem('raftt-lang') === 'en';
  function translate(text) {
    let result = text.replace(/\s+/g, ' ');
    for (const [pt, en] of entries) result = result.split(pt).join(en);
    return result;
  }
  function apply() {
    const main = window.document?.querySelector('main');
    if (!main) return;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('textarea,script,style,option')) continue;
      const old = textSources.get(node),
        source = old && node.nodeValue === old.rendered ? old.source : node.nodeValue;
      const rendered = english() ? translate(source) : source;
      textSources.set(node, { source, rendered });
      if (node.nodeValue !== rendered) node.nodeValue = rendered;
    }
    for (const el of main.querySelectorAll('[placeholder],[aria-label]')) {
      let attrs = attributeSources.get(el);
      if (!attrs) {
        attrs = {};
        attributeSources.set(el, attrs);
      }
      for (const attr of ['placeholder', 'aria-label'])
        if (el.hasAttribute(attr)) {
          attrs[attr] ??= el.getAttribute(attr);
          const value = english() ? translate(attrs[attr]) : attrs[attr];
          if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
        }
    }
    document.documentElement.lang = english() ? 'en' : 'pt-BR';
    document.title = english() ? 'Rounds and installments | RAFTT' : 'Rodadas e parcelas | RAFTT';
  }
  const select = document.getElementById('round-language');
  select.value = english() ? 'en' : 'pt';
  select.onchange = () => {
    localStorage.setItem('raftt-lang', select.value);
    apply();
  };
  new MutationObserver(apply).observe(document.querySelector('main'), {
    childList: true,
    characterData: true,
    subtree: true,
  });
  apply();
})();
