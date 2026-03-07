import { useState } from 'react';
import { userProfileAPI } from '../../api/userProfile';
import { getErrorMessage } from '../../api/client';

const ChangeEmailForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newEmail: '',
    confirmEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newEmail !== formData.confirmEmail) {
      setError('New emails do not match');
      return;
    }

    try {
      setLoading(true);
      await userProfileAPI.changeEmail(formData.currentPassword, formData.newEmail);
      setSuccess('Email address updated successfully.');
      setFormData({ currentPassword: '', newEmail: '', confirmEmail: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Change Email</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="text-sm text-white bg-error rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="text-sm text-white bg-success rounded-lg px-3 py-2">{success}</div>}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            className="input w-full md:w-2/3"
            placeholder="Verify it's you"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">New Email</label>
          <input
            type="email"
            name="newEmail"
            value={formData.newEmail}
            onChange={handleChange}
            required
            className="input w-full md:w-2/3"
            placeholder="new@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Confirm New Email</label>
          <input
            type="email"
            name="confirmEmail"
            value={formData.confirmEmail}
            onChange={handleChange}
            required
            className="input w-full md:w-2/3"
            placeholder="new@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-sm btn-outline self-start mt-2"
        >
          {loading ? 'Updating...' : 'Update Email'}
        </button>
      </form>
    </div>
  );
};

export default ChangeEmailForm;
