-- Enable realtime for instructions table
ALTER TABLE public.instructions REPLICA IDENTITY FULL;

-- Update RLS policy to allow users to see broadcast instructions (target_user_id is NULL)
DROP POLICY IF EXISTS "Users can view instructions sent to them" ON public.instructions;

CREATE POLICY "Users can view instructions sent to them or broadcast instructions" 
ON public.instructions 
FOR SELECT 
USING (
  target_user_id IN ( SELECT users.id FROM users WHERE users.user_id = auth.uid() )
  OR target_user_id IS NULL  -- Allow viewing broadcast instructions
);

-- Function to limit instruction history to 500 entries
CREATE OR REPLACE FUNCTION public.limit_instruction_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old instructions when we exceed 500 entries
  DELETE FROM public.instructions 
  WHERE id IN (
    SELECT id FROM public.instructions 
    ORDER BY created_at DESC 
    OFFSET 500
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically limit instruction history after each insert
CREATE TRIGGER limit_instruction_history_trigger
  AFTER INSERT ON public.instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.limit_instruction_history();