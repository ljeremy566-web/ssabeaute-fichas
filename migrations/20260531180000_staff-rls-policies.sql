-- Restrict clinic data to allowlisted Google OAuth staff (2 admins).
-- Patient consent flow remains via SECURITY DEFINER RPCs (anon-safe).

CREATE TABLE IF NOT EXISTS public.staff_allowlist (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.staff_allowlist (user_id, email) VALUES
  ('e17a18ed-0de1-4896-9759-9f5aec8e5c2b'::uuid, 'ljeremy566@gmail.com'),
  ('6046e742-21bd-4ca2-acb0-cef5b06989db'::uuid, 'ssabeaute@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

ALTER TABLE public.staff_allowlist ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_allowlist WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- pacientes: remove wide-open public policy
DROP POLICY IF EXISTS "Permitir acceso publico a pacientes" ON public.pacientes;

CREATE POLICY pacientes_staff_all ON public.pacientes
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- fichas_clinicas
DROP POLICY IF EXISTS fichas_clinicas_authenticated ON public.fichas_clinicas;

CREATE POLICY fichas_clinicas_staff_all ON public.fichas_clinicas
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- sesiones_firma (staff CRUD; patients use obtener_sesion_firma / completar_sesion_firma RPCs)
DROP POLICY IF EXISTS sesiones_firma_authenticated_all ON public.sesiones_firma;

CREATE POLICY sesiones_firma_staff_all ON public.sesiones_firma
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

REVOKE ALL ON public.pacientes FROM anon;
REVOKE ALL ON public.fichas_clinicas FROM anon;
REVOKE ALL ON public.sesiones_firma FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fichas_clinicas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesiones_firma TO authenticated;

-- Realtime: only staff may subscribe to consent channels
DROP POLICY IF EXISTS authenticated_subscribe_firma_channels ON realtime.channels;

CREATE POLICY staff_subscribe_firma_channels ON realtime.channels
  FOR SELECT TO authenticated
  USING (pattern = 'firma:%' AND public.is_staff());

-- Storage: staff-only SDK access to fichas-archivos (bucket stays public for read URLs)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS storage_fichas_staff_select ON storage.objects;
DROP POLICY IF EXISTS storage_fichas_staff_insert ON storage.objects;
DROP POLICY IF EXISTS storage_fichas_staff_update ON storage.objects;
DROP POLICY IF EXISTS storage_fichas_staff_delete ON storage.objects;

CREATE POLICY storage_fichas_staff_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket = 'fichas-archivos' AND public.is_staff());

CREATE POLICY storage_fichas_staff_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket = 'fichas-archivos' AND public.is_staff());

CREATE POLICY storage_fichas_staff_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket = 'fichas-archivos' AND public.is_staff())
  WITH CHECK (bucket = 'fichas-archivos' AND public.is_staff());

CREATE POLICY storage_fichas_staff_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket = 'fichas-archivos' AND public.is_staff());

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
