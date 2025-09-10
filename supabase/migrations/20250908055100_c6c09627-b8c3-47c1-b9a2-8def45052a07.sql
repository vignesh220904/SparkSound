-- Create users table with unique IDs
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unique_user_number SERIAL UNIQUE,
  email TEXT,
  preferred_language TEXT DEFAULT 'en-US',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin table
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create instructions table for admin-to-user communication
CREATE TABLE public.instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  original_language TEXT NOT NULL,
  translated_text TEXT,
  target_language TEXT,
  audio_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create speech history table
CREATE TABLE public.speech_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speech_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for instructions
CREATE POLICY "Users can view instructions sent to them" 
ON public.instructions 
FOR SELECT 
USING (target_user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update instruction status" 
ON public.instructions 
FOR UPDATE 
USING (target_user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all instructions" 
ON public.instructions 
FOR SELECT 
USING (admin_id IN (SELECT id FROM public.admins WHERE email = (auth.jwt() ->> 'email')));

CREATE POLICY "Admins can insert instructions" 
ON public.instructions 
FOR INSERT 
WITH CHECK (admin_id IN (SELECT id FROM public.admins WHERE email = (auth.jwt() ->> 'email')));

-- RLS Policies for speech history
CREATE POLICY "Users can view their own speech history" 
ON public.speech_history 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own speech history" 
ON public.speech_history 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()));

-- RLS Policy for admins (restrictive - only specific admin can access)
CREATE POLICY "Admin access only for sparksound admin" 
ON public.admins 
FOR ALL 
USING (email = 'sparksound2025@gmail.com');

-- Insert the admin user
INSERT INTO public.admins (email, password_hash) 
VALUES ('sparksound2025@gmail.com', crypt('V+visioners', gen_salt('bf')));

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (user_id, email, preferred_language)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'en-US'));
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instructions_updated_at
  BEFORE UPDATE ON public.instructions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for instructions table
ALTER TABLE public.instructions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructions;