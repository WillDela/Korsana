import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userProfileAPI } from '../api/userProfile';
import { setUserTimezone } from '../lib/userTimezone';

const SYNC_FLAG_KEY = 'korsana_tz_sync_done';

// detectBrowserTimezone returns the browser's IANA timezone, or 'UTC' if the
// runtime can't resolve one (rare; old browsers in restricted environments).
export const detectBrowserTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch {
    return 'UTC';
  }
};

// useTimezoneSync runs once per browser after the user authenticates. If the
// stored timezone is still the default 'UTC' but the browser reports something
// else, it PATCHes the profile to the detected zone and records a localStorage
// flag so a later manual override (back to 'UTC' or elsewhere) is never
// silently re-overwritten on the next load.
export const useTimezoneSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(SYNC_FLAG_KEY) === '1') return;

    let cancelled = false;

    (async () => {
      try {
        const data = await userProfileAPI.getFullProfile();
        if (cancelled) return;
        const stored = data?.profile?.timezone || 'UTC';
        const detected = detectBrowserTimezone();
        if (stored === 'UTC' && detected !== 'UTC') {
          await userProfileAPI.updateProfile({ timezone: detected });
          setUserTimezone(detected);
        } else {
          setUserTimezone(stored);
        }
      } catch (err) {
        console.error('Timezone auto-sync failed:', err);
        return;
      } finally {
        if (!cancelled) localStorage.setItem(SYNC_FLAG_KEY, '1');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
};
