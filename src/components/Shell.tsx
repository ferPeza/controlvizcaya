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
 const [mobileNavOpen,setMobileNavOpen]=useState(false);
 const nombreProfesor=(profesorNombre||"Profesor").trim();
 const inicial=nombreProfesor.slice(0,1).toUpperCase();
 const cerrarMenu=()=>setAccountOpen(false);
 const navegar=(key:string)=>{setMobileNavOpen(false);onNavigate?.(key)};
 const perfil=()=>{cerrarMenu();onGear?.()};
 const salir=()=>{cerrarMenu();onLogout?.()};
 return <>
  <button className={styles.mobileMenuButton} onClick={()=>setMobileNavOpen(v=>!v)} aria-label="Abrir menú">☰</button>
  {mobileNavOpen&&<button className={styles.mobileOverlay} aria-label="Cerrar menú" onClick={()=>setMobileNavOpen(false)} />}
  <aside className={mobileNavOpen?styles.sidebar+" "+styles.sidebarOpen:styles.sidebar}>
   <div className={styles.brandBlock}><div className={styles.logo}>CS</div><div><strong>Control Salidas</strong></div></div>
   <div className={styles.sideLabel}>NAVEGACIÓN</div>
   <nav className={styles.nav}>{nav.map(item=><button key={item.key} className={active===item.key?styles.navActive:styles.navItem} onClick={()=>navegar(item.key)}><span className={styles.navIcon}>{item.icon}</span>{item.label}</button>)}</nav>
  </aside>
  <div className={styles.app}>
   <header className={styles.topbar}>
    <div className={styles.mobileBrand}><div className={styles.logo}>CS</div><strong>Control Salidas</strong></div>
    <div className={styles.accountMenu}>
     <button className={styles.accountTrigger} onClick={()=>setAccountOpen(v=>!v)} aria-expanded={accountOpen} aria-haspopup="menu">
      <div className={styles.avatar}>{inicial}</div>
      <div className={styles.accountText}><strong>{nombreProfesor}</strong><span>{rol==="administrador"?"Administrador":rol==="monitor"?"Monitor":"Profesor"}</span></div>
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
