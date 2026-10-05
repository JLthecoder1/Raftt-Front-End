const languageToggle = document.querySelector("#language-current");
const languageTrigger = document.querySelector("#language-toggle");
const languageMenu = document.querySelector("#language-menu");
const languageOptions = document.querySelectorAll("[data-language]");

const portugueseText = [
    [".nav-link", ["Mercados", "Como funciona", "Marcos", "Perguntas frequentes", "Capte com a Raftt"]],
    [".call-button", ["Começar"]],
    [".intro-eyebrow", ["UMA NOVA ROTA PARA OS MERCADOS PRIVADOS", "MOEDAS DESCENTRALIZADAS E STABLECOINS NA RAFTT", "COMO FUNCIONA", "O CAPITAL ACOMPANHA O PROGRESSO", "VISIBILIDADE APÓS INVESTIR", "MERCADOS NO HORIZONTE", "A INFRAESTRUTURA POR TRÁS"]],
    [".intro-content h1", ["Investir em conjunto."]],
    [".intro-content > p", [
        "A Raftt está construindo uma infraestrutura que permite que pessoas invistam coletivamente em startups e outros ativos privados.",
        "Nosso foco vai além do investimento: a IA apoia a análise, acompanha a execução e ajuda a avaliar evidências em relação a marcos acordados. Assim, o capital pode ser liberado em etapas à medida que esses marcos são verificados."
    ]],
    [".workflow-landing-actions a", ["Quero investir", "Quero captar"]],
    [".globe-status", ["Gire o globo"]],
    [".stablecoins-content h2", ["Capital descentralizado, investimentos estáveis."]],
    [".stablecoins-content > p:last-child", ["Moedas descentralizadas e stablecoins tornam o investimento coletivo mais transparente, estável e fácil de acompanhar."]],
    [".how-it-works-content h2", ["Uma oportunidade.<br>Uma jornada compartilhada."]],
    [".how-it-works-description", ["Da descoberta de um projeto ao acompanhamento do seu progresso, cada etapa tem um objetivo claro."]],
    [".process-card h3", ["Explorar", "Investir", "Acompanhar"]],
    [".process-card-content > p", [
        "Entenda o projeto, suas condições, riscos e marcos propostos.",
        "Junte-se a outros investidores em uma oportunidade compartilhada e com condições acordadas.",
        "Acompanhe atualizações, evidências e o capital liberado em cada etapa."
    ]],
    [".milestone-intro h2", ["Marco alcançado.<br>Próxima etapa liberada."]],
    [".milestone-description", ["Antes do início do financiamento, o projeto e os investidores concordam sobre os marcos, as evidências necessárias e as regras de liberação. Cada etapa vincula o capital a uma entrega específica."]],
    [".milestone-note", ["Exemplo ilustrativo · Estas não são ofertas de investimento ativas."]],
    [".milestone-list", ["Etapas ilustrativas de liberação de capital"]],
    [".milestone-details h3", ["Desenvolver o produto", "Validar com clientes", "Preparar para crescer"]],
    [".milestone-details p", [
        "Um MVP funcional e uma entrega documentada.",
        "Resultados do piloto avaliados segundo critérios acordados.",
        "Evidências das metas comerciais e operacionais acordadas."
    ]],
    [".milestone-details > span", ["Evidência → verificação → liberação", "Evidência → verificação → liberação", "Evidência → verificação → liberação"]],
    [".milestone-share > span", ["do capital", "do capital", "do capital"]],
    [".visibility-content h2", ["Mais contexto.<br>Em toda a jornada."]],
    [".visibility-label", ["01 / Análise", "02 / Acompanhamento", "03 / Verificação"]],
    [".visibility-item h3", ["Entenda antes de participar.", "Acompanhe a execução.", "Verifique cada marco."]],
    [".visibility-item > p:last-child", [
        "A IA ajuda a organizar informações do projeto, resumir documentos e destacar questões para análise.",
        "Atualizações e evidências oferecem uma visão contínua do progresso em relação ao plano original.",
        "As evidências são avaliadas segundo critérios acordados, com análise humana para decisões e exceções."
    ]],
    [".markets-content h2", ["Começamos com startups.<br>Com um horizonte mais amplo."]],
    [".markets-description", ["Startups são nosso foco inicial. A mesma abordagem foi pensada para alcançar outros ativos privados, com estruturas e marcos adequados a cada mercado."]],
    ["#markets .market-card h3", ["Startups", "Crédito privado para pequenas e médias empresas", "Financiamento de recebíveis", "Imóveis", "Energia", "Agricultura", "Infraestrutura", "Royalties e propriedade intelectual"]],
    ["#markets .market-card p", ["Foco inicial", "Expansão futura", "Expansão futura", "Expansão futura", "Expansão futura", "Expansão futura", "Expansão futura", "Expansão futura"]],
    [".faq-content h2", ["Regras claras.<br>Movimentações rastreáveis."]],
    [".faq-description", ["A Raftt planeja usar stablecoins e contratos programáveis na Solana para gerenciar a liberação escalonada de capital e registrar transações. Documentos do projeto, condições acordadas e processos de verificação conectam essas transações à execução no mundo real."]],
    [".faq-item summary", ["O que a IA faz?", "Por que liberar o capital em etapas?", "Já posso investir?"]],
    [".faq-item > p", [
        "A IA apoia a análise e o acompanhamento ao organizar informações e identificar pontos que precisam de revisão. As decisões sobre marcos seguem regras acordadas e processos de verificação; a IA não garante os resultados do projeto.",
        "Cada liberação financia uma parte definida do plano. Os investidores podem acompanhar as evidências e o progresso associados a cada etapa.",
        "A Raftt está em desenvolvimento. Esta página apresenta o produto planejado; oportunidades ativas e acesso para investidores ainda não estão disponíveis."
    ]],
    [".footer-column h2", ["Explorar", "Sobre a Raftt", "Ajuda"]],
    [".footer-column a", ["Início", "Como funciona", "Marcos", "Mercados", "Para empresas: capte com a Raftt", "Nossa abordagem", "Perguntas frequentes"]],
    [".footer-about > p", ["Pequenas embarcações, grandes mercados. Uma jornada compartilhada por ativos privados, com progresso à vista."]],
    [".footer-bottom > span", ["© 2026 Raftt. Todos os direitos reservados."]]
];

