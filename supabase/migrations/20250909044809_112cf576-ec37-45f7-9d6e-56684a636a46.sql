-- Enable real-time updates for instructions table
ALTER TABLE public.instructions REPLICA IDENTITY FULL;

-- Add the instructions table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructions;