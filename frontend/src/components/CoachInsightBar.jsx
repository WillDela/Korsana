import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CoachInsightBar = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`bg-sage-light border border-sage/20 rounded-xl px-5 py-4 flex items-center gap-4 ${className}`}
    >
      <div className="w-8 h-8 rounded-full bg-sage text-white flex items-center justify-center shrink-0 text-xs font-bold">
        AI
      </div>
      <p className="text-sm text-text-primary flex-1 line-clamp-2 leading-relaxed">
        {message}
      </p>
      <Link
        to="/coach"
        className="text-sm font-medium text-navy hover:text-navy-light transition-colors no-underline shrink-0 whitespace-nowrap"
      >
        Talk to Coach
      </Link>
    </motion.div>
  );
};

export default CoachInsightBar;
