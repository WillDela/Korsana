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
          background: '#1B2559', borderRadius: '14px', overflow: 'hidden',
          paddingRight: '8px',
        }}>
          {/* Sidebar top */}
          <div style={{ padding: '16px 12px 12px' }}>
            <button
              onClick={handleNewSession}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '9px 14px', background: '#5B8C3E', border: 'none',
                borderRadius: '9px', color: '#fff', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-heading)',
              }}
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
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
                Conversation History
              </div>
            )}
            {isInitializing ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>
                Loading…
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>
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
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 10px', borderRadius: '8px', border: 'none',
                      marginBottom: '2px', cursor: 'pointer',
                      background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      fontSize: '13px', fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      marginBottom: '2px',
                    }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {relativeDay(s.created_at)}
                    </div>
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
            width: '22px', height: '40px', border: '1.5px solid #E5E7EB',
            borderRadius: '6px', background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#aaa', padding: 0,
          }}
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
          padding: '10px 16px', borderBottom: '1.5px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', borderRadius: '14px 14px 0 0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #5B8C3E, #3d6128)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: '#fff', fontSize: '15px',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 2px 6px rgba(91,140,62,0.3)',
              }}>K</div>
              <div style={{
                position: 'absolute', bottom: '1px', right: '1px',
                width: '9px', height: '9px', borderRadius: '50%',
                background: '#22c55e', border: '2px solid #fff',
              }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: '#111' }}>
                Korsana Coach
              </div>
              <div style={{ fontSize: '11px', color: '#888', letterSpacing: '0.02em' }}>
                {activeGoal
                  ? `Goal: ${activeGoal.race_name}${weeks !== null ? ` · ${weeks}w out` : ''}`
                  : 'AI-powered · knows your training'}
              </div>
            </div>
          </div>

          {/* Quota */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 11px', borderRadius: '99px', flexShrink: 0,
            background: exhausted ? '#FDEAE6' : lowQuota ? '#FDF3E0' : '#F0F7EC',
            color: exhausted ? '#C0503B' : lowQuota ? '#C68A00' : '#5B8C3E',
            fontSize: '11px', fontWeight: 600,
            border: `1px solid ${exhausted ? '#F5C5BB' : lowQuota ? '#F5DFA0' : '#C8E6B4'}`,
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: exhausted ? '#E8725A' : lowQuota ? '#E5A830' : '#5B8C3E',
            }} />
            {exhausted ? 'Limit reached' : `${quota.remaining}/${quota.limit} left`}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', minHeight: 0,
          padding: '16px 16px 8px',
          background: '#F9FAFB',
        }}>
          {isInitializing ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
              <span style={{ color: '#bbb', fontSize: '14px' }}>Loading…</span>
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
                margin: '0 16px 8px', background: '#F2F8EE',
                border: '1.5px solid #C8E6B4', borderRadius: '12px', padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', color: '#1B2559' }}>7-day training plan</span>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '4px', background: '#C8E6B4', color: '#3d6128' }}>Preview</span>
              </div>
              {planData.summary && <p style={{ fontSize: '12px', color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>{planData.summary}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                {planData.plan?.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '7px', background: '#fff', border: '1px solid #E5EFE0', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#aaa', width: '70px', flexShrink: 0 }}>{entry.date}</span>
                    <span style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#E8F3E0', color: '#5B8C3E', flexShrink: 0 }}>{entry.workout_type}</span>
                    <span style={{ fontWeight: 500, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</span>
                    {entry.distance_km > 0 && <span style={{ fontFamily: 'var(--font-mono)', color: '#aaa', marginLeft: 'auto', flexShrink: 0 }}>{(entry.distance_km * 0.621371).toFixed(1)} mi</span>}
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
        <div style={{
          padding: '8px 16px 0', flexShrink: 0,
          background: '#F9FAFB',
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '10px 12px',
            border: '1.5px solid #D4E8C8',
            boxShadow: '0 2px 10px rgba(91,140,62,0.08)',
            opacity: exhausted ? 0.55 : 1,
          }}>
            {exhausted ? (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', margin: 0, padding: '6px 0' }}>
                You've used all {quota.limit} questions today. Resets at midnight.
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
                    fontSize: '14px', fontFamily: 'var(--font-sans)', color: '#111',
                    boxSizing: 'border-box', padding: '0 4px', lineHeight: 1.5,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <button
                    onClick={generatePlan}
                    disabled={isGeneratingPlan || isLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', background: 'transparent',
                      border: '1px solid #D4E8C8', borderRadius: '7px',
                      fontSize: '12px', fontWeight: 500, color: '#5B8C3E',
                      cursor: isGeneratingPlan || isLoading ? 'not-allowed' : 'pointer',
                      opacity: isGeneratingPlan || isLoading ? 0.5 : 1,
                    }}
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
                      padding: '6px 20px', background: '#1B2559', color: '#fff',
                      border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                      cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                      opacity: !input.trim() || isLoading ? 0.4 : 1,
                      fontFamily: 'var(--font-heading)', transition: 'opacity 0.15s',
                    }}
                  >
                    Send
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

function EmptyState({ onPrompt, disabled }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '32px 0' }}
    >
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #E8F3E0, #C8E6B4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(91,140,62,0.15)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B8C3E" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p style={{ color: '#888', fontSize: '13px', maxWidth: '260px', marginBottom: '4px', lineHeight: 1.6 }}>Your coach has your training data.</p>
      <p style={{ color: '#bbb', fontSize: '12px', marginBottom: '20px' }}>Start a conversation or pick a topic:</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '400px' }}>
        {PROMPTS.map((p, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
            onClick={() => !disabled && onPrompt(p.label)}
            disabled={disabled}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 13px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '9px', fontSize: '12px', color: '#333', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, fontFamily: 'var(--font-sans)' }}
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
        background: isUser ? '#1B2559' : 'linear-gradient(135deg, #5B8C3E, #3d6128)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '10px', fontWeight: 700, marginBottom: '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}>
        {isUser ? initial : 'K'}
      </div>
      <div style={{
        maxWidth: '80%', padding: '10px 14px', fontSize: '14px', lineHeight: 1.65,
        background: isUser ? '#1B2559' : (msg.isError ? '#FEF2F0' : '#fff'),
        color: isUser ? '#fff' : (msg.isError ? '#C0503B' : '#1a1a1a'),
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        border: isUser ? 'none' : `1.5px solid ${msg.isError ? '#F5C5BB' : '#E5E7EB'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {isUser
          ? <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
          : <div className="space-y-2"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
        }
        {time && <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '4px', textAlign: isUser ? 'right' : 'left' }}>{time}</div>}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #5B8C3E, #3d6128)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>K</div>
      <div style={{ padding: '10px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '4px 16px 16px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '14px' }}>
          {[0, 0.18, 0.36].map((delay, i) => (
            <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay }} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#5B8C3E', opacity: 0.6 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Coach;
