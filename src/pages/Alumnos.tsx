import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Alumno, Grupo, Registro } from "../types";
import ui from "../components/ui.module.css";

interface AlumnosProps {
  grupo: Grupo;
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export default function Alumnos({ grupo }: AlumnosProps) {
  const [alumnos, setAlumnos] = useState<Alumno[] | null>(null);
  const [ultimos, setUltimos] = useState<Record<string, Registro>>({});
  const [nuevo, setNuevo] = useState("");

  async function cargar() {
    const { data: alData } = await supabase
      .from("bano_alumnos")
      .select("id,nombre,grupo_id")
      .eq("grupo_id", grupo.id)
      .order("nombre", { ascending: true });
    const lista = alData ?? [];
    setAlumnos(lista);
    if (lista.length) {
      const ids = lista.map((a) => a.id);
      const { data: regData } = await supabase
        .from("bano_registros")
        .select("id,alumno_id,salida,regreso")
        .in("alumno_id", ids)
        .order("salida", { ascending: false });
      const map: Record<string, Registro> = {};
      (regData ?? []).forEach((r) => {
        if (!map[r.alumno_id]) map[r.alumno_id] = r;
      });
      setUltimos(map);
    } else {
      setUltimos({});
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupo.id]);

  async function agregar() {
    const nombre = nuevo.trim();
    if (!nombre) return;
    await supabase.from("bano_alumnos").insert({ nombre, grupo_id: grupo.id });
    setNuevo("");
    cargar();
  }

  async function eliminar(a: Alumno) {
    if (!confirm(`¿Eliminar a ${a.nombre}? Se borrará también su historial de baño.`)) return;
    await supabase.from("bano_alumnos").delete().eq("id", a.id);
    cargar();
  }

  async function salir(a: Alumno) {
    await supabase.from("bano_registros").insert({ alumno_id: a.id });
    cargar();
  }

  async function regresar(reg: Registro) {
    await supabase.from("bano_registros").update({ regreso: new Date().toISOString() }).eq("id", reg.id);
    cargar();
  }

  return (
    <div className={ui.card}>
      <h2 className={ui.cardTitle}>{grupo.nombre}</h2>
      {alumnos === null ? (
        <p className={ui.empty}>Cargando…</p>
      ) : alumnos.length === 0 ? (
        <p className={ui.empty}>Sin alumnos todavía. Agrega la lista abajo.</p>
      ) : (
        <div className={ui.list}>
          {alumnos.map((a) => {
            const reg = ultimos[a.id];
            const afuera = !!(reg && !reg.regreso);
            return (
              <div className={ui.row} key={a.id}>
                <span className={`${ui.dot} ${afuera ? ui.dotOut : reg?.regreso ? ui.dotOk : ""}`} />
                <div className={ui.rowMain}>
                  <div className={ui.rowName}>{a.nombre}</div>
                  {afuera && reg && <div className={ui.rowSub}>Fuera desde {fmtHora(reg.salida)}</div>}
                  {!afuera && reg?.regreso && (
                    <div className={ui.rowSub}>
                      Salió {fmtHora(reg.salida)} · Regresó {fmtHora(reg.regreso)} ·{" "}
                      {Math.max(0, Math.round((new Date(reg.regreso).getTime() - new Date(reg.salida).getTime()) / 60000))} min
                    </div>
                  )}
                </div>
                <button className={`${ui.btn} ${ui.btnOut}`} disabled={afuera} onClick={() => salir(a)}>
                  Salió
                </button>
                <button className={`${ui.btn} ${ui.btnOk}`} disabled={!afuera} onClick={() => reg && regresar(reg)}>
                  Regresó
                </button>
                <button className={`${ui.btn} ${ui.btnIcon}`} onClick={() => eliminar(a)} title="Eliminar alumno">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className={ui.addRow}>
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Nombre del alumno"
          onKeyDown={(e) => e.key === "Enter" && agregar()}
        />
        <button className={`${ui.btn} ${ui.btnGhost}`} onClick={agregar}>
          Agregar
        </button>
      </div>
    </div>
  );
}
