import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface HomePageHeaderProps {
  loaded: boolean;
  totalVisibleTools: number;
}

export const HomePageHeader = ({ loaded, totalVisibleTools }: HomePageHeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
      `}</style>

      <div className={`max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30 animate-bounce-subtle flex-shrink-0">
              <span className="text-white text-xs sm:text-sm lg:text-base font-bold">PT</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white truncate">Payment Tools</h1>
              <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 truncate hidden xs:block">Payment Industry Developer Tools</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/app/bitmap"
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs lg:text-sm font-medium rounded-lg shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-600/40"
            >
              <span className="hidden sm:inline">Launch App</span>
              <span className="sm:hidden">Launch</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-12"
              title="Toggle dark mode"
            >
              <span className="text-xs sm:text-sm lg:text-base">{theme === 'dark' ? '🌙' : '☀️'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
