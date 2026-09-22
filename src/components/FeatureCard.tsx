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
      className={`group relative p-8 rounded-2xl border border-[#5C130F]/15 shadow-sm text-center flex flex-col items-center gap-4 transition-all duration-300 hover:border-[#BA8332]/40 hover:shadow-md hover:-translate-y-0.5 ${className}`}
      style={{ backgroundColor: 'rgba(246, 237, 218, 0.85)', backdropFilter: 'blur(8px)' }}
    >
      {/* Icon box at top */}
      <div className="w-14 h-14 rounded-xl bg-white/60 text-[#BA8332] border border-[#BA8332]/30 flex items-center justify-center transition-colors group-hover:bg-[#5C130F] group-hover:text-[#BA8332] group-hover:border-[#5C130F]">
        {icon}
      </div>

      {/* Heading in #5C130F */}
      <h3 className="font-serif text-2xl font-semibold text-[#5C130F]">
        {title}
      </h3>

      {/* Body text in #3A1A14 */}
      <p className="font-sans text-sm text-[#3A1A14]/85 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
