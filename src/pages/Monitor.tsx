import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import ui from "../components/ui.module.css";
import type { Profesor } from "../types";

interface MonitorProps { profesor: Profesor; }
type Motivo = "salio" | "tutor" | "psicologa" | "coordinacion";
const LABEL: Record<Motivo,string> = { salio:"Salida por baño", tutor:"Tutor", psicologa:"Psicóloga", coordinacion:"Coordinación" };
interface Salida { id:string; alumno_id:string; nombre:string; grupo_id:string; grupo:string; salida:string; motivo:Motivo; permisosHoy:number; }

function minutosDesde(iso:string,now:number){return Math.max(0,(now-new Date(iso).getTime())/60000);}
function colorTiempo(min:number){if(min<=5)return "#22a06b";if(min<=10)return "#f5a524";return "#ef4444";}
function inicioDia(){const d=new Date();d.setHours(0,0,0,0);return d.toISOString();}

export default function Monitor({profesor:_profesor}:MonitorProps){
 const [salidas,setSalidas]=useState<Salida[]>([]),[grupos,setGrupos]=useState<Array<{id:string;nombre:string}>>([]),[grupo,setGrupo]=useState("todos"),[now,setNow]=useState(Date.now()),[loading,setLoading]=useState(true),[realtime,setRealtime]=useState(false),[permisosHoyTotal,setPermisosHoyTotal]=useState(0);
 const cargando=useRef(false);
 async function cargar(){
  if(cargando.current)return;
  cargando.current=true;
  const {data:rows}=await supabase.from("bano_registros").select("id,alumno_id,salida,motivo,bano_alumnos!inner(nombre,grupo_id,bano_grupos!inner(id,nombre))").is("regreso",null).order("salida",{ascending:true});
  const raw=rows??[];
  const ids=raw.map((r:any)=>r.alumno_id);
  let conteos:Record<string,number>={};
  if(ids.length){
   const {data:dayRows}=await supabase.from("bano_registros").select("alumno_id").in("alumno_id",ids).gte("salida",inicioDia()).lt("salida",new Date(Date.now()+86400000).toISOString());
   (dayRows??[]).forEach((r:any)=>{conteos[r.alumno_id]=(conteos[r.alumno_id]??0)+1});
  }
  const list:Salida[]=raw.map((r:any)=>({id:r.id,alumno_id:r.alumno_id,nombre:r.bano_alumnos.nombre,grupo_id:r.bano_alumnos.grupo_id,grupo:r.bano_alumnos.bano_grupos.nombre,salida:r.salida,motivo:(r.motivo??"salio") as Motivo,permisosHoy:conteos[r.alumno_id]??0}));
  setSalidas(list);setPermisosHoyTotal(Object.values(conteos).reduce((a,b)=>a+b,0));setGrupos(Array.from(new Map(list.map(x=>[x.grupo_id,{id:x.grupo_id,nombre:x.grupo}])).values()).sort((a,b)=>a.nombre.localeCompare(b.nombre)));setLoading(false);cargando.current=false;
 }
 useEffect(()=>{
  cargar();const t=setInterval(()=>setNow(Date.now()),1000);const r=setInterval(cargar,2000);
  const channel=supabase.channel("monitor-salidas").on("postgres_changes",{event:"INSERT",schema:"public",table:"bano_registros"},()=>{void cargar()}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"bano_registros"},()=>{void cargar()}).on("postgres_changes",{event:"DELETE",schema:"public",table:"bano_registros"},()=>{void cargar()}).on("postgres_changes",{event:"*",schema:"public",table:"bano_alumnos"},()=>{void cargar()}).on("postgres_changes",{event:"*",schema:"public",table:"bano_grupos"},()=>{void cargar()}).subscribe(status=>setRealtime(status==="SUBSCRIBED"));
  return()=>{clearInterval(t);clearInterval(r);supabase.removeChannel(channel)};
 },[]);
 const visibles=useMemo(()=>grupo==="todos"?salidas:salidas.filter(s=>s.grupo_id===grupo),[salidas,grupo]);
 const demorados=visibles.filter(s=>minutosDesde(s.salida,now)>5).length;
 const criticos=visibles.filter(s=>minutosDesde(s.salida,now)>10).length;
 const porMotivo=useMemo(()=>Object.fromEntries(["salio","tutor","psicologa","coordinacion"].map(m=>[m,visibles.filter(s=>s.motivo===m).length])) as Record<Motivo,number>,[visibles]);
 const porGrupo=useMemo(()=>grupos.map(g=>({name:g.nombre,count:visibles.filter(s=>s.grupo_id===g.id).length})).filter(x=>x.count>0),[grupos,visibles]);
 const maxGrupo=Math.max(1,...porGrupo.map(x=>x.count));
 return <div className={ui.monitorDashboard}>
  <section className={ui.monitorHeader}><div><span className={ui.eyebrow}>PANEL DE MONITOREO</span><h1 className={ui.pageTitle}>Monitor de Salidas</h1><p className={ui.pageSubtitle}>Control en tiempo real de los alumnos fuera del aula.</p></div><div className={ui.monitorSummary}><div><strong>{visibles.length}</strong><span>Fuera ahora</span></div><div><strong>{permisosHoyTotal}</strong><span>Permisos hoy</span></div><div className={demorados?ui.monitorAlert:""}><strong>{demorados}</strong><span>Más de 5 min</span></div><div className={criticos?ui.monitorAlert:""}><strong>{criticos}</strong><span>Más de 10 min</span></div></div></section>
  <section className={ui.monitorFilters}><label htmlFor="grupoMonitor">Grupo</label><select id="grupoMonitor" value={grupo} onChange={e=>setGrupo(e.target.value)}><option value="todos">Todos los grupos</option>{grupos.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}</select><span className={ui.realtimeStatus} data-online={realtime}>{realtime?"● En tiempo real":"○ Reconectando…"}</span><span className={ui.monitorLegend}><i className={ui.legendGreen}/>0–5 min <i className={ui.legendYellow}/>5–10 min <i className={ui.legendRed}/>10+ min</span></section>
  <section className={ui.statsGrid}><div className={ui.statCard}><span className={ui.statLabel}>Alumnos fuera</span><strong className={ui.statValue}>{visibles.length}</strong><span className={ui.statHint}>Actualmente fuera del aula</span></div><div className={ui.statCard}><span className={ui.statLabel}>Permisos hoy</span><strong className={ui.statValue}>{permisosHoyTotal}</strong><span className={ui.statHint}>Salidas registradas en el día</span></div><div className={ui.statCard}><span className={ui.statLabel}>Más de 5 minutos</span><strong className={ui.statValue}>{demorados}</strong><span className={ui.statHint}>Requieren seguimiento</span></div><div className={ui.statCard}><span className={ui.statLabel}>Grupos activos</span><strong className={ui.statValue}>{porGrupo.length}</strong><span className={ui.statHint}>Con alumnos fuera</span></div></section>
  <section className={ui.monitorAnalytics}><div className={ui.card}><h2 className={ui.cardTitle}>Salidas por grupo</h2><p className={ui.sectionHint}>Alumnos actualmente fuera.</p><div className={ui.groupBars}>{porGrupo.length?porGrupo.map(x=><div className={ui.groupBar} key={x.name}><div><strong>{x.name}</strong><span>{x.count}</span></div><div className={ui.groupTrack}><span style={{width:`${x.count/maxGrupo*100}%`}}/></div></div>):<p className={ui.empty}>No hay grupos con alumnos fuera.</p>}</div></div><div className={ui.card}><h2 className={ui.cardTitle}>Motivos de salida</h2><p className={ui.sectionHint}>Distribución de las salidas actuales.</p><div className={ui.reasonList}>{(["salio","tutor","psicologa","coordinacion"] as Motivo[]).map(m=><div className={ui.reasonRow} key={m}><span className={ui.reasonDot}/><strong>{LABEL[m]}</strong><span>{porMotivo[m]}</span><div className={ui.reasonTrack}><i style={{width:visibles.length?`${porMotivo[m]/visibles.length*100}%`:"0%"}}/></div></div>)}</div></div></section>
  <div className={ui.monitorSectionHead}><div><h2 className={ui.cardTitle}>Alumnos fuera del aula</h2><p className={ui.sectionHint}>Ver nombre, grado/grupo, hora de salida, permisos del día y tiempo transcurrido.</p></div></div>
  {loading?<div className={ui.card}><p className={ui.empty}>Cargando monitoreo…</p></div>:visibles.length===0?<div className={ui.card}><p className={ui.empty}>No hay alumnos fuera del aula con este filtro.</p></div>:<section className={ui.monitorGrid}>{visibles.map(s=>{const mins=minutosDesde(s.salida,now),color=colorTiempo(mins),mi=Math.floor(mins),seg=Math.floor((mins-mi)*60),hora=new Date(s.salida).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});return <article className={ui.monitorCard} key={s.id} style={{"--time-color":color} as React.CSSProperties}><div className={ui.monitorCardTop}><span className={ui.monitorGroup}>{s.grupo}</span><span className={ui.monitorReason}>{LABEL[s.motivo]}</span></div><h2>{s.nombre}</h2><div className={ui.monitorMetaGrid}><div><small>Grado</small><strong>{s.grupo.match(/^\d+/)?.[0] ? `${s.grupo.match(/^\d+/)?.[0]}°` : s.grupo}</strong></div><div><small>Grupo</small><strong>{s.grupo}</strong></div><div><small>Permisos hoy</small><strong>{s.permisosHoy}</strong></div><div><small>Hora de salida</small><strong>{hora}</strong></div></div><div className={ui.monitorTime} style={{color}}>{mi}<small> min {String(seg).padStart(2,"0")} s</small></div><div className={ui.monitorBar}><span style={{width:`${Math.min(100,Math.max(4,mins/10*100))}%`,backgroundColor:color}}/></div><p>Fuera desde {hora} · {mins<=5?"En tiempo":mins<=10?"Atención":"Demorado"}</p></article>})}</section>}
 </div>;
}
