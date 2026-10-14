import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  StitchingOrder,
  OrderMeasurement,
  OrderStatus,
  UserProfile,
  CustomerSavedMeasurements,
  OrderLookupResult,
  OrderInternalNote,
  CustomerDirectoryItem,
  Poster,
  StitchingWorker,
  StitchingJob,
  BoutiqueDesign,
  BoutiqueServiceItem,
  SalaryRecord,
  ContactInquiry,
  CustomerReview,
  SaleItem,
} from '../types';

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  isConfigured: boolean;
}

export const DEFAULT_SUPABASE_URL = 'https://spuaqghmkdtcblggvzqm.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Up9guOvb40QyJfma5Sj3tA_T7Vjg7NG';

const CUSTOM_SUPABASE_URL_KEY = 'boutique_custom_supabase_url';
const CUSTOM_SUPABASE_KEY_KEY = 'boutique_custom_supabase_anon_key';

export const getSupabaseConfig = (): SupabaseConfig => {
  let customUrl: string | null = null;
  let customKey: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem(CUSTOM_SUPABASE_URL_KEY);
      customKey = localStorage.getItem(CUSTOM_SUPABASE_KEY_KEY);
    } catch {
      // ignore localStorage errors in sandboxed contexts
    }
  }

  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : undefined;
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

  const url = customUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = customKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
  };
};

export const saveCustomSupabaseConfig = (url: string, anonKey: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(CUSTOM_SUPABASE_KEY_KEY, anonKey.trim());
    clientInstance = null; // Invalidate cached instance
  } catch (err) {
    console.warn('Could not save Supabase config to localStorage:', err);
  }
};

export const resetSupabaseConfig = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CUSTOM_SUPABASE_URL_KEY);
    localStorage.removeItem(CUSTOM_SUPABASE_KEY_KEY);
    clientInstance = null;
  } catch (err) {
    console.warn('Could not reset Supabase config:', err);
  }
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  url: string;
  latencyMs?: number;
  tablesReady?: boolean;
}> => {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url) {
    return {
      success: false,
      message: 'Supabase URL or Key is missing.',
      url: config.url || '',
      tablesReady: false,
    };
  }

  const start = performance.now();
  try {
    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        message: 'Could not instantiate Supabase client.',
        url: config.url,
        tablesReady: false,
      };
    }

    const { error: sessionError } = await client.auth.getSession();
    const latencyMs = Math.round(performance.now() - start);

    if (sessionError) {
      return {
        success: false,
        message: `Connection returned: ${sessionError.message}`,
        url: config.url,
        latencyMs,
        tablesReady: false,
      };
    }

    // Probe if public.stitching_orders table is created in Supabase Postgres
    const { error: tableError } = await client
      .from('stitching_orders')
      .select('id')
      .limit(1);

    if (tableError) {
      // PGRST205: relation/table not found in PostgREST schema cache
      if (
        tableError.code === 'PGRST205' ||
        tableError.message?.toLowerCase().includes('schema cache') ||
        tableError.message?.toLowerCase().includes('could not find the table') ||
        tableError.message?.toLowerCase().includes('does not exist')
      ) {
        return {
          success: true,
          tablesReady: false,
          message: `Connected to Supabase (${latencyMs}ms), but database tables (e.g. 'stitching_orders') have not been initialized in Postgres yet. Run the SQL setup script to activate cloud sync.`,
          url: config.url,
          latencyMs,
        };
      }
      // Any other non-fatal table warning
      return {
        success: true,
        tablesReady: false,
        message: `Connected to Supabase (${latencyMs}ms). Table notice: ${tableError.message}`,
        url: config.url,
        latencyMs,
      };
    }

    return {
      success: true,
      tablesReady: true,
      message: `Successfully connected to Supabase (${config.url}) in ${latencyMs}ms! All database tables are online and operational.`,
      url: config.url,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      message: err?.message || 'Connection test failed',
      url: config.url,
      latencyMs,
      tablesReady: false,
    };
  }
};

// Local storage fallback keys for offline/dev synchronization
const LOCAL_ORDERS_KEY = 'boutique_stitching_orders_db';
const LOCAL_PROFILES_KEY = 'boutique_stitching_profiles_db';
const LOCAL_MEASUREMENTS_KEY = 'boutique_stitching_saved_measurements_db';

export const getLocalOrders = (): StitchingOrder[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Notice reading local orders cache:', err);
    return [];
  }
};

export const saveLocalOrder = (order: StitchingOrder): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalOrders();
    const updated = [order, ...existing.filter((o) => o.id !== order.id)];
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Notice saving local order:', err);
  }
};

/**
 * Generates human-friendly order reference numbers: BS-2026-XXXX
 */
export const generateOrderNumber = (): string => {
  const year = 2026;
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BS-${year}-${randomChars}`;
};

/**
 * Uploads customer reference image to Supabase Storage bucket 'stitching-references'.
 */
export const uploadReferenceImageToStorage = async (
  file: File,
  orderNumber: string
): Promise<{ url: string | null; error: string | null }> => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    return {
      url: null,
      error: 'Invalid file format. Please upload JPG, PNG, or WEBP only.',
    };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      url: null,
      error: 'File size exceeds 10MB limit. Please upload a smaller image.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      url: URL.createObjectURL(file),
      error: null,
    };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `customer-references/${orderNumber}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await client.storage
      .from('stitching-references')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Storage upload fallback to object url:', uploadError.message);
      return {
        url: URL.createObjectURL(file),
        error: null,
      };
    }

    const { data: publicUrlData } = client.storage
      .from('stitching-references')
      .getPublicUrl(filePath);

    return {
      url: publicUrlData?.publicUrl || null,
      error: null,
    };
  } catch (err) {
    console.warn('Storage upload fallback to object url:', err);
    return {
      url: URL.createObjectURL(file),
      error: null,
    };
  }
};

/**
 * Submits stitching consultation order & measurements.
 * Links to user_id if customer is authenticated.
 */
