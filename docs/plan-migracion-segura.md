# Fase 1 — Plan de implementación y migración segura

Estado: propuesta operativa para revisión. No ejecutar en producción.

## Objetivo y límites
Conservar usuario + PIN de cuatro dígitos y los datos escolares existentes. No cambiar la lógica de bloqueo por grupo ni modificar alumnos/registros durante la migración de autenticación.

## Secuencia de trabajo

### Etapa A — Entorno aislado
- Crear un proyecto Supabase de pruebas o una copia saneada; no probar políticas nuevas sobre producción.
- Registrar versiones de esquema y políticas actuales, sin exportar secretos.
- Preparar datos de prueba para profesor, monitor, administrador y usuario anónimo.
- Confirmar backup restaurable antes de cualquier cambio real.

### Etapa B — Identidad y credenciales
- Definir una tabla privada de correspondencia entre UUID Auth y UUID de bano_profesores.
- Mantener PIN/hash en almacenamiento no legible por anon ni por usuarios autenticados ordinarios.
- Validar el flujo soportado para emitir una sesión Supabase Auth después de verificar el PIN; no fabricar JWT manualmente.
- Establecer rotación de PIN para las cuentas migradas y no registrar PIN ni hashes en logs.
- La creación y el cambio de rol deben ser operaciones administrativas verificadas en servidor.

### Etapa C — Limitación de intentos
- Mantener contador por cuenta normalizada y por origen confiable, con ventana temporal, bloqueo progresivo y expiración.
- Actualizar contadores de forma atómica para que solicitudes simultáneas no eludan el límite.
- Responder con error genérico para usuario inexistente, PIN incorrecto o cuenta bloqueada.
- No confiar en CORS como mecanismo de autenticación ni en una IP enviada libremente por el navegador.

### Etapa D — Autorización/RLS
- Definir políticas por tabla con mínimo privilegio:
  - Profesor: solo grupos asignados y operaciones escolares permitidas.
  - Monitor: lectura de los datos necesarios para monitoreo/estadísticas.
  - Administrador: gestión de cuentas, roles, grupos y asignaciones por funciones autorizadas.
  - Anónimo: sin lectura ni escritura de datos escolares.
- Evaluar ambas relaciones de grupo existentes (bano_profesor_grupos y bano_grupos.profesor_id) antes de fijar la fuente de autorización.
- Probar acceso cruzado entre grupos y escalamiento de rol antes de retirar las políticas permisivas.

### Etapa E — Migración de interfaz
- Cambiar Login.tsx para invocar el endpoint de autenticación, nunca seleccionar la columna PIN.
- En App.tsx, aceptar identidad solo desde sesión/perfil validado; si la validación falla, cerrar sesión y no reutilizar rol de localStorage.
- Migrar altas, edición de cuentas y cambios de PIN a operaciones servidor autorizadas.
- Mantener en localStorage únicamente estado no autoritativo; no usarlo para conceder permisos.

### Etapa F — Puerta de salida
No promover a producción hasta cumplir todo:
- Build y pruebas automatizadas pasan.
- Matriz RLS pasa para profesor, monitor, administrador y anónimo.
- Bloqueo por intentos concurrentes verificado.
- Conteos e IDs de alumnos, registros, cuentas y asignaciones coinciden antes/después.
- Backup y restauración ensayados.
- Plan de reversión no restaura PIN en texto plano ni acceso público.
- Aprobación explícita para despliegue y migración productiva.

## Estado al crear este plan
- Diagnóstico y matriz de pruebas documentados.
- Este documento convierte los pendientes en una secuencia con puertas de validación.
- No contiene migraciones ejecutables ni cambia datos, políticas, secretos o despliegues.
