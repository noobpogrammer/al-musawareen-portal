import React from 'react';

interface LogoProps {
  variant?: 'primary' | 'reversed';
  className?: string;
  showSubtitle?: boolean; // Deprecated, kept for backward compatibility but unused
}

export default function Logo({ variant = 'primary', className = 'h-14' }: LogoProps) {
  const isReversed = variant === 'reversed';
  const logoSrc = isReversed ? '/images/logo_reversed.svg' : '/images/logo.svg';

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Al Musawareen Logo"
        className="h-full w-auto object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

