import { useState, useEffect } from 'react';
import { LuActivity, LuHeart } from 'react-icons/lu';
import { activitiesAPI } from '../../api/activities';
import { userProfileAPI } from '../../api/userProfile';

function trainingPhase(weeksOut) {
  if (weeksOut <= 1) return { label: 'Race Week', color: '#E8725A', bg: 'rgba(232,114,90,0.1)' };
  if (weeksOut <= 3) return { label: 'Taper',     color: '#E5A830', bg: 'rgba(229,168,48,0.1)' };
  if (weeksOut <= 8) return { label: 'Peak',      color: '#4A6CF7', bg: 'rgba(74,108,247,0.1)' };
  return               { label: 'Build',      color: '#2ECC8B', bg: 'rgba(46,204,139,0.1)' };
}

function formatDist(meters) {
  if (!meters) return '—';
  return `${(meters / 1609.34).toFixed(1)} mi`;
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B93B0',
      marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}

export default function ContextRail({ activeGoal, quota, isOpen }) {
  const [activities, setActivities] = useState([]);
  const [zones, setZones]           = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.allSettled([
      activitiesAPI.getActivities('', 1, 3),
      userProfileAPI.getTrainingZones('hr'),
    ]).then(([actRes, zoneRes]) => {
      if (actRes.status === 'fulfilled')  setActivities(actRes.value?.activities ?? []);
      if (zoneRes.status === 'fulfilled') setZones(zoneRes.value?.zones ?? []);
    }).finally(() => setLoading(false));
  }, [isOpen]);

  const weeksOut = activeGoal?.race_date
    ? Math.round((new Date(activeGoal.race_date) - new Date()) / 604800000)
    : null;
  const phase = weeksOut !== null && weeksOut >= 0 ? trainingPhase(weeksOut) : null;

  const exhausted  = quota.remaining <= 0;
  const lowQuota   = !exhausted && quota.remaining <= 3;
  const quotaColor  = exhausted ? '#E84A4A' : lowQuota ? '#E5A830' : '#2ECC8B';
  const quotaBg     = exhausted ? 'rgba(232,74,74,0.06)'   : lowQuota ? 'rgba(245,166,35,0.08)' : 'rgba(46,204,139,0.08)';
  const quotaBorder = exhausted ? 'rgba(232,74,74,0.2)'    : lowQuota ? 'rgba(245,166,35,0.2)'  : 'rgba(46,204,139,0.2)';

  return (
    <div style={{
      width: 280, height: '100%', display: 'flex', flexDirection: 'column',
      background: '#FFFFFF', borderRadius: '14px', border: '1px solid #ECEEF4',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #ECEEF4', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B93B0',
        }}>
          Training Context
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

        {/* Active goal */}
        <div style={{ marginBottom: '18px' }}>
          <SectionLabel>Active Goal</SectionLabel>
          {activeGoal ? (
            <div style={{
              background: '#F5F6FA', borderRadius: '10px', padding: '12px',
              border: '1px solid #ECEEF4',
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: '6px', marginBottom: '6px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700,
                  color: '#1B2559', lineHeight: 1.3,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {activeGoal.race_name}
                </span>
                {phase && (
                  <span style={{
                    flexShrink: 0, fontFamily: 'var(--font-sans)', fontSize: '9px',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '2px 6px', borderRadius: '4px',
                    background: phase.bg, color: phase.color,
                  }}>
                    {phase.label}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8B93B0' }}>
                {activeGoal.race_date
                  ? new Date(activeGoal.race_date).toLocaleDateString([], {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })
                  : '—'}
                {weeksOut !== null && weeksOut >= 0 && (
                  <span style={{ marginLeft: '6px', color: '#4A5173', fontWeight: 600 }}>
                    · {weeksOut}w
                  </span>
                )}
              </div>
              {activeGoal.target_time && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  color: '#4A5173', marginTop: '4px',
                }}>
                  Target: {activeGoal.target_time}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: '#F5F6FA', borderRadius: '10px', padding: '10px 12px',
              border: '1px solid #ECEEF4', textAlign: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#8B93B0' }}>
                No active goal
              </span>
            </div>
          )}
        </div>

        {/* Recent activities */}
        <div style={{ marginBottom: '18px' }}>
          <SectionLabel>Recent Activities</SectionLabel>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: '34px', background: '#F5F6FA', borderRadius: '8px',
                  border: '1px solid #ECEEF4', opacity: 0.6,
                }} />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#8B93B0' }}>
                No recent activities
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activities.slice(0, 3).map((act, i) => (
                <div key={act.id ?? i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', background: '#F5F6FA',
                  borderRadius: '8px', border: '1px solid #ECEEF4',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                    <LuActivity size={12} color="#8B93B0" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500,
                      color: '#1B2559', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {act.name || act.activity_type || 'Run'}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8B93B0',
                    flexShrink: 0, marginLeft: '6px',
                  }}>
                    {formatDist(act.distance_meters)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily quota */}
        <div style={{ marginBottom: '18px' }}>
          <SectionLabel>Daily Quota</SectionLabel>
          <div style={{
            background: quotaBg, border: `1px solid ${quotaBorder}`,
            borderRadius: '10px', padding: '10px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: quotaColor }}>
              {exhausted ? 'Limit reached' : `${quota.remaining} / ${quota.limit} left`}
            </span>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: quotaColor }} />
          </div>
        </div>

        {/* HR zones (if configured) */}
        {zones.length > 0 && (
          <div>
            <SectionLabel>HR Zones</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {zones.slice(0, 5).map((zone, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 8px', background: '#F5F6FA',
                  borderRadius: '6px', border: '1px solid #ECEEF4',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <LuHeart size={10} color="#8B93B0" />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500, color: '#4A5173' }}>
                      {zone.label || `Z${i + 1}`}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8B93B0' }}>
                    {zone.min_hr}–{zone.max_hr}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
