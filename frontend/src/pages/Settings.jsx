import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../api/profile';
import { stravaAPI } from '../api/strava';
import { getErrorMessage } from '../api/client';

const Settings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [stravaMessage, setStravaMessage] = useState({ type: '', text: '' });

  // General error state
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    fetchProfile();

    if (searchParams.get('strava_connected') === 'true') {
      setStravaMessage({ type: 'success', text: 'Strava connected successfully!' });
      fetchProfile();
      setSearchParams({});
    } else if (searchParams.get('strava_error')) {
      const error = searchParams.get('strava_error');
      const errorMessages = {
        missing_code: 'Authorization code missing',
        missing_state: 'Security validation failed',
        invalid_state: 'Invalid or expired session',
        connection_failed: 'Failed to connect to Strava',
      };
      setStravaMessage({ type: 'error', text: errorMessages[error] || 'Failed to connect Strava' });
      setSearchParams({});
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setGeneralError('');
      const data = await profileAPI.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setGeneralError(getErrorMessage(error));
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
      setPasswordError(getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleConnectStrava = async () => {
    try {
      setConnectingStrava(true);
      setStravaMessage({ type: '', text: '' });
      const response = await stravaAPI.getAuthURL();
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to start Strava auth:', error);
      setStravaMessage({ type: 'error', text: getErrorMessage(error) });
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
    <div className="max-w-[800px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Settings</h1>
        <p className="text-text-secondary text-[0.9375rem]">
          Manage your account, connections, and preferences
        </p>
      </div>

      {generalError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error text-white text-sm rounded-lg px-4 py-3 mb-6"
        >
          {generalError}
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-[180px] animate-pulse">
              <div className="h-4 w-[120px] bg-border-light rounded mb-4" />
              <div className="h-3.5 w-4/5 bg-border-light rounded mb-3" />
              <div className="h-3.5 w-3/5 bg-border-light rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Account Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                {profile?.user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Account</h2>
            </div>

            <div className="grid text-[0.9375rem]" style={{ gridTemplateColumns: '120px 1fr', gap: '0.75rem 1rem' }}>
              <span className="text-sm text-text-secondary">Email</span>
              <span className="font-medium">{profile?.user?.email}</span>

              <span className="text-sm text-text-secondary">Member since</span>
              <span className="font-medium">{profile?.user?.created_at ? formatDate(profile.user.created_at) : '\u2014'}</span>

              <span className="text-sm text-text-secondary">User ID</span>
              <span className="font-mono text-sm text-text-muted">
                {profile?.user?.id?.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* Strava Connection Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FC4C02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Strava Connection</h2>
            </div>

            {stravaMessage.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium text-white ${
                  stravaMessage.type === 'success' ? 'bg-success' : 'bg-error'
                }`}
              >
                {stravaMessage.text}
              </motion.div>
            )}

            {profile?.strava?.connected ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="badge badge-success text-sm">Connected</span>
                  <span className="text-sm text-text-muted">
                    Athlete ID: {profile.strava.athlete_id}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Your Strava account is connected. Activities are synced automatically when you visit the dashboard.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  Connect your Strava account to sync your running activities and get personalized coaching.
                </p>
                <button
                  className="btn text-sm font-semibold text-white border-none"
                  onClick={handleConnectStrava}
                  disabled={connectingStrava}
                  style={{ background: '#FC4C02' }}
                >
                  {connectingStrava ? 'Connecting...' : 'Connect Strava'}
                </button>
              </div>
            )}
          </div>

          {/* Active Goal Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Race Goal</h2>
            </div>

            {profile?.active_goal ? (
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold">{profile.active_goal.race_name}</span>
                  <span className="badge badge-success">Active</span>
                </div>
                <p className="text-sm text-text-secondary mb-3">
                  Race date: {formatDate(profile.active_goal.race_date)}
                </p>
                <Link to="/goals" className="text-sm font-semibold text-navy no-underline hover:text-navy-light transition-colors">
                  Manage Goals &rarr;
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  No active race goal set. Setting a goal helps the AI coach personalize your training advice.
                </p>
                <Link to="/goals/new" className="btn btn-primary text-sm">
                  Set a Race Goal
                </Link>
              </div>
            )}
          </div>

          {/* Change Password Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
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
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
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
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
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
                <button
                  type="submit"
                  className="btn btn-primary text-sm"
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
