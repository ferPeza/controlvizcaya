-- Agrega roles para separar docentes del usuario de monitoreo.
ALTER TABLE bano_profesores
ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'profesor';

COMMENT ON COLUMN bano_profesores.rol IS 'Rol de acceso: profesor o monitor';

-- Crea el usuario de monitoreo inicial si todavía no existe.
-- Usuario: Monitor | PIN inicial: 2580
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bano_profesores WHERE lower(trim(nombre)) = 'monitor'
  ) THEN
    INSERT INTO bano_profesores (nombre, pin, rol)
    VALUES ('Monitor', '2580', 'monitor');
  ELSE
    UPDATE bano_profesores SET rol = 'monitor' WHERE lower(trim(nombre)) = 'monitor';
  END IF;
END $$;
