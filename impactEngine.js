window.PulseImpact=(function(){
  const RULES=[
    [/euríbor|bce|hipoteca|inflación/i,["finanzas",2,"este mes","vigilar"]],
    [/gasolina|diésel|diesel|petróleo|electricidad|gas/i,["energía",2,"esta semana","vigilar"]],
    [/(huelga|paro).*(tren|metro|bus|autobús|vuelo)|\b(renfe|aena)\b.*(huelga|paro)/i,["movilidad",2,"hoy","planificar"]],
    [/alquiler|vivienda|inmobiliaria/i,["vivienda",2,"este mes","vigilar"]],
    [/impuestos|iva|subsidio|bono/i,["impuestos",2,"este mes","vigilar"]],
    [/dana|temporal|lluvias|ola de calor|inundación/i,["clima",2,"hoy","planificar"]],
    [/cadáver|muertos|asesinato|violencia grave/i,["seguridad",1,"hoy","vigilar"]],
    [/concierto|festival|partido|maratón|celebración/i,["eventos",2,"esta semana","planificar"]],
    [/champions|liga|mundial|copa|bar(ç|c)a|real madrid/i,["deporte",2,"hoy","planificar"]],
    [/covid|vacuna|brote|epidemia|hospital/i,["salud",2,"esta semana","vigilar"]],
    [/\bIA\b|inteligencia artificial|ciberseguridad|hackeo|hacker/i,["tecnología",1,"esta semana","FYI"]],
    [/empresa|fusión|resultados|cotización/i,["negocios",1,"este mes","FYI"]],
    [/juicio|sentencia|tribunal|fiscal/i,["justicia",1,"esta semana","FYI"]],
    [/incendio|contaminación|vertido|desastre ambiental/i,["medioambiente",2,"hoy","vigilar"]]
  ];
  function rules(text){for(const [re,vals] of RULES){if(re.test(text))return vals}return["otros",0,"sin plazo","FYI"]}
  function limitNoEmoji(s,max){return s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,"").trim().split(/\s+/).slice(0,max).join(" ")}
  function limitTeen(s,max){const words=s.trim().split(/\s+/).slice(0,max).join(" ");const em=(words.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu)||[]);if(em.length<=1)return words;let c=0;return words.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,m=>(++c<=1)?m:"")}
  function gen(item){
    const text=(item.title+" "+(item.summary||"")).toLowerCase();
    const [tag,sev,horizon,action]=rules(text);
    const maps={
      finanzas:["Revisa tu cuota y ajusta presupuesto si suben intereses.","Ojo a gastos fijos este mes."],
      energía:["Compara precios y planifica consumo o repostaje.","Carga o reposta cuando esté más barato."],
      movilidad:["Planifica rutas hoy y contempla alternativas.","Mira rutas y sal antes hoy."],
      vivienda:["Valora renegociar alquiler o condiciones.","Si buscas piso, ojo a precios."],
      impuestos:["Revisa deducciones y plazos este mes.","Guarda tickets y recibos."],
      clima:["Evita zonas de riesgo y ajusta desplazamientos.","Lleva chubasquero y evita zonas chungas."],
      seguridad:["Evita la zona afectada y mantente informado.","No te acerques y avisa si ves algo."],
      eventos:["Planifica transporte y horarios si vas a asistir.","Ve con tiempo; habrá colas."],
      deporte:["Prevé aglomeraciones si hay celebraciones.","Si sales, ojo con aglomeraciones."],
      salud:["Sigue recomendaciones y evita riesgos.","Lávate manos y cuida higiene."],
      tecnología:["Activa 2FA y revisa contraseñas.","Activa 2FA y pasa de links raros."],
      negocios:["Observa posibles efectos en tu sector.","Curiosea: puede dar que hablar."],
      justicia:["Anota cambios por posibles efectos después.","Apunta cambios legales claves."],
      medioambiente:["Reduce exposición y sigue indicaciones.","Evita humo y respeta cierres."],
      otros:["Sin efecto directo en tu día a día.","Sin impacto directo para ti."]
    };
    const [a,t]=maps[tag]||maps.otros;
    return {
      adult_impact:limitNoEmoji(a,22),
      teen_impact:limitTeen(t,18),
      tag:tag,severity:sev,horizon,action,
      rationale:`Regla → ${tag}`,confidence:0.5
    };
  }
  return { gen };
})();