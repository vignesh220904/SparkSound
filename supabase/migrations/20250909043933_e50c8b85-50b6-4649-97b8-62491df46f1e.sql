-- Fix critical security vulnerability: Admin table RLS policy exposes password hashes
-- Current policy allows access based only on email match without authentication
-- This creates a major security risk as anyone knowing the admin email could access password hashes

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Admin access only for sparksound admin" ON public.admins;

-- Create proper authentication-based policies for admin access
-- Only allow authenticated users with the correct admin email to access their own data

-- Allow admin to view their own data (but only when authenticated)
CREATE POLICY "Authenticated admin can view own data" 
ON public.admins 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND email = auth.jwt() ->> 'email'
  AND email = 'sparksound2025@gmail.com'
);

-- Allow admin to update their own data (but only when authenticated)
CREATE POLICY "Authenticated admin can update own data" 
ON public.admins 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND email = auth.jwt() ->> 'email'
  AND email = 'sparksound2025@gmail.com'
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND email = auth.jwt() ->> 'email'
  AND email = 'sparksound2025@gmail.com'
);

-- Restrict INSERT and DELETE operations to prevent unauthorized admin creation/deletion
-- Only allow inserts during initial setup (this can be adjusted as needed)
CREATE POLICY "Prevent unauthorized admin creation" 
ON public.admins 
FOR INSERT 
TO authenticated
WITH CHECK (false); -- Completely restrict new admin creation for now

CREATE POLICY "Prevent admin deletion" 
ON public.admins 
FOR DELETE 
TO authenticated
USING (false); -- Completely restrict admin deletion for security