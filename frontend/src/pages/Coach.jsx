import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { coachAPI } from '../api/coach';
import { goalsAPI } from '../api/goals';
import { getErrorMessage } from '../api/client';
import ReactMarkdown from 'react-markdown';

const PROMPTS = [
  'Analyze my last week',
  'Should I run today?',
  'Build me a plan',
  'Is my goal realistic?',
];

const WORKOUT_COLORS = {
  easy:        'bg-sage/15 text-sage',
  long:        'bg-navy/10 text-navy',
  tempo:       'bg-amber/15 text-amber',
  interval:    'bg-coral/15 text-coral',
  recovery:    'bg-sage/10 text-sage',
  rest:        'bg-gray-100 text-gray-500',
  race:        'bg-coral/20 text-coral',
  cross_train: 'bg-gray-100 text-gray-600',
};

function weeksOut(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  const weeks = Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  if (weeks < 0) return null;
  return weeks;
}

const Coach = () => {
  const { user } = useAuth();
  const [messages, setMessages]               = useState([]);
  const [inputValue, setInputValue]           = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [planData, setPlanData]               = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSavingPlan, setIsSavingPlan]       = useState(false);
  const [activeGoal, setActiveGoal]           = useState(null);
  const [quota, setQuota]                     = useState({ used: 0, limit: 10, remaining: 10 });
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsFetchingHistory(true);
        const [historyData, goalData, quotaData] = await Promise.allSettled([
          coachAPI.getHistory(),
          goalsAPI.getActiveGoal(),
          coachAPI.getQuota(),
        ]);

        if (historyData.status === 'fulfilled') {
          const raw = historyData.value?.messages ?? [];
          setMessages(raw.map(m => ({ ...m, content: m.content || '' })));
        }
        if (goalData.status === 'fulfilled' && goalData.value?.goal) {
          setActiveGoal(goalData.value.goal);
        }
        if (quotaData.status === 'fulfilled') {
          setQuota(quotaData.value);
        }
      } finally {
        setIsFetchingHistory(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const applyQuotaUpdate = (q) => {
    if (!q) return;
    setQuota(prev => ({ ...prev, ...q }));
  };

  const handleSendMessage = async (text) => {
    const msg = (text ?? inputValue).trim();
    if (!msg || isLoading) return;
    if (quota.remaining <= 0) return;

    setMessages(prev => [...prev, { role: 'user', content: msg, created_at: new Date().toISOString() }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await coachAPI.sendMessage(msg);
      applyQuotaUpdate(data._quota);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      }]);
    } catch (error) {
      const errMsg = getErrorMessage(error);
      const isRateLimit = error?.response?.status === 429;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isRateLimit
          ? `You've used all ${quota.limit} questions for today. Check back tomorrow.`
          : `Something went wrong. (${errMsg})`,
        created_at: new Date().toISOString(),
        isError: true,
      }]);
      if (isRateLimit) {
        setQuota(prev => ({ ...prev, remaining: 0, used: prev.limit }));
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleGeneratePlan = async () => {
    if (quota.remaining <= 0) return;
    setIsGeneratingPlan(true);
    setPlanData(null);
    try {
      const data = await coachAPI.generatePlan(7, false);
      applyQuotaUpdate(data._quota);
      setPlanData(data);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Couldn't generate a plan right now. (${getErrorMessage(error)})`,
        created_at: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleConfirmPlan = async () => {
    setIsSavingPlan(true);
    try {
      await coachAPI.generatePlan(7, true);
      setPlanData(null);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '**Plan saved.** Check your Calendar — your next 7 workouts are queued up.',
        created_at: new Date().toISOString(),
      }]);
    } catch {
      // error is surfaced inside the plan card
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const weeks = weeksOut(activeGoal?.race_date);
  const quotaExhausted = quota.remaining <= 0;

  // Navbar = 64px (h-16), main padding = 24px top + 24px bottom = 112px total offset
  const chatHeight = 'calc(100dvh - 112px)';

  return (
    <div className="flex flex-col max-w-[720px] w-full mx-auto" style={{ height: chatHeight }}>

      {/* ── Header + context banner ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-4 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sage flex items-center justify-center
                          font-bold text-white text-sm shrink-0 shadow-sm select-none">
            K
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Coach
            </h1>
            {activeGoal ? (
              <p className="text-xs text-text-muted leading-tight mt-0.5">
                {activeGoal.race_name}
                {weeks !== null && ` · ${weeks}w out`}
              </p>
            ) : (
              <p className="text-xs text-text-muted leading-tight mt-0.5">
                Your personalized AI running coach
              </p>
            )}
          </div>
        </div>

        {/* Quota badge */}
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0
                        ${quotaExhausted
                          ? 'bg-coral/10 text-coral'
                          : quota.remaining <= 3
                            ? 'bg-amber/10 text-amber'
                            : 'bg-bg-elevated text-text-muted'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${quotaExhausted ? 'bg-coral' : quota.remaining <= 3 ? 'bg-amber' : 'bg-sage'}`} />
          {quotaExhausted ? 'Limit reached' : `${quota.remaining} of ${quota.limit} left today`}
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-2">
        {isFetchingHistory ? (
          <div className="flex justify-center py-16">
            <span className="text-text-muted text-sm">Loading...</span>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onPrompt={handleSendMessage} disabled={quotaExhausted} />
        ) : (
          <div className="flex flex-col gap-4 py-2">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} userEmail={user?.email} />
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Plan preview card ─────────────────────────────────────── */}
      <AnimatePresence>
        {planData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-3 bg-white border border-border rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-primary"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                7-day plan
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5
                               rounded bg-sage/15 text-sage">
                Preview
              </span>
            </div>
            {planData.summary && (
              <p className="text-xs text-text-secondary mb-3">{planData.summary}</p>
            )}
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {planData.plan?.map((entry, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg
                                        bg-bg-elevated text-xs">
                  <span className="font-mono text-text-muted w-[72px] shrink-0">{entry.date}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0
                                    ${WORKOUT_COLORS[entry.workout_type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {entry.workout_type}
                  </span>
                  <span className="font-medium text-text-primary truncate">{entry.title}</span>
                  {entry.distance_km > 0 && (
                    <span className="font-mono text-text-muted ml-auto shrink-0">
                      {(entry.distance_km * 0.621371).toFixed(1)} mi
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleConfirmPlan} disabled={isSavingPlan} className="btn btn-primary btn-sm">
                {isSavingPlan ? 'Saving…' : 'Save to Calendar'}
              </button>
              <button onClick={() => setPlanData(null)} className="btn btn-ghost btn-sm">
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input area ────────────────────────────────────────────── */}
      <div className={`bg-white border rounded-xl p-3 shadow-sm transition-colors
                      ${quotaExhausted ? 'border-border opacity-60' : 'border-border'}`}>
        {quotaExhausted ? (
          <p className="text-sm text-text-muted text-center py-2">
            You've used all {quota.limit} questions for today. Check back tomorrow.
          </p>
        ) : (
          <>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach anything…"
              disabled={isLoading}
              rows={1}
              className="w-full px-1 border-none outline-none text-[0.9375rem] resize-none
                         min-h-[40px] max-h-[120px] bg-transparent text-text-primary"
              style={{ fontFamily: 'var(--font-sans)' }}
            />
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan || isLoading}
                className="btn btn-ghost btn-sm text-text-secondary flex items-center gap-1.5"
                title="Generate a 7-day training plan"
              >
                {isGeneratingPlan ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12
                               0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" />
                    </svg>
                    Building plan…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"
                         stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="14" height="13" rx="2" />
                      <path d="M7 2v4M13 2v4M3 9h14" />
                    </svg>
                    Build plan
                  </>
                )}
              </button>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="btn btn-primary btn-sm px-5"
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

// ── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ onPrompt, disabled }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col items-center justify-center h-full py-12 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-sage" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      </div>
      <p className="text-text-secondary text-sm mb-6 max-w-[320px]">
        Your coach already has your training data. Just ask.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-[440px]">
        {PROMPTS.map((prompt, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            onClick={() => !disabled && onPrompt(prompt)}
            disabled={disabled}
            className="px-4 py-3 bg-white border border-border rounded-lg text-sm
                       text-text-primary text-left hover:border-navy/30 hover:shadow-sm
                       transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ message, userEmail }) {
  const isUser = message.role === 'user';
  const initial = (userEmail?.[0] ?? 'U').toUpperCase();
  const time = message.created_at && !isNaN(new Date(message.created_at))
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                       shrink-0 text-white mb-0.5 ${isUser ? 'bg-navy' : 'bg-sage'}`}>
        {isUser ? initial : 'K'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] px-4 py-3 text-[0.9375rem] leading-relaxed shadow-sm
                       ${isUser
                         ? 'bg-navy text-white rounded-2xl rounded-br-sm'
                         : 'bg-white text-text-primary border border-border rounded-2xl rounded-bl-sm'
                       } ${message.isError ? 'border-coral/30 bg-coral/5 text-coral' : ''}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap m-0">{message.content}</p>
        ) : (
          <div className="leading-relaxed space-y-2">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {time && (
          <div className={`text-[11px] mt-1.5 opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
            {time}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 items-end"
    >
      <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center text-xs font-semibold text-white shrink-0">
        K
      </div>
      <div className="px-4 py-3 bg-white border border-border rounded-2xl rounded-bl-sm shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 0.18, 0.36].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.55, repeat: Infinity, delay }}
              className="w-1.5 h-1.5 rounded-full bg-text-muted"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default Coach;
