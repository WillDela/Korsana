import { motion } from 'framer-motion';

// Placeholder images for hero section masonry grid
const placeholderImages = [
  { id: 1, aspectRatio: 'tall', color: 'from-primary/20 to-secondary/20' },
  { id: 2, aspectRatio: 'wide', color: 'from-secondary/20 to-accent/20' },
  { id: 3, aspectRatio: 'square', color: 'from-accent/20 to-primary/20' },
  { id: 4, aspectRatio: 'tall', color: 'from-primary/30 to-deep-green/20' },
  { id: 5, aspectRatio: 'wide', color: 'from-secondary/30 to-primary/20' },
];

const PhotoMasonry = ({ images = placeholderImages }) => {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-lg ml-auto">
      {/* Column 1 */}
      <div className="flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`h-48 rounded-2xl bg-gradient-to-br ${images[0]?.color || 'from-primary/20 to-secondary/20'} flex items-center justify-center border border-gray-200`}
        >
          <span className="text-4xl">🏃</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`h-64 rounded-2xl bg-gradient-to-br ${images[1]?.color || 'from-secondary/20 to-accent/20'} flex items-center justify-center border border-gray-200`}
        >
          <span className="text-4xl">🎯</span>
        </motion.div>
      </div>

      {/* Column 2 */}
      <div className="flex flex-col gap-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`h-64 rounded-2xl bg-gradient-to-br ${images[2]?.color || 'from-accent/20 to-primary/20'} flex items-center justify-center border border-gray-200`}
        >
          <span className="text-4xl">📊</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`h-48 rounded-2xl bg-gradient-to-br ${images[3]?.color || 'from-primary/30 to-deep-green/20'} flex items-center justify-center border border-gray-200`}
        >
          <span className="text-4xl">🏆</span>
        </motion.div>
      </div>
    </div>
  );
};

export default PhotoMasonry;
