import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { DisplayMode } from '../types/bio';

interface DisplayThemeSwitchProps {
  displayMode: DisplayMode;
  onChangeDisplayMode: (mode: DisplayMode) => void;
  className?: string;
  showLabels?: boolean;
}

export const DisplayThemeSwitch: React.FC<DisplayThemeSwitchProps> = ({
  displayMode,
  onChangeDisplayMode,
  className = '',
  showLabels = true
}) => {
  const options: {
    id: DisplayMode;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: 'light',
      label: 'Light',
      description: 'Standard daylight laboratory view',
      icon: Sun,
      accentColor: 'text-amber-500'
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Cool slate console mode for scientific analysis',
      icon: Moon,
      accentColor: 'text-blue-400'
    },
    {
      id: 'night',
      label: 'Night',
      description: 'Ultra-deep midnight OLED mode with eye-fatigue protection',
      icon: Sparkles,
      accentColor: 'text-indigo-400'
    }
  ];

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl border border-slate-200 bg-slate-100/90 shadow-2xs transition-colors duration-200 ${className}`}
      role="group"
      aria-label="Display theme selection"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = displayMode === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChangeDisplayMode(opt.id)}
            title={`${opt.label} display: ${opt.description}`}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs font-semibold ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 transition-transform ${
                isActive ? `${opt.accentColor} scale-105` : 'text-slate-500'
              }`}
            />
            {showLabels && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
