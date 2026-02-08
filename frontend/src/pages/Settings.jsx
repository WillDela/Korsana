import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../api/profile';
import { stravaAPI } from '../api/strava';
import AnimatedButton from '../components/AnimatedButton';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer';

const Settings = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Strava state
  const [connectingStrava, setConnectingStrava] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileAPI.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await profileAPI.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleConnectStrava = async () => {
    try {
      setConnectingStrava(true);
      const response = await stravaAPI.getAuthURL();
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to start Strava auth:', error);
      setConnectingStrava(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      {/* Navigation */}
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/" className="nav-brand">Korsana</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/coach" className="nav-link">Coach</Link>
          <button onClick={() => logout()} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
            Log out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem' }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Settings</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Manage your account, connections, and preferences
          </p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ height: '180px', background: 'var(--color-bg-primary)' }}>
                <div style={{ height: '16px', width: '120px', background: 'var(--color-bg-secondary)', borderRadius: '4px', marginBottom: '1rem' }} />
                <div style={{ height: '14px', width: '80%', background: 'var(--color-bg-secondary)', borderRadius: '4px', marginBottom: '0.75rem' }} />
                <div style={{ height: '14px', width: '60%', background: 'var(--color-bg-secondary)', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : (
          <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Account Section */}
            <StaggerItem>
              <motion.div
                className="card"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}>
                    {profile?.user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Account</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem 1rem', fontSize: '0.9375rem' }}>
                  <span className="label" style={{ textTransform: 'none', fontSize: '0.875rem', letterSpacing: 0 }}>Email</span>
                  <span style={{ fontWeight: 500 }}>{profile?.user?.email}</span>

                  <span className="label" style={{ textTransform: 'none', fontSize: '0.875rem', letterSpacing: 0 }}>Member since</span>
                  <span style={{ fontWeight: 500 }}>{profile?.user?.created_at ? formatDate(profile.user.created_at) : '—'}</span>

                  <span className="label" style={{ textTransform: 'none', fontSize: '0.875rem', letterSpacing: 0 }}>User ID</span>
                  <span className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {profile?.user?.id?.slice(0, 8)}...
                  </span>
                </div>
              </motion.div>
            </StaggerItem>

            {/* Strava Connection Section */}
            <StaggerItem>
              <motion.div
                className="card"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FC4C02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Strava Connection</h2>
                </div>

                {profile?.strava?.connected ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.8125rem' }}>Connected</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        Athlete ID: {profile.strava.athlete_id}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      Your Strava account is connected. Activities are synced automatically when you visit the dashboard.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                      Connect your Strava account to sync your running activities and get personalized coaching.
                    </p>
                    <AnimatedButton
                      variant="strava"
                      onClick={handleConnectStrava}
                      disabled={connectingStrava}
                      style={{ fontSize: '0.875rem' }}
                    >
                      {connectingStrava ? 'Connecting...' : 'Connect Strava'}
                    </AnimatedButton>
                  </div>
                )}
              </motion.div>
            </StaggerItem>

            {/* Active Goal Section */}
            <StaggerItem>
              <motion.div
                className="card"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Race Goal</h2>
                </div>

                {profile?.active_goal ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>{profile.active_goal.race_name}</span>
                      <span className="badge badge-success">Active</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                      Race date: {formatDate(profile.active_goal.race_date)}
                    </p>
                    <Link to="/goals" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
                      Manage Goals →
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                      No active race goal set. Setting a goal helps the AI coach personalize your training advice.
                    </p>
                    <Link to="/goals/new">
                      <AnimatedButton variant="primary" style={{ fontSize: '0.875rem' }}>
                        Set a Race Goal
                      </AnimatedButton>
                    </Link>
                  </div>
                )}
              </motion.div>
            </StaggerItem>

            {/* Change Password Section */}
            <StaggerItem>
              <motion.div
                className="card"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Change Password</h2>
                </div>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-secondary)' }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-secondary)' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-secondary)' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      minLength={6}
                    />
                  </div>

                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="alert alert-error"
                    >
                      {passwordError}
                    </motion.div>
                  )}

                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="alert alert-success"
                    >
                      {passwordSuccess}
                    </motion.div>
                  )}

                  <div>
                    <AnimatedButton
                      variant="primary"
                      type="submit"
                      disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                      style={{ fontSize: '0.875rem' }}
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </AnimatedButton>
                  </div>
                </form>
              </motion.div>
            </StaggerItem>

            {/* Danger Zone */}
            <StaggerItem>
              <motion.div
                className="card"
                style={{
                  borderColor: 'rgba(220, 38, 38, 0.2)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--color-error)' }}>Danger Zone</h2>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                  Logging out will clear your session. You can log back in anytime with your email and password.
                </p>
                <AnimatedButton
                  variant="outline"
                  onClick={() => logout()}
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-error)',
                    borderColor: 'rgba(220, 38, 38, 0.3)',
                  }}
                >
                  Log Out
                </AnimatedButton>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        )}
      </main>
    </div>
  );
};

export default Settings;
