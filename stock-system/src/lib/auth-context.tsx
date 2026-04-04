'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'clerk' | 'billing' | 'customer' | 'supplier';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  clerk: 'Inventory Clerk',
  billing: 'Billing Clerk',
  customer: 'Customer',
  supplier: 'Supplier',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-emerald-100 text-emerald-700',
  clerk: 'bg-blue-100 text-blue-700',
  billing: 'bg-purple-100 text-purple-700',
  customer: 'bg-indigo-100 text-indigo-700',
  supplier: 'bg-red-100 text-red-700',
};

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check active session on mount
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    setUser(data as UserProfile);
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (loginError) {
      setError(loginError.message);
      setIsLoading(false);
      throw loginError;
    }
  };

  const logout = async () => {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) console.error('Logout error:', logoutError);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
