import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer';

const ValueProp = ({ icon, title, delay }) => (
  <motion.div
    className="flex items-center gap-4"
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <span className="text-white/90 text-sm font-medium">{title}</span>
  </motion.div>
);

const Signup = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = watch('email');
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
    <div className="min-h-screen flex relative">
      {/* Brand Side */}
      <div
        className="hidden lg:flex flex-1 bg-sage text-white p-12 flex-col justify-between relative overflow-hidden"
        style={{ clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)' }}
      >
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-16 right-16 w-72 h-72 border border-white/20 rounded-full" />
          <div className="absolute bottom-24 left-8 w-40 h-40 border border-white/10 rounded-full" />
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
              Every mile<br />starts here.
            </h2>
            <div className="w-16 h-px bg-white/40 mt-8" />
          </motion.div>
        </div>

        {/* Value props */}
        <div className="relative z-10 space-y-5">
          <ValueProp
            delay={0.5}
            title="Connect your Strava"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            }
          />
          <ValueProp
            delay={0.65}
            title="Set your race goals"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            }
          />
          <ValueProp
            delay={0.8}
            title="AI-powered coaching"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            }
          />
        </div>
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
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sage" />

            <div className="mb-8">
              <h1
                className="text-2xl text-text-primary mb-2"
                style={{ fontFamily: 'var(--font-serif)', fontWeight: 700 }}
              >
                Create your account
              </h1>
              <p className="text-sm text-text-secondary">Start your journey to race day</p>
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
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </StaggerItem>
                <StaggerItem>
                  <AnimatedInput
                    label="Password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    error={errors.password?.message}
                    success={password && password.length >= 6 && !errors.password}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                  />
                </StaggerItem>
                <StaggerItem>
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
                  >
                    {isSubmitting ? 'Creating account...' : 'Create account'}
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
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-bg-app transition-colors cursor-pointer bg-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#FC4C02]">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Connect with Strava
            </button>
          </div>

          <p className="text-center mt-6 text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-navy font-semibold no-underline hover:text-navy-light transition-colors">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
