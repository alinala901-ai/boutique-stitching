export type Language = 'en' | 'ur' | 'roman_ur';
export type Direction = 'ltr' | 'rtl';

export interface StitchingService {
  id: string;
  nameKey: string;
  descKey: string;
  iconName: string;
  category: 'ladies' | 'kids' | 'specialized';
}

export interface CollectionItem {
  id: string;
  titleKey: string;
  descKey: string;
  category: 'ladies' | 'kids';
  subcategory: string;
  imageKey?: string;
  imageUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  titleUrdu: string;
  titleRomanUrdu?: string;
  category: 'ladies' | 'kids' | 'bridal' | 'party' | 'suits' | 'custom';
  categoryLabel: string;
  categoryLabelUrdu: string;
  imageUrl: string;
  alt: string;
  description: string;
  descriptionUrdu: string;
  descriptionRomanUrdu?: string;
  price?: number;
  isFeatured?: boolean;
}

export interface HowItWorksStep {
  step: string;
  titleKey: string;
  descKey: string;
}

export interface WhyChooseUsItem {
  id: string;
  titleKey: string;
  descKey: string;
}

export type OrderStatus =
  | 'new'
  | 'reviewing'
  | 'confirmed'
  | 'in_progress'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderMeasurement {
  id?: string;
  order_id?: string;
  customer_type: 'ladies' | 'kids';
  kameez_length?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  shoulder?: string;
  armhole?: string;
  sleeve_length?: string;
  trouser_length?: string;
  shalwar_length?: string;
  additional_measurements?: string;
  unit: 'inches' | 'cm';
  created_at?: string;
}

export interface StitchingOrder {
  id: string;
  user_id?: string | null;
  order_number: string;
  customer_name: string;
  phone: string;
  email?: string;
  customer_type: 'ladies' | 'kids';
  service_type: string;
  category: string;
  design_reference?: string;
  reference_image_url?: string;
  reference_image_name?: string;
  special_instructions?: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  measurements?: OrderMeasurement;
  internal_notes?: OrderInternalNote[];
}

export type UserRole = 'customer' | 'staff' | 'admin';

export interface OrderInternalNote {
  id: string;
  order_id: string;
  author_id?: string;
  author_name: string;
  note: string;
  created_at: string;
}

