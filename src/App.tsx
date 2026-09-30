import React from "react";
import { useEffect,useState } from "react";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";
import Grupos from "./pages/Grupos";
import Alumnos from "./pages/Alumnos";
import Stats from "./pages/Stats";
import Monitor from "./pages/Monitor";
import type { Grupo,Profesor } from "./types";
import ui from "./components/ui.module.css";
type Vista="login"|"grupos"|"alumnos"|"stats"|"perfil"|"monitor";
const STORAGE_KEY="bano_session";
export default function App(){
 const[profesor,setProfesor]=useState<Profesor|null>(null),[grupo,setGrupo]=useState<Grupo|null>(null),[vista,setVista]=useState<Vista>("login");
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(saved?.id&&saved?.nombre){setProfesor({...saved,rol:saved.rol??"profesor"});setVista(saved.rol==="monitor"?"monitor":"grupos")}}catch{}},[]);
 function login(p:Profesor){setProfesor(p);localStorage.setItem(STORAGE_KEY,JSON.stringify(p));setVista(p.rol==="monitor"?"monitor":"grupos")}
 function logout(){setProfesor(null);setGrupo(null);localStorage.removeItem(STORAGE_KEY);setVista("login")}
 function perfilGuardado(p:Profesor){setProfesor(p);localStorage.setItem(STORAGE_KEY,JSON.stringify(p));setVista(p.rol==="monitor"?"monitor":"grupos")}
 function elegirGrupo(g:Grupo){setGrupo(g);setVista("alumnos")}
 if(!profesor||vista==="login")return <Shell><Login onLogin={login}/></Shell>;
 const crumb=vista==="monitor"?null:vista==="perfil"?"Mi perfil":vista==="grupos"?null:vista==="alumnos"&&grupo?<><span className={ui.crumbLink} onClick={()=>setVista("grupos")}>Mis grupos</span><span>›</span><span>{grupo.nombre}</span></>:vista==="stats"?<span className={ui.crumbLink} onClick={()=>setVista(grupo?"alumnos":"grupos")}>‹ Volver</span>:null;
 return <Shell profesorNombre={profesor.nombre} crumb={crumb} onGear={()=>setVista("perfil")}>{profesor.rol==="monitor"?<Monitor profesor={profesor}/>:<>
 {vista==="perfil"&&<Perfil profesor={profesor} onSaved={perfilGuardado} onLogout={logout}/>}
 {vista==="grupos"&&<Grupos profesor={profesor} onSelect={elegirGrupo}/>}
 {vista==="alumnos"&&grupo&&<><div className={ui.tabs}><button className={`${ui.tab} ${ui.tabActive}`}>Alumnos</button><button className={ui.tab} onClick={()=>setVista("stats")}>Estadísticas</button></div><Alumnos grupo={grupo}/></>}
 {vista==="stats"&&<Stats profesor={profesor}/>}</>}</Shell>;
}