import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { coachAPI } from '../api/coach';
import { getErrorMessage } from '../api/client';
import AnimatedButton from '../components/AnimatedButton';
import Navbar from '../components/Navbar';

const Coach = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested prompts for first-time users
  const suggestedPrompts = [
    "Should I run today?",
    "Am I on pace for my race goal?",
    "What should I focus on this week?",
    "How's my training looking?",
  ];

  // Fetch conversation history on mount
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    // Add user message to UI immediately
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

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errMsg = getErrorMessage(error);
      console.error('Error details:', errMsg);
      // Add error message with retry hint
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar variant="dashboard" />

      {/* Chat Container */}
      <div className="coach-container" style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="coach-header-avatar" style={{
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-secondary) 0%, #4f7136 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(97, 139, 74, 0.3)',
              flexShrink: 0,
            }}>
              K
            </div>
            <div>
              <h1 className="coach-header-title font-serif" style={{ fontWeight: 800, margin: 0 }}>AI Coach</h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Your personalized running coach
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messages Container */}
        <div className="coach-messages" style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {isFetchingHistory ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>Loading conversation...</div>
            </div>
          ) : messages.length === 0 ? (
            // Empty state with suggested prompts
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              style={{ padding: '2rem 1rem', textAlign: 'center' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
                Ask me anything about your training
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                I have access to your race goal and recent activities. Try one of these:
              </p>
              <div className="coach-prompts-grid" style={{ display: 'grid', gap: '0.75rem', maxWidth: '600px', margin: '0 auto' }}>
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendMessage(prompt)}
                    style={{
                      padding: '0.875rem 1.25rem',
                      background: '#fff',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            // Message list
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: 'flex',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Avatar */}
                  <div className="coach-msg-avatar" style={{
                    borderRadius: '50%',
                    background: message.role === 'user' ? 'var(--color-primary)' : 'var(--color-secondary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {message.role === 'user' ? user?.email?.[0].toUpperCase() : 'K'}
                  </div>

                  {/* Message bubble */}
                  <div className="coach-msg-bubble" style={{
                    padding: '1rem 1.25rem',
                    borderRadius: message.role === 'user' ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                    background: message.role === 'user' ? 'var(--color-primary)' : '#fff',
                    color: message.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                    border: message.role === 'user' ? 'none' : '1px solid var(--color-border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9375rem', whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </p>
                    <div style={{
                      fontSize: '0.75rem',
                      opacity: 0.7,
                      marginTop: '0.5rem',
                      textAlign: message.role === 'user' ? 'right' : 'left',
                    }}>
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
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <div className="coach-msg-avatar" style={{
                    borderRadius: '50%',
                    background: 'var(--color-secondary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    K
                  </div>
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem 1rem 1rem 0',
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                  }}>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-text-muted)' }}
                      />
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-text-muted)' }}
                      />
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-text-muted)' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: '#fff',
            border: '2px solid var(--color-border)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your coach anything..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.625rem',
                border: 'none',
                outline: 'none',
                fontSize: '0.9375rem',
                fontFamily: 'var(--font-sans)',
                resize: 'none',
                minHeight: '44px',
                maxHeight: '120px',
                background: 'transparent',
                color: 'var(--color-text-primary)',
              }}
              rows={1}
            />
            <AnimatedButton
              variant="primary"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
              }}
            >
              Send
            </AnimatedButton>
          </div>
          <div className="coach-hint" style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Press Enter to send, Shift+Enter for new line
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Coach;
