
window.initPulseWeather = async function(){
  const box = document.getElementById('weather-days'); if(!box) return;
  // skeleton 6 días compacto
  box.innerHTML = Array.from({length:6}).map(()=>`<div class="wx-day"><div class="d">—</div><div class="i">⛅</div><div class="t">··</div></div>`).join('');
  try{
    const lat=41.416, lon=2.015; // Molins
    const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FMadrid&lang=es`;
    const r=await fetch(u,{cache:'no-store'}); const j=await r.json();
    const D=(iso)=>new Date(iso).toLocaleDateString('es-ES',{weekday:'short'});
    const I=(c)=>[0,1].includes(c)?'☀️':[2,3].includes(c)?'⛅':[51,53,55,61,63,65,80,81,82].includes(c)?'🌧️':[71,73,75,77].includes(c)?'❄️':[95,96,99].includes(c)?'⛈️':[45,48].includes(c)?'🌫️':'⛅';
    const days=j.daily.time.slice(0,6), max=j.daily.temperature_2m_max, min=j.daily.temperature_2m_min, code=j.daily.weathercode;
    box.innerHTML = days.map((d,i)=>`<div class="wx-day"><div class="d">${D(d)}</div><div class="i">${I(code[i])}</div><div class="t">${Math.round(min[i])}° / ${Math.round(max[i])}°</div></div>`).join('');
    const upd=document.getElementById('weather-updated'); if(upd) upd.textContent=new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  }catch(e){ /* deja skeleton */ }
};
