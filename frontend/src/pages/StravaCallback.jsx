import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const isNew = searchParams.get('new') === 'true';
    const stravaError = searchParams.get('strava_error');

    if (stravaError) {
      setError('Strava sign-in failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setError('No token received. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      localStorage.setItem('token', token);
      setUserFromToken({ id: decoded.sub, email: decoded.email });
      window.location.replace(isNew ? '/onboarding' : '/dashboard');
    } catch {
      setError('Invalid token. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, setUserFromToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-app">
        <div className="text-center">
          <p className="text-error text-sm mb-2">{error}</p>
          <p className="text-text-muted text-xs">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-secondary">Signing you in with Strava...</p>
      </div>
    </div>
  );
};

export default StravaCallback;
