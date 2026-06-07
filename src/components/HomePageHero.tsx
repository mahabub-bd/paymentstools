import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';

interface HomePageHeroProps {
  loaded: boolean;
}

export const HomePageHero = ({ loaded }: HomePageHeroProps) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float-up {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        @keyframes shimmer-text {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .animate-float-up {
          animation: float-up 0.8s ease forwards;
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }
        .shimmer-text {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer-text 3s infinite;
        }
      `}</style>

      <div className="relative py-6 sm:py-8">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse-ring" />
          <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl animate-pulse-ring" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Hero Content */}
          <div className={`text-center transition-all duration-700 ${loaded && mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-700/50 shadow-md mb-4 animate-float-up">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">25+ Tools</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900 dark:from-white dark:via-blue-400 dark:to-white bg-clip-text text-transparent animate-gradient-shift">
                Payment Tools
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-5">
              ISO 8583, EMV, PIN blocks & more — all in one place
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <Link
                to="/app/bitmap"
                className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105 overflow-hidden text-sm"
              >
                <span className="absolute inset-0 shimmer-text rounded-lg" />
                <span className="relative flex items-center gap-1.5">
                  Launch App
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              <a
                href="https://github.com/mahabub-bd/paymentstools"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-medium rounded-lg shadow-md hover:shadow-lg border border-slate-200 dark:border-zinc-800 transition-all duration-300 hover:scale-105 flex items-center gap-1.5 text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: '📡', label: 'ISO' },
                { icon: '💳', label: 'EMV' },
                { icon: '🔐', label: 'PIN' },
                { icon: '📚', label: 'Ref' },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-700/50 hover:bg-white/50 dark:hover:bg-zinc-900/50 transition-all duration-300"
                >
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
