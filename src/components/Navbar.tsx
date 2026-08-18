import React, { useState } from 'react';
import { UserProfile, AssignmentNotification, formatRoleBadgeLabel, hasRole } from '../types';
import Logo from './Logo';
import AvatarPlaceholder from './AvatarPlaceholder';
import { translations, LanguageType } from '../utils/translations';
import { Camera, Shield, LogOut, Globe, User, BookOpen, Bell, CheckCheck } from 'lucide-react';

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
  setLang,
  activeView,
  setActiveView,
  isSafarModeEnabled = true,
  notifications = [],
  onMarkNotificationRead
}: NavbarProps) {
  const t = translations['en'];
  const isRtl = false;
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-editorial-bg/90 backdrop-blur-md border-b border-editorial-border text-editorial-ink transition-all">
      {/* Outer wrapper with padding, supporting RTL layouts automatically */}
      <div 
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between ${
          isRtl ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Left/Right Logo Section depending on language layout */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setActiveView('public')}
        >
          <Logo variant="primary" className="h-12" />
        </div>

        {/* Dynamic Nav Controls */}
        <div className={`flex items-center gap-2 sm:gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Public Gallery Tab Button */}
          <button
            onClick={() => setActiveView('public')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-all duration-150 ${
              activeView === 'public'
                ? 'bg-editorial-ink text-editorial-bg border border-editorial-ink'
                : 'text-editorial-ink/70 hover:bg-editorial-ink/5 border border-transparent hover:text-editorial-ink'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.home}</span>
          </button>

          {/* If Logged In */}
          {currentUser ? (
            <>
              {/* If user is Admin, show Admin Control Center link */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setActiveView('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-all duration-150 ${
                    activeView === 'admin'
                      ? 'bg-editorial-accent text-white border border-editorial-accent'
                      : 'text-editorial-accent hover:bg-editorial-accent/5 border border-transparent'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t.admin}</span>
                </button>
              )}

              {/* Notification Bell Dropdown (For Admin) */}
              {currentUser.role === 'admin' && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-1.5 border border-[#5C130F]/20 text-[#5C130F] hover:bg-[#5C130F]/10 transition-colors relative cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isNotifOpen && (
                    <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 bg-[#FDFAF3] border-2 border-[#5C130F] shadow-xl z-50 p-4 space-y-3 font-sans">
                      <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-2">
                        <h4 className="font-serif font-bold text-sm text-[#5C130F] uppercase tracking-wider flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-[#BA8332]" />
                          <span>Notifications</span>
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-[#5C130F]/10 text-[#5C130F] px-2 py-0.5">
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
                              className={`p-2.5 border text-xs space-y-1 transition-colors ${
                                n.action === 'declined'
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-white border-[#5C130F]/15'
                              } ${!n.read ? 'border-l-4 border-l-[#BA8332]' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 ${
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
                                  className="text-[10px] font-mono font-bold text-[#BA8332] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
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

              {/* If user is Photographer/Videographer/Coordinator, show My Portal link */}
              {currentUser.role !== 'admin' && (
                <button
                  onClick={() => setActiveView('submit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-all duration-150 ${
                    activeView === 'submit' || activeView === 'sharaf'
                      ? 'bg-editorial-ink text-editorial-bg border border-editorial-ink'
                      : 'text-editorial-ink/70 hover:bg-editorial-ink/5 border border-transparent hover:text-editorial-ink'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">My Portal</span>
                </button>
              )}

              {/* Logged in User Profile Info & Logout */}
              <div className={`hidden md:flex items-center gap-2 border-l border-editorial-border pl-4 ${isRtl ? 'flex-row-reverse border-r border-l-0 pr-4' : 'flex-row border-l pl-4'}`}>
                <div className={`text-right ${isRtl ? 'text-left' : 'text-right'}`}>
                  <p className="text-xs font-semibold text-editorial-ink truncate max-w-[130px]">
                    {currentUser.fullName}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-[9px] font-mono font-bold bg-[#5C130F]/10 text-[#5C130F] px-1.5 py-0.5 rounded-sm">
                      {formatRoleBadgeLabel(currentUser)}
                    </span>
                    <span className="text-[10px] text-editorial-accent font-mono font-bold">
                      ITS: {currentUser.itsNumber}
                    </span>
                  </div>
                </div>
                <AvatarPlaceholder src={currentUser.avatarUrl} alt={currentUser.fullName} sizeClassName="w-8 h-8" iconSizeClassName="w-4 h-4" />
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1.5 border border-transparent hover:border-editorial-accent/20 text-editorial-ink/70 hover:text-editorial-accent hover:bg-editorial-accent/5 transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* If Not Logged In, show Login / Join buttons */
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveView('login')}
                className={`font-mono text-[11px] font-semibold tracking-wider uppercase hover:text-editorial-accent transition-colors px-2 py-1.5 ${
                  activeView === 'login' ? 'text-editorial-accent border-b border-editorial-accent' : 'text-editorial-ink/70'
                }`}
              >
                {t.login}
              </button>
              <button
                onClick={() => setActiveView('register')}
                className="font-mono text-[11px] font-bold bg-editorial-accent text-white hover:bg-editorial-accent/90 transition-colors px-3 py-1.5 border border-editorial-accent"
              >
                {t.register}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
