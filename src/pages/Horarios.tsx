import React,{useState} from "react";
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

const MIS_HORARIOS = [
  {dia:"Lunes", periodo:"6", hora:"11:40 AM - 12:30 PM", grupo:"2°C"},
  {dia:"Lunes", periodo:"7", hora:"12:30 PM - 1:20 PM", grupo:"3°C"},
  {dia:"Lunes", periodo:"8", hora:"1:20 PM - 2:10 PM", grupo:"3°D"},
  {dia:"Martes", periodo:"5", hora:"10:50 AM - 11:40 AM", grupo:"3°D"},
  {dia:"Martes", periodo:"6", hora:"11:40 AM - 12:30 PM", grupo:"3°A"},
  {dia:"Martes", periodo:"7", hora:"12:30 PM - 1:20 PM", grupo:"3°B"},
  {dia:"Martes", periodo:"8", hora:"1:20 PM - 2:10 PM", grupo:"2°C"},
  {dia:"Miércoles", periodo:"4", hora:"9:30 AM - 10:20 AM", grupo:"2°C"},
  {dia:"Miércoles", periodo:"5", hora:"10:50 AM - 11:40 AM", grupo:"3°A"},
  {dia:"Miércoles", periodo:"7", hora:"12:30 PM - 1:20 PM", grupo:"3°D"},
  {dia:"Miércoles", periodo:"8", hora:"1:20 PM - 2:10 PM", grupo:"3°C"},
  {dia:"Jueves", periodo:"8", hora:"1:20 PM - 2:10 PM", grupo:"3°B"},
  {dia:"Viernes", periodo:"6", hora:"11:40 AM - 12:30 PM", grupo:"3°A"},
  {dia:"Viernes", periodo:"7", hora:"12:30 PM - 1:20 PM", grupo:"3°B"},
  {dia:"Viernes", periodo:"8", hora:"1:20 PM - 2:10 PM", grupo:"3°C"},
];

const DIAS=["Lunes","Martes","Miércoles","Jueves","Viernes"];

export default function Horarios() {
  const [vista,setVista]=useState<"general"|"mios">("general");

  return (
    <div className={ui.dashboard}>
      <section className={ui.pageIntro}>
        <div>
          <h1 className={ui.pageTitle}>Horarios</h1>
        </div>
      </section>

      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        <button className={ui.btn+" "+(vista==="general"?ui.btnPrimary:ui.btnGhost)} onClick={()=>setVista("general")}>Horario escolar</button>
        <button className={ui.btn+" "+(vista==="mios"?ui.btnPrimary:ui.btnGhost)} onClick={()=>setVista("mios")}>Mis horarios</button>
      </div>

      {vista==="general" ? (
        <section className={ui.card}>
          <div className={ui.studentList}>
            {HORARIOS.map(([numero,hora])=>(
              <article className={ui.studentCard} key={numero}>
                <div className={ui.studentIdentity}>
                  <span className={ui.studentNumber}>{numero==="RECESO"?"—":numero}</span>
                  <div>
                    <div className={ui.studentName}>{numero==="RECESO"?"Receso":"Clase "+numero}</div>
                    <div className={ui.statusLine}>{hora}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className={ui.card}>
          <div className={ui.sectionHeader} style={{marginBottom:16}}>
            <div>
              <h2 className={ui.cardTitle}>Mis horarios</h2>
              <p className={ui.sectionHint}>Tecnología · 2°C, 3°A, 3°B, 3°C y 3°D</p>
            </div>
            <span className={ui.countBadge}>{MIS_HORARIOS.length} clases</span>
          </div>

          <div className={ui.tableWrap}>
            <table className={ui.statsTable}>
              <thead>
                <tr><th>Periodo</th><th>Hora</th>{DIAS.map(d=><th key={d}>{d}</th>)}</tr>
              </thead>
              <tbody>
                {HORARIOS.filter(([p])=>p!=="RECESO").map(([periodo,hora])=>{
                  const filas=DIAS.map(d=>MIS_HORARIOS.find(x=>x.dia===d&&x.periodo===periodo));
                  return (
                    <tr key={periodo}>
                      <td><strong>{periodo}</strong></td>
                      <td>{hora}</td>
                      {filas.map((f,i)=><td key={DIAS[i]}>{f?<span className={ui.groupBadge}>{f.grupo}</span>:"—"}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
