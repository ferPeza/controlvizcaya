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

function estaBloqueadoPorHorario() {
  const ahora = new Date();
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();

  // Primeros y últimos 5 minutos de cada clase.
  const periodos = [
    [7 * 60, 7 * 60 + 50],
    [7 * 60 + 50, 8 * 60 + 40],
    [8 * 60 + 40, 9 * 60 + 30],
    [9 * 60 + 30, 10 * 60 + 20],
    [10 * 60 + 50, 11 * 60 + 40],
    [11 * 60 + 40, 12 * 60 + 30],
    [12 * 60 + 30, 13 * 60 + 20],
    [13 * 60 + 20, 14 * 60 + 10],
  ];

  // La hora 5, inmediatamente después del receso, queda bloqueada completa.
  const inicioHora5 = 10 * 60 + 50;
  const finHora5 = 11 * 60 + 40;
  if (minutos >= inicioHora5 && minutos < finHora5) return true;

  return periodos.some(([inicio, fin]) => {
    return minutos >= inicio && minutos < inicio + 5 || minutos >= fin - 5 && minutos < fin;
  });
}

export default function Alumnos({ grupo }: AlumnosProps) {
  const [alumnos, setAlumnos] = useState<Alumno[] | null>(null);
  const [ultimos, setUltimos] = useState<Record<string, Registro>>({});
  const [grupoBloqueado, setGrupoBloqueado] = useState(false);
  const [, setHoraActual] = useState(() => Date.now());
  const bloquearBanoHorario = estaBloqueadoPorHorario();
  const bloquearBano = grupoBloqueado || bloquearBanoHorario;

  async function cargar() {
    const { data: alData } = await supabase
      .from("bano_alumnos")
      .select("id,nombre,grupo_id")
      .eq("grupo_id", grupo.id)
      .order("nombre", { ascending: true });

    const lista = alData ?? [];
    setAlumnos(lista);

    if (!lista.length) {
      setUltimos({});
      setGrupoBloqueado(false);
      return;
    }

    const ids = lista.map((a) => a.id);
    const [{ data: regData }, { data: activosGrupo }] = await Promise.all([
      supabase
        .from("bano_registros")
        .select("id,alumno_id,salida,regreso,motivo")
        .in("alumno_id", ids)
        .order("salida", { ascending: false }),
      // Se consulta por los IDs de los alumnos del grupo para que el bloqueo
      // no dependa de relaciones anidadas de Supabase/RLS.
      supabase
        .from("bano_registros")
        .select("id,alumno_id")
        .in("alumno_id", ids)
        .eq("motivo", "salio")
        .is("regreso", null),
    ]);

    const map: Record<string, Registro> = {};
    (regData ?? []).forEach((r) => {
      if (!map[r.alumno_id]) map[r.alumno_id] = r;
    });

    setUltimos(map);
    setGrupoBloqueado(Array.isArray(activosGrupo) && activosGrupo.length > 0);
  }

  useEffect(() => {
    const reloj = window.setInterval(() => setHoraActual(Date.now()), 1000);
    return () => window.clearInterval(reloj);
  }, []);

  useEffect(() => {
    void cargar();

    const channel = supabase
      .channel("alumnos-grupo-" + grupo.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bano_registros" },
        () => { void cargar(); }
      )
      .subscribe();

    const timer = window.setInterval(() => { void cargar(); }, 2000);

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [grupo.id]);

  async function salir(a: Alumno, motivo: MotivoSalida) {
    if (motivo === "salio" && (grupoBloqueado || estaBloqueadoPorHorario())) {
      return;
    }

    // Comprobación final contra Supabase para evitar que dos clics
    // simultáneos permitan dos permisos de baño en el mismo grupo.
    if (motivo === "salio") {
      const { data: alumnosGrupo } = await supabase
        .from("bano_alumnos")
        .select("id")
        .eq("grupo_id", grupo.id);

      const idsGrupo = (alumnosGrupo ?? []).map((alumno) => alumno.id);

      if (!idsGrupo.length) return;

      const { data: activos } = await supabase
        .from("bano_registros")
        .select("id,alumno_id,motivo")
        .in("alumno_id", idsGrupo)
        .eq("motivo", "salio")
        .is("regreso", null);

      if ((activos ?? []).length > 0) {
        setGrupoBloqueado(true);
        return;
      }
    }

    await supabase.from("bano_registros").insert({ alumno_id: a.id, motivo });
    await cargar();
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
          {grupoBloqueado && (
            <div className={ui.groupBathroomLock} role="status">
              <strong>Baño bloqueado</strong>
              <span>Hay un alumno de este grupo fuera del aula. El permiso de baño se habilitará cuando regrese.</span>
            </div>
          )}
          {bloquearBanoHorario && (
            <div className={ui.groupBathroomLock} role="status">
              <strong>Baño bloqueado por horario</strong>
              <span>Los permisos de baño están bloqueados durante los primeros y últimos 5 minutos de clase. La hora 5 queda bloqueada completa después del receso.</span>
            </div>
          )}
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
                        disabled={afuera || (m.key === "salio" && bloquearBano)}
                        title={m.key === "salio" && bloquearBanoHorario ? "Baño bloqueado por horario" : m.key === "salio" && grupoBloqueado ? "Baño bloqueado: hay un alumno de este grupo fuera" : undefined}
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
                </div>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
