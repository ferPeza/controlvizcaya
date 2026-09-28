import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Grupo, Profesor } from "../types";
import ui from "../components/ui.module.css";

interface GruposProps {
  profesor: Profesor;
  onSelect: (g: Grupo) => void;
}

export default function Grupos({ profesor, onSelect }: GruposProps) {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [nuevo, setNuevo] = useState("");
  const [busy, setBusy] = useState(false);

  async function cargar() {
    const { data } = await supabase
      .from("bano_profesor_grupos")
      .select("grupo_id, bano_grupos(id,nombre)")
      .eq("profesor_id", profesor.id);
    const list = (data ?? [])
      .map((row: any) => row.bano_grupos as Grupo | null)
      .filter((g): g is Grupo => !!g)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    setGrupos(list);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesor.id]);

  async function agregar() {
    const nombre = nuevo.trim();
    if (!nombre) return;
    setBusy(true);
    let grupoId: string;
    const { data: existing } = await supabase.from("bano_grupos").select("id,nombre").ilike("nombre", nombre);
    if (existing && existing.length) {
      grupoId = existing[0].id;
    } else {
      const { data: created, error } = await supabase.from("bano_grupos").insert({ nombre }).select("id").single();
      if (error || !created) { setBusy(false); return; }
      grupoId = created.id;
    }
    await supabase.from("bano_profesor_grupos").insert({ profesor_id: profesor.id, grupo_id: grupoId });
    setNuevo("");
    setBusy(false);
    cargar();
  }

  async function quitar(g: Grupo) {
    if (!confirm(`¿Quitar ${g.nombre} de tus grupos? (el grupo y sus alumnos no se borran)`)) return;
    await supabase.from("bano_profesor_grupos").delete().eq("profesor_id", profesor.id).eq("grupo_id", g.id);
    cargar();
  }

  return (
    <div className={ui.card}>
      <h2 className={ui.cardTitle}>Mis grupos</h2>
      {grupos === null ? (
        <p className={ui.empty}>Cargando…</p>
      ) : grupos.length === 0 ? (
        <p className={ui.empty}>Aún no tienes grupos. Agrega uno abajo.</p>
      ) : (
        <div className={ui.list}>
          {grupos.map((g) => (
            <div className={ui.row} key={g.id}>
              <div className={ui.rowMain} onClick={() => onSelect(g)}>
                <div className={ui.rowName}>{g.nombre}</div>
              </div>
              <span className={ui.chev}>›</span>
              <button className={`${ui.btn} ${ui.btnIcon}`} onClick={() => quitar(g)} title="Quitar de mis grupos">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={ui.addRow}>
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Grupo (ej. 3A)"
          onKeyDown={(e) => e.key === "Enter" && agregar()}
        />
        <button className={`${ui.btn} ${ui.btnGhost}`} onClick={agregar} disabled={busy}>
          Agregar
        </button>
      </div>
    </div>
  );
}
