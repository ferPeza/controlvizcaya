import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Alumno, Grupo, Profesor } from "../types";
import ui from "../components/ui.module.css";

interface GestionAlumnosProps { profesor: Profesor; }

export default function GestionAlumnos({ profesor }: GestionAlumnosProps) {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [nuevo, setNuevo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busy, setBusy] = useState(false);

  async function cargarGrupos() {
    const { data } = await supabase
      .from("bano_profesor_grupos")
      .select("grupo_id,bano_grupos(id,nombre)")
      .eq("profesor_id", profesor.id);

    const lista = (data ?? [])
      .map((row: any) => row.bano_grupos as Grupo | null)
      .filter((g): g is Grupo => !!g)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    setGrupos(lista);
    if (!grupo && lista.length) setGrupo(lista[0]);
  }

  async function cargarAlumnos(grupoId: string) {
    setCargando(true);
    const { data } = await supabase
      .from("bano_alumnos")
      .select("id,nombre,grupo_id")
      .eq("grupo_id", grupoId)
      .order("nombre", { ascending: true });
    setAlumnos(data ?? []);
    setCargando(false);
  }

  useEffect(() => { void cargarGrupos(); }, [profesor.id]);
  useEffect(() => {
    if (grupo) void cargarAlumnos(grupo.id);
  }, [grupo?.id]);

  async function agregar() {
    const nombre = nuevo.trim();
    if (!nombre || !grupo) return;
    setBusy(true);
    const { error } = await supabase
      .from("bano_alumnos")
      .insert({ nombre, grupo_id: grupo.id });
    if (!error) {
      setNuevo("");
      await cargarAlumnos(grupo.id);
    }
    setBusy(false);
  }

  async function eliminar(alumno: Alumno) {
    if (!confirm("¿Eliminar a " + alumno.nombre + "? Se borrará también su historial de salidas.")) return;
    await supabase.from("bano_alumnos").delete().eq("id", alumno.id);
    if (grupo) await cargarAlumnos(grupo.id);
  }

  return (
    <div className={ui.dashboard}>
      <section className={ui.pageIntro}>
        <div>
          <span className={ui.eyebrow}>CONTROL ESCOLAR</span>
          <h1 className={ui.pageTitle}>Alumnos</h1>
          <p className={ui.pageSubtitle}>Administra los alumnos de tus grupos.</p>
        </div>
        <div className={ui.countBadge}>{alumnos.length} alumnos</div>
      </section>

      <section className={ui.card}>
        <div className={ui.pageIntro}>
          <div>
            <h2 className={ui.addTitle}>Selecciona un grupo</h2>
            <p className={ui.sectionHint}>Consulta, agrega o elimina alumnos desde este apartado.</p>
          </div>
        </div>
        <div className={ui.groupDashboardGrid}>
          {grupos.map((g) => (
            <button
              key={g.id}
              className={ui.groupTile}
              onClick={() => setGrupo(g)}
              style={{ outline: grupo?.id === g.id ? "3px solid rgba(37,99,235,.22)" : undefined }}
            >
              <span className={ui.groupTileIcon}>▦</span>
              <span className={ui.groupTileInfo}><strong>{g.nombre}</strong><small>Grupo escolar</small></span>
              <span className={ui.groupTileArrow}>›</span>
            </button>
          ))}
        </div>
      </section>

      {grupo && (
        <>
          <section className={ui.pageIntro}>
            <div>
              <span className={ui.eyebrow}>GRUPO</span>
              <h2 className={ui.pageTitle}>{grupo.nombre}</h2>
            </div>
          </section>

          {cargando ? (
            <div className={ui.card}><p className={ui.empty}>Cargando alumnos…</p></div>
          ) : (
            <div className={ui.studentList}>
              {alumnos.map((alumno, index) => (
                <article className={ui.studentCard} key={alumno.id}>
                  <div className={ui.studentIdentity}>
                    <span className={ui.studentNumber}>{index + 1}</span>
                    <div className={ui.studentName}>{alumno.nombre}</div>
                  </div>
                  <button className={ui.deleteButton} onClick={() => eliminar(alumno)} title="Eliminar alumno" aria-label={"Eliminar " + alumno.nombre}>×</button>
                </article>
              ))}
              {!alumnos.length && <div className={ui.card}><p className={ui.empty}>Este grupo todavía no tiene alumnos.</p></div>}
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
              <button className={ui.btn + " " + ui.btnPrimary} onClick={agregar} disabled={busy}>
                {busy ? "Agregando…" : "Agregar alumno"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
