(async function(){
  const newsEl=document.getElementById('news');
  const chips=document.querySelectorAll('.chip[data-cat]');
  const teensBtn=document.getElementById('teensToggle');
  let teens=localStorage.getItem('pulse_mode')==='teen';
  function apply(){teensBtn.setAttribute('aria-pressed',teens?'true':'false');}
  apply();
  teensBtn.addEventListener('click',()=>{teens=!teens;localStorage.setItem('pulse_mode',teens?'teen':'adult');apply();render(cur,data);});
  function card(n){const d=document.createElement('div');d.className='card';d.innerHTML=`<h3>${n.title}</h3><p>${teens?n.teen_impact:n.adult_impact}</p>`;return d;}
  async function load(){try{const r=await fetch('data/latest.json',{cache:'no-store'});return await r.json();}catch{return {espana:[],cataluna:[],rioja:[],global:[]};}}
  function render(cat,data){newsEl.innerHTML='';(data[cat]||[]).slice(0,3).forEach(n=>newsEl.appendChild(card(n)));}
  const data=await load();let cur='espana';render(cur,data);
  chips.forEach(c=>c.addEventListener('click',()=>{chips.forEach(x=>x.classList.remove('chip--active'));c.classList.add('chip--active');cur=c.dataset.cat;render(cur,data);}));
})();