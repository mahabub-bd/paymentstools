interface CategoryType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface ToolCategories {
  [key: string]: CategoryType;
}

interface AppHeaderProps {
  activeItem?: { label: string; description: string; category: string; icon: string } | null;
  getCategoryColor: (color: string) => string;
  toolCategories: ToolCategories;
  onShortcutsClick: () => void;
  onMobileMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export const AppHeader = ({ activeItem, getCategoryColor, toolCategories, onShortcutsClick, onMobileMenuClick, showMobileMenu }: AppHeaderProps) => {
  return (
    <header className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-10 transition-all duration-300">
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            {onMobileMenuClick && (
              <button
                onClick={onMobileMenuClick}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-300 text-slate-600 dark:text-slate-400 flex-shrink-0"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl text-white shadow-lg transition-all duration-500 flex-shrink-0 ${getCategoryColor((toolCategories as Record<string, { color: string }>)[activeItem?.category || 'utilities']?.color || 'slate')}`}>
              {activeItem?.icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white truncate">
                {activeItem?.label || 'Payment Tools'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 truncate hidden xs:block">{activeItem?.description}</p>
            </div>
          </div>
          <button
            onClick={onShortcutsClick}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-300 text-slate-400 hover:scale-110 hover:rotate-12 flex-shrink-0"
            title="Keyboard shortcuts (?)"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
