-- =========================================================
-- FIX: Infinite Recursion on user_profiles RLS policies
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. Drop the existing recursive policies
DROP POLICY IF EXISTS "Admin sees all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users see own profile" ON public.user_profiles;

-- 2. Create a secure function to check admin status bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Add back the policies using the non-recursive function
CREATE POLICY "Users see own profile" 
ON public.user_profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admin sees all profiles" 
ON public.user_profiles 
FOR ALL 
USING (public.is_admin());
