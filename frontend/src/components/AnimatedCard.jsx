import { motion } from 'framer-motion';

const AnimatedCard = ({
  children,
  onClick,
  className = '',
  style = {},
  hoverLift = 4,
  clickable = false,
  ...props
}) => {
  return (
    <motion.div
      onClick={onClick}
      className={`card ${className}`}
      style={{
        ...style,
        cursor: clickable || onClick ? 'pointer' : 'default',
      }}
      whileHover={{
        y: -hoverLift,
        boxShadow: '0 12px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      whileTap={clickable || onClick ? {
        scale: 0.98,
        transition: { duration: 0.1 },
      } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
