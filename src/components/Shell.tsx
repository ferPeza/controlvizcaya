import React from "react";
import type { ReactNode } from "react";
import styles from "./Shell.module.css";

interface ShellProps {
  profesorNombre?: string;
  crumb?: ReactNode;
  onGear?: () => void;
  onLogout?: () => void;
  children: ReactNode;
}

export default function Shell({ profesorNombre, crumb, onGear, onLogout, children }: ShellProps) {
  return (
    <>
      <header className={styles.appbar}>
        <div className={styles.appbarInner}>
          <p className={styles.brand}>
            Control de salidas<span className={styles.brandDot}>.</span>
          </p>
          {profesorNombre && <span className={styles.who}>{profesorNombre}</span>}
          {onLogout && <button className={styles.logout} onClick={onLogout} title="Cerrar sesión">Salir</button>}
          {onGear && (
            <button className={styles.gear} onClick={onGear} aria-label="Mi perfil" title="Mi perfil">
              ⚙
            </button>
          )}
        </div>
        {crumb && <div className={styles.crumb}>{crumb}</div>}
      </header>
      <main className={styles.main}>{children}</main>
    </>
  );
}
