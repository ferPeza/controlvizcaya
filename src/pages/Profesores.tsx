import React,{useEffect,useState} from "react";
import { supabase } from "../lib/supabase";
import type { Grupo, Profesor } from "../types";
import ui from "../components/ui.module.css";

interface Props{ administrador:Profesor }

export default function Profesores({administrador}:Props){
 const [lista,setLista]=useState<Profesor[]>([]);
 const [grupos,setGrupos]=useState<Grupo[]>([]);
 const [usuario,setUsuario]=useState("");
 const [nombre,setNombre]=useState("");
 const [pin,setPin]=useState("");
 const [msg,setMsg]=useState("");
 const [busy,setBusy]=useState(false);
 const [grupoProfesor,setGrupoProfesor]=useState<Profesor|null>(null);
 const [gruposAsignados,setGruposAsignados]=useState<string[]>([]);
 const [cargandoGrupos,setCargandoGrupos]=useState(false);
 const [guardandoGrupo,setGuardandoGrupo]=useState<string|null>(null);

 async function cargar(){
   const {data}=await supabase.from("bano_profesores").select("id,nombre,usuario,pin,rol").order("nombre");
   setLista((data??[]).map((p:any)=>({id:p.id,nombre:p.nombre,usuario:p.usuario,rol:p.rol??"profesor"})));
 }
 async function cargarGrupos(){
   const {data}=await supabase.from("bano_grupos").select("id,nombre").order("nombre");
   setGrupos((data??[]) as Grupo[]);
 }
 useEffect(()=>{void cargar();void cargarGrupos()},[]);

 async function agregar(){
   const u=usuario.trim(),n=nombre.trim(),p=pin.trim();
   if(!u||!n||p.length!==4){setMsg("Completa usuario, nombre completo y un PIN de 4 dígitos.");return}
   setBusy(true);setMsg("");
   const {data:dup}=await supabase.from("bano_profesores").select("id").ilike("usuario",u).limit(1);
   if(dup?.length){setBusy(false);setMsg("Ese usuario ya existe.");return}
   const {error}=await supabase.from("bano_profesores").insert({usuario:u,nombre:n,pin:p,rol:"profesor"});
   if(error){setBusy(false);setMsg(error.message);return}
   setUsuario("");setNombre("");setPin("");setBusy(false);setMsg("Profesor dado de alta correctamente.");void cargar();
 }

 async function abrirGrupos(profesor:Profesor){
   setGrupoProfesor(profesor);
   setCargandoGrupos(true);
   const {data,error}=await supabase
     .from("bano_profesor_grupos")
     .select("grupo_id")
     .eq("profesor_id",profesor.id);
   setGruposAsignados(error?[]:(data??[]).map((x:any)=>x.grupo_id));
   setCargandoGrupos(false);
 }

 function cerrarGrupos(){
   if(guardandoGrupo)return;
   setGrupoProfesor(null);
   setGruposAsignados([]);
 }

 async function cambiarGrupo(grupoId:string){
   if(!grupoProfesor||guardandoGrupo)return;
   const asignado=gruposAsignados.includes(grupoId);
   setGuardandoGrupo(grupoId);
   if(asignado){
     const {error}=await supabase
       .from("bano_profesor_grupos")
       .delete()
       .eq("profesor_id",grupoProfesor.id)
       .eq("grupo_id",grupoId);
     if(!error)setGruposAsignados(prev=>prev.filter(id=>id!==grupoId));
     else setMsg(error.message);
   }else{
     const {error}=await supabase
       .from("bano_profesor_grupos")
       .insert({profesor_id:grupoProfesor.id,grupo_id:grupoId});
     if(!error)setGruposAsignados(prev=>[...prev,grupoId]);
     else setMsg(error.message);
   }
   setGuardandoGrupo(null);
 }

 return <div className={ui.dashboard}>
   <section className={ui.pageIntro}>
    <div><h1 className={ui.pageTitle}>Profesores</h1><p className={ui.pageSubtitle}>Alta de cuentas y asignación de grupos.</p></div>
   </section>

   <section className={ui.card}>
    <h2 className={ui.cardTitle}>Nuevo profesor</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12,marginTop:16}}>
      <div className={ui.field}><label>Usuario</label><input value={usuario} onChange={e=>setUsuario(e.target.value)} placeholder="Ej. jlopez"/></div>
      <div className={ui.field}><label>Nombre completo</label><input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Juan López Pérez"/></div>
      <div className={ui.field}><label>PIN</label><input value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="4 dígitos" inputMode="numeric" maxLength={4}/></div>
    </div>
    <button className={ui.btn+" "+ui.btnPrimary} onClick={agregar} disabled={busy}>{busy?"Guardando…":"Dar de alta profesor"}</button>
    {msg&&<p className={ui.errorMsg}>{msg}</p>}
   </section>

   <section className={ui.card}>
    <div className={ui.sectionHeader}>
      <div><h2 className={ui.cardTitle}>Profesores registrados</h2><p className={ui.sectionHint}>Administra las cuentas y los grupos asignados.</p></div>
      <span className={ui.countBadge}>{lista.length} cuentas</span>
    </div>
    <div className={ui.tableWrap}>
      <table className={ui.statsTable}>
       <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Grupos</th></tr></thead>
       <tbody>
        {lista.map(p=><tr key={p.id}>
          <td><strong>{p.usuario}</strong></td>
          <td>{p.nombre}</td>
          <td><span className={ui.groupBadge}>{p.rol==="administrador"?"Administrador":p.rol==="monitor"?"Monitor":"Profesor"}</span></td>
          <td><button className={ui.btn+" "+ui.btnGhost} style={{padding:"7px 11px",fontSize:12}} onClick={()=>abrirGrupos(p)}>Administrar grupos</button></td>
        </tr>)}
       </tbody>
      </table>
    </div>
   </section>

   {grupoProfesor&&<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(15,35,62,.42)",display:"grid",placeItems:"center",padding:20}} onMouseDown={e=>{if(e.target===e.currentTarget)cerrarGrupos()}}>
     <section className={ui.card} style={{width:"min(520px,100%)",maxHeight:"80vh",overflow:"auto",margin:0,boxShadow:"0 20px 60px rgba(16,42,86,.22)"}}>
       <div className={ui.sectionHeader} style={{alignItems:"center",marginBottom:14}}>
         <div><h2 className={ui.cardTitle}>Grupos de {grupoProfesor.nombre}</h2><p className={ui.sectionHint}>Selecciona los grupos que podrá consultar y administrar.</p></div>
         <button className={ui.btn+" "+ui.btnIcon} onClick={cerrarGrupos} disabled={!!guardandoGrupo} aria-label="Cerrar">✕</button>
       </div>
       {cargandoGrupos?<p className={ui.empty}>Cargando grupos…</p>:grupos.length===0?<p className={ui.empty}>No hay grupos registrados.</p>:
       <div style={{display:"grid",gap:8}}>
        {grupos.map(g=>{
          const activo=gruposAsignados.includes(g.id);
          const guardando=guardandoGrupo===g.id;
          return <button key={g.id} onClick={()=>cambiarGrupo(g.id)} disabled={!!guardandoGrupo&&!guardando} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 14px",border:"1px solid "+(activo?"#8abcf1":"#dbe6f2"),borderRadius:10,background:activo?"#eef6ff":"#fff",color:"#102a56",cursor:guardandoGrupo&&!guardando?"default":"pointer",textAlign:"left",opacity:guardando?.6:1}}>
            <span style={{width:22,height:22,borderRadius:6,border:"2px solid "+(activo?"#237ce0":"#b7c7d9"),background:activo?"#237ce0":"#fff",display:"grid",placeItems:"center",color:"#fff",fontSize:13,fontWeight:900,flex:"none"}}>{activo?"✓":""}</span>
            <strong style={{fontSize:14}}>{g.nombre}</strong>
            <span style={{marginLeft:"auto",fontSize:11,color:activo?"#237ce0":"#8aa0ba",fontWeight:700}}>{guardando?"Guardando…":activo?"Asignado":"Sin asignar"}</span>
          </button>
        })}
       </div>}
       <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginTop:18,paddingTop:14,borderTop:"1px solid #dbe6f2"}}>
         <span style={{fontSize:12,color:"#7890ae"}}>{gruposAsignados.length} grupo{gruposAsignados.length===1?"":"s"} asignado{gruposAsignados.length===1?"":"s"}</span>
         <button className={ui.btn+" "+ui.btnPrimary} onClick={cerrarGrupos} disabled={!!guardandoGrupo}>Cerrar</button>
       </div>
     </section>
   </div>}
 </div>;
}
