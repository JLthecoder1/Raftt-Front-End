function initFooterLogoEffect() {
  const footerLogo = document.querySelector('.footer-logo-effect');
  const footerLogoReveal = footerLogo?.querySelector('#footer-logo-reveal');
  if (!footerLogo || !footerLogoReveal) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animationFrame = 0;
  let revealRadius = 0;
  let targetRadius = 0;

  function animateReveal() {
    const difference = targetRadius - revealRadius;
    if (Math.abs(difference) < 0.1) {
      revealRadius = targetRadius;
      footerLogoReveal.setAttribute('r', `${revealRadius}%`);
      animationFrame = 0;
      return;
    }

    revealRadius += difference * 0.18;
    footerLogoReveal.setAttribute('r', `${revealRadius}%`);
    animationFrame = window.requestAnimationFrame(animateReveal);
  }

  function setReveal(visible) {
    targetRadius = visible ? 38 : 0;
    footerLogo.classList.toggle('is-hovered', visible);

    if (prefersReducedMotion.matches) {
      revealRadius = targetRadius;
      footerLogoReveal.setAttribute('r', `${revealRadius}%`);
      return;
    }

    if (!animationFrame) animationFrame = window.requestAnimationFrame(animateReveal);
  }

  footerLogo.addEventListener('pointerenter', () => {
    setReveal(true);
  });

  footerLogo.addEventListener('pointermove', (event) => {
    const bounds = footerLogo.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    footerLogoReveal.setAttribute('cx', `${x}%`);
    footerLogoReveal.setAttribute('cy', `${y}%`);
  });

  footerLogo.addEventListener('pointerleave', () => {
    setReveal(false);
  });

  footerLogo.addEventListener('focus', () => {
    footerLogoReveal.setAttribute('cx', '50%');
    footerLogoReveal.setAttribute('cy', '50%');
    setReveal(true);
  });

  footerLogo.addEventListener('blur', () => {
    setReveal(false);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooterLogoEffect);
} else {
  initFooterLogoEffect();
}
