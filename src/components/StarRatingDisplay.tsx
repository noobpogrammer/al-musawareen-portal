import React from 'react';
import { Star, ShieldAlert, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { StarRating } from '../types';

interface StarRatingDisplayProps {
  rating: StarRating;
  showSubtext?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StarRatingDisplay({
  rating,
  showSubtext = true,
  size = 'md',
  className = ''
}: StarRatingDisplayProps) {
  const { goldStars, redStars, isOverride, overrideNote, completionPercent, completedTouchPointsCount, totalTouchPointsCount, isOnTime, redStarReasons } = rating;

  const starSizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4.5 h-4.5';
  const textSizeClass = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';

  // Helper to render half vs full gold stars
  const renderGoldStars = () => {
    const stars = [];
    const fullStars = Math.floor(goldStars);
    const hasHalfStar = goldStars % 1 >= 0.4;
    const maxGoldSlots = Math.max(4, Math.ceil(goldStars));

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`gold-full-${i}`}
          className={`${starSizeClass} text-[#BA8332] fill-[#BA8332] shrink-0`}
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="gold-half" className="relative shrink-0 inline-block">
          {/* Base muted star */}
          <Star className={`${starSizeClass} text-[#BA8332]/30 fill-[#BA8332]/20`} />
          {/* Half overlay */}
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className={`${starSizeClass} text-[#BA8332] fill-[#BA8332]`} />
          </div>
        </div>
      );
    }

    // Fill remaining to at least show background stars if goldStars is low
    const renderedSoFar = fullStars + (hasHalfStar ? 1 : 0);
    for (let i = renderedSoFar; i < 4; i++) {
      stars.push(
        <Star
          key={`gold-empty-${i}`}
          className={`${starSizeClass} text-[#5C130F]/20 fill-transparent shrink-0`}
        />
      );
    }

    return stars;
  };

  // Helper to render red demerit stars
  const renderRedStars = () => {
    if (redStars <= 0) return null;
    const stars = [];
    for (let i = 0; i < redStars; i++) {
      stars.push(
        <Star
          key={`red-${i}`}
          className={`${starSizeClass} text-[#C53030] fill-[#C53030] shrink-0 animate-pulse`}
        />
      );
    }
    return stars;
  };

  // Active red star reason labels
  const redReasonsList: string[] = [];
  if (redStarReasons.isLate) redReasonsList.push('Submitted Late (after deadline)');
  if (redStarReasons.sharafCancelledFault) redReasonsList.push('Sharaf Allocation Cancelled (Member Fault)');
  if (redStarReasons.assignmentCancelledFault) redReasonsList.push('Assignment Cancelled (Member Fault)');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Star Icons Row */}
      <div className="flex items-center gap-1 flex-wrap">
        <div className="flex items-center gap-0.5" title={`Gold Rating: ${goldStars} Stars`}>
          {renderGoldStars()}
        </div>

        {redStars > 0 && (
          <div className="flex items-center gap-0.5 ml-1.5 pl-1.5 border-l border-[#5C130F]/20" title={`Demerits: ${redStars} Red Stars (${redReasonsList.join(', ')})`}>
            {renderRedStars()}
          </div>
        )}

        {isOverride && (
          <span className="ml-1 px-1.5 py-0.2 bg-[#5C130F] !text-white text-[8px] font-mono font-bold uppercase rounded-xs tracking-wider">
            ADMIN OVERRIDDEN
          </span>
        )}
      </div>

      {/* Subtext & Tooltip breakdown */}
      {showSubtext && (
        <div className={`font-mono ${textSizeClass} text-[#3A1A14]/80 flex flex-col gap-0.5 mt-0.5`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[#5C130F]">
              {goldStars} Gold {goldStars === 1 ? 'Star' : 'Stars'}
            </span>
            <span>•</span>
            <span>
              {completedTouchPointsCount}/{totalTouchPointsCount} Touch Points ({Math.round(completionPercent)}%)
            </span>
            <span>•</span>
            <span className={isOnTime ? 'text-emerald-700 font-bold flex items-center gap-0.5' : 'text-red-700 font-bold flex items-center gap-0.5'}>
              {isOnTime ? <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> : <Clock className="w-3 h-3 text-red-600 inline" />}
              {isOnTime ? 'On-Time (+1★)' : 'Late (0★)'}
            </span>
          </div>

          {redStars > 0 && redReasonsList.length > 0 && (
            <div className="text-[10px] text-red-700 font-sans flex items-start gap-1 mt-0.5 bg-red-50/70 p-1 rounded-xs border border-red-200">
              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-mono uppercase">Red Star Demerits:</strong> {redReasonsList.join('; ')}
              </div>
            </div>
          )}

          {isOverride && overrideNote && (
            <p className="text-[10px] text-[#5C130F] font-serif italic bg-[#BA8332]/10 px-1.5 py-0.5 rounded-xs border border-[#BA8332]/30 mt-0.5">
              <strong>Admin Note:</strong> "{overrideNote}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
