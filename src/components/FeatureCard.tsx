import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({ icon, title, description, className = '' }: FeatureCardProps) {
  return (
    <div 
      className={`group relative p-8 border border-[rgba(92,19,15,0.15)] shadow-[0_1px_3px_rgba(92,19,15,0.08)] text-center flex flex-col items-center gap-4 transition-all duration-200 hover:border-[#5C130F] hover:shadow-[0_4px_12px_rgba(92,19,15,0.12)] ${className}`}
      style={{ backgroundColor: 'rgba(246, 237, 218, 0.9)' }}
    >
      {/* Icon box at top */}
      <div className="p-3.5 bg-white/40 text-[#BA8332] border border-[#BA8332]/30 flex items-center justify-center">
        {icon}
      </div>

      {/* Heading in #5C130F, bold */}
      <h3 className="font-serif text-2xl font-bold text-[#5C130F]">
        {title}
      </h3>

      {/* Body text in #3A1A14 */}
      <p className="font-serif text-sm text-[#3A1A14] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
