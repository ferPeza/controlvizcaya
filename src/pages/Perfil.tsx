import React,{useState} from "react";
import { supabase } from "../lib/supabase";
import type { Profesor } from "../types";
import ui from "../components/ui.module.css";
interface PerfilProps{profesor:Profesor;onSaved:(p:Profesor)=>void;onLogout:()=>void}
export default function Perfil({profesor,onSaved,onLogout}:PerfilProps){
 const[usuario,setUsuario]=useState(profesor.usuario),[nombre,setNombre]=useState(profesor.nombre),[pin,setPin]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function guardar(){
  const u=usuario.trim(),n=nombre.trim();
  if(!u||!n){setMsg("El usuario y el nombre completo son obligatorios.");return}
  if(pin&&pin.length!==4){setMsg("El PIN debe tener 4 dígitos.");return}
  setBusy(true);setMsg("");
  const{data:dup}=await supabase.from("bano_profesores").select("id").ilike("usuario",u).neq("id",profesor.id).limit(1);
  if(dup?.length){setBusy(false);setMsg("Ese usuario ya está en uso.");return}
  const body:{usuario:string;nombre:string;pin?:string}={usuario:u,nombre:n};if(pin)body.pin=pin;
  const{error}=await supabase.from("bano_profesores").update(body).eq("id",profesor.id);
  setBusy(false);if(error){setMsg(error.message);return}onSaved({...profesor,usuario:u,nombre:n});
 }
 return <div className={ui.card}><h2 className={ui.cardTitle}>Mi perfil</h2>
  <div className={ui.field}><label htmlFor="pusuario">Usuario</label><input id="pusuario" value={usuario} onChange={e=>setUsuario(e.target.value)} autoComplete="username"/></div>
  <div className={ui.field}><label htmlFor="pnombre">Nombre completo del profesor</label><input id="pnombre" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Fernando Peza"/></div>
  <div className={ui.field}><label htmlFor="ppin">Nuevo PIN (déjalo vacío para no cambiarlo)</label><input id="ppin" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="••••" inputMode="numeric" maxLength={4}/></div>
  <button className={ui.btn+" "+ui.btnPrimary} onClick={guardar} disabled={busy}>Guardar</button>
  <button className={ui.btn+" "+ui.btnGhost} style={{width:"100%",marginTop:10}} onClick={onLogout}>Cerrar sesión</button>
  <p className={ui.errorMsg}>{msg}</p>
 </div>;
}
