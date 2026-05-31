-- sesiones_firma must stay publicly accessible for patient consent sync (anon + authenticated).
-- pacientes / fichas_clinicas remain staff-only via is_staff().

DROP POLICY IF EXISTS sesiones_firma_staff_all ON public.sesiones_firma;

CREATE POLICY sesiones_firma_public_all ON public.sesiones_firma
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesiones_firma TO anon, authenticated;
