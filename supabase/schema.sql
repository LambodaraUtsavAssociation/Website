-- ==========================================================
-- Enterprise Festival Years & Media Sanctuary Platform
-- Scalable, Future-Proof Supabase PostgreSQL Database Schema
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------
-- 1. TABLE: festival_years
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.festival_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    telugu_title VARCHAR(255),
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    telugu_description TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying published, active, non-deleted years
CREATE INDEX IF NOT EXISTS idx_festival_years_published ON public.festival_years(is_published, year DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_festival_years_slug ON public.festival_years(slug);
CREATE INDEX IF NOT EXISTS idx_festival_years_metadata_gin ON public.festival_years USING GIN (metadata);

-- ----------------------------------------------------------
-- 2. TABLE: categories
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    telugu_name VARCHAR(100),
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    telugu_description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordering active categories
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order ASC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ----------------------------------------------------------
-- 3. TABLE: memories
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    festival_year_id UUID NOT NULL REFERENCES public.festival_years(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    title VARCHAR(255) NOT NULL,
    telugu_title VARCHAR(255),
    description TEXT,
    telugu_description TEXT,
    capture_date DATE,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    card_path TEXT,
    full_path TEXT,
    hls_manifest_path TEXT,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- seconds for video
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compound & Specialized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_memories_year_cat_pub ON public.memories(festival_year_id, category_id, is_published, display_order ASC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memories_featured ON public.memories(is_featured) WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memories_media_type ON public.memories(media_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memories_metadata_gin ON public.memories USING GIN (metadata);

-- Full-text search index for instant memory discovery
CREATE INDEX IF NOT EXISTS idx_memories_fts ON public.memories USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ----------------------------------------------------------
-- 4. TABLE: tags & memory_tags (Future Categorization)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memory_tags (
    memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (memory_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_memory_tags_tag ON public.memory_tags(tag_id);

-- ----------------------------------------------------------
-- 5. TABLE: admin_users (Role-Based Authorization)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 6. TABLE: audit_logs (Enterprise Telemetry & Compliance)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ----------------------------------------------------------
-- 7. AUTOMATIC UPDATED_AT TRIGGER
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

DROP TRIGGER IF EXISTS set_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER set_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------
ALTER TABLE public.festival_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES
DROP POLICY IF EXISTS "Public can view published festival years" ON public.festival_years;
CREATE POLICY "Public can view published festival years"
    ON public.festival_years
    FOR SELECT
    USING (is_published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
    ON public.categories
    FOR SELECT
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Public can view published memories" ON public.memories;
CREATE POLICY "Public can view published memories"
    ON public.memories
    FOR SELECT
    USING (
        is_published = true 
        AND deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.festival_years fy 
            WHERE fy.id = memories.festival_year_id AND fy.is_published = true AND fy.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "Public can view tags" ON public.tags;
CREATE POLICY "Public can view tags" ON public.tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view memory_tags" ON public.memory_tags;
CREATE POLICY "Public can view memory_tags" ON public.memory_tags FOR SELECT USING (true);

-- ADMIN POLICIES (AUTHENTICATED WRITE ACCESS)
DROP POLICY IF EXISTS "Admin full access on festival_years" ON public.festival_years;
CREATE POLICY "Admin full access on festival_years"
    ON public.festival_years FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
CREATE POLICY "Admin full access on categories"
    ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on memories" ON public.memories;
CREATE POLICY "Admin full access on memories"
    ON public.memories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on tags" ON public.tags;
CREATE POLICY "Admin full access on tags"
    ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on memory_tags" ON public.memory_tags;
CREATE POLICY "Admin full access on memory_tags"
    ON public.memory_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Admin full access on audit_logs"
    ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------
-- 9. STORAGE BUCKETS & STORAGE RLS POLICIES
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
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('festival-media', 'festival-thumbnails'));

DROP POLICY IF EXISTS "Admin storage insert" ON storage.objects;
CREATE POLICY "Admin storage insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('festival-media', 'festival-thumbnails'));

DROP POLICY IF EXISTS "Admin storage update" ON storage.objects;
CREATE POLICY "Admin storage update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id IN ('festival-media', 'festival-thumbnails'));

DROP POLICY IF EXISTS "Admin storage delete" ON storage.objects;
CREATE POLICY "Admin storage delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id IN ('festival-media', 'festival-thumbnails'));
