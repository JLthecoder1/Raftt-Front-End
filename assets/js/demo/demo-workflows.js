(() => {
  'use strict';

  const setResult = (element, message) => {
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
  };

  const addAudit = (list, message) => {
    if (!list) return;
    const item = document.createElement('li');
    const text = document.createElement('span');
    const tag = document.createElement('span');
    text.textContent = message;
    tag.className = 'workflow-pill';
    tag.textContent = 'Demo';
    item.append(text, tag);
    list.prepend(item);
  };

  const resetForm = document.querySelector('#reset-form');
  resetForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    setResult(
      document.querySelector('#reset-status'),
      'No email was sent. Password recovery is not connected to a service yet.',
    );
  });

  const organization = document.querySelector('[data-org-workspace]');
  if (organization && new URLSearchParams(window.location.search).get('stage') === 'submitted') {
    const status = document.querySelector('#proposal-status');
    status.textContent = 'Under review · demo';
    status.classList.add('workflow-pill--pending');
    setResult(
      document.querySelector('#proposal-result'),
      'Submission simulated. The proposal was not transmitted, saved, or sent to a real team.',
    );
  }

  const proposalResult = document.querySelector('#proposal-result');
  document.querySelectorAll('[data-proposal-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const requested = button.dataset.proposalAction === 'changes';
      const status = document.querySelector('#proposal-status');
      status.textContent = requested ? 'Changes requested · demo' : 'Under review · demo';
      setResult(
        proposalResult,
        requested
          ? 'Demo: the team requested an updated budget and ownership structure. No message was sent.'
          : 'Demo: the proposal was marked as under review. This is not a real submission or approval.',
      );
    });
  });

  const reviewResult = document.querySelector('#review-result');
  const publicationButton = document.querySelector('[data-review-action="publication-approved"]');
  const informationStatus = document.querySelector('[data-review-status="information"]');
  const publicationStatus = document.querySelector('[data-review-status="publication"]');
  const milestoneStatus = document.querySelector('[data-review-status="milestone"]');
  const audit = document.querySelector('#review-audit');
  let informationApproved = false;

  document.querySelectorAll('[data-review-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.reviewAction;
      if (
        action === 'publication-approved' &&
        (!informationApproved || publicationButton?.disabled)
      )
        return;
      if (action === 'information-approved') {
        informationApproved = true;
        informationStatus.textContent = 'Information approved · demo';
        informationStatus.classList.remove('workflow-pill--pending', 'workflow-pill--danger');
        publicationStatus.textContent = 'Awaiting round approval';
        publicationStatus.classList.remove('workflow-pill--success');
        publicationStatus.classList.add('workflow-pill--pending');
        publicationButton.disabled = false;
        publicationButton.setAttribute('aria-disabled', 'false');
        setResult(
          reviewResult,
          'The information decision is recorded on this screen only. Publication still requires a separate decision.',
        );
      } else if (action === 'changes-requested') {
        informationApproved = false;
        informationStatus.textContent = 'Changes requested · demo';
        informationStatus.classList.remove('workflow-pill--danger', 'workflow-pill--success');
        informationStatus.classList.add('workflow-pill--pending');
        publicationStatus.textContent = 'Blocked until changes are addressed';
        publicationStatus.classList.remove('workflow-pill--success');
        publicationStatus.classList.add('workflow-pill--pending');
        publicationButton.disabled = true;
        publicationButton.setAttribute('aria-disabled', 'true');
        setResult(
          reviewResult,
          'Demo request: submit an updated version of the materials and address the listed open items.',
        );
      } else if (action === 'rejected') {
        informationApproved = false;
        informationStatus.textContent = 'Rejected · demo';
        informationStatus.classList.remove('workflow-pill--pending', 'workflow-pill--success');
        informationStatus.classList.add('workflow-pill--danger');
        publicationStatus.textContent = 'Blocked';
        publicationStatus.classList.remove('workflow-pill--success');
        publicationStatus.classList.add('workflow-pill--pending');
        publicationButton.disabled = true;
        publicationButton.setAttribute('aria-disabled', 'true');
        setResult(reviewResult, 'Sample proposal marked as rejected. No real decision was made.');
      } else if (action === 'publication-approved') {
        publicationStatus.textContent = 'Publication approved · demo';
        publicationStatus.classList.remove('workflow-pill--pending', 'workflow-pill--danger');
        publicationStatus.classList.add('workflow-pill--success');
        publicationButton.disabled = true;
        publicationButton.setAttribute('aria-disabled', 'true');
        setResult(reviewResult, 'Demo publication approval recorded. No offering was published.');
      }
      addAudit(audit, `Simulated action: ${button.textContent.trim()}`);
    });
  });

  document.querySelectorAll('[data-milestone-review]').forEach((button) => {
    button.addEventListener('click', () => {
      const state = button.dataset.milestoneReview;
      const messages = {
        approved: [
          'Evidence approved · demo',
          'Milestone evidence marked as approved in this demo only.',
        ],
        'more-info': [
          'More information requested · demo',
          'Demo request for more information recorded on this screen.',
        ],
        rejected: ['Evidence rejected · demo', 'Evidence marked as rejected in this demo only.'],
      };
      milestoneStatus.textContent = messages[state][0];
      milestoneStatus.classList.toggle('workflow-pill--danger', state === 'rejected');
      milestoneStatus.classList.toggle('workflow-pill--success', state === 'approved');
      milestoneStatus.classList.toggle('workflow-pill--pending', state === 'more-info');
      setResult(reviewResult, messages[state][1]);
      addAudit(audit, `Simulated milestone review: ${button.textContent.trim()}`);
    });
  });

  const investmentDemo = document.querySelector('[data-investment-demo]');
  if (investmentDemo) {
    const amountInput = document.querySelector('#demo-amount');
    const kyc = document.querySelector('#demo-kyc');
    const terms = document.querySelector('#demo-terms');
    const confirm = document.querySelector('#demo-confirm');
    const result = document.querySelector('#investment-result');
    const outcomes = document.querySelector('#payment-outcomes');
    const cents = (value) => Math.round(value * 100);
    const money = (valueInCents) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
        valueInCents / 100,
      );
    const feeFor = (dollars) => {
      const amount = cents(dollars);
      const fee =
        Math.min(amount, 100000) * 0.025 +
        Math.min(Math.max(amount - 100000, 0), 400000) * 0.02 +
        Math.max(amount - 500000, 0) * 0.015;
      return Math.min(25000, Math.round(fee));
    };
    let paymentStarted = false;
    const refresh = () => {
      const amount = Number(amountInput.value);
      const validAmount =
        amountInput.value !== '' && amountInput.checkValidity() && Number.isFinite(amount);
      const fee = validAmount ? feeFor(amount) : 0;
      document.querySelector('#demo-principal').textContent = validAmount
        ? money(cents(amount))
        : '—';
      document.querySelector('#demo-fee').textContent = validAmount ? money(fee) : '—';
      document.querySelector('#demo-total').textContent = validAmount
        ? money(cents(amount) + fee)
        : '—';
      const canConfirm =
        validAmount && kyc.value === 'verified' && terms.checked && !paymentStarted;
      confirm.disabled = !canConfirm;
      confirm.setAttribute('aria-disabled', String(!canConfirm));
    };
    amountInput.addEventListener('input', refresh);
    kyc.addEventListener('change', refresh);
    terms.addEventListener('change', refresh);
    confirm.addEventListener('click', () => {
      if (confirm.disabled) return;
      paymentStarted = true;
      refresh();
      setResult(result, 'Simulation started: payment pending. No charge or transfer was created.');
      outcomes.classList.remove('workflow-hidden');
    });
    outcomes?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-payment-outcome]');
      if (!button) return;
      const outcome = button.dataset.paymentOutcome;
      if (outcome === 'success') {
        setResult(result, 'Payment confirmed in the demo only. No money was moved.');
        outcomes.querySelectorAll('button').forEach((item) => {
          item.disabled = true;
        });
      } else if (outcome === 'failure') {
        setResult(
          result,
          'Simulated failure. No investment was confirmed or charged. You can retry the simulation.',
        );
        outcomes.querySelectorAll('button').forEach((item) => {
          item.disabled = item.dataset.paymentOutcome !== 'retry';
        });
      } else {
        paymentStarted = false;
        outcomes.classList.add('workflow-hidden');
        outcomes.querySelectorAll('button').forEach((item) => {
          item.disabled = false;
        });
        refresh();
        setResult(result, 'Simulation reset. Confirm again to start a new attempt.');
      }
    });
    refresh();
  }

  const releaseDemo = document.querySelector('[data-release-demo]');
  if (releaseDemo) {
    const file = document.querySelector('#evidence-file');
    const evidenceForm = document.querySelector('#evidence-form');
    const evidenceStatus = document.querySelector('#evidence-status');
    const releaseStatus = document.querySelector('#release-status');
    const evidenceResult = document.querySelector('#evidence-result');
    const releaseResult = document.querySelector('#release-result');
    const execution = document.querySelector('#release-execution');
    const executionButtons = execution.querySelectorAll('button');
    const auditList = document.querySelector('#release-audit');
    let approved = false;
    let evidenceSubmitted = false;
    let executionAttempted = false;
    file.addEventListener('change', () => {
      document.querySelector('#evidence-file-name').textContent = file.files.length
        ? `${file.files[0].name} — stays in this browser and is not uploaded.`
        : 'No file selected; nothing will be uploaded.';
      invalidateEvidence();
    });
    const invalidateEvidence = () => {
      if (!evidenceSubmitted) return;
      evidenceSubmitted = false;
      approved = false;
      executionAttempted = false;
      evidenceStatus.textContent = 'Changed · resubmit for review';
      evidenceStatus.classList.remove('workflow-pill--success', 'workflow-pill--danger');
      evidenceStatus.classList.add('workflow-pill--pending');
      releaseStatus.textContent = 'Awaiting new review';
      releaseStatus.classList.remove('workflow-pill--success', 'workflow-pill--danger');
      releaseStatus.classList.add('workflow-pill--pending');
      execution.classList.add('workflow-hidden');
      setResult(
        evidenceResult,
        'The evidence changed after the last submission. Resubmit it to request a new review.',
      );
    };
    document.querySelector('#evidence-notes').addEventListener('input', invalidateEvidence);
    evidenceForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!evidenceForm.reportValidity()) return;
      evidenceStatus.textContent = 'Under review · demo';
      evidenceStatus.classList.add('workflow-pill--pending');
      evidenceSubmitted = true;
      approved = false;
      executionAttempted = false;
      executionButtons.forEach((item) => {
        item.disabled = true;
      });
      releaseStatus.textContent = 'Awaiting review';
      releaseStatus.classList.remove('workflow-pill--success', 'workflow-pill--danger');
      releaseStatus.classList.add('workflow-pill--pending');
      execution.classList.add('workflow-hidden');
      setResult(
        evidenceResult,
        'Evidence prepared for demo review; the file remains local and was not transmitted.',
      );
      addAudit(auditList, 'Evidence submitted for review (simulation)');
    });
    document.querySelectorAll('[data-release-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.releaseAction;
        if (action === 'approve') {
          if (!evidenceSubmitted) {
            setResult(
              releaseResult,
              'Submit sample evidence first; a tranche cannot be approved without review.',
            );
            return;
          }
          approved = true;
          executionAttempted = false;
          evidenceStatus.textContent = 'Approved · demo';
          evidenceStatus.classList.remove('workflow-pill--pending', 'workflow-pill--danger');
          evidenceStatus.classList.add('workflow-pill--success');
          releaseStatus.textContent = 'Authorized for execution · demo';
          releaseStatus.classList.remove('workflow-pill--pending');
          releaseStatus.classList.add('workflow-pill--success');
          executionButtons.forEach((item) => {
            item.disabled = false;
          });
          execution.classList.remove('workflow-hidden');
          setResult(
            releaseResult,
            'Review approved in demo mode. Authorization did not transfer funds.',
          );
        } else if (action === 'more-info') {
          approved = false;
          evidenceStatus.textContent = 'Complemento solicitado · demo';
          releaseStatus.textContent = 'Blocked until more information is provided';
          execution.classList.add('workflow-hidden');
          setResult(
            releaseResult,
            'The organization must add to the evidence before another simulated review.',
          );
        } else if (action === 'reject') {
          approved = false;
          evidenceStatus.textContent = 'Rejected · demo';
          evidenceStatus.classList.remove('workflow-pill--pending', 'workflow-pill--success');
          evidenceStatus.classList.add('workflow-pill--danger');
          releaseStatus.textContent = 'Not authorized';
          execution.classList.add('workflow-hidden');
          setResult(releaseResult, 'Evidence rejected in the demo flow; no tranche was released.');
        } else if (action === 'execute' && approved && !executionAttempted) {
          executionAttempted = true;
          executionButtons.forEach((item) => {
            item.disabled = true;
          });
          releaseStatus.textContent = 'Execution complete · demo';
          releaseStatus.classList.remove('workflow-pill--pending');
          releaseStatus.classList.add('workflow-pill--success');
          setResult(
            releaseResult,
            'Execution marked complete in the prototype only. No funds were transferred.',
          );
        } else if (action === 'execution-failed' && approved && !executionAttempted) {
          executionAttempted = true;
          executionButtons.forEach((item) => {
            item.disabled = true;
          });
          releaseStatus.textContent = 'Execution failed · demo';
          releaseStatus.classList.remove('workflow-pill--success');
          releaseStatus.classList.add('workflow-pill--danger');
          setResult(
            releaseResult,
            'Simulated failure. The tranche was not transferred; in production, this would require provider reconciliation.',
          );
        }
        addAudit(auditList, `Simulated release action: ${button.textContent.trim()}`);
      });
    });
  }
})();
