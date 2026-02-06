import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const AnimatedNumber = ({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  style = {},
}) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const animationRef = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    if (!isInView) return;

    const start = prevValue.current;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const current = start + (end - start) * eased;

      setDisplay(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, isInView, duration]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

export default AnimatedNumber;
