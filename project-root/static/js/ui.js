document.addEventListener('DOMContentLoaded', () => {
  const btn  = document.getElementById('menu-toggle');
  const menu = document.getElementById('menu-panel');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  });
});
