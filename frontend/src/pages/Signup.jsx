import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SiStrava } from 'react-icons/si';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from '../components/AnimatedButton';

const Signup = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      await signup(data.email, data.password);
      await login(data.email, data.password);
      navigate('/onboarding');
    } catch (err) {
      setServerError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
      {/* Full-screen background photo */}
      <img
        src="/signup_photo.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Form card */}
      <motion.div
        className="relative z-10 w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-navy text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Korsana
            </span>
          </Link>
        </div>

        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-navy mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Create Your Profile
          </h1>
          <p className="text-sm text-text-secondary">Start your precision training journey today.</p>
        </div>

        {serverError && (
          <div className="bg-coral-light text-error text-sm rounded-lg px-4 py-3 mb-6 border border-error/20">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* First / Last name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">First Name</label>
              <input
                type="text"
                placeholder="First name"
                className={`w-full px-4 py-3 rounded-lg border text-base text-text-primary placeholder-text-muted outline-none transition-colors
                  ${errors.firstName ? 'border-error' : 'border-border focus:border-navy'}`}
                {...register('firstName', { required: 'Required' })}
              />
              {errors.firstName && (
                <p className="text-error text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Last Name</label>
              <input
                type="text"
                placeholder="Last name"
                className={`w-full px-4 py-3 rounded-lg border text-base text-text-primary placeholder-text-muted outline-none transition-colors
                  ${errors.lastName ? 'border-error' : 'border-border focus:border-navy'}`}
                {...register('lastName', { required: 'Required' })}
              />
              {errors.lastName && (
                <p className="text-error text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email address"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border text-base text-text-primary placeholder-text-muted outline-none transition-colors
                  ${errors.email ? 'border-error' : 'border-border focus:border-navy'}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
            </div>
            {errors.email && (
              <p className="text-error text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border text-base text-text-primary placeholder-text-muted outline-none transition-colors
                  ${errors.password ? 'border-error' : password && password.length >= 6 ? 'border-green-400' : 'border-border focus:border-navy'}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />
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
            {isSubmitting ? 'Creating account...' : 'Start Training →'}
          </AnimatedButton>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Strava */}
        <button
          type="button"
          onClick={() => { window.location.href = '/api/auth/strava/login'; }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-lg text-white text-base font-semibold transition-opacity hover:opacity-90 cursor-pointer border-none"
          style={{ backgroundColor: '#FC4C02' }}
        >
          <SiStrava size={20} color="white" />
          Continue with Strava
        </button>

        {/* Terms */}
        <p className="text-center text-xs text-text-muted mt-5">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="text-navy font-medium no-underline hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-navy font-medium no-underline hover:underline">Privacy Policy</Link>.
        </p>

        {/* Footer link */}
        <p className="text-center mt-4 text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-navy font-semibold no-underline hover:text-navy-light transition-colors">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
