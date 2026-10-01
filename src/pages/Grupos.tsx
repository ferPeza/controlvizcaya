import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Grupo, Profesor } from "../types";
import ui from "../components/ui.module.css";

interface GruposProps { profesor: Profesor; onSelect: (g: Grupo) => void; }

export default function Grupos({ profesor, onSelect }: GruposProps) {
 const [grupos,setGrupos]=useState<Grupo[]|null>(null);
 const [nuevo,setNuevo]=useState(""); const [busy,setBusy]=useState(false);
 async function cargar(){const{data}=await supabase.from("bano_profesor_grupos").select("grupo_id, bano_grupos(id,nombre)").eq("profesor_id",profesor.id);const list=(data??[]).map((row:any)=>row.bano_grupos as Grupo|null).filter((g):g is Grupo=>!!g).sort((a,b)=>a.nombre.localeCompare(b.nombre));setGrupos(list)}
 useEffect(()=>{cargar()},[profesor.id]);
 async function agregar(){const nombre=nuevo.trim();if(!nombre)return;setBusy(true);let grupoId:string;const{data:existing}=await supabase.from("bano_grupos").select("id,nombre").ilike("nombre",nombre);if(existing?.length)grupoId=existing[0].id;else{const{data:created,error}=await supabase.from("bano_grupos").insert({nombre}).select("id").single();if(error||!created){setBusy(false);return}grupoId=created.id}await supabase.from("bano_profesor_grupos").insert({profesor_id:profesor.id,grupo_id:grupoId});setNuevo("");setBusy(false);cargar()}
 async function quitar(g:Grupo){if(!confirm(`¿Quitar undefined de tus grupos? (el grupo y sus alumnos no se borran)`))return;await supabase.from("bano_profesor_grupos").delete().eq("profesor_id",profesor.id).eq("grupo_id",g.id);cargar()}
 return <div className={ui.dashboard}>
   <div className={ui.pageIntro}>
    <div><span className={ui.eyebrow}>CONTROL ESCOLAR</span><h1 className={ui.pageTitle}>Mis grupos</h1><p className={ui.pageSubtitle}>Administra y accede a los grupos asignados a tu cuenta.</p></div>
    {grupos&&<span className={ui.countBadge}>{grupos.length} grupos</span>}
   </div>
   <div className={ui.groupDashboardGrid}>
    {grupos===null?<div className={ui.card}><p className={ui.empty}>Cargando…</p></div>:grupos.length===0?<div className={ui.card}><p className={ui.empty}>Aún no tienes grupos. Agrega uno abajo.</p></div>:grupos.map((g,i)=>
      <button className={ui.groupTile} key={g.id} onClick={()=>onSelect(g)}>
       <span className={ui.groupTileIcon}>▦</span><span className={ui.groupTileInfo}><strong>{g.nombre}</strong><small>Grupo escolar</small></span><span className={ui.groupTileArrow}>›</span>
       <span className={ui.groupTileRemove} onClick={(e)=>{e.stopPropagation();quitar(g)}} title="Quitar de mis grupos">×</span>
      </button>
    )}
   </div>
   <div className={ui.addPanel}>
    <div><h3 className={ui.addTitle}>Agregar grupo</h3><p className={ui.sectionHint}>Escribe el nombre del grupo para asignarlo a tu cuenta.</p></div>
    <div className={ui.addRow}><input value={nuevo} onChange={e=>setNuevo(e.target.value)} placeholder="Ej. 3A" onKeyDown={e=>e.key==="Enter"&&agregar()}/><button className={`${ui.btn} ${ui.btnPrimary}`} onClick={agregar} disabled={busy}>{busy?"Agregando…":"Agregar grupo"}</button></div>
   </div>
  </div>;
}