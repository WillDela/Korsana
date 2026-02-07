import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success,
  name,
  id,
  required = false,
  className = '',
  style = {},
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
  const showFloatingLabel = label && (isFocused || hasValue);

  const handleChange = (e) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };

  const borderColor = error ? 'var(--color-error)' :
                      success ? 'var(--color-success)' :
                      isFocused ? 'var(--color-primary)' :
                      'var(--color-border)';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <motion.div
        style={{ position: 'relative' }}
        animate={{
          scale: isFocused ? 1.005 : 1,
          transition: { duration: 0.2 },
        }}
      >
        {label && (
          <motion.label
            htmlFor={inputId}
            initial={false}
            animate={{
              top: showFloatingLabel ? '-0.5rem' : '0.875rem',
              fontSize: showFloatingLabel ? '0.75rem' : '1rem',
              color: error ? 'var(--color-error)' :
                     success ? 'var(--color-success)' :
                     isFocused ? 'var(--color-primary)' :
                     'var(--color-text-muted)',
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: '1rem',
              backgroundColor: 'var(--color-bg-primary)',
              padding: '0 0.25rem',
              pointerEvents: 'none',
              fontWeight: showFloatingLabel ? 500 : 400,
              zIndex: 1,
            }}
          >
            {label}{required && ' *'}
          </motion.label>
        )}

        <motion.input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ''}
          className={`input ${className}`}
          style={{
            ...style,
            borderColor,
            borderWidth: isFocused ? '2px' : '1px',
            padding: label ? '0.875rem 1rem' : '0.75rem 1rem',
            transition: 'border-color 0.2s, border-width 0.2s, box-shadow 0.2s',
            boxShadow: isFocused ? `0 0 0 3px ${borderColor}15` : 'none',
          }}
          {...props}
        />

        {(success || error) && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, type: 'spring' }}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.125rem',
              color: error ? 'var(--color-error)' : 'var(--color-success)',
            }}
          >
            {success ? '✓' : error ? '⚠' : ''}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {error && typeof error === 'string' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              color: 'var(--color-error)',
              fontSize: '0.75rem',
              marginTop: '0.25rem',
              marginLeft: '0.25rem',
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedInput;
