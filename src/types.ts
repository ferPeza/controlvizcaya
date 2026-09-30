export interface Profesor {
  id: string;
  nombre: string;
}

export interface Grupo {
  id: string;
  nombre: string;
}

export interface Alumno {
  id: string;
  nombre: string;
  grupo_id: string;
}

export interface Registro {
  id: string;
  alumno_id: string;
  salida: string;
  regreso: string | null;
  motivo: "salio" | "tutor" | "psicologa" | "coordinacion";
}
