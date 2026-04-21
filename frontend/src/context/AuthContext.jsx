import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export { supabase };

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  const applySession = (session) => {
    if (session?.user) {
      setUser({ id: session.user.id, email: session.user.email });
      setIsOnboarded(session.user.user_metadata?.onboarded === true);
    } else {
      setUser(null);
      setIsOnboarded(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error.message;
    return {
      id: data.user.id,
      email: data.user.email,
      onboarded: data.user.user_metadata?.onboarded === true,
    };
  };

  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error.message;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsOnboarded(false);
  };

  const completeOnboarding = async () => {
    await supabase.auth.updateUser({ data: { onboarded: true } });
    setIsOnboarded(true);
  };

  return (
    <AuthContext.Provider value={{ user, isOnboarded, loading, login, signup, logout, completeOnboarding, supabase }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
