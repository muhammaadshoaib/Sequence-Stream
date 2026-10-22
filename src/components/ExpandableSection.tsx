import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExpandableSectionProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  headerRightAction?: React.ReactNode;
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  subtitle,
  icon,
  badge,
  defaultExpanded = true,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  headerRightAction
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 night:border-slate-800/80 shadow-xs transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Header bar that toggles expand/collapse */}
      <div
        className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none ${headerClassName}`}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex-1 flex items-center justify-between gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg py-0.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 night:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 night:group-hover:text-cyan-400 transition-colors">
                  {title}
                </span>
                {badge}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 night:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors hidden xs:inline">
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
            <div
              className={`w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 night:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-all duration-200 ${
                isExpanded ? 'rotate-180 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''
              }`}
            >
              <ChevronDown className="w-4 h-4 transition-transform duration-200" />
            </div>
          </div>
        </button>

        {headerRightAction && (
          <div className="shrink-0 flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-3">
            {headerRightAction}
          </div>
        )}
      </div>

      {/* Collapsible Content Body */}
      {isExpanded && (
        <div
          className={`border-t border-slate-100 dark:border-slate-800 night:border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-200 ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
