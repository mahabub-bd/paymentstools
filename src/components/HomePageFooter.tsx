interface HomePageFooterProps {
  loaded: boolean;
}

export const HomePageFooter = ({ loaded }: HomePageFooterProps) => {
  return (
    <footer className={`border-t border-slate-200 dark:border-zinc-800 py-2 sm:py-2.5 transition-all duration-700 delay-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2">
        <p className="text-[9px] sm:text-[10px] lg:text-[10px] text-slate-500 dark:text-slate-400">© 2026 Payment Tools</p>
        <a
          href="https://github.com/mahabub-bd/paymentstools"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] sm:text-[10px] lg:text-[10px] text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 transition-colors hover:underline hover:scale-105 inline-block"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
};