const portugueseHtml = [
    [".how-it-works-content h2", ["Uma oportunidade.<br>Uma jornada compartilhada."]],
    [".milestone-intro h2", ["Marco alcançado.<br>Próxima etapa liberada."]],
    [".visibility-content h2", ["Mais contexto.<br>Em toda a jornada."]],
    [".markets-content h2", ["Começamos com startups.<br>Com um horizonte mais amplo."]],
    [".faq-content h2", ["Regras claras.<br>Movimentações rastreáveis."]]
];

const portugueseVideoCopy = [
    ["RAFTT", "Barcos pequenos.", "Grandes mercados.", "Acesso coletivo a ativos privados, com um caminho mais claro."],
    ["EXPLORE OPORTUNIDADES", "Novas rotas.", "Um novo começo.", "Descubra startups e oportunidades nos mercados privados."],
    ["INVISTA EM CONJUNTO", "Uma jornada compartilhada.", "Um objetivo em comum.", "Reúna investidores em torno de uma oportunidade e de marcos definidos."],
    ["ACOMPANHE O PROGRESSO", "Cada entrega.", "Um passo adiante.", "A IA apoia a análise e o acompanhamento. A proposta é liberar o capital em etapas, conforme os marcos são verificados."],
    ["RAFTT", "Navegue rumo", "ao próximo passo.", "Pequenos barcos navegando por grandes mercados."]
];

const generatedSelectors = [".video-copy-line", ".video-copy-description"];
const originalMarkup = new Map();
const originalAttributes = new Map();

[
    ...portugueseText.map(([selector]) => selector),
    ...portugueseHtml.map(([selector]) => selector),
    ...generatedSelectors,
    ".video-copy-eyebrow",
    ".video-copy-cta",
    ".scroll-cue",
    ".footer-contact",
    "#markets .market-card-image"
].forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
        if (!originalMarkup.has(element)) originalMarkup.set(element, element.innerHTML);
    });
});

[
    [".primary-nav", "aria-label"],
    [".menu-toggle", "aria-label"],
    [".workflow-landing-actions", "aria-label"],
    [".intro-globe-canvas", "aria-label"],
    [".model-coin-grid", "aria-label"],
    [".milestone-list", "aria-label"],
    [".video-copy", "aria-label"],
    ["#vid", "aria-label"],
    [".brand", "aria-label"],
    ...Array.from(document.querySelectorAll(".footer-column, .process-card-login, .market-card-image, .process-card-image, .start-image, .model-coin-grid model-viewer"), (element) => [
        element,
        element.matches("img, model-viewer") ? "alt" : "aria-label"
    ])
].forEach(([selectorOrElement, attribute]) => {
    const elements = typeof selectorOrElement === "string"
        ? document.querySelectorAll(selectorOrElement)
        : [selectorOrElement];
    elements.forEach((element) => {
        if (!originalAttributes.has(element)) originalAttributes.set(element, new Map());
        originalAttributes.get(element).set(attribute, element.getAttribute(attribute));
    });
});

