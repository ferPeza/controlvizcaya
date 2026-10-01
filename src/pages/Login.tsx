import React from "react";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profesor, RolProfesor } from "../types";
import styles from "./Login.module.css";

interface LoginProps { onLogin:(p:Profesor)=>void; }

export default function Login({onLogin}:LoginProps){
 const[usuario,setUsuario]=useState(""),[pin,setPin]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function doLogin(){
  const u=usuario.trim();
  if(!u||!pin.trim()){setMsg("Escribe el usuario y PIN.");return}
  setBusy(true);setMsg("");
  const{data,error}=await supabase.from("bano_profesores").select("id,nombre,usuario,pin,rol").ilike("usuario",u).limit(1);
  setBusy(false);if(error){setMsg(error.message);return}if(!data?.length){setMsg("No existe ese usuario. Usa Registrarme.");return}if(data[0].pin!==pin.trim()){setMsg("PIN incorrecto.");return}
  onLogin({id:data[0].id,nombre:data[0].nombre,usuario:data[0].usuario,rol:(data[0].rol??"profesor") as RolProfesor});
 }
 return <div className={styles.loginPage}>
  <section className={styles.welcome}>
   <div className={styles.welcomeContent}>
    <h1>Control Salidas</h1>
    <p>Registra y monitorea de forma sencilla las salidas de los alumnos.</p>
   </div>
   <div className={styles.welcomeFooter}>Acceso para profesores y monitores</div>
  </section>
  <main className={styles.formSide}>
   <div className={styles.formWrap}>
    <img className={styles.mobileEmblem} src="/vizcaya-ave.svg" alt="Emblema Vizcaya" />
    <div className={styles.formHeader}>
     <span className={styles.formEyebrow}>BIENVENIDO</span>
     <h2>Iniciar sesión</h2>
    </div>
    <div className={styles.field}><label htmlFor="usuario">Usuario</label><input id="usuario" value={usuario} onChange={e=>setUsuario(e.target.value)} placeholder="Ej. fpeza" autoComplete="username"/></div>
    <div className={styles.field}><label htmlFor="pin">PIN</label><input id="pin" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="4 dígitos" inputMode="numeric" maxLength={4} autoComplete="current-password"/></div>
    <button className={styles.primaryButton} onClick={doLogin} disabled={busy}>{busy?"Entrando…":"Entrar"}</button>
    {msg&&<p className={styles.errorMsg}>{msg}</p>}
   </div>
  </main>
 </div>;
}
