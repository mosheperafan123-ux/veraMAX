/* Editorial nav: hamburger morph + full-paper mobile menu. */
export function initNav() {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mmenu');
  if (!burger || !menu) return;

  const set = (open) => {
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () =>
    set(!document.body.classList.contains('nav-open'))
  );
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
}
