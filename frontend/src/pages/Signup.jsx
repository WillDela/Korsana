import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer';
import logo from '../assets/images/KorsanaLogo.jpg';

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
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Brand Side - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #618B4A 0%, #13230B 100%)',
          color: '#fff',
          padding: '4rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background texture */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          opacity: 0.05,
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <motion.img
              src={logo}
              alt="Korsana Logo"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              style={{ height: '3rem', width: 'auto' }}
            />
            <motion.h1
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: 0 }}
            >
              Korsana
            </motion.h1>
          </Link>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: '1.125rem', lineHeight: 1.6, opacity: 0.9, maxWidth: '400px' }}
          >
            Join thousands of runners training smarter with AI-powered coaching.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>
            ✓ Connect your Strava data
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>
            ✓ Set your race goals
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            ✓ Get personalized coaching
          </div>
        </motion.div>
      </motion.div>

      {/* Form Side */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--color-bg-secondary)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Create your account
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              Start your journey to race day
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="alert alert-error"
                style={{ marginBottom: '1.5rem' }}
              >
                {serverError}
              </motion.div>
            )}

            <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
              </StaggerItem>

              <StaggerItem>
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '0.875rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </AnimatedButton>
              </StaggerItem>
            </StaggerContainer>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}
          >
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-secondary)', fontWeight: 600, textDecoration: 'none' }}>
              Log in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
