-- Fix security vulnerability: Require authentication for all instruction access
-- Drop the existing policy that allows anonymous access to broadcast instructions
DROP POLICY IF EXISTS "Users can view instructions sent to them or broadcast instructi" ON public.instructions;

-- Create a new secure policy that requires authentication for all instruction access
CREATE POLICY "Authenticated users can view their instructions and broadcasts" 
ON public.instructions 
FOR SELECT 
USING (
  -- Ensure user is authenticated
  auth.uid() IS NOT NULL 
  AND (
    -- User can see instructions targeted to them
    (target_user_id IN ( 
      SELECT users.id
      FROM users
      WHERE users.user_id = auth.uid()
    )) 
    OR 
    -- User can see broadcast instructions (target_user_id IS NULL)
    -- but only if they are authenticated
    target_user_id IS NULL
  )
);