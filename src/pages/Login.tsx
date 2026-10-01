import React from "react";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profesor, RolProfesor } from "../types";
import styles from "./Login.module.css";

interface LoginProps { onLogin:(p:Profesor)=>void; }

export default function Login({onLogin}:LoginProps){
 const[nombre,setNombre]=useState(""),[pin,setPin]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function doLogin(){
  if(!nombre.trim()||!pin.trim()){setMsg("Escribe tu usuario y PIN.");return}
  setBusy(true);setMsg("");
  const{data,error}=await supabase.from("bano_profesores").select("id,nombre,pin,rol").ilike("nombre",nombre.trim()).limit(1);
  setBusy(false);if(error){setMsg(error.message);return}if(!data?.length){setMsg("No existe ese usuario. Usa Registrarme.");return}if(data[0].pin!==pin.trim()){setMsg("PIN incorrecto.");return}
  onLogin({id:data[0].id,nombre:data[0].nombre,rol:(data[0].rol??"profesor") as RolProfesor});
 }
 async function doRegister(){
  const n=nombre.trim(),p=pin.trim();if(!n||p.length!==4){setMsg("Escribe tu nombre y un PIN de 4 dígitos.");return}
  setBusy(true);setMsg("");
  const{data:existing,error:existErr}=await supabase.from("bano_profesores").select("id").ilike("nombre",n);
  if(existErr){setBusy(false);setMsg(existErr.message);return}if(existing?.length){setBusy(false);setMsg("Ese nombre ya existe. Usa Entrar.");return}
  const{data,error}=await supabase.from("bano_profesores").insert({nombre:n,pin:p,rol:"profesor"}).select("id,nombre,rol").single();
  setBusy(false);if(error){setMsg(error.message);return}onLogin({id:data.id,nombre:data.nombre,rol:(data.rol??"profesor") as RolProfesor});
 }
 return <div className={styles.loginPage}>
  <section className={styles.welcome}>
   <div className={styles.welcomeOrb}>CS</div>
   <div className={styles.welcomeContent}>
    <span className={styles.eyebrow}>CONTROL ESCOLAR</span>
    <h1>Control Salidas</h1>
    <p>Registra y monitorea de forma sencilla las salidas de los alumnos.</p>
   </div>
   <div className={styles.welcomeFooter}>Acceso para profesores y monitores</div>
  </section>
  <main className={styles.formSide}>
   <div className={styles.formWrap}>
    <div className={styles.mobileBrand}><span className={styles.mobileLogo}>CS</span><strong>Control Salidas</strong></div>
    <div className={styles.formHeader}>
     <span className={styles.formEyebrow}>BIENVENIDO</span>
     <h2>Iniciar sesión</h2>
     <p>Ingresa tus datos para continuar.</p>
    </div>
    <div className={styles.field}>
     <label htmlFor="nombre">Usuario</label>
     <input id="nombre" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Fernando" autoComplete="username"/>
    </div>
    <div className={styles.field}>
     <label htmlFor="pin">PIN</label>
     <input id="pin" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="4 dígitos" inputMode="numeric" maxLength={4} autoComplete="current-password"/>
    </div>
    <button className={styles.primaryButton} onClick={doLogin} disabled={busy}>{busy?"Entrando…":"Entrar"}</button>
    <div className={styles.divider}><span>o</span></div>
    <p className={styles.helper}>¿No tienes cuenta? Crea una con tu nombre y un PIN de 4 dígitos.</p>
    <button className={styles.secondaryButton} onClick={doRegister} disabled={busy}>Registrarme</button>
    {msg&&<p className={styles.errorMsg}>{msg}</p>}
   </div>
  </main>
 </div>;
}
