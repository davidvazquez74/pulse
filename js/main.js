(async function () {
  const newsEl = document.getElementById('news');
  const chips  = document.querySelectorAll('.chip[data-cat]');
  const teensBtn = document.getElementById('teensToggle');

  const clean = (s)=> (s||'').replace(/\n/g,' ').replace(/\\/g,'').replace(/\s+/g,' ').trim();

  let teens = (localStorage.getItem('pulse_mode') || 'adult') === 'teen';
  function applyTeensUI(){ teensBtn?.setAttribute('aria-pressed', teens ? 'true' : 'false'); }
  applyTeensUI();

  teensBtn?.addEventListener('click', () => {
    teens = !teens;
    localStorage.setItem('pulse_mode', teens ? 'teen' : 'adult');
    applyTeensUI();
    render(current, data);
  });

  function empty(msg='Sin noticias (revisa /data/latest.json)'){newsEl.innerHTML=`<div class="empty">${msg}</div>`}

  function impactLine(n){
    const adult = clean(n.adult_impact);
    const teen  = clean(n.teen_impact);
    const txt = teens ? (teen||'') : (adult||'');
    if (txt) return `<div class="impact ${teens?'teen':'adult'}">${txt}</div>`;
    const sum = clean(n.summary);
    return sum? `<p>${sum}</p>`: '';
  }

  function card(n){
    const el = document.createElement('article');
    el.className='card';
    const ttl = clean(n.title)||'(sin título)';
    el.innerHTML = `
      <h3><a href="${n.url}" target="_blank" rel="noopener">${ttl}</a></h3>
      ${impactLine(n)}
      <div class="meta">
        ${n.published_at? new Date(n.published_at).toLocaleString('es-ES'):''}
        ${n.source? ' · '+n.source:''}
      </div>`;
    return el;
  }

  async function load(){
    try{
      const r=await fetch('data/latest.json',{cache:'no-store'});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j=await r.json();
      return {espana:[],cataluna:[],rioja:[],global:[],...(j||{})};
    }catch(e){
      console.warn('No data',e);
      return {espana:[],cataluna:[],rioja:[],global:[]};
    }
  }

  function render(cat, data){
    const list=(data[cat]||[]).slice(0,3);
    newsEl.innerHTML='';
    if(!list.length) return empty();
    list.forEach(n=>newsEl.appendChild(card(n)));
  }

  const data = await load();
  let current='espana';
  render(current,data);
  chips.forEach(c=>c.addEventListener('click',()=>{
    chips.forEach(x=>x.classList.remove('chip--active'));
    c.classList.add('chip--active');
    current=c.dataset.cat;
    render(current,data);
  }));
  document.getElementById('refreshBtn')?.addEventListener('click',()=>location.reload());
})();