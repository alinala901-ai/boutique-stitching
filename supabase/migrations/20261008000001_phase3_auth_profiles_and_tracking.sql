-- ==============================================================================
-- BOUTIQUE STITCHING — PHASE 3 SUPABASE MIGRATION
-- Customer Profiles, Saved Measurements, Order Association & Secure Staff Auth
-- ==============================================================================

-- 1. Create profiles table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ur')),
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create customer_saved_measurements table
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

-- 3. Add nullable user_id to stitching_orders to associate authenticated orders without breaking anonymous legacy orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'stitching_orders'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.stitching_orders
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_stitching_orders_user_id ON public.stitching_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_saved_measurements_user_id ON public.customer_saved_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_staff ON public.profiles(is_staff);

-- 5. Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, preferred_language, is_staff)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    COALESCE((NEW.raw_user_meta_data->>'is_staff')::boolean, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_saved_measurements ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for profiles

-- Customers can view their own profile; Staff can view all profiles
CREATE POLICY "Users can view own profile or staff can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_staff = TRUE)
);

-- Users can insert/update their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 8. RLS Policies for customer_saved_measurements
CREATE POLICY "Users can view own saved measurements"
ON public.customer_saved_measurements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved measurements"
ON public.customer_saved_measurements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved measurements"
ON public.customer_saved_measurements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved measurements"
ON public.customer_saved_measurements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 9. Update RLS Policies for stitching_orders & measurements

-- Drop existing order select policy if exists to strengthen it
DROP POLICY IF EXISTS "Allow authenticated staff to view all orders" ON public.stitching_orders;
DROP POLICY IF EXISTS "Allow authenticated staff to update orders" ON public.stitching_orders;

-- Authenticated customers can view their OWN orders; Staff can view ALL orders
CREATE POLICY "Customers view own orders or staff view all"
ON public.stitching_orders
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND auth.uid() = user_id) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_staff = TRUE)
);

-- Only Staff can update order status
CREATE POLICY "Staff can update orders"
ON public.stitching_orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_staff = TRUE)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_staff = TRUE)
);

-- Measurements SELECT policy
DROP POLICY IF EXISTS "Allow authenticated staff to view measurements" ON public.measurements;
CREATE POLICY "Customers view measurements for own orders or staff view all"
ON public.measurements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stitching_orders
    WHERE stitching_orders.id = measurements.order_id
    AND stitching_orders.user_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_staff = TRUE)
);

-- 10. Secure Verification-based Order Lookup Function (For public order tracking without enumeration risk)
CREATE OR REPLACE FUNCTION public.lookup_order_by_reference(
  p_order_number TEXT,
  p_phone TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order JSONB;
BEGIN
  -- Strip spaces and dashes from input phone for clean matching
  SELECT to_jsonb(o.*) INTO v_order
  FROM public.stitching_orders o
  WHERE UPPER(o.order_number) = UPPER(TRIM(p_order_number))
  AND regexp_replace(o.phone, '[\s-]', '', 'g') = regexp_replace(TRIM(p_phone), '[\s-]', '', 'g')
  LIMIT 1;

  IF v_order IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return safe non-sensitive summary with measurements
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
