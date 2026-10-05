(() => {
  const form = document.querySelector('#raise-application');
  const status = document.querySelector('#raise-status');
  const deckUrlField = document.querySelector('#deck-url-field');
  const deckUploadField = document.querySelector('#deck-upload-field');
  const deckUrl = document.querySelector('#deck-url');
  const deckFile = document.querySelector('#deck-file');
  const deckFileName = document.querySelector('#deck-file-name');
  const revenueDetailsField = document.querySelector('#revenue-details-field');
  const revenueDetails = document.querySelector('#revenue-details');
  const steps = [...document.querySelectorAll('[data-raise-step]')];
  const stepCount = document.querySelector('#raise-step-count');
  const stepTitle = document.querySelector('#raise-step-title');
  const previousStep = document.querySelector('#raise-step-back');
  const nextStep = document.querySelector('#raise-step-next');
  const finalSubmit = document.querySelector('#raise-submit-final');
  let activeStep = 0;

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
    stepCount.textContent = `Etapa ${activeStep + 1} de ${steps.length}`;
    stepTitle.textContent = activeStep === 0 ? 'Você e sua empresa' : 'Detalhes da rodada';
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
      deckFile.required = useFile;
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
      : 'PDF, PPT, PPTX, or Keynote';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
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
    application.fundraisingId = existing.fundraisingId || crypto.randomUUID();
    application.confirmedFunding = existing.confirmedFunding || 0;
    application.status = 'submitted';
    localStorage.setItem('raftt-company', JSON.stringify(application));
    status.textContent =
      'Proposta salva neste navegador. Abra o painel da empresa para acompanhar a demonstração.';
    document.querySelector('#raise-demo-next').hidden = false;
  });

  try {
    const saved = JSON.parse(localStorage.getItem('raftt-company') || '{}');
    form.querySelectorAll('[name]').forEach((control) => {
      if (control.type === 'file' || saved[control.name] === undefined) return;
      if (control.type === 'radio') control.checked = control.value === saved[control.name];
      else control.value = saved[control.name];
    });
  } catch {}
  form
    .querySelectorAll('input[type=radio]:checked')
    .forEach((control) => control.dispatchEvent(new Event('change')));
  updateStep();
})();
