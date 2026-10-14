/**
 * Master PostgreSQL Schema Script for Atelier & Boutique Stitching.
 * Contains all DDL definitions, tables, indexes, storage bucket, RLS policies, and RPC functions.
 * Can be run directly in the Supabase SQL Editor.
 */

export const BOUTIQUE_MASTER_SQL = `-- ==============================================================================
-- ATELIER & BOUTIQUE STITCHING — MASTER DATABASE SCHEMA
-- Compatible with Supabase PostgreSQL
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/spuaqghmkdtcblggvzqm/sql
-- ==============================================================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. STITCHING ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stitching_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('ladies', 'kids')),
  service_type TEXT NOT NULL,
  category TEXT NOT NULL,
  design_reference TEXT,
  reference_image_url TEXT,
  reference_image_name TEXT,
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_stitching_orders_order_number ON public.stitching_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_stitching_orders_status ON public.stitching_orders(status);
CREATE INDEX IF NOT EXISTS idx_stitching_orders_created_at ON public.stitching_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stitching_orders_phone ON public.stitching_orders(phone);
CREATE INDEX IF NOT EXISTS idx_stitching_orders_user_id ON public.stitching_orders(user_id);

-- ==============================================================================
-- 2. MEASUREMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.stitching_orders(id) ON DELETE CASCADE,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('ladies', 'kids')),
  kameez_length TEXT,
  chest TEXT,
  waist TEXT,
  hips TEXT,
  shoulder TEXT,
  armhole TEXT,
  sleeve_length TEXT,
  trouser_length TEXT,
  shalwar_length TEXT,
  additional_measurements TEXT,
  unit TEXT NOT NULL DEFAULT 'inches',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_measurements_order_id ON public.measurements(order_id);

-- ==============================================================================
-- 3. PROFILES TABLE (Linked with Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ur')),
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_staff ON public.profiles(is_staff);

-- ==============================================================================
-- 4. CUSTOMER SAVED MEASUREMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_saved_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  customer_type TEXT NOT NULL DEFAULT 'ladies' CHECK (customer_type IN ('ladies', 'kids')),
  kameez_length TEXT,
  chest TEXT,
  waist TEXT,
  hips TEXT,
  shoulder TEXT,
  armhole TEXT,
  sleeve_length TEXT,
  trouser_length TEXT,
  shalwar_length TEXT,
  additional_measurements TEXT,
  unit TEXT NOT NULL DEFAULT 'inches' CHECK (unit IN ('inches', 'cm')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_saved_measurements_user_id ON public.customer_saved_measurements(user_id);

-- ==============================================================================
-- 5. ORDER INTERNAL NOTES (STAFF ONLY)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.stitching_orders(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_internal_notes_order_id ON public.order_internal_notes(order_id);

-- ==============================================================================
-- 6. POSTERS & VIDEOS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_urdu TEXT,
  title_roman_urdu TEXT,
  description TEXT,
  description_urdu TEXT,
  description_roman_urdu TEXT,
  image_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  video_url TEXT,
  video_thumbnail_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('Sale', 'New Arrival', 'Eid', 'Bridal', 'Party Wear', 'Ladies', 'Kids', 'Special Offer', 'Custom')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_posters_active ON public.posters(is_active);
CREATE INDEX IF NOT EXISTS idx_posters_featured ON public.posters(is_featured);

-- ==============================================================================
-- 7. STITCHING WORKERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stitching_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT NOT NULL CHECK (specialization IN ('Ladies Stitching', 'Kids Stitching', 'Bridal', 'Embroidery', 'Alterations', 'Cutting', 'Finishing', 'Custom Design')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_stitching_workers_status ON public.stitching_workers(status);

-- ==============================================================================
-- 8. STITCHING JOBS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stitching_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.stitching_orders(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES public.stitching_workers(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  stitching_status TEXT NOT NULL DEFAULT 'New' CHECK (stitching_status IN ('New', 'Pending', 'Assigned', 'Cutting', 'Stitching', 'Finishing', 'Ready', 'Delivered', 'Cancelled')),
  expected_completion_date DATE,
  stitching_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_stitching_jobs_order_id ON public.stitching_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_stitching_jobs_worker_id ON public.stitching_jobs(worker_id);

-- ==============================================================================
-- 9. BOUTIQUE DESIGNS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.boutique_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_urdu TEXT,
  name_roman_urdu TEXT,
  description TEXT,
  description_urdu TEXT,
  description_roman_urdu TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Daily Wear', 'Formal Wear', 'Party Wear', 'Bridal', 'Pakistani Suits', 'Kids', 'Ladies', 'Custom Stitching', 'Alterations', 'Embroidery', 'Other')),
  price NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_boutique_designs_active ON public.boutique_designs(is_active);

-- ==============================================================================
-- 10. BOUTIQUE SERVICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.boutique_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_urdu TEXT,
  title_roman_urdu TEXT,
  description TEXT,
  description_urdu TEXT,
  description_roman_urdu TEXT,
  category TEXT NOT NULL,
  pricing_type TEXT NOT NULL DEFAULT 'starting_at' CHECK (pricing_type IN ('fixed', 'starting_at', 'quotation')),
  fixed_price NUMERIC(10, 2),
  starting_price NUMERIC(10, 2),
  quotation_note TEXT,
  image_url TEXT,
  icon_name TEXT DEFAULT 'Scissors',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_boutique_services_active ON public.boutique_services(is_active);

-- ==============================================================================
-- 11. SALARY RECORDS TABLE (ADMIN ONLY)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.stitching_workers(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  base_salary NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bonus NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deduction NUMERIC(10, 2) NOT NULL DEFAULT 0,
  final_amount NUMERIC(10, 2) GENERATED ALWAYS AS (base_salary + bonus - deduction) STORED,
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Partially Paid')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_salary_records_worker ON public.salary_records(worker_id);

-- ==============================================================================
-- 12. CONTACT INQUIRIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Read', 'Contacted', 'Resolved', 'Archived')),
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);

-- ==============================================================================
-- 13. CUSTOMER REVIEWS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Hidden')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON public.customer_reviews(status);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_featured ON public.customer_reviews(is_featured);

-- ==============================================================================
-- 14. SALE ITEMS & OFFERS TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 15. SOCIAL MEDIA & ATELIER SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.social_media_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.stitching_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_saved_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stitching_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stitching_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutique_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutique_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_settings ENABLE ROW LEVEL SECURITY;

-- 1. Orders: Public submission allowed, authenticated viewing
DROP POLICY IF EXISTS "Allow public customer order submission" ON public.stitching_orders;
CREATE POLICY "Allow public customer order submission"
ON public.stitching_orders FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow order select" ON public.stitching_orders;
CREATE POLICY "Allow order select"
ON public.stitching_orders FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Allow order update" ON public.stitching_orders;
CREATE POLICY "Allow order update"
ON public.stitching_orders FOR UPDATE TO public
USING (true) WITH CHECK (true);

-- 2. Measurements: Public submission allowed
DROP POLICY IF EXISTS "Allow public measurements submission" ON public.measurements;
CREATE POLICY "Allow public measurements submission"
ON public.measurements FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow measurements select" ON public.measurements;
CREATE POLICY "Allow measurements select"
ON public.measurements FOR SELECT TO public
USING (true);

-- 3. Profiles
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Profiles self upsert" ON public.profiles;
CREATE POLICY "Profiles self upsert" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Saved Measurements
DROP POLICY IF EXISTS "Saved measurements all" ON public.customer_saved_measurements;
CREATE POLICY "Saved measurements all" ON public.customer_saved_measurements FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Internal Notes
DROP POLICY IF EXISTS "Internal notes all" ON public.order_internal_notes;
CREATE POLICY "Internal notes all" ON public.order_internal_notes FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. Posters
DROP POLICY IF EXISTS "Posters select" ON public.posters;
CREATE POLICY "Posters select" ON public.posters FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Posters modify" ON public.posters;
CREATE POLICY "Posters modify" ON public.posters FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. Workers & Stitching Jobs
DROP POLICY IF EXISTS "Workers all" ON public.stitching_workers;
CREATE POLICY "Workers all" ON public.stitching_workers FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Jobs all" ON public.stitching_jobs;
CREATE POLICY "Jobs all" ON public.stitching_jobs FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. Designs & Services
DROP POLICY IF EXISTS "Designs all" ON public.boutique_designs;
CREATE POLICY "Designs all" ON public.boutique_designs FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Services all" ON public.boutique_services;
CREATE POLICY "Services all" ON public.boutique_services FOR ALL TO public USING (true) WITH CHECK (true);

-- 9. Salaries
DROP POLICY IF EXISTS "Salaries all" ON public.salary_records;
CREATE POLICY "Salaries all" ON public.salary_records FOR ALL TO public USING (true) WITH CHECK (true);

-- 10. Inquiries & Reviews
DROP POLICY IF EXISTS "Inquiries all" ON public.contact_inquiries;
CREATE POLICY "Inquiries all" ON public.contact_inquiries FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Reviews all" ON public.customer_reviews;
CREATE POLICY "Reviews all" ON public.customer_reviews FOR ALL TO public USING (true) WITH CHECK (true);

-- 11. Sales & Social
DROP POLICY IF EXISTS "Sale items all" ON public.sale_items;
CREATE POLICY "Sale items all" ON public.sale_items FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Social settings all" ON public.social_media_settings;
CREATE POLICY "Social settings all" ON public.social_media_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKET FOR STITCHING REFERENCES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('stitching-references', 'stitching-references', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public access to stitching references" ON storage.objects;
CREATE POLICY "Public access to stitching references"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'stitching-references');

DROP POLICY IF EXISTS "Public upload to stitching references" ON storage.objects;
CREATE POLICY "Public upload to stitching references"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'stitching-references');

-- ==============================================================================
-- ORDER LOOKUP RPC FUNCTION (SECURE 2-FACTOR TRACKING)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.lookup_order_by_reference(
  p_order_number TEXT,
  p_phone TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order JSONB;
BEGIN
  SELECT to_jsonb(o.*) INTO v_order
  FROM public.stitching_orders o
  WHERE UPPER(o.order_number) = UPPER(TRIM(p_order_number))
  AND regexp_replace(o.phone, '[\\s-]', '', 'g') = regexp_replace(TRIM(p_phone), '[\\s-]', '', 'g')
  LIMIT 1;

  IF v_order IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'order_number', v_order->>'order_number',
    'customer_name', v_order->>'customer_name',
    'service_type', v_order->>'service_type',
    'customer_type', v_order->>'customer_type',
    'category', v_order->>'category',
    'status', v_order->>'status',
    'created_at', v_order->>'created_at',
    'updated_at', v_order->>'updated_at',
    'reference_image_name', v_order->>'reference_image_name',
    'reference_image_url', v_order->>'reference_image_url',
    'special_instructions', v_order->>'special_instructions'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
