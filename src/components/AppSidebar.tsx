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
}: AppSidebarProps) => {
  return (
    <aside
      className={`${isOpen ? 'w-72' : 'w-16'} bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-zinc-800/50 transition-all duration-500 ease-in-out flex flex-col shadow-lg`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200/50 dark:border-zinc-800/50">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-3 animate-fade-in-left">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-bounce-slow">
                <span className="text-white text-sm font-bold">PT</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  Payment Tools
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500">ISO 8583 & EMV Utilities</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:rotate-180"
            aria-label="Toggle sidebar"
            title="Toggle sidebar ([)"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        {isOpen && (
          <div className="mt-4 relative animate-fade-in">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-zinc-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-slate-200 placeholder:text-slate-400 transition-all duration-300 focus:scale-105"
            />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {Object.entries(toolCategories).map(([catId, category], catIndex) => {
          const items = groupedMenuItems[catId];
          if (!items || items.length === 0) return null;

          const isCollapsed = collapsedCategories.has(catId);

          return (
            <div key={catId} className="mb-2 animate-slide-in" style={{ animationDelay: `${Number(catIndex) * 50}ms` }}>
              <button
                onClick={() => onToggleCategory(catId)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300 ${
                  isOpen ? 'hover:bg-slate-100 dark:hover:bg-zinc-800' : 'justify-center'
                }`}
              >
                <span className="text-lg animate-float" style={{ animationDelay: `${catIndex * 100}ms` }}>{category.icon}</span>
                {isOpen && (
                  <>
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex-1 text-left">
                      {category.label}
                    </span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {!isCollapsed && items.map((item, itemIndex) => (
                <button
                  key={item.id}
                  onClick={() => onMenuChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                    activeMenu === item.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-200 hover:scale-102 hover:translate-x-1'
                  }`}
                  title={`${item.label} (${item.shortcut})`}
                  style={{ animationDelay: `${(catIndex * 50) + (itemIndex * 25)}ms` }}
                >
                  <span className="text-xl transition-transform duration-300 group-hover:rotate-12">{item.icon}</span>
                  {isOpen && (
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.label}</span>
                        <kbd className="hidden group-hover:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-slate-400 animate-scale-in">
                          {item.shortcut}
                        </kbd>
                      </div>
                      <p className={`text-[10px] truncate transition-opacity duration-300 ${activeMenu === item.id ? 'text-blue-100' : 'text-slate-400 dark:text-zinc-500'}`}>
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
      <div className="p-4 border-t border-slate-200/50 dark:border-zinc-800/50 space-y-2">
        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onShowShortcuts}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:scale-105 ${
            !isOpen && 'justify-center'
          }`}
          title="Keyboard shortcuts (?)"
        >
          <span className="text-xl animate-pulse-slow">⌨️</span>
          {isOpen && <span className="text-sm">Shortcuts</span>}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500 ${
            darkMode
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:scale-105'
          } ${!isOpen && 'justify-center'}`}
          title="Toggle dark mode"
        >
          <span className={`text-xl transition-transform duration-500 ${darkMode ? 'animate-spin-slow' : ''}`}>{darkMode ? '🌙' : '☀️'}</span>
          {isOpen && <span className="text-sm font-medium">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        {/* Version Info */}
        {isOpen && (
          <div className="flex items-center justify-between pt-2 animate-fade-in">
            <p className="text-[10px] text-slate-400 dark:text-zinc-600">v1.0.0</p>
            <a
              href="https://github.com/mahabub-bd/paymentstools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors hover:scale-110 inline-block"
            >
              GitHub
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};
