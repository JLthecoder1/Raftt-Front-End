# RAFTT

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
