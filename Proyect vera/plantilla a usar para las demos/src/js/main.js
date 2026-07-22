/* ============================================================
   ENTRY POINT
   (El CSS se carga vía <link> en el HTML, no aquí, para que los
    estilos nunca dependan de que el JS se ejecute sin errores.)
   ============================================================ */
import { initReveal } from './reveal.js';
import { initNav } from './nav.js';
import { initCounters } from './counter.js';
import { initCatalog } from './catalog.js';
import { valueStack, valueEquation } from '../data/offer.js';

function renderLedger() {
  const box = document.getElementById('ledger');
  if (!box) return;
  box.innerHTML = valueStack
    .map(
      (r) => `
      <div class="ledger-row">
        <span class="mk">&#10097;</span>
        <span class="desc"><span class="t">${r.label}</span>${r.note ? `<br><span class="s">${r.note}</span>` : ''}</span>
        <span class="amt">${r.value}</span>
      </div>`
    )
    .join('');
}

function renderEquation() {
  const box = document.getElementById('eq-grid');
  if (!box) return;
  box.innerHTML = valueEquation
    .map(
      (e) => `
      <div class="eq ${e.dir} reveal">
        <div class="ar">${e.dir === 'up' ? '&uarr;' : '&darr;'}</div>
        <h3>${e.title}</h3>
        <p>${e.desc}</p>
      </div>`
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderLedger();
  renderEquation();
  initNav();
  initCatalog().finally(() => initReveal());
  initReveal();
  initCounters();
});
