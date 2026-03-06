import { useState } from 'react';
import { userProfileAPI } from '../../api/userProfile';

const DataExportCard = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await userProfileAPI.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'korsana-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data', err);
      alert('Failed to download data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Export Data</h2>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        Download a copy of your Korsana profile, personal records, and training zones in JSON format.
      </p>

      <button
        onClick={handleExport}
        disabled={loading}
        className="btn btn-outline flex items-center gap-2 text-sm"
      >
        {loading ? 'Generating File...' : 'Download My Data'}
      </button>
    </div>
  );
};

export default DataExportCard;
