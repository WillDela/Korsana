// Timezone helpers that read the user's stored IANA zone (set by
// useTimezoneSync / TimezoneCard) and format dates in that zone instead of
// the browser default. This is the frontend half of the Phase 3.1 cutover:
// the backend now stores activities with a real UTC start_time + local_date,
// so the frontend must render dates in the user's chosen zone for the
// calendar bucket to match across devices and travel.

const STORAGE_KEY = 'korsana_tz';

const detectBrowser = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const getUserTimezone = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage unavailable (private mode / disabled); fall through.
  }
  return detectBrowser();
};

export const setUserTimezone = (tz) => {
  if (!tz) return;
  try {
    localStorage.setItem(STORAGE_KEY, tz);
  } catch {
    // Ignore — storage failures shouldn't crash a profile update.
  }
};

// dateKeyInTZ returns YYYY-MM-DD for the given Date/timestamp/ISO string as
// it would read on a wall clock in the user's timezone.
export const dateKeyInTZ = (input, tz = getUserTimezone()) => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

// todayKeyInTZ is dateKeyInTZ(new Date()) — the current calendar date as seen
// by the user, regardless of where their browser is right now.
export const todayKeyInTZ = (tz = getUserTimezone()) => dateKeyInTZ(new Date(), tz);

// formatDateInTZ formats a date using Intl.DateTimeFormat with the user's TZ
// pinned. Pass any Intl.DateTimeFormat options for shape control.
export const formatDateInTZ = (input, options = {}, tz = getUserTimezone()) => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...options }).format(d);
};

// weeksUntilInTZ counts whole weeks between today (user TZ) and the target
// calendar date. Pure date math — no DST or offset edge cases because both
// endpoints are normalized to YYYY-MM-DD first.
export const weeksUntilInTZ = (dateStr, tz = getUserTimezone()) => {
  if (!dateStr) return 0;
  const targetKey = dateKeyInTZ(dateStr, tz);
  const todayKey = todayKeyInTZ(tz);
  if (!targetKey || !todayKey) return 0;
  // Parse YYYY-MM-DD as UTC midnight on both sides so the subtraction is a
  // clean integer-day delta with no DST drift.
  const target = new Date(`${targetKey}T00:00:00Z`);
  const today = new Date(`${todayKey}T00:00:00Z`);
  const diffDays = Math.ceil((target - today) / (24 * 3600 * 1000));
  return Math.max(0, Math.ceil(diffDays / 7));
};
