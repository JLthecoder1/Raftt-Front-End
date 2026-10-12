## Atualização v24 — painel técnico PT/EN e sessão da API

/round-v2 tem seleção de idioma persistente, tradução de textos fixos, estados, ações e mensagens, além de orientação atualizada para o fluxo com IA. Valores digitados e documentos permanecem intactos ao trocar idioma. Requisições da API que recebem HTTP 401 tentam renovar a sessão uma única vez, somente mantendo o mesmo usuário. O log 401 isolado não permite identificar a chamada ou confirmar a causa. Se continuar após a atualização, entre novamente e confira se frontend/backend usam o mesmo Supabase. Não exige SQL ou atualização do backend.

## Atualização v22 — cadastro e plano de metas

Depois de enviar a candidatura, a interface abre /milestone-releases. Crie e salve metas completas. Clique em Enviar plano de metas para revisão para criar uma nova versão da candidatura incluindo as metas, critérios, prazos e custos em USD. O agente processa essa nova versão automaticamente. O deck existente é mantido. O plano enviado é uma proposta; o cadastro das parcelas na Solana acontece depois da aprovação e criação da rodada. Não exige migração nova nem atualização do backend.

## Atualização v21 — edição com deck salvo

A candidatura mostra o nome do deck já enviado e permite avançar sem selecionar outro arquivo. Ao reenviar, a nova versão mantém o vínculo ao documento existente. Selecionar um novo arquivo substitui o deck somente na nova versão; o documento anterior permanece no histórico. Não exige SQL novo nem atualização do backend. Verificação: `node scripts/test-edit-deck.cjs`.

## Atualização v20 — agente automático

Consulte README-AGENT-v20.md. O frontend mostra andamento e relatórios do agente nas telas da empresa, revisão e metas. Atualize também o backend para v2, rode a migração 005 e configure a chave Gemini somente no servidor. A análise funciona automaticamente após o envio final da candidatura/evidências; rascunhos não geram tarefas. Teste: `npm run test:agent`.

## Atualização v19

Sair da conta sincroniza as abas da mesma origem, limpa dados locais da conta e desconecta a carteira. Páginas privadas voltam ao login; páginas públicas continuam acessíveis sem a sessão. Teste: `npm run test:logout`. Desconectar apenas a carteira não encerra o login por email. Esta atualização não exige SQL novo.

# Atualização v17

Leia **README-V17.md** e aplique **database/004_workspace_drafts.sql** antes de testar a sincronização dos rascunhos. As seções v16 abaixo são histórico da integração anterior.

# Atualização v16 — backend conectado

Consulte **README-BACKEND-v16.md** para rodar esta versão e testar o fluxo integrado. A documentação abaixo descreve a base do frontend.

# RAFTT

Pacote 15: consulte [README-V2.md](README-V2.md) para a integração atual na devnet, operações reais e limitações.

Frontend da demonstração de investimento coletivo em ativos privados. HTML, CSS e JavaScript, sem etapa de build.

## Executar

Com Node.js instalado, execute `npm start` (ou `node serve.mjs`) e abra http://127.0.0.1:8765/index.html. A porta pode ser alterada pela variável `PORT`. As páginas ficam na raiz para preservar URLs e navegação.

## Estrutura

- `assets/js/shared/`: idioma, marca, valores, títulos e rodapé.
- `assets/js/landing/`: página inicial e suas animações.
- `assets/js/auth/`: formulários de acesso e controle de sessão demonstrativa.
- `assets/js/account/`: perfil e preferências.
- `assets/js/investor/`: composição dos painéis e fluxo de investimento.
- `assets/js/company/`: marcos, orçamento e exclusão de captação.
- `assets/js/map/`: navegação, categorias e guia do mapa.
- `assets/js/demo/`: fluxos auxiliares de demonstração.
- `assets/js/vendor/`: dependências locais e loaders; mantenha seus arquivos relacionados.
- `assets/css/`: estilos por página e estilos compartilhados.
- `assets/images/markets/`: imagens das oito categorias.
- `assets/models/map/`: ilhas e barco em GLB.
- `assets/models/currencies/`: modelos GLTF, buffers e respectivas licenças.
- `assets/fonts/`, `assets/media/`: fonte local e vídeo da página inicial.
- `docs/fluxo-mvp.md`: comportamento e limitações do MVP.
- `docs/organizacao.md`: registro da organização e remoções.

Dados de demonstração ficam no navegador. Pagamentos, autenticação e revisão de IA ainda são demonstrativos.

## Padronização do código

JavaScript, CSS, HTML e documentação seguem a configuração do Prettier. Para desenvolvimento, execute `npm install` e use `npm run format` ou `npm run format:check`. Dependências de terceiros em `assets/js/vendor/` são preservadas sem reformatação. Os formulários da empresa e a apresentação da plataforma possuem scripts próprios; os estilos do formulário ficam em `assets/css/company-application.css`.

### Catálogo e mapa — v12

Mapa e oportunidades consultam empresas publicadas no Supabase com sessão autenticada. Rascunhos não aparecem na descoberta. Não há empresas fictícias como fallback do mapa. Nenhuma migração SQL adicional é necessária. Execute `npm run test:catalog` para verificar filtragem e fluxo do mapa com serviço simulado. A configuração de ambiente permanece separada em `assets/js/backend/config.js` e `assets/js/solana/config.js`.