export interface CustomerDirectoryItem {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  customer_type?: 'ladies' | 'kids';
  order_count: number;
  last_order_at?: string;
  role: UserRole;
  is_guest?: boolean;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  preferred_language: Language;
  is_staff: boolean;
  role?: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerSavedMeasurements {
  id?: string;
  user_id?: string;
  customer_type: 'ladies' | 'kids';
  kameez_length?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  shoulder?: string;
  armhole?: string;
  sleeve_length?: string;
  trouser_length?: string;
  shalwar_length?: string;
  additional_measurements?: string;
  unit: 'inches' | 'cm';
  updated_at?: string;
}

export interface OrderLookupResult {
  order_number: string;
  customer_name: string;
  service_type: string;
  customer_type: 'ladies' | 'kids';
  category: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  reference_image_name?: string;
  reference_image_url?: string;
  special_instructions?: string;
}

export interface ConsultationFormState {
  step: number;
  customer_type: 'ladies' | 'kids';
  service_type: string;
  category: string;
  customer_name: string;
  phone: string;
  email: string;
  measurements: {
    kameez_length: string;
    chest: string;
    waist: string;
    hips: string;
    shoulder: string;
    armhole: string;
    sleeve_length: string;
    trouser_length: string;
    shalwar_length: string;
    additional_measurements: string;
    unit: 'inches' | 'cm';
  };
  reference_file: File | null;
  reference_preview_url: string | null;
  reference_image_name: string;
  special_instructions: string;
  use_saved_measurements?: boolean;
}

export interface MeasurementGuideItem {
  id: string;
  name: string;
  nameUrdu: string;
  tip: string;
  tipUrdu: string;
  instruction: string;
  instructionUrdu: string;
}

// ==============================================================================
// COMPLETE BOUTIQUE MANAGEMENT SYSTEM TYPES
// ==============================================================================

export type PosterCategory =
  | 'Sale'
  | 'New Arrival'
  | 'Eid Collection'
  | 'Bridal'
  | 'Party Wear'
  | 'Ladies'
  | 'Kids'
  | 'Special Offers'
  | 'Custom Designs'
  | 'Eid'
  | 'Special Offer'
  | 'Custom';

export interface Poster {
  id: string;
  title: string;
  title_urdu?: string;
  title_roman_urdu?: string;
  description?: string;
  description_urdu?: string;
  description_roman_urdu?: string;
  media_type?: 'image' | 'video';
  image_url: string;
  video_url?: string;
  video_thumbnail_url?: string;
  category: PosterCategory;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  title: string;
  title_urdu?: string;
  title_roman_urdu?: string;
  description?: string;
  description_urdu?: string;
  description_roman_urdu?: string;
  category: 'ladies' | 'kids';
  original_price: number;
  sale_price: number;
  discount_percentage?: number;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  start_date?: string;
  end_date?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type WorkerSpecialization =
  | 'Ladies Stitching'
  | 'Kids Stitching'
  | 'Bridal'
  | 'Embroidery'
  | 'Alterations'
  | 'Cutting'
  | 'Finishing'
  | 'Custom Design';

export interface StitchingWorker {
  id: string;
  name: string;
  phone?: string;
  specialization: WorkerSpecialization;
  status: 'active' | 'inactive' | 'on_leave';
  joining_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  active_jobs_count?: number;
  completed_jobs_count?: number;
}

export type StitchingJobStatus =
  | 'New'
  | 'Pending'
  | 'Assigned'
  | 'Cutting'
  | 'Stitching'
  | 'Finishing'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled';

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface StitchingJob {
  id: string;
  order_id: string;
  worker_id?: string | null;
  priority: JobPriority;
  stitching_status: StitchingJobStatus;
  expected_completion_date?: string;
  stitching_notes?: string;
  created_at: string;
  updated_at: string;
  order?: StitchingOrder;
  worker?: StitchingWorker;
}

export type DesignCategory =
  | 'Daily Wear'
  | 'Formal Wear'
  | 'Party Wear'
  | 'Bridal'
  | 'Pakistani Suits'
  | 'Kids'
  | 'Ladies'
  | 'Embroidery'
  | 'Custom Designs'
  | 'Alterations'
  | 'Custom Stitching'
  | 'Other';

export interface BoutiqueDesign {
  id: string;
  name: string;
  name_urdu?: string;
  name_roman_urdu?: string;
  description?: string;
  description_urdu?: string;
  description_roman_urdu?: string;
  image_url: string;
  category: DesignCategory;
  price?: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type ServicePricingType = 'fixed' | 'starting_at' | 'quotation';

export interface BoutiqueServiceItem {
  id: string;
  title: string;
  title_urdu?: string;
  title_roman_urdu?: string;
  description?: string;
  description_urdu?: string;
  description_roman_urdu?: string;
  category: string;
  icon_name?: string;
  pricing_type?: ServicePricingType;
  fixed_price?: number;
  starting_price?: number;
  sale_price?: number;
  discount_percent?: number;
  quotation_note?: string;
  image_url?: string;
  is_featured?: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SalaryRecord {
  id: string;
  worker_id: string;
  month_year: string;
  base_salary: number;
  bonus: number;
  deduction: number;
  final_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Partially Paid';
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  worker?: StitchingWorker;
}

export interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'New' | 'Read' | 'Contacted' | 'Resolved' | 'Archived';
  internal_note?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerReview {
  id: string;
  customer_name: string;
  customer_id?: string | null;
  rating: number; // 1 - 5
  review_text: string;
  image_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Hidden';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type AdminModule =
  | 'dashboard'
  | 'posters'
  | 'sale'
  | 'stitching'
  | 'workers'
  | 'designs'
  | 'services'
  | 'salaries'
  | 'inquiries'
  | 'reviews'
  | 'customers'
  | 'orders'
  | 'measurements'
  | 'whatsapp'
  | 'settings';

