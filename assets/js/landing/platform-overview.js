const nav = document.querySelector('.primary-nav');
const menuBtn = document.querySelector('.menu-toggle');
const header = document.querySelector('.site-header');
const dropdownTriggers = document.querySelectorAll('.nav-dropdown-trigger');
const profileMenu = document.querySelector('.user-profile-menu');
const profileTrigger = document.querySelector('.user-profile-trigger');
const languageToggle = document.querySelector('#language-toggle');
const languageMenu = document.querySelector('#language-menu');
const languageCurrent = document.querySelector('#language-current');
const languageOptions = document.querySelectorAll('[data-language]');
const navHighlight = nav?.querySelector('.nav-highlight');
const navItems = nav?.querySelectorAll('.nav-item.has-dropdown');

const moveNavHighlight = (item) => {
  if (!navHighlight || !nav || !item) return;
  const navBounds = nav.getBoundingClientRect();
  const itemBounds = item.getBoundingClientRect();
  navHighlight.style.left = `${itemBounds.left - navBounds.left}px`;
  navHighlight.style.width = `${itemBounds.width}px`;
  nav.classList.add('has-highlight');
};

navItems?.forEach((item) => {
  item.addEventListener('pointerenter', () => moveNavHighlight(item));
  item.addEventListener('focusin', () => moveNavHighlight(item));
});
nav?.addEventListener('pointerleave', () => {
  if (!nav.querySelector('.nav-item.is-active')) nav.classList.remove('has-highlight');
});

dropdownTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.nav-item');
    const willOpen = !item.classList.contains('is-active');
    document.querySelectorAll('.nav-item.has-dropdown').forEach((navItem) => {
      navItem.classList.remove('is-active');
      navItem.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
    if (willOpen) {
      item.classList.add('is-active');
      trigger.setAttribute('aria-expanded', 'true');
      moveNavHighlight(item);
    } else {
      nav?.classList.remove('has-highlight');
    }
  });
});

profileTrigger?.addEventListener('click', () => {
  const open = profileMenu.classList.toggle('is-active');
  profileTrigger.setAttribute('aria-expanded', String(open));
});

languageToggle?.addEventListener('click', () => {
  const isOpen = languageToggle.getAttribute('aria-expanded') === 'true';
  languageMenu.hidden = isOpen;
  languageToggle.setAttribute('aria-expanded', String(!isOpen));
});
languageOptions.forEach((option) =>
  option.addEventListener('click', () => {
    languageCurrent.textContent = option.dataset.language === 'pt' ? 'PT' : 'EN';
    languageOptions.forEach((item) => item.setAttribute('aria-checked', String(item === option)));
    languageMenu.hidden = true;
    languageToggle.setAttribute('aria-expanded', 'false');
  }),
);

menuBtn?.addEventListener('click', () => {
  const open = nav?.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
document.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('.language-picker')) {
    languageMenu.hidden = true;
    languageToggle?.setAttribute('aria-expanded', 'false');
  }
  if (header && !header.contains(event.target)) {
    nav?.classList.remove('is-open');
    nav?.classList.remove('has-highlight');
    menuBtn?.setAttribute('aria-expanded', 'false');
    document
      .querySelectorAll('.nav-item.has-dropdown')
      .forEach((navItem) => navItem.classList.remove('is-active'));
    dropdownTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    profileMenu?.classList.remove('is-active');
    profileTrigger?.setAttribute('aria-expanded', 'false');
  }
});
