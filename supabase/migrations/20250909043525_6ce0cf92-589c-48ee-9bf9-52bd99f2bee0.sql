-- Fix critical security vulnerability: Drop legacy tables with plaintext passwords and no RLS policies
-- These tables are not used by the current Supabase Auth implementation and represent a major security risk

-- Drop the legacy "Login page" table that stores plaintext passwords with no RLS
DROP TABLE IF EXISTS public."Login page";

-- Drop the legacy "Sign up" table that stores user data with no RLS  
DROP TABLE IF EXISTS public."Sign up";

-- Drop the legacy "Details" table that stores user data with no RLS
DROP TABLE IF EXISTS public."Details";

-- Verify all remaining tables have proper RLS policies enabled
-- (The users, admins, instructions, and speech_history tables already have proper RLS policies)