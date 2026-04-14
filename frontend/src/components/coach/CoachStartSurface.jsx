import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LuChartColumnBig, LuActivity, LuCalendar, LuTarget } from 'react-icons/lu';
import { coachAPI } from '../../api/coach';

const PROMPTS = [
  {
    label: 'Analyze my last week',
    Icon: LuChartColumnBig,
    desc: 'Volume, pacing, and key workouts reviewed',
  },
  {
    label: 'Should I run today?',
    Icon: LuActivity,
    desc: 'Recovery and load assessment for today',
  },
  {
    label: 'Build me a plan',
    Icon: LuCalendar,
    desc: '7-day training plan tailored to your goal',
  },
  {
    label: 'Is my goal realistic?',
    Icon: LuTarget,
    desc: 'Feasibility check based on your current fitness',
  },
];

export default function CoachStartSurface({ onPrompt, disabled, sessions, onSelectSession }) {
  const [insight, setInsight]         = useState(null);
  const [insightLoaded, setInsightLoaded] = useState(false);

  useEffect(() => {
    coachAPI.getInsight()
      .then(d => setInsight(d?.insight ?? null))
      .catch(() => {})
      .finally(() => setInsightLoaded(true));
  }, []);

  const recentSessions = sessions.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ height: '100%', overflowY: 'auto', padding: '28px 36px' }}
    >
      {/* Today's briefing */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B93B0',
          marginBottom: '10px',
        }}>
          Today's Briefing
        </div>
        {!insightLoaded ? (
          <div style={{
            height: '68px', background: '#F5F6FA', borderRadius: '12px',
            border: '1px solid #ECEEF4',
          }} />
        ) : (
          <div style={{
            background: 'rgba(27,37,89,0.04)', borderRadius: '12px',
            padding: '14px 16px', border: '1px solid rgba(27,37,89,0.08)',
            borderLeft: '4px solid #1B2559',
          }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '14px',
              color: '#1a1a1a', lineHeight: 1.65, margin: 0,
            }}>
              {insight ?? 'Your coach is ready. Ask anything about your training.'}
            </p>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div style={{ marginBottom: recentSessions.length > 0 ? '28px' : 0 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B93B0',
          marginBottom: '10px',
        }}>
          Quick Start
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {PROMPTS.map((p, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              onClick={() => !disabled && onPrompt(p.label)}
              disabled={disabled}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: '8px', padding: '16px', background: '#FFFFFF',
                border: '1px solid #ECEEF4', borderRadius: '12px',
                boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1, textAlign: 'left',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                if (!disabled) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(27,37,89,0.1)';
                  e.currentTarget.style.borderColor = '#D4D8E8';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(27,37,89,0.05)';
                e.currentTarget.style.borderColor = '#ECEEF4';
              }}
            >
              <p.Icon size={18} color="#1B2559" />
              <div>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: '13px',
                  fontWeight: 600, color: '#1B2559', marginBottom: '3px',
                }}>
                  {p.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: '11px',
                  color: '#8B93B0', lineHeight: 1.4,
                }}>
                  {p.desc}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B93B0',
            marginBottom: '10px',
          }}>
            Recent Sessions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentSessions.map(s => (
              <button
                key={s.id}
                onClick={() => onSelectSession?.(s)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  width: '100%', padding: '10px 12px', background: '#F5F6FA',
                  borderRadius: '10px', border: '1px solid #ECEEF4',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#D4D8E8';
                  e.currentTarget.style.background = '#ECEEF4';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#ECEEF4';
                  e.currentTarget.style.background = '#F5F6FA';
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: '12px',
                  fontWeight: 500, color: '#1B2559',
                }}>
                  {s.title && s.title !== 'New session' ? s.title : 'Unnamed session'}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: '#8B93B0', marginTop: '2px',
                }}>
                  {new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
