import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AssignmentNotification, formatRoleBadgeLabel, hasRole } from '../types';
import Logo from './Logo';
import AvatarPlaceholder from './AvatarPlaceholder';
import { translations, LanguageType } from '../utils/translations';
import { 
  Bell, 
  CheckCheck, 
  ChevronDown, 
  Menu, 
  X, 
  LogOut 
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  lang: LanguageType;
  setLang: (lang: LanguageType) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isSafarModeEnabled?: boolean;
  notifications?: AssignmentNotification[];
  onMarkNotificationRead?: (id: string) => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  lang,
  activeView,
  setActiveView,
  notifications = [],
  onMarkNotificationRead
}: NavbarProps) {
  const t = translations[lang] || translations['en'];
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
        setIsAccountMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoClick = () => {
    if (activeView === 'public') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveView('public');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleOurWorkClick = () => {
    setIsMobileMenuOpen(false);
    if (activeView !== 'public') {
      setActiveView('public');
      setTimeout(() => {
        const el = document.getElementById('our-work');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('our-work');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactClick = () => {
    setIsMobileMenuOpen(false);
    if (activeView !== 'public') {
      setActiveView('public');
      setTimeout(() => {
        const el = document.getElementById('contact');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('contact');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getShortName = (fullName?: string) => {
    if (!fullName) return 'Member';
    const parts = fullName.trim().split(' ');
    return parts[0] || 'Member';
  };

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 pt-3.5 pb-1 pointer-events-none transition-all">
      {/* FLOATING ROUNDED HERITAGE CONTAINER */}
      <div className="max-w-7xl mx-auto bg-[#5C130F] rounded-[16px] md:rounded-[24px] border border-[#BA8332]/20 shadow-sm shadow-black/10 px-4 sm:px-6 md:px-8 lg:px-10 h-14 md:h-[74px] flex items-center justify-between pointer-events-auto transition-all">
        
        {/* LEFT: Side-Logo + Primary Navigation Links */}
        <div className="flex items-center gap-6 md:gap-10">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA8332] rounded-sm py-1"
            aria-label="Al Musawareen Home"
          >
            <Logo variant="reversed" className="h-8 sm:h-9 md:h-[44px] lg:h-[48px] w-auto transition-all" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 md:gap-8 font-sans text-sm">
            <button
              type="button"
              onClick={() => handleNavigate('public')}
              className={`transition-colors cursor-pointer py-1 ${
                activeView === 'public'
                  ? 'text-[#BA8332] font-semibold'
                  : 'text-[#FAF4E8]/85 font-medium hover:text-[#BA8332]'
              }`}
            >
              {t.home || 'Home'}
            </button>

            {/* Public Section Links */}
            <button
              type="button"
              onClick={handleOurWorkClick}
              className="font-medium text-[#FAF4E8]/85 hover:text-[#BA8332] transition-colors cursor-pointer py-1"
            >
              {t.galleryTitle || 'Our Work'}
            </button>

            <button
              type="button"
              onClick={handleContactClick}
              className="font-medium text-[#FAF4E8]/85 hover:text-[#BA8332] transition-colors cursor-pointer py-1"
            >
              Contact
            </button>

            {/* If Admin Logged In */}
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => handleNavigate('admin')}
                className={`transition-colors cursor-pointer py-1 ${
                  activeView === 'admin'
                    ? 'text-[#BA8332] font-semibold'
                    : 'text-[#FAF4E8]/85 font-medium hover:text-[#BA8332]'
                }`}
              >
                {t.admin || 'Admin'}
              </button>
            )}

            {/* If Regular Member Logged In */}
            {currentUser && currentUser.role !== 'admin' && (
              <button
                type="button"
                onClick={() => handleNavigate('submit')}
                className={`transition-colors cursor-pointer py-1 ${
                  activeView === 'submit' || activeView === 'sharaf'
                    ? 'text-[#BA8332] font-semibold'
                    : 'text-[#FAF4E8]/85 font-medium hover:text-[#BA8332]'
                }`}
              >
                My Portal
              </button>
            )}
          </nav>
        </div>

        {/* RIGHT: Actions & User Controls */}
        <div className="flex items-center gap-5 md:gap-6 justify-end">
          {!currentUser ? (
            /* Guest Actions (Desktop) */
            <div className="hidden md:flex items-center gap-5">
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className={`font-sans text-sm font-semibold transition-colors px-1 py-1 cursor-pointer ${
                  activeView === 'login' ? 'text-[#BA8332]' : 'text-[#FAF4E8]/85 hover:text-[#BA8332]'
                }`}
              >
                {t.login || 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('register')}
                className="h-[38px] md:h-10 px-5 bg-[#BA8332] hover:bg-[#a06e28] !text-white font-sans text-xs sm:text-sm font-semibold rounded-[10px] shadow-xs transition-colors cursor-pointer flex items-center justify-center"
              >
                {t.register || 'Register'}
              </button>
            </div>
          ) : (
            /* Authenticated Member Actions (Desktop) */
            <div className="hidden md:flex items-center gap-4">
              {/* Notification Bell (Admin / HR) */}
              {(currentUser.role === 'admin' || hasRole(currentUser, 'coordinator')) && (
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 text-[#FAF4E8]/90 hover:text-[#BA8332] hover:bg-white/10 rounded-md transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA8332]"
                    aria-label="Notifications"
                    aria-expanded={isNotifOpen}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-600 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Popover */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#FDFAF3] text-[#3A1A14] border border-[#5C130F]/30 shadow-xl rounded-md z-50 p-4 space-y-3 font-sans animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-[#5C130F]/15 pb-2">
                        <h4 className="font-serif font-bold text-sm text-[#5C130F] flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-[#BA8332]" />
                          <span>Notifications</span>
                        </h4>
                        <span className="text-[10px] font-sans font-semibold bg-[#5C130F]/10 text-[#5C130F] px-2 py-0.5 rounded-sm">
                          {notifications.length} Total
                        </span>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs font-serif italic text-[#3A1A14]/60">
                            No notifications yet.
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 border text-xs space-y-1 rounded-sm transition-colors ${
                                n.action === 'declined'
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-white border-[#5C130F]/15'
                              } ${!n.read ? 'border-l-4 border-l-[#BA8332]' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-xs ${
                                  n.action === 'declined'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-emerald-700 text-white'
                                }`}>
                                  {n.action === 'declined' ? 'DECLINED — REASSIGNMENT NEEDED' : 'CONFIRMED'}
                                </span>
                                <span className="text-[9px] font-mono text-[#3A1A14]/60">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="font-serif text-[#3A1A14] text-xs leading-snug">
                                {n.assignmentTitle}
                              </p>
                              {!n.read && onMarkNotificationRead && (
                                <button
                                  type="button"
                                  onClick={() => onMarkNotificationRead(n.id)}
                                  className="text-[11px] font-sans font-medium text-[#BA8332] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                                >
                                  <CheckCheck className="w-3 h-3" />
                                  <span>Mark as read</span>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Dropdown Trigger */}
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2.5 py-1.5 px-3 rounded-md text-[#FAF4E8] hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA8332]"
                  aria-label="User Account Menu"
                  aria-expanded={isAccountMenuOpen}
                >
                  <AvatarPlaceholder 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.fullName} 
                    sizeClassName="w-7 h-7 md:w-8 md:h-8" 
                    iconSizeClassName="w-3.5 h-3.5 md:w-4 md:h-4" 
                  />
                  <span className="text-xs md:text-sm font-sans font-semibold text-[#FAF4E8] truncate max-w-[130px]">
                    {getShortName(currentUser.fullName)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#FAF4E8]/70 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Popover Menu */}
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#FDFAF3] text-[#3A1A14] border border-[#5C130F]/30 shadow-xl rounded-md z-50 p-3 space-y-3 font-sans animate-fadeIn">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#5C130F] leading-tight">
                        {currentUser.fullName}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[9px] font-sans font-semibold bg-[#5C130F]/10 text-[#5C130F] px-1.5 py-0.5 rounded-xs">
                          {formatRoleBadgeLabel(currentUser)}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#BA8332]">
                          ITS: {currentUser.itsNumber}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#5C130F]/15 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onLogout();
                        }}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans font-semibold text-[#5C130F] hover:bg-[#5C130F]/10 rounded-sm transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MOBILE CONTROLS (Bell + Hamburger) */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Notification Bell */}
            {currentUser && (currentUser.role === 'admin' || hasRole(currentUser, 'coordinator')) && (
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsMobileMenuOpen(false);
                }}
                className="p-1.5 text-[#FAF4E8] hover:bg-white/10 rounded-md transition-colors relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-600 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-[#FAF4E8] hover:bg-white/10 rounded-md transition-colors cursor-pointer focus:outline-none"
              aria-label="Toggle Navigation Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden max-w-7xl mx-auto mt-2 bg-[#5C130F] border border-[#BA8332]/30 rounded-[16px] shadow-lg p-4 space-y-3 font-sans text-[#FAF4E8] pointer-events-auto animate-fadeIn">
          {!currentUser ? (
            /* Guest Mobile Menu */
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleNavigate('public')}
                className={`w-full py-2.5 px-3 text-left font-sans text-sm font-semibold rounded-md transition-colors ${
                  activeView === 'public' ? 'bg-white/15 text-[#BA8332]' : 'text-[#FAF4E8]/85 hover:bg-white/10'
                }`}
              >
                {t.home || 'Home'}
              </button>

              <button
                type="button"
                onClick={handleOurWorkClick}
                className="w-full py-2.5 px-3 text-left font-sans text-sm font-semibold text-[#FAF4E8]/85 hover:bg-white/10 rounded-md transition-colors"
              >
                {t.galleryTitle || 'Our Work'}
              </button>

              <button
                type="button"
                onClick={handleContactClick}
                className="w-full py-2.5 px-3 text-left font-sans text-sm font-semibold text-[#FAF4E8]/85 hover:bg-white/10 rounded-md transition-colors"
              >
                Contact
              </button>

              <div className="border-t border-white/15 pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigate('login')}
                  className="w-full py-2.5 px-3 text-left font-sans text-sm font-semibold text-[#FAF4E8] hover:bg-white/10 rounded-md transition-colors"
                >
                  {t.login || 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigate('register')}
                  className="w-full py-2.5 px-3 text-center bg-[#BA8332] hover:bg-[#a06e28] text-white font-sans text-sm font-semibold rounded-[10px] shadow-xs transition-colors"
                >
                  {t.register || 'Register'}
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated Member Mobile Menu */
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-white/10 border border-white/15 rounded-md flex items-center gap-3">
                <AvatarPlaceholder 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.fullName} 
                  sizeClassName="w-9 h-9" 
                  iconSizeClassName="w-4 h-4" 
                />
                <div>
                  <p className="text-xs font-semibold text-white">
                    {currentUser.fullName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-sans font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-xs">
                      {formatRoleBadgeLabel(currentUser)}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#CE933E]">
                      ITS: {currentUser.itsNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('public')}
                  className={`w-full py-2.5 px-3 text-left font-sans text-sm font-semibold rounded-md transition-colors ${
                    activeView === 'public' ? 'bg-white/15 text-[#BA8332]' : 'text-[#FAF4E8]/85 hover:bg-white/10'
                  }`}
                >
                  {t.home || 'Home'}
                </button>

                {currentUser.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => handleNavigate('admin')}
                    className={`w-full py-2.5 px-3 text-left font-sans text-sm font-semibold rounded-md transition-colors ${
                      activeView === 'admin' ? 'bg-white/15 text-[#BA8332]' : 'text-[#FAF4E8]/85 hover:bg-white/10'
                    }`}
                  >
                    {t.admin || 'Admin'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNavigate('submit')}
                    className={`w-full py-2.5 px-3 text-left font-sans text-sm font-semibold rounded-md transition-colors ${
                      activeView === 'submit' || activeView === 'sharaf' ? 'bg-white/15 text-[#BA8332]' : 'text-[#FAF4E8]/85 hover:bg-white/10'
                    }`}
                  >
                    My Portal
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleContactClick}
                  className="w-full py-2.5 px-3 text-left font-sans text-sm font-semibold text-[#FAF4E8]/85 hover:bg-white/10 rounded-md transition-colors"
                >
                  Contact
                </button>
              </div>

              <div className="border-t border-white/15 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-2 w-full py-2.5 px-3 text-left font-sans text-sm font-semibold text-red-200 hover:bg-white/10 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
