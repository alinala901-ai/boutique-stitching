-- ==============================================================================
-- BOUTIQUE STITCHING — PHASE 2 SUPABASE MIGRATION
-- Tables: stitching_orders, measurements
-- Storage: stitching-references bucket
-- Row Level Security (RLS) & Policies
-- ==============================================================================

-- 1. Create stitching_orders table
CREATE TABLE IF NOT EXISTS public.stitching_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
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

-- 2. Create measurements table
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

-- 3. Create Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_stitching_orders_status ON public.stitching_orders(status);
CREATE INDEX IF NOT EXISTS idx_stitching_orders_created_at ON public.stitching_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stitching_orders_phone ON public.stitching_orders(phone);
CREATE INDEX IF NOT EXISTS idx_measurements_order_id ON public.measurements(order_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.stitching_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for stitching_orders

-- Policy 1: Public Customers can insert new consultation requests
CREATE POLICY "Allow public customer order submission"
ON public.stitching_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Public Customers cannot browse other customers' orders
-- Only authenticated users (admins/staff) can view orders
CREATE POLICY "Allow authenticated staff to view all orders"
ON public.stitching_orders
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Only authenticated staff can update order status
CREATE POLICY "Allow authenticated staff to update orders"
ON public.stitching_orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. RLS Policies for measurements

-- Policy 1: Public Customers can insert measurements attached to their order
CREATE POLICY "Allow public customer measurements submission"
ON public.measurements
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Only authenticated staff can view customer measurements
CREATE POLICY "Allow authenticated staff to view measurements"
ON public.measurements
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Only authenticated staff can update measurements
CREATE POLICY "Allow authenticated staff to update measurements"
ON public.measurements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Supabase Storage Bucket Setup for 'stitching-references'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stitching-references',
  'stitching-references',
  true,
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Storage RLS Policies
CREATE POLICY "Allow public upload of customer design references"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'stitching-references' AND
  (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp'))
);

CREATE POLICY "Allow public read of customer design references"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'stitching-references');

CREATE POLICY "Allow authenticated staff to delete design references"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'stitching-references');
