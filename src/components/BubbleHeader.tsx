import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, Shield, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

export const BubbleHeader: React.FC = () => {
  const { t, locale, setLocale, config, user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement>(null);

  const navItems = [
    { path: '/', label: t.nav.home },
    { path: '/candidates', label: t.nav.candidates },
    { path: '/classement', label: t.nav.leaderboard },
    { path: '/concours', label: t.nav.contest },
    { path: '/actualites', label: t.nav.news },
    { path: '/faq', label: t.nav.faq },
  ];

  // Close mobile menu and search on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Close on Escape key & manage focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (mobileMenuOpen && mobileCloseBtnRef.current) {
      mobileCloseBtnRef.current.focus();
    }
  }, [mobileMenuOpen]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    if (q) {
      navigate(`/candidates?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/candidates');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-3 z-40 px-3 sm:px-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-[1200px] mx-auto bg-white/95 backdrop-blur-md border border-[#EEDDE6] shadow-[0_8px_30px_rgb(168,13,85,0.08)] rounded-full px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 pointer-events-auto"
        >
          {/* Zone 1: Brand Logo & Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A80D55] rounded-full shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-[#21131D] overflow-hidden flex items-center justify-center shrink-0 border border-[#EEDDE6]">
              <img
                src={config.logoUrl}
                alt={config.contestName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-semibold text-sm sm:text-base tracking-tight text-[#21131D] whitespace-nowrap">
              {config.contestName}
            </span>
          </Link>

          {/* Zone 2: Desktop Navigation */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#74636E]"
          >
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                    active
                      ? 'text-[#A80D55] border-[#A80D55] font-semibold'
                      : 'border-transparent hover:text-[#21131D]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Search, Language, Account, Primary Vote CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label={t.nav.searchPlaceholder}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#21131D] hover:bg-[#FFF8FB] border border-transparent hover:border-[#EEDDE6] transition-colors focus-visible:outline-2 focus-visible:outline-[#A80D55]"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Discreet FR / EN Switcher */}
            <button
              type="button"
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              aria-label="Changer de langue / Switch language"
              className="h-9 px-2.5 rounded-full text-xs font-semibold text-[#21131D] hover:bg-[#FFF8FB] border border-[#EEDDE6] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#A80D55]" />
              <span>{locale.toUpperCase()}</span>
            </button>

            {/* Account or Admin Link on Desktop */}
            {user && user.role !== 'voter' && (
              <Link
                to="/admin"
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium text-[#780938] bg-[#FFF8FB] border border-[#EEDDE6] hover:bg-[#EEDDE6]/50 transition-colors whitespace-nowrap shrink-0"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t.nav.admin}</span>
              </Link>
            )}

            <Link
              to={user ? '/mon-compte' : '/connexion'}
              aria-label={user ? t.nav.account : t.nav.login}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium text-[#21131D] hover:bg-[#FFF8FB] border border-[#EEDDE6] transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 text-[#A80D55]" />
              <span className="max-w-[96px] truncate">
                {user ? user.fullName.split(' ')[0] : t.nav.login}
              </span>
            </Link>

            {/* Primary CTA Button "Voter" (Lime Green with Dark Text per contrast rule) */}
            <Link
              to="/candidates"
              className="inline-flex items-center justify-center h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-[#D6F542] hover:bg-[#c8e832] text-[#21131D] font-semibold text-xs sm:text-sm transition-colors shadow-xs whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A80D55]"
            >
              {t.nav.voteBtn}
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-label="Ouvrir le menu de navigation"
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-[#21131D] hover:bg-[#FFF8FB] border border-[#EEDDE6] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Quick Search Popover Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="max-w-[680px] mx-auto mt-2 bg-white border border-[#EEDDE6] shadow-lg rounded-full p-2 pointer-events-auto"
            >
              <form onSubmit={handleQuickSearch} className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#74636E] ml-3 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.nav.searchPlaceholder}
                  className="w-full text-sm text-[#21131D] placeholder-[#74636E] bg-transparent focus:outline-none py-1.5"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#A80D55] text-white text-xs font-medium hover:bg-[#780938] transition-colors whitespace-nowrap shrink-0"
                >
                  Rechercher
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Fermer la recherche"
                  className="p-1.5 rounded-full text-[#74636E] hover:text-[#21131D]"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Accessible Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#21131D]/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navigation mobile"
              className="relative w-full max-w-xs bg-white h-full shadow-2xl border-l border-[#EEDDE6] flex flex-col justify-between p-6 overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-[#EEDDE6]">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={config.logoUrl}
                      alt={config.contestName}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-[#EEDDE6]"
                    />
                    <span className="font-semibold text-sm text-[#21131D]">
                      {config.contestName}
                    </span>
                  </div>
                  <button
                    ref={mobileCloseBtnRef}
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Fermer le menu"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#21131D] hover:bg-[#FFF8FB] border border-[#EEDDE6]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="mt-6 flex flex-col gap-2">
                  {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                          active
                            ? 'bg-[#A80D55] text-white font-semibold'
                            : 'text-[#21131D] hover:bg-[#FFF8FB]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  <Link
                    to="/reglement"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-2xl text-sm font-medium text-[#21131D] hover:bg-[#FFF8FB]"
                  >
                    {t.footer.rules}
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-2xl text-sm font-medium text-[#21131D] hover:bg-[#FFF8FB]"
                  >
                    {t.footer.contact}
                  </Link>
                </nav>
              </div>

              <div className="pt-6 border-t border-[#EEDDE6] flex flex-col gap-3">
                <Link
                  to={user ? '/mon-compte' : '/connexion'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-full border border-[#EEDDE6] text-center text-sm font-medium text-[#21131D] hover:bg-[#FFF8FB]"
                >
                  {user ? `${t.nav.account} (${user.fullName})` : t.nav.login}
                </Link>
                {user && user.role !== 'voter' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 px-4 rounded-full bg-[#780938] text-white text-center text-sm font-medium"
                  >
                    Administration ({user.role})
                  </Link>
                )}
                <Link
                  to="/candidates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-full bg-[#D6F542] text-[#21131D] text-center text-sm font-semibold"
                >
                  {t.nav.voteBtn}
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
