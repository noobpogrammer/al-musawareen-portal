import React from 'react';
import { UserProfile } from '../types';
import Logo from './Logo';
import AvatarPlaceholder from './AvatarPlaceholder';

interface IDCardProps {
  user: Partial<UserProfile>;
  className?: string;
}

export default function IDCard({ user, className = '' }: IDCardProps) {
  const roleLabelsEnglish: Record<string, string> = {
    photographer: 'Certified Photographer',
    videographer: 'Certified Videographer',
    coordinator: 'HR Coordinator',
    admin: 'General Administrator',
  };

  const itsNumberFormatted = user.itsNumber || 'XXXXXXXX';
  const roleEnglish = roleLabelsEnglish[user.role || 'photographer'];

  return (
    <div 
      className={`relative w-80 h-[520px] rounded-none overflow-hidden flex flex-col bg-editorial-bg bg-hexagon-pattern border-2 border-[#c59b27] text-editorial-ink select-none ${className}`}
      id={`id-card-${itsNumberFormatted}`}
      style={{ boxShadow: '0 10px 25px -5px rgba(74, 18, 18, 0.15)' }}
    >
      {/* Arabic Structure of a Hexagon Watermark Background */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none flex items-center justify-center">
        <svg className="w-72 h-72 text-editorial-accent" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Hexagram / Hexagon Geometry typical of Fatimi art */}
          <polygon points="50,5 93.3,30 93.3,80 50,105 6.7,80 6.7,30" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="50,15 84.6,35 84.6,75 50,95 15.4,75 15.4,35" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          {/* Inside interlaced geometries */}
          <polygon points="50,25 75.8,40 75.8,70 50,85 24.2,70 24.2,40" stroke="currentColor" strokeWidth="0.8" />
          <line x1="50" y1="5" x2="50" y2="105" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="6.7" y1="30" x2="93.3" y2="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="6.7" y1="80" x2="93.3" y2="30" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
        </svg>
      </div>

      {/* Decorative Gold Corner Frames */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#c59b27] pointer-events-none" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#c59b27] pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#c59b27] pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#c59b27] pointer-events-none" />

      {/* TOP HEADER: Royal Burgundy Maroon Banner with Hexagon geometry */}
      <div className="relative bg-editorial-ink h-[165px] flex flex-col items-center pt-5 pb-8 px-4 text-center border-b border-[#c59b27] overflow-hidden">
        {/* Repeating pattern overlay */}
        <div className="absolute inset-0 bg-hexagon-pattern opacity-[0.12] pointer-events-none" />
        
        {/* White / Gold Reversed Logo */}
        <Logo variant="reversed" className="h-11 z-10" />
        
        <p className="font-serif text-[10px] text-[#c59b27] tracking-[0.2em] font-bold uppercase mt-2.5 z-10">
          Ashara Mubarakah
        </p>
      </div>

      {/* PHOTO FRAME: Gold-bordered frame overlapping header and body */}
      <div className="absolute top-[105px] left-1/2 -translate-x-1/2 z-10">
        <div className="w-[125px] h-[150px] rounded-[10px] bg-editorial-bg p-1 shadow-[0_8px_16px_rgba(74,18,18,0.12)] border-2 border-[#c59b27] flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full rounded-[8px] overflow-hidden bg-[#FDFAF3] border border-[#5C130F]/20 flex flex-col items-center justify-center">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'Member'}
                className="w-full h-full object-cover"
              />
            ) : (
              <AvatarPlaceholder src={user.avatarUrl} alt={user.fullName} sizeClassName="w-14 h-14" iconSizeClassName="w-7 h-7" />
            )}
          </div>
        </div>
      </div>

      {/* CARD BODY: Richly stylized dual names and ITS */}
      <div className="mt-[100px] flex-1 flex flex-col items-center justify-between px-4 pb-5 text-center z-10">
        {/* English Name section */}
        <div className="w-full flex flex-col items-center gap-1">
          {/* English Name using elegant Cinzel Roman Serif font */}
          <h2 className="font-serif text-base font-extrabold text-editorial-ink uppercase tracking-wide leading-tight max-w-[260px] truncate">
            {user.fullName || 'Participant Name'}
          </h2>
          {/* Identity Subtitle */}
          <p className="font-sans text-[9px] font-bold text-[#c59b27] uppercase tracking-widest mt-1">
            Al Musawareen Delegate
          </p>
        </div>

        {/* ITS Number layout & Sharaf Event Labels */}
        <div className="flex flex-col items-center gap-1 mt-1">
          <div className="bg-editorial-ink/5 border border-editorial-border rounded-none px-4 py-1 flex items-center justify-center gap-2">
            <span className="font-mono text-xs font-bold text-editorial-ink tracking-widest">
              ITS: {itsNumberFormatted}
            </span>
          </div>

          {user.sharafAllocations && user.sharafAllocations.length > 0 && (
            <div className="bg-[#5C130F] !text-white border border-[#c59b27] px-3 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider mt-1">
              Sharaf: {Array.from(new Set(user.sharafAllocations.map(a => a.eventType))).join(', ')}
            </div>
          )}
        </div>

        {/* FOOTER FILMSTRIP DIVIDER: Gold punch holes matching Al Musawir theme */}
        <div className="w-full mt-3">
          {/* Filmstrip perforations */}
          <div className="flex justify-between px-1 mb-1.5 opacity-40">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="w-2.5 h-1.5 bg-[#c59b27] rounded-none" />
            ))}
          </div>

          {/* Golden Role Label Bottom Panel with deep maroon text */}
          <div className="relative bg-[#c59b27] py-2 px-4 shadow-sm border border-[#a57c1e] text-white">
            <span className="font-serif text-xs font-bold uppercase tracking-widest">
              {roleEnglish}
            </span>
          </div>

          {/* Filmstrip bottom perforations */}
          <div className="flex justify-between px-1 mt-1.5 opacity-40">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="w-2.5 h-1.5 bg-[#c59b27] rounded-none" />
            ))}
          </div>
        </div>
      </div>

      {/* Royal Seal Watermark */}
      <div className="absolute bottom-16 right-4 opacity-[0.06] pointer-events-none">
        <svg className="w-14 h-14 text-editorial-ink" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M50 20 L60 40 L80 40 L65 55 L75 75 L50 60 L25 75 L35 55 L20 40 L40 40 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

