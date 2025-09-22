
// Widget semanal (Molins de Rei) usando Open-Meteo (sin API key).
window.initPulseWeather = async function () {
  const elDays = document.getElementById('weather-days');
  const elUpd  = document.getElementById('weather-updated');
  if (!elDays) return;

  const lat = 41.416, lon = 2.015; // Molins de Rei aprox
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FMadrid&lang=es`;

  elDays.innerHTML = Array.from({length:7}).map(()=>(
    `<div class="w-day" aria-busy="true">
       <div class="d">—</div>
       <div class="i">⛅</div>
       <div class="t">··</div>
     </div>`
  )).join('');

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    const days = (data.daily?.time || []).slice(0,7);

    const WMAP = {
      0:'Despejado', 1:'Claro', 2:'Nubes', 3:'Nubes',
      45:'Niebla', 48:'Niebla', 51:'Llovizna', 53:'Llovizna', 55:'Llovizna',
      61:'Lluvia', 63:'Lluvia', 65:'Lluvia', 66:'Aguanieve', 67:'Aguanieve',
      71:'Nieve', 73:'Nieve', 75:'Nieve', 77:'Nieve',
      80:'Chubascos', 81:'Chubascos', 82:'Chubascos',
      95:'Tormenta', 96:'Tormenta', 99:'Tormenta'
    };
    const I = (code) => {
      if ([0,1].includes(code)) return '☀️';
      if ([2,3].includes(code)) return '⛅';
      if ([51,53,55,61,63,65,80,81,82].includes(code)) return '🌧️';
      if ([71,73,75,77].includes(code)) return '❄️';
      if ([95,96,99].includes(code)) return '⛈️';
      if ([45,48].includes(code)) return '🌫️';
      return '⛅';
    };
    const fmt = (iso) => new Date(iso).toLocaleDateString('es-ES', { weekday: 'short' });
    const max = data.daily.temperature_2m_max;
    const min = data.daily.temperature_2m_min;
    const code = data.daily.weathercode;

    elDays.innerHTML = days.map((d,i)=>`
      <div class="w-day" aria-label="${WMAP[code[i]]||'Tiempo'}">
        <div class="d">${fmt(d)}</div>
        <div class="i" aria-hidden="true">${I(code[i])}</div>
        <div class="t">${Math.round(min[i])}° / ${Math.round(max[i])}°</div>
      </div>
    `).join('');

    if (elUpd) elUpd.textContent = new Date().toLocaleString('es-ES', { hour:'2-digit', minute:'2-digit' });
  } catch (e) {
    elDays.innerHTML = `<div class="w-day">—</div>`.repeat(7);
    if (elUpd) elUpd.textContent = 'sin conexión';
  }
};