function setText(selector, values) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
        if (values[index] !== undefined) element.textContent = values[index];
    });
}

function setLeadingText(selector, value) {
    const element = document.querySelector(selector);
    const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.textContent = value;
}

function setGeneratedText(selector, values) {
    setText(selector, values);
    document.querySelectorAll(selector).forEach((element) => {
        const text = element.textContent.trim();
        const fragment = document.createDocumentFragment();
        element.setAttribute("aria-label", text);
        text.split(/\s+/).forEach((word, index, words) => {
            const span = document.createElement("span");
            span.className = "generated-word";
            span.setAttribute("aria-hidden", "true");
            span.textContent = word;
            fragment.append(span);
            if (index < words.length - 1) fragment.append(" ");
        });
        element.replaceChildren(fragment);
    });
}

function translateHome(toPortuguese) {
    localStorage.setItem("raftt-lang", toPortuguese ? "pt" : "en");
    document.documentElement.lang = toPortuguese ? "pt-BR" : "en";
    document.title = toPortuguese ? "Mercados privados, juntos | RAFTT" : "Private markets, together | RAFTT";
    originalMarkup.forEach((markup, element) => {
        element.innerHTML = markup;
    });
    originalAttributes.forEach((attributes, element) => {
        attributes.forEach((value, attribute) => {
            if (value === null) element.removeAttribute(attribute);
            else element.setAttribute(attribute, value);
        });
    });
    languageToggle.textContent = toPortuguese ? "English" : "Português";
    languageToggle.lang = toPortuguese ? "en" : "pt";
    languageToggle.setAttribute("aria-label", toPortuguese ? "Mudar o idioma para inglês" : "Switch language to Portuguese");
    if (!toPortuguese) {
        setGeneratedText(".video-copy-line", [...document.querySelectorAll(".video-copy-line")].map((element) => element.textContent));
        setGeneratedText(".video-copy-description", [...document.querySelectorAll(".video-copy-description")].map((element) => element.textContent));
        return;
    }
    document.querySelector(".primary-nav").setAttribute("aria-label", toPortuguese ? "Navegação principal" : "Main navigation");
    document.querySelector(".menu-toggle").setAttribute("aria-label", toPortuguese ? "Abrir menu" : "Open menu");
    document.querySelector(".workflow-landing-actions").setAttribute("aria-label", toPortuguese ? "Escolha como quer usar a Raftt" : "Choose your Raftt journey");
    document.querySelector(".intro-globe-canvas").setAttribute("aria-label", toPortuguese
        ? "Globo interativo com marcadores em Nova York, Londres, Tóquio, Sydney, Paris, Nova Délhi, Moscou, Rio de Janeiro, Xangai, Dubai, Buenos Aires, Singapura e Seul"
        : "Interactive globe with markers for New York, London, Tokyo, Sydney, Paris, New Delhi, Moscow, Rio de Janeiro, Shanghai, Dubai, Buenos Aires, Singapore, and Seoul");
    document.querySelector(".model-coin-grid").setAttribute("aria-label", toPortuguese
        ? "Moedas descentralizadas e stablecoins interativas em 3D"
        : "Interactive 3D decentralized currencies and stablecoins");
    document.querySelector(".milestone-list").setAttribute("aria-label", toPortuguese
        ? "Etapas ilustrativas de liberação de capital"
        : "Illustrative capital release stages");
    document.querySelector(".video-copy").setAttribute("aria-label", toPortuguese ? "Mensagens sobre a Raftt" : "Messages about Raftt");
    document.querySelector("#vid").setAttribute("aria-label", toPortuguese ? "Vídeo controlado pela rolagem" : "Scroll-controlled video");
    document.querySelectorAll(".model-coin-grid model-viewer").forEach((element, index) => {
        element.alt = toPortuguese
            ? (index === 2 ? "Stablecoin interativa em 3D" : "Moeda descentralizada interativa em 3D")
            : (index === 2 ? "Interactive 3D stablecoin" : "Interactive 3D decentralized currency");
    });
    const hint = document.querySelector("#hint");
    const hintMessages = {
        duration: ["The video duration could not be read.", "Não foi possível ler a duração do vídeo."],
        file: [
            "Open this page with VS Code Live Server to enable the video and globe texture.",
            "Abra esta página com o Live Server do VS Code para carregar o vídeo e a textura do globo."
        ],
        unavailable: [
            "The video could not be loaded. Check that assets/media/Navegante.mp4 is available.",
            "Não foi possível carregar o vídeo. Verifique se assets/media/Navegante.mp4 está disponível."
        ]
    };
    if (hint.dataset.messageKey) {
        hint.textContent = hintMessages[hint.dataset.messageKey][toPortuguese ? 1 : 0];
    }

    if (toPortuguese) {
        document.querySelector(".brand").setAttribute("aria-label", "Raftt - página inicial");
        document.querySelectorAll(".footer-column").forEach((element, index) => {
            element.setAttribute("aria-label", ["Explorar a Raftt", "Sobre a Raftt", "Ajuda"][index]);
        });
        document.querySelectorAll(".process-card-login").forEach((element, index) => {
            element.setAttribute("aria-label", ["Entrar para explorar oportunidades", "Entrar para investir", "Entrar para acompanhar marcos"][index]);
        });
        portugueseText.forEach(([selector, values]) => setText(selector, values));
        setLeadingText(".scroll-cue", "Role para explorar ");
        setLeadingText(".footer-contact", "Descubra a jornada ");
        portugueseHtml.forEach(([selector, values]) => {
            document.querySelectorAll(selector).forEach((element, index) => {
                if (values[index] !== undefined) element.innerHTML = values[index];
            });
        });
        const videoEyebrows = portugueseVideoCopy.map(([eyebrow]) => eyebrow);
        setText(".video-copy-eyebrow", videoEyebrows);
        setGeneratedText(".video-copy-line", portugueseVideoCopy.flatMap(([, firstLine, secondLine]) => [firstLine, secondLine]));
        setGeneratedText(".video-copy-description", portugueseVideoCopy.map(([, , , description]) => description));
        document.querySelector(".video-copy-cta").firstChild.textContent = "Como funciona a Raftt ";
        document.querySelector(".start-image").alt = "Ilustração de uma pessoa navegando pelo mar entre ilhas";
        document.querySelectorAll(".process-card-image").forEach((image, index) => {
            image.alt = [
                "Ilustração de uma pessoa explorando oportunidades nos mercados privados",
                "Ilustração de investidores iniciando uma jornada compartilhada",
                "Ilustração de uma pessoa acompanhando marcos de investimento"
            ][index];
        });
        document.querySelectorAll(".market-card-image").forEach((image, index) => {
            image.alt = [
                "Equipe de startup colaborando em um protótipo",
                "Equipe trabalhando em uma pequena indústria",
                "Análise de recebíveis em uma operação de atacado",
                "Empreendimento imobiliário contemporâneo em expansão",
                "Fazenda solar em operação",
                "Trator trabalhando entre campos e silos",
                "Porto moderno com centro de dados",
                "Estúdio criativo de música, cinema e jogos"
            ][index];
        });
    }
}

