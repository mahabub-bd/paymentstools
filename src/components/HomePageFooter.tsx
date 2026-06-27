import { motion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';

interface HomePageFooterProps {
  loaded: boolean;
}

export const HomePageFooter = ({ loaded }: HomePageFooterProps) => {
  const currentYear = new Date().getFullYear();

  const footerVariants = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <>
      <style>{`
        @keyframes footer-slide {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-footer-slide {
          animation: footer-slide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <motion.footer
        initial="hidden"
        animate={loaded ? 'visible' : 'hidden'}
        variants={footerVariants}
        className="border-t border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4">
          <motion.div
            variants={contentVariants}
            className="flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            {/* Logo & Brand */}
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <BrandLogo className="h-9 w-auto max-w-[170px]" />
            </motion.div>

            {/* Right side links */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <motion.a
                href="https://github.com/mahabub-bd/paymentstools"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </motion.a>
              <span className="text-xs text-slate-400">•</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">© {currentYear}</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.footer>
    </>
  );
};
