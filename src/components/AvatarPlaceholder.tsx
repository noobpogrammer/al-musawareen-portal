import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarPlaceholderProps {
  sizeClassName?: string;
  iconSizeClassName?: string;
  className?: string;
  src?: string;
  alt?: string;
}

export default function AvatarPlaceholder({
  sizeClassName = 'w-8 h-8',
  iconSizeClassName = 'w-4 h-4',
  className = '',
  src,
  alt = 'User Avatar'
}: AvatarPlaceholderProps) {
  const [imageError, setImageError] = useState(false);

  if (src && !imageError) {
    return (
      <div
        className={`rounded-[8px] overflow-hidden bg-[#FDFAF3] shrink-0 border border-[rgba(92,19,15,0.3)] shadow-xs ${sizeClassName} ${className}`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-[8px] bg-[#FDFAF3] flex items-center justify-center shrink-0 border border-[rgba(92,19,15,0.3)] ${sizeClassName} ${className}`}
    >
      <User className={`${iconSizeClassName} text-[#5C130F]/40`} />
    </div>
  );
}
