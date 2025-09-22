// site/js/main.js — chips + modo Teens + impactos (render elegante)
(async function () {
  const newsEl = document.getElementById('news');
  const chips  = document.querySelectorAll('.chip[data-cat]');
  const teensBtn = document.getElementById('teensToggle');

  // Estado de modo (persistente)
  let teens = (localStorage.getItem('pulse_mode') || 'adult') === 'teen';
  function applyTeensUI(){ if (teensBtn) teensBtn.setAttribute('aria-pressed', teens ? 'true' : 'false'); }
  applyTeensUI();

  teensBtn?.addEventListener('click', () => {
    teens = !teens;
    localStorage.setItem('pulse_mode', teens ? 'teen' : 'adult');
    applyTeensUI();
    render(current, data);
  });

  function empty(msg = 'Sin noticias (revisa /data/latest.json)') {
    newsEl.innerHTML = `<div class="empty">${msg}</div>`;
  }

  function impactLine(n){
    const txt = teens ? (n.teen_impact || '') : (n.adult_impact || '');
    if (txt) return `<div class="impact ${teens?'teen':'adult'}">${txt}</div>`;
    return n.summary ? `<p>${n.summary}</p>` : '';
  }

  function card(n) {
    const a = document.createElement('article');
    a.className = 'card';
    a.innerHTML = `
      <h3><a href="${n.url}" target="_blank" rel="noopener">${n.title || '(sin título)'}</a></h3>
      ${impactLine(n)}
      <div class="meta">
        ${n.published_at ? new Date(n.published_at).toLocaleString('es-ES') : ''}
        ${n.source ? ' · ' + n.source : ''}
      </div>
    `;
    return a;
  }

  async function loadData() {
    try {
      const res = await fetch('data/latest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      return { espana: [], cataluna: [], rioja: [], global: [], ...(json || {}) };
    } catch (e) {
      console.warn('No se pudo cargar /data/latest.json', e);
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