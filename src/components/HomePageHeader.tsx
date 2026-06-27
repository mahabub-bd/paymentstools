import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BrandLogo } from './BrandLogo';

interface HomePageHeaderProps {
  loaded: boolean;
}

export const HomePageHeader = ({ loaded }: HomePageHeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  const headerVariants = {
    hidden: {
      y: -20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate={loaded ? 'visible' : 'hidden'}
      variants={headerVariants}
      className="glass-header fixed top-0 left-0 right-0 z-50"
    >
      <style>{`
        .glass-header {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

      <div className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-11 items-center transition-transform duration-300 group-hover:scale-[1.02]">
                <BrandLogo className="h-10 w-auto max-w-[190px]" />
              </div>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 shadow-sm transition-all duration-300 group"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <motion.span
                  className="text-xs block"
                  whileHover={{ rotate: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? '🌙' : '☀️'}
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