function closeLanguageMenu() {
    languageMenu.hidden = true;
    languageTrigger.setAttribute("aria-expanded", "false");
}

languageTrigger.addEventListener("click", () => {
    const isOpen = languageTrigger.getAttribute("aria-expanded") === "true";
    languageMenu.hidden = isOpen;
    languageTrigger.setAttribute("aria-expanded", String(!isOpen));
});

languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
        const isPortuguese = option.dataset.language === "pt-BR";
        translateHome(isPortuguese);
        languageToggle.textContent = isPortuguese ? "PT" : "EN";
        languageOptions.forEach((item) => {
            item.setAttribute("aria-checked", String(item === option));
        });
        closeLanguageMenu();
        languageTrigger.focus();
    });
});

document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".language-picker")) closeLanguageMenu();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !languageMenu.hidden) {
        closeLanguageMenu();
        languageTrigger.focus();
    }
});

const savedHomeLanguage = localStorage.getItem("raftt-lang") || "en";
translateHome(savedHomeLanguage === "pt");
languageToggle.textContent = savedHomeLanguage === "pt" ? "PT" : "EN";
languageOptions.forEach(option => option.setAttribute("aria-checked", String(option.dataset.language === (savedHomeLanguage === "pt" ? "pt-BR" : "en"))));
