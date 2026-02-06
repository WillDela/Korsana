import { motion } from 'framer-motion';

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
};

export const StaggerContainer = ({ children, className = '', style = {} }) => (
  <motion.div
    variants={containerVariants}
    initial="initial"
    animate="animate"
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = '', style = {} }) => (
  <motion.div
    variants={itemVariants}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);
