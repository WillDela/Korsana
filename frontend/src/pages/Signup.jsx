import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="page-auth">
      <div className="auth-card animate-slideUp">
        <div className="auth-header">
          <Link to="/" className="logo">Korsana</Link>
          <h1>Create your account</h1>
          <p>Start your journey to race day</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="alert alert-error">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <p className="text-error text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            {errors.password && (
              <p className="text-error text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-secondary mt-6" style={{ fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
