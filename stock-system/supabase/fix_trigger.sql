-- =========================================================
-- FIX: Replace the handle_new_user trigger with a safe version
-- Run this in Supabase SQL Editor FIRST before trying to login
-- =========================================================

-- Drop and recreate the trigger function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role user_role := 'customer';
    v_full_name TEXT;
BEGIN
    -- Safely parse the role (default to 'customer' if invalid or missing)
    BEGIN
        v_role := COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'customer'::user_role
        );
    EXCEPTION WHEN invalid_text_representation THEN
        v_role := 'customer'::user_role;
    END;

    -- Safely get full_name (fallback to email)
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        'Unknown User'
    );

    -- Insert profile, skip if already exists (idempotent)
    INSERT INTO public.user_profiles (user_id, full_name, role)
    VALUES (NEW.id, v_full_name, v_role)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Verify the trigger still exists (recreate if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
