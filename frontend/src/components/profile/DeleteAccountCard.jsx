import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userProfileAPI } from '../../api/userProfile';

const DeleteAccountCard = () => {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [textVerify, setTextVerify] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (textVerify !== 'DELETE') return;
    try {
      setLoading(true);
      await userProfileAPI.deleteAccount();
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      console.error('Failed to delete account', err);
      alert('Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="card border border-error/20 bg-error/5 text-error">
      <div className="flex items-center gap-2 mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        <h2 className="text-lg font-semibold text-error" style={{ fontFamily: 'var(--font-heading)' }}>Danger Zone</h2>
      </div>

      <p className="text-sm text-error/80 mb-6">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      <AnimatePresence mode="wait">
        {!confirming ? (
          <motion.div
            key="init"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <button
              onClick={() => setConfirming(true)}
              className="btn border border-error text-error hover:bg-error hover:text-white"
            >
              Delete Account
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-semibold text-error">
              Type <strong className="font-mono bg-error/10 px-1 rounded">DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={textVerify}
              onChange={(e) => setTextVerify(e.target.value)}
              placeholder="DELETE"
              className="input border-error/40 focus:border-error focus:ring-1 focus:ring-error w-full md:w-1/2 bg-white"
            />
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setConfirming(false); setTextVerify(''); }}
                className="btn btn-outline text-text-secondary border-border bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={textVerify !== 'DELETE' || loading}
                className="btn bg-error text-white border-error hover:bg-error/90 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeleteAccountCard;
