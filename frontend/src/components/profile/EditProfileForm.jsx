import { useState } from 'react';
import { userProfileAPI } from '../../api/userProfile';
import { getErrorMessage } from '../../api/client';

const EditProfileForm = ({ profileData, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    display_name: profileData?.profile?.display_name || '',
    max_heart_rate: profileData?.profile?.max_heart_rate || '',
    resting_heart_rate: profileData?.profile?.resting_heart_rate || '',
    weekly_distance_goal_meters: profileData?.profile?.weekly_distance_goal_meters
      ? profileData.profile.weekly_distance_goal_meters / 1000
      : '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        display_name: formData.display_name || null,
        max_heart_rate: formData.max_heart_rate ? parseInt(formData.max_heart_rate, 10) : null,
        resting_heart_rate: formData.resting_heart_rate ? parseInt(formData.resting_heart_rate, 10) : null,
        weekly_distance_goal_meters: formData.weekly_distance_goal_meters
          ? Math.round(parseFloat(formData.weekly_distance_goal_meters) * 1000)
          : null,
      };

      await userProfileAPI.updateProfile(payload);
      await onUpdate();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            name="display_name"
            value={formData.display_name}
            onChange={handleChange}
            className="input bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/40"
            placeholder="How you want to be known"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Weekly Distance Goal (km)
          </label>
          <input
            type="number"
            step="0.1"
            name="weekly_distance_goal_meters"
            value={formData.weekly_distance_goal_meters}
            onChange={handleChange}
            className="input bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/40"
            placeholder="e.g. 50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5 flex items-center gap-2">
            Max Heart Rate (bpm)
            <div className="group relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 cursor-help">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-700 text-xs rounded text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                Default formula: 220 - your age. Adjust if you know your true maximum.
              </div>
            </div>
          </label>
          <input
            type="number"
            name="max_heart_rate"
            value={formData.max_heart_rate}
            onChange={handleChange}
            className="input bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/40"
            placeholder="e.g. 190"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Resting Heart Rate (bpm)
          </label>
          <input
            type="number"
            name="resting_heart_rate"
            value={formData.resting_heart_rate}
            onChange={handleChange}
            className="input bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/40"
            placeholder="e.g. 55"
          />
        </div>
      </div>

      {error && (
        <div className="bg-error/80 border border-error text-white text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="btn bg-transparent border border-white/20 text-white hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn bg-white text-navy border-none font-semibold hover:bg-gray-100"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;
