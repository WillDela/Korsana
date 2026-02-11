import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navTabs = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Coach', path: '/coach' },
  { label: 'Goals', path: '/goals' },
];

const Navbar = ({ variant = 'landing' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const isApp = variant === 'app';
  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ===== APP NAVBAR (authenticated pages) =====
  if (isApp) {
    return (
      <nav className="sticky top-0 z-50 bg-navy h-16 shadow-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 no-underline shrink-0">
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <img
                src="/KorsanaLogo.jpg"
                alt="K"
                className="w-6 h-6 rounded"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
              />
              <span className="text-white font-bold text-sm hidden">K</span>
            </div>
            <span className="text-white text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Korsana
            </span>
          </Link>

          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-1 h-full">
            {navTabs.map((tab) => {
              const isActive = location.pathname === tab.path ||
                (tab.path === '/goals' && location.pathname.startsWith('/goals'));
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`px-4 h-full flex items-center text-sm font-medium transition-colors no-underline border-b-2 ${
                    isActive
                      ? 'text-white border-white'
                      : 'text-white/60 border-transparent hover:text-white/90'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Right side: Avatar dropdown + Mobile hamburger */}
          <div className="flex items-center gap-3">
            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {initial}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-lg border border-border py-1 z-50">
                  <div className="px-4 py-3 border-b border-border-light">
                    <p className="text-sm font-medium text-text-primary truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors no-underline"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-coral-light transition-colors cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center text-white cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileOpen && (
          <div className="md:hidden bg-navy-light border-t border-white/10 shadow-lg">
            <div className="px-4 py-3 space-y-1">
              {navTabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium no-underline transition-colors ${
                      isActive
                        ? 'text-white bg-white/15'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
              <div className="border-t border-white/10 mt-2 pt-2">
                <Link
                  to="/settings"
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 no-underline transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-coral hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // ===== LANDING NAVBAR (public pages) =====
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border-light h-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
            <img
              src="/KorsanaLogo.jpg"
              alt="K"
              className="w-6 h-6 rounded"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <span className="text-white font-bold text-sm hidden">K</span>
          </div>
          <span className="text-navy text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Korsana
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login" className="hidden sm:block text-sm font-medium text-text-secondary hover:text-navy transition-colors no-underline">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
