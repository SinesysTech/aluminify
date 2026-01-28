-- Create a secure function to look up auth user ID by email
-- This avoids the need to list all users which is slow and prone to timeouts
CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Validate input
  IF email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Look up user in auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE lower(auth.users.email) = lower(email)
  LIMIT 1;

  RETURN user_id;
END;
$$;

-- Grant execute permission to service_role (used by server actions)
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION public.get_auth_user_id_by_email IS 'Securely looks up an auth user ID by email. Used to handle user conflicts efficiently.';
