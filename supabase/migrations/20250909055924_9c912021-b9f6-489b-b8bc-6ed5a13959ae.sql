-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.limit_instruction_history()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;