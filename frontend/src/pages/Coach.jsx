import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { coachAPI } from '../api/coach';
import { goalsAPI } from '../api/goals';
import { getErrorMessage } from '../api/client';
import ReactMarkdown from 'react-markdown';

// ── Design tokens (style guide) ───────────────────────────────────────────────

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

// ── Constants ────────────────────────────────────────────────────────────────

const PROMPTS = [
  { label: 'Analyze my last week', icon: '📊' },
  { label: 'Should I run today?',  icon: '🏃' },
  { label: 'Build me a plan',      icon: '📅' },
  { label: 'Is my goal realistic?',icon: '🎯' },
];

const SIDEBAR_W = 252;   // px when open
const NAV_H     = 64;    // navbar height
const PY        = 16;    // coach page top padding (py-4 = 16 * 2)
const CHAT_H    = `calc(100dvh - ${NAV_H + PY * 2}px)`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeDay(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today - d) / 86400000);
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

// ── Main component ───────────────────────────────────────────────────────────

const Coach = () => {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [sessions, setSessions]                 = useState([]);
  const [activeSession, setActiveSession]       = useState(null); // CoachSession object
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

  // Load messages for a session
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

  // Create a new session
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

  // Send a message
  const sendMessage = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading || quota.remaining <= 0) return;

    // Need a session — create one lazily if missing
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
      const data = await coachAPI.sendMessage(msg, session.id);
      applyQuota(data._quota);

      // If this was the first message, update the session title in the list
      setMessages(prev => {
        const without = prev.filter(m => !m._opt);
        return sortMsgs([
          ...without,
          { role: 'user', content: msg, created_at: ts, session_id: session.id },
          { role: 'assistant', content: data.response, created_at: new Date().toISOString(), session_id: session.id },
        ]);
      });

      // Refresh sessions to pick up auto-generated title
      const updated = await coachAPI.getSessions();
      if (updated?.sessions) setSessions(updated.sessions);
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

  return (
    <div style={{ display: 'flex', height: CHAT_H, width: '100%', overflow: 'hidden', gap: '0' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <motion.div
        animate={{ width: sidebarOpen ? SIDEBAR_W : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ overflow: 'hidden', flexShrink: 0, height: '100%' }}
      >
        <div style={{
          width: SIDEBAR_W, height: '100%', display: 'flex', flexDirection: 'column',
          background: C.navy, borderRadius: '14px', overflow: 'hidden',
        }}>
          {/* Sidebar top */}
          <div style={{ padding: '16px 12px 12px' }}>
            <button
              onClick={handleNewSession}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '9px 14px', background: C.coral, border: 'none',
                borderRadius: '9px', color: C.white, fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-heading)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10 4v12M4 10h12" />
              </svg>
              New Coaching Session
            </button>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
            {sessions.length > 0 && (
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px',
              }}>
                Conversation History
              </div>
            )}
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
                      display: 'flex', width: '100%', textAlign: 'left',
                      padding: '9px 10px 9px 12px', borderRadius: '8px', border: 'none',
                      marginBottom: '2px', cursor: 'pointer',
                      background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      borderLeft: isActive ? `3px solid ${C.coral}` : '3px solid transparent',
                      transition: 'background 0.15s, border-left 0.15s',
                      flexDirection: 'column',
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
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                          {relativeDay(s.created_at)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{
                          fontFamily: 'var(--font-sans)', fontSize: '12px',
                          fontStyle: 'italic',
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

      {/* ── Toggle button ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', flexShrink: 0 }}>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
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
            {sidebarOpen
              ? <><path d="M6 2L3 5l3 3" /></>
              : <><path d="M4 2l3 3-3 3" /></>
            }
          </svg>
        </button>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>

        {/* Context banner */}
        <div style={{
          padding: '10px 16px', borderBottom: `1px solid ${C.gray100}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.white, borderRadius: '14px 14px 0 0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: C.coral,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '17px', color: C.white,
                boxShadow: '0 2px 8px rgba(232,99,74,0.3)',
              }}>✦</div>
              <div style={{
                position: 'absolute', bottom: '1px', right: '1px',
                width: '9px', height: '9px', borderRadius: '50%',
                background: C.green, border: `2px solid ${C.white}`,
              }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: C.navy }}>
                Korsana Coach
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: C.gray400, letterSpacing: '0.02em' }}>
                {activeGoal
                  ? <>Goal: {activeGoal.race_name}{weeks !== null ? <span style={{ fontFamily: 'var(--font-mono)' }}> · {weeks}w out</span> : ''}</>
                  : 'AI-powered · knows your training'}
              </div>
            </div>
          </div>

          {/* Quota */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 11px', borderRadius: '99px', flexShrink: 0,
            fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600,
            background: exhausted ? 'rgba(232,74,74,0.08)' : lowQuota ? 'rgba(245,166,35,0.1)' : 'rgba(46,204,139,0.1)',
            color: exhausted ? C.red : lowQuota ? C.amber : C.green,
            border: `1px solid ${exhausted ? 'rgba(232,74,74,0.2)' : lowQuota ? 'rgba(245,166,35,0.25)' : 'rgba(46,204,139,0.25)'}`,
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: exhausted ? C.red : lowQuota ? C.amber : C.green,
            }} />
            {exhausted ? 'Limit reached' : <><span style={{ fontFamily: 'var(--font-mono)' }}>{quota.remaining}/{quota.limit}</span> left</>}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', minHeight: 0,
          padding: '16px 16px 8px',
          background: C.bg,
        }}>
          {isInitializing ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', color: C.gray400, fontSize: '14px' }}>Loading…</span>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState onPrompt={sendMessage} disabled={exhausted} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((msg, i) => (
                <Bubble key={`${msg.role}-${msg.created_at || i}-${i}`} msg={msg} userEmail={user?.email} />
              ))}
              {isLoading && <TypingDots />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Plan card */}
        <AnimatePresence>
          {planData && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              style={{
                margin: '0 16px 8px', background: C.gray50,
                border: `1px solid ${C.gray100}`, borderRadius: '12px', padding: '14px',
                position: 'relative', borderLeft: `4px solid ${C.coral}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', color: C.navy }}>7-day training plan</span>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '2px 7px', borderRadius: '4px',
                  background: C.navy, color: C.white,
                }}>Preview</span>
              </div>
              {planData.summary && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: C.gray600, margin: '0 0 10px', lineHeight: 1.6 }}>
                  {planData.summary}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                {planData.plan?.map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 8px', borderRadius: '7px',
                    background: C.white, border: `1px solid ${C.gray100}`, fontSize: '12px',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: C.gray400, width: '70px', flexShrink: 0 }}>{entry.date}</span>
                    <WorkoutPill type={entry.workout_type} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</span>
                    {entry.distance_km > 0 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: C.gray400, marginLeft: 'auto', flexShrink: 0 }}>
                        {(entry.distance_km * 0.621371).toFixed(1)} mi
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={confirmPlan} disabled={isSavingPlan} className="btn btn-primary btn-sm">{isSavingPlan ? 'Saving…' : 'Save to Calendar'}</button>
                <button onClick={() => setPlanData(null)} className="btn btn-ghost btn-sm">Discard</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div style={{ padding: '8px 16px 0', flexShrink: 0, background: C.bg }}>
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
                      background: isGeneratingPlan || isLoading ? C.gray50 : C.gray50,
                      border: `1px solid ${C.gray200}`, borderRadius: '7px',
                      fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
                      color: C.navy,
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
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

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
    }}>{type || 'Run'}</span>
  );
}

function EmptyState({ onPrompt, disabled }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '32px 0' }}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: C.navy,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(27,37,89,0.2)',
        fontSize: '22px', color: C.coral,
      }}>✦</div>
      <p style={{ fontFamily: 'var(--font-sans)', color: C.gray600, fontSize: '13px', maxWidth: '260px', marginBottom: '4px', lineHeight: 1.6 }}>
        Your coach has your training data.
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', color: C.gray400, fontSize: '12px', marginBottom: '22px' }}>
        Start a conversation or pick a topic:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '400px' }}>
        {PROMPTS.map((p, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
            onClick={() => !disabled && onPrompt(p.label)}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 13px',
              background: C.white,
              border: `1px solid ${C.gray100}`,
              borderRadius: '12px',
              boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
              fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500,
              color: C.navy, textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = C.gray50; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.white; }}
          >
            <span style={{ fontSize: '15px' }}>{p.icon}</span>
            {p.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function Bubble({ msg, userEmail }) {
  const isUser = msg.role === 'user';
  const initial = (userEmail?.[0] ?? 'U').toUpperCase();
  const time = msg.created_at && !isNaN(new Date(msg.created_at))
    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
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
          }}>{time}</div>
        )}
      </div>
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
