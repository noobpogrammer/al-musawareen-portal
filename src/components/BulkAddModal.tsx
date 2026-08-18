import React, { useState, useMemo } from 'react';
import { Layers, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { LanguageType } from '../utils/translations';

interface BulkAddModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  placeholder?: string;
  existingNames: string[];
  onConfirm: (newItems: string[]) => void;
  onClose: () => void;
  lang: LanguageType;
}

export default function BulkAddModal({
  isOpen,
  title,
  subtitle,
  placeholder = "Type or paste items, separated by commas (e.g. Item 1, Item 2, Item 3)...",
  existingNames,
  onConfirm,
  onClose,
  lang
}: BulkAddModalProps) {
  const [textInput, setTextInput] = useState('');
  const isRtl = lang === 'ar';

  // Real-time comma-separated parsing & duplicate detection logic
  const parseResult = useMemo(() => {
    if (!textInput.trim()) {
      return { allItems: [], validNew: [], duplicates: [] };
    }

    const rawItems = textInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Deduplicate within the input list itself first
    const uniqueRawItems: string[] = [];
    rawItems.forEach(item => {
      if (!uniqueRawItems.some(u => u.toLowerCase() === item.toLowerCase())) {
        uniqueRawItems.push(item);
      }
    });

    const existingLowerSet = new Set(existingNames.map(e => e.toLowerCase().trim()));

    const validNew: string[] = [];
    const duplicates: string[] = [];

    uniqueRawItems.forEach(item => {
      if (existingLowerSet.has(item.toLowerCase())) {
        duplicates.push(item);
      } else {
        validNew.push(item);
      }
    });

    return { allItems: uniqueRawItems, validNew, duplicates };
  }, [textInput, existingNames]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (parseResult.validNew.length === 0) return;
    onConfirm(parseResult.validNew);
    setTextInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-[#FDFAF3] border-2 border-[#5C130F] w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${isRtl ? 'rtl' : 'ltr'}`}>
        
        {/* Header Ribbon */}
        <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-3">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#5C130F] flex items-center gap-2 uppercase tracking-wider">
            <Layers className="w-6 h-6 text-[#BA8332]" />
            <span>{title}</span>
          </h3>
          <button
            onClick={() => {
              setTextInput('');
              onClose();
            }}
            className="text-[#5C130F] hover:font-bold font-mono text-base p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {subtitle && (
          <p className="text-xs text-[#3A1A14]/80 font-serif">
            {subtitle}
          </p>
        )}

        {/* Textarea Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase text-[#5C130F] block">
            {lang === 'en' ? 'Comma-Separated Text Entry:' : 'إدخال أسماء متعددة تفصل بينها فاصلة:'}
          </label>
          <textarea
            rows={5}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 border border-[#5C130F]/35 bg-white font-serif text-xs text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
          />
        </div>

        {/* Real-time Validation Summary & Previews */}
        {textInput.trim() && (
          <div className="space-y-3 font-sans border-t border-[#5C130F]/15 pt-3">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-bold">
              <span className="text-[#5C130F] bg-[#5C130F]/10 px-2 py-0.5 border border-[#5C130F]/20">
                {parseResult.allItems.length} {lang === 'en' ? 'Detected' : 'مكتشف'}
              </span>

              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {parseResult.validNew.length} {lang === 'en' ? 'New Items to Add' : 'عناصر جديدة للإضافة'}
              </span>

              {parseResult.duplicates.length > 0 && (
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {parseResult.duplicates.length} {lang === 'en' ? 'Duplicates Skipped' : 'تخطي المكرر'}
                </span>
              )}
            </div>

            {/* Valid New Items Badge List */}
            {parseResult.validNew.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block">
                  {lang === 'en' ? 'Valid New Items Ready to Import:' : 'العناصر الجديدة المعتمدة:'}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-emerald-50/50 border border-emerald-200">
                  {parseResult.validNew.map((item, idx) => (
                    <span key={idx} className="bg-emerald-700 text-white text-[10px] font-serif font-bold px-2 py-0.5 rounded-none">
                      + {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicates Warning List */}
            {parseResult.duplicates.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-800 block">
                  {lang === 'en' ? 'Existing Duplicates (Will be Skipped):' : 'العناصر الموجودة سابقاً (سيتم تجاهلها):'}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-2 bg-amber-50/50 border border-amber-200">
                  {parseResult.duplicates.map((item, idx) => (
                    <span key={idx} className="bg-amber-800/20 text-amber-900 text-[10px] font-serif px-2 py-0.5 rounded-none border border-amber-300 line-through">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Footer Buttons */}
        <div className="flex justify-end gap-3 border-t border-[#5C130F]/20 pt-3">
          <button
            type="button"
            onClick={() => {
              setTextInput('');
              onClose();
            }}
            className="px-4 py-2 border border-[#5C130F]/30 text-[#5C130F] font-mono text-xs font-bold rounded-none uppercase cursor-pointer"
          >
            {lang === 'en' ? 'Cancel' : 'إلغاء'}
          </button>

          <button
            type="button"
            disabled={parseResult.validNew.length === 0}
            onClick={handleApply}
            className={`px-5 py-2 font-mono text-xs font-bold rounded-none uppercase shadow-sm transition-all cursor-pointer ${
              parseResult.validNew.length > 0
                ? 'bg-[#BA8332] hover:bg-[#a06e28] text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {lang === 'en' ? `Add ${parseResult.validNew.length} New Item(s)` : `إضافة ${parseResult.validNew.length} عنصر جديد`}
          </button>
        </div>

      </div>
    </div>
  );
}
