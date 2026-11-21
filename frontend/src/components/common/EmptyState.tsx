import React from 'react';

export type EmptyStateIllustration = 'search' | 'observations' | 'documents' | 'audit' | 'general';

interface EmptyStateProps {
  illustration?: EmptyStateIllustration;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration = 'general',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const renderIllustration = () => {
    switch (illustration) {
      case 'search':
        return (
          <svg className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="25" width="70" height="70" rx="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />
            <circle cx="56" cy="56" r="22" stroke="#009fe3" strokeWidth="3" className="opacity-80" />
            <line x1="72" y1="72" x2="94" y2="94" stroke="#009fe3" strokeWidth="4" strokeLinecap="round" />
            <circle cx="56" cy="56" r="14" fill="#009fe3" fillOpacity="0.08" />
            <line x1="46" y1="52" x2="66" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
            <line x1="46" y1="60" x2="60" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
          </svg>
        );

      case 'observations':
        return (
          <svg className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="20" width="60" height="80" rx="8" stroke="currentColor" strokeWidth="2" className="opacity-50" />
            <rect x="42" y="14" width="36" height="12" rx="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
            <circle cx="60" cy="62" r="18" fill="#8dc63f" fillOpacity="0.12" stroke="#8dc63f" strokeWidth="2.5" />
            <path d="M52 62L58 68L70 54" stroke="#8dc63f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="42" y1="88" x2="78" y2="88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-30" />
          </svg>
        );

      case 'documents':
        return (
          <svg className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 35C28 30.5817 31.5817 27 36 27H52L62 37H84C88.4183 37 92 40.5817 92 45V85C92 89.4183 88.4183 93 84 93H36C31.5817 93 28 89.4183 28 85V35Z" stroke="currentColor" strokeWidth="2" className="opacity-50" fill="currentColor" fillOpacity="0.04" />
            <rect x="44" y="50" width="32" height="42" rx="4" fill="var(--bg-surface)" stroke="#009fe3" strokeWidth="2" />
            <line x1="52" y1="60" x2="68" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60" />
            <line x1="52" y1="68" x2="68" y2="68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60" />
            <line x1="52" y1="76" x2="62" y2="76" stroke="#009fe3" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'audit':
        return (
          <svg className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 20L88 32V60C88 78 76 94 60 100C44 94 32 78 32 60V32L60 20Z" stroke="#009fe3" strokeWidth="2.5" fill="#009fe3" fillOpacity="0.06" />
            <path d="M48 58L56 66L74 46" stroke="#8dc63f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'general':
      default:
        return (
          <svg className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="35" y="30" width="50" height="60" rx="8" stroke="currentColor" strokeWidth="2" className="opacity-50" />
            <line x1="45" y1="45" x2="75" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
            <line x1="45" y1="55" x2="75" y2="55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
            <line x1="45" y1="65" x2="65" y2="65" stroke="#009fe3" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative mb-1">
        {renderIllustration()}
      </div>
      <div className="max-w-md space-y-1">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300 shadow-xs"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
