
let PULSE_TEENS = JSON.parse(localStorage.getItem('pulse_teens')||'false');
const STATE = {
  active: 'espana',
  cats: [{k:'espana',n:'España'},{k:'cataluna',n:'Cataluña'},{k:'rioja',n:'La Rioja'},{k:'global',n:'Global'}],
  data: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initTeens(); initTheme();
  buildCatChips();
  await loadData();
  render();
  if (typeof window.initPulseWeather==='function') window.initPulseWeather();
});

function initTeens(){
  const b = document.getElementById('chip-teens');
  if(!b) return;
  b.setAttribute('aria-pressed', String(PULSE_TEENS));
  b.addEventListener('click', ()=>{
    PULSE_TEENS = !PULSE_TEENS;
    localStorage.setItem('pulse_teens', JSON.stringify(PULSE_TEENS));
    b.setAttribute('aria-pressed', String(PULSE_TEENS));
    render();
  });
}

function initTheme(){
  const r = document.documentElement;
  const btn = document.getElementById('chip-mode'); if(!btn) return;
  const get = ()=> r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const apply = (t)=>{ if(t) r.setAttribute('data-theme',t); else r.removeAttribute('data-theme'); btn.querySelector('.mode-ico').textContent = (get()=='dark'?'🌙':'☀️'); btn.setAttribute('aria-pressed', String(get()=='dark')); }
  const saved = localStorage.getItem('pulse_theme'); apply(saved);
  btn.addEventListener('click', ()=>{ const next = (get()=='dark')?'light':'dark'; localStorage.setItem('pulse_theme', next); apply(next); });
}

async function loadData(){
  try{
    const res = await fetch('data/latest.json',{cache:'no-store'});
    const raw = await res.json();
    STATE.data = normal(raw);
  }catch(e){
    STATE.data = {espana:[],cataluna:[],rioja:[],global:[],updated_at:new Date().toISOString()};
  }
}

function normal(d){
  const out = {...d};
  if (out['cataluña'] && !out['cataluna']) out['cataluna']=out['cataluña'];
  if (out['españa'] && !out['espana']) out['espana']=out['españa'];
  ['espana','cataluna','rioja','global'].forEach(k=>{ if(!Array.isArray(out[k])) out[k]=[]; });
  return out;
}

function buildCatChips(){
  const wrap = document.getElementById('chips'); wrap.innerHTML='';
  STATE.cats.forEach(c=>{
    const b = document.createElement('button');
    b.className='chip'; b.type='button'; b.textContent=c.n;
    if(c.k===STATE.active) b.setAttribute('aria-pressed','true');
    b.addEventListener('click', ()=>{
      STATE.active=c.k;
      [...wrap.children].forEach(x=>x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed','true');
      render();
    });
    wrap.appendChild(b);
  });
}

function render(){
  const root = document.getElementById('content');
  root.innerHTML='';
  const list = (STATE.data?.[STATE.active]||[]).slice(0,6);

  // título de sección
  const h = document.createElement('h2');
  h.className='section-title';
  h.textContent = STATE.cats.find(x=>x.k===STATE.active)?.n || 'Noticias';
  root.appendChild(h);

  const grid = document.createElement('div'); grid.className='grid';
  if(list.length===0){
    const e = document.createElement('div');
    e.className='empty';
    e.innerHTML = `Sin noticias (aún). <button id="retry" class="chip" type="button">Reintentar</button>`;
    e.querySelector('#retry').addEventListener('click', async ()=>{ await loadData(); render(); });
    grid.appendChild(e);
  }else{
    list.forEach(n=> grid.appendChild(card(n)));
  }
  root.appendChild(grid);
}

function card(n){
  const tpl = document.getElementById('card').content.firstElementChild.cloneNode(true);
  tpl.querySelector('.t').textContent = n.title||'—';
  tpl.querySelector('.s').textContent = (PULSE_TEENS ? n.teen_impact : n.adult_impact) || n.summary || '';
  tpl.querySelector('.src').textContent = n.source||'';
  tpl.querySelector('.d').textContent = fmt(n.published_at);
  tpl.querySelector('.lnk').href = n.url || '#';
  return tpl;
}

function fmt(iso){ try{const d=new Date(iso); return d.toLocaleString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}catch(_){return '';} }
