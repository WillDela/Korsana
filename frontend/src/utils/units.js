const METERS_PER_MILE = 1609.34;
const KM_PER_MILE = 1.60934;

export function formatDistance(meters, unit) {
  if (!meters || meters <= 0) return '--';
  if (unit === 'imperial') return `${(meters / METERS_PER_MILE).toFixed(1)} mi`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatPace(secPerKm, unit) {
  if (!secPerKm || secPerKm <= 0) return '--:--';
  const total = unit === 'imperial' ? secPerKm * KM_PER_MILE : secPerKm;
  const label = unit === 'imperial' ? '/mi' : '/km';
  const min = Math.floor(total / 60);
  const sec = Math.floor(total % 60);
  return `${min}:${String(sec).padStart(2, '0')}${label}`;
}

export function distanceLabel(unit) {
  return unit === 'imperial' ? 'mi' : 'km';
}

export function toMeters(value, unit) {
  return unit === 'imperial' ? value * METERS_PER_MILE : value * 1000;
}
