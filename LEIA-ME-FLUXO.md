# RAFTT — plataforma demonstrativa

Execute `node serve.mjs` na pasta RAFTT. Abra http://127.0.0.1:8765/index.html.

## Uma conta, duas áreas

Investir e captar são capacidades simultâneas. A navegação lateral apresenta as duas áreas e o menu de trabalho permite alternar entre elas. O login abre o mapa, com um guia em PT/EN. Trocar de área não apaga investimentos nem a proposta da empresa.

Investimentos: oportunidades ou mapa → ficha → aporte → confirmação → carteira → acompanhamento. Captação: apresentação → campos salvos no navegador → painel da empresa. Os campos são restaurados ao editar. Arquivos selecionados não são enviados ou armazenados.

Perfil, investimentos, proposta e liberação demonstrativa usam localStorage. Não são autenticação, pagamentos ou armazenamento de produção. Nenhum pagamento real ou transação blockchain é executado.

## Mapa 3D

Detalhes visuais originais restaurados: água com espuma Voronoi, malha de 120×120 segmentos, oito luzes locais, sombras 3072×3072 e resolução de até 2×. O modo Detalhada é usado ao abrir o mapa, inclusive quando havia uma preferência antiga por qualidade leve. A câmera inicial volta ao enquadramento original.

O design novo, os menus e as áreas simultâneas de investimento e captação permanecem. O link “Back to site” foi removido do menu do mapa. O controle de qualidade continua disponível.

São mantidos carregamento progressivo dos modelos, limite de 60 fps, suspensão do loop na aba oculta e reutilização de vetores. A qualidade original exige mais processamento gráfico.

## Investimento e marcos

Aporte pendente → confirmado → consolidado no fechamento simulado. Pendências permitem continuar ou cancelar. Taxas por faixas sobre aportes ativos no mesmo projeto, teto agregado US$ 250 por rodada.

Exemplo equity: meta US$ 100.000, veículo com 10% da startup. Comissão da empresa: 7%, capital líquido US$ 93.000. Quatro parcelas de US$ 23.250. Liberação de NULLUN: enviar evidências → aprovar → confirmar execução. Aprovação não registra dinheiro liberado. O painel apresenta a parcela proporcional do investidor sobre o capital líquido. Outros projetos permanecem com saldo reservado.

## Validação

Navegador Chromium: aporte, fechamento, perfil persistido, alternância das duas áreas, envio e restauração da proposta, navegação mapa → projeto, menus mobile e renderização do mapa com oito ilhas. Fluxos testados sem erros JavaScript. Layouts de desktop e celular inspecionados visualmente. Não foi realizado benchmark no computador do usuário.

## Perfil, idioma e filtros

O perfil organiza dados pessoais, contato e endereço (249 países e territórios), preferências de investimento, métodos de teste, entidades, privacidade, e-mail e prévia de segurança. Cada seção salva separadamente no navegador. Uma entidade cadastrada pode ser selecionada no aporte, e sua identificação é preservada no registro mesmo após remover a entidade do perfil. Métodos de teste também aparecem no formulário de aporte.

A escolha EN/PT na Index é salva em `raftt-lang` e acompanha login, cadastro, áreas da conta, mapa, ficha, aporte e carteira. O seletor no painel e o botão do mapa atualizam a mesma preferência.

O catálogo permite busca por nome, setor ou categoria, seleção entre oito categorias e filtro por disponibilidade. Startups têm dois projetos fictícios; as outras sete categorias estão em preparação, sem ofertas no MVP. Os filtros ficam na URL e podem ser compartilhados ou restaurados ao voltar.

Preferências de investidor são autodeclaradas: não são verificação de elegibilidade e não calculam limites regulatórios. Senhas do formulário de prévia não são armazenadas nem alteradas; 2FA permanece não configurada. As opções de privacidade não publicam dados nem iniciam coleta demográfica.

Validação desta versão: persistência de endereço e privacidade, 249 países, entidade selecionada no aporte, pagamento confirmado na carteira, filtros combinados e sem resultados, inglês durante a navegação e português após alternância, ausência de senha no armazenamento e layout de 390 px sem rolagem horizontal.

## Rodapé compartilhado

As 16 páginas internas e de acesso usam o rodapé compartilhado, com navegação entre investimento e captação, marca RAFTT em letras grandes, fundo neutro e realce azul no hover. O rodapé acompanha EN/PT, adapta suas colunas ao celular e respeita a preferência de movimento reduzido. A Index mantém seu rodapé original; o mapa não recebe rodapé.

