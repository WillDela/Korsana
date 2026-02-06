import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

const baseStyle = {
  background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-bg-secondary) 50%, var(--color-border) 75%)',
  backgroundSize: '200% 100%',
  borderRadius: '0.375rem',
};

// Base skeleton block
export const Skeleton = ({ width = '100%', height = '1rem', style = {}, className = '' }) => (
  <motion.div
    className={className}
    style={{ ...baseStyle, width, height, ...style }}
    animate={shimmer.animate}
    transition={shimmer.transition}
  />
);

// Skeleton for metric cards on dashboard
export const SkeletonCard = ({ style = {} }) => (
  <div className="metric-card" style={{ ...style }}>
    <Skeleton width="60%" height="0.75rem" />
    <Skeleton width="40%" height="2rem" style={{ marginTop: '0.75rem' }} />
    <Skeleton width="80%" height="0.625rem" style={{ marginTop: '0.5rem' }} />
  </div>
);

// Skeleton for table rows
export const SkeletonRow = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} style={{ padding: '0.75rem 1rem' }}>
        <Skeleton width={i === 0 ? '80%' : '60%'} height="0.875rem" />
      </td>
    ))}
  </tr>
);

// Skeleton for the race header
export const SkeletonRaceHeader = () => (
  <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
    <Skeleton width="30%" height="0.75rem" />
    <Skeleton width="60%" height="1.5rem" style={{ marginTop: '0.75rem' }} />
    <Skeleton width="100%" height="6px" style={{ marginTop: '1.25rem', borderRadius: '3px' }} />
  </div>
);

// Skeleton for sidebar cards
export const SkeletonSidebarCard = ({ lines = 3 }) => (
  <div className="card" style={{ padding: '1rem' }}>
    <Skeleton width="40%" height="0.75rem" style={{ marginBottom: '1rem' }} />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={`${70 + Math.random() * 30}%`}
        height="0.875rem"
        style={{ marginTop: i > 0 ? '0.5rem' : 0 }}
      />
    ))}
  </div>
);

export default Skeleton;
