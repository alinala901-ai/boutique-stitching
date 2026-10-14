import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  getSupabaseClient,
  fetchCustomerProfile,
  upsertCustomerProfile,
  fetchSavedMeasurements,
  saveCustomerMeasurements,
} from '../lib/supabase';
import { UserProfile, CustomerSavedMeasurements, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  savedMeasurements: CustomerSavedMeasurements | null;
  isLoading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  userRole: UserRole;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => Promise<{ success: boolean; error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  saveMeasurements: (
    data: CustomerSavedMeasurements
  ) => Promise<{ success: boolean; error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local fallback user storage key for development/preview
const LOCAL_AUTH_USER_KEY = 'boutique_stitching_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedMeasurements, setSavedMeasurements] = useState<CustomerSavedMeasurements | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = getSupabaseClient();

  const loadProfileAndMeasurements = async (userId: string, userEmail?: string) => {
    try {
      let prof = await fetchCustomerProfile(userId);
      if (!prof && userEmail) {
        // Create initial default profile if not present
        prof = {
          id: userId,
          full_name: userEmail.split('@')[0],
          email: userEmail,
          preferred_language: 'en',
          is_staff: false,
        };
        await upsertCustomerProfile(prof);
      }
      setProfile(prof);

      const meas = await fetchSavedMeasurements(userId);
      setSavedMeasurements(meas);
    } catch (err) {
      console.warn('Error loading user profile & measurements:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);

      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (mounted && data.session?.user) {
            setUser(data.session.user);
            setSession(data.session);
            await loadProfileAndMeasurements(data.session.user.id, data.session.user.email);
          }

          // Listen for auth state changes
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
              if (mounted) {
                setSession(newSession);
                setUser(newSession?.user || null);
                if (newSession?.user) {
                  await loadProfileAndMeasurements(newSession.user.id, newSession.user.email);
                } else {
                  setProfile(null);
                  setSavedMeasurements(null);
                }
              }
            }
          );

          return () => {
            authListener.subscription.unsubscribe();
          };
        } catch (err) {
          console.error('Supabase auth session error:', err);
        }
      } else {
        // Offline / Dev mode fallback from localStorage
        try {
          const raw = localStorage.getItem(LOCAL_AUTH_USER_KEY);
          if (raw) {
            const localUser = JSON.parse(raw);
            setUser(localUser);
            await loadProfileAndMeasurements(localUser.id, localUser.email);
          }
        } catch {
          // ignore
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadProfileAndMeasurements(user.id, user.email);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ): Promise<{ success: boolean; error: string | null }> => {
    setIsLoading(true);

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone?.trim(),
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          const newProfile: UserProfile = {
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone?.trim(),
            preferred_language: 'en',
            is_staff: false,
          };
          await upsertCustomerProfile(newProfile);
          setProfile(newProfile);
        }

        setIsLoading(false);
        return { success: true, error: null };
      } catch (err: unknown) {
        setIsLoading(false);
        const errorMsg = err instanceof Error ? err.message : 'Sign up failed';
        return { success: false, error: errorMsg };
      }
    }

    // Dev Fallback when Supabase credentials are not live
    const mockUser: User = {
      id: `dev-user-${Date.now()}`,
      app_metadata: {},
      user_metadata: { full_name: fullName, phone },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email.trim(),
    } as User;

    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(mockUser));
    setUser(mockUser);

    const newProfile: UserProfile = {
      id: mockUser.id,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      preferred_language: 'en',
      is_staff: false,
    };
    await upsertCustomerProfile(newProfile);
    setProfile(newProfile);

    setIsLoading(false);
    return { success: true, error: null };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error: string | null }> => {
    setIsLoading(true);

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          await loadProfileAndMeasurements(data.user.id, data.user.email);
        }

        setIsLoading(false);
        return { success: true, error: null };
      } catch (err: unknown) {
        setIsLoading(false);
        const errorMsg = err instanceof Error ? err.message : 'Sign in failed';
        return { success: false, error: errorMsg };
      }
    }

    // Dev mode fallback
    const mockUser: User = {
      id: `dev-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      app_metadata: { role: email.includes('admin') || email.includes('staff') ? 'admin' : 'customer' },
      user_metadata: { full_name: email.split('@')[0] },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email.trim(),
    } as User;

    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    await loadProfileAndMeasurements(mockUser.id, mockUser.email);

    setIsLoading(false);
    return { success: true, error: null };
  };

  const signOut = async () => {
    setIsLoading(true);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    setSavedMeasurements(null);
    setIsLoading(false);
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error: string | null }> => {
    if (supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) return { success: false, error: error.message };
        return { success: true, error: null };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send reset link';
        return { success: false, error: errorMsg };
      }
    }
    return { success: true, error: null };
  };

  const updateProfile = async (
    data: Partial<UserProfile>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'User not signed in' };

    const success = await upsertCustomerProfile({
      id: user.id,
      ...profile,
      ...data,
    });

    if (success) {
      await refreshProfile();
      return { success: true, error: null };
    }
    return { success: false, error: 'Could not update profile' };
  };

  const saveMeasurements = async (
    data: CustomerSavedMeasurements
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'User not signed in' };

    const success = await saveCustomerMeasurements({
      ...data,
      user_id: user.id,
    });

    if (success) {
      const updated = await fetchSavedMeasurements(user.id);
      setSavedMeasurements(updated);
      return { success: true, error: null };
    }
    return { success: false, error: 'Could not save measurements' };
  };

  const userRole: UserRole =
    profile?.role ||
    (profile?.is_staff ? 'staff' : (user?.app_metadata?.role as UserRole) || 'customer');

  const isAdmin = Boolean(
    userRole === 'admin' ||
    user?.app_metadata?.role === 'admin' ||
    profile?.role === 'admin' ||
    user?.email?.includes('admin@boutiquestitching.com')
  );

  const isStaff = Boolean(
    isAdmin ||
    userRole === 'staff' ||
    profile?.is_staff ||
    profile?.role === 'staff' ||
    user?.email?.includes('staff@boutiquestitching.com')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        savedMeasurements,
        isLoading,
        isStaff,
        isAdmin,
        userRole: isAdmin ? 'admin' : (isStaff ? 'staff' : 'customer'),
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        saveMeasurements,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