## Identidade visual unificada

O logo de barco com wordmark `raftt.` substitui o logo antigo no cabeçalho da Index, menus e rodapés das páginas. Ícone e texto usam o azul da landing, #146b8c. Botões, seleções, focos e detalhes da aplicação usam a mesma família de azuis, com superfícies claras #e5f1f4 e #d7e9ee. O rodapé mantém a marca em letras grandes, alinhado às cores e ao fundo do rodapé da landing. O mapa recebe apenas ajustes de identidade na interface e continua sem rodapé.

Correção de cor: logo azul #3499b6, botões com o degradê exato da landing (#6fb6ca → #3499b6; hover #5da9bd → #287f99). As letras grandes do rodapé usam a base #cbd5e1 e os cinco stops originais #c9f7f0, #83e2dd, #42c5d0, #208eae e #145d83, com revelação radial no cursor.

## Nomes das páginas

Todos os arquivos HTML usam nomes descritivos em inglês, letras minúsculas e hífens. Os títulos das abas seguem `Nome da página | RAFTT` em PT/EN. Links e redirecionamentos internos foram atualizados. O servidor `serve.mjs` redireciona as URLs antigas para os nomes novos, preservando parâmetros de consulta. Em outro servidor estático, configure os mesmos redirecionamentos.

- `Index.html` → `index.html`
- `pagina-1.html` → `platform-overview.html`
- `pagina-2.html` → `opportunity-details.html`
- `choose-path.html` → `account-workspaces.html`
- `investment-demo.html` → `investment-checkout.html`
- `my-portfolio.html` → `portfolio.html`
- `user-profile.html` → `profile.html`
- `organization-dashboard.html` → `company-dashboard.html`
- `raise-application.html` → `company-application.html`
- `release-demo.html` → `milestone-releases.html`

Na apresentação da empresa, a opção Participação societária exige informar o percentual total oferecido na rodada (0,01% a 100%). O percentual é salvo, restaurado na edição e exibido no painel. Outros instrumentos não registram percentual societário fixo. O campo de tamanho de comunidade foi removido.

Valores monetários são apresentados com moeda, separador de milhar e duas casas decimais no idioma selecionado. Os campos exibem moeda ao sair do foco e permitem edição numérica no foco. O armazenamento usa valores numéricos sem máscara. Meta, captação anterior, aporte, renda e patrimônio compartilham a formatação e mantêm validação de limites.

Login convencional e acesso social demonstrativo abrem o mapa. O guia reaparece a cada login e pode ser reaberto pelo botão ?. Setas/WASD, controle tátil e toque/clique/arraste permitem navegar; pinça e roda do mouse controlam zoom. Ao chegar à costa de uma ilha, o barco para e abre a lista de empresas. A lista não reabre enquanto o barco permanece próximo: é preciso afastar-se para uma nova chegada.

## Plano de execução e capital por marco
A tela milestone-releases.html permite criar e salvar marcos reais da demonstração, sem inserir etapas fictícias automaticamente. Cada marco contém entrega, método de execução, responsável, datas, critérios de conclusão, condições de liberação, pré-requisito e custos discriminados (quantidade × valor unitário, uso e base da estimativa). O painel da empresa mostra a quantidade de marcos e os valores planejados e pagos.

O orçamento é calculado pelos itens, em USD, e comparado com a meta líquida após a comissão de 7%. Rascunhos podem ser salvos incompletos; o plano completo é necessário para revisão. A checagem demonstrativa não é uma integração de IA e não valida a autenticidade das fontes.

Fluxo: rascunho → revisão do plano → plano aprovado → evidências das condições de liberação → autorização da parcela → pagamento de teste confirmado → comprovação da entrega. O pagamento financia a execução; a evidência da entrega é registrada depois. As ações de aprovação e confirmação estão identificadas como simulação. Pré-requisitos exigem entrega comprovada do marco anterior. A rodada deve ser fechada na simulação antes de solicitar capital. Orçamentos acima da meta líquida impedem o avanço. A produção precisará de capital efetivamente confirmado, documentos verificáveis, revisão autorizada e execução financeira real.

Os dados são preservados neste navegador em raftt-milestones e raftt-demo-round-closed. Os exemplos antigos de investimento não são automaticamente vinculados aos novos marcos da empresa.
