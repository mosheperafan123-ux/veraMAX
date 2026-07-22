/* ============================================================
   CATALOG — editorial index + ticker, from public/data/catalog.json
   ============================================================ */

const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

function catRow(cat, i) {
  const sample = cat.top.slice(0, 3).map((g) => esc(g.name)).join(' · ');
  return `
    <div class="cat-item reveal">
      <div class="ci-idx">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <div class="ci-name">${esc(cat.name)}</div>
        <div class="ci-games">${sample} <span>y más…</span></div>
      </div>
      <div class="ci-meta">
        <div class="ci-count">${cat.count.toLocaleString('es-CO')}</div>
        <div class="ci-val">juegos</div>
      </div>
    </div>`;
}

function totalRow(arr) {
  const sum = arr.reduce((n, c) => n + c.count, 0);
  return `
    <div class="cat-item cat-total">
      <div class="ci-idx"></div>
      <div><div class="ci-name">Total</div></div>
      <div class="ci-meta">
        <div class="ci-count">${sum.toLocaleString('es-CO')}</div>
        <div class="ci-val">juegos</div>
      </div>
    </div>`;
}

function tickItem(g) {
  return `<span class="tick-item">${esc(g.name)} <span class="star">★ ${(g.rating / 1000).toFixed(1)}</span><span class="sep">/</span></span>`;
}

export async function initCatalog() {
  const list = document.getElementById('cat-list');
  const chips = document.getElementById('cat-filter');
  const ticker = document.getElementById('ticker-track');
  if (!list) return;

  let data;
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/catalog.json');
    data = await res.json();
  } catch {
    list.innerHTML = '<p class="muted">No se pudo cargar el catálogo.</p>';
    return;
  }

  const cats = data.categories;

  // — Hero side index: top 6 categories as an editorial table of contents —
  const heroIdx = document.getElementById('hero-index-rows');
  if (heroIdx) {
    heroIdx.innerHTML = cats
      .slice(0, 6)
      .map(
        (c, i) => `
        <div class="hi-row">
          <span class="idx">${String(i + 1).padStart(2, '0')}</span>
          <span class="nm">${esc(c.name)}</span>
          <span class="ct">${c.count.toLocaleString('es-CO')}</span>
        </div>`
      )
      .join('');
  }

  if (ticker && data.top_games) {
    const items = data.top_games.map(tickItem).join('');
    ticker.innerHTML = items + items;
  }

  const render = (filter) => {
    const arr = filter === 'all' ? cats : cats.filter((c) => c.name === filter);
    list.innerHTML = arr.map(catRow).join('') + (filter === 'all' ? totalRow(arr) : '');
    list.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  };

  if (chips) {
    const all = [{ name: 'all', label: 'Todo el catálogo' }, ...cats.map((c) => ({ name: c.name, label: c.name }))];
    chips.innerHTML = all
      .map((c, i) => `<button class="cf-chip${i === 0 ? ' on' : ''}" data-cat="${esc(c.name)}">${esc(c.label)}</button>`)
      .join('');
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('.cf-chip');
      if (!b) return;
      chips.querySelectorAll('.cf-chip').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      render(b.dataset.cat);
    });
  }

  render('all');
}
