import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Layers, GitBranch, Database, History, 
  BarChart3, Sparkles, Cloud, Info, ChevronLeft, ChevronRight, 
  Menu, X, Dna, Activity, Sun, Moon, ShieldCheck, Lock, Mail
} from 'lucide-react';
import { AwsConfig, DisplayMode } from '../../types/bio';
import { DisplayThemeSwitch } from '../DisplayThemeSwitch';

export interface DashboardLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  historyCount: number;
  awsConfig: AwsConfig;
  onOpenAwsConfig: () => void;
  displayMode: DisplayMode;
  onChangeDisplayMode: (mode: DisplayMode) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentPage,
  onNavigate,
  historyCount,
  awsConfig,
  onOpenAwsConfig,
  displayMode,
  onChangeDisplayMode,
  children
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sequencestream_sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sequencestream_sidebar_collapsed', String(next));
  };

  // Close mobile drawer on navigation
  const handleNavClick = (page: string) => {
    onNavigate(page);
    setIsMobileOpen(false);
  };

  const navItems = [
    {
      id: 'home',
      label: 'Overview',
      icon: LayoutDashboard,
      active: currentPage === 'home'
    },
    {
      id: 'tools',
      label: 'Analysis Tools',
      icon: Layers,
      active: currentPage === 'tools' || currentPage === 'analyze'
    },
    {
      id: 'workflows',
      label: 'Bioinformatics Workflows',
      icon: GitBranch,
      active: currentPage === 'workflow' || currentPage === 'workflows'
    },
    {
      id: 'databases',
      label: 'Databases',
      icon: Database,
      active: currentPage === 'database' || currentPage === 'databases'
    },
    {
      id: 'history',
      label: 'Projects & History',
      icon: History,
      active: currentPage === 'history',
      badge: historyCount > 0 ? historyCount : undefined
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      active: currentPage === 'dashboard' || currentPage === 'reports' || currentPage === 'results'
    }
  ];

  const secondaryNav = [
    {
      id: 'alignment',
      label: 'Sequence Alignment',
      icon: Activity,
      active: currentPage === 'alignment'
    },
    {
      id: 'gmail',
      label: 'Research Mail (Gmail)',
      icon: Mail,
      active: currentPage === 'gmail'
    },
    {
      id: 'ai-assistant',
      label: 'AI Research Assistant',
      icon: Sparkles,
      active: currentPage === 'ai-assistant'
    },
    {
      id: 'about',
      label: 'Documentation & About',
      icon: Info,
      active: currentPage === 'about'
    }
  ];

  // Helper for current page display title
  const getPageTitle = () => {
    switch (currentPage) {
      case 'home': return 'Overview';
      case 'tools': return 'Analysis Tools Directory';
      case 'analyze': return 'Sequence Analysis Workbench';
      case 'alignment': return 'Sequence Alignment (Dynamic Programming)';
      case 'workflow':
      case 'workflows': return 'Bioinformatics Workflows';
      case 'database':
      case 'databases': return 'Databases & Homology Search';
      case 'history': return 'Projects & Analysis History';
      case 'dashboard':
      case 'reports': return 'Research Reports & Data Export';
      case 'results': return 'Analysis Results';
      case 'gmail': return 'Gmail Research Hub';
      case 'ai-assistant': return 'AI Research Assistant';
      case 'about': return 'Platform Documentation';
      default: return 'SequenceStream';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* =========================================================================
          MAIN CONTENT AREA (Left & Center)
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        {/* Subtle Top Status Bar for Desktop */}
        <header className="hidden md:flex h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {getPageTitle()}
            </h2>
            <span className="text-xs text-slate-400 font-mono">/</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Biomedical Research Platform
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNavClick('gmail')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentPage === 'gmail'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
              }`}
              title="Open Gmail Research Hub"
            >
              <Mail className={`w-3.5 h-3.5 ${currentPage === 'gmail' ? 'text-white' : 'text-blue-600'}`} />
              <span>Gmail Hub</span>
            </button>

            <button
              type="button"
              onClick={onOpenAwsConfig}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-amber-500" />
              <span>{awsConfig.region === 'us-east-1' ? 'ap-south-1' : (awsConfig.region || 'ap-south-1')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('tools')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Tools Directory
            </button>
          </div>
        </header>

        {/* Dynamic Page Children */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* =========================================================================
          DESKTOP COLLAPSIBLE SIDEBAR (Right Side)
          ========================================================================= */}
      <aside 
        className={`hidden md:flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen z-30 transition-all duration-300 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => handleNavClick('home')}
            className={`flex items-center gap-3 text-left focus:outline-none cursor-pointer overflow-hidden ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
            title="SequenceStream Overview"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Dna className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                  SequenceStream
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Bioinformatics SaaS
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Main Navigation
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    item.active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.active ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary Navigation */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tools &amp; Assistance
              </div>
            )}
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    item.active
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200/50 dark:border-blue-800/50'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}

            {/* AWS Cloud Parameters Trigger - Owner Protected */}
            <button
              onClick={onOpenAwsConfig}
              title={isCollapsed ? 'Cloud Infrastructure (Owner: Muhammad Shoaib)' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <Cloud className="w-4 h-4 shrink-0 text-amber-500" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5">
                    <span>Cloud Config</span>
                    <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Theme Toggle & Right-Side Collapse Button */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 py-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Theme
              </span>
              <DisplayThemeSwitch
                displayMode={displayMode}
                onChangeDisplayMode={onChangeDisplayMode}
                showLabels={false}
              />
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[11px] font-semibold">Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOPBAR & RIGHT-SIDE DRAWER
          ========================================================================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-40">
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Dna className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            SequenceStream
          </span>
        </button>

        <div className="flex items-center gap-2">
          <DisplayThemeSwitch
            displayMode={displayMode}
            onChangeDisplayMode={onChangeDisplayMode}
            showLabels={false}
          />
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay (Right-aligned) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
          <div className="w-72 bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Dna className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">SequenceStream</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Links */}
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Main Navigation
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        item.active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Secondary */}
              <div className="space-y-1 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tools &amp; Assistance
                </div>
                {secondaryNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  onOpenAwsConfig();
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-amber-500" />
                  <span>Cloud Architecture</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
