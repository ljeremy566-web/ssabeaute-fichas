-- Block OAuth signup for emails not in staff_allowlist.
-- Remove any auth.users rows that are not the two authorized staff accounts.

CREATE UNIQUE INDEX IF NOT EXISTS staff_allowlist_email_lower_idx
  ON public.staff_allowlist (lower(email));

CREATE OR REPLACE FUNCTION public.enforce_staff_email_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.staff_allowlist
    WHERE lower(email) = lower(trim(COALESCE(NEW.email, '')))
  ) THEN
    RAISE EXCEPTION 'access_denied: email not authorized';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_staff_email_before_signup ON auth.users;

CREATE TRIGGER enforce_staff_email_before_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_staff_email_on_signup();

DELETE FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_allowlist s
  WHERE s.user_id = u.id
);
