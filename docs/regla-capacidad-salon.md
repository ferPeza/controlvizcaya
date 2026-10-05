# Regla de capacidad y bloqueo de salidas por salón

Estado: especificación funcional corregida; pendiente de implementación y pruebas en staging.
Alcance: propuesta para Control Vizcaya. No modifica datos, SQL, políticas RLS ni producción.

## Regla principal

Cada salón admite como máximo dos alumnos fuera simultáneamente, contando todos los motivos: `salio` (Baño), `tutor`, `psicologa` y `coordinacion`.

Un registro cuenta como alumno fuera cuando corresponde al salón y su hora de regreso es nula. El conteo se hace por salón, no globalmente.

## Reglas de admisión

1. Si ya hay 2 alumnos fuera en el salón, rechazar cualquier nueva salida, independientemente del motivo.
2. Si hay menos de 2 fuera, una salida no relacionada con Baño puede admitirse si cumple las demás reglas existentes.
3. Una salida de Baño se rechaza si ya existe otro alumno fuera por Baño en ese salón.
4. Si hay un alumno fuera por Baño y otro por Tutor/Psicóloga/Coordinación, el salón está lleno: se rechazan todas las nuevas salidas.
5. Cuando regresa un alumno no-Baño y el alumno de Baño sigue fuera, queda un cupo general disponible, pero Baño continúa bloqueado.
6. Cuando regresa el alumno de Baño, se libera el bloqueo específico de Baño, aunque permanezca fuera un alumno por Tutor/Psicóloga/Coordinación. El límite total de dos sigue aplicando.

## Matriz de casos

| Alumnos actualmente fuera | Nueva salida | Resultado |
|---|---|---|
| Ninguno | Baño o motivo especial | Admitir si se cumplen las demás reglas |
| Uno por Baño | Otra salida de Baño | Rechazar: ya hay Baño activo |
| Uno por Tutor/Psicóloga/Coordinación | Baño | Admitir si no hay otro bloqueo aplicable |
| Baño + Tutor | Cualquier motivo | Rechazar: 2/2 |
| Baño + Psicóloga | Cualquier motivo | Rechazar: 2/2 |
| Baño + Coordinación | Cualquier motivo | Rechazar: 2/2 |
| Regresa el no-Baño; Baño sigue fuera | Nueva salida no-Baño | Admitir: queda 1 cupo |
| Regresa el no-Baño; Baño sigue fuera | Nueva salida Baño | Rechazar: bloqueo Baño activo |
| Regresa el alumno de Baño; otro motivo sigue fuera | Nueva salida Baño | Admitir si queda cupo y se cumplen las demás reglas |

## Evaluación consistente

La decisión de admitir una salida debe comprobarse de forma atómica en el servidor/base de datos para evitar que dos solicitudes simultáneas vean el mismo cupo libre y produzcan 3 alumnos fuera. La operación debe validar en una sola transacción o mecanismo equivalente:

- salón al que pertenece el alumno;
- total de alumnos con salida abierta en ese salón;
- existencia de una salida abierta por Baño;
- motivo solicitado y reglas horarias existentes.

No se debe confiar en el contador mostrado en el navegador como control de seguridad.

## No cambiar con esta corrección

- Se conserva la regla horaria de bloqueo en los primeros y últimos cinco minutos de cada periodo y el bloqueo del quinto periodo después del receso, hasta revisar sus parámetros actuales.
- No se cambia la asignación de grupos ni la autorización profesor-alumno.
- No se altera el flujo de regreso ni se borran registros históricos.
- Esta especificación no autoriza despliegue, migraciones ni cambios en producción.

## Pruebas de aceptación requeridas

- Dos salidas simultáneas del mismo salón no pueden superar el límite de 2.
- El conteo considera los cuatro motivos.
- Con Baño + Tutor fuera, no se admite una tercera salida.
- Al regresar Tutor, una salida no-Baño puede usar el cupo, pero Baño permanece bloqueado mientras siga fuera el alumno de Baño.
- Al regresar el alumno de Baño, se libera el bloqueo específico de Baño, sin exceder el máximo total.
- Las salidas de otro salón no afectan el conteo ni el bloqueo del salón probado.
- Rechazos por capacidad o bloqueo no crean registros parciales.
