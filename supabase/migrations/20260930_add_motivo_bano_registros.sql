-- Agrega el motivo de salida a cada registro.
-- Valores previstos: 'salio', 'tutor', 'psicologa', 'coordinacion'.
ALTER TABLE bano_registros
ADD COLUMN IF NOT EXISTS motivo TEXT NOT NULL DEFAULT 'salio';

COMMENT ON COLUMN bano_registros.motivo IS
'Motivo de salida: salio, tutor, psicologa o coordinacion';
