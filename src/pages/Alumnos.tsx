import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Alumno, Grupo, Registro } from "../types";
import ui from "../components/ui.module.css";

interface AlumnosProps {
  grupo: Grupo;
}

type MotivoSalida = "salio" | "tutor" | "psicologa" | "coordinacion";

const MOTIVOS: Array<{ key: MotivoSalida; label: string; className: string; short: string }> = [
  { key: "salio", label: "Baño", className: ui.btnOut, short: "Baño" },
  { key: "tutor", label: "Tutor", className: ui.btnTutor, short: "Tutor" },
  { key: "psicologa", label: "Psicóloga", className: ui.btnPsicologa, short: "Psicóloga" },
  { key: "coordinacion", label: "Coordinación", className: ui.btnCoordinacion, short: "Coordinación" },
];

const MOTIVO_LABEL: Record<MotivoSalida, string> = {
  salio: "Baño",
  tutor: "Tutor",
  psicologa: "Psicóloga",
  coordinacion: "Coordinación",
};

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
        .select("id,alumno_id,salida,regreso,motivo")
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
    if (!confirm("¿Eliminar a " + a.nombre + "? Se borrará también su historial de baño.")) return;
    await supabase.from("bano_alumnos").delete().eq("id", a.id);
    cargar();
  }

  async function salir(a: Alumno, motivo: MotivoSalida) {
    await supabase.from("bano_registros").insert({ alumno_id: a.id, motivo });
    cargar();
  }

  async function regresar(reg: Registro) {
    await supabase.from("bano_registros").update({ regreso: new Date().toISOString() }).eq("id", reg.id);
    cargar();
  }

  return (
    <div className={ui.dashboard}>
      <section className={ui.pageIntro}>
        <div>
          <span className={ui.eyebrow}>GRUPO</span>
          <h1 className={ui.pageTitle}>{grupo.nombre}</h1>
          <p className={ui.pageSubtitle}>Registra y consulta las salidas de tus alumnos.</p>
        </div>
        {alumnos && <div className={ui.countBadge}>{alumnos.length} alumnos</div>}
      </section>

      {alumnos === null ? (
        <div className={ui.card}><p className={ui.empty}>Cargando alumnos…</p></div>
      ) : alumnos.length === 0 ? (
        <div className={ui.card}><p className={ui.empty}>Sin alumnos todavía. Agrega la lista abajo.</p></div>
      ) : (
        <div className={ui.studentList}>
          {alumnos.map((a, index) => {
            const reg = ultimos[a.id];
            const afuera = !!(reg && !reg.regreso);
            const motivo = (reg?.motivo as MotivoSalida | undefined) ?? "salio";

            return (
              <article className={`${ui.studentCard} ${afuera ? ui.studentCardOut : ""}`} key={a.id}>
                <div className={ui.studentIdentity}>
                  <span className={`${ui.studentNumber} ${afuera ? ui.studentNumberOut : ""}`}>{index + 1}</span>
                  <div>
                    <div className={ui.studentName}>{a.nombre}</div>
                    {afuera && reg && (
                      <div className={ui.statusLine}>
                        <span className={ui.liveDot} />
                        {MOTIVO_LABEL[motivo]} · Fuera desde {fmtHora(reg.salida)}
                      </div>
                    )}
                    {!afuera && reg?.regreso && (
                      <div className={ui.statusLine}>
                        Última salida: {MOTIVO_LABEL[motivo]} · {fmtHora(reg.salida)} → {fmtHora(reg.regreso)}
                      </div>
                    )}
                  </div>
                </div>

                <div className={ui.studentActions}>
                  <div className={ui.actionLabel}>Registrar salida</div>
                  <div className={ui.exitButtons}>
                    {MOTIVOS.map((m) => (
                      <button
                        key={m.key}
                        className={ui.btn + " " + m.className}
                        disabled={afuera}
                        onClick={() => salir(a, m.key)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={ui.studentControls}>
                  <button className={ui.returnButton} disabled={!afuera} onClick={() => reg && regresar(reg)}>
                    {afuera ? "✓ Regresó" : "Regresó"}
                  </button>
                  <button className={ui.deleteButton} onClick={() => eliminar(a)} title="Eliminar alumno" aria-label={"Eliminar " + a.nombre}>
                    ×
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className={ui.addPanel}>
        <div>
          <h2 className={ui.addTitle}>Agregar alumno</h2>
          <p className={ui.sectionHint}>Añade un alumno al grupo {grupo.nombre}.</p>
        </div>
        <div className={ui.addRow}>
          <input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Nombre completo del alumno"
            onKeyDown={(e) => e.key === "Enter" && agregar()}
          />
          <button className={ui.btn + " " + ui.btnPrimary} onClick={agregar}>
            Agregar alumno
          </button>
        </div>
      </section>
    </div>
  );
}