export const submitStitchingConsultation = async (params: {
  customer_name: string;
  phone: string;
  email?: string;
  user_id?: string | null;
  customer_type: 'ladies' | 'kids';
  service_type: string;
  category: string;
  special_instructions?: string;
  measurements: {
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
  };
  reference_file?: File | null;
}): Promise<{ order: StitchingOrder | null; error: string | null }> => {
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();
  let referenceImageUrl: string | undefined = undefined;

  // 1. Upload image if present
  if (params.reference_file) {
    const uploadRes = await uploadReferenceImageToStorage(params.reference_file, orderNumber);
    if (uploadRes.error) {
      return { order: null, error: uploadRes.error };
    }
    if (uploadRes.url) {
      referenceImageUrl = uploadRes.url;
    }
  }

  const client = getSupabaseClient();

  if (client) {
    try {
      // Insert stitching_orders
      const { data: orderData, error: orderError } = await client
        .from('stitching_orders')
        .insert({
          user_id: params.user_id || null,
          order_number: orderNumber,
          customer_name: params.customer_name.trim(),
          phone: params.phone.trim(),
          email: params.email?.trim() || null,
          customer_type: params.customer_type,
          service_type: params.service_type,
          category: params.category,
          special_instructions: params.special_instructions?.trim() || null,
          reference_image_url: referenceImageUrl || null,
          reference_image_name: params.reference_file?.name || null,
          status: 'new',
        })
        .select()
        .single();

      if (orderError) {
        console.warn('Supabase order insert notice (table missing or schema updating):', orderError.message);
        throw new Error(orderError.message);
      }

      // Insert measurements
      const { data: measureData, error: measureError } = await client
        .from('measurements')
        .insert({
          order_id: orderData.id,
          customer_type: params.customer_type,
          kameez_length: params.measurements.kameez_length || null,
          chest: params.measurements.chest || null,
          waist: params.measurements.waist || null,
          hips: params.measurements.hips || null,
          shoulder: params.measurements.shoulder || null,
          armhole: params.measurements.armhole || null,
          sleeve_length: params.measurements.sleeve_length || null,
          trouser_length: params.measurements.trouser_length || null,
          shalwar_length: params.measurements.shalwar_length || null,
          additional_measurements: params.measurements.additional_measurements || null,
          unit: params.measurements.unit,
        })
        .select()
        .single();

      if (measureError) {
        console.warn('Supabase measurement insert notice:', measureError.message);
      }

      const completedOrder: StitchingOrder = {
        ...orderData,
        measurements: measureData || {
          ...params.measurements,
          customer_type: params.customer_type,
        },
      };

      saveLocalOrder(completedOrder);
      return { order: completedOrder, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Database notice occurred';
      console.warn('Saving order smoothly to local boutique cache:', errorMsg);
    }
  }

  // Graceful Local Fallback: Creates complete validated order object
  const fallbackOrder: StitchingOrder = {
    id: `local-${Date.now()}`,
    user_id: params.user_id || null,
    order_number: orderNumber,
    customer_name: params.customer_name.trim(),
    phone: params.phone.trim(),
    email: params.email?.trim() || undefined,
    customer_type: params.customer_type,
    service_type: params.service_type,
    category: params.category,
    special_instructions: params.special_instructions?.trim() || undefined,
    reference_image_url: referenceImageUrl,
    reference_image_name: params.reference_file?.name,
    status: 'new',
    created_at: now,
    updated_at: now,
    measurements: {
      customer_type: params.customer_type,
      ...params.measurements,
      created_at: now,
    },
  };

  saveLocalOrder(fallbackOrder);
  return { order: fallbackOrder, error: null };
};

/**
 * Public Order Lookup with two-factor verification (Order Reference + Phone).
 * Prevents ID enumeration attacks by matching both fields strictly.
 */
export const lookupOrderByReferenceAndPhone = async (
  orderNumber: string,
  phone: string
): Promise<{ order: OrderLookupResult | null; error: string | null }> => {
  const cleanOrderNum = orderNumber.trim().toUpperCase();
  const cleanPhone = phone.replace(/[\s-]/g, '').trim();

  if (!cleanOrderNum || !cleanPhone) {
    return { order: null, error: 'Please provide both Order Reference and Phone Number.' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.rpc('lookup_order_by_reference', {
        p_order_number: cleanOrderNum,
        p_phone: cleanPhone,
      });

      if (!error && data) {
        return { order: data as OrderLookupResult, error: null };
      }
    } catch (err) {
      console.warn('RPC lookup failed, checking local store:', err);
    }
  }

  // Check local fallback
  const localOrders = getLocalOrders();
  const matched = localOrders.find(
    (o) =>
      o.order_number.toUpperCase() === cleanOrderNum &&
      o.phone.replace(/[\s-]/g, '').trim() === cleanPhone
  );

  if (matched) {
    const result: OrderLookupResult = {
      order_number: matched.order_number,
      customer_name: matched.customer_name,
      service_type: matched.service_type,
      customer_type: matched.customer_type,
      category: matched.category,
      status: matched.status,
      created_at: matched.created_at,
      updated_at: matched.updated_at,
      reference_image_name: matched.reference_image_name,
      reference_image_url: matched.reference_image_url,
      special_instructions: matched.special_instructions,
    };
    return { order: result, error: null };
  }

  return { order: null, error: 'No matching order found for the provided reference and phone.' };
};

/**
 * Customer Profile Management
 */
export const fetchCustomerProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        return data as UserProfile;
      }
    } catch (err) {
      console.warn('Error fetching profile from Supabase:', err);
    }
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILES_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const upsertCustomerProfile = async (
  profile: Partial<UserProfile> & { id: string }
): Promise<boolean> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  if (client) {
    try {
      const { error } = await client.from('profiles').upsert({
        ...profile,
        updated_at: now,
      });
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase profile notice, using local storage:', err);
    }
  }

  // Local fallback
  try {
    const existing = await fetchCustomerProfile(profile.id);
    const updated = { ...existing, ...profile, updated_at: now };
    localStorage.setItem(`${LOCAL_PROFILES_KEY}_${profile.id}`, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

/**
 * Saved Measurements Management
 */
export const fetchSavedMeasurements = async (
  userId: string
): Promise<CustomerSavedMeasurements | null> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('customer_saved_measurements')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        return data as CustomerSavedMeasurements;
      }
    } catch (err) {
      console.warn('Error fetching saved measurements from Supabase:', err);
    }
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(`${LOCAL_MEASUREMENTS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveCustomerMeasurements = async (
  measurements: CustomerSavedMeasurements & { user_id: string }
): Promise<boolean> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  if (client) {
    try {
      const { error } = await client.from('customer_saved_measurements').upsert(
        {
          ...measurements,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      );
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase measurements notice, saving to local store:', err);
    }
  }

  // Local fallback
  try {
    localStorage.setItem(
      `${LOCAL_MEASUREMENTS_KEY}_${measurements.user_id}`,
      JSON.stringify({ ...measurements, updated_at: now })
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Fetches all orders belonging to a specific authenticated customer.
 */
export const fetchOrdersForUser = async (userId: string): Promise<StitchingOrder[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('stitching_orders')
        .select(`
          *,
          measurements (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          measurements: item.measurements?.[0] || item.measurements,
        }));
      }
    } catch (err) {
      console.warn('Error fetching user orders from Supabase:', err);
    }
  }

  // Local fallback
  const localOrders = getLocalOrders();
  return localOrders.filter((o) => o.user_id === userId);
};

/**
 * Fetches all orders for authorized Staff/Admin (with optional internal notes).
 */
