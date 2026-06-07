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
        @keyframes header-slide {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-header-slide {
          animation: header-slide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glass-header {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

      <div className={`glass-header fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-2">
            <div className="flex items-center justify-between gap-3">
              {/* Logo & Brand */}
              <Link to="/" className="flex items-center gap-2 group">
                <div className="relative w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-all duration-300 group-hover:scale-105">
                  <span className="text-white text-xs font-bold">PT</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white">Payment Tools</h1>
                </div>
              </Link>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {/* Launch Button */}
                <Link
                  to="/app/bitmap"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-300 hover:scale-105"
                >
                  <span>Launch</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 shadow-sm transition-all duration-300 hover:scale-110 group"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  <span className="text-xs block transition-transform duration-300 group-hover:rotate-12">
                    {theme === 'dark' ? '🌙' : '☀️'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
