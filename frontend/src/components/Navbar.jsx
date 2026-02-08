import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar Component
 * 
 * Props:
 * - variant: 'landing' (transparent/white) | 'dashboard' (Deep Blue)
 * - className: additional classes
 */
const Navbar = ({ variant = 'landing', className = '' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isLanding = variant === 'landing';
  const isDashboard = variant === 'dashboard';

  // Navbar container classes based on variant
  const navClasses = isDashboard
    ? 'bg-primary border-b border-primary/80'
    : 'bg-white/95 backdrop-blur-md border-b border-gray-100';

  // Logo classes
  const logoTextClasses = isDashboard
    ? 'text-white'
    : 'text-primary group-hover:text-secondary';

  const logoIconClasses = isDashboard
    ? 'bg-accent text-deep-green'
    : 'bg-primary text-white group-hover:bg-secondary';

  // Link classes
  const linkClasses = isDashboard
    ? 'nav-link-light'
    : 'nav-link';

  // User email classes
  const emailClasses = isDashboard
    ? 'text-white/70'
    : 'text-slate';

  // Logout button classes
  const logoutClasses = isDashboard
    ? 'text-white/70 hover:text-accent'
    : 'text-slate hover:text-error';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 ${navClasses} ${className}`}
    >
      <div className="container mx-auto container-padding h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base transition-colors duration-200 ${logoIconClasses}`}>
            K
          </div>
          <span className={`text-xl font-bold tracking-tight transition-colors duration-200 ${logoTextClasses}`}>
            Korsana
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {!user ? (
            // Logged out state
            <>
              <Link
                to="/login"
                className={`hidden md:block font-medium transition-colors ${linkClasses}`}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className={isDashboard ? 'btn btn-accent btn-sm' : 'btn btn-primary btn-sm shadow-lg shadow-primary/20'}
              >
                Get Started
              </Link>
            </>
          ) : (
            // Logged in state
            <>
              {isDashboard && (
                <nav className="hidden md:flex items-center gap-2">
                  <Link
                    to="/dashboard"
                    className={`${linkClasses} ${location.pathname === '/dashboard' ? 'nav-link-light-active' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/goals"
                    className={`${linkClasses} ${location.pathname === '/goals' ? 'nav-link-light-active' : ''}`}
                  >
                    Goals
                  </Link>
                  <Link
                    to="/coach"
                    className={`${linkClasses} ${location.pathname === '/coach' ? 'nav-link-light-active' : ''}`}
                  >
                    Coach
                  </Link>
                </nav>
              )}

              <div className="flex items-center gap-4">
                <span className={`text-sm hidden sm:inline-block ${emailClasses}`}>
                  {user?.email}
                </span>
                <button
                  onClick={() => logout()}
                  className={`text-sm font-medium transition-colors ${logoutClasses}`}
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
