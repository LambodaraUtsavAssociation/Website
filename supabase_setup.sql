-- =========================================================================
-- SUPABASE COMPLETE DATABASE SCHEMA & SECURE REALTIME SETUP
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
  failure_reason TEXT,
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

-- 5. ENABLE REALTIME ON PUBLIC READ TABLES
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.memories, 
    public.festival_years, 
    public.categories, 
    public.hero_media, 
    public.blessings;
COMMIT;

-- 6. ENABLE ROW LEVEL SECURITY (RLS) FOR PROD DEFENSE-IN-DEPTH
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blessings ENABLE ROW LEVEL SECURITY;

-- 7. DEFINE GRANULAR ACCESS POLICIES

-- Memories: Public read for published items; Authenticated/Service-Role for mutations
DROP POLICY IF EXISTS "Public read published memories" ON public.memories;
CREATE POLICY "Public read published memories" ON public.memories
  FOR SELECT USING (is_published = true OR auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin mutate memories" ON public.memories;
CREATE POLICY "Admin mutate memories" ON public.memories
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Festival Years: Public read for published years; Admin mutate
DROP POLICY IF EXISTS "Public read published festival_years" ON public.festival_years;
CREATE POLICY "Public read published festival_years" ON public.festival_years
  FOR SELECT USING (is_published = true OR auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin mutate festival_years" ON public.festival_years;
CREATE POLICY "Admin mutate festival_years" ON public.festival_years
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Categories: Public read; Admin mutate
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin mutate categories" ON public.categories;
CREATE POLICY "Admin mutate categories" ON public.categories
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Hero Media: Public read active; Admin mutate
DROP POLICY IF EXISTS "Public read hero_media" ON public.hero_media;
CREATE POLICY "Public read hero_media" ON public.hero_media
  FOR SELECT USING (is_active = true OR auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin mutate hero_media" ON public.hero_media;
CREATE POLICY "Admin mutate hero_media" ON public.hero_media
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Blessings: Public read & insert
DROP POLICY IF EXISTS "Public read blessings" ON public.blessings;
CREATE POLICY "Public read blessings" ON public.blessings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert blessings" ON public.blessings;
CREATE POLICY "Public insert blessings" ON public.blessings
  FOR INSERT WITH CHECK (true);

-- Admin Login Logs: Insert allowed for logger; Read restricted to authenticated/service_role
DROP POLICY IF EXISTS "Insert admin login logs" ON public.admin_login_logs;
CREATE POLICY "Insert admin login logs" ON public.admin_login_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read login logs" ON public.admin_login_logs;
CREATE POLICY "Admin read login logs" ON public.admin_login_logs
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Atomic Blessing Functions (Prevents race conditions under high concurrent traffic)
CREATE OR REPLACE FUNCTION increment_blessing(mem_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE memories
  SET blessing_count = COALESCE(blessing_count, 0) + 1,
      is_blessed = true,
      updated_at = NOW()
  WHERE id = mem_id
  RETURNING blessing_count INTO new_count;
  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_blessing(mem_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE memories
  SET blessing_count = GREATEST(0, COALESCE(blessing_count, 0) - 1),
      is_blessed = (GREATEST(0, COALESCE(blessing_count, 0) - 1) > 0),
      updated_at = NOW()
  WHERE id = mem_id
  RETURNING blessing_count INTO new_count;
  RETURN new_count;
END;
$$;

