(() => {
  'use strict';
  const en = () => window.RafttI18n.lang === 'en',
    t = (pt, eng) => (en() ? eng : pt);
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const countryCodes =
    'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
      ' ',
    );
  const countries = (value) => {
    const d = new Intl.DisplayNames([en() ? 'en' : 'pt-BR'], { type: 'region' });
    return (
      `<option value="">${t('Selecione um país', 'Select a country')}</option>` +
      countryCodes
        .map((code) => ({ code, name: d.of(code) }))
        .sort((a, b) => a.name.localeCompare(b.name, en() ? 'en' : 'pt-BR'))
        .map(
          (c) =>
            `<option value="${c.code}" ${c.code === value ? 'selected' : ''}>${esc(c.name)}</option>`,
        )
        .join('')
    );
  };
  const input = (id, label, value = '', type = 'text', attrs = '') =>
    `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${attrs}></div>`;
  const check = (id, label, checked = false, description = '') =>
    `<label class="setting-toggle" for="${id}"><span><strong>${label}</strong>${description ? `<small>${description}</small>` : ''}</span><input id="${id}" name="${id}" type="checkbox" ${checked ? 'checked' : ''}><span class="toggle-track" aria-hidden="true"></span></label>`;
  const save = () =>
    `<div class="section-save"><button type="submit">${t('Salvar alterações', 'Save changes')}</button><p class="save-status" role="status" aria-live="polite"></p></div>`;
  const section = (id, k, title, description, body) =>
    `<section id="${id}" class="card settings-section"><div class="section-heading"><span class="section-number">${k}</span><div><h2>${title}</h2><p class="muted">${description}</p></div></div>${body}</section>`;
  function render(p) {
    const a = p.address || {},
      v = p.investor || {},
      privacy = p.privacy || {};
    return (
      `<div class="profile-heading"><div><p class="eyebrow">${t('CONTA / PREFERÊNCIAS', 'ACCOUNT / SETTINGS')}</p><h1>${t('Seu perfil, por inteiro.', 'Your profile, in full.')}</h1><p class="lead muted">${t('Uma identidade para investir e construir. Organize seus dados e escolha como participar.', 'One identity to invest and build. Keep your details together and choose how to participate.')}</p></div></div><div class="profile-summary"><span class="badge">${t('Investidor + empresa', 'Investor + company')}</span><span>${t('Dados associados à sua conta', 'Data linked to your account')}</span></div><div class="settings-layout"><nav class="settings-nav" aria-label="${t('Seções do perfil', 'Profile sections')}">${[
        ['identity', t('Dados pessoais', 'Personal details')],
        ['contact', t('Contato e endereço', 'Contact & address')],
        ['investor', t('Preferências de investimento', 'Investor settings')],
        ['payments', t('Métodos de pagamento', 'Payment methods')],
        ['entities', t('Entidades de investimento', 'Investment entities')],
        ['privacy', t('Privacidade', 'Privacy')],
        ['security', t('E-mail e segurança', 'Email & security')],
      ]
        .map(([id, label]) => `<a href="#${id}">${label}<span>↗</span></a>`)
        .join('')}</nav><div class="settings-content">` +
      section(
        'identity',
        '01',
        t('Dados pessoais', 'Personal details'),
        t(
          'Seu perfil acompanha as duas áreas da conta.',
          'Your profile works across both account areas.',
        ),
        `<form data-settings="identity"><div class="form-grid">${input('name', t('Nome completo', 'Full name'), p.name, 'text', 'required maxlength="80" autocomplete="name"')}${input('headline', t('Título profissional', 'Professional headline'), p.headline, 'text', 'maxlength="120"')}${input('phone', t('Telefone', 'Phone number'), p.phone, 'tel', 'autocomplete="tel"')}<div class="field full"><label for="bio">${t('Sobre você', 'About you')}</label><textarea id="bio" maxlength="600" rows="3">${esc(p.bio)}</textarea></div><div class="field"><label for="role">${t('Área preferida', 'Preferred workspace')}</label><select id="role"><option value="investor" ${p.activeWorkspace === 'investor' ? 'selected' : ''}>${t('Investimentos', 'Investments')}</option><option value="organization" ${p.activeWorkspace === 'organization' ? 'selected' : ''}>${t('Captação da empresa', 'Company fundraising')}</option></select></div></div><p class="field-help">${t('Você pode investir e captar simultaneamente. O login abre o mapa; os painéis continuam disponíveis no menu.', 'You can invest and raise capital at the same time. Sign-in opens the map; dashboards remain available in the menu.')}</p>${save()}</form>`,
      ) +
      section(
        'contact',
        '02',
        t('Contato e endereço', 'Contact & mailing address'),
        t('Informações para contato e correspondência.', 'Your contact and mailing details.'),
        `<form data-settings="address"><div class="form-grid">${input('street', t('Rua e número', 'Street address'), a.street, 'text', 'autocomplete="address-line1"')}${input('suite', t('Apartamento / complemento', 'Apt / suite'), a.suite, 'text', 'autocomplete="address-line2"')}<div class="field"><label for="country">${t('País', 'Country')}</label><select id="country" autocomplete="country">${countries(a.country)}</select></div>${input('city', t('Cidade', 'City'), a.city, 'text', 'autocomplete="address-level2"')}${input('state', t('Estado / província', 'State / province'), a.state, 'text', 'autocomplete="address-level1"')}${input('postal', t('Código postal', 'Postal code'), a.postal, 'text', 'autocomplete="postal-code"')}</div><p class="field-help">${t('O endereço poderá ser usado para correspondência física. Informações essenciais de investimento serão enviadas por e-mail quando a comunicação estiver integrada.', 'Your address may be used for physical mail. Essential investment information will be sent by email once communications are integrated.')}</p>${save()}</form>`,
      ) +
      section(
        'investor',
        '03',
        t('Preferências de investimento', 'Investor settings'),
        t(
          'Informações autodeclaradas para conhecer seu perfil.',
          'Self-reported information about your investor profile.',
        ),
        `<form data-settings="investor">${check('accredited', t('Declaro ser um investidor qualificado / acreditado', 'I declare that I am a qualified / accredited investor'), v.accredited, t('A declaração não verifica sua elegibilidade. Os critérios dependem do país e da oferta.', 'This declaration does not verify eligibility. Criteria depend on your country and the offering.'))}<div class="form-grid"><div class="field"><label for="employment">${t('Situação profissional', 'Employment status')}</label><select id="employment"><option value="">${t('Selecione uma opção', 'Select status')}</option>${[
          ['employed', 'Empregado', 'Employed'],
          ['self-employed', 'Autônomo / empresário', 'Self-employed / business owner'],
          ['unemployed', 'Desempregado', 'Unemployed'],
          ['retired', 'Aposentado', 'Retired'],
          ['student', 'Estudante', 'Student'],
        ]
          .map(
            ([id, pt, e]) =>
              `<option value="${id}" ${id === v.employment ? 'selected' : ''}>${t(pt, e)}</option>`,
          )
          .join(
            '',
          )}</select></div><div class="field"><label for="currency">${t('Moeda dos valores declarados', 'Currency of declared amounts')}</label><select id="currency">${['USD', 'BRL', 'EUR', 'GBP'].map((c) => `<option ${c === (v.currency || 'USD') ? 'selected' : ''}>${c}</option>`).join('')}</select></div>${input('income', t('Renda anual', 'Yearly income'), v.income, 'number', 'min="0" step="0.01"')}${input('netWorth', t('Patrimônio líquido', 'Net worth'), v.netWorth, 'number', 'min="0" step="0.01"')}</div>${check('spouse', t('Os valores incluem a renda e o patrimônio do meu cônjuge', 'Amounts include my spouse’s income and net worth'), v.spouse)}${check('previous', t('Investi em ofertas de crowdfunding nos últimos 12 meses', 'I invested in crowdfunding offerings in the past 12 months'), v.previous)}<p class="field-help">${t('O MVP não calcula limites regulatórios nem autoriza investimentos reais. As verificações serão definidas por jurisdição e instrumento da rodada.', 'The MVP does not calculate regulatory limits or authorize real investments. Checks will depend on jurisdiction and offering instrument.')}</p>${save()}</form>`,
      ) +
      section(
        'payments',
        '04',
        t('Métodos de pagamento', 'Payment methods'),
        t('Organize suas preferências de pagamento.', 'Manage payment preferences.'),
        `<div id="methods-list"></div><form data-settings="method"><div class="form-grid">${input('methodLabel', t('Nome do método', 'Method name'), '', 'text', 'required maxlength="60" placeholder="Demo USDC"')}<div class="field"><label for="methodType">${t('Tipo', 'Type')}</label><select id="methodType"><option value="balance">${t('Referência de saldo', 'Balance reference')}</option><option value="usdc">USDC · Solana · ${t('teste', 'test')}</option></select></div></div><p class="field-help">${t('Essas referências não executam pagamentos. As transações da Solana usam a carteira conectada; não informe chaves privadas.', 'These references do not execute payments. Solana transactions use the connected wallet; do not enter private keys.')}</p><div class="section-save"><button>${t('Adicionar método de teste', 'Add test method')}</button><p class="save-status" role="status"></p></div></form>`,
      ) +
      section(
        'entities',
        '05',
        t('Entidades de investimento', 'Investment entities'),
        t(
          'Registre os dados declarados de uma entidade sob seu controle.',
          'Record declared information about an entity you control.',
        ),
        `<div id="entities-list"></div><form data-settings="entity"><div class="form-grid">${input('entityName', t('Nome legal da entidade', 'Entity legal name'), '', 'text', 'required maxlength="120"')}<div class="field"><label for="entityType">${t('Tipo de entidade', 'Entity type')}</label><select id="entityType"><option value="corporation">${t('Empresa', 'Corporation')}</option><option value="trust">Trust</option><option value="other">${t('Outra entidade', 'Other entity')}</option></select></div><div class="field"><label for="entityCountry">${t('País de registro', 'Country of registration')}</label><select id="entityCountry" required>${countries('')}</select></div>${input('entityRegistration', t('Número de registro (opcional)', 'Registration number (optional)'), '', 'text', 'maxlength="80"')}</div><p class="field-help">${t('Informações salvas na sua conta; a identidade e a representação da entidade ainda não foram verificadas.', 'Information is saved to your account; entity identity and representation have not been verified.')}</p><div class="section-save"><button>${t('Adicionar entidade', 'Add entity')}</button><p class="save-status" role="status"></p></div></form>`,
      ) +
      section(
        'privacy',
        '06',
        t('Privacidade', 'Privacy'),
        t(
          'Escolha como seus dados poderão ser usados.',
          'Choose how your information may be used.',
        ),
        `<form data-settings="privacy">${check('public', t('Tornar meu perfil público', 'Make my profile public'), privacy.public, t('Preferência para futura exibição do perfil. O MVP não publica os seus dados.', 'Preference for future profile visibility. The MVP does not publish your information.'))}${check('demographics', t('Participar de pesquisas demográficas', 'Participate in demographic research'), privacy.demographics, t('Participação opcional. Nenhum dado demográfico adicional é coletado.', 'Participation is optional. No additional demographic data is collected.'))}${save()}</form>`,
      ) +
      section(
        'security',
        '07',
        t('E-mail e segurança', 'Email & security'),
        t(
          'Preferências de contato e prévia das opções de segurança.',
          'Contact preferences and a preview of security options.',
        ),
        `<form data-settings="email">${input('email', t('E-mail de contato', 'Contact email'), p.email, 'email', 'required autocomplete="email"')}<p class="field-help">${t('A alteração do e-mail da conta exige confirmação por e-mail.', 'Changing your account email requires email confirmation.')}</p>${save()}</form><hr><h3>${t('Alterar senha', 'Change password')}</h3><form data-settings="password"><div class="form-grid">${input('newPassword', t('Nova senha', 'New password'), '', 'password', 'required minlength="8" autocomplete="new-password"')}${input('confirmPassword', t('Confirmação da nova senha', 'Confirm new password'), '', 'password', 'required minlength="8" autocomplete="new-password"')}</div><p class="field-help">${t('Sua senha é atualizada pelo serviço de autenticação.', 'Your password is updated by the authentication service.')}</p><div class="section-save"><button class="secondary">${t('Alterar senha', 'Change password')}</button><p class="save-status" role="status"></p></div></form><hr><div class="two-factor"><div><h3>${t('Autenticação em duas etapas', 'Two-factor authentication')}</h3><p class="muted">${t('Um código adicional de um aplicativo autenticador protegerá ações da conta.', 'An additional code from an authenticator app will protect account actions.')}</p></div><span class="badge">${t('Não configurada · integração futura', 'Not configured · future integration')}</span></div>`,
      ) +
      `</div></div>`
    );
  }
  function init(p) {
    const get = (id) =>
        window.RafttNumbers.isMoney(document.getElementById(id)) &&
        document.getElementById(id).value.trim() !== ''
          ? String(window.RafttNumbers.value(document.getElementById(id)))
          : document.getElementById(id).value.trim(),
      bool = (id) => document.getElementById(id).checked;
    const persist = () => localStorage.setItem('raftt-profile', JSON.stringify(p));
    function lists() {
      for (const [type, key] of [
        ['entities', 'entities'],
        ['methods', 'paymentMethods'],
      ])
        document.getElementById(type + '-list').innerHTML =
          (p[key] || [])
            .map(
              (item) =>
                `<div class="saved-reference"><div><strong>${esc(item.name)}</strong><small>${esc(item.country || item.type)} · ${t('demonstração', 'demo')}</small></div><button type="button" class="secondary" data-remove="${key}" data-id="${item.id}" aria-label="${t('Remover', 'Remove')} ${esc(item.name)}">${t('Remover', 'Remove')}</button></div>`,
            )
            .join('') ||
          `<p class="empty-reference">${t('Nenhum registro adicionado.', 'No entries added yet.')}</p>`;
    }
    lists();
    window.RafttPasswordRules.bind(
      document.getElementById('newPassword'),
      document.getElementById('confirmPassword'),
    );
    document.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-remove]');
      if (!b) return;
      p[b.dataset.remove] = p[b.dataset.remove].filter((i) => i.id !== b.dataset.id);
      try {
        await window.RafttBackend.saveProfile(p);
        persist();
        lists();
      } catch {
        alert(t('Não foi possível salvar a remoção.', 'Could not save the removal.'));
      }
    });
    document.querySelectorAll('[data-settings]').forEach(
      (form) =>
        (form.onsubmit = async (e) => {
          e.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('button');
          button.disabled = true;
          try {
            let message = t('Alterações salvas na sua conta.', 'Changes saved to your account.');
            switch (form.dataset.settings) {
              case 'identity':
                Object.assign(p, {
                  name: get('name'),
                  headline: get('headline'),
                  phone: get('phone'),
                  bio: get('bio'),
                  activeWorkspace: get('role'),
                  role: get('role'),
                  roles: ['investor', 'organization'],
                });
                break;
              case 'address':
                p.address = Object.fromEntries(
                  ['street', 'suite', 'country', 'city', 'state', 'postal'].map((k) => [k, get(k)]),
                );
                break;
              case 'investor':
                p.investor = {
                  employment: get('employment'),
                  currency: get('currency'),
                  income: get('income'),
                  netWorth: get('netWorth'),
                  accredited: bool('accredited'),
                  spouse: bool('spouse'),
                  previous: bool('previous'),
                };
                break;
              case 'privacy':
                p.privacy = { public: bool('public'), demographics: bool('demographics') };
                break;
              case 'email':
                window.RafttBackend.fail(
                  await window.RafttBackend.db.auth.updateUser(
                    { email: get('email') },
                    { emailRedirectTo: location.origin + '/auth-callback' },
                  ),
                );
                message = t(
                  'Confira os e-mails de confirmação para concluir a alteração.',
                  'Check the confirmation emails to complete the change.',
                );
                break;
              case 'method':
                p.paymentMethods = p.paymentMethods || [];
                p.paymentMethods.push({
                  id: crypto.randomUUID(),
                  name: get('methodLabel'),
                  type: get('methodType'),
                });
                form.reset();
                lists();
                break;
              case 'entity':
                p.entities = p.entities || [];
                p.entities.push({
                  id: crypto.randomUUID(),
                  name: get('entityName'),
                  type: get('entityType'),
                  country: get('entityCountry'),
                  registration: get('entityRegistration'),
                });
                form.reset();
                lists();
                break;
              case 'password':
                const passwordError = window.RafttPasswordRules.error(
                  document.getElementById('newPassword').value,
                  document.getElementById('confirmPassword').value,
                );
                if (passwordError) throw Error(passwordError);
                window.RafttBackend.fail(
                  await window.RafttBackend.db.auth.updateUser({
                    password: document.getElementById('newPassword').value,
                  }),
                );
                message = t('Senha alterada.', 'Password changed.');
                form.reset();
                break;
            }
            if (!['password', 'email'].includes(form.dataset.settings)) {
              await window.RafttBackend.saveProfile(p);
              persist();
            }
            form.querySelector('.save-status').textContent = message;
            if (form.dataset.settings === 'identity') {
              setTimeout(() => window.dispatchEvent(new Event('raftt:avatar-change')), 0);
              document
                .querySelectorAll('.account-link strong')
                .forEach((el) => (el.textContent = p.name));
              document
                .querySelectorAll('.avatar,.profile-monogram')
                .forEach((el) => (el.textContent = p.name.charAt(0).toUpperCase()));
            }
          } catch (error) {
            form.querySelector('.save-status').textContent =
              t('Não foi possível salvar. ', 'Could not save. ') + error.message;
          } finally {
            button.disabled = false;
          }
        }),
    );
    const anchors = [...document.querySelectorAll('.settings-nav a')],
      panels = [...document.querySelectorAll('.settings-section')],
      nav = document.querySelector('.settings-nav');
    nav.setAttribute('role', 'tablist');
    nav.setAttribute(
      'aria-orientation',
      matchMedia('(max-width:1000px)').matches ? 'horizontal' : 'vertical',
    );
    anchors.forEach((a) => {
      a.id = 'tab-' + a.hash.slice(1);
      a.setAttribute('role', 'tab');
      a.setAttribute('aria-controls', a.hash.slice(1));
    });
    panels.forEach((panel) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'tab-' + panel.id);
    });
    function selectSection(hash, focus = false) {
      const id = panels.some((p) => p.id === hash.slice(1)) ? hash.slice(1) : 'identity';
      panels.forEach((panel) => (panel.hidden = panel.id !== id));
      anchors.forEach((a) => {
        const active = a.hash === '#' + id;
        a.classList.toggle('active', active);
        a.setAttribute('aria-selected', String(active));
        a.tabIndex = active ? 0 : -1;
        if (active && focus) a.focus();
      });
    }
    anchors.forEach((a, index) => {
      a.onclick = (e) => {
        e.preventDefault();
        history.pushState({ profileSection: a.hash }, '', location.pathname + location.search);
        selectSection(a.hash);
      };
      a.onkeydown = (e) => {
        const step = ['ArrowDown', 'ArrowRight'].includes(e.key)
          ? 1
          : ['ArrowUp', 'ArrowLeft'].includes(e.key)
            ? -1
            : 0;
        let next = step
          ? (index + step + anchors.length) % anchors.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? anchors.length - 1
              : null;
        if (next !== null) {
          e.preventDefault();
          history.replaceState(
            { profileSection: anchors[next].hash },
            '',
            location.pathname + location.search,
          );
          selectSection(anchors[next].hash, true);
        }
      };
    });
    addEventListener('hashchange', () => selectSection(location.hash));
    addEventListener('popstate', () => selectSection(history.state?.profileSection || '#identity'));
    selectSection(location.hash || history.state?.profileSection || '#identity');
    history.replaceState(
      { profileSection: location.hash || history.state?.profileSection || '#identity' },
      '',
      location.pathname + location.search,
    );
  }

  function entitySelect(p) {
    return `<label for="investment-entity">${t('Investir como', 'Invest as')}</label><select id="investment-entity"><option value="personal">${t('Pessoa física', 'Individual')} · ${esc(p.name)}</option>${(p.entities || []).map((e) => `<option value="${e.id}">${esc(e.name)} · ${t('entidade de teste', 'test entity')}</option>`).join('')}</select><small>${t('Gerencie entidades no seu perfil.', 'Manage entities in your profile.')}</small>`;
  }
  const categories = [
    [
      'startups',
      'Startups',
      'Startups',
      'Participação societária e conversíveis',
      'Equity and convertible instruments',
    ],
    [
      'pmes',
      'Pequenas e médias empresas',
      'Small & medium businesses',
      'Expansão, capital de giro e equipamentos',
      'Expansion, working capital and equipment',
    ],
    [
      'recebiveis',
      'Recebíveis',
      'Receivables',
      'Financiamento de fluxos futuros',
      'Financing future cash flows',
    ],
    [
      'imoveis',
      'Imóveis',
      'Real estate',
      'Empreendimentos e propriedades geradoras de renda',
      'Developments and income-producing properties',
    ],
    [
      'energia',
      'Energia',
      'Energy',
      'Geração e projetos energéticos',
      'Generation and energy projects',
    ],
    [
      'agro',
      'Agronegócio',
      'Agribusiness',
      'Produção, equipamentos e expansão',
      'Production, equipment and expansion',
    ],
    [
      'infra',
      'Infraestrutura',
      'Infrastructure',
      'Logística, data centers e telecomunicações',
      'Logistics, data centers and telecommunications',
    ],
    [
      'royalties',
      'Royalties e propriedade intelectual',
      'Royalties & intellectual property',
      'Música, audiovisual, games e direitos econômicos',
      'Music, audiovisual, games and economic rights',
    ],
  ];
  function market() {
    window.RafttCatalog.mount(categories);
  }
  window.RafttSettings = {
    render,
    init,
    market,
    entitySelect,
    selectedEntity: (p) => {
      const id = document.getElementById('investment-entity').value;
      return id === 'personal'
        ? { id: 'personal', name: p.name }
        : (p.entities || []).find((e) => e.id === id) || { id: 'personal', name: p.name };
    },
  };
})();
