import { useState, useEffect } from 'react';

const TypewriterText = ({ text, speed = 30, delay = 0, className = '', style = {} }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Start after delay
    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started || currentIndex >= text.length) return;

    const timer = setTimeout(() => {
      setDisplayText(text.slice(0, currentIndex + 1));
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, started]);

  return (
    <span className={className} style={style}>
      {displayText}
      {currentIndex < text.length && (
        <span style={{ opacity: 0.4, animation: 'blink 1s infinite' }}>|</span>
      )}
    </span>
  );
};

export default TypewriterText;
