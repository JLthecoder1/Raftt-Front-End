(() => {
  const form = document.querySelector('#raise-application');
  const status = document.querySelector('#raise-status');
  const deckUrlField = document.querySelector('#deck-url-field');
  const deckUploadField = document.querySelector('#deck-upload-field');
  const deckUrl = document.querySelector('#deck-url');
  const deckFile = document.querySelector('#deck-file');
  const deckFileName = document.querySelector('#deck-file-name');
  let savedDecks = [];
  const savedDeckNotice = document.createElement('p');
  savedDeckNotice.className = 'raise-privacy';
  savedDeckNotice.setAttribute('data-i18n-skip', '');
  deckUploadField.append(savedDeckNotice);
  const revenueDetailsField = document.querySelector('#revenue-details-field');
  const revenueDetails = document.querySelector('#revenue-details');
  const steps = [...document.querySelectorAll('[data-raise-step]')];
  const stepCount = document.querySelector('#raise-step-count');
  const stepTitle = document.querySelector('#raise-step-title');
  const previousStep = document.querySelector('#raise-step-back');
  const nextStep = document.querySelector('#raise-step-next');
  const finalSubmit = document.querySelector('#raise-submit-final');
  let activeStep = 0,
    dirty = false,
    submitting = false,
    restoring = false;
  const t = (pt, en) => window.RafttBackend.t(pt, en);
  stepCount.setAttribute('data-i18n-skip', '');
  stepTitle.setAttribute('data-i18n-skip', '');

  const syncEquity = () => {
    const equity = form.querySelector('[name="structure"]:checked')?.value === 'equity';
    document.getElementById('equity-percentage-field').hidden = !equity;
    const percentage = document.getElementById('equity-percentage');
    percentage.required = equity;
    percentage.disabled = !equity || activeStep !== 1;
  };
  form
    .querySelectorAll('[name="structure"]')
    .forEach((control) => control.addEventListener('change', syncEquity));
  const updateStep = () => {
    steps.forEach((step, index) => {
      const inactive = index !== activeStep;
      step.hidden = inactive;
      step.querySelectorAll('input, select, textarea, button').forEach((control) => {
        control.disabled = inactive;
      });
    });
    stepCount.textContent = t(
      `Etapa ${activeStep + 1} de ${steps.length}`,
      `Step ${activeStep + 1} of ${steps.length}`,
    );
    stepTitle.textContent =
      activeStep === 0
        ? t('Você e sua empresa', 'You and your company')
        : t('Detalhes da rodada', 'Round details');
    previousStep.hidden = activeStep === 0;
    nextStep.hidden = activeStep === steps.length - 1;
    finalSubmit.hidden = activeStep !== steps.length - 1;
    syncEquity();
  };

  const validateActiveStep = () => {
    const controls = [...steps[activeStep].querySelectorAll('input, select, textarea')];
    const invalid = controls.find((control) => !control.disabled && !control.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      invalid.focus();
      return false;
    }
    return true;
  };

  nextStep.addEventListener('click', () => {
    if (!validateActiveStep()) return;
    activeStep = Math.min(activeStep + 1, steps.length - 1);
    updateStep();
    document.querySelector('#additional-heading').focus?.();
  });

  previousStep.addEventListener('click', () => {
    activeStep = Math.max(activeStep - 1, 0);
    updateStep();
    document.querySelector('#personal-heading').focus();
  });

  document.querySelectorAll('input[name="deckMethod"]').forEach((option) => {
    option.addEventListener('change', () => {
      const useFile = option.value === 'file' && option.checked;
      deckUrlField.hidden = useFile;
      deckUploadField.hidden = !useFile;
      deckUrl.required = !useFile;
      deckFile.required = useFile && savedDecks.length === 0;
    });
  });

  document.querySelectorAll('input[name="revenue"]').forEach((option) => {
    option.addEventListener('change', () => {
      const hasRevenue = option.value === 'yes' && option.checked;
      revenueDetailsField.hidden = !hasRevenue;
      revenueDetails.required = hasRevenue;
    });
  });

  deckFile.addEventListener('change', () => {
    deckFileName.textContent = deckFile.files.length
      ? deckFile.files[0].name
      : t('PDF, PPT ou PPTX · até 20 MB', 'PDF, PPT or PPTX · up to 20 MB');
    savedDeckNotice.textContent = deckFile.files.length
      ? t(
          'O novo arquivo substituirá o deck nesta versão. O anterior permanece no histórico.',
          'The new file replaces the deck in this version. The previous file remains in history.',
        )
      : savedDecks.length
        ? t('Deck já salvo: ', 'Saved deck: ') +
          savedDecks.map((d) => d.name).join(', ') +
          t('. Você pode continuar sem reenviar.', '. You can continue without uploading again.')
        : '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!validateActiveStep()) return;
    if (activeStep !== steps.length - 1) {
      activeStep += 1;
      updateStep();
      document.querySelector('#additional-heading').focus();
      return;
    }
    status.hidden = false;
    const application = {};
    form.querySelectorAll('[name]').forEach((control) => {
      if (
        control.type === 'file' ||
        (['radio', 'checkbox'].includes(control.type) && !control.checked)
      )
        return;
      if (
        control.name === 'equityPercentage' &&
        form.querySelector('[name=structure]:checked')?.value !== 'equity'
      )
        return;
      application[control.name] =
        window.RafttNumbers.isMoney(control) && control.value.trim() !== ''
          ? String(window.RafttNumbers.value(control))
          : control.value;
    });
    const existing = JSON.parse(localStorage.getItem('raftt-company') || '{}');
    if (application.deckMethod === 'file') delete application.deckUrl;
    application.documentIds =
      application.deckMethod === 'file' && !deckFile.files.length
        ? savedDecks.map((d) => d.id)
        : [];
    application.fundraisingId = existing.fundraisingId || crypto.randomUUID();
    application.confirmedFunding = existing.confirmedFunding || 0;
    application.status = 'submitted';
    application.companyId = existing.companyId;
    submitting = true;
    finalSubmit.disabled = true;
    try {
      const files =
        form.querySelector('[name=deckMethod]:checked')?.value === 'file'
          ? [...deckFile.files]
          : [];
      const mime = {
        pdf: 'application/pdf',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };
      const prepared = files.map((file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (
          !mime[ext] ||
          (file.type && file.type !== mime[ext]) ||
          file.size === 0 ||
          file.size > 20 * 1024 * 1024
        )
          throw Error(
            t('Envie PDF, PPT ou PPTX com até 20 MB.', 'Upload a PDF, PPT or PPTX up to 20 MB.'),
          );
        return file.type ? file : new File([file], file.name, { type: mime[ext] });
      });
      application.companyId = await window.RafttBackend.saveApplication(application, prepared);
      localStorage.setItem('raftt-company', JSON.stringify(application));
      status.textContent = window.RafttBackend.t(
        'Proposta enviada e salva na sua conta.',
        'Application submitted and saved to your account.',
      );
      await window.RafttCloudDrafts?.remove('company-application').catch(() => {});
      document.querySelector('#raise-demo-next').hidden = false;
      location.assign('/milestone-releases?setup=application');
    } catch (error) {
      status.textContent =
        window.RafttBackend.t('Não foi possível enviar. ', 'Could not submit. ') + error.message;
    } finally {
      submitting = false;
      finalSubmit.disabled = false;
    }
  });

  function values() {
    return Object.fromEntries(
      [...form.querySelectorAll('[name]')]
        .filter((c) => c.type !== 'file' && (!['radio', 'checkbox'].includes(c.type) || c.checked))
        .map((c) => [c.name, c.value]),
    );
  }
  form.addEventListener('input', () => {
    if (!window.RafttAccountReady || submitting) return;
    dirty = true;
    window.RafttCloudDrafts?.schedule('company-application', values());
  });
  form.addEventListener('change', () => {
    if (window.RafttAccountReady && !submitting && !restoring) {
      dirty = true;
      window.RafttCloudDrafts?.schedule('company-application', values());
    }
  });
  const notice = document.createElement('p');
  notice.setAttribute('role', 'status');
  notice.setAttribute('data-i18n-skip', '');
  notice.className = 'raise-privacy';
  form.append(notice);
  window.addEventListener('raftt:draft-status', (e) => {
    if (e.detail.name !== 'company-application') return;
    notice.textContent = {
      saving: t('Salvando rascunho…', 'Saving draft…'),
      saved: t(
        'Rascunho salvo na sua conta. Os arquivos serão enviados ao concluir.',
        'Draft saved to your account. Files are uploaded on submission.',
      ),
      local: t(
        'Não foi possível salvar o rascunho no banco. Confira a conexão e execute a migração 004.',
        'Could not save the draft to the database. Check the connection and apply migration 004.',
      ),
    }[e.detail.status];
  });
  async function restore() {
    const submitted = JSON.parse(localStorage.getItem('raftt-company') || '{}');
    let saved = submitted;
    try {
      saved = await window.RafttCloudDrafts.load('company-application', saved);
    } catch {
      notice.textContent = t(
        'Rascunho da conta indisponível. Você pode preencher e enviar a candidatura.',
        'Account draft unavailable. You can still fill out and submit the application.',
      );
    }
    if (dirty || !window.RafttAccountReady) return;
    if (submitted.companyId && submitted.documentIds?.length) {
      try {
        savedDecks = window.RafttBackend.fail(
          await window.RafttBackend.db
            .from('documents')
            .select('id,name')
            .eq('company_id', submitted.companyId)
            .in('id', submitted.documentIds),
        );
      } catch {
        notice.textContent = t(
          'Não foi possível carregar o deck salvo. Confira a conexão antes de reenviar.',
          'Could not load the saved deck. Check your connection before uploading again.',
        );
      }
      if (!window.RafttAccountReady) return;
    }
    restoring = true;
    form.querySelectorAll('[name]').forEach((control) => {
      if (control.type === 'file' || saved[control.name] === undefined) return;
      if (control.type === 'radio') control.checked = control.value === saved[control.name];
      else control.value = saved[control.name];
    });
    form
      .querySelectorAll('input[type=radio]:checked')
      .forEach((control) => control.dispatchEvent(new Event('change')));
    restoring = false;
    deckFile.dispatchEvent(new Event('change'));
    updateStep();
  }
  if (window.RafttAccountReady) restore();
  else window.addEventListener('raftt:account-ready', restore, { once: true });
  updateStep();
})();
