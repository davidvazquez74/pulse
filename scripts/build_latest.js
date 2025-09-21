#!/usr/bin/env node
/**
 * Lee RSS, cruza titulares entre fuentes del mismo bloque y prioriza coincidencias (intersección) para mostrar lo más importante.
 * Máximo 3 por sección.
 */
import fs from 'node:fs';
import path from 'node:path';
import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEEDS = {
  cataluna: [
    "https://www.lavanguardia.com/mvc/feed/rss/catalunya",
    "https://www.elperiodico.com/es/rss/catalunya/rss.xml"
  ],
  espana: [
    "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
    "https://www.rtve.es/rss/",
    "https://e00-elmundo.uecdn.es/elmundo/rss/espana.xml"
  ],
  rioja: [
    "https://www.larioja.com/rss/2.0/portada"
  ],
  global: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
  ]
};

const MAX_PER_SECTION = 3;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

function stripTags(html=''){ return String(html).replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim(); }
function normTitle(t){ return String(t||'').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim(); }

function parseRss(xml, source){
  const obj = parser.parse(xml);
  const channel = obj.rss?.channel || obj.feed;
  let items = [];
  if (channel?.item){ items = Array.isArray(channel.item) ? channel.item : [channel.item]; }
  else if (channel?.entry){ items = Array.isArray(channel.entry) ? channel.entry : [channel.entry]; }
  return items.map(it=>{
    const title = it.title?.["#text"] || it.title || "(sin título)";
    const link = it.link?.href || (typeof it.link==="string"? it.link : (Array.isArray(it.link)? it.link[0] : ""));
    const pub = it.pubDate || it.published || it.updated || new Date().toISOString();
    const summary = it.description || it.summary || "";
    const img = (it.enclosure?.url) || "";
    return { title: String(title).trim(), url: String(link).trim(), source, published_at: new Date(pub).toISOString(), summary: stripTags(summary), img };
  });
}

async function fetchFeed(url){
  const res = await fetch(url, { headers: { "User-Agent":"PulseBot/1.0" } });
  const text = await res.text();
  return parseRss(text, new URL(url).hostname);
}

function topByIntersection(group){
  // Agrupa por título normalizado y cuenta cuántas fuentes lo mencionan
  const map = new Map();
  for (const item of group){
    const key = normTitle(item.title).slice(0, 80);
    if (!map.has(key)) map.set(key, { item, count:0, sources:new Set(), latest:item.published_at });
    const entry = map.get(key);
    entry.count += 1;
    entry.sources.add(item.source);
    if (new Date(item.published_at) > new Date(entry.latest)) entry.latest = item.published_at;
  }
  // Orden: más coincidencias → más reciente
  const arr = Array.from(map.values()).sort((a,b)=> (b.count - a.count) || (new Date(b.latest)-new Date(a.latest)));
  return arr.map(e=> e.item).slice(0, MAX_PER_SECTION);
}

async function collect(){
  const result = { updated_at: new Date().toISOString(), version: "live", cataluna:[], espana:[], rioja:[], global:[] };

  for (const [cat, urls] of Object.entries(FEEDS)){
    let all = [];
    for (const u of urls){
      try{ const list = await fetchFeed(u); all.push(...list); }
      catch(e){ console.error("Feed error:", u, e.message); }
    }
    // Preferir items que aparecen en varias fuentes del bloque
    const top = topByIntersection(all);
    // Si hay menos de 3, completar con últimos por fecha (sin duplicar)
    const rest = all
      .filter(x => !top.find(t => normTitle(t.title).slice(0,80) === normTitle(x.title).slice(0,80)))
      .sort((a,b)=> new Date(b.published_at)-new Date(a.published_at));
    const final = [...top, ...rest].slice(0, MAX_PER_SECTION);

    result[cat] = final.map(it => ({
      title: it.title,
      summary: it.summary,
      url: it.url,
      source: it.source,
      published_at: it.published_at,
      img: it.img || "",
      location: cat==='global' ? 'global' : (cat==='espana' ? 'ES' : (cat==='cataluna' ? 'Cataluña' : 'La Rioja')),
      category: 'otros'
    }));
  }
  return result;
}

async function main(){
  const out = await collect();
  const dir = path.join(__dirname, "../data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "latest.json");
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("Wrote", file);
}
main().catch(e=>{ console.error(e); process.exit(1); });
