-- ==============================================================================
-- BOUTIQUE STITCHING — COMPLETE ADMIN DASHBOARD & WEBSITE UPDATE MIGRATION
-- Sale Items & Prices, Posters/Videos Media, Services & Pricing Types, Social Settings
-- ==============================================================================

-- 1. SALE ITEMS & OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_urdu TEXT,
  title_roman_urdu TEXT,
  description TEXT,
  description_urdu TEXT,
  description_roman_urdu TEXT,
  category TEXT NOT NULL CHECK (category IN ('ladies', 'kids')),
  original_price NUMERIC(10, 2) NOT NULL CHECK (original_price >= 0),
  sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0 AND sale_price <= original_price),
  discount_percentage INTEGER GENERATED ALWAYS AS (
    CASE WHEN original_price > 0 AND sale_price < original_price 
         THEN ROUND(((original_price - sale_price) / original_price) * 100)::INTEGER 
         ELSE 0 
    END
  ) STORED,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sale_items_active ON public.sale_items(is_active);
CREATE INDEX IF NOT EXISTS idx_sale_items_category ON public.sale_items(category);

-- 2. ENHANCE POSTERS TABLE WITH VIDEO SUPPORT & ROMAN URDU
ALTER TABLE public.posters 
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS title_roman_urdu TEXT,
  ADD COLUMN IF NOT EXISTS description_roman_urdu TEXT;

-- 3. ENHANCE BOUTIQUE DESIGNS WITH ROMAN URDU
ALTER TABLE public.boutique_designs 
  ADD COLUMN IF NOT EXISTS name_roman_urdu TEXT,
  ADD COLUMN IF NOT EXISTS description_roman_urdu TEXT;

-- 4. ENHANCE BOUTIQUE SERVICES WITH PRICING TYPE & ROMAN URDU
ALTER TABLE public.boutique_services 
  ADD COLUMN IF NOT EXISTS title_roman_urdu TEXT,
  ADD COLUMN IF NOT EXISTS description_roman_urdu TEXT,
  ADD COLUMN IF NOT EXISTS pricing_type TEXT NOT NULL DEFAULT 'starting_at' CHECK (pricing_type IN ('fixed', 'starting_at', 'quotation')),
  ADD COLUMN IF NOT EXISTS fixed_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS quotation_note TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. SOCIAL MEDIA & ATELIER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.social_media_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_settings ENABLE ROW LEVEL SECURITY;

-- Sale Items Policies
CREATE POLICY "Public can view active sale items"
ON public.sale_items FOR SELECT TO public
USING (is_active = TRUE);

CREATE POLICY "Staff and admin can view all sale items"
ON public.sale_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

CREATE POLICY "Staff and admin can manage sale items"
ON public.sale_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- Social Media Settings Policies
CREATE POLICY "Public can view social media settings"
ON public.social_media_settings FOR SELECT TO public
USING (TRUE);

CREATE POLICY "Staff and admin can manage social media settings"
ON public.social_media_settings FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);
