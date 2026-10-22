import React, { useEffect, useState, useRef } from 'react';
import { Compass, ChevronRight } from 'lucide-react';

export interface SectionItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SectionNavProps {
  sections: SectionItem[];
  title?: string;
  className?: string;
}

export const SectionNav: React.FC<SectionNavProps> = ({
  sections,
  title = 'Page Sections',
  className = ''
}) => {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || '');
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<number | null>(null);

  // Active navigation indicator: Scroll spy using IntersectionObserver
  useEffect(() => {
    if (sections.length === 0) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      // If user recently clicked a nav item, let the smooth scroll finish before overriding
      if (isClickScrollingRef.current) return;

      // Find the intersecting entry with highest intersection ratio or topmost
      const intersecting = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => {
          // Compare bounding rect top (prefer elements near the top of viewport)
          return Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top);
        });

      if (intersecting.length > 0) {
        setActiveId(intersecting[0].target.id);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-80px 0px -45% 0px', // Offset for sticky headers and bottom half
      threshold: [0, 0.2, 0.5, 0.8]
    });

    sections.forEach(section => {
      const el = document.getElementById(section.id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [sections]);

  // Smooth scroll handler
  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    setActiveId(id);
    isClickScrollingRef.current = true;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    // Reset lock after smooth scroll animation completes
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = window.setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 850);
  };

  return (
    <nav
      aria-label="Section navigation"
      className={`sticky top-16 z-30 bg-white/90 dark:bg-slate-900/90 night:bg-black/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-2xs ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Section Indicator Label */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 pr-2 border-r border-slate-200 dark:border-slate-800">
            <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin-slow" />
            <span>{title}</span>
          </div>

          {/* Navigation Item Pills with Active Indicator */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
            {sections.map((section) => {
              const isActive = activeId === section.id;
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  onClick={() => handleScrollToSection(section.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`group relative px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 shrink-0 flex items-center gap-1.5 cursor-pointer select-none ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs ring-1 ring-blue-500/20 dark:ring-blue-400/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                  title={`Scroll smoothly to ${section.label}`}
                >
                  {/* Active Indicator Pulse Node */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  )}

                  {Icon && (
                    <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`} />
                  )}

                  <span className="hidden sm:inline">{section.label}</span>
                  <span className="inline sm:hidden">{section.shortLabel || section.label}</span>

                  {/* Active bottom accent bar */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick jump hint */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-400 shrink-0 pl-2">
            <span>Smooth Section Jump</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </div>
        </div>
      </div>
    </nav>
  );
};
