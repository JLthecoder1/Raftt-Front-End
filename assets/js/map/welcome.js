const sidebar = document.querySelector('.dashboard-sidebar');
const collapseButton = document.querySelector('.sidebar-collapse');
const menuButton = document.querySelector('.dashboard-menu-toggle');

collapseButton?.addEventListener('click', () => {
  const collapsed = sidebar.classList.toggle('is-collapsed');
  collapseButton.setAttribute('aria-expanded', String(!collapsed));
  collapseButton.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
});

menuButton?.addEventListener('click', () => {
  const open = sidebar.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

document.querySelectorAll('.dashboard-nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    sidebar.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});
