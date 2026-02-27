import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SiStrava } from 'react-icons/si';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from '../components/AnimatedButton';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-app px-4">
      {/* Logo */}
      <motion.div
        className="flex items-center gap-2 mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <span className="text-navy text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          Korsana
        </span>
      </motion.div>

      {/* Card */}
      <motion.div
        className="w-full max-w-[400px] bg-white rounded-2xl shadow-sm border border-border-light p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1
          className="text-2xl font-bold text-navy mb-6"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Return to Your Training
        </h1>

        {serverError && (
          <div className="bg-coral-light text-error text-sm rounded-lg px-4 py-3 mb-5 border border-error/20">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Email address"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-text-primary placeholder-text-muted outline-none transition-colors
                ${errors.email ? 'border-error' : 'border-border focus:border-navy'}`}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <p className="text-error text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-primary">Password</label>
              <button
                type="button"
                className="text-xs text-navy font-semibold hover:text-navy-light transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm text-text-primary placeholder-text-muted outline-none transition-colors
                  ${errors.password ? 'border-error' : 'border-border focus:border-navy'}`}
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer bg-transparent border-none p-0"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-error text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <AnimatedButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
          >
            {isSubmitting ? 'Logging in...' : 'Log In →'}
          </AnimatedButton>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Strava */}
        <button
          type="button"
          onClick={() => { window.location.href = '/api/auth/strava/login'; }}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer border-none"
          style={{ backgroundColor: '#FC4C02' }}
        >
          <SiStrava size={18} color="white" />
          Sign in with Strava
        </button>
      </motion.div>

      {/* Footer link */}
      <p className="text-center mt-6 text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/signup" className="text-navy font-semibold no-underline hover:text-navy-light transition-colors">
          Create Account
        </Link>
      </p>
    </div>
  );
};

export default Login;
