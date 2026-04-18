import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userProfileAPI } from '../../api/userProfile';
import { getErrorMessage } from '../../api/client';
import EditProfileForm from './EditProfileForm';
import InlineNotice from '../ui/InlineNotice';
import { resolveApiAssetUrl } from '../../lib/assetUrls';

const ProfileBanner = ({ profileData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setAvatarError('');
      await userProfileAPI.uploadAvatar(file);
      await onUpdate();
    } catch (error) {
      console.error('Failed to upload avatar:', getErrorMessage(error));
      setAvatarError(getErrorMessage(error));
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Determine avatar source
  const avatarUrl = resolveApiAssetUrl(profileData?.profile?.profile_picture_url);

  const displayName = profileData?.profile?.display_name || 'Athlete Profile';
  const initial = profileData?.user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="card relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)' }}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-40 h-40 bg-sage opacity-10 rounded-full blur-2xl transform -translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/20 shadow-lg cursor-pointer overflow-hidden bg-navy-light ${uploadingAvatar ? 'opacity-50' : ''}`}
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            {!uploadingAvatar && (
              <div
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {displayName}
            </h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span>{profileData?.user?.email}</span>
              {profileData?.active_goal && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span>Targeting: {profileData.active_goal.race_name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn btn-sm bg-white/10 hover:bg-white/20 text-white border-none transition-colors"
        >
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {avatarError && (
        <InlineNotice variant="error" className="relative z-10 mt-4 bg-white/95 text-[var(--color-danger)]">
          {avatarError}
        </InlineNotice>
      )}

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="pt-8 border-t border-white/10 mt-6 relative z-10">
              <EditProfileForm
                profileData={profileData}
                onClose={() => setIsEditing(false)}
                onUpdate={onUpdate}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileBanner;
