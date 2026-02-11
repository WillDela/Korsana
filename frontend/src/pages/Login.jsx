import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer';

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
    <div className="min-h-screen flex">
      {/* Brand Side */}
      <div className="hidden lg:flex flex-1 bg-navy text-white p-12 flex-col justify-between relative">
        <div>
          <Link to="/" className="flex items-center gap-3 no-underline mb-6">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Korsana</span>
          </Link>
          <p className="text-white/80 text-lg max-w-sm leading-relaxed">
            Your AI-powered running coach. Train smarter, race faster.
          </p>
        </div>
        <p className="text-white/50 text-sm">
          "Korsana helped me take 15 minutes off my marathon PR."
        </p>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-bg-app">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-navy text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Korsana</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Welcome back</h1>
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
