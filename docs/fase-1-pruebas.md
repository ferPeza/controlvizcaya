# Fase 1 — Matriz de pruebas previa a migración

Estas pruebas son requisitos de aceptación. No se ejecutan contra producción desde este documento.

## Autenticación

| Caso | Resultado esperado |
|---|---|
| Usuario válido + PIN correcto | Supabase Auth establece sesión válida y el perfil coincide con la identidad |
| Usuario inexistente / PIN incorrecto | Respuesta genérica equivalente |
| PIN con menos de 4 dígitos o caracteres no numéricos | Rechazo antes de validar credenciales |
| PIN correcto tras bloqueo activo | Rechazo hasta vencer el bloqueo |
| Repetición de solicitudes concurrentes | Contador y bloqueo consistentes; no se elude el límite por carreras |
| Sesión vencida / refresh inválido | Se cierra el acceso y se solicita iniciar sesión |
| Cierre de sesión | Se revoca/cierra la sesión Auth y se limpia estado local |

## Autorización por rol

- Profesor A no puede leer ni modificar alumnos de grupos no asignados.
- Profesor A no puede alterar su propio rol ni la asignación de otro profesor.
- Monitor puede acceder únicamente a los datos requeridos para monitoreo y estadísticas.
- Administrador puede gestionar cuentas y asignaciones mediante endpoint autorizado.
- Usuario anónimo no puede leer ni modificar tablas escolares.
- Cambiar el rol en localStorage o en el estado React no modifica permisos efectivos.

## Integridad de datos

- IDs de las cuentas existentes y relaciones de grupos se conservan durante migración.
- Los 121 alumnos y 40 registros históricos permanecen intactos.
- Motivos históricos permanecen sin transformación.
- No se eliminan políticas actuales hasta que las sustitutas estén verificadas en entorno aislado.
- El rollback no restaura credenciales PIN en texto plano ni vuelve a habilitar acceso público.

## Evidencia requerida antes de producción

- Resultado de build y pruebas automatizadas.
- Pruebas RLS ejecutadas con roles profesor, monitor, administrador y anónimo.
- Revisión de secretos: service role solo en Edge Function secrets; ningún PIN/hash/pepper en respuestas o logs.
- Backup verificado y procedimiento de reversión ensayado.
- Aprobación explícita para desplegar y aplicar migraciones.
