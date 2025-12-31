import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, apiRequest } from '../lib/supabase';
import type { Profile, UserRole } from '../types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, full_name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function signIn(email: string, password: string) {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    }
  }

  async function signUp(email: string, password: string, full_name: string, role: UserRole) {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, role }),
    });

    // After signup, sign in automatically
    await signIn(email, password);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  function hasPermission(resource: string, action: string): boolean {
    if (!profile) return false;

    // Hardcoded basic permissions (could be loaded from DB)
    const rolePermissions: Record<UserRole, Record<string, string[]>> = {
      admin: {
        '*': ['*'], // All permissions
      },
      supervisor: {
        leads: ['read', 'assign'],
        calls: ['read', 'listen'],
        sales: ['read', 'validate'],
        reports: ['read'],
      },
      agent: {
        leads: ['read'],
        calls: ['create', 'read'],
        sales: ['create', 'read'],
      },
    };

    const permissions = rolePermissions[profile.role];
    if (!permissions) return false;

    // Admin has all permissions
    if (permissions['*']?.includes('*')) return true;

    // Check specific permission
    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action) || resourcePermissions.includes('*');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
