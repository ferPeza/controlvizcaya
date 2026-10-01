import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import ui from "../components/ui.module.css";

interface Registro { id:string; alumno_id:string; nombre:string; grupo:string; salida:string; regreso:string|null; }
interface Fila { alumno_id:string; nombre:string; grupo:string; veces:number; minutos:number; ultimaSalida:string; fuera:boolean; salidaActual:string|null; }

function inicioDia(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
function minutosFuera(salida:string, regreso:string|null, now:number){ return Math.max(0,((regreso?new Date(regreso).getTime():now)-new Date(salida).getTime())/60000); }

export default function MonitorStats(){
 const [registros,setRegistros]=useState<Registro[]>([]),[now,setNow]=useState(Date.now()),[loading,setLoading]=useState(true),[grupoFiltro,setGrupoFiltro]=useState("todos");
 async function cargar(){
  const {data}=await supabase.from("bano_registros").select("id,alumno_id,salida,regreso,bano_alumnos!inner(nombre,grupo_id,bano_grupos!inner(nombre))").gte("salida",inicioDia()).order("salida",{ascending:false});
  setRegistros((data??[]).map((r:any)=>({id:r.id,alumno_id:r.alumno_id,nombre:r.bano_alumnos.nombre,grupo:r.bano_alumnos.bano_grupos.nombre,salida:r.salida,regreso:r.regreso})));
  setLoading(false);
 }
 useEffect(()=>{void cargar();const reloj=window.setInterval(()=>setNow(Date.now()),1000);const polling=window.setInterval(()=>void cargar(),2000);const channel=supabase.channel("monitor-estadisticas").on("postgres_changes",{event:"*",schema:"public",table:"bano_registros"},()=>{void cargar()}).subscribe();return()=>{window.clearInterval(reloj);window.clearInterval(polling);void supabase.removeChannel(channel)};},[]);
 const filas=useMemo<Fila[]>(()=>{const map=new Map<string,Fila>();registros.forEach(r=>{if(grupoFiltro!=="todos"&&r.grupo!==grupoFiltro)return;const minutos=minutosFuera(r.salida,r.regreso,now);const anterior=map.get(r.alumno_id);if(!anterior){map.set(r.alumno_id,{alumno_id:r.alumno_id,nombre:r.nombre,grupo:r.grupo,veces:1,minutos,ultimaSalida:r.salida,fuera:!r.regreso,salidaActual:r.regreso?null:r.salida});}else{anterior.veces++;anterior.minutos+=minutos;if(new Date(r.salida).getTime()>new Date(anterior.ultimaSalida).getTime()){anterior.ultimaSalida=r.salida;anterior.fuera=!r.regreso;anterior.salidaActual=r.regreso?null:r.salida;}}});return Array.from(map.values()).sort((a,b)=>a.grupo.localeCompare(b.grupo)||a.nombre.localeCompare(b.nombre));},[registros,grupoFiltro,now]);
 const grupos=useMemo(()=>Array.from(new Set(registros.map(r=>r.grupo))).sort((a,b)=>a.localeCompare(b)),[registros]);
 const totalSalidas=registros.filter(r=>grupoFiltro==="todos"||r.grupo===grupoFiltro).length,totalAlumnos=filas.length,alumnosFuera=filas.filter(f=>f.fuera).length;
 return <div className={ui.dashboard}>
  <section className={ui.pageIntro}><div><h1 className={ui.pageTitle}>Estadísticas</h1></div></section>
  <section className={ui.statsGrid}>
   <div className={ui.statCard}><span className={ui.statLabel}>Salidas hoy</span><strong className={ui.statValue}>{totalSalidas}</strong><span className={ui.statHint}>Todos los profesores</span></div>
   <div className={ui.statCard}><span className={ui.statLabel}>Alumnos</span><strong className={ui.statValue}>{totalAlumnos}</strong><span className={ui.statHint}>Con salida registrada hoy</span></div>
   <div className={ui.statCard}><span className={ui.statLabel}>Fuera ahora</span><strong className={ui.statValue}>{alumnosFuera}</strong><span className={ui.statHint}>Sin registro de regreso</span></div>
  </section>
  <section className={ui.card}>
   <div className={ui.sectionHeader}><div><h2 className={ui.cardTitle}>Salidas del día</h2><p className={ui.sectionHint}>Se contabilizan las salidas solicitadas con cualquier profesor.</p></div><select className={ui.filterSelect} value={grupoFiltro} onChange={e=>setGrupoFiltro(e.target.value)}><option value="todos">Todos los grupos</option>{grupos.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
   {loading?<p className={ui.empty}>Cargando estadísticas…</p>:filas.length===0?<p className={ui.empty}>No hay salidas registradas hoy.</p>:<div className={ui.tableWrap}><table className={ui.statsTable}><thead><tr><th>#</th><th>Alumno</th><th>Grupo</th><th>Última salida</th><th>Tiempo fuera</th><th>Veces hoy</th></tr></thead><tbody>{filas.map((f,i)=>{const actual=f.salidaActual?minutosFuera(f.salidaActual,null,now):0;const tiempo=f.fuera?Math.floor(actual)+" min "+String(Math.floor((actual%1)*60)).padStart(2,"0")+" s":Math.round(f.minutos)+" min acumulados";return <tr key={f.alumno_id}><td className={ui.rankNum}>{i+1}</td><td className={ui.studentCell}>{f.nombre}</td><td><span className={ui.groupBadge}>{f.grupo}</span></td><td>{new Date(f.ultimaSalida).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</td><td>{tiempo}</td><td><strong>{f.veces}</strong></td></tr>})}</tbody></table></div>}
  </section>
 </div>;
}