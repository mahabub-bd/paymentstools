export const HomePageDecorations = ({ loaded }: { loaded: boolean }) => {
  return (
    <>
      <style>{`
        @keyframes float-decoration {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.02); }
        }
        .animate-float-decoration {
          animation: float-decoration 8s ease-in-out infinite;
        }
        .animate-pulse-soft {
          animation: pulse-soft 4s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle decorative elements */}
      <div className={`fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top left accent */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-full blur-2xl animate-pulse-soft" />

        {/* Bottom right accent */}
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-tl from-emerald-500/10 to-blue-500/10 rounded-full blur-2xl animate-pulse-soft" style={{ animationDelay: '2s' }} />

        {/* Floating payment icons - more subtle */}
        <div className="fixed left-[8%] top-[25%] hidden lg:block animate-float-decoration opacity-20">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600 dark:text-blue-400">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
        </div>

        <div className="fixed right-[10%] bottom-[30%] hidden lg:block animate-float-decoration opacity-20" style={{ animationDelay: '1s' }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" className="text-violet-600 dark:text-violet-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>

        <div className="fixed right-[15%] top-[20%] hidden lg:block animate-float-decoration opacity-20" style={{ animationDelay: '2s' }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600 dark:text-emerald-400">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
      </div>
    </>
  );
};
