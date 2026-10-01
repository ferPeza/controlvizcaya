# Fase 1 — Paquetes de implementación y criterios de entrada

Estado: guía técnica para ejecutar en entorno aislado. No es una migración ejecutable.

## Hallazgos confirmados en el código revisado

- `Login.tsx` hace `select("id,nombre,usuario,pin,rol")` y compara el PIN en el navegador.
- `App.tsx` restaura la identidad desde `localStorage`; si la consulta al perfil falla, conserva la identidad y rol guardados.
- `supabase.ts` inicializa el cliente con URL y clave anon. Esa clave es pública por diseño; no debe tratarse como secreto ni sustituye RLS.
- `package.json` no define pruebas automatizadas ni comandos de Supabase CLI.

## Orden de implementación propuesto

### Paquete 0 — Preparar staging
1. Crear proyecto Supabase separado; no usar el proyecto productivo como laboratorio.
2. Exportar esquema, políticas y relaciones; mantener el respaldo en ubicación privada.
3. Cargar datos sintéticos que cubran profesor con dos grupos, profesor sin grupo, monitor, administrador, cuenta bloqueada y anónimo.
4. Verificar restauración del respaldo antes de continuar.

### Paquete 1 — Resolver el puente PIN → Supabase Auth
No escribir el endpoint de login hasta demostrar en staging un flujo soportado que, después de validar el PIN en servidor, entregue al navegador una sesión Auth real con refresh/logout válidos. No fabricar ni firmar JWT manualmente, no devolver un objeto de perfil como si fuera sesión y no usar service-role en el navegador.

Criterio de entrada: prueba mínima de sesión válida, refresh, expiración y logout documentada. Si el mecanismo requiere credenciales internas por usuario, almacenarlas solo en servidor y definir rotación/recuperación.

### Paquete 2 — Función de autenticación
- Normalizar usuario de forma consistente.
- Validar formato de PIN sin devolver si falló usuario o PIN.
- Guardar verificador de PIN únicamente en almacenamiento privado; comparar en servidor.
- Aplicar limitación atómica por cuenta y origen confiable, con bloqueo progresivo.
- No incluir PIN, hash, secretos ni datos sensibles en logs o respuestas.
- Deshabilitar altas públicas y autoasignación de rol.

### Paquete 3 — Autorización y RLS
- Documentar una sola fuente efectiva de asignación de grupos, conciliando `bano_profesor_grupos` con `bano_grupos.profesor_id`.
- Escribir políticas por operación y rol, no una política global `ALL`.
- Probar lectura/escritura cruzada y cambios de rol desde cliente.
- Mantener anon sin acceso a datos escolares.
- Sustituir políticas permisivas solo después de que todas las pruebas pasen en staging.

### Paquete 4 — Cliente
- `Login.tsx`: llamar al mecanismo validado; eliminar lectura de `pin`.
- `App.tsx`: restaurar solo desde sesión Auth verificada y perfil autorizado; ante error, cerrar sesión y mostrar login.
- `Profesores.tsx` y `Perfil.tsx`: mover creación, cambios de rol y PIN a operaciones servidor autorizadas.
- Mantener localStorage como preferencia/estado no autoritativo, nunca como permiso.

### Paquete 5 — Evidencia antes de promover
- Build y pruebas automatizadas verdes.
- Matriz RLS aprobada para profesor, monitor, administrador y anónimo.
- Prueba concurrente de rate limit.
- Comparación de IDs y conteos antes/después para cuentas, grupos, alumnos, asignaciones y registros.
- Backup restaurado en ensayo.
- Procedimiento de reversión sin volver a PIN legible ni políticas públicas.
- Aprobación explícita antes de cualquier cambio productivo.

## No cambiar en esta fase
- La lógica actual de bloqueo por grupo de las salidas.
- IDs ni datos históricos.
- Producción, secretos o despliegues.

## Estado
Este paquete traduce el diagnóstico en unidades de trabajo y define el bloqueo técnico previo al código: validar una forma soportada de crear una sesión Auth real a partir del PIN legado. No se ha ejecutado build ni pruebas desde este documento.
