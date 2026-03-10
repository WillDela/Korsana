import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const appTabs = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Coach', path: '/coach' },
  { label: 'Goals', path: '/goals' },
];

const landingLinks = [
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'coach' },
];

const SPLITS = [
  { label: '5K', time: '19:59' },
  { label: '5K', time: '24:59' },
  { label: '10K', time: '39:59' },
  { label: '10K', time: '49:59' },
  { label: 'Half', time: '1:29:59' },
  { label: 'Half', time: '1:44:59' },
  { label: 'Half', time: '1:59:59' },
  { label: 'Full', time: '2:59:59' },
  { label: 'Full', time: '3:29:59' },
  { label: 'Full', time: '3:59:59' },
  { label: 'Full', time: '4:29:59' },
];

/* ─── Icons ───────────────────────────────────────────────────── */
const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
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
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const isApp = variant === 'app';
  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.replace('/');
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
      <nav className="sticky top-0 z-50 border-b border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.07),0_4px_24px_rgba(0,0,0,0.2)]" style={{ background: '#1B2559', padding: '0 24px' }}>
        <div className="relative" style={{ maxWidth: 1280, width: '100%', margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <Link to="/dashboard" className="flex items-center no-underline shrink-0">
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 19, color: "#FFFFFF", letterSpacing: "-0.03em" }}>Korsana</span>
            </Link>
          </div>

          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-0.5" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {appTabs.map((tab) => {
              const isActive =
                location.pathname === tab.path ||
                (tab.path !== '/dashboard' && location.pathname.startsWith(tab.path));
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className="hover:text-white transition-colors"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                    position: 'relative',
                    padding: '6px 15px',
                    borderRadius: 8,
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  }}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-sm" style={{ background: '#E8634A' }} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: avatar + mobile toggle */}
          <div className="flex-1 flex items-center justify-end gap-[10px]">
            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer text-white font-bold text-[13px] border-none"
                style={{ fontFamily: 'Space Grotesk, sans-serif', background: '#E8634A' }}
              >
                {initial}
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#FFFFFF",
                  borderRadius: 14,
                  boxShadow: "0 4px 32px rgba(27,37,89,0.16), 0 1px 4px rgba(27,37,89,0.08)",
                  border: "1px solid #ECEEF4",
                  padding: "14px 14px 10px",
                  zIndex: 300,
                  minWidth: 200
                }}>
                  <div style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #ECEEF4" }}>
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: "#8B93B0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Signed in as</div>
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, color: "#1B2559", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
                  </div>
                  <Link
                    to="/settings"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, textDecoration: "none", color: "#4A5173", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500 }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#F8F9FC"; e.currentTarget.style.color = "#1B2559"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5173"; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                    Settings
                  </Link>
                  <div style={{ margin: "4px 0" }} />
                  <button
                    onClick={handleLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", color: "#E84A4A", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#FDE8E3"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium no-underline transition-colors ${isActive ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/8'
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
  const [scrolled, setScrolled] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIdx((i) => (i + 1) % SPLITS.length);
        setTickerVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] transition-shadow duration-200"
      style={{ boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.08)' : 'none' }}
    >
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 h-16 flex items-center gap-6">

        {/* Zone 1 — Brand */}
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <Logo />
          <span
            className="text-[#1B2559] text-[15px] font-bold tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Korsana
          </span>
        </Link>

        {/* Divider */}
        <div className="hidden md:block w-px h-5 bg-[#e5e7eb] shrink-0 ml-1" />

        {/* Zone 2 — PR Ticker */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[12px] text-[#9ca3af]" style={{ fontFamily: 'var(--font-sans)' }}>
            Your next PR
          </span>
          <div
            style={{
              opacity: tickerVisible ? 1 : 0,
              transition: 'opacity 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              className="text-[11px] uppercase text-[#9ca3af] w-[30px] text-right"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {SPLITS[tickerIdx].label}
            </span>
            <span
              className="text-[15px] font-bold text-[#E8614A]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {SPLITS[tickerIdx].time}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zone 3 — Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {landingLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="px-4 py-2 text-[14px] font-medium text-[#374151] hover:text-[#1B2559] transition-colors cursor-pointer bg-transparent border-none"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Zone 4 — Auth */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-[14px] text-[#6b7280] hover:text-[#374151] transition-colors no-underline px-2"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="no-underline text-white text-[13px] font-bold uppercase tracking-wide px-[18px] py-2 rounded-[6px] bg-[#1B2559] hover:bg-[#253070] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Get Started
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              className="no-underline text-white text-[13px] font-bold uppercase tracking-wide px-[18px] py-2 rounded-[6px] bg-[#1B2559] hover:bg-[#253070] transition-colors"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Dashboard
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-[#374151] hover:text-[#1B2559] transition-colors cursor-pointer rounded-lg hover:bg-[#f9fafb]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#e5e7eb] shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {landingLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => { scrollTo(link.id); setMobileOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-[#374151] hover:text-[#1B2559] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-[#e5e7eb] mt-3 pt-3 space-y-1">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 rounded-xl text-sm font-medium text-[#6b7280] hover:text-[#374151] hover:bg-[#f9fafb] no-underline transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#1B2559] hover:bg-[#253070] no-underline transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="block px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#1B2559] no-underline transition-colors"
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
