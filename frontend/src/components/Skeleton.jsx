import { motion } from 'framer-motion';

const shimmerVariants = {
  animate: {
    x: ['-100%', '100%'],
    transition: {
      repeat: Infinity,
      repeatType: "loop",
      duration: 1.5,
      ease: "linear",
    },
  },
};

export const Skeleton = ({ className = '', width, height }) => (
  <div
    className={`relative overflow-hidden bg-slate-100 rounded-md ${className}`}
    style={{ width, height }}
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
      variants={shimmerVariants}
      animate="animate"
    />
  </div>
);

// Skeleton for metric cards on dashboard
export const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <Skeleton width="40%" height="0.75rem" className="mb-4" />
    <Skeleton width="60%" height="2rem" className="mb-2" />
    <Skeleton width="30%" height="0.75rem" />
  </div>
);

// Skeleton for table rows
export const SkeletonRow = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton width={i === 0 ? '80%' : '60%'} height="0.875rem" />
      </td>
    ))}
  </tr>
);

// Skeleton for the race header
export const SkeletonRaceHeader = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
    <div className="flex justify-between items-start mb-6">
      <div className="w-1/2">
        <Skeleton width="20%" height="0.625rem" className="mb-2" />
        <Skeleton width="60%" height="1.5rem" />
      </div>
      <div className="flex gap-4">
        <Skeleton width="80px" height="2rem" />
        <Skeleton width="120px" height="2rem" />
      </div>
    </div>
    <Skeleton width="100%" height="0.5rem" className="rounded-full" />
    <div className="flex justify-between mt-2">
      <Skeleton width="15%" height="0.625rem" />
      <Skeleton width="15%" height="0.625rem" />
      <Skeleton width="15%" height="0.625rem" />
    </div>
  </div>
);

// Skeleton for sidebar cards
export const SkeletonSidebarCard = ({ lines = 3 }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200">
    <Skeleton width="40%" height="0.75rem" className="mb-4" />
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={`${70 + Math.random() * 30}%`}
          height="0.875rem"
        />
      ))}
    </div>
  </div>
);

export default Skeleton;
