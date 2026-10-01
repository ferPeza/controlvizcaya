import React from "react";
import type { ReactNode } from "react";
import type { RolProfesor } from "../types";
import styles from "./Shell.module.css";

interface ShellNav { key:string; label:string; icon:string; }
interface ShellProps {
 profesorNombre?: string;
 rol?: RolProfesor;
 active?: string;
 nav?: ShellNav[];
 crumb?: ReactNode;
 onNavigate?:(key:string)=>void;
 onGear?:()=>void;
 onLogout?:()=>void;
 children:ReactNode;
}
export default function Shell({profesorNombre,rol,active,nav=[],crumb,onNavigate,onGear,onLogout,children}:ShellProps){
 return <>
  <aside className={styles.sidebar}>
   <div className={styles.brandBlock}><div className={styles.logo}>CS</div><div><strong>Control de salidas</strong><span>Panel escolar</span></div></div>
   <div className={styles.sideLabel}>NAVEGACIÓN</div>
   <nav className={styles.nav}>{nav.map(item=><button key={item.key} className={active===item.key?styles.navActive:styles.navItem} onClick={()=>onNavigate?.(item.key)}><span className={styles.navIcon}>{item.icon}</span>{item.label}</button>)}</nav>
   <div className={styles.sideSpacer}/>
   <div className={styles.account}>
    <div className={styles.avatar}>{(profesorNombre||"U").slice(0,1).toUpperCase()}</div>
    <div className={styles.accountText}><strong>{profesorNombre||"Usuario"}</strong><span>{rol==="monitor"?"Monitor":"Profesor"}</span></div>
    {onGear&&<button className={styles.settings} onClick={onGear} title="Mi perfil">⚙</button>}
   </div>
   {onLogout&&<button className={styles.sideLogout} onClick={onLogout}>↪ <span>Cerrar sesión</span></button>}
  </aside>
  <div className={styles.app}>
   <header className={styles.topbar}>
    <div className={styles.mobileBrand}><div className={styles.logo}>CS</div><strong>Control de salidas</strong></div>
    <div className={styles.topbarRight}>{profesorNombre&&<span>{profesorNombre}</span>}{onGear&&<button className={styles.mobileIcon} onClick={onGear}>⚙</button>}{onLogout&&<button className={styles.mobileLogout} onClick={onLogout}>Salir</button>}</div>
   </header>
   {crumb&&<div className={styles.crumb}>{crumb}</div>}
   <main className={styles.main}>{children}</main>
  </div>
 </>;
}