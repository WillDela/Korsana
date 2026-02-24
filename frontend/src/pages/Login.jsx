import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer';

const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

const Login = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = watch('email');
  const password = watch('password');

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
    <div className="min-h-screen flex relative">
      {/* Brand Side */}
      <div
        className="hidden lg:flex flex-1 bg-navy text-white p-12 flex-col justify-between relative overflow-hidden"
        style={{ clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)' }}
      >
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 border border-white/20 rounded-full" />
          <div className="absolute bottom-32 right-20 w-48 h-48 border border-white/10 rounded-full" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 no-underline mb-16">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Korsana</span>
          </Link>

          {/* Editorial tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="w-16 h-px bg-white/40 mb-8" />
            <h2
              className="text-4xl xl:text-5xl leading-tight mb-6 max-w-md"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}
            >
              Your plan,<br />our goal.
            </h2>
            <div className="w-16 h-px bg-white/40 mt-8" />
          </motion.div>
        </div>

        {/* Bottom stats + detail */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p
            className="text-white/30 text-xs tracking-[0.3em] uppercase mb-8"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Est. 2026
          </p>
          <div className="flex gap-10">
            <div>
              <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                <AnimatedCounter end={10000} suffix="+" />
              </p>
              <p className="text-white/50 text-xs uppercase tracking-wider">Miles tracked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                <AnimatedCounter end={2500} suffix="+" duration={1800} />
              </p>
              <p className="text-white/50 text-xs uppercase tracking-wider">Athletes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                <AnimatedCounter end={98} suffix="%" duration={1500} />
              </p>
              <p className="text-white/50 text-xs uppercase tracking-wider">PR rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-bg-app lg:pl-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-navy text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Korsana</span>
          </div>

          {/* Form card with accent bar */}
          <div className="bg-white rounded-xl shadow-sm border border-border-light p-8 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-navy" />

            <div className="mb-8">
              <h1
                className="text-2xl text-text-primary mb-2"
                style={{ fontFamily: 'var(--font-serif)', fontWeight: 700 }}
              >
                Welcome back
              </h1>
              <p className="text-sm text-text-secondary">Log in to continue your training</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {serverError && (
                <div className="bg-coral-light text-error text-sm rounded-lg px-4 py-3 mb-6 border border-error/20">
                  {serverError}
                </div>
              )}

              <StaggerContainer className="flex flex-col gap-5">
                <StaggerItem>
                  <AnimatedInput
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    error={errors.email?.message}
                    {...register('email', { required: 'Email is required' })}
                  />
                </StaggerItem>
                <StaggerItem>
                  <AnimatedInput
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    error={errors.password?.message}
                    {...register('password', { required: 'Password is required' })}
                  />
                </StaggerItem>
                <StaggerItem>
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
                  >
                    {isSubmitting ? 'Logging in...' : 'Log in'}
                  </AnimatedButton>
                </StaggerItem>
              </StaggerContainer>
            </form>

            {/* Separator */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Strava button */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-bg-app transition-colors cursor-pointer bg-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#FC4C02]">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Connect with Strava
              </button>

              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-bg-app transition-colors cursor-not-allowed bg-white opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#007CC3]">
                  <path d="M11.967 0L19.5 4.35V13.05L11.967 17.4L4.433 13.05V4.35L11.967 0ZM11.967 2.053L6.2 5.38V12.033L11.967 15.36L17.734 12.033V5.38L11.967 2.053ZM11.967 7.2L16.2 9.64V14.5L11.967 16.94L7.734 14.5V9.64L11.967 7.2ZM11.967 24L8.334 21.9L11.967 19.8L15.6 21.9L11.967 24Z" />
                </svg>
                Connect with Garmin (Soon)
              </button>

              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-bg-app transition-colors cursor-not-allowed bg-white opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#1B1B1B]">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12 6.627 0 12-5.373 12-12C24 5.373 18.627 0 12 0zm0 17.5c-3.038 0-5.5-2.462-5.5-5.5S8.962 6.5 12 6.5s5.5 2.462 5.5 5.5-2.462 5.5-5.5 5.5zm0-9.5c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4z" />
                </svg>
                Connect with Coros (Soon)
              </button>
            </div>
          </div>

          <p className="text-center mt-6 text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="text-navy font-semibold no-underline hover:text-navy-light transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
