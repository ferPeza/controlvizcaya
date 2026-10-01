-- Control Vizcaya | Fase 1: diagnóstico de seguridad (SOLO LECTURA)
-- Ejecutar en Supabase > SQL Editor. No modifica tablas, datos, políticas ni permisos.

-- 1) Tablas de la aplicación y estado de RLS.
SELECT
  n.nspname AS esquema,
  c.relname AS tabla,
  c.relrowsecurity AS rls_habilitado,
  c.relforcerowsecurity AS rls_forzado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname LIKE 'bano_%'
ORDER BY c.relname;

-- 2) Políticas existentes.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'bano_%'
ORDER BY tablename, policyname;

-- 3) Columnas y tipos de las tablas de la aplicación.
SELECT table_name, ordinal_position, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'bano_%'
ORDER BY table_name, ordinal_position;

-- 4) Restricciones (PK, FK, UNIQUE, CHECK).
SELECT
  rel.relname AS tabla,
  con.conname AS restriccion,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE con.contype::text
  END AS tipo,
  pg_get_constraintdef(con.oid) AS definicion
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND rel.relname LIKE 'bano_%'
ORDER BY rel.relname, con.conname;

-- 5) Conteo de registros por tabla (para validar que el diagnóstico no cambie datos).
SELECT 'bano_profesores' AS tabla, count(*) AS filas FROM public.bano_profesores
UNION ALL SELECT 'bano_profesor_grupos', count(*) FROM public.bano_profesor_grupos
UNION ALL SELECT 'bano_grupos', count(*) FROM public.bano_grupos
UNION ALL SELECT 'bano_alumnos', count(*) FROM public.bano_alumnos
UNION ALL SELECT 'bano_registros', count(*) FROM public.bano_registros;
