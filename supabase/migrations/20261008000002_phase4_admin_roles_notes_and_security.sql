-- ==============================================================================
-- BOUTIQUE STITCHING — PHASE 4 SUPABASE MIGRATION
-- Admin/Staff Role Authorization, Internal Notes & Storage Hardening
-- ==============================================================================

-- 1. Add role column to profiles table with strict check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin'));
  END IF;
END $$;

-- Synchronize legacy is_staff boolean with role column
UPDATE public.profiles
SET role = CASE
  WHEN is_staff = TRUE THEN 'staff'
  ELSE 'customer'
END
WHERE role = 'customer' AND is_staff = TRUE;

-- 2. Create Trigger to Prevent Self-Privilege Escalation
-- Customers cannot upgrade themselves to 'staff' or 'admin' via client-side API
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If attempting to modify role or is_staff
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.is_staff IS DISTINCT FROM OLD.is_staff) THEN
    -- Check if requesting user is already an admin or staff
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR is_staff = TRUE)
    ) THEN
      -- Silently preserve original authorization level
      NEW.role := OLD.role;
      NEW.is_staff := OLD.is_staff;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();

-- 3. Create Internal Staff Notes Table (Completely isolated from customers)
CREATE TABLE IF NOT EXISTS public.order_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.stitching_orders(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_internal_notes_order_id ON public.order_internal_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_internal_notes_created_at ON public.order_internal_notes(created_at DESC);

-- 4. Enable Row Level Security (RLS) on Internal Notes
ALTER TABLE public.order_internal_notes ENABLE ROW LEVEL SECURITY;

-- Policy 1: ONLY Staff and Admin can view internal notes
-- Customers have NO policy to select from order_internal_notes
CREATE POLICY "Staff and admin can view internal notes"
ON public.order_internal_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- Policy 2: ONLY Staff and Admin can create internal notes
CREATE POLICY "Staff and admin can create internal notes"
ON public.order_internal_notes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 5. Harden RLS on stitching_orders to respect role IN ('staff', 'admin')
DROP POLICY IF EXISTS "Customers view own orders or staff view all" ON public.stitching_orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.stitching_orders;

CREATE POLICY "Customers view own orders or staff view all"
ON public.stitching_orders
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND auth.uid() = user_id) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

CREATE POLICY "Staff and admin can update orders"
ON public.stitching_orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 6. Harden measurements RLS
DROP POLICY IF EXISTS "Customers view measurements for own orders or staff view all" ON public.measurements;
DROP POLICY IF EXISTS "Allow authenticated staff to update measurements" ON public.measurements;

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
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

CREATE POLICY "Staff and admin can update measurements"
ON public.measurements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 7. Storage RLS Hardening for 'stitching-references'
-- Drop wide open select policy and restrict listing/browsing
DROP POLICY IF EXISTS "Allow public read of customer design references" ON storage.objects;

-- Allow authenticated staff/admin full read access to customer design references
CREATE POLICY "Staff and admin can view design references"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'stitching-references' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- Customers can view only images associated with their own order
CREATE POLICY "Customers can view their own order references"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'stitching-references' AND
  EXISTS (
    SELECT 1 FROM public.stitching_orders
    WHERE stitching_orders.user_id = auth.uid()
    AND (
      stitching_orders.reference_image_url LIKE '%' || name || '%'
      OR name LIKE '%' || stitching_orders.order_number || '%'
    )
  )
);

-- 8. Customer Profile Directory Query (For Staff/Admin only)
CREATE OR REPLACE FUNCTION public.get_staff_customer_directory()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  preferred_language TEXT,
  role TEXT,
  order_count BIGINT,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify caller is staff or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only atelier staff or administrators can view customer directory';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email::TEXT,
    p.phone,
    p.preferred_language,
    p.role,
    COUNT(o.id)::BIGINT AS order_count,
    MAX(o.created_at) AS last_order_at,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.stitching_orders o ON o.user_id = p.id
  GROUP BY p.id, p.full_name, u.email, p.phone, p.preferred_language, p.role, p.created_at
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
