-- ==========================================================
-- Village Vinayaka Chavithi Digital Memories — Supabase Schema
-- ==========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------
-- 1. TABLE: festival_years
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.festival_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying published years quickly
CREATE INDEX IF NOT EXISTS idx_festival_years_published ON public.festival_years(is_published, year DESC);

-- ----------------------------------------------------------
-- 2. TABLE: categories
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordering categories
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order ASC);

-- ----------------------------------------------------------
-- 3. TABLE: memories
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    festival_year_id UUID NOT NULL REFERENCES public.festival_years(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    capture_date DATE,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- seconds for video
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memories_year ON public.memories(festival_year_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON public.memories(category_id);
CREATE INDEX IF NOT EXISTS idx_memories_featured ON public.memories(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_memories_published ON public.memories(is_published);
CREATE INDEX IF NOT EXISTS idx_memories_display_order ON public.memories(display_order ASC, created_at DESC);

-- ----------------------------------------------------------
-- 4. AUTOMATIC UPDATED_AT TRIGGER
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_festival_years_updated_at ON public.festival_years;
CREATE TRIGGER set_festival_years_updated_at
    BEFORE UPDATE ON public.festival_years
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_memories_updated_at ON public.memories;
CREATE TRIGGER set_memories_updated_at
    BEFORE UPDATE ON public.memories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------
ALTER TABLE public.festival_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES
DROP POLICY IF EXISTS "Public can view published festival years" ON public.festival_years;
CREATE POLICY "Public can view published festival years"
    ON public.festival_years
    FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Public can view all categories" ON public.categories;
CREATE POLICY "Public can view all categories"
    ON public.categories
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view published memories" ON public.memories;
CREATE POLICY "Public can view published memories"
    ON public.memories
    FOR SELECT
    USING (
        is_published = true 
        AND EXISTS (
            SELECT 1 FROM public.festival_years fy 
            WHERE fy.id = memories.festival_year_id AND fy.is_published = true
        )
    );

-- ADMIN POLICIES (ALL OPERATIONS FOR AUTHENTICATED USERS)
DROP POLICY IF EXISTS "Admin full access on festival_years" ON public.festival_years;
CREATE POLICY "Admin full access on festival_years"
    ON public.festival_years
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
CREATE POLICY "Admin full access on categories"
    ON public.categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on memories" ON public.memories;
CREATE POLICY "Admin full access on memories"
    ON public.memories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------
-- 6. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ----------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('festival-media', 'festival-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('festival-thumbnails', 'festival-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Public storage read" ON storage.objects;
CREATE POLICY "Public storage read"
    ON storage.objects
    FOR SELECT
    USING (bucket_id IN ('festival-media', 'festival-thumbnails'));

DROP POLICY IF EXISTS "Admin storage insert" ON storage.objects;
CREATE POLICY "Admin storage insert"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id IN ('festival-media', 'festival-thumbnails'));

DROP POLICY IF EXISTS "Admin storage update" ON storage.objects;
CREATE POLICY "Admin storage update"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id IN ('festival-media', 'festival-thumbnails'));

DROP POLICY IF EXISTS "Admin storage delete" ON storage.objects;
CREATE POLICY "Admin storage delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id IN ('festival-media', 'festival-thumbnails'));
