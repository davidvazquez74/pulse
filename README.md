# Pulse (Netlify + GitHub, sin noticias de ejemplo)
- App estática (HTML/CSS/JS). Máx 3 por sección. Impacto via reglas en cliente.
- `scripts/build_latest.js` lee RSS y prioriza titulares que aparecen en varias fuentes del mismo bloque.
- Workflow horario `.github/workflows/fetch_news.yml` actualiza `data/latest.json` y hace push.
- `netlify.toml` publica desde la raíz y marca `latest.json` como `no-store`.

## Deploy
1) Crea repo GitHub con estos ficheros en **raíz**.  
2) En GitHub: Settings → Actions → General → **Workflow permissions: Read and write**.  
3) Netlify → Add new site → Import from Git → selecciona el repo.  
   - Build command: vacío.  
   - Publish directory: `.`  
4) Abre el sitio. La primera vez verás vacío hasta que corra el workflow o lo lances manualmente en **Actions → Update News (Run workflow)**.

