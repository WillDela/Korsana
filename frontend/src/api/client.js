import axios from 'axios';
import { supabase } from '../context/AuthContext';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Navigator function injected by <RouterNavigator /> so this non-React module
// can perform client-side redirects without forcing a full page reload (which
// races with in-flight setState calls on unmounting components).
let navigator = null;
export const setApiNavigator = (fn) => {
  navigator = fn;
};

// Attach the live Supabase JWT to every request
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401, sign the user out and redirect to /login. The error is annotated
// with `isAuthRedirect: true` so callers can short-circuit before calling
// setState on components that are about to unmount.
let redirectInFlight = false;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      error.isAuthRedirect = true;
      if (!redirectInFlight) {
        redirectInFlight = true;
        try {
          await supabase.auth.signOut();
        } finally {
          if (navigator) {
            navigator('/login', { replace: true });
          } else {
            window.location.href = '/login';
          }
          // Reset on next tick so subsequent 401s after re-login still work.
          setTimeout(() => {
            redirectInFlight = false;
          }, 0);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (error.response) {
    return error.response.data?.error || error.response.data?.message || `Error: ${error.response.status}`;
  } else if (error.request) {
    return 'Network error. Please check your connection.';
  }
  return error.message || 'An unexpected error occurred';
};

export default api;
