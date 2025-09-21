const DEFAULT_TAGS=["España","Cataluña","La Rioja","Global"];
const CATEGORY_MAP={"España":"espana","Cataluña":"cataluna","La Rioja":"rioja","Global":"global"};
const MAX_PER_SECTION=3;
const state={data:null,activeCategory:"España",impacts:new Map()};

function $(s,r=document){return r.querySelector(s)}
function renderChips(){
  const bar=$('#chipBar'); bar.innerHTML='';
  DEFAULT_TAGS.forEach(cat=>{
    const b=document.createElement('button'); b.className='chip'+(state.activeCategory===cat?' active':'');
    b.textContent=cat; b.onclick=()=>{state.activeCategory=cat; renderNews(); renderChips();};
    bar.appendChild(b);
  });
}
function formatTimeAgo(iso){
  if(!iso) return ''; const d=new Date(iso); const mins=Math.round((Date.now()-d.getTime())/60000);
  if(mins<60) return mins+' min'; const h=Math.round(mins/60); if(h<24) return h+' h'; const days=Math.round(h/24); return days+' d';
}
async function loadData(){
  $('#skeleton').style.display='grid';
  try{ const res=await fetch('data/latest.json',{cache:'no-store'}); state.data=await res.json(); }
  catch(e){ state.data={espana:[],cataluna:[],rioja:[],global:[],updated_at:new Date().toISOString()}; }
  finally{ $('#skeleton').style.display='none'; }
}
function pickList(){
  const key=CATEGORY_MAP[state.activeCategory]; const list=(state.data&&state.data[key])||[]; return list.slice(0,MAX_PER_SECTION);
}
function createCard(it){
  const tpl=$('#cardTemplate'); const node=tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('.card-title').textContent=it.title; node.querySelector('.card-summary').textContent=it.summary||'';
  node.querySelector('.source').textContent=it.source||''; const t=node.querySelector('.timeago'); t.dateTime=it.published_at||''; t.textContent=formatTimeAgo(it.published_at);
  const impact=window.PulseImpact.gen(it); node.querySelector('.adult-impact').textContent=impact.adult_impact; node.querySelector('.teen-impact').textContent=impact.teen_impact;
  node.querySelector('.tag').textContent='#'+impact.tag; node.querySelector('.sev').textContent='sev '+impact.severity; node.querySelector('.horizon').textContent=impact.horizon; node.querySelector('.action').textContent=impact.action;
  node.querySelector('.btn').href=it.url||'#';
  node.querySelector('.toggle-impact').onclick=(e)=>{const box=node.querySelector('.impact'); const collapsed=box.classList.toggle('collapsed'); e.currentTarget.setAttribute('aria-expanded',String(!collapsed)); e.currentTarget.textContent=collapsed?'Ver impacto':'Ocultar impacto';};
  return node;
}
async function renderNews(){
  const el=$('#news'); el.innerHTML=''; const list=pickList();
  if(!list.length){ const d=document.createElement('div'); d.style.padding='24px'; d.innerHTML='<strong>No hay noticias.</strong>'; el.appendChild(d); return; }
  list.forEach(it=> el.appendChild(createCard(it)));
}
$('#refreshBtn').onclick=()=>{ loadData().then(renderNews); };
renderChips(); loadData().then(renderNews);