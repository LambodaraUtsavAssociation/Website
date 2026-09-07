-- =========================================================================
-- SUPABASE COMPLETE DATABASE SCHEMA & REALTIME SETUP
-- Lambodara Utsav Association & Papi Reddy Palli Admin Portal
-- =========================================================================

-- 1. ADD BLESSINGS COLUMNS TO MEMORIES TABLE
ALTER TABLE public.memories 
ADD COLUMN IF NOT EXISTS blessing_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_blessed BOOLEAN DEFAULT false;

-- 2. CREATE HERO MEDIA TABLE FOR HERO SECTION MANAGEMENT
CREATE TABLE IF NOT EXISTS public.hero_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  alt TEXT,
  is_video BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE ADMIN LOGIN AUDIT LOGS TABLE FOR AUTH TRACKING
CREATE TABLE IF NOT EXISTS public.admin_login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE BLESSINGS AUDIT TABLE FOR REALTIME DEVOTIONAL BLESSINGS TRACKING
CREATE TABLE IF NOT EXISTS public.blessings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'bless',
  user_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE REALTIME ON ALL PUBLIC TABLES
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;

-- 6. DISABLE RLS FOR PUBLIC ACCESS (OR PERMISSIVE POLICIES) FOR APP OPERATION
ALTER TABLE public.memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blessings DISABLE ROW LEVEL SECURITY;
