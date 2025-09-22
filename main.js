
/* ====== Tema (claro/oscuro) ====== */
(function initThemeToggle(){
  const root = document.documentElement;
  const btn = document.getElementById('chip-mode');
  if(!btn) return;
  let theme = localStorage.getItem('pulse_theme'); // 'light' | 'dark' | null
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

/* ====== Teens toggle ====== */
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

/* ====== Estado ====== */
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

/* ====== Arranque ====== */
document.addEventListener('DOMContentLoaded', async () => {
  buildCategoryChips();
  await loadData();
  renderAll();
  // llama a tu widget real si existe (no hacemos dummy)
  if (typeof window.initPulseWeather === 'function') {
    window.initPulseWeather();
  }
});

async function loadData(){
  try{
    const res = await fetch('data/latest.json', {cache:'no-store'});
    STATE.data = await res.json();
  }catch(e){
    console.error('No se pudo cargar data/latest.json', e);
    STATE.data = {updated_at:new Date().toISOString(),version:'empty',cataluna:[],espana:[],rioja:[],global:[]};
  }
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

function renderAll(){
  renderSections();
}

function renderSections(){
  const root = document.getElementById('content');
  root.innerHTML = '';
  if(!STATE.data) return;
  const catsToShow = STATE.cats.map(c=>c.key).includes(STATE.activeCategory) ?
      [STATE.activeCategory] : ['cataluna'];

  catsToShow.forEach(cat => {
    const items = (STATE.data[cat]||[]).slice(0,6); // 6 noticias por sección
    const sec = document.createElement('section');
    sec.className = 'section';
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = STATE.cats.find(x=>x.key===cat)?.label || cat;
    sec.appendChild(title);

    const list = document.createElement('div');
    list.className = 'cards';
    items.forEach(it => list.appendChild(renderCard(it)));
    sec.appendChild(list);
    root.appendChild(sec);
  });
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
  const tag = node.querySelector('.badge.tag'); tag.textContent = it.tag || it.category || 'otros';
  const sev = node.querySelector('.badge.sev'); sev.textContent = `sev ${it.severity ?? 0}`;
  const hor = node.querySelector('.badge.hor'); hor.textContent = it.horizon || '—';
  const act = node.querySelector('.badge.act'); act.textContent = it.action || 'FYI';
  tags.hidden = true;
  return node;
}

function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' });
  }catch(e){ return ''; }
}
