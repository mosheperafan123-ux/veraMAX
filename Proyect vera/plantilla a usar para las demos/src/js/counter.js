/* Animated count-up for headline numbers, triggered on view. */
function animate(el) {
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const dur = 1400;
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const val = Math.floor(ease(p) * target);
    el.textContent = prefix + val.toLocaleString('es-CO') + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + target.toLocaleString('es-CO') + suffix;
  }
  requestAnimationFrame(tick);
}

export function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!('IntersectionObserver' in window)) {
    els.forEach(animate);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animate(e.target);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  els.forEach((el) => io.observe(el));
}
