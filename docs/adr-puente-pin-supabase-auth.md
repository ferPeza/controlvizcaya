# ADR — Puente de PIN legado a sesión Supabase Auth

Estado: candidato técnico para prueba aislada; no aprobado para producción.

## Problema
La app necesita conservar temporalmente el acceso usuario + PIN de 4 dígitos, pero el navegador no debe consultar ni comparar `bano_profesores.pin`. La validación debe ocurrir en servidor y el cliente debe recibir una sesión Supabase Auth real.

## Opción a validar en staging: token de un solo uso generado por Admin API
La documentación oficial de Supabase expone `auth.admin.generateLink({ type: "magiclink", email })`, que genera un enlace/token sin enviarlo automáticamente; `auth.verifyOtp({ token_hash, type: "magiclink" })` es el flujo cliente documentado para verificar un token hash y obtener sesión. Referencias:
- https://supabase.com/docs/reference/javascript/auth-admin-generatelink
- https://supabase.com/docs/reference/javascript/auth-verifyotp

Flujo propuesto, sujeto a prueba de extremo a extremo:
1. El navegador envía usuario + PIN a una Edge Function sobre HTTPS.
2. La función normaliza el usuario, verifica el PIN contra un verificador privado y aplica limitación atómica de intentos.
3. Solo tras validar, la función resuelve el usuario Auth previamente provisionado y solicita al Admin API un magic link de un solo uso.
4. La función devuelve únicamente el token hash necesario para que el cliente llame `verifyOtp`; nunca devuelve service-role, PIN, hash de PIN, ni action URL con secretos adicionales.
5. El cliente verifica el token y persiste la sesión Auth emitida por Supabase.
6. El perfil/rol se obtiene desde datos autorizados; no se toma de la respuesta de login ni de localStorage.

## Riesgos y pruebas obligatorias
- El token hash es una credencial bearer: no registrarlo, no cachearlo, no incluirlo en analítica, usar HTTPS y verificar expiración/uso único.
- Confirmar en proyecto de staging que `generateLink(magiclink)` funciona para cuentas precreadas y confirmadas, y que `verifyOtp` entrega access + refresh token utilizables.
- Probar replay, token vencido, fallo parcial, refresh, logout, CORS, solicitudes concurrentes y cuentas deshabilitadas.
- Verificar que el token no permite cambiar identidad/rol y que RLS deriva autorización del UID Auth.
- No usar esta vía hasta que pruebas reales de staging pasen. Si falla, evaluar un flujo Auth alternativo soportado, no JWT artesanal.

## Alternativas descartadas
- Fabricar/firma manual de JWT o devolver un objeto local como sesión.
- Usar service-role en frontend.
- Mantener lectura de PIN desde tabla pública.
- Cambiar producción o borrar políticas actuales antes de tener políticas sustitutas verificadas.

## Estado de implementación
No se ha añadido Edge Function ni SQL ejecutable. Esta ADR selecciona una hipótesis concreta y define la prueba que desbloquea el código de login.
