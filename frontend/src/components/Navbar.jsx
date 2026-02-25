import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const appTabs = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Calendar',  path: '/calendar'  },
  { label: 'Coach',     path: '/coach'     },
  { label: 'Goals',     path: '/goals'     },
];

const landingLinks = [
  { label: 'Features',     id: 'features' },
  { label: 'How it works', id: 'coach'    },
];

/* ─── Icons ───────────────────────────────────────────────────── */
const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6"  x2="21" y2="6"  />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6"  y1="6" x2="18" y2="18" />
  </svg>
);

/* ─── Logo mark ───────────────────────────────────────────────── */
const Logo = ({ dark = false }) => (
  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-white/15' : 'bg-navy'}`}>
    <img
      src="/KorsanaLogo.jpg"
      alt="Korsana"
      className="w-6 h-6 rounded"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'block';
      }}
    />
    <span className={`font-bold text-sm hidden ${dark ? 'text-white' : 'text-white'}`}>K</span>
  </div>
);

const Navbar = ({ variant = 'landing' }) => {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isApp    = variant === 'app';
  const initial  = user?.email?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  /* ════════════════════════════════════════════════════════════
     APP NAV — authenticated pages
  ════════════════════════════════════════════════════════════ */
  if (isApp) {
    return (
      <nav className="sticky top-0 z-50 bg-navy border-b border-white/10 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 no-underline shrink-0">
            <Logo dark />
            <span
              className="text-white text-lg font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Korsana
            </span>
          </Link>

          {/* Desktop tabs */}
          <div className="hidden md:flex items-center h-16 gap-0.5">
            {appTabs.map((tab) => {
              const isActive =
                location.pathname === tab.path ||
                (tab.path !== '/dashboard' && location.pathname.startsWith(tab.path));
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`
                    relative px-4 h-full flex items-center text-sm font-medium no-underline transition-colors
                    ${isActive ? 'text-white' : 'text-white/55 hover:text-white/90'}
                  `}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-garmin rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: avatar + mobile toggle */}
          <div className="flex items-center gap-2">

            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-garmin flex items-center justify-center text-white font-bold text-xs">
                  {initial}
                </div>
                <ChevronDown />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-3 border-b border-border-light">
                    <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-0.5">Signed in as</p>
                    <p className="text-sm font-medium text-text-primary truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-app hover:text-text-primary transition-colors no-underline"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                    Settings
                  </Link>
                  <div className="border-t border-border-light my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-coral-light transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Log out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-navy-dark border-t border-white/10">
            <div className="px-4 py-4 space-y-1">
              {appTabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium no-underline transition-colors ${
                      isActive ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {tab.label}
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-garmin" />}
                  </Link>
                );
              })}
              <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 no-underline transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-coral hover:bg-white/8 transition-colors cursor-pointer"
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

  /* ════════════════════════════════════════════════════════════
     LANDING NAV — public pages
  ════════════════════════════════════════════════════════════ */
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-border-light">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <Logo />
          <span
            className="text-navy text-lg font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Korsana
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-1">
          {landingLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-navy hover:bg-bg-app transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right: auth */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-sm font-medium text-text-secondary hover:text-navy transition-colors no-underline"
              >
                Log in
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                Get Started
              </Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-text-secondary hover:text-navy transition-colors cursor-pointer rounded-lg hover:bg-bg-app"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border-light shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {landingLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => { scrollTo(link.id); setMobileOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-navy hover:bg-bg-app transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-border-light mt-3 pt-3 space-y-1">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-navy hover:bg-bg-app no-underline transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-3 rounded-xl text-sm font-bold text-navy bg-bg-app hover:bg-border no-underline transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="block px-4 py-3 rounded-xl text-sm font-bold text-navy bg-bg-app no-underline transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
