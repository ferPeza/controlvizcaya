ALTER TABLE public.bano_profesores
ADD COLUMN IF NOT EXISTS usuario TEXT;

UPDATE public.bano_profesores
SET usuario = lower(regexp_replace(trim(nombre), '[^a-zA-Z0-9]+', '_', 'g'))
WHERE usuario IS NULL OR trim(usuario) = '';

UPDATE public.bano_profesores
SET usuario = 'monitor'
WHERE lower(trim(nombre)) = 'monitor';

CREATE UNIQUE INDEX IF NOT EXISTS bano_profesores_usuario_unique
ON public.bano_profesores (lower(trim(usuario)));

ALTER TABLE public.bano_profesores
ALTER COLUMN usuario SET NOT NULL;

COMMENT ON COLUMN public.bano_profesores.usuario IS 'Usuario utilizado para iniciar sesión; nombre contiene el nombre completo visible del profesor';