export const fetchOrders = async (): Promise<StitchingOrder[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('stitching_orders')
        .select(`
          *,
          measurements (*),
          order_internal_notes (*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          measurements: item.measurements?.[0] || item.measurements,
          internal_notes: item.order_internal_notes || [],
        }));
      }
    } catch (err) {
      console.warn('Could not fetch from Supabase, loading from local cache:', err);
    }
  }

  // Local fallback with local notes merged
  const localOrders = getLocalOrders();
  const localNotes = getLocalNotes();
  return localOrders.map((order) => ({
    ...order,
    internal_notes: localNotes.filter((n) => n.order_id === order.id),
  }));
};

/**
 * Updates order status (Staff/Admin operation).
 */
export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus
): Promise<boolean> => {
  const client = getSupabaseClient();
  if (client && !orderId.startsWith('local-')) {
    try {
      const { error } = await client
        .from('stitching_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (!error) {
        const local = getLocalOrders();
        const updated = local.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
        return true;
      }
    } catch (err) {
      console.warn('Supabase status update notice, updating local storage:', err);
    }
  }

  const local = getLocalOrders();
  const updated = local.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  return true;
};

// Local storage key for internal staff notes
const LOCAL_NOTES_KEY = 'boutique_stitching_internal_notes_db';

export const getLocalNotes = (): OrderInternalNote[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Notice reading local notes:', err);
    return [];
  }
};

export const saveLocalNote = (note: OrderInternalNote): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalNotes();
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify([note, ...existing]));
  } catch (err) {
    console.warn('Notice saving local note:', err);
  }
};

/**
 * Internal Staff Notes (Completely isolated from customer views)
 */
export const fetchOrderNotes = async (orderId: string): Promise<OrderInternalNote[]> => {
  const client = getSupabaseClient();
  if (client && !orderId.startsWith('local-')) {
    try {
      const { data, error } = await client
        .from('order_internal_notes')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as OrderInternalNote[];
      }
    } catch (err) {
      console.warn('Error fetching internal notes from Supabase:', err);
    }
  }

  const localNotes = getLocalNotes();
  return localNotes.filter((n) => n.order_id === orderId);
};

export const addOrderNote = async (
  orderId: string,
  noteText: string,
  authorName: string,
  authorId?: string
): Promise<OrderInternalNote | null> => {
  const cleanNote = noteText.trim();
  if (!cleanNote) return null;

  const now = new Date().toISOString();
  const client = getSupabaseClient();

  if (client && !orderId.startsWith('local-')) {
    try {
      const { data, error } = await client
        .from('order_internal_notes')
        .insert({
          order_id: orderId,
          note: cleanNote,
          author_name: authorName,
          author_id: authorId || null,
        })
        .select()
        .single();

      if (!error && data) {
        saveLocalNote(data as OrderInternalNote);
        return data as OrderInternalNote;
      }
    } catch (err) {
      console.warn('Supabase internal note notice, saving to local store:', err);
    }
  }

  // Local fallback
  const newNote: OrderInternalNote = {
    id: `note-${Date.now()}`,
    order_id: orderId,
    note: cleanNote,
    author_name: authorName,
    author_id: authorId,
    created_at: now,
  };

  saveLocalNote(newNote);
  return newNote;
};

/**
 * Customer Directory for Staff/Admin
 */
export const fetchCustomerDirectory = async (): Promise<CustomerDirectoryItem[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.rpc('get_staff_customer_directory');
      if (!error && data) {
        return data as CustomerDirectoryItem[];
      }
    } catch (err) {
      console.warn('RPC customer directory failed, compiling from available tables:', err);
    }
  }

  // Compile from local orders and profiles
  const orders = getLocalOrders();
  const customerMap = new Map<string, CustomerDirectoryItem>();

  for (const order of orders) {
    const key = order.phone.replace(/[^0-9]/g, '') || order.customer_name;
    const existing = customerMap.get(key);
    if (existing) {
      existing.order_count += 1;
      if (new Date(order.created_at) > new Date(existing.last_order_at || '1970')) {
        existing.last_order_at = order.created_at;
      }
    } else {
      customerMap.set(key, {
        id: order.user_id || `guest-${key}`,
        full_name: order.customer_name,
        email: order.email,
        phone: order.phone,
        customer_type: order.customer_type,
        order_count: 1,
        last_order_at: order.created_at,
        role: 'customer',
        is_guest: !order.user_id,
      });
    }
  }

  return Array.from(customerMap.values());
};

/**
 * Resolves secure / signed image URLs from Supabase Storage
 */
export const getSecureImageUrl = async (pathOrUrl?: string): Promise<string> => {
  if (!pathOrUrl) return '';

  // If already a blob or full external url, return directly
  if (pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      // Attempt signed URL for private access
      const cleanPath = pathOrUrl.replace(/^.*\/customer-references\//, 'customer-references/');
      const { data, error } = await client.storage
        .from('stitching-references')
        .createSignedUrl(cleanPath, 3600); // 1 hour token

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err) {
      console.warn('Signed URL generation failed:', err);
    }
  }

  return pathOrUrl;
};

// ==============================================================================
// 1. POSTER MANAGEMENT (CRUD)
// ==============================================================================
const LOCAL_POSTERS_KEY = 'boutique_posters_db';

const INITIAL_5_POSTERS: Poster[] = [
  {
    id: 'poster-1',
    title: 'Festive Stitching Mega Sale (Flat 25% Off)',
    title_urdu: 'فیسٹیو سیزن سلائی پر 25% فلیٹ رعایت',
    title_roman_urdu: 'Festive Season Silai Par Flat 25% Discount',
    description: 'Special 25% discount on all 3-piece formal, lawn & chiffon suit stitching with organza finishing.',
    description_urdu: 'تمام 3-پیس فارمل اور لان سوٹس کی سلائی پر 25% رعایت، کٹ ورک دامن اور خوبصورت فیسنگ کے ساتھ۔',
    description_roman_urdu: 'Tamam 3-piece formal aur lawn suits ki silai par 25% off, organza facing aur cut-work ke sath.',
    image_url: '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
    category: 'Sale',
    is_active: true,
    is_featured: true,
    display_order: 1,
    start_date: '2026-10-01',
    end_date: '2026-11-30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'poster-2',
    title: 'Royal Bridal Couture & Zardozi Handwork',
    title_urdu: 'شاہانہ برائیڈل کوٹور، زردوزی اور لہنگا چولی',
    title_roman_urdu: 'Shahana Bridal Couture, Zardozi Aur Lehenga Choli',
    description: 'Bespoke wedding outfits crafted with authentic dabka, sitara, and handcrafted embroidery for your unforgettable day.',
    description_urdu: 'خالص دبکہ، ستارہ، زردوزی اور ہاتھ کی نفاست سے سلے ہوئے شاہانہ عروسی جوڑے اور میکسی۔',
    description_roman_urdu: 'Khaalis dabka, sitara aur zardozi karhai se silwayein apne shaadi ke shandar bridal joray.',
    image_url: '/src/assets/images/bridal_couture_stitching_1791431932649.jpg',
    category: 'Bridal',
    is_active: true,
    is_featured: true,
    display_order: 2,
    start_date: '2026-10-05',
    end_date: '2026-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'poster-3',
    title: 'Designer Ladies Stitched Suits & Silk Cuts',
    title_urdu: 'خواتین کے ڈیزائنر سلے ہوئے سوٹس اور فینسی کٹس',
    title_roman_urdu: 'Khawateen Ke Designer Sile Hue Suits Aur Cuts',
    description: 'Trendy bell sleeves, loop necklines, cigarette pants, and tulip shalwar tailored to precision.',
    description_urdu: 'جدید بیل سلیوز، لوپ نیک لائنز، سگریٹ پینٹس اور ٹیولپ شلواروں کی پرفیکٹ فٹنگ سلائی۔',
    description_roman_urdu: 'Trendy bell sleeves, loop buttons neckline, cigarette pants aur tulip shalwar ki perfect silai.',
    image_url: '/src/assets/images/homepage_ladies_teal_formal_1791433341529.jpg',
    category: 'Ladies',
    is_active: true,
    is_featured: false,
    display_order: 3,
    start_date: '2026-10-01',
    end_date: '2026-12-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'poster-4',
    title: 'Kids Festive Traditional Kurtas & Frocks',
    title_urdu: 'بچوں کے روایتی فیسٹیو کرتے، پاجامے اور فراکس',
    title_roman_urdu: 'Bachon Ke Traditional Festive Kurta Pajama & Frocks',
    description: 'Ultra-gentle soft cotton lining, skin-friendly inner seams, and vibrant festive colors for boys & girls.',
    description_urdu: 'بچوں کے لیے نرم اور آرام دہ سوتی استر، بغیر چبھن کے نفیس سلائی اور شاندار رنگ۔',
    description_roman_urdu: 'Bachon ke liye naram astar, aaram-deh silai aur Eid ke pur-kashish rang.',
    image_url: '/src/assets/images/homepage_kids_blue_suit_1791433355604.jpg',
    category: 'Kids',
    is_active: true,
    is_featured: false,
    display_order: 4,
    start_date: '2026-10-01',
    end_date: '2026-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'poster-5',
    title: 'Express 48-Hour Tailoring & Perfect Fit Guarantee',
    title_urdu: 'ایکسپریس 48 گھنٹے ارجنٹ سلائی اور فٹنگ گارنٹی',
    title_roman_urdu: 'Express 48-Hours Urgent Silai Aur Fitting Guarantee',
    description: 'Need emergency stitching for an upcoming wedding or function? Get your suit ready in 48 hours with 100% fit guarantee.',
    description_urdu: 'کسی تقریب کے لیے فوری سلائی درکار ہے؟ صرف 48 گھنٹوں میں 100% پرفیکٹ فٹنگ کے ساتھ سوٹ تیار پائیں۔',
    description_roman_urdu: 'Kissi taqreeb ke liye urgent silai darkar hai? Sirf 48 ghantay mein guaranteed fitting ke sath suit tayar.',
    image_url: '/src/assets/images/craftsmanship_custom_tailoring_1791431948318.jpg',
    category: 'Special Offers',
    is_active: true,
    is_featured: true,
    display_order: 5,
    start_date: '2026-10-01',
    end_date: '2026-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const getLocalPosters = (): Poster[] => {
  if (typeof window === 'undefined') return INITIAL_5_POSTERS;
  try {
    const raw = localStorage.getItem(LOCAL_POSTERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 5) {
        return parsed;
      }
    }
    // If fewer than 5 posters exist or not saved yet, save and return all 5
    localStorage.setItem(LOCAL_POSTERS_KEY, JSON.stringify(INITIAL_5_POSTERS));
    return INITIAL_5_POSTERS;
  } catch {
    return INITIAL_5_POSTERS;
  }
};

export const fetchPosters = async (): Promise<Poster[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('posters')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as Poster[];
    } catch (err) {
      console.warn('Error fetching posters from Supabase, using local cache:', err);
    }
  }
  return getLocalPosters();
};

export const isPosterCurrentlyPublished = (poster: Poster): boolean => {
  if (!poster.is_active) return false;
  const now = new Date();
  if (poster.start_date) {
    const start = new Date(poster.start_date);
    if (!isNaN(start.getTime()) && now < start) return false;
  }
  if (poster.end_date) {
    const end = new Date(poster.end_date);
    end.setHours(23, 59, 59, 999);
    if (!isNaN(end.getTime()) && now > end) return false;
  }
  return true;
};

export const fetchActivePosters = async (): Promise<Poster[]> => {
  const client = getSupabaseClient();
  let list: Poster[] = [];
  if (client) {
    try {
      const { data, error } = await client
        .from('posters')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) list = data as Poster[];
    } catch {
      // ignore
    }
  }
  if (list.length === 0) {
    list = getLocalPosters().filter((p) => p.is_active);
  }
  return list.filter(isPosterCurrentlyPublished);
};

export const upsertPoster = async (poster: Partial<Poster>): Promise<{ success: boolean; error: string | null; poster?: Poster }> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const posterToSave: Poster = {
    id: poster.id || `poster-${Date.now()}`,
    title: poster.title || 'Untitled Poster',
    title_urdu: poster.title_urdu || '',
    title_roman_urdu: poster.title_roman_urdu || '',
    description: poster.description || '',
    description_urdu: poster.description_urdu || '',
    description_roman_urdu: poster.description_roman_urdu || '',
    media_type: poster.media_type || (poster.video_url ? 'video' : 'image'),
    image_url: poster.image_url || '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
    video_url: poster.video_url || undefined,
    video_thumbnail_url: poster.video_thumbnail_url || undefined,
    category: poster.category || 'Special Offers',
    is_active: poster.is_active ?? true,
    is_featured: poster.is_featured ?? false,
    display_order: poster.display_order ?? 0,
    start_date: poster.start_date || undefined,
    end_date: poster.end_date || undefined,
    created_at: poster.created_at || now,
    updated_at: now,
  };

  // Sync with local storage
  const current = getLocalPosters();
  const exists = current.findIndex((p) => p.id === posterToSave.id);
  const updatedList = exists >= 0
    ? current.map((p) => (p.id === posterToSave.id ? posterToSave : p))
    : [posterToSave, ...current];
  localStorage.setItem(LOCAL_POSTERS_KEY, JSON.stringify(updatedList));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_posters_updated', { detail: posterToSave }));
    window.dispatchEvent(new Event('storage'));
  }

  if (client) {
    try {
      const { error } = await client.from('posters').upsert(posterToSave);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      console.warn('Poster remote upsert error, local saved:', err);
    }
  }
  return { success: true, error: null, poster: posterToSave };
};

export const deletePoster = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalPosters();
  localStorage.setItem(LOCAL_POSTERS_KEY, JSON.stringify(current.filter((p) => p.id !== id)));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_posters_updated'));
    window.dispatchEvent(new Event('storage'));
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('posters').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

// ==============================================================================
// 2. STITCHING WORKERS & JOBS (STITCHING MANAGEMENT)
// ==============================================================================
const LOCAL_WORKERS_KEY = 'boutique_workers_db';
const LOCAL_JOBS_KEY = 'boutique_stitching_jobs_db';

const getLocalWorkers = (): StitchingWorker[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_WORKERS_KEY);
    if (raw) return JSON.parse(raw);
    const defaults: StitchingWorker[] = [
      {
        id: 'worker-1',
        name: 'Master Muhammad Tariq',
        phone: '0300-8765432',
        specialization: 'Ladies Stitching',
        status: 'active',
        joining_date: '2023-01-15',
        notes: 'Senior cutting master and ladies formal expert with 18 years experience.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'worker-2',
        name: 'Ustad Abdul Ghafoor',
        phone: '0321-7654321',
        specialization: 'Bridal',
        status: 'active',
        joining_date: '2023-06-01',
        notes: 'Heavy zardozi, neckline embroidery finishing and lehenga specialist.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'worker-3',
        name: 'Rashid Tailor',
        phone: '0312-3456789',
        specialization: 'Kids Stitching',
        status: 'active',
        joining_date: '2024-02-10',
        notes: 'Children frocks, kurta pajama and delicate lining work.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'worker-4',
        name: 'Nadeem Master',
        phone: '0345-6789012',
        specialization: 'Cutting',
        status: 'active',
        joining_date: '2024-05-18',
        notes: 'Accurate fabric patterning and master measurement adjustments.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(LOCAL_WORKERS_KEY, JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
};

export const fetchWorkers = async (): Promise<StitchingWorker[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('stitching_workers')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data && data.length > 0) return data as StitchingWorker[];
    } catch {
      // ignore
    }
  }
  return getLocalWorkers();
};

export const upsertWorker = async (worker: Partial<StitchingWorker>): Promise<{ success: boolean; error: string | null; worker?: StitchingWorker }> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const workerToSave: StitchingWorker = {
    id: worker.id || `worker-${Date.now()}`,
    name: worker.name || 'Unnamed Worker',
    phone: worker.phone || '',
    specialization: worker.specialization || 'Ladies Stitching',
    status: worker.status || 'active',
    joining_date: worker.joining_date || new Date().toISOString().split('T')[0],
    notes: worker.notes || '',
    created_at: worker.created_at || now,
    updated_at: now,
  };

  const current = getLocalWorkers();
  const exists = current.findIndex((w) => w.id === workerToSave.id);
  const updatedList = exists >= 0
    ? current.map((w) => (w.id === workerToSave.id ? workerToSave : w))
    : [workerToSave, ...current];
  localStorage.setItem(LOCAL_WORKERS_KEY, JSON.stringify(updatedList));

  if (client) {
    try {
      const { error } = await client.from('stitching_workers').upsert(workerToSave);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      console.warn('Worker remote save error:', err);
    }
  }
  return { success: true, error: null, worker: workerToSave };
};

export const deleteWorker = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalWorkers();
  localStorage.setItem(LOCAL_WORKERS_KEY, JSON.stringify(current.filter((w) => w.id !== id)));

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('stitching_workers').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

// Stitching Jobs
const getLocalJobs = (): StitchingJob[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const fetchStitchingJobs = async (): Promise<StitchingJob[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('stitching_jobs')
        .select('*, order:stitching_orders(*), worker:stitching_workers(*)')
        .order('created_at', { ascending: false });
      if (!error && data) return data as StitchingJob[];
    } catch {
      // ignore
    }
  }
  return getLocalJobs();
};

export const upsertStitchingJob = async (job: Partial<StitchingJob>): Promise<{ success: boolean; error: string | null; job?: StitchingJob }> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const jobToSave: StitchingJob = {
    id: job.id || `job-${Date.now()}`,
    order_id: job.order_id!,
    worker_id: job.worker_id || null,
    priority: job.priority || 'medium',
    stitching_status: job.stitching_status || 'Assigned',
    expected_completion_date: job.expected_completion_date || undefined,
    stitching_notes: job.stitching_notes || '',
    created_at: job.created_at || now,
    updated_at: now,
  };

  const current = getLocalJobs();
  const exists = current.findIndex((j) => j.id === jobToSave.id);
  const updatedList = exists >= 0
    ? current.map((j) => (j.id === jobToSave.id ? jobToSave : j))
    : [jobToSave, ...current];
  localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(updatedList));

  if (client) {
    try {
      const { error } = await client.from('stitching_jobs').upsert(jobToSave);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      console.warn('Job remote save error:', err);
    }
  }
  return { success: true, error: null, job: jobToSave };
};

// ==============================================================================
// 3. DESIGN & SERVICES MANAGEMENT (CRUD)
// ==============================================================================
const LOCAL_DESIGNS_KEY = 'boutique_designs_db';
const LOCAL_SERVICES_KEY = 'boutique_services_db';

const getLocalDesigns = (): BoutiqueDesign[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_DESIGNS_KEY);
    if (raw) return JSON.parse(raw);
    const defaults: BoutiqueDesign[] = [
      {
        id: 'des-1',
        name: 'Peach Scalloped 3-Piece Silk Suit',
        name_urdu: 'Peach Rang Ka Resham Aur Scallop 3-Piece Suit',
        description: 'Fine floral embroidery on peach lawn shirt with scalloped organza dupatta.',
        description_urdu: 'Peach fabric par safaid resham karhai aur organza dupatta.',
        image_url: '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
        category: 'Pakistani Suits',
        price: 4850,
        is_active: true,
        is_featured: true,
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'des-2',
        name: 'Teal Formal Embroidered Suit',
        name_urdu: 'Teal Peacock Silk Formal Suit',
        description: 'Rich peacock teal silhouette with resham neckline and bell sleeves.',
        description_urdu: 'Shahana teal silk par resham neckline aur statement bell sleeves.',
        image_url: '/src/assets/images/homepage_ladies_teal_formal_1791433341529.jpg',
        category: 'Party Wear',
        price: 6200,
        is_active: true,
        is_featured: true,
        display_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'des-3',
        name: 'Royal Blue Kids Festive Ensemble',
        name_urdu: 'Bachiyon Ka Royal Blue Festive Suit',
        description: 'Charming festive suit with comfortable inner tailoring and dupatta.',
        description_urdu: 'Bachiyon kay liye Eid aur taqreebat par aaram-deh 3-piece suit.',
        image_url: '/src/assets/images/homepage_kids_blue_suit_1791433355604.jpg',
        category: 'Kids',
        price: 3150,
        is_active: true,
        is_featured: false,
        display_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'des-4',
        name: 'Magenta Festive Flared Lehenga Choli',
        name_urdu: 'Magenta Floral Lehenga Choli Gota Patti',
        description: 'Voluminous flared floral lehenga with gold gota trim and dupatta.',
        description_urdu: 'Flared silk lehenga phoolon walay print aur gota patti border kay sath.',
        image_url: '/src/assets/images/homepage_party_magenta_lehenga_1791433369559.jpg',
        category: 'Bridal',
        price: 9500,
        is_active: true,
        is_featured: true,
        display_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(LOCAL_DESIGNS_KEY, JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
};

export const fetchDesigns = async (): Promise<BoutiqueDesign[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('boutique_designs')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as BoutiqueDesign[];
    } catch {
      // ignore
    }
  }
  return getLocalDesigns();
};

export const fetchActiveDesigns = async (): Promise<BoutiqueDesign[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('boutique_designs')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) return data as BoutiqueDesign[];
    } catch {
      // ignore
    }
  }
  return getLocalDesigns().filter((d) => d.is_active);
};

export const upsertDesign = async (design: Partial<BoutiqueDesign>): Promise<{ success: boolean; error: string | null; design?: BoutiqueDesign }> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const designToSave: BoutiqueDesign = {
    id: design.id || `des-${Date.now()}`,
    name: design.name || 'Unnamed Design',
    name_urdu: design.name_urdu || '',
    name_roman_urdu: design.name_roman_urdu || '',
    description: design.description || '',
    description_urdu: design.description_urdu || '',
    description_roman_urdu: design.description_roman_urdu || '',
    image_url: design.image_url || '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
    category: design.category || 'Pakistani Suits',
    price: design.price || 0,
    is_active: design.is_active ?? true,
    is_featured: design.is_featured ?? false,
    display_order: design.display_order ?? 0,
    created_at: design.created_at || now,
    updated_at: now,
  };

  const current = getLocalDesigns();
  const exists = current.findIndex((d) => d.id === designToSave.id);
  const updatedList = exists >= 0
    ? current.map((d) => (d.id === designToSave.id ? designToSave : d))
    : [designToSave, ...current];
  localStorage.setItem(LOCAL_DESIGNS_KEY, JSON.stringify(updatedList));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_designs_updated'));
  }

  if (client) {
    try {
      const { error } = await client.from('boutique_designs').upsert(designToSave);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      console.warn('Design remote save error:', err);
    }
  }
  return { success: true, error: null, design: designToSave };
};

export const deleteDesign = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalDesigns();
  localStorage.setItem(LOCAL_DESIGNS_KEY, JSON.stringify(current.filter((d) => d.id !== id)));

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('boutique_designs').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

// Services CRUD
const getLocalServices = (): BoutiqueServiceItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_SERVICES_KEY);
    if (raw) return JSON.parse(raw);
    const defaults: BoutiqueServiceItem[] = [
      { id: 'srv-1', title: 'Ladies Stitching', title_urdu: 'Ladies Silai', description: 'Everyday, formal and festive cuts.', description_urdu: 'Rozmarrah aur formal joron ki silai.', category: 'ladies', starting_price: 1800, is_active: true, display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'srv-2', title: 'Kids Stitching', title_urdu: 'Bachon Ki Silai', description: 'Gentle and neat outfits for children.', description_urdu: 'Bachon kay aaram-deh malboosaat.', category: 'kids', starting_price: 1200, is_active: true, display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'srv-3', title: 'Pakistani Suits', title_urdu: 'Pakistani Suits', description: 'Traditional 2 & 3-piece lawn, silk & chiffon.', description_urdu: '2-piece aur 3-piece lawn, silk suits.', category: 'suits', starting_price: 2200, is_active: true, display_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'srv-4', title: 'Bridal Couture', title_urdu: 'Bridal Silai', description: 'Detailed zardozi, dabka & bridal tailoring.', description_urdu: 'Baraat aur walima kay bridal joray.', category: 'bridal', starting_price: 8000, is_active: true, display_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'srv-5', title: 'Party Wear', title_urdu: 'Party Wear', description: 'Celebrations, Eid & festive dress finishes.', description_urdu: 'Taqreebat aur Eid kay suits.', category: 'party', starting_price: 3500, is_active: true, display_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'srv-6', title: 'Custom Alterations', title_urdu: 'Alterations / Fitting', description: 'Precision adjustments & resizing.', description_urdu: 'Fitting aur durustagi ki sahulat.', category: 'alterations', starting_price: 500, is_active: true, display_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
};

export const fetchBoutiqueServices = async (): Promise<BoutiqueServiceItem[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('boutique_services')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) return data as BoutiqueServiceItem[];
    } catch {
      // ignore
    }
  }
  return getLocalServices();
};

export const upsertBoutiqueService = async (service: Partial<BoutiqueServiceItem>): Promise<{ success: boolean; error: string | null; service?: BoutiqueServiceItem }> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const serviceToSave: BoutiqueServiceItem = {
    id: service.id || `srv-${Date.now()}`,
    title: service.title || 'Untitled Service',
    title_urdu: service.title_urdu || '',
    title_roman_urdu: service.title_roman_urdu || '',
    description: service.description || '',
    description_urdu: service.description_urdu || '',
    description_roman_urdu: service.description_roman_urdu || '',
    category: service.category || 'Ladies Stitching',
    icon_name: service.icon_name || 'Scissors',
    pricing_type: service.pricing_type || 'starting_at',
    fixed_price: service.fixed_price !== undefined ? service.fixed_price : undefined,
    starting_price: service.starting_price !== undefined ? service.starting_price : undefined,
    sale_price: service.sale_price !== undefined ? service.sale_price : undefined,
    discount_percent: service.discount_percent !== undefined ? service.discount_percent : undefined,
    quotation_note: service.quotation_note || '',
    image_url: service.image_url || '',
    is_featured: service.is_featured ?? false,
    is_active: service.is_active ?? true,
    display_order: service.display_order ?? 0,
    created_at: service.created_at || now,
    updated_at: now,
  };

  const current = getLocalServices();
  const exists = current.findIndex((s) => s.id === serviceToSave.id);
  const updatedList = exists >= 0
    ? current.map((s) => (s.id === serviceToSave.id ? serviceToSave : s))
    : [serviceToSave, ...current];
  localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(updatedList));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_services_updated'));
  }

  if (client) {
    try {
      const { error } = await client.from('boutique_services').upsert(serviceToSave);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      console.warn('Service remote save error:', err);
    }
  }
  return { success: true, error: null, service: serviceToSave };
};

export const deleteBoutiqueService = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalServices();
  localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(current.filter((s) => s.id !== id)));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_services_updated'));
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('boutique_services').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

// Aliases for unified module naming
export {
  fetchDesigns as fetchBoutiqueDesigns,
  upsertDesign as upsertBoutiqueDesign,
  deleteDesign as deleteBoutiqueDesign,
  fetchWorkers as fetchStitchingWorkers,
  upsertWorker as upsertStitchingWorker,
  deleteWorker as deleteStitchingWorker,
};

// ==============================================================================
// 4. SALARY MANAGEMENT (ADMIN ONLY)
// ==============================================================================
const LOCAL_SALARIES_KEY = 'boutique_salaries_db';

const getLocalSalaries = (): SalaryRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_SALARIES_KEY);
    if (raw) return JSON.parse(raw);
    const defaults: SalaryRecord[] = [
      {
        id: 'sal-1',
        worker_id: 'worker-1',
        month_year: 'October 2026',
        base_salary: 45000,
        bonus: 5000,
        deduction: 0,
        final_amount: 50000,
        payment_status: 'Paid',
        payment_date: '2026-10-05',
        notes: 'Monthly master salary + Eid delivery performance bonus.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sal-2',
        worker_id: 'worker-2',
        month_year: 'October 2026',
        base_salary: 42000,
        bonus: 3000,
        deduction: 1500,
        final_amount: 43500,
        payment_status: 'Paid',
        payment_date: '2026-10-06',
        notes: 'Bridal craftsmanship incentive minus 1 day emergency leave.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sal-3',
        worker_id: 'worker-3',
        month_year: 'October 2026',
        base_salary: 32000,
        bonus: 0,
        deduction: 0,
        final_amount: 32000,
        payment_status: 'Pending',
        payment_date: undefined,
        notes: 'Kids department standard monthly payroll.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sal-4',
        worker_id: 'worker-4',
        month_year: 'October 2026',
        base_salary: 35000,
        bonus: 2000,
        deduction: 0,
        final_amount: 37000,
        payment_status: 'Pending',
        payment_date: undefined,
        notes: 'Master cutter base salary + overtime bonus.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(LOCAL_SALARIES_KEY, JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
};

export const fetchSalaryRecords = async (): Promise<SalaryRecord[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('salary_records')
        .select('*, worker:stitching_workers(*)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as SalaryRecord[];
    } catch (err) {
      console.warn('Salary query restricted or fallback required:', err);
    }
  }
  return getLocalSalaries();
};

export const upsertSalaryRecord = async (rec: Partial<SalaryRecord>): Promise<{ success: boolean; error: string | null; record?: SalaryRecord }> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const base = Number(rec.base_salary || 0);
  const bonus = Number(rec.bonus || 0);
  const deduction = Number(rec.deduction || 0);
  const final_amount = base + bonus - deduction;

  const recordToSave: SalaryRecord = {
    id: rec.id || `sal-${Date.now()}`,
    worker_id: rec.worker_id!,
    month_year: rec.month_year || 'October 2026',
    base_salary: base,
    bonus,
    deduction,
    final_amount,
    payment_status: rec.payment_status || 'Pending',
    payment_date: rec.payment_date || undefined,
    notes: rec.notes || '',
    created_at: rec.created_at || now,
    updated_at: now,
  };

  const current = getLocalSalaries();
  const exists = current.findIndex((s) => s.id === recordToSave.id);
  const updatedList = exists >= 0
    ? current.map((s) => (s.id === recordToSave.id ? recordToSave : s))
    : [recordToSave, ...current];
  localStorage.setItem(LOCAL_SALARIES_KEY, JSON.stringify(updatedList));

  if (client) {
    try {
      const { error } = await client.from('salary_records').upsert(recordToSave);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      console.warn('Salary remote save error:', err);
    }
  }
  return { success: true, error: null, record: recordToSave };
};

export const deleteSalaryRecord = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalSalaries();
  localStorage.setItem(LOCAL_SALARIES_KEY, JSON.stringify(current.filter((s) => s.id !== id)));

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('salary_records').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

// ==============================================================================
// 5. CONTACT INQUIRIES MANAGEMENT
// ==============================================================================
const LOCAL_INQUIRIES_KEY = 'boutique_inquiries_db';

const getLocalInquiries = (): ContactInquiry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    if (raw) return JSON.parse(raw);
    const defaults: ContactInquiry[] = [
      {
        id: 'inq-1',
        name: 'Sadia Qureshi',
        phone: '0301-2345678',
        email: 'sadia.q@example.com',
        message: 'Assalam o Alaikum, mujhe Walima suit kay liye custom lace stitching karwani hai. Kya Saturday ko appointment mil sakti hai?',
        status: 'New',
        internal_note: '',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'inq-2',
        name: 'Bilal Ahmad',
        phone: '0333-9876543',
        email: 'bilal@example.com',
        message: 'Bachon kay 2 Eid kurta pajama sets silwane hain. Sadiqabad shop par kapra khud lana hai ya wahan available hai?',
        status: 'Contacted',
        internal_note: 'Called customer on WhatsApp, informed that both options are available.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
};

export const fetchContactInquiries = async (): Promise<ContactInquiry[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as ContactInquiry[];
    } catch {
      // ignore
    }
  }
  return getLocalInquiries();
};

export const createContactInquiry = async (
  inquiry: Omit<ContactInquiry, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error: string | null }> => {
  const now = new Date().toISOString();
  const newInq: ContactInquiry = {
    id: `inq-${Date.now()}`,
    name: inquiry.name.trim(),
    phone: inquiry.phone.trim(),
    email: inquiry.email?.trim() || undefined,
    message: inquiry.message.trim(),
    status: 'New',
    internal_note: '',
    created_at: now,
    updated_at: now,
  };

  const current = getLocalInquiries();
  localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify([newInq, ...current]));

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('contact_inquiries').insert([newInq]);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      console.warn('Inquiry remote save error:', err);
    }
  }
  return { success: true, error: null };
};

export const updateContactInquiry = async (
  id: string,
  updates: Partial<ContactInquiry>
): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalInquiries();
  const updated = current.map((inq) => (inq.id === id ? { ...inq, ...updates, updated_at: new Date().toISOString() } : inq));
  localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(updated));

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('contact_inquiries').update(updates).eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

export const upsertContactInquiry = async (
  inquiry: Partial<ContactInquiry> & { id: string }
): Promise<{ success: boolean; error: string | null }> => {
  return updateContactInquiry(inquiry.id, inquiry);
};

export const deleteContactInquiry = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalInquiries();
  localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(current.filter((inq) => inq.id !== id)));

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('contact_inquiries').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

// ==============================================================================
// 6. CUSTOMER REVIEWS MANAGEMENT
// ==============================================================================
const LOCAL_REVIEWS_KEY = 'boutique_reviews_db';

const getLocalReviews = (): CustomerReview[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
    if (raw) return JSON.parse(raw);
    const defaults: CustomerReview[] = [
      {
        id: 'rev-1',
        customer_name: 'Zainab Bibi (Sadiqabad)',
        rating: 5,
        review_text: 'Boutique Stitching se maine apna bridal walima suit silwaya tha. Fitting aur finishing bilkul 10/10 aayi hai! Master Tariq sahib ne measurements bilkul dorust li thin.',
        status: 'Approved',
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rev-2',
        customer_name: 'Mrs. Huma Farooq',
        rating: 5,
        review_text: 'Bachon kay Eid suits bohat aaram-deh aur khoobsurat siye gaye hain. Inner astar bilkul naram kapray ka lagaya tha, bachay bohat khush hue.',
        status: 'Approved',
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rev-3',
        customer_name: 'Mahnoor Khan',
        rating: 4,
        review_text: 'Online order reference track karne ka feature bohat aala hai. Studio se WhatsApp par timely update mil gayi thi.',
        status: 'Approved',
        is_featured: false,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rev-4',
        customer_name: 'Amina Sheikh',
        rating: 5,
        review_text: 'First time stitching karwayi thi. Lawn 3-piece ka gala aur daman cut-work organza dupatta bilkul original jaisa silwaya.',
        status: 'Pending',
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
};

export const fetchCustomerReviews = async (): Promise<CustomerReview[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as CustomerReview[];
    } catch {
      // ignore
    }
  }
  return getLocalReviews();
};

export const fetchApprovedReviews = async (): Promise<CustomerReview[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('customer_reviews')
        .select('*')
        .eq('status', 'Approved')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as CustomerReview[];
    } catch {
      // ignore
    }
  }
  return getLocalReviews().filter((r) => r.status === 'Approved');
};

export const createCustomerReview = async (
  review: Omit<CustomerReview, 'id' | 'status' | 'is_featured' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error: string | null }> => {
  const now = new Date().toISOString();
  const newRev: CustomerReview = {
    id: `rev-${Date.now()}`,
    customer_name: review.customer_name.trim(),
    customer_id: review.customer_id || null,
    rating: review.rating,
    review_text: review.review_text.trim(),
    image_url: review.image_url || undefined,
    status: 'Pending',
    is_featured: false,
    created_at: now,
    updated_at: now,
  };

  const current = getLocalReviews();
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify([newRev, ...current]));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_reviews_updated'));
    window.dispatchEvent(new Event('storage'));
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('customer_reviews').insert([newRev]);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      console.warn('Review remote save error:', err);
    }
  }
  return { success: true, error: null };
};

export const updateCustomerReview = async (
  id: string,
  updates: Partial<CustomerReview>
): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalReviews();
  const updated = current.map((r) => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r));
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_reviews_updated'));
    window.dispatchEvent(new Event('storage'));
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('customer_reviews').update(updates).eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

export const deleteCustomerReview = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalReviews();
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(current.filter((r) => r.id !== id)));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_reviews_updated'));
    window.dispatchEvent(new Event('storage'));
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('customer_reviews').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};

// ==============================================================================
// 7. SECURE MANAGEMENT IMAGE UPLOAD HELPER
// ==============================================================================
export const uploadManagementImage = async (
  file: File,
  prefix: 'posters' | 'designs' | 'reviews' | 'sale' | 'services'
): Promise<{ url: string | null; error: string | null }> => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    return { url: null, error: 'Invalid file format. Please upload JPG, PNG, or WEBP only.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: 'Image size exceeds 10MB limit.' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { url: URL.createObjectURL(file), error: null };
  }

  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${prefix}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const { error: uploadErr } = await client.storage
      .from('stitching-references')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadErr) {
      // Fallback to local blob url if bucket permissions restrict
      return { url: URL.createObjectURL(file), error: null };
    }

    const { data } = client.storage.from('stitching-references').getPublicUrl(filePath);
    return { url: data.publicUrl, error: null };
  } catch {
    return { url: URL.createObjectURL(file), error: null };
  }
};

// ==============================================================================
// 8. SALE & OFFERS DATA MANAGEMENT
// ==============================================================================
const LOCAL_SALE_ITEMS_KEY = 'boutique_sale_items';

const getLocalSaleItems = (): SaleItem[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_SALE_ITEMS_KEY);
  if (!raw) {
    const defaults: SaleItem[] = [
      {
        id: 'sale-1',
        title: 'Peach Embroidered Festive 3-Piece Stitched Suit',
        title_urdu: 'پیچ ریشم کڑھائی فیسٹیو ۳-پیس سلا ہوا سوٹ',
        title_roman_urdu: 'Peach Resham Karhai Festive 3-Piece Silai Suit',
        description: 'Fine lawn shirt with heavy resham neckline embroidery, scalloped organza daman & matching dupatta with trousers.',
        description_urdu: 'نفیس لان قمیض پر ریشم کڑھائی، کٹ ورک آرگنزا دامن، میچنگ دوپٹہ اور سلی ہوئی ٹراؤزر۔',
        description_roman_urdu: 'Nafis lawn kameez par resham karhai, cut-work organza daman, matching dupatta aur stitched trouser.',
        category: 'ladies',
        original_price: 6500,
        sale_price: 4850,
        discount_percentage: 25,
        image_url: '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
        is_active: true,
        is_featured: true,
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sale-2',
        title: 'Teal Peacock Formal Embroidered Pakistani Suit',
        title_urdu: 'ٹیل پیکاک فارمل کڑھائی والا سوٹ',
        title_roman_urdu: 'Teal Peacock Formal Karhai Suit',
        description: 'Luxury pure fabric with resham neckline, flared statement sleeves and cigarette trousers.',
        description_urdu: 'خوبصورت فیبرک پر ریشم گلا، فلیرڈ آستین اور سگریٹ پینٹس۔',
        description_roman_urdu: 'Khubsurat fabric par resham gala, flared sleeves aur cigarette pant.',
        category: 'ladies',
        original_price: 7200,
        sale_price: 5400,
        discount_percentage: 25,
        image_url: '/src/assets/images/homepage_ladies_teal_formal_1791433341529.jpg',
        is_active: true,
        is_featured: false,
        display_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sale-3',
        title: 'Kids Festive Royal Blue Traditional Suit',
        title_urdu: 'بچوں کا روایتی رائل بلیو فیسٹیو سوٹ',
        title_roman_urdu: 'Bachon Ka Traditional Royal Blue Festive Suit',
        description: 'Traditional printed & embroidered kurta pajama with dupatta for young girls.',
        description_urdu: 'بچیوں کے لیے روایتی پرنٹڈ و کڑھائی والا کرتا پاجامہ مع دوپٹہ۔',
        description_roman_urdu: 'Bachiyon ke liye traditional printed aur karhai wala kurta pajama.',
        category: 'kids',
        original_price: 3800,
        sale_price: 2850,
        discount_percentage: 25,
        image_url: '/src/assets/images/homepage_kids_blue_suit_1791433355604.jpg',
        is_active: true,
        is_featured: true,
        display_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sale-4',
        title: 'Festive Magenta Floral Lehenga Choli Set',
        title_urdu: 'فیسٹیو مجینٹا فلورل لہنگا چولی سیٹ',
        title_roman_urdu: 'Festive Magenta Floral Lehenga Choli Set',
        description: 'Designer wedding guest wear with gotta patti accents and sheer net dupatta.',
        description_urdu: 'گوٹا پٹی ہائی لائٹس اور شیئر نیٹ دوپٹہ کے ساتھ ڈیزائنر شادی کا لباس۔',
        description_roman_urdu: 'Gotta patti highlights aur sheer net dupatta ke sath designer lehenga choli.',
        category: 'ladies',
        original_price: 9500,
        sale_price: 7125,
        discount_percentage: 25,
        image_url: '/src/assets/images/homepage_party_magenta_lehenga_1791433369559.jpg',
        is_active: true,
        is_featured: false,
        display_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(LOCAL_SALE_ITEMS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const fetchSaleItems = async (activeOnly: boolean = false): Promise<SaleItem[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client.from('sale_items').select('*').order('display_order', { ascending: true });
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as SaleItem[];
    } catch (err) {
      console.warn('Supabase sale items notice, using local storage cache:', err);
    }
  }
  const local = getLocalSaleItems();
  return activeOnly ? local.filter((item) => item.is_active) : local;
};

export const upsertSaleItem = async (
  item: Partial<SaleItem>
): Promise<{ data: SaleItem | null; error: string | null }> => {
  const current = getLocalSaleItems();
  const originalPrice = Number(item.original_price ?? 0);
  const salePrice = Number(item.sale_price ?? 0);

  if (originalPrice < 0 || salePrice < 0) {
    return { data: null, error: 'Prices must be non-negative values.' };
  }

  if (salePrice > originalPrice) {
    return { data: null, error: 'Sale price cannot exceed the original price.' };
  }

  const calculatedDiscount = originalPrice > 0 && salePrice < originalPrice
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const itemToSave: SaleItem = {
    id: item.id || `sale-${Date.now()}`,
    title: item.title || 'Special Boutique Offer',
    title_urdu: item.title_urdu,
    title_roman_urdu: item.title_roman_urdu,
    description: item.description || '',
    description_urdu: item.description_urdu,
    description_roman_urdu: item.description_roman_urdu,
    category: (item.category as 'ladies' | 'kids') || 'ladies',
    original_price: originalPrice,
    sale_price: salePrice,
    discount_percentage: calculatedDiscount,
    image_url: item.image_url || '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
    is_active: item.is_active !== undefined ? item.is_active : true,
    is_featured: !!item.is_featured,
    start_date: item.start_date,
    end_date: item.end_date,
    display_order: item.display_order ?? (current.length + 1),
    created_at: item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existingIndex = current.findIndex((s) => s.id === itemToSave.id);
  const updatedList = existingIndex >= 0
    ? current.map((s, idx) => (idx === existingIndex ? itemToSave : s))
    : [...current, itemToSave];

  localStorage.setItem(LOCAL_SALE_ITEMS_KEY, JSON.stringify(updatedList));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_sale_items_updated'));
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('sale_items').upsert(itemToSave).select().single();
      if (error) return { data: itemToSave, error: error.message };
      return { data: data as SaleItem, error: null };
    } catch (err: any) {
      return { data: itemToSave, error: err.message };
    }
  }

  return { data: itemToSave, error: null };
};

export const deleteSaleItem = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalSaleItems();
  localStorage.setItem(LOCAL_SALE_ITEMS_KEY, JSON.stringify(current.filter((s) => s.id !== id)));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('boutique_sale_items_updated'));
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('sale_items').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, error: null };
};


