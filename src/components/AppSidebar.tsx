import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  shortcut: string;
}

interface CategoryType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface AppSidebarProps {
  isOpen: boolean;
  searchQuery: string;
  collapsedCategories: Set<string>;
  activeMenu: string;
  groupedMenuItems: Record<string, MenuItem[]>;
  toolCategories: Record<string, CategoryType>;
  onToggle: () => void;
  onSearchChange: (value: string) => void;
  onToggleCategory: (id: string) => void;
  onMenuChange: (id: string) => void;
  onToggleDarkMode: () => void;
  onShowShortcuts: () => void;
  darkMode: boolean;
  isMobile?: boolean;
}

export const AppSidebar = ({
  isOpen,
  searchQuery,
  collapsedCategories,
  activeMenu,
  groupedMenuItems,
  toolCategories,
  onToggle,
  onSearchChange,
  onToggleCategory,
  onMenuChange,
  onToggleDarkMode,
  onShowShortcuts,
  darkMode,
  isMobile = false,
}: AppSidebarProps) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const totalVisibleTools = Object.values(groupedMenuItems).reduce((sum, items) => sum + items.length, 0);
  const activeCategoryId = Object.values(groupedMenuItems)
    .flat()
    .find(item => item.id === activeMenu)?.category;

  const categoryAccent: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-violet-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-500',
  };

  const categoryText: Record<string, string> = {
    blue: 'text-blue-700 dark:text-blue-300',
    green: 'text-emerald-700 dark:text-emerald-300',
    purple: 'text-violet-700 dark:text-violet-300',
    amber: 'text-amber-700 dark:text-amber-300',
    slate: 'text-slate-700 dark:text-slate-300',
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    // Prevent body scroll when mobile sidebar is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen, onToggle]);

  // Handle link clicks to close mobile sidebar
  const handleMenuClick = (id: string) => {
    onMenuChange(id);
    if (isMobile) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`${isMobile
          ? `fixed inset-y-0 left-0 z-40 w-[280px] sm:w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `${isOpen ? 'w-[240px] xl:w-72 2xl:w-80' : 'w-16'} h-full relative`
          } bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 ease-in-out flex flex-col shadow-sm overflow-x-clip`}
      >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-200 dark:border-zinc-800 relative">
        {/* Desktop Toggle Button - Hidden on mobile */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className={`absolute ${isOpen ? 'right-2 top-2' : 'right-2 bottom-2'} w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg shadow-blue-500/30 group border border-blue-400/20 dark:border-blue-500/30`}
            aria-label="Toggle sidebar"
            title="Toggle sidebar ([)"
          >
            <svg className={`w-4 h-4 text-white transition-transform duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={onToggle}
            className="absolute right-3 top-3 w-8 h-8 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-300"
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <Link
          to="/"
          className={`flex items-center gap-3 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors ${!isOpen ? 'mx-auto' : ''}`}
          title="Go to home"
        >
          {isOpen ? (
            <>
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">PT</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Payment Tools
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">{totalVisibleTools} tools available</p>
              </div>
            </>
          ) : (
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">PT</span>
            </div>
          )}
        </Link>

        {/* Search Bar */}
        {isOpen && (
          <div className="mt-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">
                {totalVisibleTools} result{totalVisibleTools === 1 ? '' : 's'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {Object.entries(toolCategories).map(([catId, category], catIndex) => {
          const items = groupedMenuItems[catId];
          if (!items || items.length === 0) return null;

          const isCollapsed = !isMobile && collapsedCategories.has(catId);
          const isActiveCategory = activeCategoryId === catId;
          const accent = categoryAccent[category.color] || categoryAccent.slate;
          const textColor = categoryText[category.color] || categoryText.slate;

          return (
            <div key={catId} className="mb-2">
              <button
                onClick={() => !isMobile && onToggleCategory(catId)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${(isOpen || isMobile) ? 'hover:bg-slate-50 dark:hover:bg-zinc-900' : 'justify-center'
                  }`}
                title={category.label}
              >
                <span className={`w-1.5 h-5 rounded-full ${isActiveCategory ? accent : 'bg-slate-200 dark:bg-zinc-800'} ${!(isOpen || isMobile) ? 'hidden' : ''}`} />
                <span className="text-base">{category.icon}</span>
                {(isOpen || isMobile) && (
                  <>
                    <span className={`text-[11px] font-bold uppercase tracking-wide flex-1 text-left ${isActiveCategory ? textColor : 'text-slate-500 dark:text-zinc-500'}`}>
                      {category.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                      {items.length}
                    </span>
                    {!isMobile && (
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </>
                )}
              </button>

              {!isCollapsed && items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors group ${activeMenu === item.id
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-200'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  title={`${item.label} (${item.shortcut})`}
                >
                  {activeMenu === item.id && (
                    <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${accent}`} />
                  )}
                  <span className={`w-8 h-8 rounded-md flex items-center justify-center text-base ${activeMenu === item.id ? 'bg-white dark:bg-zinc-900 shadow-sm' : 'bg-slate-100 dark:bg-zinc-900'
                    }`}>
                    {item.icon}
                  </span>
                  {(isOpen || isMobile) && (
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate">{item.label}</span>
                        {!isMobile && (
                          <kbd className={`ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded ${activeMenu === item.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                            }`}>
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                      <p className="text-[11px] truncate text-slate-400 dark:text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
        {/* Keyboard Shortcuts Button - Hidden on mobile */}
        {!isMobile && (
          <button
            onClick={onShowShortcuts}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 ${!isOpen && 'justify-center'
              }`}
            title="Keyboard shortcuts (?)"
          >
            <span className="text-base">⌨️</span>
            {isOpen && <span className="text-sm font-medium">Shortcuts</span>}
          </button>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${darkMode
            ? 'bg-zinc-800 text-white'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900'
            } ${!isOpen && !isMobile ? 'justify-center' : ''}`}
          title="Toggle dark mode"
        >
          <span className="text-base">{darkMode ? '🌙' : '☀️'}</span>
          {(isOpen || isMobile) && <span className="text-sm font-medium">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        {/* Version Info */}
        {(isOpen || isMobile) && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] text-slate-400 dark:text-zinc-600">v1.0.0</p>
            <a
              href="https://github.com/mahabub-bd/paymentstools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
