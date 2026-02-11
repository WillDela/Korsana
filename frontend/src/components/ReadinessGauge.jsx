import { motion } from 'framer-motion';

const ReadinessGauge = ({ value = 0, size = 80 }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  // Color based on value
  const getColor = () => {
    if (clampedValue >= 70) return 'var(--color-sage)';
    if (clampedValue >= 40) return 'var(--color-amber)';
    return 'var(--color-coral)';
  };

  const getLabel = () => {
    if (clampedValue >= 70) return 'On Track';
    if (clampedValue >= 40) return 'Building';
    return 'Behind';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-light)"
          strokeWidth="6"
        />
        {/* Animated fill ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        {/* Center number */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="var(--color-text-primary)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.28, fontWeight: 700 }}
        >
          {clampedValue}
        </text>
      </svg>
      <span className="text-xs font-medium mt-1" style={{ color: getColor() }}>
        {getLabel()}
      </span>
    </div>
  );
};

export default ReadinessGauge;
