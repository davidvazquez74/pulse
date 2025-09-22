// site/js/main.js — render de noticias robusto
(async function () {
  const newsEl = document.getElementById('news');
  const chips = document.querySelectorAll('.chip[data-cat]');

  function empty(msg = 'Sin noticias por ahora.') {
    newsEl.innerHTML = `<div class="empty">${msg}</div>`;
  }

  function card(n) {
    const a = document.createElement('article');
    a.className = 'card';
    a.innerHTML = `
      <h3><a href="${n.url}" target="_blank" rel="noopener">${n.title || '(sin título)'}</a></h3>
      <p>${n.summary || ''}</p>
      <div class="meta">${n.published_at ? new Date(n.published_at).toLocaleString('es-ES') : ''}${n.source ? ' · ' + n.source : ''}</div>
    `;
    return a;
  }

  async function loadData() {
    try {
      const res = await fetch('data/latest.json', { cache: 'no-store' });
      const json = await res.json();
      // estructura mínima esperada
      return { espana: [], cataluna: [], rioja: [], global: [], ...(json || {}) };
    } catch (e) {
      console.warn('No se pudo cargar latest.json', e);
      return { espana: [], cataluna: [], rioja: [], global: [] };
    }
  }

  function render(cat, data) {
    const list = (data[cat] || []).slice(0, 3);
    newsEl.innerHTML = '';
    if (!list.length) return empty();
    list.forEach(n => newsEl.appendChild(card(n)));
  }

  const data = await loadData();
  let current = 'espana';
  render(current, data);

  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('chip--active'));
    c.classList.add('chip--active');
    current = c.dataset.cat;
    render(current, data);
  }));

  document.getElementById('refreshBtn')?.addEventListener('click', () => location.reload());
})();
