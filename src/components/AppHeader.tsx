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
}

export const AppHeader = ({ activeItem, getCategoryColor, toolCategories, onShortcutsClick }: AppHeaderProps) => {
  return (
    <header className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-10 transition-all duration-300">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl text-white shadow-lg transition-all duration-500 ${getCategoryColor((toolCategories as Record<string, { color: string }>)[activeItem?.category || 'utilities']?.color || 'slate')}`}>
              {activeItem?.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {activeItem?.label || 'Payment Tools'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-500">{activeItem?.description}</p>
            </div>
          </div>
          <button
            onClick={onShortcutsClick}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-300 text-slate-400 hover:scale-110 hover:rotate-12"
            title="Keyboard shortcuts (?)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
