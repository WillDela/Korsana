import { Link } from 'react-router-dom';

const ACTIVITY_ICON = (
  <svg className="w-4 h-4 text-text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const RecentActivitiesCard = ({ activities = [], formatPace, metersToMiles, formatDate }) => {
  const recent = activities.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted" style={{ fontFamily: 'var(--font-heading)' }}>
          Recent Activities
        </h3>
        <Link to="/calendar" className="text-[10px] font-semibold uppercase tracking-wider text-navy hover:text-navy-light transition-colors no-underline">
          View All History
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="p-8 text-center text-sm text-text-muted">
          No activities yet — sync your Strava
        </div>
      ) : (
        <div className="divide-y divide-border-light">
          {recent.map((activity, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-elevated transition-colors">
              {ACTIVITY_ICON}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{activity.name}</div>
                <div className="text-xs text-text-muted">{formatDate(activity.start_time)}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-medium text-text-primary font-mono">
                  {metersToMiles(activity.distance_meters)} mi
                </div>
                <div className="text-xs text-text-muted font-mono">
                  {formatPace(activity.average_pace_seconds_per_km)}/mi
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivitiesCard;
