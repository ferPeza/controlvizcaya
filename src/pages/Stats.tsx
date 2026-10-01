import React from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profesor } from "../types";
import ui from "../components/ui.module.css";

interface StatsProps {
  profesor: Profesor;
}

type Periodo = "semana" | "mes" | "trimestre";
type FiltroMotivo = "todos" | "salio" | "tutor" | "psicologa" | "coordinacion";
type Motivo = Exclude<FiltroMotivo, "todos">;

interface Fila {
  nombre: string;
  grupo: string;
  veces: number;
  minutos: number;
}

const MOTIVOS: Array<{ key: FiltroMotivo; label: string; className: string }> = [
  { key: "todos", label: "Todos", className: ui.filterAll },
  { key: "salio", label: "Salió", className: ui.filterOut },
  { key: "tutor", label: "Tutor", className: ui.filterTutor },
  { key: "psicologa", label: "Psicóloga", className: ui.filterPsicologa },
  { key: "coordinacion", label: "Coordinación", className: ui.filterCoordinacion },
];

const MOTIVO_LABEL: Record<Motivo, string> = {
  salio: "Salió",
  tutor: "Tutor",
  psicologa: "Psicóloga",
  coordinacion: "Coordinación",
};

export default function Stats({ profesor }: StatsProps) {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [motivo, setMotivo] = useState<FiltroMotivo>("todos");
  const [grupoFiltro, setGrupoFiltro] = useState("todos");
  const [grupos, setGrupos] = useState<Array<{id:string;nombre:string}>>([]);
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [sinGrupos, setSinGrupos] = useState(false);
  const [totalSalidas, setTotalSalidas] = useState(0);
  const [alumnosActivos, setAlumnosActivos] = useState(0);
  const [minutosTotales, setMinutosTotales] = useState(0);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, motivo, grupoFiltro, profesor.id]);

  async function cargar() {
    setFilas(null);
    const { data: links } = await supabase
      .from("bano_profesor_grupos")
      .select("grupo_id")
      .eq("profesor_id", profesor.id);

    const grupoIds = (links ?? []).map((l) => l.grupo_id);
    const idsConNombre = (links ?? []).map((l:any) => l.grupo_id);
    if (idsConNombre.length) {
      const { data: gs } = await supabase.from("bano_grupos").select("id,nombre").in("id", idsConNombre);
      setGrupos((gs ?? []).sort((a,b) => a.nombre.localeCompare(b.nombre)));
    } else setGrupos([]);
    if (!grupoIds.length) {
      setSinGrupos(true);
      setFilas([]);
      setTotalSalidas(0);
      setAlumnosActivos(0);
      setMinutosTotales(0);
      return;
    }

    setSinGrupos(false);
    const dias = periodo === "semana" ? 7 : periodo === "mes" ? 30 : 90;
    const since = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

    const { data: rows } = await supabase
      .from("bano_registros")
      .select("id,salida,regreso,motivo,bano_alumnos(nombre,grupo_id,bano_grupos(nombre))")
      .gte("salida", since)
      .order("salida", { ascending: false });

    const agg: Record<string, Fila> = {};
    let total = 0;
    let mins = 0;
    const activos = new Set<string>();

    (rows ?? []).forEach((r: any) => {
      const al = r.bano_alumnos;
      if (!al || !grupoIds.includes(al.grupo_id)) return;
      if (grupoFiltro !== "todos" && al.grupo_id !== grupoFiltro) return;

      const m = (r.motivo ?? "salio") as Motivo;
      if (motivo !== "todos" && m !== motivo) return;

      total++;
      activos.add(al.nombre + "|" + al.grupo_id);

      if (r.regreso) {
        mins += Math.max(0, (new Date(r.regreso).getTime() - new Date(r.salida).getTime()) / 60000);
      }

      const key = al.bano_grupos.nombre + "|" + al.nombre;
      if (!agg[key]) {
        agg[key] = { nombre: al.nombre, grupo: al.bano_grupos.nombre, veces: 0, minutos: 0 };
      }
      agg[key].veces++;
      if (r.regreso) {
        agg[key].minutos += Math.max(
          0,
          (new Date(r.regreso).getTime() - new Date(r.salida).getTime()) / 60000
        );
      }
    });

    setTotalSalidas(total);
    setAlumnosActivos(activos.size);
    setMinutosTotales(mins);
    setFilas(Object.values(agg).sort((a, b) => b.veces - a.veces || a.nombre.localeCompare(b.nombre)));
  }

  const promedio = useMemo(
    () => (totalSalidas && minutosTotales ? Math.round(minutosTotales / totalSalidas) : 0),
    [totalSalidas, minutosTotales]
  );

  return (
    <div className={ui.dashboard}>
      <section className={ui.pageIntro}>
        <div>
          <h1 className={ui.pageTitle}>Estadísticas</h1>
        </div>
      </section>

      <section className={ui.statsGrid}>
        <div className={ui.statCard}>
          <span className={ui.statLabel}>Salidas</span>
          <strong className={ui.statValue}>{filas === null ? "—" : totalSalidas}</strong>
          <span className={ui.statHint}>{periodo === "semana" ? "Últimos 7 días" : periodo === "mes" ? "Últimos 30 días" : "Últimos 90 días"}</span>
        </div>
        <div className={ui.statCard}>
          <span className={ui.statLabel}>Alumnos</span>
          <strong className={ui.statValue}>{filas === null ? "—" : alumnosActivos}</strong>
          <span className={ui.statHint}>Con al menos una salida</span>
        </div>
        <div className={ui.statCard}>
          <span className={ui.statLabel}>Tiempo promedio</span>
          <strong className={ui.statValue}>{filas === null ? "—" : promedio ? `${promedio} min` : "—"}</strong>
          <span className={ui.statHint}>Por salida registrada</span>
        </div>
      </section>

      <section className={ui.card}>
        <div className={ui.sectionHeader}>
          <div>
            <h2 className={ui.cardTitle}>Resumen de salidas</h2>
            <p className={ui.sectionHint}>Selecciona un periodo y un motivo.</p>
          </div>
        </div>

        <div className={ui.filterBlock}>
          <span className={ui.filterLabel}>Periodo</span>
          <div className={ui.filterGroup}>
            {(["semana", "mes", "trimestre"] as Periodo[]).map((p) => (
              <button
                key={p}
                className={`${ui.filterButton} ${periodo === p ? ui.filterButtonActive : ""}`}
                onClick={() => setPeriodo(p)}
              >
                {p === "semana" ? "7 días" : p === "mes" ? "30 días" : "90 días"}
              </button>
            ))}
          </div>
        </div>

        <div className={ui.filterBlock}>
          <span className={ui.filterLabel}>Grupo</span>
          <div className={ui.filterGroup}>
            <select className={ui.filterSelect} value={grupoFiltro} onChange={(e) => setGrupoFiltro(e.target.value)}>
              <option value="todos">Todos los grupos</option>
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className={ui.filterBlock}>
          <span className={ui.filterLabel}>Motivo de salida</span>
          <div className={ui.filterGroup + " " + ui.filterGroupWrap}>
            {MOTIVOS.map((m) => (
              <button
                key={m.key}
                className={`${ui.filterButton} ${m.className} ${motivo === m.key ? ui.filterSelected : ""}`}
                onClick={() => setMotivo(m.key)}
              >
                <span className={ui.filterDot} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {filas === null ? (
          <p className={ui.empty}>Cargando estadísticas…</p>
        ) : sinGrupos ? (
          <p className={ui.empty}>No tienes grupos todavía.</p>
        ) : filas.length === 0 ? (
          <p className={ui.empty}>No hay salidas con este filtro en el periodo seleccionado.</p>
        ) : (
          <div className={ui.tableWrap}>
            <table className={ui.statsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Alumno</th>
                  <th>Grupo</th>
                  <th>Salidas</th>
                  <th>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={f.grupo + f.nombre}>
                    <td className={ui.rankNum}>{i + 1}</td>
                    <td className={ui.studentCell}>{f.nombre}</td>
                    <td><span className={ui.groupBadge}>{f.grupo}</span></td>
                    <td><strong>{f.veces}</strong></td>
                    <td>{f.minutos > 0 ? `${Math.round(f.minutos / f.veces)} min` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
