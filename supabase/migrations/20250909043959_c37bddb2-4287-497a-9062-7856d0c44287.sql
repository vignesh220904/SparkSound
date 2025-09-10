-- Fix critical security vulnerability: Admin table RLS policies expose password hashes
-- Drop ALL existing policies on admins table and recreate with proper authentication

-- Drop all existing policies on the admins table
DROP POLICY IF EXISTS "Authenticated admin can view own data" ON public.admins;
DROP POLICY IF EXISTS "Authenticated admin can update own data" ON public.admins;
DROP POLICY IF EXISTS "Prevent unauthorized admin creation" ON public.admins;
DROP POLICY IF EXISTS "Prevent admin deletion" ON public.admins;
DROP POLICY IF EXISTS "Admin access only for sparksound admin" ON public.admins;

-- Create secure authentication-based policies
-- Policy 1: Only authenticated admins can view their own data
CREATE POLICY "admin_select_own_data" 
ON public.admins 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND email = (auth.jwt() ->> 'email')
  AND email = 'sparksound2025@gmail.com'
);

-- Policy 2: Only authenticated admins can update their own data  
CREATE POLICY "admin_update_own_data" 
ON public.admins 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND email = (auth.jwt() ->> 'email')
  AND email = 'sparksound2025@gmail.com'
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND email = (auth.jwt() ->> 'email')
  AND email = 'sparksound2025@gmail.com'
);

-- Policy 3: Restrict INSERT operations (no new admin creation without proper setup)
CREATE POLICY "admin_restrict_insert" 
ON public.admins 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- Policy 4: Restrict DELETE operations (prevent admin deletion)
CREATE POLICY "admin_restrict_delete" 
ON public.admins 
FOR DELETE 
TO authenticated
USING (false);