import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Full-screen background photo */}
      <img
        src="/login_photo.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Form card */}
      <motion.div
        className="relative z-10 w-full max-w-[440px] bg-white rounded-2xl shadow-2xl p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 no-underline w-fit">
          <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="text-navy text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Korsana
          </span>
        </Link>

        <h1
          className="text-2xl font-bold text-navy mb-7 whitespace-nowrap"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Return to Your Training
        </h1>

        {serverError && (
          <div className="bg-coral-light text-error text-sm rounded-lg px-4 py-3 mb-6 border border-error/20">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Email address"
              className={`w-full px-4 py-3 rounded-lg border text-base text-text-primary placeholder-text-muted outline-none transition-colors
                ${errors.email ? 'border-error' : 'border-border focus:border-navy'}`}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <p className="text-error text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
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
                className={`w-full px-4 py-3 pr-11 rounded-lg border text-base text-text-primary placeholder-text-muted outline-none transition-colors
                  ${errors.password ? 'border-error' : 'border-border focus:border-navy'}`}
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer bg-transparent border-none p-0"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
          >
            {isSubmitting ? 'Logging in...' : 'Log In →'}
          </AnimatedButton>
        </form>

        {/* Footer link */}
        <p className="text-center mt-6 text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="text-navy font-semibold no-underline hover:text-navy-light transition-colors">
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
