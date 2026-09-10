-- =========================================================================
-- ENTERPRISE FESTIVAL PLATFORM - SUPABASE PRODUCTION DATABASE SCHEMA
-- Lambodara Utsav Association & Papi Reddy Palli Village Celebrations
-- Scalable, High-Performance, Bilingual (English/Telugu), Real-Time Ready
-- =========================================================================

-- 0. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (CLEAN SLATE RESET)
-- -------------------------------------------------------------------------
DROP TABLE IF EXISTS public.blessings CASCADE;
DROP TABLE IF EXISTS public.hero_media CASCADE;
DROP TABLE IF EXISTS public.admin_login_logs CASCADE;
DROP TABLE IF EXISTS public.memories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.festival_years CASCADE;

-- -------------------------------------------------------------------------
-- 2. TABLE: festival_years
-- -------------------------------------------------------------------------
CREATE TABLE public.festival_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_festival_years_published ON public.festival_years(is_published, year DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_festival_years_slug ON public.festival_years(slug);
CREATE INDEX idx_festival_years_metadata_gin ON public.festival_years USING GIN (metadata);

-- -------------------------------------------------------------------------
-- 3. TABLE: categories (Bilingual Festival Categorization)
-- -------------------------------------------------------------------------
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    telugu_name VARCHAR(100),
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    telugu_description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_order ON public.categories(display_order ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- -------------------------------------------------------------------------
-- 4. TABLE: memories (Photos, Videos, YouTube Embeds & Devotional Blessings)
-- -------------------------------------------------------------------------
CREATE TABLE public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID NOT NULL REFERENCES public.festival_years(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    title VARCHAR(255) NOT NULL,
    telugu_title VARCHAR(255),
    description TEXT,
    telugu_description TEXT,
    capture_date DATE DEFAULT CURRENT_DATE,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    card_path TEXT,
    full_path TEXT,
    hls_manifest_path TEXT,
    youtube_video_id VARCHAR(50), -- First-class YouTube video support
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- Video duration in seconds
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    blessing_count INTEGER NOT NULL DEFAULT 0,
    is_blessed BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compound & High-Throughput Performance Indexes
CREATE INDEX idx_memories_year_cat_pub ON public.memories(festival_year_id, category_id, is_published, display_order ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_memories_featured ON public.memories(is_featured) WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX idx_memories_media_type ON public.memories(media_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_memories_youtube_id ON public.memories(youtube_video_id) WHERE youtube_video_id IS NOT NULL;
CREATE INDEX idx_memories_blessings ON public.memories(blessing_count DESC, display_order ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_memories_metadata_gin ON public.memories USING GIN (metadata);

-- Full-text search and trigram indexes for instant discovery
CREATE INDEX idx_memories_fts ON public.memories USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_memories_title_trgm ON public.memories USING GIN (title gin_trgm_ops);

-- -------------------------------------------------------------------------
-- 5. TABLE: hero_media (Landing Carousel Assets)
-- -------------------------------------------------------------------------
CREATE TABLE public.hero_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    caption TEXT,
    alt TEXT,
    is_video BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hero_media_active_order ON public.hero_media(is_active, display_order ASC);

-- -------------------------------------------------------------------------
-- 6. TABLE: blessings (Real-time Devotional Blessing Telemetry)
-- -------------------------------------------------------------------------
CREATE TABLE public.blessings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL DEFAULT 'bless',
    user_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blessings_memory_created ON public.blessings(memory_id, created_at DESC);

-- -------------------------------------------------------------------------
-- 7. TABLE: admin_login_logs (Security & Auth Audit Trail)
-- -------------------------------------------------------------------------
CREATE TABLE public.admin_login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(50) NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_login_logs_created ON public.admin_login_logs(created_at DESC);
CREATE INDEX idx_admin_login_logs_email ON public.admin_login_logs(email);

-- -------------------------------------------------------------------------
-- 8. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- -------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_memories_updated_at ON public.memories;
CREATE TRIGGER set_memories_updated_at
    BEFORE UPDATE ON public.memories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_hero_media_updated_at ON public.hero_media;
CREATE TRIGGER set_hero_media_updated_at
    BEFORE UPDATE ON public.hero_media
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------------------
-- 9. REALTIME & ACCESS PERMISSIONS
-- -------------------------------------------------------------------------

-- -------------------------------------------------------------------------
-- 12. REALTIME SYNCHRONIZATION
-- -------------------------------------------------------------------------
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;

-- -------------------------------------------------------------------------
-- 13. SEED INITIAL DATA: OFFICIAL 9 CATEGORIES
-- -------------------------------------------------------------------------
INSERT INTO public.categories (name, telugu_name, slug, description, telugu_description, display_order) VALUES
('Aagaman', 'ఆగమనం', 'aagaman', 'Grand arrival and welcoming processional of Lord Vinayaka into Papi Reddy Palli mandap.', 'లంబోదరుని గ్రామ ప్రవేశం, స్వాగత శోభాయాత్ర మరియు వేడుకలు.', 1),
('Sthapana', 'స్థాపన', 'sthapana', 'Sacred consecration, idol installation, and Prana Pratishtha rituals.', 'గణపతి ప్రతిష్టాపన, ప్రాణ ప్రతిష్ఠ మరియు వేద మంత్రోచ్ఛారణలు.', 2),
('Pooja & Aarthi', 'పూజ మరియు హారతి', 'pooja-aarthi', 'Daily morning and evening Vedic rituals, brass lamp Aarti, and devotional stotram chanting.', 'నిత్య పూజలు, దివ్య మంగళ హారతులు మరియు సంధ్యా వందనం.', 3),
('Decoration', 'అలంకరణ', 'decoration', 'Traditional flower garlands, coconut leaf pandal arches, and divine mandap lighting decorations.', 'మండప శోభ, పుష్పాలంకరణ, విద్యుద్దీపాల వెలుగులు మరియు పందిరి అందాలు.', 4),
('Culturals', 'సాంస్కృతిక కార్యక్రమాలు', 'culturals', 'Devotional music, traditional folk dances, drama performances, and cultural stage programs.', 'భక్తి సంగీతం, నృత్య రూపకాలు, సాంస్కృతిక సాయంత్రాలు మరియు నాటకాలు.', 5),
('Games & Competitions', 'ఆటలు మరియు పోటీలు', 'games-competitions', 'Village community sports, children drawing competitions, and festive sports events.', 'చిన్నారుల ఆటలు, చిత్రలేఖన పోటీలు, గ్రామీణ క్రీడలు మరియు బహుమతుల ప్రదానం.', 6),
('Annaprasadam', 'అన్నప్రసాదం', 'annaprasadam', 'Community feast distribution and sacred Mahaprasadam serving to all devotees.', 'భక్తులకు మహా అన్నదానం, ప్రసాద వితరణ మరియు సేవా భావం.', 7),
('Random Clicks', 'ఇతర జ్ఞాపకాలు', 'random-clicks', 'Candid village moments, volunteer portraits, behind-the-scenes preparation, and festive smiles.', 'గ్రామస్తుల చిరునవ్వులు, స్వచ్ఛంద సేవకుల దృశ్యాలు మరియు మధుర జ్ఞాపకాలు.', 8),
('Visarjan', 'నిమజ్జనం', 'visarjan', 'Immersion procession, grand Nimajjanam rallies, gulal celebrations, and farewell rituals.', 'ఘన వీడ్కోలు, నిమజ్జన శోభాయాత్ర, రంగుల కేరింతలు మరియు గంగమ్మ ఒడికి లంబోదరుడు.', 9)
ON CONFLICT (slug) DO UPDATE 
SET 
    name = EXCLUDED.name,
    telugu_name = EXCLUDED.telugu_name,
    description = EXCLUDED.description,
    telugu_description = EXCLUDED.telugu_description,
    display_order = EXCLUDED.display_order;

-- -------------------------------------------------------------------------
-- 15. SEED INITIAL DATA: 2026 FESTIVAL YEAR
-- -------------------------------------------------------------------------
INSERT INTO public.festival_years (year, title, telugu_title, slug, description, telugu_description, is_published)
VALUES (
    2026,
    '2026 - Sri Vinayaka Chavithi Utsavalu',
    '2026 - శ్రీ వినాయక చవితి ఉత్సవాలు',
    '2026',
    'Annual Sri Vinayaka Chavithi Mahotsavam in Papi Reddy Palli village organized by Lambodara Utsav Association.',
    'పాపిరెడ్డి పల్లి గ్రామంలో లంబోదర ఉత్సవ అసోసియేషన్ ఆధ్వర్యంలో జరుగు వార్షిక శ్రీ వినాయక చవితి మహోత్సవాలు.',
    true
)
ON CONFLICT (year) DO NOTHING;
