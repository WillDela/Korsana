import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userProfileAPI } from '../api/userProfile';
import { stravaAPI } from '../api/strava';
import { getErrorMessage } from '../api/client';

import ProfileBanner from '../components/profile/ProfileBanner';
import PersonalRecords from '../components/profile/PersonalRecords';
import WeeklySummaryCard from '../components/profile/WeeklySummaryCard';
import TrainingZonesCard from '../components/profile/TrainingZonesCard';
import ConnectedServicesCard from '../components/profile/ConnectedServicesCard';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';

// New components
import UnitsPreferenceCard from '../components/profile/UnitsPreferenceCard';
import NotificationsCard from '../components/profile/NotificationsCard';
import DataExportCard from '../components/profile/DataExportCard';
import DeleteAccountCard from '../components/profile/DeleteAccountCard';
import ChangeEmailForm from '../components/profile/ChangeEmailForm';

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'integrations' | 'notifications' | 'account'
  const [generalError, setGeneralError] = useState('');
  const [stravaMessage, setStravaMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();

    if (searchParams.get('strava_connected') === 'true') {
      setStravaMessage({ type: 'success', text: 'Strava connected successfully!' });
      setActiveTab('integrations');
      fetchProfile();
      setSearchParams({});
    } else if (searchParams.get('strava_error')) {
      const error = searchParams.get('strava_error');
      const errorMessages = {
        missing_code: 'Authorization code missing',
        missing_state: 'Security validation failed',
        invalid_state: 'Invalid or expired session',
        connection_failed: 'Failed to connect to Strava',
        already_connected: 'This Strava account is already linked to another Korsana account',
      };
      setStravaMessage({ type: 'error', text: errorMessages[error] || 'Failed to connect Strava' });
      setActiveTab('integrations');
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setGeneralError('');
      const data = await userProfileAPI.getFullProfile();
      setProfileData(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setGeneralError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    await fetchProfile(); // Re-fetch the data to reflect changes
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-40 bg-border-light rounded-xl animate-pulse" />
        <div className="h-10 w-48 bg-border-light rounded-lg animate-pulse" />
        <div className="h-64 bg-border-light rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pb-12">
      {generalError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error text-white text-sm rounded-lg px-4 py-3 mb-6"
        >
          {generalError}
        </motion.div>
      )}

      {/* Profile Banner */}
      <ProfileBanner profileData={profileData} onUpdate={handleProfileUpdate} />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-6 border-b border-border my-8">
        {['profile', 'integrations', 'notifications', 'account'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[0.9375rem] font-semibold transition-colors relative capitalize ${activeTab === tab ? 'text-navy' : 'text-text-muted hover:text-text-secondary'
              }`}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="settingsTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            <PersonalRecords profileData={profileData} onUpdate={handleProfileUpdate} />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2">
                <WeeklySummaryCard profileData={profileData} />
              </div>
              <div className="md:col-span-3">
                <TrainingZonesCard profileData={profileData} onUpdate={handleProfileUpdate} />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'integrations' && (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            <ConnectedServicesCard
              stravaConnected={profileData?.strava?.connected}
              stravaAthleteId={profileData?.strava?.athlete_id}
              stravaMessage={stravaMessage}
              onConnectStrava={async () => {
                try {
                  const response = await stravaAPI.getAuthURL();
                  window.location.href = response.url;
                } catch (error) {
                  setStravaMessage({ type: 'error', text: getErrorMessage(error) });
                }
              }}
              onDisconnect={handleProfileUpdate}
              onUpdate={handleProfileUpdate}
            />
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            <NotificationsCard profileData={profileData} onUpdate={handleProfileUpdate} />
          </motion.div>
        )}

        {activeTab === 'account' && (
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                  {profileData?.user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Account Details</h2>
              </div>
              <div className="grid text-[0.9375rem]" style={{ gridTemplateColumns: 'minmax(120px, auto) 1fr', gap: '0.75rem 1rem' }}>
                <span className="text-sm text-text-secondary">Email</span>
                <span className="font-medium">{profileData?.user?.email}</span>

                <span className="text-sm text-text-secondary">Member since</span>
                <span className="font-medium">
                  {profileData?.user?.created_at
                    ? new Date(profileData.user.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    : '\u2014'}
                </span>

                <span className="text-sm text-text-secondary">User ID</span>
                <span className="font-mono text-sm text-text-muted">
                  {profileData?.user?.id?.slice(0, 8)}...
                </span>
              </div>
            </div>

            <ChangeEmailForm />
            <UnitsPreferenceCard profileData={profileData} onUpdate={handleProfileUpdate} />
            <ChangePasswordForm />
            <DataExportCard />
            <DeleteAccountCard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
