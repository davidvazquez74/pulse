
/* ===== Tema (claro/oscuro) ===== */
(function initThemeToggle(){
  const root = document.documentElement;
  const btn = document.getElementById('chip-mode');
  if(!btn) return;
  let theme = localStorage.getItem('pulse_theme');
  applyTheme(theme);
  btn.addEventListener('click', () => {
    const next = (getCurrentTheme() === 'dark') ? 'light' : 'dark';
    localStorage.setItem('pulse_theme', next);
    applyTheme(next);
  });
  function getCurrentTheme(){
    const manual = root.getAttribute('data-theme');
    if (manual) return manual;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(next){
    if (next === 'light' || next === 'dark') root.setAttribute('data-theme', next);
    else root.removeAttribute('data-theme');
    const isDark = getCurrentTheme() === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    const icon = btn.querySelector('.mode-icon'); if(icon) icon.textContent = isDark ? '🌙' : '☀️';
  }
})();

/* ===== Teens toggle ===== */
let PULSE_TEENS = JSON.parse(localStorage.getItem('pulse_teens') || 'false');
(function initTeens(){
  const chip = document.getElementById('chip-teens');
  if(!chip) return;
  chip.setAttribute('aria-pressed', String(PULSE_TEENS));
  chip.addEventListener('click', ()=>{
    PULSE_TEENS = !PULSE_TEENS;
    localStorage.setItem('pulse_teens', JSON.stringify(PULSE_TEENS));
    chip.setAttribute('aria-pressed', String(PULSE_TEENS));
    renderAll();
  });
})();

/* ===== Estado ===== */
const STATE = {
  activeCategory: 'cataluna',
  data: null,
  cats: [
    {key:'cataluna', label:'Cataluña'},
    {key:'espana', label:'España'},
    {key:'rioja', label:'La Rioja'},
    {key:'global', label:'Global'}
  ]
};

/* ===== Arranque ===== */
document.addEventListener('DOMContentLoaded', async () => {
  buildCategoryChips();
  await loadData();
  renderAll();
  if (typeof window.initPulseWeather === 'function') window.initPulseWeather();
});

/* ===== Carga desde site/data/latest.json ===== */
async function loadData(){
  const url = 'data/latest.json';
  try{
    const res = await fetch(url, {cache:'no-store'});
    if (!res.ok) throw new Error('HTTP '+res.status);
    const raw = await res.json();
    STATE.data = normalizeDataKeys(raw);
  }catch(e){
    console.warn('[Pulse] No se pudo cargar', url, e);
    STATE.data = {updated_at:new Date().toISOString(),version:'empty',cataluna:[],espana:[],rioja:[],global:[]};
  }
}

/* ===== Normaliza claves con acentos ===== */
function normalizeDataKeys(d){
  if (!d || typeof d !== 'object') return {cataluna:[],espana:[],rioja:[],global:[]};
  const out = { ...d };
  if (out['cataluña'] && !out['cataluna']) out['cataluna'] = out['cataluña'];
  if (out['españa'] && !out['espana']) out['espana'] = out['españa'];
  ['cataluna','espana','rioja','global'].forEach(k => { if(!Array.isArray(out[k])) out[k] = []; });
  return out;
}

function buildCategoryChips(){
  const wrap = document.getElementById('chips');
  wrap.innerHTML = '';
  STATE.cats.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = c.label;
    b.setAttribute('data-key', c.key);
    if (c.key === STATE.activeCategory) b.setAttribute('aria-pressed','true');
    b.addEventListener('click', ()=>{
      STATE.activeCategory = c.key;
      [...wrap.children].forEach(x=>x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed','true');
      renderAll();
    });
    wrap.appendChild(b);
  });
}

function renderAll(){ renderSections(); }

function renderSections(){
  const root = document.getElementById('content');
  root.innerHTML = '';
  if(!STATE.data) return;

  const catKey = STATE.cats.map(c=>c.key).includes(STATE.activeCategory) ? STATE.activeCategory : 'cataluna';
  const items = (STATE.data[catKey]||[]).slice(0,6);

  const sec = document.createElement('section');
  sec.className = 'section';
  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = STATE.cats.find(x=>x.key===catKey)?.label || catKey;
  sec.appendChild(title);

  const list = document.createElement('div');
  list.className = 'cards';

  if (items.length === 0){
    const empty = document.createElement('div');
    empty.style.color = 'var(--muted)';
    empty.innerHTML = `
      <p style="margin:8px 0">Sin noticias (aún). Puede que el archivo de datos esté generándose.</p>
      <button id="retry" class="chip" type="button" aria-label="Reintentar">Reintentar</button>
    `;
    empty.querySelector('#retry').addEventListener('click', async ()=>{
      await loadData();
      renderAll();
    });
    list.appendChild(empty);
  } else {
    items.forEach(it => list.appendChild(renderCard(it)));
  }
  sec.appendChild(list);
  root.appendChild(sec);
}

function renderCard(it){
  const tpl = document.getElementById('card-tpl');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('.card-title').textContent = it.title || '—';
  node.querySelector('.card-summary').textContent = (PULSE_TEENS ? it.teen_impact : it.adult_impact) || it.summary || '';
  node.querySelector('.card-source').textContent = it.source || '';
  node.querySelector('.card-date').textContent = formatDate(it.published_at);
  node.querySelector('.card-link').href = it.url || '#';
  const tags = node.querySelector('.card-tags');
  node.querySelector('.badge.tag').textContent = it.tag || it.category || 'otros';
  node.querySelector('.badge.sev').textContent = `sev ${it.severity ?? 0}`;
  node.querySelector('.badge.hor').textContent = it.horizon || '—';
  node.querySelector('.badge.act').textContent = it.action || 'FYI';
  tags.hidden = true;
  return node;
}

function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' });
  }catch(e){ return ''; }
}
