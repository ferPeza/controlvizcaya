import React from "react";
import { useEffect,useState } from "react";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";
import Grupos from "./pages/Grupos";
import Alumnos from "./pages/Alumnos";
import GestionAlumnos from "./pages/GestionAlumnos";
import Horarios from "./pages/Horarios";
import Stats from "./pages/Stats";
import Monitor from "./pages/Monitor";
import type { Grupo,Profesor } from "./types";
import ui from "./components/ui.module.css";

type Vista="login"|"grupos"|"alumnos"|"gestionAlumnos"|"horarios"|"stats"|"perfil"|"monitor";
const STORAGE_KEY="bano_session";

export default function App(){
 const[profesor,setProfesor]=useState<Profesor|null>(null),[grupo,setGrupo]=useState<Grupo|null>(null),[vista,setVista]=useState<Vista>("login");
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(saved?.id&&saved?.nombre){setProfesor({...saved,rol:saved.rol??"profesor"});setVista(saved.rol==="monitor"?"monitor":"grupos")}}catch{}},[]);
 function login(p:Profesor){setProfesor(p);localStorage.setItem(STORAGE_KEY,JSON.stringify(p));setVista(p.rol==="monitor"?"monitor":"grupos")}
 function logout(){setProfesor(null);setGrupo(null);localStorage.removeItem(STORAGE_KEY);setVista("login")}
 function perfilGuardado(p:Profesor){setProfesor(p);localStorage.setItem(STORAGE_KEY,JSON.stringify(p));setVista(p.rol==="monitor"?"monitor":"grupos")}
 function elegirGrupo(g:Grupo){setGrupo(g);setVista("alumnos")}
 if(!profesor||vista==="login")return <Login onLogin={login}/>;
 const crumb=vista==="alumnos"&&grupo?<><button className={ui.crumbButton} onClick={()=>setVista("grupos")}>Mis grupos</button><span>›</span><span>{grupo.nombre}</span></>:vista==="stats"&&grupo?<><button className={ui.crumbButton} onClick={()=>setVista("alumnos")}>Grupo {grupo.nombre}</button><span>›</span><span>Estadísticas</span></>:null;
 const nav=profesor.rol==="monitor"
   ? [{key:"monitor" as Vista,label:"Monitor",icon:"▣"}]
   : [
      {key:"grupos" as Vista,label:"Mis grupos",icon:"▦"},
      {key:"gestionAlumnos" as Vista,label:"Alumnos",icon:"♙"},
      {key:"horarios" as Vista,label:"Horarios",icon:"◷"},
      {key:"stats" as Vista,label:"Estadísticas",icon:"▥"}
     ];
 return <Shell profesorNombre={profesor.nombre} rol={profesor.rol} active={vista} nav={nav} crumb={crumb} onNavigate={(v)=>setVista(v as Vista)} onGear={()=>setVista("perfil")} onLogout={logout}>
   {profesor.rol==="monitor" && vista==="monitor" && <Monitor profesor={profesor}/>}
   {vista==="perfil"&&<Perfil profesor={profesor} onSaved={perfilGuardado} onLogout={logout}/>}
   {profesor.rol==="profesor"&&vista==="grupos"&&<Grupos profesor={profesor} onSelect={elegirGrupo}/>}
   {profesor.rol==="profesor"&&vista==="gestionAlumnos"&&<GestionAlumnos profesor={profesor}/>}
   {profesor.rol==="profesor"&&vista==="horarios"&&<Horarios/>}
   {profesor.rol==="profesor"&&vista==="alumnos"&&grupo&&<><div className={ui.tabs}><button className={ui.tab+" "+ui.tabActive}>Alumnos</button><button className={ui.tab} onClick={()=>setVista("stats")}>Estadísticas</button></div><Alumnos grupo={grupo}/></>}
   {profesor.rol==="profesor"&&vista==="stats"&&<Stats profesor={profesor}/>}
 </Shell>;
}
