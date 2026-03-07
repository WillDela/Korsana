import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { coachAPI } from '../api/coach';
import { goalsAPI } from '../api/goals';
import { getErrorMessage } from '../api/client';
import ReactMarkdown from 'react-markdown';

const PROMPTS = [
  { label: 'Analyze my last week',   icon: '📊' },
  { label: 'Should I run today?',    icon: '🏃' },
  { label: 'Build me a plan',        icon: '📅' },
  { label: 'Is my goal realistic?',  icon: '🎯' },
];

const WORKOUT_BADGE = {
  easy:        { bg: '#E8F3E0', color: '#5B8C3E' },
  long:        { bg: '#E8EAF2', color: '#1B2559' },
  tempo:       { bg: '#FDF3E0', color: '#C68A00' },
  interval:    { bg: '#FDEAE6', color: '#C0503B' },
  recovery:    { bg: '#E8F3E0', color: '#5B8C3E' },
  rest:        { bg: '#F3F4F6', color: '#6B7280' },
  race:        { bg: '#FDEAE6', color: '#C0503B' },
  cross_train: { bg: '#F3F4F6', color: '#6B7280' },
};

// Sage-tinted background for AI bubbles
const AI_BUBBLE_BG   = '#F2F8EE';
const AI_BUBBLE_BORDER = '#D4E8C8';
const USER_BUBBLE_BG = '#1B2559';

function weeksUntil(dateStr) {
  if (!dateStr) return null;
  const ms = new Date(dateStr) - new Date();
  if (ms < 0) return null;
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000));
}

function sortMessages(msgs) {
  return [...msgs].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (ta !== tb) return ta - tb;
    if (a.role === 'user' && b.role === 'assistant') return -1;
    if (a.role === 'assistant' && b.role === 'user') return 1;
    return 0;
  });
}

