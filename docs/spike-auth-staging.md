# Spike de autenticación — prueba de concepto en staging

Estado: pendiente de ejecución con un proyecto Supabase de pruebas y credenciales autorizadas. No desplegar.

## Objetivo
Demostrar que un PIN verificado exclusivamente en servidor puede desembocar en una sesión Supabase Auth válida para el usuario correcto, sin entregar claves administrativas al cliente.

## Referencias oficiales consultadas
- `auth.admin.generateLink`: https://supabase.com/docs/reference/javascript/auth-admin-generatelink
- `auth.verifyOtp`: https://supabase.com/docs/reference/javascript/auth-verifyotp
- Quickstart React y verificación de `token_hash`: https://supabase.com/docs/guides/auth/quickstarts/react

Las referencias documentan la generación de enlaces/token y la verificación de token hash. No prueban por sí solas que el flujo concreto de PIN → token hash → sesión sea seguro para esta aplicación. Por eso se requiere el spike.

## Casos que debe ejecutar el spike
1. Crear en staging un usuario Auth de prueba y una fila de perfil vinculada por UUID.
2. Generar enlace/token desde entorno servidor usando secreto administrativo solo en secretos del entorno.
3. Extraer en servidor exclusivamente el token hash requerido para la verificación, sin registrar la URL completa ni tokens.
4. Verificar con cliente Supabase usando el tipo de OTP documentado para ese enlace.
5. Comprobar que se recibe una sesión real, que `getUser()` valida el UID esperado y que `getSession()` contiene access y refresh token.
6. Probar refresh, logout, token usado por segunda vez, token vencido y usuario Auth deshabilitado.
7. Confirmar que la respuesta HTTP y logs no contienen PIN, hash de PIN, service-role, URL de acción ni tokens después de completar el intercambio.
8. Verificar que un usuario autenticado no puede escoger otro UID ni cambiar rol o metadata de autorización.
9. Probar concurrencia y limitación de intentos con usuarios sintéticos.
10. Registrar versión de SDK, configuración Auth y resultados, sin secretos ni datos personales.

## Criterio de aprobación
Solo continuar con la implementación si todas las pruebas pasan y el mecanismo de sesión resulta compatible con el SDK instalado (`@supabase/supabase-js ^2.45.4`) o se documenta una actualización controlada en staging.

Si no se puede demostrar el intercambio completo y seguro, descartar esta opción y diseñar otro mecanismo soportado. No crear JWT manuales ni imitar una sesión en localStorage.

## Lo que falta para ejecutar
Se necesita un proyecto de staging separado, acceso autorizado a su configuración Auth y secretos de función. No se utilizará el proyecto productivo para experimentar. No se han ejecutado pruebas ni se ha modificado el código de la app.
