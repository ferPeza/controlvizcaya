import React, { useState } from "react";
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
 const [accountOpen,setAccountOpen]=useState(false);
 const inicial=(profesorNombre||"U").slice(0,1).toUpperCase();
 const cerrarMenu=()=>setAccountOpen(false);
 const perfil=()=>{cerrarMenu();onGear?.()};
 const salir=()=>{cerrarMenu();onLogout?.()};
 return <>
  <aside className={styles.sidebar}>
   <div className={styles.brandBlock}><div className={styles.logo}>CS</div><div><strong>Control Salidas</strong></div></div>
   <div className={styles.sideLabel}>NAVEGACIÓN</div>
   <nav className={styles.nav}>{nav.map(item=><button key={item.key} className={active===item.key?styles.navActive:styles.navItem} onClick={()=>onNavigate?.(item.key)}><span className={styles.navIcon}>{item.icon}</span>{item.label}</button>)}</nav>
  </aside>
  <div className={styles.app}>
   <header className={styles.topbar}>
    <div className={styles.mobileBrand}><div className={styles.logo}>CS</div><strong>Control Salidas</strong></div>
    <div className={styles.accountMenu}>
     <button className={styles.accountTrigger} onClick={()=>setAccountOpen(v=>!v)} aria-expanded={accountOpen} aria-haspopup="menu">
      <div className={styles.avatar}>{inicial}</div>
      <div className={styles.accountText}><strong>{profesorNombre||"Usuario"}</strong><span>{rol==="monitor"?"Monitor":"Profesor"}</span></div>
      <span className={styles.accountChevron}>⌄</span>
     </button>
     {accountOpen&&<div className={styles.accountDropdown} role="menu">
      {onGear&&<button onClick={perfil} role="menuitem"><span>⚙</span> Configuración</button>}
      {onLogout&&<button className={styles.dropdownLogout} onClick={salir} role="menuitem"><span>↪</span> Cerrar sesión</button>}
     </div>}
    </div>
   </header>
   {crumb&&<div className={styles.crumb}>{crumb}</div>}
   <main className={styles.main}>{children}</main>
  </div>
 </>;
}
