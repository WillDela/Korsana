import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auto-exchanges the token from the URL on page load.
    // Listen for SIGNED_IN, then send the user to onboarding.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/onboarding', { replace: true });
      }
    });

    // Handle the case where the session is already established before the listener fires.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/onboarding', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-app)]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-navy)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)] text-sm font-sans">Confirming your account...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
