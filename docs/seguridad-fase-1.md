# Fase 1: preparación de autenticación segura

Estado: análisis de código y diseño. Rama aislada: `security/fase-1-preparacion`. No se han modificado datos, políticas ni producción; no desplegar esta rama todavía.

## Estado actual verificado

Diagnóstico de base de datos:
- 5 cuentas/profesores, 5 grupos, 121 alumnos y 40 registros históricos.
- Roles actuales: profesor, monitor y administrador.
- RLS está habilitado en las cinco tablas revisadas, pero se detectaron políticas permisivas `public_all_*` para `public`, con `USING (true)` y `WITH CHECK (true)`.
- Relaciones revisadas no mostraron alumnos ni registros huérfanos ni asignaciones profesor-grupo duplicadas.

Revisión del código en la rama:
- `src/pages/Login.tsx` consulta `bano_profesores` desde el navegador incluyendo `pin` y compara el PIN en el cliente.
- `src/App.tsx` guarda identidad/rol en `localStorage`; al restaurar sesión, si falla la consulta al servidor, conserva los datos guardados. Eso no puede considerarse autenticación confiable.
- `src/pages/Profesores.tsx` y `src/pages/Perfil.tsx` gestionan cuentas/PIN mediante operaciones directas del cliente; deberán migrarse a operaciones servidor autorizadas.
- `package.json` no contiene scripts de prueba ni configuración Supabase CLI visible.
- La clave anon/publishable está en el frontend. Es pública por diseño; su seguridad depende de políticas RLS correctas. No colocar service-role keys en el cliente.

## Objetivo

Conservar usuario y PIN de cuatro dígitos, pero validar el PIN en servidor y establecer una sesión real de Supabase Auth. El frontend no será autoridad para identidad ni rol.

## Diseño requerido antes de implementar login

1. Crear una identidad Auth estable por cuenta y una relación privada entre `auth.users.id` y `bano_profesores.id`.
2. Definir y probar un mecanismo de emisión de sesión compatible con Supabase Auth; no fabricar JWT ni devolver identidad local como si fuera sesión.
3. Mantener verificación de PIN y credenciales internas exclusivamente en servidor. Nunca devolver PIN, hash, pepper ni credenciales internas.
4. Implementar limitación atómica por cuenta y por origen confiable, con bloqueo progresivo, expiración y mensajes genéricos.
5. Diseñar recuperación y rotación obligatoria de PIN durante la migración, ya que el PIN legado pudo ser accesible bajo las políticas actuales.
6. Provisionar cuentas y roles mediante operación administrativa controlada; nunca permitir autoasignación de rol.
7. Sustituir las políticas públicas solo cuando la nueva autenticación y cada matriz de permisos estén probadas.

## Matriz inicial de autorización

- Profesor: consultar y administrar alumnos de grupos asignados; operar registros autorizados.
- Monitor: consultar los datos necesarios para monitoreo y estadísticas escolares.
- Administrador: administrar cuentas, roles, grupos y asignaciones.
- Toda autorización debe comprobarse en servidor/RLS; ocultar botones no constituye control de acceso.

## Salvaguardas de migración

- No borrar las políticas actuales antes de validar políticas sustitutas en entorno de prueba.
- No cambiar IDs, grupos, alumnos ni registros históricos.
- Preparar respaldo y procedimiento de reversión.
- Probar cuentas de los tres roles, sesiones vencidas, PIN incorrecto, bloqueo, recuperación, acceso cruzado entre grupos y consultas anónimas.
- No desplegar ni aplicar migraciones a producción sin autorización explícita.

## Pendientes técnicos / puerta para implementación

- Verificar el flujo de emisión de sesión Auth tras validar PIN.
- Elegir algoritmo de hash compatible con runtime Edge y definir gestión de secreto servidor.
- Definir esquema y transacción de limitación de intentos.
- Definir políticas RLS por tabla y rol.
- Migrar restauración de sesión y quitar fallback de identidad local.
- Migrar altas, edición de cuenta y cambios de PIN a funciones servidor.
- Añadir pruebas automatizadas y pasos de despliegue/reversión.

## Semáforo

- Diagnóstico de datos y código: completado.
- Diseño de seguridad: en preparación.
- Implementación de autenticación: pendiente.
- Pruebas: pendientes.
- Cambios de producción: ninguno.
