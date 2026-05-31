-- Patient consent signature sessions (remote device sync)
CREATE TABLE public.sesiones_firma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  paciente_nombre TEXT,
  ficha_id UUID REFERENCES public.fichas_clinicas(id) ON DELETE SET NULL,
  acepta_consentimiento BOOLEAN NOT NULL DEFAULT false,
  permite_fotos_redes BOOLEAN NOT NULL DEFAULT false,
  firma_base64 TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'expirada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sesiones_firma_token ON public.sesiones_firma(token);
CREATE INDEX idx_sesiones_firma_ficha_id ON public.sesiones_firma(ficha_id);
CREATE INDEX idx_sesiones_firma_paciente_pendiente
  ON public.sesiones_firma(paciente_id)
  WHERE estado = 'pendiente';

ALTER TABLE public.sesiones_firma ENABLE ROW LEVEL SECURITY;

CREATE POLICY sesiones_firma_authenticated_all ON public.sesiones_firma
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesiones_firma TO authenticated;

-- Public read via token (patient device)
CREATE OR REPLACE FUNCTION public.obtener_sesion_firma(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.sesiones_firma%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.sesiones_firma WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  IF v_row.expires_at < NOW() AND v_row.estado = 'pendiente' THEN
    UPDATE public.sesiones_firma SET estado = 'expirada' WHERE id = v_row.id;
    v_row.estado := 'expirada';
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'paciente_nombre', v_row.paciente_nombre,
    'estado', v_row.estado,
    'acepta_consentimiento', v_row.acepta_consentimiento,
    'permite_fotos_redes', v_row.permite_fotos_redes,
    'expires_at', v_row.expires_at
  );
END;
$$;

-- Patient submits consent + signature (anon-safe)
CREATE OR REPLACE FUNCTION public.completar_sesion_firma(
  p_token TEXT,
  p_acepta BOOLEAN,
  p_redes BOOLEAN,
  p_firma_base64 TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.sesiones_firma%ROWTYPE;
BEGIN
  IF p_acepta IS NOT TRUE THEN
    RETURN jsonb_build_object('error', 'consent_required');
  END IF;

  IF p_firma_base64 IS NULL OR length(trim(p_firma_base64)) < 50 THEN
    RETURN jsonb_build_object('error', 'signature_required');
  END IF;

  SELECT * INTO v_row FROM public.sesiones_firma WHERE token = p_token FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  IF v_row.expires_at < NOW() THEN
    UPDATE public.sesiones_firma SET estado = 'expirada' WHERE id = v_row.id;
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  IF v_row.estado = 'completada' THEN
    RETURN jsonb_build_object('error', 'already_completed');
  END IF;

  IF v_row.estado = 'expirada' THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  UPDATE public.sesiones_firma
  SET
    acepta_consentimiento = p_acepta,
    permite_fotos_redes = COALESCE(p_redes, false),
    firma_base64 = p_firma_base64,
    estado = 'completada',
    completed_at = NOW()
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'ok', true,
    'estado', v_row.estado
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_sesion_firma(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.completar_sesion_firma(TEXT, BOOLEAN, BOOLEAN, TEXT) TO anon, authenticated;

-- Realtime: notify staff when patient completes
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('firma:%', 'Patient consent signature sync', true)
ON CONFLICT (pattern) DO UPDATE
SET description = EXCLUDED.description,
    enabled = EXCLUDED.enabled;

CREATE OR REPLACE FUNCTION public.notify_sesion_firma_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'completada' AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    PERFORM realtime.publish(
      'firma:' || NEW.token,
      'consent_completed',
      jsonb_build_object(
        'acepta_consentimiento', NEW.acepta_consentimiento,
        'permite_fotos_redes', NEW.permite_fotos_redes,
        'firma_base64', NEW.firma_base64,
        'estado', NEW.estado
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sesiones_firma_completed_trigger
AFTER UPDATE ON public.sesiones_firma
FOR EACH ROW
EXECUTE FUNCTION public.notify_sesion_firma_completed();

-- Allow authenticated staff to subscribe to firma channels
ALTER TABLE realtime.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_subscribe_firma_channels
ON realtime.channels FOR SELECT
TO authenticated
USING (pattern = 'firma:%');
