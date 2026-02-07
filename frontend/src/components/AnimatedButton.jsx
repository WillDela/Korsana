import { motion } from 'framer-motion';

const AnimatedButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  type = 'button',
  className = '',
  style = {},
  ...props
}) => {
  const baseClass = variant === 'primary' ? 'btn-primary' :
                    variant === 'secondary' ? 'btn-secondary' :
                    variant === 'outline' ? 'btn-outline' :
                    variant === 'ghost' ? 'btn-ghost' :
                    variant === 'strava' ? 'btn-strava' : '';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${baseClass} ${className}`}
      style={{
        ...style,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      whileHover={disabled ? {} : { scale: 1.02, transition: { duration: 0.15 } }}
      whileTap={disabled ? {} : { scale: 0.98, transition: { duration: 0.1 } }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
