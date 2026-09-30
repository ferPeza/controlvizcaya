-- Habilita actualizaciones en tiempo real para el panel de monitoreo.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bano_registros'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bano_registros;
  END IF;
END $$;
