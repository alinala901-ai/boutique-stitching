-- ==============================================================================
-- BOUTIQUE STITCHING — COMPLETE BOUTIQUE MANAGEMENT SYSTEM MIGRATION
-- Posters, Stitching Jobs, Workers, Designs, Services, Salaries, Inquiries, Reviews
-- ==============================================================================

-- 1. POSTERS TABLE
CREATE TABLE IF NOT EXISTS public.posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_urdu TEXT,
  description TEXT,
  description_urdu TEXT,
  image_url TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_posters_category ON public.posters(category);

-- 2. STITCHING WORKERS TABLE
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

-- 3. STITCHING JOBS TABLE
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
CREATE INDEX IF NOT EXISTS idx_stitching_jobs_status ON public.stitching_jobs(stitching_status);

-- 4. BOUTIQUE DESIGNS TABLE
CREATE TABLE IF NOT EXISTS public.boutique_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_urdu TEXT,
  description TEXT,
  description_urdu TEXT,
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
CREATE INDEX IF NOT EXISTS idx_boutique_designs_category ON public.boutique_designs(category);

-- 5. BOUTIQUE SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.boutique_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_urdu TEXT,
  description TEXT,
  description_urdu TEXT,
  category TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Scissors',
  starting_price NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_boutique_services_active ON public.boutique_services(is_active);

-- 6. SALARY RECORDS TABLE (ADMIN ONLY)
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
CREATE INDEX IF NOT EXISTS idx_salary_records_month ON public.salary_records(month_year);

-- 7. CONTACT INQUIRIES TABLE
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
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created ON public.contact_inquiries(created_at DESC);

-- 8. CUSTOMER REVIEWS TABLE
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
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL NEW TABLES
-- ==============================================================================
ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stitching_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stitching_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutique_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutique_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- 1. POSTERS POLICIES
CREATE POLICY "Public can view active posters"
ON public.posters FOR SELECT TO public
USING (is_active = TRUE);

CREATE POLICY "Staff and admin can view all posters"
ON public.posters FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

CREATE POLICY "Staff and admin can manage posters"
ON public.posters FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 2. WORKERS POLICIES (Staff and Admin only)
CREATE POLICY "Staff and admin can manage workers"
ON public.stitching_workers FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 3. STITCHING JOBS POLICIES (Staff and Admin only)
CREATE POLICY "Staff and admin can manage stitching jobs"
ON public.stitching_jobs FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 4. DESIGNS POLICIES
CREATE POLICY "Public can view active designs"
ON public.boutique_designs FOR SELECT TO public
USING (is_active = TRUE);

CREATE POLICY "Staff and admin can manage designs"
ON public.boutique_designs FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 5. SERVICES POLICIES
CREATE POLICY "Public can view active services"
ON public.boutique_services FOR SELECT TO public
USING (is_active = TRUE);

CREATE POLICY "Staff and admin can manage services"
ON public.boutique_services FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 6. SALARY RECORDS POLICIES — STRICT ADMIN ONLY!
-- Normal customers and staff have 0 access
CREATE POLICY "Only Admin can view salary records"
ON public.salary_records FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only Admin can manage salary records"
ON public.salary_records FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 7. CONTACT INQUIRIES POLICIES
CREATE POLICY "Anyone can submit contact inquiry"
ON public.contact_inquiries FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Staff and admin can manage contact inquiries"
ON public.contact_inquiries FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);

-- 8. CUSTOMER REVIEWS POLICIES
CREATE POLICY "Public can view approved reviews"
ON public.customer_reviews FOR SELECT TO public
USING (status = 'Approved');

CREATE POLICY "Anyone can submit review"
ON public.customer_reviews FOR INSERT TO public
WITH CHECK (status = 'Pending');

CREATE POLICY "Staff and admin can manage customer reviews"
ON public.customer_reviews FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_staff = TRUE OR role IN ('staff', 'admin'))
  )
);
