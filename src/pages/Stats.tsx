import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profesor } from "../types";
import ui from "../components/ui.module.css";

interface StatsProps {
  profesor: Profesor;
}

type Periodo = "semana" | "mes" | "trimestre";

interface Fila {
  nombre: string;
  grupo: string;
  veces: number;
  minutos: number;
}

export default function Stats({ profesor }: StatsProps) {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [sinGrupos, setSinGrupos] = useState(false);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, profesor.id]);

  async function cargar() {
    setFilas(null);
    const { data: links } = await supabase
      .from("bano_profesor_grupos")
      .select("grupo_id")
      .eq("profesor_id", profesor.id);
    const grupoIds = (links ?? []).map((l) => l.grupo_id);
    if (!grupoIds.length) {
      setSinGrupos(true);
      setFilas([]);
      return;
    }
    setSinGrupos(false);
    const dias = periodo === "semana" ? 7 : periodo === "mes" ? 30 : 90;
    const since = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows } = await supabase
      .from("bano_registros")
      .select("id,salida,regreso,bano_alumnos(nombre,grupo_id,bano_grupos(nombre))")
      .gte("salida", since)
      .order("salida", { ascending: false });

    const agg: Record<string, Fila> = {};
    (rows ?? []).forEach((r: any) => {
      const al = r.bano_alumnos;
      if (!al || !grupoIds.includes(al.grupo_id)) return;
      const key = al.bano_grupos.nombre + "|" + al.nombre;
      if (!agg[key]) agg[key] = { nombre: al.nombre, grupo: al.bano_grupos.nombre, veces: 0, minutos: 0 };
      agg[key].veces++;
      if (r.regreso) {
        agg[key].minutos += (new Date(r.regreso).getTime() - new Date(r.salida).getTime()) / 60000;
      }
    });
    setFilas(Object.values(agg).sort((a, b) => b.veces - a.veces));
  }

  return (
    <div className={ui.card}>
      <h2 className={ui.cardTitle}>Salidas al baño (mis grupos)</h2>
      <div className={ui.tabs}>
        {(["semana", "mes", "trimestre"] as Periodo[]).map((p) => (
          <button
            key={p}
            className={`${ui.tab} ${periodo === p ? ui.tabActive : ""}`}
            onClick={() => setPeriodo(p)}
          >
            {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      {filas === null ? (
        <p className={ui.empty}>Cargando…</p>
      ) : sinGrupos ? (
        <p className={ui.empty}>No tienes grupos todavía.</p>
      ) : filas.length === 0 ? (
        <p className={ui.empty}>Sin registros en este periodo.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Alumno</th>
              <th>Grupo</th>
              <th>Veces</th>
              <th>Min. prom.</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={f.grupo + f.nombre}>
                <td className={ui.rankNum}>{i + 1}</td>
                <td>{f.nombre}</td>
                <td>{f.grupo}</td>
                <td>{f.veces}</td>
                <td>{f.minutos > 0 ? Math.round(f.minutos / f.veces) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