const Coach = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      const [hist, goal, q] = await Promise.allSettled([
        coachAPI.getHistory(),
        goalsAPI.getActiveGoal(),
        coachAPI.getQuota(),
      ]);

      if (hist.status === 'fulfilled') {
        const raw = (hist.value?.messages ?? []).map(m => ({ ...m, content: m.content || '' }));
        setMessages(sortMessages(raw));
      }
      if (goal.status === 'fulfilled' && goal.value?.goal) {
        setActiveGoal(goal.value.goal);
      }
      if (q.status === 'fulfilled') {
        setQuota(q.value);
      }
      setIsInitializing(false);
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading || quota.remaining <= 0) return;

    const ts = new Date().toISOString();
    const optimistic = { role: 'user', content: msg, created_at: ts, _optimistic: true };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await coachAPI.sendMessage(msg);
      applyQuota(data._quota);
      setMessages(prev => {
        const without = prev.filter(m => !m._optimistic);
        return sortMessages([
          ...without,
          { role: 'user', content: msg, created_at: ts },
          { role: 'assistant', content: data.response, created_at: new Date().toISOString() },
        ]);
      });
    } catch (error) {
      const isLimit = error?.response?.status === 429;
      setMessages(prev => {
        const without = prev.filter(m => !m._optimistic);
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

  // Navbar h-16 = 64px, coach py-4 = 32px top+bottom
  const chatHeight = 'calc(100dvh - 96px)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: chatHeight, width: '100%' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: '12px', borderBottom: '1.5px solid #E5E7EB', marginBottom: '0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Coach avatar with online dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #5B8C3E 0%, #3d6128 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: '#fff', fontSize: '16px',
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 2px 8px rgba(91,140,62,0.35)',
            }}>
              K
            </div>
            <div style={{
              position: 'absolute', bottom: '1px', right: '1px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#22c55e', border: '2px solid #F5F5F0',
            }} />
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: '#111', lineHeight: 1.2 }}>
              Korsana Coach
            </div>
            {activeGoal ? (
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', lineHeight: 1 }}>
                Goal: {activeGoal.race_name}{weeks !== null ? ` · ${weeks}w out` : ''}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', lineHeight: 1 }}>
                AI-powered · knows your training
              </div>
            )}
          </div>
        </div>

        {/* Quota pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', borderRadius: '99px', flexShrink: 0,
          background: exhausted ? '#FDEAE6' : lowQuota ? '#FDF3E0' : '#F0F7EC',
          color: exhausted ? '#C0503B' : lowQuota ? '#C68A00' : '#5B8C3E',
          fontSize: '12px', fontWeight: 600,
          border: `1px solid ${exhausted ? '#F5C5BB' : lowQuota ? '#F5DFA0' : '#C8E6B4'}`,
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: exhausted ? '#E8725A' : lowQuota ? '#E5A830' : '#5B8C3E',
          }} />
          {exhausted ? 'Daily limit reached' : `${quota.remaining} of ${quota.limit} left`}
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 0 8px' }}>
        {isInitializing ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <span style={{ color: '#bbb', fontSize: '14px' }}>Loading your conversation…</span>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onPrompt={sendMessage} disabled={exhausted} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <Bubble key={`${msg.role}-${msg.created_at || i}-${i}`} msg={msg} userEmail={user?.email} />
            ))}
            {isLoading && <TypingDots />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Plan card ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {planData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{
              margin: '0 0 10px', background: AI_BUBBLE_BG,
              border: `1.5px solid ${AI_BUBBLE_BORDER}`,
              borderRadius: '12px', padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: '#1B2559' }}>
                7-day training plan
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '2px 8px', borderRadius: '4px', background: '#D4E8C8', color: '#3d6128',
              }}>
                Preview
              </span>
            </div>
            {planData.summary && (
              <p style={{ fontSize: '13px', color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>
                {planData.summary}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '180px', overflowY: 'auto' }}>
              {planData.plan?.map((entry, i) => {
                const badge = WORKOUT_BADGE[entry.workout_type] ?? { bg: '#F3F4F6', color: '#6B7280' };
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', borderRadius: '7px', background: '#fff',
                    border: '1px solid #E5EFE0', fontSize: '12px',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#aaa', width: '72px', flexShrink: 0 }}>{entry.date}</span>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: badge.bg, color: badge.color, flexShrink: 0 }}>
                      {entry.workout_type}
                    </span>
                    <span style={{ fontWeight: 500, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</span>
                    {entry.distance_km > 0 && (
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#aaa', marginLeft: 'auto', flexShrink: 0 }}>{(entry.distance_km * 0.621371).toFixed(1)} mi</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={confirmPlan} disabled={isSavingPlan} className="btn btn-primary btn-sm">
                {isSavingPlan ? 'Saving…' : 'Save to Calendar'}
              </button>
              <button onClick={() => setPlanData(null)} className="btn btn-ghost btn-sm">Discard</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: '14px', padding: '10px 12px',
        border: '1.5px solid #D4E8C8',
        boxShadow: '0 2px 12px rgba(91,140,62,0.10)',
        opacity: exhausted ? 0.55 : 1,
      }}>
        {exhausted ? (
          <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', margin: 0, padding: '6px 0' }}>
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
                minHeight: '38px', maxHeight: '120px', background: 'transparent',
                fontSize: '15px', fontFamily: 'var(--font-sans)', color: '#111',
                boxSizing: 'border-box', padding: '2px 4px', lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <button
                onClick={generatePlan}
                disabled={isGeneratingPlan || isLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', background: 'transparent',
                  border: '1px solid #D4E8C8', borderRadius: '8px',
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
                  padding: '7px 22px', background: '#1B2559',
                  color: '#fff', border: 'none', borderRadius: '9px',
                  fontSize: '14px', fontWeight: 600, cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                  opacity: !input.trim() || isLoading ? 0.4 : 1,
                  fontFamily: 'var(--font-heading)',
                  transition: 'opacity 0.15s',
                }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

function EmptyState({ onPrompt, disabled }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '40px 16px' }}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #E8F3E0, #C8E6B4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px',
        boxShadow: '0 2px 8px rgba(91,140,62,0.15)',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8C3E" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p style={{ color: '#888', fontSize: '14px', maxWidth: '280px', marginBottom: '8px', lineHeight: 1.6 }}>
        Your coach has your training data.
      </p>
      <p style={{ color: '#bbb', fontSize: '12px', marginBottom: '24px' }}>Start a conversation or pick a topic:</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '480px' }}>
        {PROMPTS.map((p, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.07 }}
            onClick={() => !disabled && onPrompt(p.label)}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 14px', background: '#fff',
              border: '1.5px solid #E5E7EB', borderRadius: '10px',
              fontSize: '13px', color: '#333', textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          >
            <span style={{ fontSize: '16px' }}>{p.icon}</span>
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
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        background: isUser ? USER_BUBBLE_BG : 'linear-gradient(135deg, #5B8C3E, #3d6128)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '11px', fontWeight: 700, marginBottom: '2px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }}>
        {isUser ? initial : 'K'}
      </div>

      <div style={{
        maxWidth: '78%', padding: '11px 15px', fontSize: '14.5px', lineHeight: 1.65,
        background: isUser ? USER_BUBBLE_BG : (msg.isError ? '#FEF2F0' : AI_BUBBLE_BG),
        color: isUser ? '#fff' : (msg.isError ? '#C0503B' : '#1a1a1a'),
        borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
        border: isUser ? 'none' : `1.5px solid ${msg.isError ? '#F5C5BB' : AI_BUBBLE_BORDER}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {isUser ? (
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
        ) : (
          <div className="space-y-2">{<ReactMarkdown>{msg.content}</ReactMarkdown>}</div>
        )}
        {time && (
          <div style={{ fontSize: '11px', opacity: 0.4, marginTop: '5px', textAlign: isUser ? 'right' : 'left' }}>
            {time}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #5B8C3E, #3d6128)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '11px', fontWeight: 700,
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }}>
        K
      </div>
      <div style={{
        padding: '12px 16px', background: AI_BUBBLE_BG,
        border: `1.5px solid ${AI_BUBBLE_BORDER}`,
        borderRadius: '4px 18px 18px 18px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '16px' }}>
          {[0, 0.18, 0.36].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.55, repeat: Infinity, delay }}
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5B8C3E', opacity: 0.6 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Coach;
