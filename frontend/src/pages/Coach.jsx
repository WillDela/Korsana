import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { coachAPI } from '../api/coach';
import { getErrorMessage } from '../api/client';

const Coach = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [planData, setPlanData] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const suggestedPrompts = [
    "Should I run today?",
    "Am I on pace for my race goal?",
    "What should I focus on this week?",
    "How's my training looking?",
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsFetchingHistory(true);
        const data = await coachAPI.getHistory();
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsFetchingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await coachAPI.sendMessage(textToSend);
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errMsg = getErrorMessage(error);
      const errorMessage = {
        role: 'assistant',
        content: `I'm having trouble connecting right now. (${errMsg})\n\nPlease try again in a moment. If this persists, check that the backend server is running and the AI API key is configured.`,
        created_at: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    setPlanData(null);
    try {
      const data = await coachAPI.generatePlan(7, false);
      setPlanData(data);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      const errMsg = getErrorMessage(error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `I couldn't generate a plan right now. (${errMsg})\n\nPlease try again in a moment.`,
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
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Your training plan has been saved to the calendar! Check the Calendar page to see your upcoming workouts.',
        created_at: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Failed to save plan:', error);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col max-w-[900px] w-full mx-auto" style={{ flex: 1 }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-sage text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            K
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>AI Coach</h1>
            <p className="text-sm text-text-secondary">Your personalized running coach</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4">
        {isFetchingHistory ? (
          <div className="flex justify-center py-12">
            <span className="text-text-muted">Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="py-8 px-4 text-center"
          >
            <h2 className="text-xl font-semibold text-text-primary mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Ask me anything about your training
            </h2>
            <p className="text-text-secondary mb-8 max-w-[500px] mx-auto">
              I have access to your race goal and recent activities. Try one of these:
            </p>
            <div className="coach-prompts-grid grid gap-3 max-w-[600px] mx-auto">
              {suggestedPrompts.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-5 py-3.5 bg-white border border-border rounded-lg text-sm font-medium text-text-primary text-left cursor-pointer hover:border-navy-light hover:shadow-sm transition-all"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-2 items-start ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`coach-msg-avatar rounded-full text-white flex items-center justify-center text-sm font-semibold shrink-0 ${message.role === 'user' ? 'bg-navy' : 'bg-sage'
                    }`}
                >
                  {message.role === 'user' ? user?.email?.[0].toUpperCase() : 'K'}
                </div>

                {/* Message bubble */}
                <div
                  className={`coach-msg-bubble px-4 py-3 shadow-sm ${message.role === 'user'
                      ? 'bg-navy text-white rounded-2xl rounded-br-none'
                      : 'bg-white text-text-primary border border-border rounded-2xl rounded-bl-none'
                    }`}
                >
                  <p className="leading-relaxed text-[0.9375rem] whitespace-pre-wrap m-0">
                    {message.content}
                  </p>
                  <div
                    className={`text-xs mt-2 opacity-70 ${message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-start"
              >
                <div className="coach-msg-avatar rounded-full bg-sage text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  K
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white border border-border">
                  <div className="flex gap-1 items-center">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-1.5 h-1.5 rounded-full bg-text-muted"
                    />
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-text-muted"
                    />
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 rounded-full bg-text-muted"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Plan preview */}
      {planData && (
        <div className="mb-4 bg-white border-2 border-sage/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
              Generated Plan
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage/15 text-sage uppercase">Preview</span>
          </div>
          {planData.summary && (
            <p className="text-sm text-text-secondary mb-3">{planData.summary}</p>
          )}
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {planData.plan?.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-elevated text-sm">
                <span className="text-xs font-mono text-text-muted w-20 shrink-0">{entry.date}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${entry.workout_type === 'rest' ? 'bg-gray-100 text-gray-500' :
                    entry.workout_type === 'easy' ? 'bg-sage/15 text-sage' :
                      entry.workout_type === 'long' ? 'bg-navy/10 text-navy' :
                        entry.workout_type === 'tempo' ? 'bg-amber/15 text-amber' :
                          entry.workout_type === 'interval' ? 'bg-coral/15 text-coral' :
                            'bg-gray-100 text-gray-600'
                  }`}>{entry.workout_type}</span>
                <span className="font-medium text-text-primary truncate">{entry.title}</span>
                {entry.distance_km > 0 && (
                  <span className="text-xs font-mono text-text-muted ml-auto shrink-0">{(entry.distance_km * 0.621371).toFixed(1)} mi</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleConfirmPlan}
              disabled={isSavingPlan}
              className="btn btn-primary btn-sm"
            >
              {isSavingPlan ? 'Saving...' : 'Save to Calendar'}
            </button>
            <button
              onClick={() => setPlanData(null)}
              className="btn btn-ghost btn-sm"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-2 border-border rounded-xl p-3 shadow-sm">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your coach anything..."
            disabled={isLoading}
            className="flex-1 px-2.5 py-2 border-none outline-none text-[0.9375rem] resize-none min-h-[44px] max-h-[120px] bg-transparent text-text-primary"
            style={{ fontFamily: 'var(--font-heading)' }}
            rows={1}
          />
          <button
            className="btn btn-primary px-5 py-2.5 text-[0.9375rem] font-semibold"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
          >
            Send
          </button>
          <button
            className="btn btn-outline px-4 py-2.5 text-[0.8125rem] font-medium"
            onClick={handleGeneratePlan}
            disabled={isGeneratingPlan || isLoading}
            title="Generate a 7-day training plan"
          >
            {isGeneratingPlan ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" />
                </svg>
                Planning...
              </span>
            ) : (
              '📋 Plan'
            )}
          </button>
        </div>
        <div className="coach-hint mt-1.5 text-xs text-text-muted">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default Coach;
