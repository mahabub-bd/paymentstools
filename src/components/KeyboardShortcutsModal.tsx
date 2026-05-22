interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  shortcut: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

export const KeyboardShortcutsModal = ({ isOpen, onClose, menuItems }: KeyboardShortcutsModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Keyboard Shortcuts</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:rotate-90"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Navigation</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Toggle sidebar</span>
                  <kbd className="px-2 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">[</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Show shortcuts</span>
                  <kbd className="px-2 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">?</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Close modal</span>
                  <kbd className="px-2 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">Esc</kbd>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                {menuItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all duration-300 hover:scale-105"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate" title={item.description}>
                      {item.icon} {item.label}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-mono rounded bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400">
                      {item.shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
