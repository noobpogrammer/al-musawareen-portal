import React, { useState } from 'react';
import { ShotReport, Assignment, UserProfile, StarRating } from '../types';
import { Sparkles, X, Check, RotateCcw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import StarRatingDisplay from './StarRatingDisplay';
import { calculateStarRating } from '../utils/starRating';

interface StarOverrideModalProps {
  report: ShotReport;
  assignment?: Assignment;
  user?: UserProfile;
  autoRating?: StarRating;
  isOpen?: boolean;
  onSaveOverride: (
    reportId: string, 
    goldStars: number, 
    redStars: number, 
    note: string, 
    isOverride: boolean
  ) => void;
  onClose: () => void;
}

export default function StarOverrideModal({
  report,
  assignment,
  user,
  autoRating,
  isOpen,
  onSaveOverride,
  onClose
}: StarOverrideModalProps) {
  if (isOpen === false) return null;

  // Calculate default auto-system rating if not explicitly passed
  const activeAutoRating = autoRating || calculateStarRating({ ...report, adminOverride: undefined }, assignment, user);

  const initialGold = report.adminOverride?.goldStars ?? activeAutoRating.goldStars;
  const initialRed = report.adminOverride?.redStars ?? activeAutoRating.redStars;
  const initialNote = report.adminOverride?.note || '';
  const initialIsOverride = report.adminOverride?.isOverride ?? false;

  const [goldStars, setGoldStars] = useState<number>(initialGold);
  const [redStars, setRedStars] = useState<number>(initialRed);
  const [note, setNote] = useState<string>(initialNote);
  const [isOverride, setIsOverride] = useState<boolean>(initialIsOverride);
  const [showTouchPointBreakdown, setShowTouchPointBreakdown] = useState<boolean>(false);

  const handleResetToAuto = () => {
    setGoldStars(activeAutoRating.goldStars);
    setRedStars(activeAutoRating.redStars);
    setNote('');
    setIsOverride(false);
  };

  const handleSave = () => {
    onSaveOverride(report.id, goldStars, redStars, note, isOverride);
    onClose();
  };

  const goldOptions = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
  const redOptions = [0, 1, 2, 3];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FDFAF3] border-2 border-[#5C130F] rounded-xl shadow-2xl p-6 space-y-5 font-sans max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#5C130F]/20 pb-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#5C130F] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#BA8332]" />
              <span>Admin Star Rating Override</span>
            </h3>
            <p className="text-xs text-[#3A1A14]/75 font-mono mt-0.5">
              Member: <strong className="text-[#5C130F]">{user?.fullName || report.userName}</strong> ({report.itsNumber})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#5C130F]/70 hover:text-[#5C130F] hover:bg-[#5C130F]/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Auto-Calculated Rating Card */}
        <div className="bg-[#FAF4E8] p-4 rounded-lg border border-[#5C130F]/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C130F]">
              System Auto-Calculated Baseline
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#BA8332]/15 text-[#5C130F] rounded-xs font-bold">
              Automated
            </span>
          </div>

          <StarRatingDisplay rating={activeAutoRating} showSubtext={true} size="md" />

          {/* Compact / Collapsible Touch Points Breakdown */}
          {activeAutoRating.touchPointDetails && activeAutoRating.touchPointDetails.length > 0 && (
            <div className="pt-2 border-t border-[#5C130F]/15">
              <button
                type="button"
                onClick={() => setShowTouchPointBreakdown(!showTouchPointBreakdown)}
                className="text-[10px] font-mono text-[#5C130F] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showTouchPointBreakdown ? (
                  <>
                    <ChevronUp className="w-3 h-3 text-[#BA8332]" />
                    <span>Hide touch points breakdown</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 text-[#BA8332]" />
                    <span>View touch points breakdown ({activeAutoRating.completedTouchPointsCount}/{activeAutoRating.totalTouchPointsCount} completed)</span>
                  </>
                )}
              </button>

              {showTouchPointBreakdown && (
                <div className="mt-2 p-2.5 bg-white/80 rounded-md border border-[#5C130F]/15 flex flex-wrap gap-1.5">
                  {activeAutoRating.touchPointDetails.map((tp, idx) => (
                    <span
                      key={`tp-dtl-${idx}`}
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
                        tp.isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {tp.isCompleted ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <X className="w-3 h-3 text-red-600" />
                      )}
                      <span>{tp.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Decline Reason Surfacing Box (If Red Star Penalty Applied for Declined Task) */}
        {activeAutoRating.redStarReasons?.assignmentDeclineReason && (
          <div className="p-[#5C130F]/5 p-3 bg-red-50/90 border border-red-200 rounded-md space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-red-800 font-mono font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Red Star: Assignment Declined</span>
            </div>
            <p className="text-[#3A1A14] font-serif pl-5 italic">
              Reason submitted: <strong className="text-red-950 font-sans font-semibold">"{activeAutoRating.redStarReasons.assignmentDeclineReason}"</strong>
            </p>
            <p className="text-[10px] text-red-700 font-mono pl-5 pt-0.5">
              💡 Admin Notice: If this decline reason is justified (e.g. valid emergency), adjust custom Red Stars to 0 below to clear the penalty.
            </p>
          </div>
        )}

        {/* Override Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
              Set Custom Gold Stars (0.5 Step Precision):
            </label>
            <button
              type="button"
              onClick={handleResetToAuto}
              className="text-[10px] font-mono text-[#BA8332] hover:text-[#a06e28] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Auto ({activeAutoRating.goldStars}★)</span>
            </button>
          </div>

          {/* Gold Star Options */}
          <div className="flex flex-wrap gap-1.5">
            {goldOptions.map((val) => (
              <button
                key={`gold-opt-${val}`}
                type="button"
                onClick={() => {
                  setGoldStars(val);
                  setIsOverride(true);
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer ${
                  goldStars === val
                    ? 'bg-[#BA8332] text-white border-[#BA8332] shadow-xs'
                    : 'bg-white text-[#5C130F] border-[#5C130F]/20 hover:border-[#BA8332]'
                }`}
              >
                {val} ★
              </button>
            ))}
          </div>

          {/* Red Star Options */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase text-[#C53030]">
              Set Custom Red Star Demerits:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {redOptions.map((val) => (
                <button
                  key={`red-opt-${val}`}
                  type="button"
                  onClick={() => {
                    setRedStars(val);
                    setIsOverride(true);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer ${
                    redStars === val
                      ? 'bg-[#C53030] text-white border-[#C53030] shadow-xs'
                      : 'bg-white text-[#C53030] border-[#C53030]/30 hover:border-[#C53030]'
                  }`}
                >
                  {val} Red {val === 1 ? 'Star' : 'Stars'}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Override Reason Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
              Admin Override Reason / Audit Note:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (e.target.value.trim().length > 0) setIsOverride(true);
              }}
              placeholder="e.g. Touch points show 100% complete but upon editorial inspection photos were out of focus..."
              className="w-full p-2.5 bg-white border border-[#5C130F]/30 rounded-md text-xs font-sans text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5C130F]/15">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#5C130F]/30 text-[#5C130F] font-mono text-xs font-bold rounded-md hover:bg-[#5C130F]/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold rounded-md transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Rating Override</span>
          </button>
        </div>

      </div>
    </div>
  );
}
