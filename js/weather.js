// site/js/weather.js — widget semanal compacto (Molins de Rei por defecto)
(function () {
  const elDays = document.getElementById('wx-days');
  const elCity = document.getElementById('wx-city');
  const btnChange = document.getElementById('wx-change');
  if (!elDays || !elCity) return;

  const DEFAULT = { name: 'Molins de Rei', lat: 41.4167, lon: 2.0167 };
  const ICON = (c) => ({0:'☀️',1:'🌤',2:'⛅️',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌦',61:'🌧',63:'🌧',65:'🌧',66:'🌧',67:'🌧',71:'🌨',73:'🌨',75:'❄️',80:'🌦',81:'🌧',82:'🌧',85:'🌨',86:'🌨',95:'⛈',96:'⛈',99:'⛈'}[c]||'⛅️');
  const fmtDay = (iso) => new Date(iso).toLocaleDateString('es-ES',{weekday:'short'});

  function draw(days) {
    elDays.innerHTML = '';
    (days || []).slice(0, 6).forEach(d => {
      const col = document.createElement('div');
      col.className = 'wx-col';
      col.innerHTML = `<div class="wx-day">${fmtDay(d.date)}</div>
        <div class="wx-ico">${ICON(d.code)}</div>
        <div class="wx-tmp">${Math.round(d.tmax)}° / ${Math.round(d.tmin)}°</div>`;
      elDays.appendChild(col);
    });
  }

  async function fetchWeekly(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&lang=es`;
    const r = await fetch(url, { cache: 'no-store' });
    const j = await r.json();
    if (!j?.daily?.time) throw new Error('Open-Meteo sin daily');
    return j.daily.time.map((t, i) => ({
      date: t, code: j.daily.weathercode[i],
      tmax: j.daily.temperature_2m_max[i], tmin: j.daily.temperature_2m_min[i]
    }));
  }

  async function useCity(lat, lon, name) {
    elCity.textContent = name;
    try {
      const days = await fetchWeekly(lat, lon);
      draw(days);
    } catch (e) {
      console.warn('WX fallback:', e);
      const today = new Date();
      const fake = Array.from({ length: 6 }).map((_, k) => {
        const d = new Date(today); d.setDate(today.getDate() + k);
        return { date: d.toISOString().slice(0, 10), code: 2, tmax: 24, tmin: 16 };
        });
      draw(fake);
    }
  }

  (async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('pulse_city_manual') || 'null');
      if (stored) return useCity(stored.lat, stored.lon, stored.name);
    } catch {}
    await useCity(DEFAULT.lat, DEFAULT.lon, DEFAULT.name);
  })();

  btnChange?.addEventListener('click', async () => {
    const name = prompt('Ciudad (ej. Barcelona, Logroño):');
    if (!name) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=es&q=${encodeURIComponent(name)}`);
      const [hit] = await r.json();
      if (!hit) return alert('No encontrada');
      const lat = parseFloat(hit.lat), lon = parseFloat(hit.lon), pretty = (hit.display_name || name).split(',')[0];
      localStorage.setItem('pulse_city_manual', JSON.stringify({ name: pretty, lat, lon }));
      await useCity(lat, lon, pretty);
    } catch { alert('Error buscando la ciudad'); }
  });
})();