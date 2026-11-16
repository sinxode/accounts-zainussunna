import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  role: Profile['role'] | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  role: null,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Development preview / UI audit support when zls_dev_auth flag is set in localStorage
    if (typeof window !== 'undefined' && window.localStorage.getItem('zls_dev_auth') === 'true') {
      const devProfile: Profile = {
        id: 'dev-admin-id',
        full_name: 'Administrator',
        role: 'super_admin',
        permissions: ['*'],
        is_active: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      const devUser = {
        id: 'dev-admin-id',
        email: 'admin@zainussunna.edu.in',
        user_metadata: { full_name: 'Administrator' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as User;

      setSession({
        access_token: 'dev-preview-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'dev-preview-refresh',
        user: devUser
      } as unknown as Session);
      setUser(devUser);
      setProfile(devProfile);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, role: profile?.role ?? null, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

 
export const useAuth = () => useContext(AuthContext);
