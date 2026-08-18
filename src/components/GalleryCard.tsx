import React from 'react';

interface GalleryCardProps {
  key?: React.Key;
  url: string;
  title: string;
  location: string;
  credit: string;
  capturedByLabel?: string;
  className?: string;
}

export default function GalleryCard({
  url,
  title,
  location,
  credit,
  capturedByLabel = 'Captured by',
  className = ''
}: GalleryCardProps) {
  return (
    <div 
      className={`group relative border border-[rgba(92,19,15,0.15)] shadow-[0_1px_3px_rgba(92,19,15,0.08)] transition-all duration-200 hover:border-[#5C130F] flex flex-col ${className}`}
    >
      {/* Full-bleed photo container (Untouched photo, full opacity, full color) */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/5">
        <img
          src={url}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>

      {/* Translucent Cream Info Strip below photo */}
      <div 
        className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 border-t border-[rgba(92,19,15,0.12)]"
        style={{ backgroundColor: 'rgba(246, 237, 218, 0.9)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-bold text-[#5C130F] leading-snug">
            {title}
          </h3>
          <span className="shrink-0 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#5C130F]/8 text-[#5C130F] border border-[#5C130F]/15">
            {location}
          </span>
        </div>

        <div className="border-t border-[#5C130F]/12 pt-3 flex items-center justify-between text-[11px] font-sans">
          <span className="text-[#3A1A14]/60 italic">{capturedByLabel}</span>
          <span className="font-semibold text-[#3A1A14]">{credit}</span>
        </div>
      </div>
    </div>
  );
}
