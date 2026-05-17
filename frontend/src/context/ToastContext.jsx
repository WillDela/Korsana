import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getErrorMessage } from '../api/client';

const ToastContext = createContext(null);

const KIND_STYLES = {
  success: { bg: 'var(--color-sage)', shadow: 'rgba(91,140,62,0.3)',  icon: '✓' },
  error:   { bg: 'var(--color-coral)', shadow: 'rgba(232,114,90,0.3)', icon: '!' },
  info:    { bg: 'var(--color-navy)', shadow: 'rgba(27,37,89,0.3)',   icon: 'i' },
};

const DEFAULT_DURATION = 3500;

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); // { id, kind, message }
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const show = useCallback((kind, message, duration = DEFAULT_DURATION) => {
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ id: Date.now(), kind, message });
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const success = useCallback((message) => show('success', message), [show]);
  const info    = useCallback((message) => show('info', message), [show]);

  // error(errOrString, fallbackMessage?) — accepts either a raw error object
  // (resolved via getErrorMessage) or a pre-formatted string. Auth-redirect
  // errors (401 → /login) are intentionally silenced so the user doesn't see
  // a noise toast on the way to the login screen.
  const error = useCallback((errOrString, fallback) => {
    if (errOrString?.isAuthRedirect) return;
    const message = typeof errOrString === 'string'
      ? errOrString
      : (getErrorMessage(errOrString) || fallback || 'Something went wrong.');
    show('error', message);
  }, [show]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <ToastContext.Provider value={{ success, error, info, dismiss }}>
      {children}
      <ToastViewport toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

const ToastViewport = ({ toast, onDismiss }) => (
  <div
    aria-live="polite"
    aria-atomic="true"
    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
  >
    <AnimatePresence>
      {toast && (
        <motion.button
          key={toast.id}
          type="button"
          onClick={onDismiss}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white border-none cursor-pointer"
          style={{
            background: KIND_STYLES[toast.kind].bg,
            boxShadow: `0 4px 20px ${KIND_STYLES[toast.kind].shadow}`,
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span aria-hidden="true">{KIND_STYLES[toast.kind].icon}</span>
          <span>{toast.message}</span>
        </motion.button>
      )}
    </AnimatePresence>
  </div>
);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
