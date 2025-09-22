// main.js — Pulse (classic-ui) conservando IDs/estructura existentes

let PULSE_TEENS = JSON.parse(localStorage.getItem('pulse_teens') || 'false');

const STATE = {
  active: 'espana',
  cats: [
    { k: 'espana',  n: 'España'   },
    { k: 'cataluna', n: 'Cataluña' },
    { k: 'rioja',   n: 'La Rioja' },
    { k: 'global',  n: 'Global'   }
  ],
  data: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initTeens();
  initTheme();
  buildCatChips();
  await loadData();
  render();
  // Meteo: respetamos tu inicialización existente
  if (typeof window.initPulseWeather === 'function') {
    try { window.initPulseWeather(); } catch (_) {}
  }
});

/* ---------------- Teens ---------------- */
function initTeens() {
  const b = document.getElementById('chip-teens');
  if (!b) return;
  b.setAttribute('aria-pressed', String(PULSE_TEENS));
  b.addEventListener('click', () => {
    PULSE_TEENS = !PULSE_TEENS;
    localStorage.setItem('pulse_teens', JSON.stringify(PULSE_TEENS));
    b.setAttribute('aria-pressed', String(PULSE_TEENS));
    render();
  });
}

/* ---------------- Theme ---------------- */
function initTheme() {
  const r = document.documentElement;
  const btn = document.getElementById('chip-mode');
  if (!btn) return;

  const get = () =>
    r.getAttribute('data-theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const apply = (t) => {
    if (t) r.setAttribute('data-theme', t);
    else r.removeAttribute('data-theme');
    const icon = btn.querySelector('.mode-ico');
    if (icon) icon.textContent = (get() === 'dark' ? '🌙' : '☀️');
    btn.setAttribute('aria-pressed', String(get() === 'dark'));
  };

  const saved = localStorage.getItem('pulse_theme');
  apply(saved);

  btn.addEventListener('click', () => {
    const next = (get() === 'dark') ? 'light' : 'dark';
    localStorage.setItem('pulse_theme', next);
    apply(next);
  });

  // Si el usuario tiene "auto" (sin data-theme), reacciona a cambios del SO
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const savedNow = localStorage.getItem('pulse_theme'); // si no hay saved, estamos en "auto"
      if (!savedNow) apply(null);
    });
  } catch (_) {}
}

/* ---------------- Data ---------------- */
async function loadData() {
  try {
    const res = await fetch('data/latest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    STATE.data = normal(raw);
  } catch (e) {
    STATE.data = { espana: [], cataluna: [], rioja: [], global: [], updated_at: new Date().toISOString() };
  }
}

function normal(d) {
  const out = { ...d };
  // Acepta claves con tilde por si llegan del builder
  if (out['cataluña'] && !out['cataluna']) out['cataluna'] = out['cataluña'];
  if (out['españa'] && !out['espana']) out['espana'] = out['españa'];
  ['espana', 'cataluna', 'rioja', 'global'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  return out;
}

/* ---------------- Chips ---------------- */
function buildCatChips() {
  const wrap = document.getElementById('chips');
  if (!wrap) return;
  wrap.innerHTML = '';
  STATE.cats.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = c.n;
    if (c.k === STATE.active) b.setAttribute('aria-pressed', 'true');
    b.addEventListener('click', () => {
      STATE.active = c.k;
      [...wrap.children].forEach(x => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true');
      render();
    });
    wrap.appendChild(b);
  });
}

/* ---------------- Render ---------------- */
function render() {
  const root = document.getElementById('content');
  if (!root) return;
  root.innerHTML = '';

  const list = (STATE.data?.[STATE.active] || []).slice(0, 6); // hasta 6

  // Título sección (fino y en una línea si CSS lo fuerza)
  const h = document.createElement('h2');
  h.className = 'section-title';
  h.textContent = STATE.cats.find(x => x.k === STATE.active)?.n || 'Noticias';
  root.appendChild(h);

  const grid = document.createElement('div');
  grid.className = 'grid';

  if (list.length === 0) {
    const e = document.createElement('div');
    e.className = 'empty';
    e.innerHTML = `Sin noticias (aún). <button id="retry" class="chip" type="button">Reintentar</button>`;
    e.querySelector('#retry')?.addEventListener('click', async () => { await loadData(); render(); });
    grid.appendChild(e);
  } else {
    list.forEach(n => grid.appendChild(card(n)));
  }

  root.appendChild(grid);
}

/* ---------------- Card ---------------- */
function card(n) {
  const tplEl = document.getElementById('card');
  if (!tplEl || !tplEl.content || !tplEl.content.firstElementChild) {
    // Fallback ultra simple si falta la template
    const a = document.createElement('a');
    a.href = n.url || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'card-fallback';
    a.textContent = n.title || '—';
    return a;
  }

  const el = tplEl.content.firstElementChild.cloneNode(true);

  const title = (n.title || '—');
  const impact = (PULSE_TEENS ? n.teen_impact : n.adult_impact) || n.summary || '';
  const src = (n.source || '');
  const when = fmt(n.published_at);
  const href = n.url || '#';

  const tNode = el.querySelector('.t');
  const sNode = el.querySelector('.s');
  const srcNode = el.querySelector('.src');
  const dNode = el.querySelector('.d');
  const lnk = el.querySelector('.lnk');

  if (tNode) tNode.textContent = title;
  if (sNode) sNode.textContent = impact;
  if (srcNode) srcNode.textContent = src;
  if (dNode) dNode.textContent = when;
  if (lnk) lnk.href = href;

  return el;
}

/* ---------------- Utils ---------------- */
function fmt(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (_) { return ''; }
}
