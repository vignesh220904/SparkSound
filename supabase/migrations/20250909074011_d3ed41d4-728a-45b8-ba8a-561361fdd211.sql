-- Enable real-time for instructions table
ALTER TABLE public.instructions REPLICA IDENTITY FULL;

-- Add instructions table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructions;