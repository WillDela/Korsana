import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { coachAPI } from '../api/coach';
import { goalsAPI } from '../api/goals';
import { getErrorMessage } from '../api/client';
import ReactMarkdown from 'react-markdown';
import AppPageHero from '../components/ui/AppPageHero';
import EvidenceCard from '../components/ui/EvidenceCard';
import ContextRail from '../components/coach/ContextRail';
import CoachStartSurface from '../components/coach/CoachStartSurface';
import ArtifactRenderer from '../components/coach/ArtifactRenderer';
import PlanBoard from '../components/coach/PlanBoard';

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  navy:    '#1B2559',
  coral:   '#E8634A',
  bg:      '#F5F6FA',
  white:   '#FFFFFF',
  gray50:  '#F8F9FC',
  gray100: '#ECEEF4',
  gray200: '#D4D8E8',
  gray400: '#8B93B0',
  gray600: '#4A5173',
  green:   '#2ECC8B',
  amber:   '#F5A623',
  red:     '#E84A4A',
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SIDEBAR_W  = 220;   // session rail width when open
const CONTEXT_W  = 280;   // context rail width when open
const NAV_H      = 64;    // navbar height
const PY         = 16;    // page top padding
const CHAT_H     = `calc(100dvh - ${NAV_H + PY * 2}px)`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeDay(dateStr) {
  const d    = new Date(dateStr);
  const today = new Date();
  const diff  = Math.floor((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function weeksUntil(dateStr) {
  if (!dateStr) return null;
  const ms = new Date(dateStr) - new Date();
  if (ms < 0) return null;
  return Math.round(ms / 604800000);
}

function sortMsgs(msgs) {
  return [...msgs].sort((a, b) => {
    const d = new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (d !== 0) return d;
    if (a.role === 'user' && b.role !== 'user') return -1;
    return 1;
  });
}

// ── Toggle button ─────────────────────────────────────────────────────────────

function PanelToggle({ open, onToggle, direction = 'left', title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <button
        onClick={onToggle}
        title={title}
        style={{
          width: '22px', height: '40px', border: `1px solid ${C.gray200}`,
          borderRadius: '6px', background: C.white, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.gray400, padding: 0,
          boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.gray50; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.white; }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {direction === 'left'
            ? (open ? <path d="M6 2L3 5l3 3" /> : <path d="M4 2l3 3-3 3" />)
            : (open ? <path d="M4 2l3 3-3 3" /> : <path d="M6 2L3 5l3 3" />)
          }
        </svg>
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const Coach = () => {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [contextRailOpen, setContextRailOpen]   = useState(true);
  const [mode, setMode] = useState(() => localStorage.getItem('coach_mode') || 'copilot');
  const [sessions, setSessions]                 = useState([]);
  const [activeSession, setActiveSession]       = useState(null);
  const [messages, setMessages]                 = useState([]);
  const [input, setInput]                       = useState('');
  const [isLoading, setIsLoading]               = useState(false);
  const [isInitializing, setIsInitializing]     = useState(true);
  const [planData, setPlanData]                 = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSavingPlan, setIsSavingPlan]         = useState(false);
  const [activeGoal, setActiveGoal]             = useState(null);
  const [quota, setQuota]                       = useState({ used: 0, limit: 10, remaining: 10 });

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const initDone  = useRef(false);

  const applyQuota = useCallback((q) => {
    if (q) setQuota(prev => ({ ...prev, ...q }));
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('coach_mode', newMode);
  };

  // Initial load
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      const [sessRes, goalRes, quotaRes] = await Promise.allSettled([
        coachAPI.getSessions(),
        goalsAPI.getActiveGoal(),
        coachAPI.getQuota(),
      ]);

      if (goalRes.status === 'fulfilled' && goalRes.value?.goal) {
        setActiveGoal(goalRes.value.goal);
      }
      if (quotaRes.status === 'fulfilled') {
        setQuota(quotaRes.value);
      }
      if (sessRes.status === 'fulfilled') {
        const list = sessRes.value?.sessions ?? [];
        setSessions(list);
        if (list.length > 0) {
          await loadSession(list[0]);
        }
      }
      setIsInitializing(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadSession = async (session) => {
    setActiveSession(session);
    setMessages([]);
    setPlanData(null);
    try {
      const data = await coachAPI.getSessionMessages(session.id);
      setMessages(sortMsgs((data?.messages ?? []).map(m => ({ ...m, content: m.content || '' }))));
    } catch {
      setMessages([]);
    }
  };

  const handleNewSession = async () => {
    try {
      const data = await coachAPI.createSession();
      const session = data.session;
      setSessions(prev => [session, ...prev]);
      setActiveSession(session);
      setMessages([]);
      setPlanData(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading || quota.remaining <= 0) return;

    let session = activeSession;
    if (!session) {
      try {
        const data = await coachAPI.createSession();
        session = data.session;
        setSessions(prev => [session, ...prev]);
        setActiveSession(session);
      } catch {
        return;
      }
    }

    const ts = new Date().toISOString();
    const optimistic = { role: 'user', content: msg, created_at: ts, _opt: true };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await coachAPI.sendMessage(msg, session.id, mode);
      applyQuota(data._quota);

      setMessages(prev => {
        const without = prev.filter(m => !m._opt);
        return sortMsgs([
          ...without,
          { role: 'user', content: msg, created_at: ts, session_id: session.id },
          { role: 'assistant', content: data.response, artifact: data.artifact ?? null, evidence: data.evidence ?? null, created_at: new Date().toISOString(), session_id: session.id },
        ]);
      });

      if (data.session_title) {
        setSessions(prev => prev.map(s =>
          s.id === session.id ? { ...s, title: data.session_title } : s
        ));
        setActiveSession(prev => prev?.id === session.id ? { ...prev, title: data.session_title } : prev);
      }
    } catch (error) {
      const isLimit = error?.response?.status === 429;
      setMessages(prev => {
        const without = prev.filter(m => !m._opt);
        return [
          ...without,
          { role: 'user', content: msg, created_at: ts },
          {
            role: 'assistant',
            content: isLimit
              ? `You've used all ${quota.limit} questions for today. Check back tomorrow.`
              : `Something went wrong — ${getErrorMessage(error)}`,
            created_at: new Date().toISOString(),
            isError: true,
          },
        ];
      });
      if (isLimit) setQuota(prev => ({ ...prev, remaining: 0, used: prev.limit }));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const generatePlan = async () => {
    if (quota.remaining <= 0) return;
    setIsGeneratingPlan(true);
    setPlanData(null);
    try {
      const data = await coachAPI.generatePlan(7, false);
      applyQuota(data._quota);
      setPlanData(data);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Couldn't generate a plan — ${getErrorMessage(error)}`,
        created_at: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const confirmPlan = async () => {
    setIsSavingPlan(true);
    try {
      await coachAPI.generatePlan(7, true);
      setPlanData(null);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '**Plan saved.** Check your Calendar — your next 7 workouts are ready.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exhausted = quota.remaining <= 0;
  const lowQuota  = !exhausted && quota.remaining <= 3;
  const weeks     = weeksUntil(activeGoal?.race_date);

  const heroSubtitle = activeGoal
    ? `${activeGoal.race_name}${weeks !== null ? ` · ${weeks}w out` : ''}`
    : 'No active goal';

  const heroStatus = exhausted
    ? { label: 'Limit reached', variant: 'danger' }
    : lowQuota
      ? { label: `${quota.remaining}/${quota.limit} left`, variant: 'warning' }
      : { label: `${quota.remaining}/${quota.limit} left`, variant: 'success' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: CHAT_H }}>

      {/* ── Page hero ─────────────────────────────────────────────────── */}
      <AppPageHero
        title="Korsana Coach"
        subtitle={heroSubtitle}
        status={heroStatus}
        primaryAction={{ label: 'New Session', onClick: handleNewSession }}
      >
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </AppPageHero>

      {/* ── Three-panel row ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '8px', minHeight: 0 }}>

        {/* Session rail */}
        <motion.div
          animate={{ width: sidebarOpen ? SIDEBAR_W : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ overflow: 'hidden', flexShrink: 0, height: '100%' }}
        >
          <div style={{
            width: SIDEBAR_W, height: '100%', display: 'flex', flexDirection: 'column',
            background: C.navy, borderRadius: '14px', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 12px 10px', flexShrink: 0 }}>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase', paddingLeft: '4px',
              }}>
                Sessions
              </div>
            </div>

            {/* Session list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
              {isInitializing ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-sans)', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>
                  Loading…
                </div>
              ) : sessions.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-sans)', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>
                  No sessions yet
                </div>
              ) : (
                sessions.map(s => {
                  const isActive = activeSession?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s)}
                      style={{
                        display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
                        padding: '9px 10px 9px 12px', borderRadius: '8px', border: 'none',
                        marginBottom: '2px', cursor: 'pointer',
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        borderLeft: isActive ? `3px solid ${C.coral}` : '3px solid transparent',
                        transition: 'background 0.15s, border-left 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {s.title && s.title !== 'New session' ? (
                        <>
                          <div style={{
                            fontFamily: 'var(--font-sans)', fontSize: '13px',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? C.white : 'rgba(255,255,255,0.72)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            marginBottom: '2px',
                          }}>
                            {s.title}
                          </div>
                          {s.summary && (
                            <div style={{
                              fontFamily: 'var(--font-sans)', fontSize: '11px',
                              color: 'rgba(255,255,255,0.42)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              marginBottom: '2px', lineHeight: 1.3,
                            }}>
                              {s.summary}
                            </div>
                          )}
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                            {relativeDay(s.created_at)}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{
                            fontFamily: 'var(--font-sans)', fontSize: '12px', fontStyle: 'italic',
                            color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            marginBottom: '2px',
                          }}>
                            New session
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                            {relativeDay(s.created_at)}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Left toggle */}
        <PanelToggle
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          direction="left"
          title={sidebarOpen ? 'Collapse sessions' : 'Expand sessions'}
        />

        {/* ── Center: chat column ──────────────────────────────────────── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%',
          background: C.white, borderRadius: '14px', overflow: 'hidden',
        }}>
          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', minHeight: 0,
            padding: '16px 16px 8px', background: C.bg,
          }}>
            {isInitializing ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', color: C.gray400, fontSize: '14px' }}>
                  Loading…
                </span>
              </div>
            ) : messages.length === 0 ? (
              <CoachStartSurface
                onPrompt={sendMessage}
                disabled={exhausted}
                sessions={sessions}
                onSelectSession={loadSession}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, i) => (
                  <div key={`${msg.role}-${msg.created_at || i}-${i}`}>
                    <Bubble msg={msg} userEmail={user?.email} />
                    {msg.artifact && <ArtifactRenderer artifact={msg.artifact} />}
                  </div>
                ))}
                {isLoading && <TypingDots />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Plan board */}
          <AnimatePresence>
            {planData && (
              <PlanBoard
                planData={planData}
                onConfirm={confirmPlan}
                onDiscard={() => setPlanData(null)}
                isSaving={isSavingPlan}
              />
            )}
          </AnimatePresence>

          {/* Input */}
          <div style={{ padding: '8px 16px 12px', flexShrink: 0, background: C.bg }}>
            <div style={{
              background: C.white, borderRadius: '12px', padding: '10px 12px',
              border: `1px solid ${C.gray100}`,
              boxShadow: '0 1px 2px rgba(27,37,89,0.05), 0 2px 12px rgba(27,37,89,0.04)',
              opacity: exhausted ? 0.55 : 1,
            }}>
              {exhausted ? (
                <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', color: C.gray400, fontSize: '13px', margin: 0, padding: '6px 0' }}>
                  You've used all <span style={{ fontFamily: 'var(--font-mono)' }}>{quota.limit}</span> questions today. Resets at midnight.
                </p>
              ) : (
                <>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your coach anything…"
                    disabled={isLoading}
                    rows={1}
                    style={{
                      width: '100%', border: 'none', outline: 'none', resize: 'none',
                      minHeight: '36px', maxHeight: '110px', background: 'transparent',
                      fontSize: '14px', fontFamily: 'var(--font-sans)', color: C.navy,
                      boxSizing: 'border-box', padding: '0 4px', lineHeight: 1.5,
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <button
                      onClick={generatePlan}
                      disabled={isGeneratingPlan || isLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 10px',
                        background: C.gray50, border: `1px solid ${C.gray200}`,
                        borderRadius: '7px', fontFamily: 'var(--font-sans)',
                        fontSize: '12px', fontWeight: 600, color: C.navy,
                        cursor: isGeneratingPlan || isLoading ? 'not-allowed' : 'pointer',
                        opacity: isGeneratingPlan || isLoading ? 0.5 : 1,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isGeneratingPlan && !isLoading) e.currentTarget.style.background = C.gray100; }}
                      onMouseLeave={e => { e.currentTarget.style.background = C.gray50; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="4" width="14" height="13" rx="2" />
                        <path d="M7 2v4M13 2v4M3 9h14" />
                      </svg>
                      {isGeneratingPlan ? 'Building…' : 'Build plan'}
                    </button>
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 18px', background: C.navy, color: C.white,
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                        opacity: !input.trim() || isLoading ? 0.4 : 1,
                        fontFamily: 'var(--font-heading)', transition: 'opacity 0.15s',
                      }}
                    >
                      Send
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 10h12M10 4l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right toggle */}
        <PanelToggle
          open={contextRailOpen}
          onToggle={() => setContextRailOpen(o => !o)}
          direction="right"
          title={contextRailOpen ? 'Collapse context' : 'Expand context'}
        />

        {/* Context rail */}
        <motion.div
          animate={{ width: contextRailOpen ? CONTEXT_W : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ overflow: 'hidden', flexShrink: 0, height: '100%' }}
        >
          <ContextRail activeGoal={activeGoal} quota={quota} isOpen={contextRailOpen} />
        </motion.div>

      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', borderRadius: '8px', overflow: 'hidden',
      border: `1px solid ${C.gray200}`,
    }}>
      {['copilot', 'guide'].map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '5px 14px',
            fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
            background: mode === m ? C.navy : C.white,
            color: mode === m ? C.white : C.gray400,
            border: 'none', cursor: 'pointer',
            textTransform: 'capitalize',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  );
}

const WORKOUT_COLORS = {
  Easy:          { bg: '#E8F0FE', text: '#2A3A7C' },
  'Long Run':    { bg: C.navy,    text: C.white    },
  Tempo:         { bg: '#FDE8E3', text: '#C0391B'  },
  Intervals:     { bg: '#FFF3CD', text: '#856404'  },
  Rest:          { bg: C.gray100, text: C.gray400  },
  'Cross Train': { bg: '#F0FDE8', text: '#2A5A1B'  },
};

function WorkoutPill({ type }) {
  const s = WORKOUT_COLORS[type] ?? WORKOUT_COLORS.Easy;
  return (
    <span style={{
      background: s.bg, color: s.text,
      borderRadius: '5px', padding: '2px 7px',
      fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {type || 'Run'}
    </span>
  );
}

function Bubble({ msg, userEmail }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const isUser      = msg.role === 'user';
  const hasEvidence = !isUser && msg.evidence?.length > 0;
  const initial     = (userEmail?.[0] ?? 'U').toUpperCase();
  const time        = msg.created_at && !isNaN(new Date(msg.created_at))
    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
          background: isUser ? C.navy : C.coral,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.white,
          fontSize: isUser ? '10px' : '12px',
          fontWeight: isUser ? 700 : 400,
          marginBottom: '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}>
          {isUser ? initial : '✦'}
        </div>
        <div style={{
          maxWidth: '80%', padding: '10px 14px',
          fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: 1.65,
          background: isUser ? C.navy : (msg.isError ? 'rgba(232,74,74,0.06)' : C.white),
          color: isUser ? C.white : (msg.isError ? C.red : '#1a1a1a'),
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          border: isUser ? 'none' : `1px solid ${msg.isError ? 'rgba(232,74,74,0.2)' : C.gray100}`,
          boxShadow: '0 1px 3px rgba(27,37,89,0.05)',
        }}>
          {isUser
            ? <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
            : <div className="space-y-2"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
          }
          {time && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: isUser ? 'rgba(255,255,255,0.35)' : C.gray400,
              marginTop: '4px', textAlign: isUser ? 'right' : 'left',
            }}>
              {time}
            </div>
          )}
        </div>
      </div>

      {/* "Why?" evidence expander — assistant messages only */}
      {hasEvidence && (
        <div style={{ marginLeft: '34px', marginTop: '4px' }}>
          <button
            onClick={() => setShowEvidence(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 10px', borderRadius: '12px',
              border: `1px solid ${C.gray200}`, background: C.white,
              fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600,
              color: C.gray600, cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.gray50; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.white; }}
          >
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 9v5M10 6.5v.5" />
            </svg>
            {showEvidence ? 'Hide context' : 'Why?'}
          </button>
          {showEvidence && (
            <div style={{ marginTop: '6px', maxWidth: '340px' }}>
              <EvidenceCard items={msg.evidence} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%',
        background: C.coral,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.white, fontSize: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}>✦</div>
      <div style={{
        padding: '10px 14px', background: C.white,
        border: `1px solid ${C.gray100}`,
        borderRadius: '4px 16px 16px 16px',
        boxShadow: '0 1px 3px rgba(27,37,89,0.05)',
      }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '14px' }}>
          {[0, 0.18, 0.36].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay }}
              style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.coral, opacity: 0.7 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Coach;
