import React from "react";
import ui from "../components/ui.module.css";

const HORARIOS = [
  ["1", "7:00 AM - 7:50 AM"],
  ["2", "7:50 AM - 8:40 AM"],
  ["3", "8:40 AM - 9:30 AM"],
  ["4", "9:30 AM - 10:20 AM"],
  ["RECESO", "10:20 AM - 10:50 AM"],
  ["5", "10:50 AM - 11:40 AM"],
  ["6", "11:40 AM - 12:30 PM"],
  ["7", "12:30 PM - 1:20 PM"],
  ["8", "1:20 PM - 2:10 PM"],
] as const;

export default function Horarios() {
  return (
    <div className={ui.dashboard}>
      <section className={ui.pageIntro}>
        <div>
          <span className={ui.eyebrow}>CONTROL ESCOLAR</span>
          <h1 className={ui.pageTitle}>Horarios</h1>
          <p className={ui.pageSubtitle}>Periodos de clase y receso de la jornada escolar.</p>
        </div>
      </section>

      <section className={ui.card}>
        <div className={ui.studentList}>
          {HORARIOS.map(([numero, hora]) => (
            <article className={ui.studentCard} key={numero}>
              <div className={ui.studentIdentity}>
                <span className={ui.studentNumber}>{numero === "RECESO" ? "—" : numero}</span>
                <div>
                  <div className={ui.studentName}>{numero === "RECESO" ? "Receso" : "Clase " + numero}</div>
                  <div className={ui.statusLine}>{hora}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
